// Bài tập về nhà Bài 14 (slide 22) — Phần C: bản nháp module đặt vé "do AI viết". Đọc code, tìm 5 lỗi về khóa.
// Chạy: npm run homework:draft — 1 người dùng, bảng nháp hw_draft_flights / hw_draft_bookings (tự xóa khi xong), exit 0.
// Một người dùng thì code "có vẻ chạy được"; phần demo cuối file in triệu chứng đo được của từng hàm. Đáp án: REVIEW_ANSWERS
// trong homework-predictions.solution.mjs (in ra khi chạy npm run homework:solution).
import { openLab, heading } from './lock-kit.mjs';

const lab = await openLab('hw', ['D']); // D = kết nối duy nhất của "service"; O chỉ để dựng bảng và quan sát
const { O, pid } = lab;
const db = lab.D;

// ───────────────────────────── BookingService (bản nháp AI) ─────────────────────────────
/** Lấy số ghế còn trống của chuyến bay. */
async function getAvailableSeats(flightId) {
  const { rows } = await db.query('SELECT seats FROM hw_draft_flights WHERE id = $1', [flightId]);
  return rows[0].seats;
}

/** Đặt 1 vé: kiểm tra còn ghế, khóa chuyến bay, trừ ghế, ghi vé. */
async function bookSeat(flightId, passenger) {
  await db.query('BEGIN');
  try {
    if ((await getAvailableSeats(flightId)) <= 0) throw new Error('Hết ghế');
    await db.query('SELECT id FROM hw_draft_flights WHERE id = $1 FOR UPDATE', [flightId]);
    await db.query('UPDATE hw_draft_flights SET seats = seats - 1 WHERE id = $1', [flightId]);
    await db.query('INSERT INTO hw_draft_bookings (flight_id, passenger) VALUES ($1, $2)', [flightId, passenger]);
    await db.query('COMMIT');
    return { ok: true };
  } catch (e) { await db.query('ROLLBACK'); throw e; }
}

/** Vé khứ hồi: khóa tất cả chuyến trong 1 câu cho nhanh, rồi trừ ghế từng chuyến. */
async function bookRoundTrip(flightIds, passenger) {
  await db.query('BEGIN');
  try {
    const { rows } = await db.query('SELECT id, code FROM hw_draft_flights WHERE id = ANY($1) FOR UPDATE', [flightIds]);
    for (const f of rows) {
      await db.query('UPDATE hw_draft_flights SET seats = seats - 1 WHERE id = $1', [f.id]);
      await db.query('INSERT INTO hw_draft_bookings (flight_id, passenger) VALUES ($1, $2)', [f.id, passenger]);
    }
    await db.query('COMMIT');
    return { ok: true, locked: rows.map((f) => f.code) };
  } catch (e) { await db.query('ROLLBACK'); throw e; }
}

/** Xác nhận vé với khóa lạc quan: chỉ trừ ghế nếu version chưa đổi. */
async function confirmWithVersion(flightId, version, passenger) {
  await db.query('BEGIN');
  try {
    await db.query('UPDATE hw_draft_flights SET seats = seats - 1, version = version + 1 WHERE id = $1 AND version = $2',
      [flightId, version]);
    await db.query('INSERT INTO hw_draft_bookings (flight_id, passenger) VALUES ($1, $2)', [flightId, passenger]);
    await db.query('COMMIT');
    return { ok: true };
  } catch (e) { await db.query('ROLLBACK'); throw e; }
}

/** Khóa phân tán theo chuyến bay để chạy fn an toàn giữa nhiều instance. */
async function withFlightLock(flightId, fn) {
  await db.query("SELECT pg_advisory_lock(hashtext('flight:' || $1))", [flightId]);
  return fn();
}

/** Đếm số vé đã đặt, khóa lại để không ai chen vào lúc đang đếm. */
async function countBookedLocked(flightId) {
  await db.query('BEGIN');
  try {
    const { rows } = await db.query('SELECT count(*)::int AS n FROM hw_draft_bookings WHERE flight_id = $1 FOR UPDATE', [flightId]);
    await db.query('COMMIT');
    return rows[0].n;
  } catch (e) { await db.query('ROLLBACK'); throw e; }
}
// ─────────────────────────────────── hết bản nháp ───────────────────────────────────────

// Demo 1 người dùng: mỗi lần gọi bọc try/catch và in triệu chứng đo được (không phải ý kiến).
const one = async (sql, params = []) => (await O.query(sql, params)).rows[0];
const myLocks = async (type) => Number((await db.query({
  text: 'SELECT count(*) AS n FROM pg_locks WHERE pid = pg_backend_pid() AND locktype = $1', values: [type] })).rows[0].n);
const state = () => one(`SELECT (SELECT seats FROM hw_draft_flights WHERE id = 1) AS seats,
  (SELECT count(*)::int FROM hw_draft_bookings WHERE flight_id = 1) AS vé`);
