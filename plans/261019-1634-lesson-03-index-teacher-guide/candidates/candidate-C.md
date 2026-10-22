# Plan — Lesson 3 (Index) teacher guide + run-verified labs

## 0. Core decisions
- PostgreSQL 16 here is ground truth; MySQL behaviour is described from docs, never run. Every slide claim that doesn't hold on PG gets a `callout warn` "PostgreSQL ≠ slide" with 3 lines: Slide nói / Trên PG 16 / Bằng chứng (Lab N).
- Buffers are the headline metric (`EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, FORMAT JSON)`); timing = median of 5 warm runs with `SET jit = off`. Buffers repeat exactly on deterministic data.
- Base tables are read-only after setup. Labs that write use scratch tables (`l04_*`…) dropped at end — also sidesteps `pg_index.indcheckxmin` (index on a table with broken HOT chains is unusable in the creating transaction).
- IMDb read-only; transient indexes only in BEGIN … ROLLBACK. No ANALYZE on IMDb (reltuples + pg_statistic present; n_live_tup = 0 only = counters reset).
- Extensions pageinspect, pgstattuple, pg_trgm created `SCHEMA lab03_indexing` (relocatable, verified), removed by DROP SCHEMA … CASCADE teardown.

## 1. Stage breakdown (6 stages, ~275 min + 30 min exam)
| # | Title | Slides | Time | Goal |
|---|---|---|---|---|
| 1 | Index là gì & vì sao B+Tree | 1–11 | 40′ | Explain with numbers why 1M and 12.8M rows both cost ~4 page reads |
| 2 | Hash, clustered và heap của PG | 12–17 | 50′ | Trace read path and write cost of an index in InnoDB vs PG |
| 3 | Key, Primary, Unique | 18–21 | 25′ | Choose PK type; know what PG auto-indexes |
| 4 | Composite & covering | 22–28 | 55′ | Predict which queries a composite serves; order columns by query pattern |
| 5 | Index khác & khi index thất bại | 29–36 | 45′ | Diagnose 11 failure cases from EXPLAIN and fix them the PG way |
| 6 | Thực hành tốt, PG≠MySQL, IMDb, bài tập | 37–42 | 60′+ | Re-measure the lesson-2 query; homework |

h3 sections:
- S1: 1.1 Index là gì (4) · 1.2 Bốn cách phân loại + bảng ánh xạ sang PG (5–6: B+tree→btree, Hash→hash, Fulltext→GIN, LSM→không có, Prefix→expression index, Bitmap→không lưu sẵn) · 1.3 Bốn tiêu chí (7–8) · 1.4 B-Tree (9) · 1.5 B+Tree fanout ~300 (10) · 1.6 Đọc bảng slide 11 bằng số đo (11). Slide 1 hero epigraph, 2 "Cách học", 3 → #chang-1. W1, Lab 01. Quiz: height for N & fanout; key-only internals; leaf chain; PG btree B+-like with sibling links; LSM in PG?
- S2: 2.1 Hash (12) · 2.2 Clustered và vì sao PG không có (13–14) · 2.3 Secondary + review sơ đồ slide 15 (15–16) · 2.4 Cái giá; "trỏ PK hay địa chỉ" — PG chọn TID + HOT, Uber 2016 (17). W2, W3. Labs 02A, 03, 04A/B. Quiz.
- S3: 3.1 Key ≠ index; PG auto PK/UNIQUE, NOT FK (18–19) · 3.2 PK tuần tự vs UUIDv4 (20) · 3.3 Unique & NULL, NULLS NOT DISTINCT (21). W4. Labs 05, 02B, 04C. Quiz incl. gen_random_uuid() is v4, uuidv7() only PG 18.
- S4: 4.1 Composite lưu gì (22–24) · 4.2 Leftmost; skip scan MySQL 8.0.13+/PG 18, not PG 16 (25) · 4.3 Thứ tự cột: cardinality hay mẫu truy vấn (26, contested) · 4.4 Dải (a,b): Index Cond + Buffers thay key_len (27) · 4.5 Covering = IOS + INCLUDE + VM (28). W5. Labs 06, 07, 08A. Quiz incl. slide-25 questions transplanted to a contracts table.
- S5: 5.1 GIN/GiST/BRIN; "bitmap index" → partial (29) · 5.2 Khi nào dùng/không: selectivity per value, not per column (30–31) · 5.3 LIKE + collation (32) · 5.4 OR → BitmapOr (33) · 5.5 Ép kiểu (34) · 5.6 Hàm/biểu thức (35–36). W6, W7. Labs 08B–E, 09. Quiz: five new queries to diagnose.
- S6: 6.1 Thực hành tốt; "mất cân bằng" → bloat/leaf density (37) · 6.2 Bảng PG≠MySQL (38) · 6.3 Lab 10 query Bài 2 · 6.4 Recap đã sửa (39) · 6.5 Bài tập (41) · 6.6 NestJS/TypeORM (FK index, CONCURRENTLY needs `transaction = false`, pg_stat_user_indexes.idx_scan). 40 → #tham-khao, 42 → #tiep-theo (Bài 4). W8. Lab 10, homework.

