---
handoff-version: 1
generated: 2026-11-02T04:20:00Z
generator: ak:handoff@2.0.0
focus: "tổng kết lại đi ship lên tối dùng pc học"
workspace: D:/học/advance-be
branch: main
head: e04bb94f818d6e905d977c6ce6c269c1b3e5b7a9
---

# HANDOFF: Cluster 1 (M0+M1) Completed & Resume Lesson 06 Redis Stage 2 on Home PC

## Mission and current status
Focus: "tổng kết lại đi ship lên tối dùng pc học".
- **Desired outcome:** Complete Cluster 1 (`M0 + M1`: Phase 4 DDL Gate, Phase 5 M1 Integration, Phase 6 Pessimistic Locking & Acceptance, tag `m1` pushed to `NgoDat2003/omnipos-finledger-hub`), link `omnipos-finledger-hub` as a sibling workspace for clean IDE Git diffs, and begin Cluster 2 Phase A (**Lesson 06 — Redis Mastery**) through Stage 1 and the 4-Layer Data/Cache Architecture (`Browser/TanStack Query -> Redis -> DB Buffer Pool -> DB Heap/Disk`), ready to resume at **Stage 2 (Object Encodings & Hash vs JSON)** tonight on the Home PC (`D:/study/advance-be`).
- **Done:**
  - **Cluster 1 Phase 4 (`docs/design/bai07-ddl.sql`):** Learner completed the 4-table DDL (`wallets`, `ledger_entries`, `voucher_campaigns`, `voucher_slots` + `idx_ledger_entries_wallet_id`) and 3 tests (`B1 -> 23514`, `B2 -> 23505`, `B3 -> pass`). Passed `T4.2` preflight and `T4.3` transactional replay with 0 unexpected errors and 0 leaked tables.
  - **Cluster 1 Phase 5 (`M1 Integration`):** Translated `PART A` to `apps/api/prisma/schema.prisma` and `migrations/20261102021536_m1_wallet_ledger_voucher/migration.sql`; verified `Already in sync` and 0 diff on 4-way constraint comparison (`CHECK`, `INDEX`, `FK`, `COLUMN`). Implemented `seed-wallets.ts` (`301 wallets, 600 entries`, `sum(balance) = 0`), `WalletsService` (`transferNaive` + `transferLocked`), `VouchersService` (`createCampaign`, `getCampaign`, `claim`), `checks/sql/m1-reconcile.sql`, and `checks/m1/*.sh` (including `MSYS2_ENV_CONV_EXCL="BURST_PATH"` and relative ASCII `OUT`/`JAR` paths in `checks/lib/common.sh` for Windows/MSYS2 compatibility). Verified `V1–V9` and pushed (`a7cce74`).
  - **Cluster 1 Phase 6 (`M1 Locking & Acceptance`):** Learner filled `ORDER BY id ASC FOR UPDATE`, `fromRow.balance < amountBig`, `FOR UPDATE SKIP LOCKED`, and `slots.length === 0`, plus completed `docs/design/m1-review-checklist.md` (`8/8`). Verified `T6.3` (`overdraw.sh`: `5 × 201`, `25 × 409 INSUFFICIENT_FUNDS`, `reconcile = 0`), `T6.4` (`cross.sh`: `30 × 201`, `40P01_new = 0`), `T6.5` (`voucher.sh`: `10 × 201`, `20 × 409 SOLD_OUT`, `reclaim_again = 409 ALREADY_CLAIMED`), `T6.6` (`pg-locks-drill.sh`: `not_granted = 1`, `transfer = 201`), `T6.8` (`README.md` before/after table, `smoke.sh` 4/4 pass, commit `859c913`, tag `m1` pushed to `origin`). Learner chose to keep `NgoDat2003/omnipos-finledger-hub` **Private** for now (`T6.9`).
  - **Cross-Repository Workspace Setup:** Created sibling Directory Junction (`../omnipos-finledger-hub` <-> `omnipos-finledger-hub/`), `.vscode/settings.json` (`git.scanRepositories`), `advance-be-omnipos.code-workspace`, and cross-repo links in `AGENTS.md` / `CLAUDE.md`.
  - **Cluster 2 Phase A — Lesson 06 Redis Mastery (Stage 0, Stage 1 & 4-Layer Mental Model):** Started `advance-be-redis` (`redis:7.2.3`, `check.sh` 10/10 pass), connected DBX (`ADVANCE_BE_REDIS`), built and opened visual HTML diagram `reports/advanced_backend/4_layers_cache_overview.html` explaining the 4 data/cache layers (`1. Browser Cache / TanStack Query -> 2. Redis Server RAM -> 3. PostgreSQL Buffer Pool shared_buffers -> 4. PostgreSQL Heap/WAL Disk`), and provided the command glossary for Stage 1 and Stage 2.
