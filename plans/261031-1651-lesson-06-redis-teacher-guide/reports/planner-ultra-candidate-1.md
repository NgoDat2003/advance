=== FILE: plan.md ===
---
title: "Lesson 06 Redis teacher guide (redis-cli-first, Redis 7.2.3-measured)"
description: "Single-file Vietnamese teacher guide for Lesson 06 (46 slides + 8 evidence blocks) backed by small redis-cli command files on advance-be-redis* lab containers."
status: pending
priority: P1
effort: 11.75h
branch: main
tags: [lesson-06, redis, teacher-guide, redis-cli, lua, distributed-lock, tdd]
blockedBy: []
blocks: []
created: 2026-10-31
---

# Lesson 06 — Redis teacher guide

## Overview

Build `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html` on the lesson-07 single-column shell (no rail) so Đạt can study it on 2026-11-02 in about 4h50 of core time. Every experiment is a small command file in `D:/study/advance-be/labs/lesson-06-redis/` (`.redis` = plain redis-cli lines, `.sh` = docker/redis-cli one-liners, `lua/l06-lib.lua` = one Redis 7 function library) that he runs himself in `redis-cli`; the controller runs the same files non-interactively, records output verbatim in `runs/`, and `verify/verify-guide.mjs` (copied from lesson 07 and adapted) proves every number and every command block traces to a lab file and a run. The `check.sh`, `expected.tsv` and the verifier are written before any experiment or HTML. All Redis writes go to containers named `advance-be-redis*` from one compose file; no Postgres schema is written, port 6380 is never used, and no git command other than `git status` runs.

Abbreviations used below: `PLAN` = `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide`, `LABS` = `D:/study/advance-be/labs/lesson-06-redis`, `GUIDE` = the HTML path above.

## Facts that shaped the design (measured by this planner, 2026-10-31, read-only)

- `redis-cli` sends `#` lines as commands (`ERR unknown command '#'`), so `.redis` files have no comments. Region and step markers are real commands (`ECHO "#region <id> - <ascii title>"`, `ECHO "#endregion"`, `ECHO "A1 ..."`); explanations live in the guide.
- `--no-raw` gives piped output the interactive format (`(integer) 1`) but escapes UTF-8 (`Ch\xe1\xba\xb7ng`). Runner and learner both use `--no-raw`; lab-file text is ASCII.
- Current `advance-be-redis`: anonymous `/data` volume, `DBSIZE 0`. Defaults: `io-threads 1`, `io_threads_active:0`, `epoll`, hash listpack 512/64, `set-max-intset-entries 512`, set/zset listpack 128, `lazyfree-lazy-* no`, `active-expire-effort 1`, `aof-use-rdb-preamble yes`, `appendfsync everysec`.
- `docker stop` (SIGTERM) saves on shutdown, so data loss needs `docker kill -s KILL`. A process kill keeps AOF `everysec` data (already in the page cache); only OS crash or power loss loses it. `CONFIG SET` is not persisted, so the AOF restart test uses a container started with `--appendonly yes`.
- `redis-benchmark -t set,get` writes `key:__rand_int__`, so benchmarks use custom commands on `l06:*` keys.

## Data flow

1. `LABS/compose.yaml`: `advance-be-redis` (6379, debug `local`, labs mounted read-only at `/lab`) plus profile containers `-replica`, `-rdb`, `-aof`, `-cluster` without host ports.
2. `00-setup.sh` loads `lua/l06-lib.lua` (`FUNCTION LOAD REPLACE`) and pipes the idempotent `00-seed.redis`.
3. `verify/run-lab.sh` pipes a region (or A/B pair) into `redis-cli --no-raw`, or runs a `.sh` region with `bash -v`, into dated `runs/*.txt` (+ `.A/.B/.timeline.txt`).
4. `make-widget-data.cjs` → `runs/data/wN.json` with `sources`; `runs/MANIFEST.sha256` freezes runs.
5. Delegates write fragments/widgets against `contract.md`; `assemble.mjs` copies each `pre[data-cmd]` from `LABS` byte-for-byte and inlines widget JSON.
6. `GUIDE` → verifier, negative tests, render-check, ultra review, docs, handoff.

## Stage map (study day 2026-11-02)

