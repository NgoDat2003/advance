// Lab 14.05 phần A (slide 12, 14, 20): hai phiên UPDATE chéo id 1 ↔ 2 → PostgreSQL phát hiện deadlock (40P01) và hủy 1 phiên.
// Mục A: deadlock_timeout mặc định (1s) → người chờ TRƯỚC (A) hết giờ trước, tự chạy kiểm tra deadlock và tự bị hủy.
// Mục B: A đặt deadlock_timeout = 4s → B (người chờ sau, vẫn 1s) kiểm tra trước nên B bị hủy.
// Chỉ file này được SET deadlock_timeout (chỉ trên phiên A, RESET ngay sau). Bảng nháp: l05_contracts (id 1–10).
// Chạy riêng được (node 05-deadlock-ordering-part-a.mjs); kết quả cho widget W4 xuất qua `resultA`.
import { openLab, waitBlocked, settle, rolesInDetail, heading, verdict, jsonMode } from './lock-kit.mjs';

// U(n): đúng câu lệnh của bảng M1 trong guide (guide đổi l05_contracts → contracts).
const U = (n) => `UPDATE l05_contracts SET total = total + 1 WHERE id = ${n};`;
const other = (r) => (r === 'A' ? 'B' : 'A');
const say = (s) => { if (!jsonMode) console.log(s); }; // chế độ --json: chỉ in JSON

export const resultA = {};
let allOk = true;
const check = (ok, text) => { allOk = verdict(ok, text) && allOk; return ok; };

const lab = await openLab('05');
const { O, A, B, pid } = lab;

/** Hỏi O đến khi câu lệnh hiện tại của phiên `p` đã chạy (đang chờ) ít nhất `ms` theo đồng hồ server; trả về số ms đã chờ. */
const LEAD_MS = 25; // đủ để A hết giờ trước (đo 120/120 lần), vẫn giữ thời gian chờ của B quanh 1 s
async function waitedAtLeast(p, ms) {
  for (;;) {
    const { rows } = await O.query(`SELECT (extract(epoch FROM clock_timestamp() - query_start) * 1000)::int AS waited
      FROM pg_stat_activity WHERE pid = $1 AND wait_event_type = 'Lock'`, [p]);
    if (!rows.length || rows[0].waited >= ms) return rows[0]?.waited ?? 0;
    await new Promise((r) => setTimeout(r, 5));
  }
}

/** Một vòng UPDATE chéo: A giữ dòng 1, B giữ dòng 2, rồi mỗi bên xin dòng của bên kia → vòng tròn A → B → A. */
async function crossRound() {
  const events = [];
  await A.query('BEGIN;');
  await A.query(U(1));
  await B.query('BEGIN;');
  await B.query(U(2));
  events.push({ role: 'A', sql: 'BEGIN;', event: 'ok' }, { role: 'A', sql: U(1), event: 'ok', rows: 1 },
    { role: 'B', sql: 'BEGIN;', event: 'ok' }, { role: 'B', sql: U(2), event: 'ok', rows: 1 });

  const pA = settle(A.query(U(2))); // A cần dòng 2 mà B đang giữ → treo
  const wA = await waitBlocked(O, pid.A, pid, { unless: pA });
  check(wA.blocked && wA.waitEvent === 'Lock/transactionid' && wA.blockers.join() === 'B',
    `A chờ: ${wA.waitEvent ?? 'không chờ'}, bị chặn bởi ${wA.blockers?.join(', ') ?? '-'}`);
  events.push({ role: 'A', sql: U(2), event: 'wait', waitsFor: wA.blockers?.join(', ') ?? null });
  // A phải là người chờ trước một khoảng rõ ràng (đo bằng đồng hồ server): trên Docker/WSL2 đồng hồ deadlock_timeout
  // của hai phiên lệch nhau vài chục ms, nên nếu B khép vòng chỉ ~1 ms sau A thì thỉnh thoảng B hết giờ trước.
  const lead = await waitedAtLeast(pid.A, LEAD_MS);
  say(`(A đã chờ ${lead} ms theo đồng hồ server trước khi B khép vòng)`);

  const pB = settle(B.query(U(1))); // B cần dòng 1 mà A đang giữ → khép vòng
  const wB = await waitBlocked(O, pid.B, pid, { unless: pB });
  check(wB.blocked && wB.waitEvent === 'Lock/transactionid' && wB.blockers.join() === 'A',
    `B chờ: ${wB.waitEvent ?? 'không chờ'}, bị chặn bởi ${wB.blockers?.join(', ') ?? '-'} → vòng tròn A → B → A`);
  events.push({ role: 'B', sql: U(1), event: 'wait', waitsFor: wB.blockers?.join(', ') ?? null });

  // Chờ server tự gỡ: đúng 1 phiên nhận 40P01, phiên kia chạy tiếp.
  const res = { A: await pA, B: await pB };
  const victims = ['A', 'B'].filter((r) => res[r].code === '40P01');
  const victim = victims.length === 1 ? victims[0] : null;
  const survivor = victim ? other(victim) : null;
  if (victim) {
    events.push({ role: victim, sql: U(victim === 'A' ? 2 : 1), event: '40P01' },
      { role: survivor, sql: U(survivor === 'A' ? 2 : 1), event: res[survivor].ok ? 'ok' : res[survivor].code, ms: Math.round(res[survivor].ms) });
  }
  return { res, deadlocks: victims.length, victim, survivor, events, lead };
}

