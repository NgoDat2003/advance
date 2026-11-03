---
title: "K2 Bài 04 Caching teacher guide (rate limit, counters, practices; measured on Redis 7.2.3 and PG 16)"
description: "Vietnamese single-file guide for K2 Bài 04: 39 slides, 8 stages, one rate-limit trace replayed through six Lua limiters, PG hot row vs Redis, every number from a recorded run on K2L04-owned containers."
status: completed
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

This plan builds one Vietnamese single-column guide (no rail) that Đạt studies after L06 in 290 core minutes across 3 evening sessions <!-- RT-15, Updated: Validation Session 1 -->. All 39 slides map once; the 27 claim slides carry chips backed by runs on K2L04-owned containers (and schema `k2l04_counter` for slides 20–21). The core is rate limiting: one fixed `traffic.tsv` (60 requests, 2 stores, 4 acts) is replayed through six Lua limiters with caller-supplied `now_ms`, so the comparison is exact and immune to the Docker VM clock, while short live demos show real-time behaviour. L06's tooling is copied and adapted, and `check.sh`, the frozen `expected.tsv` and the verifier exist before any experiment or HTML. Work stays on `main`, uncommitted.

**Conventions**

- Git Bash, cwd repo root (`D:/study/advance-be` or `D:/học/advance-be`); `P=plans/261102-1332-k2-lesson-04-caching-teacher-guide`, `L=labs/k2-lesson-04-caching`, `G="reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html"`.
- Main `advance-be-k2l04-redis` on `127.0.0.1:6381`→6379; unpublished extras `advance-be-k2l04-cluster`, `advance-be-k2l04-crash`; network `advance-be-k2l04`; volumes `advance-be-k2l04-{redis,cluster,crash}-data`.
- Postgres only via `docker exec -i $PG_CT psql -U postgres -d advance_be_lab` or `… pgbench -n -f <script> -U postgres advance_be_lab` where `PG_CT` matches `/^quan[-_]ly[-_]hop[-_]dong-postgres-1$/` (`quan_ly_hop_dong-postgres-1` on Office PC, `quan-ly-hop-dong-postgres-1` on Home PC; pgbench 16: `-d` means `--debug`, so the DB name is positional) <!-- must-fix 2, Updated: Validation Session 1 -->, writing only in `k2l04_counter`. Keys `k2l04:`; storage `k2l04-`. Controller = main session; D0–D3 = delegates; only `git status`.

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

"Nếu còn sức" order: `04-tb-race.naive` → `07-share.tracking` (if S10 = yes) → `01-fundamentals.bandwidth` → `08-delay.naive` → slide 6 source fold → HOT-stats fold <!-- RT-13, Updated: Validation Session 1 -->. Stages 3–5 are never optional. L06 overlaps each have a core run: token bucket `04-tb-race.claim` + `04-replay.token`; delay `08-delay.claim`; cluster `01-cluster.*`; race `02-race.*`.

## Phases

| # | Phase | Effort | Depends | Gate |
|---|---|---|---|---|
| 01 | [Contract, baseline, smoke](phase-01-contract-baseline-smoke.md) | 0.75h | – | preconditions + fingerprint rc 0; 7 smokes |
| 02 | [Tests first](phase-02-tests-first.md) | 2.5h | 01 | model, selftest rc 0; `--runs` RED ×59 |
| 03 | [Containers, stages 1–4](phase-03-containers-stages-1-4.md) | 3h | 02 | T3.0 lint; K01–R16h GREEN; lint, fingerprint |
| 04 | [Stages 5–8](phase-04-stages-5-8.md) | 2.75h | 03 | all run rows GREEN |
| 05 | [Data, homework, claims](phase-05-widget-data-homework-claims.md) | 1.25h | 04 | `--data`; H01–H03 |
| 06 | [Shell, assembler (D0)](phase-06-shell-assembler.md) | 1h | 02 ∥ 03–05 | page checks on stub |
| 07 | [Fragments (D1–D3)](phase-07-stage-fragments.md) | 2.25h | 05, 06 | `--fragment` ×8 |
| 08 | [Assemble, verify, render](phase-08-assemble-verify-render.md) | 1h | 07 | verify, 34/34, render 0/0/0 |
| 09 | [Ultra review, fixes](phase-09-ultra-review-fixes.md) | 1.5h | 08 | 0 OPEN |
| 10 | [Docs, gate, handoff](phase-10-docs-final-gate-handoff.md) | 0.5h | 09 | final gate ✔ |

