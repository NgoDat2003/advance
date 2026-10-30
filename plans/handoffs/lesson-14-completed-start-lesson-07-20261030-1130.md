---
handoff-version: 1
generated: 2026-10-30T11:30:00+07:00
generator: ak:handoff@2.0.0
focus: "tổng kế bài 14 đi rồi nay và trưa mai cố gắng xong bài 7 để 1.5 ngày làm pha B chặng 1 . m thấy sao đã bị trễ tiến độ nè"
workspace: D:/học/advance-be
branch: main
head: 51ecf2e0574959ee0b3ed8fee42614e19ce4d3ad
---

# HANDOFF: Lesson 14 Completed (Stages 0–8 Mastered) — Start Lesson 07 & Compress Cluster 1 Phase B Schedule

## Mission and current status
Focus: "tổng kế bài 14 đi rồi nay và trưa mai cố gắng xong bài 7 để 1.5 ngày làm pha B chặng 1 . m thấy sao đã bị trễ tiến độ nè"

- **Outcome:** Complete **Lesson 07 (Data Modeling & Double-Entry Ledger)** across today (afternoon/evening) and tomorrow noon, then dedicate the remaining **1.5 days** of Cluster 1 to **Phase B (M0 + M1 implementation on `omnipos-finledger-hub`)** where AI scaffolds the M0 skeleton/UI/tests and the learner writes the Lesson 07 DDL (`bai07-ddl.sql`) and Lesson 14 locking slots (`ORDER BY id FOR UPDATE`, `FOR UPDATE SKIP LOCKED`, and 8-question code review).
- **Done:**
  - **Completed 100% of Lesson 12 (Stages 1–8)** and **100% of Lesson 14 (Stages 0–8)** via live interactive DBX experiments on `advance_be_lab`:
    - **Chặng 5 (Deadlock `40P01` & Resource Ordering `ORDER BY id FOR UPDATE`):** Explained and verified how PostgreSQL's `deadlock_timeout = 1s` sleep-and-alarm mechanism works in both sequential queueing (Case 1 — wakes early on `COMMIT` or sleeps on if no cycle exists) and cross-locking (Case 2 — detects `A -> B -> A` cycle after `1s` and aborts victim with `40P01`, auto-rolling back its changes). Proved how pulling `SELECT ... WHERE id IN (...) ORDER BY id ASC FOR UPDATE` (`LockRows -> Sort`) to the top of `$transaction` (or sorting item IDs in JS) collapses cross-locking back into sequential queueing.
    - **Chặng 6 (`NOWAIT`, `lock_timeout`, `SKIP LOCKED` & Hot Row):** Verified live in DBX (`ADVANCE_BE_LAB` & `ADVANCE_BE_LAB_B`) the difference between plain `SELECT` (MVCC snapshot, 0 row locks), `SELECT ... FOR UPDATE` (waits), `FOR UPDATE NOWAIT` (instant `55P03` in `0ms`), and `FOR UPDATE SKIP LOCKED` (skips locked `id = 1` and grabs `id = 2` in `0ms`). Mastered why splitting a single `remaining = 10` counter (Hot Row) into individual voucher slot rows with `SKIP LOCKED` eliminates contention.
    - **Chặng 7 (Optimistic Locking `version` CAS):** Verified live in DBX on `lab14_locking.flights` (`id = 1`) that `UPDATE ... WHERE id = 1 AND version = 1` STILL acquires and waits on the physical row lock (`xmax`) for `10.9s` while Session A holds an uncommitted update, returning `0 rows` if Session A commits (`version` becomes `2`) or succeeding (`1 row`) if Session A rolls back.
    - **Chặng 8 (Prisma 7 Code Review Drill & 5-Point X-Ray Checklist):** Equipped the learner with the **3 SQLSTATE prefix families (`23xxx` Constraint Violation -> no retry, `40xxx` Concurrency Rollback -> retry + `ORDER BY id`, `55xxx` Lock Not Available -> fail fast)** and the **5-Question `$transaction` X-Ray Checklist**. Learner scored **5/5 (100%)** on the `transferMoney` Prisma review drill and independently deduced why calling `this.prisma.wallet.update({ where: { id: dto.toId } })` inside a `tx` that already ran `SELECT ... WHERE id IN (fromId, toId) FOR UPDATE` causes an immediate self-deadlock on `xmax`.
    - **Updated `reports/advanced_backend/lesson_14_locking_teacher_guide.html`:** Embedded the practical notes for Stage 5, Stage 6, the 5-Question X-Ray Checklist in `#prisma-drill`, and the 3-family SQLSTATE Cheat Sheet table in `#cheat-sheet`.
    - **Restored `lab14_locking` DB state:** Reset `lab14_locking.flights` (`VN123: seats = 2, version = 0`) and `lab14_locking.contracts` (`id = 1, 2`) to clean baseline with `0` open transactions.
