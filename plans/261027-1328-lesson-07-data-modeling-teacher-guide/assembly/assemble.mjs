// Ráp guide Bài 07 từ các mảnh: shell-css.part + shell-head.html + fragments/stage-01..09.html + shell-tail.html.
// Thay /*@QUIZ@*/ bằng quiz JSON các chặng, /*@WIDGETS@*/ bằng widgets/wN.js (mỗi file bọc trong { }),
// <!--@SQL file#region@--> bằng khối <pre data-sql> chép nguyên văn từ labs, và chèn runs/data/wN.json làm <script type="application/json">.
// Dùng: node assembly/assemble.mjs [--allow-stubs]   (chạy ở thư mục plan)
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAN = resolve(HERE, '..');
const ROOT = resolve(PLAN, '../..');
const LABS = join(ROOT, 'labs/lesson-07-data-modeling');
const OUT = join(ROOT, 'reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html');
const allowStubs = process.argv.includes('--allow-stubs');
const read = (f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const die = (msg) => { console.error('✘ ' + msg); process.exit(1); };

function sqlBlock(ref) {
  const [file, region] = ref.split('#');
  const f = join(LABS, /\.(sql|prisma)$/.test(file) ? file : file + '.sql');
  if (!existsSync(f)) die('không có file ' + f);
  let text = read(f).replace(/\n+$/, '');
  if (region) {
    const lines = text.split('\n');
    const a = lines.findIndex((l) => l.startsWith(`-- #region ${region} `));
    if (a < 0) die(`không có region ${ref}`);
    const b = lines.findIndex((l, i) => i > a && l.startsWith('-- #endregion'));
    text = lines.slice(a, b + 1).join('\n');
  }
  return `<div class="code"><pre data-sql="${ref}"><code>${esc(text)}</code></pre></div>`;
}

const parts = [read(join(HERE, 'shell-css.part')), read(join(HERE, 'shell-head.html'))];
const quiz = {};
for (let n = 1; n <= 9; n++) {
  const f = join(HERE, 'fragments', `stage-0${n}.html`);
  if (existsSync(f)) parts.push(`\n<!-- CHẶNG ${n} -->\n` + read(f).trim() + '\n');
  else if (allowStubs) parts.push(`\n<section id="chang-${n}" class="stage col"><h2>Chặng ${n} (đang viết)</h2><p class="goal">…</p><dl class="wwh"></dl><div class="callout challenge"></div><div class="quiz" data-quiz="${n}"></div></section>\n`);
  else die(`missing fragment stage-0${n}`);
  const q = join(HERE, 'fragments', `stage-0${n}.quiz.json`);
  if (existsSync(q)) quiz[n] = JSON.parse(read(q));
  else if (!allowStubs) die(`missing quiz stage-0${n}`);
}
let tail = read(join(HERE, 'shell-tail.html'));
let html = parts.join('') + tail;

html = html.replace(/<!--@SQL ([^@]+)@-->/g, (_, ref) => sqlBlock(ref.trim()));
// Mọi khối <pre data-sql> trong fragment được chép lại từ labs: sửa file .sql là guide tự cập nhật.
html = html.replace(/<pre data-sql="([^"]+)"><code>[\s\S]*?<\/code><\/pre>/g, (_, ref) => sqlBlock(ref).replace(/^<div class="code">|<\/div>$/g, ''));
if (!html.includes('/*@QUIZ@*/')) die('thiếu placeholder QUIZ');
html = html.replace('/*@QUIZ@*/', () => JSON.stringify(quiz, null, 1));   // hàm thay thế: không diễn giải $$ hay $&

const widgets = [];
for (let n = 1; n <= 10; n++) {
  const f = join(HERE, 'widgets', `w${n}.js`);
  if (existsSync(f)) widgets.push(`// ── W${n} ──\n  {\n${read(f).trim()}\n  }`);
  else if (!allowStubs) die(`missing widget w${n}.js`);
}
if (!html.includes('/*@WIDGETS@*/')) die('thiếu placeholder WIDGETS');
html = html.replace('/*@WIDGETS@*/', () => widgets.join('\n\n  '));

const dataDir = join(PLAN, 'runs/data');
const jsonTags = readdirSync(dataDir).filter((f) => /^w\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
  .map((f) => `<script type="application/json" id="run-${f.replace('.json', '')}">${JSON.stringify(JSON.parse(read(join(dataDir, f)))).replace(/</g, '\\u003c')}</script>`);
const at = html.lastIndexOf('<script>\n/* === GUIDE_DATA_START');
if (at < 0) die('không tìm thấy khối script chính');
html = html.slice(0, at) + '<!-- Dữ liệu widget: chép từ runs/data/wN.json (mỗi số có trong runs/*.txt) -->\n' + jsonTags.join('\n') + '\n' + html.slice(at);

writeFileSync(OUT, html);
console.log(`✔ đã ghi ${OUT} (${Math.round(Buffer.byteLength(html) / 1024)} KB, ${Object.keys(quiz).length} quiz, ${widgets.length} widget)`);
