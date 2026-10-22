// Lab 3.02 — Slides 8–12, 38: what one B+tree lookup really costs in PostgreSQL, counted in 8 KB pages.
// A. A lookup reads one index page per tree level + 1 heap page. lab_imdb.titles has ~13x the rows of users, but
//    its primary key is only one level taller: one extra page. (lab_imdb is only read: bt_metap, sizes, one EXPLAIN.)
// B. Leaves are linked left to right, so 1,000 consecutive ids cost a handful of pages, while 1,000 scattered ids
//    cost one full root-to-leaf descent each.
// C. pageinspect opens the real pages: the root holds separator keys + child page numbers (no row data), a leaf
//    holds key + heap TID (= the row's ctid), and each leaf points to its right neighbour (btpo_next).
// D. Inside BEGIN ... ROLLBACK: a hash index answers "=" in fewer pages but can serve neither a range nor ORDER BY.
//    Base tables are never written; the extra indexes and the dropped constraint vanish with the rollback.
import {
  connect, measure, inRollback, relBytes, printTable, printMeasurements, heading, verdict, fmtBytes, fmtInt,
} from './pg-explain-kit.mjs';

const client = await connect();
const fmtSec = (ms) => `${(ms / 1000).toFixed(1)} s`;

async function partA() {
  heading('A. Tra 1 dòng theo khóa chính: users vs lab_imdb.titles (nhiều dòng hơn ~13 lần)');
  const trees = [];
  for (const [index, table] of [
    ['users_pkey', 'users'], ['lab_imdb.titles_pkey', 'lab_imdb.titles'], ['lab_imdb.ratings_pkey', 'lab_imdb.ratings'],
  ]) {
    // bt_metap reads only the index metapage; reltuples is the row count stored in the catalog by the last ANALYZE.
    const { rows: [r] } = await client.query(
      'SELECT m.level, c.reltuples::bigint AS n FROM bt_metap($1) m, pg_class c WHERE c.oid = $2::regclass',
      [index, table],
    );
    trees.push({ index, n: Number(r.n), levels: Number(r.level) + 1, bytes: await relBytes(client, index) });
  }
  printTable(trees, [
    ['Index', (t) => t.index],
    ['Số dòng', (t) => fmtInt(t.n), 'right'],
    ['Số tầng', (t) => t.levels, 'right'],
    ['Kích thước', (t) => fmtBytes(t.bytes), 'right'],
  ]);
  const users = await measure(client, 'SELECT * FROM users WHERE id = 777777');
  const titles = await measure(client, "SELECT * FROM lab_imdb.titles WHERE tconst = 'tt0111161'");
  const seq = await measure(client, "SELECT * FROM users WHERE code = '777777'");
  console.log();
  printMeasurements([
    { label: 'users: id = 777777', m: users },
    { label: "titles: tconst = 'tt0111161'", m: titles },
    { label: "users: code = '777777' (không index)", m: seq },
  ]);
  const [u, t] = trees;
  verdict(users.pages === u.levels + 1 && titles.pages === t.levels + 1,
    `Mỗi lần tra = số tầng + 1 trang heap: users ${u.levels} + 1 = ${users.pages}, titles ${t.levels} + 1 = ${titles.pages}`);
  verdict(titles.pages - users.pages <= 1,
    `Nhiều dòng hơn ${(t.n / u.n).toFixed(1)}× nhưng chỉ đọc thêm ${titles.pages - users.pages} trang: chiều cao cây tăng theo log(số dòng)`);
  verdict(seq.pages > 100 * users.pages,
    `Không có index: Seq Scan đọc ${fmtInt(seq.pages)} trang = ${fmtInt(Math.round(seq.pages / users.pages))}× so với tra qua index`);
  return users.pages;
}

