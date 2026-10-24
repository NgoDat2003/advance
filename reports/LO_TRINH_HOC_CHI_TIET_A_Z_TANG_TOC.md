# BÁO CÁO TÁC CHIẾN 30 NGÀY: 1 NGÀY = ĐÚNG 1 BÀI HỌC CỤ THỂ
## LỘ TRÌNH KHẨN CẤP A-Z KHÔNG BỎ SÓT BÀI NÀO CỦA CẢ 3 KHÓA HỌC
*Dành riêng cho: Kỹ sư Đạt | Mục tiêu: Đột phá mức lương Senior 35M - 50M+*

---

## NGUYÊN TẮC: 1 NGÀY = 1 BÀI HỌC = 1 FILE TÀI LIỆU = 1 MỤC TIÊU DUY NHẤT

| Ngày | Khóa Học & Bài | Tên Bài Học Chi Tiết | File Cần Mở Trong Máy | Nhiệm Vụ & Bài Tập Trong Ngày | Mục Tiêu Xong Để Tích Xanh (DoD) |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **Ngày 01** | `Khóa 1 - Bài 03` | **Database Index: B-Tree, Composite & Covering Index** | `Tài Liệu/advanced_backend/3. Index.md` | Mở file homework-theories.mine.mjs, điền 3 dự đoán T1, T2, T3, chạy npm run homework trên bảng 500k hợp đồng. | **3 lý thuyết hiện dấu xanh PASS; Heap Fetches = 0 khi có Covering Index INCLUDE (total).** |
| **Ngày 02** | `Khóa 1 - Bài 12` | **Database Transaction, WAL Logging & MVCC Internals** | `Tài Liệu/advanced_backend/12. Transaction.md` | Mở 2 session psql: Session 1 BEGIN; SELECT xmin, xmax, ctid FROM hw_contracts WHERE id=1; Session 2 UPDATE; Session 1 SELECT lại. | **Tận mắt thấy tuple mới sinh ra, Readers never block Writers trong PostgreSQL.** |
| **Ngày 03** | `Khóa 1 - Bài 12 (tiếp)` | **4 Cấp Độ Cô Lập (Isolation Levels) & Dị Thường Write Skew** | `Tài Liệu/advanced_backend/12. Transaction.md` | Tái hiện lỗi Write Skew trên mức Repeatable Read (2 transaction cùng đọc 2 người đại diện active rồi cùng sửa). | **Thấy Repeatable Read vẫn bị Write Skew; đổi lên Serializable thấy Postgres tự ném lỗi 40001 chặn đứng.** |
| **Ngày 04** | `Khóa 1 - Bài 14` | **Database Locking, Row Locks & Triệt Tiêu Deadlock** | `Tài Liệu/advanced_backend/14. Locking.md` | Mở 2 session cố tình khóa chéo ID 1 và ID 2 để kích hoạt Deadlock. Sau đó sửa bằng Resource Ordering (ORDER BY id ASC). | **Tận mắt thấy mã lỗi 40P01, sửa xong Deadlock biến mất 100%.** |
| **Ngày 05** | `Khóa 1 - Bài 07` | **Data Modeling & Thiết Kế Bảng Sổ Cái Kép (Double-Entry)** | `Tài Liệu/advanced_backend/7. Data Modeling.md` | Thiết kế bảng số dư cọc có CHECK (balance >= 0) và bảng bút toán nợ/có (Debit = Credit). | **INSERT thử nghiệm: Tổng tiền Nợ luôn bằng tổng tiền Có, không bao giờ có dòng âm tiền.** |
| **Ngày 06** | `Khóa 1 - Bài 04 & 13` | **Clean Architecture & Clean Code: Cấu Trúc Module Chuẩn** | `Tài Liệu/advanced_backend/4. Codebase Structure.md & 13. Clean Code.md` | Tách rạch ròi 3 tầng: Domain (Rules tiền cọc) -> Service (Use-case) -> Repository (Postgres raw SQL). | **Logic tính cọc độc lập 100% với database driver, sẵn sàng viết test.** |
| **Ngày 07** | `Khóa 1 - Bài 06` | **Redis Mastery: Single-Threaded Event Loop & Data Structures** | `Tài Liệu/advanced_backend/6. Redis.md` | Viết script Node.js lưu hợp đồng bằng Hash, lưu lịch thanh toán bằng ZSET, benchmark tốc độ. | **Hiểu rõ cơ chế epoll giúp Redis đạt 100k QPS; thay thế hoàn toàn lệnh cấm KEYS * bằng SCAN.** |
| **Ngày 08** | `Khóa 1 - Bài 15` | **Operating System Internals: Page Cache, epoll & Zero-Copy** | `Tài Liệu/advanced_backend/15. Operating System.md` | Đọc hiểu cơ chế Linux Virtual Memory, Page Faults, và tại sao Kafka/Nginx lại dùng Zero-Copy. | **Trả lời trôi chảy: Tại sao sendfile truyền thẳng từ Page Cache sang NIC không qua User Space.** |
| **Ngày 09** | `Khóa 1 - Bài 05` | **Computer Networking: TCP 3-Way, TLS 1.3 & HTTP/2 Multiplexing** | `Tài Liệu/advanced_backend/5. Networking.md` | So sánh HTTP/1.1 Keep-Alive vs HTTP/2 binary framing; hiểu WebSocket connection upgrade. | **Hiểu lý do tại sao cạn kiệt TIME_WAIT socket khi không dùng Connection Pool.** |
| **Ngày 10** | `Khóa 1 - Bài 16` | **System Integration: Exponential Backoff + Jitter & Circuit Breaker** | `Tài Liệu/advanced_backend/16. Integration.md` | Viết hàm retry với công thức Full Jitter; giả lập dịch vụ ngoài sập để kích hoạt trạng thái OPEN. | **Hệ thống tự động từ chối request sau 5 lần lỗi liên tiếp, bảo vệ thread pool không bị treo.** |
| **Ngày 11** | `Khóa 1 - Bài 08 & 11` | **Application Security (OWASP Top 10) & Regex ReDoS Prevention** | `Tài Liệu/advanced_backend/8. Security.md & 11. Regex.md` | Nhận diện lỗ hổng IDOR khi xem hợp đồng; kiểm tra biểu thức chính quy mã số thuế tránh bẫy ReDoS. | **Nắm vững cách phòng vệ IDOR bằng cách luôn gán tenant_id/user_id vào điều kiện WHERE.** |
| **Ngày 12** | `Khóa 3 - Bài 01 & 02` | **Kafka Introduction & 4 Bí Mật Tốc Độ Của Kafka Engine** | `Tài Liệu/Khóa 4.../Kafka Introduction.pdf & Why Kafka..pdf` | Khởi động cụm Kafka KRaft (không cần ZooKeeper container). Dùng kafka-topics tạo topic đầu tiên. | **Cụm Kafka khởi động healthy trên Docker với 0 VNĐ, topic pos.orders.v1 sẵn sàng nhận tin.** |
| **Ngày 13** | `Khóa 3 - Bài 03 & 04` | **Kafka Core Concepts: Topic, Partition, Offset & Anatomy of Record** | `Tài Liệu/Khóa 4.../Core Concepts.pdf & Message Broker.pdf` | Bắn 10 tin nhắn có Key = store_id; quan sát cách Kafka phân bổ tin nhắn vào đúng partition theo key. | **Khắc cốt ghi tâm: Kafka CHỈ đảm bảo thứ tự trong phạm vi 1 partition, không đảm bảo toàn topic.** |
| **Ngày 14** | `Khóa 3 - Bài 05` | **Kafka Producer Deep Dive: ACKs, Retries & Idempotence** | `Tài Liệu/Khóa 4.../Producer.pdf` | Cấu hình Producer: acks=all, enable.idempotence=true, max.in.flight=5, linger.ms=10. Thử nghiệm retry. | **Producer gửi tin an toàn tuyệt đối, không bao giờ bị duplicate hay mất mát gói tin.** |
| **Ngày 15** | `Khóa 3 - Bài 06` | **Serialization, Binary Formats (Avro/Protobuf) & Schema Registry** | `Tài Liệu/Khóa 4.../Serialization.pdf` | Hiểu cấu trúc 1 byte Magic + 4 bytes Schema ID; quy tắc tiến hóa Backward / Forward Compatibility. | **Hiểu rõ tại sao microservices truyền Avro tiết kiệm 90% băng thông mạng so với JSON.** |
| **Ngày 16** | `Khóa 3 - Bài 07` | **Consumer Groups, Partition Assignor & Cooperative Sticky Rebalance** | `Tài Liệu/Khóa 4.../Group Membership & Partition Assignment.pdf` | Cấu hình CooperativeStickyAssignor; quan sát quá trình tái phân bổ gia số mà không Stop-The-World. | **Consumer còn lại tiếp tục đọc mượt mà từ các partition không bị ảnh hưởng.** |
| **Ngày 17** | `Khóa 3 - Bài 08` | **Consumer Liveness: Tách Biệt Heartbeat Thread & Poll Thread** | `Tài Liệu/Khóa 4.../Liveness.pdf` | Thấy rõ consumer bị đuổi vì xử lý quá 5 phút; sửa bằng cách đẩy tác vụ sang Worker Pool riêng. | **Triệt tiêu hoàn toàn nguy cơ sập dây chuyền (Rebalance Loop) trong môi trường production.** |
| **Ngày 18** | `Khóa 3 - Bài 09 (Phần 1)` | **Triệt Tiêu Thảm Họa Dual-Write & Transactional Outbox Pattern** | `Tài Liệu/Khóa 4.../Problems & Patterns.pdf` | Viết mã nguồn lưu nghiệp vụ và lưu event vào outbox trong cùng 1 transaction PostgreSQL. | **Đạt 100% tính nguyên tử: Hoặc cả 2 cùng lưu, hoặc cùng rollback; không bao giờ lệch DB và Event.** |
| **Ngày 19** | `Khóa 3 - Bài 09 (Phần 2)` | **Debezium Change Data Capture (CDC) Đọc WAL Postgres Sang Kafka** | `Tài Liệu/Khóa 4.../Problems & Patterns.pdf` | Cấu hình Debezium Connector lắng nghe bảng outbox_events và tự động đẩy sang Kafka topic. | **Khi INSERT vào bảng outbox, message xuất hiện bên Kafka trong < 80ms không cần cronjob.** |
| **Ngày 20** | `Khóa 3 - Bài 10` | **Case Study: Hệ Thống Phát Hiện Gian Lận Thời Gian Thực (Fintech)** | `Tài Liệu/Khóa 4.../Fraud Detection System.pdf` | Nắm vững cách tính toán sliding window 5 phút để phát hiện tài khoản chuyển tiền đột biến. | **Hiểu kiến trúc phân tầng: Ingestion -> Stream Processing -> Rule Engine -> Real-time Enforcement.** |
| **Ngày 21** | `Khóa 2 - Bài 01 & 02` | **Phương Pháp Luận System Design 4 Bước & Capacity Estimation** | `Tài Liệu/Khóa 3.../01. System Design...pdf & 02. Design Principles...pdf` | Luyện công thức tính nhẩm: DAU -> QPS, dung lượng đĩa 5 năm, RAM Cache 20% theo quy tắc 80/20. | **Tự tin tính toán cấu hình server cho chuỗi 500 nhà hàng POS Maycha trong 10 phút.** |
| **Ngày 22** | `Khóa 2 - Bài 03` | **Database Scaling: Vertical vs Horizontal Partitioning & Sharding** | `Tài Liệu/Khóa 3.../03. Database.pdf` | So sánh Range Partitioning vs Hash Partitioning; tiêu chí chọn Shard Key chống Hotspot. | **Hiểu rõ khi nào nên Sharding thủ công, khi nào nên dùng Distributed SQL (CockroachDB/TiDB).** |
| **Ngày 23** | `Khóa 2 - Bài 04` | **Caching At Scale & 5 Thuật Toán Rate Limiting Kinh Điển** | `Tài Liệu/Khóa 3.../04. Caching.pdf` | Cài đặt Token Bucket 100 req/s per store_id; đo lường độ chính xác dưới tải cao. | **Request thứ 101 trong cùng 1 giây nhận ngay HTTP 429 Too Many Requests.** |
| **Ngày 24** | `Khóa 2 - Bài 05` | **High-Performance Communication: REST vs gRPC over HTTP/2, WebSocket** | `Tài Liệu/Khóa 3.../05. Communication.pdf` | Nắm vững lý do gRPC nhanh hơn REST 5-10 lần; thiết kế WebSocket cho màn hình bếp KDS. | **Tự tin phân tích đánh đổi khi nào dùng REST, gRPC, WebSocket, SSE trong phỏng vấn.** |
| **Ngày 25** | `Khóa 2 - Bài 06` | **Microservices Decomposition & Distributed Transactions (Saga)** | `Tài Liệu/Khóa 3.../06. Microservices.pdf` | Phân tích hiện tượng Lack of Isolation (Dirty Read, Lost Update) trong Saga và cách khắc phục. | **Hiểu vì sao ngành công nghiệp chuyển từ tự viết Saga thủ công sang Durable Execution (Temporal).** |
| **Ngày 26** | `Khóa 2 - Bài 07` | **High-Performance Concurrency: LMAX Disruptor & Hashed Wheel Timer** | `Tài Liệu/Khóa 3.../07. DSA.pdf` | Hiểu cấu trúc Cache Line 64 byte và kỹ thuật Padding triệt tiêu False Sharing trên CPU đa lõi. | **Giải mã bí mật tại sao LMAX Disruptor xử lý 6 triệu giao dịch/giây trên 1 máy đơn.** |
| **Ngày 27** | `Khóa 2 - Bài 08` | **Case Study 1: Thiết Kế Hệ Thống Rút Gọn Link (URL Shortener - Bitly)** | `Tài Liệu/Khóa 3.../08. URL Shortener.pdf` | Thiết kế Key Generation Service (KGS) sinh trước mã ngắn; tính toán RAM Cache theo 80/20. | **Hoàn thành bài thuyết trình kiến trúc URL Shortener trong vòng 35 phút.** |
| **Ngày 28** | `Khóa 2 - Bài 09 & 10` | **Case Study 2: Mạng Xã Hội Bảng Tin (Threads Feed) & Sách Kiến Trúc** | `Tài Liệu/Khóa 3.../09...Threads.pdf & master-software-architecture.pdf` | Mô hình hóa Timeline bằng Redis ZSET; trích xuất mẫu viết Architecture Decision Record (ADR). | **Giải quyết dứt điểm câu hỏi hóc búa nhất của phỏng vấn mạng xã hội: Celebrity Problem.** |
| **Ngày 29** | `Khóa 3 - Bài 11, 12, 13` | **Chinh Phục Chứng Chỉ Quốc Tế Confluent CCDAK (Top 40 Kịch Bản)** | `Tài Liệu/Khóa 4.../CCDAK Exam_2.pdf` | Tập trung giải quyết các câu hỏi về: commitSync vs commitAsync, Rebalance, Exactly-Once, Schema Evolution. | **Đạt tỷ lệ trả lời đúng >= 85%, phản xạ phân tích bài toán cực bén.** |
| **Ngày 30** | `CAPSTONE - Tổng Kết` | **Tốt Nghiệp: Refactor Codebase Hợp Đồng Maycha Đang Đóng Băng** | `D:\work\maycha\quan_ly_hop_dong` | 1. Đưa SELECT FOR UPDATE vào luồng duyệt cọc. 2. Thêm bảng Outbox đồng bộ SAP ERP qua Kafka CDC. 3. Đánh Covering Index. | **Codebase Maycha đạt chuẩn Senior. Tự tin điền vào CV: Core Settlement 5,000 TPS, Zero Data Loss SAP Sync.** |

