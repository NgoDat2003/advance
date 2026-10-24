# Project Rules & Conventions

## File Output & Scope Policy (BẮT BUỘC)
- **Project-Local Only**: Tất cả file sinh ra (Markdown convert từ PDF/DOCX, logs, scripts, trích xuất dữ liệu, ghi chú...) BẮT BUỘC phải được lưu trực tiếp trong phạm vi thư mục project (`D:/study/advance-be`).
- **NEVER Output to Global**: Tuyệt đối KHÔNG lưu file kết quả ra các thư mục Global của hệ thống (ví dụ: `~`, `$HOME`, `%USERPROFILE%`, `AppData`, hoặc thư mục tạm bên ngoài project).
- **Document Structure**:
  - File PDF gốc nằm tại: `Tài Liệu/*.pdf`
  - File Markdown tương ứng sinh ra nằm trực tiếp tại: `Tài Liệu/*.md` (cùng thư mục với file gốc để tiện tra cứu).

## Core Learning Mindset & Apprenticeship Rules (BẮT BUỘC KHI KÈM HỌC ĐẠT)

1. **Anti Over-Engineering (Cấm làm phức tạp hóa):**
   - Tuyệt đối KHÔNG sinh ra các bộ thư viện hay framework benchmark trừu tượng cồng kềnh khiến học viên ngợp/sợ đọc code.
   - Code thực hành phải cực kỳ tinh gọn, trực quan, comment rõ ràng bằng tiếng Việt.

2. **Phương pháp "Làm Mẫu (Walkthrough) -> Tự Làm (Hands-on Challenge)":**
   - **Phần 1 (Bài đơn giản có lời giải mẫu):** AI hướng dẫn từng bước 1 bài toán kinh điển, giải thích cơ chế ngầm và cách kiểm chứng.
   - **Phần 2 (Bài tập thử thách cho Đạt tự làm):** AI đưa ra 1 bài toán thực tế tương tự (hoặc yêu cầu mở rộng), cung cấp gợi ý/tiêu chí đánh giá, Đạt tự tay gõ code/cấu hình và tự test. AI chỉ đóng vai trò reviewer phản biện.

3. **Đa dạng hóa Công cụ Test Thực chiến (Không chỉ script dòng lệnh):**
   - Không ép buộc 100% phải dùng script `.mjs`/terminal.
   - Linh hoạt hướng dẫn test trực quan bằng: **Postman / Thunder Client / cURL**, kết nối trực tiếp database client (**DBeaver / pgAdmin / DBX**), hoặc log terminal.
   - Mục tiêu tối thượng: Tận mắt nhìn thấy HTTP Status, Response Body, Database Locks, hoặc Query Execution Plan thay đổi.

4. **Mô hình Bài tập Tích lũy Cuốn chiếu (Cumulative Integration):**
   - Bài sau kế thừa bài trước (Ví dụ: Bài 3 Index -> Bài 4 đưa vào Clean Architecture -> Bài 6 bọc Redis -> Bài 14 thêm Locking).
   - Giúp Đạt tích lũy dần thành một Mini Production Engine hoàn chỉnh và tự tin mang đi phỏng vấn.

## Skill Parameter & CLI Flag Protocol (Zero-Drop Contract)
1. **Command & Flag Parsing**: Khi nhận lệnh gọi skill có dạng `/skill:<name> [flags] [prompt]` hoặc `/ak:<name> [flags] [prompt]`, AI BẮT BUỘC phải trích xuất các flag (`--flag`, `-f`, `key=value`) độc lập trước khi chạy prompt.
2. **Tuyệt đối KHÔNG bỏ qua Flag**: Cấm tuyệt đối việc âm thầm nuốt hoặc bỏ sót tham số người dùng truyền vào. Mọi flag đều phải tác động trực tiếp lên logic thực thi hoặc được báo cáo cách xử lý trong phản hồi.
3. **Quy tắc phân loại & Thực thi**:
   - **Native Skill Flags** (ví dụ `--ultra`, `ext`, `--parallel`, `--fix`): BẮT BUỘC chạy đúng branch mode trong `SKILL.md`, không tự ý hạ cấp về flow mặc định.
   - **Pipeline / Modifier Flags** (ví dụ `--ak-render`, `--preview`, `--diagram`, `--json`): BẮT BUỘC thực thi pipeline mở rộng tương ứng (ví dụ `--ak-render` bắt buộc phải kèm visual diagram / UI showcase kết quả thay vì chỉ trả về text thuần).
   - **Custom Flags**: Bắt buộc ghi nhận trong header phản hồi và áp dụng đúng ngữ cảnh yêu cầu.
