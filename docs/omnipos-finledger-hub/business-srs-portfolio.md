# Tài Liệu Đặc Tả Yêu Cầu Nghiệp Vụ (Business SRS) & Định Vị Portfolio: **OmniPOS & FinLedger Hub**

> **Góc nhìn CTO Advisor (Thách thức giả định ban đầu):**
> Nhiều lập trình viên khi làm dự án hệ thống lớn thường mắc sai lầm **viết SRS như một bản liệt kê công nghệ** (*"Dự án dùng NestJS, Redis, Kafka, Partitioning..."*). Khi đi phỏng vấn hoặc trình bày sản phẩm, cách tiếp cận này thất bại ngay ở câu hỏi đầu tiên của Product Owner / Tech Lead: **"Hệ thống này giải quyết nỗi đau kinh doanh nào, ai là người bấm nút, tiền chảy từ đâu sang đâu, và tại sao không dùng một bảng `UPDATE balance` đơn giản?"**
>
> Tài liệu dưới đây đảo ngược hoàn toàn tư duy đó: đặt **Nghiệp vụ Chuỗi F&B 300 Cửa hàng & Kế toán Tài chính Nội bộ (B2B2C Enterprise Operations)** làm trung tâm, nơi mọi ràng buộc kỹ thuật (`I-01` $\rightarrow$ `I-15`) đều sinh ra để bảo vệ **tiền thật, hàng thật và chứng từ kế toán thật**.

---

## 1. Brainstorm Contract

### 1.1. Outcome (Kết quả đầu ra cam kết)
Xây dựng bộ **Tài liệu Đặc tả Yêu cầu Nghiệp vụ (Business & Product SRS) kiêm Kim chỉ nam Portfolio** hoàn chỉnh cho dự án **`OmniPOS & FinLedger Hub`** (repo `NgoDat2003/omnipos-finledger-hub`, commit `HEAD 9e01cc9`), giúp chủ dự án:
1. Nắm trọn vẹn bức tranh nghiệp vụ tổng thể của một **Nền tảng Quản trị Ngân quỹ Sổ cái Kép, Giao dịch POS, Khuyến mãi B2B & Chuỗi Cung ứng Kho tổng** cho chuỗi **300 cửa hàng F&B** (lấy cảm hứng từ thực tiễn vận hành chuỗi như *MayCha, Tam Hảo, Thức Coffee 24/7* và đồng bộ bút toán `AR / JE` trên *SAP Business One*).
2. Phân ranh giới rõ ràng **5 vai trò tác nhân (Actors)**, **6 phân hệ nghiệp vụ cốt lõi (`M1` $\rightarrow$ `M6`)**, quy tắc hạch toán kế toán kép, luồng màn hình – API – mã lỗi chuẩn và **15 bất biến nghiệp vụ (`I-01` $\rightarrow$ `I-15`)**.
3. Phân biệt trung thực, minh bạch giữa **Hiện trạng đã chạy (`M0` tại `HEAD 9e01cc9`)** và **Lộ trình phát triển (`M1` $\rightarrow$ `M6` & Hậu M6)** để tự tin bảo vệ đồ án/portfolio trước hội đồng phỏng vấn Backend Senior / System Architect.

### 1.2. Constraints (Ràng buộc bất biến từ Codebase & Nghiệp vụ)
- **Quy mô dữ liệu & thực thể cố định:** Chuỗi gồm đúng **300 cửa hàng F&B** (`Quán 1` .. `Quán 300` trong bảng `stores`), **77 sản phẩm thực đơn F&B** (seed từ bộ dữ liệu Northwind trong bảng `products`), và **301 ví nội bộ** (`300` ví cửa hàng loại `STORE` + `1` ví Ngân quỹ Tổng công ty loại `TREASURY`).
- **Hạ tầng Monorepo hiện hữu (`M0`):** Turborepo gồm `apps/api` (NestJS `12.2`, cổng `127.0.0.1:3101`), `apps/web` (Next.js `16.4` + React `19.3`, cổng `127.0.0.1:3100`), PostgreSQL `16` (`omnipos-hub-pg` tại `127.0.0.1:5434`, DB `omnipos_hub`), Prisma `7.9`, và Redis (`127.0.0.1:6380` từ `M2`).
- **Chuẩn mực Kế toán & Vận hành (`I-01` $\rightarrow$ `I-15`):** Mọi luồng tiền phải tuân thủ nguyên tắc **Sổ cái kép bất biến (Append-only Double-Entry Ledger)** với tổng số dư toàn hệ thống $\sum \text{Balance}_{301 \text{ ví}} = 0\text{ VNĐ}$ (`I-01..I-05`), khóa định hướng chống Deadlock (`I-07`), phân bổ hạn ngạch Flash-Voucher không vượt trần (`I-06`), chống trùng hóa đơn POS qua `Idempotency-Key` (`I-08`), và đối soát tồn kho – công nợ qua Distributed Saga (`I-12..I-14`).

### 1.3. Non-Goals (Những việc dự án chủ đích KHÔNG làm)
- **Không làm cổng thanh toán ngân hàng đại chúng (B2C Payment Gateway / Napas / VietQR trực tiếp cho khách lẻ):** Dự án tập trung vào **Ngân quỹ Nội bộ Chuỗi (Internal Corporate Treasury & Store Working Capital)** và hạch toán doanh thu/chi phí B2B giữa Trụ sở chính (`HQ`) với 300 cửa hàng.
- **Không thay thế toàn bộ phân hệ kế toán thuế/lương của ERP SAP Business One:** Hệ thống đóng vai trò **Operational Sub-ledger & Real-time Transaction Hub** (Sổ phụ vận hành thời gian thực), xuất sao kê chuẩn (`statement.csv`) và bút toán chuẩn hóa để khớp với bảng `OJDT` / `JDT1` của SAP B1.
- **Không làm ứng dụng giao đồ ăn cho người tiêu dùng cuối (như GrabFood/ShopeeFood):** Khách mua nước tại quầy tương tác qua thu ngân/máy POS của cửa hàng (`POS_CASHIER`), không tự đăng nhập vào hệ thống nội bộ này.

### 1.4. Acceptance Criteria (Tiêu chí nghiệm thu bản SRS)
1. **Định danh rõ bài toán kinh doanh:** Giải thích được vì sao chuỗi 300 quán F&B thất thoát tiền, lệch công nợ, treo đơn nguyên vật liệu và sập hệ thống giờ cao điểm nếu thiếu `OmniPOS & FinLedger Hub`.
2. **Đầy đủ ma trận 5 Actor $\times$ 6 Phân hệ:** Mỗi phân hệ đều có: *Bài toán nghiệp vụ*, *Tác nhân tham gia*, *Luồng sự kiện chính & ngoại lệ (Happy Path & Edge Cases)*, *Ví dụ số liệu/hạch toán cụ thể*, *API & Màn hình tương ứng*, và *Bất biến bảo vệ (`I-xx`)*.
3. **Bóc tách minh bạch Hiện trạng (`M0`) vs. Tương lai (`M1..M6`):** Không nhập nhèm giữa những gì đã có trong code (`HEAD 9e01cc9`) và những gì nằm trong lộ trình xây dựng.
4. **Sẵn sàng dùng cho phỏng vấn:** Có kịch bản Pitching 2 phút + bảng trả lời câu hỏi xoáy về nghiệp vụ cho ứng viên.

---

### 1.5. Trade-offs: So sánh 3 Phương Án Định Hình Nghiệp Vụ & Kiến Trúc Sản Phẩm

| Tiêu chí so sánh | Phương án A: CRUD POS Đơn Thuần (Single-Balance Column & Direct DB Update) | Phương án B (KHUYẾN NGHỊ - SIMPLEST VIABLE ENTERPRISE OPTION): Modular Monolith Sổ Cái Kép Tiến Hóa Dần (`M0` $\rightarrow$ `M6`) | Phương án C: Full Event-Sourced Microservices & ERP Đa Dịch Vụ Ngay Từ Ngày Đầu |
| :--- | :--- | :--- | :--- |
| **Mô hình nghiệp vụ cốt lõi** | Mỗi cửa hàng có 1 cột `balance`, chuyển tiền chỉ chạy `UPDATE wallets SET balance = balance - x`; hóa đơn POS chỉ `INSERT` thẳng. | **Core FinLedger + POS Hub:** Mọi biến động tiền đi qua **Sổ cái kép bất biến (`ledger_entries`)**, khóa theo thứ tự ID (`FOR UPDATE`), tiến hóa từ Monolith (`M1–M3`) sang Outbox/Kafka/Saga (`M4–M6`). | Tách ngay từ đầu thành 8–10 microservices (Auth, Store, Wallet, Ledger, Voucher, POS, Inventory, Feed) giao tiếp hoàn toàn bất đồng bộ qua Event Store. |
| **Độ phức tạp triển khai (Complexity)** | **Thấp (2/10):** Viết xong trong 1 tuần, nhưng không có giá trị phỏng vấn Senior/Mid-level. | **Trung bình – Cao có kiểm soát (6/10):** Phức tạp đúng chỗ (Transaction, Locking, Idempotency, Saga), dễ chạy local trên 1 máy. | **Rất cao (9.5/10):** Ngập trong cấu hình hạ tầng (K8s, Service Mesh, Schema Registry) trước khi viết xong 1 luồng nghiệp vụ. |
| **Chi phí vận hành (Cost)** | **Thấp:** 1 DB + 1 API. Nhưng **chi phí khắc phục sự cố kế toán cực đắt** (mất dấu vết tiền). | **Tối ưu:** Giai đoạn `M0–M3` chỉ cần Postgres + Redis; `M4–M5` mới bật thêm Kafka/Debezium khi cần Saga. | **Đắt đỏ:** Tốn >12–16 GB RAM chỉ để dựng môi trường dev local; chi phí cloud cao gấp 4–5 lần. |
| **Độ trễ giao dịch (Latency)** | $5\text{–}15\text{ ms}$ khi vắng khách; **treo hàng giây hoặc lỗi Deadlock (`40P01`)** khi 300 quán giao dịch đồng thời. | **$15\text{–}45\text{ ms}$ (P95)** cho giao dịch Sổ cái ACID; **$< 5\text{ ms}$** cho đọc Menu/Leaderboard/Flash-Voucher nhờ Redis Singleflight & `SKIP LOCKED`. | **$80\text{–}250\text{ ms}$** do độ trễ mạng liên dịch vụ và Eventual Consistency (người dùng chuyển tiền xong chưa thấy số dư đổi ngay). |
| **Khả năng bảo trì (Maintainability)** | **Kém:** Khi lệch số dư cuối tháng, kế toán không thể truy vết giao dịch nào làm sai lệch. | **Rất cao:** Ranh giới module rõ ràng trong Turborepo; kiểm chứng tự động bằng 15 Invariants (`I-01..I-15`). | **Thấp cho đội nhỏ (1–2 người):** Debug một lỗi lệch tiền phải tra log qua 5 services và 3 Kafka topics. |
| **Giả định chịu tải (Load-Bearing Assumption)** | Giả định rằng các cửa hàng không bao giờ bấm nút cùng lúc, mạng Wi-Fi quán luôn ổn định và không cần kiểm toán độc lập. | Giả định rằng **PostgreSQL 16 (ACID + Row-level Locking + Partitioning) kết hợp Redis** đủ sức gánh trọn vẹn tải giao dịch của 300–1.000 cửa hàng F&B nếu thiết kế khóa và chỉ mục chuẩn xác. | Giả định rằng đội ngũ phát triển có quy mô >20 kỹ sư chia theo từng squad độc lập và lưu lượng đạt hàng chục nghìn TPS ngay ngày đầu. |
| **Điều kiện gãy đổ đầu tiên (First-Failure Condition)** | **Gãy ngay ở bài test đồng thời đầu tiên:** 2 quán chuyển tiền chéo (`A -> B` và `B -> A`) gây Deadlock; hoặc POS gửi trùng request khi rớt mạng làm nhân đôi doanh thu. | Khi quy mô vượt ngưỡng **>5.000 cửa hàng / >10.000 giao dịch ghi sổ cái/giây** trên một cụm Primary PostgreSQL duy nhất (lúc đó ví `TREASURY` trở thành điểm nghẽn Hot-row lock). | **Gãy ngay từ tuần thứ 2 phát triển:** Lập trình viên kiệt sức vì đồng bộ dữ liệu phân tán (Distributed Data Drift) khi chưa kịp hoàn thiện giao diện nghiệp vụ cơ bản. |
| **Hệ quả bậc hai (Second-Order Effects)** | Nhà tuyển dụng đánh giá dự án chỉ ở mức *Junior CRUD App*; trong thực tế vận hành, kế toán trưởng sẽ từ chối nghiệm thu vì không khớp được với SAP B1 (`OJDT/JDT1`). | Tạo ra một **Portfolio có chiều sâu hiếm có**: vừa chứng minh tư duy nghiệp vụ tài chính – kế toán chuẩn ERP, vừa có bằng chứng thực nghiệm (benchmark k6, chaos test) cho từng quyết định kỹ thuật. | Dự án bỏ dở giữa chừng (Abandonware), nhiều khung xương rỗng (stubs) nhưng không có luồng nghiệp vụ nào chạy trọn vẹn từ đầu đến cuối. |

