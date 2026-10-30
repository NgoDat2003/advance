---
handoff-version: 1
generated: 2026-10-30T17:30:00+07:00
generator: ak:handoff@2.0.0
focus: "thôi để tối về sang pc hocj tiếp từ chặng 5 nha, h sắp về rồi"
workspace: D:/học/advance-be
branch: main
head: 51ecf2e0574959ee0b3ed8fee42614e19ce4d3ad
---

# HANDOFF: Lesson 14 Completed & Lesson 07 Stages 0–4 Mastered — Resume at Lesson 07 Stage 5 Tonight on Home PC

## Mission and current status
Focus: "thôi để tối về sang pc hocj tiếp từ chặng 5 nha, h sắp về rồi"

- **Outcome:** Tonight on the Home PC (`D:/study/advance-be`), resume **Lesson 07 (Data Modeling & Double-Entry Ledger)** starting at the **Chặng 5 closing question (4-column `wallets` type selection)** and complete **Chặng 6, Chặng 7 (optional), Chặng 8 (Polymorphic Associations), and Chặng 9 (Double-Entry Ledger `wallets` + `ledger_entries` + `post_transfer`)** plus the **Phase 4 DDL Gate (`bai07-ddl.sql`)** by tomorrow noon, leaving 1.5 days for **Cluster 1 Phase B (`M0 + M1` on `omnipos-finledger-hub`)**.
- **Done today at the office (`D:/học/advance-be`):**
  - **Completed 100% of Lesson 14 (Stages 5–8):**
    - Mastered Stage 5 (`deadlock_timeout = 1s` sleep-and-alarm cycle detection, `40P01` auto-rollback, and pulling `SELECT ... WHERE id IN (...) ORDER BY id ASC FOR UPDATE` to the top of `$transaction`).
    - Mastered Stage 6 (plain `SELECT` MVCC vs `FOR UPDATE` wait vs `FOR UPDATE NOWAIT` `55P03` vs `FOR UPDATE SKIP LOCKED` + eliminating Hot Row contention).
    - Mastered Stage 7 (live 2-tab DBX proof that `UPDATE ... WHERE id = 1 AND version = 1` still waits on `xmax` row lock, returning `0 rows` if the holder commits or `1 row` if the holder rolls back).
    - Mastered Stage 8 (3 SQLSTATE prefix families `23xxx`, `40xxx`, `55xxx` + 5-Question `$transaction` X-Ray Checklist; learner scored 5/5 on `transferMoney` and independently deduced self-deadlock when mixing `this.prisma` inside `tx`).
    - Persisted all practical notes, the 5-Question X-Ray Checklist, and the 3-family SQLSTATE table into `reports/advanced_backend/lesson_14_locking_teacher_guide.html`.
  - **Completed Lesson 07 Stages 0, 1, 2, 3 & 4 (`reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`):**
    - **Chặng 0 (Setup):** Seeded `lab07_modeling` (`order_sheet = 2155`, `order_sheet_raw = 830`, `btree_gist`) on the office PC and verified `C01–C04 ✔`. (On Home PC, `lab07_modeling` is already seeded and verified `14/14 ✔`).
    - **Chặng 1 (ERD, 4 Table Types & Timeline FK Rule):** Mastered the 4 table buckets (`entity`, `relation`, `support`, `config`), why the later-born entity (`erd_payment_transactions`) holds the FK (`order_id`) pointing to the earlier-born entity (`erd_orders`), and conditional `CHECK ((kind = 'ORDER') = (order_id IS NOT NULL))`. Learner scored 8/8 classifying 8 OmniPOS tables.
    - **Chặng 2 (`0NF → 1NF → 2NF → 3NF` & Controlled Denormalization):** Mastered the learner's own 4-line mental model (`1NF`: 1 value per cell; `2NF`: no partial dependency on a composite PK `(A, B)`; `3NF`: every non-key column depends directly on the PK, no transitive piggybacking on another non-key column; `Denormalization`: controlled cache columns like `order_total` / `balance` updated in the same transaction + reconciliation query). Solved the 5-table F&B receipt normalization (`my_kho`, `my_nha_cung_cap`, `my_nguyen_lieu`, `my_phieu_nhap`, `my_phieu_nhap_dong`) and previewed `QLHD_local` tables (`lease_contracts`, `contract_store_allocations`, `payment_schedules`).
    - **Chặng 3 (Foreign Keys, Missing FK Index Trap & Race Condition):** Verified on `northwind` that 10/13 FK columns lack indexes because PostgreSQL/Prisma never auto-index FK columns (causing parent `DELETE` to `Seq Scan` child tables: `7.22ms` vs `0.52ms`), and why dropping FKs in favor of app-level `SELECT` checks creates orphan rows (`orphans = 1`) due to missing `FOR KEY SHARE` locks.
    - **Chặng 4 (`ALTER TABLE` Table Rewrite vs Catalog-Only, `jsonb` + `GIN`, and `CREATE INDEX CONCURRENTLY`):** Mastered why PG 11+ `ADD COLUMN ... DEFAULT <const>` takes `~1.1ms` (recorded in `pg_attribute.atthasmissing` without rewriting 500k rows) vs volatile defaults (`random()`) or type widening (`int -> bigint`) forcing a full table rewrite (`~520ms`); when to use B-Tree expression index vs `GIN` index on `jsonb`; and why `CREATE INDEX CONCURRENTLY` avoids blocking writes (`ShareUpdateExclusiveLock`) and cannot run inside `BEGIN ... COMMIT` (`25001`, because it internally commits 3 multi-transaction phases).
    - **Chặng 5 (Data Types — Theory presented, ready for quick 4-column answer):** Presented the 5 PostgreSQL type rules (`text` over `varchar(255)`, `int` vs `bigint`, `numeric`/`bigint` over `float8` where `0.1 + 0.2 = 0.30000000000000004`, `timestamptz` over `timestamp`, and `NULL` traps with `NOT IN` and `UNIQUE NULLS NOT DISTINCT`).
