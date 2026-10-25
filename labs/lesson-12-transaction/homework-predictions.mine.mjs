// Bài tập về nhà Bài 12 (Slide 24) — Phần B: Dự đoán ma trận 6 hiện tượng × 4 mức cô lập trên PostgreSQL 16.
// Điền vào mỗi ô một trong 3 giá trị: 'xảy ra' | 'không' | '40001'
// Điền vào trường `why` 1 dòng giải thích ngắn gọn lý do cho toàn bộ kịch bản đó (6 dòng tổng cộng).
// Chạy kiểm chứng: npm run homework

export const PREDICTIONS = {
  // 1. Dirty Read: Phiên A đọc được dữ liệu mà phiên B mới UPDATE nhưng chưa COMMIT (và sau đó B ROLLBACK).
  dirtyRead: {
    RU: '???',
    RC: '???',
    RR: '???',
    SER: '???',
    why: '',
  },

  // 2. Non-Repeatable Read: Phiên A đọc cùng 1 dòng (id = 1) hai lần trong cùng 1 transaction và nhận 2 giá trị khác nhau do B đã COMMIT ở giữa.
  nonRepeatableRead: {
    RU: '???',
    RC: '???',
    RR: '???',
    SER: '???',
    why: '',
  },

  // 3. Phantom Read: Phiên A chạy cùng 1 câu SELECT count(*) theo điều kiện 2 lần và thấy số dòng thay đổi do B đã INSERT/COMMIT ở giữa.
  phantom: {
    RU: '???',
    RC: '???',
    RR: '???',
    SER: '???',
    why: '',
  },

  // 4. App Lost Update (Read-Modify-Write): A và B cùng đọc total = 100 về ứng dụng, tự trừ rồi UPDATE SET total = <giá trị tính sẵn>.
  lostUpdate: {
    RU: '???',
    RC: '???',
    RR: '???',
    SER: '???',
    why: '',
  },

  // 5. Atomic Update: A và B cùng chạy câu lệnh nguyên tử UPDATE contracts SET total = total - 10 WHERE id = 1.
  atomicUpdate: {
    RU: '???',
    RC: '???',
    RR: '???',
    SER: '???',
    why: '',
  },

  // 6. Write Skew: Cửa hàng 44 có 2 người đại diện đang trực (on_duty = true). A và B cùng kiểm tra thấy count = 2 >= 1 nên A cho rep 1 nghỉ, B cho rep 2 nghỉ.
  writeSkew: {
    RU: '???',
    RC: '???',
    RR: '???',
    SER: '???',
    why: '',
  },
};
