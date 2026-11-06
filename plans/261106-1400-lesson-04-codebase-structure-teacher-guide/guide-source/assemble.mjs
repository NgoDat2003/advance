// Dựng lại guide từ guide-body.html, guide-data.js và runs/. Chạy: node plans/261106-1400-lesson-04-codebase-structure-teacher-guide/guide-source/assemble.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const wt = resolve(here, '../../..');
const runs = join(wt, 'plans/261106-1400-lesson-04-codebase-structure-teacher-guide/runs');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const runText = (id) => readFileSync(join(runs, id + '.txt'), 'utf8').replace(/\r\n/g, '\n').trim();

// CSS mượn nguyên từ guide Bài 14 để đồng bộ giao diện, thêm vài dòng cho bộ xếp loại.
const l14 = readFileSync(join(wt, 'reports/advanced_backend/lesson_14_locking_teacher_guide.html'), 'utf8');
const css = l14.match(/<style>([\s\S]*?)<\/style>/)[1];
const extra = `
.sorter td { vertical-align: middle; }
.sorter code { white-space: normal; overflow-wrap: anywhere; }
.sorter-pick { width: 190px; }
.sorter-why { margin-top: 6px; font-size: 0.88rem; }
.sorter .field { min-width: 0; }
.sayvs .code { margin: 6px 0; }
@media (max-width: 560px) {
  .sorter tr { display: grid; grid-template-columns: minmax(0, 1fr); border-bottom: 1px solid var(--line); }
  .sorter td { border: 0; width: auto; padding: 6px 12px; }
}
`;

// Dữ liệu widget đọc từ runs để không phải chép tay.
const lab1 = runText('lab1').split('\n').filter((l) => l.startsWith('GET ')).map((l) => {
  const m = l.match(/^GET (\S+) -> (\d+) (.*)$/);
  return { path: m[1], status: +m[2], body: m[3] };
});
const adapters = [];
let pendingNote = null;
for (const line of runText('lab4').split('\n')) {
  const head = line.match(/^== (.+)$/);
  const note = line.match(/^\s+(vi1=.*)$/);
  const res = line.match(/^\s+(PASS|FAIL)\s+(.*)$/);
  if (head) adapters.push({ name: head[1], cases: [] });
  else if (note) pendingNote = note[1];
  else if (res) { adapters.at(-1).cases.push({ name: res[2], ok: res[1] === 'PASS', note: pendingNote }); pendingNote = null; }
}
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

let body = readFileSync(join(here, 'guide-body.html'), 'utf8');
body = body.replace(/\{\{RUN:([\w-]+)\}\}/g, (_, id) => {
  const text = runText(id);
  const cmd = text.split('\n')[0].replace(/^\$ /, '').replace(/\s+#.*$/, '');
  return `<div class="run-label">Đã chạy ngày 06/11/2026 · <code>${esc(cmd)}</code></div>\n  <div class="code terminal"><pre class="code terminal" data-run="${id}">${esc(text)}</pre></div>`;
});
const js = readFileSync(join(here, 'guide-data.js'), 'utf8');

const out = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sổ tay Codebase Structure · Bài 04</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=JetBrains+Mono:wght@400;600&display=swap">
<style>${css}${extra}</style>
</head>
<body>
<div class="shell">
<main>
${body}
</main>
</div>
<script type="application/json" id="run-lab1">${json(lab1)}</script>
<script type="application/json" id="run-lab4">${json({ adapters })}</script>
<script>
${js}</script>
</body>
</html>
`;
writeFileSync(join(wt, 'reports/advanced_backend/lesson_04_codebase_structure_teacher_guide.html'), out);
console.log('assembled', out.length, 'chars;', adapters.length, 'adapters;', lab1.length, 'rows');
