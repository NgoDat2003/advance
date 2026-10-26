---
handoff-version: 1
generated: 2026-10-26T17:30:00+07:00
generator: ak:handoff@2.0.0
focus: "Chốt Master Roadmap Vừa Học Vừa Build 'OmniPOS & FinLedger Hub' (39/39 bài, 6 Cụm, 26/10 -> 14/12) + Tiến độ Bài 12 Chặng 6"
workspace: D:/học/advance-be
branch: main
---

# HANDOFF: Lộ Trình Toàn Diện "Vừa Học Vừa Build" `OmniPOS & FinLedger Hub` (39/39 Bài) & Tiếp Nối Bài 12 (Chặng 6–8)

## 1. Tóm tắt các Quyết định Chiến lược đã chốt (Single Source of Truth)

1. **Đề tài Dự án Chủ lực đưa vào CV (`OmniPOS & FinLedger Hub`):**
   - Nối tiếp trực tiếp câu chuyện kinh nghiệm thật trong CV của Đạt tại **Tập đoàn Thịnh Thế Vinh Hoa (Chuỗi 300+ cửa hàng F&B: MayCha, Tam Hảo, Thức Coffee 24/7)** và dự án `sap-pos-monitor` (`iPOS -> Staging DB -> SAP B1`).
   - Xây dựng trên nền repo **`NgoDat2003/create-template-project`** (Turborepo Monorepo: Next.js 15 + NestJS 10.4 + Prisma 7.9 + PostgreSQL 16 cổng `5433` + Orval codegen + shadcn/ui).
   - **Nguồn Mock Data:** Kết hợp 300 cửa hàng F&B + 77 sản phẩm thật từ bộ `northwind` có sẵn trong Postgres + script `seed.ts`.
   - **Database chính:** Giữ nguyên **PostgreSQL 16** (kết hợp Redis 7 ở Cụm 2 và Kafka KRaft + Debezium CDC ở Cụm 4–5).

2. **Chiến lược Xử lý Tính năng & Nhịp độ Học (Giải quyết triệt để nỗi lo không kịp thời gian):**
   - **Bỏ qua 100% video record dài 2–3 tiếng** và **bỏ qua 100% các file `.mjs` lab rời rạc (`tx-kit.mjs`, `homework-predictions.mine.mjs`)**.
   - **Mỗi Cụm (6–9 ngày) luôn tách làm 2 Pha rõ rệt:**
     - **Pha A (70% thời gian đầu Cụm — Học & Thực nghiệm cơ chế):** Học từng bài qua **Teacher Guide HTML + tương tác trực tiếp với AI trên DBX** (chạy lệnh SQL/Redis thật, nhìn kết quả thật). Chưa mở repo dự án khi chưa xong Pha A.
     - **Pha B (30% thời gian cuối Cụm — 2 đến 3 ngày — Đắp vào Dự Án CV bằng "2 Worktree Song Song"):**
       - **Nhóm 1 (Lõi Kỹ Thuật 39 bài học):** AI làm mẫu trên `.worktrees/blueprint` trước -> dẫn Đạt giải phẫu luồng chạy và tự tay code từng bước vào nhánh chính.
       - **Nhóm 2 (Vỏ UI / CRUD râu ria ngoài bài giảng):** AI dựng sẵn 100% trên Worktree phụ và lắp sang nhánh chính (Đạt tốn **0 phút** gõ CRUD/CSS/HTML).
       - **Nhóm 3 (Tính năng mở rộng nâng cao ngoài 3 khóa học: QR Order, BOM nguyên liệu, BI Dashboard, Playwright Video):** Để dành **100% sang sau ngày 14/12 đến Tết (~60 ngày đệm)**.

