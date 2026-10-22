// Shared helpers for the lesson-02 caching labs.
// A fake DB and a fake cache with controllable latency, so race conditions from the slides
// can be replayed on a real Node.js event loop without installing Redis or Postgres.

/**
 * Millisecond-accurate sleep. Windows timers only tick every ~15ms, which would turn a 2ms DB read into 15ms
 * and distort every race below, so we poll the clock with setImmediate instead of trusting setTimeout.
 */
export function sleep(ms) {
  const until = performance.now() + ms;
  return new Promise((resolve) => {
    const tick = () => (performance.now() >= until ? resolve() : setImmediate(tick));
    tick();
  });
}

const startedAt = performance.now();
export const now = () => (performance.now() - startedAt).toFixed(1).padStart(6, ' ');

/**
 * Fake database.
 * - read(): takes its snapshot when the statement starts (like Postgres READ COMMITTED), returns after the delay.
 * - write(): the new value becomes visible only when the write commits, at the end of the delay.
 */
export function createFakeDb(initial = {}, { readMs = 5, writeMs = 10 } = {}) {
  const rows = new Map(Object.entries(initial));
  const stats = { reads: 0, writes: 0 };
  return {
    stats,
    async read(key, delayMs = readMs) {
      stats.reads++;
      const snapshot = rows.get(key);
      await sleep(delayMs);
      return snapshot;
    },
    async write(key, value, delayMs = writeMs) {
      stats.writes++;
      await sleep(delayMs);
      rows.set(key, value);
    },
    peek: (key) => rows.get(key),
  };
}

/** Fake cache. A delay of 0 means "instant" (sub-millisecond, like a local Redis round trip). */
export function createFakeCache() {
  const store = new Map();
  const wait = (ms) => (ms > 0 ? sleep(ms) : Promise.resolve());
  return {
    async get(key, delayMs = 0) {
      const value = store.get(key);
      await wait(delayMs);
      return value;
    },
    async set(key, value, delayMs = 0) {
      await wait(delayMs);
      store.set(key, value);
    },
    async del(key, delayMs = 0) {
      await wait(delayMs);
      store.delete(key);
    },
    peek: (key) => store.get(key),
    has: (key) => store.has(key),
  };
}

/** Prints the final Cache vs DB state and whether they agree. */
export function verdict(cache, db, key) {
  const c = cache.has(key) ? cache.peek(key) : '(trống)';
  const d = db.peek(key);
  const ok = !cache.has(key) || cache.peek(key) === d;
  console.log(`   => KẾT QUẢ: Cache = ${c} | DB = ${d}  ->  ${ok ? 'NHẤT QUÁN ✔' : 'LỆCH DỮ LIỆU ✘'}`);
  return ok;
}
