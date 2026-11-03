=== FILE: plan.md ===
---
title: "K2 Bài 04 Caching teacher guide (rate limit, counters, practices; measured on Redis 7.2.3 + PG 16.15)"
description: "Vietnamese single-file teacher guide for K2 Bài 04 (39 slides) with redis-cli/SQL/pgbench labs recorded on own advance-be-k2l04-* containers and schema k2l04_counter."
status: pending
priority: P1
effort: 13.5h
branch: main
tags: [k2-lesson-04, caching, rate-limit, redis, postgres, lua, teacher-guide, tdd]
blockedBy: []
blocks: []
created: 2026-11-02
---

# K2 Bài 04 — Caching teacher guide

## Overview

The plan builds GUIDE = `reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html` on the no-rail L06 shell for study after L06 (≈ 2026-11-04), 295 core minutes. Every experiment is a small `.redis`/`.sh`/`.sql`/pgbench snippet in LABS = `labs/k2-lesson-04-caching/`, run on `advance-be-k2l04-redis` (`127.0.0.1:6381`), unpublished `-cluster` and `-scratch`, and schema `k2l04_counter`. Rate limiting replays one 45-request trace (`traffic.tsv`) through six Lua limiters taking `now_ms` as ARGV, checked decision-by-decision by a JS oracle, plus short live `TIME` demos with a clock line. A before/after fingerprint proves L06 (container, network, volume, labs), foreign containers, port 6380 and the PG schema list are untouched. Materializing this plan replaces the scaffold `plan.md` and `phase-01-start.md`.

Corrected facts: pgbench `-d` is `--debug`, so the database is positional (§9.4's literal `-d advance_be_lab` would be wrong); `MEMORY USAGE` samples 5 nested values unless `SAMPLES 0`; Lua number replies truncate to integers, so limiters use milli-units; L06 `token-bucket.lua` sets `ts = now`, letting a clock step move `ts` back, so K2L04 uses `ts = max(ts, now)` (L06 unedited; handoff follow-up).

## Data flow

1. `verify/fingerprint.sh` → `runs/00-fingerprint-before.txt`.
2. Lab files → one display rule, `verify/lab-text.mjs`.
3. `verify/run-lab.mjs` (adapted L06 runner: host-ms clock, A/B barrier, MULTI mode, identity and clock headers) runs one region on a K2L04 container or via `docker exec -i quan-ly-hop-dong-postgres-1 psql|pgbench` → `runs/*.txt` + `runs/manifest.tsv` (one sha256 line per path).
4. `verify-guide.mjs --runs` checks `verify/expected.tsv` (frozen in phase 02), M01, D01, V18, V22 (replay = `verify/rl-model.mjs`).
5. `verify/make-widget-data.mjs` → `runs/data/w1–w9.json`, `derived.json`; `--data` traces every number.
6. Delegates write fragments and widgets against `assembly/contract.md`; the controller writes shell sections.
7. `assembly/assemble.mjs` → GUIDE → verifier, negatives, widget-smoke, render-check, ultra review, docs, fingerprint compare, handoff.

## Stage map (minutes)

| Stage | Slides | Topic | Core | Opt | Widget |
|---|---|---|---|---|---|
| `#cach-hoc` | 1–2 | glossary, containers, DBX 6381, two terminals, Git Bash rules | 15 | – | – |
| 1 | 3–11 | slide-7 numbers (median of 3), single-thread CPU, Pub/Sub source, bytes/key, slots, hashtag, CROSSSLOT, data-structure map | 30 | – | W1 slot calculator |
| 2 | 33 | GET→SET race, WATCH abort, Lua take; `--eval`, KEYS/ARGV, EVALSHA, TIME | 30 | – | W2 race lanes |
| 3 | 12–14 | trace; fixed window (INCR→EXPIRE bug, live PTTL burst); sliding log; sliding counter | 40 | 9 | W3 window simulator |
| 4 | 15–16 | leaky meter + queue; token continuous vs interval; batch RTT and over-admission; 429 + Retry-After; fail-open/closed; six-way table | 45 | 7 | W4 bucket, W5 comparison |
| 5 | 17–22 | PG hot row vs 1,000 rows vs `synchronous_commit=off`; Redis HINCRBY; write-behind GETDEL + crash loss; memory layouts | 45 | 8 | W6 counter lab |
| 6 | 23–25 | fan-out to 100k ×3 vs pointer; `ZADD GT`; 10M extrapolation | 20 | – | W7 cost model |
| 7 | 26–30 | message pool polling vs BLPOP; Hazelcast design | 20 | 6 | W8 poll lanes |
| 8 | 34–37 | delay ZSET claim; HLL; Bitmap; hand-built Bloom | 40 | – | W9 HLL/Bloom |
| Wrap | 31–32, 38–39 | recap, homework, interview, cheat sheet, refs, tiếp theo | 10 | 15 drill + 45 homework | – |
| **Total** | 39 | | **295** | **45** | 9 |

Do the "nếu còn sức" items in this order:
1. flush race;
2. Redis stopped vs paused;
3. live sliding log;
4. Lua CROSSSLOT;
5. CLIENT TRACKING;
6. driver drill.

Rate limiting and counters are never optional.

**Trace.** `traffic.tsv` has columns `ts_ms client seg` and 45 rows. Each segment is written as `start..end step`:

| Seg | Client | ts_ms |
|---|---|---|
| A | s7 | 1000..9000 step 2000 |
| B | s7 | 29500..30400 step 100 |
| B2 | s7 | 35000..35200 step 100 |
| C | s7 | 65000..65500 step 100 |
| D1 | s7 | 80000..80800 step 200 |
| D2 | s7 | 91100..96100 step 1000 |
| S9 | s9 | 2500..92500 step 10000 |

Every limiter allows 5 per 10 s:
- fw, log and swc: W = 10000 ms, limit 5;
- tb and lk: capacity 5, refill 0.5/s;
- tbi: 5 tokens per 10 s interval.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract, baseline, smoke](phase-01-contract-baseline-smoke.md) | 0.75h | – | fingerprint + git baseline; S1–S13 recorded; probe removed; contract (39 slides) |
| 02 | [Tests first](phase-02-tests-first.md) | 2.25h | 01 | selftest GREEN; model = frozen summary; `--runs` RED ×60; `check.sh` rc=6; lab negatives red |
| 03 | [Containers, labs, runs](phase-03-containers-labs-runs.md) | 4h | 02 | check ✔/– twice; `--runs`, `--lint` GREEN; rerun gate 0; fingerprint rc 0 |
| 04 | [Widget data, homework, claims](phase-04-widget-data-homework-claims.md) | 1h | 03 | `--data` GREEN; homework ✔/✘ as designed; claim files |
| 05 | [Shell and assembler](phase-05-shell-assembler.md) | 1h | 02 (parallel 03–04) | stub build; page codes GREEN |
| 06 | [Fragments and sections](phase-06-fragments-sections.md) | 2h | 04, 05 | `--fragment` ×8 GREEN; `node --check` ×9 |
| 07 | [Assemble, verify, render](phase-07-assemble-verify-render.md) | 0.75h | 06 | verifier GREEN; negatives 29/29; render 0/0/0 light+dark |
| 08 | [Ultra review and fixes](phase-08-ultra-review-fixes.md) | 1.25h | 07 | 0 open Critical/Important |
| 09 | [Docs, final gate, handoff](phase-09-docs-final-gate-handoff.md) | 0.5h | 08 | final gate ✔; `git status` ⊆ allow-list |

## Expected-result matrix (frozen in `verify/expected.tsv`, phase 02)

