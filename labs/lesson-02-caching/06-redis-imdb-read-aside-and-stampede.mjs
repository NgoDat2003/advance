// Lab 2.6 — Real Redis + Postgres (advance_be_lab, IMDb dataset).
// Part 1: Read-Aside on an expensive query ("Top 10 movies of a year"): miss vs hit latency, TTL with jitter.
// Part 2: Cache Breakdown on the real stack: N concurrent requests right after the key expires,
//         without protection vs. with a Redis distributed lock (SET NX PX + compare-and-delete release).
//
// Needs: Redis on localhost:6379 and the env var PG_URL, for example in PowerShell:
//   $env:PG_URL = "postgres://postgres:<password>@localhost:5433/advance_be_lab"
import { createClient } from 'redis';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

const { PG_URL, REDIS_URL = 'redis://localhost:6379' } = process.env;
const USERS = Number(process.env.USERS ?? 100);
const YEAR = Number(process.env.YEAR ?? 2015);
if (!PG_URL) {
  console.error('Thiếu biến môi trường PG_URL (chuỗi kết nối tới database advance_be_lab). Xem ghi chú đầu file.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: PG_URL, max: 10 });
const redis = createClient({ url: REDIS_URL });
await redis.connect();

let dbQueries = 0;
const TOP_MOVIES_SQL = `
  SELECT t.primary_title, r.average_rating, r.num_votes
  FROM lab_imdb.titles t
  JOIN lab_imdb.ratings r ON r.tconst = t.tconst
  WHERE t.start_year = $1 AND t.title_type = 'movie' AND r.num_votes >= 10000
  ORDER BY r.average_rating DESC, r.num_votes DESC
  LIMIT 10`;

async function queryTopMovies(year) {
  dbQueries++;
  const { rows } = await pool.query(TOP_MOVIES_SQL, [year]);
  return rows;
}

const cacheKey = (year) => `imdb:top10:${year}`;
// Base TTL 60s plus up to 10% random jitter, so keys written together do not expire together (Cache Avalanche).
const ttlWithJitter = (baseSeconds) => baseSeconds + Math.floor(Math.random() * baseSeconds * 0.1);

/** Read-Aside: the application checks the cache, and on a miss reads the DB and writes the result back. */
async function getTopMovies(year) {
  const cached = await redis.get(cacheKey(year));
  if (cached) return JSON.parse(cached);
  const rows = await queryTopMovies(year);
  await redis.set(cacheKey(year), JSON.stringify(rows), { EX: ttlWithJitter(60) });
  return rows;
}

// Delete the lock only if we still own it; a plain DEL could remove a lock another request took after ours expired.
const RELEASE_LOCK_LUA = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0`;

/** Read-Aside + distributed mutex: only the lock holder rebuilds the key, everyone else waits for the cache. */
async function getTopMoviesWithLock(year, { lockTtlMs = 10_000, pollMs = 50, maxWaitMs = 8_000 } = {}) {
  const key = cacheKey(year);
  const lockKey = `lock:${key}`;
  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const token = randomUUID();
    const acquired = await redis.set(lockKey, token, { NX: true, PX: lockTtlMs });
    if (acquired) {
      try {
        const filledMeanwhile = await redis.get(key); // double-check after winning the lock
        if (filledMeanwhile) return JSON.parse(filledMeanwhile);
        const rows = await queryTopMovies(year);
        await redis.set(key, JSON.stringify(rows), { EX: ttlWithJitter(60) });
        return rows;
      } finally {
        await redis.eval(RELEASE_LOCK_LUA, { keys: [lockKey], arguments: [token] });
      }
    }
    // Waiting too long means the lock holder is stuck: degrade to a direct DB read instead of failing the user.
    if (Date.now() > deadline) return queryTopMovies(year);
    await sleep(pollMs);
  }
}

async function timed(fn) {
  const start = performance.now();
  const result = await fn();
  return { result, ms: performance.now() - start };
}

async function stampede(label, loader) {
  await redis.del(cacheKey(YEAR));
  dbQueries = 0;
  const latencies = [];
  const t0 = performance.now();
  await Promise.all(
    Array.from({ length: USERS }, async () => {
      const { ms } = await timed(() => loader(YEAR));
      latencies.push(ms);
    }),
  );
  latencies.sort((a, b) => a - b);
  const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))].toFixed(0);
  return {
    'Cách xử lý': label,
    'Query xuống Postgres': dbQueries,
    'p50 (ms)': pct(50),
    'p99 (ms)': pct(99),
    'Tổng (ms)': (performance.now() - t0).toFixed(0),
  };
}

try {
  console.log(`PHẦN 1 — Read-Aside: "Top 10 phim năm ${YEAR}" (join titles 12,8 triệu dòng x ratings)\n`);
  await redis.del(cacheKey(YEAR));
  for (let i = 1; i <= 3; i++) {
    const before = dbQueries;
    const { result, ms } = await timed(() => getTopMovies(YEAR));
    const source = dbQueries > before ? 'MISS -> Postgres' : 'HIT  -> Redis';
    console.log(`  Lần ${i}: ${source.padEnd(17)} ${ms.toFixed(2).padStart(9)} ms`);
    if (i === 1) console.log(`          #1 = ${result[0]?.primary_title} (${result[0]?.average_rating}★, ${result[0]?.num_votes} votes)`);
  }
  console.log(`  TTL còn lại của key: ${await redis.ttl(cacheKey(YEAR))}s (60s + jitter)\n`);

  console.log(`PHẦN 2 — Cache Breakdown: ${USERS} request cùng lúc ngay khi key vừa hết hạn (pool Postgres = 10)\n`);
  const rows = [
    await stampede('Không bảo vệ', getTopMovies),
    await stampede('Khóa phân tán Redis', getTopMoviesWithLock),
  ];
  console.table(rows);
} finally {
  await redis.quit();
  await pool.end();
}
