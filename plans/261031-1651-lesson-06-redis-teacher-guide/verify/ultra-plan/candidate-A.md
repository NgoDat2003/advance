=== FILE: plan.md ===
---
title: "Lesson 06 Redis teacher guide (redis-cli-first, Redis 7.2.3-measured)"
description: "Single-file Vietnamese teacher guide for K1 Lesson 06 Redis (46 slides + 8 evidence blocks) backed by small redis-cli/shell snippets recorded on advance-be-redis* lab containers."
status: pending
priority: P1
effort: 10.5h
branch: main
tags: [lesson-06, redis, teacher-guide, redis-cli, lua, distributed-lock, tdd]
blockedBy: []
blocks: []
created: 2026-10-31
---

# Lesson 06 — Redis teacher guide

## Overview

Build `reports/advanced_backend/lesson_06_redis_teacher_guide.html` on the lesson-07 single-column shell (no rail) so Đạt can study it on about 2026-11-02 in 4h55 of core time. Every experiment is a small `.redis` or `.sh` snippet in `labs/lesson-06-redis/` that he pastes into `redis-cli` (inside `docker exec -it`) or runs in Git Bash. The controller runs the same regions through `verify/run-redis.mjs`, records output verbatim in `runs/`, and `verify/verify-guide.mjs` (adapted from lesson 07) proves every guide number and code block traces to a lab file and a run. All 46 slides map once, with chips `Đúng trên Redis 7.2` / `Đúng một phần` / `Cần sửa`. Redis writes happen only on `advance-be-redis*` containers; Postgres is not used at all; no git command other than `git status`.

## Data flow

Containers (`00-containers.sh`) and seed → lab regions (`.redis`/`.sh`/`.lua`, display rule in `verify/lab-text.mjs`) → `verify/run-redis.mjs` → `runs/*.txt` + sha256 `runs/manifest.tsv` → `runs/data/wN.json` (with `sources`) → delegate fragments/widgets against `assembly/contract.md` → `assemble.mjs` → guide → verifier, negative tests, render-check, ultra review.

## Stage map (study day ≈ 2026-11-02)

| Stage | Slides | Topic | Core | Optional | Experiments (run ids) | Widget |
|---|---|---|---|---|---|---|
| `#cach-hoc` | 1–3 | setup, run method, two terminals, warm-up | 10 | – | 00-containers, 00-seed, check | – |
| 1 | 4, 5, 10–14 | why fast, measured: one thread, I/O threads off, RTT vs pipelining, value size | 35 | 10 (busy Lua + SCRIPT KILL) | 01-block.A/B, 01-why-fast, 01-bench.sh | W1 event-loop lanes |
| 2 | 15, 16, 29–31 | dict, encodings, slide 30 Hash vs JSON + lost update | 30 | – | 02-encodings, 02-json-race.A/B | W2 encoding converter |
| 3 | 17–23 | expire dict, passive vs active, eviction policies | 35 | 10 (volatile-ttl, allkeys-random) | 03-expiry, 03-eviction.sh | W3 expiry sampler, W4 eviction |
| 4 | 24–27 | RDB, AOF, hybrid, kill -9 restart loss | 25 | 5 (preamble off) | 04-persistence.sh | W5 loss window |
| 5 | 28, 32–35 | String counter race, List queue, Hash cart, Set, ZSET leaderboard | 30 | 10 (Streams contrast) | 05-structures, 05-queue.A/B, 05-counter.A/B | – (inline SVG) |
| 6 | 36–38 | delay task + atomic claim, big keys DEL vs UNLINK | 30 | 5 (lazyfree-lazy-user-del) | 06-practices, 06-delay.A/B | – (inline SVG) |
| 7 | 6–9, 39 | replica lag/stale read, WAIT, manual failover, Sentinel (diagram), slots, hashtag, CROSSSLOT | 35 | 10 (split-brain failover) | 07-architecture.sh, 07-cluster | W6 slot calculator, W7 partition replay |
| 8 | 40 | capstone lock: no lock, NX, TTL+DEL bug, compare-and-delete, fencing | 40 | 5 (Redlock fold) | 08-lock.A/B | W8 lock timeline |
| 9 | 41 | OmniPOS M2 bridge: token bucket, idempotency, best practices, driver drill | 25 | – | 09-bridge, 09-bucket.A/B | W9 token bucket |
| Wrap | 42–46 | recap, homework spec, interview, cheat sheet, refs | 15 | 45 (homework, evening) | hw-check.sh | – |
| **Total** | 46 | | **310** | **70 + 45** | | |

310 min is above the 4–5 h target, so stage 1's value-size benchmark (5 min) and stage 9's drill review (10 min) are marked "nếu còn sức" in the time table, giving a firm core of 295 min. Nothing is cut from the page.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract, baseline, run-method smoke](phase-01-contract-baseline-smoke.md) | 0.5h | – | `contract.md` frozen; `runs/00-fingerprint-before.txt`; `runs/run-method-smoke.txt` decides learner method |
| 02 | [Tests first](phase-02-tests-first.md) | 1.25h | 01 | `expected.tsv` frozen; `--selftest` GREEN; `--runs` RED "missing run" for every row; `check.sh` prints ✘ (not crash) on missing containers |
| 03 | [Containers, seed, experiments, recorded runs](phase-03-containers-experiments-runs.md) | 3h | 02 | `check.sh` all ✔ twice (seed idempotent); `--runs` GREEN or each deviation logged; `--lint` GREEN; rerun gate GREEN |
| 04 | [Widget data, homework, driver claims](phase-04-widget-data-homework-driver.md) | 0.75h | 03 | `--data` GREEN; `hw-check` solution ✔ / bad fixture ✘; `runs/driver-claims.txt` complete |
| 05 | [Guide shell and assembler](phase-05-guide-shell-assembler.md) | 1h | 02 (parallel with 03–04) | `assemble.mjs --allow-stubs` builds; V01–V04, V09, V10, V14 GREEN on shell |
| 06 | [Stage fragments (3 delegates)](phase-06-stage-fragments.md) | 1.75h | 04, 05 | `--fragment` GREEN per stage; `node --check` per widget |
| 07 | [Assemble, verify, render-check](phase-07-assemble-verify-render.md) | 0.75h | 06 | full verify GREEN; negative tests all RED-as-designed; render-check 0 errors / 0 overflow / 0 small targets |
| 08 | [Ultra code review and fixes](phase-08-ultra-review-fixes.md) | 1h | 07 | no open Critical/Important; affected checks re-run GREEN |
| 09 | [Docs, final gate, handoff](phase-09-docs-final-gate-handoff.md) | 0.5h | 08 | final gate table all pass; fingerprint before = after; handoff written |

