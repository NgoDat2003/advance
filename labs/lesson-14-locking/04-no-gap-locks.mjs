// Lab 14.04 — PostgreSQL không có gap lock / next-key lock như MySQL (slide 7–11, 20).
// A. Ở READ COMMITTED và REPEATABLE READ: UPDATE dải id 2..5 khóa đúng 3 dòng có thật (2, 4, 5);
//    B INSERT id 3 (rơi vào "khe") KHÔNG bị chặn, còn B UPDATE id 4 phải chờ (record lock).
// B. UPDATE theo cột không có index (store_id = 44): quét cả bảng nhưng chỉ khóa 4 dòng khớp (đếm bằng pgrowlocks).
// C. SERIALIZABLE: đọc dải tạo SIReadLock trong pg_locks, nhưng SIReadLock không chặn ai.
// Chạy: npm run lab4
import { openLab, waitBlocked, settle, heading, verdict, printTable } from './lock-kit.mjs';

console.log('Lab 14.04 — Không có gap lock: chỉ dòng có thật bị khóa, khe giữa các id vẫn INSERT được (slide 7–11, 20)');
const lab = await openLab('04', ['A', 'B']);
const { O, A, B, pid } = lab;
const verdicts = []; // ✘ nào cũng làm exit code = 1 (như Lab 01)
const ok = (cond, text) => verdicts.push(verdict(cond, text));

