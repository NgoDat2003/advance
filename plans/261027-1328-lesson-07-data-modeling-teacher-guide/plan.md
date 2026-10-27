---
title: "Lesson 07 Data Modeling teacher guide (DBX-first, PG16-measured)"
description: "Single-file Vietnamese teacher guide for Lesson 07 (43 slides + 1NF-3NF + polymorphic + double-entry ledger) backed by DBX-runnable SQL labs in lab07_modeling."
status: completed
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
5. Delegates write `assembly/fragments/*` against `assembly/contract.md`.
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
| 01 | [Contract and baseline](phase-01-contract-and-baseline.md) | 0.5h | – | `assembly/contract.md` frozen; `runs/00-fingerprint-before.txt` recorded |
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


## Materialization must-fix (verifier `verify/ultra-plan/verdict.md`, applied by the controller; these override the phase files where they conflict)

1. `03#index`: delete a parent id that has **no** children (reserve child-free ids in setup) before and after creating the FK index, so the RI-trigger timing is measured instead of 23503.
2. Guide: the CIC step must run in an **auto-commit** DBX tab; in a Manual-Commit (`Tx: [M]`) tab CIC raises 25001.
3. `05#string` 54000 test uses incompressible data (`md5`/random hex concatenation or `SET STORAGE EXTERNAL`), because index tuples are compressed before the 2,704-byte check.
4. Phase 02 adds a verifier self-test on a tiny fixture so V05/V07 are proven before fragments exist.
5. HTML budget raised to ≤ 320 KB (acceptance criterion 1); later raised to ≤ 340 KB, see `verify/deviations.md`.
6. `expected.tsv` IDs renumbered without gaps; `run-lab.sh` sets `MSYS_NO_PATHCONV=1` and prints `version()` instead of a hard-coded 16.15.
7. Stage 7 (views) plus the calendar and MV-CONCURRENTLY regions are **optional**; core lands ≈ 4h40. Stage order kept, with one bridge sentence.

Grafts: learner-visible ✔/✘ "Kiểm chứng" grid at the end of each stage file (D); `ADD COLUMN created_at timestamptz DEFAULT now()` fast-default row and `int → bigint` rewrite row (D); `'…+07'::timestamp` offset-drop row (D); `pg_stat_progress_create_index.phase` read during CIC (B/C/D); "Nhắc nhanh Bài 14" callout in `#cach-hoc` (A); `check.sql` negative injection inside a rolled-back transaction (C). Rejected: deferred trigger before a large seed, `DROP SCHEMA CASCADE` inside setup.

ultra: picked=3/5 margin=low unanimous=no rejected_all=no
- Deviation: the plan's `build/` folder is named `assembly/` because a user hook blocks tool access to paths containing `build`.
