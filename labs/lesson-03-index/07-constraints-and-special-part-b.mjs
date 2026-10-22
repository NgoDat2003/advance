// Lab 3.07 part B — Special indexes in PostgreSQL (slides 29, 37).
// D. Slide 29 "bitmap index to count PROCESSING orders": PG 16 has no stored bitmap index. A btree on a 4-value column
//    stays small thanks to deduplication (each value once + a list of row addresses); a partial index stores only the
//    rows it is meant for. For a value that covers 90% of the table, sum(total) still reads the table, while
//    count(*) can be answered from the small deduplicated index alone.
// E. BRIN keeps min/max per 128 heap pages: tiny, and good enough when the column grows with insertion order. A few
//    rows the bulk insert placed into earlier pages' free space widen those min/max ranges, which the output shows.
// F. Slide 37 "NOT NULL": a Postgres btree stores NULLs too; a partial index can leave them out.
// G. Slide 37 "prefix index": PG has none, an expression index on left(email, 10) plays that role; and a btree entry
//    must fit in about a third of an 8 KB page.
// Every index on orders/users lives inside BEGIN ... ROLLBACK; the size-limit test uses the scratch table l07_big.
import { measure, inRollback, relBytes, printTable, heading, verdict, fmtBytes, fmtInt, fmtMs } from './pg-explain-kit.mjs';

const scanOf = (n) => (/Scan/.test(n['Node Type']) ? n : (n.Plans ?? []).map(scanOf).find(Boolean));
const scanRows = (m) => scanOf(m.raw)?.['Actual Rows'] ?? m.rows;
const ratio = (a, b) => `${(a / b).toFixed(1)}×`;
const ROW_COLS = [
  ['Truy vấn', (r) => r.label],
  ['Index (kích thước)', (r) => r.index],
  ['Kế hoạch', (r) => r.m.plan],
  ['Dòng quét', (r) => fmtInt(scanRows(r.m)), 'right'],
  ['Trang', (r) => fmtInt(r.m.pages), 'right'],
  ['ms', (r) => fmtMs(r.m.ms), 'right'],
];

/** D: counting a rare status — no index, btree(status), partial index. */
async function statusIndexes(client) {
  const COUNT_P = "SELECT count(*) FROM orders WHERE status = 'PROCESSING'";
  const COUNT_D = "SELECT count(*) FROM orders WHERE status = 'DELIVERED'";
  const SUM_D = "SELECT sum(total) FROM orders WHERE status = 'DELIVERED'";
  const none = await measure(client, COUNT_P);
  const bt = await inRollback(client, async () => {
    await client.query('CREATE INDEX l07_status_nodedup ON orders (status) WITH (deduplicate_items = off)');
    const noDedupBytes = await relBytes(client, 'l07_status_nodedup');
    await client.query('DROP INDEX l07_status_nodedup');
    await client.query('CREATE INDEX l07_status ON orders (status)');
    return {
      noDedupBytes, bytes: await relBytes(client, 'l07_status'),
      p: await measure(client, COUNT_P), d: await measure(client, COUNT_D), sumD: await measure(client, SUM_D),
    };
  });
  const part = await inRollback(client, async () => {
    await client.query("CREATE INDEX l07_processing ON orders (id) WHERE status = 'PROCESSING'");
    return { bytes: await relBytes(client, 'l07_processing'), p: await measure(client, COUNT_P), d: await measure(client, COUNT_D) };
  });
  const btLabel = `btree(status) ${fmtBytes(bt.bytes)}`;
  const partLabel = `(id) WHERE PROCESSING ${fmtBytes(part.bytes)}`;
  heading('D. Slide 29: đếm đơn PROCESSING (10,069 / 1 triệu) — Postgres không có bitmap index lưu sẵn');
  printTable([
    { label: 'count PROCESSING', index: '—', m: none },
    { label: 'count PROCESSING', index: btLabel, m: bt.p },
    { label: 'count PROCESSING', index: partLabel, m: part.p },
    { label: 'count DELIVERED (90%)', index: btLabel, m: bt.d },
    { label: 'sum(total) DELIVERED', index: btLabel, m: bt.sumD },
    { label: 'count DELIVERED (90%)', index: partLabel, m: part.d },
  ], ROW_COLS);
  verdict(!none.usesIndex && bt.p.usesIndex && bt.p.pages * 100 < none.pages && bt.bytes * 2 < bt.noDedupBytes,
    `btree(status) chỉ ${fmtBytes(bt.bytes)} nhờ deduplication (tắt dedup: ${fmtBytes(bt.noDedupBytes)}); đếm PROCESSING ${fmtInt(none.pages)} → ${bt.p.pages} trang`);
  verdict(part.p.usesIndex && part.bytes * 10 < bt.bytes,
    `Partial index chỉ chứa dòng PROCESSING: ${fmtBytes(part.bytes)}, nhỏ hơn btree(status) ${ratio(bt.bytes, part.bytes)} và chỉ phải cập nhật khi đơn ở PROCESSING; đọc ${part.p.pages} trang (btree(status) đã nén: ${bt.p.pages})`);
  verdict(!bt.sumD.usesIndex && !part.d.usesIndex,
    `DELIVERED chiếm 90%: sum(total) cần cột trong heap → ${scanOf(bt.sumD.raw)['Node Type']} dù có btree(status); partial index không chứa DELIVERED → ${scanOf(part.d.raw)['Node Type']}`);
  verdict(scanOf(bt.d.raw)['Node Type'] === 'Index Only Scan' && bt.d.pages < none.pages,
    `count(*) DELIVERED (90%) dùng ${scanOf(bt.d.raw)['Node Type']} trên btree(status): ${fmtInt(bt.d.pages)} trang thay vì ${fmtInt(none.pages)}. count(*) không cần cột nào trong heap, mà index đã nén nhỏ hơn bảng, nên đếm trên index rẻ hơn dù phải đọc gần hết nó`);
}

