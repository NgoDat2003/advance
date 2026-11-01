---
title: "Lesson 06 Redis teacher guide (redis-cli-first, Redis 7.2.3-measured)"
description: "Single-file Vietnamese teacher guide for K1 Lesson 06 Redis (46 slides + 8 evidence blocks) backed by small redis-cli/shell snippets recorded on advance-be-redis* lab containers."
status: completed
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

Build `reports/advanced_backend/lesson_06_redis_teacher_guide.html` on the lesson-07 single-column shell (no rail) so Đạt can study it on about 2026-11-02 in 4h55 of core time. Every experiment is a small `.redis` or `.sh` snippet in `labs/lesson-06-redis/` that he pastes into `redis-cli` (inside `docker exec -it`) or runs in Git Bash. Lua runs are `.sh` lines that call `redis-cli --eval /lab/lua/<name>.lua` from the read-only mount, so the script that runs is the `.lua` file. <!-- red-team #1 --> The controller runs the same regions through `verify/run-redis.mjs`, with the same environment the learner has, and records output verbatim in `runs/`. `verify/verify-guide.mjs` (started from the lesson-07 verifier, with the Redis-specific rules listed in phase 02) proves every guide number and code block traces to a lab file and a run. <!-- red-team #9 --> All 46 slides map once, with chips `Đúng trên Redis 7.2` / `Đúng một phần` / `Cần sửa`. Redis writes happen only on `advance-be-redis*` containers. Destructive commands run only on the extra containers. Main is published on `127.0.0.1:6379` only. <!-- red-team #5 --> <!-- red-team #12 --> Postgres is not used at all; no git command other than `git status`.

## Data flow

Containers (`00-containers.sh`) and seed → lab regions (`.redis`/`.sh`/`.lua`, display rule in `verify/lab-text.mjs`) → `verify/run-redis.mjs` (host-ms clock, Redis start barrier for A/B, reset region per scenario) → `runs/*.txt` + `runs/manifest.tsv` (one sha256 line per run path, replaced on rewrite) → `runs/data/wN.json` and `runs/data/derived.json` (with `sources`) → delegate fragments/widgets against `assembly/contract.md` → `assemble.mjs` → guide → verifier, negative tests, widget-smoke, render-check, ultra review. <!-- red-team #7 --> <!-- red-team #10 -->

## Stage map (study day ≈ 2026-11-02)

| Stage | Slides | Topic | Core | Optional | Experiments (run ids) | Widget |
|---|---|---|---|---|---|---|
| `#cach-hoc` | 1–3 | setup, run method, two terminals, warm-up | 10 | – | 00-containers, 00-seed, check | – |
| 1 | 4, 5, 10–14 | why fast, measured: one thread, I/O threads off, RTT vs pipelining, value size | 35 | 10 (busy Lua + SCRIPT KILL) | 01-block.A/B, 01-why-fast, 01-bench.sh | W1 event-loop lanes |
| 2 | 15, 16, 29–31 | dict, encodings, slide 30 Hash vs JSON + lost update | 30 | – | 02-encodings, 02-json-race.A/B | W2 encoding converter |
| 3 | 17–23 | expire dict, passive vs active, eviction policies | 35 | 10 (volatile-ttl, allkeys-random) | 03-expiry, 03-eviction.sh | W3 expiry sampler, W4 eviction |
| 4 | 24–27 | RDB, AOF, hybrid, kill -9 restart loss | 25 | 5 (preamble off) | 04-persistence.sh | W5 loss window |
| 5 | 28, 32–35 | String counter race, List queue, Hash cart, Set, ZSET leaderboard | 30 | 10 (Streams contrast) | 05-structures, 05-queue.A/B, 05-counter.A/B | – (inline SVG) |
| 6 | 36–38 | delay task + atomic claim, big keys DEL vs UNLINK | 30 | 5 (lazyfree-lazy-user-del) | 06-practices, 06-delay.A/B, 06-delay-lua.A/B.sh <!-- red-team #1 --> | – (inline SVG) |
| 7 | 6–9, 39 | replica lag/stale read, WAIT, manual failover, Sentinel (diagram), slots, hashtag, CROSSSLOT | 35 | 10 (split-brain failover) | 07-architecture.sh, 07-cluster | W6 slot calculator, W7 partition replay |
| 8 | 40 | capstone lock: no lock, NX, TTL+DEL bug, compare-and-delete, fencing | 40 | 5 (Redlock fold) | 08-lock.A/B, 08-lock-lua.A/B.sh <!-- red-team #1 --> | W8 lock timeline |
| 9 | 41 | OmniPOS M2 bridge: token bucket, idempotency, best practices, driver drill | 25 | – | 09-bridge, 09-bucket.A/B, 09-bucket-lua.A/B.sh <!-- red-team #1 --> | W9 token bucket |
| Wrap | 42–46 | recap, homework spec, interview, cheat sheet, refs | 15 | 45 (homework, evening) | hw-check.sh | – |
| **Total** | 46 | | **310** | **70 + 45** | | |

