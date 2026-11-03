=== FILE: plan.md ===
---
title: "K2 Bài 04 Caching teacher guide (rate limit, counters, practices; measured on Redis 7.2.3 and PG 16.15)"
description: "Vietnamese single-file guide for K2 Bài 04: 39 slides, 8 stages, one rate-limit trace replayed through six Lua limiters, PG hot row vs Redis, every number from a recorded run on K2L04-owned containers."
status: pending
priority: P1
effort: 16.5h
branch: main
tags: [k2-lesson-04, caching, rate-limit, redis, lua, postgres, teacher-guide, tdd, advice]
blockedBy: []
blocks: []
created: 2026-11-02
---

# K2 Bài 04 — Caching teacher guide

## Overview

This plan builds one Vietnamese single-column guide (no rail) that Đạt studies after L06, around 2026-11-04, in 290 core minutes. All 39 slides map once; the 27 claim slides carry chips backed by runs on K2L04-owned containers (and schema `k2l04_counter` for slides 20–21). The core is rate limiting: one fixed `traffic.tsv` (60 requests, 2 stores, 4 acts) is replayed through six Lua limiters with caller-supplied `now_ms`, so the comparison is exact and immune to the Docker VM clock, while short live demos show real-time behaviour. L06's tooling is copied and adapted, and `check.sh`, the frozen `expected.tsv` and the verifier exist before any experiment or HTML. Work stays on `main`, uncommitted.

**Conventions**

- Git Bash, cwd `D:/study/advance-be`; `P=plans/261102-1332-k2-lesson-04-caching-teacher-guide`, `L=labs/k2-lesson-04-caching`, `G="reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html"`.
- Main `advance-be-k2l04-redis` on `127.0.0.1:6381`→6379; unpublished extras `advance-be-k2l04-cluster`, `advance-be-k2l04-crash`; network `advance-be-k2l04`; volumes `advance-be-k2l04-{redis,cluster,crash}-data`.
- Postgres only via `docker exec -i quan-ly-hop-dong-postgres-1 psql|pgbench -U postgres -d advance_be_lab`, writing only in `k2l04_counter`. Keys `k2l04:`; storage `k2l04-`. Controller = main session; D0–D3 = delegates; only `git status`.

## Data flow

Containers + seed (+ DBX `05-counter-pg.sql#setup`) → lab regions (`.redis`/`.sh`/`.sql`, `lua/`, `pg/`, `traffic.tsv`) → `verify/run-lab.mjs` (L06 runner + psql mode, one-step `MULTI…EXEC`, `# đồng hồ` clock line, `# lua` hashes) → `runs/*.txt` + `manifest.tsv` (one sha256 per file) → `--runs` against `expected.tsv` (exact numbers from `ref-model.mjs`) → `make-widget-data.mjs` → `runs/data/*.json` → D0 shell + D1–D3 fragments against `contract.md` → `assemble.mjs` → `G` → verifier, negatives, widget smoke, render, ultra review, docs, handoff. `fingerprint.sh` runs at phases 01, 03, 04, 10.

## Stage map (core cap 300 min)

| Stage | Slides | Topic | Core | Opt | Widget |
|---|---|---|---|---|---|
| `#cach-hoc` | 1–3 | setup, DBX 6381, Git Bash, glossary | 15 | – | – |
| 1 | 4–11 | use cases, cons, slide 7 numbers, cluster slots | 35 | 10 | W1 |
| 2 | 33 | race, WATCH abort, Lua basics | 30 | 3 | W2 |
| 3 | 12–14 | fixed window, sliding log, sliding counter | 40 | 5 | W3, W4 |
| 4 | 15–16 | leaky, token bucket, batch, 429, fail-open | 45 | 5 | W5 |
| 5 | 17–22 | PG hot row vs Redis, flush, layouts | 40 | 5 | W6 |
| 6 | 23–25 | unread fan-out vs pointer | 20 | 3 | W7 |
| 7 | 26–30 | message pool, poll vs `BLPOP` | 20 | 8 | W9 |
| 8 | 34–37 | delay ZSET, HLL, Bitmap, Bloom | 40 | 8 | W8 |
| wrap | 31, 32, 38, 39 | recap, homework, refs, bridge | 5 | 45 (evening) | – |
| **Total** | 39 | | **290** | **47+45** | |

"Nếu còn sức" order: `04-tb-race.naive` → `07-share.tracking` (if S10 = yes) → `01-fundamentals.bandwidth` → `08-delay.naive` → Bloom k-sweep → slide 6 source fold → HOT-stats fold. Stages 3–5 are never optional. L06 overlaps each have a core run: token bucket `04-tb-race.claim` + `04-replay.token`; delay `08-delay.claim`; cluster `01-cluster.*`; race `02-race.*`.

## Phases

