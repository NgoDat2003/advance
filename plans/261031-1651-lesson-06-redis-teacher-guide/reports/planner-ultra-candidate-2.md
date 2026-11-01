=== FILE: plan.md ===
---
title: "Lesson 06 Redis teacher guide (redis-cli-first, Redis 7.2.3-measured)"
description: "Single-file Vietnamese teacher guide for K1 Lesson 06 Redis (46 slides + 8 evidence blocks) backed by small redis-cli command files the learner runs himself in advance-be-redis* lab containers."
status: pending
priority: P1
effort: 12h
branch: main
tags: [lesson-06, redis, teacher-guide, redis-cli, lua, distributed-lock, tdd]
blockedBy: []
blocks: []
created: 2026-10-31
---

# Lesson 06 — Redis teacher guide

## Overview

Build `reports/advanced_backend/lesson_06_redis_teacher_guide.html` on the lesson-07 single-column shell, so Đạt can study it on about 2026-11-02 in ≈4h50 of core time. Every experiment is a small region in a plain `.redis` (redis commands), `.host` (docker one-liners) or `.lua` file in `labs/lesson-06-redis/`. He runs a region with one line, `docker exec advance-be-redis sh /lab/run.sh <file> <region>`; the controller runs the identical line, records the transcript verbatim in `runs/`, and `verify/verify-guide.mjs` proves every number in the guide traces to a run. The slides are partly outdated, so each claim gets a chip proved by a Redis 7.2.3 measurement or a cited 7.2.3 source line. The work only touches containers named `advance-be-redis*` (ports 6379, 6381, 6382, 6384, 7001; never 6380), writes no Postgres, and uses no git command except `git status`.

## Data flow

`compose.yaml` creates the lab containers, each mounting the lab folder read-only at `/lab`. `00-seed` and `lua/l06.lua` (`FUNCTION LOAD REPLACE`) put idempotent base state on `advance-be-redis`. `run.sh` (inside a container) takes one region, drops `#` lines, feeds one `redis-cli --no-raw` session with `ECHO`/`TIME` markers and rewrites them into `[hh:mm:ss.mmm] 127.0.0.1:PORT> <command>` lines. `verify/record.sh` (host) wraps it and writes `runs/`; the controller derives `runs/data/wN.json`; delegates write fragments against `assembly/contract.md`; `assemble.mjs` builds the guide, which the verifier, negative tests, widget smoke, render-check and ultra review gate.

## Learner run method (default; the phase-01 smoke test confirms or replaces it)

- Run a region (PowerShell): `docker exec advance-be-redis sh /lab/run.sh 02-encodings strings`. Git Bash needs `MSYS_NO_PATHCONV=1` because it rewrites `/lab/...`.
- Try by hand: `docker exec -it advance-be-redis redis-cli` (Git Bash: `winpty`). DBX `ADVANCE_BE_REDIS` is the visual key browser, plus single commands if the smoke test passes.
- Two-client steps: two terminals, A first, B within the slack the region gives (A waits with `BLPOP l06:tick N`, which blocks only that client); both use `run.sh -t`, and the guide shows the recorded merged timeline beside the walk table.
- Checked 2026-10-31: a `#` line piped into `redis-cli` returns `ERR unknown command '#'`, so `run.sh` strips comments instead of the learner piping files.

## Stage map (study day ≈2026-11-02)

| Stage | Slides / topic | Core min | Optional | Lab files (regions in matrix) | Widget |
|---|---|---|---|---|---|
| 0 `#cach-hoc` | 1–3: setup, run method, check, warm-up from L02 | 10 | – | compose, 00-seed, check | – |
| 1 | 4, 5, 10–14: what Redis is, why fast, single thread proven, pipelining, I/O threads | 30 | 15 (Lua BUSY, io-threads container) | 01-why-fast (.redis/.host) | W1 event loop, W2 round trips |
| 2 | 15, 16, 29–31: dict, encodings, slide 30 Hash vs JSON + lost update | 30 | 5 (HTSTATS) | 02-encodings | W3 encoding converter |
| 3 | 17–21: expire dict, passive vs active, 20 keys / 10 %, no ZSET | 20 | – | 03-expiry | W4 expiry sampler |
| 4 | 22–23: maxmemory, noeviction OOM, allkeys-lru | 20 | 10 (lfu, volatile-ttl) | 04-eviction | W5 eviction sim |
| 5 | 24–27: RDB, AOF, hybrid, crash vs graceful restart | 30 | 10 (SAVE vs BGSAVE on 1M keys) | 05-persistence (.host + .redis) | W6 loss timeline |
| 6 | 28, 32–35: List queue (2 consumers), Hash cart, Set, ZSET best-sellers | 30 | – | 06-structures | – |
| 7 | 36–38: delay task + atomic claim (2 pollers), big keys DEL vs UNLINK | 30 | 5 (KEYS vs SCAN) | 07-practices | W7 poller lanes |
| 8 | 6–9, 39, 41: replica lag + WAIT, Sentinel (diagram, labelled), slots, hashtag, CROSSSLOT, best practices | 30 | – | 08-architecture | W8 hash-slot calculator |
| 9 | 40 capstone: lock failures, Lua unlock, fencing, Redlock note, token bucket, idempotency | 45 | 10 (idempotency mismatch case) | 09-lock-lua | W9 lock timeline, W10 token bucket |
| Wrap | 42–46: homework (43), driver drill, interview, cheat sheet, slide map, references, bridge | 15 | 45 homework + 20 drill (evening) | hw-check, hw/seat-lock.lua | – |
| **Total** | 46 slides + 8 blocks | **290** | **120** | | |

Stage order puts internals (1–7) before architecture (8) so the replica and cluster demos reuse the commands already learned; stage 8 opens with one bridge sentence back to slides 6–9.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract, safety baseline, containers, run method](phase-01-contract-containers-run-method.md) | 1h | – | `contract.md` v1 frozen; `runs/safety-before.txt`; runner self-test GREEN; `runs/smoke-run-method.txt` decides learner method |
| 02 | [Tests first](phase-02-tests-first.md) | 1.25h | 01 | `check.sh` prints ✘ (not errors) for seed/functions; `--runs` RED "missing run" per row; `--selftest` GREEN |
| 03 | [Lab files and recorded runs](phase-03-lab-files-recorded-runs.md) | 3.5h | 02 | `check.sh` all ✔ twice (seed idempotent); `--runs` GREEN or deviations logged; safety diff empty |
| 04 | [Widget data and driver claims](phase-04-widget-data-driver-claims.md) | 0.75h | 03 | `--data` GREEN; `driver-claims.tsv` every row has a published-source quote |
| 05 | [Shell and assembler](phase-05-shell-assembler.md) | 1h | 01, 03 (parallel with 06) | stub build passes V01–V04, V09, V10 |
| 06 | [Stage fragments (3 delegates)](phase-06-stage-fragments.md) | 2h | 01, 04 | `--fragment` GREEN per stage |
| 07 | [Assemble and verify](phase-07-assemble-verify.md) | 0.75h | 05, 06 | full verify GREEN, negative tests all RED as designed, widget smoke + render-check clean light/dark |
| 08 | [Ultra code review and fixes](phase-08-ultra-review-fixes.md) | 1.25h | 07 | no open Critical/Important; affected checks re-run GREEN |
| 09 | [Docs, final gate, handoff](phase-09-docs-final-gate-handoff.md) | 0.5h | 08 | final gate table all pass; handoff note written |

