=== FILE: plan.md ===
---
title: "Lesson 06 Redis teacher guide (redis-cli-first, Redis 7.2.3-measured)"
description: "Single-file Vietnamese teacher guide for Lesson 06 Redis (46 slides + 8 evidence blocks) backed by small .redis/.sh/.lua snippets the learner runs himself, every number traced to a recorded run."
status: pending
priority: P1
effort: 11.5h
branch: main
tags: [lesson-06, redis, teacher-guide, redis-cli, lua, distributed-lock, tdd]
blockedBy: []
blocks: []
created: 2026-10-31
---

# Lesson 06 — Redis teacher guide

## Overview

Build `reports/advanced_backend/lesson_06_redis_teacher_guide.html` on the lesson-07 single-column shell (no rail), so Đạt can study it on about 2026-11-02 in 4h45 of core time. Every experiment is a small plain-text snippet in `labs/lesson-06-redis/`: `.redis` files (redis-cli commands), `.sh` files (docker lifecycle and `redis-benchmark` lines) and `.lua` scripts. The learner runs one region at a time with a 20-line helper `r.sh`, or types the lines into two `docker exec -it … redis-cli` terminals for two-client experiments. The controller runs the same regions through the same helper, records the output verbatim in `runs/` with a SHA-256 manifest, and `verify/verify-guide.mjs` proves every command block, output excerpt and number traces to a recorded file. All Redis writes go to containers named `advance-be-redis*` on ports 6379/6381/6382/6383/7001; there is no Postgres write and no git step other than `git status`.

## Data flow

1. `00-setup.sh` creates or keeps the lab containers; `01-seed.redis` writes `l06:seed:*`; each stage region resets only its own `l06:s<N>:*` keys.
2. `r.sh` extracts a region, drops `#` lines, inserts `ECHO "@@L<n>"` markers, pipes into `redis-cli --no-raw` in the container and rewrites each marker into `127.0.0.1:6379> <source line n>`. `verify/run-lab.sh` = `r.sh` + header + SHA-256 manifest; `--ab` runs two files with a fixed delay and `merge-timeline.mjs` orders them by the server `TIME` replies.
3. `make-widget-data.cjs` derives `runs/data/wN.json`; delegates write fragments and widgets against the frozen contract; `assemble.mjs` builds the guide; `verify-guide.mjs`, `negative-tests.sh`, render-check and the ultra review gate it.

## Stage map (study day ≈ 2026-11-02, "Day 06")

| Stage | Slides | Core min | Optional | Lab files (regions in matrix) | Widget |
|---|---|---|---|---|---|
| 0 `#cach-hoc` | 1, 2, 3 | 15 | – | 00-setup.sh, 01-seed.redis, check.sh, r.sh | – |
| 1 Vì sao nhanh, đo thật | 4, 5, 10, 11, 12, 13, 14 | 35 | 10 (io-threads container) | 01-why-fast.redis, 01-block.A/B.redis, 01-bench.sh | W1 event-loop timeline |
| 2 Lưu trữ, encoding, câu hỏi slide 30 | 15, 16, 28, 29, 30, 31 | 30 | – | 02-encodings.redis, 02-lost-update.A/B.redis | W2 encoding converter |
| 3 Hết hạn key | 17, 18, 19, 20, 21 | 25 | – | 03-expiry.redis | W3 expiry sampling simulator |
| 4 Bộ nhớ đầy, eviction | 22, 23 | 25 | – | 04-eviction.sh (container `-evict`) | W4 eviction simulator |
| 5 Persistence, mất gì khi sập | 24, 25, 26, 27 | 25 | 10 (hybrid file inspect) | 05-persistence.sh (container `-persist`) | W5 loss-window timeline |
| 6 Cấu trúc dữ liệu + delay task | 32, 33, 34, 35, 36, 37 | 35 | 10 (SINTER 2×100k) | 06-structures.redis, 06-queue.A/B, 06-delay.A/B, lua/claim-due.lua | W6 two-poller lanes |
| 7 Big key, replica, slot/hashtag | 38, 6, 7, 8, 9, 39 | 30 | 15 (3-node MOVED, failover loss) | 07-bigkey.redis, 07-replica.sh, 07-cluster.redis, 07-cluster-3node.sh | W7 hash-slot calculator |
| 8 Khóa phân tán (capstone) | 40, 43 | 40 | 45 (homework, evening) | 08-lock.redis, 08-lock-del.A/B, 08-lock-token.A/B, lua/release.lua, lua/fenced-write.lua, hw-check.sh | W8 lock timeline |
| 9 Cầu nối OmniPOS M2 | 41, 42 | 25 | 20 (driver drill) | 09-bridge.redis, lua/token-bucket.lua, driver-drill/ai-snippet.ts | W9 token bucket |
| Wrap `#tham-khao` | 44, 45, 46 | – | – | – | – |
| **Total** | 46 slides, each once | **285** | **110** | | |

Slide 43 renders in `#bai-tap`; its SLIDES href points there. Stage 0 ends with a 5-line "Nhắc nhanh Bài 02" callout (SET NX PX, compare-and-delete, TTL jitter, eviction policy table) that links back to lesson 02 `#chang-5`/`#chang-6` instead of re-teaching.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract, baseline, smoke tests](phase-01-contract-baseline-smoke.md) | 0.75h | – | `contract.md` v1 frozen; `runs/00-fingerprint-before.txt`; `runs/00-smoke.txt` decides learner run method; `verify/source-claims.md` cites 7.2.3 source |
| 02 | [Tests first](phase-02-tests-first.md) | 1.25h | 01 | `check.sh` prints ✘ rows (not errors) before setup; `--runs` RED "missing run" on every row; `--selftest` and runner self-test GREEN |
| 03 | [Containers, seed, run helper](phase-03-containers-seed-helper.md) | 0.75h | 02 | `check.sh` all ✔; setup + seed re-run gives byte-identical `check.sh` output |
| 04 | [Experiments and recorded runs](phase-04-experiments-recorded-runs.md) | 3h | 03 | `--runs` GREEN or every deviation logged; manifest written; configs restored (C02 ✔) |
| 05 | [Widget data, homework check, driver claims](phase-05-widget-data-homework-driver.md) | 0.75h | 04 | `--data` GREEN; `hw-check.sh` solution all ✔, bad fixture ✘ on H3 only; `driver-claims.md` every row sourced |
| 06 | [Guide shell and assembler](phase-06-guide-shell-assembler.md) | 1h | 01, 04 (parallel with 07) | `assemble.mjs --allow-stubs` builds; V01–V04, V09, V10, V14 pass on stub build |
| 07 | [Stage fragments (3 delegates)](phase-07-stage-fragments.md) | 2h | 01, 05 | `--fragment` GREEN for all 9 stages; `node --check` all widgets |
| 08 | [Assemble, verify, render](phase-08-assemble-verify-render.md) | 0.75h | 06, 07 | full verify GREEN, negative tests all RED-as-designed, render-check clean light + dark |
| 09 | [Ultra code review and fixes](phase-09-ultra-review-fixes.md) | 0.75h | 08 | no open Critical/Important; affected checks re-run GREEN |
| 10 | [Docs, final gate, handoff](phase-10-docs-final-gate-handoff.md) | 0.5h | 09 | final gate table all pass; fingerprint after = before; handoff written |