| # | Phase | Effort | Depends | Gate |
|---|---|---|---|---|
| 01 | [Contract, baseline, smoke](phase-01-contract-baseline-smoke.md) | 0.75h | – | fingerprint rc 0; S1–S13 |
| 02 | [Tests first](phase-02-tests-first.md) | 2.5h | 01 | model, selftest rc 0; `--runs` RED ×58 |
| 03 | [Containers, stages 1–4](phase-03-containers-stages-1-4.md) | 3h | 02 | K01–R16g GREEN; lint, fingerprint |
| 04 | [Stages 5–8](phase-04-stages-5-8.md) | 2.75h | 03 | all run rows GREEN |
| 05 | [Data, homework, claims](phase-05-widget-data-homework-claims.md) | 1.25h | 04 | `--data`; H01–H03 |
| 06 | [Shell, assembler (D0)](phase-06-shell-assembler.md) | 1h | 02 ∥ 03–05 | page checks on stub |
| 07 | [Fragments (D1–D3)](phase-07-stage-fragments.md) | 2.25h | 05, 06 | `--fragment` ×8 |
| 08 | [Assemble, verify, render](phase-08-assemble-verify-render.md) | 1h | 07 | verify, 34/34, render 0/0/0 |
| 09 | [Ultra review, fixes](phase-09-ultra-review-fixes.md) | 1.5h | 08 | 0 OPEN |
| 10 | [Docs, gate, handoff](phase-10-docs-final-gate-handoff.md) | 0.5h | 09 | final gate ✔ |

## Expected-result matrix

This matrix is frozen into `verify/expected.tsv` in phase 02, with columns `id run slides regex claim chip status`.

- Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`; platform in the note ("đo trên PG 16.15", "đọc mã nguồn 7.2.3", "chưa đo trực tiếp"). Design rows (`D..`) have `run` = `-`.
- Timed rows need "clock ok" (header `# đồng hồ … → ok`) and "3× sane" (three values in (0, 5e6), median taken, labelled "phụ thuộc máy").
- "s7 a/d · m · w" = `tong s7 cho_qua=a tu_choi=d toi_da_10s=m cho_lau_nhat_ms=w` (m = max processing starts, ts + wait, in any (t−10000, t]); "acts" = the `man` lines.

