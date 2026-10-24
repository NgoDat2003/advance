=== FILE: plan.md ===
---
title: "Lesson 12 (Transaction) teacher guide + lab12_transaction labs"
description: "Test-first plan: dataset and invariants, lean two-session kit, 8 measured labs, homework matrix, 8-stage Vietnamese guide, ultra review, docs."
status: pending
priority: P1
effort: 29h
branch: main
tags: [lesson-12, transaction, postgres, mvcc, teacher-guide, tdd]
blockedBy: []
blocks: []
created: 2026-10-24
---

# Lesson 12 (Transaction): plan

## Overview

The plan delivers Candidate E unchanged: `reports/advanced_backend/lesson_12_transaction_teacher_guide.html` (Vietnamese, lesson-3 shell, 8 stages, 5 widgets, exam, cheat sheet, 26-chip slide map, lesson-14 teaser) and `labs/lesson-12-transaction/` (npm scripts `setup`, `check`, `reset`, `lab1`–`lab8`, `homework`, `homework:draft`, `homework:solution`). Day 02 teaches mechanism (stages 1–5: ACID, WAL, MVCC, dead versions, big/idle transactions); Day 03 teaches isolation (stages 6–8: levels, lost update, write skew, SERIALIZABLE, homework, NestJS drill, exam).

Every number in the guide comes from `lab-runs/*.txt` produced on this machine (PG 16.15 container). MySQL facts are cited and labelled "không đo trên máy này". Work stays on `main`, uncommitted. The only git command planned is `git status`.

TDD order: invariants and `check` first (P1), then the kit self-test, expected-verdict matrix, masked-diff tool and guide verifier (P2), only then labs (P3–P4), homework runner refusal test before the runner (P5), serial runs (P6), and HTML (P7–P8).

Working directory for all commands below: `D:/study/advance-be/labs/lesson-12-transaction` unless a path is given. Plan dir: `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide` (written `PLAN/`).

## Contract and must-fix resolution

| # | Must-fix | Resolution | Where |
|---|---|---|---|
| 1 | Homework B load | Grid stays 6×4 enum cells; one `why` line per scenario row (6 lines), not per cell. Runner lists `'???'` in 24 cells + 6 why lines (30 max). Selftest asserts the count. | P5, P8 stage 8 |
| 2 | SSI failure step | Step order frozen in `scenarios.mjs`: A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT. Answer key "the second COMMIT" (`40001 … read/write dependencies`). M3 table split so the two COMMITs are separate rows. Re-measured into `lab-runs/lab08-*`. | P2, P4, P6, P8 |
| 3 | Lab 05 overload | `05-big-and-idle-tx.mjs` is a 2-line entry importing `-part-a` (large transaction) and `-part-b` (idle/abandoned). One concept each, ≤ 200 lines. | P4 |
| 4 | M1 step 5 third window | Exactly two psql windows. B leaves UPDATE open; A (after its own COMMIT) reads (not blocked), then updates (blocks); GUI observer shows `pg_blocking_pids`. | P2 (`manual.M1`), P8 |
| 5 | AC7 fingerprint | `check` primary invariants: `hw_contracts` 500,000 rows, `relpages`/`relallvisible` 5,666/5,666, id 1 at xmin 875 / ctid (0,1). `n_tup_upd/n_tup_del = 0` printed as informational only, never a verdict. | P1 |
| 6 | TypeORM version | P1 asks the user; reply stored in `PLAN/lab-runs/typeorm-version.txt`. Drill pins docs to 0.3.20 and 1.1.2, labels each difference, API names checked against both `.d.ts` files. | P1, P6, P8 |
| 7 | `pg_walinspect` range | Lab 02 captures `pg_current_wal_lsn()` before BEGIN and after COMMIT/ROLLBACK, queries that range, filters `WHERE xid = $1`, prints record types and relative offsets only (LSNs masked). | P3 |
| 8 | Homework D scope | `--part=d`, optional, placed after the exam in stage 8, outside the 4.75 h budget, labelled as lesson-14 bridge. | P5, P8 |
| 9 | Markdown only under `plans/` or `docs/` | No new `.md` outside those folders (lab folder has none; guide is `.html`; lab-runs are `.txt`). `selftest-static` and the P10 gate list new files by extension. | P2, P10 |
| 10 | Database-level `search_path` | `advance_be_lab` has `search_path = lab03_indexing, public`. Every kit session passes `search_path=lab12_transaction` as a startup option (no extra statement, so no snapshot moves). Every psql window runs `SET search_path = lab12_transaction;`. `check` asserts the db-level setting is untouched. Warm-up stage shows `SHOW search_path;` and explains why. | P1, P2, P8 |

Settled decisions kept as written: Node runner with sessions A, B plus an observer; same steps replayed in two psql windows (`docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab`); dataset copy `contracts` (ids 1–100,000) + `store_reps`; own kit (~120-line runner) + `scenarios.mjs`; 5 widgets; homework A–D + 6-bug NestJS drill; verdict chips; lesson-14 bridge; `l12-*` storage keys; GUI as observer only.

## Phases

| # | Name | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | Preflight, dataset, invariants | 2h | none | `node selftest-check.mjs` green; `npm run setup && npm run check` pass |
| 02 | Kit, scenarios, test harness (frozen interfaces) | 3h | 01 | `node selftest-kit.mjs`, `node selftest-static.mjs` green; interfaces frozen |
| 03 | Labs 01–04 (Day 02 mechanism) | 3h | 02 | each lab: `--plan` ok, first run all ✔ |
| 04 | Labs 05a/05b–08 (big/idle, isolation) | 4h | 02 | each lab: `--plan` ok, first run all ✔ |
| 05 | Homework runner, template, draft, solution | 2.5h | 02 | `node selftest-homework.mjs` green |
| 06 | Serial runs, evidence, TypeORM API check | 2h | 03, 04, 05 | `node run-all.mjs` zero diff; `npm run check` after full run and after kill |
| 07 | Guide part 1: shell, stages 0–5, W1–W3, W5 | 4h | 06 | `node verify-guide.mjs --stages=0-5` green |
| 08 | Guide part 2: stages 6–8, W4, exam, map, chips | 4h | 07 | `node verify-guide.mjs` green; render check clean |
| 09 | Ultra code review and fix loop | 3h | 08 | no open Critical/Important; affected labs re-run, zero diff |
| 10 | Docs and final gate | 1.5h | 09 | all acceptance criteria checked; `git status` shows only expected paths |

