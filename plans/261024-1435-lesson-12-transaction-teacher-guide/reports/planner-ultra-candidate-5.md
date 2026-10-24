=== FILE: plan.md ===
---
title: "Lesson 12 (Transaction) teacher guide, labs and homework"
description: "Vietnamese HTML teacher guide plus a measured two-session PostgreSQL 16 lab folder for Lesson 12, built test-first on main with no git steps."
status: pending
priority: P1
effort: 47h
branch: main
tags: [lesson-12, transaction, postgresql, mvcc, isolation, tdd, teacher-guide]
blockedBy: []
blocks: []
created: 2026-10-24
---

# Lesson 12 (Transaction): implementation plan (TDD)

## Overview

Build `reports/advanced_backend/lesson_12_transaction_teacher_guide.html` (Vietnamese, lesson-3 shell, 8 stages, about 4 h 45 min over roadmap Day 02 and Day 03, 5 widgets, quizzes, exam, cheat sheet, 26-chip slide map, lesson-14 teaser) and `labs/lesson-12-transaction/` (own small kit, shared `scenarios*.mjs`, labs 01–08 with lab 05 split by concept, homework A–D, a 6-bug NestJS/TypeORM drill). Every quoted number comes from `plans/261024-1435-lesson-12-transaction-teacher-guide/lab-runs/*.txt`, which the controller records from two serial runs per lab.

Order is test-first: invariants (`npm run check`) and the setup script come first, then the kit self-test and the expected-verdict matrix, then labs against the matrix, then homework refusal tests, then the guide verifier (red) before any guide HTML. Work stays on `main`, uncommitted. The only git command anywhere is `git status`. No branch, worktree, commit, push, PR or issue.

