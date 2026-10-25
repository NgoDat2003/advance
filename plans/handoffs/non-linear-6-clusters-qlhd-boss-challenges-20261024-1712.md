---
handoff-version: 1
generated: 2026-10-24T17:12:00+07:00
generator: ak:handoff@2.0.0
focus: "tổng kết lại đi để sau này tới mốc sẽ bik"
workspace: D:/study/advance-be
branch: main
head: 35ad5c0c86a5ce90fb69a293cd7be8cb74f78ebe
---

# HANDOFF: Lộ trình 6 Cụm Phi Tuyến Tính & Mô hình 2 Tầng (Micro-Labs + Phẫu thuật Code AI trên `quan-ly-hop-dong`)

## Mission and current status
- **Focus:** "tổng kết lại đi để sau này tới mốc sẽ bik"
- **Outcome:** Chốt kiến trúc học tập toàn diện cho 39 chuyên đề thuộc 3 khóa học (`Advanced Backend`, `System Design Roninhub`, `Kafka Mastery 2025`) theo **Lộ trình Phi tuyến tính 6 Cụm (6 Thematic Clusters)** kết hợp **Mô hình Thực hành 2 Tầng**:
  1. **Tầng 1 (Micro-Labs ở từng bài lẻ trong `D:/study/advance-be/labs/lesson-*`):** Hiểu nhanh cơ chế gốc (Internals) trong 45–60 phút qua thực nghiệm trực tiếp trên DBX / `psql` / Node.js tinh gọn, giảm phụ thuộc vào việc chỉ điền đáp án trắc nghiệm `homework-*.mine.mjs`.
  2. **Tầng 2 (Cluster Boss Challenge ở cuối mỗi cụm 3–5 bài):** Dùng chính bản clone dự án thật `D:/study/job/quan-ly-hop-dong` (vốn do AI viết 100% trước đây, dùng NestJS 10 + Prisma 7 + PostgreSQL 16) làm "Bàn mổ Thực hành" cho 70% chuyên đề đúng domain ERP/Hợp đồng (và dùng Mini-Sandbox độc lập cho 30% chuyên đề System Design ngoài domain). Ở mỗi mốc cuối cụm: **Audit Code AI -> Bắn Stress/Chaos Test làm nổ lỗi thật -> Đạt tự tay Refactor -> Trả lời 3 câu hỏi Phản biện CTO**.
- **Done:**
  - Hoàn thành **Bài 01 (REST API Design):** Deep Pagination (Offset vs Deferred Join vs Cursor), Idempotency Key State Machine, Async Export.
  - Hoàn thành **Bài 02 (Caching Design):** Cache-Aside, Singleflight chống Stampede, TTL Jitter chống Avalanche, Null Cache & Bloom Filter chống Penetration, Race Condition xóa Cache sau Commit.
  - Hoàn thành **Bài 03 (Database Index):** 11 ESM labs đo đạc `EXPLAIN (ANALYZE, BUFFERS)` trên 500k dòng hợp đồng (`B-Tree`, `Heap TID`, `HOT Update`, `Leftmost-Prefix Composite Index`, `Covering Index INCLUDE`, `Index Bloat`).
  - Đang triển khai **Bài 12 (Database Transaction, WAL Logging & MVCC Internals)** tại `labs/lesson-12-transaction/`.
  - Hoàn tất khảo sát thực tế mã nguồn bản clone `D:/study/job/quan-ly-hop-dong` và phát hiện **4 nhóm lỗi thật do AI sinh ra** để làm đề bài cho các mốc Cluster Boss Challenges.
