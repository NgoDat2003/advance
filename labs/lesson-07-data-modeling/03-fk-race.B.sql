-- Bài 07 · Chặng 3 · Race "kiểm tra khóa ngoại trong app" — PHIÊN B (tab ADVANCE_BE_LAB_B).
-- Chạy region CÙNG TÊN với phiên A, trong lúc A đang pg_sleep(6).

-- #region nofk · Không có FK: app kiểm tra "cửa hàng còn hợp đồng không?" rồi xóa
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'B1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'app kiểm tra: cửa hàng 7 còn hợp đồng?' AS viec;
SELECT count(*) AS hop_dong_cua_7 FROM race_contracts WHERE store_id = 7;   -- 0: A mới kiểm tra, chưa ghi hợp đồng nào
DELETE FROM race_stores WHERE id = 7;
SELECT 'B2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'đã xóa cửa hàng 7' AS viec;
-- #endregion

-- #region fk · Cùng code app, bảng có FK
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'B1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'app kiểm tra: cửa hàng 7 còn hợp đồng?' AS viec;
SELECT count(*) AS hop_dong_cua_7 FROM race_contracts_fk WHERE store_id = 7;
DELETE FROM race_stores_fk WHERE id = 7;
SELECT 'B2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'đã xóa cửa hàng 7' AS viec;
-- #endregion
