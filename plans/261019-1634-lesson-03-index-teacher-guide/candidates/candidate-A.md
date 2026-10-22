# Plan: Lesson 3 (Index) teacher guide + run-verified labs

**Deliverables:** `reports/lesson_03_index_teacher_guide.html` (cloned lesson-2 shell: CSS tokens, rail, quiz/exam/slide-map JS, localStorage prefix `l3-`) + `labs/lesson-03-index/` (11 labs, setup/teardown, homework, `outputs/`).

**Verified facts (catalog-only):** PG 16.14, `jit=on`, `track_io_timing=off`; `lab03_indexing` empty; `pageinspect`/`pgstattuple`/`pg_trgm` all relocatable → installable `WITH SCHEMA lab03_indexing`; IMDb tables analyzed today, `relallvisible` ≈99.7% (index-only scans feasible); `ratings` = 10,992 pages; `num_votes` ≥1M / ≥100k / ≥10k = 98 / 3,162 / 18,310 rows. Current lesson-2 plan: Parallel Seq Scan ratings → Sort by rating → nested loop into `titles_pkey` until 10 rows of 2015 movies match (that walk is the "~3,000 lookups"). **Docker became unreachable mid-scouting** (`dockerDesktopLinuxEngine` pipe missing) — see P0 gate.

New guide element: `callout pg` ("Postgres 16 đo được") + `pg` marker on slide-map chips where the slide's claim differs on PG.

## 1. Stage breakdown (slides 1–42, ~4 h 40 + 30′ exam)

Intro "Cách học bài này" (slides 1–2): Sun Tzu epigraph, stage table, warm-up textarea ("câu query chậm nhất trong dự án NestJS của bạn").

| # | Stage | Slides | Time | Goal |
|---|---|---|---|---|
| 1 | Index là gì, vì sao nhanh | 3–8 | 25′ | Define index as "trade space + write cost for fewer page reads"; know when planner refuses it |
| 2 | B-Tree, B+Tree, Hash | 9–12 | 45′ | Explain O(log N) with fan-out ~hundreds; why range needs B+tree; hash = equality only |
| 3 | Clustered vs Secondary, và Postgres không có clustered index | 13–17 | 45′ | InnoDB two-tree lookup vs PG heap+TID; price = HOT/write amplification |
| 4 | Key, PK, Unique, Composite, Covering | 18–28 | 60′ | Pick column order from query patterns; read BUFFERS, not "uses index yes/no" |
| 5 | Index khác, khi nào dùng, index thất bại, best practices | 29–39 | 60′ | Diagnose "why isn't my index used" on PG; maintenance |
| 6 | Thực chiến: đóng vòng Bài 2 + bài tập | 40–42 | 45′+ | Bring the 149 ms query down with measured indexes; homework |

