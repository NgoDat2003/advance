=== FILE: plan.md ===
---
title: "Lesson 07 Data Modeling teacher guide (DBX-first, measured on PG 16)"
description: "Single-file Vietnamese teacher guide for Lesson 07 (43 slides + 1NF-3NF + polymorphic + double-entry ledger) with DBX SQL labs and recorded PG 16 runs."
status: pending
priority: P1
effort: 10.5h
branch: main
tags: [lesson-07, data-modeling, teacher-guide, postgresql, dbx, ledger, tdd]
blockedBy: []
blocks: []
created: 2026-10-27
---

# Lesson 07 — Data Modeling teacher guide

## Overview

Đạt opens `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` tomorrow and studies Lesson 07 in one day: 8 stages, about 295 minutes of core work, with optional homework in the evening. The guide covers all 43 slides plus normal forms (1NF→3NF on a flat Northwind order sheet), polymorphic associations, and the capstone double-entry ledger (`wallets`, `transfers`, `ledger_entries`). Every experiment is a self-contained `.sql` file in `D:/study/advance-be/labs/lesson-07-data-modeling/` that he runs in DBX with `Ctrl+A → Run`. The guide shows the exact text of each file, and every number in the guide comes from a dated psql run recorded under `PLAN/runs/`. The page reuses the lesson-14 single-column shell (no rail), uses only `l07-*` storage keys, has visual widgets that read recorded data, and ends with a Prisma 7.9 schema-review drill. The bridge at the end points to OmniPOS Cluster 1 phase B (Boss Challenge 1), then Cluster 2 lesson 06 (Redis).

Paths used in every file: `PLAN = D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide`, `LAB = D:/study/advance-be/labs/lesson-07-data-modeling`, `GUIDE = D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`.

## Stage map (one day, core 295 min + 60 optional)

| Stage | Slides / topic | Min | Experiments (LAB) | Widget |
|---|---|---|---|---|
| 0 `#cach-hoc` | 1–2 · setup, check, two DBX tabs | 10 | `00-setup.sql`, `check.sql` | — |
| 1 | 3–8, 12 · design process, ERD, table types, reference column placement | 20 | `e01-erd-loai-bang.sql` | W1 `erd-northwind` (inline SVG ERD, tap a table to see its type and FK/index facts) |
| 2 | 9–10 + 1NF→2NF→3NF, denormalization | 35 | `e02-chuan-hoa.sql` | W2 `nf-stepper` |
| 3 | 11 + polymorphic association | 35 | `e03-khoa-ngoai-polymorphic.sql`, `e03-race-A.sql`, `e03-race-B.sql` | W3 `fk-race`, W4 `poly-shapes` |
| 4 | 13–20 · ADD COLUMN, JSON, JSON index, spare columns, online index, table template | 35 | `e04-dinh-dang-bang.sql`, `e04-index-A.sql`, `e04-index-B.sql` | W5 `ddl-cost`, W9 `plan-switch` |
| 5 | 21–25 · string, number/money, time zone, NULL | 30 | `e05-kieu-du-lieu.sql` | W6 `type-picker` |
| 6 | 26–31 · multi-language, ordering, homestay, calendar | 35 | `e06-case-studies.sql` | W7 `bisect`, W8 `booking-grid` |
| 7 | 32–33, 38–43 · tags, report counting, views (appendix) | 30 | `e07-tag-bao-cao-view.sql` | W9 `plan-switch` (2 instances) |
| 8 | 34 + double-entry ledger capstone | 45 | `e08-so-cai-kep.sql`, `e08-deadlock-A/B.sql`, `e08-ordered-A/B.sql` | W10 `ledger-sim` + ledger ERD SVG |
| wrap | Prisma drill, interview, cheat sheet | 20 | `prisma-drill/schema.ai.prisma` | drill reveal |
| + optional | 35–37 · homework flight booking, extra folds | 60 | `hw-check.sql`, `hw-solution.sql` | — |

Slide → stage → verdict chip (all 43; `ok` = Đúng trên PG16, `diff` = MySQL đúng, PG khác, `fix` = Cần sửa, `—` = divider/no claim):
1 cach-hoc —, 2 cach-hoc —, 3 c1 —, 4 c1 —, 5 c1 ok, 6 c1 —, 7 c1 ok, 8 c1 ok, 9 c2 ok, 10 c2 ok, 11 c3 fix, 12 c1 ok, 13 c4 —, 14 c4 diff, 15 c4 diff, 16 c4 diff, 17 c4 fix, 18 c4 diff, 19 c4 ok, 20 c4 diff, 21 c5 —, 22 c5 diff, 23 c5 ok, 24 c5 diff, 25 c5 fix, 26 c6 —, 27 c6 ok, 28 c6 fix, 29 c6 ok, 30 c6 ok, 31 c6 diff, 32 c7 ok, 33 c7 ok, 34 c8 fix, 35 bai-tap —, 36 tham-khao —, 37 tiep-theo —, 38 c7 —, 39 c7 —, 40 c7 fix, 41 c7 diff, 42 c7 diff, 43 c7 ok.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 1 | [Contract and tests first](phase-01-contract-and-tests-first.md) | 1.5h | — | `node PLAN/tests/verify.mjs selftest` exits 0; `runs/fingerprint-before.txt` recorded |
| 2 | [Lab foundation: setup, check, graders](phase-02-lab-foundation-setup-check.md) | 1h | 1 | check ✘ before setup, all ✔ after, still ✔ after rerun; DBX smoke recorded |
| 3 | [Experiment SQL authoring (parallel)](phase-03-experiment-sql-authoring.md) | 1.5h | 2 | static lint of all lab SQL passes |
| 4 | [Serial runs and recording](phase-04-serial-runs-and-recording.md) | 1h | 3 | `verify.mjs runs` exits 0; fingerprint after = before; check all ✔ |
| 5 | [Guide fragments, widgets, template](phase-05-guide-fragments-and-widgets.md) | 2.5h | 4 (template part: 1) | `verify.mjs fragment` passes for every fragment |
| 6 | [Assemble, verify, render-check](phase-06-assemble-verify-render.md) | 1h | 5 | `verify.mjs guide` exits 0; render-check clean at 375/768/1440, light and dark |
| 7 | [Ultra code review and fixes](phase-07-ultra-review-and-fixes.md) | 1.5h | 6 | no open Critical/Important finding; affected checks re-run green |
| 8 | [Docs, final gate, handoff](phase-08-docs-final-gate-handoff.md) | 0.5h | 7 | final gate script green; handoff written |

## Expected-result matrix

Written to `PLAN/tests/expected-results.tsv` in phase 1, before any experiment exists. A row whose pattern is not found in its run file is a contradiction: the narrative and chip change (logged in `PLAN/runs/contradictions.md`); the run file is never edited.