| ID | Run | Slide | Expected | Chip |
|---|---|---|---|---|
| K01 | check.after-seed | – | all ✔/`–` | – |
| K02 | check.rerun | – | = K01 | – |
| D04 | – | 4 | design: cache layers, link `4_layers_cache_overview.html` | OK |
| R05 | 01-fundamentals.bench-get | 5 | 3× sane `GET k2l04:bench:k`, p50 < 1 ms | OK |
| R06 | 01-fundamentals.cpu | 6 | main-thread CPU ÷ real ∈ [0.5, 1.15] under `--threads 4 -P 16`; `io-threads` 1; UNSUBSCRIBE via source note | OK |
| R07 | 01-fundamentals.maxclients | 7 | `maxclients` 10000; `ulimit -n` ≥ 10032; 2^32 = FAQ wording | PART |
| R07b | 01-fundamentals.bench-set | – | 3× sane `SET k2l04:bench:k v` | – |
| R07c | 01-fundamentals.keys-memory | – | 100000 SET: Δmemory/key ∈ [40, 200] B; DBSIZE restored | – |
| R07d | 01-fundamentals.bandwidth | – | rps(16 B) ≥ 3 × rps(100 KB) | – |
| R08 | 01-cluster.keyslot | 8 | `cluster_state:ok`, 16384 slots, 1 node; failover "chưa đo trực tiếp" | PART |
| R09 | 01-cluster.keyslot | 9 | `{42}` pair same slot; `{s7}` pair same slot | OK |
| R09b | 01-cluster.crossslot | – | untagged `MGET` → `CROSSSLOT`; tagged → 2 values | – |
| D11 | – | 11 | design: recap → K1 L02, L06 | OK |
| R33a | 02-race.getset.timeline | – | both read `"1"`; redeemed A, B | – |
| R33 | 02-race.watch.timeline | 33 | B `DECR` ≥ 400 ms after A `GET`; A `EXEC` → `(nil)`; stock `"0"`; redeemed B | OK |
| R33b | 02-lua.voucher | – | lua hash; 1 then 0; `LLEN` 1 | – |
| R33c | 02-lua.basics | – | `return 3.7` → `(integer) 3`; `tostring` → `"3.7"`; `TIME` 2 items | – |
| R13a | 03-window.incr-expire-bug | – | `INCR` 1; `TTL` -1 | – |
| R13b | 03-window.set-nx-incr | – | `OK`, 1, TTL 9–10, `(nil)`, 2 | – |
| R13 | 03-replay.fixed | 13 | s7 33/5 · 10 · 0; acts 10/11, 10/14, 5/5, 8/8; s8 22/0 · 1 · 0 | OK |
| R13c | 03-live.fixed-boundary.timeline | – | bursts reply 2–5 then 1–6 within ≤ 1500 ms host; clock ok | – |
| R14b | 03-replay.log | – | s7 24/14 · 5 · 0; acts 5/11, 6/14, 5/5, 8/8 | – |
| R14 | 03-replay.counter | 14 | s7 26/12 · 9 · 0; acts 6/11, 9/14, 5/5, 6/8; row 10000: est `6`, retry 2000 | PART |
| R14c | 03-replay.compare | – | `khac_fixed_interval=0 counter_qua_log_chan=5 counter_chan_log_qua=3` | – |
| R15 | 04-replay.leaky | 15 | s7 32/6 · 5 · 10000; acts 8/11, 11/14, 5/5, 8/8; row 10000 wait 8750 | OK |
| R15b | 04-leaky.worker.timeline | – | offers 1×6, 0, 0; r1…r6 in order; `cho=` rising; clock ok | – |
| R16 | 04-replay.token-interval | 16 | = R13 (slide 16 as drawn is a fixed window) | PART |
| R16a | 04-replay.token | – | s7 30/8 · 9 · 0; acts 7/11, 10/14, 5/5, 8/8; row 10000 retry 750 | – |
| R16b | 04-tb-race.claim.timeline | – | `TIME` form; A 1; B 0, retry 1000000 | – |
| R16c | 04-tb-race.naive.timeline | – | both `GET` `"1"`, both `SET` 0 | – |
| R16d | 04-batch.rtt | – | `-c 1` `EVALSHA` 3× sane, cost 1 and 10; median10 × 10 ≥ 5 × median1 | – |
| R16e | 04-batch.over-admit | – | `kieu1 cho_qua=12 tren 22`; batch replies `1 0 0`, `1 0 0`, `0 0 9990` | – |
| R16f | 04-replay.memory | – | token hash ≤ 120 B; log(1000) `skiplist` > log(5) | – |
| R16g | 04-contract.fail-open | – | `Connection refused`; `fail-open: cho qua`; `fail-closed: tra 503` | – |
| D19 | – | 19 | design: NFRs → stage 5; shard estimate "chưa đo trực tiếp" | OK |
| R05s | 05-counter-pg.setup | – | `so_dong` 1000, `tong_like` 0 | – |
| R20 | 05-counter.pg-burst | 20 | hot, spread, async: failed 0; sum = processed; spread ≥ 1.5 × hot tps; async ≥ 2 × hot; hot Lock samples ≥ 4; clock ok | PART |
| R20b | 05-counter-pg.stats | – | `n_tup_upd` ≥ processed | – |
| R21 | 05-counter.flush | 21 | take `1 120 2 30 3 5`; `UPDATE 3`; rows match; delta gone | PART |
| R21b | 05-counter.crash | – | 50 before `docker kill`; empty after, `DBSIZE` 0 | – |
| R22 | 05-counter.memory-layouts | 22 | bytes/post strings > hash > bucket-100 (listpack); bucket-200 hashtable > 2× bucket-100; 512 | PART |
| R22b | 05-counter.redis-incr | – | `-c 8` INCR/HINCRBY 3× sane; final 60000 | – |
| D24 | – | 24 | design: requirements | OK |
| R25 | 06-unread.fanout | 25 | N 1e4, 1e5: `errors: 0, replies: N`; real grows | OK |
| R25b | 06-unread.pointer | – | `unread_uA=2`, then 3; `GT` keeps `"7"` | – |
| R25c | 06-unread.memory | – | 100000-member ZSET bytes, `skiplist` | – |
| D27 | – | 27 | design: reply channel needed | OK |
| R28 | 07-share.pool.timeline | 28 | B answers `m1` with `EX 30`; A reads it | OK |
| R29 | 07-share.pool.timeline | 29 | ≥ 3 empty polls; hit ≤ 400 ms after `OK`; `BLPOP` ≤ 150 ms after `RPUSH`; clock ok | PART |
| R29b | 07-share.ttl | – | TTL 30; gone after `PEXPIRE 100` | – |
| D30 | – | 30 | design: Hazelcast "chưa đo trực tiếp" | OK |
| R30b | 07-share.tracking.timeline | – | only if S10 = yes: `invalidate` | – |
| D31 | – | 31 | design: recap with measured caveats | PART |
| R34 | 08-delay.claim.timeline | 34 | done = `o1` once; `o2`, `o3` pending | OK |
| R34b | 08-delay.naive.timeline | – | both pollers push `o1` | – |
| R35 | 08-hll.accuracy | 35 | N 1e3–1e6: \|err\| ≤ 0.0244N (3σ of 0.81 %); 1e5 → 99655 | OK |
| R35b | 08-hll.memory | – | `HYLL`; sparse < 3000 B; dense 12304, `MEMORY USAGE` 14384; Set ≥ 100× | – |
| R35c | 08-hll.merge | – | week in 40000 ± 976 | – |
| R36 | 08-bitmap.genres | 36 | 333333, 200000, AND 66666; `STRLEN` 125000/125001 | PART |
| R36b | 08-bitmap.sparse | – | offset 9999999: 1250000 B, `MEMORY USAGE` 1310768 | – |
| R37 | 08-bloom.probes | 37 | members 10000/10000; `fp=953/10000` (theory 918.5, 3σ [832, 1005]); 22587 bits | OK |
| R37b | 08-bloom.memory | – | 6250 B; Set ≥ 20× | – |
| H01 | hw-check.solution | – | ✔ H0–H8 | – |
| H02 | hw-check.bad | – | ✘ H2, H4, H6 only | – |
| H03 | hw-check.scaffold | – | ✘ H1 | – |

