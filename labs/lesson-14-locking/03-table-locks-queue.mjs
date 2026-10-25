// Lab 14.03 — Khóa mức bảng (slide 6): mỗi câu lệnh lấy 1 "mode" khóa bảng riêng, và hàng đợi khóa của DDL.
// A. UPDATE → RowExclusiveLock, SELECT … FOR UPDATE → RowShareLock, SELECT thường → AccessShareLock (xem pg_locks).
// B. A giữ SELECT mở → B ALTER TABLE chờ (Lock/relation) → C SELECT thường xếp hàng SAU B: pg_blocking_pids(C) = {B}.
// C. Cách chữa khi migrate: B đặt lock_timeout = '1s' → 55P03 sau ~1 s, C chạy tiếp dù A vẫn mở transaction.
// Chạy: npm run lab3   (thêm -- --json để in payload JSON cho widget W3)
import { openLab, waitBlocked, settle, heading, verdict, printTable, emitJson, jsonMode } from './lock-kit.mjs';

if (!jsonMode) console.log('Lab 14.03 — Khóa mức bảng và hàng đợi DDL: ALTER chờ kéo theo cả SELECT (slide 6)');
const lab = await openLab('03', ['A', 'B', 'C']);
const { O, A, B, C, pid } = lab;
const roleOf = Object.fromEntries(Object.entries(pid).map(([r, p]) => [p, r]));
const json = { lab: '03', modes: [], queue: [], timeout: null };
const verdicts = []; // ✘ nào cũng làm exit code = 1 (như Lab 01)
const ok = (cond, text) => verdicts.push(verdict(cond, text));

// O hỏi pg_locks: các khóa mức bảng (locktype = relation) trên l03_contracts, đổi pid thành tên vai.
async function tableLocks(roles) {
  const { rows } = await O.query(`SELECT pid, mode, granted FROM pg_locks
    WHERE locktype = 'relation' AND relation = 'l03_contracts'::regclass AND pid = ANY($1)`, [roles.map((r) => pid[r])]);
  return rows.map((r) => ({ vai: roleOf[r.pid], mode: r.mode, granted: r.granted ? 'đã cấp' : 'ĐANG CHỜ' }))
    .sort((a, b) => a.vai.localeCompare(b.vai));
}

