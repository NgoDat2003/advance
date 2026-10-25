// Bài tập về nhà Bài 12 (Slide 24) — Phần C: bản nháp "AI viết" để học viên RÀ SOÁT phương pháp đo.
// Script chạy được, exit 0 và tự dọn bảng hw_draft_contracts; hãy đọc kỹ code và tìm 4 lỗi phương pháp đo.
import { connect, heading } from './tx-kit.mjs';

const T = 'hw_draft_contracts';
const client = await connect('lesson-12-hw-draft');
const q = (sql) => client.query(sql);
const conclusions = [];
const commitQuietly = () => q('COMMIT').catch(() => {});
try {
  await q(`DROP TABLE IF EXISTS ${T} CASCADE`);
  await q(`CREATE TABLE ${T} (
    id int PRIMARY KEY, code text, total int NOT NULL,
    CONSTRAINT hw_draft_code_uq UNIQUE (code) DEFERRABLE INITIALLY DEFERRED
  ) WITH (autovacuum_enabled = false)`);
  await q(`INSERT INTO ${T} VALUES (1,'HD1',100),(2,'HD2',100),(3,'HD3',100)`);

  heading('Thử nghiệm 1 — "Dirty read ở READ UNCOMMITTED"');
  await q('BEGIN ISOLATION LEVEL READ UNCOMMITTED');
  console.log('  [phiên B] UPDATE total = 999 (chưa COMMIT)');
  await q(`UPDATE ${T} SET total = 999 WHERE id = 1`);
  const seen = (await q(`SELECT total FROM ${T} WHERE id = 1`)).rows[0].total;
  console.log(`  [phiên A] SELECT total => ${seen}`);
  await q('ROLLBACK');
  conclusions.push(seen === 999
    ? 'READ UNCOMMITTED có dirty read: phiên A đọc được 999 chưa COMMIT của phiên B.'
    : 'READ UNCOMMITTED không có dirty read.');

  heading('Thử nghiệm 2 — "Bật SERIALIZABLE bằng SET TRANSACTION"');
  client.notices.length = 0;
  await q('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
  await q('BEGIN');
  const level = (await q('SHOW transaction_isolation')).rows[0].transaction_isolation;
  console.log(`  transaction_isolation sau BEGIN = ${level}`);
  client.notices.forEach((n) => console.log(`  NOTICE/WARNING: ${n.message}`));
  await q('ROLLBACK');
  conclusions.push('Đã chạy ở SERIALIZABLE (vì lệnh SET TRANSACTION ISOLATION LEVEL SERIALIZABLE không báo lỗi).');

  heading('Thử nghiệm 3 — "Write skew bị SERIALIZABLE chặn"');
  await q('BEGIN');
  console.log('  [phiên A] UPDATE total = 0 WHERE id = 1');
  await q(`UPDATE ${T} SET total = 0 WHERE id = 1`);
  console.log('  [phiên B] UPDATE total = 0 WHERE id = 2');
  await q(`UPDATE ${T} SET total = 0 WHERE id = 2`);
  await commitQuietly();
  const zero = (await q(`SELECT count(*)::int AS c FROM ${T} WHERE total = 0`)).rows[0].c;
  console.log(`  Số dòng total = 0 sau khi cả hai COMMIT: ${zero}`);
  conclusions.push(zero === 2
    ? 'Không gặp 40001 và cả hai UPDATE đều thành công => write skew không xảy ra, không cần SERIALIZABLE.'
    : 'Write skew bị chặn.');

  heading('Thử nghiệm 4 — "COMMIT luôn thành công"');
  await q('BEGIN');
  await q(`INSERT INTO ${T} VALUES (4,'HD1',100)`); // trùng code HD1: ràng buộc DEFERRABLE chỉ kiểm tra lúc COMMIT
  await commitQuietly();
  const inserted = (await q(`SELECT count(*)::int AS c FROM ${T} WHERE id = 4`)).rows[0].c;
  console.log(`  COMMIT chạy xong không báo lỗi; số dòng id = 4 trong bảng: ${inserted}`);
  conclusions.push('COMMIT không ném lỗi nên giao dịch luôn thành công; lỗi 40001 nếu có cũng chỉ là "nhiễu".');
  await q('ROLLBACK').catch(() => {});

  heading('Kết luận của bản nháp AI (tự tin, nhưng chưa được kiểm chứng)');
  conclusions.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  console.log('\nHãy rà soát: script này có 4 lỗi phương pháp đo. Tìm đủ 4 lỗi và cách sửa cho Phần C.');
} finally {
  await q('ROLLBACK').catch(() => {});
  await q(`DROP TABLE IF EXISTS ${T} CASCADE`).catch(() => {});
  await client.end().catch(() => {});
}
