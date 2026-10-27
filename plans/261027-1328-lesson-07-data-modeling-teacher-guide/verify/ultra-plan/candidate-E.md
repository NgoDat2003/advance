=== FILE: plan.md ===
---
title: "Lesson 07 Data Modeling teacher guide (DBX-first, PG16-measured)"
description: "Single-file Vietnamese teacher guide for Lesson 07 (43 slides + 1NF-3NF + polymorphic + double-entry ledger) backed by DBX-runnable SQL labs in lab07_modeling."
status: pending
priority: P1
effort: 10h
branch: main
tags: [lesson-07, data-modeling, teacher-guide, postgresql, dbx, ledger, tdd]
blockedBy: []
blocks: []
created: 2026-10-27
---

# Lesson 07 — Data Modeling teacher guide

## Overview

Build `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` on the lesson-14 single-column shell, so Đạt can study it on 2026-10-28 in about 4h55 of core time. Every experiment is a plain `.sql` file in `labs/lesson-07-data-modeling/` that he runs in DBX. The controller runs the same files through `docker exec … psql`, records the output verbatim in `runs/`, and `verify/verify-guide.mjs` proves every guide number traces to a run. All 43 slides get a stage and a verdict chip. Normal forms, polymorphic associations and the double-entry ledger capstone (posted with lesson-14 locking) each get a stage. The work writes only to schema `lab07_modeling` and uses no git command other than `git status`.

## Data flow

1. The read-only sources (`northwind.*`, `lab03_indexing.hw_contracts`) feed `00-setup.sql`, which builds `lab07_modeling`.
2. The `01…09-*.sql` files each drop and recreate their own prefixed tables.
3. `run-lab.sh` writes `runs/*.txt`, plus `.A`, `.B` and `.timeline.txt` for two-session runs.
4. The controller derives `runs/data/wN.json` from those runs.
5. Delegates write `build/fragments/*` against `build/contract.md`.
6. `assemble.mjs` builds the guide HTML.
7. The guide goes through `verify-guide.mjs`, render-check and the ultra review.

## Stage map (study day 2026-10-28, "Day 05")

| Stage | Slides / topic | Core min | Optional | Experiment files (regions in matrix) | Widget |
|---|---|---|---|---|---|
| 0 `#cach-hoc` | 1–2: setup, DBX connections | 10 | – | 00-setup, check | – |
| 1 | 3–8: process, ERD, table types | 20 | – | 01-design-erd | W1 ERD explorer |
| 2 | 9–10 + 1NF→2NF→3NF, denormalization | 35 | – | 02-normal-forms | W2 normalization stepper |
| 3 | 11–12: FK cost, missing FK index, app-check race, reference column | 30 | 10 (hand race) | 03-foreign-keys, 03-fk-race.A/B | W3 A/B race lanes |
| 4 | 13–20: ADD COLUMN, JSON, JSON index, spare columns, online index, template | 35 | 10 (CIC by hand) | 04-table-format, 04-index-online.A/B | W4 DDL meter |
| 5 | 21–25: string, number/money, time, NULL | 25 | – | 05-data-types | W5 type picker |
| 6 | 26–34: i18n, ordering, homestay, calendar, tags, report, recap | 40 | 15 (calendar, MV CONCURRENTLY) | 06-case-studies | W6 bisection, W7 calendar |
| 7 | 38–43: views | 15 | – | 07-views | W10 plan compare |
| 8 | Polymorphic: type+id, exclusive arc, join tables | 20 | – | 08-polymorphic | W8 integrity tabs |
| 9 | Ledger capstone (revisits 12, 19–20, 23) | 45 | 10 (hand race) | 09-ledger, 09-ledger-race.A/B | W9 posting replay |
| Wrap | 35–37: homework, Prisma drill, interview, cheat sheet | 20 | 45 (homework, evening) | hw-check, prisma-drill.schema.prisma | – |
| **Total** | 43 slides + 3 topics | **295** | **90** | | |

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract and baseline](phase-01-contract-and-baseline.md) | 0.5h | – | `build/contract.md` frozen; `runs/00-fingerprint-before.txt` recorded |
| 02 | [Tests first](phase-02-tests-first.md) | 1h | 01 | check.sql returns ✘ for missing schema rather than erroring; `verify-guide.mjs --runs` RED with "missing run" for every row |
| 03 | [Setup, experiments, recorded runs](phase-03-setup-experiments-runs.md) | 3h | 02 | check.sql all ✔; setup re-run idempotent; `--runs` GREEN (or every deviation logged) |
| 04 | [Widget data and Prisma claims](phase-04-widget-data-prisma-claims.md) | 0.75h | 03 | `verify-guide.mjs --data` GREEN |
| 05 | [Guide shell and assembler](phase-05-guide-shell-assembler.md) | 1h | 03 (parallel with 06) | assembler builds the shell with empty stage slots; V01–V03 pass on shell |
| 06 | [Stage fragments (3 delegates)](phase-06-stage-fragments.md) | 1.5h | 01, 04 | `--fragment` GREEN per stage |
| 07 | [Assemble and verify](phase-07-assemble-verify.md) | 0.75h | 05, 06 | full verify GREEN, negative tests RED as expected, render-check clean |
| 08 | [Ultra code review and fixes](phase-08-ultra-review-fixes.md) | 1h | 07 | no open Critical/Important findings; affected checks re-run |
| 09 | [Docs, final gate, handoff](phase-09-docs-final-gate-handoff.md) | 0.5h | 08 | final gate table all pass; handoff note written |

## Expected-result matrix (frozen in `verify/expected.tsv` before any experiment runs)

Chips: OK = `Đúng trên PG16`, DIFF = `MySQL đúng, PG khác`, FIX = `Cần sửa`. "n" means the value is whatever the run records; the regex only asserts its shape or relation.

