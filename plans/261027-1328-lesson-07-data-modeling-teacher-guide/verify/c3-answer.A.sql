SET search_path = lab07_modeling; SET lock_timeout = '15s';
BEGIN;
SELECT 'A1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'A khóa cửa hàng 7' AS viec;
SELECT id FROM my_stores WHERE id = 7 FOR KEY SHARE;
SELECT pg_sleep(6);
SELECT 'A2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'A ghi hợp đồng nếu cha còn' AS viec;
INSERT INTO my_contracts (store_id)
SELECT 7 WHERE EXISTS (SELECT 1 FROM my_stores WHERE id = 7);
COMMIT;