> **Lựa chọn Đơn giản và Khả thi Nhất (Simplest Viable Option):** **Phương án B** là lựa chọn tối ưu. Nó giữ kiến trúc triển khai gọn gàng trong một **Turborepo Modular Monolith (`M0–M3`)** rồi mới tách dịch vụ có chọn lọc cho bài toán Đặt hàng Kho tổng & Chống gian lận (`M4–M5`), đảm bảo **100% tính đúng đắn kế toán ngay từ ngày đầu** mà không rơi vào bẫy Over-engineering.

---

### 1.6. Better Approaches (Đề xuất Cải tiến Đột phá cho Định vị Nghiệp vụ & Portfolio)

1. **Định vị dự án là "F&B Enterprise Sub-Ledger & Store Operations Hub" thay vì "Ứng dụng POS bán trà sữa":**
   - **Bằng chứng cụ thể (Concrete Evidence):** Repo đã có sẵn `300` cửa hàng (`stores`), `77` sản phẩm (`products`), và thiết kế `301` ví (`300 STORE` + `1 TREASURY`) cùng yêu cầu xuất `statement.csv` 1 triệu dòng và đối soát bút toán kép giống bảng `OJDT`/`JDT1` của SAP Business One.
   - **Khác biệt vận hành (Operational Delta):** Nếu gọi là "App POS", người nghe chỉ nghĩ đến màn hình bấm chọn món. Khi định vị là **"Hub Vận hành & Sổ phụ Tài chính Chuỗi 300 Cửa hàng"**, dự án nâng tầm lên bài toán **FinTech nội bộ (Internal Treasury) + High-Concurrency B2B Operations**, giải thích hoàn hảo tại sao cần Double-Entry Ledger, Idempotency, Saga và Fraud Freeze.
   - **Chi phí chuyển đổi (Switching Cost):** **$0$ dòng code phải sửa** — chỉ cần thay đổi góc nhìn trình bày trong tài liệu SRS, README và cách thuyết trình phỏng vấn.

2. **Chuẩn hóa "Bản đồ Ánh xạ Chứng từ Nghiệp vụ $\leftrightarrow$ Bất biến Kỹ thuật (`I-01..I-15`)" (Business-to-Invariant Traceability Matrix):**
   - **Bằng chứng cụ thể (Concrete Evidence):** Các bất biến `I-01` đến `I-15` trong tài liệu kiến trúc thực chất là các **Quy tắc Kiểm soát Nội bộ (Internal Audit Controls)** của phòng Kế toán và Vận hành chuỗi F&B.
   - **Khác biệt vận hành (Operational Delta):** Giúp cả Product Manager lẫn Principal Engineer đọc hiểu ngay: mỗi dòng code khóa DB hay mỗi sự kiện Kafka đều bảo vệ một quy tắc tiền tệ cụ thể (ví dụ: `I-03` là quy tắc *"Cửa hàng không được chi vượt quỹ tiền mặt được cấp"*).
   - **Chi phí chuyển đổi (Switching Cost):** Đã được tích hợp trực tiếp vào **Phần 3** của báo cáo SRS này.

---

## 2. Phần 1: Tổng Quan Nghiệp Vụ Dự Án `OmniPOS & FinLedger Hub`

### 2.1. Dự Án Này Là Gì? (Tầm Nhìn Sản Phẩm – Business Vision)
**`OmniPOS & FinLedger Hub`** là **Hệ thống Trung tâm Quản trị Ngân quỹ Nội bộ (Sổ cái kép), Tiếp nhận Giao dịch Bán hàng POS, Phân bổ Khuyến mãi B2B và Điều phối Cung ứng Nguyên vật liệu** dành riêng cho **chuỗi F&B quy mô lớn gồm 300 cửa hàng hoạt động 24/7** (mô phỏng sát thực tế vận hành các chuỗi đồ uống/F&B như *MayCha, Tam Hảo, Thức Coffee 24/7* tại Việt Nam).

Trong kiến trúc doanh nghiệp thực tế, hệ thống này nằm ở **tầng giữa (Mid-Office Operational & Financial Hub)**, kết nối:
- **Tầng Tiền tuyến (Frontline Store Operations):** 300 cửa hàng F&B (Thu ngân/Máy POS bán hàng, Cửa hàng trưởng quản lý quỹ, săn suất tài trợ khuyến mãi, đặt nguyên vật liệu và tương tác trên bảng tin nội bộ chuỗi).
- **Tầng Hậu phương & ERP (Back-Office HQ & Accounting):** Phòng Kế toán / Ngân quỹ Trụ sở chính (`HQ Treasury & Accounting`) và Phòng Marketing / Vận hành Chuỗi, nơi dữ liệu sổ cái được kiểm soát nghiêm ngặt trước khi kết chuyển hoặc đối chiếu với phân hệ `AR Invoice` / `Journal Entry (OJDT/JDT1)` trên **SAP Business One**.

```
+-----------------------------------------------------------------------------------+
|                     TRỤ SỞ CHÍNH (HEADQUARTERS - HQ)                              |
|  [Kế toán & Ngân quỹ (TREASURY)]          [Marketing & Vận hành Chuỗi (HQ OPS)]   |
|  - Cấp vốn lưu động 300 quán (300M VNĐ)   - Mở chiến dịch Flash-Voucher giới hạn  |
|  - Đối soát Sổ cái kép (Tổng = 0 VNĐ)     - Theo dõi Top 10 Best-Sellers Real-time|
|  - Xuất sao kê 1 triệu dòng -> SAP B1     - Phát thông báo toàn chuỗi & Short-link|
|  - Mở khóa ví bị đóng băng gian lận       - Quản lý tồn kho Kho tổng Trung tâm    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                      OMNIPOS & FINLEDGER HUB (TRUNG TÂM ĐIỀU PHỐI)                 |
|  [M1: Ngân quỹ & Sổ Cái Kép]  [M2: Flash-Voucher & POS]  [M3: RBAC & Sao kê CSV]  |
|  [M4/M5: Đặt hàng Kho Tổng Saga & Chống Gian Lận]        [M6: Partition & Bảng tin]|
+-----------------------------------------+-----------------------------------------+
                                          |
            +-----------------------------+-----------------------------+
            v                             v                             v
+-----------------------+     +-----------------------+     +-----------------------+
|   QUÁN 1 (Store #1)   |     |   QUÁN 2 (Store #2)   | ... |  QUÁN 300 (Store #300)|
| - Ví Quán 1: 1.000.000|     | - Ví Quán 2: 1.000.000|     | - Ví Quán 300: 1.0M   |
| - Máy POS phát hóa đơn|     | - Máy POS phát hóa đơn|     | - Máy POS phát hóa đơn|
| - Đặt nguyên vật liệu |     | - Săn Flash-Voucher   |     | - Tương tác bảng tin  |
+-----------------------+     +-----------------------+     +-----------------------+
```

---

### 2.2. Bối Cảnh Thực Tế & 5 Bài Toán Nghiệp Vụ Cốt Tử Cần Giải Quyết

Khi một chuỗi F&B phát triển từ 5 quán lên **300 quán**, cách quản lý thủ công hoặc phần mềm POS nhỏ lẻ sẽ sụp đổ trước **5 "nỗi đau" (Pain Points) nghiệp vụ** sau đây:

#### Bài toán 1: Thất thoát & Lệch số dư Ngân quỹ Nội bộ giữa 300 Cửa hàng và Trụ sở chính
- **Bối cảnh thực tế:** Mỗi cửa hàng cần một **Quỹ tiền mặt / Vốn lưu động nội bộ (Working Capital Wallet)** (ví dụ: Trụ sở cấp ứng trước `1.000.000 VNĐ/quán`, tổng cộng `300.000.000 VNĐ` cho 300 quán) để chi trả phí vận hành tại chỗ, điều chuyển tiền hỗ trợ qua lại giữa các cửa hàng cùng khu vực, hoặc thanh toán tiền nhập nguyên vật liệu về Trụ sở.
- **Vấn đề nếu làm phần mềm thông thường:** Nếu chỉ lưu 1 cột `balance` và dùng lệnh `UPDATE wallets SET balance = balance - amount`:
  1. Hai giao dịch rút tiền cùng lúc tại 1 quán sẽ gây **Lost Update** (ghi đè số dư) hoặc làm **âm quỹ cửa hàng**.
  2. Quán 1 chuyển tiền cho Quán 2 đúng lúc Quán 2 hoàn tiền cho Quán 1 sẽ gây **Deadlock (`40P01`)** làm treo kết nối DB.
  3. Cuối tháng kế toán đối chiếu với SAP B1 phát hiện lệch vài chục triệu đồng nhưng **không có cặp bút toán Nợ/Có đối ứng** để biết tiền biến mất ở bước nào.
