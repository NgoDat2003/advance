SET search_path = lab07_modeling; SET lock_timeout = '15s';
BEGIN;
SELECT 'B1' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'B khóa cửa hàng 7' AS viec;
SELECT id FROM my_stores WHERE id = 7 FOR UPDATE;
SELECT 'B2' AS buoc, to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS luc, 'B xóa nếu không còn hợp đồng' AS viec;
DELETE FROM my_stores WHERE id = 7
  AND NOT EXISTS (SELECT 1 FROM my_contracts WHERE store_id = 7);
COMMIT;