Parallel window: P03, P04, P05 may run as three delegates after P02 freezes the interfaces. Delegate file ownership is disjoint (see phase files). The controller owns everything else, all DB runs and the HTML.

Dependency graph: 01 → 02 → {03, 04, 05} → 06 → 07 → 08 → 09 → 10.

## Expected-verdict matrix summary

Source of truth: `expected-verdicts.mjs` (P2). Cells marked *M* have no prior probe and are measured first; if the measurement contradicts, the narrative and the expectation change, never the recorded data.

| Lab | Claims | Expected verdicts |
|---|---|---|
| 01 atomicity | error → `25P02`; COMMIT after error replies `ROLLBACK`; SAVEPOINT keeps the transaction; DDL rolls back; sequence not rolled back | tag = ROLLBACK; row count after rollback-to-savepoint; table absent; `nextval` gap ≥ 1 (*M* for tag and gap) |
| 02 WAL | change logged before commit; COMMIT record exists; rollback leaves an abort record, no undo; flush LSN ≥ commit LSN | record types by xid (*M* names); `flush_lsn ≥ commit_lsn` true |
| 03 MVCC | UPDATE creates a new version; reader/writer do not block; RC sees new, RR sees old with `xmax` = writer xid; second writer waits | new ctid ≠ old; writer finishes while reader open; observer: `Lock`/`transactionid`, blockers = [A]; RC new value, RR old value |
| 04 dead versions | fast ROLLBACK leaves dead tuples; open RR snapshot blocks cleanup; lookups touch more pages | dead = N after rollback; "not yet removable" = N while snapshot open; removed = N after close; pages at 0/100/1,000 versions non-decreasing, last > first (*M* counts) |
| 05a big tx | one UPDATE holds all locks until commit; batches release | B waits on late row with big tx; B passes with batches; WAL bytes and size recorded (no numeric verdict) |
| 05b idle tx | idle tx blocks writers; `55P03`; `25P03`; terminate | blocked = true; `55P03`; victim gets `25P03` (expected `error` event); after terminate victim error `57P01`; RC read-only idle holds no `backend_xmin` (*M*) |
| 06 levels | RU = RC; no dirty read; non-repeatable read and phantom only at RU/RC; SET TRANSACTION placement | dirty: không ×4; NRR: xảy ra, xảy ra, không, không; phantom same; SET before BEGIN warns; SET after first query errors (*M* code) |
| 07 lost update | app read-modify-write loses at RU/RC, `40001` at RR/SER; atomic update safe at RC | app: xảy ra, xảy ra, 40001, 40001; atomic: không, không, 40001 (*M*), 40001 (*M*) |
| 08 write skew | RR both commit (0 on duty); SER second COMMIT `40001`; retry sees 1 and refuses; seq-scan false positive | RU/RC/RR: xảy ra; SER: 40001 at B's COMMIT, count 1; retry refuses; false positive reproduces or is labelled "không tái hiện, dẫn docs" (*M*) |

Homework 6×4 key (RU/RC/RR/SER): dirty read không×4; non-repeatable read xảy ra, xảy ra, không, không; phantom same; app lost update xảy ra, xảy ra, 40001, 40001; atomic update không, không, 40001, 40001; write skew xảy ra, xảy ra, xảy ra, 40001.

## Acceptance criteria

| # | Criterion (check command) | Phase |
|---|---|---|
| 1 | Page uses lesson-3 shell, 8-stage rail, `l12-*` keys in try/catch, no `l3-` key, hero "Bài 12 / 16" (`node verify-guide.mjs`: ids `chang-1`…`chang-8`, `phong-van`, `cheat-sheet`, `ban-do-slide`) | 07, 08 |
| 2 | Offline except fonts; light/dark; no overflow at 360 px; no console errors (`verify-guide.mjs` external-URL scan + render-check + 360 px browser check) | 08 |
| 3 | 26 chips, all hrefs resolve; slides 7, 9, 10, 13–16, 20, 22, 23 have pg mark, `callout pg`, chip and lab reference (`verify-guide.mjs` over `SLIDES`) | 08 |
| 4 | Each stage has goal, `wwh` grid, widget or verbatim lab block, quiz 3–5 questions with valid answer index; exam and references present | 07, 08 |
| 5 | Every npm script runs; `wc -l` ≤ 200 per file; no literal `verdict(true` (`node selftest-static.mjs`) | 02–05, 10 |
| 6 | Each lab run twice; masked diff empty; every `<span class="m" data-run=…>` number found in `lab-runs/` (`node run-all.mjs`, `verify-guide.mjs`) | 06, 07, 08 |
| 7 | `npm run check` passes after full run and after killed run: only expected objects, no `lesson-12*` session or lab12 lock, lab03 fingerprint intact | 01, 06 |
| 8 | Walkthrough SQL in guide equals `scenarios.mjs` rendering; fill-in cells persist (`verify-guide.mjs --walkthrough`; browser reload test) | 08 |
| 9 | Blank homework refuses (exit 1, lists cells); `homework:solution` prints 6×4 all ✔ plus C and D answers; `homework:draft` safe; three outputs in `lab-runs/` | 05, 06 |
| 10 | Drill has 6 bugs with folded answers; API names checked against 0.3.20 and 1.1.2 `.d.ts` and the learner's version | 06, 08 |
| 11 | No `postgres://`, `PGPASSWORD`, `POSTGRES_PASSWORD` in new files outside `plans/`; `git status` shows only expected paths; no new `.md` outside `plans/`/`docs/` | 10 |
| 12 | Every session sets search_path/timeouts/error listener; lab03 data untouched (fingerprint equal before and after) | 01, 02, 06 |
| 13 | Ultra review: all Critical/Important fixed, affected labs re-run with zero diff | 09 |
| 14 | README route added via `/ak:docs update` | 10 |

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| Measurement contradicts an expectation | M×M | Verdict ✘ fails the lab; controller edits `expected-verdicts.mjs` and narrative, notes it in `lab-runs/CONTRADICTIONS.txt`; data never edited |
| Another session (GUI) holds `backend_xmin` and skews lab 4/5a | M×M | Observer warns and aborts the lab before measuring; manual windows and GUI end transactions first |
| Windows `kill` skips the SIGINT handler | H×L | Server drops the connection; idle timeout 60 s as backstop; `check` polls up to 5 s; real Ctrl+C tested once in a pty |
| Delegates collide on DB state | M×H | Delegates only write files and run `--plan`; controller runs labs serially |
| PG docs/message text differs from expected | M×L | Verdicts key on SQLSTATE and counts, not message text |
| 4.75 h overrun | M×M | M2, the false-positive part and homework D are optional |
| `lab03_indexing` reset by learner mid-lesson | L×M | `setup` and `check` fail with a clear "chạy lại setup bài 3" message |

