=== FILE: plan.md ===
---
title: "Lesson 12 (Transaction) teacher guide and run-verified two-session labs"
description: "Vietnamese lesson-12 guide on the lesson-3 shell, 8 PG 16 labs on a two-session runner with an observer, homework A–D and a NestJS drill, built test-first."
status: pending
priority: P1
effort: 27h
branch: main
tags: [lesson-12, transaction, mvcc, wal, isolation, postgresql, teacher-guide, labs, tdd]
blockedBy: []
blocks: []
created: 2026-10-24
---

# Lesson 12 — Transaction: teacher guide and run-verified labs

## Overview

This plan implements the accepted contract `brainstorm/candidate-E.md` unchanged and resolves all ten must-fix notes of `brainstorm/verdict.md`. Đạt gets one Vietnamese page on the lesson-3 shell with 8 stages: Day 02 covers stages 1–5 (135 min) and Day 03 covers stages 6–8 (150 min). He also gets a lab folder whose 8 labs drive two real sessions plus an observer on this machine's PostgreSQL 16.15. Every quoted number is pasted from `lab-runs/*.txt`, and each of those files is recorded twice and diffed after masking ms, xid, LSN and pid. The oracles come first. `npm run check`, the expected-verdict matrix, the homework refusal test and the guide checkers are written in phase 02, and each stays red until the code it checks exists. All work happens on `main`. The only git command is `git status --porcelain`, and nothing is committed.

| Name | Meaning |
|---|---|
| LAB | `D:/study/advance-be/labs/lesson-12-transaction` |
| GUIDE | `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html` |
| PLAN | `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide`; RUNS = `PLAN/lab-runs`, VERIFY = `PLAN/verify` |
| `$ENV` | Git Bash prefix for DB commands, never echoed: `export PG_URL="$(PW="$(docker exec quan-ly-hop-dong-postgres-1 printenv POSTGRES_PASSWORD)" node -e 'process.stdout.write("postgres://postgres:"+encodeURIComponent(process.env.PW)+"@localhost:5433/advance_be_lab")')"` |
| `$PSQL` | `docker exec quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab -Atc` (SELECT/SHOW only) |
| Record | `npm run --silent <script> > "$RUNS/<f>.txt" 2>&1; echo "[exit $?]" >> "$RUNS/<f>.txt"`, run in Git Bash so the files are UTF-8 (Windows PowerShell 5.1 `>` writes UTF-16) |

Rules for every phase:
- Database objects live only in `lab12_transaction`.
  - `lab03_indexing` is read-only: copying `hw_contracts` and calling its `pageinspect` are allowed.
  - LAB never names `lab_imdb` or `maycha_lease`.
  - LAB never uses `ALTER SYSTEM`, `ALTER DATABASE`, `ALTER ROLE` or `CHECKPOINT`.
- Every lab session runs `SET search_path = lab12_transaction`, `SET lock_timeout = '5s'`, `SET statement_timeout = '60s'` and `SET idle_in_transaction_session_timeout = '20s'`. It also has `error` and `notice` listeners.
  - The search_path line is required because `advance_be_lab` carries a database-level `search_path = lab03_indexing, public`.
  - Without it, an unqualified name resolves into lesson 3's schema first, and an unqualified `CREATE` would land there.
- Files in LAB stay at 200 lines or fewer. A longer file is split into `-part-a`/`-part-b` behind one npm script. Comments are in Vietnamese, verdicts are computed, and `PG_URL` is never printed.
- New Markdown goes only under `plans/`.
- When a measurement contradicts the matrix, the narrative changes and the data does not.
  - The controller logs the case in `VERIFY/deviations.md` and updates the guide.
  - A lab's steps change only when review proves a lab bug.

## Contract and must-fix resolution

These settled decisions are carried unchanged:
- the roadmap order and the stage table, with its minutes;
- labs 01–08, with their slugs and claims;
- the runner: sessions A and B, an observer, and `--json` for the widgets;
- the same steps replayed in two psql windows: M1, optional M2, M3;
- `contracts` (ids 1–100,000 of `hw_contracts`) plus `store_reps`;
- an own small kit plus `scenarios.mjs`;
- widgets W1–W5;
- homework A–D plus the 6-bug drill;
- the verdict-chip table and the lesson-14 bridge;
- the npm script list and AC1–AC11, which are sharpened below.

| # | Must-fix note | Resolution | Phase |
|---|---|---|---|
| 1 | Homework B load | 24 enum cells (`'xảy ra' \| 'không' \| '40001'`) plus one `why` line per scenario row, 6 lines in all. The runner refuses only `'???'` cells, and the guide has 6 "vì sao" boxes. | 02, 06, 08 |
| 2 | SSI failure step | M3 and lab 08 B use the probe order A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT. The key reads "the second COMMIT (B) fails, 40001 … read/write dependencies". Both are matrix tokens, re-measured into `lab08.txt`. | 02, 04, 05, 07 |
| 3 | Lab 05 overload | `05-big-and-idle-tx-part-a.mjs` covers the large transaction (slide 18). `-part-b.mjs` covers idle and abandoned transactions (slides 19–21). Each is 200 lines or fewer, behind `05-big-and-idle-tx.mjs` and `npm run lab5`. | 05 |
| 4 | M1 third window | Two psql windows only. In step 5, B holds an open UPDATE and window A, after its COMMIT, is the second writer. The GUI observer only reads `pg_stat_activity`. `scenarios.mjs` M1 is identical. | 04, 08 |
| 5 | AC7 fingerprint | `check` fails unless `hw_contracts` has 500,000 rows, `relallvisible = relpages = 5666`, and id 1 sits at xmin 875, ctid (0,1). `n_tup_upd` and `n_tup_del` are info only. | 02 |
| 6 | TypeORM version | Open question 1 asks for the learner's version. Until then, the drill uses only APIs common to 0.3.x and 1.x, and the differences are labelled (below). | 06, 08 |
| 7 | `pg_walinspect` range | Lab 02 reads `pg_current_wal_lsn()` before BEGIN and after COMMIT or ROLLBACK. It queries `pg_get_wal_records_info(lsn0, lsn1)` filtered by its own xid, and prints record types and offsets from lsn0. The offsets are LSN-derived, so they are masked. | 04, 05 |
| 8 | Homework D scope | `#bai-tap-d` sits after the exam, marked "Tùy chọn · cầu nối Bài 14", outside stage 8's 80 minutes. | 06, 08 |
| 9 | Markdown rule | Covered by the rule above. `check-lab-runs.mjs` fails on any `.md` under LAB. The only Markdown edit outside `plans/` is phase 10's README route, and no `docs/` folder is created. | all |
| 10 | DB-level search_path | The kit and the psql preamble both run `SET search_path = lab12_transaction;`, for the reason given above. Nothing alters the database setting, and `check` fails if it changes. | 02, 04, 08 |

TypeORM facts behind note 6, checked today:
- In typeorm@0.3.20 and @1.1.2, `PostgresQueryRunner.startTransaction` sends `START TRANSACTION` and then `SET TRANSACTION ISOLATION LEVEL …`.
- Only 1.x falls back to `dataSource.options.isolationLevel`.
- Labelled differences: that default, the rename of `queryRunner.connection` to `.dataSource`, `@nestjs/typeorm` ≥ 11.0.1, and Node ≥ 20.
- The quotes are stored in `VERIFY/typeorm-api.txt`.

Plan decisions inside the contract's room:

