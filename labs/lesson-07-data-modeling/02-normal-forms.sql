-- Bài 07 · Chặng 2 · Chuẩn hóa 0NF → 1NF → 2NF → 3NF và phi chuẩn hóa có kiểm soát (slide 9–10).
-- Dữ liệu: order_sheet (phiếu đơn hàng phẳng, 2155 dòng) và order_sheet_raw (830 đơn, món nhồi vào một ô).
-- Cách chạy trong DBX: bôi đen từng region theo thứ tự rồi Run Selection. Các thao tác "phá" dữ liệu đều nằm trong BEGIN … ROLLBACK.

-- #region 0nf · Ô không nguyên tử: một ô chứa nhiều món (vi phạm 1NF)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT order_id, customer_name, items FROM order_sheet_raw ORDER BY order_id LIMIT 3;
-- Muốn hỏi "đơn nào có món Chai?" phải dùng LIKE trên chuỗi; muốn đếm món phải tách chuỗi:
SELECT count(*) AS so_dong_mon FROM order_sheet_raw, string_to_table(items, '; ') AS mon;
-- #endregion

-- #region 1nf · 1NF: mỗi ô một giá trị, mỗi dòng một món — nhưng thông tin bị lặp
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT order_id, product_id, customer_name, customer_city, product_name, category_name, quantity
FROM order_sheet ORDER BY order_id, product_id LIMIT 5;
-- Cùng một sự thật bị chép lại bao nhiêu lần?
SELECT 'tên món product_id = 1' AS su_that, count(*) AS so_lan_lap FROM order_sheet WHERE product_id = 1
UNION ALL SELECT 'thành phố của khách SAVEA', count(*) FROM order_sheet WHERE customer_id = 'SAVEA';
-- #endregion

-- #region 2nf · 2NF: tách thuộc tính chỉ phụ thuộc MỘT PHẦN khóa (product_id) ra bảng riêng
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
-- CASCADE: xóa luôn các view của chặng 7 (nếu đã tạo) vì chúng đọc nf_*; chạy lại 07-views.sql sau.
DROP TABLE IF EXISTS nf_order_lines, nf_orders, nf_products, nf_customers CASCADE;
CREATE TABLE nf_products AS
  SELECT DISTINCT product_id, product_name, category_name, supplier_name FROM order_sheet;
ALTER TABLE nf_products ADD PRIMARY KEY (product_id);
CREATE TABLE nf_orders AS   -- 2NF: vẫn còn customer_name, customer_city phụ thuộc bắc cầu qua customer_id
  SELECT DISTINCT order_id, order_date, customer_id, customer_name, customer_city, employee_name FROM order_sheet;
ALTER TABLE nf_orders ADD PRIMARY KEY (order_id);
CREATE TABLE nf_order_lines AS
  SELECT order_id, product_id, unit_price, quantity, discount FROM order_sheet;
ALTER TABLE nf_order_lines ADD PRIMARY KEY (order_id, product_id);
-- Update anomaly: đổi tên món số 1 ở bảng phẳng phải sửa nhiều dòng; ở bảng đã tách chỉ 1 dòng.
BEGIN;
UPDATE order_sheet SET product_name = 'Chai (đổi tên)' WHERE product_id = 1;
UPDATE nf_products SET product_name = 'Chai (đổi tên)' WHERE product_id = 1;
ROLLBACK;
-- #endregion

-- #region 3nf · 3NF: tách phụ thuộc bắc cầu customer_id → tên, thành phố; thêm khóa ngoại
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
-- Chạy lại được: lấy khách từ order_sheet (nf_orders có thể đã bỏ cột ở lần chạy trước), khóa ngoại có tên cố định.
DROP TABLE IF EXISTS nf_customers CASCADE;
CREATE TABLE nf_customers AS
  SELECT DISTINCT customer_id, customer_name, customer_city FROM order_sheet;
ALTER TABLE nf_customers ADD PRIMARY KEY (customer_id);
ALTER TABLE nf_orders DROP COLUMN IF EXISTS customer_name, DROP COLUMN IF EXISTS customer_city;
ALTER TABLE nf_orders ADD CONSTRAINT nf_orders_customer_fk FOREIGN KEY (customer_id) REFERENCES nf_customers (customer_id);
ALTER TABLE nf_order_lines DROP CONSTRAINT IF EXISTS nf_order_lines_order_fk, DROP CONSTRAINT IF EXISTS nf_order_lines_product_fk,
  ADD CONSTRAINT nf_order_lines_order_fk FOREIGN KEY (order_id) REFERENCES nf_orders (order_id),
  ADD CONSTRAINT nf_order_lines_product_fk FOREIGN KEY (product_id) REFERENCES nf_products (product_id);
