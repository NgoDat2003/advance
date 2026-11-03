=== FILE: plan.md ===
---
title: "K2 Bài 04 Caching teacher guide (rate limit, counters, practices; measured on Redis 7.2.3 and PG 16.15)"
description: "Single-file Vietnamese teacher guide for K2 Bài 04 (39 slides, 9 stages) backed by redis-cli, shell, SQL and Lua snippets recorded on advance-be-k2l04-* containers and schema k2l04_counter."
status: pending
priority: P1
effort: 14.5h
branch: main
tags: [k2-lesson-04, caching, rate-limit, redis, lua, postgres, pgbench, teacher-guide, tdd]
blockedBy: []
blocks: []
created: 2026-11-02
---

# K2 Bài 04 — Caching teacher guide

Path roots used in every phase file. All commands run in Git Bash with the working directory at ROOT.
- ROOT = `D:/study/advance-be`
- PLAN = `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide`
- LABS = `D:/study/advance-be/labs/k2-lesson-04-caching`
- GUIDE = `D:/study/advance-be/reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html`
- L06 = `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide` (copy source, never edited except the optional one-line link in phase 10)

## Overview

Build GUIDE on the Lesson 06 single-column shell (no rail), so Đạt can study K2 Bài 04 in one day (300 core minutes) after Lesson 06, about 2026-11-04. Every experiment is a small `.redis`, `.sh`, `.sql`, `.pgbench` or `.lua` file in LABS that he runs himself in `redis-cli` (inside `docker exec -it advance-be-k2l04-redis`), in Git Bash, or in DBX. The controller records the same regions through `PLAN/verify/run-lab.mjs` (copied from L06 `run-redis.mjs`) into `PLAN/runs/` with a sha256 manifest. Rate limiting is replayed deterministically: one `LABS/data/traffic.tsv` (25 requests with client-supplied `now_ms`) goes through six Lua limiters, and a JS oracle written before any Redis run fixes the exact allowed/denied numbers; live demos use windows of 3 s or less. Redis writes happen only on three new `advance-be-k2l04-*` containers (main on `127.0.0.1:6381`), Postgres writes only in schema `k2l04_counter`, L06's `advance-be-redis` is never touched (fingerprint before/after), all 39 slides map once with the three chips, and Lua first appears in stage 3 (slide 33).

## Data flow

1. `LABS/data/traffic.tsv` and the frozen formulas in `PLAN/assembly/contract.md` §6 feed `PLAN/verify/oracle.mjs`, which writes `PLAN/verify/oracle-expected.txt` (limiter decisions, CRC16 slots, key spread, Bloom false positives, script SHA1) before any lab region exists.
2. `PLAN/verify/expected.tsv` freezes every claim → run id → expected Redis 7.2.3 / PG 16.15 result → chip.
3. `LABS/00-containers.sh` creates the three K2L04 containers. `run-lab.mjs` runs a region with one host-ms clock, the L06 reset + `BLPOP` barrier for A/B pairs, transaction-aware stepping, a `# clock` sanity line for `#@ timed` regions, and an allow-list for the Postgres container.
4. Output goes to `PLAN/runs/*.txt` and `PLAN/runs/manifest.tsv` (exactly one sha256 line per file). `verify-guide.mjs --runs` checks rows, oracle lines, M01, D01, V18 and V23.
5. `PLAN/verify/make-widget-data.mjs` reads runs only and writes `PLAN/runs/data/w1.json`–`w9.json` and `derived.json`.
6. Three delegates write fragments and widgets against the frozen contract; `PLAN/assembly/assemble.mjs` builds GUIDE.
7. Gates: verifier V01–V23, negative tests, widget-smoke, render-check, `/ak:code-review --pending --ultra --advice`, docs, handoff.

## Stage map (study day ≈ 2026-11-04 or later)

| Stage | Slides | Topic | Core min | Optional min | Main runs | Widget (recorded data read) |
|---|---|---|---|---|---|---|
| `#cach-hoc` | 1, 2, 3 | containers, DBX `ADVANCE_BE_K2L04_REDIS` (127.0.0.1:6381, db 0), `check.sh`, run methods, two terminals, tool glossary | 15 | – | `check.after-seed` | – |
| 1 | 4, 5, 6, 7, 10, 11 | what a cache is for; slide-6 cons measured; slide-7 numbers vs this machine; slide-10 map of structures to stages | 25 | 10 (bandwidth, keys-memory) | `01-fundamentals.*` | W1 capacity estimator (bench medians, bytes/key, maxclients) |
| 2 | 8, 9 | cluster node: 16384 slots, KEYSLOT, hashtag, CROSSSLOT, spread over 3 simulated nodes | 15 | – | `02-cluster.*` | W2 CRC16 slot calculator (recorded KEYSLOT pairs, spread) |
| 3 | 33 | client-side race: lost update, `WATCH` abort, first Lua | 30 | 5 (Lua CROSSSLOT on cluster) | `03-race*.timeline`, `03-tools.*` | W3 race timeline (3 recorded timelines) |
| 4 | 12, 13, 14 | fixed window (INCR/EXPIRE bug, `SET NX EX`, live boundary), sliding log, sliding counter | 45 | – | `04-*`, `04-rl-replay.{fixed-window,sliding-log,sliding-counter,compare}` | W4 window simulator (recorded replay lines) |
| 5 | 15, 16 | leaky queue + meter, token bucket (replay, TIME form, concurrency, interval refill), batch tokens, 429 + `Retry-After`, fail-open/closed, comparison table | 50 | 5 (slow-Redis timeout) | `05-*`, `04-rl-replay.{leaky-meter,token-bucket,token-interval}` | W5 bucket simulator (recorded replay + batch bench) |
| 6 | 17–22 | PG hot row vs 1000 rows with lock waits, Redis `INCR`/`HINCRBY`, naive GET/SET race, write-behind flush and crash, memory layouts | 45 | 10 (`synchronous_commit=off`, 513-field bucket) | `06-*` | W6 counter bars (tps, ops/s, bytes per post) |
| 7 | 23, 24, 25 | unread broadcast: fan-out at N=10k/100k vs pointer, `ZADD GT` | 15 | – | `07-unread.*` | W7 fan-out vs pointer cost model (ms per 100k, bytes/user) |
| 8 | 26–30 | message pool: polling vs `BLPOP`, TTL and `GETDEL`; replicated cache as design | 20 | 10 (`CLIENT TRACKING`, only if smoke S12 = yes) | `08-*` | W8 poll vs block (recorded timelines) |
| 9 | 34, 35, 36, 37 | delay-task claim, HyperLogLog, Bitmap segmentation, hand-built Bloom | 35 | 15 (`PFMERGE` week, sparse bitmap, naive pollers) | `09-*` | W9 HLL/Bloom calculator (recorded counts) |
| wrap | 31, 32, 38, 39 | recap, homework, interview, cheat sheet, references, next steps | 5 | 45 homework (evening) + 15 guard drill | `hw-check.*` | – |
| **Total** | 39 | | **300** | **70 + 60** | | |

"Nếu còn sức" priority, in order: S9 extras → S6 extras → S1 extras → S8 tracking → S3 Lua CROSSSLOT → S5 slow-Redis → guard drill. Rate limiting (S4, S5) and counters (S6) have no optional core parts. The four L06 overlaps each get their own recorded run: token bucket (S5), delay task (S9), cluster slots/hashtag/CROSSSLOT (S2), client-side race with WATCH and Lua (S3). Two-terminal sessions: four core ones (S3 race with three regions, S5 leaky worker, S8 pool with two regions, S9 delay), giving seven core timelines plus two optional. Experiments that need concurrency but not timing (one-thread block, token-bucket concurrency, counter race) run in one terminal with `&` inside the container.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract, baseline, containers, run-method smoke](phase-01-contract-baseline-containers-smoke.md) | 1h | – | fingerprint written before any K2L04 container; `check.sh` RED, then C01/C08/C09 ✔; smoke S1–S14 recorded; contract v1 frozen |
| 02 | [Tests first: oracle, matrix, runner, verifier, negatives](phase-02-tests-first.md) | 2h | 01 | oracle summaries equal the frozen numbers; `expected.tsv` 79 run + 8 design rows; `--selftest` GREEN; `--runs` RED "missing run" × 79; `--lint` GREEN on the tool scripts |
| 03 | [Labs and runs, stages 1–5](phase-03-labs-runs-stages-1-5.md) | 2.75h | 02 | `--runs --only-runs '^(0[1-5]-|check\.|source-claims)'` GREEN; `--lint` GREEN; rerun gate 0 diffs; fingerprint `--compare` rc 0 |
| 04 | [Labs and runs, stages 6–9 and Postgres](phase-04-labs-runs-stages-6-9-postgres.md) | 2.25h | 03 | `--runs --only-runs '^(0[0-9]-|check\.|source-claims)'` GREEN; schema gate; `check.sh` C10 ✔; fingerprint rc 0 |
| 05 | [Widget data, homework, claims](phase-05-widget-data-homework-claims.md) | 1h | 04 | `--data` GREEN; `--runs` GREEN (all rows); claim files complete |
| 06 | [Guide shell and assembler (delegate D0)](phase-06-guide-shell-assembler.md) | 1h | 02 | stub build written; V01–V04, V09, V10, V14, V15, V22 GREEN |
| 07 | [Stage fragments (delegates D1–D3)](phase-07-stage-fragments.md) | 2h | 05, 06 | `--fragment` GREEN × 9; `node --check` × 9 widgets |
| 08 | [Assemble, verify, render-check](phase-08-assemble-verify-render.md) | 0.75h | 07 | full verifier GREEN; negatives all RED-as-designed, 0 SKIP; widget-smoke; render 0/0/0 light and dark |
| 09 | [Ultra code review and fixes](phase-09-ultra-code-review-fixes.md) | 1.25h | 08 | 0 open Critical/Important; phase-08 matrix GREEN again |
| 10 | [Docs, final gate, handoff](phase-10-docs-final-gate-handoff.md) | 0.5h | 09 | `runs/final-gate.txt` all ✔; `git status --short` ⊆ allow-list |

