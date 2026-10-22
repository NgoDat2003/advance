# BÁO CÁO TOÀN DIỆN & TỔNG QUAN CHI TIẾT 3 KHÓA HỌC
## BACKEND INTERNALS, SYSTEM DESIGN & KAFKA MASTERY

> **Mục tiêu**: Báo cáo tổng hợp, phân tích chi tiết từng bài giảng và từng slide tài liệu của 3 khóa học trọng điểm. Giúp kỹ sư có cái nhìn toàn cảnh, sâu sắc từ bản chất tầng sâu hệ điều hành / database engine (Khóa 1), tư duy thiết kế kiến trúc phân tán chịu tải cao (Khóa 2), đến hạ tầng truyền sự kiện và streaming phân tán với Apache Kafka (Khóa 3).
> 
> Toàn bộ nội dung tuân thủ triết lý tại `AGENTS.md`: **Anti Over-Engineering**, **Thực chiến trực quan**, **Mô hình tích lũy cuốn chiếu (Cumulative Integration)**.

---

## 0. CHIẾN LƯỢC HỌC SIÊU TỐC: KHAI TỬ VIDEO 2 GIỜ & PHƯƠNG PHÁP ĐỌC ĐẢO NGƯỢC (HIGH-THROUGHPUT LEARNING)

> **Phản biện từ CTO**: Ý định *"lười xem video record 2 tiếng"* là một bản năng tự vệ sinh học hoàn toàn chính xác. Một video bài giảng 120 phút thường chỉ có 20-25 phút kiến thức cốt lõi; 95-100 phút còn lại là nhiễu (Low Signal-to-Noise Ratio).
> 
> Thay vì tiêu tốn 80-100 giờ ngồi xem thụ động (với tỷ lệ nhớ < 15%), ta chuyển sang **Quy trình Thực thi Chủ động 4 Bước (Active Tactile Learning)** cắt giảm 70% thời gian nhưng nâng tỷ lệ làm chủ lên > 80%:
> 
> 1. **Bước 1 (10-15m) - Fast Scan Spec**: Mở file Markdown trong `Tài Liệu/advanced_backend/` đọc quét cấu trúc và 3 bất biến kiến trúc (nhanh gấp 5 lần tốc độ nói video).
> 2. **Bước 2 (20-25m) - Tactile Lab & Bẻ Gãy Code**: Vào `labs/` chạy các lab ESM, cố tình làm sai/phá hỏng để nhìn số liệu đo đạc (`EXPLAIN BUFFERS`, `pg_locks`, `latency`).
> 3. **Bước 3 (10m) - Socratic AI Sparring**: Mở chat bắt AI OMP đóng vai Tech Lead khó tính tra khảo 3 câu hỏi edge-cases và war stories thực tế.
> 4. **Bước 4 (Tối đa 5m) - Video as L3 Cache**: Chỉ mở video KÉO ĐÚNG THANH TUA xem 3-5 phút nếu có thắc mắc chưa giải tỏa sau Bước 2 & 3.

---

## 1. Bảng Chỉ Số Tổng Quan (KPI Dashboard)

| Chỉ Số | Giá Trị Thực Tế | Chi Tiết Nội Dung |
| :--- | :--- | :--- |
| **Tổng Số Khóa Học** | `3 Khóa Toàn Diện` | Backend Internals, System Design & Kafka Nâng Cao |
| **Tổng Số Chuyên Đề** | `39 Chuyên Đề` | 16 Backend + 10 System Design + 13 Kafka Mastery |
| **Tài Liệu Chi Tiết** | `540+ Trang Slide` | Kèm 400 trang Sách Kiến Trúc & 15 Bản Markdown |
| **Thực Hành & Đề Thi** | `11+ Labs & 150+ CCDAK` | Postgres/Redis Labs + Bộ câu hỏi Confluent Certified |

---

## 2. Bản Đồ Mối Quan Hệ Hữu Cơ & Ma Trận Bổ Trợ Giữa 3 Khóa Học

Ba khóa học không tách rời mà tạo thành một **tam giác năng lực hoàn chỉnh** cho Kỹ sư Backend cấp cao (Senior Backend / System Architect):

```
                                   [KHÓA 2: SYSTEM DESIGN]
                             Highly Concurrent Systems (Roninhub)
                                        ▲             ▲
                        Scale-out, Sharding,    │             │  Distributed Tx (Saga),
                        Rate Limit, Estimation  │             │  Trade-offs, Push vs Pull
                                                │             │
                    ┌───────────────────────────┴─────────────┴───────────────────────────┐
                    │                                                                     │
         [KHÓA 1: ADVANCED BACKEND]                                            [KHÓA 3: KAFKA NÂNG CAO]
      Backend Internals (Single-Node)                                      Event Streaming & Microservices
   ─────────────────────────────────────                                ────────────────────────────────────
   • OS: Paging, epoll, Zero-Copy                                       • Engine: Sequential I/O, Page Cache
   • DB: B-Tree, MVCC, Locks, WAL               Outbox Pattern          • Zero-Copy (sendfile), Batching
   • Cache: Stampede, Bloom Filter     ──────────────────────────────►  • Partitioning, Idempotent Producer
   • Arch: Clean Architecture, DDD             Debezium CDC             • Consumer Rebalance, Liveness
   • Resilience: Retry, Circuit Breaker                                 • Exactly-Once, Fraud Detection
```

### Ma Trận Đối So sánh & Bổ Trợ Trực Tiếp:

| Khía Cạnh Kỹ Thuật | Khóa 1: Advanced Backend | Khóa 2: System Design (Roninhub) | Khóa 3: Kafka Nâng Cao (Roninhub) | Mối Liên Kết Tích Hợp |
| :--- | :--- | :--- | :--- | :--- |
| **Tầng Lưu Trữ (Storage)** | Đi sâu vào cấu trúc B-Tree, Heap Tuple, HOT update, WAL, MVCC và các loại khóa (Row, Gap, Next-Key lock) trên 1 database node. | Mở rộng quy mô vượt ngưỡng 20k QPS bằng Range/Hash Partitioning, Sharding đa máy chủ, chọn Partition Key chống Hotspot. | Sử dụng Transactional Outbox Pattern kết hợp Debezium CDC đọc trực tiếp WAL của Postgres để phát event sang Kafka mà không bị lỗi Dual-Write. | Khóa 1 là nền móng để Khóa 2 sharding an toàn và Khóa 3 trích xuất dữ liệu không trễ. |
| **Tầng Caching & Tải** | Giải quyết 4 bệnh kinh điển: Stampede (Singleflight), Avalanche (Jitter), Penetration (Bloom Filter), Race Condition xóa cache. | Định vị Cache đa tầng (CDN, Reverse Proxy, Redis Cluster 16,384 slots), 5 thuật toán Rate Limiting (Token/Leaky Bucket). | Sử dụng Kafka làm bộ đệm Buffer / Traffic Smoothing để hấp thụ đỉnh tải trước khi đổ vào Cache và Database. | Cả 3 kết hợp thành một 'tấm khiên' 4 lớp chống sập hệ thống khi có Flash Sale. |
| **Giao Tiếp & Phân Tán** | Giao thức TCP Handshake, TLS 1.3, HTTP/1.1 vs HTTP/2 vs HTTP/3, WebSocket, Idempotent Webhooks. | So sánh REST vs gRPC over HTTP/2, WebSocket vs SSE, Phân rã Microservices qua Bounded Context, Saga Pattern (Orchestration vs Choreography). | Đi sâu vào Distributed Event Streaming, Consumer Groups, Cooperative Rebalance, Producer ACKs, Exactly-Once Semantics. | Từ kiến trúc mạng máy tính (K1) $\rightarrow$ Thiết kế giao tiếp microservices (K2) $\rightarrow$ Triển khai hạ tầng truyền tin bất đồng bộ (K3). |
| **Hiệu Năng & Kernel** | Phân tích User Space vs Kernel Space, System Calls, I/O Multiplexing (epoll), Zero-Copy `sendfile`. | Mô hình luồng Reactor Pattern (Netty), LMAX Disruptor Lock-Free Ring Buffer, Quản lý timer bằng Hashed Wheel Timer. | Ứng dụng thực tế của Sequential Disk I/O, OS Page Cache, Zero-Copy và Batching/Compression để đạt hàng triệu message/giây. | Khóa 1 giải thích lý thuyết OS $\rightarrow$ Khóa 2 đưa vào giải thuật $\rightarrow$ Khóa 3 chứng minh trong engine Kafka. |

---

## 3.1 Khóa 1: Advanced Backend (Backend Internals & Single-Node Deep Dive)

> **Giảng viên / Nguồn**: Giáo trình Chuyên sâu  
> **Định vị**: *Làm chủ bản chất tầng sâu: Hệ điều hành, Mạng, Database Internals (B-Tree, MVCC, Locks), Caching High-Load và Clean Architecture*  
> **Quy mô**: `16 Chuyên Đề | 15 Markdown Docs | 17 Labs`

**Mô tả tổng quan**: Trọng tâm của khóa học là giải mã 'hộp đen' bên dưới các framework. Thay vì chỉ gọi hàm hay viết CRUD đơn thuần, khóa học đi sâu vào cơ chế kernel Linux, socket, I/O multiplexing, cách database engine tổ chức dữ liệu trên đĩa (B-Tree vs Heap File), cơ chế khóa (Locking) và cô lập giao dịch (MVCC), kỹ thuật thiết kế Cache chịu tải và cấu trúc Clean Architecture chuẩn mực.

### Bảng Chi Tiết Từng Bài Giảng & Nội Dung Slide:

#### Bài 01: REST API Design Standard & Idempotency
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/1. REST API Design.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `API`, `REST`, `Idempotency`, `HTTP`
- 💡 **Tóm tắt chuyên đề**: Thiết kế RESTful API chuẩn mực công nghiệp, giải quyết triệt để vấn đề duplicate request bằng Idempotency Keys và phân trang chịu tải lớn.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Chuẩn hóa HTTP Status Codes: Phân biệt 400 Bad Request, 422 Unprocessable Entity, 409 Conflict, 429 Too Many Requests.
  + Chuẩn hóa định dạng lỗi theo RFC 7807 (Problem Details for HTTP APIs): type, title, status, detail, instance, invalid_params.
  + Idempotency Key Mechanism: Lưu trữ khóa Idempotency (UUID v4) trong Redis kèm TTL, cơ chế Lock + Save Result để chống Double Charge khi user bấm thanh toán 2 lần hoặc mạng chập chờn.
  + Pagination Strategies: Phân tích sâu Offset-based pagination (`OFFSET N LIMIT M`) gây Full Table Scan và suy giảm hiệu năng nghiêm trọng ở trang sâu ($O(N)$) vs Keyset/Cursor-based pagination (`WHERE id > last_seen_id ORDER BY id LIMIT M`) tận dụng Index B-Tree ($O(\log N)$).
  + API Versioning: URI Path versioning (`/v1/users`), Header versioning (`Accept: application/vnd.app.v1+json`), Query param versioning.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Double Payment / Duplicate Order do network retry tự động từ client.
  + Pagination Offset bị duplicate/skip record khi có bản ghi mới chèn vào giữa lúc user đang lướt trang.
  + API response lộn xộn, thiếu cấu trúc thống nhất giữa các team microservice.
- 📦 **Thực hành / Artifacts liên quan**: summaries/01-rest-api-design.md, reports/advanced_backend/idempotency_architecture_guide.html

#### Bài 02: Caching Design & 4 Production Anomalies
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/2. Caching Design.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Cache`, `Redis`, `High-Load`, `Performance`
- 💡 **Tóm tắt chuyên đề**: Nắm vững các mẫu kiến trúc Caching và giải quyết 4 hiện tượng dị thường kinh điển làm sập database trong hệ thống High-Traffic.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Mẫu kiến trúc Caching: Cache-Aside (Lazy Loading), Read-Through, Write-Through, Write-Behind (Write-Back). Phân tích chi tiết latency và durability trade-offs.
  + Cache Stampede / Breakdown: Xảy ra khi một Hot Key hết hạn đúng lúc hàng ngàn requests cùng ập tới. Giải pháp: Mutex Lock hoặc Singleflight Pattern (gom tất cả concurrent requests cùng key thành 1 request duy nhất vào DB).
  + Cache Avalanche (Tuyết lở): Xảy ra khi hàng triệu keys cùng hết hạn tại một thời điểm, khiến toàn bộ traffic đổ ập vào DB. Giải pháp: Random TTL Jitter (`TTL = base_ttl + rand(0, jitter)`).
  + Cache Penetration: Client cố tình truy vấn các keys không hề tồn tại trong DB, làm request luôn xuyên thủng cache xuống đĩa. Giải pháp: Null Object Cache (cache key rỗng với TTL ngắn) kết hợp Bloom Filter xác suất.
  + Race Condition khi cập nhật Cache: Phân tích tại sao phải 'XÓA CACHE' thay vì 'CẬP NHẬT CACHE'. So sánh 'Xóa trước khi ghi DB' vs 'Xóa sau khi ghi DB' (Cache-Aside chuẩn: Ghi DB trước, sau đó xóa Cache).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Database CPU 100% khi một banner Flash Sale hoặc sản phẩm hot vừa hết hạn cache.
  + Dữ liệu hiển thị trên Cache bị lệch pha (stale data) vĩnh viễn so với Database sau các cập nhật đồng thời.
  + Hacker dò quét ID không tồn tại làm nghẽn DB Disk I/O.
- 📦 **Thực hành / Artifacts liên quan**: labs/lesson-02-caching/ (6 runnable ESM labs), reports/advanced_backend/lesson_02_caching_teacher_guide.html

#### Bài 03: Database Index Internals & Query Optimization
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/3. Index.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Database`, `PostgreSQL`, `Index`, `B-Tree`, `Explain`
- 💡 **Tóm tắt chuyên đề**: Giải mã cấu trúc bên trong của PostgreSQL/MySQL: B-Tree, Heap Tuples, TID, cơ chế HOT update và kỹ thuật đọc EXPLAIN (ANALYZE, BUFFERS).
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Cấu trúc B-Tree & B+Tree: Node nội bộ (Internal nodes), Node lá (Leaf nodes) chứa con trỏ TID `(page_id, tuple_index)`, chiều cao cây B-Tree (thường 3-4 tầng cho hàng chục triệu bản ghi).
  + Heap File & Tuple Storage: Cơ chế tổ chức Page 8KB trong PostgreSQL, ItemPointer, Heap Fragmentation.
  + HOT Updates (Heap-Only Tuple): Cơ chế cập nhật bản ghi mà không cần cập nhật lại B-Tree Index nếu page còn trống và không sửa cột indexed.
  + Composite Index (Chỉ mục kết hợp): Quy tắc tiền tố bên trái (Left-Prefix Rule), thứ tự cột trong index `(A, B, C)` và tại sao `WHERE B = 1` không dùng được index.
  + Covering Index & Mệnh đề `INCLUDE`: Biến câu truy vấn thành Index-Only Scan, loại bỏ hoàn toàn chi phí Heap Fetches (đọc ngẫu nhiên trên đĩa).
  + Index Bloat & Bảo trì: Hiện tượng phình to index do UPDATE/DELETE liên tục, kỹ thuật đo đạc bloat và chạy `REINDEX CONCURRENTLY` không khóa bảng.
  + Đọc hiểu kế hoạch thực thi: Phân biệt Seq Scan vs Index Scan vs Index Only Scan vs Bitmap Index Scan; đo lường số `Buffers: shared hit, read, dirtied`.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Query chạy mất 15-30 giây trên bảng hàng chục triệu dòng -> tối ưu xuống < 2ms.
  + Index phình to gấp 3 lần kích thước dữ liệu thực tế gây tốn RAM Buffer Pool.
  + Hiện tượng Write Amplification làm chậm câu lệnh INSERT/UPDATE khi bảng bị đánh quá nhiều index dư thừa.
