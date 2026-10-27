=== FILE: plan.md ===
---
title: "Lesson 07 Data Modeling teacher guide (DBX-first, PG 16 measured)"
description: "Single-file Vietnamese teacher guide for all 43 slides plus 1NF-3NF, polymorphic and a double-entry ledger capstone, backed by recorded SQL runs on PG 16."
status: pending
priority: P1
effort: 9h
branch: main
tags: [lesson-07, data-modeling, teacher-guide, postgresql, dbx, ledger, tdd]
blockedBy: []
blocks: []
created: 2026-10-27
---

# Lesson 07 — Data Modeling teacher guide

## Overview

Đạt gets `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` for tomorrow (Day 05): the lesson-14 single-column shell, 8 stages covering slides 1–43, normal forms on a flat Northwind order sheet, polymorphic association, and a double-entry ledger (`wallets`, `transfers`, `ledger_entries`) posted with lesson-14 locking. Every experiment is a self-contained SQL file in `labs/lesson-07-data-modeling/` that he runs in DBX (`Ctrl+A → Run`; two tabs for A/B steps). The controller records each file's output via `docker exec … psql` into `runs/`, and every number in the guide traces to one of those files. Test-first means `check.sql`, `spec/expected.json` (claim → expected PG 16 result → chip) and `tools/verify-guide.mjs` exist and fail red before any experiment or HTML is written. All writes go to schema `lab07_modeling`, nothing is committed, and no git step runs except `git status`.

Root for every relative path: `D:/study/advance-be/`. `P` = `plans/261027-1328-lesson-07-data-modeling-teacher-guide`. `L` = `labs/lesson-07-data-modeling`.

## Stage map (one day: 280 min core + 60 min evening)

| Stage (anchor) | Slides / topic | Min | Experiments (files in `L/`) | Widget | Tự làm (challenge) |
|---|---|---|---|---|---|
| 0 `#cach-hoc` | 1–4 title, outline; DBX setup | 10 | `00-setup.sql`, `check.sql` | — | warm-up note `l07-warmup` |
| 1 `#chang-1` | 5 process, 6–8 ERD + table types, 12 where the reference column goes | 20 | `01-erd-reference.sql` | W1 ERD (inline SVG, FK list from run) | ERD + reference column for OmniPOS vouchers |
| 2 `#chang-2` | 9–10 + **1NF → 2NF → 3NF**, anomalies, denormalization | 40 | `02-normal-forms.sql` | W2 normalization stepper | normalize a "phiếu nhập kho" sheet, lossless EXCEPT = 0 |
| 3 `#chang-3` | 11 FK cost, missing FK index, app-check race; **polymorphic** | 40 | `03-fk-cost-index.sql`, `03b-orphan-race.A/B.sql`, `03c-polymorphic.sql` | W3 FK cost bars + A/B lanes | add the FK index, rewrite poly as exclusive arc |
| 4 `#chang-4` | 13–18 ADD COLUMN, JSON, JSON index, spare columns, CREATE INDEX / CONCURRENTLY | 35 | `04-add-column-jsonb.sql`, `04b-create-index-lock.A/B.sql` | W4 rewrite meter + lock-compat mini matrix | write a safe migration (lock_timeout, CIC) |
| 5 `#chang-5` | 19–20 table template, 21–25 types, NULL | 35 | `05-data-types.sql` | W5 type picker | pick types for OmniPOS `orders` |
| 6 `#chang-6` | 26–31 i18n JSON, ordering, homestay 365 rows, exclusion constraint, calendar slots | 35 | `06-case-studies.sql`, `06b-double-booking.A/B.sql` | W6 float-bisection simulator + 365-day strip | rebalance exhausted positions |
| 7 `#chang-7` | 32 tags, 33 report, 34 recap, 38–43 views / MV | 30 | `07-tags-report-views.sql` | W7 view-vs-MV plan toggle | MV for clicks per day, stale vs refreshed |
| 8 `#chang-8` | **Double-entry ledger** capstone (+ slide 20 `version`, lesson 14 locks) | 50 | `08-ledger.sql`, `08b-ledger-concurrent.A/B.sql` | W8 ledger posting simulator | 3-leg payment with fee, L2–L4 stay ✔ |
| Tối `#bai-tap` `#prisma` | 35 homework flight booking, 36 refs, 37 thank you; Prisma 7.9 drill | 60 | `hw-flight-booking.mine.sql`, `hw-flight-booking.check.sql`, `prisma-drill/*.prisma` | — | self-check all ✔; find ≥ 6 seeded mistakes |

Core 280 min (4 h 40) + 15 min buffer; homework/Prisma marked "tối Day 05 · tùy chọn mở rộng" in the plan table.

## Phases

| # | Phase | Effort | Depends on | Gate (must pass to continue) |
|---|---|---|---|---|
| 01 | [Contract and tests first](phase-01-contract-and-tests-first.md) | 1h | — | recorder self-tests pass; `verify-guide.mjs --lint` and full mode run red with the listed failures |
| 02 | [Setup SQL and baseline](phase-02-setup-and-baseline.md) | 45m | 01 | baseline fingerprint recorded; setup ×2 idempotent; `check.sql` 0 ✘; DBX smoke OK |
| 03 | [Experiments and recorded runs](phase-03-experiments-and-recorded-runs.md) | 2h15 | 02 | every run recorded with manifest hash; `verify-guide.mjs --runs` green (DIFFs resolved as `revised`) |
| 04 | [Guide fragments and assembly](phase-04-guide-fragments-and-assembly.md) | 2h45 (wall ~1h30, 4 delegates) | 03 | assembled HTML exists; assembler exit 0 |
| 05 | [Guide verification and render check](phase-05-guide-verification-and-render.md) | 40m | 04 | `verify-guide.mjs` green; mutation tests red; render-check 375/768/1440 light+dark clean; `check-final` equals baseline |
| 06 | [Ultra code review and fixes](phase-06-ultra-code-review-and-fixes.md) | 1h | 05 | no open Critical/Important; Phase 05 gate re-run green |
| 07 | [Docs, final gate, handoff](phase-07-docs-final-gate-handoff.md) | 25m | 06 | README + TONG_QUAN row 07 updated; final gate green; handoff written; `git status` shows only expected paths |

Strictly sequential; only Phase 04 fans out (disjoint fragment files against the frozen contract).

## Expected-result matrix (seed of `P/spec/expected.json`; chips: ✅ `Đúng trên PG16`, 🔵 `MySQL đúng, PG khác`, 🔴 `Cần sửa`)

