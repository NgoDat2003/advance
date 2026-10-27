---
handoff-version: 1
generated: 2026-10-27T17:45:00+07:00
generator: ak:handoff@2.0.0
focus: "có lẽ t cần m tổng kết ở session này rồi pussh mỗi cái đó lên git để tôi về học tiếp từ chặng 3 nhé"
workspace: D:/học/advance-be
branch: main
head: ff82faa8c35678ca8e7ebe869edc5a9093e72282
---

# HANDOFF: Lesson 12 Completed & Lesson 14 Stages 0–2 Mastered — Resume at Lesson 14 Stage 3

## Mission and current status
Focus: "có lẽ t cần m tổng kết ở session này rồi pussh mỗi cái đó lên git để tôi về học tiếp từ chặng 3 nhé"

- **Outcome:** Resume interactive DBX co-learning for Course 1 Lesson 14 (Database Locking & Deadlock `40P01`) starting at **Chặng 3 (Table Locks & DDL Queue)** through **Chặng 8**, with the learner controlling both DBX connections (`ADVANCE_BE_LAB` and `ADVANCE_BE_LAB_B` in Manual Commit mode `Tx: [M]`) at **Chặng 5 (Deadlock `40P01`)**.
- **Done:**
  - **Completed 100% of Lesson 12 (Chặng 6, 7 & 8):**
    - Walked through the **6 classic ORM Transaction bug patterns** in NestJS/Prisma/TypeORM via interactive code-review puzzles (`this.prisma` vs `tx` sharing a single `xid` in `CLOG`, JS `Read-Modify-Write` vs SQL atomic `{ decrement }` in `READ COMMITTED`, holding locks for `8,216ms` while awaiting `axios.post` inside `$transaction`, leaking manual `QueryRunner`, retrying on `40001`, and `try/catch` swallowing causing `25P02`).
    - Executed live DBX proofs on `advance_be_lab`:
      1.Observed `8216ms` row-lock wait on `northwind.products` (`product_id = 1`) when another session holds an uncommitted `UPDATE` while normal `SELECT` returns immediately in `0.1ms` ("Readers never block Writers, Writers block Writers").
      2. Clarified `READ COMMITTED` vs `REPEATABLE READ` vs `SERIALIZABLE` (`SIReadLock`) and how to configure each in SQL (`BEGIN ISOLATION LEVEL ...`), Prisma (`Prisma.TransactionIsolationLevel.Serializable`), and TypeORM.
      3. Triggered and observed live `ERROR: could not serialize access due to read/write dependencies among transactions` (`40001`) in DBX on `lab12_transaction.store_reps` (`store_id = 44`), proving how `SERIALIZABLE` prevents `Write Skew` (`An` off duty `f`, `Binh` kept on duty `t`).
  - **Completed Lesson 14 Chặng 0, Chặng 1 & Chặng 2 (`reports/advanced_backend/lesson_14_locking_teacher_guide.html`):**
    - **Chặng 0 (Setup & Dual-DBX Connection):** Seeded `lab14_locking` (`contracts`, `store_wallets`, `flights`, `bookings`, `pgrowlocks`), verified `6/6 ✔` (`H1`–`H6`) via `check-lab-state.mjs`, and duplicated the DBX connection into `ADVANCE_BE_LAB` + `ADVANCE_BE_LAB_B` so the learner can control 2 independent PostgreSQL sessions (`pid`s) directly inside DBX (`Tx: [M]`) without needing terminal `psql` windows.
    - **Chặng 1 (Negative Wallet `-20` & 3 Shields):** Reproduced `so_du_cuoi_cung = -20` live in DBX when checking balance with plain `SELECT` before `UPDATE ... balance = balance - 40` under `READ COMMITTED`, then added `SELECT ... FOR UPDATE` in DBX and verified `so_du_cuoi_cung = 10` (preventing negative balance). Covered the 3 shields: `SELECT ... FOR UPDATE` (Cách C), `UPDATE ... WHERE balance >= 40` (Cách D), and `CHECK (balance >= 0)` (`23514`, Cách E).
    - **Key Mental Model Breakthrough:** Learner independently realized that PostgreSQL locks are stamped onto physical rows (`xmax` in `Shared Buffers` RAM + `WAL`), not tied to a specific API/function name — any concurrent query touching a row whose `xmax` holds an active locker must wait if it requests a conflicting lock, and `SELECT ... FOR UPDATE` moves that serialization point from the `UPDATE` step up to the `SELECT` step.
    - **Chặng 2 (4 Row-Lock Modes & `xmax` / `pgrowlocks`):** Inspected `xmax` and `lab14_locking.pgrowlocks('lab14_locking.contracts')` in DBX, and mastered all 4 PostgreSQL row-lock modes from lightest to heaviest using the Parent (`flights`) — Child (`bookings` Foreign Key) example:
      1. `FOR KEY SHARE` (taken on parent row when `INSERT`ing child row with FK; allows `FOR NO KEY UPDATE`).
      2. `FOR SHARE` (shared read lock; blocks any row update).
      3. `FOR NO KEY UPDATE` (taken by normal `UPDATE` on non-key columns like `seats` or `balance`; does NOT block child `INSERT` `FOR KEY SHARE`).
      4. `FOR UPDATE` (taken by `SELECT ... FOR UPDATE`, `DELETE`, or updating PK/unique key columns; blocks all 4 row-lock modes including child `INSERT`).