/** E: BRIN vs btree for one day of orders.created_at (physically ordered column). */
async function brinVsBtree(client) {
  const DAY = "SELECT sum(total) FROM orders WHERE created_at >= '2023-03-01 00:00+07' AND created_at < '2023-03-02 00:00+07'";
  const build = (name, using) => inRollback(client, async () => {
    await client.query(`CREATE INDEX ${name} ON orders USING ${using} (created_at)`);
    return { bytes: await relBytes(client, name), m: await measure(client, DAY) };
  });
  const brin = await build('l07_created_brin', 'brin');
  const bt = await build('l07_created_btree', 'btree');
  const heapPages = (await relBytes(client, 'orders')) / 8192;
  const removed = scanOf(brin.m.raw)?.['Rows Removed by Index Recheck'] ?? 0;
  heading(`E. BRIN vs btree trên orders.created_at — tổng tiền 1 ngày (bảng ${fmtInt(heapPages)} trang)`);
  printTable([
    { label: '1 ngày', index: `BRIN ${fmtBytes(brin.bytes)}`, m: brin.m },
    { label: '1 ngày', index: `btree ${fmtBytes(bt.bytes)}`, m: bt.m },
  ], ROW_COLS);
  verdict(brin.bytes * 100 < bt.bytes && brin.m.usesIndex && brin.m.pages * 5 < heapPages && bt.m.pages < brin.m.pages,
    `BRIN nhỏ hơn btree ${fmtInt(Math.round(bt.bytes / brin.bytes))}×; đọc ${fmtInt(brin.m.pages)} trang ≈ ${Math.round(brin.m.pages / 128)} khối 128 trang (loại ${fmtInt(removed)} dòng khi kiểm lại) — vẫn ít hơn ${(heapPages / brin.m.pages).toFixed(0)}× so với quét bảng; btree chính xác hơn (${bt.m.pages} trang) nhưng nặng ${fmtBytes(bt.bytes)}`);
  // A day of orders spans ~27 heap pages, so a perfectly ordered heap would match 1-2 ranges. Count the ranges whose
  // min/max cover the day to show where the extra pages come from.
  const { rows: [r] } = await client.query(`
    SELECT count(*) AS ranges, count(*) FILTER (WHERE n > 0) AS with_day FROM (
      SELECT (ctid::text::point)[0]::int / 128 AS blk_range, min(created_at) AS lo, max(created_at) AS hi,
             count(*) FILTER (WHERE created_at >= '2023-03-01 00:00+07' AND created_at < '2023-03-02 00:00+07') AS n
        FROM orders GROUP BY 1) g
     WHERE lo < '2023-03-02 00:00+07' AND hi >= '2023-03-01 00:00+07'`);
  console.log(`   Vì sao ${fmtInt(brin.m.pages)} trang: ${r.ranges} khối 128 trang có min/max phủ ngày 2023-03-01, nhưng chỉ ${r.with_day} khối thật sự chứa dòng của ngày đó. Lệnh INSERT hàng loạt đã nhét một ít dòng mới vào chỗ trống ở các trang đầu bảng; mỗi dòng như vậy kéo max của cả khối lên.`);
}