- **Remaining:**
  - **Chặng 5 Quick Check (2 mins):** Learner answers the 4-column `wallets` type selection (`id`, `store_code`, `balance`, `updated_at`).
  - **Chặng 6 (Slide 26–34 — 6 Design Case Studies):** Multi-language i18n, task ordering (`numeric` gap / `lexorank`), homestay availability & PostgreSQL `EXCLUDE USING gist` range overlap prevention, tags (`N–M` vs `jsonb`/`text[]`), and materialized views / daily rollups.
  - **Chặng 7 (Optional, 5 mins):** Views (`MERGE` inline vs optimization fence).
  - **Chặng 8 (20 mins — Polymorphic Associations):** 3 ways to model comments belonging to either `posts` or `products` (shared table without FK, Exclusive Arc `CHECK (num_nonnulls(...) = 1)` with multiple FKs, or separate join tables).
  - **Chặng 9 (45 mins — Capstone Double-Entry Ledger `wallets` + `transfers` + `ledger_entries`):** The core foundation for Cluster 1 M1 (`bai07-ddl.sql`), plus Prisma 7 Schema Drill.
  - **Post-Lesson 07 Bonus (as requested by learner):** Deep-dive X-Ray of learner's real company databases (`qlhd` / `qaqc`) using Lesson 07 + Lesson 14 principles, and execution of Cluster 1 Phase B (`M0 + M1`).
- **Urgency:** high (resume tonight on Home PC to finish Lesson 07 by tomorrow noon).

## Scope and guardrails
- **Workspace:** `D:/học/advance-be` (Office PC) / `D:/study/advance-be` (Home PC).
- **In scope:**
  - Interactive co-learning for **Lesson 07** (`reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`) from **Chặng 5 → Chặng 9**.
  - Updating `reports/advanced_backend/lesson_14_locking_teacher_guide.html` (already done) and keeping future explanations in the concise **"Story/Question → Visual Diagram → DBX Measured Stats Table"** format requested by the learner.
- **Out of scope:**
  - Writing the learner's Phase 4 `bai07-ddl.sql` or Phase 6 `TODO(Đạt)` code slots on their behalf.
- **Constraints:**
  - **Teaching Style Rule (Explicitly requested by learner today):** The HTML teacher guide's raw logs are too dense when read cold; always summarize each stage with **concrete real-world examples + visual Mermaid diagram + DBX measured statistics table** (running DBX queries directly to show real numbers) followed by a short 30-second check question.
- **Safety boundaries:**
  - Never output files outside the project directory.
  - Never commit unredacted company names, container names, or credentials to the public `advance-be` repository.

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
  - `plans/handoffs/lesson-07-stage1-4-mastered-resume-stage5-20261030-1730.md`
- **Intentional local modifications:** yes.

## Decisions and rationale
- **Decision:** Adopt the **"Concrete Story → Mermaid Diagram → DBX Measured Stats Table → 30s Check Question"** teaching format for all remaining stages of Lesson 07 (Stages 5–9) and future teacher guides.
  - **Rationale:** Learner reported that reading the raw teacher guide HTML directly felt confusing (~50% comprehension) until we distilled each stage into concrete examples + live DBX stats tables, which immediately brought comprehension and quiz accuracy to 100%.
  - **Alternative rejected:** Having the learner read long SQL scripts and terminal logs cold before discussion.
  - **Reference:** Learner feedback during Lesson 07 Stages 2–4.
