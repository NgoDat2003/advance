---
phase: 3
title: "Containers, seed, stages 1–4 labs and recorded runs"
status: pending
priority: P1
effort: 3h
dependencies: [2]
---

# Phase 03 — Containers and stages 1–4

## Goal
Create the K2L04 containers, then write and record stages 1–4 until their rows are GREEN.

## Files to create/modify (owner: controller; runs serial)
- **`$L/` tools:** `00-containers.sh`, `00-seed.redis`, `99-cleanup.sh`, `99-cleanup.sql`.
- **Stage files:** `01-fundamentals.{sh,redis}`, `01-cluster.redis`, `02-race.{A,B}.redis`, `02-lua.{redis,sh}`, `03-window.redis`, `03-replay.sh`, `03-live.sh`, `04-replay.sh`, `04-leaky.{A,B}.sh`, `04-tb-race.{A,B}.{sh,redis}`, `04-batch.sh`, `04-contract.sh`, `04-bucket.redis`.
- **Lua:** `lua/{voucher-redeem,rl-fixed,rl-log,rl-counter,rl-token-bucket,rl-token-interval,rl-leaky,leaky-offer}.lua`.
- **Plan folder:** `verify/record-all.sh` (`setup s1 s2 s3 s4 gates34`), `runs/*`.

## Container lifecycle (`redis:7.2.3`, local image)
| Container | Publish | Volumes | Cmd |
|---|---|---|---|
| `advance-be-k2l04-redis` | `127.0.0.1:6381:6379` | `<HERE>:/lab:ro`, `advance-be-k2l04-redis-data:/data` | `--appendonly no` |
| `advance-be-k2l04-cluster` | none | `advance-be-k2l04-cluster-data:/data` | `--cluster-enabled yes --cluster-config-file nodes.conf --appendonly no --save ""`, then `CLUSTER ADDSLOTSRANGE 0 16383` |
| `advance-be-k2l04-crash` | none | `<HERE>:/lab:ro`, `advance-be-k2l04-crash-data:/data` | `--appendonly no --save ""` (phase 04) |

