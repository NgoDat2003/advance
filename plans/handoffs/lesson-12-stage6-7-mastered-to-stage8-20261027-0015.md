---
handoff-version: 1
generated: 2026-10-27T00:15:00+07:00
generator: ak:handoff@2.0.0
focus: "thôi bùn ngủ qá handdoff coi gì tới đâu ship lên mai lên cty sáng học cho xong"
workspace: D:/study/advance-be
branch: main
head: 6ffe682e1d36e95f2152ab7f9391dbbcb40aa13d
---

# HANDOFF: Lesson 12 Stages 6–7 Mastered — Resume at Stage 8 & Lesson 14

## Mission and current status
Focus: "thôi bùn ngủ qá handdoff coi gì tới đâu ship lên mai lên cty sáng học cho xong"

- **Outcome:** Finish Lesson 12 (Stage 8: optional DBX `Write Skew` hands-on verification + 6 ORM Transaction bug patterns in NestJS/TypeORM/Prisma) and transition smoothly into Lesson 14 (Database Locking: `SELECT FOR UPDATE`, `NOWAIT`, `SKIP LOCKED`, Optimistic Locking `version`, and Deadlock `40P01`) as part of Cluster 1 (`OmniPOS & FinLedger Hub` roadmap).
- **Done:**
  - Pulled latest `origin/main` (`6ffe682`) containing the finalized 6-cluster `OmniPOS & FinLedger Hub` learn-and-build roadmap (`plans/handoffs/omnipos-finledger-master-roadmap-and-lesson12-20261026.md`).
  - **Chặng 0–5 of Lesson 12:** Completed in prior sessions (ACID, `25P02`, `SAVEPOINT`, Transactional DDL, WAL vs Shared Buffers vs Disk, MVCC `xmin/xmax/ctid/CLOG`, Dead Tuples & `VACUUM` horizon, and defensive timeouts `55P03` / `25P03` / `57014`).
  - **Chặng 6 of Lesson 12 (4 Isolation Levels & Read Anomalies):** Mastered in plain Vietnamese developer terms:
    - Distinguished `Non-Repeatable Read` (caused by another committed transaction's `UPDATE` changing column values of an existing row) vs `Phantom Read` (caused by another committed transaction's `INSERT`/`DELETE` changing the row set).
    - Clarified the exact boundary between "uncommitted changes" (`Dirty Read` = never happens on PostgreSQL in any level) vs "changes committed by `T1` while `T2` is still inside `BEGIN`":
      - `READ COMMITTED` (`RC`, default on `BEGIN;`): takes a fresh snapshot on every statement, so `T2` sees `T1`'s new value as soon as `T1` commits.
      - `REPEATABLE READ` (`RR`, enabled via `BEGIN ISOLATION LEVEL REPEATABLE READ;`): freezes a whole-database snapshot at the moment the **first SQL statement** (`SELECT` or `UPDATE`) inside `T2` begins executing ("chốt hằng số đầu hàm").
    - Verified how to check current isolation level (`SHOW transaction_isolation;`) and why `SET TRANSACTION ISOLATION LEVEL` must appear before the first query (`SQLSTATE 25001`).
  - **Chặng 7 of Lesson 12 (`Lost Update`, `Write Skew` & `40001`):** Mastered all edge cases and deduced `Write Skew` from first principles:
    - Traced all 3 boundary cases of `RR` snapshot timing (`skip step 2 SELECT`, `skip step 1 SELECT`, `skip both SELECTs and go straight to UPDATE`) and why concurrent modification on the **same row** after the snapshot triggers `ERROR 40001` at the `UPDATE` step in `RR`/`SER`.
    - Consolidated the 5 essential production `SQLSTATE` codes (`40001` Serialization Failure, `40P01` Deadlock, `25P02` In Failed SQL Transaction, `55P03` Lock Not Available, `25P03` Idle in Transaction Timeout) and the 3 key PostgreSQL-vs-MySQL interview comparisons.
    - Learner independently deduced why `REPEATABLE READ` fails to prevent **`Write Skew`** (two concurrent transactions `T1` and `T2` both read `count = 2` on-duty reps, then update **two different rows** `rep_id = 1` and `rep_id = 2`, so neither triggers row-level conflict in `RR`, leaving `0` reps on duty) and how `SERIALIZABLE` (`SER` / `SIReadLock`) catches the read-write dependency cycle and aborts the second `COMMIT` with `40001`.
    - Synthesized the complete 6×4 anomaly matrix (`Dirty Read`, `Non-Repeatable Read`, `Phantom Read`, `App Lost Update`, `Atomic SQL Update`, `Write Skew`).