310 min is above the 4–5 h target, so stage 1's value-size benchmark (5 min) and stage 9's drill review (10 min) are marked "nếu còn sức" in the time table, giving a firm core of 295 min. Nothing is cut from the page. Each stage ends with a `kiem-chung` block of plain redis-cli commands next to a table of expected values. <!-- user decision b -->

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract, baseline, run-method smoke](phase-01-contract-baseline-smoke.md) | 0.5h | – | `contract.md` frozen; `runs/00-fingerprint-before.txt` (hashes, count, 6380 status, `main_bind`, `run_id_match`); `runs/run-method-smoke.txt` S1–S7 decides learner method |
| 02 | [Tests first](phase-02-tests-first.md) | 1.75h | 01 | `expected.tsv` frozen (57 run rows + 3 design rows); `--selftest` GREEN; `--runs` RED "missing run" × 57; `check.sh` prints C01 ✘ and C02–C06 `–` (not crash); `widget-smoke.mjs --help` works |
| 03 | [Containers, seed, experiments, recorded runs](phase-03-containers-experiments-runs.md) | 3.5h | 02 | `check.sh` all ✔/`–` twice (seed idempotent); `--runs` GREEN or each deviation logged; `--lint` (V17) GREEN; rerun gate GREEN on semantic lines; fingerprint `--compare` rc 0 |
| 04 | [Widget data, homework, driver claims](phase-04-widget-data-homework-driver.md) | 0.75h | 03 | `--data` GREEN (w1–w9, derived.json); `hw-check` solution ✔ / bad fixture ✘ H1, H2, H5; `runs/driver-claims.txt` complete |
| 05 | [Guide shell and assembler](phase-05-guide-shell-assembler.md) | 1h | 02 (parallel with 03–04) | `assemble.mjs --allow-stubs` builds; V01–V04, V09, V10, V14, V15 GREEN on shell <!-- red-team #9 --> |
| 06 | [Stage fragments (3 delegates)](phase-06-stage-fragments.md) | 1.75h | 04, 05 | `--fragment` GREEN per stage (incl. quiz JSON, V19); `node --check` per widget; widget-smoke W6 ✔ |
| 07 | [Assemble, verify, render-check](phase-07-assemble-verify-render.md) | 0.75h | 06 | full verify GREEN; negative tests 19/19 RED-as-designed, 0 SKIP; render-check 0 errors / 0 overflow / 0 small targets |
| 08 | [Ultra code review and fixes](phase-08-ultra-review-fixes.md) | 1h | 07 | no open Critical/Important; affected checks re-run GREEN |
| 09 | [Docs, final gate, handoff](phase-09-docs-final-gate-handoff.md) | 0.5h | 08 | final gate table all pass; fingerprint `--compare` rc 0; main re-seeded, `check.sh` ✔/`–`; handoff written |

Effort grew from 10.5h to 11.5h: phase 02 (+0.5h) for the new verifier rules, lint, negative groups and widget-smoke; phase 03 (+0.5h) for reset/barrier regions, eviction sleeps and the replica reconnect poll.

