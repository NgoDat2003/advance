// Bài tập về nhà Bài 12 (Slide 24) — Runner: `node homework-runner.mjs <file-dự-đoán.mjs>`.
// Nạp PREDICTIONS (+ REVIEW_ANSWERS, PART_D tuỳ chọn) TRƯỚC khi mở kết nối; từ chối mọi ô còn '???' hoặc ngoài danh sách,
// chỉ đo những dòng đủ 4 ô hợp lệ, rồi so dự đoán với thực tế và in timeline của mọi ô sai (✘).
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { openLab, heading, printTable, verdict, fmtMs, warnForeign } from './tx-kit.mjs';
import { runSteps } from './tx-runner.mjs';
import { ANOMALIES, LEVELS, scratchSql, forUpdateFix } from './scenarios.mjs';

const ALLOWED = new Set(['xảy ra', 'không', '40001']);
const KEYS = ['dirtyRead', 'nonRepeatableRead', 'phantom', 'lostUpdate', 'atomicUpdate', 'writeSkew'];
const SHORT = ['RU', 'RC', 'RR', 'SER'];
const OPTIONS = "'xảy ra' | 'không' | '40001'";

/** Kiểm tra từng ô của từng dòng; trả về danh sách lỗi theo dòng. */
function validate(predictions) {
  const problems = {};
  for (const key of KEYS) {
    problems[key] = [];
    for (const lv of SHORT) {
      const val = predictions?.[key]?.[lv];
      if (val === undefined || val === '???') {
        problems[key].push(`${key}.${lv}: còn để trống '???' (chọn: ${OPTIONS})`);
      } else if (!ALLOWED.has(val)) {
        problems[key].push(`${key}.${lv}: giá trị '${val}' không hợp lệ (chỉ nhận: ${OPTIONS})`);
      }
    }
  }
  return problems;
}

const timeline = (rows) => printTable(rows, [
  ['#', (r) => r.step, 'right'],
  ['Phiên', (r) => r.who],
  ['SQL', (r) => (r.sql.length > 60 ? `${r.sql.slice(0, 57)}...` : r.sql)],
  ['Kết quả', (r) => r.summary],
  ['ms', (r) => fmtMs(r.ms), 'right'],
]);

/** Chạy một dòng ma trận trên 4 mức; in timeline của các ô dự đoán sai. */
async function measureRow(lab, sc, key, pred) {
  const spec = ANOMALIES[key];
  const cells = [];
  for (let i = 0; i < LEVELS.length; i++) {
    const r = await runSteps(lab, spec.steps(sc, LEVELS[i]), { silent: true });
    const actual = spec.judge(r);
    const ok = actual === pred[SHORT[i]];
    cells.push({ lv: SHORT[i], level: LEVELS[i], actual, predicted: pred[SHORT[i]], ok });
    if (!ok) {
      heading(`✘ ${key} @ ${LEVELS[i]}: bạn dự đoán '${pred[SHORT[i]]}', thực tế '${actual}'`);
      timeline(r.rows);
    }
  }
  return cells;
}

function printReview(review) {
  heading('Phần C — Đáp án rà soát bản nháp AI (homework-ai-draft.mjs)');
  const items = review.map((x, i) => ({ n: i + 1, flaw: x.flaw ?? String(x), fix: x.fix ?? '' }));
  printTable(items, [['#', (r) => r.n, 'right'], ['Lỗi phương pháp', (r) => r.flaw], ['Cách sửa', (r) => r.fix]]);
}

