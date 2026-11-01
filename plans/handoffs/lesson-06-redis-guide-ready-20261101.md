---
handoff-version: 1
generated: 2026-11-01T12:40:00+07:00
focus: "lên bài học cho bài tiếp theo như lộ trình (Bài 06 Redis, mở đầu Cụm 2)"
workspace: D:/study/advance-be
branch: main
---

# HANDOFF: Lesson 06 Redis teacher guide ready (Cluster 2 opener) — study after Cluster 1 Phase B

## What exists
- Guide: `reports/advanced_backend/lesson_06_redis_teacher_guide.html` (487 KB, single file, no rail, light/dark, `l06-*` storage keys).
  - Content: 46 slides in 9 stages + wrap-up, 36 quiz questions, 10 interview questions, cheat sheet, slide map with verdict chips (`Đúng trên Redis 7.2` / `Đúng một phần` / `Cần sửa`), and 9 widgets.
- Labs: `labs/lesson-06-redis/`.
  - One `.redis`/`.sh` file per stage, `lua/` (delay claim, lock release, fenced lock acquire + fenced write, token bucket, idempotency).
  - Tools: `00-containers.sh`, `00-seed.redis`, `check.sh`, `99-cleanup.sh`.
  - Homework and its checker: `hw-check.sh` + `hw-solution.mjs`; driver drill `driver-drill.ai-snippet.ts`; node-redis 6.3.0 pinned in `package.json`.
- Evidence and build: `plans/261031-1651-lesson-06-redis-teacher-guide/`.
  - Plan and verification: plan, contract, 100+ recorded runs with a sha256 manifest, verifier, negative tests, `runs/final-gate.txt`.
  - Code review: the ultra code-review verdict and its fix status.
- Every number in the guide comes from a run recorded on this machine on 31/10–01/11/2026 (Redis 7.2.3 in Docker).

## How to start (study day, after Phase B)
1. Start Docker Desktop. If `advance-be-redis` is stopped, run `docker start advance-be-redis`. Otherwise run `bash labs/lesson-06-redis/00-containers.sh up main`.
2. Seed the data: `grep -v '^#' labs/lesson-06-redis/00-seed.redis | docker exec -i advance-be-redis redis-cli`.
3. Check: `bash labs/lesson-06-redis/check.sh` should give rc 0, with ✔ on main rows and `–` on extras.
4. Open the guide and begin with `#cach-hoc`. Bring up extras only when a stage asks for them (`00-containers.sh up evict|persist|replica|cluster`, then `down` afterwards).

Rules the guide repeats:
- Connect to `127.0.0.1:6379`, never `localhost` (`::1` is refused).
- In Git Bash, prefix container paths with `MSYS_NO_PATHCONV=1` (or use the PowerShell / `winpty` forms).
- DBX `ADVANCE_BE_REDIS` is for browsing keys and single commands. It cannot run multi-line blocks.
- In two-terminal steps, paste only the `BLPOP` line first, then follow the time column of the walk table.

## Time budget
About 295 core minutes (stages 0–9 plus wrap-up), +70 optional, and the homework (45 min) in the evening. Stage 8 (distributed lock capstone, 40 min) is the heaviest.

## Deviations and corrections worth knowing
- **R03:** during a busy Lua script, client B must run from `01-block.B.sh`, because Redis answers B's markers with `BUSY`.
- **R35:** `WAIT` only counts writes from its own connection. In separate `docker exec` calls it returned 1 even while the replica was cut off.
- **Docker VM clock:** it runs fast and gets stepped back, so the lock-lab margins were widened. Stage 8 uses this as evidence for the Redlock critique.
- **Ultra code review:** 30 validated findings (2 Critical, 8 Important, 20 Minor), all fixed. The main ones:
  - The homework H5 check could pass a plain-`DEL` release.
  - The fencing token is now issued in the same Lua script as the lock.
  - Active expiry in 7.2.3 is a cursor scan, not random sampling.
  - Learner keys survive a container recreate.
- **Size budget:** raised to 520 KB rather than cutting teaching prose.

## State left on the machine
- Only `advance-be-redis` runs (redis:7.2.3, `127.0.0.1:6379`, seeded). Extras are removed. Port 6380 is untouched and left for the OmniPOS hub. Company containers are unchanged (fingerprint compare rc 0).
- The DBX connection `ADVANCE_BE_REDIS` was added (127.0.0.1:6379, db 0).
- Nothing is committed; everything is on `main` (README, TONG_QUAN row 06, the lesson-07 `#tiep-theo` link, and the new files).

## Next steps
1. Finish Cluster 1 Phase B (Phase 4 `bai07-ddl.sql` → Phases 5–6; see `lesson-07-completed-start-phase4-ddl-20261101-1100.md`).
2. Study Lesson 06 with this guide, then do the homework (seat `A34_S012C` on `FA634`) and run `hw-check.sh`.
3. Continue Cluster 2: K2 Bài 04 Rate Limiting, then OmniPOS M2 (Redis 6380, `@Idempotent()`, menu cache-aside, best-seller ZSET, Lua token bucket) and Boss Challenge 2 on `quan-ly-hop-dong`.