---

## CHI TIẾT 30 NGÀY TÁC CHIẾN

### [NGÀY 01] Khóa 1 - Bài 03: Database Index: B-Tree, Composite & Covering Index
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/3. Index.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: reports/advanced_backend/lesson_03_index_teacher_guide.html
- ⚡ **Bài tập / Thao tác thực thi**: Mở file homework-theories.mine.mjs, điền 3 dự đoán T1, T2, T3, chạy npm run homework trên bảng 500k hợp đồng.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: 3 lý thuyết hiện dấu xanh PASS; Heap Fetches = 0 khi có Covering Index INCLUDE (total).

### [NGÀY 02] Khóa 1 - Bài 12: Database Transaction, WAL Logging & MVCC Internals
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/12. Transaction.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'WAL & MVCC' trong slide 12
- ⚡ **Bài tập / Thao tác thực thi**: Mở 2 session psql: Session 1 BEGIN; SELECT xmin, xmax, ctid FROM hw_contracts WHERE id=1; Session 2 UPDATE; Session 1 SELECT lại.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Tận mắt thấy tuple mới sinh ra, Readers never block Writers trong PostgreSQL.

### [NGÀY 03] Khóa 1 - Bài 12 (tiếp): 4 Cấp Độ Cô Lập (Isolation Levels) & Dị Thường Write Skew
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/12. Transaction.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục '4 Isolation Levels' trong slide 12
- ⚡ **Bài tập / Thao tác thực thi**: Tái hiện lỗi Write Skew trên mức Repeatable Read (2 transaction cùng đọc 2 người đại diện active rồi cùng sửa).
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Thấy Repeatable Read vẫn bị Write Skew; đổi lên Serializable thấy Postgres tự ném lỗi 40001 chặn đứng.

