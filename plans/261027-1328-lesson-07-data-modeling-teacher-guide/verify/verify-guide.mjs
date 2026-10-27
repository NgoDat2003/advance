// Bộ kiểm tra guide Bài 07 (công cụ của controller, học viên không cần đọc).
// Chế độ:
//   node verify-guide.mjs                 → V01–V15 trên file guide
//   node verify-guide.mjs --only V04,V09   → chỉ chạy các mã liệt kê
//   node verify-guide.mjs --runs           → mỗi dòng expected.tsv khớp regex với file run tương ứng
//   node verify-guide.mjs --data           → mỗi số trong runs/data/wN.json có mặt trong run nguồn
//   node verify-guide.mjs --fragment <f>   → V05, V06, V07, V09, V12 trên một fragment
//   node verify-guide.mjs --selftest       → tự kiểm chứng V05/V07 trên fixture nhỏ (phải bắt được lỗi)
// Tùy chọn: --guide <file> --labs <dir> --runs-dir <dir>
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAN = resolve(HERE, '..');
const ROOT = resolve(PLAN, '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const GUIDE = resolve(opt('--guide', join(ROOT, 'reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html')));
let LABS = resolve(opt('--labs', join(ROOT, 'labs/lesson-07-data-modeling')));
let RUNS = resolve(opt('--runs-dir', join(PLAN, 'runs')));

const fails = [];
const fail = (code, msg) => fails.push(`${code} ${msg}`);
const read = (f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const stripTags = (s) => s.replace(/<[^>]+>/g, '');

// "05-data-types#money" → runs/05-data-types.money.txt; "03-fk-race.nofk.timeline" → runs/03-fk-race.nofk.timeline.txt
const runFile = (id) => join(RUNS, id.replace('#', '.') + '.txt');
const runText = (id) => (existsSync(runFile(id)) ? read(runFile(id)) : null);
function regionText(ref) {
  const [file, region] = ref.split('#');
  const f = join(LABS, file.endsWith('.sql') || file.endsWith('.prisma') ? file : file + '.sql');
  if (!existsSync(f)) return null;
  const text = read(f);
  if (!region) return text.replace(/\n+$/, '');
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`-- #region ${region} `));
  if (start < 0) return null;
  const end = lines.findIndex((l, i) => i > start && l.startsWith('-- #endregion'));
  return lines.slice(start, end + 1).join('\n');
}

function checkFragmentish(html, codes) {
  if (codes.has('V05')) {
    for (const m of html.matchAll(/<pre[^>]*data-sql="([^"]+)"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)) {
      const want = regionText(m[1]);
      const got = unescape(m[2]).replace(/\n+$/, '');
      if (want === null) fail('V05', `${m[1]}: không tìm thấy region trong labs`);
      else if (want !== got) {
        const a = want.split('\n'), b = got.split('\n');
        const i = a.findIndex((l, k) => l !== b[k]);
        fail('V05', `${m[1]}: khác file .sql ở dòng ${i + 1}: "${(b[i] ?? '').slice(0, 60)}" ≠ "${(a[i] ?? '').slice(0, 60)}"`);
      }
    }
  }
  if (codes.has('V06')) {
    for (const m of html.matchAll(/<pre[^>]*data-run="([^"]+)"[^>]*>([\s\S]*?)<\/pre>/g)) {
      const t = runText(m[1]);
      if (t === null) { fail('V06', `${m[1]}: thiếu file run`); continue; }
      const runLines = t.split('\n').map((l) => l.trimEnd());
      let pos = 0;
      for (const raw of unescape(stripTags(m[2])).split('\n')) {
        const line = raw.trimEnd();
        if (!line.trim() || line.trim() === '…') continue;
        const k = runLines.indexOf(line, pos);
        if (k < 0) { fail('V06', `${m[1]}: dòng không có (hoặc sai thứ tự) trong run: "${line.slice(0, 70)}"`); break; }
        pos = k + 1;
      }
    }
  }
  if (codes.has('V07')) {
    for (const m of html.matchAll(/<b class="m" data-run="([^"]+)">([\s\S]*?)<\/b>/g)) {
      const t = runText(m[1]);
      const v = unescape(stripTags(m[2])).trim();
      if (t === null) fail('V07', `${m[1]}: thiếu file run`);
      // Số 1–2 chữ số phải là một ô kết quả psql đứng riêng ("   1" hoặc "| 1 |"), vì "7" có sẵn trong "id = 7".
      else if (/^\d{1,2}$/.test(v) && !new RegExp(`(^|\\|)\\s*${v}\\s*(\\||$)`, 'm').test(t)) fail('V07', `${m[1]}: số nhỏ "${v}" không phải ô kết quả nào trong run`);
      // Còn lại so theo ranh giới token: "1.140" không được khớp nhờ nằm trong "21.140".
      else if (!new RegExp(`(^|[^\\w.])${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`, 'm').test(t)) fail('V07', `${m[1]}: giá trị "${v}" không có trong run`);
    }
  }
  if (codes.has('V09')) {
    for (const m of html.matchAll(/data-store="([^"]+)"/g)) if (!m[1].startsWith('l07-')) fail('V09', `khóa lưu trữ sai tiền tố: ${m[1]}`);
    if (/\bl14-/.test(html)) fail('V09', 'còn sót chuỗi l14-');
  }
  if (codes.has('V12')) {
    for (const s of html.matchAll(/<section id="chang-(\d)"[\s\S]*?<\/section>/g)) {
      const body = s[0], n = s[1];
      for (const [need, re] of [['p.goal', /class="goal"/], ['dl.wwh', /<dl class="wwh"/], ['callout.challenge', /class="callout challenge"/], ['quiz', new RegExp(`data-quiz="${n}"`)]])
        if (!re.test(body)) fail('V12', `chang-${n}: thiếu ${need}`);
    }
  }
}