| ID | Run#region | Slide | Expected PG 16.15 result | Chip |
|---|---|---|---|---|
| X01 | 03#refcol | 12 | `erd_payment_transactions.order_id` nullable; donate row NULL; `erd_orders` unchanged | OK |
| X02 | 02#0nf | 9 | `string_to_table` turns 830 raw orders into 2,155 lines | OK |
| X03 | 02#2nf | 9 | renaming product 1: `UPDATE n` in `order_sheet` vs `UPDATE 1` in `nf_products` | OK |
| X04 | 02#3nf | 9 | deleting single-order customers loses n cities; product without order → 23502 | OK |
| X05 | 02#lossless | 9 | rejoined `nf_*` `EXCEPT` `order_sheet` = 0 rows both ways | – |
| X06 | 02#denorm | 10 | cached `order_total` read without join; one edited line → 1 mismatch | OK |
| X07 | 03#cost | 11 | 200,000 inserts slower with FK than without (both timed) | OK |
| X08 | 03#index | 11 | DELETE parent: RI trigger dominated by child Seq Scan; with FK index ≥10× faster | FIX |
| X09 | 03#error | 11 | 23503 with constraint name in DETAIL | OK |
| X10 | race#nofk | 11 | both app checks pass; orphans = 1 | FIX |
| X11 | race#fk | 11 | B's DELETE waits on A's FOR KEY SHARE, then 23503; orphans 0 | FIX |
| X12 | 04#add-column | 14, 17 | `note text`, `version int NOT NULL DEFAULT 0`: filenode unchanged, few ms; `DEFAULT random()`: filenode changed, ≥100× slower; spare columns unnecessary | 14 DIFF, 17 FIX |
| X13 | 04#lock | 14 | ALTER holds `AccessExclusiveLock` (bridge to L14 stage 3) | DIFF |
| X14 | 04#json | 15, 16 | `data->>'channel'`: Seq Scan → expression index Bitmap/Index Scan; GIN `jsonb_path_ops` on `@>`: Bitmap Index Scan; GIN on `json` → 42704 | 15 OK, 16 DIFF |
| X16 | index-online#plain | 18 | `CREATE INDEX` holds ShareLock; B SELECT returns; B INSERT → 55P03 | DIFF |
| X17 | index-online#cic, 04#cic-txn | 18 | CIC holds ShareUpdateExclusiveLock; A INSERT during CIC succeeds; CIC ends after A commits; CIC in BEGIN → 25001 | DIFF |
| X18 | 04#template | 19–20 | `version` CAS `UPDATE 1` then `UPDATE 0` | OK |
| X19 | 05#string | 22 | text = varchar(255) = 12 bytes; varchar(10) overflow 22001; btree entry > 2,704 bytes → 54000 | DIFF |
| X20 | 05#number, #money | 23 | 2/4/8 bytes; `int(1)` → 42601; `0.30000000000000004`; 1M float8 sum ≠ numeric; northwind `real` revenue ≠ numeric | OK |
| X21 | 05#time | 24 | 8/8/4 bytes; `09:00+07` vs `02:00+00` for one instant; `timestamp` unchanged; year 2100 accepted | DIFF |
| X22 | 05#null | 25 | NULL row smaller; `NOT IN` with NULL → 0 rows vs `NOT EXISTS` n; UNIQUE allows 2 NULLs, `NULLS NOT DISTINCT` → 23505; `IS NULL` uses index | DIFF |
| X23 | 06#i18n | 27 | new `"ja"` key without DDL; `coalesce` fallback | OK |
| X24 | 06#ordering | 28 | int gap exhausted after n; float8 53, float4 24; rebalance = one `UPDATE n` | FIX |
| X25 | 06#availability | 29–30 | 1,095 rows; price change `UPDATE 1`; 3-night booking `UPDATE 3`; overlap retry < 3 → ROLLBACK | OK |
| X26 | 06#exclusion | 29–31 | overlapping `daterange` → 23P01 | OK |
| X27 | 06#calendar | 31 | weekly `tstzrange` slots; week query n rows; tz name kept | DIFF |
| X28 | 06#tags | 32 | `tags @>` with GIN: Bitmap Index Scan; join table uses `tag_id` index | OK |
| X29 | 06#report | 33, 42 | exact count timed; `reltuples` estimate; no `hll`; MV refresh timed; CONCURRENTLY without unique index → 55000 | 33 OK, 42 DIFF |
| X30 | 07#inline | 40–41 | simple view plan = base-table plan, no Subquery Scan | DIFF |
| X31 | 07#pushdown | 41 | filter on GROUP BY key pushed below Aggregate | DIFF |
| X32 | 07#fence | 41–42 | LIMIT/window view: `Subquery Scan`, filter above | DIFF |
| X33 | 07#updatable | 40 | INSERT through simple view works; `WITH CHECK OPTION` → 44000 | DIFF |
| X35 | 08#typeid,#arc,#join | – | type+id: orphans n>0, typo type accepted; arc: two NULLs → 23514, orphans 0; join tables: 0 | – |
| X36 | 09#post,#attacks,#reconcile | – | overdraft 23514; one-sided transfer → 23514 at COMMIT; duplicate key 23505; invariants 0/0/0; drift 1 → repaired 0 | – |
| X37 | ledger-race#unordered | – | exactly one 40P01 (A in this timing); invariants 0/0/0 | – |
| X38 | ledger-race#ordered | – | 0 deadlocks; B waits ≈ A's sleep; both commit | – |
| X39 | hw-check | 35 | solution all ✔; bad fixture ✘ only on H2–H5 | OK |

Slides with chip `null` (title or section slides): 2, 3, 4, 6, 13, 21, 26, 36, 37, 38, 39. Slides 1, 5, 7, 8, 34 and 43 get OK as design advice.

## Acceptance criteria

1. The guide is ≤ 280 KB, loads no external script, and only fonts come from outside (P07).
2. `SLIDES` covers 1–43 exactly once, hrefs resolve, and chips equal `expected.tsv` (P07, V04).
3. Each stage 1–9 has:
   - a goal and `dl.wwh`;
   - a byte-exact `pre[data-sql]`;
   - a recorded run;
   - a worked example;
   - a `callout.challenge` with PASS criteria;
   - 4 quiz questions.
   (P06, V05, V11, V12)
4. Every `b.m`, `pre[data-run]` and `run-wN` value traces to a `runs/` file dated 27/10/2026 (P04, P07).
5. Every `expected.tsv` row matches, or has a `deviations.md` entry plus changed narrative (P03).
6. `check.sql` shows only ✔, including unchanged fingerprints and no registry name outside `lab07_modeling` (P03, P09).
7. A second `00-setup.sql` run gives identical `check.sql` output and leaves `hw_*`/`my_*` untouched (P03).
8. Storage keys are `l07-*` only, there is no rail, and dark and light both work (P07).
9. render-check at 375/768/1440 shows 0 errors, 0 overflow and 0 targets under 44 px (P07).
10. No Critical or Important review finding stays open (P08).
11. README and TONG_QUAN row 07 link the guide and labs, and the handoff exists (P09).
12. There is no branch, commit or push, and `git status` lists only the phase-09 paths (P09).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| DBX mis-splits `$$` bodies or BEGIN/COMMIT scripts | M×H | The phase 03 DBX smoke test decides. Fallback: "bôi đen region → Run Selection", with one plpgsql body per region. |
| DBX session TimeZone ≠ psql (UTC) | M×M | Only `05#time` prints timestamptz, and it sets and RESETs TimeZone itself. |
| Unqualified CREATE lands in `lab03_indexing` | L×H | `SET search_path` opens every region; setup uses qualified names; C07 detects strays. Rollback drops only registry-named objects created today. |
| Two-session timing flakes | M×M | Fixed sleeps, runs repeated 3×, any variance recorded and narrated. |
| Measurement contradicts a slide | M×M | Keep the data, change the chip and narrative, log in `deviations.md`. |
| Lesson 14 stages 3–8 not finished yet | M×M | Stage 9 recaps the 3 locking tools and links L14 `#chang-1`/`#chang-5`. |
| HTML over budget | L×M | Excerpt outputs with `…`, fold long plans, V01 enforces. |