### [NGÀY 04] Khóa 1 - Bài 14: Database Locking, Row Locks & Triệt Tiêu Deadlock
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/14. Locking.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'SELECT FOR UPDATE & Deadlock'
- ⚡ **Bài tập / Thao tác thực thi**: Mở 2 session cố tình khóa chéo ID 1 và ID 2 để kích hoạt Deadlock. Sau đó sửa bằng Resource Ordering (ORDER BY id ASC).
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Tận mắt thấy mã lỗi 40P01, sửa xong Deadlock biến mất 100%.

### [NGÀY 05] Khóa 1 - Bài 07: Data Modeling & Thiết Kế Bảng Sổ Cái Kép (Double-Entry)
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/7. Data Modeling.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Double-Entry Bookkeeping'
- ⚡ **Bài tập / Thao tác thực thi**: Thiết kế bảng số dư cọc có CHECK (balance >= 0) và bảng bút toán nợ/có (Debit = Credit).
- 🎯 **Nghiệm thu hoàn thành (DoD)**: INSERT thử nghiệm: Tổng tiền Nợ luôn bằng tổng tiền Có, không bao giờ có dòng âm tiền.

### [NGÀY 06] Khóa 1 - Bài 04 & 13: Clean Architecture & Clean Code: Cấu Trúc Module Chuẩn
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/4. Codebase Structure.md & 13. Clean Code.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Dependency Inversion & Result Pattern'
- ⚡ **Bài tập / Thao tác thực thi**: Tách rạch ròi 3 tầng: Domain (Rules tiền cọc) -> Service (Use-case) -> Repository (Postgres raw SQL).
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Logic tính cọc độc lập 100% với database driver, sẵn sàng viết test.