| Exp | Slide claim | Expected PG 16 result | Chip |
|---|---|---|---|
| e01.1 | 7–8 ERD, table types | Catalog lists 13 FK edges in `northwind`; 8 core tables classified entity / relation / support / config | ok |
| e01.2 | 11 (bridge) | Most `northwind` FK columns have no leading index (count recorded) | — |
| e01.3 | 12 order_id lives in the later entity | `e01_payment_txns.order_id` nullable + `CHECK (kind='donate' OR order_id IS NOT NULL)`; donate row OK, order row without order_id → 23514 | ok |
| e02.1 | 9 (0NF) | `items` text cell: `LIKE '%Tofu%'` count > exact join count (matches "Longlife Tofu") | ok |
| e02.2 | 9 update anomaly | Renaming product 14 in flat table touches N rows; partial update yields 2 distinct names (in ROLLBACK txn); after 2NF, 1 row | ok |
| e02.3 | 9 insert anomaly | New product without an order in flat table → 23502 | ok |
| e02.4 | 9 delete anomaly | Deleting the only line of the least-ordered product removes the product's last copy (1 → 0) | ok |
| e02.5 | 3NF transitive | Customer company/city repeated across orders; after split 0 duplicates | ok |
| e02.6 | 10 denormalization | Cached `order_total` read faster than SUM+JOIN (EXPLAIN ANALYZE both); a line update without refresh → reconciliation finds 1 mismatch | ok |
| e03.1 | 11 FK check cost | 500,000 child inserts with FK at least 3× slower than without | fix |
| e03.2 | 11 (PG ≠ MySQL) | After FK creation only `*_pkey` exists on child; `DELETE` of a childless parent shows a slow RI trigger (seq scan); after `CREATE INDEX` trigger time ≥10× lower | fix |
| e03.3 | 11 "check in app" (pair) | No FK: orphan count 1. FK: A's INSERT → 23503, orphan 0 | fix |
| e03.4 | polymorphic | `type+id`: deleting a post leaves k ≥ 1 orphan comments; exclusive arc with `num_nonnulls(...) = 1`: both-null and both-set → 23514; deleting referenced parent → 23503; per-parent join tables: 0 orphans | — |
| e04.1 | 14 ADD COLUMN lock | `ADD COLUMN note text` and `version int NOT NULL DEFAULT 0`: filenode unchanged, ms small; `DEFAULT random()`: filenode changed, ms ≫; `numeric(12,2)→(14,2)`: unchanged | diff |
| e04.2 | 14 | `pg_locks` inside the ALTER txn shows `AccessExclusiveLock` | diff |
| e04.3 | 15 JSON | `json` keeps duplicate keys as text, `jsonb` keeps the last; sizes recorded | diff |
| e04.4 | 16 JSON index | `attrs->>'color'` Seq Scan before; Index/Bitmap scan on expression index after; `@>` uses GIN `jsonb_path_ops` | diff |
| e04.5 | 17 spare columns | Row with 10 NULL spare columns is at most 8 bytes larger; ADD COLUMN is instant (e04.1) | fix |
| e04.6 | 19–20 template | `updated_at` unchanged by UPDATE without trigger, changed with `set_updated_at()`; version CAS rowcount 1 then 0 | ok / diff |
| e04.7 | 18 online index (pair) | Plain `CREATE INDEX` held in open txn → A's INSERT 55P03 after `lock_timeout`; `CREATE INDEX CONCURRENTLY`: A's INSERT succeeds while B waits (`virtualxid`), B holds `ShareUpdateExclusiveLock`, index valid after; CIC via `try_sql` → 25001 | diff |
| e05.1 | 22 string | `pg_column_size` text = varchar(255) (12 = 12); `varchar(5)` overflow → 22001 | diff |
| e05.2 | 22 index long text | btree on 10,000-char md5 string → 54000 (max 2704) | diff |
| e05.3 | 23 integer | sizes 2/4/8; smallint overflow → 22003 | ok |
| e05.4 | 23 money | `0.1+0.2` float8 = `0.30000000000000004`; 1M-row sum float8 `100000.00000133288` vs numeric `100000.0`; Northwind `real` revenue ≠ numeric revenue | ok |
| e05.5 | 24 time | Same instant shows `09:00+07` / `02:00+00`; `2100-01-01` timestamptz valid (no 2038 limit); `timestamp` vs `timestamptz` comparison shifts by session TimeZone | diff |
| e05.6 | 25 NULL | NULL row not larger; `IS NULL` uses btree; `NOT IN` with a NULL returns 0 rows; UNIQUE allows 2 NULLs; `NULLS NOT DISTINCT` → 23505 | fix |
| e06.1 | 27 multi-language | Fallback `coalesce(title_tr->>'vi', original_title)`; adding `ja` needs no DDL | ok |
| e06.2 | 28 ordering | float8 exhausted after 53 midpoints, float4 after 24; numeric not exhausted after 60 (scale grows); rebalance restores 1000 gaps | fix |
| e06.3 | 29–30 availability | 20 homestays × 365 = 7,300 rows (size recorded); conditional UPDATE books 3 nights (rowcount 3); overlapping booking rowcount < 3 → reject | ok |
| e06.4 | 29–30 (PG extra) | `EXCLUDE USING gist (homestay_id WITH =, stay WITH &&)`: overlap → 23P01; adjacent `[)` ranges OK | ok |
| e06.5 | 31 calendar | 12 weeks of slots via `generate_series`; week query uses index; local time + IANA zone → instant | diff |
| e07.1 | 32 tags | `tags @> ARRAY[...]` Bitmap Index Scan on GIN; join table index scan; tag rename: array touches N rows vs 1 | ok |
| e07.2 | 33 report | exact count ms; `reltuples` estimate; no HLL/pg_cron extension available; MV refresh ms; stale read before refresh; `REFRESH … CONCURRENTLY` without unique index → 55000 | ok / 42 diff |
| e07.3 | 41 MERGE/TEMPTABLE | Simple view: plan shows base-table index scan, no view node; view with LIMIT: Subquery Scan, filter applied after; GROUP BY view: filter on group key pushed down | diff |
| e07.4 | 40 updatable | UPDATE through simple view → 1 row; aggregate view → 0A000; `WITH CHECK OPTION` → 44000 | fix |
| e08.1 | ledger | Posting 2 entries sums to 0; reconciliation 0 mismatches; overdraft conditional UPDATE → 0 rows; direct UPDATE → 23514; unbalanced INSERT → 23514 (trigger); UPDATE on entry → 23001 (append-only); corrupt cache → 1 mismatch (ROLLBACK) | 34 fix |
| e08.2 | ledger (pair) | Unordered opposite transfers: A gets 40P01, B commits; invariants hold | — |
| e08.3 | ledger (pair) | `ORDER BY id FOR UPDATE`: no 40P01, B waits ≈ A's hold time, both commit | — |
| e08.4 | ledger | 3-leg split payment in one INSERT accepted; sum 0 | — |
| hw | 35 homework | `hw-check` on `sol_*`: all ✔; on `bad_*`: ✘ on float money, naive timestamp, unindexed FK, no seat uniqueness | — |
| ch | challenges | `challenge-check` on clean DB: all `—`; on reference objects: all ✔ | — |

## Acceptance criteria

