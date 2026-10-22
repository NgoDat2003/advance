// Lab 2.1 — Slides 19-23: on a write, should we UPDATE the cache or DELETE it?
// Replays the three timelines from the slides with two concurrent write requests (R1 sets age=1, R2 sets age=2).
// The sleep() calls force the same interleaving the slides draw, e.g. R1 being paused by a GC or a slow network.
import { createFakeDb, createFakeCache, sleep, now, verdict } from './sim-kit.mjs';

const KEY = 'user:34:age';

async function updateCacheFirst() {
  console.log('\n[Kịch bản A — slide 20] UPDATE CACHE TRƯỚC, rồi mới ghi DB');
  const db = createFakeDb({ [KEY]: 0 });
  const cache = createFakeCache();
  const r1 = async () => {
    await cache.set(KEY, 1); console.log(`${now()}ms  R1 SET cache age=1`);
    await db.write(KEY, 1, 40); console.log(`${now()}ms  R1 COMMIT DB age=1   (R1 ghi DB chậm: chờ lock/GC)`);
  };
  const r2 = async () => {
    await sleep(10);
    await cache.set(KEY, 2); console.log(`${now()}ms  R2 SET cache age=2`);
    await db.write(KEY, 2, 10); console.log(`${now()}ms  R2 COMMIT DB age=2`);
  };
  await Promise.all([r1(), r2()]);
  return verdict(cache, db, KEY);
}

async function updateCacheLater() {
  console.log('\n[Kịch bản B — slide 21] GHI DB TRƯỚC, UPDATE CACHE SAU');
  const db = createFakeDb({ [KEY]: 0 });
  const cache = createFakeCache();
  const r1 = async () => {
    await db.write(KEY, 1, 20); console.log(`${now()}ms  R1 COMMIT DB age=1`);
    await sleep(60); // R1 is paused before it touches the cache
    await cache.set(KEY, 1); console.log(`${now()}ms  R1 SET cache age=1   (bị khựng 60ms trước khi set)`);
  };
  const r2 = async () => {
    await sleep(10);
    await db.write(KEY, 2, 20); console.log(`${now()}ms  R2 COMMIT DB age=2`);
    await cache.set(KEY, 2); console.log(`${now()}ms  R2 SET cache age=2`);
  };
  await Promise.all([r1(), r2()]);
  return verdict(cache, db, KEY);
}

async function deleteCache() {
  console.log('\n[Kịch bản C — slide 23] GHI DB rồi XÓA CACHE (cùng thời điểm như kịch bản B)');
  const db = createFakeDb({ [KEY]: 0 });
  const cache = createFakeCache();
  const r1 = async () => {
    await db.write(KEY, 1, 20); console.log(`${now()}ms  R1 COMMIT DB age=1`);
    await sleep(60);
    await cache.del(KEY); console.log(`${now()}ms  R1 DEL cache`);
  };
  const r2 = async () => {
    await sleep(10);
    await db.write(KEY, 2, 20); console.log(`${now()}ms  R2 COMMIT DB age=2`);
    await cache.del(KEY); console.log(`${now()}ms  R2 DEL cache`);
  };
  await Promise.all([r1(), r2()]);
  const ok = verdict(cache, db, KEY);
  // The next Read-Aside call refills the cache from the DB, so it can only load the latest committed value.
  const fromDb = await db.read(KEY);
  await cache.set(KEY, fromDb);
  console.log(`${now()}ms  Lần đọc kế tiếp: cache miss -> đọc DB -> nạp cache age=${cache.peek(KEY)}`);
  return ok;
}

const results = [await updateCacheFirst(), await updateCacheLater(), await deleteCache()];
console.log('\nTÓM TẮT:');
console.log(`  A. Update cache trước : ${results[0] ? 'nhất quán' : 'DB sai so với cache'}`);
console.log(`  B. Update cache sau   : ${results[1] ? 'nhất quán' : 'Cache sai so với DB'}`);
console.log(`  C. Xóa cache          : ${results[2] ? 'nhất quán (cache trống, lần đọc sau nạp lại đúng)' : 'lệch'}`);
