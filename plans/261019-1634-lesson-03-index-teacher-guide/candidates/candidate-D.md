# Plan — Lesson 3 (Index) teacher guide + run-verified labs

## 0. Fixed decisions
- Deliverables: `reports/lesson_03_index_teacher_guide.html` (clone lesson-2 shell: CSS tokens, rail, quiz/exam/slide-map JS, store try/catch; localStorage prefix `l3-`) and `labs/lesson-03-index/` (Node ESM, only dep `pg`, `PG_URL` env like lesson 2).
- PG 16 on this machine is the source of truth. Every slide claim gets a verdict chip: `Đúng trên PG16` / `MySQL đúng, PG khác` / `Cần sửa`. MySQL behaviour cited from docs and labelled "không chạy trên máy này".
- Lab session defaults: `SET jit = off` (JIT is on; plans >100k cost pay compile time), `SET search_path = lab03_indexing, public`.
- Measurement: 1 warm-up + median of 5 `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`; buffers headline, ms secondary.
- Persistent objects allowed: 4 dataset tables + helper fn `h()` + 3 extensions, all in `lab03_indexing`. Everything else `lab03_indexing.tmp_*` dropped in `finally`, or wrapped in BEGIN…ROLLBACK (mandatory for anything touching `lab_imdb`).

## 1. Stage breakdown
| Stage | Slides | Time | Goal | h3 sections | Widget/Lab | Quiz |
|---|---|---|---|---|---|---|
| Cách học | 1–3 | 5′ | hook | epigraph (1); outline→stage table (2); section title (3); warm-up textarea opening with lesson-2's 149 ms | — | — |
| 1. Index là gì, đo trước khi tin | 4–6 | 20′ | feel one lookup (Seq 1M rows vs 4 pages); classification map PG has/lacks | 1.1 Index là gì, nằm trên đĩa (4); 1.2 Bốn cách phân loại → bản đồ MySQL vs PG (5–6): B+tree ✓ btree · Hash ✓ · Fulltext→GIN · LSM ✗ · Clustered ✗ (heap) · Prefix ✗ (expression index) · PK/Unique ✓ | Lab 1; W1 (seq-pages mode) | buffers meaning; what PG lacks; tiny table ignores index; index has a real file size |
| 2. B-Tree, B+Tree, Hash | 7–12 | 45′ | why B+tree is shallow, range-friendly, log-time; hash equality only | 2.1 Bốn tiêu chí (7–8): B+tree/Hash/GIN/BRIN/LSM by use case, time, space, implementation; 2.2 B-Tree (9); 2.3 B+Tree (10); 2.4 So sánh (11); 2.5 Hash (12) | W2 stepper, W1; Lab 2, 3 | why B+ lower; leaf chain; hash vs ORDER BY; height of 1M int index; key width effect |
| 3. Index nằm đâu so với dữ liệu | 13–21 | 50′ | InnoDB clustered vs PG heap+TID; write cost; key vs index | 3.1 Clustered (13–14); 3.2 Secondary + "soi sơ đồ slide 15" (15–16); 3.3 PostgreSQL: heap + TID (outside slides); 3.4 Cái giá & vì sao trỏ PK (17); 3.5 Key vs index (18–19); 3.6 Khóa tuần tự (20); 3.7 Unique & NULL (21) | W3 lookup animator; Lab 4, 5, 6 | PG lookup path; UPDATE moves tuple; HOT; FK not indexed; many NULLs |
| 4. Composite & Covering | 22–28 | 60′ | column order by query pattern; read Buffers not "columns used" | 4.1 Composite & storage (22–24); 4.2 Leftmost (25); 4.3 "Cardinality cao trước?" (26); 4.4 Range + equality (27); 4.5 Covering (28) | W4 composite explorer; Lab 7, 8 | slide-25 variants; WHERE order irrelevant; (a,b) vs (b,a); Heap Fetches; INCLUDE vs key |
| 5. Index khác & 5 kiểu thất bại | 29–36 | 55′ | recognise when planner cannot / will not use an index; PG fix each | 5.1 GIN/GiST/bitmap (29); 5.2 Khi nào dùng/không (30–31); 5.3–5.7 Failure 01–05 (32–36) | W5 "Đoán plan"; Lab 9, 10 | LIKE+collation; OR→BitmapOr; varchar=10 error vs id=10.0; expression match; rare status still worth an index |
| 6. Thực hành tốt & thực chiến | 37–42 | 60′+ | apply to IMDb & NestJS; homework | 6.1 Best practices each with PG verdict (37); 6.2 MySQL ≠ PG summary (38); 6.3 Lab 11 IMDb; 6.4 Recap corrected (39); 6.5 Soi migration do AI viết; 6.6 Bài tập (41); 6.7 NestJS/TypeORM; exam, cheat sheet, slide map, references (40), teaser Bài 4 (42) | Lab 5 (bloat), 11; W5 reused | bloat vs imbalance; REINDEX CONCURRENTLY; unused indexes; capstone index winner; cache vs index |
Total ≈4.8 h. Section-title slides (3, 5, 7, 13, 18, 22, 30) map to their stage head.