## Expected-result matrix (frozen in `verify/expected.tsv` in phase 02, before any experiment)

Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`, – = no chip. "n" = whatever the run records; the regex asserts shape or relation only. `count:` rows assert a match count.

| ID | Run#region | Slide | Expected Redis 7.2.3 result | Chip |
|---|---|---|---|---|
| R01 | 01-why-fast.block.timeline (A `DEBUG SLEEP 2`, B `PING` at +0.5 s) | 13 | B's `PONG` timestamp ≥ A start + 1.9 s; B waited ≈1.5 s | 13 OK |
| R02 | 01-why-fast#slowlog | 13 | `SLOWLOG GET 1` has `debug sleep` ≈ 2,000,000 µs; `LATENCY LATEST` has a `command` event | – |
| R03 | 01-why-fast.host#bench | 12, 41 | `redis-benchmark -t get`: n rps; `-P 16` ≥ 5× rps | 12 PART |
| R04 | 01-why-fast.host#cpu | 12 | `INFO cpu` delta over a 10 s benchmark ≤ 1.3 core-s per s: one thread saturated | 12 PART |
| R05 | 01-why-fast#threads, .host#tasks | 14 | `io_threads_active:0`, `io-threads 1`, `/proc/1/task` n ≥ 4 (main + bio); fork in R24 | 14 PART |
| R06 | 01-why-fast.host#mget | 41 | MGET of 10 keys: keys/s ≥ 3× single GET keys/s | 41 PART |
| R07 | 01-why-fast.busy.timeline (opt) | 13 | 6 s Lua loop: B gets `BUSY Redis is busy running a script`; `SCRIPT KILL` → OK | – |
| R08 | 01-why-fast.host#io-bench (opt, 6384) | 14 | `io_threads_active:1` under load; rps both, narrated as measured | – |
| R09 | 02-encodings#strings | 31 | `int`; 44-byte → `embstr`; 45-byte → `raw`; after `APPEND` → `raw` | 31 OK |
| R10 | 02-encodings#hash-convert | 16, 33 | 512 fields `listpack`; 513 → `hashtable`; one 65-byte value → `hashtable`; `MEMORY USAGE` jumps n× | 33 PART |
| R11 | 02-encodings#user | 30 | Hash user `listpack` n B vs JSON `raw` n B (2026-10-31: 104/104); C1 `HGET`, C2 `HINCRBY`, C3 `HGETALL` | 30 OK |
| R12 | 02-encodings.json-race.timeline | 30 | JSON GET-modify-SET by A and B: final JSON keeps only B's change; Hash `HSET`/`HINCRBY` keeps both | – |
| R13 | 02-encodings#htstats (opt) | 16 | `DEBUG HTSTATS 0` prints `[Dictionary HT]` and `[Expires HT]` hash-table stats | 16 OK |
| R14 | 02-encodings#set-zset | 34, 35 | ints ≤512 `intset`; strings ≤128 `listpack`; 129 → `hashtable`; ZSET 128 `listpack` → 129 `skiplist` | 34, 35 PART |
| R15 | 03-expiry#passive | 19 | active off; 1,000 keys `PX 100`; after 1 s `DBSIZE 1000`; one `GET` → nil, `expired_keys` +1, DBSIZE 999; `lazyfree-lazy-expire no` (sync free) | 19 PART |
| R16 | 03-expiry#active | 20 | `SET-ACTIVE-EXPIRE 1`; without access, `expires` falls to 0 within ~3 s (sampled table every 0.5 s), `expired_keys` +999 | 20 PART |
| R17 | 03-expiry#dicts | 18, 21 | `keys=n,expires=m`; `DEBUG HTSTATS 0` shows `[Expires HT]` (hash table, no ZSET); cite `expire.c` 7.2.3 `dictScan(db->expires…)` | 18 OK, 21 FIX |
| R18 | 03-expiry#effort | 20 | `hz 10`, `active-expire-effort 1`, `expired_stale_perc` n; source: 20 keys/loop, repeat while > 10 % stale, 25 % = CPU time cap | – |
| R19 | 04-eviction#noeviction | 23 | `maxmemory 2mb`: write → `OOM command not allowed when used memory > 'maxmemory'`; GET still works | 23 PART |
| R20 | 04-eviction#lru | 23 | `allkeys-lru`, 200 hot keys, 20,000 cold writes → `EXISTS` hot ≥ 180; `evicted_keys` > 0 | – |
| R21 | 04-eviction#lfu, #volatile-ttl (opt) | 23 | LFU hot survivors ≥ 180; volatile-ttl removes short-TTL keys first; volatile-* with no TTL keys → OOM | – |
| R22 | 04-eviction#restore | – | `maxmemory 0`, `noeviction` | – |
| R23 | 05-persistence.host#none | 24 | `save ""`, AOF off: 1,000 keys, `docker kill` + start → `DBSIZE 0` | – |
| R24 | 05-persistence.host#rdb-crash | 26 | `BGSAVE` → `Background saving started`, `rdb_last_bgsave_status:ok`, `latest_fork_usec` n; +100 keys; kill → DBSIZE 1000 (100 lost) | 26 OK |
| R25 | 05-persistence.host#graceful | 26 | default save points, `docker restart` (SIGTERM) → all keys survive; log `DB saved on disk` | – |
| R26 | 05-persistence.host#aof-crash | 25 | AOF `everysec`, kill right after writes → all survive (page cache); ≤ 1 s loss is an OS/power-crash risk, narrated | 25 PART |
| R27 | 05-persistence.host#hybrid | 27 | `ls /data/appendonlydir` → `*.base.rdb`, `*.incr.aof`, manifest; `head -c 5` base = `REDIS` | 27 OK |
| R28 | 05-persistence.save-vs-bgsave.timeline (opt) | 26 | 1M keys: `SAVE` delays B's PING ≈ n ms; `BGSAVE` does not | – |
| R29 | 06-structures.queue.timeline | 32 | A `BRPOP`, B `LPUSH m1 m2` + `BRPOP` → each message to exactly one consumer; `BLMOVE` keeps a copy in `processing` | 32 PART |
| R30 | 06-structures#cart | 33 | slide 33 commands: `HINCRBY` → 2, `HLEN` 2, `HDEL` 1, `HGETALL` | – |
| R31 | 06-structures#set | 34 | `SINTER` common followers n, `SINTERCARD`, `SISMEMBER` 1/0 | – |
| R32 | 06-structures#zset | 35 | `ZINCRBY` best-sellers; `ZREVRANGE … WITHSCORES` top 3 equals the seed's expected order | – |
| R33 | 07-practices.delay-naive.timeline | 37 | both pollers read `o1`; only one `ZREM` returns 1 | 37 PART |
| R34 | 07-practices.delay-claim.timeline | 37 | `FCALL l06_claim_due`: A and B get different ids, no duplicate | – |
| R35 | 07-practices#bigkey | 38 | 1M-field hash: `MEMORY USAGE` n MB; `DEL` in SLOWLOG ≥ 50 ms; `UNLINK` of an identical key < 1 ms; `lazyfree_pending_objects` n | 38 OK |
| R36 | 07-practices#lazyfree | 38 | `lazyfree-lazy-user-del yes` → `DEL` < 1 ms; reverted to `no` | – |
| R37 | 07-practices.host#bigkeys (opt: #keys-scan) | 38 | `redis-cli --bigkeys` names `l06:s7:big:*`; KEYS in SLOWLOG vs SCAN cursor | – |
| R38 | 08-architecture.host#replica-lag | 6 | replica GET 100; network disconnect; master SET 120, `WAIT 1 1000` → 0; replica still 100; reconnect → 120, `WAIT` → 1 | 6 OK |
| R39 | 08-architecture#keyslot (port 7001) | 9 | `cluster_slots_assigned:16384`; `CLUSTER KEYSLOT` n values; `user_profile:{34}` = `user_session:{34}` | 9 OK |
| R40 | 08-architecture#crossslot | 39 | `MSET`/`SUNION` across slots on one node → `CROSSSLOT`; with `{34}` → OK | 39 PART |
| R41 | 09-lock-lua.unsafe-del.timeline | 40 | A `SET NX PX 2000`, works 3 s, B acquires after expiry, A `DEL` → 1 removes B's lock | 40 FIX |
| R42 | 09-lock-lua.get-then-del.timeline | 40 | A GET equals own token, waits, B acquires, A DEL → B's lock gone (check-then-act gap) | – |
| R43 | 09-lock-lua.safe.timeline | 40 | `FCALL l06_unlock` by A → 0; B's lock PTTL > 0 | – |
| R44 | 09-lock-lua#fencing | 40 | tokens 1, 2; `l06_fenced_write` with 2 → `OK`; late write with 1 → `STALE` | – |
| R45 | 09-lock-lua.bucket-naive.timeline | – | GET/DECR by two clients leaves tokens `-1` (overspend) | – |
| R46 | 09-lock-lua.bucket.timeline | – | 20 concurrent `l06_take_token` (cap 10): `count:` allowed = 10, rest retry ms > 0 | – |
| R47 | 09-lock-lua#idempotency | – | first `NEW`; repeat `REPLAY` + stored response; other body hash `MISMATCH` | – |
| R48 | hw-check (solution / bad fixture) | 43 | solution all ✔; bad fixture ✘ only on H2, H3, H5 | 43 OK |
| R49 | 00-ref#command-docs | 42 | `COMMAND DOCS` complexity strings for every cheat-sheet command | – |

Slide chips (46, each mapped once in `SLIDES`): – for 1, 2, 3, 10, 11, 15, 17, 22, 24, 28, 29, 36, 44, 45, 46. OK for 4, 6, 7, 8, 9, 13, 16, 18, 26, 27, 30, 31, 38, 43. PART for 5, 12, 14, 19, 20, 23, 25, 32, 33, 34, 35, 37, 39, 41, 42. FIX for 21, 40. Slide 5 (Memcached) and 7 (Sentinel) carry a "nguồn: tài liệu, chưa đo trên máy" tag instead of a run, because no Memcached image or Sentinel is set up.

## Acceptance criteria

1. The guide is ≤ 340 KB, loads no external script, and only fonts come from outside (P07, V01, V10).
2. `SLIDES` covers 1–46 exactly once, every href resolves, and chips equal the contract table (P07, V04).
3. Each stage 1–9 has story → diagram/widget → recorded stats table → 30-second check, plus `dl.wwh`, byte-exact `pre[data-cmd]`, worked example, `callout challenge` with PASS criteria and 4 quiz questions (P06, V05, V11, V12).
4. Every `b.m`, `[data-run]` and `run-wN` value traces to a `runs/` file whose header date equals the label (P04, P07, V06–V08, V13).
5. Every `expected.tsv` row matches, or has a `verify/deviations.md` entry and changed narrative (P03).
6. `check.sh` shows only ✔ on the main container, twice in a row with identical output after re-seeding (P03, P09).
7. `verify/safety.sh diff` shows no change to non-`advance-be-redis*` containers and nothing listening on 6380 (P01, P03, P09).
8. Storage keys are `l06-*` only, there is no rail, dark and light both work (P07, V09, V14).
9. Widget smoke and render-check at 375/768/1440 show 0 runtime errors, 0 overflow, 0 targets under 44 px, light and dark (P07).
10. `negative-tests.sh` reports every case RED as designed (P02, P07).
11. No Critical or Important review finding stays open (P08).
12. README and TONG_QUAN row 06 link the guide and labs, lesson 07 `#tiep-theo` links lesson 06 (one-line edit), handoff exists (P09).
13. There is no branch, commit or push; `git status` lists only the paths named in phase 09 (P09).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| Git Bash rewrites `/lab/...` | H×M | Smoke test decides; guide uses PowerShell, Git Bash note `MSYS_NO_PATHCONV=1`. |
| Approximate LRU/expiry timing varies | M×M | Assert relations (≥ 180/200, 0 within 3 s), run 3×, narrate variance. |
| Kill/restart hits the wrong container | L×H | Explicit names; `record.sh` refuses others; `safety.sh` before/after. |
| Config left changed | M×M | Every stage ends with `restore`; `check.sh` C02–C06 catch leftovers. |
| Measurement contradicts a chip | M×M | Keep data, change chip/narrative, log in `deviations.md` (verifier enforces). |
| Drill API wrong for the pinned node-redis | M×M | Phase 04 quotes published source at that version. |

