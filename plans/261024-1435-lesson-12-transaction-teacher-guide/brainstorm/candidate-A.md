# Candidate A

## 1. Outcome
- `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html`. It uses the lesson-3 shell, in Vietnamese. It has 6 stages under the rail labels "Ngày 02 / Ngày 03", 4 widgets, about 27 quiz questions, an exam of 10, a cheat sheet, a 26-slide map, references and a teaser for Bài 14.
- `D:/study/advance-be/labs/lesson-12-transaction/` with npm scripts `setup`, `check`, `reset`, `lab1`–`lab8`, `homework`, `homework:mine` and `homework:solution`, plus `tx-kit.mjs` and `scenarios.mjs`.
- `D:/study/advance-be/plans/<new-plan-dir>/plan.md` and `lab-runs/*.txt`.
- Afterwards Đạt can:
  - read MVCC from xmin/xmax/ctid;
  - predict each anomaly at each PG level;
  - reproduce and fix write skew;
  - end idle-in-transaction sessions;
  - review TypeORM transaction code.

## 2. Constraints
- Work on `main` only. No branch, worktree, push, PR, issue or unrequested commit. Markdown only under `plans/` or `docs/`.
- Database scope:
  - Objects go only in `lab12_transaction`, including the `pg_walinspect` and `pg_buffercache` extensions.
  - `lab03_indexing` is SELECT-only. Not even a rolled-back UPDATE is allowed there.
  - Never touch `lab_imdb` or `maycha_lease`. Filter `pg_stat_activity` to `current_database()`.
  - Terminate only `lesson-12-%` backends or the learner's own pid. No `ALTER SYSTEM`.
- Every lab session sets `lock_timeout 3s`, `statement_timeout 15s`, `idle_in_transaction_session_timeout 30s` and an `error` listener. `finally` rolls back, closes the client and drops scratch tables.
- Code files are at most 200 lines, with Vietnamese comments and no classes. Each lesson folder has its own kit.
- `PG_URL` is never printed. The container is `quan-ly-hop-dong-postgres-1`.
- Time budget: about 4 h 10′ of study plus 60′ of homework.

## 3. Non-goals
- Measuring InnoDB. Its behaviour is cited and labelled "không đo trên máy này".
- Lesson-14 content beyond the bridge.
- Editing lesson 3 or the roadmap. Flag these instead:
  - the lesson-3 teaser still says Bài 4;
  - lesson 3 still names the old container;
  - roadmap Day 02 says `UPDATE hw_contracts`.
- A NestJS project or a TypeORM install.
- Replication or SSI-tuning demos.

## 4. Acceptance criteria
1. In a browser at 360 and 1280 px, light and dark, the guide works offline except fonts, has no horizontal scroll and a clean console.
2. A DOM script checks:
   - 26 chips, all `href`s resolve;
   - pg-marked chips equal the pg-callout slides (at least 7, 9, 10, 13–16, 20, 22, 23);
   - each stage has a goal, a `wwh` grid, a widget or lab block, and 4–5 quiz questions with valid answer indices.
3. `wc -l` shows at most 200 lines for every `.mjs`.
4. Each lab runs twice with the same ✔/✘ lines, rows, counts, ctids and SQLSTATEs. Only xid, LSN, pid and ms may differ (checked by a masked diff).
5. grep confirms each terminal block in the guide appears verbatim in `lab-runs/`, labelled with date and npm script.
6. `npm run check` is green after every run:
   - no `l12_*` table, and no `lesson-12-%` backend or lock;
   - `hw_contracts` still has 500,000 rows and 5,666/5,666 pages all-visible;
   - no "maycha" string in the lab folder.
7. With the row held in psql, `npm run lab3` exits 1 within 15 s with a Vietnamese 55P03 message.
8. grep confirms every SQL line of M1/M2 appears in labs 03/08.
9. `homework` and `homework:mine` refuse `'???'` (negative runs recorded). `homework:solution` shows all ✔.
10. The TypeORM drill has at least 6 bugs and folded answers. Each bug is tied to a lab, and the API forms match the TypeORM docs.
11. A count-only grep finds no password in files or in `lab-runs`.