- **Remaining:**
  - Hoàn thiện nốt các Micro-Labs của **Cụm 1** (`Bài 12 Transaction/MVCC` -> `Bài 14 Locking & Deadlock` -> `Bài 07 Double-Entry Data Modeling`).
  - Thực hiện **Mốc 1 (Cluster 1 Boss Challenge):** Phẫu thuật `schema.prisma`, `lease-contracts-termination.service.ts` và `sap-export-workflow.service.ts` của `quan-ly-hop-dong`.
  - Lần lượt thực hiện **Cụm 2, 3, 4, 5, 6** và các mốc **Cluster Boss Challenges 2..6** theo bảng bản đồ các mốc bên dưới.
- **Urgency:** Normal — Kim chỉ nam xuyên suốt toàn bộ quá trình học và nâng cấp dự án đi phỏng vấn Senior (35M–50M+).

## Scope and guardrails
- **Workspace:** `D:/study/advance-be` (kết hợp tham chiếu / thực hành trên bản clone an toàn tại `D:/study/job/quan-ly-hop-dong`).
- **In scope:**
  - Toàn bộ 39 chuyên đề của 3 khóa học trong `D:/study/advance-be/Tài Liệu/`.
  - Các Micro-Labs từng bài tại `D:/study/advance-be/labs/lesson-*`.
  - Các bài tập tổng hợp cuối cụm (Cluster Boss Challenges) tại `D:/study/advance-be/labs/cluster-challenges/` và áp dụng bản vá chuẩn Senior sang bản clone `D:/study/job/quan-ly-hop-dong/apps/api/`.
- **Out of scope:**
  - Không học tuần tự tuyến tính từ bài 1 đến bài 39 theo số thứ tự slide gốc.
  - Không ngồi xem thụ động trọn vẹn các video bài giảng dài 2 tiếng (chỉ dùng video làm L3 Cache tua đúng đoạn cần xem tối đa 5 phút).
  - Không tự build một dự án CRUD mới từ con số 0 gây lãng phí thời gian.
  - Không nhồi nhét các bài toán ngoài domain B2B Lease Management (như URL Shortener, Threads Newsfeed, LMAX Disruptor) vào repo `quan-ly-hop-dong` (những bài này bắt buộc làm trên Mini-Sandbox độc lập trong `D:/study/advance-be/labs/`).
  - Không tốn thời gian sửa giao diện Frontend (`apps/web`) khi làm các bài tập Backend Internals & System Design.
- **Constraints:**
  - Tuân thủ tuyệt đối `AGENTS.md`:
    1. **Project-Local Only:** Mọi script kiểm thử, báo cáo, hướng dẫn, dữ liệu trích xuất sinh ra trong quá trình học phải nằm trong `D:/study/advance-be`. Không ghi ra thư mục Global (`~`, `%USERPROFILE%`, `AppData`).
    2. **Anti Over-Engineering:** Cấm viết các bộ thư viện/harness/DSL điều phối lab trừu tượng cồng kềnh làm học viên ngợp; code thực hành phải cực kỳ tinh gọn, trực quan, comment tiếng Việt rõ ràng.
    3. **Walkthrough -> Hands-on Challenge:** Phần 1 AI làm mẫu ngắn gọn; Phần 2 Đạt tự tay gõ code/SQL/cấu hình và test trực quan trên DBX, `psql`, Postman/cURL, Stress Script.
- **Safety boundaries:**
  - Tuyệt đối không in hoặc lưu mật khẩu container PostgreSQL (`quan-ly-hop-dong-postgres-1`) ra màn hình hay vào bất kỳ file nào.
  - Khi chạy các bài Stress Test bắn tải cao, khóa bảng, tạo Deadlock hoặc xóa/tạo lại dữ liệu, luôn chạy trên database/schema test (`advance_be_lab` trên `localhost:5433`), không phá hủy dữ liệu gốc khi chưa backup/seed.