Rollback: `99-cleanup.redis` (`FCALL l06_reset 0 l06:` + `FUNCTION DELETE l06`), then `docker compose -f labs/lesson-06-redis/compose.yaml --profile replica --profile persist --profile cluster --profile io down -v` removes every lab container, network and volume (all created by this work). All other files are new and can be deleted; the three doc edits quote their original text in phase 09.

## Open questions for the user

None blocking. One confirmation: 290 core minutes sits at the top of the 4–5 h budget; if Đạt wants 4 h, stage 8's best-practices part and the stage 6 Set region can move to the evening without dropping content.

=== FILE: phase-01-contract-containers-run-method.md ===
---
phase: 1
title: "Contract, safety baseline, containers, run method"
status: pending
priority: P1
effort: 1h
dependencies: []
---

# Phase 01 — Contract, safety baseline, containers, run method

## Goal
Freeze the names parallel work depends on, record what must stay untouched, move the lab Redis under compose with the `/lab` mount, and decide how Đạt runs commands.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/contract.md` | controller |
| `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/verify/safety.sh` | controller |
| `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/verify/fixtures/runner-selftest.redis`, `runner-selftest.expected.txt` | controller |
| `D:/study/advance-be/labs/lesson-06-redis/compose.yaml` | controller |
| `D:/study/advance-be/labs/lesson-06-redis/run.sh` | controller |
| `…/plan folder/runs/safety-before.txt`, `runs/smoke-run-method.txt` | controller |

## Tasks and steps
1. **Safety baseline (first, read-only).** `safety.sh snap <file>` writes: `docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.CreatedAt}}'` filtered to names not starting with `advance-be-redis`, `docker network ls`, and `netstat -ano | grep -E ':6380\b' || echo "6380: không có"`. `safety.sh diff <a> <b>` compares, ignoring the "Up N minutes" age text, and exits 1 on any change. Record `runs/safety-before.txt`.
2. **Contract v1** (`contract.md`):
   - Keys `l06:seed:*`, `l06:s1:*` … `l06:s9:*`, `l06:hw:*`, `l06:tick` (never written). Containers: `advance-be-redis` 6379, `-replica` 6381, `-persist` 6382, `-io` 6384 (optional), `-cluster` 7001, network `advance-be-redis-net`, port 6380 forbidden.
   - Formats: `.redis` regions `# #region <id> · <tiêu đề> (slide N)` … `# #endregion`, one command per line, no `MULTI`; `.host` same markers, one docker command per line naming its container; `lua/l06.lua` starts `#!lua name=l06`, regions `-- #region <fn>`.
   - Run ids `runs/<stem>.<region>.txt`, `<stem>.host.<region>.txt`, `<stem>.<name>.A|B|timeline.txt`; `data-run` = `<stem>#<region>`, `<stem>.host#<region>` or `<stem>.<name>.timeline`; widget data `run-w1…w10`.
   - CSS: lesson-07 classes plus `.lanes`, `.lane-a`, `.lane-b`, `.bar.wait`, `.bar.busy`, `.slotcalc`, `.enc-badge`, `.story`, `.check30`. Storage keys `l06-c<N>-<slug>`, `l06-warmup`, `l06-theme`, `l06-hw-*`, `l06-drill-*`.
   - The slide/chip/anchor table from plan.md (PART/FIX slides carry `id="sl-NN"`).
