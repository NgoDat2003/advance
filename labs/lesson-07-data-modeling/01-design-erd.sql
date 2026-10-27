-- Bài 07 · Chặng 1 · Quy trình thiết kế, ERD, 4 loại bảng, cột tham chiếu đặt ở đâu (slide 5–8, 12).
-- Cách chạy trong DBX: bôi đen từng region (từ dòng "-- #region" tới "-- #endregion") rồi Run Selection.

-- #region erd · Hai entity Order và Payment theo table template (slide 7, 12, 20)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS erd_payment_transactions, erd_orders;
-- Entity "đơn hàng": có id, trạng thái (vòng đời) và cột kỹ thuật.
CREATE TABLE erd_orders (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  status      text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'PAID', 'CANCELLED')),
  total       numeric(14,2) NOT NULL CHECK (total >= 0),
  version     int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
-- Entity "giao dịch thanh toán": sinh ra SAU đơn hàng nên giữ cột tham chiếu order_id (slide 12).
-- order_id được phép NULL vì giao dịch ủng hộ (donate) không có đơn hàng.
CREATE TABLE erd_payment_transactions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind        text NOT NULL CHECK (kind IN ('ORDER', 'DONATE')),
  order_id    bigint REFERENCES erd_orders (id),
  amount      numeric(14,2) NOT NULL CHECK (amount > 0),
  status      text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  version     int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'ORDER') = (order_id IS NOT NULL))   -- thanh toán đơn thì phải có order_id, donate thì không
);
CREATE INDEX ON erd_payment_transactions (order_id);  -- PG không tự tạo index cho cột FK (chặng 3)
-- #endregion

-- #region catalog · Đọc ERD ngược từ catalog: bảng, cột, khóa ngoại (slide 7)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT c.relname AS bang, a.attname AS cot, format_type(a.atttypid, a.atttypmod) AS kieu, NOT a.attnotnull AS cho_phep_null
FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
WHERE c.relnamespace = 'lab07_modeling'::regnamespace AND c.relname IN ('erd_orders', 'erd_payment_transactions')
ORDER BY c.relname DESC, a.attnum;
SELECT conrelid::regclass AS bang_con, confrelid::regclass AS bang_cha, pg_get_constraintdef(oid) AS dinh_nghia
FROM pg_constraint
WHERE contype = 'f' AND connamespace = 'lab07_modeling'::regnamespace AND conrelid::regclass::text LIKE 'erd_%';
-- #endregion

-- #region refcol · Đơn hàng → thanh toán, và một khoản donate không có đơn (slide 12)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
TRUNCATE erd_payment_transactions, erd_orders RESTART IDENTITY;
INSERT INTO erd_orders (code, total) VALUES ('DH001', 120000.00);                  -- entity gốc sinh trước
INSERT INTO erd_payment_transactions (kind, order_id, amount)                      -- entity sinh sau giữ tham chiếu
VALUES ('ORDER', 1, 120000.00), ('DONATE', NULL, 50000.00);
SELECT p.id, p.kind, p.order_id, o.code AS ma_don, p.amount
FROM erd_payment_transactions p LEFT JOIN erd_orders o ON o.id = p.order_id ORDER BY p.id;
-- Đếm khoản thanh toán không gắn đơn hàng: chính là khoản donate.
SELECT count(*) AS so_khoan FROM erd_payment_transactions WHERE order_id IS NULL;
-- #endregion

-- #region kiem-chung · Bảng ✔/✘ của chặng 1
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'K1.1' AS ma, CASE WHEN count(*) = 2 THEN '✔' ELSE '✘' END AS ket_qua, 'có 2 entity erd_orders, erd_payment_transactions' AS chi_tiet
FROM pg_class WHERE relnamespace = 'lab07_modeling'::regnamespace AND relname IN ('erd_orders', 'erd_payment_transactions')
UNION ALL
SELECT 'K1.2', CASE WHEN count(*) = 1 THEN '✔' ELSE '✘' END, 'cột tham chiếu order_id nằm ở bảng sinh sau (payment)'
FROM pg_constraint WHERE contype = 'f' AND conrelid = 'erd_payment_transactions'::regclass AND confrelid = 'erd_orders'::regclass
UNION ALL
SELECT 'K1.3', CASE WHEN (SELECT count(*) FROM erd_payment_transactions WHERE kind = 'DONATE' AND order_id IS NULL) = 1 THEN '✔' ELSE '✘' END,
       'khoản donate lưu được mà không cần đơn hàng';
-- #endregion
