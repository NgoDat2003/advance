// Sinh runs/data/w1..w9.json + derived.json bằng cách ĐỌC giá trị từ run (không gõ tay số nào).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// Dựng runs/data/w1–w9.json + derived.json từ các run đã ghi. Mặc định: thư mục runs/ của plan này.
const RUNS = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..', 'runs');
const run = (id) => readFileSync(join(RUNS, id + '.txt'), 'utf8').replace(/\r/g, '');
const num = (re, t, g = 1) => { const m = t.match(re); if (!m) throw new Error('không thấy ' + re); return Number(m[g]); };
const out = {};

// w1: dòng thời gian DEBUG SLEEP 2 (ms host)
{ const id = '01-block.sleep.timeline'; const t = run(id);
  out.w1 = { sources: [id], unit: 'ms host', events: [
    { who: 'A', what: 'gửi DEBUG SLEEP 2', ms: num(/\+\s*(\d+) A > DEBUG SLEEP 2/, t) },
    { who: 'B', what: 'gửi PING', ms: num(/\+\s*(\d+) B > PING/, t) },
    { who: 'A', what: 'nhận OK', ms: num(/\+\s*(\d+) A < OK/, t) },
    { who: 'B', what: 'nhận PONG', ms: num(/\+\s*(\d+) B < PONG/, t) },
  ] }; }

