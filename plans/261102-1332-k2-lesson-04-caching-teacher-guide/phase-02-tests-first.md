---
phase: 2
title: "Tests first: model, matrix, runner, verifier, check, negatives"
status: pending
priority: P1
effort: 2.5h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Every checker exists before any lab region, run or HTML, and each one is RED or GREEN for the right reason.

## Files to create/modify (owner: controller)
- **Copied from L06 `verify/` and adapted:** `$P/verify/lab-text.mjs`, `run-lab.mjs` (from `run-redis.mjs`), `merge-timeline.mjs`, `verify-guide.mjs`, `rerun-gate.mjs`, `negative-tests.sh`, `widget-smoke.mjs`.
- **New:** `ref-model.mjs`, `expected.tsv`, `deviations.md`, `fixtures/*`.
- **Labs:** `$L/check.sh`, `traffic.tsv`, `summary.awk`, `compare.awk`.

## Tasks

**T2.1 `lab-text.mjs`.**
- **Goal:** one display rule for every tool.
- **Target:** `$P/verify/lab-text.mjs`.
- **Steps:**
  1. Accept `-- #region` markers in `.sql`.
  2. `displayText` keeps `.sh`/`.sql`/`.lua`/`.ts`/`.tsv`/`.awk`/`.pgbench` verbatim and strips `#` lines from `.redis`.
  3. Export `pgWriteTargets(sql)`: the targets of CREATE/ALTER/DROP, INSERT, UPDATE, DELETE and TRUNCATE, plus `forbidden` (ALTER SYSTEM, CREATE/DROP DATABASE, `pg_terminate_backend`, `pg_cancel_backend`, `pg_reload_conf`).
- **Success:** it parses.
- **Verify:** `node -e "import('./$P/verify/lab-text.mjs').then(m=>console.log(JSON.stringify(m.pgWriteTargets('UPDATE public.x SET a=1; ALTER SYSTEM SET x=1'))))"` → output contains `public.x` and `ALTER SYSTEM`

**T2.2 `run-lab.mjs`.**
- **Goal:** the only writer of `runs/`.
- **Target:** `$P/verify/run-lab.mjs`.
- **Steps:** apply these deltas to L06 `run-redis.mjs`.
  1. `GUARD=/^advance-be-k2l04-(redis|cluster|crash|smoke)$/`. The PG container is allowed only on `psql`/`pgbench` exec lines.
  2. In `.redis`, `MULTI` through `EXEC`/`DISCARD` is one step.
  3. `.sql` goes to `psql -X -U postgres -d advance_be_lab -v ON_ERROR_STOP=1 -a`. Exit 2 if `pgWriteTargets` reports anything outside `k2l04_counter.` or anything in `forbidden`.
  4. Header line 1: `# chạy lúc … · Redis <ver> · <ct>` or `… · PostgreSQL <ver>`.
  5. Header line 2: `# đồng hồ máy-ảo=<Δ>ms host=<Δ>ms → ok|LỆCH`, using Redis `TIME` or PG `clock_timestamp()` before and after. It is `ok` iff Δvm ≥ 0 and |Δvm−Δhost| ≤ max(300, 0.15·Δhost).
  6. `.sh` runs with cwd = repo root.
  7. Write `# lua labs/k2-lesson-04-caching/<path> sha256=` for each `/lab/` script used.
  8. Add `--timeline` for single-client runs.
  9. Barriers use `k2l04:barrier:<s>`.
- **Success:** foreign containers are refused.
- **Verify:**
  - `node $P/verify/run-lab.mjs $P/verify/fixtures/x.redis --region a --ct advance-be-redis; echo rc=$?` → `rc=2`
  - the same with `--ct quan-ly-hop-dong-postgres-1` → `rc=2`

