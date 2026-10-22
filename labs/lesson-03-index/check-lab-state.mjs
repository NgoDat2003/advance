// Invariant check after any lab: lab03_indexing holds only the dataset (no leftover scratch tables or indexes),
// and lab_imdb still has only its two primary keys (lesson 2's lab 6 depends on that).
// `--reset` drops the whole lab03_indexing schema (dataset + extensions) and recreates it empty.
import { connect, assertImdbUntouched, heading } from './pg-explain-kit.mjs';

const client = await connect();

if (process.argv.includes('--reset')) {
  await client.query('DROP SCHEMA IF EXISTS lab03_indexing CASCADE');
  await client.query('CREATE SCHEMA lab03_indexing');
  console.log('Đã xóa toàn bộ lab03_indexing. Chạy lại: npm run setup');
  await client.end();
  process.exit(0);
}

const EXPECTED = new Set([
  'users', 'users_pkey', 'users_email_key', 'orders', 'orders_pkey', 't_ab', 't_ab_pkey',
  'hw_contracts', 'hw_contracts_pkey', // created by `npm run homework:setup`
]);

heading('Đối tượng trong lab03_indexing');
const { rows } = await client.query(
  `SELECT c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'lab03_indexing' AND c.relkind IN ('r', 'i') ORDER BY c.relkind DESC, c.relname`,
);
const extra = rows.filter((r) => !EXPECTED.has(r.relname));
console.log(rows.map((r) => `${r.relkind === 'r' ? 'bảng' : 'index'} ${r.relname}`).join('\n'));
console.log(extra.length ? `✘ Còn sót: ${extra.map((r) => r.relname).join(', ')}` : '✔ Không còn bảng/index tạm nào');
if (extra.length) process.exitCode = 1;

// Index Only Scan labs assume every page of the dataset tables is marked all-visible (VACUUM sets it).
const { rows: vm } = await client.query(
  `SELECT relname, relallvisible, relpages FROM pg_class WHERE relnamespace = 'lab03_indexing'::regnamespace
      AND relname IN ('users', 'orders', 't_ab') AND relallvisible < relpages`,
);
console.log(vm.length
  ? `✘ Visibility map chưa đầy: ${vm.map((r) => `${r.relname} ${r.relallvisible}/${r.relpages}`).join(', ')} (chạy: VACUUM lab03_indexing.<bảng>)`
  : '✔ Visibility map đầy trên users, orders, t_ab');
if (vm.length) process.exitCode = 1;

await assertImdbUntouched(client);
await client.end();