Rollback: `npm run reset` drops schema `lab12_transaction` and extensions owned there; delete `labs/lesson-12-transaction/`, the guide `.html`, and plan reports. Nothing outside these is edited except the README route (P10, one reversible hunk). Lesson-3 files are never modified, so nothing to restore.

## Open questions for the user

1. Which TypeORM version does `D:\work\maycha\quan_ly_hop_dong` use (`npm ls typeorm`)? The drill defaults to both 0.3.20 and 1.1.2 until answered.
2. Lesson 3 still names the old container and "Bài 4" teaser. Not edited here. Fix it separately?
3. The roadmap's literal UPDATE on `hw_contracts` is replaced by the `contracts` copy. Confirm.

=== FILE: phase-01-preflight-dataset-invariants.md ===
---
phase: 01
title: "Preflight, dataset, invariants"
status: pending
priority: P1
effort: 2h
dependencies: []
---

## Goal

A safe `lab12_transaction` schema exists with `contracts` (100,000 rows) and `store_reps`, an idempotent `setup`/`reset`, and a `check` that enforces the invariants. The invariants and their negative tests exist before anything else.

## Files to create/modify (all owner: controller)

- `labs/lesson-12-transaction/package.json` (pin `"pg": "8.16.3"`, scripts exactly: `setup`, `check`, `reset`, `lab1`–`lab8`, `homework`, `homework:draft`, `homework:solution`; extras run through `node` directly)
- `labs/lesson-12-transaction/conn.mjs` (≤ 60 lines: resolve connection like lesson-3 kit, build client config, scrub the URL from errors)
- `labs/lesson-12-transaction/setup.mjs`, `reset.mjs`, `check-lab-state.mjs`
- `labs/lesson-12-transaction/selftest-check.mjs`
- `PLAN/lab-runs/` (dir), `PLAN/lab-runs/fingerprint-before.txt`

## Tasks and steps

1. Read the connection section of `labs/lesson-03-index/pg-explain-kit.mjs` and `check-lab-state.mjs` for the `PG_URL` mechanism and the schema holding `hw_contracts` ([UNVERIFIED]: expected `lab03_indexing.hw_contracts`). Copy the mechanism, drop its `search_path` and `application_name` forcing.
2. Install `pg`: `npm install --offline`; fallback copy `labs/lesson-03-index/node_modules` (same 8.16.3 in `package-lock.json`). Check `git check-ignore labs/lesson-12-transaction/node_modules`; if not ignored, list it in the expected-paths set instead of editing `.gitignore`.
3. Ask the user the TypeORM question (open question 1). Record the answer or "chưa trả lời" in `PLAN/lab-runs/typeorm-version.txt`.
4. **Tests first** (`selftest-check.mjs`), then code. Write `check-lab-state.mjs` to satisfy them:
   - Invariants (exit 1 with a named failure otherwise): `lab03_indexing.hw_contracts` has 500,000 rows, `relpages = relallvisible = 5666`, id 1 at xmin 875 / ctid (0,1); `pg_db_role_setting` for `advance_be_lab` still `search_path=lab03_indexing, public`; schema `lab12_transaction` holds only expected tables (`contracts`, `store_reps`, `l*_` scratch tables allowed by prefix pattern); extensions in `lab12_transaction` only `pg_walinspect` (and `pageinspect` only if setup had to install it); no session with `application_name LIKE 'lesson-12%'` and no lock held by one; `hw_contracts` `n_tup_upd`/`n_tup_del` printed as "thông tin", never failing.
   - Foreign sessions (blank `application_name`, the GUI pool) are ignored.
5. `setup.mjs`: idempotent; `--force` drops and rebuilds. Creates schema; `contracts` = `INSERT … SELECT … FROM lab03_indexing.hw_contracts WHERE id BETWEEN 1 AND 100000` with primary key (id 1 stays HD0000001, store 44); `store_reps(store_id, rep_id, name, on_duty, PK(store_id, rep_id))`, stores 44 and 45, two on-duty reps each, ASCII names; `CREATE EXTENSION pg_walinspect SCHEMA lab12_transaction`. `pageinspect` is one-per-database: if it exists (lab 3 owns it), labs call it via a kit helper that resolves its schema from `pg_extension`; otherwise setup installs it into `lab12_transaction`. Prints a dataset card (row counts, store 44 reps, versions, search_path advice). If `hw_contracts` is missing: print "chạy lại setup bài 3", exit 1, write nothing.
6. `reset.mjs`: drops schema `lab12_transaction CASCADE` and extensions whose `extnamespace` is that schema. Never touches other schemas.
7. Capture the lab03 fingerprint before any write: `PLAN/lab-runs/fingerprint-before.txt`.

## Test matrix

