-- Chặng 5 · Bộ đếm trên PostgreSQL (chỉ tạo và thao tác trong schema riêng k2l04_counter)

-- #region setup · Tạo schema k2l04_counter, bảng post_count và 1000 bài viết ban đầu (Slide 20)
CREATE SCHEMA IF NOT EXISTS k2l04_counter;
CREATE TABLE IF NOT EXISTS k2l04_counter.post_count (
  post_id integer PRIMARY KEY,
  like_count bigint NOT NULL DEFAULT 0,
  comment_count bigint NOT NULL DEFAULT 0,
  share_count bigint NOT NULL DEFAULT 0,
  view_count bigint NOT NULL DEFAULT 0
);
INSERT INTO k2l04_counter.post_count (post_id)
SELECT g FROM generate_series(1, 1000) AS g
ON CONFLICT (post_id) DO NOTHING;
UPDATE k2l04_counter.post_count
SET like_count = 0, comment_count = 0, share_count = 0, view_count = 0;
SELECT count(*) AS so_dong, COALESCE(sum(like_count), 0) AS tong_like
FROM k2l04_counter.post_count;
-- #endregion

-- #region reset · Đưa like_count về 0 trước mỗi vòng đo burst
UPDATE k2l04_counter.post_count SET like_count = 0;
-- #endregion

-- #region read · Truy vấn đọc 4 bộ đếm của một bài viết (Slide 20)
SELECT like_count, comment_count, share_count, view_count
FROM k2l04_counter.post_count
WHERE post_id = 1;
-- #endregion

-- #region stats · Xem số phiên bản dòng cập nhật MVCC (n_tup_upd, n_tup_hot_upd, n_dead_tup) trong k2l04_counter (Slide 20)
SELECT relname, n_tup_upd, n_tup_hot_upd, n_dead_tup
FROM pg_stat_user_tables
WHERE schemaname = 'k2l04_counter';
-- #endregion

-- #region kiem-chung · Kiểm chứng 3 dòng bài viết đầu sau khi xả Write-Behind từ Redis (Slide 21)
SELECT post_id, like_count
FROM k2l04_counter.post_count
WHERE post_id <= 3
ORDER BY post_id;
-- #endregion