| Exp | Slide claim | Expected PG 16.15 result (asserted by regex on run file) | Chip |
|---|---|---|---|
| E01 | 12 "later entity holds the reference" | in one tx, `pg_stat_xact_user_tables`: design A (tx.order_id) orders `n_tup_upd = 0`; design B (orders.payment_id) orders `n_tup_upd = 1` per order | ✅ 12; ✅ 5, 7, 8 (table-type comments listed) |
| E02 | 9 normalization pros/cons | 0NF `LIKE '%Tofu%'` count > exact count for product 14; update anomaly → customer has `2` distinct cities; insert anomaly → `23502`; delete anomaly → known products `77 → 76`; lossless join: both EXCEPTs `0` rows | ✅ 9 |
| E02 | 10 denormalization | cached `nf_orders.line_count` reconciliation `0` mismatches, `1` after injected drift (rolled back); flat vs 3NF join timings recorded, no direction asserted | ✅ 10 |
| E03 | 11 "DB checks referenced key on insert" | `EXPLAIN ANALYZE INSERT` 200,000 children: `Trigger for constraint … calls=200000`; no-FK insert has no trigger line; FK time > no-FK time | ✅ fact (slide chip below) |
| E03 | 11 (missing) PG never auto-indexes FK | `pg_indexes` on child shows only `_pkey`; deleting 100 unreferenced parents: RI trigger `calls=100`, time drops ≥ 10× after `CREATE INDEX` on `parent_id` | — |
| E03b | 11 "remove FK, check in app" | A/B: app check → orphan count `1`; with FK, B's DELETE waits for A (FOR KEY SHARE) then `23503` | 🔴 11 |
| E03c | polymorphic | `*_type/*_id`: typo type accepted (`INSERT 0 1`), orphans `> 0` after parent delete; exclusive arc both/none → `23514`; arc parent delete → `23503` | — |
| E04 | 14 ADD COLUMN locks/downtime | 500k copy: `ADD COLUMN note text` and `… int NOT NULL DEFAULT 0` keep `pg_relation_filenode`; `DEFAULT random()` changes it; `numeric(12,2)→(14,2)` keeps it; all hold `AccessExclusiveLock` (pg_locks inside tx) | 🔵 14 |
| E04 | 15 JSON column | jsonb read/write works; `json` keeps duplicate keys, `jsonb` keeps last | ✅ 15 |
| E04 | 16 "no index on JSON" | `data->>'store_id' = '44'` Seq Scan → expression index → Index/Bitmap scan on it; `@>` uses GIN `jsonb_path_ops` | 🔵 16 |
| E04 | 17 spare columns | fast ADD COLUMN (above) removes the need; generated STORED column rewrites (filenode changes) | 🔴 17 |
| E04b | 18 ADD INDEX locks / online DDL | plain `CREATE INDEX` holds `ShareLock`: SELECT passes, UPDATE → `55P03` after 3 s; CIC in tx → `25001`; CIC holds `ShareUpdateExclusiveLock`, A's UPDATE passes while CIC waits (phase name recorded verbatim) | 🔵 18 |
| E05 | 19–20 template | template DDL creates; `version` CAS from lesson 14 referenced | ✅ 19, 20 |
| E05 | 22 VARCHAR vs TEXT | `pg_column_size` text = varchar(255) = `12`; 3,000 chars = `3004`; `varchar(5)` overflow `22001`; ORDER BY on indexed text uses Index Scan | 🔴 22 |
| E05 | 23 number & money | sizes 2/4/8; `int(1)` rejected (code recorded); `0.1+0.2` float8 ≠ 0.3; float8 sum of 1M × 0.1 ≠ 100000 (`100000.00000133288`), numeric `100000.0` | ✅ 23 |
| E05 | 24 timestamp/datetime | timestamptz = timestamp = 8 bytes, date 4; same instant shows `09:00+07` / `02:00+00`; `2038-01-20` and year 294276 accepted | 🔵 24 |
| E05 | 25 avoid NULL | all-NULL row narrower than all-set row; `NOT IN (…, NULL)` → 0 rows; UNIQUE allows 2 NULLs, `NULLS NOT DISTINCT` → `23505`; `IS NULL` uses index | 🔵 25 |
| E06 | 27 multi-language | `COALESCE(t->>'vi', t->>'en', title)` fallback; add `ja` with no ALTER | ✅ 27 |
| E06 | 28 "use float" | int gap 1000 exhausts after `9` midpoints; float8 `53`, float4 `24`; rebalance restores min gap 1000 | 🔴 28 |
| E06 | 29–30 365 rows | new homestay → `INSERT 0 365`; date status via PK Index Scan; conditional 3-night booking `UPDATE 3` | ✅ 29, 30 |
| E06b | 29–30 double booking | exclusion `gist (homestay_id =, stay &&)`: B waits for A, then `23P01`; adjacent `[)` range `INSERT 0 1` | ✅ (extends 29–30) |
| E06 | 31 calendar | weekly 09:00 `America/New_York` slot: UTC `13:00` before, `14:00` after 2026-11-01; Asia/Ho_Chi_Minh stays `02:00` | 🔵 31 |
| E07 | 32 tags array + inverted index | `tags @> ARRAY[…]` Bitmap Index Scan on GIN; join-table plan recorded; typo tag accepted (no integrity) | ✅ 32 |
| E07 | 33 report | exact `count(*)` time vs `reltuples`/EXPLAIN estimate; MV stale after +1,000 rows, correct after `REFRESH … CONCURRENTLY`; HLL: no extension → cite only | ✅ 33 |
| E07 | 40 view not updatable | simple view `UPDATE 1`; GROUP BY view → `55000` | 🔴 40 |
| E07 | 41 MERGE vs TEMPTABLE | no view node in plan; Index Scan on base pkey; predicate pushed below aggregate | 🔵 41 |
| E07 | 42 no materialized views | PG has MV (E07 refresh) | 🔵 42 |
| E07 | 43 practices | check plans on views (E07 plans) | ✅ 43 |
| E08 | ledger capstone | seed invariants hold; one-leg transfer → `23514` **at COMMIT** (deferred trigger); overdraft → `23514` from `wallets_balance_check`, entry count unchanged; reused idempotency key → `23505`; drift → reconciliation `1` row (rolled back) | ✅ 34 recap context |
| E08b | ledger + lesson 14 | B (`ORDER BY id FOR UPDATE`, reverse direction) waits, then `23514` on stale-intent overdraft, retry smaller `UPDATE`; `40P01` × 0; invariants ✔ | — |
| HW | 35 homework | `hw-flight-booking.check.sql`: empty → ✘ rows; reference solution → all ✔ | ✅ 35 |

Slides 1–4, 6, 13, 21, 26, 36–39 carry `chip: null` (title/section/blank). If a run contradicts a row, the run file stays untouched; `expected.json` gets `status: "revised"` with a note, and the chip and narrative follow the measurement.

## Acceptance criteria

