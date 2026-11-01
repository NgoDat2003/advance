// Gate "chạy lại": học viên hay dán một region hai lần liền trong cùng terminal. Lần hai phải cho cùng kết quả NGỮ NGHĨA.
// Một client: mỗi region chạy 2 lần trong MỘT phiên (redis-cli hoặc bash), so từng dòng trả lời sau khi che số đo.
// Hai client: so các lần lặp verify/tmp/rep/<id>.repK.timeline.txt với run 1 runs/<id>.timeline.txt (theo từng phiên A, B).
// "Dòng ngữ nghĩa" = mọi dòng trả lời, trừ mốc ms và các con số trong output của INFO, MEMORY STATS/USAGE, SLOWLOG, LATENCY, redis-benchmark.
// Dùng: node verify/rerun-gate.mjs [--only <file trong labs>] [--skip-ab] [--labs <dir>]   → in kết quả, ghi verify/tmp/rerun-gate.txt
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { regionIds } from './lab-text.mjs';
import { parseSteps, openRedis, redisReady, redisSteps, redisClose, openSh, RUNS } from './run-redis.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const args = process.argv.slice(2);
const LABS = args.includes('--labs') ? resolve(args[args.indexOf('--labs') + 1]) : join(ROOT, 'labs/lesson-06-redis');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const TOOLS = new Set(['00-containers.sh', 'check.sh', '99-cleanup.sh', 'hw-check.sh']);
const MEASURED = /\b(INFO|MEMORY|SLOWLOG|LATENCY|redis-benchmark)\b/i;
const SEP = '__LAN_HAI__';
const out = [];
const log = (s) => { out.push(s); console.log(s); };
// redis-cli (--no-raw) tự in "(N.NNs)" sau lệnh chạy ≥ 0,5 s: giờ phía client, có hay không tùy lần chạy → bỏ hẳn dòng đó.
const CLI_ELAPSED = /^\(\d+(?:\.\d+)?s\)$/;
const isElapsed = (line) => CLI_ELAPSED.test(line.trim());
const mask = (cmd, line) => (MEASURED.test(cmd) ? line.replace(/\d+(?:\.\d+)?/g, 'N') : line);
const semantic = (steps) => steps.flatMap((s) => [`> ${s.cmd}`, ...s.replies.filter((r) => !isElapsed(r.text)).map((r) => mask(s.cmd, r.text))]);

async function twice(file, region) {
  const p = parseSteps(file, region);
  const steps = [...p.steps, { cmd: p.kind === 'redis' ? `ECHO ${SEP}` : `echo ${SEP}`, sleepMs: 0 }, ...p.steps];
  let done;
  if (p.kind === 'redis') { const s = openRedis(p.ct); await redisReady(s); await redisSteps(s, steps); done = await redisClose(s); }
  else done = (await openSh(steps).done).steps;
  const k = done.findIndex((s) => s.cmd.endsWith(SEP));
  return [semantic(done.slice(0, k)), semantic(done.slice(k + 1))];
}
function diff(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return `dòng ${i + 1}: lần 1 "${(a[i] ?? '∅').slice(0, 60)}" ≠ lần 2 "${(b[i] ?? '∅').slice(0, 60)}"`;
  return null;
}
// Timeline → { A: [...], B: [...] } dòng ngữ nghĩa theo phiên (bỏ mốc ms; che số khi lệnh gần nhất là lệnh đo).
function sessions(text) {
  const by = { A: [], B: [] }; const last = { A: '', B: '' };
  for (const l of text.split('\n')) {
    const m = l.match(/^\+\s*\d+ ([AB]) ([<>]) ?(.*)$/);
    if (!m) continue;
    if (m[2] === '>') { last[m[1]] = m[3]; by[m[1]].push(`> ${m[3]}`); } else if (!isElapsed(m[3])) by[m[1]].push(mask(last[m[1]], m[3]));
  }
  return by;
}

let bad = 0; let total = 0;
log(`# rerun gate · ${new Date().toISOString()}`);
if (!existsSync(LABS)) { log('✘ labs dir missing: ' + LABS); process.exit(1); }
const files = readdirSync(LABS).filter((f) => (f.endsWith('.redis') || (f.endsWith('.sh') && !TOOLS.has(f))) && !/\.(A|B)\.(redis|sh)$/.test(f) && (!only || f === basename(only)));
for (const f of files) for (const r of regionIds(join(LABS, f))) {
  total++;
  try {
    const [a, b] = await twice(join(LABS, f), r);
    const d = diff(a, b);
    if (d) { bad++; log(`✘ ${f}#${r}: ${d}`); } else log(`✔ ${f}#${r} (${a.length} dòng ngữ nghĩa)`);
  } catch (e) { bad++; log(`✘ ${f}#${r}: lỗi chạy: ${e.message}`); }
}
const REP = join(HERE, 'tmp', 'rep');
if (!args.includes('--skip-ab') && existsSync(REP)) for (const f of readdirSync(REP).filter((x) => /\.rep\d+\.timeline\.txt$/.test(x))) {
  const id = f.replace(/\.rep\d+\.timeline\.txt$/, '');
  if (only && !id.startsWith(basename(only).replace(/\.(A|B)?\.?(redis|sh)$/, ''))) continue;
  total++;
  const base = join(RUNS, `${id}.timeline.txt`);
  if (!existsSync(base)) { bad++; log(`✘ ${f}: không có run 1 ${id}.timeline.txt`); continue; }
  const s1 = sessions(readFileSync(base, 'utf8')); const s2 = sessions(readFileSync(join(REP, f), 'utf8'));
  const d = diff(s1.A, s2.A) ?? diff(s1.B, s2.B);
  if (d) { bad++; log(`✘ ${f} so với run 1: ${d}`); } else log(`✔ ${f} = run 1 (A ${s1.A.length}, B ${s1.B.length} dòng)`);
}
log(`${total - bad}/${total} region/lần lặp chạy lại cho cùng kết quả ngữ nghĩa`);
mkdirSync(join(HERE, 'tmp'), { recursive: true });
writeFileSync(join(HERE, 'tmp', 'rerun-gate.txt'), out.join('\n') + '\n');
process.exit(bad ? 1 : 0);
