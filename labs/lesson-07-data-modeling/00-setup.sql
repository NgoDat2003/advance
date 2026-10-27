-- Bài 07 · Dựng dữ liệu cho lab Data Modeling trong schema riêng lab07_modeling.
-- Nguồn CHỈ ĐỌC: northwind (đơn hàng thật 1996–1998). Không ghi vào bất kỳ schema nào khác.
-- Chạy được nhiều lần: chỉ dựng lại 2 bảng gốc; không đụng bảng bài tập hw_* và bảng tự làm my_* của bạn.
-- Cách chạy trong DBX (kết nối ADVANCE_BE_LAB, auto-commit): mở file, Ctrl+A → Run. Mất khoảng 1 giây.

CREATE SCHEMA IF NOT EXISTS lab07_modeling;
-- btree_gist: cho phép EXCLUDE USING gist trộn cột số (=) với khoảng ngày (&&) ở chặng 6.
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA lab07_modeling;

-- order_sheet: "phiếu đơn hàng" phẳng, mỗi dòng một món trong một đơn, lặp lại tên khách, thành phố, tên món…
-- Đây là bảng CHƯA chuẩn hóa mà chặng 2 sẽ tách dần thành 3NF.
DROP TABLE IF EXISTS lab07_modeling.order_sheet;
CREATE TABLE lab07_modeling.order_sheet AS
SELECT od.order_id, od.product_id, o.order_date, o.customer_id,
       c.company_name AS customer_name, c.city AS customer_city,
       e.first_name || ' ' || e.last_name AS employee_name,
       p.product_name, cat.category_name, s.company_name AS supplier_name,
       od.unit_price, od.quantity, od.discount
FROM northwind.order_details od
JOIN northwind.orders o      ON o.order_id = od.order_id
JOIN northwind.customers c   ON c.customer_id = o.customer_id
JOIN northwind.employees e   ON e.employee_id = o.employee_id
JOIN northwind.products p    ON p.product_id = od.product_id
JOIN northwind.categories cat ON cat.category_id = p.category_id
JOIN northwind.suppliers s   ON s.supplier_id = p.supplier_id;
ALTER TABLE lab07_modeling.order_sheet ADD PRIMARY KEY (order_id, product_id);

-- order_sheet_raw: một dòng một đơn, các món nhồi chung vào một ô text → vi phạm 1NF (ô không nguyên tử).
DROP TABLE IF EXISTS lab07_modeling.order_sheet_raw;
CREATE TABLE lab07_modeling.order_sheet_raw AS
SELECT order_id, min(customer_name) AS customer_name, min(customer_city) AS customer_city,
       string_agg(product_name || ' x' || quantity, '; ' ORDER BY product_id) AS items
FROM lab07_modeling.order_sheet
GROUP BY order_id;
ALTER TABLE lab07_modeling.order_sheet_raw ADD PRIMARY KEY (order_id);

ANALYZE lab07_modeling.order_sheet, lab07_modeling.order_sheet_raw;

-- Thẻ dữ liệu: kiểm tra nhanh bằng mắt.
SELECT 'order_sheet' AS bang, count(*) AS so_dong, count(DISTINCT order_id) AS so_don,
       count(DISTINCT customer_id) AS so_khach, count(DISTINCT product_id) AS so_mon
FROM lab07_modeling.order_sheet
UNION ALL
SELECT 'order_sheet_raw', count(*), count(*), count(DISTINCT customer_name), NULL
FROM lab07_modeling.order_sheet_raw;