## Expected-result matrix (frozen in `verify/expected.tsv` in phase 02, before any experiment)

Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`, – = no chip. "n" = whatever the run records; the regex asserts shape or relation only. Timing values are labelled "phụ thuộc máy".

| ID | Run id | Slide | Expected Redis 7.2.3 result | Chip |
|---|---|---|---|---|
| R01 | 01-why-fast.threads | 13, 14 | `io_threads_active:0`, `io-threads 1`, `multiplexing_api:epoll`; `/proc/1/task` count n > 1 (bio threads, not I/O threads) | 13 OK, 14 PART |
| R02 | 01-block.sleep.timeline | 13 | A `DEBUG SLEEP 2`; B `PING` sent at +0.5 s returns PONG ≥ 1.4 s later | OK |
| R03 | 01-block.busy.timeline (opt) | 13 | Lua busy loop 6 s: B gets `BUSY Redis is busy running a script` after 5 s; `SCRIPT KILL` → A gets `ERR ... killed` | – |
| R04 | 01-bench.pipeline | 12 | GET `-P 16` req/s ≥ 5× `-P 1` | PART |
| R05 | 01-bench.size | 12 | `-d 102400` req/s ≪ `-d 16`; MB/s computed n | PART |
| R06 | 01-bench.mget | 41 | `-c 1`: MGET of 10 keys keys/s ≥ 5× GET keys/s | OK |
| R07 | 01-why-fast.slowlog | 13 | SLOWLOG entry `debug sleep` ≥ 500000 µs; `LATENCY LATEST` event `command` ≥ 500; thresholds restored | – |
| R08 | 02-encodings.string | 31 | `int`; 44-byte `embstr`; 45-byte `raw`; `APPEND` turns embstr into raw | OK |
| R09 | 02-encodings.hash | 16, 33 | 512 fields `listpack`, 513 `hashtable`; 64-byte value `listpack`, 65 `hashtable`; MEMORY USAGE jump n | 16 OK, 33 PART |
| R10 | 02-encodings.set-zset-list | 32, 34, 35 | ints 512 `intset` / 513 `hashtable`; strings 128 `listpack` / 129 `hashtable`; zset 128 `listpack` / 129 `skiplist`; small list `listpack`, large `quicklist` | 34 PART, 35 PART |
| R11 | 02-encodings.slide30-memory | 30 | 4-field user Hash `listpack` n B vs JSON String `raw` n B | – |
| R12 | 02-encodings.slide30-ops | 30 | C1 `HGET` 1 value vs `GET` STRLEN n bytes; C2 `HINCRBY` → 31; C3 `HGETALL` 8 lines | – |
| R13 | 02-json-race.lost.timeline | 30 | both GET JSON; A SET age 31; B SET email → final `age` 30 (A lost); hash variant keeps both | – |
| R14 | 03-expiry.expire-dict | 18 | `INFO keyspace` `keys=n,expires=m`, m < n; `TTL` -1 / -2; `MEMORY STATS` shows `overhead.hashtable.expires` | OK |
| R15 | 03-expiry.passive | 19 | `DEBUG SET-ACTIVE-EXPIRE 0`; 1000 keys PX 100; after 500 ms keyspace still 1000; one GET → nil and `expired_keys` +1; restored to 1 | PART |
| R16 | 03-expiry.active | 20, 21 | 10000 keys PX 1000, no access; after 3 s only persistent keys remain, `expired_keys` +10000; `expired_stale_perc`, `expire_cycle_cpu_milliseconds` printed; no ZSET anywhere (expires is a hashtable) | 20 PART, 21 FIX |
| R17 | 03-eviction.noeviction | 22, 23 | `maxmemory-policy noeviction` default; write past 3 MB → `OOM command not allowed`; GET still works | 23 PART |
| R18 | 03-eviction.allkeys-lru | 23 | hot-survival % > cold-survival %; `evicted_keys` > 0 | PART |
| R19 | 03-eviction.allkeys-lfu | 23 | hot-survival % > cold-survival % | PART |
| R20 | 03-eviction.volatile-ttl (opt) | 23 | all non-TTL keys survive; shortest-TTL group evicted first; then OOM | PART |
| R21 | 03-eviction.allkeys-random (opt) | 23 | hot and cold survival within ±15 points | PART |
| R22 | 04-persistence.rdb-loss | 26 | `save ""`; 1000 keys; `BGSAVE`; 500 more; `docker kill`; start → DBSIZE 1000; `latest_fork_usec` n; `SAVE` in SLOWLOG, `BGSAVE` returns "Background saving started" | OK |
| R23 | 04-persistence.aof-loss | 25 | `appendonly yes`, `everysec`; 1500 keys; wait 2 s; `docker kill`; start → DBSIZE 1500 | PART |
| R24 | 04-persistence.hybrid | 27 | `appendonlydir` has `*.base.rdb` starting `REDIS`; preamble `no` + `BGREWRITEAOF` → `*.base.aof` starting `*`; restored `yes` | PART |
| R25 | 05-queue.brpop.timeline | 32 | B `BRPOP` blocks; A `LPUSH`; B gets item; second consumer gets the next item only | PART |
| R26 | 05-structures.list-reliable | 32 | `BLMOVE` to processing list; item stays until `LREM` ack | PART |
| R27 | 05-structures.hash-cart | 33 | slide 33 commands: HSET 1, HINCRBY 2, HLEN 2, HDEL 1, HGETALL | (in R09) |
| R28 | 05-structures.set-likes | 34 | duplicate `SADD` → 0; `SINTER` common followers set | (in R10) |
| R29 | 05-structures.zset-board | 35 | `ZINCRBY`; `ZRANGE … REV WITHSCORES` top 3 order | (in R10) |
| R30 | 05-counter.getset.timeline / .incr.timeline | 31 | GET+SET from 2 clients → 1 (lost); INCR → 2 | (in R08) |
| R31 | 06-delay.naive.timeline / .lua.timeline | 37 | naive: both pollers process `o1`; Lua claim: one gets `o1`, other nil | OK |
| R32 | 06-practices.bigkey | 38 | 1M-field hash MEMORY USAGE n MB; `--bigkeys` lists it; DEL µs (SLOWLOG) ≥ 10× UNLINK µs; `lazyfreed_objects` +1 | OK |
| R33 | 06-practices.lazyfree (opt) | 38 | `lazyfree-lazy-user-del yes` → DEL fast; restored `no` | – |
| R34 | 07-architecture.replica | 6 | `role:slave`, `master_link_status:up`, offsets equal after write | OK |
| R35 | 07-architecture.partition | 6, 7 | network disconnect → replica GET returns old value; master `WAIT 1 500` → 0; reconnect → new value, `sync_partial_ok` ≥ 1 | 7 OK |
| R36 | 07-architecture.failover (opt) | 8 | `REPLICAOF NO ONE` → `role:master`; write on both; `REPLICAOF` back → replica's write gone | 8 OK |
| R37 | 07-cluster.keyslot | 9, 39 | `cluster_slots_assigned:16384`; `CLUSTER KEYSLOT` values n; `{34}` pair equal | 9 OK |
| R38 | 07-cluster.crossslot | 39 | `SINTER` untagged → `CROSSSLOT`; tagged → result | OK |
| R39 | 08-lock.nolock.timeline | 40 | both see free; final owner B; log has 2 `BOOKED` | FIX |
| R40 | 08-lock.nx.timeline | 40 | A `OK`, B `(nil)` | (in R39) |
| R41 | 08-lock.ttldel.timeline | 40 | PX 2000, A works 3 s; B acquires at ≈2.1 s; A `DEL` → 1 removes B's lock; C acquires → 2 holders | (in R39) |
| R42 | 08-lock.cad.timeline | 40 | same timing with `lock-release.lua`: A gets 0; B's lock intact | (in R39) |
| R43 | 08-lock.fencing.timeline | 40 | tokens 1 and 2; B write accepted; A late write → `STALE` | (in R39) |
| R44 | 09-bucket.naive.timeline / .lua.timeline | 41 | naive: 2 allowed from 1 token; Lua: 1 allowed, 1 denied | OK |
| R45 | 09-bridge.bucket30 | – | cap 10, slow refill, 30 calls → 10 allowed, 20 denied, `retry_after_ms` > 0 | – |
| R46 | 09-bridge.idempotency | – | `NEW`, then `IN_PROGRESS`, `DONE` + same body, other hash → `MISMATCH`; TTL > 0 | – |
| R47 | hw-check.solution / .bad | 43 | solution 5/5 ✔; bad fixture ✘ on H1, H2 | OK |
| R48 | check.after-seed / .rerun | – | identical, all ✔ | – |

Null-chip slides (title/section/question/recap pages): 1, 2, 3, 10, 11, 15, 17, 22, 24, 28, 29, 30, 36, 44, 45, 46. Slides 4, 5 (PART, basis: redis.io docs, Memcached not measured), 42 (PART) and 43 (OK) get design chips. Chip per slide is frozen in `contract.md` §6 and must equal `expected.tsv`.

## Acceptance criteria

1. Guide ≤ 340 KB, no external script, only Google Fonts from outside, no rail (P07, V01, V10).
2. `SLIDES` covers 1–46 exactly once; chips equal `expected.tsv` (P05/P07, V04).
3. Each stage 1–9 has a story callout, a diagram, a measured stats table, a 30-second check, a byte-exact `pre[data-cmd]`, a recorded run, a worked example, a `callout challenge` with PASS criteria, and 4 quiz items (P06, V05, V11, V12).
4. Every `b.m`, `pre[data-run]` and `run-wN` value traces to a `runs/` file whose sha256 matches `runs/manifest.tsv` (P03, P04, V06–V08, M01).
5. Every `expected.tsv` row matches, or is `deviation` with a `verify/deviations.md` entry and changed narrative/chip (P03).
6. `check.sh` all ✔ after seed and after a second seed, with identical output (P03).
7. `--lint`: every key in `labs/` starts `l06:`; no `6380`, no `FLUSHALL`/`FLUSHDB` outside own-container regions, no `CONFIG SET` without a restore line in the same region (P02, P03).
8. Storage keys `l06-*` only; dark and light both work (P07, V09, V14).
9. render-check at 375/768/1440: 0 runtime errors, 0 overflow, 0 targets < 44 px (P07).
10. Negative tests: every case RED with its expected code (P02, P07).
11. `runs/00-fingerprint-before.txt` = `runs/00-fingerprint-after.txt` for every non-`advance-be-redis*` container and port 6380 (P01, P09).
12. No open Critical/Important review finding (P08).
13. README, TONG_QUAN row 06 and lesson-07 `#tiep-theo` link the guide; handoff exists; `git status` lists only expected paths; no branch/commit/push (P09).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| Git Bash (mintty) `docker exec -it` fails with "not a TTY" | H×M | Guide gives PowerShell/Windows Terminal form and `winpty docker exec -it …` for Git Bash; smoke test records which works. |
| DBX Redis console runs one command at a time or mis-splits Lua | M×M | Smoke test decides; default is redis-cli; DBX is the key browser (type, TTL, memory) and single-command console. |
| `redis-cli` escapes non-ASCII in replies (`\xe2…`) | H×L | Contract: Redis-returned strings are ASCII (`PASS`/`FAIL`); Vietnamese only in comments and guide prose. |
| `#` lines are sent as commands (`ERR unknown command '#'`, verified 2026-10-31) | certain | `lab-text.mjs` strips them for display, runner and pipe form (`grep -v '^#'`). |
| Two-client timing flakes | M×M | Fixed `#@ sleep` steps, server-side `TIME` stamps, each A/B run 3×, run 1 recorded, variance logged. |
| A config change on main is left behind | M×H | Every `CONFIG SET`/`DEBUG SET-ACTIVE-EXPIRE` region ends with its restore; `check.sh` C-config rows; `00-containers.sh reset main`. |
| Eviction keys evict learner data | L×M | Eviction runs only on `advance-be-redis-evict`. |
| Measurement contradicts a slide or the matrix | M×M | Keep data, change narrative/chip, log deviation; runs only written by the runner (manifest). |
| HTML over budget | M×M | Excerpts with `…`, folds, V01 limit 340 KB. |