| Test (written first) | Expected | Command |
|---|---|---|
| Fresh check before setup | exit 1, "schema chưa có" | `node selftest-check.mjs` (case 1) |
| After `setup` | exit 0, dataset card has 100,000 / 8 rows | `npm run setup && npm run check` |
| Second `setup` | no error, same counts (idempotent) | `npm run setup` |
| Foreign idle session (blank app name) open | check passes | selftest case 3 |
| Ghost session `application_name='lesson-12-ghost'` in transaction | exit 1, names the pid, then cleaned in `finally` | selftest case 4 |
| Stray table `lab12_transaction.oops` | exit 1, lists `oops` | selftest case 5 |
| Fingerprint drift simulated by pointing the check at a throwaway table with wrong counts (never the real one) | exit 1 | selftest case 6 |
| `setup` with `hw_contracts` hidden (run against a non-existent schema name via env override) | exit 1, message, no schema change | selftest case 7 |
| Error output | never contains the connection string | selftest greps captured stderr |

## Verification

```
npm run setup && npm run check
node selftest-check.mjs
npm run reset && npm run check   # expected: exit 1 (schema gone), then:
npm run setup && npm run check
```

## Risks and rollback

- `hw_contracts` schema qualification wrong: step 1 resolves it before code. Nothing else depends on the guess.
- Rollback: `npm run reset`; delete the folder.

=== FILE: phase-02-kit-scenarios-test-harness.md ===
---
phase: 02
title: "Kit, scenarios, test harness (frozen interfaces)"
status: pending
priority: P1
effort: 3h
dependencies: [01]
---

## Goal

Freeze everything delegates and the guide depend on: the two-session kit, `scenarios.mjs`, `expected-verdicts.mjs`, the output-mask tool and the guide verifier, all with passing self-tests, before any lab exists.

## Files to create/modify (all owner: controller; frozen at the end of this phase)

- `labs/lesson-12-transaction/lab-kit.mjs` (print helpers, session factory, cleanup; ≤ 200 lines)
- `labs/lesson-12-transaction/runner.mjs` (step runner with observer-confirmed waits; target ≈ 120 lines)
- `labs/lesson-12-transaction/scenarios.mjs` (plain `['A', sql]` rows; ≤ 200 lines, split to `scenarios-part-b.mjs` if needed)
- `labs/lesson-12-transaction/expected-verdicts.mjs`
- `labs/lesson-12-transaction/mask-output.mjs`
- `labs/lesson-12-transaction/verify-guide.mjs` (structure checks; number checks need `lab-runs/`)
- `labs/lesson-12-transaction/selftest-kit.mjs`, `selftest-static.mjs`

## Frozen interfaces

```js
// lab-kit.mjs
export const SCHEMA = 'lab12_transaction';
export async function withLab(name, fn)      // builds clients INSIDE try; SIGINT/SIGTERM + finally: ROLLBACK, end all
export function open(role)                   // 'A'|'B'|'C'|'obs' -> { q(sql, params), role, pid }
  // pg Client options: application_name 'lesson-12-<role>',
  // options '-c search_path=lab12_transaction -c lock_timeout=5s -c statement_timeout=15s
  //          -c idle_in_transaction_session_timeout=60s'; client.on('error') always attached
export function title(s); say(s); show(rows); // volatile columns print as key=value (xid=, xmin=, xmax=, pid=, lsn=, ms)
export function verdict(label, actual, expected) // computed; prints ✔/✘; sets process.exitCode=1 on ✘
export const flags;                          // { json, plan } from argv
export function pageinspectSchema(admin)     // resolves where pageinspect lives
// runner.mjs
export async function run(steps, { level, onNotice })  // -> timeline [{n, who, sql, rows|error:{code,message}, ms, waited}]
// step row: ['B', sql]  or  ['B', sql, { wait: 'A' }]   // wait: the step will block on A; it is not awaited
// until the observer confirms pg_blocking_pids(B) includes A's pid (cap 5 s, else error 'wait-not-confirmed');
// the blocked promise is awaited after the next step releases it. Token {LEVEL} in sql is replaced by level.
// scenarios.mjs
export const SCENARIOS = { dirtyRead, nonRepeatableRead, phantom, lostUpdateApp, atomicUpdate, writeSkew, guardForUpdate };
// each: { setup: [sql], steps, classify(timeline) -> 'xảy ra'|'không'|'40001' }
export const manual = { M1, M2, M3 };        // steps for two psql windows; manualText(name, level) renders text
// expected-verdicts.mjs
export const LABS;                           // { lab03: [{claim, key, expected|'measure'}], ... }
export const MATRIX;                         // 6 scenarios × RU/RC/RR/SER
```

Rules baked in: the runner never injects its own statement into A or B (it would move a Repeatable Read snapshot); only the observer connection runs probes. Writers declare a wait with `{ wait }`; an undeclared block surfaces as `55P03` from `lock_timeout`. Verdicts compare computed values; `verdict(true …` literal is banned. Scenario `writeSkew` order: A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT. M1 uses two windows only (A plays the second writer). M3 lists the two COMMITs as separate rows. Vietnamese comments throughout.

## Tasks and steps

1. **Write tests first**: `selftest-kit.mjs`, `selftest-static.mjs`, then `expected-verdicts.mjs` (probe values from the packet §3; *M* cells as `'measure'`), then `mask-output.mjs` rules (ms, `xid|xmin|xmax|pid|lsn` as `key=value`, JSON fields of the same names), then `verify-guide.mjs`. Run them red.
2. Implement `lab-kit.mjs`, `runner.mjs`, `scenarios.mjs` until green.
3. `--plan` flag: prints the step table without connecting (delegates use it).
4. `--json`: prints one JSON object `{ lab, timelines, verdicts }` and suppresses prose.
5. Define `manualText()` so the guide's walkthrough blocks are generated, not hand-typed.
6. `verify-guide.mjs` flags: `--stages=a-b`, `--walkthrough`; checks listed in P07/P08 plus no `postgres://|PGPASSWORD|POSTGRES_PASSWORD`, no `verdict(true`, number spans vs `lab-runs/`, embedded JSON equals `lab-runs/*.json`.
7. Announce the freeze: after this phase delegates may not edit any file above; they ask the controller.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| Session options | `SHOW search_path` = `lab12_transaction`; `SHOW lock_timeout` = `5s`; app name `lesson-12-A` | `node selftest-kit.mjs` |
| Error listener | server-side `pg_terminate_backend` on session B does not crash Node; recorded as event | selftest |
| Observer-confirmed wait | scenario with `{wait:'A'}` completes; timeline `waited:true` | selftest |
| Undeclared wait | step without `{wait}` blocked by A → `55P03` in timeline, run still cleans up | selftest |
| `finally` cleanup | after a thrown step, `pg_stat_activity` has no `lesson-12*` row | selftest |
| `--plan` | exits 0 without any connection (run with an invalid `PG_URL`) | `PG_URL=x node scenarios-demo --plan` inside selftest |
| Mask determinism | two runs of a tiny scenario differ only before masking; equal after | selftest |
| `PG_URL` never printed | forced connection failure output has no URL text | selftest |
| Static | every `*.mjs` ≤ 200 lines; no `verdict(true`; no secrets strings | `node selftest-static.mjs` |
| Verifier negative | `verify-guide.mjs` on an empty/absent guide exits 1 listing missing ids | selftest |
| MATRIX shape | 6 × 4 cells, enum values only | selftest |

