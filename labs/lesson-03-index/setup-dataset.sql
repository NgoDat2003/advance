-- Lesson 3 (Index) dataset, schema lab03_indexing. Run through `npm run setup` (00-setup-dataset.mjs).
-- Deterministic: every "random" column comes from hashint8(row number), so every run builds the same rows and the
-- labs print the same page counts run after run (where rows land in the heap can still differ slightly elsewhere).
CREATE SCHEMA IF NOT EXISTS lab03_indexing;
SET search_path = lab03_indexing, public;
SET maintenance_work_mem = '256MB';
-- Do not turn synchronous_commit off here: VACUUM right after an unflushed async commit cannot mark pages
-- all-visible, and the Index Only Scan labs need a full visibility map.

-- pageinspect: read B+tree pages (bt_metap, bt_page_items). pgstattuple: leaf density. pg_trgm: trigram GIN for LIKE '%x%'.
CREATE EXTENSION IF NOT EXISTS pageinspect SCHEMA lab03_indexing;
CREATE EXTENSION IF NOT EXISTS pgstattuple SCHEMA lab03_indexing;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA lab03_indexing;

DROP TABLE IF EXISTS orders, users, t_ab CASCADE;

-- h(g, k): deterministic pseudo-random non-negative int for row g and column salt k.
CREATE OR REPLACE FUNCTION h(g bigint, k int) RETURNS int LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT hashint8(g * 16 + k) & 2147483647 $$;

-- users: slides 14-17, 25-26, 31-36. Names are "First Last" (always >= 7 chars) except the planted ronin rows.
CREATE TABLE users (
  id bigint NOT NULL,
  code varchar(20) NOT NULL,          -- the id stored as text (slide 34: implicit type conversion)
  email text NOT NULL,
  name text NOT NULL,
  gender char(1) NOT NULL,
  age int NOT NULL,
  country text NOT NULL,
  province text NOT NULL,
  created_at timestamptz NOT NULL,
  deleted_at timestamptz
);

WITH
fn AS (SELECT ARRAY['Jane','John','Anna','Minh','Linh','Huong','David','Maria','Peter','Lucas',
  'Emma','Olivia','Noah','Liam','Mia','Lan','Hoa','Tuan','Nam','Hung','Mai','Thu','Khoa','Bao','Duc',
  'Long','Phuc','Quang','Son','Trang','Vinh','Yen','Alice','Bob','Carol','Dan','Eve','Frank','Grace','Henry',
  'Ivy','Jack','Kate','Leo','Max','Nina','Oscar','Paul','Rose','Sam'] AS a),
ln AS (SELECT ARRAY['Nguyen','Tran','Pham','Hoang','Huynh','Phan','Dang','Bui','Doan','Vuong',
  'Ngo','Duong','Luong','Smith','Johnson','Brown','Taylor','Miller','Wilson','Moore','Clark','Lewis','Walker',
  'Hall','Allen','Young','King','Wright','Scott','Green','Baker','Adams','Nelson','Hill','Campbell','Mitchell',
  'Roberts','Carter','Phillips','Evans','Turner','Torres','Parker','Collins','Edwards','Stewart','Morris',
  'Murphy','Cook','Rogers'] AS a),
-- 20 countries with skewed shares (per mille, cumulative upper bound): VN 40%, US 20% ... SG 0.5%.
countries(code, lo, hi) AS (VALUES
  ('VN',0,399),('US',400,599),('JP',600,679),('KR',680,739),('CN',740,789),('TH',790,829),('ID',830,859),
  ('PH',860,884),('MY',885,904),('IN',905,924),('DE',925,939),('FR',940,951),('GB',952,963),('AU',964,973),
  ('CA',974,981),('BR',982,987),('IT',988,989),('NL',990,991),('ES',992,994),('SG',995,999)),
us AS (SELECT ARRAY['Texas','California','New York','Florida','Washington','Ohio','Georgia','Illinois','Arizona','Nevada'] AS a),
vn AS (SELECT ARRAY['Ha Noi','Ho Chi Minh','Da Nang','Hai Phong','Can Tho','Hue','Nha Trang','Vung Tau','Da Lat','Quang Ninh'] AS a)
INSERT INTO users
SELECT g, g::text, 'user' || g || '@example.com',
  CASE WHEN g % 1000 = 0 THEN 'ronin' || (g / 1000 % 10)            -- 1,000 rows, length 6, prefix "ronin"
       WHEN g % 1000 = 1 THEN fn.a[1 + h(g,1) % 50] || ' ronin'     -- 1,000 rows, suffix "ronin"
       ELSE fn.a[1 + h(g,1) % 50] || ' ' || ln.a[1 + h(g,2) % 50] END,
  CASE WHEN h(g,3) % 2 = 0 THEN 'M' ELSE 'F' END,
  18 + h(g,4) % 60,
  c.code,
  CASE c.code WHEN 'US' THEN us.a[1 + h(g,6) % 10] WHEN 'VN' THEN vn.a[1 + h(g,6) % 10]
              ELSE c.code || '-P' || (1 + h(g,6) % 10) END,
  timestamptz '2020-01-01 00:00+07' + g * interval '1 minute',
  CASE WHEN h(g,7) % 100 < 5 THEN timestamptz '2024-01-01 00:00+07' + (g % 86400) * interval '1 second' END
FROM generate_series(1, 1000000) g
CROSS JOIN fn CROSS JOIN ln CROSS JOIN us CROSS JOIN vn
JOIN countries c ON h(g,5) % 1000 BETWEEN c.lo AND c.hi;

ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- orders: slides 19, 29, 31. user_id is uniform over 1..1M, so about e^-1 = 37% of users have no order.
-- The foreign key has NO index on purpose (Postgres never creates one for you).
CREATE TABLE orders (
  id bigint NOT NULL,
  user_id bigint NOT NULL,
  status text NOT NULL,
  total numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL
);
INSERT INTO orders
SELECT g, 1 + h(g,11) % 1000000,
  CASE WHEN h(g,12) % 100 < 90 THEN 'DELIVERED' WHEN h(g,12) % 100 < 96 THEN 'CANCELLED'
       WHEN h(g,12) % 100 < 99 THEN 'SHIPPING' ELSE 'PROCESSING' END,
  (h(g,13) % 1000000) / 100.0,
  timestamptz '2023-01-01 00:00+07' + g * interval '30 seconds'   -- grows with id; the heap is almost, not perfectly, in this order (BRIN, slide 29)
FROM generate_series(1, 1000000) g;
ALTER TABLE orders ADD PRIMARY KEY (id);
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- t_ab: slide 27 composite index (a, b). a has 100 values, b has 1,000 values, independent of each other.
CREATE TABLE t_ab (id bigint NOT NULL, a int NOT NULL, b int NOT NULL, pad text NOT NULL);
INSERT INTO t_ab SELECT g, h(g,21) % 100, h(g,22) % 1000, repeat('x', 40) FROM generate_series(1, 1000000) g;
ALTER TABLE t_ab ADD PRIMARY KEY (id);
