=== FILE: plan.md ===
---
title: "Lesson 12 (Transaction) teacher guide + lab12_transaction labs"
description: "Build the Vietnamese 8-stage Lesson 12 guide, 8 measured two-session labs, homework A-D and the NestJS drill, all test-first, on main, uncommitted."
status: pending
priority: P1
effort: 31h
branch: main
tags: [lesson-12, transaction, postgres, mvcc, isolation, tdd, teacher-guide]
blockedBy: []
blocks: []
created: 2026-10-24
---

# Lesson 12 (Transaction): plan

## Overview

The outcome is `reports/advanced_backend/lesson_12_transaction_teacher_guide.html` (Vietnamese, lesson-3 shell, 8 stages, 5 widgets, quizzes, exam, cheat sheet, 26-chip slide map, lesson-14 teaser) plus `labs/lesson-12-transaction/` with the npm scripts `setup`, `check`, `reset`, `lab1`–`lab8`, `homework`, `homework:draft`, `homework:solution`. Labs run on `lab12_transaction`, a copy of `hw_contracts` ids 1–100,000 and a 4-row `store_reps`. Two sessions plus an observer are driven by a ~120-line Node runner; the same steps are replayed by hand in two psql windows. Every number in the guide comes from `lab-runs/*.txt`.

Order is test-first. Phase 01 writes the invariant checker before the setup it checks. Phase 02 writes the expected-verdict matrix, the kit self-tests, the homework refusal test, the masked-diff tool and the guide verifier before any lab or HTML exists. Labs and guide then turn those red tests green. Work stays on `main`, uncommitted. The only git command anywhere in this plan is `git status`. Markdown is written only under `plans/` or `docs/`.

Two settled facts shape every phase:

- `advance_be_lab` has a database-level `search_path = lab03_indexing, public`. Every lab session and every manual psql window must set `search_path = lab12_transaction`, or an unqualified name lands in lesson 3's schema.
- The PG 16.15 probe already gave the anomaly matrix (RU behaves as RC; RR blocks non-repeatable read and phantom, gives 40001 on same-row update; SERIALIZABLE fails the **second COMMIT** for write skew). The labs re-measure it. If a measurement contradicts the expectation, the narrative and `expected.mjs` change with a written deviation note; measured data never changes.

## Contract and must-fix resolution

| # | Must-fix note | Resolution (where) |
|---|---|---|
| 1 | Homework B load | 6×4 cells are enum values; one "vì sao" line per scenario row (6 lines total), not per cell. Template and runner check: phase 05 (`homework-predictions.mine.mjs`, `homework.mjs`); guide text: phase 08 |
| 2 | SSI failure step | Step order is A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT. Answer keyed as "COMMIT thứ hai". Fixed in `scenarios.mjs` (phase 02), measured by lab 8 (phase 04), re-recorded in phase 06, quoted in M3 and the guide (phase 08) |
| 3 | Lab 05 overload | Split by concept: `05-…-part-a` = large transaction, `05-…-part-b` = idle/abandoned. Entry `05-big-and-idle-tx.mjs` is the 2-line importer. Phase 03 |
| 4 | M1 step 5 third window | Exactly two psql windows. In M1 step 5, window A (after its COMMIT) is the second writer; the GUI observer only reads `pg_stat_activity`. Guide text: phase 07; `check-guide` rejects "cửa sổ thứ ba" (phase 02 test) |
| 5 | AC7 fingerprint | `check-lab-state.mjs` primary invariants: `hw_contracts` 500,000 rows, `relallvisible` 5,666 = `relpages` 5,666, id 1 at xmin 875 / ctid (0,1). `n_tup_upd = n_tup_del = 0` is printed as an informational line only. Phase 01 |
| 6 | TypeORM version | Phase 08 step 1 asks the user for the real version (open question 1). Until answered, the drill quotes the pinned versions 0.3.20 and 1.1.2 and labels each difference (see phase 08). Drill API names are checked by reading the type files of both versions |
| 7 | `pg_walinspect` range | Lab 2 captures `pg_current_wal_lsn()` before BEGIN and `pg_current_wal_flush_lsn()` after COMMIT/ROLLBACK, calls `pg_get_wal_records_info(lsn0, lsn1)`, filters `WHERE xid = $1`, prints record types and offsets relative to `lsn0` only. Phase 03 |
| 8 | Homework D scope | D is an optional bridge after the exam in stage 8, marked "tuỳ chọn – cầu nối sang bài 14", and excluded from the 80-min stage budget. Phase 05 (runner part), phase 08 (guide) |
| 9 | Markdown only under `plans/` or `docs/` | Hard rule in every phase. `verify/check-files.mjs` (phase 02) fails on any `.md` outside `plans/` and `docs/` in the paths we create; README route edit in phase 10 is under `docs/`/README as the repo already holds one (see phase 10) |
| 10 | Database-level `search_path` | Kit passes `search_path`, timeouts and `application_name` as connection startup options, so no statement is injected and no snapshot moves. Test K2 (phase 02) asserts `SHOW search_path` per session. Manual windows run `SET search_path = lab12_transaction;` as line 1 of every walkthrough (phase 07), with the reason stated in the guide |

All other settled decisions of `brainstorm/candidate-E.md` are implemented unchanged: roadmap order (Day 02 stages 0–5, Day 03 stages 6–8), A1 runner with A2 replay, B2 dataset, C2 day split, D2 own kit, 5 widgets, homework A–D plus the 6-bug drill, verdict-chip table, lesson-14 bridge.

## Phases

| # | Name | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | Invariants first, then setup/reset | 2h | – | `npm run setup && npm run check` green; fingerprint unchanged before and after |
| 02 | Test harness, kit, frozen scenarios | 4h | 01 | Kit tests K1–K9 green; `verify/*` tools exist and fail red on empty labs; delegate brief frozen |
| 03 | Labs 01–05 (Day 02) | 4h | 02 | each lab exits 0 with all `##V` lines ✔; ≤200 lines |
| 04 | Labs 06–08 (Day 03) | 3h | 02 | same; lab 8 SSI step is the second COMMIT |
| 05 | Homework A–D and runner | 3h | 02 | refusal test green; `draft` safe; solution prints 6×4 ✔ |
| 06 | Serial runs, masked-diff determinism | 2h | 03, 04, 05 | each run twice, masked diff empty; negative tests pass |
| 07 | Guide shell, stages 0–5, widgets W1–W3 | 5h | 06 | `check-guide` stage 0–5 checks green; render-check clean |
| 08 | Guide stages 6–8, W4–W5, homework, drill, exam | 5h | 07 | `check-guide` fully green; every number found in `lab-runs/` |
| 09 | `/ak:code-review --ultra`, fix, re-run | 3h | 08 | no open Critical/Important; affected labs re-run twice |
| 10 | Test honesty, docs route, final gate | 2h | 09 | all acceptance criteria checked; `git status` shows expected paths only |

Parallelism: after phase 02, phases 03, 04, 05 may run as three delegates with disjoint file ownership (see each phase). Phases 01, 02, 06–10 are controller-only.

## Expected-verdict matrix summary

Single source: `labs/lesson-12-transaction/expected.mjs`. Verdict ids are printed as `##V <id> <token> <✔|✘>`; `✘` means measured ≠ expected. Seeded from the controller probe (PG 16.15); `[M]` = must be measured by the lab before the guide quotes it.

| Lab | Claims | Expected |
|---|---|---|
| 1 | error → `25P02`; COMMIT of failed tx replies `ROLLBACK`; SAVEPOINT rescues; DDL rolls back; sequence gap stays | tags, rows, nextval gap > 0 |
| 2 | WAL record before COMMIT; COMMIT record flushed; ROLLBACK = ABORT, no undo [M: record names] | flush LSN ≥ commit end LSN |
| 3 | writer not blocked by reader (≈ms); RC sees new, RR sees old with `xmax` = writer xid; second writer waits (`Lock/transactionid`, blocker = A) | as probe |
| 4 | fast ROLLBACK leaves dead tuples; open RR snapshot stops VACUUM cleaning; pages at 0/100/1,000 versions [M] | VACUUM VERBOSE counts; page counts rise |
| 5a | batches vs one UPDATE: WAL bytes, size | one UPDATE writes more WAL per statement; both measured |
| 5b | idle tx blocks writer; `55P03`; `25P03`; `pg_terminate_backend`; RC read-only idle holds no `backend_xmin` [M] | codes exact |
| 6 | SET TRANSACTION before BEGIN only warns; RU = RC; no dirty read; non-repeatable read and phantom only at RU/RC | 100→50, 2→3 at RC; 100, 2 at RR |
| 7 | app read-modify-write: RC final 80; RR/SER `40001`; atomic UPDATE safe at RC | as probe |
| 8 | write skew RU/RC/RR: 0 on duty; SER: B's second COMMIT `40001`; retry → 1; seq-scan false positive [M, else cite docs] | single `40001` |