There are 7 design rows and 58 run rows (57 if S10 = no).

- Null chips (frozen): 1, 2, 3, 10, 12, 17, 18, 23, 26, 32, 38, 39.
- PART slides that need `id="sl-NN"`: 7, 8, 14, 16, 20, 21, 22, 29, 31, 36.
- The exact replay, over-admit and Bloom values come from the planner's reference run of the phase 02 T2.4 semantics.

## Acceptance criteria

1. (P08) `G` ≤ 520 KB, no rail, no `<script src>`, no `data:` images, relative `04_Caching` image paths (V01, V10).
2. (P06, P08) SLIDES 1–39 once; null chips = frozen list; other chips = their chip rows (V04).
3. (P03, P07) Stage 2 (slide 33, Lua) precedes stages 3–4; no Lua in `00-*`/`01-*` or stage 1 (V12, V17).
4. (P07) Each stage 1–8: glossary first, story, diagram, stats, 30 s check, worked example, `kiem-chung` + `table.expect`, challenge with PASS, 4 quiz items citing runs (V11, V12).
5. (P05, P08) Every number traces to a run (V07, `--data`, V16, M01).
6. (P03, P04) Every run row matches or is a kongming-approved deviation with a `deviations.md` entry (D01).
7. (P03–P08) Run commands equal current regions (V23); Lua hashes match (V18).
8. (P03, P04) Lint V17 GREEN (rules in phase 02 T2.6).
9. (P03, P10) `check.sh` rc 0, identical after re-seed (K01, K02).
10. (P03, P04) Timed rows pass the clock line and 3× sane; labelled "phụ thuộc máy".
11. (P03, P04) R14c, R35, R35c, R37 exact or in band.
12. (P05) H01–H03 hold.
13. (P02, P08) Negatives 34/34, 0 SKIP.
14. (P08) Render 375/768/1440 light+dark 0/0/0; widget smoke ✔.
15. (P01–P04, P10) `fingerprint --compare` rc 0: baseline containers, L06 bind/volume/network, 0 `k2l04:*` on L06, PG schemas and other-schema writes unchanged.
16. (P09) 0 OPEN Critical/Important.
17. (P10) README, 3 curriculum copies, 2 L06 one-liners, handoff done; `git status` ⊆ allow-list; nothing committed.

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| VM clock ~8 % fast, steps back −2.8 s | H×H | `now_ms` replay; host-ms spans; clock line; 3× median; ≤ 3 re-records (rejects in `verify/tmp/rejected/`), then Failure Protocol |
| Đạt uses L06 main | H×L | nothing names it (V17, runner rc 2); fingerprint only reads |
| Load on foreign PG | M×H | `-c 8 -T 3 -n -f`, schema-qualified, schema/write gate |
| hot/spread < 1.5 | M×M | keep data; kongming decides deviation |
| `/dev/stdin` fails | L×M | S11b `/tmp` fallback |
| MULTI hang | M×M | one-step send; fixture |
| 6381 busy | L×M | refuse, print PID |
| > 520 KB | M×M | `@RUN head=N`, folds; V01 |
| invented numbers | M×M | V05–V07, V16, V23 |

**Rollback:**
- `bash $L/99-cleanup.sh --all` removes containers by exact name and their volumes; the network goes only when nothing is attached; no prune.
- `99-cleanup.sql` runs `DROP SCHEMA IF EXISTS k2l04_counter CASCADE`.
- Delete `$L`, `G` and the plan artifacts.
- Restore the doc one-liners from `verify/tmp/docs-before/`.

## Open questions for the user

None blocking. Confirm the budget (290 core + 47 optional + 45 evening homework); for a 4-hour day, stage 7 and the Bitmap become "nếu còn sức".

=== FILE: phase-01-contract-baseline-smoke.md ===
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
  3. Make `--compare` exit 1 on any of: a missing baseline line; a status change on a non-L06 line (an L06 flip is info only); a change to L06 bind, volume or network; `l06_k2l04_keys` ∉ {0, down}; `port6380_k2l04` ≠ none; any `pg_*` change.
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