3. **Lộ trình Tiến hóa Kiến trúc & Refactor Thực chiến (`v1.0 -> v2.0 -> v3.0`):**
   - **Cấp độ `v1.0` (Cụm 1 & Cụm 2 | 26/10 – 08/11):** Giữ nguyên chuẩn hiện tại trong `.agent/projectRules/backend-architecture.md` của `create-template-project` (`controller` + `service` `-read/-workflow/-shared` + `PrismaService`) để tập trung 100% vào DB Internals (MVCC, Locking, Double-Entry Ledger) và Redis.
   - **Cấp độ `v2.0` (Cụm 3 | 09/11 – 17/11 — Học Bài 04 Codebase Structure & Bài 13 Clean Code/Refactoring):** Thực hành **Đại phẫu Refactor** các module từ `v1.0` lên **4 tầng Clean Architecture + Hexagonal Ports/Adapters + DDD Tactical (`domain/`, `application/`, `infrastructure/`, `presentation/`) + `Result<T,E>`**, đồng thời cập nhật bộ `.agent/projectRules/` lên chuẩn Senior `v2.0`.
   - **Cấp độ `v3.0` (Cụm 4, 5 & 6 | 18/11 – 14/12 — Học Khóa 3 Kafka & Khóa 2 Microservices/System Design):** Tách `packages/building-blocks` và trích xuất `apps/order-service`, `apps/wallet-service`, `apps/fraud-worker` giao tiếp qua **gRPC + Transactional Outbox + Debezium CDC + Kafka KRaft + Distributed Saga** mà giữ nguyên 100% tầng `domain/`.

## 2. Lịch Deadline Cụm 1 (26/10 -> 01/11/2026) & Trạng thái Hiện tại

- **Ngày 1 (Hôm nay 26/10 — Pha A):** Hoàn thành nốt **Chặng 6, 7, 8 của Bài 12** (4 Isolation Levels, tái hiện lỗi `40001` & Write Skew trên DBX `northwind`, và 6 lỗi ORM Transaction). *(Đang học Chặng 6 ngay bên dưới).*
- **Ngày 2 (27/10 — Pha A):** Học nửa đầu **Bài 14** (`SELECT FOR UPDATE`, `NOWAIT`, `SKIP LOCKED`, soi `pg_locks` trên DBX).
- **Ngày 3 (28/10 — Pha A):** Học nửa sau **Bài 14** (Optimistic Lock `version`, tạo Deadlock `40P01` & phá bằng Resource Ordering).
- **Ngày 4 (29/10 — Pha A):** Học trọn vẹn **Bài 07** (1NF–3NF, Polymorphic & tự thiết kế bảng Sổ cái kép `wallets` + `ledger_entries` trên DBX).
- **Ngày 5 (30/10 — Pha B):** Clone `NgoDat2003/create-template-project`, giải phẫu luồng gốc 30 phút, AI dựng Vỏ UI & Seed 300 quán, migrate schema Cụm 1.
- **Ngày 6 (31/10 – 01/11 — Pha B):** Cùng AI code hàm săn Flash-Voucher & Chuyển tiền Sổ cái kép, bấm nút bắn 30 request đồng thời trên UI React.

## 3. Các File Báo Cáo Đã Xuất Bản Trong Phiên Này
- Bản AK Render Interactive HTML Brief: `plans/reports/brainstorm-261026-omnipos-learn-and-build-roadmap.html` (và bản sao tại `reports/brainstorm.html`)
- Bản AK Render YAML Spec: `plans/reports/brainstorm-261026-omnipos-learn-and-build-roadmap.page.yaml`
- Teacher Guide Bài 12 & 14: `reports/advanced_backend/lesson_12_transaction_teacher_guide.html`, `reports/advanced_backend/lesson_14_locking_teacher_guide.html`

## 4. Lệnh Tiếp Tục Khi Về Nhà Mở Máy Khác
1. Chạy `git pull origin main` trong thư mục project.
2. Mở cuộc trò chuyện và gõ: **"Tiếp tục Bài 12 từ Chặng 7 (Write Skew & 40001 trên DBX)"** (hoặc tiếp tục thực hành câu lệnh DBX của Chặng 6 bên dưới).