Homework 6×4 key: dirty read `không` ×4; non-repeatable read `xảy ra`(RU,RC) `không`(RR,SER); phantom same; app lost update `xảy ra`(RU,RC) `40001`(RR,SER); atomic update `không`(RU,RC) `40001`(RR,SER); write skew `xảy ra`(RU,RC,RR) `40001`(SER). The atomic-update RR/SER cells are `[M]`; the key is whatever `homework:solution` measures.

## Acceptance criteria

| # | Criterion (checkable) | Phase |
|---|---|---|
| 1 | Page uses lesson-3 shell: 8-stage rail, `l12-*` localStorage keys in `try/catch`, no `l3-` key written, hero "Bài 12 / 16". `node verify/check-guide.mjs` greps `chang-1`…`chang-8`, `phong-van`, `cheat-sheet`, `ban-do-slide` | 07, 08 |
| 2 | Offline except fonts; light/dark; no horizontal scroll at 360 px; no console errors. `check-guide` external-URL grep plus `render-check.mjs` at 375/768/1440 with `TMP`/`TEMP` inside the project | 07, 08 |
| 3 | 26 slide chips, every href resolves; slides 7, 9, 10, 13–16, 20, 22, 23 carry the pg mark, a `callout pg`, a chip and a lab reference; verdict-chip table matches. Script walks `SLIDES` | 08 |
| 4 | Each stage: goal, `wwh` grid, widget or verbatim lab block, quiz of 3–5 questions with valid answer indices; exam and references present | 07, 08 |
| 5 | Every npm script runs; `wc -l` ≤ 200 per file; `grep "verdict(true"` empty. `verify/check-files.mjs` | 02–05, 10 |
| 6 | Each lab run twice; masked diff empty (ms, xid, LSN, pid masked); every number in the guide found by grep in `lab-runs/` (`check-guide --numbers`) | 06, 08 |
| 7 | `npm run check` passes after a full run and after Ctrl+C mid-lab: only expected objects; no `lesson-12*` session or lab12 lock; fingerprint (500,000 rows, 5,666/5,666, id 1 xmin 875 ctid (0,1)) | 01, 06 |
| 8 | Guide walkthrough SQL equals `scenarios.mjs` steps (diff); fill-in cells persist | 07, 08 |
| 9 | Blank homework → exit 1 listing every `'???'`; `homework:solution` prints measured 6×4 all ✔ plus C and D answers; `homework:draft` safe; three outputs stored in `lab-runs/`; `homework-predictions.mine.mjs` hash unchanged by any run | 05, 06 |
| 10 | NestJS drill has 6 bugs with folded answers; API names checked against the user's TypeORM version, or both pinned versions labelled | 08 |
| 11 | No `postgres://`, `PGPASSWORD`, `POSTGRES_PASSWORD` in new files; `git status` shows only expected paths; no `.md` outside `plans/`/`docs/` except the existing README edit | 10 |
| 12 | Code review ultra findings Critical/Important closed, affected labs re-run | 09 |

## Risks and rollback

| Risk | L×I | Mitigation | Rollback |
|---|---|---|---|
| GUI client or idle host pool holds `backend_xmin`, skews lab 4 | M×H | Labs 4–5 check `pg_stat_activity` for foreign `backend_xmin/xid`, print warning, mark ✘-skipped (never a false ✔) | Close the GUI transaction, rerun |
| Measurement contradicts expectation (SSI step, false positive, RC horizon) | M×M | Deviation note in `lab-runs/deviations.md`; narrative and `expected.mjs` change, data never | Edit guide text only |
| Node crash on server-killed session (`error` event) | M×H | Kit attaches `error` listener before connect (K4) | `npm run reset` terminates leftover `lesson-12*` backends |
| Lesson 3 `reset` drops `lab03_indexing` and its `pageinspect` | L×M | Setup detects pageinspect schema; installs into `lab12_transaction` if absent; fingerprint failure prints "chạy lại setup bài 3" | Re-run lesson 3 setup |
| `synchronous_commit` timing barely differs on Docker | H×L | Report ms only, no claim of ratio | Drop sentence |
| Files exceed 200 lines | M×L | `check-files` gate each phase; `-part-a/-part-b` split | Split file |
| Parallel delegates collide | L×H | Disjoint ownership; kit/scenarios/expected frozen at end of phase 02; delegates cannot edit them | Controller reverts delegate's out-of-scope file |

Rollback of the whole work: `npm run reset` (drops `lab12_transaction` only), delete `labs/lesson-12-transaction/` and the guide HTML. Nothing outside those paths and the plan dir is touched except one README line (phase 10). Because nothing is committed, revert means deleting those paths.

## Open questions for the user

1. Which TypeORM version does `D:\work\maycha\quan_ly_hop_dong` use (`npm ls typeorm`)? The app is not on this machine.
2. Do you accept that M1 runs on `lab12_transaction.contracts`, not on `hw_contracts` as the roadmap text literally says (protects lesson-3 homework T2)?
3. Lesson 3 still has the old container name and a "Bài 4" teaser. This plan does not edit lesson 3. Do you want a separate fix?

=== FILE: phase-01-invariants-setup.md ===
---
phase: 01
title: "Invariants first, then setup and reset"
status: pending
priority: P1
effort: 2h
dependencies: []
---

# Phase 01: invariants first, then setup/reset

## Goal

`npm run check` exists and is red before `setup` exists. Then `setup` (idempotent, `--force`), `reset`, and a dataset card turn it green. The lab03 fingerprint is proven unchanged.

## Files to create/modify (all owner: controller)

| Path | Purpose |
|---|---|
| `D:/study/advance-be/labs/lesson-12-transaction/package.json` | `"type":"module"`, deps `pg` 8.16.3; scripts `setup`, `check`, `reset` now; `lab1`–`lab8`, `homework*` added in later phases |
| `D:/study/advance-be/labs/lesson-12-transaction/node_modules/` | copy from `labs/lesson-03-index/node_modules` (pg 8.16.3 in its `package-lock.json`); else `npm ci --offline` from cache; else `npm install` (network) |
| `D:/study/advance-be/labs/lesson-12-transaction/check-lab-state.mjs` | invariants (≤200 lines) |
| `D:/study/advance-be/labs/lesson-12-transaction/setup.mjs` | idempotent build, `--force` |
| `D:/study/advance-be/labs/lesson-12-transaction/reset.mjs` | terminate leftover `lesson-12*` backends, drop objects |
| `D:/study/advance-be/labs/lesson-12-transaction/.env.example` | variable names only (`PG_URL`), no value |

Conventions copied from lesson 3 (`labs/lesson-03-index/`): `PG_URL` from env, never printed (client built inside `try`), Vietnamese comments, connection `application_name = lesson-12-transaction-lab`. The container name in every hint is `quan-ly-hop-dong-postgres-1`.

## Tasks and steps

1. **Write `check-lab-state.mjs` first.** Checks, each printing ✔/✘ and exiting 1 on any ✘:
   - C1 lesson-3 fingerprint (read-only): `lab03_indexing.hw_contracts` has 500,000 rows; `relallvisible = relpages = 5,666`; `SELECT xmin, ctid FROM lab03_indexing.hw_contracts WHERE id = 1` is `875` / `(0,1)`. On failure print "bài 3 đã bị đổi hoặc reset: chạy lại setup bài 3", never "fix" it.
   - C2 informational: `n_tup_upd`, `n_tup_del` of `hw_contracts` printed as "tham khảo" (weak signal; counters were reset; note 5).
   - C3 expected objects only: schema `lab12_transaction` holds `contracts`, `store_reps`, extension `pg_walinspect`, scratch tables matching `^l[0-9]{2}_`; nothing else. Before `setup` the schema is absent (state "chưa setup", exit code 2, distinct from 1).
   - C4 no session with `application_name LIKE 'lesson-12%'` other than the checker itself, and no row in `pg_locks` joined to a lab12 relation owned by another pid. Retry up to 5 s (a killed Node process leaves server backends briefly).
   - C5 `lab12_transaction.contracts` has 100,000 rows, id 1 = `HD0000001`, store 44; `store_reps` has 4 rows (stores 44, 45, two on duty each).
   - C6 foreign sessions: report (do not kill) non-lab sessions with `backend_xmin`/`backend_xid` set, as a warning.
   - C7 nothing written to `lab_imdb`/`maycha_lease`: the checker never connects to them (grep test below).