=== FILE: phase-02-tests-first.md ===
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
     | **counter** | cur, prev | L W now | `est=prev(1−(now%W)/W)+cur`. If est+1≤L: `INCR`, `PEXPIRE 3W`, `{1,tostring(est+1),0,prev,cur}`; else `need=L−1−cur`, retry = need<0 ? (w+1)W+ceil(W(1−(L−1)/cur))−now : wW+ceil(W(1−need/prev))−now |
     | **token-bucket** | hash `tokens,last_ms` | cap rate cost=1 [now, else `TIME`] | new = full; `tokens=min(cap,tokens+max(0,now−last)·rate/1000)`; allow if ≥ cost, else `retry=ceil((cost−tokens)·1000/rate)`; `last_ms=max(last,now)`; `PEXPIRE ceil(cap/rate·1000)`; return `{allowed,floor(tokens),retry}` |
     | **token-interval** | hash `slot,tokens` | cap I now | refill on a new slot; deny with `(slot+1)I−now` |
     | **leaky** | ZSET + last | Q I now id | `ZREMRANGEBYSCORE −inf now`. If waiting ≥ Q: `{0,waiting,first−now}`; else `start=last?max(now,last+I):now`, `ZADD` if start>now, `{1,waiting+(start>now),start−now}` |

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
    - pgbench `-n -f`, no `-i`, `-c ≤ 8`, `-T ≤ 5`;
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

=== FILE: phase-03-containers-stages-1-4.md ===
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

**T3.2 Seed and check runs.**
- **Goal:** an idempotent seed.
- **Target:** `00-seed.redis` (UNLINK, then `SET k2l04:seed:version v1` and `SET k2l04:voucher:V1:stock 1`).
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

=== FILE: phase-04-stages-5-8.md ===
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
- **Verify:** `node $P/verify/verify-guide.mjs --runs --only-rows R20,R20b,R21,R21b,R22,R22b; echo rc=$?` → `rc=0`

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

=== FILE: phase-05-widget-data-homework-claims.md ===
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

=== FILE: phase-06-shell-assembler.md ===
---
phase: 6
title: "Guide shell and assembler (delegate D0)"
status: pending
priority: P1
effort: 1h
dependencies: [2]
---

# Phase 06 — Shell and assembler

## Goal
A shell that passes the page checks with stub stages. It runs in parallel with phases 03–05.

## Files to create/modify (owner: D0; disjoint from labs/runs)
`$P/assembly/shell-head.html`, `shell-css.part`, `shell-tail.html` and `assemble.mjs`, copied from L06 `assembly/`.

## Tasks

**T6.1 Retarget the shell.**
- **Goal:** the L06 shell, adapted for this lesson.
- **Target:** the shell files.
- **Steps:** title "K2 · Bài 04 · Caching"; image prefix `../../Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/assets/04_Caching/`; `k2l04-*` storage keys; token-only CSS for `.gloss`, `.replay`, `.estimator`, `.costmodel`, `.calc`; keep no-rail column, theme toggle, try/catch storage, `esc()`, GUIDE_DATA; add `H.lanes(el, events)`.
- **Success:** no L06 strings remain.
- **Verify:** `grep -nE "l06-|lesson-06|6_Redis|advance-be-redis" $P/assembly/shell-*.html $P/assembly/shell-css.part | wc -l` → `0`

**T6.2 Assembler.**
- **Goal:** build `G`.
- **Target:** `assemble.mjs`.
- **Steps:**
  1. Set `LABS=$L`, `OUT=G`, `STAGES=8`, `WIDGETS=9`.
  2. Drop the header lines `# (chạy lúc|lua|đồng hồ)`.
  3. Resolve `.sql`, `.pgbench`, `.tsv` and `.awk`.
- **Success:** the stub build writes `G`.
- **Verify:** `node $P/assembly/assemble.mjs --allow-stubs; echo rc=$?` → output contains `đã ghi`, then `rc=0`

**T6.3 Shell sections and SLIDES.**
- **Goal:** every non-stage section.
- **Target:** `shell-head.html`, `shell-tail.html`.
- **Steps:** write these sections.
  - `#cach-hoc`: time table and "nếu còn sức" order; why K2L04 has its own containers (L06 on 6379 untouched); `up main`, `up cluster`, seed pipe, `check.sh`; DBX `ADVANCE_BE_K2L04_REDIS` (127.0.0.1:6381, db 0, single commands) and `ADVANCE_BE_LAB`; `127.0.0.1` not `localhost`; `MSYS_NO_PATHCONV=1`, `winpty`/PowerShell, cwd = repo root; barrier order reset → B → A; the `sed … | grep -v '^#' | docker exec -i … redis-cli` pipe form; why stage 2 is first; warm-up.
  - `#bai-tap`: T5.2 contract, H0–H8, `bash labs/k2-lesson-04-caching/hw-check.sh`, `<!--@RUN hw-check.solution@-->`, solution fold, network I/O reading.
  - `#guard-drill`: `<!--@CMD drill/rate-limit.guard.ai-snippet.ts@-->`, 6 inputs, answer fold.
  - `#phong-van`, `#cheat-sheet` (with slide 31 recap `id="sl-31"`): stubs for D3. `#ban-do-slide`; `#tham-khao` (Pika, source URLs).
  - `#tiep-theo`: FR-M2-05 (algorithm and why, `storeId` hashtag key, env params, 20×429 with `Retry-After = ceil(retry_after_ms/1000)`, batch trade-off); ADR-010 fail-open/closed for Đạt; NFR-10; hub 128 MB maxmemory (limiter keys must expire; eviction = silent fail-open); 6380 text only; Boss Challenge 2.3.
  - SLIDES: 39 entries from contract §6.
