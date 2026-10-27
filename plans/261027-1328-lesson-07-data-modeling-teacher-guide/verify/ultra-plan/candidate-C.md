=== FILE: plan.md ===
---
title: "Lesson 07 Data Modeling teacher guide (DBX-first, measured on PG 16)"
description: "Single-file Vietnamese teacher guide for all 43 slides plus 1NF-3NF, polymorphic and a double-entry ledger capstone, every number from a recorded PG 16 run"
status: pending
priority: P1
effort: 8.75h
branch: main
tags: [lesson-07, data-modeling, teacher-guide, postgresql, dbx, ledger, tdd]
blockedBy: []
blocks: []
created: 2026-10-27
---

# Lesson 07 · Data Modeling teacher guide

## Overview

Build `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`, a self-contained Vietnamese guide on the lesson-14 single-column shell (no rail), covering slides 1–43 plus normal forms, polymorphic association and a double-entry ledger capstone. Every experiment is a plain SQL file under `D:/study/advance-be/labs/lesson-07-data-modeling/` that Đạt runs in DBX (`Ctrl+A → Run`; two-tab files use `ADVANCE_BE_LAB` + `ADVANCE_BE_LAB_B` with `Tx: [M]`). The controller runs the same files through `docker exec … psql`, stores verbatim output in `labs/lesson-07-data-modeling/runs/`, and the guide shows only numbers that appear in those files. Tests come first: `check.sql`, the expected-result matrix (`verify/expected-results.json`) and `verify/verify-guide.mjs` (with a self-test of its own negative cases) exist before setup, experiments and HTML. Done means: verifier green, render-check clean at 375/768/1440 in light and dark, ultra code review findings fixed, README and course overview updated, handoff written, nothing committed.

Path aliases used below: **P** = `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide`, **L** = `D:/study/advance-be/labs/lesson-07-data-modeling`, **G** = the guide path above.

## Stage map (study day: core 295 min, optional 95 min)