### [NGÀY 07] Khóa 1 - Bài 06: Redis Mastery: Single-Threaded Event Loop & Data Structures
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/6. Redis.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Redis Data Types & I/O Multiplexing'
- ⚡ **Bài tập / Thao tác thực thi**: Viết script Node.js lưu hợp đồng bằng Hash, lưu lịch thanh toán bằng ZSET, benchmark tốc độ.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Hiểu rõ cơ chế epoll giúp Redis đạt 100k QPS; thay thế hoàn toàn lệnh cấm KEYS * bằng SCAN.

### [NGÀY 08] Khóa 1 - Bài 15: Operating System Internals: Page Cache, epoll & Zero-Copy
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/15. Operating System.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Zero-Copy & sendfile system call'
- ⚡ **Bài tập / Thao tác thực thi**: Đọc hiểu cơ chế Linux Virtual Memory, Page Faults, và tại sao Kafka/Nginx lại dùng Zero-Copy.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Trả lời trôi chảy: Tại sao sendfile truyền thẳng từ Page Cache sang NIC không qua User Space.

### [NGÀY 09] Khóa 1 - Bài 05: Computer Networking: TCP 3-Way, TLS 1.3 & HTTP/2 Multiplexing
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/5. Networking.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'TCP Handshake & HTTP/2 vs HTTP/3'
- ⚡ **Bài tập / Thao tác thực thi**: So sánh HTTP/1.1 Keep-Alive vs HTTP/2 binary framing; hiểu WebSocket connection upgrade.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Hiểu lý do tại sao cạn kiệt TIME_WAIT socket khi không dùng Connection Pool.

