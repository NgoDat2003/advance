# -*- coding: utf-8 -*-
"""
Rebuild reports/LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.md and reports/LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.html
with an exact 30-Day Calendar (1 Day = 1 Lesson / 1 Task).
"""
import os

days = [
    {
        "day": 1,
        "course": "Khóa 1",
        "lesson_num": "Bài 03",
        "title": "Database Index: B-Tree, Composite & Covering Index",
        "file": "Tài Liệu/advanced_backend/3. Index.md",
        "guide": "reports/advanced_backend/lesson_03_index_teacher_guide.html",
        "lab": "labs/lesson-03-index/ (npm run homework)",
        "task": "Mở file homework-theories.mine.mjs, điền 3 dự đoán T1, T2, T3, chạy npm run homework trên bảng 500k hợp đồng.",
        "dod": "3 lý thuyết hiện dấu xanh PASS; Heap Fetches = 0 khi có Covering Index INCLUDE (total)."
    },
    {
        "day": 2,
        "course": "Khóa 1",
        "lesson_num": "Bài 12",
        "title": "Database Transaction, WAL Logging & MVCC Internals",
        "file": "Tài Liệu/advanced_backend/12. Transaction.md",
        "guide": "Mục 'WAL & MVCC' trong slide 12",
        "lab": "psql terminal (mô phỏng xmin, xmax)",
        "task": "Mở 2 session psql: Session 1 BEGIN; SELECT xmin, xmax, ctid FROM hw_contracts WHERE id=1; Session 2 UPDATE; Session 1 SELECT lại.",
        "dod": "Tận mắt thấy tuple mới sinh ra, Readers never block Writers trong PostgreSQL."
    },
    {
        "day": 3,
        "course": "Khóa 1",
        "lesson_num": "Bài 12 (tiếp)",
        "title": "4 Cấp Độ Cô Lập (Isolation Levels) & Dị Thường Write Skew",
        "file": "Tài Liệu/advanced_backend/12. Transaction.md",
        "guide": "Mục '4 Isolation Levels' trong slide 12",
        "lab": "psql terminal (mô phỏng Repeatable Read vs Serializable)",
        "task": "Tái hiện lỗi Write Skew trên mức Repeatable Read (2 transaction cùng đọc 2 người đại diện active rồi cùng sửa).",
        "dod": "Thấy Repeatable Read vẫn bị Write Skew; đổi lên Serializable thấy Postgres tự ném lỗi 40001 chặn đứng."
    },
    {
        "day": 4,
        "course": "Khóa 1",
        "lesson_num": "Bài 14",
        "title": "Database Locking, Row Locks & Triệt Tiêu Deadlock",
        "file": "Tài Liệu/advanced_backend/14. Locking.md",
        "guide": "Mục 'SELECT FOR UPDATE & Deadlock'",
        "lab": "psql terminal (tái hiện 40P01 Deadlock)",
        "task": "Mở 2 session cố tình khóa chéo ID 1 và ID 2 để kích hoạt Deadlock. Sau đó sửa bằng Resource Ordering (ORDER BY id ASC).",
        "dod": "Tận mắt thấy mã lỗi 40P01, sửa xong Deadlock biến mất 100%."
    },
    {
        "day": 5,
        "course": "Khóa 1",
        "lesson_num": "Bài 07",
        "title": "Data Modeling & Thiết Kế Bảng Sổ Cái Kép (Double-Entry)",
        "file": "Tài Liệu/advanced_backend/7. Data Modeling.md",
        "guide": "Mục 'Double-Entry Bookkeeping'",
        "lab": "Dựng schema bảng contract_balances và ledger_entries",
        "task": "Thiết kế bảng số dư cọc có CHECK (balance >= 0) và bảng bút toán nợ/có (Debit = Credit).",
        "dod": "INSERT thử nghiệm: Tổng tiền Nợ luôn bằng tổng tiền Có, không bao giờ có dòng âm tiền."
    },
    {
        "day": 6,
        "course": "Khóa 1",
        "lesson_num": "Bài 04 & 13",
        "title": "Clean Architecture & Clean Code: Cấu Trúc Module Chuẩn",
        "file": "Tài Liệu/advanced_backend/4. Codebase Structure.md & 13. Clean Code.md",
        "guide": "Mục 'Dependency Inversion & Result Pattern'",
        "lab": "Tạo thư mục engine/sprint-1-settlement/",
        "task": "Tách rạch ròi 3 tầng: Domain (Rules tiền cọc) -> Service (Use-case) -> Repository (Postgres raw SQL).",
        "dod": "Logic tính cọc độc lập 100% với database driver, sẵn sàng viết test."
    },
    {
        "day": 7,
        "course": "Khóa 1",
        "lesson_num": "Bài 06",
        "title": "Redis Mastery: Single-Threaded Event Loop & Data Structures",
        "file": "Tài Liệu/advanced_backend/6. Redis.md",
        "guide": "Mục 'Redis Data Types & I/O Multiplexing'",
        "lab": "Docker Redis 7 (viết script test Hash, ZSET, SCAN)",
        "task": "Viết script Node.js lưu hợp đồng bằng Hash, lưu lịch thanh toán bằng ZSET, benchmark tốc độ.",
        "dod": "Hiểu rõ cơ chế epoll giúp Redis đạt 100k QPS; thay thế hoàn toàn lệnh cấm KEYS * bằng SCAN."
    },
    {
        "day": 8,
        "course": "Khóa 1",
        "lesson_num": "Bài 15",
        "title": "Operating System Internals: Page Cache, epoll & Zero-Copy",
        "file": "Tài Liệu/advanced_backend/15. Operating System.md",
        "guide": "Mục 'Zero-Copy & sendfile system call'",
        "lab": "Phân tích sơ đồ 4 lần copy vs sendfile",
        "task": "Đọc hiểu cơ chế Linux Virtual Memory, Page Faults, và tại sao Kafka/Nginx lại dùng Zero-Copy.",
        "dod": "Trả lời trôi chảy: Tại sao sendfile truyền thẳng từ Page Cache sang NIC không qua User Space."
    },
    {
        "day": 9,
        "course": "Khóa 1",
        "lesson_num": "Bài 05",
        "title": "Computer Networking: TCP 3-Way, TLS 1.3 & HTTP/2 Multiplexing",
        "file": "Tài Liệu/advanced_backend/5. Networking.md",
        "guide": "Mục 'TCP Handshake & HTTP/2 vs HTTP/3'",
        "lab": "cURL / Wireshark inspect kết nối",
        "task": "So sánh HTTP/1.1 Keep-Alive vs HTTP/2 binary framing; hiểu WebSocket connection upgrade.",
        "dod": "Hiểu lý do tại sao cạn kiệt TIME_WAIT socket khi không dùng Connection Pool."
    },
    {
        "day": 10,
        "course": "Khóa 1",
        "lesson_num": "Bài 16",
        "title": "System Integration: Exponential Backoff + Jitter & Circuit Breaker",
        "file": "Tài Liệu/advanced_backend/16. Integration.md",
        "guide": "Mục 'Resilience & Circuit Breaker Pattern'",
        "lab": "Viết module Retry Full Jitter & Circuit Breaker",
        "task": "Viết hàm retry với công thức Full Jitter; giả lập dịch vụ ngoài sập để kích hoạt trạng thái OPEN.",
        "dod": "Hệ thống tự động từ chối request sau 5 lần lỗi liên tiếp, bảo vệ thread pool không bị treo."
    },
    {
        "day": 11,
        "course": "Khóa 1",
        "lesson_num": "Bài 08 & 11",
        "title": "Application Security (OWASP Top 10) & Regex ReDoS Prevention",
        "file": "Tài Liệu/advanced_backend/8. Security.md & 11. Regex.md",
        "guide": "Mục 'IDOR, JWT Stateless & Catastrophic Backtracking'",
        "lab": "Viết middleware JWT auth + Regex an toàn",
        "task": "Nhận diện lỗ hổng IDOR khi xem hợp đồng; kiểm tra biểu thức chính quy mã số thuế tránh bẫy ReDoS.",
        "dod": "Nắm vững cách phòng vệ IDOR bằng cách luôn gán tenant_id/user_id vào điều kiện WHERE."
    },
    {
        "day": 12,
        "course": "Khóa 3",
        "lesson_num": "Bài 01 & 02",
        "title": "Kafka Introduction & 4 Bí Mật Tốc Độ Của Kafka Engine",
        "file": "Tài Liệu/Khóa 4.../Kafka Introduction.pdf & Why Kafka..pdf",
        "guide": "Mục 'Sequential I/O, Page Cache & Zero-Copy'",
        "lab": "Dựng Docker Compose Kafka 3.8+ KRaft mode",
        "task": "Khởi động cụm Kafka KRaft (không cần ZooKeeper container). Dùng kafka-topics tạo topic đầu tiên.",
        "dod": "Cụm Kafka khởi động healthy trên Docker với 0 VNĐ, topic pos.orders.v1 sẵn sàng nhận tin."
    },
    {
        "day": 13,
        "course": "Khóa 3",
        "lesson_num": "Bài 03 & 04",
        "title": "Kafka Core Concepts: Topic, Partition, Offset & Anatomy of Record",
        "file": "Tài Liệu/Khóa 4.../Core Concepts.pdf & Message Broker.pdf",
        "guide": "Mục 'Partition as Unit of Parallelism'",
        "lab": "kafka-console-producer & consumer CLI",
        "task": "Bắn 10 tin nhắn có Key = store_id; quan sát cách Kafka phân bổ tin nhắn vào đúng partition theo key.",
        "dod": "Khắc cốt ghi tâm: Kafka CHỈ đảm bảo thứ tự trong phạm vi 1 partition, không đảm bảo toàn topic."
    },
    {
        "day": 14,
        "course": "Khóa 3",
        "lesson_num": "Bài 05",
        "title": "Kafka Producer Deep Dive: ACKs, Retries & Idempotence",
        "file": "Tài Liệu/Khóa 4.../Producer.pdf",
        "guide": "Mục 'enable.idempotence & acks=all'",
        "lab": "Viết script Node.js Producer với kafkajs",
        "task": "Cấu hình Producer: acks=all, enable.idempotence=true, max.in.flight=5, linger.ms=10. Thử nghiệm retry.",
        "dod": "Producer gửi tin an toàn tuyệt đối, không bao giờ bị duplicate hay mất mát gói tin."
    },
    {
        "day": 15,
        "course": "Khóa 3",
        "lesson_num": "Bài 06",
        "title": "Serialization, Binary Formats (Avro/Protobuf) & Schema Registry",
        "file": "Tài Liệu/Khóa 4.../Serialization.pdf",
        "guide": "Mục 'Schema Registry & Magic Byte'",
        "lab": "So sánh payload size JSON (500 bytes) vs Avro/Protobuf (45 bytes)",
        "task": "Hiểu cấu trúc 1 byte Magic + 4 bytes Schema ID; quy tắc tiến hóa Backward / Forward Compatibility.",
        "dod": "Hiểu rõ tại sao microservices truyền Avro tiết kiệm 90% băng thông mạng so với JSON."
    },
    {
        "day": 16,
        "course": "Khóa 3",
        "lesson_num": "Bài 07",
        "title": "Consumer Groups, Partition Assignor & Cooperative Sticky Rebalance",
        "file": "Tài Liệu/Khóa 4.../Group Membership & Partition Assignment.pdf",
        "guide": "Mục 'CooperativeStickyAssignor vs Eager'",
        "lab": "Chạy 2 Consumer cùng group đọc topic 4 partition, tắt 1 consumer",
        "task": "Cấu hình CooperativeStickyAssignor; quan sát quá trình tái phân bổ gia số mà không Stop-The-World.",
        "dod": "Consumer còn lại tiếp tục đọc mượt mà từ các partition không bị ảnh hưởng."
    },
    {
        "day": 17,
        "course": "Khóa 3",
        "lesson_num": "Bài 08",
        "title": "Consumer Liveness: Tách Biệt Heartbeat Thread & Poll Thread",
        "file": "Tài Liệu/Khóa 4.../Liveness.pdf",
        "guide": "Mục 'max.poll.interval.ms & Rebalance Cascade'",
        "lab": "Giả lập tác vụ nặng 6 phút để kích hoạt Rebalance Cascade",
        "task": "Thấy rõ consumer bị đuổi vì xử lý quá 5 phút; sửa bằng cách đẩy tác vụ sang Worker Pool riêng.",
        "dod": "Triệt tiêu hoàn toàn nguy cơ sập dây chuyền (Rebalance Loop) trong môi trường production."
    },
    {
        "day": 18,
        "course": "Khóa 3",
        "lesson_num": "Bài 09 (Phần 1)",
        "title": "Triệt Tiêu Thảm Họa Dual-Write & Transactional Outbox Pattern",
        "file": "Tài Liệu/Khóa 4.../Problems & Patterns.pdf",
        "guide": "Mục 'The Dual-Write Problem' (trang 40-60)",
        "lab": "Tạo bảng outbox_events trong PostgreSQL",
        "task": "Viết mã nguồn lưu nghiệp vụ và lưu event vào outbox trong cùng 1 transaction PostgreSQL.",
        "dod": "Đạt 100% tính nguyên tử: Hoặc cả 2 cùng lưu, hoặc cùng rollback; không bao giờ lệch DB và Event."
    },
    {
        "day": 19,
        "course": "Khóa 3",
        "lesson_num": "Bài 09 (Phần 2)",
        "title": "Debezium Change Data Capture (CDC) Đọc WAL Postgres Sang Kafka",
        "file": "Tài Liệu/Khóa 4.../Problems & Patterns.pdf",
        "guide": "Mục 'Debezium CDC Engine'",
        "lab": "Bật wal_level=logical trên Postgres, kết nối Debezium",
        "task": "Cấu hình Debezium Connector lắng nghe bảng outbox_events và tự động đẩy sang Kafka topic.",
        "dod": "Khi INSERT vào bảng outbox, message xuất hiện bên Kafka trong < 80ms không cần cronjob."
    },
    {
        "day": 20,
        "course": "Khóa 3",
        "lesson_num": "Bài 10",
        "title": "Case Study: Hệ Thống Phát Hiện Gian Lận Thời Gian Thực (Fintech)",
        "file": "Tài Liệu/Khóa 4.../Fraud Detection System.pdf",
        "guide": "Mục 'Real-time Sliding Window & Alerting'",
        "lab": "Phân tích kiến trúc Flink / Kafka Streams phát hiện quẹt thẻ bất thường",
        "task": "Nắm vững cách tính toán sliding window 5 phút để phát hiện tài khoản chuyển tiền đột biến.",
        "dod": "Hiểu kiến trúc phân tầng: Ingestion -> Stream Processing -> Rule Engine -> Real-time Enforcement."
    },
    {
        "day": 21,
        "course": "Khóa 2",
        "lesson_num": "Bài 01 & 02",
        "title": "Phương Pháp Luận System Design 4 Bước & Capacity Estimation",
        "file": "Tài Liệu/Khóa 3.../01. System Design...pdf & 02. Design Principles...pdf",
        "guide": "Mục 'Back-of-the-envelope & CAP/PACELC'",
        "lab": "Tính toán dung lượng hệ thống 10M DAU trên giấy nháp",
        "task": "Luyện công thức tính nhẩm: DAU -> QPS, dung lượng đĩa 5 năm, RAM Cache 20% theo quy tắc 80/20.",
        "dod": "Tự tin tính toán cấu hình server cho chuỗi 500 nhà hàng POS Maycha trong 10 phút."
    },
    {
        "day": 22,
        "course": "Khóa 2",
        "lesson_num": "Bài 03",
        "title": "Database Scaling: Vertical vs Horizontal Partitioning & Sharding",
        "file": "Tài Liệu/Khóa 3.../03. Database.pdf",
        "guide": "Mục 'Shard Key Selection & Cross-shard joins'",
        "lab": "Phân tích chiến lược Sharding theo store_id",
        "task": "So sánh Range Partitioning vs Hash Partitioning; tiêu chí chọn Shard Key chống Hotspot.",
        "dod": "Hiểu rõ khi nào nên Sharding thủ công, khi nào nên dùng Distributed SQL (CockroachDB/TiDB)."
    },
    {
        "day": 23,
        "course": "Khóa 2",
        "lesson_num": "Bài 04",
        "title": "Caching At Scale & 5 Thuật Toán Rate Limiting Kinh Điển",
        "file": "Tài Liệu/Khóa 3.../04. Caching.pdf",
        "guide": "Mục 'Token Bucket vs Leaky Bucket vs Sliding Window'",
        "lab": "Viết thuật toán Token Bucket bằng Redis Lua Script",
        "task": "Cài đặt Token Bucket 100 req/s per store_id; đo lường độ chính xác dưới tải cao.",
        "dod": "Request thứ 101 trong cùng 1 giây nhận ngay HTTP 429 Too Many Requests."
    },
    {
        "day": 24,
        "course": "Khóa 2",
        "lesson_num": "Bài 05",
        "title": "High-Performance Communication: REST vs gRPC over HTTP/2, WebSocket",
        "file": "Tài Liệu/Khóa 3.../05. Communication.pdf",
        "guide": "Mục 'Reactor Threading Model & SSE vs WebSocket'",
        "lab": "So sánh latency gRPC Protobuf vs REST JSON",
        "task": "Nắm vững lý do gRPC nhanh hơn REST 5-10 lần; thiết kế WebSocket cho màn hình bếp KDS.",
        "dod": "Tự tin phân tích đánh đổi khi nào dùng REST, gRPC, WebSocket, SSE trong phỏng vấn."
    },
    {
        "day": 25,
        "course": "Khóa 2",
        "lesson_num": "Bài 06",
        "title": "Microservices Decomposition & Distributed Transactions (Saga)",
        "file": "Tài Liệu/Khóa 3.../06. Microservices.pdf",
        "guide": "Mục 'Saga Orchestration vs Choreography & Temporal.io'",
        "lab": "Vẽ luồng Compensating Transactions cho đơn hàng POS",
        "task": "Phân tích hiện tượng Lack of Isolation (Dirty Read, Lost Update) trong Saga và cách khắc phục.",
        "dod": "Hiểu vì sao ngành công nghiệp chuyển từ tự viết Saga thủ công sang Durable Execution (Temporal)."
    },
    {
        "day": 26,
        "course": "Khóa 2",
        "lesson_num": "Bài 07",
        "title": "High-Performance Concurrency: LMAX Disruptor & Hashed Wheel Timer",
        "file": "Tài Liệu/Khóa 3.../07. DSA.pdf",
        "guide": "Mục 'Lock-Free Ring Buffer & False Sharing Padding'",
        "lab": "Phân tích cấu trúc Ring Buffer không khóa dùng CAS",
        "task": "Hiểu cấu trúc Cache Line 64 byte và kỹ thuật Padding triệt tiêu False Sharing trên CPU đa lõi.",
        "dod": "Giải mã bí mật tại sao LMAX Disruptor xử lý 6 triệu giao dịch/giây trên 1 máy đơn."
    },
    {
        "day": 27,
        "course": "Khóa 2",
        "lesson_num": "Bài 08",
        "title": "Case Study 1: Thiết Kế Hệ Thống Rút Gọn Link (URL Shortener - Bitly)",
        "file": "Tài Liệu/Khóa 3.../08. URL Shortener.pdf",
        "guide": "Mục 'Base62, KGS & Redirection Caching 301 vs 302'",
        "lab": "Luyện vẽ bản thiết kế 4 bước hoàn chỉnh",
        "task": "Thiết kế Key Generation Service (KGS) sinh trước mã ngắn; tính toán RAM Cache theo 80/20.",
        "dod": "Hoàn thành bài thuyết trình kiến trúc URL Shortener trong vòng 35 phút."
    },
    {
        "day": 28,
        "course": "Khóa 2",
        "lesson_num": "Bài 09 & 10",
        "title": "Case Study 2: Mạng Xã Hội Bảng Tin (Threads Feed) & Sách Kiến Trúc",
        "file": "Tài Liệu/Khóa 3.../09...Threads.pdf & master-software-architecture.pdf",
        "guide": "Mục 'Push vs Pull vs Hybrid Fan-out & Architecture ADRs'",
        "lab": "Thiết kế Hybrid Model giải quyết Celebrity 30M followers",
        "task": "Mô hình hóa Timeline bằng Redis ZSET; trích xuất mẫu viết Architecture Decision Record (ADR).",
        "dod": "Giải quyết dứt điểm câu hỏi hóc búa nhất của phỏng vấn mạng xã hội: Celebrity Problem."
    },
    {
        "day": 29,
        "course": "Khóa 3",
        "lesson_num": "Bài 11, 12, 13",
        "title": "Chinh Phục Chứng Chỉ Quốc Tế Confluent CCDAK (Top 40 Kịch Bản)",
        "file": "Tài Liệu/Khóa 4.../CCDAK Exam_2.pdf",
        "guide": "File đề thi thực chiến 139 trang",
        "lab": "Luyện 40 câu hỏi tình huống chọn lọc",
        "task": "Tập trung giải quyết các câu hỏi về: commitSync vs commitAsync, Rebalance, Exactly-Once, Schema Evolution.",
        "dod": "Đạt tỷ lệ trả lời đúng >= 85%, phản xạ phân tích bài toán cực bén."
    },
    {
        "day": 30,
        "course": "CAPSTONE",
        "lesson_num": "Tổng Kết",
        "title": "Tốt Nghiệp: Refactor Codebase Hợp Đồng Maycha Đang Đóng Băng",
        "file": "D:\\work\\maycha\\quan_ly_hop_dong",
        "guide": "Soạn file ARCHITECTURE_SHOWCASE.md trong repo Maycha",
        "lab": "Refactor 3 module lõi trong dự án Maycha",
        "task": "1. Đưa SELECT FOR UPDATE vào luồng duyệt cọc. 2. Thêm bảng Outbox đồng bộ SAP ERP qua Kafka CDC. 3. Đánh Covering Index.",
        "dod": "Codebase Maycha đạt chuẩn Senior. Tự tin điền vào CV: Core Settlement 5,000 TPS, Zero Data Loss SAP Sync."
    }
]