Discrepancy teaching (warn callout at the slide + evidence):
| Slide | Claim | PG 16 truth | Evidence |
|---|---|---|---|
| 10, 38 | records at leaves; PG "columns in internal and leaf nodes" | PG leaves hold TIDs; INCLUDE only in leaves; internal pivots truncated | Lab 2 bt_page_items |
| 14–16 | clustered PK; secondary→PK→row | no clustered; every index→TID→heap; CLUSTER one-shot | W3, Lab 4 |
| 15 | diagram | leaf keys out of order (t@g.com as separator); most leaf PKs nonexistent; only 1582, 9401 right | "find 2 bugs" |
| 17 | PK pointer beats disk address | PG stores address: 1 hop shorter lookup, non-HOT update writes every index (Uber 2016) | Lab 4 |
| 19 | (implicit) | PK/UNIQUE auto index; FK not (InnoDB does) | Lab 6 |
| 20, 37 | sequential PK | same; uuidv7() only PG 18 | Lab 5 |
| 21 | unique allows NULL | many NULLs; NULLS NOT DISTINCT PG15 | Lab 6 |
| 25 | must include first column | true for seeks on PG 16; skip scan MySQL 8.0.13 / PG 18; usable ≠ chosen | W4, Lab 7B forced |
| 26 | high cardinality first | `Cần sửa`: height = entries × key width; equality → range → ORDER BY | Lab 2 + 7C, W1 |
| 27 | Q1 uses (a); Q2/Q3 (a,b) | MySQL key_len; PG Index Cond shows both; only Buffers reveal range | Lab 7D |
| 28 | covering | IOS needs VM; INCLUDE | Lab 8 |
| 29 | bitmap index | none persistent; runtime bitmaps (BitmapAnd); partial/BRIN; GIN inverted, GiST spatial | Lab 9 |
| 32 | 'ronin%' uses index | not under en_US.utf8; text_pattern_ops; trigram GIN for %x% | Lab 9, 10 |
| 33 | OR fails | BitmapOr if both indexed (MySQL index_merge) | Lab 10 |
| 34 | silent conversion | varchar = 10 ERROR; id = 10.0 casts column → Seq | Lab 10 |
| 35 | function index "be careful" | expression must match; ANALYZE afterwards | Lab 10 |
| 37 | prefix index; imbalance → rebuild | no prefix index (expression index); always balanced; bloat → REINDEX CONCURRENTLY | Lab 5, 9 |
| 6, 12, 14 | LSM; hash | no LSM; hash WAL-logged since PG 10, no unique / multicolumn | text |