## Expected-result matrix (frozen in `verify/expected.tsv` in phase 02)

Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`, – = no chip. "n" = whatever the run records; the regex asserts only shape or relation. Timings are labelled "đo trên máy bạn, phụ thuộc máy".

| ID | Run#region | Slide | Expected Redis 7.2.3 result | Chip |
|---|---|---|---|---|
| X01 | 01-why-fast#threads | 14 | `io-threads 1`, `io_threads_active:0`; `/proc/1/task/*/comm` = redis-server, bio_close_file, bio_aof, bio_lazy_free, jemalloc_bg_thd | 14 FIX |
| X02 | 01-block.timeline | 13 | B's `PING` sent ≈ +500 ms returns only after A's 2 s Lua loop ends (gap ≥ 1,000 ms); no BUSY error (below 5,000 ms threshold) | 13 PART |
| X03 | 01-why-fast#latency | 13 | `LATENCY LATEST` has a `command` event ≥ 1,000 ms; `SLOWLOG GET 1` shows EVAL with duration ≥ 1,000,000 µs | – |
| X04 | 01-bench#pipeline | 12 | GET `-P 16` rps ≥ 5× GET rps (controller saw ≈12×) | 12 PART |
| X05 | 01-bench#payload | 12 | SET `-d 10000` rps < SET `-d 3` rps | – |
| X06 | 01-bench#mget | 41 | MGET of 10 keys: keys/s (rps × 10) > GET rps | 41 OK |
| X07 | 02-encodings#string | 31 | `int` for `10`; `embstr` ≤ 44 bytes; `raw` at 45 bytes; `STRLEN` of a value containing `\x00` counts it | 31 OK |
| X08 | 02-encodings#thresholds | 16, 33, 34, 35 | hash 512 fields `listpack` → 513 `hashtable`; 65-byte field value → `hashtable`; set 512 ints `intset` → 513 `hashtable`; small string set `listpack`; zset 128 `listpack` → 129 `skiplist` | 16 OK; 33, 34, 35 PART |
| X09 | 02-encodings#slide30 | 30 | 4-field user: Hash `listpack` vs JSON `raw`, both `MEMORY USAGE` n bytes; C1 `HGET` 1 field, C2 `HINCRBY` in place, C3 `HGETALL` vs `GET` | 30 OK |
| X10 | 02-lost-update.timeline | 30 | JSON GET-modify-SET from A and B: final age = start + 1 (one update lost); `HINCRBY` from A and B: start + 2 | – |
| X11 | 03-expiry#passive | 18, 19 | `DEBUG SET-ACTIVE-EXPIRE 0`: 1,000 keys `PX 100` after 500 ms → `DBSIZE` still includes them, keyspace `expires=1000`; `GET` → nil and `expired_keys` +1; `lazyfree-lazy-expire no` | 18 OK, 19 PART |
| X12 | 03-expiry#active | 20 | active expiry back on: within ≤ 2 s `DBSIZE` returns to base, `expired_keys` +999 without any access | 20 PART |
| X13 | 03-expiry#curve | 20 | 10,000 keys `PX 200` sampled every 100 ms: non-increasing count reaching 0 within n ms | – |
| X14 | source-claims.md#expire | 20, 21 | 7.2.3 `src/expire.c`: 20 keys per loop at effort 1, loop repeats while stale > 10% (not 25%), slow cycle capped at 25% CPU; TTLs live in the `db->expires` dict, no ZSET | 21 FIX |
| X15 | 04-eviction#noeviction | 22, 23 | main `maxmemory-policy noeviction`; `-evict` (4 MB) write past limit → `OOM command not allowed`; `GET` still works | 23 PART |
| X16 | 04-eviction#allkeys-lru | 23 | hot 100 keys touched between fills: hot survivors n ≥ 80; `evicted_keys` > 0 | – |
| X17 | 04-eviction#allkeys-random | 23 | hot survivors < X16 hot survivors | – |
| X18 | 04-eviction#allkeys-lfu | 23 | hot keys read 20× survive n ≥ 80 even though touched before the second fill | – |
| X19 | 04-eviction#volatile-ttl | 23 | all no-TTL keys survive; survivors with TTL have the longest TTLs | – |
| X20 | 04-eviction#volatile-no-ttl | 23 | `volatile-lru` with no TTL keys → OOM, like noeviction | – |
| X21 | 05-persistence#none | 24 | `save ""`, `appendonly no`, kill -9 → `DBSIZE` 0 | – |
| X22 | 05-persistence#rdb-kill | 26 | `BGSAVE` OK, `rdb_last_fork_usec` n; 3 keys written after it missing after kill -9 | 26 OK |
| X23 | 05-persistence#rdb-graceful | 26 | `docker stop` (SIGTERM) → all keys survive (save on shutdown) | – |
| X24 | 05-persistence#aof-kill | 25 | `appendfsync everysec`, wait 2 s, kill -9 → all keys survive | 25 PART |
| X25 | 05-persistence#hybrid | 27 | `aof-use-rdb-preamble yes`; after `BGREWRITEAOF` `appendonlydir` holds `*.base.rdb` starting `REDIS`, `*.incr.aof`, manifest | 27 OK |
| X26 | 06-structures#counter | 31 | `redis-benchmark -c 20 -n 10000 INCR` → counter exactly 10000 | – |
| X27 | 06-queue.timeline | 32 | two `BRPOP` consumers get disjoint messages; a popped message is gone from the list; `LMOVE` keeps it in `processing` | 32 PART |
| X28 | 06-structures#cart | 33 | slide 33 commands: `HINCRBY` → 2, `HLEN` → 2, `HDEL` → 1, `HGETALL` pairs | – |
| X29 | 06-structures#set | 34 | `SADD` duplicate → 0; `SINTER` common followers n; (opt) `SINTER` 2×100k in SLOWLOG n µs | – |
| X30 | 06-structures#zset | 35 | `ZINCRBY` best-sellers, `ZREVRANGE 0 2 WITHSCORES` top 3 | – |
| X31 | 06-delay.naive.timeline | 37 | both pollers read `o1` from `ZRANGEBYSCORE`; only one `ZREM` returns 1 | 37 PART |
| X32 | 06-delay.lua.timeline | 37 | `claim-due.lua` from A and B: claimed sets disjoint, union = all due, future job untouched | – |
| X33 | 07-bigkey#del-unlink | 38 | 1M-field hash `MEMORY USAGE` n MB; `DEL` in SLOWLOG ≥ 50,000 µs; `UNLINK` < 1,000 µs; with `lazyfree-lazy-user-del yes` `DEL` < 1,000 µs | 38 OK |
| X34 | 07-bigkey#bigkeys | 38 | `redis-cli --bigkeys` names `l06:big:*` as biggest hash | – |
| X35 | 07-replica#async | 6 | replica paused: master `SET` OK; `WAIT 1 500` → 0; after unpause `WAIT 1 2000` → 1, replica `GET` = value; replica `SET` → `READONLY` | 6 PART |
| X36 | 07-cluster#keyslot | 9, 39, 42 | main → `cluster support disabled`; `-cluster` node 16384 slots assigned; `{34}` keys share a slot; untagged pair differs | 9 OK, 39 OK, 42 PART |
| X37 | 07-cluster#crossslot | 39 | `MSET` untagged → `CROSSSLOT`; with `{34}` → OK | – |
| X38 | 07-cluster-3node#moved (opt) | 8 | without `-c` → `MOVED <slot> <ip>:6379`; with `-c` → "Redirected to slot" | 8 OK |
| X39 | 08-lock-del.timeline | 40 | A's `PX 1000` lock expires during A's 1.5 s pause; B acquires; A's `DEL` → 1; B's `GET` → nil | 40 FIX |
| X40 | 08-lock-token.timeline | 40 | same timing with `release.lua`: A's release → 0; B's `GET` = B's token | – |
| X41 | 08-lock#fencing | 40 | `INCR` fence tokens n, n+1; `fenced-write.lua` accepts n+1, rejects n with `STALE_TOKEN` | – |
| X42 | 09-bridge#idem | 41 | first `SET … NX EX 86400` OK, duplicate nil, `SET … XX KEEPTTL` stores response, replay `GET` returns it, `TTL` > 0 | – |
| X43 | 09-bridge#token-bucket | 41 | 30 concurrent `EVALSHA` (`redis-benchmark -c 30 -n 30`), capacity 10, refill ≈0 → allowed = 10, denied = 20; denied reply carries retry_after_ms > 0 | – |
| X44 | hw-check | 43 | reference solution all ✔; plain-DEL fixture ✘ only on H3 | 43 OK |

Remaining chips (narrative only, frozen in contract §6): 4 OK, 5 PART (Memcached not measured; Redis threads measured in X01), 7 OK (Sentinel diagram, labelled "chưa đo trên máy"), 41 OK, 42 PART, 44 OK. Null chips (14 title/section pages): 1, 2, 3, 10, 11, 15, 17, 22, 24, 28, 29, 36, 45, 46.

## Acceptance criteria

1. The guide exists, is ≤ 360 KB, loads no external script, and only fonts come from Google Fonts (P08, V01, V10).
2. `SLIDES` covers 1–46 exactly once, every href resolves, and chips equal contract §6 / `expected.tsv` (P08, V04).
3. Each stage 1–9 has a story question, a diagram or `figure.slide-fig`, a measured table, a 30-second check, `dl.wwh`, a byte-exact `pre[data-cmd]`, a recorded `pre[data-run]`, a "Làm mẫu" callout, a `callout challenge` with PASS criteria, and 4 quiz items (P07, V05, V11, V12).
4. Every `pre[data-cmd]` equals its lab region byte for byte; every `pre[data-run]` line and every `b.m` number exists in a recorded run file whose SHA-256 matches `runs/MANIFEST.sha256` (P08, V05–V08).
5. Every `expected.tsv` row matches, or has a `verify/deviations.md` entry and changed narrative/chip, never edited data (P04).
6. `check.sh` shows only ✔: containers and flags, restored configs, seed present, only `l06:*` keys on main, nothing on 6380, non-lab containers unchanged (P03, P04, P10).
7. Setup + seed re-run produces byte-identical `check.sh` output (P03).
8. Storage keys are `l06-*` only; no rail; dark and light themes both work (P08, V09, V14).
9. render-check at 375/768/1440 in light and dark: 0 runtime errors, 0 horizontal overflow, 0 targets under 44 px (P08).
10. `hw-check.sh` passes the reference solution and fails the bad fixture on H3 only (P05).
11. No Critical or Important review finding stays open (P09).
12. README and TONG_QUAN row 06 link guide and labs; lesson 07 `#tiep-theo` links lesson 06 (one-line change); handoff exists (P10).
13. No branch, commit or push; `git status` lists only this plan's paths plus the three doc edits (P10).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| `127.0.0.1:6379` on the host has two listeners (`com.docker.backend` PID 30744 and `wslrelay` PID 8712, seen 2026-10-31); DBX may hit a different Redis | M×H | Phase 01 compares `run_id` read via DBX and via `docker exec`; if they differ, the DBX connection is not used for experiments and the guide says why. |
| redis-cli treats `#` lines as commands (`ERR unknown command '#'`, seen 2026-10-31) | H×L | `r.sh` drops `#` lines; the guide copy button copies only non-`#` lines. |
| Lua busy loop with `TIME` never ends or ends early | L×M | Use a counted loop, calibrated once to ≈2 s via SLOWLOG; stays under `busy-reply-threshold` 5000. |
| Eviction does not happen inside one Lua script (eviction runs before each command) | H×M | Fill with `redis-benchmark` custom commands (many separate commands), not one big script. |
| Recreating main container loses data | L×H | Phase 03 recreates only if `DBSIZE` = 0 or all keys match `l06:*`; otherwise stop and ask. |
| Config left changed (slowlog 0, lazyfree yes, active expire off, latency monitor) | M×M | Every region that changes config restores it as its last line; C02 checks; `99-cleanup.sh` restores again. |
| `host.docker.internal` unreachable for the replica | L×M | Fallback: network `advance-be-redis-net` with `docker network connect` for main and replica. |
| node-redis option shapes differ by major version | M×M | `driver-claims.md` cites the published README/docs for the version in `labs/lesson-02-caching/package.json`; no `node_modules` read. |
| Timing flakes in A/B runs | M×M | Fixed delays, 3 repeats, variance narrated. |

Rollback: `labs/lesson-06-redis/99-cleanup.sh` unlinks `l06:*` on main, restores config, removes optional containers, the persist volume and network. All files are new, so deleting them reverts them; the three doc edits quote their original lines in phase 10.

## Open questions for the user

None blocking. One confirmation: the 285-minute core sits near the top of the 4–5 h budget; if Đạt prefers 4 h, stage 9's measured bridge can move to the evening with the driver drill and homework without dropping content.

=== FILE: phase-01-contract-baseline-smoke.md ===
---
phase: 1
title: "Contract, baseline, smoke tests"
status: pending
priority: P1
effort: 0.75h
dependencies: []
---

## Goal
Freeze every name parallel work depends on, record the "before" fingerprint of the machine, and decide the learner run method from measured smoke tests.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/contract.md` (new, v1)
- `…/assembly/shell-css.part`, `shell-head.html`, `shell-tail.html`, `assemble.mjs` (copied from `plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/`, adapted in phase 06)
- `…/verify/fingerprint.sh` (new), `…/runs/00-fingerprint-before.txt`, `…/runs/00-smoke.txt`
- `…/verify/source-claims.md` (new)

## Tasks and steps
1. Copy the four lesson-07 assembly files unchanged (so the diff in phase 06 is visible).
2. Write `contract.md`:
   - §1 container registry: `advance-be-redis` (6379; `redis:7.2.3 redis-server --appendonly no --enable-debug-command local`; volume `advance-be-redis-data:/data`; bind `D:/study/advance-be/labs/lesson-06-redis:/lab:ro`), `advance-be-redis-replica` (6381; `--replicaof host.docker.internal 6379`, `--add-host host.docker.internal:host-gateway`), `advance-be-redis-evict` (6382; `--maxmemory 4mb --maxmemory-policy noeviction --save "" --appendonly no`), `advance-be-redis-persist` (6383; volume `advance-be-redis-persist-data`; recreated per region), `advance-be-redis-cluster` (7001; `--cluster-enabled yes`, all slots via `CLUSTER ADDSLOTSRANGE 0 16383`), optional `advance-be-redis-io`, `advance-be-redis-c1..c3` on network `advance-be-redis-net` (no host ports). 6380 forbidden.
   - §2 keys `l06:seed:*`, `l06:s1:*` … `l06:s9:*`, `l06:hw:*`; a region resets only its own keys.
   - §3 file format: Vietnamese header (purpose, slides, how to run); regions `# #region <id> · <tiêu đề> (slide N)` … `# #endregion`; an expected error is the region's last line; client-side pause = `BLPOP l06:sleep:<x> <s>` (server stays free); two-client markers `ECHO "A1 <mô tả>"` + `TIME`; config changes restored on the region's last line.
   - §4 run ids `runs/<stem>.<region>.txt`, two-client `.A.txt|.B.txt|.timeline.txt`; `data-run`, `data-cmd="<file>#<region>"`; widget data `run-w1…w9`.
   - §5 learner workflow (from step 4). §6 slide → stage → chip → anchor (FIX/PART carry `id="sl-NN"`).
   - §7 fragment format, CSS (lesson-07 classes + `.tl`, `.slots`, `.bars`, `.bucket`), widget helpers, storage keys `l06-c<N>-<slug>`, `l06-warmup`, `l06-theme`, `l06-hw-*`, `l06-drill-*`.
3. `fingerprint.sh`: prints `docker ps -a --format '{{.Names}}|{{.ID}}|{{.Status}}|{{.Ports}}'` for names not matching `^advance-be-redis`, `netstat -ano | grep -c ':6380 .*LISTENING'`, `docker network ls`, and `docker volume ls -q | wc -l`. Status column is reduced to `Up`/`Exited` so uptime does not create diffs.
4. Smoke tests into `runs/00-smoke.txt` (key `l06:smoke`, unlinked at the end):
   - `printf '# x\nPING\n' | docker exec -i advance-be-redis redis-cli --no-raw` (expect the `#` error, confirms the strip rule);
   - `--no-raw` piped output matches interactive formatting (`(integer) 1`, `(nil)`);
   - `BLPOP l06:sleep:x 0.2` returns `(nil)` after ≈200 ms;
   - DBX: in console `ADVANCE_BE_REDIS` run `INFO server`, compare `run_id` with `docker exec … redis-cli INFO server`; try a 2-line input `SET l06:smoke 1` / `GET l06:smoke`; try `DEBUG HELP` (expect refusal because debug is local-only once phase 03 enables it).
   - Decision rule written into contract §5: primary = `r.sh` for whole regions + two Git Bash/PowerShell terminals with `docker exec -it advance-be-redis redis-cli` for two-client steps; DBX = key browser and one-line commands only if `run_id` matches and single commands work; fallback if DBX fails = redis-cli only.
5. `source-claims.md`: for 7.2.3 on GitHub (`redis/redis` tag `7.2.3`), quote with file:line the expire-cycle constants (`ACTIVE_EXPIRE_CYCLE_KEYS_PER_LOOP`, acceptable stale, slow time percent), `db->expires` dict type, eviction `evictionPoolPopulate` sampling, `lazyfree` thresholds, `io-threads` default, and the hash-slot CRC16 (`keyHashSlot`). Any claim not found is tagged `[UNVERIFIED]` and the guide must not state it.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| fingerprint runs read-only | file written, no container state change | `bash verify/fingerprint.sh > runs/00-fingerprint-before.txt` |
| 6380 free | `0` line in fingerprint | `grep -c '6380' runs/00-fingerprint-before.txt` shows the count row = 0 |
| contract complete | §1–§7 present; 46 rows in §6 | `grep -c '^| [0-9]' assembly/contract.md` ≥ 46 |
| smoke decision recorded | §5 names primary + fallback | `grep -n 'fallback' assembly/contract.md` |

## Verification
`bash verify/fingerprint.sh | diff - runs/00-fingerprint-before.txt` → no output (idempotent read).

## Risks and rollback
DBX smoke may need the GUI; if the MCP tool cannot run Redis commands, the controller records "DBX chưa kiểm được" and the guide uses redis-cli only. Rollback: delete the new files.

=== FILE: phase-02-tests-first.md ===
---
phase: 2
title: "Tests first: check, expected matrix, verifier, runner self-test"
status: pending
priority: P1
effort: 1.25h
dependencies: [1]
---

## Goal
Write every checker before the lab, runs and HTML they check, and prove each catches drift.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/labs/lesson-06-redis/check.sh` (new)
- `…/plans/261031-1651-lesson-06-redis-teacher-guide/verify/expected.tsv` (new; columns `id run slides regex claim chip status`)
- `…/verify/verify-guide.mjs` (copied from lesson 07, adapted)
- `…/verify/run-lab.sh`, `…/verify/merge-timeline.mjs` (adapted / rewritten)
- `…/verify/selftest-runner.sh`, `…/verify/fixtures/` (new: `quote.redis`, `mini-guide.html`, `mini-runs/`)
- `…/verify/negative-tests.sh` (copied, adapted)
- `…/verify/deviations.md` (new, empty table)

## Tasks and steps
1. `check.sh` (read-only, Vietnamese labels, prints `ma | ✔/✘ | chi tiết`, never errors on missing pieces):
   - C01 containers `advance-be-redis`, `-replica`, `-evict`, `-cluster` exist, running, with contract flags (`docker inspect --format '{{.Config.Cmd}}'`).
   - C02 main config restored: `slowlog-log-slower-than 10000`, `latency-monitor-threshold 0`, `lazyfree-lazy-user-del no`, `maxmemory 0`, `maxmemory-policy noeviction`, `appendonly no`, `enable-debug-command local`.
   - C03 seed present: `l06:seed:user:1` hash 4 fields, `l06:seed:user:1:json` string, `l06:seed:k1…k10`.
   - C04 main `DBSIZE` = count of `redis-cli --scan --pattern 'l06:*'`.
   - C05 nothing listens on 6380.
   - C06 `verify/fingerprint.sh` output equals `runs/00-fingerprint-before.txt` (non-lab containers unchanged).
   - C07 `-evict` `maxmemory 4194304`; C08 replica `master_link_status:up`; C09 cluster `cluster_slots_assigned:16384`.
2. `expected.tsv`: one row per matrix row X01–X44 with a regex on the run file, `status=expect`.
3. `verify-guide.mjs` adaptation (paths → lesson 06 guide, labs, runs):
   - V04 slides 1–46 once, chips = contract §6; V05 `pre[data-cmd]` = region between `# #region`/`# #endregion` (whole file for `.lua`/`.ts`);
   - V08 run header `# chạy lúc DD/MM/YYYY HH:MM +0700 · <container> (cổng <port>) · redis_version:7.2.3`, port ≠ 6380, guide label date = header date, SHA-256 = `runs/MANIFEST.sha256` (data never edited);
   - V09 `l06-` only; V12 acceptance-3 parts per stage; V13 `run-wN` valid JSON with existing `sources`; V15 slide images exist under `assets/6_Redis/`;
   - `--runs` fails a `status=deviation` row with no `deviations.md` entry.
4. `run-lab.sh` = `r.sh` (phase 03) + header + append SHA-256 to manifest; `--ab A B delayB` runs A in background, B after the delay, then `merge-timeline.mjs` sorts marker blocks by the `TIME` seconds+µs reply and prints ms offsets from the first marker.
5. `selftest-runner.sh`: pipes `fixtures/quote.redis` (quoted values, a one-line `EVAL` with `'` and `"`, an expected error last) through `r.sh` and asserts every `127.0.0.1:6379>` line equals its source line, in order.
6. `negative-tests.sh` cases (each must exit non-zero with the code):
   a) one-char change inside `data-cmd` → V05; b) fake number in `b.m` → V07; c) `data-store="l07-x"` → V09; d) slide 21 removed from SLIDES → V04; e) external `<script src>` → V10; f) wrong run file for X02 → `X02`; g) fake number in `w4.json` → `--data`; h) run header port 6380 → V08; i) one byte edited in a run file → V08 manifest; j) `status=deviation` without log → `--runs`; k) `check.sh` with a copied fingerprint file altered → C06 ✘; l) `check.sh` while `slowlog-log-slower-than` is 0 (set, checked, restored under `trap`) → C02 ✘.
   Until the guide exists, a–e run against `fixtures/mini-guide.html`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| check before setup | ✘ rows for C01, C03, C07–C09; exit 1; no stack trace | `bash labs/lesson-06-redis/check.sh` |
| runs RED | "missing run" for X01–X44 | `node verify/verify-guide.mjs --runs` |
| verifier self-test | V05/V07 caught on fixture | `node verify/verify-guide.mjs --selftest` |
| runner self-test | all command lines equal source (needs main container; it is up) | `bash verify/selftest-runner.sh` |
| negative cases on fixture | a–e, k RED as designed | `bash verify/negative-tests.sh --fixture` |
| syntax | no error | `node --check verify/verify-guide.mjs && bash -n labs/lesson-06-redis/check.sh` |

## Verification
The commands above; record their outputs in `runs/02-red.txt` (not part of the manifest).

## Risks and rollback
Case l writes config on our own main container only, restored by `trap … EXIT`; C02 re-run confirms. Rollback: delete the new files.

=== FILE: phase-03-containers-seed-helper.md ===
---
phase: 3
title: "Containers, seed, run helper"
status: pending
priority: P1
effort: 0.75h
dependencies: [2]
---

## Goal
Create the lab environment idempotently and the single helper the learner and controller share.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/labs/lesson-06-redis/00-setup.sh`, `01-seed.redis`, `r.sh`, `99-cleanup.sh` (new)
- `…/plans/261031-1651-lesson-06-redis-teacher-guide/runs/00-setup.txt`, `00-setup.rerun.txt`, `01-seed.txt`, `03-check.txt`, `03-check.rerun.txt`

## Tasks and steps
1. `00-setup.sh` (bash, `MSYS_NO_PATHCONV=1`, Vietnamese comments):
   - Guard: abort if any target name already exists with a non-`advance-be-redis` prefix collision or if port 6380 appears in any command.
   - Main: if `advance-be-redis` already has the contract §1 Cmd and mounts, print "giữ nguyên"; else check `DBSIZE` and `--scan` (abort and ask if any non-`l06:*` key exists), then `docker rm -f advance-be-redis` and `docker run` with the contract §1 flags.
   - Replica, evict, cluster: same keep-or-recreate rule; cluster runs `CLUSTER ADDSLOTSRANGE 0 16383` only if `cluster_slots_assigned:0`. Wait for `PONG` (max 20 s each); end with `docker ps --filter name=advance-be-redis`.
2. `01-seed.redis`: `UNLINK` then `HSET`/`SET`/`RPUSH` so a rerun produces the same state.
3. `r.sh <file> [region] [--ct <container>]`: default container from file prefix (`04-` → `-evict`, `07-cluster` → `-cluster`, else main); for `.redis` extract region, drop `#` lines, add markers, pipe to `docker exec -i <ct> redis-cli --no-raw`, rewrite markers; for `.sh` extract region and run it with `bash` (each line is a plain docker/redis-cli command the learner can also paste in PowerShell). ≤ 30 lines.
4. `99-cleanup.sh`: main `--scan --pattern 'l06:*'` piped to `UNLINK`; `CONFIG SET` restore of all C02 values and `DEBUG SET-ACTIVE-EXPIRE 1`; `docker rm -f` of `-persist`, `-io`, `-c1..c3`; `docker volume rm advance-be-redis-persist-data`; `docker network rm advance-be-redis-net`. Keeps main (lesson 02 lab 6 uses it), replica, evict, cluster unless `--all`.
5. Run: setup → seed → check; rerun setup → seed → check; diff.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| check after setup | all ✔ (C01–C09) | `bash labs/lesson-06-redis/check.sh > runs/03-check.txt` |
| setup idempotent | second run prints "giữ nguyên" for all 4; container IDs unchanged | `bash 00-setup.sh > runs/00-setup.rerun.txt; diff <(docker ps -q --filter name=advance-be-redis) …` |
| seed idempotent | `diff runs/03-check.txt runs/03-check.rerun.txt` empty | as above after re-seed |
| bind mount | `/lab/01-seed.redis` visible | `docker exec advance-be-redis ls /lab` |
| debug local only | `DEBUG HELP` works via `docker exec`; refused from DBX (record) | manual + `runs/00-smoke.txt` addendum |
| non-lab untouched | C06 ✔ | `check.sh` |

## Verification
`bash labs/lesson-06-redis/check.sh && bash verify/selftest-runner.sh`.

## Risks and rollback
Abort path protects unexpected data. Rollback: `bash 99-cleanup.sh --all`, then recreate the original main with `docker run -d --name advance-be-redis -p 6379:6379 redis:7.2.3 redis-server --appendonly no` (evidence §5 command).

=== FILE: phase-04-experiments-recorded-runs.md ===
---
phase: 4
title: "Experiments and recorded runs"
status: pending
priority: P1
effort: 3h
dependencies: [3]
---

## Goal
Write the stage snippet files and record every region so all X01–X44 rows are GREEN or logged deviations. Runs are serial; the controller does all of them.

## Files to create/modify (owner: controller)
`D:/study/advance-be/labs/lesson-06-redis/`: every file named in the stage map (`01-…` to `09-…` `.redis`/`.sh`, A/B pairs as `<stem>.A.redis`/`<stem>.B.redis`) plus `lua/busy.lua`, `lua/claim-due.lua`, `lua/release.lua`, `lua/fenced-write.lua`, `lua/token-bucket.lua`.
Plan folder: `runs/*.txt`, `runs/MANIFEST.sha256`, `runs/cheat-complexity.txt`, `verify/record-all.sh`, `verify/deviations.md`.

## Tasks and steps (one region at a time: write, run, check its row, move on)
1. Stage 1: `threads` (`CONFIG GET io-threads`, `INFO threads`/`INFO server` grep via `.sh` line, `cat /proc/1/task/*/comm`); `busy.lua` = counted Lua loop calibrated to ≈2 s; A: marker, `TIME`, `EVAL` busy, `TIME`; B (delay 0.5 s): marker, `TIME`, `PING`, `TIME`; `latency` region sets `latency-monitor-threshold 100`, reads `LATENCY LATEST`, `SLOWLOG GET 1`, restores 0. `01-bench.sh`: `redis-benchmark -q -n 100000 -t get` with and without `-P 16`; `-t set -d 3` vs `-d 10000`; `MGET l06:seed:k1 … k10` vs `GET l06:seed:k1` custom commands. Optional `io` region starts `advance-be-redis-io` with `--io-threads 4 --io-threads-do-reads yes`, benchmarks inside it with `-c 50 --threads 4`, prints `io_threads_active`, removes it.
2. Stage 2: `string` (int/embstr/raw boundary 44/45, binary `\x00`), `thresholds` (Lua builders for 512/513 fields, 64/65-byte value, 512/513 ints, 128/129 zset; `OBJECT ENCODING` after each), `slide30` (user as Hash and JSON; `MEMORY USAGE`; C1/C2/C3 commands); lost-update A/B with `BLPOP` pauses forcing interleaving.
3. Stage 3: `passive` (`DEBUG SET-ACTIVE-EXPIRE 0`, Lua creates 1,000 `PX 100` keys, pause 0.5 s, `INFO keyspace`, `DBSIZE`, `GET`, `INFO stats` grep expired, `CONFIG GET lazyfree-lazy-expire`), `active` (re-enable, pause 2 s, `DBSIZE`), `curve` (10,000 keys `PX 200`; 20× `DBSIZE` + `TIME` with `BLPOP` 0.1). Never `SCAN` in these regions (it would expire keys passively).
4. Stage 4 on `-evict`, each region: `FLUSHALL` (own container), `CONFIG SET maxmemory-policy <p>`, create 100 hot keys + fill with `redis-benchmark -n 3000 -r 1000000 SET l06:s4:cold:__rand_int__ <1 KB value>`, touch hot keys (`-n 2000 -r 100 GET l06:s4:hot:__rand_int__`; LFU region reads them 20×), second fill, then count survivors with a Lua `EXISTS` loop over hot ids, `INFO stats` `evicted_keys`. `volatile-ttl`: half with `EX 100…900` spread; `volatile-no-ttl`: no TTLs, `volatile-lru` → OOM.
5. Stage 5 on `-persist`, each region recreates the container (`docker rm -f`, `docker volume rm`, `docker run …` with region flags), waits for PONG, writes `l06:s5:a1…a5`, `BGSAVE` + `LASTSAVE` + `INFO persistence`, writes `b1…b3`, then `docker kill -s KILL` or `docker stop`, `docker start`, `DBSIZE`, `MGET`. `hybrid`: `appendonly yes`, `BGREWRITEAOF`, `ls -l /data/appendonlydir`, `head -c 5` of the base file, `cat` manifest.
6. Stage 6: `counter` (`redis-benchmark -c 20 -n 10000 INCR l06:s6:cnt` then `GET`); `cart` (slide 33 commands verbatim with `cart:{u1}` under `l06:s6:`); `set` (likes, `SINTER`; optional 2×100k); `zset` (best-sellers `ZINCRBY`, `ZREVRANGE`, encoding at 129); queue A/B (two `BRPOP`, producer `LPUSH`, then `LMOVE … RIGHT LEFT` into `processing`); delay A/B regions `naive` (`ZRANGEBYSCORE … LIMIT 0 1`, pause, `ZREM`) and `lua` (`EVALSHA` of `claim-due.lua` with `TIME` inside the script).
7. Stage 7: `del-unlink` (Lua builds a 1M-field hash twice; `CONFIG SET slowlog-log-slower-than 0`; `SLOWLOG RESET`; `DEL`; rebuild; `UNLINK`; `INFO memory` `lazyfree_pending_objects`; `lazyfree-lazy-user-del yes` + `DEL`; restore both configs; `SLOWLOG GET 5`); `bigkeys` (`.sh` line `redis-cli --bigkeys`). `07-replica.sh`: `link`, `async` (`docker pause`/`unpause`, `WAIT`), `readonly`, optional `failover-loss` (pause replica, write, kill main, unpause, `REPLICAOF NO ONE` on replica, show missing key, then restore: `docker start advance-be-redis`, replica `REPLICAOF host.docker.internal 6379`, wait `master_link_status:up`). `07-cluster.redis`: `keyslot` (also run `CLUSTER KEYSLOT` once on main for the disabled error), `crossslot`. Optional `07-cluster-3node.sh` with `docker network create advance-be-redis-net`, three nodes, IPs from `docker inspect`, `redis-cli --cluster create … --cluster-replicas 0 --cluster-yes`, MOVED with and without `-c`, then remove.
8. Stage 8: `08-lock-del` A/B (A `SET l06:s8:lock:seat tokA NX PX 1000`, pause 1.5 s, `DEL`; B at +1.2 s `SET … tokB NX PX 5000`, pause, `GET`); `08-lock-token` same with `EVALSHA release.lua`; `08-lock.redis#fencing` (`INCR l06:s8:fence`, `fenced-write.lua` writing `l06:s8:seat:FA634:A34_S012C` hash only when token > stored).
9. Stage 9: `idem` region; `token-bucket` region (`SCRIPT LOAD`, then `.sh` line `redis-benchmark -c 30 -n 30 EVALSHA <sha> 1 l06:s9:tb:store:42 10 0.001`, then `HGETALL l06:s9:tb:store:42:stats`).
10. `runs/cheat-complexity.txt`: `COMMAND DOCS GET MGET SET HGET HGETALL KEYS SCAN SINTER ZADD ZRANGEBYSCORE DEL UNLINK LPUSH BRPOP` (read-only; feeds the cheat sheet).
11. `record-all.sh` reruns every region in order (A/B three times; the third is kept, variance noted) and rewrites the manifest. A measurement that contradicts a slide or an expected row: keep the run, set the row to `deviation`, add a `deviations.md` entry, change chip/narrative later; never edit run text.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| per row | regex matches | `node verify/verify-guide.mjs --runs --only X<NN>` after each region |
| all rows | GREEN or logged deviations | `node verify/verify-guide.mjs --runs` |
| configs restored | C02 ✔ after the whole pass | `bash labs/lesson-06-redis/check.sh` |
| region rerun idempotent | same verdicts on second run of 02, 06, 08 regions | `bash verify/record-all.sh --only 02,06,08 --dry-compare` |
| manifest | every run hashed | `sha256sum -c runs/MANIFEST.sha256` |
| non-lab untouched | C05, C06 ✔ | `check.sh` |
| keys namespaced | C04 ✔ | `check.sh` |