Slide map: 1–2 #cach-hoc · 3 #chang-1 · 4 s1-1 · 5–6 s1-2 · 7–8 s1-3 · 9 s1-4 · 10 s1-5 · 11 s1-6 · 12 s2-1 · 13–14 s2-2 · 15–16 s2-3 · 17 s2-4 · 18–19 s3-1 · 20 s3-2 · 21 s3-3 · 22–24 s4-1 · 25 s4-2 · 26 s4-3 · 27 s4-4 · 28 s4-5 · 29 s5-1 · 30–31 s5-2 · 32 s5-3 · 33 s5-4 · 34 s5-5 · 35–36 s5-6 · 37 s6-1 · 38 s6-2 · 39 s6-4 · 40 #tham-khao · 41 #bai-tap · 42 #tiep-theo.

Discrepancy table (each a callout + row in S6 table):
| Slide | Slide says | PG 16 | Lab |
|---|---|---|---|
| 14 | Clustered | heap; CLUSTER one-shot | 03 |
| 15 | diagram | unsorted leaves, wrong PKs | W3 |
| 16 | 2 reads secondary→PK→clustered | index→TID→heap | 03 |
| 17 | point to PK not address | PG points to address; HOT mitigates | 04 |
| 19 | FK index implied | PG never auto-indexes FK | 04C |
| 20 | sequential PK efficient | PG cost is index density/WAL not table reorg | 05 |
| 21 | NULLs allowed | same + NULLS NOT DISTINCT | 02B |
| 25 | first column needed | true PG 16; skip scan PG 18 | 06 |
| 26 | high cardinality first | order by query pattern | 06, HW T1 |
| 27 | Q1 uses (a) | both columns in Index Cond; same buffers | 07 |
| 28 | covering | IOS needs VACUUM | 08A |
| 29 | bitmap index | partial / runtime bitmaps | 08B |
| 31 | low cardinality → no index | depends on queried value selectivity | 08D |
| 32 | 'x%' uses index | not with en_US.utf8 unless text_pattern_ops | 09 |
| 33 | OR fails | BitmapOr when both indexed | 09 |
| 34 | silent conversion | varchar = int errors | 09 |
| 37 | tree imbalanced | always balanced; density degrades | 05 |
| 38 | row columns in internal nodes | INCLUDE leaf-only (suffix truncation) | 08A itemlen |

## 2. Dataset `lab03_indexing` (`sql/setup-dataset.sql`, idempotent)
```sql
SET search_path = lab03_indexing;
CREATE EXTENSION IF NOT EXISTS pageinspect SCHEMA lab03_indexing; -- + pgstattuple, pg_trgm
CREATE OR REPLACE FUNCTION u(seed int, i bigint) RETURNS float8 LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT (hashint8(i*1000003+seed) & 2147483647)::float8/2147483648 $$;
CREATE TABLE users (id int PRIMARY KEY, ext_id int NOT NULL UNIQUE, code varchar(10) NOT NULL,
  email text NOT NULL, name text NOT NULL, age int NOT NULL, created_at timestamptz NOT NULL);
INSERT INTO users SELECT i, (i::bigint*7919 % 1000003)::int,  -- permutation uncorrelated with heap order
  lpad(i::text,10,'0'), 'user'||i||'@example.com',
  CASE i % 10000 WHEN 1 THEN 'ronin'||(i/10000 % 10) WHEN 2 THEN 'kai ronin' WHEN 3 THEN 'the ronin way'
       ELSE first[...]||' '||last[...] END,
  CASE WHEN i % 1000 = 0 THEN 18 ELSE 19+floor(u(3,i)*62)::int END,  -- age 18 rare by design
  timestamptz '2024-01-01' + i*interval '30 s'
FROM generate_series(1,1000000) i;
```
customers (1M): country 20 codes, US 40% then geometric; province 50/country (~1,000 distinct, US real states incl. Texas); name 100 upper-case × suffix 0–19 = 2,000 distinct incl. JANE. orders (1M): id identity PK, user_id 1..50,000 FK → users no index, status DELIVERED 90 / CANCELLED 6 / SHIPPING 3.5 / PROCESSING 0.5 (≈5,000), total, cancel_reason (94% NULL), created_at increasing (BRIN), note 60 chars. ab (1M): a 0..9, b 0..999, pad char(20). VACUUM (ANALYZE). ≈450 MB + base indexes, peak ≈650 MB. `npm run setup` 60–90 s, prints counts, sizes, distribution checks + checksum sum(hashtext(name)). teardown = DROP SCHEMA CASCADE + CREATE SCHEMA.