## 2. Dataset `lab03_indexing`
| Table | Rows | Slides | Columns |
|---|---|---|---|
| users | 1,000,000 | 4, 12, 14–17, 31–36 | id bigint PK; id_text varchar(20)=id::text; name = 3 syllables of 40 (3–5 chars → 9–15 chars, none contain "ronin"); exactly 1,000 rows each `ronin…`, `…ronin`, `…ronin…`, and 6-char md5 names; email user<id>@<4 domains>; age 18–97; gender M/F; country char(2) 30; note text; created_at 2020-01-01 + id min |
| customers | 500,000 | 21, 23–26 | country 40 ('US' 10%); province 20/country (US incl. 'Texas'); name ~100k distinct + 25 exact 'JANE'; email 2% NULL |
| t_ab | 1,000,000 | 27–28 | a 1..1000, b 1..100 independent; pad char(40) |
| orders | 1,000,000 | 19, 29, 31, HW | customer_id FK → customers 1..50,000 (20 each) no index; status DELIVERED 90/CANCELLED 6/SHIPPING 3/PROCESSING 1; total_amount; created_at 2023-01-01 + id×30 s |
Deterministic generation:
```sql
CREATE EXTENSION IF NOT EXISTS pageinspect SCHEMA lab03_indexing;  -- + pgstattuple, pg_trgm
CREATE OR REPLACE FUNCTION lab03_indexing.h(seed int, g int) RETURNS bigint
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT hashint4(g # (seed*1000003))::bigint + 2147483648 $$;  -- 0..2^32-1; abs(hashint4) overflows on INT_MIN
INSERT INTO users SELECT g, g::text,
  CASE h(1,g) % 1000 WHEN 0 THEN 'ronin'||b.base WHEN 1 THEN b.base||'ronin'
       WHEN 2 THEN left(b.base,3)||'ronin'||substr(b.base,4) WHEN 3 THEN substr(md5(g::text),1,6) ELSE b.base END,
  'user'||g||'@'||(ARRAY['gmail.com','yahoo.com','outlook.com','fpt.vn'])[1+h(2,g)%4],
  18 + h(3,g)%80, CASE WHEN h(4,g)%2=0 THEN 'M' ELSE 'F' END, (ARRAY[...30])[1+h(8,g)%30], NULL,
  timestamptz '2020-01-01' + g*interval '1 minute'
FROM generate_series(1,1000000) g CROSS JOIN LATERAL (... 3 syllables ...) b;
-- ADD PRIMARY KEY after load, orders FK, VACUUM (ANALYZE)
```
Idempotent (counts match → "đã có sẵn"; `--force` rebuilds). Self-check prints status distribution, 3 ronin counts (1000 each), length(name)=6 count, NULL emails, sizes. ≈390 MB; transient ≤150 MB; setup 45–90 s. IMDb touched only by Lab 11 (one tx + savepoints → ROLLBACK, then assert 2 indexes; no ANALYZE outside tx).

