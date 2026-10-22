// Homework (slide 41), part A — build hw_contracts: 500,000 contracts, the same domain as the learner's contract app.
// Deterministic: every column comes from lab03_indexing.h(id, k), so every run builds the same rows and the
// homework runner prints the same page counts. signed_at is random over 3 years (not correlated with id).
// Idempotent: skips the build when the table already holds 500,000 rows; `--force` rebuilds.
// Always ends with the "dataset card" (rows, size, distinct values per column, status mix) the learner copies.
import { connect, fmtBytes, fmtInt, printTable, heading } from './pg-explain-kit.mjs';

const ROWS = 500000;
const force = process.argv.includes('--force');
const client = await connect();

// Status mix per mille: ACTIVE 60% / EXPIRED 30% / DRAFT 9.5% / TERMINATED 0.5% (the rare value used in T1 and T3).
// No `synchronous_commit = off` here on purpose: VACUUM cannot mark a page all-visible while the inserting
// transaction's asynchronous commit is not yet flushed, and T2 (Index Only Scan, Heap Fetches 0) needs every page marked.
const BUILD_SQL = `
SET maintenance_work_mem = '256MB';
DROP TABLE IF EXISTS hw_contracts;
CREATE TABLE hw_contracts (
  id bigint NOT NULL,
  code text NOT NULL,
  customer_id int NOT NULL,
  store_id int NOT NULL,
  status text NOT NULL,
  signed_at timestamptz NOT NULL,
  total numeric(12,2) NOT NULL
);
INSERT INTO hw_contracts
SELECT g,
  'HD' || lpad(g::text, 7, '0'),
  1 + h(g, 1) % 25000,
  1 + h(g, 2) % 200,
  CASE WHEN h(g, 3) % 1000 < 600 THEN 'ACTIVE'
       WHEN h(g, 3) % 1000 < 900 THEN 'EXPIRED'
       WHEN h(g, 3) % 1000 < 995 THEN 'DRAFT'
       ELSE 'TERMINATED' END,
  timestamptz '2023-01-01 00:00+07' + (h(g, 4) % (3 * 365 * 86400)) * interval '1 second',
  (10000 + h(g, 5) % 99990000) / 100.0
FROM generate_series(1, ${ROWS}) g;
ALTER TABLE hw_contracts ADD CONSTRAINT hw_contracts_pkey PRIMARY KEY (id);`;

async function hasHelper() {
  const { rows } = await client.query(`SELECT to_regprocedure('lab03_indexing.h(bigint, integer)') IS NOT NULL AS ok`);
  return rows[0].ok;
}

async function ready() {
  const { rows } = await client.query(`SELECT to_regclass('lab03_indexing.hw_contracts') IS NOT NULL AS ok`);
  if (!rows[0].ok) return false;
  const { rows: counted } = await client.query('SELECT count(*)::int AS n FROM hw_contracts');
  return counted[0].n === ROWS;
}

/** Pages VACUUM marked all-visible vs total pages (pg_class is refreshed by every VACUUM). */
async function visibility() {
  const { rows } = await client.query(
    `SELECT relpages AS pages, relallvisible AS visible FROM pg_class WHERE oid = 'hw_contracts'::regclass`,
  );
  return rows[0];
}

try {
  if (!(await hasHelper())) {
    console.error('Chưa có dữ liệu bài 3 (thiếu hàm lab03_indexing.h). Chạy trước: npm run setup');
    process.exitCode = 1;
  } else {
    if (force || !(await ready())) {
      heading('Đang tạo hw_contracts (500.000 hợp đồng, vài giây)...');
      const started = performance.now();
      await client.query(BUILD_SQL);
      // Outside the multi-statement string: VACUUM fills the visibility map (Index Only Scan in T2 relies on it),
      // ANALYZE gives the planner statistics for status, store_id and customer_id.
      await client.query('VACUUM (ANALYZE) hw_contracts');
      console.log(`Xong sau ${((performance.now() - started) / 1000).toFixed(1)} giây.`);
    } else {
      console.log('hw_contracts đã có sẵn 500.000 dòng, bỏ qua bước tạo (chạy lại với --force để tạo lại).');
    }
    // A transaction left open in another session stops VACUUM from marking pages; plain VACUUM again keeps the stats.
    const vm = await visibility();
    if (vm.visible < vm.pages) await client.query('VACUUM hw_contracts');
    await printDatasetCard();
  }
} catch (err) {
  console.error(`Lỗi khi tạo hw_contracts: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}

async function printDatasetCard() {
  heading('Thẻ dữ liệu hw_contracts (chép vào bài làm)');
  const { rows: [size] } = await client.query(
    `SELECT count(*)::int AS n, pg_relation_size('hw_contracts') AS heap,
            pg_indexes_size('hw_contracts') AS idx, pg_total_relation_size('hw_contracts') AS total
       FROM hw_contracts`,
  );
  const vm = await visibility();
  printTable([size], [
    ['Số dòng', (r) => fmtInt(r.n), 'right'],
    ['Heap (bảng)', (r) => fmtBytes(Number(r.heap)), 'right'],
    ['Index (chỉ PK)', (r) => fmtBytes(Number(r.idx)), 'right'],
    ['Tổng', (r) => fmtBytes(Number(r.total)), 'right'],
    ['Trang all-visible', () => `${fmtInt(vm.visible)} / ${fmtInt(vm.pages)}`, 'right'],
  ]);
  if (vm.visible < vm.pages) {
    console.log('⚠ Chưa phải mọi trang đều all-visible (có transaction khác đang mở?). T2 sẽ thấy Heap Fetches > 0.');
    console.log('  Đóng các phiên psql/lab đang chạy rồi chạy lại: npm run homework:setup');
  }

  heading('Số giá trị khác nhau từng cột (cardinality)');
  const { rows: types } = await client.query(
    `SELECT attname AS col, format_type(atttypid, atttypmod) AS type FROM pg_attribute
      WHERE attrelid = 'hw_contracts'::regclass AND attnum > 0 AND NOT attisdropped ORDER BY attnum`,
  );
  const distinctSql = types.map((t) => `count(DISTINCT ${t.col})::int AS ${t.col}`).join(', ');
  const { rows: [distinct] } = await client.query(`SELECT ${distinctSql} FROM hw_contracts`);
  printTable(types, [
    ['Cột', (t) => t.col],
    ['Kiểu', (t) => t.type],
    ['Số giá trị khác nhau', (t) => fmtInt(distinct[t.col]), 'right'],
    ['TB số dòng / 1 giá trị', (t) => fmtInt(Math.round(size.n / distinct[t.col])), 'right'],
  ]);

  heading('Phân bố status');
  const { rows: mix } = await client.query(
    `SELECT status, count(*)::int AS n FROM hw_contracts GROUP BY status ORDER BY n DESC`,
  );
  printTable(mix, [
    ['status', (r) => r.status],
    ['Số dòng', (r) => fmtInt(r.n), 'right'],
    ['Tỉ lệ', (r) => `${((100 * r.n) / size.n).toFixed(1)}%`, 'right'],
  ]);
}