/** F: full vs partial index on a mostly-NULL column. */
async function deletedAtPartial(client) {
  const s = await inRollback(client, async () => {
    await client.query('CREATE INDEX l07_deleted_full ON users (deleted_at)');
    await client.query('CREATE INDEX l07_deleted_nodedup ON users (deleted_at) WITH (deduplicate_items = off)');
    await client.query('CREATE INDEX l07_deleted_partial ON users (deleted_at) WHERE deleted_at IS NOT NULL');
    const sizes = {};
    for (const n of ['full', 'nodedup', 'partial']) sizes[n] = await relBytes(client, `l07_deleted_${n}`);
    sizes.notNull = Number((await client.query('SELECT count(deleted_at) AS n FROM users')).rows[0].n);
    return sizes;
  });
  heading('F. Slide 37 "NOT NULL": btree của Postgres lưu cả NULL — users.deleted_at (95% NULL)');
  printTable([
    ['(deleted_at) — mặc định, có dedup', '1,000,000', s.full],
    ['(deleted_at) WITH (deduplicate_items = off)', '1,000,000', s.nodedup],
    ['(deleted_at) WHERE deleted_at IS NOT NULL', fmtInt(s.notNull), s.partial],
  ], [['Index', (r) => r[0]], ['Số dòng trong index', (r) => r[1], 'right'], ['Kích thước', (r) => fmtBytes(r[2]), 'right']]);
  verdict(s.partial * 5 < s.full,
    `Partial nhỏ hơn bản đầy đủ ${ratio(s.full, s.partial)} (dự đoán ~20×): dedup đã gộp ${fmtInt(1e6 - s.notNull)} NULL lại; tắt dedup thì gấp ${ratio(s.nodedup, s.partial)}`);
}

/** G: expression "prefix" index and the btree entry size limit. */
async function prefixAndSizeLimit(client) {
  const { left10, m } = await inRollback(client, async () => {
    await client.query('CREATE INDEX l07_email_left10 ON users (left(email, 10))');
    return {
      left10: await relBytes(client, 'l07_email_left10'),
      m: await measure(client, "SELECT email FROM users WHERE left(email, 10) = 'user777777'"),
    };
  });
  const full = await relBytes(client, 'users_email_key');
  let err = null;
  try {
    await client.query('DROP TABLE IF EXISTS l07_big');
    await client.query('CREATE TABLE l07_big (v text)');
    await client.query('CREATE INDEX l07_big_v ON l07_big (v)');
    try {
      // 94 md5 strings = 3,008 characters of hex: too random for compression to shrink it below the limit.
      await client.query("INSERT INTO l07_big SELECT string_agg(md5(g::text), '') FROM generate_series(1, 94) g");
    } catch (e) {
      err = e;
    }
  } finally {
    await client.query('DROP TABLE IF EXISTS l07_big');
  }
  heading('G. Slide 37 "prefix index": Postgres không có — dùng index biểu thức; và giới hạn kích thước 1 entry btree');
  printTable([['users_email_key (email đầy đủ)', full], ['l07_email_left10 (left(email, 10))', left10]], [
    ['Index', (r) => r[0]], ['Kích thước', (r) => fmtBytes(r[1]), 'right'],
  ]);
  console.log(`   Chèn chuỗi 3,008 ký tự vào cột có btree: ${err ? `lỗi ${err.code} — ${err.message.replace(/ for index .*/, ' …')}` : 'không lỗi'}`);
  verdict(left10 < full && /l07_email_left10/.test(m.plan),
    `left(email, 10) nhỏ hơn ${((1 - left10 / full) * 100).toFixed(0)}% (${fmtBytes(left10)} vs ${fmtBytes(full)}) — email ở đây ngắn nên lợi ít; truy vấn phải viết đúng biểu thức: left(email, 10) = 'user777777' → ${m.plan}, ${m.pages} trang`);
  verdict(err?.code === '54000' && /maximum 2704/.test(err.message),
    'Entry btree tối đa 2,704 byte (~1/3 trang 8 KB): cột text dài thì index md5(v), left(v, n) hoặc hash thay vì btree trên cả giá trị');
}

export async function runSpecialIndexes(client) {
  await statusIndexes(client);
  await brinVsBtree(client);
  await deletedAtPartial(client);
  await prefixAndSizeLimit(client);
}
