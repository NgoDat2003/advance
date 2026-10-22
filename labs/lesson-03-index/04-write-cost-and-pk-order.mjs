// Lab 3.04 — Slides 17, 20, 37: every index is paid for on every write, and the primary key's order decides how much.
// A. The same 200,000 rows inserted into tables with 1, 4 and 7 indexes: each extra index adds its own entries, page
//    splits and WAL, so insert time, WAL and total index size grow roughly linearly with the number of indexes.
// B. 1,000,000 rows into three primary keys: bigint (sequential), random UUID (v4) and time-ordered UUID (like v7).
//    Sequential keys always land on the right-most leaf, which splits 90/10 and stays ~90% full. Random keys land on
//    any leaf, splits are 50/50 and leaves settle near 70% full: a bigger index, more WAL, slower inserts.
// The random UUIDs come from md5(row number) with the v4 version bits set: the same random order as gen_random_uuid(),
// but identical on every run, so the page counts and sizes below are reproducible.
// WAL is counted per statement with EXPLAIN (ANALYZE, WAL). Each table is created right after a CHECKPOINT: pages born
// after a checkpoint need no full-page image, so the WAL below is only rows, index entries and page splits.
// Scratch tables l04_* only (dropped at start and at the end); base tables are not touched.
import { connect, indexShape, printTable, heading, verdict, fmtBytes, fmtInt } from './pg-explain-kit.mjs';

const client = await connect();
const ROWS_A = 200_000;
const ROWS_B = 1_000_000;
const COLS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
const PK_KINDS = [
  { table: 'l04_pk_bigint', label: 'bigint tăng dần', type: 'bigint', expr: 'g' },
  { table: 'l04_pk_uuid_v4', label: 'UUID ngẫu nhiên (v4)', type: 'uuid',
    expr: "overlay(overlay(md5(g::text) placing '4' from 13) placing '8' from 17)::uuid" },
  { table: 'l04_pk_uuid_time', label: 'UUID theo thời gian', type: 'uuid',
    expr: "(lpad(to_hex(g), 12, '0') || substr(md5(g::text), 1, 20))::uuid" },
];
const SCRATCH = ['l04_idx1', 'l04_idx4', 'l04_idx7', ...PK_KINDS.map((k) => k.table)].join(', ');
const fmtSec = (ms) => `${(ms / 1000).toFixed(1)} s`;
const pct = (x) => `${x.toFixed(0)}%`;
let fullPageImages = 0;

// Runs a write under EXPLAIN (ANALYZE, WAL): execution time and WAL of this statement only, not of other sessions.
async function runCountingWal(sql) {
  const { rows } = await client.query(`EXPLAIN (ANALYZE, WAL, TIMING OFF, FORMAT JSON) ${sql}`);
  const { Plan: p, 'Execution Time': ms } = rows[0]['QUERY PLAN'][0];
  fullPageImages += p['WAL FPI'];
  return { ms, wal: p['WAL Bytes'] };
}

async function partA() {
  heading(`A. Cùng ${fmtInt(ROWS_A)} dòng, chèn vào bảng có 1 / 4 / 7 index (index phụ trên cột giá trị ngẫu nhiên)`);
  const runs = [];
  for (const n of [1, 4, 7]) {
    const table = `l04_idx${n}`;
    await client.query('CHECKPOINT');
    await client.query(
      `CREATE TABLE ${table} (id bigint PRIMARY KEY, ${COLS.map((c) => `${c} int`).join(', ')}) WITH (autovacuum_enabled = off)`);
    for (const c of COLS.slice(0, n - 1)) await client.query(`CREATE INDEX ${table}_${c}_idx ON ${table} (${c})`);
    const w = await runCountingWal(
      `INSERT INTO ${table} SELECT g, ${COLS.map((_, i) => `h(g, ${51 + i})`).join(', ')} FROM generate_series(1, ${ROWS_A}) g`);
    const { rows: [s] } = await client.query(
      'SELECT pg_relation_size($1::regclass) AS heap, pg_indexes_size($1::regclass) AS idx', [table]);
    runs.push({ n, ...w, heap: Number(s.heap), idx: Number(s.idx) });
  }
  printTable(runs, [
    ['Số index', (r) => `${r.n} index`],
    ['Thời gian chèn', (r) => fmtSec(r.ms), 'right'],
    ['WAL', (r) => fmtBytes(r.wal), 'right'],
    ['Tổng index', (r) => fmtBytes(r.idx), 'right'],
    ['Heap', (r) => fmtBytes(r.heap), 'right'],
  ]);
  const [one, four, seven] = runs;
  const rising = (key) => one[key] < four[key] && four[key] < seven[key];
  verdict(rising('ms') && rising('wal') && rising('idx'),
    `Càng nhiều index càng chậm: 1 → 4 → 7 index = ${fmtSec(one.ms)} → ${fmtSec(four.ms)} → ${fmtSec(seven.ms)}, ` +
    `WAL ${fmtBytes(one.wal)} → ${fmtBytes(four.wal)} → ${fmtBytes(seven.wal)}`);
  // Linear growth: the 3 indexes added from 1 to 4 cost about as much WAL as the 3 added from 4 to 7.
  const step1 = (four.wal - one.wal) / 3;
  const step2 = (seven.wal - four.wal) / 3;
  verdict(Math.abs(step2 - step1) / step1 < 0.2,
    `Gần tuyến tính: mỗi index phụ thêm ≈ ${fmtBytes(step1)} WAL (1→4) và ≈ ${fmtBytes(step2)} (4→7) cho ${fmtInt(ROWS_A)} dòng`);
  verdict(seven.idx > seven.heap,
    `7 index chiếm ${fmtBytes(seven.idx)}, gấp ${(seven.idx / seven.heap).toFixed(1)}× chính bảng (${fmtBytes(seven.heap)}): ` +
    'index tốn dung lượng thật (slide 17)');
}