## 3. Labs
`pg-kit.mjs`: explain(sql) → {node, index, indexCond, rows, ms, hit, read, heapFetches}; inRollback(fn); idx(name) → size, bt_metap.level, pgstatindex density; box table(). Scripts: setup, lab1…lab11, homework, homework:mine, all, check (invariants), reset.
| # / file | Slides | Proves | Steps | Expected | Run |
|---|---|---|---|---|---|
| 01-seq-scan-vs-index | 4, 31, 38 | index cuts pages; planner skips for tiny tables / big fractions | email='user777777@…' no idx → CREATE INDEX tmp → again; pg_relation_filepath; tmp_small 1,000 rows + idx; gender='F'; age=30 | (Parallel) Seq ~15k buffers → Index Scan 4 buffers; index ~30–40 MB file; small → Seq; gender → Seq; age → Bitmap | ~10 s |
| 02-btree-anatomy | 9–11, 26, 38 | height ~log N; leaves linked; internal pages separators only; key width (not column order) sets height | tmp bigint tables N=300 / 50k / 1M → level; 1M × 96-byte md5 text → level; bt_page_stats prev/next; bt_page_items(root); INCLUDE column absent on internal pages | levels 0 / 1 / 2; text → 3 | ~20 s |
| 03-hash-vs-btree | 12 | hash equality only | hash & btree on email (rollback): size, =, email > 'user9', ORDER BY LIMIT 10, pgstathashindex overflow pages | = hash; range/order Seq/Sort; hash ≤ btree | ~15 s |
| 04-heap-tid-hot-cluster | 14–17, 38 | TIDs; non-HOT touches every index; CLUSTER one-shot | ctid before/after UPDATE note; tmp_users_w 200k ff80 idx email/name/age: 50k updates note vs age → pg_stat_force_next_flush(), n_tup_hot_upd, index sizes, WAL; CLUSTER correlation ~0 → range buffers → CLUSTER + ANALYZE → insert 20% → decay | note mostly HOT, indexes unchanged; age 0 HOT, 3 indexes grow, WAL several×; range ≥10× fewer | ~40 s |
| 05-write-cost-pk-bloat | 17, 20, 37 | writes slower per index; sequential compact; imbalance = bloat | 200k inserts 0/1/3/5 idx (ms, WAL); 1M bigint vs gen_random_uuid() (size, density, fragmentation, level, WAL); delete 50% scattered + VACUUM; REINDEX | ~linear; uuid 30–40% bigger (~70% vs ~90%); density ~45% same size after delete; REINDEX halves; level unchanged | ~60 s |
| 06-keys-unique-fk | 19–21, 37 | constraint vs structure; FK not auto-indexed; NULL semantics | pg_indexes orders; DELETE 20 customers rollback trigger time before/after orders(customer_id) idx; UNIQUE + 3 NULLs; NULLS NOT DISTINCT error; IS NULL uses btree; partial IS NOT NULL size | FK hundreds ms → ~1 ms | ~15 s |
| 07-composite-order | 22–27 | leftmost; WHERE order irrelevant; pattern order; range-then-equality | A sizes (country), (+province), (+name). B slide-25 4 queries + reordered predicates natural + forced (`ép`). C (country,province,name) vs (name,province,country) size, level, buffers all-eq, country-only, name-only. D t_ab (a,b) vs (b,a) slide-27 Q1–Q3 | B Q1 index; Q2/Q3 Seq; Q4 Bitmap or Seq, usable when forced. C equal level, ±10%, equal buffers. D (a,b) Q3 ~hundreds vs (b,a) handful; Q1/Q2 on (a,b) ≈ full index | ~45 s |
| 08-covering-index-only | 28, 37, 38 | IOS depends on VM | SELECT a,b … b=2 AND a BETWEEN 2 AND 8 on (b,a); tmp copy autovacuum off → Heap Fetches = rows → VACUUM → 0; SELECT a,b,pad Index Scan vs INCLUDE(pad) IOS + size cost | as stated | ~20 s |
| 09-gin-partial-brin | 29, 31, 37 | inverted index; runtime bitmap; partial; BRIN; prefix alternative | trgm GIN LIKE '%ronin%'; PROCESSING none/btree(status)/(id) WHERE status='PROCESSING'; DELIVERED; status + created_at BitmapAnd; BRIN vs btree 1 day; left(name,4) expression | trgm ~100×; partial ~0.2 MB vs ~7 MB; DELIVERED Seq; BRIN tens KB vs ~20 MB | ~40 s |
| 10-index-failures | 32–36 | 5 failures with PG verdict | LIKE 'ronin%' default → Seq; text_pattern_ops → Index; reverse(name) LIKE 'ninor%'; OR → age idx → BitmapOr (fallback OR email=…); id='10' Index; id_text=10 ERROR; id_text::int=10 Seq; id=10.0 Seq; length(name)=6 → expression → Bitmap; char_length Seq; id+1=10 Seq vs id=9 | as listed | ~30 s |
| 11-imdb-capstone | 31, 38 + L2 | right index fixes the first reader cache can't; rows ≠ pages | BEGIN; SET LOCAL jit=off; V0 baseline; SAVEPOINT V1 ratings(num_votes); V2 titles(start_year) INCLUDE (tconst, primary_title) WHERE title_type='movie'; V3 = V2 + ratings(tconst) INCLUDE (num_votes, average_rating); ROLLBACK; assert | V0 ≈149 ms; V1 modest (18,310 rows over most of 10,992 pages); V2/V3 target ≥5× — if missed, explain via buffers | 60–120 s |
Output: header + one box table `│ Query │ Index │ Plan │ Rows │ Buffers │ ms │` + one "Kết luận"; raw output saved to outputs/NN.txt.

