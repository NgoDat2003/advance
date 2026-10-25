// Lab 12.06: 5 vị trí đặt SET TRANSACTION, rồi ma trận 3 dị thường khi đọc (Dirty, Non-Repeatable, Phantom) × 4 mức cô lập.
// Bảng nháp: l06_contracts, l06_reps (autovacuum tắt, sao chép từ lab03_indexing). Mọi kết luận đều tính từ số đo thực.
import { emitJson, heading, jsonMode, openLab, printTable, verdict } from './tx-kit.mjs';
import { runSteps } from './tx-runner.mjs';
import { ANOMALIES, LEVELS, scratchSql } from './scenarios.mjs';

const SHORT = { 'READ UNCOMMITTED': 'RU', 'READ COMMITTED': 'RC', 'REPEATABLE READ': 'RR', SERIALIZABLE: 'SER' };
const sc = scratchSql('l06', 1000);
const lab = await openLab('l06');
const verdicts = [];
const ok = (cond, text) => verdicts.push(verdict(cond, text));

/** Chạy một câu lệnh trên phiên c, trả về kết quả hoặc lỗi kèm các notice phát sinh (không ném lỗi). */
async function run(c, sql) {
  const n0 = c.notices.length;
  try {
    const res = await c.query(sql);
    return { rows: res.rows, notices: c.notices.slice(n0) };
  } catch (err) {
    return { error: err.code ?? 'ERR', message: err.message.split('\n')[0], notices: c.notices.slice(n0) };
  }
}
const showLevel = async (c) => (await run(c, 'SHOW transaction_isolation')).rows?.[0]?.transaction_isolation ?? null;

/** Chạy một anomaly trên cả 4 mức, trả về { RU: { result, seen }, ... } và in bảng kết quả. */
async function matrix(key, seenOf, section) {
  const a = ANOMALIES[key];
  const out = {};
  for (const level of LEVELS) {
    const r = await runSteps(lab, a.steps(sc, level), { silent: true });
    out[SHORT[level]] = { result: a.judge(r), seen: seenOf(r.by) };
  }
  heading(`${section}. ${a.title} (slide ${a.slide})`);
  printTable(LEVELS, [
    ['Mức cô lập', (l) => l],
    ['Quan sát', (l) => out[SHORT[l]].seen],
    ['Kết luận', (l) => out[SHORT[l]].result],
  ]);
  return out;
}

const first = (e, col) => e?.rows[0]?.[col];
const placements = [];
const matrices = {};
let ruShow = null;