Phase 06 runs in parallel with 03–05; delegate D0 owns only `PLAN/assembly/shell-head.html`, `shell-css.part`, `shell-tail.html`, `assemble.mjs`. Phase 07 delegates own disjoint fragment and widget files. All Docker, Redis and Postgres commands are run by the controller, serially.

## Frozen replay design (input to the oracle; contract §6)

`LABS/data/traffic.tsv` has the header `ts_ms<TAB>client` and 25 rows, all for client `s7`. Window W = 10 000 ms, limit 5.
- G1, boundary part 1: 9900, 9910, 9920, 9930, 9940.
- G2, boundary part 2: 10000, 10010, 10020, 10030, 10040.
- G3, sliding-counter probe: 15000, 15500, 16000, 16500, 17000.
- G4, short burst: 45000, 45010, …, 45090 (10 rows, 10 ms apart).

The formulas use integer arithmetic only, so Lua and the JS oracle agree bit for bit:
- **fixed-window:** `n = INCR k2l04:rl:fw:{s7}:<ts/W>`, `PEXPIRE` only when n = 1, allow when n ≤ 5.
- **sliding-log:** `ZREMRANGEBYSCORE key -inf now-W`; allow when `ZCARD` < 5, then `ZADD now <ts>-<row>`. Only allowed requests are stored.
- **sliding-counter (slide 14):** e = now mod W; allow when `prev×(W−e) + cur×W < 5×W`. Only allowed requests are counted. The slide example (5×0.7 + 3 = 6.5 > 5 → deny) is the same inequality.
- **token-bucket:** capacity 5, one token per 2000 ms. `elapsed = max(0, now−ts)`, `k = floor(elapsed/2000)`, `ts += k×2000` (ts = now when the bucket is full), `retry_after_ms = 2000 − (now−ts)`.
- **token-interval (slide 16 as drawn):** 5 tokens per window key `<ts/W>`, no carry-over.
- **leaky-meter:** a virtual queue: `qe = max(now, qe)`, `wait = qe − now`; admit when `wait ≤ 8000`, then `qe += 2000`.

Expected oracle summaries. These are the only hand-computed numbers in the plan, and phase 02 must reproduce them:

| Algorithm | Allowed | Denied | Max allowed in any 10 s | Extra |
|---|---|---|---|---|
| fixed-window | 15 | 10 | 10 (9900–10040, within 140 ms) | – |
| sliding-log | 10 | 15 | 5 | exact reference |
| sliding-counter | 14 | 11 | 9 | allows 10010, 15000, 15500, 16500; 4 more than the log |
| token-bucket | 13 | 12 | 8 | first `retry_after_ms` 1900 → `Retry-After: 2` |
| token-interval | 15 | 10 | 10 | same as fixed window (counsel Q3) |
| leaky-meter | 13 | 12 | 8 admitted | `max_wait_ms` 7960 |
| batch over-admit (cap 10, 1 token/1000 ms, 20 requests at 10000–10190) | single: 10 of 20 | batch: 20 of 20 | – | over-admission = one batch (10) |

The oracle also outputs:
- `CLUSTER KEYSLOT` for the stage-2 key list (`foo` = 12182);
- the 3-node spread of `k2l04:spread:1..3000` (ranges 0–5460 / 5461–10922 / 10923–16383);
- the Bloom false-positive count for m = 50 000, k = 3, n = 10 000. `user1..user10000` are added and `probe1..probe10000` are probed. Positions are `tonumber(sha1hex(x):sub(8i+1, 8i+8), 16) % m` for i = 0..2;
- the SHA1 of every `lua/*.lua` file, compared with `SCRIPT LOAD`.