- **Remaining:**
  - **Today & Tomorrow Noon:** Complete **Lesson 07 (`reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` & `labs/lesson-07-data-modeling/`)**, focusing on `1NF–3NF`, FK & online indexing (`CREATE INDEX CONCURRENTLY`), Polymorphic Associations, and **Chặng 9 (Double-Entry Ledger `wallets` + `ledger_entries` + `post_transfer`)**, culminating in the learner writing `bai07-ddl.sql` (Phase 4 of `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`).
  - **Remaining 1.5 Days of Cluster 1 (Phase B):** Execute M0–M1 implementation (`plans/261027-0907-cluster1-m0-m1-implementation/plan.md`) — AI builds the M0 repo skeleton, seed, read APIs, and burst harness (Phases 1–3, 5) while the learner fills the M1 locking/review slots (Phase 6).
- **Urgency:** high (compressed Cluster 1 timeline: finish Lesson 07 by tomorrow noon, complete Phase B M0–M1 in 1.5 days).

## Scope and guardrails
- **Workspace:** `D:/học/advance-be`
- **In scope:**
  - Interactive DBX co-learning for **Lesson 07** (`reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`, schema `lab07_modeling` on `advance_be_lab`).
  - Parallel/subsequent execution of `plans/261027-0907-cluster1-m0-m1-implementation/plan.md` for `omnipos-finledger-hub`.
- **Out of scope:**
  - Writing the learner's Lesson 07 DDL (`bai07-ddl.sql`) or Phase 6 `TODO(Đạt)` locking lines on behalf of the learner.
  - Modifying unrelated files outside the project workspace.
- **Constraints:**
  - Follow `AGENTS.md` Apprenticeship Rules: plain Vietnamese explanations, relatable analogies first before SQL/code, step-by-step DBX SQL experiments, never dump raw `.mjs` scripts on the learner.
- **Safety boundaries:**
  - Keep all outputs strictly inside `D:/học/advance-be`.
  - Redact all credentials, tokens, and internal company identifiers before committing to `advance-be`.

## Current state
- **Branch:** `main`
- **HEAD:** `51ecf2e0574959ee0b3ed8fee42614e19ce4d3ad`
- **Working tree:** dirty
- **Changed files:**
  - `M plans/261027-0907-cluster1-m0-m1-implementation/phase-01-moi-truong-va-spike-phien-ban.md`
  - `M plans/261027-0907-cluster1-m0-m1-implementation/phase-02-khung-repo-m0.md`
  - `M plans/261027-0907-cluster1-m0-m1-implementation/phase-03-du-lieu-nen-api-doc-stub-checks.md`
  - `M reports/advanced_backend/lesson_14_locking_teacher_guide.html`
- **Untracked files:**
  - `plans/handoffs/lesson-14-completed-start-lesson-07-20261030-1130.md`
