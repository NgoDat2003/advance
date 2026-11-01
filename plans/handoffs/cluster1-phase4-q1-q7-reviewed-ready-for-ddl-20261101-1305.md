---
handoff-version: 1
generated: 2026-11-01T13:05:00+07:00
generator: ak:handoff@2.0.0
focus: "tổng kết lại đi mai lên cty ngồi làm có lẽ trễ lịch trình 1 ngày á rồi /skill:ak-git đẩy full lên git nhé có bài giảng bài redis nx ấy"
workspace: D:/study/advance-be
branch: main
head: 637e2f0fdae0ced6f993447a2595c091e891ab0c
---

# HANDOFF: Cluster 1 Phase 4 Q1–Q7 Mastered, Lesson 06 Redis Teacher Guide Ready & Pushed — Resume `bai07-ddl.sql` at Office

## Mission and current status
Focus: "tổng kết lại đi mai lên cty ngồi làm có lẽ trễ lịch trình 1 ngày á rồi /skill:ak-git đẩy full lên git nhé có bài giảng bài redis nx ấy".

- **Outcome:** Resume Cluster 1 Phase B (`M0 + M1` on `omnipos-finledger-hub`) at the office tomorrow (Monday 2026-11-02, 1-day schedule shift) starting right where we left off: learner writes `omnipos-finledger-hub/docs/design/bai07-ddl.sql` (`-- PART A: DDL` + `-- PART B: TESTS`), executor runs `T4.2` preflight & `T4.3` replay, then proceeds through **Phase 5 (M1 integration & burst harness)** and **Phase 6 (`TODO(Đạt)` locking lines & acceptance checks)**. Meanwhile, **Lesson 06 Redis Mastery (`lesson_06_redis_teacher_guide.html` + `labs/lesson-06-redis/`)** is 100% built, verified, and pushed to `origin/main` for Cluster 2 Phase A.
- **Done:**
  - **Completed 100% of Cluster 1 Phase A:**
    - Lesson 03 (`lesson_03_index_teacher_guide.html`), Lesson 12 (`lesson_12_transaction_teacher_guide.html`), Lesson 14 (`lesson_14_locking_teacher_guide.html`), and Lesson 07 (`lesson_07_data_modeling_teacher_guide.html` Stages 0–9 + Prisma 7 Schema Drill + Read-Only X-Ray of local lease-contract DB).
  - **Built & Verified Lesson 06 Redis Mastery (`reports/advanced_backend/lesson_06_redis_teacher_guide.html` + `labs/lesson-06-redis/`):**
    - Complete 9-stage interactive HTML teacher guide (`487.8 KB`) and `redis-cli` + Lua lab suite (`labs/lesson-06-redis/`) covering Single-Threaded Event Loop, Object Encodings, TTL & Eviction, RDB/AOF Hybrid Persistence, Data Structures, BigKeys/HotKeys & Delayed Queue Lua, Replication/Sentinel/Cluster (`CROSSSLOT`), Distributed Lock (`SET key token NX EX` + Lua Compare-and-Delete + Fencing Token), and OmniPOS M2 Bridge (Idempotency Key + Lua Token Bucket).
  - **Completed Design Review of `Q1–Q7` for Cluster 1 Phase 4 (`omnipos-finledger-hub/docs/design/bai07-ddl-worksheet.md`):**
    - **Q1 (Money type):** Confirmed `bigint` (or `numeric`) over `float8` to prevent binary floating-point rounding drift (`0.1 + 0.2 = 0.30000000000000004`).
    - **Q2 & Q3 (`TREASURY` vs `STORE` wallet + 1 wallet per store + `CHECK` non-negative):** Clarified `UNIQUE` on `store_id` (`REFERENCES stores(id)`, nullable for `TREASURY`) and `CHECK` constraint allowing negative balance only for `TREASURY` (via wallet type/flag column or `store_id IS NULL`) while blocking negative store wallets with `23514`.
    - **Q4 (Grouping 2 ledger entries per transfer `I-01`):** Clarified that because M1 has 4 tables (`wallets`, `ledger_entries`, `voucher_campaigns`, `voucher_slots`) without a separate `transfers` table, `ledger_entries` uses a grouping column (`transfer_id`) whose value is generated per transfer by the application/transaction (`POST /wallets/transfers`) and shared across the `-amount` and `+amount` rows.
    - **Q5 (Unclaimed slot & `UNIQUE (campaign_id, store_id)` with `NULL`):** Clarified two key SQL rules: (1) composite `UNIQUE (campaign_id, store_id)` permits `(1, 1)`, `(1, 2)`, and `(2, 1)` and only rejects a duplicate pair `(1, 1)` with `23505` when the same store claims a second slot in the same campaign; (2) in standard PostgreSQL `UNIQUE`, `NULL <> NULL`, so multiple unclaimed slots `(1, NULL)` coexist peacefully until claimed.
    - **Q6 (Ledger index by wallet `NFR-08`):** Confirmed explicit `CREATE INDEX` on `ledger_entries(wallet_id)` (since PostgreSQL does not auto-index foreign keys).
    - **Q7 (Wallet ID type & JSON serialization):** Explained why 64-bit `bigint` (`2^63 - 1`) exceeds JavaScript `Number.MAX_SAFE_INTEGER` (`2^53 - 1`) and is serialized as `string` in JSON APIs (noting Phase 5 `T5.0` supports `serial`/`int`, `bigserial`/`bigint`, or `uuid`).
  - **Prepared Local Hub Sandbox (`omnipos-hub-pg` on port `5434` & `bai07-ddl.sql` scaffold):**
    - Started `omnipos-hub-pg` (`127.0.0.1:5434`), created scratch schema `lab07_omnipos` with `stores` (`1..5`), set default `search_path` for `postgres` to `lab07_omnipos, public`, and created UTF-8 no-BOM scaffold `omnipos-finledger-hub/docs/design/bai07-ddl.sql`.
