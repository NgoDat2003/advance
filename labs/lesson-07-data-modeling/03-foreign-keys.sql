-- Bài 07 · Chặng 3 · Khóa ngoại: cái giá thật, cái bẫy "không có index", và mã lỗi (slide 11).
-- Phần race giữa 2 phiên nằm ở 03-fk-race.A.sql và 03-fk-race.B.sql.
-- Cách chạy trong DBX: bôi đen từng region rồi Run Selection. Region cost mất vài giây (ghi 400.000 dòng).

-- #region cost · Ghi 200.000 dòng con: có FK và không có FK
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS fk_child, fk_child_nofk, fk_parent;
CREATE TABLE fk_parent (id int PRIMARY KEY, name text NOT NULL);
-- 20.000 cha có con; id 20001–20010 cố ý KHÔNG có con để đo phép xóa cha ở region index.
INSERT INTO fk_parent SELECT g, 'cửa hàng ' || g FROM generate_series(1, 20010) g;
CREATE TABLE fk_child (id int PRIMARY KEY, parent_id int NOT NULL REFERENCES fk_parent (id), note text);
CREATE TABLE fk_child_nofk (id int PRIMARY KEY, parent_id int NOT NULL, note text);   -- chỉ là "reference column", không có ràng buộc
-- Đồng hồ: xem dòng thời gian (Time / Execution time) của 2 câu INSERT dưới đây.
INSERT INTO fk_child      SELECT g, (g % 20000) + 1, 'hợp đồng ' || g FROM generate_series(1, 200000) g;
INSERT INTO fk_child_nofk SELECT g, (g % 20000) + 1, 'hợp đồng ' || g FROM generate_series(1, 200000) g;
ANALYZE fk_parent, fk_child, fk_child_nofk;
-- PG không tự tạo index cho cột FK: fk_child chỉ có index của khóa chính.
SELECT indexrelid::regclass AS index_cua_fk_child FROM pg_index WHERE indrelid = 'fk_child'::regclass;
-- #endregion

-- #region index · Xóa một cha: PG phải tìm con trong fk_child. Không có index thì quét cả bảng
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP INDEX IF EXISTS fk_child_parent_id_idx;
BEGIN;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) DELETE FROM fk_parent WHERE id = 20001;   -- cha không có con
ROLLBACK;
CREATE INDEX fk_child_parent_id_idx ON fk_child (parent_id);
BEGIN;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) DELETE FROM fk_parent WHERE id = 20002;   -- cha không có con, giờ đã có index
ROLLBACK;
-- #endregion

-- #region error · Xóa cha còn con: DB từ chối với mã 23503 và nêu tên ràng buộc
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT count(*) AS so_con_cua_cha_5 FROM fk_child WHERE parent_id = 5;
DELETE FROM fk_parent WHERE id = 5;
-- #endregion

-- #region kiem-chung · Bảng ✔/✘ của chặng 3
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'K3.1' AS ma, CASE WHEN (SELECT count(*) FROM fk_child) = 200000 AND (SELECT count(*) FROM fk_child_nofk) = 200000 THEN '✔' ELSE '✘' END AS ket_qua,
       'đã ghi 200.000 dòng vào cả hai bảng con' AS chi_tiet
UNION ALL
SELECT 'K3.2', CASE WHEN EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = 'fk_child'::regclass
                                  AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'fk_child'::regclass AND attname = 'parent_id'))
               THEN '✔' ELSE '✘' END, 'cột FK parent_id đã có index'
UNION ALL
SELECT 'K3.3', CASE WHEN (SELECT count(*) FROM fk_child c WHERE NOT EXISTS (SELECT 1 FROM fk_parent p WHERE p.id = c.parent_id)) = 0
               THEN '✔' ELSE '✘' END, 'fk_child không có dòng mồ côi'
UNION ALL
SELECT 'K3.4', CASE WHEN to_regclass('lab07_modeling.race_contracts') IS NULL THEN '–'
                    WHEN (SELECT count(*) FROM race_contracts c WHERE NOT EXISTS (SELECT 1 FROM race_stores s WHERE s.id = c.store_id)) = 1 THEN '✔' ELSE '✘' END,
       'race không FK để lại đúng 1 hợp đồng mồ côi (chạy 03-fk-race #nofk trước)'
UNION ALL
SELECT 'K3.5', CASE WHEN to_regclass('lab07_modeling.race_contracts_fk') IS NULL THEN '–'
                    WHEN (SELECT count(*) FROM race_contracts_fk c WHERE NOT EXISTS (SELECT 1 FROM race_stores_fk s WHERE s.id = c.store_id)) = 0 THEN '✔' ELSE '✘' END,
       'race có FK: 0 hợp đồng mồ côi (chạy 03-fk-race #fk trước)';
-- #endregion
