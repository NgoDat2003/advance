// Lab 14.05 phần B (slide 14, 22): sửa deadlock bằng THỨ TỰ KHÓA. Mỗi phiên khóa trước bằng
// SELECT … WHERE id IN (…) ORDER BY id FOR UPDATE: dù app liệt kê id theo thứ tự nào, Postgres luôn khóa id nhỏ trước,
// nên phiên đến sau chỉ CHỜ (không giữ gì), không có vòng tròn → 0 lỗi 40P01. Phá điều kiện "chờ vòng tròn" của Coffman.
// Mục D: EXPLAIN cho thấy nút LockRows nằm ở đâu so với Sort. Bảng nháp: l05_contracts (id 1–10).
// Kết quả cho widget W4 xuất qua `resultB`.
import { openLab, waitBlocked, settle, heading, verdict, printTable, jsonMode } from './lock-kit.mjs';

// U(n), L(list): đúng câu lệnh của bảng M2 trong guide (guide đổi l05_contracts → contracts).
const U = (n) => `UPDATE l05_contracts SET total = total + 1 WHERE id = ${n};`;
const L = (list) => `SELECT id FROM l05_contracts WHERE id IN (${list}) ORDER BY id FOR UPDATE;`;
// A và B viết id theo thứ tự ngược nhau (như hai đoạn code app khác nhau); thứ tự UPDATE cũng ngược nhau.
// Nếu không có bước L(...) khóa trước, đây chính là deadlock của phần A.
const LIST = { A: '1, 2', B: '2, 1' };
const UPD = { A: [2, 1], B: [1, 2] };
const LOOP = 10;
const say = (s) => { if (!jsonMode) console.log(s); }; // chế độ --json: chỉ in JSON

export const resultB = {};
let allOk = true;
const check = (ok, text) => { allOk = verdict(ok, text) && allOk; return ok; };

const lab = await openLab('05');
const { O, A, B, pid } = lab;
const roleOf = Object.fromEntries(Object.entries(pid).map(([r, p]) => [p, r]));
// total là numeric(12,2) → pg trả chuỗi; đổi sang số xu (bigint, pg trả chuỗi) rồi Number() để trừ chính xác.
const totals = async () => (await O.query('SELECT id, (total * 100)::bigint AS cents FROM l05_contracts WHERE id IN (1, 2) ORDER BY id')).rows;
const codes = (results) => results.map((r) => r.code).filter(Boolean);

/** Một vòng có xác nhận: `first` khóa trước, `second` xin khóa sau và phải CHỜ mà chưa giữ dòng nào. */
async function orderedRound(first, second) {
  const F = lab[first];
  const S = lab[second];
  const [f1, f2] = UPD[first];
  const [s1, s2] = UPD[second];
  await F.query('BEGIN;');
  const lf = await settle(F.query(L(LIST[first])));
  await S.query('BEGIN;');
  const pS = settle(S.query(L(LIST[second]))); // cùng ORDER BY id → cũng xin id 1 trước → chờ ngay ở dòng đầu
  const w = await waitBlocked(O, pid[second], pid, { unless: pS });
  check(w.blocked && w.waitEvent === 'Lock/transactionid' && w.blockers.join() === first,
    `${second} chờ: ${w.waitEvent ?? 'không chờ'}, bị chặn bởi ${w.blockers?.join(', ') ?? '-'}`);
  const { rows: held } = await O.query("SELECT pids FROM pgrowlocks('l05_contracts')");
  const holders = held.flatMap((r) => r.pids).map((p) => roleOf[p] ?? 'phiên lạ');
  check(holders.length === 2 && holders.every((r) => r === first),
    `${second} chưa khóa được dòng nào: pgrowlocks thấy ${holders.length} dòng bị khóa, người giữ: ${holders.join(', ') || '-'}; ${second} chỉ giữ chỗ đầu hàng chờ (tuple lock)`);
  const rf1 = await settle(F.query(U(f1)));
  const rf2 = await settle(F.query(U(f2)));
  const cf = await settle(F.query('COMMIT;'));
  const ls = await pS; // khóa của `first` vừa nhả → `second` nhận đủ 2 dòng
  const rs1 = await settle(S.query(U(s1)));
  const rs2 = await settle(S.query(U(s2)));
  const cs = await settle(S.query('COMMIT;'));
  const errs = codes([lf, rf1, rf2, cf, ls, rs1, rs2, cs]);
  const deadlocks = errs.filter((c) => c === '40P01').length;
  const committed = cf.ok && cs.ok && errs.length === 0;
  check(deadlocks === 0 && committed && ls.rowCount === 2,
    `vòng ${first} khóa trước: 40P01 × ${deadlocks}, ${second} nhận ${ls.rowCount} dòng sau khi ${first} COMMIT, cả hai COMMIT: ${committed ? 'có' : 'không'}`);
  const timeline = [
    { role: first, sql: 'BEGIN;', event: 'ok' }, { role: first, sql: L(LIST[first]), event: 'ok', rows: lf.rowCount },
    { role: second, sql: 'BEGIN;', event: 'ok' }, { role: second, sql: L(LIST[second]), event: 'wait', waitsFor: w.blockers?.join(', ') ?? null },
    { role: first, sql: U(f1), event: 'ok', rows: rf1.rowCount }, { role: first, sql: U(f2), event: 'ok', rows: rf2.rowCount },
    { role: first, sql: 'COMMIT;', event: 'ok' }, { role: second, sql: L(LIST[second]), event: 'resume', rows: ls.rowCount },
    { role: second, sql: U(s1), event: 'ok', rows: rs1.rowCount }, { role: second, sql: U(s2), event: 'ok', rows: rs2.rowCount },
    { role: second, sql: 'COMMIT;', event: 'ok' },
  ];
  return { first, deadlocks, committed, timeline };
}