### [NGÀY 10] Khóa 1 - Bài 16: System Integration: Exponential Backoff + Jitter & Circuit Breaker
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/16. Integration.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Resilience & Circuit Breaker Pattern'
- ⚡ **Bài tập / Thao tác thực thi**: Viết hàm retry với công thức Full Jitter; giả lập dịch vụ ngoài sập để kích hoạt trạng thái OPEN.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Hệ thống tự động từ chối request sau 5 lần lỗi liên tiếp, bảo vệ thread pool không bị treo.

### [NGÀY 11] Khóa 1 - Bài 08 & 11: Application Security (OWASP Top 10) & Regex ReDoS Prevention
- 📁 **File tài liệu cần mở**: `Tài Liệu/advanced_backend/8. Security.md & 11. Regex.md`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'IDOR, JWT Stateless & Catastrophic Backtracking'
- ⚡ **Bài tập / Thao tác thực thi**: Nhận diện lỗ hổng IDOR khi xem hợp đồng; kiểm tra biểu thức chính quy mã số thuế tránh bẫy ReDoS.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Nắm vững cách phòng vệ IDOR bằng cách luôn gán tenant_id/user_id vào điều kiện WHERE.

### [NGÀY 12] Khóa 3 - Bài 01 & 02: Kafka Introduction & 4 Bí Mật Tốc Độ Của Kafka Engine
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../Kafka Introduction.pdf & Why Kafka..pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Sequential I/O, Page Cache & Zero-Copy'
- ⚡ **Bài tập / Thao tác thực thi**: Khởi động cụm Kafka KRaft (không cần ZooKeeper container). Dùng kafka-topics tạo topic đầu tiên.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Cụm Kafka khởi động healthy trên Docker với 0 VNĐ, topic pos.orders.v1 sẵn sàng nhận tin.