## 4. Widgets
W1 Height & page calculator (N, key bytes, row bytes, page 8 KB, fill → fanout/height for B-tree with rows in internals, B+tree, PG btree+INCLUDE; seq pages vs height+1; "đổi thứ tự cột" toggle that changes nothing; calibrated to Lab 2). W2 B-tree/B+tree stepper (insert seq/random, order 3–5, search, range; SVG, nodes visited, range walk, split count). W3 Lookup animator InnoDB vs PG (engine toggle; tìm j@k.com; UPDATE dòng → InnoDB secondaries untouched vs PG new TID unless HOT). W4 Composite explorer (~40 sorted entries; scanned run vs matches; verdict seek/full-index/Seq; scanned-vs-returned counter). W5 "Đoán plan" 12 cards (Index/Bitmap/Index Only/Seq/ERROR) with real lines from Labs 1/9/10.

## 5. Homework (slide 41)
Files: homework-runner.mjs; homework-index-theories.mine.mjs (template with predict '???', one DDL blank per theory, verdict + why); .solution.mjs. Runner refuses '???' (predict before running), runs each theory in rollback on `orders` (fresh ground), prints slide-41 format (Phát biểu / SQL / Kết quả + giải thích) with ✓/✗; guide mirrors the 3 cards with localStorage textareas.
| Theory | Statement | Learner fills | Sample answer |
|---|---|---|---|
| H1 (25, 27) | (customer_id, created_at) used only when WHERE has customer_id | predictions A customer_id=42, B one-day created_at, C both | A Index/Bitmap; B Seq; C both columns in Index Cond → đúng trên PG16 (PG18 skip scan changes B) |
| H2 (29, 31) | index on low-cardinality status useless | partial index DDL; predictions PROCESSING, DELIVERED | PROCESSING uses index (~0.2 MB); DELIVERED Seq → đúng một phần |
| H3 (28) | covering answers from index alone | INCLUDE list for SELECT created_at,total_amount … WHERE customer_id=42 ORDER BY created_at DESC LIMIT 5 | without INCLUDE: Index Scan Backward, Heap Fetches 5; with INCLUDE(total_amount): IOS, 0 → đúng if VM fresh |
6.5 review drill (not homework): AI-written TypeORM migration with 6 bugs (CONCURRENTLY in transactional migration → transaction = false; index on gender; FK customerId no index; (created_at, status) for status=$1 AND created_at>$2; LOWER(email)=$1 vs index on email; (customer_id) duplicating (customer_id, created_at)), answers folded.

## 6. Execution phases
P0 preflight (docker ps; start container; PG_URL session-only; Node v22.18; package.json + pg; snapshot lab_imdb 2 indexes; SELECT 1). P1 dataset (pg-kit, 00-setup; twice, second skips; self-check; ~390 MB; runtime). P2 labs 01–10 (run twice; outputs/NN.txt; plan shapes identical; `npm run check`; files <200 lines; text follows measurement). P3 Lab 11 twice + invariants + plain EXPLAIN of lesson-2 query shows baseline shape. P4 homework (solution; mine refuses '???'). P5 guide (clone shell; stages; exam 10; cheat sheet 12; slide map 42; references slide 40 + Use The Index, Luke + PG docs; teaser; terminal blocks verbatim; W5 cards real lines). P6 verification (node script: SLIDES 1..42, hrefs, every slide number in some slide-ref, every stage h3 has slide-ref, QUIZ a < o.length, 4–5 per stage, EXAM 10; number audit: every terminal pre is a substring of some outputs file; offline grep; headless light/dark (emulation + data-theme) 1280 + 360 iframe harness; console clean; secrets grep). P7 final state (dataset kept; check green).

## 7. Risks
indcheckxmin → check after each in-tx CREATE; lab03 fallback create+commit+DROP finally; Lab 11 aborts with message if true. Planner differs → text after measurement; forced plans labelled "ép". Timing noise → jit off, median 5, buffers headline; cold claims only as shared read counts. Lab 11 ShareLock on titles (1.9 GB scan, temp files) → run alone, ROLLBACK frees. Stats lag/autovacuum → pg_stat_force_next_flush(), autovacuum off on tmp, explicit VACUUM. Extensions in non-public schema → schema-qualify opclasses/functions. Docker instability → fail fast with Vietnamese hint. Secrets → env only, placeholder.

Open question: extensions add DB-wide pg_extension rows; a later lesson wanting pg_trgm in public needs ALTER EXTENSION … SET SCHEMA — acceptable?