| Stage | Slides | Topic | Core min | Optional | Lab files (run regions) | Widget |
|---|---|---|---|---|---|---|
| 0 `#cach-hoc` | 1–3 | setup, run method, warm-up, links to Bài 02 (no re-teach) | 15 | – | 00-setup.sh, check.sh | – |
| 1 | 4, 5, 10–14 | single thread, epoll, bio threads, I/O threads off, RTT vs pipeline | 30 | 10 (`--latency`) | 01-why-fast.sh/.redis, 01-block.A/B | W1 event loop, W2 RTT calculator |
| 2 | 15, 16, 29–31 | encodings, thresholds, slide 30, lost update | 30 | – | 02-encodings.redis | W3 encoding converter |
| 3 | 17–21 | expire dict, passive vs active, slide 21 | 25 | – | 03-expiry.redis/.sh | W4 expiry simulator |
| 4 | 22, 23 | maxmemory, OOM, lru/ttl/lfu | 20 | 10 (volatile-lru trap) | 04-eviction.redis | W5 eviction viewer |
| 5 | 24–27 | SAVE/BGSAVE, AOF, hybrid, kill vs stop | 30 | 10 (AOF files) | 05-persistence.sh | W6 crash matrix |
| 6 | 28, 32–37 | INCR, queue, cart, Set, ZSET, delay task | 35 | 10 (SINTER cost) | 06-structures.redis, 06-queue.A/B, 06-poller.A/B | W7 poller replay |
| 7 | 6–9 | replica lag + stale read, Sentinel (diagram), slots | 30 | – | 07-replica.sh, 07-cluster.sh | W8 slot calculator |
| 8 | 38, 39 | big keys, DEL vs UNLINK, hashtag, CROSSSLOT | 20 | – | 08-bigkeys.redis/.sh, 08-hashtag.redis | – |
| 9 | 40–42 | lock capstone, fencing, Redlock caveat, token bucket, idempotency | 40 | 10 (bucket A/B by hand) | 09-lock.redis, 09-lock-race.A/B, 09-ratelimit.redis, 09-bucket.A/B, 09-idempotency.redis | W9 lock lanes, W10 bucket |
| Wrap | 43–46 | homework, driver drill, interview, cheat sheet, map, references | 20 | 45 (homework) | homework/*, driver-drill/* | – |
| **Total** | 46 | | **295** | **105** | | |

Slide chips (frozen in contract §6). OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`, `–` = null chip.
- null: 1, 2, 3, 10, 11, 15, 17, 22, 24, 28, 29, 36, 44, 45, 46
- OK: 4, 6, 7, 9, 18, 19, 26, 30, 31, 37, 38, 39, 41, 42, 43
- PART: 5, 8, 12, 13, 14, 16, 20, 23, 25, 27, 32, 33, 34, 35
- FIX: 21, 40

Slide 5 (Memcached) and 7 (Sentinel) are not measured on this machine; the narrative says so and cites redis.io / memcached docs.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract, containers, run-method smoke](phase-01-contract-containers-smoke.md) | 0.75h | – | contract v1 frozen; fingerprint-before recorded; compose `advance-be-redis` up; `runs/00-run-method-smoke.txt` decides the learner method |
| 02 | [Tests first](phase-02-tests-first.md) | 1.25h | 01 | `check.sh` prints ✘ (not an error) on an unseeded server; `--runs` RED "missing run" for every row; `--selftest` GREEN |
| 03 | [Lab files and recorded runs](phase-03-lab-files-recorded-runs.md) | 3.5h | 02 | `check.sh` all ✔; seed rerun gives identical check output; `--runs` GREEN or each miss in `deviations.md`; MANIFEST written; fingerprint-after = before |
| 04 | [Widget data, homework, driver drill](phase-04-widget-data-homework-drill.md) | 1h | 03 | `--data` GREEN; `hw-check.mjs` PASS on solution, ✘ H4/H5 on bad fixture; driver claims sourced |
| 05 | [Guide shell and assembler](phase-05-guide-shell-assembler.md) | 1h | 03 (parallel with 06) | `assemble.mjs --allow-stubs` builds; V01–V04, V09, V10, V14, V15 pass on the stub build |
| 06 | [Stage fragments (3 delegates)](phase-06-stage-fragments.md) | 2h | 01, 04 | `--fragment` exit 0 per stage; `node --check` per widget |
| 07 | [Assemble and verify](phase-07-assemble-verify.md) | 0.75h | 05, 06 | full verify GREEN; negative tests 12/12 RED as designed; render-check clean light and dark |
| 08 | [Ultra code review and fixes](phase-08-ultra-review-fixes.md) | 1h | 07 | no open Critical/Important; affected checks re-run |
| 09 | [Docs, final gate, handoff](phase-09-docs-final-gate-handoff.md) | 0.5h | 08 | final gate table all pass; handoff written |

## Expected-result matrix (frozen in `PLAN/verify/expected.tsv` in phase 02, before any run)

"n" = whatever the run records; the row asserts shape or a relation (`rel` column, named regex groups). Run id = `<file-stem>.<region>` (A/B pairs: `.timeline`).

| ID | Run#region | Slide | Expected Redis 7.2.3 result | Chip |
|---|---|---|---|---|
| X01 | 01-why-fast.sh#threads | 13, 14 | `io-threads 1`, `io_threads_active:0`, `multiplexing_api:epoll`; `/proc/1/task/*/comm` lists one `redis-server` plus `bio_close_file`, `bio_aof`, `bio_lazy_free`, `jemalloc_bg_thd` | 13 PART, 14 PART |
| X02 | 01-block.block.timeline | 13 | B's `PING` (sent 0.5 s after A's `DEBUG SLEEP 2`) is answered only after A ends; B wait ≥ 1000 ms | PART |
| X03 | 01-why-fast#slowlog-keys | 13, 41 | `KEYS` over 1,000,000 keys (db 1) in `SLOWLOG` with n µs ≥ 10,000; `SCAN … COUNT 1000` < 1,000 µs | 41 OK |
| X04 | 01-why-fast.sh#bench | 12 | custom `GET l06:bench:k`: `-P 16` rps ≥ 5 × `-P 1` rps | PART |
| X05 | 01-why-fast.sh#payload | 12 | `GET` of a 16 KB value: rps < rps of a 1-byte value | PART |
| X06 | 01-why-fast.sh#mget | 41 | `MGET` of 10 keys: keys/s ≥ 3 × single `GET` keys/s | OK |
| X07 | – | 5 | not measured (no Memcached); cited | PART |
| X08 | 02-encodings#string | 31 | `int` (10), `embstr` (44 chars), `raw` (45 chars), `APPEND` → `raw` | OK |
| X09 | 02-encodings#hash-threshold | 16, 33 | 4 / 512 fields `listpack`; 513 → `hashtable`; one 65-byte value → `hashtable`; `HDEL` back to 4 fields stays `hashtable` | PART |
| X10 | 02-encodings#set-zset | 34, 35 | ints ≤ 512 `intset`; ≤ 128 strings `listpack`; 129 → `hashtable`; zset 128 `listpack`, 129 → `skiplist` | PART |
| X11 | 02-encodings#mem | 30 | `MEMORY USAGE` 4-field hash = n, JSON string = n (both reported) | OK |
| X12 | 02-encodings#lost-update | 30 | two read-modify-write JSON updates → age 31 (one lost); two `HINCRBY` → 32 | OK |
| X13 | 02-encodings#htstats | 16, 18, 21 | `DEBUG HTSTATS 0` shows a main dict and a separate expires dict (`[Expires HT]`); no ZSET | 21 FIX |
| X14 | 03-expiry#ttl | 18 | `TTL` > 0, `PERSIST` → -1, missing → -2 | OK |
| X15 | 03-expiry#passive | 19 | active expire off: after expiry `DBSIZE` 1000 and `expires=1000`; one `GET` → nil, `expired_keys` +1, `DBSIZE` 999 | OK |
| X16 | 03-expiry.sh#active | 20 | active on, no access: `INFO keyspace` expires falls to 0 within n ms; non-volatile keys stay | PART |
| X17 | 04-eviction#noeviction | 22, 23 | default policy `noeviction`; after fill `SET` → `OOM command not allowed`; `GET` still works | PART |
| X18 | 04-eviction#allkeys-lru | 23 | `evicted_keys` > 0; hot survivors > cold survivors | PART |
| X19 | 04-eviction#volatile-ttl | 23 | short-TTL keys go first; all no-TTL keys survive | PART |
| X20 | 04-eviction#allkeys-lfu | 23 | `OBJECT FREQ` hot > cold; hot survivors > cold survivors | PART |
| X21 | 04-eviction#volatile-lru-trap | 23 | no volatile keys → OOM despite an evicting policy (optional) | PART |
| X22 | 04-eviction#restore | – | `maxmemory 0`, `noeviction`; fixtures re-seeded | – |
| X23 | 05-persistence.sh#config | 26 | main: `save "3600 1 300 100 60 10000"`, `appendonly no` | OK |
| X24 | 05-persistence.sh#save-vs-bgsave | 26 | 500,000 keys: `SAVE` in SLOWLOG n µs; `BGSAVE` → `Background saving started`; `latest_fork_usec` n; status ok | OK |
| X25 | 05-persistence.sh#rdb-kill | 25, 26 | after `docker kill -s KILL`: key before BGSAVE `1`, key after `0` | OK |
| X26 | 05-persistence.sh#rdb-stop | 26 | after `docker stop`: both keys `1` (shutdown save) | OK |
| X27 | 05-persistence.sh#aof-kill | 25 | AOF container, key written then killed at once: `1` after restart | PART |
| X28 | 05-persistence.sh#hybrid | 27 | `appendonlydir/` holds manifest, `*.base.rdb` starting `REDIS`, `*.incr.aof` with RESP `*3` | PART |
| X29 | 06-structures#counter | 31 | `INCR` ×3 → 3; `INCRBY` on non-integer → `ERR value is not an integer` | OK |
| X30 | 06-queue.brpop.timeline | 32 | consumer `BRPOP` blocks until producer `LPUSH`; two consumers get different messages | PART |
| X31 | 06-structures#reliable-queue | 32 | `BLMOVE` → processing list length 1 until `LREM` ack → 0 | PART |
| X32 | 06-structures#cart | 33 | slide 33 commands: `HSET` 1, `HINCRBY` 2, `HLEN` 2, `HDEL` 1, `HGETALL` | PART |
| X33 | 06-structures#set | 34 | `SINTER` common followers; optional: `SINTER` of 2 × 100,000 in SLOWLOG n µs | PART |
| X34 | 06-structures#zset | 35 | `ZINCRBY` best-sellers; `ZREVRANGE … WITHSCORES` top 3; `ZRANK` | PART |
| X35 | 06-structures#delay-naive | 37 | two pollers both read `o1`; `ZREM` → 1 then 0 | OK |
| X36 | 06-poller.claim.timeline | 37 | two concurrent `FCALL l06_claim_due` over 200 jobs: A + B = 200, overlap 0 | OK |
| X37 | 07-replica.sh#sync | 6 | `role:slave`, `master_link_status:up`; replica `GET` = master value; `WAIT 1 1000` → 1 | OK |
| X38 | 07-replica.sh#readonly | 6 | `SET` on replica → `READONLY` | OK |
| X39 | 07-replica.sh#partition | 6, 8 | replica disconnected: master `SET` OK, `WAIT 1 1000` → 0, replica `GET` old value, link down; reconnect → new value | 6 OK, 8 PART |
| X40 | 07-cluster.sh#keyslot | 9 | main → `ERR This instance has cluster support disabled`; cluster node `cluster_state:ok`, 16384 slots; KEYSLOT of 10 keys recorded, `{34}` keys share a slot | OK |
| X41 | 08-bigkeys#del-vs-unlink | 38 | 1,000,000-field hash: `DEL` n µs ≥ 20 × `UNLINK` µs; `lazyfree-lazy-user-del yes` makes `DEL` fast; restored `no` | OK |
| X42 | 08-bigkeys.sh#find | 38 | `--bigkeys` names `l06:big:hash`; `MEMORY USAGE` n bytes | OK |
| X43 | 08-hashtag#crossslot | 39 | `SINTER l06:user_profile:34 l06:user_session:34` → `CROSSSLOT`; with `{34}` → works | OK |
| X44 | 09-lock-race.race.timeline | 40 | simultaneous `SET … NX PX`: exactly one `OK`, one `(nil)` | FIX |
| X45 | 09-lock#wrong-del | 40 | A's lock expires during "GC pause"; B acquires; A's `DEL` → 1; C acquires → two holders | FIX |
| X46 | 09-lock#fencing | 40 | `INCR` fence 1, 2; `l06_fenced_write` token 2 OK, token 1 → `STALE` | FIX |
| X47 | 09-ratelimit#bucket | 42 | capacity 10, slow refill: 30 calls → 10 allowed, 20 denied with retry_after_ms n (FR-M2-05) | OK |
| X48 | 09-bucket.atomic.timeline | – | A and B each 200 calls on capacity 300, refill 0: allowed A + B = 300 | – |
| X49 | 09-idempotency#flow | – | `NEW`, `PROCESSING`, `REPLAY` with stored body, `CONFLICT` on other hash (FR-M2-02) | – |
| X50 | hw-check | 43 | solution H1–H6 ✔; bad fixture ✘ only H4, H5 | OK |

## Acceptance criteria (Pnn = phase that delivers it)

1. `GUIDE` ≤ 360 KB, no external script, only Google Fonts external (P07, V01, V10).
2. `SLIDES` covers 1–46 exactly once and chips equal contract §6 / `expected.tsv` (P05, P07, V04).
3. Each stage 1–9 has goal, `dl.wwh`, story → diagram → measured table → 30-second check, a byte-exact `pre[data-cmd]`, a recorded run, a worked example, a `callout challenge` with PASS criteria, and 4 quiz questions (P06, V05, V11, V12).
4. Every `b.m`, `pre[data-run]` and `run-wN` value traces to a `runs/` file whose date label matches; `runs/MANIFEST.sha256` verifies (P03, P04, P07, V06–V08, V13).
5. Every `expected.tsv` row matches, or has a `deviations.md` entry plus a changed chip/narrative (P03).
6. `check.sh` prints only ✔: version 7.2.3, only `l06:` keys in db 0/1, config restored, active expiry on, fingerprints of non-lab containers unchanged, nothing on 6380 (P03, P09).
7. Re-running `00-setup.sh` gives byte-identical `check.sh` output (P03).
8. Storage keys only `l06-*`, no rail, dark and light both work (P07, V09, V14, V15).
9. render-check 375/768/1440, light and dark: 0 runtime errors, 0 overflow, 0 targets < 44 px (P07).
10. Homework self-check and driver drill exist; drill claims cite published sources (P04).
11. No open Critical/Important review finding (P08).
12. README, TONG_QUAN row 06 and (one line) lesson 07 `#tiep-theo` link the guide; handoff exists; `git status --short` lists only planned paths; no branch/commit/push (P09).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| Timing runs (block, DEL vs UNLINK, benchmark) vary | M×M | Relational assertions only; run 3×, keep the median run, narrate the spread; labels say "máy bạn, 31/10/2026". |
| Eviction outcome is probabilistic (sampled LRU/LFU) | M×M | Assert hot > cold, not exact counts; sleep ≥ 2 s between phases (LRU clock is 1 s); record `maxmemory-samples`. |
| Allkeys policies evict seed fixtures | H×L | `#restore` re-runs the seed; `check.sh` C07 proves fixtures. |
| Persistence kills hit the wrong container | L×H | Kills target only `advance-be-redis-rdb`/`-aof` by exact name; C03 fingerprint before/after. |
| DBX console cannot run multi-line regions | M×L | Phase 01 smoke decides; fallback is `redis-cli` paste or whole-file pipe. |
| A measurement contradicts a slide or this matrix | M×M | Keep data, change chip/narrative, log in `deviations.md`, bump contract version. |
| Git Bash rewrites `/lab/...` paths | M×M | Smoke test both shells; guide sets `MSYS_NO_PATHCONV=1` once or uses PowerShell. |
| HTML over budget | L×M | Excerpt runs with `…`, fold long outputs, V01 enforces. |

