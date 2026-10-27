SET search_path = lab07_modeling;
DROP VIEW IF EXISTS my_v_top_line_per_order;
-- Mỗi đơn chỉ giữ dòng món có số lượng lớn nhất
CREATE VIEW my_v_top_line_per_order AS
SELECT DISTINCT ON (order_id) order_id, product_id, quantity
FROM nf_order_lines
ORDER BY order_id, quantity DESC, product_id;
-- Lọc theo cột KHÔNG nằm trong DISTINCT ON: PG phải tính view trước rồi mới lọc
EXPLAIN (COSTS OFF) SELECT * FROM my_v_top_line_per_order WHERE product_id = 1;
-- Lọc theo cột trong DISTINCT ON: PG đẩy xuống được (cả nhóm order_id giữ nguyên)
EXPLAIN (COSTS OFF) SELECT * FROM my_v_top_line_per_order WHERE order_id = 10248;
DROP VIEW my_v_top_line_per_order;
