=== FILE: plan.md ===
---
title: "Lesson 06 Redis teacher guide (redis-cli-first, Redis 7.2.3-measured)"
description: "Single-file Vietnamese teacher guide for K1 Lesson 06 Redis (46 slides + 8 evidence blocks) backed by small redis-cli snippets recorded on advance-be-redis* lab containers."
status: pending
priority: P1
effort: 11h
branch: main
tags: [lesson-06, redis, teacher-guide, redis-7.2, lua, distributed-lock, tdd]
blockedBy: []
blocks: []
created: 2026-10-31
---

# Lesson 06 — Redis teacher guide

## Overview

Build `reports/advanced_backend/lesson_06_redis_teacher_guide.html` on the lesson-07 single-column shell with no rail, so that Đạt can study it around 2026-11-02 in about 4h45 of core time. Every experiment is a short region in a `.redis` file (redis-cli commands) or a `.sh` file (plain `docker …` lines) under `labs/lesson-06-redis/`. Đạt pastes each region into `docker exec -it advance-be-redis redis-cli`, or uses the method the phase-03 smoke test picks. The controller runs the same regions through the same runner (`labs/lesson-06-redis/run.sh`) and records the output verbatim in `runs/`; `verify/verify-guide.mjs` then proves that every guide command and number traces to a run. All 46 slides map to exactly one stage and carry a verdict chip. Redis writes only touch containers named `advance-be-redis*`, there are no Postgres writes, and the only git command is `git status`.

## Data flow

1. `setup.sh` creates the lab containers and network, and `00-seed.redis` writes the `l06:seed:*` keys.
2. `run.sh` strips `#` comment lines, injects an `ECHO "@@n"` before each command and pipes the region into one `redis-cli --no-raw` session. It then rewrites the markers into `redis> <command>` lines and writes `runs/<stem>.<region>.txt`. `--ab` writes `.A`, `.B` and a `.timeline` file sorted by server `TIME`.
3. `make-widget-data.cjs` writes `runs/data/wN.json`. It copies only numbers that appear in runs and lists their `sources`.
4. Delegates write `assembly/fragments/*` against the frozen `contract.md`. `assemble.mjs` builds the guide and re-copies every `pre[data-cmd]` from the lab region.
5. The guide goes through `verify-guide.mjs`, `negative-tests.sh`, render-check and the ultra review.

## Stage map (study day about 2026-11-02, after Cluster 1 Phase B)

| Stage | Slides | Topic | Core min | Optional | Lab files | Widget |
|---|---|---|---|---|---|---|
| 0 `#cach-hoc` | 1, 2 | plan, containers, run method, warm-up paste test | 10 | – | setup.sh, check.sh | – |
| 1 | 3, 4, 5, 10, 11, 12, 13, 14 | What Redis is; why it is fast, measured: `DEBUG SLEEP` in A blocks `PING` in B, thread list, `io_threads_active:0`, pipelining, MGET, `commandstats`, SLOWLOG | 30 | 5 (Lua busy → `BUSY`) | 01-why-fast.redis/.sh, 01-block.A/B.redis | W1 event-loop timeline + pipeline bars |
| 2 | 15, 16, 29, 30, 31 | dictionary, encodings, `MEMORY USAGE`, slide 30 Hash vs JSON C1/C2/C3, lost update (A/B) | 30 | 10 (WATCH fix) | 02-encodings.redis, 02-lost-update.A/B.redis | W2 encoding converter |
| 3 | 17–21 | two dictionaries (`DEBUG HTSTATS`), passive vs active expiry, 7.2 algorithm vs slide "25 %" and "ZSET" | 20 | – | 03-expiry.redis/.sh | W3 sampling simulator + measured curve |
| 4 | 22, 23 | maxmemory, noeviction OOM, allkeys-lru / volatile-ttl survivors, link to L02 TTL jitter | 20 | 5 (allkeys-lfu) | 04-eviction.redis | W4 eviction board |
| 5 | 24–27 | SAVE vs BGSAVE fork, AOF everysec/always, hybrid preamble, SIGKILL restart loss per mode | 25 | 10 (`always` benchmark) | 05-persistence.redis/.sh | W5 data-loss window |
| 6 | 28, 32–38 | INCR, List queue BRPOP (A/B), Hash cart, Set, ZSET leaderboard, delay task + atomic claim (A/B), big key DEL vs UNLINK | 40 | 5 (SINTER on 1M sets) | 06-structures.redis, 06-queue.A/B, 06-delay.A/B, 06-bigkey.sh | tables only |
| 7 | 6, 7, 8, 9, 39 | replica async lag + stale read, `WAIT`, manual promotion (Sentinel as a diagram), 16384 slots, hashtag, CROSSSLOT | 30 | 10 (manual failover) | 07-replica.sh/.redis, 07-cluster.redis | W6 hash-slot calculator |
| 8 | 40 | lock capstone: plain DEL steals a lock (A/B), compare-and-delete, expiry during work, fencing token, Redlock paragraph | 40 | – | 08-lock.redis, 08-lock.A/B.redis | W7 lock + fencing timeline |
| 9 | 41, 42 | OmniPOS M2 bridge: idempotency key, Lua token bucket (A/B non-atomic vs Lua), best-seller ZSET, best-practice recap | 25 | – | 09-m2.redis, 09-bucket.A/B.redis | W8 token-bucket simulator |
| Wrap | 43–46 | homework seat lock (evening), driver drill, interview, cheat sheet, slide map, references, next step | 15 | 75 (homework 45, drill 30) | hw-check.sh, driver-drill/menu-cache.ai.ts | – |
| **Total** | 46 | | **285** | **120** | | |

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract and baseline](phase-01-contract-and-baseline.md) | 0.75h | – | contract v1 frozen; fingerprint and config baseline recorded |
| 02 | [Tests first](phase-02-tests-first.md) | 1.5h | 01 | `check.sh` prints ✘ rows (no crash); `--runs` RED for all 33 rows; `--selftest` GREEN |
| 03 | [Containers, runner, seed, smoke](phase-03-containers-runner-smoke.md) | 1h | 02 | `check.sh` all ✔; seed run twice gives identical check output; run method recorded |
| 04 | [Experiments and recorded runs](phase-04-experiments-recorded-runs.md) | 3h | 03 | `--runs` GREEN or each deviation logged; check ✔ after every stage; fingerprint unchanged |
| 05 | [Widget data, slot check, driver claims](phase-05-widget-data-driver-claims.md) | 0.75h | 04 | `--data` and V13 GREEN; every driver claim has a published source |
| 06 | [Shell and assembler](phase-06-shell-assembler.md) | 1h | 01, 05 | stub build passes V01–V04, V09, V10, V14, V15 |
| 07 | [Stage fragments (3 delegates)](phase-07-stage-fragments.md) | 1.5h | 01, 05 (parallel with 06) | `--fragment` GREEN per stage; widget smoke GREEN |
| 08 | [Assemble, verify, render](phase-08-assemble-verify-render.md) | 0.75h | 06, 07 | full verify GREEN; 10/10 negative tests RED as designed; render clean in light and dark |
| 09 | [Ultra review and fixes](phase-09-ultra-review-fixes.md) | 1h | 08 | 0 open Critical/Important findings; affected checks re-run |
| 10 | [Docs, final gate, handoff](phase-10-docs-final-gate-handoff.md) | 0.5h | 09 | final gate all pass; handoff written |

