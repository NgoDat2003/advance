// Lab 3.06 — Covering index in PostgreSQL = Index Only Scan + the visibility map (slides 28, 38).
// A. SELECT name, email for one Singapore province: index (country, province) must visit the heap for every row;
//    (country, province) INCLUDE (name, email) answers from the index alone (Index Only Scan, Heap Fetches 0).
//    The price is size: name and email are copied into the index for all 1,000,000 rows.
// B. "From the index alone" holds only for heap pages marked all-visible in the visibility map. A committed UPDATE
//    clears the bit, so the scan goes back to the heap (Heap Fetches > 0) until VACUUM sets it again.
// C. Slide 38 says Postgres may keep row columns in internal nodes. pageinspect shows the opposite for INCLUDE:
//    internal (pivot) tuples hold only the key columns; INCLUDE columns live in the leaves.
// Indexes on users exist only inside BEGIN ... ROLLBACK. Part B writes to the scratch copy l06_users (autovacuum off).
import { setTimeout as sleep } from 'node:timers/promises';
import {
  connect, measure, inRollback, relBytes, printTable, heading, verdict, fmtBytes, fmtInt, fmtMs,
} from './pg-explain-kit.mjs';

const client = await connect();
console.log('Lab 3.06 — Covering index: Index Only Scan chỉ "không đụng heap" khi visibility map cho phép (slide 28, 38)');

const SQL = "SELECT name, email FROM users WHERE country = 'SG' AND province = 'SG-P3'";
const COLS = [
  ['Truy vấn', (r) => r.label],
  ['Kế hoạch', (r) => r.m.plan],
  ['Dòng', (r) => fmtInt(r.m.rows), 'right'],
  ['Heap Fetches', (r) => (r.m.raw['Node Type'] === 'Index Only Scan' ? fmtInt(r.m.heapFetches) : '— (đọc heap mọi dòng)'), 'right'],
  ['Trang', (r) => fmtInt(r.m.pages), 'right'],
  ['ms', (r) => fmtMs(r.m.ms), 'right'],
];

/**
 * pageinspect prints a tuple's key bytes in hex. Short text values carry a 1-byte header (odd byte, length = byte >> 1,
 * header included), so the columns can be read back until the zero padding starts.
 */
function decodeTextColumns(hex) {
  const bytes = hex.split(' ').filter(Boolean).map((h) => parseInt(h, 16));
  const values = [];
  for (let i = 0; i < bytes.length && bytes[i] % 2 === 1; ) {
    const len = bytes[i] >> 1;
    values.push(Buffer.from(bytes.slice(i + 1, i + len)).toString('utf8'));
    i += len;
  }
  return values;
}

// ---------- A + C: both indexes on the base table, each inside its own rolled-back transaction ----------
const plain = await inRollback(client, async () => {
  await client.query('CREATE INDEX l06_cp ON users (country, province)');
  // Same keys without deduplication: an INCLUDE index can never deduplicate, so this is the fair size baseline.
  await client.query('CREATE INDEX l06_cp_nodedup ON users (country, province) WITH (deduplicate_items = off)');
  return { bytes: await relBytes(client, 'l06_cp'), noDedupBytes: await relBytes(client, 'l06_cp_nodedup'), m: await measure(client, SQL) };
});
const covering = await inRollback(client, async () => {
  await client.query('CREATE INDEX l06_cp_incl ON users (country, province) INCLUDE (name, email)');
  const out = { bytes: await relBytes(client, 'l06_cp_incl'), m: await measure(client, SQL) };
  const { rows: [meta] } = await client.query("SELECT root::int, level::int FROM bt_metap('l06_cp_incl')");
  // Root page: item 1 is the "minus infinity" downlink with no key, so take item 2. Leaf: the first leaf of a freshly
  // built index is block 1; pageinspect leaves `dead` NULL only for its high key (a pivot copy), so skip that one.
  const { rows: [root] } = await client.query(
    `SELECT itemlen, data, (SELECT round(avg(itemlen)) FROM bt_page_items('l06_cp_incl', $1)) AS avg
       FROM bt_page_items('l06_cp_incl', $1) WHERE itemoffset = 2`, [meta.root]);
  const { rows: [leaf] } = await client.query(
    `SELECT itemlen, data, (SELECT round(avg(itemlen)) FROM bt_page_items('l06_cp_incl', 1)) AS avg
       FROM bt_page_items('l06_cp_incl', 1) WHERE dead IS NOT NULL ORDER BY itemoffset LIMIT 1`);
  const { rows: [leafStats] } = await client.query("SELECT type, btpo_level FROM bt_page_stats('l06_cp_incl', 1)");
  out.pivot = { meta, root, leaf, leafIsLeaf: leafStats.type === 'l' };
  return out;
});

