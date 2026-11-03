---
phase: 4
title: "Stages 5–8 labs and recorded runs"
status: pending
priority: P1
effort: 2.75h
dependencies: [3]
---

# Phase 04 — Stages 5–8

## Goal
Record every remaining row, with Postgres writes inside `k2l04_counter` and bounded load.

## Files to create/modify (owner: controller; runs serial)
- **`$L/` stage files:** `05-counter-pg.sql`, `05-counter.{sh,redis}`, `pg/{hot-row,spread}.pgbench`, `pg/waits.sql`, `06-unread.{sh,redis}`, `07-share.{A,B}.sh`, `07-share.redis`, `07-share.{A,B}.redis` (only if S10 = yes), `08-delay.{A,B}.{sh,redis}`, `08-hll.sh`, `08-bitmap.sh`, `08-bloom.sh`, `08-practices.redis`.
- **Lua:** `lua/{flush-take,delay-claim,bloom}.lua`.
- **Plan folder:** `record-all.sh` (`s5 s6 s7 s8 gates`), `runs/*`.

## Regions
- **`05-counter-pg.sql`** (DBX for Đạt, psql mode for the controller):
  - `setup`: create schema and `k2l04_counter.post_count(post_id PK, like/comment/share/view_count bigint default 0)`; insert 1–1000 `ON CONFLICT DO NOTHING`; reset to 0; `SELECT count(*) so_dong, sum(like_count) tong_like`.
  - `read`: the slide 20 SELECT.
  - `stats`: `n_tup_upd`, `n_tup_hot_upd`, `n_dead_tup`.
  - `kiem-chung`.
- **pgbench scripts:**
  - `pg/hot-row.pgbench`: `UPDATE k2l04_counter.post_count SET like_count = like_count + 1 WHERE post_id = 1;`
  - `pg/spread.pgbench`: `\set pid random(1, 1000)` plus the same UPDATE with `:pid`.
- **`pg/waits.sql`:** counts of `wait_event_type='Lock'` vs other, plus `string_agg` of wait events, for `application_name='k2l04-pgbench'`, labelled `mau`.
- **`05-counter.sh`**
  - `pg-burst` (`--timeline`), variants `hot`, `spread` (`--random-seed=42`), `hot-async` (`-e PGOPTIONS='-c synchronous_commit=off'`), each: reset; background sampler `(sleep 1; for i in 1 2 3 4; do docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -At < labs/k2-lesson-04-caching/pg/waits.sql; sleep 0.3; done) &`; `MSYS_NO_PATHCONV=1 docker exec -i -e PGAPPNAME=k2l04-pgbench quan-ly-hop-dong-postgres-1 pgbench -n -f /dev/stdin -c 8 -T 3 -U postgres advance_be_lab < labs/k2-lesson-04-caching/pg/<f>.pgbench` (or S11b form); `wait`; `SELECT sum(like_count)`.
  - `redis-incr`: 3× `redis-benchmark -q -c 8 -n 20000 INCR k2l04:cnt:post:1` and 3× `HINCRBY k2l04:cnt:post:1:h like 1`; read both.
  - `flush`: `seq|awk` → `HINCRBY k2l04:cnt:delta` (post 1 ×120, 2 ×30, 3 ×5); `D=$(MSYS_NO_PATHCONV=1 docker exec … redis-cli --eval /lab/lua/flush-take.lua k2l04:cnt:delta | xargs)`; awk builds one `UPDATE … FROM (VALUES …)` piped to psql; SELECT rows 1–3; `EXISTS` delta.
  - `crash`: first line `echo "→ advance-be-k2l04-crash"`; `FLUSHALL`; 50× `HINCRBY`; `HGET`; `docker kill`/`docker start advance-be-k2l04-crash`; `PING` wait; `HGET`; `DBSIZE`.
  - `memory-layouts`: 1000 posts as 4 strings / 1 hash / buckets of 100 / of 200, `used_memory` after each; `OBJECT ENCODING`; `CONFIG GET hash-max-listpack-entries`.
