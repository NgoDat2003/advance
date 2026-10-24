# Planning packet — `/ak:plan --ultra --tdd`, Lesson 12 (Transaction)

Immutable input for the five planner candidates and the plan verifier. Do not edit during the ultra pass.

## 1. Task

Write ONE complete, executable implementation plan (TDD mode) for the accepted brainstorm contract. The plan turns the contract into phases a controller (and lab-writer delegates with disjoint file ownership) can execute without further design decisions.

Plan directory: `plans/261024-1435-lesson-12-transaction-teacher-guide/` (it already holds the stub `plan.md` and `phase-01-start.md` from `ak plan create`; the winning candidate replaces both).

## 2. Inputs (authority order)

1. **Accepted contract** — `brainstorm/candidate-E.md`. Its decisions are settled: roadmap order (Day 02 = WAL/MVCC/common problems, Day 03 = isolation/write skew/homework), 8 stages, labs 01–08 as listed, Node runner with two sessions plus an observer and the same steps replayed by hand in two psql windows, dataset copied into `lab12_transaction` (ids 1–100,000 of `hw_contracts` as `contracts`, plus `store_reps`), an own small kit plus `scenarios.mjs` shared by labs and homework, 5 widgets, homework A–D plus a 6-bug NestJS/TypeORM drill, the verdict-chip table, the lesson-14 bridge.
2. **Must-fix notes** — `brainstorm/verdict.md` §"Must-fix notes" (10 items). Every one must be resolved in the plan, explicitly.
3. **Evidence packet** — `evidence-packet.md` (request, accepted format, learner profile, slides, PG-vs-MySQL facts, environment, constraints).
4. **Measured facts** — `probes/probe-anomaly-matrix.out.txt` (controller probe on this machine, PG 16.15) and §3 below.
5. **Lesson-3 references** — `reports/advanced_backend/lesson_03_index_teacher_guide.html`, `labs/lesson-03-index/` (`package.json`, `pg-explain-kit.mjs`, `check-lab-state.mjs`, `homework-*.mjs`), `plans/261019-1634-lesson-03-index-teacher-guide/` (`plan.md`, `delegate-brief.md`, `review-packet.md`, `lab-runs/`, `verify/harness.html`).

Do not read `brainstorm/candidate-A.md` … `candidate-D.md` (losing contracts; borrowing from them is blending) and do not open other `reports/planner-ultra-candidate-*.md` files.

## 3. Facts verified by the controller on 2026-10-24 (beyond the evidence packet)

- `advance_be_lab` has a **database-level** setting `search_path = lab03_indexing, public` (`pg_db_role_setting`). Any fresh session, psql or GUI, resolves unqualified names into lesson 3's schema first.
- Probe results on PG 16.15 (two sessions, step order fixed by the script):
  - READ UNCOMMITTED: `SHOW transaction_isolation` says `read uncommitted`, but no dirty read (100), non-repeatable read 100→50, phantom 2→3, app lost update (final 80), write skew (0 on call) — identical to READ COMMITTED.
  - REPEATABLE READ: 100→100, 2→2, lost update → `40001 could not serialize access due to concurrent update`, write skew allowed (0 on call).
  - SERIALIZABLE: as RR, and write skew blocked: with order A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT, B's UPDATE succeeds and **B's COMMIT** fails with `40001 could not serialize access due to read/write dependencies among transactions` (1 on call).
  - RR reader vs writer: writer finished in 2.3 ms (not blocked); reader re-select still shows the old version with `xmax` = writer's xid and the old ctid; the new version got a new ctid on the same page (the probe table was tiny).
  - Writer vs writer on one row: B waits with `wait_event_type = Lock`, `wait_event = transactionid`, `pg_blocking_pids` lists A; after A commits, B proceeds.
  - Error inside a transaction: `22012 division by zero`, next statement `25P02 current transaction is aborted, commands ignored until end of transaction block`.
  - `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE` outside a block: `WARNING SET TRANSACTION can only be used in transaction blocks`.