Sections:
- Stage 1: s1-1 Index là gì (4) Là gì/Tại sao/Khi nào không · s1-2 Bốn cách phân loại (5–6) map table with PG column (B+tree→btree, Hash→hash, Fulltext→GIN, LSM→not in PG, Clustered→none, Prefix→none, use expression index) · s1-3 Chọn cấu trúc theo 4 tiêu chí (7–8): array scan/sorted array/hash/B+tree on use case, time, space, implementation · s1-4 Đo trước khi tin (Lab 1). W1. Quiz 1 (4): cost of an index; selectivity crossover; "stored on disk" vs shared_buffers; LSM write-optimized, not in PG.
- Stage 2: s2-1 B-Tree (9) built from Set → sorted array → BST → B-tree · s2-2 B+Tree (10) · s2-3 So sánh (11) · s2-4 B+tree thật trong Postgres: level + buffers per lookup (Lab 2) · s2-5 Hash (12) (Lab 3). W2. Quiz 2 (5).
- Stage 3: s3-1 Clustered (13–14) · s3-2 Secondary + "soi sơ đồ slide 15" (15–16) · s3-3 Cái giá của index (17) · s3-4 Postgres trỏ đúng "địa chỉ đĩa" mà slide 17 khuyên tránh: TID, HOT, Uber (17) (Lab 4A) · s3-5 CLUSTER và correlation (14) (Lab 4B). W3. Quiz 3 (5).
- Stage 4: s4-1 Key vs Index; FK không tự có index trên PG (18–19) · s4-2 Primary index + khóa tuần tự vs UUID (20) · s4-3 Unique & NULL (21) · s4-4 Composite: leftmost prefix (22–25) · s4-5 Thứ tự cột: cardinality hay mẫu truy vấn? (26) · s4-6 Slide 27 đọc bằng BUFFERS (27) · s4-7 Covering & Index Only Scan (28). Labs 5–7. W4. Quiz 4 (5).
- Stage 5: s5-1 GIN/GiST/BRIN/partial, "bitmap index" on PG (29) (Lab 8) · s5-2 Khi nào dùng/không (30–31) (Lab 1 sweep + gender) · s5-3a–e Năm kiểu thất bại (32–36) (Lab 9) · s5-4 Best practices (37) (Lab 10, Lab 5) · s5-5 MySQL ≠ PostgreSQL (38) consolidated table · s5-6 Recap đã hiệu chỉnh (39). W5. Quiz 5 (5).
- Stage 6: s6-1 Môi trường (npm run setup) · s6-2 Lab 11: top-10 IMDb 149 ms → ? with measured bar chart incl. lesson-2 cache hit 1 ms · bai-tap (41) · s6-4 Áp vào NestJS/TypeORM · exam (10 Q), cheat sheet (12 panels), slide map, references (40), teaser Bài 4 Codebase Structure (42).

Slide map (42 chips): 1–2→#cach-hoc; 3→#chang-1; 4→s1-1; 5–6→s1-2; 7–8→s1-3; 9→s2-1; 10→s2-2; 11→s2-3; 12→s2-5; 13→#chang-3; 14→s3-1; 15–16→s3-2; 17→s3-3; 18→#chang-4; 19→s4-1; 20→s4-2; 21→s4-3; 22–25→s4-4; 26→s4-5; 27→s4-6; 28→s4-7; 29→s5-1; 30→#chang-5; 31→s5-2; 32–36→s5-3a–e; 37→s5-4; 38→s5-5; 39→s5-6; 40→#tham-khao; 41→#bai-tap; 42→#tiep-theo.

PG-vs-MySQL teaching pattern: slide says (MySQL) → Lab N measured on PG 16 → why.
| Slide | Taught via |
|---|---|
| 6, 14 clustered | W3 + Lab 4B (CLUSTER one-shot, correlation 0→1→decays) |
| 15 diagram | review exercise: unsorted leaves; only 1582, 9401 valid |
| 16 leaf=PK | Lab 2 bt_page_items shows ctid; Lab 7 heap fetch skipped |
| 17 "not disk address" | Lab 4A WAL + index growth, HOT vs non-HOT |
| 12 hash | Lab 3: single-column, no unique, equality only |
| 19 FK | Lab 5A delete trigger time without/with index |
| 21 NULLs | Lab 5B NULLS NOT DISTINCT (PG15+) |
| 20/37 sequential PK | Lab 5C UUIDv4 vs time-ordered UUID (uuidv7() only PG 18) |
| 25 leftmost | Lab 6A + W4 skip-scan toggle (MySQL 8.0.13+ / PG 18, not PG 16) |
| 26 cardinality first | Lab 6B: same size, same level, same buffers → "đúng một phần" |
| 27 key_len | Lab 6C index pages for (a,b) vs (b,a) |
| 28 covering | Lab 7 INCLUDE + visibility map |
| 29 bitmap | Lab 8 partial index, btree dedup, Bitmap Heap Scan, BRIN |
| 32 LIKE | Lab 9 en_US collation trap, text_pattern_ops, pg_trgm |
| 33 OR | Lab 9 BitmapOr (MySQL index_merge) |
| 34 types | Lab 9 error 42883; untyped literal and bind parameter both work |
| 35 function | Lab 9 expression index, needs ANALYZE, exact match |
| 37 "imbalance" | Lab 10 level unchanged, density collapses, REINDEX fixes; prefix index → expression index on left(col,n) |
| 38 internal/leaf | Labs 2/7: key columns in pivots (suffix-truncated), INCLUDE only in leaves, rows in heap |

