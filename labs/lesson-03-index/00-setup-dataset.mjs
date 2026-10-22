// Lab 3.0 — Build the lesson-3 dataset in schema lab03_indexing (users, orders, t_ab: 1,000,000 rows each).
// Idempotent: if the tables already hold the expected rows it only prints the summary. `--force` rebuilds.
// After setup the three tables are read-only for every lab; labs that write use their own scratch tables.
import fs from 'node:fs';
import { connect, fmtBytes, fmtInt, printTable, heading } from './pg-explain-kit.mjs';

const force = process.argv.includes('--force');
const client = await connect();

async function ready() {
  const { rows } = await client.query(
    `SELECT count(*) FILTER (WHERE c.relname IN ('users', 'orders', 't_ab') AND c.reltuples > 900000) AS ok
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'lab03_indexing' AND c.relkind = 'r'`,
  );
  return Number(rows[0].ok) === 3;
}

if (force || !(await ready())) {
  heading('Đang tạo dữ liệu lab03_indexing (khoảng 20 giây)...');
  const started = performance.now();
  await client.query(fs.readFileSync(new URL('./setup-dataset.sql', import.meta.url), 'utf8'));
  // VACUUM cannot run inside the multi-statement string above. It fills the visibility map (needed by Index Only Scan)
  // and ANALYZE gives the planner fresh statistics.
  for (const t of ['users', 'orders', 't_ab']) await client.query(`VACUUM (ANALYZE) lab03_indexing.${t}`);
  console.log(`Xong sau ${((performance.now() - started) / 1000).toFixed(0)} giây.`);
} else {
  console.log('Dữ liệu đã có sẵn (chạy lại với --force để tạo lại từ đầu).');
}

// VACUUM cannot mark pages all-visible while another session holds an older snapshot (an open transaction elsewhere).
// Index Only Scan labs need every page all-visible, so check the visibility map and vacuum again until it is full.
let pending = [];
for (let attempt = 1; attempt <= 10; attempt++) {
  const { rows } = await client.query(
    `SELECT relname FROM pg_class WHERE relnamespace = 'lab03_indexing'::regnamespace
        AND relname IN ('users', 'orders', 't_ab') AND relallvisible < relpages`,
  );
  pending = rows.map((r) => r.relname);
  if (!pending.length || attempt === 10) break;
  console.log(`Visibility map chưa đầy (${pending.join(', ')}), VACUUM lại lần ${attempt}...`);
  await new Promise((ok) => setTimeout(ok, 1000));
  for (const t of pending) await client.query(`VACUUM lab03_indexing.${t}`);
}
if (pending.length) {
  console.error(`✘ Visibility map vẫn chưa đầy trên ${pending.join(', ')}: có phiên khác đang mở transaction cũ. Đóng nó rồi chạy lại npm run setup.`);
  process.exitCode = 1;
}

heading('Tóm tắt dữ liệu');
const { rows: sizes } = await client.query(
  `SELECT c.relname AS name, c.reltuples::bigint AS rows, pg_relation_size(c.oid) AS heap,
          pg_indexes_size(c.oid) AS idx
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'lab03_indexing' AND c.relkind = 'r' ORDER BY c.relname`,
);
printTable(sizes, [
  ['Bảng', (r) => r.name],
  ['Số dòng', (r) => fmtInt(r.rows), 'right'],
  ['Heap', (r) => fmtBytes(Number(r.heap)), 'right'],
  ['Index', (r) => fmtBytes(Number(r.idx)), 'right'],
]);

heading('Các nhóm dòng được cài sẵn cho từng lab');
const checks = [
  ["name LIKE 'ronin%' (tiền tố, Lab 09)", "SELECT count(*) FROM users WHERE name LIKE 'ronin%'"],
  ["name LIKE '%ronin' (hậu tố, Lab 09)", "SELECT count(*) FROM users WHERE name LIKE '%ronin'"],
  ['length(name) = 6 (Lab 09)', 'SELECT count(*) FROM users WHERE length(name) = 6'],
  ["country = 'US' (Lab 05)", "SELECT count(*) FROM users WHERE country = 'US'"],
  ["country = 'SG' (Lab 05)", "SELECT count(*) FROM users WHERE country = 'SG'"],
  ["province = 'Texas' (Lab 05)", "SELECT count(*) FROM users WHERE province = 'Texas'"],
  ["name = 'Jane Nguyen' (Lab 05)", "SELECT count(*) FROM users WHERE name = 'Jane Nguyen'"],
  ['Số tên khác nhau (cardinality, Lab 05)', 'SELECT count(DISTINCT name) FROM users'],
  ["status = 'PROCESSING' (Lab 07)", "SELECT count(*) FROM orders WHERE status = 'PROCESSING'"],
  ["status = 'DELIVERED' (Lab 07)", "SELECT count(*) FROM orders WHERE status = 'DELIVERED'"],
  ['users chưa có đơn nào (Lab 07)', 'SELECT count(*) FROM users u WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)'],
  ['deleted_at IS NOT NULL (Lab 07)', 'SELECT count(*) FROM users WHERE deleted_at IS NOT NULL'],
];
const results = [];
for (const [label, sql] of checks) {
  const { rows } = await client.query(sql);
  results.push({ label, n: rows[0].count });
}
printTable(results, [['Nhóm', (r) => r.label], ['Số dòng', (r) => fmtInt(r.n), 'right']]);
await client.end();