## Expected-result matrix

This matrix is frozen into `verify/expected.tsv` in phase 02, with columns `id run slides regex claim chip status`.

- Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`; platform in the note ("đo trên PG 16", "đọc mã nguồn 7.2.3", "chưa đo trực tiếp"). Design rows (`D..`) have `run` = `-`.
- Timed rows need "clock ok" (header `# đồng hồ … → ok`) and "3× sane" (three values in (0, 5e6), median taken, labelled "phụ thuộc máy").
- "s7 a/d · m · w" = `tong s7 cho_qua=a tu_choi=d toi_da_10s=m cho_lau_nhat_ms=w` (m = max processing starts, ts + wait, in any (t−10000, t]); "acts" = the `man` lines.

| ID | Run | Slide | Expected | Chip |
|---|---|---|---|---|
| K01 | check.after-seed | – | all ✔/`–` | – |
| K02 | check.rerun | – | = K01 | – |
| D04 | – | 4 | design: cache layers, link `4_layers_cache_overview.html` | OK |
| R05 | 01-fundamentals.bench-get | 5 | 3× sane `GET k2l04:bench:k`, p50 < 1 ms | OK |
| R06 | 01-fundamentals.cpu | 6 | main-thread CPU ÷ real ∈ [0.5, 1.15] under `--threads 4 -P 16`; `io-threads` 1; UNSUBSCRIBE via source note | OK |
| R07 | 01-fundamentals.maxclients | 7 | `maxclients` 10000; in-container `ulimit -n` ≥ 10032 <!-- RT-09 -->; 2^32 = FAQ wording; chip note: "32 GB/instance" is guidance, chưa đo trực tiếp <!-- must-fix 7 --> | PART |
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
| R14c | 03-replay.compare | – | `counter_qua_log_chan=5 counter_chan_log_qua=3` <!-- RT-11 --> | – |
| R15 | 04-replay.leaky | 15 | s7 32/6 · 5 · 10000; acts 8/11, 11/14, 5/5, 8/8; row 10000 wait 8750 | OK |
| R15b | 04-leaky.worker.timeline | – | offers 1×6, 0, 0; r1…r6 in order; `cho=` rising; clock ok | – |
| R16 | 04-replay.token-interval | 16 | = R13 (slide 16 as drawn is a fixed window) | PART |
| R16a | 04-replay.token | – | s7 30/8 · 9 · 0; acts 7/11, 10/14, 5/5, 8/8; row 10000 retry 750 | – |
| R16b | 04-tb-race.claim.timeline | – | `TIME` form; A 1; B 0, `retry ∈ [999000, 1000000]` <!-- RT-07 --> | – |
| R16c | 04-tb-race.naive.timeline | – | both `GET` `"1"`, both `SET` 0 | – |
| R16d | 04-batch.rtt | – | `-c 1` `EVALSHA` 3× sane, cost 1 and 10; median10 × 10 ≥ 5 × median1 | – |
| R16e | 04-batch.over-admit | – | `kieu1 cho_qua=12 tren 22`; batch replies `1 0 0`, `1 0 0`, `0 0 9990` | – |
| R16f | 04-replay.memory | – | token hash ≤ 120 B; log(1000) `skiplist` > log(5) | – |
| R16g | 04-contract.fail-open | – | `Connection refused`; `fail-open: cho qua`; `fail-closed: tra 503` | – |
| R16h | 04-contract.http429 | – | `HTTP/1.1 200 OK` once, then two `HTTP/1.1 429 Too Many Requests · Retry-After: n` lines with n > 0 <!-- must-fix 9 --> | – |
| D19 | – | 19 | design: NFRs → stage 5; shard estimate "chưa đo trực tiếp" | OK |
| R05s | 05-counter-pg.setup | – | `so_dong` 1000, `tong_like` 0 | – |
| R20 | 05-counter.pg-burst.timeline | 20 | hot, spread, async: failed 0; sum = processed; spread ≥ 1.5 × hot tps; async ≥ 2 × hot; hot Lock samples ≥ 4; clock ok <!-- RT-02 --> | PART |
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
| R29 | 07-share.pool.timeline | 29 | ≥ 3 empty polls; hit ≤ 400 ms after `OK`; `BLPOP` ≤ 150 ms after B's `RPUSH` reply (≤ 250 ms across `.sh` markers); clock ok <!-- RT-09 --> | PART |
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