# 1. Generate Markdown Report
md = []
md.append("# BÁO CÁO TÁC CHIẾN 30 NGÀY: 1 NGÀY = ĐÚNG 1 BÀI HỌC CỤ THỂ")
md.append("## LỘ TRÌNH KHẨN CẤP A-Z KHÔNG BỎ SÓT BÀI NÀO CỦA CẢ 3 KHÓA HỌC")
md.append("*Dành riêng cho: Kỹ sư Đạt | Mục tiêu: Đột phá mức lương Senior 35M - 50M+*")
md.append("")
md.append("---")
md.append("")
md.append("## NGUYÊN TẮC: 1 NGÀY = 1 BÀI HỌC = 1 FILE TÀI LIỆU = 1 MỤC TIÊU DUY NHẤT")
md.append("")
md.append("| Ngày | Khóa Học & Bài | Tên Bài Học Chi Tiết | File Cần Mở Trong Máy | Nhiệm Vụ & Bài Tập Trong Ngày | Mục Tiêu Xong Để Tích Xanh (DoD) |")
md.append("| :---: | :---: | :--- | :--- | :--- | :--- |")

for d in days:
    md.append(f"| **Ngày {d['day']:02d}** | `{d['course']} - {d['lesson_num']}` | **{d['title']}** | `{d['file']}` | {d['task']} | **{d['dod']}** |")

