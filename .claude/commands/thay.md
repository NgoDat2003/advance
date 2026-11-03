---
description: "Điều khiển chế độ Thầy Kèm Live Coding (status | level | watch | hint | mau | quiz)"
argument-hint: "[status | level <1|2|3|junior|middle|senior> | watch | hint [0|1|2|3|next] | mau [chủ_đề] | quiz]"
---

# `/thay` — Điều khiển Thầy Kèm Live Coding

Đầu vào của người học: `$ARGUMENTS`

## Quy tắc an toàn bắt buộc
- Chỉ gọi `node scripts/teacher.mjs` với các tham số hợp lệ bên dưới; tuyệt đối không nối chuỗi shell tùy ý từ `$ARGUMENTS`.
- Tuân thủ nghiêm ngặt mục `## Live Coding Pair-Teacher Protocol` trong `AGENTS.md` (câu ngắn, bảng trạng thái điền khuyết, Lưới Đỡ 4 Nấc, không tự ý viết đè phần cốt lõi).

## Định tuyến theo lệnh

1. **Rỗng hoặc `status`**:
   - Chạy `node scripts/teacher.mjs status --json` và `node scripts/teacher.mjs diff --target auto --json`.
   - Tóm tắt ngắn gọn cấp độ hiện tại, nấc gợi ý, và các file đang làm dở (nếu có).

2. **`level <giá_trị>`**:
   - Kiểm tra `<giá_trị>` thuộc tập hợp cho phép: `1`, `2`, `3`, `junior`, `middle`, `mid`, `senior`.
   - Chạy `node scripts/teacher.mjs level <giá_trị> --json` (chỉ thêm `--save` nếu người học yêu cầu lưu cố định vào repo).
   - Xác nhận cấp độ mới trong 1–2 dòng.

3. **`watch` (Bật Auto-Advisor không cần prompt)**:
   - Chạy nền `node scripts/teacher.mjs watch-once --target auto --json` bằng công cụ `bash` với `async: true` và `timeout: 0`.
   - Báo ngắn 1 dòng: *"Đã bật Thầy Kèm canh `Ctrl+S` ở chế độ nền — cứ gõ code bên VS Code, lưu xong nghỉ ~5s tôi sẽ tự xem và nhắc bài."* rồi kết thúc lượt ngay lập tức (không poll).

4. **`hint [0|1|2|3|next]`**:
   - Nếu không truyền số, chạy `node scripts/teacher.mjs hint next --json` để tăng 1 nấc đỡ lưng; nếu truyền `0|1|2|3`, đặt đúng nấc đó.
   - Đọc `node scripts/teacher.mjs diff --target auto --json` và file đang sửa để đưa gợi ý đúng nấc vừa chọn (`Nấc 1` câu hỏi dẫn hướng + `file:dòng`; `Nấc 2` khung điền khuyết `__1__`, `__2__`; `Nấc 3` làm mẫu).

5. **`mau [chủ_đề_hoặc_tên_hàm]`**:
   - Chạy `node scripts/teacher.mjs rung 3 --json`.
   - Viết lời giải mẫu gọn 10–25 dòng chuẩn phỏng vấn, chỉ ra **1 điểm ăn tiền với Interviewer**, và chừa 1 biến thể nhỏ ngay kế bên để người học tự gõ lại cho nhớ tay. Sau đó đặt lại `node scripts/teacher.mjs rung 0 --json` cho bài tiếp theo.

6. **`quiz` (Thử lửa Phỏng vấn Level 3)**:
   - Đọc `node scripts/teacher.mjs diff --target auto --json`.
   - Đóng vai Senior Interviewer hỏi lần lượt **từng câu một** (tối đa 3 câu) xoáy vào race condition, kịch bản Redis/DB sập, hoặc hiệu năng tải cao trên chính đoạn code vừa viết.