1. GUIDE exists, single file, ≤ 260 KB, no `<script src>`, only Google Fonts as external host (P5, P6).
2. `SLIDES` has n = 1..43 exactly once, every `href` resolves, chips match the slide map above (P5, P6).
3. All four content blocks present: 43 slides, 1NF→3NF demo, polymorphic (3 shapes), ledger capstone with lesson-14 locking (P3, P4, P5).
4. Every `<pre data-sql>` block equals its LAB file (or marked part) byte-for-byte after unescape; every `<pre data-run>` line exists in its run file in order; every `b.m[data-run]` value appears verbatim in its run file; every widget leaf `{v, src}` matches its cited run line (P6).
5. Every run file starts with a date stamp; no connection URL, password or host secret in GUIDE, LAB, or runs (P4, P6).
6. `check.sql` returns only ✔ after setup and after all experiments; `00-setup.sql` rerun stays ✔; fingerprint after = before for all read-only sources (P2, P4).
7. No object with a lab prefix exists outside `lab07_modeling`; static grep finds no write to another schema, no `CREATE ROLE`, `ALTER DATABASE/ROLE/SYSTEM` (P2, P3, P4).
8. Every experiment, homework and challenge `.sql` begins with `SET search_path = lab07_modeling` plus `statement_timeout`, `lock_timeout`, `idle_in_transaction_session_timeout`. `00-setup.sql`, `check.sql` and `99-cleanup.sql` set timeouts and use schema-qualified names until the schema exists. No file contains a psql meta-command (P2, P3).
9. Each stage `#chang-1..8` has a walkthrough (Làm mẫu), a challenge (Tự làm) with acceptance criteria, ≥ 4 quiz questions; `#phong-van` has 10 questions; `#cheat-sheet`, `#ban-do-slide`, `#tham-khao`, `#tiep-theo` exist (P5).
10. Storage keys are only `l07-*` (P5, P6).
11. Render-check at 375/768/1440, light and dark: 0 runtime errors, 0 horizontal overflow, touch targets ≥ 44 px (P6).
12. Prisma drill claims each cite a verified Prisma doc or unpkg 7.9.0 source in `PLAN/runs/prisma-claims.md`; no `node_modules` read (P3, P5).
13. Ultra review: no open Critical/Important finding (P7).
14. README and `TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 07 link the guide and lab; handoff note written; `git status` shows only the expected new/modified paths; no git write command used (P8).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| DBX stops a script at the first error | High×High | All expected errors go through `try_sql(label, sql)`, which returns `ok, sqlstate, ms, message` as a grid row; DBX smoke test in phase 2 |
| DBX splits `$$` bodies on `;` | Med×High | Functions live only in `00-setup.sql`; smoke test; fallback one-liner `docker exec -i … psql … < 00-setup.sql` printed in prep panel |
| Human start offset breaks two-session timing | Med×Med | A always starts first and sleeps a window ≥ 8 s; guide says "start B within 5 s; if late, rerun" |
| Measurement contradicts slide or expectation | Med×Med | Contradiction workflow; narrative/chip change, data untouched |
| Writes leak to other schemas | Low×High | Prefix rules, static grep, catalog check, fingerprints |
| Delegate drift from the contract | Med×Med | Frozen `contract.md`, `verify.mjs fragment`, disjoint file ownership |
| HTML overflow at 375 px (EXPLAIN, SVG) | Med×Low | `pre` scrolls inside `.code`; SVG `width:100%`; render gate |
| Learner session holds a lock during setup | Low×Med | `lock_timeout = '5s'` in setup → 55P03 fast, retry message |

Rollback: everything is additive. Remove the lab directory, GUIDE and PLAN build artifacts; drop the schema with `LAB/99-cleanup.sql`. Docs edits are restored from `PLAN/backup/*.orig` copies taken before editing. No git command beyond `git status` is used.

## Open questions for the user

None blocking. One preference with a default: the homework reference solution sits behind a closed `details.fold` (default) rather than hidden entirely.

=== FILE: phase-01-contract-and-tests-first.md ===
---
phase: 1
title: "Contract and tests first"
status: pending
priority: P1
effort: 1.5h
dependencies: []
---

# Phase 1 — Contract and tests first

## Goal
Freeze every interface delegates and the controller share, and write the checks before the things they check: expected results, run scripts, source fingerprint, and the guide verifier with self-tests.

## Files to create/modify (owner: controller)
- `PLAN/contract.md`
- `PLAN/tests/expected-results.tsv`
- `PLAN/tests/run-sql.sh`, `PLAN/tests/run-pair.sh`, `PLAN/tests/run-all.sh` (run-all filled in phase 4)
- `PLAN/tests/fingerprint.sql`
- `PLAN/tests/verify.mjs` (Node built-ins only, controller-only, never shown to the learner)
- `PLAN/tests/fixtures/selftest-good/` and `PLAN/tests/fixtures/selftest-bad/` (tiny HTML + SQL + run files)
- `PLAN/build/assemble.mjs`
- `PLAN/runs/fingerprint-before.txt`

## Tasks and steps
1. Write `contract.md` with these frozen sections:
   - **Naming.** Schema `lab07_modeling` only. Fixtures (built by setup): `order_sheet`, `wallets`, `transfers`, `ledger_entries`; functions `try_sql(label text, q text) RETURNS TABLE(label text, ok boolean, sqlstate text, ms numeric, message text)`, `set_updated_at()`, `reset_ledger()`, `ledger_check_balanced()`, `ledger_append_only()`; extension `btree_gist` in `lab07_modeling`. Experiment tables `e01_`…`e08_`; learner challenges `my_`; homework `bt_`; reference solution `sol_`; test fixtures `bad_`. An `eNN` file writes only `eNN_*` objects, except e08, which calls `reset_ledger()` first and then posts only valid transfers.
   - **File header** (every LAB `.sql`): Vietnamese comment with stage, purpose, "Chạy: DBX → ADVANCE_BE_LAB → Ctrl+A → Run", then `SET search_path = lab07_modeling; SET statement_timeout = '120s'; SET lock_timeout = '10s'; SET idle_in_transaction_session_timeout = '2min';`. No psql meta-commands (DBX cannot run them). LF line endings. Parts are separated by `-- ===== PHẦN k: <title> =====`.
   - **Two-session files.** `*-A.sql` always starts first. Every step emits `SELECT to_char(clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh','HH24:MI:SS.MS') AS t, '<A1 · mô tả>' AS buoc;`. A sleeps at least 8 s before its decisive step. Expected errors use `try_sql`.
   - **Determinism.** No `random()` in data generation except the deliberate volatile-default DDL in e04; generated data uses `generate_series` and modular arithmetic.
   - **Run ids.** `setup`, `check-before`, `check-after-setup`, `check-rerun`, `check-final`, `e01`…`e08`, `e03-race-A|B|timeline`, `e04-index-A|B|timeline`, `e08-deadlock-A|B|timeline`, `e08-ordered-A|B|timeline`, `hw-check-sol`, `hw-check-bad`, `challenge-check-clean`, `challenge-check-ref`, `setup-locked`, `fingerprint-before|after`. Files are `PLAN/runs/<id>.txt`. Widget data is `PLAN/runs/w-<widget>.json`; every measured leaf is `{"v": "<exact text>", "src": "<id>.txt#<line>"}`.
   - **Fragment format.** One file per stage `PLAN/build/fragments/chang-N.html` with exactly one `<section id="chang-N" class="stage col">`, using the lesson-14 structure (`stage-head`, `goal`, `dl.wwh`, `figure.slide-fig` with `../../Tài Liệu/advanced_backend/assets/7_Data_Modeling/page_XX_*.png` and `onerror` hide, callouts `teacher|key|pg|cite-mysql|warn`). Slides with a chip get a callout `id="sl-N"` containing a `.sayvs` block "Slide nói / PG 16 đo được". Walkthrough is `<div class="walkthrough">`, challenge is `<div class="challenge">` with an `<ol class="criteria">`. SQL is `<pre class="sql" data-sql="<file>" data-part="k"></pre>` (empty; the assembler fills it). Run output is `<div class="run-label">Kết quả đã chạy trên máy bạn ngày DD/MM/2026 · <code>id</code></div><div class="code terminal"><pre data-run="<id>.txt" data-lines="a-b"></pre></div>`. Inline measured numbers are `<b class="m" data-run="<id>">exact text</b>`. Widgets are `<div class="widget" data-widget="<name>" data-src="w-<name>">`. Quiz is `<div class="quiz" data-quiz="N"></div><script type="application/json" id="quiz-N">[{q,opts,ans,why}]</script>`. Inputs use `data-store="l07-cN-*"`. No `<style>` or executable `<script>` in fragments.
   - **Widget API.** `PLAN/build/widgets/<name>.js` contains only `WIDGETS['<name>'] = (root, data, ctx) => { … };` where `ctx = {$, $$, esc, store, press}` and `data` is the parsed `#run-w-<name>` JSON. No globals, no network, no storage keys outside `l07-`.
   - **CSS vocabulary.** The lesson-14 classes plus `.walkthrough`, `.challenge`, `.criteria`, `pre.sql`, `.copy-btn`, `.erd` (inline SVG; colours via CSS variables), `.stepper`, `.grid-days`, `.ledger-tbl`. New classes need a controller change to the template.
   - **Chip rule.** `ok`: slide advice holds on PG 16 as measured. `diff`: true for (old) MySQL, PG behaves differently. `fix`: following the advice on PG causes harm or wasted work. Every chip cites an `expected-results.tsv` id.
2. Write `expected-results.tsv` (columns: `id, run, regex, slides, chip`) with one row per matrix line in plan.md, regexes concrete (for example `e05.4  e05  0\.30000000000000004  23  ok`).
3. Write `run-sql.sh <sql> <id> [sed-expr]`. It prints the header `-- Ghi lúc DD/MM/YYYY HH:MM:SS (UTC+7) · nguồn: <file>` (use `TZ=ICT-7`, since Git Bash may lack tzdata), then pipes `\timing on` plus the file (optionally passed through `sed`) into `MSYS_NO_PATHCONV=1 docker exec -i quan-ly-hop-dong-postgres-1 psql -X -a -P pager=off -v ON_ERROR_STOP=0 -v VERBOSITY=verbose -U postgres -d advance_be_lab`, and appends `[exit N]`. Output goes to `PLAN/runs/<id>.txt`. Write `run-pair.sh <A.sql> <B.sql> <id>`. It starts A in the background, sleeps 2 s, runs B, waits, then builds `<id>-timeline.txt` by sorting the `HH:MM:SS.mmm | X…` lines from both outputs.
4. Write `fingerprint.sql` (read-only): count plus `md5(string_agg(row::text, ',' ORDER BY pk))` for `lab03_indexing.hw_contracts` (expect 500,000), `northwind.orders/order_details/products/customers` (830/2,155/77/91); exact counts for every table in `lab12_transaction`, `lab14_locking`, `lab_imdb`, `public` via `query_to_xml`; the database `search_path` row from `pg_db_role_setting` (expect `lab03_indexing, public`). Run it now: `bash PLAN/tests/run-sql.sh PLAN/tests/fingerprint.sql fingerprint-before`.
5. Write `verify.mjs` with modes:
   - `runs`: every tsv regex must be found in its run file, unless the id is listed in `runs/contradictions.md`. Every run file must start with `-- Ghi lúc`. Scan for secrets (`postgres(ql)?://`, `password`, `PGPASSWORD`).
   - `fragment <file>`: checks `data-sql` and part exist; `data-run` files exist; `b.m` containment; quiz JSON valid (≥ 4 items, `ans` in range); `data-store` prefix `l07-`; no `<script src>`, `<style>`, or executable script.
   - `guide`: all fragment checks on the assembled GUIDE, plus `<pre data-sql>` text equals file or part exactly, `<pre data-run>` lines are an in-order subsequence of the run file, `#run-*` JSON deep-equals `runs/*.json`, every `{v,src}` leaf found on its cited line, `SLIDES` 1..43 complete with chips equal to the tsv/contract map, every `href="#…"` and `id` unique and resolvable, `img src` files exist, ≤ 260 KB, external hosts only `fonts.googleapis.com`/`fonts.gstatic.com`, sections `#chang-1..8` each contain `.walkthrough`, `.challenge`, `.quiz`, `EXAM` has 10 items, and every non-contradicted tsv run id is referenced at least once.
   - `selftest`: runs `fragment`/`guide`/`runs` against `fixtures/selftest-good` (must pass) and each case in `fixtures/selftest-bad` (must fail with the named reason). The bad cases are: one changed character in a `data-sql` pre, a `b.m` value missing from its run, an `l14-` key, a `<script src>`, slide 17 missing, a run file without a regex match and no contradiction entry, a widget leaf whose `src` line lacks `v`, and a run file containing `postgresql://`.
6. Write `assemble.mjs`. It reads `PLAN/build/guide.template.html`, replaces `<!-- @fragment chang-N -->` with fragment files, fills `pre[data-sql]` (with an optional part) and `pre[data-run]` (with optional `data-lines`) with HTML-escaped file text, inlines `runs/w-*.json` and `quiz-N` JSON, concatenates `build/widgets/*.js` between `/* @widgets */` markers, and writes GUIDE. It does not edit any value.

## Test matrix (test first)
| Test | Expected | Command |
|---|---|---|
| verifier self-test, good fixture | pass | `node PLAN/tests/verify.mjs selftest` |
| 8 bad fixtures | each fails with its named reason; overall exit 0 only if all fail as expected | same |
| fingerprint baseline | hw_contracts 500000, orders 830, order_details 2155, products 77, customers 91, search_path `lab03_indexing, public` | `bash PLAN/tests/run-sql.sh PLAN/tests/fingerprint.sql fingerprint-before` then `grep` |
| runner header | first line starts `-- Ghi lúc`; last line `[exit 0]` | `head -1 PLAN/runs/fingerprint-before.txt; tail -1 …` |

## Verification
`node PLAN/tests/verify.mjs selftest && head -1 PLAN/runs/fingerprint-before.txt && grep -c '' PLAN/tests/expected-results.tsv` (rows ≥ 41).

## Risks and rollback
The verifier may be too strict and reject a valid excerpt. Fix the verifier and its fixture, never the data. Rollback: delete `PLAN/tests`, `PLAN/build`, `PLAN/contract.md`. Nothing in the DB is touched in this phase (the fingerprint is read-only).

=== FILE: phase-02-lab-foundation-setup-check.md ===
---
phase: 2
title: "Lab foundation: setup, check, graders"
status: pending
priority: P1
effort: 1h
dependencies: [1]
---

# Phase 2 — Lab foundation

## Goal
An idempotent `00-setup.sql` that a learner runs with `Ctrl+A → Run` in DBX, a `check.sql` returning ✔/✘ rows, the challenge and homework graders, and cleanup. The checks are written and run before setup.

## Files to create/modify (owner: controller)
- `LAB/check.sql`, `LAB/00-setup.sql`, `LAB/99-cleanup.sql`
- `LAB/challenge-check.sql`, `LAB/hw-check.sql`
- `PLAN/tests/hw-bad-fixture.sql`, `PLAN/tests/challenge-ref.sql`, `PLAN/tests/drop-test-objects.sql`, `PLAN/tests/hold-lock-A.sql`
- `PLAN/runs/check-before.txt`, `setup.txt`, `check-after-setup.txt`, `check-rerun.txt`, `setup-locked.txt`, `dbx-smoke.md`

## Tasks and steps
1. **`check.sql` first.** It returns `(ma, kiem_tra, ket_qua, chi_tiet)` rows. It must not error when the schema is missing: each count uses `CASE WHEN to_regclass('lab07_modeling.x') IS NULL THEN NULL ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM lab07_modeling.x', false, true, '')))[1]::text::bigint END`. Checks:
   - C1 schema exists. C2 `btree_gist` installed with `extnamespace = lab07_modeling`. C3 `try_sql`, `set_updated_at`, `reset_ledger` exist.
   - C4 `order_sheet` = 2,155 = `northwind.order_details` count.
   - C5 every transfer sums to 0. C6 all entries sum to 0. C7 cached `wallets.balance` = `SUM(ledger_entries.amount)` per wallet (0 mismatches). C8 no wallet < 0 unless `allow_negative`. C9 ledger triggers present.
   - C10 sources: hw_contracts 500,000; orders 830; order_details 2,155; products 77; customers 91. C11 database `search_path` still `lab03_indexing, public`.
   - C12 no object matching `^(e0[1-8]_|my_|bt_|sol_|bad_)` outside `lab07_modeling`.
   Each ✘ row carries a Vietnamese hint ("chạy lại 00-setup.sql").