## Expected-result matrix (frozen in `PLAN/verify/expected.tsv` in phase 02)

Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`, – = no chip. The platform goes in the chip note ("đo trên PG 16.15", "đọc mã nguồn 7.2.3", "chưa đo trực tiếp"). "n" means the recorded value; the predicate asserts shape or relation only. "=oracle" means V23 compares every decision line with `oracle-expected.txt`. Timing rows are labelled "phụ thuộc máy".

| ID | Run id | Slide | Expected (Redis 7.2.3 / PG 16.15) | Chip |
|---|---|---|---|---|
| D04 | – | 4 | layers of cache (design, image) | OK |
| D05 | – | 5 | speed, buffer ≠ cache, share data (design) | OK |
| D11 | – | 11 | recap of K1 L02/L06, with links | OK |
| D19 | – | 19 | 1B users, 1M QPS: "chưa đo trực tiếp" | PART |
| D24 | – | 24 | 10M-user requirement: "chưa đo trực tiếp" | PART |
| D27 | – | 27 | two-way communication over a one-way MQ (design) | OK |
| D30 | – | 30 | Hazelcast replicated cache: "chưa đo trực tiếp" | OK |
| D31 | – | 31 | recap restated with the measured corrections | PART |
| T01 | check.after-seed | – | every row ✔ or `–`, rc 0 | – |
| T02 | check.rerun | – | `same:check.after-seed` | – |
| R101 | 01-fundamentals.info | – | `redis_version:7.2.3`, `io_threads_active:0`, `multiplexing_api:epoll` | – |
| R102 | 01-fundamentals.single-thread | 6 | PING `real` ≥ 0.7 s while `DEBUG SLEEP 1` runs; UNSUBSCRIBE is O(N) per `source-claims` | PART |
| R103 | 01-fundamentals.bench | 7 | custom `SET k2l04:bench:k v` / `GET k2l04:bench:k`, 3 runs each, every rate > 0; `--scan --pattern 'key:*'` empty | PART |
| R104 | 01-fundamentals.maxclients | – | `maxclients` 10000 (not 60K) | – |
| R105 | source-claims | – | `pubsub.c` `listSearchKey`; `config.c` maxclients 10000 and hash-max-listpack-entries 512 (tag 7.2.3 URLs) | – |
| R106 | 01-fundamentals.memory-oom | – | small container: `OOM command not allowed`, GET still answers | – |
| R107 | 01-fundamentals.bandwidth (opt) | – | `-c 1` GET of 16 B rate ≥ 3 × GET of 100 KB rate | – |
| R108 | 01-fundamentals.keys-memory (opt) | – | DBSIZE delta 100000, bytes/key n | – |
| R109 | 01-fundamentals.kiem-chung | – | plain reads match `table.expect` | – |
| R201 | 02-cluster.disabled | – | on main: `ERR This instance has cluster support disabled` | – |
| R202 | 02-cluster.info | – | `cluster_state:ok`, `cluster_slots_assigned:16384` | – |
| R203 | 02-cluster.keyslot | 9 | slots =oracle; the `{s7}` pair has equal slots | OK |
| R204 | 02-cluster.crossslot | – | untagged MSET → `CROSSSLOT`; tagged → OK | – |
| R205 | 02-cluster.spread | 8 | 3 node-range counts =oracle; failover "chưa đo trực tiếp" | PART |
| R206 | 02-cluster.kiem-chung | – | reads match | – |
| R301 | 03-race.lost.timeline | – | both GET 10; final 9 (one sale lost) | – |
| R302 | 03-race.watch.timeline | – | A `EXEC` → `(nil)` after B's DECR; retry → 8 | – |
| R303 | 03-race-lua.lua.timeline | 33 | both run `stock-decr.lua` → final 8; V18 header | OK |
| R304 | 03-tools.multi-no-rollback | – | EXEC shows `ERR value is not an integer…` in slot 2, other writes applied | – |
| R305 | 03-tools.lua-intro | – | `SCRIPT LOAD` SHA1 =oracle; `EVALSHA` works | – |
| R306 | 03-tools.lua-crossslot (opt) | – | on cluster: script with untagged keys → `CROSSSLOT` | – |
| R307 | 03-tools.kiem-chung | – | reads match | – |
| R401 | 04-fixed.incr-expire-bug | – | INCR 1, "crash", `TTL` → -1 | – |
| R402 | 04-fixed.setnx-ex | – | `SET … EX 10 NX` OK, second → nil, TTL 1–10 | – |
| R403 | 04-live.fixed-boundary | – | `#@ timed`: allowed 10, denied 2, span ≤ 1500 ms host, clock ratio 0.8–1.25 | – |
| R404 | 04-rl-replay.fixed-window | 13 | 15/10, max10s 10, =oracle | OK |
| R405 | 04-rl-replay.sliding-log | – | 10/15, max10s 5, =oracle | – |
| R406 | 04-rl-replay.sliding-counter | 14 | 14/11, max10s 9, =oracle | PART |
| R407 | 04-fixed.kiem-chung | – | reads match | – |
| R501 | 04-rl-replay.leaky-meter | – | 13/12, max_wait_ms 7960, =oracle | – |
| R502 | 04-rl-replay.token-bucket | – | 13/12, max10s 8, first retry 1900, =oracle | – |
| R503 | 04-rl-replay.token-interval | 16 | 15/10, max10s 10, =oracle | PART |
| R504 | 05-leaky.worker.timeline | 15 | 8 enqueued → 5 queued, 3 rejected; 5th item host arrival − A send ≥ 1800 ms | OK |
| R505 | 05-token.time-form | – | `TIME` form, cap 5: 5 allowed, 3 denied, 0 < retry ≤ 2000 | – |
| R506 | 05-token.naive-race | – | 8 parallel GET/compute/SET from 5 tokens → allowed > 5 | – |
| R507 | 05-token.lua-race | – | 8 parallel `--eval` → allowed = 5 | – |
| R508 | 05-token.batch-bench | – | `-c 1` EVALSHA n=1 and n=10, 3 runs each, rates > 0; tokens/s ratio ≥ 5 (`derived.json`) | – |
| R509 | 05-token.batch-overadmit | – | single serves 10, batch serves 20, =oracle | – |
| R510 | 05-token.retry-after | – | `HTTP/1.1 429 Too Many Requests` + `Retry-After: 2` | – |
| R511 | 05-token.fail-modes | – | small stopped: client error; fail-open `200`, fail-closed `503`; small back to `PONG` | – |
| R512 | 05-compare.memory | – | MEMORY USAGE per limiter key n; 1000-entry log is `skiplist`, bytes/entry n | – |
| R513 | 05-token.slow-redis (opt) | – | `timeout 0.2` fires during `DEBUG SLEEP 1` on small | – |
| R514 | 05-token.kiem-chung | – | reads match | – |
| R601 | 00-pg-setup | – | schema `k2l04_counter`, `post_count` 1000 rows | – |
| R602 | 06-counter.pg-hot-vs-spread | 20 | a hot sample shows a `Lock` wait; spread tps ≥ 1.5 × hot tps; `like_count` = processed transactions | PART |
| R603 | 06-counter.pg-async (opt) | – | `synchronous_commit=off` hot tps n | – |
| R604 | 06-counter-sql.bloat | – | `n_tup_upd`, `n_tup_hot_upd`, `n_dead_tup` printed | – |
| R605 | 06-counter.redis-incr | – | `-c 8 -n 100000` INCR × 3, rates > 0, GET 300000; HINCRBY rate n | – |
| R606 | 06-counter.naive-race | 22 | 8 × 100 GET+SET → final < 800 | PART |
| R607 | 06-counter.incr-race | – | 8 × 100 INCR → 800 | – |
| R608 | 06-counter.write-behind | 21 | flush 300 → PG +300; 50 more; kill small → delta nil; PG unchanged | PART |
| R609 | 06-counter.memory | – | bytes/post: strings > hash > bucketed hash | – |
| R610 | 06-counter.memory-513 (opt) | – | 512 fields `listpack`, 513 `hashtable` | – |
| R611 | 06-counter.kiem-chung | – | reads match | – |
| R701 | 07-unread.fanout-10k | – | `errors: 0, replies: 10000`, ms n | – |
| R702 | 07-unread.fanout-100k | – | `errors: 0, replies: 100000`, ms n, used_memory delta n | – |
| R703 | 07-unread.pointer | 25 | `ZCOUNT` → 2; stale `ZADD GT` → 0, score stays 6 | OK |
| R704 | 07-unread.pointer-memory | – | 100k-field hash, bytes/user n | – |
| R705 | 07-unread.kiem-chung | – | reads match | – |
| R801 | 08-pool.poll.timeline | 29 | 4–7 polls until the reply; last poll ≤ 250 ms after B's SET | PART |
| R802 | 08-pool.block.timeline | 28 | 1 BLPOP; arrival − B push ≤ 100 ms | OK |
| R803 | 08-pool.ttl | – | `TTL` 1–30; `GETDEL` returns the value, then `GET` nil | – |
| R804 | 08-tracking.push (opt) | – | `invalidate` push seen (only if smoke S12 = yes) | – |
| R805 | 08-pool.kiem-chung | – | reads match | – |
| R901 | 09-delay-lua.claim.timeline | 34 | one poller gets `o1`, the other nil; `o2`/`o3` remain | OK |
| R902 | 09-delay.naive.timeline (opt) | – | both process `o1` | – |
| R903 | 09-hll.counts | 35 | N 1000 and 10000 within ±2.43 %; N 100000 → 99655 | OK |
| R904 | 09-hll.sparse-dense | – | N 100 STRLEN ≤ 3000; N 100000 STRLEN 12304; prefix `HYLL` | – |
| R905 | 09-hll.merge-week (opt) | – | 7 days → union 40000 ± 2.43 % | – |
| R906 | 09-bitmap.genres | 36 | BITCOUNT 50000 / 33333; AND 16666; STRLEN 12501 | OK |
| R907 | 09-bitmap.sparse (opt) | – | one bit at 9999999 → STRLEN 1250000 | – |
| R908 | 09-bloom.members | – | 10000 / 10000 hits (0 false negatives) | – |
| R909 | 09-bloom.probes | 37 | fp =oracle and inside 832–1005 (918.5 ± 3σ) | OK |
| R910 | 09-bloom.memory | – | STRLEN 6250; Set MEMORY USAGE n | – |
| R911 | 09-practices.kiem-chung | – | reads match | – |
| H01 | hw-check.solution | – | ✔ H1–H5, rc 0 | – |
| H02 | hw-check.bad | – | ✘ H3, ✘ H4; ✔ H1, H2, H5 | – |

That gives 79 run rows and 8 design rows.
- **Null-chip slides (12):** 1, 2, 3, 10, 12, 17, 18, 23, 26, 32, 38, 39.
- **Chip slides (27):** 4, 5, 6, 7, 8, 9, 11, 13, 14, 15, 16, 19, 20, 21, 22, 24, 25, 27, 28, 29, 30, 31, 33, 34, 35, 36, 37. Each has exactly one chip row.
- **Slide → stage:** 1–3 `#cach-hoc`; 4–7, 10, 11 stage 1; 8–9 stage 2; 33 stage 3; 12–14 stage 4; 15–16 stage 5; 17–22 stage 6; 23–25 stage 7; 26–30 stage 8; 34–37 stage 9; 31, 32, 38, 39 wrap (`#on-tap`, `#bai-tap`, `#tham-khao`, `#tiep-theo`).


## Acceptance criteria

1. GUIDE ≤ 520 KB, no `<script src>`, only Google Fonts from outside, no rail, no `data:image`, and every slide image uses the relative path `../../Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/assets/04_Caching/…` (P08: V01, V10, V22).
2. `SLIDES` lists 1–39 exactly once. Chips equal the chip rows of `expected.tsv`. The null-chip set equals §9 item 5. Every PART/FIX slide has `id="sl-NN"` (P06/P08: V04).
3. Each stage 1–9 has, in order:
   - `.glossary` (new commands in plain Vietnamese) before the first `pre[data-cmd]`;
   - `.story`, a figure/svg, `table.stats` and `.check30`;
   - a worked example, `kiem-chung` with `table.expect`, and `callout challenge` with PASS criteria;
   - 4 quiz items whose `why` cites a run id.
   (P07: V12, V11)
4. Every `b.m`, `pre[data-run]` and widget number traces to a `runs/` file whose sha256 equals its single manifest line. Every `data-derived` value recomputes from `derived.json`. Every replay decision equals the oracle (P03–P05: V06–V08, V16, M01, V23).
5. Every run row matches, or is `deviation` with a `deviations.md` entry and a changed narrative/chip; data is never edited (P03–P05: `--runs`, D01).
6. `check.sh` rc 0 with rows ✔ or `–` after seed, after a second seed (identical), and at handoff (P01, P03, P10).
7. `--lint` (V17) GREEN:
   - keys only `k2l04:`;
   - containers only `advance-be-k2l04-(redis|cluster|small)` or `quan-ly-hop-dong-postgres-1` with `psql`/`pgbench`;
   - no `6379`/`6380`, no `advance-be-redis`, no `redis-benchmark -t`;
   - Lua only in stems `03`–`09` and `hw`;
   - pgbench always `-n -f`, `-c ≤ 8`, `-T ≤ 5`, never `-i`;
   - SQL writes only `k2l04_counter.*`;
   - config restored in the same region; no `prune`.
   (P02–P04)