## 3. Labs (`lib/pg-lab-kit.mjs`: connect prints only host/db; plan(sql,{runs:5}) → node, index, Index Cond, Rows Removed, Heap Fetches, hit/read, rows, median ms; walBytes(fn); relSize; withRollback; table())
| File | Slides | Proves | Measures | Expected | Run |
|---|---|---|---|---|---|
| 01-btree-shape-and-lookup | 4, 8–11, 38 | height ~log300 | bt_metap level, pgstatindex users_pkey; titles_pkey level + root stats; pg_relation_filepath; buffers id=777777, tconst='tt0111161', code='0000777777' (no idx), id BETWEEN 100000 AND 100999 | levels 2–3; lookup ≈ level+2; seq ≈13k; range ~3 leaves | 5 s |
| 02-hash-vs-btree-and-unique | 12, 19, 21 | hash only =; unique NULLs | hash vs btree email: size, =, >, ORDER BY LIMIT; pg_indexes auto; l02_uq NULLs, NULLS NOT DISTINCT 23505, UNIQUE USING hash → error | — | 6 s |
| 03-heap-tid-vs-clustered | 13–16 | TIDs; physical order decides range cost | ctid; bt_page_items; id BETWEEN 1 AND 10000 vs ext_id BETWEEN 0 AND 9999; correlation; l03_scatter 200k CLUSTER + 20k inserts | correlated ~150 vs uncorrelated ~10k buffers | 6 s |
| 04-write-cost-hot-and-fk | 17, 19 | index write cost; HOT; FK index | l04_w 0/1/3/6 idx × 200k; ff80 HOT vs non-HOT 50k updates; l04_parent/child 1M delete 50 parents without/with idx | linear; HOT ≈all + much less WAL; ≥100× FK | 25 s |
| 05-pk-order-and-rebuild | 20, 37 | random keys lower density; tree stays balanced | 500k bigint / UUIDv4 / pre-sorted UUID; REINDEX; delete 50% + VACUUM: density drops, tree_level unchanged | seq ~90%, v4 ~70% | 25 s |
| 06-composite-leftmost-and-order | 23–26, 39 | leftmost; order by pattern | (country,province,name) vs (name,province,country): size, level, slide-25 Q1–Q4, all-equality, country+province ORDER BY name LIMIT 20 | all-eq same; Q2/Q3 Seq; Q4 (US 40%) Seq although usable | 10 s |
| 07-composite-range-ab | 27 | key_len wrong lens | Q1–Q3 SELECT a,b (a,b) vs (b,a) | (a,b) hundreds, Q1≈Q2; (b,a) <10 | 6 s |
| 08-covering-partial-brin | 28, 29, 31, 37, 38 | IOS, partial, selectivity, NULL cost | A l08_orders autovacuum off, user_id=4242 ORDER BY created_at DESC LIMIT 20 with none/(user_id)/(user_id,created_at)/+INCLUDE(total), heap fetches before/after VACUUM, itemlen; B PROCESSING none/full/partial; C BRIN; D DELIVERED vs PROCESSING; E full vs partial cancel_reason IS NOT NULL | heap fetches 20→0; partial ≈1% size | 15 s |
| 09-index-failures | 32–36 | 11 failure cases + fixes | LIKE variants, OR (+age=30), types, code='0000000010', length + expression + ANALYZE, id+1 | — | 10 s |
| 10-imdb-lesson2-query | 31, 39 + L2 | the hinted index isn't the best; cache ≠ index | guard 2 indexes; baseline; each variant in own tx with maintenance_work_mem 256MB, EXPLAIN×5, ROLLBACK: A ratings(num_votes); B titles(title_type,start_year); C titles(start_year) WHERE title_type='movie'; D B + ratings(tconst) INCLUDE(num_votes,average_rating) | A modest/unused (~4.7% of ratings match per histogram); B/C much lower buffers; C ≪ B size | 60–120 s |

