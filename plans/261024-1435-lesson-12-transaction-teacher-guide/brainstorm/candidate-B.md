# Candidate B

## 1. Outcome
Everything stays uncommitted on `main`:
- `reports/advanced_backend/lesson_12_transaction_teacher_guide.html`: the lesson-3 shell in Vietnamese. It has 7 stages tagged Ngày 02/03, 3 widgets, 3 two-session walkthroughs, quizzes, an exam, a cheat sheet and a 26-slide map.
- `labs/lesson-12-transaction/`: Node ESM with `pg`, schema `lab12_transaction`, 8 labs, one replay runner and the homework.
- Verbatim run outputs in `plans/261024-1435-lesson-12-transaction-teacher-guide/lab-runs/`.

After studying, Đạt can:
- explain WAL and MVCC the way PG 16 does them (xmin/xmax/ctid, snapshots, dead tuples, vacuum horizon);
- predict and replay every anomaly at every isolation level;
- reproduce write skew at RR and 40001 at Serializable by hand;
- find transaction bugs in TypeORM code and in `pg_stat_activity`.

## 2. Constraints
- Work on `main` only: no branch, worktree, commit, push, PR or issue. Markdown goes only under `plans/`.
- Writes happen only in `lab12_transaction`. `lab03_indexing` is read-only, though copying rows from it is fine. Never touch `lab_imdb` or `maycha_lease`; activity queries filter on `datname = current_database()`.
- Step order comes from awaiting each statement. A blocked step is detected by polling `pg_stat_activity.wait_event_type = 'Lock'`, never by sleeping.
- Every lab session sets `lock_timeout`, `statement_timeout`, a 60 s `idle_in_transaction_session_timeout` backstop and `application_name 'lesson-12-…'`. `finally` rolls back and closes.
- `PG_URL` is never printed: `pg.Client` is built inside try (lesson-3 review #37). xids and pids print as labels such as `xid(S2)`, so only ms vary between runs.
- CLAUDE.md applies: files ≤200 lines, Vietnamese comments, làm mẫu → tự làm, psql/GUI walkthroughs, build on lesson 3.
- Use container `quan-ly-hop-dong-postgres-1` and path `D:\study\advance-be`. The lesson-3 texts still carry the old names.
- Checked today on PG 16.15: `transaction_timeout` does not exist, `max_prepared_transactions = 0`, and `pg_walinspect` and `pg_buffercache` are available but not installed.
- Time budget ≈4 h 50: Day 02 about 2 h 20, Day 03 about 2 h 30.

## 3. Non-goals
- No MySQL server: InnoDB behaviour is cited and labelled "không đo trên máy này".
- No locking or deadlock labs; that is lesson 14.
- No edits to lesson-3 files (the stale "Bài 4" teaser, the old container hint) unless the user asks.
- No shared cross-lesson library, NestJS project, replication, 2PC or Saga.

## 4. Acceptance criteria
1. **Guide shell.** The guide uses the lesson-3 shell: rail, progress bar, hero "Bài 12 / 16", and a stage table with a Ngày column. Each stage has a goal, a `wwh` grid, a widget or lab block, and a 4–5-question quiz. The guide also has an exam (10), cheat sheet, references and a lesson-14 teaser. Check: light and dark themes, 360 px width (lesson-3 `verify/harness.html`), a clean console, and only Google Fonts loading.
2. **Slide map.** All 26 chips resolve. A script checks each chip's pg marker against its section's `callout pg`. Slides 7, 9, 10, 13–16, 20, 22 and 23 carry non-"Đúng" chips.
3. **Scripts.** `setup`, `check`, `reset`, `lab1`–`lab8`, `replay`, `homework`, `homework:mine` and `homework:solution` all run on this machine. `wc -l` is ≤200 per file, and nothing imports `../lesson-03-index`.
4. **Determinism.** Each lab is run twice and the two outputs differ only in ms values. Outputs go into `lab-runs/*.txt`. A script confirms every number in the guide's terminal blocks appears in those files.
5. **Clean state.** After the full run, and after a Ctrl+C mid-lab, `npm run check` is green:
   - no `lesson-12-%` session, no `idle in transaction`, no `SIReadLock`, no `lNN_*` table;
   - `hw_contracts` still has 500,000 rows, 5,666/5,666 pages all-visible, and id=1 has xmin 875 at ctid (0,1).
6. **Matrix.** `lab5` prints the 5 × 4 anomaly matrix with computed verdicts, and `--json` feeds W3.
7. **Walkthroughs.** The controller dry-runs M1 and M3 in two psql windows. The transcripts in `lab-runs/manual-*.txt` match Labs 03 and 06.
8. **Homework.** Running `npm run homework` on the untouched file refuses `'???'`, and this run is recorded. The solution and the learner template both run.
9. **TypeORM drill.** Six planted bugs, each with its slide, consequence and fix. API names are checked against the TypeORM 0.3 docs.
10. **Sources and hygiene.** Every InnoDB claim links a source. The secrets grep is clean. `git status` shows only new files in the three folders.

## 5. Trade-offs
**D1: how the two-session labs are driven**
- **A. One bespoke 2–3-client script per lab** (lesson-3 clone).
  - Assumes each case needs its own code.
  - Fails first: the 20 matrix cells turn into near-duplicate scripts.
  - Worst case: scripts drift from the manual tables, so hand runs contradict the quoted output.
- **B. One runner plus scenario data (recommended).**
  - Assumes every case is ordered `[session, sql]` steps plus a final check, and that lock waits show up in `pg_stat_activity`.
  - Fails first: a wait that is not a lock wait, or a case that needs branching.
  - Worst case: a misread wait, capped by `lock_timeout`. Retries stay in Lab 06, so the runner never grows into a framework.
- **C. Manual psql only.**
  - Assumes his own runs are proof enough.
  - Fails first: acceptance criterion 4, because nothing is verbatim.
  - Worst case: a GUI with a connection pool scatters steps across sessions and leaves an abandoned transaction behind.

**D2: dataset**
- **A. Use `lab03_indexing.hw_contracts`**, as the roadmap's command does.
  - Assumes updates there are harmless.
  - Fails first: the first committed UPDATE leaves a dead tuple, the page loses all-visible, and lesson-3 homework T2 drifts.
  - Worst case: an unfiltered GUI UPDATE creates new versions of all 500k lesson-3 rows.
- **B. Copy all 500k rows.**
  - Assumes volume matters.
  - Fails first: 58 MB plus WAL on every reset, and only Lab 07 needs volume (it builds its own table).
- **C. 10k-row sandbox `lab12_transaction.contracts` (recommended).** It has the same id=1 row, ~114 pages, all 200 stores, and 26 ACTIVE contracts for store 44 (all checked today). Labs copy their scratch tables from lab03.
  - Assumes lesson-3 data exists.
  - Fails first: after a lesson-3 reset, setup stops with a clear message.
  - Worst case: his GUI's default schema is lab03. Even then, the name `contracts` cannot resolve there, and every walkthrough step is schema-qualified.

**D3: Day 02 / Day 03 split**
- **A. Deck order, cut at slide 10/11.** This puts the Day 02 task on Day 03 and teaches RR before snapshots.
- **B. Roadmap order (recommended).** Day 02 covers slides 1–5 and 11–21; Day 03 covers 6–10 and 22–26.
  - Assumes snapshots are what explain isolation.
  - Fails first: slides 20 and 22 mention isolation early, which needs forward links.
  - Worst case: Day 02 runs long.
- **C. Common problems on Day 03.** Day 03 grows to about 2 h 50 and the homework gets squeezed.

**D4: how much lesson-3 machinery to reuse**
- **A. Clone it all:** the EXPLAIN kit, the six-file 682-line homework stack and six widgets. This breaks CLAUDE.md rule 1, and that kit measures plans, not xids or waits.
- **B. Import the lesson-3 kit.** It brings `search_path = lab03_indexing` and the stale container hint with it.
- **C. Recommended:** copy the guide shell, write a lean new kit, keep 3 widgets, and reuse the runner for homework. The cost is about 40 duplicated helper lines.

## 6. Better approaches
Make the step table the single source of truth, instead of a lesson-3 clone's per-lab scripts plus a separate homework engine.

Evidence:
- Slide 24 asks for a "Replay Isolation Level script" but ships none.
- The roadmap tasks for Day 02, 03 and 04 are all two-session step sequences.
- Đạt learns best from step tables he fills in.
- CLAUDE.md rule 1 (no bulky frameworks).
- The lesson-3 homework stack is 682 lines across six files.

Operational delta: `replay.mjs` (~150 lines) plus `scenarios.mjs` (plain arrays) drive Labs 05–06, the printed psql tables, W3 (via `--json`) and homework parts B and C. Lesson 14 reuses the same runner for its 40P01 deadlock task.

Cost of switching: the wait detector is the riskiest code, so all 20 runs must be tested twice. Scenarios must stay plain arrays and never become a mini-language.

## 7. Recommended direction
**Stages**

| Day | Stage | Slides | Time |
|---|---|---|---|
| 02 | 0 Cách học | 1–2 | 5′ |
| 02 | 1 Transaction & ACID trên PG | 3–5 | 20′ |
| 02 | 2 WAL & Durability | 11–12 | 30′ |
| 02 | 3 MVCC trong Postgres | 13–16 | 50′ |
| 02 | 4 Transaction lớn/dài/treo/bỏ rơi | 17–21 | 35′ |
| 03 | 5 Bốn mức cô lập | 6–9, 22 | 50′ |
| 03 | 6 Serializable & write skew | 10 | 40′ |
| 03 | 7 Recap, bài tập, NestJS | 23–26 | 60′+ |

**Labs**

Each lab prints a header `Lab 12.NN — … (slide …)`, and every clause below is one computed verdict. Tags: [1] one session; [2] two sessions plus an observer; [R] the replay runner.

- **01 `01-atomicity-on-pg`** (slides 4, 5, 22) [1]
  - A CHECK error puts the transaction into 25P02, and a later COMMIT answers ROLLBACK.
  - SAVEPOINT; DDL rolls back; a sequence gap survives the rollback.
  - `SET TRANSACTION` outside a block only warns.
- **02 `02-wal-and-durability`** (slide 12) [1]
  - `pg_walinspect` shows the records of one transaction.
  - WAL bytes for 1 row vs 1,000 rows.
  - WAL is flushed at COMMIT while `pg_buffercache` shows the data page still dirty until CHECKPOINT.
  - 500 commits with `synchronous_commit` on vs off.
- **03 `03-mvcc-versions`** (slides 13–15) [2]
  - Reader and writer never wait for each other.
  - RC sees the new xmin/ctid; RR sees the old version, whose xmax is xid(S2).
  - The RR snapshot starts at the first statement, not at BEGIN.
  - ROLLBACK of 10k rows takes ms, then VACUUM removes the 10k dead rows.
- **04 `04-vacuum-horizon`** (slides 14, 16) [2]
  - An RR snapshot is held while one row is updated 0, 1,000 and 5,000 times.
  - It reports VACUUM's "dead but not yet removable" count and the buffers a lookup reads.
  - After the snapshot is released and VACUUM runs, the numbers return to baseline.
- **05 `05-isolation-matrix`** (slides 6–10, 24) [R]
  - Dirty read, non-repeatable read, phantom, app-level lost update and write skew, each at RU, RC, RR and SER.
- **06 `06-write-skew-serializable`** (slide 10) [R]
  - At RR, 0 reps stay on duty.
  - At SER, 40001 appears at the step the lab measures.
  - `SIReadLock` rows exist while nobody waits.
  - A retry keeps the business rule.
  - A pair touching different stores is measured too, to see whether it also aborts.
- **07 `07-large-transaction`** (slide 18) [2]
  - One 100k-row UPDATE vs 10 batches with VACUUM between: WAL, table size, ROLLBACK ms.
  - A single-row UPDATE waits (`pg_blocking_pids`) and ends with 55P03.
- **08 `08-idle-in-transaction`** (slides 19–21) [2]
  - The abandoned-transaction report query.
  - `backend_xmin` for RC read-only, RC after a write, and RR.
  - A 1 s idle timeout gives 25P03; `statement_timeout` gives 57014.

**Walkthroughs**

Setup: two psql windows, each opened with `docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab`. In each, run `\set PROMPT1 'S1%x> '` (the prompt shows `*` inside a transaction and `!` after an error) and `SET lock_timeout = '10s'`. Table columns: Bước | S1 | S2 | Bạn thấy (điền) | Đáp án (gập). Row 0 records `pg_backend_pid()`.

- **M1 (Day 02)**
  1. S1: `BEGIN; SELECT xmin, xmax, ctid, total FROM lab12_transaction.contracts WHERE id = 1;`
  2. S2: `UPDATE … SET total = total + 1000 WHERE id = 1 RETURNING xmin, ctid;` Did it wait?
  3. S1 runs the SELECT again (what changed?), then `COMMIT`.
  4. Repeat at RR. What is the old version's xmax?
  5. S2 runs an UPDATE and does not commit. S1 runs the SELECT: does it wait, and which total does it see?
- **M2:** lost update on id 2, first at RC, then at RR. S2 hangs; afterwards it gets `UPDATE 1` at RC and 40001 at RR.
- **M3 (Day 03)**
  1. Reset `store_reps`.
  2. Both sessions: `BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT count(*) … WHERE store_id = 44 AND on_duty;`
  3. S1 takes rep 1 off duty; S2 takes rep 2 off duty.
  4. Both COMMIT. The count is now 0.
  5. Repeat at SERIALIZABLE: which step returns 40001?
- **GUI option:** DBeaver or pgAdmin in manual-commit mode with separate connections. The pid must differ between tabs and stay the same across steps. Use DBX only if it passes that pid check.

**Dataset**
- The sandbox is two tables:
  - `contracts`: rows id ≤ 10,000 copied from `hw_contracts`. The roadmap's `hw_contracts WHERE id=1` maps here.
  - `store_reps`: store 44 with two reps on duty.
- `setup --force` restores both tables and prints a dataset card.
- Labs copy their scratch tables from lab03.
- `pg_walinspect` and `pg_buffercache` are installed into the schema, and `reset` drops them.

**Widgets**
- **W1:** WAL stepper with a "mất điện" (power cut) button (slides 5, 12).
- **W2:** MVCC visibility. It covers RC/RR, ROLLBACK, VACUUM against the horizon, and a pane showing the InnoDB undo chain for contrast (slides 13–16).
- **W3:** replay player. You predict, then it reveals, using Lab 05's JSON (slides 6–10, 24).

**Homework (slide 24)**
- **A, làm mẫu:** a walked-through non-repeatable read, replayed at RC and at RR.
- **B:** predict the matrix one row at a time in `homework-predictions.mine.mjs`. Values are `'xay_ra'|'khong'|'40001'`, plus a "vì sao" line. `npm run homework` refuses rows with `'???'`, then replays and marks ✔/✘.
- **C, tự làm:**
  - Write a check-then-insert scenario that creates a duplicate contract code, and replay it at RC, RR and SER.
  - Fix it two ways: with UNIQUE (the loser gets 23505) and with SER plus retry.
  - There are 5 grading criteria; the sample solution is `homework:solution`.
- **D, review:** a TypeORM service and test with planted bugs:
  - the injected repository used inside the `dataSource.transaction` callback;
  - an HTTP call inside the transaction;
  - `release()` outside `finally`;
  - a find-then-save lost update;
  - SER without a 40001 retry;
  - a `Promise.all` test with no forced interleaving.

**Verdict chips** (slide, chip, PG 16 truth)

| Slide | Chip | PG 16 truth |
|---|---|---|
| 4 | ok | plus 25P02 and SAVEPOINT |
| 5 | ok | — |
| 7 | diff | RU runs as RC |
| 8 | ok | app read-modify-write still loses updates |
| 9 | diff | no phantoms; 40001 on concurrent update; write skew remains |
| 10 | diff | SSI never blocks; it aborts, the app retries |
| 12 | ok | — |
| 13 | diff | new versions in the heap, no undo, instant rollback |
| 14 | diff | VACUUM, not purge |
| 15 | fix | slide is empty; stage 3 supplies MVCC in PG |
| 16 | diff | HLL becomes dead-but-not-removable tuples and `backend_xmin` |
| 18 | ok | plus WAL volume and bloat |
| 19 | ok | plus the held vacuum horizon |
| 20 | diff | no gap locks in PG |
| 21 | ok | — |
| 22 | diff | SET TRANSACTION applies to the current transaction |
| 23 | diff | RU = RC, and RR already stops phantoms |

**Bridge to lesson 14**
- S2's wait in M2 and Lab 07 shows that writers still block writers (slide 23).
- `SELECT … FOR UPDATE` is the other way to fix write skew, compared with SER plus retry (slide 25, optimistic vs pessimistic).
- The runner and the retry helper carry over to the Day 04 40P01 deadlock task (`deadlock_timeout = 1s` here).

## 8. Risks and unknowns
- **Wait detector.** It could race or misread a wait. Mitigation: run the matrix twice; `lock_timeout` caps any hang.
- **Unknown until the labs run:**
  - at which step SSI aborts (UPDATE or COMMIT);
  - whether the different-store pair also aborts (a false positive);
  - whether an idle RC read-only session shows NULL `backend_xmin`;
  - whether BEGIN writes a WAL record;
  - how big the `synchronous_commit` on/off gap is on Docker/WSL2. If it is small, that verdict shows ✘ and the narrative changes; the data does not.
- **node-pg errors.** The idle-timeout FATAL arrives as an `'error'` event; if it is not handled, the lab crashes.
- **His own sessions.** A session he leaves idle in a transaction (for example in DBX's pool, which has four idle connections now) would skew Labs 04 and 07. A pre-check warns about it.
- **Lesson-3 dependency.** Labs need the lesson-3 data to exist.
- **Source checks before quoting:**
  - InnoDB claims: dirty read at RU, next-key locks, SERIALIZABLE → FOR SHARE, slow rollback, doublewrite, and the slide-16 table from *Efficient MySQL Performance*;
  - TypeORM 0.3 API names.
- **Time.** Study time may run over if psql is new to him.

Summary (candidate's own): The guide keeps the lesson-3 shell with 8 lean labs. One step-table replay runner feeds the labs, the psql walkthroughs, W3 and the homework, and the sandbox is a 10k-row copy of hw_contracts. Day 02 covers WAL, MVCC and the common problems; Day 03 covers isolation, write skew and the homework.
Open items (candidate's own): fixing lesson-3's stale "Bài 4" teaser and old container name needs a user decision; five PG behaviours listed in Risks stay unverified until the labs run; whether DBX supports manual commit is unknown.