## Current state
- **Branch:** `main`
- **HEAD:** `35ad5c0c86a5ce90fb69a293cd7be8cb74f78ebe`
- **Working tree:** dirty (`staged 0, unstaged 5, untracked 34`)
- **Changed files:**
  - `D plans/261024-1435-lesson-12-transaction-teacher-guide/phase-01-start.md`
  - `M plans/261024-1435-lesson-12-transaction-teacher-guide/plan.md`
  - `M plans/261024-1435-lesson-12-transaction-teacher-guide/reports/planner-ultra-candidate-1.md`
  - `M plans/261024-1435-lesson-12-transaction-teacher-guide/reports/planner-ultra-candidate-4.md`
  - `M plans/261024-1435-lesson-12-transaction-teacher-guide/reports/planner-ultra-candidate-5.md`
- **Untracked files:**
  - `labs/lesson-12-transaction/` (`00-setup-dataset.mjs`, `01-atomicity-pg-rules.mjs`, `02-wal-records.mjs`, `check-lab-state.mjs`, `homework-predictions.mine.mjs`, `homework-runner.mjs`, `package.json`, `package-lock.json`, `scenarios.mjs`, `tx-kit.mjs`, `tx-runner.mjs`)
  - `plans/261024-1435-lesson-12-transaction-teacher-guide/delegate-brief.md`
  - `plans/261024-1435-lesson-12-transaction-teacher-guide/lab-runs/`
  - `plans/261024-1435-lesson-12-transaction-teacher-guide/phase-01-preflight-and-scaffold.md` .. `phase-10-test-gate-docs-final.md`
  - `plans/261024-1435-lesson-12-transaction-teacher-guide/plan-verdict.md`
  - `plans/261024-1435-lesson-12-transaction-teacher-guide/verify/`
- **Intentional local modifications:** yes (in-progress Lesson 12 teacher guide & lab scaffolding).

## Decisions and rationale

| Quyết định | Lý do & Bằng chứng | Phương án đã loại bỏ | Tham chiếu |
| :--- | :--- | :--- | :--- |
| **1. Học Phi tuyến tính theo 6 Cụm Chuyên Đề (Thematic Clusters)** | Giữ mạch nhận thức liên tục (ví dụ học xong B-Tree & Heap Tuple ở Bài 03 nhảy thẳng sang MVCC `xmin`/`xmax` ở Bài 12 và Row Lock ở Bài 14 với 0% chi phí chuyển ngữ cảnh). | Học tuần tự từ Bài 01 đến Bài 16 rồi mới sang Khóa 2, Khóa 3 (gây đứt gãy nhận thức). | `reports/LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.md`, `reports/candidate_a_thematic_pillars_roadmap.md` |
| **2. Bổ sung "Bài toán Khó Nghiệp vụ Thật (Cluster Boss Challenge)" ở cuối mỗi cụm** | Làm lab đơn lẻ từng bài giúp hiểu cơ chế riêng rẽ nhưng thiếu sự va đập giữa các cơ chế (Index đụng độ Lock, Cache đụng độ ACID). Chặn cuối mỗi cụm bằng 1 bài toán tổng hợp buộc học viên phải cân đo đánh đổi (trade-off). | Chỉ làm các bài Micro-Lab rời rạc và điền phiếu trắc nghiệm `homework-*.mine.mjs` suốt 39 bài. | Phiên tư vấn `ak:advise` (2026-10-24) |
| **3. Dùng chính bản clone `D:/study/job/quan-ly-hop-dong` (70% đúng domain) + Mini-Sandbox (30% ngoài domain)** | `quan-ly-hop-dong` đã được clone ra riêng và **100% do AI viết**. Trong code hiện có sẵn các bug thật của AI (4 cặp Index dư thừa, TOCTOU mất khóa, Double SAP Export). Tự tay bắt bệnh và sửa lại `qlhd` sau mỗi cụm giúp Đạt làm chủ 100% dự án trong CV, xóa tử huyệt bị hỏi xoáy khi phỏng vấn. | (a) Tự build 1 dự án mới từ con số 0 (tốn thời gian dựng lại CRUD); (b) Nhồi nhét cả URL Shortener / Newsfeed vào `qlhd` (gây Over-Engineering). | `D:/study/job/quan-ly-hop-dong/apps/api/` |
| **4. Định dạng mỗi Cluster Boss Challenge: "Broken Production + Stress Test + Phản biện CTO"** | Có script bắn tải đồng thời (50–100 req) làm nổ lỗi thật (âm tiền, xuất đúp SAP, Deadlock, chậm query) -> Đạt tự soi DBX sửa code cho tới khi xanh 100% -> Trả lời 3 câu hỏi xoáy của CTO để luyện phản xạ phỏng vấn. | Viết lại toàn bộ từ trang trắng không có bộ khung hoặc chỉ đọc code bằng mắt mà không bắn tải kiểm chứng. | `AGENTS.md` (Mục 2 & 3) |