function guideData(html) {
  const m = html.match(/\/\* === GUIDE_DATA_START === \*\/([\s\S]*?)\/\* === GUIDE_DATA_END === \*\//);
  if (!m) return null;
  const ctx = {};
  vm.runInNewContext(m[1] + '\n;this.SLIDES = SLIDES; this.QUIZ = QUIZ; this.EXAM = EXAM;', ctx);
  return ctx;
}

function expectedRows() {
  const [head, ...rows] = read(join(HERE, 'expected.tsv')).trim().split('\n');
  const keys = head.split('\t');
  return rows.map((r) => Object.fromEntries(r.split('\t').map((v, i) => [keys[i], v])));
}

function checkGuide(codes) {
  if (!existsSync(GUIDE)) { fail('V01', 'guide missing: ' + GUIDE); return; }
  const html = read(GUIDE);
  const size = statSync(GUIDE).size;
  if (codes.has('V01') && size > 360 * 1024) fail('V01', `guide ${Math.round(size / 1024)} KB > 360 KB`);
  if (codes.has('V02')) {
    const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
    const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
    const stack = [];
    for (const m of body.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g)) {
      const [, close, tag0, self] = m; const tag = tag0.toLowerCase();
      if (VOID.has(tag) || self) continue;
      if (!close) stack.push(tag);
      else if (stack.pop() !== tag) { fail('V02', `thẻ đóng </${tag}> lệch gần vị trí ${m.index}`); break; }
    }
    if (stack.length && !fails.some((f) => f.startsWith('V02'))) fail('V02', `thẻ chưa đóng: ${stack.slice(-3).join(',')}`);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    if (dup.length) fail('V02', 'id trùng: ' + [...new Set(dup)].join(','));
    for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(m[1])) fail('V02', 'link tới id không tồn tại: #' + m[1]);
  }
  if (codes.has('V03')) for (const id of ['cach-hoc', ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => 'chang-' + n), 'bai-tap', 'prisma-drill', 'phong-van', 'cheat-sheet', 'ban-do-slide', 'tham-khao', 'tiep-theo'])
    if (!html.includes(`id="${id}"`)) fail('V03', 'thiếu section #' + id);
  let data = null;
  try { data = guideData(html); } catch (e) { fail('V04', 'GUIDE_DATA không chạy được: ' + e.message); }
  if (codes.has('V04') && data) {
    const valid = new Set([null, 'Đúng trên PG16', 'MySQL đúng, PG khác', 'Cần sửa']);
    const ns = data.SLIDES.map((s) => s.n).sort((a, b) => a - b);
    for (let n = 1; n <= 43; n++) if (ns.filter((x) => x === n).length !== 1) fail('V04', `slide ${n} xuất hiện ${ns.filter((x) => x === n).length} lần`);
    for (const s of data.SLIDES) if (!valid.has(s.chip)) fail('V04', `slide ${s.n}: chip lạ ${s.chip}`);
    // Chip của cả slide = mức nặng nhất trong các claim một-slide của nó (FIX > DIFF > OK).
    const chipName = { OK: 'Đúng trên PG16', DIFF: 'MySQL đúng, PG khác', FIX: 'Cần sửa' };
    const rank = { OK: 1, DIFF: 2, FIX: 3 };
    const worst = {};
    for (const r of expectedRows()) {
      if (!/^\d+$/.test(r.slides) || !chipName[r.chip] || r.status === 'deviation') continue;
      if (!worst[r.slides] || rank[r.chip] > rank[worst[r.slides].chip]) worst[r.slides] = r;
    }
    for (const [n, r] of Object.entries(worst)) {
      const s = data.SLIDES.find((x) => x.n === +n);
      if (s && s.chip !== chipName[r.chip]) fail('V04', `slide ${n}: chip "${s.chip}" ≠ expected.tsv ${r.id} "${chipName[r.chip]}"`);
    }
  }
  checkFragmentish(html, codes);
  if (codes.has('V08')) {
    for (const m of html.matchAll(/<script type="application\/json" id="run-(w\d+)">([\s\S]*?)<\/script>/g)) {
      const f = join(RUNS, 'data', m[1] + '.json');
      if (!existsSync(f)) { fail('V08', `${m[1]}: thiếu runs/data`); continue; }
      if (JSON.stringify(JSON.parse(m[2])) !== JSON.stringify(JSON.parse(read(f)))) fail('V08', `${m[1]}: JSON nhúng khác runs/data`);
    }
  }
  if (codes.has('V10')) {
    if (/<script[^>]*\ssrc=/i.test(html)) fail('V10', 'có <script src>');
    for (const m of html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g))
      if (!/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(m[1]) && !/<link[^>]*href="https?:/.test('')) {
        // link ngoài chỉ được phép là <a href> tham khảo; tài nguyên tải (link/src) chỉ fonts
        const ctx = html.slice(Math.max(0, m.index - 80), m.index);
        if (!/<a\s[^<]*$/.test(ctx)) fail('V10', 'tài nguyên ngoài: ' + m[1]);
      }
    for (const m of html.matchAll(/<img[^>]*src="([^"]+)"/g)) {
      const p = resolve(dirname(GUIDE), decodeURI(m[1]));
      if (!existsSync(p)) fail('V10', 'ảnh không tồn tại: ' + m[1]);
    }
  }
  if (codes.has('V11') && data) {
    for (let n = 1; n <= 9; n++) {
      const q = data.QUIZ[n];
      if (!q || q.length !== 4) fail('V11', `QUIZ ${n}: cần 4 câu, có ${q ? q.length : 0}`);
      else q.forEach((x, i) => { if (x.opts.length !== 4 || !(x.ans >= 0 && x.ans <= 3) || !x.why) fail('V11', `QUIZ ${n}.${i + 1} sai dạng`); });
    }
    if (!data.EXAM || data.EXAM.length !== 10) fail('V11', `EXAM cần 10 câu, có ${data.EXAM ? data.EXAM.length : 0}`);
  }
  if (codes.has('V16') && data) {
    // Số trong lời giải thích quiz và đáp án phỏng vấn: số ≥ 4 chữ số hoặc có phần thập phân phải có trong một file run.
    const all = readdirSync(RUNS).filter((x) => x.endsWith('.txt')).map((f) => read(join(RUNS, f))).join('\n');
    const texts = [...Object.values(data.QUIZ).flat().map((x) => x.why), ...data.EXAM.map((e) => e.a)];
    for (const t of texts) for (const m of t.matchAll(/(?<![\w.])\d+(?:\.\d+)?(?![\w])/g)) {
      const v = m[0];
      if (!(v.length >= 4 || v.includes('.'))) continue;
      if (!new RegExp(`(^|[^\\w.])${v.replace('.', '\\.')}(?![\\w])`, 'm').test(all)) fail('V16', `số "${v}" trong quiz/phỏng vấn không có trong run nào: "${t.slice(0, 60)}…"`);
    }
  }
  if (codes.has('V13')) {
    for (const m of html.matchAll(/class="run-label">[^<]*?ngày (\d{2}\/\d{2}\/\d{4})[\s\S]*?data-run="([^"]+)"/g)) {
      const t = runText(m[2]);
      const d = t && t.match(/^-- chạy lúc (\d{2}\/\d{2}\/\d{4})/m);
      if (t && d && d[1] !== m[1]) fail('V13', `${m[2]}: nhãn ngày ${m[1]} ≠ run ${d[1]}`);
      if (t && !d) {
        const tl = t.match(/^-- chạy lúc (\d{2}\/\d{2}\/\d{4})/m);
        if (!tl && !m[2].endsWith('.timeline')) fail('V13', `${m[2]}: run không có dòng ngày`);
      }
    }
  }
  if (codes.has('V14')) {
    if (!html.includes('@media (prefers-color-scheme: dark)') || !html.includes(':root:not([data-theme="light"])') || !html.includes(':root[data-theme="dark"]'))
      fail('V14', 'thiếu bộ chọn dark mode');
    if (!/body\s*\{[^}]*background/.test(html)) fail('V14', 'body thiếu background');
  }
  if (codes.has('V15')) {
    const bad = /postgres(ql)?:\/\/|password\s*=/i;
    if (bad.test(html)) fail('V15', 'guide chứa chuỗi kết nối/mật khẩu');
    for (const f of readdirSync(RUNS).filter((x) => x.endsWith('.txt'))) if (bad.test(read(join(RUNS, f)))) fail('V15', 'run chứa chuỗi kết nối: ' + f);
  }
}

