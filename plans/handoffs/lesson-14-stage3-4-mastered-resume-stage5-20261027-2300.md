---
handoff-version: 1
generated: 2026-10-27T23:00:00+07:00
generator: ak:handoff@2.0.0
focus: "rồi oke để mai lên cty xử lý xong bài 14 này rồi mốt học bài 7 là xong chặng 1 sang làm dự án thật ha ?"
workspace: D:/study/advance-be
branch: main
head: 5a11914
---

# HANDOFF: Lesson 14 Stages 0–4 Mastered — Resume at Stage 5 (Deadlock `40P01` & Stages 5–8)

## Mission and current status
Focus: "rồi oke để mai lên cty xử lý xong bài 14 này rồi mốt học bài 7 là xong chặng 1 sang làm dự án thật ha ?"

- **Outcome:** Tomorrow at the office (28/10 — Day 3 of Cluster 1), finish the second half of **Lesson 14 (Chặng 5, 6, 7 & 8)** via interactive DBX hands-on, then on 29/10 (Day 4 of Cluster 1) complete **Lesson 07 (Data Modeling & Double-Entry Ledger)**, and on 30/10–01/11 (Days 5–6, Phase B of Cluster 1) build the real **`OmniPOS & FinLedger Hub`** project (`NgoDat2003/create-template-project`).
- **Done tonight on Home PC (`D:/study/advance-be`):**
  - Pulled `ff82faa..5a11914` from `origin/main` and verified `labs/lesson-14-locking/check-lab-state.mjs` (`6/6 ✔`).
  - **Completed Lesson 14 Chặng 3 (Table Locks & `ALTER TABLE` DDL Queue):**
    - Mastered how PostgreSQL table-level locks (`AccessShareLock` for `SELECT`, `RowShareLock` for `SELECT FOR UPDATE`, `RowExclusiveLock` for `UPDATE/DELETE/INSERT`, and `AccessExclusiveLock` for `ALTER TABLE / DROP / TRUNCATE`) work alongside row-level `xmax` locks.
    - Verified live in DBX on `lab14_locking.demo_ddl`: observed `1_ke_toan_A` holding `AccessShareLock` (`granted = true`) and `2_dev_alter_B` waiting for `AccessExclusiveLock` (`granted = false`, blocked by `A`).
    - Confirmed in DBX that a subsequent plain `SELECT * FROM lab14_locking.demo_ddl` with `SET lock_timeout = '3s'` gets blocked behind `2_dev_alter_B` and fails with `ERROR: canceling statement due to lock timeout` (`55P03`).
    - Learner independently deduced and executed `SELECT pg_cancel_backend(pid)` on `2_dev_alter_B`, proving that `SELECT` queries immediately resume while `1_ke_toan_A` remains `idle in transaction` (since `AccessShareLock` does not conflict with `AccessShareLock`).
  - **Completed Lesson 14 Chặng 4 (Why PostgreSQL Has No Gap Locks & No Unindexed Row Over-Locking):**
    - Verified live in DBX on `lab14_locking.demo_gap` (`id = 1, 2, 4, 5, 7`) while background session `1_khoa_dai_2_den_5` held an uncommitted `UPDATE ... WHERE id BETWEEN 2 AND 5` under `REPEATABLE READ`:
      1. `INSERT INTO lab14_locking.demo_gap VALUES (3, 999) RETURNING *;` succeeded immediately (`id = 3, balance = 999`), proving PostgreSQL has no Gap Locks (row locks are physical `xmax` stamps on existing tuples).
      2. `UPDATE lab14_locking.demo_gap SET balance = 0 WHERE id = 4;` blocked and threw `55P03` after `2s` because `id = 4` is an existing physical tuple locked by `xmax`.
    - Verified live in DBX on `lab14_locking.contracts` (1,000 rows, no index on `store_id`) while `UPDATE ... WHERE store_id = 44` was held uncommitted:
      1. `SELECT locked_row, locker, modes FROM lab14_locking.pgrowlocks('lab14_locking.contracts')` showed **only 4 locked rows** (`locker = 17857`, `modes = {"No Key Update"}`) despite a full 1,000-row `Seq Scan`.
      2. `UPDATE lab14_locking.contracts SET total = total + 1 WHERE id = 2 RETURNING id, store_id, total;` succeeded immediately (`id = 2, store_id = 26`), contrasting with MySQL InnoDB's scan-based locking.
    - Cleaned up all temporary sessions and `demo_ddl` / `demo_gap` tables, restoring `contracts` row `2` to its initial state.
- **Remaining for tomorrow at the office (28/10 — Day 3 of Cluster 1):**
  - **Chặng 5 (Deadlock `40P01` & Resource Ordering `ORDER BY id FOR UPDATE`):** Theory (`deadlock_timeout = 1s`, 4 Coffman conditions, `LockRows -> Sort`) has already been explained; tomorrow morning on the office PC (where `ADVANCE_BE_LAB` and `ADVANCE_BE_LAB_B` are already set up in DBX), immediately run the 2-tab hands-on M1 (trigger `40P01`) and M2 (fix with `SELECT ... WHERE id IN (2, 1) ORDER BY id FOR UPDATE`).
  - **Chặng 6 (Slide 16–19 — `FOR UPDATE NOWAIT`, `SKIP LOCKED` & Hot Row contention).**
  - **Chặng 7 (Slide 13, 15, 21 — Optimistic Locking `version` CAS vs Pessimistic Locking).**
  - **Chặng 8 (Prisma 7 Locking & Retry Code Drill).**

## Cluster 1 Schedule Check (`plans/handoffs/omnipos-finledger-master-roadmap-and-lesson12-20261026.md`)
- **26/10 (Day 1 — Phase A):** Lesson 12 (Chặng 6–8) -> ✅ Completed.
- **27/10 (Day 2 — Phase A):** Lesson 14 Part 1 (Chặng 0–4) -> ✅ Completed tonight.
- **28/10 (Day 3 — Phase A, tomorrow):** Lesson 14 Part 2 (Chặng 5–8) -> 🎯 Next up at office.
- **29/10 (Day 4 — Phase A, day after tomorrow):** Lesson 07 (`reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` — `1NF–3NF`, Polymorphic Associations, Double-Entry Ledger `wallets` + `ledger_entries` on DBX).
- **30/10 – 01/11 (Days 5–6 — Phase B):** Build Cluster 1 features on real project **`OmniPOS & FinLedger Hub`** (`NgoDat2003/create-template-project`): Flash-Voucher Claiming (`SKIP LOCKED` / Optimistic `version`) + Double-Entry Wallet Transfer (`ORDER BY id FOR UPDATE` + `SERIALIZABLE` retry `40001`/`40P01`).

## Exact next actions (Tomorrow morning at office)
1. Run `git pull origin main` on the office PC (`D:/học/advance-be`).
2. Open DBX with the two connections (`ADVANCE_BE_LAB` and `ADVANCE_BE_LAB_B`) and execute **Chặng 5 M1 (`40P01` Deadlock)** and **M2 (`ORDER BY id FOR UPDATE`)**, then complete **Chặng 6, 7, 8** to finish 100% of Lesson 14.