## 4. Widgets
W1 B+Tree height calculator (N, key bytes 4/8/16, fill, B-Tree-with-200-byte-rows toggle; log₂N compare). W2 Read/update path InnoDB vs PG (step email='j@k.com', UPDATE indexed vs not; index-write counter). W3 slide-15 review: 6 Đúng/Sai statements. W4 Page split: capacity 4, 40 keys seq vs seeded-random → splits, leaf count, fill (calibrated to Lab 05). W5 Composite range explorer: two tabs (24-row country/province/name both orders; 10×10 a,b grid) → scanned/filtered/skipped colouring + verdict incl. PG 18 skip scan. W6 Selectivity crossover with simplified cost model + Lab points. W7 Guess the plan 12 cards. W8 Index design table for the lesson-2 query (column, =/range/sort, selectivity from pg_stats, candidate index → compare with Lab 10).

## 5. Homework (slide 41) — "review an AI-written experiment"
hw_contracts 500k rows (autovacuum off, ANALYZE only) mirroring the learner's contract app: customer_id 1..25k, store_id 1..200, status ACTIVE 60/EXPIRED 30/DRAFT 9.5/TERMINATED 0.5, signed_at, total, code. `npm run hw:draft` (setup + flawed draft) and `npm run homework` (setup + solution). Three theories with planted flaws in homework-ai-draft.mjs: (1) slide 26 — creates both (store_id,status) and (status,store_id), times one cold run with Date.now(), concludes "store first 3× faster" (flaws: planner uses same index both times; cold vs warm; ms not buffers). (2) slide 28 — SELECT *, no VACUUM, Heap Fetches = rows, "useless on PG". (3) slide 31 — tests only status='ACTIVE', "drop the index". Learner fills per theory (textareas l3-hw-*): Dự đoán · ≥2 lỗi thiết kế thí nghiệm · số đo sau sửa · Kết luận. Self-check 6 criteria. Solution prints verdict lines e.g. "T1 · ĐÚNG MỘT PHẦN · (store,status) N buf = (status,store) N buf; chỉ (status,…) phục vụ status='TERMINATED'". Both draft and solution outputs quoted.

## 6. Execution phases
0 Preflight (Docker up; baseline snapshot lab_imdb indexes, pg_extension, lab03 objects; PG_URL by command substitution; npm init + pg; no pg_dump needed). 1 Dataset twice, identical checksums, <700 MB. 2 Labs 01–09 twice, identical plan nodes, buffers ±5%, scratch gone, no URL printed; outputs to lab-outputs.md. 3 Lab 10 guards; lesson-2 query still Parallel Seq Scan. 4 Homework draft + solution. 5 Claims ledger claim → lab → value → direction OK, narrative rewritten where planner disagrees; then widget defaults + quiz answers. 6 HTML (clone shell, l2-→l3-, terminal blocks verbatim; images ../Tài Liệu/assets/3_Index/ with onerror hide). 7 Verify: SLIDES exactly 1..42, hrefs, slide-ref on every stage h3; terminal numbers in lab-outputs; only Google Fonts external; headless 1280 light/dark + 360 iframe; 0 console errors; scripted quiz/widget clicks; secret grep (count only); teardown → setup round trip; pg_extension clean.

## 7. Risks
Planner surprises (Lab 10 A, slide-27 bitmap) → narrative follows measurement, quizzes after Phase 5. Timing noise → buffers, median 5, jit off; Lab 10 re-measures own baseline. indcheckxmin/autovacuum → no writes on base tables, scratch autovacuum off. Lab 10 heavy builds (1.9 GB scans) → C cheap; B behind FULL=1 if >3 min; SHARE lock blocks writers only. Password → env only, `<mật-khẩu>` placeholder, grep. Slide-15 analysis from image → re-check in Phase 6.

Open questions: none blocking. Vetoable defaults: extensions into lab03_indexing dropped by teardown; homework uses a contracts-domain table.