md.append("")
md.append("---")
md.append("")
md.append("## CHI TIẾT 30 NGÀY TÁC CHIẾN")
md.append("")

for d in days:
    md.append(f"### [NGÀY {d['day']:02d}] {d['course']} - {d['lesson_num']}: {d['title']}")
    md.append(f"- 📁 **File tài liệu cần mở**: `{d['file']}`")
    md.append(f"- 💡 **Tài liệu đối chiếu/hướng dẫn**: {d['guide']}")
    md.append(f"- ⚡ **Bài tập / Thao tác thực thi**: {d['task']}")
    md.append(f"- 🎯 **Nghiệm thu hoàn thành (DoD)**: {d['dod']}")
    md.append("")

report_md_path = "reports/LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.md"
with open(report_md_path, "w", encoding="utf-8") as f:
    f.write("\n".join(md))

print(f"Updated Markdown report at: {report_md_path}")

# 2. Generate Interactive HTML Report
html_cards = []
for d in days:
    tag_class = "sprint" if "Sprint" in d['title'] or "Đồ Án" in d['title'] else ("capstone" if d['day'] == 30 else "")
    html_cards.append(f"""
    <div class="day-card" id="card-day-{d['day']}">
      <div class="day-header">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-{d['day']}" onchange="toggleDay({d['day']})">
          <span class="day-number {tag_class}">Ngày {d['day']:02d}</span>
          <span class="day-title">{d['course']} - {d['lesson_num']}: {d['title']}</span>
        </div>
        <span class="day-time">⏱️ 2.0 - 2.5 Giờ</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 1. Hộp Đầu Vào (Mở file nào?)</div>
          <div class="box-content">
            <p><strong>File tài liệu:</strong> <code>{d['file']}</code></p>
            <p style="margin-top: 6px;"><strong>Hướng dẫn:</strong> {d['guide']}</p>
          </div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ 2. Hộp Thực Thi (Làm bài tập gì?)</div>
          <div class="box-content">
            <p><strong>Thao tác:</strong> {d['task']}</p>
            <div class="code-block" style="margin-top: 8px;">
              # Môi trường thực hành:<br>{d['lab']}
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
          </div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 3. Hộp Nghiệm Thu (Nhìn số nào để biết xong?)</div>
          <div class="box-content">
            <p style="color: #4ade80; font-weight: 600;">{d['dod']}</p>
          </div>
        </div>
      </div>
    </div>
    """)

