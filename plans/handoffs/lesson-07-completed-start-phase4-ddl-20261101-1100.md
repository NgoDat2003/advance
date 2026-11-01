---
handoff-version: 1
generated: 2026-11-01T11:00:00+07:00
generator: ak:handoff@2.0.0
focus: "tổng kết lại đi"
workspace: D:/study/advance-be
branch: main
head: 637e2f0fdae0ced6f993447a2595c091e891ab0c
---

# HANDOFF: Lesson 07 Completed (Stages 0–9 + Prisma Drill + QLHD X-Ray) & Hub Cloned — Ready for Cluster 1 Phase 4 DDL (`bai07-ddl.sql`)

## Mission and current status
Focus: "tổng kết lại đi".

- **Outcome:** Resume Cluster 1 Phase B (`M0 + M1` on `omnipos-finledger-hub`) starting at **Phase 4 (`T4.2` — learner designs and tests `omnipos-finledger-hub/docs/design/bai07-ddl.sql`)**, followed by **Phase 5 (M1 integration & burst harness)** and **Phase 6 (learner fills `TODO(Đạt)` locking lines and 8-question review)**.
- **Done:**
  - **Completed 100% of Lesson 07 (`reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`, Stages 0–9 + Prisma 7 Schema Drill):**
    - **Chặng 5 (Data Types):** Locked in PostgreSQL data type rules (`text` vs `varchar(255)` identical storage `14B`; `int` vs `bigint`; `bigint` / `numeric` over `float8` where `0.1 + 0.2 = 0.30000000000000004`; `timestamptz` over `timestamp` which silently drops `+07`; `NOT EXISTS` over `NOT IN` when `NULL` is possible) and validated column types for `wallets`.
    - **Chặng 6 (6 Design Case Studies):** Practiced live in DBX (`06-case-studies.sql`) i18n `jsonb` + `coalesce`, gap-based ordering (`pos = (lo + hi) / 2` + `row_number() * 1000` reset without integer overflow), homestay availability (`365 rows/year` conditional `UPDATE` vs `daterange` / `tstzrange` + `EXCLUDE USING gist` error `23P01` including 2-hour cleaning buffer), `text[]` array + `GIN` vs `N-N` join table, and `MATERIALIZED VIEW` + `REFRESH MATERIALIZED VIEW CONCURRENTLY` for daily F&B revenue dashboards.
    - **Chặng 7 (Views):** Verified via `EXPLAIN (COSTS OFF)` in DBX (`07-views.sql`) how simple views inline (`Bitmap Index Scan`), how `GROUP BY` views push down `WHERE` filters on grouping keys, and why putting `LIMIT` inside a view creates an optimization fence (`Subquery Scan` + `Seq Scan`). Clarified `USING (col)` join syntax and when views are updatable.
    - **Chặng 8 (Polymorphic Associations):** Compared `commentable_type + commentable_id` (`orphans = 4`, no FK) vs **Exclusive Arc (`CHECK (num_nonnulls(post_id, product_id) = 1)` + partial indexes, `orphans = 0`, error `23514`)** vs separate child tables (`08-polymorphic.sql`).
    - **Chặng 9 (Capstone Double-Entry Ledger):** Mapped `transfers` + `ledger_entries` + `wallets` 1-to-1 to SAP Business One `JE` (`OJDT` header + `JDT1` debit/credit lines + `OACT`/`OCRD` cached balance). Verified all 4 attack proofs in DBX (`23514` overdraft check, `23505` duplicate `idempotency_key`, `23514` deferred unbalanced JE trigger on `COMMIT`, `23001` append-only trigger) and balance reconciliation query (`HAVING w.balance <> coalesce(sum(e.amount), 0)`).
    - **Prisma 7 Schema Drill:** Reviewed the 5-model Prisma schema and produced the corrected production `schema.prisma` + custom `ALTER TABLE ... ADD CONSTRAINT ... CHECK` SQL migration.
  - **Completed Read-Only X-Ray Audit of the Learner's Local Lease-Contract DB (`qlhd`):**
    - Identified `16/16` timestamp columns using `timestamp without time zone` (`0` `timestamptz`), `7/19` foreign keys missing leading indexes (including Left-Prefix traps on `(lease_contract_id, store_id)` and `(lease_contract_id, brand_id)`), `8` redundant B-Tree indexes duplicating `@unique` or composite prefixes, missing `UNIQUE` constraint on `sap_export_logs (lease_contract_id, export_period)` (allowing duplicate SAP JE exports under concurrency), and `0` `CHECK`/`EXCLUDE` constraints.
  - **Cloned `NgoDat2003/omnipos-finledger-hub` into `D:/study/advance-be/omnipos-finledger-hub`:**
    - Verified Phases 1, 2, 3, and 4 (`T4.1` worksheet `docs/design/bai07-ddl-worksheet.md`) are already committed on `main` (`HEAD 9e01cc9`), and confirmed `advance-be` ignores `/omnipos-finledger-hub/` cleanly.