2. **`00-setup.sql`.** Start with `SET lock_timeout = '5s'; SET statement_timeout = '120s';`, then `DROP SCHEMA IF EXISTS lab07_modeling CASCADE; CREATE SCHEMA lab07_modeling; SET search_path = lab07_modeling; CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA lab07_modeling;`. Then:
   - `try_sql`: PL/pgSQL. It runs `EXECUTE q` inside `BEGIN … EXCEPTION WHEN OTHERS`, measures `clock_timestamp()` deltas, and returns one row with `ok`, `SQLSTATE`, `ms`, `SQLERRM`.
   - `set_updated_at()`: trigger function that sets `NEW.updated_at = now()`.
   - `order_sheet`: frozen DDL (`order_id smallint, product_id smallint, order_date date, customer_id text, customer_company text, customer_city text, customer_country text, employee_name text, shipper_name text, product_name text, category_name text, supplier_company text, unit_price numeric(10,2), quantity smallint, discount numeric(4,2), PRIMARY KEY (order_id, product_id)`), filled by joining `northwind` order_details, orders, customers, employees, shippers, products, categories and suppliers, with `round(unit_price::numeric, 2)`.
   - Ledger, frozen DDL:
     - `wallets(id bigint PK, owner text NOT NULL, kind text CHECK (kind IN ('external','store','customer','platform')), allow_negative boolean NOT NULL DEFAULT false, balance numeric(18,2) NOT NULL DEFAULT 0, version int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT wallets_balance_nonneg CHECK (allow_negative OR balance >= 0))`
     - `transfers(id bigint GENERATED ALWAYS AS IDENTITY PK, kind text CHECK (kind IN ('opening','transfer','split')), memo text, created_at timestamptz NOT NULL DEFAULT now())`
     - `ledger_entries(id bigint GENERATED ALWAYS AS IDENTITY PK, transfer_id bigint NOT NULL REFERENCES transfers, wallet_id bigint NOT NULL REFERENCES wallets, amount numeric(18,2) NOT NULL CHECK (amount <> 0), created_at timestamptz NOT NULL DEFAULT now())`, plus indexes on `wallet_id` and `transfer_id`.
     - `ledger_check_balanced()`: statement-level `AFTER INSERT … REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT`. It raises `check_violation` (23514) when any touched `transfer_id` has `sum(amount) <> 0`. The rule: all legs of one transfer go in one `INSERT`.
     - `ledger_append_only()`: `BEFORE UPDATE OR DELETE` row trigger raising `restrict_violation` (23001).
     - `reset_ledger()`: `TRUNCATE ledger_entries, transfers RESTART IDENTITY`, upsert wallets 1 "Ngân hàng (nguồn tiền ngoài)" external with `allow_negative`, 2 "Cửa hàng Q1" store, 3 "Khách An" customer, 4 "Nền tảng OmniPOS" platform, all to 0, then one opening transfer (bank −600,000.00; An +500,000.00; store +100,000.00) and matching cached balances.
     - Call `SELECT reset_ledger();`.
   - End with a "thẻ dữ liệu" SELECT (row counts, balances).
3. `99-cleanup.sql`: `DROP SCHEMA IF EXISTS lab07_modeling CASCADE;` with a Vietnamese comment.
4. **`challenge-check.sql`**: one row per stage challenge, `—` when the `my_*` objects are absent.
   - c2: `my_customers/my_orders/my_order_lines/my_products` exist with PK/FK, and the join back `EXCEPT` `order_sheet` both ways gives 0 rows.
   - c3: `my_comments_arc` has `num_nonnulls` CHECK, 2 FKs, both FK columns indexed.
   - c4: `my_items` has template columns, an `updated_at` trigger, and an expression index on `(attrs->>'brand')`.
   - c5: `my_payments` has no float/real/double, uses timestamptz, and `sum(amount)` equals the exact value.
   - c6: `my_bookings` has an exclusion constraint (`contype = 'x'`).
   - c7: `my_posts.tags` has a GIN index, and `my_daily_report` is an MV with a unique index.
   - c8: a `split` transfer with 3 legs exists and C5–C8 still hold.
   Stage 1 has no SQL check (its answer is checked in-page against recorded e01 values).
