---
phase: 3
title: "Containers, seed, experiments, recorded runs"
status: completed
priority: P1
effort: 3.75h
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
- `06-practices.redis`, `06-practices.sh`, `06-delay.A.redis`, `06-delay.B.redis` (naive), `06-delay-lua.A.sh`, `06-delay-lua.B.sh` (Lua claim) <!-- red-team #1 -->
- `07-architecture.sh`, `07-cluster.redis`
- `08-lock.A.redis`, `08-lock.B.redis` (nolock, nx, ttldel), `08-lock-lua.A.sh`, `08-lock-lua.B.sh` (cad, fencing) <!-- red-team #1 -->
- `09-bridge.redis`, `09-bridge.sh`, `09-bucket.A.redis`, `09-bucket.B.redis` (naive), `09-bucket-lua.A.sh`, `09-bucket-lua.B.sh` (Lua) <!-- red-team #1 -->
- `lua/lock-release.lua`, `lua/fenced-write.lua`, `lua/delay-claim.lua`, `lua/token-bucket.lua`, `lua/idempotency-begin.lua`

Plan folder: `verify/record-all.sh`, `runs/*.txt`, `runs/manifest.tsv`, `verify/deviations.md`.

## Container lifecycle (all `redis:7.2.3`, local image, no pull)

| Container | Network | Published | Flags | Up | Down |
|---|---|---|---|---|---|
| `advance-be-redis` (main) | `advance-be-l06` | `127.0.0.1:6379:6379` only <!-- red-team #5 --> | `--appendonly no --enable-debug-command local`; `-v <HERE>:/lab:ro` | `up main` (recreate once: `docker rm -f -v advance-be-redis` then run) | kept; only `99-cleanup.sh --all` removes |
| `advance-be-redis-replica` | `advance-be-l06` | none | `--replicaof advance-be-redis 6379 --appendonly no --save ""` | `up replica` | `down replica` |
| `advance-be-redis-cluster` | `advance-be-l06` | none | `--cluster-enabled yes --cluster-config-file nodes.conf --appendonly no --save ""`, then `CLUSTER ADDSLOTSRANGE 0 16383` | `up cluster` | `down cluster` |
| `advance-be-redis-evict` | default bridge | none | `--appendonly no --save ""` | `up evict` | `down evict` |
| `advance-be-redis-rdb` | default bridge | none | `--appendonly no --save ""` | `up persist` | `down persist` |
| `advance-be-redis-aof` | default bridge | none | `--appendonly yes --appendfsync everysec --save ""` | `up persist` | `down persist` |

`00-containers.sh up|down|status|reset <name>` is idempotent:
- Line 2 is `export MSYS_NO_PATHCONV=1`; it mounts `HERE="$(cd "$(dirname "$0")" && pwd -W)"`, so the `/lab` mount is the labs folder no matter where it is called from. <!-- red-team #6 -->
- It refuses any name outside the guard and any `-p` containing 6380. Main is published as `-p 127.0.0.1:6379:6379`.
- It recreates a container only when its image tag (`redis:7.2.3`), `Config.Cmd`, port bindings, network or mount source differs from the table. A main created by the lesson-02 guide (`redis:7.4-alpine`) is therefore detected and recreated, with a printed note that lesson-02 keys (`imdb:*`, `lock:*`) on it are dropped by the recreate. <!-- red-team #15 -->
- After any recreate of main it prints the C14/C15 lines (loopback binding and `run_id` match over `127.0.0.1`). <!-- red-team #5 -->
- `up replica` runs `docker network connect advance-be-l06 advance-be-redis` if main is not attached (idempotent). <!-- red-team #11 -->
- `down <extra>` runs `docker rm -f -v <exact name>` for that extra only; it never removes main or the network.
- `reset main` restores the six C11 config values and runs `DEBUG SET-ACTIVE-EXPIRE 1`.

`99-cleanup.sh` (rollback): <!-- red-team #11 -->
- UNLINKs `l06:*` on main through `--scan`, skipping `l06:my:*` and `l06:hw:*` always (there is no flag that deletes them).
- Restores main config (`reset main`).
- Removes the extras by exact name (`docker rm -f -v advance-be-redis-<x>`).
- Leaves network `advance-be-l06` in place while main is attached. With `--all` it removes main first, then removes the network only if `docker network inspect -f '{{len .Containers}}' advance-be-l06` is 0.
- Never uses any `prune` command.

