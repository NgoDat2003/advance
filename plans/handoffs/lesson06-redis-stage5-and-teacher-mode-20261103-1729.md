---
handoff-version: 1
generated: 2026-11-03T10:29:00Z
generator: ak:handoff@2.0.0
focus: "continue Lesson 06 Redis from Stage 5 (List BLMOVE & ZSET) on home PC using Live Coding AI Teacher Mode"
workspace: D:/học/advance-be
branch: main
head: 848a379
---

# HANDOFF: Lesson 06 Redis Stage 5 Continuation & Live Teacher Home PC Setup

## Mission and current status
Focus: "continue Lesson 06 Redis from Stage 5 (List BLMOVE & ZSET) on home PC using Live Coding AI Teacher Mode".
Done:
- Shipped and merged **Live Coding AI Teacher Mode** (`PR #2`, commit `50082b3`) onto `main`, including `.teacher/config.json` (`defaultLevel: 2` Dual-Axis Mid-Level), `scripts/teacher.mjs`, `scripts/teacher.test.mjs` (`7/7` tests green), `.claude/commands/thay.md`, `.claude/skills/thay/SKILL.md`, `docs/live-coding-teacher-guide.md`, and byte-identical `## Live Coding Pair-Teacher Protocol` sections in `AGENTS.md` and `CLAUDE.md`.
- Completed interactive walkthrough of **Lesson 06 — Redis Mastery (`reports/advanced_backend/lesson_06_redis_teacher_guide.html`) Stages 1 through 4**:
  - **Stage 1 (`KEYS` vs `SCAN`)**: Covered why `KEYS` blocks Redis single-threaded loop vs `SCAN` cursor iteration + duplicate-return caveat requiring idempotent consumers.
  - **Stage 2 (Object Encodings & Hash vs JSON)**: Mastered encoding thresholds (`String <= 44B embstr` vs `>= 45B raw`; `Hash <= 512 fields & <= 64B values listpack` vs `hashtable` 4.6x RAM jump; `Set 512/128`, `ZSet 128`), JSON read-modify-write Lost Update vs atomic Hash ops, `ioredis` syntax (`hset`, `hget`, `hmget`, `hgetall`, `hincrby`, `hdel`, `expire`), and the real-world **Hash + per-line JSON** F&B cart pattern (`CF01` challenge passed).
  - **Stage 3 (TTL Expiry, Eviction & Distributed Lock Intro)**: Mastered Passive vs Active expiry (`10 hz`, `20 keys`, `>10%` loop, `25% CPU` cap), Cache Avalanche mitigation via TTL jitter (`86400 + random`), eviction policies (`noeviction`, `allkeys-lru` `66/300` hot eviction trap vs `allkeys-lfu` `300/300`, `volatile-*`), dual-Redis split (`redis-cache` vs `redis-core`), when Postgres `FOR UPDATE` (`55P03`) suffices vs when Redis front-shield / `SET key token EX 10 NX` lock is needed, and why late `DEL` deletes another worker's lock unless owner token is checked via Lua.
  - **Stage 4 (Persistence: RDB, AOF & Hybrid)**: Mastered `SAVE` (blocks main `while` loop) vs `BGSAVE` (`fork` child process), `RDB` snapshot loss window vs `AOF everysec` (OS page cache survives container kill; physical power loss risks <= 1s), Redis 7 `Hybrid` preamble, and 2-layer Defense-in-Depth (`Redis idempotency` + PostgreSQL `UNIQUE (idempotency_key)` `23505`).
Remaining:
- **Lesson 06 Stage 5 (`#chang-5`)**: Currently paused right at the **Stage 5 Part 1/2 check question** (`List` kitchen queue with `LPUSH` + `BLMOVE` into `q:processing` + `LREM` ack), followed by **Stage 5 Part 2/2** (`Set` `SADD`/`SINTER` & `Sorted Set` `ZADD`/`ZINCRBY`/`ZRANGE ... REV WITHSCORES` best-sellers leaderboard).
- **Lesson 06 Stages 6–9**: Stage 6 (Transactions `MULTI/EXEC`/`WATCH` vs Lua atomicity & Pipelines), Stage 7 (Replication & Cluster slots), Stage 8–9 (OmniPOS M2 mapping & capstone labs).
Urgency: normal (resuming tonight on Home PC).