try {
  // Bảng nháp chép từ playground contracts (100 hợp đồng đầu).
  await O.query(`DROP TABLE IF EXISTS l03_contracts;
    CREATE TABLE l03_contracts AS SELECT * FROM contracts WHERE id <= 100;
    ALTER TABLE l03_contracts ADD PRIMARY KEY (id)`);

  heading('A. Mỗi câu lệnh lấy một mode khóa bảng (pg_locks)');
  const kinds = [
    { kind: 'UPDATE', sql: 'UPDATE l03_contracts SET total = total + 1 WHERE id = 1;', expect: 'RowExclusiveLock' },
    { kind: 'SELECT … FOR UPDATE', sql: 'SELECT id FROM l03_contracts WHERE id = 1 FOR UPDATE;', expect: 'RowShareLock' },
    { kind: 'SELECT thường', sql: 'SELECT count(*) FROM l03_contracts;', expect: 'AccessShareLock' },
  ];
  const modeRows = [];
  for (const k of kinds) {
    await A.query('BEGIN;');
    await A.query(k.sql);
    const locks = await tableLocks(['A']);
    const mode = locks.map((l) => l.mode).join(', ');
    modeRows.push({ 'câu lệnh': k.kind, 'mode trên l03_contracts': mode });
    json.modes.push({ statement: k.kind, sql: k.sql, mode });
    ok(mode === k.expect, `${k.kind} → ${mode} (kỳ vọng ${k.expect})`);
    await A.query('ROLLBACK;');
  }
  printTable(modeRows, ['câu lệnh', 'mode trên l03_contracts']);
  // UPDATE (RowExclusiveLock) và FOR UPDATE (RowShareLock) là 2 mode KHÁC nhau dù cùng khóa dòng.

  heading('B. Hàng đợi DDL: A giữ SELECT → B ALTER chờ → C SELECT xếp hàng sau B');
  await A.query('BEGIN;');
  await A.query('SELECT count(*) FROM l03_contracts;'); // A giữ AccessShareLock tới khi COMMIT
  const pB = settle(B.query('ALTER TABLE l03_contracts ADD COLUMN note text;'));
  const wB = await waitBlocked(O, pid.B, pid, { unless: pB });
  ok(wB.blocked && wB.waitEvent === 'Lock/relation' && wB.blockers.join() === 'A',
    `B (ALTER cần AccessExclusiveLock) chờ: ${wB.waitEvent ?? 'không chờ'}, bị chặn bởi {${wB.blockers?.join(', ') ?? ''}}`);
  const pC = settle(C.query('SELECT count(*) FROM l03_contracts;'));
  const wC = await waitBlocked(O, pid.C, pid, { unless: pC });
  ok(wC.blocked && wC.waitEvent === 'Lock/relation' && wC.blockers.join() === 'B',
    `C (SELECT thường) chờ: ${wC.waitEvent ?? 'không chờ'}, pg_blocking_pids(C) = {${wC.blockers?.join(', ') ?? ''}} (kỳ vọng {B})`);
  const queue = await tableLocks(['A', 'B', 'C']);
  printTable(queue, ['vai', 'mode', 'granted']);
  const locksOf = (r) => queue.filter((q) => q.vai === r).map((q) => ({ mode: q.mode, granted: q.granted === 'đã cấp' }));
  json.queue = [
    { role: 'A', sql: 'SELECT count(*) FROM l03_contracts;', locks: locksOf('A'), blockers: [] },
    { role: 'B', sql: 'ALTER TABLE l03_contracts ADD COLUMN note text;', locks: locksOf('B'), waitEvent: wB.waitEvent ?? null, blockers: wB.blockers ?? [] },
    { role: 'C', sql: 'SELECT count(*) FROM l03_contracts;', locks: locksOf('C'), waitEvent: wC.waitEvent ?? null, blockers: wC.blockers ?? [] },
  ];
  await A.query('COMMIT;'); // A nhả khóa → B chạy ALTER (tự commit) → C mới được đọc
  const rB = await pB;
  const rC = await pC;
  ok(rB.ok && rC.ok, `A COMMIT → B ALTER ${rB.ok ? 'xong' : rB.code}, rồi C đọc được ${rC.rows[0]?.count ?? rC.code} dòng`);

  heading('C. Chữa bằng lock_timeout: B bỏ cuộc 55P03, C chạy tiếp');
  await O.query('ALTER TABLE l03_contracts DROP COLUMN note'); // trả bảng về như cũ để chạy lại đúng câu ALTER
  await A.query('BEGIN;');
  await A.query('SELECT count(*) FROM l03_contracts;');
  await B.query("SET lock_timeout = '1s';");
  const pB2 = settle(B.query('ALTER TABLE l03_contracts ADD COLUMN note text;'));
  const wB2 = await waitBlocked(O, pid.B, pid, { unless: pB2 });
  const pC2 = settle(C.query('SELECT count(*) FROM l03_contracts;'));
  const wC2 = await waitBlocked(O, pid.C, pid, { unless: pC2 });
  if (!jsonMode) console.log(`B chờ: ${wB2.waitEvent ?? 'không chờ'} · C chờ sau {${wC2.blockers?.join(', ') ?? ''}}`);
  const rB2 = await pB2;
  const rC2 = await pC2;
  const { rows: [st] } = await O.query('SELECT state FROM pg_stat_activity WHERE pid = $1', [pid.A]);
  if (!jsonMode) console.log(`B nhận ${rB2.code ?? 'ok'} sau ${Math.round(rB2.ms)} ms (mẫu trên máy này): ${rB2.message ?? ''}`);
  ok(wB2.blocked && wC2.blocked && rB2.code === '55P03' && rC2.ok && st.state === 'idle in transaction',
    `B (lock_timeout 1s) → ${rB2.code ?? 'ok'}; C trả ${rC2.rows[0]?.count ?? rC2.code} dòng trong khi A vẫn "${st.state}"`);
  json.timeout = { setting: '1s', code: rB2.code ?? null, message: rB2.message ?? null, ms: Math.round(rB2.ms),
    cWaitedBehind: wC2.blockers ?? [], cReturned: rC2.ok, aState: st.state };
  await B.query("SET lock_timeout = '5s';"); // trả B về mức 5s mà kit đặt cho mọi phiên
  await A.query('ROLLBACK;');
  emitJson(json);
} finally { await lab.close(); }
if (verdicts.includes(false)) process.exitCode = 1;
