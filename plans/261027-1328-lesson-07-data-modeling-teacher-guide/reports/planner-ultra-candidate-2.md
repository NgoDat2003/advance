=== FILE: plan.md ===
---
title: "Lesson 07 Data Modeling teacher guide (DBX-first, PG16-measured)"
description: "Build a single-file Vietnamese teacher guide for lesson 07 (43 slides + 1NF-3NF + polymorphic + double-entry ledger) backed by DBX-runnable SQL labs and recorded PG16 runs."
status: pending
priority: P1
effort: 11h
branch: main
tags: [lesson-07, data-modeling, teacher-guide, postgresql, dbx, ledger, tdd]
blockedBy: []
blocks: []
created: 2026-10-27
---

# Lesson 07 Data Modeling teacher guide

Paths used in every file: `P` = `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide`, `L` = `D:/study/advance-be/labs/lesson-07-data-modeling`, `G` = `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`.

## Overview

Tomorrow (2026-10-28) Đạt studies lesson 07 from `G` in 8 stages, about 4 h 45 min of core work. In each stage he opens one SQL file in DBX, runs `Ctrl+A → Run`, reads the result grid and a final ✔/✘ "Kiểm chứng" grid, then does a hands-on task. The guide covers all 43 slides, 1NF→3NF on a flat Northwind order sheet, three polymorphic patterns, and a double-entry ledger capstone posted with lesson-14 tools. Every number traces to a run recorded on this machine in `L/runs/`, every SQL block equals its file in `L`, and a verifier script proves both. Writes go only to `lab07_modeling`, and the learner never runs Node.

## Stage map

| Stage | Slides / topic | Min (core + opt) | Experiments (`L/…sql`, run id) | Widget |
|---|---|---|---|---|
| 0 Chuẩn bị | 1–4 | 5 | `00-setup.sql`, `check.sql` | — |
| 1 Quy trình, ERD, loại bảng, cột tham chiếu | 5–8, 12 | 15 | `s1-erd.sql` (s1) | W1 ERD explorer (inline SVG) |
| 2 Chuẩn hoá 1NF→3NF, phi chuẩn hoá | 9, 10, 34 | 40 | `s2-normal-forms.sql` (s2) | W2 normalization stepper |
| 3 Khóa ngoại + polymorphic | 11 + block 3 | 40 + 10 | `s3a-fk-cost.sql` (s3a), `s3b-fk-race-A/B.sql` (s3b, two sessions), `s3c-polymorphic.sql` (s3c) | W3 FK race lanes + cost bars, W4 polymorphic comparator |
| 4 Định dạng bảng, JSON, DDL lock, table template | 13–20 | 35 + 10 | `s4a-add-column.sql` (s4a), `s4b-jsonb.sql` (s4b), `s4c-create-index-A/B.sql` (s4c, two sessions) | W5 DDL board (rewrite? lock? ms) |
| 5 Kiểu dữ liệu và NULL | 21–25 | 30 | `s5-data-types.sql` (s5) | W6 type picker |
| 6 Case studies | 26–32 | 35 + 10 | `s6a-translation-ordering.sql` (s6a), `s6b-booking-calendar.sql` (s6b), `s6c-tags.sql` (s6c) | W7 float bisection simulator, W8 booking range checker |
| 7 Report, view, materialized view | 33, 38–43 | 20 | `s7-views-report.sql` (s7) | W9 view plan toggle |
| 8 Capstone: sổ cái kép | ledger block (+23, 34) | 45 + 10 | `s8a-ledger.sql` (s8a), `s8b-ledger-race-A/B.sql` (s8b, two sessions) | W10 ledger posting simulator |
| Prisma 7.9 drill | 11, 20, 23–25 recap | 20 | `prisma-drill/schema.ai.prisma`, `runs/prisma-evidence.txt` | — |
| Bài tập (tối 28/10) | 35 | 30 (evening) | `hw-flight-check.sql` (hw) | — |
| Kết | 36, 37 + phỏng vấn | 10 (evening) | — | slide map |

Core 285 min; evening 40 min (homework, interview); optional 40 min (manual two-tab replays in stages 3, 4, 8 and the DST fold in stage 6). Slides 1–43 each map to exactly one row.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 1 | [Contract and tests first](phase-01-contract-and-tests-first.md) | 1.5h | — | G1: `check.sql` is red on an empty schema and the verifier self-test passes |
| 2 | [Setup fixtures](phase-02-setup-fixtures.md) | 0.75h | 1 | G2: setup run twice gives all ✔ and identical source fingerprints |
| 3 | [Experiments, runs, evidence](phase-03-experiments-runs-evidence.md) | 3h | 2 | G3: 15 runs recorded, 0 unexplained ✘, check stays all ✔ |
| 4 | [Guide fragments](phase-04-guide-fragments.md) | 2.5h | 3 (per stage, pipelined) | G4: each fragment passes the verifier in isolation |
| 5 | [Assemble, verify, render](phase-05-assemble-verify-render.md) | 1h | 4 | G5: verifier exit 0, render-check clean at 3 widths in light and dark |
| 6 | [Ultra code review and fixes](phase-06-ultra-code-review.md) | 1.5h | 5 | G6: 0 open Critical/Important findings, gates G3 and G5 re-pass |
| 7 | [Docs, final gate, handoff](phase-07-docs-final-gate-handoff.md) | 0.75h | 6 | G7: docs link to real files, handoff written, `git status` lists only expected paths |

Wall clock is about 6–7 h. Phases 3–4 fan out to delegates D1–D5 with disjoint files; the controller owns every DB run and runs them serially.

## Expected-result matrix

Each experiment's final grid has one row per id below (✔/✘). A ✘ changes the narrative or chip, never the data (Phase 3, `P/verify/deviations.md`).

