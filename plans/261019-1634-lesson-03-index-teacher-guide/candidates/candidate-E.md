# Lesson 3 (Index) — Plan: teacher guide + run-verified labs

## 0. Decisions
- Deliverables: `reports/lesson_03_index_teacher_guide.html` (lesson-2 shell cloned: same CSS tokens, rail, quiz/exam/slide-map JS; actor colours re-mapped to the slide-15 diagram: `--inner` teal internal nodes, `--leaf` pink leaves, `--row` orange rows) + `labs/lesson-03-index/` (Node ESM, `pg` only, `PG_URL` exactly like lesson 2).
- Every number comes from a lab: each lab prints ≤ ~15 lines + "=>" verdict lines; with `--json` it also prints data the widgets replay (no invented widget numbers).
- Measurement: buffers primary, ms secondary (median of 5 warm runs; cold first run shown separately). Every lab session: `jit = off`, `search_path = lab03_indexing, public`, `track_io_timing = on`; index builds `maintenance_work_mem = '256MB'`. The guide explains each setting.
- Shared helper `lab-kit.mjs` (<200 lines): connect(), plan(sql, params, {runs}) → nodes with index names, actual rows, loops, shared hit+read, heap fetches, median time; inTx(fn) BEGIN…ROLLBACK; relSize, btLevel (bt_metap), density (pgstatindex), walBytes(fn) (LSN diff); printRows; expect(direction) prints "✔ khớp dự đoán" / "✘ khác dự đoán". Guide rule: if an expectation fails, the guide follows the measurement — never tweak data to force a result.

## 1. Stage breakdown (≈4.7 h)
| Stage | Slides | Time | Goal |
|---|---|---|---|
| Cách học | 1–3 | 5′ | Sun Tzu (1), outline (2) mapped to stages, warm-up "your slowest query in NestJS" |
| 1. Index là gì & cách đo | 3–8 | 25′ | "why fast" in pages read; read EXPLAIN |
| 2. B-Tree, B+Tree, Hash | 9–12 | 40′ | draw a B+tree; why few levels & fast ranges; when hash |
| 3. Clustered vs secondary, key, PK, unique | 13–21 | 50′ | InnoDB vs PG heap+TID and its write cost; which constraints create indexes |
| 4. Composite, covering, other indexes | 22–29 | 55′ | design column order from query patterns; IOS; partial/BRIN/GIN |
| 5. When to index, failures, best practices | 30–37 | 50′ | diagnose 6 causes of "index not used"; selectivity; bloat |
| 6. Thực chiến | 38–42 | 60′+ | MySQL vs PG table, re-measure lesson-2 query, homework |

