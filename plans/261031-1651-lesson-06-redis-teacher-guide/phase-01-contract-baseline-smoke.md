---
phase: 1
title: "Contract, baseline, run-method smoke"
status: completed
priority: P1
effort: 0.5h
dependencies: []
---

# Phase 01 — Contract, baseline, run-method smoke

## Goal
Freeze every name parallel work depends on, record a privacy-safe controller fingerprint of everything the lesson must not touch, and decide how Đạt runs snippets.

## Files to create/modify (owner: controller)
Plan folder `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/`:
- `assembly/contract.md`
- `verify/fingerprint.sh` (controller-only; never called by anything in `labs/`) <!-- red-team #5 -->
- `runs/00-fingerprint-before.txt`, `runs/run-method-smoke.txt`

## Tasks and steps
1. `verify/fingerprint.sh` (controller gate, not part of the learner `check.sh`). <!-- red-team #5 -->
   - Source is only `docker ps -a --no-trunc --format '{{.ID}}|{{.Image}}|{{.Names}}|{{.Status}}'`. The script never calls `docker inspect` and never reads `.Config`/`Env`, so no secret can reach the output. Names are used in memory to filter out `^advance-be-redis` and are never written.
   - For each non-lab container it writes one sorted line `sha256(id|image)|Up` or `sha256(id|image)|Exited` (status reduced to the first word, so a Docker Desktop restart does not change it). Then it writes `count=<n>` and `port6380=<free|bound>` (from `netstat -ano | grep ':6380 '`), plus `port6380_lab=<none|name>` from `docker ps --filter publish=6380 --filter name=advance-be-redis`.
   - `bash verify/fingerprint.sh --compare <before>` exits 0 when every `before` hash line is present in the current output with the same status, and `port6380_lab=none`. New hash lines are allowed (Phase B adds `omnipos-hub-*` containers) and are listed as `info: +N new container(s)`. A missing or changed `before` line, or `port6380_lab` other than `none`, makes it exit 1. A `port6380` change from `free` to `bound` by a non-lab owner is reported as info, because the OmniPOS hub may own 6380 legitimately.
   - It also prints `main_bind=<HostIp>:<HostPort>` from `docker port advance-be-redis 6379` (expected `127.0.0.1:6379`), and `run_id_match=<yes|no>` from `docker exec advance-be-redis redis-cli INFO server` compared with a host TCP `INFO server` sent to `127.0.0.1:6379` by a node one-liner (`net.connect(6379,'127.0.0.1')`). The controller re-runs these two lines after every recreate of main. <!-- red-team #5 -->
   - Write `runs/00-fingerprint-before.txt`.
2. Smoke tests, all on the existing `advance-be-redis` with key `l06:smoke` only, recorded in `runs/run-method-smoke.txt`:
   - S1 pipe: `printf 'SET l06:smoke 1\nGET l06:smoke\n' | docker exec -i advance-be-redis redis-cli --no-raw` → `OK` / `"1"`.
   - S2 streaming: `(echo PING; sleep 1; echo PING) | docker exec -i … redis-cli`, with host-ms stamps taken by the reader on each reply line → the two stamps differ by about 1000 ms (confirms the runner can pace commands in one session). <!-- red-team #7 -->
   - S3 comment line: `# x` → `ERR unknown command '#'` (seen 2026-10-31).
   - S4 UTF-8: `ECHO "Đạt"` in `--no-raw` shows escaped bytes.
   - S5 DBX: through the DBX Redis tool on `ADVANCE_BE_REDIS` (host `127.0.0.1`, not `localhost`), send one command, then a two-line input. Record whether both run.
   - S6 TTY: `docker exec -it` from Git Bash cannot be tested headless; record "unverified, guide shows winpty and PowerShell forms".
   - S7 Git Bash path: `docker exec advance-be-redis echo /lab/x` (expect `D:/Git/lab/x`, mangled) vs `MSYS_NO_PATHCONV=1 docker exec advance-be-redis echo /lab/x` (expect `/lab/x`). This is recorded as the reason for the prefix rule in §2. <!-- red-team #6 -->
   - `UNLINK l06:smoke`.
