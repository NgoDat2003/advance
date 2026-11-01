// Ghép sự kiện của hai phiên A và B thành MỘT dòng thời gian, xếp theo đồng hồ host (ms) — không có đồng hồ thứ hai.
// Mỗi sự kiện: { who: 'A'|'B', t: <host ms>, dir: '>' (gửi) | '<' (một dòng trả lời), text }.
// Dòng ra: `+<ms> <A|B> > <lệnh>` hoặc `+<ms> <A|B> < <dòng trả lời>`, ms tính từ sự kiện sớm nhất, canh phải 6 ký tự.
// Dùng như module: mergeTimeline(a, b) với a/b = { header, lua: [...], events: [...] } (run-redis.mjs gọi trực tiếp).
// Dùng dòng lệnh:  node verify/merge-timeline.mjs <A.events.json> <B.events.json>   → in ra stdout.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const HEADER = /^# chạy lúc (\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} [+-]\d{4}) · (.*)$/;

export function mergeTimeline(a, b) {
  const h = (a.header ?? '').match(HEADER);
  if (!h) throw new Error('header phiên A không đúng dạng "# chạy lúc …": ' + a.header);
  const lua = [...new Set([...(a.lua ?? []), ...(b.lua ?? [])])];
  const all = [...a.events.map((e, i) => ({ ...e, who: 'A', i })), ...b.events.map((e, i) => ({ ...e, who: 'B', i }))]
    // Cùng ms: giữ thứ tự trong phiên, rồi A trước B (sắp xếp ổn định).
    .sort((x, y) => x.t - y.t || (x.who === y.who ? x.i - y.i : x.who.localeCompare(y.who)));
  const t0 = all.length ? all[0].t : 0;
  const out = [`# chạy lúc ${h[1]} · ${h[2]} · timeline A+B (ms host tính từ sự kiện đầu)`, ...lua];
  for (const e of all) out.push(`+${String(e.t - t0).padStart(6)} ${e.who} ${e.dir} ${e.text}`.trimEnd());
  return out.join('\n') + '\n';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [fa, fb] = process.argv.slice(2);
  if (!fa || !fb) { console.error('Dùng: node verify/merge-timeline.mjs <A.events.json> <B.events.json>'); process.exit(2); }
  process.stdout.write(mergeTimeline(JSON.parse(readFileSync(fa, 'utf8')), JSON.parse(readFileSync(fb, 'utf8'))));
}
