// Bài tập về nhà Bài 14 (slide 22) — Phần D, TỰ LÀM: đặt vé máy bay an toàn khi nhiều người tranh 1 chuyến.
// Bảng: flights(id, code, seats, version), bookings(id, flight_id, passenger). VN123 (id = 1) còn 2 ghế.
// Bạn chỉ viết câu SQL; runner sẽ chạy 3 hành khách đọc trước rồi ghi sau, và chấm:
//   Basic PASS    = 2 vé, 1 người bị từ chối, còn 0 ghế, không lỗi.
//   Advanced PASS = như Basic và 0 lần xung đột version.
// Quy tắc viết SQL:
//   - Mỗi chuỗi đúng 1 câu SELECT hoặc UPDATE, không có ';' nối nhiều câu, không DDL.
//   - Dùng tên bảng `flights` (runner tự đổi sang bảng nháp hw_flights khi chấm).
//   - READ_SQL nhận $1 = id chuyến bay, phải trả về cột `seats` (Advanced trả thêm cột `version`).
//   - WRITE_SQL nhận $1 = id chuyến bay (Advanced: $2 = version vừa đọc), phải sửa đúng 1 dòng.
//   - ADV_LOCK_SQL nhận $1 = id chuyến bay (gợi ý: pg_advisory_xact_lock + hashtext).
// Trước khi chấm, hãy tự chạy thử SQL của bạn bằng 2 cửa sổ psql (bảng "Bài tập D" trong bài giảng).
// Chạy chấm: npm run homework:booking

// Basic: chỉ dùng khóa bi quan trong DB.
export const BASIC = {
  READ_SQL: '???',
  WRITE_SQL: '???',
};

// Advanced: advisory lock (vai "khóa phân tán" trong cùng 1 DB) + khóa lạc quan theo version.
export const ADVANCED = {
  ADV_LOCK_SQL: '???',
  READ_SQL: '???',
  WRITE_SQL: '???',
};