- 📦 **Thực hành / Artifacts liên quan**: labs/lesson-03-index/ (11 runnable ESM labs), reports/advanced_backend/lesson_03_index_teacher_guide.html

#### Bài 04: Codebase Structure & Clean Architecture
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/4. Codebase Structure.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Architecture`, `Clean Arch`, `DDD`, `Design Patterns`
- 💡 **Tóm tắt chuyên đề**: Tổ chức kiến trúc phần mềm backend quy mô lớn theo Clean Architecture, Hexagonal (Ports & Adapters) và tư duy Domain-Driven Design (DDD).
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Sự tiến hóa kiến trúc: Spagetti -> MVC / Layered Architecture -> Hexagonal Architecture -> Clean Architecture.
  + Quy tắc phụ thuộc (The Dependency Rule): Chiều phụ thuộc luôn hướng vào trong (Inward). Tầng Domain/Use Case không được phép biết bất kỳ chi tiết nào về Framework, HTTP, SQL hay External APIs.
  + Domain-Driven Design (DDD) Core Building Blocks: Entities (có danh tính), Value Objects (bất biến, định danh bằng giá trị), Aggregates & Aggregate Root (đảm bảo tính toàn vẹn nghiệp vụ), Repositories (Ports), Domain Services.
  + Dependency Inversion Principle (DIP): Sử dụng Interfaces/Ports ở tầng lõi và Adapters ở tầng hạ tầng (Infrastructure) để dễ dàng thay thế database, message queue hoặc viết unit tests mà không cần mock phức tạp.
  + Tổ chức thư mục chuẩn dự án: Phân chia theo Layered vs Screaming Architecture (Package by Feature / Domain).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Mã nguồn biến thành 'Big Ball of Mud' sau 1 năm phát triển, sửa chỗ này hỏng chỗ kia.
  + Business logic bị trộn lẫn trực tiếp trong Controller hoặc SQL queries, không thể viết Unit Test.
  + Ràng buộc chặt chẽ vào một framework hoặc database cụ thể khiến việc refactor hoặc nâng cấp là bất khả thi.
- 📦 **Thực hành / Artifacts liên quan**: Cấu trúc thư mục chuẩn áp dụng cho các labs và dự án tích hợp.

#### Bài 05: Computer Networking for Backend Engineers
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/5. Networking.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Network`, `TCP/IP`, `HTTP2`, `QUIC`, `WebSocket`
- 💡 **Tóm tắt chuyên đề**: Nắm vững bản chất mạng từ tầng transport đến application: TCP Handshake, Socket buffers, TLS 1.3, HTTP/1.1 vs HTTP/2 vs HTTP/3 và WebSocket.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Mô hình OSI 7 tầng vs TCP/IP 4 tầng: Phân tích đường đi của gói tin từ Application Layer xuống Physical NIC.
  + Cơ chế TCP Deep Dive: TCP 3-Way Handshake (SYN, SYN-ACK, ACK), 4-Way Teardown (FIN, ACK, TIME_WAIT socket exhaustion), Flow Control (Sliding Window), Congestion Control (Slow Start, Congestion Avoidance, Fast Retransmit).
  + TLS 1.3 Handshake: Giảm latency từ 2-RTT (TLS 1.2) xuống 1-RTT và 0-RTT Session Resumption thông qua Diffie-Hellman Key Exchange.
  + DNS Resolution Flow: Recursive Resolver -> Root Server -> TLD Server -> Authoritative Server, DNS Caching và TTL tuning.
  + So sánh các thế hệ HTTP: HTTP/1.1 (Persistent Connections, Pipeling, Head-of-Line Blocking ở tầng HTTP) vs HTTP/2 (Multiplexing trên 1 TCP connection, Binary framing, HPACK header compression) vs HTTP/3 (Chạy trên UDP với giao thức QUIC, giải quyết triệt để TCP Head-of-Line Blocking khi rớt gói mạng).
  + WebSocket Internals: HTTP Upgrade Handshake, Persistent Full-Duplex Framing qua TCP.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Sập server do hết cổng kết nối (Port/Socket Exhaustion) khi đóng mở kết nối TCP liên tục.
  + Độ trễ request cao ở môi trường mobile mạng yếu do TCP Head-of-Line Blocking.
  + Lựa chọn giao thức phù hợp cho Realtime vs REST vs File Streaming.
- 📦 **Thực hành / Artifacts liên quan**: Tài liệu chuyên sâu kèm phân tích Wireshark và socket state.

#### Bài 06: Redis Mastery & Memory Internals
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/6. Redis.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Redis`, `Memory`, `Event Loop`, `Distributed Lock`, `Streams`
- 💡 **Tóm tắt chuyên đề**: Mô hình Single-Threaded I/O Multiplexing, các cấu trúc dữ liệu tầng thấp, cơ chế lưu trữ đĩa RDB/AOF và khóa phân tán Redlock.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Mô hình hoạt động: Single-threaded Execution Engine kết hợp Non-blocking Socket I/O Multiplexing (epoll/kqueue). Tại sao Redis đơn luồng nhưng xử lý được 100k+ QPS?
  + Cấu trúc dữ liệu nội tại (Data Structures Encoding): Strings (SDS - Simple Dynamic String), Hashes (ziplist -> hashtable), Lists (quicklist), Sets (intset -> hashtable), Sorted Sets (ziplist -> skiplist kết hợp dict O(log N)).
  + Cơ chế bền vững dữ liệu: RDB (Snapshot qua `bgsave` fork process) vs AOF (Append-Only File với các chế độ `fsync: always, everysec, no`), AOF Rewrite.
  + Khóa phân tán (Distributed Lock): Lệnh `SET resource_name my_random_value NX PX 30000`, giải phóng khóa an toàn bằng Lua Script (nguyên tử), phân tích thuật toán Redlock trên multi-node.
  + Redis Pub/Sub vs Redis Streams: Phân biệt Pub/Sub (fire-and-forget, không lưu trữ, không scale consumer) vs Redis Streams (lưu trữ message log, ACK, Consumer Groups tương tự Kafka thu nhỏ).
  + Memory Eviction Policies: Noeviction, Allkeys-LRU, Volatile-LRU, Allkeys-LFU, Volatile-TTL.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Redis bị block toàn bộ server do chạy các lệnh nguy hiểm $O(N)$ như `KEYS *` hoặc serialization quá lớn.
  + Mất dữ liệu khi Redis server khởi động lại do cấu hình RDB/AOF sai cách.
  + Race condition khi chạy cron job hoặc trừ tiền trong môi trường nhiều server chạy song song.
- 📦 **Thực hành / Artifacts liên quan**: labs/lesson-02-caching/06-*.mjs, tài liệu cấu hình production.

#### Bài 07: Data Modeling & Relational Schema Design
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/7. Data Modeling.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Database`, `Data Modeling`, `Normalization`, `Schema`
- 💡 **Tóm tắt chuyên đề**: Quy chuẩn thiết kế CSDL quan hệ: Chuẩn hóa 1NF-3NF vs Phi chuẩn hóa (Denormalization), mô hình hóa E-Commerce, Ledger và quan hệ đa hình.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Lý thuyết chuẩn hóa: 1NF (Nguyên tử hóa giá trị), 2NF (Loại bỏ phụ thuộc một phần vào PK), 3NF (Loại bỏ phụ thuộc bắc cầu - Transitive Dependency).
  + Nghệ thuật Phi chuẩn hóa (Denormalization): Khi nào nên chấp nhận dư thừa dữ liệu (redundancy) để tránh các phép `JOIN` 5-6 bảng tốn kém trong hệ thống Read-Heavy.
  + Thiết kế mô hình thực tế: E-Commerce Schema (Orders, Order_Items, Inventory, Payments), Financial Ledger (Sổ cái kế toán Double-Entry Bookkeeping bất biến, Debit = Credit), Audit Logging.
  + Mô hình hóa quan hệ đa hình (Polymorphic Relationships): So sánh 3 cách tiếp cận (Single Table with Type column, Concrete Table Inheritance, Delegated Table với Foreign Key linh hoạt).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Schema thiết kế sai dẫn tới dữ liệu không nhất quán (Anomaly on Insert, Update, Delete).
  + Sai lệch tiền trong hệ thống tài chính/ví điện tử do không dùng mô hình Sổ cái kép (Double-Entry).
  + Truy vấn chậm do cấu trúc bảng phân mảnh quá mức.
- 📦 **Thực hành / Artifacts liên quan**: Tài liệu thiết kế ERD chuẩn và DDL script mẫu.

#### Bài 08: Application Security & OWASP Top 10
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/8. Security.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Security`, `OWASP`, `Auth`, `JWT`, `Bcrypt`
- 💡 **Tóm tắt chuyên đề**: Bảo mật hệ thống Backend toàn diện: CIA Triad, phòng chống các lỗ hổng OWASP Top 10, Stateful Session vs Stateless JWT và mã hóa an toàn.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Mô hình an ninh thông tin CIA Triad: Confidentiality, Integrity, Availability.
  + Phòng thủ OWASP Top 10: SQL Injection (Parameterized queries/Prepared statements), Cross-Site Scripting (XSS - Content Security Policy, sanitize input), Cross-Site Request Forgery (CSRF - SameSite cookies, CSRF tokens), SSRF (Server-Side Request Forgery - Whitelist IP/Domain), IDOR / BOLA (Insecure Direct Object References - kiểm tra ownership trên mọi query).
  + Authentication & Authorization: Phân biệt Stateful Session (Session ID lưu trong Redis/DB) vs Stateless JWT (Access Token thời gian ngắn + Refresh Token Rotation lưu an toàn).
  + Mã hóa mật khẩu: Tại sao KHÔNG dùng MD5, SHA-256? Cơ chế Salt và các thuật toán Adaptive KDF (Key Derivation Function): Bcrypt (work factor), Argon2id (chống tấn công bằng GPU/ASIC).
  + Mô hình phân quyền: RBAC (Role-Based Access Control) vs ABAC (Attribute-Based Access Control).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Hacker khai thác SQL Injection để dump toàn bộ cơ sở dữ liệu khách hàng.
  + Lỗ hổng IDOR cho phép user A đổi ID trên URL để đọc hóa đơn hoặc trừ tiền của user B.
  + Mất tài khoản do đánh cắp JWT Token mà không có cơ chế thu hồi (Revocation list / Token rotation).
- 📦 **Thực hành / Artifacts liên quan**: Security checklist và bộ quy chuẩn code review an ninh.

#### Bài 10: Index 01: Advanced Indexing & Specialized Engines
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/10. Index 01.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Database`, `Index`, `GIN`, `GiST`, `BRIN`, `FullText`
- 💡 **Tóm tắt chuyên đề**: Mở rộng chuyên sâu về các loại index đặc thù trong PostgreSQL ngoài B-Tree: GIN Index cho JSONB/Full-text, GiST cho tọa độ không gian và BRIN cho Time-series.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Bản chất các loại Index chuyên dụng trong PostgreSQL:
  + GIN Index (Generalized Inverted Index): Chỉ mục đảo ngược, tối ưu vượt trội cho tìm kiếm mảng (Arrays), tài liệu JSONB và Full-Text Search.
  + GiST Index (Generalized Search Tree): Cấu trúc cây tìm kiếm tổng quát, ứng dụng cho dữ liệu địa lý không gian (PostGIS), hình học và khoảng thời gian (Range types).
  + BRIN Index (Block Range Index): Chỉ lưu giá trị Min-Max cho từng block trang dữ liệu (vd: 128 trang một block). Dung lượng index siêu nhỏ (vài chục KB cho hàng trăm triệu dòng), hoàn hảo cho bảng Time-series sắp xếp tuần tự theo ngày tháng.
  + Partial Index (Chỉ mục một phần): `CREATE INDEX ... WHERE status = 'PENDING'` - tiết kiệm 90% dung lượng RAM và tăng tốc vượt bậc cho dữ liệu phân bố lệch (skewed data).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Tìm kiếm trong cột JSONB hoặc Full-Text search bị chậm kinh hoàng do dùng sai B-Tree thông thường.
  + Bảng Log/Giao dịch Time-series hàng tỷ dòng bị cạn kiệt RAM do B-Tree index quá khổng lồ -> giải quyết triệt để bằng BRIN Index.