1. (P02) `L/00-setup.sql` runs twice with identical summary output; `check.sql` returns all ✔ and no ERROR after each run.
2. (P02, P05) Source fingerprint rows S1–S3 in `runs/check-before-setup.txt` equal those in `runs/check-final.txt`; S4 activity counters for `northwind`, `lab03_indexing`, `lab_imdb`, `public`, `maycha_lease` are equal.
3. (P01, P05) `tools/verify-guide.mjs --lint` passes: every `L/*.sql` sets `search_path = lab07_modeling` in its header, sets `statement_timeout` and `lock_timeout`, and contains no write against another schema.
4. (P03) Each experiment in the matrix has `runs/<id>.txt` whose header SHA-256 matches the current SQL file and whose body SHA-256 matches `runs/MANIFEST.json`.
5. (P03) `verify-guide.mjs --runs` reports every expectation PASS or `revised` with a note.
6. (P05) Slides 1–43 each appear exactly once in `SLIDES`; chips equal `expected.json`; every `href` resolves.
7. (P05) Every `pre[data-src]` and walk-table step equals its source file text; every `pre[data-run]` line and `b.m[data-run]` value exists in its run file; every `script#run-*` JSON equals `runs/<id>.json`.
8. (P05) Storage keys are only `l07-*`; there are no `<script src>` and no external hosts except Google Fonts; there are no connection strings; all `img` files exist; the HTML is ≤ 300 KB.
9. (P05) render-check at 375/768/1440 in light and dark: 0 runtime errors, 0 horizontal overflow, touch targets ≥ 44 px.
10. (P05) Mutation tests (snippet edit, number edit, `l14-` key, stale run) each make the verifier exit 1.
11. (P04) Each stage has a walkthrough, a "Tự làm" challenge with acceptance criteria, ≥ 1 widget fed by recorded JSON, and a 4-question quiz. The guide also has 10 interview Qs, a cheat sheet, a slide map, references and a "Tiếp theo" section that bridges to OmniPOS Cluster 1 phase B / Boss Challenge 1 and then Cluster 2 lesson 06 Redis.
12. (P06) The ultra review has no unresolved Critical/Important findings.
13. (P07) README and `TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 07 link the guide and lab; the handoff note exists; `git status` lists only the new/edited paths named in this plan; nothing is committed.

## Risks and rollback

| Risk | L × I | Mitigation |
|---|---|---|
| DBX splits `$$` bodies (ledger trigger function) | M × H | Phase 02 DBX MCP smoke of `00-setup.sql`; if it fails, the function lives in a separately marked block "bôi đen khối này → Run" and the guide says so |
| psql stdout buffering in Alpine container reorders errors (no `stdbuf`/`script`) | M × M | Phase 01 self-test asserts order; fallback `docker cp` SQL to `/tmp/l07/` and `docker exec -t psql -f` (TTY = line-buffered), then delete the temp dir |
| A/B recorder flakiness | M × M | state polling via `pg_stat_activity`, not stdout markers; fallback documented background psql + `pg_sleep` timeline |
| Learner works on lesson 14 tonight (writes `lab14_locking`) | H × L | S4 strict equality excludes lab12/lab14; reported only |
| Setup too slow for DBX | L × M | budget ≤ 45 s measured; if exceeded, cut `clicks` to 500,000 and update `expected.json` before guide work |
| CIC in DBX Manual Commit → 25001 | H × L | guide tells him to run step 7 of 04b in an auto-commit tab; the 25001 itself is shown as a lesson |
| Measurement contradicts slide/expectation | M × M | runs immutable (manifest hash), `expected.json` revised, narrative follows |
| Delegate fragments drift from contract | M × M | frozen contract, assembler fills snippets/runs/JSON, verifier |

Rollback: DB → run `L/99-cleanup.sql` (`DROP SCHEMA IF EXISTS lab07_modeling CASCADE`, which also removes `btree_gist`). Files → delete the new paths listed in phase files. Docs → restore from `P/verify/tmp/*.before.md` copies taken in Phase 07. No git operations are involved.

## Open questions for the user

1. Should the Prisma drill schema also be compiled with `pnpm prisma validate` inside `D:/study/job/quan-ly-hop-dong` (outside this workspace)? The default plan validates the drill's claims through Prisma docs plus lab runs only, and it does not run the Prisma CLI. (Non-blocking.)

=== FILE: phase-01-contract-and-tests-first.md ===
---
phase: 1
title: "Contract and tests first"
status: pending
priority: P1
effort: 1h
dependencies: []
---

# Phase 01 — Contract and tests first

## Goal
Freeze everything later phases depend on, and write the checks before the code they check: schema contract, fragment contract, run-id list, `expected.json`, `check.sql`, the two recorders and the guide verifier. End red.

## Files to create (owner: controller)

| Path | Purpose |
|---|---|
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/spec/contract.md` | frozen contract (below) |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/spec/expected.json` | matrix from plan.md + `slides[1..43] {stage, anchor, chip, pg}` + `expect[] {exp, run, regex, note, status}` |
| `D:/study/advance-be/labs/lesson-07-data-modeling/check.sql` | ✔/✘ invariants |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/tools/run-lab.mjs` | single-session recorder |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/tools/run-ab.mjs` | two-session recorder |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/tools/verify-guide.mjs` | lint / runs / guide verifier |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/tools/selftest.sql`, `selftest.A.sql`, `selftest.B.sql` | recorder self-tests (no table writes) |

All tools use Node 22 built-ins only (`child_process`, `fs`, `crypto`, `vm`); no npm install.

## Tasks and steps

1. **contract.md** with these frozen parts:
   - *Schema* `lab07_modeling` (setup-owned, deterministic, no `random()`): `order_sheet_0nf` (830, `items` text), `order_sheet` (2,155, PK `(order_id, product_id)`), `nf_customers` 91, `nf_products` 77, `nf_categories` 8, `nf_suppliers` 29, `nf_orders` 830 (+ cached `line_count`), `nf_order_lines` 2,155; `posts` 100,000 (`original_title`, `title_translation jsonb`, `data jsonb`, `tags text[]` + GIN), `tags`, `post_tags`; `products_poly`, `comments_poly` 20,000; `homestays` 200, `homestay_availability` 73,000 (PK `(homestay_id, day)`); `clicks` 1,000,000 (2026-10-25..27); `wallets` 303 (id 0 `system:cash` with `allow_negative`, 1–300 stores, 901/902 demo) with `CHECK (allow_negative OR balance >= 0)`, `version`, template columns; `transfers` 102,001 (`idempotency_key` UNIQUE); `ledger_entries` 204,002 (`amount <> 0`, indexes on `wallet_id` and `transfer_id`); deferred constraint trigger `ledger_balanced` (INSERT/UPDATE/DELETE) raising `ERRCODE 'check_violation'` when a transfer's SUM ≠ 0 or has < 2 legs; `btree_gist` installed `SCHEMA lab07_modeling`; `COMMENT ON TABLE` tags each table as entity / relation (N-M) / support / config. Experiments own only tables prefixed `e0N_`; homework owns `hw_*`.
   - *Snippet header* (first lines of every `L/*.sql`): `-- Bài 07 · <tên> · DBX: <tab>, Ctrl+A → Run`, then `SET search_path = lab07_modeling;`, `SET statement_timeout = '120s';`, `SET lock_timeout = '5s';` (A/B files: `SET application_name = 'l07-A'|'l07-B'`, `idle_in_transaction_session_timeout = '5min'`). Experiments that change setup tables wrap in `BEGIN … ROLLBACK` or reset first (08).
   - *A/B step format*: `-- BƯỚC <n> · <A|B>` starts a step, numbered globally across both files, with `· CHỜ` if the step is expected to block; step 0 = session SETs.
   - *Run ids*: `check-before-setup`, `00-setup`, `00-setup-rerun`, `check-after-setup`, `01-erd-reference`, `02-normal-forms`, `03-fk-cost-index`, `03b-orphan-race`, `03c-polymorphic`, `04-add-column-jsonb`, `04b-create-index-lock`, `05-data-types`, `06-case-studies`, `06b-double-booking`, `07-tags-report-views`, `08-ledger`, `08b-ledger-concurrent`, `hw-check-empty`, `hw-check-solution`, `check-final`. Widget JSON = last result set with single column `widget_json` → `runs/<id>.json`.
   - *Fragment format*: `P/fragments/chang-N.html` (one `<section id="chang-N" class="stage col">`), `chang-N.quiz.json` (array of `{q, opts, ans, why}`), `chang-N.widget.js` (only `WIDGETS['wN-…'] = function (root, data, kit) {…}`). Embeds: `<pre data-src="labs/lesson-07-data-modeling/<file>"></pre>`, `<td data-src="…A.sql#3"></td>`, `<pre class="code terminal" data-run="<id>.txt" data-lines="a-b"></pre>`, `<div class="widget" data-widget="w3-fk" data-run-id="03-fk-cost-index">`, `<b class="m" data-run="<id>">value</b>`. The assembler fills `data-src`, `data-run` excerpts and `script#run-<id>` JSON. Authors type only `b.m` values.
   - *CSS vocabulary*: lesson-14 classes (`callout teacher|key|pg|cite-mysql|warn`, `wwh`, `walk`, `widget*`, `btn`, `bars/bar*`, `lanes/lane`, `pill`, `mx/cellbtn`, `vchip ok|diff|fix|none`, `slide-fig`, `fold`, `panel`, `field(s)`) + new `erd` (SVG: `.ent rect`, `.rel`, `.fk`), `sheet td.dup`, `cal` (day cells), `ledger` (leg rows). SVG colours only via CSS variables.
   - *Storage keys*: `l07-theme`, `l07-warmup`, `l07-cN-*`, `l07-hw-*`, `l07-prisma-*`.
   - *kit*: `{ $, $$, esc, store, press, fmt }`; the dispatcher wraps each widget in try/catch and calls `console.error` on failure.
2. **check.sql**: two statements, so source checks still run before setup. Statement 1 (S rows): S1 `lab03_indexing.hw_contracts` count = 500,000, detail = md5 of `(count, sum(total), min(id), max(id), max(signed_at))`; S2 Northwind counts 91/830/2,155/77/8/29/9/6; S3 md5 of ordered `northwind.order_details`; S4 per-schema `sum(n_tup_ins+n_tup_upd+n_tup_del)` (detail only). Statement 2 (L rows): L1 row counts from the contract; L2 per-transfer SUM = 0 and ≥ 2 legs; L3 global SUM = 0; L4 cached balance = SUM per wallet; L5 no negative non-system balance; L6 constraints and trigger present (`condeferrable`); L7 `btree_gist` in `lab07_modeling`; L8 no lab07 table name exists in another schema; L9 lossless join (both EXCEPTs 0); L10 every setup FK column has a leading index. Output columns: `ma, kiem_tra, ket_qua ('✔'|'✘'), chi_tiet`.
3. **run-lab.mjs** `<sql> [--as id] [--no-record]`: stdin = `\pset pager off`, `\timing on`, `\set VERBOSITY verbose` + file text. It runs `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -a -U postgres -d advance_be_lab -f -` and merges stdout/stderr by arrival. Header: `-- run <id> · <file> · <ISO time +07> · sql_sha256=<h>` plus `SELECT version()` line. Writes `runs/<id>.txt`, extracts `widget_json` → `runs/<id>.json` (fails if JSON.parse fails), and updates `runs/MANIFEST.json {id: {sql, sql_sha256, run_sha256, recorded_at}}`. It never overwrites a run unless `--as` is given again (re-record = new hash, logged).
4. **run-ab.mjs** `<A.sql> <B.sql> --as id`: two persistent psql processes. Steps are sent in global order. After each send, it polls `pg_stat_activity` (by `application_name`) every 200 ms. A step is done at `idle`/`idle in transaction`. `CHỜ` steps must show `wait_event_type = 'Lock'` within 3 s; the recorder records that and moves on. Output: `t+ms A› …` timeline with each step's output, wait start/end and final state, plus the same header/manifest as run-lab.
5. **verify-guide.mjs** modes: `--lint` (criterion 3 and the A/B step format), `--runs` (manifest hashes, SQL hashes, `expected.json` regexes, S-row equality between `check-before-setup` and `check-final`), default (all guide checks of plan criteria 6–8 + `--lint` + `--runs`), and `--guide <path>` to verify a copy. It prints `PASS|FAIL <check> <detail>` and exits 1 on any FAIL.
6. Write the self-test SQL. `selftest.sql` = `SELECT 'truoc'; SELECT 1/0; SELECT 'sau';`. A/B = A `BEGIN; SELECT pg_advisory_xact_lock(7007);`, B `SELECT pg_advisory_xact_lock(7007); -- CHỜ`, A `COMMIT;`.

## Test matrix (written first, run now)

| Test | Command | Expected now |
|---|---|---|
| recorder order | `node P/tools/run-lab.mjs P/tools/selftest.sql --no-record` | `truoc`, `ERROR:  22012`, `sau` in this order; else switch to the `docker cp` + `-t` fallback and re-test |
| A/B blocking | `node P/tools/run-ab.mjs P/tools/selftest.A.sql P/tools/selftest.B.sql --no-record` | B shows `Lock/advisory` wait, finishes after A COMMIT, exit 0 |
| lint red | `node P/tools/verify-guide.mjs --lint` | FAIL `no lab files` |
| guide red | `node P/tools/verify-guide.mjs` | FAIL `guide missing`, FAIL `runs missing` |
| check red | `node P/tools/run-lab.mjs L/check.sql --as check-before-setup` | S1–S3 ✔ (baseline recorded), statement 2 `ERROR … 3F000/42P01` |
| JSON valid | `node -e "JSON.parse(require('fs').readFileSync('P/spec/expected.json'))"` | exit 0; 43 slides; one expectation per matrix row |

(Commands run from `/d/study/advance-be` in Git Bash; `P` and `L` are expanded in the real command.)

## Verification
Every test in the matrix has the "expected now" outcome. `runs/check-before-setup.txt` exists and is the source baseline.

## Risks and rollback
Alpine psql buffering (see plan risks). Rollback: delete `P/spec`, `P/tools`, `P/runs`, `L/check.sql`. Nothing in the DB has changed (self-tests take only advisory locks).

=== FILE: phase-02-setup-and-baseline.md ===
---
phase: 2
title: "Setup SQL and baseline"
status: pending
priority: P1
effort: 45m
dependencies: [1]
---

# Phase 02 — Setup SQL and baseline

## Goal
One idempotent `00-setup.sql` that Đạt runs with `Ctrl+A → Run` in DBX. It builds `lab07_modeling` from read-only sources, makes `check.sql` all ✔, and provides a cleanup script.

## Files to create (owner: controller)
- `D:/study/advance-be/labs/lesson-07-data-modeling/00-setup.sql`
- `D:/study/advance-be/labs/lesson-07-data-modeling/99-cleanup.sql`

## Tasks and steps
1. Header per contract (`statement_timeout = '300s'`). Then `CREATE SCHEMA IF NOT EXISTS lab07_modeling;`, `CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA lab07_modeling;` and an explicit `DROP TABLE IF EXISTS … CASCADE` for every contract, `e0N_` and `hw_` name (no dynamic SQL).
2. Copy the Northwind-derived tables with `INSERT … SELECT` from `northwind.*`. `order_sheet_0nf.items` = `string_agg(product_name || ' x' || quantity, ', ' ORDER BY product_id)`.
3. Generate posts/tags/comments/homestays/availability/clicks with `generate_series` arithmetic (`i % 300 + 1`, `'2026-11-01'::date + d`).
4. Ledger seed: 100,000 top-ups system → store `(i % 300)+1` of `((i*7919) % 500 + 1) * 1000`; 2,000 store→store transfers of `((i*31) % 50 + 1) * 1000`; 901 gets a 100,000 top-up and 902 stays 0. Create the `plpgsql` trigger function and the deferred constraint trigger **before** seeding, so the seed is proven balanced. Recompute balances from SUM, then `ANALYZE`.
5. Close with a "Thẻ dữ liệu Bài 07" SELECT (one row per table: name, rows, type comment) as the guide's stage-0 card.
6. `99-cleanup.sql`: header + `DROP SCHEMA IF EXISTS lab07_modeling CASCADE;`.
7. DBX smoke: open `00-setup.sql` through the DBX MCP execute tool on connection `ADVANCE_BE_LAB`. If the `$$` block is split, move the function into a block marked `-- KHỐI RIÊNG: bôi đen từ đây … đến đây rồi Run` and record that in `contract.md`.

## Test matrix

| Test (written in P01) | Command | Expected |
|---|---|---|
| setup | `node P/tools/run-lab.mjs L/00-setup.sql --as 00-setup` | exit 0; no `ERROR`; elapsed ≤ 45 s (from `\timing`) |
| invariants | `node P/tools/run-lab.mjs L/check.sql --as check-after-setup && grep -c '✘' P/runs/check-after-setup.txt` | `0`; no `ERROR` |
| idempotent rerun | `node P/tools/run-lab.mjs L/00-setup.sql --as 00-setup-rerun` then `diff <(sed -n '/Thẻ dữ liệu/,$p' P/runs/00-setup.txt | grep -v Time) <(sed -n '/Thẻ dữ liệu/,$p' P/runs/00-setup-rerun.txt | grep -v Time)` | empty diff |
| sources untouched | `node P/tools/verify-guide.mjs --runs` | S1–S3 and S4 (strict schemas) equal between `check-before-setup` and `check-after-setup` |
| no foreign writes | `node P/tools/verify-guide.mjs --lint` | PASS for `00-setup.sql`, `99-cleanup.sql`, `check.sql` |
| negative: trigger works | ad-hoc `node P/tools/run-lab.mjs <scratch in P/verify/tmp> --no-record`: `BEGIN; INSERT one leg; COMMIT;` | `ERROR:  23514` at COMMIT (proves L2 cannot be bypassed) |

## Verification
The four tests above pass. Re-run `check.sql` once more after the negative test; it still has 0 ✘.

## Risks and rollback
A slow setup (cut `clicks` to 500k and update contract/expected first). DBX `$$` splitting (step 7). Rollback: `node P/tools/run-lab.mjs L/99-cleanup.sql --no-record`, then delete both files.

=== FILE: phase-03-experiments-and-recorded-runs.md ===
---
phase: 3
title: "Experiments and recorded runs"
status: pending
priority: P1
effort: 2h15
dependencies: [2]
---

# Phase 03 — Experiments and recorded runs

## Goal
Write each experiment file exactly as Đạt will run it, record it serially, and confirm or revise each expectation. Controller only: authoring and running are interleaved per file, so no delegates are used here.

## Files to create (owner: controller), all under `D:/study/advance-be/labs/lesson-07-data-modeling/`
`01-erd-reference.sql`, `02-normal-forms.sql`, `03-fk-cost-index.sql`, `03b-orphan-race.A.sql`, `03b-orphan-race.B.sql`, `03c-polymorphic.sql`, `04-add-column-jsonb.sql`, `04b-create-index-lock.A.sql`, `04b-create-index-lock.B.sql`, `05-data-types.sql`, `06-case-studies.sql`, `06b-double-booking.A.sql`, `06b-double-booking.B.sql`, `07-tags-report-views.sql`, `08-ledger.sql`, `08b-ledger-concurrent.A.sql`, `08b-ledger-concurrent.B.sql`, `hw-flight-booking.mine.sql`, `hw-flight-booking.check.sql`, `hw-flight-booking.solution.sql`, `prisma-drill/schema.ai-draft.prisma`, `prisma-drill/schema.solution.prisma`.
Plus `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/prisma-facts.md` (the only allowed .md artifact: an input for the drill, not a report).

## Tasks and steps (per file: write → lint → record → `--runs` → resolve)
1. **01**: list table types with `obj_description`, then FKs from `pg_constraint` (widget JSON for W1). Inside `BEGIN`, run design A (order + tx.order_id, donation tx with NULL order) and design B (order, payment, `UPDATE orders SET payment_id`), read `pg_stat_xact_user_tables`, `ROLLBACK`.
2. **02**: 0NF LIKE trap vs exact; inside `BEGIN … ROLLBACK`, run the three anomalies on `order_sheet`; redundancy counts (`count(*) - count(DISTINCT company_name)`); sizes; lossless EXCEPTs; `EXPLAIN ANALYZE` of the same report on flat and on 3NF joins; `line_count` reconciliation + injected drift. W2 JSON = 6 sample rows per form + anomaly numbers.
3. **03**: recreate `e03_parent` (20,000), `e03_child_fk`, `e03_child_nofk`. Run `EXPLAIN (ANALYZE, COSTS OFF)` for both 200,000-row inserts. List `pg_indexes`. Inside `BEGIN … ROLLBACK`, delete parents 10,001–10,100 before/after `CREATE INDEX`. Drop the index at the end so a rerun reproduces the result.
4. **03b**: step 0 (A) recreates `e03b_stores`/`e03b_orders_nofk`/`e03b_orders_fk`. Steps: A check exists → B delete store 7 → A insert orphan, COMMIT, orphan count → A `BEGIN`, insert order for store 8 → B delete store 8 `CHỜ` → A COMMIT → B result `23503`.
5. **03c**: poly typo insert, orphan count after parent delete, exclusive arc `CHECK (num_nonnulls(post_id, product_id) = 1)` cases, per-parent join table; all inside `BEGIN … ROLLBACK`.
6. **04**: `e04_contracts` (read-only copy of `lab03_indexing.hw_contracts`), filenode around each ALTER, `pg_locks` inside a tx, `e04_posts` copy + `ANALYZE`, json vs jsonb keys, EXPLAIN around the expression and GIN indexes, generated STORED column. W4 JSON = `{alter, ms, rewrite}`.
7. **04b**: B steps 1–5 plain index / 25001; A step 6 `BEGIN ISOLATION LEVEL REPEATABLE READ` + count; B step 7 CIC `CHỜ` (B `lock_timeout = '60s'`); A step 8 `pg_locks` + `pg_stat_progress_create_index.phase`; A step 9 UPDATE; A step 10 COMMIT; B step 11 `indisvalid`.
8. **05**: string, number, money, time (`SET TimeZone` … `RESET TimeZone`) and NULL demos; `e05_nulls` (1 % NULLs + index); `e05_template_demo` is the slide 19–20 template. W5 JSON = `{field, type, bytes, pitfall}`.
9. **06**: i18n fallback; recursive-CTE bisection (int/float8/float4) and `row_number()` rebalance on `e06_tasks`; new homestay + 365 rows, PK lookup, conditional booking; time slots across the DST change. W6 JSON = bisection counts + 365 `{day, status, price}`.
10. **06b**: step 0 recreates `e06b_bookings` (`EXCLUDE USING gist`); A insert, B overlap `CHỜ`, A COMMIT, B `23P01`, B adjacent insert OK.
11. **07**: GIN vs join plans; typo tag; `e07_clicks` copy, exact vs estimated count, MV + unique index, +1,000 rows, stale vs `REFRESH … CONCURRENTLY`; view plans (inlining, pushdown), updatable vs `55000` in a tx. W7 JSON = plan lines.
12. **08**: reset demo transfers (`idempotency_key LIKE 'demo-%'`, both legs deleted in one statement, balances recomputed) with a comment that real ledgers never delete and post a reversal instead. Then: CTE posting 1→2; one-leg tx → COMMIT `23514`; overdraft 901→902 beyond balance → `23514`, entry count unchanged; duplicate key `23505`; `EXPLAIN ANALYZE` derived SUM vs cached PK read; drift + reconciliation inside `BEGIN … ROLLBACK`; final invariant rows. W8 JSON = wallets 901/902 + outcomes.
13. **08b**: step 0 resets 901 = 100,000 / 902 = 0 via the demo reset. A `BEGIN` + `WHERE id IN (901, 902) ORDER BY id FOR UPDATE` → B same lock `CHỜ` → A posts 70,000 901→902, COMMIT → B posts 80,000 902→901 → `23514`, ROLLBACK → B retries 20,000 → OK → invariant SELECT.
14. **Homework**: `mine.sql` is a scaffold (requirements in Vietnamese comments, template columns, `hw_` prefix, no tables created). `check.sql` is catalog-only, with no DO blocks, and checks ✔/✘ that `hw_flights`, `hw_seats`, `hw_passengers`, `hw_bookings` and `hw_payments` exist, money is `numeric`, times are `timestamptz`, template columns exist, `status` has a CHECK, every FK has a leading index, and a unique or exclusion constraint blocks double seat booking. Record `hw-check-empty` (✘ rows) → run `solution.sql` → record `hw-check-solution` (all ✔) → drop the `hw_` tables with the solution's own cleanup block.
15. **Prisma drill**: the AI draft has ≥ 7 seeded mistakes: `balance Float`, `amount Float`, `DateTime` without `@db.Timestamptz(3)`, relation scalar without `@@index`, polymorphic `commentableType/commentableId`, `tags String` CSV, `status String` without enum. `prisma-facts.md` records a WebFetch of the Prisma 7 PostgreSQL type-mapping and index docs (URL, fetch date, quoted lines: Float→`double precision`, DateTime→`timestamp(3)`, Decimal, `String[]`→`text[]`, CHECK not expressible → custom migration SQL) plus an unpkg check that `@prisma/client@7.9.0/package.json` exists. Never read `node_modules`. Each drill answer cites either a `prisma-facts.md` line or a lab run (E03, E03c, E05).

## Test matrix

| Test | Command | Expected |
|---|---|---|
| lint before record | `node P/tools/verify-guide.mjs --lint` | PASS for each new file |
| record single | `node P/tools/run-lab.mjs L/02-normal-forms.sql --as 02-normal-forms` (same pattern for 01, 03, 03c, 04, 05, 06, 07, 08, hw) | exit 0, `runs/<id>.txt` + `.json` |
| record A/B | `node P/tools/run-ab.mjs L/03b-orphan-race.A.sql L/03b-orphan-race.B.sql --as 03b-orphan-race` (same for 04b, 06b, 08b) | every `CHỜ` step observed waiting; exit 0 |
| rerun idempotence | re-record 03 and 08 with `--no-record` and compare the result lines (ignoring times) | same counts and SQLSTATEs |
| expectations | `node P/tools/verify-guide.mjs --runs` | all PASS; a DIFF → set `status: revised` + `note` in `expected.json`, chip changed if needed, run untouched |
| stale detection | edit one comment in `L/05-data-types.sql`, run `--runs`, revert | FAIL `sql_sha256 mismatch 05-data-types`, then PASS |
| invariants after all | `node P/tools/run-lab.mjs L/check.sql --as check-after-runs` | 0 ✘ |

## Verification
`runs/MANIFEST.json` lists 18 run ids (all ids except `check-final`). `--runs` is green. `check-after-runs` has 0 ✘.

## Risks and rollback
CIC phase or timings differ (revise narrative). An A/B step does not block as expected (recorder fails → fix the step or the fallback recorder). Rollback per file: delete the file and its `runs/<id>.*` and manifest entry, then re-run setup.

=== FILE: phase-04-guide-fragments-and-assembly.md ===
---
phase: 4
title: "Guide fragments and assembly"
status: pending
priority: P1
effort: 2h45
dependencies: [3]
---

# Phase 04 — Guide fragments and assembly

## Goal
Write the Vietnamese guide as fragments in parallel against the frozen contract and recorded runs, then assemble one self-contained HTML file.

## Files and ownership (disjoint)

| Owner | Files (all in `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/fragments/`) |
|---|---|
| Controller | `00-head.html` (lesson-14 `<head>` + CSS copied, plus new contract classes), `01-hero-cachhoc.html`, `90-tail.html` (`#phong-van`, `#cheat-sheet`, `#ban-do-slide`, `#tham-khao`, `#tiep-theo`), `data-slides-exam.js` (SLIDES from `expected.json`, EXAM), `99-iife.js` |
| Controller | `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/tools/assemble.mjs` |
| Delegate D1 | `chang-1.html/.quiz.json/.widget.js`, `chang-2.*` |
| Delegate D2 | `chang-3.*`, `chang-4.*` |
| Delegate D3 | `chang-5.*`, `chang-6.*`, `chang-7.*` |
| Delegate D4 | `chang-8.*`, `bai-tap.html`, `prisma.html` |
| Output (assembler) | `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` |

Delegates read `spec/contract.md`, `spec/expected.json`, their runs, the slides `.md`, and lesson-14 guide lines 1–430 (pattern). They write only their files, run no DB command, and end with the status block.

## Tasks and steps
1. **Before fan-out, the controller writes and tests `assemble.mjs`.** It concatenates head → hero/cach-hoc → chang-1..8 → bai-tap → prisma → tail, then builds `<script>`: `/* === GUIDE_DATA_START === */ var SLIDES, QUIZ = {N: …}, EXAM /* === GUIDE_DATA_END === */`, `var WIDGETS = {}` + widget files, then the IIFE. It fills `data-src`, `data-run` + `data-lines`, and `script#run-<id>` JSON, HTML-escapes everything, and fails on unknown file/run/line ranges.
2. **Each stage section** follows lesson 14. It has a `stage-head`, goal and `dl.wwh`. Slide figures come from `../../Tài Liệu/advanced_backend/assets/7_Data_Modeling/page_NN_*.png` (pages 5, 7, 9, 10, 15, 17, 20, 22, 27–31, 35, 41). A "Slide nói" (`cite-mysql`) vs "PG 16 đo được" (`pg`) box sits at `id="sl-N"` with a `vchip`. Then come the snippet and the run label "Kết quả đã chạy trên máy bạn ngày 27/10/2026 · `<file>` (psql, cùng nội dung bạn chạy trong DBX)" with its excerpt, the widget, the **Làm mẫu** walkthrough and the **Tự làm** panel (task, acceptance criteria, `l07-cN-*` fields, self-check SQL in a `fold`). It ends with `.quiz[data-quiz=N]`.
3. **A/B experiments** render as `table.walk` (# · A · B · Ghi lại). Cells come from step blocks. The guide says to use tab `ADVANCE_BE_LAB` (A) and `ADVANCE_BE_LAB_B` (B, Tx [M]), and to run 04b step 7 with B switched to auto-commit.
4. **Widgets** read only `run(id)` data. W1: click an ERD relation to see the FK column and the slide-12 rule. W2: NF stepper with `td.dup` highlights and recorded anomaly before/after. W3: trigger-time bars plus A/B lanes. W4: ALTER ms + rewrite badge, and a ShareLock/ShareUpdateExclusive vs SELECT/UPDATE matrix. W5: type picker. W6: live JS bisection (float8 native, float4 via `Math.fround`) beside the recorded PG counts, a rebalance button, and a 365-cell `cal` strip. W7: view/MV plan toggle with stale/refresh counts. W8: ledger posting (from/to/amount → ±legs, SUM = 0 badge, recorded `23514` on overdraft, reconciliation, 08b lanes).
5. **Ledger stage** links lesson 14: Lab 14.01 E `CHECK` → 23514, `ORDER BY id FOR UPDATE` → no 40P01, FOR KEY SHARE from FK inserts. It closes with "mang sang OmniPOS Pha B": `wallets`/`ledger_entries` migration and the Boss Challenge 1 targets.
6. **Controller sections**: hero meta (43 slide · 8 chặng · 280 + 60 phút · 32 quiz + 10 phỏng vấn) with the slide-1 epigraph; stage table, DBX prep panel with `00-setup`/`check-after-setup` excerpts, and the warm-up note. 10 interview Qs cover NF anomalies, denormalization, FK cost/index, polymorphic options, PG ADD COLUMN, CIC, jsonb indexing, money types, timestamptz, and double entry + reconciliation. Cheat sheet: a type table, DDL-safety rules, ledger invariants and a Prisma 7 mapping. Slide map from SLIDES. References: slide 36, PG 16 docs (ALTER TABLE, CREATE INDEX, jsonb, datetime, exclusion constraints, views/MV), `prisma-facts.md` URLs, MySQL as cite-only. Tiếp theo: OmniPOS Cluster 1 phase B → Boss Challenge 1 → Cluster 2 lesson 06 Redis.
7. Assemble and run `verify-guide.mjs`. Return per-fragment failures to their owner (or the controller fixes them after delegates finish).

## Test matrix

| Test | Command | Expected |
|---|---|---|
| assembler unit (before fan-out) | `node P/tools/assemble.mjs --dry` with a stub fragment containing one `data-src`, one bad run id | fills the snippet byte-exact; exits 1 naming the bad run id |
| fragments parse | `node -e` JSON.parse of each `*.quiz.json` | each has 4 items, `ans` in range |
| assemble | `node P/tools/assemble.mjs` | exit 0; guide written |
| verifier | `node P/tools/verify-guide.mjs` | remaining FAILs only in Phase-05 render items, otherwise green |

## Verification
Assembly is green. A manual read of one stage in a browser shows no raw `data-src` placeholders.

## Risks and rollback
Delegate overlap: prevented by the table above, and the assembler refuses unknown fragment names. Size > 300 KB: shorten run excerpts via `data-lines`. Rollback: delete `P/fragments`, `tools/assemble.mjs` and the guide file.

=== FILE: phase-05-guide-verification-and-render.md ===
---
phase: 5
title: "Guide verification and render check"
status: pending
priority: P1
effort: 40m
dependencies: [4]
---

# Phase 05 — Guide verification and render check

## Goal
Prove the guide is correct, traceable, safe and usable at three widths in both themes, and prove the verifier itself detects defects.

## Files (owner: controller)
- `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render/` (screenshots + JSON)
- `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/tmp/` (mutation copies, dark copy; deleted at end)
- `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/runs/check-final.txt`

## Tasks and steps
1. Run the full verifier.
2. Mutation tests on copies in `verify/tmp/`: (a) change one character inside a `pre[data-src]`; (b) change one `b.m` number; (c) rename one `data-store` to `l14-x`; (d) append a space to `L/07-tags-report-views.sql` (then revert); (e) add `<script src="https://x">`. Each run must exit 1 with the matching FAIL.
3. Render check in light, then dark: make a copy with `<html lang="vi" data-theme="dark">` at `verify/tmp/dark.html`, with image paths rewritten `../../Tài Liệu` → `../../../../Tài Liệu`.
4. Click-through spot check in the render screenshots: each widget shows data, not "—"; quizzes render 4 questions.
5. `check-final` and the source comparison.

## Test matrix

| Test | Command | Expected |
|---|---|---|
| full verify | `node P/tools/verify-guide.mjs` | all PASS, exit 0 |
| mutations | `node P/tools/verify-guide.mjs --guide P/verify/tmp/mut-a.html` (b, c, e likewise; d on the repo file) | exit 1 with `snippet mismatch`, `value not in run`, `storage key`, `sql_sha256 mismatch`, `external script` |
| light render | `TMP=D:/study/advance-be/P/verify/tmp TEMP=$TMP node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html --out P/verify/render/light` | 0 runtime errors, 0 overflow at 375/768/1440, no touch target < 44 px |
| dark render | same command on `P/verify/tmp/dark.html --out P/verify/render/dark` | same |
| final invariants | `node P/tools/run-lab.mjs L/check.sql --as check-final && node P/tools/verify-guide.mjs --runs` | 0 ✘; S1–S3 and strict S4 equal to `check-before-setup` |
| size | `wc -c reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` | ≤ 307,200 |

## Verification
All rows pass. Delete `verify/tmp/` contents except screenshots.

## Risks and rollback
Render tool needs Chrome; if it is unavailable, record that as a blocker and do not mark the gate passed. Fixes go into fragments → re-assemble → re-run this phase. Nothing to roll back (read-only checks).

=== FILE: phase-06-ultra-code-review-and-fixes.md ===
---
phase: 6
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1h
dependencies: [5]
---

# Phase 06 — Ultra code review and fixes

## Goal
Run an independent review in ultra mode, then fix every verified Critical/Important finding without weakening tests.

## Files
- Read scope: the guide, `L/**`, `P/tools/**`, `P/fragments/**`, `P/spec/**`, `P/runs/MANIFEST.json`.
- Modify (controller): fragments, lab SQL (re-record affected runs), tools. Review reports are written by the review skill under `P/reports/`.

## Tasks and steps
1. Invoke `/ak:code-review --ultra` (5 independent reviewers + verifier, union of verified findings), giving the evidence packet, the rubric and this plan's acceptance criteria. Focus: chip correctness on PG 16, SQL safety, DBX runnability, Vietnamese clarity and "làm mẫu → tự làm", widget accessibility, recorder correctness.
2. Triage. Critical/Important → fix. Minor → fix if under 5 minutes each, otherwise list in the handoff. Reject findings that contradict a recorded run, and cite the run file.
3. If a lab SQL file changes, re-record its run (new manifest hash), re-check `expected.json`, update fragment values, and re-assemble.
4. Re-run the full Phase 05 matrix.

## Test matrix

| Test | Command | Expected |
|---|---|---|
| per-fix regression | the narrowest check for the touched file (`--lint`, `--runs`, or full verify) | PASS |
| gate re-run | Phase 05 matrix | all PASS |
| invariants | `node P/tools/run-lab.mjs L/check.sql --as check-final` | 0 ✘ |

## Verification
The review verdict lists 0 open Critical/Important. The Phase 05 gate is green again.

## Risks and rollback
A fix that changes a number means re-recording, never editing a run file. Rollback of a bad fix: restore the fragment from the review-time copy in `P/verify/tmp/pre-review/` (taken before step 2).

=== FILE: phase-07-docs-final-gate-handoff.md ===
---
phase: 7
title: "Docs, final gate, handoff"
status: pending
priority: P2
effort: 25m
dependencies: [6]
---

# Phase 07 — Docs, final gate, handoff

## Goal
Make the guide discoverable, confirm the final state, and leave Đạt a short start-tomorrow note. No commit.

## Files (owner: controller)
- Modify `D:/study/advance-be/README.md`: line 14 lab list adds `labs/lesson-07-data-modeling/`; tree (lines ~74–85) adds `lesson_07_data_modeling_teacher_guide.html` and `lesson-07-data-modeling/`.
- Modify `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md`: row 07 (line 39), output column → links to the guide and lab.
- Create `D:/study/advance-be/plans/handoffs/lesson-07-guide-ready-start-day05-20261027.md`
- Replace `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/plan.md` status via `ak plan` CLI (check `ak plan --help` first), not by hand.

## Tasks and steps
1. Copy README and TONG_QUAN to `P/verify/tmp/*.before.md`, then make the edits with Edit.
2. The handoff (≤ 40 lines, Vietnamese) covers: guide path; `docker start quan-ly-hop-dong-postgres-1`; DBX `ADVANCE_BE_LAB` → `00-setup.sql` → `check.sql` all ✔; `ADVANCE_BE_LAB_B` for stages 3, 4, 6, 8; the stage table; a note that lesson 14 stages 3–8 stay open (stage 8 explains `ORDER BY id FOR UPDATE` in place); and `99-cleanup.sql`.
3. Final gate.

## Test matrix

| Test | Command | Expected |
|---|---|---|
| links | `grep -n "lesson_07_data_modeling_teacher_guide\|lesson-07-data-modeling" README.md TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` | ≥ 3 hits; paths exist (`ls`) |
| final verify | `node P/tools/verify-guide.mjs` | exit 0 |
| final invariants | `node P/tools/run-lab.mjs L/check.sql --no-record \| grep -c '✘'` | `0` |
| workspace | `git status --short` | only: `labs/lesson-07-data-modeling/`, `reports/advanced_backend/lesson_07_…html`, `README.md`, `TONG_QUAN_…md`, `plans/261027-1328-…/`, `plans/handoffs/lesson-07-…md` (plus pre-existing untracked items) |

## Verification
All four tests pass. Report the guide path and the handoff path to the user.

## Risks and rollback
Doc edit conflicts with parallel sessions: re-read before editing. Rollback: copy back `P/verify/tmp/*.before.md` and delete the handoff file. The lab schema stays for tomorrow (cleanup is the learner's choice).
