// Fixture SAI thứ hai cho hw-check.sh (công cụ controller): khóa đúng NX nhưng TTL ghi cứng và trả khóa bằng DEL trơn.
// Lỗi cố ý: SET NX PX 2000 cố định (bỏ qua HW_TTL_MS) và DEL không kiểm token — đúng kiểu driver-drill lỗi 3.
// Kỳ vọng: ✔ H1, ✔ H2, ✔ H3, ✔ H4 (NX + token ngẫu nhiên vẫn đúng ở vòng thường), ✘ H5 (PTTL lúc thấy ≈ 2000 > 50).
// Chạy: HW_CMD="node <đường dẫn>/verify/hw-bad-del-fixture.mjs" bash labs/lesson-06-redis/hw-check.sh
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Gói redis được cài trong labs/lesson-06-redis, nên phân giải từ package.json ở đó (file này nằm ngoài thư mục labs).
const LABS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../labs/lesson-06-redis');
const { createClient } = await import(pathToFileURL(createRequire(join(LABS, 'package.json')).resolve('redis')).href);

const URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
const HOLD_MS = Number(process.env.HOLD_MS ?? 100);
const LOCK = 'l06:hw:lock:FA634:A34_S012C';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  const c = createClient({ url: URL });
  c.on('error', (err) => console.error('redis error:', err.message));
  await c.connect();
  return c;
}
async function book(client) {
  const token = randomUUID();
  // sai: TTL ghi cứng 2000 ms, không đọc HW_TTL_MS
  const ok = await client.set(LOCK, token, { condition: 'NX', expiration: { type: 'PX', value: 2000 } });
  if (ok !== 'OK') {
    await client.rPush('l06:hw:log', `REJECTED ${token}`);
    return;
  }
  await sleep(HOLD_MS);
  await client.rPush('l06:hw:bookings:FA634', `A34_S012C ${token}`);
  await client.rPush('l06:hw:log', `BOOKED ${token}`);
  await client.del(LOCK); // sai: có thể xóa khóa của người khác
}

const [a, b] = await Promise.all([connect(), connect()]);
try {
  await Promise.all([book(a), book(b)]);
} finally {
  await Promise.all([a.close(), b.close()]);
}