## Verification
`node verify/verify-guide.mjs --runs && bash labs/lesson-06-redis/check.sh && sha256sum -c runs/MANIFEST.sha256`.

## Risks and rollback
Kill/pause only target `advance-be-redis*`; every docker line in the lab files is grepped for the prefix (`grep -nE 'docker (kill|stop|rm|pause|start)' labs/lesson-06-redis/*.sh | grep -v advance-be-redis` → empty). The failover region always ends with the restore steps and C08 must be ✔ afterwards. Rollback: `99-cleanup.sh`, delete run files.

=== FILE: phase-05-widget-data-homework-driver.md ===
---
phase: 5
title: "Widget data, homework self-check, driver claims"
status: pending
priority: P1
effort: 0.75h
dependencies: [4]
---

## Goal
Turn recorded runs into widget JSON, build the homework self-check, and source every driver-drill claim.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/verify/make-widget-data.cjs` (adapted), `runs/data/w1.json … w9.json`
- `D:/study/advance-be/labs/lesson-06-redis/hw-check.sh`, `labs/lesson-06-redis/hw/README.txt` (learner workspace note, never touched by setup/cleanup)
- `…/verify/hw-solution/seat-release.lua`, `…/verify/hw-bad/seat-release.lua`, `runs/hw-check.solution.txt`, `runs/hw-check.bad.txt`
- `D:/study/advance-be/labs/lesson-06-redis/driver-drill/ai-snippet.ts` (review-only file with 7 seeded mistakes), `…/verify/driver-claims.md`

## Tasks and steps
1. Widget data: W1 A/B offsets + bench rps; W2 thresholds from `CONFIG GET` lines + recorded encodings; W3 `curve` points; W4 survivors per policy; W5 per-mode keys before/after; W6 naive/lua lanes; W7 `[key, slot]` pairs; W8 lock-del/token/fencing steps; W9 allowed/denied + parameters. Each file has `sources: [run files]`.
2. `hw-check.sh [--release <file>]` (default `labs/lesson-06-redis/hw/seat-release.lua`): starts two background `redis-cli` requests R1/R2 that each try `SET l06:hw:lock:FA634:A34_S012C <id> NX PX 3000`, book with `HSETNX l06:hw:booking:FA634 A34_S012C <id>` only on OK, then release with the learner's script. Checks H1 exactly one OK; H2 booking owner = winner; H3 a stale release by the loser after re-acquire by a third id returns 0 and keeps the lock; H4 lock has a TTL > 0 while held; H5 key gone after the winner's release.
3. `driver-drill/ai-snippet.ts` (node-redis, chosen because `labs/lesson-02-caching/package.json` already pins `redis`; no new `package.json`): `KEYS` in a request path, `SET` without TTL, lock released with `DEL`, `GET`→`+1`→`SET` counter, `HGETALL` on a big hash, 10 sequential `await get` instead of `mGet`/pipeline, no `client.on('error')` and default offline queue. Each mistake maps to a recorded run in the guide (e.g. KEYS → X03 blocking, DEL → X39).
4. `driver-claims.md`: for each fix (option shape for `SET` NX/PX, `mGet`, `multi`/pipelining, `scanIterator`, `disableOfflineQueue`, `socket.reconnectStrategy`, `eval`/`evalSha` call shape) cite the published README or docs page for the pinned major version (GitHub `redis/node-redis` tag or unpkg URL). Unsourced claims are cut.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| data traced | every number in wN.json found in its sources | `node verify/verify-guide.mjs --data` |
| homework solution | H1–H5 ✔ | copy `verify/hw-solution/seat-release.lua` to `labs/lesson-06-redis/hw/.ref/`, then `bash labs/lesson-06-redis/hw-check.sh --release /lab/hw/.ref/seat-release.lua > runs/hw-check.solution.txt` |
| homework bad fixture | ✘ only on H3 | same with `hw-bad` |
| hw-check repeatable | same output twice | run twice, `diff` |
| driver claims | every row has a URL | `grep -c 'https://' verify/driver-claims.md` ≥ rows |

## Verification
`node verify/verify-guide.mjs --data && bash labs/lesson-06-redis/hw-check.sh --release <solution> | grep -c ✔` = 5.

## Risks and rollback
`hw-check.sh` needs the release script inside the container; because `/lab` is a read-only bind of the lab folder, the controller copies the reference into `labs/lesson-06-redis/hw/.ref/` only for the test run and deletes it after. Rollback: delete files.

=== FILE: phase-06-guide-shell-assembler.md ===
---
phase: 6
title: "Guide shell and assembler"
status: pending
priority: P1
effort: 1h
dependencies: [1, 4]
---

## Goal
Adapt the lesson-07 shell and assembler to lesson 06 and write the controller-owned sections.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/shell-head.html`, `shell-tail.html`, `shell-css.part`, `assemble.mjs`
- Output: `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html`