async function partB() {
  heading(`B. ${fmtInt(ROWS_B)} dòng vào 3 kiểu khóa chính: tăng dần vs ngẫu nhiên`);
  const runs = [];
  for (const k of PK_KINDS) {
    await client.query('CHECKPOINT');
    await client.query(`CREATE TABLE ${k.table} (id ${k.type} PRIMARY KEY, n int) WITH (autovacuum_enabled = off)`);
    const w = await runCountingWal(`INSERT INTO ${k.table} SELECT ${k.expr}, g FROM generate_series(1, ${ROWS_B}) g`);
    // The same keys computed without inserting: the share of the insert time spent on md5/to_hex, not on the index.
    const { rows: [gen] } = await client.query(
      `EXPLAIN (ANALYZE, TIMING OFF, FORMAT JSON) SELECT count(${k.expr}) FROM generate_series(1, ${ROWS_B}) g`);
    const genMs = gen['QUERY PLAN'][0]['Execution Time'];
    runs.push({ ...k, ...w, genMs, netMs: w.ms - genMs, ...(await indexShape(client, `${k.table}_pkey`)) });
  }
  printTable(runs, [
    ['Khóa chính', (r) => r.label],
    ['Thời gian chèn', (r) => fmtSec(r.ms), 'right'],
    ['trong đó sinh khóa', (r) => fmtSec(r.genMs), 'right'],
    ['WAL', (r) => fmtBytes(r.wal), 'right'],
    ['Index pkey', (r) => fmtBytes(r.bytes), 'right'],
    ['Trang lá', (r) => fmtInt(r.leafPages), 'right'],
    ['Lá đầy', (r) => r.density.toFixed(1) + '%', 'right'],
    ['Số tầng', (r) => r.level + 1, 'right'],
  ]);
  const [big, v4, time] = runs;
  verdict(v4.density < time.density - 10 && v4.bytes > time.bytes,
    `Cùng khóa 16 byte, chỉ khác thứ tự: UUID ngẫu nhiên lá đầy ${pct(v4.density)} so với ${pct(time.density)} → ` +
    `index ${fmtBytes(v4.bytes)} vs ${fmtBytes(time.bytes)} (+${pct((100 * (v4.bytes - time.bytes)) / time.bytes)})`);
  verdict(Math.abs(time.density - big.density) < 2,
    `UUID theo thời gian đầy như bigint (${pct(time.density)} vs ${pct(big.density)}); to hơn bigint ` +
    `${(time.bytes / big.bytes).toFixed(1)}× chỉ vì khóa 16 byte thay vì 8 (mục index 24 vs 16 byte)`);
  verdict(v4.wal > time.wal && v4.netMs > time.netMs,
    `Chèn ngẫu nhiên tốn hơn: WAL ${fmtBytes(v4.wal)} vs ${fmtBytes(time.wal)} (×${(v4.wal / time.wal).toFixed(2)}), ` +
    `thời gian ghi (trừ phần sinh khóa) ${fmtSec(v4.netMs)} vs ${fmtSec(time.netMs)} — vì vậy slide 20/37 khuyên khóa tăng dần`);
}

console.log('Lab 3.04 — Mỗi index làm chậm thao tác ghi; khóa chính tăng dần giữ index gọn và ít WAL (slide 17, 20, 37)');
try {
  await client.query(`DROP TABLE IF EXISTS ${SCRATCH}`);
  await partA();
  await partB();
  if (fullPageImages > 0) {
    console.log(`   (Có ${fmtInt(fullPageImages)} full-page image do một checkpoint chen giữa lúc chèn: WAL ở trên bị đội lên)`);
  }
} catch (err) {
  console.error(`Lab dừng vì lỗi: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.query(`DROP TABLE IF EXISTS ${SCRATCH}`).catch(() => {});
  await client.end();
}
