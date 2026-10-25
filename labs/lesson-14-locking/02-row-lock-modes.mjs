// Lab 14.02 — 4 chế độ khóa dòng của PostgreSQL: FOR KEY SHARE / FOR SHARE / FOR NO KEY UPDATE / FOR UPDATE.
// A: SELECT thường không bao giờ bị chặn. B: đo cả 16 ô xung đột bằng NOWAIT, so với bảng tài liệu PG 16 §13.3.2.
// C: UPDATE thường không chặn INSERT con có khóa ngoại, UPDATE khóa chính thì chặn. D: khóa dòng nằm ở đâu (pg_locks, xmax, pgrowlocks).
// Bảng nháp: l02_contracts (id 1–10), l02_flights + l02_bookings (FK). Chạy: npm run lab2 (thêm -- --json cho widget W1).
import { emitJson, heading, jsonMode, openLab, printTable, settle, verdict, waitBlocked } from './lock-kit.mjs';

const say = (s) => { if (!jsonMode) console.log(s); };
say('Lab 14.02 — Bốn chế độ khóa dòng: ai chặn ai, khóa FK và khóa dòng được lưu ở đâu (slide 3–5, 10, 14)');

const lab = await openLab('02');
const { O, A, B, pid } = lab;
const verdicts = [];
const ok = (cond, text) => verdicts.push(verdict(cond, text));
const out = {}; // payload --json cho widget W1 (ma trận 4×4)

const MODES = ['KEY SHARE', 'SHARE', 'NO KEY UPDATE', 'UPDATE'];
// Bảng tài liệu PG 16 §13.3.2 "Conflicting Row-Level Locks": true = xung đột (B phải chờ / NOWAIT → 55P03).
const DOCS = {
  'KEY SHARE': { 'KEY SHARE': false, SHARE: false, 'NO KEY UPDATE': false, UPDATE: true },
  SHARE: { 'KEY SHARE': false, SHARE: false, 'NO KEY UPDATE': true, UPDATE: true },
  'NO KEY UPDATE': { 'KEY SHARE': false, SHARE: true, 'NO KEY UPDATE': true, UPDATE: true },
  UPDATE: { 'KEY SHARE': true, SHARE: true, 'NO KEY UPDATE': true, UPDATE: true },
};
// Khóa của 1 phiên nhìn từ O. Cột "xid của" đổi số transaction thành vai (A/B) để output giống nhau giữa các lần chạy.
async function locksOf(role, xids) {
  const { rows } = await O.query(`SELECT l.locktype, COALESCE(c.relname, '') AS relation, l.mode, l.granted, l.transactionid::text AS tx
    FROM pg_locks l LEFT JOIN pg_class c ON c.oid = l.relation
    WHERE l.pid = $1 AND l.locktype IN ('relation', 'transactionid', 'tuple')
    ORDER BY l.locktype, relation, l.mode`, [pid[role]]);
  const owner = Object.fromEntries(Object.entries(xids).map(([r, x]) => [x, r]));
  return rows.map((r) => ({ locktype: r.locktype, relation: r.relation, mode: r.mode, granted: r.granted ? 'có' : 'CHỜ',
    'xid của': r.tx ? (owner[r.tx] ?? 'khác') : '', tx: r.tx }));
}
const ownXid = (rows) => rows.find((r) => r.locktype === 'transactionid' && r.mode === 'ExclusiveLock' && r.granted === 'có')?.tx ?? null;
const LOCK_COLS = ['locktype', 'relation', 'mode', 'granted', 'xid của'];
const strip = (rows) => rows.map(({ tx, ...r }) => r); // bỏ số xid thô khỏi JSON