| Id | Claim (slide) | Expected PG 16.15 result | Chip |
|---|---|---|---|
| s1·1 | Later-born entity holds the reference (12) | donation with `order_id NULL` accepted; 2nd payment for one order → 23505 | Đúng trên PG16 |
| s1·2 | ERD, table types (5–8) | catalog lists each fixture with its type comment; FK edges point child→parent | Đúng trên PG16 |
| s2·1 | Normalization (9) | flat sheet 2,155 rows; renaming product 1 on one line → 2 names for one `product_id`; 3NF: 1 row | Đúng trên PG16 |
| s2·2 | insert anomaly | new product without an order → 23502 in flat sheet; in 3NF the insert succeeds | Đúng trên PG16 |
| s2·3 | delete anomaly | sheet shows 89 of 91 customers; deleting the single-order customer's order → 88 | Đúng trên PG16 |
| s2·4 | Denormalization (10, 34) | cached `order_total` = 1-row read; line update without refresh → reconciliation finds 1 mismatch | Đúng trên PG16 |
| s3a·1 | FK check costs time (11) | 200,000 child inserts slower with FK than without (ratio > 1.5); PG made no FK index (only `_pkey`), child delete by `parent_id` = Seq Scan; parent `EXPLAIN ANALYZE DELETE` shows `Trigger for constraint …` time, ≥10× smaller after the FK index | Cần sửa |
| s3b·1 | "check FK in app" (11) | no FK: A checks, B deletes, A inserts → 1 orphan; FK + B deletes first → A 23503; FK + A inserts first (`FOR KEY SHARE`) → B `DELETE` waits until A commits, then 23503 | Cần sửa |
| s3c·1 | polymorphic (block 3) | `type + id`: k orphans after a product delete, typo `'Prodcut'` accepted; exclusive arc: both NULL → 23514, delete → 23503; supertype: 0 orphans | — |
| s4a·1 | ADD COLUMN downtime (14) | `note text`, `int NOT NULL DEFAULT 0`, `timestamptz DEFAULT now()`: filenode unchanged, ms-scale; `now()` → 1 distinct value in 500,000 rows | MySQL đúng, PG khác |
| s4a·2 | — | `DEFAULT random()`, `int → bigint`: filenode changes (rewrite); every ALTER holds `AccessExclusiveLock` (lesson 14 stage 3) | MySQL đúng, PG khác |
| s4a·4 | Spare columns (17) | adding a nullable column needs no rewrite; 5 all-NULL spare columns add 0 data bytes/row | Cần sửa |
| s4a·5 | Template columns (19–20) | no `ON UPDATE` in PG: `updated_at` moves only with a trigger; `version` increments | Đúng trên PG16 |
| s4b·1 | JSON column (15) | `jsonb` dedups keys (`{"a":1,"a":2}` → `{"a": 2}`), `json` keeps text as typed | Đúng trên PG16 |
| s4b·2 | No index on JSON (16) | expression index on `(data->>'channel')` → Index/Bitmap scan; GIN `jsonb_path_ops` serves `@>` | MySQL đúng, PG khác |
| s4c·1 | ADD INDEX locks table (18) | plain `CREATE INDEX` holds `ShareLock`: B `UPDATE` waits (Lock/relation) until A commits, B `SELECT` does not; during CIC B `UPDATE` < 200 ms while `pg_stat_progress_create_index` shows a build phase; CIC in a transaction → 25001; failed unique CIC leaves `indisvalid = false` | MySQL đúng, PG khác |
| s5·1 | VARCHAR vs TEXT (22) | `pg_column_size('xin chao'::text) = 12 = …::varchar(255)`; `varchar(5)` overflow → 22001 | MySQL đúng, PG khác |
| s5·2 | TEXT cannot be fully indexed (22) | btree on 3,000 random chars → 54000; `md5()` expression index works | MySQL đúng, PG khác |
| s5·3 | Money: no FLOAT (23) | `0.1::float8 + 0.2 = 0.30000000000000004`; `sum` of 1,000,000 × 0.1 float8 = `100000.00000133288`, numeric `100000.0`; Northwind `real` line totals ≠ numeric totals; `smallint` overflow → 22003 | Đúng trên PG16 |
| s5·4 | Timestamp vs Datetime (24) | both 8 bytes; `'…09:00+07'::timestamp` silently drops the offset; `Asia/Ho_Chi_Minh` shows `09:00+07`, UTC shows `02:00+00`; year 2040 accepted | MySQL đúng, PG khác |
| s5·5 | Avoid NULL (25) | all-NULL table smaller than zero-filled; `IS NULL` uses btree; `NOT IN (…NULL…)` → 0 rows | MySQL đúng, PG khác |
| s6a·1 | Translation JSON (27) | `coalesce(t->>'ja', t->>'en', original)` fallback; new language without ALTER | Đúng trên PG16 |
| s6a·2 | Float ordering (28) | float8 runs out after 53 midpoints, float4 after 24; numeric still splits after 200 (scale grows); window renumber restores gaps | Cần sửa |
| s6b·1 | 365 availability rows (29–30) | `generate_series` gives 365 rows/homestay; overlapping conditional UPDATE touches fewer rows than nights → must check count | Đúng trên PG16 |
| s6b·2 | — | `EXCLUDE USING gist (homestay_id WITH =, stay WITH &&)` → 23P01 on overlap; adjacent `[)` ranges accepted | Đúng trên PG16 |
| s6b·3 | Time slots (31) | weekly 09:00 `America/New_York` slot: UTC 13:00 before 2026-11-01, 14:00 after | Đúng trên PG16 |
| s6c·1 | Tags array + inverted index (32) | `tags @> ARRAY['…']` → Bitmap Index Scan on GIN; join-table query uses `post_tags(tag_id)` index | Đúng trên PG16 |
| s7·1 | Report counting (33) | exact count vs `reltuples` estimate recorded; MV stale until `REFRESH`; `REFRESH … CONCURRENTLY` without unique index → 55000 | Đúng trên PG16 (HLL: no extension, cited only) |
| s7·2 | Views not updatable (40) | simple view `UPDATE` → 1 row; `WITH CHECK OPTION` violation → 44000 | MySQL đúng, PG khác |
| s7·3 | MERGE vs TEMPTABLE (41) | simple view plan = Index Scan on base pkey (inlined); aggregate view filter pushed down; window-function view → Subquery Scan + Seq Scan | MySQL đúng, PG khác |
| s7·4 | No materialized views (42); check plans (43) | `CREATE MATERIALIZED VIEW` + `REFRESH` work; slide 43 is proven by s7·3 | 42 Cần sửa · 43 Đúng trên PG16 |
| s8a·1 | ledger invariants | balanced transfer: per-txn and global sum 0; single unbalanced entry → P0001 (statement-level trigger); overdraft → 23514, no entries written; entry UPDATE/DELETE → P0001, correction = reversal txn; duplicate idempotency key → 23505 | — |
| s8a·2 | cached vs derived balance | reconciliation 0 mismatches; bypass `UPDATE wallets` → 1 mismatch (drift 100), repaired; `SUM(amount)` over 200,000 entries slower than reading `wallets.balance` | — |
| s8b·1 | lock order (lesson 14) | naive from→to locking: exactly one 40P01, invariants hold; `ORDER BY id FOR UPDATE`: 0 × 40P01, B waits for A | — |
| hw·1 | homework self-check | empty prefix → all ✘; reference solution prefix → all ✔ | — |
| pd·1 | Prisma claims | evidence lines exist for each drill mistake (P1–P7, Phase 3) | — |

## Acceptance criteria

