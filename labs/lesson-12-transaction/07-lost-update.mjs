// Lab 12.07: Lost Update kiểu đọc-sửa-ghi ở app vs UPDATE nguyên tử trong SQL, rồi vòng retry cả giao dịch khi gặp 40001.
// Bảng nháp: l07_contracts (total = 100 ở id 1). A trừ 10, B trừ 20 → kết quả đúng là 70.
import { emitJson, heading, jsonMode, openLab, printTable, verdict } from './tx-kit.mjs';
import { runSteps } from './tx-runner.mjs';
import { ANOMALIES, LEVELS, scratchSql } from './scenarios.mjs';

const SHORT = { 'READ UNCOMMITTED': 'RU', 'READ COMMITTED': 'RC', 'REPEATABLE READ': 'RR', SERIALIZABLE: 'SER' };
const sc = scratchSql('l07', 100);
const lab = await openLab('l07');
const verdicts = [];
const ok = (cond, text) => verdicts.push(verdict(cond, text));
const total = (e) => e?.rows[0]?.total ?? null;

/** Chạy một anomaly trên cả 4 mức, in bảng và trả về { RU: {...}, RC, RR, SER }. */
async function matrix(key, section, firstRead) {
  const a = ANOMALIES[key];
  const out = {};
  for (const level of LEVELS) {
    const r = await runSteps(lab, a.steps(sc, level), { silent: true });
    out[SHORT[level]] = {
      result: a.judge(r),
      code: r.by.bUpd?.code ?? null,
      message: r.by.bUpd?.message ?? null,
      waited: r.rows.some((e) => e.command === 'WAIT'),
      aRead: firstRead ? total(r.by.aRead) : null,
      bRead: firstRead ? total(r.by.bRead) : null,
      final: total(r.by.final),
    };
  }
  heading(`${section}. ${a.title} (slide ${a.slide})`);
  const cols = [['Mức cô lập', (l) => l]];
  if (firstRead) cols.push(['A/B đọc', (l) => `${out[SHORT[l]].aRead}/${out[SHORT[l]].bRead}`]);
  cols.push(
    ['B UPDATE', (l) => (out[SHORT[l]].code ? `${out[SHORT[l]].code} (${out[SHORT[l]].message})` : out[SHORT[l]].waited ? 'chờ A rồi ghi' : 'ghi ngay')],
    ['final', (l) => out[SHORT[l]].final],
    ['Kết luận', (l) => out[SHORT[l]].result],
  );
  printTable(LEVELS, cols);
  return out;
}

let lostUpdate = null;
let atomicUpdate = null;
const retry = { attempts: 0, codes: [], final: null };

try {
  heading('Lab 12.07 — Lost Update: Đọc-Sửa-Ghi ở App vs Atomic SQL Update & Retry 40001 (slide 8–9)');
  if (!jsonMode) console.log('Máy chủ: mặc định READ COMMITTED; B ghi cùng dòng với A nên phải chờ khóa dòng, lock_timeout = 5s.');
  await lab.O.query(sc.setup);

  // A. Đọc-sửa-ghi ở app: B dùng giá trị đã đọc (100) để tính 100 - 20
  lostUpdate = await matrix('lostUpdate', 'A', true);
  const lu = lostUpdate;
  ok(['RU', 'RC'].every((k) => lu[k].result === 'xảy ra' && lu[k].final === 80 && lu[k].waited),
    `RU/RC: B chờ A COMMIT rồi ghi đè bằng giá trị cũ → final=${lu.RC.final} thay vì 70, mất cập nhật của A`);
  ok(['RR', 'SER'].every((k) => lu[k].code === '40001' && lu[k].final === 90),
    `RR/SER: B bị hủy với ${lu.RR.code} sau khi A COMMIT, final=${lu.RR.final} (cập nhật của A được giữ, B phải thử lại)`);

  // B. UPDATE nguyên tử: total = total - delta, DB tính trên phiên bản mới nhất
  atomicUpdate = await matrix('atomicUpdate', 'B', false);
  const au = atomicUpdate;
  ok(['RU', 'RC'].every((k) => au[k].result === 'không' && au[k].final === 70 && au[k].waited),
    `RU/RC: B chờ A rồi tính lại trên dòng mới (EvalPlanQual) → final=${au.RC.final}, không mất cập nhật`);
  ok(['RR', 'SER'].every((k) => au[k].code === '40001' && au[k].final === 90),
    `RR/SER: B bị hủy với ${au.RR.code} (could not serialize access due to concurrent update), final=${au.RR.final}`);

  // C. Retry cả giao dịch ở REPEATABLE READ: lần 1 dùng kịch bản lostUpdate, lần 2 trở đi chạy tay trên B
  const rr = 'REPEATABLE READ';
  const t1 = await runSteps(lab, ANOMALIES.lostUpdate.steps(sc, rr), { title: 'C. Retry cả giao dịch sau 40001 ở REPEATABLE READ — lần 1' });
  retry.attempts = 1;
  retry.codes.push(t1.by.bUpd?.code ?? 'OK');
  const log = [];
  while (retry.codes.at(-1) === '40001' && retry.attempts < 3) {
    retry.attempts += 1;
    const step = { attempt: retry.attempts };
    try {
      await lab.B.query(`BEGIN ISOLATION LEVEL ${rr}`);
      step.read = (await lab.B.query(`SELECT total::int AS total FROM ${sc.contracts} WHERE id = 1`)).rows[0].total;
      await lab.B.query(`UPDATE ${sc.contracts} SET total = ${step.read - 20} WHERE id = 1`);
      await lab.B.query('COMMIT');
      step.code = 'OK';
    } catch (err) {
      step.code = err.code ?? 'ERR';
      await lab.B.query('ROLLBACK').catch(() => {});
    }
    retry.codes.push(step.code);
    log.push(step);
  }
  retry.final = (await lab.O.query(`SELECT total::int AS total FROM ${sc.contracts} WHERE id = 1`)).rows[0].total;
  printTable(log, [
    ['Lần thử', (s) => s.attempt, 'right'],
    ['B đọc', (s) => s.read ?? '-', 'right'],
    ['B ghi', (s) => (s.read == null ? '-' : s.read - 20), 'right'],
    ['Kết quả', (s) => s.code],
  ]);
  ok(retry.codes[0] === '40001' && retry.codes[1] === 'OK' && retry.attempts === 2 && retry.final === 70,
    `Lần 1 gặp ${retry.codes[0]}, ROLLBACK rồi chạy lại cả giao dịch: lần ${retry.attempts} đọc ${log[0]?.read}, ghi ${log[0]?.read - 20} → final=${retry.final} (đúng 100 - 10 - 20)`);

  emitJson({ lab: '12.07', lostUpdate, atomicUpdate, retry, verdicts });
  if (verdicts.includes(false)) process.exitCode = 1;
} finally {
  for (const r of ['A', 'B']) await lab[r].query('ROLLBACK').catch(() => {});
  await lab.O.query(sc.cleanup).catch(() => {});
  await lab.closeAll();
}