**T2.3 Trace and awk.**
- **Goal:** the shared input behind every replay number.
- **Target:** `$L/traffic.tsv`, `summary.awk`, `compare.awk`.
- **Steps:**
  1. Write 60 rows of `ts_ms client act`, with a Vietnamese comment per act:
     - s7 act 1: 8750 9000 9250 9500 9750 10000 10250 10500 10750 11000 12750
     - s7 act 2: 78750 79000 79250 79500 79750 81000 82000 83000 84000 85000 86000 87000 88000 89000
     - s7 act 3: 155000 155125 155250 155375 155500
     - s7 act 4: 200125 200250 200375 200500 200625 211000 212000 213000
     - s8: 5000+10000k, k = 0…21

     The 125 ms grid keeps token arithmetic exact.
  2. `summary.awk` echoes the rows, then prints the `man`/`tong` lines (`toi_da_10s` over ts + field 6 of allowed rows).
  3. `compare.awk` prints `tong khac_fixed_interval=n counter_qua_log_chan=n counter_chan_log_qua=n`.
- **Success:** 60 rows.
- **Verify:** `grep -vc '^#' $L/traffic.tsv` → `60`

**T2.4 `ref-model.mjs`.**
- **Goal:** an independent oracle that follows the same operation order as the Lua (IEEE doubles, `math.floor`/`ceil`, `tostring` = `%.14g`).
- **Target:** `$P/verify/ref-model.mjs`.
- **Steps:**
  1. Implement the six limiters:

     | Script | KEYS | ARGV | Semantics |
     |---|---|---|---|
     | **fixed** | `…:fw:{c}:<floor(now/W)>` | L W now | `n=INCR`; `PEXPIRE 2W` if n=1; return `{n≤L, n, n≤L?0:W−now%W}` |
     | **log** | – | L W now id | `ZREMRANGEBYSCORE −inf now−W`. If `ZCARD` n<L: `ZADD now "now-id"`, `PEXPIRE 2W`, `{1,n+1,0}`; else `{0,n,oldest+W−now}` |
     | **counter** | cur, prev | L W now | `est=prev(1−(now%W)/W)+cur`. If est+1≤L: `INCR`, `PEXPIRE 3W`, `{1,tostring(est+1),0,prev,cur}`; else `need=L−1−cur`, retry = need<0 ? (w+1)W+ceil(W(1−(L−1)/cur))−now : wW+ceil(W(1−need/prev))−now, and return `{0,tostring(est+1),retry,prev,cur}` (so R14 "est 6, retry 2000" is the literal deny reply) <!-- must-fix 3 --> |
     | **token-bucket** | hash `tokens,last_ms` | cap rate cost=1 [now, else `TIME`] | new = full; `tokens=min(cap,tokens+max(0,now−last)·rate/1000)`; allow if ≥ cost, else `retry=ceil((cost−tokens)·1000/rate)`; `last_ms=max(last,now)`; `PEXPIRE ceil(cap/rate·1000)`; return `{allowed,floor(tokens),retry}` |
     | **token-interval** | hash `slot,tokens` | cap I now | refill on a new slot; deny with `(slot+1)I−now` |
     | **leaky** | ZSET + last | Q I now id | `ZREMRANGEBYSCORE −inf now`. If waiting ≥ Q: `{0,waiting,first−now}`; else `start=last?max(now,last+I):now`, `ZADD` if start>now, `{1,waiting+(start>now),start−now}` |

     Contract notes <!-- must-fix 8 -->: every limiter reply uses integer units (ms, whole tokens), because Lua numbers are truncated to integers when returned to the client; `est` is returned as a string. Every `MEMORY USAGE` in R16f/R22/R25c/R35b/R37b is written `MEMORY USAGE <key> SAMPLES 0`, so Hash/ZSet bytes are exact rather than sampled.
  2. Use these parameters:
     - replay: L 5, W 10000; token 5/0.5; interval 5/10000; leaky 5/2000;
     - batch: cap 10, rate 1;
     - Bloom: `u1…u10000`, m 50000, k 3, `parseInt(sha1hex.slice(8j,8j+8),16)%m`, probes `x1…x10000`.
  3. `--check` exits 0 iff the output equals the R13, R14b, R14, R14c, R15, R16, R16a, R16e and R37 literals.