- **Remaining:**
  - **Phase 4 (`T4.2` & `T4.3` — shifted by 1 day to Monday 2026-11-02 at office):** Learner writes the 4 `CREATE TABLE` + `CREATE INDEX` statements (`PART A`) and 3 test cases (`PART B`: `B1 -> 23514`, `B2 -> 23505`, `B3 -> pass`) in `omnipos-finledger-hub/docs/design/bai07-ddl.sql`; executor runs `T4.2` preflight + `T4.3` transactional replay.
  - **Phase 5 (`phase-05-tich-hop-m1-sau-ddl.md`):** Executor integrates M1 Prisma models, 301-wallet seed, naive vs locked service scaffold with `TODO(Đạt)`, and `checks/m1/`.
  - **Phase 6 (`phase-06-slot-cua-dat-va-nghiem-thu-m1.md`):** Learner records naive before-metrics, fills `TODO(Đạt)` locking lines (`ORDER BY id FOR UPDATE`, `FOR UPDATE SKIP LOCKED`), completes 8-question review, and runs after-metrics acceptance checks.
- **Urgency:** normal (learner scheduled continuation at office tomorrow, 2026-11-02; 1-day schedule shift acknowledged).

## Scope and guardrails
- **Workspace:** `D:/study/advance-be` (with nested git-ignored repo `D:/study/advance-be/omnipos-finledger-hub`).
- **In scope:**
  - Guiding the learner to complete `omnipos-finledger-hub/docs/design/bai07-ddl.sql` (`Phase 4 T4.2`), running `T4.3` replay verification, and executing Phases 5–6 of `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`.
- **Out of scope:**
  - Writing column names, types, `CHECK`, `UNIQUE`, `FK`, or indexes of `wallets`, `ledger_entries`, `voucher_campaigns`, `voucher_slots` on behalf of the learner in Phase 4 (`phase-04-gate-bai-07-ddl-cua-dat.md`).
  - Writing the learner's Phase 6 `TODO(Đạt)` locking lines on their behalf.
- **Constraints:**
  - Follow `AGENTS.md` Apprenticeship Rules (walkthrough -> hands-on challenge, visual tables/ASCII diagrams over blank SVG blocks in terminal, live DBX verification).
- **Safety boundaries:**
  - Never output files outside `D:/study/advance-be`.
  - Never commit credentials into tracked files.
  - Never run destructive commands against the learner's port `5433` PostgreSQL container; `omnipos-finledger-hub` uses `omnipos-hub-pg` on `127.0.0.1:5434`.

## Current state
- **Branch:** `main`
- **HEAD:** `637e2f0fdae0ced6f993447a2595c091e891ab0c` (prior to the `ak-git` commit & push executed immediately after writing this handoff)
- **Working tree:** dirty (being committed and pushed to `origin/main` via `ak-git` in this turn so the office machine receives all Lesson 06/07 artifacts and handoffs)
- **Changed files:**
  - `M README.md`
  - `M TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md`
  - `M plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/shell-tail.html`
  - `M reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`