## Verification

```
node selftest-kit.mjs && node selftest-static.mjs
npm run check
```

## Risks and rollback

- Runner grows into a framework: cap at 200 lines, steps stay plain rows; split a helper rather than add options.
- Interface needs a change after freeze: the controller edits and re-notifies delegates; selftests rerun.
- Rollback: delete the files; P01 artefacts remain valid.

=== FILE: phase-03-labs-01-04-day02-mechanism.md ===
---
phase: 03
title: "Labs 01–04 (Day 02 mechanism)"
status: pending
priority: P1
effort: 3h
dependencies: [02]
---

## Goal

Four labs that measure atomicity rules, WAL records, MVCC with two sessions, and dead versions with the VACUUM horizon. Verdicts computed from the frozen matrix.

## Files to create/modify (owner: delegate A, one delegate; no other phase touches these)

- `labs/lesson-12-transaction/01-atomicity-pg-rules.mjs`
- `labs/lesson-12-transaction/02-wal-records.mjs`
- `labs/lesson-12-transaction/03-mvcc-two-sessions.mjs`
- `labs/lesson-12-transaction/04-dead-versions-horizon.mjs`
- Overflow files only if a lab exceeds 200 lines: `NN-<slug>-part-a.mjs`/`-part-b.mjs`, with the entry becoming a 2-line importer (`import './NN-…-part-a.mjs'; import './NN-…-part-b.mjs';`).

Delegate may read the frozen kit, scenarios and expected-verdicts; it may not edit them and may not touch the database (only `node <lab> --plan` and `node --check`). Controller owns `package.json` scripts `lab1`–`lab4` (already present from P01).

## Delegate brief

Lab size ≤ 200 lines; Vietnamese comments; one idea per section with `title()`; verdicts via `verdict(label, actual, expected)` with `expected` read from `expected-verdicts.mjs`; scratch tables `l01_*`…`l04_*` created in `lab12_transaction` with `autovacuum_enabled = false`, dropped and recreated at start (re-runnable); all work through `withLab`; volatile values only through kit formatters.

Per lab:
- **01 (slides 4–5, session S, one client):** error → next statement `25P02`; COMMIT after error returns tag `ROLLBACK` (read from the pg result `command`); SAVEPOINT / ROLLBACK TO keeps the transaction usable; DDL (`CREATE TABLE`) rolled back; `nextval` gap after rollback.
- **02 (slides 5, 12):** `lsn0 = pg_current_wal_lsn()` before BEGIN, INSERT/UPDATE, COMMIT, `lsn1` after; query `pg_get_wal_records_info(lsn0, lsn1)` filtered `WHERE xid = $1` (xid from `txid_current()`-style via `pg_current_xact_id()` inside the transaction); print `resource_manager`, `record_type`, relative offset (record start − lsn0, in bytes); verdict `flush_lsn >= commit record start`; repeat with ROLLBACK to show the abort record and no undo manager. Use the extension schema from `pageinspect`-style resolution (`pg_walinspect` lives in `lab12_transaction`, on `search_path`).
- **03 (slides 13–15, runner + observer, `--json`):** UPDATE one row with `RETURNING xmin, ctid`; RC reader sees new; RR reader sees old with `xmax` = writer xid and the old ctid; read both versions through `pageinspect` (`heap_page_items`, schema from the kit helper); second writer `{wait:'A'}` confirmed by the observer (`wait_event_type = Lock`, `wait_event = transactionid`, blockers list A); release by A's COMMIT.
- **04 (slides 13–14, 16):** UPDATE N rows then ROLLBACK, `pgstattuple` dead count; open RR reader, `VACUUM (VERBOSE)` captured through `onNotice` (parse "removed" and "dead but not yet removable"; if the PG 16.15 text differs, change the parser, not the data); close reader, VACUUM removes; page counts via `EXPLAIN (ANALYZE, BUFFERS)` for a lookup at 0/100/1,000 versions of one row. Abort before measuring if the observer sees another session with `backend_xmin` or `backend_xid`.

## Tasks and steps

1. Delegate writes each lab against `--plan` until the printed step table matches the lab's section list.
2. Controller integrates, then serial first run: `npm run lab1` … `npm run lab4`. All ✔ expected. A ✘ triggers the contradiction procedure (P06 §3): update expectation and narrative note, not data.
3. Controller fixes interface-level bugs in the frozen files, re-running `node selftest-kit.mjs`.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| Expected entries exist for every lab 1–4 claim | `LABS.lab01…lab04` non-empty | `node selftest-static.mjs` |
| `--plan` each lab | exit 0, step table printed, no DB | `node 0N-*.mjs --plan` |
| Size and banned patterns | ≤ 200 lines, no `verdict(true` | `node selftest-static.mjs` |
| First run | all ✔, exit 0 | `npm run lab1` … `lab4` |
| Post-run state | `check` passes, no `lesson-12*` session | `npm run check` |
| Lab 04 with a foreign `backend_xmin` (selftest opens an RR session named `foreign`) | lab aborts with a clear warning, exit 1, no measured numbers printed | `node selftest-kit.mjs --horizon` |