Rollback: `bash labs/lesson-06-redis/99-cleanup.sh` UNLINKs `l06:*` on main, restores main config, removes the extra `advance-be-redis-*` containers with their anonymous volumes, and removes network `advance-be-l06`. `99-cleanup.sh --all` also removes main. All repo files are new except the three doc edits, whose original lines are quoted in phase 09.

## Open questions for the user

None blocking. One confirmation: core is 295 min (+70 optional, homework 45 min in the evening). If Đạt wants 4 h, stage 7's Sentinel/failover and stage 9's drill move to the evening without dropping content.

=== FILE: phase-01-contract-baseline-smoke.md ===
---
phase: 1
title: "Contract, baseline, run-method smoke"
status: pending
priority: P1
effort: 0.5h
dependencies: []
---

# Phase 01 — Contract, baseline, run-method smoke

## Goal
Freeze every name parallel work depends on, record a safety fingerprint of everything the lesson must not touch, and decide how Đạt runs snippets.

## Files to create/modify (owner: controller)
Plan folder `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/`:
- `assembly/contract.md`
- `verify/fingerprint.sh`
- `runs/00-fingerprint-before.txt`, `runs/run-method-smoke.txt`

## Tasks and steps
1. `verify/fingerprint.sh` prints sorted lines `name|id|image|StartedAt|Status|ports` from `docker inspect` for every container whose name does not match `^advance-be-redis`, plus `netstat -ano | grep ':6380 '` (expected empty). Write `runs/00-fingerprint-before.txt`.
2. Smoke tests, all on the existing `advance-be-redis` with key `l06:smoke` only, recorded in `runs/run-method-smoke.txt`:
   - S1 pipe: `printf 'SET l06:smoke 1\nGET l06:smoke\n' | docker exec -i advance-be-redis redis-cli --no-raw` → `OK` / `"1"`.
   - S2 streaming: `(echo TIME; sleep 1; echo TIME) | docker exec -i … redis-cli` → seconds differ by 1 (confirms the runner can pace commands in one session; seen 2026-10-31).
   - S3 comment line: `# x` → `ERR unknown command '#'` (seen 2026-10-31).
   - S4 UTF-8: `ECHO "Đạt"` in `--no-raw` shows escaped bytes.
   - S5 DBX: through the DBX Redis tool on `ADVANCE_BE_REDIS`, send one command, then a two-line input. Record whether both run.
   - S6 TTY: `docker exec -it` from Git Bash cannot be tested headless; record "unverified, guide shows winpty and PowerShell forms".
   - `UNLINK l06:smoke`.
3. Decision rule written into `contract.md` §5: primary method is interactive `redis-cli` in `docker exec -it advance-be-redis redis-cli` (paste a whole block). Pipe form `grep -v '^#' labs/lesson-06-redis/<file> | docker exec -i advance-be-redis redis-cli` is the fallback for long blocks. If S5 runs multi-line, DBX is listed as an alternative for single-client snippets. Otherwise DBX is used only to browse keys (type, TTL, memory). Two-client steps use two terminal tabs, A and B.
4. Write `assembly/contract.md` (v1):
   - §1 Key registry (all `l06:`): `l06:user:*`, `l06:cart:*`, `l06:q:*`, `l06:delay:*`, `l06:big:*`, `l06:exp:*`, `l06:ev:{hot,cold,ttl}:*` (evict container), `l06:p:*` (persistence containers), `l06:rep:*`, `l06:{34}:*` and `l06:slot:*` (cluster container), `l06:lock:*`, `l06:fence:*`, `l06:seat:*`, `l06:tb:*`, `l06:idem:*`, `l06:bench:*`, `l06:hw:*` (homework), `l06:my:*` (learner; never removed by seed).
   - §2 File formats. In a `.redis` file, a region is `# #region <id> · <tiêu đề> (slide N)` … `# #endregion`. Comment lines start with `#`. Runner directives are `#@ sleep <s>` and `#@ ct <container>`. One command per line. No non-ASCII outside comments. The last region of each stage file is `kiem-chung`, a Lua `EVAL` that returns `PASS Cn …`/`FAIL Cn …` lines. In a `.sh` file, regions use the same markers, `set -u`, and only `docker` commands on `advance-be-redis*` names.
   - §3 Run ids (region ids are unique per file stem across `.redis`/`.sh`). `runs/<stem>.<region>.txt`; two-client runs add `.A/.B/.timeline.txt`. `data-cmd="<file>#<region>"`, `data-run="<stem>.<region>[.timeline]"`, widget data `run-w1…w9`.
   - §4 Fragment format and CSS vocabulary (lesson-07 classes plus `.story`, `.check30`, `table.stats`, `.lanes`, `.slotcalc`, `.bucket`).
   - §5 Learner workflow from step 3.
   - §6 Slide → stage → chip → required anchor table, copied from the plan matrix. Every PART and FIX slide needs `id="sl-NN"`.
   - Storage keys: `l06-c<N>-<slug>`, `l06-theme`, `l06-warmup`, `l06-hw-*`, `l06-drill-*`.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| fingerprint script runs twice with no change | two identical files | `bash verify/fingerprint.sh > verify/tmp/fp-a.txt; bash verify/fingerprint.sh > verify/tmp/fp-b.txt; diff verify/tmp/fp-a.txt verify/tmp/fp-b.txt` |
| 6380 untouched | grep line empty | `grep 6380 runs/00-fingerprint-before.txt` |
| smoke key removed | `(integer) 0` | `docker exec advance-be-redis redis-cli EXISTS l06:smoke` |
| contract covers 46 slides | 46 rows, each once | `grep -cE '^\| [0-9]+' assembly/contract.md` plus a quick node count |

## Verification
`bash verify/fingerprint.sh | diff - runs/00-fingerprint-before.txt` → empty; `cat runs/run-method-smoke.txt` shows S1–S6.