function checkRuns() {
  const devs = existsSync(join(HERE, 'deviations.md')) ? read(join(HERE, 'deviations.md')) : '';
  for (const r of expectedRows()) {
    const t = runText(r.run);
    if (t === null) { fail(r.id, `missing run ${r.run}`); continue; }
    if (!new RegExp(r.regex, 'm').test(t)) {
      if (r.status === 'deviation' && devs.includes(r.id)) continue;
      fail(r.id, `${r.run}: không khớp /${r.regex}/ (${r.claim})`);
    }
    if (r.status === 'deviation' && !devs.includes(r.id)) fail(r.id, 'đánh dấu deviation nhưng thiếu dòng trong deviations.md');
  }
}

function checkData() {
  const dir = join(RUNS, 'data');
  if (!existsSync(dir)) { fail('DATA', 'chưa có runs/data'); return; }
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const j = JSON.parse(read(join(dir, f)));
    const src = (j.sources ?? []).map((id) => runText(id) ?? (fail('DATA', `${f}: nguồn ${id} không có`), '')).join('\n');
    const nums = [];
    const walk = (v, k) => {
      if (k === 'sources' || (typeof k === 'string' && k.startsWith('_'))) return;
      if (typeof v === 'number') nums.push(v);
      else if (Array.isArray(v)) v.forEach((x) => walk(x));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, x]) => walk(x, kk));
    };
    walk(j);
    for (const n of nums) {
      const forms = [String(n), n.toFixed(2), n.toFixed(3), n.toFixed(1)];
      if (!forms.some((s) => new RegExp(`(^|[^\\d.])${s.replace('.', '\\.')}(?![\\d])`).test(src))) fail('DATA', `${f}: ${n} không có trong nguồn`);
    }
  }
}

