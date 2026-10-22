# TỔNG QUAN KHÓA HỌC ADVANCED BACKEND (MASTER CURRICULUM MAP)

> **Mục tiêu**: Định hình tư duy kỹ sư Backend cấp cao (Senior Backend / System Engineer) thông qua việc nắm vững bản chất tầng sâu (Internals): Hệ điều hành, Mạng, Database Internals (B-Tree, Heap, MVCC, Locks), Caching High-load, Kiến trúc Clean Architecture và Tích hợp hệ thống phân tán.
>
> Toàn bộ tài liệu tuân thủ triết lý tại `AGENTS.md`: **Anti Over-Engineering**, **Làm mẫu -> Tự làm (Hands-on)**, **Đa dạng hóa công cụ thực chiến (psql, DBeaver, DBX, Postman, cURL)**, và **Tích lũy cuốn chiếu (Cumulative Integration)**.

---

## 1. Bản Đồ 5 Trụ Cột Năng Lực (5 Core Pillars)

```
                              ┌───────────────────────────────────────────┐
                              │     ADVANCED BACKEND MASTER ENGINE        │
                              └─────────────────────┬─────────────────────┘
                                                    │
         ┌───────────────────┬──────────────────────┼──────────────────────┬───────────────────┐
         ▼                   ▼                      ▼                      ▼                   ▼
   [PILLAR 1]          [PILLAR 2]             [PILLAR 3]             [PILLAR 4]          [PILLAR 5]
  SYSTEM & MẠNG       DATABASE ENGINE       HIGH PERFORMANCE       API & INTEGRATION   SOFTWARE CRAFT
 ───────────────     ─────────────────     ──────────────────     ─────────────────── ────────────────
  15. OS Internals    07. Data Modeling     02. Caching Design     01. REST API Design 04. Codebase Arch
  05. Networking      03. Index Internals   06. Redis Mastery      16. Integration     13. Clean Code
  11. Regex Engine    12. Transaction MVCC                                             08. App Security
                      14. Locking & Race
```

---

## 2. Bảng Tra Cứu Toàn Diện 16 Chuyên Đề (Master Index)