- **Success:** the page checks pass on the stub build.
- **Verify:** `node $P/assembly/assemble.mjs --allow-stubs && node $P/verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15; echo rc=$?` → `rc=0`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| page checks | GREEN | T6.3 |
| negatives c, d, e, f, f2, z | RED, others SKIP | `bash $P/verify/negative-tests.sh --guide-only` |
| stub smoke | 0 exceptions | `node $P/verify/widget-smoke.mjs --guide "$G"` |

## Risks and rollback
V09 and the T6.1 grep catch stale strings. Rollback: delete the shell files and `G`.

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

=== FILE: phase-07-stage-fragments.md ===
---
phase: 7
title: "Stage fragments, quizzes, widgets (delegates D1–D3)"
status: pending
priority: P1
effort: 2.25h
dependencies: [5, 6]
---

# Phase 07 — Stage fragments

## Goal
Eight fragments, 32 quiz items, 9 widgets, EXAM and cheat-sheet numbers, written in parallel against the contract.

## Files to create/modify (disjoint)
- **D1:** `$P/assembly/fragments/stage-01…03.{html,quiz.json}` and `widgets/w1–w4.js`.
- **D2:** `stage-04…06.*` and `w5–w7.js`.
- **D3:** `stage-07…08.*`, `w8.js`, `w9.js`, plus EXAM and the cheat-sheet numbers in `shell-tail.html` (D0 is finished by then).
- Delegates never edit labs, runs, `contract.md` or another delegate's files. Contract changes go through the controller.

## Fragment format (frozen, L06 order)
1. `section#chang-N` with `stage-head`, `p.goal`, `dl.wwh`.
2. `dl.gloss` (every new command, in plain Vietnamese, before any `pre[data-cmd]`).
3. `.story`.
4. Figure or SVG.
5. `table.stats` with `b.m[data-run|data-derived]` ("phụ thuộc máy" on timings).
6. `.check30`.
7. `.sayvs` per chip slide (`id="sl-NN"` for PART).
8. The "Làm mẫu" callout.
9. `table.walk` (reset, then B, then A).
10. `kiem-chung` with `table.expect`.
11. `callout challenge` with PASS criteria and an answer fold.
12. `.quiz` with 4 items, each `why` citing a run id.

Widgets are IIFEs that read `run('wN')`, guard null, write via `textContent`/`esc()` only, use ≥ 44 px controls and `wN-` ids.

## Per-stage content
| Stage | Story | Widget | Tự làm (PASS) |
|---|---|---|---|
| 1 | 300 stores: one Redis or a cluster? | W1 slot calc | hashtag post 77's 4 counters, `MSET`: no CROSSSLOT |
| 2 | two cashiers, last voucher (L06 back-link) | W2 lanes | WATCH + 3 retries: 1 redeemed |
| 3 | store 7's stuck POS; 4 acts | W3, W4 | `my-traffic.tsv`: counter ≥ 8/10 s, log 5 |
| 4 | FR-M2-05; kitchen queue; batches | W5 | act 1 allows 5, first Retry-After 2 s |
| 5 | likes on a new dish; Pika "chưa đo trực tiếp" | W6 | `-c 2` vs `-c 8` tps + reason |
| 6 | 10M-member promo | W7 ("ngoại suy") | `unread_uB=2` |
| 7 | instance A asks B to print | W9 | 0.05 s polls ≥ BLPOP latency |
| 8 | unpaid orders, visitors, vegetarian ∩ spicy, referral code (L06/L02 back-links) | W8 | m 100000, k 3: fp in band, 10000/10000 members |

## Tasks

**T7.1 D1 stages 1–3.**
- **Goal:** 3 fragments and W1–W4.
- **Target:** D1 files.
- **Steps:** write the fragments per the table, then run `--fragment` on each.
- **Success:** rc 0 for each.
- **Verify:** `for n in 1 2 3; do node $P/verify/verify-guide.mjs --fragment $P/assembly/fragments/stage-0$n.html || echo FAIL$n; done` → no `FAIL`

**T7.2 D2 stages 4–6.**
- **Goal:** 3 fragments and W5–W7.
- **Target:** D2 files.
- **Steps:** as T7.1.
- **Success:** rc 0.
- **Verify:** the same loop for `4 5 6` → no `FAIL`

**T7.3 D3 stages 7–8, EXAM, cheat sheet.**
- **Goal:** 2 fragments, W8–W9 and the shell data.
- **Target:** D3 files.
- **Steps:**
  1. Write 10 interview questions: fixed vs sliding (with numbers), Lua vs WATCH, token refill, Retry-After, fail-open/closed, PG hot row, write-behind loss, unread design, HLL, Bloom sizing.
  2. Fill the cheat-sheet numbers from `w3`/`w5`/derived only.
