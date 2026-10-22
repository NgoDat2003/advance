---
title: Lesson 3 (Index) teacher guide + run-verified labs
status: completed
completed: 2026-10-20
created: 2026-10-19
mode: ultra (best-of-5 plan, verifier-selected E + grafts)
---

# Plan — Lesson 3 Index

Source of truth for scope: `evidence-packet.md` (same folder). Candidates in `candidates/`; verifier picked **E** (87) over D (86), C (82), A (84), B (81) and listed grafts below.

## Outcome
`reports/lesson_03_index_teacher_guide.html` (lesson-2 shell, Vietnamese, 6 stages + exam + cheat sheet + 42-slide map) and `labs/lesson-03-index/` (Node ESM, `pg`, shared `pg-explain-kit.mjs`). Every number in the guide is pasted from a lab run on this machine (`plans/.../lab-runs.md`).

## Non-goals
No MySQL container (MySQL behaviour cited from docs, labelled "không đo trên máy này"). No permanent change outside `lab03_indexing`. No git/GitHub steps (workspace is not a repo).

## Stages (~4.7 h)
| # | Stage | Slides | Time | Widgets / labs |
|---|---|---|---|---|
| 0 | Cách học | 1–3 | 5′ | warm-up textarea |
| 1 | Index là gì & cách đo (incl. "Đọc EXPLAIN trong 60 giây") | 3–8 | 25′ | W1 · Lab 01 |
| 2 | B-Tree, B+Tree, Hash (+ nbtree in PG) | 9–12 | 40′ | W2 · Lab 02 |
| 3 | Clustered vs secondary vs PG heap+TID; key, PK, unique | 13–21 | 50′ | W3 + slide-15 bug hunt · Labs 03, 04, 07A–C |
| 4 | Composite, covering, other indexes | 22–29 | 55′ | W4 · Labs 05, 06, 07D–G |
| 5 | When to index, 5 failures, best practices | 30–37 | 50′ | W5 · Labs 01B–C, 09, 10 |
| 6 | MySQL≠PG table, recap, IMDb capstone, homework, NestJS | 38–42 | 60′+ | W6 design table · Lab 11 · homework |

