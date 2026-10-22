// Lab 3.03 — Slides 14–17: PostgreSQL has no clustered index. Rows live in a heap and every index, the primary key
// included, stores the row's physical address (TID = ctid = block, offset): exactly the "disk address" slide 17 avoids.
// A. UPDATE writes a new row version with a new ctid. On a full page (fillfactor 100) the new version lands on another
//    block, so it is not HOT and the primary key gets a second entry; the old one stays until VACUUM.
// B. HOT (heap-only tuple): when the page has room (fillfactor 90) and no indexed column changes, the new version stays
//    on the same page and no index is written. Changing an indexed column: 0% HOT, one more WAL record per index.
// C. CLUSTER sorts the heap once by an index: one category's rows go from ~900 blocks to ~20. New rows are appended in
//    arrival order and pg_stats.correlation decays: Postgres does not keep the table clustered.
// Scratch tables l03_* only (dropped at start and at the end). Autovacuum is off on them, so nothing prunes or
// analyzes behind our back and every run prints the same numbers.
import { connect, measure, relBytes, printTable, heading, verdict, fmtBytes, fmtInt } from './pg-explain-kit.mjs';

const client = await connect();
const SCRATCH = 'l03_users, l03_hot, l03_cluster';
const blockOf = (tid) => Number(tid.slice(1, tid.indexOf(',')));
// pageinspect shows an int8 key as its 8 bytes, little-endian, in hex: 42 -> '2a 00 00 00 00 00 00 00'.
const keyHex = (n) => {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(BigInt(n));
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join(' ');
};

