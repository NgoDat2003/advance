// Bài tập bài 3 (slide 41) — Phần B: kiểm chứng 3 "lý thuyết" trong slide trên bảng hw_contracts (500.000 hợp đồng).
// Làm từng lý thuyết một:
//   1. Đọc phát biểu và DỰ ĐOÁN trước: thay mỗi '???' bằng MỘT lựa chọn ghi ở cuối dòng (giữ dấu nháy '...').
//   2. Điền chỗ trống trong câu tạo index (blanks): chỉ tên cột hoặc giá trị status, không viết SQL.
//   3. Chạy: npm run homework → máy đo đúng cách (từng index một, trong ROLLBACK, đếm số trang) và chấm ✔/✘.
//   4. Đọc kết quả, viết 2–3 câu giải thích vào explain, chạy lại để in kèm. Chép khối kết quả vào bài nộp.
// Lý thuyết nào còn '???' sẽ bị từ chối; lý thuyết đã điền đủ vẫn được đo. Xem đáp án: npm run homework:solution
export const THEORIES = {
  // T1 · slide 26: "Index nhiều cột: đặt cột cardinality cao lên trước thì nhanh hơn."
  // store_id có 200 giá trị, status có 4. Máy tạo lần lượt (store_id, status) rồi (status, store_id), đo 3 truy vấn:
  //   Q1: store_id = 42 AND status = 'TERMINATED'    Q2: status = 'TERMINATED'    Q3: store_id = 42
  // "seek" = đi thẳng xuống cây tới đúng chỗ; ngược lại là phải quét gần hết index (hoặc không dùng index).
  T1: {
    predict: {
      bothEqualFaster: '???', // Q1 đọc ít trang hơn với: 'store_first' | 'status_first' | 'same'
      statusOnlySeek: '???', // Q2 seek được với: 'store_first' | 'status_first' | 'both' | 'none'
      storeOnlySeek: '???', // Q3 seek được với: 'store_first' | 'status_first' | 'both' | 'none'
    },
    explain: '',
  },

  // T2 · slide 28: "Covering index: index chứa đủ cột truy vấn cần thì không phải đọc bảng."
  // Truy vấn: SELECT signed_at, total FROM hw_contracts WHERE customer_id = 42 ORDER BY signed_at DESC LIMIT 5
  // So sánh: index (customer_id, signed_at)  với  (customer_id, signed_at) INCLUDE (<chỗ trống>)
  T2: {
    blanks: {
      include: '???', // các cột thêm vào INCLUDE, cách nhau dấu phẩy, ví dụ 'code' hoặc 'code, status'
    },
    predict: {
      planWithout: '???', // không INCLUDE: 'Seq Scan' | 'Index Scan' | 'Index Only Scan' | 'Bitmap Heap Scan'
      planWith: '???', // có INCLUDE: cùng 4 lựa chọn như trên
      heapFetchesWith: '???', // có INCLUDE, số lần phải đọc bảng (Heap Fetches): '0' | '>0'
    },
    explain: '',
  },

  // T3 · slide 31: "Đừng đánh index cho cột ít giá trị khác nhau" (status chỉ có 4 giá trị).
  // Máy tạo index (status), đo status = 'TERMINATED' (0.5% số dòng) và status = 'ACTIVE' (60%),
  // rồi thử partial index chỉ chứa MỘT giá trị: CREATE INDEX ... (status) WHERE status = '<chỗ trống>'.
  T3: {
    blanks: {
      partialStatus: '???', // giá trị đáng giữ trong partial index: 'ACTIVE' | 'EXPIRED' | 'DRAFT' | 'TERMINATED'
    },
    predict: {
      planTerminated: '???', // status = 'TERMINATED': 'index' | 'seq_scan'
      planActive: '???', // status = 'ACTIVE': 'index' | 'seq_scan'
      partialSize: '???', // partial so với index đầy đủ: 'about_same' | 'up_to_10x_smaller' | 'over_10x_smaller'
    },
    explain: '',
  },
};
