---
phase: 5
title: "Widget data, homework with self-check, guard drill, source claims"
status: pending
priority: P1
effort: 1.25h
dependencies: [4]
---

# Phase 05 — Widget data, homework, claims

## Goal
Produce the data the fragments read, a homework with a self-check that a bad fixture fails, and sourced claim lists.

## Files to create/modify (owner: controller)
- **Plan folder:** `verify/make-widget-data.mjs`, `runs/data/*`, `verify/hw-bad-fixture.lua`, `runs/drill-claims.txt`, `runs/source-claims.txt`.
- **Labs:** `hw/token-bucket.lua` (scaffold), `hw/solution.lua`, `hw-check.sh`, `drill/rate-limit.guard.ai-snippet.ts`.
- There is no `package.json`: the homework is Lua, the check is bash, and the drill is read-only.

## Tasks

**T5.1 Widget and derived data.**
- **Goal:** JSON taken only from runs.
- **Target:** `make-widget-data.mjs`, `runs/data/*`.
- **Steps:**
  1. Widget files: w1 slot pairs; w2 race timelines; w3 all 6 replays (rows + summaries, constants parsed from command lines); w4 counter rows; w5 rtt medians, over-admit, `cho=`, bytes; w6 PG tps, Lock samples, Redis medians, layout bytes; w7 fan-out/pointer costs; w8 HLL and Bloom; w9 pool timeline.
  2. `derived.json` entries `{name, value, formula, inputs, sources}`: benchmark medians, `r06_cpu_util`, `r07c_bytes_per_key`, `r16d_token_ratio`, `r16e_served_10s` (10 − 2 + 10 = 18), `r20_*_hot_ratio`, `r22_bpp_*`, `r25_fanout_10m_s` (labelled extrapolation), `r35_err_pct_*`, set/HLL and set/Bloom ratios, `d19_shards_1m`.
- **Success:** every number appears in a source run.
- **Verify:** `node $P/verify/make-widget-data.mjs && node $P/verify/verify-guide.mjs --data; echo rc=$?` → `rc=0`; `bash $P/verify/negative-tests.sh --data-only | tail -1` → starts `1/1`

**T5.2 Homework (FR-M2-05 shape).**
- **Goal:** Đạt writes the key decisions himself; the checker decides.
- **Target:** `$L/hw/*.lua`, `$L/hw-check.sh`, `$P/verify/hw-bad-fixture.lua`.
- **Steps:**
  1. Contract: KEYS[1] = `k2l04:hw:tb:{<storeId>}` (`tokens`, `last_ms`). ARGV: capacity, refill/s, optional `now_ms` (else `TIME`). Return `{allowed, floor(tokens), retry_after_ms}`.
  2. Write the 50/50 scaffold with 8 blanks `__1__…__8__`:
     1. `TIME` fallback
     2. init
     3. clamp
     4. capped refill
     5. allow condition
     6. retry formula
     7. monotonic `last_ms`
     8. `PEXPIRE`
  3. `hw-check.sh` (tool script):
     - Load `$HW_LUA` with `docker exec -i advance-be-k2l04-redis redis-cli -x SCRIPT LOAD`, print the lua hash, reset `k2l04:hw:*`.
     - Checks (T0 = 1000000): H0 loads; H1 30 calls (cap 10, rate 0.01) → exactly 10/20; H2 every denial retry > 0, first in [99000, 100000]; H3 T0+29+100000 allowed, next denied; H4 a call at last−100000 keeps tokens ≥ 0 and `last_ms`; H5 another store unaffected; H6 `PTTL` ∈ (0, 1e6]; H7 2 parallel loops × 15 (`TIME` form) → exactly 10; H8 `TIME` form returns 3 fields. Exit = ✘ count.
  4. Bad fixture: no clamp, `last_ms=now`, retry 0, no `PEXPIRE`.
  5. Record `hw-check.solution`, `.bad` and `.scaffold`.
- **Success:** H01–H03 pass.
- **Verify:** `node $P/verify/verify-guide.mjs --runs --only-rows H01,H02,H03; echo rc=$?` → `rc=0`; `bash $P/verify/negative-tests.sh --hw-only | tail -1` → starts `2/2`

**T5.3 Optional guard drill and claims.**
- **Goal:** a small drill with sourced claims.
- **Target:** the drill file and the two claims files.
- **Steps:**
  1. ~70-line NestJS 10 `CanActivate` guard, node-redis 6.3.0, `redis://127.0.0.1:6381`. Seeded mistakes: `INCR` then `EXPIRE`, in-memory `Map`, fixed window on login, no `Retry-After`, `KEYS`, Redis error → 500. Decoy: per-`storeId` hashtag key.
  2. `drill-claims.txt`: URL, version, quote per API (`createClient`, `on('error')`, `evalSha`, `set` NX/PX) from GitHub raw `redis@6.3.0` or unpkg, never `node_modules`.
  3. `source-claims.txt`: `pubsub.c` 7.2.3, `config.c` (maxclients, listpack 512), Redis FAQ, HLL page, Bloom formula, Cloudflare post, Hazelcast, Pika, Grab.
- **Success:** every claim is sourced.
- **Verify:** `grep -c '^https' $P/runs/drill-claims.txt` ≥ `5`; `grep -c '^https' $P/runs/source-claims.txt` ≥ `9`

## Test matrix
| Test (first) | Expected | Command |
|---|---|---|
| solution | ✔ H0–H8 | `bash $L/hw-check.sh` |
| bad fixture | ✘ H2, H4, H6 only | `HW_LUA=$P/verify/hw-bad-fixture.lua bash $L/hw-check.sh` |
| blank scaffold | ✘ H1 | `HW_LUA=$L/hw/token-bucket.lua bash $L/hw-check.sh` |

## Risks and rollback
An unfindable quote is `[UNVERIFIED]` → Failure Protocol. Rollback: delete the files.

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

