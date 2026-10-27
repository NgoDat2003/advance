-- Bài 07 · Chặng 9 · Hai giao dịch chuyển tiền ngược chiều cùng lúc — PHIÊN B (tab ADVANCE_BE_LAB_B).
-- B hoàn 500 từ ví 2 (cửa hàng) về ví 3 (Đạt). Chạy region CÙNG TÊN với phiên A, trong 5 giây đầu lúc A đang ngủ.

-- #region unordered · Khóa ví theo thứ tự "nguồn trước, đích sau" → ngược chiều với A
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '10s';
BEGIN;
SELECT 'B1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'ghi 2 bút toán, trừ ví 2 (khóa ví 2)' AS viec;
WITH t AS (INSERT INTO transfers (idempotency_key, amount) VALUES ('race-B-' || txid_current(), 500) RETURNING id)
INSERT INTO ledger_entries (transfer_id, wallet_id, amount) SELECT id, 2, -500 FROM t UNION ALL SELECT id, 3, 500 FROM t;
UPDATE wallets SET balance = balance - 500 WHERE id = 2;
SELECT 'B2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'cộng ví 3 (xin khóa ví 3, A đang giữ)' AS viec;
UPDATE wallets SET balance = balance + 500 WHERE id = 3;
COMMIT;
SELECT 'B3' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'B kết thúc' AS viec;
-- #endregion

-- #region ordered · Cùng nghiệp vụ qua post_transfer
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '10s';
BEGIN;
SELECT 'B1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'post_transfer 2 → 3 (khóa ví 2 trước: chờ A)' AS viec;
SELECT post_transfer(2, 3, 500, 'race-ord-B-' || txid_current()) AS transfer_id;
SELECT 'B2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'hết chờ, B commit' AS viec;
COMMIT;
-- #endregion
