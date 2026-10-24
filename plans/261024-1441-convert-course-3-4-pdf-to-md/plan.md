---
status: completed
branch: main
---

# Chuyển PDF Khóa 3 + Khóa 4 sang Markdown + ảnh

## Outcome
Mỗi PDF của Khóa 3 (10 file) và Khóa 4 (13 file) có file `.md` cùng tên, cùng thư mục,
kèm thư mục `assets/<Slug>/` chứa ảnh/sơ đồ — đúng định dạng đã dùng cho `advanced_backend`.

## Constraints
- Output chỉ nằm trong project (CLAUDE.md). Tooling: `.venv/` local + PyMuPDF, đã gitignore.
- Giữ định dạng cũ: `# <tên>`, dòng `> **Tổng số trang:** N slide | **Thư mục ảnh/sơ đồ:** ...`,
  mỗi trang `## Trang N: <tiêu đề>`, heading `###`, bullet `-` / `  -`, ảnh `![Ảnh/Sơ đồ - Trang N](assets/...)`, ngăn cách `---`.
- Không sửa file của `advanced_backend`.

## Non-goals
- Không OCR (mọi PDF đều có text layer). Không dịch nội dung. Không tóm tắt.

## Design (1 script: `convert_pdf_to_md.py`)
1. Body font size = cỡ chữ phổ biến nhất (tính theo số ký tự) của cả tài liệu; dòng có cỡ ≥ 1.25×body → `###` (gộp các dòng heading liên tiếp).
2. Bullet: marker `●`/`○`/`■` (span riêng hoặc dính đầu dòng) → level theo vị trí x của marker.
3. Dòng tiếp nối (cùng block, cùng cỡ, khoảng cách dòng nhỏ) được nối vào dòng trước → đoạn văn liền mạch.
4. Bỏ header/footer lặp (text nằm ở 8% trên/dưới trang, xuất hiện ≥ 30% số trang, sau khi bỏ chữ số).
5. Ảnh: lưu theo xref (1 lần), bỏ ảnh hiển thị nhỏ < 40pt (logo, icon). JPEG giữ nguyên `.jpg`, còn lại `.png`.
6. Trang có ≥ 20 vector drawings → thêm snapshot `page_XX_full.png` để không mất sơ đồ vẽ bằng shape.

## Acceptance criteria
- [x] 23/23 PDF có `.md` tương ứng; số `## Trang` = số trang PDF.
- [x] Mọi link ảnh trong `.md` trỏ tới file tồn tại; không có ảnh mồ côi.
- [x] Không còn footer `roninhub.com` / header chạy lặp của sách trong `.md`.
- [x] Spot-check thủ công: 1 slide deck, sách `master-software-architecture`, `CCDAK Exam_2` đọc được, heading/bullet đúng.
- [x] Script chạy lại idempotent (xóa assets cũ của file đó trước khi ghi).

## Validation
`.venv/Scripts/python convert_pdf_to_md.py` rồi `.venv/Scripts/python convert_pdf_to_md.py --check`.

## Rollback
Xóa các `.md` + `assets/` mới trong 2 thư mục khóa; revert branch.
