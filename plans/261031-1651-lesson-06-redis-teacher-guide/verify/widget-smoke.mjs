// Bấm thử mọi widget W1–W9, mỗi quiz một câu và nút đổi giao diện trong Chrome headless (profile tạm trong verify/tmp).
// W6 (máy tính slot): gõ từng khóa trong runs/07-cluster.keyslot.txt vào #w6-key và so #w6-slot với CLUSTER KEYSLOT đã ghi.
// Báo lỗi nếu có exception, widget gần như trống, hoặc W6 lệch slot.
// Dùng: node verify/widget-smoke.mjs [--guide <file.html>]      (mặc định reports/advanced_backend/lesson_06_redis_teacher_guide.html)
//       node verify/widget-smoke.mjs --help
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log([
    'widget-smoke · Bài 06 Redis',
    'Dùng: node verify/widget-smoke.mjs [--guide <file.html>]',
    '  --guide <file>  guide cần thử (mặc định reports/advanced_backend/lesson_06_redis_teacher_guide.html)',
    '  --help          in hướng dẫn này',
    'Kiểm: W1–W9 có nội dung và bấm được, mỗi .quiz trả lời 1 câu, nút theme, W6 khớp runs/07-cluster.keyslot.txt.',
    'Thoát 1 khi có exception, widget trống (< 40 ký tự) hoặc W6 lệch slot.',
  ].join('\n'));
  process.exit(0);
}
const gi = args.indexOf('--guide');
const GUIDE = resolve(gi >= 0 ? args[gi + 1] : join(HERE, '../../../reports/advanced_backend/lesson_06_redis_teacher_guide.html'));
if (!existsSync(GUIDE)) { console.error('✘ không có guide: ' + GUIDE); process.exit(1); }
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!chrome) { console.error('✘ không tìm thấy Chrome/Edge'); process.exit(1); }

// Cặp khóa → slot đã ghi từ cluster thật (dòng "127.0.0.1:6379> CLUSTER KEYSLOT <khóa>" rồi "(integer) N").
const slotRun = join(HERE, '../runs/07-cluster.keyslot.txt');
const pairs = [];
if (existsSync(slotRun)) {
  const lines = readFileSync(slotRun, 'utf8').replace(/\r/g, '').split('\n');
  lines.forEach((l, i) => { const m = l.match(/CLUSTER KEYSLOT (\S+)$/); const v = (lines[i + 1] ?? '').match(/^(?:\(integer\) )?(\d+)$/); if (m && v) pairs.push([m[1], Number(v[1])]); });
}

mkdirSync(join(HERE, 'tmp'), { recursive: true });
const profile = mkdtempSync(join(HERE, 'tmp', 'chrome-'));
const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--allow-file-access-from-files', 'about:blank']);
const wsUrl = await new Promise((ok, no) => {
  let buf = '';
  proc.stderr.on('data', (d) => { buf += d; const m = buf.match(/ws:\/\/[^\s]+/); if (m) ok(m[0]); });
  setTimeout(() => no(new Error('chrome không khởi động')), 15000);
});
const port = new URL(wsUrl).port;
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((ok) => ws.addEventListener('open', ok));
let id = 0; const waiting = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((ok) => { const i = ++id; waiting.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Page.navigate', { url: pathToFileURL(GUIDE).href });
for (let i = 0; i < 60; i++) { const s = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true }); if (s.result.result.value === 'complete') break; await new Promise((r) => setTimeout(r, 500)); }

const probe = `(() => {
  const out = []; const bad = [];
  for (let n = 1; n <= 9; n++) {
    const w = document.getElementById('w' + n);
    if (!w) { out.push('w' + n + ': không có widget'); continue; }
    const body = w.querySelector('.widget-body') || w;
    const before = body.innerText.length;
    const ctrls = [...w.querySelectorAll('button, input[type=checkbox], input[type=range], select, svg g[data-t]')];
    let clicks = 0;
    for (const c of ctrls) {
      if (c.disabled) continue;
      if (c.tagName === 'SELECT') { c.selectedIndex = c.options.length - 1; c.dispatchEvent(new Event('change', { bubbles: true })); }
      else if (c.type === 'range') { c.value = c.max || c.value; c.dispatchEvent(new Event('input', { bubbles: true })); }
      else c.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      clicks++;
    }
    const after = body.innerText.length;
    if (after < 40) bad.push('w' + n + ' gần như trống');
    out.push('w' + n + ': ' + ctrls.length + ' điều khiển, bấm ' + clicks + ', chữ ' + before + ' → ' + after + (after < 40 ? ' ✘ GẦN NHƯ TRỐNG' : ''));
  }
  const pairs = ${JSON.stringify(pairs)};
  const key = document.getElementById('w6-key'), slot = document.getElementById('w6-slot');
  if (pairs.length && key && slot) {
    let okN = 0;
    for (const [k, want] of pairs) {
      key.value = k; key.dispatchEvent(new Event('input', { bubbles: true }));
      const got = (slot.value || slot.textContent || '').trim().match(/\\d+/)?.[0];
      if (Number(got) === want) okN++; else bad.push('W6 ' + k + ': hiện ' + got + ' ≠ CLUSTER KEYSLOT ' + want);
    }
    out.push('W6 slot: ' + okN + '/' + pairs.length + ' khóa khớp CLUSTER KEYSLOT');
  } else out.push('W6 slot: bỏ qua (' + (pairs.length ? 'chưa có #w6-key/#w6-slot' : 'chưa có runs/07-cluster.keyslot.txt') + ')');
  const quizzes = [...document.querySelectorAll('.quiz[data-quiz]')];
  let answered = 0;
  for (const q of quizzes) { const b = q.querySelector('.q-opt'); if (b) { b.click(); answered++; } }
  out.push('quiz: ' + quizzes.length + ' khối, đã trả lời 1 câu ở ' + answered + ', giải thích hiện: ' + document.querySelectorAll('.q-explain').length);
  const tb = document.getElementById('themeBtn');
  const t0 = document.documentElement.dataset.theme || '(theo hệ thống)';
  if (tb) { tb.click(); out.push('theme: ' + t0 + ' → ' + document.documentElement.dataset.theme); } else out.push('theme: không có #themeBtn');
  out.push('phỏng vấn: ' + document.querySelectorAll('#examList details').length + ' câu · bản đồ slide: ' + document.querySelectorAll('#slideMap a').length + ' chip');
  return JSON.stringify({ text: out.join('\\n'), bad });
})()`;
const r = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
await new Promise((res) => setTimeout(res, 500));
const res = r.result.result.value ? JSON.parse(r.result.result.value) : { text: JSON.stringify(r.result), bad: ['probe lỗi'] };
console.log(res.text);
ws.close(); proc.kill(); await new Promise((ok) => setTimeout(ok, 800));
try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome có thể còn giữ file vài trăm ms; thư mục nằm trong verify/tmp */ }
if (errors.length) console.error('✘ exception:\n' + [...new Set(errors)].join('\n'));
if (res.bad.length) console.error('✘ ' + res.bad.join('\n✘ '));
if (errors.length || res.bad.length) process.exit(1);
console.log('✔ không có exception, widget có nội dung');