5. **`hw-check.sql`**: starts `WITH cfg AS (SELECT 'bt_'::text AS p)`. Rows:
   - H1 ≥ 4 tables with the prefix. H2 every table has a PK. H3 every table has `status`, `version int NOT NULL`, `created_at`/`updated_at` timestamptz.
   - H4 no `real`/`double precision`/`money` columns. H5 no `timestamp without time zone` unless the table has a `*timezone*`/`*_tz` column.
   - H6 every FK column is the leading column of some index. H7 a unique or exclusion constraint covers a column named like `%seat%`. H8 every `status` column has a CHECK or an FK.
6. Test fixtures:
   - `hw-bad-fixture.sql` creates `bad_flights`, `bad_seats`, `bad_bookings`, `bad_passengers` with float price, naive timestamp, unindexed FK and no seat uniqueness.
   - `challenge-ref.sql` creates reference `my_*` objects.
   - `drop-test-objects.sql` drops `bad_*` and `my_*` so the learner starts clean.
   - `hold-lock-A.sql` runs `BEGIN; LOCK TABLE lab07_modeling.wallets IN ACCESS SHARE MODE; SELECT pg_sleep(8); COMMIT;`.
7. **DBX smoke** (controller, through the DBX MCP tools on `ADVANCE_BE_LAB`): run `00-setup.sql` as one script, then a three-statement script whose middle statement fails, then `SELECT * FROM try_sql('x','SELECT 1/0')`. Record in `runs/dbx-smoke.md` whether `$$` bodies survive, whether DBX continues after an error, and whether multiple grids show. If MCP cannot emulate `Ctrl+A`, mark it `[UNVERIFIED]` and put the psql fallback one-liner in the guide prep panel.

## Test matrix (test first)
| Test | Expected | Command |
|---|---|---|
| check before setup | runs without error; C1–C9 ✘, C10–C12 ✔ | `bash PLAN/tests/run-sql.sh LAB/check.sql check-before` |
| setup | `[exit 0]`, card shows 2155 lines, 4 wallets | `… LAB/00-setup.sql setup` |
| check after setup | 12 × ✔ | `… LAB/check.sql check-after-setup` |
| setup rerun (idempotent) | 12 × ✔, same counts | run setup again, then `… check.sql check-rerun` |
| setup under foreign lock (negative) | 55P03 within ~5 s, no hang; rerun later ✔ | `bash PLAN/tests/run-pair.sh PLAN/tests/hold-lock-A.sql LAB/00-setup.sql setup-locked` |
| challenge-check clean | every row `—` | `… LAB/challenge-check.sql challenge-check-clean` |
| hw-check on bad fixture | ✘ on H4, H5, H6, H7 | run fixture, then `… LAB/hw-check.sql hw-check-bad "s/'bt_'::text/'bad_'::text/"` |
| challenge-check on reference | every row ✔ | run `challenge-ref.sql`, then `… challenge-check.sql challenge-check-ref`, then `drop-test-objects.sql` |

## Verification
`grep -c '✔' PLAN/runs/check-after-setup.txt` = 12; `diff <(grep '✔\|✘' PLAN/runs/check-after-setup.txt) <(grep '✔\|✘' PLAN/runs/check-rerun.txt)` is empty; `grep -c '55P03' PLAN/runs/setup-locked-B.txt` ≥ 1.

## Risks and rollback
`DROP SCHEMA … CASCADE` is scoped to `lab07_modeling` only (the static grep in phase 3 confirms no other `DROP SCHEMA`). If `btree_gist` were already installed elsewhere, C2 fails loudly instead of silently resolving operators from another schema. Rollback: run `LAB/99-cleanup.sql` and delete the LAB files.

=== FILE: phase-03-experiment-sql-authoring.md ===
---
phase: 3
title: "Experiment SQL authoring (parallel)"
status: pending
priority: P1
effort: 1.5h
dependencies: [2]
---

# Phase 3 — Experiment SQL authoring

## Goal
Write every learner-facing experiment file against the frozen contract. Four delegates work in parallel on disjoint files. They do not run SQL against the DB (the controller runs everything serially in phase 4), but may read `contract.md`, the slides `.md`, and phase-2 LAB files.

## Files to create (owner in brackets; disjoint)
- [D1] `LAB/e01-erd-loai-bang.sql`, `LAB/e02-chuan-hoa.sql`
- [D2] `LAB/e03-khoa-ngoai-polymorphic.sql`, `LAB/e03-race-A.sql`, `LAB/e03-race-B.sql`, `LAB/e04-dinh-dang-bang.sql`, `LAB/e04-index-A.sql`, `LAB/e04-index-B.sql`
- [D3] `LAB/e05-kieu-du-lieu.sql`, `LAB/e06-case-studies.sql`, `LAB/e07-tag-bao-cao-view.sql`
- [D4] `LAB/e08-so-cai-kep.sql`, `LAB/e08-deadlock-A.sql`, `LAB/e08-deadlock-B.sql`, `LAB/e08-ordered-A.sql`, `LAB/e08-ordered-B.sql`, `LAB/hw-solution.sql`, `LAB/prisma-drill/schema.ai.prisma`, `LAB/prisma-drill/schema.fixed.prisma`, `PLAN/runs/prisma-claims.md`
- [controller] `PLAN/tests/lint-sql.sh`, `PLAN/tests/fixtures/selftest-bad/lint-bad.sql` (written before the linter)

Each delegate prompt includes the task, files it may write, `contract.md`, the expected-results rows it must satisfy, the constraints (no DB writes, no `node_modules`, no git, no `--yagni` flag passed so full scope), and the status protocol.

## Tasks and steps
Each file is split into `PHẦN k` parts that map 1:1 to expected-result rows. Plain SELECTs show grids. Expected errors go through `try_sql`. EXPLAIN uses `(ANALYZE, BUFFERS)`.
1. **e01** (D1): (1) the `northwind` FK edges from `pg_constraint`, with a CASE table-type label; (2) FK columns without a leading index (read-only catalog); (3) slide 12 with `e01_orders` + `e01_payment_txns`, the kind CHECK, and the 23514 case. Rows e01.1–e01.3.
2. **e02** (D1): (1) `e02_sheet_0nf` with `items` built by `string_agg`, and the `LIKE '%Tofu%'` false positive; (2) the update anomaly on an `e02_flat` copy inside `BEGIN … ROLLBACK`; (3) the insert anomaly 23502; (4) the delete anomaly; (5) the 3NF split `e02_customers/orders/products/order_lines` with duplicate counts before/after; (6) the cached `order_total`, both EXPLAINs, a stale line and the reconciliation query. Rows e02.1–e02.6.
3. **e03** (D2): (1) `e03_parent` with 20,010 rows (20,001–20,010 have no children), and `e03_child_nofk` vs `e03_child_fk` with 500,000 rows each, both timed; (2) the child's indexes, then `BEGIN; EXPLAIN (ANALYZE) DELETE FROM e03_parent WHERE id = 20001; ROLLBACK;` to show the RI trigger time, then `CREATE INDEX` and a repeat on 20002; (3) polymorphic `e03_comments_poly`, exclusive arc `e03_comments_arc` with `CHECK (num_nonnulls(post_id, product_id) = 1)`, and per-parent join tables. Rows e03.1, e03.2, e03.4.
4. **e03 race pair** (D2), row e03.3. A recreates `e03_race_parent_nofk`, `e03_race_parent_fk` and their children, checks that parent 7 exists, sleeps 8 s, inserts a child into each (the FK insert through `try_sql`), and counts orphans. B deletes parent 7 from both and commits.
5. **e04** (D2): (1) `e04_contracts`, a copy of `lab03_indexing.hw_contracts`, with `pg_relation_filenode` before/after each ALTER and its `try_sql` ms; (2) `pg_locks` inside the ALTER txn; (3) `json` vs `jsonb`; (4) `e04_products_json` with 200,000 rows and 50 colours, EXPLAINed before/after the expression index and GIN `jsonb_path_ops`; (5) `e04_spare` row sizes; (6) `e04_template` with the trigger off/on and version CAS. Rows e04.1–e04.6.
6. **e04 index pair** (D2), row e04.7. It runs after e04 and reuses `e04_contracts`. A (the writer) starts first.
   - Round 1: B holds `BEGIN; CREATE INDEX …; pg_sleep(10); ROLLBACK;`. A runs `try_sql(INSERT)` with `lock_timeout 3s` and gets 55P03.
   - Round 2: A opens a read txn and sleeps. B runs `CREATE INDEX CONCURRENTLY` and waits on `virtualxid`. A's INSERT succeeds; A snapshots `pg_locks`/`pg_stat_activity`, then commits. B prints `indisvalid`.
   - B also runs CIC through `try_sql`, which gives 25001.
   - Leave ≥ 5 s of slack for a human start.