8. Storage keys are `k2l04-*` only; dark and light both work; widgets write run data only via `textContent`/`esc()` (P08: V09, V14, V19).
9. render-check at 375/768/1440 in light and dark: 0 runtime errors, 0 overflow, 0 targets < 44 px (P08).
10. Negative tests: 25/25 RED with their expected code, positive control GREEN, 0 SKIP (P02, P08).
11. `verify/fingerprint.sh --compare runs/00-fingerprint-before.txt` rc 0 after phases 03, 04, 08 and 10:
    - every baseline container, network and volume is unchanged, including `advance-be-redis` and `advance-be-l06`;
    - `l06_main_k2l04_keys` is `0` or `down`;
    - `port6380_lab=none`;
    - `k2l04_main_bind=127.0.0.1:6381`.
    (P01, P03, P04, P08, P10)
12. The `advance_be_lab` schema list after the build equals the baseline plus `k2l04_counter` (P04, P10).
13. 0 open Critical/Important review findings (P09).
14. Docs: the README Khóa 3 section and labs list, the master curriculum K2 Bài 04 artifacts line, and the handoff are written. `git status --short` ⊆ allow-list; no branch/commit/push (P10).
15. Lua identity: every `# lua … sha256=` header equals its `labs/k2-lesson-04-caching/lua/*.lua` file (V18).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| Docker VM clock runs about 8 % fast and steps back up to −2.8 s | H×H | Replay with ARGV `now_ms` for all comparison numbers. Live demos ≤ 3 s windows. `#@ timed` regions get a `# clock` line; the runner retries up to 3 times when `step=back` or the ratio is outside 0.8–1.25. Limiters clamp `elapsed ≥ 0`. Bench values are the median of 3, rejecting ≤ 0. |
| A K2L04 write lands on L06 `advance-be-redis` or port 6379 | L×H | Distinct name prefix and port; runner and lint guard `^advance-be-k2l04-(redis\|cluster\|small)$`; lint bans `6379` and `advance-be-redis`; fingerprint key count on L06 main is read-only. |
| L06 `check.sh` C14 matches `advance-be-redis-` | certain if misnamed | Names never contain `advance-be-redis`; checked by lint and by `docker ps --filter name=advance-be-redis- -q` count 0 in the fingerprint. |
| `MULTI`/`WATCH` steps hang the L06 runner (ECHO markers become `QUEUED`) | certain | Runner treats `MULTI … EXEC` as one step and sends markers only outside it (smoke S4/S5 proves it). |
| `pgbench -f /dev/stdin` fails in the Alpine image | M×M | Smoke S10 decides; the fallback is `sh -c 'cat > /tmp/k2l04-x.pgbench && pgbench … -f /tmp/k2l04-x.pgbench; rc=$?; rm -f /tmp/k2l04-x.pgbench; exit $rc'`. |
| PG hot-row tps ratio < 1.5 (fsync dominates both) | M×M | Keep the data and log a deviation; the narrative falls back on the measured lock waits; the optional async-commit run separates fsync from locking. |
| Naive races do not lose updates on a fast run | L×M | `sleep 0.2` between read and write in the naive scripts; otherwise a deviation with changed narrative. |
| Homework spoiled by the stage-5 script | M×L | Different contract (cap 10, per `storeId`, 30 calls, `{allowed, retry_after_ms}`), 50/50 scaffold, solution in a fold. |
| HTML over 520 KB | M×M | `@RUN head=/tail=` excerpts, folds; V01. |

Rollback:
- `bash labs/k2-lesson-04-caching/99-cleanup.sh` UNLINKs `k2l04:*` on main (keeping `k2l04:my:*`, `k2l04:hw:*`) and removes the cluster and small containers by exact name.
- `--all` also removes main, volume `advance-be-k2l04-data`, and network `advance-be-k2l04` when it is empty.
- `99-pg-cleanup.sql` drops schema `k2l04_counter`.
- Nothing in L06 or Postgres outside that schema is touched. No `prune`.
- All repo files are new except the doc edits quoted in phase 10.

## Open questions for the user

None blocking. One confirmation for Đạt: should the optional one-line "tiếp theo" link in the L06 guide (`#tiep-theo`, built HTML plus `assembly/shell-tail.html`) be added while he is still studying L06? Default: add it, because it is a one-line edit to both files.


=== FILE: phase-01-contract-baseline-containers-smoke.md ===
---
phase: 1
title: "Contract, baseline, containers, run-method smoke"
status: pending
priority: P1
effort: 1h
dependencies: []
---

## Goal
Record the untouched baseline first, then create the K2L04 containers, prove the run methods, and freeze the contract.

## Files to create/modify (owner: controller)
- `PLAN/verify/fingerprint.sh`, `PLAN/verify/schema-list.sql`
- `PLAN/runs/00-fingerprint-before.txt`, `PLAN/runs/00-schemas-before.txt`, `PLAN/runs/run-method-smoke.txt`
- `LABS/00-containers.sh`, `LABS/check.sh`, `LABS/00-seed.redis`, `LABS/99-cleanup.sh`
- `PLAN/assembly/contract.md`

## Tasks
**T1.1 Fingerprint before anything else**
- Goal: prove later that L06 and foreign resources are untouched.
- Target: `PLAN/verify/fingerprint.sh`, copied from `L06/verify/fingerprint.sh`.
- Steps:
  1. Exclude names matching `^advance-be-k2l04-` (keep `advance-be-redis` and everything else).
  2. Add `net:<sha256(id)>` lines for every non-`advance-be-k2l04` network and `vol:<sha256(name)>` lines for every non-K2L04 volume.
  3. Add these lines: `port6380`, `port6380_lab` (k2l04 filter), `k2l04_main_bind` (from `docker port advance-be-k2l04-redis 6379`, `none` before creation), `l06_main_k2l04_keys` (a read-only `docker exec advance-be-redis redis-cli --scan --pattern 'k2l04:*' | wc -l`, or `down` when it is stopped), `l06_redis_dash_k2l04=0` (count of `docker ps -a --filter name=advance-be-redis-` names containing `k2l04`).
  4. `--compare`: every baseline hash/net/vol line must still be present; new lines are allowed; `l06_main_k2l04_keys ∈ {0, down}`; `port6380_lab=none`.
  5. Run it into `runs/00-fingerprint-before.txt`.
  6. Run `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -At -f - < PLAN/verify/schema-list.sql > PLAN/runs/00-schemas-before.txt`.
- Success: both files exist, and the schema list has no `k2l04_counter`.
- Verify: `grep -c 'k2l04_counter' PLAN/runs/00-schemas-before.txt` → `0`; `grep -ciE 'quan-ly|omnipos|password' PLAN/runs/00-fingerprint-before.txt` → `0`; `netstat -ano | grep -c ':6381 .*LISTENING'` → `0`.

**T1.2 check.sh red first**
- Goal: the invariant checker exists before the containers.
- Target: `LABS/check.sh`, adapted from `labs/lesson-06-redis/check.sh`. Rows:
  - C01 main (image `redis:7.2.3`, version, flags, network `advance-be-k2l04`, `/lab` ro, volume `advance-be-k2l04-data`);
  - C02 cluster; C03 small (absent → `–`);
  - C04 only `k2l04:` keys in db 0;
  - C05 main config (`maxmemory 0`, `noeviction`, `slowlog 10000`, `appendonly no`, `maxclients 10000`);
  - C06 no `k2l04:barrier:*`;
  - C07 main publishes only `127.0.0.1:6381`, extras publish nothing;
  - C08 `run_id` over host TCP `127.0.0.1:6381` equals `docker exec`;
  - C09 seed `k2l04:seed:version` = `1`;
  - C10 schema `k2l04_counter.post_count` has 1000 rows (absent → `–`, read-only psql).
- Steps: write it; run it.
- Success: no shell error, rc > 0.
- Verify (RED): `bash LABS/check.sh; echo rc=$?` prints `✘ C01` and ends with `rc=` followed by a number ≥ 1.

**T1.3 Containers and seed**
- Target: `LABS/00-containers.sh` (adapted from L06), `LABS/00-seed.redis`, `LABS/99-cleanup.sh`.

| Container | Network | Publish | Mounts | Command |
|---|---|---|---|---|
| `advance-be-k2l04-redis` | `advance-be-k2l04` | `127.0.0.1:6381:6379` | `LABS:/lab:ro`, `advance-be-k2l04-data:/data` | `redis-server --appendonly no --enable-debug-command local` |
| `advance-be-k2l04-cluster` | `advance-be-k2l04` | none | `LABS:/lab:ro` | `--cluster-enabled yes --cluster-config-file nodes.conf --appendonly no --save ""`, then `CLUSTER ADDSLOTSRANGE 0 16383` |
| `advance-be-k2l04-small` | `advance-be-k2l04` | none | `LABS:/lab:ro` | `--appendonly no --save "" --maxmemory 4mb --maxmemory-policy noeviction` |

- Subcommands: `up main|cluster|small`, `down cluster|small`, `reset main` (restores the C05 values), `status`.
- The script refuses names outside the guard and any `-p` containing 6379 or 6380. It recreates only on drift. `down` never removes main.
- `99-cleanup.sh [--all]` follows the rollback rules in plan.md.
- Steps: `bash LABS/00-containers.sh up main`, then `grep -v '^#' LABS/00-seed.redis | docker exec -i advance-be-k2l04-redis redis-cli`.
- Verify: `bash LABS/check.sh; echo rc=$?` shows `✔ C01`, `✔ C07`, `✔ C08`, `✔ C09`, `– C02`, `– C03`, `– C10` and `rc=0`; `docker port advance-be-k2l04-redis` → `6379/tcp -> 127.0.0.1:6381`.

