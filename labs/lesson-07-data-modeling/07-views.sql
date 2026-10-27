-- Bài 07 · Chặng 7 (tùy chọn) · View: PG gộp view vào câu lệnh hay phải tính riêng? (slide 39–43)
-- Cần chạy 02-normal-forms.sql trước (dùng các bảng nf_*).
-- Cách chạy trong DBX: bôi đen từng region rồi Run Selection.

-- #region inline · View đơn giản được "trải phẳng" vào câu lệnh: plan giống hệt khi viết JOIN tay (slide 40–41)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
CREATE OR REPLACE VIEW v_order_lines AS
SELECT l.order_id, l.product_id, p.product_name, l.unit_price, l.quantity
FROM nf_order_lines l JOIN nf_products p USING (product_id);
EXPLAIN (COSTS OFF) SELECT * FROM v_order_lines WHERE order_id = 10248;
EXPLAIN (COSTS OFF)
SELECT l.order_id, l.product_id, p.product_name, l.unit_price, l.quantity
FROM nf_order_lines l JOIN nf_products p USING (product_id) WHERE l.order_id = 10248;
-- #endregion

-- #region pushdown · View có GROUP BY: điều kiện trên cột nhóm vẫn được đẩy xuống dưới bước gộp (slide 41)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
CREATE OR REPLACE VIEW v_customer_revenue AS
SELECT o.customer_id, count(*) AS so_dong_mon, sum(l.unit_price::numeric * l.quantity) AS doanh_thu
FROM nf_orders o JOIN nf_order_lines l USING (order_id) GROUP BY o.customer_id;
EXPLAIN (COSTS OFF) SELECT * FROM v_customer_revenue WHERE customer_id = 'SAVEA';
-- #endregion

-- #region fence · View có LIMIT: PG không thể trải phẳng, phải tính view trước rồi mới lọc (giống TEMPTABLE, slide 41–42)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
CREATE OR REPLACE VIEW v_top_lines AS
SELECT order_id, product_id, quantity FROM nf_order_lines ORDER BY quantity DESC LIMIT 100;
EXPLAIN (COSTS OFF) SELECT * FROM v_top_lines WHERE product_id = 1;
-- #endregion

-- #region updatable · View đơn giản ghi được; WITH CHECK OPTION chặn ghi ra ngoài phạm vi của view (slide 40)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
CREATE OR REPLACE VIEW v_cheap_products AS
SELECT product_id, product_name, category_name, supplier_name FROM nf_products WHERE category_name = 'Beverages'
WITH CHECK OPTION;
INSERT INTO v_cheap_products VALUES (901, 'Trà đào cam sả', 'Beverages', 'MayCha');   -- nằm trong phạm vi view: được
SELECT product_id, product_name FROM nf_products WHERE product_id = 901;              -- dòng đã vào bảng gốc
DELETE FROM v_cheap_products WHERE product_id = 901;
INSERT INTO v_cheap_products VALUES (902, 'Bánh mì', 'Grains/Cereals', 'MayCha');      -- ngoài phạm vi: bị chặn
-- #endregion

-- #region kiem-chung · Bảng ✔/✘ của chặng 7
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'K7.1' AS ma, CASE WHEN count(*) = 4 THEN '✔' ELSE '✘' END AS ket_qua, 'có 4 view v_order_lines, v_customer_revenue, v_top_lines, v_cheap_products' AS chi_tiet
FROM pg_views WHERE schemaname = 'lab07_modeling' AND viewname IN ('v_order_lines', 'v_customer_revenue', 'v_top_lines', 'v_cheap_products')
UNION ALL
SELECT 'K7.2', CASE WHEN NOT EXISTS (SELECT 1 FROM nf_products WHERE product_id IN (901, 902)) THEN '✔' ELSE '✘' END,
       'bảng gốc nf_products không giữ dòng thử 901, 902';
-- #endregion
