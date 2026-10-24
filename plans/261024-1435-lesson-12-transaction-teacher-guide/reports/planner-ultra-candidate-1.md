=== FILE: plan.md ===
---
title: "Lesson 12 (Transaction): teacher guide and run-verified two-session labs"
description: "Vietnamese lesson-3-style guide plus eight PostgreSQL 16 labs on WAL, MVCC and isolation, driven by step order, every number measured on this machine."
status: pending
priority: P1
effort: 26.5h
branch: main
tags: [lesson-12, transaction, mvcc, isolation, postgresql, teacher-guide, labs, tdd]
blockedBy: []
blocks: []
created: 2026-10-24
---

# Lesson 12: Transaction, WAL, MVCC and isolation (TDD plan)

## Overview

Đạt gets `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html` and `D:/study/advance-be/labs/lesson-12-transaction/`. The guide uses the lesson-3 shell and is written in Vietnamese. It has 8 stages, about 4 h 45′ in total: Day 02 is stages 0–5 (2 h 15′) and Day 03 is stages 6–8 (2 h 30′). It also has 5 widgets, 8 quizzes, an exam, a cheat sheet, a 26-chip slide map and a lesson-14 teaser. The labs use Node ESM with `pg`, a small kit of their own, and a `scenarios.mjs` that both the labs and the homework read. Each lab runs sessions A and B plus an observer in a fixed step order, confirms every wait with `pg_blocking_pids()` and never relies on sleeps. Đạt replays the same SQL by hand in two psql windows. Every number the guide quotes comes from `lab-runs/*.txt`, and every lab is recorded twice with an empty masked diff. Tests come first: the invariants, the expected-verdict matrix, the homework refusal tests and the guide checks exist, and fail, before the code they check. All work happens on `main` and stays uncommitted. The only git command used is `git status`.

## Data flow and constraints

- **Lab data flow:**
  - `lab03_indexing.hw_contracts` (read only) feeds `npm run setup`.
  - Setup builds `lab12_transaction.contracts` (ids 1–100,000, with a PK), `store_reps` (4 rows) and `pg_walinspect`.
  - Each lab builds its own `lNN_*` scratch tables with autovacuum off. Any column Đạt may edit by hand is replaced by a constant.
  - The sessions write to stdout, `verify/record.mjs` stores it in `lab-runs/`, and the guide quotes it for the learner.
- **Homework data flow:** enum predictions (no SQL) go to the runner, which runs `scenarios.mjs` on `lhw_*` scratch tables and prints the measured matrix.
- **Database scope:**
  - Objects are created only in `lab12_transaction`, and DDL is always schema-qualified.
  - Every session runs `SET search_path = lab12_transaction` first. The reason: `advance_be_lab` has a database-level `search_path = lab03_indexing, public`, so an unqualified name would resolve into lesson 3.
  - The lesson-12 table names (`contracts`, `store_reps`, `lNN_*`, `lhw_*`) do not exist in `lab03_indexing`. A forgotten SET therefore fails with "relation does not exist" instead of writing there.
  - The only other use of `lab03_indexing` is reading its `pageinspect` functions.
  - Never touch `lab_imdb` or `maycha_lease`. Never run `ALTER SYSTEM` or `ALTER DATABASE`.
- **File rules:**
  - Each `.mjs` file is 200 lines or fewer (the HTML is exempt), with Vietnamese comments.
  - No literal `verdict(true|false)`.
  - Markdown goes only under `plans/`.
  - Nothing is written outside `D:/study/advance-be`; render and Chrome temp files go under `PLAN/verify/tmp`.
- **Credentials:** `PG_URL` is built in the same command as each DB run, using the recipe in `D:/study/advance-be/plans/261019-1634-lesson-03-index-teacher-guide/delegate-brief.md` §Environment with the container renamed to `quan-ly-hop-dong-postgres-1`. It is never echoed and never copied into lesson-12 files; the guide points Đạt to lesson 3 §6.3. Runs are recorded from Git Bash through `verify/record.mjs`, which writes raw UTF-8 bytes so PowerShell cannot re-encode them.
- **Path shorthands:** `LAB` = `D:/study/advance-be/labs/lesson-12-transaction` and `PLAN` = `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide`.

## Contract and must-fix resolution

| # | Must-fix note | Resolution and location |
|---|---|---|
| 1 | Homework B writing load | 24 enum cells plus one `why` line per scenario row (6 lines); no prose per cell (phase 04, homework files; AC9) |
| 2 | SSI failure step | `M3` runs A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT. The key for claim 08.2 and the guide is "lần COMMIT thứ hai (bước 8, của B)". It is re-measured into `lab-runs/lab08.txt` (phases 03–06) |
| 3 | Lab 05 overload | `05-big-and-idle-tx-part-a.mjs` (large transaction) and `-part-b.mjs` (idle or abandoned), each ≤ 200 lines. `lab5a` and `lab5b` run one part each; `lab5` runs both (phases 01, 04) |
| 4 | M1 third window | `M1` uses only windows A and B. Window A becomes the second writer after its own COMMIT, and the GUI only observes (phases 03, 06) |
| 5 | AC7 fingerprint | `check` passes or fails on 500,000 rows, `relallvisible` 5,666/5,666, and id 1 at xmin 875 / ctid (0,1); the `n_tup_upd/del` counters are dropped (phase 01) |
| 6 | TypeORM version | Asked as Q1. Default: the drill targets the API shared by 0.3.31 and 1.1.2 (checked on unpkg 2026-10-24), is labelled for both, notes the one known difference, and is re-checked in phase 06 |
| 7 | `pg_walinspect` range | Lab 02 captures `pg_current_wal_lsn()` before BEGIN and after COMMIT, reads `pg_get_wal_records_info(start, end)` filtered by the lab's xid, and prints record types and `@+offset` only (phase 04) |
| 8 | Homework D is lesson-14 scope | `#bai-tap-d` sits after `#phong-van`, is labelled "Tùy chọn · cầu nối Bài 14" and is outside the 80′ budget. `homework:solution` still measures it (phases 04, 06) |
| 9 | Markdown location | Constraint above; the final gate searches for new `*.md` files outside `plans/` (phase 09) |
| 10 | Database-level search_path | Kit `connect()` and `PSQL_PREAMBLE` both run `SET search_path = lab12_transaction`. The guide explains why and says to re-run it after psql reconnects. `check` asserts that no lesson-12 names exist in `lab03_indexing` (phases 01, 03, 06) |

The contract decisions all stand unchanged:
- roadmap order C2 (Day 02 mechanism first, Day 03 isolation);
- 8 stages and labs 01–08;
- runner A1 with manual A2 replay;
- dataset B2 (copy of ids 1–100,000);
- own kit D2 plus `scenarios.mjs`;
- 5 widgets, homework A–D and the 6-bug NestJS drill;
- the verdict-chip table and the lesson-14 bridge.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Tests and invariants first](./phase-01-tests-and-invariants-first.md) | 3h | — | Every test exists and fails for the stated reason; `check` fails only on the missing schema |
| 02 | [Dataset setup](./phase-02-dataset-setup.md) | 1h | 01 | setup → again → `--force` → reset → setup cycle passes; `check` passes |
| 03 | [Kit, runner, scenarios (frozen)](./phase-03-kit-runner-scenarios.md) | 3h | 02 | `kit-selftest` passes; the scenario matrix matches the probe; `delegate-brief.md` is frozen |
| 04 | [Labs and homework, 3 parallel delegates](./phase-04-labs-and-homework.md) | 4h | 03 | Each file ≤ 200 lines; dev runs twice with an empty masked diff; `check` passes |
| 05 | [Serial recorded runs and negative tests](./phase-05-recorded-runs-and-negative-tests.md) | 2.5h | 04 | `check-runs` passes; N1–N8 pass |
| 06 | [Teacher guide HTML](./phase-06-teacher-guide-html.md) | 8h | 05, Q1 or default | `verify-guide`, the harness and render-check pass |
| 07 | [Ultra code review, fix, re-run](./phase-07-ultra-code-review.md) | 3h | 06 | No open Critical or Important finding; affected labs re-recorded; all gates pass again |
| 08 | [Coverage decision and docs route](./phase-08-coverage-and-docs.md) | 1h | 07 | Coverage checklist complete; README route added |
| 09 | [Final verification gate](./phase-09-final-verification-gate.md) | 1h | 08 | Every phase-09 command passes; `git status` equals the baseline plus the expected paths |

## Expected-verdict matrix

Phase 01 encodes this matrix in `PLAN/verify/expected-verdicts.mjs`, before any lab exists.
- **Marks:** ✔ means the measurement is expected to match the claim. ◆ is a neutral `KẾT LUẬN` line, used where PG behaviour on this machine decides and the guide follows the result.
- **Basis:** (P) is the controller probe of 2026-10-24; unmarked claims rest on the PG 16 docs.