3. **Runner self-test fixture first.** `runner-selftest.redis` has two regions with an integer, nil, a JSON string with `\"`, an error, an `EVAL` one-liner with quotes, a blank line and `#` comments; the expected transcript is written by hand.
4. **`run.sh [-t] <stem> [region]`** (POSIX sh inside any lab container, ≈40 lines): read `${LAB:-/lab}/<stem>.redis`, take the region, drop `#`/blank lines, wait silently for `PING` (covers LOADING after restart), and feed one `redis-cli -p ${REDIS_PORT:-6379} --no-raw` session with `ECHO "§<n>"` (plus `TIME` with `-t`) before each line. awk replaces each `"§n"` reply with `[hh:mm:ss.mmm] 127.0.0.1:PORT> <line n>`, so command text is never escaped. `MULTI` is refused.
5. **`compose.yaml`** (`name: advance-be-redis-lab`, image `redis:7.2.3`, no pull; each service has `container_name`, `./:/lab:ro`, `REDIS_PORT`, network `advance-be-redis-net`):
   - main: `--appendonly no --enable-debug-command local`, 6379.
   - replica (profile `replica`): `--replicaof advance-be-redis 6379 --enable-debug-command local`, 6381:6379.
   - persist (`persist`): `--appendonly no --enable-debug-command local`, 6382:6379.
   - io (`io`, optional): `--io-threads 4 --io-threads-do-reads yes`, 6384:6379.
   - cluster (`cluster`): `--port 7001 --cluster-enabled yes --cluster-config-file nodes-7001.conf`, 7001.
   `local` allows `DEBUG` from `docker exec` (localhost) but not from DBX over the port; the guide says never in production.
6. **Migration.** Confirm the controller-created container is empty (`DBSIZE` → 0) and ports are free (`netstat -ano | grep -E ':(6381|6382|6384|7001)\b'` empty), then `docker rm -f advance-be-redis` (this name only) and `docker compose -f labs/lesson-06-redis/compose.yaml up -d`. DBX on 6379 keeps working.
7. **Smoke test** → `runs/smoke-run-method.txt`: (a) self-test through `run.sh`; (b) the same line from PowerShell (`powershell.exe -Command "…"`) and Git Bash with and without `MSYS_NO_PATHCONV=1`; (c) DBX MCP Redis tool: one command, a two-line paste, `FCALL` (repeated in phase 03); (d) `DEBUG HELP` lists `SLEEP`, `SET-ACTIVE-EXPIRE`, `POPULATE`, `HTSTATS`; (e) `docker exec -it` in Git Bash with/without `winpty`. The result fixes the `#cach-hoc` text.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| runner self-test | transcript byte-equal to expected (header excluded) | `docker cp verify/fixtures/runner-selftest.redis advance-be-redis:/tmp/` then `docker exec -e LAB=/tmp advance-be-redis sh /lab/run.sh runner-selftest basic`, `diff` against the expected file (`run.sh` reads `${LAB:-/lab}`) |
| runner rejects MULTI (negative) | exit 1 | fixture region `multi` |
| safety diff catches change (negative) | exit 1 on an edited snapshot copy | `bash verify/safety.sh diff runs/safety-before.txt verify/tmp/safety-edited.txt` |
| DEBUG available locally | `DEBUG HELP` lists the 4 subcommands | `docker exec advance-be-redis redis-cli DEBUG HELP` |

## Verification
`safety.sh diff` of before vs a fresh snap exits 0; `docker ps --filter name=advance-be-redis` lists only the main container; `CONFIG GET enable-debug-command` → `local`.

## Risks and rollback
If the relative bind mount fails, use the absolute `D:/study/advance-be/labs/lesson-06-redis:/lab:ro`. Rollback: `compose down`, then the original `docker run -d --name advance-be-redis -p 6379:6379 redis:7.2.3 redis-server --appendonly no`.

=== FILE: phase-02-tests-first.md ===
---
phase: 2
title: "Tests first: check, expected matrix, verifier, recorder, negative tests"
status: pending
priority: P1
effort: 1.25h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Write every check before the lab files and HTML it checks exist, and show each starts RED for the right reason.

## Files to create/modify (all controller)
- `D:/study/advance-be/labs/lesson-06-redis/check.sh`, `hw-check.sh`, `hw/bad-fixture.lua`
- Plan folder `verify/`: `expected.tsv`, `verify-guide.mjs`, `record.sh`, `merge-timeline.mjs`, `negative-tests.sh`, `widget-smoke.mjs`, `deviations.md` (header only), `fixtures/verifier/` (tiny guide + run + lab region)
- `runs/red-baseline.txt`

## Tasks and steps
1. **`check.sh`** (learner runs `docker exec advance-be-redis sh /lab/check.sh`; output `ma | ✔/✘/– | chi_tiet`, never aborts):
   - C01 `redis_version:7.2.`; C02 `maxmemory 0` and `noeviction`; C03 `appendonly no`; C04 `enable-debug-command local`; C05 `lazyfree-lazy-user-del no`; C06 `latency-monitor-threshold 0`.
   - C07 no key outside `l06:*` (`SCAN` count via `redis-cli --scan`, filtered); C08 `l06:seed:version` = `1` and seed counts; C09 `FUNCTION LIST LIBRARYNAME l06` has the 7 functions; C10 no `l06:s7:big:*` left.
   - C11 active expiry on: a `PX 50` probe key disappears from `INFO keyspace` within 2 s without being read.
   - C12 replica (– if not running): `role:slave`, `master_link_status:up`; C13 cluster (– if not running): `cluster_state:ok`, `cluster_slots_assigned:16384`. Reached with `redis-cli -h advance-be-redis-replica|-cluster` over the network.