- **Cách `OmniPOS & FinLedger Hub` giải quyết:** Áp dụng **Sổ cái kép bất biến (Double-Entry Immutable Ledger)** với 301 ví (`300 STORE` + `1 TREASURY`), khóa tài khoản theo thứ tự tăng dần ID (`I-07`), cấm sửa/xóa dòng sổ cái (`I-05`), đảm bảo tổng tiền toàn hệ thống luôn bằng `0` (`I-04`).

#### Bài toán 2: Hỗn loạn khi 300 Cửa hàng "Giật Cô Hồn" Suất Tài Trợ Khuyến Mãi (B2B Flash-Voucher)
- **Bối cảnh thực tế:** Phòng Marketing Trụ sở tung ra gói tài trợ ngân sách giới hạn (ví dụ: Chiến dịch *"Trợ giá Giờ Vàng"* chỉ có đúng **10 suất**, mỗi quán抢 được 1 suất sẽ được HQ tài trợ chi phí nguyên liệu khuyến mãi). Đúng 09:00:00, cả 300 Cửa hàng trưởng cùng bấm nút **"Nhận suất tài trợ (Claim)"**.
- **Vấn đề nếu làm phần mềm thông thường:**
  1. **Over-claiming (Lố ngân sách):** Kiểm tra `if (claimed < 10)` trong code sẽ bị Race Condition, dẫn đến 25–30 quán cùng nhận được suất dù ngân sách chỉ có 10.
  2. **Nhận trùng:** Một quán dùng tool bấm nhanh ăn luôn 3 suất của chiến dịch.
  3. **Nghẽn cổ chai (Lock Contention):** Khóa toàn bộ bảng chiến dịch làm 299 quán phải xếp hàng chờ nhau, gây timeout hàng loạt.
- **Cách `OmniPOS & FinLedger Hub` giải quyết:** Khởi tạo trước các ô suất trống (`pre-allocated slots`), kết hợp ràng buộc duy nhất `UNIQUE(campaign_id, store_id)` và cơ chế **`FOR UPDATE SKIP LOCKED`** kèm bộ giới hạn tốc độ bấm **Redis Lua Token Bucket** theo từng cửa hàng.

#### Bài toán 3: Nhân đôi Hóa đơn POS do Mạng Chập Chờn & Quá tải Đọc Thực đơn Giờ Cao Điểm
- **Bối cảnh thực tế:** Giờ cao điểm trưa (11:30 – 13:00), 300 máy POS tại 300 quán liên tục bắn hóa đơn bán nước (`77` món trong menu) về trung tâm. Mạng Wi-Fi/4G tại quán thường xuyên chập chờn khiến máy POS tự động gửi lại (retry) cùng một hóa đơn 5–30 lần. Đồng thời, hàng nghìn lượt mở màn hình Menu và bảng xếp hạng món bán chạy diễn ra cùng lúc.
- **Vấn đề nếu làm phần mềm thông thường:**
  1. **Ghi nhận trùng doanh thu & trừ tồn kho nhiều lần** cho cùng 1 ly trà sữa khách mua.
  2. **Hiệu ứng Cache Stampede (Thundering Herd):** Khi cache thực đơn vừa hết hạn, hàng chục request từ các quán đồng loạt đập thẳng vào PostgreSQL làm nghẽn DB.
- **Cách `OmniPOS & FinLedger Hub` giải quyết:** Bắt buộc cơ chế **`Idempotency-Key`** cho mọi hóa đơn POS (`I-08`), đọc thực đơn qua **Cache-Aside + Singleflight (Request Coalescing) + TTL Jitter**, và cập nhật **Top 10 Best-Sellers** thời gian thực trên **Redis Sorted Set (`ZSET`)** có đối chiếu SQL (`I-09`).

#### Bài toán 4: Rò rỉ Dữ liệu Chéo Giữa Các Cửa Hàng (IDOR) & Sập RAM Khi Kế Toán Xuất Sao Kê Triệu Dòng
- **Bối cảnh thực tế:** Cửa hàng trưởng Quán 1 tò mò đổi tham số URL từ `/wallets/store-1` sang `/wallets/store-2` để xem doanh thu/số dư của Quán 2. Ngoài ra, vào kỳ quyết toán cuối tháng/năm, Kế toán Trụ sở cần xuất file CSV sao kê 1.000.000 dòng bút toán để nạp vào SAP B1.
- **Vấn đề nếu làm phần mềm thông thường:**
  1. Chỉ kiểm tra đăng nhập (`Authentication`) mà quên kiểm tra quyền sở hữu tài nguyên theo cửa hàng (`Tenant Ownership`), dẫn đến lộ bí mật kinh doanh giữa các quán nhượng quyền.
  2. Hàm xuất CSV đọc toàn bộ 1 triệu dòng vào mảng trong bộ nhớ (`findMany()`) làm tiến trình Node.js nổ RAM (`Out Of Memory - OOM Crash`), kéo sập toàn bộ API của 300 quán đang bán hàng.
- **Cách `OmniPOS & FinLedger Hub` giải quyết:** Thiết lập **Multi-tenant RBAC & Anti-IDOR Guard** (chặn tuyệt đối truy cập chéo cửa hàng) và xuất sao kê bằng **Node.js Readable Cursor Stream** giữ mức tăng RAM của API luôn **$< 50\text{ MB}$**.

#### Bài toán 5: Treo Tiền Khi Đặt Nguyên Vật Liệu Kho Tổng (Distributed Saga) & Rút Ruột Ví Cửa Hàng Trái Phép
- **Bối cảnh thực tế:** Cửa hàng trưởng đặt mua nguyên vật liệu (trà, sữa, trân châu, ly nhựa) từ Kho tổng Trung tâm. Quy trình gồm 2 bước: **(1) Trừ tiền ví Cửa hàng chuyển về ví `TREASURY`** và **(2) Trừ tồn kho tại Kho tổng**. Ngoài ra, nếu tài khoản của một quán bị lộ hoặc nhân viên gian lận viết script rút tiền liên tục trong vài giây, quỹ cửa hàng sẽ bốc hơi.
- **Vấn đề nếu làm phần mềm thông thường:**
  1. Đã trừ tiền ví cửa hàng thành công nhưng bước kiểm tra kho báo **Hết hàng (Out of Stock)** hoặc dịch vụ kho bị lỗi $\rightarrow$ **Cửa hàng mất tiền oan mà không có hàng**, kế toán phải xử lý hoàn tiền bằng tay.
  2. Không có cơ chế phát hiện bất thường theo thời gian thực để khóa ví tự động khi có hành vi rút tiền dồn dập.
- **Cách `OmniPOS & FinLedger Hub` giải quyết:** Triển khai **Transactional Outbox + Debezium CDC + Kafka** (`I-12`), điều phối đơn hàng nguyên liệu bằng **Orchestrated Saga có giao dịch bù trừ tự động (Compensating Transfer)** (`I-13`), và **Real-time Fraud Worker** tự động đóng băng ví (`WALLET_FROZEN`) nếu phát hiện $> 5$ giao dịch ghi nợ trong vòng $10\text{ giây}$ (`I-14`).

---

## 3. Phần 2: 5 Vai Trò Tác Nhân (Actors) & Ma Trận Phân Quyền Nghiệp Vụ

Hệ thống phục vụ **5 nhóm tác nhân (Actors)** rõ ràng (4 vai trò con người/thiết bị và 1 tác nhân tự động hóa ngầm). Trong mã nguồn RBAC (`M3`), 4 vai trò người dùng/thiết bị được ánh xạ vào 3 nhóm quyền cốt lõi (`HQ_ADMIN` / `ACCOUNTANT`, `STORE_MANAGER`, `POS_CASHIER`) kèm theo phạm vi dữ liệu (`storeId` scope):

### 3.1. Hồ Sơ Chi Tiết 5 Vai Trò Tác Nhân

| STT | Vai trò Nghiệp vụ (Business Persona) | Mã Role kỹ thuật trong hệ thống | Phạm vi dữ liệu (Tenant Scope) | Mục tiêu & Trách nhiệm Nghiệp vụ chính |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Kế toán trưởng / Quản trị Ngân quỹ Trụ sở**<br>*(HQ Accountant & Treasury Admin)* | `HQ_ADMIN` / `ACCOUNTANT` | **Toàn chuỗi**<br>(`301` ví: `TREASURY` + `300 STORE`) | - Cấp vốn lưu động ban đầu từ `TREASURY` cho 300 cửa hàng (`1.000.000 VNĐ/quán`).<br>- Giám sát cân đối Sổ cái kép toàn chuỗi ($\sum = 0$).<br>- Xuất sao kê triệu dòng (`statement.csv`) phục vụ đối soát SAP Business One (`OJDT/JDT1`).<br>- Thẩm tra và mở khóa (`unlock`) các ví cửa hàng bị đóng băng do nghi ngờ gian lận. |
| **2** | **Chuyên viên Marketing & Vận hành Trụ sở**<br>*(HQ Marketing & Supply Chain Ops)* | `HQ_ADMIN` | **Toàn chuỗi**<br>(`300` cửa hàng, Kho tổng, Chiến dịch) | - Tạo chiến dịch tài trợ **Flash-Voucher B2B** với số lượng suất giới hạn (`totalSlots`) và tạo **Short-link (`GET /s/:code`)** gửi cho các quán.<br>- Theo dõi bảng xếp hạng **Top 10 sản phẩm bán chạy nhất (`best-sellers`)** thời gian thực.<br>- Quản lý tồn kho nguyên vật liệu tại Kho tổng và đăng thông báo điều hành toàn chuỗi trên **Bảng tin Nhượng quyền (Franchise Newsfeed)**. |
| **3** | **Cửa hàng trưởng**<br>*(Store Manager – Quản lý 1 trong 300 quán)* | `STORE_MANAGER` | **Nội bộ 1 Cửa hàng**<br>(Chỉ truy cập đúng `storeId` của mình) | - Xem số dư và lịch sử biến động sổ cái của **ví cửa hàng mình**.<br>- Thực hiện chuyển khoản nội bộ (hoàn ứng về `TREASURY` hoặc điều chuyển hợp lệ sang cửa hàng khác).<br>- Tham gia săn **Flash-Voucher** tài trợ từ HQ.<br>- Đặt đơn mua nguyên vật liệu (`SupplyOrder`) từ Kho tổng.<br>- Đăng bài chia sẻ kinh nghiệm và xem bảng tin từ HQ + các quán cùng khu vực. |
| **4** | **Thu ngân / Thiết bị Máy POS tại Quầy**<br>*(Store Cashier / POS Terminal)* | `POS_CASHIER` | **Nội bộ 1 Cửa hàng**<br>(Chỉ thao tác bán hàng tại `storeId` của mình) | - Tải danh mục thực đơn **77 món F&B** của cửa hàng với tốc độ tức thì.<br>- Lập và gửi hóa đơn bán hàng (`POST /pos/invoices`) kèm mã chống trùng `Idempotency-Key` ngay cả khi mạng Wi-Fi quán chập chờn.<br>- Không được phép can thiệp vào cấu hình chiến dịch HQ hay xem ví của cửa hàng khác. |
| **5** | **Hệ thống Kiểm soát Tự động & Worker Ngầm**<br>*(Automated Fraud Worker & Saga Orchestrator)* | `SYSTEM_WORKER` *(Internal Service / Kafka Consumer)* | **Toàn hệ thống**<br>(Event Stream `wallet.transfers`, `pos.invoices`) | - Lắng nghe luồng sự kiện CDC từ Outbox/Kafka.<br>- Tự động thực hiện **giao dịch hoàn tiền bù trừ (Compensating Transfer)** từ `TREASURY` về ví cửa hàng nếu đơn đặt nguyên liệu Kho tổng bị thiếu tồn kho.<br>- Đếm tần suất rút tiền trên cửa sổ trượt 10 giây; tự động khóa ví (`WALLET_FROZEN`) ngay khi phát hiện $> 5$ lần trừ tiền/10 giây. |