- 📦 **Thực hành / Artifacts liên quan**: Được tích hợp cùng 11 Labs Index của Lesson 03.

#### Bài 11: Regular Expression Engine & ReDoS Vulnerability
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/11. Regex.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Regex`, `ReDoS`, `Engine`, `DFA`, `NFA`
- 💡 **Tóm tắt chuyên đề**: Cơ chế hoạt động bên trong của Regex Engines (DFA vs NFA), kỹ thuật Regex nâng cao và cách phòng chống thảm họa Catastrophic Backtracking làm treo CPU 100%.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Lý thuyết Automata: Phân biệt DFA (Deterministic Finite Automaton - $O(N)$ thời gian, không hỗ trợ backreferences) vs NFA (Non-deterministic Finite Automaton - hỗ trợ tính năng phong phú nhưng có nguy cơ backtracking).
  + Phân tích Quantifiers: Greedy (`*`, `+`), Lazy / Reluctant (`*?`, `+?`), Possessive (`*+`, `++` - cấm quay lui).
  + Assertions: Lookahead (`(?=...)`, `(?!...)`) và Lookbehind (`(?<=...)`, `(?<!...)`).
  + Thảm họa Catastrophic Backtracking (ReDoS): Phân tích chi tiết biểu thức `(a+)+$` với chuỗi đầu vào `aaaaaaaaaaaaaaaaaaaaX`. Số lượng bước backtracking tăng theo cấp số nhân $O(2^N)$, làm một thread CPU chạy mất hàng giờ cho một chuỗi 30 ký tự.
  + Quy tắc viết Regex an toàn: Tránh lồng các quantifiers (Nested quantifiers), sử dụng Timeout cho Regex engine, dùng Atomic Groups hoặc Possessive Quantifiers.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Server Node.js / Go / Java bị treo đơ hoàn toàn (Event Loop blocked / CPU 100%) khi user submit email hoặc input độc hại.
  + Tấn công từ chối dịch vụ ReDoS đánh sập API Gateway chỉ bằng một request vài chục byte.
- 📦 **Thực hành / Artifacts liên quan**: Regex safety testing guidelines và benchmark scripts.

#### Bài 12: Database Transaction, ACID & MVCC Internals
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/12. Transaction.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Database`, `ACID`, `MVCC`, `PostgreSQL`, `InnoDB`, `WAL`
- 💡 **Tóm tắt chuyên đề**: Bản chất tầng sâu của giao dịch cơ sở dữ liệu: 4 thuộc tính ACID, Write-Ahead Logging (WAL), 4 cấp độ cô lập và cơ chế MVCC trong PostgreSQL & MySQL.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Bản chất 4 thuộc tính ACID: Atomicity (Tính nguyên tử), Consistency (Tính nhất quán theo ràng buộc), Isolation (Tính cô lập), Durability (Tính bền vững sau commit).
  + Cơ chế Write-Ahead Logging (WAL) & Crash Recovery: Tại sao database ghi tuần tự vào WAL trước khi ghi ngẫu nhiên vào Data File? Checkpointing, Buffer Pool Flusher.
  + 4 cấp độ cô lập ANSI SQL: Read Uncommitted, Read Committed, Repeatable Read, Serializable.
  + 4 hiện tượng dị thường dữ liệu: Dirty Read (Đọc dữ liệu chưa commit), Non-repeatable Read (Đọc lại thấy dữ liệu bị sửa), Phantom Read (Đọc lại thấy xuất hiện dòng mới), Write Skew (Lệch ghi trong Repeatable Read).
  + Cơ chế MVCC (Multi-Version Concurrency Control):
  + - Trong PostgreSQL: Mỗi tuple lưu metadata `xmin` (ID transaction chèn), `xmax` (ID transaction xóa/sửa). Ghi không khóa đọc, đọc không khóa ghi. Xử lý Tuple Bloat và cơ chế dọn dẹp bằng VACUUM / Autovacuum.
  + - Trong MySQL InnoDB: Sử dụng Undo Log kết hợp Read View để tái tạo lại trạng thái dữ liệu trong quá khứ.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Dữ liệu tài khoản bị lệch hoặc âm tiền do các giao dịch ghi đè lẫn nhau.
  + Hiện tượng Transactional Deadlock và nghẽn hàng đợi kết nối DB.
  + Bảng phình to không giải phóng được dung lượng đĩa do Dead Tuples không được VACUUM.
- 📦 **Thực hành / Artifacts liên quan**: Tài liệu mô phỏng 4 cấp độ cô lập và cơ chế xmin/xmax.

#### Bài 13: Clean Code, Refactoring & Senior Code Review
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/13. Clean Code.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Clean Code`, `SOLID`, `Refactoring`, `Code Review`
- 💡 **Tóm tắt chuyên đề**: Nghệ thuật viết code sạch, phát hiện Code Smells, áp dụng nguyên lý SOLID vào thực tế và thiết lập quy trình Code Review chuẩn mực.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Hệ thống nguyên lý SOLID thực chiến: Single Responsibility (Một lý do duy nhất để thay đổi), Open/Closed (Mở rộng bằng đa hình, đóng sửa đổi), Liskov Substitution (Lớp con thay thế hoàn hảo lớp cha), Interface Segregation (Tách nhỏ interface), Dependency Inversion.
  + Các nguyên lý bổ trợ: DRY (Don't Repeat Yourself), KISS (Keep It Simple, Stupid), YAGNI (You Aren't Gonna Need It), Boy Scout Rule (Để lại khu trại sạch hơn khi đến).
  + Xử lý lỗi hiện đại: Sử dụng Exception hoặc Result Pattern (`Result<T, E>`) thay vì return `null` hoặc magic error numbers (-1, 0).
  + Nhận diện và dọn dẹp Code Smells: Long Method, Large Class, Primitive Obsession, Feature Envy, Switch Statements lạm dụng.
  + Senior Code Review Rubrics: Kiểm tra tính đúng đắn (Correctness), Biên độ chịu tải (Edge cases), An toàn dữ liệu, Bảo mật và Khả năng bảo trì sau 6 tháng.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Mã nguồn khó đọc, mất hàng tuần để onboard thành viên mới.
  + Các lỗi tiềm ẩn như Unhandled Promise Rejection, Null Pointer Exception lọt vào production.
  + Tranh cãi không hồi kết trong Pull Requests do thiếu tiêu chí review thống nhất.
- 📦 **Thực hành / Artifacts liên quan**: Code review rubric checklist và guideline tiêu chuẩn kỹ sư Senior.

#### Bài 14: Database Locking & Concurrency Control
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/14. Locking.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Database`, `Locking`, `Concurrency`, `Deadlock`, `InnoDB`
- 💡 **Tóm tắt chuyên đề**: Giải mã chi tiết cơ chế khóa trong RDBMS: Shared vs Exclusive Lock, Intent Locks, Record/Gap/Next-Key Locks, Optimistic vs Pessimistic Locking và giải quyết Deadlock.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Phân loại khóa cơ bản: Shared Lock (S Lock - Cho phép đọc đồng thời, chặn ghi) vs Exclusive Lock (X Lock - Độc quyền ghi, chặn cả đọc và ghi).
  + Intent Locks (IS, IX): Khóa ý định ở cấp độ bảng, giúp Database Engine kiểm tra nhanh có dòng nào bị khóa mà không cần quét toàn bộ bảng.
  + Cơ chế khóa trong MySQL InnoDB:
  + - Record Lock: Khóa trực tiếp trên chỉ mục B-Tree.
  + - Gap Lock: Khóa khoảng trống giữa các chỉ mục để chống triệt để Phantom Read trong Repeatable Read.
  + - Next-Key Lock: Kết hợp giữa Record Lock và Gap Lock `(A, B]`. Nguy cơ Deadlock tiềm ẩn khi các transaction khóa các gap chéo nhau.
  + Xử lý Concurrency thực chiến:
  + - Optimistic Locking: Sử dụng cột `version` hoặc `updated_at`. Thích hợp cho Read-heavy, ít xung đột ghi (`UPDATE ... SET balance = balance - 10, version = version + 1 WHERE id = 1 AND version = current_version`).
  + - Pessimistic Locking: Sử dụng `SELECT ... FOR UPDATE`, `SKIP LOCKED` (hoàn hảo cho Message Queue / Job processing worker) và `NOWAIT`.
  + Deadlock Detection: Wait-for Graph, nguyên tắc sắp xếp thứ tự cập nhật tài nguyên (Resource Ordering) để triệt tiêu hoàn toàn Deadlock.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Tranh chấp bán vé / voucher / hàng tồn kho (Flash Sale overselling) khi hàng ngàn khách cùng checkout một sản phẩm.
  + Ứng dụng bị treo cứng (Deadlock cascade) làm cạn kiệt Database Connection Pool.
- 📦 **Thực hành / Artifacts liên quan**: Tài liệu phân tích ma trận tương thích khóa và mô phỏng Deadlock.

#### Bài 15: Operating System Internals for Backend
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/15. Operating System.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `OS`, `Linux`, `Kernel`, `Virtual Memory`, `Zero-Copy`, `I/O`
- 💡 **Tóm tắt chuyên đề**: Bản chất hệ điều hành Linux: Phân biệt User Space vs Kernel Space, System Calls, Quản lý Process/Thread, Bộ nhớ ảo, Paging và các mô hình I/O.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Đặc quyền phần cứng: User Space (Ring 3) vs Kernel Space (Ring 0), Cơ chế chuyển ngữ cảnh (Context Switch) qua System Calls.
  + Process vs Thread: Process Control Block (PCB) vs Thread Control Block (TCB), Chi phí chuyển ngữ cảnh giữa các threads, CPU Scheduling.
  + Bộ nhớ ảo (Virtual Memory Internals): MMU (Memory Management Unit), Page Tables, TLB (Translation Lookaside Buffer), Kích thước Page 4KB, Hiện tượng Page Faults và Swap Memory, Cơ chế Linux OOM Killer (Out-Of-Memory Killer chọn hy sinh process bằng `oom_score`).
  + Các mô hình I/O (I/O Models):
  + 1. Blocking I/O (BIO): Luồng bị treo chờ đến khi có dữ liệu.
  + 2. Non-blocking I/O (NIO): Trả về ngay `EWOULDBLOCK`, ứng dụng phải liên tục thăm dò (Polling tốn CPU).
  + 3. I/O Multiplexing (`select`, `poll`, `epoll` trong Linux, `kqueue` trong BSD/macOS): Đăng ký hàng chục ngàn socket vào một Event Loop duy nhất, kernel đánh thức khi có sự kiện (Nền tảng của Nginx, Node.js, Redis, Netty).
  + 4. Asynchronous I/O (AIO / `io_uring`): Kernel tự động xử lý và báo về khi hoàn tất.
  + Zero-Copy Mechanism: Phân tích đường đi truyền dữ liệu truyền thống (4 lần copy + 4 lần context switch) vs Zero-Copy qua System Call `sendfile` (2 lần context switch, truyền trực tiếp từ OS Page Cache sang Card mạng NIC).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Server bị crash đột ngột do tiến trình Backend bị Linux OOM Killer bắn hạ.
  + Hệ thống đạt ngưỡng bottleneck CPU do tạo quá nhiều OS Threads vượt quá số nhân CPU.
  + Hiểu bản chất tại sao Kafka và Nginx có thể đạt throughput hàng triệu tin nhắn/giây.
- 📦 **Thực hành / Artifacts liên quan**: Tài liệu cơ chế OS kèm các sơ đồ Page Table và I/O Flow.

#### Bài 16: System Integration, Resilience & Heavy Tasks
- 📁 **File tài liệu gốc**: `Tài Liệu/advanced_backend/16. Integration.pdf (.md)`
- 🏷️ **Tags / Chủ đề**: `Integration`, `Resilience`, `Circuit Breaker`, `Webhook`, `Async`
- 💡 **Tóm tắt chuyên đề**: Tích hợp các hệ thống phân tán và dịch vụ bên thứ ba (Cổng thanh toán, Webhook): Xử lý lỗi mạng chập chờn, Circuit Breaker và xử lý tác vụ nặng bất đồng bộ.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Bản chất lỗi mạng bất khả kháng (Transient Faults): Network jitter, Packet loss, Timeout.
  + Chiến lược Retry an toàn: Exponential Backoff kết hợp Full Jitter (`sleep = min(cap, base * 2^attempt) + random_between(0, sleep)`). Tại sao retry không có jitter sẽ biến thành đợt tấn công từ chối dịch vụ (Thundering Herd) đánh sập downstream?
  + Circuit Breaker Pattern: 3 trạng thái Closed (Bình thường), Open (Ngắt mạch ngay lập tức khi tỷ lệ lỗi vượt ngưỡng, bảo vệ hệ thống không bị kiệt quệ tài nguyên), Half-Open (Thử nghiệm cho một lượng nhỏ traffic đi qua để kiểm tra phục hồi).
  + Idempotent Consumer trong tích hợp: Xử lý Webhook thanh toán an toàn, xác thực chữ ký số (HMAC SHA-256), ghi nhận Event ID vào Database trước khi cập nhật đơn hàng.
  + Asynchronous Heavy Export Processing: Tách rời tác vụ xuất báo cáo nặng (Excel hàng triệu dòng) khỏi HTTP Request/Response flow: Tạo Job -> Đưa vào Queue -> Worker xử lý ngầm -> Upload file lên S3 -> Ký Presigned URL -> Gửi Webhook/Email hoặc SSE thông báo cho người dùng.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Hệ thống bị treo cứng toàn bộ các thread do cổng thanh toán bên thứ ba bị chập chờn không trả về response.
  + Hiện tượng lặp đơn hàng, nhân đôi tài khoản khi Webhook từ đối tác retry nhiều lần.
  + Request HTTP bị timeout 504 Gateway Timeout khi user bấm xuất báo cáo doanh thu cả năm.