**T1.4 Smoke S1–S14** (keys `k2l04:smoke:*` only; record in `runs/run-method-smoke.txt`, then UNLINK)
- S1 pipe; S2 paced streaming (two PING 1 s apart); S3 `#` line → `ERR unknown command '#'`.
- S4 `MULTI` span (QUEUED, EXEC array); S5 `WATCH` abort (second client DECR → `EXEC` nil).
- S6 `MSYS_NO_PATHCONV` path rule; S7 `--eval /lab/…` on the new container.
- S8 `redis-benchmark -c 1 -n 1000 -q SET k2l04:smoke:b x` → rate > 0 and `--scan --pattern 'key:*'` empty.
- S9 clock ratio (Redis `TIME` vs host over 3 s).
- S10 `printf 'SELECT 1;\n' | docker exec -i quan-ly-hop-dong-postgres-1 pgbench -n -c 1 -T 1 -U postgres -f /dev/stdin advance_be_lab` → `number of transactions actually processed`.
- S11 psql `select version()` → `16.15`.
- S12 `CLIENT TRACKING` push visible in redis-cli (yes/no).
- S13 cluster `up` + `CLUSTER KEYSLOT foo` → 12182.
- S14 host TCP run_id match on 6381.
- Verify: `grep -cE '^S(1[0-4]|[1-9]) (yes|no|ok|fallback)' PLAN/runs/run-method-smoke.txt` → `14`; `docker exec advance-be-k2l04-redis redis-cli --scan --pattern 'k2l04:smoke:*' | wc -l` → `0`.

**T1.5 Contract v1**
- Target: `PLAN/assembly/contract.md`.
- Sections:
  - §1 key registry: `k2l04:{rl,lb,tb,stock,cnt,wb,mem,unread,bc,pool,mq,delay,hll,bm,bf,bench,spread,barrier,seed,hw,my}:*`;
  - §2 file formats (L06 rules plus `.sql` regions `-- #region id · title` and `.pgbench`);
  - §3 run ids;
  - §4 fragment format and CSS (L06 plus `.glossary`);
  - §5 learner workflow from the smoke results, DBX `ADVANCE_BE_K2L04_REDIS` 127.0.0.1:6381 db 0 (one command per execution);
  - §6 replay design and the slide → stage → chip table copied from plan.md;
  - storage keys `k2l04-c<N>-<slug>`, `k2l04-theme`, `k2l04-hw-*`, `k2l04-drill-*`.
- Verify: `node -e "const t=require('fs').readFileSync(process.argv[1],'utf8');const n=[...t.matchAll(/^\| (\d+) \|/gm)].map(m=>+m[1]);process.exit(n.length===39&&new Set(n).size===39?0:1)" PLAN/assembly/contract.md; echo rc=$?` → `rc=0`.

## Test matrix
| Test (first) | Expected | Command |
|---|---|---|
| fingerprint stable | identical twice | `diff <(bash PLAN/verify/fingerprint.sh) <(bash PLAN/verify/fingerprint.sh)` → no output |
| check before containers | ✘ C01, rc ≥ 1 | T1.2 |
| guard refuses L06 name | exit 2 | `bash LABS/00-containers.sh up advance-be-redis; echo rc=$?` → `rc=2` |
| L06 untouched | rc 0 | `bash PLAN/verify/fingerprint.sh --compare PLAN/runs/00-fingerprint-before.txt` |

## Risks and rollback
If port 6381 is taken by a foreign process, STOP. Rollback: `bash LABS/99-cleanup.sh --all`, then delete the new files.

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
title: "Tests first: oracle, matrix, runner, verifier, negatives"
status: pending
priority: P1
effort: 2h
dependencies: [1]
---

## Goal
Every checker exists and is RED for the right reason before any lab region, run or HTML exists.

## Files to create/modify (owner: controller)
- `LABS/data/traffic.tsv`
- In `PLAN/verify/`:
  - `oracle.mjs`, `oracle-expected.txt`;
  - `lab-text.mjs` (copy; `.sql` regions use the `-- #region` marker);
  - `run-lab.mjs` (from `run-redis.mjs`), `merge-timeline.mjs`, `rerun-gate.mjs`;
  - `verify-guide.mjs`, `expected.tsv`, `deviations.md`, `negative-tests.sh`, `widget-smoke.mjs`, `fixtures/`.

## Tasks
**T2.1 Traffic and oracle**
- Steps:
  1. Write the 25 rows of plan.md "Frozen replay design".
  2. `oracle.mjs` (about 120 lines, no dependencies) implements the six formulas, batch over-admit, CRC16-XMODEM slots, spread, Bloom (node `crypto` sha1) and the Lua SHA1s. Lua files that do not exist yet print `pending`.
  3. Output lines look like `fixed-window 9900 1`, plus one summary per algorithm.
- Verify: `node PLAN/verify/oracle.mjs > PLAN/verify/oracle-expected.txt && grep -E '^summary' PLAN/verify/oracle-expected.txt` prints exactly:
  - `summary fixed-window allowed=15 denied=10 max10s=10`
  - `summary sliding-log allowed=10 denied=15 max10s=5`
  - `summary sliding-counter allowed=14 denied=11 max10s=9`
  - `summary token-bucket allowed=13 denied=12 max10s=8 first_retry=1900`
  - `summary token-interval allowed=15 denied=10 max10s=10`
  - `summary leaky-meter allowed=13 denied=12 max_wait_ms=7960`
  - `summary batch single=10 batch=20`
  - `summary keyslot foo=12182`
  - `summary bloom fp=<n>` with 832 ≤ n ≤ 1005

**T2.2 Runner**
- Changes from L06 `run-redis.mjs`:
  - Guard `^advance-be-k2l04-(redis|cluster|small)$`.
  - PG allow-list: exactly `quan-ly-hop-dong-postgres-1`, and only for `.sql` mode (`psql -X -U postgres -d advance_be_lab -v ON_ERROR_STOP=1 -P pager=off -a -f -`) and for `.sh` lines whose docker exec runs `psql` or `pgbench`.
  - A `MULTI…EXEC` span is one step.
  - `#@ timed` adds a `# clock host_ms= redis_ms= ratio= step=ok|back` line and retries up to 3 times on `back` or a ratio outside 0.8–1.25.
  - The prompt is `127.0.0.1:6381>`; the header names Redis or PostgreSQL with its version.
  - Barrier key `k2l04:barrier:<scenario>`.
- Verify:
  - `node PLAN/verify/run-lab.mjs PLAN/verify/fixtures/x.redis --region a --ct advance-be-redis; echo rc=$?` → `rc=2`;
  - the fixture `multi` region writes a run containing `QUEUED` and `1) OK`;
  - running fixture `a` twice leaves `grep -c 'x.a.txt' PLAN/runs/manifest.tsv` → `1`.

**T2.3 Verifier** (from L06 `verify-guide.mjs`)
- Adapted: paths, slides 1–39, key `k2l04-`, V03 sections (`cach-hoc`, `chang-1…9`, `on-tap`, `bai-tap`, `rate-limit-drill`, `phong-van`, `cheat-sheet`, `ban-do-slide`, `tham-khao`, `tiep-theo`), V12 + `.glossary`, the V17 rules of AC 7, and `evalExpr` + `med3()`.
- New:
  - V22: image path prefix, no `data:image`;
  - V23: replay/keyslot/spread/bloom run lines equal `oracle-expected.txt`;
  - V24: no `EVAL`/`--eval`/`data-cmd="lua/` inside `#cach-hoc`, `#chang-1`, `#chang-2`;
  - `--only-runs <regex>`.
- Verify: `node PLAN/verify/verify-guide.mjs --selftest` → `✔ không có lỗi`; `node PLAN/verify/verify-guide.mjs --runs 2>&1 | grep -c 'missing run'` → `79`.

**T2.4 expected.tsv**
- 79 run rows + 8 design rows from the plan matrix; columns `id run slides regex claim chip status`.
- Verify: `awk -F'\t' 'NR>1 && $2!="-"' PLAN/verify/expected.tsv | wc -l` → `79`; `awk -F'\t' 'NR>1 && $6!="–"{print $3}' PLAN/verify/expected.tsv | sort -n | paste -sd,` → `4,5,6,7,8,9,11,13,14,15,16,19,20,21,22,24,25,27,28,29,30,31,33,34,35,36,37`.

**T2.5 Negatives and widget-smoke**
- `negative-tests.sh`:
  - guide group (10): V05, V07, V09, V04 slide removed, V04 chip changed, V10, V22 base64, V24, V11, V12 missing glossary;
  - labs group (13): row corrupted, M01, D01, V17 key `foo`, `6380`, `advance-be-redis`, `redis-benchmark -t incr`, pgbench without `-n`, SQL write to `public`, V18, V23 decision flipped, `--eval` in an `01-` stem, `prune`;
  - data group (1): fake number;
  - hw group (1): bad fixture ✘ H3;
  - positive control: a row set to `deviation` with an entry → GREEN.
