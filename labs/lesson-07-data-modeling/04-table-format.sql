-- Bài 07 · Chặng 4 · Định dạng bảng: thêm cột, JSON, cột dự phòng, thêm index, table template (slide 13–20).
-- Dữ liệu: ddl_contracts = bản sao 500.000 hợp đồng của Bài 3 (nguồn lab03_indexing.hw_contracts chỉ được ĐỌC).
-- Cách chạy trong DBX: bôi đen từng region rồi Run Selection. Region add-column và json mất vài giây.

-- #region add-column · Thêm cột trên bảng 500.000 dòng: khi nào PG phải viết lại cả bảng? (slide 14, 17)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS ddl_contracts, ddl_events;
CREATE TABLE ddl_contracts AS SELECT * FROM lab03_indexing.hw_contracts;
ALTER TABLE ddl_contracts ADD PRIMARY KEY (id);
-- ddl_events ghi lại "filenode" (tên file vật lý của bảng) sau mỗi bước. Filenode đổi = PG đã viết lại toàn bộ bảng.
CREATE TABLE ddl_events (id int GENERATED ALWAYS AS IDENTITY, buoc text, filenode oid);
INSERT INTO ddl_events (buoc, filenode) VALUES ('ban đầu', pg_relation_filenode('ddl_contracts'));
ALTER TABLE ddl_contracts ADD COLUMN note text;                                   -- cho phép NULL
INSERT INTO ddl_events (buoc, filenode) VALUES ('ADD note text', pg_relation_filenode('ddl_contracts'));
ALTER TABLE ddl_contracts ADD COLUMN version int NOT NULL DEFAULT 0;              -- default hằng số
INSERT INTO ddl_events (buoc, filenode) VALUES ('ADD version DEFAULT 0', pg_relation_filenode('ddl_contracts'));
ALTER TABLE ddl_contracts ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(); -- now() tính MỘT lần cho cả bảng
INSERT INTO ddl_events (buoc, filenode) VALUES ('ADD created_at DEFAULT now()', pg_relation_filenode('ddl_contracts'));
ALTER TABLE ddl_contracts ADD COLUMN rnd float8 DEFAULT random();                 -- default "volatile": mỗi dòng một giá trị
INSERT INTO ddl_events (buoc, filenode) VALUES ('ADD rnd DEFAULT random()', pg_relation_filenode('ddl_contracts'));
ALTER TABLE ddl_contracts ALTER COLUMN customer_id TYPE bigint;                    -- đổi kiểu int → bigint
INSERT INTO ddl_events (buoc, filenode) VALUES ('customer_id int → bigint', pg_relation_filenode('ddl_contracts'));
SELECT buoc, filenode, filenode <> lag(filenode) OVER (ORDER BY id) AS rewrite FROM ddl_events ORDER BY id;
SELECT count(DISTINCT created_at) AS so_gia_tri_created_at, count(DISTINCT rnd) AS so_gia_tri_rnd FROM ddl_contracts;
-- #endregion

-- #region lock · Thêm cột "nhanh" vẫn cần khóa mạnh nhất; vài ALTER nhẹ thì không (nối với Bài 14 chặng 3)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
BEGIN;
ALTER TABLE ddl_contracts ADD COLUMN tam int;
SELECT mode, granted FROM pg_locks WHERE relation = 'ddl_contracts'::regclass AND pid = pg_backend_pid();
ROLLBACK;
-- Đổi tham số lưu trữ (fillfactor) không đụng cấu trúc dòng nên lấy khóa nhẹ hơn: SELECT, INSERT, UPDATE vẫn chạy.
BEGIN;
ALTER TABLE ddl_contracts SET (fillfactor = 90);
SELECT mode, granted FROM pg_locks WHERE relation = 'ddl_contracts'::regclass AND pid = pg_backend_pid();
ROLLBACK;
-- #endregion