## Expected-result matrix (frozen in `verify/expected.tsv` in phase 02, before any run)

Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`. "n" means the run decides the value; the regex asserts only its shape or relation.

| ID | Run#region | Slide | Expected Redis 7.2.3 result | Chip |
|---|---|---|---|---|
| R01 | 01-block.sleep.timeline | 13 | A runs `DEBUG SLEEP 1`; B's `PING`, sent 0.2 s later, returns only after A ends (wait ≥ 700 ms by server TIME) | PART |
| R02 | 01-why-fast.threads | 14 | `io-threads 1`, `io_threads_active:0`; threads `redis-server`, `bio_close_file`, `bio_aof`, `bio_lazy_free`, `jemalloc_bg_thd` (BGSAVE is a forked process, not a thread) | PART |
| R03 | 01-why-fast.bench | 12, 41 | GET req/s with `-P 16` ≥ 5× without (packet: about 12×); MGET of 10 keys ≈ GET req/s | 12 PART, 41 OK |
| R04 | 01-why-fast.cmdstats | 12 | `cmdstat_get usec_per_call` < 5 µs vs benchmark p50 ≥ 100 µs: the round trip dominates, not CPU | PART |
| R05 | 02-encodings.thresholds | 16, 31, 33, 34, 35 | `int`; `embstr` at 44 bytes → `raw` at 45; hash 512 fields `listpack` → 513 `hashtable`; value 65 bytes → `hashtable`; set `intset` → `listpack` (≤128) → `hashtable`; zset 129 → `skiplist`; small list `listpack` | 16, 31 OK; 33–35 PART |
| R06 | 02-encodings.user | 30 | 4-field Hash `listpack` and JSON String `raw`, n bytes each (packet: 104/104); `HGET` returns one field; `HINCRBY` is atomic | OK |
| R07 | 02-lost-update.race.timeline | 30 | A and B both GET-modify-SET the JSON; the final age shows one update lost | OK |
| R08 | 02-lost-update.watch.timeline | 30 | with `WATCH` + `MULTI/EXEC`, the late `EXEC` returns `(nil)` | OK |
| R09 | 03-expiry.htstats | 18, 21 | `DEBUG HTSTATS 0` shows a main table and a separate expires hash table; `INFO keyspace` `expires=n` | 18 OK, 21 FIX |
| R10 | 03-expiry.passive | 19 | with `DEBUG SET-ACTIVE-EXPIRE 0`, `DBSIZE` is unchanged after the TTL; `GET` → `(nil)` and `expired_keys` +1; deletion is synchronous because `lazyfree-lazy-expire no`; then restored to 1 | PART |
| R11 | 03-expiry.active-curve | 20 | 10,000 keys `PX 500`, never read: `expires` falls to 0 within seconds (polled every 200 ms); `hz 10` | FIX |
| R12 | source note `verify/sources/expire-7.2.3.md` | 20, 21 | tagged `expire.c`: 20 keys per loop at effort 1, repeat while stale > 10 % (not 25 %), CPU time budget; the expire index is a dict, not a ZSET | FIX |
| R13 | 04-eviction.noeviction | 23 | default `noeviction`; filling gives `(error) OOM command not allowed when used memory > 'maxmemory'.` | PART |
| R14 | 04-eviction.lru, .ttl, .lfu | 23 | allkeys-lru: hot keys survive more than cold ones; volatile-ttl: short-TTL keys go first and no-TTL keys all survive; allkeys-lfu: frequently read keys survive; `evicted_keys` > 0 | PART |
| R15 | 05-persistence.rdb-save | 26 | `SAVE` of 1M keys appears in SLOWLOG (n µs); `BGSAVE` → `Background saving started`; `latest_fork_usec` n | OK |
| R16 | 05-persistence.crash-rdb | 26 | with `--save ""`: BGSAVE, then 1,000 more writes, SIGKILL, start → those 1,000 are lost | OK |
| R17 | 05-persistence.crash-aof | 25 | `everysec`: SIGKILL loses at most about 1 s of writes (n); `always`: 0 lost | PART |
| R18 | 05-persistence.graceful | 26 | `docker restart` (SIGTERM) with save points: 0 lost (shutdown save) | OK |
| R19 | 05-persistence.hybrid | 27 | `aof-use-rdb-preamble yes` + `BGREWRITEAOF`: `appendonlydir` holds `*.base.rdb` (magic `REDIS`), `*.incr.aof` and a manifest | PART |
| R20 | 06-queue.brpop.timeline | 32 | with two blocked BRPOP consumers, one LPUSH wakes exactly one; a popped-then-crashed message is gone; `LMOVE` keeps a copy | PART |
| R21 | 06-structures.cart, .set, .zset | 33–35 | the slide-33 cart commands return the slide's results; `SINTER` gives common followers; `ZREVRANGE … WITHSCORES` gives top-N | per R05 |
| R22 | 06-delay.claim.timeline | 37 | both pollers see the same due job; `ZREM` returns 1 to only one of them; the Lua claim returns the job to one and `(nil)` to the other | OK |
| R23 | 06-bigkey.del-unlink | 38 | 1M-member Set: `MEMORY USAGE` n MB; `DEL` takes n ms in SLOWLOG; `UNLINK` of a copy < 1 ms; DEL < 1 ms with `lazyfree-lazy-user-del yes`; `lazyfreed_objects` +n | OK |
| R24 | 07-replica.lag | 6 | `WAIT 1 100` → 1; with the replica's network cut, master `SET` returns OK, `WAIT 1 1000` → 0 and the replica's `GET` returns the old value; after reconnect it returns the new value | OK |
| R25 | 07-replica.promote | 7 | `REPLICAOF NO ONE` makes the replica a writable master; re-attaching discards its writes | OK |
| R26 | 07-cluster.slots | 8, 9 | `cluster_slots_assigned:16384`; main `CLUSTER KEYSLOT` → `ERR This instance has cluster support disabled` | 8 PART, 9 OK |
| R27 | 07-cluster.hashtag | 39 | `User_profile:{34}` and `User_session:{34}` share a slot; SINTER on the same tag works; different slots → `CROSSSLOT Keys in request don't hash to the same slot` | OK |
| R28 | 08-lock.steal.timeline | 40 | A takes the lock with PX 2000 and pauses; B acquires; A's `DEL` removes B's lock; C acquires → two holders | FIX |
| R29 | 08-lock.cad.timeline | 40 | same timing with compare-and-delete: A gets 0, and B's lock stays | FIX |
| R30 | 08-lock.fencing | 40 | the token comes from `INCR`; a write with token 33 after 34 is rejected by the Lua storage check | FIX |
| R31 | 09-m2.idempotency | 41 | first call → `NEW`; same key and body → stored response; same key with another body hash → `CONFLICT` | OK |
| R32 | 09-bucket.race.timeline, 09-m2.bucket-lua | 41, 42 | the non-atomic GET/SET bucket lets both clients through on 1 token; the Lua bucket (capacity 5) gives 7 fast calls → 5 allowed, 2 denied with retry_ms > 0 | OK |
| R33 | hw-check.solution, hw-check.bad | 43 | reference Lua: H1–H5 all ✔; the bad fixture (plain DEL) fails on H3 | OK |

