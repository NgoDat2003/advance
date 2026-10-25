---
handoff-version: 1
generated: 2026-10-25T00:20:00Z
generator: ak:handoff@2.0.0
focus: "tổng kết lại session này or có skill nào để đem đoạn session này qua máy khác để mai dùng laptop lên cty ngồi hocj í, rồi pushs lên git để mai pull nhé"
workspace: D:/study/advance-be
branch: main
head: 35ad5c0c86a5ce90fb69a293cd7be8cb74f78ebe
---

# HANDOFF: Resume Lesson 12 Co-Learning Session (Stages 6–8 & Homework 24 Cells)

## Mission and current status
Focus: "tổng kết lại session này or có skill nào để đem đoạn session này qua máy khác để mai dùng laptop lên cty ngồi hocj í, rồi pushs lên git để mai pull nhé"

- **Outcome:** Complete the interactive co-learning session for Course 1 Lesson 12 (Database Transaction, WAL, MVCC & Isolation Levels) with Đạt using DBX + PostgreSQL 16 (`advance_be_lab`, schemas `lab12_transaction` and public sample dataset `northwind`), finishing Stages 6–8 and scoring 24/24 on `labs/lesson-12-transaction/homework-predictions.mine.mjs`.
- **Done:**
  - **Chặng 0 & 1 (Slide 1–5 — ACID & Atomicity):** Mastered `BEGIN / COMMIT / ROLLBACK`, PostgreSQL aborted transaction state (`SQLSTATE 25P02`), `SAVEPOINT`, Transactional DDL caveats (`CREATE INDEX CONCURRENTLY` and `VACUUM` cannot run inside a transaction block; TypeORM `migrationsTransactionMode` vs Prisma Migrate multi-statement behavior), and non-transactional `Sequence` (`nextval`) gaps.
  - **Chặng 2 (Slide 11–12 — WAL vs Shared Buffers vs Disk):** Mastered the 4-layer storage flow: `UPDATE` mutates `Shared Buffers` (RAM Dirty Page) immediately and appends to `WAL Buffer`; `COMMIT` flushes only the sequential `WAL` file (`fsync`) to guarantee Durability while `Background Writer` (`bgwriter`, 200ms) and `Checkpointer` (5min) flush Dirty Pages to the physical table file asynchronously in the background. Connected `Browser RAM` vs `Redis RAM` vs `Postgres Shared Buffers RAM`.
  - **Chặng 3 (Slide 13, 15 — MVCC Internals):** Verified directly in DBX on `northwind.products` (`product_id = 1`) how `xmin` ("Giấy khai sinh"), `xmax` ("Giấy báo tử" + row-level lock tag on `Shared Buffers`), `ctid` (forward pointer from old tuple `(0,78)` to new tuple `(0,2)`), and `CLOG` (`pg_xact`) work together. Verified via `heap_page_items` X-ray that `ROLLBACK` does not delete the new tuple `(0,2)` or reset `xmax = 0` on `(0,78)`, but merely marks `xid = 16142` as `ABORTED` in `CLOG`. Formulated the "Rule Vàng 2 Tầng" for parallel limited-quantity updates (Transaction + `UPDATE ... WHERE stock >= X` or `SELECT ... FOR UPDATE` or `REPEATABLE READ / SERIALIZABLE`).
  - **Chặng 4 & 5 (Slide 14, 16–21 — Dead Tuples, VACUUM Horizon & Timeouts):** Verified in DBX on `northwind.order_details` (2,155 rows) that `BEGIN; UPDATE ...; ROLLBACK;` leaves `n_dead_tup = 2155` dead tuples on the heap, and running `VACUUM northwind.order_details;` cleans `n_dead_tup` back to `0`. Covered `backend_xmin` horizon (`dead but not yet removable`), batching big transactions, and the 3 defensive timeouts (`lock_timeout` `55P03`, `idle_in_transaction_session_timeout` `25P03`, `statement_timeout` `57014`, plus `pg_terminate_backend` `57P01`).
- **Remaining:**
  - **Chặng 6 & 7 (Slide 6–10, 22–23):** Hands-on DBX practice for the 4 Isolation Levels (`READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`), testing `40001` concurrent update / Write Skew (`SIReadLock`).
  - **Chặng 8 (Slide 24–26):** Fill in all 24 cells (`'xảy ra' | 'không' | '40001'`) and 6 `why` explanations in `labs/lesson-12-transaction/homework-predictions.mine.mjs`, run `npm run homework` (24/24 pass), and inspect the 6 ORM transaction anti-patterns + bridge to Lesson 14 (Locking).