- **Remaining:**
  - **Phase 4 (`T4.2` & `T4.3`):** Learner answers `Q1–Q7` and writes `omnipos-finledger-hub/docs/design/bai07-ddl.sql` (`PART A: DDL` for `wallets`, `ledger_entries`, `voucher_campaigns`, `voucher_slots` + `PART B: TESTS` `B1 -> 23514`, `B2 -> 23505`, `B3 -> pass`); executor runs preflight and transactional replay (`T4.3`).
  - **Phase 5 (`phase-05-tich-hop-m1-sau-ddl.md`):** Executor integrates M1 Prisma models, wallet seed, naive vs locked service scaffold with `TODO(Đạt)` slots, and `checks/m1/`.
  - **Phase 6 (`phase-06-slot-cua-dat-va-nghiem-thu-m1.md`):** Learner records naive before-metrics, fills `TODO(Đạt)` locking lines (`ORDER BY id FOR UPDATE`, `FOR UPDATE SKIP LOCKED`), completes the 8-question review, and runs after-metrics acceptance checks.
- **Urgency:** high (Cluster 1 Phase A is 100% complete; ready to execute Phase 4–6 of Cluster 1 Phase B).

## Scope and guardrails
- **Workspace:** `D:/study/advance-be` (with nested standalone repo `D:/study/advance-be/omnipos-finledger-hub`).
- **In scope:**
  - Guiding the learner through `omnipos-finledger-hub/docs/design/bai07-ddl-worksheet.md` (`Phase 4 T4.2`), running `T4.3` replay verification, and executing Phases 5–6 of `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`.
- **Out of scope:**
  - Writing column names, types, `CHECK`, `UNIQUE`, `FK`, or indexes of `wallets`, `ledger_entries`, `voucher_campaigns`, `voucher_slots` on behalf of the learner in Phase 4 (`phase-04-gate-bai-07-ddl-cua-dat.md`).
  - Writing the learner's Phase 6 `TODO(Đạt)` locking lines on their behalf.
- **Constraints:**
  - Follow `AGENTS.md` Apprenticeship Rules and the learner's concrete story + visual diagram + live DBX verification style.
- **Safety boundaries:**
  - Never output files outside `D:/study/advance-be`.
  - Never commit company names, local container names, or credentials into tracked files of `advance-be` (public repo) or `omnipos-finledger-hub`.
  - Never run destructive commands against the learner's port `5433` PostgreSQL container; `omnipos-finledger-hub` uses its dedicated `omnipos-hub-pg` container on `127.0.0.1:5434`.

## Current state
- **Branch:** `main`
- **HEAD:** `637e2f0fdae0ced6f993447a2595c091e891ab0c`
- **Working tree:** dirty
- **Changed files:**
  - `M README.md`
  - `M TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md`
  - `M plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/shell-tail.html`
  - `M reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`
- **Untracked files:**
  - `?? labs/lesson-06-redis/`
  - `?? plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render-dark/1440x900.png`
  - `?? plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render-dark/375x812.png`
  - `?? plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render-dark/768x1024.png`
  - `?? plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render/1440x900.png`
  - `?? plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render/375x812.png`
  - `?? plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render/768x1024.png`
  - `?? plans/261031-1651-lesson-06-redis-teacher-guide/`
  - `?? plans/reports/research-261030-flashsale-concurrency-load-testing-tools-and-repos.md`
  - `?? reports/advanced_backend/lesson_06_redis_teacher_guide.html`
  - `?? reports/obsidian-skills-evaluation.md`
  - `?? reports/obsidian-skills-repomix.md`
  - `?? plans/handoffs/lesson-07-completed-start-phase4-ddl-20261101-1100.md`
- **Intentional local modifications:** yes (existing workspace files + cloned ignored `omnipos-finledger-hub/` at `HEAD 9e01cc9`).

## Decisions and rationale
- **Decision:** Map Double-Entry Ledger (`transfers`, `ledger_entries`, `wallets`) directly to the learner's SAP Business One `JE` domain (`OJDT`, `JDT1`, `OACT`/`OCRD`).
  - **Rationale:** Learner works daily with SAP B1 `AR / JE` exports; connecting `transfers` to `OJDT` and `ledger_entries` to `JDT1` made the 3 ledger invariants (`SUM(amount) = 0` per transfer, append-only reversal via refund JE, and `wallets.balance` cache reconciliation) immediately intuitive.
  - **Alternative rejected:** Teaching ledger theory in abstract banking terms disconnected from the learner's ERP experience.
  - **Reference:** `labs/lesson-07-data-modeling/09-ledger.sql`.
- **Decision:** Keep the `qlhd` database X-Ray strictly read-only and in-chat (with redacted identifiers in tracked handoff files).
  - **Rationale:** Satisfies the learner's goal of seeing Lesson 03/07/14 concepts in their real company database while respecting the `advance-be` public-repo privacy guardrail (`plan.md`).
  - **Alternative rejected:** Writing unredacted company schema dumps to tracked files.
  - **Reference:** `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`.