- **Remaining:**
  - Walk through **Stage 2 (`Object Encodings & Hash vs JSON` + hands-on challenge `cf01`)** and **Stage 3 (`TTL Passive/Active Expiry & Eviction Policies`)** of `reports/advanced_backend/lesson_06_redis_teacher_guide.html` tonight on the Home PC.
  - Continue Stages 4–9 of Lesson 06 Redis Mastery, then proceed to Cluster 2 Phase B (`M2` Redis Cache-Aside, Distributed Lock, Idempotency & Rate Limiting on `omnipos-finledger-hub`).
- **Urgency:** normal (evening study session on Home PC).

## Scope and guardrails
- **Workspace:** `D:/học/advance-be` (Office PC) / `D:/study/advance-be` (Home PC), paired with sibling repository `../omnipos-finledger-hub` (`https://github.com/NgoDat2003/omnipos-finledger-hub.git`).
- **In scope:** Lesson 06 Redis Mastery guided teaching (`reports/advanced_backend/lesson_06_redis_teacher_guide.html`, `labs/lesson-06-redis/`), visual HTML aids under `reports/advanced_backend/`, and `omnipos-finledger-hub` Cluster 2 preparation.
- **Out of scope:** Switching `NgoDat2003/omnipos-finledger-hub` to public until explicitly requested by the learner.
- **Constraints:**
  - Follow `AGENTS.md` apprenticeship and pacing rules: **slow down**, explain every new Redis CLI command in plain Vietnamese before asking the learner to read or run it, use 50/50 guided fill-in-the-blank templates for coding exercises, and generate standalone HTML files (`reports/advanced_backend/*.html`) opened in the browser whenever complex visual diagrams are needed (since terminal Mermaid ASCII overflows horizontally and inline SVG does not render in the learner's terminal).
- **Safety boundaries:**
  - Project-local outputs only (`D:/học/advance-be` or `D:/study/advance-be`).
  - Never touch unrelated containers on port `5433` or company databases; `omnipos-hub-pg` stays on port `5434` and `advance-be-redis` (`redis:7.2.3`) stays on `127.0.0.1:6379`.

## Current state
- **Branch:** `main`
- **HEAD:** `e04bb94f818d6e905d977c6ce6c269c1b3e5b7a9` (prior to handoff commit; `omnipos-finledger-hub` is at `859c91326f3264b01f12d0075460a379805770fa`, tag `m1` pushed to `origin/main`).
- **Working tree:** Modified and untracked files staged and committed in the ship step immediately following this capture:
  - Changed files:
    - `AGENTS.md`
    - `CLAUDE.md`
    - `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`
    - `plans/261027-0907-cluster1-m0-m1-implementation/phase-04-gate-bai-07-ddl-cua-dat.md`
    - `plans/261027-0907-cluster1-m0-m1-implementation/phase-05-tich-hop-m1-sau-ddl.md`
    - `plans/261027-0907-cluster1-m0-m1-implementation/phase-06-slot-cua-dat-va-nghiem-thu-m1.md`
  - Untracked files added:
    - `.vscode/settings.json`
    - `advance-be-omnipos.code-workspace`
    - `reports/advanced_backend/4_layers_cache_overview.html`
    - `plans/reports/research-261102-0858-desloppify-evaluation.html`
    - `plans/reports/research-261102-0858-desloppify-evaluation.md`
    - `plans/reports/desloppify-pack/`
    - `plans/handoffs/cluster1-m1-done-lesson06-redis-stage2-20261102-1120.md`
- **Intentional local modifications:** yes.

## Decisions and rationale
| Decision | Rationale | Alternative rejected | Reference |
| :--- | :--- | :--- | :--- |
| **50/50 Guided Co-Pilot Blueprint (`__1__..__6__` & `__A__..__D__`)** | Learner works in a PM/Tech Lead role and requested 50% pre-filled scaffolding so they focus on core architectural decisions (`CHECK`, `UNIQUE`, `INDEX`, `FOR UPDATE`, `SKIP LOCKED`) rather than boilerplate syntax. | 100% blank file (causes syntax friction) or 100% AI-written solution (loses interview muscle memory). | `omnipos-finledger-hub/docs/design/bai07-ddl.sql`, `wallets.service.ts`, `vouchers.service.ts` |
| **Relative ASCII `OUT="checks/out"` & `MSYS2_ENV_CONV_EXCL="BURST_PATH"`** | Windows `curl.exe` fails to open cookie jars under non-ASCII `/d/học/...` absolute paths, and MSYS2 mangles `BURST_PATH="/wallets/transfers"` into `C:/Program Files/Git/wallets/transfers` when spawning child shells via `xargs`. | Require `subst` virtual drive letter on Windows. | `omnipos-finledger-hub/checks/lib/common.sh`, `omnipos-finledger-hub/checks/lib/burst.sh` |
| **Sibling Directory Junction `../omnipos-finledger-hub` + `.code-workspace`** | Because `omnipos-finledger-hub/` is git-ignored inside `advance-be`, opening `advance-be` alone greyed out files in VS Code/Cursor. Linking `../omnipos-finledger-hub` as a sibling + multi-root workspace enables native Git diffs and branch switching. | Moving the directory while processes held open handles (`os error 32`). | `advance-be-omnipos.code-workspace`, `.vscode/settings.json` |
| **Browser HTML Diagrams + Command Glossary First for Lesson 06** | Terminal Mermaid ASCII overflows horizontally and inline SVG is not rendered in the learner's terminal; dense Redis CLI commands in the HTML guide need a plain-Vietnamese glossary before reading each stage. | Inline Mermaid/SVG in terminal or raw CLI blocks without command definitions. | `reports/advanced_backend/4_layers_cache_overview.html` |

## Work performed
- Executed `git pull` on `advance-be` (`305 files changed, 35791 insertions(+)`) and verified `omnipos-finledger-hub`.
- Started Docker Desktop, `omnipos-hub-pg` (`127.0.0.1:5434`), and `advance-be-redis` (`127.0.0.1:6379`); configured `OMNIPOS_HUB_5434` and `ADVANCE_BE_REDIS` connections in DBX.
- Guided learner through `omnipos-finledger-hub/docs/design/bai07-ddl.sql` and verified `T4.2` & `T4.3` (`23514=1`, `23505=1`, `OTHER_ERR=0`).
- Executed Phase 5 (`T5.0–T5.11`): Prisma schema + migration (`20261102021536_m1_wallet_ledger_voucher`), 4-way constraint match (`diff = 0`), 301-wallet seed (`sum(balance) = 0`), `wallets` & `vouchers` modules, `m1-reconcile.sql`, `checks/m1/*.sh`, `V1–V9` checks, and commit `a7cce74`.
- Guided learner through Phase 6 (`T6.0–T6.8`): recorded `m1-before` (`9 × 201` lost updates, `reconcile = 2`), verified learner's `ORDER BY id ASC FOR UPDATE` and `FOR UPDATE SKIP LOCKED` implementation (`overdraw`: `5 × 201 / 25 × 409`, `cross`: `30 × 201 / 40P01_new = 0`, `voucher`: `10 × 201 / 20 × 409 SOLD_OUT` + `409 ALREADY_CLAIMED`, `reconcile = 0`), ran `T6.6` `pg_locks` drill (`not_granted = 1`, `transfer = 201`), completed `docs/design/m1-review-checklist.md` (`8/8`), updated `omnipos-finledger-hub/README.md`, committed (`859c913`), and pushed tag `m1` to `origin`.
- Started Lesson 06 Redis container (`bash labs/lesson-06-redis/00-containers.sh up main`), seeded `00-seed.redis`, verified `bash labs/lesson-06-redis/check.sh` (`10/10 ✔`), created `reports/advanced_backend/4_layers_cache_overview.html`, and walked through Stage 1 + Stage 2 command glossary.
- 0 redactions applied.

## Verification
| Check | Command | Outcome | When |
| :--- | :--- | :--- | :--- |
| **Phase 4 `T4.2` & `T4.3` Replay** | Transactional replay of `docs/design/bai07-ddl.sql` on `omnipos-hub-pg` | **PASS** (`T4.3_23514=1`, `T4.3_23505=1`, `T4.3_OTHER_ERR=0`, `T4.3_LEAKED_TABLES=0`) | 2026-11-02 |
| **Phase 5 `T5.2` 4-Way Constraint Diff** | `compare-constraints.sql` (`lab07_replay` vs `public`) + `prisma migrate dev` | **PASS** (`Already in sync`, `diff = 0`) | 2026-11-02 |
| **Phase 5 `T5.10` (`V1–V9`)** | Locked 501 probes + Naive `overdraw.sh 290 291` + `reconcile.sh` | **PASS** (`V1=1`, `V2=200`, `V3=0`, `V4=501`, `V5=501`, `V6=404`, `V7=19x201`, `V8=2`, `V9=0`) | 2026-11-02 |
| **Phase 6 `T6.3–T6.8` Final Suite** | `smoke.sh` + `checks/m1/run-all.sh` + `pg-locks-drill.sh` + `G1–G5` | **PASS** (`smoke 4/4`, `overdraw 5x201/25x409`, `cross 30x201/0 deadlock`, `voucher 10/10 + 409 ALREADY_CLAIMED`, `reconcile=0`, `not_granted=1`, `REMOTE_TAG_M1=1`) | 2026-11-02 |
| **Lesson 06 Redis Environment** | `bash labs/lesson-06-redis/check.sh` | **PASS** (`C01, C07–C15` all `✔` on `redis:7.2.3`) | 2026-11-02 |

- **Not run:**
  - `T6.9` (`gh repo edit --visibility public`): intentionally skipped because learner requested keeping `NgoDat2003/omnipos-finledger-hub` private for now.

## Open risks and blockers
- Type: risk. Owner: successor agent. Impact: On the Home PC (`D:/study/advance-be`), the sibling junction `../omnipos-finledger-hub` may not exist yet if `omnipos-finledger-hub` was only cloned inside `D:/study/advance-be/omnipos-finledger-hub` (or vice versa); run a 1-line check on the Home PC to pull `omnipos-finledger-hub` (`tag m1`) and create the junction if desired.
- Type: risk. Owner: successor agent. Impact: Learner is reading Stage 2 of `reports/advanced_backend/lesson_06_redis_teacher_guide.html`; do not rush ahead to Stage 3+ until the learner finishes reading Stage 2 and completes the short `cf01` encoding prediction check (`raw`, `listpack`, `hashtable`).

## Exact next actions
1. **First safe step** — On the Home PC (`D:/study/advance-be`), run `git pull origin main`, ensure `advance-be-redis` (`redis:7.2.3`) is running and seeded (`bash labs/lesson-06-redis/00-containers.sh up main && grep -v '^#' labs/lesson-06-redis/00-seed.redis | docker exec -i advance-be-redis redis-cli && bash labs/lesson-06-redis/check.sh`), and pull `omnipos-finledger-hub` (`git -C omnipos-finledger-hub pull --tags` or clone if absent, plus link `../omnipos-finledger-hub` junction if needed).
2. Open `reports/advanced_backend/lesson_06_redis_teacher_guide.html#chang-2` (and `reports/advanced_backend/4_layers_cache_overview.html` if needed) and review any questions the learner has after reading **Chặng 2 (Object Encodings: `int`/`embstr`/`raw`, `listpack` vs `hashtable`, and `Hash` vs `JSON String` race condition)**.
3. Guide the learner through the 3-item hands-on prediction at the end of Chặng 2 (`l06:my:menu:cf01:json` -> `raw`, `l06:my:menu:cf01` -> `listpack`, `l06:my:menu:cf01:full` -> `hashtable` because `desc > 64B`) in DBX (`ADVANCE_BE_REDIS` -> `Command line` tab, one command per line).
4. Proceed at a calm, glossary-first pace into **Chặng 3 (TTL Passive/Active Expiry & `maxmemory-policy` Eviction)** and **Chặng 4 (Persistence: RDB vs AOF vs Hybrid)**.

## Source pointers
- `plans/handoffs/cluster1-m1-done-lesson06-redis-stage2-20261102-1120.md`
- `reports/advanced_backend/4_layers_cache_overview.html`
- `reports/advanced_backend/lesson_06_redis_teacher_guide.html`
- `labs/lesson-06-redis/check.sh`
- `labs/lesson-06-redis/02-encodings.redis`
- `plans/261027-0907-cluster1-m0-m1-implementation/plan.md`
- `omnipos-finledger-hub/README.md`
- `omnipos-finledger-hub/docs/design/bai07-ddl.sql`
- `omnipos-finledger-hub/docs/design/m1-review-checklist.md`