Rollback: `99-cleanup.sql` (`DROP SCHEMA lab07_modeling CASCADE`) removes all DB state. All files are new, so deleting them reverts them. The two one-line doc edits quote their original text in phase 09.

## Open questions for the user

None blocking. One confirmation: the 295-minute core (plus 90 min optional, homework in the evening) sits at the top of the "4–5 h" budget. If Đạt prefers 4 h, stage 7 (views) and the wrap can move to the evening without dropping content.

=== FILE: phase-01-contract-and-baseline.md ===
---
phase: 1
title: "Contract and baseline"
status: pending
priority: P1
effort: 0.5h
dependencies: []
---

# Phase 01 — Contract and baseline

## Goal
Freeze every name that later parallel work depends on, and record source fingerprints before anything writes to the database.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/build/contract.md` | controller |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/runs/00-fingerprint-before.txt` | controller |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/plan.md`, `phase-01-start.md` (replace stub; delete phase-01-start) | controller |

## Tasks and steps
1. Create the folders `build/fragments`, `build/widgets`, `runs/data`, `verify/tmp` inside the plan folder, and `labs/lesson-07-data-modeling/`.
2. Write `build/contract.md` with these frozen sections:
   - **Table registry.** Base tables: `order_sheet`, `order_sheet_raw`. S1/S3: `erd_orders`, `erd_payment_transactions`. S2: `nf_customers`, `nf_products`, `nf_orders`, `nf_order_lines`. S3: `fk_parent`, `fk_child`, `fk_child_nofk`, `race_stores`, `race_contracts`, `race_stores_fk`, `race_contracts_fk`. S4: `ddl_contracts`, `ddl_events`, `tpl_stores`. S5: `ty_samples`, `ty_money`, `ty_nulls`. S6: `cs_posts`, `cs_tasks`, `cs_homestays`, `cs_availability`, `cs_stays`, `cs_time_slots`, `cs_articles`, `cs_tags`, `cs_article_tags`, `cs_clicks`, `cs_click_daily`, `cs_mv_clicks_daily`. S7: `v_order_lines`, `v_customer_revenue`, `v_top_lines`. S8: `poly_posts`, `poly_products`, `poly_comments`, `poly_comments_arc`, `poly_post_comments`, `poly_product_comments`. S9: `wallets`, `transfers`, `ledger_entries`, `post_transfer()`, `ledger_check_balanced()`. Learner-owned, never dropped by setup: `hw_*` (homework, read by hw-check) and `my_*` (stage challenges). None of these names exists in another schema today (checked against the catalog: lab03 `orders`/`users`, lab12/14 `contracts`/`flights`/`bookings` are avoided).
   - **Base DDL** for `order_sheet` (one row per northwind order line: order_id, product_id, order_date, customer_id, customer_name, customer_city, employee_name, product_name, category_name, supplier_name, unit_price real, quantity, discount; PK `(order_id, product_id)`) and `order_sheet_raw` (order_id PK, customer_name, customer_city, items text like `Chai x10; Chang x5`).
   - **SQL file format.** File header comment in Vietnamese (purpose, slides, how to run). Regions are delimited by `-- #region <id> · <title> (slide N)` and `-- #endregion`. Every region's first statement is `SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing`, followed by `SET statement_timeout = '60s'; SET lock_timeout = '5s';` (two-session B regions use `'2s'`). Two-session step markers are `SELECT 'A1' AS buoc, to_char(clock_timestamp(),'HH24:MI:SS.MS') AS luc, '<mô tả>' AS viec;`. No psql meta-commands, so the text runs unchanged in DBX.
   - **Run ids.** `data-run` = run file stem plus optional `#region` (e.g. `05-data-types#money`, `03-fk-race.nofk.timeline`). Widget data ids are `run-w1` … `run-w10`.
   - **Fragment format.** Defined in phase 06. CSS vocabulary: the lesson-14 classes plus `.erd`, `.nf-grid td.dup`, `.cal .day.open|.booked|.blocked`, `.ledger`, `.plan-text mark`, `.callout.challenge`. Storage keys are `l07-c<N>-<slug>`, `l07-warmup`, `l07-theme`, `l07-hw-*`.
   - **Widget JSON shapes** (W1–W10): top-level `sources: [runId…]` plus the fields listed in phase 04.
3. Record the fingerprints (read-only) to `runs/00-fingerprint-before.txt`: row counts of all 8 northwind core tables; `md5(string_agg(order_id||':'||product_id||':'||quantity||':'||unit_price, ',' ORDER BY order_id, product_id))` of `northwind.order_details`; and `count(*), sum(total), max(id)` of `lab03_indexing.hw_contracts`. Also record the DB-level setting from `pg_db_role_setting` and `version()`.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| Registry names absent elsewhere | 0 rows | `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -Atc "<pg_class ⋈ pg_namespace where relname = any(registry) and nspname <> 'lab07_modeling'>"` |
| Fingerprint file complete | contains 91, 830, 2155, 77, 8, 29, 9, 6, 500000 and an md5 | `grep -c -E "^(91|830|2155|77|8|29|9|6|500000)\b" runs/00-fingerprint-before.txt` |

## Verification
Re-run the fingerprint query and `diff` it against the file. It must be identical, since nothing has written yet.

## Risks and rollback
The risk is that contract churn later breaks delegates. The contract is frozen once phase 06 starts; any change after that needs a contract version bump and a re-check of every fragment. Rollback: delete `build/` and `runs/00-*`.

=== FILE: phase-02-tests-first.md ===
---
phase: 2
title: "Tests first: check.sql, expected matrix, verifier, runner"
status: pending
priority: P1
effort: 1h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Write every check before the code it checks exists, and show that each one starts RED.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/labs/lesson-07-data-modeling/check.sql` | controller |
| `D:/study/advance-be/labs/lesson-07-data-modeling/hw-check.sql` | controller |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/expected.tsv` | controller |
| `…/verify/verify-guide.mjs` | controller |
| `…/verify/run-lab.sh`, `…/verify/merge-timeline.mjs` | controller |
| `…/verify/negative-tests.sh`, `…/verify/hw-bad-fixture.sql` | controller |

## Tasks and steps
1. **`check.sql`** (learner runs it in DBX). It uses only qualified names and `to_regclass()` guards so that a missing object yields ✘, not an error. Output columns: `ma | ket_qua (✔/✘/–) | chi_tiet`.
   - C01 schema exists. C02 `btree_gist` has `extnamespace = lab07_modeling`.
   - C03 `order_sheet` = 2155, `order_sheet_raw` = 830. C04 `sum(quantity)` of `order_sheet` equals the northwind sum.
   - C05 northwind counts and md5 equal the phase-01 constants. C06 hw_contracts count, sum and max equal the constants.
   - C07 no registry name outside `lab07_modeling`. C08 `pg_db_role_setting` still `search_path=lab03_indexing, public`.
   - C09–C12 (– until `ledger_entries` exists): unbalanced transfers = 0, Σ all entries = 0, cached-vs-derived balance mismatches = 0, no negative non-system wallet.
   - C13 no `idle in transaction` session whose query mentions `lab07`. C14 no `indisvalid = false` index in `lab07_modeling`.