/** Một transaction "im lặng" cho vòng lặp song song: truyền { text } thay vì chuỗi để kit không in lại từng câu. */
async function silentTx(role) {
  const c = lab[role];
  const out = [];
  out.push(await settle(c.query({ text: 'BEGIN;' })));
  out.push(await settle(c.query({ text: L(LIST[role]) })));
  out.push(await settle(c.query({ text: U(UPD[role][0]) })));
  out.push(await settle(c.query({ text: U(UPD[role][1]) })));
  out.push(await settle(c.query({ text: 'COMMIT;' })));
  return out;
}

try {
  await O.query(`DROP TABLE IF EXISTS l05_contracts;
    CREATE TABLE l05_contracts WITH (autovacuum_enabled = false) AS SELECT * FROM contracts WHERE id <= 10;
    ALTER TABLE l05_contracts ADD PRIMARY KEY (id); ANALYZE l05_contracts`);
  const before = await totals();

  heading('C. Cùng thứ tự ORDER BY id FOR UPDATE: phiên sau chờ, không deadlock');
  const r1 = await orderedRound('A', 'B');
  say('— lặp lại, lần này B bắt đầu trước —');
  const r2 = await orderedRound('B', 'A');

  // 10 vòng chạy song song thật (A và B cùng lúc, không chờ xác nhận): đếm lỗi 40P01 và lỗi khác.
  let loopErrs = [];
  for (let i = 0; i < LOOP; i += 1) {
    const [ra, rb] = await Promise.all([silentTx('A'), silentTx('B')]);
    loopErrs = loopErrs.concat(codes([...ra, ...rb]));
  }
  const loopDeadlocks = loopErrs.filter((c) => c === '40P01').length;
  check(loopDeadlocks === 0 && loopErrs.length === 0,
    `${LOOP} vòng song song (không in từng câu): 40P01 × ${loopDeadlocks}, lỗi khác ${loopErrs.length - loopDeadlocks}`);
  const after = await totals();
  const rounds = 2 + LOOP;
  const deltas = after.map((r, i) => (Number(r.cents) - Number(before[i].cents)) / 100);
  check(deltas.length === 2 && deltas.every((d) => d === rounds * 2),
    `total của id 1 và 2 tăng ${deltas.join(' và ')} (kỳ vọng ${rounds * 2} = ${rounds} vòng × 2 phiên): không lượt UPDATE nào bị mất`);
  resultB.ordered = { rounds: [r1, r2], loop: { rounds: LOOP, deadlocks: loopDeadlocks, errors: loopErrs.length - loopDeadlocks },
    totalDelta: deltas };

  heading('D. EXPLAIN: LockRows nằm trên Sort?');
  const { rows: plan } = await A.query(`EXPLAIN (COSTS OFF) ${L(LIST.A)}`);
  const lines = plan.map((r) => r['QUERY PLAN']);
  printTable(lines.map((l) => ({ 'QUERY PLAN': l })), ['QUERY PLAN']);
  const lockAt = lines.findIndex((l) => /\bLockRows\b/.test(l));
  const sortAt = lines.findIndex((l) => /\bSort\b/.test(l) && !/Sort Key/.test(l));
  const scan = lines.find((l) => /Scan/.test(l))?.replace(/^[\s->]+/, '') ?? '-';
  const above = lockAt >= 0 && sortAt > lockAt;
  check(above,
    `LockRows nằm trên Sort: ${above ? 'có' : 'không'} — hàng đi qua Sort (theo id) rồi mới bị khóa, nên thứ tự khóa = ORDER BY (nút quét: ${scan})`);
  resultB.explain = { plan: lines, lockRowsAboveSort: above, scan };
} finally {
  await lab.close();
}
resultB.okB = allOk;
if (!allOk) process.exitCode = 1;
