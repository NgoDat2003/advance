# Candidate D

## 1. Outcome
New, uncommitted files on `main`:
- `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html`: the lesson-3 shell, in Vietnamese. It has a "Cách học" section, 6 stages, 4 widgets, 6 quizzes, a 10-question exam, a cheat sheet, a 26-slide map and a lesson-14 teaser.
- `D:/study/advance-be/labs/lesson-12-transaction/`: a small kit, a scenarios file, setup/check/reset, labs 01–07 and the homework.
- `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/`: a filled `plan.md` and `lab-runs/*.txt`.

After Day 02 and Day 03 (about 4.8 h), Đạt can:
- explain ACID, WAL and MVCC the way PG 16 does them;
- predict and replay every anomaly at every isolation level;
- reproduce write skew and the 40001 error in two psql windows;
- spot transaction bugs in TypeORM code.

## 2. Constraints
- No branch, worktree, push, PR, issue or commit. Files stay inside the repo. Markdown only under `plans/`.
- Database writes go only to `lab12_transaction` (`pg_buffercache` 1.4 is installed there). `lab03_indexing.hw_contracts` is only read, to copy it. Never touch `maycha_lease`, `lab_imdb`, or any server, database or role setting.
- **Measured today:** the database has its own default `search_path = lab03_indexing, public`. So an unqualified `hw_contracts` in a fresh psql hits lesson 3's table. Lesson-12 tables therefore use names that do not exist there, and every session sets `search_path = lab12_transaction`.
- Two-session labs:
  - the script's step order drives the interleaving, with no sleeps;
  - a third "observer" connection runs `pg_blocking_pids()` to confirm that a step is really waiting;
  - every session sets `lock_timeout`, `statement_timeout` and `idle_in_transaction_session_timeout`;
  - ROLLBACK and `end()` always run in `finally`.
  The only deliberate wait is lab 07's 1-second timeout demo.
- Reruns may differ only in ms, transaction ids, LSNs and pids. Verdicts compare relationships ("new xmin = S2's xid"), never raw ids.
- Code: at most 200 lines per file, Vietnamese comments, no framework. `PG_URL` is never printed.
- Every guide number comes from `lab-runs/`. InnoDB facts are cited and labelled "không đo trên máy này".

## 3. Non-goals
- Installing or measuring MySQL.
- Crashing or killing the server. It also hosts `maycha_lease`, so crash recovery is shown by a widget and docs.
- A locking deep-dive (`FOR UPDATE`, deadlocks). That is lesson 14.
- Replication, two-phase commit, Saga/outbox.
- Editing lesson-3 files (including its "Bài 4" teaser and old container name), the roadmap or CLAUDE.md.
- Changing the learner's NestJS app.

## 4. Acceptance criteria
1. The guide reuses lesson 3's `:root` tokens, rail, hero and `callout pg`/`vchip` classes. Only Google Fonts load from outside. Light and dark both work, there is no horizontal scroll at 360 px, and the console shows no errors. Check: grep plus a headless browser.
2. The slide map has chips 1–26, each exactly once, and every `href` resolves. Each slide in the §7 chip list has its `callout pg` and a `pg` chip in the map. Check: script.
3. Stages 1–6 each have a goal, a `wwh` grid, a widget or terminal block, and a 4–5-question quiz with valid answer indices. The guide also has the 10-question exam, cheat sheet, references (slide 25, PG 16 docs, TypeORM) and the lesson-14 teaser. Check: script.
4. All npm scripts run and every file is at most 200 lines. Each lab is run twice and the diff is empty once the varying values are masked. Every number in the guide appears in `lab-runs/*.txt`. Check: script.
5. After the full run, `npm run check` passes:
   - no stray `lesson-12%` session, nothing `idle in transaction`, no `lNN_*` scratch table;
   - lab03 `hw_contracts` still has 500,000 rows and every page all-visible.
6. Walkthroughs M1 and M2 use the same statements as labs 03 and 06 (only the scratch table name differs). Their folded answers are those labs' outputs.
7. On the untouched homework file, `npm run homework` exits 1 and lists the `'???'` cells; this run is stored. `homework:solution` shows 20/20 ✔ and Part C: RR broken, SER gives 40001, retry leaves one lease.
8. The TypeORM drill has at least 6 planted bugs, folded answers tied to labs, and API names checked against the TypeORM 0.3 docs.
9. A secret grep over new files and outputs finds nothing. `git status` shows only the three new locations.