## Risks and rollback
Smoke touches only `l06:smoke`. Rollback deletes the four new files.

=== FILE: phase-02-tests-first.md ===
---
phase: 2
title: "Tests first: check, expected matrix, runner, verifier, negative tests"
status: pending
priority: P1
effort: 1.25h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Every checker exists and is RED for the right reason before any experiment, lab region or HTML exists.

## Files to create/modify (owner: controller)
Plan folder: copy from `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/`, then adapt.
- `verify/lab-text.mjs` (new; shared display rule)
- `verify/run-redis.mjs` (replaces `run-lab.sh`)
- `verify/merge-timeline.mjs` (adapted)
- `verify/verify-guide.mjs` (adapted)
- `verify/negative-tests.sh` (adapted)
- `verify/rerun-gate.mjs`
- `verify/expected.tsv`, `verify/deviations.md` (empty header)
- `verify/fixtures/` (tiny guide, lab and run for `--selftest`)

Labs: `D:/study/advance-be/labs/lesson-06-redis/check.sh`.

## Tasks and steps
1. `lab-text.mjs` exports `regionText(file, id)` and `displayText(file, id)`. `displayText` drops `#` lines for `.redis` and keeps `.sh`/`.lua`/`.ts` verbatim. It is imported by the runner, the assembler and the verifier, so there is one rule.
2. `run-redis.mjs`:
   - `node verify/run-redis.mjs <file> --region <id> [--out name]` opens one `docker exec -i <ct> redis-cli --no-raw` session (`<ct>` from `#@ ct`, default `advance-be-redis`, refuses any name not matching `^advance-be-redis(-[a-z]+)?$`). Before command k it writes `ECHO @@k`, then the command. It honours `#@ sleep` by delaying stdin writes. Post-processing replaces `"@@k"` with `127.0.0.1:6379> <command k>`.
   - `--timed` adds `TIME` before each command and renders `[HH:MM:SS.mmm]` (server clock, shared by A and B).
   - `.sh` regions run as `bash -c` with each line echoed as `$ <line>`. `MSYS_NO_PATHCONV=1` is set.
   - `--ab <A> <B> <region> <delayB>` runs both timed sessions and writes `.A/.B/.timeline.txt` via `merge-timeline.mjs`.
   - Header: `# chạy lúc dd/mm/yyyy HH:MM +0700 · Redis <redis_version from INFO> · <container>`. Each written file appends `sha256<TAB>file` to `runs/manifest.tsv`.
3. `verify-guide.mjs` keeps lesson-07 V01–V15 semantics with Redis paths (`labs/lesson-06-redis`, guide `lesson_06_redis_teacher_guide.html`, slides 1–46, keys `l06-`, V01 limit 340 KB) and adds:
   - V05 compares `pre[data-cmd]` with `displayText`;
   - V12 requires `.story`, a `figure`/`svg`, `table.stats`, `.check30`, `.callout.challenge`, `.quiz` per stage;
   - V15 matches `requirepass|AUTH |redis://[^ ]*@`;
   - V16 `--lint` over `labs/`: non-`l06:` key in key position of known commands, `6380` (except the single port-guard line in `00-containers.sh`, tagged `# guard-port`), `FLUSHALL|FLUSHDB` in a file whose `#@ ct` is main, `CONFIG SET x` without a later `CONFIG SET x` in the same region, and container names outside the guard;
   - M01 in `--runs`: every run's sha256 equals `manifest.tsv`;
   - D01 in `--runs`: every `deviation` row has a `deviations.md` entry.
4. `expected.tsv`: columns `id run slides regex claim chip status`. Rows R01–R48 from the plan matrix, all `expect`. Regexes assert shape or relation; relations such as "≥ 5×" are computed by small named predicates in the verifier (`ratio(a,b)>=5`) rather than regex.
5. `check.sh`: bash; for each row prints `✔|✘ Cnn mô tả · chi tiết`. A missing container gives ✘, not an abort.
   - C01–C06: containers exist with the expected flags/network, and only main publishes a port (6379).
   - C07: no key on main outside `l06:` (`--scan`).
   - C08–C10: seed counts and encodings (user hash listpack, cart 3 fields, board 5 members).
   - C11: main config defaults (`maxmemory 0`, `noeviction`, `lazyfree-lazy-user-del no`, `slowlog-log-slower-than 10000`, `latency-monitor-threshold 0`, `appendonly no`).
   - C12: active expiry on (a PX 50 key is gone from `INFO keyspace` within 1 s).
   - C13: no `l06:lock:*` left.
   - C14: fingerprint equals `runs/00-fingerprint-before.txt`.
   - Exit code = number of ✘.
6. `negative-tests.sh` cases, each expecting its code:
   - a: one char changed in a `pre[data-cmd]` → V05;
   - b: a `b.m` number not in its run → V07;
   - c: storage key `l07-` → V09;
   - d: slide 21 removed from SLIDES → V04;
   - e: slide 40 chip changed → V04;
   - f: external script → V10;
   - g: corrupted R16 run → R16;
   - h: run edited by hand → M01;
   - i: fake number in `w4.json` → `--data`;
   - j: `SET foo 1` added to a lab copy → V16;
   - k: `6380` added to a lab copy → V16;
   - l: `CONFIG SET maxmemory 1mb` without restore → V16;
   - m: a `deviation` row with no deviations entry → D01.
   Guide-based cases run once the guide exists (phase 07). Lab/run cases run on copies under `verify/tmp/neg/` from phase 03.
7. `rerun-gate.mjs` runs each single-client region twice in one session; the second pass must not show more `(error)` lines than the first.

## Test matrix
| Test | Expected now | Command |
|---|---|---|
| verifier self-test on fixtures | GREEN (V05 and V07 catch the planted faults) | `node verify/verify-guide.mjs --selftest` |
| runs mode before experiments | RED, "missing run" × 48 rows | `node verify/verify-guide.mjs --runs` |
| lint before labs exist | RED "labs dir missing" (not crash) | `node verify/verify-guide.mjs --lint` |
| check before setup | ✘ rows, no shell error | `bash labs/lesson-06-redis/check.sh; echo rc=$?` |
| runner name guard | refuses `quan-ly-hop-dong-postgres-1` with exit 2 | `node verify/run-redis.mjs verify/fixtures/x.redis --region a --ct quan-ly-hop-dong-postgres-1` |
| runner on fixture | file + manifest line written | `node verify/run-redis.mjs verify/fixtures/x.redis --region a` |

## Verification
The commands above, plus `node --check` on every `.mjs`.

## Risks and rollback
Adapting rather than rewriting keeps lesson-07 behaviour. If the stdin pacing misbehaves, the fallback is one `redis-cli` call per step for A/B files only. No A/B scenario needs `MULTI`/`WATCH` state. Rollback: delete `verify/` files.

=== FILE: phase-03-containers-experiments-runs.md ===
---
phase: 3
title: "Containers, seed, experiments, recorded runs"
status: pending
priority: P1
effort: 3h
dependencies: [2]
---

# Phase 03 — Containers, seed, experiments, recorded runs

## Goal
Write all learner-facing lab files, run them serially, and record every output until `--runs`, `--lint`, `check.sh` and the rerun gate are GREEN, or until each deviation is logged.

## Files to create/modify (owner: controller; Redis runs strictly serial)
`D:/study/advance-be/labs/lesson-06-redis/`:
- `00-containers.sh`, `00-seed.redis`, `99-cleanup.sh`
- `01-why-fast.redis`, `01-bench.sh`, `01-block.A.redis`, `01-block.B.redis`
- `02-encodings.redis`, `02-json-race.A.redis`, `02-json-race.B.redis`
- `03-expiry.redis`, `03-eviction.sh`
- `04-persistence.sh`
- `05-structures.redis`, `05-queue.A.redis`, `05-queue.B.redis`, `05-counter.A.redis`, `05-counter.B.redis`
- `06-practices.redis`, `06-practices.sh`, `06-delay.A.redis`, `06-delay.B.redis`
- `07-architecture.sh`, `07-cluster.redis`
- `08-lock.A.redis`, `08-lock.B.redis`
- `09-bridge.redis`, `09-bridge.sh`, `09-bucket.A.redis`, `09-bucket.B.redis`
- `lua/lock-release.lua`, `lua/fenced-write.lua`, `lua/delay-claim.lua`, `lua/token-bucket.lua`, `lua/idempotency-begin.lua`