Conventions:
- Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`. No slide needs `Cần sửa`. The platform goes in the chip note ("đo trên PG 16.15", "đọc mã nguồn 7.2.3", "chưa đo trực tiếp").
- Each chip slide has exactly one chip row.
- Timing values are labelled "phụ thuộc máy".

| ID | Run | Slide | Expected | Chip |
|---|---|---|---|---|
| C0a / C0b | check.after-seed / check.rerun | – | all ✔ or –; C0b body = C0a | – |
| D04 | design | 4 | cache layers per image | OK |
| D05 | design | 5 | speed (st1), buffer (st4 queue, st5 write-behind), share (st7) | OK |
| R06 | 01-fundamentals.bench | 6 | Δ main-thread CPU ≥ 0.8 × Δ total; `io_threads_active:0`; UNSUBSCRIBE O(N) "đọc mã nguồn 7.2.3" | OK |
| R07 | 01-fundamentals.bench | 7 | set/get `invalid=0 n=3`, median_rps > 0; `maxclients` 10000 | PART |
| R07b | 01-fundamentals.keys | – | `errors: 0, replies: 100000`; Δused_memory > 4000000 | – |
| R08 | 01-cluster.crossslot | 8 | untagged MGET → `CROSSSLOT`; `{post:1}` → "10", "99"; failover "chưa đo trực tiếp" | PART |
| R09 | 01-cluster.keyslot | 9 | `cluster_slots_assigned:16384`, `cluster_state:ok`; tagged pairs share slots | OK |
| R09b | 01-fundamentals.spread | – | node0/1/2 each in [900, 1100] of 3000; COUNTKEYSINSLOT 3 | – |
| D11 | design | 11 | recap → K1 L02/L06 back-links | OK |
| R33a | 02-race.naive.timeline | – | both HGET "1", both HSET 0 → 2 admitted from 1 token | – |
| R33b | 02-race.watch.timeline | – | A EXEC array; B EXEC `(nil)`; B retry HGET "0" | – |
| R33 | 02-race-lua.take.timeline | 33 | lua header; A + B replies = 1; HGET "0" | OK |
| R33d | 02-tools.lua-basics | – | KEYS/ARGV echo; TIME 2 items; sha `e0e1f9fabfc9d4800c877a703b823ac0578ff8db`; EVALSHA 1; arity error | – |
| R13g | 03-windows.gen | – | 45 rows = `rl-model --gen` (V22) | – |
| R13a / R13b | 03-windows.fixed-plain / .incr-bug | – | INCR 1…6, PTTL > 0 / TTL -1 after bare INCR; `SET NX EX`+INCR → TTL 1–10 | – |
| R13 | 03-windows.replay | 13 | both `fw` summary lines; every row = model (V22) | OK |
| R14a | 03-windows.replay | – | both `log` lines | – |
| R14 | 03-windows.replay | 14 | both `swc` lines (`vs_log=6`, `max_10s=7`) | PART |
| R13c | 03-windows.live-fixed | – | counts 1–5 twice; `pttl_after1` 1–450; `pttl_after2` ≥ 9000; `span_ms` ≤ 3500; `step=no` | – |
| R14c | 03-windows.log-memory | – | 100 entries listpack, 1000 skiplist; MEMORY USAGE > 0 | – |
| R14d / R14e (opt) | 03-windows.live-log / .cluster-lua | – | TIME form 5 allowed, 6th denied, retry > 8000, `step=no` / untagged CROSSSLOT, `{s7}` allowed 1 | – |
| R15 | 04-leaky.queue.timeline | 15 | enqueue 1×5 then 0×3; B pops r1…r5 then empty; pop5 − pop1 in [1700, 2600] ms | OK |
| R15b | 04-buckets.replay | – | both `lk` lines (`max_delay_ms=7600`) | – |
| R16 | 04-buckets.replay | 16 | both `tbi` lines (= fw, B=10/0: interval refill is a fixed window) | PART |
| R16t | 04-buckets.replay | – | both `tb` lines; fw/log/swc lines = stage 3 | – |
| R16a | 04-buckets.live-token | – | 5×`1`, 3×`0` with retry > 0; after 2.2 s one `1`, one `0`; HLEN 2; `step=no` | – |
| R16b | 04-buckets.batch-rtt | – | n1/n10 `invalid=0`, p50 < 1 ms; ratio(10·m10, m1) ≥ 5; HGET mt "99340000000" | – |
| R16c | 04-buckets.batch-share | – | `A=5 B=5 C=0 C_retry_ms=1000 D=10 max_admit_in_1s=18` | – |
| R16d (opt) | 04-buckets.redis-down | – | stopped rc ≠ 0, < 1500 ms; paused rc 124, ≥ 1800 ms; PONG | – |
| R05s | 05-schema.setup | – | count 1000 | – |
| D19 | design | 19 | requirements; 1M QPS "chưa đo trực tiếp" | OK |
| R20 | 05-counter.pg-burst | 20 | per block after − before = processed, failed 0; tps_spread ≥ 1.5 × tps_hot; tps_async ≥ 1.1 × tps_hot; hot lock3 ≥ 3; spread lock3 ≤ 1 | PART |
| R20s | 05-stats.stats | – | 2 × n_tup_hot_upd ≥ n_tup_upd | – |
| R21 | 05-counter.write-behind | 21 | `flushed=500 pg_like=500 pending=300`; `after_restart=` empty; final `pg_like=500` | OK |
| R22 | 05-counter.redis-incr | 22 | hincrby `invalid=0`; HGET "300000"; listpack | PART |
| R22a | 05-counter.layouts | – | bytes_per_post strings > hash > bucket100 < bucket200; listpack/listpack/hashtable; entries 512 | – |
| R22b (opt) | 05-counter.flush-race | – | get-del `lost` > 0; getdel `lost=0` | – |
| D24 | design | 24 | requirements (10M users) | OK |
| R25a | 06-unread.fanout | – | 3 × `replies: 100000`; median_ms > 0; HGET "3"; HLEN 100000 | – |
| R25 | 06-unread.pointer | 25 | last 6; ZSCORE 4; ZCOUNT 2 → 3; GT keeps 7; HSET falls back to 5 | OK |
| R25b | 06-unread.pointer-memory | – | ZCARD 100000; skiplist; MEMORY USAGE > 0 | – |
| D27 / D28 | design | 27 / 28 | request/reply over one-way MQ / reply lands on another instance | OK / OK |
| R29 | 07-share.reply.timeline | 29 | ≥ 5 empty polls before `{"ok":1}`; BLPOP reply ≤ 100 ms after B's RPUSH | PART |
| D30 | design | 30 | Hazelcast "chưa đo trực tiếp" | OK |
| R30t (opt) | 07-share.tracking | – | push `invalidate` with `k2l04:rc:` key | – |
| D31 | design | 31 | recap; "token bucket preferred" depends (sliding log for FR-M5-04) | PART |
| R34 | 08-delay.claim.timeline | 34 | both see o1; ZREM A 1, B 0; done [o1]; rest o2 o3 | OK |
| R34a | 08-practices.delay-lua | – | lua header; o1 then nil; o2 o3 remain | – |
| R35 | 08-practices.hll | 35 | n=100000 count=99655 strlen=12304 dense; n=100 sparse; error ≤ 2.43 % at every N; `hll-sparse-max-bytes` 3000 | OK |
| R35a | 08-practices.pfmerge | – | week in [10733, 11267]; each day in [4878, 5122] | – |
| R36 | 08-practices.bitmap | 36 | BITCOUNT 50000/33334/16667; STRLEN 12500; GETBIT 1,1,0; sparse 1250000/1310768/1; set > 50 × bitmap memory | PART |
| R37 | 08-practices.bloom | 37 | two lua headers; `members_hit=10000`; `fp` in [832, 1005]; set > 20 × bloom memory | OK |
| K1–K8 | `<stage file>.kiem-chung` (K5 and K5p for Redis and SQL: 9 runs) | – | the stage's `table.expect` values (e.g. K1 maxclients 10000, K8 PFCOUNT 99655) | – |
| H1 / H2 / H3 | hw-check.solution / .bad / .scaffold | – | ✔ H0–H6 / ✘ exactly H2, H4, H6 / ✘ H0 | – |

Totals:
- **Rows.** 60 run rows and 9 design rows. Chip rows: 27.
- **Null-chip slides (§9.5).** 1, 2, 3, 10, 12, 17, 18, 23, 26, 32, 38, 39.
- **PART anchors.** The PART slides need `id="sl-NN"`: 7, 8, 14, 16, 20, 22, 29, 31, 36.

Frozen replay summary (`verify/expected-rl-summary.txt`):

```text
fw seg A=5/0 B=10/0 B2=0/3 C=5/1 D1=5/0 D2=5/1 S9=10/0
fw s7 allowed=30 denied=5 max_10s=10 vs_log=5
log seg A=5/0 B=5/5 B2=0/3 C=5/1 D1=5/0 D2=5/1 S9=10/0
log s7 allowed=25 denied=10 max_10s=5 vs_log=0
swc seg A=5/0 B=5/5 B2=2/1 C=5/1 D1=5/0 D2=3/3 S9=10/0
swc s7 allowed=25 denied=10 max_10s=7 vs_log=6
lk seg A=5/0 B=5/5 B2=2/1 C=5/1 D1=5/0 D2=6/0 S9=10/0
lk s7 allowed=28 denied=7 max_10s=7 vs_log=3 max_delay_ms=7600
tb seg A=5/0 B=5/5 B2=2/1 C=5/1 D1=5/0 D2=6/0 S9=10/0
tb s7 allowed=28 denied=7 max_10s=7 vs_log=3
tbi seg A=5/0 B=10/0 B2=0/3 C=5/1 D1=5/0 D2=5/1 S9=10/0
tbi s7 allowed=30 denied=5 max_10s=10 vs_log=5
```

"Matches theory" bands. All inputs are fixed `seq` values, with no `$RANDOM`.
- **HLL.** |count − N| / N ≤ 3 × 0.81 %. For `ip1..ip100000` the count is exactly 99,655, as already probed.
- **Bloom.** n = 10,000, m = 50,000, k = 3, so p = (1 − e^−0.6)^3 = 0.09185. Over 10,000 fixed probes the expected count is 918.5 ± 3σ (σ = 28.9), i.e. [832, 1005]. Members must show exactly 0 false negatives.
- **Cluster spread.** ±3.9σ.
- **Sliding counter vs log.** Exactly 6 of 35 decisions differ.

## Acceptance criteria

1. GUIDE ≤ 520 KB, no external script, Google Fonts only, no rail, relative slide images, never `data:` (V01, V10, V23 · P07).
2. `SLIDES` lists 1–39 once; null list = §9.5; chips = `expected.tsv` chip rows (V04 · P07).
3. Each stage has glossary first, story, diagram, stats, 30-second check, code, run, Làm mẫu, `table.expect`, challenge with PASS, 4 quiz items citing runs (V05, V11, V12 · P06).
4. Every number traces to a manifest run or `derived.json` (V06–V08, V16, M01, `--data` · P03/P04).
5. Every run row matches. A deviation needs kongming, a `deviations.md` entry and a changed narrative; data is never edited (D01 · P03).
6. Replay trace and every decision equal `rl-model.mjs`; the summary equals the frozen 12 lines (V22 · P03).
7. Run headers hash every Lua/helper/data file used (V18 · P03).
8. `--lint` (V17) GREEN (P02/P03).
9. `check.sh` rc 0 after seed, after rerun (identical) and at handoff (P03/P09).
10. Fingerprint `--compare` rc 0 (P03/P09).
11. Negative tests 29/29 RED, 0 SKIP (P07).
12. Benchmarks are medians of 3 with `invalid=0`; timed runs `step=no` within ≤ 3 attempts; labelled "phụ thuộc máy" (P03).
13. Homework: solution ✔ H0–H6, bad ✘ exactly H2/H4/H6, scaffold ✘ H0 (P04).
14. render-check 375/768/1440 light+dark 0/0/0; widget-smoke 0 exceptions, W1 = recorded slots (P07).
15. Storage keys `k2l04-*` only; widgets use `textContent`/`esc()` (V09, V19 · P07).
16. Core ≤ 300 min with the priority order published (P05).
17. No open Critical/Important finding (P08).
18. README, curriculum and L06 `#tiep-theo` link updated (L06 verifier GREEN); handoff written; `git status` ⊆ allow-list; no git write (P09).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| Docker VM clock 8 % fast, steps back ≤ 2.8 s | H×H | ARGV replay, clamp, `ts = max(ts, now)`, clock line, ≤ 3 attempts, medians |
| `redis-benchmark` rps ≤ 0 | H×M | `invalid=0` required; re-record ≤ 3 |
| Load on foreign PG | M×H | `-c 8 -T 5` ×3 (≈ 17 s), `-n -f`, scope lint, schema gate |
| `pgbench -f /dev/stdin` fails | M×M | smoke S8 → `/tmp` file removed in the same command |
| Runner hangs inside MULTI | certain | MULTI mode, red-first fixture |
| L06 main restarted mid-build | L×M | `l06_main_started` ✘ → Failure Protocol |
| Lua ≠ model, or data contradicts plan | M×M | V22 names the row; kongming-approved fix or deviation |
| HTML > 520 KB | M×M | excerpts, folds, compact JSON |
| Port 6381 taken | L×M | `up main` refuses and prints the owner |

Rollback: `bash labs/k2-lesson-04-caching/99-cleanup.sh` UNLINKs `k2l04:*` except `my:`/`hw:` and removes extras by exact name; `--all` also removes main, volume `advance-be-k2l04-data`, the network (if empty) and schema `k2l04_counter`. Then delete LABS, GUIDE and plan artifacts and restore the phase-09 one-liners. Never prune or git reset.

## Open questions for the user

None blocking. For the handoff: L06's bucket over-refills slightly after a backward clock step. K2L04 teaches the fix and leaves L06 unedited.

=== FILE: phase-01-contract-baseline-smoke.md ===
---
phase: 1
title: "Contract, baseline, run-method smoke"
status: pending
priority: P1
effort: 0.75h
dependencies: []
---

# Phase 01 — Contract, baseline, smoke

## Goal
Record a privacy-safe baseline of everything K2L04 must not touch. Decide the run methods from smoke tests on a throwaway probe. Freeze the names that parallel work depends on.

## Files to create/modify
Owner: controller. Every Verify in every phase starts in Git Bash with:

`cd /d/study/advance-be && P=plans/261102-1332-k2-lesson-04-caching-teacher-guide && L=labs/k2-lesson-04-caching && G="reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html" && L06P=plans/261031-1651-lesson-06-redis-teacher-guide`

