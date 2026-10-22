// Homework (slide 43) — reference solution. Try it yourself first, then compare.
// Local in-process cache for the list of airports (code, name) with TTL, Read-Aside, no source DB.
// Run: node homework-airport-cache.solution.ts   (Node 22.18+ strips the TypeScript types by itself)

export interface Airport {
  code: string;
  name: string;
}

/** Minimal in-process cache: every entry carries its own expiry time. Knows nothing about airports. */
export class TtlCache<V> {
  private readonly entries = new Map<string, { value: V; expiresAt: number }>();
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key); // lazy expiry: an expired entry is removed when someone touches it
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
  }

  delete(key: string): void {
    this.entries.delete(key);
  }
}

const LIST_KEY = 'airports:all';

/**
 * Read-Aside: the service asks the cache first; on a miss it loads from the source and writes the result back.
 * The whole list is small, so it is cached as one entry and indexed by code. Looking up an unknown code
 * then never reaches the source, which also closes the Cache Penetration hole for this dataset.
 */
export class AirportService {
  private readonly cache: TtlCache<Map<string, Airport>>;
  private readonly loadAirports: () => Promise<Airport[]>;
  private readonly ttlMs: number;
  private inFlight: Promise<Map<string, Airport>> | null = null;
  // Bumped by invalidate(). A load that started before the bump must not write its (now stale) result:
  // that would be scenario E from the lesson (read old data, cache it after the delete) inside one process.
  private generation = 0;
  readonly stats = { hits: 0, misses: 0, loads: 0 };

  constructor(loadAirports: () => Promise<Airport[]>, options: { ttlMs?: number; now?: () => number } = {}) {
    this.loadAirports = loadAirports;
    this.ttlMs = options.ttlMs ?? 10 * 60_000;
    this.cache = new TtlCache(options.now);
  }

  async list(): Promise<Airport[]> {
    return [...(await this.index()).values()];
  }

  async findByCode(rawCode: string): Promise<Airport | null> {
    const code = rawCode.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) return null; // validate input before touching cache or source
    return (await this.index()).get(code) ?? null;
  }

  /** Call after the airport list changes (Write-Around: update the source, then delete the cache entry). */
  invalidate(): void {
    this.generation++;
    this.cache.delete(LIST_KEY);
    this.inFlight = null; // callers arriving after the change must not join a load that read the old data
  }

  private async index(): Promise<Map<string, Airport>> {
    const cached = this.cache.get(LIST_KEY);
    if (cached) {
      this.stats.hits++;
      return cached;
    }
    this.stats.misses++;
    // Singleflight: concurrent misses share one load instead of all hitting the source (Cache Breakdown).
    if (!this.inFlight) {
      const pending: Promise<Map<string, Airport>> = this.loadIndex().finally(() => {
        if (this.inFlight === pending) this.inFlight = null; // never clear a newer load started after invalidate()
      });
      this.inFlight = pending;
    }
    return this.inFlight;
  }

  private async loadIndex(): Promise<Map<string, Airport>> {
    this.stats.loads++;
    const startedAt = this.generation;
    const rows = await this.loadAirports();
    const index = new Map(rows.map((airport) => [airport.code, airport] as const));
    if (startedAt === this.generation) {
      const jitter = Math.floor(Math.random() * this.ttlMs * 0.1); // spread expiries (Cache Avalanche)
      this.cache.set(LIST_KEY, index, this.ttlMs + jitter);
    }
    return index;
  }
}

// ---- Self-check: run this file directly to see every acceptance criterion pass or fail. ----
const AIRPORTS: Airport[] = [
  { code: 'SGN', name: 'Tân Sơn Nhất (TP.HCM)' },
  { code: 'HAN', name: 'Nội Bài (Hà Nội)' },
  { code: 'DAD', name: 'Đà Nẵng' },
  { code: 'CXR', name: 'Cam Ranh (Khánh Hòa)' },
  { code: 'PQC', name: 'Phú Quốc' },
];
const sourceDelayMs = 100;
const fakeSource = async (): Promise<Airport[]> => {
  await new Promise((resolve) => setTimeout(resolve, sourceDelayMs));
  return AIRPORTS.map((a) => ({ ...a }));
};

let clock = 0;
const service = new AirportService(fakeSource, { ttlMs: 60_000, now: () => clock });
const check = (label: string, ok: boolean) => console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);

let t = performance.now();
await service.findByCode('sgn');
const missMs = performance.now() - t;
t = performance.now();
const sgn = await service.findByCode('SGN');
const hitMs = performance.now() - t;
check(`Lần đầu MISS (${missMs.toFixed(1)}ms), lần sau HIT (${hitMs.toFixed(3)}ms)`, service.stats.loads === 1 && sgn?.name === 'Tân Sơn Nhất (TP.HCM)');

check('Mã không tồn tại trả null và không gọi lại nguồn', (await service.findByCode('XYZ')) === null && service.stats.loads === 1);
const before = { ...service.stats };
check(
  'Input rác bị chặn bởi validate, trước cả khi chạm cache',
  (await service.findByCode("'; DROP TABLE--")) === null &&
    service.stats.hits === before.hits && service.stats.misses === before.misses && service.stats.loads === before.loads,
);

clock += 70_000; // past 60s + max 10% jitter
await service.list();
check('Hết TTL thì MISS và nạp lại', service.stats.loads === 2);

clock += 70_000;
await Promise.all(Array.from({ length: 50 }, () => service.findByCode('HAN')));
check('50 request đồng thời khi vừa hết hạn chỉ nạp nguồn 1 lần', service.stats.loads === 3);

service.invalidate();
await service.list();
check('invalidate() xóa entry, lần đọc sau nạp lại', service.stats.loads === 4);

// The list changes while a load is still reading the old data (scenario E inside one process).
clock += 70_000;
const staleLoad = service.list();          // load #5 starts and reads the OLD list
AIRPORTS.push({ code: 'VII', name: 'Vinh' }); // the source changes...
service.invalidate();                      // ...and the writer invalidates while load #5 is in flight
await staleLoad;
const vii = await service.findByCode('VII'); // must trigger a fresh load instead of serving load #5's result
check('invalidate() giữa lúc đang nạp: kết quả cũ không bị ghi vào cache', vii?.name === 'Vinh' && service.stats.loads === 6);

console.log('stats:', service.stats);