1. `L/00-setup.sql` builds `lab07_modeling` from read-only sources; two runs give identical, all-✔ `check.sql` output (Phase 2).
2. Source fingerprints (hw_contracts 500,000 + md5; northwind 91/830/2,155/77/8 + md5) are identical before setup, after all runs and at the final gate (Phases 2, 3, 7).
3. All 15 experiment run ids have `L/runs/<id>.txt`; every grid row is ✔ or listed in `P/verify/deviations.md` with its narrative change (Phase 3).
4. No raw `ERROR:` in any run file unless preceded by `-- EXPECT-ERROR <sqlstate>` (Phase 3).
5. Every experiment starts with the frozen header, writes only `lab07_modeling`, and leaves `check.sql` all ✔ (Phases 3, 6).
6. `G` is one file with hero, `#cach-hoc`, `#chang-1…8`, `#bai-tap`, `#prisma-drill`, `#phong-van`, `#cheat-sheet`, `#ban-do-slide`, `#tham-khao`, `#tiep-theo`; no rail; lesson-14 tokens and dark mode; ≤ 360 KB (Phase 5).
7. `verify-guide.mjs` and its `--self-test` exit 0 (snippet equality, number tracing, run-JSON equality, slides 1–43, `l07-*` keys, no external scripts or secrets, images exist, quizzes, EXAM = 10) (Phase 5).
8. render-check: 0 runtime errors and 0 horizontal overflow at 375/768/1440 in light and dark (Phase 5).
9. Every stage has Làm mẫu, Tự làm with acceptance criteria, and a quiz; homework has a self-check SQL; the Prisma drill has ≥ 6 mistakes, each citing a run or `prisma-evidence.txt` line (Phase 4).
10. Ultra code review: 0 open Critical/Important (Phase 6).
11. README and `TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 07 point to `G` and `L`; the handoff exists (Phase 7).
12. No branch, commit, push, PR or issue; `git status` is the only git command (all phases).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| DBX `Ctrl+A` stops at the first error or shows only the last grid | M×H | Deliberate errors go through `try_sql()`; each file ends with a summary grid; DBX MCP smoke test in Phase 3 |
| Two-session timing flakes (CIC ends before B) | M×M | B asserts a progress phase was seen; `maintenance_work_mem = '1MB'`; 3 retries, then a deviation |
| Measurement contradicts slide or expectation | M×M | `deviations.md`; narrative or chip changes, data never edited |
| A bug writes to a source schema | L×H | Frozen header, fingerprints, relation-name guard (C8), review focus |
| Build overruns tonight | M×H | Pipelined delegates, stages 2, 3, 8 first; optional folds may ship as recorded output only |
| Lesson 14 stage 5 not done yet | M×L | Stage 8 manual deadlock replay is optional and links lesson 14 `#chang-5` |

Rollback: run `L/99-cleanup.sql` (drops `lab07_modeling` and `btree_gist`), then delete `L`, `G`, `P/tools`, `P/build`, `P/verify`; restore the two doc lines quoted in Phase 7.

## Open questions for the user

None blocking. If Đạt has not finished lesson 14 stage 5 tonight, stage 8 still works because its manual part is optional.

=== FILE: phase-01-contract-and-tests-first.md ===
---
phase: 1
title: "Contract and tests first"
status: pending
priority: P1
effort: 1.5h
dependencies: []
---

# Phase 1: Contract and tests first

## Goal

Freeze what parallel work depends on and write the checks (`check.sql`, runners, verifier + self-test) before anything they check exists.

## Files to create/modify

| File | Owner |
|---|---|
| `P/contract.md` | controller |
| `L/check.sql` | controller |
| `P/tools/run-lab.sh`, `P/tools/run-pair.sh` | controller |
| `P/tools/verify-guide.mjs` (zero npm deps) | controller |
| `P/tools/build-guide.mjs` (skeleton; completed in Phase 5) | controller |
| `P/build/shell-head.html`, `P/build/runtime.js`, `P/build/slides.json`, `P/build/order.json` | controller |
| `L/runs/fingerprint-baseline.txt` | controller (recorded output) |

## Tasks and steps

1. **Fingerprint baseline (read-only).** Compute the following and save the psql output to `L/runs/fingerprint-baseline.txt`:
   - `count(*)`, `max(id)` and `md5(string_agg(md5(t::text), '' ORDER BY id))` of `lab03_indexing.hw_contracts`
   - the same md5 aggregate for `northwind.customers/orders/order_details/products/categories`, ordered by PK
   - `current_setting` of the DB-level `search_path` (`SELECT setconfig FROM pg_db_role_setting …`)
2. **`contract.md`** freezes the following:
   - **Snippet header**, first lines of every `L/*.sql` (two-session files add `SET application_name = 'l07-A'|'l07-B'; SET idle_in_transaction_session_timeout = '5min';`):
     ```sql
     SET search_path = lab07_modeling;   -- DB mặc định trỏ vào lab03_indexing
     SET statement_timeout = '60s';
     SET lock_timeout = '5s';
     ```
   - **Helpers created by `00-setup.sql`:**
     - `run_log(exp text, label text, sqlstate text, rows bigint, ms numeric, message text, at timestamptz default clock_timestamp())`
     - `try_sql(p_exp text, p_label text, p_sql text) RETURNS TABLE(exp, label, sqlstate, rows, ms, message)`. It runs `EXECUTE` inside `BEGIN … EXCEPTION WHEN OTHERS`, records `RETURNED_SQLSTATE`/`MESSAGE_TEXT`, and logs to `run_log`.
     - `plan_of(p_sql text) RETURNS text`. It returns `EXPLAIN (COSTS OFF)` text and does not execute the statement.
     - Deliberate errors always go through `try_sql`. The only exceptions are statements PG forbids inside functions (CIC, VACUUM). Those carry `-- EXPECT-ERROR <code>` on the line above.
   - **Fixtures** (built in Phase 2): `customers(customer_id text pk, company_name, city, country)`, `categories(category_id int pk, name)`, `products(product_id int pk, name, category_id fk, unit_price numeric(10,2))`, `orders(order_id int pk, customer_id fk, order_date date, ship_city text)`, `order_lines(order_id fk, product_id fk, quantity int, unit_price numeric(10,2), discount numeric(4,2), pk(order_id, product_id))`, `payment_txns(id bigint identity pk, order_id int unique null fk, kind text check in ('order','donate'), amount numeric(12,2))`; one index per FK column; `COMMENT ON TABLE` type tag (`entity|relation|support|config`). Ledger tables belong to `s8a`. Generated data is deterministic (no `random()` except s4a's rewrite demo and s5's incompressible text).
   - **Scratch naming:** `e<stage><letter>_*` (e.g. `e3a_parent`). Each experiment drops and recreates its own scratch tables at its start. Learner tables use `my_*` and `hw_*`, and setup never drops them.
   - **Final grid format:** `SELECT id, ok, claim, actual FROM (…) ORDER BY id;`, where `ok ∈ {'✔','✘'}` and the ids come from the expected-result matrix. The widget payload, when a stage has one, is the statement just before it: `SELECT json_build_object(…)::text AS widget_json;`.
   - **Run ids:** `s1 s2 s3a s3b s3c s4a s4b s4c s5 s6a s6b s6c s7 s8a s8b hw`, plus `setup`, `check-*`, `prisma-evidence`.
   - **Fragment format** (`P/build/fragments/<NN>-<slug>.html|.js|.quiz.json`): HTML holds only `<section class="stage col" id="…">`; SQL as `<div class="code"><pre data-src="<file>.sql"><code></code></pre></div>` (filled at build); output as `run-label` "Kết quả đã chạy trên máy bạn ngày 27/10/2026" + `<pre data-run="<id>.txt">` excerpt (`…` for skipped lines); numbers as `<b class="m" data-run="<id>" [data-match="raw"]>`; walk-table statements as `<code data-from="<file>.sql">`; slide anchors `id="sl-N"`; `.js` is a body wrapped in `(() => { … })();` using `$ $$ esc run press store` and only its stage's run ids; `.quiz.json` is `[{q, opts, ans, why}]`, ≥ 4 items.
   - **CSS vocabulary:** the lesson-14 classes (lines 12–238 of `reports/advanced_backend/lesson_14_locking_teacher_guide.html`) plus `svg.erd .tbl .tbl.sel .fk .fk-label` and `.cal .cal-day .cal-day.booked .cal-day.clash`. Nothing else may be added.
   - **Storage keys:** `l07-theme`, `l07-warmup`, `l07-c<N>-*`, `l07-hw-*`, `l07-pd-*`, `l07-dod-*`.
   - **Delegate ownership:** see the Phase 3 and Phase 4 tables.