### [NGÀY 13] Khóa 3 - Bài 03 & 04: Kafka Core Concepts: Topic, Partition, Offset & Anatomy of Record
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../Core Concepts.pdf & Message Broker.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Partition as Unit of Parallelism'
- ⚡ **Bài tập / Thao tác thực thi**: Bắn 10 tin nhắn có Key = store_id; quan sát cách Kafka phân bổ tin nhắn vào đúng partition theo key.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Khắc cốt ghi tâm: Kafka CHỈ đảm bảo thứ tự trong phạm vi 1 partition, không đảm bảo toàn topic.

### [NGÀY 14] Khóa 3 - Bài 05: Kafka Producer Deep Dive: ACKs, Retries & Idempotence
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../Producer.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'enable.idempotence & acks=all'
- ⚡ **Bài tập / Thao tác thực thi**: Cấu hình Producer: acks=all, enable.idempotence=true, max.in.flight=5, linger.ms=10. Thử nghiệm retry.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Producer gửi tin an toàn tuyệt đối, không bao giờ bị duplicate hay mất mát gói tin.

### [NGÀY 15] Khóa 3 - Bài 06: Serialization, Binary Formats (Avro/Protobuf) & Schema Registry
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../Serialization.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Schema Registry & Magic Byte'
- ⚡ **Bài tập / Thao tác thực thi**: Hiểu cấu trúc 1 byte Magic + 4 bytes Schema ID; quy tắc tiến hóa Backward / Forward Compatibility.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Hiểu rõ tại sao microservices truyền Avro tiết kiệm 90% băng thông mạng so với JSON.

### [NGÀY 16] Khóa 3 - Bài 07: Consumer Groups, Partition Assignor & Cooperative Sticky Rebalance
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../Group Membership & Partition Assignment.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'CooperativeStickyAssignor vs Eager'
- ⚡ **Bài tập / Thao tác thực thi**: Cấu hình CooperativeStickyAssignor; quan sát quá trình tái phân bổ gia số mà không Stop-The-World.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Consumer còn lại tiếp tục đọc mượt mà từ các partition không bị ảnh hưởng.

