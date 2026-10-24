# Candidate C

## 1. Outcome

All work stays on `main`, uncommitted. The UI is in Vietnamese.
- **`reports/advanced_backend/lesson_12_transaction_teacher_guide.html`**: the lesson-3 shell with 7 stages grouped under Ngày 02 and Ngày 03, 4 widgets, stage quizzes, a 10-question exam, a cheat sheet, a 26-slide map, references (slide 25 plus PG 16 docs) and a Bài 14 teaser.
- **`labs/lesson-12-transaction/`**: `setup`, `check`, `reset`, labs 12.01–12.08, a replay engine and the homework kit.
- **`plans/261024-1435-lesson-12-transaction-teacher-guide/`**: the filled-in `plan.md`, the verbatim `lab-runs/*.txt` files and the harness report.

After studying, Đạt can:
- predict and reproduce every anomaly × isolation level on PG 16 in two psql windows;
- read xmin/xmax/ctid and say which row version each session sees;
- diagnose bad transactions from `pg_stat_activity`;
- write a retry for error 40001;
- review TypeORM transaction code.

## 2. Constraints

- **Git and files:** `main` only. No branch, worktree, push, PR, issue or commit. Every file stays inside the repo; Markdown goes only under `plans/` or `docs/`.
- **Database:** lesson objects live only in `lab12_transaction`.
  - `lab03_indexing` stays read-only, even inside `BEGIN…ROLLBACK`. A rolled-back UPDATE still leaves a dead row version and clears all-visible bits. Lesson-3 homework expects 5,666/5,666 all-visible pages, and `homework-setup.mjs` warns when it is lower.
  - Never touch `lab_imdb` or `maycha_lease`. No `ALTER SYSTEM`, because the server is shared.
  - Terminate only the lab's own pids.
- **Concurrency:** the script fixes the step order.
  - A step that must block is confirmed by polling `pg_blocking_pids` (bounded to a few seconds); the next step is sent only after that.
  - Each session sets `lock_timeout`, `statement_timeout` and `idle_in_transaction_session_timeout` as a backstop.
  - `finally` rolls back and closes every client.
  - Only the Lab 06 timeout demo waits on the clock.
- **Determinism:** fresh `lNN_*` scratch tables with autovacuum off. Print roles ("xid của B") and differences, never raw xids or LSNs.
- **Secrets:** `PG_URL` is never printed. Manual psql goes through `docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab`, which needs no password.
- **Code size and data:** at most 200 lines per code file, Vietnamese comments. Every quoted number comes from `lab-runs/`. InnoDB facts are cited and labelled "không đo trên máy này".
- **Names and time:** only the new names (`quan-ly-hop-dong-postgres-1`, `D:\study\advance-be`), with PowerShell commands. Study time about 4.8 h plus a 30-minute exam.

## 3. Non-goals

- No MySQL.
- No edits to lesson-3 files. The stale "Bài 4" teaser and old paths there are a separate follow-up.
- No deadlock lab (that belongs to Bài 14).
- No crash tests and no replication-lag numbers.
- Nothing in the learner's app or in `maycha_lease`.

## 4. Acceptance criteria

1. The guide's `:root` tokens and its storage, quiz, exam and slide-map JS match lesson 3 except for the data. Check with diff.
2. At 360, 400 and 1280 px, in light and dark: no horizontal scroll and 0 console errors after every control is clicked. Check with the lesson-3 harness copied to `plans/…/verify/` (with its path fixed) in headless Chrome. Only Google Fonts load from outside; check with grep.
3. All 26 slide chips resolve. The `pg` underline sits exactly on slides 7, 9, 10, 13–16, 20, 22 and 23, and each of them has a `callout pg` with a verdict chip. Check with the harness and grep.
4. Every stage has a goal, a `wwh` grid, a widget or lab block, and a quiz whose answer keys are valid. Check with the harness.
5. Every terminal block names its date and npm script, and its text is a substring of a `lab-runs/*.txt` file. Check with a node compare script.
6. The npm scripts are `setup check reset lab1–lab8 homework homework:solution homework:scenario homework:scenario:solution`. Every file is at most 200 lines and none contains a literal `verdict(true`. Check with wc and grep.
7. Two runs of each lab are identical once ms values are masked, and each lab finishes in 60 s or less. Check with diff.
8. After the full run, `npm run check` passes:
   - no `lNN_*` tables and no `lesson-12-%` sessions remain;
   - `hw_contracts` is still 5,666/5,666 all-visible, with row 1 xmin 875;
   - nothing new exists outside `lab12_transaction`.
   Check with catalog queries.