3. **`check.sql`** returns `(id, ok, what, actual, expected)` rows plus a final `✔ n/N` row:
   - C1 schema exists
   - C2 fixture counts equal live source counts (91/8/77/830/2,155)
   - C3 `sum(quantity*unit_price*(1-discount))` of `order_lines` equals the same expression over the source cast to numeric
   - C4 every FK column of the fixtures has an index
   - C5 `btree_gist` installed in `lab07_modeling`
   - C6 helpers `try_sql`, `plan_of`, `run_log` exist
   - C7 the source fingerprints equal the constants from step 1
   - C8 no relation matching `^(e[0-9]|nf_|my_|hw_|hwsol_|wallets|ledger_)` exists in `lab03_indexing, lab12_transaction, lab14_locking, lab_imdb, northwind, public, maycha_lease`
   - C9 the DB-level `search_path` is unchanged
   - L1–L4 ledger rows report `·` (not built yet) when `wallets` is absent. Otherwise they check: every txn sum = 0; global sum = 0; every txn has ≥ 2 entries; `wallets.balance` equals `SUM(entries)` and no balance is negative where `NOT allow_negative`.

   The schema-dependent checks are written as `to_regclass(...) IS NOT NULL AND …`, so the file runs on an empty database and simply shows ✘.
4. **Runners** (controller only):
   - `run-lab.sh <file> <id>` runs:
     ```bash
     docker exec -i -e PGCLIENTENCODING=UTF8 quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -a -c '\timing on' -f - < "$L/<file>" > "$L/runs/<id>.txt" 2>&1
     ```
     then appends `[exit N]` and copies the `widget_json` value line (after the `---` under that header) to `L/runs/<id>.json`.
   - `run-pair.sh <A.sql> <B.sql> <id>` runs both psql processes in the background, waits, and writes `<id>-A.txt`, `<id>-B.txt` and merged `<id>.txt` (A, B, then `== Dòng thời gian ==`: step-stamp rows `SELECT 'A·3' AS buoc, to_char(clock_timestamp(),'HH24:MI:SS.MS') AS luc, '…' AS viec` sorted by `luc`).
5. **`verify-guide.mjs [--html G] [--self-test]`** runs these checks and exits 1 on any failure, printing the check id:
   V1 balanced sections, unique ids, `#` links resolve · V2 `SLIDES` n = 1..43 once each, hrefs resolve, chips ∈ 3 labels/null and equal the matrix · V3 `pre[data-src]` (unescaped, LF) equals `L/<file>` · V4 each `b.m[data-run]` value or `data-match` occurs in `L/runs/<id>.txt`; `pre[data-run]` lines (except `…`) occur in order · V5 `script#run-<id>` deep-equals `L/runs/<id>.json` · V6 `code[data-from]` occurs in its file · V7 storage keys start `l07-` · V8 no `<script src`, no non-Google-Fonts `<link>`, no `postgres://`, `password`, `PG_URL=`, `5433/` · V9 `img src` exists · V10 quiz ≥ 4 per stage, `EXAM.length === 10`, `ans` in range · V11 every ✘ in runs is in `deviations.md`; raw `ERROR:` only after `-- EXPECT-ERROR` · V12 ≤ 360 KB · V13 no mojibake (`Ã`, `á»`).

   Modes: `--fragment <file>` runs V1, V3–V7, V9, V10 and V14 (class whitelist from the contract) on one fragment; `--runs-only` runs V11 and JSON validity on `L/runs`.

   `--self-test` builds a minimal valid page and temporary lab/run files in `P/verify/tmp/`. It asserts the page passes, then applies one mutation per check (edit one char in a `data-src` block, change a `b.m` digit, add an `l14-` key, drop slide 17, add `<script src>`, inject a ✘ line, add an unmarked `ERROR:`, point an `img` at a missing file). Every mutation must fail with the right id. It then deletes `P/verify/tmp/`.
6. **Shell:**
   - `shell-head.html` is lesson-14 lines 1–239 with title `Sổ tay Data Modeling · Bài 07`, the two new class families appended, and no rail.
   - `runtime.js` is the lesson-14 IIFE helpers (lines 2398–2473) with `l14-` replaced by `l07-` (theme, `data-store` prefix guard, walk labels, quiz, exam, slide map).
   - `slides.json` has 43 entries `{n, title (from "## Trang N"), href, pg, chip}` with the chips from the matrix.
   - `order.json` lists the fragment order.

## Test matrix

| Test (written first) | Expected | Command |
|---|---|---|
| `check.sql` on a DB without `lab07_modeling` | C1–C6 ✘, C7–C9 ✔, L1–L4 `·`, no raw ERROR | `bash P/tools/run-lab.sh check.sql check-red` |
| Verifier self-test | prints every mutation caught and exits 0 | `node P/tools/verify-guide.mjs --self-test` |
| Verifier on a missing `G` | exits 1 with V0 "file not found" | `node P/tools/verify-guide.mjs` |
| `run-lab.sh` on a file with a syntax error | `[exit 0]` but `ERROR:` without a marker, so V11 fails | self-test covers it |

## Verification

```bash
bash P/tools/run-lab.sh check.sql check-red && grep -c '✘' L/runs/check-red.txt   # > 0
grep -E 'C7|C8|C9' L/runs/check-red.txt | grep -c '✔'                              # 3
node P/tools/verify-guide.mjs --self-test; echo $?                                  # 0
git -C D:/study/advance-be status --short                                           # only P, L new
```

## Risks and rollback

- The 500,000-row md5 takes about 1–2 s; `check.sql` sets `statement_timeout = '120s'`.
- Rollback: delete the files above. No DB state exists yet.

=== FILE: phase-02-setup-fixtures.md ===
---
phase: 2
title: "Setup fixtures"
status: pending
priority: P1
effort: 0.75h
dependencies: [1]
---

# Phase 2: Setup fixtures

## Goal

Idempotent `00-setup.sql` from read-only sources; `99-cleanup.sql` removes it.

## Files to create/modify