try {
  heading('Lab 12.06 — Đặt mức cô lập (SET TRANSACTION) & Các dị thường khi đọc (Dirty, Non-Repeatable, Phantom) (slide 6–9, 22)');
  const { rows: cfg } = await lab.O.query('SHOW default_transaction_isolation');
  if (!jsonMode) {
    console.log(`Máy chủ: default_transaction_isolation = ${cfg[0].default_transaction_isolation}; mọi phiên lab đặt lock_timeout = 5s.`);
  }
  await lab.O.query(sc.setup);
  const { A } = lab;

  // A. Năm vị trí đặt SET TRANSACTION trên phiên A
  const r1 = await run(A, 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
  const l1 = await showLevel(A);
  placements.push({ id: 1, sql: 'SET TRANSACTION ... SERIALIZABLE (ngoài khối giao dịch)', notice: r1.notices[0]?.code ?? null, level: l1 });

  await run(A, 'BEGIN');
  await run(A, 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
  const l2 = await showLevel(A);
  await run(A, 'COMMIT');
  placements.push({ id: 2, sql: 'BEGIN; SET TRANSACTION ... SERIALIZABLE; SHOW', level: l2 });

  await run(A, 'BEGIN');
  await run(A, 'SELECT 1');
  const r3 = await run(A, 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
  await run(A, 'ROLLBACK');
  placements.push({ id: 3, sql: 'BEGIN; SELECT 1; SET TRANSACTION ... SERIALIZABLE', error: r3.error ?? null, message: r3.message ?? null });

  await run(A, 'START TRANSACTION');
  await run(A, 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  const l4 = await showLevel(A);
  await run(A, 'COMMIT');
  placements.push({ id: 4, sql: 'START TRANSACTION; SET TRANSACTION ... REPEATABLE READ; SHOW (kiểu TypeORM)', level: l4 });

  await run(A, 'SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await run(A, 'BEGIN');
  const l5 = await showLevel(A);
  await run(A, 'COMMIT');
  await run(A, 'RESET default_transaction_isolation');
  const l5after = await showLevel(A);
  placements.push({ id: 5, sql: 'SET SESSION CHARACTERISTICS ... REPEATABLE READ; BEGIN; SHOW; rồi RESET', level: l5, after: l5after });

  heading('A. Năm vị trí đặt SET TRANSACTION ISOLATION LEVEL');
  const seen = (p) => (p.id === 3
    ? `lỗi ${p.error}: ${p.message}`
    : p.id === 1 ? `cảnh báo ${p.notice}, mức vẫn là ${p.level}`
      : p.id === 5 ? `${p.level}; sau DEFAULT: ${p.after}` : p.level);
  printTable(placements, [['#', (p) => p.id, 'right'], ['Vị trí đặt', (p) => p.sql], ['Kết quả', seen]]);
  ok(placements[0].notice === '25P01' && l1 === 'read committed', `1) Ngoài khối giao dịch: cảnh báo ${placements[0].notice}, mức vẫn là ${l1} (lệnh bị bỏ phí)`);
  ok(l2 === 'serializable', `2) Ngay sau BEGIN: SHOW cho ${l2} (cách đặt đúng)`);
  ok(r3.error === '25001' && /must be called before any query/.test(r3.message ?? ''), `3) Sau câu truy vấn đầu: lỗi ${r3.error} "${r3.message}"`);
  ok(l4 === 'repeatable read', `4) Chuỗi START TRANSACTION + SET TRANSACTION (kiểu TypeORM): ${l4}`);
  ok(l5 === 'repeatable read' && l5after === 'read committed', `5) SET SESSION CHARACTERISTICS: giao dịch sau đó là ${l5}; sau khi trả DEFAULT là ${l5after}`);

  // B. Dirty Read
  matrices.dirtyRead = await matrix('dirtyRead', (by) => `A đọc ${first(by.read1, 'total')} (B đã ghi 999 chưa COMMIT)`, 'B');
  await run(A, 'BEGIN ISOLATION LEVEL READ UNCOMMITTED');
  ruShow = await showLevel(A);
  await run(A, 'COMMIT');
  const dirty = matrices.dirtyRead;
  ok(LEVELS.every((l) => dirty[SHORT[l]].result === 'không'), 'Dirty Read: không xảy ra ở cả 4 mức (PostgreSQL không bao giờ đọc dữ liệu chưa COMMIT)');
  ok(ruShow === 'read uncommitted' && dirty.RU.result === dirty.RC.result,
    `READ UNCOMMITTED được chấp nhận (SHOW cho ${ruShow}) nhưng hành xử y hệt READ COMMITTED: Dirty Read = ${dirty.RU.result}`);

  // C. Non-Repeatable Read
  matrices.nonRepeatableRead = await matrix('nonRepeatableRead', (by) => `${first(by.r1, 'total')} → ${first(by.r2, 'total')}`, 'C');
  const nr = matrices.nonRepeatableRead;
  ok(nr.RU.result === 'xảy ra' && nr.RC.result === 'xảy ra' && nr.RR.result === 'không' && nr.SER.result === 'không',
    'Non-Repeatable Read: xảy ra ở RU/RC (mỗi câu lệnh một snapshot mới), không xảy ra ở RR/SER (một snapshot cho cả giao dịch)');

  // D. Phantom Read
  matrices.phantom = await matrix('phantom', (by) => `${first(by.c1, 'c')} → ${first(by.c2, 'c')} dòng`, 'D');
  const ph = matrices.phantom;
  ok(ph.RU.result === 'xảy ra' && ph.RC.result === 'xảy ra' && ph.RR.result === 'không' && ph.SER.result === 'không',
    'Phantom Read: xảy ra ở RU/RC, không xảy ra ở RR/SER (PostgreSQL chặn phantom từ REPEATABLE READ, chặt hơn chuẩn SQL)');

  emitJson({ lab: '12.06', placements, matrices, readUncommittedShow: ruShow, verdicts });
  if (verdicts.includes(false)) process.exitCode = 1;
} finally {
  for (const r of ['A', 'B']) await lab[r].query('ROLLBACK').catch(() => {});
  await lab.O.query(sc.cleanup).catch(() => {});
  await lab.closeAll();
}