/** Phần D: SELECT ... FOR UPDATE giữ bất biến ở READ COMMITTED. Trả về true nếu cả 3 verdict đạt. */
async function runPartD(lab, sc) {
  const r = await runSteps(lab, forUpdateFix(sc), { title: 'Phần D — Giữ bất biến ở READ COMMITTED bằng SELECT ... FOR UPDATE' });
  const checks = [
    verdict(Boolean(r.by.bLock?.waitedFor?.includes('A')), 'B bị chặn chờ khóa FOR UPDATE của A (quan sát qua pg_locks, phiên O)'),
    verdict(r.by.bLock?.rows?.length === 1 && r.by.finalCnt?.rows[0]?.on_duty === 1,
      `Sau khi A COMMIT, SELECT ... FOR UPDATE của B chỉ còn ${r.by.bLock?.rows?.length} dòng nên B ROLLBACK; số người trực còn ${r.by.finalCnt?.rows[0]?.on_duty} (>= 1)`),
    verdict(!r.by.aCommit?.error && !r.by.bDecision?.error, 'Không phiên nào gặp 40001 (khóa dòng chặn trước thay vì phát hiện sau)'),
  ];
  await lab.O.query(`UPDATE ${sc.reps} SET on_duty = true WHERE store_id = 44;`);
  return checks.every(Boolean);
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Cách dùng: node homework-runner.mjs <file-dự-đoán.mjs>');
    return 1;
  }
  let mod;
  try {
    mod = await import(pathToFileURL(path.resolve(file)).href);
  } catch (err) {
    console.error(`Không nạp được file dự đoán ${file}: ${err.message}`);
    return 1;
  }
  const { PREDICTIONS, REVIEW_ANSWERS, PART_D } = mod;
  const problems = validate(PREDICTIONS);
  const refused = KEYS.filter((k) => problems[k].length > 0);
  const complete = KEYS.filter((k) => problems[k].length === 0);

  heading('Bài tập về nhà Bài 12 — kiểm tra file dự đoán');
  if (refused.length > 0) {
    console.log('Các ô cần sửa trước khi đo:');
    refused.forEach((k) => problems[k].forEach((p) => console.log(`  ✘ ${p}`)));
  }
  if (complete.length === 0) {
    console.log('\nKhông có dòng nào đủ 4 ô hợp lệ — từ chối chạy, chưa mở kết nối DB.');
    return 1;
  }

  const sc = scratchSql('hw', 1000);
  let lab;
  let failed = refused.length > 0;
  try {
    lab = await openLab('homework', ['A', 'B']);
    await warnForeign(lab.O);
    await lab.O.query(sc.cleanup);
    await lab.O.query(sc.setup);

    const measured = {};
    for (const key of complete) {
      measured[key] = await measureRow(lab, sc, key, PREDICTIONS[key]);
    }

    heading('Ma trận 6 hiện tượng × 4 mức cô lập (✔ = dự đoán khớp thực tế, ✘ = lệch)');
    printTable(KEYS, [
      ['Kịch bản', (k) => k],
      ...SHORT.map((lv, i) => [lv, (k) => (measured[k] ? `${measured[k][i].actual} ${measured[k][i].ok ? '✔' : '✘'}` : '— từ chối')]),
      ['Giải thích (why)', (k) => PREDICTIONS?.[k]?.why?.trim() || '(chưa viết why)'],
    ]);
    console.log('');
    for (const key of complete) {
      const hits = measured[key].filter((c) => c.ok).length;
      const ok = hits === measured[key].length;
      verdict(ok, `${key}: dự đoán khớp thực tế ${hits}/${measured[key].length} mức`);
      if (!ok) failed = true;
    }
    if (refused.length > 0) console.log(`\n${refused.length} dòng bị từ chối chưa đo: ${refused.join(', ')}`);

    if (Array.isArray(REVIEW_ANSWERS)) printReview(REVIEW_ANSWERS);
    if (PART_D) {
      if (!(await runPartD(lab, sc))) failed = true;
    }
  } finally {
    if (lab) {
      await lab.A.query('ROLLBACK').catch(() => {});
      await lab.B.query('ROLLBACK').catch(() => {});
      await lab.O.query(sc.cleanup).catch(() => {});
      await lab.closeAll();
    }
  }
  return failed ? 1 : 0;
}

process.exitCode = await main().catch((err) => {
  console.error(`Lỗi khi chạy bài tập: ${err.message}`);
  return 1;
});
