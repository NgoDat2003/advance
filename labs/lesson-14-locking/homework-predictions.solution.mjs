// Bài tập về nhà Bài 14 (slide 22) — ĐÁP ÁN GIÁO VIÊN Phần B (6 kịch bản đặt vé) và Phần C (5 lỗi trong bản nháp AI).
// Số liệu là kết quả ĐO trên PostgreSQL 16 của máy này (npm run homework:solution) — mọi ô phải ✔.
export const PREDICTIONS = {
  s1: {
    booked: 3, seatsLeft: -1, code: 'none',
    why: 'Không khóa: cả 3 cùng đọc 2 ghế, cùng qua bước kiểm tra, rồi lần lượt trừ tương đối → 3 vé, -1 ghế, không lỗi nào.',
  },
  s2: {
    booked: 2, seatsLeft: 0, code: 'none',
    why: 'FOR UPDATE xếp hàng người đọc: P2, P3 chờ ngay ở SELECT; khi tới lượt P3 đọc lại được 0 ghế nên app từ chối, không lỗi.',
  },
  s3: {
    booked: 2, seatsLeft: 0, code: 'none',
    why: 'Đọc thường nên cả 3 thấy 2 ghế, nhưng WHERE seats > 0 được kiểm tra lại lúc ghi: UPDATE của P3 sửa 0 dòng → từ chối.',
  },
  s4: {
    booked: 1, seatsLeft: 1, code: 'none',
    why: 'Cả 3 đọc version 0; P1 ghi xong version thành 1, nên UPDATE … AND version = 0 của P2, P3 sửa 0 dòng và bỏ cuộc → thừa 1 ghế.',
  },
  s5: {
    booked: 2, seatsLeft: 0, code: 'none',
    why: 'pg_advisory_xact_lock xếp hàng TRƯỚC khi đọc: mỗi người đọc version mới nhất nên 0 xung đột; P3 thấy 0 ghế → từ chối.',
  },
  s6: {
    booked: 1, seatsLeft: 1, code: '40P01',
    why: 'P1 giữ VN123 chờ VN456, P2 giữ VN456 chờ VN123 → vòng chờ; chờ khoảng 1 s thì bộ dò deadlock hủy 1 bên (40P01), bên kia đặt được.',
  },
};

// Phần C: 5 lỗi cố ý trong homework-ai-draft.mjs và cách sửa.
export const REVIEW_ANSWERS = [
  {
    flaw: 'bookSeat gọi getAvailableSeats (SELECT thường) để kiểm tra ghế TRƯỚC khi khóa: lúc kiểm tra phiên chưa giữ khóa dòng nào, người khác vẫn đặt chen được (kịch bản s1).',
    fix: 'Khóa trước rồi mới kiểm tra: SELECT seats … FOR UPDATE trong cùng transaction, hoặc gộp vào UPDATE … WHERE seats > 0 và xem rowCount.',
  },
  {
    flaw: 'bookRoundTrip khóa nhiều chuyến bằng WHERE id = ANY($1) FOR UPDATE không ORDER BY: thứ tự khóa do plan quyết định (Seq Scan theo vị trí dòng, Index Scan theo id), hai phiên khác plan khóa ngược nhau → 40P01 (kịch bản s6).',
    fix: 'Luôn khóa theo một thứ tự toàn cục: SELECT … WHERE id = ANY($1) ORDER BY id FOR UPDATE (Lab 05 phần C), và vẫn thử lại khi gặp 40P01.',
  },
  {
    flaw: 'confirmWithVersion bỏ qua rowCount của UPDATE … AND version = $2: version cũ làm UPDATE sửa 0 dòng nhưng hàm vẫn INSERT vé và báo thành công → vé ma.',
    fix: 'Nếu rowCount = 0 thì ROLLBACK và báo xung đột (hoặc đọc lại rồi thử lại có giới hạn); chỉ INSERT vé khi đúng 1 dòng được sửa.',
  },
  {
    flaw: 'withFlightLock dùng pg_advisory_lock mức session và không bao giờ pg_advisory_unlock: khóa sống qua COMMIT, kết nối trả về pool vẫn giữ khóa, request sau chờ mãi.',
    fix: 'Dùng pg_advisory_xact_lock (tự nhả khi COMMIT/ROLLBACK); nếu buộc dùng mức session thì pg_advisory_unlock trong finally.',
  },
  {
    flaw: 'countBookedLocked chạy SELECT count(*) … FOR UPDATE: Postgres không cho FOR UPDATE với hàm gộp → lỗi 0A000, hàm không bao giờ chạy được.',
    fix: 'Khóa dòng cha thay vì đếm có khóa: SELECT … FROM flights WHERE id = $1 FOR UPDATE rồi mới count(*) thường (hoặc giữ bộ đếm seats trên dòng chuyến bay).',
  },
];