2. **`hw-check.sql`** (homework self-check, slide 35) prints one ✔/✘ row per `hw_%` table and rule:
   - H1 has a PK.
   - H2 has timestamptz `created_at`/`updated_at`.
   - H3 has `version int`.
   - H4 has no float column named like `price|amount|fare|total|fee`.
   - H5 every FK column leads an index.
   - H6 status columns have a CHECK or an enum.
   - H7 has no `json` (only `jsonb`).
   - H8 a seat UNIQUE or EXCLUDE constraint exists.
   - H0 prints "chưa có bảng hw_*" when there are no `hw_` tables.
3. **`hw-bad-fixture.sql`** (controller-only). It creates `hw_flights`/`hw_bookings` with `fare double precision`, `departs_at timestamp`, an unindexed `flight_id` FK and no `version`.
4. **`expected.tsv`** holds the plan matrix X01–X39 with columns `id, run, region, regex, claim, expected, chip, status(expect|deviation)`. Regexes target psql text, e.g. X21 `09:00:00\+07` and `02:00:00\+00`; X10 `orphans\s*\|?\s*1`; X37 exactly one `40P01`.
5. **`run-lab.sh <file.sql> [region]`**. It runs `docker exec -i -e PGAPPNAME=l07-runner quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -v ON_ERROR_STOP=0 -v VERBOSITY=verbose -a -c '\timing on' -f - < file`. The first line it writes is `-- chạy lúc $(date '+%d/%m/%Y %H:%M %z') · PostgreSQL 16.15 · psql trong container`. Output goes to `runs/<stem>[.<region>].txt` (`--out <name>` overrides it), and nothing in the output contains a connection URL. `run-lab.sh --ab <A.sql> <B.sql> <region> <delayB>` extracts the region with awk, runs A in the background with `PGAPPNAME=l07-A`, sleeps `delayB`, runs B as `l07-B`, waits for both, writes `.A.txt`/`.B.txt`, and calls `merge-timeline.mjs`. The merge splits each output into blocks at the `A1`/`B1` marker rows and sorts the blocks by `luc`. Error lines stay in the block of the step that raised them.
6. **`verify-guide.mjs`** (Node built-ins only; controller tool, never shown to the learner). It has four modes:
   - `--runs`: each expected.tsv regex must match its run region. A `deviation` row needs an entry in `deviations.md`.
   - `--data`: each numeric leaf of `runs/data/wN.json` must appear in one of its `sources` after normalisation (strip thousand separators, unify decimal point).
   - `--fragment <file>`: runs V05–V07, V09 and V12 on one fragment. `--only V01,V04,…` runs a subset.
   - Default (whole guide):
     - V01 size ≤ 280 KB.
     - V02 tag balance (stack parser, skips script/style), unique ids, every `#href` target exists.
     - V03 required section ids (`cach-hoc`, `chang-1…9`, `bai-tap`, `prisma-drill`, `phong-van`, `cheat-sheet`, `ban-do-slide`, `tham-khao`, `tiep-theo`).
     - V04 SLIDES 1–43 complete, chips valid and equal to expected.tsv.
     - V05 every `pre[data-sql="file#region"]` equals the region text after HTML unescape and CRLF normalisation.
     - V06 every non-`…` line of `pre[data-run]` appears in order in the run file.
     - V07 every `b.m[data-run]` value appears in its run.
     - V08 the `run-wN` JSON deep-equals `runs/data/wN.json`.
     - V09 storage keys `l07-` only, no `l14-`.
     - V10 no `<script src`, only fonts.googleapis/gstatic outside, every `img src` resolves on disk.
     - V11 QUIZ 1–9 have 4 questions each with a valid `ans`; EXAM has 10.
     - V12 each stage has `.goal`, `dl.wwh`, `.callout.challenge`, a quiz slot.
     - V13 run-label dates equal the run-file header dates.
     - V14 dark-mode selectors and a body background are present.
     - V15 no `postgres://` or `password` in the guide or in `runs/`.
7. **`negative-tests.sh`** copies the guide to `verify/tmp/`, applies one mutation per case with `sed`, and asserts exit ≠ 0 plus the expected V-code in stderr. Cases: (a) one char changed in a `data-sql` block, V05; (b) a `b.m` value changed to an unrecorded number, V07; (c) a `data-store="l14-x"`, V09; (d) slide 17 deleted from SLIDES, V04; (e) an injected `<script src=…>`, V10; (f) a fake run file that misses the X12 regex, `--runs` fails.

## Test matrix
| Test | Expected now (RED) | Command |
|---|---|---|
| check.sql before setup | C01–C04 ✘, C05–C08 ✔, C09–C12 –, no SQL error | `bash verify/run-lab.sh labs/lesson-07-data-modeling/check.sql` then read `runs/check.txt` |
| `--runs` | exit 1, 37 × "missing run" (X15, X34 are merged into X12, X29) | `node verify/verify-guide.mjs --runs` |
| default | exit 1, V01 "guide missing" | `node verify/verify-guide.mjs` |
| runner idempotence of naming | two runs overwrite the same file | `ls runs/` |

## Verification
The three RED results above are recorded in `runs/red-baseline.txt`. That check.sql run is the first database touch, and it is read-only.

## Risks and rollback
A verifier that is too strict (e.g. V06 on wrapped lines) would block delivery. Allow `…` lines and whitespace normalisation only; anything else must match exactly. Rollback: delete `verify/` and the two `.sql` files.

=== FILE: phase-03-setup-experiments-runs.md ===
---
phase: 3
title: "Setup, experiments, recorded runs"
status: pending
priority: P1
effort: 3h
dependencies: [2]
---

# Phase 03 — Setup, experiments, recorded runs

## Goal
Write the learner-facing SQL, run it serially, and record every output verbatim until `--runs` is GREEN or each deviation is logged.

## Files to create/modify (all controller; DB runs strictly serial)
`D:/study/advance-be/labs/lesson-07-data-modeling/`:
- `00-setup.sql`, `99-cleanup.sql`
- `01-design-erd.sql`, `02-normal-forms.sql`, `03-foreign-keys.sql`, `03-fk-race.A.sql`, `03-fk-race.B.sql`
- `04-table-format.sql`, `04-index-online.A.sql`, `04-index-online.B.sql`
- `05-data-types.sql`, `06-case-studies.sql`, `07-views.sql`, `08-polymorphic.sql`
- `09-ledger.sql`, `09-ledger-race.A.sql`, `09-ledger-race.B.sql`
- `hw-solution.sql`, `prisma-drill.schema.prisma`