## Tasks and steps
1. `assemble.mjs`: `LABS` → `labs/lesson-06-redis`, `OUT` → lesson 06 guide; `<!--@CMD file#region@-->` → `<div class="code"><button class="copy">…</button><pre data-cmd="…"><code>…</code></pre></div>` with region markers `# #region`/`# #endregion`; whole-file for `.lua`/`.ts`; inline `runs/data/wN.json` as `<script type="application/json" id="run-wN">`; quiz JSON for 9 stages.
2. `shell-head.html`: hero; `#cach-hoc` (time-plan table from the stage map, prep: Docker Desktop on, `00-setup.sh`, seed, `check.sh`; how to run a region with `r.sh`; two-terminal layout for A/B; DBX note from contract §5; warm-up; "Nhắc nhanh Bài 02" callout).
3. `shell-tail.html` sections:
   - `#bai-tap`: slide 43, homework spec, PASS = `hw-check.sh` 5 ✔.
   - `#driver-drill`: snippet via `@CMD`, 7 findings in `details.fold`, each with its proving run and sourced fix.
   - `#phong-van`: 10 `EXAM` questions (threads, encodings, expiry, eviction for cache vs store, RDB/AOF loss, delay claim, big key delete, CROSSSLOT, lock + fencing + Redlock, token bucket atomicity).
   - `#cheat-sheet` (complexity from `runs/cheat-complexity.txt`), `#ban-do-slide`, `#tham-khao` (slide 44 links, redis.io, 7.2.3 source links; slides 45–46).
   - `#tiep-theo`: OmniPOS M2 FR-M2-02..05 on hub Redis 6380 (text only, 128 MB budget), Boss Challenge 2 (`executeImportExport`, `terminateContract`), then K2 Bài 04 Rate Limiting.
