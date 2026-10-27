-- Bài 07 · Chặng 4 · Thêm index khi bảng đang có người ghi — PHIÊN A (tab ADVANCE_BE_LAB).
-- Cần chạy 04-table-format.sql region add-column trước (tạo ddl_contracts).
-- Cách chạy: bôi đen region → Run Selection; trong 6 giây A đang ngủ, sang tab B chạy region CÙNG TÊN ở 04-index-online.B.sql.

-- #region plain · A tạo index thường và giữ transaction mở
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP INDEX IF EXISTS ddl_contracts_store_idx;
BEGIN;
SELECT 'A1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'CREATE INDEX thường' AS viec;
CREATE INDEX ddl_contracts_store_idx ON ddl_contracts (store_id);
SELECT mode, granted FROM pg_locks WHERE relation = 'ddl_contracts'::regclass AND pid = pg_backend_pid();
SELECT pg_sleep(6);   -- giả lập index lớn tạo lâu. Lúc này hãy chạy phiên B.
SELECT 'A2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'xong, trả khóa' AS viec;
ROLLBACK;
-- #endregion

-- #region cic · A là một request ghi bình thường đang chạy dở khi B tạo index CONCURRENTLY
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP INDEX IF EXISTS ddl_contracts_status_cic;
BEGIN;
SELECT 'A1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'request ghi thứ nhất' AS viec;
UPDATE ddl_contracts SET note = 'sửa lần 1' WHERE id = 2;
SELECT pg_sleep(6);   -- lúc này hãy chạy phiên B
SELECT 'A2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'B đang tạo index: A vẫn ghi được không?' AS viec;
UPDATE ddl_contracts SET note = 'sửa lần 2' WHERE id = 3;
SELECT l.mode, l.granted FROM pg_locks l WHERE l.relation = 'ddl_contracts'::regclass AND l.pid <> pg_backend_pid();
SELECT phase FROM pg_stat_progress_create_index;
COMMIT;
SELECT 'A3' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'A commit → B được đi tiếp' AS viec;
-- #endregion
