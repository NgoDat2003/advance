// Bài tập bài 3 (slide 41) — đáp án Phần B (dự đoán + chỗ trống + giải thích) và Phần C (lỗi trong homework-ai-draft.mjs).
// Chạy: npm run homework:solution → runner đo thật trên máy này, in 3 dòng PASS kèm số đo, rồi in đáp án Phần C.
// Giải thích bên dưới không chứa số cố định: số liệu luôn lấy từ lần đo ngay phía trên nó.
export const THEORIES = {
  T1: {
    predict: { bothEqualFaster: 'same', statusOnlySeek: 'status_first', storeOnlySeek: 'store_first' },
    explain:
      'Với Q1 (= trên cả hai cột) hai thứ tự cho cây cùng level và cùng số trang: cả hai đều seek thẳng tới cụm '
      + '(42, TERMINATED), nên cardinality của cột đầu không làm truy vấn nhanh hơn. Thứ tự chỉ quyết định truy vấn MỘT cột '
      + 'nào seek được: cột đứng đầu thì seek, cột đứng sau thì phải quét gần hết trang lá. Vì vậy chọn thứ tự theo mẫu '
      + 'truy vấn, không theo cardinality: cột lọc bằng = đứng trước (cột hay được lọc một mình lên đầu), rồi tới cột '
      + 'ORDER BY, cột lọc khoảng để sau cùng.',
  },
  T2: {
    blanks: { include: 'total' },
    predict: { planWithout: 'Index Scan', planWith: 'Index Only Scan', heapFetchesWith: '0' },
    explain:
      'Index (customer_id, signed_at) thiếu cột total nên Postgres phải đọc heap cho từng dòng (Index Scan). INCLUDE (total) '
      + 'đưa total vào lá của index, đủ mọi cột truy vấn cần → Index Only Scan, Heap Fetches 0, ít trang hơn, đổi lại index '
      + 'to hơn. Trên Postgres điều này chỉ đúng khi trang heap đã được VACUUM đánh dấu all-visible; SELECT * thì không index '
      + 'nào phủ được.',
  },
  T3: {
    blanks: { partialStatus: 'TERMINATED' },
    predict: { planTerminated: 'index', planActive: 'seq_scan', partialSize: 'over_10x_smaller' },
    explain:
      'Điều quyết định là tỉ lệ dòng khớp của giá trị được hỏi, không phải số giá trị khác nhau của cột: TERMINATED (0.5%) '
      + 'dùng index và đọc ít trang hơn hẳn đọc cả bảng, còn ACTIVE (60%) thì Seq Scan rẻ hơn mọi index. Nếu ứng dụng chỉ '
      + "hay hỏi giá trị hiếm, partial index WHERE status = 'TERMINATED' nhỏ hơn hàng chục lần và chỉ dòng TERMINATED mới "
      + 'phải ghi thêm vào index.',
  },
};

// Phần C: lỗi thiết kế thí nghiệm cài sẵn trong homework-ai-draft.mjs (mỗi lý thuyết ≥ 2 lỗi) và cách sửa.
export const REVIEW_ANSWERS = {
  T1: [
    {
      flaw: 'Tạo CẢ HAI index rồi mới đo; đảo thứ tự điều kiện trong WHERE không chọn được index (planner coi a AND b như '
        + 'b AND a). EXPLAIN cho thấy cả hai câu đều dùng idx_contracts_status_store: index "thắng" (store_id, status) không hề được dùng.',
      fix: 'Mỗi lần chỉ có MỘT index, tạo trong BEGIN … ROLLBACK, và EXPLAIN để xác nhận index nào thực sự được dùng.',
    },
    {
      flaw: 'Mỗi câu chỉ chạy 1 lần, đo bằng Date.now(): câu đầu chạy "lạnh" (nạp catalog/index mới, trang chưa ở cache), '
        + 'câu sau chạy "ấm"; truy vấn chỉ ~1 ms nên độ phân giải 1 ms quyết định cả kết quả. Chạy lại là ra N× khác.',
      fix: '1 lần khởi động + trung vị 5 lần (measure() trong pg-explain-kit), thứ tự chạy không được ảnh hưởng kết quả.',
    },
    {
      flaw: 'So ms thay vì số trang và độ cao cây; chỉ thử truy vấn = trên cả 2 cột, đúng loại mà thứ tự cột không quan trọng.',
      fix: 'So EXPLAIN (ANALYZE, BUFFERS) + level (pgstatindex); thêm truy vấn chỉ status = … và chỉ store_id = … (Q2, Q3).',
    },
  ],
  T2: [
    {
      flaw: 'Đo SELECT *: truy vấn cần mọi cột nên không index nào "phủ" được → không thể có Index Only Scan.',
      fix: 'Chỉ SELECT các cột cần (signed_at, total) và INCLUDE đúng các cột đó.',
    },
    {
      flaw: 'Bảng copy tắt autovacuum, vừa UPDATE xong, chỉ ANALYZE chứ không VACUUM → visibility map trống → Index Only Scan '
        + 'vẫn phải kiểm tra heap cho mọi dòng (Heap Fetches 5/5).',
      fix: 'VACUUM (ANALYZE) trước khi đo (kiểm tra pg_class.relallvisible = relpages) hoặc đo trên bảng đã VACUUM.',
    },
    {
      flaw: 'Không có nhóm đối chứng: không so với index không INCLUDE, không so số trang; kết luận "vô dụng trên Postgres" '
        + 'từ một con số Heap Fetches.',
      fix: 'So (customer_id, signed_at) với (customer_id, signed_at) INCLUDE (total): kế hoạch, số trang, Heap Fetches, kích thước.',
    },
  ],
  T3: [
    {
      flaw: "Chỉ thử status = 'ACTIVE' (60% bảng): đọc 60% bảng thì Seq Scan rẻ hơn với bất kỳ index nào. Không thử giá trị "
        + "hiếm 'TERMINATED' (0.5%), là giá trị index thực sự giúp.",
      fix: 'Đo các giá trị mà ứng dụng thật sự hỏi (TERMINATED, DRAFT…); xem phân bố trong pg_stats.most_common_freqs.',
    },
    {
      flaw: 'Suy cho cả cột (và "mọi bảng tương tự") từ một giá trị; cardinality thấp không có nghĩa mọi giá trị đều phổ biến.',
      fix: 'Kết luận theo từng mẫu truy vấn; nếu chỉ hỏi giá trị hiếm thì dùng partial index WHERE status = \'TERMINATED\'.',
    },
    {
      flaw: 'Thời gian 1 lần Date.now() của truy vấn trả 300.545 dòng chủ yếu là thời gian chuyển dữ liệu về Node, '
        + 'không phải thời gian tìm dòng.',
      fix: 'Dùng EXPLAIN (ANALYZE, BUFFERS) để đo số trang ngay trong Postgres, không tính thời gian truyền kết quả.',
    },
  ],
};