- **Untracked files:**
  - `?? labs/lesson-06-redis/`
  - `?? plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render-dark/`
  - `?? plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render/`
  - `?? plans/261031-1651-lesson-06-redis-teacher-guide/`
  - `?? plans/handoffs/lesson-06-redis-guide-ready-20261101.md`
  - `?? plans/handoffs/lesson-07-completed-start-phase4-ddl-20261101-1100.md`
  - `?? plans/handoffs/cluster1-phase4-q1-q7-reviewed-ready-for-ddl-20261101-1305.md`
  - `?? plans/journals/261101-lesson-06-redis-guide-build.md`
  - `?? plans/reports/research-261030-flashsale-concurrency-load-testing-tools-and-repos.md`
  - `?? reports/advanced_backend/lesson_06_redis_teacher_guide.html`
  - `?? reports/obsidian-skills-evaluation.md`
  - `?? reports/obsidian-skills-repomix.md`
  - `?? reports/paseo-vs-orca-evaluation.md`
- **Intentional local modifications:** yes (committed and pushed to `origin/main`; nested `omnipos-finledger-hub/` remains git-ignored by `advance-be`).

## Decisions and rationale
- **Decision:** Shift Cluster 1 Phase B (`Phase 4 -> Phase 6`) schedule by 1 day to Monday 2026-11-02 (office session) per learner request (`phase-04-gate-bai-07-ddl-cua-dat.md` T4.2 schedule shift option).
  - **Rationale:** Learner completed `Q1–Q7` conceptual review today and chose to write `bai07-ddl.sql` at the office tomorrow.
  - **Alternative rejected:** Rushing DDL authoring before leaving home or reducing M1 scope.
  - **Reference:** `plans/261027-0907-cluster1-m0-m1-implementation/phase-04-gate-bai-07-ddl-cua-dat.md`.
- **Decision:** Use Markdown tables + ASCII diagrams instead of inline `svg` code blocks when explaining multi-column constraints in terminal chat.
  - **Rationale:** Learner reported (`[Image #1]`) that the `svg` block rendered as blank whitespace in their terminal client, whereas Markdown tables and ASCII diagrams rendered cleanly.
  - **Alternative rejected:** Emitting `svg` fenced blocks in terminal chat responses.
  - **Reference:** User feedback in session on `Q5` diagram rendering.
- **Decision:** Pre-configure `lab07_omnipos` scratch schema with `stores(1..5)` and `ALTER ROLE postgres SET search_path TO lab07_omnipos, public` on `omnipos-hub-pg` (`127.0.0.1:5434`) while learner drafts `bai07-ddl.sql`, then drop `lab07_omnipos` and reset `search_path` before running `T4.3` replay.
  - **Rationale:** Lets the learner open DBX on port `5434` and immediately test `CREATE TABLE` statements with `REFERENCES stores(id)` without boilerplate setup per tab.
  - **Alternative rejected:** Requiring manual `SET search_path` in every DBX query tab.
  - **Reference:** `omnipos-finledger-hub/docs/design/bai07-ddl-worksheet.md`.

## Work performed
- Reviewed learner's answers to `Q1–Q7` of `omnipos-finledger-hub/docs/design/bai07-ddl-worksheet.md` and clarified `Q2/Q3` (`TREASURY` vs `STORE` wallet + `UNIQUE(store_id)` + `CHECK`), `Q4` (`transfer_id` grouping generated by app/transaction), `Q5` (`UNIQUE (campaign_id, store_id)` behavior on `(1, 1)` vs `(1, 2)` and `NULL <> NULL`), `Q6` (`CREATE INDEX` on `ledger_entries` foreign key), and `Q7` (`bigint` vs `Number.MAX_SAFE_INTEGER`).
- Started `omnipos-hub-pg` container (`docker compose up -d` / `docker start omnipos-hub-pg` in `omnipos-finledger-hub`) on `127.0.0.1:5434`, initialized scratch schema `lab07_omnipos` with `stores` (`1..5`), and set `ALTER ROLE postgres SET search_path TO lab07_omnipos, public`.
- Created UTF-8 no-BOM scaffold file `omnipos-finledger-hub/docs/design/bai07-ddl.sql` containing only `-- PART A: DDL` and `-- PART B: TESTS` section headers and table/test comments (verified `head -c 3 | od -An -tx1` = `2d 2d 20`).
- Executed secret/credential scan across modified and untracked files prior to staging and pushing via `ak-git`.
- 0 redactions applied.

## Verification
| Check | Command | Outcome | When |
| :--- | :--- | :--- | :--- |
| Hub Postgres container & `lab07_omnipos.stores` setup | `docker start omnipos-hub-pg && ... psql -U postgres -d omnipos_hub -c "SELECT * FROM stores;"` | PASS (`omnipos-hub-pg` healthy on `127.0.0.1:5434`, `5` rows in `lab07_omnipos.stores`) | 2026-11-01 |
| `bai07-ddl.sql` UTF-8 no-BOM check | `head -c 3 omnipos-finledger-hub/docs/design/bai07-ddl.sql \| od -An -tx1` | PASS (`2d 2d 20`, no `ef bb bf` BOM) | 2026-11-01 |
| Secret scan on modified/untracked files | `grep -rnI -iE "(api[_-]?key\|secret[_-]?key\|private[_-]?key\|BEGIN RSA\|ghp_\|sk-)" ...` | PASS (0 secrets found) | 2026-11-01 |