`00-containers.sh up|down|status|reset` (L06's script, adapted): network `advance-be-k2l04`; refuses names outside the guard and host ports 6380/6379 (`# guard-port`); stops with the PID if `:6381` is LISTENING; recreates only on drift (main: `SAVE` + `docker stop` first); `down` = `docker rm -f <exact>` + `docker volume rm <exact>-data`; `reset main` restores `maxmemory 0`/`noeviction`. `99-cleanup.sh` UNLINKs `k2l04:*` except `my`/`hw` and removes extras; `--all` also removes main, its volume and the network if unattached. No prune, no L06 names.

## Regions (keys `k2l04:`; Lua only from stage 2)
- **`01-fundamentals.sh`**
  - `bench-set|bench-get`: 3× `docker exec advance-be-k2l04-redis redis-benchmark -q -n 100000 SET|GET k2l04:bench:k [v]`.
  - `cpu`: `nproc`; `INFO cpu | grep main_thread`; `time … redis-benchmark -q -c 50 --threads 4 -P 16 -n 2000000 SET k2l04:bench:cpu v`; grep again.
  - `maxclients`: `CONFIG GET maxclients|io-threads`; `ulimit -n`.
  - `keys-memory`: `used_memory`; `seq 1 100000 | awk '{print "SET k2l04:keys:" $1 " v"}' | docker exec -i … redis-cli --pipe`; `used_memory`; `DBSIZE`; scan + UNLINK; `DBSIZE`.
  - `bandwidth` (optional): 16 B vs `SETRANGE k2l04:bench:big 102399 x`, each read with `GET`.
- **`01-cluster.redis`** (`#@ ct advance-be-k2l04-cluster`)
  - `keyslot`: `CLUSTER INFO`; `CLUSTER KEYSLOT` for the `{42}` and `{s7}` pairs, `k2l04:a|b`, `k2l04:{}x`.
  - `crossslot`: `MGET` untagged vs tagged.
- **`02-race.{A,B}.redis`**
  - `getset`: both `GET` stock, sleep 0.5/0.6, `SET 0`, `RPUSH …:redeemed A|B`.
  - `watch`: A runs `WATCH`, `GET`, sleep 1, `MULTI`, `DECR`, `RPUSH A`, `EXEC`, then retries. B runs sleep 0.5, `DECR`, `RPUSH B`.
  - The `-reset` regions are in A; B starts with `BLPOP k2l04:barrier:<s> 5`.
- **`02-lua.redis#basics`**: `return 1 + 1`, `3.7`, `tostring(3.7)`, a table, `redis.call('TIME')`, `ARGV` concatenation.
- **`02-lua.sh#voucher`**: 2× `MSYS_NO_PATHCONV=1 docker exec advance-be-k2l04-redis redis-cli --eval /lab/lua/voucher-redeem.lua k2l04:voucher:V1:stock k2l04:voucher:V1:redeemed , L1`, then `LLEN`.
- **`03-window.redis`**
  - `incr-expire-bug`: `INCR`, "app chết", `TTL`.
  - `set-nx-incr`: `SET k2l04:rl:ok:s7 0 EX 10 NX`, `INCR`, `TTL`, `SET NX`, `INCR`.
- **`03-replay.sh`** (`fixed|log|counter`): line 1 is an in-container scan + UNLINK. Line 2:

  `docker exec advance-be-k2l04-redis sh -c 'i=0; grep -v "^#" /lab/traffic.tsv | while read ts c act; do i=$((i+1)); w=$((ts/10000)); echo "$ts $c $act $(redis-cli --eval /lab/lua/<s> <keys> , <args> | xargs)"; done | awk -f /lab/summary.awk'`

  | Script | Keys | Args |
  |---|---|---|
  | fixed | `k2l04:rl:fw:{$c}:$w` | `5 10000 $ts` |
  | log | `k2l04:rl:log:{$c}` | `5 10000 $ts $i` |
  | counter | `…:sc:{$c}:$w …:sc:{$c}:$((w-1))` | `5 10000 $ts` |

  `compare` runs 4 scripts per row on `k2l04:rl:cmp:*` and pipes to `compare.awk`.
- **`03-live.sh#fixed-boundary`** (`--timeline`, in container):
  1. One request.
  2. Wait while `PTTL` > 300.
  3. Burst of 4.
  4. Wait for expiry.
  5. Burst of 6.
- **`04-replay.sh`**: same template.

  | Region | Keys | Args |
  |---|---|---|
  | `token` | `k2l04:rl:tb:{$c}` | `5 0.5 1 $ts` |
  | `token-interval` | `k2l04:rl:ti:{$c}` | `5 10000 $ts` |
  | `leaky` | `k2l04:rl:lk:{$c} …:last` | `5 2000 $ts $i` |

  `memory`: 5 calls per limiter on `{mem}` keys, `MEMORY USAGE`; a 1000-entry log, `OBJECT ENCODING`.
- **`04-leaky.{A,B}.sh#worker`**
  - B, after the barrier: `sh -c 'for i in 1 2 3 4 5 6; do v=$(redis-cli BLPOP k2l04:rl:leaky:q 5 | tail -1); echo "$v cho=$(( $(date +%s%3N) - ${v#*-} ))ms"; sleep 0.5; done'`.
  - A: 8× `--eval /lab/lua/leaky-offer.lua k2l04:rl:leaky:q , 5 r$i-$(date +%s%3N)`.
- **`04-tb-race.{A,B}.sh#claim`**: `--eval /lab/lua/rl-token-bucket.lua k2l04:rl:tb:{race} , 1 0.001`, with no now (the production `TIME` form). B sleeps 0.2 first. `.redis#naive` (optional) does GET/sleep/SET.
- **`04-batch.sh`**
  - `rtt`: `SHA=$(… sh -c 'redis-cli -x SCRIPT LOAD < /lab/lua/rl-token-bucket.lua')`; 3× `redis-benchmark -q -c 1 -n 20000 EVALSHA $SHA 1 k2l04:rl:tb:{rtt1} 1000000000 1000000000 1`; 3× `-n 2000 … {rtt10} … 10`.
  - `over-admit`: cost-1 calls at now 0, 1, 10000…10019 → `kieu1 cho_qua=N tren M`; cost-10 calls at 0, 10008, 10018.
- **`04-contract.sh#http429`** <!-- must-fix 9 -->: 3 bucket calls on an empty `k2l04:rl:tb:{http}` (cap 1, rate 0.001) piped through `awk '{ if ($1==1) print "HTTP/1.1 200 OK"; else print "HTTP/1.1 429 Too Many Requests · Retry-After: " int(($3+999)/1000) }'`, so the recorded run shows one `200` then two `429` lines with `Retry-After` > 0. Add a matching run row `R16h 04-contract.http429` (no chip) to the plan matrix and to `expected.tsv`.
- **`04-contract.sh#fail-open`**: `redis-cli -p 6390 PING`; the same `--eval` on 6390 `> /dev/null 2>&1 || echo "Redis loi -> fail-open: cho qua"`; and the same line with `fail-closed: tra 503`.
- **`kiem-chung`** regions in `01-fundamentals.redis`, `02-lua.redis`, `03-window.redis` and `04-bucket.redis`: plain reads.
- **Lua.** All scripts follow T2.4, have Vietnamese comments and use `KEYS` only.
  - `voucher-redeem.lua`: `GET` > 0 → `DECR`, `RPUSH`, return 1; else 0.
  - `leaky-offer.lua`: `LLEN` < cap → `RPUSH`, `PEXPIRE 60000`, return 1; else 0.

## Tasks

**T3.1 Containers up.**
- **Goal:** main and cluster running to spec.
- **Target:** the tool scripts.
- **Steps:**
  1. Write the scripts.
  2. `bash $L/00-containers.sh up main`, then `up cluster`.
  3. Repeat both.
- **Success:** the second run prints `đã đúng bảng`.
- **Verify:** `bash $L/check.sh | grep -E '^(✔|✘) C0[1-5]'` → ✔ C01, C02, C04, C05; no ✘

**T3.1b `record-all.sh`.** <!-- must-fix 1 -->
- **Goal:** one script that records every run id of phases 03–04 through `run-lab.mjs`, grouped by stage.
- **Target:** `$P/verify/record-all.sh` (copy `plans/261031-1651-lesson-06-redis-teacher-guide/verify/record-all.sh`, then adapt).
- **Steps:**
  1. Copy the L06 file to `$P/verify/record-all.sh`.
  2. Replace its body with one `case "$1" in setup|s1|s2|s3|s4|gates34|s5|s6|s7|s8|gates)` block. Each group lists one `node "$P/verify/run-lab.mjs" <lab file> --region <r> --out <run id> [--ab <A> <B> --rep 3] [--timeline] [--ct <container>]` line per run row of `expected.tsv` whose run id belongs to that stage.
  3. Make every run id in `expected.tsv` (column `run`, excluding `–` design rows) appear exactly once in the script.
- **Success:** the script parses, and the set of `--out` ids equals the set of run ids in `expected.tsv`.
- **Verify:** `bash -n $P/verify/record-all.sh && diff <(grep -o -- '--out [^ ]*' $P/verify/record-all.sh | awk '{print $2}' | sort -u) <(awk -F'\t' 'NR>1 && $2!="–" && $2!="-"{print $2}' $P/verify/expected.tsv | sort -u); echo rc=$?` → `rc=0`

**T3.2 Seed and check runs.**
- **Goal:** an idempotent seed.
- **Target:** `00-seed.redis` (UNLINK only the keys the seed itself owns: `k2l04:seed:version`, `k2l04:voucher:V1:stock`, `k2l04:voucher:V1:redeemed`; then `SET k2l04:seed:version v1` and `SET k2l04:voucher:V1:stock 1`). Learner keys `k2l04:my:*` and `k2l04:hw:*` and run-scoped keys are never touched by the seed, so `check.rerun` is reproducible <!-- must-fix 6 -->.
- **Steps:**
  1. Seed through `run-lab.mjs`.
  2. `run-lab.mjs $L/check.sh --out check.after-seed`.
  3. Re-seed.
  4. Record `--out check.rerun`.
- **Success:** K01 and K02 pass.
- **Verify:** `node $P/verify/verify-guide.mjs --runs --only-rows K01,K02; echo rc=$?` → `rc=0`

**T3.3 Stage 1.**
- **Goal:** rows R05–R09b.
- **Target:** stage 1 files.
- **Steps:** `bash $P/verify/record-all.sh s1`.
- **Success:** the rows pass.
- **Verify:** `node $P/verify/verify-guide.mjs --runs --only-rows R05,R06,R07,R07b,R07c,R07d,R08,R09,R09b; echo rc=$?` → `rc=0`

**T3.4 Stage 2.**
- **Goal:** the race and Lua rows.
- **Target:** stage 2 files.
- **Steps:** `record-all.sh s2`, using `--ab … getset|watch --rep 3`.
- **Success:** the rows pass and the reps agree.
- **Verify:** `node $P/verify/verify-guide.mjs --runs --only-rows R33a,R33,R33b,R33c && node $P/verify/rerun-gate.mjs --only 02-race; echo rc=$?` → `rc=0`

**T3.5 Stage 3.**
- **Goal:** the window rows.
- **Target:** stage 3 files.
- **Steps:** `record-all.sh s3`.
- **Success:** the replay matches `ref-model`.
- **Verify:** `node $P/verify/verify-guide.mjs --runs --only-rows R13a,R13b,R13,R13c,R14b,R14,R14c; echo rc=$?` → `rc=0`

**T3.6 Stage 4.**
- **Goal:** the bucket, batch and contract rows.
- **Target:** stage 4 files.
- **Steps:** `record-all.sh s4`, with A/B at `--rep 3` and `rtt` under the 3-attempt clock rule.
- **Success:** the rows pass.
- **Verify:** `node $P/verify/verify-guide.mjs --runs --only-rows R15,R15b,R16,R16a,R16b,R16c,R16d,R16e,R16f,R16g; echo rc=$?` → `rc=0`

**T3.7 Gates 1–4.**
- **Goal:** safety and stability.
- **Target:** `record-all.sh gates34`.
- **Steps:** run, in order:
  1. `--lint`
  2. the rerun gate
  3. `check.sh`
  4. the kiem-chung runs
  5. the fingerprint `--compare`
  6. `negative-tests.sh --labs-only`
- **Success:** all GREEN.
- **Verify:**
  - `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`
  - `node $P/verify/verify-guide.mjs --lint; echo rc=$?` → `rc=0`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| seed idempotent; L06 untouched | K01 = K02; rc 0 | T3.2, T3.7 |
| replay deterministic | 0 differences | `node $P/verify/rerun-gate.mjs --only 03-replay.sh` |
| snippet drift; contradiction | case t RED; runs never edited (M01) | `negative-tests.sh --labs-only`; `--runs` |

## Risks and rollback
A clock-only failure gets at most 3 re-records. Rollback: `99-cleanup.sh`, then delete the stage files and `runs/0[1-4]-*`.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.