## 2. Dataset `lab03_indexing` (`setup-dataset.sql`, run by `00-setup.mjs`)

```sql
CREATE SCHEMA IF NOT EXISTS lab03_indexing; SET search_path = lab03_indexing, public;
CREATE EXTENSION IF NOT EXISTS pageinspect WITH SCHEMA lab03_indexing;   -- + pgstattuple, pg_trgm
DROP TABLE IF EXISTS orders, users, customers, t_ab CASCADE;
CREATE OR REPLACE FUNCTION r(i bigint, salt int, n int) RETURNS int LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$ SELECT ((hashint8(i*7919 + salt)::bigint + 2147483648) % n)::int $$;
CREATE TABLE users (id int PRIMARY KEY, legacy_id varchar(12) NOT NULL, name text NOT NULL,
  email text NOT NULL UNIQUE, age int NOT NULL, gender char(1) NOT NULL, profile text NOT NULL);
INSERT INTO users SELECT i, i::text, s[1+r(i,1,20)] || s[1+r(i,2,20)] || s[1+r(i,3,20)],
  'u'||i||'@example.com', CASE WHEN r(i,4,1000) < 3 THEN 18 ELSE 19 + r(i,5,60) END,
  CASE r(i,6,2) WHEN 0 THEN 'M' ELSE 'F' END, md5(i::text)
FROM generate_series(1,1000000) i, (SELECT ARRAY['ro','na','ki','mo','nin','tan','lee','min','son','kar',
  'vin','dra','jen','pha','quy','hoa','lan','tuk','bor','zel'] s) x;
CREATE INDEX users_name_idx ON users(name); CREATE INDEX users_legacy_id_idx ON users(legacy_id);
CREATE TABLE customers (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, country text NOT NULL,
  province text NOT NULL, name text NOT NULL, email text NOT NULL, pad text NOT NULL);
-- country 20 codes uniform, province 50/country (US P0 = 'Texas'), name 'JANE' 1/10000 else N+6 digits (200k distinct)
CREATE TABLE t_ab (a int NOT NULL, b int NOT NULL, c text NOT NULL);  -- a 0..999, b 0..99
CREATE TABLE orders (id bigint identity PK, user_id int NOT NULL, status text NOT NULL, amount numeric(12,2), created_at timestamptz);
-- status DELIVERED 90 / CANCELLED 5 / SHIPPING 3 / PENDING 1 / PROCESSING 1; created_at = 2025-01-01 + i*30s
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
```
Then `VACUUM (ANALYZE)` all four (sets VM). Designed distributions: `name LIKE 'ronin%'` ≈2,500; `'%ronin'` ≈2,500; `length(name)=6` ≈8,000; `age=18` ≈3,000 (rare so BitmapOr wins); gender 50/50; Texas ≈1,000; JANE ≈100; t_ab a=5 ≈1,000; PROCESSING ≈10,000; users 950,001+ have no orders. Size ≈510 MB; labs add ≤150 MB transient. Setup 40–90 s. `99-teardown.mjs`: DROP SCHEMA CASCADE + CREATE SCHEMA (removes extensions too). IMDb read-only: DDL only inside BEGIN…ROLLBACK (labs 1, 11) — transactional DDL is itself a teaching point (MySQL DDL implicitly commits); no VACUUM/ANALYZE on IMDb; `assertImdbUntouched()` after each IMDb lab.

## 3. Labs (Node ESM, pg only)

`lab-kit.mjs` (~150 lines): pool from PG_URL; per session search_path, jit=off, track_io_timing=on, max_parallel_workers_per_gather=0 except labs 1/11; `explain()` parses JSON into node chain, rows, Index Cond/Filter, Rows Removed, Heap Fetches, hit+read, ms; `median5()`; `inRollback()`, `walBytes()`, `sizes()`, `printTable()` (≤100 cols), `assertImdbUntouched()`. Buffers primary. Every lab ends with `Dọn dẹp: ✔`.