7. **e05** (D3): string, number/money (including Northwind `real` revenue), time (`SET TimeZone` inside the file, reset at the end), NULL. Rows e05.1–e05.6.
8. **e06** (D3): translations; bisection with a recursive CTE for float8/float4/numeric, plus a rebalance `UPDATE … FROM (row_number()*1000)`; `e06_availability` from `generate_series` with the conditional UPDATE; `e06_bookings` with a `daterange` exclusion; calendar slots. Rows e06.1–e06.5.
9. **e07** (D3): tags (`e07_posts` with 100,000 rows and deterministic tags, a join table, GIN, rename cost); report (`e07_clicks` with 1,000,000 rows, exact count vs `reltuples`, `hll`/`pg_cron` availability, MV stale demo, `CONCURRENTLY` 55000 then a unique index); views (inlining EXPLAINs, updatable view, 0A000, 44000). The security layer is explained in a comment with `GRANT` text only; no role is created. Rows e07.1–e07.4.
10. **e08** (D4): (1) `SELECT reset_ledger();`; (2) the posting walkthrough: `BEGIN; SELECT id FROM wallets WHERE id IN (2,3) ORDER BY id FOR UPDATE;`, conditional debit `… AND balance >= 30000.00`, credit, `INSERT` the transfer, one two-row `INSERT` of entries, `COMMIT`; (3) invariants and reconciliation; (4) negatives (rowcount 0, 23514 ×2, 23001, corrupt cache in ROLLBACK); (5) the 3-leg split (100,000 → 95,000 + 5,000) in one INSERT. Rows e08.1, e08.4.
11. **e08 pairs** (D4), rows e08.2–e08.3. In the deadlock pair, A locks wallet 2, sleeps 8 s, then locks wallet 3 through `try_sql`; B locks 3, then 2; A is the victim. In the ordered pair, both lock (2,3) with `ORDER BY id FOR UPDATE`, and A holds for 6 s. Each file ends with the invariant query.
12. **hw-solution.sql** (D4): `sol_airports`, `sol_flights` (timestamptz departure plus an IANA zone), `sol_seats`, `sol_passengers`, `sol_bookings`, `sol_booking_seats` (unique `(flight_id, seat_no)`); numeric money, template columns, triggers, FK indexes, status CHECKs.
13. **Prisma drill** (D4). `schema.ai.prisma` (about 45 lines, OmniPOS) seeds 7 mistakes:
    1. `Float` money
    2. `DateTime` without `@db.Timestamptz(3)`
    3. `walletId` without `@@index`
    4. polymorphic `targetType/targetId`
    5. comma-list `tags String`
    6. no `version`/`updatedAt`
    7. an inexpressible `CHECK (balance >= 0)`
    `schema.fixed.prisma` holds the fix and points to the migration SQL for the CHECK. `prisma-claims.md` gives each claim a verified source (Prisma docs via WebFetch with a quote, or `unpkg.com/<pkg>@7.9.0/…`; never `node_modules`). Claims: Float→`double precision`, DateTime→`timestamp(3)`, `@db.Timestamptz`, no auto index on relation scalars for PostgreSQL, no polymorphic relations, CHECK only via a customized migration, `@updatedAt` set client-side, and the Prisma 7 datasource URL in `prisma.config.ts`. An unverifiable claim is dropped, not guessed.