-- #region json · Cột jsonb và hai cách đánh index cho trường bên trong JSON (slide 15–16)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
ALTER TABLE ddl_contracts ADD COLUMN IF NOT EXISTS data jsonb;
DROP INDEX IF EXISTS ddl_contracts_channel_idx, ddl_contracts_data_gin;
-- 1% hợp đồng ký qua kênh WEB, 0,1% là khách VIP.
UPDATE ddl_contracts SET data = jsonb_build_object('channel', CASE WHEN id % 100 = 0 THEN 'WEB' ELSE 'POS' END, 'vip', id % 1000 = 0);
ANALYZE ddl_contracts;
EXPLAIN (ANALYZE, COSTS OFF) SELECT count(*) FROM ddl_contracts WHERE data->>'channel' = 'WEB';
-- Cách 1: index biểu thức trên đúng một trường.
CREATE INDEX ddl_contracts_channel_idx ON ddl_contracts ((data->>'channel'));
ANALYZE ddl_contracts;
EXPLAIN (ANALYZE, COSTS OFF) SELECT count(*) FROM ddl_contracts WHERE data->>'channel' = 'WEB';
-- Cách 2: GIN trên cả cột, phục vụ toán tử chứa @> cho mọi khóa.
CREATE INDEX ddl_contracts_data_gin ON ddl_contracts USING gin (data jsonb_path_ops);
EXPLAIN (ANALYZE, COSTS OFF) SELECT count(*) FROM ddl_contracts WHERE data @> '{"vip": true}';
-- #endregion

-- #region json-gin-error · Kiểu json (không có "b") không có GIN (slide 16)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS ddl_events_json;
CREATE TEMP TABLE ddl_events_json (id int, data json);
CREATE INDEX ON ddl_events_json USING gin (data);
-- #endregion

-- #region cic-txn · CREATE INDEX CONCURRENTLY không chạy được trong transaction (slide 18)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
BEGIN;
CREATE INDEX CONCURRENTLY ddl_contracts_total_idx ON ddl_contracts (total);
ROLLBACK;   -- nếu DBX dừng ở dòng lỗi phía trên, hãy chạy riêng ROLLBACK;
-- #endregion

-- #region template · Table template: cột nghiệp vụ + cột kỹ thuật, version để chống ghi đè (slide 19–20)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS tpl_stores;
CREATE TABLE tpl_stores (
  -- nghiệp vụ
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  status      text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CLOSED')),
  data        jsonb NOT NULL DEFAULT '{}',          -- thuộc tính mở rộng, không cần ALTER TABLE
  -- kỹ thuật
  version     int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  text NOT NULL DEFAULT current_user,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text NOT NULL DEFAULT current_user
);
INSERT INTO tpl_stores (code, name) VALUES ('MC-Q7', 'MayCha Quận 7');
-- Hai người cùng mở form ở version 0. Người đầu lưu được, người sau sửa 0 dòng → app báo "dữ liệu đã đổi".
UPDATE tpl_stores SET name = 'MayCha Q7 - Phú Mỹ Hưng', version = version + 1, updated_at = now() WHERE id = 1 AND version = 0;
UPDATE tpl_stores SET name = 'MayCha Quận Bảy',         version = version + 1, updated_at = now() WHERE id = 1 AND version = 0;
SELECT id, name, version FROM tpl_stores;
-- #endregion

-- #region kiem-chung · Bảng ✔/✘ của chặng 4
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'K4.1' AS ma, CASE WHEN (SELECT count(*) FROM ddl_contracts) = 500000 THEN '✔' ELSE '✘' END AS ket_qua, 'ddl_contracts có 500.000 dòng' AS chi_tiet
UNION ALL
SELECT 'K4.2', CASE WHEN (SELECT count(*) FROM (SELECT filenode <> lag(filenode) OVER (ORDER BY id) AS r FROM ddl_events) x WHERE r) = 2
               THEN '✔' ELSE '✘' END, 'đúng 2 bước viết lại bảng: DEFAULT random() và int → bigint'
UNION ALL
SELECT 'K4.3', CASE WHEN to_regclass('lab07_modeling.ddl_contracts_channel_idx') IS NOT NULL AND to_regclass('lab07_modeling.ddl_contracts_data_gin') IS NOT NULL
               THEN '✔' ELSE '✘' END, 'có index biểu thức (data->>''channel'') và GIN jsonb_path_ops'
UNION ALL
SELECT 'K4.4', CASE WHEN (SELECT version FROM tpl_stores WHERE id = 1) = 1 THEN '✔' ELSE '✘' END, 'tpl_stores: chỉ một lần lưu thắng, version = 1'
UNION ALL
SELECT 'K4.5', CASE WHEN to_regclass('lab07_modeling.ddl_contracts_status_cic') IS NULL THEN '–'
                    WHEN (SELECT indisvalid FROM pg_index WHERE indexrelid = 'ddl_contracts_status_cic'::regclass) THEN '✔' ELSE '✘' END,
       'index tạo bằng CONCURRENTLY hợp lệ (chạy 04-index-online #cic trước)';
-- #endregion