There are 7 design rows and 59 run rows (58 if S10 = no), across 57 distinct run ids (56 if S10 = no) <!-- RT-02 -->.

- Null chips (frozen): 1, 2, 3, 10, 12, 17, 18, 23, 26, 32, 38, 39.
- PART slides that need `id="sl-NN"`: 7, 8, 14, 16, 20, 21, 22, 29, 31, 36.
- The exact replay, over-admit and Bloom values come from the planner's reference run of the phase 02 T2.4 semantics.

## Acceptance criteria

1. (P08) `G` ≤ 520 KB, no rail, no `<script src>`, no `data:` images, relative `04_Caching` image paths (V01, V10).
2. (P06, P08) SLIDES 1–39 once; null chips = frozen list; other chips = their chip rows (V04).
3. (P03, P07) Stage 2 (slide 33, Lua) precedes stages 3–4; no Lua in `00-*`/`01-*` or stage 1, and no stage-4 limiter names (`rl-token*`, `rl-leaky`) before `chang-4` (V12, V17) <!-- RT-11 -->.
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
15. (P01–P04, P10) `fingerprint --compare` rc 0: non-L06/non-K2L04 containers unchanged, L06 volume/network intact, L06 bind `127.0.0.1:6379` when Up, 0 `k2l04:*` on L06, PG schemas and non-`k2l04_counter` user objects unchanged (0 `pgbench_%` tables); writes outside `k2l04_counter` blocked by SQL allowlist and lint <!-- RT-04, RT-05 -->.
16. (P09) 0 OPEN Critical/Important.
17. (P10) README, 3 curriculum copies, 2 L06 one-liners, handoff done; `git status` ⊆ allow-list; nothing committed.

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| VM clock ~8 % fast, steps back −2.8 s | H×H | `now_ms` replay; host-ms spans; clock line; 3× median; ≤ 3 re-records (rejects in `verify/tmp/rejected/`), then Failure Protocol |
| Đạt uses L06 main | H×L | nothing names it (V17, runner rc 2); fingerprint only reads |
| Load on foreign PG | M×H | `-c 8 -T 3 -n -f`, schema-qualified, schema/write gate |
| hot/spread < 1.5 | M×M | keep data; kongming decides deviation |
| `/dev/stdin` fails | L×M | STOP via Failure Protocol and ask user; never write to foreign PG container <!-- RT-06 --> |
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

Resolved in Validation Session 1: keep 290 core + 47 optional + 45 evening homework split into 3 natural evening sessions in `#cach-hoc`; keep 6 core (`--rep 3`) + 3 optional (`--rep 1`) A/B timelines (logged in `deviations.md`); drop unbacked `Bloom k-sweep`.


## Materialization must-fix (verifier `verify/ultra-plan/verdict.md`, applied by the controller 2026-11-03)

The winning candidate was materialized unchanged. The controller then applied the verifier's must-fix list, marked inline as `<!-- must-fix N -->`:

1. **Important.** Phase 03 gets task T3.1b, which writes `verify/record-all.sh`. Its `--out` ids must equal the run ids in `expected.tsv`.
2. **Important.** pgbench 16 treats `-d` as `--debug`, so the database name is passed positionally (plan conventions). The V17 lint bans `-d` on pgbench lines.
3. **Important.** The counter limiter's deny reply is defined as `{0,tostring(est+1),retry,prev,cur}` (phase 02, T2.4).
4. **Important.** `pg_other_writes` in the fingerprint is advisory only. `pg_schemas` stays the hard gate (phase 01, T1.1).
5. **Minor.** An R20 throughput-relation miss is pre-authorised as a logged deviation (phase 04, T4.2).
6. **Minor.** The `00-seed.redis` UNLINK scope covers only seed-owned keys (phase 03, T3.2).
7. **Minor.** Slide 7's "32 GB/instance" goes into the R07 chip note as "chưa đo trực tiếp".
8. **Minor.** Limiter replies use integer units, and `MEMORY USAGE … SAMPLES 0` is used for the memory rows (phase 02, T2.4).
9. **Minor.** A recorded `429 + Retry-After` line is added: region `04-contract.sh#http429` and run row R16h.

## Ultra receipt

ultra: picked=1/5 margin=low unanimous=no rejected_all=no

## Red Team Review (2026-11-03)

