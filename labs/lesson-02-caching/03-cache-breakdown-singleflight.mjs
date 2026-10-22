// Lab 2.3 — Slide 35: Cache Breakdown (a hot key expires -> every request hits the DB at once).
// 500 users open "Top 10 phim 2015" in the same instant the key expires. The DB pool allows 10 queries at a time.
// Compare: no protection vs. a mutex / singleflight that lets only one request rebuild the key.
import { sleep } from './sim-kit.mjs';

const USERS = 500;
const QUERY_MS = 80; // a moderately expensive query; Lab 6 measures ~150 ms for the IMDb top-10 query
const POOL_SIZE = 10;

/** DB with a connection pool: at most POOL_SIZE queries run at once, the rest wait in line. */
function createPooledDb() {
  let running = 0;
  let peakWaiting = 0;
  const queue = [];
  const stats = { queries: 0 };
  const acquire = () =>
    new Promise((resolve) => {
      if (running < POOL_SIZE) { running++; resolve(); return; }
      queue.push(resolve);
      peakWaiting = Math.max(peakWaiting, queue.length);
    });
  const release = () => {
    const next = queue.shift();
    if (next) next(); else running--;
  };
  return {
    stats,
    get peakWaiting() { return peakWaiting; },
    async topMovies(year) {
      stats.queries++;
      await acquire();
      try { await sleep(QUERY_MS); return `top10:${year}`; } finally { release(); }
    },
  };
}

/** Singleflight: concurrent callers of the same key share one in-flight promise. */
function createSingleflight() {
  const inFlight = new Map();
  return (key, fn) => {
    if (!inFlight.has(key)) inFlight.set(key, fn().finally(() => inFlight.delete(key)));
    return inFlight.get(key);
  };
}

async function run(label, { protect }) {
  const db = createPooledDb();
  const cache = new Map(); // the hot key has just expired, so the cache starts empty
  const singleflight = createSingleflight();
  const key = 'imdb:top10:2015';

  const getTopMovies = async () => {
    if (cache.has(key)) return cache.get(key);
    const load = async () => {
      const value = await db.topMovies(2015);
      cache.set(key, value);
      return value;
    };
    return protect ? singleflight(key, load) : load();
  };

  const latencies = [];
  const t0 = performance.now();
  await Promise.all(
    Array.from({ length: USERS }, async () => {
      const start = performance.now();
      await getTopMovies();
      latencies.push(performance.now() - start);
    }),
  );
  latencies.sort((a, b) => a - b);
  const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))].toFixed(0);
  return {
    'Cách xử lý': label,
    'Số query xuống DB': db.stats.queries,
    'Hàng đợi pool cao nhất': db.peakWaiting,
    'p50 (ms)': pct(50),
    'p99 (ms)': pct(99),
    'Tổng thời gian (ms)': (performance.now() - t0).toFixed(0),
  };
}

console.log(`${USERS} request cùng đọc key nóng vừa hết hạn. Mỗi query ${QUERY_MS}ms, pool ${POOL_SIZE} kết nối.\n`);
console.table([
  await run('Không bảo vệ', { protect: false }),
  await run('Mutex / Singleflight', { protect: true }),
]);
console.log('Không bảo vệ: 500 query xếp hàng 50 đợt trên pool 10 kết nối -> người cuối chờ ~4 giây, DB bận toàn bộ.');
console.log('Singleflight: 1 query, 499 request còn lại chờ chung kết quả đó -> DB gần như không nhận thêm tải.');