- Extensions available but not installed: `pg_walinspect` 1.1, `pg_buffercache` 1.4, `btree_gist` 1.7, `dblink` 1.2. Installed in `lab03_indexing`: `pageinspect` 1.12, `pgstattuple` 1.5, `pg_trgm`. Lesson 3's `npm run reset` drops schema `lab03_indexing` with them.
- `max_pred_locks_per_page = 2`, `max_pred_locks_per_transaction = 64`, `wal_writer_delay = 200ms`, `commit_delay = 0`, `max_prepared_transactions = 0`; `transaction_timeout` does not exist in PG 16.
- 4 idle client sessions with blank `application_name` are connected to `advance_be_lab` (not in a transaction) — probably the learner's GUI client pool.
- Host psql is 18.3; container psql (`docker exec -it quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab`) is 16.15 and needs no password.
- The learner's app (`D:\work\maycha\quan_ly_hop_dong`, named in the roadmap capstone) is **not on this machine**, so his TypeORM version is unknown; npm's latest TypeORM is 1.1.2. The validation step will ask him; the plan must say how the drill handles 0.3.x vs 1.x.
- `labs/lesson-03-index` has `pg` 8.x installed; `npm install` in a new folder needs network or the npm cache.
- Render check for HTML exists: `node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs <file> --out <dir>` (screenshots at 375/768/1440 and a text report of runtime errors, overflow, touch targets). Run it with `TMP`/`TEMP` pointed inside the project so nothing is written outside `D:/study/advance-be`.

## 4. Execution model the plan must fit

- Work on `main`; no branch, worktree, commit, push, PR or issue (user correction). Do not plan any git step except `git status` checks.
- The controller owns: dataset setup, the shared kit and `scenarios.mjs` contracts, all lab runs (serial, recorded verbatim into `lab-runs/*.txt`), the guide HTML assembly, verification, and docs. Lab writers may be delegated in parallel only with disjoint file ownership and frozen kit/scenario interfaces (lesson-3 `delegate-brief.md` is the model).
- After implementation: `/ak:code-review --ultra` (five independent reviewers, verifier-validated union of findings), then fix Critical/Important findings and re-run the affected labs.
- Then tests (`/ak:test` only if coverage is not already honest), docs (`/ak:docs update` for the README route to the new lab folder and guide), and a final verification gate.
- TDD here means: the invariants (`npm run check`), the expected-verdict matrix for every lab, the homework runner's refusal behaviour and the guide verification script are written **before** the labs and the HTML they check, and every phase ends with runnable verification commands.

## 5. Required output

Write exactly one file: `plans/261024-1435-lesson-12-transaction-teacher-guide/reports/planner-ultra-candidate-<N>.md` (N = your slot). Structure it as concatenated files, each introduced by a line `=== FILE: <name> ===`:

1. `=== FILE: plan.md ===` — YAML frontmatter (`title`, `description`, `status: pending`, `priority: P1`, `effort`, `branch: main`, `tags`, `blockedBy: []`, `blocks: []`, `created: 2026-10-24`), then: Overview (outcome in 3–5 sentences), Contract and must-fix resolution (a table: must-fix # → where the plan resolves it), Phases table (#, name, effort, depends on, gate), Expected-verdict matrix summary (lab → claims → verdicts), Acceptance criteria (numbered, checkable, mapped to phases), Risks and rollback, Open questions for the user (only genuine ones).
2. One `=== FILE: phase-NN-<kebab-slug>.md ===` per phase, each with frontmatter (`phase`, `title`, `status: pending`, `priority`, `effort`, `dependencies`) and sections: Goal · Files to create/modify (full paths, owner: controller or delegate) · Tasks and steps · Test matrix (TDD: test first, expected result, command) · Verification (commands) · Risks and rollback.

Length: aim for 3,500–6,000 words in total. Plain, direct sentences; tables where they help. Write in English (the deliverables themselves will be Vietnamese).

Finish with a final message containing only:
```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
File: <path>
Summary: one or two sentences
Concerns/Blockers: optional
```