function selftest() {
  const T = join(HERE, 'tmp', 'selftest');
  mkdirSync(join(T, 'labs'), { recursive: true }); mkdirSync(join(T, 'runs'), { recursive: true });
  writeFileSync(join(T, 'labs', 'x.sql'), "-- #region a · thử (slide 1)\nSELECT 1 AS so;\n-- #endregion\n");
  writeFileSync(join(T, 'runs', 'x.a.txt'), '-- chạy lúc 27/10/2026 21:00 +0700 · PostgreSQL 16.15\n so \n----\n  1\n(1 row)\n');
  const good = '<pre data-sql="x#a"><code>-- #region a · thử (slide 1)\nSELECT 1 AS so;\n-- #endregion</code></pre><b class="m" data-run="x#a">1 row</b>';
  const cases = [['good', good, 0], ['V05', good.replace('SELECT 1', 'SELECT 2'), 1], ['V07', good.replace('1 row', '9 rows'), 1]];
  LABS = join(T, 'labs'); RUNS = join(T, 'runs');
  let ok = true;
  for (const [name, html, want] of cases) {
    fails.length = 0;
    checkFragmentish(html, new Set(['V05', 'V07']));
    const got = fails.length ? 1 : 0;
    console.log(`selftest ${name}: ${got === want ? 'đúng' : 'SAI'} (${fails.join(' | ') || 'không lỗi'})`);
    if (got !== want) ok = false;
  }
  fails.length = 0;
  if (!ok) fail('SELF', 'selftest thất bại');
}

const ALL = ['V01', 'V02', 'V03', 'V04', 'V05', 'V06', 'V07', 'V08', 'V09', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16'];
if (args.includes('--selftest')) selftest();
else if (args.includes('--runs')) checkRuns();
else if (args.includes('--data')) checkData();
else if (args.includes('--fragment')) checkFragmentish(read(resolve(opt('--fragment'))), new Set(['V05', 'V06', 'V07', 'V09', 'V12']));
else checkGuide(new Set(opt('--only') ? opt('--only').split(',') : ALL));

if (fails.length) { console.error(fails.join('\n')); console.error(`✘ ${fails.length} lỗi`); process.exit(1); }
console.log('✔ không có lỗi');
