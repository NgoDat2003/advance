# Lesson 3 (Index) — Teacher Guide + Run-Verified Labs: Implementation Plan

Deliverables: `reports/lesson_03_index_teacher_guide.html` (same shell/CSS/JS/storage pattern as lesson 2, keys `l3-`) and `labs/lesson-03-index/` (Node ESM + `pg`). Core idea: slides are MySQL/InnoDB, learner runs PostgreSQL 16 → every slide claim gets a "Slide nói / PG 16 làm" pair backed by a lab measurement. Labs measure **buffers** first (stable), milliseconds second (median of 3 warm runs).

Blocker observed: Docker engine stopped responding mid-scouting. Phase 0 must check `docker ps`; the user may need to start Docker Desktop.

## 1. Stage breakdown (≈4.5 h + 30′ exam)

Intro "Cách học" (slides 1–3, 10′): epigraph (1), outline (2), divider (3); warm-up textarea; hook to lesson-2 IMDb 149 ms.

### Stage 1 · Index là gì, vì sao là B+tree (slides 4–12, 35′)
Goal: say in one line why an index is cheap, estimate tree height, choose btree vs hash.
| h3 | Slides | Content |
|---|---|---|
| s1-1 Index là gì | 4 | teaser with Lab 9 before/after |
| s1-2 Bốn trục phân loại | 5–6 | slide→PG map: B+tree→btree, Fulltext→GIN, LSM→not in PG, Prefix index→not in PG (expression index) |
| s1-3 Chọn cấu trúc theo 4 tiêu chí | 7–8 | ladder: array scan → sorted array + binary search (O(N) inserts) → BST → B-tree → B+tree; fill-in table pages per lookup at N=1M |
| s1-4 B-Tree | 9 | W1 |
| s1-5 B+Tree | 10 | Lab 1 levels + buffers |
| s1-6 B-tree vs B+tree | 11 | table translated; ext: PG btree = Lehman–Yao B-link |
| s1-7 Hash index | 12 | Lab 1 hash part |
Quiz 1 (5): height at 12.8M; why key-only internals lower; linked leaves; hash can't ORDER BY; PK lookup buffers.

### Stage 2 · InnoDB clustered vs PG heap (slides 13–21, 45′)
| s2-1 Clustered | 13–14 | warn: PG has none; CLUSTER one-time |
| s2-2 Secondary | 15–16 | W3 diagram bug hunt + W2 engine toggle; "≥2 reads" → InnoDB 2 descents, PG 1 descent + 1 heap page |
| s2-3 Cái giá + con trỏ PK vs địa chỉ đĩa | 17 | PG stores exactly the TID the slide warns against; trade-off; HOT; Uber 2016; Lab 2 |
| s2-4 Key ≠ index | 18–19 | PG auto-indexes PK/UNIQUE, not FK; Lab 3 |
| s2-5 Khóa tuần tự | 20 | PG benefit = fewer index page splits, not data movement; Lab 4B |
| s2-6 Unique & NULL | 21 | NULLS NOT DISTINCT (PG15+); Lab 3 |
Quiz 2.

### Stage 3 · Composite & covering (slides 22–28, 50′)
| s3-1 Composite là gì | 22–24 | phone-book analogy; read slide-24 diagram as sorted (a,b) |
| s3-2 Leftmost | 25 | Lab 5 Q1–Q4; ext skip scan (MySQL 8.0.13+, PG 18) |
| s3-3 "Cardinality cao trước?" | 26 | contested; Lab 5 equal level + buffers; rule equality → range → sort; W4 |
| s3-4 Khoảng rồi bằng | 27 | MySQL key_len vs PG Index Cond lists both; buffers (a,b) vs (b,a) |
| s3-5 Covering | 28 | Lab 6 Index Only Scan, INCLUDE, VM / Heap Fetches |
Quiz 3.

### Stage 4 · Other indexes & when (not) to use (slides 29–31, 25′)
| s4-1 Fulltext/spatial/bitmap trong PG | 29 | GIN, GiST, BRIN; no persistent bitmap; "count PROCESSING" → partial; Lab 7 |
| s4-2 Khi nào dùng / không | 30–31 | Lab 7 + Lab 4A write cost; decision table |
Quiz 4.

### Stage 5 · Index failures & best practices (slides 32–39, 55′)
s5-1 LIKE (32) collation trap · s5-2 OR (33) BitmapOr · s5-3 Ép kiểu (34) error + bigint=10.0 trap · s5-4 Hàm (35) · s5-5 Biểu thức (36) · s5-6 Best practices (37) each with PG verdict (NOT NULL: btree stores NULLs; "imbalance" → bloat, Lab 4C) · s5-7 MySQL ≠ PostgreSQL (38) side-by-side; key columns in internal pivots (suffix-truncated), INCLUDE leaf-only · s5-8 Recap đã hiệu chỉnh (39). Lab 8 + W5. Quiz 5.