## Scope and guardrails
Workspace: `.` (`advance-be`, with optional sibling junction `../omnipos-finledger-hub`)
In scope:
- Interactive tutoring of `reports/advanced_backend/lesson_06_redis_teacher_guide.html` (starting at Stage 5) following `## Live Coding Pair-Teacher Protocol` in `AGENTS.md`.
- Hands-on Redis exercises on `advance-be-redis` (`127.0.0.1:6379`) and upcoming Milestone M2 preparation.
Out of scope:
- Modifying unrelated untracked files (`plans/reports/lightpanda-pack/`, `plans/reports/research-261103-0905-lightpanda-browser-evaluation.md`).
- Writing to any global system directory (`~`, `$HOME`, `%USERPROFILE%`, `AppData`).
Constraints:
- **Pedagogical format (mandatory)**: Default **Level 2 (`middle`, 2-Axis)**. Keep prose concise (<= 5–7 lines per point), always lead with the **real-world purpose** before introducing acronyms, explain new CLI/Lua/SQL syntax in plain Vietnamese, use short TypeScript (`ioredis`) snippets + step-by-step state tables (`Step | Who | Command | Cache | DB`), and ask **1 small check question per turn**.
- **4-Rung Safety Net**: Support learner live coding (10–25 line interview-sized functions) with `Nấc 0` (3-step flow + library syntax cheat-sheet) through `Nấc 3` (`/thay mau` model implementation + interview takeaway).
Safety boundaries:
- Public repository (`NgoDat2003/advance`): never commit credentials, internal IPs, local usernames, or private company identifiers.
- Respect `K-01` port boundary (`3000, 3001, 5433, 6379` forbidden inside `omnipos-finledger-hub`; `advance-be-redis` lab container uses `127.0.0.1:6379`).

## Current state
Branch: `main`
HEAD: `848a37994469649a9fe4b8a9416f99d12b6faf89`
Working tree: dirty (untracked research artifacts only; zero tracked modifications)
Changed files: none
Untracked files:
- `plans/reports/lightpanda-pack/` (from an earlier unrelated session — leave untouched)
- `plans/reports/research-261103-0905-lightpanda-browser-evaluation.md` (from an earlier unrelated session — leave untouched)
- `plans/reports/research-261103-0938-live-coding-ai-teacher-companion.md` (authored in this session)
Intentional local modifications: yes (untracked research artifacts preserved intentionally).

## Decisions and rationale
- **Project-local Teacher config (`defaultLevel: 2`) committed to Git (`main`)** — Rationale: avoids polluting global `~/.agentkit` (keeping work repositories at full speed `codingLevel: -1`) while syncing automatically to the Home PC via `git pull` with zero manual global reconfiguration — Alternative rejected: installing external `xDido/chiron` globally (writes to `~/.chiron/` and lacks `junior|middle|senior` levels) — Reference: `PR #2`, `.teacher/config.json`, `AGENTS.md`.
- **Git-clean session overrides via `.teacher/state.local.json`** — Rationale: switching between `Level 2` (`middle`) and `Level 3` (`senior` Mock Interviewer) via `/thay level 3` or `node scripts/teacher.mjs level 3` never dirties `git status` — Alternative rejected: mutating tracked `.teacher/config.json` on every toggle — Reference: `scripts/teacher.mjs`.
- **Concept-first interactive walkthrough before optional end-of-session lab** — Rationale: learner prefers skimming/skipping dry bash lab blocks and solidifying real-world mental models + `ioredis` TypeScript syntax interactively one micro-step per turn — Alternative rejected: copy-pasting multi-terminal bash benchmark scripts mid-lesson — Reference: `AGENTS.md` (`## Live Coding Pair-Teacher Protocol`).

## Work performed
- Researched live-coding AI mentor tools and saved `plans/reports/research-261103-0938-live-coding-ai-teacher-companion.md`.
- Implemented, tested, reviewed, and merged **Live Coding AI Teacher Mode** (`Issue #1`, `PR #2` -> `50082b3` on `main`):
  - `.teacher/config.json` (`defaultLevel: 2`, `defaultRung: 0`, `quietMs: 5000`, `timeoutMs: 0`)
  - `scripts/teacher.mjs` & `scripts/teacher.test.mjs` (`status`, `level`, `rung`/`hint`, `diff`, `watch-once`)
  - `.claude/commands/thay.md`, `.claude/skills/thay/SKILL.md`, `docs/live-coding-teacher-guide.md`, `AGENTS.md`, `CLAUDE.md`