async function partB() {
  heading('B. Dải liên tiếp vs id rải rác: cùng 1,000 dòng, số trang rất khác');
  const scatteredIds = Array.from({ length: 1000 }, (_, i) => i * 1000 + 7); // deterministic, one id per 1,000
  const range = await measure(client, 'SELECT * FROM users WHERE id BETWEEN 500000 AND 500999');
  const scattered = await measure(client, `SELECT * FROM users WHERE id = ANY('{${scatteredIds}}'::bigint[])`);
  printMeasurements([
    { label: 'id BETWEEN 500000 AND 500999', m: range },
    { label: 'id = ANY(1,000 id cách nhau 1,000)', m: scattered },
  ]);
  verdict(range.rows === scattered.rows && scattered.pages >= 10 * range.pages,
    `Cùng ${fmtInt(range.rows)} dòng: dải liên tiếp ${range.pages} trang (xuống lá 1 lần rồi đi sang phải), ` +
    `rải rác ${fmtInt(scattered.pages)} trang ≈ ${(scattered.pages / scattered.rows).toFixed(1)} trang/id (mỗi id đi lại từ gốc)`);
}

async function partC(lookupPages) {
  heading('C. Bên trong trang B+tree (pageinspect): gốc = khóa phân cách + trang con, lá = khóa + TID heap');
  const TARGET = 777777n;
  // int8 keys are stored little-endian; an empty key is the "minus infinity" downlink at the start of an inner page.
  const keyOf = (data) => (data ? BigInt(`0x${data.split(' ').reverse().join('')}`) : null);
  const blockOf = (tid) => Number(tid.slice(1, tid.indexOf(',')));
  const readPage = async (blk) => {
    const { rows: [st] } = await client.query('SELECT type, btpo_next FROM bt_page_stats($1, $2)', ['users_pkey', blk]);
    const { rows } = await client.query(
      'SELECT ctid::text AS ctid, data, htid::text AS htid FROM bt_page_items($1, $2) ORDER BY itemoffset', ['users_pkey', blk]);
    // Every page except the right-most of its level starts with a "high key" (the page's upper bound), not an entry.
    const next = Number(st.btpo_next);
    return { blk, type: st.type, next, entries: next === 0 ? rows : rows.slice(1) };
  };
  const { rows: [meta] } = await client.query("SELECT root FROM bt_metap('users_pkey')");
  const path = [await readPage(Number(meta.root))];
  while (path.at(-1).type !== 'l') {
    // Follow the last downlink whose separator key is <= the key we are looking for.
    const down = path.at(-1).entries.filter((e) => keyOf(e.data) === null || keyOf(e.data) <= TARGET).at(-1);
    path.push(await readPage(blockOf(down.ctid)));
  }
  const root = path[0];
  const leaf = path.at(-1);
  const hit = leaf.entries.findIndex((e) => keyOf(e.data) === TARGET);
  const { rows: [real] } = await client.query('SELECT ctid::text AS ctid FROM users WHERE id = $1', [TARGET.toString()]);
  const right = await readPage(leaf.next);
  const lastHere = keyOf(leaf.entries.at(-1).data);
  const firstThere = keyOf(right.entries[0].data);
  const show = (e, arrow) => `[${keyOf(e.data) === null ? '−∞' : fmtInt(keyOf(e.data))} → ${arrow(e)}]`;

  console.log(`Gốc (trang ${root.blk}, ${root.entries.length} mục): ` +
    `${root.entries.slice(0, 4).map((e) => show(e, (x) => `trang ${blockOf(x.ctid)}`)).join(' ')} …`);
  console.log(`Lá (trang ${leaf.blk}, ${leaf.entries.length} khóa): … ` +
    `${leaf.entries.slice(hit - 1, hit + 2).map((e) => show(e, (x) => `heap ${x.htid}`)).join(' ')} …`);
  console.log(`Đường đi tìm id = ${fmtInt(TARGET)}: ` +
    `${path.map((p) => (p === root ? `gốc ${p.blk}` : p.type === 'l' ? `lá ${p.blk}` : `trang ${p.blk}`)).join(' → ')} → heap ${leaf.entries[hit].htid}`);
  console.log(`Lá ${leaf.blk} --btpo_next--> lá ${right.blk}: khóa cuối bên này ${fmtInt(lastHere)}, khóa đầu bên kia ${fmtInt(firstThere)}`);

  verdict(root.entries.every((e) => e.htid === null),
    'Mục ở gốc chỉ có khóa + số trang con, không có TID heap: dữ liệu chỉ nằm ở lá (B+tree, slide 10)');
  verdict(leaf.entries[hit].htid === real.ctid,
    `TID trong lá = ctid thật của dòng = ${real.ctid}: index PostgreSQL trỏ thẳng tới địa chỉ vật lý (block, offset)`);
  verdict(path.length + 1 === lookupPages,
    `${path.length} trang index (gốc → lá) + 1 trang heap = ${path.length + 1}, khớp ${lookupPages} trang EXPLAIN đếm ở phần A`);
  verdict(right.type === 'l' && firstThere > lastHere,
    'Các lá nối nhau theo thứ tự khóa: quét dải chỉ việc đi sang phải, không quay lại gốc (vì vậy phần B rẻ)');
}

