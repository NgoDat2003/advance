---
handoff-version: 1
generated: 2026-10-16T11:30:00Z
generator: ak:handoff@2.0.0
focus: "Tổng kết Bài 1 (REST API Design) và chuyển giao sang Bài 2 (Caching Design)"
workspace: D:/học/advance-be
branch: Not captured in this session
head: Not captured in this session
---

# HANDOFF: Tổng kết Bài 1 (REST API Design) & Sẵn sàng cho Bài 2 (Caching Design)

## Mission and current status
- **Focus:** "Tổng kết Bài 1 (REST API Design) và chuyển giao sang Bài 2 (Caching Design)"
- **Outcome:** Đạt đã nắm vững 100% bản chất kỹ thuật của 3 bài toán kiến trúc lõi trong Bài 1 (`1. REST API Design.md`), đã dựng xong phòng Lab thực nghiệm trên PostgreSQL local (`advance_be_lab`) với 13 triệu dòng IMDb và 2 triệu dòng đơn hàng, và sẵn sàng chuyển tiếp sang Bài 2 (`2. Caching Design.md`).
- **Done:**
  - Nghiên cứu khảo sát thị trường tuyển dụng IT Việt Nam (215 bài tuyển dụng, dải lương, deal-makers) bằng phương thức `--ultra`.
  - Thẩm định chuyên sâu năng lực của Đạt qua 102.647 dòng code solo ở repo `quan_ly_hop_dong` (Maycha F&B) và 307 sessions OMP: Xếp hạng **High-Mid (Cận Senior, Level 2.3/3.0)**, làm chủ toàn diện vòng đời sản phẩm, kiến trúc Turborepo Monorepo NestJS + Next.js App Router, ERP SAP.
  - Hoàn thành **Lab 1.1 (Deep Paging):** Phân tích và đo đạc thực tế sự chênh lệch giữa Naive Offset (41ms - 1s), Deferred Join (36ms - 111ms, nhanh gấp 3-40 lần) và Cursor-based Pagination (0.09ms - 1ms, nhanh gấp 169-4.400 lần).
  - Hoàn thành **Lab 1.2 (Idempotency Key):** Làm chủ State Machine (`PENDING` -> `COMPLETED`), cơ chế băm SHA-256 Request Body chống giả mạo payload, quy tắc quản lý TTL của Redis (Lock 60s vs Retention 24h), và các mã HTTP chuẩn (201, 200, 409, 422).
  - Hoàn thành **Lab 1.3 (Async Export API):** Nắm vững mô hình Async Polling với mã `202 Accepted` cho file 500MB, chống 504 Gateway Timeout và OOM Crash cho Node.js.
  - Thiết lập môi trường Lab độc lập trên PostgreSQL Docker: Database `advance_be_lab` kết nối trực tiếp vào DBX qua connection `ADVANCE_BE_LAB`, nạp sẵn 12.866.977 bộ phim IMDb và 1.721.260 ratings.
- **Remaining:**
  - Bắt đầu nghiên cứu và thực hành **Bài 2: Caching Design (`Tài Liệu/2. Caching Design.md`)**.
- **Urgency:** Normal / Học tập nâng cao năng lực cuối tuần.

## Scope and guardrails
- **Workspace:** `D:/học/advance-be`
- **In scope:** Giáo trình `advance-be` (`Tài Liệu/*.md`), môi trường thực hành `advance_be_lab` trên Docker PostgreSQL local (`localhost:5433`).
- **Out of scope:** Không sửa đổi mã nguồn hay dữ liệu sản xuất của Maycha (`D:/work/maycha/quan_ly_hop_dong`). Không chạy query ghi/sửa trên máy chủ `DBTG` (`172.16.4.10`).
- **Constraints:** Project-local only (tuân thủ `AGENTS.md`), mọi file sinh ra lưu trong `D:/học/advance-be`.
- **Safety boundaries:** Tuyệt đối không chạy lệnh DDL hay thao tác ghi trên DBTG; mọi bài lab tra tấn tải cao, khóa bảng, deadlock đều chạy 100% trên `advance_be_lab` local.

## Current state
- **Branch:** Not captured in this session
- **HEAD:** Not captured in this session
- **Working tree:** Not captured in this session (Thư mục học tập không dùng git repo)
- **Changed files:**
  - `reports/VIETNAM_IT_RECRUITMENT_RADAR_REPORT_2026.md` (35KB master report)
  - `reports/VIETNAM_IT_RECRUITMENT_RADAR_REPORT_2026.html` (72KB interactive dashboard)
  - `reports/idempotency_diagram.html` & `.svg`
  - `reports/idempotency_architecture_guide.html` (Interactive Simulator)
  - `reports/async_export_architecture_guide.html` (Progress bar simulator)
- **Untracked files:** Not captured in this session
- **Intentional local modifications:** yes

## Decisions and rationale
- **Quyết định 1 — Không học lý thuyết suông bằng video mà học qua Thực Nghiệm Bản Chất (Empirical Experimentation):** 
  - *Lý do:* Đạt đã làm chủ 100k LOC Maycha, xem video 1-2 tiếng chỉ lặp lại cú pháp cơ bản. Dùng PostgreSQL thực nghiệm đo `EXPLAIN ANALYZE` và tái hiện hiện tượng giúp ghi nhớ vĩnh viễn và hiểu thấu đáo bản chất.
- **Quyết định 2 — Tạo Database độc lập `advance_be_lab` trên PostgreSQL local:**
  - *Lý do:* Tránh gây ảnh hưởng đến dữ liệu `maycha_lease` của công ty; tự do drop/truncate bảng và stress test triệu dòng.