- **Success:** the model reproduces the matrix.
- **Verify:** `node $P/verify/ref-model.mjs --check; echo rc=$?` → output contains `fp=953/10000` and `counter_qua_log_chan=5`, then `rc=0`

**T2.5 `expected.tsv`.**
- **Goal:** freeze the matrix.
- **Target:** `expected.tsv`, `deviations.md` (header only).
- **Steps:**
  1. Write one row per plan row in L06 regex style (named groups, `⇒` predicates).
  2. Timed rows add `(?=[\s\S]*^# đồng hồ [^\n]*→ ok$)`.
  3. Drop R30b if S10 = no.
  4. Set every status to `expect`.
- **Success:** 27 chip rows on distinct slides.
- **Verify:** `awk -F'\t' 'NR>1 && $6!="–"{print $3}' $P/verify/expected.tsv | sort -n | uniq | paste -sd, -` → `4,5,6,7,8,9,11,13,14,15,16,19,20,21,22,24,25,27,28,29,30,31,33,34,35,36,37`

**T2.6 `verify-guide.mjs`.**
- **Goal:** checker for the guide, runs and labs.
- **Target:** `$P/verify/verify-guide.mjs`.
- **Steps:** apply these deltas to L06's verifier.
  - Paths `G`/`$L`; slides 1–39; 8 stages; prefix `k2l04-`.
  - V03: sections `cach-hoc`, `chang-1…8`, `bai-tap`, `guard-drill`, `phong-van`, `cheat-sheet`, `ban-do-slide`, `tham-khao`, `tiep-theo`.
  - V04: the frozen null-chip set.
  - V10: reject `data:` images; require the K2 asset prefix.
  - V11: QUIZ 1–8.
  - V12: glossary before the first `data-cmd`; no Lua tokens in `chang-1`.
  - V15: add `PGPASSWORD|postgres://[^ ]*@`.
  - V17 (lint): L06 rules with `k2l04:`, plus:
    - the container guard;
    - ban `advance-be-redis`, `advance-be-l06`, `6380`, host `6379`;
    - require `-p 127.0.0.1:6381:6379`;
    - benchmark with no `-t` and a `k2l04:` key;
    - pgbench `-n -f`, no `-i`, no `-d` (it is `--debug` in pgbench 16; the DB name is the last positional argument), `-c ≤ 8`, `-T ≤ 5`; <!-- must-fix 2 -->
    - SQL targets only in `k2l04_counter.`;
    - Lua stems only;
    - `FLUSHALL` only on extras.
  - New V23 (`--runs`): run command lines equal the current `displayText` of the region.
  - Add `--only-rows <ids>`; `median`/`min`/`max` predicates; selftest fixtures for V23 and the PG lint.
- **Success:** the selftest passes.
- **Verify:** `node $P/verify/verify-guide.mjs --selftest; echo rc=$?` → `rc=0`

**T2.7 `check.sh` (red first).**
- **Goal:** learner invariants that scan only K2L04 objects.
- **Target:** `$L/check.sh` (line 2 `export MSYS_NO_PATHCONV=1`, plus `HERE=`).
- **Steps:** each check prints `✔|✘|–`, and the exit code is the ✘ count.
  - C01: main image 7.2.3, running, `--appendonly no`, network, `/lab:ro` from HERE, data volume.
  - C02: cluster (`–` if absent; else no port, `cluster_state:ok`, 16384).
  - C03: crash (`–` if absent; else `--save ""`, no port).
  - C04: main publishes only `127.0.0.1:6381`; no other k2l04 port.
  - C05: host `run_id` = exec `run_id`.
  - C06: all keys `k2l04:`.
  - C07: seed present.
  - C08: `maxmemory 0`, `noeviction`, `hash-max-listpack-entries 512`, `zset-max-listpack-entries 128`, `hll-sparse-max-bytes 3000`.
  - C09: no `k2l04:rl:*` with TTL -1, no barrier.
  - C10: PG `post_count` = 1000 (`–` if absent; read-only).