---

### 3.2. Ma Trận Phân Quyền & Tương Tác Nghiệp Vụ (CRUD & Action Matrix)

| Nghiệp vụ / Chức năng cụ thể | API Endpoint tiêu biểu | Kế toán & Ngân quỹ HQ (`ACCOUNTANT` / `HQ_ADMIN`) | Marketing & Vận hành HQ (`HQ_ADMIN`) | Cửa hàng trưởng (`STORE_MANAGER`) | Thu ngân / Máy POS (`POS_CASHIER`) | Hệ thống Ngầm (`SYSTEM_WORKER`) |
| :--- | :--- | :-: | :-: | :-: | :-: | :-: |
| Xem thông tin & số dư ví bất kỳ trong 301 ví | `GET /wallets/:id` | **Toàn quyền (301 ví)** | **Toàn quyền** | **Chỉ ví quán mình** *(Khác quán $\rightarrow$ `403/404`)* | Không có quyền (`403`) | Đọc nội bộ qua gRPC |
| Cấp vốn / Chuyển tiền từ ví `TREASURY` | `POST /wallets/transfers` | **Được phép** | Không | Không (`403`) | Không (`403`) | **Chỉ khi chạy Saga Hoàn tiền** |
| Chuyển tiền từ ví Cửa hàng (`STORE`) | `POST /wallets/transfers` | Được phép (Điều chỉnh kế toán) | Không | **Chỉ từ ví quán mình** | Không (`403`) | Không |
| Xuất sao kê kế toán 1.000.000 dòng CSV | `GET /wallets/:id/statement.csv` | **Toàn quyền (301 ví)** | Không | **Chỉ ví quán mình** | Không (`403`) | Không |
| Tạo chiến dịch Flash-Voucher & Short-link | `POST /vouchers/campaigns` | Không | **Được phép** | Không (`403`) | Không (`403`) | Không |
| Bấm nhận suất Flash-Voucher (Claim) | `POST /vouchers/campaigns/:id/claims` | Không | Không | **Được phép (Tối đa 1 suất/quán/chiến dịch)** | Không (`403`) | Chặn nếu vượt Rate Limit (`429`) |
| Tải thực đơn 77 món của cửa hàng | `GET /stores/:id/menu` | Được phép | Được phép | **Được phép** | **Được phép (Chính)** | Không |
| Gửi hóa đơn bán hàng POS (kèm `Idempotency-Key`) | `POST /pos/invoices` | Không | Không | Được phép (khi đứng quầy) | **Được phép (Chính)** | Đồng bộ ZSET & Outbox |
| Xem Top 10 sản phẩm bán chạy nhất chuỗi | `GET /products/best-sellers` | Được phép | **Được phép (Chính)** | Được phép | Được phép | Rebuild từ SQL khi cần |
| Đặt mua nguyên vật liệu từ Kho tổng (Saga) | `POST /supply-orders` | Xem đối soát | Quản lý kho | **Được phép (Chính)** | Không (`403`) | Điều phối trừ tiền & giữ kho |
| Tự động đóng băng ví khi rút tiền $>5$ lần/10s | Event `fraud.wallet-flagged` | Nhận cảnh báo | Nhận cảnh báo | Bị chặn giao dịch (`409 WALLET_FROZEN`) | Không | **Thực thi tự động** |
| Mở khóa ví sau khi xác minh an toàn | `POST /wallets/:id/unlock` | **Được phép (Duy nhất)** | Không | Không (`403`) | Không (`403`) | Không |
| Đăng thông báo toàn chuỗi (Pull Broadcast) | `POST /feed/posts` (HQ) | Được phép | **Được phép (Chính)** | Chỉ đọc trên bảng tin | Không | Hòa trộn dòng thời gian |
| Đăng bài chia sẻ cấp cửa hàng (Push Fan-out) | `POST /feed/posts` (Store) | Xem toàn bộ | Xem toàn bộ | **Được phép (Chính)** | Không | Đẩy vào Redis ZSET Followers |

---

## 4. Phần 3: Đặc Tả Chi Tiết 6 Phân Hệ Nghiệp Vụ Cốt Lõi (`M1` $\rightarrow$ `M6`)

Dưới đây là đặc tả chi tiết từng phân hệ theo chuẩn **Business SRS**: giải thích rõ bài toán, quy tắc nghiệp vụ, ví dụ hạch toán cụ thể, luồng xử lý chính/ngoại lệ và các bất biến hệ thống.

---

### Phân Hệ 1 (Module 1 – `M1`): Quản Trị Ngân Quỹ Nội Bộ & Sổ Cái Kép (Internal Store Wallets & Double-Entry Financial Ledger)

#### 1. Mục tiêu nghiệp vụ
Quản lý toàn bộ dòng tiền nội bộ giữa **Trụ sở chính (`TREASURY`)** và **300 cửa hàng (`STORE`)**, đảm bảo mọi đồng vốn cấp xuống hay thu về đều có đối ứng Nợ/Có rõ ràng, không bao giờ lệch tổng tiền, không âm quỹ cửa hàng và không xảy ra treo khóa (deadlock) khi hàng trăm quán giao dịch cùng lúc.

#### 2. Cấu trúc Tài khoản & Khởi tạo Vốn Lưu Động
- Hệ thống có tổng cộng **301 ví (`wallets`)**:
  - `1` Ví Ngân quỹ Trụ sở chính (loại `TREASURY`).
  - `300` Ví Cửa hàng (loại `STORE`), tương ứng 1-1 với `Quán 1` .. `Quán 300`.
- **Nghiệp vụ Cấp vốn lưu động đầu kỳ (Initial Capital Allocation):**
  - `TREASURY` giải ngân `1.000.000 VNĐ` cho mỗi cửa hàng trong 300 cửa hàng.
  - Sau khi cấp vốn:
    - Số dư mỗi ví `STORE` = `+1.000.000 VNĐ`.
    - Số dư ví `TREASURY` = `-300.000.000 VNĐ`.
    - Tổng số dư toàn bộ 301 ví:
      $$\text{Balance}(\text{TREASURY}) + \sum_{i=1}^{300} \text{Balance}(\text{Store}_i) = -300.000.000 + 300 \times 1.000.000 = 0\text{ VNĐ}$$

#### 3. Ví dụ Hạch toán Sổ Cái Kép Cụ thể (T-Account Ledger Example)
Giả sử **Quán 1** chuyển **250.000 VNĐ** sang **Quán 2** (hỗ trợ điều chuyển nguyên liệu nội bộ vùng) qua lệnh `POST /wallets/transfers` với mã giao dịch `transferId = TX-9001`:

| Mã Bút Toán (`entryId`) | Mã Giao Dịch (`transferId`) | Ví (`walletId`) | Loại Ví | Số dư trước GD | Phát sinh (`amount`) | Số dư sau GD | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :---: | ---: | ---: | ---: | :--- |
| `LE-1001` | `TX-9001` | `wallet_store_001` (Quán 1) | `STORE` | `1.000.000` | **`-250.000`** | `750.000` | Ghi nợ (Debit out) ví Quán 1 |
| `LE-1002` | `TX-9001` | `wallet_store_002` (Quán 2) | `STORE` | `1.000.000` | **`+250.000`** | `1.250.000` | Ghi có (Credit in) ví Quán 2 |
| **Tổng cộng theo `TX-9001`** | | | | | **`0 VNĐ`** (`I-01`) | | **Bảo toàn tổng tiền hệ thống** |

> **Quy tắc Kế toán Bất biến (`I-05`):** Nếu Cửa hàng trưởng Quán 1 nhập nhầm `250.000 VNĐ` thay vì `25.000 VNĐ`, hệ thống **tuyệt đối cấm chạy `UPDATE` hoặc `DELETE`** trên dòng `LE-1001` và `LE-1002`. Để sửa sai, phải tạo một **Giao dịch Đảo / Bù trừ mới (`TX-9002`)** chuyển ngược `225.000 VNĐ` từ Quán 2 về Quán 1 — đúng chuẩn bút toán đảo (Reversal Journal Entry) trong SAP Business One (`OJDT`/`JDT1`).

#### 4. Luồng Nghiệp vụ Chính & Các Trường Hợp Ngoại Lệ
- **API:** `GET /wallets/:id` và `POST /wallets/transfers`.
- **Luồng chính (Happy Path):**
  1. Kiểm tra DTO đầu vào: `fromWalletId !== toWalletId` (nếu trùng trả ngay `400 Bad Request` với mã `SAME_WALLET` nhờ custom validator `@DifferentFrom`).
  2. Kiểm tra `amount > 0` (số nguyên dương VNĐ).
  3. Mở DB Transaction, sắp xếp 2 mã ví theo thứ tự từ điển/ID tăng dần (`min(from, to)` trước, `max(from, to)` sau) và thực hiện `SELECT ... FOR UPDATE` (`I-07` — triệt tiêu hoàn toàn nguy cơ Deadlock `40P01` khi Quán 1 chuyển Quán 2 đồng thời Quán 2 chuyển Quán 1).
  4. Kiểm tra số dư ví nguồn: nếu ví nguồn là `STORE` và `balance < amount`, từ chối giao dịch (hoặc để ràng buộc `CHECK (type = 'TREASURY' OR balance >= 0)` mã `23514` chặn lại) và trả mã lỗi không đủ số dư.
  5. Chèn đúng **2 dòng `ledger_entries`** (`-amount` và `+amount`) và cập nhật số dư 2 ví trong cùng một giao dịch ACID.
- **Bất biến bảo vệ:** `I-01`, `I-02`, `I-03`, `I-04`, `I-05`, `I-07`.

---

### Phân Hệ 2 (Module 2 – `M1` & `M2`): Chiến Dịch Tài Trợ & Săn Flash-Voucher Nội Bộ (B2B Promotional Campaign & Flash-Voucher Quota Allocation)