| Lab | Claims | Marks |
|---|---|---|
| 01 atomicity (one session) | 01.1 an error gives 22012, then 25P02 (P) · 01.2 COMMIT after an error replies ROLLBACK and the earlier INSERT is gone · 01.3 ROLLBACK TO SAVEPOINT keeps earlier rows · 01.4 a rolled-back CREATE TABLE leaves nothing · 01.5 `nextval` is not rolled back (gap) | all ✔ |
| 02 WAL records (one session) | 02.1 for the lab's xid, Heap and Btree records come before Transaction COMMIT · 02.2 right after COMMIT, flush LSN ≥ the COMMIT record's end LSN · 02.3 a rolled-back xid has change records, then ABORT, and no undo record | all ✔ |
| 03 MVCC (runner, M1) | 03.1 B's UPDATE is not blocked by reader A (P) · 03.2 an RC re-read sees B's version · 03.3 an RR re-read sees the old version with xmax = B's xid (P) · 03.4 pageinspect shows both versions on page 0 · 03.5 a reader is not blocked by B's row lock · 03.6 A as second writer waits, blocked by B, with Lock/transactionid (P) · 03.7 after B's COMMIT, A updates 1 row | all ✔ |
| 04 dead versions and horizon (runner) | 04.1 ROLLBACK leaves N dead tuples and VACUUM removes N · 04.2 an open RR snapshot makes them "dead but not yet removable" · 04.3 after the RR COMMIT, VACUUM removes them · 04.4 does an idle read-only RC transaction hold `backend_xmin`? · 04.5 lookup pages grow from 0 to 100 to 1,000 versions · 04.6 pages return to baseline after VACUUM | ✔ ✔ ✔ ◆ ✔ ✔ |
| 05a large transaction (runner) | 05a.1 one 100,000-row UPDATE about doubles the pages, while 10 batches with VACUUM grow ≤ 20% · 05a.2 the big transaction writes 5–20× the WAL of one batch · 05a.3 a writer outside the batch waits only for the big transaction | all ✔ |
| 05b idle and abandoned (runner, M2) | 05b.1 A is idle in transaction with `backend_xid` set · 05b.2 B is blocked by A, then gets 55P03 after 3 s · 05b.3 `pg_terminate_backend(A)` gives 57P01 and B then updates without waiting · 05b.4 a 1 s idle timeout ends A2's session and frees its lock · 05b.5 which SQLSTATE the client receives | ✔ ✔ ✔ ✔ ◆ |
| 06 isolation levels and read anomalies (runner) | 06.1 SET TRANSACTION outside a block warns, and the next transaction is RC (P) · 06.2 `START TRANSACTION; SET TRANSACTION … SERIALIZABLE` gives serializable · 06.3 SET TRANSACTION after a query gives 25001 · 06.4 SET SESSION CHARACTERISTICS changes later transactions · 06.5 RU reports `read uncommitted` but no dirty read happens (P) · 06.6 non-repeatable read only at RU and RC (P) · 06.7 phantom only at RU and RC (P) | all ✔ |
| 07 lost update (runner) | 07.1 an app-side read-modify-write at RC ends at 80, not 70 (P) · 07.2 the same at RR gives 40001 concurrent update (P) · 07.3 an atomic UPDATE at RC makes B wait and ends at 70 | all ✔ |
| 08 write skew (runner, M3) | 08.1 at RR both COMMIT and 0 reps stay on duty (P) · 08.2 at SER, B's UPDATE succeeds, the second COMMIT (B's) gives 40001 read/write dependencies, and 1 rep stays on duty (P) · 08.3 a retry sees 1 and refuses · 08.4 two stores with a Seq Scan: is there a false 40001? · 08.5 forced index path: which SIRead lock types, and what outcome | ✔ ✔ ✔ ◆ ◆ |
| Homework | 6 × 4 key: dirty read never; non-repeatable read and phantom at RU and RC; app lost update `xảy ra` at RU and RC, `40001` at RR and SER; atomic update `không` at RU and RC, `40001` at RR and SER (not yet measured); write skew `xảy ra` at RU, RC and RR, `40001` at SER · HD.1 B waits · HD.2 B sees 1 and refuses · HD.3 no 40001 and 1 rep on duty | solution: 24/24 ✔, HD ✔ |

**Contradiction rule.** When a ✔ claim measures ✘:
1. Look for a bug in the lab first.
2. If the lab is right, the data stands. Update the matrix entry, and for homework cells the solution key.
3. Log the change under "Measured contradictions" below and rewrite the guide's narrative to match.

Data, scenarios and tricks are never changed to force an expectation.

### Measured contradictions
_(filled during phases 03–05)_

## Acceptance criteria

1. **Guide shell (phase 06; G1–G4):** an 8-stage rail (`chang-1` … `chang-8`), only `l12-*` storage keys, the hero "Bài 12 / 16", and the sections `phong-van`, `cheat-sheet`, `ban-do-slide`, `tham-khao` and `tiep-theo`.
2. **Rendering (phases 06, 09):** works offline except Google Fonts, in light and dark, with no horizontal scroll at 360 px and no console errors (harness and render-check).
3. **Slide map (phase 06):**
   - 26 slide chips, and every href resolves.
   - The pg mark is on exactly slides 7, 9, 10, 13–16, 20, 22 and 23, and each of those sections has a `callout pg`, a chip and a lab reference.
   - Slides 4, 5, 8, 12, 18, 19 and 21 carry `Đúng trên PG16`.
4. **Stage content (phase 06):**
   - Every stage has a goal, a `wwh` grid, a widget or verbatim lab block, and a quiz of 3–5 questions with valid answers.
   - The page has an exam of 10 questions.
   - The references cover slide 25 and the PG 16 docs. MySQL docs are labelled "không đo trên máy này".
5. **Code rules (phases 04, 09):** every npm script runs, `wc -l` ≤ 200 for every `.mjs`, and there is no literal `verdict(true|false)`.
6. **Determinism and traceability (phases 05, 06):**
   - Each lab is recorded twice, and the masked diff is empty. The masks cover ms, xid, pid and LSN-derived values.
   - Every terminal line and every `.m` number in the guide can be found in `lab-runs/`.
7. **Clean state (phases 01, 05):** `npm run check` passes after a full run and after an interrupted run (SIGINT path). The fingerprint check uses 500,000 rows, `relallvisible` 5,666/5,666, and id 1 at xmin 875 / ctid (0,1).
8. **Walkthroughs (phases 03, 06):** the walkthrough SQL equals `scenarios.mjs` (M1 = lab 03, M2 = lab 05 part b, M3 = lab 08 part a), the preamble equals `PSQL_PREAMBLE`, and fill-in cells persist.
9. **Homework (phases 04, 05):**
   - A blank predictions file lists 24 `'???'` cells and exits 1 without connecting to the DB.
   - `homework:solution` prints the measured 6×4 matrix with every cell ✔, plus the C answers and the D verdicts.
   - `homework:draft` runs safely.
   - Đạt writes 6 "vì sao" lines, not 24.
   - All outputs are stored in `lab-runs/`.
10. **NestJS drill (phase 06):** 6 bugs with folded answers, and API names checked against the pinned TypeORM version(s).
11. **Secrets and paths (phase 09):** no match for `postgres(ql)?:/{2}|PGPASS[W]ORD|POSTGRES_PASS[W]ORD` in the new files (scope in phase 09), and `git status` equals the baseline plus the expected paths.
12. **Must-fix behaviours (phases 03–06):** the second-COMMIT key, exactly two windows, the WAL range with xid filter and relative offsets, homework D after the exam, and search_path set everywhere are all visible in the deliverables.
13. **Verdict matrix (phase 05):** `check-runs` passes, meaning every expected claim is present with its expected mark or has a logged contradiction.

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| A GUI or psql transaction holds a lock or the horizon during a lab | M×H | `lock_timeout` 5 s turns a hidden wait into a reported foreign blocker. Labs with `horizon` print ⚠ lines for holders. Phase 05 has a pre-run gate, and `check` lists locks on lab12 tables |
| WAL bytes and offsets vary (other sessions, checkpoint images) | H×L | LSN-class masking. WAL verdicts use ratio bands. Record types filtered by xid stay exact |
| A session killed by the server crashes Node or hides its code | M×M | Every client has an `error` listener; claim 05b.5 is neutral and the narrative follows the result |
| The SSI false positive or the RC horizon behave differently than expected | M×L | Claims 04.4, 08.4 and 08.5 are neutral; the docs are cited if the effect does not reproduce |
| Ctrl+C on Windows reaches both npm and node | M×M | An idempotent `process.once` handler; the observer terminates the lab's own backends; server-side timeouts are the backstop (N4, N5) |
| Đạt runs the roadmap's literal UPDATE on `hw_contracts` | M×H | The guide warns at M1, walkthroughs never name `hw_contracts`, and the `check` fingerprint catches it |
| Parallel delegates disturb each other's dev runs | H×L | Disjoint scratch names; recorded runs are serial and done by the controller only |
| npm is offline, or lesson-3 data has been reset | L×H | Report BLOCKED with the reason; setup refuses and prints the lesson-3 command |
| The TypeORM version is unknown | H×M | Q1; labels for both versions; re-checked in phase 06 |
| Guide numbers drift after review fixes | M×M | G8 and G9 compare against `lab-runs/`; phase 07 step 4 re-syncs |
| Recorded output gets an encoding change or a BOM | M×M | `record.mjs` writes raw bytes |
| Chrome temp files end up outside the project, or Chrome keeps running | L×L | `TMP`, `TEMP` and `--user-data-dir` point under `PLAN/verify/tmp`; phase 09 checks processes and cleans up |

**Rollback without git:**
- Every deliverable is a new path, so a phase is reverted by deleting the files it created.
- `npm run reset` drops only `lab12_transaction`.
- The README edit is restored from the original lines quoted in phase 08.
- Lesson-3 files and data are never modified, so nothing cascades.

## Open questions for the user

1. Which TypeORM version does `quan_ly_hop_dong` use (`npm ls typeorm` on the other machine)? If there is no answer, the drill targets the API shared by 0.3.31 and 1.1.2 and is labelled for both.
2. The lesson-3 guide still says `quan_ly_hop_dong-postgres-1` and teases "Bài 4". Should it be edited? It stays untouched without a yes.
3. The roadmap's Day-02 line runs an UPDATE on `hw_contracts`. The lesson uses `lab12_transaction.contracts` instead (contract B2). Should the roadmap text change too?
4. For information, not blocking: `lab03_indexing` still holds a stray index `idx_contracts_status` on `hw_contracts`, left by lesson 3's `homework:draft` (checked today). Lesson 3's `npm run homework` refuses to run until it is dropped. Lesson 12 does not touch it. Do you want to drop it yourself?

## Delivery record
_(filled in phase 09)_