4. Script: `GUIDE_DATA_START/END` with `SLIDES` (46), `QUIZ`, `EXAM`; IIFE with try/catch storage, theme toggle `l06-theme`, quiz renderer, copy button that copies only non-`#` lines, `/*@WIDGETS@*/`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| stub build | file written | `node assembly/assemble.mjs --allow-stubs` |
| shell checks | V01–V04, V09, V10, V14 pass | `node verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14` |
| copy button | copies text without `#` lines | `node verify/widget-smoke.mjs --copy` (copied from lesson 07, extended) |

## Verification
The two node commands above exit 0.

## Risks and rollback
Delete the output and revert shell files to the lesson-07 copies.

=== FILE: phase-07-stage-fragments.md ===
---
phase: 7
title: "Stage fragments (3 delegates)"
status: pending
priority: P1
effort: 2h
dependencies: [1, 5]
---

## Goal
Write the nine stage fragments, quizzes and widgets against frozen contract v1.

## Files to create/modify (disjoint owners)
| Owner | Files under `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/` |
|---|---|
| Delegate D1 | `fragments/stage-01.html`, `stage-01.quiz.json`, `stage-02.*`, `stage-03.*`, `widgets/w1.js`, `w2.js`, `w3.js` |
| Delegate D2 | `fragments/stage-04.*`, `stage-05.*`, `stage-06.*`, `widgets/w4.js`, `w5.js`, `w6.js` |
| Delegate D3 | `fragments/stage-07.*`, `stage-08.*`, `stage-09.*`, `widgets/w7.js`, `w8.js`, `w9.js` |
Delegates read the contract, runs, labs, `source-claims.md`, `deviations.md`, the slide `.md` and lesson-07 fragments (style model); they never edit shell, runs or labs.

