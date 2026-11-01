// Bộ kiểm tra guide Bài 06 Redis (công cụ của controller, học viên không cần đọc). Khởi điểm từ verifier Bài 07.
// Chế độ:
//   node verify-guide.mjs                  → V01–V16, V19–V21 trên file guide
//   node verify-guide.mjs --only V04,V09    → chỉ các mã liệt kê
//   node verify-guide.mjs --runs            → mỗi dòng expected.tsv khớp run (regex + vị từ), cộng M01, D01, V18
//   node verify-guide.mjs --data            → runs/data/wN.json và derived.json truy được về run nguồn
//   node verify-guide.mjs --lint            → V17: luật an toàn của labs/lesson-06-redis (+ lệnh dọn rác docker bị cấm, quét cả verify/)
//   node verify-guide.mjs --fragment <f>    → V05, V06, V07, V09, V12, V19 trên một fragment + V11 trên stage-0N.quiz.json cạnh nó
//   node verify-guide.mjs --selftest        → tự kiểm chứng trên verify/fixtures (phải bắt được lỗi cài sẵn)
// Tùy chọn: --guide <file> --labs <dir> --runs-dir <dir> --expected <tsv> --deviations <md> --widgets <dir>
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { displayText, dockerCalls, redisArgs, regionText, regionIds } from './lab-text.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAN = resolve(HERE, '..');
const ROOT = resolve(PLAN, '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
let GUIDE = resolve(opt('--guide', join(ROOT, 'reports/advanced_backend/lesson_06_redis_teacher_guide.html')));
let LABS = resolve(opt('--labs', join(ROOT, 'labs/lesson-06-redis')));
let RUNS = resolve(opt('--runs-dir', join(PLAN, 'runs')));
let EXPECTED = resolve(opt('--expected', join(HERE, 'expected.tsv')));
let DEVS = resolve(opt('--deviations', join(HERE, 'deviations.md')));
let WIDGETS = resolve(opt('--widgets', join(PLAN, 'assembly/widgets')));

const CHIP = { OK: 'Đúng trên Redis 7.2', PART: 'Đúng một phần', FIX: 'Cần sửa' };
const RUN_ID = /\b\d{2}-[a-z-]+\.[a-z0-9-]+/;
const fails = [];
const fail = (code, msg) => fails.push(`${code} ${msg}`);
const read = (f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const stripTags = (s) => s.replace(/<[^>]+>/g, '');
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sha256 = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

const runFile = (id) => join(RUNS, id + '.txt');
const runText = (id) => (existsSync(runFile(id)) ? read(runFile(id)) : null);
const runFiles = () => (existsSync(RUNS) ? readdirSync(RUNS).filter((x) => x.endsWith('.txt')) : []);
// "01-why-fast.redis#slowlog" → [labs/01-why-fast.redis, "slowlog"]; không có đuôi thì thử .redis rồi .sh
function labRef(ref) {
  const [file, region] = ref.split('#');
  let f = join(LABS, file);
  if (!/\.(redis|sh|lua|ts|mjs|js|json)$/.test(file)) f = [f + '.redis', f + '.sh'].find(existsSync) ?? f + '.redis';
  return [f, region];
}

// ---------- vị từ trong cột regex của expected.tsv: "<regex> ⇒ b-a>=400; ratio(p16,p1)>=5; same:<run>" ----------
export function splitRule(col) { const [re, pred] = col.split(' ⇒ '); return { re, preds: pred ? pred.split(/;\s*/).filter(Boolean) : [] }; }
export function evalExpr(expr, groups) {
  const toks = []; const rx = /\s*(ratio|[A-Za-z_]\w*|\d+(?:\.\d+)?|>=|<=|==|!=|[-+*/(),<>])/y;
  let m; let pos = 0;
  while (pos < expr.length && (m = rx.exec(expr))) { toks.push(m[1]); pos = rx.lastIndex; }
  if (expr.slice(pos).trim()) throw new Error(`vị từ có ký tự lạ: "${expr}"`);
  const js = toks.map((t) => {
    if (t === 'ratio') return '__ratio';
    if (/^[A-Za-z_]/.test(t)) { if (!(t in groups)) throw new Error(`vị từ dùng nhóm "${t}" không có trong regex`); return `g[${JSON.stringify(t)}]`; }
    return t === '==' ? '===' : t === '!=' ? '!==' : t;
  }).join(' ');
  const g = Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, /^-?\d+(?:\.\d+)?$/.test(v ?? '') ? Number(v) : v]));
  return Function('g', '__ratio', `return (${js});`)(g, (a, b) => a / b);
}
// Trả về null nếu khớp, hoặc chuỗi lý do.
function checkRow(r, text) {
  const { re, preds } = splitRule(r.regex);
  const m = new RegExp(re, 'm').exec(text);
  if (!m) return `không khớp regex (${r.claim})`;
  const g = { ...(m.groups ?? {}) };
  for (const p of preds) {
    const same = p.match(/^same:(\S+)$/);
    if (same) {
      const other = runText(same[1]);
      const body = (t) => t.split('\n').filter((l) => !l.startsWith('# chạy lúc')).join('\n');
      if (other === null) return `vị từ same: thiếu run ${same[1]}`;
      if (body(other) !== body(text)) return `khác ${same[1]} (ngoài dòng header)`;
      continue;
    }
    let ok;
    try { ok = evalExpr(p, g); } catch (e) { return e.message; }
    if (!ok) return `vị từ sai: ${p} với ${Object.entries(g).map(([k, v]) => `${k}=${v}`).join(', ')}`;
  }
  return null;
}