- **Success:** fragments pass; V11/V16 GREEN.
- **Verify:** the loop for `7 8` → no `FAIL`; `node $P/assembly/assemble.mjs --allow-stubs && node $P/verify/verify-guide.mjs --only V11,V16; echo rc=$?` → `rc=0`

**T7.4 Controller acceptance.**
- **Goal:** no unchecked delegate output.
- **Target:** none.
- **Steps:** re-run `--fragment`, `node --check` each widget, then run the widget smoke on a stub build.
- **Success:** GREEN.
- **Verify:** `for w in $P/assembly/widgets/w*.js; do node --check $w || echo BAD; done; node $P/assembly/assemble.mjs --allow-stubs && node $P/verify/widget-smoke.mjs --guide "$G"; echo rc=$?` → no `BAD`, then `rc=0`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment rules, V19 | rc 0 | `--fragment` |
| invented number / Lua in stage 1 | cases b and y RED | `negative-tests.sh --guide-only` |

## Risks and rollback
V07/V16 catch invented numbers; V05 catches reworded code. Rollback: delete that delegate's files.

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

=== FILE: phase-08-assemble-verify-render.md ===
---
phase: 8
title: "Assemble, full verification, negatives, render-check"
status: pending
priority: P1
effort: 1h
dependencies: [7]
---

# Phase 08 — Assemble, verify, render

## Goal
One built guide that passes every check, with negatives that prove the checks bite.

## Files to create/modify (owner: controller)
`G`, `$P/runs/verify-full.txt`, `$P/verify/render/`, `$P/verify/render-dark/`.

## Tasks

**T8.1 Build.**
- **Goal:** the final HTML.
- **Target:** `G`.
- **Steps:** `node $P/assembly/assemble.mjs`.
- **Success:** no stubs; within budget.
- **Verify:** output contains `8 quiz, 9 widget, 9 JSON`; `stat -c %s "$G"` ≤ `532480`

**T8.2 Full verifier.**
- **Goal:** all codes GREEN.
- **Target:** `verify-full.txt`.
- **Steps:** run guide mode, `--runs`, `--data` and `--lint`.
- **Success:** 0 fails.
- **Verify:** `for m in "" --runs --data --lint; do node $P/verify/verify-guide.mjs $m || echo FAIL; done > $P/runs/verify-full.txt 2>&1; grep -c FAIL $P/runs/verify-full.txt` → `0`

**T8.3 Negatives.**
- **Goal:** the checks bite.
- **Target:** none.
- **Steps:** run the full set.
- **Success:** 34/34.
- **Verify:** `bash $P/verify/negative-tests.sh | tail -1` → starts `34/34`, contains `0 SKIP`

**T8.4 Widget smoke.**
- **Goal:** widgets on real data.
- **Target:** none.
- **Steps:** run on `G`.
- **Success:** W1, W3, W4 and W8 ✔.
- **Verify:** `node $P/verify/widget-smoke.mjs --guide "$G"; echo rc=$?` → `rc=0`

**T8.5 Render-check, light and dark.**
- **Goal:** mobile and theme safety.
- **Target:** the render folders.
- **Steps:**
  1. `TMP=$P/verify/tmp TEMP=$P/verify/tmp node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "$G" --out $P/verify/render`.
  2. For dark, use a sibling copy with `data-theme="dark"` and `--out $P/verify/render-dark`, then delete the copy.
- **Success:** 0/0/0.
- **Verify:** `grep -hE '"(runtimeErrors|overflow|smallTargets)"' $P/verify/render*/render-report.json` → every count `0`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| V01–V23, M01, D01, DATA | 0 FAIL | T8.2 |
| negatives | 34/34 | T8.3 |
| 375/768/1440 light/dark | 0/0/0 | T8.5 |

## Risks and rollback
Fixes go to fragments or the shell, never to runs. Rollback: regenerate the guide.

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

=== FILE: phase-09-ultra-review-fixes.md ===
---
phase: 9
title: "/ak:code-review --pending --ultra --advice and fixes"
status: pending
priority: P1
effort: 1.5h
dependencies: [8]
---

# Phase 09 — Ultra code review

## Goal
An independent review, with every validated Critical/Important finding fixed.

## Files to create/modify
`$P/reports/code-review-ultra-reviewer-1…5.md`, `code-review-ultra-verdict.md` and `code-review-ultra-fix-status.md`. Only the controller fixes phase 03–08 files.

## Tasks

**T9.1 Review.**
- **Goal:** 5 reviewers plus a verifier.
- **Target:** the reports.
- **Steps:**
  1. Run `/ak:code-review --pending --ultra --advice` over `G`, `$L/**`, `$P/verify/**`, `$P/assembly/**`, `runs/` (read-only), `expected.tsv` and `deviations.md`.
  2. Brief: per-slide correctness (counter formula, Lua number returns, clamp, HLL, Bloom, `maxclients`, listpack 512); safety (names, 6381, L06, PG schema/load, secrets); trace integrity; teaching and Vietnamese; mobile/a11y.
- **Success:** a verdict exists.
- **Verify:** `ls $P/reports/code-review-ultra-verdict.md` → exists