Slides with chip `null`: 1, 2, 3, 10, 11, 15, 17, 22, 24, 28, 29, 36, 44, 45, 46. Chips without a run:
- Slide 4 (definition) is OK.
- Slide 5 (Memcached comparison) is PART and labelled "theo tài liệu, chưa đo", because no Memcached image is pulled.
- Slide 7 (Sentinel) is OK on the strength of R25, with the honest label "Sentinel chỉ vẽ sơ đồ, thăng cấp làm bằng tay".

## Acceptance criteria

1. The guide is ≤ 380 KB, has no external script, loads only fonts from outside, and every image path exists (P08: V01, V10).
2. `SLIDES` covers 1–46 exactly once, its hrefs resolve, and its chips equal `expected.tsv` (P08: V04).
3. Each stage 1–9 has a story, a diagram, a measured stats table, a 30-second check, `dl.wwh`, an exact `pre[data-cmd]`, a recorded run, "Làm mẫu", a `callout challenge` with PASS criteria and 4 quiz items (P07: V05, V12).
4. Every `b.m`, `pre[data-run]` and widget value traces to a dated `runs/` file, and timings are labelled "phụ thuộc máy" (P04–P05: V06–V08, V11).
5. Every matrix row matches, or has a `deviations.md` entry and a changed narrative or chip; data is never edited (P04).
6. `check.sh` is all ✔ after setup and after every stage. That covers the config baseline, no key outside `l06:`, and nothing published on 6380 (P03, P04, P10).
7. Re-running `00-seed.redis` gives byte-identical `check.sh` output (P03).
8. The fingerprint of every non-`advance-be-redis*` container (including `quan-ly-hop-dong-postgres-1`) is identical before and after (P01, P10).
9. Storage keys are `l06-*` only, there is no rail, and dark and light both work (P08: V09).
10. render-check at 375/768/1440, in light and dark, shows 0 runtime errors, 0 horizontal overflow and 0 targets under 44 px (P08).
11. Ten negative tests fail as designed (P08).
12. No Critical or Important finding stays open (P09).
13. README and TONG_QUAN row 06 link the guide and labs, and the handoff exists (P10).
14. There is no branch, commit, push, PR or issue, and `git status` lists only the phase-10 paths (P10).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| redis-cli rejects `#` lines (`ERR unknown command '#'`, checked 2026-10-31) | H×M | The guide shows commands only, `run.sh` strips comments, and V05 compares the stripped region. |
| An AOF crash test on a container started with `--appendonly no` silently restarts from RDB only | H×H | Crash tests run only on a throwaway `advance-be-redis-persist` container started with each mode's flags. |
| DBX's Redis console is single-command or rejects DEBUG (it is not a local client) | M×M | The phase-03 smoke test decides. The fallback is `docker exec -it … redis-cli`, and DEBUG regions are labelled "chạy trong redis-cli". |
| Two-client timing flakes | M×M | Sleeps leave ≥ 300 ms margin, each run is repeated 3× with try 1 kept, and any variance is logged. |
| After a network cut, the replica link reads "up" until `repl-timeout` | M×L | The claim is the stale GET; narrate whatever link status the run shows. |
| A plan detail on expiry constants is wrong | M×M | Phase 02 reads the tagged source before freezing R12. |
| A config change leaks (maxmemory, lazyfree, slowlog, active expire) | M×H | Each region restores what it changed, and `check.sh` C03 runs after every stage. |
| A measurement contradicts a slide or the matrix | M×M | Keep the data, change the chip and narrative, and log it in `deviations.md`. |

Rollback:
- `99-cleanup.sh` UNLINKs `l06:*` and restores the config baseline. It also removes the replica, cluster and persist containers and the persist volume; `--all` also removes the network.
- `setup.sh` recreates the main container exactly as phase 03 did.
- All files are new, so deleting them reverts them. Phase 10 quotes the original text of each doc edit.

## Open questions for the user

None of these block the plan. Two confirmations:
1. Phase 03 recreates `advance-be-redis` with the same image, port 6379 and `--appendonly no`, adding a named volume and `--enable-debug-command local`. The DBX connection `ADVANCE_BE_REDIS` keeps working.
2. The 285 core minutes sit near the top of the 4–5 h budget. If Đạt prefers 4 h, the cluster half of stage 7 and stage 9 can move to the evening without dropping content.

=== FILE: phase-01-contract-and-baseline.md ===
---
phase: 1
title: "Contract and baseline"
status: pending
priority: P1
effort: 0.75h
dependencies: []
---

## Goal
Freeze the names that parallel work depends on, and record the safety and config baselines before anything changes.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/contract.md` (new, v1)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/verify/fingerprint.sh` (new)
- `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/runs/00-fingerprint-before.txt`, `runs/00-config-baseline.txt`

## Tasks and steps
1. Adapt lesson 07's `assembly/contract.md` into a new contract with these sections:
   - **§1 Key registry.** Keys are `l06:s1:*` … `l06:s9:*`, `l06:seed:*`, `l06:hw:*` and `l06:my:*`. Seed and stage files never delete `hw`/`my`. Slide-literal names such as `User_profile:{34}` appear only in `CLUSTER KEYSLOT`, which writes nothing.
   - **§2 Lab file format.**
     - Regions are marked `# #region <id> · <tiêu đề> (slide N)` … `# #endregion`, and comments are `# ` lines.
     - Three directives: `#@sleep <s>` (a real wait inside one session), `#@step <A1> <mô tả>` (a timeline marker), and `#@target main|replica|cluster|persist`.
     - An expected error is the last command of its region, and any config change is restored inside the region.
     - Each stage file ends with a `kiem-chung` region that prints `ma ✔|✘ chi_tiet` via `EVAL`.
     - `.sh` regions contain only `docker …` lines that run unchanged in PowerShell and Git Bash.
   - **§3 Run ids.** The lesson-07 run-file and timeline rules carry over. The guide attributes are `data-cmd` and `data-run`, and widget data ids are `run-w1` … `run-w8`.
   - **§4 Fragment format and CSS.** Lesson-07 classes plus `.story`, `.check30`, `table.stats`, `.lane`, `.slotcalc`, `.bucket` and `.ttlbar`. Element ids use the prefixes `c<N>-` and `w<N>-`.
   - **§5 Learner workflow.** Placeholder; phase 03 fills it.
   - **§6 Slide table.** Slide → stage → chip → anchor for all 46 slides, from the plan matrix. FIX and PART slides carry `id="sl-NN"`.
   - **§7 Widget helpers.** `$`, `$$`, `esc`, `run`, `press`, `store`.
2. `fingerprint.sh` prints, sorted:
   - for every container whose name does not match `^advance-be-redis`: `docker inspect --format '{{.Name}}|{{.Config.Image}}|{{.State.Status}}|{{.State.StartedAt}}'`;
   - the names from `docker ps -a --filter publish=6380`;
   - the volumes that do not start with `advance-be-redis`.