CREATE INDEX IF NOT EXISTS nf_orders_customer_id_idx ON nf_orders (customer_id);
CREATE INDEX IF NOT EXISTS nf_order_lines_product_id_idx ON nf_order_lines (product_id);
-- Delete anomaly: xóa các đơn của khách chỉ có 1 đơn ở bảng phẳng → mất luôn thành phố của khách đó.
BEGIN;
DELETE FROM order_sheet WHERE customer_id IN (
  SELECT customer_id FROM order_sheet GROUP BY customer_id HAVING count(DISTINCT order_id) = 1);
SELECT count(*) AS khach_mat_thanh_pho
FROM nf_customers c WHERE NOT EXISTS (SELECT 1 FROM order_sheet s WHERE s.customer_id = c.customer_id);
ROLLBACK;
-- Ở 3NF thành phố nằm trong nf_customers nên vẫn còn dù khách không còn đơn nào.
SELECT count(*) AS khach_trong_northwind, (SELECT count(*) FROM nf_customers) AS khach_trong_nf_customers FROM northwind.customers;
-- Insert anomaly: bảng phẳng không lưu được món mới chưa ai đặt, vì order_id là một phần khóa chính.
INSERT INTO order_sheet (order_id, product_id, product_name) VALUES (NULL, 999, 'Cà phê muối');
-- #endregion

-- #region lossless · Ghép lại các bảng 3NF phải ra đúng bảng phẳng ban đầu (tách không mất dữ liệu)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
CREATE OR REPLACE TEMP VIEW rejoin AS
SELECT l.order_id, l.product_id, o.order_date, o.customer_id, c.customer_name, c.customer_city, o.employee_name,
       p.product_name, p.category_name, p.supplier_name, l.unit_price, l.quantity, l.discount
FROM nf_order_lines l JOIN nf_orders o USING (order_id) JOIN nf_customers c USING (customer_id) JOIN nf_products p USING (product_id);
SELECT count(*) AS so_dong_lech FROM (SELECT * FROM rejoin EXCEPT SELECT * FROM order_sheet) x;
SELECT count(*) AS so_dong_lech FROM (SELECT * FROM order_sheet EXCEPT SELECT * FROM rejoin) x;
-- #endregion

-- #region denorm · Phi chuẩn hóa: cache tổng tiền đơn để đọc nhanh, và cái giá phải trả là "lệch"
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS dn_orders;
CREATE TABLE dn_orders AS
SELECT o.order_id, o.customer_id, o.order_date,
       sum(round(l.unit_price::numeric * l.quantity * (1 - l.discount::numeric), 2)) AS order_total   -- cột dư thừa
FROM nf_orders o JOIN nf_order_lines l USING (order_id) GROUP BY o.order_id;
ALTER TABLE dn_orders ADD PRIMARY KEY (order_id);
-- Đọc 5 đơn lớn nhất: không cần JOIN, không cần SUM.
SELECT order_id, customer_id, order_total FROM dn_orders ORDER BY order_total DESC LIMIT 5;
-- Sửa một dòng món mà quên cập nhật cache → số liệu lệch. Câu đối soát bắt được ngay.
BEGIN;
UPDATE nf_order_lines SET quantity = quantity + 1 WHERE order_id = 10248 AND product_id = 11;
SELECT count(*) AS lech FROM dn_orders d
WHERE d.order_total <> (SELECT sum(round(l.unit_price::numeric * l.quantity * (1 - l.discount::numeric), 2))
                        FROM nf_order_lines l WHERE l.order_id = d.order_id);
ROLLBACK;
-- #endregion

-- #region kiem-chung · Bảng ✔/✘ của chặng 2
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'K2.1' AS ma, CASE WHEN (SELECT count(*) FROM nf_products) = 77 AND (SELECT count(*) FROM nf_orders) = 830
                           AND (SELECT count(*) FROM nf_customers) = 89 AND (SELECT count(*) FROM nf_order_lines) = 2155
                      THEN '✔' ELSE '✘' END AS ket_qua, 'đủ 4 bảng 3NF: 77 món, 830 đơn, 89 khách, 2155 dòng món' AS chi_tiet
UNION ALL
SELECT 'K2.2', CASE WHEN (SELECT count(*) FROM pg_constraint WHERE contype = 'f' AND conrelid::regclass::text LIKE 'nf_%'
                           AND connamespace = 'lab07_modeling'::regnamespace) = 3 THEN '✔' ELSE '✘' END, 'có 3 khóa ngoại giữa các bảng nf_*'
UNION ALL
SELECT 'K2.3', CASE WHEN NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'nf_orders'::regclass AND attname = 'customer_city' AND NOT attisdropped)
               THEN '✔' ELSE '✘' END, 'nf_orders không còn cột customer_city (đã hết phụ thuộc bắc cầu)'
UNION ALL
SELECT 'K2.4', CASE WHEN (SELECT count(*) FROM dn_orders) = 830 THEN '✔' ELSE '✘' END, 'dn_orders có cache order_total cho 830 đơn';
-- #endregion
