// Bài tập về nhà Bài 12 (Slide 24) — ĐÁP ÁN GIÁO VIÊN cho Phần B (ma trận 6×4), Phần C (rà soát bản nháp AI) và Phần D.
// Chạy: npm run homework:solution — mọi ô phải ✔ khi đo trên PostgreSQL 16.
export const PREDICTIONS = {
  dirtyRead: {
    RU: 'không', RC: 'không', RR: 'không', SER: 'không',
    why: 'PostgreSQL không có dirty read: READ UNCOMMITTED được nâng lên READ COMMITTED, snapshot chỉ thấy bản ghi đã COMMIT.',
  },
  nonRepeatableRead: {
    RU: 'xảy ra', RC: 'xảy ra', RR: 'không', SER: 'không',
    why: 'RC lấy snapshot mới cho từng câu lệnh nên thấy giá trị B vừa COMMIT; RR/SER giữ một snapshot cho cả transaction.',
  },
  phantom: {
    RU: 'xảy ra', RC: 'xảy ra', RR: 'không', SER: 'không',
    why: 'Cùng cơ chế snapshot: RC thấy dòng B mới INSERT/COMMIT; RR của PostgreSQL dùng snapshot cố định nên không có phantom.',
  },
  lostUpdate: {
    RU: 'xảy ra', RC: 'xảy ra', RR: '40001', SER: '40001',
    why: 'Ứng dụng đọc rồi ghi giá trị tự tính nên ở RC bản ghi của B đè mất của A; RR/SER phát hiện dòng đã bị sửa và ném 40001.',
  },
  atomicUpdate: {
    RU: 'không', RC: 'không', RR: '40001', SER: '40001',
    why: 'SET total = total - delta chờ khóa dòng rồi đọc lại bản mới nhất ở RC nên đủ 70; RR/SER không đọc lại được nên ném 40001.',
  },
  writeSkew: {
    RU: 'xảy ra', RC: 'xảy ra', RR: 'xảy ra', SER: '40001',
    why: 'A và B sửa 2 dòng khác nhau nên không đụng khóa dòng; chỉ SERIALIZABLE (SSI) thấy rw-antidependency và ném 40001 ở COMMIT.',
  },
};

// Phần C: 4 lỗi cố ý trong homework-ai-draft.mjs và cách sửa.
export const REVIEW_ANSWERS = [
  {
    flaw: 'Một kết nối duy nhất đóng vai cả phiên A lẫn phiên B (các UPDATE/SELECT cùng một transaction nên luôn thấy ghi của chính mình).',
    fix: 'Mở 2 kết nối riêng (A, B) và 1 phiên quan sát O; điều phối thứ tự bước như tx-runner, rồi mới kết luận dirty read.',
  },
  {
    flaw: 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE chạy TRƯỚC BEGIN: chỉ có WARNING, transaction vẫn ở READ COMMITTED.',
    fix: 'Dùng BEGIN ISOLATION LEVEL SERIALIZABLE (hoặc SET ngay sau BEGIN) và kiểm tra SHOW transaction_isolation / đọc NOTICE.',
  },
  {
    flaw: 'Thử write skew bằng cách sửa 2 dòng độc lập, không có bất biến chéo dòng (không có bước đọc-kiểm-tra trước khi ghi).',
    fix: 'Dựng bất biến thật (cửa hàng 44 luôn còn >= 1 người trực), cả A và B cùng đếm rồi mỗi bên sửa một dòng khác nhau.',
  },
  {
    flaw: 'COMMIT bọc trong .catch(() => {}) nên lỗi COMMIT (kể cả 40001) bị nuốt và script vẫn báo thành công.',
    fix: 'Bắt lỗi COMMIT, ghi nhận mã code (40001), ROLLBACK và để ứng dụng retry; không bao giờ nuốt lỗi.',
  },
];

// Phần D: chạy forUpdateFix ở READ COMMITTED (3 verdict tính từ số đo).
export const PART_D = true;
