---
handoff-version: 1
generated: 2026-11-06T15:00:00+07:00
focus: "Bài 04 Codebase Structure teacher guide hoàn tất, dùng cho Cụm 3 ngày 1 (09/11)"
workspace: D:/học/advance-be (Office PC) / D:/study/advance-be (Home PC)
branch: feat/lesson-04-codebase-structure-guide
---

# HANDOFF: Bài 04 Codebase Structure sẵn sàng học

## Có gì

- **Guide:** `reports/advanced_backend/lesson_04_codebase_structure_teacher_guide.html`. 33 slide map đúng một lần, 7 chặng, 28 câu quiz, 8 câu phỏng vấn, 5 widget, khóa lưu trữ `l04-*`.
- **Lab:** `labs/lesson-04-codebase-structure/`. Không cài gì, không Docker, Node từ 22.18.
- **Số liệu gốc:** `plans/261106-1400-lesson-04-codebase-structure-teacher-guide/runs/`.
- **Kiểm tra guide:** `node plans/261106-1400-lesson-04-codebase-structure-teacher-guide/verify-guide.mjs` từ gốc repo.
- **Sửa guide:** sửa `plans/261106-1400-lesson-04-codebase-structure-teacher-guide/guide-source/guide-body.html` hoặc `guide-data.js`, rồi chạy `node plans/261106-1400-lesson-04-codebase-structure-teacher-guide/guide-source/assemble.mjs`. Đừng sửa tay file HTML.

## Cách bắt đầu

1. `cd labs/lesson-04-codebase-structure && npm run all`, phải thoát mã 0.
2. Mở guide, học theo bảng ở `#cach-hoc` (lõi 205 phút, bài tập tối 45 phút).
3. Khối tự gõ chính: `challenge/voucher-campaign.todo.ts`, chấm bằng `npm run challenge`. Có thể gọi `/thay watch`.
4. Bài tập: `npm run hw:draft` (sau khi tự review) và `npm run hw` trên `hw/mine`.

Nên học xong Bài 06 và K2 Bài 04 trước, theo đúng thứ tự Cụm 2. Bài 04 không phụ thuộc kỹ thuật vào chúng; có nhắc Lab 14.01 của Bài 14.

## Quyết định đáng nhớ

- **Không chạm vào Hub.** Lab chỉ đọc `wallets.service.ts` (commit `859c913`) để lấy đường cơ sở: 7 import hạ tầng hoặc framework. Refactor là việc của Đạt ở Pha B, ngày 15–17/11.
- **Không dùng Postgres.** Lab 4 mô phỏng race trong RAM; số thật trên DB nằm ở Lab 14.01. Phần nối dây NestJS trong chặng 7 chưa chạy, phải kiểm chứng ở Pha B.
- **Slide bị sửa:** 15 (DTO không thuộc domain), 29 (mũi tên kim tự tháp ngược slide 16 và 27). **Đúng một phần:** 6, 17.
- **Slide 17 và roadmap:** Hub làm một mình nhưng vẫn chia 4 tầng. Guide chốt áp dụng theo module như ADR-008 (`wallets`, `vouchers`, `pos-invoices`), CRUD giữ mỏng.
- **Lab đơn giản hơn Hub:** `Money` không âm và `Wallet` chỉ mô hình ví cửa hàng. Hub có ví TREASURY được phép âm (`I-03`), nên không bê nguyên hai class này sang.

## Hạn chế

- Số liệu ghi trên Node v22.18.0. `npm run all` cũng đạt trên Node 24.22.1 của Hub.
- Số ở Lab 2 phụ thuộc máy.
- Máy quét import không bắt được lỗi thiết kế như quy tắc nằm trong use case; `hw-check` dò theo tên và mẫu nên 9/9 chỉ là điều kiện cần.

## Cần Đạt xem

- `transferLocked` kiểm thiếu tiền với mọi ví, trong khi SRS `I-03` cho phép TREASURY âm. Có thể chuyển từ TREASURY sang STORE sẽ bị từ chối nhầm. Chưa chạy thử; guide không sửa Hub.
- ADR-008 còn để ngỏ việc `application/` có được dùng decorator của Nest không. Chặng 7 nêu đánh đổi, quyết định là của Đạt.

## Bước tiếp

1. Bài kế theo roadmap là **Bài 13 Clean Code** (`Tài Liệu/advanced_backend/13. Clean Code.md`), Cụm 3 ngày 2. Chưa có guide.
2. Dựng theo cùng khuôn: `guide-source/` của guide này, `runs/` + `verify-guide.mjs`, lab không cài đặt.
3. Hub Pha B (15–17/11): theo widget W4 ở chặng 7, chạy `checks/m1` lấy số trước khi refactor.