Global rules that every phase inherits (they restate the accepted contract and the must-fix notes; nothing here changes the contract):
- Objects only in schema `lab12_transaction` of `advance_be_lab`. `lab03_indexing` is read-only (copy from it, call its `pageinspect`); never touch `lab_imdb` or `maycha_lease`. No `ALTER SYSTEM`.
- `pageinspect` is already installed in `lab03_indexing` and an extension can exist once per database, so lab 03 calls `lab03_indexing.get_raw_page(...)` / `lab03_indexing.heap_page_items(...)` qualified. `pg_walinspect` 1.1 is installed by `setup` with `CREATE EXTENSION pg_walinspect SCHEMA lab12_transaction` and goes away with `reset` (schema drop).
- Every session (A, B, observer, single) runs, before any step: `SET search_path = lab12_transaction`, `SET lock_timeout = '5s'`, `SET statement_timeout = '20s'`, `SET idle_in_transaction_session_timeout = '30s'`, has `application_name = 'lesson-12-<role>'` and a `client.on('error')` listener. `PG_URL` is never printed; clients are built inside `try`.
- `.mjs` files in the lab folder are at most 200 lines (`wc -l`). Longer labs split into `NN-name-part-a.mjs` / `NN-name-part-b.mjs` with a 2-line entry file `NN-name.mjs` that imports both (same pattern as lesson 3's `07-constraints-and-special.mjs`). Comments are Vietnamese. The guide HTML is exempt from the 200-line rule.
- No `postgres://`, `PGPASSWORD`, `POSTGRES_PASSWORD` in new files. Container name is `quan-ly-hop-dong-postgres-1`.
- New Markdown only under `plans/` or `docs/` (must-fix 9). The README route in the docs phase edits an existing file; it creates no new `.md` outside those folders.

## Contract and must-fix resolution

| # | Must-fix note | Where and how the plan resolves it |
|---|---|---|
| 1 | Homework B load | Phase 05: 6×4 enum cells (`'xảy ra' \| 'không' \| '40001'`) plus exactly one `viSao` line per scenario row (6 lines). `homework.mjs` refuses `'???'` in any of the 30 slots and prints each one. Guide stage 8 states "24 ô chọn + 6 dòng". |
| 2 | SSI failure step | Phase 02 freezes the M3/lab 08 order `A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT`. Expected claim `l08.ser.failstep = 'COMMIT của B'`, SQLSTATE `40001`. Lab 08 re-measures into `lab-runs/`; the guide keys the answer as "COMMIT thứ hai". |
| 3 | Lab 05 overload | Phase 03: `05-big-and-idle-tx-part-a.mjs` (large transaction, batches vs one UPDATE) and `-part-b.mjs` (idle/abandoned: 55P03, 25P03, `pg_terminate_backend`); `05-big-and-idle-tx.mjs` is a 2-line importer, `npm run lab5` runs both. Each part has its own cleanup. |
| 4 | M1 step 5 third window | Phase 02 (scenario `m1`) and phase 08: exactly two psql windows. B leaves `BEGIN; UPDATE … id = 1;` open. Window A, after its own COMMIT, plays the second writer (`SET lock_timeout='3s'` then the UPDATE) and blocks; the GUI observer shows the wait; B's COMMIT releases it. |
| 5 | AC7 fingerprint | Phase 01 `check-lab-state.mjs`: primary invariants are `lab03_indexing.hw_contracts` = 500,000 rows, `relallvisible` = `relpages` = 5,666, id 1 at xmin 875 / ctid (0,1). `n_tup_upd = n_tup_del = 0` is printed as an informational line only, never a failure. |
| 6 | TypeORM version | Phase 05 + 08. The drill uses only API names common to 0.3.20 and 1.1.2 (`dataSource.transaction`, `queryRunner.connect/startTransaction/commitTransaction/rollbackTransaction/release`, `queryRunner.manager`), with two labelled boxes for the differences (1.x falls back to `dataSource.options.isolationLevel`; `queryRunner.connection` renamed `queryRunner.dataSource`). Evidence recorded in `lab-runs/typeorm-api-check.txt` (pack both versions, grep, delete the temp folder). The validation step asks the learner for his real version; the drill is correct either way. |
| 7 | `pg_walinspect` range | Phase 03 lab 02: `lsn0 = pg_current_wal_lsn()` before `BEGIN`, `lsn1` after COMMIT/ROLLBACK, `pg_get_wal_records_info(lsn0, lsn1) WHERE xid = $1::xid`; prints record types and offsets relative to `lsn0` only. |
| 8 | Homework D scope | Phase 05 + 08: D lives in `homework-d.mine.mjs`, run by `npm run homework -- --part=d`, placed in guide stage 8 **after** the exam, labelled "cầu nối sang Bài 14, tuỳ chọn". Stage 8 stays at 80 minutes without it. |
| 9 | Markdown only under `plans/` or `docs/` | Global rule above; gate in phase 10: `git status --porcelain` lists no new `.md` outside `plans/` or `docs/`. Lab notes are `.txt`. |
| 10 | Database-level `search_path` | Global rule above. `advance_be_lab` has `search_path = lab03_indexing, public` (`pg_db_role_setting`), so unqualified names land in lesson 3's schema. Kit runs `SET search_path = lab12_transaction` per session; every psql window runs the same line (guide stage 0 step, `scenarios` header comment, M1/M3 tables). `check` fails if a lab-created object appears in `lab03_indexing` or `public`. |

## Phases

| # | Name | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | Environment, dataset, invariants | 3h | none | `check` red before `setup`, green after; lab03 fingerprint printed |
| 02 | Kit, runner, scenarios, verdict matrix, self-test | 5h | 01 | `kit-selftest.mjs` all green, interfaces frozen, delegate brief written |
| 03 | Labs 01–05 (Day 02) | 6h | 02 | each lab exits 0, every verdict ✔ against matrix |
| 04 | Labs 06–08 (Day 03) | 4h | 02 | same |
| 05 | Homework A–D, solution, AI draft, drill data | 4h | 02 | refusal test green, solution matrix 24/24 ✔ |
| 06 | Controller lab runs and masked diff | 3h | 03, 04, 05 | two runs per lab, masked diff empty, `check` green after each |
| 07 | Guide verifier (red) and shell | 3h | 02 | verifier fails exactly where fragments are missing |
| 08 | Guide content (8 stages, widgets, exam) | 12h | 06, 07 | verifier green, render-check clean |
| 09 | Ultra code review and fix loop | 5h | 08 | no open Critical/Important, affected labs re-run |
| 10 | Final verification and docs | 2h | 09 | all acceptance criteria pass, `git status` only expected paths |

Parallelism: after phase 02, phases 03, 04, 05, 07 touch disjoint files and may be delegated (ownership tables in each phase); phase 06 starts only when 03–05 are merged. Delegates never run labs against the database (they run `node --check` and `wc -l` only); the controller runs everything against the DB, serially, because all labs share one schema and the observer counts `lesson-12*` sessions.

## Expected-verdict matrix summary

IDs live in `labs/lesson-12-transaction/expected-verdicts.mjs`, written in phase 02 before any lab. A lab computes `got` from measurements and calls `verdict(id, got)`; a mismatch prints ✘, makes the lab exit 1, and is handled by changing the narrative after review, never by editing the matrix to fit.

| Lab | Claims (id suffix → expected) |
|---|---|
| 01 | `err.next` → SQLSTATE `25P02`; `commit.tag` → `ROLLBACK`; `savepoint.keeps` → 1 row survives; `ddl.rollback` → table absent; `seq.gap` → nextval not rolled back (gap ≥ 1) |
| 02 | `commit.record` → `Transaction/COMMIT` for xid; `abort.record` → `Transaction/ABORT`, no undo record; `flush.ge` → flush LSN ≥ commit LSN; `change.first` → heap record offset < COMMIT offset |
| 03 | `rc.sees.new` → yes; `rr.sees.old` → yes, `xmax` = writer xid, ctid differs; `writer.blocked` → no; `second.waits` → `Lock/transactionid`, blocker = first writer pid; `pageinspect.versions` → 2 |
| 04 | `rollback.dead` → dead versions remain; `vacuum.held` → "not yet removable" while RR snapshot open; `vacuum.freed` → removed after snapshot ends; `pages.grow` → buffers(1,000) > buffers(100) ≥ buffers(0) (measured; if flat, narrative changes) |
| 05a | `single.vs.batch` → growth(batched, VACUUM between) < growth(single); WAL and times informational |
| 05b | `idle.state` → `idle in transaction`; `writer.wait` → `55P03` at `lock_timeout`; `idle.timeout` → `25P03`; `terminate` → `57P01` on victim; `rc.idle.xmin` → null for read-only idle at RC (to be confirmed) |
| 06 | `set.outside` → WARNING; `set.late` → `25001`; `ru.level` → `read uncommitted`; `ru.dirty` → không; `rc.nonrep` → xảy ra; `rr.nonrep` → không; `rc.phantom` → xảy ra; `rr.phantom` → không |
| 07 | `rc.app` → total ≠ expected (lost); `rr.app` → `40001`; `rc.atomic` → total = expected; `rr.atomic` → `40001` |
| 08 | `rr.skew` → count 0; `ser.failstep` → COMMIT của B, `40001`; `ser.retry` → retry sees 1 and refuses; `false.positive` → measured yes/no, optional; docs cited only if no |
| Homework | 6×4 key computed by `homework-solution.mjs`: RU ≡ RC; dirty read không at all; non-repeatable/phantom xảy ra at RU,RC only; app lost update xảy ra at RU,RC, `40001` at RR,SER; atomic update không at RU,RC, `40001` at RR,SER; write skew xảy ra at RU,RC,RR, `40001` at SER (initial expectation, measurement wins) |

## Acceptance criteria

| # | Criterion | Check | Phase |
|---|---|---|---|
| 1 | Guide uses the lesson-3 shell: `chang-1`…`chang-8`, `phong-van`, `cheat-sheet`, `ban-do-slide`, hero "Bài 12 / 16", progress in `l12-*` keys inside try/catch, no `l3-*` key in the file | `node plans/…/verify/verify-guide.mjs --ids` | 07, 08 |
| 2 | Offline except fonts, light and dark, no horizontal scroll at 360 px, no console errors | verifier `--offline`; `render-check.mjs` (with `TMP`/`TEMP` inside the project) plus a 360 px `scrollWidth` check | 08, 10 |
| 3 | 26 chips, every href resolves; slides 7, 9, 10, 13–16, 20, 22, 23 carry the pg mark and have `callout pg`, chip and lab reference | verifier `--slides` evaluates `SLIDES` | 07, 08 |
| 4 | Each stage has goal, `wwh` grid, widget or verbatim lab block, quiz of 3–5 questions with valid answer indices; exam and references (slide 25, PG 16 docs) present | verifier `--stages` | 07, 08 |
| 5 | Every npm script runs; `wc -l ≤ 200` per `.mjs`; no literal `verdict(true` | `npm run` loop in phase 10; `wc -l`; grep | 02–05, 10 |
| 6 | Each lab run twice; masked diff empty; every measured number in the guide is found in `lab-runs/` | `verify/run-labs.mjs`, `verify-guide.mjs --numbers` | 06, 08 |
| 7 | `npm run check` passes after a full run and after a Ctrl+C run: only expected objects, no `lesson-12*` session or lab12 lock, lab03 fingerprint intact | `check`; SIGINT test in self-test and manual Ctrl+C per lab | 01, 02, 06 |
| 8 | Walkthrough SQL in guide equals the steps labs 3, 5, 8 ran (`scenarios` diff); fill-in cells persist | verifier `--sql`, manual reload test | 07, 08 |
| 9 | Homework: blank → refuse, list every `'???'`, exit 1, file unchanged; `homework:solution` prints measured 6×4 all ✔ plus C and D answers; `homework:draft` runs safely; all three stored in `lab-runs/` | commands in phase 05; capture in 06 | 05, 06 |
| 10 | Drill has 6 bugs with folded answers; API names checked against 0.3.20 and 1.1.2 | verifier `--drill`; `lab-runs/typeorm-api-check.txt` | 05, 08 |
| 11 | No secrets or URLs in new files; `git status` shows only expected paths; no new `.md` outside `plans/`/`docs/` | grep; `git status --porcelain` | 10 |

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| A measurement contradicts the contract text (SSI false positive, dead-version page counts, RC idle `backend_xmin`, `pg_walinspect` record names) | M×M | Narrative changes, data never; guide labels "đo trên máy này" vs "theo tài liệu"; matrix unchanged |
| Lesson-3 data changed by accident | L×H | Only `SELECT` on `lab03_indexing`; `check` fingerprint after every lab in phase 06 |
| GUI client holds a transaction and skews labs 4–5 | M×M | Kit horizon guard on `backend_xmin`/`backend_xid` for the current database; lab 4 refuses (exit 2), lab 5 warns |
| Server-killed session crashes Node | M×M | `error` listener on every client; test in self-test |
| Windows SIGINT semantics | M×L | `--selftest-interrupt` raises the same handler; controller also presses Ctrl+C once per lab |
| 4.75 h not realistic | M×L | M2, false positive and homework D are optional and flagged |
| npm offline install fails | M×L | Copy `labs/lesson-03-index/node_modules` (read-only source), pin `pg` 8.16.3 |
| Review finds shared-kit defects after labs exist | M×M | Phase 09 fix loop re-runs affected labs twice and re-diffs |

Rollback: everything is new files, so each phase reverts by deleting its files and, for the database, `npm run reset` (drops schema `lab12_transaction` only). The one edit to an existing file (README route, phase 10) is a single-hunk revert. No lesson-3 file is edited; the old container name and the "Bài 4" teaser in lesson 3 stay untouched (non-goal).

## Open questions for the user

1. Which TypeORM version does `quan_ly_hop_dong` use (0.3.x or 1.x)? The drill is written to be correct for both; the answer only selects which version box is highlighted.
2. Fix lesson 3's old container name and "Bài 4" teaser? Out of scope here; needs the user's decision.
3. Which GUI client (DBX, DBeaver, pgAdmin) is the observer, and is auto-commit on? The guide names it only after he answers; the horizon guard covers the unknown.

=== FILE: phase-01-env-dataset-invariants.md ===
---
phase: 01
title: "Environment, dataset, invariants"
status: pending
priority: P1
effort: 3h
dependencies: []
---

# Phase 01: Environment, dataset, invariants

## Goal

Create the lab folder, install `pg`, write the invariant checker **first** (red), then the idempotent `setup` and `reset` that turn it green. Lesson-3 fingerprint is checked, nothing outside `lab12_transaction` is touched.

## Files to create/modify (owner: controller, all)

- `D:/study/advance-be/labs/lesson-12-transaction/package.json` (`"type": "module"`, `pg` 8.16.3 exact, scripts `setup`, `check`, `reset`, `lab1`–`lab8`, `homework`, `homework:draft`, `homework:solution`; lab and homework scripts point at files that arrive in phases 03–05)
- `.../package-lock.json`, `.../node_modules/` (install offline: `npm install --offline --prefer-offline --save-exact pg@8.16.3`; on cache miss copy `labs/lesson-03-index/node_modules`)
- `.../check-lab-state.mjs` (≤ 200 lines)
- `.../setup-dataset.mjs` (≤ 200 lines)
- `.../reset-lab.mjs` (≤ 80 lines)
- `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/lab-runs/` (folder; first file `00-dataset-columns.txt`)
- `labs/lesson-12-transaction/.gitignore` containing `node_modules/` only if `git status` shows it untracked after install (check lesson 3 first and match it)

## Tasks and steps

1. Read the connection block of `labs/lesson-03-index/pg-explain-kit.mjs` and `docker port quan-ly-hop-dong-postgres-1` to fix host/port defaults. Defaults are discrete fields (`PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`), with `PG_URL` honoured only if set and passed as `connectionString`, never printed. No literal `postgres://` in any new file.
2. Record `\d lab03_indexing.hw_contracts` (columns, types, PK) into `lab-runs/00-dataset-columns.txt`. Column names used by scenarios (`id`, `store_id`, `total`, status column) are frozen from this file in phase 02; if a name differs from the contract text, the file wins and the scenarios use the real name.
3. **Write `check-lab-state.mjs` first.** It runs read-only and reports each item as PASS/FAIL with exit 1 on any FAIL:
   - schema `lab12_transaction` exists, and contains only the expected objects (`contracts`, `store_reps`, extension `pg_walinspect`, plus tables matching `^l\d\d_` while a lab is running or left behind; leftovers FAIL with a hint to run `reset`);
   - nothing created by lesson 12 in `lab03_indexing` or `public` (compare object list with an allow-list: lesson 3's known objects are not enumerated, only `application_name`-free check is impossible, so the check compares names containing `contracts`/`store_reps`/`l\d\d_` prefixes that are not `hw_*`);
   - lab03 fingerprint: `count(*)` = 500,000 on `lab03_indexing.hw_contracts`; `pg_class.relallvisible = relpages = 5666`; `SELECT xmin::text, ctid::text … WHERE id = 1` = `875`, `(0,1)` (must-fix 5);
   - informational line: `n_tup_upd`, `n_tup_del` for `hw_contracts` (never FAIL);
   - `pg_stat_activity`: no session with `application_name LIKE 'lesson-12%'` (retry up to 35 s once, because `idle_in_transaction_session_timeout` is 30 s after a hard kill), and no row in `pg_locks` held by such a pid;
   - dataset check (only when `--dataset` is passed or the schema exists): `contracts` has 100,000 rows with a PK, id 1 is `HD0000001` store 44, `store_reps` has 4 rows (stores 44 and 45, two on duty each), `pg_walinspect` present.
   The checker builds its client inside `try`, sets `search_path`, `lock_timeout`, `statement_timeout`, adds an `error` listener, and never prints the connection config.
4. Run `npm run check` now: expect FAIL on missing schema (red) and PASS on the lab03 fingerprint lines.
5. Write `setup-dataset.mjs`: idempotent; refuses with a clear Vietnamese message if the lab03 fingerprint fails (for example after lesson 3's `reset`); `--force` drops and rebuilds `lab12_transaction`. Steps: `CREATE SCHEMA lab12_transaction`; `CREATE TABLE contracts AS SELECT * FROM lab03_indexing.hw_contracts WHERE id BETWEEN 1 AND 100000`; `ALTER TABLE contracts ADD PRIMARY KEY (id)`; create `store_reps(store_id, rep_id, name, on_duty)` with ASCII names, 4 rows; `CREATE EXTENSION IF NOT EXISTS pg_walinspect SCHEMA lab12_transaction`; `ANALYZE`; print a dataset card (row counts, size, id 1 row, instructions for psql windows including `SET search_path = lab12_transaction;` and why: the database-level default is `lab03_indexing, public`).
6. Write `reset-lab.mjs`: `DROP SCHEMA IF EXISTS lab12_transaction CASCADE` only. Never drops anything else; refuses if the schema name constant differs.
7. Run `npm run setup`, then `npm run check` (green), then `npm run setup` again (idempotent no-op), then `npm run reset`, `npm run check` (red on schema, lab03 lines still PASS), `npm run setup`.

## Test matrix (test first)

| Test | Written | Expected | Command |
|---|---|---|---|
| Check on empty DB state | before setup | exit 1, schema FAIL, lab03 fingerprint PASS | `npm run check` |
| Check after setup | after step 5 | exit 0 | `npm run setup && npm run check` |
| Setup twice | step 7 | second run reports "đã có", no change, exit 0 | `npm run setup` |
| Setup with broken lab03 fingerprint (simulated by `--fingerprint-rows=1` test flag that changes the expected count, no DB write) | step 5 | refuses, exit 1, message names lesson 3 `setup` | `node setup-dataset.mjs --fingerprint-rows=1` |
| Reset touches only lab12 | step 7 | lab03 lines PASS after reset | `npm run reset && npm run check` |
| Foreign idle session | step 3 | check FAILs naming no pid (only application_name), clears after close | covered in phase 02 self-test |
| Secrets | end | no match | grep `postgres://\|PGPASSWORD\|POSTGRES_PASSWORD` in the folder |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
npm run setup && npm run check
wc -l *.mjs
```
Expected: check exits 0, every `.mjs` ≤ 200 lines, dataset card shows 100,000 / 4 rows.

## Risks and rollback

- Lesson 3 `reset` run in between makes `setup` refuse: intended; message says to rerun lesson 3 setup.
- `CREATE TABLE AS` copies the learner-visible column set but not indexes; PK added explicitly. If lesson 3 later adds columns the copy still works (`SELECT *`).
- Rollback: `npm run reset`, delete the folder and `lab-runs/00-dataset-columns.txt`.

=== FILE: phase-02-kit-runner-contracts.md ===
---
phase: 02
title: "Kit, runner, scenarios, verdict matrix, self-test"
status: pending
priority: P1
effort: 5h
dependencies: ["01"]
---

# Phase 02: Kit, runner, scenarios, verdict matrix, self-test

## Goal

Write and **freeze** the interfaces every lab, the homework and the guide verifier depend on, with the expected-verdict matrix and a self-test written first. After this phase delegates can write labs with no design decisions.

## Files to create/modify (owner: controller, all)

All under `D:/study/advance-be/labs/lesson-12-transaction/`, each ≤ 200 lines:
- `kit-selftest.mjs` (written first)
- `expected-verdicts.mjs` (the matrix; written before labs)
- `kit.mjs` (own copy of print helpers, session factory, verdict, cleanup guard; no import from lesson 3)
- `runner.mjs` (≈ 120 lines, plain tuples, no framework)
- `scenarios.mjs` (re-exports, `render(scn, prefix)`)
- `scenarios-mvcc.mjs` (`m1`, `m2`)
- `scenarios-anomalies.mjs` (`m3` and the six homework scenarios plus level tests)
- `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/delegate-brief.md` (model: lesson 3's `delegate-brief.md`)

## Frozen interfaces

`kit.mjs` exports:
- `openSession(role)` → `{ role, pid, q(sql, params), end() }`. Applies the five per-session settings from plan.md, sets `application_name = 'lesson-12-' + role`, attaches an `error` listener that records `session.dead = err.code`. `q` never throws on SQL errors; it returns `{ ok, rows, rowCount, command, ms }` or `{ ok:false, code, message, ms }`; it throws only if the connection itself is gone. `notice` events are collected in `result.notices`.
- `horizonGuard(obs, { strict })` → checks `pg_stat_activity` for the current database, excluding own pids: any session not named `lesson-12-*` with `backend_xmin` or `backend_xid` non-null. strict → prints Vietnamese explanation and exits 2 (lab 4); otherwise warns (lab 5).
- `withCleanup(fn)`: registers `SIGINT`/`SIGTERM` handlers that set a flag and run the same `finally` (ROLLBACK, `end()` for every session, `DROP TABLE IF EXISTS` for scratch `lNN_*`), then `process.exit(130)`. `--selftest-interrupt=N` makes the runner raise `process.emit('SIGINT')` after step N, exercising the real handler on Windows.
- `fmt`: `ms(n)` → `12.3 ms`, `xid(n)` → `xid:123`, `pid(n)` → `pid:456`, `lsn(s)` → `lsn:0/1A2B3C`, `sz(bytes)` → `x.y MB` (one decimal). Dynamic values are printed only through these helpers so masking is a fixed regex set.
- `say.title/step/result/note` for Vietnamese output; `verdict(id, got)` looks `id` up in `expected-verdicts.mjs`, throws on unknown id, prints ✔/✘ and counts; `finish()` exits 1 if any ✘. Verdicts are computed from measured values, never literal (grep: no `verdict(true`).

`runner.mjs` exports `runSteps({ scn, prefix, A, B, obs })` → `timeline[]` entries `{ n, who, sql, status: 'ok'|'blocked'|'error'|'unexpected-wait', code?, rows?, ms, blockers? }`. A step is a plain row `[who, sql, opts]`:
- `who` ∈ `'A' | 'B' | 'OBS'`; `sql` is a string with `{t}` for table-name prefix; the runner never injects statements into A or B (a Repeatable Read snapshot must not move).
- `opts.blocks = 'A'` declares a wait: the runner fires the statement without awaiting, polls the observer (`pg_blocking_pids`, `wait_event_type`, `wait_event`) until the blocker is confirmed, records `blocked`, then continues with the next step. The pending result is recorded as `unblocked after step N` when it settles.
- An undeclared stall (no result within the lock window, no declared wait) is recorded as `unexpected-wait`, the lab exits 2, cleanup runs.
- `opts.expect = 'error'` lets a step fail without aborting the run (SQLSTATE kept in `code`).
- `--json` prints the timeline as JSON after a `--- json ---` line (widget data).

`scenarios.mjs`: `export const SCENARIOS = { m1, m2, m3, dirtyRead, nonRepeatable, phantom, appLostUpdate, atomicUpdate, writeSkew, levelSet }`; each `{ id, title, tables: ['contracts' | 'store_reps'], setup: [sql], levels?: ['RU','RC','RR','SER'], steps: [...], teardown: [sql] }`; `render(scn, prefix)` substitutes `{t}` (prefix `''` for the learner's walkthrough, `'l08_'` for a lab's scratch copy). M1 step 5 and M3 follow must-fix notes 4 and 2.

## Tasks and steps

1. Write `expected-verdicts.mjs` from the matrix in plan.md (all ids, expected values as strings/regex source). Add a header comment: a contradicted entry changes the narrative, not the data.
2. **Write `kit-selftest.mjs` first** (it fails to import). Tests below. Then write `kit.mjs`, `runner.mjs`, `scenarios*.mjs` until green.
3. Write M1/M2/M3 and the six anomaly scenarios with table names frozen from `lab-runs/00-dataset-columns.txt`. M1: Q = `SELECT xmin, xmax, ctid, total FROM {t}contracts WHERE id = 1`. M3: store 44 reps 1 and 2; order `A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT`.
4. Write `delegate-brief.md`: frozen API above, file-ownership tables from phases 03–05, "delegates run `node --check` and `wc -l` only", Vietnamese comment rule, 200-line rule, forbidden literals, and the instruction to ask the controller rather than change an interface.
5. Run the self-test green; run `npm run check` after it.

## Test matrix (test first; all in `kit-selftest.mjs`)

| Test | Expected | Command |
|---|---|---|
| Import of kit/runner/scenarios before they exist | red (module not found) | `node kit-selftest.mjs` |
| `openSession` applies five settings | `SHOW` of each equals value; `search_path` = `lab12_transaction` | same |
| Unknown verdict id | throws | same |
| `verdict` source scan | no literal `verdict(true`/`verdict(false` in `*.mjs` | same |
| Declared wait (`blocks`) | timeline has `blocked` with blocker = A's pid, then settles after A commits | same |
| Undeclared wait: a foreign session holds a row lock, scenario touches it | `unexpected-wait`, error 55P03 reported, exit 2, no hang | same |
| Error mid-transaction | next statement `25P02`, `q` does not throw | same |
| Server-killed session (`pg_terminate_backend` of B) | `error` listener fires, Node survives, `session.dead` set | same |
| Foreign idle session (a `BEGIN; SELECT pg_current_xact_id()` client named `foreign`) | `horizonGuard strict` exits 2; `check` ignores it because it is not `lesson-12*` | same |
| Interrupt mid-lab (`--selftest-interrupt=2`) | exit 130, scratch tables dropped, `npm run check` green | same + `npm run check` |
| Hard kill (child killed without handler) | server clears the session within 30 s; `check` retry then green | same |
| `render(scn, '')` vs `render(scn, 'l08_')` | differ only by the `l08_` prefix | same |
| M3 order | steps array order is A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT | same |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
node kit-selftest.mjs && npm run check
wc -l kit.mjs runner.mjs scenarios*.mjs expected-verdicts.mjs kit-selftest.mjs
```
Expected: all selftest cases ✔, check exit 0, every file ≤ 200 lines (runner ≈ 120).

## Risks and rollback

- The runner growing into a framework: cap by `wc -l`; steps stay plain tuples; extra needs go back to the controller.
- A wrong interface found late: only the controller edits `kit.mjs`/`runner.mjs`/`scenarios*.mjs`; delegates must stop and report.
- Rollback: delete the files; no DB state (scratch tables are dropped by tests).

=== FILE: phase-03-labs-day02.md ===
---
phase: 03
title: "Labs 01–05 (Day 02: WAL, MVCC, dead versions, big and idle transactions)"
status: pending
priority: P1
effort: 6h
dependencies: ["02"]
---

# Phase 03: Labs 01–05 (Day 02)

## Goal

Implement labs 01–05b so each exits 0 with every verdict ✔ against `expected-verdicts.mjs`, in Vietnamese output with a step timeline.

## Files to create/modify (owner per row; disjoint)

All under `D:/study/advance-be/labs/lesson-12-transaction/`:

| File | Lab | Owner |
|---|---|---|
| `01-atomicity-pg-rules.mjs` | 01 | delegate L1 |
| `02-wal-records.mjs` | 02 | delegate L1 |
| `03-mvcc-two-sessions.mjs` | 03 | delegate L2 |
| `04-dead-versions-horizon.mjs` | 04 | delegate L2 |
| `05-big-and-idle-tx.mjs` (2-line importer), `05-big-and-idle-tx-part-a.mjs`, `05-big-and-idle-tx-part-b.mjs` | 05 | delegate L3 |
| `kit.mjs`, `runner.mjs`, `scenarios*.mjs`, `expected-verdicts.mjs` | frozen | controller only |

The controller may write all of them itself; delegation is optional. Delegates run `node --check <file>` and `wc -l` only.

## Tasks and steps

Each lab: Vietnamese comments; opens sessions inside `withCleanup`; creates scratch copies `lNN_*` with `WITH (autovacuum_enabled = false)` from `contracts` and drops them in `finally`; prints a title, the timeline, then verdicts.

1. **Lab 01 (single session S; slides 4–5).** Statement error inside `BEGIN` → next statement `25P02`; `COMMIT` on the aborted block returns command tag `ROLLBACK`; `SAVEPOINT`/`ROLLBACK TO` keeps the earlier row; DDL (`CREATE TABLE`) rolled back leaves no table; a sequence's `nextval` is not rolled back (gap). Verdicts on tags, row counts, gap size.
2. **Lab 02 (single session; slides 5, 12).** `lsn0 = pg_current_wal_lsn()` before `BEGIN`; `UPDATE` one scratch row; read `xid = pg_current_xact_id()::xid`; `COMMIT`; `lsn1 = pg_current_wal_lsn()`. Query `pg_get_wal_records_info(lsn0, lsn1) WHERE xid = $1::xid` (columns `resource_manager`, `record_type`, `start_lsn`); print record types and offsets relative to `lsn0` via `fmt.lsn` only (must-fix 7). Second run with `ROLLBACK`: expect a `Transaction/ABORT` record and no undo-type record. Check `pg_current_wal_flush_lsn() >= commit record start_lsn`. If `synchronous_commit` timing is shown, report ms only (Docker Desktop may show little difference). Record names are measured, not assumed; the matrix matches `Heap/(HOT_)?UPDATE` by regex.
3. **Lab 03 (runner; slides 13–15).** Scratch `l03_contracts` with ids 1–1,000 and PK. Run scenario `m1` with prefix `l03_` at RC and then RR: reader A starts, writer B updates `id = 1` and commits (not blocked, observer confirms no blocker), A re-reads (RC sees new xmin; RR sees old version with `xmax` = B's xid and old ctid). Show both versions with `lab03_indexing.heap_page_items(lab03_indexing.get_raw_page('l03_contracts', 0))` filtered by lp of the row (qualified, because the extension lives in lesson 3's schema). Then step 5: B leaves an UPDATE open, A plays the second writer with `blocks: 'B'`; observer verdict `wait_event_type = Lock`, `wait_event = transactionid`, blocker = B pid; B commits, A proceeds. No sleeps anywhere.
4. **Lab 04 (runner; slides 13–14, 16).** `horizonGuard(obs, { strict: true })` first. Scratch `l04_contracts` (1,000 rows, autovacuum off). (a) `UPDATE` 500 rows then `ROLLBACK`; `VACUUM (VERBOSE)` through `notice` collection; count removable versions. (b) A opens `REPEATABLE READ` and runs one SELECT; B updates 500 rows in autocommit; `VACUUM VERBOSE` reports versions "not yet removable"; after A commits, a second VACUUM removes them. (c) one row updated 0 / 100 / 1,000 times with an RR snapshot held; for each, `EXPLAIN (ANALYZE, BUFFERS)` of a lookup by id, parse shared hit+read. The page-growth claim is measured: if buffers stay flat, the verdict prints ✘ and the narrative in phase 08 changes.
5. **Lab 05 part A (runner; slides 17–19).** Scratch `l05_contracts` = 100,000 rows. `statement_timeout = '60s'` for this part only (a 100,000-row UPDATE must not hit the 20 s default; documented in a comment). Case 1: one `UPDATE` of all rows; case 2: 10 batches of 10,000 with `VACUUM` between them. Per case: `pg_wal_lsn_diff` (WAL), `pg_total_relation_size` growth, elapsed. Print sizes with `fmt.sz`. Verdict: growth(batched) < growth(single). WAL and times informational.
6. **Lab 05 part B (runner; slides 18–21).** Scratch `l05b_contracts` (1,000 rows). A `BEGIN; UPDATE id = 1` and goes idle; observer shows `idle in transaction`, `backend_xid` set. B with `lock_timeout = '2s'` updates id 1 → `55P03`. A fresh session C with `idle_in_transaction_session_timeout = '2s'`: `BEGIN`, wait via observer-confirmed state, next statement → `25P03` and the connection is closed (error event handled). Observer runs `pg_terminate_backend(<A pid>)`; A's next call reports `57P01`. Separately: read-only idle transaction at RC (`BEGIN; SELECT 1`) shows `backend_xmin` null (to be confirmed by measurement).
7. Entry `05-big-and-idle-tx.mjs`:
   ```js
   import './05-big-and-idle-tx-part-a.mjs';
   import './05-big-and-idle-tx-part-b.mjs';
   ```
   Part A and B each call `finish()` only in the entry file's last import (or use a shared flag so exit code reflects both); the controller decides when assembling.
8. Controller: first runs, one lab at a time, `npm run check` after each; fix kit defects in `kit.mjs` (not in labs).

## Test matrix (test first: the verdict ids already exist in the matrix)

| Test | Expected | Command |
|---|---|---|
| Lab 01 verdicts | `err.next` 25P02, `commit.tag` ROLLBACK, `savepoint.keeps`, `ddl.rollback`, `seq.gap` all ✔, exit 0 | `npm run lab1` |
| Lab 02 verdicts | COMMIT/ABORT records for the xid, flush ≥ commit, change before commit, offsets only | `npm run lab2` |
| Lab 03 verdicts | rc new, rr old + xmax, writer not blocked, second waits on `transactionid`, two versions in page | `npm run lab3` |
| Lab 04 verdicts | dead after rollback, held, freed, pages measured; refuses with exit 2 when a foreign idle transaction exists | `npm run lab4`; with the self-test foreign session |
| Lab 05a verdict | batched growth < single growth; finishes inside 60 s | `node 05-big-and-idle-tx-part-a.mjs` |
| Lab 05b verdicts | idle state, 55P03, 25P03, 57P01, RC idle xmin null (or ✘ → narrative) | `node 05-big-and-idle-tx-part-b.mjs` |
| Entry importer | runs both, exit 0 | `npm run lab5` |
| Ctrl+C mid-lab (labs 3, 5a, 5b) | exit 130, scratch tables gone, `check` green | press Ctrl+C after step 2, `npm run check` |
| Undeclared stall injected (foreign row lock on `l03_contracts`) | `unexpected-wait`, exit 2 | self-test case reused |
| Static | ≤ 200 lines, no `verdict(true`, no `postgres://` | `wc -l`, grep |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
npm run lab1 && npm run lab2 && npm run lab3 && npm run lab4 && npm run lab5 && npm run check
wc -l 0*.mjs
```
Expected: all exit 0 with ✔ verdicts, check green, files ≤ 200 lines.

## Risks and rollback

- Lab 04 page counts may not grow (HOT chains stay on one page): the contract says measure; ✘ → narrative changes, matrix stays.
- Lab 05a runtime on Docker Desktop: if the single UPDATE nears 60 s, shrink the scratch table to 50,000 rows in the lab only and note it; claims are ordering, not absolutes.
- Lab 05 overload was the reviewer's concern: the two parts share no state beyond the importer.
- Rollback: delete the lab files; `npm run reset && npm run setup` clears any scratch tables.

=== FILE: phase-04-labs-day03.md ===
---
phase: 04
title: "Labs 06–08 (Day 03: isolation levels, lost update, write skew)"
status: pending
priority: P1
effort: 4h
dependencies: ["02"]
---

# Phase 04: Labs 06–08 (Day 03)

## Goal

Implement labs 06, 07, 08 on the shared scenarios so verdicts match the matrix, with SSI's failure step keyed to the second COMMIT (must-fix 2).

## Files to create/modify

All under `D:/study/advance-be/labs/lesson-12-transaction/`:

| File | Owner |
|---|---|
| `06-levels-read-anomalies.mjs` | delegate L4 |
| `07-lost-update.mjs` | delegate L4 |
| `08-write-skew.mjs` (split into `08-write-skew-part-a.mjs` / `-part-b.mjs` plus 2-line `08-write-skew.mjs` if > 200 lines; part B = retry and false positive) | delegate L5 |
| frozen: `kit.mjs`, `runner.mjs`, `scenarios*.mjs`, `expected-verdicts.mjs` | controller only |

## Tasks and steps

1. **Lab 06 (R; slides 6–9, 22).** Scenario `levelSet`: `SET TRANSACTION ISOLATION LEVEL` outside a block → WARNING (collected from `notice`); after the first query inside a block → `25001`; correct `BEGIN; SET TRANSACTION ISOLATION LEVEL …` and `BEGIN ISOLATION LEVEL …` both work. Print `SHOW transaction_isolation` per level; `read uncommitted` shows as such yet behaves as RC. Scenarios `dirtyRead`, `nonRepeatable`, `phantom` run at RU, RC, RR (SER also, for homework); verdict from measured values (for example read 100 vs 50, count 2 vs 3).
2. **Lab 07 (R; slides 8–9).** `appLostUpdate`: both sessions `SELECT total`, compute `total - 20` in JS, `UPDATE SET total = <value>`; at RC final total ≠ expected; at RR the second UPDATE gets `40001 could not serialize access due to concurrent update` (the second writer is a declared wait, then errors when the first commits). `atomicUpdate` (`SET total = total - 20`): safe at RC; `40001` at RR.
3. **Lab 08 part A (R; slides 9–10, 23).** `writeSkew` with the frozen order A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT. RR: both commit, `count` on duty = 0. SER: A's COMMIT succeeds, **B's COMMIT** fails `40001 could not serialize access due to read/write dependencies among transactions`; B's UPDATE did not wait (SIRead locks never block). The verdict `ser.failstep` is computed from which timeline step carries the error.
4. **Lab 08 part B.** Retry: rerun B's whole transaction at SER; it now sees 1 on duty and refuses to update (compute from rows). Optional `false.positive`: stores 44 and 45 updated by A and B on different stores, both read via sequential scan on a 4-row table at SER; report measured yes/no. If no failure occurs, print "không tái hiện; xem tài liệu PG 16 (predicate locks promoted)" and the guide cites the docs instead of a number. `max_pred_locks_per_page = 2` is printed from `SHOW`.
5. Every lab prints the same table names with `l06_`/`l07_`/`l08_` prefixes, copies `store_reps` for lab 08 (`WITH (autovacuum_enabled = false)`), resets state between level iterations, drops copies in `finally`.
6. Controller first runs serially; `check` after each.

## Test matrix (test first)

| Test | Expected | Command |
|---|---|---|
| Lab 06 verdicts | set.outside WARNING, set.late 25001, ru.level `read uncommitted`, ru.dirty không, rc.nonrep xảy ra, rr.nonrep không, rc/rr phantom | `npm run lab6` |
| Lab 07 verdicts | rc.app lost, rr.app 40001, rc.atomic equal, rr.atomic 40001 | `npm run lab7` |
| Lab 08 verdicts | rr.skew 0, ser.failstep COMMIT của B + 40001, ser.retry refuses | `npm run lab8` |
| Matrix contradiction rehearsal | temporarily set one expected value wrong in a scratch copy of the matrix (never the real one) → ✘ and exit 1 | `node 06-levels-read-anomalies.mjs --matrix=./tmp-wrong.mjs` (flag supported by `verdict` for rehearsal only; temp file deleted) |
| Ctrl+C mid lab 08 | exit 130, `l08_*` gone, `check` green | Ctrl+C, `npm run check` |
| Deterministic output | two runs differ only in masked classes | phase 06 |
| Static | ≤ 200 lines, no `verdict(true` | `wc -l`, grep |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
npm run lab6 && npm run lab7 && npm run lab8 && npm run check
```
Expected: exit 0, all ✔, check green.

## Risks and rollback

- SSI step differs from the probe on a rerun (timing of conflict detection): the order is fixed by the script and observer-confirmed; if a run shows the error at UPDATE, the verdict ✘ forces a narrative review.
- Lab 08 false positive may not reproduce (likely with 4 rows): optional, documented either way.
- Rollback: delete files; `npm run check` confirms no leftovers.

=== FILE: phase-05-homework-and-drill-data.md ===
---
phase-05: placeholder
---