- **Success:** a clean RED before any container exists.
- **Verify:** `bash $L/check.sh; echo rc=$?` → `✘ C01`, `– C02`, `– C03`, rc ≥ 1, no `command not found`

**T2.8 Negatives, rerun gate, widget smoke.**
- **Goal:** proof that the checks bite.
- **Target:** `negative-tests.sh`, `rerun-gate.mjs`, `widget-smoke.mjs`.
- **Steps:**
  1. Write 34 cases (case: planted fault → code); a missing target prints SKIP.
     - Guide (13): a edited `pre[data-cmd]` → V05; b fake `b.m` → V07; c `l06-` key → V09; d slide 14 dropped → V04; e slide 20 chip → V04; f external script → V10; f2 `data:` image → V10; q unescaped innerHTML → V19; s quiz `why` without run id → V11; u unknown quiz number → V16; x unlabelled input → V21; y `EVAL` in stage 1 → V12; z expected-row copy PART→FIX, guide unchanged → V04.
     - Labs (18): g corrupt replay → R13; h hand-edited run → M01; m deviation without entry → D01; r Lua byte → V18; t lab line edited after its run → V23; V17 for j `SET foo 1`, k `6380`, k2 `docker restart advance-be-redis`, k3 `-p 127.0.0.1:6379:6379`, l `-t incr`, n `EVAL` in `01-`, o `FLUSHALL` on main, p prune (word built from parts), v `UPDATE public.x`, w pgbench without `-n`, w2 `-i`, w3 `-c 16`, w4 `-T 10`.
     - Data (1): i fake number in `w3.json`. HW (2): bad fixture → ✘ H2/H4/H6; scaffold → ✘ H1.
  2. `rerun-gate.mjs`:
     - skip pgbench, crash, cpu and `03-live`;
     - mask numbers in INFO, MEMORY, benchmark, pgbench, `time` and `cho=` lines;
     - compare replay, HLL, Bitmap and Bloom lines exactly;
     - support `.sql`.
  3. `widget-smoke.mjs`:
     - W1 slots equal the `01-cluster.keyslot` run;
     - W3 `.ok` counts equal `cho_qua`;
     - W4 decisions equal the recorded rows;
     - W8 fp lies inside `#w8-band`.
- **Success:** all three parse.
- **Verify:** `bash -n $P/verify/negative-tests.sh && node --check $P/verify/rerun-gate.mjs && node $P/verify/widget-smoke.mjs --help; echo rc=$?` → `rc=0`

**T2.9 Red-first run.**
- **Goal:** each checker is RED for the right reason.
- **Target:** `$P/verify/fixtures/{x.redis,multi.redis,bad.sql}` (keys `k2l04:fx:*`).
- **Steps:**
  1. Run the matrix below on a temporary smoke container, started as in T1.3.
  2. Stop the container and delete the fixture runs and their manifest lines.
- **Success:** each row as stated.
- **Verify:** `node $P/verify/verify-guide.mjs --runs 2>&1 | grep -c 'missing run'` → `58` (57 if S10 = no)

## Test matrix
| Test | Expected now | Command |
|---|---|---|
| model, selftest, guard, check | as in T2.2, T2.4, T2.6, T2.7 | those Verify lines |
| runs before experiments | RED ×58 | T2.9 |
| MULTI fixture | `QUEUED`, `EXEC`, < 10 s | `node $P/verify/run-lab.mjs $P/verify/fixtures/multi.redis --region a --ct advance-be-k2l04-smoke` |
| `.sql` guard | rc 2 | `node $P/verify/run-lab.mjs $P/verify/fixtures/bad.sql --region a` |
| manifest replace | 1 line after 2 runs | `grep -c 'x.a.txt' $P/runs/manifest.tsv` → `1` |

## Risks and rollback
If stdin pacing misbehaves, the fallback (one `redis-cli` call per step) is chosen through the Failure Protocol. Rollback: delete the new files.

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