Plan folder: `verify/record-all.sh`, `runs/*.txt`, `runs/manifest.tsv`, `verify/deviations.md`.

## Container lifecycle (all `redis:7.2.3`, local image, no pull)

| Container | Network | Published | Flags | Up | Down |
|---|---|---|---|---|---|
| `advance-be-redis` (main) | `advance-be-l06` | 6379:6379 | `--appendonly no --enable-debug-command local`; `-v <labs>:/lab:ro` | `up main` (recreate once: `docker rm -f -v` then run) | kept; `99-cleanup.sh --all` removes |
| `advance-be-redis-replica` | `advance-be-l06` | none | `--replicaof advance-be-redis 6379 --appendonly no --save ""` | `up replica` | `99-cleanup.sh` |
| `advance-be-redis-cluster` | `advance-be-l06` | none | `--cluster-enabled yes --cluster-config-file nodes.conf --appendonly no --save ""`, then `CLUSTER ADDSLOTSRANGE 0 16383` | `up cluster` | `99-cleanup.sh` |
| `advance-be-redis-evict` | default bridge | none | `--appendonly no --save ""` | `up evict` | `99-cleanup.sh` |
| `advance-be-redis-rdb` | default bridge | none | `--appendonly no --save ""` | `up persist` | `99-cleanup.sh` |
| `advance-be-redis-aof` | default bridge | none | `--appendonly yes --appendfsync everysec --save ""` | `up persist` | `99-cleanup.sh` |

`00-containers.sh up|down|status|reset <name>` is idempotent:
- It refuses any name outside the guard and any `-p` containing 6380.
- It recreates a container only when `docker inspect .Config.Cmd` differs from the table.
- It mounts with `MSYS_NO_PATHCONV=1` and `pwd -W`.
- `reset main` restores the six C11 config values and runs `DEBUG SET-ACTIVE-EXPIRE 1`.

Extra containers publish no port, so the learner and the runner reach them only with `docker exec`. Restarts happen only on `-rdb`/`-aof` (`docker kill` = SIGKILL, no shutdown save, then `docker start`; the anonymous `/data` volume survives).

## Tasks and steps
1. `00-seed.redis` UNLINKs the exact seed keys, then recreates them:
   - `l06:user:1` (hash, 4 fields, slide 30) and `l06:user:1:json` (51 chars);
   - `l06:cart:u1`;
   - `l06:followers:{a,b}`;
   - `l06:board:bestseller` (5 F&B items);
   - `l06:delay:orders` (3 jobs, slide 37 scores).
   It never touches `l06:my:*` or `l06:hw:*`.
2. Region design, beyond the matrix:
   - `01-block`: A runs `DEBUG SLEEP 2` (opt region: Lua busy loop 6 s using `redis.call('TIME')`). B runs `#@ sleep 0.5`, `PING`. `--ab … sleep 0` with `--timed`.
   - `01-why-fast#slowlog`: `CONFIG SET latency-monitor-threshold 100`, `SLOWLOG RESET`, `DEBUG SLEEP 0.5`, `SLOWLOG GET 1`, `LATENCY LATEST`, restore `0`.
   - `01-why-fast#threads`: `INFO server` lines only; `01-bench.sh#threads` runs `docker exec advance-be-redis sh -c 'ls /proc/1/task | wc -l'`.
   - `01-bench.sh`: `redis-benchmark -q -n 100000 -t get` with `-P 1` and `-P 16`; `-d 16` vs `-d 102400` (`-n 20000`); `-c 1 -n 20000` `GET l06:bench:1` vs `MGET l06:bench:1 … :10`. Keys are seeded first. `redis-benchmark` writes `key:__rand_int__` keys only with `-t set`, which is not used; the region ends with `--scan --pattern 'key:*'` → expected empty.
   - `02-encodings`: thresholds built with `EVAL` loops (`for i=1,513`) on `l06:enc:*`, `OBJECT ENCODING` + `MEMORY USAGE` after each step.
   - `02-json-race`: A/B with `#@ sleep`; JSON is rewritten as a whole string, hash variant uses `HINCRBY` + `HSET`.
   - `03-expiry#active`: `INFO stats` snapshot, 10000 keys via one `EVAL` with `PX 1000`, `#@ sleep 3`, snapshot again. `MEMORY STATS` shows `overhead.hashtable.expires`.
   - `03-eviction.sh` (on `-evict`, per policy): `FLUSHALL` (own container) → `CONFIG SET maxmemory 3mb` + policy → awk-generated `SET` lines piped into one `redis-cli`: 300 hot 1 KB keys, 10 `GET` rounds on hot, then 3000 cold (+ 500 `EX 60–600` keys for volatile-ttl) → Lua count `hot=n/300 cold=n/3000 ttl=n/500` + `evicted_keys`. Eviction runs before each command, so one command per line, no big Lua writes.
   - `04-persistence.sh`: `rdb-loss`/`aof-loss` write via `docker exec … redis-cli` (awk `SET l06:p:i`), `docker kill`, `docker start`, wait `PING`, `DBSIZE`, `INFO persistence` excerpt. `hybrid`: `BGREWRITEAOF`, wait `aof_rewrite_in_progress:0`, `ls /data/appendonlydir`, `head -c 5` base file, toggle preamble, restore.
   - `05-queue`: B `BRPOP l06:q:orders 10`; A at +1 s `LPUSH` ×2; second consumer shows competing consumers. `#list-reliable`: `BLMOVE … RIGHT LEFT` to `l06:q:processing`, `LREM` = ack. Optional `streams`: `XADD`/`XGROUP CREATE`/`XREADGROUP` ×2/`XPENDING`. `05-counter`: GET, `#@ sleep`, `SET n+1` per client, then `INCR`.
   - `06-delay`: naive = `ZRANGE l06:delay:orders -inf <now> BYSCORE LIMIT 0 1` → `RPUSH l06:delay:done:<job>` → `ZREM`; Lua = `redis-cli --eval /lab/lua/delay-claim.lua l06:delay:orders , <now>`. Note: `ZRANGEBYSCORE` deprecated since 6.2.
   - `06-practices#bigkey`: `EVAL` builds 1M-field `l06:big:h` in 10 × 100k chunks; `MEMORY USAGE … SAMPLES 0`; `SLOWLOG RESET`, `DEL`, rebuild as `l06:big:h2`, `UNLINK`, `SLOWLOG GET 2`, `lazyfreed_objects`. `--bigkeys` is a CLI flag, so it sits in `06-practices.sh#bigkeys`.
   - `07-architecture.sh#partition`: `SET l06:rep:price 100` → `docker network disconnect advance-be-l06 advance-be-redis-replica` → `SET … 120` → `WAIT 1 500` (0) → replica `GET` (100, `master_link_status:down`) → reconnect → `GET` (120), `sync_partial_ok`. Optional `failover`: `REPLICAOF NO ONE`, write on both, re-attach, write lost. Sentinel = diagram "sơ đồ, chưa đo trên máy này".
   - `07-cluster` (`#@ ct advance-be-redis-cluster`): `CLUSTER INFO`; `CLUSTER KEYSLOT` for `foo`, `l06:user_profile:{34}`, `l06:user_session:{34}`, `l06:a`, `l06:b`, `l06:{}x`, `l06:{a}{b}`; `SINTER l06:a l06:b` → CROSSSLOT; tagged pair works.
   - `08-lock` (lock `l06:lock:FA634:A34_S012C`, values `tokA`/`tokB`): `nolock` both GET nil, both RPUSH `BOOKED`; `nx`; `ttldel` (PX 2000, A sleeps 3 s, B acquires at 2.1 s, A `DEL`, then a third acquire succeeds); `cad` with `lock-release.lua`; `fencing` with `INCR l06:fence:A34_S012C` and `fenced-write.lua` (rejects lower token with `STALE`). Narrative links lesson 14 `UPDATE … WHERE version = $v` and lesson 02 compare-and-delete (link, not re-taught).
   - `09-bridge`: `token-bucket.lua` (KEYS `l06:tb:store:<id>`; ARGV capacity, refill/s; now from `redis.call('TIME')`; returns `{allowed, tokens, retry_after_ms}`), `bucket30` lives in `09-bridge.sh` as one `docker exec advance-be-redis sh -c 'for i in $(seq 30); do redis-cli --eval /lab/lua/token-bucket.lua l06:tb:store:7 , 10 0.01; done'`; `idempotency-begin.lua` (KEYS `l06:idem:<key>`, ARGV body hash + TTL → `NEW|IN_PROGRESS|DONE <resp>|MISMATCH`). `09-bucket` A/B: naive GET/compute/SET vs Lua.