| File | Owner |
|---|---|
| `L/00-setup.sql` | controller |
| `L/99-cleanup.sql` | controller |
| `L/runs/setup.txt`, `L/runs/check-setup-1.txt`, `L/runs/check-setup-2.txt` | controller |

## Tasks and steps

1. Header (`statement_timeout = '120s'`); `CREATE SCHEMA IF NOT EXISTS lab07_modeling`; `CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA lab07_modeling`.
2. `DROP TABLE IF EXISTS lab07_modeling.<fixture> CASCADE` per fixture; never drop the schema, `my_*`, `hw_*` or `e*`.
3. Create fixtures with the frozen columns from `northwind.*` (cast `real` → `numeric`), FK indexes, type comments, 6 `payment_txns` rows (4 order, 2 donation with NULL `order_id`).
4. `CREATE TABLE IF NOT EXISTS run_log`, `CREATE OR REPLACE FUNCTION try_sql`, `plan_of`; `ANALYZE`; final SELECT prints a Vietnamese row-count card.
5. `99-cleanup.sql`: header + `DROP SCHEMA IF EXISTS lab07_modeling CASCADE;`, with a comment that it also removes `my_*`/`hw_*` work.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| Setup on a clean DB | `[exit 0]`, no `ERROR:` | `bash P/tools/run-lab.sh 00-setup.sql setup` |
| Check after the first setup | every row ✔ except L1–L4 `·`; `✔ n/n` | `bash P/tools/run-lab.sh check.sql check-setup-1` |
| Idempotency: setup again + check | `check-setup-2.txt` equals `check-setup-1.txt` after stripping `Time:` lines | `diff <(grep -v '^Time:' L/runs/check-setup-1.txt) <(grep -v '^Time:' L/runs/check-setup-2.txt)` → empty |
| Learner work survives a rerun | create `my_probe(id int)` and insert 1 row, rerun setup → row still there; then drop `my_probe` | psql one-liners via `docker exec` |
| Sources untouched | C7, C8, C9 ✔ in both checks | grep |
| Cleanup works and is reversible | after cleanup, `check-red` pattern again; then setup restores ✔ | run cleanup → check → setup → check |

## Verification

```bash
bash P/tools/run-lab.sh 00-setup.sql setup && bash P/tools/run-lab.sh check.sql check-setup-1
bash P/tools/run-lab.sh 00-setup.sql setup && bash P/tools/run-lab.sh check.sql check-setup-2
grep -c '✘' L/runs/check-setup-2.txt        # 0
grep -c '^ERROR' L/runs/setup.txt            # 0
```

## Risks and rollback

- `btree_gist` needs the `postgres` role (used by DBX and the container). If it fails, s6b·2 becomes a deviation (per-day rows only) and setup drops that line.
- Rollback: `bash P/tools/run-lab.sh 99-cleanup.sql cleanup`.

=== FILE: phase-03-experiments-runs-evidence.md ===
---
phase: 3
title: "Experiments, runs, evidence"
status: pending
priority: P1
effort: 3h
dependencies: [2]
---

# Phase 3: Experiments, runs, evidence

## Goal

Write one self-contained, rerunnable SQL file per experiment, with assertion rows taken from the expected-result matrix. The controller runs them one at a time and records verbatim output. It also gathers the Prisma evidence without reading `node_modules`.

## Files to create/modify

| Delegate | Files (all under `L/`) |
|---|---|
| D1 | `s1-erd.sql`, `s2-normal-forms.sql` |
| D2 | `s3a-fk-cost.sql`, `s3b-fk-race-A.sql`, `s3b-fk-race-B.sql`, `s3c-polymorphic.sql` |
| D3 | `s4a-add-column.sql`, `s4b-jsonb.sql`, `s4c-create-index-A.sql`, `s4c-create-index-B.sql`, `s5-data-types.sql` |
| D4 | `s6a-translation-ordering.sql`, `s6b-booking-calendar.sql`, `s6c-tags.sql`, `s7-views-report.sql` |
| D5 | `s8a-ledger.sql`, `s8b-ledger-race-A.sql`, `s8b-ledger-race-B.sql`, `hw-flight-check.sql`, `hw-flight-solution.sql`, `prisma-drill/schema.ai.prisma`, `prisma-drill/schema.fixed.prisma` |
| controller | `runs/*`, `runs/prisma-evidence.txt`, `P/verify/deviations.md`. After a delegate hands back, ownership of its SQL passes to the controller for small fixes. |

Delegates never touch the DB. Each gets `P/contract.md`, its matrix rows, its slides from `Tài Liệu/advanced_backend/7. Data Modeling.md`, and lesson-14 guide lines 329–422 as tone model; SQL comments are plain Vietnamese.

## Tasks and steps

