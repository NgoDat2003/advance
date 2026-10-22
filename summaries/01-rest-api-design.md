# Buổi 1: REST API Design — Kiến Trúc & Thiết Kế API Chuẩn Mực

> **Môn học:** Advance Backend Engineering  
> **Tài liệu gốc:** `Tài Liệu/1. REST API Design.pdf` & `Tài Liệu/1. REST API Design.md`  
> **Chủ đề chính:** Tư duy thiết kế API, Quy ước RESTful, Tối ưu Pagination/Deferred Join, Async API (Polling vs Webhook), Idempotency Key, Chuẩn hóa API Documentation.

---

## 1. Tư Duy Thiết Kế (Design Mindset)

> *“Let your plans be dark and impenetrable as night, and when you move, fall like a thunderbolt.”* — Sun Tzu

### 1.1. Triết lý "Design First"
- **High-level thinking (Bao quát toàn diện):** Nhìn thấy trước toàn bộ luồng dữ liệu, các trường hợp biên (edge cases) và ngoại lệ trước khi triển khai code.
- **Tiết kiệm tài nguyên:** Sửa một bản thiết kế API trên tài liệu chỉ mất vài phút; sửa một API đã code và tích hợp vào hệ thống tốn hàng tuần và lãng phí nhân lực.
- **Phối hợp liên nhóm (Cross-team Coordination):** Backend, Frontend, Mobile, QA, DevOps làm việc song song dựa trên một bản hợp đồng API (API Contract) thống nhất.
- **Định vị kỹ sư:** Khả năng thiết kế hệ thống phân biệt một thợ code với một kỹ sư phần mềm cao cấp.

### 1.2. Bốn trụ cột tư duy cốt lõi
1. **Scalable (Khả năng mở rộng):** Thiết kế sẵn sàng cho lượng tải gấp $100\times$ hoặc $1000\times$, tránh các điểm nghẽn cổ chai (bottlenecks).
2. **Consistency (Tính nhất quán):** Thống nhất tuyệt đối về quy ước đặt tên (naming conventions), cấu trúc URL, format request/response, mã lỗi trong toàn bộ hệ sinh thái dịch vụ.
3. **Inspect every single aspect (Săm soi từng khía cạnh):** Không bỏ sót bất kỳ chi tiết nào: HTTP Method, Status Code, Headers, Query Parameters, Validation, Cache, Concurrency, Timeout, Network Failure.
4. **No one fits all — Trade-offs (Sự đánh đổi):** Mọi quyết định kỹ thuật đều là sự đánh đổi. Không có thiết kế hoàn hảo tuyệt đối, chỉ có thiết kế phù hợp nhất với bối cảnh và ràng buộc nghiệp vụ.

---

## 2. Quy Ước RESTful API Chuẩn Công Nghiệp (REST Conventions)

### 2.1. Phân biệt thuộc tính HTTP: "Safe" vs "Idempotent"
- **Safe (An toàn):** Request chỉ đọc dữ liệu, **không làm biến đổi** trạng thái tài nguyên trên server.
- **Idempotent (Bảo toàn kết quả / Bất biến):** Một request dù được gửi **1 lần hay $N$ lần liên tiếp**, trạng thái dữ liệu trên server và kết quả cuối cùng vẫn hoàn toàn như nhau.

| HTTP Method | Hành vi | Safe? | Idempotent? | Ghi chú kỹ thuật |
| :--- | :--- | :---: | :---: | :--- |
| **GET** | Read | **Yes** | **Yes** | Chỉ lấy dữ liệu, không sinh side-effect. |
| **HEAD** | Headers Only | **Yes** | **Yes** | Kiểm tra tài nguyên/cache mà không tải body. |
| **OPTIONS** | CORS / Capabilities | **Yes** | **Yes** | Thăm dò các method và header server hỗ trợ. |
| **TRACE** | Loopback / Diagnostic | **Yes** | **Yes** | Chẩn đoán mạng (thường tắt trên production vì lý do bảo mật). |
| **PUT** | Update Totally | **No** | **Yes** | Thay thế hoàn toàn resource. Gửi lại nhiều lần kết quả vẫn là bản ghi đó. |
| **DELETE** | Delete / Disable | **No** | **Yes** | Xóa 1 lần hay nhiều lần thì tài nguyên đó vẫn ở trạng thái đã bị xóa. |
| **POST** | Create | **No** | **No** | Mỗi lần gọi tạo thêm 1 resource mới (sinh side-effect mới). |
| **PATCH** | Update Partially | **No** | **No** | Cập nhật trường lẻ; không mặc định idempotent (ví dụ: phép toán tăng giảm số lượng). |