2. **`hw-check.sh`** (slide 43 self-check): loads `/lab/hw/seat-lock.lua` (library `hw`), clears `l06:hw:*`, then H1 two concurrent clients (`&` + `wait`) call `hw_acquire` on `l06:hw:lock:FA634:A34_S012C` → exactly one wins; H2 `PTTL` in (0, 30000]; H3 release with a wrong token → 0, lock kept; H4 right token → 1; H5 after expiry and a new holder, the old release → 0; H6 exact key name; H7 increasing fencing tokens; H0 "chưa có hw/seat-lock.lua" when missing.
3. **`hw/bad-fixture.lua`**: acquire with `SET NX` and no TTL, release with `DEL`. Expected ✘ only on H2, H3, H5.
4. **`expected.tsv`**: R01–R49 from plan.md with columns `id, run, slides, regex, claim, chip, status(expect|deviation)`. Regexes target run transcripts, e.g. R09 `"embstr"[\s\S]*"raw"`, R19 `OOM command not allowed`, R41 `DEL l06:s9:lock[^\n]*\n\(integer\) 1`, R46 `count:\(integer\) 1\b=10` against the merged timeline.
5. **`record.sh`** (host, Git Bash, `MSYS_NO_PATHCONV=1`): `redis <ct> <stem> <region>`, `host <stem> <region>` (each line through `bash -c`, printed as `PS> <line>` + output), `ab <stem> <name> <ctA>:<regionA> <ctB>:<regionB> <delayB>` (both with `-t`, background + `wait`, then `merge-timeline.mjs` sorts lines by the `[hh:mm:ss.mmm]` prefix). First line of every file: `# chạy lúc dd/mm/yyyy HH:MM +0700 · Redis <INFO redis_version> · <container>`. It refuses any container name not starting with `advance-be-redis`.
6. **`verify-guide.mjs`**, copied from lesson 07 and adapted (paths, 46 slides, `l06-`, `data-cmd`); modes `--runs`, `--data`, `--fragment`, `--only`, `--selftest`, default. Codes keep lesson-07 meaning: V01 ≤ 340 KB; V02 tags/ids/hrefs; V03 sections `cach-hoc`, `chang-1…9`, `bai-tap`, `driver-drill`, `phong-van`, `cheat-sheet`, `ban-do-slide`, `tham-khao`, `tiep-theo`; V04 SLIDES 1–46 once, chips = contract; V05 `pre[data-cmd]` byte-equal to the lab region; V06 `pre[data-run]` lines in order in the run; V07 every inline `[data-run]` value (incl. cheat-sheet complexity) in its run; V08 `run-wN` = `runs/data`; V09 `l06-` keys only; V10 no `script src`, images exist; V11 QUIZ 9×4 + EXAM 10; V12 stage parts incl. `.story`, `.check30`; V13 label dates = run headers; V14 dark mode; V15 no `redis://`/`requirepass`/`password`; V16 quiz numbers in runs. New V17: a Node port of the W8 CRC16 must equal every recorded `CLUSTER KEYSLOT` in `w8.json`. `--runs` fails a `deviation` row without a `deviations.md` entry.
7. **`negative-tests.sh`** (written now, run in phase 07), one mutation per case on a copy:
   - (a) one char in a `data-cmd` → V05; (b) `b.m` = 987654321 → V07; (c) `data-store="l07-x"` → V09; (d) slide 21 removed → V04; (e) slide 21 chip flipped to OK → V04; (f) `<script src>` → V10.
   - (g) a lab region edited after build (lab → HTML drift) → V05; (h) a fake run missing R41 → `--runs`; (i) a fabricated number in `w4.json` → `--data`; (j) a `w8.json` slot altered → V17; (k) a `deviation` row without a log entry → `--runs`.
   - (l) `check.sh` after `CONFIG SET maxmemory 2mb` → C02 ✘, restored in the same case.

## Test matrix
| Test | Expected now (RED) | Command |
|---|---|---|
| check before seed | C08, C09 ✘; C01–C07, C10, C11 ✔; C12, C13 –; no shell error | `bash verify/record.sh redis advance-be-redis check` (stem `check.sh` handled by a `check` alias) |
| `--runs` | exit 1, 49 × "missing run" | `node verify/verify-guide.mjs --runs` |
| default | exit 1, V01 "guide missing" | `node verify/verify-guide.mjs` |
| `--selftest` | GREEN: the fixture's good copy passes, its mutated copies fail V05 and V07 | `node verify/verify-guide.mjs --selftest` |
| hw-check with no homework | H0 printed, exit 0 | `docker exec advance-be-redis sh /lab/hw-check.sh` |
| recorder refuses foreign container (negative) | exit 1 | `bash verify/record.sh redis quan-ly-hop-dong-postgres-1 x y` |

## Verification
The RED results above go to `runs/red-baseline.txt`; `bash verify/safety.sh diff runs/safety-before.txt <new snap>` exits 0.

## Risks and rollback
A verifier stricter than the transcript format would block delivery: allow `…` lines and trailing whitespace only. Rollback: delete `verify/` and the three lab files.

=== FILE: phase-03-lab-files-recorded-runs.md ===
---
phase: 3
title: "Lab files, seed, functions and recorded runs"
status: pending
priority: P1
effort: 3.5h
dependencies: [2]
---

# Phase 03 — Lab files and recorded runs

## Goal
Write the learner-facing command files, run them serially, and record every output until `--runs` is GREEN or each deviation is logged.

## Files to create/modify (controller; all Redis runs strictly serial)
`D:/study/advance-be/labs/lesson-06-redis/`: `README.md` (one screen: start, run a region, check, cleanup), `00-seed.redis`, `00-ref.redis`, `lua/l06.lua`, `01-why-fast.redis`, `01-why-fast.host`, `02-encodings.redis`, `03-expiry.redis`, `04-eviction.redis`, `04-eviction.host`, `05-persistence.redis`, `05-persistence.host`, `06-structures.redis`, `07-practices.redis`, `07-practices.host`, `08-architecture.redis`, `08-architecture.host`, `09-lock-lua.redis`, `hw/seat-lock.solution.lua`, `99-cleanup.redis`. Plan folder: `runs/*.txt`, `verify/deviations.md`.

