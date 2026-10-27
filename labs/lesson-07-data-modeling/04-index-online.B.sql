-- Bài 07 · Chặng 4 · Thêm index khi bảng đang có người ghi — PHIÊN B (tab ADVANCE_BE_LAB_B).
-- Chạy region CÙNG TÊN với phiên A, trong lúc A đang pg_sleep(6).
-- Region cic: tab B phải ở chế độ auto-commit. Ở chế độ Manual Commit (Tx: [M]) DBX bọc câu lệnh trong transaction → lỗi 25001.

-- #region plain · B đọc rồi ghi trong lúc A đang tạo index thường
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '2s';   -- chờ tối đa 2 giây rồi bỏ
SELECT 'B1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'đọc bảng' AS viec;
SELECT count(*) AS hop_dong_cua_44 FROM ddl_contracts WHERE store_id = 44;
SELECT 'B2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'ghi bảng' AS viec;
UPDATE ddl_contracts SET note = 'ghi trong lúc tạo index' WHERE id = 1;
-- #endregion

-- #region cic · B tạo index CONCURRENTLY trong lúc A đang ghi
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '15s';   -- CIC phải chờ A xong (A ngủ 6 giây); hết lock_timeout giữa chừng sẽ để lại index hỏng
SELECT 'B1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'CREATE INDEX CONCURRENTLY' AS viec;
CREATE INDEX CONCURRENTLY ddl_contracts_status_cic ON ddl_contracts (status, store_id);
SELECT 'B2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'index xong' AS viec;
SELECT indexrelid::regclass AS index_moi, indisvalid AS hop_le FROM pg_index WHERE indexrelid = 'ddl_contracts_status_cic'::regclass;
-- #endregion