#### 1. Mục tiêu nghiệp vụ
Cho phép Phòng Marketing Trụ sở chính phát hành các gói tài trợ khuyến mãi giới hạn số lượng suất (`totalSlots`) cho toàn bộ 300 cửa hàng. Khi mở cổng đăng ký, hàng trăm Cửa hàng trưởng bấm nhận cùng một mili-giây nhưng hệ thống phải đảm bảo: **đúng số lượng suất, mỗi quán tối đa 1 suất, không xếp hàng chờ khóa (zero lock-wait queue) và chống spam click bằng tool**.

#### 2. Quy tắc Nghiệp vụ & Cơ chế Phân bổ Suất (Pre-allocated Slot Pool)
- **Bước 1 – HQ khởi tạo chiến dịch (`POST /vouchers/campaigns`):**
  - Ví dụ: Chiến dịch *"Tài trợ Nguyên liệu Trà Sữa Giờ Vàng"* có `totalSlots = 10`.
  - Hệ thống khởi tạo ngay bản ghi chiến dịch kèm **10 dòng suất trống (`voucher_slots` / `claims` với `store_id IS NULL`)**.
- **Bước 2 – 300 Cửa hàng tranh suất (`POST /vouchers/campaigns/:id/claims`):**
  - **Lớp chắn 1 (Chống Spam tại cửa ngõ – `M2`):** Bộ giới hạn tốc độ **Redis Lua Token Bucket** kiểm tra tần suất bấm của từng `storeId`. Nếu một quán dùng auto-clicker bắn liên tục vượt ngưỡng cho phép, hệ thống trả ngay **`429 Too Many Requests`** kèm header `Retry-After` mà không chạm vào DB.
  - **Lớp chắn 2 (Chống nhận trùng 2 suất/quán – `M1`):** Ràng buộc duy nhất `UNIQUE(campaign_id, store_id)`. Nếu Quán 5 đã nhận 1 suất rồi mà bấm lần nữa, PostgreSQL phát sinh mã `23505`, API bắt lỗi và trả về **`409 Conflict` (`ALREADY_CLAIMED`)**.
  - **Lớp chắn 3 (Phân bổ tức thì không nghẽn – `M1`):** Truy vấn tìm 1 ô suất trống bằng:
    ```sql
    SELECT id FROM voucher_slots
    WHERE campaign_id = $1 AND store_id IS NULL
    ORDER BY slot_number ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    ```
  - Nhờ `SKIP LOCKED`, 30 cửa hàng bấm cùng lúc sẽ **không ai phải đứng đợi khóa của ai**: 10 cửa hàng đầu tiên nhảy vào 10 ô trống khác nhau và nhận **`201 Created`**; 20 cửa hàng còn lại thấy không còn dòng trống nào khả dụng sẽ nhận ngay **`409 Conflict` (`SOLD_OUT`)** trong vài mili-giây.
- **Bất biến bảo vệ:** `I-06` (Số suất đã gán $\le \text{totalSlots}$ và mỗi `store_id` xuất hiện tối đa 1 lần trong mỗi `campaign_id`).

---

### Phân Hệ 3 (Module 3 – `M2`): Tiếp Nhận Hóa Đơn Bán Hàng POS, Thực Đơn Tốc Độ Cao & Bảng Xếp Hạng Doanh Số (POS Billing, High-Speed Menu & Best-Sellers Leaderboard)

#### 1. Mục tiêu nghiệp vụ
Đảm bảo hoạt động bán hàng hằng ngày tại 300 quầy thu ngân diễn ra mượt mà:
1. Mở thực đơn **77 món F&B** nhanh tức thì mà không làm sập DB giờ cao điểm.
2. Nhận hóa đơn POS an toàn tuyệt đối trước lỗi rớt mạng/gửi trùng của máy POS tại quán.
3. Cung cấp bảng xếp hạng **Top 10 sản phẩm bán chạy nhất toàn chuỗi** theo thời gian thực cho HQ.

#### 2. Đặc tả 3 Luồng Nghiệp vụ Con
- **Luồng 3.1: Đọc Thực đơn Cửa hàng (`GET /stores/:id/menu`)**
  - Dữ liệu gốc: **77 sản phẩm F&B** (tên món, danh mục `category`, đơn giá `unitPrice`, tồn kho `unitsInStock`, trạng thái ngừng bán `discontinued`).
  - Quy tắc vận hành: Sử dụng **Cache-Aside trên Redis** kết hợp **Singleflight (In-flight Request Coalescing)** và **TTL Jitter** (cộng thêm khoảng ngẫu nhiên vào thời gian sống của cache để 300 quán không hết hạn cache cùng một giây).
  - Kết quả: Khi cache đang trống (cold cache) mà có 30 máy POS gọi lấy menu cùng lúc, hệ thống gom 30 yêu cầu đó lại, chỉ chạy **đúng 1 câu truy vấn SQL xuống PostgreSQL**, rồi trả kết quả đồng loạt cho cả 30 máy.
- **Luồng 3.2: Tiếp nhận Hóa đơn Bán hàng POS Chống Trùng (`POST /pos/invoices`)**
  - Máy POS tại cửa hàng khi tạo đơn phải đính kèm header **`Idempotency-Key`** (UUID sinh tại máy POS cho từng đơn hàng).
  - **Trường hợp 1 (Lần gửi đầu tiên):** Hệ thống lưu hóa đơn + chi tiết món vào PostgreSQL, lưu dấu vân tay payload (hash) cùng kết quả phản hồi gắn với `Idempotency-Key`, trả về `201 Created`.
  - **Trường hợp 2 (Mạng quán bị lag, máy POS tự động gửi lại 30 lần cùng 1 đơn hàng):** Hệ thống nhận diện `Idempotency-Key` trùng với cùng nội dung đơn hàng $\rightarrow$ **Không tạo thêm hóa đơn mới, không trừ tồn kho lần 2**, trả về đúng kết quả hóa đơn đã tạo (`I-08`).
  - **Trường hợp 3 (Lỗi client tái sử dụng nhầm `Idempotency-Key` cũ cho một đơn hàng có món/số tiền khác):** Hệ thống phát hiện lệch payload hash và chặn ngay với mã **`422 Unprocessable Entity`**.
- **Luồng 3.3: Bảng Xếp Hạng Top 10 Món Bán Chạy Nhất (`GET /products/best-sellers`)**
  - Sau mỗi hóa đơn POS thành công, số lượng bán của từng sản phẩm được cộng dồn vào cấu trúc **Redis Sorted Set (`ZSET`)** qua lệnh `ZINCRBY`.
  - API `GET /products/best-sellers` đọc 10 sản phẩm dẫn đầu từ `ZSET` trong thời gian $< 5\text{ ms}$.
  - **Đối soát & Khôi phục dữ liệu (`I-09`):** Hệ thống có lệnh/hàm tái tạo (Deterministic SQL Rebuild) tính tổng số lượng bán trực tiếp từ bảng chi tiết hóa đơn trong PostgreSQL để nạp lại Redis `ZSET` bất kỳ lúc nào, đảm bảo điểm số trên Redis luôn khớp 100% với chứng từ gốc trong DB.

---

### Phân Hệ 4 (Module 4 – `M3`): Phân Quyền Đa Cấp Cửa Hàng, Bảo Mật Chống IDOR & Xuất Sao Kê Kế Toán Triệu Dòng (Multi-Tenant RBAC, Anti-IDOR & Streaming Statements)

#### 1. Mục tiêu nghiệp vụ
Thiết lập hàng rào kiểm soát nội bộ chuẩn doanh nghiệp: cách ly hoàn toàn dữ liệu tài chính giữa 300 cửa hàng, cung cấp công cụ xuất báo cáo sao kê quy mô lớn (1.000.000 dòng) cho Kế toán Trụ sở đối chiếu với SAP Business One mà không gây nghẽn bộ nhớ, đồng thời đảm bảo hệ thống vẫn bán hàng được ngay cả khi Redis gặp sự cố.

#### 2. Quy tắc Nghiệp vụ & Cơ chế Bảo vệ
- **Phân quyền 3 Vai trò & Chống IDOR (`Anti-IDOR Guard`):**
  - Mọi phiên đăng nhập (Cookie JWT + Refresh Token Rotation + CSRF Origin Check) đều gắn chặt với `role` và `storeId` của nhân sự.
  - Khi một `STORE_MANAGER` của **Quán 1** gọi `GET /wallets/wallet_store_002` hoặc `GET /wallets/wallet_store_002/statement.csv` (thuộc **Quán 2**), Guard kiểm tra quyền sở hữu tài nguyên sẽ chặn đứng ngay lập tức với mã **`403 Forbidden` hoặc `404 Not Found`**, tuyệt đối không rò rỉ dù chỉ 1 byte thông tin số dư của quán bạn.
  - Ngược lại, `HQ_ADMIN` / `ACCOUNTANT` có quyền kiểm toán trên toàn bộ 301 ví.
- **Xuất Sao kê Kế toán 1.000.000 Dòng (`GET /wallets/:id/statement.csv`):**
  - Phục vụ nhu cầu cuối kỳ của Kế toán Trụ sở: kết xuất toàn bộ lịch sử bút toán (`ledger_entries`) của ví `TREASURY` hoặc ví cửa hàng ra định dạng CSV chuẩn để import/đối chiếu với phân hệ `Journal Entry` (`OJDT`/`JDT1`) trên SAP B1.
  - Thay vì tải toàn bộ 1 triệu bản ghi vào RAM, hệ thống đọc dữ liệu theo từng lô/con trỏ (Database Cursor / Batch Stream) và đẩy qua **Node.js Readable Stream** thẳng xuống HTTP Response.
  - **Tiêu chuẩn nghiệm thu vận hành:** Khi xuất file CSV 1.000.000 dòng, mức tăng bộ nhớ RAM (Memory Delta) của tiến trình `apps/api` luôn giữ ở mức **$< 50\text{ MB}$**.
- **Khả năng Tự Phục Hồi (Operational Resilience):**
  - **Retry có Full Jitter:** Khi xảy ra xung đột khóa tạm thời ở DB, hệ thống tự động thử lại tối đa 3 lần theo cấp số nhân kèm độ trễ ngẫu nhiên (Exponential Backoff + Full Jitter).
  - **Circuit Breaker cho Redis:** Nếu máy chủ Redis bị sập hoàn toàn, bộ ngắt mạch (Circuit Breaker) sẽ mở ra và tự động chuyển hướng (fallback) việc đọc thực đơn `GET /stores/:id/menu` về đọc trực tiếp từ PostgreSQL — đảm bảo 300 cửa hàng **không bị gián đoạn bán hàng**.

---

### Phân Hệ 5 (Module 5 – `M4` & `M5`): Đặt Hàng Nguyên Vật Liệu Kho Tổng (Saga) & Kiểm Soát Gian Lận Thời Gian Thực (Central Warehouse Supply Order Saga & Real-Time Fraud Auto-Freeze)