3. Record the fingerprint. Then record `CONFIG GET` on the current main container for: maxmemory, maxmemory-policy, maxmemory-samples, save, appendonly, appendfsync, aof-use-rdb-preamble, lazyfree-*, slowlog-log-slower-than, slowlog-max-len, latency-monitor-threshold, hz, io-threads, active-expire-effort, `*-max-listpack-*` and `*-max-intset-*`. Every step is a read.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| fingerprint is stable and read-only | two runs are identical | `bash verify/fingerprint.sh > a; bash verify/fingerprint.sh > b; diff a b` |
| port 6380 unused | the publish=6380 section is empty | inspect fingerprint output |
| slide table complete | 46 rows | `grep -cE '^\| [0-9]+ \|' assembly/contract.md` |

## Verification
`bash verify/fingerprint.sh | diff - runs/00-fingerprint-before.txt` shows no diff.

## Risks and rollback
If Docker Desktop restarts, `StartedAt` changes. Re-record the fingerprint, note the reason, and never edit it by hand. Rollback: delete the new files.

=== FILE: phase-02-tests-first.md ===
---
phase: 2
title: "Tests first: check, expected matrix, guide verifier"
status: pending
priority: P1
effort: 1.5h
dependencies: [1]
---

## Goal
Write every checker before the labs, runs and HTML it checks, and prove each one fails for the right reason.

## Files to create/modify (owner: controller; plan folder abbreviated `P/` = `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/`)
- `D:/study/advance-be/labs/lesson-06-redis/check.sh` (new)
- `P/verify/expected.tsv` (new; columns `id run slides regex rel claim chip status`, rows R01–R33)
- `P/verify/regions.mjs` (new): region extraction with comment stripping, shared by the assembler and the verifier
- `P/verify/verify-guide.mjs`, `P/verify/negative-tests.sh`, `P/verify/widget-smoke.mjs` (copied from lesson 07, then adapted)
- `P/verify/sources/expire-7.2.3.md` (new): quoted source lines with URLs

## Tasks and steps
1. Fetch the raw `src/expire.c` and `src/server.h` for tag 7.2.3 from GitHub and quote the keys-per-loop, acceptable-stale and time-limit constants with their line numbers. Do the same for `LAZYFREE_THRESHOLD` in `src/lazyfree.c`, which backs the R23 note that small values are freed synchronously. Freeze R12 from these quotes.
2. Write `expected.tsv` from the matrix:
   - Each `regex` asserts a shape, for example `OOM command not allowed`, `CROSSSLOT`, `io_threads_active:0`, a second claim returning `\(nil\)`, or encodings listed in order.
   - The `rel` column holds relations over named captures (`p16 >= 5*p1`, `wait_ms >= 700`, `unlink_us < 1000`). `--runs` evaluates them.
3. `check.sh` prints `ma | ✔/✘ | chi_tiet` and always exits 0. Its rows:

   | Row | Checks |
   |---|---|
   | C01 | main container running on 6379 |
   | C02 | Redis is 7.2.3 |
   | C03 | every baseline `CONFIG GET` matches (the baseline is re-recorded once in phase 03 after `enable-debug-command local`) |
   | C04 | active expiry is on: 50 keys `PX 100`, wait 1.5 s, `DBSIZE` delta 0 |
   | C05 | no key outside `l06:` (`--scan`) |
   | C06 | `l06:seed:user:1` is a 4-field `listpack` hash |
   | C07 | the JSON twin is `raw` |
   | C08 | the cart has 3 items |
   | C09 | the leaderboard has 10 members |
   | C10 | `l06:seed:n` is `int` |
   | C11 | nothing publishes 6380 |
   | C12 | replica and cluster are absent or healthy: `role:slave` with `master_link_status:up`, and `cluster_state:ok` |
   | C13 | the fingerprint is unchanged |

4. Adapt `verify-guide.mjs`:
   - V01: size limit 380 KB.
   - V03: sections `cach-hoc`, `chang-1..9`, `bai-tap`, `driver-drill`, `phong-van`, `cheat-sheet`, `ban-do-slide`, `tham-khao`, `tiep-theo`.
   - V04: slides 1–46, with chips equal to `expected.tsv`.
   - V05: `pre[data-cmd]` equals the `regions.mjs` output.
   - V06: every `redis>` line in a guide run block appears in its run file, in order.
   - V09: the `l06-` prefix only; any `l07-` or `l14-` fails.
   - V11: run labels are dated, and every timing table carries "phụ thuộc máy".
   - V12: each stage has `.story`, a diagram, `table.stats`, `.check30`, `callout challenge` and its quiz.
   - New V13: Node CRC16-XMODEM mod 16384 (with the hashtag rule) must equal every recorded `CLUSTER KEYSLOT` in `runs/data/w6.json`, and so must `slotOf` from `assembly/widgets/w6.js`, loaded via `vm`.
   - New V14: `labs/lesson-06-redis/**` must not contain `6380`, `FLUSHALL` outside `99-cleanup.sh`, or a container name without the `advance-be-redis` prefix.
   - New V15: no credential URL (`://user:pass@`) and no `requirepass` value.
5. Add a `--selftest` with inline fixtures. It covers V05, V07 and V13, and includes the spec vector `CRC16("123456789") = 0x31C3`.
6. Write `negative-tests.sh` with the 10 cases listed in phase 08. The seed and hw cases break state on lab containers only and restore it with `00-seed.redis`.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| check before setup | rows printed, C06–C10 ✘ "thiếu khóa", exit 0 | `bash labs/lesson-06-redis/check.sh` |
| runs RED | 33 "thiếu file run" failures | `node verify/verify-guide.mjs --runs` |
| selftest | V05/V07/V13 catch their fixtures; CRC vector passes | `node verify/verify-guide.mjs --selftest` |
| syntax | no error | `node --check verify/verify-guide.mjs && bash -n labs/lesson-06-redis/check.sh` |

## Verification
The four commands give RED where the matrix says RED and GREEN elsewhere.

## Risks and rollback
A loose regex passes anything. Negative case f (a copied run with one file emptied) proves that a row fails without its run. Rollback: delete the new files.

=== FILE: phase-03-containers-runner-smoke.md ===
---
phase: 3
title: "Containers, runner, seed, run-method smoke test"
status: pending
priority: P1
effort: 1h
dependencies: [2]
---

## Goal
Create the lab containers, the single runner that both the learner and the controller use, and an idempotent seed. Then decide the learner's run method from evidence.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/labs/lesson-06-redis/setup.sh`, `run.sh`, `00-seed.redis`, `99-cleanup.sh` (new)
- `P/verify/merge-timeline.mjs` (adapted to sort `-- A2 · <server time>` lines)
- `P/runs/smoke.txt`, `P/runs/00-config-baseline.txt` (re-recorded once), `P/runs/check.after-setup.txt`, `P/runs/check.after-seed2.txt`
- `P/assembly/contract.md` §5 (filling the placeholder; no version bump)