- `widget-smoke.mjs --help` works.
- Verify: `bash PLAN/verify/negative-tests.sh --labs-only` exits 0 with every case RED or SKIP (no ✘ line); `node PLAN/verify/widget-smoke.mjs --help; echo rc=$?` → `rc=0`.

## Test matrix
| Test | Expected now | Command |
|---|---|---|
| oracle | 9 summary lines as T2.1 | T2.1 |
| selftest | GREEN | `--selftest` |
| runs | RED × 79 | `--runs` |
| lint on tool scripts | GREEN | `node PLAN/verify/verify-guide.mjs --lint` |
| syntax | no error | `for f in PLAN/verify/*.mjs; do node --check "$f" || echo BAD; done` → no `BAD` |

## Risks and rollback
- If the oracle disagrees with a plan number, the formula or the plan is wrong: STOP (Failure Protocol); never tune traffic to match.
- Rollback: delete `PLAN/verify/` files and remove the fixture runs and their manifest lines.

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


=== FILE: phase-03-labs-runs-stages-1-5.md ===
---
phase: 3
title: "Labs and runs, stages 1–5"
status: pending
priority: P1
effort: 2.75h
dependencies: [2]
---

## Goal
Write the stage 1–5 lab files and record every run until the stage-1–5 rows, lint and the rerun gate are GREEN.

## Files to create/modify (owner: controller; runs strictly serial)
- `LABS/`:
  - `01-fundamentals.{redis,sh}`, `02-cluster.redis`;
  - `03-race.{A,B}.redis`, `03-race-lua.{A,B}.sh`, `03-tools.{redis,sh}`;
  - `04-fixed.redis`, `04-live.sh`, `04-rl-replay.sh`;
  - `05-leaky.{A,B}.sh`, `05-token.sh`, `05-compare.sh`;
  - `lua/{stock-decr,fixed-window,sliding-log,sliding-counter,leaky-meter,leaky-enqueue,token-bucket,token-interval}.lua`.
- `PLAN/verify/record-all.sh`, `PLAN/runs/*`, `PLAN/runs/source-claims.txt`, `PLAN/verify/deviations.md`.

## Tasks
**T3.1 Stage 1–2 files**
- Every Redis line names `advance-be-k2l04-redis` (or `-cluster`/`-small` via `#@ ct`). Regions follow the matrix R101–R109 and R201–R206.
- `bench` region: `docker exec advance-be-k2l04-redis redis-benchmark -q -c 50 -n 100000 SET k2l04:bench:k v`, three lines, then the same for GET, then `--scan --pattern 'key:*'`.
- `single-thread` region: `docker exec advance-be-k2l04-redis sh -c 'redis-cli DEBUG SLEEP 1 & sleep 0.2; time redis-cli PING; wait'`.
- `memory-oom` region: first line `echo "→ advance-be-k2l04-small"`, then FLUSHALL on small only, then `seq` fill of 1 KB values until OOM.
- `source-claims.txt`: WebFetch `raw.githubusercontent.com/redis/redis/7.2.3/src/{pubsub.c,config.c}`, quote the lines, then `node PLAN/verify/run-lab.mjs --register PLAN/runs/source-claims.txt`.
- No `EVAL`/`--eval` in `01-`/`02-` stems.
- Verify: `node PLAN/verify/verify-guide.mjs --lint` → `✔ không có lỗi`.

**T3.2 Stage 3 (first Lua)**
- `03-race` reset seeds `SET k2l04:stock:sku1 10`.
- `lost`: A GET, `#@ sleep 1`, SET 9; B `#@ sleep 0.3` GET, `#@ sleep 0.3` SET 9.
- `watch`: A WATCH/GET/sleep 1/MULTI/DECR/EXEC; B DECR at +0.5.
- `03-race-lua`: both `MSYS_NO_PATHCONV=1 docker exec advance-be-k2l04-redis redis-cli --eval /lab/lua/stock-decr.lua k2l04:stock:sku1`.
- `03-tools.sh#lua-intro`: `SCRIPT LOAD` via `-x`, then EVALSHA.
- Verify: `node PLAN/verify/verify-guide.mjs --runs --only-runs '^03-' 2>&1 | tail -1` → `✔ không có lỗi`.

**T3.3 Stage 4–5 limiters and replay**
- Every script takes `now_ms` as its last ARGV (optional only in `token-bucket.lua`, where absent means `redis.call('TIME')`) and clamps elapsed. It returns `{now, decision, extra}`.
- Each `04-rl-replay.sh` region is one line of this form (fixed-window shown):
  ```
  while IFS=$'\t' read -r ts c; do echo "fixed-window $ts $(MSYS_NO_PATHCONV=1 docker exec advance-be-k2l04-redis redis-cli --eval /lab/lua/fixed-window.lua k2l04:rl:fw:{$c}:$((ts/10000)) , 5 20000 $ts | sed -n 2p)"; done < <(tail -n +2 labs/k2-lesson-04-caching/data/traffic.tsv)
  ```
  A second line computes `summary … allowed= denied= max10s=` with awk, so the run prints the same lines as the oracle.
- `04-live.sh#fixed-boundary` is `#@ timed`: PTTL-aligned, 3 s window, 6 + 6 INCR inside one `sh -c`.
- `05-leaky.B.sh` is the worker: `BLPOP` barrier, then `for i in 1 2 3 4 5; do …BLPOP k2l04:lb:q 5; sleep 0.5; done`.
- `05-token.sh` regions follow the matrix R505–R514. `fail-modes` starts with `echo "→ advance-be-k2l04-small"`, runs `docker stop advance-be-k2l04-small`, then `timeout 1 docker exec advance-be-k2l04-small redis-cli PING || echo "fail-open: 200"`, then `docker start advance-be-k2l04-small`.
- Verify: `node PLAN/verify/verify-guide.mjs --runs --only-runs '^0[45]-' 2>&1 | tail -1` → `✔ không có lỗi` (includes V23 =oracle and V18).

**T3.4 Record and gate**
- `record-all.sh setup s1 s2 s3 s4 s5`:
  - `up main` → seed → check (`check.after-seed`) → seed → check (`check.rerun`);
  - `up cluster` before s2 and `up small` before s1;
  - A/B pairs with `--rep 3`;
  - `check.sh` after s1, s3 and s5.
- A failing row: fix the lab if it is wrong. If Redis really differs, mark the row `deviation` and write `deviations.md` (claim, observed, new narrative/chip). Never edit a run.
- Verify:
  - `node PLAN/verify/verify-guide.mjs --runs --only-runs '^(0[1-5]-|check\.|source-claims)'` → `✔ không có lỗi`;
  - `node PLAN/verify/rerun-gate.mjs` → `0 region khác`;
  - `bash PLAN/verify/fingerprint.sh --compare PLAN/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`.

## Test matrix
| Test (from phase 02) | Expected | Command |
|---|---|---|
| seed idempotent | rows identical | T02 via `--runs` (`same:`) |
| replay = oracle | V23 GREEN | `--runs --only-runs '^04-rl-replay'` |
| contradicting measurement | data kept, narrative changes | negative positive-control case (deviation with entry → GREEN) |
| lab negatives | all RED | `bash PLAN/verify/negative-tests.sh --labs-only` |
| L06 untouched | rc 0 | fingerprint `--compare` |

## Risks and rollback
- Clock steps: replay is immune; timed regions retry automatically.
- Rollback: `bash LABS/99-cleanup.sh`, then delete the stage files and their runs (`run-lab.mjs` rewrites the manifest).

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

=== FILE: phase-04-labs-runs-stages-6-9-postgres.md ===
---
phase: 4
title: "Labs and runs, stages 6–9 and Postgres"
status: pending
priority: P1
effort: 2.25h
dependencies: [3]
---

## Goal
Record counters (Postgres and Redis), unread broadcast, share data and practices, with bounded Postgres load in `k2l04_counter` only.

## Files to create/modify (owner: controller)
- `LABS/`:
  - `00-pg-setup.sql`, `99-pg-cleanup.sql`;
  - `06-hot-row.pgbench`, `06-spread.pgbench`, `06-counter.sh`, `06-counter-sql.sql`;
  - `07-unread.sh`, `08-pool.{A,B}.sh`, `08-pool.redis`, `08-tracking.redis`;
  - `09-delay-lua.{A,B}.sh`, `09-delay.{A,B}.redis`, `09-hll.sh`, `09-bitmap.sh`, `09-bloom.sh`;
  - `lua/{flush-read-reset,delay-claim,bloom-add,bloom-check}.lua`.
- `PLAN/runs/*`, `PLAN/runs/00-schemas-after.txt`.

## Tasks
**T4.1 Postgres setup**
- `00-pg-setup.sql`: `CREATE SCHEMA IF NOT EXISTS k2l04_counter`, then `post_count(post_id int primary key, like_count bigint not null default 0, comment_count bigint …, share_count …, view_count …)` with `generate_series(1,1000)`. Every statement is qualified with `k2l04_counter.`.
- The learner runs it in DBX `ADVANCE_BE_LAB`; the controller runs `node PLAN/verify/run-lab.mjs LABS/00-pg-setup.sql`.
- Verify: `bash LABS/check.sh | grep -c '^✔ C10'` → `1`.