## Work performed
- Executed read-only PostgreSQL 16 queries on `advance_be_lab` (`lab07_modeling`) to demonstrate data type storage/precision (`05-data-types.sql`), guided learner through live DBX execution of `06-case-studies.sql` (including `tstzrange` + `EXCLUDE USING gist`), `07-views.sql` (`EXPLAIN` inline vs pushdown vs `LIMIT` fence), `08-polymorphic.sql` (`num_nonnulls`), and `09-ledger.sql` (Double-Entry Ledger + 4 attacks + reconciliation).
- Executed read-only schema/constraint/index inspection queries on the local lease-contract database (`[REDACTED:local-db]`) in container `[REDACTED:db-container]` on port `5433` to surface 5 real-world findings (`16` `timestamp` columns without timezone, `7` unindexed FKs, `8` redundant indexes, non-unique `(lease_contract_id, export_period)` on `sap_export_logs`, and `0` `CHECK`/`EXCLUDE` constraints).
- Cloned `https://github.com/NgoDat2003/omnipos-finledger-hub.git` into `D:/study/advance-be/omnipos-finledger-hub` (`HEAD 9e01cc9`) and verified `/omnipos-finledger-hub/` is git-ignored by `advance-be`.
- 2 redactions applied.

## Verification
| Check | Command | Outcome | When |
| :--- | :--- | :--- | :--- |
| Stage 5 data type byte & float precision check | `SELECT pg_column_size('Trà sữa'::text), (0.1::float8 + 0.2::float8) ...` on `advance_be_lab` | PASS (`14B` vs `14B`, `0.30000000000000004` vs `0.3`, `timestamptz` UTC conversion verified) | 2026-11-01 |
| Stage 6 `EXCLUDE USING gist` & Stage 7 `EXPLAIN` view plans | Learner executed `06-case-studies.sql` & `07-views.sql` in DBX | PASS (confirmed `23P01` exclusion error and `Bitmap Index Scan` vs `Subquery Scan` fence) | 2026-11-01 |
| Stage 9 Double-Entry Ledger 4 attacks & reconciliation | Learner executed `09-ledger.sql` in DBX | PASS (confirmed `23514` overdraft, `23505` duplicate key, `23514` deferred unbalanced JE on `COMMIT`, and `50000 -> 45000` cache reconciliation) | 2026-11-01 |
| Clone `omnipos-finledger-hub` & verify `advance-be` git status | `git clone https://github.com/NgoDat2003/omnipos-finledger-hub.git omnipos-finledger-hub && git status --short` | PASS (cloned at `9e01cc9`, `0` hub lines in `advance-be` `git status`) | 2026-11-01 |

Not run:
- `omnipos-finledger-hub` Phase 4 `T4.3` DDL replay (`OUT/bai07-replay.txt`): Waiting for learner to author `omnipos-finledger-hub/docs/design/bai07-ddl.sql` (`T4.2`).

## Open risks and blockers
- Type: blocker. Owner: Đạt. Impact: Phase 5 (`phase-05-tich-hop-m1-sau-ddl.md`) cannot start until `omnipos-finledger-hub/docs/design/bai07-ddl.sql` is written by the learner and passes `T4.2` preflight + `T4.3` replay (`B1 -> 23514`, `B2 -> 23505`, `B3 -> pass`).

## Exact next actions
1. **First safe step** — Open `omnipos-finledger-hub/docs/design/bai07-ddl-worksheet.md` and review the 4 target tables (`wallets`, `ledger_entries`, `voucher_campaigns`, `voucher_slots`), invariants `I-01…I-07`, and design questions `Q1–Q7`.
2. Start the dedicated hub Postgres container (`cd omnipos-finledger-hub && docker compose up -d`) or use a scratch schema in DBX on port `5433` to test the draft DDL and the 3 test queries (`B1` negative store wallet `-> 23514`, `B2` duplicate store claim in same campaign `-> 23505`, `B3` negative `TREASURY` wallet `-> OK`).
3. Save the completed file to `omnipos-finledger-hub/docs/design/bai07-ddl.sql` (with `-- PART A: DDL` and `-- PART B: TESTS`, no `BEGIN/COMMIT/SET search_path`, UTF-8 no BOM) and run Phase 4 `T4.2` + `T4.3` verification from `plans/261027-0907-cluster1-m0-m1-implementation/phase-04-gate-bai-07-ddl-cua-dat.md`.
4. Proceed immediately to Phase 5 (`plans/261027-0907-cluster1-m0-m1-implementation/phase-05-tich-hop-m1-sau-ddl.md`) and Phase 6 (`phase-06-slot-cua-dat-va-nghiem-thu-m1.md`).

## Source pointers
- `omnipos-finledger-hub/docs/design/bai07-ddl-worksheet.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/phase-04-gate-bai-07-ddl-cua-dat.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/phase-05-tich-hop-m1-sau-ddl.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/phase-06-slot-cua-dat-va-nghiem-thu-m1.md`
- `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`
- `labs/lesson-07-data-modeling/09-ledger.sql`