/** In 40P01 × N, nạn nhân, DETAIL theo vai và thời gian người sống sót phải chờ. */
function report(r) {
  say(`40P01 × ${r.deadlocks} — nạn nhân: ${r.victim ?? '?'}`);
  const v = r.victim ? r.res[r.victim] : null;
  const detail = v ? rolesInDetail(v.detail, pid).split('\n').filter(Boolean) : [];
  if (v) say(`${r.victim} nhận: ERROR ${v.code}: ${v.message}`);
  if (detail.length) say('DETAIL (pid đã đổi thành vai):');
  for (const line of detail) say(`  ${line}`);
  return { detail, survivorMs: r.survivor ? Math.round(r.res[r.survivor].ms) : NaN };
}

/** Kết thúc vòng: người sống sót COMMIT, nạn nhân ROLLBACK (transaction của nạn nhân đã hỏng). */
async function endRound(r) {
  if (r.victim) {
    await lab[r.survivor].query('COMMIT;');
    await lab[r.victim].query('ROLLBACK;');
    r.events.push({ role: r.survivor, sql: 'COMMIT;', event: 'ok' }, { role: r.victim, sql: 'ROLLBACK;', event: 'ok' });
  } else {
    await A.query('ROLLBACK;');
    await B.query('ROLLBACK;');
  }
}

try {
  await O.query(`DROP TABLE IF EXISTS l05_contracts;
    CREATE TABLE l05_contracts WITH (autovacuum_enabled = false) AS SELECT * FROM contracts WHERE id <= 10;
    ALTER TABLE l05_contracts ADD PRIMARY KEY (id)`);

  heading('A. deadlock_timeout mặc định (1s): ai bị hủy?');
  const a = await crossRound();
  const ra = report(a);
  check(a.deadlocks === 1 && a.victim === 'A',
    `đúng 1 lỗi 40P01, A bị hủy: A chờ trước nên deadlock_timeout của A hết trước, A tự kiểm tra và tự hủy (kỳ vọng A)`);
  check(ra.detail.length >= 2 && ra.detail.every((l) => /^Process [AB] waits for ShareLock on transaction <xid>; blocked by process [AB]\.$/.test(l)),
    `DETAIL có ${ra.detail.length} dòng "Process X waits for ShareLock …", mỗi phiên chờ transaction của phiên kia`);
  // B chờ ≈ 1 s (deadlock_timeout của A) − thời gian A đã chờ trước; cận dưới trừ lead để poll chậm không gây ✘ giả.
  check(ra.survivorMs >= 1000 - a.lead - 100 && ra.survivorMs <= 2500,
    `${a.survivor ?? '?'} sống sót: câu UPDATE đang treo trả về sau ${ra.survivorMs} ms, chưa cần nạn nhân ROLLBACK (chấp nhận từ 1 s − thời gian A chờ trước − 100 ms tới 2500 ms; mẫu trên máy này)`);
  await endRound(a);
  resultA.deadlock = { deadlockTimeout: '1s', deadlocks: a.deadlocks, victim: a.victim, survivor: { role: a.survivor, ms: ra.survivorMs },
    detail: ra.detail, timeline: a.events };

  heading('B. A đặt deadlock_timeout = 4s: nạn nhân đổi sang B?');
  // lock_timeout 10s cho cả hai: tránh 55P03 (mặc định 5s) chen vào trước khi deadlock được phát hiện.
  await A.query("SET lock_timeout = '10s';");
  await B.query("SET lock_timeout = '10s';");
  await A.query("SET deadlock_timeout = '4s';");
  const b = await crossRound();
  const rb = report(b);
  check(b.deadlocks === 1 && b.victim === 'B',
    `đúng 1 lỗi 40P01, B bị hủy: A chờ trước nhưng đợi 4s mới kiểm tra, B (1s) kiểm tra trước và tự hủy (kỳ vọng B)`);
  say(`${b.survivor ?? '?'} sống sót sau ${rb.survivorMs} ms (mẫu trên máy này)`);
  await endRound(b);
  // RESET đưa về giá trị mặc định của server (không phải 5s của kit); phần A kết thúc ngay sau đó.
  await A.query('RESET deadlock_timeout;');
  await A.query('RESET lock_timeout;');
  await B.query('RESET lock_timeout;');
  resultA.deadlockTimeout4s = { deadlockTimeout: { A: '4s', B: '1s' }, deadlocks: b.deadlocks, victim: b.victim,
    survivor: { role: b.survivor, ms: rb.survivorMs } };
} finally {
  await lab.close();
}
resultA.okA = allOk;
if (!allOk) process.exitCode = 1;