Plan folder: `runs/*.txt`, `verify/deviations.md`.

## Tasks and steps
1. **`00-setup.sql`** steps (qualified names throughout):
   - `CREATE SCHEMA IF NOT EXISTS`;
   - `CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA lab07_modeling`;
   - drop and recreate the two base tables from the northwind joins, with PKs, then `ANALYZE`;
   - a summary SELECT ("thẻ dữ liệu").

   It never drops the schema, `hw_*` or `my_*`. `99-cleanup.sql` = `DROP SCHEMA IF EXISTS lab07_modeling CASCADE;`, with a warning that this also removes homework.
2. **Stage files.** Each region follows the contract and produces exactly the evidence its matrix row (X01–X39) names. Statements that mutate shared rows to show an anomaly run inside `BEGIN … ROLLBACK`. Design points that are not obvious from the matrix:
   - `03#cost`: `fk_parent` has 20,000 rows; 200,000 inserts go into `fk_child` (FK) and 200,000 into `fk_child_nofk`. `03#index`: `EXPLAIN (ANALYZE, BUFFERS) DELETE FROM fk_parent WHERE id = 5` inside `BEGIN … ROLLBACK`, before and after `CREATE INDEX ON fk_child(parent_id)`, so the "Trigger for constraint" time is visible.
   - Races (`03-fk-race`, `#nofk` / `#fk`): A runs `BEGIN`, A1 checks that store 7 exists, `pg_sleep(6)`, inserts a contract, COMMIT. B starts at +1 s: B1 counts store 7's contracts (0, since A has not committed), deletes the store, COMMIT. An orphan query follows. In `#fk` the same steps hit the FK tables: B waits on A's `FOR KEY SHARE`, then gets 23503.
   - `04-index-online` `#plain`: A runs `BEGIN; CREATE INDEX; SELECT mode FROM pg_locks; pg_sleep(6); ROLLBACK`. B runs a SELECT (returns) and an INSERT with `lock_timeout '2s'` (55P03). `#cic`: A runs `BEGIN; INSERT; pg_sleep(4); INSERT; SELECT mode, granted FROM pg_locks` for B's pid; COMMIT. B runs `CREATE INDEX CONCURRENTLY`, then reads `indisvalid`.
   - `06#ordering`: a recursive CTE halves toward the lower bound until `mid = lo OR mid = hi`, separately for int, float8 and float4. The fix is one `UPDATE … row_number() OVER (ORDER BY pos) * 1000`.
   - `09#ddl`:
     - `wallets` uses the slide-20 template columns, `balance numeric(18,2)` and `CHECK (allow_negative OR balance >= 0)`. The `SYSTEM_CASH` wallet allows negatives.
     - `transfers` has `idempotency_key UNIQUE` and `order_ref` (slide 12).
     - `ledger_entries` has `amount <> 0` and indexed `wallet_id` and `transfer_id`.
     - A `CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` raises `ERRCODE '23514'` when a transfer's Σ ≠ 0.
     - `post_transfer(from, to, amount, key)` locks `WHERE id IN (…) ORDER BY id FOR UPDATE`, then debits before it credits.
   - `09-ledger-race` `#unordered` (raw SQL with entries, so invariants survive): A transfers 1→2, locks 1, `pg_sleep(3)`, then locks 2. B at +1 s transfers 2→1, locking 2 then 1. One 40P01 is expected. `#ordered`: both call `post_transfer` inside BEGIN, and A sleeps 3 s before COMMIT.
   - `prisma-drill.schema.prisma` has these seeded mistakes: `Float` money, `DateTime` without `@db.Timestamptz(3)`, a relation without `@@index`, `commentableType/commentableId`, comma-string tags, and no `@unique` on `idempotencyKey`. It also has one correct decoy (`Json` → jsonb). `hw-solution.sql` builds the model `hw_*` flight-booking schema.
3. Run order: `00-setup` → `check` → `00-setup` again → `check` (diff must be empty) → 01…09 single-session → each `--ab` pair 3× (record run 1, compare 2–3) → `hw-solution` + `hw-check` → `hw-bad-fixture` + `hw-check` → drop `hw_*` → `--runs`.
4. For each failing regex, first fix the SQL if the SQL is wrong. If PG behaves differently from the hypothesis, keep the run, change the chip or narrative, and add a row to `deviations.md` (claim, expected, measured, decision).
5. DBX smoke test (DBX MCP tools, connection `ADVANCE_BE_LAB`): run `09-ledger.sql#ddl` and `03-fk-race` `#nofk` A/B. Record in `runs/dbx-smoke.txt` whether `$$` bodies, BEGIN/COMMIT and `pg_sleep` work in auto-commit vs `Tx: [M]`. This decides the instruction text in `#cach-hoc`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| setup idempotent | identical check output after 2nd run (header line excluded) | `diff <(tail -n +2 runs/check.txt) <(tail -n +2 runs/check.rerun.txt)` (second run uses `--out check.rerun`) |
| sources untouched | C05, C06 ✔; fingerprint re-query identical to phase 01 | `bash verify/run-lab.sh …/check.sql` |
| no stray objects (negative) | C07 ✔ | same |
| hw-check on solution | all ✔ | `bash verify/run-lab.sh …/hw-check.sql` |
| hw-check on bad fixture (negative) | ✘ on H2, H3, H4, H5 only | same, after the fixture |
| matrix | `--runs` exit 0 | `node verify/verify-guide.mjs --runs` |
| race determinism | 3 runs give the same outcome codes | `grep -c 40P01 runs/09-ledger-race.unordered.*.txt` |
| ledger invariants | C09–C12 ✔ after stage 9 | check.sql |

## Verification
`node verify/verify-guide.mjs --runs`, then `check.sql` (all ✔, C14 ✔ after CIC), then `ls runs/` matches the run-id list in the contract.

## Risks and rollback
The serial DB budget is about 15 minutes of runtime (500k copies, 1M-row sums). Keep the 1M-row regions only in `#money` and `#report`. Rollback: `99-cleanup.sql`, then `00-setup.sql`. Files are new and can be deleted.

=== FILE: phase-04-widget-data-prisma-claims.md ===
---
phase: 4
title: "Widget data and Prisma claims"
status: pending
priority: P1
effort: 0.75h
dependencies: [3]
---

# Phase 04 — Widget data and Prisma claims

## Goal
Turn recorded runs into the small JSON files the widgets read, and record citations for every Prisma claim. No value is computed or invented outside a run.

## Files to create/modify (controller)
`D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/runs/data/w1.json` … `w10.json`, `…/runs/prisma-claims.txt`.

## Tasks and steps
1. Transcribe each file from its source run. Every file has a `sources` field.