## Tasks and steps
1. **`lua/l06.lua`**, one region per function: `l06_reset` (SCAN + UNLINK of a prefix, refuses anything not starting `l06:`), `l06_unlock` (compare-and-delete, as lesson 02), `l06_fenced_write` (`STALE` unless token > stored), `l06_claim_due` (due item by `TIME` + `ZREM`, atomic), `l06_take_token` (refill by elapsed `TIME`, returns `{allowed, left, retry_ms}`), `l06_idem_begin` (`NEW`/`REPLAY`/`MISMATCH`, `EX` 86400), `l06_fill_hash` (chunked big-key builder).
2. **Seed**: `00-seed.host` runs `docker exec advance-be-redis sh -c "redis-cli -x FUNCTION LOAD REPLACE < /lab/lua/l06.lua"` and `run.sh 00-seed`, which sets `l06:seed:version 1` and 8 menu hashes. Each stage file opens with `reset` (`FCALL l06_reset 0 l06:sN:`) and seeds only its own keys, so files are independent and re-runnable. `hw-check.sh [file]` defaults to `hw/seat-lock.lua`, which the learner writes on the host and the read-only mount exposes.
3. **Stage regions.** Each produces exactly the evidence its R-row names. Non-obvious design points:
   - 01: `block.A` = `DEBUG SLEEP 2`, `block.B` = `PING`. `slowlog` sets `latency-monitor-threshold 100`, reads `SLOWLOG GET 1` + `LATENCY LATEST`, then resets both. `.host#cpu` reads `INFO cpu` around a 10 s `redis-benchmark`. `#mget` compares custom benchmarks `GET l06:s1:k1` vs `MGET` of 10 keys. `#tasks` = `sh -c "ls /proc/1/task | wc -l"`.
   - 02: `hash-convert` fills 512 fields with `l06_fill_hash`, then adds one. The slide 30 user uses the same 4 fields as the 2026-10-31 measurement. In `json-race`, A does `GET`, `BLPOP l06:tick 2`, `SET` age+1; B at +0.5 s does `GET`, `SET` new email.
   - 03: `passive` = `DEBUG SET-ACTIVE-EXPIRE 0`, `DEBUG POPULATE 1000 l06:s3:k 10`, one `EVAL` that `PEXPIRE`s them by 100 ms, `BLPOP l06:tick 1`, then `DBSIZE`, `INFO keyspace`, one `GET`, `INFO stats`. `active` re-enables and reads `INFO keyspace` six times, 0.5 s apart. Every path ends with `SET-ACTIVE-EXPIRE 1`.
   - 04: `noeviction` = `maxmemory 2mb` + `DEBUG POPULATE` until the next `SET` hits OOM. `lru` reads 200 hot keys twice, then `.host#fill` runs 20,000 `redis-benchmark SET l06:s4:cold:__rand_int__ <100-byte literal>`. `restore` resets maxmemory, policy and `l06:s4:`.
   - 05 runs on `advance-be-redis-persist` (`--profile persist up -d persist`). Host regions chain `run.sh` calls with `docker kill|start|restart advance-be-redis-persist`. Each mode starts with `FLUSHALL` (own container) and `CONFIG SET save ""` / default / `appendonly yes`, waiting for `aof_rewrite_in_progress:0`.
   - 06: in the queue, B does `LPUSH m1 m2` + its own `BRPOP` while A is already blocked; then `BLMOVE` into `l06:s6:q:processing`. The cart uses slide 33's commands on `l06:s6:cart:u1`. Best-sellers use `ZINCRBY` from seed orders.
   - 07: the naive pollers do `ZRANGEBYSCORE … LIMIT 0 1`, `BLPOP l06:tick 1`, `ZREM`. Scores are the slide's 1704790435… (all due). `bigkey` builds two identical 1M-field hashes, `DEL`s one, `UNLINK`s the other and reads `SLOWLOG GET 2`.
   - 08: `.host#replica-lag` starts the replica, waits for `master_link_status:up`, and uses `docker network disconnect|connect advance-be-redis-net advance-be-redis-replica`. `keyslot` on port 7001 runs `CLUSTER ADDSLOTSRANGE 0 16383` (skipped when already 16384), then `CLUSTER KEYSLOT` for 12 keys incl. `user_profile:{34}`, `user_session:{34}`, `{}x`, `a{}{b}`. Sentinel stays diagram-only.
   - 09: in the lock races A holds `PX 2000` and waits `BLPOP l06:tick 3`; B starts at +2.3 s. Fencing uses `INCR l06:s9:fence`. In `bucket.A/B` each client sends 10 × `FCALL l06_take_token 1 l06:s9:tb:store:7 10 0.1`. Idempotency uses a fixed sha-256 body hash.
   - `00-ref#command-docs` = `COMMAND DOCS` for every cheat-sheet command.
4. **`hw/seat-lock.solution.lua`** (controller proof only, guide shows it folded): library `hw`, `hw_acquire` (`SET NX PX` + `INCR` fence), `hw_release` (compare-and-delete).
5. **Run order**: seed → `check` → seed → `check` (diff empty) → stages 01–09 → each `ab` pair 3× (record run 1, compare 2–3) → `hw-check` on solution, then bad fixture → `FUNCTION DELETE hw` → `--runs`. Afterwards `docker compose … stop persist replica cluster io`; the learner starts them per guide.
6. **Deviation rule**: a wrong command file is fixed; a Redis result that contradicts the hypothesis keeps its run, changes chip/narrative and gets a `deviations.md` row.
7. **DBX re-smoke**: `FCALL l06_unlock 1 l06:x t` and a `GET` through the DBX MCP Redis tool, appended to `runs/smoke-run-method.txt`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| seed idempotent | identical `check` output after 2nd seed (header excluded) | `diff <(tail -n +2 runs/check.txt) <(tail -n +2 runs/check.rerun.txt)` |
| stage file re-run | same outcome lines (timings excluded) on a 2nd run of `02-encodings` | `record.sh redis … --out 02-encodings.strings.rerun` + `diff` on non-time lines |
| config restored (negative guard) | C02, C05, C06 ✔ after stages 01, 04, 07 | `check` after each |
| hw-check solution / bad fixture | all ✔ / ✘ only H2, H3, H5 | `docker exec advance-be-redis sh /lab/hw-check.sh` |
| two-client determinism | 3 runs, same outcome codes | `grep -c` on the three `.timeline.txt` |
| matrix | `--runs` exit 0 | `node verify/verify-guide.mjs --runs` |
| foreign state untouched | safety diff exit 0 | `bash verify/safety.sh diff runs/safety-before.txt runs/safety-after-03.txt` |

## Verification
`node verify/verify-guide.mjs --runs`; `check` all ✔ (C12/C13 – after the extra containers are stopped); `ls runs/` matches the contract run-id list.

## Risks and rollback
`docker kill` must only ever name `advance-be-redis-persist`; `record.sh host` greps each line for `docker (kill|stop|restart|rm|network)` and refuses any target outside `advance-be-redis*`. Big keys cost ≈150 MB briefly; `restore` and C10 ensure removal. Rollback: `99-cleanup.redis`, `compose down -v`, `compose up -d`, `00-seed.host`.

=== FILE: phase-04-widget-data-driver-claims.md ===
---
phase: 4
title: "Widget data and driver-drill claims"
status: pending
priority: P1
effort: 0.75h
dependencies: [3]
---

# Phase 04 — Widget data and driver claims

## Goal
Turn recorded runs into small JSON files the widgets read, and pin every driver-drill API claim to a published source.

## Files to create/modify (controller)
- Plan folder `verify/make-widget-data.cjs`, `runs/data/w1.json` … `w10.json`, `verify/driver-claims.tsv`
- `D:/study/advance-be/labs/lesson-06-redis/driver-drill/ai-snippet.ts`, `driver-drill/fixed.ts` (shown in the guide, not run)

