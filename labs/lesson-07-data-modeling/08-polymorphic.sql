-- Bài 07 · Chặng 8 · Quan hệ đa hình (polymorphic): một bình luận thuộc về bài viết HOẶC sản phẩm.
-- Ba cách thiết kế: (1) cặp type + id, (2) exclusive arc, (3) mỗi loại cha một bảng nối.
-- Cách chạy trong DBX: bôi đen từng region theo thứ tự rồi Run Selection.

-- #region typeid · Cách 1: commentable_type + commentable_id — không thể khai báo FK
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS poly_comments, poly_comments_arc, poly_post_comments, poly_product_comments, poly_posts, poly_products;
CREATE TABLE poly_posts    (id int PRIMARY KEY, title text NOT NULL);
CREATE TABLE poly_products (id int PRIMARY KEY, name text NOT NULL);
INSERT INTO poly_posts VALUES (1, 'Khai trương chi nhánh Q7'), (2, 'Menu mùa đông');
INSERT INTO poly_products VALUES (1, 'Trà sữa nướng'), (2, 'Cà phê muối');
CREATE TABLE poly_comments (
  id               int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  commentable_type text NOT NULL,      -- 'Post' hoặc 'Product'
  commentable_id   int NOT NULL,       -- trỏ tới bảng nào thì tùy cột bên trên → không REFERENCES được
  body             text NOT NULL
);
CREATE INDEX ON poly_comments (commentable_type, commentable_id);
INSERT INTO poly_comments (commentable_type, commentable_id, body) VALUES
  ('Post', 1, 'Chúc mừng!'), ('Post', 1, 'Có gửi xe không?'), ('Product', 1, 'Ngon'),
  ('Psot', 2, 'Gõ sai loại vẫn lưu được'), ('Product', 99, 'Sản phẩm 99 không tồn tại vẫn lưu được');
DELETE FROM poly_posts WHERE id = 1;   -- xóa bài viết: DB không biết có bình luận đang trỏ tới
SELECT count(*) AS orphans FROM poly_comments c
WHERE NOT (   (c.commentable_type = 'Post'    AND EXISTS (SELECT 1 FROM poly_posts p    WHERE p.id = c.commentable_id))
           OR (c.commentable_type = 'Product' AND EXISTS (SELECT 1 FROM poly_products p WHERE p.id = c.commentable_id)));
-- #endregion

-- #region arc · Cách 2: exclusive arc — mỗi loại cha một cột FK cho phép NULL, CHECK đúng một cột có giá trị
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
INSERT INTO poly_posts VALUES (1, 'Khai trương chi nhánh Q7') ON CONFLICT DO NOTHING;
DROP TABLE IF EXISTS poly_comments_arc;
CREATE TABLE poly_comments_arc (
  id         int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id    int REFERENCES poly_posts (id) ON DELETE CASCADE,
  product_id int REFERENCES poly_products (id) ON DELETE CASCADE,
  body       text NOT NULL,
  CHECK (num_nonnulls(post_id, product_id) = 1)   -- thuộc về đúng MỘT cha
);
CREATE INDEX ON poly_comments_arc (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX ON poly_comments_arc (product_id) WHERE product_id IS NOT NULL;
INSERT INTO poly_comments_arc (post_id, product_id, body) VALUES (1, NULL, 'Chúc mừng!'), (NULL, 1, 'Ngon');
DELETE FROM poly_posts WHERE id = 1;   -- bình luận của bài 1 bị xóa theo (ON DELETE CASCADE)
SELECT count(*) AS orphans FROM poly_comments_arc c
WHERE (c.post_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM poly_posts p WHERE p.id = c.post_id))
   OR (c.product_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM poly_products p WHERE p.id = c.product_id));
INSERT INTO poly_comments_arc (post_id, product_id, body) VALUES (NULL, NULL, 'Không thuộc về ai');
-- #endregion

-- #region join · Cách 3: mỗi loại cha một bảng bình luận riêng, FK đầy đủ; gộp lại bằng UNION ALL khi cần
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
INSERT INTO poly_posts VALUES (1, 'Khai trương chi nhánh Q7') ON CONFLICT DO NOTHING;
DROP TABLE IF EXISTS poly_post_comments, poly_product_comments;
CREATE TABLE poly_post_comments (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, post_id int NOT NULL REFERENCES poly_posts (id) ON DELETE CASCADE, body text NOT NULL);
CREATE TABLE poly_product_comments (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, product_id int NOT NULL REFERENCES poly_products (id) ON DELETE CASCADE, body text NOT NULL);
CREATE INDEX ON poly_post_comments (post_id);
CREATE INDEX ON poly_product_comments (product_id);
INSERT INTO poly_post_comments (post_id, body) VALUES (1, 'Chúc mừng!');
INSERT INTO poly_product_comments (product_id, body) VALUES (1, 'Ngon'), (2, 'Mặn mà');
SELECT 'Post' AS loai, post_id AS cha_id, body FROM poly_post_comments
UNION ALL
SELECT 'Product', product_id, body FROM poly_product_comments ORDER BY 1, 2;
DELETE FROM poly_posts WHERE id = 1;
SELECT (SELECT count(*) FROM poly_post_comments c WHERE NOT EXISTS (SELECT 1 FROM poly_posts p WHERE p.id = c.post_id))
     + (SELECT count(*) FROM poly_product_comments c WHERE NOT EXISTS (SELECT 1 FROM poly_products p WHERE p.id = c.product_id)) AS orphans;
-- #endregion

-- #region kiem-chung · Bảng ✔/✘ của chặng 8
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'K8.1' AS ma, CASE WHEN (SELECT count(*) FROM poly_comments WHERE commentable_type NOT IN ('Post', 'Product')) > 0 THEN '✔' ELSE '✘' END AS ket_qua,
       'cách 1 nhận cả loại gõ sai (Psot): DB không kiểm được' AS chi_tiet
UNION ALL
SELECT 'K8.2', CASE WHEN (SELECT count(*) FROM pg_constraint WHERE conrelid = 'poly_comments_arc'::regclass AND contype = 'c') = 1 THEN '✔' ELSE '✘' END,
       'cách 2 có CHECK num_nonnulls(...) = 1'
UNION ALL
SELECT 'K8.3', CASE WHEN (SELECT count(*) FROM pg_constraint WHERE conrelid IN ('poly_post_comments'::regclass, 'poly_product_comments'::regclass) AND contype = 'f') = 2
               THEN '✔' ELSE '✘' END, 'cách 3: mỗi bảng bình luận có FK tới đúng một cha';
-- #endregion