### Bản Đồ 6 Mốc Kiểm Soát (Milestones) Xuyên Suốt Lộ Trình

Để khi học tới bất kỳ mốc nào chỉ cần mở file này ra là biết ngay việc cần làm:

1. **MỐC CỤM 1 — Database Storage, Concurrency & Ledger (`K1: Bài 03 [Done] -> Bài 12 [In-progress] -> Bài 14 -> Bài 07`):**
   - *Khi chạm mốc cuối Cụm 1, mở ngay `D:/study/job/quan-ly-hop-dong` thực hiện **Boss Challenge 1**:*
     - **Mục tiêu 1.1 (`apps/api/prisma/schema.prisma` dòng 269–363):** Dọn sạch 4 cặp B-Tree Index dư thừa trùng tiền tố trái (Leftmost-Prefix) do AI sinh ra:
       - `LeaseContract`: đang trùng `@@index([status])` và `@@index([status, endDate])`.
       - `PaymentSchedule`: đang trùng 3 tầng `@@index([leaseContractId])`, `@@index([leaseContractId, status])`, `@@index([leaseContractId, status, periodEnd])` VÀ cặp `@@index([status])`, `@@index([status, paidSource])`.
       - `SapExportLog`: đang trùng `@@index([leaseContractId])` và `@@index([leaseContractId, exportPeriod])`.
     - **Mục tiêu 1.2 (`lease-contracts-termination.service.ts` dòng 36–82):** Sửa lỗi **TOCTOU / Lost Update** trong `terminateContract` (hiện AI đang đọc `findUnique` và check `status !== ACTIVE` ở ngoài `$transaction` mà không có `SELECT ... FOR UPDATE`).
     - **Mục tiêu 1.3 (`sap-export-workflow.service.ts` dòng 38–88):** Sửa lỗi **Read-Outside-Lock gây Double SAP Export** trong `executeImportExport` (hiện AI gọi `prepareExportItemsAndFiles` và `validateAnchorTrapping` trước khi mở `$transaction`, sau khi khóa `FOR UPDATE` lại không kiểm tra lại `status === PENDING` trước khi `sapExportLog.createMany`).
2. **MỐC CỤM 2 — High-Load API, Caching & Traffic Control (`K1: Bài 01 [Done], Bài 02 [Done], Bài 06 Redis -> K2: Bài 04 Rate Limiting`):**
   - *Khi chạm mốc cuối Cụm 2, thực hiện **Boss Challenge 2** trên `qlhd`:*
     - **Mục tiêu 2.1 (`payment-schedules.service.ts` dòng 54–85):** Phẫu thuật hàm `findAll` đang dùng phân trang `skip = (page - 1) * limit` và kéo mảng `exportedContractIds` lên RAM.
     - **Mục tiêu 2.2:** Bọc **Redis Idempotency-Key (SHA-256 body hash + Redis Lock)** cho API `executeImportExport` và `terminateContract`.
     - **Mục tiêu 2.3:** Bọc **Cache-Aside + Singleflight + Delete-after-Commit** cho `sap-master-data` và `dashboard`, kèm Redis Lua Token Bucket Rate Limiting.
