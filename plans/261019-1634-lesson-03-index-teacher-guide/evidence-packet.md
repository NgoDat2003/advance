# Evidence packet — Lesson 3 (Index) teacher guide + labs

Immutable input shared by every plan candidate. Do not edit during the ultra pass.

## 1. Request

User (Vietnamese): "tương tự tạo ra bài giảng cho lesson 2 là cache, hỗ trợ t xây dựng khóa học bài 3 index đi"
Meaning: build the lesson-3 (Index) course material the same way lesson 2 (Caching) was built.

Workspace: `D:/học/advance-be` (not a git repo; no GitHub). Timezone Asia/Bangkok, today 2026-10-19. UI language of the deliverable: Vietnamese.

## 2. What "the same way as lesson 2" means (accepted format, from user feedback memory)

- The user asked Claude to act as a teacher and produce an HTML study guide that is "đầy đủ và nhanh nhất" (complete and fastest).
- A first lesson-2 attempt written as a reference monograph (tabs of dense notes + text-dump simulator) was rejected ("chưa ưng").
- The accepted version is `reports/lesson_02_caching_teacher_guide.html` (1765 lines, ~150 KB, single file): a time-boxed learning path. Sticky left rail of 6 stages with checkboxes + progress bar (localStorage, wrapped in try/catch); per stage: goal line → "Là gì / Tại sao / Khi nào không" definition grids → why-explanations with real numbers → interactive simulator(s) → stage quiz (4–5 MCQ, shuffled options, explanation on answer). Then: final exam (10 interview-style Q with foldable answers), one-page cheat sheet (grid of panels), slide-coverage map (chip per slide linking to its section — every slide covered, none skipped), references, "next lesson" teaser. Callout types: teacher note, warn, ext (outside slides), key. `slide-ref` pill on every h3 naming its slide(s).
- Labs in `labs/lesson-02-caching/` (Node ESM `.mjs`, `package.json` with npm scripts `lab1..lab6`, `homework`; dependencies `pg`, `redis`) were actually run, and every number quoted in the guide is a real measured output pasted as a terminal block.
- Design tokens: CSS variables on `:root`, dark mode via `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and `:root[data-theme="dark"]`; fonts Be Vietnam Pro / Bricolage Grotesque / JetBrains Mono from Google Fonts; no other external resources; works at phone width (16 px gutters, rail collapses under 980 px).
- Slide images are referenced relatively from `../Tài Liệu/assets/<lesson>/...` and hide themselves on error (only visible when opened inside the project folder).

## 3. Learner profile (from tutoring-style memory)

- Learns by empirical experimentation: measure, don't watch videos. Wants nothing from the slides skipped.
- Long prose fails ("nhiều chữ quá đọc ko hiểu"). What works: short code, concrete numbers, step/state tables the learner fills in, one small exercise at a time, check questions set in a new situation.
- Studies to design and review systems, not to hand-code; AI writes code. Writing lesson-2 homework from scratch felt "hơi căng". Practice should be reviewing AI-style code for design bugs and filling design-decision tables.
- Background: solo-built a ~100k LOC NestJS + Next.js monorepo (TypeORM likely), PostgreSQL in production. High-mid level.
- Build abstractions from something already known (e.g. Set → Bloom filter in lesson 2).

## 4. Source material

- Slides as Markdown: `Tài Liệu/3. Index.md` — 42 slides. Images: `Tài Liệu/assets/3_Index/page_XX_img_YY.png`.
- Outline: 1 Introduction (slide 4: index = data structure that speeds retrieval, stored on disk) · 2 Classification (slide 6: by data structure B+tree/Hash/Fulltext/LSM; by physical storage clustered/non-clustered; by #columns single/composite; by characteristics PK/unique/prefix) · 2.1 Data structure (slide 8 factors: use case, time, space, implementation complexity; slide 9 B-Tree: all leaves same level, k children → k-1 keys, O(log N); slide 10 B+Tree: records only at leaves, internal nodes keys only → lower height → fewer disk reads, leaves linked → range queries; slide 11 B-tree vs B+tree comparison table; slide 12 Hash index: equality only, no range/sort, collisions) · 2.2 Physical storage (slide 14 clustered: physical order, one per table, leaves store rows, PK by default, InnoDB clustered must be B+tree; slide 15 diagram clustered + secondary(email); slide 16 secondary leaf stores PK value, many per table, ≥2 reads; slide 17 disadvantages: slower writes, space, build/maintain time; why secondary points to PK not disk address → address can change on defragment) · 2.3 Characteristics (slide 19 key vs index; slide 20 primary index, sequential key → efficient writes; slide 21 unique index allows NULLs, `CREATE UNIQUE INDEX`) · 2.4 Number of columns (slides 23–24 composite; slide 25 index (country, provine, name) — which of 4 queries uses it; "must include first column, order of conditions does not matter"; slide 26 "high cardinality first" → claims more branches, fewer keys per node, lower time complexity, example (name, provine, country); slide 27 composite (a,b): Q1 `a > 1 AND b = 2` uses (a); Q2 `a >= 1 AND b = 2` uses (a,b); Q3 `a BETWEEN 2 AND 8 AND b = 2` uses (a,b); slide 28 covering index, recommended ≤5 columns) · 2.5 Other (slide 29: fulltext/inverted, spatial R-tree / GiST, bitmap index for low-cardinality counting e.g. orders in PROCESSING) · 3 Practices (slide 31 when to use / not use; slides 32–36 index failures: LIKE '%x' / '%x%' / 'x%'; `id = 1 OR age = 18` with index only on id; implicit type conversion int vs varchar ("automatically convert the string to a number"); `length(name) = 6`, function indexes "be careful"; `id + 1 = 10`; slide 37 best practices: limit #indexes, self-incrementing PK (no data movement, fewer page splits), NOT NULL, covering, prefix index, monitor/rebuild ("B+Tree might become imbalance overtime → rebuild"); slide 38 note: fewer search ops, fewer disk I/O, MySQL != PostgreSQL, "in postgres, columns in a row might be included in internal nodes and leaf nodes"; slide 39 recap; slide 40 appendix links (freecodecamp indexing, Kovid Rathee large tables, "MySQL: Building the best INDEX for a given SELECT", "Use The Index, Luke"); slide 41 homework: dataset setup, verify 3 theories from the lecture (theory statement, SQL, result + explanation); slide 42 thank you.

## 5. Scouted facts to verify or use (controller observations)

The slides are MySQL/InnoDB-flavoured; the learner's lab and production DB is PostgreSQL. Points found while reading:

1. Slide 15 diagram is internally inconsistent: secondary-index leaves are not in sorted order (`t@g.com` sits between `d@e.com` and `g@h.com`, and is the root separator), and most leaf PK values (1562, 2354, 2346, …) match no row in the clustered tree; only `j@k.com → 1582` and `k@i.com → 9401` (the two drawn arrows) are right. Candidate for a "review the diagram" exercise.
2. PostgreSQL has no clustered index: tables are heaps; every index (including the PK) is secondary and stores a TID (ctid = block, offset) — i.e. exactly the "disk address" slide 17 says to avoid. Consequences: updates that change the tuple location must touch every index unless HOT applies (Uber's 2016 Postgres→MySQL write-amplification post). `CLUSTER` reorders once and is not maintained. `pg_stats.correlation` measures physical order.
3. Covering index in PG = Index Only Scan, optional `INCLUDE (...)` columns (leaf only), and depends on the visibility map (Heap Fetches > 0 until VACUUM).
4. Slide 26 "high cardinality first, B+tree has more branches" is contested: tree height depends on entry count and key size, not column order; with all-equality predicates any order seeks equally. Modern guidance (Use The Index, Luke; Winand): order by query patterns — equality columns before range columns, then sort columns; leading-column choice decides which queries can use the index. Low-cardinality-first can even help (dedup in PG13+, skip scan).
5. Leftmost-prefix rule is weakened by skip scan: MySQL 8.0.13+ (skip scan range access) and PostgreSQL 18 (btree skip scan). The lab DB is PG 16 → no skip scan, but PG can still full-scan a smaller index when cheaper.
6. Slide 27 (MySQL key_len story): in PG, EXPLAIN shows both columns in `Index Cond` for `a > 1 AND b = 2` and `a >= 1 AND b = 2`; the b condition after a range on a does not narrow the scanned range (except at the boundary), it is checked per index tuple. Verify with BUFFERS, and compare index (a,b) vs (b,a).
7. Slide 34 in PG: `int_col = '10'` uses the index (untyped literal resolved to int); `varchar_col = 10` raises `operator does not exist: character varying = integer` instead of silently scanning; an explicit cast on the column (`varchar_col::int = 10`) disables the index.
8. Slide 32 in PG: with the DB's `en_US.utf8` collation a plain btree on text does NOT serve `LIKE 'ronin%'`; it needs `text_pattern_ops` / `varchar_pattern_ops` or `COLLATE "C"`. `'%ronin%'` / `'%ronin'` can use a `pg_trgm` GIN/GiST index (or a reverse() expression index for suffix).
9. Slide 33 in PG: `id = 1 OR age = 18` → Seq Scan when age is unindexed; BitmapOr when both indexed (MySQL: index_merge).
10. Slide 35 in PG: expression index `CREATE INDEX ON users (length(name))` makes it usable; the query must match the expression exactly; costs on every write.
11. Slide 29 in PG: no persistent bitmap index (Oracle has); PG builds bitmaps on the fly (Bitmap Heap Scan); for "count PROCESSING orders" a partial index `WHERE status = 'PROCESSING'` fits. BRIN exists for physically correlated columns. GIN = inverted index (fulltext, jsonb, trigram); GiST for spatial.
12. Slide 37 "B+Tree might become imbalanced → rebuild": B+trees are always height-balanced by construction; what degrades is bloat / low leaf density after deletes and random inserts → `REINDEX CONCURRENTLY`, `pgstattuple.pgstatindex` (avg_leaf_density, leaf_fragmentation).
13. Slide 21: multiple NULLs allowed in a unique index (both MySQL and PG); PG 15+ has `NULLS NOT DISTINCT`.
14. Slide 19 / NestJS: PG auto-creates indexes for PRIMARY KEY and UNIQUE constraints but NOT for foreign keys (InnoDB does). `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block (TypeORM migrations run in a transaction by default; a migration class can set `transaction = false`).
15. Random UUIDv4 PK vs sequential bigint: random inserts split pages everywhere (~70% leaf fill) → bigger index, more WAL, worse cache locality. PG 16 has `gen_random_uuid()` (v4) but `uuidv7()` only from PG 18.