// w2: ngưỡng encoding
{ const h = run('02-encodings.hash'), s = run('02-encodings.set-zset-list');
  const after = (t, cmd) => [...t.matchAll(new RegExp(cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n(\\S+)', 'g'))].map((m) => m[1]);
  const encH = after(h, 'OBJECT ENCODING l06:enc:h'), memH = after(h, 'MEMORY USAGE l06:enc:h').map(Number);
  const encV = after(h, 'OBJECT ENCODING l06:enc:hv'), memV = after(h, 'MEMORY USAGE l06:enc:hv').map(Number);
  const row = (type, setting, k, cnt, enc) => ({ type, setting, below: { n: Number(cnt[0]), encoding: enc[0] }, above: { n: Number(cnt[1]), encoding: enc[1] } });
  out.w2 = { sources: ['02-encodings.hash', '02-encodings.set-zset-list'], rows: [
    { ...row('hash', 'hash-max-listpack-entries', 'l06:enc:h', after(h, 'HLEN l06:enc:h'), encH), memory_bytes: { below: memH[0], above: memH[1] } },
    { ...row('hash (giá trị)', 'hash-max-listpack-value', 'l06:enc:hv', after(h, 'HSTRLEN l06:enc:hv f'), encV), memory_bytes: { below: memV[0], above: memV[1] } },
    row('set số', 'set-max-intset-entries', 'l06:enc:si', after(s, 'SCARD l06:enc:si'), after(s, 'OBJECT ENCODING l06:enc:si')),
    row('set chuỗi', 'set-max-listpack-entries', 'l06:enc:ss', after(s, 'SCARD l06:enc:ss'), after(s, 'OBJECT ENCODING l06:enc:ss')),
    row('zset', 'zset-max-listpack-entries', 'l06:enc:z', after(s, 'ZCARD l06:enc:z'), after(s, 'OBJECT ENCODING l06:enc:z')),
    row('list', 'list-max-listpack-size (byte)', 'l06:enc:l', after(s, 'LLEN l06:enc:l'), after(s, 'OBJECT ENCODING l06:enc:l')),
  ] }; }

// w3: active expiry trước/sau
{ const id = '03-expiry.active'; const t = run(id);
  const ek = [...t.matchAll(/^expired_keys:(\d+)$/gm)].map((m) => Number(m[1]));
  const db = [...t.matchAll(/^db0:keys=(\d+),expires=(\d+),/gm)].map((m) => ({ keys: Number(m[1]), expires: Number(m[2]) }));
  out.w3 = { sources: [id], keys_written: 10000, px_ms: 1000, wait_s: 3,
    before: { expired_keys: ek[0], ...db[0] }, after: { expired_keys: ek[1], ...db[1] },
    expired_stale_perc: num(/^expired_stale_perc:([\d.]+)$/m, t), expire_cycle_cpu_milliseconds: num(/^expire_cycle_cpu_milliseconds:(\d+)$/m, t) }; }

// w4: eviction theo chính sách
{ const pol = ['noeviction', 'allkeys-lru', 'allkeys-lfu', 'volatile-ttl', 'allkeys-random'];
  out.w4 = { sources: pol.map((p) => '03-eviction.' + p), policies: pol.map((p) => { const t = run('03-eviction.' + p);
    const ev = [...t.matchAll(/^evicted_keys:(\d+)$/gm)].map((m) => Number(m[1]));
    const r = { policy: p, BASE: num(/^BASE=(\d+)/m, t), MAX: num(/MAX=(\d+)/, t), evicted_after_fill: ev[0], evicted_keys: ev[ev.length - 1],
      hot: num(/^hot=(\d+)\/300/m, t), hot_total: 300, cold: num(/cold=(\d+)\/600/, t), cold_total: 600, oom: /OOM command not allowed/.test(t) };
    const ttl = t.match(/ttl=(\d+)\/200/); if (ttl) Object.assign(r, { ttl: Number(ttl[1]), ttl_total: 200 });
    return r; }) }; }

// w5: số khóa trước kill / sau khởi động
{ const r = run('04-persistence.rdb-loss'), a = run('04-persistence.aof-loss');
  const dbs = (t) => [...t.matchAll(/DBSIZE\n(\d+)/g)].map((m) => Number(m[1]));
  const rd = dbs(r);
  out.w5 = { sources: ['04-persistence.rdb-loss', '04-persistence.aof-loss'], modes: [
    { mode: 'RDB (BGSAVE lúc 1000 khóa, save "")', written: rd[0], snapshot: 1000, after_restart: rd[1] },
    { mode: 'AOF everysec (đợi 2 s rồi kill)', written: 1500, after_restart: dbs(a)[0] },
  ] }; }

// w6: CLUSTER KEYSLOT
{ const id = '07-cluster.keyslot'; const t = run(id);
  out.w6 = { sources: [id], pairs: [...t.matchAll(/CLUSTER KEYSLOT (\S+)\n\(integer\) (\d+)/g)].map((m) => ({ key: m[1], slot: Number(m[2]) })) }; }

// w7: các bước partition
{ const id = '07-architecture.partition'; const t = run(id);
  const after = (re) => num(new RegExp(re + '[^\\n]*\\n(?:OK\\n)?(\\d+)$', 'm'), t);
  const gets = [...t.matchAll(/advance-be-redis-replica redis-cli GET l06:rep:price\n(\d+)/g)].map((m) => Number(m[1]));
  out.w7 = { sources: [id], steps: [
    { step: 'main SET 100 + WAIT 1 1000 (cùng kết nối)', wait: after("printf 'SET l06:rep:price 100") , replica_get: gets[0] },
    { step: 'ngắt mạng replica; main SET 120 + WAIT 1 500 (cùng kết nối)', wait: after("printf 'SET l06:rep:price 120") },
    { step: 'WAIT 1 500 ở kết nối mới (bẫy)', wait: num(/redis-cli WAIT 1 500\n(\d+)$/m, t) },
    { step: 'đọc trên replica khi mất mạng', replica_get: gets[1] },
    { step: 'nối mạng + restart replica, poll tới master_link_status:up', polls: num(/^polls=(\d+)$/m, t), replica_get: gets[2] },
  ], master_repl_offset: num(/^master_repl_offset:(\d+)$/m, t), slave_repl_offset: num(/^slave_repl_offset:(\d+)$/m, t),
  sync_full: num(/^sync_full:(\d+)$/m, t), sync_partial_ok: num(/^sync_partial_ok:(\d+)$/m, t) }; }

// w8: 5 dòng thời gian khóa (bỏ barrier, set -u, sleep). Bỏ một lệnh gửi thì bỏ luôn các dòng trả lời của nó
// (trả lời thuộc lệnh gửi gần nhất của cùng người), để bảng sự kiện không có trả lời "mồ côi".
{ const ids = ['08-lock.nolock', '08-lock.nx', '08-lock.ttldel', '08-lock-lua.cad', '08-lock-lua.fencing'].map((s) => s + '.timeline');
  const skip = /BLPOP|RPUSH l06:barrier|set -u|\$ sleep|l06:barrier/;
  const keep = (lines) => { const skipping = {}; return lines.filter((m) => {
    if (m[3] === '>') { skipping[m[2]] = skip.test(m[4]); return !skipping[m[2]]; }
    return !skipping[m[2]]; }); };
  out.w8 = { sources: ids, timelines: ids.map((id) => ({ run: id, events: keep(run(id).split('\n')
    .map((l) => l.match(/^\+\s*(\d+) ([AB]) ([<>]) (.*)$/)).filter(Boolean))
    .map((m) => ({ ms: Number(m[1]), who: m[2], dir: m[3] === '>' ? 'send' : 'reply',
      text: m[4].replace(/^\$ (MSYS_NO_PATHCONV=1 )?docker exec advance-be-redis redis-cli /, '') })) })) }; }

// w9: 30 lần gọi token bucket
{ const id = '09-bridge.bucket30'; const t = run(id);
  const rows = [...t.matchAll(/^([01]) (\d+) (\d+)$/gm)].map((m) => ({ allowed: Number(m[1]), tokens: Number(m[2]), retry_after_ms: Number(m[3]) }));
  out.w9 = { sources: [id], capacity: 10, refill_per_s: 0.01, rows,
    allowed: num(/^allowed=(\d+)/m, t), denied: num(/denied=(\d+)/, t), min_retry_after_ms: num(/min_retry_after_ms=(\d+)/, t) }; }

// derived.json: giá trị tính từ run, không có sẵn trong run
const p = run('01-bench.pipeline'), z = run('01-bench.size'), g = run('01-bench.mget'), b = run('06-practices.bigkey');
const rps = (t, label) => num(new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ': ([\\d.]+) requests per second', 'm'), t);
const p1 = [...p.matchAll(/^GET: ([\d.]+) requests per second/gm)].map((m) => Number(m[1]));
const s = rps(z, 'GET l06:bench:small'), bg = rps(z, 'GET l06:bench:big'), bytes = num(/STRLEN l06:bench:big\n(\d+)/, z);
const gg = rps(g, 'GET l06:bench:1'), mm = num(/^MGET l06:bench:1(?: l06:bench:\d+){9}: ([\d.]+) requests per second/m, g);
const du = [...b.matchAll(/SLOWLOG GET 1\n\d+\n\d+\n(\d+)\n/g)].map((m) => Number(m[1]));
const E = (name, formula, inputs, sources, dec, fn) => ({ name, value: Number(fn(inputs).toFixed(dec)), formula, inputs, sources });
const derived = { entries: [
  E('r04_pipeline_ratio', 'p16/p1', { p16: p1[1], p1: p1[0] }, ['01-bench.pipeline'], 1, (i) => i.p16 / i.p1),
  E('r05_small_mb_s', 's*16/1048576', { s }, ['01-bench.size'], 2, (i) => (i.s * 16) / 1048576),
  E('r05_big_mb_s', 'b*bytes/1048576', { b: bg, bytes }, ['01-bench.size'], 1, (i) => (i.b * i.bytes) / 1048576),
  E('r05_rps_ratio', 's/b', { s, b: bg }, ['01-bench.size'], 1, (i) => i.s / i.b),
  E('r06_get_keys_s', 'g*1', { g: gg }, ['01-bench.mget'], 2, (i) => i.g),
  E('r06_mget_keys_s', 'm*10', { m: mm }, ['01-bench.mget'], 1, (i) => i.m * 10),
  E('r06_keys_ratio', 'm*10/g', { m: mm, g: gg }, ['01-bench.mget'], 1, (i) => (i.m * 10) / i.g),
  E('r32_del_unlink_ratio', 'd/u', { d: du[0], u: du[1] }, ['06-practices.bigkey'], 0, (i) => i.d / i.u),
] };

mkdirSync(join(RUNS, 'data'), { recursive: true });
for (const [k, v] of Object.entries(out)) writeFileSync(join(RUNS, 'data', k + '.json'), JSON.stringify(v, null, 2) + '\n');
writeFileSync(join(RUNS, 'data', 'derived.json'), JSON.stringify(derived, null, 2) + '\n');
console.log(Object.keys(out).join(' '), '+ derived:', derived.entries.map((e) => `${e.name}=${e.value}`).join(' '));