heading("A. SELECT name, email … WHERE country = 'SG' AND province = 'SG-P3' trên users (1 triệu dòng)");
printTable([
  { label: `(country, province) — ${fmtBytes(plain.bytes)}`, m: plain.m },
  { label: `(country, province) INCLUDE (name, email) — ${fmtBytes(covering.bytes)}`, m: covering.m },
], COLS);
verdict(covering.m.raw['Node Type'] === 'Index Only Scan' && covering.m.heapFetches === 0 && covering.m.pages * 10 < plain.m.pages,
  `INCLUDE → ${covering.m.raw['Node Type']}, Heap Fetches ${covering.m.heapFetches}: ${fmtInt(covering.m.pages)} trang thay vì ${fmtInt(plain.m.pages)} (${(plain.m.pages / covering.m.pages).toFixed(0)}× ít hơn)`);
verdict(covering.bytes > plain.noDedupBytes,
  `Cái giá: index INCLUDE nặng ${fmtBytes(covering.bytes)}, gấp ${(covering.bytes / plain.bytes).toFixed(1)}× bản chỉ có khóa (${fmtBytes(plain.bytes)}). Một phần vì INCLUDE không được khử trùng lặp (bản khóa tắt dedup: ${fmtBytes(plain.noDedupBytes)}), phần còn lại (${(covering.bytes / plain.noDedupBytes).toFixed(1)}×) là name, email chép vào mọi mục. Slide 28: giữ ≤ 5 cột`);

// ---------- B: visibility map on a scratch copy ----------
/** VACUUM, retrying while another session's old snapshot keeps rows from being "visible to everyone". */
async function vacuumUntilAllVisible(table) {
  for (let attempt = 0; attempt < 30; attempt++) {
    await client.query(`VACUUM ${table}`);
    const { rows: [r] } = await client.query('SELECT relpages, relallvisible FROM pg_class WHERE oid = $1::regclass', [table]);
    if (r.relpages === r.relallvisible) return attempt;
    await sleep(1000);
  }
  return -1;
}
// pg_class.relallvisible only changes at VACUUM/ANALYZE, so read the live state: each heap page header carries
// PD_ALL_VISIBLE (flag 4), set and cleared together with the page's visibility-map bit.
const vmState = async () => {
  const { rows: [r] } = await client.query(
    `SELECT count(*) FILTER (WHERE ((page_header(get_raw_page('l06_users', b::int))).flags & 4) > 0) AS vis, count(*) AS total
       FROM generate_series(0, pg_relation_size('l06_users') / 8192 - 1) b`);
  return `${fmtInt(r.vis)} / ${fmtInt(r.total)}`;
};
const SCRATCH_SQL = SQL.replace('FROM users', 'FROM l06_users');
const states = [];
try {
  await client.query('DROP TABLE IF EXISTS l06_users');
  await client.query(
    `CREATE TABLE l06_users WITH (autovacuum_enabled = off) AS
       SELECT id, name, email, country, province FROM users WHERE country IN ('SG', 'NL') ORDER BY id`);
  await client.query('CREATE INDEX l06_users_cp_incl ON l06_users (country, province) INCLUDE (name, email)');
  await client.query('ANALYZE l06_users');
  let waited = await vacuumUntilAllVisible('l06_users');
  states.push({ label: '1. Sau VACUUM', vm: await vmState(), m: await measure(client, SCRATCH_SQL) });
  // No-op UPDATE, committed (autocommit): same values, but every touched heap page loses its all-visible bit.
  const upd = await client.query(`UPDATE l06_users SET name = name WHERE country = 'SG' AND province = 'SG-P3'`);
  states.push({ label: `2. Sau UPDATE ${upd.rowCount} dòng (giữ nguyên giá trị, đã commit)`, vm: await vmState(), m: await measure(client, SCRATCH_SQL) });
  waited = Math.max(waited, await vacuumUntilAllVisible('l06_users'));
  states.push({ label: '3. Sau VACUUM lần nữa', vm: await vmState(), m: await measure(client, SCRATCH_SQL) });
  if (waited !== 0) console.log(`(VACUUM phải chờ: có transaction khác đang giữ snapshot cũ${waited < 0 ? ', chưa đánh dấu hết được' : ''})`);
} finally {
  await client.query('DROP TABLE IF EXISTS l06_users');
}