Rollback: `LABS/99-cleanup.sh` removes `l06:*` keys (SCAN + UNLINK, db 0/1) and the profile containers and volumes; `docker compose -f LABS/compose.yaml down -v` removes everything this plan created. All other files are new except four doc lines whose original text phase 09 quotes.

## Open questions for the user

None blocking. One confirmation: the 295-minute core sits at the top of the 4–5 h budget, like lesson 07. If Đạt wants 4 h, stage 8 and the stage 6 queue regions can move to the evening without dropping content.

=== FILE: phase-01-contract-containers-smoke.md ===
---
phase: 1
title: "Contract, containers, run-method smoke"
status: pending
priority: P1
effort: 0.75h
dependencies: []
---

# Phase 01 — Contract, containers, run-method smoke

## Goal
Freeze the names every later phase depends on, put the lab containers under one compose file, record a safety fingerprint, and decide how Đạt runs commands.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/contract.md`
- `D:/study/advance-be/labs/lesson-06-redis/compose.yaml`
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/runs/00-fingerprint-before.txt`, `runs/00-run-method-smoke.txt`

## Tasks and steps
1. Fingerprint (read-only): `docker ps -a --format '{{.Names}}\t{{.ID}}\t{{.Image}}\t{{.State}}\t{{.Ports}}'` filtered to names not starting with `advance-be-redis`, plus `netstat -ano | grep ':6380 '` (expected empty) → `00-fingerprint-before.txt`.
2. Write `compose.yaml` (top-level `name: advance-be-redis`, image `redis:7.2.3` everywhere, no pull):
   - `redis`: `container_name: advance-be-redis`, `ports: ["6379:6379"]`, `command: redis-server --appendonly no --enable-debug-command local`, named volume `advance-be-redis-data:/data`, bind `./:/lab:ro`.
   - profile `replica`: `advance-be-redis-replica`, `--replicaof advance-be-redis 6379 --enable-debug-command local`, no ports.
   - profile `persist`: `advance-be-redis-rdb` (`--appendonly no --enable-debug-command local`) and `advance-be-redis-aof` (`--appendonly yes --appendfsync everysec --enable-debug-command local`), each with its own named volume, no ports.
   - profile `cluster`: `advance-be-redis-cluster` (`--cluster-enabled yes --appendonly no --save ""`), no ports.
   - A header comment in Vietnamese: why debug is `local` (DEBUG works from `docker exec`, refused from DBX on the host), never port 6380.
3. Recreate the main container (it is ours, `DBSIZE 0`): `docker exec advance-be-redis redis-cli DBSIZE` must print 0 first, then `docker rm -f -v advance-be-redis`, then `docker compose -f labs/lesson-06-redis/compose.yaml up -d redis`.
4. Run-method smoke → `00-run-method-smoke.txt`:
   - M1 whole-file pipe, PowerShell and Git Bash: `docker exec -i advance-be-redis sh -c "redis-cli --no-raw < /lab/smoke.redis"` on a temp 3-line file (`ECHO "#region smoke - thu"`, `PING`, `ECHO "#endregion"`); note whether Git Bash needs `MSYS_NO_PATHCONV=1`. Delete the file after phase 02.
   - M2 interactive `docker exec -it advance-be-redis redis-cli`: no TTY for the controller, so the warm-up is the confirmation (paste the 3 lines, compare with the recorded output).
   - M3 DBX `ADVANCE_BE_REDIS` console: `PING`, a 3-line paste, `ECHO` with spaces, `DEBUG SLEEP 0` (expected refusal).
   - Rule: M2 primary (single commands, all two-terminal steps); M1 reproduces a recorded file; DBX = key browser and single-command console if multi-line fails.