- 📦 **Thực hành / Artifacts liên quan**: reports/advanced_backend/idempotency_architecture_guide.html, reports/advanced_backend/async_export_architecture_guide.html

---

## 3.2 Khóa 2: System Design Highly Concurrent Systems Cùng Roninhub

> **Giảng viên / Nguồn**: Roninhub (Giảng viên: Ronin Engineer)  
> **Định vị**: *Thiết kế kiến trúc hệ thống quy mô hàng chục triệu người dùng: Ước lượng dung lượng, Phân mảnh CSDL, Caching phân tán, Giao dịch phân tán Saga và Case Studies thực chiến*  
> **Quy mô**: `10 Chuyên Đề | 330+ Trang Slide | 1 Master Reference Book (400 Trang)`

**Mô tả tổng quan**: Khóa học đưa người học bước qua ranh giới từ một lập trình viên single-node sang vai trò Kỹ sư Thiết kế Hệ thống Cấp cao (System Architect). Tập trung giải quyết bài toán tải cao (High Concurrency), tính sẵn sàng cao (High Availability 99.99%), nghệ thuật đánh đổi kiến trúc (Trade-offs), phân rã Microservices, các cấu trúc dữ liệu đặc thù và 2 bài toán lớn kinh điển: URL Shortener & Mạng xã hội Threads.

### Bảng Chi Tiết Từng Bài Giảng & Nội Dung Slide:

#### Bài 01: System Design: In-Depth Understanding & Methodology
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../01. System Design- In-Depth Understanding.pdf`
- 🏷️ **Tags / Chủ đề**: `System Design`, `Mindset`, `Architecture`, `Interview`
- 💡 **Tóm tắt chuyên đề**: Định hình tư duy thiết kế hệ thống chuẩn mực: Phân biệt Architecture vs Design, System Design Phỏng vấn vs System Design Thực tế và Quy trình 4 bước.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Bản chất cốt lõi: System Design = Problem Solving + Computer Science.
  + System Design trong phỏng vấn vs System Design thực tế trong doanh nghiệp: Thực tế phải đối mặt với các ràng buộc khắt khe về chi phí hạ tầng (Cost), thời gian bàn giao (Time), nhân sự (Human resource) và phạm vi ảnh hưởng khi lỗi (Blast Radius).
  + Architecture (Chiến lược cấp cao nhất, Non-functional, Architectural styles, Global) vs Design (Chiến thuật cấp chi tiết, DSA, Localized).
  + Phân loại tri thức: Kiến thức nền tảng (DSA, OS, Network, Concurrency) là bất biến theo thời gian vs Frameworks/Tools chỉ là công cụ bên ngoài.
  + Quy trình 4 bước giải quyết bài toán System Design:
  + 1. Understand the Problem: Làm rõ Functional Requirements, Non-Functional Requirements, Constraints.
  + 2. Capacity Estimation: Tính toán lưu lượng, dung lượng, băng thông.
  + 3. High-Level Design: Sơ đồ khối tổng thể, APIs, Data model.
  + 4. Deep Dive & Bottlenecks: Mổ xẻ từng điểm nghẽn, chiến lược scaling và xử lý sự cố.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Lúng túng không biết bắt đầu từ đâu khi đối mặt với đề bài thiết kế hệ thống mở.
  + Bẫy Over-Engineering: Áp dụng công nghệ phức tạp (Kubernetes, Kafka, Microservices) khi bài toán chỉ cần một monolithic đơn giản.
  + Không nhìn ra các điểm lỗi đơn lẻ (Single Point of Failure - SPOF).
- 📦 **Thực hành / Artifacts liên quan**: Slide 47 trang kèm hệ thống phân loại kiến thức và mindset.

#### Bài 02: Design Principles, Capacity Estimation & Architecture Trade-offs
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../02. Design Principles & Estimation.pdf`
- 🏷️ **Tags / Chủ đề**: `Estimation`, `Trade-Offs`, `CAP`, `High Availability`, `SLA`
- 💡 **Tóm tắt chuyên đề**: Nghệ thuật ước lượng dung lượng (Back-of-the-envelope), phân tích đánh đổi kiến trúc (CAP, PACELC) và phương pháp Separation in Time/Space.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Kỹ thuật Back-of-the-Envelope Estimation:
  + - Traffic Calculation: Chuyển đổi từ DAU (Daily Active Users) sang QPS/TPS trung bình và Peak QPS ($Peak = QPS 	imes 2 \dots 5$). Quy tắc 1 ngày có $10^5$ giây ($86,400$ s).
  + - Storage Estimation: Kích thước 1 bản ghi $	imes$ Số lượt ghi/ngày $	imes$ 365 ngày $	imes$ 5 năm retention.
  + - Memory Cache Estimation: Áp dụng nguyên lý Pareto 80/20 (20% dữ liệu tạo ra 80% truy cập) để tính dung lượng RAM cache trong 1 ngày.
  + - Network Bandwidth: Read QPS $	imes$ Payload Size (Băng thông ra) vs Write TPS $	imes$ Payload Size (Băng thông vào).
  + Nghệ thuật Trade-Off trong phân tán:
  + - Định lý CAP (Consistency, Availability, Partition Tolerance): Bắt buộc phải chọn CP hoặc AP khi xảy ra Network Partition.
  + - Định lý PACELC: Nếu có Partition (P) chọn Availability (A) hay Consistency (C); Else (E) chọn Latency (L) hay Consistency (C).
  + - Kỹ thuật giải quyết Trade-Off:
  + + Separation in Time (Tách biệt theo thời gian): Tách luồng ghi đồng bộ sang xử lý hàng đợi bất đồng bộ.
  + + Separation in Space (Tách biệt theo không gian): Tách biệt CQRS (Command side tối ưu ghi, Query side tối ưu đọc), Microservices, Sidecar Pattern.
  + Các chỉ số sẵn sàng cao: SLA 99.9% (cho phép sập 8.76 giờ/năm) vs 99.99% (cho phép sập 52.6 phút/năm), MTBF (Mean Time Between Failures), MTTR (Mean Time To Repair).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Hạ tầng bị mua thừa thãi gây lãng phí hàng ngàn USD hoặc mua thiếu gây sập hệ thống ngay ngày khai trương.
  + Hiểu rõ khi nào hệ thống bắt buộc phải hy sinh tính nhất quán tức thì (Strong Consistency) để lấy độ trễ thấp (Eventual Consistency).
- 📦 **Thực hành / Artifacts liên quan**: Bộ công thức ước lượng chuẩn và bài tập tính toán dung lượng cho URL Shortener.

#### Bài 03: Database Scaling: Partitioning, Sharding & DB Selection
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../03. Database.pdf`
- 🏷️ **Tags / Chủ đề**: `Database`, `Scaling`, `Sharding`, `Partitioning`, `NoSQL`
- 💡 **Tóm tắt chuyên đề**: Vượt qua giới hạn của Single DB: Kỹ thuật phân vùng Partitioning, Sharding ngang, chọn Partition Key chống Hotspot và ma trận chọn CSDL.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Giới hạn của một Single Database Node: Ngưỡng chịu tải tối đa khoảng ~20k QPS (tùy phần cứng), giới hạn TPS theo chuẩn TPC-C, nghẽn I/O disk và lock contention.
  + Cách tiếp cận từng bước khi bảng dữ liệu phình to (Big Table): Đánh giá access patterns trước -> Tối ưu Index -> Lưu trữ lạnh (Archive) -> Phân vùng (Partitioning) -> Sharding đa máy chủ.
  + Kỹ thuật phân vùng dữ liệu:
  + - Range Partitioning: Phân vùng theo dải (vd: theo tháng, năm, ID range). Đơn giản, dễ dọn dữ liệu cũ (`DROP PARTITION`), nhưng dễ bị Hotspot ở partition mới nhất.
  + - Hash Partitioning: Phân vùng theo hàm băm (`hash(key) % N`). Dữ liệu phân bổ đều tăm tắp, nhưng truy vấn theo khoảng (Range query) bắt buộc phải quét toàn bộ các partitions (Scatter-Gather penalty).
  + Tiêu chuẩn chọn Partition Key / Shard Key hoàn hảo: Phân bổ dữ liệu đồng đều, phân bổ lưu lượng truy cập đồng đều, bao hàm các truy vấn phổ biến nhất (tránh Cross-shard joins).
  + Case studies thực tế: Chọn Partition Key cho bảng Order trong E-Commerce, bảng Transaction trong Cổng thanh toán.
  + Ma trận lựa chọn CSDL: RDBMS (Postgres, MySQL - ACID, quan hệ phức tạp) vs NoSQL Key-Value (Redis, DynamoDB - siêu nhanh, tra cứu đơn giản) vs Document (MongoDB - schema linh hoạt) vs Wide-Column (Cassandra, ScyllaDB - ghi cực lớn, time-series) vs Search Engine (Elasticsearch - full-text search).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Bảng đạt 100 triệu dòng bắt đầu bị chậm toàn diện câu lệnh INSERT và SELECT.
  + Một partition bị quá tải cháy đĩa (Hotspot) trong khi các partition khác rảnh rỗi do chọn sai partition key.
  + Dùng nhầm CSDL quan hệ cho bài toán lưu log telemetry hoặc dùng nhầm MongoDB cho bài toán sổ cái kế toán.
- 📦 **Thực hành / Artifacts liên quan**: Slide 45 trang kèm các mô hình phân vùng và ví dụ chi tiết.

#### Bài 04: Caching at Scale & 5 Rate Limiting Algorithms
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../04. Caching.pdf`
- 🏷️ **Tags / Chủ đề**: `Cache`, `Rate Limiting`, `Redis Cluster`, `Token Bucket`, `Leaky Bucket`
- 💡 **Tóm tắt chuyên đề**: Chiến lược phân tầng Caching trong hệ thống lớn, cấu trúc Redis Cluster 16,384 Hash Slots và 5 thuật toán Rate Limiting kinh điển.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Các tầng Caching trong kiến trúc tổng thể: Client Browser Cache -> CDN Edge Cache -> Reverse Proxy Cache (Nginx) -> Application Local Cache (In-process memory) -> Distributed Cache (Redis) -> Database Buffer Pool.
  + Redis Cluster Architecture: Năng lực xử lý một node (~50k TPS write, ~80k QPS read). Phân tán dữ liệu qua 16,384 Hash Slots (`CRC16(key) % 16384`), cơ chế Master-Replica tự động Failover.
  + 5 Thuật toán Rate Limiting chuyên sâu:
  + 1. Fixed Window Counter: Đếm số request trong một khung thời gian cố định. Đơn giản nhưng có lỗ hổng Traffic Burst ở ranh giới giữa 2 windows (lưu lượng thực tế gấp đôi limit).
  + 2. Sliding Window Log: Lưu timestamp của từng request vào Redis Sorted Set. Chính xác tuyệt đối 100% nhưng ngốn RAM khủng khiếp.
  + 3. Sliding Window Counter: Kết hợp Fixed Window và tỷ trọng thời gian của window trước. Cân bằng hoàn hảo giữa độ chính xác và dung lượng bộ nhớ.
  + 4. Leaky Bucket: Nước chảy vào xô với tốc độ tùy ý, nhưng rò rỉ ra đáy xô với tốc độ cố định. Triển khai bằng Message Queue, giúp san phẳng lưu lượng bảo vệ downstream.
  + 5. Token Bucket: Bơm token vào xô theo tốc độ cố định, request cần lấy token để đi tiếp. Cho phép một lượng burst ngắn, thuật toán phổ biến nhất trong các API Gateway hiện đại.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Server bị sập vì các cuộc tấn công DDoS hoặc bot cào dữ liệu (Spam scraping).
  + Bị nghẽn Redis khi một node duy nhất không đủ RAM chứa hàng chục triệu keys -> chuyển đổi sang Redis Cluster.
  + Hệ thống downstream (Payment, SMS) bị quá tải khi traffic đầu vào ùa tới bất thường.
- 📦 **Thực hành / Artifacts liên quan**: Slide 39 trang kèm so sánh ưu nhược điểm 5 thuật toán Rate Limiting.