## 5. Trade-offs (★ = recommended)
| Approach | Rests on | Fails first | Worst plausible case |
|---|---|---|---|
| Labs: script only (two clients, step order) | await order = run order | a blocked step without timeout | learner never sees it in his own terminals |
| Labs: manual only (psql ×2 / GUI) | learner drives two real sessions exactly | GUI auto-commit, or two tabs on one connection | wrong conclusion; leftover transaction breaks later labs; nothing quotable |
| ★ Labs: hybrid — script is the source of truth, same SQL replayed by hand | SQL kept identical | learner's client deviates | xids differ (labelled volatile); a step-0 pid check catches shared sessions |
| Data: use `hw_contracts` directly | a rolled-back UPDATE leaves no trace | the first UPDATE clears all-visible | lesson-3 Day-01 DoD silently breaks |
| ★ Data: seed from `hw_contracts` rows 1–20, plus a read-only 500k copy | `hw_contracts` exists | lesson 3 was reset | setup stops with a one-line fix |
| Days: slide order | slide order = learning order | the Day-02 DoD needs MVCC | levels memorised, not derived |
| ★ Days: mechanism first | out-of-order slide ranges are fine | learner reads the PDF linearly | two forward links (slides 20, 22) |
| Kit: lesson-3 clone | its tooling transfers | CLAUDE.md rule 1; the kit is EXPLAIN-centric | ~800 homework lines with English comments |
| ★ Kit: `tx-kit.mjs` ≤ 150 lines + `scenarios.mjs` | a small kit stays small | it grows into a DSL | helpers duplicated per lesson (existing convention) |

## 6. Better approaches
1. **Mechanism first, not slide order.** Roadmap Day 02 is MVCC. On PG, RC and RR differ only in when the snapshot is taken. The controller probe `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/probes/probe-anomaly-matrix.out.txt` shows an RR reader keeping xmin 935 after writer 936 committed. Cost: one note in "Cách học".
2. **A copied table, not the roadmap's `UPDATE hw_contracts`.** Its 5,666/5,666 all-visible state (checked today) is what lesson-3 T2 depends on. An UPDATE clears that state even if rolled back. Cost: about 10 setup lines.
3. **One step format for lab, manual table, widget and homework.** The probe shows step-order interleaving is deterministic. The homework also gains a rule-2 "Tự làm" part, and the AI-code review moves into the TypeORM drill. Cost: about 250 kit lines instead of about 800 homework lines.
4. **`pg_walinspect` + `pg_buffercache`.** Both are available but not installed. They put real WAL records and a dirty page behind slide 12.

## 7. Recommended direction

**Stages**

| Day | # | Stage | Slides | Time |
|---|---|---|---|---|
| Ngày 02 (≈ 2 h 45′) | 0 | Setup, two psql windows | 1–3 | 15′ |
| | 1 | Transaction & ACID | 4–5 | 25′ |
| | 2 | WAL & durability | 11–12 | 30′ |
| | 3 | MVCC in Postgres | 13–16 | 55′ |
| | 4 | Large, long, stalled, abandoned | 17–21 | 40′ |
| Ngày 03 (≈ 2 h 25′) | 5 | Isolation & write skew | 6–10, 22 | 60′ |
| | 6 | Recap, TypeORM, homework | 23–26 | 25′ + 60′ |

**Labs**

All verdicts are computed from measurements. Two-client labs run A and B in step order. A blocking step is detected by polling `pg_blocking_pids` for at most 3 s.
- **01 `atomicity-aborted-state`** (slides 4–5, one session):
  - error 23514 leaves both balances unchanged;
  - the next statement fails with 25P02;
  - COMMIT returns ROLLBACK;
  - also covers SAVEPOINT, DDL rollback and sequence gaps.