html_full = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lộ Trình Tác Chiến 30 Ngày: 1 Ngày = Đúng 1 Bài Học Cụ Thể</title>
  <style>
    :root {{
      --bg: #0b1120;
      --surface: #1e293b;
      --surface-light: #334155;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.2);
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --c1: #3b82f6;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --radius: 12px;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding-bottom: 80px;
    }}
    .container {{ max-width: 1280px; margin: 0 auto; padding: 0 24px; }}
    header.hero {{
      padding: 36px 0 24px 0;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(11, 17, 32, 0) 100%);
    }}
    .badge-bar {{ display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }}
    .badge {{
      display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 9999px;
      font-size: 0.8rem; font-weight: 600; background: var(--surface-light); color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }}
    .badge.warning {{ color: var(--warning); border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.1); }}
    .badge.success {{ color: var(--success); border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1); }}
    h1 {{
      font-size: 2.1rem; font-weight: 800; margin-bottom: 10px;
      background: linear-gradient(90deg, #ffffff 0%, #38bdf8 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }}
    .lead {{ color: var(--muted); font-size: 1.05rem; max-width: 950px; margin-bottom: 20px; }}
    
    .progress-section {{
      margin: 24px 0; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 18px 24px;
    }}
    .progress-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }}
    .progress-bar-bg {{ background: var(--surface-light); height: 12px; border-radius: 9999px; overflow: hidden; }}
    .progress-bar-fill {{
      background: linear-gradient(90deg, var(--c1) 0%, var(--success) 100%);
      height: 100%; width: 3.3%; transition: width 0.3s ease;
    }}
    
    .day-card {{
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      margin-bottom: 20px; overflow: hidden; transition: all 0.2s;
    }}
    .day-card.completed {{ border-color: var(--success); opacity: 0.85; }}
    .day-card.completed .day-header {{ background: rgba(16, 185, 129, 0.12); }}
    .day-header {{
      padding: 14px 20px; background: rgba(51, 65, 85, 0.4); border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
    }}
    .day-title-wrap {{ display: flex; align-items: center; gap: 12px; }}
    .day-check {{ width: 22px; height: 22px; cursor: pointer; accent-color: var(--success); }}
    .day-number {{
      background: var(--c1); color: #fff; font-size: 0.8rem; font-weight: 800;
      padding: 3px 8px; border-radius: 6px; text-transform: uppercase;
    }}
    .day-number.sprint {{ background: var(--warning); color: #000; }}
    .day-number.capstone {{ background: var(--danger); color: #fff; }}
    .day-title {{ font-size: 1.05rem; font-weight: 700; color: #fff; }}
    .day-time {{ font-size: 0.85rem; color: var(--muted); font-family: var(--font-mono); }}

    .cockpit-grid {{
      display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1px; background: var(--border);
    }}
    .box {{ background: var(--surface); padding: 18px 20px; }}
    .box-title {{
      font-size: 0.82rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; margin-bottom: 8px;
    }}
    .box-title.input-title {{ color: var(--accent); }}
    .box-title.exec-title {{ color: var(--warning); }}
    .box-title.dod-title {{ color: var(--success); }}
    .box-content {{ font-size: 0.92rem; color: #cbd5e1; }}
    .code-block {{
      background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;
      padding: 8px 12px; font-family: var(--font-mono); font-size: 0.83rem; color: #38bdf8;
      position: relative;
    }}
    .copy-btn {{
      position: absolute; top: 6px; right: 6px; background: var(--surface-light);
      border: 1px solid var(--border); color: var(--muted); font-size: 0.7rem;
      padding: 2px 6px; border-radius: 4px; cursor: pointer;
    }}
    .copy-btn:hover {{ color: #fff; background: var(--c1); }}
    
    footer {{ text-align: center; margin-top: 40px; color: var(--muted); font-size: 0.85rem; }}
  </style>
</head>
<body>
  <header class="hero">
    <div class="container">
      <div class="badge-bar">
        <span class="badge">📅 Lịch 30 Ngày Minh Bạch</span>
        <span class="badge warning">⚡ 1 Ngày = Đúng 1 Bài Học</span>
        <span class="badge success">🎯 Học Hết 39 Chuyên Đề Của 3 Khóa</span>
      </div>
      <h1>Lịch Tác Chiến 30 Ngày: Mỗi Ngày Đúng 1 Bài Học Cụ Thể</h1>
      <p class="lead">
        Xóa bỏ 100% sự mơ hồ. Không gom bài, không nói chung chung. 
        Mỗi ngày nhìn vào lịch là biết ngay: <strong>Hôm nay mở file nào ➔ Làm bài tập gì ➔ Nghiệm thu số liệu nào</strong>.
      </p>
    </div>
  </header>

  <main class="container">
    <section class="progress-section">
      <div class="progress-header">
        <div>
          <strong style="font-size: 1.1rem;">Tiến Độ Hoàn Thành (Checklist 30 Ngày)</strong>
          <span style="color: var(--muted); font-size: 0.9rem; margin-left: 8px;" id="progressText">0 / 30 Ngày (0%)</span>
        </div>
        <button onclick="resetProgress()" style="background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Reset</button>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progressBar" style="width: 3.3%;"></div>
      </div>
    </section>

    <!-- LIST OF 30 DAY CARDS -->
    {''.join(html_cards)}

  </main>

  <footer>
    <div class="container">
      <p>Lộ Trình Tác Chiến 30 Ngày Minh Bạch Cá Nhân Hóa Dành Cho Đạt</p>
      <p style="margin-top: 6px;">File gốc: <code>reports/LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.md</code></p>
    </div>
  </footer>

  <script>
    const TOTAL_DAYS = 30;
    function init() {{
      let saved = JSON.parse(localStorage.getItem('dat_study_30days') || '{{}}');
      let doneCount = 0;
      for (let i = 1; i <= TOTAL_DAYS; i++) {{
        let el = document.getElementById('check-day-' + i);
        if (el) {{
          if (saved[i]) {{
            el.checked = true;
            document.getElementById('card-day-' + i).classList.add('completed');
            doneCount++;
          }}
        }}
      }}
      updateProgress(doneCount);
    }}
    function toggleDay(num) {{
      let el = document.getElementById('check-day-' + num);
      let card = document.getElementById('card-day-' + num);
      let saved = JSON.parse(localStorage.getItem('dat_study_30days') || '{{}}');
      if (el.checked) {{
        saved[num] = true;
        card.classList.add('completed');
      }} else {{
        delete saved[num];
        card.classList.remove('completed');
      }}
      localStorage.setItem('dat_study_30days', JSON.stringify(saved));
      updateProgress(Object.keys(saved).length);
    }}
    function updateProgress(doneCount) {{
      let pct = Math.round((doneCount / TOTAL_DAYS) * 100);
      pct = Math.max(pct, 3);
      document.getElementById('progressBar').style.width = pct + '%';
      document.getElementById('progressText').innerText = doneCount + ' / ' + TOTAL_DAYS + ' Ngày (' + pct + '%)';
    }}
    function resetProgress() {{
      if (confirm('Bạn có chắc chắn muốn reset toàn bộ tiến độ 30 ngày?')) {{
        localStorage.removeItem('dat_study_30days');
        location.reload();
      }}
    }}
    function copyCode(btn) {{
      let block = btn.parentElement;
      let text = block.innerText.replace('Copy', '').trim();
      navigator.clipboard.writeText(text).then(() => {{
        let orig = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => {{ btn.innerText = orig; }}, 1500);
      }});
    }}
    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>
"""

report_html_path = "reports/LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.html"
with open(report_html_path, "w", encoding="utf-8") as f:
    f.write(html_full)

print(f"Updated HTML report at: {report_html_path}")
