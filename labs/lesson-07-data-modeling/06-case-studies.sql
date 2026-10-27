-- Bài 07 · Chặng 6 · Các case study: đa ngôn ngữ, sắp thứ tự, homestay, lịch, tag, báo cáo (slide 26–34).
-- Cách chạy trong DBX: bôi đen từng region rồi Run Selection. Region tags và report mất vài giây (sinh 100.000 và 1.000.000 dòng).

-- #region i18n · Bản dịch trong một cột jsonb: thêm ngôn ngữ không cần ALTER TABLE (slide 27)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS cs_posts;
CREATE TABLE cs_posts (id int PRIMARY KEY, original_title text NOT NULL, title_translation jsonb NOT NULL DEFAULT '{}');
INSERT INTO cs_posts VALUES (1, 'Engineer', '{"vi": "Kỹ Sư", "en": "Engineer", "cn": "工程师"}');
UPDATE cs_posts SET title_translation = title_translation || '{"ja": "エンジニア"}' WHERE id = 1;   -- thêm tiếng Nhật
-- Đọc theo ngôn ngữ người dùng, thiếu bản dịch thì rơi về tiêu đề gốc.
SELECT lang, coalesce(title_translation->>lang, original_title) AS tieu_de
FROM cs_posts, unnest(array['vi', 'ja', 'fr']) AS lang WHERE id = 1;
-- #endregion

-- #region ordering · Cột thứ tự có khoảng trống: chèn giữa = (trên + dưới) / 2. Chèn được bao nhiêu lần? (slide 28)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS cs_tasks;
CREATE TABLE cs_tasks (id int PRIMARY KEY, name text NOT NULL, pos float8 NOT NULL);
INSERT INTO cs_tasks VALUES (1, 'TV', 1000), (4, 'Working', 1500), (2, 'Commuting', 2000), (3, 'Gaming', 3000);
INSERT INTO cs_tasks VALUES (5, 'Cafe', (1000 + 1500) / 2.0);        -- kéo "Cafe" vào giữa TV và Working
SELECT name, pos FROM cs_tasks ORDER BY pos;
-- Người dùng cứ kéo việc mới vào ngay sau "TV": khoảng trống chia đôi mãi. Đếm số lần chia được trước khi hết chỗ.
WITH RECURSIVE
  i(n, lo, hi) AS (SELECT 0, 1000::bigint, 2000::bigint UNION ALL SELECT n + 1, lo, (lo + hi) / 2 FROM i WHERE (lo + hi) / 2 NOT IN (lo, hi)),
  d(n, lo, hi) AS (SELECT 0, 1000::float8, 2000::float8 UNION ALL SELECT n + 1, lo, (lo + hi) / 2 FROM d WHERE (lo + hi) / 2 NOT IN (lo, hi)),
  f(n, lo, hi) AS (SELECT 0, 1000::float4, 2000::float4 UNION ALL SELECT n + 1, lo, ((lo + hi) / 2)::float4 FROM f WHERE ((lo + hi) / 2)::float4 NOT IN (lo, hi))
SELECT (SELECT max(n) FROM i) AS so_lan_int, (SELECT max(n) FROM d) AS so_lan_float8, (SELECT max(n) FROM f) AS so_lan_float4;
-- Cách sửa: khi khoảng trống cạn, đánh số lại cả danh sách bằng MỘT câu lệnh.
UPDATE cs_tasks t SET pos = r.rn * 1000 FROM (SELECT id, row_number() OVER (ORDER BY pos) AS rn FROM cs_tasks) r WHERE r.id = t.id;
SELECT name, pos FROM cs_tasks ORDER BY pos;
-- #endregion