5. Write `contract.md` v1:
   - §1 keys: `l06:<topic>:*` per stage (`enc, exp, ev, p, q, cart, best, delay, repl, big, lock, rl, idem, hw`), fixtures `l06:fx:*`, learner `l06:my:*` (never deleted by stage files), db 1 = scratch for 1M keys; Lua library `l06`: `l06_unlock`, `l06_claim_due`, `l06_fenced_write`, `l06_token_bucket`, `l06_idem_begin`.
   - §2 formats: `.redis` = no comments, ASCII, `ECHO` markers, each region first `UNLINK`s its own keys, an expected error is a region's last command; `.sh` = `# region <id> · <tiêu đề>` … `# endregion`, one command per line, Vietnamese comments; config changes revert inside the same region.
   - §3 run ids: `runs/<stem>.<region>.txt` (+ `.A/.B/.timeline`); `data-run` = `<stem>#<region>` or `<stem>.<region>.timeline`; widget data `run-w1…w10`.
   - §4 fragment format and CSS (lesson 07 §4/§7, `data-sql` → `data-cmd`; new `.term2`, `.lanes`, `.slotbar`, `.bucket`). §5 learner workflow. §6 slide → stage → chip → anchor (`id="sl-NN"` on PART/FIX).
   - Storage keys `l06-c<N>-<slug>`, `l06-warmup`, `l06-theme`, `l06-hw-*`, `l06-drill-*`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| no 6380 listener | empty | `netstat -ano \| grep ':6380 '` |
| main recreated | `redis_version:7.2.3`, `enable-debug-command local` | `docker exec advance-be-redis redis-cli CONFIG GET enable-debug-command` |
| bind mount | file listed | `docker exec advance-be-redis ls /lab/compose.yaml` |
| DEBUG local only | `docker exec` OK; DBX refused | smoke file |
| compose config valid | exit 0 | `docker compose -f labs/lesson-06-redis/compose.yaml config -q` |
| contract complete | 46 slide rows | `grep -c '^| [0-9]' assembly/contract.md` (≥ 46 counting ranges expanded) |

## Verification
`cat runs/00-run-method-smoke.txt`; `docker ps --filter name=advance-be-redis --format '{{.Names}} {{.Ports}}'` shows only `advance-be-redis 0.0.0.0:6379->6379/tcp`.

## Risks and rollback
Compose name clash with the old container: step 3 removes it first. If a bind mount of `D:` fails, fall back to `docker cp` of `LABS` into `/lab` (recorded in contract §5). Rollback: `docker compose … down -v`; the controller's original `docker run` line is in the evidence packet.