## Verification

```
for n in 1 2 3 4; do npm run lab$n || exit 1; done
npm run check
node selftest-static.mjs
```

## Risks and rollback

- `pg_walinspect` record names differ from expectation (*M*): narrative adapts; the printed names are the truth.
- `VACUUM` text differs: parser fix only.
- Rollback: delete the four lab files; no schema residue because scratch tables are dropped by `reset`.

=== FILE: phase-04-labs-05-08-tx-and-isolation.md ===
---
phase: 04
title: "Labs 05a/05b–08 (big/idle transactions and isolation)"
status: pending
priority: P1
effort: 4h
dependencies: [02]
---

## Goal

Lab 05 split by concept (large vs idle/abandoned), plus labs 06–08 covering isolation levels, lost update and write skew with the corrected SSI step order.

## Files to create/modify (owner: delegate B; disjoint from P03 and P05)

- `labs/lesson-12-transaction/05-big-and-idle-tx.mjs` (2 lines: imports part-a and part-b)
- `labs/lesson-12-transaction/05-big-and-idle-tx-part-a.mjs` (large transaction)
- `labs/lesson-12-transaction/05-big-and-idle-tx-part-b.mjs` (idle and abandoned transaction)
- `labs/lesson-12-transaction/06-levels-read-anomalies.mjs`
- `labs/lesson-12-transaction/07-lost-update.mjs`
- `labs/lesson-12-transaction/08-write-skew.mjs`
- Overflow `-part-a/-part-b` for 06–08 only if > 200 lines.

Delegate restrictions as in P03 (write files, `--plan`, `node --check`, no DB). Labs 06–08 import `SCENARIOS` from `scenarios.mjs`; they must not re-type SQL that exists there.

## Delegate brief

- **05a (slides 17–19):** on `l05_*` (100,000 rows, autovacuum off): one `UPDATE` of all rows vs ten batches; record WAL bytes (LSN difference printed as bytes) and relation size; runner scenario: B updates a late row while A's big transaction is open (`{wait:'A'}`, confirmed) vs batches (B passes). This lab raises `statement_timeout` to 60 s for session A only, declared in a Vietnamese comment (the kit default 15 s is too short for a large UPDATE).
- **05b (slides 20–21):** idle-in-transaction A blocks writer B (confirmed wait); B with `lock_timeout='1s'` gets `55P03`; victim with `idle_in_transaction_session_timeout='2s'` gets terminated, `25P03` read from the recorded `error` event (an expected event, not a crash); observer `pg_terminate_backend` on an idle transaction, the victim's next statement fails `57P01`; show whether a read-only idle RC transaction holds `backend_xmin` and an idle RR one does (*M*); `--json` output feeds widget W5 (rows: pid, state, `xact_start` age as masked, blocking).
- **06 (slides 6–9, 22):** `SHOW transaction_isolation` per level; `SET TRANSACTION` before BEGIN → notice captured through `onNotice`; after the first query → error code captured (*M*); loop `dirtyRead`, `nonRepeatableRead`, `phantom` over RU/RC/RR/SER (`--json`).
- **07 (slides 8–9):** `lostUpdateApp` and `atomicUpdate` over four levels; also show the retry that makes RR/SER correct; print total vs expected (`--json`).
- **08 (slides 9–10, 23):** `writeSkew` over RR then SER with the frozen order; SER: B's UPDATE succeeds, **B's COMMIT** fails `40001`; retry of B sees count 1 and refuses; the seq-scan false positive: a non-conflicting pair on rows in one page with `max_pred_locks_per_page = 2` read first via the kit (`SHOW`), then attempt to reproduce; if it does not reproduce, print "không tái hiện được trên máy này, xem docs" and the verdict is that statement, not a fake ✔. Optional section, marked.

## Tasks and steps

1. Delegate writes against `--plan`.
2. Controller adds `lab5` = `node 05-big-and-idle-tx.mjs` (script already present); runs each lab once serially.
3. Contradictions follow P06 §3.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| Expected entries exist for labs 05a, 05b, 06, 07, 08 | non-empty | `node selftest-static.mjs` |
| 05 entry is two lines and parts ≤ 200 lines | pass | `selftest-static` |
| `--plan` each lab | exit 0 offline | `node 06-levels-read-anomalies.mjs --plan` |
| Labs 06–08 contain no scenario SQL literal duplicated from `scenarios.mjs` | grep of `BEGIN ISOLATION` count 0 in labs 06–08 | `selftest-static` |
| First run | all ✔ | `npm run lab5` … `lab8` |
| Undeclared-wait guard: run lab 07 with the GUI-style foreign transaction holding a row lock on a lab12 row | `55P03` reported, cleanup ok, `check` passes | `node selftest-kit.mjs --foreign-lock` |
| 05b victim termination does not crash Node | exit 0 | `npm run lab5` |
| Write-skew step order | `timeline` shows B's COMMIT as the failing step at SER | `npm run lab8 -- --json` |

## Verification

```
for n in 5 6 7 8; do npm run lab$n || exit 1; done
npm run check
node selftest-static.mjs
```

## Risks and rollback

- Big UPDATE exceeds even 60 s on a slow Docker: reduce to 50,000 rows in `l05_*` and record the size on the card.
- False positive not reproducible: honest label, docs citation.
- Rollback: delete these files.

=== FILE: phase-05-homework-runner.md ===
---
phase: 05
title: "Homework runner, template, AI draft, solution"
status: pending
priority: P1
effort: 2.5h
dependencies: [02]
---

## Goal

Homework A–D machinery with refusal behaviour written test-first. The learner's `homework-predictions.mine.mjs` is never modified by any script.

## Files to create/modify