Files:
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/verify/fingerprint.sh`
- `…/runs/00-fingerprint-before.txt`, `…/runs/00-git-status-before.txt`, `…/runs/run-method-smoke.txt`
- `…/assembly/contract.md`

## Tasks

**T1.1 Fingerprint and baseline**

Goal: prove later that nothing outside K2L04 changed.

Target: `$P/verify/fingerprint.sh` (copied from `$L06P/verify/fingerprint.sh`) and the two baseline files.

Steps:
1. Keep the L06 hash lines `sha256(id|image)|Up|Exited`. Skip only names starting `advance-be-k2l04-`, so L06 main is fingerprinted too.
2. Add lines `l06_main` (hash|absent), `l06_main_started` (`docker inspect -f '{{.State.StartedAt}}' advance-be-redis`), `l06_net` (network ID hash), `l06_vol` (`advance-be-redis-data` present|absent), `l06_labs` (sorted `sha256sum` of `labs/lesson-06-redis` minus `node_modules`), `l06_k2l04_keys` (read-only `--scan --pattern 'k2l04:*'` count on L06 main, or `down`), `l06_c14` (`docker ps -a --filter name=advance-be-redis-` publishes nothing), `port6380`, `port6380_k2l04`, `k2l04_main_bind`, `k2l04_run_id_match` (node TCP to 127.0.0.1:6381), and `pg_schemas` from `docker exec quan-ly-hop-dong-postgres-1 psql -X -At -U postgres -d advance_be_lab -c "SELECT string_agg(nspname, ',' ORDER BY nspname) FROM pg_namespace WHERE nspname NOT LIKE 'pg\_%' AND nspname NOT IN ('information_schema','k2l04_counter')"`.
3. `--compare` exits 1 when a baseline hash line is missing, any `l06_*` identity line differs, `l06_k2l04_keys > 0`, `l06_c14` turns fail, `port6380_k2l04 ≠ none`, `pg_schemas` differs, or an existing main is not bound to `127.0.0.1:6381`. A status change alone is info.
4. Write the baseline. Then write `git status --short > $P/runs/00-git-status-before.txt`.

Success: the output is deterministic, holds no secrets, and passes against itself.

Verify:
- `bash $P/verify/fingerprint.sh > $P/verify/tmp/a.txt && bash $P/verify/fingerprint.sh > $P/verify/tmp/b.txt && diff $P/verify/tmp/a.txt $P/verify/tmp/b.txt && echo SAME` → `SAME`.
- `grep -ciE 'quan-ly|omnipos|password|secret' $P/runs/00-fingerprint-before.txt` → `0`.
- `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`.

**T1.2 Smoke S1–S13**

Goal: settle the run methods with evidence.

Target: `$P/runs/run-method-smoke.txt`, using probe `advance-be-k2l04-probe`.

Steps:
1. `docker run -d --name advance-be-k2l04-probe --tmpfs /data redis:7.2.3 redis-server --appendonly no --save ""`. The probe publishes no port.
2. Write one line per check: `S<n> PASS|FAIL <evidence>`.

| # | Check | Expected |
|---|---|---|
| S1 | pipe `SET k2l04:smoke 1` / `GET` with `--no-raw` | `OK` / `"1"` |
| S2 | `redis-cli -r 3 -i 0.5 PING`, lines stamped by a node reader | deltas 350–700 ms |
| S3 | `# x` piped | `ERR unknown command '#'` |
| S4 | `docker exec … echo /lab/x` | mangled path; correct with `MSYS_NO_PATHCONV=1` |
| S5 | `printf 'MULTI\nECHO x\nEXEC\n'` piped | `QUEUED` |
| S6 | `PFADD k2l04:smoke:h a`; `PFDEBUG ENCODING` | `sparse` (FAIL → use `GETRANGE key 4 4`) |
| S7 | `CLIENT TRACKING on BCAST PREFIX k2l04:rc:`, SET, PING via `redis-cli -3 --show-pushes yes` | `invalidate` (FAIL → drop R30t) |
| S8 | `printf 'SELECT 1;\n' \| MSYS_NO_PATHCONV=1 docker exec -i quan-ly-hop-dong-postgres-1 pgbench -n -f /dev/stdin -c 1 -T 1 -U postgres advance_be_lab` | `processed:` > 0 (FAIL → `/tmp` form) |
| S9 | SET, `docker kill`, `docker start`, GET on the probe | empty |
| S10 | `SCRIPT LOAD "return 1"`, then `redis-benchmark -q -c 1 -n 2000 EVALSHA <sha> 1 k2l04:x:{s7}` | rps > 0 |
| S11 | `date +%s%3N` | 13 digits |
| S12 | `docker ps -a --filter name=advance-be-redis- --format '{{.Names}}'` | probe not listed |
| S13 | S8 with `SELECT pg_sleep(0.05);` `-T 2` in the background, sampled once | `count(*) WHERE application_name='pgbench'` ≥ 1 |

3. `docker rm -f advance-be-k2l04-probe`.

Success: S1–S5 and S9–S13 PASS. S6–S8 each have a recorded decision.

Verify:
- `grep -cE '^S([1-9]|1[0-3]) (PASS|FAIL) ' $P/runs/run-method-smoke.txt` → `13`.
- `grep -cE '^S(1|2|3|4|5|9|10|11|12|13) FAIL' $P/runs/run-method-smoke.txt` → `0`.
- `docker ps -a -q --filter name=advance-be-k2l04-probe | wc -l` → `0`.

**T1.3 Contract v1**

Goal: the frozen names used by phases 02–06.

Target: `$P/assembly/contract.md`, with the structure of `$L06P/assembly/contract.md`.

Steps:
- **§1 Keys** (all `k2l04:`): `race:`, `rl:{r,live,bug,logmem,bt,batch,x}:`, `lk:q:`, `cnt:`, `wb:`, `unread:`, `bc:` (seed `bc:last` 6, `bc:feed` n1–n6, `bc:read` uA 4 uB 6), `bc:demo:`, `share:`, `rc:`, `delay:`, `hll:`, `seg:`, `bloom:`, `bench:`, `k:`, `dist:`, `{post:1}`, `{s7}`, `demo:`, `barrier:<scenario>`, `hw:`, `my:`. Seed and cleanup never remove `my:`/`hw:`.
- **§2 Containers:** the phase 03 table.
- **§3 Formats:** L06 `.redis`/`.sh` rules; `.sql`/`.pgbench` use `-- #region id · title (slide N)`; `.sh` cwd = repo root; Lua only from stage 02; the S8 pgbench form.
- **§4 Runs:** `runs/<stem>.<region>[.A|.B|.timeline].txt`; header `# chạy lúc dd/mm/yyyy HH:MM +0700 · Redis 7.2.3 · <ct>` (SQL: `· PostgreSQL 16.15 · quan-ly-hop-dong-postgres-1`); `# (lua|sh|file) <name> sha256=<hex>`; `# clock: host_ms=… redis_ms=… ratio=… step=no|yes`.
- **§5 Page:** L06 CSS plus `dl.glossary`, `.algogrid`; `div.widget#w1–w9`; storage `k2l04-c<N>-<slug>`, `k2l04-theme`, `k2l04-warmup`, `k2l04-hw-*`, `k2l04-drill-*`; sections `#cach-hoc`, `#chang-1..8`, `#bai-tap`, `#driver-drill`, `#phong-van`, `#cheat-sheet`, `#ban-do-slide`, `#tham-khao`, `#tiep-theo`.
- **§6 Workflow:** `docker exec -it advance-be-k2l04-redis redis-cli` (`winpty` in Git Bash; prompt shows container port 6379, host port is 6381); `.sh` pasted at `D:/study/advance-be`; `.sql` in DBX `ADVANCE_BE_LAB`; DBX `ADVANCE_BE_K2L04_REDIS` (127.0.0.1:6381, db 0) as key browser; two terminals reset → B → A.
- **§7 Slides:** table `Slide | Title | Stage | Chip | Row | Anchor`, 39 rows from the plan matrix.

Success: 39 rows, and the null list equals §9.5.

Verify: `node -e "const r=require('fs').readFileSync('$P/assembly/contract.md','utf8').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(c=>/^\d+$/.test(c[1]||''));console.log(r.length,r.filter(c=>c[4]==='–').map(c=>c[1]).join(','))"` → `39 1,2,3,10,12,17,18,23,26,32,38,39`.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| fingerprint deterministic | `SAME` | T1.1 Verify 1 |
| no secret/name leak | `0` | T1.1 Verify 2 |
| L06 C14 naming safe | S12 PASS | `grep -c '^S12 PASS' $P/runs/run-method-smoke.txt` → `1` |
| probe removed | `0` | T1.2 Verify 3 |
| slide table | `39 1,2,…,39` | T1.3 Verify |

## Risks and rollback
The probe publishes no port and is removed in T1.2. S8 and S13 only read PG.

Rollback: delete the files above, and run `docker rm -f advance-be-k2l04-probe` if the probe is left over.

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
effort: 2.25h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Every checker exists, and each one is RED for the right reason before any lab region, run or HTML exists.

