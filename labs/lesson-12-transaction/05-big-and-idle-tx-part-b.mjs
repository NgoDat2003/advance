// Lab 12.05 phần B (slide 19–21): phiên "idle in transaction" giữ khóa dòng, lock_timeout (55P03),
// pg_terminate_backend (57P01) và idle_in_transaction_session_timeout (25P03).
// Dùng kịch bản M2 của scenarios.mjs trên bảng nháp l05_contracts; hỗ trợ --json cho Widget W5.
import { connect, emitJson, fmtMs, heading, jsonMode, openLab, sessionState, verdict, waitUntil, warnForeign } from './tx-kit.mjs';
import { runSteps } from './tx-runner.mjs';
import { M2, scratchSql } from './scenarios.mjs';
import { resultA } from './05-big-and-idle-tx-part-a.mjs';

const say = (s) => { if (!jsonMode) console.log(s); };
const t = scratchSql('l05', 100);
const lab = await openLab('lab05', ['A', 'B']);
const { A, B, O } = lab;
let C = null;

try {
  await warnForeign(O);
  await O.query(t.cleanup);
  await O.query(t.setup);

  // B1 + B2: M2 kèm một bước quan sát của O chèn sau khi A đã UPDATE xong (trước khi B bị chặn)
  const steps = M2({ contracts: t.contracts, reps: t.reps });
  steps.splice(2, 0, ['O', (ctx) => `SELECT state FROM pg_stat_activity WHERE pid = ${ctx.pid.A}`, 'oState']);
  const { by } = await runSteps(lab, steps, { title: 'B1–B2. Phiên A bỏ quên transaction đang mở (kịch bản M2)' });

  heading('B1. Phiên treo "idle in transaction" giữ khóa dòng, B hết lock_timeout');
  const aState = by.oState.rows[0]?.state;
  const bt = by.bTimeout;
  const b1 = [
    verdict(aState === 'idle in transaction',
      `Observer O thấy phiên A ở trạng thái "${aState}": A đã UPDATE xong nhưng chưa COMMIT/ROLLBACK nên vẫn giữ khóa dòng.`),
    verdict(bt.code === '55P03' && bt.waitedFor.includes('A'),
      `UPDATE của B bị A chặn rồi hết lock_timeout sau ${fmtMs(bt.ms)} với SQLSTATE ${bt.code} (lock_not_available).`),
  ];

  heading('B2. O ngắt phiên treo bằng pg_terminate_backend');
  const gotA = await waitUntil(() => lab.events.A.find((e) => e.code === '57P01'), 2000);
  say(`Sự kiện bắt được trên A: ${gotA ? `${gotA.code} — ${gotA.message}` : '(không có)'}`);
  const aOld = Number(by.aOpen.rows[0].total);
  const retry = by.bRetryOk;
  const b2 = [
    verdict(by.oKill.rows[0]?.terminated === true && Boolean(gotA),
      `pg_terminate_backend trả về true; A nhận lỗi ${gotA?.code ?? '(không có)'} (admin_shutdown) qua listener và Node không bị sập.`),
    verdict(!retry.error && retry.rowCount === 1 && retry.ms < 1000
      && Math.abs(Number(retry.rows[0].total) - (aOld - 10 + 20)) < 0.001,
    `UPDATE thử lại của B chạy ngay sau ${fmtMs(retry.ms)} và thay đổi +10 của A đã bị rollback cùng phiên.`),
  ];

  // B3: phiên C tự bị server cắt nhờ idle_in_transaction_session_timeout
  heading("B3. idle_in_transaction_session_timeout = '1s': server tự cắt phiên treo");
  C = await connect('lesson-12-lab05-C');
  const { rows: cp } = await C.query('SELECT pg_backend_pid() AS p');
  await C.query("SET idle_in_transaction_session_timeout = '1s'");
  await C.query('BEGIN');
  await C.query(`UPDATE ${t.contracts} SET total = total + 1 WHERE id = 2`);
  const midState = (await sessionState(O, cp[0].p)).state;
  say(`Ngay sau UPDATE, O thấy C ở trạng thái "${midState}" (pid=${cp[0].p}).`);
  const t0 = performance.now();
  const gone = await waitUntil(async () => {
    const { rows } = await O.query('SELECT 1 FROM pg_stat_activity WHERE pid = $1', [cp[0].p]);
    return rows.length === 0;
  }, 4000);
  const goneMs = performance.now() - t0;
  let code = (await waitUntil(() => C.events.find((e) => e.code === '25P03'), 1000))?.code ?? null;
  if (!code) {
    code = await C.query('SELECT 1').then(() => null, (err) => err.code ?? null);
  }
  say(`Mã lỗi C nhận được: ${code ?? '(không có)'} — ${C.events[0]?.message ?? '(không có thông điệp)'}`);

  const t1 = performance.now();
  const bUpd = await B.query(`UPDATE ${t.contracts} SET total = total + 1 WHERE id = 2`).then(
    (r) => ({ ok: r.rowCount === 1 }), (err) => ({ ok: false, code: err.code }));
  const bMs = performance.now() - t1;
  const b3 = [
    verdict(Boolean(gone) && midState === 'idle in transaction' && code === '25P03',
      `Sau ${fmtMs(goneMs)} phiên C biến mất khỏi pg_stat_activity; C nhận SQLSTATE ${code ?? '(không có)'} (idle_in_transaction_session_timeout).`),
    verdict(bUpd.ok && bMs < 1000,
      `B UPDATE đúng dòng id = 2 ngay sau ${fmtMs(bMs)} mà không phải chờ: khóa của C đã được giải phóng.`),
  ];

  emitJson({
    lab: '12.05',
    bigVsBatch: resultA.rows,
    walRecordDiff: resultA.walRecordDiff,
    idle: {
      aState,
      bTimeout: { code: bt.code, ms: bt.ms },
      terminated: by.oKill.rows[0]?.terminated === true,
      aEvent: gotA?.code ?? null,
      retryMs: retry.ms,
      cEvent: code,
      cGoneMs: goneMs,
      bAfterCMs: bMs,
    },
    verdicts: [...resultA.verdicts, ...b1, ...b2, ...b3],
  });
  if ([...resultA.verdicts, ...b1, ...b2, ...b3].includes(false)) process.exitCode = 1;
} finally {
  await A.query('ROLLBACK').catch(() => {});
  await B.query('ROLLBACK').catch(() => {});
  if (C) await Promise.race([C.end(), new Promise((r) => setTimeout(r, 1000))]).catch(() => {});
  await O.query(t.cleanup).catch(() => {});
  await lab.closeAll();
}