- Controller: `labs/lesson-12-transaction/selftest-homework.mjs` (first), `homework.mjs` (runner, ≤ 200 lines), `homework-predictions.mine.mjs` (blank template: `'???'` ×24 cells, 6 `why` lines).
- Delegate C (disjoint): `homework-ai-draft.mjs`, `homework-d.mine.mjs` (learner stub with a guard SQL placeholder `'???'`), `homework-solution-notes.mjs` (answers to parts C and D as data printed by `homework:solution`).
- Scripts: `homework` → `node homework.mjs`; `homework:draft` → `node homework-ai-draft.mjs`; `homework:solution` → `node homework.mjs --solution`.

## Behaviour (frozen by the selftest)

- **Part A:** `npm run setup` card is the answer; `homework` prints reminder only.
- **Part B:** reads `homework-predictions.mine.mjs` (or `--file <path>`). Cell values only `'xảy ra' | 'không' | '40001'`; each of 6 scenarios has one `why` string (≥ 10 chars). Any `'???'` or invalid value → list every offending cell by `scenario.level` (and `why`), exit 1, no DB connection. Otherwise run each scenario × level through the kit, compare computed `classify()` to the prediction, print the 6×4 matrix with ✔/✘ and, for every ✘, the step timeline. The runner never writes any file.
- **Part C:** `homework:draft` runs `homework-ai-draft.mjs`: four planted flaws (one client for both sessions; `SET TRANSACTION` before `BEGIN`; write-skew test on rows with no shared invariant; COMMIT errors ignored). The draft still uses kit-safe connection options, a scratch table `hwdraft_*`, and closes in `finally`, so running it is safe. It prints a misleading "all good".
- **Part D (optional, lesson-14 bridge):** `npm run homework -- --part=d` runs the learner's `homework-d.mine.mjs` against scenario `guardForUpdate` at RC: success = B waits (confirmed), then sees 1 and refuses, no `40001`. Guard is `SELECT … FOR UPDATE` on the rows, not on `count(*)`.
- **Solution:** `--solution` uses the answer key from `expected-verdicts.mjs`, measures all 24 cells, prints the matrix (all ✔ expected), then the answers to C (the four flaws) and D (working guard measured).

## Tasks and steps

1. Controller writes `selftest-homework.mjs`, runs red.
2. Controller writes `homework.mjs` until green; hash the learner file before and after.
3. Delegate C writes the draft, the D stub and the notes against `--plan`/`node --check`.
4. Controller integrates and runs once.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| Blank template | exit 1; lists all 30 `'???'` items; no DB session opened (observer shows none) | `node selftest-homework.mjs` |
| One row filled (4 cells + why) | exit 1; lists 26 | selftest |
| Invalid enum value `'có'` | exit 1; names the cell | selftest |
| `why` shorter than 10 chars | exit 1 | selftest |
| Fully correct temp file via `--file` | exit 0; matrix all ✔ | selftest |
| One wrong cell | exit 1; ✘ marked; timeline printed for that cell only | selftest |
| Untouched learner file | sha256 of `homework-predictions.mine.mjs` equal before and after every case | selftest |
| `homework:solution` | 24 ✔, plus C (4 flaws) and D output | `npm run homework:solution` |
| `homework:draft` | exit 0; no `lesson-12*` session afterwards | `npm run homework:draft && npm run check` |
| Part D blank stub | exit 1, "chưa viết guard" | selftest |
| Part D with `FOR UPDATE` on `count(*)` query | fails (cannot lock aggregate) with a readable message | selftest |
| Size | ≤ 200 lines/file | `node selftest-static.mjs` |

## Verification

```
node selftest-homework.mjs
npm run homework; echo "exit=$?"        # expected 1
npm run homework:solution && npm run homework:draft && npm run check
```

## Risks and rollback

- Learner edits are lost if a script writes: tested by hash.
- `atomicUpdate` at RR measured as `40001` (*M*): if it differs, the key and guide change after P06, not the data.
- Rollback: delete the homework files.

=== FILE: phase-06-serial-runs-and-evidence.md ===
---
phase: 06
title: "Serial runs, evidence, TypeORM API check"
status: pending
priority: P1
effort: 2h
dependencies: [03, 04, 05]
---

## Goal

Official recorded evidence: every lab run twice, masked diffs empty, outputs stored in `PLAN/lab-runs/`, interruption safety proven, and TypeORM API names checked. This folder is the only legal source for quoted numbers.

## Files to create/modify (owner: controller)

- `labs/lesson-12-transaction/run-all.mjs` (serial driver: setup `--force` once, then for each lab run1 and run2, writes outputs, masks, diffs)
- `PLAN/lab-runs/labNN-run1.txt`, `labNN-run2.txt`, `labNN.json` (labs with `--json`: 03, 05b, 06, 07, 08), `labNN.diff.txt`
- `PLAN/lab-runs/homework-refusal.txt`, `homework-solution.txt`, `homework-draft.txt`
- `PLAN/lab-runs/fingerprint-after.txt`, `interrupt-check.txt`, `CONTRADICTIONS.txt` (only if any)
- `PLAN/lab-runs/typeorm-api-check.txt`
- `labs/lesson-12-transaction/selftest-interrupt.mjs`

## Tasks and steps