Each slide claim that differs on PG gets a warn callout with a 3-state chip: `Đúng trên PG16` / `MySQL đúng, PG khác` / `Cần sửa` (D's 18-row table, incl. slides 10/38 pivot truncation and 6/12/14 LSM/hash notes). Slide-map chips carry a `pg` marker where the claim differs.

## Dataset `lab03_indexing` (`npm run setup`, idempotent, `--force` rebuilds)
- Extensions `pageinspect`, `pgstattuple`, `pg_trgm` installed `SCHEMA lab03_indexing` (relocatable; `npm run reset` drops schema).
- `users` 1M: id bigint PK · code varchar(20)=id::text · email UNIQUE · name first+' '+last (50×50 incl. Jane/Nguyen, len ≥7) with planted `ronin0..9` (1,000 rows, len 6, prefix) and `first||' ronin'` (1,000, suffix) · gender · age 18..77 · country (20 values, VN 40%, US 20%, …, SG 0.5%) · province (10/country, Texas under US) · created_at = 2020-01-01 + g min · deleted_at 5% non-null.
- `orders` 1M: id PK · user_id FK→users uniform 1..1M (≈37% users without orders), **no FK index** · status DELIVERED 90 / CANCELLED 6 / SHIPPING 3 / PROCESSING 1 · total · created_at correlated.
- `t_ab` 1M: id PK · a = h%100 · b = h%1000 · pad.
- Base tables are read-only after setup; write labs use scratch tables `lNN_*`, dropped at start and end (C's rule; also avoids `indcheckxmin`).
- Deterministic generation via `hashint8`, `VACUUM (ANALYZE)` at the end, self-check counts printed.

## Labs (each ≤200 lines, ≤~15 output lines + `=>` verdict lines, `--json` where a widget replays data)
| Lab | Slides | Proves |
|---|---|---|
| 01 when-index-helps | 4, 31 | IMDb ratings thresholds 1e6/1e5/1e4/1e3 (98 / 3,162 / 18,310 / 108,479 rows) with a rolled-back index: index helps only small sets; gender index unused; tiny table → Seq Scan. `--json` for W1 |
| 02 btree-anatomy-and-hash | 8–12, 38 | level/buffers users_pkey vs titles_pkey (5 pages), range vs scattered ids, bt_page_items root vs leaf + right-link, hash = equality only |
| 03 heap-tid-hot-cluster | 14–17 | ctid moves; HOT vs non-HOT (WAL, index growth); full-page fillfactor-100 update not HOT; CLUSTER one-shot + correlation decay |
| 04 write-cost-and-pk-order | 17, 20, 37 | inserts with 1/4/7 indexes; bigint vs UUIDv4 vs time-ordered UUID: size, leaf density, WAL |
| 05 composite-order | 23–27 | slide-25 Q1–Q4 + SG; (country,province,name) vs (name,province,country); t_ab (a,b) vs (b,a), forced runs labelled "ép" |
| 06 covering-index-only | 28, 38 | INCLUDE → Index Only Scan, Heap Fetches 0 → >0 after update → 0 after VACUUM; pivot vs leaf itemlen |
| 07 constraints-and-special | 19, 21, 29, 37 | FK not auto-indexed + delete trigger cost; NULLs in unique / NULLS NOT DISTINCT; partial vs full status index; BRIN vs btree; partial on deleted_at; index row size limit |
| 09 index-failures | 32–36 | LIKE + collation, trgm; OR → BitmapOr; types (error 42883, `id = 10.0`); expression index; arithmetic. `--json` for W5 |
| 10 bloat-reindex | 37 | delete 90% → size same, density low, level same; REINDEX CONCURRENTLY |
| 11 imdb-lesson2-revisited | lesson 2 | V0 with parallel (≈149 ms shape) and without (643 ms, 18,310 loops); V1 ratings(num_votes); V2 ordered partial ratings index; V3 covering partial titles index (start_year) INCLUDE (tconst, primary_title) WHERE movie; each BEGIN…ROLLBACK; assert lab_imdb untouched; `--skip-titles` flag |
(No lab 08: its selectivity sweep merged into lab 01.)

## Widgets
W1 page/height + selectivity calculator (lab 01 data) · W2 B+tree stepper (seq vs random inserts, search path, range walk) · W3 lookup path InnoDB vs PG + clickable slide-15 bug hunt · W4 composite explorer (seek / in-index filter / unused, PG16 vs PG18/MySQL skip scan) · W5 index-failure doctor (lab 09 lines) · W6 index-design table for the lesson-2 query (before lab 11).

## Homework (slide 41) — on `hw_contracts` (500k, contracts domain)
A. `npm run homework:setup` + fill a dataset card. B. Verify 3 theories (T1 slide 26 order/cardinality, T2 slide 28 covering, T3 slide 31 rare vs common status): learner edits `homework-theories.mine.mjs` predictions (runner refuses `???`), `npm run homework` measures. C. Review the AI-written experiment `homework-ai-draft.mjs` (flaws: cold-vs-warm ms, ms instead of buffers, `SELECT *` without VACUUM, only the 60% status value) → fill flaw table. Solution: `npm run homework:solution`. Migration-review drill (5 bugs) lives in the NestJS section, answers folded.

## Phases & gates
1. Kit (done) + setup + check → run twice, counts match. 2. Labs 01–11 serially, outputs verbatim into `lab-runs.md`; ✘ lines rewrite the narrative, never the data. 3. Homework (+ negative test of `???` refusal). 4. Guide HTML from `lab-runs.md` only. 5. Ultra code review (5 reviewers + verifier union), fix Critical/Important. 6. Verify: slide map 1–42 + hrefs, quiz indices, terminal numbers ⊂ lab-runs, offline, light/dark, 360 px harness, console clean, secrets grep, lab_imdb untouched, lesson-2 lab 6 unchanged.

## Delivery record (2026-10-20)
- Guide `reports/lesson_03_index_teacher_guide.html`: 6 stages, 6 widgets + slide-15 bug hunt, 26 quiz questions (6 quizzes), 10-question exam, cheat sheet, 42-slide map; 23 terminal blocks pasted verbatim from `lab-runs/` (only the PowerShell setup commands are not lab output).
- Labs `labs/lesson-03-index/`: setup + check, labs 01–07, 09–11 (no 08), homework kit; final serial run recorded in `lab-runs/*.txt` + `runtimes.json`.
- Ultra code review: 5 reviewers → union of 37 items → verifier confirmed 0 Critical / 12 Important / 25 Minor (`review-union.md`, `review-verdicts.md`). All 12 Important fixed; 23/25 Minor fixed. Left by choice: `npm run reset` still drops the three extensions installed in the lesson schema (#20), and lab 02 still drops `users_email_key` inside its rolled-back transaction, which locks `users` for ~0.5 s (#28).
- Deviations: lab 08 merged into lab 01; lab 04 uses an md5-derived v4 UUID for determinism; lab 07 split into part-a/part-b behind one entry file; stage-6 quiz added after review; git/GitHub pipeline steps skipped (workspace is not a repo).

## Verified fixes from the verifier
titles PK lookup = 5 pages (not 4) · do not promise every IMDb variant beats 149 ms · ratings-side covering cannot be a large gain · ≈1.1% of ratings match ≥10k · SHARE lock blocks writers only.