**T4.2 Counter runs**
- `pg-hot-vs-spread`:
  1. reset `like_count = 0`;
  2. `docker exec -i quan-ly-hop-dong-postgres-1 pgbench -n -c 8 -j 2 -T 5 -U postgres -f /dev/stdin advance_be_lab < labs/k2-lesson-04-caching/06-hot-row.pgbench` (or the S10 fallback), run in the background with 4 × 1 s `pg_stat_activity` samples grouped by `wait_event_type, wait_event` for `application_name='pgbench'`;
  3. `SELECT like_count FROM k2l04_counter.post_count WHERE post_id=1`;
  4. the same for `06-spread.pgbench` (`\set pid random(1, 1000)`).
- `redis-incr`: custom `INCR k2l04:cnt:post:1` × 3 with `-c 8`, then `HINCRBY k2l04:cnt:h:1 likes 1`.
- `naive-race` / `incr-race`: 8 background loops inside `sh -c` on main.
- `write-behind`: first line `echo "→ advance-be-k2l04-small"`. 300 `HINCRBY k2l04:wb:delta 1 1` via pipe, then a flush via `flush-read-reset.lua` (`RENAME` to `k2l04:wb:inflight` + `HGETALL` + `DEL`, atomic) piped through awk into psql `UPDATE k2l04_counter.post_count … FROM (VALUES …)`. Then 50 more, `docker kill advance-be-k2l04-small`, `docker start advance-be-k2l04-small`, `HGET` → empty, and a SELECT.
- `memory`: 1000 posts × 4 counters as strings / per-post hash / bucketed hash (`post_id/100`). Record the `used_memory` delta for each layout, cleaned with scan + UNLINK.
- Verify: `node PLAN/verify/verify-guide.mjs --runs --only-runs '^0[06]-' 2>&1 | tail -1` → `✔ không có lỗi`.

**T4.3 Stages 7–9**
- Regions follow the matrix R701–R911.
- `fanout-*` are `#@ timed` and use `seq 1 N | awk '{print "INCR k2l04:unread:u"$1}' | docker exec -i advance-be-k2l04-redis redis-cli --pipe`.
- Bloom: `bloom-add.lua`/`bloom-check.lua` (k = 3 slices, m = 50000) are fed by `seq | awk '{print "EVALSHA …"}' | redis-cli` in one session, so the stage-9 script is the subject and there is no EVAL loop.
- HLL/bitmap use fixed `seq` inputs only; there is no `$RANDOM` anywhere (lint).
- Verify: `node PLAN/verify/verify-guide.mjs --runs --only-runs '^0[789]-' 2>&1 | tail -1` → `✔ không có lỗi`.

**T4.4 Gates**
- Verify:
  - `node PLAN/verify/verify-guide.mjs --runs --only-runs '^(0[0-9]-|check\.|source-claims)'` → `✔ không có lỗi`;
  - `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -At -f - < PLAN/verify/schema-list.sql > PLAN/runs/00-schemas-after.txt; diff <(grep -v k2l04_counter PLAN/runs/00-schemas-after.txt) PLAN/runs/00-schemas-before.txt` → no output;
  - `docker exec quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -Atc "select count(*) from pg_stat_activity where application_name='pgbench'"` → `0`;
  - fingerprint `--compare` rc 0.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| pgbench bounded | lint rejects `-i`, missing `-n`, `-c 9`, `-T 6` | negative group labs |
| other schemas untouched | diff empty | T4.4 |
| Bloom 0 false negatives | 10000/10000 | R908 |
| statistical bands | HLL ±2.43 %, Bloom 832–1005 = oracle | R903, R909 |
| rerun idempotent | 0 diffs | `node PLAN/verify/rerun-gate.mjs --only 09-hll.sh` |

## Risks and rollback
- The Postgres container is foreign: reads plus `k2l04_counter` writes only, at most 8 clients for 5 s, no `ALTER SYSTEM`, no restart.
- Rollback: `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab < LABS/99-pg-cleanup.sql`, then `bash LABS/99-cleanup.sh`.

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
title: "Widget data, homework, claims"
status: pending
priority: P1
effort: 1h
dependencies: [4]
---

## Goal
Produce every data file the guide reads, a self-checked homework, and sourced claims for the drill.

## Files (owner: controller)
- `PLAN/verify/make-widget-data.mjs`, `PLAN/runs/data/w1–w9.json`, `PLAN/runs/data/derived.json`, `PLAN/runs/drill-claims.txt`, `PLAN/verify/hw-bad-fixture.lua`
- `LABS/hw-check.sh`, `LABS/hw/bucket-scaffold.lua` (`__1__`…`__6__` blanks), `LABS/hw/solution.lua`, `LABS/drill/rate-limit.guard.ai-snippet.ts`

## Tasks
**T5.1 Widget data**
- Data sources (from the stage map): W1 R103/R104/R108, W2 R203/R205, W3 R301–R303, W4 R404–R406, W5 R501–R503/R508/R509, W6 R602/R605/R609, W7 R701/R702/R704, W8 R801/R802, W9 R903/R909/R910.
- `derived.json` holds bench medians (`med3`), tokens/s ratio, bytes per key/post/user, and fan-out ms × 100 = the 10M extrapolation.
- Verify: `node PLAN/verify/verify-guide.mjs --data` → `✔ không có lỗi`.

**T5.2 Homework (FR-M2-05 shape, §9.10)**
- Contract: KEYS[1] `k2l04:hw:bucket:<storeId>`; ARGV capacity, refill_ms, now_ms; returns `{allowed, retry_after_ms}`.
- `hw-check.sh [file.lua]` (default `hw/my-bucket.lua`) loads the script with `redis-cli -x SCRIPT LOAD`. It calls `s7` 30 times at `now = 1000000 + 10i` with cap 10 and refill_ms 100000.
- Checks:
  - H1: 10 allowed;
  - H2: 20 denied, each with retry > 0;
  - H3: `s8` is still allowed;
  - H4: the key has TTL > 0 and only `k2l04:hw:*` keys exist;
  - H5: a step back to now = 900000 mints no token.
- The bad fixture uses one global key and no PEXPIRE.
- Verify:
  - `node PLAN/verify/run-lab.mjs LABS/hw-check.sh --out hw-check.solution -- LABS/hw/solution.lua`, then `grep -c '^✔ H' PLAN/runs/hw-check.solution.txt` → `5`;
  - the same with `--out hw-check.bad -- PLAN/verify/hw-bad-fixture.lua`, then `grep -E '^✘ H' PLAN/runs/hw-check.bad.txt | cut -c1-5 | paste -sd,` → `✘ H3,✘ H4`;
  - `node PLAN/verify/verify-guide.mjs --runs` → `✔ không có lỗi` (all 79 rows).

**T5.3 Drill claims**
- The snippet is a NestJS 10 `CanActivate` guard using node-redis 6.3.0 (read only, no install) with six seeded mistakes (evidence §4.8).
- `drill-claims.txt` records, for every API claim, the unpkg URL (`@redis/client`, `@nestjs/common@10` `HttpStatus.TOO_MANY_REQUESTS`), the version, the quoted line, and RFC 9110 `Retry-After`. It is registered with `--register`.
- Verify: `grep -c '^https://' PLAN/runs/drill-claims.txt` → ≥ 6.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fake number in w4 | RED | `bash PLAN/verify/negative-tests.sh --data-only` |
| bad homework fixture | ✘ H3, H4 | T5.2 |
| hw keys cleaned | 0 | `docker exec advance-be-k2l04-redis redis-cli --scan --pattern 'k2l04:hw:*' \| wc -l` |

## Risks and rollback
Data is never typed by hand. Rollback: delete `runs/data/` and the homework files.

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

=== FILE: phase-06-guide-shell-assembler.md ===
---
phase: 6
title: "Guide shell and assembler (delegate D0)"
status: pending
priority: P1
effort: 1h
dependencies: [2]
---

## Goal
A shell that builds with stub stages and already passes the page-level checks.

## Files (owner: delegate D0, disjoint from labs/runs)
`PLAN/assembly/shell-head.html`, `shell-css.part`, `shell-tail.html`, `assemble.mjs`, all copied from `L06/assembly/`.

## Tasks
**T6.1 Adapt the shell**
- Steps:
  1. Paths: LABS, GUIDE, `STAGES = 9`, `WIDGETS = 9`.
  2. Storage keys `k2l04-*`; title "K2 · Bài 04 · Caching — đo trên máy bạn"; add `.glossary` CSS using tokens only.
  3. `#cach-hoc`:
     - time table with the "nếu còn sức" order;
     - `00-containers.sh up main`, seed and `check.sh`;
     - the DBX `ADVANCE_BE_K2L04_REDIS` setup;
     - the `127.0.0.1`-not-`localhost` note;
     - the Git Bash `MSYS_NO_PATHCONV` note;
     - two-terminal barrier order;
     - "L06 có thể đang bật hoặc tắt, bài này không phụ thuộc".
  4. Wrap sections: `#on-tap` (slides 31 recap and 39), `#bai-tap` (slide 32: scaffold, `hw-check.sh`, "network I/O models" reading), `#rate-limit-drill`, `#phong-van` (10 EXAM), `#cheat-sheet` (commands, complexity, algorithm comparison), `#ban-do-slide`, `#tham-khao` (slide 38 Pika, redis.io), `#tiep-theo` (FR-M2-05 token bucket + `Retry-After`, ADR-010 fail-open/closed, NFR-10, Boss Challenge 2.3, then the next roadmap item; hub 6380 is text only).
  5. `SLIDES` gets 39 entries from contract §6.
