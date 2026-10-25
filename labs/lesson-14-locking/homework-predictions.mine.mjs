// Bài tập về nhà Bài 14 (slide 22) — Phần B: dự đoán trước, đo sau.
// Bối cảnh chung: chuyến VN123 còn 2 ghế, 3 hành khách P1, P2, P3 đặt vé cùng lúc.
// Thứ tự cố định: cả 3 người ĐỌC xong (hoặc bị chặn khi đọc) rồi mới lần lượt GHI.
// Mỗi kịch bản điền 3 ô, thay '???' bằng giá trị:
//   booked    : số vé đặt được (0–3)
//   seatsLeft : số ghế còn lại sau cùng (-1–2)
//   code      : 'none' | '40P01' | '40001' | '55P03' | '23514'   (mã lỗi đáng chú ý nhất, không có thì 'none')
// Trường `why`: 1 dòng giải thích vì sao (bắt buộc, 6 dòng tổng cộng).
// Chạy kiểm chứng: npm run homework

export const PREDICTIONS = {
  // s1. Ngây thơ: SELECT seats (không khóa) → app kiểm tra seats > 0 → UPDATE seats = seats - 1.
  s1: { booked: '???', seatsLeft: '???', code: '???', why: '' },

  // s2. Khóa bi quan: SELECT seats … FOR UPDATE → kiểm tra → UPDATE seats = seats - 1.
  s2: { booked: '???', seatsLeft: '???', code: '???', why: '' },

  // s3. UPDATE có điều kiện: đọc thường, rồi UPDATE … SET seats = seats - 1 WHERE id = $1 AND seats > 0 (0 dòng = từ chối).
  s3: { booked: '???', seatsLeft: '???', code: '???', why: '' },

  // s4. Khóa lạc quan KHÔNG thử lại: đọc seats, version → UPDATE … WHERE version = <version đã đọc> (0 dòng = bỏ cuộc).
  s4: { booked: '???', seatsLeft: '???', code: '???', why: '' },

  // s5. Advisory lock theo chuyến (pg_advisory_xact_lock) + khóa lạc quan theo version.
  s5: { booked: '???', seatsLeft: '???', code: '???', why: '' },

  // s6. Vé khứ hồi: P1 khóa VN123 rồi VN456, P2 khóa VN456 rồi VN123 (ngược thứ tự), mỗi người FOR UPDATE từng chuyến.
  s6: { booked: '???', seatsLeft: '???', code: '???', why: '' },
};