## 5. Trade-offs
| Decision | Option | Depends on | Fails first | Worst case |
|---|---|---|---|---|
| Two-session driver | **A: Node script with 2 clients + observer; scenarios as data; prints a step table** | `pg_blocking_pids` sees the wait | a step waits on something that is not a lock | `lock_timeout` fires, step logged as 55P03 with ✘; never hangs |
| | B: manual psql only | learner types every step in order | a forgotten COMMIT (server timeout is 0) | cleanup blocked for hours; nothing quotable |
| | C: hand-written awaits per lab | few scenarios | 20 replays are needed | labs and homework drift apart |
| Dataset | A: write to lab03 `hw_contracts`, as the roadmap literally says | lesson 3 does not care | first committed UPDATE clears all-visible | Day-01 DoD "Heap Fetches = 0" can fail |
| | **B: copy into `lab12_transaction.contracts`, plus tiny `deposits` and `store_reps` tables** | lab03 table exists | lesson 3 was reset | setup stops with a fix hint; +58 MB |
| | C: tiny new tables only | continuity is optional | slide 18 needs volume | breaks the cumulative-lesson rule |
| Day split | A: slide order | the deck order teaches well | slide 9 needs snapshots, taught at 13–15 | learner memorises the SQL-standard table, wrong for PG |
| | **B: mechanism first (roadmap order)** | slide map is enough to navigate | learner reads the deck alongside | needs a slide→stage table |
| Lesson-3 machinery | A: reuse `pg-explain-kit.mjs` | kit is generic | at once: its `connect()` forces `lab03_indexing` | writes land in lesson 3 |
| | **B: new `tx-kit.mjs` (~110 lines) + shared `scenarios.mjs`, one homework runner, 4 widgets** | a small kit stays readable | runner treated as a black box | ~25 lines duplicated |

## 6. Better approaches
Four changes from a straight lesson-3 clone:
1. **Copy, rename, qualify.** Evidence: the database-level search_path above, and the Day-01 DoD needs `hw_contracts` all-visible (5,666 of 5,666 pages today). Change: the roadmap's `hw_contracts` becomes `lab12_transaction.contracts`. Cost: one copy, a few seconds.
2. **Mechanism first.** Evidence: the roadmap puts "WAL & MVCC" on Day 02 and "isolation" on Day 03, and slide 15 is empty. PG's levels differ only by when the snapshot is taken, how update conflicts are handled, and serializable conflict detection (SSI). Cost: a slide→stage table.
3. **Scenarios as data, shared by labs 05–06 and the homework.** Evidence: 20 replays are needed; lesson 3's homework took seven files. Cost: one small kit.
4. **Manual walkthroughs as a first-class part** (CLAUDE.md rules 2–3; lesson 3 had none). The psql prompt `%x` shows `*` inside a transaction and `!` after an error, which makes the aborted state (25P02) visible. `pg_backend_pid()` must differ between the two windows. Cost: two guide sections.

## 7. Recommended direction
**Stages** (Day 02: 140′, Day 03: 150′, exam: 30′)
| Day | Stage | Slides | Min | Uses |
|---|---|---|---|---|
| 02 | Cách học + môi trường | 1–3 | 15 | warm-up, slide→stage table, setup |
| 02 | 1 Transaction & ACID trên PG | 4–5 | 30 | Lab 01 |
| 02 | 2 WAL: ghi log trước | 11–12 | 30 | W1, Lab 02 |
| 02 | 3 MVCC trong Postgres | 13–16 | 65 | W2, Labs 03–04, M1 |
| 03 | 4 Bốn mức cô lập trên PG | 6–10, 22 | 70 | W3, Labs 05–06, M2 |
| 03 | 5 Transaction có vấn đề | 17–21 | 35 | W4, Lab 07, M3 |
| 03 | 6 Recap, bài tập, NestJS | 23–26 | 45+ | homework, drill |