| Decision | Reason |
|---|---|
| Lab scratch tables (`lNN_*`, `hw_*`) copy `lab03_indexing.hw_contracts` and literal `store_reps` rows, never the playground tables | M1–M3 modify the playground, and the contract wants manual play never to change lab numbers |
| Print contract: only `<n> ms`, `pid=<n>`, `xid=`/`xmin=`/`xmax=<n>`, `X/Y` LSNs and table columns headed `ms`, `pid`, `xid`, `xmin`, `xmax`, `t_xmin`, `t_xmax` or `Δ LSN` may vary; blockers print as the roles A, B, O | makes AC6's "identical except ms, xid, LSN, pid" mechanically checkable |
| Lab 05 A counts WAL by xid, excluding full-page images | FPIs depend on checkpoint timing, and CHECKPOINT is banned |
| psql glyphs: lab 01 E measures the state the observer sees; the `=#`/`=*#`/`=!#` mapping is cited from the psql docs and Đạt checks it in M1 | a script cannot see psql's prompt (contract §8) |
| The guide's PG_URL step points to lesson 3 §6.3 and names the new container | AC11 bans the URL scheme and the password variable names in new files |

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Preflight and scaffold](phase-01-preflight-and-scaffold.md) | 0.5h | — | facts match; 14 scripts; `pg` resolves |
| 02 | [Oracles first](phase-02-oracles-first.md) | 3h | 01 | each oracle red for its documented reason; masker self-test green |
| 03 | [Dataset setup](phase-03-dataset-setup.md) | 1h | 02 | `check` exit 0; reset and foreign-lock tests pass |
| 04 | [Kit, runner, scenarios, freeze](phase-04-kit-runner-scenarios.md) | 2.5h | 03 | smoke S1–S9 green; interfaces frozen; delegate brief |
| 05 | [Labs 01–08](phase-05-labs-01-08.md) | 5h (2.5h wall) | 04 | each lab twice, empty masked diff, matrix ✔ or logged |
| 06 | [Homework and TypeORM evidence](phase-06-homework-and-typeorm-evidence.md) | 2.5h | 04 (parallel with 05) | H1–H6 green |
| 07 | [Serial runs and robustness](phase-07-serial-runs-and-robustness.md) | 1.5h | 05, 06 | R1–R6 green |
| 08 | [Teacher guide HTML](phase-08-teacher-guide-html.md) | 7h | 07 | G1–G4 green |
| 09 | [Ultra code review and fix loop](phase-09-ultra-review-and-fix-loop.md) | 3h | 08 | 0 open Critical/Important; affected labs re-run |
| 10 | [Test gate, docs route, final gate](phase-10-test-gate-docs-final.md) | 1h | 09 | criteria 1–14 green; README route |

## Expected-verdict matrix summary

The full matrix is `VERIFY/expected-verdicts.json`, written in phase 02. "?" marks a claim that contract §8 says must be measured before it is quoted. Either outcome is accepted once it is logged, and the narrative follows it.

| Lab | Section → claim (verdicts) | Tokens |
|---|---|---|
| 01 | A error → next statement 25P02, COMMIT replies ROLLBACK, 0 rows (3) · B SAVEPOINT keeps 2 rows (1) · C DDL rolled back (1) · D nextval gap (1) · E observer states idle → idle in transaction → (aborted) → idle (1) | 22012, 25P02, ROLLBACK |
| 02 | A heap records precede COMMIT; flush LSN ≥ COMMIT end (2) · B ABORT record, no extra heap record (2) · C synchronous_commit on/off, ms only (0) | COMMIT, ABORT |
| 03 | A RC: writer not blocked; re-read sees new xmin/ctid (2) · B RR: old version with xmax = B (2) · C pageinspect: both versions, old t_ctid → new (1) · D reader not blocked; second writer waits on Lock/transactionid; proceeds after COMMIT (3) | transactionid |
| 04 | A ROLLBACK of 100,000 rows leaves 100,000 removable versions; VACUUM truncates (2) · B RC idle read-only: no backend_xmin, cleanup proceeds (2, ?) · C RR idle: xmin set, not removable, removed after COMMIT (3) · D lookup pages rise at 0/100/1,000 versions and fall after VACUUM (2) | not yet removable |
| 05 A | WAL records within ±5%; pages after: batches < one UPDATE; largest transaction 10,000 vs 100,000 rows (3) | — |
| 05 B | B1 idle in transaction seen; waiter gets 55P03 (2) · B2 terminate gives A 57P01, Node survives; retry needs no wait (2) · B3 25P03 ends the idle session (?); its row lock is gone (2) | 55P03, 57P01 |
| 06 | A SET TRANSACTION warns outside a block, applies first in a block, errors after a query (code ?), works in TypeORM's order, session default applies (5) · B no dirty read at any level; RU reports `read uncommitted` (2) · C non-repeatable read only at RU/RC (1) · D phantom only at RU/RC (1) | read uncommitted |
| 07 | A app read-modify-write lost at RU/RC, 40001 at RR/SER (2) · B atomic update correct after a wait at RU/RC, 40001 at RR/SER (2, ?) · C whole-transaction retry correct (1) | 40001 |
| 08 | A RR: both commit, 0 on duty (1) · B SER: B's UPDATE succeeds, the second COMMIT fails, 1 on duty (2) · C retry refuses, 1 on duty (1) · D stores 44 vs 45: seq-scan false positive; forced index scan "(ép)" none (2, ?) | 40001, read/write dependencies |
| HW | dirty read không ×4; non-repeatable read and phantom xảy ra/xảy ra/không/không; app lost update xảy ra/xảy ra/40001/40001; atomic update không/không/40001/40001; write skew xảy ra/xảy ra/xảy ra/40001 · D: B waits, sees 1, refuses, no 40001 (3) | — |

## Acceptance criteria

