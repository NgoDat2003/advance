// Homework (slide 41), part B — runner: `node homework-runner.mjs <theories-file.mjs>`.
// Loads the learner's predictions and blanks, refuses every theory that still holds '???' or a value outside the
// allow-list (no free SQL ever reaches the database), then runs the correct measurement for each filled theory and
// prints it in the slide-41 format: Phát biểu | SQL | Kết quả | Dự đoán vs thực tế | Giải thích.
// The measurements themselves live in homework-theory-definitions.mjs.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { connect, heading, printTable } from './pg-explain-kit.mjs';
import { THEORY_SPECS } from './homework-theory-definitions.mjs';

const PLACEHOLDER = '???';

/** Validates one theory entry; returns the parsed blanks and the list of fields the learner still has to fix. */
function checkEntry(id, spec, entry) {
  if (!entry || typeof entry !== 'object') return { blanks: {}, problems: [`thiếu THEORIES.${id} trong file`] };
  const blanks = {};
  const problems = [];
  for (const [key, [hint, parse]] of Object.entries(spec.blanks)) {
    const raw = entry.blanks?.[key];
    if (raw === undefined || raw === PLACEHOLDER) {
      problems.push(`${id}.blanks.${key}: điền ${hint}`);
      continue;
    }
    const parsed = parse(raw);
    if (parsed.error) problems.push(`${id}.blanks.${key} = '${raw}': ${parsed.error}`);
    else blanks[key] = parsed.value;
  }
  for (const [key, [question, options]] of Object.entries(spec.predict)) {
    const value = entry.predict?.[key];
    const choices = options.map((o) => `'${o}'`).join(' | ');
    if (value === undefined || value === PLACEHOLDER) problems.push(`${id}.predict.${key}: ${question} → ${choices}`);
    else if (!options.includes(value)) problems.push(`${id}.predict.${key} = '${value}' không hợp lệ → ${choices}`);
  }
  if (entry.explain !== undefined && typeof entry.explain !== 'string') problems.push(`${id}.explain phải là chuỗi '...'`);
  return { blanks, problems };
}

/** Runs one theory and prints the slide-41 block. Returns the line for the final summary. */
async function runTheory(client, { id, spec, entry, blanks }) {
  heading(`${id} · slide ${spec.slide}`);
  console.log(`Phát biểu: ${spec.statement}`);
  console.log('SQL (mỗi index tạo trong BEGIN … ROLLBACK, đo 1 lần khởi động + trung vị 5 lần, tính số trang):');
  spec.sql(blanks).forEach((line) => console.log(`  ${line}`));
  const result = await spec.run(client, blanks);
  console.log('Kết quả:');
  printTable(result.rows, result.cols);
  result.notes.forEach((note) => console.log(`  ${note}`));
  console.log('Dự đoán của bạn vs thực tế:');
  const hits = Object.entries(spec.predict).map(([key, [question]]) => {
    const ok = entry.predict[key] === result.actual[key];
    console.log(`  ${ok ? '✔' : '✘'} ${question} Bạn: '${entry.predict[key]}' · Đo được: '${result.actual[key]}'`);
    return ok;
  });
  // Neutral marker: "the slide's theory is wrong" is a finding, not a failed lab, so no ✔/✘ here.
  console.log(`   => KẾT LUẬN · Lý thuyết ${result.conclusion.label}: ${result.conclusion.text}`);
  console.log('Giải thích (2–3 câu):');
  if (entry.explain?.trim()) console.log(`  ${entry.explain.trim()}`);
  else console.log(`  ________ (viết vào ${id}.explain rồi chạy lại)\n  Gợi ý từ: ${spec.wordBank.join(' · ')}`);
  const score = hits.filter(Boolean).length;
  return { id, pass: score === hits.length, score, total: hits.length, label: result.conclusion.label, evidence: result.evidence };
}

function printReviewAnswers(review) {
  heading('Phần C — lỗi cài sẵn trong homework-ai-draft.mjs (đáp án)');
  for (const [id, flaws] of Object.entries(review)) {
    flaws.forEach((f, i) => console.log(`${id}.${i + 1} ✘ ${f.flaw}\n      → Sửa: ${f.fix}`));
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Cách dùng: node homework-runner.mjs <file-lý-thuyết.mjs>   (hoặc: npm run homework)');
    return 1;
  }
  let mod;
  try {
    mod = await import(pathToFileURL(path.resolve(file)).href);
  } catch (err) {
    console.error(`Không đọc được ${file}: ${err.message}`);
    return 1;
  }
  const theories = Object.entries(THEORY_SPECS).map(([id, spec]) => {
    const entry = mod.THEORIES?.[id];
    return { id, spec, entry, ...checkEntry(id, spec, entry) };
  });
  const refused = theories.filter((t) => t.problems.length);
  const ready = theories.filter((t) => !t.problems.length);

  if (refused.length) {
    heading(`Chưa chạy ${refused.map((t) => t.id).join(', ')}: còn '???' hoặc giá trị không hợp lệ trong ${path.basename(file)}`);
    refused.forEach((t) => t.problems.forEach((p) => console.log(`  ✘ ${p}`)));
    console.log(`Hãy DỰ ĐOÁN trước khi đo: sửa từng dòng ✘ ở trên ('???' → một lựa chọn hợp lệ), lưu file, chạy lại.`);
    console.log('Lý thuyết nào đã điền đủ sẽ được đo ngay, không cần điền hết cả 3 một lúc.');
  }
  if (!ready.length) return 1;

  const client = await connect();
  const summary = [];
  try {
    const { rows } = await client.query(`SELECT to_regclass('lab03_indexing.hw_contracts') IS NOT NULL AS ok`);
    if (!rows[0].ok) throw new Error('Chưa có bảng hw_contracts. Chạy trước: npm run homework:setup');
    // Each theory builds one candidate index at a time; a leftover index (e.g. the AI draft interrupted with Ctrl+C)
    // would let the planner pick something else and silently change the grading.
    const { rows: stray } = await client.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'lab03_indexing' AND tablename = 'hw_contracts'
          AND indexname <> 'hw_contracts_pkey' ORDER BY 1`);
    if (stray.length) {
      throw new Error(`hw_contracts còn index lạ (${stray.map((r) => r.indexname).join(', ')}), thường do homework:draft bị ngắt giữa chừng. `
        + `Xóa rồi chạy lại: ${stray.map((r) => `DROP INDEX lab03_indexing.${r.indexname};`).join(' ')}`);
    }
    for (const t of ready) summary.push(await runTheory(client, t));
  } catch (err) {
    console.error(`✘ Lỗi khi đo: ${err.message}`);
    return 1;
  } finally {
    await client.end();
  }

  heading('Tổng kết');
  for (const s of summary) {
    console.log(`${s.pass ? 'PASS' : 'CHƯA KHỚP'} ${s.id} · dự đoán đúng ${s.score}/${s.total} · lý thuyết ${s.label} · ${s.evidence}`);
  }
  if (mod.REVIEW_ANSWERS) printReviewAnswers(mod.REVIEW_ANSWERS);
  if (refused.length) console.log(`\n(Mã thoát 1: còn ${refused.map((t) => t.id).join(', ')} chưa điền xong; các lý thuyết ở trên đã được đo bình thường.)`);
  return refused.length ? 1 : 0;
}

process.exitCode = await main();