2. **Write `setup.mjs`.** Steps, all inside `lab12_transaction`:
   - verify C1 first, abort with message if lab03 missing.
   - `CREATE SCHEMA IF NOT EXISTS lab12_transaction`; `contracts` = `CREATE TABLE … AS SELECT * FROM lab03_indexing.hw_contracts WHERE id <= 100000` then `ALTER TABLE … ADD PRIMARY KEY (id)` (read-only on lesson 3).
   - `store_reps(store_id int, rep_id int, name text, on_duty bool, PRIMARY KEY(store_id, rep_id))`, 4 ASCII-name rows, all on duty.
   - `CREATE EXTENSION IF NOT EXISTS pg_walinspect SCHEMA lab12_transaction`.
   - pageinspect: look up its schema in `pg_extension`; if absent, `CREATE EXTENSION pageinspect SCHEMA lab12_transaction` and record that fact in the dataset card (reset drops it only in that case).
   - `ANALYZE contracts, store_reps` (no VACUUM-dependent assumptions: labs make their own `lNN_*` scratch tables with `autovacuum_enabled = false`).
   - print the dataset card (rows, total size, extension versions, `search_path` warning, container name, the two psql command lines). This card is homework A.
   - `--force`: `DROP SCHEMA lab12_transaction CASCADE` then rebuild. Without it, an existing complete schema prints "đã có, bỏ qua".
3. **Write `reset.mjs`.** `pg_terminate_backend` for `lesson-12%` backends except itself; `DROP EXTENSION IF EXISTS pg_walinspect`; `DROP SCHEMA IF EXISTS lab12_transaction CASCADE`. It never touches another schema. Print the C1 fingerprint afterwards.
4. Add `.env.example`; document nothing in Markdown here.

## Test matrix (test first)

| # | Test | Written | Command | Expected |
|---|---|---|---|---|
| T1.1 | check on empty DB state | before setup | `npm run reset && npm run check` | exit 2, "chưa setup"; C1 ✔ |
| T1.2 | setup builds everything | after | `npm run setup && npm run check` | exit 0, all ✔, card printed |
| T1.3 | idempotent | after | `npm run setup` twice | second run "bỏ qua", no error, row counts equal |
| T1.4 | `--force` rebuild | after | `npm run setup -- --force && npm run check` | exit 0 |
| T1.5 | fingerprint unchanged | after | `npm run check` after reset and after setup | 500,000 / 5,666 / 5,666 / 875 (0,1) both times |
| T1.6 | foreign object detected | after | `psql … -c "create table lab12_transaction.stray(a int)"` then `npm run check`; drop it | exit 1 naming `stray` |
| T1.7 | no hard-coded secrets, no foreign DBs | after | `grep -rniE "postgres://\|PGPASSWORD\|POSTGRES_PASSWORD\|lab_imdb\|maycha_lease" labs/lesson-12-transaction --include=*.mjs --include=*.json` | no hits except comments naming the DBs as "không đụng" (none expected) |
| T1.8 | line limit | after | `node plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-files.mjs` (available after phase 02; run in phase 02) | ≤200 each |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
npm run reset ; npm run check ; npm run setup ; npm run check ; npm run setup -- --force ; npm run check
```

Run via `docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab -c "select count(*) from lab12_transaction.contracts"` for a manual cross-check (100,000).

## Risks and rollback

- Lesson 3's `reset` drops its own `pageinspect`: setup handles it (install into lab12). Do not assume the schema name.
- `CREATE EXTENSION pg_walinspect SCHEMA …` requires the extension to be relocatable (pre-verified for 1.1). If it errors, fall back to default schema and call it qualified in lab 2 (record deviation).
- Rollback: `npm run reset`; delete the folder.

=== FILE: phase-02-harness-kit-scenarios.md ===
---
phase: 02
title: "Test harness, kit, frozen scenarios and expected matrix"
status: pending
priority: P1
effort: 4h
dependencies: [01]
---

# Phase 02: test harness, kit, frozen scenarios

## Goal

Write every check that later phases must satisfy, then the lean kit and the shared scenario contracts, then freeze them and issue the delegate brief. After this phase, labs, homework and guide cannot change the interfaces.

## Files to create/modify (all owner: controller)

Test harness first (outside the lab folder, lesson-3 `verify/` model):

| Path | Purpose |
|---|---|
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-files.mjs` | `wc -l` ≤ 200 per file in `labs/lesson-12-transaction/`; fails on `verdict(true`; fails on `.md` outside `plans/`/`docs/` in created paths; `postgres://`/`PGPASSWORD`/`POSTGRES_PASSWORD` grep |
| `…/verify/check-verdicts.mjs` | reads a lab's output; asserts every `##V` id of `expected.mjs` for that lab appears exactly once, no extra ids, none ✘ |
| `…/verify/mask.mjs` | mask rules: `\d+(\.\d+)? ?ms`, xid fields, LSN `[0-9A-F]+/[0-9A-F]+`, `pid\s*=?\s*\d+`; prints masked text |
| `…/verify/record-runs.mjs` | runs lab N twice, writes `lab-runs/labN.run1.txt`, `labN.run2.txt`; `labN.txt` = run 1 verbatim; masked diff; exits 1 on non-empty diff |
| `…/verify/check-guide.mjs` | guide verifier (see Task 3); red until phases 07–08 |
| `…/verify/homework-refusal.test.mjs` | spawns `npm run homework` against the untouched template; expects exit 1 and all `'???'` listed |
| `…/delegate-brief.md` | frozen interfaces, ownership, rules for phases 03–05 (model: `plans/261019-1634-lesson-03-index-teacher-guide/delegate-brief.md`) |

Kit and contracts (labs folder `D:/study/advance-be/labs/lesson-12-transaction/`):

