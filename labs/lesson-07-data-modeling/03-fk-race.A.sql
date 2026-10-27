-- Bài 07 · Chặng 3 · Race "kiểm tra khóa ngoại trong app" — PHIÊN A (tab ADVANCE_BE_LAB).
-- Kịch bản: A tạo hợp đồng cho cửa hàng 7, B xóa cửa hàng 7 cùng lúc. Mỗi bên đều "kiểm tra trước" như code app.
-- Cách chạy: bôi đen region trong file này → Run Selection; trong 6 giây A đang ngủ, sang tab B chạy region CÙNG TÊN ở 03-fk-race.B.sql.

-- #region nofk · Không có FK, app tự kiểm tra (đề xuất ở slide 11)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS race_contracts, race_stores;
CREATE TABLE race_stores (id int PRIMARY KEY, name text NOT NULL);
CREATE TABLE race_contracts (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, store_id int NOT NULL);   -- không có REFERENCES
INSERT INTO race_stores VALUES (7, 'MayCha Quận 7');
BEGIN;
SELECT 'A1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'app kiểm tra: cửa hàng 7 còn tồn tại?' AS viec;
SELECT count(*) AS cua_hang_7_ton_tai FROM race_stores WHERE id = 7;
SELECT pg_sleep(6);   -- giả lập app gọi API khác / tính toán. Lúc này hãy chạy phiên B.
SELECT 'A2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'kiểm tra đã qua → tạo hợp đồng' AS viec;
INSERT INTO race_contracts (store_id) VALUES (7);
COMMIT;
SELECT 'A3' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'đếm hợp đồng mồ côi' AS viec;
SELECT count(*) AS orphans FROM race_contracts c WHERE NOT EXISTS (SELECT 1 FROM race_stores s WHERE s.id = c.store_id);
-- #endregion

-- #region fk · Cùng code app, nhưng bảng có FK
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS race_contracts_fk, race_stores_fk;
CREATE TABLE race_stores_fk (id int PRIMARY KEY, name text NOT NULL);
CREATE TABLE race_contracts_fk (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                store_id int NOT NULL REFERENCES race_stores_fk (id));
CREATE INDEX ON race_contracts_fk (store_id);
INSERT INTO race_stores_fk VALUES (7, 'MayCha Quận 7');
BEGIN;
SELECT 'A1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'app kiểm tra: cửa hàng 7 còn tồn tại?' AS viec;
SELECT count(*) AS cua_hang_7_ton_tai FROM race_stores_fk WHERE id = 7;
SELECT pg_sleep(6);   -- lúc này hãy chạy phiên B
SELECT 'A2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'kiểm tra đã qua → tạo hợp đồng' AS viec;
INSERT INTO race_contracts_fk (store_id) VALUES (7);
ROLLBACK;   -- INSERT đã lỗi 23503 nên transaction hỏng; ROLLBACK để đóng nó
SELECT 'A3' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'đếm hợp đồng mồ côi' AS viec;
SELECT count(*) AS orphans FROM race_contracts_fk c WHERE NOT EXISTS (SELECT 1 FROM race_stores_fk s WHERE s.id = c.store_id);
-- #endregion