| # | Criterion (how it is checked) | Phase |
|---|---|---|
| 1 | Ids `cach-hoc`, `chang-1`…`chang-8`, `bai-tap`, `phong-van`, `bai-tap-d`, `cheat-sheet`, `ban-do-slide`, `tham-khao`, `tiep-theo`. Hero "Bài 12 / 16" and 8 rail checkboxes. Only `l12-*` storage keys; a seeded `l3-*` key stays unchanged. (`check-guide.mjs`, harness) | 08 |
| 2 | Offline except Google Fonts, light and dark, no horizontal scroll at 360 px, no console errors. (`check-guide.mjs`, harness, render-check) | 08 |
| 3 | 26 chips in order, all hrefs resolve. The pg mark sits on exactly slides 7, 9, 10, 13–16, 20, 22, 23, each target holding a `callout pg`, the contract's chip and a `Lab 12.` reference. Slides 4, 5, 8, 12, 18, 19, 21 carry `Đúng trên PG16`. (`check-guide.mjs`) | 08 |
| 4 | Every stage has a goal, a `wwh` grid, a widget or verbatim lab block, and a quiz of 3–5 valid questions. Exam of 10. References cover slide 25 plus the PG 16 docs. MySQL claims sit in `.cite-mysql` with "không đo trên máy này" and a link. Prose ≤ 450 words per stage. Stage minutes = 285 (135 + 150). (`check-guide.mjs`) | 08 |
| 5 | All 14 npm scripts ran with the expected exit codes (`homework` 1, the rest 0). Every LAB file ≤ 200 lines. No literal `verdict(true` or `verdict(false`. (`check-lab-runs.mjs`) | 07 |
| 6 | Each lab and `homework:solution` ran twice with an empty masked diff. Every terminal block, `.m[data-run]` number and widget JSON in GUIDE traces to RUNS. (`mask-diff.mjs`, `check-lab-runs.mjs`, `check-guide-evidence.mjs`) | 07, 08 |
| 7 | `check` exits 0 after the full serial run, at once after a graceful Ctrl+C, and within 30 s after an abrupt kill. Its hard invariants follow note 5. (RUNS files) | 07 |
| 8 | GUIDE's M1/M2/M3 SQL equals `scenarios.mjs` rendered with the walkthrough table names, which labs 03, 05 and 08 run. Fill-in cells persist across a reload. (`check-guide-evidence.mjs`, harness) | 04, 08 |
| 9 | Homework (`test-homework-refusal.mjs`, `check-lab-runs.mjs`):<br>• the untouched file gives exit 1 with all 24 cells listed and no DB contact;<br>• an invalid value is refused with the allowed list;<br>• a partial file measures its complete rows;<br>• the solution prints a measured 6×4 matrix with every cell ✔, plus C and D;<br>• the draft exits 0 and leaves nothing behind;<br>• the delivered `.mine` file is untouched. | 06, 07 |
| 10 | The drill has 6 bugs with folded answers. Its API names match `typeorm-api.txt` (0.3.20, 1.1.2, and the learner's version once known), and the 0.3-vs-1.x differences are labelled. (`check-guide.mjs`) | 06, 08 |
| 11 | No `postgres://`, `PGPASSWORD` or `POSTGRES_PASSWORD` in LAB, GUIDE or RUNS. `git status --porcelain` adds only LAB, GUIDE and ` M README.md` to the baseline. | 10 |
| 12 | Only the expected objects exist in `lab12_transaction`. The lab03 fingerprint, the placement of `pg_walinspect` and the DB-level search_path are all unchanged. LAB names `lab03_indexing` only in reads. (`check`, `check-lab-runs.mjs`) | 02–07 |
| 13 | Recorded negative tests:<br>• a malformed `PG_URL` is never echoed;<br>• an undeclared wait ends in 55P03 within `lock_timeout`;<br>• a foreign idle session makes `check` exit 1 naming it, and makes lab 04 warn;<br>• `setup -- --force` under a foreign lock exits 1 within 10 s. | 02, 03, 04, 07 |
| 14 | No `.md` file under LAB or `reports/`. README.md is the only Markdown file edited outside `plans/`. | 10 |

## Risks and rollback

| Risk | L × I | Mitigation |
|---|---|---|
| Measured PG behaviour differs from the matrix (SSI step, false positive, RC xmin, codes, record names) | M × M | "?" claims accept either outcome; `deviations.md` drives the narrative; the data is never edited |
| Parallel delegates disturb each other on one server (lab 04 horizon, `check`) | H × M | horizon-sensitive labs run only when no other `lesson-12%` session exists; phase 07's serial runs are authoritative |
| A GUI session mid-transaction holds an xmin or locks | M × M | labs 04 and 05 warn and name it; `check` fails with the pid and application_name; `lock_timeout` caps waits |
| A server-killed session crashes Node | M × H | `error` listener on every client; smoke S5 |
| Ctrl+C on Windows skips cleanup | M × M | SIGINT handler with observer termination; per-session timeouts bound abrupt kills; R3, R4 |
| Too much prose ("nhiều chữ quá") | M × H | the prose budget is enforced by `check-guide.mjs` |

Rollback: everything is new and uncommitted. Run `npm run reset`, which drops only `lab12_transaction` (extension included). Then delete LAB, GUIDE and the new PLAN artefacts, and restore the README lines from `VERIFY/readme-before.txt`. No git restore command is used.

## Open questions for the user

1. Which TypeORM and `@nestjs/typeorm` versions does `quan_ly_hop_dong` use? The output of `npm ls typeorm @nestjs/typeorm` answers it. Until then, the drill stays on the common 0.3.x/1.x API with labelled differences.
2. Lesson 3 still names the old container `quan_ly_hop_dong-postgres-1` and the old path `D:\học`, and it still teases "Bài 4", although the roadmap now goes 3 → 12 → 14. Should that be fixed in a separate change? This plan does not touch lesson 3.
3. The roadmap's Day 02 text runs an UPDATE on `hw_contracts`. The contract runs it on the copy `lab12_transaction.contracts` instead, which keeps lesson 3's data intact. Please confirm. Without an answer, the copy stays.

=== FILE: phase-01-preflight-and-scaffold.md ===
---
phase: 1
title: "Preflight and scaffold"
status: pending
priority: P1
effort: 0.5h
dependencies: []
---

## Goal
Confirm the machine still matches the packet, record a baseline, and create the lab folder with its scripts and `pg`.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/labs/lesson-12-transaction/package.json` | controller |
| `D:/study/advance-be/labs/lesson-12-transaction/package-lock.json` | npm |
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/baseline.txt`, `git-status-before.txt` | controller |

`package.json` sets `"type": "module"` and `"private": true`, and depends on `"pg": "^8.16.3"`, the same major version as lesson 3. It defines these scripts:

| Script | Command |
|---|---|
| setup | `node 00-setup-dataset.mjs` |
| check | `node check-lab-state.mjs` |
| reset | `node check-lab-state.mjs --reset` |
| lab1–lab8 | `node 01-atomicity-pg-rules.mjs`, `02-wal-records.mjs`, `03-mvcc-two-sessions.mjs`, `04-dead-versions-horizon.mjs`, `05-big-and-idle-tx.mjs`, `06-levels-read-anomalies.mjs`, `07-lost-update.mjs`, `08-write-skew.mjs` |
| homework | `node homework-runner.mjs homework-predictions.mine.mjs` |
| homework:draft | `node homework-ai-draft.mjs` |
| homework:solution | `node homework-runner.mjs homework-predictions.solution.mjs` |

## Tasks and steps
1. Save `git status --porcelain` in `git-status-before.txt`. Today it lists ` M AGENTS.md`, `.claude/`, `RESTORE.ps1`, this plan folder and one brainstorm HTML.
2. Run T1.1–T1.3 and save the results in `baseline.txt`. Also check that the Edge browser exists: `test -e "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"`.
3. Write `package.json`, then run `npm install --prefer-offline --no-audit --no-fund` in LAB. If neither the registry nor the cache can serve `pg`, report NEEDS_CONTEXT. Never copy lesson 3's `node_modules`.

## Test matrix
| # | Test | Expected | Command |
|---|---|---|---|
| T1.1 | lab03 fingerprint | `500000`; `5666\|5666`; `875\|0\|(0,1)` | `$PSQL "SELECT count(*) FROM lab03_indexing.hw_contracts"`; `$PSQL "SELECT relpages, relallvisible FROM pg_class WHERE oid='lab03_indexing.hw_contracts'::regclass"`; `$PSQL "SELECT xmin, xmax, ctid FROM lab03_indexing.hw_contracts WHERE id=1"` |
| T1.2 | DB-level search_path | `advance_be_lab\|{"search_path=lab03_indexing, public"}` | `$PSQL "SELECT d.datname, s.setconfig FROM pg_db_role_setting s JOIN pg_database d ON d.oid=s.setdatabase"` |
| T1.3 | schema absent, extension available | `f`; `pg_walinspect\|1.1\|` | `$PSQL "SELECT to_regnamespace('lab12_transaction') IS NOT NULL"`; `$PSQL "SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name='pg_walinspect'"` |
| T1.4 | `pg` resolves | `function` | `cd /d/study/advance-be/labs/lesson-12-transaction && node -e "import('pg').then(m => console.log(typeof m.default.Client))"` |
| T1.5 | 14 scripts | `14` | `node -e "console.log(Object.keys(require('./package.json').scripts).length)"` |

Gate: T1.1–T1.3 must match. If they do not, STOP and report. Never write to `lab03_indexing` to repair it.

## Verification
Re-run T1.1–T1.5 after `npm install`.

## Risks and rollback
- Offline npm leads to NEEDS_CONTEXT.
- Rollback: delete LAB. The baseline files stay as evidence.

=== FILE: phase-02-oracles-first.md ===
---
phase: 2
title: "Oracles first"
status: pending
priority: P1
effort: 3h
dependencies: [1]
---

## Goal
Write every oracle before the code it checks, then run each one and record that it fails for its documented reason.

## Files to create/modify
All files are owned by the controller.
- `L` = `D:/study/advance-be/labs/lesson-12-transaction`
- `V` = `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify`

| Path | Purpose |
|---|---|
| `L/tx-kit.mjs` | base layer: `connect(app)` and print helpers |
| `L/check-lab-state.mjs` | `npm run check` and `npm run reset` |
| `L/homework-predictions.mine.mjs` | the untouched learner file |
| `V/expected-verdicts.json` | the matrix |
| `V/mask-diff.mjs`, `V/fixtures/mask-a.txt`, `mask-b.txt`, `mask-c.txt` | masked diff plus its self-test |
| `V/check-lab-runs.mjs` | lab-run and static-safety oracle |
| `V/test-homework-refusal.mjs`, `V/fixtures/hw-invalid.mjs`, `hw-partial.mjs` | refusal oracle |
| `V/check-guide.mjs`, `V/check-guide-evidence.mjs` | static guide oracles |
| `V/harness.html`, `V/shot.html` | runtime guide oracle; dark screenshots |
| `V/foreign-session.mjs`, `V/sigint-preload.mjs`, `V/interrupt-lab.mjs` | negative-test helpers |
| `V/red-phase.txt`, `V/deviations.md` (empty table) | red evidence; deviation log |

## Tasks and steps
1. **`tx-kit.mjs` base.** `connect(app)` follows `labs/lesson-03-index/pg-explain-kit.mjs:12-35`.
   - The client is built inside `try`. A failure prints only `err.code` and the hint `docker start quan-ly-hop-dong-postgres-1`.
   - A missing `PG_URL` prints "đặt PG_URL như Bài 3 mục 6.3".
   - It then runs the four session SETs and attaches `error` and `notice` listeners that collect into `client.events` and `client.notices`.
   - The print helpers copy `pg-explain-kit.mjs:135-168` and add `jsonMode` and `emitJson`.
   - The header comment states the print contract.
2. **`check-lab-state.mjs`** (≤ 120 lines). Each hard invariant prints ✔ or ✘, and any ✘ means exit 1.

   | # | Hard invariant |
   |---|---|
   | H1 | The relations are exactly `contracts`, `contracts_pkey`, `store_reps` and `store_reps_pkey`; no `l__\_%` or `hw\_%` is left. |
   | H2 | `pg_walinspect` lives in `lab12_transaction`; `pageinspect`, `pgstattuple` and `pg_trgm` are still in `lab03_indexing`. |
   | H3 | No other `lesson-12%` backend exists, and no other backend holds a lock on a `lab12_transaction` relation. A violation prints `pid=`, the app, the relation and the mode. |
   | H4 | The note-5 fingerprint holds. `n_tup_upd` and `n_tup_del` print as info only. |
   | H5 | The DB-level `search_path=lab03_indexing, public` is unchanged. |
   | H6 | `contracts` has 100,000 rows and `store_reps` has 4. |

   Warnings keep exit code 0:
   - playground drift (a rep off duty, or id 1's total ≠ 478461.34), with the hint `npm run setup -- --force`;
   - a foreign session holding `backend_xmin` or `backend_xid`.

   `--reset` runs only `DROP SCHEMA IF EXISTS lab12_transaction CASCADE`.
3. **`homework-predictions.mine.mjs`** exports `PREDICTIONS` with six rows: `dirtyRead`, `nonRepeatableRead`, `phantom`, `lostUpdate`, `atomicUpdate` and `writeSkew`. Each row is `{ RU: '???', RC: '???', RR: '???', SER: '???', why: '' }` and has a Vietnamese comment naming its scenario and the allowed values.
4. **`expected-verdicts.json`** has one entry per lab: `{ file, script, header: "Lab 12.NN", exit, json, sections: { A: { claim, verdicts, tokens, uncertain } } }`, as summarised in plan.md. It also holds the exit codes of the setup, check, reset and homework runs, the 24-cell key and homework D's three claims.
5. **`mask-diff.mjs <a> <b>`** masks the four volatile classes.
   - It masks them inline and by table header: in a `│` table, the header row decides which columns are masked.
   - In `.json` files it masks the keys `ms`, `pid`, `xid`, `xmin`, `xmax`, `lsn` and `dLsn`.
   - It prints the first differing line and exits 0 or 1.
6. **`check-lab-runs.mjs [--lab NN] [--dir path]`** reads RUNS by default.
   - **Run checks.** The run files exist, and the header, sections, verdict counts and tokens all match the matrix. Every expected ✔ is ✔ unless `deviations.md` lists it. `labNN.txt` and `.run2.txt` show an empty masked diff, and each `[exit N]` matches.
   - **Static checks over LAB `*.mjs`:**
     - each file is 200 lines or fewer;
     - no `verdict\(\s*(true|false)`;
     - no `ALTER SYSTEM|DATABASE|ROLE` or `CHECKPOINT`;
     - no write keyword on any line that names `lab03_indexing`;
     - no `lab_imdb` or `maycha_lease`;
     - a Vietnamese header comment in every file;
     - the four SETs and `on('error'` in `tx-kit.mjs`;
     - 24 `'???'` still in the `.mine` file;
     - no `.md` file under LAB;
     - none of the three secret patterns in LAB, GUIDE or RUNS. The patterns are assembled from pieces, so the checker does not flag itself.
7. **`test-homework-refusal.mjs`** runs three cases.
   - H1 runs the `.mine` file with `PG_URL` unset. It expects exit 1, all 24 ids from `dirtyRead.RU` to `writeSkew.SER`, and no connection message.
   - H2 runs `hw-invalid.mjs`, where one cell is `'có'`. That row must be refused, with the allowed list shown.
   - H3 runs `hw-partial.mjs`, where only `writeSkew` is filled. That row must be measured ✔, the rest refused, and the exit code 1. H3 needs the DB, so it runs from phase 06.
8. **`check-guide.mjs`** asserts acceptance criteria 1, 3, 4 and 10, plus the resource rule of criterion 2, as worded in plan.md.
   - It evaluates the inline `SLIDES`, `QUIZ` and `EXAM` with `vm`.
   - It maps each `QUIZ` key to a `data-quiz` stage, and checks the chip texts against the contract table.
   - Prose counts `p` words outside callouts, tables and folds.
   - The minutes come from the "Cách học" table.
9. **`check-guide-evidence.mjs`** asserts criteria 6 and 8.
   - A `.code.terminal` labelled `npm run X` must be a verbatim, in-order excerpt of its RUNS file; `…` lines are elisions.
   - A `.m[data-run]` number must occur in the named file.
   - A `script[type="application/json"][id^="run-"]` must deep-equal the RUNS JSON.
   - A `table[data-walk]` must equal the scenario rendered with `WALK`.
   - `--print M1` outputs the expected rows for pasting.
10. **`harness.html`** adapts `plans/261019-1634-lesson-03-index-teacher-guide/verify/harness.html`.
    - It renders three views: 360 px light, 400 px dark and 1280 px light.
    - It seeds `l3-done-1`, clicks every control in each `.widget` and every first `.q-opt`, and opens the folds.
    - It types into one `data-walk` input and reloads.
    - It prints `REPORT {json}` with overflow, errors, persistence and the `l3-done-1` value.
11. **Helpers.** Each loads `pg` via `createRequire` on LAB's `package.json`.
    - `foreign-session.mjs [--seconds 60]` connects as app `foreign-test` and sets `idle_in_transaction_session_timeout = '90s'`. It runs `BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT count(*) FROM lab12_transaction.contracts`, then idles and rolls back.
    - `sigint-preload.mjs` is loaded through `node --import`. It polls with its own client until a `lesson-12%` backend waits on a `Lock`. Then it calls `process.emit('SIGINT')`, which fires the same listener a console Ctrl+C does.
    - `interrupt-lab.mjs --mode graceful|kill` spawns `node [--import sigint-preload.mjs] 05-big-and-idle-tx.mjs` in LAB.
      - In kill mode, it waits for the same state and calls `child.kill()`. On Windows that is TerminateProcess, so no JS cleanup runs.
      - In either mode, it then runs `check-lab-state.mjs` every 2 s for at most 30 s and prints the mode, the exit code and the seconds to green.

## Test matrix
| # | Test | Expected now | Command (in V or L) |
|---|---|---|---|
| T2.1 | masker self-test | `a` vs `b` (only ms/pid/xid/LSN differ) exits 0; `a` vs `c` (a count differs) exits 1 naming the line | `node mask-diff.mjs fixtures/mask-a.txt fixtures/mask-b.txt`, then with `mask-c.txt` |
| T2.2 | check before setup | exit 1, "chưa có schema lab12_transaction" | `$ENV && npm run check` |
| T2.3 | malformed PG_URL | exit 1; the output never contains `Sx9` | `PG_URL='postgres://u:Sx9@[bad' node check-lab-state.mjs` |
| T2.4 | lab-run oracle | exit 1 listing the missing RUNS files | `node check-lab-runs.mjs` |
| T2.5 | refusal oracle | exit 1, "thiếu homework-runner.mjs" | `node test-homework-refusal.mjs` |
| T2.6 | guide oracles | exit 1, "không thấy GUIDE" | `node check-guide.mjs`; `node check-guide-evidence.mjs` |

## Verification
Run T2.1–T2.6 and append their output to `red-phase.txt`. Gate: T2.1 is green, and T2.2–T2.6 are red for exactly these reasons.

## Risks and rollback
- A wrong expectation in an oracle: from now on, an oracle changes only together with a line in `deviations.md` saying why.
- Checkers stay at 200 lines or fewer, split by concern.
- Rollback: delete the listed files.

=== FILE: phase-03-dataset-setup.md ===
---
phase: 3
title: "Dataset setup"
status: pending
priority: P1
effort: 1h
dependencies: [2]
---

## Goal
Build the learner's playground in `lab12_transaction` idempotently, and turn `npm run check` green.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/labs/lesson-12-transaction/00-setup-dataset.mjs` | controller |

## Tasks and steps
1. **Preconditions.** `hw_contracts` must have 500,000 rows; otherwise print "Chưa có dữ liệu Bài 3: chạy setup và homework:setup trong labs/lesson-03-index" and exit 1. If `pg_walinspect` is already installed in another schema, stop and do not move it.
2. **Build.**
   - Run `CREATE SCHEMA IF NOT EXISTS lab12_transaction`.
   - Create `contracts` as `SELECT * FROM lab03_indexing.hw_contracts WHERE id <= 100000 ORDER BY id`, add the primary key, then run `VACUUM (ANALYZE)`.
   - Create `store_reps(store_id, rep_id, name, on_duty, PRIMARY KEY (store_id, rep_id))` with (44,1,'An'), (44,2,'Binh'), (45,1,'Chi') and (45,2,'Dung'), all on duty.
   - Run `CREATE EXTENSION IF NOT EXISTS pg_walinspect SCHEMA lab12_transaction`.
3. **Idempotent rerun.** When the counts and the extension are already in place, setup skips the build.
   - `--force` drops and rebuilds both tables.
   - Its DROP runs under the kit's `lock_timeout`, so a foreign lock gives 55P03, and the message names the blocker's pid and app.
4. **Dataset card** (for homework A). It shows the row count, the heap and index sizes, id 1, the contracts per store 44 and 45, the `store_reps` rows, the extension version and the fingerprint line.

The playground keeps autovacuum on; the lab scratch tables switch it off.

## Test matrix
| # | Test | Expected | Command |
|---|---|---|---|
| T3.1 | first setup | exit 0; card shows 100,000 rows, id 1 = HD0000001 in store 44, 484 contracts in store 44 and 492 in store 45 (counted read-only 2026-10-24) | `$ENV && npm run setup` |
| T3.2 | rerun | "đã có sẵn, bỏ qua"; identical card | run twice, then `mask-diff.mjs` |
| T3.3 | `--force` | rebuilds; same card | `npm run setup -- --force` |
| T3.4 | invariants | H1–H6 ✔, exit 0 | `npm run check` |
| T3.5 | foreign lock | while `foreign-session.mjs --seconds 40` runs: `setup -- --force` exits 1 within 10 s with 55P03 naming `foreign-test`, and `check` exits 1 naming it | helper in the background, then both commands |
| T3.6 | reset round trip | `reset` exits 0; `check` exits 1 with "chưa có schema"; extension count 0; `setup` and `check` green again | `npm run reset; npm run check; $PSQL "SELECT count(*) FROM pg_extension WHERE extname='pg_walinspect'"; npm run setup && npm run check` |

## Verification
`npm run check` exits 0, and the T1.1 fingerprint is unchanged.

## Risks and rollback
- A GUI left mid-transaction makes `--force` fail with 55P03. The message names the session to close.
- Rollback: run `npm run reset`, then delete the file.

=== FILE: phase-04-kit-runner-scenarios.md ===
---
phase: 4
title: "Kit, runner and scenarios, frozen before fan-out"
status: pending
priority: P1
effort: 2.5h
dependencies: [3]
---

## Goal
Write the kit smoke test first. Then write the session layer, the runner and the shared scenarios, and freeze their interfaces before any delegate starts.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/kit-smoke.mjs` (written first) | controller |
| `D:/study/advance-be/labs/lesson-12-transaction/tx-kit.mjs` (extended, ≤ 160 lines) | controller |
| `D:/study/advance-be/labs/lesson-12-transaction/tx-runner.mjs` (≈ 120 lines) | controller |
| `D:/study/advance-be/labs/lesson-12-transaction/scenarios.mjs` (≤ 200 lines) | controller |
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/delegate-brief.md` | controller |

## Frozen interfaces
```js
// tx-kit.mjs
connect(app)                      // phase 02
openLab(name, roles = ['A','B'])  // { A, B, O, pid, events, closeAll }; app lesson-12-<name>-<role>; O = autocommit observer;
                                  // registers SIGINT once: closeAll(), exit 130
closeAll()                        // idempotent: O terminates lab backends still active, others ROLLBACK, all end()
blockersOf(O, pid, pids)          // roles or "phiên lạ pid=… app=…", from pg_blocking_pids
sessionState(O, pid)              // { state, wait_event_type, wait_event, hasXmin, hasXid }
waitUntil(fn, ms = 3000)          // bounded 20 ms poll confirming a state; never orders steps
warnForeign(O)                    // ⚠ per foreign session with backend_xmin/xid or a lab12 lock
walByXid(O, lsn0, lsn1, xids)     // [{ rmgr, type, dLsn, len }], len = record_length - fpi_length
heading, verdict, printTable, fmtInt, fmtMs, fmtBytes, jsonMode, emitJson

// tx-runner.mjs
runSteps(lab, steps, { title })   // prints # | Phiên | SQL | Kết quả | ms, returns { rows, by }
// step = [who, sql, flag?]; who 'A' | 'B' | 'O'; sql string or (ctx) => string, ctx = { pid, by }
// flag 'waits': started, O must see it blocked within 3 s; sql 'await': collect the pending result;
// other flags are labels: by[label] = { rows, rowCount, command, code, message, ms, waitedFor }
// SQLSTATEs are outcomes. Clean stop on: 55P03 without 'waits', 'waits' not blocked, foreign blocker,
// step sent to a session with a pending statement.

// scenarios.mjs
LEVELS, WALK = { contracts: 'contracts', reps: 'store_reps' }
scratchSql(prefix, n)             // <prefix>_contracts = hw_contracts ids 1..n; <prefix>_reps = 4 literal rows; autovacuum off
M1(t), M2(t), M3(t, level), forUpdateFix(t)
ANOMALIES                         // dirtyRead, nonRepeatableRead, phantom, lostUpdate, atomicUpdate, writeSkew:
                                  // { title, slide, steps(t, level), judge(r) → 'xảy ra' | 'không' | '40001' }
```

The runner never sends its own statement to A or B; all observation goes through O. A Repeatable Read snapshot therefore never moves.

The walkthroughs use Q = `SELECT xmin, xmax, ctid, total FROM contracts WHERE id = 1;` and C = `SELECT count(*) FROM store_reps WHERE store_id = 44 AND on_duty;`.

**M1** (note 4):

| Step | A | B |
|---|---|---|
| 1 | `BEGIN;`, Q | |
| 2 | | `UPDATE … SET total = total + 1 WHERE id = 1 RETURNING xmin, ctid;` |
| 3 | Q, `COMMIT;` | |
| 4 | steps 1–3 again with `BEGIN ISOLATION LEVEL REPEATABLE READ;` | |
| 5 | Q, then the UPDATE (`'waits'`), then `'await'` | `BEGIN;` and the UPDATE, held open; then `COMMIT;` |

In step 5, B opens its transaction first, A runs Q and then its UPDATE (which waits), and B's `COMMIT;` releases A.

**M2:**
- A runs `BEGIN;` and the UPDATE, and leaves it open.
- B runs `SET lock_timeout = '3s';` and the UPDATE (`'waits'`). B's `'await'` returns 55P03.
- O runs `SELECT pg_terminate_backend(<pid A>);`.
- B runs the UPDATE again.

**M3** (note 2):
- A and B each run `BEGIN ISOLATION LEVEL <level>;` and C.
- A updates rep 1, then B updates rep 2.
- A runs `COMMIT;`, then B runs `COMMIT;`.
- C runs once more, then the reset `UPDATE store_reps SET on_duty = true;`.

## Tasks and steps
1. Write `kit-smoke.mjs` against the interface, on scratch `l00_*` tables. It starts red.
2. Extend `tx-kit.mjs`, then write `tx-runner.mjs` and `scenarios.mjs`. Use Vietnamese comments and plain `['A', sql]` rows, with no classes.
3. Make the smoke test green, and check the line counts.
4. Write `delegate-brief.md`, modelled on lesson 3's brief. It covers:
   - `$ENV` and these frozen interfaces;
   - the plan.md rules and the print contract;
   - ownership and scratch prefixes, and the phase-05 DB etiquette;
   - the lab specifications, the TDD loop and the final message format.

   Then declare the freeze. Until phase 07, only the controller changes these three files, only additively, and each change is announced to the running delegates.

## Test matrix
| # | Smoke case (written first) | Expected |
|---|---|---|
| S1 | two non-blocking steps on A and B | 2 ok timeline rows |
| S2 | declared wait on A's row lock, released by A's COMMIT | O shows "chờ A"; `'await'` returns 1 row |
| S3 | undeclared wait (a third client holds the row) | 55P03 after 5 s, clean stop, run < 10 s |
| S4 | `'waits'` on a step that does not block | runner error "không bị chặn như khai báo" |
| S5 | O terminates B | 57P01 in `events`; process alive; `closeAll` ok |
| S6 | SQL as a function of `ctx.pid` and `ctx.by` | rendered and executed |
| S7 | RR snapshot not moved | A (RR) reads, B updates, A still reads the old value |
| S8 | after `closeAll` | `npm run check` exit 0, no `l00_*` |
| S9 | two smoke runs | empty masked diff |

Command: run `$ENV && node /d/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/kit-smoke.mjs > smoke1.txt 2>&1`, run it again into `smoke2.txt`, then run `mask-diff.mjs smoke1.txt smoke2.txt`.

## Verification
- The smoke test passes twice.
- `npm run check` exits 0.
- `wc -l tx-kit.mjs tx-runner.mjs scenarios.mjs` reports ≤ 160, ≤ 130 and ≤ 200.
- `node check-guide-evidence.mjs --print M1` prints M1 with `contracts`.

## Risks and rollback
- **The runner grows into a framework.** The line caps stop that, and lab-specific behaviour stays in its lab as plain code.
- **Lab 05 B assumes `pg` raises an idle client's FATAL as an `error` event.** S5 proves it for 57P01; lab 05 B measures 25P03.
- **Rollback:** delete `tx-runner.mjs`, `scenarios.mjs` and `kit-smoke.mjs`, and remove the added functions from `tx-kit.mjs`.

=== FILE: phase-05-labs-01-08.md ===
---
phase: 5
title: "Labs 01–08 (parallel lab writers)"
status: pending
priority: P1
effort: 5h
dependencies: [4]
---

## Goal
Four delegates write the eight labs against the frozen kit. Each lab is written test-first against its matrix rows.

## Files to create/modify (disjoint ownership)
Two path prefixes are used:
- `L` = `D:/study/advance-be/labs/lesson-12-transaction`.
- `T` = `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/tmp/<delegate>`, where each delegate writes its own outputs.

| Delegate | Creates | Scratch | npm |
|---|---|---|---|
| D1 | `L/01-atomicity-pg-rules.mjs`, `L/02-wal-records.mjs` | `l01_`, `l02_` | lab1, lab2 |
| D2 | `L/03-mvcc-two-sessions.mjs`, `L/04-dead-versions-horizon.mjs` | `l03_`, `l04_` | lab3, lab4 |
| D3 | `L/05-big-and-idle-tx.mjs`, `L/05-big-and-idle-tx-part-a.mjs`, `L/05-big-and-idle-tx-part-b.mjs` | `l05_` | lab5 |
| D4 | `L/06-levels-read-anomalies.mjs`, `L/07-lost-update.mjs`, `L/08-write-skew.mjs` | `l06_`–`l08_` | lab6–lab8 |

These files are read-only for every delegate: `tx-kit.mjs`, `tx-runner.mjs`, `scenarios.mjs`, `package.json` and everything under `verify/`. Only the controller runs `setup` or `reset`, or writes RUNS.

## Lab specifications
Every lab prints:
- the header `Lab 12.NN — <claim> (slide X–Y)`;
- one line with the server settings its story relies on;
- the matrix sections `A.`, `B.` and so on;
- computed `verdict()` lines.

Every lab also drops its scratch tables at the start and in `finally`, and calls `closeAll()`.

| Lab | Sessions / data | Measures |
|---|---|---|
| 01 | A + O; `l01_items`, `l01_seq` | **A:** an INSERT, `SELECT 1/0`, the next statement, the COMMIT tag, the row count. **B:** SAVEPOINT, a duplicate key, `ROLLBACK TO SAVEPOINT`, COMMIT. **C:** CREATE TABLE in a rolled-back transaction, then `to_regclass`. **D:** `nextval` before and after ROLLBACK. **E:** O's `state` after each step, with the psql glyph "theo tài liệu psql". |
| 02 | A + O; `l02_contracts` (10 rows) | **A/B:** lsn0, BEGIN, UPDATE 3 rows, `pg_current_xact_id()`, COMMIT or ROLLBACK, lsn1, `pg_current_wal_flush_lsn()`, then a `walByXid` table. **C:** 200 one-row commits with `synchronous_commit` on, then off (`SET LOCAL`), in ms only, for W2. |
| 03 | runner `M1(t)` on `l03_contracts` (ids 1–1,000) | **A:** RC. **B:** RR. **C:** pageinspect items for id 1's block and for the new version's block, in the schema `pg_extension` reports (today `lab03_indexing`). If pageinspect is absent, skip C with a notice. **D:** writer vs writer. `--json` feeds W3. |
| 04 | A, B, O; `l04_contracts` (100,000), `l04_chain` | Starts with `warnForeign`. **A:** UPDATE all rows, ROLLBACK, pages before and after, counts parsed from the `VACUUM (VERBOSE)` INFO. **B:** RC idle read-only; O reads `backend_xmin`; B updates 1,000 rows; VACUUM. **C:** the same at RR. **D:** A holds an RR snapshot while B takes id 1 to 100 and then 1,000 versions; `EXPLAIN (ANALYZE, BUFFERS)` lookup pages at 0, 100 and 1,000; A commits; VACUUM; one more lookup. |
| 05 A | A, O; `l05_one`, `l05_batch` (100,000 each) | One UPDATE vs 10 batches of 10,000 with VACUUM in between: `walByXid` records and bytes, pages afterwards, rows per transaction. |
| 05 B | runner `M2(t)` on `l05_idle`, then inline code | Starts with `warnForeign`. **B1/B2:** M2. **B3:** a third session sets `idle_in_transaction_session_timeout = '1s'`, updates a row and idles; `waitUntil` O no longer sees it; record its `events` code; a B UPDATE of that row needs no wait. `--json` feeds W5. |
| 06 | runner, `l06_contracts` | **A:** five SET TRANSACTION placements as plain steps (`SHOW transaction_isolation`, notices, codes). **B–D:** `ANOMALIES.dirtyRead`, `.nonRepeatableRead` and `.phantom` × 4 levels. `--json`. |
| 07 | runner, `l07_contracts` | **A:** `lostUpdate` × 4 levels. **B:** `atomicUpdate` × 4 levels. **C:** RR retry of the whole transaction after 40001, a plain loop of at most 3 attempts. `--json`. |
| 08 | runner `M3(t, level)` on `l08_reps` | **A:** RR. **B:** SER. **C:** retry of B as a guarded step (`ctx.by` count > 1, else ROLLBACK). **D:** stores 44 vs 45 at SER, default plan, then `SET enable_seqscan = off` labelled "(ép)", with the plan line printed and marked "tùy chọn". `--json`. |

## Tasks and steps (TDD loop per lab)
1. Read the lab's rows in `verify/expected-verdicts.json`. They are the test.
2. Write the lab: 200 lines or fewer, Vietnamese comments, no new kit helper.
3. Run it twice with `$ENV && npm run --silent labN > "$T/labNN.txt" 2>&1; echo "[exit $?]" >> "$T/labNN.txt"`, the second time into `labNN.run2.txt`. JSON labs also run `-- --json > "$T/labNN.json"`.
4. `node verify/mask-diff.mjs "$T/labNN.txt" "$T/labNN.run2.txt"` must exit 0.
5. `node verify/check-lab-runs.mjs --lab NN --dir "$T"` must exit 0. Report any ✘ together with its measurement. Never change data or steps to get a ✔.
6. `$PSQL "SELECT count(*) FROM pg_class WHERE relnamespace='lab12_transaction'::regnamespace AND relname LIKE 'lNN\_%'"` must return 0.

DB etiquette: run labs 04 and 05 only when `$PSQL "SELECT count(*) FROM pg_stat_activity WHERE application_name LIKE 'lesson-12%'"` returns 0. A ✘ printed under interference is not a finding.

## Test matrix
| # | Test | Expected | Command |
|---|---|---|---|
| T5.1 | matrix rows | sections, counts, signs, tokens | step 5 |
| T5.2 | determinism | empty masked diff | step 4 |
| T5.3 | cleanup | 0 scratch tables; no `lesson-12%` session | step 6 plus the etiquette query |
| T5.4 | static rules | ≤ 200 lines, computed verdicts, read-only lab03, Vietnamese header | inside step 5 |
| T5.5 | foreign warning (D2, D3) | with `foreign-session.mjs` running, labs 04 and 05 print the ⚠ line naming `foreign-test` | helper in the background, then the lab |

## Verification
Each delegate ends with the lesson-3 message: status, files, per-lab runtime, key numbers, and every ✘ or surprise. The controller then re-runs T5.1–T5.3 on each delivered lab.

## Risks and rollback
- **A lab needs a kit change.** The delegate reports NEEDS_CONTEXT. The controller decides, edits additively and informs every delegate.
- **Rollback:** delete that delegate's files. The others are unaffected.

=== FILE: phase-06-homework-and-typeorm-evidence.md ===
---
phase: 6
title: "Homework kit and TypeORM evidence"
status: pending
priority: P1
effort: 2.5h
dependencies: [4]
---

## Goal
This phase runs in parallel with phase 05. It has five outcomes:
- the refusal oracle turns green;
- homework B gets its measured solution;
- the AI draft runs safely with its four planted flaws;
- homework D is defined;
- the TypeORM API that the drill quotes is pinned.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/labs/lesson-12-transaction/homework-runner.mjs` | D5 |
| `D:/study/advance-be/labs/lesson-12-transaction/homework-predictions.solution.mjs` | D5 |
| `D:/study/advance-be/labs/lesson-12-transaction/homework-ai-draft.mjs` | D5 |
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/typeorm-api.txt` | controller |

The `.mine` file belongs to phase 02 and is not edited here. Scratch tables use the prefix `hw_`.

## Tasks and steps
1. **Runner** (≤ 200 lines, modelled on `labs/lesson-03-index/homework-runner.mjs:13-36, 90-96`).
   - It validates every row before connecting, and lists each `'???'` or invalid cell with the allowed values.
   - If no row is complete, it exits 1 without connecting.
   - For each complete row and level, it runs `scratchSql('hw', 1000)`, `runSteps` and `judge`, marks the cell ✔ or ✘, and prints the timeline of every ✘.
   - It then prints the 6×4 summary and the `why` lines. `REVIEW_ANSWERS` and part D print only if exported.
   - It exits 1 while any row was refused.
2. **Solution file.** It contains:
   - the 24-cell key from `expected-verdicts.json`;
   - six model `why` lines;
   - `REVIEW_ANSWERS`, the four flaws with their fixes;
   - `PART_D = true`. Part D runs `forUpdateFix(t)` at RC with three computed verdicts: B waited (observer); B's `SELECT … FOR UPDATE` returned 1 row and B refused; no 40001.
3. **AI draft** (≤ 200 lines; scratch `hw_draft_*`; kit `connect` for safety). Its four planted flaws lead it to confident, wrong conclusions:
   - one client plays both sessions;
   - `SET TRANSACTION … SERIALIZABLE` runs before `BEGIN`, so it only warns and RC applies;
   - its write-skew test updates rows that share no invariant;
   - COMMIT errors are swallowed.

   The draft never blocks, so it cannot hang, and it drops its tables in `finally`.
4. **TypeORM evidence** (controller). From unpkg, fetch `driver/postgres/PostgresQueryRunner.js` and `data-source/DataSource.d.ts` for `typeorm@0.3.20` and `@1.1.2`. Quote:
   - the `startTransaction` lines: `START TRANSACTION`, `SET TRANSACTION ISOLATION LEVEL`, `SAVEPOINT typeorm_`;
   - `release()`;
   - the `transaction(isolationLevel, runInTransaction)` overloads;
   - 1.x's `isolationLevel ??= this.dataSource.options.isolationLevel`.

   Add the upgrade-guide facts with their URLs and the date. When open question 1 is answered, add the learner's exact version.

## Test matrix
| # | Test | Expected | Command |
|---|---|---|---|
| H1 | untouched file, no `PG_URL` (written in 02) | exit 1, 24 ids, no connection | `node verify/test-homework-refusal.mjs` |
| H2 | invalid value (02) | row refused, allowed list shown | same |
| H3 | one row filled (02) | that row ✔, others refused, exit 1 | same, with `$ENV` |
| H4 | solution | 24 ✔, C answers, D 3 ✔, exit 0; two runs, empty masked diff | `npm run homework:solution` twice, then `mask-diff.mjs` |
| H5 | draft safety | exit 0 within 30 s; `check` exits 0 after it | `npm run homework:draft && npm run check` |
| H6 | evidence | both versions quoted | `grep -c "START TRANSACTION" verify/typeorm-api.txt` returns 2 or more |

## Verification
H1–H6 are green, and the static rules of `check-lab-runs.mjs` pass for the three files.

## Risks and rollback
- **The measured key differs from the expected one.** The solution follows the measurement and `deviations.md` records it. The guide narrative and the quiz follow it too.
- **Rollback:** delete the three LAB files and the evidence file.

=== FILE: phase-07-serial-runs-and-robustness.md ===
---
phase: 7
title: "Serial runs and robustness tests"
status: pending
priority: P1
effort: 1.5h
dependencies: [5, 6]
---

## Goal
The controller records every npm script serially on a quiet server, twice where determinism is claimed, and runs the Ctrl+C and foreign-session tests. These files are the only source of numbers, and the guide quotes run 1.

## Files to create/modify
The controller writes all of these into `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/lab-runs/`:
- setup and check: `reset.txt`, `setup.txt`, `setup-again.txt`, `setup-force.txt`, `check.txt`;
- labs, two runs each: `lab01.txt`–`lab08.txt` and `lab01.run2.txt`–`lab08.run2.txt`;
- JSON: `lab03.json`, `lab05.json`, `lab06.json`, `lab07.json`, `lab08.json`;
- homework: `hw-mine.txt`, `hw-draft.txt`, `hw-solution.txt`, `hw-solution.run2.txt`;
- robustness: `ctrlc-graceful.txt`, `ctrlc-kill.txt`, `foreign-check.txt`, `lab04-foreign.txt`;
- `runtimes.json`.

## Tasks and steps
1. Make sure the server is quiet: no `lesson-12%` session, and no foreign session holding an xmin (`$PSQL`).
2. Record each script with `$ENV`, as plan.md describes, in this order:
   1. `reset`, `setup`, `setup` again, `setup -- --force`, then `check`.
   2. For N = 1…8: `labN`, `check`, `labN` again into `.run2`, then `check`. Labs 3, 5, 6, 7 and 8 also run `-- --json`.
   3. `homework` (exit 1), `homework:draft`, `check`, `homework:solution` twice, then `check`.
   4. Record the seconds per script in `runtimes.json`.
3. Robustness tests:
   - **R3:** run `node verify/interrupt-lab.mjs --mode graceful`.
   - **R4:** run the same with `--mode kill`.
   - **R5:** start `foreign-session.mjs --seconds 60` in the background. Record `check` into `foreign-check.txt` and `lab4` into `lab04-foreign.txt`. Then stop the helper and run `check` again.
4. Run `check-lab-runs.mjs` over RUNS. If a result is ✘ against the matrix, keep the data and add a `deviations.md` row with the narrative change.

## Test matrix
| # | Test | Expected |
|---|---|---|
| R1 | full serial sequence | exit codes as in the matrix; `check` exits 0 after each lab |
| R2 | determinism | empty masked diff for labs 01–08 and `hw-solution` |
| R3 | graceful Ctrl+C during lab 05 B's wait | the lab exits 130 after "đã ROLLBACK và đóng phiên"; `check` exits 0 at once |
| R4 | abrupt kill during the same wait | `check` exits 0 within 30 s, bounded by `lock_timeout` 5 s and `idle_in_transaction_session_timeout` 20 s |
| R5 | foreign idle session | `check` exits 1 naming it; lab 04 prints its ⚠ line; `check` exits 0 once the helper is stopped |
| R6 | oracle | `check-lab-runs.mjs` exits 0 |

## Verification
- `node /d/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/check-lab-runs.mjs` exits 0.
- `npm run check` exits 0.
- The T1.1 fingerprint is unchanged.

## Risks and rollback
- **A non-deterministic lab.** The owner fixes how the value is printed, following the print contract; masking it away is not allowed. Then both runs are repeated.
- **Rollback:** delete RUNS, run `reset` and `setup`, and repeat the phase.

=== FILE: phase-08-teacher-guide-html.md ===
---
phase: 8
title: "Teacher guide HTML"
status: pending
priority: P1
effort: 7h
dependencies: [7]
---

## Goal
Assemble the Vietnamese guide from RUNS only, and turn G1–G4 green.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html` | controller |
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/links.txt` and `verify/render/` | controller; render-check output |

## Tasks and steps
1. **Shell.** Copy these parts of `reports/advanced_backend/lesson_03_index_teacher_guide.html`:
   - the CSS and dark mode (`:1-310`);
   - the rail and hero (`:313-345`);
   - the `store` wrapper (`:1714-1745`);
   - the quiz, exam and slide-map renderers (`:2060-2156`).

   Rename the storage keys to `l12-`. Set the eyebrow to "Advance Backend · Bài 12 / 16 · sau Bài 3 Index", and use slide 1's epigraph.
2. **Content.** Slides follow the roadmap order, and chips follow the contract table. Each day runs "làm mẫu → tự làm":
   - the worked examples are M1 (Day 02) and M3 (Day 03), with expected values folded;
   - the tự làm tasks are W5's "which pid, which timeout" (Day 02) and homework B and D (Day 03), each with grading criteria.

| Stage | Slides | Min | Content | Evidence |
|---|---|---|---|---|
| `#cach-hoc` | 1–2 | 5 | how to learn, the Day 02/03 table, environment (`docker start quan-ly-hop-dong-postgres-1`; PG_URL "như Bài 3 mục 6.3"; `npm run setup`/`check`), two psql windows opened with `docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab` and the preamble `SET search_path = lab12_transaction; SET idle_in_transaction_session_timeout = '10min'; SET lock_timeout = '2min';` with its reason, the GUI as an auto-commit observer | setup card |
| 1 | 3–5 | 20 | definition, ACID on PG, 25P02, SAVEPOINT, DDL, sequences | W1, lab01 |
| 2 | 11–12 | 20 | log first, COMMIT flush, ABORT without undo, the synchronous_commit trade-off | W2, lab02 |
| 3 | 13–15 | 40 | InnoDB undo (cited) vs PG heap versions; slide 15 filled with xmin, xmax, ctid and the first-statement snapshot; M1 = Day 02 done | W3, lab03, M1 |
| 4 | 14, 16 | 20 | purge vs VACUUM; ROLLBACK marks the xid aborted; HLL (cited; slide 16 numbers labelled) vs the PG horizon | lab04 |
| 5 | 17–21 | 30 | large, long, stalled and abandoned transactions; timeouts; terminate; no gap locks; M2 optional | W5, lab05 |
| 6 | 6–9, 22 | 30 | SET TRANSACTION placement; RU = RC; non-repeatable read; phantom | W4, lab06 |
| 7 | 8–10 | 40 | lost update, atomic update, write skew, SSI with retry; false positive optional; M3 = Day 03 done | W4, lab07, lab08, M3 |
| 8 | 23–26 | 80 | recap (slide 23 "Cần sửa"); `#bai-tap` A card, B predict/run/6 why lines, C flaw table (4 rows); `#nestjs-drill`; `#phong-van`; then `#bai-tap-d` (optional) | hw-*.txt |

   After stage 8 come:
   - `#cheat-sheet`;
   - `#ban-do-slide`, with 26 chips;
   - `#tham-khao`: slide 25's three sources, the PG 16 docs, MySQL 8.4 manual pages, and the TypeORM docs and source;
   - `#tiep-theo`, the lesson-14 teaser. The waiting writer and FOR UPDATE lead into Day 04, where 40P01 after `deadlock_timeout` (1 s here) will be measured. It ends with the contract's carry-over question.

   Optional extras add about 40 min: M2, lab 08 D and homework D.
3. **Widgets.** `div.widget#w1` to `#w5`, as in the contract. W3, W4 and W5 read the embedded JSON blocks `#run-lab03`, `#run-lab05`, `#run-lab06`, `#run-lab07` and `#run-lab08`, which are copied from RUNS.
4. **Evidence markup.**
   - Terminal blocks carry the label "Kết quả đã chạy trên máy bạn ngày dd/mm/2026 · npm run labN" and are verbatim, with `…` lines marking elisions.
   - Measured numbers in prose use `<b class="m" data-run="labNN">`.
   - MySQL facts go in `.cite-mysql` with a link.
   - Walkthrough tables (`table[data-walk]`) are pasted from `--print`. Their inputs use `data-store="l12-m1-…"`.
5. **Drill.** Write a NestJS service that uses only APIs present in both TypeORM lines and contains the contract's six bugs. Add six folded answers with fixes, and a version note that quotes `typeorm-api.txt`.
6. **Quizzes and prose.** 8 quizzes of 4 new-situation questions each, plus an exam of 10 with folded answers. Prose stays at 450 words or fewer per stage, with 3 sentences or fewer per paragraph.
7. **External links.** Fetch each link once, record its status in `links.txt`, and replace any dead link.

## Test matrix
| # | Test (written in phase 02) | Expected | Command |
|---|---|---|---|
| G1 | structure, slides, quizzes, prose, drill | exit 0 | `node verify/check-guide.mjs` |
| G2 | evidence, walkthroughs, widget data | exit 0 | `node verify/check-guide-evidence.mjs` |
| G3 | runtime views at 360 light, 400 dark and 1280; controls; persistence; `l3-*` intact | REPORT shows `errors: []`, `overflow: false`, persistence true | `"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --allow-file-access-from-files --user-data-dir="D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/tmp/edge" --virtual-time-budget=15000 --dump-dom "file:///D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/harness.html" \| grep REPORT` |
| G4 | screenshots, runtime errors, overflow | 0 errors | `TMP=<VERIFY>/tmp TEMP=<VERIFY>/tmp node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "<GUIDE>" --out "<VERIFY>/render" --viewports 360x800,768x1024,1440x900` |

## Verification
G1–G4 are green. Also review the screenshots and the dark `shot.html?a=w4` capture by eye.

## Risks and rollback
- **Too much prose.** G1 fails. Cut words and keep the tables.
- **A number without a source.** G2 fails. Quote it from RUNS or drop it.
- **Rollback:** delete GUIDE.

=== FILE: phase-09-ultra-review-and-fix-loop.md ===
---
phase: 9
title: "Ultra code review and fix loop"
status: pending
priority: P1
effort: 3h
dependencies: [8]
---

## Goal
Five independent reviewers and a verifier look for what the oracles cannot see. Every Critical and Important finding is fixed, and the labs it touches are re-run.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/review-packet.md` | controller |
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/review-union.md`, `review-verdicts.md` | review workflow |
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/tmp/pre-fix/` | controller (a copy of each file before its fix) |
| any LAB file or GUIDE named by a confirmed finding | the file's owner |

## Tasks and steps
1. Write `review-packet.md` on the lesson-3 model.
   - **Scope:** LAB `*.mjs`, `package.json`, GUIDE and RUNS.
   - **Context:** the packet, the contract, the matrix and the print contract.
   - **Not to flag:** the draft's planted flaws, the masked classes, the scratch copies from `hw_contracts`, the lab 05 split and the "?" claims.
   - **Allowed:** read-only `$PSQL` checks only. Reviewers do not run labs.
   - **Output per finding:** severity, `file:line`, defect, failure scenario and fix.
2. Run `/ak:code-review --ultra` with the packet. The verifier writes the union and the verdicts.
3. Copy each file into `pre-fix/` before fixing it.
   - Fix every confirmed Critical and Important finding.
   - Fix a Minor finding only if it takes under 15 minutes; list the rest as left by choice.
4. Re-run each touched lab twice into RUNS, then run the masked diff, `check` and `check-lab-runs.mjs --lab NN`. If a quoted output changed, re-paste it into GUIDE and re-run G1–G3.

## Test matrix
| # | Test | Expected |
|---|---|---|
| V1 | `review-verdicts.md` | 0 open Critical or Important |
| V2 | re-run labs | empty masked diff; `check` exits 0 |
| V3 | guide after a re-paste | G1–G3 green |
| V4 | regression | `check-lab-runs.mjs` over all of RUNS exits 0 |

## Verification
`node verify/check-lab-runs.mjs && node verify/check-guide.mjs && node verify/check-guide-evidence.mjs && $ENV && npm run check`

## Risks and rollback
- **A finding asks to reverse a contract decision.** Show the user the trade-off and the options. Never apply it silently.
- **Rollback of a fix:** copy the file back from `pre-fix/` and re-run its lab.

=== FILE: phase-10-test-gate-docs-final.md ===
---
phase: 10
title: "Test gate, docs route and final gate"
status: pending
priority: P1
effort: 1h
dependencies: [9]
---

## Goal
Prove that the coverage is honest, add the README route to the new lab and guide, and close with the full gate.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/README.md` (route lines only) | controller via `/ak:docs update` |
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/readme-before.txt` | controller |
| `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/plan.md` (delivery record) | controller |

## Tasks and steps
1. **Coverage honesty.** Coverage counts as honest when:
   - every npm script has a RUNS file that ends with its exit code;
   - every acceptance criterion has a command that ran green;
   - the negative tests T2.3, T3.5, S3, R3, R4, R5, H1 and H2 are recorded.

   Only a gap triggers `/ak:test`, and only for that gap.
2. **README route.** Save the current README lines in `readme-before.txt`. Then run `/ak:docs update`, limited to README.md:
   - add `labs/lesson-12-transaction/` to the Advanced Backend labs line;
   - add both new paths to the tree.

   Create no other file, no `docs/` folder and no new Markdown.
3. **Final gate.** All of these must pass:
   - `npm run check`, `check-lab-runs.mjs`, `check-guide.mjs` and `check-guide-evidence.mjs`;
   - the harness REPORT;
   - render-check, with 0 errors;
   - `git status --porcelain` adds to `git-status-before.txt` only these lines: `?? labs/lesson-12-transaction/`, `?? reports/advanced_backend/lesson_12_transaction_teacher_guide.html` and ` M README.md`;
   - `find /d/study/advance-be/labs/lesson-12-transaction -name '*.md' -not -path '*/node_modules/*'` prints nothing;
   - `test -e` passes for each new README path.
4. **Delivery record.** Write it into plan.md: outputs, deviations, review counts and the items left by choice. Change the plan status only through the `ak plan` CLI, after reading `ak plan --help`.

## Test matrix
| # | Test | Expected |
|---|---|---|
| F1 | acceptance criteria 1–14 | every command green |
| F2 | git status diff | only the three expected new lines |
| F3 | Markdown rule | no `.md` under LAB, none new under `reports/` |
| F4 | README route | both paths exist |

## Verification
Run the final-gate commands of step 3.

## Risks and rollback
- **`/ak:docs` proposes wider edits.** Refuse them; only the README route lines change.
- **Rollback:** restore the README lines from `readme-before.txt`. Everything else rolls back as plan.md describes.