Stage 1: 1.1 Index = sorted copy + pointer, on disk (4), built from sorted array + binary search → binary search over 8 KB pages · 1.2 Đọc EXPLAIN trong 60 giây (outside slides: Seq Scan, Index Scan, Index Only Scan, Bitmap Index/Heap Scan, BitmapOr, rows, loops, Buffers hit/read) · 1.3 Classification map (5–6) with "PG 16 có gì" column (btree, hash, gin, gist, brin, spgist; no clustered; no prefix) · 1.4 Data-structure factors (7–8) applied to btree, hash, GIN, BRIN, LSM. W1. Lab 0 + 1A. Quiz (4): pages vs rows; what a buffer is; reading node name; where the index lives.
Stage 2: 2.1 B-Tree (9) · 2.2 B+Tree (10) · 2.3 table (11) · 2.4 nbtree in PG (outside slides: B+tree with right-links, pivot tuples, suffix truncation, dedup) · 2.5 Hash (12) (WAL-logged since PG 10, single-column, no unique). W2. Lab 1B–D. Quiz (5).
Stage 3: 3.1 Clustered InnoDB (13–14) · 3.2 Review exercise on slide-15 diagram (verified on the image: secondary leaves out of order, t@g.com also root separator; 8 of 10 leaf values don't match the clustered tree; clustered keys 1582… differ from drawn id field) — learner fills "email → correct clustered key" · 3.3 Secondary → second lookup via PK (16) · 3.4 PG differs (warn): heap + TID, every index secondary, "two reads" = index + heap, IOS exception · 3.5 Costs + why InnoDB points to PK (17): MySQL answer from slide, PG opposite answer — stores address, pays with HOT/VACUUM/write amplification (Uber 2016); CLUSTER once, not maintained · 3.6 Key vs index (18–19): PG auto-index PK/UNIQUE, not FK · 3.7 Sequential PK (20) with Lab 3 · 3.8 Unique allows multiple NULLs (21), NULLS NOT DISTINCT PG15. W3. Labs 2, 3, 6A–C. Quiz (5).
Stage 4: 4.1 Composite size (22–24) · 4.2 Leftmost (25): 4 queries + "usable ≠ used"; skip scan only PG 18 / MySQL 8.0.13+ · 4.3 "high cardinality first" refuted by measurement (26); rule equality → range → sort · 4.4 Slide 27 in PG (both columns in Index Cond; buffers tell the truth) · 4.5 Covering (28): INCLUDE, VM, ≤5 columns · 4.6 Other indexes (29): no persistent bitmap → bitmap scans + partial; GIN inverted; GiST spatial; BRIN. W4. Labs 4, 5, 6D–E. Quiz (5): 4 slide-25 queries on a new table; column order for `status = ? AND created_at > ? ORDER BY created_at`; Heap Fetches; PROCESSING count; INCLUDE vs key.
Stage 5: 5.1 When to use/not (30–31) with Lab 7 selectivity curve · 5.2 LIKE + collation (32) · 5.3 OR → BitmapOr (33) · 5.4 Types (34): PG errors; bigint vs numeric trap · 5.5 Function (35): expression must match · 5.6 Arithmetic (36) · 5.7 Best practices (37) each with PG note (NOT NULL → PG btree stores NULLs, partial index; prefix → left() expression or hash; imbalance → bloat, REINDEX CONCURRENTLY). W5, W6. Labs 7, 8, 9, 6F–G. Quiz (5) new situations: lower(email)=?, created_at::date=?, phone=0912…, ILIKE 'abc%', status='DELIVERED' at 90%.
Stage 6: 6.1 MySQL ≠ PostgreSQL (38) single table of every difference; "columns in internal nodes" = pivot tuples carry key columns, INCLUDE leaf-only (Lab 5 proves) · 6.2 Recap (39) rewritten with corrections · 6.3 Lab 10 · 6.4 Homework (41) · 6.5 NestJS/TypeORM: @Index, FK needs manual index, CREATE INDEX CONCURRENTLY needs `transaction = false`, soft delete → `@Index({ where: '"deletedAt" IS NULL' })`, uuid PK → bigint identity or time-ordered UUID (uuidv7() PG 18) · References (40); Thank you (42) → teaser Bài 4. Quiz (4).

Discrepancies: each a warn callout "Slide nói / PG 16 đo được" backed by a lab line or widget — 14–17 no clustered (W3, Lab 2); 15 diagram (3.2); 25 skip scan (callout + Lab 4 Q2 buffers); 26 cardinality (Lab 4B, W4); 27 (Lab 4C); 28 VM (Lab 5); 29 bitmap (Lab 6D); 32 LIKE collation (Lab 8); 34 (Lab 8 error verbatim); 37 imbalance vs bloat (Lab 9); 37 prefix (Lab 6G); 37 NULLs in btree (Lab 6F); 38 pivot tuples (Lab 5). Cheat sheet "MySQL ≠ PG" panel repeats them.

## 2. Dataset `lab03_indexing` (`npm run setup`)
Extensions: `CREATE EXTENSION IF NOT EXISTS pageinspect|pgstattuple|pg_trgm SCHEMA lab03_indexing;` (relocatable → dropping schema removes them).
users 1,000,000:
```sql
id bigint PRIMARY KEY,
code varchar(20) NOT NULL,      -- id as text (slide 34)
email text NOT NULL UNIQUE,     -- 'user'||g||'@example.com'
name text NOT NULL,             -- first||' '||last from 50×50 arrays incl. 'Jane','Nguyen'; min length ≥ 7
gender char(1) NOT NULL,        -- 50/50
age int NOT NULL,               -- 18..77 uniform
country text NOT NULL,          -- 20 values: VN 40%, US 20% … SG 0.5%
province text NOT NULL,         -- 10 per country, 'Texas' under US
created_at timestamptz NOT NULL,-- '2020-01-01' + g minutes, correlation 1
deleted_at timestamptz          -- 5% non-null
```
Planted: g%1000=0 → 'ronin'||(g/1000 % 10) (1,000 rows, length 6, prefix); g%1000=1 → first||' ronin' (1,000, suffix).
orders 1,000,000: id PK, user_id → users (no FK index on purpose; ~37% users have no orders), status DELIVERED 90 / CANCELLED 6 / SHIPPING 3 / PROCESSING 1 (10,000), total, created_at.
t_ab 1,000,000: id PK, a = h % 100, b = h % 1000, pad = repeat('x', 40).
```sql
INSERT INTO users SELECT g, g::text, 'user'||g||'@example.com',
  CASE WHEN g%1000=0 THEN 'ronin'||(g/1000%10) WHEN g%1000=1 THEN fn[1+h1%50]||' ronin'
       ELSE fn[1+h1%50]||' '||ln[1+h2%50] END,
  CASE WHEN h3%2=0 THEN 'M' ELSE 'F' END, 18+h4%60, c.country, c.provs[1+h5%10],
  timestamptz '2020-01-01'+g*interval '1 min', CASE WHEN h6%100<5 THEN <deterministic ts> END
FROM generate_series(1,1000000) g,
LATERAL (SELECT hashint8(g*8+1)&2147483647 h1, … h6) h
JOIN countries c ON h3 % 1000 BETWEEN c.lo AND c.hi;  -- small VALUES CTE
```
Setup ends with VACUUM (ANALYZE) on all three. Self-check: ronin prefix = 1,000, length(name)=6 = 1,000, PROCESSING = 10,000, top-3 countries, sizes. Sizes: users ~110 MB + pkey ~21 MB + email ~38 MB; orders ~73 + 21; t_ab ~85 + 21 → ≈370 MB, peak <700 MB. Setup target <60 s.
IMDb read-only + BEGIN; CREATE INDEX …; EXPLAIN …; ROLLBACK. Verified during planning: relallvisible 99.7% both tables, analyzed today, only PK indexes. Lab 10 prints pg_index.indcheckxmin for each transient index (must be false, else invisible in same tx).
Cleanup: `npm run reset` (DROP SCHEMA CASCADE; CREATE SCHEMA). Each lab drops/recreates its own objects at start and drops at end.

## 3. Labs (`npm run labN`)
| # / file | Slides | Claim → measured → expected | Runtime |
|---|---|---|---|
| 0 00-setup.mjs | 41 | dataset above | <60 s |
| 1 01-btree-anatomy-and-hash | 4, 8–12, 38 | A users id=777777 vs titles tconst='tt0111161': btLevel (2 both = 3 levels), buffers ≈4 both vs Seq on code ≈14k → 12.8× rows, same reads. B id BETWEEN 500000 AND 500999 (~20 buffers) vs id = ANY(1000 scattered ids) (~3–4k). C bt_page_items root (key + child block) vs leaf (key + heap TID); btpo_next leaf link. D tx: drop users_email_key, hash on email: = Index Scan (hash); email > …, ORDER BY email LIMIT 5 → Seq; size + build hash vs btree; rollback | ~10 s |
| 2 02-heap-tid-hot-cluster | 14–17 | A tx: ctid changes after UPDATE users SET age=age+1 WHERE id=42 RETURNING ctid. B hot_demo 100k ff90 idx on k: update unindexed v → n_tup_hot_upd ≈100%; update indexed k → 0% HOT, ~2–3× WAL. C users_c 200k random order, country='SG': Heap Blocks exact ~1,000 → ~15 after CLUSTER; correlation ~0 → 1; decays after 20k inserts | ~15 s |
| 3 03-write-cost-and-pk-order | 17, 20, 37 | A insert 200k with 1/4/7 indexes: time, WAL, index size ~linear. B 1M each PK bigint / gen_random_uuid() / time-ordered uuid `(lpad(to_hex(g),12,'0')||substr(md5(g::text),1,20))::uuid`: time, pkey size, avg_leaf_density, WAL → ~21 MB@~90% / ~38–40 MB@~70% / ~30 MB@~90% | ~60 s |
| 4 04-composite-order | 23–27 | A (country, province, name) with 4 slide-25 queries (Texas/US/'Jane Nguyen') + country='SG': Q1 few buffers; Q2/Q3 Seq or full index scan; Q4 US 20% usable but maybe not used. B (name, province, country): same level, size ±10%, same buffers for all-equality — only which queries can use it changes. C t_ab (a,b) vs (b,a) slide-27 Q1–Q3, prints Index Cond + buffers: (a,b) buffers scale with a-range (Q1 ≈2.7k, Q3 ≈200); (b,a) <10 + heap; forced runs labelled "ép" | ~30 s |
| 5 05-covering-index-only | 28, 38 | SELECT name, email … WHERE country='SG' AND province=… with (country, province) vs INCLUDE (name, email): IOS, Heap Fetches 0, several× fewer buffers; committed no-op UPDATE → Heap Fetches > 0 → VACUUM → 0; pivot itemlen < leaf itemlen (INCLUDE leaf-only) | ~15 s |
| 6 06-constraints-and-special | 19, 21, 29, 37 | A pg_indexes PK & UNIQUE only, none for FK. B DELETE user without orders: "Trigger for constraint" 50–100 ms → <0.1 ms with orders(user_id). C NULL, NULL ok; NULLS NOT DISTINCT → 23505. D PROCESSING count: Seq → btree(status) (small via dedup) → partial WHERE status='PROCESSING' (~0.3 MB); DELIVERED stays Seq. E BRIN ~48 KB vs btree ~21 MB on created_at. F full index on deleted_at vs partial IS NOT NULL ~20× smaller. G left(email,10) size; 3 KB string fails "index row size exceeds … 2704" | ~30 s |
| 7 07-when-to-index | 31 | index on age, sweep BETWEEN 18 AND 18+k, k ∈ {0,1,3,6,12,30,59}: Bitmap → Seq around 20–30% selectivity; forced Index Scan loses beyond ~10–20%; JSON for W6. gender index never used. 50-row table → Seq | ~20 s |
| 8 08-index-failures | 32–36 | 32: default btree LIKE 'ronin%' Seq; text_pattern_ops → index; '%ronin' / '%ronin%' Seq until GIN trigram. 33: Seq → BitmapOr once age indexed. 34: id='10' index; code=10 → error 42883 printed; code::int=10 Seq; id=10.0 Seq. 35: length(name)=6 Seq → expression index; char_length(name)=6 still misses. 36: id+1=10, id+0=10-1 Seq; id=9 index. JSON for W5 | ~40 s |
| 9 09-bloat-reindex | 37 | 1M random k: delete 90% + VACUUM → size unchanged, density ~10%, level unchanged; REINDEX CONCURRENTLY → ~1/10 size, density ~90% | ~20 s |
| 10 10-imdb-lesson2-revisited | 28, 31, 38 | variants each in own tx + ROLLBACK: V0 baseline (Parallel Seq Scan; plain EXPLAIN ~19.4k rows num_votes ≥10000); V1 ratings(num_votes); V2 + INCLUDE(average_rating); V3 ratings(average_rating DESC, num_votes DESC) WHERE num_votes >= 10000; V4 titles(start_year) WHERE title_type='movie'. Measures build time, size, plan, loops into titles_pkey, buffers, median. Expect all beat ~149 ms, V3 best for a fixed threshold. Ends with "cache hit 1.24 ms vs best index X ms" + asserts lab_imdb has exactly 2 indexes | ~60–90 s |

## 4. Widgets
W1 Page-read counter (rows 10³–10⁸ log, row width, key size → seq pages vs height & pages touched; presets users 1M / titles 12.8M with Lab 1 buffers). Fixes "index is O(1)", "10× rows = 10× slower". W2 B+tree stepper (order 3–5, insert seq vs random, animate splits, search path, range along leaf links, B-tree mode toggle with records inside internal nodes → taller). W3 Lookup path InnoDB vs PG (engine + operation: by PK, by email, UPDATE unindexed/indexed, covering read → step table of pages read, indexes written). W4 Composite explorer (order country/province/name or a/b; predicate per column =/range/IN/none → seek / in-index filter / unused; % index scanned; lab-4 buffers on preset match). W5 Index-failure doctor (~14 cards: predict, reveal PG-16 plan, reason, fix, lab-8 line; new situations). W6 Selectivity replay (slider over lab 7 JSON: plan node + ms, normal vs forced index).

## 5. Homework (slide 41) ~60′
Part A setup: `npm run setup`, fill 5-row table (row counts; low-cardinality column; why 1,000 'ronin' rows; why deterministic; which FK lacks index) — checkable against setup summary. Part B verify 3 theories: pick 3 of 6 (T1 leftmost + "usable ≠ used"; T2 covering → IOS; T3 function kills index; T4 low-cardinality index ignored; T5 UUIDv4 bigger index; T6 more indexes slower writes). Edit `homework-answers.mine.mjs` (~15 lines): chosen IDs, predicted plan node, "buffers larger/smaller by ~N×", one blank in given SQL (e.g. `ON users (___)`). `npm run homework` prints per theory statement / prediction / actual / match / evidence + 2–3-sentence explanation slot with word bank. Part C (optional): review AI-written TypeORM migration with 5 bugs (index on gender; CONCURRENTLY in transactional migration; (created_at, status) for status=? AND created_at>?; missing orders.user_id index; lower(email) vs plain index) → bug → fix table. Solution `homework-answers.solution.mjs` (`npm run homework:solution`): T1 Q2 Seq or full index scan ≫ buffers; T2 IOS 0 heap fetches; T3 Seq → Bitmap on expression index; prints 3 PASS lines + evidence numbers. Part C answers folded in guide.

## 6. Execution phases
P0 preflight (docker ps — engine pipe vanished during planning, start if needed; PG_URL set, never echoed; lab03 empty; snapshot lab_imdb index list + lesson-2 plain EXPLAIN; view slide images p11, p41). P1 scaffold + setup (package.json scripts setup, lab1..lab10, homework, homework:solution, reset, all; pg@8; lab-kit; setup twice idempotent; self-check; <90 s; <700 MB). P2 labs in order, each twice, same direction, record warm + cold output verbatim in plans/…/lab-runs.md; investigate every ✘ and adjust teaching text. P3 homework solution + a deliberately wrong answers file → FAIL reported correctly. P4 widget data: labs 1, 4, 7, 8 with --json → guide JS constants. P5 write guide (lesson-2 shell; numbers only from lab-runs.md; every h3 slide-ref; exam 10: pages & height; B vs B+; hash; InnoDB vs PG update cost; composite order; INCLUDE & VM; why not used; UUID PK; FK index & CONCURRENTLY; design for GET /movies/top?year= (cache vs index); cheat sheet 12; slide map 42). P6 verify (node -e: SLIDES 42 unique, hrefs exist, slide-ref union = 1–42, every stage has .quiz, quiz indices in range; offline: only Google Fonts + <a>; harness plans/…/verify/ 360 & 400 px iframes scrollWidth ≤ clientWidth light + data-theme dark; console 0 errors, every quiz/widget clicked; secrets grep filenames only + `postgres://postgres:[^<]`). P7 regression (lab_imdb index list unchanged; lesson-2 EXPLAIN still Parallel Seq Scan; lesson-2 lab6 still runs; leave lab03 populated for homework).

## 7. Risks
indcheckxmin true → check first; fallback copy of ratings in lab03 (86 MB), V4 skipped with note. Planner differs → ✔/✘ + guide from actual. Timing noise → buffers primary, median 5, jit off, cold/warm separate. Titles index heavy (1.5 GB scan) → partial only (~760k entries), maintenance_work_mem, --skip-titles flag. Lab crash leftovers → each lab drops own objects at start; IMDb only in tx; reset. Too much content → ≤15 lines/lab, trimmed quotes, folds. Wide plans on phone → pre scrolls, table-wrap. npm offline → pg in lesson-2 node_modules / --offline.

Open question (default no): also measure MySQL claims in a temporary MySQL 8 container (~600 MB image)? Default: label "theo tài liệu MySQL, không đo trên máy này".