9. While another session sits idle in a transaction, labs 03–06 refuse to run and print that session's pid and the fix. Check with a recorded negative test.
10. The M1–M3 tables in the guide equal the output of `npm run lab7 -- --psql <id>`. Check with diff.
11. An untouched `.mine` file is refused, listing every `'???'`. The solution files pass. Check in `lab-runs/`.
12. A grep for the password value, run inside the container, returns zero files.

## 5. Trade-offs

| Decision | Approach | Depends most on | Fails first when | Worst plausible case |
|---|---|---|---|---|
| How two sessions are driven | **A1** One Node process, 2–3 clients, awaited steps plus a block probe | the probe catching the wait | an expected block does not happen | ✘ or 55P03 within 5 s; never hangs |
| | **A2** Manual psql ×2 only | the learner's exact step order | he commits before the other session reads | he silently learns the wrong rule and leaves a stray open transaction |
| | **A3** isolationtester or dblink | the binary or extension | neither exists here (only plpgsql plus the lab03 extensions) | DDL outside the lab schema |
| Dataset | **B1** Use `hw_contracts` in place (the roadmap's wording) | lesson 3 tolerating writes | the first UPDATE, even rolled back | lesson-3 numbers stop reproducing |
| | **B2** Full 500k-row copy | labs sharing one mutable table | manual practice changes it | drifting outputs, +55 MB |
| | **B3** 10k-row copy plus per-lab scratch tables | lesson-3 data being present | lesson-3 `reset` has run (it also drops pageinspect) | setup refuses; about 25 s to fix |
| Stage order | **C1** Slide order (a straight clone) | isolation being teachable before snapshots | the slide 9/10 verdicts | the roadmap's daily goals land on the wrong day |
| | **C2** Roadmap order, one file | the learner accepting slide ranges out of order | he reads the PDF straight through in parallel | brief confusion; the slide map fixes it |
| Reuse of lesson 3 | **D1** Import the lesson-3 kit | its `connect()` | it sets `search_path` to `lab03_indexing` | scratch tables get created inside the lesson-3 schema |
| | **D2** Copy all the lesson-3 machinery | the learner reading about 400 unused lines | CLAUDE.md rule 1 | he stops reading the code |
| | **D3** New `tx-kit.mjs` (≤150 lines) plus the lesson-3 HTML/JS shell and 4 widgets | four widgets being enough | a lab needs a missing helper | about 20 duplicated formatter lines |

**Choice:**
- **A1 paired with A2:** the manual tables are printed from the same steps, and the script output is the answer key.
- **B3, C2 and D3.**

## 6. Better approaches

1. **Roadmap order instead of slide order.**
   - Evidence: the Day 02 goal is xmin/xmax and the Day 03 goal is write skew. The PG verdicts for slides 7, 9 and 10 only make sense once snapshots are known.
   - Change: Day 02 covers slides 1–5 and 11–21; Day 03 covers 6–10 and 22–26.
   - Cost: none.
2. **Copy `hw_contracts` instead of touching it.**
   - Evidence: the all-visible problem in §2.
   - Change: M1 runs on row 1 of `lab12_transaction.contracts` (HD0000001, store 44).
   - Cost: about 1 MB and 2 s of setup.
3. **One replay engine.**
   - Evidence: slide 24 asks for a "replay script" but ships none. The 5×4 grid is 20 runs of 5 step lists. Lesson 3's runner already refuses `'???'`.
   - Change: scenarios are written as data (`{s, sql, args?}`) and feed the labs, the psql tables and the homework.
   - Cost: about 120 lines, with no logic allowed in the data.
4. **Project-rule changes a straight clone would miss:** environment setup comes first, comments are in Vietnamese, and homework gets a hands-on Part C (CLAUDE.md rule 2).

## 7. Recommended direction

**Stages** (Day 02 is 155 minutes; Day 03 is 135 minutes plus the 30-minute exam)

| Day | Stage · labs and widgets | Slides | Min |
|---|---|---|---|
| 02 | Cách học + môi trường | 1–3 | 10 |
| 02 | 1 Transaction & ACID trên PG · Lab 01 | 4–5 | 25 |
| 02 | 2 WAL · Lab 02, W1 | 11–12 | 25 |
| 02 | 3 MVCC trong Postgres · Lab 03, W2, M1 | 13–15 | 45 |
| 02 | 4 Phiên bản cũ & transaction xấu · Labs 04–06, W4 | 16–21 | 50 |
| 03 | 5 Bốn mức cô lập · Lab 07, W3, M2 | 6–10, 22 | 50 |
| 03 | 6 Write skew & Serializable · Lab 08, M3 | 10, 23 | 35 |
| 03 | 7 Bài tập & NestJS | 24–26 | 50 |

**Labs** (files named `NN-name.mjs`; every verdict is computed from the run)

| Lab | Slides | What it proves | How it runs · what it checks |
|---|---|---|---|
| 01 atomicity-and-errors | 4–5, 22 | all-or-nothing; error 25P02; COMMIT on a failed block returns ROLLBACK; SAVEPOINT; DDL rolls back but sequences do not; scope of SET TRANSACTION | one session; error code, command tag, captured WARNING |
| 02 wal-and-commit | 11–12 | WAL is written first; COMMIT flushes it; a full-page image after CHECKPOINT; `synchronous_commit=off` | `EXPLAIN (ANALYZE, WAL)` and LSN differences; full-page images 1→0, flush LSN past the commit |
| 03 mvcc-tuple-versions | 13–15 | old and new versions coexist; readers and writers do not block each other; a writer blocks a writer; ROLLBACK just marks the xid aborted | engine scenario `mvcc` plus `lab03_indexing.heap_page_items`; ctid/xmin/xmax equalities, `pg_xact_status` |
| 04 old-snapshot-dead-tuples | 14, 16, 19 | PG's version of HLL: an open snapshot keeps N dead versions, so the same SELECT reads more pages | A holds a Repeatable Read snapshot; B updates one row N ∈ {0, 500, 1k, 2k, 5k, 10k} times (server-side loop); "not yet removable" = N, pages rise, then return to baseline after COMMIT + VACUUM |
| 05 large-transaction-batching | 14, 18 | a big UPDATE bloats the table and holds locks; ROLLBACK is instant but keeps the space; batches reuse space | 200k-row scratch copy plus a probe with `lock_timeout`; page growth, 55P03 versus success |
| 06 idle-in-transaction | 19–22 | stalled and abandoned transactions; Repeatable Read keeps `backend_xmin`, read-only Read Committed does not; the timeout kills the session; a closed client is aborted | observer plus bounded poll; session state, 25P03, lock released |
| 07 isolation-replay + `scenarios.mjs` | 6–10 | 5 anomalies × 4 levels; READ UNCOMMITTED behaves as READ COMMITTED | engine with `--psql` and `--json` (data for W3); each cell against the expected result |
| 08 write-skew-serializable | 10, 23 | write skew at RR; 40001 at SERIALIZABLE; retry keeps the rule; a false positive on a seq-scanned table; a `FOR UPDATE` teaser | engine; count of reps on duty, exactly one 40001 |

**Manual walkthroughs**
- **Tools:** the actors are two PowerShell windows running `docker exec -it -e PGAPPNAME=A …psql`, then `SET search_path = lab12_transaction;`. The prompt `=*#` means a transaction block is open. A DBX, DBeaver or pgAdmin observer runs SELECTs only, with auto-commit on.
- **Table columns:** Bước | Cửa sổ A | Cửa sổ B | Bạn thấy. Inputs are saved in the browser.
- **M1 (Day 02 goal):**
  1. A: `BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT xmin, xmax, ctid, paid FROM contracts WHERE id = 1;`
  2. B: `UPDATE contracts SET paid = paid + 100 WHERE id = 1 RETURNING xmin, ctid;` It returns at once.
  3. A runs the same SELECT again and still sees the old version, now with xmax set to B's xid.
  4. B runs the same SELECT and sees the new version.
  5. A: `SELECT lp, t_xmin, t_xmax, t_ctid FROM lab03_indexing.heap_page_items(lab03_indexing.get_raw_page('lab12_transaction.contracts', 0)) WHERE lp IN (1, k);` Here k is the new ctid's offset.
  6. A: `COMMIT;`, then `VACUUM (VERBOSE) contracts;`
- **M2 ("Làm mẫu", lost update):** run at Read Committed, then at Repeatable Read. Both windows read `paid`. A writes `paid = 100`. B's `UPDATE … paid = 50` waits, and the observer sees `pg_blocking_pids`. A commits. B then overwrites at Read Committed, or gets 40001 at Repeatable Read. Finish with the atomic `paid = paid + 50`.
- **M3 (Day 03 goal):**
  1. Both windows run `BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT count(*) FROM store_reps WHERE store_id = 44 AND on_duty;` and get 2.
  2. A: `UPDATE store_reps SET on_duty = false WHERE rep = 'An';` B does the same for `'Binh'`. Neither waits.
  3. Both commit; the count is now 0.
  4. Repeat with `SERIALIZABLE`: B gets 40001, then runs `ROLLBACK;`.

**Dataset**
- `contracts` holds `hw_contracts` ids 1–10,000 (store 44 has 26 ACTIVE), plus a `paid` column, at fillfactor 90 so that M1's two versions share page 0.
- `store_reps` covers stores 44 and 45, with two reps on duty in each.
- Labs copy what they need into `lNN_*` tables. `reset` rebuilds everything after manual practice.

**Widgets**
- **W1:** the write path plus a power-cut replay, with toggles for `synchronous_commit` and `full_page_writes` (slides 5, 12).
- **W2:** a heap page with two snapshots, plus an InnoDB undo-chain toggle (slides 13–15).
- **W3:** a step-through of two sessions where the learner predicts first, then sees the measured outcome, with SSI dependency arrows (slides 6–10).
- **W4:** classify `pg_stat_activity` cards as large, long, stalled or abandoned, then pick the fix (slides 18–21).

**Homework (slide 24)**
- **A:** run setup and copy the dataset card.
- **B:** in `homework-predictions.mine.mjs`, predict each of the 20 cells (`'anomaly'`, `'none'` or `'40001'`), say whether any step waits, and write an explanation. The runner refuses `'???'`, replays every cell and marks ✔ or ✘.
- **C (Tự làm):** the rule "at most 3 ACTIVE contracts per customer" breaks under write skew via INSERT. He writes the scenario and a retry of about 20 lines. Grading:
  - the rule breaks at Repeatable Read;
  - SERIALIZABLE raises 40001;
  - the retry keeps the rule;
  - `check` passes;
  - he explains why no CHECK or UNIQUE constraint can express the rule.
- **Solutions:** `npm run homework:solution` and `npm run homework:scenario:solution`.
- **NestJS/TypeORM drill** (answers folded). Six planted bugs:
  - the global repository used inside `transaction()`;
  - an HTTP call inside the transaction;
  - a QueryRunner not released in `finally`;
  - find-modify-save (lost update);
  - no retry on 40001;
  - a swallowed error followed by more queries (25P02).

**Verdict chips**
- **`Đúng trên PG16`**, with PG notes:
  - 4: an error aborts the whole block (25P02).
  - 5: Isolation is complete only at SERIALIZABLE.
  - 8: Read Committed also allows phantoms and application-level lost updates.
  - 12, 18, 19, 21: correct on PG, plus a PG note in each section.
- **`MySQL đúng, PG khác`:**
  - 7: READ UNCOMMITTED runs as Read Committed, so there are no dirty reads.
  - 9: Repeatable Read uses one snapshot, so no phantoms; a concurrent update raises 40001; write skew remains.
  - 10: SSI takes no read locks; it aborts with 40001 and the app retries.
  - 13: no undo log; versions live in the heap.
  - 14: VACUUM works by the xmin horizon; ROLLBACK is instant.
  - 16: HLL numbers are cited; on PG the equivalent is dead tuples that cannot be removed yet.
  - 20: there are no gap locks; Read Committed frees the snapshot between statements.
  - 22: SET TRANSACTION applies only to the current block, before its first query.
- **`Cần sửa`:**
  - 15: the slide is empty.
  - 23: it claims transactions work through "undo logs".

**Bridge to Bài 14:** the wait in M2 is a row lock stored in the tuple's xmax. The `FOR UPDATE` fix in Lab 08 leads to lock ordering and error 40P01 (the Day 04 goal), and the retry is reused there.

## 8. Risks and unknowns

- **Must be checked by a lab before the guide quotes it:**
  - whether SSI raises 40001 at the UPDATE or at the COMMIT;
  - whether `backend_xmin` is NULL for a read-only Read Committed idle session;
  - the page-growth pattern in Lab 04;
  - how much `synchronous_commit=off` gains under Docker Desktop's fsync;
  - whether the false positive appears;
  - TypeORM `QueryFailedError.code` and savepoint behaviour. The docs do confirm `transaction('SERIALIZABLE', cb)`, the QueryRunner start, commit, rollback and release methods, and the rule "DO NOT USE GLOBAL ENTITY MANAGER".
- **Stray GUI transactions:** 4 idle sessions with no application name are connected now. If one is left open in a transaction, it skews labs 03–06; the refusal check catches this.
- **`npm install` needs the network once.** Fallback: copy lesson 3's `node_modules`.
- **Lesson-3 `reset` drops pageinspect,** which M1 and Lab 03 need.
- **PowerShell quoting** for `-e PGAPPNAME` and **DBX's auto-commit controls** are unverified, so DBX is used only as an observer.
- **Every measured number is unknown until the labs run.**

Sources: [TypeORM transactions docs](https://typeorm.io/docs/transactions.md), [typeorm.io/docs/transactions](https://typeorm.io/docs/transactions)

Summary (candidate's own): Contract for the lesson-12 guide and labs. It follows the roadmap's day order rather than the slide order, copies hw_contracts into lab12_transaction instead of writing to it, and uses one replay engine for the labs, the manual psql tables and the slide-24 homework; the walkthroughs use two psql windows plus a GUI observer.
Open items (candidate's own): several PG 16 behaviours (where SSI raises 40001, backend_xmin under Read Committed, Lab 04's page pattern, the synchronous_commit gain) must be checked by a lab before the guide quotes them.