// ---------- V07: giá trị b.m ----------
function derivedEntries() {
  const f = join(RUNS, 'data', 'derived.json');
  if (!existsSync(f)) return null;
  const j = JSON.parse(read(f));
  return Array.isArray(j) ? j : j.entries ?? [];
}
function smallNumberOk(v, t) {
  const e = reEsc(v);
  return new RegExp(`\\(integer\\) ${e}(?![\\d.])`).test(t) // (integer) N
    || new RegExp(`(^|\\s|\\d\\) |< )"${e}"`, 'm').test(t) // "N" hoặc 1) "N"
    || new RegExp(`[\\w.-][:=]${e}(?![\\w.])`).test(t) // name:N / name=N (INFO, keyspace)
    || new RegExp(`(^|< )${e}$`, 'm').test(t); // dòng trả lời raw chỉ có N (redis-cli không TTY trong .sh)
}
function checkBm(id, v, kind) {
  if (kind === 'derived') {
    const d = derivedEntries();
    const e = d && d.find((x) => x.name === id);
    if (!e) return fail('V07', `data-derived="${id}": không có trong runs/data/derived.json`);
    if (v !== String(e.value) && Number(v) !== e.value) fail('V07', `data-derived="${id}": "${v}" ≠ ${e.value}`);
    return;
  }
  const t = runText(id);
  if (t === null) return fail('V07', `${id}: thiếu file run`);
  if (/^-?\d{1,2}$/.test(v)) { if (!smallNumberOk(v, t)) fail('V07', `${id}: số nhỏ "${v}" không phải ô trả lời redis-cli nào trong run`); return; }
  if (!new RegExp(`(^|[^\\w.])${reEsc(v)}(?![\\w])`, 'm').test(outputText(t))) fail('V07', `${id}: giá trị "${v}" không có trong phần output của run (dòng lệnh đã gõ không tính)`);
}
// Phần output của một run: bỏ header, dòng lệnh "$ …" / "127.0.0.1:6379> …", và chữ lệnh của dòng gửi trong timeline
// (giữ mốc "+ms A >" vì chip giờ gửi lấy từ đó). Số chỉ có trong lệnh đã gõ (seq 1 1500, PX 2000…) không phải số đo.
export function outputText(t) {
  return t.split('\n').filter((l) => !/^(# |\$ |127\.0\.0\.1:6379> )/.test(l)).map((l) => l.replace(/^(\+\s*\d+ [AB] >) .*$/, '$1')).join('\n');
}

// ---------- V16: số trong lời giải thích quiz / đáp án phỏng vấn ----------
// Mỗi số (từ 2 chữ số, hoặc có phần thập phân) phải có trong chính các run mà câu đó trích (không tính dòng header giờ chạy).
// Số dính vào tên (hot=66/300, evicted_keys:925) phải khớp nguyên cụm, nên đổi chỗ hai số cũng bị bắt.
// Không tính: run id, số slide/chặng/bài/câu, mã HTTP, giá trị mặc định ("mặc định 60 s"), phiên bản Redis 7.2/7.2.3 và node-redis 6.3.0.
const RUN_REF = /\b(?:\d{2}-[a-z-]+\.[a-z0-9-]+(?:\.(?:A|B|timeline))?|hw-check\.[a-z-]+|check\.[a-z-]+|driver-claims)\b/g;
export function checkNumbers(texts, code = 'V16') {
  for (const t0 of texts) {
    const t = String(t0);
    const ids = [...new Set(t.match(RUN_REF) ?? [])].filter((id) => runText(id) !== null);
    if (!ids.length) { fail(code, `câu không trích run nào có file: "${t.slice(0, 60)}…"`); continue; }
    const src = ids.map((id) => runText(id).split('\n').filter((l) => !/^# (chạy lúc|lua) /.test(l)).join('\n')).join('\n');
    const plain = t.replace(RUN_REF, (m) => ' '.repeat(m.length));
    const seen = new Set();
    for (const m of plain.matchAll(/(?<![\w.])\d+(?:\.\d+)*(?![\w])/g)) {
      const v = m[0];
      if (v.length < 2 || /^(7\.2(\.3)?|6\.3\.0)$/.test(v)) continue;
      // 10% và 25% là hằng số của src/expire.c 7.2.3 (controller-facts-addendum mục 2), không phải số đo.
      if (plain[m.index + v.length] === '%' && (v === '10' || v === '25')) continue;
      if (/(slide|chặng|bài|câu|http|mặc định|lỗi)\s*$/i.test(plain.slice(Math.max(0, m.index - 12), m.index))) continue;
      const tok = plain.slice(0, m.index).match(/[\w.:=/-]*$/)[0] + v + plain.slice(m.index + v.length).match(/^[\w.:=/-]*/)[0];
      const whole = tok.replace(/[.:]+$/, '');
      const want = /[:=/]/.test(whole) && whole !== v ? whole : v;
      if (seen.has(want)) continue;
      seen.add(want);
      if (!new RegExp(`(^|[^\\w.])${reEsc(want)}(?![\\w])`, 'm').test(src)) fail(code, `"${want}" không có trong run được trích (${ids.join(', ')}): "${t.slice(0, 60)}…"`);
    }
  }
}

// ---------- V20: dòng sed in region từ file lab phải trỏ đúng region có thật ----------
// <code>sed -n '/#region X/,/#endregion/p' labs/lesson-06-redis/F</code>: F phải có region X; mỗi "s/A/B/" nối sau phải tìm thấy A
// trong region (không thì sed lặng lẽ không đổi gì). Đoạn văn ngay trước nói "giống/chỉ khác … tên chính sách" thì region X
// phải trùng region được nhắc từng dòng, sau khi đổi tên chính sách (bỏ dòng tiêu đề #region).
export function checkSedRegions(html) {
  for (const m of html.matchAll(/<code>([^<]*sed -n '\/#region ([a-z0-9-]+)[ /][^<]*?labs\/lesson-06-redis\/([\w.-]+)[^<]*)<\/code>/g)) {
    const line = unescape(m[1]).split('\n')[0];
    const [, , id, file] = m;
    const f = join(LABS, file);
    if (!regionIds(f).includes(id)) { fail('V20', `sed in region "${id}" nhưng ${file} không có region đó: ${line.slice(0, 80)}`); continue; }
    const text = regionText(f, id);
    for (const s of line.matchAll(/sed '((?:s\/[^/]*\/[^/]*\/;?\s*)+)'/g)) for (const p of s[1].matchAll(/s\/([^/]*)\//g)) {
      if (!text.includes(p[1])) fail('V20', `sed 's/${p[1]}/…/' không đổi gì: region ${id} của ${file} không có "${p[1]}"`);
    }
    const before = html.slice(0, m.index);
    const para = before.slice(before.lastIndexOf('<p>'));
    if (/(giống|chỉ khác)[\s\S]*tên chính sách/.test(para)) {
      const base = [...para.matchAll(/<code>((?:allkeys|volatile)-[a-z]+)<\/code>/g)].map((x) => x[1]).find((x) => x !== id);
      if (!base || !regionIds(f).includes(base)) { fail('V20', `đoạn văn trước sed ${id} nói "chỉ khác tên chính sách" nhưng không nêu region gốc có thật`); continue; }
      const body = (r, name) => regionText(f, r).split('\n').slice(1).join('\n').split(name).join('<POLICY>');
      if (body(id, id) !== body(base, base)) fail('V20', `region ${id} không trùng ${base} sau khi đổi tên chính sách, nhưng guide nói "chỉ khác tên chính sách"`);
    }
  }
}

// ---------- V21: mọi ô nhập phải có tên truy cập ----------
// <input>/<textarea>/<select> (trừ type=hidden) ngoài <script> phải nằm trong <label>, có aria-label/aria-labelledby, hoặc được <label for> trỏ tới.
export function checkFormLabels(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const fors = new Set([...body.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1]));
  let depth = 0;
  for (const m of body.matchAll(/<(\/?)(label|input|textarea|select)\b([^>]*)>/gi)) {
    const [, close, tag0, attrs] = m; const tag = tag0.toLowerCase();
    if (tag === 'label') { depth = Math.max(0, depth + (close ? -1 : 1)); continue; }
    if (close || /\stype="hidden"/.test(attrs) || depth > 0 || /\saria-label(?:ledby)?="[^"]+"/.test(attrs)) continue;
    const id = attrs.match(/\sid="([^"]+)"/)?.[1];
    if (id && fors.has(id)) continue;
    fail('V21', `<${tag}${attrs.slice(0, 70)}> không có nhãn (label / aria-label); placeholder không thay được nhãn`);
  }
}

// ---------- V19: nội suy trong innerHTML phải qua esc() hoặc là số ----------
function checkV19(text, where) {
  for (const m of text.matchAll(/(?:\.innerHTML\s*\+?=|\.outerHTML\s*=|insertAdjacentHTML\([^,]*,)\s*`/g)) {
    let i = m.index + m[0].length; let depth = 0; let start = -1;
    for (; i < text.length; i++) {
      const c = text[i];
      if (depth === 0 && c === '\\') { i++; continue; }
      if (depth === 0 && c === '`') break;
      if (depth === 0 && c === '$' && text[i + 1] === '{') { depth = 1; start = i + 2; i++; continue; }
      if (depth > 0) {
        if (c === '{') depth++;
        else if (c === '}' && --depth === 0) {
          const expr = text.slice(start, i).trim();
          if (!/^esc\(/.test(expr) && !/Number\(|\.toFixed\(/.test(expr)) fail('V19', `${where}: \${${expr.slice(0, 50)}} trong innerHTML không qua esc() và không phải số`);
        }
      }
    }
  }
}

// ---------- V11: quiz ----------
function checkQuizItems(items, label) {
  if (!Array.isArray(items) || items.length !== 4) return fail('V11', `${label}: cần 4 câu, có ${Array.isArray(items) ? items.length : 0}`);
  items.forEach((x, i) => {
    if (!x || typeof x.q !== 'string' || !Array.isArray(x.opts) || x.opts.length !== 4 || !(Number.isInteger(x.ans) && x.ans >= 0 && x.ans <= 3) || !x.why) fail('V11', `${label}.${i + 1} sai dạng {q, opts[4], ans 0–3, why}`);
    else if (!RUN_ID.test(x.why)) fail('V11', `${label}.${i + 1}: why không trích run id nào`);
  });
}

function checkFragmentish(html, codes, where = 'guide') {
  if (codes.has('V05')) {
    for (const m of html.matchAll(/<pre[^>]*data-cmd="([^"]+)"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)) {
      const [f, region] = labRef(m[1]);
      const want = displayText(f, region);
      const got = unescape(m[2]).replace(/\n+$/, '');
      if (want === null) fail('V05', `${m[1]}: không tìm thấy file/region trong labs`);
      else if (want !== got) {
        const a = want.split('\n'), b = got.split('\n');
        const i = a.findIndex((l, k) => l !== b[k]);
        fail('V05', `${m[1]}: khác file lab ở dòng ${i + 1}: "${(b[i] ?? '').slice(0, 60)}" ≠ "${(a[i] ?? '').slice(0, 60)}"`);
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
  if (codes.has('V07')) for (const m of html.matchAll(/<b class="m" data-(run|derived)="([^"]+)">([\s\S]*?)<\/b>/g)) checkBm(m[2], unescape(stripTags(m[3])).trim(), m[1]);
  if (codes.has('V09')) {
    for (const m of html.matchAll(/data-store="([^"]+)"/g)) if (!m[1].startsWith('l06-')) fail('V09', `khóa lưu trữ sai tiền tố: ${m[1]}`);
    for (const m of html.matchAll(/['"`](l(?!06)\d\d-[\w-]+)/g)) fail('V09', `còn sót khóa lưu trữ bài khác: ${m[1]}`);
  }
  if (codes.has('V12')) {
    for (const s of html.matchAll(/<section id="chang-(\d)"[\s\S]*?<\/section>/g)) {
      const body = s[0], n = s[1];
      const need = [['p.goal', /class="goal"/], ['dl.wwh', /<dl class="wwh"/], ['.story', /class="[^"]*\bstory\b/], ['figure/svg', /<figure|<svg/],
        ['table.stats', /<table class="[^"]*\bstats\b/], ['.check30', /class="[^"]*\bcheck30\b/], ['table.expect', /<table class="[^"]*\bexpect\b/],
        ['callout.challenge', /class="callout challenge"/], ['quiz', new RegExp(`data-quiz="${n}"`)]];
      for (const [name, re] of need) if (!re.test(body)) fail('V12', `chang-${n}: thiếu ${name}`);
    }
  }
  if (codes.has('V19')) checkV19(html, where);
}

function guideData(html) {
  const m = html.match(/\/\* === GUIDE_DATA_START === \*\/([\s\S]*?)\/\* === GUIDE_DATA_END === \*\//);
  if (!m) return null;
  const ctx = {};
  vm.runInNewContext(m[1] + '\n;this.SLIDES = SLIDES; this.QUIZ = QUIZ; this.EXAM = EXAM;', ctx);
  return ctx;
}

function expectedRows() {
  const [head, ...rows] = read(EXPECTED).trim().split('\n');
  const keys = head.split('\t');
  return rows.map((r) => Object.fromEntries(r.split('\t').map((v, i) => [keys[i], v])));
}

function checkGuide(codes) {
  if (!existsSync(GUIDE)) { fail('V01', 'guide missing: ' + GUIDE); return; }
  const html = read(GUIDE);
  const size = statSync(GUIDE).size;
  if (codes.has('V01') && size > 520 * 1024) fail('V01', `guide ${Math.round(size / 1024)} KB > 520 KB`);
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
  if (codes.has('V03')) for (const id of ['cach-hoc', ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => 'chang-' + n), 'bai-tap', 'driver-drill', 'phong-van', 'cheat-sheet', 'ban-do-slide', 'tham-khao', 'tiep-theo'])
    if (!html.includes(`id="${id}"`)) fail('V03', 'thiếu section #' + id);
  let data = null;
  try { data = guideData(html); } catch (e) { fail('V04', 'GUIDE_DATA không chạy được: ' + e.message); }
  if (codes.has('V04') && !data) fail('V04', 'không có khối GUIDE_DATA_START/END');
  if (codes.has('V04') && data) {
    const valid = new Set([null, ...Object.values(CHIP)]);
    const ns = data.SLIDES.map((s) => s.n);
    for (let n = 1; n <= 46; n++) { const c = ns.filter((x) => x === n).length; if (c !== 1) fail('V04', `slide ${n} xuất hiện ${c} lần`); }
    for (const s of data.SLIDES) if (!valid.has(s.chip)) fail('V04', `slide ${s.n}: chip lạ ${s.chip}`);
    // Mỗi slide có chip = đúng một dòng chip trong expected.tsv (kể cả dòng thiết kế D04/D05/D42); slide khác = null.
    const want = {};
    for (const r of expectedRows()) if (CHIP[r.chip]) want[r.slides] = r;
    for (const s of data.SLIDES) {
      const r = want[String(s.n)];
      const exp = r ? CHIP[r.chip] : null;
      if (s.chip !== exp) fail('V04', `slide ${s.n}: chip "${s.chip}" ≠ expected.tsv ${r ? r.id : '(không có dòng chip)'} "${exp}"`);
      if (r && r.chip !== 'OK' && !html.includes(`id="sl-${String(s.n).padStart(2, '0')}"`)) fail('V04', `slide ${s.n} (${r.chip}) thiếu id="sl-${String(s.n).padStart(2, '0')}"`);
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
    for (const m of html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) {
      if (/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(m[1])) continue;
      const ctx = html.slice(Math.max(0, m.index - 80), m.index);
      if (!/<a\s[^<]*$/.test(ctx)) fail('V10', 'tài nguyên ngoài: ' + m[1]); // chỉ <a href> tham khảo được trỏ ra ngoài
    }
    for (const m of html.matchAll(/<img[^>]*src="([^"]+)"/g)) if (!existsSync(resolve(dirname(GUIDE), decodeURI(m[1])))) fail('V10', 'ảnh không tồn tại: ' + m[1]);
  }
  if (codes.has('V11') && data) {
    for (let n = 1; n <= 9; n++) checkQuizItems(data.QUIZ[n], `QUIZ ${n}`);
    if (!data.EXAM || data.EXAM.length !== 10) fail('V11', `EXAM cần 10 câu, có ${data.EXAM ? data.EXAM.length : 0}`);
  }
  if (codes.has('V16') && data) checkNumbers([...Object.values(data.QUIZ).flat().map((x) => x.why), ...(data.EXAM ?? []).map((e) => e.a)]);
  if (codes.has('V20')) checkSedRegions(html);
  if (codes.has('V21')) checkFormLabels(html);
  if (codes.has('V13')) {
    for (const m of html.matchAll(/class="run-label">[^<]*?ngày (\d{2}\/\d{2}\/\d{4})[\s\S]*?data-run="([^"]+)"/g)) {
      const t = runText(m[2]);
      const d = t && t.match(/^# chạy lúc (\d{2}\/\d{2}\/\d{4})/m);
      if (t && !d) fail('V13', `${m[2]}: run không có dòng "# chạy lúc"`);
      if (t && d && d[1] !== m[1]) fail('V13', `${m[2]}: nhãn ngày ${m[1]} ≠ run ${d[1]}`);
    }
  }
  if (codes.has('V14')) {
    if (!html.includes('@media (prefers-color-scheme: dark)') || !html.includes(':root:not([data-theme="light"])') || !html.includes(':root[data-theme="dark"]')) fail('V14', 'thiếu bộ chọn dark mode');
    if (!/body\s*\{[^}]*background/.test(html)) fail('V14', 'body thiếu background');
  }
  if (codes.has('V15')) {
    const bad = /requirepass|AUTH |redis:\/\/[^ ]*@/;
    if (bad.test(html)) fail('V15', 'guide chứa mật khẩu / chuỗi kết nối có thông tin đăng nhập');
    for (const f of runFiles()) if (bad.test(read(join(RUNS, f)))) fail('V15', 'run chứa mật khẩu / chuỗi kết nối: ' + f);
  }
}

// ---------- --runs ----------
function checkRuns() {
  const devs = existsSync(DEVS) ? read(DEVS) : '';
  for (const r of expectedRows()) {
    if (r.status === 'deviation' && !new RegExp(`\\b${reEsc(r.id)}\\b`).test(devs)) fail('D01', `${r.id} đánh dấu deviation nhưng thiếu mục trong deviations.md`);
    if (r.run === '-') continue; // dòng thiết kế: chỉ V04 đọc
    const t = runText(r.run);
    if (t === null) { fail(r.id, `missing run ${r.run}`); continue; }
    const why = checkRow(r, t);
    if (why && !(r.status === 'deviation' && new RegExp(`\\b${reEsc(r.id)}\\b`).test(devs))) fail(r.id, `${r.run}: ${why}`);
  }
  // M01: manifest có đúng một dòng cho mỗi file run và hash khớp nội dung hiện tại.
  const mf = join(RUNS, 'manifest.tsv');
  const lines = existsSync(mf) ? read(mf).split('\n').filter(Boolean) : [];
  const seen = new Map();
  for (const l of lines) {
    const [h, p] = l.split('\t');
    seen.set(p, (seen.get(p) ?? 0) + 1);
    const f = join(RUNS, p ?? '');
    if (!p || !existsSync(f)) fail('M01', `manifest trỏ tới file không có: ${p}`);
    else if (sha256(f) !== h) fail('M01', `${p}: sha256 khác manifest (file bị sửa ngoài runner)`);
  }
  for (const [p, c] of seen) if (c > 1) fail('M01', `${p}: ${c} dòng trong manifest (phải đúng 1)`);
  for (const f of runFiles()) if (!seen.has(f)) fail('M01', `${f}: không có dòng trong manifest`);
  // V18: hash Lua ghi trong header run = hash file labs/lesson-06-redis/lua/<tên>.
  for (const f of runFiles()) for (const m of read(join(RUNS, f)).matchAll(/^# lua (\S+) sha256=(\S+)$/gm)) {
    const lf = join(LABS, 'lua', m[1]);
    if (!existsSync(lf)) fail('V18', `${f}: không có labs lua/${m[1]}`);
    else if (sha256(lf) !== m[2]) fail('V18', `${f}: lua/${m[1]} đã đổi so với lúc chạy (${m[2].slice(0, 12)}… ≠ ${sha256(lf).slice(0, 12)}…)`);
  }
}

// ---------- --data ----------
function numberInSources(n, src) {
  const forms = [String(n), n.toFixed(1), n.toFixed(2), n.toFixed(3)];
  return forms.some((s) => new RegExp(`(^|[^\\d.])${reEsc(s)}(?![\\d])`).test(src));
}
function checkData() {
  const dir = join(RUNS, 'data');
  if (!existsSync(dir)) { fail('DATA', 'chưa có runs/data'); return; }
  const srcText = (f, ids) => (ids ?? []).map((id) => runText(id) ?? (fail('DATA', `${f}: nguồn ${id} không có`), '')).join('\n');
  for (const f of readdirSync(dir).filter((x) => /^w\d+\.json$/.test(x))) {
    const j = JSON.parse(read(join(dir, f)));
    if (!Array.isArray(j.sources) || !j.sources.length) fail('DATA', `${f}: thiếu sources`);
    const src = srcText(f, j.sources);
    const nums = [];
    const walk = (v, k) => {
      if (k === 'sources' || (typeof k === 'string' && k.startsWith('_'))) return;
      if (typeof v === 'number') nums.push(v);
      else if (Array.isArray(v)) v.forEach((x) => walk(x));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, x]) => walk(x, kk));
    };
    walk(j);
    for (const n of nums) if (!numberInSources(n, src)) fail('DATA', `${f}: ${n} không có trong nguồn`);
  }
  const d = derivedEntries();
  if (d) for (const e of d) {
    const label = `derived.json ${e.name}`;
    if (!e.name || typeof e.value !== 'number' || !e.formula || !e.inputs || !Array.isArray(e.sources)) { fail('DATA', `${label}: cần {name, value, formula, inputs, sources}`); continue; }
    const src = srcText(label, e.sources);
    for (const [k, v] of Object.entries(e.inputs)) if (!numberInSources(Number(v), src)) fail('DATA', `${label}: input ${k}=${v} không có trong nguồn`);
    let got;
    try { got = evalExpr(e.formula, Object.fromEntries(Object.entries(e.inputs).map(([k, v]) => [k, String(v)]))); } catch (err) { fail('DATA', `${label}: ${err.message}`); continue; }
    const dec = (String(e.value).split('.')[1] ?? '').length;
    if (Number(got.toFixed(dec)) !== e.value) fail('DATA', `${label}: ${e.formula} = ${got.toFixed(dec)} ≠ ${e.value}`);
  }
}

// ---------- --lint (V17) ----------
const TOOL_SCRIPTS = new Set(['00-containers.sh', 'check.sh', '99-cleanup.sh', 'hw-check.sh']);
const BANNED_WORD = 'pr' + 'une'; // ghép từ hai mảnh để chính file này không chứa từ bị cấm
const BANNED = new RegExp('\\b' + BANNED_WORD + '\\b', 'i');
const LUA_OK = (stem, region) => /^(06|08|09|hw)-/.test(stem) || (/^01-block\b/.test(stem) && region === 'busy');
const DESTRUCTIVE_REDIS = (a) => /^(FLUSHALL|FLUSHDB|REPLICAOF|SLAVEOF|SHUTDOWN)$/i.test(a[0] ?? '') || (/^CONFIG$/i.test(a[0] ?? '') && /^SET$/i.test(a[1] ?? '') && /^maxmemory/i.test(a[2] ?? ''));
const DESTRUCTIVE_DOCKER = (c) => ['kill', 'stop', 'restart', 'rm'].includes(c.verb) || (c.verb === 'network' && ['connect', 'disconnect'].includes(c.sub));
const ALL_KEYS = new Set(['DEL', 'UNLINK', 'EXISTS', 'MGET', 'TOUCH', 'WATCH', 'SINTER', 'SUNION', 'SDIFF', 'SINTERSTORE', 'SUNIONSTORE', 'SDIFFSTORE', 'PFCOUNT', 'PFMERGE']);
const FIRST_KEY = new Set(('SET GET GETSET GETDEL GETEX SETNX SETEX PSETEX INCR INCRBY INCRBYFLOAT DECR DECRBY APPEND STRLEN SETRANGE GETRANGE EXPIRE PEXPIRE ' +
  'EXPIREAT PEXPIREAT TTL PTTL PERSIST TYPE DUMP SORT HSET HSETNX HGET HMSET HMGET HGETALL HDEL HLEN HINCRBY HINCRBYFLOAT HKEYS HVALS HEXISTS HSTRLEN HSCAN ' +
  'HRANDFIELD LPUSH RPUSH LPUSHX RPUSHX LPOP RPOP LRANGE LLEN LREM LINDEX LSET LTRIM LPOS SADD SREM SMEMBERS SISMEMBER SMISMEMBER SCARD SPOP SRANDMEMBER SSCAN ' +
  'ZADD ZINCRBY ZRANGE ZREM ZSCORE ZMSCORE ZCARD ZRANK ZREVRANK ZRANGEBYSCORE ZREVRANGE ZREVRANGEBYSCORE ZCOUNT ZREMRANGEBYSCORE ZREMRANGEBYRANK ZPOPMIN ZPOPMAX ' +
  'ZSCAN XADD XLEN XRANGE XREVRANGE XPENDING XACK XDEL XTRIM XCLAIM XAUTOCLAIM XINFO PFADD SETBIT GETBIT BITCOUNT KEYS').split(' '));
function redisKeys(a) {
  const c = (a[0] ?? '').toUpperCase(); const r = a.slice(1);
  if (ALL_KEYS.has(c)) return r;
  if (c === 'MSET' || c === 'MSETNX') return r.filter((_, i) => i % 2 === 0);
  if (['BLPOP', 'BRPOP', 'BZPOPMIN', 'BZPOPMAX'].includes(c)) return r.slice(0, -1);
  if (['BLMOVE', 'LMOVE', 'RENAME', 'RENAMENX', 'SMOVE', 'RPOPLPUSH', 'BRPOPLPUSH', 'COPY'].includes(c)) return r.slice(0, 2);
  if (['OBJECT', 'MEMORY', 'XGROUP'].includes(c) && r[1] && !/^(HELP|STATS|DOCTOR|MALLOC-STATS|PURGE)$/i.test(r[0] ?? '')) return [r[1]];
  if (c === 'DEBUG' && /^POPULATE$/i.test(r[0] ?? '') && r[2]) return [r[2]];
  if (c === 'DEBUG' && /^OBJECT$/i.test(r[0] ?? '') && r[1]) return [r[1]];
  if (['EVAL', 'EVALSHA', 'EVAL_RO', 'EVALSHA_RO', 'FCALL', 'FCALL_RO'].includes(c)) return r.slice(2, 2 + Number(r[1] ?? 0));
  if (c === 'XREAD' || c === 'XREADGROUP') { const i = r.findIndex((x) => /^STREAMS$/i.test(x)); if (i >= 0) { const rest = r.slice(i + 1); return rest.slice(0, rest.length / 2); } return []; }
  if (FIRST_KEY.has(c)) return r.slice(0, 1);
  return [];
}
const isLua = (a) => /^(EVAL|EVALSHA|EVAL_RO|EVALSHA_RO|FCALL|FCALL_RO)$/i.test(a[0] ?? '') || (/^FUNCTION$/i.test(a[0] ?? '') && /^LOAD$/i.test(a[1] ?? ''));
// Tham số redis-cli sau `redis-cli`: bỏ cờ, trả về { cmd: [lệnh và tham số], evalKeys }.
function redisCliCmd(argv) {
  const withArg = new Set(['-h', '-p', '-n', '-a', '-r', '-i', '-u', '-s', '--pattern', '--count', '--user', '--pass']);
  let i = 0; let evalKeys = null;
  while (i < argv.length && argv[i].startsWith('-')) {
    if (argv[i] === '--eval') { const rest = argv.slice(i + 2); const c = rest.indexOf(','); evalKeys = c >= 0 ? rest.slice(0, c) : rest; return { cmd: [], evalKeys, evalFile: argv[i + 1] }; }
    if (withArg.has(argv[i])) i++;
    i++;
  }
  return { cmd: argv.slice(i), evalKeys };
}
function lintLabs() {
  if (!existsSync(LABS)) { fail('V17', 'labs dir missing: ' + LABS); return; }
  const walk = (d) => readdirSync(d).flatMap((x) => { const p = join(d, x); return statSync(p).isDirectory() ? (x === 'node_modules' ? [] : walk(p)) : [p]; });
  for (const f of walk(LABS)) {
    const rel = relative(LABS, f).replace(/\\/g, '/');
    const name = basename(f);
    if (/^my-/.test(name)) continue; // file Đạt tự viết khi làm "Tự làm" (vd lua/my-lock-renew.lua): không lint
    const stem = name.replace(/\.[^.]+$/, '');
    const text = read(f);
    const lines = text.split('\n');
    const at = (i, msg) => fail('V17', `${rel}:${i + 1} ${msg}`);
    const ext = name.split('.').pop();
    lines.forEach((l, i) => {
      if (BANNED.test(l)) at(i, `có lệnh ${BANNED_WORD} (cấm tuyệt đối)`);
      if (/\b6380\b/.test(l) && !(name === '00-containers.sh' && /#\s*guard-port\b/.test(l))) at(i, 'nhắc tới cổng 6380 (dành cho OmniPOS hub)');
      if (/(?:redis:\/\/|['"`]|host\s*[:=]\s*['"]?|-h\s+)localhost\b/i.test(l)) at(i, 'client phía host dùng localhost (phải là 127.0.0.1)');
      for (const m of l.matchAll(/(?:^|\s)(?:-p|--publish)[ =]["']?([^\s"']*:\d+)/g)) if (!m[1].startsWith('127.0.0.1:')) at(i, `publish ${m[1]} không bind 127.0.0.1`);
    });
    if (ext === 'lua') {
      lines.forEach((l, i) => { for (const m of l.matchAll(/redis\.p?call\(\s*['"](\w+)['"]\s*,\s*['"]([^'"]*)['"]/g)) { const k = redisKeys([m[1], m[2]]); if (k.length && !k[0].startsWith('l06:')) at(i, `khóa "${k[0]}" không có tiền tố l06:`); } });
      continue;
    }
    if (ext !== 'redis' && ext !== 'sh') continue;
    if (ext === 'redis' && /--eval\b|<now>/.test(text)) fail('V17', `${rel}: file .redis chứa cờ --eval hoặc <now> (Lua chạy qua .sh)`);
    const tool = ext === 'sh' && TOOL_SCRIPTS.has(name);
    if (tool) {
      if (lines[1] !== 'export MSYS_NO_PATHCONV=1') fail('V17', `${rel}: dòng 2 phải là export MSYS_NO_PATHCONV=1`);
      if (!lines.some((l) => /^\s*HERE="\$\(cd "\$\(dirname "\$0"\)" && pwd -W\)"/.test(l))) fail('V17', `${rel}: thiếu dòng HERE="$(cd "$(dirname "$0")" && pwd -W)"`);
    }
    // Duyệt theo region (file công cụ không có region → cả file là một khối, chỉ áp các luật theo dòng).
    let region = null; let ct = null; let first = null; let destructive = false; const configs = []; const debugs = [];
    const closeRegion = (endLine) => {
      if (region === null) return;
      configs.forEach(({ p, i }, k) => { if (configs.filter((x) => x.p === p).length < 2 && k === configs.findIndex((x) => x.p === p)) at(i, `CONFIG SET ${p} không được khôi phục trong cùng region ${region}`); });
      debugs.forEach(({ v, i }, k) => { if (v === '0' && !debugs.slice(k + 1).some((x) => x.v === '1')) at(i, `DEBUG SET-ACTIVE-EXPIRE 0 không có DEBUG SET-ACTIVE-EXPIRE 1 sau đó trong region ${region}`); });
      if (ext === 'sh' && destructive && !(first && /^echo\s+["']?→\s*advance-be-redis-[a-z]+/.test(first.l))) at(first ? first.i : endLine, `region ${region} có lệnh phá hủy nhưng dòng lệnh đầu không phải echo "→ <container>"`);
      region = null; ct = null; first = null; destructive = false; configs.length = 0; debugs.length = 0;
    };
    // Kiểm một lệnh redis (đã tách tham số) chạy trên container `target`.
    const redisCmd = (a, i, target, guardMain) => {
      for (const k of redisKeys(a)) if (!k.startsWith('l06:')) at(i, `khóa "${k}" không có tiền tố l06:`);
      if (isLua(a) && !LUA_OK(stem, region)) at(i, 'EVAL/Lua ngoài chặng 6, 8, 9 (và 01-block#busy)');
      if (DESTRUCTIVE_REDIS(a)) { destructive = true; if (target === 'advance-be-redis' && !guardMain) at(i, `lệnh phá hủy "${a.slice(0, 3).join(' ')}" nhắm container main`); }
      if (region !== null && /^CONFIG$/i.test(a[0] ?? '') && /^SET$/i.test(a[1] ?? '')) for (let k = 2; k + 1 < a.length; k += 2) configs.push({ p: a[k].toLowerCase(), i });
      if (region !== null && /^DEBUG$/i.test(a[0] ?? '') && /^SET-ACTIVE-EXPIRE$/i.test(a[1] ?? '')) debugs.push({ v: a[2], i });
    };
    lines.forEach((l, i) => {
      const reg = l.match(/^# #region ([a-z0-9-]+)/);
      if (reg) { closeRegion(i); region = reg[1]; return; }
      if (/^# #endregion/.test(l)) { closeRegion(i); return; }
      const dir = l.match(/^#@\s+ct\s+(\S+)/);
      if (dir) { ct = dir[1]; if (!/^advance-be-redis(-[a-z]+)?$/.test(ct)) at(i, `#@ ct ngoài guard: ${ct}`); return; }
      if (/^\s*#/.test(l) || !l.trim()) return;
      if (region !== null && !first) first = { l, i };
      if (ext === 'redis') { redisCmd(redisArgs(l), i, ct ?? 'advance-be-redis', false); return; }
      // .sh
      const guardMain = tool && /#\s*guard-main\b/.test(l) && (name === '00-containers.sh' || name === '99-cleanup.sh');
      for (const c of dockerCalls(l)) {
        for (const t of c.targets) {
          // Script công cụ dùng biến ($MAIN, "$1") nên không kiểm tĩnh được; file region phải ghi tên container rõ ràng.
          if (t.includes('$')) { if (!tool) at(i, `container ghi bằng biến ${t} (file region phải ghi tên rõ ràng)`); continue; }
          if (!/^advance-be-redis(-[a-z]+)?$/.test(t)) at(i, `container ngoài guard: ${t}`);
        }
        if (DESTRUCTIVE_DOCKER(c)) { destructive = true; if (c.targets.includes('advance-be-redis') && !guardMain) at(i, `docker ${c.verb}${c.sub ? ' ' + c.sub : ''} nhắm container main`); }
        if (c.verb !== 'exec') continue;
        if (!tool && c.args.some((t) => t.startsWith('/') && !t.startsWith('//')) && !/MSYS_NO_PATHCONV=1\s+$/.test(l.slice(0, c.index))) at(i, 'docker exec có đường dẫn /… nhưng thiếu tiền tố MSYS_NO_PATHCONV=1 (Git Bash sẽ đổi thành D:/Git/…)');
        const target = c.targets[0];
        if (c.args[0] === 'redis-cli') {
          const r = redisCliCmd(c.args.slice(1));
          if (r.evalKeys) { if (!LUA_OK(stem, region)) at(i, '--eval ngoài chặng 6, 8, 9'); for (const k of r.evalKeys) if (!k.startsWith('l06:')) at(i, `khóa "${k}" không có tiền tố l06:`); }
          if (r.cmd.length) redisCmd(r.cmd, i, target, guardMain);
        } else if (c.args[0] === 'sh' && c.args[1] === '-c' && c.args[2]) {
          for (const m of c.args[2].matchAll(/redis-cli\s+([^;|&]*)/g)) { const r = redisCliCmd(redisArgs(m[1])); if (r.evalKeys) { if (!LUA_OK(stem, region)) at(i, '--eval ngoài chặng 6, 8, 9'); for (const k of r.evalKeys) if (!k.startsWith('l06:')) at(i, `khóa "${k}" không có tiền tố l06:`); } if (r.cmd.length) redisCmd(r.cmd, i, target, guardMain); }
        }
      }
      // Bộ dựng dữ liệu `seq … | awk '{print "CMD key…"}' | redis-cli`: khóa trong chuỗi print cũng phải là l06:
      for (const m of l.matchAll(/print\s+"([A-Za-z]+)\s+([^"\s]+)/g)) redisCmd([m[1], m[2]], i, (dockerCalls(l).find((c) => c.verb === 'exec') ?? {}).targets?.[0] ?? 'advance-be-redis', guardMain);
    });
    closeRegion(lines.length - 1);
  }
  // Từ bị cấm đó cũng không được xuất hiện trong công cụ của verify/ (trừ hồ sơ planner và thư mục tạm).
  const vwalk = (d) => readdirSync(d).flatMap((x) => { const p = join(d, x); if (statSync(p).isDirectory()) return /^(tmp|ultra-plan|render.*)$/.test(x) ? [] : vwalk(p); return [p]; });
  for (const f of vwalk(HERE)) read(f).split('\n').forEach((l, i) => { if (BANNED.test(l)) fail('V17', `verify/${relative(HERE, f).replace(/\\/g, '/')}:${i + 1} có chữ ${BANNED_WORD}`); });
}

// ---------- --selftest ----------
function selftest() {
  const FX = join(HERE, 'fixtures');
  const T = join(HERE, 'tmp', 'selftest');
  mkdirSync(join(T, 'labs', 'lua'), { recursive: true });
  const save = { LABS, RUNS, WIDGETS };
  let ok = true;
  const expectCase = (name, wantFail, code, fn) => {
    fails.length = 0;
    try { fn(); } catch (e) { fail('SELF', e.message); }
    const got = fails.some((f) => f.startsWith(code + ' '));
    const right = wantFail ? got : fails.length === 0;
    console.log(`selftest ${name}: ${right ? 'đúng' : 'SAI'} (${fails.join(' | ') || 'không lỗi'})`);
    if (!right) ok = false;
  };
  LABS = FX; RUNS = join(FX, 'runs'); WIDGETS = join(T, 'widgets');
  const frag = read(join(FX, 'stage-01.html'));
  const F = new Set(['V05', 'V06', 'V07', 'V09', 'V12', 'V19']);
  expectCase('fragment mẫu sạch', false, '', () => checkFragmentish(frag, F, 'fixture'));
  expectCase('V05 đổi 1 ký tự trong pre[data-cmd]', true, 'V05', () => checkFragmentish(frag.replace('GET l06:fixture:x', 'GET l06:fixture:y'), F));
  expectCase('V07 (integer) 0 ghi là 0 → qua', false, '', () => checkFragmentish('<b class="m" data-run="x.a">0</b>', F));
  expectCase('V07 (integer) 7 ghi là 9 → bắt', true, 'V07', () => checkFragmentish('<b class="m" data-run="x.a">9</b>', F));
  expectCase('V07 số nhỏ chỉ có trong giờ header (18) → bắt', true, 'V07', () => checkFragmentish('<b class="m" data-run="x.a">18</b>', F));
  expectCase('V06 dòng run sai thứ tự → bắt', true, 'V06', () => checkFragmentish('<pre data-run="x.a">(integer) 7\nOK</pre>', F));
  expectCase('V09 khóa l07- → bắt', true, 'V09', () => checkFragmentish(frag.replace('data-store="l06-c1-', 'data-store="l07-c1-'), F));
  expectCase('V19 innerHTML không esc → bắt', true, 'V19', () => checkV19('x.innerHTML = `<b>${row.cmd}</b>`;', 'fixture'));
  expectCase('V19 innerHTML có esc / số → qua', false, '', () => checkV19('x.innerHTML = `<b>${esc(row.cmd)}</b><i>${Number(r.ms).toFixed(1)}</i>`;', 'fixture'));
  const quiz = JSON.parse(read(join(FX, 'stage-01.quiz.json')));
  expectCase('V11 quiz mẫu sạch', false, '', () => checkQuizItems(quiz, 'fixture'));
  expectCase('V11 why không trích run id → bắt', true, 'V11', () => checkQuizItems(quiz.map((x, i) => (i ? x : { ...x, why: 'Vì Redis nhanh.' })), 'fixture'));
  // V07 chỉ đọc phần output: số chỉ nằm trong dòng lệnh đã gõ (seq 1 1500) không được tính là số đo.
  expectCase('V07 số chỉ có trong dòng lệnh "$ seq 1 1500" → bắt', true, 'V07', () => checkFragmentish('<b class="m" data-run="09-fx.seq">1500</b>', F));
  expectCase('V07 số có trong output (DBSIZE 1499) → qua', false, '', () => checkFragmentish('<b class="m" data-run="09-fx.seq">1499</b>', F));
  expectCase('V16 số không có trong run được trích → bắt', true, 'V16', () => checkNumbers(['Run 09-fx.seq: DBSIZE còn 1498.']));
  expectCase('V16 số 3 chữ số không có trong run được trích → bắt', true, 'V16', () => checkNumbers(['Run 09-fx.seq: gửi lúc +743 ms.']));
  expectCase('V16 đổi chỗ hai số của cụm hot=…/300 → bắt', true, 'V16', () => checkNumbers(['Run 09-fx.seq: hot=58/300 cold=66/600.']));
  expectCase('V16 số có trong run được trích → qua', false, '', () => checkNumbers(['Run 09-fx.seq: DBSIZE 1499, hot=66/300 cold=58/600 (slide 25, Redis 7.2.3).']));
  expectCase('V16 câu không trích run nào → bắt', true, 'V16', () => checkNumbers(['Vì Redis nhanh, 1499 khóa.']));
  const sedHtml = (addr, tail = '') => `<p>In region.</p><div class="code"><pre><code>sed -n '/#region ${addr}/,/#endregion/p' labs/lesson-06-redis/x.redis${tail}</code></pre></div>`;
  expectCase('V20 sed in region có thật → qua', false, '', () => checkSedRegions(sedHtml('a ')));
  expectCase('V20 sed in region không có → bắt', true, 'V20', () => checkSedRegions(sedHtml('zz ')));
  expectCase('V20 sed s/A/B/ mà region không có A → bắt', true, 'V20', () => checkSedRegions(sedHtml('a ', " | sed 's/khong-co-chu-nay/y/'")));
  expectCase('V21 ô nhập chỉ có placeholder → bắt', true, 'V21', () => checkFormLabels('<input class="field" placeholder="ghi lại">'));
  expectCase('V21 ô nhập trong label / có aria-label → qua', false, '', () => checkFormLabels('<label>Lỗi 1<input class="field"></label><textarea class="field" aria-label="ghi"></textarea>'));
  expectCase('vị từ ratio(p16,p1)>=5 đúng', false, '', () => { if (!evalExpr('ratio(p16,p1)>=5', { p16: '1960784.25', p1: '158478.61' })) fail('SELF', 'ratio sai'); });
  expectCase('vị từ b-a>=400 sai → bắt', true, 'SELF', () => { if (!evalExpr('b-a>=400', { a: '10', b: '300' })) fail('SELF', 'b-a<400 như mong đợi'); });
  // V17 trên một thư mục labs tạm: một file sạch và từng dòng cài lỗi.
  LABS = join(T, 'labs');
  writeFileSync(join(LABS, '05-clean.redis'), '# #region a · sạch (slide 1)\nSET l06:x 1\nCONFIG SET slowlog-log-slower-than 0\nCONFIG SET slowlog-log-slower-than 10000\n# #endregion\n');
  writeFileSync(join(LABS, '04-clean.sh'), '# #region a · sạch (slide 1)\necho "→ advance-be-redis-rdb"\nset -u\nMSYS_NO_PATHCONV=1 docker exec advance-be-redis-rdb rm -f /data/dump.rdb\ndocker kill advance-be-redis-rdb\n# #endregion\n');
  expectCase('V17 labs sạch → qua', false, '', () => lintLabs());
  const planted = [['SET foo 1', '05-bad.redis'], ['CONFIG SET maxmemory 1mb', '05-bad.redis'], ['DEBUG SET-ACTIVE-EXPIRE 0', '05-bad.redis'], ['EVAL "return 1" 0', '05-bad.redis'],
    ['docker kill advance-be-redis', '05-bad.sh'], ['docker exec advance-be-redis-rdb ls /data', '05-bad.sh'], ['docker volume ' + 'pr' + 'une -f', '05-bad.sh'], ['echo 6380', '05-bad.sh']];
  for (const [line, file] of planted) {
    writeFileSync(join(LABS, file), `# #region a · cài lỗi (slide 1)\n${line}\n# #endregion\n`);
    expectCase(`V17 bắt "${line}"`, true, 'V17', () => lintLabs());
    writeFileSync(join(LABS, file), '');
  }
  ({ LABS, RUNS, WIDGETS } = save);
  fails.length = 0;
  if (!ok) fail('SELF', 'selftest thất bại');
}

const ALL = ['V01', 'V02', 'V03', 'V04', 'V05', 'V06', 'V07', 'V08', 'V09', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V19', 'V20', 'V21'];
if (args.includes('--selftest')) selftest();
else if (args.includes('--runs')) checkRuns();
else if (args.includes('--data')) checkData();
else if (args.includes('--lint')) lintLabs();
else if (args.includes('--fragment')) {
  const f = resolve(opt('--fragment'));
  if (!existsSync(f)) fail('V05', 'fragment missing: ' + f);
  else {
    checkFragmentish(read(f), new Set(['V05', 'V06', 'V07', 'V09', 'V12', 'V19']), basename(f));
    if (existsSync(WIDGETS)) for (const w of readdirSync(WIDGETS).filter((x) => x.endsWith('.js'))) checkV19(read(join(WIDGETS, w)), 'widgets/' + w);
    const q = f.replace(/\.html$/, '.quiz.json');
    if (!existsSync(q)) fail('V11', 'thiếu ' + basename(q));
    else { try { checkQuizItems(JSON.parse(read(q)), basename(q)); } catch (e) { fail('V11', `${basename(q)}: JSON lỗi ${e.message}`); } }
  }
} else checkGuide(new Set(opt('--only') ? opt('--only').split(',') : ALL));

if (fails.length) { console.error(fails.join('\n')); console.error(`✘ ${fails.length} lỗi`); process.exit(1); }
console.log('✔ không có lỗi');