## Tasks and steps
1. `make-widget-data.cjs` writes JSON with `sources: [...]`: w1 block timeline; w2 rps plain/`-P 16` and MGET keys/s; w3 listpack/intset thresholds + encoding/bytes rows; w4 expiry samples, `hz`, effort; w5 survivors per policy, `maxmemory-samples`; w6 DBSIZE after restart per mode; w7 poller timelines; w8 key → slot; w9 lock timelines + fencing replies; w10 bucket replies.
2. Driver drill uses node-redis, because lesson 02's `package.json` already depends on `redis` and the hub has no client yet. `ai-snippet.ts` is a NestJS-style service with 7 seeded mistakes: `KEYS` in a request path, no TTL, `DEL` release, GET-then-SET counter, `HGETALL` on a big hash, N sequential awaits instead of `MGET`/pipeline, no `on('error')` or offline-queue/timeout setting. One decoy (TTL with jitter) is correct. `fixed.ts` shows the fixes.
3. `driver-claims.tsv`: for each API used (`createClient`, `on('error')`, `disableOfflineQueue`, SET NX/PX option shape, `scanIterator`, `multi`/auto-pipelining, `fCall`), record the version pinned by lesson 02, an unpkg/GitHub URL at that tag and the quoted line. Never read `node_modules`; if the source differs, the snippet changes.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| widget data traced | `--data` exit 0 | `node verify/verify-guide.mjs --data` |
| fabricated number (negative, case i) | `--data` exit 1 naming the value | `bash verify/negative-tests.sh i` |
| CRC16 port vs records | V17 GREEN on `w8.json` | `node verify/verify-guide.mjs --only V17 --allow-missing-guide` |
| claims complete | every tsv row has URL + quote, no `node_modules` path | `node -e` one-liner counting empty cells |

## Verification
`node verify/verify-guide.mjs --data` exits 0 and `grep -c node_modules verify/driver-claims.tsv` prints 0.

## Risks and rollback
If the published API differs from the drill (e.g. option names in a newer major), the drill text follows the source. Rollback: delete the generated JSON and re-run the script.

=== FILE: phase-05-shell-assembler.md ===
---
phase: 5
title: "Guide shell and assembler"
status: pending
priority: P1
effort: 1h
dependencies: [1, 3]
---

# Phase 05 — Shell and assembler

## Goal
Copy the lesson-07 assembly and adapt it; the controller owns every non-stage section.

## Files to create/modify (controller)
Plan folder `assembly/`: `shell-css.part`, `shell-head.html`, `shell-tail.html`, `assemble.mjs` (copied from `plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/`).

## Tasks and steps
1. `assemble.mjs`: LABS = `labs/lesson-06-redis`, OUT = `reports/advanced_backend/lesson_06_redis_teacher_guide.html`; placeholder `<!--@CMD file#region@-->` → `<div class="code"><div class="run-cmd">docker exec … sh /lab/run.sh …</div><pre data-cmd="…"><code>` with the escaped region (marker lines `# #region`/`-- #region` included); `.host` and `.lua` supported; quiz/widgets/run-data injection unchanged.
2. `shell-head.html`: title, hero (Cụm 2 opener), `#cach-hoc` with the plan table (stage map), prep (compose up, seed, check, run method from `runs/smoke-run-method.txt`, two-terminal instructions, Git Bash notes), "Nhắc nhanh Bài 02" callout linking `lesson_02_caching_teacher_guide.html#s5-2`, `#s5-3` and lab 06 (no re-teach), warm-up.
3. `shell-tail.html`:
   - `#bai-tap`: slide 43 spec, `hw-check` usage, PASS = all ✔, solution folded, optional NestJS port note.
   - `#driver-drill`: snippet, one `data-store` checkbox per mistake, folded answers, claims table with links.
   - `#phong-van` (10 questions); `#cheat-sheet` (complexity cells carry `data-run="00-ref#command-docs"`, slide 42 recap); `#ban-do-slide`; `#tham-khao` (slide 44 links, Redis 7.2 docs, `expire.c` 7.2.3, Kleppmann on locking).
   - `#tiep-theo`: FR-M2-02 ↔ R47, FR-M2-03 ↔ Bài 02, FR-M2-04 ↔ R32, FR-M2-05 ↔ R46, FR-M2-06 hub Redis on 6380; Boss Challenge 2 (`executeImportExport`/`terminateContract`); then K2 Bài 04 Rate Limiting.
   - GUIDE_DATA with `SLIDES` (46) and `EXAM`; theme key `l06-theme`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| stub build | writes the guide with stub stages | `node assembly/assemble.mjs --allow-stubs` |
| shell checks | V01–V04, V09, V10, V14 GREEN | `node verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14` |
| leftover lesson-07 text (negative) | `grep -c "l07-\|Bài 07 khép" ` on the stub = 0 | grep |

## Verification
Both commands above; the stub opens in Chrome without console errors (`node verify/widget-smoke.mjs --no-widgets`).

## Risks and rollback
Copying risks stale lesson-07 strings; V09 and the grep catch them. Rollback: delete `assembly/`.

=== FILE: phase-06-stage-fragments.md ===
---
phase: 6
title: "Stage fragments (3 delegates)"
status: pending
priority: P1
effort: 2h
dependencies: [1, 4]
---

# Phase 06 — Stage fragments

## Goal
Write the nine stage fragments, their quizzes and widgets in parallel against the frozen contract.

## Files to create/modify (disjoint ownership)
| Delegate | Files (plan folder `assembly/`) |
|---|---|
| D1 | `fragments/stage-01..03.html`, `stage-01..03.quiz.json`, `widgets/w1.js`–`w4.js` |
| D2 | `fragments/stage-04..06.html`, `stage-04..06.quiz.json`, `widgets/w5.js`, `w6.js` |
| D3 | `fragments/stage-07..09.html`, `stage-07..09.quiz.json`, `widgets/w7.js`–`w10.js` |

Delegates read `contract.md`, plan.md, this file, `runs/`, `runs/data/`, the lab files, the slides `.md` (cite "Trang N") and one lesson-07 fragment as model. They modify only their files, never the lab files, runs or shell. Brief includes the reports path and the status block.