3. Each stage file ends with `kiem-chung` (Lua `EVAL` returning `PASS/FAIL Cn` lines over that stage's keys).
4. `verify/record-all.sh` order:
   1. `up main`, `00-seed`, `check` → `check.after-seed`, `00-seed`, `check` → `check.rerun` (must be identical);
   2. stages 01→09 in order;
   3. each `--ab` pair 3× (record run 1, compare 2–3);
   4. `up evict`/`up persist`/`up replica`/`up cluster` just before their stage;
   5. `--lint`, `rerun-gate`, final `check`.
5. For each failing regex: fix the lab file if it is wrong. If Redis 7.2 really behaves otherwise, keep the run, set the row to `deviation`, write `deviations.md` (claim, observed, new chip/narrative). Never edit a run.

## Test matrix
| Test (from phase 02) | Expected | Command |
|---|---|---|
| seed idempotent | `check.after-seed` = `check.rerun` | `diff runs/check.after-seed.txt runs/check.rerun.txt` (header line excluded) |
| all invariants | all ✔, rc 0 | `bash labs/lesson-06-redis/check.sh` |
| matrix | GREEN or only logged deviations | `node verify/verify-guide.mjs --runs` |
| lab safety lint | GREEN | `node verify/verify-guide.mjs --lint` |
| lab negatives j, k, l, g, h, m | RED with their codes | `bash verify/negative-tests.sh --labs-only` |
| rerun gate | 0 regions worse on second run | `node verify/rerun-gate.mjs` |
| config restored | C11, C12 ✔ after stages 1, 3, 6 | `check.sh` rows C11/C12 |
| non-lab untouched | fingerprint equal | `bash verify/fingerprint.sh \| diff - runs/00-fingerprint-before.txt` |

## Verification
The matrix commands, plus `docker ps --filter name=advance-be-redis --format '{{.Names}} {{.Ports}}'` shows 6379 on main only.

## Risks and rollback
- The main recreate drops the controller's earlier scratch data (none, DBSIZE 0 on 2026-10-31).
- `docker network disconnect` targets only the replica.
- If a stage run is interrupted, `00-containers.sh reset main` plus `00-seed.redis` restores a known state.
- Rollback: `99-cleanup.sh` (or `--all`), then delete `labs/lesson-06-redis/` and `runs/`.

=== FILE: phase-04-widget-data-homework-driver.md ===
---
phase: 4
title: "Widget data, homework, driver claims"
status: pending
priority: P1
effort: 0.75h
dependencies: [3]
---

# Phase 04 — Widget data, homework, driver claims

## Goal
Produce every data file the fragments read, a homework with a runnable self-check, and a sourced claim list for the Node driver drill.

## Files to create/modify (owner: controller)
- Plan folder: `runs/data/w1.json` … `w9.json`, `runs/driver-claims.txt`, `verify/hw-bad-fixture.mjs`.
- `D:/study/advance-be/labs/lesson-06-redis/`: `package.json` (`"type":"module"`, `redis` `^6.3.0` like lesson 02, scripts `hw`, `hw:check`), `hw-check.sh`, `hw-solution.mjs`, `driver-drill.ai-snippet.ts`.

## Tasks and steps
1. Widget data. Each file has `sources: ["<run id>", …]`, and every number in it is a token in a source run.
   - `w1`: `01-block.sleep.timeline` points (A start/end, B send/reply).
   - `w2`: threshold table from `02-encodings.*`.
   - `w3`: `03-expiry.active` before/after stats.
   - `w4`: survivor counts per policy.
   - `w5`: DBSIZE before kill / after start per mode.
   - `w6`: `CLUSTER KEYSLOT` pairs.
   - `w7`: partition step values and offsets.
   - `w8`: the four `08-lock` timelines.
   - `w9`: `bucket30` rows.
2. Homework (slide 43, seat `A34_S012C`, flight `FA634`, no DB):
   - Contract: keys `l06:hw:lock:FA634:A34_S012C`, `l06:hw:booking:FA634:A34_S012C`, `l06:hw:log` (RPUSH `BOOKED <token>` / `REJECTED <token>`). Any language works. `HW_CMD` fires the two concurrent requests.
   - `hw-check.sh` resets `l06:hw:*`, runs `$HW_CMD` for `--rounds 10` (default `node hw-solution.mjs`), and prints:
     - H1: exactly 1 booking per round;
     - H2: log has 1 `BOOKED` and 1 `REJECTED` per round;
     - H3: no lock key left;
     - H4: the two tokens differ;
     - H5: the release path is compare-and-delete (round 11 runs with `HW_TTL_MS=50` and a slow holder; the second holder's lock must survive).
   - `hw-solution.mjs` (node-redis, about 50 lines, Vietnamese comments) uses `SET NX PX` + `randomUUID` + an `EVAL` release.
   - `verify/hw-bad-fixture.mjs` does GET-then-SET with a 50 ms gap and releases with `DEL`. It is expected to fail H1 and H2.
   - Record `runs/hw-check.solution.txt` and `runs/hw-check.bad.txt` (via `HW_CMD="node …/hw-bad-fixture.mjs"`). `npm install` runs in `labs/lesson-06-redis` only. `node_modules` is never read.
3. Driver drill: client = node-redis, because it is already in `labs/lesson-02-caching/package.json`, it is the official Redis client, and lesson-02 code used it.
   - `driver-drill.ai-snippet.ts` is a NestJS 10 `MenuCacheService` and `SeatLockService` (about 70 lines) with seeded mistakes:
     - `KEYS menu:*` in a request path;
     - `SET` without TTL;
     - lock released with `DEL`;
     - GET-then-SET counter instead of `INCR`/Lua;
     - `HGETALL` on a big cart hash;
     - N awaited `GET`s instead of `MGET`/pipeline;
     - no `client.on('error')` and an unbounded offline queue.
   - One correct decoy: `SET … NX` with expiry options.
   - `runs/driver-claims.txt`: for every API claim the drill makes (option names for SET, `multi()`/pipelining, `on('error')`, `disableOfflineQueue`, `eval`/`sendCommand`), record the URL (redis.io docs, `github.com/redis/node-redis` docs, or `unpkg.com/@redis/client@<version>/dist/...d.ts`), the version and the quoted line. Redis-behaviour claims point to stage run ids.

## Test matrix
| Test (first) | Expected | Command |
|---|---|---|
| widget data traced | GREEN | `node verify/verify-guide.mjs --data` |
| negative i (fake 999999 in w4) | RED | `bash verify/negative-tests.sh --data-only` |
| homework solution | 5/5 ✔ for 10 rounds | `cd labs/lesson-06-redis && npm run hw:check` |
| bad fixture | ✘ H1, H2 (H5 ✘) | `HW_CMD="node ../../plans/261031-1651-lesson-06-redis-teacher-guide/verify/hw-bad-fixture.mjs" bash hw-check.sh` |
| hw keys cleaned | `(integer) 0` after `hw-check --cleanup` | `redis-cli --scan --pattern 'l06:hw:*' \| wc -l` |
| driver claims | each claim has URL + version + quote | `grep -c '^https' runs/driver-claims.txt` ≥ claim count |

## Verification
The commands above plus `node --check labs/lesson-06-redis/hw-solution.mjs`.

## Risks and rollback
- If `redis@^6.3.0` resolves differently from lesson 02, pin the version lesson 02's lockfile names, read from `package-lock.json` metadata only.
- Rollback: delete the new files and `labs/lesson-06-redis/node_modules`.

=== FILE: phase-05-guide-shell-assembler.md ===
---
phase: 5
title: "Guide shell and assembler"
status: pending
priority: P1
effort: 1h
dependencies: [2]
---

# Phase 05 — Guide shell and assembler

## Goal
A shell that builds with stub stages and already passes the page-level checks, so fragments only add content.

## Files to create/modify (owner: controller, or delegate D0 if phase 03 is still running; disjoint from labs/runs)
Plan folder `assembly/`:
- `shell-head.html`, `shell-css.part`, `shell-tail.html` (copied from lesson 07, then edited)
- `assemble.mjs` (copied; it reads `labs/lesson-06-redis`, writes the lesson-06 guide, uses `lab-text.mjs` for `data-cmd`, 9 stages, `w1`–`w9`)

## Tasks and steps
1. Copy lesson-07 shell files, then:
   - retitle the page;
   - replace slide paths with `../../Tài Liệu/advanced_backend/assets/6_Redis/page_NN_img_01.png`;
   - change storage keys to `l06-*`;
   - add the CSS for `.story`, `.check30`, `table.stats`, `.lanes`, `.slotcalc`, `.bucket` using tokens only.
   Keep the no-rail single column, theme toggle, IIFE with try/catch storage, quiz renderer, `GUIDE_DATA_START/END`.
2. Hero ("Bài 06 · Redis — đo trên máy bạn") and `#cach-hoc`:
   - time table from the stage map;
   - prep: `bash labs/lesson-06-redis/00-containers.sh up main`, `check.sh`;
   - two-terminal setup (PowerShell / Windows Terminal, `winpty` note for Git Bash);
   - DBX `ADVANCE_BE_REDIS` as key browser;
   - "Nhắc nhanh Bài 02" (what was already taught: SET NX PX, compare-and-delete, jitter, singleflight; links to L02);
   - warm-up `data-store="l06-warmup"`.
3. Shell sections after the stages:
   - `#bai-tap` (homework contract, `npm run hw:check` instructions, H1–H5 meaning, answer in `details.fold`);
   - `#driver-drill` (snippet via `<!--@CMD driver-drill.ai-snippet.ts@-->`, find-7-mistakes inputs `l06-drill-*`, answer fold with claims linked to `driver-claims`);
   - `#phong-van` (EXAM of 10 interview questions);
   - `#cheat-sheet` (commands + Big-O + "khi nào dùng");
   - `#ban-do-slide` (generated from SLIDES);
   - `#tham-khao` (slide 44 links, plus redis.io pages for expire, eviction, persistence, cluster spec, distributed locks, and Kleppmann's Redlock critique);
   - `#tiep-theo` (OmniPOS M2 FR-M2-02/03/04/05 on hub port 6380 — text only, never run; Boss Challenge 2 on `quan-ly-hop-dong`; then K2 Bài 04 Rate Limiting).
4. `SLIDES` array of 46 entries `{n, title, stage, chip, href}` from contract §6.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| build with stubs | ✔ written | `node assembly/assemble.mjs --allow-stubs` |
| page checks on shell | V01–V04, V09, V10, V14, V15 GREEN | `node verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15` |
| negatives c, d, e, f on shell build | RED | `bash verify/negative-tests.sh --guide-only` |
| render smoke | 0 runtime errors | render-check (see phase 07) on the stub build |

## Verification
As above.

## Risks and rollback
Stale lesson-07 strings (`l07-`, `lab07`, "Data Modeling") are caught by V09 and a `grep -n 'l07\|lab07\|Data Model'` gate. Rollback: delete `assembly/`.

=== FILE: phase-06-stage-fragments.md ===
---
phase: 6
title: "Stage fragments (3 delegates)"
status: pending
priority: P1
effort: 1.75h
dependencies: [4, 5]
---

# Phase 06 — Stage fragments

## Goal
Nine verified stage fragments, quizzes and widgets written in parallel against the frozen contract.

## Files to create/modify (disjoint ownership)
`D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/`:
- D1: `fragments/stage-01..03.html`, `stage-01..03.quiz.json`, `widgets/w1.js`–`w4.js`
- D2: `fragments/stage-04..06.html`, `stage-04..06.quiz.json`, `widgets/w5.js`
- D3: `fragments/stage-07..09.html`, `stage-07..09.quiz.json`, `widgets/w6.js`–`w9.js`

Delegates read the contract, the plan matrix, runs and lab files. They may not edit labs, runs, the shell or `contract.md`. A needed contract change goes to the controller, who bumps the version.

## Fragment format (frozen)
- `<section id="chang-N" class="stage col">`: `stage-head` (`0N`, slides · minutes · core/tùy chọn), `p.goal`, `dl.wwh` (LÀ GÌ / TẠI SAO / KHI NÀO KHÔNG).
- Order inside the stage:
  1. `.story` callout (an F&B/OmniPOS situation);
  2. a diagram (`figure.slide-fig` for slides with images — pages 4–9, 12, 16, 18, 19, 25–27, 35, 39, 40, 43 — and/or an inline SVG using token colours);
  3. `table.stats` "Đo trên máy bạn ngày …" with `b.m[data-run]` cells;
  4. `.check30` (one question, answer in `details`).
- Per slide: a `.sayvs` callout ("Slide nói / Redis 7.2.3 đo được") with the chip. PART/FIX slides carry `id="sl-NN"`.
- Code: `<pre data-cmd="<file>#<region>"><code>` (filled by the assembler). Output: `div.run-label` + `pre[data-run]` (`…` excerpts allowed).
- Two-client steps: `table.walk` (# / Terminal A / Terminal B / Ghi lại, `data-store="l06-cN-…"`), then the recorded timeline.
- `callout teacher` "Làm mẫu", then `div.callout.challenge#chang-N-tu-lam` (task, PASS criteria, self-check command, answer in `details.fold`), then `.quiz[data-quiz=N]`.
- Quiz: 4 × `{q, opts[4], ans, why}`; every `why` cites a run id.
- Widgets: IIFE helpers only, read `run('wN')`, guard null, no globals, controls ≥ 44 px, ids prefixed `wN-`.

## Per-stage content (challenge in italics)
1. Story: the store's POS freezes when one admin runs `KEYS *`. W1 lanes replay A's `DEBUG SLEEP` and B's waiting PING. A toggle shows the recorded 0.5 s SLOWLOG case. The stats table covers req/s for `-P 1/16`, sizes, and MGET vs GET. *Run `DEBUG POPULATE 200000 l06:my:pop` (allowed on main through docker exec), then time `KEYS l06:my:*` vs `SCAN` in A while B PINGs. PASS: B's wait ≈ the KEYS time, and SLOWLOG lists KEYS.*
2. Story: a user object for the loyalty app. W2 takes field count and value length, predicts the encoding with 7.2 thresholds, and shows the recorded `OBJECT ENCODING`/bytes row with ✔ when they match. Slide 30's answer is a C1/C2/C3 table plus the lost-update timeline. *Model a menu item three ways, predict encodings first. PASS: predictions = `OBJECT ENCODING`.*
3. Story: a voucher key that nobody reads again. W3 simulates 20-key sampling. A toggle picks "slide: 25%" or "7.2: 10% stale, time cap 25% CPU", next to the recorded before/after. W4 is a policy picker with recorded survivor bars and the OOM line. *Set `volatile-lru` on `-evict`, predict the survivors, run, restore. PASS: TTL-less keys 100% survive.*
4. Story: the hub restarts after a power cut. W5 is a timeline with snapshot/fsync marks; "kill -9 ở đây" shows the recorded loss per mode. *Choose persistence for idempotency keys, buckets and the best-seller ZSET (rebuildable from SQL, I-09). PASS: written choice with a recorded number for each.*
5. Story: kitchen order queue and the best-sellers board (FR-M2-04). The counter race comes first, then BRPOP two terminals, reliable BLMOVE, cart, likes and leaderboard. Streams is a short optional contrast. *Build `l06:my:kitchen` with BLMOVE + ack; "crash" the consumer before the ack. PASS: the item is still in the processing list.*
6. Story: auto-cancel an unpaid order after 10 min (slide 37). SVG of the ZSET timeline; naive vs Lua pollers; big key DEL vs UNLINK table. *Two pollers over 20 jobs with `delay-claim.lua`. PASS: each job id in `l06:my:done` exactly once.*
7. Story: reads go to the replica during a network cut. W7 replays partition steps and offsets. Sentinel is a diagram with an honest label. W6 is a CRC16-XMODEM slot calculator (JS) with hashtag rules, checked ✔ against recorded `CLUSTER KEYSLOT` values. *Pick hashtags so `cart` and `cart-lock` for user 34 share a slot; run a 2-key `EVAL` on the cluster container. PASS: equal slots, no CROSSSLOT.*
8. Capstone story: two cashiers book seat A34_S012C. W8 shows five tabs (nolock, nx, ttl+DEL, compare-and-delete, fencing) with TTL bars from the recorded timelines. There is a lesson-14 bridge (version/conditional UPDATE) and an honest Redlock paragraph. *Add `lock-renew.lua` (PEXPIRE only if owner). PASS: returns 0 for non-owner, 1 for owner, recorded in your terminal.*
9. Story: one store spams voucher claims (FR-M2-05). W9 is a token-bucket simulator (capacity/refill sliders) next to the recorded 30-call result. Then idempotency states (FR-M2-02, Boss Challenge 2 `executeImportExport`/`terminateContract`), the slide-41 best-practice checklist (each linked to its measuring stage), and a cache-aside link to L02. *Run the bucket for `store:7` with capacity 10. PASS: exactly 20 denied with `retry_after_ms`.*

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment checks | exit 0 per fragment | `node verify/verify-guide.mjs --fragment assembly/fragments/stage-0N.html` |
| quiz shape | 4 items, `ans` 0–3, `why` cites a run | included in `--fragment` |
| widget syntax | no error | `node --check assembly/widgets/wN.js` |
| CRC16 widget vs runs | all recorded pairs ✔ | `node verify/widget-smoke.mjs w6` |

## Verification
The controller re-runs every `--fragment` and `node --check` before accepting a delegate's DONE.

## Risks and rollback
Delegates inventing numbers is caught by V07. Rewording code is caught by V05, since the assembler overwrites `pre[data-cmd]` anyway. Rollback: delete that delegate's files.

=== FILE: phase-07-assemble-verify-render.md ===
---
phase: 7
title: "Assemble, verify, render-check"
status: pending
priority: P1
effort: 0.75h
dependencies: [6]
---

# Phase 07 — Assemble, verify, render-check

## Goal
One built guide passing all checks, with negative tests proving the checks bite.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html` (generated)
- Plan folder: `verify/widget-smoke.mjs` (copied and adapted), `verify/render/`, `verify/render-dark/`, `runs/verify-full.txt`

## Tasks and steps
1. `node assembly/assemble.mjs` (no stubs).
2. `node verify/verify-guide.mjs` (V01–V16), `--runs`, `--data`, `--lint` → write `runs/verify-full.txt`.
3. `bash verify/negative-tests.sh` (all cases a–m).
4. `node verify/widget-smoke.mjs` runs each widget in `vm` against the embedded JSON with no throw.
5. Render-check, light and dark, with `TMP`/`TEMP` set to `verify/tmp`:
   `node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs reports/advanced_backend/lesson_06_redis_teacher_guide.html --out plans/261031-1651-lesson-06-redis-teacher-guide/verify/render`. Dark uses a copy with `data-theme="dark"`.
6. Fix fragments/shell (never runs) and repeat until clean.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| full verifier | 0 fails | `node verify/verify-guide.mjs` |
| runs/data/lint | GREEN | `--runs`, `--data`, `--lint` |
| negatives | 13/13 RED as designed | `bash verify/negative-tests.sh` |
| size | ≤ 340 KB | V01 |
| render 375/768/1440 light+dark | 0 errors, 0 overflow, 0 targets < 44 px | render-check |
| slide images | all exist | V10 |

## Verification
As above; screenshots inspected for horizontal scroll at 375 px.

## Risks and rollback
Wide terminal outputs overflow at 375 px. Mitigation: `pre` scrolls inside its box (`overflow-x:auto`), and tables use the existing `.tablewrap`. Rollback: regenerate from fragments.

=== FILE: phase-08-ultra-review-fixes.md ===
---
phase: 8
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1h
dependencies: [7]
---

# Phase 08 — `/ak:code-review --ultra`

## Goal
Independent review of the guide, labs and verifier; fix every verified Critical/Important finding.

## Files to create/modify
- Plan folder `reports/`: `code-review-ultra-reviewer-1..5.md` (one per reviewer), `code-review-ultra-verdict.md` (verifier), `code-review-ultra-fix-status.md` (controller).
- Fix targets: any phase 03–07 file (controller only).

## Tasks and steps
1. Run `/ak:code-review --ultra` with scope: the guide HTML, `labs/lesson-06-redis/**`, `verify/**`, `assembly/**`, `runs/` (read-only), `expected.tsv`, `deviations.md`.
   Brief the five reviewers on:
   - Redis 7.2 correctness per slide;
   - safety (containers, 6380, config restore, key prefixes);
   - trace integrity;
   - teaching format and Vietnamese clarity;
   - mobile/a11y.
   The verifier unions the verified findings.
2. Fix Critical/Important findings. A fix that changes a lab region requires re-running that region via `run-redis.mjs`, which updates the manifest. Never hand-edit runs.
3. Re-run the affected checks (and all of phase 07's if a lab or the shell changed).

## Test matrix
| Test | Expected | Command |
|---|---|---|
| open findings | 0 Critical/Important in fix-status | `grep -c 'OPEN' reports/code-review-ultra-fix-status.md` → 0 |
| regression | phase 07 matrix GREEN | phase 07 commands |
| check after fixes | all ✔ | `bash labs/lesson-06-redis/check.sh` |

## Verification
As above.

## Risks and rollback
A review may question a verified measurement. Keep it unless the review brings new evidence, and record the source in fix-status. Rollback per fix: re-run the region and reassemble.

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
Make the guide discoverable, prove nothing outside scope changed, and leave a resume note.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/README.md`:
  - line 14 lab list: add `labs/lesson-06-redis/` (redis-cli);
  - tree: add `lesson_06_redis_teacher_guide.html` and `lesson-06-redis/`.
- `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 06. Original labs cell: `` `labs/lesson-02-caching/06-*.mjs` ``. New cell: `` `labs/lesson-06-redis/` (redis-cli)<br>`reports/advanced_backend/lesson_06_redis_teacher_guide.html` `` (keep the L02 path too).
- `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` line 3335: wrap "Bài 06 Redis" in `<a href="lesson_06_redis_teacher_guide.html">…</a>`. This is a one-line change; skip it if the line differs.
- `D:/study/advance-be/plans/handoffs/lesson-06-redis-guide-ready-20261101.md`
- Plan folder: `runs/00-fingerprint-after.txt`, `runs/final-gate.txt`.

## Tasks and steps
1. Make the three doc edits; read each file first.
2. Run `bash verify/fingerprint.sh > runs/00-fingerprint-after.txt` and `diff` it with `-before` (must be empty).
3. Final gate table in `runs/final-gate.txt`. Rows:
   - verifier, `--runs`, `--data`, `--lint`;
   - negatives;
   - render light/dark;
   - `check.sh`;
   - fingerprint;
   - lesson-07 verifier regression (`node plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs --only V01,V02,V03,V10`);
   - `git status --short` paths ⊆ {the guide, `labs/lesson-06-redis/`, this plan folder, README, TONG_QUAN, lesson-07 guide, handoff}.
4. Leave containers as they are for the learner: main up, extras down via `99-cleanup.sh` (he brings them up per stage). Record `docker ps --filter name=advance-be-redis`.
5. Handoff note covers:
   - what exists;
   - how to start (`00-containers.sh up main`);
   - stage times;
   - deviations;
   - the run date;
   - the next step (Cluster 2 → K2 Bài 04, OmniPOS M2, Boss Challenge 2).
   No commit, branch or push.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fingerprint | empty diff | `diff runs/00-fingerprint-before.txt runs/00-fingerprint-after.txt` |
| docs links resolve | files exist | `ls` each linked path |
| lesson-07 not broken | GREEN on listed codes | lesson-07 verifier command above |
| scope of changes | only expected paths | `git status --short` |

## Verification
`cat runs/final-gate.txt` shows every row ✔.

## Risks and rollback
Doc edits are one-liners with their original text quoted above. Revert by restoring that text. No git operation is used.