## Tasks and steps
1. `setup.sh` (Vietnamese comments, `export MSYS_NO_PATHCONV=1`, `set -eu`, idempotent, and only `advance-be-redis*` names):
   - Create the network `advance-be-redis-net` if it is missing.
   - Recreate the main container: `docker rm -f -v advance-be-redis`, which also removes the first container's anonymous `/data` volume (DBSIZE was 0). Then `docker run -d --name advance-be-redis --network advance-be-redis-net -p 6379:6379 -v advance-be-redis-data:/data redis:7.2.3 redis-server --appendonly no --enable-debug-command local`.
   - `--with-replica` starts `advance-be-redis-replica` on the network with no host port: `--replicaof advance-be-redis 6379 --enable-debug-command local`.
   - `--with-cluster` starts `advance-be-redis-cluster` with no host port and `--cluster-enabled yes`. It then runs `CLUSTER ADDSLOTSRANGE 0 16383` and waits for `cluster_state:ok`.
   - `--persist rdb|aof-everysec|aof-always|default` removes `advance-be-redis-persist` and the volume `advance-be-redis-persist-data`, then runs the container with that mode's flags: `--save "" --appendonly no`, `--appendonly yes --appendfsync everysec`, `--appendonly yes --appendfsync always`, or no extra flags.
   - Every mode waits for `PONG`. An unknown flag exits non-zero.
2. `run.sh <file> [region] [--record <dir>] [--out name]` and `run.sh --ab <A> <B> <region> <delayB>`:
   - Extract the region with awk and drop `# ` lines.
   - Feed a generated stream into a single `docker exec -i <target> redis-cli --no-raw 2>&1`:
     - `ECHO "@@n"` before each command, except inside `MULTI`…`EXEC`;
     - a real `sleep` for each `#@sleep`;
     - `ECHO "@@step X"` followed by `TIME` for each `#@step`.
   - Post-process the output. `"@@n"` becomes `redis> <command n>`. Each `QUEUED` line gets its command printed before it. A `@@step` plus its TIME becomes `-- X · HH:MM:SS.mmm · mô tả`.
   - The header line is `-- chạy lúc <date> · Redis <version> · <target>`.
   - `.sh` regions print `$ <line>` and then run it.
   - Without `--record`, output goes to the terminal. That is the learner's fallback method.
3. `00-seed.redis`:
   - First it `UNLINK`s its exact key list, then writes those keys with `HSET`/`SET`/`RPUSH`/`ZADD`.
   - It never touches `l06:hw:*` or `l06:my:*`.
4. `99-cleanup.sh`:
   - Pipes `--scan --pattern 'l06:*'` into `UNLINK` in batches of 500.
   - Restores the baseline with literal `CONFIG SET` lines.
   - Removes the replica, cluster and persist containers and the persist volume. `--all` also removes the network and the main container with its volume.
5. Run, in order: setup (main only); re-record the config baseline; check; seed; check; seed again; check again.
6. Run the method smoke test and record it in `runs/smoke.txt`:

   | Case | What it checks |
   |---|---|
   | S1 | Piping a region with comments gives `ERR unknown command '#'`, which proves stripping is needed. |
   | S2 | `run.sh 00-seed.redis` prints `redis>` lines and replies in order. |
   | S3 | `MULTI` maps each command to its `QUEUED` line. |
   | S4 | `CLIENT ID` is the same before and after a `#@sleep 1`, so the session is kept. |
   | S5 | The DBX Redis tool via the dbx MCP: `PING`; a 3-line `ECHO a/b/c` payload; `DEBUG HTSTATS 0`. Records whether it accepts multi-line input and whether it refuses DEBUG because it is not a local client. |
   | S6 | `docker exec -it` paste cannot be scripted, so the warm-up asks Đạt to paste 3 lines and tick `data-store="l06-warmup"`. |

   Decision rule:
   - If S5 runs multi-line, DBX becomes the primary method for single-session, non-DEBUG regions.
   - Otherwise, the primary method is pasting into `docker exec -it advance-be-redis redis-cli`, with `bash labs/lesson-06-redis/run.sh <file> <region>` as the fallback.
   - Two-client steps always use two terminals following `table.walk`.

   Write the decision into contract §5.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| check after setup and seed | all ✔ | `bash labs/lesson-06-redis/check.sh > runs/check.after-setup.txt` |
| seed idempotent | byte-identical | `diff runs/check.after-setup.txt runs/check.after-seed2.txt` |
| wrong mode guarded | exits non-zero and creates or removes nothing | `bash labs/lesson-06-redis/setup.sh --persist bogus; echo $?` |
| non-lab untouched | no diff | `bash verify/fingerprint.sh \| diff - runs/00-fingerprint-before.txt` |
| syntax | ok | `bash -n labs/lesson-06-redis/{run,setup,99-cleanup}.sh` |

## Verification
The matrix commands pass, and `grep -c 'redis>' runs/smoke.txt` is greater than 0.

## Risks and rollback
If port 6379 is busy at recreate time, stop and report; never move to another port. Rollback: `99-cleanup.sh --all`, then the evidence packet's original `docker run` line.

=== FILE: phase-04-experiments-recorded-runs.md ===
---
phase: 4
title: "Experiment files and recorded runs"
status: pending
priority: P1
effort: 3h
dependencies: [3]
---

## Goal
Write each stage's small command files and record every region in series, so that every matrix row is either proven or logged as a deviation.

## Files to create/modify (owner: controller only; Redis runs are serial)
| File under `D:/study/advance-be/labs/lesson-06-redis/` | Regions |
|---|---|
| `01-why-fast.redis` / `.sh` | `cmdstats`, `slowlog`, `kiem-chung` / `threads` (`cat /proc/1/task/*/comm`, `INFO`), `bench` (`redis-benchmark -q -n 100000 -t get`, the same with `-P 16`, `-n 20000 MGET` of 10 seed keys) |
| `01-block.A.redis`, `.B.redis` | `sleep` (A `DEBUG SLEEP 1`; B `PING` after 0.2 s); optional `lua-busy` (`BUSY` error) |
| `02-encodings.redis`; `02-lost-update.A/B.redis` | `thresholds`, `user`, `kiem-chung`; `race`, `watch` |
| `03-expiry.redis` / `.sh` | `htstats`, `passive`, `kiem-chung` / `active-curve` (one-line `EVAL` populate, then poll `INFO keyspace` every 0.2 s for 4 s) |
| `04-eviction.redis` | `noeviction`, `lru`, `ttl`, `lfu`, `kiem-chung` |
| `05-persistence.redis` / `.sh` | `rdb-save` on main (`DEBUG POPULATE 1000000 l06:s5:pop`, UNLINK afterwards) / `crash-rdb`, `crash-aof`, `graceful`, `hybrid` on `advance-be-redis-persist` (`setup.sh --persist <mode>`, `docker kill -s KILL`, `docker start`, `ls /data/appendonlydir`) |
| `06-structures.redis`; `06-queue.A/B.redis`; `06-delay.A/B.redis`; `06-bigkey.sh` | `counter`, `cart` (slide-33 commands on `l06:s6:cart:u1`), `set`, `zset`, `kiem-chung`; `brpop`; `claim`; `del-unlink` |
| `07-replica.sh`, `07-replica.redis` (`#@target replica`), `07-cluster.redis` (`#@target cluster`) | `lag` (`docker network disconnect/connect advance-be-redis-net advance-be-redis-replica`), `promote`; `slots`, `hashtag` (+ one main-instance `CLUSTER KEYSLOT` line) |
| `08-lock.redis`; `08-lock.A/B.redis` | `cad`, `fencing`, `kiem-chung`; `steal`, `cad` |
| `09-m2.redis`; `09-bucket.A/B.redis` | `idempotency`, `bucket-lua`, `best-seller`, `kiem-chung`; `race` |
| `hw-check.sh`, `hw-starter/acquire.lua`, `hw-starter/release.lua` | stubs return an error until Đạt copies them to `hw/` and implements them |