try {
  // Bảng nháp: tài khoản id 1, 2, 4, 5, 7 (cố ý thiếu 3 và 6 để có "khe"), chép từ playground contracts.
  await O.query(`DROP TABLE IF EXISTS l04_accounts, l04_contracts;
    CREATE TABLE l04_accounts AS SELECT id, 100 AS balance FROM contracts WHERE id IN (1, 2, 4, 5, 7);
    ALTER TABLE l04_accounts ADD PRIMARY KEY (id);
    CREATE TABLE l04_contracts AS SELECT * FROM contracts;
    ALTER TABLE l04_contracts ADD PRIMARY KEY (id)`); // chỉ có PK, KHÔNG có index trên store_id
  const ids = (await O.query('SELECT string_agg(id::text, \', \' ORDER BY id) AS s FROM l04_accounts')).rows[0].s;
  console.log(`l04_accounts có id: ${ids}`);

  heading('A. UPDATE dải id 2..5: khe id 3 vẫn INSERT được, dòng id 4 bị khóa');
  for (const level of ['READ COMMITTED', 'REPEATABLE READ']) {
    console.log(`\n-- Mức cô lập ${level} --`);
    await A.query(`BEGIN ISOLATION LEVEL ${level};`);
    const rA = await A.query('UPDATE l04_accounts SET balance = balance + 10 WHERE id BETWEEN 2 AND 5;');
    await B.query(`BEGIN ISOLATION LEVEL ${level};`);
    // B chèn id 3 vào giữa dải A vừa UPDATE: MySQL (gap lock) sẽ chặn, PostgreSQL thì không.
    const pIns = settle(B.query('INSERT INTO l04_accounts (id, balance) VALUES (3, 100);'));
    const wIns = await waitBlocked(O, pid.B, pid, { unless: pIns });
    const rIns = await pIns;
    ok(rA.rowCount === 3 && !wIns.blocked && rIns.ok,
      `${level}: A UPDATE ${rA.rowCount} dòng; B INSERT id 3 ${wIns.blocked ? `BỊ CHẶN (${wIns.waitEvent})` : 'không bị chặn'} → ${rIns.ok ? `INSERT ${rIns.rowCount}` : rIns.code}`);
    // B sửa id 4 — dòng có thật A đang khóa: phải chờ A.
    const pUpd = settle(B.query('UPDATE l04_accounts SET balance = balance - 1 WHERE id = 4;'));
    const wUpd = await waitBlocked(O, pid.B, pid, { unless: pUpd });
    ok(wUpd.blocked && wUpd.waitEvent === 'Lock/transactionid' && wUpd.blockers.join() === 'A',
      `${level}: B UPDATE id 4 chờ: ${wUpd.waitEvent ?? 'không chờ'}, bị chặn bởi {${wUpd.blockers?.join(', ') ?? ''}}`);
    await A.query('ROLLBACK;'); // A nhả khóa → B chạy tiếp
    const rUpd = await pUpd;
    ok(rUpd.ok && rUpd.rowCount === 1, `${level}: A ROLLBACK → B UPDATE id 4 xong (${rUpd.ok ? `UPDATE ${rUpd.rowCount}` : rUpd.code})`);
    await B.query('ROLLBACK;');
  }

  heading('B. UPDATE theo cột không index (store_id = 44): chỉ khóa dòng khớp (pgrowlocks)');
  const plan = (await O.query('EXPLAIN (COSTS OFF) UPDATE l04_contracts SET total = total + 1 WHERE store_id = 44')).rows
    .map((r) => r['QUERY PLAN'].trim());
  console.log(`Kế hoạch (O xem EXPLAIN): ${plan.join(' / ')}`);
  await B.query('BEGIN;');
  const rB = await B.query('UPDATE l04_contracts SET total = total + 1 WHERE store_id = 44;');
  // pgrowlocks đọc thẳng header từng dòng: liệt kê dòng nào đang bị khóa và khóa mode gì.
  const { rows: locked } = await O.query(`SELECT c.id, r.modes::text AS modes, r.locked_row AS ctid
    FROM pgrowlocks('l04_contracts') r JOIN l04_contracts c ON c.ctid = r.locked_row ORDER BY c.id`);
  printTable(locked, ['id', 'modes', 'ctid']);
  ok(plan.some((p) => p.includes('Seq Scan')) && rB.rowCount === 4 && locked.length === 4,
    `quét tuần tự cả ${(await O.query('SELECT count(*)::int AS n FROM l04_contracts')).rows[0].n} dòng, UPDATE ${rB.rowCount} dòng → pgrowlocks thấy ${locked.length} dòng bị khóa (kỳ vọng 4)`);
  // A sửa một dòng KHÔNG khớp store_id = 44 (id 2, cửa hàng 26): không bị chặn — PG chỉ khóa 4 dòng khớp; InnoDB (RR) thì khóa mọi record quét qua kèm khe.
  await A.query('BEGIN;');
  const pOther = settle(A.query('UPDATE l04_contracts SET total = total + 1 WHERE id = 2;'));
  const wOther = await waitBlocked(O, pid.A, pid, { unless: pOther });
  const rOther = await pOther;
  ok(!wOther.blocked && rOther.ok && rOther.rowCount === 1,
    `A UPDATE id 2 (không khớp) ${wOther.blocked ? `BỊ CHẶN (${wOther.waitEvent})` : 'không bị chặn'} → ${rOther.ok ? `UPDATE ${rOther.rowCount}` : rOther.code}`);
  await A.query('ROLLBACK;');
  await B.query('ROLLBACK;');

  heading('C. SERIALIZABLE: SIReadLock có trong pg_locks nhưng không chặn ai');
  await A.query('BEGIN ISOLATION LEVEL SERIALIZABLE;');
  const rRead = await A.query('SELECT id, balance FROM l04_accounts WHERE id BETWEEN 2 AND 5;');
  const { rows: si } = await O.query(`SELECT locktype, mode, count(*)::int AS n FROM pg_locks
    WHERE pid = $1 AND mode = 'SIReadLock' GROUP BY locktype, mode ORDER BY locktype`, [pid.A]);
  printTable(si, ['locktype', 'mode', 'n']);
  const siCount = si.reduce((s, r) => s + r.n, 0);
  // B ghi đúng vào dải A vừa đọc (chèn khe id 3, sửa id 4): không ai phải chờ.
  const pIns3 = settle(B.query('INSERT INTO l04_accounts (id, balance) VALUES (3, 100);'));
  const wIns3 = await waitBlocked(O, pid.B, pid, { unless: pIns3 });
  const rIns3 = await pIns3;
  const pUpd4 = settle(B.query('UPDATE l04_accounts SET balance = balance - 1 WHERE id = 4;'));
  const wUpd4 = await waitBlocked(O, pid.B, pid, { unless: pUpd4 });
  const rUpd4 = await pUpd4;
  ok(rRead.rowCount === 3 && siCount > 0 && !wIns3.blocked && !wUpd4.blocked && rIns3.ok && rUpd4.ok,
    `A đọc ${rRead.rowCount} dòng, giữ ${siCount} SIReadLock; B INSERT id 3 ${wIns3.blocked ? 'BỊ CHẶN' : 'không bị chặn'}, B UPDATE id 4 ${wUpd4.blocked ? 'BỊ CHẶN' : 'không bị chặn'}`);
  // SIReadLock chỉ là "dấu vết đọc" để SSI phát hiện xung đột lúc COMMIT (40001), không phải khóa chờ.
  await A.query('ROLLBACK;');
} finally { await lab.close(); }
if (verdicts.includes(false)) process.exitCode = 1;