### [NGÀY 17] Khóa 3 - Bài 08: Consumer Liveness: Tách Biệt Heartbeat Thread & Poll Thread
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../Liveness.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'max.poll.interval.ms & Rebalance Cascade'
- ⚡ **Bài tập / Thao tác thực thi**: Thấy rõ consumer bị đuổi vì xử lý quá 5 phút; sửa bằng cách đẩy tác vụ sang Worker Pool riêng.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Triệt tiêu hoàn toàn nguy cơ sập dây chuyền (Rebalance Loop) trong môi trường production.

### [NGÀY 18] Khóa 3 - Bài 09 (Phần 1): Triệt Tiêu Thảm Họa Dual-Write & Transactional Outbox Pattern
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../Problems & Patterns.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'The Dual-Write Problem' (trang 40-60)
- ⚡ **Bài tập / Thao tác thực thi**: Viết mã nguồn lưu nghiệp vụ và lưu event vào outbox trong cùng 1 transaction PostgreSQL.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Đạt 100% tính nguyên tử: Hoặc cả 2 cùng lưu, hoặc cùng rollback; không bao giờ lệch DB và Event.

### [NGÀY 19] Khóa 3 - Bài 09 (Phần 2): Debezium Change Data Capture (CDC) Đọc WAL Postgres Sang Kafka
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../Problems & Patterns.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Debezium CDC Engine'
- ⚡ **Bài tập / Thao tác thực thi**: Cấu hình Debezium Connector lắng nghe bảng outbox_events và tự động đẩy sang Kafka topic.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Khi INSERT vào bảng outbox, message xuất hiện bên Kafka trong < 80ms không cần cronjob.

### [NGÀY 20] Khóa 3 - Bài 10: Case Study: Hệ Thống Phát Hiện Gian Lận Thời Gian Thực (Fintech)
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../Fraud Detection System.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Real-time Sliding Window & Alerting'
- ⚡ **Bài tập / Thao tác thực thi**: Nắm vững cách tính toán sliding window 5 phút để phát hiện tài khoản chuyển tiền đột biến.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Hiểu kiến trúc phân tầng: Ingestion -> Stream Processing -> Rule Engine -> Real-time Enforcement.

### [NGÀY 21] Khóa 2 - Bài 01 & 02: Phương Pháp Luận System Design 4 Bước & Capacity Estimation
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 3.../01. System Design...pdf & 02. Design Principles...pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Back-of-the-envelope & CAP/PACELC'
- ⚡ **Bài tập / Thao tác thực thi**: Luyện công thức tính nhẩm: DAU -> QPS, dung lượng đĩa 5 năm, RAM Cache 20% theo quy tắc 80/20.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Tự tin tính toán cấu hình server cho chuỗi 500 nhà hàng POS Maycha trong 10 phút.

### [NGÀY 22] Khóa 2 - Bài 03: Database Scaling: Vertical vs Horizontal Partitioning & Sharding
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 3.../03. Database.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Shard Key Selection & Cross-shard joins'
- ⚡ **Bài tập / Thao tác thực thi**: So sánh Range Partitioning vs Hash Partitioning; tiêu chí chọn Shard Key chống Hotspot.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Hiểu rõ khi nào nên Sharding thủ công, khi nào nên dùng Distributed SQL (CockroachDB/TiDB).

### [NGÀY 23] Khóa 2 - Bài 04: Caching At Scale & 5 Thuật Toán Rate Limiting Kinh Điển
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 3.../04. Caching.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Token Bucket vs Leaky Bucket vs Sliding Window'
- ⚡ **Bài tập / Thao tác thực thi**: Cài đặt Token Bucket 100 req/s per store_id; đo lường độ chính xác dưới tải cao.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Request thứ 101 trong cùng 1 giây nhận ngay HTTP 429 Too Many Requests.