#### Bài 05: Communication Protocols: Sync, Async & Realtime
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../05. Communication.pdf`
- 🏷️ **Tags / Chủ đề**: `Communication`, `gRPC`, `WebSocket`, `SSE`, `Reactor`, `QUIC`
- 💡 **Tóm tắt chuyên đề**: Lựa chọn phương thức giao tiếp giữa các services: Synchronous vs Asynchronous, REST vs gRPC over HTTP/2, WebSocket vs SSE và mô hình Network I/O Reactor.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Các yếu tố cần cân nhắc khi chọn phương thức giao tiếp: Delivery Guarantee, Schema Compatibility, Performance & Latency, Error Handling, Security.
  + Mô hình xử lý luồng mạng (Threading Patterns): Traditional Thread-per-request (BIO - ngốn RAM, nghẽn thread pool) vs Reactor Pattern / Actor Model (NIO/Event-Driven tách biệt I/O bound và CPU bound - Netty, Nginx).
  + Giao tiếp BE-to-BE:
  + - Synchronous: RESTful HTTP/1.1 vs gRPC (chạy trên HTTP/2, Protobuf nhị phân, streaming 2 chiều, typed contract chặt chẽ, latency thấp hơn 5-10 lần).
  + - Asynchronous: Message Broker (Kafka vs RabbitMQ).
  + Giao tiếp FE-to-BE:
  + - Short Polling vs Long Polling (giữ kết nối đến khi có tin).
  + - Server-Sent Events (SSE): Kết nối 1 chiều từ server xuống client qua HTTP tiêu chuẩn, nhẹ, tự động reconnect, hoàn hảo cho Live Ticker, Notifications, AI Streaming response.
  + - WebSocket: Kết nối 2 chiều (Full-Duplex) liên tục qua TCP, phù hợp cho Chat, Game nhiều người, Bảng giá chứng khoán realtime.
  + - MQTT over QUIC: Giao thức siêu nhẹ trên nền UDP, giải quyết Head-of-Line Blocking trên mạng di động chập chờn.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Độ trễ giao tiếp giữa các microservices quá lớn làm tăng tổng thời gian phản hồi API.
  + Tốn tài nguyên server do client liên tục polling hỏi 'có tin nhắn mới không?'.
  + Mất kết nối realtime liên tục khi người dùng chuyển từ mạng Wi-Fi sang 4G.
- 📦 **Thực hành / Artifacts liên quan**: Slide 31 trang kèm bảng so sánh giao thức và kiến trúc Netty/Reactor.

#### Bài 06: Microservices Decomposition & Distributed Transactions (Saga)
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../06. Microservices.pdf`
- 🏷️ **Tags / Chủ đề**: `Microservices`, `Saga`, `2PC`, `Event Storming`, `Distributed Tx`
- 💡 **Tóm tắt chuyên đề**: Phân chia ranh giới Microservices bằng Bounded Context, giải quyết bài toán giao dịch phân tán: 2PC/XA vs TCC vs Saga Pattern và hiện tượng thiếu tính cô lập.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Xác định ranh giới Microservices (Microservice Boundary): Sử dụng Event Storming và Domain Storytelling để khám phá Subdomains, vẽ Bounded Context Canvas. Quy tắc: Bắt đầu từ Bounded Context -> 1 Microservice -> chỉ tách nhỏ hơn khi thật sự cần thiết.
  + Bài toán Giao dịch phân tán (Distributed Transactions):
  + - Two-Phase Commit (2PC / XA): Phase 1 (Prepare) -> Phase 2 (Commit). Ưu điểm: Đạt Strong Consistency lý thuyết. Nhược điểm: Khóa tài nguyên trong thời gian dài (Heavy lock holding), suy giảm nghiêm trọng TPS, nguy cơ Coordinator chết gây treo toàn bộ hệ thống.
  + - Bậc thang tính nhất quán: 2PC (XA) > AT > TCC (Try-Confirm/Cancel) > 2-Phase Message > Saga.
  + Saga Pattern (Cứu cánh của Microservices):
  + - Bản chất: Chuỗi các local transactions, mỗi local tx cập nhật DB và phát event để kích hoạt bước tiếp theo. Nếu một bước thất bại, kích hoạt chuỗi Giao dịch bù trừ (Compensating Transactions) để hoàn tác.
  + - Saga Orchestration (Bộ điều phối trung tâm): Dễ debug, tập trung state machine, nhưng Coordinator có nguy cơ biến thành God Service.
  + - Saga Choreography (Phi tập trung / Event-driven): Các service tự lắng nghe event của nhau, phân tán cao, loose coupling, nhưng khó debug và theo dõi luồng tổng thể.
  + Hiện tượng thiếu tính cô lập trong Saga (The Lack of Isolation):
  + 1. Lost Updates: Saga hủy đơn hàng chạy đè lên Saga đang tạo đơn hàng.
  + 2. Dirty Read: Service khác đọc phải dữ liệu trung gian của một Saga đang chạy mà sau đó Saga này bị thất bại và rollback.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Không thể duy trì ACID khi mỗi microservice sở hữu một Database riêng biệt.
  + Hệ thống microservices bị 'khóa chết' (Deadlock toàn cục) do dùng 2PC qua mạng.
  + Dữ liệu giữa Service Đơn Hàng và Service Thanh Toán bị lệch pha vĩnh viễn khi có sự cố mạng.
- 📦 **Thực hành / Artifacts liên quan**: Slide 40 trang kèm sơ đồ luồng Saga Choreography và Orchestration.

#### Bài 07: Data Structures & Concurrency Internals (Disruptor)
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../07. DSA.pdf`
- 🏷️ **Tags / Chủ đề**: `DSA`, `Concurrency`, `Disruptor`, `Lock-Free`, `Timers`
- 💡 **Tóm tắt chuyên đề**: Cấu trúc dữ liệu và giải thuật trong hệ thống thực tế: Liveness Timers (Redis Sorted Set vs Hashed Wheel Timer), Hàng đợi đa luồng và LMAX Disruptor Lock-Free Ring Buffer.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Bài toán Quản lý nhịp tim và hết hạn (Liveness System & Timers):
  + - Giải pháp 1: Sử dụng Redis Sorted Set với score là timestamp hết hạn (`ZADD`, `ZRANGEBYSCORE`).
  + - Giải pháp 2 (High scale): Hashed Wheel Timer (Netty-style) - cấu trúc bánh xe băm thời gian với con trỏ quay vòng, giúp kiểm tra và kích hoạt timer trong $O(1)$ mà không cần quét tuần tự toàn bộ danh sách.
  + Lập trình đồng thời & Hàng đợi nội bộ (Concurrent Queue Problem):
  + - Array-based Queue (Kích thước cố định) vs Linked List-based Queue (Không giới hạn nhưng gây phân mảnh bộ nhớ và không tận dụng được CPU L1/L2/L3 Cache).
  + - Hiện tượng False Sharing: Hai biến nằm trên cùng một Cache Line 64 byte của CPU bị hai core ghi đè làm mất hiệu lực cache liên tục.
  + LMAX Disruptor Pattern - Tột đỉnh hiệu năng đa luồng:
  + - Kiến trúc Lock-Free Ring Buffer sử dụng bộ nhớ được cấp phát trước (Zero Garbage Collection).
  + - Sử dụng phép toán nguyên tử CAS (Compare-And-Swap) thay vì Mutex Lock.
  + - Sử dụng Cache Line Padding để triệt tiêu hoàn toàn False Sharing.
  + - Phân tách độc lập hoàn toàn giữa Producer và Consumer qua Sequence Numbers, cho phép xử lý hàng triệu tin nhắn/giây trên một máy đơn.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Server bị nghẽn CPU do tranh chấp khóa (Lock Contention) trong hàng đợi đa luồng truyền thống.
  + Quản lý hàng triệu kết nối WebSocket/IoT bị chậm do chi phí kiểm tra timeout heartbeat.
  + Garbage Collector (GC Pause) làm giật lag hệ thống giao dịch chứng khoán/tài chính.
- 📦 **Thực hành / Artifacts liên quan**: Slide 32 trang kèm cấu trúc bộ nhớ Ring Buffer và giải thuật Hashed Wheel.

#### Bài 08: Case Study 1: URL Shortener System (Bitly Scale)
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../08. URL Shortener.pdf`
- 🏷️ **Tags / Chủ đề**: `Case Study`, `URL Shortener`, `Base62`, `Snowflake`, `KGS`
- 💡 **Tóm tắt chuyên đề**: Toàn bộ quy trình thiết kế hệ thống rút gọn liên kết quy mô 100M writes/ngày: Ước lượng, Base62 Encoding, KGS (Key Generation Service) và chiến lược Redirect Caching.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Phân tích yêu cầu:
  + - Functional: Tạo short link từ long URL, Redirect từ short link về long URL gốc, Tùy chỉnh alias, Thời gian hết hạn.
  + - Non-Functional: Tính sẵn sàng cực cao (99.99%), Latency chuyển hướng siêu thấp (< 10ms), Khả năng chịu tải lớn (Read:Write = 100:1).
  + Tính toán dung lượng thực tế:
  + - Write TPS = 100 TPS, Read QPS = 10,000 QPS (Peak 20,000 QPS).
  + - Lưu trữ: 1 record ~ 1.1 KB $ightarrow$ 5 năm lưu trữ cần ~ 20 TB dung lượng đĩa.
  + - Cache RAM (Pareto 80/20): Cần khoảng ~ 2.2 GB RAM để cache 20% URLs hot nhất mỗi ngày.
  + Kỹ thuật sinh mã ngắn (Short Key Generation):
  + - Độ dài 7 ký tự Base62 (`[a-zA-Z0-9]`) cung cấp $62^7 pprox 3.5$ nghìn tỷ URLs độc nhất.
  + - So sánh các giải pháp: Random ID (dễ va chạm khi bảng lớn), Hash MD5/SHA256 (phải lấy prefix và xử lý collision phức tạp), Distributed Snowflake ID (tăng dần nhưng lộ thông tin kinh doanh), Key Generation Service (KGS - Service sinh trước các token ngẫu nhiên và nạp vào DB/RAM, worker chỉ việc lấy token dùng ngay, loại bỏ 100% nguy cơ va chạm và race condition).
  + Chiến lược HTTP Redirection Caching: 301 Moved Permanently (Browser tự cache chuyển hướng, giảm tải server nhưng không đếm được lượt click analytics) vs 302 Found / 307 Temporary Redirect (Mọi request đều qua server, đo đạc metrics chính xác tuyệt đối).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Xung đột mã ngắn (Hash collision) khi số lượng URLs chạm mốc hàng trăm triệu.
  + Database bị quá tải vì hàng chục ngàn lượt redirect/giây -> giải quyết bằng Redis Cache-aside và HTTP 301/302 hợp lý.
- 📦 **Thực hành / Artifacts liên quan**: Slide 24 trang hướng dẫn từng bước từ estimation đến low-level design.

#### Bài 09: Case Study 2: Microblogging & News Feed System (Threads / Twitter)
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../09. Design a Microblogging System (Threads).pdf`
- 🏷️ **Tags / Chủ đề**: `Case Study`, `News Feed`, `Push vs Pull`, `Celebrity Problem`, `Fan-out`
- 💡 **Tóm tắt chuyên đề**: Thiết kế hệ thống mạng xã hội tương tự Threads/Twitter: Đọc nhiều hơn ghi (100:1), latency < 100ms, mổ xẻ chuyên sâu mô hình Push vs Pull và giải quyết Celebrity Problem.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Phân tích bài toán mạng xã hội:
  + - Functional: Đăng bài (text, ảnh), Follow người dùng khác, Xem trang chủ cá nhân (User Timeline) và Bảng tin tổng hợp (News Feed).
  + - Non-Functional: Read-heavy (100:1), Bảng tin hiển thị cực nhanh (< 100ms), Tính nhất quán cuối cùng (Eventual consistency) là hoàn toàn chấp nhận được.
  + Mô hình dữ liệu (Data Modeling): Bảng User, Post, Follower, Timeline.
  + So sánh chuyên sâu 2 mô hình phân phối Feed:
  + 1. Push Model (Fan-out-on-write): Khi User A đăng bài, hệ thống chủ động đẩy Post ID vào Inbox/Timeline Cache của tất cả những người theo dõi A. Ưu điểm: Đọc feed cực nhanh ($O(1)$ từ cache). Nhược điểm: Celebrity Problem / Hotspot (Nếu một ca sĩ nổi tiếng có 30 triệu followers đăng bài, hệ thống phải thực hiện 30 triệu thao tác ghi vào Redis, gây nghẽn hàng đợi và chậm feed của toàn hệ thống).
  + 2. Pull Model (Fan-out-on-read): Khi User load feed, hệ thống mới truy vấn lấy bài mới nhất của những người mà user đó theo dõi rồi gộp lại (Merge & Sort). Ưu điểm: Đăng bài siêu nhanh ($O(1)$). Nhược điểm: Đọc feed cực kỳ tốn tài nguyên và độ trễ cao nếu follow hàng ngàn người.
  + 3. Hybrid Model (Giải pháp của Twitter / Threads thực tế): Áp dụng Push Model cho 99% người dùng thông thường; Tách riêng các Celebrities (> 50k followers) để dùng Pull Model. Khi user mở app, hệ thống lấy feed đã nung sẵn trong Redis rồi merge động với bài mới của các Celebrities mà họ theo dõi.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Hệ thống bị tê liệt hàng chục phút mỗi khi tài khoản có hàng chục triệu người theo dõi đăng một status mới.
  + News feed tải chậm quá 2-3 giây làm giảm trải nghiệm người dùng.
- 📦 **Thực hành / Artifacts liên quan**: Slide 27 trang với sơ đồ kiến trúc Push/Pull/Hybrid chi tiết.

#### Bài 10: Master Software Architecture: Comprehensive Industry Blueprint
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 3.../master-software-architecture.pdf`
- 🏷️ **Tags / Chủ đề**: `Book`, `Architecture`, `ADR`, `Testing`, `Observability`, `Governance`
- 💡 **Tóm tắt chuyên đề**: Toàn bộ cuốn sách gối đầu giường 400 trang của kiến trúc sư Maciej Jędrzejewski (MJ): 9 bước xây dựng kiến trúc phần mềm từ Monolith đến Cloud-Native.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + 9 Bước chuyển hóa kiến trúc phần mềm trong sách:
  + Step 1: Understand Software Architecture - Phá bỏ định kiến về 'Silver Bullet', kiến trúc là nghệ thuật chọn sự đánh đổi phù hợp với bối cảnh kinh doanh.
  + Step 2: Discover Your Business Domain - Tổ chức hội thảo Event Storming và Domain Storytelling để phân rã nghiệp vụ phức tạp thành Bounded Contexts rõ ràng.
  + Step 3: Recognize the Environment Around You - Đo lường các thuộc tính chất lượng (Quality Attributes: Scalability, Modifiability, Security, Performance).
  + Step 4: Choose Deployment Strategy - Lựa chọn thực dụng giữa Single Deployment Unit (Monolith, Modular Monolith) vs Multiple Deployment Units (Microservices, Event-Driven, Dead Letter Queues).
  + Step 5: Define Release Strategy - CI/CD tự động hóa, Feature Flags, Trunk-Based Development, Triển khai Canary và Blue-Green.
  + Step 6: Focus on Testing - Kim tự tháp kiểm thử (Testing Pyramid), Contract Testing (Pact) và Architecture Fitness Functions (bảo vệ kiến trúc không bị thoái hóa theo thời gian).
  + Step 7: Architecture Decision Log (ADRs) - Quy chuẩn ghi chép quyết định kiến trúc để lưu giữ tri thức cho đội ngũ kỹ sư 5 năm sau.
  + Step 8: Security in Architecture - Supply Chain Attacks, Quản lý Secrets, Bảo vệ thông tin nhạy cảm trong Logs, Phòng vệ chủ động OWASP.
  + Step 9: Observability & Metrics - Logging tập trung, Distributed Tracing (OpenTelemetry), Metrics (Prometheus/Grafana) và 4 chỉ số DORA.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Đội ngũ kỹ sư bị cuốn vào vòng xoáy đập đi xây lại hệ thống sau mỗi 2 năm do kiến trúc ban đầu bị 'thối rữa' (Architectural Decay).
  + Thiếu tài liệu ghi lại lý do tại sao ngày xưa lại chọn thiết kế này (Architecture amnesia).
