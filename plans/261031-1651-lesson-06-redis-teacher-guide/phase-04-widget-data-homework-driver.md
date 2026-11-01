---
phase: 4
title: "Widget data, homework, driver claims"
status: completed
priority: P1
effort: 0.75h
dependencies: [3]
---

# Phase 04 — Widget data, homework, driver claims

## Goal
Produce every data file the fragments read, a homework with a runnable self-check, and a sourced claim list for the Node driver drill.

## Files to create/modify (owner: controller)
- Plan folder: `runs/data/w1.json` … `w9.json`, `runs/data/derived.json`, `runs/driver-claims.txt`, `verify/hw-bad-fixture.mjs`. <!-- red-team #9 -->
- `D:/study/advance-be/labs/lesson-06-redis/`: `package.json` (`"type":"module"`, `redis` `^6.3.0` like lesson 02, scripts `hw`, `hw:check`), `hw-check.sh`, `hw-solution.mjs`, `driver-drill.ai-snippet.ts`.

## Tasks and steps
1. Widget data. Each file has `sources: ["<run id>", …]`, and every number in it is a token in a source run.
   - `w1`: `01-block.sleep.timeline` points (A send/end, B send/reply, host-ms).
   - `w2`: threshold table from `02-encodings.*`.
   - `w3`: `03-expiry.active` before/after stats.
   - `w4`: survivor counts per policy, plus `BASE`/`MAX` per run.
   - `w5`: DBSIZE before kill / after start per mode.
   - `w6`: `CLUSTER KEYSLOT` pairs.
   - `w7`: partition step values, offsets and the reconnect poll count.
   - `w8`: the five lock timelines (`08-lock.{nolock,nx,ttldel}`, `08-lock-lua.{cad,fencing}`).
   - `w9`: `bucket30` rows.
   - `derived.json`: computed values that appear in no run, each `{name, value, formula, inputs, sources}`: R05 MB/s for small and big (req/s × bytes / 1048576), R06 keys/s for GET and MGET (req/s × keys per call), and the R04/R06 ratios. Guide cells cite them with `b.m[data-derived="<name>"]`. <!-- red-team #9 -->
2. Homework (slide 43, seat `A34_S012C`, flight `FA634`, no DB). <!-- red-team #13 -->
   - Contract (written into the guide's `#bai-tap` and the top of `hw-check.sh`):
     - Keys: lock `l06:hw:lock:FA634:A34_S012C`; booking log list `l06:hw:bookings:FA634` (a successful booking does `RPUSH l06:hw:bookings:FA634 "A34_S012C <token>"`); event log `l06:hw:log` (`RPUSH` `BOOKED <token>` / `REJECTED <token>`).
     - Inputs the program must honour (env): `HW_TTL_MS` (lock TTL in ms, default 2000) and `HOLD_MS` (how long the holder "works" before releasing, default 100). `REDIS_URL` default `redis://127.0.0.1:6379` (not `localhost`; addendum item 4).
     - Any language works. `HW_CMD` fires the two concurrent requests.
   - `hw-check.sh` (tool script: `export MSYS_NO_PATHCONV=1`, `HERE=` line) does all reset, assert and cleanup through `docker exec advance-be-redis redis-cli`. It first checks C15 (`run_id` over `127.0.0.1` equals `docker exec`) and aborts on a mismatch. It resets `l06:hw:*`, runs `$HW_CMD` for `--rounds 10` (default `node hw-solution.mjs`), and prints:
     - H1: `LLEN l06:hw:bookings:FA634` grows by exactly 1 per round (the log list, not the single key);
     - H2: `l06:hw:log` gets 1 `BOOKED` and 1 `REJECTED` per round;
     - H3: no lock key left;
     - H4: the two tokens differ;
     - H5: release is compare-and-delete. Round 11 runs with `HW_TTL_MS=50 HOLD_MS=200`: holder 1's lock expires while it works, holder 2 acquires, holder 1 releases, and holder 2's token must still be in the lock key.
   - `hw-solution.mjs` (node-redis, about 50 lines, Vietnamese comments) uses `SET NX PX $HW_TTL_MS` + `randomUUID` + an `EVAL` release, and waits `HOLD_MS` while holding.
   - `verify/hw-bad-fixture.mjs` does GET-then-SET with a 50 ms gap and releases with `DEL`. Expected: ✘ H1 (2 bookings in a round), ✘ H2 (2 `BOOKED`), ✘ H5 (its `DEL` removes holder 2's lock); H3 and H4 ✔. plan.md R47b states the same. <!-- red-team #13 -->
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
   - One correct decoy: `SET … NX` with expiry options. The snippet's client URL is `redis://127.0.0.1:6379`.
   - `runs/driver-claims.txt`: for every API claim the drill makes (option names for SET, `multi()`/pipelining, `on('error')`, `disableOfflineQueue`, `eval`/`sendCommand`), record the URL (redis.io docs, `github.com/redis/node-redis` docs, or `unpkg.com/@redis/client@<version>/dist/...d.ts`), the version and the quoted line. Redis-behaviour claims point to stage run ids.

## Test matrix
| Test (first) | Expected | Command |
|---|---|---|
| widget data traced | GREEN (w1–w9 and derived.json) | `node verify/verify-guide.mjs --data` |
| negative i (fake 999999 in w4) | RED | `bash verify/negative-tests.sh --data-only` |
| homework solution | 5/5 ✔ for 10 rounds + round 11 | `cd labs/lesson-06-redis && npm run hw:check` |
| bad fixture | ✘ H1, H2, H5; ✔ H3, H4 <!-- red-team #13 --> | `HW_CMD="node ../../plans/261031-1651-lesson-06-redis-teacher-guide/verify/hw-bad-fixture.mjs" bash hw-check.sh` |
| hw keys cleaned | `0` after `hw-check --cleanup` | `docker exec advance-be-redis redis-cli --scan --pattern 'l06:hw:*' \| wc -l` |
| driver claims | each claim has URL + version + quote | `grep -c '^https' runs/driver-claims.txt` ≥ claim count |

## Verification
The commands above plus `node --check labs/lesson-06-redis/hw-solution.mjs`.

## Risks and rollback
- If `redis@^6.3.0` resolves differently from lesson 02, pin the version lesson 02's lockfile names, read from `package-lock.json` metadata only.
- Rollback: delete the new files and `labs/lesson-06-redis/node_modules`.