Extra containers publish no port, so the learner and the runner reach them only with `docker exec`. Restarts happen only on `-rdb`/`-aof` (`docker kill` = SIGKILL, no shutdown save, then `docker start`; the anonymous `/data` volume survives) and on `-replica` (R35 reconnect).

## Tasks and steps
1. `00-seed.redis` UNLINKs the exact seed keys, then recreates them:
   - `l06:user:1` (hash, 4 fields, slide 30) and `l06:user:1:json` (51 chars);
   - `l06:cart:u1`;
   - `l06:followers:{a,b}`;
   - `l06:board:bestseller` (5 F&B items).
   It never touches `l06:my:*` or `l06:hw:*`. The delay ZSET is no longer seeded here; each `06-delay*` scenario seeds its own (step 2). <!-- red-team #8 -->
2. Region design, beyond the matrix. Every two-client scenario has a `<scenario>-reset` region in its A file that UNLINKs its own keys (including `l06:barrier:<scenario>`) and writes its own start state. B's first command is `BLPOP l06:barrier:<scenario> 5`, and A's first command is `RPUSH l06:barrier:<scenario> go`. The guide's `table.walk` shows the learner the same order: run reset, start B (it waits), then start A. <!-- red-team #7 -->
   - `01-block`: A runs `DEBUG SLEEP 2` (opt region: Lua busy loop 6 s using `redis.call('TIME')`, which demonstrates `BUSY` and `SCRIPT KILL`). B runs `#@ sleep 0.5`, `PING`. The assertion uses host-ms only: B host-send ≈ A host-send + 0.5 s, and B's PONG host-arrival ≥ A host-send + 1.9 s. <!-- red-team #7 -->
   - `01-why-fast#slowlog`: `CONFIG SET latency-monitor-threshold 100`, `SLOWLOG RESET`, `DEBUG SLEEP 0.5`, `SLOWLOG GET 1`, `LATENCY LATEST`, restore `0`.
   - `01-why-fast#threads`: `INFO server` lines only (run id `01-why-fast.threads`, row R01a). `01-bench.sh#threads` runs `docker exec advance-be-redis sh -c 'ls /proc/1/task | wc -l'` (run id `01-bench.threads`, row R01b). <!-- red-team #9 -->
   - `01-bench.sh`: `redis-benchmark -q -n 100000 -t get` with `-P 1` and `-P 16`; must-fix 1 for sizes (`GET l06:bench:small` vs `GET l06:bench:big`, `-n 20000`); `-c 1 -n 20000` `GET l06:bench:1` vs `MGET l06:bench:1 … :10`. Keys are seeded first. `redis-benchmark` writes `key:__rand_int__` keys only with `-t set`, which is not used; the region ends with `--scan --pattern 'key:*'` → expected empty. MB/s and keys/s are not computed in the lab; they are entries in `runs/data/derived.json` (phase 04). <!-- red-team #9 -->
   - `02-encodings`: thresholds built with `EVAL` loops (`for i=1,513`) on `l06:enc:*`, `OBJECT ENCODING` + `MEMORY USAGE` after each step.
   - `02-json-race`: A/B with `#@ sleep`; JSON is rewritten as a whole string, hash variant uses `HINCRBY` + `HSET`.
   - `03-expiry#passive`: `DEBUG SET-ACTIVE-EXPIRE 0` … `DEBUG SET-ACTIVE-EXPIRE 1` in the same region (V17 enforces the restore). <!-- red-team #15 -->
   - `03-expiry#active`: `INFO stats` snapshot, 10000 keys via one `EVAL` with `PX 1000`, `#@ sleep 3`, snapshot again. `MEMORY STATS` shows `overhead.hashtable.expires`.
   - `03-eviction.sh` (target `advance-be-redis-evict`, one region per policy; first line `echo "→ advance-be-redis-evict"`). Every `redis-cli` call names `-evict`. Steps: <!-- red-team #2 --> <!-- red-team #12 -->
     1. `FLUSHALL`, `CONFIG SET maxmemory 0`, policy.
     2. Read `used_memory` (`BASE`). Set `MAX = BASE + 2 MB` with `CONFIG SET maxmemory $MAX`. The run prints `BASE` and `MAX`; there is no fixed 3 MB.
     3. Hot fill: 300 × 1 KB `SET l06:ev:hot:i` (awk lines piped into one `redis-cli`, one command per line, per must-fix 8).
     4. `sleep 2` (the LRU clock has 1 s resolution).
     5. Cold fill: 600 × 1 KB `SET l06:ev:cold:i` (+ 200 `SET … EX 60–600` `l06:ev:ttl:i` for volatile-ttl). The size is chosen so hot + cold ≈ 1.2 MB stays under the 2 MB budget. The script then prints `used_memory` and `evicted_keys`, and stops with a printed error if `evicted_keys` > 0 (the fill must not evict yet).
     6. `sleep 2`, then 10 touch rounds of `GET` over the hot keys, with `sleep 2` between rounds (≈ 20 s).
     7. `sleep 2`, then overflow fill: 1500 × 1 KB `SET l06:ev:over:i` (this alone crosses `MAX`).
     8. Count with plain commands: `--scan --pattern 'l06:ev:hot:*' | wc -l`, same for cold/ttl, and `INFO stats` `evicted_keys`. Printed as `hot=n/300 cold=n/600 ttl=n/200`.
     9. Restore `CONFIG SET maxmemory 0` and `maxmemory-policy noeviction`.
     For `allkeys-random` (R21) the run records both survival rates and the guide narrates the relation; there is no numeric bound.
   - `04-persistence.sh` (targets `-rdb`/`-aof`, first line prints the target). Region `rdb-loss`: <!-- red-team #15 --> <!-- red-team #3 -->
     1. `FLUSHALL`, then `MSYS_NO_PATHCONV=1 docker exec advance-be-redis-rdb rm -f /data/dump.rdb`, so no old dump can pass the assertion.
     2. `CONFIG SET save ""`; 1000 keys (awk `SET l06:p:i`); `BGSAVE`.
     3. Poll `INFO persistence` every 0.2 s (cap 20 s) until `rdb_bgsave_in_progress:0` and `rdb_last_bgsave_status:ok`; print `rdb_last_save_time`, `latest_fork_usec`.
     4. 500 more keys; `docker kill advance-be-redis-rdb`; `docker start advance-be-redis-rdb`; wait `PING`; `DBSIZE` (expected 1000).
     5. SAVE probe: `CONFIG SET slowlog-log-slower-than 0`, `SLOWLOG RESET`, `SAVE`, `SLOWLOG GET 1`, `CONFIG SET slowlog-log-slower-than 10000` (same region).
     `aof-loss` writes 1500 keys, waits 2 s, kills, starts → DBSIZE 1500 (must-fix 4 narrative). `hybrid`: `BGREWRITEAOF`, wait `aof_rewrite_in_progress:0`, `MSYS_NO_PATHCONV=1 docker exec advance-be-redis-aof ls /data/appendonlydir`, `head -c 5` of the base file (same prefix), toggle preamble, restore. <!-- red-team #6 -->
   - `05-queue`: B `BRPOP l06:q:orders 10`; A at +1 s `LPUSH` ×2; second consumer shows competing consumers. `#list-reliable`: `BLMOVE … RIGHT LEFT` to `l06:q:processing`, `LREM` = ack. Optional `streams`: `XADD`/`XGROUP CREATE`/`XREADGROUP` ×2/`XPENDING`. `05-counter`: GET, `#@ sleep`, `SET n+1` per client, then `INCR`.
   - `06-delay` (slide 37). The reset region seeds `l06:delay:orders` with exactly one due job and two future jobs: `o1` at 1704790435 (slide value, in the past), `o2` and `o3` at 4102444800 (year 2100). The reset runs again between the naive and the Lua variants. <!-- red-team #8 -->
     - Naive (`06-delay.A/B.redis`): `ZRANGE l06:delay:orders -inf 2000000000 BYSCORE LIMIT 0 1` (2000000000 is a fixed "now" cutoff, explained in a comment) → `RPUSH l06:delay:done o1` → `ZREM`. Both pollers take `o1`.
     - Lua (`06-delay-lua.A/B.sh`, region `claim`): `MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/delay-claim.lua l06:delay:orders l06:delay:done`. `delay-claim.lua` reads now from `redis.call('TIME')`, then does `ZRANGE … BYSCORE LIMIT 0 1` + `ZREM` + `RPUSH` atomically. One poller gets `o1`, the other gets nil, and `o2`/`o3` remain. <!-- red-team #1 -->
     - Note: `ZRANGEBYSCORE` deprecated since 6.2.
   - `06-practices#bigkey`: build both `l06:big:h` and `l06:big:h2` first (each one `EVAL` in 10 × 100k chunks); `MEMORY USAGE … SAMPLES 0`. Then, in the same region: `CONFIG SET slowlog-log-slower-than 0`, `SLOWLOG RESET`, `DEL l06:big:h`, `SLOWLOG GET 1`, `SLOWLOG RESET`, `UNLINK l06:big:h2`, `SLOWLOG GET 1`, `CONFIG SET slowlog-log-slower-than 10000`, `INFO stats` `lazyfreed_objects`. No EVAL runs between a reset and its read. `--bigkeys` is a CLI flag, so it sits in `06-practices.sh#bigkeys`. <!-- red-team #3 -->
   - `07-architecture.sh#partition` (target `advance-be-redis-replica`; first line prints it): <!-- red-team #4 --> <!-- red-team #12 -->
     1. `SET l06:rep:price 100` on main; replica `GET` → 100; offsets equal.
     2. `docker network disconnect advance-be-l06 advance-be-redis-replica`.
     3. `SET l06:rep:price 120` on main; `WAIT 1 500` → 0.
     4. Replica `GET` → `"100"` (stale read). No `master_link_status` assertion here (must-fix 3).
     5. `docker network connect advance-be-l06 advance-be-redis-replica`, then `docker restart advance-be-redis-replica`. A bare repeat of the same `REPLICAOF` target is not used, because a replica that believes it is still connected may treat it as a no-op [UNVERIFIED, not needed once restart is used].
     6. Poll `INFO replication` on the replica every 0.5 s, cap 20 s, until `master_link_status:up`; print the poll count.
     7. Replica `GET` → `"120"`; master and replica offsets equal. `sync_partial_ok` and `sync_full` are printed as observed values, not asserted.
     Optional `failover` (target replica): `REPLICAOF NO ONE` on the replica → `role:master`; write on both; `REPLICAOF advance-be-redis 6379` on the replica → the replica's write is gone. Main never receives `REPLICAOF`. Sentinel = diagram "sơ đồ, chưa đo trên máy này".
   - `07-cluster` (`#@ ct advance-be-redis-cluster`): `CLUSTER INFO`; `CLUSTER KEYSLOT` for `foo`, `l06:user_profile:{34}`, `l06:user_session:{34}`, `l06:a`, `l06:b`, `l06:{}x`, `l06:{a}{b}`; `SINTER l06:a l06:b` → CROSSSLOT; tagged pair works.
   - `08-lock` (lock `l06:lock:FA634:A34_S012C`, values `tokA`/`tokB`; every scenario has its reset region): `nolock` both GET nil, both RPUSH `BOOKED`; `nx`; `ttldel` (PX 2000, A sleeps 3 s, B acquires at +2.5 s after the barrier, A `DEL`, then a third acquire succeeds). These stay `.redis`. <!-- red-team #7 -->
   - `08-lock-lua.A/B.sh`: `cad` (same timing; A releases with `MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/lock-release.lua l06:lock:FA634:A34_S012C , tokA` → 0; B's lock intact) and `fencing` (`INCR l06:fence:A34_S012C` per acquire, writes through `fenced-write.lua`, which rejects a lower token with `STALE`). Narrative links lesson 14 `UPDATE … WHERE version = $v` and lesson 02 compare-and-delete (link, not re-taught). <!-- red-team #1 -->
   - `09-bridge`: `token-bucket.lua` (KEYS `l06:tb:store:<id>`; ARGV capacity, refill/s; now from `redis.call('TIME')`; returns `{allowed, tokens, retry_after_ms}`), `bucket30` lives in `09-bridge.sh` as one `docker exec advance-be-redis sh -c 'for i in $(seq 30); do redis-cli --eval /lab/lua/token-bucket.lua l06:tb:store:7 , 10 0.01; done'` (the path is inside `sh -c '…'`, which Git Bash does not rewrite); `idempotency-begin.lua` (KEYS `l06:idem:<key>`, ARGV body hash + TTL → `NEW|IN_PROGRESS|DONE <resp>|MISMATCH`). `09-bucket.A/B.redis`: naive GET / client computes / SET. `09-bucket-lua.A/B.sh` region `claim`: each client calls `token-bucket.lua` once through `--eval` from a reset bucket holding 1 token. <!-- red-team #1 -->
3. Each stage file ends with `kiem-chung`: plain redis-cli commands over that stage's keys (`EXISTS`, `TTL`, `OBJECT ENCODING`, `HGET`, `ZSCORE`, `LLEN`, `GET`, `INFO keyspace` …). Its recorded run is the source of the stage's `table.expect` (expected value per command). No Lua, no PASS/FAIL output. <!-- user decision b -->
4. `verify/record-all.sh` order (run with the env the learner has: no `MSYS_NO_PATHCONV` exported): <!-- red-team #6 -->
   1. `up main`, `00-seed`, `check` → `check.after-seed`, `00-seed`, `check` → `check.rerun` (must be identical; absent extras print `–`). <!-- red-team #5 -->
   2. stages 01→09 in order;
   3. each `--ab` pair with `--rep 3`: run 1 recorded in `runs/`, runs 2–3 in `verify/tmp/rep/`, each run starting from its reset region; <!-- red-team #7 -->
   4. `up evict`/`up persist`/`up replica`/`up cluster` just before their stage;
   5. `check` after stages 1, 3 and 6 (C11/C12);
   6. `--lint`, `rerun-gate`, final `check`, `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt`.
5. For each failing regex: fix the lab file if it is wrong. If Redis 7.2 really behaves otherwise, keep the run, set the row to `deviation`, write `deviations.md` (claim, observed, new chip/narrative). Never edit a run.

## Test matrix
| Test (from phase 02) | Expected | Command |
|---|---|---|
| seed idempotent | `check.after-seed` = `check.rerun` | `diff runs/check.after-seed.txt runs/check.rerun.txt` (header line excluded) |
| all invariants | all ✔ or `–`, rc 0 | `bash labs/lesson-06-redis/check.sh` |
| matrix | GREEN or only logged deviations | `node verify/verify-guide.mjs --runs` (includes M01, D01, V18) |
| lab safety lint | GREEN | `node verify/verify-guide.mjs --lint` (V17) |
| lab negatives g, h, j, k, l, m, n, o, p, r | RED with their codes | `bash verify/negative-tests.sh --labs-only` |
| rerun gate | 0 regions with semantic differences | `node verify/rerun-gate.mjs` |
| config restored | C11, C12 ✔ after stages 1, 3, 6 | `check.sh` rows C11/C12 |
| loopback + identity after recreate | C14, C15 ✔ | `check.sh` rows C14/C15 <!-- red-team #5 --> |
| non-lab untouched | rc 0 | `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt` |

## Verification
The matrix commands, plus `docker ps --filter name=advance-be-redis --format '{{.Names}} {{.Ports}}'` shows `127.0.0.1:6379->6379/tcp` on main only.

## Risks and rollback
- The main recreate drops the controller's earlier scratch data (none, DBSIZE 0 on 2026-10-31).
- Destructive steps target only extras, print their target first, and are linted (V17).
- If a stage run is interrupted, `00-containers.sh reset main` plus `00-seed.redis` restores a known state.
- Rollback: `99-cleanup.sh` (or `--all`), then delete `labs/lesson-06-redis/` and `runs/`. Learner keys `l06:my:*` and `l06:hw:*` survive `99-cleanup.sh`.