### 2.2. Quy chuẩn cấu trúc URL và Body
- **Dùng danh từ thay cho động từ:** Tránh `/createOrder`, `/getUser`. Dùng danh từ số nhiều: `/orders`, `/users`.
- **Quan hệ lồng nhau (Nesting):** Biểu diễn mối quan hệ phụ thuộc cha - con:
  ```http
  GET https://ronin-engineer.com/api/v1/posts/<post_id>/comments
  ```
- **API Versioning:** Luôn định tuyến phiên bản rõ ràng trên URL (`/api/v1/`, `/api/v2/`).
- **Quy tắc định dạng (Casing):**
  - **Slug-case (kebab-case)** cho URL: `/user-service/api/v1/...`
  - **Snake_case** cho Request Body và Response Body: `{ "user_id": 34, "created_at": 1692163008 }`

### 2.3. Bài tập thực hành: API Routing trong Microservices
Trong kiến trúc Microservices có API Gateway, việc đặt **Prefix Path** theo domain/service giúp Gateway định tuyến (reverse proxy) chính xác và dễ bảo trì:
- **Tạo đơn hàng:** `POST /order-service/api/v1/orders`
- **Lấy chi tiết đơn hàng 145:** `GET /order-service/api/v1/orders/145`
- **Cập nhật riêng tuổi của user 34:** `PATCH /user-service/api/v1/users/34`
- **Vô hiệu hóa user 34:** `DELETE /user-service/api/v1/users/34`

### 2.4. Kỹ thuật Phân trang (Pagination) & Tối ưu Cơ sở dữ liệu lớn

#### Hai phương pháp phân trang phổ biến:
1. **Page & Size:** `GET /users?page=0&size=10`
   - *Use case:* Màn hình quản trị (Admin Portal) có thanh phân trang nhảy số (Pagination bar).
   - *Lưu ý:* Bắt buộc tài liệu hóa rõ `page` bắt đầu từ 0 hay từ 1.
2. **Offset & Limit:** `GET /users?offset=0&limit=10`
   - *Use case:* Cuộn vô tận (Infinite Scroll), Newsfeed, bảng ghi log sự kiện.

#### Vấn đề nghiêm trọng của `SELECT * FROM users OFFSET 1000000 LIMIT 10`:
1. **Suy giảm hiệu năng (Performance degradation):** Database quan hệ (MySQL, PostgreSQL) phải duyệt qua toàn bộ $1.000.000$ dòng dữ liệu trước đó rồi mới lấy $10$ dòng tiếp theo, gây nghẽn I/O và CPU.
2. **Hiện tượng trôi bản ghi (Resource Skipping / Data Inconsistency):**
   - User đang xem trang 1 (bản ghi 1–10).
   - Có 2 bản ghi ở trang 1 bị xóa (dòng 1, 2).
   - User tải tiếp trang 2 (`OFFSET 10 LIMIT 10`) $\rightarrow$ Do trang 1 hiện chỉ còn 8 bản ghi, 2 bản ghi đầu của trang 2 cũ đã bị đẩy lên bù vào trang 1. Kết quả là trang 2 mới sẽ bắt đầu từ bản ghi thứ 13, khiến user **bị mất dấu (skip) 2 bản ghi**.

#### Giải pháp khắc phục:
- **Giải pháp 1 — Deferred Join (Tối ưu hiệu năng cho Offset lớn):**
  Tận dụng Covering Index trên cột khóa chính `id` để thực hiện `OFFSET` trên index trước, sau đó mới `JOIN` lại bảng chính để lấy toàn bộ các trường:
  ```sql
  SELECT * FROM
  (SELECT id FROM users ORDER BY id LIMIT 1000000, 10) AS a
  JOIN users AS b ON a.id = b.id;
  ```
- **Giải pháp 2 — Cursor-based Pagination (Chống trôi dữ liệu & Hiệu năng tối đa):**
  Lấy dữ liệu dựa trên con trỏ bản ghi cuối cùng đã đọc:
  ```sql
  SELECT * FROM users WHERE id > :last_seen_id ORDER BY id ASC LIMIT 10;
  ```
  *Ràng buộc:* Cột con trỏ phải có tính đơn điệu (monotonic) và được đánh index. Không áp dụng được cho trường hợp sắp xếp theo trường ngẫu nhiên (random values).