1. **Test first:** `selftest-interrupt.mjs` spawns lab 3 with piped stdio, waits for the marker line the runner prints on observer-confirmed wait, sends SIGINT, polls `check` up to 5 s, expects exit 0. Controller also does one real Ctrl+C in a pty (`bash` with `pty: true`) because Windows `kill` may skip handlers. Both outcomes recorded in `interrupt-check.txt`.
2. `run-all.mjs`: serial only. Order: `setup --force`, labs 1–8, homework refusal, solution, draft. Each lab twice; mask with `mask-output.mjs`; non-empty diff or any ✘ → exit 1. ctid is not masked: if it differs run-to-run, that is a determinism bug to fix in the lab.
3. **Contradiction procedure:** a ✘ means the expectation or the narrative was wrong. Record claim, expected, measured in `CONTRADICTIONS.txt`; edit `expected-verdicts.mjs` and the narrative note for P07/P08; re-run that lab twice. Data files are never edited by hand.
4. After the last lab: `npm run check`; fingerprint after equals before (diff `fingerprint-before.txt` vs `-after.txt`).
5. TypeORM: read `typeorm@0.3.20` and `@1.1.2` `.d.ts` (unpkg) and the postgres driver `startTransaction`: confirm `START TRANSACTION` then `SET TRANSACTION ISOLATION LEVEL <level>`, the 1.x fallback to `dataSource.options.isolationLevel`, and `queryRunner.connection` → `queryRunner.dataSource`. Check the drill's names (`dataSource.transaction`, `manager`, `queryRunner.connect/startTransaction/commitTransaction/rollbackTransaction/release`) against both, and against the learner's version if answered. Result table in `typeorm-api-check.txt`.
6. The MySQL claims in slides 7, 9, 10, 16, 20, 22 are cited from MySQL 8.0 reference pages and the slide text; list URLs in `lab-runs/mysql-sources.txt`. No MySQL measurement.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| Determinism | every `labNN.diff.txt` empty | `node run-all.mjs` |
| Interrupt mid-lab | `check` passes within 5 s of kill | `node selftest-interrupt.mjs` |
| Real Ctrl+C in pty | no `lesson-12*` session, no lab12 lock | manual + `npm run check` |
| Full-run state | `check` pass, lab03 fingerprint equal | `npm run check; diff` |
| Homework outputs captured | three files non-empty; refusal file contains exit code 1 | `run-all.mjs` |
| No secrets in outputs | grep for `postgres://`, `PGPASSWORD`, `POSTGRES_PASSWORD` in `lab-runs/` returns 0 | `node selftest-static.mjs --runs` |
| TypeORM API names | every name found in both versions, or the difference labelled | read the check file |

## Verification

```
node run-all.mjs
node selftest-interrupt.mjs
npm run check
node selftest-static.mjs --runs
```

## Risks and rollback

- Flaky wait timing: verdicts depend on observer-confirmed order, not sleeps; any flake is a runner defect to fix in P02 files.
- Rollback: `npm run setup --force`; delete `lab-runs/lab*`.

=== FILE: phase-07-guide-part-1.md ===
---
phase: 07
title: "Guide part 1: shell, stages 0–5, widgets W1–W3, W5"
status: pending
priority: P1
effort: 4h
dependencies: [06]
---

## Goal

The first half of the Vietnamese guide: shell, warm-up, stages 1–5 (Day 02), and the four widgets for those stages. Built from measured evidence.

## Files to create/modify (owner: controller only; one file, sequential edits)

- `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html` (new)
- `labs/lesson-12-transaction/verify-guide.mjs` (only fixes; checks were written in P02)

## Tasks and steps

1. **Test first:** run `node verify-guide.mjs --stages=0-5`; it must fail on missing file.
2. Lift the shell from `reports/advanced_backend/lesson_03_index_teacher_guide.html` using `grep`/range reads of the CSS, script and rail markup (do not read the 243 KB file whole). Replace storage keys: `l12-stage-1`…`l12-stage-8`, `l12-warmup`, `l12-quiz-*`, `l12-m1-*`, `l12-m3-*`, each access inside `try/catch`; leave `l3-*` unused. Hero "Bài 12 / 16". Rail ids `chang-1`…`chang-8`; time chips per stage and a Day 02 / Day 03 marker.
3. Warm-up (stage 0, 5 min): two psql windows via `docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab`, then `SET search_path = lab12_transaction;` and `SET application_name = 'lesson-12-psql-A';` (B likewise). Explain with `SHOW search_path;` why (database-level setting points at lesson 3). GUI = observer only, auto-commit on, runs the single `pg_stat_activity` query. Never kill a pid in state `idle`.
4. Stages 1–5 each: goal, `wwh` grid, a verbatim lab block or widget, quiz 3–5 questions. Numbers wrapped as `<span class="m" data-run="labNN">…</span>`.

| Stage | Content | Source | Widget |
|---|---|---|---|
| 1 | ACID on PG; `=#`/`=*#`/`=!#` prompts (glyphs verified in lab 01 transcript or labelled), 25P03 vs 25P02; lab 01 block | `lab01-run1.txt` | W1 state machine |
| 2 | WAL, COMMIT flush, abort record; lab 02 record table; `synchronous_commit` shown in ms only | `lab02-run1.txt` | W2 crash simulator |
| 3 | MVCC; M1 walkthrough (two windows, generated by `manualText('M1')`) with fill-in cells; lab 03 | `lab03-run1.txt/json` | W3 which version |
| 4 | Dead versions, VACUUM, "HLL" of PG; MySQL HLL cited, labelled "không đo trên máy này"; lab 04 | `lab04-run1.txt` | none (lab block) |
| 5 | Large vs idle; M2 optional; lab 05a/05b | `lab05*-run1.txt/json` | W5 idle board |

5. Slide 15 section fills the empty slide and notes the "MVVC" typo. Slide-chip data is deferred to P08.
6. Embed `lab03.json` and `lab05b.json` in `<script type="application/json" id="data-lab03">` etc., copied verbatim.
7. Run the verifier; fix; run render-check once:
`TMP=D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/verify/tmp TEMP=$TMP node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs reports/advanced_backend/lesson_12_transaction_teacher_guide.html --out plans/261024-1435-lesson-12-transaction-teacher-guide/verify/render` (run from `D:/study/advance-be`).

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| Rail and ids for stages 0–5 | `chang-1`…`chang-5`, warm-up present | `node verify-guide.mjs --stages=0-5` |
| Storage | only `l12-*`, every access in try/catch | same |
| Numbers | each `.m` span text appears in its `lab-runs` file | same |
| Embedded JSON | equals `lab-runs/lab03.json`, `lab05b.json` | same |
| Quiz | 3–5 questions per stage, answer index valid | same |
| Render | no console errors, no overflow at 375/768/1440 | render-check |
| Offline | no external resource except fonts | verifier |

## Verification

```
node verify-guide.mjs --stages=0-5
```

## Risks and rollback

- Quoting a number from memory: caught by `.m` verifier; unmarked numbers are a review item in P09.
- Rollback: delete the HTML; P06 evidence unchanged.

=== FILE: phase-08-guide-part-2.md ===
---
phase-08: placeholder
---
