# Candidate E

## 1. Outcome

- `D:/study/advance-be/reports/advanced_backend/lesson_12_transaction_teacher_guide.html`. It reuses the lesson-3 shell and is written in Vietnamese. It has 8 stages (about 4 h 45′) spread over roadmap Day 02 and Day 03, plus 5 widgets, quizzes, an exam, a cheat sheet, a 26-chip slide map and a lesson-14 teaser.
- `D:/study/advance-be/labs/lesson-12-transaction/` with these npm scripts: `setup`, `check`, `reset`, `lab1`–`lab8`, `homework`, `homework:draft`, `homework:solution`.
- `D:/study/advance-be/plans/261024-1435-lesson-12-transaction-teacher-guide/`. Its `plan.md` is still a template and gets filled in. It also gets `lab-runs/*.txt`, which is the only place quoted numbers may come from.
- After the lesson, Đạt can explain what COMMIT guarantees and read `xmin/xmax/ctid`. He can predict each anomaly at each PG level and replay it in two psql windows. He can also stop idle-in-transaction sessions and review TypeORM transaction code.

## 2. Constraints

- Work on `main` and leave it uncommitted. No branch, worktree, push, PR or issue.
- Create objects only in `lab12_transaction`. Treat `lab03_indexing` as read-only; copying from it and calling its `pageinspect` is fine. Never touch `lab_imdb` or `maycha_lease`. No `ALTER SYSTEM`; set every timeout per session.
- The order of steps drives the interleaving. An observer session confirms each wait with `pg_blocking_pids()`. Every wait is capped by `lock_timeout` or `statement_timeout`. Every session is rolled back and closed in `finally`.
- Never print `PG_URL`. Use the new container name `quan-ly-hop-dong-postgres-1`.
- Each file stays at 200 lines or fewer.
  - Comments are in Vietnamese; CLAUDE.md overrides lesson 3's English comments.
  - Verdicts are computed, never hard-coded.
  - Output is identical across runs except ms, xid, LSN and pid.
- Manual psql runs through `docker exec -it`, which gives psql 16.15 with no password. The host also has psql 18.3.
- Study time is about 4.75 h, like lesson 3.

## 3. Non-goals

- Measuring MySQL. MySQL facts are cited and labelled "không đo trên máy này".
- Lesson-14 content beyond a waiting-writer preview and homework D.
- Editing lesson-3 files: the old container name and the "Bài 4" teaser need the user's decision.
- Prepared-transaction labs (`max_prepared_transactions = 0` here).
- The learner's NestJS repo.
- HTTP tools, since nothing here goes over HTTP.
- A kit shared across lessons.

## 4. Acceptance criteria