### Stage 6 · Thực chiến (slides 40–42, 60′+)
s6-1 Chuẩn bị · s6-2 bảng lab · s6-3 Lab 9 IMDb trước/sau · bai-tap (41) · s6-5 NestJS/TypeORM (@Index, `transaction = false` for CONCURRENTLY, FK indexes, pg_stat_user_indexes.idx_scan) · tham-khao (40) · tiep-theo (42) teaser Bài 4. Quiz 6. Then exam (10), cheat sheet (12), slide map.

PG-vs-MySQL pattern: `callout warn` "Slide nói / PG 16 làm" with claim, PG reality, lab line, new-situation quiz.

## 2. Dataset `lab03_indexing` (deterministic, ≈500 MB, setup ≈30–45 s)
```sql
CREATE OR REPLACE FUNCTION lab03_indexing.h(i bigint, salt text) RETURNS int IMMUTABLE LANGUAGE sql
AS $$ SELECT ('x'||substr(md5(i::text||salt),1,7))::bit(28)::int $$;
```
| Table | Rows | Columns | Purpose |
|---|---|---|---|
| users | 1M | id PK, user_code varchar(10)=id::text unique, email unique, name (rules below), age 18+h%63, gender 50/50, payload md5 | 15–16, 32–36 |
| customers | 1M | country VN 50%, US 5%, JP 10%, 9 others; province 20/country (US real states incl. Texas ≈2,500); name 2,000 values = base50 (incl. JANE ≈500) + _k suffix | 25–28 |
| ab | 1M | a=h%100, b=h%100, payload | 27 |
| orders | 1M | customer_id = 2*(1+h%500000) (even only; odd customers deletable), status PROCESSING 1 / PENDING 2 / CANCELLED 7 / DONE 90, created_at correlated, FK no index | 19, 29, 31 |
users.name: i%1000=7 → 'ronin '||last (1,000); i%1000=507 → first||' baronin' (1,000); i%200=100 → {'an kim','bo lam','vy ngo'} (5,000 len 6); else first||' '||last from 40×30 lists (no other len-6 or ronin). Base indexes: PKs, users_email_key, users_user_code_key, users_name_idx. VACUUM (ANALYZE). Setup drops/recreates; 99-cleanup drops tables. Extensions only inside BEGIN; CREATE EXTENSION … SCHEMA lab03_indexing; …; ROLLBACK (transactional, leaves nothing). IMDb never modified; Lab 9 transient indexes in one tx + rollback, asserts 2 indexes.

## 3. Labs
`explain-kit.mjs`: explain(client, sql, {runs:3}) JSON → node+index, rows, hit/read, heap fetches, median ms; inRollback; relSize; table (≤90 chars). package.json: setup, lab1…lab9, homework:setup, homework, homework:solution, cleanup, all. PG defaults except the labelled slide-27 forced experiment. Each lab: header (slides + claim), table, computed "KẾT LUẬN:" line.

| Lab | Slides | Claim | Steps | Measured | Expected | Time |
|---|---|---|---|---|---|---|
| 01 btree-height-and-hash | 4, 9–12 | height 3–4 at 12.8M; hash equality-only | bt_metap/bt_page_stats users_pkey, titles_pkey, ratings_pkey; id=500000; id BETWEEN 1 AND 1000; tx hash(email) =, >, ORDER BY LIMIT 10 | level, fanout, buffers, size | users_pkey ≈21 MB level 2 → ≈4 buffers; hash only = | ~5 s |
| 02 heap-tid-hot | 14–17 | TIDs; HOT avoids index writes | ctid ids 1–3; bt_page_items; hot_demo ff80 100k; update 10k payload vs 10k email; HOT counters, WAL, index growth; one update on users (ff100) | HOT, WAL, MB, ctid | payload ≈all HOT, email 0 HOT, every index grows; users page full → not HOT | ~5 s |
| 03 keys-unique-fk | 19–21 | PK/UNIQUE auto idx, FK not; NULLs | tx: table PK+UNIQUE+FK → pg_indexes; 2 NULLs; NULLS NOT DISTINCT 23505; EXPLAIN ANALYZE DELETE before/after orders(customer_id) idx | list, trigger ms | trigger ≥100× faster | ~3 s |
| 04 write-cost-pk-order-bloat | 17, 20, 37 | writes, random PK bloat, sparse not unbalanced | A 200k inserts 0/1/3/6 idx; B 1M bigint/uuid v4/time-ordered uuid + pgstatindex; C delete evens, VACUUM, REINDEX | ms, WAL, MB, density, fragmentation, level | v4 ≈70% largest; C level unchanged, density ≈45% → 90% | ~40 s |
| 05 composite-order | 23–27 | leftmost; cardinality order doesn't change height; equality before range | customers slide-25 Q1–Q4 literally; vs (name,province,country); ab (a,b) vs (b,a) forced Index Only count(*) | node, rows, buffers, level, MB | Q1/Q4 index, Q2/Q3 Seq; equal levels ±5%; (a,b) hundreds vs (b,a) single digits; Q1≈Q2 | ~10 s |
| 06 covering-index | 28, 38 | Index Only Scan needs VM | Texas query (country,province) bitmap vs INCLUDE(name) IOS; no-op update → VACUUM | heap blocks, heap fetches | ≈2,400 → ≈15, 0 → thousands → 0 | ~10 s |
| 07 low-cardinality-partial-brin | 29, 31 | low cardinality relative; partial, BRIN | btree(status) vs partial; PROCESSING vs DONE; BRIN vs btree created_at 1 day; gender; 50-row temp | MB, node, buffers | PROCESSING index, DONE Seq; BRIN kB vs 21 MB | ~10 s |
| 08 index-failures | 32–36 | 11 cards in tx | LIKE prefix/text_pattern_ops; %ronin/%ronin% trgm; OR → age idx; id='10'; user_code=10 42883; user_code::int; id=10.0; length → expression + ANALYZE, char_length; id+1=10, id+0=10-1, id=10-1 | node, rows, buffers, ms, error | per evidence §5 | ~15 s |
| 09 imdb-before-after | 4, 31, 38 | index fixes cold path cache hides | V0 baseline; BEGIN; lock_timeout 3s; V1 ratings(num_votes) (check indcheckxmin); V2 + titles(start_year) WHERE title_type='movie'; ROLLBACK; assert 2 | node, buffers, ms, build s, MB | Parallel Seq Scan → index paths; ~150 ms → tens | ~40 s |

