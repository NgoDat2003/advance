// Lab 2.4 — Slide 34: Cache Avalanche caused by many keys expiring at the same moment.
// 100,000 product keys are warmed by a deploy at 08:00:00 with the same TTL of 3600s.
// We count how many keys expire in each second and compare a fixed TTL with a TTL plus random jitter.

const KEYS = 100_000;
const BASE_TTL = 3600;
const JITTER = 0.1; // +-10% of the base TTL, i.e. 3240s..3960s

function expirationsPerSecond(ttlFor) {
  const buckets = new Map();
  for (let i = 0; i < KEYS; i++) {
    const second = Math.floor(ttlFor());
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }
  return buckets;
}

function describe(label, buckets) {
  const seconds = [...buckets.keys()].sort((a, b) => a - b);
  const peak = Math.max(...buckets.values());
  return {
    'TTL': label,
    'Key hết hạn từ': `08:00 + ${seconds[0]}s`,
    'đến': `08:00 + ${seconds.at(-1)}s`,
    'Đỉnh miss/giây đổ xuống DB': peak.toLocaleString('vi-VN'),
  };
}

const fixed = expirationsPerSecond(() => BASE_TTL);
const jittered = expirationsPerSecond(() => BASE_TTL * (1 + (Math.random() * 2 - 1) * JITTER));

console.log(`${KEYS.toLocaleString('vi-VN')} key được nạp cùng lúc lúc 08:00:00 (deploy / warm-up).\n`);
console.table([describe('3600s cố định', fixed), describe(`3600s ± ${JITTER * 100}% ngẫu nhiên`, jittered)]);

// Per-minute histogram of the jittered case, so the spread is visible in the terminal.
console.log('Phân bố số key hết hạn theo phút (TTL có jitter):');
const perMinute = new Map();
for (const [second, count] of jittered) {
  const minute = Math.floor(second / 60);
  perMinute.set(minute, (perMinute.get(minute) ?? 0) + count);
}
const maxMinute = Math.max(...perMinute.values());
for (const minute of [...perMinute.keys()].sort((a, b) => a - b)) {
  const count = perMinute.get(minute);
  const bar = '█'.repeat(Math.round((count / maxMinute) * 40));
  console.log(`  phút ${String(minute).padStart(2)}  ${bar} ${count}`);
}
const reduction = Math.round(Math.max(...fixed.values()) / Math.max(...jittered.values()));
const spreadMinutes = Math.round((BASE_TTL * JITTER * 2) / 60);
console.log(`\nKết luận: cùng tổng số miss, nhưng jitter rải chúng ra ~${spreadMinutes} phút -> đỉnh tải xuống DB giảm ~${reduction} lần.`);
