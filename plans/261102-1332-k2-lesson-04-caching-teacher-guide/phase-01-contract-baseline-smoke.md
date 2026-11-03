---
phase: 1
title: "Contract, baseline fingerprint, run-method smoke"
status: pending
priority: P1
effort: 0.75h
dependencies: []
---

# Phase 01 — Contract, baseline, smoke

## Goal
Freeze the shared names, fingerprint everything K2L04 must not change, and decide the run methods from evidence.

## Files to create/modify (owner: controller)
- `$P/assembly/contract.md`
- `$P/verify/fingerprint.sh`
- `$P/verify/fixtures/smoke/echo.lua`
- `$P/runs/00-fingerprint-before.txt`
- `$P/runs/run-method-smoke.txt`
- network `advance-be-k2l04` (kept)

## Tasks

**T1.1 Fingerprint script.**
- **Goal:** a controller-only proof that nothing outside K2L04 changes.
- **Target:** `$P/verify/fingerprint.sh`.
- **Steps:**
  1. Copy L06 `verify/fingerprint.sh`. Keep `sha256(id|image)|Up|Exited` per container not named `advance-be-k2l04-*`, and `count=`.
  2. Add these lines:
     - `port6380_k2l04`
     - `k2l04_main_bind` and `k2l04_run_id_match` (node TCP to 6381)
     - `l06_main`, `l06_main_bind`, `l06_volume=sha256(Name|CreatedAt)`, `l06_network=sha256(Id)`
     - `l06_k2l04_keys` (`--scan --pattern 'k2l04:*'` count, or `down`)
     - `pg_schemas` (sorted, excluding `pg_%`, `information_schema`, `k2l04_counter`)
     - `pg_other_writes` (sha256 of per-schema `n_tup_ins+upd+del`, excluding `k2l04_counter`)
  3. Make `--compare` exit 1 on any of: a missing baseline line; a status change on a non-L06 line (an L06 flip is info only); a change to L06 bind, volume or network; `l06_k2l04_keys` ∉ {0, down}; `port6380_k2l04` ≠ none; a `pg_schemas` change. `pg_other_writes` is advisory: a delta prints `info: pg_other_writes changed` and does not change the exit code, because the company dev app shares `quan-ly-hop-dong-postgres-1` <!-- must-fix 4 -->.
- **Success:** deterministic output, with no names or secrets.
- **Verify:**
  - `bash $P/verify/fingerprint.sh > $P/verify/tmp/fp-a.txt; bash $P/verify/fingerprint.sh > $P/verify/tmp/fp-b.txt; diff $P/verify/tmp/fp-a.txt $P/verify/tmp/fp-b.txt; echo rc=$?` → `rc=0`
  - `grep -ciE 'quan-ly|omnipos|password' $P/verify/tmp/fp-a.txt` → `0`

**T1.2 Baseline.**
- **Goal:** the "before" file.
- **Target:** `$P/runs/00-fingerprint-before.txt`.
- **Steps:**
  1. Write it with the script.
  2. Make `verify/tmp/fp-bad.txt` with `sed '0,/|Up$/s//|Exited/'`.
- **Success:** `l06_k2l04_keys=0`; `pg_schemas=lab03_indexing,lab07_modeling,lab12_transaction,lab14_locking,lab_imdb,northwind,public`.
- **Verify:**
  - `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`
  - with `fp-bad.txt` → `rc=1`