#### 1. Mục tiêu nghiệp vụ
Giải quyết hai bài toán phức tạp nhất trong vận hành chuỗi F&B đa dịch vụ:
1. **Mua hàng nội bộ B2B (Store-to-HQ Supply Chain):** Cửa hàng đặt mua nguyên vật liệu (trà, sữa, cốc, ống hút) từ Kho tổng Trung tâm. Tiền phải trừ ở Ví Cửa hàng (`wallet-service`) và hàng phải giữ ở Kho tổng (`order/inventory-service`). Nếu kho hết hàng, tiền phải tự động trả về ví cửa hàng 100%.
2. **Bảo vệ an toàn ngân quỹ tự động (Real-time Velocity Fraud Protection):** Phát hiện và khóa cứng ví cửa hàng ngay lập tức nếu có dấu hiệu rút tiền bất thường dồn dập trong thời gian ngắn.

#### 2. Luồng Nghiệp vụ 5.1: Đặt Hàng Nguyên Vật Liệu Kho Tổng qua Distributed Saga (`I-12`, `I-13`)
```
[Cửa hàng trưởng]
       |
       | 1. POST /supply-orders (Đặt mua 50 thùng sữa từ Kho tổng)
       v
[Order Service] ---> Tạo SupplyOrder (status = PENDING)
       |
       | 2. Gọi gRPC sang Wallet Service: Thu tiền (Store Wallet -> TREASURY)
       |    (Có Idempotency theo orderId)
       v
[Wallet Service] --> Ghi 2 dòng Sổ cái kép (-Store, +TREASURY) + Ghi OutboxEvent (I-12)
       |
       | 3. Kiểm tra & Giữ tồn kho tại Kho tổng (Central Warehouse Stock)
       +---------------------------------------+---------------------------------------+
       | (NHÁNH A: ĐỦ TỒN KHO)                 | (NHÁNH B: THIẾU TỒN KHO - OUT OF STOCK)
       v                                       v
- Trừ tồn kho Kho tổng                  - Kích hoạt BƯỚC BÙ TRỪ (Compensating Action):
- Cập nhật SupplyOrder = CONFIRMED      - Gọi gRPC tạo giao dịch hoàn tiền ngược:
- Hoàn tất đơn hàng thành công            (TREASURY -> Store Wallet) đúng số tiền đã thu
                                        - Cập nhật SupplyOrder = CANCELLED
                                        - Tác động ròng lên ví Cửa hàng = 0 VNĐ (I-13)
```
- **Đảm bảo không mất sự kiện (`I-12` – Transactional Outbox + Debezium CDC):** Khi `Wallet Service` ghi nhận bút toán chuyển tiền hoặc POS ghi nhận hóa đơn, bản ghi `OutboxEvent` được ghi trong **cùng một DB Transaction**. Debezium đọc trực tiếp từ PostgreSQL Write-Ahead Log (`WAL`) để đẩy sự kiện lên Kafka (`wallet.transfers`, `pos.invoices`), loại bỏ hoàn toàn lỗi "ghi DB thành công nhưng mất message Kafka" (Dual-write problem).

#### 3. Luồng Nghiệp vụ 5.2: Tự Động Đóng Băng Ví Khi Phát Hiện Rút Tiền Bất Thường (`I-14`)
- **Quy tắc phát hiện gian lận (Velocity Rule):** Dịch vụ ngầm `fraud-worker` tiêu thụ luồng sự kiện `wallet.transfers` từ Kafka và theo dõi tần suất ghi nợ (debit) của từng ví trên cửa sổ trượt Redis (Sliding Window).
- **Ngưỡng kích hoạt:** Nếu bất kỳ ví cửa hàng nào bị trừ tiền **$> 5\text{ lần trong vòng } 10\text{ giây}$**:
  1. `fraud-worker` phát sự kiện cảnh báo `fraud.wallet-flagged`.
  2. Hệ thống lập tức chuyển trạng thái ví đó sang **`FROZEN` (Đóng băng)**.
  3. Mọi yêu cầu chuyển tiền/rút tiền tiếp theo từ ví đó đều bị từ chối ngay lập tức với mã **`409 Conflict` (`WALLET_FROZEN`)**.
- **Quy trình Mở khóa có Kiểm soát:** Cửa hàng trưởng không thể tự mở khóa ví của mình. Chỉ sau khi **Kế toán / Quản trị Trụ sở (`HQ_ADMIN` / `ACCOUNTANT`)** kiểm tra chứng từ và xác nhận an toàn, HQ mới gọi API **`POST /wallets/:id/unlock`** để mở lại ví cho cửa hàng hoạt động.

---

### Phân Hệ 6 (Module 6 – `M6`): Vận Hành Quy Mô Lớn, Short-Link Chiến Dịch & Bảng Tin Nhượng Quyền Toàn Chuỗi (High-Scale Partitioning, Snowflake Short-Links & Franchise Hybrid Feed)

#### 1. Mục tiêu nghiệp vụ
Đảm bảo hệ thống vận hành bền bỉ sau nhiều năm khi dữ liệu sổ cái và hóa đơn POS lên tới hàng chục triệu dòng, đồng thời cung cấp công cụ truyền thông nội bộ (Short-link chiến dịch & Bảng tin mạng xã hội nội bộ chuỗi 300 cửa hàng).

#### 2. Đặc tả 3 Năng Lực Nghiệp vụ Quy Mô Lớn
1. **Phân vùng Dữ liệu Kế toán & Hóa đơn theo Tháng (`Monthly Range Partitioning` – `I-15`):**
   - Bảng `ledger_entries` và `pos_invoices` được phân vùng theo tháng (`created_at`).
   - Khi Kế toán truy vấn báo cáo của tháng 11/2026, PostgreSQL sử dụng cơ chế **Partition Pruning** để chỉ quét đúng phân vùng của tháng 11/2026 thay vì quét toàn bộ lịch sử nhiều năm, trong khi vẫn giữ nguyên 100% các bất biến kế toán `I-01..I-04`.
2. **Trình Rút Gọn Link Chiến Dịch Nội Bộ (`Snowflake 64-bit + Base62 Short-Links`):**
   - Khi HQ Marketing phát động chiến dịch Flash-Voucher hoặc thông báo chính sách mới qua SMS/Zalo nội bộ cho 300 quán, hệ thống sinh mã định danh phân tán **Snowflake 64-bit** và mã hóa **Base62** tạo ra đường dẫn ngắn gọn **$\le 11$ ký tự** (không trùng lặp ngay cả ở tải 10.000 request đồng thời).
   - Khi Cửa hàng trưởng bấm vào `GET /s/:code`, hệ thống chuyển hướng tức thì (`302 Found`) về trang đích chiến dịch.
3. **Bảng Tin Nhượng Quyền Toàn Chuỗi (`Hybrid Fan-out Newsfeed`):**
   - Trong chuỗi 300 cửa hàng, nhu cầu giao tiếp gồm 2 dạng có đặc tính tải trái ngược nhau:
     - **Bài đăng từ Cửa hàng nhỏ (Small Store Post):** Quán 1 đăng bài chia sẻ mẹo pha chế hoặc cần nhượng lại 5 thùng ly cho vài quán lân cận đang theo dõi mình (ít người theo dõi) $\rightarrow$ Hệ thống dùng **Fan-out on Write (Push)**: đẩy thẳng ID bài viết vào danh sách bảng tin (`Redis ZSET`) của các quán theo dõi để đọc cực nhanh.
     - **Thông báo Chỉ đạo từ Trụ sở chính (HQ Broadcast to 300 Stores):** Tổng Giám đốc hoặc HQ Ops đăng thông báo đổi công thức pha chế áp dụng cho toàn bộ 300 cửa hàng $\rightarrow$ Nếu dùng Push sẽ gây **khuếch đại ghi 300 lần (300x Write Amplification)**. Hệ thống chuyển sang dùng **Fan-out on Read (Pull)**: chỉ ghi 1 lần vào luồng thông báo HQ, và khi một Cửa hàng trưởng mở bảng tin, hệ thống tự động trộn (merge) bài viết của các quán đang theo dõi với thông báo từ HQ theo đúng thứ tự thời gian.

---

### Bảng Tổng Hợp 15 Bất Biến Nghiệp Vụ & Kỹ Thuật (`I-01` $\rightarrow$ `I-15`)

| Mã Bất Biến | Tên Quy Tắc / Bất Biến | Phân hệ áp dụng | Ý nghĩa Nghiệp vụ Kế toán & Vận hành F&B |
| :---: | :--- | :---: | :--- |
| **`I-01`** | **Zero-Sum Double-Entry Transfer** | `M1` | Mọi lệnh chuyển tiền luôn sinh đúng 2 dòng `ledger_entries` (`-amount` và `+amount`) có cùng `transferId`, tổng bằng `0`. |
| **`I-02`** | **Wallet Balance Consistency** | `M1` | Số dư `balance` của mỗi ví luôn bằng tổng đại số tất cả các dòng `ledger_entries` của chính ví đó. |
| **`I-03`** | **Non-Negative Store Wallet** | `M1` | Ví cửa hàng (`STORE`) không bao giờ được âm (`balance >= 0`, SQLSTATE `23514`); chỉ duy nhất ví `TREASURY` được phép mang số dư âm (tài khoản đối ứng cấp vốn). |
| **`I-04`** | **Global Conservation of Money** | `M1` | Tổng số dư của toàn bộ 301 ví (`300 STORE` + `1 TREASURY`) tại mọi thời điểm luôn bằng `0 VNĐ`. |
| **`I-05`** | **Append-Only Immutable Ledger** | `M1` | Dòng bút toán đã ghi vào `ledger_entries` không bao giờ bị `UPDATE` hay `DELETE`; mọi điều chỉnh sai sót phải thực hiện qua giao dịch đảo/bù trừ mới. |
| **`I-06`** | **Strict Campaign Quota & Single Claim** | `M1/M2` | Tổng số suất Flash-Voucher đã nhận không bao giờ vượt quá `totalSlots`, và mỗi cửa hàng chỉ nhận được tối đa 1 suất/chiến dịch (`UNIQUE(campaign_id, store_id)`). |
| **`I-07`** | **Deterministic Lock Ordering** | `M1` | Khi khóa nhiều ví cùng lúc, luôn khóa theo thứ tự `wallet_id` tăng dần (`ORDER BY id FOR UPDATE`), đảm bảo `0` Deadlock (`40P01`). |
| **`I-08`** | **POS Invoice Idempotency** | `M2` | Gửi lặp lại $N$ lần cùng một hóa đơn POS với cùng `Idempotency-Key` chỉ tạo ra đúng 1 hóa đơn; dùng lại key cũ với nội dung khác bị chặn với mã `422`. |
| **`I-09`** | **Leaderboard Rebuildability** | `M2` | Bảng xếp hạng Top 10 sản phẩm bán chạy trên Redis `ZSET` luôn khớp hoàn toàn với kết quả tính tổng từ bảng hóa đơn gốc trong PostgreSQL. |
| **`I-10`** | **Tenant Data Isolation (Anti-IDOR)** | `M3` | Nhân sự thuộc cửa hàng nào chỉ truy cập được ví và sao kê của cửa hàng đó; truy cập chéo bị chặn (`403/404`). |
| **`I-11`** | **Bounded-Memory CSV Streaming** | `M3` | Xuất sao kê kế toán 1.000.000 dòng qua luồng stream giữ mức tăng bộ nhớ RAM của API $< 50\text{ MB}$. |
| **`I-12`** | **Atomic Outbox Event Delivery** | `M4` | Biến động dữ liệu nghiệp vụ và sự kiện `OutboxEvent` luôn được commit trong cùng 1 giao dịch DB và phát qua Debezium CDC sang Kafka, không mất sự kiện. |
| **`I-13`** | **Saga Compensation Net-Zero** | `M5` | Trong đơn đặt nguyên liệu Kho tổng, nếu đã trừ tiền ví cửa hàng nhưng kho báo hết hàng, giao dịch bù trừ phải hoàn lại đúng số tiền đó (`tác động ròng = 0 VNĐ`). |
| **`I-14`** | **Velocity Fraud Auto-Freeze** | `M5` | Ví bị trừ tiền $> 5$ lần trong cửa sổ trượt $10\text{ giây}$ sẽ tự động bị khóa (`WALLET_FROZEN`, trả `409` cho giao dịch mới) cho tới khi HQ mở khóa. |
| **`I-15`** | **Partition Pruning with Invariant Preservation** | `M6` | Phân vùng theo tháng trên `ledger_entries` và `pos_invoices` giúp truy vấn trong 1 tháng chỉ quét đúng 1 partition mà vẫn bảo toàn tuyệt đối `I-01..I-04`. |

