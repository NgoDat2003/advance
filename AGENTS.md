# Project Rules & Conventions

## File Output & Scope Policy (BẮT BUỘC)
- **Project-Local Only**: Tất cả file sinh ra (Markdown convert từ PDF/DOCX, logs, scripts, trích xuất dữ liệu, ghi chú...) BẮT BUỘC phải được lưu trực tiếp trong phạm vi thư mục project (`D:/study/advance-be`).
- **NEVER Output to Global**: Tuyệt đối KHÔNG lưu file kết quả ra các thư mục Global của hệ thống (ví dụ: `~`, `$HOME`, `%USERPROFILE%`, `AppData`, hoặc thư mục tạm bên ngoài project).
- **Document Structure**:
  - File PDF gốc nằm tại: `Tài Liệu/*.pdf`
  - File Markdown tương ứng sinh ra nằm trực tiếp tại: `Tài Liệu/*.md` (cùng thư mục với file gốc để tiện tra cứu).