**T1.3 Smoke S1–S13.**
- **Goal:** the facts that fix the learner method and the runner.
- **Target:** `$P/runs/run-method-smoke.txt`; `echo.lua` = `return ARGV[1]`.
- **Steps:**
  1. Create the network.
  2. Start a throwaway container: `docker run -d --rm --name advance-be-k2l04-smoke --network advance-be-k2l04 --mount type=tmpfs,destination=/data -v "$(cd $P/verify/fixtures/smoke && pwd -W):/lab:ro" redis:7.2.3 redis-server --save "" --appendonly no`.
  3. Record `S<n> <command> → <observed>`: S1 pipe SET/GET → `OK`, `"1"`; S2 `#` line → `ERR unknown command '#'`; S3 `/lab/x` with/without `MSYS_NO_PATHCONV=1`; S4 `command -v awk seq xargs grep date; date +%s%3N`; S5 `redis-cli -x SCRIPT LOAD < echo.lua` → 40 hex; S6 `--eval /lab/echo.lua , hi` → `hi`; S7 `used_cpu_user_main_thread`, `maxclients` 10000, `ulimit -n`; S8 piped WATCH/MULTI/INCR/EXEC → `QUEUED`, `1) (integer) 2`; S9 `EVAL "return __1__" 0` → `nonexistent global`; S10 RESP3 `CLIENT TRACKING ON` + GET while B sets → `yes` if `invalidate`; S11 `printf 'SELECT 1;\n' | MSYS_NO_PATHCONV=1 docker exec -i -e PGAPPNAME=k2l04-smoke quan-ly-hop-dong-postgres-1 pgbench -n -f /dev/stdin -c 1 -T 1 -U postgres advance_be_lab` → `failed transactions: 0` (S11b `/tmp` file removed in the same `sh -c`, only if S11 fails); S12 psql → `advance_be_lab|16.15`; S13 `redis-cli -p 6390 PING` → refused, rc 1.
  4. `docker stop advance-be-k2l04-smoke`.
- **Success:** all 13 recorded. S10 decides R30b; S11 decides the pgbench feed.
- **Verify:**
  - `grep -c '^S[0-9]* ' $P/runs/run-method-smoke.txt` → ≥ `13`
  - `docker ps -a --filter name=advance-be-k2l04 -q | wc -l` → `0`

**T1.4 Contract v1.**
- **Goal:** a frozen contract for the parallel writers.
- **Target:** `$P/assembly/contract.md`.
- **Steps:** write these sections.
  - §1 Keys: main `k2l04:{seed,bench,keys,voucher,rl,cnt,mem,unread,share,delay,hll,bm,bloom,barrier,hw,my}:*`; cluster `k2l04:post:{42}:*`, `k2l04:rl:sc:{s7}:*`, `k2l04:a|b`, `k2l04:{s7}:*`; crash `k2l04:cnt:delta`; `my`/`hw` never deleted.
  - §2 Formats: L06 §2 + `.sql` `-- #region`; `.sh` from repo root; Lua only in stems `02`–`08`, `hw`, `lua/`, `drill/`. §3 Run ids: L06 §3 + `--timeline`, `# đồng hồ`.
  - §4 Fragments/CSS: L06 + `.gloss`, `.replay`, `.estimator`, `.costmodel`, `.calc`; `wN-` ids; `esc()` rule. §5 Learner workflow (phase 06 T6.3). §6 Slide → stage → chip → row → anchor. §7 Storage keys `k2l04-c<N>-<slug>`, `k2l04-theme`, `k2l04-warmup`, `k2l04-hw-*`, `k2l04-drill-*`.
- **Success:** 39 rows in §6, and the null chips equal the frozen list.
- **Verify:** `node -e "const t=require('fs').readFileSync('$P/assembly/contract.md','utf8');console.log([...t.matchAll(/^\| (\d+) \|[^\n]*\| – \| – \|/gm)].map(m=>+m[1]).join(','))"` → `1,2,3,10,12,17,18,23,26,32,38,39`

**T1.5 Post-smoke compare.**
- **Goal:** the smoke changed nothing protected.
- **Target:** none.
- **Steps:** run `--compare`.
- **Success:** rc 0.
- **Verify:** `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`

## Test matrix
| Test (first) | Expected | Command |
|---|---|---|
| fingerprint idempotent, no names | no diff, 0 | T1.1 |
| doctored baseline caught | rc 1 | T1.2 |
| no smoke container left | 0 | T1.3 |

## Risks and rollback
The smoke writes only `k2l04:smoke` on tmpfs and runs `SELECT 1` on PG. Rollback: delete the files and remove the network if nothing is attached to it.

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