- 📦 **Thực hành / Artifacts liên quan**: Cuốn sách PDF 400 trang chuẩn xuất bản quốc tế của tác giả Maciej Jędrzejewski.

---

## 3.3 Khóa 3: Kafka Nâng Cao 2025 – Ứng Dụng Trong System Design & Microservices Cùng Roninhub

> **Giảng viên / Nguồn**: Roninhub (Giảng viên: Ronin Engineer)  
> **Định vị**: *Làm chủ nền tảng truyền sự kiện phân tán hàng đầu thế giới: Kafka Internals, Producer Tuning, Consumer Rebalance, Transactional Outbox, Exactly-Once và Luyện thi chứng chỉ Confluent CCDAK*  
> **Quy mô**: `13 Chuyên Đề | 360+ Trang Slide | 150+ Đề Thi CCDAK Thực Chiến`

**Mô tả tổng quan**: Khóa học chuyên sâu đưa bạn từ mức sử dụng Kafka cơ bản trở thành Chuyên gia Kafka (Kafka Master). Mổ xẻ chi tiết cơ chế hạt nhân (Sequential Disk I/O, Page Cache, Zero-Copy), các bài toán khó nhất trong microservices (Dual-Write, Transactional Outbox, Exactly-Once Processing, Partition Rebalance), ca thực chiến Phát hiện gian lận tài chính và bộ đề thi chứng chỉ quốc tế Confluent Certified Developer for Apache Kafka (CCDAK).

### Bảng Chi Tiết Từng Bài Giảng & Nội Dung Slide:

#### Bài 01: Kafka Introduction & Event Streaming Paradigm
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Kafka Introduction.pdf`
- 🏷️ **Tags / Chủ đề**: `Kafka`, `Event Streaming`, `Architecture`, `Ecosystem`
- 💡 **Tóm tắt chuyên đề**: Định vị Apache Kafka: Phân biệt Event Streaming Platform vs Message Broker thông thường, tư duy Event-Driven và hệ sinh thái Kafka.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Định nghĩa chuẩn: Apache Kafka là một Distributed Event Streaming Platform, vượt xa một Message Broker đơn thuần.
  + So sánh tư duy Response-Driven vs Event-Driven:
  + - Response: Gửi trực tiếp đến client yêu cầu, mang tính tức thời, đồng bộ, phụ thuộc vào thời điểm.
  + - Event: Ghi nhận một sự kiện thực tế đã xảy ra trong quá khứ, bất biến (Immutable), đa hình (nhiều hệ thống khác nhau cùng quan tâm), dòng chảy thời gian liên tục.
  + 3 Trụ cột chức năng của Kafka Platform:
  + 1. Event Streaming: Thu nhận và truyền tải hàng triệu sự kiện theo thời gian thực.
  + 2. Distributed Storage: Lưu trữ sự kiện bền vững trên đĩa phân tán với khả năng replication an toàn.
  + 3. Stream Processing & Ecosystem: Tích hợp dữ liệu nguồn/đích qua Kafka Connect, xử lý dòng dữ liệu qua Kafka Streams và KSQL.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Nhầm lẫn Kafka chỉ là một 'RabbitMQ phiên bản nhanh hơn', bỏ lỡ năng lực lưu trữ và xử lý dòng dữ liệu sự kiện.
  + Thiết kế hệ thống bị phụ thuộc chặt chẽ (tight coupling) giữa các microservices do lạm dụng REST API đồng bộ.
- 📦 **Thực hành / Artifacts liên quan**: Slide 7 trang mở đầu tư duy Event Streaming.

#### Bài 02: Why Kafka? Broker Comparison & High-Performance Mechanics
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Why Kafka..pdf`
- 🏷️ **Tags / Chủ đề**: `Performance`, `Zero-Copy`, `Page Cache`, `Comparison`, `RabbitMQ`
- 💡 **Tóm tắt chuyên đề**: Tiêu chí chọn lựa Message Broker (DB-Queue, Redis, RabbitMQ, NATS, Pulsar, Kafka) và 4 cơ chế phần cứng/kernel tạo nên tốc độ vô địch của Kafka.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Thứ tự ưu tiên khi chọn Broker: Đảm bảo phân phát (Delivery Guarantee) $ightarrow$ Tính năng nghiệp vụ (Functionality) $ightarrow$ Hiệu năng (Performance) $ightarrow$ Chi phí vận hành.
  + So sánh toàn diện các công nghệ:
  + - Database-Backed Queue: Tận dụng ACID, nhưng bottleneck I/O disk, throughput thấp.
  + - Redis: Siêu nhanh (In-memory), nhưng lo ngại mất dữ liệu khi crash/đầy RAM, chi phí bộ nhớ đắt đỏ.
  + - RabbitMQ: AMQP chuẩn mực, định tuyến rất linh hoạt (Exchanges/Queues), nhiều tính năng xịn (Delay, Priority), nhưng throughput giới hạn và cluster khó mở rộng quy mô lớn.
  + - NATS: Siêu nhẹ, tốc độ cao hơn Kafka nhưng tính năng lưu trữ phân tán hạn chế.
  + - Apache Pulsar: Tách rời Compute & Storage (BookKeeper), nhưng kiến trúc vận hành cực kỳ phức tạp.
  + - Apache Kafka: Thống trị tuyệt đối về Throughput, Khả năng mở rộng ngang (Horizontal Scalability) và Lưu trữ bền vững.
  + 4 Bí mật tạo nên tốc độ khủng khiếp của Kafka (Why is Kafka performant?):
  + 1. Sequential I/O trên Disk: Tận dụng cơ chế ghi tuần tự (Append-only log), tốc độ đọc ghi tuần tự trên ổ cứng đạt hàng trăm MB/s, tiệm cận tốc độ RAM.
  + 2. Linux OS Page Cache: Kafka không cache dữ liệu trên Java Heap (tránh Garbage Collection pauses), mà ủy thác toàn bộ cho Page Cache của Kernel Linux.
  + 3. Zero-Copy Technology (`sendfile` system call): Truyền dữ liệu thẳng từ OS Page Cache sang Card mạng NIC mà không cần copy qua Application User Space, giảm từ 4 lần context switch xuống 2 lần.
  + 4. Batching & Compression: Gom nhóm tin nhắn gửi theo batch để tối ưu hóa băng thông mạng.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Lựa chọn sai công nghệ Message Queue dẫn tới hệ thống bị sập khi traffic tăng vọt.
  + Hiểu rõ tại sao một ứng dụng viết bằng Java như Kafka lại có thể đánh bại các phần mềm viết bằng C/C++ về I/O throughput.
- 📦 **Thực hành / Artifacts liên quan**: Slide 26 trang kèm bảng so sánh ma trận broker và sơ đồ Zero-Copy.

#### Bài 03: Kafka Core Concepts: Partition, Offset & Record Anatomy
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Core Concepts.pdf`
- 🏷️ **Tags / Chủ đề**: `Core Concepts`, `Partition`, `Offset`, `Record`, `Ordering`
- 💡 **Tóm tắt chuyên đề**: Kiến trúc nền tảng: Broker Cluster, Topic, Partition là đơn vị song song hóa, Offset đóng vai trò Primary Key và cấu trúc chi tiết của 1 Record.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Kiến trúc tổng quan: Kafka Broker Cluster, Zookeeper (hoặc KRaft Metadata Quorum), Controller Broker.
  + Topic & Partitions:
  + - Topic là một luồng dữ liệu sự kiện logic.
  + - Partition là đơn vị vật lý, đơn vị phân tán dữ liệu và là Đơn vị song song hóa (Unit of Parallelism). Số lượng consumer tối đa chạy song song trong một nhóm bằng số lượng partition.
  + Bản chất của Partition: Là một mảng dữ liệu có thứ tự tuyệt đối (Totally Ordered), bất biến và liên tục nối đuôi (Append-only).
  + Nguyên tắc vàng về Thứ tự tin nhắn (Message Ordering): Kafka CHỈ đảm bảo thứ tự tin nhắn trong phạm vi một Partition duy nhất. Không có sự đảm bảo thứ tự trên toàn Topic nếu có nhiều partition!
  + Offset: Là ID tăng dần duy nhất của từng tin nhắn trong một partition, đóng vai trò như Primary Key.
  + Cấu trúc chi tiết của 1 Record (Message):
  + - Key: Tùy chọn, dùng để tính toán băm partition (`murmur2(key) % num_partitions`).
  + - Value: Nội dung dữ liệu chính (Payload).
  + - Timestamp: Thời điểm tạo sự kiện.
  + - Headers: Cặp key-value tự do chứa metadata (tương tự HTTP Headers), dùng cho tracing, routing.
  + - Offset & Partition ID.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Hiểu sai về thứ tự tin nhắn trong Kafka dẫn tới lỗi xử lý giao dịch bị đảo lộn (Order Created chạy sau Order Cancelled).
  + Không biết cách scale-out khả năng đọc của Consumer do tạo thiếu Partition.
- 📦 **Thực hành / Artifacts liên quan**: Slide 29 trang với sơ đồ cấu trúc Record và cơ chế phân chia partition.

#### Bài 04: Message Broker in Microservices: 4 Classic Architectural Problems
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Message Broker.pdf`
- 🏷️ **Tags / Chủ đề**: `Microservices`, `Decoupling`, `Backpressure`, `Fan-out`
- 💡 **Tóm tắt chuyên đề**: Phân tích hạn chế của mô hình Request-Response và 4 bài toán kinh điển được giải quyết bằng Message Broker: Bất đồng bộ, Tách rời phụ thuộc, Pub/Sub và San phẳng tải.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Điểm yếu chí mạng của mô hình Request-Response truyền thống: Đồng bộ (Synchronous), Treo luồng chờ (Blocking), Ràng buộc chặt chẽ (Tight Coupling), Hiệu ứng sụp đổ dây chuyền (Cascading Failures).
  + 4 Bài toán kinh điển và giải pháp với Kafka:
  + - Bài toán 1 (1 Service gửi tin cho nhiều Service): Trong Request-Response, Service A phải gửi 3 lần HTTP và chờ cả 3 trả lời. Với Kafka: Gửi 1 lần duy nhất vào Topic, các service khác tự consume bất đồng bộ.
  + - Bài toán 2 (Phải biết IP/Address của nhau): Với Kafka, Producer và Consumer hoàn toàn ẩn danh đối với nhau (Loose Coupling).
  + - Bài toán 3 (Mở rộng tính năng mới không sửa code cũ): Cơ chế Pub/Sub Fan-out cho phép thêm Service E lắng nghe Topic X mà không cần chạm vào một dòng code nào của Service A.
  + - Bài toán 4 (Traffic đột biến làm sập Database): Sử dụng Kafka làm Bộ đệm điều hòa lưu lượng (Buffering / Traffic Smoothing / Backpressure), database chỉ cần tiêu thụ dữ liệu với tốc độ mà nó có thể chịu đựng được.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Database bị tràn kết nối và crash mỗi khi có sự kiện khuyến mãi Flash Sale hoặc dữ liệu từ thiết bị IoT ùa về.
  + Các team microservices liên tục bị phụ thuộc vào tiến độ của nhau do ràng buộc API đồng bộ.
- 📦 **Thực hành / Artifacts liên quan**: Slide 15 trang phân tích chi tiết 4 bài toán kiến trúc kèm sơ đồ so sánh.