- **Remaining:**
  - **Chặng 3 (Slide 6 — Table Locks & `ALTER TABLE` DDL Queue):** Learner has already read Chặng 3 in the HTML guide; upon resuming at home, run the 30-second DBX test showing how a waiting `ALTER TABLE` (`AccessExclusiveLock`) blocks subsequent plain `SELECT` (`AccessShareLock`) queries, and how `SET lock_timeout = '3s'` (`55P03`) prevents production outages.
  - **Chặng 4 (Slide 7–11 — Why PostgreSQL Has No Gap Locks):** Quick DBX check showing `INSERT` into an ID gap succeeds under both `RC` and `RR` in PostgreSQL.
  - **Chặng 5 (Slide 12, 14, 20, 22 — Deadlock `40P01` & Resource Ordering `ORDER BY id FOR UPDATE`):** Learner controls both DBX tabs (`ADVANCE_BE_LAB` and `ADVANCE_BE_LAB_B` switched to `Tx: [M]`) to create a cross-lock Deadlock `40P01` and fix it via `ORDER BY id FOR UPDATE`.
  - **Chặng 6, 7 & 8:** `NOWAIT` / `SKIP LOCKED` / Hot rows, Optimistic Locking (`version` CAS), and Prisma 7 code review drill.
- **Urgency:** normal (resuming at home tonight).

## Scope and guardrails
- **Workspace:** `D:/học/advance-be` (and home workspace `D:/study/advance-be`).
- **In scope:**
  - Interactive DBX co-learning for Lesson 14 (`reports/advanced_backend/lesson_14_locking_teacher_guide.html`).
  - Executing SQL directly in DBX against `advance_be_lab` (schemas `lab14_locking`, `lab12_transaction`, `northwind`).
- **Out of scope:**
  - Forcing the learner to read `.mjs` lab harness files (`01-race-transfer.mjs`, etc.) — always provide direct, self-contained SQL snippets to run in DBX.
  - Modifying unrelated untracked files in the workspace.
- **Constraints:**
  - Follow `AGENTS.md` Apprenticeship Rules: explain in plain Vietnamese, go step-by-step one stage at a time without skipping ahead, use `mermaid` diagrams and Markdown tables (never raw `svg` blocks), and pair every concept with a quick DBX SQL experiment.
- **Safety boundaries:**
  - Never write files outside the project workspace.
  - Never expose raw database passwords or connection URLs.

## Current state
- **Branch:** `main`
- **HEAD:** `ff82faa8c35678ca8e7ebe869edc5a9093e72282`
- **Working tree:** dirty (other session files present; only this handoff file is staged/pushed per user request)
- **Changed files:**
  - `M .claude/agent-memory/kongming/MEMORY.md`
  - `M .gitignore`
  - `M reports/brainstorm.html`
- **Untracked files:**
  - `.claude/agent-memory/kongming/reference-hub-template-traps.md`
  - `docs/`
  - `plans/261027-0907-cluster1-m0-m1-implementation/`
  - `plans/reports/brainstorm-261027-1109-cluster1-project-buildup/`
  - `plans/reports/brainstorm-261027-1333-hub-skeleton-contract.md`
  - `plans/reports/brainstorm-261027-1353-srs-architecture-framework/`
  - `plans/reports/brainstorm-261027-cluster1-project-buildup.html`
  - `plans/reports/brainstorm-261027-cluster1-project-buildup.page.yaml`
  - `plans/reports/ultra-261027-cluster1-buildup/`
  - `plans/handoffs/lesson-14-stage1-2-mastered-resume-stage3-20261027-1745.md`
- **Intentional local modifications:** yes (parallel roadmap/SRS artifacts on office machine left untouched; only this handoff is committed and pushed).

## Decisions and rationale
- **Decision:** Duplicate the DBX connection (`ADVANCE_BE_LAB` -> `ADVANCE_BE_LAB_B`) instead of requiring two external `psql` terminal windows.
  - **Rationale:** Each DBX sidebar connection maintains its own PostgreSQL backend `pid`, allowing the learner to switch both tabs to Manual Commit (`Tx: [M]`) and control Session A and Session B side-by-side inside DBX for Chặng 5 Deadlock testing.
  - **Alternative rejected:** Opening two separate `docker exec -it ... psql` terminal windows.
  - **Reference:** `xd://mcp__dbx_duplicate_connection`.
- **Decision:** Provide direct DBX SQL snippets with automated background partner sessions instead of asking the learner to read `.mjs` lab scripts.
  - **Rationale:** Learner explicitly preferred hands-on DBX execution (`Ctrl + A` -> Run) over reading Node.js `.mjs` harness code, which immediately made `-20` vs `10` (`FOR UPDATE`) and `40001` (`SERIALIZABLE`) click visually.
  - **Alternative rejected:** Reading `labs/lesson-14-locking/*.mjs` files.
  - **Reference:** `AGENTS.md` Rule 3.