heading(`B. Visibility map trên bản sao l06_users (SG + NL), cùng truy vấn, index (country, province) INCLUDE (name, email)`);
printTable(states, [
  ['Trạng thái', (r) => r.label],
  ['Trang heap all-visible / tổng', (r) => r.vm, 'right'],
  ['Kế hoạch', (r) => r.m.raw['Node Type']],
  ['Heap Fetches', (r) => fmtInt(r.m.heapFetches), 'right'],
  ['Trang', (r) => fmtInt(r.m.pages), 'right'],
]);
const [s1, s2, s3] = states.map((s) => s.m);
const allIos = states.every((s) => s.m.raw['Node Type'] === 'Index Only Scan');
verdict(allIos && s1.heapFetches === 0 && s2.heapFetches > 0 && s3.heapFetches === 0,
  `Vẫn là Index Only Scan, nhưng Heap Fetches ${s1.heapFetches} → ${fmtInt(s2.heapFetches)} → ${s3.heapFetches}: sau UPDATE phải quay lại heap kiểm tra từng dòng (${s1.pages} → ${s2.pages} trang) cho tới khi VACUUM đánh dấu lại`);

// ---------- C: pivot vs leaf tuples of the INCLUDE index ----------
const { meta, root, leaf, leafIsLeaf } = covering.pivot;
const rootCols = decodeTextColumns(root.data);
const leafCols = decodeTextColumns(leaf.data);
heading(`C. Bên trong l06_cp_incl (bt_page_items): cây ${meta.level + 1} tầng, root là block ${meta.root}`);
printTable([
  { node: `Root (level ${meta.level}, block ${meta.root}), item 2`, t: root, cols: rootCols },
  { node: `Lá (level 0, block 1), dòng đầu tiên`, t: leaf, cols: leafCols },
], [
  ['Nút', (r) => r.node],
  ['itemlen', (r) => r.t.itemlen, 'right'],
  ['TB itemlen cả trang', (r) => r.t.avg, 'right'],
  ['Các cột đọc từ data', (r) => r.cols.map((c) => `'${c}'`).join(' · ')],
]);
verdict(leafIsLeaf && meta.level > 0 && rootCols.length === 2 && leafCols.length === 4 && root.itemlen < leaf.itemlen,
  `Tuple ở nút trong (pivot) chỉ có ${rootCols.length} cột khóa, ${root.itemlen} byte; tuple ở lá có đủ ${leafCols.length} cột (thêm name, email), ${leaf.itemlen} byte → cột INCLUDE chỉ nằm ở lá, nút trong không phình ra`);

await client.end();