- Verify: `node PLAN/assembly/assemble.mjs --allow-stubs` prints `✔ đã ghi`; `node PLAN/verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15,V22` → `✔ không có lỗi`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| stale L06 strings | 0 | `grep -c "l06-\|lesson-06-redis\|6379" "$GUIDE"` → `0` |
| guide negatives on stub | c, d, e, f, g RED; others SKIP | `bash PLAN/verify/negative-tests.sh --guide-only` |

## Risks and rollback
Shell tokens break dark mode → V14. Rollback: delete `assembly/` shell files.

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
title: "Stage fragments (delegates D1–D3)"
status: pending
priority: P1
effort: 2h
dependencies: [5, 6]
---

## Goal
Nine verified stage fragments, quizzes and widgets written against the frozen contract.

## Files (disjoint ownership in `PLAN/assembly/`)
| Delegate | Files |
|---|---|
| D1 | `fragments/stage-01..03.html`, `.quiz.json`, `widgets/w1–w3.js` |
| D2 | `fragments/stage-04..06.html`, `.quiz.json`, `widgets/w4–w6.js` |
| D3 | `fragments/stage-07..09.html`, `.quiz.json`, `widgets/w7–w9.js` |

Delegates read contract, matrix, runs and labs. They never edit labs, runs, the shell or the contract; contract changes go to the controller.

## Tasks
**T7.1 Write fragments**
- Steps:
  1. Order per stage: `.glossary` → `.story` → diagram (slide image by relative path and/or SVG) → `table.stats` with `b.m[data-run]` → `.check30` → per-slide `.sayvs` with chip → "Làm mẫu" → `kiem-chung` + `table.expect` → `callout challenge` with PASS → quiz (4 items, `why` cites a run id).
  2. Two-terminal steps use `table.walk` (reset, B waits, A starts).
  3. W4 must reproduce each recorded replay summary from `traffic.tsv`.
  4. Example challenges:
     - S4: add the 26th request at 20000 and predict all three windows;
     - S5: choose capacity/refill for 3 req/s per store, PASS = replay matches the prediction;
     - S6: flush with a crash between `RENAME` and `UPDATE`, PASS = inflight survives;
     - S9: n = 20000 in the same filter, PASS = measured fp within the recomputed 3σ band.
- Verify: `for n in 1 2 3 4 5 6 7 8 9; do node PLAN/verify/verify-guide.mjs --fragment PLAN/assembly/fragments/stage-0$n.html >/dev/null || echo BAD $n; done` → no output; `for w in PLAN/assembly/widgets/*.js; do node --check "$w" || echo BAD; done` → no output.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| invented number | V07 RED | negative b |
| Lua before stage 3 | V24 RED | negative h |

## Risks and rollback
A delegate drifts from a lab snippet: the assembler overwrites `pre[data-cmd]` (V05). Rollback: delete that delegate's files.

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
title: "Assemble, verify, render-check"
status: pending
priority: P1
effort: 0.75h
dependencies: [7]
---

## Goal
One built guide passing every check, with negative tests proving the checks bite.

## Files (owner: controller)
GUIDE (generated), `PLAN/runs/verify-full.txt`, `PLAN/verify/render/`, `PLAN/verify/render-dark/`.

## Tasks
**T8.1 Build and verify**
- Steps:
  1. `node PLAN/assembly/assemble.mjs` (no stubs).
  2. Run the verifier (V01–V24), then `--runs`, `--data` and `--lint`, writing the output to `runs/verify-full.txt`.
  3. Run `bash PLAN/verify/negative-tests.sh`.
  4. Run `node PLAN/verify/widget-smoke.mjs --guide "$GUIDE"` (W2 slots = R203; W4 summaries = R404–R406).
- Verify:
  - each of the four verifier modes prints `✔ không có lỗi`;
  - the negatives print `25/25 ca đỏ đúng thiết kế · 0 SKIP` and the positive control is GREEN;
  - widget-smoke rc 0.

**T8.2 Render**
- Steps: with `TMP=TEMP=PLAN/verify/tmp`, run `node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "$GUIDE" --out PLAN/verify/render`; repeat for a `data-theme="dark"` copy into `render-dark`. Fix only fragments or the shell, never runs.
- Verify: both reports show 0 runtime errors, 0 overflow at 375/768/1440, 0 targets < 44 px; `stat -c %s "$GUIDE"` ≤ 532480; `bash PLAN/verify/fingerprint.sh --compare PLAN/runs/00-fingerprint-before.txt` rc 0.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| size ≤ 520 KB | V01 GREEN | verifier |
| slide images exist, relative path | V10, V22 GREEN | verifier |

## Risks and rollback
Wide terminal output can overflow; `pre` scrolls inside its box. Rollback: rebuild from fragments.

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

=== FILE: phase-09-ultra-code-review-fixes.md ===
---
phase: 9
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1.25h
dependencies: [8]
---

## Goal
An independent review by `/ak:code-review --pending --ultra --advice`; every verified Critical/Important finding fixed.

## Files
- `PLAN/reports/code-review-ultra-*.md` (reviewers, verifier), `PLAN/reports/code-review-ultra-fix-status.md` (controller).
- Fix targets: any phase 03–07 file (controller only).

## Tasks
**T9.1 Review**
- Scope: GUIDE, LABS, `PLAN/verify`, `PLAN/assembly`, runs (read-only).
- Lenses for the five reviewers:
  - Redis 7.2 / PG 16 correctness per slide;
  - safety (L06, 6379/6380, foreign Postgres);
  - trace integrity;
  - teaching and Vietnamese;
  - mobile/a11y.
- Verify: `ls PLAN/reports/code-review-ultra-*.md | wc -l` → ≥ 6.

**T9.2 Fix**
- A lab change means re-running the region with `run-lab.mjs`. Keep a measurement the review disputes unless the review brings new evidence; record the source in fix-status.
- Verify: `grep -c 'OPEN' PLAN/reports/code-review-ultra-fix-status.md` → `0`; the phase-08 T8.1/T8.2 Verify lines pass again.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| regression | phase 08 GREEN | phase 08 commands |
| learner state | ✔/`–`, rc 0 | `bash LABS/check.sh` |

## Risks and rollback
A review may question verified data: keep it (verification source in fix-status). Rollback per fix: re-run the region and reassemble.

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
title: "Docs, final gate, handoff"
status: pending
priority: P1
effort: 0.5h
dependencies: [9]
---

## Goal
Make the guide discoverable, prove nothing outside scope changed, and leave the lab ready for Đạt.

## Files (owner: controller; read each before editing)
- `D:/study/advance-be/README.md`: line 14 labs list gets `labs/k2-lesson-04-caching/` (redis-cli + SQL); the Khóa 3 section and tree get the guide path.
- `D:/study/advance-be/reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md` line 419 (K2 Bài 04 artifacts): append the lab and guide paths.
- Optional (open question): the L06 built guide line containing "Rồi sang K2 Bài 04 Rate Limiting" and `L06/assembly/shell-tail.html` line 219: wrap the text in a link to `../Khóa 3. …/k2_lesson_04_caching_teacher_guide.html`. Skip a file if its line differs.
- `D:/study/advance-be/plans/handoffs/k2-lesson-04-caching-guide-ready-<YYYYMMDD>.md`
- `PLAN/runs/00-fingerprint-after.txt`, `PLAN/runs/final-gate.txt`

## Tasks
**T10.1 Docs and handoff**
- The handoff covers: what exists, how to start (`up main`, seed, `check.sh`, DBX 6381), stage times, deviations, the run date, and the next step (OmniPOS M2 FR-M2-05, Boss Challenge 2.3).
- Verify: `grep -c 'k2-lesson-04-caching' README.md` → ≥ 1; `grep -c 'k2_lesson_04_caching_teacher_guide' reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md` → ≥ 1.

**T10.2 Final gate**
- Steps:
  1. `down cluster`, `down small`.
  2. `reset main` and seed; do not run `99-cleanup.sh`.
  3. Write `final-gate.txt` with these rows: verifier, runs, data, lint, negatives, widget-smoke, render, `check.sh`, fingerprint `--compare`, schema diff, `git status --short`.
- Verify:
  - `bash LABS/check.sh; echo rc=$?` → `rc=0`;
  - fingerprint `--compare` rc 0;
  - `git status --short` lists only GUIDE, `labs/k2-lesson-04-caching/`, this plan folder, README, the master curriculum, the handoff, and optionally the two L06 files;
  - `grep -c '✘' PLAN/runs/final-gate.txt` → `0`.
- No branch, commit or push.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| links resolve | files exist | `ls` each linked path |
| L06 guide intact (if edited) | V01, V02, V10 GREEN | `node L06/verify/verify-guide.mjs --only V01,V02,V10` |

## Risks and rollback
Doc edits are one-liners; revert by restoring the quoted original text. Only `git status` is used.

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