- **Quyết định 3 — Nạp bộ dữ liệu IMDb Official (12.8M titles, 1.7M ratings):**
  - *Lý do:* File nén chỉ 218MB tải trong 11 giây, nạp vào mất 1.8GB vừa vặn với ổ D (còn 7.7GB trống), cung cấp sân tập dữ liệu thật có ý nghĩa nghiệp vụ.
- **Quyết định 4 — Sau Bài 1 (REST API Design) đi tuần tự sang Bài 2 (Caching Design):**
  - *Lý do:* Bài 2 giải quyết trực tiếp tầng Caching (Cache-Aside, Cache Stampede, Redis) vốn vừa được đề cập ở phần Idempotency của Bài 1, tạo mạch logic liên tục trước khi sang Bài 3 (Index).

## Work performed
- Bóc tách và thẩm định 215 tin tuyển dụng IT Việt Nam, trích xuất dải lương thực tế và ma trận công nghệ (TypeScript 94.4%, NestJS 83.7%, Next.js 61.4%).
- Khảo sát mã nguồn `D:\work\maycha\quan_ly_hop_dong` (102.647 LOC, 147 commits solo) và 307 sessions OMP, xây dựng báo cáo định hướng sự nghiệp cá nhân hóa.
- Khởi động container `quan_ly_hop_dong-postgres-1`, tạo database `advance_be_lab`, thêm connection `ADVANCE_BE_LAB` vào DBX.
- Tạo các schema: `lab01_rest_api`, `lab03_indexing`, `lab12_transaction`, `lab14_locking`, `lab_imdb`.
- Thực hiện đo kiểm `EXPLAIN (ANALYZE, BUFFERS)` phân trang: Naive Offset (41.4ms) vs Deferred Join (36.4ms) vs Cursor (0.09ms).
- Kiểm chứng đối soát trên máy chủ thật DBTG (`IPOS_SAP.dbo.SalesData_H` 7.6M rows): Naive Offset (9.903ms) vs Deferred Join (244ms) vs Cursor (119ms).
- Lập trình hàm `lab01_rest_api.create_order_idempotent` kiểm chứng 3 kịch bản Idempotency (First execution 201, Replay 200, Conflict 409, TTL Expire).
- Tải 219MB IMDb dataset từ HTTPS và nạp thành công 12.866.977 bộ phim vào `lab_imdb.titles` và 1.721.260 bản ghi vào `lab_imdb.ratings`.
- Xuất bản 3 file HTML hướng dẫn kiến trúc tương tác tại `reports/`.
- 0 redactions applied.

## Verification
| Check | Command / Query | Outcome | When |
| :--- | :--- | :--- | :--- |
| Test Web Suite Maycha | `pnpm test lib/chunk-recovery.spec.ts` | 9 passed, 9 total | Early session |
| Test API Suite Maycha | `pnpm test src/common/guards/origin-check.guard.spec.ts` | 7 passed, 7 total | Early session |
| DBX ADVANCE_BE_LAB | `SELECT count(*) FROM lab_imdb.titles;` | 12,866,977 rows | Mid session |
| Idempotency Key Scenarios | Stored Procedure `create_order_idempotent` | 201 Created -> 200 Replay -> 409 Conflict | Mid session |
| IMDb Deep Pagination | `EXPLAIN (ANALYZE, BUFFERS)` 1M Offset | Naive 1034ms -> Deferred 111ms -> Cursor 0.23ms | Mid session |

Not run:
- Không chạy stress test ghi dữ liệu trên DBTG (Lý do: Bảo vệ an toàn dữ liệu sản xuất Maycha).

## Open risks and blockers
- **Risk 1:** Dung lượng ổ `D:\` hiện còn khoảng 5.5 GB trống sau khi nạp IMDb (1.9 GB). Cần lưu ý không tải thêm các dataset lớn vượt quá 3 GB.
  - *Type:* Risk | *Owner:* Đạt | *Impact:* Thấp/Trung bình.
- **Risk 2:** Khi thực hành Caching ở Bài 2 cần Redis service chạy local.
  - *Type:* Dependency | *Owner:* Agent / Đạt | *Impact:* Thấp (có thể chạy Redis container nhanh chóng).

## Exact next actions
1. **First safe step**: Mở file giáo trình `D:\họcdvance-be\Tài Liệu. Caching Design.md` đọc lướt 10 phút để nắm các mô hình Caching (Cache-Aside, Write-Through, Write-Behind) và các hiện tượng lỗi kinh điển (Cache Avalanche, Cache Stampede, Cache Penetration).
2. Kiểm tra container Redis local: `docker ps` xem Redis đã chạy trên port 6379 chưa, nếu chưa có thì khởi động bằng docker compose.
3. Dựng Lab 2.1: Triển khai mô hình **Cache-Aside** với PostgreSQL `advance_be_lab` và Redis.
4. Dựng Lab 2.2: Tái hiện hiện tượng **Cache Stampede (Thảm họa đàn bò giẫm đạp)** khi key hết hạn và cách dùng **Mutex Lock (Singleflight)** để bảo vệ database.

## Source pointers
- Giáo trình Bài 2: `Tài Liệu/2. Caching Design.md`
- Giáo trình Bài 1: `Tài Liệu/1. REST API Design.md`
- Báo cáo định hướng nghề nghiệp: `reports/VIETNAM_IT_RECRUITMENT_RADAR_REPORT_2026.md`
- Dashboard tương tác thị trường: `reports/VIETNAM_IT_RECRUITMENT_RADAR_REPORT_2026.html`
- Bản đồ tương tác Idempotency: `reports/idempotency_architecture_guide.html`
- Bản đồ tương tác Async Export: `reports/async_export_architecture_guide.html`
- Database thực hành: `advance_be_lab` trên kết nối DBX `ADVANCE_BE_LAB` (PostgreSQL 16, port 5433).
