// Bài tập về nhà Bài 14 (slide 22) — ĐÁP ÁN GIÁO VIÊN Phần D: đặt vé an toàn khi 3 người tranh 2 ghế VN123.
// Chấm: node homework-booking-grader.mjs homework-booking.solution.mjs (chạy trong npm run homework:solution) → Basic PASS, Advanced PASS.

// Basic: FOR UPDATE xếp hàng người đọc. P2, P3 bị chặn ngay ở câu đọc; P2 đọc lại 1 ghế sau khi P1 COMMIT,
// P3 đọc 0 ghế nên app từ chối. UPDATE trừ tương đối an toàn vì dòng đang bị chính mình khóa.
export const BASIC = {
  READ_SQL: 'SELECT seats FROM flights WHERE id = $1 FOR UPDATE',
  WRITE_SQL: 'UPDATE flights SET seats = seats - 1 WHERE id = $1',
};

// Advanced: advisory lock theo chuyến (vai "khóa phân tán" trong cùng 1 DB, tự nhả khi COMMIT/ROLLBACK) xếp hàng 3 người
// TRƯỚC khi đọc, nên mỗi người đọc đúng version mới nhất → 0 xung đột. Guard `version = $2` vẫn giữ: nếu ai đó ghi
// vòng qua advisory lock, UPDATE trả 0 dòng thay vì ghi đè.
export const ADVANCED = {
  ADV_LOCK_SQL: "SELECT pg_advisory_xact_lock(hashtext('flight:' || $1))",
  READ_SQL: 'SELECT seats, version FROM flights WHERE id = $1',
  WRITE_SQL: 'UPDATE flights SET seats = seats - 1, version = version + 1 WHERE id = $1 AND version = $2',
};