=== FILE: phase-02-tests-first.md ===
---
phase: 2
title: "Tests first: check, expected matrix, verifier, runner"
status: pending
priority: P1
effort: 1.25h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Write every checker before the experiments and HTML it judges, and prove each one fails on the current empty state.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/labs/lesson-06-redis/check.sh`
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/verify/expected.tsv`
- `…/verify/verify-guide.mjs` (copy of lesson 07's, adapted)
- `…/verify/run-lab.sh`, `…/verify/merge-timeline.mjs` (copies, adapted)
- `…/verify/negative-tests.sh` (copy, cases rewritten), `…/verify/fixtures/selftest/*`, `…/verify/widget-smoke.mjs`
- `…/verify/deviations.md` (header only)

## Tasks and steps
1. `check.sh` (Vietnamese comments, ~60 lines, learner-runnable in Git Bash) prints `Cnn ✔|✘ chi tiết`, exit 1 on any ✘:
   - C01 `advance-be-redis` up, `redis_version:7.2.3`, port 6379.
   - C02 nothing publishes or listens on 6380.
   - C03 non-lab container lines equal `runs/00-fingerprint-before.txt` (name, id, image, state).
   - C04 config baseline on main: `maxmemory 0`, `maxmemory-policy noeviction`, `appendonly no`, `lazyfree-lazy-user-del no`, `slowlog-log-slower-than 10000`, `latency-monitor-threshold 0`, `hz 10`.
   - C05 active expiry works: `SET l06:chk:exp v PX 50`, `sleep 1.2`, `expired_keys` rose without reading the key.
   - C06 only `l06:` keys in db 0 and db 1 (`redis-cli --scan` piped through `grep -v '^l06:'` is empty).
   - C07 fixtures: `l06:fx:user:1` hash has 4 fields and `listpack`; `l06:fx:user:1:json` is a string; `FUNCTION LIST LIBRARYNAME l06` shows 5 functions.
   - C08 optional containers: each is absent or named `advance-be-redis-*` with no host port.
2. `expected.tsv`: columns `id run slides regex rel claim chip status`, rows X01–X50 from plan.md; `rel` uses named groups, e.g. X04 regex `(?<p1>[\d.]+) requests per second[\s\S]*?(?<p16>[\d.]+) requests per second`, rel `p16>=5*p1`. Status `expect`; rows X07 (no run) have run `-`.
3. `verify-guide.mjs` (copy, then adapt): paths → lesson 06; V03 sections `cach-hoc`, `chang-1…9`, `bai-tap`, `driver-drill`, `phong-van`, `cheat-sheet`, `ban-do-slide`, `tham-khao`, `tiep-theo`; V04 slides 1–46 with the 3 chips + null; V05 on `pre[data-cmd]` with per-extension regions (`.redis` ECHO markers, `.sh` `# region`, `.lua`/`.mjs`/`.ts` whole file); V09 `l06-` only. New: V15 no rail; V17 no secrets (`redis://…:…@`, `postgres://…:…@`, `password`); V18 labs scan (no `6380`, no `FLUSHALL`, `FLUSHDB` only right after `SELECT 1`, `.redis` ASCII-only); V19 `sha256sum -c runs/MANIFEST.sha256`. `--runs` evaluates `rel` over numeric captures only.
4. `run-lab.sh`:
   - `run-lab.sh <file> [--region id] [--ct name] [--out name]`: a `.redis` region goes through `docker exec -i <ct> redis-cli --no-raw`; a `.sh` region goes through `bash -v` with `MSYS_NO_PATHCONV=1`. Header line: `-- chạy lúc dd/mm/yyyy HH:MM +0700 · redis_version 7.2.3 · <ct>`.
   - `--ab <A> <B> <region> <delayB>`: A runs in the background, B after the delay, then the timeline is merged.
   - `merge-timeline.mjs`: pairs each `ECHO "A1 …"` marker with the following `TIME` reply, sorts by server µs, and prints `t+ms | A/B | bước | kết quả`.
5. `verify/fixtures/selftest/`: a 10-line fixture guide + lab file + run file; `--selftest` asserts V05 catches a 1-char drift and V07 catches a number absent from its run.
6. `verify/widget-smoke.mjs` (copy of lesson 07's): it loads `assembly/widgets/wN.js` in a `vm` sandbox with `runs/data/wN.json`. Two new cases: w8 CRC16 slot = recorded KEYSLOT for all 10 keys; w10 replay = the recorded 30-call sequence. It stays RED ("missing widget") until phase 06.
7. `negative-tests.sh` (each case mutates a copy next to `GUIDE` or a temp runs dir): a 1-char `data-cmd` drift → V05; b `b.m` number absent from its run → V07; c `l07-` key → V09; d slide 21 removed → V04; e slide 40 chip changed → V04; f `<script src>` → V10; g corrupted run → its X row; h fake number in `w5.json` → `--data`; i one byte changed in a run → V19; j lab copy with `-p 6380` → V18; k `class="rail"` → V15; l `redis://u:p@h` → V17.

## Test matrix
| Test (written first) | Expected now | Command |
|---|---|---|
| check on unseeded server | C07 ✘, others ✔, exit 1, no stack trace | `bash labs/lesson-06-redis/check.sh` |
| check C06 negative | ✘ after `SET l06x:neg 1`; ✔ after `DEL l06x:neg` | `docker exec advance-be-redis redis-cli SET l06x:neg 1 && bash …/check.sh; docker exec advance-be-redis redis-cli DEL l06x:neg` |
| runs RED | every X row "missing run" except X07 | `node verify/verify-guide.mjs --runs` |
| selftest | V05 and V07 caught, exit 0 | `node verify/verify-guide.mjs --selftest` |
| syntax | no error | `node --check verify/verify-guide.mjs && bash -n verify/run-lab.sh && bash -n labs/lesson-06-redis/check.sh` |
| runner smoke | `runs/smoke.smoke.txt` has header + `PONG` | `bash verify/run-lab.sh labs/lesson-06-redis/smoke.redis --region smoke` (temp file, deleted after) |

## Verification
The commands above, run from `PLAN`; all outputs pasted into `runs/02-tests-first.txt`.

## Risks and rollback
A `rel` expression that is never true hides a broken run as a "deviation": each `rel` is checked against the evidence-packet numbers (GET 158,478 vs 1,960,784 → `p16>=5*p1` true). Rollback: delete the files; no Redis state beyond the removed `l06x:neg`.

=== FILE: phase-03-lab-files-recorded-runs.md ===
---
phase: 3
title: "Lab files and recorded runs"
status: pending
priority: P1
effort: 3.5h
dependencies: [2]
---

# Phase 03 — Lab files and recorded runs

## Goal
Write the small command files Đạt will run, run them serially on the lab containers, and record every output that the guide will quote.

## Files to create/modify (owner: controller only; Redis runs are serial)
All under `D:/study/advance-be/labs/lesson-06-redis/`:
- `00-setup.sh`, `00-seed.redis`, `lua/l06-lib.lua`
- `01-why-fast.sh`, `01-why-fast.redis`, `01-block.A.redis`, `01-block.B.redis`
- `02-encodings.redis`
- `03-expiry.redis`, `03-expiry.sh`
- `04-eviction.redis`
- `05-persistence.sh`
- `06-structures.redis`, `06-queue.A.redis`, `06-queue.B.redis`, `06-poller.A.redis`, `06-poller.B.redis`
- `07-replica.sh`, `07-cluster.sh`
- `08-bigkeys.redis`, `08-bigkeys.sh`, `08-hashtag.redis`
- `09-lock.redis`, `09-lock-race.A.redis`, `09-lock-race.B.redis`, `09-ratelimit.redis`, `09-bucket.A.redis`, `09-bucket.B.redis`, `09-idempotency.redis`
- `99-cleanup.sh`

Plus `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/runs/*.txt`, `runs/MANIFEST.sha256`, `runs/00-fingerprint-after.txt`, `verify/record-all.sh`, `verify/deviations.md`, `verify/source-claims.md`.

## Tasks and steps
1. `l06-lib.lua` (`#!lua name=l06`, Vietnamese comments). Lesson 02's `EVAL` compare-and-delete is shown once in stage 9 as the recap; the library is the Redis 7 way:
   - `l06_unlock(lock; token)`: `GET == token` → `DEL`, return 1, else 0.
   - `l06_claim_due(queue; now_ms, n)`: `ZRANGEBYSCORE … LIMIT 0 n` then `ZREM` each, returns the claimed ids.
   - `l06_fenced_write(res; token, value)`: rejects with `STALE` when `token <= HGET fence`, else `HSET fence token value value`.
   - `l06_token_bucket(bucket; capacity, refill_per_s, cost)`: server `TIME`, refill, take; returns `{allowed, tokens, retry_after_ms}`; `PEXPIRE` on the bucket.
   - `l06_idem_begin(key; body_hash, ttl_s)`: returns `NEW` (creates `state=processing`), `PROCESSING`, `REPLAY <body>` or `CONFLICT`. `l06_idem_done` is a plain `HSET` + `EXPIRE` in the `.redis` file, so not every step needs Lua.
2. `00-setup.sh` regions:
   - `up`: `docker compose … up -d redis`;
   - `functions`: `docker exec -i advance-be-redis redis-cli -x FUNCTION LOAD REPLACE < labs/lesson-06-redis/lua/l06-lib.lua`;
   - `seed`: pipe `00-seed.redis`.
   The seed `UNLINK`s then recreates `l06:fx:*`: user hash and JSON (ASCII values), a cart, a 10-item best-seller ZSET for store 1, seat ids `FA634`/`A34_S012C`.
3. Stage files, each region self-cleaning and reverting config:
   - `01-why-fast.sh`: `threads` (`cat /proc/1/task/*/comm`, `CONFIG GET io-threads`, `INFO` grep); `bench` (`redis-benchmark -q -n 100000 GET l06:bench:k`, ± `-P 16`); `payload` (16 KB value via `SETRANGE`); `mget` (10-key `MGET` vs `GET`). `01-why-fast.redis#slowlog-keys`: `SELECT 1`, `DEBUG POPULATE 1000000 l06:k 10`, slowlog threshold 0, `EVAL "return #redis.call('KEYS',ARGV[1])" 0 l06:k:*`, `SCAN 0 MATCH l06:k:* COUNT 1000`, `SLOWLOG GET 3`, restore 10000, `FLUSHDB ASYNC` (scratch db 1 only), `SELECT 0`. `01-block`: A = `ECHO A1`, `TIME`, `DEBUG SLEEP 2`, `TIME`; B = `ECHO B1`, `TIME`, `PING`, `TIME`; delay 0.5 s.
   - `02-encodings.redis`: `string`, `hash-threshold` (513 fields via `EVAL` loop), `set-zset`, `mem`, `lost-update` (one connection interleaves A1 GET, B1 GET, A2 SET age 31, B2 SET age 31, then `HINCRBY` ×2; the guide explains that for non-blocking commands the order, not the connection count, decides the result, and Đạt repeats it in two terminals), `htstats` (`DEBUG HTSTATS 0` with some TTL keys).
   - `03-expiry.redis`: `ttl`; `passive` (`DEBUG SET-ACTIVE-EXPIRE 0`, 1000 keys `PX 200`, `DEBUG SLEEP 0.5`, `DBSIZE`, `INFO keyspace`, one `GET`, `expired_keys`, `DBSIZE`, `DEBUG SET-ACTIVE-EXPIRE 1`). `03-expiry.sh#active`: 10,000 volatile + 1,000 persistent keys, then `redis-cli -r 15 -i 0.2 INFO keyspace` without touching them.
   - `04-eviction.redis`, per policy region: `maxmemory 16mb`, policy, 2,000 cold 1 KB keys, `DEBUG SLEEP 2` (LRU clock is 1 s), read 200 hot keys (LFU: 50 reads each), `DEBUG SLEEP 2`, fill past the limit, count survivors (`EVAL` + `EXISTS`), `evicted_keys`. `noeviction` ends with the OOM `SET`; `restore` resets config and re-seeds. If the fill misses the limit, tune once and log it in `deviations.md`.
   - `05-persistence.sh`: `up-persist`; `config`; `save-vs-bgsave` (500,000 keys on `-rdb`); `rdb-kill` (`SET before`, `BGSAVE`, wait for `LASTSAVE` change, `SET after`, `docker kill -s KILL advance-be-redis-rdb`, `docker start`, wait PING, `EXISTS`); `rdb-stop` (same with `docker stop`); `aof-kill` (on `-aof`: `SET`, kill at once, start, `EXISTS`); `hybrid` (`BGREWRITEAOF`, `ls -l /data/appendonlydir`, `head -c 5` base, `tail -c 200` incr); `teardown` (`compose --profile persist rm -sfv` + volume rm).
   - `06-structures.redis`: `counter`, `reliable-queue` (`BLMOVE … 0.1`), `cart` (slide 33 verbatim), `set` (optional 2 × 100,000 `SINTER`), `zset`, `delay-naive`. `06-queue`: A = `BRPOP l06:q:jobs 5` twice, B = `LPUSH` after 1 s. `06-poller`: 200 due jobs; A and B each `FCALL l06_claim_due 1 l06:delay:jobs <now> 10` ×15; the merge counts ids and overlap.
   - `07-replica.sh`: `up` (wait for `master_link_status:up`, 10 s timeout), `sync`, `readonly`, `partition` (`docker network disconnect advance-be-redis_default advance-be-redis-replica`, master `SET l06:repl:k v2`, `WAIT 1 1000`, replica `GET`, link status, `docker network connect …`, wait, `GET`), `teardown`. `07-cluster.sh`: `up` (`CLUSTER ADDSLOTSRANGE 0 16383`, wait for `cluster_state:ok`), `keyslot` (main's error, then 10 keys incl. `l06:user_profile:{34}`, `l06:user_session:{34}`, `{34}`, `l06:user_profile:34`, `a{}b`, `{}{34}`). A multi-node cluster with `MOVED` is diagram-only, labelled so.
   - `08-bigkeys.redis#del-vs-unlink`: 1,000,000-field hash, `MEMORY USAGE`, slowlog 0, `DEL`, rebuild, `UNLINK`, `lazyfree_pending_objects`, rebuild, `lazyfree-lazy-user-del yes`, `DEL`, restore `no`, `SLOWLOG GET 6`. `08-bigkeys.sh#find`: `--bigkeys -i 0.01`, `--memkeys`. `08-hashtag.redis` runs with `--ct advance-be-redis-cluster` before the cluster teardown.
   - `09-lock.redis`: `recap` (lesson 02's `EVAL` unlock once); `wrong-del` (A `SET l06:lock:seat:FA634:A34_S012C tokA NX PX 200`, `DEBUG SLEEP 0.3` = "A bị GC pause", B `SET … tokB NX PX 5000` OK, A `DEL` → 1, C `SET … NX` OK); `token-unlock` (`FCALL l06_unlock` tokA → 0, tokB → 1); `fencing` (`INCR l06:lock:fence` ×2, `l06_fenced_write` token 2 then 1 → `STALE`). `09-lock-race`: A/B delay 0. `09-ratelimit#bucket`: capacity 10, refill 0.01/s, 30 calls, then `DEBUG SLEEP 1.1` at refill 1/s. `09-bucket` A/B: 200 calls each, capacity 300, refill 0. `09-idempotency#flow`: the 4 outcomes on `l06:idem:pos:invoice:<key>`.
4. `99-cleanup.sh`: `redis-cli --scan --pattern 'l06:*' | xargs -r -n 500 redis-cli UNLINK` on db 0 and db 1, `FUNCTION DELETE l06`, then compose `--profile replica --profile persist --profile cluster rm -sfv`. Not run at the end; it exists for Đạt.
5. `record-all.sh` runs everything in stage order (`check.sh` → setup → stages → `check.sh`), timing runs 3× keeping all three files (`.r1/.r2/.r3`, the guide quotes `.r2` = median and states the spread), then writes `MANIFEST.sha256` and `00-fingerprint-after.txt`.
6. `source-claims.md`: for internals that cannot be observed (expire cycle constants: 20 keys per loop, the 10 % acceptable-stale rule for effort 1, the 25 % CPU budget of the slow cycle; LRU clock resolution; listpack replacing ziplist in 7.0; multi-part AOF in 7.0), quote the line and URL from the Redis 7.2.3 tag on GitHub (`src/expire.c`, `src/server.h`, `src/evict.c`) and the redis.io docs, dated. These back the PART/FIX narrative on slides 20 and 21.
7. Re-run `00-setup.sh#seed` and diff `check.sh` output against the first run.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| matrix GREEN | every X row ✔ or in `deviations.md` | `node PLAN/verify/verify-guide.mjs --runs` |
| invariants | all ✔ | `bash labs/lesson-06-redis/check.sh` |
| seed idempotent | `diff` empty | `bash labs/lesson-06-redis/check.sh > verify/tmp/c1.txt; bash verify/run-lab.sh labs/lesson-06-redis/00-setup.sh --region seed; bash labs/lesson-06-redis/check.sh > verify/tmp/c2.txt; diff verify/tmp/c1.txt verify/tmp/c2.txt` |
| labs safety scan | V18 ✔ | `node verify/verify-guide.mjs --only V18` |
| non-lab untouched | after = before | `diff runs/00-fingerprint-before.txt runs/00-fingerprint-after.txt` |
| contradiction handling | changed chip appears in contract v2 + `deviations.md` + `expected.tsv` status `deviated` | review of `deviations.md` |
| manifest | `OK` for every file | `cd PLAN/runs && sha256sum -c MANIFEST.sha256` |

## Verification
`--runs` output and `check.sh` output saved to `runs/03-gate.txt`; `docker ps --filter name=advance-be-redis` shows only the main container after teardowns.

## Risks and rollback
- A `DEBUG SLEEP` on the main container blocks it for ≤ 2 s; only lab clients use it.
- A run that hangs (BRPOP, waits) is bounded by its own timeouts (`BRPOP … 5`, wait loops of 10 s).
- If `FUNCTION LOAD` fails, fall back to `EVAL` with the same bodies and log it.
- Rollback: `99-cleanup.sh`; config is reverted inside each region and C04 proves it.

=== FILE: phase-04-widget-data-homework-drill.md ===
---
phase: 4
title: "Widget data, homework, driver drill"
status: pending
priority: P1
effort: 1h
dependencies: [3]
---

# Phase 04 — Widget data, homework, driver drill

## Goal
Turn runs into widget JSON whose every number exists in a run, and build the homework self-check and the node-redis drill.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/verify/make-widget-data.cjs`, `runs/data/w1.json` … `w10.json`
- `D:/study/advance-be/labs/lesson-06-redis/package.json` (`"type": "module"`, `"redis"` with the same range as `labs/lesson-02-caching/package.json`, scripts `hw`, `hw:check`)
- `D:/study/advance-be/labs/lesson-06-redis/homework/book-seat.mjs` (learner skeleton with TODOs), `book-seat.solution.mjs`, `book-seat.bad.mjs`, `hw-check.mjs`
- `D:/study/advance-be/labs/lesson-06-redis/driver-drill/menu-cache.service.ai.ts`, `menu-cache.service.fixed.ts`
- `…/verify/driver-claims.md`, `runs/hw-check.solution.txt`, `runs/hw-check.bad.txt`

## Tasks and steps
1. Widget data, each with `sources: [run ids]`: W1 block timeline (µs); W2 rps P1/P16, MGET vs GET, payload; W3 thresholds + recorded encodings; W4 `expires` series; W5 survivors per policy + OOM text; W6 mode × kill/stop → kept keys (power-loss cell is text "suy luận, không đo"); W7 poller claims; W8 10 KEYSLOT pairs; W9 lock steps; W10 the 30-call sequence.
2. Homework (slide 43, two requests booking `A34_S012C` on `FA634`, no DB):
   - `bookSeat(client, flight, seat, requestId)` must acquire with `SET NX PX` + a random token, write `l06:hw:booking:<flight>:<seat>`, and release with `l06_unlock`.
   - `hw-check.mjs <module>` connects to `localhost:6379` with no password and prints `H1–H6 ✔/✘`:
     - H1: of 2 concurrent calls (separate clients, `Promise.all`), exactly one `BOOKED` and one `SEAT_LOCKED`;
     - H2: the booking holds the winner's id;
     - H3: the lock is gone afterwards;
     - H4: a release with a wrong token keeps the lock;
     - H5: the lock has a PTTL in (0, 30000];
     - H6: a second attempt after release is refused because the seat is already booked.
   - `book-seat.bad.mjs` (plain `DEL`, no PX) must show ✘ exactly on H4 and H5.
   - Run `pnpm install` in `LABS` (Đạt's package manager), then record both checks.
3. Driver drill: pick **node-redis**, because it is the official client, lesson 02 already uses it, and its auto-pipelining of commands issued in the same tick teaches slide 41. ioredis gets one honest sentence.
   - `menu-cache.service.ai.ts` is a NestJS 10 service with 7 numbered seeded mistakes: `KEYS` in the hot path, `SET` without TTL, lock released with `DEL`, `GET` then `SET` counter instead of `INCR`/function, `HGETALL` on a big hash, N sequential `await GET` instead of `MGET`/one-tick batch, and no `client.on('error')` / offline-queue decision.
   - `menu-cache.service.fixed.ts` fixes them using only commands already recorded in runs.
4. `driver-claims.md`: each API claim (`createClient` options, `'error'` listener requirement, `disableOfflineQueue`, auto-pipelining, `scanIterator`, `fCall`, `multi`) cites the published README/docs on GitHub or unpkg for the exact installed version (read from the registry, never from `node_modules`), with URL and date.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| widget data traced | exit 0 | `node verify/verify-guide.mjs --data` |
| fake number caught | RED, case h | `bash verify/negative-tests.sh` (case h only via `--case h`) |
| homework solution | H1–H6 ✔ | `node labs/lesson-06-redis/homework/hw-check.mjs ./book-seat.solution.mjs` |
| homework bad fixture | ✘ only H4, H5 | `node …/hw-check.mjs ./book-seat.bad.mjs` |
| skeleton fails cleanly | ✘ lines, no crash | `node …/hw-check.mjs ./book-seat.mjs` |
| drill answer key complete | 7 markers | `grep -c 'LOI [1-7]' labs/lesson-06-redis/driver-drill/menu-cache.service.ai.ts` = 7 |

## Verification
The `--data` run and both hw-check outputs saved to `runs/`; `check.sh` still all ✔ (homework keys are `l06:hw:*`).

## Risks and rollback
A pnpm install that fails offline: reuse the version pinned by lesson 02 and log it. The homework stays optional, and the core lesson never needs Node. Rollback: delete `homework/`, `driver-drill/`, `package.json` and its lockfile and `node_modules`.

=== FILE: phase-05-guide-shell-assembler.md ===
---
phase: 5
title: "Guide shell and assembler"
status: pending
priority: P1
effort: 1h
dependencies: [3]
---

# Phase 05 — Guide shell and assembler

## Goal
Copy the lesson-07 shell and assembler, retarget them to lesson 06, and write the controller-owned sections.

## Files to create/modify (owner: controller; runs in parallel with phase 06, disjoint files)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/shell-css.part`, `shell-head.html`, `shell-tail.html`, `assemble.mjs`

## Tasks and steps
1. Copy the four files from `plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/`. In `assemble.mjs`: `LABS`/`OUT` → lesson 06; `sqlBlock` → `cmdBlock` with contract §2 region rules on `pre[data-cmd]`; widgets `w1…w10`; quiz `stage-01…09`.
2. CSS: storage/theme keys → `l06-`, add the contract §4 classes; keep `:root` tokens, the `:root:not([data-theme="light"])` / `:root[data-theme="dark"]` dark-mode guards, body background, 44 px targets.
3. `shell-head.html`: hero and `#cach-hoc` with the time plan, prep (`docker compose -f labs/lesson-06-redis/compose.yaml up -d redis`, `00-setup.sh`), run methods with two terminals side by side, the warm-up (paste the smoke region, compare; `data-store="l06-warmup"`), and "Nhắc nhanh Bài 02" linking lesson 02 `#chang-6` (SET NX PX + compare-and-delete, jitter, singleflight; anchors re-grepped), stated as not re-taught.
4. `shell-tail.html`: `#bai-tap` (PASS = `hw-check` H1–H6 ✔); `#driver-drill` (spot 7 mistakes, answers in `details.fold`); `#phong-van` (10 EXAM); `#cheat-sheet` (commands with complexity: `GET/SET O(1)`, `HGETALL O(N)`, `KEYS O(N)`, `SCAN` per call, `ZADD O(log N)`, `SINTER O(N*M)`, big `DEL` O(N) vs `UNLINK`; config and `INFO` fields); `#ban-do-slide` from `SLIDES`; `#tham-khao` (slide 44 links, redis.io, GitHub 7.2.3 sources); `#tiep-theo` (FR-M2-02 → stage 9 idempotency, FR-M2-03 → lesson 02 + stage 3, FR-M2-04 → stage 6, FR-M2-05 → stage 9 bucket, FR-M2-06 hub Redis on 6380 named only; Boss Challenge 2 on `executeImportExport`/`terminateContract`; then K2 Bài 04 Rate Limiting). The script keeps `GUIDE_DATA_START/END` with `SLIDES` (46 × `{n, title, stage, chip, href}`), `QUIZ`, `EXAM` and the IIFE (try/catch storage, theme toggle, quiz renderer).

## Test matrix
| Test | Expected | Command |
|---|---|---|
| stub build | writes GUIDE | `node assembly/assemble.mjs --allow-stubs` |
| shell checks | V01–V04, V09, V10, V14, V15, V17 pass | `node verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15,V17` |
| no lesson-07 leftovers | 0 hits | `grep -c 'l07-\|lab07_\|Data Modeling' GUIDE` = 0 outside links |
| lesson 02 anchors exist | each `href` id found | `grep -o 'id="chang-6"' reports/advanced_backend/lesson_02_caching_teacher_guide.html` |

## Verification
Open the stub build in a browser once; the theme toggle and empty quiz slots render.

## Risks and rollback
Shell text drifting from lesson 07's contract: V-checks catch structure, not prose. Rollback: delete `assembly/` shell files.

=== FILE: phase-06-stage-fragments.md ===
---
phase: 6
title: "Stage fragments (3 parallel delegates)"
status: pending
priority: P1
effort: 2h
dependencies: [1, 4]
---

# Phase 06 — Stage fragments

## Goal
Write the nine stage sections in Vietnamese, each "câu chuyện → sơ đồ → bảng số đo trên máy bạn → câu hỏi 30 giây", then "làm mẫu → tự làm", with widgets that teach a mechanism from recorded data.

## Files to create/modify (disjoint; no delegate touches Redis, `labs/`, `runs/`, shell or assembler)
| Owner | Files under `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/` |
|---|---|
| D1 | `fragments/stage-01.html`, `stage-02.html`, `stage-03.html`, `stage-0{1,2,3}.quiz.json`, `widgets/w1.js` … `w4.js` |
| D2 | `fragments/stage-04.html`, `stage-05.html`, `stage-06.html`, quiz 4–6, `widgets/w5.js`, `w6.js`, `w7.js` |
| D3 | `fragments/stage-07.html`, `stage-08.html`, `stage-09.html`, quiz 7–9, `widgets/w8.js`, `w9.js`, `w10.js` |

Each delegate prompt gives the task; files to read (`contract.md`, the stage map and matrix, its lab files, runs, `runs/data/wN.json`, `source-claims.md`, slide pages in range, lesson-07 stages 3 and 9 as style model); the files it may write; the constraints below; acceptance (`--fragment` exit 0, `node --check` per widget); reply format `Status/Summary/Concerns`; reports path `PLAN/reports/`; and "no `--yagni` flag".

## Fragment format (frozen, from contract §4)
- `<section id="chang-N" class="stage col">`, with:
  - `stage-head` (slides · minutes · "Ngày 02/11");
  - `p.goal`;
  - `dl.wwh` (LÀ GÌ / TẠI SAO / KHI NÀO KHÔNG);
  - `figure.slide-fig` for existing images (pages 1, 4–9, 12, 16, 18, 19, 25–27, 35, 39, 40, 43, 45, 46, path `../../Tài Liệu/advanced_backend/assets/6_Redis/page_NN_img_01.png`, `onerror` hides).
- Per slide: a `.sayvs` callout ("Slide nói / Redis 7.2 đo được"), the chip, and "Trang N"; PART/FIX slides carry `id="sl-NN"`.
- Commands are `<pre data-cmd="02-encodings.redis#hash-threshold">`. Output is `div.run-label` "Kết quả đã chạy trên máy bạn ngày 31/10/2026" (the run's own date) plus `pre[data-run]`; inline numbers use `<b class="m" data-run>`. Timing values say "phụ thuộc máy".
- Two-terminal steps use `table.term2` (# / Terminal A / Terminal B / Ghi lại, `data-store="l06-cN-…"` inputs) and then the merged timeline.
- Worked example `callout teacher` "Làm mẫu", then `div.callout.challenge#chang-N-tu-lam` with the task, PASS criteria, a self-check command and the answer in `details.fold`, then `<div class="quiz" data-quiz="N">`. Quiz JSON: 4 × `{q, opts[4], ans, why}`, each `why` cites a run id.
- Widgets: a block using only the IIFE helpers, reading `run('wN')`, null-guarded, no globals, controls ≥ 44 px. Simulations are labelled "mô phỏng" and show the recorded numbers next to them.

## Per-stage content (challenge in italics)
1. Story "1 lệnh KEYS làm cả quầy POS đứng"; X01–X07. W1 replays the A/B lanes; W2 computes RTT × N vs pipelined from recorded rps. *`redis-cli --latency` in terminal B while A runs `DEBUG SLEEP 1`; PASS = max ≥ 900 ms.*
2. Slide 30 answer: C1 `HGET`, C2 `HINCRBY`, C3 `HGETALL` or `GET`, with measured bytes and the lost update. W3 predicts encodings from recorded thresholds, ✔ against recorded rows. *Push `l06:my:menu:1` past 512 fields; show it never converts back.*
3. 7.2 cycle (20 keys/loop, 10 % stale at effort 1, 25 % CPU budget); slide 21 FIX via `DEBUG HTSTATS` + source quote. W4 simulates sampling (slide 25 % vs 7.2 10 %) beside the recorded curve. *Passive expiry of 5 keys with active off, then back on; PASS = C05 ✔.*
4. Story "Redis 128 MB của hub đầy"; sampled, not exact LRU. W5 policy tabs. *Choose a policy for menu cache vs idempotency keys; prove it at 16 MB.*
5. Process crash vs power loss for AOF; multi-part hybrid. W6 crash matrix. *Repeat `rdb-kill` with your key; explain why `docker stop` lost nothing.*
6. Slide 32 corrected: competing consumers work, but no groups/ack (Streams in one sentence); ZSET best-sellers = FR-M2-04. W7 replays pollers. *50 delayed orders, two pollers in two terminals; PASS = 50 claimed, overlap 0.*
7. `WAIT` semantics, Sentinel diagram (not measured). W8 = CRC16-XMODEM mod 16384 with hashtag rules, ✔ against 10 recorded KEYSLOTs. *Predict 3 slots in W8, verify on the cluster node.*
8. Thresholds are rules of thumb. *Find the biggest `l06:` key with `--memkeys`; delete it without blocking.*
9. Lesson 02 recap (3 lines, links) → race → lock expiring mid-work → `l06_unlock` → fencing token (link lesson 14 `version` / conditional UPDATE) → Redlock caveat → Lua atomicity (bucket A/B) → token bucket (FR-M2-05: 10/30/20) → idempotency (FR-M2-02, Boss Challenge 2 body hash). W9 lock lanes with TTL bars; W10 bucket simulator, ✔ when its replay equals the recorded 30 calls. *A `l06:my:` bucket per `storeId` with 429-style denials and retry_after_ms.*

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment checks V05–V07, V09, V12 | exit 0 | `node verify/verify-guide.mjs --fragment assembly/fragments/stage-0N.html` |
| widget syntax | no error | `node --check assembly/widgets/wN.js` |
| W8 CRC16 vs recorded | 10/10 equal | `node verify/widget-smoke.mjs w8` (copied from lesson 07, case added) |
| W10 replay vs recorded | sequence equal | `node verify/widget-smoke.mjs w10` |

## Verification
The controller re-runs every `--fragment` check and `widget-smoke.mjs` before accepting a DONE.

## Risks and rollback
A delegate inventing a number: V07 fails. Two delegates editing one file: the ownership table forbids it, and the controller rejects foreign paths. Rollback: delete a fragment and re-delegate with the same contract.

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
Produce the guide and prove it against every check, including the negative ones and a visual render.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html` (generated)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/verify/render/`, `verify/render-dark/`, `verify/tmp/`

## Tasks and steps
1. Build: `node assembly/assemble.mjs` (no stubs).
2. Run the full verifier, then `--runs` and `--data`.
3. Run `bash verify/negative-tests.sh`.
4. Render: `TMP="$PWD/plans/261031-1651-lesson-06-redis-teacher-guide/verify/tmp" TEMP="$TMP" node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs reports/advanced_backend/lesson_06_redis_teacher_guide.html --out plans/261031-1651-lesson-06-redis-teacher-guide/verify/render`. Repeat on a copy next to `GUIDE` with `data-theme="dark"` forced (so relative image paths still resolve) into `verify/render-dark`, then delete the copy.
5. Fix by editing fragments, the shell or lab files, never run data; then rebuild and re-run all checks.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| full verify V01–V19 | exit 0 | `node verify/verify-guide.mjs` |
| matrix and data | exit 0 | `node verify/verify-guide.mjs --runs && node verify/verify-guide.mjs --data` |
| negative tests | `12/12 ca RED đúng thiết kế` | `bash verify/negative-tests.sh` |
| size | ≤ 360 KB | V01 |
| render light/dark | 0 errors, 0 overflow at 375/768/1440, 0 targets < 44 px | `verify/render*/report.txt` |
| invariants | all ✔ | `bash labs/lesson-06-redis/check.sh` |

## Verification
Save the verifier, negative-test and render summaries to `runs/07-gate.txt`.

## Risks and rollback
A negative case that passes (the checker missed drift): fix the checker first, then re-run everything. Rollback: the guide is generated, so rebuild.

=== FILE: phase-08-ultra-review-fixes.md ===
---
phase: 8
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1h
dependencies: [7]
---

# Phase 08 — Ultra code review and fixes

## Goal
Run `/ak:code-review --ultra` (5 independent reviewers + verifier, union of verified findings), fix every Critical and Important finding, and re-run the checks they affect.

## Files to create/modify (owner: controller; fixes may touch any file this plan created)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/verify/review-packet.md`
- `…/reports/code-review-ultra-reviewer-{1..5}.md`, `code-review-ultra-verdict.md`, `code-review-ultra-fix-status.md`

## Tasks and steps
1. `review-packet.md`: scope = the guide, `labs/lesson-06-redis/**`, `verify/**`, `assembly/**`, `expected.tsv`, `deviations.md`, `source-claims.md`, `driver-claims.md`; focus = Redis 7.2 correctness per chip, number traceability, runnability in PowerShell and Git Bash, safety (names, 6380, flushes, config restore), Vietnamese clarity, 375 px accessibility. Reviewers change no Redis state (read-only `INFO`/`CONFIG GET` only).
2. Run the ultra review. The verifier unions the findings and drops the unverified ones.
3. Fix Critical/Important. A finding that needs new data means re-running that region, updating the MANIFEST and narrating; data is never edited. Minor findings: fix the cheap ones and list the rest in `fix-status`.
4. Re-run the affected checks: `--runs`, `--data`, the full verifier, negative tests, render (when CSS/markup changed) and `check.sh`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| every Critical/Important closed | status `fixed` with file:line | `code-review-ultra-fix-status.md` |
| no regression | as in phase 07 | phase 07 commands |
| rejected finding | states the verification source | fix-status |

## Verification
`grep -c 'open' reports/code-review-ultra-fix-status.md` for Critical/Important = 0.

## Risks and rollback
A fix that reverses a settled decision (e.g. "add Node harness"): reject it and cite the evidence packet §2. Rollback: fixes are file edits to new files; re-run the generator.

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
Link the guide and labs from the course docs, prove the final state, and leave a short handoff for the 2026-11-02 study day.

## Files to create/modify (owner: controller)
| File | Change (original text quoted for rollback) |
|---|---|
| `D:/study/advance-be/README.md` line 14 | append `` `labs/lesson-06-redis/` (redis-cli) `` to the labs list (original: ``…`labs/lesson-12-transaction/`, `labs/lesson-14-locking/` ``); add `lesson_06_redis_teacher_guide.html` and `lesson-06-redis/` to the two trees |
| `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` line 38 | column 4: replace `` `labs/lesson-02-caching/06-*.mjs` `` with `` `reports/advanced_backend/lesson_06_redis_teacher_guide.html`<br>`labs/lesson-06-redis/` (redis-cli)<br>`labs/lesson-02-caching/06-*.mjs` `` |
| `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` line 3335 | one-line change: "Sau đó sang Cụm 2 với Bài 06 Redis." → "Sau đó sang Cụm 2 với <a href=\"lesson_06_redis_teacher_guide.html\">Bài 06 Redis</a>." (re-grep the line number first) |
| `D:/study/advance-be/plans/handoffs/lesson-06-redis-guide-ready-<YYYYMMDD-HHMM>.md` | new: what exists, how to start (compose up, setup, warm-up), optional containers, cleanup, open items |

Re-grep each line before editing; if any target line moved, edit by the quoted text.

## Tasks and steps
1. Apply the doc edits. Re-run lesson 07's verifier V02/V10 on its guide (`node plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs --only V02,V10`) to prove the link edit broke nothing.
2. Final gate (table below). `docker ps` shows only the main lab container (profile containers removed). `git status --short` lists only `labs/lesson-06-redis/`, the guide, `README.md`, `TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md`, the lesson 07 guide, the plan folder, the handoff and pre-existing entries.
3. Write the handoff (≤ 40 lines) and set the plan status through the `ak plan` CLI (check `ak plan --help` first).

## Test matrix
| Gate | Expected | Command |
|---|---|---|
| invariants | all ✔ | `bash labs/lesson-06-redis/check.sh` |
| guide | exit 0 | `node PLAN/verify/verify-guide.mjs && … --runs && … --data` |
| negative | 12/12 | `bash PLAN/verify/negative-tests.sh` |
| non-lab containers | identical | `diff runs/00-fingerprint-before.txt runs/00-fingerprint-after.txt` |
| lesson 07 still valid | V02, V10 ✔ | command above |
| git scope | only planned paths; no branch, commit or push | `git status --short` |

## Verification
The final gate table with results is pasted into the handoff.

## Risks and rollback
Parallel roadmap edits in the README: change only the named lines. Rollback: restore the quoted original text. The main `advance-be-redis` container stays running and seeded for the study day by design; `99-cleanup.sh` or `docker compose … down -v` removes it.
