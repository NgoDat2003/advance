// Bài 06 · Bài tập (slide 43) — lời giải mẫu: 2 request cùng lúc đặt ghế A34_S012C chuyến FA634, không cần DB.
// Chạy: cd labs/lesson-06-redis && npm install && npm run hw      (tự chấm: npm run hw:check)
// Hợp đồng với hw-check.sh: đọc HW_TTL_MS (TTL khóa, ms), HOLD_MS (thời gian "làm việc" khi giữ khóa), REDIS_URL.
import { createClient } from 'redis';
import { randomUUID } from 'node:crypto';

const URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'; // 127.0.0.1, không dùng localhost (Windows có thể thử ::1 trước)
const TTL_MS = Number(process.env.HW_TTL_MS ?? 2000);
const HOLD_MS = Number(process.env.HOLD_MS ?? 100);
const LOCK = 'l06:hw:lock:FA634:A34_S012C';
const BOOKINGS = 'l06:hw:bookings:FA634';
const LOG = 'l06:hw:log';
// Trả khóa kiểu compare-and-delete: chỉ xóa khi khóa vẫn mang token của mình (giống lua/lock-release.lua).
const RELEASE = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mỗi request một kết nối riêng, như 2 instance API khác nhau.
async function connect() {
  const c = createClient({ url: URL });
  c.on('error', (err) => console.error('redis error:', err.message)); // bắt buộc có listener 'error'
  await c.connect();
  return c;
}

async function book(client, name) {
  const token = randomUUID(); // token riêng của request này
  // SET NX PX: chỉ một request lấy được khóa; khóa tự hết hạn sau TTL_MS nếu request chết giữa chừng.
  const ok = await client.set(LOCK, token, { condition: 'NX', expiration: { type: 'PX', value: TTL_MS } });
  if (ok !== 'OK') {
    await client.rPush(LOG, `REJECTED ${token}`);
    return `${name}: ghế đang có người giữ → từ chối`;
  }
  try {
    await sleep(HOLD_MS); // giả lập kiểm tra ghế, tính tiền...
    await client.rPush(BOOKINGS, `A34_S012C ${token}`);
    await client.rPush(LOG, `BOOKED ${token}`);
    return `${name}: đặt được ghế`;
  } finally {
    // Trả khóa trong finally: lỗi giữa chừng cũng không để khóa treo tới hết TTL.
    await client.eval(RELEASE, { keys: [LOCK], arguments: [token] });
  }
}

const [a, b] = await Promise.all([connect(), connect()]);
try {
  const results = await Promise.all([book(a, 'request 1'), book(b, 'request 2')]);
  for (const r of results) console.log(r);
} finally {
  await Promise.all([a.close(), b.close()]); // close(): đợi lệnh đang chờ rồi đóng (quit() đã deprecated ở node-redis 6.3.0)
}