3. **MỐC CỤM 3 — Clean Architecture, Resilience & Security (`K1: Bài 04, 13, 16, 08, 11`):**
   - *Khi chạm mốc cuối Cụm 3, thực hiện **Boss Challenge 3** trên `qlhd`:*
     - **Mục tiêu 3.1 (`ocr-sanitizer.util.ts`):** Kiểm toán và vá nguy cơ **Regex ReDoS (Catastrophic Backtracking)** trong bộ lọc văn bản OCR hợp đồng do AI viết.
     - **Mục tiêu 3.2 (`lease-contracts-attachment.service.ts` & `pii-masker.util.ts`):** Rà soát lỗ hổng **IDOR** khi truy cập file hợp đồng MinIO và dữ liệu nhạy cảm chủ nhà.
     - **Mục tiêu 3.3:** Bọc **Exponential Backoff + Full Jitter & Circuit Breaker** cho luồng gọi OCR và đồng bộ SAP.
4. **MỐC CỤM 4 — OS/Network Internals & Kafka Core Engine (`K1: Bài 15, 05 -> K3: Bài 01..08`):**
   - *Khi chạm mốc cuối Cụm 4, thực hiện **Boss Challenge 4**:*
     - Dựng cụm **Kafka KRaft (không ZooKeeper)** trên Docker local; thiết kế Producer an toàn (`acks=all`, `enable.idempotence=true`) phân vùng theo `contractId` và Consumer tách biệt Heartbeat Thread / Worker Pool chống lỗi Rebalance Loop khi xử lý báo cáo hợp đồng nặng.
5. **MỐC CỤM 5 — Distributed Transactions, Outbox CDC & Streaming (`K3: Bài 09, 10, 11..13 -> K2: Bài 06 Saga`):**
   - *Khi chạm mốc cuối Cụm 5, thực hiện **Boss Challenge 5**:*
     - **Trên `qlhd`:** Thiết kế bảng `sap_outbox_events` ghi cùng Transaction với `payment_schedules` và dùng **Debezium CDC** đọc WAL Postgres đẩy sang Kafka (triệt tiêu hoàn toàn lỗi Dual-Write khi đồng bộ SAP ERP).
     - **Trên Mini-Sandbox (`advance-be/labs/`):** Xây dựng pipeline phát hiện giao dịch thanh toán bất thường thời gian thực (Sliding Window Fraud Detection) + luyện bộ đề CCDAK.
6. **MỐC CỤM 6 — System Design At Scale & Case Studies (`K2: Bài 01, 02, 03, 05, 07, 08, 09, 10`):**
   - *Khi chạm mốc cuối Cụm 6, thực hiện **Boss Challenge 6 (Mini-Sandbox độc lập)**:*
     - Thực hành **Range Partitioning** cho bảng `audit_logs` / `payment_schedules` quy mô chục triệu dòng.
     - Giải trọn vẹn 2 bài tập phỏng vấn System Design kinh điển trong 35 phút/bài: **URL Shortener (Bitly)** và **Microblogging Newsfeed (Threads - Celebrity Fan-out với Redis ZSET)**.