try {
  await O.query(`DROP TABLE IF EXISTS l02_bookings, l02_flights, l02_contracts;
    CREATE TABLE l02_contracts AS SELECT * FROM contracts WHERE id <= 10; ALTER TABLE l02_contracts ADD PRIMARY KEY (id);
    CREATE TABLE l02_flights AS SELECT * FROM flights; ALTER TABLE l02_flights ADD PRIMARY KEY (id);
    CREATE TABLE l02_bookings (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      flight_id int NOT NULL REFERENCES l02_flights, passenger text NOT NULL)`);

  heading('A. SELECT thường không bị FOR UPDATE chặn (MVCC: người đọc không chờ người ghi)');
  await A.query('BEGIN;');
  await A.query('SELECT id, total FROM l02_contracts WHERE id = 1 FOR UPDATE;');
  const pA = settle(B.query('SELECT id, total FROM l02_contracts WHERE id = 1;'));
  const wA = await waitBlocked(O, pid.B, pid, { unless: pA });
  const rA = await pA;
  await A.query('ROLLBACK;');
  out.plainSelectBlocked = wA.blocked;
  ok(!wA.blocked && rA.ok && rA.rowCount === 1, `A giữ FOR UPDATE, B SELECT thường ${wA.blocked ? `bị chặn (${wA.waitEvent})` : `trả về ${rA.rowCount} dòng ngay, không chờ`}`);

  heading('B. Ma trận 4×4: A giữ FOR <held>, B xin FOR <req> NOWAIT');
  const matrix = {};
  let conflicts = 0;
  let matches = 0;
  for (const held of MODES) {
    matrix[held] = {};
    for (const req of MODES) {
      await A.query('BEGIN;');
      await A.query(`SELECT id FROM l02_contracts WHERE id = 1 FOR ${held};`);
      await B.query('BEGIN;');
      const r = await settle(B.query(`SELECT id FROM l02_contracts WHERE id = 1 FOR ${req} NOWAIT;`));
      await A.query('ROLLBACK;');
      await B.query('ROLLBACK;');
      const cell = r.ok ? 'ok' : r.code;
      matrix[held][req] = cell;
      if (cell === '55P03') conflicts += 1;
      if ((cell === '55P03') === DOCS[held][req] && (cell === 'ok' || cell === '55P03')) matches += 1;
    }
  }
  say('\nĐo được (hàng = A đang giữ, cột = B xin NOWAIT):');
  printTable(MODES.map((h) => ({ 'A giữ \\ B xin': h, ...matrix[h] })), ['A giữ \\ B xin', ...MODES]);
  say('\nTài liệu PG 16 §13.3.2 (X = xung đột):');
  printTable(MODES.map((h) => ({ 'A giữ \\ B xin': h, ...Object.fromEntries(MODES.map((q) => [q, DOCS[h][q] ? 'X' : '·'])) })), ['A giữ \\ B xin', ...MODES]);
  out.modes = MODES;
  out.matrix = matrix;
  out.docs = DOCS;
  ok(matches === 16 && conflicts === 10, `${matches}/16 ô khớp tài liệu: ${conflicts} ô 55P03, ${16 - conflicts} ô ok (tài liệu: 10 xung đột / 6 không)`);
  say(`  đọc nhanh: KEY SHARE chỉ đụng UPDATE; UPDATE thường = NO KEY UPDATE nên không đụng KEY SHARE (khóa của kiểm tra FK)`);

  heading('C. Khóa ngoại: INSERT vé con xin FOR KEY SHARE trên chuyến bay cha');
  await A.query('BEGIN;');
  await A.query('UPDATE l02_flights SET seats = seats - 1 WHERE id = 1;');
  await B.query('BEGIN;');
  const pC1 = settle(B.query("INSERT INTO l02_bookings (flight_id, passenger) VALUES (1, 'Bình');"));
  const wC1 = await waitBlocked(O, pid.B, pid, { unless: pC1 });
  const rC1 = await pC1;
  await B.query('ROLLBACK;');
  await A.query('ROLLBACK;');
  ok(!wC1.blocked && rC1.ok, `UPDATE cột thường (seats) giữ NO KEY UPDATE → INSERT con ${wC1.blocked ? `bị chặn (${wC1.waitEvent})` : `chạy ngay (INSERT ${rC1.rowCount}), không chờ`}`);
  await A.query('BEGIN;');
  await A.query('UPDATE l02_flights SET id = 10 WHERE id = 1;');
  await B.query('BEGIN;');
  const pC2 = settle(B.query("INSERT INTO l02_bookings (flight_id, passenger) VALUES (1, 'Bình');"));
  const wC2 = await waitBlocked(O, pid.B, pid, { unless: pC2 });
  await A.query('ROLLBACK;');
  const rC2 = await pC2;
  await B.query('ROLLBACK;');
  out.fk = { plainUpdateBlocksChildInsert: wC1.blocked, keyUpdateBlocksChildInsert: wC2.blocked, keyUpdateWaitEvent: wC2.waitEvent ?? null };
  ok(wC2.blocked && rC2.ok, `UPDATE khóa chính (id) giữ FOR UPDATE → INSERT con ${wC2.blocked ? `chờ ${wC2.waitEvent} (bị chặn bởi ${wC2.blockers.join(', ')})` : 'không chờ'}, chạy tiếp sau khi A ROLLBACK`);

  heading('D. Khóa dòng nằm ở đâu: pg_locks, xmax, pgrowlocks');
  await A.query('BEGIN;');
  await A.query('UPDATE l02_contracts SET total = total + 1 WHERE id = 1;');
  const holderRaw = await locksOf('A', {});
  const xidA = ownXid(holderRaw);
  const holder = await locksOf('A', { A: xidA });
  say('\npg_locks của người giữ A (sau UPDATE id 1, chưa COMMIT):');
  printTable(holder, LOCK_COLS);
  const tupleA = holder.filter((r) => r.locktype === 'tuple').length;
  ok(holder.some((r) => r.locktype === 'relation' && r.relation === 'l02_contracts' && r.mode === 'RowExclusiveLock')
    && xidA !== null && tupleA === 0,
  `A giữ RowExclusiveLock trên bảng + transactionid ExclusiveLock của chính mình; ${tupleA} dòng tuple → khóa dòng không nằm trong pg_locks`);

  const xm = (await O.query('SELECT id, xmax::text AS xmax FROM l02_contracts WHERE id = 1')).rows[0];
  say('\nO đọc phiên bản đã commit của dòng 1:');
  printTable([{ id: xm.id, xmax: xm.xmax, 'xmax = xid(A)?': xm.xmax === xidA ? 'đúng' : 'sai' }], ['id', 'xmax', 'xmax = xid(A)?']);
  ok(xm.xmax === xidA, `xmax của dòng 1 ${xm.xmax === xidA ? '=' : '≠'} xid(A): khóa dòng được ghi ngay trên tuple`);

  const { rows: rl } = await O.query(`SELECT locked_row::text AS ctid, locker::text AS xid, multi, array_to_string(modes, ',') AS modes
    FROM lab14_locking.pgrowlocks('l02_contracts')`);
  const rowLocks = rl.map((r) => ({ ...r, 'của': r.xid === xidA ? 'A' : 'khác' }));
  say("\npgrowlocks('l02_contracts') — đọc thẳng trên trang dữ liệu:");
  printTable(rowLocks, ['ctid', 'xid', 'multi', 'modes', 'của']);
  ok(rowLocks.length === 1 && rowLocks[0]['của'] === 'A' && rowLocks[0].modes !== '',
    `pgrowlocks: ${rowLocks.length} dòng bị khóa, người khóa ${rowLocks[0]?.['của'] ?? '-'}, mode "${rowLocks[0]?.modes ?? '-'}"`);

  await B.query('BEGIN;');
  const pD = settle(B.query('UPDATE l02_contracts SET total = total + 1 WHERE id = 1;'));
  const wD = await waitBlocked(O, pid.B, pid, { unless: pD });
  const waiterRaw = await locksOf('B', { A: xidA });
  const waiter = await locksOf('B', { A: xidA, B: ownXid(waiterRaw) });
  say(`\npg_locks của người chờ đầu tiên B (${wD.blocked ? `đang chờ ${wD.waitEvent}` : 'không chờ'}):`);
  printTable(waiter, LOCK_COLS);
  const tupleGranted = waiter.some((r) => r.locktype === 'tuple' && r.mode === 'ExclusiveLock' && r.granted === 'có');
  const shareWait = waiter.some((r) => r.locktype === 'transactionid' && r.mode === 'ShareLock' && r.granted === 'CHỜ' && r['xid của'] === 'A');
  ok(wD.blocked && tupleGranted && shareWait,
    `B giữ tuple ExclusiveLock (đứng đầu hàng chờ của dòng) và CHỜ transactionid ShareLock trên xid của A`);
  await A.query('ROLLBACK;');
  const rD = await pD;
  await B.query('ROLLBACK;');
  say(`  A ROLLBACK → B chạy tiếp: ${rD.ok ? `UPDATE ${rD.rowCount}` : rD.code}`);
  out.lockShapes = { holder: strip(holder), waiter: strip(waiter), xmaxIsXidA: xm.xmax === xidA,
    pgrowlocks: rowLocks.map(({ ctid, xid, ...r }) => r) };

  emitJson({ lab: '14.02', ...out });
  if (verdicts.includes(false)) process.exitCode = 1;
} finally {
  await lab.close();
}