| Lab | Slides | Claim → steps | Measured | Expected | Time |
|---|---|---|---|---|---|
| 1 seq-vs-index-selectivity | 4, 31 | `SELECT tconst, average_rating FROM lab_imdb.ratings WHERE num_votes >= t` for t ∈ {1e6,1e5,1e4,1e3,100}; in tx CREATE INDEX on ratings(num_votes), rerun, ROLLBACK; prints indcheckxmin | node, rows, buffers, ms | t=1e6: 98 rows, 10,992 → ~100 buffers; t=1e4 bitmap ~8–9k heap blocks (small gain); t ≤1e3 Seq Scan kept | ~10 s |
| 2 btree-anatomy | 9–11, 38 | bt_metap level for 300-row temp, users_pkey, ratings_pkey, titles_pkey; root fan-out; point lookup on titles; range users id 1..50000; bt_page_items root vs leaf | level, pages, items, buffers | levels 0/2/2/2–3; 12.8M lookup ≈4–5 buffers | 2 s |
| 3 hash-vs-btree | 12 | hash_demo copy; btree then hash on email; =, BETWEEN, ORDER BY LIMIT 5 | size, build ms, node, buffers | hash 25–35% smaller; range→Seq, order→Sort | 6 s |
| 4 heap-tid-hot-cluster | 14–17 | A: hot_demo 200k ff90 pk+3 idx, ctid before/after, 20k update non-indexed vs indexed. B: t_ab copy + idx(a), WHERE a=5 heap blocks + correlation before/after CLUSTER, after 10k inserts | n_tup_hot_upd, WAL, Δindex; heap blocks, correlation | A: ~100% HOT vs 0%, WAL ≥3×. B: ~1,000→~5 blocks; correlation 0→1→falls | 15 s |
| 5 keys-unique-fk-pk | 19–21, 20/37 | A catalog auto indexes, DELETE user RI trigger time before/after orders(user_id) index (rollback). B NULLs + NULLS NOT DISTINCT 23505. C 500k inserts pk_seq / pk_uuid4 / pk_uuid_time | trigger ms, error, ms, MB, density, WAL | trigger tens ms → <0.1 ms; uuid4 1.5–2× bigger, ~70% density | 20 s |
| 6 composite-order | 23–27 | A (country,province,name) slide-25 Q1–Q4 + reversed WHERE, SELECT * and index-only views. B vs (name,province,country). C t_ab (a,b) vs (b,a) slide-27 Q1–Q3 | node, Index Cond, pages, size, level | Q1 seek 4–5 pages; Q2/Q3 full index or Seq; B equal; C (a,b) Q1/Q2 ≈ all leaves, Q3 ~20; (b,a) ~25 / ~3 | 20 s |
| 7 covering-index-only | 28, 38 | customers (country,province) vs INCLUDE(name,email); UPDATE pad=pad id%50=0 → heap fetches → VACUUM → 0; bt_page_items tuple length | node, buffers, heap fetches, bytes | ~1,000+ → ~10; pivots carry no INCLUDE | 15 s |
| 8 partial-brin-lowcard | 29, 31 | count PROCESSING: Seq vs btree(status) vs partial ON orders(id) WHERE status='PROCESSING'; BRIN vs btree created_at; gender | size, node, buffers | partial ~0.3 MB; BRIN tens of KB vs ~22 MB; gender Seq | 15 s |
| 9 index-failures | 32–36 | one tx, 13 rows (LIKE prefix → text_pattern_ops; %x%/%x → trgm GIN; OR → BitmapOr; id='10'; legacy_id=10 ERROR 42883; legacy_id::int=10 Seq; bind param $1=[10] Index; length(name)=6 → expression idx + ANALYZE, char_length Seq; id+1=10, id+0=10-1 Seq vs id=9) | node, buffers / error | as listed | 20 s |
| 10 bloat-reindex | 37 | bloat_demo 1M, idx on random v; pgstatindex → delete 90% + VACUUM → REINDEX CONCURRENTLY | level, size, density | level & size unchanged, density 90%→10%, REINDEX ~10× smaller | 15 s |
| 11 imdb-top10-revisited | 39 (+16, 28) | lesson-2 query 2015 baseline → tx: (num_votes) → drop → (num_votes) INCLUDE (average_rating, tconst) → ROLLBACK; check #1 row matches lesson 2 | plan chain, heap blocks, loops, buffers, ms | plain index modest gain (correlation −0.16), covering large gain; rest = ~3k titles_pkey lookups | 15 s |