3. Decision rule written into `contract.md` §5: primary method is interactive `redis-cli` in `docker exec -it advance-be-redis redis-cli` (paste a whole block). Pipe form `grep -v '^#' labs/lesson-06-redis/<file> | docker exec -i advance-be-redis redis-cli` is the fallback for long blocks. If S5 runs multi-line, DBX is listed as an alternative for single-client snippets. Otherwise DBX is used only to browse keys (type, TTL, memory). Two-client steps use two terminal tabs, A and B. Every host-side client (DBX, homework, driver drill) uses `127.0.0.1:6379`, because the container is published on `127.0.0.1` only and Windows may resolve `localhost` to `::1` first (controller-facts-addendum item 4).
4. Write `assembly/contract.md` (v1):
   - §1 Key registry (all `l06:`): `l06:user:*`, `l06:cart:*`, `l06:q:*`, `l06:delay:*`, `l06:big:*`, `l06:exp:*`, `l06:ev:{hot,cold,ttl}:*` (evict container), `l06:p:*` (persistence containers), `l06:rep:*`, `l06:{34}:*` and `l06:slot:*` (cluster container), `l06:lock:*`, `l06:fence:*`, `l06:seat:*`, `l06:tb:*`, `l06:idem:*`, `l06:bench:*`, `l06:barrier:*` (two-client start barrier), `l06:hw:*` (homework), `l06:my:*` (learner). Neither the seed nor `99-cleanup.sh` ever removes `l06:my:*` or `l06:hw:*`. <!-- red-team #7 --> <!-- red-team #11 -->
   - §2 File formats.
     - `.redis`: a region is `# #region <id> · <tiêu đề> (slide N)` … `# #endregion`. Comment lines start with `#`. Runner directives are `#@ sleep <s>` and `#@ ct <container>`. One command per line. No non-ASCII outside comments. A `.redis` file never contains `redis-cli` flags (such as the eval-file flag) or placeholders like `<now>`; Lua runs live in `.sh` regions (below). <!-- red-team #1 -->
     - The last region of each stage file is `kiem-chung`: plain redis-cli commands only (`EXISTS`, `TTL`, `OBJECT ENCODING`, `HGET`, `ZSCORE`, `LLEN`, `GET`, …). The fragment shows the same commands next to a `table.expect` (lệnh / giá trị mong đợi / ý nghĩa) whose expected values come from the recorded run. No Lua checker, no PASS/FAIL strings. Lua appears only where the lesson teaches Lua: stage 6 delay claim, stage 8 lock release and fencing, stage 9 token bucket and idempotency. <!-- user decision b -->
     - `.sh` files come in two kinds. <!-- red-team #6 -->
       - Tool scripts that run whole (`00-containers.sh`, `check.sh`, `99-cleanup.sh`, `hw-check.sh`). Line 2 is `export MSYS_NO_PATHCONV=1`, and paths resolve from the script's own dir with `HERE="$(cd "$(dirname "$0")" && pwd -W)"`, never from the caller's cwd.
       - Region files that the learner pastes line by line (`01-bench.sh`, `03-eviction.sh`, `04-persistence.sh`, `06-practices.sh`, `07-architecture.sh`, `09-bridge.sh`, and the Lua A/B files `06-delay-lua.{A,B}.sh`, `08-lock-lua.{A,B}.sh`, `09-bucket-lua.{A,B}.sh`). They use the same region markers and `set -u`. Every line that passes an absolute in-container path carries the prefix `MSYS_NO_PATHCONV=1 ` (or writes the path as `//path`), so what the learner pastes is exactly what the runner ran.
     - Lua runs: a `.sh` region line `MSYS_NO_PATHCONV=1 docker exec <ct> redis-cli --eval /lab/lua/<name>.lua <keys> , <args>`. The script file is read from the read-only `/lab` mount, so the text that runs is the `.lua` file. "Now" is always computed inside Lua with `redis.call('TIME')`. <!-- red-team #1 -->
     - Destructive commands (`FLUSHALL`, `FLUSHDB`, `REPLICAOF`, `CONFIG SET maxmemory*`, `docker kill|stop|restart|rm`, `docker network disconnect|connect`) appear only in regions whose target is a non-main container. Such a `.sh` region prints its target first (`echo "→ advance-be-redis-<x>"`), and its commands name that container explicitly. <!-- red-team #12 -->
   - §3 Run ids (region ids are unique per file stem across `.redis`/`.sh`). `runs/<stem>.<region>.txt`; two-client runs add `.A/.B/.timeline.txt`. `data-cmd="<file>#<region>"`, `data-run="<stem>.<region>[.timeline]"`, widget data `run-w1…w9`, derived values `data-derived="<name>"` from `runs/data/derived.json`. `runs/manifest.tsv` holds exactly one line `sha256<TAB>path` per run path; the runner replaces that line on every write and never appends a duplicate. Repetitions 2–3 of a two-client run go to `verify/tmp/rep/` and are never in `runs/` or the manifest. <!-- red-team #9 --> <!-- red-team #10 -->
   - §4 Fragment format and CSS vocabulary (lesson-07 classes plus `.story`, `.check30`, `table.stats`, `table.expect`, `.lanes`, `.slotcalc`, `.bucket`). Widget rule: every run- or data-derived string reaches the DOM through `textContent` or through the single `esc()` defined in `shell-tail.html`. A `${…}` inside an `innerHTML` template must be wrapped in `esc(…)`, or be a number produced by `Number(...)`/`toFixed`. <!-- red-team #15 -->
   - §5 Learner workflow from step 3.
   - §6 Slide → stage → chip → chip row → required anchor table, copied from the plan matrix. Slides 7 and 8 are PART with the note "chưa đo trực tiếp" (Sentinel and Cluster failover are not run on this machine). Every PART and FIX slide needs `id="sl-NN"`. <!-- red-team #14 -->
   - Storage keys: `l06-c<N>-<slug>`, `l06-theme`, `l06-warmup`, `l06-hw-*`, `l06-drill-*`.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| fingerprint script runs twice with no change | two identical files | `bash verify/fingerprint.sh > verify/tmp/fp-a.txt; bash verify/fingerprint.sh > verify/tmp/fp-b.txt; diff verify/tmp/fp-a.txt verify/tmp/fp-b.txt` |
| no names or env in fingerprint | 0 matches | `grep -ciE 'quan-ly\|omnipos\|=.*secret\|password' runs/00-fingerprint-before.txt` → 0 <!-- red-team #5 --> |
| no lab container on 6380 | `port6380_lab=none` | `grep port6380_lab runs/00-fingerprint-before.txt` |
| main bound to loopback, same instance | `main_bind=127.0.0.1:6379`, `run_id_match=yes` | `grep -E 'main_bind\|run_id_match' runs/00-fingerprint-before.txt` <!-- red-team #5 --> |
| smoke key removed | `(integer) 0` | `docker exec advance-be-redis redis-cli EXISTS l06:smoke` |
| contract covers 46 slides | 46 rows, each once | `grep -cE '^\| [0-9]+' assembly/contract.md` plus a quick node count |

## Verification
`bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`; `cat runs/run-method-smoke.txt` shows S1–S7.

## Risks and rollback
Smoke touches only `l06:smoke`. The fingerprint holds only hashes, a count and port status, so it is safe in the public repo. Rollback deletes the four new files.
