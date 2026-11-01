// Quy tắc DUY NHẤT để lấy chữ của một region trong labs/lesson-06-redis (runner, assembler, verifier cùng import).
//   regionText(file, id)  → nguyên văn region, kể cả dòng `# #region …` / `# #endregion` (không có id → cả file)
//   displayText(file, id) → chữ hiển thị trong guide và chữ học viên dán:
//                           .redis bỏ mọi dòng bắt đầu bằng '#' (redis-cli gửi '#' như một lệnh, smoke S3);
//                           .sh / .lua / .ts giữ nguyên văn.
//   regionIds(file)       → danh sách id region theo thứ tự trong file
// Trả về null khi không có file hoặc không có region.
import { readFileSync, existsSync } from 'node:fs';

export const readLab = (file) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const START = (id) => (l) => l === `# #region ${id}` || l.startsWith(`# #region ${id} `);
const isEnd = (l) => l.startsWith('# #endregion');

export function regionText(file, id) {
  if (!existsSync(file)) return null;
  const text = readLab(file);
  if (!id) return text.replace(/\n+$/, '');
  const lines = text.split('\n');
  const start = lines.findIndex(START(id));
  if (start < 0) return null;
  const end = lines.findIndex((l, i) => i > start && isEnd(l));
  if (end < 0) return null;
  return lines.slice(start, end + 1).join('\n');
}

export function displayText(file, id) {
  const t = regionText(file, id);
  if (t === null) return null;
  if (!file.endsWith('.redis')) return t;
  return t.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n').replace(/^\n+|\n+$/g, '');
}

// Bậc cấu trúc của .sh: tách một dòng shell thành các lời gọi `docker …` (bỏ dấu nháy, dừng ở | ; & ) < > ngoài nháy).
// Mỗi lời gọi: { verb, sub, targets: [tên container], args: [token sau container], tokens, index (vị trí chữ docker) }.
// Dùng chung cho runner (từ chối container ngoài guard) và lint V17 (lệnh phá hủy nhắm main, tiền tố MSYS_NO_PATHCONV).
const EXEC_ARG = new Set(['-e', '--env', '-w', '--workdir', '-u', '--user']);
const ARG_FLAGS = new Set(['-f', '--format', '--filter', '-s', '--signal', '-t', '--time', '--network', '-p', '--publish', '-v', '--volume', '--name']);
function tokensFrom(line, start) {
  const toks = []; let cur = null; let q = null; let i = start;
  for (; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === q) q = null; else cur = (cur ?? '') + c; continue; }
    if (c === "'" || c === '"') { q = c; cur = cur ?? ''; continue; }
    if (/\s/.test(c)) { if (cur !== null) toks.push(cur), (cur = null); continue; }
    if ('|;&)<>'.includes(c)) { if ((c === '>' || c === '<') && cur !== null && /^\d+$/.test(cur)) cur = null; break; } // "2>" là số fd, không phải tham số
    cur = (cur ?? '') + c;
  }
  if (cur !== null) toks.push(cur);
  return toks;
}
export function dockerCalls(line) {
  const calls = [];
  for (const m of line.matchAll(/(^|[\s|;&($])docker\s+/g)) {
    const toks = tokensFrom(line, m.index + m[1].length);
    const verb = toks[1];
    let rest = toks.slice(2), sub = null;
    if (verb === 'network' || verb === 'container' || verb === 'volume' || verb === 'system') { sub = rest[0]; rest = rest.slice(1); }
    const targets = []; const args = [];
    const flagged = (arr) => { // tách cờ (kể cả cờ có tham số) khỏi tham số vị trí
      const pos = [];
      for (let k = 0; k < arr.length; k++) {
        if (arr[k].startsWith('-')) { if (ARG_FLAGS.has(arr[k])) k++; continue; }
        pos.push(arr[k]);
      }
      return pos;
    };
    if (verb === 'exec') {
      let k = 0;
      while (k < rest.length && rest[k].startsWith('-')) { if (EXEC_ARG.has(rest[k])) k++; k++; }
      if (rest[k]) targets.push(rest[k]);
      args.push(...rest.slice(k + 1));
    } else if (verb === 'network' && (sub === 'connect' || sub === 'disconnect')) {
      const pos = flagged(rest); if (pos[1]) targets.push(pos[1]);
    } else if (verb === 'run' || verb === 'create') {
      const i = rest.indexOf('--name'); if (i >= 0 && rest[i + 1]) targets.push(rest[i + 1]);
      const eq = rest.find((t) => t.startsWith('--name=')); if (eq) targets.push(eq.slice(7));
    } else if (['kill', 'stop', 'restart', 'rm', 'start', 'port', 'inspect', 'logs'].includes(verb)) {
      targets.push(...flagged(rest));
    }
    calls.push({ verb, sub, targets, args, tokens: toks, index: m.index + m[1].length });
  }
  return calls;
}

export function regionIds(file) {
  if (!existsSync(file)) return [];
  return readLab(file).split('\n').map((l) => l.match(/^# #region ([a-z0-9-]+)(?: |$)/)).filter(Boolean).map((m) => m[1]);
}

// Tách một dòng lệnh redis-cli thành tham số như redis-cli làm (nháy đơn/kép giữ khoảng trắng).
export function redisArgs(line) {
  const out = []; let cur = null; let q = null;
  for (const c of line) {
    if (q) { if (c === q) q = null; else cur += c; continue; }
    if (c === "'" || c === '"') { q = c; cur = cur ?? ''; continue; }
    if (/\s/.test(c)) { if (cur !== null) out.push(cur), (cur = null); continue; }
    cur = (cur ?? '') + c;
  }
  if (cur !== null) out.push(cur);
  return out;
}