## 6. Environment (measured 2026-10-19)

- PostgreSQL 16.14 (Alpine) in Docker container `quan_ly_hop_dong-postgres-1`, host port 5433, DB `advance_be_lab`, superuser `postgres`. Password lives only in the container env — never print it, never write it into any file. `docker exec quan_ly_hop_dong-postgres-1 psql -U postgres -d advance_be_lab` works without a password from inside the container.
- DB collation/ctype `en_US.utf8`. `shared_buffers` 128MB, `work_mem` 4MB, `max_parallel_workers_per_gather` 2, `random_page_cost` 4. Container sees 8 CPUs, 7.8 GB RAM. Docker volume has ample space; host D: has 7.6 GB free (keep generated datasets well under 1 GB).
- Extensions available but not installed: `pageinspect` (bt_metap, bt_page_stats → tree level), `pgstattuple` (pgstatindex → leaf density), `pg_trgm`, `btree_gin`, `pg_buffercache`.
- Schemas: `lab01_rest_api` (orders 601 MB), `lab03_indexing` (exists, empty — reserved for this lesson), `lab12_transaction`, `lab14_locking`, `lab_imdb`.
- `lab_imdb.titles` (12,866,977 rows, 1.9 GB): tconst varchar(20) PK, title_type, primary_title text, original_title, is_adult, start_year int, end_year, runtime_minutes, genres. Only index: `titles_pkey` btree(tconst).
- `lab_imdb.ratings` (1,721,260 rows, 138 MB): tconst varchar(20) PK, average_rating numeric(3,1), num_votes int. Only index: `ratings_pkey`. No index on `num_votes` — explicitly reserved as the motivating case for lesson 3.
- `pg_stat_user_tables.n_live_tup` currently shows 0 (stats counters reset); run `ANALYZE` on tables you rely on before reading plans.
- Lesson-2 lab 6 query (149 ms warm / 2.5 s cold, Parallel Seq Scan on ratings + nested loop PK lookups into titles ~3,000 times):
  ```sql
  SELECT t.primary_title, r.average_rating, r.num_votes
  FROM lab_imdb.titles t JOIN lab_imdb.ratings r ON r.tconst = t.tconst
  WHERE t.start_year = $1 AND t.title_type = 'movie' AND r.num_votes >= 10000
  ORDER BY r.average_rating DESC, r.num_votes DESC LIMIT 10;
  ```
  Lesson 2's guide ends promising lesson 3 will add an index and re-measure with `EXPLAIN (ANALYZE, BUFFERS)`, and that "cache and index solve different problems".
