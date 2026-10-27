-- Bài 07 · Chặng 9 · Hai giao dịch chuyển tiền ngược chiều cùng lúc — PHIÊN A (tab ADVANCE_BE_LAB).
-- Cần chạy 09-ledger.sql (ddl, post) trước. A chuyển 1.000 từ ví 3 (Đạt) sang ví 2 (cửa hàng).
-- Cách chạy: bôi đen region → Run Selection; trong 5 giây đầu lúc A đang ngủ, sang tab B chạy region CÙNG TÊN ở 09-ledger-race.B.sql.

-- #region unordered · Khóa ví theo thứ tự "nguồn trước, đích sau" (viết tay, không dùng post_transfer)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '10s';
BEGIN;
SELECT 'A1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'ghi 2 bút toán, trừ ví 3 (khóa ví 3)' AS viec;
WITH t AS (INSERT INTO transfers (idempotency_key, amount) VALUES ('race-A-' || txid_current(), 1000) RETURNING id)
INSERT INTO ledger_entries (transfer_id, wallet_id, amount) SELECT id, 3, -1000 FROM t UNION ALL SELECT id, 2, 1000 FROM t;
UPDATE wallets SET balance = balance - 1000 WHERE id = 3;
SELECT pg_sleep(6);   -- lúc này hãy chạy phiên B (trong 5 giây đầu)
SELECT 'A2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'cộng ví 2 (xin khóa ví 2)' AS viec;
UPDATE wallets SET balance = balance + 1000 WHERE id = 2;
COMMIT;   -- nếu A là nạn nhân 40P01, transaction đã hỏng: COMMIT chỉ còn tác dụng ROLLBACK (DBX dừng ở lỗi thì tự chạy ROLLBACK;)
SELECT 'A3' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'A kết thúc' AS viec;
-- #endregion

-- #region ordered · Cùng nghiệp vụ, nhưng qua post_transfer: luôn khóa ví theo id tăng dần
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '10s';
BEGIN;
SELECT 'A1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'post_transfer 3 → 2 (khóa ví 2 rồi ví 3)' AS viec;
SELECT post_transfer(3, 2, 1000, 'race-ord-A-' || txid_current()) AS transfer_id;
SELECT pg_sleep(6);   -- lúc này hãy chạy phiên B (trong 5 giây đầu)
SELECT 'A2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'A commit' AS viec;
COMMIT;
-- #endregion