| Stage | Slides / topic | Min | Experiments (L/*.sql) | Widget |
|---|---|---|---|---|
| 0 Cách học | 1–2; setup, check, DBX tabs | 10 | `00-setup.sql`, `check.sql` | — |
| 1 Quy trình, ERD, loại bảng, cột tham chiếu | 3–8, 12 | 15 | e01 | W1 ERD explorer (inline SVG) |
| 2 Chuẩn hóa 1NF→3NF, phi chuẩn hóa | 9–10 + NF block | 35 | e02 | W2 normalization stepper |
| 3 Khóa ngoại và polymorphic | 11 + polymorphic block | 35 (+10 opt: variant C) | e03, e04 (2 tabs), e05 | W3 race timeline FK on/off; static SVG of 3 polymorphic shapes |
| 4 Định dạng bảng, DDL online, template | 13–20 | 35 (+10 opt: CONCURRENTLY by hand) | e06, e07, e08 (+ e08 2 tabs), e09 | W4 DDL safety board |
| 5 Kiểu dữ liệu | 21–25 | 30 | e10, e11, e12, e13 | W5 type picker |
| 6 Case studies + recap | 26–34 | 40 (+20 opt: 31, 33) | e14, e15, e16, e17, e18, e19 | W6 float bisection, W7 availability calendar |
| 7 View | 38–43 | 15 (+10 opt: updatable) | e20 | static SVG MERGE/TEMPTABLE vs PG inlining |
| 8 Capstone sổ cái kép | ledger block | 55 | e21, e22, e23, e24 (2 tabs) | W8 ledger posting simulator + reconciliation + lock order |
| Prisma drill, phỏng vấn, cheat sheet | — | 25 | drill files | — |
| Bài tập slide 35 (tối) | 35 | opt 45 | `hw-check.sql`, `hw-solution.sql` | — |
| Bản đồ slide, tham khảo, tiếp theo | 36–37 | 5 | — | slide map chips |

Every one of slides 1–43 maps to an anchor (full map in `SLIDES`, phase 05). Slide 38 is a blank divider and maps to stage 7.

## Phases

| # | Name | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | Contract, baselines, verifier first | 45m | — | `verify-guide.mjs --self-test` passes 12/12 mutations; fingerprint-before recorded |
| 02 | Lab setup and check.sql | 45m | 01 | setup run twice, `check.sql` 0 ✘ both times, sources unchanged |
| 03 | Experiments stages 1–4 (e01–e09) recorded | 75m | 02 | runs exist, `--expect` has no unexplained contradiction, `check.sql` 0 ✘ after each |
| 04 | Experiments stages 5–8 (e10–e24), homework check, stress | 105m | 03 | same as 03 + hw-check negative test + stress invariants |
| 05 | Shell, stage fragments, Prisma drill (parallel) | 120m (≈45m on critical path) | 01 (shell, Prisma), 03 (D1, D2), 04 (D3, D4) | each fragment passes `verify-guide.mjs --fragment` |
| 06 | Assemble, verify, render-check | 45m | 05 | verifier 0 failures; render-check clean 375/768/1440 light+dark |
| 07 | Ultra code review and fixes | 60m | 06 | no open Critical/Important; 06 gate re-passed |
| 08 | Docs, final gate, handoff | 30m | 07 | final gate checklist all ✔; `git status` shows only expected paths |

## Expected-result matrix (written in phase 01 as `P/verify/expected-results.json`)

Chip legend: OK = `Đúng trên PG16`, DIFF = `MySQL đúng, PG khác`, FIX = `Cần sửa`. Values in quotes are predicates on keys in `L/runs/widget-data.json` or patterns in `L/runs/eNN.txt`.

| Exp | Slide claim | Expected PG 16 result | Chip |
|---|---|---|---|
| e01 | 5, 7, 8: entity/relation/support/config tables | catalog query lists ≥1 table per type from `COMMENT ON TABLE` | 5, 7, 8 OK |
| e01 | 12: later entity holds the reference | `payment_txns.order_id UNIQUE NULL`: 3 donate rows with NULL accepted; 2nd payment same order → `23505` | 12 OK |
| e02 | 9: normalization removes anomalies | flat sheet: rename one line of a product → `productsWithTwoNames ≥ 1`; new product without order → `23502`; delete the only order of a one-order customer → customer gone (`lostCustomers ≥ 1`); decomposition lossless (`EXCEPT` both ways = 0 rows) | 9 OK |
| e02 | 10: denormalization reads faster, costs space | flat total size > sum of 5 normalized tables; join plan has ≥ 3 join nodes vs 1 scan | 10 OK |
| e03 | 11: FK check costs on insert | 500k inserts with FK slower than without (`fkMs > noFkMs`); no index created on FK column (`fkIndexCount = 0`); `EXPLAIN ANALYZE DELETE` of 20 parents shows RI trigger time far larger without child index than with it | 11 FIX (cost real, removal wrong) |
| e04 | 11: "check in app" | no-FK race commits 1 orphan (`orphans = 1`); FK variant: late insert → `23503`; parent DELETE waits on child's `FOR KEY SHARE` then `23503` | 11 FIX |
| e05 | polymorphic | `type+id` leaves `orphanComments > 0` after parent delete; exclusive arc rejects both-null and both-set with `23514`; parent delete with comments → `23503`; per-parent join tables keep FK | — |
| e06 | 14: ADD COLUMN locks/downtime | `note text` and `version int NOT NULL DEFAULT 0`: filenode unchanged, ms < 50; `DEFAULT random()`: filenode changed, ms > 200; `numeric(12,2)→(14,2)` no rewrite; all hold `AccessExclusiveLock` in `pg_locks` | 14 DIFF |
| e07 | 15: JSON column | `json` keeps duplicate key and whitespace, `jsonb` normalizes; `jsonb` returned for `->` | 15 OK |
| e07 | 16: cannot index JSON | Seq Scan before; expression btree on `(attrs->>'brand')` → Index/Bitmap scan; GIN `jsonb_path_ops` + `@>` → Bitmap Index Scan | 16 DIFF |
| e06+e07 | 17: spare columns | fast ADD COLUMN makes spare columns unnecessary; STORED generated column rewrites (filenode changed) | 17 FIX |
| e08 | 18: ADD INDEX locks table | plain `CREATE INDEX` in tx holds `ShareLock`; tab B INSERT with `lock_timeout 1s` → `55P03`; `CONCURRENTLY` holds `ShareUpdateExclusiveLock`, B INSERT succeeds, CIC waits on an open writer (`virtualxid`); CIC UNIQUE on duplicates → `23505` and `indisvalid = false` | 18 DIFF |
| e09 | 19–20: template columns | plain UPDATE leaves `updated_at` unchanged without trigger; with `BEFORE UPDATE` trigger it changes; `version` increments | 19, 20 OK |
| e10 | 22: varchar vs text | `pg_column_size` text = varchar(255) = 12 for `'xin chao'`; 3,000 chars = 3,004; 256 chars into varchar(255) → `22001`; btree on ~3,200 random hex chars → `54000`; `ORDER BY text_col LIMIT 10` uses Index Scan | 22 DIFF |
| e11 | 23: integers, money | 2/4/8 bytes; `int(1)` → syntax error (code recorded); `0.1+0.2=0.3` false for float8, true for numeric; 1M-row float sum `100000.00000133288` vs `100000.0`; northwind `real` revenue ≠ numeric revenue; `numeric(12,2)` overflow `22003` | 23 OK |
| e12 | 24: timestamp vs datetime | timestamptz = timestamp = 8 bytes, date 4; year 2040 and 3000 accepted; same instant shows `09:00+07` vs `02:00+00`; `timestamp` column stores different wall times from two `TimeZone` settings | 24 DIFF |
| e13 | 25: avoid NULL | 100k rows: all-NULL column table not larger than NOT NULL int table; `NOT IN` with a NULL returns 0 rows, `NOT EXISTS` correct; `IS NULL` uses index; 2 NULLs pass UNIQUE, `NULLS NOT DISTINCT` → `23505` | 25 DIFF |
| e14 | 27: translation JSON | new language = UPDATE, no DDL; fallback `COALESCE(t->>'fr', t->>'en')`; `CHECK (t ? 'en')` rejects missing default → `23514`; typo key `'vn'` accepted (JSON has no schema) | 27 OK, 34 FIX |
| e15 | 28: float ordering | bisection between 1000 and 2000: float8 `53`, float4 `24`; numeric > 200 steps with growing scale; one window UPDATE restores gaps of 1000 | 28 FIX |
| e16 | 29–30: availability rows | 3 homestays × 365 = 1,095 rows; 3-night booking via conditional UPDATE → 3 rows, overlapping retry → < 3 rows, rolled back; exclusion constraint (`btree_gist`) on `daterange` → `23P01` | 29, 30 OK |
| e17 | 31: time slots | weekly 09:00 America/New_York slots keep local 09:00 while UTC moves 13:00 → 14:00 after 2026-11-01; Asia/Ho_Chi_Minh slots do not move; week query uses index on UTC instant | 31 OK |
| e18 | 32: tags array + inverted index | `tags @> '{sql}'` → Bitmap Index Scan on GIN; join table → Index (Only) Scan on `(tag_id, post_id)`; typo tag accepted by array, rejected by join table FK `23503` | 32 OK |
| e19 | 33: report counting | exact `count(*)` ms recorded; `reltuples` estimate within 5% after ANALYZE; MV query < exact; MV stale after insert until REFRESH; `REFRESH … CONCURRENTLY` without unique index → `55000`; no HLL extension available (0 rows) | 33 OK |
| e20 | 40–43: views | `EXPLAIN` of view filter → Index Scan on `northwind.pk_orders`, no view node; filter on group key pushed below aggregate; filter on aggregate result → full aggregate then Filter; simple view UPDATE → `UPDATE 1`; aggregate view UPDATE → `55000`; PG has MATERIALIZED VIEW (e19) | 40, 41, 42 DIFF; 43 OK |
| e21 | ledger posting | each transfer sums to 0; global sum 0; cached = derived for both wallets | — |
| e22 | ledger guards | one-leg transfer fails at COMMIT with `23514` from deferred trigger; overdraft → 0 rows then `23514`; UPDATE/DELETE of an entry rejected; duplicate `reference` → `23505` | — |
| e23 | cached vs derived balance | derived SUM on hot wallet (≈80k entries) ms ≫ cached read ms; injected drift found by reconciliation (1 row), fixed, then 0 rows | — |
| e24 | posting with lesson-14 locks | unordered two tabs → exactly one `40P01`; `ORDER BY id FOR UPDATE` → B waits, 0 `40P01`; stress (controller): ordered 8×250 transfers → 0 deadlocks, invariants hold | — |
| hw | 35: homework | `hw-check.sql` all ✔ on `hws_` solution, ≥ 4 ✘ on `hwb_` broken draft | — |

## Acceptance criteria

1. Guide covers slides 1–43, each in `SLIDES` exactly once with a resolving anchor; chips match the matrix (06).
2. Normal forms, polymorphic and ledger blocks each have a walkthrough, a challenge with acceptance criteria and a quiz (05, 06).
3. Every learner SQL file starts with `SET search_path = lab07_modeling;` plus `statement_timeout` and `lock_timeout`, contains no psql meta-commands, and writes only `lab07_modeling` (lint in 06).
4. `00-setup.sql` is idempotent: two consecutive runs then `check.sql` give 0 ✘ (02, 08).
5. Source fingerprints for `northwind` and `lab03_indexing.hw_contracts` are identical before phase 02 and at the final gate; no new objects outside `lab07_modeling` (02, 08).
6. Every snippet in G equals its `.sql` file byte-for-byte after newline normalization (06).
7. Every `b.m[data-run]` value and every embedded JSON leaf appears in the named run file; every run block carries the run date from the run header (06).
8. Every matrix row is MATCH, or is listed in `P/verify/contradictions.md` with the narrative changed and data untouched (03, 04, 06).
9. Storage keys only `l07-*`; no external scripts; fonts only from Google Fonts; no connection URL or password (06).
10. Render-check at 375/768/1440, light and dark: 0 runtime errors, 0 horizontal overflow, touch targets ≥ 44 px (06).
11. G ≤ 320 KB; no npm dependency or build step for the learner (06).
12. Ultra code review run; all Critical/Important fixed and re-verified (07).
13. README and `TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 07 point to G and L; handoff note exists (08).
14. No branch, worktree, commit, push, PR or issue; `git status` lists only the expected new/modified paths (08).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| DBX shows only some result grids for multi-statement files | M×H | Each file ends with its key SELECT; check in 02 via DBX MCP that `00-setup.sql` and `check.sql` run whole; split into labelled blocks if not |
| Two-tab timing flaky in recording | M×M | Steps scheduled with `pg_sleep_until(t0 + k × 1.5 s)`; rerun at most twice; keep the first consistent run, never edit |
| Measurement contradicts the expected result | M×M | `--expect` flags it; narrative and chip change, row logged in `contradictions.md` |
| Learner works in `lab14_locking` tonight | M×L | lab14 fingerprint informational only; strict for northwind and lab03 |
| Build runs past midnight | H×M | Pipeline: D1/D2 fragments start after 03 while 04 runs; stages ordered as studied |
| Disk growth from 500k-row copies and 1M clicks | L×M | Scratch tables `eNN_*` recreated per run; final gate re-runs setup (drops schema) |

Rollback: everything is new files plus schema `lab07_modeling`. Revert = delete G, L, P build/verify artefacts and `DROP SCHEMA lab07_modeling CASCADE`. README and course overview are copied to `P/verify/docs-before/` before editing and restored from there if needed.

## Open questions for the user

None block the build. One non-blocking choice is defaulted: homework tables live in `lab07_modeling` with prefix `hw_`, so re-running `00-setup.sql` deletes them; the guide tells Đạt to keep his DDL in `L/hw-mine.sql`.

=== FILE: phase-01-contract-baseline-verifier.md ===
---
phase: 1
title: "Contract, baselines, verifier first"
status: pending
priority: P1
effort: 45m
dependencies: []
---

# Phase 01 · Contract, baselines, verifier first

## Goal
Freeze every interface the later phases and delegates rely on, record the source fingerprint, and write the verifier and expected results before any lab SQL or HTML exists.

## Files to create/modify (owner: controller)
- `P/contract.md`
- `P/verify/expected-results.json`
- `P/verify/verify-guide.mjs` (Node built-ins only, controller-only, never mentioned in G)
- `P/verify/source-fingerprint.sql` (read-only)
- `P/verify/fingerprint-before.txt`

## Tasks and steps
1. Write `contract.md` with these frozen sections:
   - **Schema contract**: tables built by `00-setup.sql` with columns and constraints: `run_log`, `mark(exp, step)`; `currencies`, `provinces` (config); `shop_orders`, `payment_txns` (slide 12); `nf_order_sheet` (2,155 rows from northwind, money cast to `numeric(10,2)`), `nf_orders_0nf`; `race_stores`, `race_orders_nofk`, `race_orders_fk`; `poly_posts`, `poly_products`; `homestays`, `homestay_availability` (PK `homestay_id, day`), `homestay_bookings` (`EXCLUDE USING gist (homestay_id WITH =, stay WITH &&)`); `wallets` (`kind` user|store|system, `balance numeric(14,2)`, `CHECK (kind = 'system' OR balance >= 0)`, `version`, template columns), `transfers` (`reference text UNIQUE`), `ledger_entries` (`amount numeric(14,2) CHECK (amount <> 0)`, index `(wallet_id) INCLUDE (amount)`, index `(transfer_id)`), deferred constraint trigger `ledger_balanced` (raises `23514` when a transfer's sum ≠ 0), trigger `ledger_append_only`, function `post_transfer(from, to, amount, ref)` locking `ORDER BY id FOR UPDATE`. Seed: 300 store wallets `MAYCHA-001..300`, 1 bank (system), 1 fee wallet, 100k transfers with `hashint4`-based deterministic spread (store 1 receives ≈40%), triggers created after the seed.
   - **Learner SQL header**: first lines `SET search_path = lab07_modeling;`, `SET statement_timeout = '60s';` (setup `'5min'`), `SET lock_timeout = '5s';`, two-tab files add `SET idle_in_transaction_session_timeout = '5min';` and `SET application_name = 'l07-A'|'l07-B';`. Plain SQL only (no `\` commands). Sources are always schema-qualified and only read. Each experiment drops and recreates its own `eNN_*` scratch tables at its start and leaves `check.sql` green.
   - **Two-tab format**: blocks `-- @A <k> <mô tả>` / `-- @B <k> <mô tả>`, step numbers global and increasing.
   - **Run files**: `L/runs/eNN.txt` (psql `-a` output) with a 3-line header `-- chạy: <file> · <YYYY-MM-DD HH:MM> +07 · PostgreSQL 16.15`; two-tab runs add `eNN-A.txt`, `eNN-B.txt`, `eNN-timeline.txt`; `L/runs/widget-data.json` keyed by run id.
   - **Fragment format**: `P/build/fragments/stage-N.html` = one `<section id="chang-N" class="stage col">`; snippets as `<pre data-snippet="e06"></pre>` or `data-snippet="e04#3"`; outputs as `<pre data-run-file="e06.txt" data-lines="a-b"></pre>` preceded by `.run-label` "Kết quả đã chạy trên máy bạn ngày DD/MM/YYYY"; inline numbers `<b class="m" data-run="e06">758</b>`; widgets `id="wN"` with children `wN-*`; quiz `<div class="quiz" data-quiz="N">`; storage keys `l07-cN-*`. JS fragment `stage-N.js` defines `QUIZ[N]` (4 questions) and `function initWN()` using only core helpers `$`, `$$`, `esc`, `store`, `run`, `press`.
   - **CSS vocabulary**: lesson-14 classes plus `.erd`, `.nf-step`, `.cal`, `.cal-day`, `.taccount`, `.bisect` (defined by controller only).
   - **Run ids and widget keys**: `e01` (tables by type), `e02` (anomaly counts, sizes), `e04` (timeline both variants), `e06`+`e08` (ms, filenode changed, lock mode), `e10`–`e13` (type facts), `e15` (steps per type), `e16` (calendar days, booking outcomes), `e21`/`e23`/`e24` (+`stress`).
2. Write `expected-results.json` from the plan matrix: one predicate per key (`eq`, `gt`, `lt`, `between`, `match` regex on run text).
3. Write `verify-guide.mjs` with modes `--fragment <file>`, `--guide`, `--lint-sql`, `--expect`, `--self-test`. `--guide` checks acceptance criteria 1, 3, 6, 7, 9 and 11 mechanically: unique ids, resolving anchors and image paths, no `<script src>`, font hosts only, `l07-` keys and `l07-theme`, `SLIDES` 1..43 once each with allowed chips, `QUIZ[1..8]` ≥ 4, `EXAM` = 10, snippet equality (HTML-unescaped, LF-normalized), run excerpts found in order, `b.m` values found in their run file, embedded JSON deep-equal to `widget-data.json`, run-label date = run header date, no `postgres://`/`password=`, size ≤ 320 KB. `--lint-sql`: header present, no `\` meta-commands, no DDL/DML naming a source schema (`northwind.`, `lab03_indexing.`, `lab12_transaction.`, `lab14_locking.`, `lab_imdb.`, `public.`), no `CREATE ROLE`, `ALTER DATABASE`, `ALTER SYSTEM`, `GRANT`.
4. `--self-test` builds a tiny valid fixture in memory, then applies 12 mutations (one snippet char changed, `l14-` key, slide 27 removed, `b.m` value absent from run, external script, JSON leaf changed, run-label date wrong, broken anchor, missing image, `postgres://` string, lint: `UPDATE northwind.orders`, lint: missing `SET search_path`) and asserts each fails.
5. Write `source-fingerprint.sql`: counts for northwind 8 tables (91/830/2155/77/8/29/9/6), `hw_contracts` count/`sum(id)`/`sum(total)`, `md5(string_agg(...))` over northwind `orders` and `order_details` ordered by key, object counts per source schema, `n_tup_ins+n_tup_upd+n_tup_del` per source schema. Run it into `fingerprint-before.txt`.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| Verifier self-test | 12/12 mutations rejected, exit 0 | `node P/verify/verify-guide.mjs --self-test` |
| Verifier on missing guide | non-zero exit, "guide not found" | `node P/verify/verify-guide.mjs --guide` |
| Lint on empty lab folder | non-zero exit, "no SQL files" | `node P/verify/verify-guide.mjs --lint-sql` |
| Fingerprint is read-only | output has counts 91/830/2155/77/8/29/9/6 and 500000 | see Verification |

## Verification
```bash
export MSYS_NO_PATHCONV=1
P="D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide"
docker exec -i -e PGCLIENTENCODING=UTF8 quan-ly-hop-dong-postgres-1 psql -X -At -U postgres -d advance_be_lab \
  -v ON_ERROR_STOP=1 < "$P/verify/source-fingerprint.sql" > "$P/verify/fingerprint-before.txt"
node "$P/verify/verify-guide.mjs" --self-test
```

## Risks and rollback
Verifier too strict for legitimate HTML (for example entity-escaped snippets): the snippet comparison HTML-unescapes before comparing; self-test fixture covers `&lt;`. Rollback: delete `P/contract.md` and `P/verify/*`; nothing touched the database.

=== FILE: phase-02-lab-setup-and-check.md ===
---
phase: 2
title: "Lab setup and check.sql"
status: pending
priority: P1
effort: 45m
dependencies: [1]
---

# Phase 02 · Lab setup and check.sql

## Goal
An idempotent `00-setup.sql` that builds `lab07_modeling` from read-only sources in under 30 s, and a `check.sql` written first that returns one ✔/✘ row per invariant.

## Files to create/modify (owner: controller)
- `L/check.sql` (written first)
- `L/00-setup.sql`
- `P/verify/check-negative.sql` (controller-only, all inside `BEGIN … ROLLBACK`)
- `P/build/record.sh <id>` (controller-only): writes the run header, runs `psql -X -a -v ON_ERROR_STOP=0 -v VERBOSITY=verbose` (SQLSTATE printed with every error) into `L/runs/<id>.txt`, then runs `check.sql` and exits non-zero on any ✘
- `L/runs/setup.txt`, `L/runs/check.txt`

## Tasks and steps
1. Write `check.sql`: one `SELECT ma, trang_thai, chi_tiet` per check joined with `UNION ALL`, `trang_thai` = `'✔'`/`'✘'`. Checks: K1 schema exists; K2 `btree_gist` installed in `lab07_modeling`; K3 source counts (91/830/2155/77/8/29/9/6, 500000); K4 `nf_order_sheet` = 2,155 and equals the northwind join count; K5 availability 1,095 rows, 365 distinct days per homestay; K6 exclusion constraint present; K7 every transfer sums to 0; K8 global sum = 0; K9 cached balance = derived for every wallet; K10 no non-system wallet negative; K11 deferred trigger `ledger_balanced` deferrable and `ledger_append_only` present; K12 one payment per order (unique constraint present); K13 no other session `l07-%` idle in transaction.
2. Run `check.sql` before setup: expected error `42P01` (relation missing). This is the red state.
3. Write `00-setup.sql` per contract: guard `DO` block asserts `current_database() = 'advance_be_lab'` and `server_version_num >= 160000`; `SET max_parallel_workers_per_gather = 0`; `DROP SCHEMA IF EXISTS lab07_modeling CASCADE; CREATE SCHEMA lab07_modeling; CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA lab07_modeling;` then tables, `COMMENT ON TABLE` with type labels (`entity|relation|support|config`), seed, `ANALYZE`, triggers, and a final summary SELECT (the "thẻ dữ liệu" shown in stage 0). Vietnamese comments, one short comment per block.
4. Run setup once plainly, then a second time through `record.sh setup` (header + `runs/setup.txt`), then `record.sh check`.
5. Write `check-negative.sql`: inside one transaction, `SET LOCAL session_replication_role = replica`, insert a one-leg entry → expect K7/K8 ✘; `UPDATE wallets SET balance = balance + 1 WHERE id = 2` → K9 ✘; delete one availability row → K5 ✘; `ROLLBACK`; then re-run check → 0 ✘.
6. Confirm DBX behaviour once through the DBX MCP tools: run `check.sql` as a whole script on `ADVANCE_BE_LAB` and confirm the final grid is visible. If only the last statement shows, keep check as one statement (it already is) and mark setup's summary as the last statement.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| check before setup | error `42P01` | run `check.sql` |
| setup run 1 / run 2 | exit 0, < 30 s each | `00-setup.sql` with `ON_ERROR_STOP=1` |
| check after each setup | 13 rows, 0 ✘ | `grep -c '✘'` = 0 |
| negative injections | K5, K7, K8, K9 ✘ inside tx; 0 ✘ after rollback | `check-negative.sql` |
| sources untouched | fingerprint diff empty except lab14 informational lines | `diff` |
| lint | setup and check pass header/no-meta/no-foreign-write | `--lint-sql` |

## Verification
```bash
L="D:/study/advance-be/labs/lesson-07-data-modeling"; P="D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide"
PSQL="docker exec -i -e PGCLIENTENCODING=UTF8 quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab"
$PSQL -v ON_ERROR_STOP=1 < "$L/00-setup.sql" && bash "$P/build/record.sh" setup && bash "$P/build/record.sh" check
grep -c '✘' "$L/runs/check.txt"                                              # expect 0
$PSQL -At < "$P/verify/check-negative.sql" | grep -E 'K5|K7|K8|K9'         # expect ✘ rows, then final 0 ✘
$PSQL -At < "$P/verify/source-fingerprint.sql" | diff "$P/verify/fingerprint-before.txt" -
```

## Risks and rollback
Deferred trigger slows the 200k-entry seed: triggers are created after the seed, and K7 proves the seed balanced. `DROP SCHEMA … CASCADE` also drops the extension living in it, which is intended. Rollback: `DROP SCHEMA lab07_modeling CASCADE;` and delete the two SQL files.

=== FILE: phase-03-experiments-stages-1-4.md ===
---
phase: 3
title: "Experiments stages 1-4 recorded (e01-e09)"
status: pending
priority: P1
effort: 75m
dependencies: [2]
---

# Phase 03 · Experiments e01–e09

## Goal
Author, run and record the experiments for stages 1–4, and the recorder scripts, so delegates D1 and D2 can write fragments from frozen run files.

## Files to create/modify (owner: controller; DB runs serial)
- `P/build/two-tabs.mjs` (splits `@A/@B` blocks, emits paced scripts in `P/build/tmp/`, merges timeline); `record.sh` gains a `--two-tabs` mode
- `L/e01-table-types-and-reference.sql`, `L/e02-normal-forms.sql`, `L/e03-fk-cost-and-index.sql`, `L/e04-fk-race-two-tabs.sql`, `L/e05-polymorphic.sql`, `L/e06-add-column.sql`, `L/e07-jsonb-and-indexes.sql`, `L/e08-create-index-locks.sql`, `L/e08-create-index-two-tabs.sql`, `L/e09-table-template.sql`
- `L/runs/e01.txt` … `e09.txt`, `e04-A.txt`, `e04-B.txt`, `e04-timeline.txt`, `e08tt-A.txt`, `e08tt-B.txt`, `e08tt-timeline.txt`, `L/runs/widget-data.json` (keys e01, e02, e04, e06, e08)
- `P/verify/contradictions.md` (only if needed)

## Tasks and steps
1. `two-tabs.mjs <file>`: for each block emits `SELECT pg_sleep_until(:'t0'::timestamptz + interval '1.5 s' * k);` and a marker row `(tab, step, clock_timestamp())` before the verbatim block text; `record.sh` starts both psql processes in the background with `application_name` `l07-A`/`l07-B`, waits for both, then asserts zero `l07-%` sessions remain (terminating only those by `application_name`).
2. Each file implements its matrix row(s) and ends with its key SELECT. Details not obvious from the matrix:
   - e02 shows anomalies on the flat sheet inside `BEGIN … ROLLBACK`, then builds `nf_customers`, `nf_categories`, `nf_products`, `nf_orders`, `nf_order_lines` with PK/FK and checks losslessness with `EXCEPT` both ways.
   - e03 times 500k inserts into `e03_child_nofk` and `e03_child_fk` with `mark()`, runs `EXPLAIN (ANALYZE) DELETE` of 20 unreferenced parents inside `BEGIN … ROLLBACK` before and after `CREATE INDEX`, and shows (read-only) that `northwind.orders.customer_id` has an FK but no index.
   - e04 (two tabs), step 0 resets tables. Variant 1 (no FK): A checks store 7 exists, B deletes it, A inserts and commits, orphan count 1. Variant 2 (FK): same steps, A gets `23503`. Variant 3: A inserts first (holds `FOR KEY SHARE`), B's DELETE waits, A commits, B gets `23503`.
   - e06 copies `lab03_indexing.hw_contracts` into `e06_contracts` and wraps each ALTER with `pg_relation_filenode` and `mark()`; lock mode read from `pg_locks` inside `BEGIN … ROLLBACK`.
   - e08 two tabs: A `BEGIN; CREATE INDEX …` holds; B `SET lock_timeout = '1s'; INSERT` gets `55P03`; A rolls back. Then B opens a writer tx, A runs `CREATE INDEX CONCURRENTLY` and waits (`virtualxid`), B's next INSERT succeeds, B commits, A finishes.
3. After each run: `--expect` for that run's keys; any contradiction → change the narrative plan and log it; never edit run files.
4. Hand-write `widget-data.json` entries from run text; `--expect` and `--guide` later verify each leaf appears in the run file.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| matrix rows e01–e09 written before SQL | present in `expected-results.json` | `--expect` lists 9 runs as "pending" before runs |
| each file rerun twice | identical row counts, no new errors | `record.sh eNN` twice, compare non-timing lines |
| check after each run | 0 ✘ | inside `record.sh` |
| lint | all pass | `--lint-sql` |
| expectations | MATCH or logged contradiction | `--expect e01..e09` |
| no leftover sessions | 0 `l07-%` rows | `pg_stat_activity` query in `record.sh` |
| fingerprint | unchanged | `diff` as in phase 02 |

## Verification
```bash
P="D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide"
for e in e01 e02 e03 e05 e06 e07 e08 e09; do bash "$P/build/record.sh" $e || break; done
bash "$P/build/record.sh" e04 --two-tabs && bash "$P/build/record.sh" e08tt --two-tabs
node "$P/verify/verify-guide.mjs" --lint-sql && node "$P/verify/verify-guide.mjs" --expect e01 e02 e03 e04 e05 e06 e07 e08 e09
```

## Risks and rollback
e03 inserts 1M rows (≈10 s plus FK cost), inside `statement_timeout 60s`. CIC waits are bounded by `statement_timeout`, and B commits at a scheduled step. Rollback: delete the files, re-run `00-setup.sql`.

=== FILE: phase-04-experiments-stages-5-8.md ===
---
phase: 4
title: "Experiments stages 5-8 recorded (e10-e24), homework check, stress"
status: pending
priority: P1
effort: 105m
dependencies: [3]
---

# Phase 04 · Experiments e10–e24, homework, stress

## Goal
Record stages 5–8 evidence, the homework self-check with its negative test, and a concurrency stress run that proves the ledger invariants under load.

## Files to create/modify (owner: controller; DB runs serial)
- `L/e10-strings.sql`, `L/e11-numbers-money.sql`, `L/e12-time.sql`, `L/e13-null.sql`, `L/e14-i18n-json.sql`, `L/e15-ordering.sql`, `L/e16-availability.sql`, `L/e17-calendar-slots.sql`, `L/e18-tags.sql`, `L/e19-report-counting.sql`, `L/e20-views.sql`, `L/e21-ledger-posting.sql`, `L/e22-ledger-guards.sql`, `L/e23-ledger-reconcile.sql`, `L/e24-ledger-two-tabs.sql`
- `L/hw-check.sql`, `L/hw-solution.sql` (prefix `hws_`), `P/verify/hw-bad.sql` (prefix `hwb_`, controller-only)
- `P/build/stress/worker.sql`, `P/build/stress/unordered.sql` (controller-only)
- `L/runs/e10.txt` … `e24-timeline.txt`, `hw-check-solution.txt`, `hw-check-bad.txt`, `stress.txt`; extend `L/runs/widget-data.json`

## Tasks and steps
1. Each file implements its matrix row(s); details not obvious from the matrix:
   - e11 reads northwind `order_details.unit_price` (type `real`, checked 2026-10-27) to compare `real` and `numeric` revenue, read-only.
   - e15 uses a recursive CTE (no plpgsql) that stops when the midpoint equals a bound; numeric stops at 200 steps; rebalance is one window `UPDATE … row_number() * 1000`.
   - e17 stores `begin_local timestamp` + `tz text` + generated `begin_utc timestamptz`, 8 weekly slots across 2026-11-01.
   - e20 creates views in `lab07_modeling` over `northwind` (read-only) and runs the updatable-view test on `e20_orders_copy`. The slide-43 "security layer" is shown with `information_schema.view_column_usage`; the role `GRANT` is shown as text only, not run (roles are cluster-wide objects).
   - e21 posts inline first (`BEGIN; SELECT … ORDER BY id FOR UPDATE; conditional UPDATE; INSERT transfer; INSERT 2 entries; COMMIT;`), then through `post_transfer`.
   - e23 injects drift inside `BEGIN … ROLLBACK`, so the reconciliation shows 1 row inside the transaction and 0 rows after.
2. Homework: `hw-check.sql` reads its table pattern from the first CTE (`'hw\_%'`; Đạt changes it to `'hws\_%'` to grade the solution). Checks per table: PK; `status`, `version`, `created_at`/`updated_at timestamptz`; no `real`/`double precision`; money `numeric`; every FK column leads an index; a UNIQUE or EXCLUDE constraint stops seat double booking; at least one CHECK. Solution tables: flights, flight_seats, passengers, bookings, booking_passengers, payments.
3. Stress (controller-only; shown to Đạt as an optional terminal command): 8 background `psql` workers, each running 250 `post_transfer` calls (generated with `\gexec`) among stores 1–20; count `40P01`; run `check.sql`. Repeat with `unordered.sql` (temporary `post_transfer_unordered` in lab07, dropped after). Record both in `stress.txt`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| matrix rows e10–e24 exist before SQL | pending in `--expect` | `--expect` |
| each run then check | 0 ✘ | `record.sh` |
| hw-check on solution | all ✔ | run with pattern `hws\_%` |
| hw-check on broken draft | ≥ 4 ✘ (float money, timestamp, unindexed FK, no seat constraint) | run `hw-bad.sql` then pattern `hwb\_%` |
| stress ordered | 2,000 transfers, `40P01` = 0, check 0 ✘ | `grep -c 40P01` |
| stress unordered | `40P01` ≥ 1 expected; if 0, narrative relies on e24 only (logged) | same |
| e24 two tabs | exactly one `40P01` in unordered, none in ordered | timeline grep |
| lint, fingerprint, sessions | pass, unchanged, 0 left | as phase 03 |

## Verification
```bash
P="D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide"
for e in e10 e11 e12 e13 e14 e15 e16 e17 e18 e19 e20 e21 e22 e23; do bash "$P/build/record.sh" $e || break; done
bash "$P/build/record.sh" e24 --two-tabs && bash "$P/build/record.sh" hw && bash "$P/build/record.sh" stress
node "$P/verify/verify-guide.mjs" --lint-sql && node "$P/verify/verify-guide.mjs" --expect all
```

## Risks and rollback
`54000` may not occur if the value compresses: the narrative then says PG compressed it and the run text stays. Workers left running: `record.sh` waits on PIDs and terminates only `l07-%` backends. Rollback: delete files, re-run setup, drop nothing outside lab07.

=== FILE: phase-05-shell-fragments-prisma.md ===
---
phase: 5
title: "Shell, stage fragments, Prisma drill (parallel delegates)"
status: pending
priority: P1
effort: 120m
dependencies: [1, 3, 4]
---

# Phase 05 · Shell, fragments, Prisma drill

## Goal
Write all guide content as disjoint fragment files against the frozen contract, pipelined behind the experiment phases.

## Files to create/modify (owner per row; no file has two owners)
| Owner | Starts after | Files (under `P/build/`) |
|---|---|---|
| Controller | 01 | `fragments/stage-0.html`, `shell.html` (head, CSS from lesson 14 plus 6 new classes, hero, `#cach-hoc` with plan table, DBX setup panel, warm-up `l07-warmup`; markers `<!-- @frag:… -->`; core IIFE: store, theme `l07-theme`, `data-store` limited to `l07-`, walk labels, quiz renderer, exam, slide map), `fragments/tail.html` (`#phong-van`, `#cheat-sheet`, `#ban-do-slide`, `#tham-khao`, `#tiep-theo`), `fragments/tail.js` (`SLIDES` 1–43, `EXAM` 10), `assemble.mjs` |
| D5 Prisma | 01 | `fragments/prisma.html`, `L/prisma-drill/schema.ai-draft.prisma`, `L/prisma-drill/schema.solution.prisma`, `P/verify/prisma-claims.md` |
| D1 | 03 | `fragments/stage-1.html`, `stage-1.js`, `stage-2.html`, `stage-2.js` |
| D2 | 03 | `fragments/stage-3.html`, `stage-3.js`, `stage-4.html`, `stage-4.js` |
| D3 | 04 | `fragments/stage-5.html`, `stage-5.js`, `stage-6.html`, `stage-6.js` |
| D4 | 04 | `fragments/stage-7.html`, `stage-7.js`, `stage-8.html`, `stage-8.js`, `fragments/homework.html` |

## Tasks and steps
1. Controller writes `shell.html` and `stage-0.html` first (setup snippet, check snippet, recorded "thẻ dữ liệu", DBX tab duplication note, warning that re-running setup wipes `hw_` tables).
2. Each delegate prompt gives: `contract.md`, its matrix rows, the run files and widget keys it may read, the slide text (`D:/study/advance-be/Tài Liệu/advanced_backend/7. Data Modeling.md`), lesson-14 lines 329–422 as the stage pattern, and the rules: numbers only from run files, Vietnamese prose, no new CSS, own files only, no DB access, no git. It ends with the status block.
3. Each stage has: stage-head, goal, `dl.wwh` (LÀ GÌ / TẠI SAO / KHI NÀO KHÔNG), slide images where one exists (`../../Tài Liệu/advanced_backend/assets/7_Data_Modeling/page_NN_*.png`, `onerror` hide), `callout cite-mysql` "Slide nói" vs `callout pg` "PG 16 đo được" with chip, walkthrough (snippet, recorded output, `table.walk` for two-tab steps), a "Tự làm" challenge with acceptance criteria and `data-store` inputs, `details.fold` for optional parts, the widget, and `QUIZ[N]` (4 mechanism questions, each `why` citing an experiment).
4. Widgets and challenges (widget data only from the named `run-…` block):
   - W1: inline SVG ERD coloured by table type; click a table for its columns (`run-e01`). Challenge: classify 6 OmniPOS tables.
   - W2: stepper 0NF → 3NF showing the removed dependency and anomaly counts (`run-e02`). Challenge: decompose a store-shift sheet; acceptance: `EXCEPT` = 0 both ways.
   - W3: A/B lanes with an "FK on/off" toggle (`run-e04`). Challenge: exclusive-arc attachments table; acceptance: both `23514` cases fire.
   - W4: ALTER ms on a log scale, rewrite yes/no, lock mode (`run-e06`, `run-e08`), plus a safe-migration checklist linking lesson 14 stage 3.
   - W5: pick a field (tiền, created_at, giờ hẹn, username, bình luận, vị trí sắp xếp) → PG type and the evidence line (`run-e10..e13`).
   - W6: live bisection with JS `Number` and `Math.fround`, compared with the recorded 53/24 (`run-e15`). W7: month grid for homestay 1 (`run-e16`) with the conditional-UPDATE rule and recorded `23P01`.
   - Stage 7: static SVG of MySQL MERGE/TEMPTABLE vs PG inlining with e20 EXPLAIN excerpts.
   - W8: T-account view over seeded balances (`run-e21`), overdraft refusal with recorded `23514`, a "bơm lệch" toggle showing recorded reconciliation rows (`run-e23`), lock-order panel (`run-e24`, `stress`). Challenge: 3-leg payment (customer −100, store +97, fee +3); acceptance: K7–K10 ✔. Bridge to OmniPOS phase B and Boss Challenge 1.
   - Homework: slide 35 brief, template table, `hw-check.sql` usage, solution in a fold.
5. D5 Prisma drill: AI-draft schema with 8 seeded mistakes (Float money, `DateTime` without `@db.Timestamptz`, relation scalar without `@@index`, `commentableType/commentableId` polymorphic, ledger without CHECK, `@updatedAt` assumed DB-side, `Decimal` without precision, `String` status without enum or CHECK). Every claim about Prisma 7.9 behaviour is checked against prisma.io docs and published `prisma@7.9.0`/`@prisma/client@7.9.0` files on unpkg (never `node_modules`) and logged in `prisma-claims.md` with URL and quoted line; unverifiable claims are dropped. Consequences cite e03, e05, e09, e11, e12. Fix path: CHECK and deferred trigger via a `--create-only` migration's SQL.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment lint per file (written in 01) | 0 failures | `node P/verify/verify-guide.mjs --fragment P/build/fragments/stage-N.html` |
| numbers in fragments | every `b.m` found in its run file | same |
| storage keys | only `l07-cN-*` | same |
| Prisma claims | each drill statement has a row in `prisma-claims.md` with URL | manual cross-check by controller |
| ownership | `git status` shows no fragment edited outside its owner list | controller review of delegate reports |

## Verification
```bash
P="D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide"
for f in "$P"/build/fragments/*.html; do node "$P/verify/verify-guide.mjs" --fragment "$f" || echo "FAIL $f"; done
```

## Risks and rollback
Invented numbers or CSS fail the fragment check; the controller re-prompts the owner with the failing lines. Tone drift is caught in the phase 06 read-through. Rollback: delete `P/build/fragments/*`.

=== FILE: phase-06-assemble-verify-render.md ===
---
phase: 6
title: "Assemble, verify, render-check"
status: pending
priority: P1
effort: 45m
dependencies: [5]
---

# Phase 06 · Assemble, verify, render

## Goal
Produce G from the shell and fragments, then prove it against every contract and on real viewports.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`
- `P/verify/verify-report.txt`, `P/verify/render/` (screenshots, report)
- `D:/study/advance-be/reports/advanced_backend/lesson_07_dark_copy.html` (temporary, deleted after the dark render-check)

## Tasks and steps
1. `node P/build/assemble.mjs`: replace `@frag` markers in order (stage-0 … stage-8, homework, prisma, tail), fill `data-snippet` with HTML-escaped file text (two-tab `#k` blocks), fill `data-run-file` excerpts by line range, embed `<script type="application/json" id="run-…">` from `widget-data.json`, append fragment JS inside the IIFE. Output G.
2. Run `verify-guide.mjs --guide --lint-sql --expect all` and save to `verify-report.txt`.
3. Read G once top to bottom in a browser; fix fragment text through the owning file, re-assemble.
4. Render-check: read `render-check.mjs --help`; if it has no colour-scheme flag, make the temporary dark copy (G with `data-theme="dark"` on `<html>`, next to G so relative image paths resolve). Run with `TMP`/`TEMP` inside `P/verify/render/tmp`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| verifier on G | 0 failures | `--guide` |
| mismatch detection still works on real G | mutated copy of G fails snippet check | `--self-test` plus one manual mutation of a temp copy in `P/verify/tmp/` |
| slide coverage | 43/43 | part of `--guide` |
| size | ≤ 320 KB | part of `--guide` |
| render light | 0 runtime errors, 0 overflow at 375/768/1440, touch targets ≥ 44 px | render-check on G |
| render dark | same | render-check on dark copy |
| widgets without data | page still runs if a `run-…` block is missing (guards like lesson 14) | temp copy with one JSON block removed, render-check 0 errors |

## Verification
```bash
P="D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide"; G="D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html"
node "$P/build/assemble.mjs" && node "$P/verify/verify-guide.mjs" --guide --lint-sql --expect all | tee "$P/verify/verify-report.txt"
mkdir -p "$P/verify/render/tmp"; TMP="$P/verify/render/tmp" TEMP="$P/verify/render/tmp" \
  node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "$G" --out "$P/verify/render/light"
# dark: same command on reports/advanced_backend/lesson_07_dark_copy.html with --out "$P/verify/render/dark"; delete the copy afterwards
```

## Risks and rollback
Overflow from long SQL lines or wide tables at 375 px: `pre` scrolls inside `.code`, tables sit in `.table-wrap`; fix in the fragment. Rollback: delete G and re-assemble from fragments.

=== FILE: phase-07-ultra-code-review.md ===
---
phase: 7
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 60m
dependencies: [6]
---

# Phase 07 · Ultra code review

## Goal
Independent review of the guide, lab SQL and run traceability; fix every verified Critical and Important finding.

## Files to create/modify
- Reviewers write only `P/reports/code-review-ultra-*.md`.
- Controller fixes in the owning file (SQL in L, fragments in `P/build/fragments/`), then re-records affected runs and re-assembles G.

## Tasks and steps
1. Invoke the installed code-review skill in ultra mode (`/ak:code-review --ultra`): 5 independent reviewers plus a verifier; union of verified findings. Scope: G, `L/*.sql`, `L/runs/*`, `P/contract.md`, `P/verify/expected-results.json`, `P/verify/prisma-claims.md`. Focus prompts: PG 16 correctness of each chip, writes outside `lab07_modeling`, snippet/run traceability, Vietnamese clarity for the learner, widget logic against recorded data, a11y at 375 px.
2. Triage: Critical/Important fixed now; Minor fixed if under 5 minutes, else listed in the handoff.
3. Any SQL change → re-run that experiment with `record.sh`, update `widget-data.json` from the new run, re-run phase 06 gate.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| review complete | verifier report lists findings with severity | review skill output |
| fixes applied | each Critical/Important has a fix note | controller check |
| regression | phase 06 gate passes again | phase 06 verification block |
| changed SQL | re-recorded run, check 0 ✘ | `record.sh <id>` |

## Verification
Re-run the phase 06 verification block and `--expect all`; both must be clean.

## Risks and rollback
A finding asks to reverse a settled decision (for example re-add a `.mjs` harness or switch ORM): reject with the evidence-packet citation. Rollback of a bad fix: re-assemble from the previous fragment text kept in the review report diff.

=== FILE: phase-08-docs-final-gate-handoff.md ===
---
phase: 8
title: "Docs, final gate, handoff"
status: pending
priority: P1
effort: 30m
dependencies: [7]
---

# Phase 08 · Docs, final gate, handoff

## Goal
Point the repo's navigation at the new guide and lab, prove the database and sources are clean, and leave a start-tomorrow note.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/README.md` (line 14 labs list; tree under `reports/advanced_backend/` and `labs/`)
- `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` (row 07, fifth column: guide and lab paths)
- `P/verify/docs-before/README.md`, `P/verify/docs-before/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` (copies taken before editing)
- `P/plan.md` status via the plan CLI (read `ak plan --help` first)
- `D:/study/advance-be/plans/handoffs/lesson-07-guide-ready-start-tomorrow-20261028.md`

## Tasks and steps
1. Copy both docs to `docs-before/`, then edit the smallest surface: add `labs/lesson-07-data-modeling/` to line 14, add the guide and lab to the tree, replace "*ERD Design & DDL scripts*" in row 07 with links to G and L.
2. Final gate: re-run `00-setup.sql` (clean state for Đạt), `check.sql` 0 ✘, fingerprint diff empty, `--guide --lint-sql --expect all` clean, 0 `l07-%` sessions, `git status` lists only G, L, P, the handoff and the two docs.
3. Handoff (Vietnamese, short): where to open G, the 5-minute prep (docker start, DBX `ADVANCE_BE_LAB` + `_B`, run setup and check), study order and optional parts, where results are compared, homework file name `hw-mine.sql`, open Minor review items.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| doc links resolve | both paths exist | `ls` on G and L from links |
| docs diff minimal | only the intended lines changed | `diff P/verify/docs-before/README.md README.md` |
| setup idempotent at gate | 0 ✘ | setup + check |
| sources untouched | empty diff | fingerprint |
| no git operations | only `git status` was run | handoff lists commands used |

## Verification
```bash
P="D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide"
cd D:/study/advance-be && git status --short
diff "$P/verify/docs-before/README.md" README.md; diff "$P/verify/docs-before/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md" TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md
```

## Risks and rollback
Docs edits restored from `docs-before/` if wrong. Nothing is committed, so Đạt decides when to commit.
