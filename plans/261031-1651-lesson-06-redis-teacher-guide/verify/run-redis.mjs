// Runner của controller: chạy một region lab trên container advance-be-redis* và ghi NGUYÊN VĂN kết quả vào runs/.
// Một đồng hồ duy nhất: ms của máy host (giờ gửi từng lệnh, giờ tới của từng dòng trả lời).
//
// Dùng:
//   node verify/run-redis.mjs <file.redis|file.sh> --region <id> [--out <tên>] [--ct <container>]
//   node verify/run-redis.mjs <file.redis>                        (cả file, ví dụ 00-seed.redis)
//   node verify/run-redis.mjs <tool.sh> [--out <tên>] [-- <tham số>]   (script công cụ chạy nguyên: bash <file> <args>)
//   node verify/run-redis.mjs --ab <A-file> <B-file> <region> [--out <tên>] [--rep N]
//   node verify/run-redis.mjs --register <runs/file>               (ghi/thay dòng manifest cho file do công cụ khác viết)
//
// .redis: một phiên `docker exec -i <ct> redis-cli --no-raw`; trước lệnh k gửi ECHO "@@k <host-ms>", sau lệnh k gửi ECHO "@@k.",
//         đợi "@@k." quay về rồi mới (ngủ theo `#@ sleep`) gửi lệnh kế. File run thay marker bằng `127.0.0.1:6379> <lệnh k>`.
// .sh:    `bash -c "<chữ region có chèn echo marker>"`, mỗi dòng in `$ <dòng>`. Runner XÓA MSYS_NO_PATHCONV khỏi env của bash con,
//         nên run ghi lại đúng điều học viên thấy khi dán dòng đó vào Git Bash.
// --ab:   chạy region `<region>-reset` (file A) → mở B (lệnh đầu BLPOP l06:barrier:<kịch bản> 5) → đợi Redis báo B đang chặn
//         → mở A (lệnh đầu RPUSH l06:barrier:<kịch bản> go). Lần 1 ghi runs/, lần 2..N ghi verify/tmp/rep/ (không vào manifest).
import { spawn, execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { regionText, dockerCalls } from './lab-text.mjs';
import { mergeTimeline } from './merge-timeline.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAN = resolve(HERE, '..');
export const RUNS = join(PLAN, 'runs');
const TMP = join(HERE, 'tmp');
const MAIN = 'advance-be-redis';
export const GUARD = /^advance-be-redis(-[a-z]+)?$/;
const STEP_TIMEOUT_MS = 180000;

export class GuardError extends Error {}
const guard = (ct) => { if (!GUARD.test(ct)) throw new GuardError(`từ chối container "${ct}" (chỉ chạy trên ^advance-be-redis(-[a-z]+)?$)`); return ct; };

// Git Bash thật (không phải bash của WSL trong System32).
function gitBash() {
  if (process.platform !== 'win32') return 'bash';
  const c = [process.env.L06_BASH, 'D:/Git/bin/bash.exe', 'C:/Program Files/Git/bin/bash.exe', 'C:/Program Files (x86)/Git/bin/bash.exe'].filter(Boolean);
  const f = c.find((p) => existsSync(p));
  if (!f) throw new Error('không tìm thấy Git Bash; đặt biến L06_BASH=<đường dẫn bash.exe>');
  return f;
}
// Env của tiến trình con: bỏ cờ tắt đổi đường dẫn để run giống hệt môi trường học viên.
function childEnv() {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (/^MSYS_NO_PATHCONV$|^MSYS2_ARG_CONV_EXCL$/i.test(k)) delete env[k];
  return env;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (cmd, args) => new Promise((ok) => execFile(cmd, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 64 << 20 }, (err, out, errOut) => ok({ code: err ? (err.code ?? 1) : 0, out: (out ?? '').replace(/\r/g, ''), err: errOut ?? '' })));

// Dòng thời gian thật của mỗi dòng output: tách theo \n, \r\n; tiến trình `\r` (redis-benchmark) chỉ giữ đoạn cuối.
function collect(proc, onLine) {
  for (const stream of [proc.stdout, proc.stderr]) {
    let buf = '';
    stream.setEncoding('utf8');
    const emit = (raw, t) => { const segs = raw.replace(/\r$/, '').split('\r'); onLine(segs.filter((s) => s !== '').pop() ?? '', t); };
    stream.on('data', (d) => { const t = Date.now(); buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { emit(buf.slice(0, i), t); buf = buf.slice(i + 1); } });
    stream.on('end', () => { if (buf) emit(buf, Date.now()); buf = ''; });
  }
}
const exited = (proc) => new Promise((ok) => { if (proc.exitCode !== null) ok(proc.exitCode); else proc.on('close', (c) => ok(c)); });

// ---------- phân tích region thành các bước ----------
export function fileKind(file, region) {
  if (file.endsWith('.redis')) return 'redis';
  if (file.endsWith('.sh')) return region ? 'sh' : 'tool';
  throw new Error('chỉ chạy được .redis hoặc .sh: ' + file);
}
export function parseSteps(file, region) {
  const text = regionText(file, region);
  if (text === null) throw new Error(`không có ${region ? 'region ' + region + ' trong ' : 'file '}${file}`);
  const kind = fileKind(file, region);
  const steps = []; let ct = null; let pending = 0;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const dir = line.match(/^#@\s+(sleep|ct)\s+(\S+)/);
    if (dir) { if (dir[1] === 'sleep') pending += Number(dir[2]) * 1000; else ct = dir[2]; continue; }
    if (/^\s*#/.test(line) || !line.trim()) continue;
    if (kind === 'sh') while (/\\$/.test(line) && i + 1 < lines.length) line = line.slice(0, -1) + '\n' + lines[++i];
    steps.push({ cmd: line, sleepMs: pending }); pending = 0;
  }
  if (kind === 'sh' && !ct) {
    const echo = steps.find((s) => /^echo\s+["']?→\s*(\S+?)["']?\s*$/.test(s.cmd));
    if (echo) ct = echo.cmd.match(/→\s*(advance-be-redis[a-z-]*)/)?.[1] ?? null;
  }
  // Chặn sớm: mọi container mà dòng .sh gọi tới cũng phải nằm trong guard.
  if (kind === 'sh') for (const s of steps) for (const c of dockerCalls(s.cmd)) for (const t of c.targets) guard(t);
  return { kind, steps, ct: ct ?? MAIN };
}

// ---------- phiên redis-cli ----------
export function openRedis(ct, who = 'A') {
  guard(ct);
  const proc = spawn('docker', ['exec', '-i', ct, 'redis-cli', '--no-raw'], { env: childEnv(), windowsHide: true });
  const s = { who, proc, steps: [], cur: -1, waiters: new Map(), stderrTail: [] };
  collect(proc, (text, t) => {
    const m = text.match(/^"@@(\d+)(?: (\d+)|(\.))"$/);
    if (m) {
      const k = Number(m[1]);
      if (m[3]) { s.cur = -1; s.waiters.get(k)?.ok(); s.waiters.delete(k); } else s.cur = k;
      return;
    }
    const k = s.cur >= 0 ? s.cur : s.steps.length - 1;
    if (k >= 1 && s.steps[k]) s.steps[k].replies.push({ t, text }); else s.stderrTail.push(text);
  });
  proc.on('close', (code) => { for (const [, w] of s.waiters) w.no(new Error(`redis-cli (${who}) thoát code ${code}: ${s.stderrTail.slice(-3).join(' | ')}`)); s.waiters.clear(); });
  return s;
}
function waitMarker(s, k, label) {
  return new Promise((ok, no) => {
    const timer = setTimeout(() => no(new Error(`quá ${STEP_TIMEOUT_MS / 1000}s chờ ${label}`)), STEP_TIMEOUT_MS);
    s.waiters.set(k, { ok: () => { clearTimeout(timer); ok(); }, no: (e) => { clearTimeout(timer); no(e); } });
  });
}
export async function redisReady(s) { const p = waitMarker(s, 0, 'phiên sẵn sàng'); s.proc.stdin.write('ECHO "@@0."\n'); await p; }
export async function redisSteps(s, steps) {
  for (const st of steps) {
    if (st.sleepMs) await sleep(st.sleepMs);
    const k = s.steps.length || 1; // bước 0 là marker sẵn sàng
    const tSend = Date.now();
    s.steps[k] = { cmd: st.cmd, tSend, replies: [] };
    const p = waitMarker(s, k, `lệnh ${k}: ${st.cmd}`);
    s.proc.stdin.write(`ECHO "@@${k} ${tSend}"\n${st.cmd}\nECHO "@@${k}."\n`);
    await p;
  }
}
export async function redisClose(s) {
  s.proc.stdin.end();
  const t = setTimeout(() => s.proc.kill(), 5000);
  await exited(s.proc); clearTimeout(t);
  return s.steps.slice(1).filter(Boolean);
}

// ---------- phiên bash ----------
// steps: [{cmd}] → bash -c với marker; trả về [{cmd, tSend, replies}] (tSend = lúc marker bắt đầu dòng đó tới host).
export function openSh(steps, who = 'A') {
  const body = ['exec 2>&1', 'echo "@@0."'];
  steps.forEach((st, i) => body.push(`echo "@@${i + 1}"`, st.cmd, `echo "@@${i + 1}."`));
  const proc = spawn(gitBash(), ['-c', body.join('\n') + '\n'], { env: childEnv(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const out = steps.map((st) => ({ cmd: st.cmd, tSend: null, replies: [] }));
  let cur = -1;
  collect(proc, (text, t) => {
    const m = text.match(/^([\s\S]*?)@@(\d+)(\.?)$/);
    if (m) {
      const k = Number(m[2]);
      if (m[1] && cur >= 1) out[cur - 1].replies.push({ t, text: m[1] });
      if (m[3]) cur = -1; else { cur = k; if (out[k - 1]) out[k - 1].tSend = t; }
      return;
    }
    if (cur >= 1) out[cur - 1].replies.push({ t, text });
  });
  const timer = setTimeout(() => proc.kill(), STEP_TIMEOUT_MS * 2);
  const done = exited(proc).then((code) => { clearTimeout(timer); return { code, steps: out.filter((s) => s.tSend !== null) }; });
  return { who, proc, done };
}

// ---------- đầu file run ----------
const p2 = (n) => String(n).padStart(2, '0');
export function stampDate(d = new Date()) {
  const off = -d.getTimezoneOffset(); const a = Math.abs(off);
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())} ${off >= 0 ? '+' : '-'}${p2(Math.floor(a / 60))}${p2(a % 60)}`;
}
async function redisVersion(ct) {
  const r = await run('docker', ['exec', ct, 'redis-cli', 'INFO', 'server']);
  return r.out.match(/^redis_version:(\S+)/m)?.[1] ?? '?';
}
// Mỗi file Lua mà các dòng dùng (/lab/lua/<tên>.lua): băm trong container, đầu vào của V18.
async function luaLines(texts, defaultCt) {
  const seen = new Map();
  for (const t of texts) for (const m of t.matchAll(/\/lab\/lua\/([\w-]+\.lua)/g)) {
    if (seen.has(m[1])) continue;
    const call = dockerCalls(t).find((c) => c.verb === 'exec' && c.tokens.join(' ').includes(m[0]));
    seen.set(m[1], guard(call?.targets[0] ?? defaultCt));
  }
  const out = [];
  for (const [name, ct] of seen) {
    const r = await run('docker', ['exec', ct, 'sha256sum', `/lab/lua/${name}`]);
    out.push(`# lua ${name} sha256=${r.out.match(/^([0-9a-f]{64})/)?.[1] ?? 'missing'}`);
  }
  return out;
}
async function header(ct, started) { return `# chạy lúc ${stampDate(started)} · Redis ${await redisVersion(ct)} · ${ct}`; }

// ---------- định dạng ----------
const sendText = (kind, cmd) => (kind === 'redis' ? `127.0.0.1:6379> ${cmd}` : `$ ${cmd}`);
export function formatRun(head, lua, kind, steps) {
  const out = [head, ...lua];
  for (const st of steps) { out.push(sendText(kind, st.cmd)); for (const r of st.replies) out.push(r.text); }
  return out.map((l) => l.trimEnd()).join('\n') + '\n';
}
const events = (kind, steps) => steps.flatMap((st) => [{ t: st.tSend, dir: '>', text: kind === 'redis' ? st.cmd : `$ ${st.cmd}` }, ...st.replies.map((r) => ({ t: r.t, dir: '<', text: r.text }))]);

// ---------- manifest: đúng một dòng sha256<TAB>tên file cho mỗi file run ----------
export function registerRun(file) {
  const abs = resolve(file);
  const rel = relative(RUNS, abs).replace(/\\/g, '/');
  if (rel.startsWith('..')) throw new Error('chỉ đăng ký file nằm trong runs/: ' + file);
  const mf = join(RUNS, 'manifest.tsv');
  const map = new Map();
  if (existsSync(mf)) for (const l of readFileSync(mf, 'utf8').replace(/\r/g, '').split('\n')) { const [h, p] = l.split('\t'); if (h && p) map.set(p, h); }
  map.set(rel, createHash('sha256').update(readFileSync(abs)).digest('hex'));
  writeFileSync(mf, [...map].sort(([a], [b]) => a.localeCompare(b)).map(([p, h]) => `${h}\t${p}`).join('\n') + '\n');
}
function writeRun(dir, name, text, manifest) {
  mkdirSync(dir, { recursive: true });
  const f = join(dir, name);
  writeFileSync(f, text);
  if (manifest) registerRun(f);
  return f;
}

// ---------- chạy ----------
export async function runSingle(file, region, ctOverride) {
  const { kind, steps, ct: ct0 } = parseSteps(file, region);
  const ct = guard(ctOverride ?? ct0);
  const started = new Date();
  let done;
  if (kind === 'redis') {
    const s = openRedis(ct); await redisReady(s); await redisSteps(s, steps); done = await redisClose(s);
  } else {
    done = (await openSh(steps).done).steps;
  }
  return { kind, ct, text: formatRun(await header(ct, started), await luaLines(steps.map((s) => s.cmd), ct), kind, done), steps: done };
}
export async function runTool(file, args, ctOverride) {
  const ct = guard(ctOverride ?? MAIN);
  const started = new Date();
  const proc = spawn(gitBash(), [file, ...args], { env: childEnv(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const lines = [];
  collect(proc, (text) => lines.push(text));
  const code = await exited(proc);
  const lua = await luaLines([readFileSync(file, 'utf8')], ct);
  return { code, text: [await header(ct, started), ...lua, ...lines].map((l) => l.trimEnd()).join('\n') + '\n' };
}

async function waitBlocked(ct, ms = 5000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const r = await run('docker', ['exec', ct, 'redis-cli', 'INFO', 'clients']);
    if (Number(r.out.match(/^blocked_clients:(\d+)/m)?.[1] ?? 0) >= 1) return true;
    await sleep(100);
  }
  return false;
}
async function startSide(file, region, ct, who) {
  const p = parseSteps(file, region);
  if (p.kind === 'redis') {
    const s = openRedis(ct, who); await redisReady(s);
    const finished = redisSteps(s, p.steps).then(() => redisClose(s));
    return { kind: 'redis', steps: p.steps, finished };
  }
  const sh = openSh(p.steps, who);
  return { kind: 'sh', steps: p.steps, finished: sh.done.then((r) => r.steps) };
}
export async function runAB(fileA, fileB, region, ctOverride) {
  const pa = parseSteps(fileA, region); parseSteps(fileB, region);
  const ct = guard(ctOverride ?? pa.ct);
  const reset = await runSingle(fileA, `${region}-reset`, ct);
  const started = new Date();
  const B = await startSide(fileB, region, ct, 'B');
  const blocked = await waitBlocked(ct);
  const A = await startSide(fileA, region, ct, 'A');
  const [doneA, doneB] = await Promise.all([A.finished, B.finished]);
  const head = await header(ct, started);
  const lua = await luaLines([...A.steps, ...B.steps].map((s) => s.cmd), ct);
  const sideA = { header: head, lua, events: events(A.kind, doneA) }; const sideB = { header: head, lua: [], events: events(B.kind, doneB) };
  return { reset, blocked, A: formatRun(head, lua, A.kind, doneA), B: formatRun(head, lua, B.kind, doneB), timeline: mergeTimeline(sideA, sideB), sideA, sideB };
}

const stemOf = (file) => basename(file).replace(/\.(redis|sh)$/, '').replace(/\.(A|B)$/, '');

async function main(argv) {
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  if (argv[0] === '--register') { registerRun(argv[1]); console.log('manifest: ' + relative(RUNS, resolve(argv[1])).replace(/\\/g, '/')); return 0; }
  if (argv[0] === '--ab') {
    const [, A, B, region] = argv;
    if (!A || !B || !region) { console.error('Dùng: --ab <A-file> <B-file> <region>'); return 2; }
    const out = opt('--out') ?? `${stemOf(A)}.${region}`;
    const reps = Number(opt('--rep') ?? 1);
    for (let k = 1; k <= reps; k++) {
      const r = await runAB(resolve(A), resolve(B), region, opt('--ct'));
      writeRun(join(TMP, 'reset'), `${out}${k > 1 ? `.rep${k}` : ''}.reset.txt`, r.reset.text, false);
      const [dir, base, mf] = k === 1 ? [RUNS, out, true] : [join(TMP, 'rep'), `${out}.rep${k}`, false];
      for (const part of ['A', 'B', 'timeline']) writeRun(dir, `${base}.${part}.txt`, r[part], mf);
      // Sự kiện có mốc ms (đầu vào của merge-timeline.mjs dòng lệnh), để ghép lại hoặc soi lệch giờ khi cần.
      writeRun(join(TMP, 'stamps'), `${out}${k > 1 ? `.rep${k}` : ''}.A.events.json`, JSON.stringify(r.sideA), false);
      writeRun(join(TMP, 'stamps'), `${out}${k > 1 ? `.rep${k}` : ''}.B.events.json`, JSON.stringify(r.sideB), false);
      console.log(`ghi: ${relative(PLAN, dir).replace(/\\/g, '/')}/${base}.{A,B,timeline}.txt${r.blocked ? '' : ' (CẢNH BÁO: không thấy B chặn ở barrier trong 5 s)'}`);
    }
    return 0;
  }
  const file = argv[0];
  if (!file || file.startsWith('--')) { console.error('Dùng: node verify/run-redis.mjs <file> [--region <id>] [--out <tên>] [--ct <container>] | --ab A B region | --register <file>'); return 2; }
  const region = opt('--region');
  const ct = opt('--ct');
  if (ct !== undefined) guard(ct);
  const abs = resolve(file);
  const kind = fileKind(abs, region);
  const out = opt('--out') ?? stemOf(abs) + (region ? `.${region}` : '');
  if (kind === 'tool') {
    const dd = argv.indexOf('--');
    const r = await runTool(abs, dd >= 0 ? argv.slice(dd + 1) : [], ct);
    writeRun(RUNS, `${out}.txt`, r.text, true);
    console.log(`ghi: runs/${out}.txt (script thoát ${r.code})`);
    return 0;
  }
  const r = await runSingle(abs, region, ct);
  writeRun(RUNS, `${out}.txt`, r.text, true);
  console.log(`ghi: runs/${out}.txt`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => {
    console.error('✘ ' + e.message);
    process.exit(e instanceof GuardError ? 2 : 1);
  });
}