**Labs** (`NN-name.mjs`; labs that write use scratch tables `lNN_*`)
| Lab | Slides | Driver | Claim → computed verdicts |
|---|---|---|---|
| 01 acid-atomicity | 4–5, 22 | 1 session | failed transfer leaves the sum unchanged; next statement gives 25P02; SAVEPOINT keeps part 1; rolled-back DDL is gone; sequence leaves a gap |
| 02 wal-durability | 12 | 1 session + CHECKPOINT | first UPDATE after CHECKPOINT writes a full-page image; WAL is flushed at commit; page is dirty after COMMIT and clean after CHECKPOINT; commit time with synchronous_commit on vs off |
| 03 mvcc-versions | 13–15 | S1, S2, observer | reads and writes never block each other; S1 at RR keeps the old ctid/xmin; new xmin = S2's xid; old tuple's xmax = S2's xid; `heap_page_items` shows both versions |
| 04 rollback-vacuum-horizon | 13–14, 16 | idle S1 + S2 | rolled-back transaction shows as aborted; ROLLBACK is far faster than the UPDATE; dead tuples are "not yet removable" while S1 is open and removed after |
| 05 read-anomalies | 6–9, 22 | scenarios | no dirty read even at RU; non-repeatable read and phantom at RC, not at RR; where SET TRANSACTION is allowed |
| 06 lost-update-write-skew | 8–10, 23 | scenarios | app read-modify-write at RC loses an update, `SET x = x - n` does not; RR gives 40001; write skew at RR leaves 0 active reps; SER gives 40001 without blocking; retry keeps at least 1 |
| 07 problem-transactions | 18–21 | big transaction + probe; leaked client | probe gets 55P03 inside one 500k-row UPDATE but passes between 10k batches; WAL and table size compared; leaked client shows as `idle in transaction`, then a 1 s timeout kills it |

**Manual walkthroughs**
Open two PowerShell windows with `docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab`. In each, run `\set PROMPT1 'S1 %x%# '` and `SET search_path = lab12_transaction; SET lock_timeout = '10s'; SET idle_in_transaction_session_timeout = '15min'; SELECT pg_backend_pid();`. A GUI client also works with manual commit and one connection per tab; the two pids must differ.

The learner fills a table with columns: Bước | S1 | S2 | xmin | xmax | ctid | total | chờ?
- **M1 (Day 02):**
  1. Plain `BEGIN`. S1 reads id 1. S2 runs `UPDATE contracts SET total = total + 1 WHERE id = 1 RETURNING xmin, ctid`. S1 reads again and sees the new tuple.
  2. Again with `REPEATABLE READ`: S1 keeps seeing the old tuple.
  3. S2 runs `BEGIN; UPDATE …` and leaves it open. S1 reads instantly and sees xmax = S2's xid. S2 rolls back.
- **M2 (Day 03):**
  1. Reset the tables. Both sessions, at RR, count store 44's active reps (2).
  2. S1 deactivates rep 1, S2 deactivates rep 2. Both commit. Count is now 0.
  3. Repeat at SERIALIZABLE with `\set VERBOSITY verbose`. Note which step raises 40001. The retry sees 1 rep and refuses.
- **M3 (optional):** S1 sits idle inside a transaction. S2 runs the report query, `VACUUM (VERBOSE)` and `pg_terminate_backend`.

**Dataset** (`npm run setup`, safe to rerun):
- `contracts`: all 500,000 `hw_contracts` rows (id 1 = HD0000001, store 44) plus primary key.
- `deposits(contract_id, balance CHECK ≥ 0)`.
- `store_reps`: two active reps for store 44.
- Autovacuum is off on these tables. `reset` drops only `lab12_transaction`.

**Widgets**
- W1: WAL and crash replay, with a synchronous_commit toggle (slide 12).
- W2: MVCC stepper showing tuples, two snapshots, who sees what, and VACUUM vs the cleanup horizon, plus an InnoDB undo view (slides 13–16).
- W3: anomaly timeline that replays the JSON from labs 05–06; the InnoDB column is cited (slides 7–10).
- W4: "transaction doctor" over lab 07's `pg_stat_activity` rows (slides 18–21).

