-- Bài 07 · Chặng 5 · Chọn kiểu dữ liệu: chuỗi, số, tiền, thời gian, NULL (slide 21–25).
-- Cách chạy trong DBX: bôi đen từng region rồi Run Selection. Region có lỗi cố ý luôn để câu lỗi ở cuối.

-- #region string · text và varchar(255) tốn đúng như nhau trên PG (slide 22)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT pg_column_size('xin chao'::text) AS text_8_ky_tu, pg_column_size('xin chao'::varchar(255)) AS varchar255_8_ky_tu,
       pg_column_size(repeat('a', 3000)::text) AS text_3000_ky_tu;
-- Chuỗi dài lưu trong bảng được nén (TOAST) khi vượt khoảng 2 KB: 10.000 ký tự lặp chỉ còn vài trăm byte.
DROP TABLE IF EXISTS ty_samples;
CREATE TABLE ty_samples (id int PRIMARY KEY, note text);
INSERT INTO ty_samples VALUES (1, repeat('món ngon ', 1112));
SELECT length(note) AS so_ky_tu, octet_length(note) AS so_byte_goc, pg_column_size(note) AS so_byte_luu_that FROM ty_samples;
-- Giá trị ngắn khi nằm trong bảng dùng header 1 byte, nên nhỏ hơn con số đo trên literal ở trên.
DROP TABLE IF EXISTS ty_stored;
CREATE TABLE ty_stored (t text, v varchar(255), n numeric(12,2));
INSERT INTO ty_stored VALUES ('xin chao', 'xin chao', 123456.78);
SELECT pg_column_size(t) AS text_trong_bang, pg_column_size(v) AS varchar_trong_bang, pg_column_size(n) AS numeric_trong_bang FROM ty_stored;
-- #endregion

-- #region string-limit · varchar(n) chỉ là một ràng buộc độ dài (slide 22)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'Trà sữa trân châu đường đen'::varchar(10) AS ep_kieu_thi_cat;   -- ép kiểu tường minh: PG cắt bớt, không báo lỗi
DROP TABLE IF EXISTS ty_short;
CREATE TEMP TABLE ty_short (name varchar(10));
INSERT INTO ty_short VALUES ('Trà sữa trân châu đường đen');                  -- ghi vào cột: PG báo lỗi
-- #endregion

-- #region string-index · B-tree không chứa được giá trị quá 2704 byte (slide 22: "không index được cả chuỗi dài")
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS ty_long;
CREATE TABLE ty_long (id int PRIMARY KEY, body text);
CREATE INDEX ty_long_body_idx ON ty_long (body);
-- 100 chuỗi md5 ngẫu nhiên ghép lại = 3.200 ký tự gần như không nén được.
INSERT INTO ty_long SELECT 1, string_agg(md5(random()::text), '') FROM generate_series(1, 100);
-- #endregion

-- #region number · Số nguyên: nhỏ đủ dùng là tốt; INT(1) chỉ có ở MySQL (slide 23)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT pg_column_size(1::smallint) AS smallint_byte, pg_column_size(1::int) AS int_byte, pg_column_size(1::bigint) AS bigint_byte,
       pg_column_size(123456.78::numeric(12,2)) AS numeric_byte;
SELECT 2147483647::int + 1 AS tran_so_int;
-- #endregion

-- #region int-width · INT(1) của MySQL không tồn tại trên PG (slide 23)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 1::int(1);
-- #endregion

-- #region money · Tiền không bao giờ dùng float (slide 23)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 0.1::float8 + 0.2::float8 AS float_cong, (0.1::float8 + 0.2::float8) = 0.3 AS float_bang_0_3,
       0.1::numeric + 0.2::numeric AS numeric_cong;
-- Cộng 0,1 một triệu lần:
SELECT sum(0.1::float8) AS tong_float, sum(0.1::numeric) AS tong_numeric FROM generate_series(1, 1000000);
-- Dữ liệu thật: northwind lưu đơn giá, chiết khấu bằng real (float 4 byte). So cùng một cách tính:
-- (1) không làm tròn: float lệch rất nhỏ; (2) làm tròn từng dòng về 2 số lẻ như hóa đơn: float lệch hẳn.
SELECT sum(unit_price * quantity * (1 - discount)) AS real_khong_lam_tron,
       sum(unit_price::numeric * quantity * (1 - discount::numeric)) AS numeric_khong_lam_tron,
       sum(round((unit_price * quantity * (1 - discount))::numeric, 2)) AS real_lam_tron_tung_dong,
       sum(round(unit_price::numeric * quantity * (1 - discount::numeric), 2)) AS numeric_lam_tron_tung_dong