- **Intentional local modifications:** yes (`reports/advanced_backend/lesson_14_locking_teacher_guide.html` updated with learner's requested practical notes and 3-family SQLSTATE cheat sheet; phase-01..03 plan refinements).

## Decisions and rationale
- **Decision:** Group PostgreSQL `SQLSTATE` codes into 3 prefix families (`23xxx` Constraint Violation -> no retry / return `409`, `40xxx` Concurrency Rollback `40001`/`40P01` -> retry + `ORDER BY id`, `55xxx` Lock Not Available `55P03` -> fail fast) and embed them into `lesson_14_locking_teacher_guide.html`.
  - **Rationale:** Learner noted that memorizing individual 5-character codes was overwhelming; grouping by the 2-digit SQLSTATE class maps 1-to-1 to backend `try/catch` handling.
  - **Alternative rejected:** Memorizing flat lists of disconnected error codes.
  - **Reference:** `reports/advanced_backend/lesson_14_locking_teacher_guide.html` (`#cheat-sheet`).
- **Decision:** Introduce the 5-Question `$transaction` X-Ray Checklist (`findUnique` outside `tx`, `ORDER BY id` before `FOR UPDATE`, `updateMany` `{ count === 0 }` check, `tx.` vs `this.prisma.` inside callback, external HTTP calls outside `tx`) and embed it into `#prisma-drill`.
  - **Rationale:** Bridges the gap between raw SQL mental models in DBX and Prisma 7 TypeScript code; immediately lifted learner's code review accuracy to 5/5 (100%).
  - **Alternative rejected:** Relying on ad-hoc intuition when reviewing ORM transaction code.
  - **Reference:** `reports/advanced_backend/lesson_14_locking_teacher_guide.html` (`#prisma-drill`).
- **Decision:** Compress Lesson 07 into today + tomorrow noon (~4.5–5 hours focused DBX walkthrough) and allocate 1.5 days to Cluster 1 Phase B (`M0 + M1`).
  - **Rationale:** In Phase B (`plans/261027-0907-cluster1-m0-m1-implementation/plan.md`), AI owns 100% of the heavy M0 scaffolding/UI/burst-test setup (~11.5h of AI automation), while the learner's hands-on workload in Phase 4 + Phase 6 is ~5–6 hours total (writing `bai07-ddl.sql` right after Lesson 07 + filling the locking `TODO(Đạt)` lines and 8 review questions that the learner just mastered in Lesson 14). Thus 1.5 days for Phase B is completely realistic without cutting any core learning scope.
  - **Alternative rejected:** Skipping Lesson 07 stages or rushing through Double-Entry Ledger design without DBX verification.
  - **Reference:** `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`.

## Work performed
- Executed live DBX queries on connection `ADVANCE_BE_LAB` (`34226883-c0ad-4752-bcef-eba9bcdde682`) to verify `lab14_locking.contracts` (`id = 1, 2, 3`), `lab14_locking.flights` (`id = 1, 2`), and `pg_stat_activity`.
- Guided learner through live 2-tab DBX experiments for Lesson 14 Stage 5 (`40P01` & `ORDER BY id FOR UPDATE`), Stage 6 (`FOR UPDATE NOWAIT`, `FOR UPDATE SKIP LOCKED`, plain `SELECT` MVCC vs `FOR UPDATE`), Stage 7 (`version` CAS row-lock wait and `0 rows` on version mismatch), and Stage 8 (Prisma 7 `BookingService` & `transferMoney` 5-question X-Ray review).
- Edited `reports/advanced_backend/lesson_14_locking_teacher_guide.html` (`+38 / -8` lines) to persist Stage 5, Stage 6, Stage 8 X-Ray notes, and the 3-family SQLSTATE table.
- Reset `lab14_locking.flights` and `lab14_locking.contracts` in `advance_be_lab` to clean baseline values (`VN123: seats = 2, version = 0`; `contracts id=1: 478461.34, id=2: 856499.03`).
- 0 redactions applied.

## Verification
| Check | Command | Outcome | When |
| :--- | :--- | :--- | :--- |
| DBX `lab14_locking` baseline reset & active sessions | `SELECT id, code, seats, version FROM lab14_locking.flights ORDER BY id;` + `pg_stat_activity` via `dbx_execute_query` | PASS (`VN123: 2, 0`, `VN456: 2, 0`, `0` idle-in-transaction sessions) | 2026-10-30 |
| Lesson 14 HTML guide diff check | `git diff --stat reports/advanced_backend/lesson_14_locking_teacher_guide.html` | PASS (1 file changed, clean HTML callouts & table added) | 2026-10-30 |

Not run:
- `labs/lesson-07-data-modeling/check.sql`: Deferred until the start of the Lesson 07 learning session (already verified `14/14 ✔` in `plans/handoffs/lesson-07-guide-ready-20261027-2241.md`).

## Open risks and blockers
- Type: risk. Owner: Đạt + AI. Impact: Lesson 07 has 9 stages; to finish by tomorrow noon without fatigue, Stages 1–5 (`1NF–3NF`, FK, Table Format/CIC, Data Types) should be taught with the same fast, story-driven DBX style (~90 mins today), leaving Stages 6–9 (Case Studies, Views, Polymorphic, and **Chặng 9 Double-Entry Ledger**) for tonight/tomorrow morning (~120 mins) so `bai07-ddl.sql` is ready right at noon tomorrow.

## Exact next actions
1. **First safe step** — Open `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` in the browser and verify `lab07_modeling` in DBX (`ADVANCE_BE_LAB`) by running `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'lab07_modeling';`.
2. Walk through **Lesson 07 Part 1 (Chặng 1 → Chặng 5: ERD, `1NF–3NF`, Foreign Keys & Race Condition, `CREATE INDEX CONCURRENTLY`, Data Types & Money `BIGINT`/`NUMERIC`)** today via fast story-driven DBX experiments.
3. Walk through **Lesson 07 Part 2 (Chặng 6 → Chặng 9: Exclusion Constraint `gist`, Views, Polymorphic Associations, and Double-Entry Ledger `wallets` + `ledger_entries` + `post_transfer`)** tonight / tomorrow morning, and complete the Phase 4 gate (`bai07-ddl.sql`) by tomorrow noon.
4. Immediately launch **Phase B of Cluster 1 (`plans/261027-0907-cluster1-m0-m1-implementation/plan.md`)** for the remaining 1.5 days: AI executes Phases 1–3 & 5 (M0 skeleton + M1 wiring/tests) while Đạt completes Phase 4 (DDL) and Phase 6 (`TODO(Đạt)` locking lines + 8 review questions).

## Source pointers
- `reports/advanced_backend/lesson_14_locking_teacher_guide.html`
- `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`
- `labs/lesson-07-data-modeling/00-setup.sql`
- `labs/lesson-07-data-modeling/check.sql`
- `plans/handoffs/lesson-07-guide-ready-20261027-2241.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/phase-04-gate-bai-07-ddl-cua-dat.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/phase-06-slot-cua-dat-va-nghiem-thu-m1.md`