- **Remaining:**
  - **Optional 5-minute DBX smoke test (Chặng 7):** Run the 4-line `Write Skew` scenario (`store_reps` at `store_id = 44`) in DBX if the learner wants to observe `on_duty = 0` under `RR` vs `ERROR 40001` at `COMMIT` under `SER`.
  - **Chặng 8 of Lesson 12 (10–15 minutes):** Walk through the **6 classic ORM Transaction anti-patterns** in NestJS/TypeORM/Prisma (e.g., forgetting `await` inside transaction callback, catching errors inside callback without rethrowing, calling external HTTP/email inside transaction holding locks, using global `this.repo` instead of transactional `manager`/`tx`, misplaced `SET TRANSACTION`, missing retry loop on `40001`).
  - **Transition to Lesson 14 (Day 2 of Cluster 1):** Begin `reports/advanced_backend/lesson_14_locking_teacher_guide.html` (`SELECT ... FOR UPDATE`, `NOWAIT`, `SKIP LOCKED`, inspecting `pg_locks` in DBX).
- **Urgency:** normal (resume tomorrow morning at office).

## Scope and guardrails
- **Workspace:** `D:/study/advance-be`
- **In scope:**
  - Co-learning walkthrough of Lesson 12 Chặng 8 and Lesson 14 (`reports/advanced_backend/lesson_12_transaction_teacher_guide.html`, `reports/advanced_backend/lesson_14_locking_teacher_guide.html`).
  - Hands-on SQL execution in **DBX** on PostgreSQL 16 (`advance_be_lab`, port `5433`, schemas `northwind` and `lab12_transaction`).
- **Out of scope:**
  - Running standalone `.mjs` lab scripts (`tx-kit.mjs`, `homework-predictions.mine.mjs`) unless explicitly requested (per Master Roadmap decision, focus on Teacher Guide HTML + interactive DBX SQL).
  - Mutating `lab03_indexing.hw_contracts` or `maycha_lease`.
- **Constraints:**
  - Follow `AGENTS.md` Apprenticeship Rules: explain in plain, everyday Vietnamese first ("Từ điển bình dân", developer mental models like "hằng số đầu hàm `tran()`"), avoid dumping English jargon walls, go one concept at a time, and use `mermaid` diagrams + Markdown tables (never raw `svg` blocks).
- **Safety boundaries:**
  - Never write files outside `D:/study/advance-be`.
  - Never expose raw credentials or database URLs.

## Current state
- **Branch:** `main`
- **HEAD:** `6ffe682e1d36e95f2152ab7f9391dbbcb40aa13d`
- **Working tree:** clean prior to writing this handoff artifact
- **Changed files:** none
- **Untracked files:**
  - `plans/handoffs/lesson-12-stage6-7-mastered-to-stage8-20261027-0015.md` (this handoff artifact, to be committed and pushed per user request)
- **Intentional local modifications:** no

## Decisions and rationale
- **Decision:** Explain `REPEATABLE READ` (`RR`) using the learner's own developer mental model ("freezing a whole-database snapshot / constant at the start of the first SQL statement inside `tran()`") and contrast it with `READ COMMITTED` (`RC`) along the exact boundary of **"when `T1` has committed while `T2` is still inside `BEGIN`"**.
  - **Rationale:** Immediately resolved confusion between uncommitted reads (`Dirty Read`) and post-commit reads (`Non-Repeatable Read` / `Phantom Read`), and naturally explained why `RR` throws `40001` when `T2` attempts to `UPDATE` a row modified after `T2`'s snapshot was taken.
  - **Alternative rejected:** Presenting all 24 matrix cells and academic definitions simultaneously.
  - **Reference:** `reports/advanced_backend/lesson_12_transaction_teacher_guide.html` (Chặng 6 & Chặng 7).