Plan folder files:
- `P/verify/record-all.sh`: records in study order and runs `check.sh` after each stage.
- `P/verify/hw-solution/*.lua`: the reference solution.
- `P/verify/hw-bad/release.lua`: a bad fixture whose release is a plain DEL.
- `P/verify/deviations.md`.

## Tasks and steps
1. Write the files to the contract format. Each region has 3–15 commands, and the only loops are one-line `EVAL`s.
   - **Eviction regions** first UNLINK their own `l06:s4:*` keys. They then set a literal `maxmemory`: the baseline `used_memory` (about 1.3 MB on 2026-10-31) plus 4 MB, fixed after one `INFO memory` read. They fill keys by `EVAL` and count survivors per group by `EVAL`. Each ends with `maxmemory 0`/`noeviction`, except `noeviction`, whose OOM must be the last line; its restore opens `lru` and is asserted in `kiem-chung`.
   - **Big-key region**: batch `SADD` 1M members via `EVAL`, then `MEMORY USAGE … SAMPLES 0` and `redis-cli --bigkeys`. Set `slowlog-log-slower-than 0`, run `DEL` on one copy and `UNLINK` on another, then `DEL` again with `lazyfree-lazy-user-del yes`. Restore both settings at the end.
2. Lua scripts:
   - **compare-and-delete release**: quoted from lesson 02 and linked to it, not re-taught.
   - **delay claim**: `ZRANGEBYSCORE … LIMIT 0 1` followed by `ZREM` inside one script.
   - **token bucket**: a hash holding `tokens` and `ts`, with `TIME` read inside the script. It returns `{allowed, tokens, retry_ms}` and sets `PEXPIRE`.
   - **idempotency**: `SET NX EX` with `hash|status|body`; a request with a different hash returns `CONFLICT`.
   - **fencing storage check**: accepts a write only if `token > HGET fence`.

   The guide also shows the Postgres equivalent as text only, `UPDATE … SET fence = $1 WHERE id = $2 AND fence < $1`, linked to lesson 14's optimistic `version`. It is never run.
3. `hw-check.sh [--dir <path>]` loads `acquire.lua` and `release.lua` with `SCRIPT LOAD`.
   - Contract: `KEYS[1]=l06:hw:lock:FA634:A34_S012C`, `ARGV[1]=token`, `ARGV[2]=ttl_ms`. Acquire returns a fencing token or nil.
   - H1: in 20 rounds, two background `EVALSHA` acquirers start together and exactly one wins each round.
   - H2: the lock has a TTL > 0.
   - H3: a release with the wrong token returns 0 and the lock survives.
   - H4: a release with the right token returns 1.
   - H5: the token strictly increases.
4. Run `bash verify/record-all.sh` in this order: stages 1–6; stage 7 (start the replica and cluster, then leave them running for Đạt); stages 8–9; the hw solution and the bad fixture; the final check. Record each A/B region 3 times and keep try 1.
5. Run `--runs`. For each failing row, decide which of two cases it is:
   - The expectation is wrong: log it in `deviations.md` with the run excerpt and its sha256, update `expected.tsv`, and plan the narrative change.
   - The lab file is broken: fix it and re-record.

   Never edit run data.

## Test matrix
| Test (written in phase 02) | Expected | Command |
|---|---|---|
| matrix rows | 33 GREEN or deviation | `node verify/verify-guide.mjs --runs` |
| config restored per stage | no ✘ in any `runs/check.after-stage-N.txt` | `grep -l '✘' runs/check.after-stage-*.txt` prints nothing |
| hw solution / bad fixture | solution all ✔; bad fixture ✘ only on H3 | `runs/hw-check.solution.txt`, `runs/hw-check.bad.txt` |
| non-lab untouched | no diff | `bash verify/fingerprint.sh \| diff - runs/00-fingerprint-before.txt` |
| contradicting measurement | deviation logged; the run's sha256 is unchanged | `sha256sum` vs `deviations.md` |

## Verification
`bash verify/record-all.sh && node verify/verify-guide.mjs --runs && bash labs/lesson-06-redis/check.sh` passes. At least 45 run files exist.

## Risks and rollback
- Long `SAVE` and `DEL` commands block only the lab container.
- If the persist container fails in AOF mode, record `docker logs advance-be-redis-persist` as a deviation.
- Rollback: `99-cleanup.sh`, `setup.sh`, the seed, then `record-all.sh --from N`.

=== FILE: phase-05-widget-data-driver-claims.md ===
---
phase: 5
title: "Widget data, slot check, driver claims"
status: pending
priority: P1
effort: 0.75h
dependencies: [4]
---

## Goal
Turn the runs into widget JSON, and verify the driver-drill claims against published sources before any fragment is written.

## Files to create/modify (owner: controller)
- `P/verify/make-widget-data.cjs` (adapted), `P/runs/data/w1.json` … `w8.json`, `P/verify/driver-claims.md`
- `D:/study/advance-be/labs/lesson-06-redis/driver-drill/menu-cache.ai.ts` (review-only; no package.json)

## Tasks and steps
1. `make-widget-data.cjs` reads only `runs/*.txt`. Every output file carries a `sources` list:

   | File | Contents |
   |---|---|
   | w1 | the sleep timeline, plus req/s and p50 for P1, P16 and MGET |
   | w2 | encodings and bytes at each threshold |
   | w3 | the active-expiry curve, plus the quoted 7.2.3 constants (labelled as source, not measurement) |
   | w4 | survivors per policy, plus the OOM text |
   | w5 | before/after counts per persistence mode |
   | w6 | 10+ keys with their recorded `CLUSTER KEYSLOT`, including the edge cases `{}`, `{a}{b}` and `foo{}{bar}` |
   | w7 | the steal, CAD and fencing timelines |
   | w8 | the Lua bucket calls, plus the race result |

2. Run V13.
3. Use node-redis for the driver drill. `labs/lesson-02-caching/package.json` already pins `redis` ^6.3.0, and Đạt has used it.
   - Confirm the version and API names from published sources: the npm page, the GitHub `redis/node-redis` README, and `unpkg.com/redis@<ver>/`. Never use `node_modules`.
   - `menu-cache.ai.ts` is a NestJS 10 service of about 60 lines with seven seeded mistakes:
     1. `KEYS menu:*` in the request path
     2. `SET` without a TTL
     3. the lock released with `del`
     4. a GET-then-SET counter
     5. `hGetAll` on a big hash
     6. N awaits instead of `mGet`/`multi()`
     7. no `on('error')` handler, and the offline queue left unbounded
   - Each mistake gets its fix and a source URL in `driver-claims.md`: `scanIterator`, `set(…, { EX })`, `eval`/`evalSha` CAD, `incr`, `hScan`, `multi().exec()`, `disableOfflineQueue`. Drop any claim that has no source.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| data traces to runs | 0 untraced numbers | `node verify/verify-guide.mjs --data` |