### 2.5. Kỹ thuật Sắp xếp (Sorting) & Bảo mật
- **Định dạng truy vấn linh hoạt:**
  - `GET /products?sort=price:asc,name:desc`
  - `GET /products?sort=+price,-name`
  - `GET /products?sort=price asc,name desc`
- **Security Rule (Bảo mật bắt buộc):** Luôn thiết lập **Whitelist** các trường được phép sắp xếp trên backend. Tuyệt đối không cho phép client truyền cột tùy ý để tránh tấn công SQL Injection hoặc làm chậm hệ thống khi sort vào cột chưa đánh Index.

### 2.6. Thiết kế quan hệ dữ liệu (Relations)
- **One-To-Many (1 - N):**
  - Lấy danh sách bình luận của bài viết 123: `GET /articles/123/comments`
- **Many-To-Many (N - N):** Ví dụ Lớp học và Sinh viên:
  - Lấy danh sách sinh viên trong lớp: `GET /classes/<class_id>/students`
  - Thêm một sinh viên vào lớp: `POST /classes/<class_id>/students/<student_id>` (hoặc dùng `PUT` vì tính bảo toàn idempotency).
  - Thêm hàng loạt sinh viên vào lớp: `POST /classes/<class_id>/students` kèm Request Body:
    ```json
    {
      "student_ids": ["s1", "s2", "s3"]
    }
    ```

---

## 3. Case Studies Thực Chiến

### 3.1. Bài toán Xuất file 500MB (Problem 02)
- **Rủi ro khi chạy Đồng bộ (Synchronous):**
  ```text
  Client Gửi Request ──> Server Query DB ──> Ghi File 500MB ──> Trả file trực tiếp về Client
  ```
  - **Hậu quả:** Request Timeout (Gateway ngắt kết nối sau 30–60s), Client bị đóng băng, Server bị Out Of Memory (OOM) do tải khối lượng dữ liệu khổng lồ vào RAM, làm cạn kiệt tài nguyên xử lý request khác.

- **Giải pháp: Thiết kế Bất đồng bộ với Polling (Async API):**
  1. **Bước 1 — Yêu cầu tạo Job xuất file:**
     - Endpoint: `POST /products/jobs/export?name=pen` (hoặc `GET`)
     - Response: `202 Accepted` kèm ID công việc:
       ```json
       {
         "job_id": "001",
         "status": "PROCESSING",
         "issued_at": 1692163008000
       }
       ```
  2. **Bước 2 — Client thăm dò trạng thái định kỳ (Polling):**
     - Endpoint: `GET /jobs/001`
     - Khi chưa xong: `status: "PROCESSING"`
     - Khi hoàn tất:
       ```json
       {
         "job_id": "001",
         "status": "DONE",
         "issued_at": 1692163008000,
         "updated_at": 1692163015000
       }
       ```
  3. **Bước 3 — Lấy kết quả file đã tạo:**
     - Endpoint: `GET /jobs/001/result`
     - Trả về: Link tải file an toàn (S3 Presigned URL) hoặc file stream.

### 3.2. So sánh các mô hình Async API: Polling vs Callback / Webhook

| Đặc tính | Polling | Callback / Webhook |
| :--- | :--- | :--- |
| **Cơ chế vận hành** | Client chủ động gửi request thăm dò server theo chu kỳ. | Server chủ động bắn HTTP request tới endpoint của Client khi xử lý xong. |
| **Ưu điểm** | Đơn giản, dễ lập trình ở cả Client và Server. | Tiết kiệm tối đa băng thông và CPU, phản hồi gần như tức thì (real-time). |
| **Nhược điểm** | Lãng phí tài nguyên mạng vì nhiều lần thăm dò khi chưa có dữ liệu. | Kiến trúc phức tạp: Client phải mở endpoint công khai, cần cơ chế retry và xác thực chữ ký (HMAC signature). |
| **Ứng dụng tiêu biểu** | Tải vừa và nhỏ, tính năng import/export file nội bộ. | Tải lớn, hệ thống thanh toán (Payment Webhooks: Stripe, VNPay, Momo). |