**T9.2 Fix and re-run.**
- **Goal:** 0 open blocking findings.
- **Target:** fix-status.
- **Steps:**
  1. Fix each Critical/Important finding.
  2. Re-record changed regions through `run-lab.mjs`.
  3. Re-run phase 08 and `check.sh`.
  4. Keep a verified measurement unless the review brings new evidence, and cite the source.
- **Success:** 0 OPEN.
- **Verify:** `grep -c 'OPEN' $P/reports/code-review-ultra-fix-status.md` → `0`, and the phase 08 Verify commands pass again

**T9.3 Conditional `/ak:test`.**
- **Goal:** cover only a real gap.
- **Target:** fix-status.
- **Steps:** run `/ak:test` only if the verdict names behaviour no row or negative covers; otherwise record "không cần".
- **Success:** the decision is recorded.
- **Verify:** `grep -cE '/ak:test: (đã chạy|không cần)' $P/reports/code-review-ultra-fix-status.md` → `1`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| open findings | 0 | T9.2 |
| regression | GREEN | phase 08 Verify |

## Risks and rollback
Per fix: re-record the region and reassemble.

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

=== FILE: phase-10-docs-final-gate-handoff.md ===
---
phase: 10
title: "Docs, final gate, learner-ready state, handoff"
status: pending
priority: P1
effort: 0.5h
dependencies: [9]
---

# Phase 10 — Docs, final gate, handoff

## Goal
The guide is discoverable, nothing outside scope changed, the lab is ready, and a resume note exists.

## Files to create/modify (owner: controller)
- `README.md`: lab and guide paths in the Khóa 3 section (≈ line 29) and the tree.
- Curriculum artifacts line, identical in `generate_master_curriculum_reports.py:447`, `reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md:419` and `.html:1806`: replace `Slide 39 trang kèm so sánh ưu nhược điểm 5 thuật toán Rate Limiting.` with the lab and guide paths; do not regenerate.
- L06 one-liners `reports/advanced_backend/lesson_06_redis_teacher_guide.html:4532` and `plans/261031-1651-lesson-06-redis-teacher-guide/assembly/shell-tail.html:219`: wrap "K2 Bài 04 Rate Limiting" in `<a href="../Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html">`; skip if the line differs.
- `plans/handoffs/k2-lesson-04-caching-guide-ready-<yyyymmdd>.md`; `runs/00-fingerprint-after.txt`, `runs/final-gate.txt`, `verify/tmp/docs-before/`.

## Tasks

**T10.1 Doc edits.**
- **Goal:** one-line edits only.
- **Target:** the 6 files.
- **Steps:** copy each file into `docs-before/`, read it, then edit it.
- **Success:** each diff is the single intended change.
- **Verify:** `for f in generate_master_curriculum_reports.py reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md; do diff $P/verify/tmp/docs-before/$(basename $f) $f | grep -c '^>'; done` → `1` each; `node plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs --only V01,V02,V03,V10; echo rc=$?` → `rc=0`

**T10.2 Final gate.**
- **Goal:** one ✔ table.
- **Target:** `final-gate.txt`.
- **Steps:** record the phase 08 results, `check.sh`, the fingerprint after-file and `--compare`, and `git status --short` checked against the allow-list. The allow-list is `$L/`, `G`, `$P/`, README, the 3 curriculum files, the 2 L06 files, the handoff, and the pre-existing `plans/261031-1651-lesson-06-redis-teacher-guide/.claude/`.
- **Success:** every row ✔.
- **Verify:** `grep -c '✘' $P/runs/final-gate.txt` → `0`

**T10.3 Learner-ready state.**
- **Goal:** what Đạt finds when he starts.
- **Target:** none.
- **Steps:**
  1. Do not run `99-cleanup.sh`.
  2. `down cluster`; `down crash` if it is up.
  3. `reset main`, then re-seed.
  4. Keep `k2l04_counter`.
- **Success:** main is seeded; extras show `–`.
- **Verify:** `bash $L/check.sh; echo rc=$?` → `rc=0`; `docker ps --filter name=advance-be-k2l04 --format '{{.Names}} {{.Ports}}'` → exactly `advance-be-k2l04-redis 127.0.0.1:6381->6379/tcp`

**T10.4 Handoff.**
- **Goal:** a resume note.
- **Target:** the handoff file.
- **Steps:** cover what exists, how to start (`up main`, `up cluster`, DBX, the PG setup region), stage times, deviations, run dates, and the next steps: OmniPOS M2 FR-M2-05, then Boss Challenge 2.3. No commit or push.
- **Success:** it links `G`.
- **Verify:** `grep -c 'k2_lesson_04_caching_teacher_guide.html' plans/handoffs/k2-lesson-04-caching-guide-ready-*.md` → ≥ `1`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| L06 and foreign untouched | rc 0 | fingerprint `--compare` |
| scope | ⊆ allow-list | `git status --short` |

## Risks and rollback
Restore any doc from `docs-before/`. No git command other than `git status`.

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