14. **Controller: `lint-sql.sh`** greps all LAB `*.sql`. It fails on:
    - missing header `SET` lines (setup, check and cleanup only need the timeouts);
    - any line starting with `\`;
    - CRLF;
    - writes to other schemas: `(INSERT INTO|UPDATE|DELETE FROM|ALTER TABLE|CREATE (TABLE|INDEX|VIEW|MATERIALIZED)|DROP|TRUNCATE)[^;]*(lab03_indexing|lab12_transaction|lab14_locking|lab_imdb|northwind|public|maycha_lease)\.`;
    - `CREATE ROLE|ALTER (DATABASE|ROLE|SYSTEM)`;
    - `DROP SCHEMA` other than in `00-setup.sql`/`99-cleanup.sql`;
    - an `eNN` file creating objects without its own prefix;
    - a two-session file without timestamp step rows.

## Test matrix (test first)
| Test | Expected | Command |
|---|---|---|
| lint on a planted bad file (CRLF + `\timing` + `INSERT INTO northwind.x`) | 3 failures reported | `bash PLAN/tests/lint-sql.sh PLAN/tests/fixtures/selftest-bad/lint-bad.sql` |
| lint on all LAB SQL | exit 0 | `bash PLAN/tests/lint-sql.sh LAB/*.sql` |
| Prisma claims | every claim row has a source URL and status `verified` | `grep -c 'verified' PLAN/runs/prisma-claims.md` |
| no node_modules access | delegate report states the sources used | review of delegate status |

## Verification
`bash PLAN/tests/lint-sql.sh D:/study/advance-be/labs/lesson-07-data-modeling/*.sql && ls LAB | wc -l` (expect 23 entries: 5 foundation files, 16 experiment files, `hw-solution.sql`, the `prisma-drill` dir).

## Risks and rollback
Delegates cannot run SQL, so syntax bugs surface in phase 4. The controller fixes them there and logs each fix in `runs/contradictions.md` under "SQL bug fixed (not a contradiction)". Rollback: delete the delegate's files and re-brief.

=== FILE: phase-04-serial-runs-and-recording.md ===
---
phase: 4
title: "Serial runs and recording"
status: pending
priority: P1
effort: 1h
dependencies: [3]
---

# Phase 4 — Serial runs and recording

## Goal
Run every experiment once serially through psql, record verbatim outputs, prove idempotency and source safety, compare against expected results, and derive widget JSON with line-level provenance.

## Files to create/modify (owner: controller)
- `PLAN/tests/run-all.sh`
- `PLAN/runs/*.txt` (ids from the contract), `PLAN/runs/w-*.json` (10 files), `PLAN/runs/contradictions.md`, `PLAN/runs/fingerprint-after.txt`
- LAB `*.sql` only for SQL-bug fixes (logged)

## Tasks and steps
1. Write `run-all.sh` in this fixed order:
   1. setup
   2. e01–e08 (single-session)
   3. pairs `e03-race`, `e04-index`, `e08-deadlock`, `e08-ordered`
   4. `hw-solution.sql`, `hw-check` with prefix `sol_` → `hw-check-sol`
   5. `check.sql` → `check-final`
   6. `fingerprint.sql` → `fingerprint-after`
   Runs are strictly serial (one psql at a time, except inside a pair). Before each pair, the script confirms that no other `psql` session from this machine is active in `pg_stat_activity` with `application_name = 'psql'`.
2. Run it: `bash PLAN/tests/run-all.sh`.
3. Idempotency: rerun each single-session `eNN` a second time into `PLAN/runs/rerun/eNN.txt` and diff row counts and SQLSTATEs (timings may differ). `rerun/` is evidence only; the guide cites first runs.
4. Run `node PLAN/tests/verify.mjs runs`. For each failing regex, open the run. If it is an SQL bug, fix it, log it, and rerun that file. If it is a real PG behaviour, write a `contradictions.md` entry (id, expected, observed lines, new narrative sentence, new chip). Never edit a run file.
5. Build one `runs/w-<widget>.json` per widget in the stage map (`plan-switch` gets three: `-json`, `-tags`, `-view`) by hand from the run files. Every measured leaf is `{"v": "...", "src": "eNN.txt#L"}`; labels are plain strings.
6. Rerun `node PLAN/tests/verify.mjs runs`. It now also checks the `{v,src}` leaves.

## Test matrix (test first)
| Test | Expected | Command |
|---|---|---|
| expected-results | all rows pass or are listed as contradictions | `node PLAN/tests/verify.mjs runs` |
| invariants after all experiments | `check-final`: 12 × ✔ | `grep -c '✔' PLAN/runs/check-final.txt` |
| sources untouched | fingerprint diff empty except the header line | `diff <(tail -n +2 PLAN/runs/fingerprint-before.txt) <(tail -n +2 PLAN/runs/fingerprint-after.txt)` |
| no leaked objects | C12 ✔ in check-final; catalog query returns 0 rows | included in check.sql |
| rerun idempotent | same row counts and SQLSTATEs on second run | `diff` of `grep -E 'rows?\)|SQLSTATE|^ *[ft] \|'` between first and rerun |
| two-session outcomes | race-A shows 23503 and orphan 1/0; index-A 55P03 then INSERT 0 1; deadlock-A 40P01; ordered: no 40P01 | regexes in tsv |
| hw-check on solution | all ✔ | `grep -c '✘' PLAN/runs/hw-check-sol.txt` = 0 |
| widget provenance (negative) | changing one `v` in a copy fails | `node PLAN/tests/verify.mjs selftest` (fixture case) |

## Verification
`node PLAN/tests/verify.mjs runs && grep -L '^-- Ghi lúc' PLAN/runs/*.txt` (expect no file listed).

## Risks and rollback
A long run (e03 FK insert takes about 9 s, e07 1M clicks takes a few seconds) is fine under the 120 s statement timeout. If a two-session run desyncs on this machine, raise the sleep windows in A/B (contract change logged) and rerun the pair. A fingerprint diff on `lab14_locking` may be the learner's own activity; check `pg_stat_activity` and the timeline before blaming the lab. Rollback: delete `PLAN/runs/*` except `fingerprint-before.txt`, run `LAB/00-setup.sql`, rerun.

=== FILE: phase-05-guide-fragments-and-widgets.md ===
---
phase: 5
title: "Guide fragments, widgets, template"
status: pending
priority: P1
effort: 2.5h
dependencies: [4]
---

# Phase 5 — Guide fragments, widgets, template

## Goal
Write the Vietnamese teaching content per stage as fragments plus widget scripts (parallel, disjoint), and the controller-owned template carrying the shell, the shared sections and the core script.

## Files to create (owner; disjoint)
- [controller] `PLAN/build/guide.template.html`, `PLAN/build/widgets/plan-switch.js`, `PLAN/build/widgets/copy.js`
- [D1] `PLAN/build/fragments/chang-1.html`, `chang-2.html`, `PLAN/build/widgets/erd-northwind.js`, `nf-stepper.js`
- [D2] `chang-3.html`, `chang-4.html`, `widgets/fk-race.js`, `poly-shapes.js`, `ddl-cost.js`
- [D3] `chang-5.html`, `chang-6.html`, `chang-7.html`, `widgets/type-picker.js`, `bisect.js`, `booking-grid.js`
- [D4] `chang-8.html`, `PLAN/build/fragments/prisma.html`, `widgets/ledger-sim.js`

The controller's template part may start right after phase 1 and overlap phases 3–4.

## Tasks and steps
1. **Template (controller).**
   - Copy the lesson-14 `<head>` and CSS (lines 1–239) and add the contract classes. Title "Sổ tay Data Modeling · Bài 07". The hero has the eyebrow "Advance Backend · Bài 07 / 16 · sau Bài 14 Locking", hero-meta counts, and the slide-1 epigraph.
   - `#cach-hoc` contains the chip legend, the plan table, and a prep panel: `docker start …`, DBX `00-setup.sql` with `Ctrl+A → Run`, `check.sql` 12 ✔, the psql fallback one-liner, and the recorded `setup.txt` card. It also has the two-tab DBX panel (`ADVANCE_BE_LAB`/`_B`), why `try_sql` exists, a "Nhắc nhanh Bài 14" callout (`FOR KEY SHARE`, 23514, `ORDER BY id FOR UPDATE`, 40P01) so stage 8 works before lesson 14 stage 5, and the `l07-warmup` textarea.
   - Fragment markers go in for `chang-1..8` and `prisma`.
   - `#bai-tap` (slide 35) has the requirements, the table template, the `bt_` names, `hw-check.sql`, the `hw-check-sol` excerpt, and the solution in a closed fold.
   - `#phong-van` has 10 `EXAM` Q&A, each citing a measured number: 3NF vs denormalization, FK in PG vs MySQL, polymorphic options, jsonb indexing, zero-downtime DDL, money types, timestamptz, ordering keys, ledger invariants, posting concurrency.
   - `#cheat-sheet` has the type table, the DDL lock table, the SQLSTATE table (22001, 22003, 23502, 23503, 23505, 23514, 23P01, 23001, 25001, 40P01, 44000, 54000, 55000, 55P03, 0A000), the posting template, and the Prisma 7 mapping.
   - `#tham-khao` has the slide-36 links, PG 16 docs (ALTER TABLE, CREATE INDEX CONCURRENTLY, jsonb/GIN, datetime, views/rules, materialized views, exclusion constraints, btree_gist, triggers), MySQL cite-only, and Prisma docs.
   - `#tiep-theo` points to OmniPOS Cluster 1 phase B (migrate `wallets` + `ledger_entries`, transfer service with `$transaction` + `ORDER BY id FOR UPDATE`), then Boss Challenge 1, then Cluster 2 lesson 06 Redis.
   - The script keeps `GUIDE_DATA_START/END` with `SLIDES` (43 entries) and `EXAM`. The IIFE reuses lesson 14's store wrapper, theme toggle (`l07-theme`), `l07-`-only `data-store` binding, walk labels, a quiz renderer reading `#quiz-N`, the exam, and the slide map. It adds `const WIDGETS = {}; /* @widgets */` and mounts each `[data-widget]` with `run(src)`.
2. **Fragments (delegates)**, one section per stage, following the contract. Per stage:
   - goal, `wwh`, slide figures (available images: pages 5, 7, 9, 10, 15, 17, 20, 22, 27–31, 35, 41)
   - one `sl-N` callout per chipped slide with "Slide nói / PG 16 đo được" and its measured `b.m` values
   - walkthrough with `pre.sql` parts and run excerpts
   - widget(s)
   - challenge with criteria matching `challenge-check.sql` row cN, plus `l07-cN-*` inputs
   - fold extras
   - ≥ 4 quiz questions testing mechanism, not recall
   Stage notes:
   - **Stage 1**: an inline SVG ERD of 8 Northwind tables. The challenge input "how many FK columns lack an index?" is checked by the widget against the recorded e01 value.
   - **Stage 2**: a 0NF/1NF/2NF/3NF table diagram per step in `nf-stepper`.
   - **Stage 3**: a `walk` table for the A/B race (Tab A / Tab B / Ghi lại) plus the recorded timeline.
   - **Stage 8**: inline SVG ledger ERD; posting walkthrough; the two pairs as walk tables; reconciliation; the 3-leg challenge; recap slide 34 callout (chip fix: "JSON for sparse attributes only; anything filtered, joined or constrained is a column").
   - **Prisma fragment** (D4): `schema.ai.prisma` shown in full, 7 textareas `l07-prisma-1..7`, reveal fold with `schema.fixed.prisma`. Each finding links to the measured proof (e05.4, e05.5, e03.2, e03.4) and to `prisma-claims.md` sources.
3. **Widgets (delegates).** Each is a mechanism, not decoration:
   - `bisect`: computes midpoints live in JS (float64; float4 via `Math.fround`) until `mid` equals a bound, and shows PG's recorded 53/24 next to it. A "Rebalance" button renumbers.
   - `ledger-sim`: posts transfers live with the same guards as SQL (conditional debit, `CHECK`, sum = 0, reconciliation) and shows the recorded PG outcome codes.
   - `booking-grid`: simulates the conditional-update rowcount and the exclusion overlap rule.
   - `fk-race`: replays the recorded timeline.
   - `ddl-cost`: sorts DDL operations by ms/rewrite/lock.
   - `type-picker`: maps a field to its PG type with the recorded proof.
   - `nf-stepper` and `erd-northwind` read e01/e02 facts.
   All fit 375 px and use 44 px buttons.
4. Each delegate runs `node PLAN/tests/verify.mjs fragment <file>` and `node --check <widget.js>` before reporting.

## Test matrix (test first)
| Test | Expected | Command |
|---|---|---|
| fragment checks (per file) | exit 0 | `node PLAN/tests/verify.mjs fragment PLAN/build/fragments/chang-N.html` |
| widget syntax | exit 0 | `node --check PLAN/build/widgets/<name>.js` |
| key prefix (negative) | an `l14-` key fails | selftest fixture |
| quiz count | ≥ 4 per stage, `ans` in range | fragment mode |
| slide coverage | every chipped slide in this stage has `id="sl-N"` | fragment mode, against the contract map |

## Verification
`for f in PLAN/build/fragments/*.html; do node PLAN/tests/verify.mjs fragment "$f" || exit 1; done; for w in PLAN/build/widgets/*.js; do node --check "$w" || exit 1; done`

## Risks and rollback
Fragments may contradict recorded data; `b.m` containment catches numbers, and review catches prose. Visual inconsistency between delegates is limited by the fixed CSS vocabulary. Rollback per fragment: delete and re-brief the owner. The template is independent.

=== FILE: phase-06-assemble-verify-render.md ===
---
phase: 6
title: "Assemble, verify, render-check"
status: pending
priority: P1
effort: 1h
dependencies: [5]
---

# Phase 6 — Assemble, verify, render-check

## Goal
Produce GUIDE from the template, fragments, runs and widgets; prove every guide claim traces to a file; prove the page renders cleanly.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` (generated)
- `PLAN/render/` (screenshots, report), `PLAN/tmp/` (TMP/TEMP for the render tool)
- `D:/study/advance-be/reports/advanced_backend/_l07-dark-check.html` (transient, deleted in this phase)

## Tasks and steps
1. `node PLAN/build/assemble.mjs`.
2. `node PLAN/tests/verify.mjs guide`. Fix failures at their source (fragment, template or verifier bug); never by editing GUIDE directly.
3. Mismatch drill (negative test on the real artifact): copy GUIDE to `PLAN/tmp/tamper.html`, change one character inside a `pre.sql` block, and run `node PLAN/tests/verify.mjs guide --file PLAN/tmp/tamper.html`. Expect a failure naming that file and part. Delete the copy.
4. Render-check, light: `TMP=D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/tmp TEMP=$TMP node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "$GUIDE" --out PLAN/render/light`.
5. Dark: the tool has no theme flag. Write a transient copy `_l07-dark-check.html` next to GUIDE with `<html lang="vi" data-theme="dark">` (same folder so image paths resolve), run render-check with `--out PLAN/render/dark`, then delete the copy.
6. Read the screenshots at 375/768/1440. Check that the ERD SVGs are legible at 375, EXPLAIN blocks scroll inside `.code` without page overflow, widgets are usable, and the dark palette has contrast.
7. Manual smoke in the browser console (via the render tool's errors list): quizzes render 8 × ≥ 4; each widget mounts; reload keeps `l07-*` inputs.

## Test matrix (test first)
| Test | Expected | Command |
|---|---|---|
| guide verifier | exit 0 | `node PLAN/tests/verify.mjs guide` |
| tamper copy (negative) | non-zero exit naming the `data-sql` file | step 3 |
| size budget | ≤ 260 KB | `wc -c "$GUIDE"` |
| no external script | 0 | `grep -c '<script[^>]*src=' "$GUIDE"` |
| render light/dark | 0 runtime errors, 0 overflow, touch targets pass | render reports in `PLAN/render/{light,dark}` |
| secrets | 0 hits | `grep -Eci 'postgres(ql)?://|password' "$GUIDE"` |

## Verification
`node PLAN/tests/verify.mjs guide && node PLAN/tests/verify.mjs runs && test ! -e D:/study/advance-be/reports/advanced_backend/_l07-dark-check.html`

## Risks and rollback
Render tool failures (Chrome path, TMP outside the project) are fixed by setting `TMP`/`TEMP` inside `PLAN/tmp`. Rollback: rerun the assembler after fixing sources. GUIDE is fully regenerable.

=== FILE: phase-07-ultra-review-and-fixes.md ===
---
phase: 7
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1.5h
dependencies: [6]
---

# Phase 7 — Ultra code review and fixes

## Goal
An independent ultra review (`/ak:code-review --ultra`: 5 independent reviewers plus a verifier, union of verified findings) of the lab SQL, the guide and the evidence chain. All Critical/Important findings are fixed and affected checks re-run.

## Files to create/modify
- [controller] `PLAN/reports/code-review-ultra-*.md` (written by the review skill)
- Fixes in LAB, `PLAN/build/*`, regenerated GUIDE; reruns in `PLAN/runs/`

## Tasks and steps
1. Resolve the installed code-review skill from the live skill catalog and run it in `--ultra` mode. The scope is LAB `*.sql`, `PLAN/build/**`, GUIDE, `PLAN/runs/**`, `PLAN/tests/**`, `PLAN/contract.md`, `PLAN/tests/expected-results.tsv`. Review brief:
   - PG 16 correctness per slide claim and chip
   - number traceability
   - teaching flow ("làm mẫu → tự làm")
   - DBX runnability (`search_path`, no meta-commands, `try_sql`)
   - write-scope safety
   - accessibility and overflow
   - Prisma 7.9 claims (not TypeORM)
   - lesson-14 shell fidelity (no rail, `l07-*` keys)
   - no git or ship steps
2. Triage per the review rules. Fix Critical/Important. If a finding contradicts a verified measurement, reject it with the run-file citation. If a finding asks to reverse a settled decision in `evidence-packet.md`, record it and do not apply it.
3. Re-run only what the fixes touch:
   - changed SQL → `run-sql.sh` for that file, then `verify.mjs runs`
   - changed fragments → assemble, then `verify.mjs guide`
   - layout changes → render-check
4. Record the disposition table (finding → fixed/rejected + evidence) at the end of the review report.

## Test matrix (test first)
| Test | Expected | Command |
|---|---|---|
| open Critical/Important | 0 | review report disposition table |
| regression after fixes | verify runs + guide exit 0; check-final 12 ✔; fingerprint unchanged | `bash PLAN/tests/run-sql.sh LAB/check.sql check-final && node PLAN/tests/verify.mjs runs && node PLAN/tests/verify.mjs guide` |
| render after layout fixes | clean | render-check as in phase 6 |

## Verification
The commands above, plus `diff <(tail -n +2 PLAN/runs/fingerprint-before.txt) <(tail -n +2 PLAN/runs/fingerprint-after.txt)` after any rerun of experiments (re-record `fingerprint-after` first).

## Risks and rollback
Reviewers may disagree. Union only findings the verifier confirms. A fix can break another stage; the full `verify.mjs guide` reruns every time. Rollback: restore the pre-fix fragment from the delegate's last good version (kept as `*.bak` in `PLAN/build/` until phase 8) and reassemble.

=== FILE: phase-08-docs-final-gate-handoff.md ===
---
phase: 8
title: "Docs, final gate, handoff"
status: pending
priority: P2
effort: 0.5h
dependencies: [7]
---

# Phase 8 — Docs, final gate, handoff

## Goal
Make the guide and lab discoverable, run one final gate, and leave a short note so Đạt can start tomorrow. No git write operation.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/README.md`: add `labs/lesson-07-data-modeling/` to the labs line (line 14) and the `lesson_07_data_modeling_teacher_guide.html` / `lesson-07-data-modeling/` entries in the tree (around lines 77 and 85)
- `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md`: row 07 (line 39), replacing column 5 `*ERD Design & DDL scripts*` with links to the guide and lab
- `PLAN/backup/README.md.orig`, `PLAN/backup/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md.orig` (copies before editing)
- `D:/study/advance-be/plans/handoffs/lesson-07-guide-ready-20261027-<HHMM>.md`
- `PLAN/plan.md` status update via the `ak plan` CLI (run `ak plan --help` first)
- Remove `PLAN/build/*.bak`, `PLAN/tmp/`

## Tasks and steps
1. Copy both docs to `PLAN/backup/*.orig`, then edit with minimal diffs. Re-read the edited lines and confirm the link targets exist.
2. Final gate, in order:
   1. `bash PLAN/tests/lint-sql.sh LAB/*.sql`
   2. `bash PLAN/tests/run-sql.sh LAB/check.sql check-final` (12 ✔)
   3. `bash PLAN/tests/run-sql.sh PLAN/tests/fingerprint.sql fingerprint-after`, then the diff with before (empty)
   4. `node PLAN/tests/verify.mjs runs`
   5. `node PLAN/tests/verify.mjs guide`
   6. `wc -c "$GUIDE"`
   7. `git status --short` (expect only: new LAB dir, GUIDE, PLAN contents, handoff, modified README and TONG_QUAN)
3. Handoff note (Vietnamese, ≤ 40 lines):
   - how to start: Docker up, DBX `00-setup.sql`, `check.sql` 12 ✔, open GUIDE
   - the stage order and the core vs optional split
   - two-tab DBX instructions
   - where the runs live
   - roadmap position: Cluster 1 milestone, then Boss Challenge 1 and OmniPOS phase B
   - note that stage 8 has a lesson-14 refresher if lesson 14 stages 5/7 are not done yet
   - no commit was made; changes are uncommitted on `main`
4. Update the plan status through the CLI.

## Test matrix (test first)
| Test | Expected | Command |
|---|---|---|
| docs links resolve | both paths exist | `test -f "$GUIDE" && test -d LAB` |
| docs diff minimal | only the intended lines changed | `diff PLAN/backup/README.md.orig D:/study/advance-be/README.md` |
| final gate | all steps green | step 2 |
| no git writes | `git status` shows untracked/modified files; no new commit | `git status --short` |

## Verification
Final gate output pasted into the handoff "Verification" table, with the command and outcome per row.

## Risks and rollback
Doc edits may collide with other sessions' untracked edits. Read each file right before editing and keep the diffs minimal. Rollback: copy the `.orig` files back. The lab and guide stay usable without the docs change.
