// Lab 12.08: Write Skew ở REPEATABLE READ (cả hai COMMIT, vi phạm bất biến), SSI ở SERIALIZABLE (40001), retry, và bẫy false positive.
// Bảng nháp: l08_reps (cửa hàng 44 và 45, mỗi nơi 2 người trực). Bất biến: mỗi cửa hàng luôn còn >= 1 người trực.
import { emitJson, heading, jsonMode, openLab, printTable, verdict } from './tx-kit.mjs';
import { runSteps } from './tx-runner.mjs';
import { M3, scratchSql } from './scenarios.mjs';

const sc = scratchSql('l08', 1000);
const lab = await openLab('l08');
const verdicts = [];
const ok = (cond, text) => verdicts.push(verdict(cond, text));
const onDuty = (e) => e?.rows[0]?.on_duty ?? null;
const countSql = (store) => `SELECT count(*)::int AS on_duty FROM ${sc.reps} WHERE store_id = ${store} AND on_duty;`;
const offSql = (store, rep) => `UPDATE ${sc.reps} SET on_duty = false WHERE store_id = ${store} AND rep_id = ${rep};`;
const SER = 'BEGIN ISOLATION LEVEL SERIALIZABLE;';

/** D: store 44 (A) và store 45 (B) đọc rồi chỉ sửa cửa hàng của mình; `hints` ép kế hoạch đọc cho cả hai phiên. */
function storeSteps(hints) {
  const sel = (store) => `SELECT count(*)::int AS on_duty FROM ${sc.reps} WHERE store_id = ${store} AND on_duty`;
  return [
    ['A', SER], ['B', SER],
    ...['A', 'B'].flatMap((who) => hints.map((h) => [who, `SET LOCAL ${h};`])),
    ['A', `EXPLAIN (COSTS OFF) ${sel(44)};`, 'plan'],
    ['A', countSql(44), 'aCnt'], ['B', countSql(45), 'bCnt'],
    ['A', offSql(44, 1), 'aUpd'], ['B', offSql(45, 1), 'bUpd'],
    ['A', 'COMMIT;', 'aCommit'], ['B', 'COMMIT;', 'bCommit'],
    ['O', `UPDATE ${sc.reps} SET on_duty = true;`],
  ];
}
const errAt = (by) => ['aUpd', 'bUpd', 'aCommit', 'bCommit'].find((k) => by[k]?.code === '40001') ?? null;
const planOf = (by) => (by.plan?.rows ?? []).map((r) => r['QUERY PLAN']).join(' / ');

let a = null;
let b = null;
let c = null;
const d = {};