| File | Sources | Fields |
|---|---|---|
| W1 | `01-design-erd#catalog` | `tables[{name, kind: entity/relation/support/config, cols[{n, t, nullable}]}]`, `edges[{from, to, col}]` |
| W2 | `02-*` | `sample` (5 order_sheet rows), `steps[0nf, 1nf, 2nf, 3nf]{tables, dupCells}`, `anomalies{updateRows, lostCities, insertCode}` |
| W3 | race timelines | `nofk[]`, `fk[]` events `{who, step, sql, outcome, luc}`, `orphans{nofk, fk}` |
| W4 | `04#add-column`, `#lock`, `index-online` | `alters[{sql, ms, rewrite}]`, `lockMode`, `plain{bSelect, bInsertCode, ms}`, `cic{mode, aInsert, waitedMs}` |
| W5 | `05-*` | `types[{field, pgType, prismaType, bytes, trap}]`, `money{floatSum, numSum, nwReal, nwNumeric}` |
| W6 | `06#ordering` | `{intSteps, f8Steps, f4Steps, rebalanceRows}` |
| W7 | `06#availability`, `#exclusion` | one month of `{day, price, status}`, `book{ok: 3, retry: n, code}`, `exclusionCode` |
| W8 | `08-*` | per design `{orphans, codes}` |
| W9 | `09-*` | ordered `steps[{label, entries[], balances{}, code?, invariants{unbalanced, sys, mismatch}}]`, `race{unordered, ordered}` |
| W10 | `07-*` | `plans{inline, pushdown, fence}` (plan text excerpts), `subqueryScan` booleans |

2. Prisma 7.9 claims. WebFetch the official docs and save each quoted line with its URL and fetch date in `prisma-claims.txt`:
   - the PostgreSQL type mapping for `Float`, `Decimal`, `DateTime` and `Json`;
   - `@db.Timestamptz` and `@db.Decimal(p,s)`;
   - `@@index(…, type: Gin)`;
   - that Prisma does not create indexes on relation scalars in PostgreSQL;
   - that the schema has no CHECK or polymorphic relations, so a CHECK goes into `migration.sql`.

   Confirm the `prisma@7.9.0` version exists via `https://unpkg.com/prisma@7.9.0/package.json`. Never read `node_modules`. Mark any claim that cannot be cited `[UNVERIFIED]`; it may not appear in the guide.

## Test matrix
| Test (written in phase 02) | Expected | Command |
|---|---|---|
| numbers traced | exit 0 | `node verify/verify-guide.mjs --data` |
| negative: add a fake 999999 to w6 copy | exit 1, "w6: 999999 not in sources" | `negative-tests.sh` case g (added now) |
| prisma claims cited | every drill answer key in the file has a URL line | `grep -c "https://www.prisma.io/docs" runs/prisma-claims.txt` ≥ 6 |

## Verification
`node verify/verify-guide.mjs --data` must be GREEN.

## Risks and rollback
A transcription slip is caught by `--data`. If the docs have moved, cite the current URL and keep the fetch date. Rollback: delete `runs/data/` and `prisma-claims.txt`.

=== FILE: phase-05-guide-shell-assembler.md ===
---
phase: 5
title: "Guide shell and assembler"
status: pending
priority: P1
effort: 1h
dependencies: [3]
---

# Phase 05 — Guide shell and assembler (runs in parallel with phase 06)

## Goal
Write everything outside the stage sections, plus the assembler that stitches fragments, quiz JSON, widget JS and data into one HTML file.

## Files to create/modify (controller only)
| Path | Content |
|---|---|
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/build/shell-head.html` | Lesson-14 lines 1–239 verbatim, plus the contract classes; title `Sổ tay Data Modeling · Bài 07`. Hero: eyebrow `Advance Backend · Bài 07 · Day 05 · sau Bài 14`, hero-meta (43 slide · 9 chặng · 295 + 90 phút · 36 quiz + 10 phỏng vấn), slide-1 epigraph. `#cach-hoc` holds the stage-map table, the chip legend, and a prep panel: docker start; the DBX tabs `ADVANCE_BE_LAB`/`_B` using the mode found in `dbx-smoke.txt`; `00-setup.sql`; `check.sql` with its recorded output; the `l07-warmup` textarea. |
| `…/build/shell-tail.html` | `#bai-tap` (slide 35 flight booking: table-template checklist, DBX steps, recorded `hw-check` outputs for solution and bad fixture, solution link in a fold); `#prisma-drill` (`prisma-drill.schema.prisma` shown, a textarea per finding, a fold with answers citing stage runs and `prisma-claims.txt`); `#phong-van`; `#cheat-sheet` (type table, error codes 23502/23503/23505/23514/23P01/22001/42601/42704/54000/55000/55P03/25001/40P01/44000, ledger rules, normalization rules); `#ban-do-slide`; `#tham-khao` (slide 36 links, the PG 16 docs page behind each DIFF/FIX chip, Prisma links); `#tiep-theo` (OmniPOS Cluster 1 phase B + Boss Challenge 1 in `quan-ly-hop-dong`, then Cluster 2 lesson 06 Redis). The script block holds `GUIDE_DATA_START/END` with `SLIDES` (43), `QUIZ = /*@QUIZ@*/`, `EXAM` (10), then the lesson-14 IIFE core with every `l14` replaced by `l07`, and `/*@WIDGETS@*/`. |
| `…/build/assemble.mjs` | Node built-ins. It reads head, then `fragments/stage-01…09.html` in order, then tail. It replaces `/*@QUIZ@*/` with `{1: …, 9: …}` from `stage-0N.quiz.json` and `/*@WIDGETS@*/` with the concatenated `widgets/wN.js`, each wrapped in `{ … }`. Before `<script>` it inserts `<script type="application/json" id="run-wN">` for each `runs/data/wN.json`. It writes `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`, and exits 1 if a placeholder or fragment is missing. |

The 10 EXAM topics:
1. normalization trade-offs, with an anomaly;
2. keeping and indexing FKs;
3. the app-check orphan race;
4. ADD COLUMN on PG 11+ and its lock;
5. CREATE INDEX vs CONCURRENTLY;
6. money is never float;
7. timestamptz;
8. polymorphic options;
9. ledger design and reconciliation;
10. view vs materialized view.

Every answer cites a run.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| assembler with no fragments (negative) | exit 1 "missing fragment stage-01" | `node build/assemble.mjs` |
| shell-only build with placeholder stubs (`--allow-stubs`) | V01, V02, V03 (stubs), V09, V10, V14 pass | `node build/assemble.mjs --allow-stubs && node verify/verify-guide.mjs --only V01,V02,V09,V10,V14` |
| SLIDES vs expected chips | V04 passes on the shell | `node verify/verify-guide.mjs --only V04` |

## Verification
Run the commands above. Render-check the stub build once to catch CSS regressions early.

## Risks and rollback
A CSS copy drifting from the lesson-14 shell: copy it verbatim, then append only the new classes. Rollback: delete `build/shell-*` and `assemble.mjs`.

