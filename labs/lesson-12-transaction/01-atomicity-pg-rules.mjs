// Lab 12.01 — Atomicity trên PostgreSQL: lỗi làm hỏng giao dịch, SAVEPOINT, DDL có giao dịch, sequence không rollback.
// Phiên A làm việc, phiên O (autocommit) quan sát. Bảng nháp dùng tiền tố l01_ trong schema lab12_transaction.
import { heading, openLab, printTable, sessionState, verdict, waitUntil, warnForeign } from './tx-kit.mjs';

/** Chạy một câu lệnh, trả về lỗi (nếu có) thay vì ném ra để bài lab in được mã SQLSTATE. */
async function tryQuery(client, sql) {
  try {
    return { res: await client.query(sql), err: null };
  } catch (err) {
    return { res: null, err };
  }
}

const SCRATCH = 'DROP TABLE IF EXISTS l01_items, l01_ddl_test CASCADE; DROP SEQUENCE IF EXISTS l01_seq';
const lab = await openLab('lab01', ['A']);
const { A, O } = lab;
let failed = false;

try {
  console.log('Lab 12.01 — Atomicity, SAVEPOINT, Transactional DDL & Sequence trên PostgreSQL 16 (slide 4–5)');
  await warnForeign(O);
  await O.query(SCRATCH);
  await O.query('CREATE TABLE l01_items (id int PRIMARY KEY, val text)');
  const count = async () => Number((await O.query('SELECT count(*) AS n FROM l01_items')).rows[0].n);

  // Phần A: một câu lệnh lỗi làm cả giao dịch chuyển sang trạng thái hỏng (aborted)
  heading('A. Lỗi trong giao dịch: mọi câu lệnh sau đó bị từ chối, COMMIT thực chất là ROLLBACK');
  await A.query('BEGIN');
  await A.query("INSERT INTO l01_items VALUES (1, 'ok')");
  const e1 = (await tryQuery(A, 'SELECT 1/0')).err;
  console.log(`   SELECT 1/0                                -> SQLSTATE ${e1?.code ?? 'không lỗi'}`);
  const e2 = (await tryQuery(A, "INSERT INTO l01_items VALUES (2, 'after-err')")).err;
  console.log(`   INSERT sau lỗi                            -> SQLSTATE ${e2?.code ?? 'không lỗi'}`);
  const commit = await tryQuery(A, 'COMMIT');
  const tag = commit.res?.command ?? 'lỗi';
  console.log(`   COMMIT trả về command tag                 -> ${tag}`);
  const rowsA = await count();
  console.log(`   Số dòng trong l01_items sau đó            -> ${rowsA}`);
  verdict(e1?.code === '22012' && e2?.code === '25P02', 'Chia cho 0 (22012) làm hỏng giao dịch; lệnh kế tiếp bị chặn bởi 25P02 (in_failed_sql_transaction)');
  verdict(tag === 'ROLLBACK', 'COMMIT trên giao dịch hỏng trả về tag ROLLBACK, không phải COMMIT');
  verdict(rowsA === 0, 'Dòng INSERT (1) đã chạy thành công trước lỗi cũng biến mất: tất cả hoặc không gì cả');

  // Phần B: SAVEPOINT cho phép hoàn tác một phần
  heading('B. SAVEPOINT: hoàn tác một phần để giao dịch tiếp tục sống');
  await A.query('BEGIN');
  await A.query("INSERT INTO l01_items VALUES (1, 'one')");
  await A.query('SAVEPOINT sp1');
  const dup = (await tryQuery(A, "INSERT INTO l01_items VALUES (1, 'dup')")).err;
  console.log(`   INSERT trùng khóa chính                   -> SQLSTATE ${dup?.code ?? 'không lỗi'}`);
  await A.query('ROLLBACK TO SAVEPOINT sp1');
  await A.query("INSERT INTO l01_items VALUES (2, 'two')");
  await A.query('COMMIT');
  const rowsB = await count();
  console.log(`   Số dòng sau COMMIT                        -> ${rowsB}`);
  verdict(dup?.code === '23505' && rowsB === 2, 'ROLLBACK TO SAVEPOINT cứu giao dịch sau lỗi 23505: COMMIT thật, còn đủ 2 dòng');

  // Phần C: DDL cũng nằm trong giao dịch
  heading('C. Transactional DDL: CREATE TABLE trong giao dịch bị ROLLBACK thì bảng không tồn tại');
  await A.query('BEGIN');
  await A.query('CREATE TABLE l01_ddl_test (id int)');
  await A.query('ROLLBACK');
  const reg = (await O.query("SELECT to_regclass('lab12_transaction.l01_ddl_test') AS r")).rows[0].r;
  console.log(`   to_regclass('lab12_transaction.l01_ddl_test') -> ${reg === null ? 'NULL (không có bảng)' : reg}`);
  verdict(reg === null, 'DDL được hoàn tác cùng giao dịch: to_regclass trả về NULL');

  // Phần D: sequence là ngoại lệ, không bao giờ rollback
  heading('D. Sequence: nextval không được hoàn tác khi ROLLBACK (thủng số là bình thường)');
  await A.query('CREATE SEQUENCE l01_seq');
  const next = async () => Number((await A.query("SELECT nextval('l01_seq') AS v")).rows[0].v);
  const v1 = await next();
  await A.query('BEGIN');
  const v2 = await next();
  await A.query('ROLLBACK');
  const v3 = await next();
  console.log(`   nextval ngoài giao dịch: ${v1}; trong giao dịch bị ROLLBACK: ${v2}; sau ROLLBACK: ${v3}`);
  verdict(v1 === 1 && v2 === v1 + 1 && v3 > v2, `Sequence không quay lui: sau ROLLBACK nhận ${v3} > ${v2}, giá trị ${v2} bị bỏ trống`);

  // Phần E: trạng thái phiên A nhìn từ O, kèm ký hiệu dấu nhắc của psql
  heading('E. pg_stat_activity.state của phiên A và ký hiệu dấu nhắc psql (%x) tương ứng');
  const steps = [
    ['Chưa BEGIN', null, 'idle', '=#'],
    ['Sau BEGIN', 'BEGIN', 'idle in transaction', '=*#'],
    ['Sau lệnh lỗi', 'SELECT 1/0', 'idle in transaction (aborted)', '=!#'],
    ['Sau ROLLBACK', 'ROLLBACK', 'idle', '=#'],
  ];
  const seen = [];
  for (const [label, sql, want, glyph] of steps) {
    if (sql) await tryQuery(A, sql);
    const st = await waitUntil(async () => (await sessionState(O, lab.pid.A)).state === want && want, 3000);
    seen.push({ label, sql: sql ?? '(kết nối mới)', state: st || (await sessionState(O, lab.pid.A)).state, want, glyph });
  }
  printTable(seen, [
    ['Bước', (r) => r.label],
    ['Lệnh', (r) => r.sql],
    ['state', (r) => r.state],
    ['Dấu nhắc psql', (r) => r.glyph],
  ]);
  console.log('   Dấu nhắc psql theo tài liệu psql: = bình thường, * đang trong giao dịch, ! giao dịch hỏng, # là superuser.');
  verdict(seen.every((r) => r.state === r.want), 'State đổi đúng chuỗi idle -> idle in transaction -> idle in transaction (aborted) -> idle');
} catch (err) {
  failed = true;
  console.error(`✘ Lab 12.01 gặp lỗi: ${err.code ?? ''} ${err.message}`);
} finally {
  await A.query('ROLLBACK').catch(() => {});
  await O.query(SCRATCH).catch(() => {});
  await lab.closeAll();
}
if (failed) process.exit(1);