try {
  console.log('Bài tập 14 — Phần C: chạy thử bản nháp module đặt vé do AI viết (slide 22), 1 người dùng');
  await O.query(`DROP TABLE IF EXISTS hw_draft_bookings, hw_draft_flights;
    CREATE TABLE hw_draft_flights (LIKE flights INCLUDING ALL);
    INSERT INTO hw_draft_flights VALUES (1, 'VN123', 5, 0), (2, 'VN456', 5, 0);
    CREATE TABLE hw_draft_bookings (LIKE bookings INCLUDING ALL)`);

  heading('1. bookSeat — kiểm tra ghế');
  try {
    await db.query('BEGIN');
    const seats = await getAvailableSeats(1);
    const rowLocks = await myLocks('transactionid'); // khóa dòng = phiên có transactionid riêng
    await db.query('ROLLBACK');
    console.log(`triệu chứng: lúc kiểm tra thấy seats=${seats}, phiên đang giữ ${rowLocks} khóa dòng → người khác vẫn đặt chen được`);
    await bookSeat(1, 'P1');
    console.log('bookSeat(1) vẫn trả ok khi chỉ có 1 người — lỗi chỉ lộ khi chạy đồng thời (kịch bản s1)');
  } catch (e) { console.log(`triệu chứng: lỗi ${e.code ?? ''} ${e.message}`); }

  heading('2. bookRoundTrip — khóa 2 chuyến');
  try {
    // Giả lập 2 instance nhận 2 plan khác nhau cho cùng câu khóa (bảng lớn dần, thống kê đổi…): ép Seq Scan rồi Index Scan.
    await db.query('SET enable_indexscan = off; SET enable_bitmapscan = off');
    const seq = await bookRoundTrip([1, 2], 'P2');
    await db.query('SET enable_indexscan = on; SET enable_seqscan = off');
    const idx = await bookRoundTrip([1, 2], 'P2');
    await db.query('RESET enable_indexscan; RESET enable_bitmapscan; RESET enable_seqscan');
    console.log(`triệu chứng: cùng input [1, 2] — Seq Scan khóa ${seq.locked.join(' → ')}, Index Scan khóa ${idx.locked.join(' → ')}`
      + ' → thứ tự khóa do plan quyết định, 2 phiên khác plan sẽ khóa ngược nhau → 40P01 (kịch bản s6)');
  } catch (e) { console.log(`triệu chứng: lỗi ${e.code ?? ''} ${e.message}`); }

  heading('3. confirmWithVersion — khóa lạc quan');
  try {
    const before = await state();
    const v = (await one('SELECT version FROM hw_draft_flights WHERE id = 1')).version;
    await confirmWithVersion(1, v, 'P3'); // người thắng: version v → v+1
    const mid = await state();
    const r = await confirmWithVersion(1, v, 'P4'); // version cũ, giả lập người đọc trước người thắng
    const after = await state();
    console.log(`triệu chứng: lần 1 seats ${before.seats} → ${mid.seats}; lần 2 dùng version cũ ${v}: ok=${r.ok}, `
      + `seats ${mid.seats} → ${after.seats} nhưng số vé ${mid.vé} → ${after.vé} → vé ma`);
  } catch (e) { console.log(`triệu chứng: lỗi ${e.code ?? ''} ${e.message}`); }

  heading('4. withFlightLock — advisory lock');
  try {
    await withFlightLock(1, () => bookSeat(1, 'P5'));
    console.log(`triệu chứng: bookSeat đã COMMIT nhưng phiên vẫn giữ ${await myLocks('advisory')} advisory lock`
      + ' → trả kết nối về pool là giữ khóa mãi, request sau trên kết nối khác chờ tới lock_timeout');
  } catch (e) { console.log(`triệu chứng: lỗi ${e.code ?? ''} ${e.message}`); }

  heading('5. countBookedLocked — đếm có khóa');
  try {
    console.log(`countBookedLocked(1) = ${await countBookedLocked(1)}`);
  } catch (e) { console.log(`triệu chứng: lỗi ${e.code}: ${e.message} → hàm không bao giờ chạy được`); }

  // Đóng kết nối của service: Postgres tự nhả advisory lock bị rò (O kiểm tra lại, chờ tối đa 2 s cho backend thoát).
  await db.end();
  let left = -1;
  for (let i = 0; i < 100 && left !== 0; i++) {
    left = Number((await one("SELECT count(*) AS n FROM pg_locks WHERE pid = $1 AND locktype = 'advisory'", [pid.D])).n);
    if (left) await new Promise((res) => setTimeout(res, 20));
  }
  console.log(`\nsau khi đóng kết nối của service: còn ${left} advisory lock của phiên đó (Postgres tự nhả khi phiên kết thúc)`);
} finally {
  await lab.close(); // xóa hw_draft_* (tiền tố hw_)
}