-- #region availability · Homestay: sinh trước 365 dòng/căn, mỗi ngày một giá và một trạng thái (slide 29–30)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS cs_stays, cs_availability, cs_homestays;   -- cs_stays (region exclusion) tham chiếu cs_homestays
CREATE TABLE cs_homestays (id int PRIMARY KEY, name text NOT NULL, base_price numeric(12,2) NOT NULL);
INSERT INTO cs_homestays VALUES (1, 'Đà Lạt Pine House', 800000), (2, 'Hội An Riverside', 650000), (3, 'Sapa Cloud', 500000);
CREATE TABLE cs_availability (
  homestay_id int NOT NULL REFERENCES cs_homestays (id),
  day         date NOT NULL,
  price       numeric(12,2) NOT NULL,
  status      text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'BOOKED', 'BLOCKED')),
  PRIMARY KEY (homestay_id, day)
);
INSERT INTO cs_availability (homestay_id, day, price)
SELECT h.id, d::date, h.base_price FROM cs_homestays h, generate_series(date '2026-11-01', date '2027-10-31', interval '1 day') d;
-- Đổi giá một ngày lễ: sửa đúng 1 dòng.
UPDATE cs_availability SET price = 1200000 WHERE homestay_id = 1 AND day = '2026-12-24';
-- Đặt 3 đêm 20→23/11: một câu UPDATE có điều kiện. App kiểm tra số dòng = 3, khác 3 thì ROLLBACK.
BEGIN;
UPDATE cs_availability SET status = 'BOOKED'
WHERE homestay_id = 1 AND day >= '2026-11-20' AND day < '2026-11-23' AND status = 'OPEN';
COMMIT;
-- Khách khác muốn 22→24/11 (trùng đêm 22): chỉ sửa được 1/2 dòng → app ROLLBACK, không ai bị bán trùng.
BEGIN;
UPDATE cs_availability SET status = 'BOOKED'
WHERE homestay_id = 1 AND day >= '2026-11-22' AND day < '2026-11-24' AND status = 'OPEN';
ROLLBACK;
SELECT day, price, status FROM cs_availability WHERE homestay_id = 1 AND day BETWEEN '2026-11-19' AND '2026-11-24' ORDER BY day;
-- #endregion

-- #region exclusion · Cách thứ hai: lưu khoảng ngày và để DB cấm chồng lấn bằng EXCLUDE (slide 29–31)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS cs_stays;
CREATE TABLE cs_stays (
  id          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  homestay_id int NOT NULL REFERENCES cs_homestays (id),
  guest       text NOT NULL,
  during      daterange NOT NULL,
  EXCLUDE USING gist (homestay_id WITH =, during WITH &&)   -- cùng căn (=) và khoảng ngày chồng nhau (&&) thì cấm
);
INSERT INTO cs_stays (homestay_id, guest, during) VALUES (1, 'Đạt', daterange('2026-11-20', '2026-11-23'));
INSERT INTO cs_stays (homestay_id, guest, during) VALUES (2, 'Lan', daterange('2026-11-22', '2026-11-24'));   -- căn khác: được
INSERT INTO cs_stays (homestay_id, guest, during) VALUES (1, 'Minh', daterange('2026-11-22', '2026-11-24')); -- trùng đêm 22
-- #endregion