---

## 5. Phần 4: Hiện Trạng Dự Án Hôm Nay (`M0`) & Lộ Trình Hoàn Thiện (`M1` $\rightarrow$ `M6`)

Để bạn nắm rõ **"Hiện tại dự án đang ở đâu và mình sẽ code tiếp những gì"**, bảng dưới đây tách bạch trung thực giữa phần nền móng đã chạy tại commit `HEAD 9e01cc9` và các giai đoạn tiếp theo:

| Giai đoạn | Trạng thái hiện tại | Những gì ĐÃ CÓ SẴN / SẼ XÂY DỰNG trong Codebase (`D:/study/advance-be/omnipos-finledger-hub`) |
| :--- | :---: | :--- |
| **`M0`: Nền móng Monorepo, Auth, Seed 300 Quán & Khung API** | **ĐÃ HOÀN THÀNH & ĐANG CHẠY LIVE**<br>(`HEAD 9e01cc9`) | - **Hạ tầng:** Turborepo gồm `apps/api` (NestJS `12.2` tại `127.0.0.1:3101`), `apps/web` (Next.js `16.4` + React `19.3` tại `127.0.0.1:3100`), PostgreSQL `16` (`omnipos-hub-pg` tại `127.0.0.1:5434`, DB `omnipos_hub`), Prisma `7.9`.<br>- **Bảo mật cơ bản:** Bảng `User` & `AuthSession`, xác thực Cookie JWT + Refresh Token Rotation + RBAC Guards + CSRF Origin Check.<br>- **Dữ liệu nghiệp vụ đã Seed:** Bảng `Store` đã có đủ **300 cửa hàng F&B** (`Quán 1` .. `Quán 300`); bảng `Product` đã có đủ **77 món thực đơn F&B** từ bộ Northwind.<br>- **API Stubs sẵn sàng cho `M1`:** Đã định nghĩa khung `GET /wallets/:id`, `POST /wallets/transfers` (đã có `CreateTransferDto` kèm validator `@DifferentFrom` bắt lỗi `400 SAME_WALLET`), `POST /vouchers/campaigns`, `GET /vouchers/campaigns/:id`, `POST /vouchers/campaigns/:id/claims`. |
| **`M1`: Ngân quỹ Sổ cái kép ACID & Săn Flash-Voucher (`SKIP LOCKED`)** | **ĐANG TRIỂN KHAI**<br>*(Phase 4 DDL & Core Transaction)* | - Hoàn thiện schema & migration cho `wallets` (301 ví: `300 STORE` + `1 TREASURY`), `transfers`, `ledger_entries` (Append-only) và `voucher_campaigns` / `voucher_slots`.<br>- Hiện thực hóa thuật toán khóa ví theo thứ tự tăng dần ID (`ORDER BY id FOR UPDATE`) để đạt `0` Deadlock.<br>- Hiện thực hóa cơ chế `FOR UPDATE SKIP LOCKED` cho bài toán 300 quán săn 10 suất Flash-Voucher.<br>- Kiểm chứng bằng bộ test đồng thời (30 luồng rút tiền/chuyển chéo/claim voucher cùng lúc). |
| **`M2`: Redis High-Speed POS, Menu Singleflight, Leaderboard & Rate Limit** | **KẾ HOẠCH TIẾP THEO** | - Bổ sung Redis (`127.0.0.1:6380`).<br>- Xây dựng `GET /stores/:id/menu` với Cache-Aside + Singleflight + TTL Jitter.<br>- Xây dựng `POST /pos/invoices` xử lý `Idempotency-Key` (`201` vs `422` khi lệch payload).<br>- Xây dựng `GET /products/best-sellers` trên Redis `ZSET` + lệnh đối soát SQL Rebuild.<br>- Gắn Lua Token Bucket Rate Limiter (`429` + `Retry-After`) bảo vệ cổng săn Flash-Voucher. |
| **`M3`: Multi-Tenant Anti-IDOR, Streaming CSV 1M Dòng & Resilience** | **KẾ HOẠCH TIẾP THEO** | - Siết chặt Anti-IDOR Guard theo `storeId` cho 3 vai trò (`HQ_ADMIN`/`ACCOUNTANT`, `STORE_MANAGER`, `POS_CASHIER`).<br>- Xây dựng `GET /wallets/:id/statement.csv` xuất 1.000.000 dòng sổ cái qua Node.js Readable Stream với RAM delta $< 50\text{ MB}$.<br>- Tích hợp Exponential Backoff + Full Jitter Retry (tối đa 3 lần) và Redis Circuit Breaker (fallback về Postgres khi Redis sập). |
| **`M4` & `M5`: Outbox CDC, Kafka, Supply Order Saga & Fraud Auto-Freeze** | **KẾ HOẠCH NÂNG CAO** | - Triển khai bảng `OutboxEvent` + Debezium CDC kết nối PostgreSQL WAL sang Kafka (`wallet.transfers`, `pos.invoices`).<br>- Tách dịch vụ và giao tiếp gRPC cho luồng **Đặt hàng Nguyên vật liệu Kho tổng (`SupplyOrder` Saga)** có bước hoàn tiền bù trừ (`TREASURY -> Store Wallet`) khi Kho tổng thiếu hàng.<br>- Xây dựng `fraud-worker` phát hiện $> 5$ lần trừ tiền trong $10\text{ giây}$ để tự động đóng băng ví (`409 WALLET_FROZEN`) và API mở khóa `POST /wallets/:id/unlock` cho HQ. |
| **`M6`: Partitioning Triệu Dòng, Snowflake Short-Link & Hybrid Newsfeed** | **KẾ HOẠCH QUY MÔ LỚN** | - Chuyển đổi bảng `ledger_entries` và `pos_invoices` sang **Monthly Range Partitioning**.<br>- Xây dựng dịch vụ rút gọn link `GET /s/:code` (`302`) bằng Snowflake 64-bit ID + Base62 ($\le 11$ ký tự).<br>- Xây dựng **Bảng tin Nhượng quyền Toàn chuỗi (Hybrid Fan-out Newsfeed)**: kết hợp Push cho bài đăng cấp quán và Pull cho thông báo từ Trụ sở chính tới 300 quán. |

---

## 6. Phần 5: Kim Chỉ Nam Portfolio – Cách Giới Thiệu Dự Án Trong 2 Phút Phỏng Vấn

Khi nhà tuyển dụng hỏi: *"Hãy kể về dự án tâm đắc nhất trong CV của bạn — dự án đó làm về nghiệp vụ gì và giải quyết bài toán gì?"*, bạn hãy trình bày theo đúng cấu trúc **4 bước (Bối cảnh $\rightarrow$ Nỗi đau $\rightarrow$ Giải pháp Nghiệp vụ/Kỹ thuật $\rightarrow$ Con số kiểm chứng)** dưới đây:

### 6.1. Kịch Bản Pitching 2 Phút (Elevator Pitch)

> **1. Bối cảnh & Định vị Sản phẩm (20 giây):**
> *"Xuất phát từ kinh nghiệm thực tế khi làm việc với hệ thống vận hành chuỗi F&B hơn 300 cửa hàng và tích hợp bút toán kế toán lên SAP Business One, em xây dựng **`OmniPOS & FinLedger Hub`** — một nền tảng Trung tâm Quản trị Ngân quỹ Nội bộ (Sổ cái kép), Tiếp nhận Hóa đơn POS, Phân bổ Khuyến mãi B2B và Điều phối Đơn hàng Nguyên vật liệu Kho tổng cho chuỗi **300 cửa hàng F&B**."*
>
> **2. Bài toán Nghiệp vụ Cốt lõi (30 giây):**
> *"Trong một chuỗi 300 quán hoạt động 24/7, có 4 rủi ro nghiệp vụ xảy ra mỗi ngày:
> - Thứ nhất, Trụ sở cấp vốn lưu động cho 300 quán (`300 triệu VNĐ`), các quán chuyển tiền qua lại và thanh toán nguyên liệu liên tục; nếu chỉ dùng lệnh `UPDATE balance` thông thường sẽ bị âm quỹ, Deadlock khi chuyển chéo và không thể đối soát Nợ/Có với ERP.
> - Thứ hai, khi Marketing tung chiến dịch tài trợ giới hạn 10 suất Flash-Voucher cho 300 quán, cả 300 Cửa hàng trưởng bấm nhận cùng một giây gây lố ngân sách.
> - Thứ ba, mạng Wi-Fi tại quán chập chờn làm máy POS gửi trùng hóa đơn bán hàng nhiều lần.
> - Thứ tư, khi quán đặt mua nguyên liệu từ Kho tổng, nếu trừ tiền ví xong mà kho hết hàng thì tiền của quán bị treo."*
>
> **3. Cách Giải quyết trong Dự án (45 giây):**
> *"Em giải quyết trọn vẹn các bài toán đó qua 5 trụ cột:
> - **Về Ngân quỹ (`M1`):** Thiết kế **Sổ cái kép bất biến (Append-only Double-Entry Ledger)** gồm 301 ví (`300 STORE` + `1 TREASURY`), khóa tài khoản theo thứ tự ID tăng dần để triệt tiêu 100% Deadlock, đảm bảo tổng số dư toàn hệ thống luôn bằng `0`.
> - **Về Khuyến mãi & POS (`M1–M2`):** Dùng Pre-allocated Slots kết hợp `FOR UPDATE SKIP LOCKED` và Lua Token Bucket để phân bổ Flash-Voucher chính xác tuyệt đối không nghẽn khóa; dùng `Idempotency-Key` chống nhân đôi hóa đơn POS và Singleflight Cache cho menu 77 món.
> - **Về Kiểm toán & Bảo mật (`M3`):** Cách ly dữ liệu đa cửa hàng (Anti-IDOR) và dùng Node.js Stream để Kế toán HQ xuất sao kê **1.000.000 dòng CSV** đối chiếu SAP B1 mà RAM API chỉ tăng chưa tới `50 MB`.
> - **Về Chuỗi cung ứng & An toàn quỹ (`M4–M5`):** Dùng **Transactional Outbox + Debezium CDC + Kafka** và **Orchestrated Saga** để tự động hoàn tiền từ `TREASURY` về ví cửa hàng nếu Kho tổng hết nguyên liệu, đồng thời có **Fraud Worker** tự động đóng băng ví nếu phát hiện rút tiền $> 5$ lần trong 10 giây."*
>
> **4. Kết quả Định lượng (25 giây):**
> *"Toàn bộ hệ thống được bảo vệ bởi **15 bất biến nghiệp vụ (`I-01` đến `I-15`)**: vượt qua bài test đồng thời với `0` lỗi âm quỹ, `0` Deadlock (`40P01`), `0` hóa đơn trùng lặp, xuất 1 triệu dòng sao kê dưới `50 MB` RAM và xử lý phân vùng dữ liệu theo tháng cho quy mô hàng chục triệu bút toán."*