- **Decision:** Focus deep hands-on mastery on PostgreSQL 16 while summarizing MySQL InnoDB differences into 3 high-value interview comparison points (Update-in-place + Undo Log vs MVCC tuple versions + `VACUUM`; default `RR` vs default `RC`; `Gap Lock` vs snapshot/`SSI 40001`).
  - **Rationale:** Matches the `OmniPOS & FinLedger Hub` stack (PostgreSQL 16 + Redis 7 + Kafka) and maximizes interview readiness without doubling lab time.
  - **Alternative rejected:** Setting up a separate MySQL lab environment.
  - **Reference:** `plans/handoffs/omnipos-finledger-master-roadmap-and-lesson12-20261026.md`.

## Work performed
- Pulled latest commit `6ffe682` from `origin/main` via `git pull`.
- Checked local port listeners (`netstat -ano | findstr 543`): verified Docker Desktop (`quan-ly-hop-dong-postgres-1` on port `5433`) was not running during this theory/mental-model session.
- Guided learner step-by-step through Chặng 6 & Chặng 7 of Lesson 12 until learner independently deduced `Write Skew` and the 6×4 anomaly matrix.
- Wrote this handoff artifact to `plans/handoffs/lesson-12-stage6-7-mastered-to-stage8-20261027-0015.md`.
- 0 redactions applied.

## Verification
| Check | Command | Outcome | When |
|---|---|---|---|
| Git fast-forward pull from `origin/main` | `git status --short --branch && git pull` | Passed (`b16de9c..6ffe682`) | Start of session |
| Conceptual verification of Chặng 6 & 7 | Interactive Q&A on `RC` vs `RR` snapshot timing, `40001` edge cases, and `Write Skew` | Passed (Learner accurately deduced why `RR` permits `Write Skew` across 2 rows leaving `0` reps on duty) | End of session |

Not run:
- Live DBX SQL queries on port `5433` — deferred to tomorrow morning's session because Docker Desktop was off and learner focused on mastering the mental model of Chặng 6 & 7 before sleeping.

## Open risks and blockers
- **Type:** risk. **Owner:** learner / successor agent. **Impact:** Tomorrow morning on the office laptop, remember to start Docker Desktop (`quan-ly-hop-dong-postgres-1` on port `5433`) before opening DBX for the optional `Write Skew` test and Lesson 14 (`pg_locks`, `SELECT FOR UPDATE`) exercises.

## Exact next actions
1. **First safe step** — On the office laptop tomorrow morning, run `git pull origin main` and ensure Docker container `quan-ly-hop-dong-postgres-1` (port `5433`) is running.
2. Ask the learner whether they want to:
   - **(A)** Run the quick 4-line `Write Skew` test on DBX (`lab12_transaction.store_reps` where `store_id = 44`) to see `RR` vs `SER` (`40001`) live, or
   - **(B)** Jump straight into **Chặng 8 of Lesson 12** (the **6 classic NestJS/TypeORM/Prisma Transaction bug patterns** in `reports/advanced_backend/lesson_12_transaction_teacher_guide.html` lines 897–1053) using concise, everyday code examples.
3. After finishing Chặng 8 of Lesson 12 (~10–15 minutes), transition directly into **Lesson 14 (Database Locking & Deadlock)** (`reports/advanced_backend/lesson_14_locking_teacher_guide.html`), starting with `SELECT ... FOR UPDATE`, `NOWAIT`, `SKIP LOCKED`, and inspecting `pg_locks` in DBX.

## Source pointers
- `plans/handoffs/omnipos-finledger-master-roadmap-and-lesson12-20261026.md`
- `plans/handoffs/lesson-12-co-learning-session-20261025-0020.md`
- `reports/advanced_backend/lesson_12_transaction_teacher_guide.html`
- `reports/advanced_backend/lesson_14_locking_teacher_guide.html`
- `AGENTS.md`
