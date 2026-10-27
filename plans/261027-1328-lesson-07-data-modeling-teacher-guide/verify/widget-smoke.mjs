// Bấm thử mọi widget, mỗi quiz một câu và nút đổi giao diện trong Chrome headless (profile tạm nằm trong verify/tmp).
// Báo lỗi nếu có exception hoặc widget nào không vẽ ra nội dung. Dùng: node verify/widget-smoke.mjs
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const GUIDE = resolve(HERE, '../../../reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
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

const state = await send('Runtime.evaluate', { expression: "JSON.stringify({ ready: document.readyState, url: location.href.slice(-60), quiz: typeof QUIZ, slides: typeof SLIDES, scripts: document.scripts.length })", returnByValue: true });
console.log(state.result.result.value);
const probe = `(() => {
  const out = [];
  for (let n = 1; n <= 10; n++) {
    const w = document.getElementById('w' + n);
    if (!w) { out.push('w' + n + ': không có widget'); continue; }
    const before = w.querySelector('.widget-body').innerText.length;
    const ctrls = [...w.querySelectorAll('button, input[type=checkbox], select, svg g[data-t]')];
    let clicks = 0;
    for (const c of ctrls) { if (c.disabled) continue; if (c.tagName === 'SELECT') { c.selectedIndex = c.options.length - 1; c.dispatchEvent(new Event('change')); } else c.dispatchEvent(new MouseEvent('click', { bubbles: true })); clicks++; }
    const after = w.querySelector('.widget-body').innerText.length;
    out.push('w' + n + ': ' + ctrls.length + ' điều khiển, bấm ' + clicks + ', chữ ' + before + ' → ' + after + (after < 40 ? ' ✘ GẦN NHƯ TRỐNG' : ''));
  }
  const quizzes = [...document.querySelectorAll('.quiz[data-quiz]')];
  let answered = 0;
  for (const q of quizzes) { const b = q.querySelector('.q-opt'); if (b) { b.click(); answered++; } }
  out.push('quiz: ' + quizzes.length + ' khối, đã trả lời 1 câu ở ' + answered + ', giải thích hiện: ' + document.querySelectorAll('.q-explain').length);
  const t0 = document.documentElement.dataset.theme || '(theo hệ thống)';
  document.getElementById('themeBtn').click();
  out.push('theme: ' + t0 + ' → ' + document.documentElement.dataset.theme);
  out.push('phỏng vấn: ' + document.querySelectorAll('#examList details').length + ' câu · bản đồ slide: ' + document.querySelectorAll('#slideMap a').length + ' chip');
  return out.join('\\n');
})()`;
const r = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
await new Promise((res) => setTimeout(res, 500));
console.log(r.result.result.value ?? JSON.stringify(r.result));
ws.close(); proc.kill(); await new Promise((res) => setTimeout(res, 800));
try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome có thể còn giữ file vài trăm ms */ }
if (errors.length) { console.error('✘ exception:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
console.log('✔ không có exception');
