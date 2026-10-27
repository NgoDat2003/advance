---
handoff-version: 1
generated: 2026-10-27T22:41:00+07:00
focus: "tạo bài giảng bài tiếp theo trong lộ trình để mai học (Bài 07 Data Modeling)"
workspace: D:/study/advance-be
branch: main
---

# HANDOFF: Bài 07 Data Modeling sẵn sàng học ngày 28/10

## Đã làm
- Bài giảng: `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` (9 chặng, 43 slide, 10 widget, 36 câu quiz, 10 câu phỏng vấn, Prisma drill, bài tập slide 35). Lõi 280 phút + 60 tùy chọn + 45 phút bài tập buổi tối.
- Lab chạy bằng DBX: `labs/lesson-07-data-modeling/` (20 file `.sql` + `prisma-drill.schema.prisma`). Mọi con số trong bài đo trên PostgreSQL 16.15 của máy này ngày 27/10/2026; bằng chứng ở `plans/261027-1328-lesson-07-data-modeling-teacher-guide/runs/`.
- Schema `lab07_modeling` đã dựng sẵn và đang ở trạng thái "đã chạy hết" (check.sql 14/14 ✔). Không có bảng `hw_*`, `my_*`: phần Tự làm và bài tập bắt đầu sạch.

## Bắt đầu ngày mai (3 bước)
1. Bật Docker Desktop → `docker start quan-ly-hop-dong-postgres-1` (cổng 5433).
2. Mở guide, đọc `#cach-hoc`. Trong DBX: Duplicate kết nối `ADVANCE_BE_LAB` thành `ADVANCE_BE_LAB_B` (máy nhà chưa có, cần cho chặng 3, 4, 9).
3. Chạy `00-setup.sql` (Ctrl+A → Run), rồi `check.sql`: phải thấy C01–C08 ✔ (C09–C12 có thể đã ✔ vì lab đã chạy sẵn; chạy lại từng chặng là ghi đè).

Cách chạy: bôi đen MỘT region (`-- #region` … `-- #endregion`) → Run Selection, tab auto-commit. Region dừng ở lỗi khi đang trong BEGIN thì chạy riêng `ROLLBACK;`. Chặng 4: CREATE INDEX CONCURRENTLY phải ở tab auto-commit, và không để transaction nào khác đang mở.

## Lưu ý
- Tối 27/10 có 2 phiên demo Bài 14 (`1_ke_toan_A` idle in transaction, `2_dev_alter_B`) treo trên DB khoảng 25 phút; đã kết thúc theo cho phép của Đạt. Bảng `lab14_locking.demo_ddl` (nếu còn) chưa bị đụng. Khi học tiếp Bài 14 chặng 3 nhớ COMMIT/ROLLBACK tab A sau demo.
- Bài 14 vẫn dở từ chặng 3: guide Bài 07 có mục "Nhắc nhanh Bài 14" nên học trước được; `post_transfer` chặng 9 là ứng dụng của Bài 14 chặng 5.
- Kiểm tra lại tất cả (controller, không bắt buộc): trong thư mục plan chạy `node verify/verify-guide.mjs`, `--runs`, `--data`, `bash verify/negative-tests.sh`, `bash verify/rerun-gate.sh`.

## Chưa làm / ngoài phạm vi
- Không commit, không push, không branch (theo quy ước làm thẳng trên main). Thay đổi để nguyên cho Đạt xem.
- Hành vi GUI của DBX với nhiều câu trong BEGIN … COMMIT chưa được máy kiểm (MCP của DBX chặn câu transaction); Bài 12/14 cho thấy DBX chạy được.
