// Lab 2.2 — Slides 24-29: Read-Aside + Write-Around with delete (RA+DWA).
// Part 1 replays the two failing timelines from slides 25 and 26.
// Part 2 runs thousands of random read/write collisions on the real event loop and counts how often
// the cache ends up holding a stale value, for "delete cache first" vs "update DB first, delete cache later".
import { createFakeDb, createFakeCache, sleep, now, verdict } from './sim-kit.mjs';

const KEY = 'user:34:age';

async function readAside(cache, db, key, { stallMs = 0, log = () => {} } = {}) {
  const cached = await cache.get(key);
  if (cached !== undefined) {
    log(`HIT cache age=${cached}`);
    return { value: cached, hit: true };
  }
  log('MISS cache -> đọc DB');
  const fromDb = await db.read(key);
  log(`đọc DB xong, thấy age=${fromDb}`);
  if (stallMs) {
    await sleep(stallMs); // GC pause / slow network between the DB read and the cache write
    log(`bị khựng ${stallMs}ms`);
  }
  await cache.set(key, fromDb);
  log(`SET cache age=${fromDb}`);
  return { value: fromDb, hit: false };
}

const logAs = (who) => (msg) => console.log(`${now()}ms  ${who} ${msg}`);

async function slide25DeleteFirst() {
  console.log('\n[Slide 25] XÓA CACHE TRƯỚC rồi ghi DB — R1 ghi age=2, R2 đọc');
  const db = createFakeDb({ [KEY]: 1 });
  const cache = createFakeCache();
  await cache.set(KEY, 1);
  const r1 = async () => {
    await cache.del(KEY); console.log(`${now()}ms  R1 DEL cache`);
    console.log(`${now()}ms  R1 bắt đầu ghi DB age=2 (mất 60ms)`);
    await db.write(KEY, 2, 60); console.log(`${now()}ms  R1 COMMIT DB age=2`);
  };
  const r2 = async () => {
    await sleep(10);
    await readAside(cache, db, KEY, { log: logAs('R2'), stallMs: 0 });
  };
  await Promise.all([r1(), r2()]);
  return verdict(cache, db, KEY);
}

async function slide26DeleteLater() {
  console.log('\n[Slide 26] GHI DB TRƯỚC, XÓA CACHE SAU — nhưng key đang vắng và R2 bị khựng');
  const db = createFakeDb({ [KEY]: 1 }, { readMs: 10 });
  const cache = createFakeCache(); // the key has just expired: the cache is empty
  const r2 = async () => {
    await readAside(cache, db, KEY, { stallMs: 60, log: logAs('R2') });
  };
  const r1 = async () => {
    await sleep(5);
    await db.write(KEY, 2, 20); console.log(`${now()}ms  R1 COMMIT DB age=2`);
    await cache.del(KEY); console.log(`${now()}ms  R1 DEL cache (lúc này cache đang trống, xóa cũng như không)`);
  };
  await Promise.all([r1(), r2()]);
  return verdict(cache, db, KEY);
}

/**
 * One collision: a writer changes v1 -> v2 while a reader starts at a random offset (+-spreadMs).
 * Returns true when the cache is left holding v1 after both finish (persistent stale data until TTL).
 */
async function oneCollision(strategy, { keyPresent, spreadMs, dbReadMs, dbWriteMs, stallChance, stallMs }) {
  const key = 'k';
  const db = createFakeDb({ [key]: 'v1' }, { readMs: dbReadMs, writeMs: dbWriteMs });
  const cache = createFakeCache();
  if (keyPresent) await cache.set(key, 'v1');
  const offset = (Math.random() * 2 - 1) * spreadMs;
  const writer = async () => {
    if (offset < 0) await sleep(-offset);
    if (strategy === 'delete-first') {
      await cache.del(key);
      await db.write(key, 'v2');
    } else {
      await db.write(key, 'v2');
      await cache.del(key);
    }
  };
  const reader = async () => {
    if (offset > 0) await sleep(offset);
    const stall = Math.random() < stallChance ? stallMs : 0;
    await readAside(cache, db, key, { stallMs: stall });
  };
  await Promise.all([writer(), reader()]);
  return cache.peek(key) === 'v1';
}

async function monteCarlo() {
  const base = { spreadMs: 50, dbReadMs: 2, dbWriteMs: 8, stallChance: 0.02, stallMs: 30 };
  const TRIALS = 1000;
  const BATCH = 20;
  console.log(`\n[Thống kê] ${TRIALS} lần một request đọc trùng thời điểm với một request ghi (lệch nhau trong ±${base.spreadMs}ms)`);
  console.log(`  Giả định: đọc DB ${base.dbReadMs}ms, ghi DB ${base.dbWriteMs}ms, cache ~0ms, 2% request đọc bị khựng ${base.stallMs}ms\n`);
  const rows = [];
  for (const keyPresent of [false, true]) {
    for (const strategy of ['delete-first', 'delete-later']) {
      // Small batches: thousands of concurrent timers would lag the event loop and distort the timings.
      let stale = 0;
      for (let done = 0; done < TRIALS; done += BATCH) {
        const runs = await Promise.all(
          Array.from({ length: BATCH }, () => oneCollision(strategy, { ...base, keyPresent })),
        );
        stale += runs.filter(Boolean).length;
      }
      rows.push({
        'Trạng thái key lúc ghi': keyPresent ? 'đang có giá trị cũ' : 'đang vắng (vừa hết TTL)',
        'Chiến lược': strategy === 'delete-first' ? 'Xóa cache trước' : 'Ghi DB trước, xóa cache sau',
        'Số lần cache bị kẹt giá trị cũ': `${stale}/${TRIALS}`,
        'Tỉ lệ': `${((stale / TRIALS) * 100).toFixed(1)}%`,
      });
    }
  }
  console.table(rows);
}

const a = await slide25DeleteFirst();
const b = await slide26DeleteLater();
console.log(`\nSlide 25 (xóa trước): ${a ? 'nhất quán' : 'DB đúng, CACHE SAI'} | Slide 26 (xóa sau): ${b ? 'nhất quán' : 'DB đúng, CACHE SAI'}`);
await monteCarlo();
console.log('Kết luận: cả hai đều có thể sai, nhưng "ghi DB trước, xóa cache sau" sai hiếm hơn nhiều -> thêm TTL ngắn làm lưới an toàn (slide 29).');