## Work performed
- Pulled `6ffe682..ff82faa` from `origin/main` via `git pull`.
- Started Docker container `quan_ly_hop_dong-postgres-1` (port `5433`), installed dependencies, and ran `00-setup-dataset.mjs` + `check-lab-state.mjs` in both `labs/lesson-12-transaction` and `labs/lesson-14-locking` (`6/6 ✔` passed).
- Set `ALTER DATABASE advance_be_lab SET search_path = lab03_indexing, public;` so `H5` in `check-lab-state.mjs` passes cleanly.
- Duplicated DBX connection `ADVANCE_BE_LAB` into `ADVANCE_BE_LAB_B` for dual-tab locking exercises.
- Guided learner through live DBX experiments for Lesson 12 (`8216ms` lock wait, `SERIALIZABLE` `40001` on `store_reps`) and Lesson 14 Chặng 1 & Chặng 2 (`-20` vs `10` with `FOR UPDATE` on `store_wallets`, `xmax` & `pgrowlocks` on `contracts`, and the 4 row-lock modes).
- Cleaned up temporary demo table `lab14_locking.demo_ddl` and background demo sessions before capturing this handoff.
- 1 redactions applied (`[REDACTED:db-url]`).

## Verification
| Check | Command | Outcome | When |
|---|---|---|---|
| Lesson 14 Lab State (`H1`–`H6`) | `node check-lab-state.mjs` in `labs/lesson-14-locking` | Passed (`6/6 ✔`, `exit: 0`) | During Chặng 0 setup |
| Lesson 12 `SERIALIZABLE` `40001` in DBX | Learner ran `BEGIN ISOLATION LEVEL SERIALIZABLE` block in DBX | Passed (Verified via screenshot: `ERROR: could not serialize access due to read/write dependencies among transactions`) | End of Lesson 12 |
| Lesson 14 Chặng 1 `-20` vs `10` (`FOR UPDATE`) in DBX | Learner ran `store_wallets` withdrawal with `FOR UPDATE` in DBX | Passed (Verified via screenshot: `so_du_luc_kiem_tra = 50`, `so_du_cuoi_cung = 10`) | End of Chặng 1 |
| Cleanup of temporary `demo_ddl` & demo sessions | `DROP TABLE IF EXISTS lab14_locking.demo_ddl;` | Passed (`0` lingering demo sessions) | Before handoff write |

Not run:
- Lesson 14 Chặng 3–8 DBX exercises — deferred to home session tonight starting at Chặng 3.

## Open risks and blockers
- **Type:** risk. **Owner:** learner / successor agent. **Impact:** On the home PC tonight, remember to ensure Docker container `quan-ly-hop-dong-postgres-1` (port `5433`) is running and run `node 00-setup-dataset.mjs` inside `labs/lesson-14-locking` if `lab14_locking` tables have not been seeded on the home PC's Docker volume yet; also duplicate `ADVANCE_BE_LAB` into `ADVANCE_BE_LAB_B` in the home PC's DBX before Chặng 5.

## Exact next actions
1. **First safe step** — On the home PC after `git pull`, verify Docker Postgres (`port 5433`) is running and `lab14_locking` tables exist (if not, run `npm install && node 00-setup-dataset.mjs` in `labs/lesson-14-locking`).
2. Resume **Lesson 14 at Chặng 3 (Slide 6 — Table Locks & `ALTER TABLE` DDL Queue)** — the learner already read Chặng 3 before leaving the office, so immediately start the 60-second background `1_ke_toan_A` (`SELECT`) + `2_dev_alter_B` (`ALTER TABLE`) demo on `lab14_locking.demo_ddl` and let the learner run `SELECT * FROM lab14_locking.demo_ddl;` in DBX to observe the table-lock queue, then clean up `demo_ddl`.
3. Walk through **Chặng 4 (No Gap Locks in PostgreSQL)** with a 1-minute DBX test (`INSERT` into an ID gap while `UPDATE ... BETWEEN` is uncommitted).
4. In **Chặng 5 (Deadlock `40P01` & `ORDER BY id FOR UPDATE`)**, duplicate `ADVANCE_BE_LAB` into `ADVANCE_BE_LAB_B` in DBX, have the learner switch both tabs to `Tx: [M]`, and guide them step-by-step to trigger Deadlock `40P01` with their own two hands and fix it with Resource Ordering.
5. Complete **Chặng 6 (`NOWAIT`, `SKIP LOCKED`), Chặng 7 (`Optimistic Lock version`), and Chặng 8 (Prisma 7 Locking Drill)**.

## Source pointers
- `reports/advanced_backend/lesson_14_locking_teacher_guide.html`
- `labs/lesson-14-locking/00-setup-dataset.mjs`
- `labs/lesson-14-locking/check-lab-state.mjs`
- `plans/handoffs/lesson-12-stage6-7-mastered-to-stage8-20261027-0015.md`
- `plans/handoffs/omnipos-finledger-master-roadmap-and-lesson12-20261026.md`
- `AGENTS.md`