## Work performed
- Khảo sát cấu trúc workspace `D:/study/advance-be` (`README.md`, `AGENTS.md`, `labs/lesson-02-caching`, `labs/lesson-03-index`, `labs/lesson-12-transaction`, `reports/LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.md`, `reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md`, `reports/candidate_a_thematic_pillars_roadmap.md`, `reports/candidate_d_cumulative_engine_build_roadmap.md`).
- Khảo sát trực tiếp mã nguồn dự án clone tại `D:/study/job/quan-ly-hop-dong/apps/api/` (`package.json`, `src/app.module.ts`, `src/modules/README.md`, `prisma/schema.prisma`, `src/modules/lease-contracts/services/lease-contracts-lifecycle.service.ts`, `lease-contracts-termination.service.ts`, `lease-contracts-addendum-state.service.ts`, `src/modules/payment-schedules/payment-schedules.service.ts`, `src/modules/sap-export/services/sap-export-workflow.service.ts`).
- Xác minh stack thực tế của `quan-ly-hop-dong`: sử dụng **Prisma 7 (`@prisma/client ^7.9.0`, `@prisma/adapter-pg ^7.9.0`) + NestJS 10 + PostgreSQL 16** (đính chính lại ghi chú cũ trong `plans/261024-1435-lesson-12-transaction-teacher-guide/evidence-packet.md` từng ghi nhầm là TypeORM).
- Phát hiện và trích xuất 4 nhóm lỗi thật do AI viết trong `quan-ly-hop-dong` (Redundant Leftmost-Prefix Indexes trong `schema.prisma`, TOCTOU trong `terminateContract`, Read-Outside-Lock Double Export trong `executeImportExport`, Naive Offset trong `payment-schedules.service.ts`).
- Thực hiện quy trình tư vấn `ak:advise` qua 4 vòng phỏng vấn 1-câu-hỏi, chốt Reframing, Visual Preview và xuất bản kế hoạch hành động 6 Cụm kèm Handoff Brief.
- Chạy các lệnh kiểm tra trạng thái Git (`git rev-parse`, `git status --short`) phục vụ đóng gói handoff.
- 0 redactions applied.

## Verification
| Check | Command / Action | Outcome | When |
| :--- | :--- | :--- | :--- |
| Kiểm tra cấu trúc `quan-ly-hop-dong` | Đọc `D:/study/job/quan-ly-hop-dong/apps/api/package.json` & `prisma/schema.prisma` | Xác nhận dùng Prisma 7.9.0 + PostgreSQL; phát hiện 4 cặp Index trùng Leftmost-Prefix | Trong phiên `ak:advise` |
| Kiểm tra Concurrency ở `sap-export` | Đọc `sap-export-workflow.service.ts:37-91` | Xác nhận `prepareExportItemsAndFiles` nằm ngoài `$transaction` và thiếu re-check `status = PENDING` sau `FOR UPDATE` | Trong phiên `ak:advise` |
| Kiểm tra Concurrency ở `termination` | Đọc `lease-contracts-termination.service.ts:35-95` đối chiếu `lease-contracts-addendum-state.service.ts:70-93` | Xác nhận `terminateContract` kiểm tra `status !== ACTIVE` ngoài `$transaction` và thiếu `FOR UPDATE` | Trong phiên `ak:advise` |
| Kiểm tra Git Workspace State | `git rev-parse --is-inside-work-tree && git status --short` | Repo `D:/study/advance-be` ở nhánh `main` (`35ad5c0`), 5 file unstaged, 34 mục untracked thuộc `lesson-12-transaction` | Trước khi tạo handoff |

Not run:
- Chưa chạy script bắn tải đồng thời (`chaos-test.mjs`) lên `terminateContract` và `executeImportExport` (Lý do: Phiên này thực hiện `ak:advise` và `ak:handoff` chỉ đọc và lập kế hoạch; bước chạy Stress Test sẽ thực hiện khi bắt đầu Mốc Cụm 1).

## Open risks and blockers
- **Type:** risk | **Owner:** Agent / Đạt | **Impact:** Trong `plans/261024-1435-lesson-12-transaction-teacher-guide/` hiện có một số ghi chú cũ tưởng nhầm `quan-ly-hop-dong` dùng TypeORM, trong khi code thực tế tại `D:/study/job/quan-ly-hop-dong/apps/api/package.json` dùng **Prisma 7 (`@prisma/client ^7.9.0`)**. Khi hoàn thiện Bài 12 và làm Cluster Boss Challenge 1, cần bám sát cú pháp `prisma.$transaction` và `tx.$queryRaw` của Prisma 7 để khớp 100% với dự án thật của Đạt.
- **Type:** risk | **Owner:** Agent | **Impact:** Các file lab trong `labs/lesson-12-transaction/` đang dựng dở theo hướng dùng nhiều file harness (`tx-kit.mjs`, `tx-runner.mjs`, `homework-predictions.mine.mjs`). Cần giữ cho trải nghiệm thực hành của Đạt tinh gọn, trực quan trên DBX/`psql` đúng quy tắc `AGENTS.md`, không để bộ khung script làm lu mờ bản chất SQL/MVCC.

