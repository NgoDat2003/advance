// Ráp guide Bài 06 Redis từ các mảnh: shell-css.part + shell-head.html + fragments/stage-01..09.html + shell-tail.html.
//   /*@QUIZ@*/                 → quiz JSON các chặng (fragments/stage-0N.quiz.json)
//   /*@WIDGETS@*/              → widgets/w1.js … w9.js, mỗi file bọc trong { } bên trong IIFE của shell-tail
//   <!--@CMD file#region@-->   → khối <pre data-cmd> chép từ labs/lesson-06-redis qua verify/lab-text.mjs (displayText)
//   <pre … data-cmd="…">       → mọi khối có sẵn trong fragment cũng được chép lại từ labs (sửa file lab là guide tự cập nhật)
//   <!--@RUN id [head=N|tail=N]@--> → nhãn ngày chạy + <pre data-run> chép từ runs/<id>.txt (bỏ dòng header "# chạy lúc"/"# lua")
//   runs/data/wN.json          → <script type="application/json" id="run-wN"> ngay trước script chính
// Dùng (ở thư mục plan): node assembly/assemble.mjs [--allow-stubs]
//   --allow-stubs: chặng/quiz/widget/lab/run chưa có thì chèn chỗ giữ (kèm id="sl-NN" của slide Đúng một phần / Cần sửa
//                  lấy từ SLIDES), thay vì dừng lỗi.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { displayText } from '../verify/lab-text.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAN = resolve(HERE, '..');
const ROOT = resolve(PLAN, '../..');
const LABS = join(ROOT, 'labs/lesson-06-redis');
const RUNS = join(PLAN, 'runs');
const OUT = join(ROOT, 'reports/advanced_backend/lesson_06_redis_teacher_guide.html');
const STAGES = 9;
const WIDGETS = 9;

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('Dùng: node assembly/assemble.mjs [--allow-stubs]\nGhi ' + OUT);
  process.exit(0);
}
const unknown = argv.filter((a) => a !== '--allow-stubs');
if (unknown.length) { console.error('✘ cờ lạ: ' + unknown.join(' ') + ' (chỉ có --allow-stubs, --help)'); process.exit(2); }
const allowStubs = argv.includes('--allow-stubs');