1. **Per-file design** (beyond its matrix rows; every file ends with `widget_json`, then the final grid):
   - **s1:** `payment_txns` cases; catalog query (`pg_class`, `pg_constraint`, `obj_description`) emitting tables, types, rows, FK edges.
   - **s2:** `nf_unf` (one row per order, `items` text `Chai×12; Chang×10`) → `nf_flat` (1NF, 2,155 lines) → 2NF/3NF tables; anomalies via `try_sql`; `pg_total_relation_size` flat vs 3NF; `order_total` cache drifted inside `BEGIN … ROLLBACK`.
   - **s3a:** parents 1–20,000, 200,000 children referencing 1–19,000; insert timed via `try_sql` with/without FK; `BEGIN; EXPLAIN (ANALYZE) DELETE FROM e3a_parent WHERE id = 19500; ROLLBACK;` before/after the FK index.
   - **s3b / s4c / s8b pairs:** A and B are sequenced by `pg_sleep` offsets (0/1/2 s) and step-stamp rows; the guide's walk table copies the statements without the sleeps. s3b rounds: no FK; FK + B deletes first; FK + A inserts first. s4c: A sets `maintenance_work_mem = '1MB'`, runs plain `CREATE INDEX` inside `BEGIN … pg_sleep(3) … COMMIT`, then CIC on `(code, customer_id, status, signed_at)`, CIC inside `try_sql` (25001), and a `-- EXPECT-ERROR 23505` unique CIC on `store_id` followed by `indisvalid` and `DROP INDEX`; B times its `UPDATE` and reads `pg_locks`/`pg_stat_progress_create_index`. s8b: round 1 `post_transfer_naive(…, p_pause)` locks from→to, 1→2 and 2→1 together; round 2 `post_transfer`. B always ends with the grid.
   - **s3c:** `poly_comments(commentable_type, commentable_id)`, `arc_comments(post_id, product_id, CHECK (num_nonnulls(post_id, product_id) = 1))`, `commentables` supertype; one delete attempt per pattern.
   - **s4a:** `e4a_contracts` copied from `hw_contracts`; per ALTER, `pg_relation_filenode` before/after + ms; `pg_locks.mode` inside `BEGIN … ROLLBACK`; 5 all-NULL spare columns via `pg_column_size(row)`; template table with/without `updated_at` trigger.
   - **s4b:** 200,000 rows, `channel = 'grab'` ≈ 1 %; `ANALYZE` before each `plan_of`. **s6c:** 100,000 posts × 1–4 of 30 tags.
   - **s5:** incompressible 3,000-char text from `string_agg(md5(random()::text), '')`; 1,000,000-row float sum via `generate_series`.
   - **s6a:** recursive CTE for float8/float4/numeric bisection; `row_number()*1000` renumber. **s6b:** 50 homestays × 365 days from fixed `2026-11-01`; DST via `AT TIME ZONE`.
   - **s7:** 1,000,000 clicks + plain `VACUUM ANALYZE`; views on `orders`/`order_lines`; updatable view on copy `e7_orders`.
   - **s8a:** drops/recreates `wallets(id, code, kind, allow_negative, balance numeric(18,2), version, created_at timestamptz, CHECK (allow_negative OR balance >= 0))`, `ledger_txns(id, kind, idempotency_key UNIQUE, created_at)`, `ledger_entries(id, txn_id fk, wallet_id fk, amount numeric(18,2) CHECK (amount <> 0), created_at)` + FK indexes; statement-level `AFTER INSERT … REFERENCING NEW TABLE` balance trigger; `BEFORE UPDATE OR DELETE` immutability trigger; `post_transfer(p_key, p_from, p_to, p_amount)` = insert txn → `… ORDER BY id FOR UPDATE` → debit then credit → one 2-row entry `INSERT`; 1 system + 3 store wallets; 100,000 balanced history pairs; `ledger_reset_demo()` for s8b.
   - **hw-flight-check.sql:** first CTE `SELECT 'hw_'::text AS p`; checks prefixed flights/fares-or-seats/passengers/bookings/tickets, template columns, `numeric` money, indexed FKs, no float/real, `timestamptz` instants, `UNIQUE (flight_id, seat_no)` or `EXCLUDE`, ticket→booking reference direction. `hw-flight-solution.sql` uses prefix `hwsol_`.
   - **Prisma drill:** `schema.ai.prisma` (OmniPOS ledger "by AI") seeds P1 `balance Float`, P2 `DateTime` without `@db.Timestamptz(3)`, P3 relation scalar without `@@index`, P4 `targetType`/`targetId` polymorphic, P5 `relationMode = "prisma"`, P6 bare `Decimal` + absolute balance write, P7 trusting `@updatedAt` for raw SQL. `schema.fixed.prisma` adds a comment block with the migration SQL Prisma cannot express (`CHECK`, triggers).
2. **Controller run order:** s1, s2, s3a, s3b (pair), s3c, s4a, s4b, s4c (pair), s5, s6a, s6b, s6c, s7, s8a, s8b (pair). After each run, execute `check.sql` (`check-after-<id>`), which must stay all ✔. For hw: run the check with the prefix replaced (`sed "s/'hw_'::text/'zz_'::text/"`, expecting all ✘), then the solution, then the check with `'hwsol_'` (expecting all ✔).
3. **DBX smoke test:** run `s5-data-types.sql` as one script through DBX MCP (`ADVANCE_BE_LAB`); the final grid must match `runs/s5.txt`. If DBX stops early or hides the last grid, the guide tells the learner to run the last block alone.
4. **Prisma evidence** goes into `runs/prisma-evidence.txt`, with dated lines:
   - (a) a read-only grep of `D:/study/job/quan-ly-hop-dong/apps/api/prisma/migrations/*/migration.sql` that counts `TIMESTAMP(3)`, `TIMESTAMPTZ`, `DECIMAL(`, `DOUBLE PRECISION`, `FOREIGN KEY` vs `CREATE INDEX` on those FK columns
   - (b) WebFetch of the Prisma docs pages (PostgreSQL native type mappings, `relationMode` "you must add indexes", unsupported database features/CHECK via customized migration, `@updatedAt`, scalar lists + GIN `@@index(type: Gin)`, and the open polymorphic-relations issue), each recorded as URL + quoted sentence
   - A drill item without evidence is dropped, not asserted.
5. **Deviations:** for every ✘, rerun once, and up to 3 times for pair runs. If the ✘ persists, add an entry to `P/verify/deviations.md` (id, expected, actual, new narrative or chip) and update `slides.json`/the matrix chip. Never edit the run files.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| Every file starts with the frozen header | 0 files missing it | `for f in L/s*.sql L/hw-*.sql; do head -3 "$f" \| grep -q 'search_path = lab07_modeling' \|\| echo MISSING $f; done` |
| No write outside the schema | 0 matches for schema-qualified writes to sources | `grep -nE '(INSERT INTO\|UPDATE\|DELETE FROM\|ALTER TABLE\|DROP TABLE\|CREATE TABLE)\s+(lab03_indexing\|lab12_transaction\|lab14_locking\|lab_imdb\|northwind\|public\|maycha_lease)\.' L/*.sql` |
| Runs recorded | 15 + `hw-*`, all `[exit 0]` | `grep -L '\[exit 0\]' L/runs/s*.txt` → empty |
| Assertions | `✘` count 0 or all listed in `deviations.md` | `grep -c '✘' L/runs/s*.txt` |
| Unmarked errors | 0 | V11 of the verifier (run with `--runs-only`) |
| Rerun idempotency | s2, s3a, s8a rerun → same grids | `diff` vs `<id>-rerun.txt`, `Time:`/ms stripped |
| Fixtures intact | `check-after-<id>` all ✔ | `grep -c '✘' L/runs/check-after-*.txt` → 0 each |
| Homework checker | `hw-red` all ✘, `hw-green` all ✔ | as in step 2 |
| `widget_json` parses | every `runs/<id>.json` is valid JSON | `node -e "for (const f of process.argv.slice(1)) JSON.parse(require('fs').readFileSync(f,'utf8'))" L/runs/*.json` |

## Verification

```bash
node P/tools/verify-guide.mjs --runs-only    # V11 + JSON validity on L/runs
bash P/tools/run-lab.sh check.sql check-after-all && grep -c '✘' L/runs/check-after-all.txt   # 0
```

## Risks and rollback

- Delegates write SQL blind: the controller fixes small errors; a wrong design goes back to its delegate via SendMessage with the run file.
- s3a's FK insert takes about 4 s in DBX; the guide warns. Disk use is about 250 MB, reclaimed by `99-cleanup.sql`.
- Rollback: rerun `00-setup.sql`; experiments drop their own `e*` tables at start.

=== FILE: phase-04-guide-fragments.md ===
---
phase: 4
title: "Guide fragments"
status: pending
priority: P1
effort: 2.5h
dependencies: [3]
---

# Phase 4: Guide fragments

## Goal

Write each stage's Vietnamese HTML fragment, widget JS and quiz from recorded runs against the frozen contract; a delegate starts as soon as its runs are recorded.

## Files to create/modify

All files are under `P/build/fragments/`. Each delegate also owns the `.js` and `.quiz.json` with the same stem.