## 4. Widgets
W1 height calculator (N log 1e3–1e10, key type int4/bigint/uuid/text20/text40, fill 90/70, structure binary / B-tree with 200 B rows / B+tree) — calibrated to Lab 1. W2 InnoDB vs PG find-a-row (query type, engine toggle, "UPDATE moves row" HOT on/off; animated page visits on corrected slide-15 data). W3 slide-15 bug hunt (click wrong entries → reveal: 8/10 leaf PKs nonexistent, t@g.com out of order + root separator, clustered keys ≠ id field → corrected table). W4 composite playground (order, predicate per column, engine PG16/PG18/MySQL8.0.13+ → seek prefix vs per-tuple check, % leaf pages, node, Lab 5 buffers). W5 guess-the-plan 12 cards (Index / Seq / Lỗi) with real Lab 8 line. Quizzes per stage.

## 5. Homework (fill-in + review)
Part A: homework:setup creates products 500k (sku unique 'SKU-'||lpad, category 30 incl. Laptop, brand 500 incl. Dell, name, price); learner fills dataset card. Part B: copy homework-3-theories.template.mjs → .mine.mjs; cards with claim (given), prediction (đúng/sai/tùy), setup (given), one TODO SQL, explain; runner runs each card in BEGIN…ROLLBACK, prints node, buffers, level, size next to prediction. T1 slide 26 (brand,category) vs (category,brand) → sai về chiều cao, tùy truy vấn. T2 slides 16/28 "secondary always ≥2 reads" → INCLUDE(price) IOS. T3 slide 32 LIKE 'SKU-00012%' → Seq under en_US; varchar_pattern_ops → index. Part C: homework-review-migration.ts with 8 planted bugs (status index 90% DONE; FK no index; CONCURRENTLY in tx; (created_at, customer_id) for customer_id=$1 AND created_at>=$2; LOWER(email) plain index; uuid PK hot table; LIKE '%'||$1||'%' btree; redundant (customer_id) next to (customer_id, created_at)) → table Dòng/Vấn đề/Slide/Sửa. Solution: .solution.mjs + .fixed.ts + folded table.

## 6. Execution phases
Phase 0 preflight (docker ps, version, lab03 empty, lab_imdb snapshot, PG_URL session-only, npm install pg). Phase 1 scaffold + dataset, setup twice, self-check target counts; tune distributions only here. Phase 2 labs one at a time, run twice (buffers within few %), outputs/labN.txt, object diff, lab_imdb 2 indexes; measurement wins over expectation. Phase 3 homework. Phase 4 guide (clone shell, image path ../T%C3%A0i%20Li%E1%BB%87u/assets/3_Index/, 5 widgets, 6 quizzes, exam, cheat sheet, 42 chips). Phase 5 verification (scratchpad scripts): slide coverage exactly-once + hrefs + every h3 slide-ref; numbers real (grep terminal/num spans vs outputs); headless Chrome console 0 errors + click quizzes + widgets; dark mode emulate + data-theme; 360 px harness; offline grep; secrets grep; final DB state. Phase 6 acceptance pass 1–6.

## 7. Risks
Docker down → gate. indcheckxmin → Lab 9 checks; fallback ratings copy. Planner differs → narrative after labs, surprise as "can use ≠ will use". Timing noise → buffers, median 3, no cold claims. WAL/disk from titles builds → partial index. Autovacuum VM changes → explicit VACUUM. HOT impossible on full pages → ff80 table. Lesson-2 lab6 concurrent → ShareLock ~40 s, lock_timeout. Files >200 lines → split.

Open questions: keep ≈500 MB dataset after course? (default keep; cleanup script). Start Docker Desktop (user or permission)?