async function partD() {
  heading('D. Hash index trên users(email), trong BEGIN … ROLLBACK: chỉ phục vụ phép "="');
  const EQ = "SELECT * FROM users WHERE email = 'user777777@example.com'";
  const btreeEq = await measure(client, EQ); // only the permanent btree users_email_key exists here
  const r = await inRollback(client, async () => {
    const build = async (sql) => { const t0 = performance.now(); await client.query(sql); return performance.now() - t0; };
    const hashMs = await build('CREATE INDEX l02_users_email_hash ON users USING hash (email)');
    const btreeMs = await build('CREATE INDEX l02_users_email_btree ON users (email)');
    const hashBytes = await relBytes(client, 'l02_users_email_hash');
    const btreeBytes = await relBytes(client, 'l02_users_email_btree');
    const hashEq = await measure(client, EQ); // both btrees still present: the planner is free to choose
    // Leave only the hash index, then forbid Seq Scan: if hash could serve the query, the planner would now use it.
    // DROP CONSTRAINT locks users exclusively until the ROLLBACK a moment later; lock_timeout avoids waiting forever.
    await client.query("SET LOCAL lock_timeout = '30s'");
    await client.query('DROP INDEX l02_users_email_btree');
    await client.query('ALTER TABLE users DROP CONSTRAINT users_email_key');
    await client.query('SET LOCAL enable_seqscan = off');
    const range = await measure(client, "SELECT * FROM users WHERE email > 'user9'", { runs: 1 });
    const order = await measure(client, 'SELECT * FROM users ORDER BY email LIMIT 5', { runs: 1 });
    return { hashMs, btreeMs, hashBytes, btreeBytes, hashEq, range, order };
  });
  printMeasurements([
    { label: 'email = … (chỉ có btree)', m: btreeEq },
    { label: 'email = … (thêm hash)', m: r.hashEq },
    { label: "email > 'user9' (chỉ còn hash, ép)", m: r.range },
    { label: 'ORDER BY email LIMIT 5 (chỉ còn hash, ép)', m: r.order },
  ]);
  console.log(`Kích thước / thời gian dựng: hash ${fmtBytes(r.hashBytes)} / ${fmtSec(r.hashMs)}` +
    ` · btree ${fmtBytes(r.btreeBytes)} / ${fmtSec(r.btreeMs)}`);
  verdict(r.hashEq.plan.includes('l02_users_email_hash') && r.hashEq.pages < btreeEq.pages,
    `Phép "=": planner chọn hash, ${r.hashEq.pages} trang (bucket + heap) so với btree ${btreeEq.pages} trang (đi qua mọi tầng rồi tới heap)`);
  verdict(!r.range.usesIndex && !r.order.usesIndex,
    'Range và ORDER BY vẫn Seq Scan dù đã ép tắt Seq Scan: hash chỉ lưu mã băm, không giữ thứ tự khóa (slide 12)');
  verdict(r.hashBytes < r.btreeBytes,
    `Hash ${fmtBytes(r.hashBytes)} so với btree ${fmtBytes(r.btreeBytes)}: hash lưu mã băm 4 byte thay vì cả chuỗi email`);
}

console.log('Lab 3.02 — B+tree: tra 1 dòng tốn (số tầng + 1) trang dù bảng lớn hơn nhiều lần; hash chỉ phục vụ "=" (slide 8–12, 38)');
try {
  const lookupPages = await partA();
  await partB();
  await partC(lookupPages);
  await partD();
} catch (err) {
  console.error(`Lab dừng vì lỗi: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