| Owner | Files |
|---|---|
| controller | `00-hero-cach-hoc.html`, `99-closing.html` (phỏng vấn, cheat sheet, bản đồ slide, tham khảo, tiếp theo), `P/build/exam.json` |
| D1 | `10-chang-1.*`, `20-chang-2.*` |
| D2 | `30-chang-3.*` |
| D3 | `40-chang-4.*`, `50-chang-5.*` |
| D4 | `60-chang-6.*`, `70-chang-7.*` |
| D5 | `80-chang-8.*`, `90-bai-tap.html`, `92-prisma-drill.html` (quiz 9 = drill) |

## Tasks and steps

1. **Stage skeleton (lesson-14 order):** `stage-head` → goal → `dl.wwh` (LÀ GÌ / TẠI SAO / KHI NÀO KHÔNG) → `figure.slide-fig` (existing `assets/7_Data_Modeling/page_NN_*.png`, `onerror` hide) → `sayvs` pair `callout cite-mysql` "Slide nói" / `callout pg` "PG 16 đo được" with chip and `id="sl-N"` → full SQL `pre[data-src]` → recorded excerpt → widget → **Làm mẫu** (one query, what to read in the DBX grid) → **Tự làm** (task, acceptance criteria, `data-store` inputs, DoD checklist) → quiz (4–5 questions, each `why` cites a run id).
2. **Tự làm per stage** (checkable by a grid or a `my_*` table): 1 place `order_id` for payment + donation and sketch the ERD; 2 decompose the ship-by employee columns of `nf_flat` into `my_*` and prove the update anomaly is gone; 3 add the FK index on `e3a_child`, re-read trigger time, pick a pattern for "attachments on contracts/stores"; 4 write `my_stores` from the template (identity, status, `data jsonb`, version, `timestamptz` audit + trigger) and prove `updated_at` moves; 5 type 6 OmniPOS fields with W6 and justify one with `pg_column_size`; 6 write a numeric-midpoint reorder plus renumber; 7 rewrite the window view so the filter is pushed down and show the plan change; 8 post a 3-leg txn (100 → store 97 + fee 3) and show L1–L4 ✔.
3. **Widgets** (each teaches one mechanism, reads only its stage's `run()` data, renders nothing if absent):

| Widget | Data | Mechanism shown |
|---|---|---|
| W1 ERD explorer (inline SVG, static layout) | s1 | table types, child→parent reference direction |
| W2 normalization stepper UNF→3NF | s2 | functional dependency and anomaly count per step |
| W3 FK race lanes + cost bars | s3b, s3a | orphan vs 23503 vs wait; RI trigger time with/without index |
| W4 polymorphic comparator | s3c | orphans, typo accepted, FK possible, Prisma support |
| W5 DDL board | s4a, s4c | rewrite (filenode), ms, lock mode; plain vs CIC wait |
| W6 type picker | s5 | PG type, bytes, measured trap |
| W7 float bisection | s6a | JS float64 and `Math.fround` midpoints until equal to a bound, vs PG 53/24; renumber fix |
| W8 booking range checker | s6b | `[)` overlap rule, recorded 23P01 or accept |
| W9 view plan toggle | s7 | inlined vs pushed-down vs Subquery Scan, MV staleness |
| W10 ledger simulator | s8a, s8b | entries, per-txn and global sum, reconciliation, recorded SQLSTATEs; naive vs ordered transfers |

4. **Stage 8** links Lab 14.01 (`CHECK` 23514) and Lab 14.05 (`ORDER BY id FOR UPDATE`) and closes with "Mang sang OmniPOS Pha B" (models from `schema.fixed.prisma`).
5. **Two-session parts** (s3b, s4c, s8b): optional `table.walk` for DBX `ADVANCE_BE_LAB` / `ADVANCE_BE_LAB_B` (`Tx: [M]`); the recorded timeline is always shown.
6. **Controller fragments:** hero (eyebrow "Advance Backend · Bài 07 · Cụm 1 · sau Bài 14", h1 "Data Modeling", meta counts, slide 1 epigraph); `#cach-hoc` (stage table, prep: `docker start …` → DBX `Ctrl+A` on `00-setup.sql` → `check.sql` shows `✔ n/n`, duplicate connection for two-tab parts, chip legend, `l07-warmup`); `99-closing.html` with 10 interview questions (`exam.json`), cheat sheet (types, NF rules, FK needs an index, ledger rules, view rules, Prisma mapping), `#ban-do-slide`, `#tham-khao` (slide 36 links, PG 16 docs `ddl-alter`, `sql-createindex`, `datatype-json`, `datatype-character`, `datatype-numeric`, `datatype-datetime`, `ddl-constraints`, `sql-createview`, `rules-materializedviews`, Prisma pages from the evidence), `#tiep-theo` (OmniPOS Cụm 1 Pha B, Boss Challenge 1 on qlhd, then Cụm 2 Bài 06 Redis).

## Test matrix

| Test (before writing prose) | Expected | Command |
|---|---|---|
| A fragment linted alone | V1, V3–V7, V9, V10 pass for that fragment | `node P/tools/verify-guide.mjs --fragment P/build/fragments/30-chang-3.html` |
| The fragment's `b.m` numbers trace | 0 untraced | same |
| Quiz JSON | ≥ 4 items, `ans` in range, every `why` names a run id | same |
| Classes in the vocabulary | 0 unknown classes | same (V14 class whitelist in fragment mode) |

## Verification

```bash
for f in P/build/fragments/*.html; do node P/tools/verify-guide.mjs --fragment "$f" || echo FAIL $f; done
```

## Risks and rollback

- Stale numbers: cite only `L/runs/*`; V4 catches mismatches.
- Size creep: ≤ 30 KB per stage fragment incl. JS (`wc -c`).
- Rollback: delete `P/build/fragments/<stem>.*`; fragments are independent.

=== FILE: phase-05-assemble-verify-render.md ===
---
phase: 5
title: "Assemble, verify, render"
status: pending
priority: P1
effort: 1h
dependencies: [4]
---

# Phase 5: Assemble, verify, render

## Goal

Build `G` deterministically; pass the verifier and render-check in light and dark.

## Files to create/modify

| File | Owner |
|---|---|
| `P/tools/build-guide.mjs` (complete) | controller |
| `G` (generated, never hand-edited) | controller |
| `P/verify/render-light/`, `P/verify/render-dark/` (screenshots + reports) | controller |

## Tasks and steps

1. `build-guide.mjs` concatenates `shell-head.html`, `<body><div class="shell"><main>`, fragments in `order.json` order, `</main></div>`, one `<script type="application/json" id="run-<id>">` per used `L/runs/<id>.json`, then `<script>` with `GUIDE_DATA_START` (`SLIDES`, `QUIZ` keyed by `data-quiz`, `EXAM`) `GUIDE_DATA_END`, `runtime.js` and each fragment `.js` wrapped in `(() => { … })();`; it fills every `pre[data-src]` with the escaped file text.
2. Build, then verify.
3. render-check (light):
   ```bash
   TMP=P/verify/tmp TEMP=P/verify/tmp node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs G --out P/verify/render-light
   ```
4. Dark: copy `G` to `P/verify/render-dark/guide-dark.html`, inject `data-theme="dark"` on `<html>` and `<base href="file:///D:/study/advance-be/reports/advanced_backend/">`, render, delete the copy.
5. Inspect 375 px screenshots of W1, W5, W7, W10: SVG scales (`viewBox`, `width:100%`), tables sit in `.table-wrap`.
6. Fix fragments, never `G`; rebuild until clean.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| Verifier self-test still passes | exit 0 | `node P/tools/verify-guide.mjs --self-test` |
| Full verification | exit 0, all of V1–V13 printed as ok | `node P/tools/verify-guide.mjs --html G` |
| Determinism | building twice gives an identical file | `node P/tools/build-guide.mjs && sha1sum G` twice |
| Hand edit detected | change one SQL char in `G` → V3 fails; rebuild restores it | manual mutation, then rebuild |
| Render, 3 widths, light and dark | 0 runtime errors, 0 horizontal overflow, no touch target < 44 px reported as error | render-check output |
| Size | ≤ 360 KB | `wc -c G` |

## Verification

```bash
node P/tools/build-guide.mjs && node P/tools/verify-guide.mjs --html G; echo $?   # 0
grep -c 'l14-' G                                                                  # 0
grep -c '<script src' G                                                           # 0
```

## Risks and rollback

- render-check needs Chrome; its profile goes to `P/verify/tmp` (deleted after).
- Rollback: delete `G`; it is generated.

=== FILE: phase-06-ultra-code-review.md ===
---
phase: 6
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1.5h
dependencies: [5]
---

# Phase 6: Ultra code review and fixes

## Goal

Run `/ak:code-review --ultra` (5 independent reviewers + verifier, union of verified findings) on guide, labs and tools; fix Critical/Important in source files; re-pass all gates.

## Files to create/modify

| File | Owner |
|---|---|
| review report (path chosen by the review skill under `P/reports/`) | reviewer agents |
| any `L/*.sql`, `P/build/*`, `P/tools/*` named by a verified finding | controller |
| `L/runs/*` (re-recorded only by rerunning) | controller |

## Tasks and steps

1. Reviewers get `G`, `L/*.sql`, `L/runs/`, `P/tools/`, `P/contract.md`, the matrix, `evidence-packet.md` §2/§6 and the rubric hard constraints, not our conclusions.
2. Review focus: PG 16 correctness of each "PG 16 đo được" sentence vs its run; safety (schema writes, header, timeouts, secrets); traceability; Vietnamese clarity without over-engineering; accessibility (44 px, labels, `aria-live`); widget logic vs data.
3. Triage: fix Critical/Important; fix Minor if < 5 min, else list in the handoff; reject findings that reverse a settled evidence-packet decision, citing the source.
4. SQL change → rerun that experiment → check → rebuild → verify → render. Fragment change → rebuild → verify → render.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| Each fix has a regression check | the verifier or `check.sql` row that would have caught it passes; if no check could catch it, add a self-test mutation first | `node P/tools/verify-guide.mjs --self-test` |
| Re-gate | G3 (runs ✔/deviations) and G5 (verify + render) pass again | Phase 3/5 commands |
| Findings closed | 0 open Critical/Important in the review report | read the report |

## Verification

```bash
node P/tools/verify-guide.mjs --self-test && node P/tools/build-guide.mjs && node P/tools/verify-guide.mjs --html G
bash P/tools/run-lab.sh check.sql check-after-review && grep -c '✘' L/runs/check-after-review.txt   # 0
```

## Risks and rollback

- Review churn on style: only Critical/Important block the gate.
- Rollback for a bad fix: revert the source file to the version the reviewers saw (the controller keeps a copy in `P/verify/pre-review/` before editing), then rerun and rebuild.

=== FILE: phase-07-docs-final-gate-handoff.md ===
---
phase: 7
title: "Docs, final gate, handoff"
status: pending
priority: P2
effort: 0.75h
dependencies: [6]
---

# Phase 7: Docs, final gate, handoff

## Goal

Make the guide discoverable, prove the final state, leave Đạt a start note.

## Files to create/modify

| File | Owner | Change |
|---|---|---|
| `D:/study/advance-be/README.md` | controller | Line 14: add `labs/lesson-07-data-modeling/`. Tree: add `lesson_07_data_modeling_teacher_guide.html` before `lesson_12_…` and `lesson-07-data-modeling/` before `lesson-12-transaction/` |
| `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` | controller | Row 07 column 5: `*ERD Design & DDL scripts*` → `` `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`<br>`labs/lesson-07-data-modeling/` `` |
| `D:/study/advance-be/plans/handoffs/lesson-07-guide-ready-start-stage0-20261027-<HHMM>.md` | controller | new |
| `P/plan.md` (status via `ak plan` CLI only) | controller | — |

Old lines kept for rollback: README line 14 is `- 🔬 **Mã nguồn Labs thực hành (PostgreSQL & Redis)**: \`labs/lesson-02-caching/\`, \`labs/lesson-03-index/\`, \`labs/lesson-12-transaction/\`, \`labs/lesson-14-locking/\``. The TONG_QUAN row 07 cell is `*ERD Design & DDL scripts*`.

## Tasks and steps

1. Read both docs, edit only the lines above, `ls` each new path.
2. Final gate: `check.sql` (`check-final`), C7 vs `fingerprint-baseline.txt`, verify + self-test, `git status --short` shows only `L/`, `G`, `P/`, the two docs and the handoff.
3. Handoff (Vietnamese, ≤ 60 lines): start steps (`docker start quan-ly-hop-dong-postgres-1` → DBX `ADVANCE_BE_LAB` → `00-setup.sql` → `check.sql`), stage order and timing, which parts need `ADVANCE_BE_LAB_B` `Tx: [M]`, the lesson 14 stage 5 dependency, `99-cleanup.sql`, open Minor findings, next step (OmniPOS Pha B).
4. Update the plan status with the `ak plan` CLI (run `ak plan --help` first). Leave everything uncommitted.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| Doc links resolve | every new path exists | `ls D:/study/advance-be/labs/lesson-07-data-modeling D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` |
| Sources unchanged | C7 `actual` equals the baseline values | `grep C7 L/runs/check-final.txt` vs `L/runs/fingerprint-baseline.txt` |
| Final verify | exit 0 | `node P/tools/verify-guide.mjs --html G` |
| No git side effects | `git status` shows only expected paths; no new branch | `git -C D:/study/advance-be status --short && git -C D:/study/advance-be status \| head -1` (on `main`) |

## Verification

```bash
bash P/tools/run-lab.sh check.sql check-final && grep -c '✘' L/runs/check-final.txt   # 0
node P/tools/verify-guide.mjs --html G; echo $?                                         # 0
git -C D:/study/advance-be status --short
```

## Risks and rollback

- Other uncommitted work in those docs: read first, edit single lines only.
- Rollback: restore the quoted old lines; delete the handoff.
