// Fixture SAI cho hw-check.sh (công cụ controller): chứng minh bộ chấm bắt được lời giải hỏng.
// Lỗi cố ý: kiểm tra khóa bằng GET rồi mới SET (cách nhau 50 ms, không NX) và trả khóa bằng DEL trơn.
// Kỳ vọng: ✘ H1 (2 booking/vòng), ✘ H2 (2 BOOKED), ✔ H3, ✔ H4, ✘ H5 (DEL xóa khóa của người thứ hai).
// Chạy: HW_CMD="node <đường dẫn>/verify/hw-bad-fixture.mjs" bash labs/lesson-06-redis/hw-check.sh
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Gói redis được cài trong labs/lesson-06-redis, nên phân giải từ package.json ở đó (file này nằm ngoài thư mục labs).
const LABS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../labs/lesson-06-redis');
const { createClient } = await import(pathToFileURL(createRequire(join(LABS, 'package.json')).resolve('redis')).href);

const URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
const TTL_MS = Number(process.env.HW_TTL_MS ?? 2000);
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
  if ((await client.get(LOCK)) !== null) {
    await client.rPush('l06:hw:log', `REJECTED ${token}`);
    return;
  }
  await sleep(50); // khoảng hở giữa GET và SET: request kia cũng thấy "trống"
  await client.set(LOCK, token, { expiration: { type: 'PX', value: TTL_MS } });
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