const read = (f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const die = (msg) => { console.error('✘ ' + msg); process.exit(1); };
const stubs = [];
const stubOr = (msg) => { if (!allowStubs) die(msg); stubs.push(msg); };

// "01-why-fast#slowlog" → labs/01-why-fast.redis (thử .redis rồi .sh khi không ghi đuôi), giống labRef của verifier.
function labFile(file) {
  const f = join(LABS, file);
  if (/\.(redis|sh|lua|ts|mjs|js|json)$/.test(file)) return f;
  return [f + '.redis', f + '.sh'].find(existsSync) ?? f + '.redis';
}
function cmdText(ref) {
  const [file, region] = ref.split('#');
  return displayText(labFile(file), region);
}

// Khối kết quả: nhãn (kèm ngày từ header nếu có) + pre[data-run]. Trả null khi chưa có run.
function runBlock(spec) {
  const [id, ...opts] = spec.split(/\s+/);
  const f = join(RUNS, id + '.txt');
  if (!existsSync(f)) return null;
  const all = read(f).replace(/\n+$/, '').split('\n');
  const date = (all[0].match(/^# chạy lúc (\d{2}\/\d{2}\/\d{4})/) ?? [])[1];
  let lines = all.filter((l) => !/^# (chạy lúc|lua) /.test(l));
  for (const o of opts) {
    const m = o.match(/^(head|tail)=(\d+)$/);
    if (!m) die(`@RUN ${spec}: tùy chọn lạ "${o}" (chỉ head=N hoặc tail=N)`);
    const n = Number(m[2]);
    if (lines.length > n) lines = m[1] === 'head' ? [...lines.slice(0, n), '…'] : ['…', ...lines.slice(-n)];
  }
  const label = date ? `Kết quả đã chạy trên máy bạn ngày ${date} · <code>${esc(id)}</code>` : `Kết quả đã ghi · <code>${esc(id)}</code>`;
  return `<div class="run-label">${label}</div>\n<div class="code terminal"><pre class="code terminal" data-run="${esc(id)}">${esc(lines.join('\n'))}</pre></div>`;
}

// SLIDES lấy từ shell-tail (một nguồn duy nhất) để dựng chỗ giữ #sl-NN cho chặng chưa viết.
function slidesFrom(tail) {
  const m = tail.match(/\/\* === GUIDE_DATA_START === \*\/([\s\S]*?)\/\* === GUIDE_DATA_END === \*\//);
  if (!m) die('shell-tail.html thiếu khối GUIDE_DATA_START/END');
  const ctx = {};
  try { vm.runInNewContext(m[1].replace('/*@QUIZ@*/', '{}') + '\n;this.SLIDES = SLIDES;', ctx); } catch (e) { die('GUIDE_DATA không chạy được: ' + e.message); }
  if (!Array.isArray(ctx.SLIDES)) die('SLIDES không phải mảng');
  return ctx.SLIDES;
}
const CHIP_CLASS = { 'Đúng trên Redis 7.2': 'ok', 'Đúng một phần': 'diff', 'Cần sửa': 'fix' };
function stubStage(n, slides) {
  const anchors = slides.filter((s) => s.stage === n && String(s.href).startsWith('#sl-')).map((s) =>
    `<div class="callout" id="${esc(s.href.slice(1))}"><span class="tag">Slide ${s.n} · <span class="vchip ${CHIP_CLASS[s.chip] ?? 'none'}">${esc(String(s.chip))}</span></span><p class="muted">${esc(s.title)} (đang viết)</p></div>`);
  return `\n<section id="chang-${n}" class="stage col"><h2>Chặng ${n} (đang viết)</h2><p class="goal">…</p><dl class="wwh"></dl>${anchors.join('')}<div class="callout challenge"></div><div class="quiz" data-quiz="${n}"></div></section>\n`;
}

const tail = read(join(HERE, 'shell-tail.html'));
const slides = slidesFrom(tail);
const parts = [read(join(HERE, 'shell-css.part')), read(join(HERE, 'shell-head.html'))];
const quiz = {};
for (let n = 1; n <= STAGES; n++) {
  const f = join(HERE, 'fragments', `stage-0${n}.html`);
  if (existsSync(f)) parts.push(`\n<!-- CHẶNG ${n} -->\n` + read(f).trim() + '\n');
  else { stubOr(`missing fragment stage-0${n}`); parts.push(stubStage(n, slides)); }
  const q = join(HERE, 'fragments', `stage-0${n}.quiz.json`);
  if (existsSync(q)) {
    try { quiz[n] = JSON.parse(read(q)); } catch (e) { die(`stage-0${n}.quiz.json lỗi JSON: ${e.message}`); }
  } else stubOr(`missing quiz stage-0${n}`);
}
let html = parts.join('') + tail;

// <!--@CMD ref@--> → khối code rỗng; bước sau điền chữ từ labs.
html = html.replace(/<!--@CMD ([^@]+)@-->/g, (_, ref) => {
  ref = ref.trim();
  if (cmdText(ref) === null) { stubOr(`không có file/region lab ${ref}`); return `<p class="muted">(Khối lệnh <code>${esc(ref)}</code> sẽ có khi file lab được viết.)</p>`; }
  return `<div class="code"><pre data-cmd="${esc(ref)}"><code></code></pre></div>`;
});
// Mọi <pre data-cmd> (shell và fragment) được chép lại nguyên văn từ labs.
html = html.replace(/<pre([^>]*?)\sdata-cmd="([^"]+)"([^>]*)><code>[\s\S]*?<\/code><\/pre>/g, (whole, a, ref, b) => {
  const text = cmdText(ref);
  if (text === null) { stubOr(`không có file/region lab ${ref}`); return whole; }
  return `<pre${a} data-cmd="${ref}"${b}><code>${esc(text)}</code></pre>`;
});
html = html.replace(/<!--@RUN ([^@]+)@-->/g, (_, spec) => {
  spec = spec.trim();
  const block = runBlock(spec);
  if (block !== null) return block;
  stubOr(`missing run ${spec.split(/\s+/)[0]}`);
  return `<p class="muted">(Kết quả <code>${esc(spec.split(/\s+/)[0])}</code> sẽ có sau khi chạy thí nghiệm.)</p>`;
});

// Ô nhập nằm ngoài <label> và chưa có aria-label: lấy placeholder làm tên truy cập (placeholder biến mất khi đã gõ,
// trình đọc màn hình cần một tên cố định). Chỉ xử lý HTML, không đụng vào nội dung <script>.
function labelFields(src) {
  let depth = 0;
  return src.split(/(<script[\s\S]*?<\/script>)/).map((seg, i) => (i % 2 ? seg : seg.replace(/<(\/?)(label|input|textarea)\b([^>]*)>/gi, (whole, close, tag, attrs) => {
    if (tag.toLowerCase() === 'label') { depth = Math.max(0, depth + (close ? -1 : 1)); return whole; }
    if (close || depth > 0 || /\saria-label(?:ledby)?=/.test(attrs)) return whole;
    const ph = attrs.match(/\splaceholder="([^"]*)"/);
    return ph ? `<${tag}${attrs} aria-label="${ph[1]}">` : whole;
  }))).join('');
}
html = labelFields(html);

if (!html.includes('/*@QUIZ@*/')) die('thiếu placeholder QUIZ');
// Hàm thay thế: không diễn giải $$ hay $&. \u003c giữ chuỗi "</script>" trong quiz không đóng thẻ script.
html = html.replace('/*@QUIZ@*/', () => JSON.stringify(quiz, null, 1).replace(/</g, '\\u003c'));

const widgets = [];
for (let n = 1; n <= WIDGETS; n++) {
  const f = join(HERE, 'widgets', `w${n}.js`);
  if (existsSync(f)) widgets.push(`// ── W${n} ──\n  {\n${read(f).trim()}\n  }`);
  else stubOr(`missing widget w${n}.js`);
}
if (!html.includes('/*@WIDGETS@*/')) die('thiếu placeholder WIDGETS');
html = html.replace('/*@WIDGETS@*/', () => widgets.join('\n\n  '));

const dataDir = join(RUNS, 'data');
let jsonTags = [];
if (existsSync(dataDir)) {
  jsonTags = readdirSync(dataDir).filter((f) => /^w[1-9]\.json$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
    .map((f) => {
      let data;
      try { data = JSON.parse(read(join(dataDir, f))); } catch (e) { die(`runs/data/${f} lỗi JSON: ${e.message}`); }
      return `<script type="application/json" id="run-${f.replace('.json', '')}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
    });
} else stubOr('chưa có runs/data');
const at = html.lastIndexOf('<script>\n/* === GUIDE_DATA_START');
if (at < 0) die('không tìm thấy khối script chính');
html = html.slice(0, at) + '<!-- Dữ liệu widget: chép từ runs/data/wN.json (mỗi số có trong runs/*.txt) -->\n' + jsonTags.join('\n') + '\n' + html.slice(at);

writeFileSync(OUT, html);
const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`✔ đã ghi ${OUT} (${kb} KB, ${Object.keys(quiz).length} quiz, ${widgets.length} widget, ${jsonTags.length} JSON)`);
if (stubs.length) console.log(`– ${stubs.length} chỗ giữ (--allow-stubs):\n  ` + stubs.join('\n  '));