- **Decision:** Defer the full `qlhd` / `qaqc` database X-Ray audit until right after Lesson 07 Stages 5–9 are completed.
  - **Rationale:** Learner explicitly requested finishing the remaining stages of Lesson 07 first so all modeling tools (Data Types, Exclusion Constraints, Polymorphic Associations, Double-Entry Ledger) are in hand before dissecting `qlhd` and `qaqc`.
  - **Alternative rejected:** Context-switching into `qlhd` mid-lesson.
  - **Reference:** Learner feedback at the start of Lesson 07 Stage 2.

## Work performed
- Verified and seeded `lab07_modeling` (`order_sheet = 2155`, `order_sheet_raw = 830`, `btree_gist`) on `ADVANCE_BE_LAB` (`34226883-c0ad-4752-bcef-eba9bcdde682`), confirming `C01–C04 ✔`.
- Executed read-only DBX queries on `ADVANCE_BE_LAB` (`lab07_modeling`, `northwind`, `lab03_indexing.hw_contracts`) and `QLHD_local` (`dc6a4761-456c-4ece-907f-51fdf57f52b2`) to produce live statistics for Lesson 07 Stages 1–5.
- Guided learner through Lesson 07 Stages 1, 2, 3, 4, and the theory table of Stage 5.
- 0 redactions applied.

## Verification
| Check | Command | Outcome | When |
| :--- | :--- | :--- | :--- |
| `lab07_modeling` Step 0 setup (`C01–C04`) | `SELECT 'C01' ... UNION ALL SELECT 'C04' ...` via `dbx_execute_query` | PASS (`C01–C04 ✔`, `2155` rows in `order_sheet`, `830` rows in `order_sheet_raw`) | 2026-10-30 |
| Stage 2 `NL01` dependency & `order_sheet` repetition stats | `SELECT tong_dong_bang_phang_1nf, so_lan_lap_ten_mon_1 ...` via `dbx_execute_query` | PASS (`2155` rows, `38` repeats for product 1, `116` repeats for customer `SAVEA`) | 2026-10-30 |
| Stage 3 `northwind` FK index coverage check | `SELECT bang_con, cot_fk, co_index_tren_cot_fk FROM pg_constraint ...` via `dbx_execute_query` | PASS (proved `10/13` FK columns in `northwind` lack indexes) | 2026-10-30 |
| Stage 4 & 5 live metrics (`hw_contracts` size & `float8` vs `numeric`) | `SELECT (0.1::float8 + 0.2::float8) = 0.3::float8 ...` via `dbx_execute_query` | PASS (`500000` rows / `55 MB`; `float_bang_0_3 = false`, `0.30000000000000004`, `numeric_bang_0_3 = true`) | 2026-10-30 |

Not run:
- `labs/lesson-07-data-modeling/09-ledger.sql`: Scheduled for tonight's session when reaching Stage 9.

## Open risks and blockers
- None — Home PC (`D:/study/advance-be`) already has `lab07_modeling` seeded (`14/14 ✔` in `check.sql`). If git changes from the office PC (`reports/advanced_backend/lesson_14_locking_teacher_guide.html` and this handoff file) need to be available on the Home PC, the learner should commit and push them before leaving the office.

## Exact next actions
1. **First safe step** — On the Home PC (`D:/study/advance-be`), pull the latest handoff (if pushed) and ensure the PostgreSQL lab container (on port `5433`) is running in Docker Desktop.
2. Answer the 30-second **Chặng 5 closing question** (selecting PostgreSQL data types for `wallets`: `id`, `store_code`, `balance`, `updated_at`) to lock in Stage 5.
3. Walk through **Chặng 6 (6 Design Case Studies — especially Homestay `EXCLUDE USING gist` range overlap prevention & Task Ordering)** and **Chặng 8 (Polymorphic Associations — 3 patterns)** using the concise DBX stats-table format (~40 mins).
4. Walk through **Chặng 9 (Capstone Double-Entry Ledger: `wallets` + `transfers` + `ledger_entries` + `post_transfer` + 4 attack proofs + Prisma 7 Schema Drill)** (~45 mins), then write `bai07-ddl.sql` (Phase 4 of Cluster 1 M1).

## Source pointers
- `plans/handoffs/lesson-07-stage1-4-mastered-resume-stage5-20261030-1730.md`
- `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`
- `reports/advanced_backend/lesson_14_locking_teacher_guide.html`
- `labs/lesson-07-data-modeling/05-data-types.sql`
- `labs/lesson-07-data-modeling/06-case-studies.sql`
- `labs/lesson-07-data-modeling/08-polymorphic.sql`
- `labs/lesson-07-data-modeling/09-ledger.sql`
- `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`