- Lesson-2 lab 6 must keep working as documented, so lesson 3 must not leave a permanent new index on `lab_imdb.ratings`/`titles` (PG DDL is transactional: `BEGIN; CREATE INDEX …; EXPLAIN …; ROLLBACK;` leaves no trace).
- Node.js labs on Windows: `setTimeout` ticks ~15 ms (irrelevant for SQL timing but keep in mind). Lesson-2 labs read `PG_URL` from env. `labs/lesson-02-caching/node_modules` already has `pg@8`.
- Headless Chrome on this machine enforces ~504 px min window width; check phone layout via a 320–400 px iframe harness. Chrome DevTools MCP may not be connected.

## 7. Constraints

- Every generated file stays inside `D:/học/advance-be` (project rule). Markdown only under `plans/` or `docs/` unless the user asks.
- Back up before any schema/data change on shared data; keep lesson-3 objects inside `lab03_indexing`, and make labs idempotent and self-cleaning.
- Never print or store the DB password.
- Code files over ~200 lines should be split (kebab-case descriptive names); the HTML guide is exempt as a single self-contained page like lesson 2.
- Real behaviour only: every quoted number must come from a lab that was actually run on this machine.
- Keep it fast to study: total study time comparable to lesson 2 (~4–5 h), stages time-boxed.

## 8. Acceptance criteria (what "done" means)

1. `reports/lesson_03_index_teacher_guide.html` exists, same shell and design system as lesson 2, Vietnamese, works offline except fonts, light + dark, phone width without horizontal scroll.
2. Every one of the 42 slides is mapped in the slide map and explained in a section; MySQL-vs-PostgreSQL differences are explicit wherever the slide's claim does not hold on PG 16.
3. Each stage has a goal, why-explanations, at least one interactive simulator or measured lab result, and a quiz; final exam (10 Q), cheat sheet, references, next-lesson teaser.
4. `labs/lesson-03-index/` with runnable scripts + `package.json` npm scripts; each lab was run here and its real output is quoted in the guide; labs never leave permanent changes outside `lab03_indexing`.
5. Homework (slide 41) is concrete: dataset setup + verify 3 theories (statement, SQL, result, explanation), designed as review/fill-in work matching the learner profile, with a runnable sample solution.
6. No secrets in any file or output.
