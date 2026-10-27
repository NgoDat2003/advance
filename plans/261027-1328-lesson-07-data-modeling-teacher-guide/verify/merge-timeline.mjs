// Ghép output psql của hai phiên A và B thành một dòng thời gian.
// Mỗi phiên được cắt thành khối tại câu đánh dấu `SELECT 'A1' AS buoc, … AS luc, …`; khối được xếp theo cột luc.
// Dùng: node merge-timeline.mjs <A.txt> <B.txt>  → in ra stdout.
import { readFileSync } from 'node:fs';

const MARK = /^SELECT '([AB]\d+[a-z]?)' AS buoc/;
const TIME = /\|\s*(\d{2}:\d{2}:\d{2}\.\d{3})\s*\|/;

function blocks(file, who) {
  const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith('-- chạy lúc') || line === 'timing on' || line === 'Timing is on.') continue;
    const m = line.match(MARK);
    if (m) { cur = { who, step: m[1], luc: null, lines: [] }; out.push(cur); }
    if (!cur) continue; // phần SET đầu region: bỏ, đã có trong file .sql
    if (!cur.luc) { const t = line.match(TIME); if (t) cur.luc = t[1]; }
    cur.lines.push(line);
  }
  return out;
}

const [a, b] = process.argv.slice(2);
const all = [...blocks(a, 'A'), ...blocks(b, 'B')]
  .sort((x, y) => (x.luc ?? '').localeCompare(y.luc ?? '') || x.who.localeCompare(y.who));
for (const blk of all) {
  console.log(`── ${blk.who} · bước ${blk.step} · ${blk.luc ?? '?'} ──`);
  console.log(blk.lines.join('\n').replace(/\n+$/, ''));
}