- **02 `wal-durability`** (slides 11–12, one session):
  - a Heap record, then a COMMIT record, and no BEGIN record;
  - a full-page image after CHECKPOINT;
  - the page is still dirty after COMMIT;
  - `synchronous_commit` on vs off.
- **03 `mvcc-row-versions`** (slides 13–15, Day 02):
  - the writer never waits for the reader;
  - the old version's xmax = the writer's xid;
  - RC sees the new version, RR the old one;
  - both tuples sit on the same page.
- **04 `rollback-vacuum-horizon`** (slides 13–14, 16; a snapshot holder plus a writer):
  - rollback is much faster than the update;
  - Heap Fetches go 0 → >0 → 0;
  - an open RR snapshot keeps N dead tuples "not yet removable".
- **05 `large-transaction-batching`** (slide 18, one session). One UPDATE vs 50k batches on a 500k copy, comparing:
  - WAL;
  - table growth;
  - peak dead tuples;
  - the longest transaction.
- **06 `idle-in-transaction-guards`** (slides 19–21; an idle session plus a waiter):
  - the waiter gets 55P03;
  - the server ends the idle session (25P03);
  - an RC read-only idle session has no `backend_xmin`.
- **07 `anomaly-matrix`** (slides 6–10, 22):
  - 5 anomalies × 4 levels;
  - RU behaves as RC;
  - `qty - 1` waits and stays correct;
  - SET TRANSACTION scope.
- **08 `write-skew-serializable-retry`** (slide 10, Day 03):
  - active reps: RR leaves 0, SERIALIZABLE leaves 1 and raises 40001;
  - retry keeps the rule.

**Manual walkthroughs**

Use two PowerShell windows, each running `docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab`. The psql prompt shows `*` inside a transaction and `!` after an error. A GUI client works only with auto-commit off and two separate connections. Step 0: the two windows must show different `pg_backend_pid()` values.
- **M1 (MVCC):**
  1. A: `BEGIN; SELECT xmin, xmax, ctid, total FROM lab12_transaction.contracts WHERE id = 1;`
  2. B: `BEGIN; UPDATE … SET total = total + 1 WHERE id = 1 RETURNING xmin, xmax, ctid;`
  3. A reselects.
  4. B: `COMMIT;`
  5. A reselects.
  6. Repeat with A at `REPEATABLE READ`.

  The learner fills in xmin, xmax, ctid, total and "B trả về ngay?".
- **M2 (write skew):**
  1. A and B: `BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT count(*) FROM lab12_transaction.store_reps WHERE store_id = 44 AND active;`
  2. A: `UPDATE … SET active = false WHERE rep_id = 1;`
  3. B: the same with `rep_id = 2`.
  4. A, then B: `COMMIT;`
  5. Run `npm run setup -- --force`, then repeat at SERIALIZABLE.

  The learner fills in the counts seen, the error code, the failing step and the final count.
- **H1 (horizon):** A sits idle in RR while B updates. `VACUUM (VERBOSE)` reports "not yet removable". The learner finds A and ends it with `pg_terminate_backend`.

**Dataset (`lab12_transaction`)**
- `contracts`: rows 1–20 of `hw_contracts`.
- `deposit_accounts`: CHECK balance ≥ 0.
- `store_reps`: store 44 with reps An and Bình.

Seed data is defined once in the kit. Labs build their own `l12_NN_*` copies from it, never from tables the learner edits.

**Widgets**
- W1 (slides 4–5): transaction states.
- W2 (slide 12): WAL timeline with a crash button.
- W3 (slides 13–15): which version each session sees, RC vs RR.
- W4 (slides 6–10): anomaly matrix, PG data from lab 07 `--json`, InnoDB cited.