## Files to create/modify
Owner: controller. Copy from `$L06P/verify/` and adapt.
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/verify/`:
  - `lab-text.mjs`, `run-lab.mjs` (from `run-redis.mjs`), `merge-timeline.mjs`;
  - `rl-model.mjs` (new), `expected-rl-summary.txt`;
  - `verify-guide.mjs`, `expected.tsv`, `deviations.md`;
  - `negative-tests.sh`, `rerun-gate.mjs`, `widget-smoke.mjs`, `fixtures/*`.
- `D:/study/advance-be/labs/k2-lesson-04-caching/check.sh`.

## Tasks

**T2.1 `lab-text.mjs`**

Goal: one display rule for every consumer.

Steps:
- Region markers are `# #region` in `.redis` and `.sh` files and `-- #region` in `.sql` and `.pgbench` files.
- `displayText` drops `#` lines only in `.redis` files. All other extensions are shown verbatim.
- Keep `dockerCalls`, `redisArgs` and `regionIds` from L06.

Verify: `node --check $P/verify/lab-text.mjs && echo OK` → `OK`.

**T2.2 `run-lab.mjs`**

Goal: the L06 runner, adapted to this lesson.

Steps:
1. **Guard.**
   - Allowed containers: `^advance-be-k2l04-(redis|cluster|scratch)$`.
   - `quan-ly-hop-dong-postgres-1` is allowed only as the `.sql` target and in `.sh` lines that run `docker exec … psql|pgbench`.
   - MAIN is `advance-be-k2l04-redis`.
2. **`.sh` regions.** Spawn them with the repo root as cwd.
3. **`.sql` kind.**
   - Command: `docker exec -i -e PGAPPNAME=k2l04-runner quan-ly-hop-dong-postgres-1 psql -X -q -a -v ON_ERROR_STOP=1 -P pager=off -U postgres -d advance_be_lab -f -`.
   - Echoed input lines get the prefix `sql> `.
4. **MULTI mode.** After `MULTI`, send commands without ECHO markers and wait for one reply line each. Write the post-marker after `EXEC` or `DISCARD`.
5. **Clock line.** For `#@ timed` regions and every `--ab` run, take `redis-cli TIME` on MAIN and host `Date.now()` before and after. Write `# clock: host_ms=Δ redis_ms=Δ ratio=r step=yes|no`. `step=yes` means `redis_ms ≤ 0` or the ratio is outside [0.8, 1.3].
6. **Identity headers.** Write `# lua|sh|file <name> sha256=<LABS file hash>` for every `/lab/lua/*.lua`, `/lab/*.sh` (and any Lua those helpers call), and every `labs/k2-lesson-04-caching/<f>` that a line references.
7. **Timeout.** Step timeout comes from `K2L04_STEP_TIMEOUT_MS` (default 180000). Manifest, `--ab`, `--rep` and `--register` work as in L06.

Red-first: `fixtures/multi.redis` region `a` runs `SET k2l04:fx:m 1`, `WATCH`, `MULTI`, `INCR`, `EXEC`, `GET`. The unmodified L06 copy, run with `K2L04_STEP_TIMEOUT_MS=5000`, fails with `quá 5s chờ`. After the change it records `QUEUED`, `1) (integer) 2` and `"2"`; that run happens in T3.1.

Verify:
- `node --check $P/verify/run-lab.mjs && echo OK` → `OK`.
- `node $P/verify/run-lab.mjs $P/verify/fixtures/x.redis --region a --ct advance-be-redis; echo rc=$?` → `rc=2`.
- The same command with `--ct quan-ly-hop-dong-postgres-1` → `rc=2`.

**T2.3 `rl-model.mjs` and the frozen summary**

Goal: an independent oracle for every replay decision.

Steps:
1. `--gen` prints the 45 trace rows from the plan's segment table.
2. `--rows --algos a,b [--trace f]` prints the `replay.sh` format, `ts client seg <algo>=a/d/r …`. It uses the integer formulas of T3.3.
3. `--summary` prints the `sum.awk` format:
   - segments in the order A B B2 C D1 D2 S9;
   - `vs_log` only when `log` is among the algos;
   - `max_delay_ms` only for `lk`.
4. Copy the plan's 12 lines into `expected-rl-summary.txt`.

Verify:
- `node $P/verify/rl-model.mjs --gen | wc -l` → `45`.
- `diff <(node $P/verify/rl-model.mjs --summary --algos fw,log,swc,lk,tb,tbi) $P/verify/expected-rl-summary.txt && echo SAME` → `SAME`.

**T2.4 `verify-guide.mjs`**

Goal: L06's V01–V21 plus the new rules.

Steps:
- **Constants.** Point LABS and GUIDE at this lesson; slides 1–39, stages 1–8, 9 widgets, V01 limit 520 KB. V03 uses the contract §5 sections.
- **V07.** Also skips `sql> ` lines.
- **V09.** Requires the `k2l04-` prefix and flags any `l06-` key.
- **V12.** Adds `dl.glossary`, which must come before the stage's first `pre[data-cmd]`.
- **V15.** Adds `PGPASSWORD|password=|postgres://[^ ]*@`.
- **V16.** Ignores text inside «…» and the constant 0.81.
- **V17 (lint)** fails a lab file (except `my-*`) on: a key without `k2l04:` (`.redis`, redis-cli args, `sh -c`, awk `print`, `printf`, Lua literals); a container other than the three K2L04 names or PG with `psql`/`pgbench` (any `advance-be-redis` outside comments); `6380`, a publish other than `127.0.0.1:6381:6379`, `localhost`; a destructive command (`FLUSHALL|FLUSHDB|CONFIG SET maxmemory*|SHUTDOWN`, `docker kill|stop|restart|rm|pause|unpause|network connect|disconnect`) unless the target is scratch and the region's first line is `echo "→ advance-be-k2l04-scratch"`, or a tool line tagged `# guard-main`; `CONFIG SET` without restore; `redis-benchmark -t` or without a `k2l04:` key; `pgbench` without `-n -f`, with `-i`/`-d`, `-c > 8`, `-T > 5` or a database other than positional `advance_be_lab`; SQL writes outside `k2l04_counter` or `ALTER SYSTEM|pg_reload_conf|pg_terminate_backend|pg_cancel_backend`; secrets, `$RANDOM`, `prune`; `EVAL|EVALSHA|--eval|SCRIPT LOAD` outside stems `02-`…`08-`, `hw-`, `replay.sh`; a tool script without line 2 `export MSYS_NO_PATHCONV=1` and a `HERE=` line.
- **V18.** Identity headers equal the LABS files.
- **V22 (`--runs`).** In `03-windows.replay` and `04-buckets.replay`, the row keys equal `traffic.tsv` and `rl-model --gen`. Every row equals `rl-model --rows --trace $L/traffic.tsv`.
- **V23.** `<img src>` never starts with `data:` and always starts with `../../Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/assets/04_Caching/`.
- **`--selftest`.** Add fixtures for V22, V23 and `sql>` skipping.

Verify:
- `node $P/verify/verify-guide.mjs --selftest; echo rc=$?` → `rc=0`.
- `node $P/verify/verify-guide.mjs --lint; echo rc=$?` → `rc=0`. The labs dir does not exist yet, so its absence must not count as an error.

**T2.5 `expected.tsv` and `deviations.md`**

Steps:
1. Columns `id run slides regex claim chip status`. One row per plan matrix row: the K and H groups expand to 9 and 3 rows. All rows start as `expect`.
2. Use named groups and predicates (`⇒ ratio(a,b)>=5; same:<run>`). Summary rows quote the frozen lines literally.
3. If S7 failed, drop R30t; the RED count is then 59.
4. `deviations.md` gets the L06 header only.

Verify:
- `node $P/verify/verify-guide.mjs --runs 2>&1 | grep -c 'missing run'` → `60` (59 without R30t).
- `awk -F'\t' 'NR>1 && $6!="–"' $P/verify/expected.tsv | wc -l` → `27`.

**T2.6 `check.sh`**

Goal: learner-facing lab invariants. It is a tool script, reads nothing under `plans/`, prints `✔|✘|– Cnn mô tả · chi tiết`, and exits with the number of ✘.

Rows:
- C01 main: `redis:7.2.3`, running, `redis_version:7.2.3`, `--appendonly no`, network `advance-be-k2l04`, `/lab` read-only from LABS, `/data` on `advance-be-k2l04-data`.
- C02 cluster and C03 scratch: `–` when absent; otherwise image, flags, network, no published port (C02 also needs `cluster_state:ok`).
- C04: every key on main starts `k2l04:`. On ✘, give a scoped UNLINK hint, never FLUSHALL.
- C05: the seed values.
- C06: no `k2l04:barrier:*` key.
- C07: only main publishes, and only `127.0.0.1:6381`.
- C08: the host TCP run_id equals the `docker exec` run_id.
- C09: `k2l04_counter.post_count` has 1000 rows. `–` when PG is down or the schema is absent.

Red-first: no containers exist yet.

Verify: `bash $L/check.sh; echo rc=$?` → shows `✘ C01`, `– C02`, `– C03`, `– C09`; last line `rc=6`.

**T2.7 `negative-tests.sh`**

Goal: prove the checks bite. 29 cases; a missing target prints SKIP.
- **guide:** a char in `pre[data-cmd]` → V05; b `b.m` not in run → V07; c `l06-` storage key → V09; d slide 14 removed, e slide 20 chip changed → V04; f external script → V10; g `data:` image → V23; h unescaped innerHTML → V19; i quiz `why` without run → V11; j number not in cited run → V16.
- **labs:** k corrupted replay → R13; l hand-edited run → M01; m `SET foo 1`, n `6380`, o `docker exec advance-be-redis redis-cli PING`, p `redis-benchmark -t get`, q `pgbench -i`, r `UPDATE public.x SET a=1`, s `FLUSHALL` on main, w `$RANDOM`, y `docker volume pr`+`une` → V17; t Lua byte → V18; u trace ts, v flipped decision → V22; x deviation without entry → D01; fp doctored baseline → `--compare` rc 1.
- **data:** z fake number in `w4.json` → DATA.
- **hw:** hw1 bad fixture ✘ exactly H2/H4/H6; hw2 scaffold ✘ H0.

Verify: `bash $P/verify/negative-tests.sh --labs-only | tail -1` → `N/N` (every non-SKIP case ✔).

**T2.8 `rerun-gate.mjs` and `widget-smoke.mjs`**

Steps:
1. The rerun gate masks numbers for:
   - commands matching `INFO|MEMORY|redis-benchmark|pgbench|PTTL|date|TIME`;
   - the tokens `ms= median_ tps lock= other= samples= lock3= max_lock=`.

   It drops empty reply lines and `# ` header lines.
2. widget-smoke defaults `--guide` to GUIDE. On W1 it types each recorded key from `runs/01-cluster.keyslot.txt`. On W3 and W5 it compares the shown totals with the data files.

Verify:
- `node $P/verify/widget-smoke.mjs --help | grep -c widget-smoke` → ≥ `1`.
- `node --check $P/verify/rerun-gate.mjs && echo OK` → `OK`.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| selftest | rc 0 | T2.4 |
| model = plan | `SAME` | T2.3 |
| runs before labs | 60 × `missing run` | T2.5 |
| check before containers | `rc=6` | T2.6 |
| runner guard | `rc=2` ×2 | T2.2 |
| lab negatives | non-SKIP ✔ | T2.7 |

## Risks and rollback
If a number in the plan is wrong, T2.3 fails here, before any run exists.

Rollback: delete the phase's `$P/verify/*` files and `$L/check.sh`.

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

=== FILE: phase-03-containers-labs-runs.md ===
---
phase: 3
title: "Containers, labs, recorded runs"
status: pending
priority: P1
effort: 4h
dependencies: [2]
---

# Phase 03 — Containers, labs, recorded runs

## Goal
Write every learner lab file, record all runs serially, and reach GREEN on `--runs`, `--lint`, `check.sh`, the rerun gate and the fingerprint compare.

## Files to create/modify
Owner: controller only. Runs are strictly serial.

`D:/study/advance-be/labs/k2-lesson-04-caching/`: `00-containers.sh`, `00-seed.redis`, `99-cleanup.sh`, `traffic.tsv`, `replay.sh`, `{sum,bench,median,locks}.awk`, `01-fundamentals.{sh,redis}`, `01-cluster.redis`, `02-tools.redis`, `02-race.{A,B}.redis`, `02-race-lua.{A,B}.sh`, `03-windows.{sh,redis}`, `04-buckets.{sh,redis}`, `04-leaky.{A,B}.sh`, `05-{schema,activity,stats,drop}.sql`, `05-{hot-row,spread}.pgbench`, `05-counter.{sh,redis}`, `06-unread.{sh,redis}`, `07-share.{A.sh,B.redis,sh,redis}`, `08-delay.{A,B}.redis`, `08-practices.{sh,redis}`, and `lua/{take-token,fixed-window,sliding-log,sliding-counter,leaky-meter,leaky-enqueue,token-bucket,token-interval,delay-claim,bloom-add,bloom-check}.lua`.

Plan folder: `verify/record-all.sh`, `runs/*.txt`, `runs/manifest.tsv`, `verify/deviations.md`.

## Containers
All use `redis:7.2.3` (local image, no pull) on network `advance-be-k2l04`.

| Name | Publish | Mounts | Args |
|---|---|---|---|
| `advance-be-k2l04-redis` | `127.0.0.1:6381:6379` | `LABS:/lab:ro`, volume `advance-be-k2l04-data:/data` | `redis-server --appendonly no` |
| `advance-be-k2l04-cluster` | none | `LABS:/lab:ro`, `--tmpfs /data` | `--cluster-enabled yes --cluster-config-file nodes.conf --appendonly no --save ""`, then `CLUSTER ADDSLOTSRANGE 0 16383` |
| `advance-be-k2l04-scratch` | none | `--tmpfs /data` | `--appendonly no --save ""`. This is the only container where FLUSHALL, kill and pause are allowed. |

## Tasks

**T3.1 Lifecycle scripts**

Goal: idempotent create, reset and restore that never touch L06.

Steps:
1. Write `00-containers.sh` from L06's copy, keeping line 2 and the `HERE=` line. Subcommands: `up main|cluster|scratch`, `down cluster|scratch` (never main), `status`.
2. Guards:
   - accept only the three names;
   - refuse 6380 (`# guard-port`) and any publish other than `127.0.0.1:6381:6379`;
   - before creating main, check that `netstat -ano | grep ':6381 ' | grep LISTENING` is empty. Otherwise print the owner and exit 2.
3. Drift in image, Cmd, network, ports or mounts triggers a recreate. Main is recreated with stop + `rm -v`; the named volume survives. Print C07 and C08 after `up main`.
4. Write `99-cleanup.sh` as described in plan Rollback. Do not run it.
5. Bring everything up: `bash $L/00-containers.sh up main && bash $L/00-containers.sh up cluster && bash $L/00-containers.sh up scratch`.
6. Run the MULTI fixture: `node $P/verify/run-lab.mjs $P/verify/fixtures/multi.redis --region a --out fx.multi`. Check it, then delete the file and its manifest line.

Verify:
- `docker ps --filter name=advance-be-k2l04- --format '{{.Names}} {{.Ports}}' | sort` → exactly 3 lines; only `advance-be-k2l04-redis` shows `127.0.0.1:6381->6379/tcp`.
- `grep -c QUEUED $P/runs/fx.multi.txt` (before the delete) → ≥ `1`.

**T3.2 Seed**

Goal: an idempotent start state.

Steps: `00-seed.redis` UNLINKs `k2l04:bc:last k2l04:bc:feed k2l04:bc:read k2l04:bench:k`, then runs:
- `SET k2l04:bc:last 6`
- `ZADD k2l04:bc:feed 1 n1 2 n2 3 n3 4 n4 5 n5 6 n6`
- `ZADD k2l04:bc:read 4 uA 6 uB`
- `SET k2l04:bench:k v`

It never touches `my:` or `hw:` keys.

Verify (after `bash $P/verify/record-all.sh setup`): `node $P/verify/verify-guide.mjs --runs 2>&1 | grep -cE '^C0[ab] '` → `0`.

**T3.3 Lua scripts**

Goal: integer, deterministic limiters.

Common rules:
- Comment header in Vietnamese.
- Keys come only from `KEYS[]`. Replies are integers only. No double quotes in the files.
- "now" is `tonumber(ARGV[n])`. If it is nil or empty, use `TIME` in ms: `t[1]*1000 + floor(t[2]/1000)`.

| Script | KEYS / ARGV | Logic → reply |
|---|---|---|
| take-token | hash / – | t = HGET tokens or 0; t ≥ 1 → HINCRBY −1 → 1, else 0 |
| fixed-window | key / limit, W, now | n = INCR; n == 1 → PEXPIRE W → {n ≤ limit, n, denied ? W − now%W : 0} |
| sliding-log | zset / limit, W, now, id | ZREMRANGEBYSCORE −inf now−W; c = ZCARD; c < limit → ZADD; PEXPIRE W → {a, ZCARD, denied ? oldest+W−now : 0} |
| sliding-counter | cur, prev / limit, W, now | e = now%W; x = prev·(W−e) + (cur+1)·W; x ≤ limit·W → INCR cur, PEXPIRE 2W → {a, floor(1000x/W + 0.5), denied ? W−e : 0} |
| leaky-meter | hash ml, ts / cap, leak, now | ml = max(0, ml − max(0, now−ts)·leak); ts = max(ts, now); if ml + 1000 ≤ 1000·cap: delay = floor(ml/leak + 0.5), ml += 1000 → {a, delay, retry} |
| leaky-enqueue | list / cap, item | LLEN < cap → RPUSH → 1, else 0 |
| token-bucket | hash mt, ts / cap, rate, [now], [n=1] | new key: mt = 1000·cap; mt = min(1000·cap, mt + max(0, now−ts)·rate); ts = max(ts, now); g = min(n, floor(mt/1000)); g ≥ 1 → mt −= 1000g, else retry = ceil((1000 − mt)/rate); PEXPIRE ceil(1000·cap/rate) → {g, floor(mt + 0.5), retry} |
| token-interval | hash t, i / cap, I, [now] | i = floor(now/I); stored i ≠ i → t = cap; t ≥ 1 → t−1 → {a, t, denied ? I − now%I : 0} |
| delay-claim | zset, list / – | L06 logic (TIME seconds, ZRANGE BYSCORE LIMIT 0 1, ZREM, RPUSH) → member or nil |
| bloom-add / bloom-check | bitmap / item, m, k | h = sha1hex(item); pos_i = tonumber(sub(h, 8i+1, 8i+8), 16) % m for i < k; SETBIT / GETBIT → bits newly set / 1 or 0 |

Verify: `node $P/verify/verify-guide.mjs --lint; echo rc=$?` → `rc=0`.

**T3.4 Helpers**

Goal: one traffic generator, one replay, one summary.

Steps:
1. `replay.sh` runs inside main as `sh /lab/replay.sh <algos>`, with `TRACE` defaulting to `/lab/traffic.tsv`.
   - It first UNLINKs `k2l04:rl:r:*` via `--scan`, then prints the header `ts client seg <algos>`.
   - For each row it appends ` <algo>=a/d/r`, with w = ts/10000:

| Algo | KEYS | ARGV |
|---|---|---|
| fw | `k2l04:rl:r:fw:{c}:<w>` | `5 10000 ts` |
| log | `…:log:{c}` | `5 10000 ts ts-c` |
| swc | `…:swc:{c}:<w>`, `…:<w−1>` | `5 10000 ts` |
| lk | `…:lk:{c}` | `5 0.5 ts` |
| tb | `…:tb:{c}` | `5 0.5 ts 1` |
| tbi | `…:tbi:{c}` | `5 10000 ts` |

   - Last line: `mem <algo>=<MEMORY USAGE … SAMPLES 0>` for s7.
2. `sum.awk` echoes its input, then prints the summary and passes the `mem` line through.
3. `bench.awk -v tag=…` prints `tag= median_rps= median_p50= invalid= n=`. A value is invalid when rps ≤ 0 or rps > 5e7. It uses insertion sort, no `asort`.
4. `median.awk` turns `ms=` lines into `tag= median_ms= n=`.
5. `locks.awk` turns `lock=N other=N detail=…` lines into `tag= samples= lock3= max_lock=`.

Verify: `bash -n $L/replay.sh && echo OK` → `OK`.

**T3.5 Stage regions**

Goal: the lab text behind every matrix run. Every `.sh` region starts with `set -u`. Data comes only from readable `seq | awk | redis-cli` pipes.

- **Stage 1**
  - `01-fundamentals.sh#bench`:
    - `INFO cpu` used_cpu lines;
    - `for i in 1 2 3; do docker exec advance-be-k2l04-redis redis-benchmark -q -n 100000 SET k2l04:bench:k v; done | awk -v tag=set -f labs/k2-lesson-04-caching/bench.awk`;
    - the same for `GET k2l04:bench:k`;
    - `INFO cpu`, `io_threads_active`, `CONFIG GET maxclients`.
  - `#keys`: UNLINK `k2l04:k:*`; `used_memory`; `seq 1 100000 | awk '{print "SET k2l04:k:" $1 " v"}' | docker exec -i advance-be-k2l04-redis redis-cli --pipe | tail -1`; `used_memory`.
  - `#spread`:
    - `seq 1 3000 | awk '{print "CLUSTER KEYSLOT k2l04:dist:" $1}'` piped to cluster redis-cli;
    - an awk bucket count per node range (0–5460, 5461–10922, rest);
    - SET 3 `{s7}` keys, then `CLUSTER COUNTKEYSINSLOT` on the slot of `s7`.
  - `01-cluster.redis` (`#@ ct advance-be-k2l04-cluster`):
    - `keyslot`: `CLUSTER INFO`, then KEYSLOT of untagged and `{post:1}` keys and two `{s7}` replay keys;
    - `crossslot`: SET likes 10 and views 99, then MGET untagged and MGET tagged.
- **Stage 2**
  - `02-tools.redis#lua-basics`:
    - `EVAL "return {KEYS[1], ARGV[1]}" 1 k2l04:demo:x hello`;
    - `EVAL "return redis.call('TIME')" 0`;
    - `SCRIPT LOAD "return 1"`, then EVALSHA of that sha;
    - `EVAL "return redis.call('INCR')" 0`.
  - `02-race.A/B.redis`, regions `naive` and `watch`:
    - each `-reset` region does `HSET k2l04:race:bucket:{s7} tokens 1` and UNLINKs the barrier;
    - naive: HGET, sleep, `HSET … 0`. A sleeps 0.5, B 0.6;
    - watch: `WATCH`, HGET, sleep, MULTI, HSET 0, EXEC. B sleeps 0.8, then retries WATCH/HGET/UNWATCH.
  - `02-race-lua.A/B.sh#take`: `MSYS_NO_PATHCONV=1 docker exec advance-be-k2l04-redis redis-cli --eval /lab/lua/take-token.lua k2l04:race:bucket:{s7}`. B sleeps 0.2.
- **Stage 3**
  - `03-windows.sh#gen`:
    - 7 `seq … | awk '{print $1 "\t<c>\t<seg>"}' >> labs/k2-lesson-04-caching/traffic.tsv` lines (the first uses `>`);
    - `sort -n -o` on the file;
    - `wc -l <` the file.
  - `#replay`: `docker exec advance-be-k2l04-redis sh /lab/replay.sh fw log swc | awk -f labs/k2-lesson-04-caching/sum.awk`.
  - `#log-memory`: ZADD 100 and 1000 entries; MEMORY USAGE `SAMPLES 0` and OBJECT ENCODING for each.
  - `#live-fixed` (`#@ timed`, PTTL-aligned, kongming Q2.2):
    - `SET k2l04:rl:live:fw:{s7} 0 PX 10000 NX`;
    - `until` PTTL < 400, then `t1=$(date +%s%3N)`;
    - an in-container loop of 5 × (`SET … PX 10000 NX` + `INCR`), then `echo pttl_after1=`;
    - `until` PTTL < 0, then the same loop, then `pttl_after2=`;
    - `span_ms=`.
  - opt `#live-log` (timed): 6 × `--eval /lab/lua/sliding-log.lua k2l04:rl:live:log:{s7} , 5 10000 "" r$i`.
  - opt `#cluster-lua`: `--eval` of sliding-counter on the cluster with untagged and then tagged keys.
  - `03-windows.redis`:
    - `fixed-plain`: `SET … PX 10000 NX`, INCR ×6, PTTL;
    - `incr-bug`: INCR, TTL, UNLINK, `SET … 0 EX 10 NX`, INCR, TTL, UNLINK;
    - `kiem-chung`.
- **Stage 4**
  - `04-buckets.sh#replay`: `replay.sh fw log swc lk tb tbi`.
  - `#live-token` (timed): 8 × `--eval /lab/lua/token-bucket.lua k2l04:rl:live:tb:{s7} , 5 0.5`; `sleep 2.2`; 2 more calls; HLEN. This is the production `TIME` form.
  - `#batch-rtt` (one connection per §9.7):
    - `S=$(docker exec advance-be-k2l04-redis sh -c 'redis-cli SCRIPT LOAD "$(cat /lab/lua/token-bucket.lua)"')`;
    - UNLINK `k2l04:rl:bt:{s7}`;
    - 3 × `redis-benchmark -q -c 1 -n 20000 EVALSHA "$S" 1 k2l04:rl:bt:{s7} 100000000 1 0 1` piped to bench.awk (tag n1);
    - the same with `0 10` (tag n10);
    - `HGET … mt`.
  - `#batch-share`:
    - three calls `, 10 1 0 5` as A, B and C;
    - one call `, 10 1 10000 10` as D;
    - echo `A= B= C= C_retry_ms= D=`, then `max_admit_in_1s=$((gD+gA-1+gB-1))`. This shows over-admission when instances hold unused batch tokens.
  - opt `#redis-down`:
    - first line `echo "→ advance-be-k2l04-scratch"`;
    - stop scratch, then `timeout 3 redis-cli -h advance-be-k2l04-scratch PING` from main → `stopped_rc= ms=`;
    - start scratch; pause it; `timeout 2 …` → `paused_rc= ms=`;
    - unpause; PING.
  - `04-leaky.A/B.sh#queue`:
    - reset UNLINKs the queue and the barrier;
    - A: 8 × `--eval /lab/lua/leaky-enqueue.lua k2l04:lk:q:{s7} , 5 r$i`;
    - B: `sleep 0.3`, then `redis-cli -r 6 -i 0.5 LPOP k2l04:lk:q:{s7}`. This is the fixed-rate worker.
- **Stage 5**
  - SQL: `05-schema.sql#setup` (`SET client_min_messages = warning`; `CREATE SCHEMA IF NOT EXISTS k2l04_counter`; `post_count(post_id int PK, like_count, comment_count, share_count, view_count bigint NOT NULL DEFAULT 0)`; rows 1–1000 `ON CONFLICT DO NOTHING`; `SELECT count(*)`), `#read` (slide 20 SELECT, DBX only), `#kiem-chung`; `05-activity.sql` (`lock=<n> other=<n> detail=…` for `application_name='pgbench' AND state='active'`); `05-stats.sql#stats` (`n_tup_upd, n_tup_hot_upd, n_dead_tup`); `05-hot-row.pgbench` (slide 20 UPDATE on `post_id = 1`); `05-spread.pgbench` (`\set pid random(1, 1000)` + same UPDATE); `05-drop.sql` (`DROP SCHEMA IF EXISTS k2l04_counter CASCADE`).
  - `05-counter.sh#pg-burst`, blocks `hot`, `spread`, `hot-async`, each: print `before=`; background sampler `(for i in $(seq 10); do sleep 0.4; docker exec -i quan-ly-hop-dong-postgres-1 psql -X -At -U postgres -d advance_be_lab -f - < labs/k2-lesson-04-caching/05-activity.sql; done | awk -v tag=<t> -f labs/k2-lesson-04-caching/locks.awk) &`; `MSYS_NO_PATHCONV=1 docker exec -i [-e PGOPTIONS='-c synchronous_commit=off'] quan-ly-hop-dong-postgres-1 pgbench -n -f /dev/stdin -c 8 -T 5 -U postgres advance_be_lab < labs/k2-lesson-04-caching/05-<hot-row|spread>.pgbench` (S8 form); `wait`; print `after=`.
  - `#redis-incr`: 3 × `redis-benchmark -q -c 8 -n 100000 HINCRBY k2l04:cnt:post:1 like 1` piped to bench.awk; HGET; OBJECT ENCODING.
  - `#write-behind` (scratch, first-line echo):
    - PG `UPDATE … SET like_count = 0 WHERE post_id = 2 RETURNING 'pg_like=' || like_count`;
    - 500 INCR of `k2l04:wb:delta:post:2`;
    - `v=$(… GETDEL …); echo flushed=$v`, then PG `+ $v`;
    - 300 INCR, `pending=`;
    - `docker kill` and `docker start` scratch, wait for PONG;
    - `after_restart=`, then PG `pg_like=`.
  - `#layouts` (scratch): for strings, hash, bucket100 and bucket200:
    - `FLUSHALL`, `b=used_memory`;
    - 10000 posts × 4 counters via `--pipe`;
    - `bytes_per_post=$(( (a-b)/10000 ))` plus OBJECT ENCODING of one key.

    Then `CONFIG GET hash-max-listpack-entries`.
  - opt `#flush-race` (scratch): `redis-benchmark -c 4 -n 200000 INCR k2l04:wb:race &` plus 40 flushes, once with GET+DEL and once with GETDEL. Print `flushed= left= lost=`.
- **Stage 6**
  - `06-unread.sh#fanout`:
    - 3 broadcasts, each `seq 1 100000 | awk '{print "HINCRBY k2l04:unread:fanout u" $1 " 1"}' | … --pipe | tail -1`;
    - host ms per broadcast via `date +%s%3N`, piped to median.awk;
    - HGET u42, HLEN, MEMORY USAGE `SAMPLES 0`.
  - `06-unread.redis#pointer`:
    - COPY the `bc:*` seed keys to `bc:demo:*` with REPLACE;
    - GET last; ZSCORE uA; `ZCOUNT feed (4 +inf`;
    - INCR last; ZADD n7; ZCOUNT;
    - `ZADD read GT 7 uA`, then `GT 5 uA`; ZSCORE;
    - HSET read hash uA 7, then 5; HGET.
  - `#pointer-memory` (`.sh`): 100000 pointers via `--pipe`; ZCARD; MEMORY USAGE `SAMPLES 0`; OBJECT ENCODING.
- **Stage 7**
  - `07-share.A.sh#reply`:
    - reset;
    - RPUSH the barrier, then RPUSH `k2l04:share:req msg-1`;
    - `redis-cli -r 15 -i 0.1 GET k2l04:share:pool:msg-1`;
    - RPUSH msg-2; `BLPOP k2l04:share:reply:msg-2 5`.
  - `07-share.B.redis#reply`:
    - BLPOP barrier; BLPOP req; sleep 0.8; `SET k2l04:share:pool:msg-1 '{"ok":1}' EX 30`;
    - BLPOP req; sleep 0.8; `RPUSH k2l04:share:reply:msg-2 '{"ok":2}'`; EXPIRE 30.
  - opt `07-share.sh#tracking`: the S7 command.
- **Stage 8**
  - `08-delay.A/B.redis#claim`:
    - reset: `ZADD k2l04:delay:orders 1704790435 o1 4102444800 o2 4102444800 o3`;
    - both clients: `ZRANGE … -inf 2000000000 BYSCORE LIMIT 0 1`;
    - A ZREMs and RPUSHes; B ZREMs later, then LRANGE and ZRANGE.
  - `08-practices.sh`:
    - `#delay-lua`: reset; `--eval /lab/lua/delay-claim.lua k2l04:delay:orders k2l04:delay:done` ×2; ZRANGE; LRANGE.
    - `#hll`: for N in 100, 1000, 10000 and 100000, `PFADD k2l04:hll:n<N> ip$1` via `--pipe`. Print `n= count= strlen= mem= enc=` per N, then `CONFIG GET hll-sparse-max-bytes`.
    - `#pfmerge`: day d holds ip `(d−1)·1000+1 … +5000`; PFMERGE week; PFCOUNT week and each day.
    - `#bitmap`:
      - SETBIT fiction for `seq 0 2 99999` and adventure for `seq 0 3 99999`;
      - BITOP AND; BITCOUNT ×3; GETBIT 42/42/7; STRLEN; MEMORY USAGE;
      - a Set of the evens for comparison;
      - `SETBIT k2l04:seg:sparse 9999999 1`, then STRLEN, MEMORY USAGE and BITCOUNT.
    - `#bloom`:
      - SCRIPT LOAD of the two scripts;
      - add `user1..10000` via awk EVALSHA lines (`50000 3`);
      - `members_hit=` (count of `^1$` over members) and `fp= probes=10000` (over `nobody1..10000`);
      - BITCOUNT, STRLEN, MEMORY USAGE, plus a Set of the users for comparison.
- **kiem-chung.** Each stage's `kiem-chung` region holds the plain read commands of its K row.

Verify: `node $P/verify/verify-guide.mjs --lint; echo rc=$?` → `rc=0`.

**T3.6 Record**

Goal: every run, recorded serially.

Steps:
1. Write `verify/record-all.sh` from L06. Order: `setup s1 … s8 gates`. Bring the extras up before stages 1 and 5. A/B pairs run with `--rep 3`.
2. Run `bash $P/verify/record-all.sh`.
3. If a timed region or benchmark row fails only on `step=yes` or `invalid>0`, re-record that region. Stop after 3 attempts in total.
4. Any other failing row goes to the Failure Protocol. Kongming decides between fixing the lab (then re-record) and a `deviations.md` entry (claim, measured value, new narrative or chip). Never edit a run.

Verify: `node $P/verify/verify-guide.mjs --runs; echo rc=$?` → `rc=0`.

**T3.7 Gates**

Verify:
- `node $P/verify/rerun-gate.mjs | tail -1` → contains `0 region`.
- `bash $L/check.sh; echo rc=$?` → `rc=0` and no `✘`.
- `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`.
- `bash $P/verify/negative-tests.sh --labs-only | tail -1` → `N/N` with `0 SKIP`.

## Test matrix

| Test (from phase 02) | Expected | Command |
|---|---|---|
| seed idempotent | C0b = C0a | `--runs` |
| matrix incl. M01, D01, V18, V22 | rc 0 | `--runs` |
| lint | rc 0 | `--lint` |
| rerun | 0 diffs | rerun gate |
| L06/foreign/PG untouched | rc 0 | fingerprint `--compare` |
| lab negatives | ✔, 0 SKIP | `--labs-only` |

## Risks and rollback
Destructive commands run only on scratch, and the lint enforces it. To recover an interrupted region, run its reset region plus `00-seed.redis`.

Rollback: `bash $L/99-cleanup.sh`, then delete `$L` and `$P/runs`.

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

=== FILE: phase-04-widget-data-homework-claims.md ===
---
phase: 4
title: "Widget data, homework, drill and source claims"
status: pending
priority: P1
effort: 1h
dependencies: [3]
---

# Phase 04 — Widget data, homework, claims

## Goal
Produce every data file that the fragments read, a homework with a runnable self-check, and sourced claim lists.

## Files to create/modify
Owner: controller.
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/`: `verify/make-widget-data.mjs`, `runs/data/w1–w9.json`, `runs/data/derived.json`, `runs/driver-claims.txt`, `runs/source-claims.txt`, `verify/hw-bad-fixture.lua`.
- `D:/study/advance-be/labs/k2-lesson-04-caching/`: `lua/hw-store-bucket.scaffold.lua`, `lua/hw-store-bucket.solution.lua`, `hw-check.sh`, `driver-drill.ai-snippet.ts`.

## Tasks

**T4.1 Widget data**

Goal: widgets read only recorded data.

Steps: `make-widget-data.mjs` reads the run files. Constants go under `_params`.

| File | Source runs |
|---|---|
| w1 | keyslot |
| w2 | three race timelines |
| w3 | stage-3 replay rows and sums |
| w4 | stage-4 replay, batch-share, batch-rtt |
| w5 | per-algorithm comparison and memory |
| w6 | pg-burst, redis-incr, layouts |
| w7 | fanout, pointer-memory |
| w8 | reply timeline |
| w9 | hll, pfmerge, bloom |

`derived.json` holds `{name, value, formula, inputs, sources}` entries for:
- bytes per key and GB at 250M keys;
- bytes per log entry;
- tokens per second for batch 1 vs 10;
- fan-out seconds at 10M users (median_ms × 100 / 1000);
- pointer GB at 10M users;
- HLL error % per N;
- the Bloom fp predicted from the measured fill, (bitcount/50000)^3 × 10000.

Verify: `node $P/verify/verify-guide.mjs --data; echo rc=$?` → `rc=0`.

**T4.2 Homework (FR-M2-05 shape, §9.10 default)**

Goal: Đạt writes a per-store Lua token bucket from a 50/50 scaffold.

Steps:
1. Interface: KEYS[1] = `k2l04:hw:bucket:{<store>}`; ARGV capacity, rate/s, now_ms (`""` → `TIME`); reply {allowed, floor(tokens), retry_after_ms}; hash fields `mt`, `ts` given.
2. Scaffold blanks `__1__`…`__6__`: new bucket full; elapsed clamp; refill capped; `ts` never backwards; allow and decrement; `retry_after_ms` + PEXPIRE.
3. `hw-check.sh` (tool script): `HW_LUA` defaults to `$HERE/lua/my-store-bucket.lua`, loaded with `docker exec -i advance-be-k2l04-redis redis-cli -x SCRIPT LOAD < "$HW_LUA"`; cleans `k2l04:hw:*` before and after; rc = number of ✘. Checks:
   - H0 loads, one call returns 3 items;
   - H1 30 calls on `{s7}` (`10 0.01`, TIME) → exactly 10 allowed, 20 denied;
   - H2 all 20 denials retry > 0;
   - H3 first call on `{s9}` allowed;
   - H4 PTTL of `{s7}` in [1, 1000000];
   - H5 `{h5}`: 10 at now=1000 allowed; at 101000 one allowed, then denied;
   - H6 `{h6}`: 10 at now=100000; at 40000 → 0 and `HGET mt` ≥ 0; at 150000 → 0.
4. `verify/hw-bad-fixture.lua` has no clamp, writes `ts = now`, sets no PEXPIRE and returns retry 0.
5. Record `HW_LUA=$L/lua/hw-store-bucket.solution.lua node $P/verify/run-lab.mjs $L/hw-check.sh --out hw-check.solution`. Record the same with the bad fixture (`hw-check.bad`) and with the scaffold (`hw-check.scaffold`).

Verify:
- `node $P/verify/verify-guide.mjs --runs 2>&1 | grep -cE '^H[123] '` → `0`.
- `bash $P/verify/negative-tests.sh --hw-only | tail -1` → starts with `2/2`.

**T4.3 Driver drill and claims**

Goal: an optional NestJS reading drill with sourced API claims.

Steps:
1. `driver-drill.ai-snippet.ts` is about 70 lines: a NestJS 10 `RateLimitGuard` on node-redis 6.3.0 (the version pinned by L06). It has six seeded mistakes:
   1. `incr` then `expire`;
   2. an in-memory `Map` fallback when several instances run;
   3. a fixed window for login;
   4. a 429 without `Retry-After`;
   5. `keys('rl:*')`;
   6. a Redis error rethrown as 500 instead of a deliberate fail-open.

   It also has one correct decoy: a `{storeId}` hashtag. No `package.json` is added.
2. `runs/driver-claims.txt` lists the URL, version and quoted line for each API claim, using unpkg `@redis/client` d.ts, docs.nestjs.com and `@nestjs/throttler` d.ts. Claims about Redis behaviour cite run ids.

Verify: `grep -c '^https' $P/runs/driver-claims.txt` → ≥ `6`.

**T4.4 Source claims**

Goal: evidence for every "đọc mã nguồn" and "chưa đo trực tiếp" note.

Steps: `runs/source-claims.txt` holds URL + version + quote for each of:
- `src/pubsub.c@7.2.3` `listSearchKey`;
- `config.c` `maxclients` 10000 and `hash-max-listpack-entries` 512;
- redis.io HLL 0.81 %;
- the redis.io FAQ on 2^32 keys and 250M;
- redis-cli `-r` fflush and `--show-pushes`;
- the PG docs for pgbench `-d`;
- Pika, Grab segmentation, Hazelcast, chengweihu.

Register the file with `node $P/verify/run-lab.mjs --register $P/runs/source-claims.txt`.

Verify: `grep -c '^https' $P/runs/source-claims.txt` → ≥ `10`.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| data traced | rc 0 | `--data` |
| fake number (z) | RED | `negative-tests.sh --data-only` |
| homework rows H1–H3 | match | `--runs` |
| hw negatives | 2/2 | `--hw-only` |

## Risks and rollback
The homework touches only `k2l04:hw:*`.

Rollback: delete the files above.

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

=== FILE: phase-05-shell-assembler.md ===
---
phase: 5
title: "Guide shell and assembler"
status: pending
priority: P1
effort: 1h
dependencies: [2]
---

# Phase 05 — Shell and assembler

## Goal
A shell that builds with stub stages and already passes the page-level checks.

## Files to create/modify
Owner: the controller, or delegate D0 while phase 03 runs. D0's files are disjoint from labs and runs.
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/assembly/`: `shell-head.html`, `shell-css.part`, `shell-tail.html`, `assemble.mjs`, all copied from `$L06P/assembly/`.

## Tasks

**T5.1 Shell**

Goal: the L06 no-rail shell, retitled for this lesson.

Steps:
1. Changes to the copied shell:
   - title "K2 Bài 04 · Caching — đo trên máy bạn";
   - `k2l04-*` storage keys;
   - token-only CSS for `dl.glossary` and `.algogrid`;
   - a single `esc()`;
   - 39 `SLIDES` from contract §7;
   - an `EXAM` placeholder;
   - stub sections for every id in contract §5.
2. `#cach-hoc` contains:
   - the time table and the optional-item priority order;
   - the glossary;
   - setup: `bash labs/k2-lesson-04-caching/00-containers.sh up main`, then seed, then `check.sh`;
   - DBX `ADVANCE_BE_K2L04_REDIS` (127.0.0.1:6381, db 0), with the note "prompt 6379 = cổng trong container";
   - the Git Bash rules (repo root as cwd, `MSYS_NO_PATHCONV=1`, 127.0.0.1);
   - two-terminal order reset → B → A;
   - "đã gặp ở L06 chặng N" back-links;
   - a warm-up with `data-store="k2l04-warmup"`.
3. Slide images use the relative path `../../Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/assets/04_Caching/page_NN_img_MM.ext`.

Verify: `cat $P/assembly/shell-*.html $P/assembly/shell-css.part | grep -c "l06-\|lesson_06\|Bài 06 · Redis"` → `0`.

**T5.2 Assembler**

Steps:
- LABS and OUT = GUIDE;
- `STAGES = 8`, `WIDGETS = 9`;
- `labFile` also accepts `.sql`, `.pgbench`, `.tsv` and `.awk`;
- everything else stays as in L06.

Verify: `node $P/assembly/assemble.mjs --allow-stubs | head -1` → starts with `✔ đã ghi`.

**T5.3 Page checks on the stub**

Verify:
- `node $P/verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15,V23; echo rc=$?` → `rc=0`.
- `bash $P/verify/negative-tests.sh --guide-only` → cases c, d, e, f and g show `✔`; the rest SKIP.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| stale L06 strings | 0 | T5.1 |
| stub build | `✔ đã ghi` | T5.2 |
| page codes | rc 0 | T5.3 |

## Risks and rollback
Stale L06 strings are caught by V09 and the T5.1 grep.

Rollback: delete the shell files.

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

=== FILE: phase-06-fragments-sections.md ===
---
phase: 6
title: "Stage fragments (3 delegates) and shell sections"
status: pending
priority: P1
effort: 2h
dependencies: [4, 5]
---

# Phase 06 — Fragments and sections

## Goal
Write eight verified stage fragments, 32 quiz items and 9 widgets in parallel against the frozen contract. The controller writes the shell sections.

## Files to create/modify
All under `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/assembly/`, with disjoint owners:

| Owner | Files |
|---|---|
| D1 | `fragments/stage-01..03.html` + `.quiz.json`, `widgets/w1–w3.js` |
| D2 | `fragments/stage-04..05.html` + `.quiz.json`, `widgets/w4–w6.js` |
| D3 | `fragments/stage-06..08.html` + `.quiz.json`, `widgets/w7–w9.js` |
| Controller | `shell-tail.html` sections `#bai-tap`, `#driver-drill`, `#phong-van`, `#cheat-sheet` (with `id="sl-31"`), `#tham-khao`, `#tiep-theo` |

Delegates read the contract, `expected.tsv`, the runs and the labs. They never edit labs, runs, the shell or the contract; contract changes are requested from the controller.

## Fragment format (frozen)
Each `<section id="chang-N" class="stage col">` has, in order: `stage-head`, `p.goal`, `dl.wwh`; `dl.glossary` (every new command in plain Vietnamese); `.story`; `figure.slide-fig` or token-coloured SVG; `table.stats` with `b.m[data-run|data-derived]`; `.check30`; one `.sayvs` per chip slide (PART slides carry `id="sl-NN"`); code `<pre data-cmd="file#region"><code>` and runs `<!--@RUN id head=N@-->`; A/B steps as `table.walk` (reset → B → A) plus timeline; `callout teacher` (Làm mẫu); kiem-chung `pre[data-cmd]` + `table.expect`; `div.callout.challenge#chang-N-tu-lam` (PASS, self-check, answer fold); `.quiz[data-quiz=N]` of 4 × `{q, opts[4], ans, why}` citing a run. Widgets: IIFE, `run('wN')`, null guard, 44 px controls, `wN-` ids, `textContent`/`esc()` only.

| St | Story | Widget | Challenge (PASS) |
|---|---|---|---|
| 1 | 300 stores on one Redis | W1 slot calculator ✓ vs recorded | `k2l04:my:{s7}:cart` and `:lock` share a slot; MSET/MGET works on the cluster |
| 2 | two POS race for store 7's last token | W2 naive/WATCH/Lua lanes | `lua/my-take-two.lua`: from 3 tokens one client gets 2, the other 0, HGET 1 |
| 3 | voucher bot hits the window edge | W3 trace × fw/log/swc grid + estimator slider (prev × 0.7 + cur) | add a burst at 39.6–40.1 s to `my-traffic.tsv`, predict, replay with `TRACE`; predictions = output |
| 4 | stuck POS of store 7; FR-M2-05 | W4 bucket/leaky levels + batch slider; W5 six-way table | tune the live bucket to "10 burst, 30/min": 10 allowed, then retry ≈ 2000 ms |
| 5 | a Threads like burst on one row | W6 PG vs Redis bars, layout chooser (≤ 512 fields) | bucket size for 1M posts; listpack and fewer bytes per post than the hash layout |
| 6 | 10M users, one broadcast | W7 N slider → fan-out time and memory | uNew unread = last; mark-all-read with GT |
| 7 | instance A waits for B's reply | W8 poll vs block lanes | `BLPOP` msg-3 with no reply → nil after ≈ 2 s |
| 8 | unpaid orders, unique visitors, "username taken" | W9 HLL band, Bloom p ± 3σ vs recorded | Bloom for 1 % FP at n = 10000 (m, k from the formula): fp in band, 0 FN |

Stage 4 also covers:
- 429 + `Retry-After: ceil(ms/1000)`;
- a fail-open vs fail-closed table for ADR-010 (Đạt decides);
- the "ts lùi" trap.

Stage 5 labels Pika and auto-tiering "chưa đo trực tiếp".

## Tasks

**T6.1 Delegates D1–D3**

Steps: spawn three delegates with this brief, their file list, the contract and the run list. Each ends with the status block.

Verify: `for n in 1 2 3 4 5 6 7 8; do node $P/verify/verify-guide.mjs --fragment $P/assembly/fragments/stage-0$n.html >/dev/null 2>&1 || echo FAIL $n; done | grep -c FAIL` → `0`.

**T6.2 Shell sections (controller)**

Steps:
- `#bai-tap`:
  - the H0–H6 meanings;
  - copy the scaffold to `my-store-bucket.lua`, then run `bash labs/k2-lesson-04-caching/hw-check.sh`;
  - the solution in a fold;
  - the "network I/O models" reading (select/poll/epoll, L06 chặng 1).
- `#driver-drill`: the snippet, 6 `k2l04-drill-*` inputs, and an answer fold that cites `driver-claims`.
- `#phong-van`: 10 EXAM items, each answer citing runs: boundary burst, log vs counter, token vs leaky, INCR+EXPIRE, batch tokens, fail-open, hot row, write-behind loss, HLL, Bloom.
- `#cheat-sheet`: commands, complexity and the six-way table with `b.m` cells, plus the slide-31 recap with `id="sl-31"`.
- `#tham-khao`: the source-claims URLs.
- `#tiep-theo`:
  - FR-M2-05: the homework script, `Retry-After`, NFR-10 env limits;
  - FR-M2-06: hub on 6380, text only, never run;
  - ADR-007/010;
  - FR-M5-04 → sliding log;
  - the 128 MB budget vs the measured memory;
  - Boss Challenge 2.3: Lua token bucket for `sap-master-data` and `dashboard` on `quan-ly-hop-dong`;
  - next steps: OmniPOS M2, then Boss 2, then Cụm 3.

Verify: `node $P/assembly/assemble.mjs >/dev/null && node $P/verify/verify-guide.mjs --only V03,V04,V11,V16; echo rc=$?` → `rc=0`.

**T6.3 Widget syntax**

Verify: `for w in $P/assembly/widgets/w*.js; do node --check "$w" || echo BAD; done | grep -c BAD` → `0`.

## Test matrix

| Test (first) | Expected | Command |
|---|---|---|
| fragment codes V05 V06 V07 V09 V12 V19 + quiz | 0 FAIL | T6.1 |
| EXAM, slide map, numbers | rc 0 | T6.2 |
| widget syntax | 0 BAD | T6.3 |

## Risks and rollback
Invented numbers are caught by V07/V16, and reworded code by V05.

Rollback: delete that delegate's files.

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

=== FILE: phase-07-assemble-verify-render.md ===
---
phase: 7
title: "Assemble, verify, render-check"
status: pending
priority: P1
effort: 0.75h
dependencies: [6]
---

# Phase 07 — Assemble, verify, render

## Goal
One built guide that passes every check, with negative tests showing that the checks bite.

## Files to create/modify
Owner: controller.
- GUIDE `D:/study/advance-be/reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html` (generated).
- Plan folder: `verify/render/`, `verify/render-dark/`, `runs/verify-full.txt`.

## Tasks

**T7.1 Build and full verify**

Verify: `node $P/assembly/assemble.mjs && node $P/verify/verify-guide.mjs && node $P/verify/verify-guide.mjs --runs && node $P/verify/verify-guide.mjs --data && node $P/verify/verify-guide.mjs --lint; echo rc=$?` → `rc=0`. Save the output as `runs/verify-full.txt` and register it with `--register`.

**T7.2 Negatives**

Verify: `bash $P/verify/negative-tests.sh | tail -1` → `29/29 ca đỏ đúng thiết kế · 0 SKIP · tổng 29 ca`.

**T7.3 Widgets**

Verify: `node $P/verify/widget-smoke.mjs --guide "$G"; echo rc=$?` → `rc=0`.

**T7.4 Render light and dark**

Steps: render with `TMP`/`TEMP` set to `$P/verify/tmp`. For dark mode, render a copy with `data-theme="dark"` placed next to GUIDE, then delete the copy.

Verify: `TMP=$P/verify/tmp TEMP=$P/verify/tmp node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "$G" --out $P/verify/render` → 0 runtime errors, 0 overflow and 0 targets < 44 px at 375/768/1440. The dark copy must give the same result with `--out $P/verify/render-dark`.

**T7.5 Size**

Verify: `stat -c %s "$G"` → ≤ `532480`.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| full verifier | rc 0 | T7.1 |
| negatives | 29/29, 0 SKIP | T7.2 |
| widgets | rc 0 | T7.3 |
| render | 0/0/0 ×2 | T7.4 |
| size | ≤ 520 KB | T7.5 |

## Risks and rollback
Wide outputs scroll inside `pre`. Fixes go into fragments or the shell, never into runs.

Rollback: regenerate the guide.

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

=== FILE: phase-08-ultra-review-fixes.md ===
---
phase: 8
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1.25h
dependencies: [7]
---

# Phase 08 — `/ak:code-review --pending --ultra --advice`

## Goal
An independent review of the guide, labs and tooling, with every verified Critical/Important finding fixed.

## Files to create/modify
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/reports/`: `code-review-ultra-reviewer-1..5.md`, `code-review-ultra-verdict.md`, `code-review-ultra-fix-status.md`.
- Fix targets: any phase 03–07 file. Only the controller edits them.

## Tasks

**T8.1 Review**

Steps: run `/ak:code-review --pending --ultra --advice` over GUIDE, LABS, `$P/verify`, `$P/assembly`, the runs (read-only), `expected.tsv` and `deviations.md`. Give the five reviewers these focus areas:
1. correctness per slide on Redis 7.2 and PG 16;
2. safety: L06 untouched, 6380, scratch-only destructive commands, schema scope, secrets;
3. trace integrity;
4. teaching format, glossary and Vietnamese;
5. mobile and a11y.

Verify: `ls $P/reports/code-review-ultra-*.md | wc -l` → `7`.

**T8.2 Fix**

Steps:
1. Fix each verified Critical/Important finding.
2. If a lab changes, re-record that region through `run-lab.mjs`. Never edit a run by hand.
3. Keep a measurement that a finding disputes, and cite its source in fix-status.
4. Run `/ak:test` only if the verdict names a coverage gap.

Verify: `grep -c 'OPEN' $P/reports/code-review-ultra-fix-status.md` → `0`.

**T8.3 Regression**

Verify: re-run T7.1–T7.4 and get their stated results. Then `bash $L/check.sh; echo rc=$?` → `rc=0`.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| reports | 7 | T8.1 |
| open findings | 0 | T8.2 |
| regression | phase 07 GREEN | T8.3 |

## Risks and rollback
To roll back a fix, re-record the region and reassemble.

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

=== FILE: phase-09-docs-final-gate-handoff.md ===
---
phase: 9
title: "Docs, final gate, handoff"
status: pending
priority: P1
effort: 0.5h
dependencies: [8]
---

# Phase 09 — Docs, final gate, handoff

## Goal
Make the guide discoverable, prove nothing outside scope changed, and leave the lab ready.

## Files to create/modify
Owner: controller. Read each file first. Every edit is one line, changed or inserted. If a quoted line differs from the file, skip that file and record it.
- `D:/study/advance-be/README.md`:
  - after line 29 (Khóa 3 guides line), insert ``- 🔬 **Labs + Guide Bài 04**: `labs/k2-lesson-04-caching/` (redis-cli, SQL/pgbench) · `reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html` ``;
  - in the tree, add the guide under line 81 and `k2-lesson-04-caching/` under `labs/`.
- Three curriculum files: `D:/study/advance-be/generate_master_curriculum_reports.py:447`, `D:/study/advance-be/reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md:419` and `…MASTER_CURRICULUM.html:1806`.
  - Replace `Slide 39 trang kèm so sánh ưu nhược điểm 5 thuật toán Rate Limiting.` with `labs/k2-lesson-04-caching/ (redis-cli + SQL/pgbench), reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html`.
  - Do not run the generator.
- L06 link, in two files: `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/shell-tail.html:219` and `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html:4532`. Wrap `K2 Bài 04 Rate Limiting` as `<a href="../Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html">K2 Bài 04 Rate Limiting</a>`.
- `D:/study/advance-be/plans/handoffs/k2-lesson-04-caching-guide-ready-<YYYYMMDD>.md`.
- Plan folder: `runs/00-fingerprint-after.txt`, `runs/final-gate.txt`.

## Tasks

**T9.1 Doc edits**

Verify:
- `grep -c "k2_lesson_04_caching_teacher_guide.html" README.md generate_master_curriculum_reports.py reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.html $L06P/assembly/shell-tail.html reports/advanced_backend/lesson_06_redis_teacher_guide.html` → every count ≥ 1.
- `node $L06P/verify/verify-guide.mjs --only V01,V02,V03,V10; echo rc=$?` → `rc=0`.

**T9.2 Final gate**

Steps:
1. `bash $P/verify/fingerprint.sh > $P/runs/00-fingerprint-after.txt`.
2. Write `runs/final-gate.txt` with one ✔/✘ row each for:
   - T7.1–T7.5;
   - the negative tests;
   - `check.sh`;
   - the fingerprint compare;
   - the L06 verifier;
   - `git status --short` against the allow-list: baseline untracked entries, GUIDE, `labs/k2-lesson-04-caching/`, `$P/`, README, the 3 curriculum files, the 2 L06 files, the handoff.

Verify:
- `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`.
- `grep -c '✘' $P/runs/final-gate.txt` → `0`.

**T9.3 Leave the lab ready**

Steps:
1. Do not run `99-cleanup.sh`.
2. `bash $L/00-containers.sh down cluster && bash $L/00-containers.sh down scratch`.
3. `grep -v '^#' $L/00-seed.redis | docker exec -i advance-be-k2l04-redis redis-cli`.

Verify: `bash $L/check.sh; echo rc=$?` → shows `✔ C01`, `– C02`, `– C03`; last line `rc=0`.

**T9.4 Handoff**

Steps: the handoff covers:
- what exists;
- how to start: `up main`, seed, `check.sh`, DBX 6381, extras per stage;
- stage times and the optional order;
- deviations;
- run dates;
- the L06 `ts` follow-up;
- the next step: OmniPOS M2, Boss 2, Cụm 3.

There is no git write step.

Verify: `ls plans/handoffs/k2-lesson-04-caching-guide-ready-*.md | wc -l` → `1`.

## Test matrix

| Test | Expected | Command |
|---|---|---|
| links | counts ≥ 1 | T9.1 |
| L06 guide valid | rc 0 | T9.1 |
| fingerprint | rc 0 | T9.2 |
| learner state | rc 0 | T9.3 |
| scope | ⊆ allow-list | `git status --short` |

## Risks and rollback
Revert each doc edit by restoring its quoted original. L06 keys and containers are never touched.

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