try {
  heading('Lab 12.08 — Write Skew trên Repeatable Read, SSI (Serializable) & Bẫy False Positive (slide 9–10, 23)');
  const { rows: cfg } = await lab.O.query(
    `SELECT current_setting('max_pred_locks_per_page') AS pg, current_setting('max_pred_locks_per_relation') AS rel`,
  );
  if (!jsonMode) {
    console.log(`Máy chủ: max_pred_locks_per_page = ${cfg[0].pg}, max_pred_locks_per_relation = ${cfg[0].rel} (ngưỡng nâng khóa vị từ SIRead).`);
  }
  await lab.O.query(sc.setup);

  // A. REPEATABLE READ: A tắt rep 1, B tắt rep 2, cả hai đều COMMIT
  a = await runSteps(lab, M3(sc, 'REPEATABLE READ'), { title: 'A. REPEATABLE READ — A tắt rep 1, B tắt rep 2 (cửa hàng 44, bất biến: on_duty >= 1)' });
  ok(onDuty(a.by.aCnt) === 2 && onDuty(a.by.bCnt) === 2 && !a.by.aCommit.error && !a.by.bCommit.error && onDuty(a.by.finalCnt) === 0,
    `RR: A và B cùng thấy on_duty=${onDuty(a.by.aCnt)}, cả hai COMMIT thành công → on_duty=${onDuty(a.by.finalCnt)}, vi phạm bất biến (Write Skew)`);

  // B. SERIALIZABLE: SSI phát hiện vòng phụ thuộc đọc/ghi và hủy B ở COMMIT
  b = await runSteps(lab, M3(sc, 'SERIALIZABLE'), { title: 'B. SERIALIZABLE — cùng kịch bản, SSI theo dõi phụ thuộc đọc/ghi' });
  ok(!b.by.bUpd.error && !b.by.aCommit.error && b.by.bCommit.code === '40001' && /read\/write dependencies/.test(b.by.bCommit.message ?? ''),
    `SER: UPDATE của B chạy được, A COMMIT được, nhưng COMMIT của B bị hủy với ${b.by.bCommit.code} (${b.by.bCommit.message})`);
  ok(onDuty(b.by.finalCnt) === 1, `SER: bất biến được giữ, on_duty=${onDuty(b.by.finalCnt)} (chỉ A thành công)`);

  // C. Retry của B: chạy lại từ BEGIN, lần này thấy on_duty = 1 nên tự từ chối (ROLLBACK)
  const upto = M3(sc, 'SERIALIZABLE');
  const retrySteps = [
    ...upto.slice(0, upto.findIndex((s) => s[2] === 'bCommit') + 1),
    ['B', SER],
    ['B', countSql(44), 'retryCnt'],
    ['B', (ctx) => (onDuty(ctx.by.retryCnt) > 1 ? offSql(44, 2) : 'ROLLBACK;'), 'retryDecision'],
    ['B', (ctx) => (ctx.by.retryDecision.command === 'ROLLBACK' ? 'SELECT 1;' : 'COMMIT;'), 'retryEnd'],
    ['O', countSql(44), 'finalCnt'],
    ['O', `UPDATE ${sc.reps} SET on_duty = true WHERE store_id = 44;`],
  ];
  c = await runSteps(lab, retrySteps, { title: 'C. SERIALIZABLE — B bắt 40001, ROLLBACK, chạy lại cả giao dịch' });
  ok(c.by.bCommit.code === '40001' && onDuty(c.by.retryCnt) === 1 && c.by.retryDecision.command === 'ROLLBACK' && onDuty(c.by.finalCnt) === 1,
    `Retry: lần 2 B thấy on_duty=${onDuty(c.by.retryCnt)} nên không tắt rep 2 (${c.by.retryDecision.command}); on_duty=${onDuty(c.by.finalCnt)} được giữ`);

  // D. (tùy chọn) False positive: A sửa cửa hàng 44, B sửa cửa hàng 45, khác dòng nhưng đọc bằng Seq Scan thì khóa SIRead phủ cả bảng
  const modes = [
    ['seq', '(ép Seq Scan)', ['enable_indexscan = off', 'enable_bitmapscan = off'], 'Seq Scan'],
    ['index', '(ép Index Scan)', ['enable_seqscan = off', 'enable_bitmapscan = off'], 'Index Scan'],
  ];
  for (const [key, label, hints, planWord] of modes) {
    const r = await runSteps(lab, storeSteps(hints), { title: `D. Cửa hàng 44 vs 45 ở SERIALIZABLE ${label} — tùy chọn` });
    d[key] = { label, plan: planOf(r.by), planOk: planOf(r.by).includes(planWord), failedAt: errAt(r.by), aCommit: !r.by.aCommit.error, bCommit: !r.by.bCommit.error };
  }
  ok(d.seq.planOk && d.seq.failedAt !== null,
    `${d.seq.label}: kế hoạch "${d.seq.plan}" khóa SIRead cả bảng → dù khác cửa hàng vẫn gặp 40001 ở ${d.seq.failedAt} (false positive)`);
  ok(d.index.planOk && d.index.failedAt === null && d.index.aCommit && d.index.bCommit,
    `${d.index.label}: kế hoạch "${d.index.plan}" chỉ khóa các dòng đã đọc → A và B đều COMMIT, không có 40001`);

  emitJson({ lab: '12.08', repeatableRead: { final: onDuty(a.by.finalCnt) }, serializable: { code: b.by.bCommit.code, final: onDuty(b.by.finalCnt) }, retry: { count: onDuty(c.by.retryCnt), decision: c.by.retryDecision.command, final: onDuty(c.by.finalCnt) }, falsePositive: d, verdicts });
  if (verdicts.includes(false)) process.exitCode = 1;
} finally {
  for (const r of ['A', 'B']) await lab[r].query('ROLLBACK').catch(() => {});
  await lab.O.query(sc.cleanup).catch(() => {});
  await lab.closeAll();
}