FROM order_sheet;
-- #endregion

-- #region time · timestamptz lưu một thời điểm; timestamp chỉ lưu "chữ số trên đồng hồ" (slide 24)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT pg_column_size(now()) AS timestamptz_byte, pg_column_size(now()::timestamp) AS timestamp_byte, pg_column_size(current_date) AS date_byte;
DROP TABLE IF EXISTS ty_times;
CREATE TEMP TABLE ty_times (co_mui_gio timestamptz, khong_mui_gio timestamp);
SET TimeZone = 'Asia/Ho_Chi_Minh';                       -- app ở Việt Nam ghi lúc 9 giờ sáng
INSERT INTO ty_times VALUES ('2026-10-28 09:00', '2026-10-28 09:00');
SELECT co_mui_gio, khong_mui_gio FROM ty_times;
SET TimeZone = 'UTC';                                    -- server/worker khác đọc lại
SELECT co_mui_gio, khong_mui_gio FROM ty_times;
-- Ép chuỗi có múi giờ vào timestamp: phần +07 bị BỎ, không báo lỗi.
SELECT '2026-10-28 09:00+07'::timestamp AS mat_mui_gio, '2026-10-28 09:00+07'::timestamptz AS giu_thoi_diem;
-- Không có giới hạn năm 2038 như TIMESTAMP của MySQL:
SELECT '2100-01-01 00:00+07'::timestamptz AS nam_2100;
RESET TimeZone;
-- #endregion

-- #region null · NULL rẻ khi lưu nhưng có bẫy khi so sánh (slide 25)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS ty_nulls;
CREATE TABLE ty_nulls (id int, a bigint, b bigint, c text);
INSERT INTO ty_nulls VALUES (1, 100, 200, 'có giá trị'), (2, NULL, NULL, NULL);
SELECT id, pg_column_size(t.*) AS byte_ca_dong FROM ty_nulls t ORDER BY id;
-- Bẫy NOT IN: danh sách loại trừ có một NULL → không dòng nào thỏa.
SELECT count(*) AS so_dong FROM nf_products WHERE product_id NOT IN (SELECT x FROM (VALUES (1), (NULL)) v(x));
SELECT count(*) AS so_dong FROM nf_products p WHERE NOT EXISTS (SELECT 1 FROM (VALUES (1), (NULL)) v(x) WHERE v.x = p.product_id);
-- #endregion

-- #region null-unique · UNIQUE mặc định cho phép nhiều NULL; PG 15+ có NULLS NOT DISTINCT (slide 25)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS ty_phone, ty_phone_strict;
CREATE TEMP TABLE ty_phone (id int, phone text UNIQUE);
INSERT INTO ty_phone VALUES (1, NULL), (2, NULL);          -- hai khách chưa có số điện thoại: được
SELECT count(*) AS so_khach_chua_co_sdt FROM ty_phone WHERE phone IS NULL;
CREATE TEMP TABLE ty_phone_strict (id int, phone text UNIQUE NULLS NOT DISTINCT);
INSERT INTO ty_phone_strict VALUES (1, NULL), (2, NULL);   -- NULL thứ hai bị coi là trùng
-- #endregion

-- #region kiem-chung · Bảng ✔/✘ của chặng 5
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'K5.1' AS ma, CASE WHEN pg_column_size('abc'::text) = pg_column_size('abc'::varchar(255)) THEN '✔' ELSE '✘' END AS ket_qua,
       'text và varchar(255) tốn bằng nhau' AS chi_tiet
UNION ALL
SELECT 'K5.2', CASE WHEN (0.1::numeric + 0.2::numeric) = 0.3 AND (0.1::float8 + 0.2::float8) <> 0.3 THEN '✔' ELSE '✘' END, 'numeric cộng đúng, float lệch'
UNION ALL
SELECT 'K5.3', CASE WHEN (SELECT count(*) FROM ty_long) = 0 THEN '✔' ELSE '✘' END, 'ty_long không nhận chuỗi 3.200 byte vào B-tree'
UNION ALL
SELECT 'K5.4', CASE WHEN (SELECT pg_column_size(t.*) FROM ty_nulls t WHERE id = 2) < (SELECT pg_column_size(t.*) FROM ty_nulls t WHERE id = 1)
               THEN '✔' ELSE '✘' END, 'dòng toàn NULL nhỏ hơn dòng có giá trị';
-- #endregion