| STT | Tên Chuyên Đề | Tài Liệu Gốc | Bản Markdown Chi Tiết | Thực Hành / Labs / Artifacts Đã Có | Trọng Tâm Kiến Thức Cốt Lõi |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **01** | **REST API Design** | `Tài Liệu/advanced_backend/1. REST API Design.pdf` | `Tài Liệu/advanced_backend/1. REST API Design.md` | `summaries/01-rest-api-design.md`<br>`reports/advanced_backend/idempotency_architecture_guide.html` | Tư duy RESTful chuẩn mực, Idempotency keys, Pagination (Cursor vs Offset), API Versioning, Error codes RFC 7807. |
| **02** | **Caching Design** | `Tài Liệu/advanced_backend/2. Caching Design.pdf` | `Tài Liệu/advanced_backend/2. Caching Design.md` | `labs/lesson-02-caching/`<br>`reports/advanced_backend/lesson_02_caching_teacher_guide.html`<br>`reports/advanced_backend/lesson_02_caching_design_mastery_guide.html` | Caching patterns (Cache-Aside, Write-Through/Behind), các bài toán kinh điển: Stampede, Avalanche, Penetration (Bloom Filter), Breakdown (Singleflight), Race Condition xóa/cập nhật cache. |
| **03** | **Database Index** | `Tài Liệu/advanced_backend/3. Index.pdf` | `Tài Liệu/advanced_backend/3. Index.md` | `labs/lesson-03-index/` (11 labs ESM)<br>`reports/advanced_backend/lesson_03_index_teacher_guide.html`<br>`reports/advanced_backend/dbx-vs-ssms-dbeaver-pgadmin.md` | Cấu trúc B-Tree / B+Tree, Heap File & Tuple TID, HOT updates, Clustered vs Secondary Index, Composite index left-prefix, Covering Index (INCLUDE), Index Bloat, đo đạc bằng `EXPLAIN (ANALYZE, BUFFERS)`. |
| **04** | **Codebase Structure** | `Tài Liệu/advanced_backend/4. Codebase Structure.pdf` | `Tài Liệu/advanced_backend/4. Codebase Structure.md` | *Kế thừa vào bài tập lớn* | Kiến trúc phân tầng (Layered), Clean Architecture, Hexagonal (Ports & Adapters), tư duy Domain-Driven Design (DDD): Entities, Value Objects, Aggregates, Repositories, Domain Services. |
| **05** | **Computer Network** | `Tài Liệu/advanced_backend/5. Networking.pdf` | `Tài Liệu/advanced_backend/5. Networking.md` | *Network debugging cURL / Wireshark* | Mô hình OSI & TCP/IP, Cơ chế TCP 3-way Handshake & 4-way Teardown, UDP, TLS 1.3 Handshake, DNS Resolution, HTTP/1.1 vs HTTP/2 multiplexing vs HTTP/3 QUIC, WebSocket. |
| **06** | **Redis Mastery** | `Tài Liệu/advanced_backend/6. Redis.pdf` | `Tài Liệu/advanced_backend/6. Redis.md` | `labs/lesson-02-caching/06-*.mjs` | Redis Single-threaded Event Loop & I/O Multiplexing, Cấu trúc dữ liệu nội tại (Strings, Hashes, Lists, Sets, Sorted Sets, Bitmaps), Cơ chế lưu trữ RDB & AOF, Distributed Locks (Redlock), Pub/Sub, Streams, Memory eviction. |
| **07** | **Data Modeling** | `Tài Liệu/advanced_backend/7. Data Modeling.pdf` | `Tài Liệu/advanced_backend/7. Data Modeling.md` | *ERD Design & DDL scripts* | Chuẩn hóa CSDL (1NF, 2NF, 3NF) vs Phi chuẩn hóa (Denormalization) khi tối ưu đọc, Thiết kế mô hình dữ liệu E-commerce, Social Network, Financial Ledger, Audit Trail, Xử lý quan hệ Polymorphic. |
| **08** | **System Security** | `Tài Liệu/advanced_backend/8. Security.pdf` | `Tài Liệu/advanced_backend/8. Security.md` | *Vulnerability reproduction checklist* | CIA Triad, Lỗ hổng OWASP Top 10 (SQL Injection, XSS, CSRF, SSRF, IDOR), Cơ chế Authentication & Authorization (Stateful Session vs Stateless JWT, OAuth 2.0 / OIDC), Hash mật khẩu an toàn (Argon2id, Bcrypt), RBAC vs ABAC. |
| **10** | **Index 01 (Deep Dive)** | `Tài Liệu/advanced_backend/10. Index 01.pdf` *(Rỗng)* | `Tài Liệu/advanced_backend/10. Index 01.md` | *(Đã tích hợp trọn vẹn vào Bài 03 + 11 Labs)* | Chuyên đề mở rộng về tối ưu hóa câu truy vấn phức tạp, Index cho Full-Text Search / GIN, GiST, BRIN index cho time-series. |
| **11** | **Regex Engine** | `Tài Liệu/advanced_backend/11. Regex.pdf` | `Tài Liệu/advanced_backend/11. Regex.md` | *Regex benchmark scripts* | Cú pháp Regular Expression nâng cao, Cặp đối ứng Greedy vs Lazy vs Possessive, Lookahead & Lookbehind, Cơ chế hoạt động của Regex Engine (DFA vs NFA), Hiểm họa Catastrophic Backtracking (ReDoS) và cách phòng chống. |
| **12** | **Transaction & MVCC** | `Tài Liệu/advanced_backend/12. Transaction.pdf` | `Tài Liệu/advanced_backend/12. Transaction.md` | *Isolation simulation scripts* | 4 thuộc tính ACID, Cơ chế Write-Ahead Logging (WAL) & Doublewrite Buffer, 4 cấp độ cô lập (Read Uncommitted, Read Committed, Repeatable Read, Serializable), Các hiện tượng dị thường: Dirty Read, Non-repeatable Read, Phantom Read, Write Skew. |
| **13** | **Clean Code & Review** | `Tài Liệu/advanced_backend/13. Clean Code.pdf` | `Tài Liệu/advanced_backend/13. Clean Code.md` | *Review rubrics & code smell audits* | Nguyên lý SOLID, DRY, KISS, YAGNI, Nghệ thuật đặt tên biến/hàm, Xử lý Error/Exception thay vì null/magic number, Refactoring patterns, Quy trình và Tiêu chuẩn Code Review thực chiến. |
| **14** | **Locking & Concurrency** | `Tài Liệu/advanced_backend/14. Locking.pdf` | `Tài Liệu/advanced_backend/14. Locking.md` | *Concurrency lock contention labs* | Shared Lock (S) vs Exclusive Lock (X), Intent Locks (IS, IX), Record Lock, Gap Lock, Next-Key Lock (InnoDB) vs Table/Row Locks (Postgres), Xử lý Concurrency: Optimistic Locking (Version column) vs Pessimistic Locking (`SELECT FOR UPDATE`, `SKIP LOCKED`, `NOWAIT`), Phát hiện và phá Deadlock. |
| **15** | **Operating System** | `Tài Liệu/advanced_backend/15. Operating System.pdf` | `Tài Liệu/advanced_backend/15. Operating System.md` | *Process & memory inspect scripts* | Kernel Space vs User Space, System Calls, Quản lý Process & Thread, CPU Scheduling, Bộ nhớ ảo (Virtual Memory, Paging, Page Faults, Swapping, OOM Killer), I/O Models (Blocking, Non-blocking, I/O Multiplexing epoll/kqueue), Shell Scripting. |
| **16** | **System Integration** | `Tài Liệu/advanced_backend/16. Integration.pdf` | `Tài Liệu/advanced_backend/16. Integration.md` | `reports/advanced_backend/idempotency_architecture_guide.html`<br>`reports/advanced_backend/async_export_architecture_guide.html` | Thiết kế tích hợp bên thứ 3 (Cổng thanh toán, Webhooks, Message Brokers), Xử lý sự cố mạng: Retry with Exponential Backoff + Jitter, Circuit Breaker, Idempotent Consumer, Async Heavy Export Processing. |