=== FILE: phase-06-stage-fragments.md ===
---
phase: 6
title: "Stage fragments (3 parallel delegates)"
status: pending
priority: P1
effort: 1.5h
dependencies: [1, 4]
---

# Phase 06 — Stage fragments

## Goal
Write the nine stage sections in Vietnamese, each following "làm mẫu → tự làm", with widgets that teach a mechanism from recorded data.

## File ownership (disjoint; no delegate touches DB, `labs/`, `runs/`, shell or assembler)
| Owner | Files under `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/build/` |
|---|---|
| Delegate D1 | `fragments/stage-01.html`, `stage-02.html`, `stage-03.html`, `stage-0{1,2,3}.quiz.json`, `widgets/w1.js`, `w2.js`, `w3.js` |
| Delegate D2 | `fragments/stage-04.html`, `stage-05.html`, `stage-06.html`, quiz json 4–6, `widgets/w4.js`, `w5.js`, `w6.js`, `w7.js` |
| Delegate D3 | `fragments/stage-07.html`, `stage-08.html`, `stage-09.html`, quiz json 7–9, `widgets/w8.js`, `w9.js`, `w10.js` |

Each delegate's prompt contains the following:
- the task;
- the files to read: `build/contract.md`, the stage map and matrix in `plan.md`, its own `labs/*.sql`, `runs/*.txt` and `runs/data/wN.json`, the slides `.md`, and lesson-14 guide lines 1–430 and 2304–2645 as the style model;
- the files it may write (table above);
- the constraints below;
- acceptance: `--fragment` exit 0 for each of its stages;
- the reply format `Status/Summary/Concerns`;
- the note that no `--yagni` flag was passed.