## Exact next actions
1. **First safe step** — Hoàn thiện và chạy thực nghiệm **Bài 12 (Database Transaction, WAL Logging & MVCC Internals)** tại `labs/lesson-12-transaction/` trên database `advance_be_lab` (`localhost:5433`), đồng thời cập nhật phần liên hệ ORM từ TypeORM sang đúng **Prisma 7 (`prisma.$transaction`)** như trong `D:/study/job/quan-ly-hop-dong`.
2. Tiếp tục học và thực hành Micro-Lab của **Bài 14 (Database Locking, `SELECT FOR UPDATE` & Triệt tiêu Deadlock `40P01`)** và **Bài 07 (Data Modeling & Double-Entry Ledger)** để khép lại phần lý thuyết của **Cụm 1**.
3. Ngay khi xong Bài 07 (chạm **Mốc Cụm 1**), khởi tạo `D:/study/advance-be/labs/cluster-01-qlhd-concurrency/` và thực hiện **Boss Challenge 1**:
   - Viết script bắn tải đồng thời tái hiện lỗi **TOCTOU** ở `lease-contracts-termination.service.ts` và lỗi **Double SAP Export** ở `sap-export-workflow.service.ts`.
   - Để Đạt tự tay sửa 4 cặp Index dư thừa trong `schema.prisma`, sửa 2 hàm Transaction/Locking trên cho tới khi pass 100% Stress Test và trả lời 3 câu hỏi phản biện CTO.
4. Sau khi pass Mốc Cụm 1, áp dụng bản vá vào `D:/study/job/quan-ly-hop-dong`, ghi nhận số liệu Trước/Sau vào sổ tay ôn tập phỏng vấn và chuyển sang **Cụm 2 (Caching, Idempotency & Rate Limiting)**.

## Source pointers
- Quy tắc cốt lõi của workspace: `AGENTS.md`
- Báo cáo tổng quan 3 khóa học: `reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md`
- Lộ trình 30 ngày & các phương án: `reports/LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.md`, `reports/candidate_a_thematic_pillars_roadmap.md`, `reports/candidate_d_cumulative_engine_build_roadmap.md`
- Thư mục Lab Bài 02, 03, 12: `labs/lesson-02-caching/`, `labs/lesson-03-index/`, `labs/lesson-12-transaction/`
- Kế hoạch Bài 12 đang thực hiện: `plans/261024-1435-lesson-12-transaction-teacher-guide/plan.md`
- Bản clone dự án thật dùng để thực hành các mốc cuối cụm:
  - Schema & Indexes: `D:/study/job/quan-ly-hop-dong/apps/api/prisma/schema.prisma`
  - Luồng thanh lý hợp đồng (lỗi TOCTOU): `D:/study/job/quan-ly-hop-dong/apps/api/src/modules/lease-contracts/services/lease-contracts-termination.service.ts`
  - Luồng tạo phụ lục (mẫu đã có `FOR UPDATE`): `D:/study/job/quan-ly-hop-dong/apps/api/src/modules/lease-contracts/services/lease-contracts-addendum-state.service.ts`
  - Luồng xuất SAP ERP (lỗi Read-Outside-Lock): `D:/study/job/quan-ly-hop-dong/apps/api/src/modules/sap-export/services/sap-export-workflow.service.ts`
  - Luồng truy vấn lịch thanh toán (lỗi Offset & In-Memory IDs): `D:/study/job/quan-ly-hop-dong/apps/api/src/modules/payment-schedules/payment-schedules.service.ts`