async function tx(fn) {
  await client.query('BEGIN');
  try {
    const result = await fn();
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// This backend's update / HOT-update counters for a table. Read before and after a statement inside one transaction:
// the counters are not flushed mid-transaction, so the difference belongs to that statement alone.
async function updateCounters(table) {
  const { rows: [r] } = await client.query(
    'SELECT pg_stat_get_xact_tuples_updated($1::regclass) AS upd, pg_stat_get_xact_tuples_hot_updated($1::regclass) AS hot',
    [table],
  );
  return { upd: Number(r.upd), hot: Number(r.hot) };
}

// Runs a statement under EXPLAIN (ANALYZE, WAL): WAL written by this statement only, not by other sessions.
async function runCountingWal(sql) {
  const { rows } = await client.query(`EXPLAIN (ANALYZE, WAL, TIMING OFF, FORMAT JSON) ${sql}`);
  const { Plan: p, 'Execution Time': ms } = rows[0]['QUERY PLAN'][0];
  return { ms, walBytes: p['WAL Bytes'], walRecords: p['WAL Records'], fpi: p['WAL FPI'] };
}

// Heap TIDs stored in the index = TIDs in all leaf items, skipping each leaf's high key (item 1 on every leaf but the
// right-most). A deduplicated item (posting list) holds several TIDs in `tids`; a plain item holds one.
async function leafTids(index) {
  const { rows: [r] } = await client.query(
    `SELECT sum(coalesce(cardinality(i.tids), 1))::bigint AS n
       FROM generate_series(1, pg_relation_size($1::text::regclass) / 8192 - 1) b,
            bt_page_stats($1::text, b) s, bt_page_items($1::text, b) i
      WHERE s.type = 'l' AND NOT (s.btpo_next <> 0 AND i.itemoffset = 1)`,
    [index],
  );
  return Number(r.n);
}

async function partA() {
  heading('A. UPDATE ghi một phiên bản dòng mới → ctid (địa chỉ vật lý) đổi');
  await client.query(
    'CREATE TABLE l03_users WITH (autovacuum_enabled = off) AS SELECT id, email, age FROM users WHERE id <= 10000 ORDER BY id');
  await client.query('ALTER TABLE l03_users ADD PRIMARY KEY (id)');
  const { before, after, hot } = await tx(async () => {
    const { rows: [b] } = await client.query('SELECT ctid::text AS ctid FROM l03_users WHERE id = 42');
    const c0 = await updateCounters('l03_users');
    const { rows: [a] } = await client.query('UPDATE l03_users SET age = age + 1 WHERE id = 42 RETURNING ctid::text AS ctid');
    const c1 = await updateCounters('l03_users');
    return { before: b.ctid, after: a.ctid, hot: c1.hot - c0.hot };
  });
  // Every TID the primary key now holds for id = 42 (all leaf pages, read with pageinspect).
  const { rows: tids } = await client.query(
    `SELECT i.htid::text AS htid
       FROM generate_series(1, pg_relation_size('l03_users_pkey') / 8192 - 1) b, bt_page_items('l03_users_pkey', b) i
      WHERE i.htid IS NOT NULL AND i.data = $1 ORDER BY b, i.itemoffset`,
    [keyHex(42)],
  );
  console.log(`id = 42: ctid ${before} → ${after} (UPDATE … RETURNING ctid), số HOT update = ${hot}`);
  console.log(`l03_users_pkey giờ có ${tids.length} mục cho id = 42: ${tids.map((t) => t.htid).join(' và ')}`);
  verdict(after !== before, 'ctid đổi sau UPDATE: địa chỉ vật lý của một dòng không cố định — đúng điều slide 17 lo ngại');
  verdict(blockOf(after) !== blockOf(before) && hot === 0 && tids.length === 2,
    `Trang ${blockOf(before)} đã đầy (fillfactor 100) → bản mới sang block ${blockOf(after)}, không HOT: ` +
    `khóa chính phải thêm mục mới, mục cũ ${before} nằm lại chờ VACUUM`);
}

async function partB() {
  heading('B. HOT update: trang còn chỗ (fillfactor 90) + không đổi cột có index → không ghi index nào');
  // After a checkpoint, the first change to any page that existed before it writes a full 8 KB page image to WAL.
  // Checkpointing first and creating the tables afterwards keeps those images out of the WAL numbers below.
  await client.query('CHECKPOINT');
  const runs = [];
  for (const [label, set] of [['v (không có index)', 'v = v + 1'], ['k (có index)', 'k = k + 1']]) {
    // A fresh table per run: no dead versions from the other run, so page pruning cannot change the numbers.
    await client.query('DROP TABLE IF EXISTS l03_hot');
    await client.query(
      'CREATE TABLE l03_hot (id bigint, k int, v int, pad text) WITH (fillfactor = 90, autovacuum_enabled = off)');
    await client.query("INSERT INTO l03_hot SELECT g, h(g, 41), 0, repeat('x', 20) FROM generate_series(1, 100000) g");
    await client.query('CREATE INDEX l03_hot_k_idx ON l03_hot (k)');
    const entries0 = await leafTids('l03_hot_k_idx');
    const size0 = await relBytes(client, 'l03_hot_k_idx');
    const ctidOf20 = async () => (await client.query('SELECT ctid::text AS c FROM l03_hot WHERE id = 20')).rows[0].c;
    const ctid0 = await ctidOf20();
    // 5% of the rows, spread evenly: about 5 new versions per page, which fit in the 10% left free by fillfactor 90.
    const r = await tx(async () => {
      const c0 = await updateCounters('l03_hot');
      const w = await runCountingWal(`UPDATE l03_hot SET ${set} WHERE id % 20 = 0`);
      const c1 = await updateCounters('l03_hot');
      return { ...w, upd: c1.upd - c0.upd, hot: c1.hot - c0.hot };
    });
    runs.push({ label, ...r, ctid: `${ctid0} → ${await ctidOf20()}`, entries0, entries1: await leafTids('l03_hot_k_idx'),
      size0, size1: await relBytes(client, 'l03_hot_k_idx') });
  }
  printTable(runs, [
    ['UPDATE 5,000 dòng, đổi cột', (x) => x.label],
    ['HOT', (x) => `${fmtInt(x.hot)}/${fmtInt(x.upd)}`, 'right'],
    ['ctid của id = 20', (x) => x.ctid],
    ['Bản ghi WAL', (x) => fmtInt(x.walRecords), 'right'],
    ['WAL', (x) => fmtBytes(x.walBytes), 'right'],
    ['TID trong index k', (x) => `${fmtInt(x.entries0)} → ${fmtInt(x.entries1)}`, 'right'],
    ['Index k', (x) => `${fmtBytes(x.size0)} → ${fmtBytes(x.size1)}`, 'right'],
  ]);
  const [hotRun, idxRun] = runs;
  const added = idxRun.entries1 - idxRun.entries0;
  if (hotRun.fpi + idxRun.fpi > 0) console.log(`   (Có ${hotRun.fpi + idxRun.fpi} full-page image do checkpoint chen giữa: WAL bị đội lên)`);
  verdict(hotRun.hot === hotRun.upd && hotRun.entries1 === hotRun.entries0 && idxRun.hot === 0,
    `Đổi v: ${Math.round((100 * hotRun.hot) / hotRun.upd)}% HOT, index k không thêm TID nào; đổi k: 0% HOT ` +
    '(ctid đổi trong cả hai trường hợp, nhưng HOT giữ bản mới cùng trang nên index vẫn trỏ được qua chuỗi HOT)');
  verdict(idxRun.walBytes > hotRun.walBytes && added === idxRun.upd,
    `Không HOT: WAL ×${(idxRun.walBytes / hotRun.walBytes).toFixed(1)} (${fmtInt(idxRun.walRecords)} vs ${fmtInt(hotRun.walRecords)} bản ghi) ` +
    `và index k thêm ${fmtInt(added)} TID; kích thước index ${idxRun.size1 > idxRun.size0 ? 'tăng' : 'chưa đổi vì lá còn 10% chỗ trống'}` +
    ' — bảng có N index thì mỗi UPDATE không HOT ghi N mục');
}

async function partC() {
  heading('C. CLUSTER sắp xếp heap theo index MỘT LẦN — không được duy trì khi có dòng mới');
  await client.query('CREATE TABLE l03_cluster (id bigint, category int, pad text) WITH (autovacuum_enabled = off)');
  // Statistics target 10000 makes ANALYZE read every row instead of a random sample: same correlation on every run.
  await client.query('ALTER TABLE l03_cluster ALTER category SET STATISTICS 10000');
  // 200 categories (~0.5% each), rows arriving in random order, ~56 rows per 8 KB page.
  const insert = (from, to) => client.query(
    `INSERT INTO l03_cluster SELECT g, h(g, 31) % 200, repeat('x', 100) FROM generate_series(${from}, ${to}) g ORDER BY h(g, 32)`);
  await insert(1, 200000);
  await client.query('CREATE INDEX l03_cluster_category_idx ON l03_cluster (category)');
  const snapshot = async (label) => {
    await client.query('ANALYZE l03_cluster');
    const m = await measure(client, 'SELECT * FROM l03_cluster WHERE category = 42');
    // Distinct heap blocks holding the rows: the number a Bitmap Heap Scan prints as "Heap Blocks: exact".
    const { rows: [r] } = await client.query(
      `SELECT (SELECT count(DISTINCT (ctid::text::point)[0]) FROM l03_cluster WHERE category = 42) AS blocks,
              (SELECT correlation FROM pg_stats WHERE schemaname = 'lab03_indexing' AND tablename = 'l03_cluster'
                  AND attname = 'category') AS corr`);
    return { label, m, blocks: Number(r.blocks), corr: Number(r.corr) };
  };
  const snaps = [await snapshot('Trước CLUSTER (dòng đến ngẫu nhiên)')];
  await client.query('CLUSTER l03_cluster USING l03_cluster_category_idx');
  snaps.push(await snapshot('Sau CLUSTER + ANALYZE'));
  await insert(200001, 220000);
  snaps.push(await snapshot('Sau khi chèn thêm 20,000 dòng'));
  printTable(snaps, [
    ['Thời điểm', (s) => s.label],
    ['Kế hoạch (category = 42)', (s) => s.m.plan],
    ['Dòng', (s) => fmtInt(s.m.rows), 'right'],
    ['Block heap', (s) => fmtInt(s.blocks), 'right'],
    ['Trang', (s) => fmtInt(s.m.pages), 'right'],
    ['correlation', (s) => s.corr.toFixed(2), 'right'],
  ]);
  const [before, clustered, later] = snaps;
  verdict(clustered.blocks * 10 < before.blocks && clustered.m.pages * 10 < before.m.pages,
    `CLUSTER gom ${fmtInt(clustered.m.rows)} dòng từ ${fmtInt(before.blocks)} block về ${clustered.blocks} block: ` +
    `đọc ${fmtInt(before.m.pages)} → ${clustered.m.pages} trang`);
  verdict(later.corr < clustered.corr && later.blocks > clustered.blocks,
    `Thêm 10% dòng: correlation ${clustered.corr.toFixed(2)} → ${later.corr.toFixed(2)}, block ${clustered.blocks} → ${later.blocks}. ` +
    'CLUSTER không tự duy trì; muốn gom lại phải CLUSTER lần nữa (khóa ACCESS EXCLUSIVE cả bảng)');
}

console.log('Lab 3.03 — PostgreSQL: heap + TID, HOT update và CLUSTER chỉ một lần (slide 14–17)');
try {
  await client.query(`DROP TABLE IF EXISTS ${SCRATCH}`);
  await partA();
  await partB();
  await partC();
} catch (err) {
  console.error(`Lab dừng vì lỗi: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.query(`DROP TABLE IF EXISTS ${SCRATCH}`).catch(() => {});
  await client.end();
}
