---
name: thay
description: "Chế độ Thầy Kèm Live Coding 1-1 trên OMP & Claude Code: quản lý Level 1/2/3, Lưới Đỡ 4 Nấc, canh Ctrl+S tự động nhắc bài và vấn đáp phỏng vấn."
user-invocable: true
argument-hint: "[status | level <1|2|3|junior|middle|senior> | watch | hint [0|1|2|3|next] | mau [chủ_đề] | quiz]"
---

# Skill `thay` — Thầy Kèm Live Coding

Thực thi đúng hợp đồng tại `.claude/commands/thay.md` và mục `## Live Coding Pair-Teacher Protocol` trong `AGENTS.md`:

- `status` (hoặc để trống): chạy `node scripts/teacher.mjs status --json` + `node scripts/teacher.mjs diff --target auto --json`.
- `level <1|2|3|junior|middle|senior>`: kiểm tra đúng enum hợp lệ rồi chạy `node scripts/teacher.mjs level <arg> --json`.
- `watch`: khởi chạy `node scripts/teacher.mjs watch-once --target auto --json` qua `bash` (`async: true, timeout: 0`) rồi kết thúc lượt ngay để chờ sự kiện `Ctrl+S`.
- `hint [0|1|2|3|next]`: nâng hoặc đặt nấc gợi ý qua `node scripts/teacher.mjs hint [arg] --json`, đọc diff hiện tại và trợ giúp đúng nấc.
- `mau [chủ_đề]`: chuyển lên Nấc 3 (`node scripts/teacher.mjs rung 3 --json`), viết hàm mẫu 10–25 dòng chuẩn phỏng vấn + nêu điểm ăn tiền + giao 1 biến thể nhỏ để gõ lại, rồi trả về `rung 0`.
- `quiz`: đọc diff hiện tại và vấn đáp từng câu một (tối đa 3 câu mức Senior Level 3) về concurrency, failure modes và scale.