| CRC16 vs recorded | all equal | `node verify/verify-guide.mjs --only V13` |
| invented number caught | RED | negative case g |
| claims sourced | ≥ 7 `https://` rows | `grep -c 'https://' verify/driver-claims.md` |

## Verification
`node verify/verify-guide.mjs --data --only V13` is GREEN.

## Risks and rollback
If the registry shows a different node-redis major, use the published one and note it. Rollback: regenerate the data from the runs.

=== FILE: phase-06-shell-assembler.md ===
---
phase: 6
title: "Guide shell and assembler"
status: pending
priority: P1
effort: 1h
dependencies: [1, 5]
---

## Goal
Adapt the lesson-07 shell and assembler so that a stub build passes the structural checks. The controller writes every non-stage section.

## Files to create/modify (owner: controller)
- `P/assembly/assemble.mjs`, `shell-css.part`, `shell-head.html`, `shell-tail.html` (copied from lesson 07, then adapted)
- `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html` (generated)

## Tasks and steps
1. Adapt the assembler:
   - `LABS` points to `labs/lesson-06-redis` and `OUT` to the lesson-06 guide.
   - `sqlBlock` becomes `cmdBlock`, built on `verify/regions.mjs`. It handles `.redis` and `.sh` and emits `pre data-cmd` with a copy button.
   - Widgets 1–8 are injected.
   - New CSS (`.story`, `.check30`, `table.stats`, `.lane`, `.slotcalc`, `.bucket`, `.ttlbar`) uses tokens only, and the lesson-07 dark-mode guards stay.
2. `shell-head.html` contains:
   - the hero, "Bài 06 — Redis: vì sao nhanh, lưu gì, mất gì, khóa thế nào";
   - `#cach-hoc` with the plan table, prep, the run-method box from contract §5, the `setup.sh` commands and the warm-up `l06-warmup`;
   - the slide 1–2 figures.
3. `shell-tail.html` contains:
   - `#bai-tap`: seat `A34_S012C` on flight `FA634`, the KEYS/ARGV contract, the starter files, `bash labs/lesson-06-redis/hw-check.sh`, PASS when H1–H5 are ✔, and the answer in a fold.
   - `#driver-drill`: the snippet, a 7-row "tìm lỗi" table (`l06-drill-N`), and answers with sources in a fold.
   - `#phong-van`: 10 `EXAM` questions.
   - `#cheat-sheet`: commands with their complexity and the measured knobs.
   - `#ban-do-slide` and `#tham-khao`: redis.io pages on expire, eviction, persistence, the cluster spec and distributed locks; Kleppmann's lock article; the 7.2.3 source URLs; links to lessons 02, 14 and 07.
   - `#tiep-theo`: maps FR-M2-02 to stage 9, FR-M2-03 to lesson 02, FR-M2-04 to stage 6 and FR-M2-05 to stage 9; notes the hub's Redis on 6380 with a 128 MB budget; then Boss Challenge 2 targets 2.2/2.3 on `quan-ly-hop-dong`, then K2 Bài 04 Rate Limiting.
   - The script block: `SLIDES` with 46 entries, `QUIZ`/`EXAM`, the try/catch storage, the `l06-theme` toggle, the quiz renderer and the placeholders.
4. Build with `--allow-stubs`.

## Test matrix
| Test (written in phase 02) | Expected | Command |
|---|---|---|
| stub build | file written | `node assembly/assemble.mjs --allow-stubs` |
| structure | GREEN | `node verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15` |
| no rail | 0 | `grep -c 'class="rail' reports/advanced_backend/lesson_06_redis_teacher_guide.html` |

## Verification
The matrix commands are GREEN.

## Risks and rollback
Copied text can leave stray `l07-` strings behind; V09 catches them. Rollback: re-copy from lesson 07.

=== FILE: phase-07-stage-fragments.md ===
---
phase: 7
title: "Stage fragments (3 delegates)"
status: pending
priority: P1
effort: 1.5h
dependencies: [1, 5]
---

## Goal
Write the 9 stage fragments, their quiz files and the 8 widgets in parallel against the frozen contract, with disjoint ownership.

## Files to create/modify (owners; all under `P/assembly/`)
| Owner | Files |
|---|---|
| D1 | `fragments/stage-01..03.html`, `stage-01..03.quiz.json`, `widgets/w1.js`, `w2.js`, `w3.js` |
| D2 | `fragments/stage-04..06.html`, `stage-04..06.quiz.json`, `widgets/w4.js`, `w5.js` |
| D3 | `fragments/stage-07..09.html`, `stage-07..09.quiz.json`, `widgets/w6.js`, `w7.js`, `w8.js` |
| Controller | everything else; delegates never touch labs, runs, the shell or the verifier |

## Tasks and steps
1. Give each delegate:
   - the task, the contract path and its stage-map and matrix rows;
   - the run files, the `runs/data` files and `deviations.md`;
   - the slide `.md` page range;
   - lesson 07's `stage-04.html` as the format model;
   - the files it may write, the work context `D:/study/advance-be`, the reports path `P/reports/`, and the required end-of-task status block.