- Started `advance-be-redis` Docker container (`127.0.0.1:6379`) and verified `SET lock:order:99 ... EX 2 NX` expiry + Lua owner-checked unlock (`EVAL`) live against Redis `7.2.3`.
- Taught Lesson 06 Stages 1–4 interactively and introduced Stage 5 Part 1/2 (`List` `LPUSH` + `BLMOVE` + `LREM`).
0 redactions applied.

## Verification
| Check | Command | Outcome | When |
|---|---|---|---|
| Teacher CLI & Watcher TDD suite + `AGENTS.md`/`CLAUDE.md` byte-parity | `node --test scripts/teacher.test.mjs` | `7 passed, 0 failed` | Prior to merging `PR #2` (`50082b3`) |
| Live Teacher CLI status on `main` | `node scripts/teacher.mjs status` | `Level: 2 (middle) [repo default]`, `Nấc 0`, Hub connected | Active session on `main` |
| Live Redis 7.2.3 lock expiry & Lua safe-unlock demo | `docker exec advance-be-redis redis-cli ...` | Verified `req-A` expiry -> `req-B` acquisition -> `req-A` Lua unlock returns `0` (`req-B` preserved) | Stage 3 walkthrough |

Not run:
- Stage 5–9 lab scripts (`labs/lesson-06-redis/05-*.sh`..`09-*.sh`) — deferred intentionally until Stage 5–9 walkthrough reaches hands-on checkpoints.

## Open risks and blockers
- Type: risk. Owner: learner (Home PC setup). Impact: Home PC must run `git pull` on `advance-be` (and merge this handoff PR if not yet merged) so `AGENTS.md`, `.teacher/config.json`, `/thay`, and `scripts/teacher.mjs` are present locally; if practicing live Redis commands in DBX, start Docker container via `sh labs/lesson-06-redis/00-containers.sh up main`.

## Exact next actions
1. **First safe step** — On the Home PC inside `advance-be`, run `git pull` and `node scripts/teacher.mjs status` to confirm `Level: 2 (middle)` and `/thay` are active (zero global config changes required; optional: run `/thay watch` when starting hands-on coding).
2. Resume **Lesson 06 — Chặng 5 (Nhịp 1/2: Hàng đợi Bếp bằng `List` / `BLMOVE`)** at the pending check question:
   - Given `LPUSH q:orders order_1` then `LPUSH q:orders order_2`, Kitchen A runs `BLMOVE q:orders q:processing RIGHT LEFT 5` (receiving `order_1`) and crashes during `phaTraSua(order_1)` before `LREM`: (1) where is `order_1` now, and (2) which order does Kitchen B receive on the next `BLMOVE`?
3. Cover **Chặng 5 (Nhịp 2/2)**: `Set` (`SADD` deduplication, `SINTER`) and `Sorted Set` (`ZADD`, `ZINCRBY`, `ZRANGE ... REV WITHSCORES` for OmniPOS `FR-M2-04` best-sellers leaderboard) with short `ioredis` TypeScript snippets.
4. Continue sequentially through **Chặng 6** (`Pipeline`, `MULTI/EXEC/WATCH` vs `Lua` atomic scripts — connecting back to the Stage 3 `EVAL` safe-unlock and Stage 2 per-line cart update) and **Chặng 7–9** (Replication/Cluster & OmniPOS M2 preparation).

## Source pointers
- `AGENTS.md` & `CLAUDE.md` (`## Live Coding Pair-Teacher Protocol`)
- `.teacher/config.json` & `scripts/teacher.mjs`
- `.claude/commands/thay.md` & `docs/live-coding-teacher-guide.md`
- `reports/advanced_backend/lesson_06_redis_teacher_guide.html` (`#chang-5` lines `1950-2394`, `#chang-6` lines `2396-2796`)
- `labs/lesson-06-redis/00-containers.sh`
- `plans/reports/research-261103-0938-live-coding-ai-teacher-companion.md`
- `https://github.com/NgoDat2003/advance/pull/2`