Not run:
- Phase 4 `T4.2` preflight & `T4.3` DDL replay (`OUT/bai07-replay.txt`): Waiting for learner to write the 4 `CREATE TABLE` statements and 3 test queries in `omnipos-finledger-hub/docs/design/bai07-ddl.sql` at the office tomorrow.

## Open risks and blockers
- Type: blocker. Owner: Đạt. Impact: Phase 5 (`phase-05-tich-hop-m1-sau-ddl.md`) awaits learner completion of `omnipos-finledger-hub/docs/design/bai07-ddl.sql` (`T4.2` + `T4.3`).
- Type: risk. Owner: successor agent / Đạt. Impact: Because `omnipos-finledger-hub/` is git-ignored inside `advance-be` (it is its own standalone repo `NgoDat2003/omnipos-finledger-hub`), on the office machine tomorrow the agent should ensure `omnipos-finledger-hub` is present (or `git pull` inside `omnipos-finledger-hub`), start `omnipos-hub-pg` on port `5434`, and recreate the `lab07_omnipos` scratch schema + `docs/design/bai07-ddl.sql` scaffold if not yet present on the office machine.

## Exact next actions
1. **First safe step** — On the office PC tomorrow after `git pull origin main` in `advance-be`, verify `omnipos-finledger-hub` exists (clone `https://github.com/NgoDat2003/omnipos-finledger-hub.git` if missing), start `omnipos-hub-pg` on port `5434`, and initialize the `lab07_omnipos` scratch schema for DBX:
   ```bash
   cd omnipos-finledger-hub && docker compose up -d
   docker exec -i omnipos-hub-pg psql -U postgres -d omnipos_hub -c "CREATE SCHEMA IF NOT EXISTS lab07_omnipos; SET search_path TO lab07_omnipos; CREATE TABLE IF NOT EXISTS stores (id serial PRIMARY KEY, name text NOT NULL); TRUNCATE stores RESTART IDENTITY CASCADE; INSERT INTO stores(name) SELECT 'Quán ' || g FROM generate_series(1, 5) g; ALTER ROLE postgres SET search_path TO lab07_omnipos, public;"
   ```
2. Ensure the UTF-8 no-BOM scaffold `omnipos-finledger-hub/docs/design/bai07-ddl.sql` exists with `-- PART A: DDL` (`wallets`, `ledger_entries`, `voucher_campaigns`, `voucher_slots`) and `-- PART B: TESTS` (`B1 -> 23514`, `B2 -> 23505`, `B3 -> pass`), and guide the learner as they write and test the SQL in DBX (`localhost:5434`, DB `omnipos_hub`, `postgres`/`postgres`).
3. Before running Phase 4 `T4.3` replay (`plans/261027-0907-cluster1-m0-m1-implementation/phase-04-gate-bai-07-ddl-cua-dat.md`), clean up the scratch schema on `omnipos-hub-pg`:
   ```bash
   docker exec -i omnipos-hub-pg psql -U postgres -d omnipos_hub -c "ALTER ROLE postgres RESET search_path; DROP SCHEMA IF EXISTS lab07_omnipos CASCADE;"
   ```
   Then run `T4.2` preflight and `T4.3` transactional replay verification.
4. Once `T4.3` passes (`B1 -> 23514`, `B2 -> 23505`, `B3 -> pass`), immediately execute **Phase 5 (`phase-05-tich-hop-m1-sau-ddl.md`)** and guide the learner through **Phase 6 (`phase-06-slot-cua-dat-va-nghiem-thu-m1.md`)**.

## Source pointers
- `omnipos-finledger-hub/docs/design/bai07-ddl-worksheet.md`
- `omnipos-finledger-hub/docs/design/bai07-ddl.sql`
- `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/phase-04-gate-bai-07-ddl-cua-dat.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/phase-05-tich-hop-m1-sau-ddl.md`
- `plans/261027-0907-cluster1-m0-m1-implementation/phase-06-slot-cua-dat-va-nghiem-thu-m1.md`
- `reports/advanced_backend/lesson_06_redis_teacher_guide.html`
- `labs/lesson-06-redis/`
- `plans/handoffs/lesson-06-redis-guide-ready-20261101.md`