4 hostile reviewers (`red-team-security.md`, `red-team-scope-contract.md`, `red-team-failure-modes.md`, `red-team-assumptions.md`) produced 40 raw findings. All findings without `file:line` evidence were filtered (0 rejected for missing evidence); overlapping items were deduplicated into 15 root-cause findings (3 Critical, 9 High, 3 Medium). User accepted all 15/15:

| ID | Severity | Sources | Disposition | Applied Target |
|---|---|---|---|---|
| RT-01 | Critical | Assump-F1 | Accept | T1.2, T1.3, T2.2, T5.3, T8.2, T10.2 (`--register` for non-runner `runs/*.txt`; write `verify-full.txt`/`final-gate.txt` via `verify/tmp/` first) |
| RT-02 | Critical | Fail-F4, Scope-F1/F2/F3, Assump-F2 | Accept | `plan.md`, T1.4 §3, T2.9, T3.1b, T3.6, T4.4, Phase 04/05 (`59/58` run rows; `05-counter.pg-burst.timeline`; full `record-all.sh` in T3.1b with `hw` group and `--ab` `.timeline` diff normalization; `R16h`/`R30b` in stage gates) |
| RT-03 | Critical | Sec-F1, Sec-F5 | Accept | T2.2, T2.6, T3.0, `00-containers.sh`, `99-cleanup.sh` (T3.0 pre-exec lint; runtime `case "$n"` allowlist; require `--recreate` on drift; ban `host.docker.internal`, `--network host`, `-P`, `redis-cli -h/-u/-p` except `6390 # guard-port`) |
| RT-04 | High | Sec-F2/F6, Scope-F5, Fail-F6, Assump-F5 | Accept | `plan.md` AC15, T1.1, T4.1 (exclude `advance-be-redis*` from anonymous container hash; L06 bind gated when `Up`; exclude `pg_other_writes` from `diff`; add `pg_public_objects` + `pg_pgbench_leaks=0`) |
| RT-05 | High | Sec-F3, Fail-F7 | Accept | T2.1, T2.2, T2.6, Phase 04 `flush`/`stats` (SQL allowlist accepting `k2l04_counter` and `k2l04_counter.*`, banning `COPY`/`DO`/`PROGRAM`/`\` meta-commands; awk numeric validation in `flush`; `default_transaction_read_only=on` for reads) |
| RT-06 | High | Sec-F4 | Accept | `plan.md`, T1.3, Phase 04 (drop `S11b` `/tmp` root write in foreign PG container; keep `psql|pgbench`-only guard; STOP if `S11` fails) |
| RT-07 | High | Fail-F1, Assump-F3 | Accept | `plan.md` R16b, T2.8 (change `R16b` to `retry ∈ [999000, 1000000]`; mask `TIME`-form `rl-token-bucket.lua` retries and normalize `poll N:` counts in `rerun-gate.mjs`) |
| RT-08 | High | Fail-F2 | Accept | Phase 03 `over-admit` & `http429`, T2.8 (flatten `--eval` arrays with `paste -sd' ' -` per call inside `sh -c` before `awk`) |
| RT-09 | High | Fail-F3, Assump-F9 | Accept | `plan.md` R07/R29, Phase 03 `maxclients` & `04-leaky`, Phase 04 `07-share` (in-container `ulimit -n` and `04-leaky` 8-offer loop on VM clock; anchor `R29` on `RPUSH` reply / `.sh` marker bound) |
| RT-10 | High | Fail-F5, Assump-F4, Sec-F8 | Accept | T1.4 §1, T2.6, T2.8, Phase 03/04/05, T10.3 (per-region key resets + `incr-expire-bug` cleanup; lint `--scan --pattern` to protect `my:*`; `#stats` in rerun-gate skip; `99-cleanup.sh` + re-seed in T10.3) |
| RT-11 | High | Scope-F4 | Accept | `plan.md` R14c/AC3, T2.3, T2.6 V12, Phase 03 `compare`, T5.1, Phase 07 (Stage 3 `compare` and `W3` scoped strictly to 3 window limiters; 6-limiter comparison in Stage 4 `W5`) |
| RT-12 | High | Assump-F7, Assump-F8 | Accept | T2.2, T2.6, T2.8, Phase 04 matrix, T8.5, T10.2 (`$HOME/.claude/.../render-check.mjs` + `findings` error count check; `--only 08-hll.sh`/`08-bloom.sh`; `git -c core.quotepath=off status --short`; explicit L06 literal replacement check) |
| RT-13 | Medium | Fail-F8/F9/F10, Scope-F7 | Accept | `plan.md`, T2.2, Phase 03 `watch`/`03-live`/`replay`, Phase 07 (`watch` retry `WATCH→GET→UNWATCH`; `03-live` uses `SET NX EX 10` + monotonic clock check; `tr -d '\r'`; Stage 4 PASS `Retry-After 1 s`; Stage 8 theoretical band `[135, 213]`; drop `Bloom k-sweep`) |
| RT-14 | Medium | Scope-F6/F8, Sec-F7/F9 | Accept | T1.4 §4, T2.6 V15/V17/V19, Phase 04, Phase 06, Phase 07 (D0 stubs `#bai-tap`/`#guard-drill`/`#tham-khao` for D3 after Phase 05; forbid `@CMD *.awk`; expand V15 for `postgresql://`; scope `pg_stat_*`; harden V19 + `el()`) |
| RT-15 | Medium | Assump-F6/F10, Sec-F10, Scope-F9/F10 | Accept | T1.0, T1.3, T3.1b, Phase 06, Phase 07 (T1.0 Docker/PG preconditions; DBX `GET k2l04:seed:version` sentinel; 3-evening session breaks; 7 deciding smokes; `--rep 1` on 3 optional A/B timelines logged in `deviations.md`) |

### Whole-Plan Consistency Sweep
- Reconciled run-row counts (`59` run rows, `58` if `S10 = no`; `57`/`56` distinct run ids) across `plan.md`, `phase-02`, `phase-03`, and `phase-04`.
- Reconciled `05-counter.pg-burst.timeline` across `plan.md`, `phase-01` §3, and `phase-04`.
- Reconciled `record-all.sh` single-owner creation in Phase 03 T3.1b and execution-only usage in Phases 04–05.
- Reconciled Office PC vs Home PC portability: `$HOME/.claude/skills/.../render-check.mjs`, repo-relative cwd, `PG_CT` matching `/^quan[-_]ly[-_]hop[-_]dong-postgres-1$/` (`quan_ly_hop_dong-postgres-1` observed on Office PC with PG `16.14` and `lab01_rest_api` schema).
- Unresolved contradictions: `0`.

## Validation Log (Session 1 — 2026-11-03)

### Verification Results
- Claims checked: 27 codebase/tool claims (via Red-Team Fact-Check + Office PC live Docker/PG probe) + `[UNVERIFIED]` tag scan (`0` unverified tags in plan).
- Office PC environment verified (`[Direct]`): Docker Desktop running; `quan_ly_hop_dong-postgres-1` (`postgres:16-alpine`, PG `16.14`) `Up` with DB `advance_be_lab` (`lab01_rest_api,lab03_indexing,lab07_modeling,lab12_transaction,lab14_locking,lab_imdb,northwind,public`); `redis:7.2.3` local image present (`a7cee7c8178f`); `advance-be-redis` untouched (`Exited`).

### Confirmed Decisions
1. **Pacing & Session Structure (`pacing_budget`):** Keep full 8 stages (290m core + 47m optional + 45m homework), structured into 3 natural evening sessions in `#cach-hoc` (Buổi 1: Chặng 1–3; Buổi 2: Chặng 4–5; Buổi 3: Chặng 6–8 + Bài tập) with `up main && check.sh` resume ritual.
2. **Timelines & Challenge Scope (`timelines_scope`):** Keep 6 core A/B timelines (`--rep 3`) + 3 optional A/B timelines (`--rep 1`, logged in `deviations.md`); fix Stage 4 challenge PASS to `Retry-After 1 s` (`cap=5, rate=0.5`); drop unbacked `Bloom k-sweep`.
3. **Office PC Execution (`office_docker_pg`):** Proceed directly to `/ak:cook --tdd --auto` after `kongming` post-plan-gates go/no-go, using portable `PG_CT` (`quan_ly_hop_dong-postgres-1` / `quan-ly-hop-dong-postgres-1`).

### Whole-Plan Consistency Sweep
- Verified 0 stale references to `RED ×58`, `Users/DAT`, `S11b` `/tmp` writes, Stage 3 `khac_fixed_interval`, or `Bloom k-sweep` across `plan.md` and `phase-01..10.md`.