- **`06-unread.sh`**: `fanout` N = 1e4, 1e5: `used_memory`, `time (seq 1 N | awk '{print "INCR k2l04:unread:u:" $1}' | … --pipe)`, `used_memory`. `pointer`: `SET k2l04:unread:seq 6`, `ZADD k2l04:unread:ptr 4 uA`, echo `unread_uA=$((seq−score))`, `INCR`, echo, `ZADD GT 7`, `ZADD GT 5`, `ZSCORE`. `memory`: 100000 `ZADD`, bytes, encoding.
- **`07-share.{A,B}.sh#pool`**: B barrier, `BLPOP k2l04:share:req 5`, sleep 1, `SET k2l04:share:resp:m1 '{"ok":1}' EX 30`, `BLPOP`, sleep 1, `RPUSH k2l04:share:reply:m2 …`, `EXPIRE 30`. A barrier, `RPUSH … m1`, in-container poll loop (≤ 15 × 0.2 s, `poll $i: $v`), `RPUSH … m2`, `BLPOP k2l04:share:reply:m2 5`. `07-share.redis#ttl`: `EX 30`, `TTL`, `PEXPIRE 100`, sleep 0.3, `EXISTS`.
- **`08-delay.{A,B}.sh#claim`**: L06 design on `k2l04:delay:{orders,done}`; reset seeds `o1` 1704790435, `o2`/`o3` 4102444800; `delay-claim.lua` uses `TIME`; B sleeps 0.2; `.redis#naive` optional.
- **`08-hll.sh`**: `accuracy` N = 1e3…1e6 `PFADD k2l04:hll:n:N ip1…ipN` (`--pipe`), `echo "N=$N PFCOUNT=…"`; `memory` N = 1, 100, 1000, 3000, 1e4, 1e5 with `STRLEN`/`MEMORY USAGE`, `GETRANGE 0 3`, a 1e5 Set; `merge` day d = ip 5000(d−1)+1…+10000, `PFMERGE k2l04:hll:week`, `PFCOUNT`.
- **`08-bitmap.sh`**: `genres` bits i%3 (`fiction`), i%5 (`adventure`) over 1…1e6, `BITCOUNT`, `BITOP AND`, `STRLEN`, `GETBIT`; `sparse` `SETBIT k2l04:bm:sparse 9999999 1`, `STRLEN`, `MEMORY USAGE`, `BITCOUNT`.
- **`08-bloom.sh`**: `probes` SHA via `SCRIPT LOAD`; `EVALSHA $SHA 1 k2l04:bloom:users add 50000 3 u$i` for 1…10000 (`--pipe`); `check` members → `members_hit=`; probes `x1…x10000` → `fp=`; `BITCOUNT`. `memory`: Bloom vs Set bytes.
- **`bloom.lua`**: `h=redis.sha1hex(item)`; `pos=tonumber(string.sub(h,8j+1,8j+8),16)%m` for j < k; `add` → `SETBIT`; `check` counts all-ones.
- **`flush-take.lua`**: `HGETALL` + `DEL` (an atomic read-and-reset).

## Tasks

**T4.1 PG setup with schema gate.**
- **Goal:** only `k2l04_counter` is created.
- **Target:** `05-counter-pg.sql`.
- **Steps:**
  1. `bash $P/verify/fingerprint.sh | grep '^pg_' > $P/verify/tmp/pg-before.txt`.
  2. Run `setup`.
  3. Write the after-file the same way.
- **Success:** R05s passes; nothing else changed.
- **Verify:** `diff $P/verify/tmp/pg-before.txt $P/verify/tmp/pg-after.txt; echo rc=$?` → `rc=0`; `--runs --only-rows R05s` → rc 0

**T4.2 Stage 5.**
- **Goal:** the counter rows.
- **Target:** stage 5 files.
- **Steps:**
  1. `bash $L/00-containers.sh up crash`.
  2. `record-all.sh s5`, with `stats` right after `pg-burst`.
  3. `down crash`.
- **Success:** the rows pass.
- **Verify:** `node $P/verify/verify-guide.mjs --runs --only-rows R20,R20b,R21,R21b,R22,R22b; echo rc=$?` → `rc=0`. Pre-authorised exception <!-- must-fix 5 -->: if only R20's throughput relations (`spread ≥ 1.5 × hot`, `async ≥ 2 × hot`, `hot Lock samples ≥ 4`) miss, set R20 `status=deviation`, add a `verify/deviations.md` entry quoting the recorded numbers, change the narrative/chip, and re-run; `rc=0` is then required. Any other miss follows the Failure Protocol.

**T4.3 Stage 6.**
- **Goal:** the unread rows.
- **Target:** stage 6 files.
- **Steps:** `record-all.sh s6`.
- **Success:** the rows pass.
- **Verify:** `--runs --only-rows R25,R25b,R25c` → `rc=0`

**T4.4 Stage 7.**
- **Goal:** the share rows.
- **Target:** stage 7 files.
- **Steps:** `record-all.sh s7` (pool `--rep 3`, `ttl`, and `tracking` if S10 = yes).
- **Success:** the rows pass.
- **Verify:** `--runs --only-rows R28,R29,R29b` → `rc=0`

**T4.5 Stage 8.**
- **Goal:** the practices rows.
- **Target:** stage 8 files.
- **Steps:** `record-all.sh s8`.
- **Success:** the Bloom numbers equal `ref-model`.
- **Verify:** `--runs --only-rows R34,R34b,R35,R35b,R35c,R36,R36b,R37,R37b` → `rc=0`

**T4.6 All gates.**
- **Goal:** everything clean.
- **Target:** `record-all.sh gates`.
- **Steps:** run, in order:
  1. full `--runs`
  2. `--lint`
  3. the rerun gate
  4. `check.sh` (C10 ✔)
  5. the kiem-chung runs
  6. the fingerprint `--compare`
  7. the lab negatives
- **Success:** all GREEN, 0 SKIP.
- **Verify:**
  - `node $P/verify/verify-guide.mjs --runs; echo rc=$?` → `rc=0`
  - `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`
  - `bash $P/verify/negative-tests.sh --labs-only | tail -1` → starts `18/18`, contains `0 SKIP`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| schema gate | identical | T4.1 |
| pgbench bounds | cases w–w4 RED | `negative-tests.sh --labs-only` |
| statistics | exact or in band | T4.5 |
| HLL/Bloom deterministic | rerun identical | `node $P/verify/rerun-gate.mjs --only 08-` |

## Risks and rollback
A failed pgbench ratio keeps its data (Failure Protocol). Rollback: `99-cleanup.sql`, `down crash`, delete stage 5–8 files and runs.

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