1. The page uses the lesson-3 shell: an 8-stage rail, progress saved under `l12-*` localStorage keys (lesson 3's `l3-*` keys untouched), and the hero "Bài 12 / 16". Check: grep for `chang-1`…`chang-8`, `phong-van`, `cheat-sheet`, `ban-do-slide`.
2. It works offline except for fonts, renders in light and dark, has no horizontal scroll at 360 px and no console errors. Check: grep for external URLs; use devtools.
3. The slide map has 26 chips and every href resolves. Slides 7, 9, 10, 13–16, 20, 22 and 23 carry the pg mark. Each of their sections has a `callout pg`, a chip and a lab reference. Check: a script over `SLIDES`.
4. Every stage has a goal, a `wwh` grid, a widget or a verbatim lab block, and a quiz of 3–5 questions with valid answer indices. The page also has the exam and references (slide 25 plus the PG 16 docs).
5. Every npm script runs, `wc -l` is 200 or less per file, and no literal `verdict(true` exists.
6. Each lab was run twice. The diff of the two runs is empty after masking ms, xid, LSN and pid. Every number in the guide can be found by grep in `lab-runs/`.
7. Run `npm run check` after a full run and after a run stopped with Ctrl+C. It must pass both times:
   - only the expected objects exist;
   - no `lesson-12*` session or lab12 lock remains;
   - `hw_contracts` still has 500,000 rows and `n_tup_upd = n_tup_del = 0` (both are 0 today).
8. The walkthrough SQL is identical to the steps labs 3, 5 and 8 ran (diff it against `scenarios.mjs`), and fill-in cells persist.
9. Homework checks:
   - With predictions left blank, the runner refuses, lists every `'???'` cell and exits 1.
   - `homework:solution` prints a measured 6×4 matrix with every cell ✔, plus the answers to parts C and D.
   - `homework:draft` runs safely.
   - All three outputs are stored in `lab-runs/`.
10. The NestJS drill has 6 bugs with folded answers, and its API names are checked against the learner's TypeORM version.
11. No `postgres://`, `PGPASSWORD` or `POSTGRES_PASSWORD` appears in new files. `git status` shows only the expected paths.

## 5. Trade-offs

**A. Driving two-session labs**
- **A1 – Node runner** with sessions A and B plus an observer, printing a step timeline and `--json` for widgets.
  - Assumes: each step either blocks or finishes, the same way every run.
  - Fails first: on a wait the scenario did not declare (for example a GUI holding a lock). `lock_timeout` turns that into a reported error.
  - Worst case: it feels like magic.
- **A2 – Manual psql ×2 only.**
  - Assumes: the learner types every step without mistakes.
  - Fails first: a forgotten `BEGIN` autocommits and hides the anomaly.
  - Worst case: a wrong conclusion, and no measured output to quote.
- **A3 – `dblink` from one SQL file.**
  - Assumes: the loopback connection needs no password.
  - Fails first: auth needs a secret written into the SQL.
  - Worst case: a leaked credential, and the learner never sees two sessions.
- **Choice: A1, with A2 replaying the same steps.** A1 has the mildest worst case. Lesson 2's `sleep()` races are banned by §7.

**B. Dataset**
- **B1 – Use `hw_contracts` in place**, as the roadmap text says.
  - Assumes: small writes are harmless.
  - Fails first: the first UPDATE changes lesson-3 data and clears page 0's all-visible flag.
  - Worst case: lesson-3 homework T2 regrades without warning. Its rows start at block 523 today, but other ids could hit them.
- **B2 – Copy ids 1–100,000** into `lab12_transaction.contracts`, plus a 4-row `store_reps` table.
  - Assumes: lesson 3's data has been set up.
  - Fails first: after lesson 3's `reset`; setup then prints a clear message.
  - Worst case: rerun lesson 3's setup.
- **B3 – A new standalone dataset.**
  - Assumes: continuity with earlier lessons is optional.
  - Fails first: it breaks CLAUDE.md rule 4.
  - Worst case: the lesson feels disconnected.
- **Choice: B2.**

**C. Day split**
- **C1 – Follow slide order.**
  - Assumes: isolation levels can be taught before snapshots.
  - Fails first: PG Repeatable Read (no phantoms, error 40001) cannot be explained without snapshots.
  - Worst case: Day 02's MVCC goal slips to Day 03.
- **C2 – Follow the roadmap**: slides 1–5 and 11–21 first, then 6–10 and 22–26.
  - Assumes: the slide map absorbs the reordering.
  - Fails first: for a learner who reads the PDF straight through.
  - Worst case: he is briefly disoriented.
- **Choice: C2.**

**D. How much of the lesson-3 machinery to reuse**
- **D1 – Import `D:/study/advance-be/labs/lesson-03-index/pg-explain-kit.mjs`.**
  - Assumes: its defaults fit.
  - Fails first: it forces `search_path = lab03_indexing` and `application_name = lesson-03-index-lab`, and its hints use the old container name.
  - Worst case: an edit in one lesson breaks the other lesson's verified runs.
- **D2 – Own small kit**: copied print helpers, sessions and the runner, plus a `scenarios.mjs` shared by labs 6–8 and the homework.
  - Assumes: a copy per lesson is acceptable; lessons 2 and 3 already work this way.
  - Fails first: when the runner grows.
  - Worst case: it turns into a framework. Cap it at about 120 lines, with steps written as plain `['A', sql]` rows.
- **D3 – One kit shared across lessons.**
  - Assumes: lesson 3 may be refactored.
  - Fails first: on lesson 3's verified outputs.
  - Worst case: lesson-3 regressions.
- **Choice: D2.**

## 6. Better approaches

1. **Teach the mechanism first (C2).** Evidence: the roadmap rows; the PG 16 docs say a Repeatable Read transaction "sees a snapshot as of the start of the first non-transaction-control statement"; slide 15 is empty. Cost: only the slide-map links change.
2. **Make step timelines from real connections the headline output**, instead of lesson 3's page counts. Evidence: §7 bans sleeps, and lesson 2 used `sleep()` on a fake DB. Cost: a runner of about 120 lines.
3. **Show slide 12 with real WAL records.** `pg_walinspect` 1.1 is available and relocatable. Filtering by the lab's xid stays deterministic and shows COMMIT and ABORT records with no undo. Cost: one extension, dropped by `reset`.
4. **Use the GUI client only as an observer.** Four idle host sessions with blank `application_name` exist right now. A GUI left in the middle of a transaction would hold back the VACUUM horizon and skew lab 4.

## 7. Recommended direction

**Stages**

| # | Stage | Slides | Min | Day |
|---|---|---|---|---|
| 0 | Cách học, mở 2 cửa sổ psql | 1–2 | 5 | 02 |
| 1 | Transaction & ACID trên PG | 3–5 | 20 | 02 |
| 2 | WAL: COMMIT làm gì | 11–12 | 20 | 02 |
| 3 | MVCC trong PostgreSQL | 13–15 | 40 | 02 |
| 4 | Phiên bản chết, VACUUM, "HLL" của PG | 14, 16 | 20 | 02 |
| 5 | Transaction lớn, dài, treo, bị bỏ rơi | 17–21 | 30 | 02 |
| 6 | Đặt mức cô lập, bất thường khi đọc | 6–9, 22 | 30 | 03 |
| 7 | Lost update, write skew, Serializable | 8–10 | 40 | 03 |
| 8 | Recap, bài tập, NestJS, exam | 23–26 | 80 | 03 |

**Labs**

S = one session; R = runner plus observer. Any lab over 200 lines is split into `-part-a` and `-part-b`.

| Lab | Slides | Proves | Drive | Verdicts on |
|---|---|---|---|---|
| 01 atomicity-pg-rules | 4–5 | error → 25P02, COMMIT replies ROLLBACK; SAVEPOINT; DDL rolls back, sequences don't | S | tags, rows, nextval gap |
| 02 wal-records | 5, 12 | change logged first; COMMIT record flushed; rollback = ABORT, no undo | S | record types by xid; flush LSN ≥ commit LSN |
| 03 mvcc-two-sessions | 13–15 | UPDATE makes a new version; readers and writers don't block each other; RC sees new, RR sees old with xmax set; second writer waits | R | `RETURNING xmin`, ctid, blockers, both versions via `pageinspect` |
| 04 dead-versions-horizon | 13–14, 16 | fast ROLLBACK leaves dead tuples; open RR snapshot blocks cleanup; lookups touch more pages | R | VACUUM VERBOSE counts; pages at 0/100/1,000 versions |
| 05 big-and-idle-tx | 17–21 | batches vs one UPDATE; idle transaction blocks writers; 55P03; 25P03; `pg_terminate_backend` | R | WAL, size, state, codes |
| 06 levels-read-anomalies | 6–9, 22 | where SET TRANSACTION must go; RU = RC; non-repeatable read and phantom only at RC | R | `transaction_isolation`, values |
| 07 lost-update | 8–9 | app read-modify-write loses at RC, gets 40001 at RR; atomic update safe at RC | R | total vs expected, SQLSTATE |
| 08 write-skew | 9–10, 23 | RR: both commit (0 on duty); SER: one 40001; retry; seq-scan false positive | R | count, single 40001, retry |

The runner never injects its own statements into a session, because that would move a Repeatable Read snapshot.

**Manual walkthroughs**

Windows A and B each run `docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab`, then `SET search_path = lab12_transaction;`. The observer is DBX, DBeaver or pgAdmin with auto-commit on. It runs only `SELECT pid, state, pg_blocking_pids(pid) FROM pg_stat_activity`.

M1 (Day 02 done-criterion). Q = `SELECT xmin, xmax, ctid, total FROM contracts WHERE id = 1;`

| # | A | B | Fill in |
|---|---|---|---|
| 1 | `BEGIN;` Q | | xmin, xmax, ctid |
| 2 | | `UPDATE contracts SET total = total + 1 WHERE id = 1 RETURNING xmin, ctid;` | instant? new xmin/ctid |
| 3 | Q; `COMMIT;` | | which version |
| 4 | repeat 1–3 with `BEGIN ISOLATION LEVEL REPEATABLE READ;` | | version, xmax |
| 5 | Q | `BEGIN;` UPDATE left open; a third psql repeats it | A blocked? who waits |

M2 (optional): A leaves an UPDATE open. B sets `lock_timeout = '3s'` and gets 55P03. The observer then runs `pg_terminate_backend`.

M3 (Day 03 done-criterion). C = `SELECT count(*) FROM store_reps WHERE store_id = 44 AND on_duty;`

| # | A | B | Fill in |
|---|---|---|---|
| 1 | `BEGIN ISOLATION LEVEL REPEATABLE READ;` C | same | counts |
| 2 | `UPDATE store_reps SET on_duty = false WHERE store_id = 44 AND rep_id = 1;` | `rep_id = 2` | did B wait? |
| 3 | `COMMIT;` | `COMMIT;` | each result |
| 4 | C; then reset with `UPDATE store_reps SET on_duty = true;` | | final count |
| 5 | repeat with `SERIALIZABLE` | | which step errors, SQLSTATE |

**Dataset**

`npm run setup` is idempotent and accepts `--force`. It builds:
- `contracts`: a copy of ids 1–100,000 with a primary key, so id 1 is still HD0000001 in store 44;
- `store_reps`: stores 44 and 45, two on-duty reps each, ASCII names;
- the `pg_walinspect` extension, then prints a dataset card.

Labs work on scratch copies named `lNN_*` with autovacuum off, so the learner's manual play never changes lab numbers.

**Widgets**

- W1: transaction state machine with the psql prompt `=#`/`=*#`/`=!#` (slides 4–5, 22).
- W2: WAL crash simulator with `synchronous_commit` on/off (slides 5, 12).
- W3: "which version do you see?" using lab 3's data, RC vs RR (slides 13–15).
- W4: two-session player over the lab 6–8 timelines, showing only the cases the labs demonstrate (slides 7–10).
- W5: idle-transaction board from lab 5; the learner picks which pid to kill and which timeout would have prevented it (slides 16, 18–21).

**Homework (slide 24)**

- **A.** Copy the dataset card.
- **B.** Fill `homework-predictions.mine.mjs`.
  - 6 scenarios (dirty read, non-repeatable read, phantom, app lost update, atomic update, write skew) × 4 levels (RU, RC, RR, SER).
  - Each cell is `'xảy ra' | 'không' | '40001'`, plus a two-line explanation.
  - The runner refuses `'???'`, runs the filled rows, and prints the timeline for every ✘.
  - Expected key, to be decided by measurement: RU behaves like RC; lost update and atomic update give 40001 at RR and SER; write skew gives 40001 only at SER.
- **C.** Review `homework-ai-draft.mjs`, which has four planted flaws:
  - one client used for both sessions;
  - `SET TRANSACTION` issued before `BEGIN`;
  - a write-skew test on rows that share no invariant;
  - COMMIT errors ignored.
- **D. Tự làm.** Keep M3's invariant at RC using `SELECT … FOR UPDATE` on the rows (not on `count(*)`). Passing means B waits, then sees 1 and refuses, with no 40001.
- `homework:solution` measures all of the above.
- **NestJS drill** (6 bugs, folded answers):
  - the injected repository used inside `dataSource.transaction`;
  - read-modify-write through `save()`;
  - an HTTP call inside the transaction;
  - a QueryRunner not released in `finally`;
  - no retry of the whole callback on 40001;
  - a swallowed error leading to 25P02.

**Verdict chips**

Slides 4, 5, 8, 12, 18, 19 and 21 get `Đúng trên PG16`. The rest:

| Slide | Chip | PG 16 truth |
|---|---|---|
| 7 | MySQL đúng, PG khác | RU runs as RC; no dirty reads |
| 9 | MySQL đúng, PG khác | snapshot at first statement; no phantoms; same-row update → 40001; write skew remains |
| 10 | MySQL đúng, PG khác | SSI: SIRead locks never block; 40001, then retry |
| 13 | MySQL đúng, PG khác | no undo log; versions live in the heap |
| 14 | MySQL đúng, PG khác | VACUUM purges; ROLLBACK only marks the xid aborted |
| 15 | Cần sửa | empty slide with "MVVC" typo; the guide fills it |
| 16 | MySQL đúng, PG khác | HLL is InnoDB (cited); PG: dead versions held back by the oldest snapshot |
| 20 | MySQL đúng, PG khác | no gap locks; a stalled transaction holds row locks and the horizon |
| 22 | MySQL đúng, PG khác | SET TRANSACTION applies to the current transaction and must come first; outside a block it only warns |
| 23 | Cần sửa | PG has no undo; isolation also relies on row locks |

**Bridge to lesson 14**

Lab 3's waiting writer and homework D's `FOR UPDATE` lead into Day 04. There, two sessions lock ids 1 and 2 in opposite order and get 40P01 after `deadlock_timeout` (1 s here); the fix is a consistent lock order. Question to carry over: which contract endpoint needs SERIALIZABLE plus retry, and which needs `FOR UPDATE`?

## 8. Risks and unknowns

- These must be verified by a lab before the guide quotes them:
  - which statement SSI fails on;
  - whether the false positive reproduces (`max_pred_locks_per_page = 2` may promote locks; if not, cite the docs);
  - that a read-only idle transaction at RC holds no `backend_xmin`;
  - dead-version page counts;
  - `pg_walinspect` record names;
  - the psql prompt glyphs;
  - that TypeORM sends `START TRANSACTION` followed by `SET TRANSACTION`.
- `synchronous_commit` timing on Docker Desktop may barely differ, so it is reported in ms only.
- A session killed by the server raises a `pg` `error` event; if it is not handled, Node crashes.
- How the GUI clients handle auto-commit is unknown, so labs 4–5 warn when another session holds `backend_xmin` or `backend_xid`.
- Not knowable now: all measured numbers, the learner's TypeORM version (1.x exists), and whether 4.75 h holds (M2 and the false-positive part are optional).

Sources: [PG 16 transaction isolation](https://www.postgresql.org/docs/16/transaction-iso.html), [TypeORM transactions](https://typeorm.io/docs/transactions), [TypeORM DataSource.d.ts](https://unpkg.com/browse/typeorm@1.1.0/data-source/DataSource.d.ts)

Summary (candidate's own): Recommends keeping the lesson-3 shell but teaching the mechanism first (Day 02 WAL/MVCC, Day 03 isolation), with 8 labs run on this machine, driven by a small two-session runner whose waits are confirmed by an observer, on a lab12_transaction copy of hw_contracts, plus a homework where Đạt predicts the anomaly × level matrix.
Open items (candidate's own): several PG behaviours (where SSI fails, the false positive, the RC horizon) must be checked by a lab before quoting; the learner's TypeORM version is unknown; the user must decide on not running the roadmap's literal UPDATE on hw_contracts and on fixing lesson 3's "Bài 4" teaser and old container name.