2. Fragment order:
   1. `section#chang-N` with its `stage-head`
   2. `.story`: an F&B or OmniPOS question
   3. a diagram: the slide image `../../Tài Liệu/advanced_backend/assets/6_Redis/page_NN_img_01.png` (hidden on error) or an inline SVG using token classes
   4. `dl.wwh`
   5. one `.sayvs` callout per slide ("Slide nói / Redis 7.2.3 đo được · Trang N") with its chip
   6. `<!--@CMD file#region@-->`
   7. the run label "Kết quả đã chạy trên máy bạn ngày …"
   8. `table.stats` with `b.m` values and "phụ thuộc máy" on timings
   9. `.check30`
   10. `table.walk` (# / Terminal A / Terminal B / Ghi lại) followed by the timeline, for two-client steps
   11. "Làm mẫu"
   12. `div.callout.challenge#chang-N-tu-lam`
   13. the quiz
3. Challenges, one per stage:

   | Stage | Task | PASS when |
   |---|---|---|
   | 1 | Measure `PING` during `DEBUG SLEEP 2`. | B waits ≥ 1.8 s. |
   | 2 | Find where `l06:my:menu` becomes `hashtable`. | It changes at 513 fields. |
   | 3 | Show passive expiry on 5 keys. | `DBSIZE` stays 5 until GET. |
   | 4 | Predict the `volatile-ttl` survivors. | The `EVAL` count matches the prediction. |
   | 5 | Write 10,000 keys on `aof-everysec`, then kill. | The lost count is recorded and explained. |
   | 6 | Run a taxi delay task with 3 orders and 2 pollers. | Each order is claimed exactly once. |
   | 7 | Find the slot of `l06:my:{store42}:menu` in W6, then check it with `CLUSTER KEYSLOT`. | Slots are equal, and `SINTER` has no CROSSSLOT. |
   | 8 | Reproduce the lock steal, then fix it. | A's release returns 0, and the old-token write returns 0. |
   | 9 | Limit `store:42` to 3 calls per 10 s. | The 4th call is denied with `retry_ms` > 0. |

4. Widgets:
   - **W1** replays the server-time lanes and the req/s bars.
   - **W2** has sliders for fields and value bytes. It shows the encoding rule, plus bytes only at measured points ("chưa đo" elsewhere).
   - **W3** is a labelled simulation: it samples 20 keys, toggles between "slide 25 %" and "7.2.3: 10 %", and has an expired-ratio slider. The measured curve sits beside it.
   - **W4** is a policy picker over the recorded survivors and the OOM.
   - **W5** is a mode picker over the loss windows.
   - **W6** is a CRC16 calculator that exports `slotOf` and highlights the hashtag.
   - **W7** shows a TTL bar, A's pause and B's acquire, with a DEL/CAD toggle and a fencing panel.
   - **W8** is a bucket simulator that uses the Lua refill formula; a "replay recorded" view matches w8.

   Every widget guards against null data, adds no globals, and has controls ≥ 44 px.

## Test matrix
| Test (written in phase 02) | Expected | Command |
|---|---|---|
| fragment checks | V05–V07, V09, V12 exit 0 | `node verify/verify-guide.mjs --fragment assembly/fragments/stage-0N.html` |
| quiz shape | 4 × `{q, opts[4], ans, why}`; `why` cites a run | same |
| widget syntax | ok | `node --check assembly/widgets/wN.js` |
| widget behaviour | W6 = recorded slots; W8 replay = 5/2; the others render with recorded data and with null | `node verify/widget-smoke.mjs` |

## Verification
The controller re-runs every check before accepting a delegate's DONE.

## Risks and rollback
- Paraphrased commands fail V05, and invented numbers fail V07/V08.
- Re-teaching lesson 02 is a review item; the rule is to link, not repeat.
- Rollback: delete the delegate's files and re-dispatch with the failure output.

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
Build the full guide and show three things: every check is GREEN, every negative test is RED, and the page renders cleanly.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html` (generated)
- `P/verify/render/`, `P/verify/render-dark/`, `P/verify/tmp/` (negative-test copies, deleted after the run)

## Tasks and steps
1. Run `node assembly/assemble.mjs`, then `node verify/verify-guide.mjs`, then `node verify/verify-guide.mjs --runs --data`.
2. Run `bash verify/negative-tests.sh`:

   | Case | Mutation | Must fail |
   |---|---|---|
   | a | one character in `data-cmd` | V05 |
   | b | an invented `b.m` | V07 |
   | c | the slide-21 chip | V04 |
   | d | slide 38 removed | V04 |
   | e | `l07-x` store key | V09 |
   | f | one run emptied | its matrix row |
   | g | `fake: 999999` in w4 | `--data` |
   | h | a wrong slot in w6 | V13 |
   | i | `HSET l06:seed:user:1 x y` | `check.sh` C06 ✘ (then restore with the seed) |
   | j | `hw-check.sh --dir verify/hw-bad` | H3 ✘ |

3. Run render-check: `node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs <guide> --out verify/render`, with `TMP` and `TEMP` set inside the plan folder. Repeat in dark mode, writing to `verify/render-dark`.
4. Read the 375 px screenshots. Long `redis>` lines must scroll inside `.code`, not the page.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| full verify | exit 0 | the commands in step 1 |
| negative | 10/10 RED as designed | `bash verify/negative-tests.sh` |
| render light/dark | 0 errors, 0 overflow, 0 targets < 44 px | render-check reports |
| size | ≤ 380 KB | V01 |

## Verification
All rows pass, and each render folder holds 3 screenshots.

## Risks and rollback
Fix overflow in `shell-css.part`, never inline. If case i fails to restore, re-run the seed and the check. Rollback: rebuild from the fragments.

=== FILE: phase-09-ultra-review-fixes.md ===
---
phase: 9
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1h
dependencies: [8]
---

## Goal
Run `/ak:code-review --ultra` (5 independent reviewers plus a verifier, taking the union of verified findings), then fix every Critical and Important finding.

## Files to create/modify (owner: controller)
- `P/verify/review-packet.md` (new), `P/reports/review-*.md` (from the reviewers), and any file named by a verified finding

## Tasks and steps
1. The packet scopes the review to the guide, `labs/lesson-06-redis/**`, `assembly/**`, `verify/**`, `runs/` and `deviations.md`. It asks reviewers to check five areas:
   - Redis 7.2 correctness against the matrix and its sources;
   - the teaching pattern (story → diagram → table → check; walkthrough → challenge; no re-teaching of lesson 02);
   - safety (container names, 6380, FLUSHALL, config restore, secrets);
   - V-check coverage;
   - the HTML contract.
2. The verifier de-duplicates findings and checks each one against code or runs. Fix every verified Critical or Important finding. Reject the rest in one line each, citing the verification source.
3. If a fix touches a lab region, re-record that region, then re-run `--runs`, the build and the full verify.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| open findings | 0 Critical or Important | verdict file in `P/reports/` |
| affected checks | GREEN | `node verify/verify-guide.mjs && bash verify/negative-tests.sh && bash labs/lesson-06-redis/check.sh` |

## Verification
Run the commands above, and re-run render-check if any CSS changed.

## Risks and rollback
A finding that would reverse a settled decision (Postgres demos, a different driver) goes to the user and is not applied. Rollback: restore the file from `P/verify/tmp/pre-review/`.

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
Make the guide discoverable, prove the final state, and leave a resume note. The only git command is `git status`.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/README.md`:
  - add `labs/lesson-06-redis/` (redis-cli) to the labs line (line 14 today);
  - add the guide to the reports tree.
- `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 06 (line 38 today): add the new lab folder and the guide path, and keep `labs/lesson-02-caching/06-*.mjs`.
- `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` `#tiep-theo`: link "Bài 06 Redis" to the new guide. This edit is made only if it stays a one-line change.
- `D:/study/advance-be/plans/handoffs/lesson-06-guide-ready-<YYYYMMDD-HHMM>.md` (new).
- The plan status, changed through the plan CLI (run `ak plan --help` first).

## Tasks and steps
1. Apply the doc edits, quoting each original line in the handoff.
2. Run the final gate:
   - the full verify;
   - the negative tests;
   - `check.sh` all ✔;
   - the fingerprint shows no diff;
   - `docker ps` shows only `advance-be-redis`, `-replica` and `-cluster` (persist removed) plus the untouched company container;
   - render files are present and the size is within budget;
   - `git status --porcelain` lists only the guide, `labs/lesson-06-redis/`, this plan folder, README, TONG_QUAN, the lesson-07 guide (if edited) and the handoff.
3. The handoff covers:
   - the containers left running and how to stop them (`99-cleanup.sh`);
   - Đạt's start point (`#cach-hoc` warm-up) and the chosen run method;
   - the deviations;
   - the next step: OmniPOS M2 and Boss Challenge 2, then K2 Bài 04.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| new links resolve | the paths exist | `node -e` existence check |
| lesson-07 guide still valid | V02 GREEN | `node plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs --only V02` |
| final gate | all pass | the step-2 commands |
| no ship step | no branch, commit, push or PR | `git status` only |

## Verification
Paste the final gate table and its results into the handoff.

## Risks and rollback
If the lesson-07 edit breaks its V02, revert that line to the quoted original. Every other doc edit reverts the same way.