## Fragment format (frozen)
- `<section id="chang-N" class="stage col">` with `stage-head` (`0N`, "slide a–b · N phút · tùy chọn …") and `p.goal`.
- Order: `div.story` (F&B/OmniPOS question) → inline SVG (token colours) or widget → `dl.wwh` → `figure.slide-fig` per image in `../../Tài Liệu/advanced_backend/assets/6_Redis/` → per-slide `.sayvs` callout ("Slide nói / Redis 7.2.3 đo được") + chip (`id="sl-NN"` on PART/FIX).
- Commands via `<!--@CMD …@-->`; output = `div.run-label` "Kết quả đã chạy trên máy bạn ngày dd/mm/yyyy" + `pre[data-run]` (`…` excerpts); a stats table of `b.m[data-run]` cells; `div.check30` with folded answer.
- Two-client steps: `table.walk` (# / Terminal A / Terminal B / Ghi lại, `data-store="l06-cN-…"`) + recorded timeline.
- `callout teacher` "Làm mẫu", then `div.callout.challenge#chang-N-tu-lam` (task, PASS, self-check command, folded answer), then `<div class="quiz" data-quiz="N"></div>`.
- Widgets: IIFE helpers only, read `run('wN')`, guard null, simulators labelled "mô hình", controls ≥ 44 px.

## Per-stage challenges (content = stage map + matrix rows)
1. Show `KEYS *` on 200k keys blocks terminal B's PING; PASS = B's gap ≥ the SLOWLOG duration.
2. Store a menu item three ways and choose by `MEMORY USAGE` and access pattern.
3. Predict, then measure, how long 10,000 keys with 50 % expired take to clean (W4 first).
4. Pick a policy for the hub's cache-only Redis (128 MB, ADR-010) and prove it on 2 MB.
5. Configure the persist container so a kill loses 0 of 500 writes; PASS = DBSIZE 500.
6. Rebuild a top-5 best-seller ZSET from given order lines; PASS = equals the expected list.
7. Find the biggest `l06:*` key with `--bigkeys` and remove it with no SLOWLOG entry.
8. Name user 34's cart and session keys so `MSET` works on the cluster container.
9. Make store 7's bucket refuse with a correct retry; PASS = 10 of 20 allowed, retry ms > 0.
Stage 9 also carries the capstone links: Lua unlock = L02 lab 06, fencing = L14 `version`/conditional UPDATE, and one honest Redlock paragraph (fencing still needed). Stage 8 labels Sentinel "chưa đo trên máy".

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment checks (V05–V07, V09, V12, V16) | exit 0 per fragment | `node verify/verify-guide.mjs --fragment assembly/fragments/stage-0N.html` |
| quiz shape | 4 × {q, opts[4], ans 0–3, why citing a run} | same (V11 part) |
| ownership | delegates touched only their files | `git status --porcelain` filtered by paths |

## Verification
All nine `--fragment` runs exit 0; controller reads each fragment once for teaching flow.

## Risks and rollback
Delegates may invent numbers; V07/V16 reject them. Rollback: delete a fragment and re-run its delegate.

=== FILE: phase-07-assemble-verify.md ===
---
phase: 7
title: "Assemble and verify"
status: pending
priority: P1
effort: 0.75h
dependencies: [5, 6]
---

# Phase 07 — Assemble and verify

## Goal
Build the full guide and prove it with the verifier, negative tests, widget smoke and render-check.

## Files to create/modify (controller)
`D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html` (generated), plan folder `verify/render/`, `verify/render-dark/`, `verify/tmp/`.

## Tasks and steps
1. `node assembly/assemble.mjs` (no stubs).
2. `node verify/verify-guide.mjs` (V01–V17) and `--runs`, `--data`.
3. `bash verify/negative-tests.sh` (cases a–l).
4. `node verify/widget-smoke.mjs` (every widget, each quiz once, theme toggle).
5. `TMP="$PWD/plans/261031-1651-lesson-06-redis-teacher-guide/verify/tmp" TEMP="$TMP" node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs reports/advanced_backend/lesson_06_redis_teacher_guide.html --out plans/261031-1651-lesson-06-redis-teacher-guide/verify/render`, then the same on a copy with `data-theme="dark"` → `verify/render-dark`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| full verify | exit 0 | step 2 |
| negative tests | `12/12 ca RED đúng thiết kế` | step 3 |
| widget smoke | 0 exceptions, every widget renders content | step 4 |
| render light/dark | 0 errors, 0 overflow, 0 targets < 44 px at 375/768/1440 | step 5 |

## Verification
The four commands above; `ls -l` size ≤ 340 KB.

## Risks and rollback
Overflow in wide transcripts: `pre` scrolls inside its box, never the page. Rollback: re-assemble after fixing fragments.

=== FILE: phase-08-ultra-review-fixes.md ===
---
phase: 8
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1.25h
dependencies: [7]
---

# Phase 08 — Ultra code review and fixes

## Goal
Run `/ak:code-review --ultra` (5 independent reviewers + verifier, union of verified findings) and close every Critical/Important finding.

## Files to create/modify
`verify/review-packet.md` (controller) — scope: the guide, `labs/lesson-06-redis/*`, `assembly/*`, `verify/*`, `runs/` (read-only for reviewers). Fixes by the controller only.

## Tasks and steps
1. Packet: goal, acceptance criteria, matrix, the PART/FIX claims to re-check, safety and no-git rules.
2. Fix each verified finding at its source (lab file, fragment, shell), never in a run; a changed region is re-recorded.
3. Re-run affected checks: touched regions, `--runs`, `--data`, full verify, negative tests, widget smoke, render-check if layout changed.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| findings closed | 0 open Critical/Important in the review verdict | review report |
| regressions | phase-07 commands all GREEN again | phase-07 steps 2–5 |
| lab still clean | `check` all ✔, safety diff exit 0 | `record.sh redis advance-be-redis check`, `safety.sh diff` |

## Verification
As in the test matrix; rejected findings carry a one-line evidence note (file:line or run).

## Risks and rollback
A finding may ask to reverse a settled decision (e.g. Node harness); reject with the evidence-packet citation. Rollback: per-file revert from the pre-fix copy in `verify/tmp/`.

=== FILE: phase-09-docs-final-gate-handoff.md ===
---
phase: 9
title: "Docs, final gate, handoff"
status: pending
priority: P1
effort: 0.5h
dependencies: [8]
---

# Phase 09 — Docs, final gate, handoff

## Goal
Link the guide and labs where the learner looks, prove the final state, and leave a short handoff.

## Files to create/modify (controller)
- `D:/study/advance-be/README.md` — add `labs/lesson-06-redis/` (redis-cli) to the labs line and the guide to the guide list.
- `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` — row 06: guide + lab links.
- `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` line with "Sau đó sang Cụm 2 với Bài 06 Redis." — wrap "Bài 06 Redis" in `<a href="lesson_06_redis_teacher_guide.html">` (one-line edit; the same line in `plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/shell-tail.html` so a rebuild keeps it). Skip if it is not a one-line change.
- `D:/study/advance-be/plans/handoffs/lesson06-redis-guide-<date>.md`; `verify/final-gate.md`.

## Tasks and steps
1. Read each doc, edit the smallest surface, quote the original line in `final-gate.md`.
2. Final gate: full verify, `--runs`, `--data`, negative tests, `check` all ✔, `safety.sh diff` against `runs/safety-before.txt`, `docker ps --filter name=advance-be-redis` (main up, extras stopped), lesson-07 verifier still GREEN after its one-line edit, `git status --porcelain`.
3. Handoff (≤ 30 lines): what exists, how to start (compose up, seed, check), study order, open items, no commit made.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| lesson 07 not broken | its verifier exit 0 | `node plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs` |
| links resolve | README/TONG_QUAN paths exist | `ls` each linked path |
| git scope | only new lesson-06 paths, plan folder, the three doc edits, handoff | `git status --porcelain` |
| foreign containers | safety diff exit 0 | `bash verify/safety.sh diff …` |

## Verification
`final-gate.md` table with every row pass; no git command other than `git status`.

## Risks and rollback
The lesson-07 edit could break its V02; revert to the quoted original. Rollback for docs: restore the quoted lines.