## Expected-result matrix (frozen in `verify/expected.tsv` in phase 02, before any experiment)

Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`, – = no chip on this row. "n" = whatever the run records; the regex asserts shape or relation only. Timing values are labelled "phụ thuộc máy". One run id per row; a row with a chip names exactly one slide, and each chip slide has exactly one chip row. <!-- red-team #9 -->

| ID | Run id | Slide | Expected Redis 7.2.3 result | Chip |
|---|---|---|---|---|
| D04 | – (design) | 4 | definition per redis.io | OK |
| D05 | – (design) | 5 | Redis vs Memcached per redis.io docs; Memcached not measured | PART |
| R01a | 01-why-fast.threads | 13 | `io_threads_active:0`, `io-threads 1`, `multiplexing_api:epoll` | OK |
| R01b | 01-bench.threads | 14 | `/proc/1/task` count n > 1 (bio threads, not I/O threads) | PART |
| R02 | 01-block.sleep.timeline | 13 | A `DEBUG SLEEP 2`; B `PING` host-send ≈ A host-send + 0.5 s; PONG host-arrival ≥ A host-send + 1.9 s | – |
| R03 | 01-block.busy.timeline (opt) | 13 | Lua busy loop 6 s: B gets `BUSY Redis is busy running a script` after 5 s; `SCRIPT KILL` → A gets `ERR ... killed` | – |
| R04 | 01-bench.pipeline | 12 | GET `-P 16` req/s ≥ 5× `-P 1` | PART |
| R05 | 01-bench.size | 12 | `GET l06:bench:big` (100 KB) req/s ≪ `GET l06:bench:small` (16 B); MB/s in `derived.json` | – |
| R06 | 01-bench.mget | 41 | `-c 1`: MGET of 10 keys keys/s ≥ 5× GET keys/s (keys/s in `derived.json`) | – |
| R07 | 01-why-fast.slowlog | 13 | SLOWLOG entry `debug sleep` ≥ 500000 µs; `LATENCY LATEST` event `command` ≥ 500; thresholds restored | – |
| R08 | 02-encodings.string | 31 | `int`; 44-byte `embstr`; 45-byte `raw`; `APPEND` turns embstr into raw | OK |
| R09a | 02-encodings.hash | 16 | 512 fields `listpack`, 513 `hashtable` | OK |
| R09b | 02-encodings.hash | 33 | 64-byte value `listpack`, 65 `hashtable`; MEMORY USAGE jump n | PART |
| R10a | 02-encodings.set-zset-list | 34 | ints 512 `intset` / 513 `hashtable`; strings 128 `listpack` / 129 `hashtable` | PART |
| R10b | 02-encodings.set-zset-list | 35 | zset 128 `listpack` / 129 `skiplist`; small list `listpack`, large `quicklist` | PART |
| R11 | 02-encodings.slide30-memory | 30 | 4-field user Hash `listpack` n B vs JSON String `raw` n B | PART |
| R12 | 02-encodings.slide30-ops | 30 | C1 `HGET` 1 value vs `GET` STRLEN n bytes; C2 `HINCRBY` → 31; C3 `HGETALL` 8 lines | – |
| R13 | 02-json-race.lost.timeline | 30 | both GET JSON; A SET age 31; B SET email → final `age` 30 (A lost); hash variant keeps both | – |
| R14 | 03-expiry.expire-dict | 18 | `INFO keyspace` `keys=n,expires=m`, m < n; `TTL` -1 / -2; `MEMORY STATS` shows `overhead.hashtable.expires` | OK |
| R15 | 03-expiry.passive | 19 | `DEBUG SET-ACTIVE-EXPIRE 0`; 1000 keys PX 100; after 500 ms keyspace still 1000; one GET → nil and `expired_keys` +1; restored to 1 | PART |
| R16a | 03-expiry.active | 20 | 10000 keys PX 1000, no access; after 3 s only persistent keys remain, `expired_keys` +10000; `expired_stale_perc`, `expire_cycle_cpu_milliseconds` printed | PART |
| R16b | 03-expiry.active | 21 | same run: no ZSET anywhere (expires is a hashtable, `overhead.hashtable.expires`) | FIX |
| R17 | 03-eviction.noeviction | 23 | `maxmemory-policy noeviction` default; `MAX` = `used_memory` + 2 MB printed; write past `MAX` → `OOM command not allowed`; GET still works <!-- red-team #2 --> | PART |
| R18 | 03-eviction.allkeys-lru | 23 | `evicted_keys:0` after hot+cold fill; after touches + overflow: hot-survival % > cold-survival %, `evicted_keys` > 0 <!-- red-team #2 --> | – |
| R19 | 03-eviction.allkeys-lfu | 23 | same as R18 for LFU | – |
| R20 | 03-eviction.volatile-ttl (opt) | 23 | all non-TTL keys survive; shortest-TTL group evicted first; then OOM | – |
| R21 | 03-eviction.allkeys-random (opt) | 23 | hot and cold survival recorded n/n; relation narrated, no numeric bound <!-- red-team #2 --> | – |
| R22 | 04-persistence.rdb-loss | 26 | old dump removed, `save ""`; 1000 keys; `BGSAVE` + poll until `rdb_bgsave_in_progress:0`, `rdb_last_bgsave_status:ok`; 500 more; `docker kill`; start → DBSIZE 1000; `latest_fork_usec` n; `BGSAVE` returns "Background saving started"; SAVE entry in SLOWLOG with threshold 0 (restored to 10000) <!-- red-team #3 --> <!-- red-team #15 --> | OK |
| R23 | 04-persistence.aof-loss | 25 | `appendonly yes`, `everysec`; 1500 keys; wait 2 s; `docker kill`; start → DBSIZE 1500 (must-fix 4 narrative) | PART |
| R24 | 04-persistence.hybrid | 27 | `appendonlydir` has `*.base.rdb` starting `REDIS`; preamble `no` + `BGREWRITEAOF` → `*.base.aof` starting `*`; restored `yes` | PART |
| R25 | 05-queue.brpop.timeline | 32 | B `BRPOP` blocks; A `LPUSH`; B gets item; second consumer gets the next item only | PART |
| R26 | 05-structures.list-reliable | 32 | `BLMOVE` to processing list; item stays until `LREM` ack | – |
| R27 | 05-structures.hash-cart | 33 | slide 33 commands: HSET 1, HINCRBY 2, HLEN 2, HDEL 1, HGETALL | – |
| R28 | 05-structures.set-likes | 34 | duplicate `SADD` → 0; `SINTER` common followers set | – |
| R29 | 05-structures.zset-board | 35 | `ZINCRBY`; `ZRANGE … REV WITHSCORES` top 3 order | – |
| R30a | 05-counter.getset.timeline | 31 | GET+SET from 2 clients → 1 (lost) | – |
| R30b | 05-counter.incr.timeline | 31 | INCR from 2 clients → 2 | – |
| R31a | 06-delay.naive.timeline | 37 | reset seeds 1 due (`o1`) + 2 future jobs; both naive pollers process `o1` <!-- red-team #8 --> | – |
| R31b | 06-delay-lua.claim.timeline | 37 | re-seeded; Lua claim (`TIME` inside Lua): one gets `o1`, other nil; `o2`/`o3` remain; V18 Lua hash matches <!-- red-team #1 --> <!-- red-team #8 --> | OK |
| R32 | 06-practices.bigkey | 38 | 1M-field hash MEMORY USAGE n MB; both hashes built before the reset; threshold 0: DEL µs (SLOWLOG GET 1) ≥ 10× UNLINK µs (SLOWLOG GET 1); `lazyfreed_objects` +1; threshold restored 10000 <!-- red-team #3 --> | OK |
| R33 | 06-practices.lazyfree (opt) | 38 | `lazyfree-lazy-user-del yes` → DEL fast; restored `no` | – |
| R34 | 07-architecture.replica | 6 | `role:slave`, `master_link_status:up`, offsets equal after write | OK |
| R35 | 07-architecture.partition | 7 | network disconnect → replica GET returns old value; master `WAIT 1 500` → 0; reconnect + `docker restart` replica; `master_link_status:up` within 20 s; GET converges to new value; offsets equal; `sync_partial_ok`/`sync_full` recorded, not asserted (also illustrates slide 6); chip note "chưa đo trực tiếp" (no Sentinel run) <!-- red-team #4 --> <!-- red-team #14 --> | PART |
| R36 | 07-architecture.failover (opt) | 8 | on the replica: `REPLICAOF NO ONE` → `role:master`; write on both; `REPLICAOF` back → replica's write gone; chip note "chưa đo trực tiếp" (no Cluster failover run) <!-- red-team #14 --> | PART |
| R37 | 07-cluster.keyslot | 9 | `cluster_slots_assigned:16384`; `CLUSTER KEYSLOT` values n; `{34}` pair equal (also slide 39) | OK |
| R38 | 07-cluster.crossslot | 39 | `SINTER` untagged → `CROSSSLOT`; tagged → result | OK |
| R39 | 08-lock.nolock.timeline | 40 | both see free; final owner B; log has 2 `BOOKED` (from reset state) | FIX |
| R40 | 08-lock.nx.timeline | 40 | A `OK`, B `(nil)` | – |
| R41 | 08-lock.ttldel.timeline | 40 | PX 2000, A works 3 s; B acquires at +2.5 s; A `DEL` → 1 removes B's lock; C acquires → 2 holders <!-- red-team #7 --> | – |
| R42 | 08-lock-lua.cad.timeline | 40 | same timing with `lock-release.lua` via `--eval`: A gets 0; B's lock intact <!-- red-team #1 --> | – |
| R43 | 08-lock-lua.fencing.timeline | 40 | tokens 1 and 2; B write accepted; A late write → `STALE` <!-- red-team #1 --> | – |
| R44a | 09-bucket.naive.timeline | 41 | naive: 2 allowed from 1 token | – |
| R44b | 09-bucket-lua.claim.timeline | 41 | Lua via `--eval`: 1 allowed, 1 denied <!-- red-team #1 --> | OK |
| R45 | 09-bridge.bucket30 | – | cap 10, slow refill, 30 calls → 10 allowed, 20 denied, `retry_after_ms` > 0 | – |
| R46 | 09-bridge.idempotency | – | `NEW`, then `IN_PROGRESS`, `DONE` + same body, other hash → `MISMATCH`; TTL > 0 | – |
| D42 | – (design) | 42 | recap restates slides with their measured corrections | PART |
| R47a | hw-check.solution | 43 | solution 5/5 ✔ (10 rounds + round 11) | OK |
| R47b | hw-check.bad | 43 | bad fixture ✘ H1, H2, H5; ✔ H3, H4 <!-- red-team #13 --> | – |
| R48a | check.after-seed | – | all ✔ or `–` <!-- red-team #5 --> | – |
| R48b | check.rerun | – | identical to R48a | – |

Null-chip slides (title/section/question/recap pages): 1, 2, 3, 10, 11, 15, 17, 22, 24, 28, 29, 36, 44, 45, 46 (15 slides). Chip slides (31): 4, 5, 6, 7, 8, 9, 12, 13, 14, 16, 18, 19, 20, 21, 23, 25, 26, 27, 30, 31, 32, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43. Chip per slide is frozen in `contract.md` §6 and must equal `expected.tsv`. <!-- red-team #9 --> <!-- red-team #14 -->

## Acceptance criteria

1. Guide ≤ 520 KB, no external script, only Google Fonts from outside, no rail (P07, V01, V10).
2. `SLIDES` covers 1–46 exactly once; chips equal the chip rows of `expected.tsv`, including design rows D04/D05/D42 (P05/P07, V04).
3. Each stage 1–9 has a story callout, a diagram, a measured stats table, a 30-second check, a byte-exact `pre[data-cmd]`, a recorded run, a worked example, a `kiem-chung` block with `table.expect`, a `callout challenge` with PASS criteria, and 4 quiz items whose `why` cites a run id (P06, V05, V11, V12). <!-- user decision b -->
4. Every `b.m`, `pre[data-run]` and `run-wN` value traces to a `runs/` file whose sha256 equals its single line in `runs/manifest.tsv`; every `b.m[data-derived]` traces to `runs/data/derived.json`; every 4+-digit or decimal number in `QUIZ.why`/`EXAM.a` appears in a run (P03, P04, V06–V08, V16, M01). <!-- red-team #9 --> <!-- red-team #10 -->
5. Every `expected.tsv` run row matches, or is `deviation` with a `verify/deviations.md` entry and changed narrative/chip (P03).
6. `check.sh` rc 0 with every row ✔ or `–` after seed and after a second seed, with identical output, and again at handoff (P03, P09). <!-- red-team #5 -->
7. `--lint` (V17) GREEN: every key in `labs/` starts `l06:`; no `6380`; no destructive command in a region targeting main; `CONFIG SET` and `DEBUG SET-ACTIVE-EXPIRE 0` restored in the same region; no `prune`; main published on `127.0.0.1` only; Git Bash path rule; no eval-file flag or `<now>` in `.redis` (P02, P03). <!-- red-team #5 --> <!-- red-team #6 --> <!-- red-team #12 --> <!-- red-team #15 -->
8. Storage keys `l06-*` only; dark and light both work; widgets insert run data only through `textContent`/`esc()` (P07, V09, V14, V19). <!-- red-team #15 -->
9. render-check at 375/768/1440: 0 runtime errors, 0 overflow, 0 targets < 44 px (P07).
10. Negative tests: 19/19 cases RED with their expected code, 0 SKIP (P02, P07). <!-- red-team #9 -->
11. `verify/fingerprint.sh --compare runs/00-fingerprint-before.txt` rc 0 at phase 03 end and at phase 09: every container present at baseline is unchanged (hash of id+image, Up/Exited); new containers are allowed; no lab container on 6380; main bound `127.0.0.1:6379` and `run_id_match=yes`. The fingerprint file holds no container names or env (P01, P09). <!-- red-team #5 -->
12. No open Critical/Important review finding (P08).
13. README, TONG_QUAN row 06, the lesson-07 guide `#tiep-theo` and lesson-07 `assembly/shell-tail.html` link the guide; handoff exists; `git status` lists only expected paths; no branch/commit/push (P09).
14. Lua identity: every Lua run header hash equals the `labs/lesson-06-redis/lua/*.lua` file (V18). <!-- red-team #1 -->

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| Git Bash (mintty) `docker exec -it` fails with "not a TTY" | H×M | Guide gives PowerShell/Windows Terminal form and `winpty docker exec -it …` for Git Bash; smoke test records which works. |
| Git Bash rewrites `/lab/...` and `/data/...` arguments | certain (S7) | `MSYS_NO_PATHCONV=1` prefix on such lines, export + `HERE` in tool scripts, runner does not set it, V17 lint. <!-- red-team #6 --> |
| DBX Redis console runs one command at a time or mis-splits Lua | M×M | Smoke test decides; default is redis-cli; DBX (`127.0.0.1`) is the key browser (type, TTL, memory) and single-command console. |
| `redis-cli` escapes non-ASCII in replies (`\xe2…`) | H×L | Contract: values written by labs are ASCII; Vietnamese only in comments and guide prose. <!-- user decision b --> |
| `#` lines are sent as commands (`ERR unknown command '#'`, verified 2026-10-31) | certain | `lab-text.mjs` strips them for display, runner and pipe form (`grep -v '^#'`). |
| Two-client timing flakes | M×M | Reset region per scenario, Redis start barrier (`BLPOP`/`RPUSH`), host-ms clock only, ≥ 0.5 s margins, 3 runs from reset with run 1 recorded, rerun gate on semantic lines. <!-- red-team #7 --> |
| Eviction result dominated by LRU 1 s clock or fill size | M×H | `sleep 2` between fills and touch rounds; `MAX` from measured `used_memory`; fill asserted non-evicting; R21 narrated. <!-- red-team #2 --> |
| Replica does not reconnect within the step | H×M | `docker restart` the replica after reconnect, bounded poll ≤ 20 s, no `sync_partial_ok` assertion. <!-- red-team #4 --> |
| A config change on main is left behind | M×H | Every `CONFIG SET`/`DEBUG SET-ACTIVE-EXPIRE` region ends with its restore (V17); `check.sh` C11/C12; `00-containers.sh reset main`. |
| A destructive step hits main or learner keys | L×H | Destructive commands only on extras, target printed first, V17 rejects main targets; cleanup never touches `l06:my:*`/`l06:hw:*`; no prune. <!-- red-team #11 --> <!-- red-team #12 --> |
| Lesson-02 guide reuses the name `advance-be-redis` with `redis:7.4-alpine` and `imdb:*`/`lock:*` keys | M×M | `00-containers.sh` compares image tag; C01 checks `redis_version:7.2.3`; C07 lists foreign prefixes with a scoped UNLINK, never FLUSHALL. <!-- red-team #15 --> |
| Phase B adds containers before the final gate | H×M | Fingerprint compares only baseline containers; new ones are info. <!-- red-team #5 --> |
| Measurement contradicts a slide or the matrix | M×M | Keep data, change narrative/chip, log deviation; runs only written by the runner (manifest). |
| HTML over budget | M×M | Excerpts with `…`, folds, V01 limit 520 KB. |