-- #region calendar · Lịch lặp hằng tuần: sinh sẵn các khung giờ, lưu kèm tên múi giờ (slide 31, tùy chọn)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS cs_time_slots;
CREATE TABLE cs_time_slots (
  id         int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_name text NOT NULL,
  slot       tstzrange NOT NULL,
  timezone   text NOT NULL                       -- giữ tên múi giờ để hiển thị lại đúng "9 giờ sáng thứ Hai"
);
-- Họp giao ban 9:00–10:00 thứ Hai theo giờ Việt Nam, 12 tuần, bắt đầu 02/11/2026.
INSERT INTO cs_time_slots (event_name, slot, timezone)
SELECT 'Họp giao ban', tstzrange((d::date + time '09:00') AT TIME ZONE 'Asia/Ho_Chi_Minh', (d::date + time '10:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'Asia/Ho_Chi_Minh'
FROM generate_series(date '2026-11-02', date '2027-01-18', interval '7 day') d;
-- Ca trực mỗi ngày 14:00–16:00 trong tuần đầu.
INSERT INTO cs_time_slots (event_name, slot, timezone)
SELECT 'Ca trực', tstzrange((d::date + time '14:00') AT TIME ZONE 'Asia/Ho_Chi_Minh', (d::date + time '16:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'Asia/Ho_Chi_Minh'
FROM generate_series(date '2026-11-02', date '2026-11-06', interval '1 day') d;
CREATE INDEX ON cs_time_slots USING gist (slot);
-- "Tuần này có gì?" = các khung giờ chồng lên khoảng của tuần.
SELECT event_name, to_char(lower(slot) AT TIME ZONE timezone, 'Dy DD/MM HH24:MI') AS bat_dau_gio_vn
FROM cs_time_slots
WHERE slot && tstzrange('2026-11-02 00:00+07', '2026-11-09 00:00+07')
ORDER BY lower(slot);
-- #endregion

-- #region tags · Tag dạng mảng + GIN (inverted index) so với bảng nối N–N (slide 32)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS cs_article_tags, cs_tags, cs_articles;
CREATE TABLE cs_articles (id int PRIMARY KEY, title text NOT NULL, tags text[] NOT NULL DEFAULT '{}');
-- 100.000 bài; tag "postgres" chỉ có ở 1% số bài.
INSERT INTO cs_articles
SELECT g, 'Bài viết ' || g,
       array_remove(array[(array['backend', 'frontend', 'devops', 'career'])[1 + g % 4], (array['nestjs', 'react', 'docker', 'redis', 'kafka'])[1 + g % 5],
                           CASE WHEN g % 100 = 0 THEN 'postgres' END], NULL)
FROM generate_series(1, 100000) g;
CREATE INDEX cs_articles_tags_idx ON cs_articles USING gin (tags);
ANALYZE cs_articles;
SELECT id, title, tags FROM cs_articles WHERE id = 100;                                   -- (1) tag của một bài: đọc 1 dòng
EXPLAIN (ANALYZE, COSTS OFF) SELECT count(*) FROM cs_articles WHERE tags @> '{postgres}'; -- (2) bài theo tag: dùng GIN
-- Cách chuẩn hóa: bảng tag + bảng nối.
CREATE TABLE cs_tags (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL UNIQUE);
INSERT INTO cs_tags (name) SELECT DISTINCT unnest(tags) FROM cs_articles;
CREATE TABLE cs_article_tags (article_id int NOT NULL REFERENCES cs_articles (id), tag_id int NOT NULL REFERENCES cs_tags (id),
                              PRIMARY KEY (article_id, tag_id));
INSERT INTO cs_article_tags SELECT a.id, t.id FROM cs_articles a, unnest(a.tags) u(name) JOIN cs_tags t ON t.name = u.name;
CREATE INDEX ON cs_article_tags (tag_id);
ANALYZE cs_tags, cs_article_tags;
EXPLAIN (ANALYZE, COSTS OFF)
SELECT count(*) FROM cs_article_tags at JOIN cs_tags t ON t.id = at.tag_id WHERE t.name = 'postgres';
SELECT pg_size_pretty(pg_total_relation_size('cs_articles')) AS mang_ca_index, pg_size_pretty(pg_total_relation_size('cs_article_tags')) AS bang_noi_ca_index;
-- #endregion

-- #region report · Đếm click hôm qua: chính xác, xấp xỉ, hay tính sẵn bằng materialized view? (slide 33)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP MATERIALIZED VIEW IF EXISTS cs_mv_clicks_daily;
DROP TABLE IF EXISTS cs_clicks;
CREATE TABLE cs_clicks (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, post_id int NOT NULL, click_at timestamptz NOT NULL);
-- 1.000.000 click trong 10 ngày 26/10 → 04/11/2026 (864.000 giây). Số click nhiều hơn số giây nên ~1,6 ngày đầu có 2 click/giây.
INSERT INTO cs_clicks (post_id, click_at)
SELECT 1 + g % 500, timestamptz '2026-10-26 00:00+07' + (g % 864000) * interval '1 second' FROM generate_series(1, 1000000) g;
ANALYZE cs_clicks;
-- Chính xác: quét bảng.
SELECT count(*) AS click_ngay_27 FROM cs_clicks WHERE click_at >= '2026-10-27 00:00+07' AND click_at < '2026-10-28 00:00+07';
-- Xấp xỉ: con số thống kê có sẵn, gần như miễn phí.
SELECT reltuples::bigint AS uoc_luong_tong_click FROM pg_class WHERE oid = 'cs_clicks'::regclass;
-- HyperLogLog cần extension hll; máy này không có.
SELECT count(*) AS co_extension_hll FROM pg_available_extensions WHERE name = 'hll';
-- Tính sẵn: materialized view lưu kết quả thật vào đĩa; muốn số mới phải REFRESH.
CREATE MATERIALIZED VIEW cs_mv_clicks_daily AS
SELECT (click_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS ngay, count(*) AS so_click FROM cs_clicks GROUP BY 1;
SELECT ngay, so_click FROM cs_mv_clicks_daily WHERE ngay = '2026-10-27';
INSERT INTO cs_clicks (post_id, click_at) VALUES (1, '2026-10-27 12:00+07');
SELECT ngay, so_click FROM cs_mv_clicks_daily WHERE ngay = '2026-10-27';   -- chưa đổi
REFRESH MATERIALIZED VIEW cs_mv_clicks_daily;
SELECT ngay, so_click FROM cs_mv_clicks_daily WHERE ngay = '2026-10-27';   -- tăng 1
-- REFRESH thường khóa view (người đọc phải chờ). CONCURRENTLY thì không khóa người đọc, nhưng cần một unique index:
REFRESH MATERIALIZED VIEW CONCURRENTLY cs_mv_clicks_daily;
-- #endregion

-- #region report-fix · Thêm unique index để REFRESH CONCURRENTLY chạy được (tùy chọn)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
CREATE UNIQUE INDEX IF NOT EXISTS cs_mv_clicks_daily_ngay ON cs_mv_clicks_daily (ngay);
REFRESH MATERIALIZED VIEW CONCURRENTLY cs_mv_clicks_daily;
SELECT count(*) AS so_ngay FROM cs_mv_clicks_daily;
-- #endregion

-- #region kiem-chung · Bảng ✔/✘ của chặng 6
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'K6.1' AS ma, CASE WHEN (SELECT title_translation ? 'ja' FROM cs_posts WHERE id = 1) THEN '✔' ELSE '✘' END AS ket_qua,
       'bản dịch tiếng Nhật thêm được mà không đổi schema' AS chi_tiet
UNION ALL
SELECT 'K6.2', CASE WHEN (SELECT count(*) FROM cs_availability) = 1095 THEN '✔' ELSE '✘' END, 'đã sinh 3 × 365 dòng lịch phòng'
UNION ALL
SELECT 'K6.3', CASE WHEN (SELECT count(*) FROM cs_availability WHERE homestay_id = 1 AND status = 'BOOKED') = 3 THEN '✔' ELSE '✘' END,
       'căn 1 có đúng 3 đêm đã đặt, không bị bán trùng'
UNION ALL
SELECT 'K6.4', CASE WHEN (SELECT count(*) FROM cs_stays WHERE homestay_id = 1) = 1 THEN '✔' ELSE '✘' END, 'EXCLUDE chặn lượt đặt chồng lấn: căn 1 chỉ có 1 lượt'
UNION ALL
SELECT 'K6.5', CASE WHEN to_regclass('lab07_modeling.cs_articles_tags_idx') IS NOT NULL THEN '✔' ELSE '✘' END, 'cột tags có GIN index'
UNION ALL
SELECT 'K6.6', CASE WHEN to_regclass('lab07_modeling.cs_mv_clicks_daily') IS NOT NULL THEN '✔' ELSE '✘' END, 'có materialized view cs_mv_clicks_daily';
-- #endregion