### [NGÀY 24] Khóa 2 - Bài 05: High-Performance Communication: REST vs gRPC over HTTP/2, WebSocket
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 3.../05. Communication.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Reactor Threading Model & SSE vs WebSocket'
- ⚡ **Bài tập / Thao tác thực thi**: Nắm vững lý do gRPC nhanh hơn REST 5-10 lần; thiết kế WebSocket cho màn hình bếp KDS.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Tự tin phân tích đánh đổi khi nào dùng REST, gRPC, WebSocket, SSE trong phỏng vấn.

### [NGÀY 25] Khóa 2 - Bài 06: Microservices Decomposition & Distributed Transactions (Saga)
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 3.../06. Microservices.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Saga Orchestration vs Choreography & Temporal.io'
- ⚡ **Bài tập / Thao tác thực thi**: Phân tích hiện tượng Lack of Isolation (Dirty Read, Lost Update) trong Saga và cách khắc phục.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Hiểu vì sao ngành công nghiệp chuyển từ tự viết Saga thủ công sang Durable Execution (Temporal).

### [NGÀY 26] Khóa 2 - Bài 07: High-Performance Concurrency: LMAX Disruptor & Hashed Wheel Timer
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 3.../07. DSA.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Lock-Free Ring Buffer & False Sharing Padding'
- ⚡ **Bài tập / Thao tác thực thi**: Hiểu cấu trúc Cache Line 64 byte và kỹ thuật Padding triệt tiêu False Sharing trên CPU đa lõi.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Giải mã bí mật tại sao LMAX Disruptor xử lý 6 triệu giao dịch/giây trên 1 máy đơn.

### [NGÀY 27] Khóa 2 - Bài 08: Case Study 1: Thiết Kế Hệ Thống Rút Gọn Link (URL Shortener - Bitly)
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 3.../08. URL Shortener.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Base62, KGS & Redirection Caching 301 vs 302'
- ⚡ **Bài tập / Thao tác thực thi**: Thiết kế Key Generation Service (KGS) sinh trước mã ngắn; tính toán RAM Cache theo 80/20.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Hoàn thành bài thuyết trình kiến trúc URL Shortener trong vòng 35 phút.

### [NGÀY 28] Khóa 2 - Bài 09 & 10: Case Study 2: Mạng Xã Hội Bảng Tin (Threads Feed) & Sách Kiến Trúc
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 3.../09...Threads.pdf & master-software-architecture.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Mục 'Push vs Pull vs Hybrid Fan-out & Architecture ADRs'
- ⚡ **Bài tập / Thao tác thực thi**: Mô hình hóa Timeline bằng Redis ZSET; trích xuất mẫu viết Architecture Decision Record (ADR).
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Giải quyết dứt điểm câu hỏi hóc búa nhất của phỏng vấn mạng xã hội: Celebrity Problem.

### [NGÀY 29] Khóa 3 - Bài 11, 12, 13: Chinh Phục Chứng Chỉ Quốc Tế Confluent CCDAK (Top 40 Kịch Bản)
- 📁 **File tài liệu cần mở**: `Tài Liệu/Khóa 4.../CCDAK Exam_2.pdf`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: File đề thi thực chiến 139 trang
- ⚡ **Bài tập / Thao tác thực thi**: Tập trung giải quyết các câu hỏi về: commitSync vs commitAsync, Rebalance, Exactly-Once, Schema Evolution.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Đạt tỷ lệ trả lời đúng >= 85%, phản xạ phân tích bài toán cực bén.

### [NGÀY 30] CAPSTONE - Tổng Kết: Tốt Nghiệp: Refactor Codebase Hợp Đồng Maycha Đang Đóng Băng
- 📁 **File tài liệu cần mở**: `D:\work\maycha\quan_ly_hop_dong`
- 💡 **Tài liệu đối chiếu/hướng dẫn**: Soạn file ARCHITECTURE_SHOWCASE.md trong repo Maycha
- ⚡ **Bài tập / Thao tác thực thi**: 1. Đưa SELECT FOR UPDATE vào luồng duyệt cọc. 2. Thêm bảng Outbox đồng bộ SAP ERP qua Kafka CDC. 3. Đánh Covering Index.
- 🎯 **Nghiệm thu hoàn thành (DoD)**: Codebase Maycha đạt chuẩn Senior. Tự tin điền vào CV: Core Settlement 5,000 TPS, Zero Data Loss SAP Sync.