| Path | Purpose |
|---|---|
| `lab-kit.mjs` | print helpers (copied from lesson 3's style, trimmed), `openSession(name)`, `closeAll`, `verdict(id, observed)`, `section()` |
| `runner.mjs` | step runner, ≈120 lines, no framework |
| `scenarios.mjs` | shared by labs 6–8, homework and the guide's walkthrough check |
| `expected.mjs` | the expected-verdict matrix (single source) |
| `kit.selftest.mjs` | kit tests K1–K9 (`node kit.selftest.mjs`) |

Do not import lesson 3's `pg-explain-kit.mjs` (it forces `search_path = lab03_indexing` and `application_name = lesson-03-index-lab`; decision D2).

## Tasks and steps

1. **Write `expected.mjs`** from the probe table in `plan.md`: `export const EXPECTED = { 'lab3.rc-sees-new': 'new', 'lab6.ru-dirty': 'không', … }`. Lab 5b and 8 ids that are `[M]` carry `'?'` meaning "to be measured"; `check-verdicts` treats `?` as fail until phase 06 fills it from a measurement (and writes the deviation note if different from the narrative).
2. **Write `verify/*` tools** listed above. They run against nothing yet and must fail red (no lab output, no guide).
3. **`check-guide.mjs` spec** (written now, fails now). Flags: default (structure), `--numbers`, `--render`.
   - Structure: ids `chang-1`…`chang-8`, `phong-van`, `cheat-sheet`, `ban-do-slide`; `SLIDES` has 26 entries; chips ↔ hrefs resolve; pg-mark slides {7,9,10,13,14,15,16,20,22,23} each have `callout pg`, a chip and a lab ref; verdict-chip table equals the contract (`Đúng trên PG16` for 4, 5, 8, 12, 18, 19, 21; the other ten as in candidate E); each stage has goal, `wwh`, widget or verbatim lab block, quiz of 3–5 questions with `0 ≤ answer < options.length`; exam and references present.
   - Storage: every `localStorage` key matches `^l12-`; no `l3-`; calls wrapped in `try`.
   - External URLs: none except font hosts.
   - Walkthrough: each `<pre data-scenario="id">` equals `scenarios.mjs` steps (diff); `"cửa sổ thứ ba"` absent.
   - `--numbers`: each number token in `data-lab="labN"` spans appears in `lab-runs/labN.txt`.
   - `--render`: runs `node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs <html> --out verify/render` with `TMP` and `TEMP` set inside the project; fails on runtime errors or overflow at 375.
4. **Write `homework-refusal.test.mjs`** and extend `check-files` with the homework file hash guard: sha256 of `homework-predictions.mine.mjs` stored in `verify/.mine.sha256` once the template is written (phase 05), compared after every run.
5. **Write `kit.selftest.mjs` before the kit** (red), then build the kit to pass it.
6. **Kit design (frozen):**
   - `openSession(label, {role})`: `new pg.Client({connectionString: process.env.PG_URL, application_name: 'lesson-12-' + label, options: '-c search_path=lab12_transaction -c lock_timeout=5000 -c statement_timeout=15000 -c idle_in_transaction_session_timeout=60000'})`, `client.on('error', …)` attached before `connect()`, client constructed inside the caller's `try`; returns `{label, client, pid}`. Settings are startup options so the kit never runs a statement that would move a Repeatable Read snapshot. A lab that needs a 500,000-row-style statement passes its own `statementTimeoutMs` explicitly.
   - Observer: separate session, `application_name lesson-12-observer`, autocommit, only reads `pg_stat_activity`, `pg_blocking_pids`, `pg_locks`.
   - `runner.run(steps, {sessions, observer})`, steps are plain rows `['A', sql, opts?]` with `opts` among `{waits:'A'}` (statement is expected to block until A finishes; runner starts it without awaiting, polls the observer until `pg_blocking_pids` of its pid contains A's pid, bounded by `lock_timeout`; a wait the scenario did not declare surfaces as the 55P03 error and is reported, not retried), `{expectError:'40001'}`, `{capture:'name'}` (rows kept in `ctx`). `ctx` and the timeline are returned; `--json` prints the timeline for widgets.
   - Cleanup: every session `ROLLBACK`ed (ignore errors) and `end()`ed in `finally`; `SIGINT` handler runs the same cleanup then exits 130; env hook `LAB12_SELF_INTERRUPT_AFTER=<n>` emits `SIGINT` after step n for testing on Windows.
   - `verdict(id, observed)`: compares to `EXPECTED[id]`, prints `##V id observed ✔|✘` plus a Vietnamese line; no boolean literal argument is accepted (throws if `typeof observed === 'boolean'`).
   - Output rules: Vietnamese comments; identical across runs except ms, xid, LSN, pid; statement SQL echoed verbatim; `PG_URL` never printed.
7. **`scenarios.mjs` frozen contract:**
   ```
   export const SCENARIOS = {
     'dirty-read':           { setup:[sql…], steps:[['A',sql],…], read:{who,key}, levels:['read uncommitted',…] },
     'non-repeatable-read':  …, 'phantom': …, 'app-lost-update': …, 'atomic-update': …,
     'write-skew': { steps: [['A','BEGIN ISOLATION LEVEL $LEVEL'],['B','BEGIN ISOLATION LEVEL $LEVEL'],
                    ['A',C],['B',C],['A',UPDATE rep 1],['B',UPDATE rep 2],['A','COMMIT'],['B','COMMIT',{expectError:'40001'}]] }
   }
   export const LEVELS = ['read uncommitted','read committed','repeatable read','serializable']
   export function expand(id, level) // returns concrete steps
   ```
   Write skew step order is fixed to A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT (must-fix 2). Each scenario resets its own scratch rows (`l06_*`, `l07_*`, `l08_*` or `store_reps` reset) in `setup`.
8. **Freeze and brief.** Write `delegate-brief.md`: interface signatures above, file ownership for phases 03/04/05, "do not edit kit, scenarios, expected, verify", Vietnamese comments, ≤200 lines, "làm mẫu → tự làm" tone, the 2-line entry pattern (`import './05-big-and-idle-tx-part-a.mjs'; import './05-big-and-idle-tx-part-b.mjs';`), no git, no verification beyond running own lab once.

## Test matrix (test first)

| # | Test | Command | Expected |
|---|---|---|---|
| K1 | session opens with identity | `node kit.selftest.mjs` | `application_name` = `lesson-12-A`; PG_URL not in output |
| K2 | per-session settings | same | `SHOW search_path` = `lab12_transaction`; lock_timeout 5s; statement_timeout 15s; idle timeout 60s (startup options worked) |
| K3 | no injected statement | same | server `pg_stat_statements`-free check: runner records exactly the statements given; test steps count = executed count |
| K4 | `error` listener | same | `pg_terminate_backend` of a session mid-run → test sees reported error, process not crashed |
| K5 | declared wait confirmed | same | B's UPDATE on A's row: observer sees A in `pg_blocking_pids`; timeline marks "đợi A" |
| K6 | undeclared wait | same | foreign lock held by a stray session → 55P03 reported, no hang >5 s |
| K7 | cleanup in `finally` | same | throw mid-run: no `lesson-12*` backend remains (`npm run check` C4) |
| K8 | SIGINT cleanup | `LAB12_SELF_INTERRUPT_AFTER=3 node kit.selftest.mjs --interrupt` then `npm run check` | exit 130, check passes |
| K9 | verdict refuses booleans | same | `verdict('x', true)` throws |
| H1 | check-files red/green | `node …/verify/check-files.mjs` | passes on the kit; a 201-line temp file fails |
| H2 | mask determinism | `node …/verify/mask.mjs` on two sample outputs | equal after masking, unequal before |
| H3 | check-guide red | `node …/verify/check-guide.mjs` | exit 1, "guide chưa có" (expected until phase 07) |
| H4 | homework refusal red | `node …/verify/homework-refusal.test.mjs` | fails until phase 05 |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
node kit.selftest.mjs ; node ../../plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-files.mjs ; npm run check
```

## Risks and rollback

- Startup `options` not honoured by the `pg` driver: K2 catches it; fallback is a single `SET` batch on the connection before any `BEGIN` (documented in the brief), still never inside a transaction.
- Runner grows beyond ≈120 lines: split helpers, never add a framework; check-files enforces 200.
- Rollback: delete the kit and verify folder; phase 01 stays.

=== FILE: phase-03-labs-day-02.md ===
---
phase: 03
title: "Labs 01-05 (Day 02: WAL, MVCC, dead versions, big and idle transactions)"
status: pending
priority: P1
effort: 4h
dependencies: [02]
---

# Phase 03: labs 01–05

## Goal

Five labs for stages 1–5 that run, print a step timeline, and emit only computed `##V` verdicts matching `expected.mjs`. Written by delegate A (or the controller if no delegate).

## Files to create/modify (owner: delegate A, folder `D:/study/advance-be/labs/lesson-12-transaction/`)

| Path | Notes |
|---|---|
| `01-atomicity-pg-rules.mjs` | S (single session) |
| `02-wal-records.mjs` | S |
| `03-mvcc-two-sessions.mjs` | R (+ `-part-a/-part-b` if >200 lines; entry is the 2-line importer) |
| `04-dead-versions-horizon.mjs` | R (split likewise if needed) |
| `05-big-and-idle-tx.mjs` | 2-line entry: imports part a and part b |
| `05-big-and-idle-tx-part-a.mjs` | concept 1: large transaction, batches vs one UPDATE |
| `05-big-and-idle-tx-part-b.mjs` | concept 2: idle and abandoned transactions |
| `package.json` | **controller** adds scripts `lab1`…`lab5` before fan-out (delegate does not edit) |

Delegate may not edit `lab-kit.mjs`, `runner.mjs`, `scenarios.mjs`, `expected.mjs`, `verify/*`. A kit gap is reported to the controller, not patched.

## Tasks and steps

Each lab: Vietnamese comments, header "Chứng minh gì", numbered steps, scratch table `lNN_*` with `autovacuum_enabled = false` created and dropped inside the lab's `finally`, final `##V` lines.

1. **Lab 1 (slides 4–5).** Session S: `BEGIN; SELECT 1/0;` → `22012`; next statement → `25P02`; `COMMIT` returns tag `ROLLBACK`. SAVEPOINT: error then `ROLLBACK TO SAVEPOINT`, tx continues, commit keeps rows. DDL: `CREATE TABLE l01_x` inside tx then ROLLBACK → table gone. Sequence: `nextval` before and after a rolled-back INSERT → gap. Verdicts on tags, row counts, nextval gap. Also measure the psql prompt glyphs claim `=#`/`=*#`/`=!#` by documenting it as psql-only (not measurable from Node): the guide quotes psql docs, not the lab (note in header).
2. **Lab 2 (slides 5, 12).** Per must-fix 7. Install nothing new (setup did). `lsn0 = pg_current_wal_lsn()` captured before BEGIN; capture the lab session's xid with `SELECT txid_current()` inside the transaction (a statement inside the tx is fine at RC); after COMMIT or ROLLBACK, `lsn1 = pg_current_wal_flush_lsn()`. Query `SELECT … FROM pg_get_wal_records_info($1::pg_lsn, $2::pg_lsn) WHERE xid = $3` (columns: `start_lsn, end_lsn, prev_lsn, xid, resource_manager, record_type, record_length, …`). Print record types and `start_lsn - lsn0` offsets only (relative); never absolute LSNs (determinism). Two runs: COMMIT (expects an `Transaction`/COMMIT record after the Heap records) and ROLLBACK (ABORT record, no undo record type exists). Verdict: flush LSN ≥ commit record end LSN; record-type list per case. `[M]` record names recorded verbatim from the first run; `expected.mjs` updated by the controller in phase 06 if they differ from narrative. Report `synchronous_commit` on/off as ms only.
3. **Lab 3 (slides 13–15).** Runner R. Steps: A reads id 1 with `xmin, xmax, ctid` (RC), B updates `RETURNING xmin, ctid` (instant; verdict: elapsed < 1,000 ms computed), A re-reads (RC sees new). Repeat with A at RR: sees old, `xmax` = B's xid (xid compared, not printed). Second writer: A (updater, open) vs C… only two sessions: A updates and stays open, B updates same row `{waits:'A'}`, observer confirms `wait_event_type = Lock`, `wait_event = transactionid`, blocker = A; A commits, B proceeds. Both versions shown with `heap_page_items` via the pageinspect schema looked up from `pg_extension` (qualified, never relying on `search_path`). The scratch table is a 10-row `l03_*` copy so ctid arithmetic is deterministic.
4. **Lab 4 (slides 13–14, 16).** Scratch `l04_*`, autovacuum off. (a) 1,000 INSERTs then fast ROLLBACK → `pgstattuple`/`VACUUM VERBOSE` counts dead tuples (pgstattuple lives in lesson 3's schema if present; if absent, use `n_dead_tup` after `pg_stat_force_next_flush`-free polling — otherwise skip with message; decide by the schema lookup). (b) open RR snapshot in B, A updates rows, `VACUUM VERBOSE` in A cannot remove them ("dead but not yet removable"). (c) pages touched by `SELECT … WHERE id = 1` at 0, 100, 1,000 versions via `EXPLAIN (ANALYZE, BUFFERS)` `Buffers: shared hit=`; `[M]`. Pre-check: observer warns when any foreign session has `backend_xmin`/`backend_xid` and marks verdicts ⚠ SKIPPED instead of ✔.
5. **Lab 5 part a (slides 17–19).** Batches of 1,000 vs one `UPDATE` of a 50,000-row scratch table: WAL bytes via `pg_current_wal_lsn()` difference (bytes printed rounded to KB, explicitly not hash-exact), table size, elapsed ms. Set `statementTimeoutMs` explicit because it exceeds the kit's 15 s default only if measured so (expected well under). Verdict: both give same final sum; WAL differs in the direction expected.
6. **Lab 5 part b (slides 18–21).** A opens a tx, updates row, goes idle. Observer shows `state = 'idle in transaction'`. B's UPDATE `{waits:'A'}` then with `lock_timeout = '1s'` (session option via a dedicated session) → `55P03`. Victim session with `idle_in_transaction_session_timeout = '1s'`: after wait, server kills it; its next statement fails and the `error` event is handled (`25P03`/`57P01` recorded verbatim, `[M]`). `pg_terminate_backend(pid)` from the observer. Check `[M]` claim: read-only idle transaction at RC holds no `backend_xmin` while an RR one does.
7. Controller adds a one-line mention in `delegate-brief.md` of which lab ids are `[M]`.

## Test matrix (tests exist from phase 02; run them here)

| # | Test | Command | Expected |
|---|---|---|---|
| L1 | lab output matches matrix | `npm run lab1 > out.tmp && node ../../plans/…/verify/check-verdicts.mjs lab1 out.tmp` (and lab2…lab5) | every id present once, all ✔; red before the lab exists |
| L2 | line limit | `node …/verify/check-files.mjs` | pass |
| L3 | cleanup | `npm run check` after each lab | exit 0 |
| L4 | foreign idle session | open `psql … -c "begin; select txid_current();"` in a third shell, run `npm run lab4` | warning "phiên khác giữ backend_xmin", verdicts ⚠ SKIPPED not ✔; foreign session still alive afterwards; `check` C6 warns but does not kill it |
| L5 | Ctrl+C mid-lab | `LAB12_SELF_INTERRUPT_AFTER=4 npm run lab5` plus one manual real Ctrl+C in a pty run | exit 130; `npm run check` passes |
| L6 | no verdict booleans | `grep -rn "verdict(true\|verdict(false" .` | empty |
| L7 | determinism preview | run lab 3 twice, `node …/verify/mask.mjs` diff | empty |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
for n in 1 2 3 4 5 ; do npm run lab$n > $TMP/l$n.txt ; done
npm run check
```
(Controller runs this; delegate runs its own lab once and stops.)

## Risks and rollback

- `[M]` claims fail (page counts, RC no `backend_xmin`): the lab reports the measured value; narrative changes in phase 07, never the data.
- Lab over 200 lines: use `-part-a/-part-b`.
- Rollback: delete the delegate's files; scripts stay inert.

=== FILE: phase-04-labs-day-03.md ===
---
phase: 04
title: "Labs 06-08 (Day 03: levels, lost update, write skew)"
status: pending
priority: P1
effort: 3h
dependencies: [02]
---

# Phase 04: labs 06–08

## Goal

Three runner labs that take their steps from `scenarios.mjs` (the same steps the guide's psql walkthrough shows), measure every anomaly at the relevant levels, and emit computed verdicts.

## Files to create/modify (owner: delegate B, `D:/study/advance-be/labs/lesson-12-transaction/`)

| Path |
|---|
| `06-levels-read-anomalies.mjs` |
| `07-lost-update.mjs` |
| `08-write-skew.mjs` (split into `-part-a/-part-b` with a 2-line entry if >200 lines) |

Controller adds `lab6`–`lab8` to `package.json` before fan-out. Delegate may not edit kit, runner, scenarios, expected, verify files.

## Tasks and steps

1. **Lab 6 (slides 6–9, 22).** (a) `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE` outside a block → `WARNING SET TRANSACTION can only be used in transaction blocks` captured through the pg `notice` event (token `warning`). (b) Same statement as first statement after `BEGIN` works; `SHOW transaction_isolation` reads the level. (c) For levels RU, RC, RR (and SER for completeness): dirty-read, non-repeatable-read and phantom scenarios via `expand(id, level)`. RU reports `read uncommitted` yet behaves as RC (`không` for dirty read). Tokens `xảy ra`/`không`.
2. **Lab 7 (slides 8–9).** `app-lost-update` at each level: A and B both `SELECT total`, then compute and `UPDATE total = $new` in app-style statements; RC: final 80 (expected total vs actual shown); RR/SER: B's UPDATE raises `40001 could not serialize access due to concurrent update` (the failing step is the UPDATE, not COMMIT). `atomic-update` (`UPDATE … SET total = total - 20`): safe at RC (`không`); RR/SER → `40001` on the waiting UPDATE after the first commits. Verdicts on totals and SQLSTATE.
3. **Lab 8 (slides 9–10, 23).** `write-skew` on `store_reps` store 44 at RR and SER. Order A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT; at RR both commit (0 on duty); at SER **B's COMMIT** raises `40001 could not serialize access due to read/write dependencies among transactions` and the final count is 1 (must-fix 2). Then retry: the whole of B's transaction re-run succeeds and refuses (count stays 1). `[M]` false positive: scenario with a seq-scan (no index on the predicate) where two transactions touching different rows still conflict; try to reproduce with `max_pred_locks_per_page = 2` read from `SHOW`; if it does not reproduce, the lab prints "không tái hiện được; trích docs" and the guide cites the docs (no number quoted). Also record `pg_locks` `SIReadLock` rows via the observer to support "SIRead locks never block".
4. Each lab resets `store_reps` at the end inside `finally` (`UPDATE store_reps SET on_duty = true`) and `check` C5 asserts all 4 on duty.

## Test matrix (tests from phase 02)

| # | Test | Command | Expected |
|---|---|---|---|
| L6 | verdict match for labs 6–8 | `npm run lab6 > out && node …/verify/check-verdicts.mjs lab6 out` (7, 8) | all ✔ |
| L7b | SSI step | `npm run lab8` | the single `40001` is attributed to step "B COMMIT", not an UPDATE |
| L8 | store_reps restored | `npm run check` after lab 8 and after an interrupted lab 8 (`LAB12_SELF_INTERRUPT_AFTER=6`) | C5 and C4 ✔ |
| L9 | scenarios are the single source | `grep -c "BEGIN ISOLATION" 06*.mjs 07*.mjs 08*.mjs` | 0 (steps come from `expand`) |
| L10 | negative: foreign lock | hold `store_reps` lock in a third session, run lab 8 | declared waits fine; undeclared wait → reported 55P03, no hang, cleanup done |
| L11 | line limit | `node …/verify/check-files.mjs` | pass |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
for n in 6 7 8 ; do npm run lab$n ; done ; npm run check
```

## Risks and rollback

- Probe was on a tiny table with fixed step order; real labs may differ (RR update step vs commit step). Measurement wins; deviation note.
- Rollback: delete the three files.

=== FILE: phase-05-homework.md ===
---
phase: 05
title: "Homework A-D, runner and refusal behaviour"
status: pending
priority: P1
effort: 3h
dependencies: [02]
---

# Phase 05: homework

## Goal

Lesson-3-style homework: dataset card (A), predictions matrix (B), AI-draft review (C), tự làm (D, optional bridge). The refusal test already exists (phase 02, red); this phase turns it green.

## Files to create/modify (owner: delegate C, folder `D:/study/advance-be/labs/lesson-12-transaction/`)

| Path | Notes |
|---|---|
| `homework.mjs` | runner (≤200 lines): reads the learner file, refuses `'???'`, runs filled rows through `scenarios.mjs`, prints timeline for every ✘ |
| `homework-predictions.mine.mjs` | learner file; template with `'???'` in 24 cells and six `why: ''` lines |
| `homework-ai-draft.mjs` | planted-flaw draft for part C |
| `homework-solution.mjs` | measures everything, prints the answers (matrix, C flaws, D) |
| `homework-d-select-for-update.mjs` | part D check, imported by solution; optional |
| `package.json` | **controller** adds `homework`, `homework:draft`, `homework:solution` |

## Tasks and steps

1. **A.** Reuse setup's dataset card; `homework.mjs --card` re-prints it. Learner copies it into the notes.
2. **B template.** `export default { 'dirty-read': { 'read uncommitted': '???', 'read committed': '???', 'repeatable read': '???', 'serializable': '???', why: '' }, …}` for the six scenarios. Allowed cell values `'xảy ra' | 'không' | '40001'`. One `why` line per scenario row (6 lines), per must-fix 1; cells are enums, no per-cell prose.
3. **Runner behaviour.** (i) If any cell is `'???'`: print the list (`scenario × level`), exit 1, run nothing and write nothing. (ii) If a `why` is empty: warn, still run. (iii) Otherwise run each scenario × level through `expand`, compare measured token to the learner's token, print ✔/✘ plus the step timeline for every ✘, then the 6×4 matrix. (iv) The runner never writes to the learner file and never leaves sessions (cleanup in `finally`).
4. **C draft.** `homework-ai-draft.mjs` has the four planted flaws: one client used for both sessions; `SET TRANSACTION` issued before `BEGIN`; a write-skew test on rows that share no invariant; COMMIT errors ignored. `npm run homework:draft` must be **safe**: it runs against scratch `l_hw_*` tables, uses short timeouts, never leaves a transaction open, and prints its own wrong-looking "✔" so the learner can spot the flaws. The flaw list is not printed; `homework:solution` prints it.
5. **D (optional bridge, after the exam).** Keep M3's invariant at RC with `SELECT … FOR UPDATE` on the rows (not on `count(*)`). Pass = B waits, then sees 1 and refuses, no `40001`. Header comment: "tuỳ chọn – cầu nối sang bài 14, ngoài 80 phút của chặng 8" (must-fix 8).
6. **Solution.** `homework:solution` measures all 24 cells, prints the 6×4 matrix with every cell ✔ against `EXPECTED`, plus C's four flaws and D's answer.
7. Controller records the SHA-256 of the untouched template into `verify/.mine.sha256`.

## Test matrix

| # | Test | Command | Expected |
|---|---|---|---|
| H4 | refusal on blank | `node …/verify/homework-refusal.test.mjs` (and `npm run homework`) | exit 1; output lists all 24 `scenario × level` cells (not 23, not 25); no session opened (`check` clean) |
| H5 | template untouched | `sha256sum homework-predictions.mine.mjs` vs `.mine.sha256` after `homework`, `:draft`, `:solution` | equal |
| H6 | all filled correct | temp copy of the key (not the learner file) via `--file` flag, `npm run homework -- --file <tmp>` | all ✔, exit 0 |
| H7 | one wrong cell | temp copy with one cell flipped | exactly one ✘, timeline printed, exit 1 |
| H8 | draft safe | `npm run homework:draft` then `npm run check` | exit 0, no leftover tables or sessions |
| H9 | solution complete | `npm run homework:solution` | 6×4 all ✔, parts C and D answers printed |
| H10 | `why` budget | template contains exactly 6 `why` keys | `grep -c "why:"` = 6 |
| H11 | line limit | `node …/verify/check-files.mjs` | pass |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
npm run homework ; npm run homework:draft ; npm run homework:solution ; npm run check
node ../../plans/261024-1435-lesson-12-transaction-teacher-guide/verify/homework-refusal.test.mjs
```

## Risks and rollback

- The key may differ from the probe (atomic-update RR/SER `[M]`): the key is what `solution` measures; `expected.mjs` is updated by the controller via deviation note.
- Learner file is his own work: the runner must never overwrite it (H5).
- Rollback: delete the five homework files.

=== FILE: phase-06-serial-runs-determinism.md ===
---
phase: 06
title: "Serial lab runs, recording and masked-diff determinism"
status: pending
priority: P1
effort: 2h
dependencies: [03, 04, 05]
---

# Phase 06: serial runs and determinism

## Goal

The controller runs every lab twice, serially, records outputs verbatim, proves determinism (diff empty after masking ms, xid, LSN, pid), settles every `[M]` item, and runs the negative tests on the finished kit.

## Files to create/modify (owner: controller)

- `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/lab-runs/lab1.txt` … `lab8.txt` (run 1 verbatim), `lab1.run1.txt`/`run2.txt` etc.
- `…/lab-runs/homework-blank.txt`, `homework-draft.txt`, `homework-solution.txt`
- `…/lab-runs/deviations.md` (only if a measurement contradicted an expectation)
- `…/lab-runs/dataset-card.txt`
- `D:/study/advance-be/labs/lesson-12-transaction/expected.mjs` (controller-only edits: replace `'?'` with measured tokens, with a note per change)

## Tasks and steps

1. `npm run reset && npm run setup`; `npm run check` green.
2. Serial: `node verify/record-runs.mjs 1` … `8`. No two labs in parallel. Only one controller session touches the DB; the guide is not touched during runs.
3. For every `[M]` item from candidate E §8, take the measured result and fix the narrative: which statement SSI fails on; false positive reproduces or not; RC read-only idle holds no `backend_xmin`; page counts; record names; psql glyphs (checked by hand in a real psql window, noted in `deviations.md` as "đo tay"); TypeORM `START TRANSACTION` then `SET TRANSACTION` (read from both versions' query-runner source, not a lab).
4. Run homework outputs: blank (exit 1), draft, solution; store in `lab-runs/`.
5. Negative tests on the final code (see matrix).
6. Final `npm run check`.

## Test matrix

| # | Test | Command | Expected |
|---|---|---|---|
| R1 | each lab twice, masked diff | `node …/verify/record-runs.mjs <n>` | exit 0, diff empty for n = 1…8 |
| R2 | verdict match | `node …/verify/check-verdicts.mjs lab<n> lab-runs/lab<n>.txt` | all ✔, no `?` left in `expected.mjs` |
| R3 | check after full run | `npm run check` | exit 0; fingerprint 500,000 / 5,666 / 875 (0,1); `hw_contracts` unchanged |
| R4 | check after Ctrl+C | start `npm run lab3`, real Ctrl+C in a pty at step 3, then `npm run check` | exit 0 (retry window 5 s) |
| R5 | foreign idle session | open an idle tx in a third client, `npm run lab4` | ⚠ warning, verdicts not ✔, foreign session untouched |
| R6 | untouched homework file | sha256 vs `.mine.sha256` | equal |
| R7 | masked diff counter-test | alter one number in a copy of a run and diff | non-empty (the mask is not over-greedy) |
| R8 | lesson-3 impact | `git status` | no lesson-3 or `hw_contracts`-related path changed |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
node ../../plans/261024-1435-lesson-12-transaction-teacher-guide/verify/record-runs.mjs 1
… 8
npm run check
```
(Loop all eight; shell loop in a single command.)

## Risks and rollback

- Non-empty diff on a number that is not ms/xid/LSN/pid (for example a WAL byte count): the lab prints it rounded or the figure leaves the lab; fix the lab, never widen the mask beyond the four listed classes.
- A lab flakes: record it in `deviations.md`, fix the root cause (undeclared wait, GUI holding xmin), re-run both runs.
- Rollback: delete `lab-runs/`, re-run.

=== FILE: phase-07-guide-shell-stages-0-5.md ===
---
phase: 07
title: "Guide shell, stages 0-5 (Day 02), widgets W1-W3"
status: pending
priority: P1
effort: 5h
dependencies: [06]
---

# Phase 07: guide shell and Day 02 stages

## Goal

The HTML guide exists with the lesson-3 shell and stages 0–5, widgets W1–W3, M1 walkthrough, quizzes, all numbers from `lab-runs/`. `check-guide` structure checks for stages 0–5 go green.

## Files to create/modify (owner: controller)

| Path | Purpose |
|---|---|
| `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html` | final page (build output) |
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/guide-src/00-shell.html` … `05-*.html`, `widgets-w1-w3.js` | source fragments |
| `…/verify/build-guide.mjs` | concatenates fragments in order into the HTML (20 lines); keeps one deterministic build |

Reference only (read, do not edit): `reports/advanced_backend/lesson_03_index_teacher_guide.html` (243 KB; read in ranges for shell, CSS, `SLIDES`, quiz and widget patterns).

## Tasks and steps

1. **Shell.** Copy structure and CSS from lesson 3: hero "Bài 12 / 16", 8-stage rail, progress bar, light/dark, `callout`, `wwh` grid, folded answers. Replace storage keys with `l12-stage-1`…`l12-stage-8`, `l12-warmup`, `l12-quiz-*`, `l12-m1-*`, `l12-m3-*`, each access in `try/catch`; no `l3-*` read or written.
2. **Slide map and day split.** `SLIDES` array of 26 chips following the roadmap order (Day 02: 1–5, 11–21; Day 03: 6–10, 22–26). A note near the map says the guide follows the roadmap, not PDF order (risk "briefly disoriented", contract C2). Chip fields: `n`, `title`, `pg` mark, `chip` (`Đúng trên PG16`, `MySQL đúng, PG khác`, `Cần sửa`), `stage`, `lab`.
3. **Stage 0 (5 min).** How to study, open two psql windows: `docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab` ×2, line one `SET search_path = lab12_transaction;` (why: database-level `search_path = lab03_indexing, public`, so unqualified names would hit lesson 3). GUI = observer only (`SELECT pid, state, pg_blocking_pids(pid) FROM pg_stat_activity`, auto-commit on). Dataset card from `lab-runs/dataset-card.txt` (homework A).
4. **Stage 1 (20 min, slides 3–5)** with W1 (state machine, prompts `=#` `=*#` `=!#` quoting psql docs as the glyph source) and lab 1 verbatim block.
5. **Stage 2 (20 min, slides 11–12)** with W2 (WAL crash simulator, `synchronous_commit` on/off, timings as ms from lab 2) and lab 2 block with relative offsets only.
6. **Stage 3 (40 min, slides 13–15)** with W3 (RC vs RR "which version do you see?") and the **M1 table** exactly as in candidate E, with must-fix 4: step 5 uses window A (after its COMMIT) as the second writer; no third window. Slide 15's empty slide and "MVVC" typo are filled and chipped `Cần sửa`. `callout pg` for slides 13, 14, 15.
7. **Stage 4 (20 min, slides 14, 16)** from lab 4: dead versions, VACUUM, the horizon, page counts at 0/100/1,000 with the HLL sentence cited to InnoDB docs, labelled "không đo trên máy này".
8. **Stage 5 (30 min, slides 17–21)** from lab 5 parts a and b; optional M2 (A leaves UPDATE open; B `lock_timeout = '3s'` → `55P03`; observer `pg_terminate_backend`). Warn: Day 02's done-criterion is M1.
9. Each stage gets a goal line, `wwh` grid, widget or verbatim lab block (`<pre data-lab="labN">` copied byte-for-byte from `lab-runs/labN.txt`), and a 3–5 question quiz with valid answer indices.
10. MySQL facts: every MySQL statement carries "không đo trên máy này" and a source link/slide number from the evidence packet; external links are plain `<a>` text references, not loaded resources.
11. Build, run `check-guide` and `render-check`.

## Test matrix (check-guide red since phase 02)

| # | Test | Command | Expected |
|---|---|---|---|
| G1 | ids for stages 1–5 | `node …/verify/check-guide.mjs --stages 0-5` | pass; stages 6–8 not yet checked |
| G2 | storage keys | `grep -oE "l[0-9]+-[a-z0-9-]+" <html> \| sort -u` filtered to localStorage calls | only `l12-*`; no `l3-` |
| G3 | no external URLs | `check-guide.mjs` | only font hosts |
| G4 | verbatim lab blocks | `check-guide.mjs --numbers --stages 0-5` | every number token in `data-lab` found in `lab-runs/` |
| G5 | walkthrough = scenarios | `check-guide.mjs` | M1 SQL in the page equals the lab-3 steps (lab 3 steps live in the lab; M1 is checked by `data-lab="lab3"` block vs the lab file's SQL list) |
| G6 | no third window | `grep -c "cửa sổ thứ ba" <html>` | 0 |
| G7 | render | `TMP=… TEMP=… node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs <html> --out verify/render` | no runtime errors, no overflow at 375, touch targets ok |
| G8 | prose budget | words per stage in `check-guide.mjs` | ≤ configured cap per stage (set once, near lesson 3's average) |

## Verification

```
cd D:/study/advance-be
node plans/261024-1435-lesson-12-transaction-teacher-guide/verify/build-guide.mjs
node plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-guide.mjs --stages 0-5
```
With `TMP`/`TEMP` inside the project for render-check.

## Risks and rollback

- Quoting a number not in `lab-runs/`: G4 fails; fix by re-reading the run, not the page.
- Large HTML: fragments are edited with `edit`; never rewritten wholesale after the first build.
- Rollback: delete the HTML and `guide-src/`; labs stand alone.

=== FILE: phase-08-guide-stages-6-8-homework-exam.md ===
---
phase: 08
title: "Guide stages 6-8, widgets W4-W5, homework, NestJS drill, exam, chips"
status: pending
priority: P1
effort: 5h
dependencies: [07]
---

# Phase 08: guide Day 03, homework, drill, exam

## Goal

Complete the page: stages 6–8, W4–W5, homework A–D, the 6-bug drill, exam, cheat sheet, references, lesson-14 teaser, verdict chips for all 26 slides. `check-guide` passes fully, including `--numbers` and `--render`.

## Files to create/modify (owner: controller)

- `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/guide-src/06-*.html`, `07-*.html`, `08-*.html`, `widgets-w4-w5.js`, `exam-cheat-refs.html`
- rebuilt `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html`
- `…/guide-src/typeorm-drill.html` (the drill)

## Tasks and steps

1. **Stage 6 (30 min, slides 6–9, 22).** Where `SET TRANSACTION` must go; RU = RC; non-repeatable read and phantom only at RC; RR sees a snapshot as of the first non-transaction-control statement (PG 16 docs wording). Lab 6 block verbatim. Chips: 7 `MySQL đúng, PG khác`, 9 same, 22 same.
2. **Stage 7 (40 min, slides 8–10).** Lab 7 and lab 8 blocks. Key sentence "write skew chỉ lộ ra ở COMMIT thứ hai" (must-fix 2). **M3 table** from candidate E (two windows; step 5 repeats at SERIALIZABLE; fill-in "which step errors, SQLSTATE" → the second `COMMIT`). Step 4 resets with `UPDATE store_reps SET on_duty = true;`. Retry demo from lab 8; the false positive is quoted only if lab 8 reproduced it, else cited to docs. Chip slide 10 `MySQL đúng, PG khác` (SSI, SIRead locks never block).
3. **W4** (two-session player over lab 6–8 timelines from `--json` output, only cases demonstrated) and **W5** (idle-transaction board from lab 5b: pick the pid to kill and the timeout that would have prevented it).
4. **Stage 8 (80 min, slides 23–26).** Recap, cheat sheet, homework A–C, the 6 `why` lines rule (must-fix 1), exam. Slide 23 chip `Cần sửa` (PG has no undo; isolation also relies on row locks). **Homework D** sits after the exam under a heading "Tuỳ chọn – cầu nối sang bài 14 (ngoài 80 phút)" (must-fix 8), with the lesson-14 teaser: waiting writer from lab 3, `FOR UPDATE`, two sessions lock ids 1 and 2 in opposite order → `40P01` after `deadlock_timeout` (1 s here), fix = consistent lock order; question: which contract endpoint needs SERIALIZABLE plus retry and which needs `FOR UPDATE`? The `40P01` timing is stated as "dự kiến, đo ở bài 14" unless lab-measured (not measured here).
5. **NestJS drill (must-fix 6).** Six bugs with folded answers:
   1. injected repository used inside `dataSource.transaction` (must use the `manager` argument);
   2. read-modify-write via `save()`;
   3. HTTP call inside the transaction;
   4. QueryRunner not released in `finally`;
   5. no retry of the whole callback on `40001`;
   6. swallowed error leading to `25P02`.
   Version handling: first, ask the user for the real version (open question 1). Until answered, pin the docs quoted to TypeORM **0.3.20** and **1.1.2** (npm latest) and label every difference: both send `START TRANSACTION` then `SET TRANSACTION ISOLATION LEVEL <level>`; 1.x adds fallback to `dataSource.options.isolationLevel` and renames `queryRunner.connection` to `queryRunner.dataSource`. Re-check API names by reading `DataSource.d.ts` and `PostgresQueryRunner` of both versions (`unpkg.com/browse/typeorm@0.3.20`, `…@1.1.2`) at the time of writing; snippets are not executed (non-goal: the learner's repo). Mark each snippet "0.3.x" or "1.x" where it differs. When the user answers, drop the other version's notes.
6. **Verdict chips** for all 26: `Đúng trên PG16` for 4, 5, 8, 12, 18, 19, 21; the contract table for 7, 9, 10, 13, 14, 15, 16, 20, 22, 23; remaining slides (1–3, 6, 11, 17, 24–26) get `Đúng trên PG16` only where a lab or doc supports it, otherwise a neutral "ngoài phạm vi đo" chip with the slide reference. Check that no chip lacks a source.
7. **Exam, cheat sheet, references.** Exam questions use measured facts only. References: slide 25 plus PG 16 docs (transaction-iso, mvcc, wal, explicit-locking), TypeORM transactions doc; labelled MySQL citations.
8. Build and run all guide checks.

## Test matrix

| # | Test | Command | Expected |
|---|---|---|---|
| G9 | full structure | `node …/verify/check-guide.mjs` | pass (stages 1–8, 26 chips, `SLIDES` hrefs, pg marks) |
| G10 | numbers | `check-guide.mjs --numbers` | every number in `data-lab` and prose found in `lab-runs/` |
| G11 | walkthrough diff | `check-guide.mjs` | M3 SQL equals `scenarios.mjs` `write-skew` expansion at RR and SER |
| G12 | fill-in persistence | `node` + browser run via render-check or manual: type in `l12-m1-*`, reload | value persists; other `l3-*` keys untouched |
| G13 | quizzes valid | `check-guide.mjs` | 3–5 questions per stage, indices valid |
| G14 | drill | `check-guide.mjs` | exactly 6 bug blocks with `<details>` answers |
| G15 | homework D position | `check-guide.mjs` | D heading appears after the exam section id |
| G16 | render and light/dark | `render-check.mjs … --out verify/render` | no console errors, no horizontal scroll at 360–375 px |
| G17 | offline | `check-guide.mjs` | no external resource except fonts |

## Verification

```
cd D:/study/advance-be
node plans/261024-1435-lesson-12-transaction-teacher-guide/verify/build-guide.mjs
node plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-guide.mjs
node plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-guide.mjs --numbers
node plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-guide.mjs --render
```

## Risks and rollback

- Study time over 4.75 h: M2 and the false-positive part are marked optional; stage 8's 80 min excludes D.
- TypeORM drill drift: labels prevent wrong claims; unanswered question 1 does not block.
- Rollback: restore previous build of the HTML from `guide-src` fragments (rebuild after reverting fragment edits).

=== FILE: phase-09-ultra-code-review.md ===
---
phase: 09
title: "Ultra code review, fix, re-run"
status: pending
priority: P1
effort: 3h
dependencies: [08]
---

# Phase 09: `/ak:code-review --ultra`

## Goal

Five independent reviewers, verifier-validated union of findings. Critical and Important findings are fixed, and every affected lab is re-run twice with the masked diff empty.

## Files to create/modify

- Review output: `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/reports/code-review-ultra.md` (owner: review run; controller reads).
- Fixes: owner controller for kit, scenarios, expected, guide; the original delegate may fix its own lab only if the controller assigns it, one owner per file.
- `lab-runs/` refreshed for affected labs.

## Tasks and steps

1. Prepare a review packet: file list (`labs/lesson-12-transaction/*`, `verify/*`, guide HTML, `lab-runs/`), acceptance criteria, hard constraints (objects only in `lab12_transaction`, `search_path`, timeouts, `PG_URL` never printed, ≤200 lines, no `verdict(true`).
2. Run `/ak:code-review --ultra`; ask reviewers to focus on safety (P5), determinism, hidden waits, snapshot movement by injected statements, cleanup paths, guide claims versus `lab-runs/`, Vietnamese comment convention, secret grep.
3. Triage the verified union: Critical/Important → fix; Minor → fix only if cheap; each decision recorded in the review file.
4. For every fixed lab or kit change: re-run `record-runs.mjs` for **all** labs if the kit changed, otherwise only affected labs; rerun `check-verdicts`; rebuild the guide if any number or text changed; rerun `check-guide`.
5. Re-run negative tests R4–R6 after any kit change.

## Test matrix

| # | Test | Command | Expected |
|---|---|---|---|
| V1 | review findings closed | read `code-review-ultra.md` | no open Critical/Important |
| V2 | regression per fix | `node …/verify/record-runs.mjs <n>` | masked diff empty |
| V3 | guide still consistent | `check-guide.mjs --numbers` | pass |
| V4 | kit tests | `node kit.selftest.mjs` | pass |
| V5 | invariants | `npm run check` | exit 0 |
| V6 | line and secret gates | `node …/verify/check-files.mjs` | pass |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
node kit.selftest.mjs ; npm run check
node ../../plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-files.mjs
node ../../plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-guide.mjs --numbers
```

## Risks and rollback

- Review demands a change that would move settled contract decisions: record it as "ngoài hợp đồng" and decline, unless it is a safety defect.
- A kit fix forces eight re-runs: accepted cost (~20 min serial).
- Rollback: revert only the touched file to its pre-fix content from the controller's copy; no git steps.

=== FILE: phase-10-tests-docs-final-gate.md ===
---
phase: 10
title: "Test honesty, docs route and final gate"
status: pending
priority: P1
effort: 2h
dependencies: [09]
---

# Phase 10: tests, docs, final gate

## Goal

Confirm test coverage is honest, add the README route to the new lab folder and guide, and run the final gate across all acceptance criteria.

## Files to create/modify

| Path | Owner | Notes |
|---|---|---|
| `/ak:test` run | controller | only if coverage is not already honest (see Task 1) |
| README route (`/ak:docs update`) | controller | the repo's existing README under `D:/study/advance-be/` or `docs/` that already routes to lesson 3; add one line each for `labs/lesson-12-transaction/` and the guide. Markdown stays under `plans/` or `docs/` per note 9; if the only existing route file is a root README, edit that one line only and record the exception here |
| `plans/261024-1435-lesson-12-transaction-teacher-guide/plan.md` | controller | replace the stub with the final plan, `status: completed` when this phase passes |
| `plans/261024-1435-lesson-12-transaction-teacher-guide/phase-01-start.md` | controller | the stub is replaced by `phase-01-invariants-setup.md`; remove the stub |

## Tasks and steps

1. **Honesty check.** The test suites are: `kit.selftest.mjs` (K1–K9), `verify/*` (H1–H4, R1–R8), the homework refusal test, `check-guide`. Run `/ak:test` only if any of these was skipped or edited after its last green run. State in the final report which suites ran.
2. **Docs.** Run `/ak:docs update` limited to the README route: where Lesson 12 lives, how to start (`npm run setup`, `npm run lab1`, …), the two-window psql command, and the `search_path` warning. Do not edit lesson-3 files; the old container name and "Bài 4" teaser are open question 3.
3. **Final gate:** run, in order, every command in the Verification section, then tick criteria 1–12 of `plan.md` with the proving command/output.
4. `git status` (the only git command): paths must be exactly the new lab folder, the guide HTML, the plan directory, and the one README edit; lesson-3 folders unchanged.
5. Leave everything uncommitted. No branch, no push, no PR, no issue.

## Test matrix

| # | Test | Command | Expected |
|---|---|---|---|
| F1 | every npm script runs | `npm run setup; check; lab1..lab8; homework (exit 1); homework:draft; homework:solution` | as specified |
| F2 | line limits | `node …/verify/check-files.mjs` | every lab file ≤ 200 |
| F3 | no secrets | `grep -rniE "postgres://\|PGPASSWORD\|POSTGRES_PASSWORD" labs/lesson-12-transaction reports/advanced_backend/lesson_12_transaction_teacher_guide.html docs` | no hits |
| F4 | verdict literals | `grep -rn "verdict(true" labs/lesson-12-transaction` | empty |
| F5 | guide | `check-guide.mjs`, `--numbers`, `--render` | pass |
| F6 | invariants after full run | `npm run check` | exit 0 |
| F7 | git status | `git status --short` | expected paths only |
| F8 | lesson 3 unaffected | `cd ../lesson-03-index && npm run check` (its read-only check script, if present) | passes as before |

## Verification

```
cd D:/study/advance-be/labs/lesson-12-transaction
npm run check
node ../../plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-files.mjs
node ../../plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-guide.mjs --numbers
cd D:/study/advance-be ; git status --short
```

## Risks and rollback

- README edit drifting beyond one route line: keep to the single line; revert by editing it back.
- A last-minute fix invalidates a recorded run: re-run the lab twice (phase 06 procedure) before closing.
- Rollback of the whole lesson: `npm run reset`, delete `labs/lesson-12-transaction/`, the guide HTML and the README line; the plan directory may stay as a record.