**Homework (slide 24)**
- **A.** `homework:setup` resets the tables and prints the scenario card.
- **B.** In `homework-predictions.mine.mjs`, Đạt fills 5 anomalies × 4 levels with `'xay_ra' | 'khong_xay_ra' | 'loi_40001'`, plus one `explain` per anomaly. `npm run homework` refuses any row still holding `'???'`. It replays the filled rows through `scenarios.mjs`, marks ✔/✘, and shows the step table for each miss.
- **C. Tự làm, "đặt trùng mặt bằng":** two staff each check shop 7 for overlapping bookings, then both book overlapping dates. Đạt writes the steps and a retry wrapper. `npm run homework:mine` grades it: RR gives 2 leases, SER gives 40001, retry gives 1. Bonus in the solution: an EXCLUDE constraint (btree_gist is available) holds even at RC.
- `homework:solution` runs the reference answers.
- **TypeORM drill** (folded answers, as bug → lab → fix):
  - repository used instead of `manager` inside `dataSource.transaction()`;
  - HTTP call inside the transaction;
  - `findOne` + `save` at RC;
  - SERIALIZABLE without a retry;
  - `release()` outside `finally`;
  - `dataSource.query('BEGIN')` followed by pooled queries;
  - continuing after an error (25P02).

**Verdict chips**
- **Đúng trên PG16:**
  - 4: an error leaves the transaction in 25P02 until ROLLBACK.
  - 8: RC is the default, with a new snapshot per statement.
  - 12: `pg_wal`, LSN, commit = WAL flush, full-page writes vs InnoDB doublewrite.
  - 18, 19, 21: measured in PG terms.
- **MySQL đúng, PG khác:**
  - 7: RU runs as RC.
  - 9: RR is snapshot isolation; no phantoms, a concurrent update gives 40001, write skew remains.
  - 10: SSI uses non-blocking read locks; one transaction gets 40001 and the app retries.
  - 13: no undo log; UPDATE writes a new heap tuple; ROLLBACK is instant; the RR snapshot is taken at the first statement.
  - 14: dead tuples stay in the table until VACUUM.
  - 16: no HLL; watch non-removable dead tuples and the oldest `backend_xmin`; the book's figures are cited.
  - 20: no gap locks; a stalled transaction holds row locks and its snapshot.
  - 22: SET TRANSACTION applies to the current transaction, before its first query; the session default uses SET SESSION CHARACTERISTICS.
- **Cần sửa:**
  - 5: at the default RC level, concurrent transactions do affect each other.
  - 15: the slide is empty; stage 3 fills it.
  - 23: the levels do not simply stack; PG uses MVCC + WAL, not undo logs; transactions still lock rows.

**Bridge to lesson 14:** lesson 12 catches conflicts after the fact (40001 + retry). Lesson 14 prevents them with `SELECT … FOR UPDATE`, triggers a 40P01 deadlock by locking ids 1 and 2 in crossed order, and fixes it by locking in a fixed order. Đạt then re-solves `deposits` and Part C that way (slide 25, vladmihalcea).

## 8. Risks and unknowns
- A lab must confirm these before the guide quotes them:
  - which step raises 40001;
  - the error codes 25P02, 25001, 25P03 and 55P03;
  - the exact `VACUUM (VERBOSE)` wording in PG 16;
  - the RC re-check result for a blocked UPDATE;
  - whether the synchronous_commit on/off gap shows up on Docker/WSL2.
- node-pg emits `'error'` when the server ends a session. The kit must catch it.
- Four idle backends with no application name are connected right now. A GUI session left idle in a transaction would skew lab 04, so `check` warns and lab 04 prints other sessions' `backend_xmin`.
- `maycha_lease` traffic adds WAL noise, so WAL is measured per statement with `EXPLAIN (WAL)`. CHECKPOINT affects the whole server.
- `pageinspect` lives in `lab03_indexing`, and lesson 3's `reset` drops it. Lab 03 then skips that part.
- `npm install pg` needs the npm cache or network. The implementer must load `PG_URL` without echoing the password.
- Not knowable yet: every measured number, lab runtimes, and whether 20 predictions fit in one sitting.

Summary (candidate's own): Plan for a lesson-3-style Transaction guide (mechanism first over Day 02/03), 7 two-session-safe labs, manual psql walkthroughs and a predict-then-replay homework, all on a copied dataset in lab12_transaction.
Open items (candidate's own): the database-level search_path (lab03_indexing, public) means the roadmap's literal "UPDATE hw_contracts" would write lesson-3 data, so the plan renames and schema-qualifies the table; all PG behaviours listed are expected, not yet measured.