#### Bài 05: Kafka Producer Deep Dive: ACK, Retry, Batching & Idempotence
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Producer.pdf`
- 🏷️ **Tags / Chủ đề**: `Producer`, `Idempotence`, `Batching`, `Compression`, `Tuning`
- 💡 **Tóm tắt chuyên đề**: 7 Cấu hình then chốt của Kafka Producer: Ma trận ACKs (0, 1, all), Chiến lược Retry, Tối ưu Batching & Linger, Sticky Partitioner và Idempotent Producer.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + 1. Ma trận ACKs (Acknowledgment):
  + - `acks=0`: Fire-and-forget. Tốc độ cao nhất nhưng nguy cơ mất dữ liệu cao nhất.
  + - `acks=1`: Leader ghi thành công vào đĩa là ACK. Cân bằng hiệu năng và độ an toàn.
  + - `acks=all` (hoặc `-1`): Chờ Leader và TOÀN BỘ In-Sync Replicas (ISRs) ghi xong mới ACK. Độ an toàn dữ liệu tuyệt đối (kết hợp `min.insync.replicas=2`).
  + 2. Cơ chế Retry & Backoff: Phân biệt lỗi Retriable (LeaderNotAvailable, NotEnoughReplicas) vs Non-retriable. Cấu hình `retries=MAX_INT`, `retry.backoff.ms`.
  + 3. Tối ưu gom lô (Batching) để vượt qua Bottleneck Mạng: `batch.size` (kích thước batch tối đa) kết hợp `linger.ms` (thời gian producer cố tình chờ vài milli-giây để gom thêm tin nhắn vào batch trước khi gửi đi).
  + 4. Nén dữ liệu (Compression): gzip, snappy, lz4, zstd. Đánh đổi CPU để giảm tải băng thông mạng và dung lượng lưu trữ trên broker.
  + 5. Phân vùng tin nhắn (Partitioners): Default Partitioner, Hash Key Partitioner (Murmur2), Sticky Partitioner (tối ưu hóa gom batch lớn khi message không có key).
  + 6. `max.in.flight.requests.per.connection`: Số request gửi đi mà chưa cần nhận ACK. Nếu > 1 và xảy ra retry, tin nhắn có nguy cơ bị đảo lộn thứ tự (Out-of-order)! Tại sao?
  + 7. Idempotent Producer (`enable.idempotence=true`): Giải pháp cứu tinh. Broker cấp phát Producer ID (PID) và gán Sequence Number tăng dần cho từng message. Broker tự động từ chối các tin nhắn trùng lặp (Duplicate) và bảo toàn đúng thứ tự ngay cả khi `max.in.flight > 1`.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Mất dữ liệu do Producer gửi tin thất bại mà không có retry hoặc cấu hình `acks` quá lỏng lẻo.
  + Tin nhắn bị lặp (Duplicate) hoặc bị đảo lộn thứ tự khi mạng chập chờn kích hoạt retry.
  + Throughput của Producer quá thấp do gửi từng tin nhắn đơn lẻ qua mạng.
- 📦 **Thực hành / Artifacts liên quan**: Slide 34 trang với phân tích cặn kẽ từng thông số cấu hình và bài toán đánh đổi.

#### Bài 06: Serialization, Schema Registry & Binary Formats (Avro/Protobuf)
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Serialization.pdf`
- 🏷️ **Tags / Chủ đề**: `Serialization`, `Avro`, `Protobuf`, `Schema Registry`, `JSON`
- 💡 **Tóm tắt chuyên đề**: Bản chất tuần tự hóa dữ liệu: Phân biệt Serialization vs Parsing vs Marshaling, định dạng Text (JSON) vs Binary (Avro, Protobuf) và tiến hóa schema.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Định nghĩa: Serialization là quá trình chuyển đổi đối tượng trong bộ nhớ thành mảng byte để truyền qua mạng hoặc lưu trữ.
  + Phân biệt rạch ròi 3 khái niệm: Serialization (Object $ightarrow$ Bytes), Parsing (Text $ightarrow$ Object), Marshaling (Object $ightarrow$ Định dạng trung gian kèm metadata).
  + Sai lầm kinh điển trong thực tế: Đọc mảng byte $ightarrow$ Deserialize thành String JSON $ightarrow$ Parse từ String JSON thành Object nghiệp vụ (lãng phí CPU và bộ nhớ gấp đôi).
  + So sánh các định dạng tuần tự hóa:
  + - Text-based (JSON, XML): Dễ đọc cho con người, linh hoạt, nhưng dung lượng payload lớn, tốc độ parse chậm, không có schema bắt buộc.
  + - Binary-based (Apache Avro, Protocol Buffers - Protobuf): Kích thước cực kỳ nhỏ gọn, tốc độ parse siêu thanh, schema được định nghĩa chặt chẽ.
  + Vai trò sống còn của Confluent Schema Registry trong Microservices:
  + - Quản lý tập trung Schema ID. Producer và Consumer chỉ truyền `Schema_ID (4 bytes) + Binary Data`, không cần gửi kèm toàn bộ định nghĩa schema trong từng tin nhắn.
  + - Quản lý tiến hóa Schema (Schema Evolution): Khả năng tương thích ngược (Backward Compatibility), tương thích xuôi (Forward Compatibility) và Full Compatibility, bảo đảm nâng cấp service mà không làm chết các consumers khác.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Hệ thống bị nghẽn băng thông mạng do gửi JSON payload cồng kềnh với hàng triệu tin nhắn mỗi phút.
  + Producer sửa trường dữ liệu làm sập toàn bộ các Consumer cũ trong hệ thống microservices.
- 📦 **Thực hành / Artifacts liên quan**: Slide 7 trang kèm so sánh chi tiết các định dạng và cấu hình serializer.

#### Bài 07: Consumer Groups, Partition Assignment & Rebalance Protocol
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Group Membership & Partition Assignment.pdf`
- 🏷️ **Tags / Chủ đề**: `Consumer`, `Rebalance`, `Consumer Group`, `Partition Assignor`
- 💡 **Tóm tắt chuyên đề**: Mô hình Consumer Group, vai trò của Group Coordinator & Leader, quy trình 2 pha JoinGroup/SyncGroup, Eager Rebalance vs Cooperative Sticky Rebalance.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Mô hình Consumer Group: Mở rộng khả năng tiêu thụ dữ liệu song song. Một partition chỉ được tiêu thụ bởi DUY NHẤT một consumer trong cùng một group tại một thời điểm.
  + Hai vai trò nòng cốt:
  + - Group Coordinator: Là một process nằm trên một Kafka Broker, quản lý trạng thái của nhóm và lưu trữ offset vào topic nội bộ `__consumer_offsets`.
  + - Group Leader: Là một Consumer trong nhóm (thường là consumer đầu tiên join nhóm), được Coordinator giao nhiệm vụ chạy thuật toán phân bổ partition.
  + Giao thức 2 pha của Consumer Group Protocol:
  + 1. JoinGroup Phase: Tất cả consumers gửi request tham gia nhóm. Coordinator chọn ra Group Leader.
  + 2. SyncGroup Phase: Group Leader tính toán danh sách gán partition cho từng consumer rồi gửi về Coordinator. Coordinator phản hồi lại kết quả phân bổ cho các consumers.
  + Cơ chế Rebalance và sự tiến hóa vượt bậc:
  + - Eager Rebalance (Cũ): 'Stop-The-World'. Khi có consumer thêm/bớt, toàn bộ consumers trong nhóm phải dừng đọc, từ bỏ toàn bộ partition đang giữ rồi nhận lại từ đầu. Gây ra hiện tượng gián đoạn xử lý và dồn ứ tin nhắn (Lag spike).
  + - Cooperative Sticky Rebalance (Hiện đại): 'Incremental Rebalance'. Chỉ thu hồi và chuyển giao các partition cần di chuyển; các consumers khác vẫn tiếp tục đọc bình thường từ các partition không bị ảnh hưởng.
  + Các chiến lược phân bổ Partition (Partition Assignment Strategies): RangeAssignor, RoundRobinAssignor, StickyAssignor, CooperativeStickyAssignor.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Hiện tượng 'Stop-The-World' giật lag cả cụm consumer mỗi khi deploy một phiên bản mới.
  + Consumer đọc dữ liệu không đều (một consumer ôm quá nhiều partition trong khi consumer khác rảnh rỗi).
- 📦 **Thực hành / Artifacts liên quan**: Slide 17 trang phân tích quy trình 2 pha và so sánh trực quan Eager vs Cooperative.

#### Bài 08: Consumer Liveness: Poll Thread vs Heartbeat Thread
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Liveness.pdf`
- 🏷️ **Tags / Chủ đề**: `Liveness`, `Heartbeat`, `Poll Thread`, `Troubleshooting`
- 💡 **Tóm tắt chuyên đề**: Hai tính chất nền tảng của hệ phân tán (Safety & Liveness), cơ chế kiểm tra sự sống độc lập của Poll Thread và Heartbeat Thread và cách triệt tiêu Rebalance Loop.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + 2 Tính chất cốt lõi của Hệ phân tán:
  + - Safety Property: Đảm bảo điều xấu không bao giờ xảy ra (vd: không xử lý sai tin nhắn, không mất dữ liệu).
  + - Liveness Property: Đảm bảo điều tốt cuối cùng chắc chắn sẽ xảy ra (vd: consumer sẽ tiếp tục tiến trình xử lý, hệ thống không bị treo vô hạn).
  + Cơ chế kiểm tra sự sống (Liveness) 2 tầng trong Kafka Consumer:
  + 1. Heartbeat Thread (Chạy ngầm):
  + - Gửi nhịp tim định kỳ tới Group Coordinator (`heartbeat.interval.ms`, mặc định 3s).
  + - Nếu sau `session.timeout.ms` (mặc định 45s) Coordinator không nhận được heartbeat, Coordinator coi consumer đã chết do sập máy chủ/đứt cáp mạng và kích hoạt Rebalance.
  + 2. Poll Thread (Xử lý nghiệp vụ chính):
  + - Chạy vòng lặp gọi hàm `poll()` để lấy tin nhắn và xử lý.
  + - Tham số sống còn: `max.poll.interval.ms` (mặc định 5 phút). Nếu consumer bận xử lý tác vụ quá lâu (ví dụ xử lý file nặng, gọi bên thứ ba bị timeout) mà không kịp gọi `poll()` tiếp theo trong 5 phút, Broker sẽ coi consumer bị treo (Livelock/Stuck) và đuổi khỏi nhóm $ightarrow$ Kích hoạt Rebalance!
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Hiện tượng 'Rebalance Cascade / Rebalance Loop': Consumer bị đuổi vì xử lý lâu $ightarrow$ Rebalance $ightarrow$ Consumer khác nhận lại tin nhắn nặng đó $ightarrow$ Lại xử lý quá 5 phút $ightarrow$ Lại bị đuổi $ightarrow$ Cụm consumer tê liệt hoàn toàn.
  + Tách bạch rõ ràng giữa chết phần cứng (Heartbeat) và tắc nghẽn logic nghiệp vụ (Poll).
- 📦 **Thực hành / Artifacts liên quan**: Slide 5 trang kèm sơ đồ hoạt động độc lập của 2 luồng.

#### Bài 09: Kafka Problems & Architectural Patterns (Master Blueprint)
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Problems & Patterns.pdf`
- 🏷️ **Tags / Chủ đề**: `Patterns`, `Outbox`, `Exactly-Once`, `Dual-Write`, `Claim-Check`, `Ordering`
- 💡 **Tóm tắt chuyên đề**: Tài liệu nòng cốt 83 trang giải quyết toàn bộ các bài toán hóc búa nhất: Định cỡ Topic Width, Xử lý file lớn Claim-Check, Dual-Write, Transactional Outbox với CDC và Exactly-Once Semantics.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + 1. Topic Width & Partition Sizing: Công thức tính số lượng partition dựa trên Throughput mong muốn: `Partitions = Target_Throughput / max(Producer_Throughput, Consumer_Throughput)`. Quy trình giảm số partition (Kafka không hỗ trợ giảm partition trực tiếp $ightarrow$ Tạo topic mới $ightarrow$ Replicate $ightarrow$ Cut-over).
  + 2. Large Message Handling (Vượt quá 1MB mặc định): Phân tích Anti-pattern (tăng `message.max.bytes` làm broker cạn RAM) vs Claim Check Pattern (Upload payload lớn lên S3/MinIO, chỉ gửi Object Reference/URL qua Kafka) vs Chunking.
  + 3. Message Lag & Long-Running Tasks: Tách rời luồng fetch dữ liệu từ Kafka khỏi luồng xử lý nghiệp vụ thông qua Multi-Threaded Consumer Worker Pool.
  + 4. Request-Reply Pattern qua Kafka: Xây dựng giao tiếp 2 chiều bất đồng bộ sử dụng Correlation ID và Return Address Header.
  + 5. Thảm họa Dual-Write Problem:
  + - Xảy ra khi một tiến trình vừa phải ghi vào Database vừa phải gửi Message vào Kafka. Không có giao dịch nguyên tử (Distributed Transaction) xuyên suốt giữa CSDL và Message Broker!
  + - Cố gắng 1 (Gửi event trước $ightarrow$ ghi DB): Gửi event thành công nhưng ghi DB lỗi $ightarrow$ Mất dữ liệu, sai lệch trạng thái.
  + - Cố gắng 2 (Ghi DB trước $ightarrow$ gửi event): Ghi DB xong thì server sập hoặc mạng chết không gửi được event $ightarrow$ Hệ sinh thái downstream không biết gì.
  + 6. Transactional Outbox Pattern (Chuẩn mực vàng của Microservices):
  + - Lưu trữ sự kiện vào bảng `outbox` ngay bên trong Transaction CSDL cục bộ của nghiệp vụ (Bảo đảm 100% tính nguyên tử của ACID).
  + - Tiến trình độc lập đọc bảng outbox và publish sang Kafka: Sử dụng Polling Publisher hoặc tối ưu nhất là CDC (Change Data Capture) với Debezium đọc Transaction Log (WAL) của PostgreSQL/MySQL.
  + 7. Exactly-Once Semantics (EOS):
  + - Công thức toán học: `Exactly-Once = At-Least-Once + At-Most-Once`.
  + - Phân biệt Aggregation Flow (Stream-to-Stream dùng Kafka Transactions) vs Sink Flow (Stream-to-DB có side-effect).
  + - Đạt Exactly-Once ở Sink Flow: Bắt buộc kết hợp Idempotent Producer + Idempotent Consumer.
  + 8. End-to-End Message Ordering: Total Order vs Partial Order. Đảm bảo thứ tự tuyệt đối: Gán cùng Partition Key + `enable.idempotence=true` + `max.in.flight.requests.per.connection <= 5`.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Mất tiền hoặc đơn hàng không được giao do sự cố Dual-Write giữa Database và Kafka.
  + Dữ liệu gửi vào Kafka bị lỗi trùng lặp khiến báo cáo tài chính bị nhân đôi doanh thu.
  + Broker bị sập vì có lập trình viên gửi file PDF/Video 50MB trực tiếp vào Kafka message.
- 📦 **Thực hành / Artifacts liên quan**: Tài liệu đồ sộ 83 trang với đầy đủ case studies, code mẫu và sơ đồ kiến trúc.

#### Bài 10: Case Study: Real-Time Fraud Detection System (Binance Scale)
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../Fraud Detection System.pdf`
- 🏷️ **Tags / Chủ đề**: `Case Study`, `Fraud Detection`, `Fintech`, `Real-Time`, `Flink`
- 💡 **Tóm tắt chuyên đề**: Thiết kế kiến trúc hệ thống phát hiện gian lận giao dịch tài chính thời gian thực quy mô hàng trăm ngàn giao dịch/phút trên nền tảng Kafka và Stream Processing.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Bối cảnh bài toán: Hệ thống ví điện tử / sàn giao dịch tiền điện tử (tương tự Binance, ShopeePay) xử lý lượng giao dịch khổng lồ mỗi phút, cần phát hiện và ngăn chặn hành vi gian lận (Rửa tiền, Hack tài khoản, Chuyển tiền bất thường) trong vòng vài milli-giây.
  + Kiến trúc giải pháp phân tầng:
  + 1. Transaction Ingestion Layer: API Gateway tiếp nhận giao dịch $ightarrow$ Ghi vào Transaction Topic trên Kafka (Phân vùng theo `Account_ID` để bảo toàn thứ tự giao dịch của từng tài khoản).
  + 2. Real-Time Stream Processing Layer: Apache Flink hoặc Kafka Streams liên tục tính toán các chỉ số trong khung thời gian trượt (Sliding Windows): Số lần chuyển tiền trong 5 phút qua, Vị trí địa lý nhảy vọt (Geo-velocity), Số tiền vượt ngưỡng trung bình.
  + 3. Rule Engine & Machine Learning Model Scoring: Đánh giá điểm gian lận (Fraud Score) trong thời gian thực.
  + 4. Alert & Enforcement Layer: Nếu Fraud Score vượt ngưỡng nguy hiểm $ightarrow$ Phát sự kiện vào `block-account-topic` và `alert-topic` để khóa ngay lập tức giao dịch và gửi cảnh báo về Trung tâm an ninh (SOC).
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Bị thất thoát tiền bạc do hệ thống kiểm tra gian lận theo kiểu batch truyền thống (chạy cronjob cuối ngày) phát hiện quá trễ khi tiền đã bị rút khỏi sàn.
  + Đảm bảo khả năng kiểm tra giao dịch với độ trễ < 50ms mà không làm nghẽn tiến trình nạp rút tiền thông thường.