## Fragment format (frozen)
- `<section id="chang-N" class="stage col">`, `stage-head` (`stage-no` `0N`, meta: slides · minutes · Day 06), `p.goal`.
- Order per stage: story question (`callout story`) → diagram (inline SVG using token colours, or `figure.slide-fig` from `../../Tài Liệu/advanced_backend/assets/6_Redis/page_NN_img_01.png`, `onerror` hides it) → `dl.wwh` (LÀ GÌ / TẠI SAO / KHI NÀO KHÔNG) → per slide a `.sayvs` callout ("Slide nói / Redis 7.2 đo được") with the chip; FIX/PART slides carry `id="sl-NN"` → `<!--@CMD …@-->` → run label "Kết quả đã chạy trên máy bạn ngày DD/MM/YYYY" + `pre[data-run]` (`…` excerpts allowed) → `table.measure` of recorded numbers as `<b class="m" data-run>` → "Kiểm tra 30 giây" one-liner → widget → `callout teacher` "Làm mẫu" → `div.callout.challenge#chang-N-tu-lam` (task, PASS criteria, self-check command, answer in `details.fold`) → `<div class="quiz" data-quiz="N"></div>`.
- Two-client steps: `table.walk` (# / Terminal A / Terminal B / Ghi lại, `data-store="l06-cN-…"`) then the recorded timeline. Quiz: 4 × `{q, opts[4], ans, why}`, each `why` cites a run. Widgets use only the IIFE helpers, are null-guarded, add no globals, controls ≥ 44 px. W7 implements CRC16-XMODEM (poly 0x1021, init 0) with the hashtag rule (first `{`…`}` with non-empty content) and shows ✔ against every recorded `CLUSTER KEYSLOT` pair. W3 lets the learner switch "slide: 20 khóa / 25%" vs "7.2: 20 khóa / 10% + giới hạn 25% CPU" and overlays the recorded curve. W9 simulates capacity/refill and marks the recorded 10/20 point when parameters equal the run's.
- Challenges: S1 make B's PING wait 3 s, explain from SLOWLOG; S2 predict then prove a 600-field cart's encoding; S3 predict `expired_keys` for 300 keys; S4 pick a policy for menu cache vs idempotency store, prove on `-evict`; S5 compare AOF `always` vs `everysec` loss; S6 "huỷ đơn sau 10 phút" with `claim-due.lua`; S7 rename keys so `SINTER` works on `-cluster`; S8 token-checked `PEXPIRE` watchdog; S9 `Retry-After` seconds in the bucket reply.
- Stage 8 links lesson 02 `#chang-6` (lock + compare-and-delete), lesson 14 `#chang-7` (version / conditional UPDATE as the Postgres fencing side, shown as a non-run snippet labelled "không chạy ở bài này"), and one honest Redlock paragraph (clock/pauses assumptions; fencing still needed).

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment checks (V05–V07, V09, V12) | exit 0 per stage | `node verify/verify-guide.mjs --fragment assembly/fragments/stage-0N.html` |
| quiz shape | 4 items, `ans` 0–3 | covered by `--fragment` |
| widget syntax | no error | `node --check assembly/widgets/wN.js` |
| W7 self-check | all recorded pairs ✔ in jsdom | `node verify/widget-smoke.mjs w7` |

## Verification
The controller reruns every `--fragment` check and `widget-smoke.mjs` itself before accepting a delegate's DONE. Delegates end with the Status block.

## Risks and rollback
A delegate needing a new number must ask the controller for a run; it never types a value. Rollback: delete a fragment and rewrite it.

=== FILE: phase-08-assemble-verify-render.md ===
---
phase: 8
title: "Assemble, verify, render"
status: pending
priority: P1
effort: 0.75h
dependencies: [6, 7]
---

## Goal
Build the final guide and pass every gate.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html`
- `…/plans/261031-1651-lesson-06-redis-teacher-guide/verify/render/`, `verify/render-dark/`

## Tasks and steps
1. `node assembly/assemble.mjs` (no stubs).
2. `node verify/verify-guide.mjs` (V01–V15), `--runs`, `--data`.
3. `bash verify/negative-tests.sh` on the real guide (all cases a–l).
4. `TMP=… TEMP=…` set inside the plan folder; `node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs reports/advanced_backend/lesson_06_redis_teacher_guide.html --out verify/render`; repeat with forced dark theme (`?theme=dark` handled by the IIFE, or a copy with `data-theme="dark"`) into `verify/render-dark`.
5. `node verify/widget-smoke.mjs` runs all widgets in jsdom-free mode (as lesson 07) and reports 0 errors.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| full verify | exit 0 | `node verify/verify-guide.mjs && node verify/verify-guide.mjs --runs && node verify/verify-guide.mjs --data` |
| negative tests | `12/12 ca RED đúng thiết kế` | `bash verify/negative-tests.sh` |
| render light/dark | 0 errors, 0 overflow, 0 targets < 44 px at 375/768/1440 | render-check outputs |
| size | ≤ 360 KB | V01 |

## Verification
All commands above exit 0; screenshots saved.

## Risks and rollback
Overflow at 375 px from long `pre` lines: `pre` scrolls inside its box, the page does not. Rollback: re-assemble from fragments.

=== FILE: phase-09-ultra-review-fixes.md ===
---
phase: 9
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 0.75h
dependencies: [8]
---

## Goal
Run `/ak:code-review --ultra` (5 independent reviewers + verifier, union of verified findings) and fix every Critical/Important finding.

## Files to create/modify (owner: controller)
- `…/plans/261031-1651-lesson-06-redis-teacher-guide/verify/review-packet.md` (scope: guide, labs, verify scripts, contract, expected.tsv, deviations)
- `…/reports/code-review-ultra-*.md` (written by the review run)
- Fixes in the owning files (fragments, shell, labs, verify); lab-file fixes require re-recording the affected regions.

## Tasks and steps
1. Review packet focus: Redis 7.2 claims vs `source-claims.md`, number tracing, docker-line safety, learner runnability, Vietnamese clarity, no lesson-02 re-teaching.
2. Run the review; fix verified Critical/Important; a lab change means re-recording its region, manifest and `--runs` rows.
3. Record each finding's status in `reports/code-review-ultra-fix-status.md`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| after fixes | full verify, negative tests, render GREEN | phase 08 commands |
| re-recorded regions | rows GREEN, manifest valid | `node verify/verify-guide.mjs --runs && sha256sum -c runs/MANIFEST.sha256` |
| lab state | `check.sh` all ✔ | `bash labs/lesson-06-redis/check.sh` |

## Verification
`fix-status.md` has no open Critical/Important row.

## Risks and rollback
A finding that would reverse a settled evidence decision is presented to the user, not applied.

=== FILE: phase-10-docs-final-gate-handoff.md ===
---
phase: 10
title: "Docs, final gate, handoff"
status: pending
priority: P1
effort: 0.5h
dependencies: [9]
---

## Goal
Link the lesson from the repo's docs, prove the machine is in its intended state, and leave a short handoff.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/README.md`: line 14 lab list gains `labs/lesson-06-redis/`; the guide is listed beside the other lesson guides, following README's existing pattern.
- `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 06 (line 38): Labs cell becomes `labs/lesson-06-redis/` (redis-cli)`<br>``reports/advanced_backend/lesson_06_redis_teacher_guide.html`, keeping the lesson-02 lab reference.
- `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` line 3335: replace `Sau đó sang Cụm 2 với Bài 06 Redis.` with `Sau đó sang Cụm 2 với <a href="lesson_06_redis_teacher_guide.html">Bài 06 Redis</a>.` (one-line change; skip if the line differs).
- `D:/study/advance-be/plans/handoffs/lesson-06-guide-ready-20261101-<HHMM>.md` (new).
- `…/plans/261031-1651-lesson-06-redis-teacher-guide/runs/00-fingerprint-after.txt`, `verify/final-gate.md`.

## Tasks and steps
1. Read each doc, apply the edits, quote the original lines in `final-gate.md`.
2. `99-cleanup.sh` (no `--all`): optional containers gone, configs restored; main, replica, evict, cluster and `l06:seed:*` stay for the study day. Record `runs/00-fingerprint-after.txt`.
3. Final gate table: verify, `--runs`, `--data`, negative tests, render, `check.sh`, fingerprint diff, size, `git status --short`.
4. Handoff: what is ready, how to start (setup → seed → check → stage 1), core vs optional time, deviations, nothing committed.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| links resolve | lesson 07 link opens lesson 06; README/TONG_QUAN paths exist | `grep -n lesson_06_redis README.md TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` + `ls` each path |
| lesson 07 still valid | its verifier V02 passes | `node plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs --only V02` |
| fingerprint | no diff | `diff runs/00-fingerprint-before.txt runs/00-fingerprint-after.txt` |
| lab state | all ✔ | `bash labs/lesson-06-redis/check.sh` |
| git | no commit made; only expected paths untracked/modified | `git status --short` |

## Verification
`final-gate.md` shows every row passing with the command output pasted.

## Risks and rollback
Doc edits are one line each; revert by restoring the quoted original lines. No git step beyond `git status`.