---

## 3. Lộ Trình Học Cuốn Chiếu Đề Xuất (Recommended Study Track)

Để hấp thu kiến thức sâu nhất và tích lũy mã nguồn thành một **Mini Production Engine hoàn chỉnh**, hãy học theo 4 chặng:

```text
CHẶNG 1: NỀN TẢNG HỆ THỐNG & MẠNG (Tầng cơ sở)
   Bài 15 (Operating System) ➔ Bài 05 (Networking) ➔ Bài 11 (Regex Engine)
   [Mục tiêu]: Hiểu rõ cách CPU, RAM, I/O và Socket vận hành dưới hệ điều hành Linux.

CHẶNG 2: THIẾT KẾ CƠ SỞ DỮ LIỆU & ENGINE TẦNG SÂU (Tầng lưu trữ)
   Bài 07 (Data Modeling) ➔ Bài 03 (Index) ➔ Bài 12 (Transaction) ➔ Bài 14 (Locking)
   [Mục tiêu]: Tự tin viết câu lệnh tối ưu, đọc EXPLAIN BUFFERS, giải quyết race condition và khóa tranh chấp.

CHẶNG 3: HIỆU NĂNG CAO & BỘ ĐỆM TỐC ĐỘ (Tầng cache)
   Bài 02 (Caching Design) ➔ Bài 06 (Redis Mastery)
   [Mục tiêu]: Xây dựng hạ tầng Cache-aside bảo vệ database trước traffic lớn (chống Stampede, Avalanche).

CHẶNG 4: THIẾT KẾ PHẦN MỀM & TÍCH HỢP HỆ THỐNG (Tầng ứng dụng sản xuất)
   Bài 01 (REST API) ➔ Bài 04 (Codebase Clean Arch) ➔ Bài 13 (Clean Code) ➔ Bài 08 (Security) ➔ Bài 16 (Integration)
   [Mục tiêu]: Đóng gói toàn bộ kiến thức vào một hệ thống REST API chuẩn Clean Architecture, bảo mật, tích hợp thanh toán và xử lý bất đồng bộ.
```

---

## 4. Chuẩn Cấu Trúc Tài Liệu Mẫu (Dùng Để Setup Cho Các Khóa Còn Lại)

Khi bạn setup tài liệu cho các khóa khác (**DevOps Dokploy**, **NestJS Backend**, **Frontend Web**, v.v.), hãy áp dụng bộ khung chuẩn 4 tầng sau để toàn bộ hệ sinh thái học tập nhất quán:

```text
<ten-khoa-hoc>/
├── README.md                      # Dashboard tổng quan: mục tiêu, bảng map bài học, lộ trình học
├── Tài Liệu/advanced_backend/                      # Chứa tài liệu gốc và bản markdown chuyển đổi
│   ├── 01. <ten-bai>.pdf
│   ├── 01. <ten-bai>.md
│   └── assets/                    # Ảnh trích xuất từ slide/tài liệu gốc
├── labs/                          # Code thực hành cô đọng, tự chạy và tự đo được
│   ├── lesson-01/
│   │   ├── package.json
│   │   └── lab-01.mjs
├── reports/advanced_backend/                       # Báo cáo chuyên sâu, Teacher Guides (HTML/MD), Diagram giải thích kiến trúc
└── summaries/                     # Bản tóm tắt nhanh dạng "Cheat Sheet" cô đọng trước khi đi phỏng vấn
```