### 3.3. Bài toán Chống gửi lặp request & Replay Attack (Problem 03)
- **Vấn đề:** Do mạng chập chờn hoặc cơ chế retry tự động, client có thể gửi một request thanh toán/đặt hàng 2 lần, hoặc kẻ gian thực hiện tấn công Replay.
- **Giải pháp — Idempotency Key:**
  1. Client tạo một chuỗi định danh duy nhất (UUID v4) đặt trong HTTP Header:
     ```http
     Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
     ```
  2. Server lưu trữ `Idempotency-Key` với ràng buộc `UNIQUE` trong Database hoặc dùng Redis (`SET key value EX ttl NX`).
  3. Xử lý request:
     - **Lần đầu:** Key chưa tồn tại $\rightarrow$ Xử lý nghiệp vụ, lưu lại kết quả (Response Body & Status Code).
     - **Lần trùng:** Key đã tồn tại $\rightarrow$ Trả ngay kết quả đã lưu trước đó mà **không thực hiện lại logic trừ tiền hay tạo đơn**, hoặc trả về lỗi `409 Conflict`.

---

## 4. Chuẩn Hóa Tài Liệu API (REST API Documentation)

Một bộ tài liệu API chuẩn kỹ thuật bao gồm hai cấu phần:
1. **REST API Document (OpenAPI / Swagger / Postman Collection):** Chi tiết kỹ thuật từng endpoint.
2. **REST API Map (API Flow Diagram):** Sơ đồ luồng dữ liệu giữa Client, Gateway và các Microservices.

### Các tiêu chí bắt buộc trong API Document:
- **Đặc tả Request & Response Body rõ ràng:** Chỉ rõ kiểu dữ liệu (`string`, `integer`, `boolean`), ràng buộc (`nullable`, `required/optional`), định dạng ngày tháng theo chuẩn ISO-8601 (`YYYY-MM-DDTHH:mm:ssZ`).
- **Danh mục mã lỗi (Error Codes) và thông điệp cụ thể:**
  - `400 Bad Request`: Sai cú pháp hoặc dữ liệu đầu vào không hợp lệ.
  - `401 Unauthorized`: Chưa xác thực danh tính / thiếu Token.
  - `403 Forbidden`: Đã xác thực nhưng không có quyền thao tác trên tài nguyên.
  - `404 Not Found`: Không tìm thấy tài nguyên.
  - `409 Conflict`: Xung đột dữ liệu (trùng lặp Idempotency Key, tài nguyên đã tồn tại).
  - `422 Unprocessable Entity`: Đúng định dạng cú pháp nhưng vi phạm quy tắc nghiệp vụ.
  - `500 Internal Server Error`: Lỗi phát sinh từ hệ thống server.
- **Mẫu lệnh cURL thực tế:** Giúp lập trình viên Frontend/Mobile hoặc đối tác kiểm thử nhanh chóng ngay trên terminal.

---

## 5. Tài Liệu Tham Khảo (References)
- [Microsoft Learn — Web API design best practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [Google Cloud Blog — RESTful web API Design best practices](https://cloud.google.com/blog/products/api-management/restful-web-api-design-best-practices)
- [Stripe API Reference](https://stripe.com/docs/api) (Tiêu chuẩn công nghiệp về Idempotency và phân trang)
- [iHeavy — How to Optimize Paging in MySQL? 3 Best Ways](https://www.iheavy.com/2013/06/19/how-to-optimize-paging-in-mysql-3-best-ways/)
- [HackMySQL — Deferred Join Deep Dive](https://hackmysql.com/post/deferred-join-deep-dive/)

---

## 6. Bài Tập Về Nhà (Homework)

Thiết kế bộ tài liệu API hoàn chỉnh cho hệ thống **Đặt vé máy bay (Airline Booking)** bao gồm 3 API:
1. **API Tìm kiếm chuyến bay (Search Flights):**
   - Hỗ trợ các bộ lọc: Điểm đi, điểm đến, ngày bay, số lượng hành khách, hạng vé (Economy/Business).
   - Hỗ trợ sắp xếp (theo giá vé, giờ cất cánh) và phân trang tối ưu.
2. **API Đặt vé máy bay (Book a Flight):**
   - Tiếp nhận thông tin hành khách, mã chuyến bay.
   - Ứng dụng `Idempotency-Key` để bảo đảm tính an toàn khi đặt vé/thanh toán.
3. **API Xem lịch sử đặt vé (Get Booking History):**
   - Truy vấn danh sách vé đã đặt theo người dùng, kèm trạng thái đơn và phân trang cursor-based.
