---
handoff-version: 1
generated: 2026-11-03T12:00:00+07:00
focus: "K2 Bài 04 Caching teacher guide & labs tinh gọn hoàn tất — sẵn sàng học sau Bài 06 Redis"
workspace: D:/học/advance-be (Office PC) / D:/study/advance-be (Home PC)
branch: main
---

# HANDOFF: K2 Bài 04 Caching teacher guide ready — study after Lesson 06 Redis

## What exists
- **Guide:** `reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html` (516 KB / 528,534 bytes ≤ 520 KB ceiling, single-column no-rail layout, light/dark toggle, `k2l04-*` storage keys).
  - Content: all 39 slides mapped once across 8 stages + wrap-up, 32 quiz questions (4/stage), 8 interview questions, decision matrix & cheat sheet, 39-slide map with verdict chips, and 9 interactive widgets (`w1`–`w9`). All CLI/SQL/redis-cli commands and recorded outputs are embedded inline in the single HTML file.
- **Labs (tinh gọn 26 file chạy thật):** `labs/k2-lesson-04-caching/` (0 `package.json`):
  - Tools & data (9): `00-containers.sh`, `00-seed.redis`, `05-counter-pg.sql`, `check.sh` (`C01`–`C10`), `99-cleanup.sh`, `hw-check.sh` (`H0`–`H8`), `traffic.tsv` (60 requests), `summary.awk`, `compare.awk`.
  - Homework & PR drill (3): `hw/token-bucket.lua` (8 blanks `__1__`..`__8__`), `hw/solution.lua`, `drill/rate-limit.guard.ai-snippet.ts` (7 deliberate review bugs for NestJS + `node-redis@6.3.0`).
  - Lua scripts mounted at `/lab/lua/` (11): `voucher-redeem.lua`, `rl-fixed.lua`, `rl-log.lua`, `rl-counter.lua`, `rl-leaky.lua`, `rl-token-interval.lua`, `rl-token-bucket.lua`, `leaky-offer.lua`, `flush-take.lua`, `delay-claim.lua`, `bloom.lua`.
  - PostgreSQL bench scripts (3): `pg/hot-row.pgbench`, `pg/spread.pgbench`, `pg/waits.sql`.
- **Plan & Final Gate:** `plans/261102-1332-k2-lesson-04-caching-teacher-guide/plan.md` & `runs/final-gate.txt` (10/10 gates PASS; ~230 intermediate build/ultra/snippet files cleaned).

## How to start (3 study sessions)
1. Ensure Docker Desktop is running with `quan-ly-hop-dong-postgres-1` up.
2. Start or verify the K2L04 main Redis container (`127.0.0.1:6381`, leaving L06 `6379` and OmniPOS M2 `6380` untouched):
   ```bash
   bash labs/k2-lesson-04-caching/00-containers.sh up main
   grep -vE '^[[:space:]]*(#|$)' labs/k2-lesson-04-caching/00-seed.redis | MSYS_NO_PATHCONV=1 docker exec -i advance-be-k2l04-redis redis-cli
   bash labs/k2-lesson-04-caching/check.sh
   ```
   `check.sh` must exit `0` (`✔` on `C01`, `C04`–`C10`; `–` on optional `C02` cluster and `C03` crash).
3. If switching machines (e.g., back to Home PC) where schema `k2l04_counter` does not yet exist in `advance_be_lab`, run the `#setup` section of `labs/k2-lesson-04-caching/05-counter-pg.sql` once via DBX (`ADVANCE_BE_LAB`) or `psql`.
4. Add DBX Redis connection `ADVANCE_BE_K2L04` (`127.0.0.1`, port `6381`, DB `0`) for inspecting keys (`k2l04:*`).
5. Open `reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html` and follow the 3-session split in `#cach-hoc`:
   - **Buổi 1 (~100 phút cốt lõi):** Chặng 1–3 (Redis 7.2 internals, Cluster slots (`up cluster` → `down cluster`), Race condition vs Lua, Fixed Window / Sliding Log / Sliding Window Counter).
   - **Buổi 2 (~95 phút cốt lõi):** Chặng 4–5 (Leaky Bucket vs Token Bucket, batching tokens & `429 Retry-After`, PostgreSQL hot-row lock contention vs Redis `HINCRBY` & Write-Behind (`up crash` → `down crash`)).
   - **Buổi 3 (~95 phút cốt lõi + 45 phút bài tập tối):** Chặng 6–8 (Unread Counts, Remote Message Pool `BLPOP` vs Replicated/Client-Side Caching, Delay Task ZSET+Lua, HyperLogLog, Bitmap, Bloom Filter tự dựng) → điền `hw/token-bucket.lua` + chấm bằng `HW_LUA=labs/k2-lesson-04-caching/hw/token-bucket.lua bash labs/k2-lesson-04-caching/hw-check.sh` + PR review drill.

## State left on the machine
- Only `advance-be-k2l04-redis` (`127.0.0.1:6381->6379/tcp`, `DBSIZE=2`, seeded) and `quan-ly-hop-dong-postgres-1` (`k2l04_counter.post_count` 1000 rows zeroed) are running for K2L04.
- Optional containers `advance-be-k2l04-cluster` and `advance-be-k2l04-crash` are removed.
- L06 (`6379`), OmniPOS M2 (`6380`), and all company schemas/databases are untouched.

## Next steps
1. Study **Lesson 06 Redis** (`reports/advanced_backend/lesson_06_redis_teacher_guide.html`) + its homework, then study **K2 Bài 04 Caching** across 3 sessions and pass `hw-check.sh`.
2. Implement **OmniPOS FinLedger Hub Milestone 2** (`../omnipos-finledger-hub`, Redis `6380`), applying `hw/token-bucket.lua` + `drill/rate-limit.guard.ai-snippet.ts` fixes into **FR-M2-05** (`POST /vouchers/:code/claim` Lua Token Bucket keyed by `storeId`, `429 + Retry-After`, fail-open/fail-closed per ADR-010).
3. Tackle **Boss Challenge 2.3** on `quan-ly-hop-dong`.
