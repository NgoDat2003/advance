// Lab 14.01 — Hai phiên cùng rút tiền từ ví A (50): phiên A chuyển 30 sang ví B, phiên B chuyển 40 sang ví C.
// Đúng ra chỉ 1 giao dịch được qua (50 < 30 + 40). Năm cách viết A–E cho thấy cách nào để ví âm / mất tiền, cách nào chặn được.
// Bảng nháp l01_wallets chép từ store_wallets, đặt lại 50/0/0 trước mỗi mục. Chạy: npm run lab1 (thêm -- --json cho widget).
import { emitJson, heading, jsonMode, openLab, printTable, settle, verdict, waitBlocked } from './lock-kit.mjs';

const say = (s) => { if (!jsonMode) console.log(s); };
say('Lab 14.01 — Kiểm tra số dư sai chỗ làm ví âm hoặc mất tiền; FOR UPDATE, UPDATE có điều kiện và CHECK chặn được (slide 2, 4–5)');

const lab = await openLab('01');
const { O, A, B, pid } = lab;
const verdicts = [];
const ok = (cond, text) => verdicts.push(verdict(cond, text));
const out = {}; // payload --json cho widget W2 "Ai chặn số âm?"

// Đặt lại 3 ví về A = 50, B = 0, C = 0 qua phiên quan sát O (tự commit).
const seed = () => O.query('UPDATE l01_wallets SET balance = CASE id WHEN 1 THEN 50 ELSE 0 END');
// Đọc số dư cuối của 3 ví qua O.
async function wallets() {
  const { rows } = await O.query('SELECT id, balance FROM l01_wallets ORDER BY id');
  const [a, b, c] = rows.map((r) => r.balance);
  return { A: a, B: b, C: c, total: a + b + c };
}
// In số dư cuối và lưu kết quả của 1 cách viết vào payload JSON.
function record(key, mechanism, w, wait, bOutcome, code) {
  say(`  số dư cuối: ví A=${w.A} · ví B=${w.B} · ví C=${w.C} · tổng=${w.total} (tiền phải được bảo toàn: tổng 50)`);
  out[key] = { mechanism, final: { A: w.A, B: w.B, C: w.C }, total: w.total, waited: wait.blocked, waitEvent: wait.waitEvent ?? null, bOutcome, code: code ?? null };
}
const waitText = (w) => (w.blocked ? `chờ ${w.waitEvent} (bị chặn bởi ${w.blockers.join(', ')})` : 'không phải chờ');