- **Urgency:** normal (resuming tomorrow on office laptop).

## Scope and guardrails
- **Workspace:** `D:/study/advance-be`
- **In scope:**
  - Co-learning walkthrough and hands-on DBX challenges for Lesson 12 (`reports/advanced_backend/lesson_12_transaction_teacher_guide.html`, `labs/lesson-12-transaction/`).
  - Editing `labs/lesson-12-transaction/homework-predictions.mine.mjs` with Đạt's answers for the 6×4 matrix.
  - Maintaining the public `northwind` sample dataset inside schema `northwind` of `advance_be_lab` for intuitive Order/Inventory SQL exercises in DBX.
- **Out of scope:**
  - Modifying `lab03_indexing.hw_contracts` (must remain 500,000 rows, `allvisible = 5666/5666`).
  - Adding extra tables inside `lab12_transaction` (which is gated by `H1` in `labs/lesson-12-transaction/check-lab-state.mjs`).
- **Constraints:**
  - Follow `AGENTS.md` Apprenticeship Rules: Anti Over-Engineering, "Làm Mẫu (Walkthrough) -> Tự Làm (Hands-on Challenge)", test directly in DBX, and explain concepts with concrete state tables and Mermaid diagrams (note: raw `svg` code blocks failed to render in the user's chat UI, so always use `mermaid` diagrams and Markdown state tables instead of `svg`).
- **Safety boundaries:**
  - Never output files outside `D:/study/advance-be`.
  - Never print raw database passwords or connection URLs.

## Current state
- **Branch:** `main`
- **HEAD:** `35ad5c0c86a5ce90fb69a293cd7be8cb74f78ebe`
- **Working tree:** clean after committing Lesson 12/14 guides, labs, and handoffs (intermediate `plans/261024-*` build/verify files removed per user request)
- **Changed files:**
  - `M README.md`
- **Untracked files:**
  - `labs/lesson-12-transaction/`
  - `labs/lesson-14-locking/`
  - `reports/advanced_backend/lesson_12_transaction_teacher_guide.html`
  - `reports/advanced_backend/lesson_14_locking_teacher_guide.html`
  - `plans/handoffs/non-linear-6-clusters-qlhd-boss-challenges-20261024-1712.md`
  - `plans/handoffs/lesson-12-co-learning-session-20261025-0020.md`
- **Intentional local modifications:** yes

## Decisions and rationale
- **Decision:** Invert slide order to teach Physical Mechanisms first (Chặng 1–5: Atomicity, WAL, Shared Buffers, MVCC `xmin/xmax/ctid`, CLOG, Dead Tuples & `VACUUM`) before Isolation Levels (Chặng 6–8).
  - **Rationale:** Original slides 7, 9, 10, 13–16 describe MySQL InnoDB (Undo Log, HLL, Gap Locks). Understanding PostgreSQL `xmin/xmax/ctid` and snapshots first makes the 4 Isolation Levels and the 6×4 homework matrix trivial to deduce rather than memorize.
  - **Alternative rejected:** Following slides 1→26 linearly without physical MVCC grounding.
  - **Reference:** `reports/advanced_backend/lesson_12_transaction_teacher_guide.html`
- **Decision:** Load the official public **Northwind Traders** dataset (`pthom/northwind_psql`) into schema `northwind` inside `advance_be_lab` (with `CHECK (units_in_stock >= 0)` on `northwind.products` and helper `northwind.reset_data()`).
  - **Rationale:** Learner requested a real, well-known public Order/Inventory dataset (`orders` 830 rows, `order_details` 2,155 rows, `products` 77 rows, `customers` 91 rows) to run queries in DBX across Cluster 1, while keeping `lab12_transaction` and `lab03_indexing` untouched so `npm run check` (`H1`–`H6`) stays 100% green.
  - **Alternative rejected:** Using a tiny synthetic 4-table custom schema or mutating `lab12_transaction` schema structure.
- **Decision:** Use Mermaid diagrams + Markdown state tables instead of `svg` blocks, and mind DBX's `Tx: [A]` (Auto-Commit) vs `Tx: [M]` (Manual Commit) mode.
  - **Rationale:** Raw `svg` code blocks failed to render in the learner's UI; DBX defaults to `Tx: [A]` and shares backend `pid` across tabs of the same connection unless configured or paired with an external session.

## Work performed
- Verified `labs/lesson-12-transaction` health check (`npm run check` with `PG_URL=[REDACTED:db-url]`): `H1`–`H6` all passed.
- Loaded public Northwind SQL dataset from `https://raw.githubusercontent.com/pthom/northwind_psql/master/northwind.sql` into schema `northwind` on `advance_be_lab`, added `products_units_in_stock_nonnegative` (`CHECK (units_in_stock >= 0)`), and created `northwind.reset_data()` backup/restore function.
- Guided learner through hands-on DBX verification of `ctid`, `xmin`, `xmax` before `BEGIN`, during `BEGIN` (`UPDATE units_in_stock = 29`), and after `ROLLBACK`, plus raw page inspection via `lab03_indexing.heap_page_items(lab03_indexing.get_raw_page('northwind.products', 0))`.
- Guided learner through creating 2,155 dead tuples on `northwind.order_details` (`BEGIN; UPDATE ...; ROLLBACK;`) and cleaning them to `0` via `VACUUM northwind.order_details;` in DBX.
- 1 redactions applied.

## Verification
| Check | Command | Outcome | When |
|---|---|---|---|
| Lesson 12 Lab State (`H1`–`H6`) | `npm run --silent check` in `labs/lesson-12-transaction` | Passed (`H1`–`H6` all green, 100,000 contracts, 4 store_reps, 500,000 hw_contracts intact) | During session |
| Public `northwind` schema & `reset_data()` | `SELECT northwind.reset_data();` on `advance_be_lab` | Passed (77 products, 830 orders, 2,155 order_details restored) | During session |
| Learner DBX MVCC & VACUUM proof | Learner ran `ctid/xmin/xmax` and `pg_stat_user_tables` queries in DBX | Passed (Verified via learner screenshots: `16142` in `xmax` after rollback; `n_dead_tup` `2155 -> 0` after `VACUUM`) | During session |

Not run:
- `npm run homework` in `labs/lesson-12-transaction` — deferred to next session because Stages 6–8 and `homework-predictions.mine.mjs` are the next learning step.

## Open risks and blockers
- **Type:** risk. **Owner:** successor agent / learner. **Impact:** Because PostgreSQL database data lives inside the local Docker volume (`quan-ly-hop-dong-postgres-1`), pulling the Git repo on the office laptop tomorrow will bring all code/guides/labs, but the laptop's Docker Postgres container will need `npm run setup` (for `lab12_transaction`) and the 1-line `northwind` dataset load command run once on the laptop.
- **Type:** risk. **Owner:** learner. **Impact:** In DBX, the toolbar `Tx: [A]` (Auto-Commit) vs `Tx: [M]` (Manual) toggle and shared connection `pid` across tabs must be accounted for when testing 2 concurrent sessions in Stages 6–7.

## Exact next actions
1. **First safe step** — On the office laptop after `git pull`, verify Docker container `quan-ly-hop-dong-postgres-1` (or local Postgres on port 5433) is running, run `npm run check` (or `npm run setup` if `lab12_transaction` is not seeded yet on the laptop) inside `labs/lesson-12-transaction`, and load the `northwind` schema on the laptop if absent:
   ```bash
   (echo "DROP SCHEMA IF EXISTS northwind CASCADE; CREATE SCHEMA northwind; SET search_path = northwind;" && curl -sSL https://raw.githubusercontent.com/pthom/northwind_psql/master/northwind.sql && echo "ALTER TABLE northwind.products ADD CONSTRAINT products_units_in_stock_nonnegative CHECK (units_in_stock >= 0);") | docker exec -i quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab -v ON_ERROR_STOP=1
   ```
2. Resume co-learning at **Chặng 6 & Chặng 7 (4 Mức Cô Lập `Isolation Levels`, Lost Update `40001` & Write Skew `SIReadLock`)**: run a hands-on demonstration so Đạt can see `ERROR 40001: could not serialize access due to concurrent update` and `read/write dependencies` in action.
3. Have Đạt fill in all 24 cells and 6 `why` explanations in `labs/lesson-12-transaction/homework-predictions.mine.mjs` and run `npm run homework` in `labs/lesson-12-transaction` to verify 24/24 pass.
4. Walk through the 6 ORM Transaction bug patterns in **Chặng 8** of `reports/advanced_backend/lesson_12_transaction_teacher_guide.html`, run final `npm run check`, and transition to **Bài 14 (Locking & Deadlock)**.

## Source pointers
- `reports/advanced_backend/lesson_12_transaction_teacher_guide.html`
- `labs/lesson-12-transaction/homework-predictions.mine.mjs`
- `labs/lesson-12-transaction/check-lab-state.mjs`
- `plans/261024-1435-lesson-12-transaction-teacher-guide/plan.md`
- `plans/handoffs/non-linear-6-clusters-qlhd-boss-challenges-20261024-1712.md`
- `AGENTS.md`
