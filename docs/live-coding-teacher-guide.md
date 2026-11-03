# Hướng Dẫn Sử Dụng Chế Độ "Thầy Kèm Live Coding" (OMP + VS Code)

Tài liệu ngắn gọn để bật và dùng ngay trong buổi học **Redis** chiều nay cũng như khi code dự án **OmniPOS & FinLedger Hub** — không cần tốn quota Claude Code.

---

## 1. Bố cục màn hình khuyên dùng (1 phút)

| Nửa trái màn hình (65%) — VS Code | Nửa phải màn hình (35%) — OMP Terminal (Orca / Herdr) |
| :--- | :--- |
| Mở `advance-be-omnipos.code-workspace` (thấy cả `advance-be` lẫn `omnipos-finledger-hub`) + DBX / Thunder Client | Chạy `omp` tại thư mục `advance-be` (mặc định dùng `gemini-4-argon:high` — quota Google Ultra) |

> **An toàn phạm vi:** Cấu hình Level 2 và chế độ Thầy Kèm **chỉ nằm trong repo `advance-be`**, hoàn toàn không ảnh hưởng tới các dự án công việc khác trên máy.

---

## 2. Bảng lệnh điều khiển nhanh (`/thay` hoặc nói tiếng Việt tự nhiên)

Trên khung OMP bên phải, có thể gõ lệnh tắt `/thay ...` (hoặc `/skill:thay ...`, hoặc nhắn tiếng Việt bình thường):

| Mục đích | Lệnh gõ nhanh | Chuyện gì xảy ra |
| :--- | :--- | :--- |
| **Xem trạng thái hiện tại** | `/thay status` | Hiện Level đang bật (`middle` mặc định), nấc gợi ý (`0..3`), và kết nối Hub |
| **Bật tự động canh `Ctrl+S`** | `/thay watch` *(hoặc "canh code giúp t")* | OMP gài watcher chạy ngầm (0 tốn token lúc nghỉ). Mỗi lần bên VS Code bấm `Ctrl+S` xong nghỉ tay ~5 giây, OMP **tự thức dậy đọc diff và nhắc bài** mà không cần gõ prompt |
| **Xin gợi ý khi khựng tay** | `/thay hint` *(hoặc gõ `"?"` / `"bí"`)* | Tự nâng 1 nấc trên **Lưới Đỡ 4 Nấc** (`Nấc 1` chỉ dòng + hỏi mở → `Nấc 2` đưa khung điền khuyết `__1__`, `__2__`) |
| **Nhờ làm mẫu chuẩn phỏng vấn** | `/thay mau` *(hoặc "làm mẫu đoạn này")* | Viết bản mẫu gọn 10–25 dòng + chỉ **1 câu ăn điểm với Interviewer** + chừa 1 biến thể nhỏ để gõ lại cho nhớ tay |
| **Đổi cấp độ giảng (1 / 2 / 3)** | `/thay level 2` hoặc `/thay level 3` | Đổi tức thì trong phiên (lưu vào `.teacher/state.local.json`, không làm bẩn `git status`) |
| **Vấn đáp thử lửa cuối bài** | `/thay quiz` | Đóng vai Senior Interviewer hỏi vặn từng câu một (tối đa 3 câu) trên chính `git diff` vừa viết |

---

## 3. Quy trình vào học Redis chiều nay (Thực chiến từng bước)

1. **Bước 1 — Mở bài & Khởi động thầy kèm:**
   - Mở file HTML bài học Redis trên trình duyệt (`reports/advanced_backend/lesson_06_redis_teacher_guide.html` hoặc bài Caching đang học) và mở thư mục `labs/` trên VS Code.
   - Bên OMP, nhắn:
     ```text
     Học tiếp Redis Stage 2 cùng t nhé, bật /thay watch luôn.
     ```
2. **Bước 2 — Học lý thuyết không ngập chữ:**
   - Thầy sẽ tóm tắt từng bước bằng **bảng trạng thái điền khuyết** (`Step | Who | Command | Cache | DB`) và giải nghĩa tiếng Việt từng cờ lệnh Redis/Lua mới trước khi đụng tay.
3. **Bước 3 — Tự tay gõ có "Phao Cú Pháp" (Lưới Đỡ 4 Nấc):**
   - Trước mỗi đoạn `TODO(Đạt)` (chỉ dài 10–25 dòng đúng chuẩn bài test phỏng vấn), thầy luôn lót sẵn **Nấc 0** (luồng 3 bước + mẫu cú pháp hàm).
   - Cứ gõ bên VS Code rồi bấm `Ctrl+S`. Sau ~5 giây nghỉ tay, thầy tự đọc diff để khen đúng hoặc nhắc lỗi (ví dụ quên TTL, sai điều kiện atomic).
   - Quên cú pháp hay khựng lại quá 1–2 phút? Gõ ngay `/thay hint` hoặc `/thay mau` — không bao giờ ngồi đơ nhìn màn hình trắng.
4. **Bước 4 — Chốt bài như đi phỏng vấn thật:**
   - Khi code đã chạy xanh, gõ `/thay quiz` để trả lời nhanh 3 câu hỏi xoáy tầm Mid/Senior trước khi qua chặng tiếp theo.

---

## 4. Dùng CLI trực tiếp trên Terminal (Tùy chọn kiểm tra độc lập)

Nếu muốn tự kiểm tra nhanh không qua AI, bộ script thuần Node.js chạy độc lập với 0 thư viện ngoài:

```bash
# Xem cấp độ & trạng thái hiện tại
node scripts/teacher.mjs status

# Đổi cấp độ cho phiên hiện tại (junior | middle | senior)
node scripts/teacher.mjs level middle

# Quét nhanh diff hiện tại + kiểm tra cổng cấm K-01 (Hub) & rò rỉ secret K-04
node scripts/teacher.mjs diff --target auto
```