Rollback: `bash labs/lesson-06-redis/99-cleanup.sh` UNLINKs `l06:*` on main except `l06:my:*` and `l06:hw:*`, restores main config, and removes the extra `advance-be-redis-*` containers by exact name (`docker rm -f -v`). It leaves network `advance-be-l06` while main is attached. `99-cleanup.sh --all` also removes main, then removes the network only when no container is attached. No `prune` is ever used. <!-- red-team #11 --> All repo files are new except the four doc edits, whose original lines are quoted in phase 09.

## Open questions for the user

None blocking. One confirmation: core is 295 min (+70 optional, homework 45 min in the evening). If Đạt wants 4 h, stage 7's Sentinel/failover and stage 9's drill move to the evening without dropping content.


## Materialization must-fix (verifier `verify/ultra-plan/verdict.md`, applied by the controller; these override the phase files where they conflict)

The red-team pass (below) folded each item into the phase files. Where an item was changed, its text here is the current rule and names the finding.

1. **R05 `01-bench.size`:** `redis-benchmark -t get -d 102400` GETs a key that does not exist, so `-d` changes nothing. Pre-write `l06:bench:small` (16 B) and `l06:bench:big` (100 KB, via `SETRANGE`). Then benchmark the custom commands `GET l06:bench:small` and `GET l06:bench:big`. The expectation stays req/s(big) ≪ req/s(small), with MB/s as a `derived.json` entry.
2. **Two-client timelines (current rule, red-team #7):** a server stamp from client B waits behind A's `DEBUG SLEEP`/Lua, so it cannot prove when B sent. The only clock is host ms: the runner writes the host send time into each marker (`ECHO "@@<step> <host-ms>"`) and stamps each reply line on arrival. The assertion for R02 is: B host-send ≈ A host-send + 0.5 s, and PONG host-arrival ≥ A host-send + 1.9 s. Both sessions start through the Redis barrier after the scenario's reset region. This applies to R02, R13, R25, R30, R31, R39–R44.
3. **R35 replica partition (current rule, red-team #4):** do not assert `master_link_status:down` after `docker network disconnect`, because `repl-timeout` is 60 s. Assert that the replica `GET` returns the stale value and `WAIT 1 500` → 0. After `docker network connect`, restart the replica, poll until `master_link_status:up` (≤ 20 s), and assert the value converges. Partial-sync counters are recorded, not asserted.
4. **R23 AOF narrative:** `docker kill` with `appendfsync everysec` loses nothing, because the OS page cache survives a process kill. The ≤ 1 s loss window applies only to an OS crash or power loss. The guide says this explicitly and does not repeat slide 25's "data loss" as if a kill showed it.
5. **Chips (current rule, red-team #9 and #14):** slide 30 is PART (row R11), slide 4 is OK (row D04), slides 7 and 8 are PART with "chưa đo trực tiếp" (rows R35, R36). Null-chip slides are 1, 2, 3, 10, 11, 15, 17, 22, 24, 28, 29, 36, 44, 45, 46. `contract.md` §6 and `expected.tsv` follow the matrix above.
6. **Lesson-07 bridge:** apply the `#tiep-theo` link edit to the built guide `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` and also to `plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/shell-tail.html`, so a rebuild keeps it. Now listed in phase 09's files.
7. **Fingerprint (current rule, red-team #5):** `fingerprint.sh` uses only `docker ps -a` fields, writes `sha256(id|image)` with status reduced to `Up`/`Exited` (no names, no `StartedAt`, no env), a count, and 6380 status. `--compare` requires baseline containers unchanged and allows new ones, so neither a Docker Desktop restart nor Phase B fails the final gate.
8. **Eviction order on `-evict` (current rule, red-team #2):** the fill is one command per line, never one `EVAL`, because eviction runs before each command and not inside a script. Order: fill hot → `sleep 2` → fill cold (sized to stay under `MAX`, no eviction yet) → `sleep 2` → 10 `GET` rounds over the hot keys with `sleep 2` between rounds → `sleep 2` → overflow fill. `MAX` = measured `used_memory` + 2 MB.

## Ultra receipt

ultra: picked=3/5 margin=low unanimous=no rejected_all=no

## Red Team Review

Session 2026-10-31. Four reviewers (failure modes, assumptions, security, scope/contract) raised 39 raw findings (10 + 10 + 9 + 10): 1 Critical, 22 High, 16 Medium. After dedup they form 15 accepted groups; 0 rejected. Đạt accepted all 15 and added decision (b): stage verification uses plain redis-cli commands against an expected-values table, not Lua PASS/FAIL checkers, and Lua appears only in stages 6, 8 and 9. Reports: `reports/red-team-failure-modes.md`, `reports/red-team-assumptions.md`, `reports/red-team-security.md`, `reports/red-team-scope-contract.md`.

Severity of the accepted groups (highest raw severity in the group): 1 Critical, 11 High, 3 Medium.

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Lua A/B runs used the redis-cli eval-file flag inside piped `.redis` sessions, with a literal `<now>` | Critical | Accepted: Lua runs are `.sh` regions calling `--eval /lab/lua/*.lua`; `TIME` inside Lua; V18 hash check | plan overview, stage map, matrix R31b/R42/R43/R44b, AC14; phase 01 §2; phase 02 runner/V17/V18/neg r; phase 03 files and regions; phase 06 format |
| 2 | Eviction: 1 s LRU clock, fill larger than limit, R21 bound | High | Accepted: `sleep 2` steps, `MAX` from `used_memory`, non-evicting fill check, R21 narrated | matrix R17–R21; must-fix 8; phase 03 eviction region |
| 3 | SLOWLOG cannot see UNLINK or a small SAVE at 10000 µs; EVAL rebuild pollutes the log | High | Accepted: threshold 0 + reset right before the measured command, restore 10000 in the region | matrix R22/R32; phase 03 bigkey and rdb-loss |
| 4 | Replica reconnect gated by `repl-timeout 60`; `sync_partial_ok` not deterministic | High | Accepted: `docker restart` replica, bounded poll ≤ 20 s, convergence asserted, counters recorded | matrix R35; must-fix 3; phase 03 partition; phase 06 stage 7 |
| 5 | Gates: fingerprint in learner `check.sh`, broken by Phase B, leaks names/env; absent extras ✘; no loopback/identity check | High | Accepted: controller-only hashed fingerprint with `--compare`; `check.sh` ✔/✘/`–`; C14 binding, C15 run_id; no prune | must-fix 7; AC6/AC11; phase 01 step 1; phase 02 check.sh/V17/neg p; phase 03 lifecycle; phases 05, 08, 09 |
| 6 | Git Bash path conversion hidden by the runner's env; `pwd -W` from caller cwd | High | Accepted: `MSYS_NO_PATHCONV=1` prefix or `//path`, `HERE` from script dir, runner does not set it, lint | phase 01 S7 and §2; phase 02 runner/V17; phase 03; phase 05 note; phase 06 stage 8 |
| 7 | Two-client runs: no start barrier, no reset, two clocks, rerun gate counts only errors | High | Accepted: Redis barrier, reset regions, host-ms only (no server-TIME mode), 3 runs from reset, semantic rerun gate; R41 margin 2.5 s | must-fix 2; matrix R02/R41; phase 02 runner/rerun gate; phase 03; phase 05/06 walk tables |
| 8 | R31: all slide-37 jobs are due, naive run consumes the Lua run's input | High | Accepted: 1 due + 2 future jobs, re-seed between variants | matrix R31a/R31b; phase 03 seed and 06-delay |
| 9 | Verifier reuse claims: V16 redefined, V07 psql rule, multi-run rows, missing flags, widget-smoke order, quiz JSON unchecked, id drift | High | Accepted: V16 kept, lint = V17, redis-cli V07 rule, `# chạy lúc`, split rows + design rows, `derived.json`, new flags, widget-smoke in phase 02, `--fragment` loads quiz, R01a/R01b, `driver-drill`, phase-05 gate V15 | matrix; phases table; AC2/AC4/AC10; phases 02, 04, 05, 06, 07 |
| 10 | Manifest append-only vs re-runs | High | Accepted: one line per run path, replaced on write; reps outside `runs/`; M01 on current hash | data flow; AC4; phase 01 §3; phase 02 runner/M01; phase 08 |
| 11 | `99-cleanup.sh` deletes learner keys, breaks the network, runs before handoff | High | Accepted: never deletes `l06:my:*`/`l06:hw:*`; network removed only after detach; phase 09 re-seeds and leaves main up | rollback; phase 01 §1; phase 03 cleanup; phase 05 prep; phase 09 step 4 |
| 12 | Guards check names only; destructive steps could reach main | High | Accepted: destructive blocks only on extras, target printed first, lint rejects main targets, neg o | phase 01 §2; phase 02 V17; phase 03 regions; phase 06 stage 3 |
| 13 | Homework H1 cannot fail on a single key; H5 needs an undeclared hook; R47 vs phase 04 disagree | Medium | Accepted: H1 counts `l06:hw:bookings:FA634`; `HW_TTL_MS` + `HOLD_MS` in contract; bad fixture ✘ H1, H2, H5 in both places | matrix R47a/R47b; phase 04; phase 05 `#bai-tap` |
| 14 | Slides 7 (Sentinel) and 8 (Cluster failover) chipped OK without measurement | Medium | Accepted: PART with "chưa đo trực tiếp" | matrix R35/R36; must-fix 5; phase 01 §6; phase 06 stage 7 |
| 15 | Misc: R22 old dump/bgsave wait; lesson-02 container clash; widget `esc()`; DEBUG SET-ACTIVE-EXPIRE restore lint | Medium | Accepted: all four applied | matrix R22; risks; phase 02 C01/C07/V17/V19/neg n, q; phase 03; phase 05 shell; phase 06 widgets |

### Whole-Plan Consistency Sweep

Searched `plan.md` and `phase-0*.md` on 2026-10-31 for each superseded term. Every remaining hit is either a historical mention in this section or the new rule that replaces the old one.

| Superseded term | Result |
|---|---|
| eval-file flag inside `.redis` | Gone. `--eval` appears only in `.sh` lines and in the V17 rule that forbids it in `.redis`. |
| `--timed` / server-`TIME` timeline mode | Gone. Phase 02 states "There is no server-`TIME` mode"; `TIME` remains only inside Lua (`redis.call('TIME')`). |
| Lua `kiem-chung` PASS/FAIL checkers | Gone. `kiem-chung` is plain commands + `table.expect` (phase 01 §2, phase 03 step 3, phase 06). |
| `localhost:6379` | Gone. All host clients use `127.0.0.1:6379`; `localhost` appears only in the V17 rule and in the "not `localhost`" notes. |
| `0.0.0.0` bind | Gone. Main publishes `127.0.0.1:6379:6379`; C14 and fingerprint `main_bind` check it. |
| Old V16 meaning (lint) | Gone. V16 = quiz/interview number trace; lint = V17; negatives j/k/l → V17. |
| `sync_partial_ok` assertion | Gone. R35 and must-fix 3 record it as observed only. |
| Cleanup before handoff | Gone. Phase 09 step 4 says "Do not run `99-cleanup.sh`"; extras go down by exact name, main is re-seeded. |
| Fingerprint via `docker inspect` / names | Gone. Fingerprint uses `docker ps -a` fields, hashed. `docker inspect` remains only for lab containers (`00-containers.sh` drift check, `network inspect` in cleanup). |

Reconciled during the sweep:
- Phase 09 file list did not include must-fix 6's `shell-tail.html` edit; added, and the `git status` allow-list now includes it.
- Phase 05 gate in the phases table now lists V15, matching phase 05.
- Negative-test count is 19 everywhere (phase 02, phase 07, AC10, phases table); `--runs` RED count is 57 everywhere.
- `check.sh` expectation is "✔ or `–`, rc 0" in AC6, R48a, phases 03, 08 and 09.
- Bad homework fixture is "✘ H1, H2, H5" in R47b and phase 04.
- Effort: phases sum to 11.5h, matching the frontmatter.

Resolved by the controller (2026-10-31), following decision (b), "no Lua before it is taught":
- Data builders outside stages 6, 8 and 9 do not use `EVAL`. Stage 2 encoding thresholds, stage 3 active-expiry fill and stage 6 big-key build are `.sh` regions that generate plain commands with `seq … | awk '{print "HSET l06:… f"$1" v"}' | docker exec -i advance-be-redis redis-cli` (use `--pipe` only where the region is not a timed measurement). Phase 03 gets +0.25h. The stage 1 optional busy loop (R03) keeps its one `EVAL`, because the script itself is the subject of that demo (`BUSY`/`SCRIPT KILL`). It sits in a `details.fold` marked "xem trước Lua — học kỹ ở chặng 8". V17 lint allows `EVAL` only in stage 6/8/9 files and in region `01-block.busy`.

Contradictions left unresolved:
- Phase 03 step 5 of the partition region marks the "bare `REPLICAOF` repeat is a no-op" reason `[UNVERIFIED]`. It was not tested, because testing it would change container state. The plan does not depend on it, because it uses `docker restart`.

## Validation Log

### Session — 2026-10-31
- Verification pass skipped: the Red Team Review already holds evidence-backed verification. The only `[UNVERIFIED]` tag left (bare `REPLICAOF` repeat) is not load-bearing, because the plan uses `docker restart`.
- Q1, time budget → keep 295 core minutes (+70 optional, homework in the evening). Unchanged.
- Q2, Node client for the driver drill and homework → node-redis (matches lesson 02 `redis` ^6.3.0). Unchanged (phase 04 step 3).
- Q3, container state after the build → only `advance-be-redis` (127.0.0.1:6379) stays up, with the seed. Extras are started on demand by `00-containers.sh up <name>`. This matches phase 09.
- Earlier user decisions: apply all 15 red-team groups; stage checks are plain commands with `table.expect`, no Lua checkers.
- 2026-11-01, controller: the V01 size budget is raised from 340 KB to 520 KB. With all fragments the guide builds to about 482 KB. The bulk is Vietnamese teaching prose, not code or runs. Cutting about 30 % of the explanations would cut requested content, whereas lesson 07 shipped at 354 KB and a local single-file page of this size loads fine. Delegates are told to avoid padding but not to drop content.