**Homework (slide 24)**
- **A — Predict.** Fill 20 cells with `xảy ra`, `không` or `40001`. `npm run homework` refuses `'???'`, replays `scenarios.mjs` and marks ✔/✘.
- **B — Replay.** `--steps` prints the SQL for one cell. Replay the two cells you got wrong in psql.
- **C — Tự làm.** Write the check and INSERT for "one ACTIVE lease per premise", a partial unique index, and the retry codes. `homework:mine` checks that:
  - RC and RR produce 2 ACTIVE leases;
  - SERIALIZABLE raises 40001;
  - with the index, B waits and then gets 23505;
  - only 40001 and 40P01 are retried.
- **D — TypeORM review** (answers folded). Planted bugs:
  - the global repository used inside `dataSource.transaction(cb)`;
  - a read-modify-write on the deposit;
  - an HTTP call inside the transaction;
  - SERIALIZABLE without retry;
  - a QueryRunner not released in `finally`;
  - `dataSource.query('BEGIN')` through the pool;
  - bonus: 25P02.
- **Solution:** `homework:solution`.

**Verdict chips**

| Slide | Chip | PG 16 truth |
|---|---|---|
| 7 | MySQL đúng, PG khác | RU runs as RC |
| 9 | Cần sửa | RR has no phantoms; a same-row update gives 40001; write skew remains |
| 10 | MySQL đúng, PG khác | SIRead locks never block; 40001 needs a retry |
| 13 | MySQL đúng, PG khác | no undo log; versions live in the heap |
| 14 | MySQL đúng, PG khác | VACUUM instead of purge; ROLLBACK is instant |
| 15 | Cần sửa | empty "MVVC" slide, filled by lab 03 and W3 |
| 16 | MySQL đúng, PG khác | no HLL; watch the oldest `backend_xmin` |
| 20 | MySQL đúng, PG khác | no gap locks |
| 22 | MySQL đúng, PG khác | SET TRANSACTION covers only the current transaction; outside a block it only warns |
| 23 | Cần sửa | RU = RC; no undo; writers still lock rows |
| 4, 5, 18, 19, 21 | Đúng trên PG16 | holds, with a PG note |
| 8 | Đúng trên PG16 | note: read-modify-write loses updates |
| 12 | Đúng trên PG16 | note: PG writes no BEGIN record |

**Bridge to Bài 14**
- The waiting `qty - 1` in lab 07 is a row lock, and xmax doubles as the lock marker.
- Without SERIALIZABLE, write skew needs `SELECT … FOR UPDATE` on a parent row, or a version column (slide 25).
- `withRetry` (which already catches 40P01) and `store_reps` carry into lesson 14's deadlock lab.

## 8. Risks and unknowns
- xid, LSN and pid change on every run. Lesson 3's "only ms varies" rule is relaxed, and verdicts compare relationships, not raw values.
- A foreign session can hold the horizon or a row: a DBX tab, or the learner's psql. Lab 04 names the holder, and `lock_timeout` prevents hangs. Four idle sessions are on `advance_be_lab` right now.
- node-pg emits `error` when the server ends an idle client (lab 06). Without a listener, the process crashes.
- On tiny tables SSI locks whole relations, so 40001 can appear without a real conflict. Lab 08 prints the lock granularity.
- Verify by lab before quoting:
  - COMMIT on a failed transaction returns ROLLBACK;
  - a late SET TRANSACTION gives 25001;
  - a rolled-back UPDATE clears all-visible;
  - an RC read-only idle session has no `backend_xmin`;
  - the walinspect and buffercache output;
  - the sync-commit gain on Docker/WSL2;
  - TypeORM `startTransaction(level)` and `dataSource.query` pooling, which its docs don't show.
- Unknown now:
  - InnoDB numbers (cited only);
  - how Đạt's GUI maps tabs to connections;
  - whether the user wants the lesson-3 teaser and the roadmap fixed.

Summary (candidate's own): Bounded contract for the lesson-12 guide plus eight run-verified labs, mechanism-first across Ngày 02/03 and isolated in lab12_transaction.
Open items (candidate's own): the roadmap's Day 02 command writes hw_contracts (redirected to a copy); several PG facts are expected but not yet lab-verified; editing the lesson-3 teaser and the roadmap needs the user's decision.