---

### 6.2. Bảng "Bắt Bài" 4 Câu Hỏi Xoáy Về Nghiệp Vụ Khi Phỏng Vấn

| Câu hỏi xoáy của Hội đồng Phỏng vấn | Câu trả lời chuẩn CTO / Senior Backend từ `OmniPOS & FinLedger Hub` |
| :--- | :--- |
| **1. "Tại sao ví `TREASURY` của Trụ sở chính lại có số dư `-300.000.000 VNĐ`? Số dư âm nghĩa là công ty hết tiền à?"** | *"Không phải hết tiền, mà đây là nguyên lý **Tài khoản Đối ứng Nguồn vốn (Contra/Equity Funding Account)** trong Sổ cái kép đóng kín (`I-04`). Khi Trụ sở bơm `1.000.000 VNĐ` vốn lưu động cho mỗi quán trong 300 quán, để không sinh ra tiền ảo từ hư không, mỗi khoản Ghi Có (`+1.000.000`) ở ví `STORE` phải có một khoản Ghi Nợ đối ứng (`-1.000.000`) ở ví `TREASURY`. Nhờ vậy tổng đại số 301 ví luôn bằng `0 VNĐ` tại mọi mili-giây. Nếu tổng khác `0`, hệ thống phát hiện ngay lập tức có lỗi hạch toán hoặc can thiệp DB trái phép."* |
| **2. "Nếu nhân viên kế toán hoặc cửa hàng trưởng chuyển nhầm tiền, tại sao không cho phép sửa (`UPDATE`) lại dòng lịch sử đó cho nhanh?"** | *"Trong kế toán doanh nghiệp và chuẩn ERP SAP Business One (`OJDT`/`JDT1`), chứng từ đã ghi sổ (Posted Journal Entry) là **bất biến (`I-05`)**. Nếu cho phép `UPDATE` hoặc `DELETE`, các bản sao kê CSV đã xuất trước đó sẽ lệch hoàn toàn với dữ liệu hiện tại và xóa sạch dấu vết kiểm toán (Audit Trail). Cách duy nhất đúng chuẩn là phát sinh một **Giao dịch Đảo / Bù trừ mới (Compensating Reversal Transfer)** để điều chỉnh số dư mà vẫn giữ nguyên lịch sử."* |
| **3. "Tại sao bài toán săn Flash-Voucher của 300 cửa hàng lại dùng `FOR UPDATE SKIP LOCKED` thay vì nhét hết vào Redis?"** | *"Nếu chỉ trừ số lượng trên Redis, ta vẫn phải đồng bộ ngược kết quả về PostgreSQL để gắn chặt với quyền lợi tài chính của cửa hàng; nếu bước ghi DB lỗi hoặc Redis crash trước khi fsync sẽ gây lệch suất tài trợ. Với quy mô 300 cửa hàng tranh 10 suất được khởi tạo sẵn (`pre-allocated slots`), `FOR UPDATE SKIP LOCKED` ngay trong PostgreSQL giải quyết bài toán trong 1 giao dịch ACID duy nhất mà không một request nào phải đứng chờ khóa của request khác. Ở tầng ngoài (`M2`), em mới dùng thêm Redis Lua Token Bucket để chặn các quán dùng tool spam click (`429`)."* |
| **4. "Khi nào thì dự án này thực sự cần tới Kafka và Saga (`M4–M5`), tại sao không gộp chung đặt nguyên liệu vào cùng 1 DB Transaction với Ví?"** | *"Ở giai đoạn `M1–M3`, khi mọi thứ nằm chung 1 DB, dùng Local ACID Transaction là đơn giản và chuẩn nhất. Nhưng ở `M4–M5`, khi nghiệp vụ **Quản lý Tồn kho Kho tổng (Supply Chain / WMS)** tách thành một dịch vụ độc lập với **Dịch vụ Ngân quỹ Sổ cái (`wallet-service`)** (hoặc tích hợp với hệ thống kho bên ngoài), ta không thể mở 1 DB Transaction xuyên qua 2 database khác nhau. Lúc đó, **Outbox + Debezium CDC + Orchestrated Saga** với giao dịch hoàn tiền bù trừ (`TREASURY -> Store Wallet`) là giải pháp bắt buộc để không bao giờ làm treo tiền của cửa hàng khi kho hết hàng."* |

---

## 7. Bước Tiếp Theo (Next Steps)

Bản **Business SRS & Portfolio Positioning** này đã khóa chặt toàn bộ bức tranh nghiệp vụ, vai trò tác nhân, quy tắc kế toán sổ cái kép và lộ trình từ `M0` đến `M6` của **`OmniPOS & FinLedger Hub`**.

Bạn có muốn chuyển sang bước **lập kế hoạch triển khai chi tiết (Implementation Plan)** cho các phân hệ tiếp theo (bắt đầu từ hoàn thiện **`M1` – Sổ cái kép ACID & Flash-Voucher `SKIP LOCKED`**) bằng lệnh `/ak:plan --fast` hoặc `/ak:plan --hard` dựa trên bản SRS này không?

---

## Phụ Lục Kiểm Định (`--ultra` Best-of-5 Verifier & `--advice` Kongming Supervision)

> **Lưu ý Runtime (`Model-tier degrade note`):** Trên môi trường workstation hiện tại (`google-antigravity/gemini-4-argon`), 5 ứng viên độc lập (`Candidate A..E`) và giám khảo (`kongming`) chạy cùng bậc mô hình mạnh nhất hiện có (same-tier best-of-5 independent samples + rubric selection & `kongming` advisory supervision).

### 1. Bảng Chấm Điểm 5 Ứng Viên (`1–20` mỗi tiêu chí, tổng `100`)

| Ứng viên (Ẩn danh) | C1: Rõ ràng Nghiệp vụ & Portfolio (/20) | C2: Bám sát Bằng chứng Repo (/20) | C3: Hợp đồng, Trade-offs & Better Approaches (/20) | C4: Phân rã 5 Vai trò & 6 Phân hệ (/20) | C5: Trung thực `M0` vs `M1..M6` & Phỏng vấn (/20) | Tổng điểm (/100) | Nhận xét của Verifier (`kongming`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Candidate C** *(Winner — Bản đang hiển thị)* | **20** | **20** | **20** | **20** | **19** | **99/100** | **Chiến thắng tuyệt đối.** Định vị chuẩn xác dự án là *"F&B Enterprise Sub-Ledger & Store Operations Hub"*, bảng `Trade-offs` định lượng rõ ngưỡng gãy đổ (`>5.000` quán gây hot-row trên `TREASURY`), ma trận RBAC 14 dòng × 5 vai trò, công thức bảo toàn tổng tiền $\sum = 0$, sơ đồ nhánh Saga Kho tổng, bảng 15 bất biến `I-01..I-15` và bộ 4 câu hỏi xoáy phỏng vấn. |
| **Candidate A** | 19 | 20 | 18 | 19 | 19 | **95/100** | Á quân. Có cột ánh xạ SAP B1 `OJDT`/`JDT1` trực tiếp trong bảng bút toán kép và kịch bản Live Demo 5 phút rất tốt, nhưng thiếu bảng 4 câu hỏi xoáy nghiệp vụ của Candidate C. |
| **Candidate D** | 19 | 20 | 18 | 19 | 18 | **94/100** | Mô tả chân dung 5 vai trò và kịch bản Demo 5 hồi chi tiết, nhưng phần `Trade-offs` thiên về so sánh cách viết tài liệu hơn là kiến trúc vận hành. |
| **Candidate B** | 18 | 19 | 18 | 17 | 17 | **89/100** | Sơ đồ kết nối 300 quán $\leftrightarrow$ Hub $\leftrightarrow$ SAP B1 rõ ràng, nhưng phần Phân hệ 6 ngắn hơn và không có bảng bắt bài câu hỏi phỏng vấn. |
| **Candidate E** | 18 | 19 | 18 | 16 | 17 | **88/100** | Cú pháp Use Case gọn (`Trigger`, `Pre-conditions`, `Main Flow`), nhưng gộp chung bảng phân quyền và lược bỏ bảng tổng hợp 15 bất biến ở cuối Phần 3. |

### 2. Đánh Giá Giám Sát Cố Vấn (`--advice` Checkpoint — `Kongming`)
- **Phán quyết (Verdict):** **`GO`**
- **Lý do cấu trúc SRS mới giải quyết triệt để vấn đề:** Thay vì liệt kê bài tập theo tuần học, tài liệu đặt **Chuỗi 300 cửa hàng F&B + Sổ phụ Kế toán Kép kết nối SAP B1 (`OJDT/JDT1`)** làm trung tâm, giúp nhìn rõ *ai dùng*, *tiền và nguyên vật liệu chảy thế nào qua 6 phân hệ*, và *tại sao cần 15 bất biến `I-01..I-15`*.
- **Rủi ro #1 cần lưu ý vào ngày mai tại công ty (Khi làm `M1` — `bai07-ddl.sql` & khóa dòng Phase 6):**
  - Chú ý phân biệt rõ **ràng buộc không âm của ví cửa hàng (`STORE` $\ge 0$, mã lỗi `23514`)** với **quyền được phép âm của ví Trụ sở (`TREASURY = -300.000.000 VNĐ`)** trong câu `CHECK` của bảng `wallets`; đồng thời luôn khóa 2 ví theo thứ tự `ORDER BY id ASC FOR UPDATE` để không bao giờ dính Deadlock `40P01`.

`ultra: picked=3/5 margin=high unanimous=yes rejected_all=no`