- 📦 **Thực hành / Artifacts liên quan**: Slide 3 trang tóm tắt kiến trúc phát hiện gian lận chuẩn thực chiến.

#### Bài 11: CCDAK Knowledge Domains: Certification Blueprint
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../CCDAK Knowledge Domains.pdf`
- 🏷️ **Tags / Chủ đề**: `CCDAK`, `Certification`, `Confluent`, `Exam Blueprint`
- 💡 **Tóm tắt chuyên đề**: Ma trận 4 miền kiến thức bắt buộc để chinh phục chứng chỉ quốc tế uy tín Confluent Certified Developer for Apache Kafka.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + 4 Miền kiến thức chuẩn của kỳ thi Confluent CCDAK:
  + 1. Application Design (20% trọng số):
  + - Sử dụng thành thạo các công cụ dòng lệnh (Kafka CLI: `kafka-topics`, `kafka-console-producer`, `kafka-consumer-groups`).
  + - Mô hình Pub/Sub và Event Streaming.
  + - Kiến trúc tổng quan và thiết kế topic, partition của Kafka.
  + 2. Development (40% trọng số - Miền quan trọng nhất):
  + - Lập trình và tối ưu hóa hiệu năng Kafka Producer và Consumer APIs.
  + - Hiểu sâu cấu hình: `acks`, `retries`, `batch.size`, `linger.ms`, `enable.idempotence`.
  + - Cơ chế Rebalance, gán partition thủ công (`assign`) vs tự động (`subscribe`).
  + - Tích hợp Confluent Schema Registry và xử lý serialization Avro.
  + 3. Deployment & Testing (20% trọng số):
  + - Viết Unit Test và Integration Test cho Kafka ứng dụng Testcontainers hoặc TopologyTestDriver.
  + - Quản lý topic configurations và hạn ngạch (Quotas).
  + 4. Monitoring & Troubleshooting (20% trọng số):
  + - Giám sát Consumer Lag, Broker Metrics (Under-Replicated Partitions, Active Controller Count).
  + - Xử lý các sự cố mạng, mất kết nối broker, rebalance cascades.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Định hướng lộ trình học tập chuẩn mực theo tiêu chuẩn quốc tế của Confluent.
  + Tập trung đúng vào các kiến thức có trọng số cao nhất (Development 40%).
- 📦 **Thực hành / Artifacts liên quan**: Bảng ma trận phân bổ kiến thức chứng chỉ CCDAK.

#### Bài 12: CCDAK Exam Preparation & Strategies
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../CCDAK Exam.pdf`
- 🏷️ **Tags / Chủ đề**: `CCDAK`, `Exam Strategy`, `Preparation`, `Tips`
- 💡 **Tóm tắt chuyên đề**: Cẩm nang ôn thi chứng chỉ Confluent: Lộ trình 3-6 tháng, chiến lược làm bài thi, các tài liệu sách chuẩn và nguồn dump uy tín.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Giới thiệu chứng chỉ CCDAK (Confluent Certified Developer for Apache Kafka): Giá trị kiểm chứng năng lực thực tế, tạo lợi thế cạnh tranh vượt trội khi ứng tuyển các vị trí Senior / Tech Lead / Distributed Systems Engineer.
  + Thời gian chuẩn bị khuyến nghị: 3 đến 6 tháng tùy nền tảng.
  + Các yêu cầu tiên quyết: Hiểu sâu về Java, cơ chế Garbage Collection (G1GC), các mô hình mạng và threading.
  + Chiến lược làm bài thi thực tế:
  + - Thực hành gõ lệnh CLI thật nhiều lần trên terminal.
  + - Không cần đào quá sâu vào Kafka Connect hoặc Kafka Streams phức tạp (tập trung 80% sức lực vào Producer, Consumer và Broker Internals).
  + - Đọc kỹ các tài liệu sách chính thống của O'Reilly: 'Kafka: The Definitive Guide'.
  + Quy định phòng thi Online Proctored: Camera, Mic, kiểm tra không gian phòng thi nghiêm ngặt.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Tránh lãng phí lệ phí thi đắt đỏ của Confluent do ôn thi lệch tủ hoặc thiếu kỹ năng làm bài trắc nghiệm tình huống.
- 📦 **Thực hành / Artifacts liên quan**: Slide 8 trang cẩm nang hướng dẫn chi tiết.

#### Bài 13: CCDAK Practice Exam & In-Depth Question Breakdown
- 📁 **File tài liệu gốc**: `Tài Liệu/Khóa 4.../CCDAK Exam_2.pdf`
- 🏷️ **Tags / Chủ đề**: `CCDAK`, `Practice Exam`, `Real Scenarios`, `150 Questions`
- 💡 **Tóm tắt chuyên đề**: Bộ đề thi đồ sộ 139 trang gồm hơn 150 câu hỏi tình huống thực tế kèm lời giải thích cặn kẽ từng đáp án: ACLs, KSQL, KTable vs KStream, Leader/Follower ISR và Troubleshooting.
- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:
  + Bộ sưu tập hơn 150 câu hỏi trắc nghiệm chuyên sâu và câu hỏi tình huống kiến trúc thực tế:
  + - Phân tích vị trí lưu trữ Access Control Lists (ACLs) mặc định trong Kafka Cluster (Zookeeper znode `/kafka-acl` hoặc topic nội bộ).
  + - KSQL & Kafka Streams: Phân biệt các truy vấn ghi dữ liệu (`CREATE STREAM AS SELECT`, `INSERT INTO`) vs các truy vấn chỉ đọc (`EXPLAIN`, `SHOW STREAMS`).
  + - KTable (Changelog state) vs KStream (Luồng sự kiện liên tục) và kỹ thuật Stream-Table Join.
  + - Xử lý lỗi `NotLeaderForPartitionException` khi client kết nối tới broker.
  + - Các câu hỏi tình huống về `linger.ms` và `batch.size` để tối ưu hóa mạng.
  + - Cấu hình tương thích Schema Registry (BACKWARD, FORWARD, FULL) và cách xử lý khi xóa hoặc thêm trường dữ liệu.
  + - Cơ chế Log Compaction và vai trò của Tombstone records (Message có value = null để xóa key).
  + - Tình huống Consumer Lag tăng cao và cách điều chỉnh cấu hình Fetch/Buffer để khắc phục.
- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:
  + Biến toàn bộ lý thuyết trừu tượng thành phản xạ giải quyết vấn đề nhanh trong các bài toán thực tế và phỏng vấn kỹ thuật cấp cao.
- 📦 **Thực hành / Artifacts liên quan**: Tài liệu PDF 139 trang phân tích chi tiết từng câu hỏi đề thi.

---

## 4. LỘ TRÌNH THỰC CHIẾN CHÍNH THỨC: 4 CHẶNG TÍCH LŨY LIÊN HOÀN (SINGLE SOURCE OF TRUTH)

> **Nguyên tắc**: Bắt đầu ngay từ **Bài 03: Index (đang học)**, hoàn thành dứt điểm cụm Database của Khóa 1 ➔ cụm Hệ thống & Cache ➔ chuyển sang Khóa 3 (Kafka) ➔ về đích tại Khóa 2 (System Design). Không nhảy cóc lung tung!

```text
CHẶNG 1: DỨT ĐIỂM CỤM DATABASE & GIAO DỊCH ACID (KHÓA 1)
├── 1. Khóa 1 - Bài 03: Database Index (ĐANG HỌC NGAY BÂY GIỜ - B-Tree, Heap TID, 11 Labs)
├── 2. Khóa 1 - Bài 04 & 07: Clean Architecture & Data Modeling (Domain, Double-Entry Ledger)
├── 3. Khóa 1 - Bài 12: Database Transaction & MVCC (ACID, WAL log, 4 Isolation Levels, xmin/xmax)
└── 4. Khóa 1 - Bài 14: Database Locking & Concurrency (Row Lock, FOR UPDATE, Resource Ordering phá Deadlock)
➔ [Sản phẩm đầu ra]: 1 Core Ledger Service an toàn dữ liệu 100%, không bao giờ bị âm tiền hay mất mát giao dịch.

CHẶNG 2: DỨT ĐIỂM CỤM MẠNG, OS & CACHE BẢO VỆ TẢI (KHÓA 1)
├── 5. Khóa 1 - Bài 05: Computer Networking (TCP 3-way/4-way, TLS 1.3, HTTP/2 Multiplexing, WebSocket)
├── 6. Khóa 1 - Bài 06: Redis Mastery (Single-threaded event loop, SDS, skiplist, Khóa phân tán Redlock)
├── 7. Khóa 1 - Bài 15: Linux OS Internals (Virtual Memory, epoll, Page Cache, Zero-Copy sendfile)
└── 8. Khóa 1 - Bài 16: System Integration & Resilience (Retry Backoff + Full Jitter, Circuit Breaker)
➔ [Sản phẩm đầu ra]: Tấm khiên Cache-Aside và Rate Limiting bảo vệ Core Ledger trước tải đỉnh Flash Sale.

CHẶNG 3: HẠ TẦNG SỰ KIỆN PHÂN TÁN BẤT ĐỒNG BỘ (KHÓA 3: KAFKA NÂNG CAO)
├── 9.  Khóa 3 - Bài 01-05: Kafka Core & Producer (Kế thừa Zero-Copy K1-15, acks=all, enable.idempotence=true)
├── 10. Khóa 3 - Bài 07-08: Consumer Groups, Cooperative Sticky Rebalance, Liveness Threads
├── 11. Khóa 3 - Bài 09: Transactional Outbox Pattern + Debezium CDC (Giải quyết triệt để thảm họa Dual-Write)
└── 12. Khóa 3 - Bài 10: Case Study Real-Time Fraud Detection System (Xử lý dòng sự kiện thời gian thực)
➔ [Sản phẩm đầu ra]: Chuyển đổi hệ thống sang Event-Driven Architecture, phát sự kiện sang Kafka không bao giờ lệch pha.

CHẶNG 4: THIẾT KẾ HỆ THỐNG QUY MÔ LỚN (KHÓA 2: SYSTEM DESIGN HIGH CONCURRENCY)
├── 13. Khóa 2 - Bài 01-03: SD Methodology, Capacity Estimation (QPS, RAM, Disk) & Database Sharding
├── 14. Khóa 2 - Bài 04-06: Caching at Scale, 5 Rate Limiting Algorithms, Saga Pattern (Orchestration vs Choreography)
├── 15. Khóa 2 - Bài 08: Case Study Hệ thống rút gọn link URL Shortener (Bitly scale - Base62, Snowflake, KGS)
└── 16. Khóa 2 - Bài 09: Case Study Mạng xã hội News Feed (Threads/Twitter scale - Push vs Pull vs Hybrid Celebrity)
➔ [Sản phẩm đầu ra]: Năng lực Kiến trúc sư trưởng, tự tin phỏng vấn và thiết kế hệ thống hàng chục triệu người dùng.
```

---

## 5. Kết Luận & Hành Động Tiếp Theo

- **Bản HTML tương tác cao cấp**: Đã được tạo sẵn tại `reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.html` (kèm tính năng lọc theo khóa, tìm kiếm theo từ khóa, xem 5 sơ đồ SVG kiến trúc, và mở rộng chi tiết từng bài).
- **Lưu trữ chuẩn mực**: Toàn bộ báo cáo nằm trực tiếp trong project (`D:/study/advance-be/reports/`), tuân thủ nghiêm ngặt quy định không lưu ra ngoài thư mục dự án.
- **Khuyến nghị bắt đầu**: Bắt đầu thực hành từ các bài tập đã có sẵn trong `labs/lesson-02-caching/` và `labs/lesson-03-index/`, sau đó tuần tự tích lũy theo 5 giai đoạn đã đề ra.