=== FILE: phase-01-tests-and-invariants-first.md ===
---
phase: 1
title: "Tests and invariants first"
status: pending
priority: P1
effort: 3h
dependencies: []
---

## Goal

Write every check before the code it checks, plus the minimal kit `connect()` and the `check` script those checks stand on. This phase ends with all tests running and failing for the stated reason.

## Files to create/modify (owner: controller)

- `D:/study/advance-be/labs/lesson-12-transaction/package.json`, `package-lock.json`
- `D:/study/advance-be/labs/lesson-12-transaction/tx-kit.mjs` (part 1)
- `D:/study/advance-be/labs/lesson-12-transaction/check-lab-state.mjs`
- `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/` containing:
  - `git-status-baseline.txt`, `record.mjs`, `mask-diff.mjs`
  - `expected-verdicts.mjs`, `check-runs.mjs`
  - `kit-selftest.mjs`, `negative-tests.mjs`
  - `fixtures/predictions-invalid.mjs`, `fixtures/predictions-one-row.mjs`
  - `verify-guide.mjs`, `harness.html`

## Tasks and steps

1. Save the git baseline: `git status --porcelain > PLAN/verify/git-status-baseline.txt`.
2. Create `package.json`:
   - `"type": "module"`, `"private": true` and `"pg": "^8.23.1"` (lesson 3's lockfile has 8.23.1).
   - Scripts:
     - `setup` = `node 00-setup-dataset.mjs`, `check` = `node check-lab-state.mjs`, `reset` = `node check-lab-state.mjs --reset`;
     - `lab1` = `01-atomicity-pg-rules.mjs`, `lab2` = `02-wal-records.mjs`, `lab3` = `03-mvcc-two-sessions.mjs`, `lab4` = `04-dead-versions-horizon.mjs`;
     - `lab5a` = `05-big-and-idle-tx-part-a.mjs`, `lab5b` = `05-big-and-idle-tx-part-b.mjs`, `lab5` = both joined with `&&`;
     - `lab6` = `06-levels-read-anomalies.mjs`, `lab7` = `07-lost-update.mjs`, `lab8` = `08-write-skew-part-a.mjs && … part-b`;
     - `homework` = `node homework-runner.mjs homework-predictions.mine.mjs`, `homework:draft` = `node homework-ai-draft.mjs`, `homework:solution` = runner with `homework-predictions.solution.mjs`.
   - Run `npm install`. It needs the network or the npm cache. If neither works, stop as BLOCKED and never copy `node_modules`.
3. Write `kit-selftest` cases K1 and K2 first; they fail. Then write `tx-kit.mjs` part 1:
   - **`connect(name)`:**
     - Reads `PG_URL`. If it is missing, print a Vietnamese hint linking lesson 3 §6.3 and exit 1.
     - Build `new pg.Client({ connectionString, application_name: 'lesson-12-' + name })` inside try. On failure, print only `err.code`.
     - Register an `error` listener that stores the error on the session, so Node never crashes, and a `notice` listener that collects notices.
     - Run one query: `SET search_path = lab12_transaction; SET lock_timeout = '5s'; SET statement_timeout = '30s'; SET idle_in_transaction_session_timeout = '60s'`.
     - `pid = client.processID`.
     - Return `{ label, pid, client, notices, errors, run(sql, params) }`. `run` never throws and returns `{ ok, rows, command, rowCount, code, message, ms }`.
   - **Print helpers:**
     - Copied from lesson-3 `pg-explain-kit.mjs`, with Vietnamese comments: `heading`, `verdict(ok, text)`, `printTable`, `fmtInt`, `fmtMs`, `fmtBytes`.
     - New: `conclude(text)` prints `   => KẾT LUẬN …`; `warn(text)` prints `⚠ …`; `fmtXid` → `xid 935`, `fmtPid` → `pid 4120`, `fmtWal` → `WAL 347 KB`, `fmtOffset` → `@+128`.
     - Every duration prints as `N ms`.
4. Write `check-lab-state.mjs`. It uses `connect('check')`, prints ✔ or ✘ on every line, and exits 1 on any ✘. It checks:
   - **Schema present:** if `lab12_transaction` is missing, print `✘ Chưa có lab12_transaction — chạy: npm run setup`.
   - **Expected objects only:** relations of kind r, i and S are exactly {contracts, contracts_pkey, store_reps, store_reps_pkey}, and the only extension in the schema is {pg_walinspect}. Any extra is listed with "chạy lại lab đó hoặc npm run reset".
   - **No leftover sessions or locks:** no other session with `application_name LIKE 'lesson-12%'`, and no `pg_locks` row on a `lab12_transaction` relation from another pid (prints the pid and application name).
   - **Lesson-3 fingerprint:** `count(*) = 500000`, `relpages = relallvisible = 5666`, and id 1 at `xmin = 875`, `ctid = (0,1)`.
   - **Nothing leaked into lesson 3:** no relation in `lab03_indexing` matches `^(l\d\d[a-z]?_|lhw_|contracts$|store_reps$)`. The existing `idx_contracts_status` does not match.
   - **`--reset`:** runs `DROP SCHEMA IF EXISTS lab12_transaction CASCADE` and nothing else.
5. Write the verify tools. They are controller-only and get `pg` through `createRequire('LAB/package.json')`. They build every client inside try and never print the environment.
   - **`record.mjs <name> [--run2] -- <cmd…>`:**
     - Runs the command with cwd `LAB` through a shell.
     - Writes stdout and stderr bytes in arrival order to `PLAN/lab-runs/<name>` (or `run2/<name>`) and adds `[exit N]` when N ≠ 0.
     - Writes run 1's runtime to `runtimes.json`.
   - **`mask-diff.mjs a b` and `--self-test`:**
     - Masks `N ms`; `xmin|xmax|xid|t_xmin|t_xmax|backend_xid|backend_xmin N` when N ≠ 0; `pid N`; `X/Y` LSNs; `@+N`; `WAL N unit`; and `│` table cells under headers matching `xmin|xmax|xid|pid|lsn|wal|ms`.
     - WAL bytes count as LSN-derived, because they are `pg_wal_lsn_diff` of two LSNs and include other sessions' records and checkpoint images. Record types, counts, ctids, SQLSTATEs and states stay unmasked.
     - The self-test asserts that `xmax 0` versus `xmax 936` still differ.
   - **`expected-verdicts.mjs`:** the plan.md matrix per lab file (`id → '✔' | '◆'`), the 24-cell homework key and the HD ids.
   - **`check-runs.mjs [--file f --lab id]`:**
     - For each lab: run 1 and run 2 exist, and their masked diff is empty.
     - Lines matching `=> ✔|✘|KẾT LUẬN [id]` match the matrix: no missing ids, no extra ids, no ✘ on a ✔ claim.
     - `hw-mine.txt` lists 24 cells and ends with `[exit 1]`.
     - `hw-solution.txt` has 24 ✔ cells under "Ma trận 6 × 4" and HD.1–3 marked ✔.
     - Every line of `check*.txt` is ✔.
   - **`kit-selftest.mjs [--matrix]`:** uses `lselftest_*` scratch tables, dropped in finally.
     - **K1:** the search_path, the three timeouts and the application name are set, and `processID = pg_backend_pid()`.
     - **K2:** terminating the session from another connection records 57P01 without a crash.
     - **K3:** a declared wait is confirmed (`waited`, `blockedBy = ['A']`, `waitEvent = 'Lock/transactionid'`) and settles after the step that releases it.
     - **K4:** an undeclared wait on a lock held by a raw client named `selftest-foreign` ends with 55P03 within 5 s, the blocker is reported as foreign, and the foreign flag is set.
     - **K5:** a declared wait that never blocks reports `waited = false`.
     - **K6:** two runs of K3 are equal after masking.
     - **K7:** `--json` output parses.
     - **`--matrix`:** runs ANOMALIES × LEVELS and prints the judged 6×4 matrix.
   - **`negative-tests.mjs` (N1–N8):** it spawns `process.execPath` directly (not through a shell), so a kill reaches node.
     - **N1:** blank predictions with `PG_URL` removed exit 1, print 24 `'???'` lines, and no `lesson-12-hw%` session appears.
     - **N2:** `fixtures/predictions-invalid.mjs` (one cell `'co'`) exits 1 and lists that cell with the allowed values.
     - **N3:** `fixtures/predictions-one-row.mjs` (the dirty-read row filled) measures 4 cells, refuses 20, exits 1, and `check` then exits 0.
     - **N4:** `L12_SIGINT_AFTER=15` on lab 03 (A waiting on B) exits 130, prints the cleanup line, and `check` then exits 0.
     - **N5:** a hard `child.kill()` while A waits leaves no `lesson-12-lab03%` session within 8 s. `check` exits 1 naming `l03_contracts`; after `npm run lab3`, `check` exits 0.
     - **N6:** while a blank-name raw client holds `BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT 1`, `npm run lab4` prints the ⚠ holder line. After that client closes, lab 04 matches `lab04.txt` after masking.
     - **N7:** a raw client named `lesson-12-test-linger` makes `check` exit 1 and name it.
     - **N8:** after `CREATE TABLE lab12_transaction.l99_stray (x int)`, `check` exits 1 and names it; the table is then dropped.
   - **`verify-guide.mjs` (static checks):**
     - **G1:** the file exists and has the ids `cach-hoc`, `chang-1…8`, `bai-tap`, `s8-drill`, `phong-van`, `bai-tap-d`, `cheat-sheet`, `ban-do-slide`, `tham-khao` and `tiep-theo`, plus 8 rail checkboxes.
     - **G2:** every storage key starts with `l12-`, and there is no `l3-`.
     - **G3:** the hero says "Bài 12 / 16".
     - **G4:** `src` and `<link href>` point only to Google Fonts.
     - **G5:** `SLIDES` has 26 chips in order, the pg set is {7,9,10,13,14,15,16,20,22,23}, and every href exists.
     - **G6:** each pg slide's section holds `callout pg`, a `vchip`, and "Lab 0" or "npm run lab". Slides 4, 5, 8, 12, 18, 19 and 21 hold `vchip ok`.
     - **G7:** every `code[data-scn][data-step]` equals its step in `scenarios.mjs` (M1, M2, M3-RR, M3-SER, M3-RESET, HW_D, PRE), and no step is missing.
     - **G8:** every line of each `.code.terminal[data-run]` block appears, in order, in its `lab-runs` file (tags stripped, `<span class="c">` notes removed). Each `script[type="application/json"][data-run]` equals its file.
     - **G9:** each `.m` value, with digits normalised, occurs somewhere in `lab-runs/`.
     - **G10:** `QUIZ` has keys 1–8 with 3–5 items each and every `a` in range; `EXAM` has 10 items.
     - **G11:** every stage `h3` has a `slide-ref`, and every stage has `.goal`, `.wwh`, a widget or terminal block, and `data-quiz`.
     - **G12:** `#s8-drill` has 6 folded answers and a `data-typeorm` attribute.
     - **G13:** `#bai-tap-d` comes after `#phong-van` and says "Tùy chọn".
     - **G14:** every referenced slide image exists.
     - **G15:** the secrets regex and the old container name are absent.
     - **G16:** prints prose words per `h3` (warn above 150, fail above 200) and the sum of stage minutes.
   - **`harness.html`:** the lesson-3 harness adapted to this guide, with views at 360 light, 400 dark and 1280 light. It clicks the first option of each quiz and every widget control.
     - **H1:** no overflow. **H2:** no errors.
     - **H3:** after a click, each `.q` has exactly one `.right`.
     - **H4:** 26 chips, and no broken `#` href.
     - **H5:** a walkthrough cell keeps its value after the iframe reloads.
     - **H6:** every localStorage key written starts with `l12-`.
     - **H7:** no external `src`. **H8:** slide images load.
6. Run everything and note each failing result in the delivery record.

## Test matrix (test first)

| Test | Expected now | Passes in | Command |
|---|---|---|---|
| `npm run check` | exit 1 "Chưa có lab12_transaction"; fingerprint and sessions ✔ | 02 | `cd D:/study/advance-be/labs/lesson-12-transaction && npm run check` |
| mask-diff self-test | passes (pure fixtures) | 01 | `node PLAN/verify/mask-diff.mjs --self-test` |
| kit-selftest | K1–K2 pass after step 3; K3–K7 fail with "Cannot find module tx-runner.mjs" | 03 | `node PLAN/verify/kit-selftest.mjs` |
| check-runs | exit 1 "thiếu lab-runs/lab01.txt" | 05 | `node PLAN/verify/check-runs.mjs` |
| negative-tests | N1–N3 fail (no runner), N4–N8 fail (no labs) | 05 | `node PLAN/verify/negative-tests.mjs` |
| verify-guide | exit 1 "không thấy file guide" | 06 | `node PLAN/verify/verify-guide.mjs` |
| `npm run lab1` | "Cannot find module" | 04 | `npm run lab1` |

## Verification

- `cd D:/study/advance-be/labs/lesson-12-transaction && npm run check; echo "exit $?"`: exit 1, and only the schema line shows ✘.
- `wc -l D:/study/advance-be/labs/lesson-12-transaction/*.mjs PLAN/verify/*.mjs`: every file ≤ 200.
- `docker exec quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab -Atc "SELECT xmin, ctid FROM lab03_indexing.hw_contracts WHERE id = 1"`: `875|(0,1)`.

## Risks and rollback

- If npm is offline, report BLOCKED and ask the user.
- A wrong expectation can be fixed in this phase while no lab exists yet. After that, it changes only through the contradiction rule.
- Rollback: delete `LAB/` and the new `PLAN/verify/*` files. The DB is untouched, because `check` only reads.

=== FILE: phase-02-dataset-setup.md ===
---
phase: 2
title: "Dataset setup"
status: pending
priority: P1
effort: 1h
dependencies: [1]
---

## Goal

`npm run setup` builds the lesson-12 dataset idempotently, without writing to lesson 3, and `check` passes afterwards.

## Files to create/modify (owner: controller)

- `D:/study/advance-be/labs/lesson-12-transaction/00-setup-dataset.mjs`
- `D:/study/advance-be/labs/lesson-12-transaction/scenarios.mjs` (part 1)
- `PLAN/lab-runs/`: `setup.txt`, `setup-again.txt`, `setup-force.txt`, `check.txt`, `psql-prompt.txt`

## Tasks and steps

1. Write `scenarios.mjs` part 1:
   - **`REPS_SQL(t)`:** drops and recreates `lab12_transaction.${t}` (store_id int, rep_id int, name text, on_duty boolean, PK (store_id, rep_id), `autovacuum_enabled = off`). It inserts (44,1,'An'), (44,2,'Binh'), (45,1,'Chi') and (45,2,'Dung'), all on duty.
   - **`ACC_SQL(t)`:** creates `(id int PRIMARY KEY, balance int NOT NULL)` with rows (1,100) and (2,100).
2. Write `00-setup-dataset.mjs` using `connect('setup')`:
   - **Guard:** if `lab03_indexing.hw_contracts` is missing or does not have 500,000 rows, exit 1 and print "chạy npm run homework:setup trong labs/lesson-03-index".
   - **Idempotence:** run `CREATE SCHEMA IF NOT EXISTS lab12_transaction`. If `contracts` already has 100,000 rows, `store_reps` has 4 and `pg_walinspect` exists, and there is no `--force`, print "đã có sẵn".
   - **Build:**
     - `CREATE TABLE lab12_transaction.contracts AS SELECT * FROM lab03_indexing.hw_contracts WHERE id <= 100000 ORDER BY id`, then add the PK.
     - `REPS_SQL('store_reps')`.
     - `CREATE EXTENSION IF NOT EXISTS pg_walinspect SCHEMA lab12_transaction`.
     - `VACUUM (ANALYZE)` on both tables.
   - **Dataset card (always printed; homework A copies it):**
     - row and page counts, size, contracts in stores 44 and 45, status mix, the id 1 row (code, store, total), the on-duty count;
     - the server version and the settings `default_transaction_isolation`, `synchronous_commit`, `deadlock_timeout`, `max_pred_locks_per_page`, `idle_in_transaction_session_timeout`, `lock_timeout` and `statement_timeout`;
     - the lab03 fingerprint, and whether `pageinspect` exists in `lab03_indexing`.
3. Record the prompt format for widget W1: `docker exec quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab -c '\echo :PROMPT1'` goes into `psql-prompt.txt`. If `-c` does not interpolate the variable, pipe the command through stdin instead.

## Test matrix (test first)

| Test | Expected | Command |
|---|---|---|
| check before | exit 1, schema missing | `npm run check` |
| setup | exit 0; card shows 100,000 rows, 4 reps, extension present | `node PLAN/verify/record.mjs setup.txt -- npm run --silent setup` |
| check after | exit 0, all ✔ | `node PLAN/verify/record.mjs check.txt -- npm run --silent check` |
| idempotent | "đã có sẵn"; card lines masked-equal to `setup.txt` | `record.mjs setup-again.txt -- npm run --silent setup`, then mask-diff |
| force | rebuilt; card masked-equal; fingerprint unchanged | `record.mjs setup-force.txt -- npm run --silent setup -- --force` |
| reset cycle | reset exit 0 → check exit 1 → setup → check exit 0 | `npm run reset; npm run check; npm run setup; npm run check` |
| lesson 3 untouched | `500000`, `5666\|5666`, `875\|(0,1)` | `docker exec quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab -Atc "<three fingerprint SELECTs>"` |

The guard path (source missing) cannot be exercised without changing lesson 3, so code review covers it.

## Verification

- `cd D:/study/advance-be/labs/lesson-12-transaction && npm run check`: exit 0.
- `docker exec quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab -Atc "SELECT count(*), (SELECT count(*) FROM lab12_transaction.store_reps WHERE on_duty) FROM lab12_transaction.contracts"`: `100000|4`.

## Risks and rollback

- If Đạt later resets lesson 3, setup refuses and prints the command to rebuild it.
- Rollback: `npm run reset` drops only `lab12_transaction`, including `pg_walinspect`.

=== FILE: phase-03-kit-runner-scenarios.md ===
---
phase: 3
title: "Kit, runner and scenarios (frozen interface)"
status: pending
priority: P1
effort: 3h
dependencies: [2]
---

## Goal

Finish the kit, the runner (about 120 lines) and `scenarios.mjs`. Prove them with `kit-selftest`, reproduce the probe matrix, then freeze the interface in `delegate-brief.md` before any delegate starts.

## Files to create/modify (owner: controller)

- `D:/study/advance-be/labs/lesson-12-transaction/tx-kit.mjs` (part 2), `tx-runner.mjs`, `scenarios.mjs` (part 2)
- `PLAN/delegate-brief.md`, `PLAN/verify/scenario-matrix.txt`

## Frozen interface

```js
// tx-kit.mjs
connect(name) → Session                       // phase 01
lab({ id, title, scratch, horizon }, body)    // prints title; obs = connect(`lab${id}-obs`); drops scratch tables;
                                              // horizon → warn() per foreign holder; once('SIGINT') cleanup → exit 130;
                                              // body({ obs, open }); finally: obs terminates own pending backends,
                                              // sessions end, scratch dropped, obs ends; errors print code+message, exit 1
open(label) → Session                         // connect(`lab${id}-${label}`), registered for cleanup
foreignHolders(obs, ownPids) → rows           // other advance_be_lab sessions with backend_xmin or backend_xid
emit(key, value)                              // collected; one JSON object printed at the end when --json
// tx-runner.mjs
runSteps(steps, sessions, obs, { title }) → StepResult[]
  step = [who, sql] | [who, sql, 'chờ']       // 'chờ' = declared wait: continue once the observer confirms it
  StepResult = Result & { n, who, sql, waited, blockedBy, waitEvent, settledAfter, foreign }
// scenarios.mjs
LEVELS, SHORT, PSQL_PREAMBLE, OBSERVER_SQL, ACC_SQL(t), REPS_SQL(t)
M1(t = 'contracts'), M2(t = 'contracts'), M3(level, t = 'store_reps'), M3_RESET(t), HW_D(t = 'store_reps')
ANOMALIES = { dirtyRead, nonRepeatable, phantom, lostUpdateApp, atomicUpdate, writeSkew }
  // each { title, table: 'acc' | 'reps', steps(level, t), judge(timeline) → 'xảy ra' | 'không' | '40001' }
```

**Runner rules:**
1. Each step goes only to its own session. The runner never injects SQL, because that would move an RR snapshot.
2. The observer polls every 20 ms with `SELECT pg_blocking_pids($1), wait_event_type, wait_event FROM pg_stat_activity WHERE pid = $1`.
3. An undeclared step is awaited until it finishes; its blockers are still recorded.
4. A declared `'chờ'` step lets the runner continue as soon as the blocker list is non-empty.
5. After every step, each pending step is polled until it settles or is confirmed still blocked, then printed in session order. This keeps the output deterministic.
6. A blocker outside the lab's sessions is labelled `ngoài (<application_name>)`. The lab then exits 1 with "đóng transaction đang mở ở GUI/psql rồi chạy lại".
7. Output columns are `# | Phiên | Lệnh | Kết quả`. A result reads `OK (n dòng)`, the first row as `col value` (xids via `fmtXid`), `LỖI <code> <message>` or `CHỜ (bị B chặn)`. A settle line reads `↳ #n tiếp tục → …`.
8. `L12_SIGINT_AFTER=n` emits SIGINT after step n. This one-line test hook carries a Vietnamese comment.
9. `--json` pushes `{ title, steps }` to the collector.
10. Sleeps happen only between observer polls; no step ever starts after a delay.

## Scenarios

Shorthands: `C` = `SELECT count(*) FROM ${t} WHERE store_id = 44 AND on_duty;` and `Q` = `SELECT xmin, xmax, ctid, total FROM ${t} WHERE id = 1;`.

- **`PSQL_PREAMBLE`:** `SET search_path = lab12_transaction;` · `SET idle_in_transaction_session_timeout = '10min';` · `SELECT pg_backend_pid();`. Manual windows get no `lock_timeout`: a person releases the wait, and Ctrl+C cancels it in psql.
- **`OBSERVER_SQL`:** `SELECT pid, state, pg_blocking_pids(pid) FROM pg_stat_activity;` (the contract's text).
- **`M1` (16 steps, two windows only; must-fix 4).** Window A plays the second writer after its own COMMIT.

  | Step | Window | SQL |
  |---|---|---|
  | 1 | A | `BEGIN;` |
  | 2 | A | Q |
  | 3 | B | `UPDATE ${t} SET total = total + 1 WHERE id = 1 RETURNING xmin, ctid;` |
  | 4 | A | Q |
  | 5 | A | `COMMIT;` |
  | 6 | A | `BEGIN ISOLATION LEVEL REPEATABLE READ;` |
  | 7 | A | Q |
  | 8 | B | the same UPDATE as step 3 |
  | 9 | A | Q |
  | 10 | A | `COMMIT;` |
  | 11 | A | Q |
  | 12 | B | `BEGIN;` |
  | 13 | B | `UPDATE ${t} SET total = total + 1 WHERE id = 1;` |
  | 14 | A | Q |
  | 15 | A | the same UPDATE as step 13, marked `'chờ'` |
  | 16 | B | `COMMIT;` |

- **`M2` (4 steps):** A `BEGIN;` · A UPDATE id 1 · B `SET lock_timeout = '3s';` · B UPDATE id 1. The last step is awaited and ends with 55P03.
- **`M3(level)` (9 steps; order fixed by must-fix 2, so the 40001 lands on step 8, the second COMMIT):**

  | Step | Session | SQL |
  |---|---|---|
  | 1 | A | `BEGIN ISOLATION LEVEL ${level};` |
  | 2 | A | C |
  | 3 | B | `BEGIN ISOLATION LEVEL ${level};` |
  | 4 | B | C |
  | 5 | A | `UPDATE ${t} SET on_duty = false WHERE store_id = 44 AND rep_id = 1;` |
  | 6 | B | the same with `rep_id = 2` |
  | 7 | A | `COMMIT;` |
  | 8 | B | `COMMIT;` |
  | 9 | A | C |

- **`M3_RESET`:** A `UPDATE ${t} SET on_duty = true;`.
- **`HW_D` (8 steps):** A `BEGIN;` · A `SELECT rep_id FROM ${t} WHERE store_id = 44 AND on_duty FOR UPDATE;` · B `BEGIN;` · B the same SELECT, marked `'chờ'` · A takes rep 1 off duty · A `COMMIT;` · B `ROLLBACK;` · A C.
- **`ANOMALIES`.** All use `BEGIN ISOLATION LEVEL ${level};` where a level applies, on the `acc` table unless noted.

  | Scenario | Steps | Judge |
  |---|---|---|
  | dirtyRead | A BEGIN · A `UPDATE … SET balance = 0 WHERE id = 1` · B BEGIN at the level · B reads · A ROLLBACK · B COMMIT | `xảy ra` if B read 0 |
  | nonRepeatable | B BEGIN · B reads · A sets `balance = 50` · B reads · B COMMIT | `xảy ra` if the two reads differ |
  | phantom | B BEGIN · B `count(*) … WHERE balance >= 0` · A `INSERT … VALUES (3, 100)` · B counts · B COMMIT | `xảy ra` if the counts differ |
  | lostUpdateApp | A and B BEGIN · A reads · B reads · A sets `balance = 90` · A COMMIT · B sets `balance = 80` · B COMMIT · A reads | any 40001 → `40001`; final 70 → `không`; otherwise `xảy ra` |
  | atomicUpdate | A and B BEGIN · A `balance = balance - 10` · B `balance = balance - 20`, marked `'chờ'` · A COMMIT · B COMMIT · A reads | same as lostUpdateApp |
  | writeSkew | `M3(level)` on the `reps` table | any 40001 → `40001`; count 0 → `xảy ra`; otherwise `không` |

`scenarios.mjs` stays at 200 lines or fewer. If that becomes impossible, move ANOMALIES into `scenarios-part-b.mjs` and re-export it from `scenarios.mjs`, so imports do not change.

## Tasks and steps

1. Add a `kit-selftest` case for any rule above that has none, and run it; it fails.
2. Write kit part 2, the runner and scenarios part 2 until K1–K7 pass.
3. Run `node PLAN/verify/kit-selftest.mjs --matrix > PLAN/verify/scenario-matrix.txt` and compare it with the probe. The atomic update is measured here for the first time. Any mismatch goes through the contradiction rule before the freeze.
4. Write `delegate-brief.md`:
   - the environment by reference (lesson-3 brief with the new container name);
   - the interface above and the phase-04 lab rules;
   - file ownership and the final message format.
   From then on, only the controller changes the kit, the runner, the scenarios and `package.json`.

## Test matrix (test first)

| Test | Expected | Command |
|---|---|---|
| K1–K7 | all pass | `node PLAN/verify/kit-selftest.mjs` |
| probe parity | RU = RC; non-repeatable read and phantom at RC only; lost update 80 at RC and 40001 at RR/SER; write skew blocked only at SER, on step 8 | `node PLAN/verify/kit-selftest.mjs --matrix` |
| size | runner ≤ 140 lines (target 120); kit and scenarios ≤ 200 | `wc -l LAB/tx-*.mjs LAB/scenarios.mjs` |
| no injection | `client.query` appears only in observer polls and in `run(step sql)` | `grep -n "query(" LAB/tx-runner.mjs` |
| clean state | exit 0 | `npm run check` |

## Verification

`node PLAN/verify/kit-selftest.mjs && cd D:/study/advance-be/labs/lesson-12-transaction && npm run check`

## Risks and rollback

- If the runner grows past budget, move formatting into the kit's print helpers.
- A `'chờ'` step that does not wait at some level is reported, never hidden.
- Rollback: restore the part-1 state of the three files. The `lselftest_*` tables are dropped in finally.

=== FILE: phase-04-labs-and-homework.md ===
---
phase: 4
title: "Labs and homework (three parallel delegates)"
status: pending
priority: P1
effort: 4h
dependencies: [3]
---

## Goal

Write labs 01–08 and the homework kit against the frozen interface. Each file stays at 200 lines or fewer, is dev-run twice with an empty masked diff, and leaves `check` passing.

## Files to create/modify (all in `D:/study/advance-be/labs/lesson-12-transaction/`; ownership is disjoint)

| Owner | Files |
|---|---|
| Delegate D1 | `01-atomicity-pg-rules.mjs`, `02-wal-records.mjs`, `06-levels-read-anomalies.mjs`, `07-lost-update.mjs`, `08-write-skew-part-a.mjs`, `08-write-skew-part-b.mjs` |
| Delegate D2 | `03-mvcc-two-sessions.mjs`, `04-dead-versions-horizon.mjs`, `05-big-and-idle-tx-part-a.mjs`, `05-big-and-idle-tx-part-b.mjs` |
| Delegate D3 | `homework-runner.mjs`, `homework-predictions.mine.mjs`, `homework-predictions.solution.mjs`, `homework-ai-draft.mjs` |
| Controller | everything else. Dev outputs go only to `PLAN/verify/tmp/dev/<d1\|d2\|d3>/` |

Launch the three delegates in one message. Each gets `delegate-brief.md`, the plan path, its file list, these specs and the reports path `PLAN/reports/`. No `--yagni` flag applies: deliver the full scope.

## Lab rules (copied into the brief)

- **Output shape:**
  - A header line `Lab 12.NN — <claim> (slide X–Y)`, then `heading()` sections, with about 15 table rows or fewer.
  - Verdicts as `verdict(ok, '[NN.k] …')` with `ok` computed from the measurement. Neutral claims use `conclude('[NN.k] …')`.
- **Volatile values:** printed only through `fmtMs`, `fmtXid`, `fmtPid`, `fmtWal` or `fmtOffset`, or in table columns named `xmin`, `xmax`, `xid`, `pid`, `LSN`, `WAL` or `ms`.
- **Scratch tables:**
  - Named `lab12_transaction.lNN_*`, created schema-qualified with `autovacuum_enabled = off`, and listed in `lab({ scratch })`.
  - Any column Đạt may edit by hand is replaced by a constant in the copy (`1000.00::numeric(12,2) AS total`).
- **Exit codes:** 0 on a ✘ (a finding is not a crash); 1 on errors.
- **Size:** past 200 lines, split into `-part-a` and `-part-b` behind the same npm script (the controller edits `package.json`).
- **Do not:** create Markdown files; edit the kit, runner, scenarios or `package.json` (send NEEDS_CONTEXT instead); write to lesson-3 objects (pageinspect reads are allowed in lab 03 only).

## Lab specs

| Lab | Scratch | Steps | Claims |
|---|---|---|---|
| 01 | `l01_items (id int PK)`, `l01_seq` | Session A alone:<br>(a) BEGIN · INSERT 1 · `SELECT 1/0` · `SELECT 1` · COMMIT (read the command tag) · count;<br>(b) BEGIN · INSERT 1 · SAVEPOINT s · INSERT 1 again (23505) · ROLLBACK TO s · INSERT 2 · COMMIT;<br>(c) BEGIN · `CREATE TABLE lab12_transaction.l01_ddl` · ROLLBACK · `to_regclass`;<br>(d) nextval · BEGIN · nextval ×2 · ROLLBACK · nextval | 01.1–01.5 |
| 02 | `l02_wal (id int PK, v int)`, 1 row | Session A alone:<br>(a) `pg_current_wal_lsn()` · BEGIN · `pg_current_xact_id()::xid` · INSERT row 2 · COMMIT · `pg_current_wal_flush_lsn()` and `pg_current_wal_lsn()`;<br>(b) `pg_get_wal_records_info(start, end) WHERE xid = $1::xid` prints `resource_manager/record_type` and `@+offset`;<br>(c) the same with ROLLBACK;<br>(d) COMMIT time with `SET LOCAL synchronous_commit` on and off, in ms only and with no verdict | 02.1–02.3 |
| 03 | `l03_contracts`: ids 1–20 of `contracts`, total 1000.00, PK | `runSteps(M1('l03_contracts'))`.<br>After step 9, obs prints `lp, t_xmin, t_xmax, t_ctid` on page 0 for lp 1 and lp > 20, via `lab03_indexing.heap_page_items(lab03_indexing.get_raw_page('lab12_transaction.l03_contracts', 0))`. If pageinspect is missing, print ⚠ and skip.<br>`--json` | 03.1–03.7 |
| 04 | `l04_contracts` (ids 1–10,000), `l04_hot` (ids 1–1,000) | `horizon: true`:<br>(a) A BEGIN · UPDATE all · `pg_current_xact_id()` · ROLLBACK (ms); obs reads `pg_xact_status` and the VACUUM (VERBOSE) counts parsed from notices;<br>(b) B `BEGIN ISOLATION LEVEL REPEATABLE READ` · count · A updates ids ≤ 1,000 · VACUUM (not removable) · B COMMIT · VACUUM (removed);<br>(c) B `BEGIN; SELECT 1` at RC; obs asks whether `backend_xmin IS NULL`; COMMIT;<br>(d) B holds an RR snapshot while A updates `l04_hot` id 1 100 times, then 900 more (autocommit). Obs reads pages for `WHERE id = 1` from `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` at 0, 100 and 1,000 versions, then B COMMIT, VACUUM, pages again | 04.1–04.6 |
| 05a | `l05_big`: all 100,000 rows, total 1000.00, fillfactor 100 | `horizon: true`:<br>(a) obs LSN · A BEGIN · UPDATE all · B UPDATE id 100,000 marked `'chờ'` · A COMMIT · obs LSN and pages;<br>(b) rebuild, then 10 batches of 10,000. Obs records the LSN around batch 1, and during batch 1 B updates id 100,000 (not declared). COMMIT and VACUUM after each batch, then pages | 05a.1–05a.3 |
| 05b | `l05_idle`: ids 1–20 | (a) `runSteps(M2('l05_idle'))`; after step 2, obs takes a snapshot (state, `backend_xid` set, `wait_event`, transaction age in ms);<br>(b) obs runs `pg_terminate_backend(A.pid)`; B repeats the step-4 SQL without waiting;<br>(c) A2 runs `SET idle_in_transaction_session_timeout = '1s'` · BEGIN · UPDATE id 2. Obs polls until A2's pid is gone (≤ 5 s), confirms no lock is left, and prints A2's recorded error code;<br>(d) `--json` board rows | 05b.1–05b.5 |
| 06 | `l06_acc`, rebuilt per case | (a) A alone: SET TRANSACTION outside a block (WARNING read from notices) · BEGIN · SHOW · COMMIT;<br>(b) `START TRANSACTION; SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; SHOW transaction_isolation; COMMIT;`;<br>(c) BEGIN · SELECT 1 · SET TRANSACTION (25001) · ROLLBACK;<br>(d) SET SESSION CHARACTERISTICS to RR · BEGIN · SHOW · COMMIT · back to RC;<br>(e) dirtyRead at RU and RC (B also runs SHOW), nonRepeatable ×4, phantom ×4, printed as a matrix; `--json` | 06.1–06.7 |
| 07 | `l07_acc`, rebuilt per case | lostUpdateApp at RC and RR, atomicUpdate at RC; `--json` | 07.1–07.3 |
| 08a | `l08_reps` (`REPS_SQL`) | M3 at RR, verdict, `M3_RESET` · M3 at SER, verdict · retry for B: BEGIN SER · C; the lab decides (count < 2 → ROLLBACK), verdict · `M3_RESET`; `--json` | 08.1–08.3 |
| 08b | `l08_fp_reps` | (a) A works on store 44 and B on store 45: BEGIN SER · count own store · UPDATE own rep 1 · COMMIT A · COMMIT B. Before the COMMITs, obs counts `pg_locks` SIReadLock rows by locktype for A and B;<br>(b) repeat with `SET enable_seqscan = off` in both sessions, labelled "(ép)";<br>(c) cite `max_pred_locks_per_page` from the setup card | 08.4–08.5 |

## Homework (D3)

- **`homework-predictions.mine.mjs`:**
  - `PREDICTIONS` holds six rows: dirtyRead, nonRepeatable, phantom, lostUpdateApp, atomicUpdate and writeSkew.
  - Each row is `{ RU, RC, RR, SER: '???', why: '' }`, with a one-line Vietnamese description of the scenario and the allowed values `'xảy ra' | 'không' | '40001'`.
- **`homework-runner.mjs <file>`:**
  - It validates before connecting. A row runs only when all 4 of its cells are valid. Every refused cell is listed, for example `✘ writeSkew.SER: '???' → 'xảy ra' | 'không' | '40001'`.
  - It uses one A, one B and the observer for the whole run. For each filled cell it rebuilds `lhw_acc` or `lhw_reps`, runs `ANOMALIES[k].steps(level)` and judges the result.
  - It prints "Ma trận 6 × 4 (dự đoán vs đo được)" with ✔ or ✘ per cell, the timeline of every ✘, and each `why` line (or a blank prompt with a word bank).
  - If the module exports `REVIEW_ANSWERS`, it prints them. If it exports `RUN_D`, it runs `HW_D('lhw_reps')` and prints HD.1–HD.3.
  - It exits 1 while any cell is refused.
- **`homework-predictions.solution.mjs`:** the plan.md key (changed only by measurement), 6 `why` lines without fixed numbers, `REVIEW_ANSWERS` (4 flaws with their fixes) and `RUN_D = true`.
- **`homework-ai-draft.mjs`:**
  - A plausible AI-written experiment with exactly four planted flaws:
    1. one client used for both sessions;
    2. `SET TRANSACTION` issued before `BEGIN`;
    3. write skew tested on reps of different stores;
    4. COMMIT errors swallowed.
  - It is still safe: its own client is built in try, with `application_name 'lesson-12-ai-draft'`, the search_path and the three timeouts, and an `error` listener. Its scratch table `lab12_transaction.lhw_draft_reps` is dropped at the start and in finally.

## Test matrix (test first: the claims already sit in `expected-verdicts.mjs`)

| Owner | Test | Expected | Command |
|---|---|---|---|
| all | size | every file ≤ 200 lines | `wc -l LAB/*.mjs` |
| all | no hard-coded verdict | no match | `grep -nE "verdict\((true\|false)" LAB/*.mjs` |
| D1, D2 | each lab twice | "0 khác biệt"; `check` exit 0 | `npm run --silent lab3 > PLAN/verify/tmp/dev/d2/lab03.a.txt 2>&1` (same for `.b`), then `node PLAN/verify/mask-diff.mjs <a> <b> && npm run check` |
| D1, D2 | matrix | ids and marks match | `node PLAN/verify/check-runs.mjs --file PLAN/verify/tmp/dev/d2/lab03.a.txt --lab lab03` |
| D3 | refusal | N1–N3 pass | `node PLAN/verify/negative-tests.mjs N1 N2 N3` |
| D3 | solution | 24/24 ✔, HD ✔ | `npm run homework:solution` |
| D3 | draft | exit 0, `check` exit 0, two runs masked-equal | `npm run homework:draft` ×2 |

## Verification

Each delegate ends with the lesson-3 format: `Status | Files | per lab: runtime, key numbers, every ✘ or ◆ outcome | Concerns`. The controller then runs `wc -l`, the grep and `npm run check`.

## Risks and rollback

- **Sibling interference:** another delegate's sessions may show up in `check` or as ⚠ holders in D2's horizon labs. Rerun once the sibling has finished; only the serial phase-05 runs count.
- **Kit change needed:** the delegate sends NEEDS_CONTEXT and the controller decides.
- **Rollback:** delete that delegate's files. A leftover scratch table is cleared by rerunning its lab, or by `npm run reset` followed by `npm run setup`.

=== FILE: phase-05-recorded-runs-and-negative-tests.md ===
---
phase: 5
title: "Serial recorded runs and negative tests"
status: pending
priority: P1
effort: 2.5h
dependencies: [4]
---

## Goal

Record every output verbatim, twice and one run at a time. Prove determinism and the negative paths, and settle every contradiction before the guide quotes anything.

## Files to create/modify (owner: controller)

- `PLAN/lab-runs/`:
  - text: `lab01`, `lab02`, `lab03`, `lab04`, `lab05a`, `lab05b`, `lab06`, `lab07`, `lab08`, `hw-mine`, `hw-draft`, `hw-solution`, `check-final` (each `.txt`), plus `run2/*.txt`;
  - JSON: `lab03.json`, `lab05b.json`, `lab06.json`, `lab07.json`, `lab08a.json`;
  - `negative-tests.txt`, `check-runs.txt`, `runtimes.json`.
- Changed only through the contradiction rule: `PLAN/verify/expected-verdicts.mjs`, `LAB/homework-predictions.solution.mjs`, and `PLAN/plan.md` (Measured contradictions).

## Tasks and steps

1. **Pre-run gate:** `npm run check` exits 0, and this query returns 0: `SELECT count(*) FROM pg_stat_activity WHERE datname = 'advance_be_lab' AND pid <> pg_backend_pid() AND (backend_xmin IS NOT NULL OR backend_xid IS NOT NULL)`. Otherwise, ask the user to end the open GUI transaction.
2. For each script (lab1, lab2, lab3, lab4, lab5a, lab5b, lab6, lab7, lab8, homework, homework:draft, homework:solution), in this order:
   1. `node PLAN/verify/record.mjs <name>.txt -- npm run --silent <script>`
   2. `npm run check`
   3. `record.mjs --run2 <name>.txt -- …`
   4. `npm run check`
3. Record the JSON: `record.mjs lab03.json -- node 03-mvcc-two-sessions.mjs --json`, and the same for lab 05 part b, 06, 07 and lab 08 part a.
4. `node PLAN/verify/negative-tests.mjs > PLAN/lab-runs/negative-tests.txt`.
5. `node PLAN/verify/check-runs.mjs > PLAN/lab-runs/check-runs.txt`. If it does not pass, apply the contradiction rule and re-record both runs of the affected lab.
6. Run `npm run lab5` and `npm run lab8` once each to prove the `&&` scripts. Finish with `record.mjs check-final.txt -- npm run --silent check`.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| masked determinism | every pair "0 khác biệt" | inside `check-runs` |
| verdict matrix | every id present with its expected mark | `node PLAN/verify/check-runs.mjs` |
| homework refusal | 24 cells, `[exit 1]` | `check-runs` (hw-mine) |
| homework solution | 24/24 ✔, HD.1–3 ✔ | `check-runs` (hw-solution) |
| N1–N8 | all pass | `node PLAN/verify/negative-tests.mjs` |
| SSI step (must-fix 2) | 40001 on step 8, B's `COMMIT;` | `grep -n "40001" PLAN/lab-runs/lab08.txt` |
| WAL range (must-fix 7) | no absolute LSN printed | `grep -nE "[0-9A-F]+/[0-9A-F]+" PLAN/lab-runs/lab02.txt` returns nothing |
| clean end | exit 0 | `npm run check` |

## Verification

`node PLAN/verify/check-runs.mjs && node PLAN/verify/negative-tests.mjs && cd D:/study/advance-be/labs/lesson-12-transaction && npm run check`

## Risks and rollback

- If a foreign holder appears mid-run, that pair differs. Re-record it once the holder is closed.
- If Docker restarts, run `docker start quan-ly-hop-dong-postgres-1` and re-record the pair.
- Rollback: delete the outputs and rerun this phase. The labs are idempotent.

=== FILE: phase-06-teacher-guide-html.md ===
---
phase: 6
title: "Teacher guide HTML"
status: pending
priority: P1
effort: 8h
dependencies: [5]
---

## Goal

Assemble the single-file Vietnamese guide from `lab-runs/` only, and iterate until `verify-guide`, the harness and render-check all pass.

## Files to create/modify (owner: controller; a single file, so no parallel edits)

- `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html`
- `PLAN/verify/typeorm-check.txt`, `PLAN/verify/render/` (screenshots)

## Tasks and steps

1. **Shell.** Copy the lesson-3 shell into the new file:
   - head, CSS tokens and dark mode, rail, store, quiz engine, exam and slide-map code;
   - storage keys renamed from `l3-` to `l12-`;
   - eyebrow "Advance Backend · Bài 12 / 16 · sau Index", h1 "Transaction", and the Lao Tzu epigraph from slide 1.

   The lesson-3 file is only read.
2. **Sections and the chip → id map.**

| Section ids | Slides (chip) | Content |
|---|---|---|
| `#cach-hoc` | 1, 2 | stage table with a Day column; two windows (`docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab`, then `PSQL_PREAMBLE`, why search_path matters, and to re-run it after psql reconnects); GUI observer with auto-commit on (`OBSERVER_SQL`); PG_URL via a link to lesson 3 §6.3; warm-up `l12-warmup` |
| `#chang-1` `#s1-1` `#s1-2` `#s1-3` | 3, 4 ✔ · 5 ✔ | W1 state machine with the prompts `=#`, `=*#` and `=!#`, taken from `psql-prompt.txt` and the psql docs; Lab 01 |
| `#chang-2` `#s2-1` `#s2-2` | 11 · 12 ✔ | W2 WAL crash simulator, labelled "mô phỏng"; Lab 02 |
| `#chang-3` `#s3-1` `#s3-2` | 13 diff · 15 Cần sửa | xmin/xmax/ctid and snapshot timing; M1 table `#m1`; W3 from `lab03.json`; Lab 03 |
| `#chang-4` `#s4-1` `#s4-2` | 14 diff · 16 diff | VACUUM and the horizon; slide-16 HLL numbers as `cite` "không đo trên máy này"; Lab 04 |
| `#chang-5` `#s5-1`…`#s5-4` | 17, 18 ✔ · 19 ✔ · 20 diff · 21 ✔ | Lab 05 part a; Lab 05 part b; M2 `#m2` (optional); W5 from `lab05b.json` |
| `#chang-6` `#s6-1`…`#s6-5` | 6 · 7 diff · 8 ✔ · 9 diff · 22 diff | Lab 06; W4 player built from `lab06/07/08a.json` |
| `#chang-7` `#s7-1`…`#s7-3` | 8 and 9 referenced · 10 diff | Lab 07; M3 tables for RR and SER `#m3`; Lab 08 part a, retry, part b (false positive, optional) |
| `#chang-8` `#s8-1` `#bai-tap` `#s8-drill` | 23 Cần sửa · 24 | verdict-chip table; homework A (setup card), B (enum file, 6 why lines) and C (flaw table); NestJS drill; quiz 8 |
| `#phong-van`, `#bai-tap-d`, `#cheat-sheet`, `#ban-do-slide`, `#tham-khao`, `#tiep-theo` | 25 at `#tham-khao`, 26 at `#tiep-theo` | exam of 10; D labelled "Tùy chọn · cầu nối Bài 14", +20′ outside the budget; cheat sheet; references; lesson-14 teaser (40P01 after the `deadlock_timeout` of 1 s shown on the setup card, consistent lock order, a question to carry over) |

3. **Times (minutes).** Stages 0–8: 5, 20, 20, 40, 20, 30, 30, 40, 80, for 285′ in total. Stage 8 splits into recap 10, homework A 5, B 25, C 15, drill 15 and exam 10.
   - "Làm mẫu → tự làm": each day ends with a "Tự làm" box listing the grading criteria.
   - Day 02: M1 by hand. Đạt passes if the new xmin equals B's xid, RR shows the old version with xmax set, and the observer shows A blocked by B.
   - Day 03: M3 at SER by hand, plus homework B.
4. **Verdict chips.** Use exactly the contract's table. `callout pg` uses the lesson-3 format ("Slide nói / Trên PG 16 / Bằng chứng: Lab NN [id]").
5. **Walkthrough tables.**
   - SQL cells are `<code data-scn="M1" data-step="n">`, copied from `scenarios.mjs`. Fill-in cells are `<input class="field" data-store="l12-m1-n">`.
   - The M3 key is folded: "lần COMMIT thứ hai (bước 8, của B) báo 40001", with the message quoted from `lab08.txt`.
   - Never name `hw_contracts` in a step. A warn callout explains why the roadmap's command was moved to `contracts`.
6. **Evidence blocks.**
   - Terminal blocks use `<div class="code terminal" data-run="lab03.txt">` with the label "Kết quả đã chạy trên máy bạn ngày … · npm run lab3".
   - Numbers in prose sit in `<span class="m">`.
   - Widget data is the embedded verbatim JSON (`script type="application/json" data-run`).
7. **MySQL claims.**
   - Sources: the MySQL 8.4 Reference Manual pages on isolation levels, consistent reads, locking reads, purge, SET TRANSACTION and autocommit, plus *Efficient MySQL Performance* for slides 13, 14 and 16.
   - Open each URL with WebFetch before citing it.
   - Label every claim "không đo trên máy này" and never put one inside `.m`.
8. **TypeORM drill.**
   - The six bugs, each answer folded and linked to a claim:
     1. the injected repository used inside `dataSource.transaction`;
     2. read-modify-write through `save()`;
     3. an HTTP call inside the transaction;
     4. a QueryRunner not released in `finally`;
     5. no retry of the whole callback on 40001;
     6. a swallowed error leading to 25P02.
   - Linked claims: 07.1, 05b.1, 05b.4, 08.2 and 01.1.
   - Re-fetch `typeorm@<v>/data-source/DataSource.d.ts` and `driver/postgres/PostgresQueryRunner.js` from unpkg for the pinned version(s), and save the result to `typeorm-check.txt`.
   - Already checked on 2026-10-24:
     - Versions 0.3.31 and 1.1.2 both expose `transaction(cb)`, `transaction(isolationLevel, cb)` and `createQueryRunner()`.
     - In both, `startTransaction` sends `START TRANSACTION` and then `SET TRANSACTION ISOLATION LEVEL …`. Claim 06.2 shows that sequence works on PG.
     - 1.x falls back to `options.isolationLevel` and validates the level.
   - `data-typeorm` names the version(s). Without an answer from the user, the label reads "0.3.x và 1.x".
9. **Quizzes and exam.**
   - 8 quizzes of 3–5 items each, set in a new situation, with explanations that cite lab claims.
   - The exam has 10 questions: the COMMIT guarantee, instant ROLLBACK, xmin/xmax/ctid, reader vs writer, RC vs RR snapshots, lost update, write skew with SSI and retry, stalled and abandoned transactions with timeouts, batching big transactions, and TypeORM bugs.
10. Run the gates and fix until they all pass.

## Test matrix (the scripts exist since phase 01)

| Test | Expected | Command |
|---|---|---|
| G1–G16 | all pass | `node PLAN/verify/verify-guide.mjs` |
| H1–H8 | REPORT shows no issue | `"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --allow-file-access-from-files --user-data-dir=D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/tmp/chrome --virtual-time-budget=15000 --dump-dom D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/harness.html \| grep REPORT` |
| render | exit 0 at 360, 768 and 1440 | `T=D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/tmp; TMP=$T TEMP=$T node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html --out D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/render --viewports 360x800,768x1024,1440x900` |
| budget | 285′; no h3 over 200 words | G16 report |

## Verification

All three commands above pass, then `grep -c 'data-scn' <guide>` shows that every scenario step is present.

## Risks and rollback

- If labs are re-run later, numbers may drift; G8 and G9 catch it.
- Stale widget JSON is caught by G8.
- Prose creep is caught by G16.
- Rollback: delete the HTML. Lesson 3 is untouched.

=== FILE: phase-07-ultra-code-review.md ===
---
phase: 7
title: "Ultra code review, fix and re-run"
status: pending
priority: P1
effort: 3h
dependencies: [6]
---

## Goal

Run five independent reviewers with a verified union of their findings, fix every Critical and Important finding, and re-prove whatever changed.

## Files to create/modify (owner: controller; fixes go to the owning files)

- `PLAN/review-packet.md`, plus the skill's outputs under `PLAN/reports/`
- Fixed files in `LAB/` and the guide, and re-recorded `PLAN/lab-runs/*`

## Tasks and steps

1. Write `review-packet.md`, modelled on lesson 3:
   - **Scope:** `LAB/*.mjs`, `package.json`, the guide, `lab-runs/` and `verify/`.
   - **Context:** the plan, the contract and the must-fix table.
   - **Deliberate decisions, not to be flagged:**
     - the AI draft's four planted flaws;
     - `lab5a` and `lab5b`;
     - LSN-class masking of WAL bytes;
     - the `L12_SIGINT_AFTER` hook;
     - the observer-only GUI;
     - lesson 3 left untouched.
   - **DB rule:** only `docker exec quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab -Atc` with SELECT or SHOW; never run labs; never touch `maycha_lease`.
   - **Finding format:** severity, `file:line`, failure scenario, fix.
2. Run `/ak:code-review --ultra`.
3. Fix every Critical and Important finding. Minor findings are fixed by judgement, and each rejection names its verification source.
4. Re-run every affected lab, both runs (phase 05 steps 2–5). Refresh the guide's blocks, `.m` values and JSON from the new files, then rerun the phase-06 gates.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| review | no open Critical or Important finding | the verifier's verdict file |
| regression | all pass | `node PLAN/verify/check-runs.mjs`, `negative-tests.mjs`, `verify-guide.mjs`, harness |

## Verification

The same four commands, plus `npm run check` exiting 0.

## Risks and rollback

- If a fix changes output, the guide must be re-synced (step 4).
- Rollback: revert a fix by restoring the pre-fix copy kept in `PLAN/verify/tmp/prefix/`.

=== FILE: phase-08-coverage-and-docs.md ===
---
phase: 8
title: "Coverage decision and docs route"
status: pending
priority: P2
effort: 1h
dependencies: [7]
---

## Goal

Decide honestly whether `/ak:test` is needed, and add the README route to the new lab folder and guide.

## Files to create/modify (owner: controller)

- `D:/study/advance-be/README.md`

## Tasks and steps

1. **Coverage.** It is honest when K1–K7, N1–N8, `check-runs`, G1–G16 and H1–H8 all exist and pass. If any is missing or skipped, run `/ak:test` for that gap only.
2. **Docs.** Run `/ak:docs update` with an explicit route: `README.md` and nothing else.
   - Line 14 gains `labs/lesson-12-transaction/`.
   - The tree gains `lesson_12_transaction_teacher_guide.html` under `reports/advanced_backend/` and `lesson-12-transaction/` under `labs/`.
   - Original lines, kept for rollback: line 14 "- 🔬 **Mã nguồn Labs thực hành (PostgreSQL & Redis)**: `labs/lesson-02-caching/`, `labs/lesson-03-index/`", lines 71–72 (the two guide files) and lines 77–78 (the two lab folders).
   - The lesson-3 guide and the roadmap wait for Q2 and Q3.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| route | the new paths are present and exist | `grep -n "lesson-12-transaction\|lesson_12_transaction" D:/study/advance-be/README.md` |

## Verification

The grep above, then `ls` on both paths.

## Risks and rollback

- Rollback: restore the quoted original lines.

=== FILE: phase-09-final-verification-gate.md ===
---
phase: 9
title: "Final verification gate"
status: pending
priority: P1
effort: 1h
dependencies: [8]
---

## Goal

Prove every acceptance criterion with commands, record the delivery and leave a clean machine.

## Files to create/modify (owner: controller)

- `PLAN/plan.md` (delivery record). `PLAN/verify/tmp/*` is deleted at the end.

## Tasks and steps

1. `cd D:/study/advance-be/labs/lesson-12-transaction && npm run check`: exit 0.
2. Re-run every lab and homework script into `PLAN/verify/tmp/final/`, then mask-diff each output against `lab-runs/`. All show "0 khác biệt"; nothing is re-recorded.
3. `node PLAN/verify/check-runs.mjs`, `negative-tests.mjs`, `verify-guide.mjs`, the harness and render-check (phase 06 commands): all pass.
4. `wc -l LAB/*.mjs`: every file ≤ 200. `grep -nE "verdict\((true|false)" LAB/*.mjs`: nothing.
5. Secrets: `grep -rIlE --exclude-dir=node_modules --exclude-dir=tmp --exclude-dir=brief-render "postgres(ql)?:/{2}|PGPASS[W]ORD|POSTGRES_PASS[W]ORD" D:/study/advance-be/labs/lesson-12-transaction D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html PLAN/lab-runs PLAN/verify PLAN/plan.md PLAN/phase-*.md PLAN/delegate-brief.md PLAN/review-packet.md`: no output. The pre-existing brainstorm inputs are out of scope, because they name these patterns as criteria.
6. Markdown: `git status --porcelain --untracked-files=all | grep -E '\.md"?$' | grep -v ' "\?plans/'`: nothing beyond the baseline (must-fix 9).
7. Lesson 3 and the databases: `docker exec quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab -Atc` gives `500000`, `5666|5666` and `875|(0,1)`. `SELECT extname, extnamespace::regnamespace FROM pg_extension` shows only the baseline plus `pg_walinspect` in `lab12_transaction`.
8. `git status --porcelain` compared with `verify/git-status-baseline.txt`: only ` M README.md`, `?? labs/lesson-12-transaction/` and `?? reports/advanced_backend/lesson_12_transaction_teacher_guide.html` are new (the plan folder was already untracked).
9. Processes:
   - `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object CommandLine -match 'verify.tmp').Count"`: 0.
   - No lab `node` process is left.
   - Then delete `PLAN/verify/tmp/*`.
10. Write the delivery record in the lesson-3 style: counts, runtimes, review result, deviations and contradictions. Change status with `ak plan` after checking `ak plan --help`; never edit the status cells by hand.
11. Hand Q1–Q4 to the user. Optionally, he can press a real Ctrl+C during `npm run lab3`, then run `npm run check`.

## Test matrix

| AC | Proof | Step |
|---|---|---|
| 1–4, 8, 10, 12 | G1–G16, H1–H8 | 3 |
| 5 | `wc -l` and grep | 4 |
| 6, 13 | final masked diffs and `check-runs` | 2, 3 |
| 7 | `check`, N4, N5 | 1, 3 |
| 9 | N1–N3 and `check-runs` | 3 |
| 11 | secrets grep and `git status` | 5, 8 |

## Verification

Steps 1–9 all pass. Any failure sends the work back to the owning phase.

## Risks and rollback

- Step 2 may show drift if the environment changed (for example, a GUI holding the horizon). Rerun after the pre-run gate from phase 05, step 1.
- Nothing in this phase is destructive except deleting `verify/tmp`, which holds scratch files only.