## Fragment format (frozen)
- `<section id="chang-N" class="stage col">` with `stage-head` (`stage-no` `0N`, `stage-meta` slides · minutes · Day 05), `p.goal`, `dl.wwh` (LÀ GÌ / TẠI SAO / KHI NÀO KHÔNG).
- `figure.slide-fig` for each existing image (`../../Tài Liệu/advanced_backend/assets/7_Data_Modeling/page_NN_*.png`, `onerror` hides it). Images exist for pages 5, 7, 9, 10, 15, 17, 20, 22, 27, 28, 29, 30, 31, 35, 41.
- Per slide in range: a callout with `.sayvs` ("Slide nói / PG 16 đo được") and the chip. DIFF and FIX slides carry `id="sl-NN"`.
- Code is `<pre data-sql="05-data-types.sql#money"><code>` holding the exact, escaped region. Output is a `div.run-label` ("Kết quả đã chạy trên máy bạn ngày 27/10/2026") plus `pre[data-run]`; `…` excerpts are allowed. Inline numbers use `<b class="m" data-run>`.
- Two-session experiments use a `table.walk` (# / ADVANCE_BE_LAB (A) / ADVANCE_BE_LAB_B (B) / Ghi lại) with `data-store="l07-cN-…"` inputs, followed by the recorded merged timeline.
- Worked example (`callout teacher`, "Làm mẫu"), then `div.callout.challenge#chang-N-tu-lam` ("Tự làm" task, PASS criteria, a self-check query, and an answer in `details.fold`), then `<div class="quiz" data-quiz="N"></div>`.
- Quiz JSON: 4 × `{q, opts[4], ans, why}`. Each `why` cites a run/region.
- Widget JS: a block that uses only the IIFE helpers (`$`, `$$`, `esc`, `run`, `press`, `store`), reads `run('wN')`, guards for null, and adds no global. Widget markup: `div.widget#wN` with `widget-head` (h4 `WN · …`, eyebrow with run id) and `widget-body`. Any control is at least 44 px.

## Per-stage content (challenge in italics)
1. Process → ERD → 4 table types → W1 (an inline SVG ERD of `erd_*` + ledger tables; clicking an entity shows its type and columns from the catalog). *Classify 8 OmniPOS tables by type.*
2. Slide 9's student example, then the northwind sheet 0NF→3NF with each anomaly reproduced; denormalization with drift. W2 stepper highlights duplicated cells and shows anomaly counts. *Normalize a flat F&B "phiếu nhập kho" (given 6 rows) to 3NF in DBX, as `my_*` tables.*
3. FK cost and index; slide 11 opinion vs the race. W3 lanes replay the `nofk`/`fk` timelines, toggle "có FK", and show orphan 1 vs 23503. Slide 12 refcol. *Repeat the race by hand in two tabs; then make the no-FK version safe with `SELECT … FOR KEY SHARE` and explain why that is re-implementing FK.*
4. ADD COLUMN, rewrite vs fast default, lock; jsonb + indexes; spare columns; CREATE INDEX vs CIC; template. W4 shows a log-scale ms meter, a rewrite badge, the lock mode, and a plain/CIC toggle with B's outcome. *Add `data jsonb` + an expression index to `tpl_stores` with `lock_timeout` set; paste the EXPLAIN.*
5. Types and NULL. W5: choose a field (tên món, giá, created_at, giờ hẹn, số lượng, ghi chú, trạng thái) to see the PG type, Prisma type, recorded bytes and trap; plus a money panel with the recorded float drift. *Pick types for a 10-column `menu_items` table and justify each with a recorded number.*
6. Case studies. W6 bisection: JS halves live in float64 and in `Math.fround` float32 and compares with the recorded 53/24 (✔ when equal); a "rebalance" button shows the recorded row count. W7 calendar: a month grid from recorded rows; clicking a 3-night range replays the recorded conditional booking and the 23P01. *Design `my_table_reservations` for a restaurant with an exclusion constraint and prove the double booking fails.*
7. Views: MERGE/TEMPTABLE mapped to PG inlining vs subquery fence. W10 shows three plan tabs with `Subquery Scan` highlighted. *Write a view the planner cannot flatten and show the plan.*
8. Polymorphic: three designs. W8 tabs plus "Xóa post #1" show the recorded orphans and codes; a Prisma note covers what each maps to. *Model `my_attachments` for `contracts | stores` as an exclusive arc.*
9. Ledger capstone. A static inline SVG ERD of the ledger (W1 belongs to stage 1), invariants, posting walkthrough, attacks, reconciliation, race with and without ordering. W9 replays the steps with wallet bars, an entries table and an invariant panel. A 5-line recap of lesson-14 tools links to L14 `#chang-1`/`#chang-5`. *Add `refund(transfer_id)` that posts the reverse entries idempotently; PASS = check.sql C09–C12 ✔ and a second call raises 23505.*

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment checks (V05–V07, V09, V12) | exit 0 per fragment | `node verify/verify-guide.mjs --fragment build/fragments/stage-0N.html` |
| quiz shape | 4 items, `ans` 0–3 | `node -e "…JSON.parse…"` via `--fragment` |
| widget JS syntax | no error | `node --check build/widgets/wN.js` |

## Verification
The controller reruns every `--fragment` check itself before accepting a delegate's DONE.

## Risks and rollback
Delegates may paraphrase SQL in the HTML; V05 rejects that. A widget may invent numbers; V07/V08 and review catch it. Rollback: delete the delegate's files and re-dispatch with the failure message.

=== FILE: phase-07-assemble-verify.md ===
---
phase: 7
title: "Assemble and verify"
status: pending
priority: P1
effort: 0.75h
dependencies: [5, 6]
---

# Phase 07 — Assemble and verify

## Goal
Produce the guide and prove it against every check, including the negative ones and a visual render.

## Files to create/modify (controller)
`D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` (generated), `…/verify/render/` (screenshots, report).

## Tasks and steps
1. `node build/assemble.mjs`.
2. `node verify/verify-guide.mjs` (V01–V15) and `--runs` and `--data`.
3. `bash verify/negative-tests.sh`. All 7 mutations must fail with their V-code.
4. Render check with project-local temp: `TMP="$PWD/plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/tmp" TEMP="$TMP" node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html --out plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render`. Then repeat with `data-theme="dark"` forced (a copy in `verify/tmp` with the attribute set).
5. Click through each widget, one quiz, the theme toggle and a `data-store` reload. Fix issues only in the source files, never in the generated HTML, then re-assemble.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| full verify | exit 0 | `node verify/verify-guide.mjs` |
| negative suite | 7/7 RED as designed | `bash verify/negative-tests.sh` |
| render 375/768/1440 light and dark | 0 runtime errors, 0 overflow, 0 targets < 44 px | render-check report |
| size budget | ≤ 280 KB | V01 |

## Verification
Store `verify/render/report.txt` and screenshots. Their paths are cited in phase 09.

## Risks and rollback
A fix made directly in the generated file is lost on the next assemble. The rule is "edit sources only". Rollback: delete the generated HTML.

=== FILE: phase-08-ultra-review-fixes.md ===
---
phase: 8
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1h
dependencies: [7]
---

# Phase 08 — Ultra code review and fixes

## Goal
Get an independent review of the SQL, the guide and the verifier, and fix every verified Critical or Important finding.

## Files to create/modify
Review reports go to `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/reports/` (written by the review skill). Fixes go to the owning files from phases 02–06 (controller).

## Tasks and steps
1. Run `/ak:code-review --ultra` (5 independent reviewers + verifier, union of verified findings). Scope: `labs/lesson-07-data-modeling/*`, `build/*`, `verify/*`, the generated guide, `runs/deviations.md`. Give the reviewers `evidence-packet.md` §4–§6 and the matrix as the spec, not this plan's conclusions. Focus: chip correctness on PG 16, SQL safety (search_path, timeouts, schema-only writes), number traceability, plain Vietnamese without over-engineering, 375 px accessibility, Prisma 7.9 claims.
2. Triage. Fix Critical and Important findings. Record any rejection with its verification source (file:line or a run).
3. If a fix touches a `.sql` file: re-run that file (`run-lab.sh`), then `--runs`, `--data`, re-assemble, and run the full verify. If it touches only HTML or JS: re-assemble, full verify, and render-check.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| post-fix full suite | all GREEN | `node verify/verify-guide.mjs && node verify/verify-guide.mjs --runs && node verify/verify-guide.mjs --data && bash verify/negative-tests.sh` |
| DB state after re-runs | check.sql all ✔ | `bash verify/run-lab.sh labs/lesson-07-data-modeling/check.sql` |

## Verification
The findings table shows a status for every item (fixed / rejected with source).

## Risks and rollback
A late SQL fix changes recorded numbers. The re-run updates the run files, and V07 then forces the prose to follow. Rollback a fix by reverting the single owning file from the reviewer-provided diff.

=== FILE: phase-09-docs-final-gate-handoff.md ===
---
phase: 9
title: "Docs, final gate, handoff"
status: pending
priority: P1
effort: 0.5h
dependencies: [8]
---

# Phase 09 — Docs, final gate, handoff

## Goal
Make the guide discoverable, leave the database clean for tomorrow, and write a handoff so Đạt can start at `#cach-hoc`.

## Files to create/modify (controller)
| Path | Change |
|---|---|
| `D:/study/advance-be/README.md` line 14 | Labs list: append `` `labs/lesson-07-data-modeling/` `` (original text: ``…`labs/lesson-12-transaction/`, `labs/lesson-14-locking/` ``). Add `lesson_07_data_modeling_teacher_guide.html` to the `reports/advanced_backend/` tree and `lesson-07-data-modeling/` to the `labs/` tree. |
| `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` line 39 | Column 4: replace `*ERD Design & DDL scripts*` with `` `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`<br>`labs/lesson-07-data-modeling/` `` |
| `D:/study/advance-be/plans/handoffs/lesson-07-guide-ready-20261027-<HHMM>.md` | Short Vietnamese handoff: what was built, the first 3 steps tomorrow (docker start → `00-setup.sql` → `check.sql` with N ✔), the DBX mode for two tabs, files, known variance. |
| plan folder `plan.md` and phase files | Status updated via `ak plan` CLI (run `ak plan --help` first) |

## Tasks and steps
1. Edit the docs, then re-read both edited lines and confirm the paths exist.
2. Reset DB state: run `00-setup.sql`, confirm that no `hw_*` or `my_*` test tables remain (Đạt has not created any yet), then run `check.sql` and record it as `runs/check.final.txt`.
3. Final gate (all must pass):

| Gate | Command | Pass |
|---|---|---|
| DB invariants | `run-lab.sh check.sql` | C01–C08, C13, C14 ✔; C09–C12 ✔ or – (ledger tables kept from the run) |
| fingerprints | diff of the re-queried fingerprint vs `00-fingerprint-before.txt` | identical |
| guide | `verify-guide.mjs` (default, `--runs`, `--data`) | exit 0 |
| negatives | `negative-tests.sh` | all RED as designed |
| render | last report | clean |
| git | `git status --short` | only: `labs/lesson-07-data-modeling/`, `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`, `README.md`, `TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md`, the plan folder, the handoff, plus pre-existing entries |
| processes | `docker exec … psql -Atc "select count(*) from pg_stat_activity where application_name like 'l07-%'"` | 0 |

4. Do not commit, push or branch. Leave the changes for Đạt.

## Test matrix
The final gate table above is the test matrix. Two more checks are added:
- `ls` confirms that both doc-linked paths exist.
- `grep` confirms that the handoff contains `#cach-hoc` and `00-setup.sql`.

## Verification
Run the gate, then report the guide path, the run folder and the deviations to the user.

## Risks and rollback
A doc edit conflicting with parallel roadmap edits in the README: change only the named lines. Rollback: restore the quoted original text. Leaving `lab07_modeling` populated is intended, and `99-cleanup.sql` exists if Đạt wants it gone.
