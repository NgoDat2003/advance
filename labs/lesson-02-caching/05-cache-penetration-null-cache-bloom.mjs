// Lab 2.5 — Slide 36: Cache Penetration (requests for data that exists neither in cache nor in DB).
// The DB holds 50,000 movie ids. An attacker sends 10,000 requests for ids that do not exist,
// either the same id over and over or a fresh random id every time.
// Strategies: naive read-aside, caching a "null" marker with a short TTL, and a Bloom filter in front.

const VALID_IDS = 50_000;
const ATTACK_REQUESTS = 10_000;
const NULL_MARKER = '__NULL__';

const validIds = new Set(Array.from({ length: VALID_IDS }, (_, i) => `tt${String(i).padStart(7, '0')}`));

/** Minimal Bloom filter: m bits, k hash positions derived from two FNV-1a hashes (double hashing). */
function createBloomFilter(expectedItems, falsePositiveRate) {
  const m = Math.ceil((-expectedItems * Math.log(falsePositiveRate)) / Math.LN2 ** 2);
  const k = Math.max(1, Math.round((m / expectedItems) * Math.LN2));
  const bits = new Uint8Array(Math.ceil(m / 8));
  const fnv = (str, seed) => {
    let h = 0x811c9dc5 ^ seed;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193);
    return h >>> 0;
  };
  const positions = (item) => {
    const h1 = fnv(item, 0);
    const h2 = (fnv(item, 0x5bd1e995) | 1) >>> 0; // `| 1` yields a signed int32; `>>> 0` keeps positions >= 0
    return Array.from({ length: k }, (_, i) => (h1 + i * h2) % m);
  };
  return {
    m, k,
    add(item) { for (const p of positions(item)) bits[p >> 3] |= 1 << (p & 7); },
    mightContain(item) { return positions(item).every((p) => bits[p >> 3] & (1 << (p & 7))); },
  };
}

function simulate(strategy, attackIds) {
  const cache = new Map();
  let dbHits = 0;
  const bloom = strategy === 'bloom' ? createBloomFilter(VALID_IDS, 0.01) : null;
  if (bloom) for (const id of validIds) bloom.add(id);

  for (const id of attackIds) {
    if (bloom && !bloom.mightContain(id)) continue; // rejected before touching cache or DB
    if (cache.has(id)) continue;
    dbHits++;
    const row = validIds.has(id) ? { id } : null;
    if (row) cache.set(id, row);
    else if (strategy !== 'naive') cache.set(id, NULL_MARKER); // real code: SET key "__NULL__" EX 60
  }
  return { dbHits, bloom };
}

const sameId = Array.from({ length: ATTACK_REQUESTS }, () => 'tt9999999x');
const randomIds = Array.from({ length: ATTACK_REQUESTS }, (_, i) => `ttX${i}-${Math.random().toString(36).slice(2, 8)}`);

const rows = [];
for (const [pattern, ids] of [['Lặp lại 1 id không tồn tại', sameId], ['Mỗi lần 1 id ngẫu nhiên', randomIds]]) {
  for (const [strategy, label] of [['naive', 'Read-Aside thường'], ['null-cache', 'Cache giá trị rỗng (TTL ngắn)'], ['bloom', 'Bloom filter (1% FP) + cache rỗng']]) {
    const { dbHits } = simulate(strategy, ids);
    rows.push({ 'Kiểu tấn công': pattern, 'Giải pháp': label, 'Request xuống DB': `${dbHits}/${ATTACK_REQUESTS}` });
  }
}
console.log(`DB có ${VALID_IDS.toLocaleString('vi-VN')} phim. Kẻ tấn công gửi ${ATTACK_REQUESTS.toLocaleString('vi-VN')} request với id không tồn tại.\n`);
console.table(rows);

const bloom = createBloomFilter(VALID_IDS, 0.01);
for (const id of validIds) bloom.add(id);
const falsePositives = randomIds.filter((id) => bloom.mightContain(id)).length;
const missedValid = [...validIds].filter((id) => !bloom.mightContain(id)).length;
console.log(`Bloom filter: ${bloom.m.toLocaleString('vi-VN')} bit (~${(bloom.m / 8 / 1024).toFixed(0)} KB), ${bloom.k} hàm băm.`);
console.log(`  Dương tính giả đo được: ${falsePositives}/${ATTACK_REQUESTS} (${((falsePositives / ATTACK_REQUESTS) * 100).toFixed(2)}%) — lọt xuống DB nhưng vô hại.`);
console.log(`  Âm tính giả: ${missedValid}/${VALID_IDS} — Bloom filter không bao giờ chặn nhầm id có thật.`);
console.log('\nKết luận: cache giá trị rỗng chỉ chặn được id lặp lại; id ngẫu nhiên cần validate đầu vào + Bloom filter.');