package.json scripts: setup, teardown, lab1…lab11, homework, check.

## 4. Widgets
- W1 Máy tính trang đọc: N (log, to 13M), row width, selectivity %, correlation → heap pages, index pages, heap fetches by correlation, planner-style cost (seq 1/random 4), crossover + Lab 1 points. Fixes "index = nhanh / luôn được dùng".
- W2 Cây B+Tree tự dựng: tabs B-Tree | B+Tree | Hash; insert asc/random/typed, order 3–6; splits, height, fill %, leaf links; "Tìm" visits; "Quét [x,y]" B+ leaf walk vs B-tree bouncing; Hash tab buckets + collisions + range must scan all. Fixes "cây mất cân bằng", range, asc fill.
- W3 Đường đi lookup InnoDB vs Postgres: step player (reuse lesson-2 race player); SELECT by email, UPDATE non-indexed (HOT/non-HOT), row move after page split; counters; slide-15 image with "tìm 2 lỗi". Fixes "PG có clustered PK".
- W4 Sân chơi composite: column order + predicate per column → sorted 40-row mini index, scanned range highlighted, per-column "seek bound / lọc trong index / không dùng", skip-scan toggle (MySQL 8.0.13+ / PG 18).
- W5 Bắt lỗi index: 10 flashcards, predict Index/Seq/Error, reveal Lab 9 line + fix.

## 5. Homework (slide 41) ~45′
Part A: npm run setup, paste summary. Part B: verify 3 of 6 theories (T1 leftmost, T2 cardinality first, T3 covering, T4 LIKE, T5 types, T6 imbalance), recommended T2/T3/T4; `npm run homework -- T2 T3 T4` prints statement, SQL (pre-written) and metrics, no verdict; learner fills worksheet in guide (localStorage): Phát biểu | Dự đoán (dropdown) | Dòng SQL chứng minh | Số đo | Giải thích | Kết luận Đúng/Đúng một phần/Sai trên PG 16. Part C: review `homework-review-entity.ts` with 5 bugs (FK no @Index; @Index(['createdAt','status']) for status=? AND created_at>=? ORDER BY created_at; CONCURRENTLY inside transactional migration; LOWER(email) vs plain index; uuid PK on hot insert table) → fill table. Sample solution: script + pasted output + folded filled worksheet.

## 6. Execution phases
P0 gate (Docker, container, PG 16.14, lab03 empty, lab_imdb 2 indexes, PG_URL shell-only). P1 kit + dataset; setup twice; count distributions; plain EXPLAIN to confirm intended flips; adjust constants and rerun if a flip is missing — never fake. P2 labs 1–11 twice each, outputs/labNN.txt, `npm run check`; lesson-2 lab6 still Parallel Seq Scan ~149 ms. P3 homework. P4 guide (clone shell, 5 quizzes 24 Q, exam 10, cheat sheet, SLIDES with pg flags; terminal blocks verbatim). P5 verification scripts under plans/.../verify/: SLIDES 1..42, hrefs resolve, every stage h3 has slide-ref, ≥18 callout pg; numbers in terminal blocks appear in outputs; quiz answer indices valid, headless clicks full score, no console errors; light/dark/data-theme screenshots, 360 px iframe harness; offline (only fonts); secrets grep.

## 7. Risks
Planner differs → design selectivity, check in P1, quote measured. indcheckxmin on IMDb → Lab 1 prints flag; fallback ratings copy. Timing noise → buffers primary. SHARE lock 2–3 s on ratings. Extensions DB-wide → teardown. Calling slides "wrong" → "MySQL/InnoDB đúng; PG 16 khác vì…". hashint8 internal but stable on PG 16. Lesson-2 regression → assert + rerun lab6.

Open questions: OK to start Docker Desktop? OK to install the 3 extensions in lab03_indexing?