try {
  await O.query('DROP TABLE IF EXISTS l01_wallets; CREATE TABLE l01_wallets AS SELECT * FROM store_wallets; ALTER TABLE l01_wallets ADD PRIMARY KEY (id)');

  heading('A. Kiểm tra cũ (stale check) + trừ tương đối balance - 30 / balance - 40');
  await seed();
  await A.query('BEGIN;');
  const aReadA = (await A.query('SELECT balance FROM l01_wallets WHERE id = 1;')).rows[0].balance;
  await B.query('BEGIN;');
  const bReadA = (await B.query('SELECT balance FROM l01_wallets WHERE id = 1;')).rows[0].balance;
  say(`  app: phiên A đọc ${aReadA} (≥ 30: ${aReadA >= 30 ? 'đủ' : 'thiếu'}), phiên B đọc ${bReadA} (≥ 40: ${bReadA >= 40 ? 'đủ' : 'thiếu'}) → cả hai cho chuyển`);
  await A.query('UPDATE l01_wallets SET balance = balance - 30 WHERE id = 1;');
  const pA = settle(B.query('UPDATE l01_wallets SET balance = balance - 40 WHERE id = 1;'));
  const wA = await waitBlocked(O, pid.B, pid, { unless: pA });
  await A.query('UPDATE l01_wallets SET balance = balance + 30 WHERE id = 2;');
  await A.query('COMMIT;');
  const rA = await pA;
  await B.query('UPDATE l01_wallets SET balance = balance + 40 WHERE id = 3;');
  await B.query('COMMIT;');
  const fA = await wallets();
  record('A', 'kiểm tra cũ + trừ tương đối', fA, wA, rA.ok ? `trừ tiếp trên số dư mới, UPDATE ${rA.rowCount}` : rA.code, rA.code);
  ok(wA.blocked && wA.waitEvent === 'Lock/transactionid' && rA.ok && fA.A === -20,
    `phiên B ${waitText(wA)}, rồi trừ 40 trên số dư mới 20 → ví A = ${fA.A} (âm), tổng vẫn ${fA.total}`);

  heading('B. Ghi tuyệt đối: app tự tính số dư mới rồi SET balance = <số>');
  await seed();
  await A.query('BEGIN;');
  const aReadB = (await A.query('SELECT balance FROM l01_wallets WHERE id = 1;')).rows[0].balance;
  await B.query('BEGIN;');
  const bReadB = (await B.query('SELECT balance FROM l01_wallets WHERE id = 1;')).rows[0].balance;
  say(`  app: phiên A tính ${aReadB} - 30 = ${aReadB - 30}, phiên B tính ${bReadB} - 40 = ${bReadB - 40}`);
  await A.query(`UPDATE l01_wallets SET balance = ${aReadB - 30} WHERE id = 1;`);
  const pB = settle(B.query(`UPDATE l01_wallets SET balance = ${bReadB - 40} WHERE id = 1;`));
  const wB = await waitBlocked(O, pid.B, pid, { unless: pB });
  await A.query('UPDATE l01_wallets SET balance = balance + 30 WHERE id = 2;');
  await A.query('COMMIT;');
  const rB = await pB;
  await B.query('UPDATE l01_wallets SET balance = balance + 40 WHERE id = 3;');
  await B.query('COMMIT;');
  const fB = await wallets();
  record('B', 'ghi tuyệt đối (lost update)', fB, wB, rB.ok ? `ghi đè số dư, UPDATE ${rB.rowCount}` : rB.code, rB.code);
  ok(rB.ok && fB.A === bReadB - 40 && fB.total === 80,
    `phiên B ${waitText(wB)}, rồi ghi đè ${bReadB - 40} lên kết quả của A → ví A = ${fB.A}, tổng = ${fB.total} thay vì 50 (in thêm ${fB.total - 50} tiền)`);

  heading('C. SELECT … FOR UPDATE rồi mới kiểm tra số dư');
  await seed();
  await A.query('BEGIN;');
  const aReadC = (await A.query('SELECT balance FROM l01_wallets WHERE id = 1 FOR UPDATE;')).rows[0].balance;
  say(`  app: phiên A đọc ${aReadC} và đang giữ khóa dòng ví A`);
  await B.query('BEGIN;');
  const pC = settle(B.query('SELECT balance FROM l01_wallets WHERE id = 1 FOR UPDATE;'));
  const wC = await waitBlocked(O, pid.B, pid, { unless: pC });
  await A.query('UPDATE l01_wallets SET balance = balance - 30 WHERE id = 1;');
  await A.query('UPDATE l01_wallets SET balance = balance + 30 WHERE id = 2;');
  await A.query('COMMIT;');
  const rC = await pC;
  const bReadC = rC.rows[0]?.balance ?? null;
  const refusedC = rC.ok && bReadC < 40; // app kiểm tra SAU khi đã khóa dòng
  say(`  app: phiên B đọc ${bReadC} (≥ 40: ${refusedC ? 'thiếu → từ chối, ROLLBACK' : 'đủ → chuyển'})`);
  if (refusedC || !rC.ok) await B.query('ROLLBACK;');
  else {
    await B.query('UPDATE l01_wallets SET balance = balance - 40 WHERE id = 1;');
    await B.query('UPDATE l01_wallets SET balance = balance + 40 WHERE id = 3;');
    await B.query('COMMIT;');
  }
  const fC = await wallets();
  record('C', 'SELECT … FOR UPDATE', fC, wC, refusedC ? `đọc ${bReadC}, từ chối` : `đọc ${bReadC}, chuyển`, rC.code);
  ok(wC.blocked && wC.waitEvent === 'Lock/transactionid' && bReadC === 20 && refusedC && fC.A === 20 && fC.total === 50,
    `FOR UPDATE: phiên B ${waitText(wC)}, đọc ${bReadC}, từ chối → ví A = ${fC.A}, tổng ${fC.total}`);

  heading('D. UPDATE có điều kiện: … WHERE id = 1 AND balance >= <số tiền>');
  await seed();
  await A.query('BEGIN;');
  const uA = await A.query('UPDATE l01_wallets SET balance = balance - 30 WHERE id = 1 AND balance >= 30;');
  await B.query('BEGIN;');
  const pD = settle(B.query('UPDATE l01_wallets SET balance = balance - 40 WHERE id = 1 AND balance >= 40;'));
  const wD = await waitBlocked(O, pid.B, pid, { unless: pD });
  await A.query('UPDATE l01_wallets SET balance = balance + 30 WHERE id = 2;');
  await A.query('COMMIT;');
  const rD = await pD;
  say(`  app: phiên A UPDATE ${uA.rowCount} dòng; phiên B UPDATE ${rD.rowCount ?? rD.code} dòng (${rD.rowCount === 1 ? 'đủ tiền → cộng ví C' : '0 dòng = không đủ tiền → ROLLBACK'})`);
  if (rD.rowCount === 1) {
    await B.query('UPDATE l01_wallets SET balance = balance + 40 WHERE id = 3;');
    await B.query('COMMIT;');
  } else await B.query('ROLLBACK;');
  const fD = await wallets();
  record('D', 'UPDATE … AND balance >= 40', fD, wD, `rowCount ${rD.rowCount ?? rD.code}`, rD.code);
  ok(rD.ok && rD.rowCount === 0 && fD.A === 20 && fD.total === 50,
    `phiên B ${waitText(wD)}, điều kiện được kiểm lại trên số dư mới 20 → rowCount ${rD.rowCount}, ví A = ${fD.A}`);

  heading('E. Thêm CHECK (balance >= 0) rồi lặp lại cách A');
  await seed();
  await O.query('ALTER TABLE l01_wallets ADD CONSTRAINT l01_wallets_balance_check CHECK (balance >= 0)');
  say('  (quan sát) đã thêm CONSTRAINT l01_wallets_balance_check CHECK (balance >= 0) vào bảng nháp');
  await A.query('BEGIN;');
  await A.query('SELECT balance FROM l01_wallets WHERE id = 1;');
  await B.query('BEGIN;');
  await B.query('SELECT balance FROM l01_wallets WHERE id = 1;');
  await A.query('UPDATE l01_wallets SET balance = balance - 30 WHERE id = 1;');
  const pE = settle(B.query('UPDATE l01_wallets SET balance = balance - 40 WHERE id = 1;'));
  const wE = await waitBlocked(O, pid.B, pid, { unless: pE });
  await A.query('UPDATE l01_wallets SET balance = balance + 30 WHERE id = 2;');
  await A.query('COMMIT;');
  const rE = await pE;
  say(`  phiên B nhận ${rE.ok ? `UPDATE ${rE.rowCount}` : `${rE.code}: ${rE.message}`}`);
  if (rE.ok) {
    await B.query('UPDATE l01_wallets SET balance = balance + 40 WHERE id = 3;');
    await B.query('COMMIT;');
  } else await B.query('ROLLBACK;');
  const fE = await wallets();
  record('E', 'CHECK (balance >= 0)', fE, wE, rE.ok ? `UPDATE ${rE.rowCount}` : `${rE.code}, ROLLBACK`, rE.code);
  ok(rE.code === '23514' && fE.A === 20 && fE.total === 50,
    `phiên B ${waitText(wE)}, rồi nhận ${rE.code ?? 'không lỗi'} (vi phạm CHECK) → ví A = ${fE.A}, tổng ${fE.total}`);

  say('\nTóm tắt 5 cách (dữ liệu cho widget W2):');
  printTable(Object.entries(out).map(([k, v]) => ({ cách: `${k}. ${v.mechanism}`, 'ví A cuối': v.final.A, tổng: v.total,
    'phiên B chờ?': v.waited ? v.waitEvent : 'không', 'phiên B': v.bOutcome })), ['cách', 'ví A cuối', 'tổng', 'phiên B chờ?', 'phiên B']);
  emitJson({ lab: '14.01', expectedTotal: 50, variants: out });
  if (verdicts.includes(false)) process.exitCode = 1;
} finally {
  await lab.close();
}
