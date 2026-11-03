=== FILE: plan.md ===
---
title: "K2 Bài 04 Caching teacher guide (rate limit, counter, practices; measured on Redis 7.2.3 and PG 16.15)"
description: "Vietnamese single-file guide for all 39 slides, backed by redis-cli/DBX/pgbench snippets recorded on K2L04-owned containers and schema k2l04_counter."
status: pending
priority: P1
effort: 12.75h
branch: main
tags: [k2-lesson-04, caching, rate-limit, redis, postgres, lua, tdd, teacher-guide]
blockedBy: []
blocks: []
created: 2026-11-02
---

# K2 Bài 04 — Caching teacher guide

## Overview
Build `reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html` (L06 no-rail shell; 285 core minutes, studied after L06 ≈ 2026-11-04). Every slide claim is either measured by a small snippet in `labs/k2-lesson-04-caching/` (redis-cli block, short `.sh`, `.sql` in DBX, pgbench via `docker exec`) recorded verbatim, or labelled "chưa đo trực tiếp". Redis work runs only on new containers `advance-be-k2l04-{redis,cluster,scratch}` (main `127.0.0.1:6381`), Postgres writes only in `k2l04_counter`, and a hashed fingerprint proves L06's container, network, volume and scripts unchanged. L06 tooling is copied and adapted; every checker is RED before any lab or HTML exists. Rate limits are compared by replaying one fixed trace `traffic/t1.tsv` (48 requests, client-supplied `now_ms`) through six limiters, so the numbers are exact despite the Docker VM clock; live demos (≤ 10 s windows) use the production `redis.call('TIME')` form.

## Data flow
1. `00-containers.sh up …` + `00-seed.redis` → known container state.
2. Lab regions (`.redis`, `.sh`, `.sql`, `.lua`, `pg/*.pgb`, `traffic/t1.tsv`) → `verify/run-k2l04.mjs` (host-ms clock, Redis barrier for A/B, `# clock` sanity line, Lua and traffic sha256 in the header) → `runs/*.txt` + `runs/manifest.tsv` (one sha256 line per file).
3. `verify/make-widget-data.mjs` → `runs/data/w1–w9.json` + `derived.json` (medians, ratios, each with `formula`, `inputs`, `sources`).
4. Delegates write fragments, quizzes and widgets against `assembly/contract.md` → `assembly/assemble.mjs` (copies `pre[data-cmd]` from labs, `pre[data-run]` from runs) → guide.
5. Verifier (guide, `--runs`, `--data`, `--lint`), negative tests, widget-smoke, render-check, fingerprint compare → ultra review → docs → handoff.

Postgres: the learner runs `.sql` in DBX `ADVANCE_BE_LAB`; the runner and pgbench use only `docker exec -i quan-ly-hop-dong-postgres-1 psql|pgbench -U postgres … advance_be_lab`.

## Stage map
| Stage | Slides | Content (run stems) | Core | Opt | Widget |
|---|---|---|---|---|---|
| `#cach-hoc` | 1–3 | containers, DBX 6381, two terminals, glossary, "đã gặp ở L06" | 10 | – | – |
| 1 Nền tảng | 4–11 | use cases; slide 6 checks; slide 7 benchmark + limits; KEYSLOT/hashtag/CROSSSLOT | 30 | 5 Pub/Sub source | W1 slots |
| 2 Race, WATCH, Lua | 33 | lost update, WATCH abort (A/B), first Lua | 25 | – | W2 race |
| 3 Cửa sổ | 12–14 | INCR/EXPIRE bug, live boundary, replay fixed/log/counter, counter error, ZSET memory | 40 | 5 live log | W3, W4 |
| 4 Bucket, batch, 429 | 15–16 | leaky queue (A/B), leaky/token/interval replay, token race (A/B), memory, batch RTT, over-admission, 429 + fail-open/closed, comparison | 40 | 5 OOM | W5 |
| 5 Counter | 17–22 | PG hot/spread/async + lock sampler (A/B), Redis INCR/HINCRBY, write-behind + loss, memory layouts | 40 | 10 bucketed hash | W6 |
| 6 Unread | 23–25 | fan-out N = 10,000 vs pointer, mark-as-read | 20 | 5 extrapolation | W7 |
| 7 Share data | 26–30 | pool polling vs BLPOP (A/B), Hazelcast/tracking diagrams | 20 | 5 | SVG |
| 8 Delay, HLL | 34–35 | delay naive vs Lua (A/B), HLL accuracy, encoding, merge | 25 | 5 PFMERGE | W8 |
| 9 Bitmap, Bloom | 36–37 | BITOP AND, sparse offset, hand-built Bloom FP/FN/memory | 30 | 5 k sweep | W9 |
| Wrap | 31, 32, 38, 39 | recap, `#bai-tap`, `#tham-khao`, `#tiep-theo` | 5 | 45 homework (evening), 10 drill | – |
| **Total** | 39 | 6 two-client timelines | **285** | 55 + 45 | 9 |

"Nếu còn sức" order (drop first → last): PFMERGE, Bloom k sweep, OOM fail mode, bucketed hash, live log `TIME`, Pub/Sub source walk, unread extrapolation, tracking diagram, driver drill. Core rate-limit and counter items are never optional. Lua first appears in stage 2 (slide 33), so stage 1 and `#cach-hoc` contain no Lua.

## Container lifecycle (all `redis:7.2.3`, local image, no pull)
| Container | Network | Publish | Volumes | Command | Up / down |
|---|---|---|---|---|---|
| `advance-be-k2l04-redis` (main) | `advance-be-k2l04` | `127.0.0.1:6381:6379` only | `advance-be-k2l04-data:/data`, `<labs>:/lab:ro` | `redis-server --appendonly no` | `up main`; removed only by `99-cleanup.sh --all` |
| `advance-be-k2l04-cluster` | `advance-be-k2l04` | none | anonymous `/data` | `--cluster-enabled yes --cluster-config-file nodes.conf --appendonly no --save ""`, then `CLUSTER ADDSLOTSRANGE 0 16383` | `up cluster` / `down cluster` |
| `advance-be-k2l04-scratch` | `advance-be-k2l04` | none | anonymous `/data`, `<labs>:/lab:ro` | `--appendonly no --save ""` | `up scratch` / `down scratch` |

`reset main` restores `maxmemory 0`, `noeviction`, `slowlog-log-slower-than 10000`; `reset scratch` adds `FLUSHALL`. `down <extra>` = `docker rm -f -v <exact name>`; no `prune`. The in-container prompt reads `127.0.0.1:6379>` (one callout explains). L06 may be up or down; nothing depends on it.

## Phases
| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract, baseline, smoke](phase-01-contract-baseline-smoke.md) | 0.75h | – | contract v1, baseline, smoke S1–S9 |
| 02 | [Tests first](phase-02-tests-first.md) | 2h | 01 | selftest GREEN; `--runs`, `--lint`, `check.sh` RED as designed |
| 03 | [Containers and lab files](phase-03-containers-lab-files.md) | 1.5h | 02 | `--lint` GREEN; `check.sh` rc 0 after `up main` + seed |
| 04 | [Recorded runs](phase-04-recorded-runs.md) | 2.5h | 03 | `--runs`, rerun gate, fingerprint GREEN |
| 05 | [Widget data, homework, drill](phase-05-widget-data-homework-drill.md) | 0.75h | 04 | `--data` GREEN; hw ✔ / bad ✘ |
| 06 | [Shell and assembler](phase-06-shell-assembler.md) | 1h | 02 (parallel with 03–05) | stub build GREEN on page checks |
| 07 | [Stage fragments (3 delegates)](phase-07-stage-fragments.md) | 2h | 05, 06 | `--fragment` GREEN × 9; `node --check` × 9 |
| 08 | [Assemble, verify, render](phase-08-assemble-verify-render.md) | 0.75h | 07 | verify GREEN; negatives 33/33; render clean |
| 09 | [Ultra code review and fixes](phase-09-ultra-review-fixes.md) | 1h | 08 | 0 open Critical/Important |
| 10 | [Docs, final gate, handoff](phase-10-docs-final-gate-handoff.md) | 0.5h | 09 | final gate all ✔; `git status` paths allowed |

## Expected-result matrix (frozen in `verify/expected.tsv` in phase 02)
OK/PART/FIX = `Đúng trên Redis 7.2`/`Đúng một phần`/`Cần sửa`; platform in the chip note ("đo trên PG 16.15", "đọc mã nguồn 7.2.3", "chưa đo trực tiếp"). "n" = recorded value, asserted by relation; timings labelled "phụ thuộc máy". Replay: L = 5 per W = 10,000 ms; token/leaky cap 5, rate 0.5/s. `t1.tsv`: S1 boundary 9000…10800 step 200 (10), S2 burst 40000…40070 step 10 (8), S3 steady 80000…109000 step 1000 (30). Replay counts below were derived by hand from these rules before any run.

| ID | Run (region) | Slide | Expected | Chip |
|---|---|---|---|---|
| D04 | – design | 4 | cache layers diagram | OK |
| D05 | – design | 5 | speed/buffer/share; measured in stages 4 and 7 | OK |
| R01 | 01-fundamentals.server | 6 | `redis_version:7.2.3`, `multiplexing_api:epoll`, `io_threads_active:0`; UNSUBSCRIBE O(subscribers) per `src/pubsub.c` 7.2.3 | PART |
| R02 | 01-bench.setget | 7 | custom SET/GET on `k2l04:bench:k`, 3 reps each, 0 < rps < 5,000,000 | PART |
| R03 | 01-fundamentals.limits | – | `maxclients` 10000, `hash-max-listpack-entries` 512, `hll-sparse-max-bytes` 3000 | – |
| D08 | – design | 8 | failover/Sentinel not run ("chưa đo trực tiếp") | PART |
| R04 | 01-cluster.keyslot | 9 | `cluster_slots_assigned:16384`; `k2l04:{post:1}:likes` and `k2l04:{post:1}:views` same slot | OK |
| R05 | 01-cluster.crossslot | – | untagged `MSET` → `CROSSSLOT`, tagged `OK`; main → `cluster support disabled` | – |
| D11 | – design | 11 | recap mapped to K1 L02/L06 | PART |
| R06 | 02-race.ab.timeline | – | both GET `100`, final `101` (lost update) | – |
| R07 | 02-race.ab.timeline | 33 | A `WATCH`…`EXEC` → `(nil)` after B `SET` at +0.5 s; final `999` | OK |
| R08 | 02-lua.capped | – | `points-add.lua` cap 80: 30, 60, 80 | – |
| R09 | 03-rl-fixed.bug | – | INCR without EXPIRE → `TTL` -1; `SET … NX EX 10` + `INCR` → TTL 1–10 | – |
| R10 | 03-rl-live.boundary | – | `allowed=a span_ms=s`, a ≥ 6, s < 2000 | – |
| R11 | 03-rl-replay.fixed | 13 | `fixed allowed=30 denied=18 s1=10/10 s2=5/8 s3=15/30 burst10s=10` | OK |
| R12 | 03-rl-replay.log | – | `log allowed=25 denied=23 s1=5/10 s2=5/8 s3=15/30 burst10s=5` | – |
| R13 | 03-rl-replay.counter | 14 | `counter allowed=26 denied=22 s1=6/10 s2=5/8 s3=15/30 burst10s=6`; line `10200 1 4.90` | PART |
| R14 | 03-rl-replay.compare | – | `counter_vs_log diff=13 over=7 under=6` | – |
| R15 | 03-rl-memory.log | – | 100 entries `listpack`, 1000 `skiplist`; bytes/entry grows | – |
| R16 | 03-rl-live.log-time | – | `rl-log.lua` with `*` (TIME): 7 calls → `allowed=5 denied=2` | – |
| R17 | 04-leaky.queue.timeline | 15 | 5 queued, 3 `DROP`; pop gaps 1500–2600 ms | OK |
| R18 | 04-token.replay-leaky | – | `leaky allowed=29 denied=19 s1=5/10 s2=5/8 s3=19/30 max_delay_ms=8000`; S1 delays 0 1800 3600 5400 7200 | – |
| R19 | 04-token.replay-token | – | `token allowed=29 denied=19 s1=5/10 s2=5/8 s3=19/30 burst10s=9`; first denial `retry_after_ms` 1000 | – |
| R20 | 04-token.replay-interval | 16 | `interval allowed=30 denied=18 s1=10/10 s2=5/8 s3=15/30 burst10s=10`; `same_as_fixed=48/48` | PART |
| R21 | 04-token-race.ab.timeline | – | naive GET/compute/SET: both allowed from 1 token | – |
| R22 | 04-token-race.ab.timeline | – | `token-bucket.lua` `*`: exactly one `1`, one `0` | – |
| R23 | 04-token.memory | – | bucket Hash `listpack`, MEMORY USAGE n < 200 | – |
| R24 | 04-token.batch-bench | – | `-c 1` EVALSHA take 1 vs 10, 3 reps; tokens/s(10) ≥ 5 × tokens/s(1) | – |
| R25 | 04-token.overadmit | – | `per_request burst_admitted=10`, `batch burst_admitted=19` | – |
| R26 | 04-rl-gate.contract | – | `200=10 429=20`, every `Retry-After` > 0; Redis down: open 3× 200, closed 3× 503 | – |
| D19 | – design | 19 | requirements (1B users, 1M QPS), "chưa đo trực tiếp" | OK |
| R27 | 05-counter-pg.load.timeline | 20 | hot phase: a sampler line `Lock\|transactionid\|n` or `Lock\|tuple\|n`, n ≥ 1; tps n | PART |
| R28 | 05-counter-pg.load.timeline | – | spread tps ≥ 2 × hot; fewer Lock samples | – |
| R29 | 05-counter-pg.load.timeline | – | `synchronous_commit=off` hot tps ≥ 2 × hot tps | – |
| R30 | 05-counter-pg.load.timeline | – | final counts = transactions processed (no lost update in PG) | – |
| R31 | 05-counter-redis.incr | 22 | INCR/HINCRBY `-c 8 -n 100000` × 3: value = 100000 each | PART |
| X01 | derived:redis-vs-pg-hot | – | median INCR rps / hot tps ≥ 10 | – |
| R32 | 05-writebehind.flush | 21 | 1000 HINCRBY → RENAME → `UPDATE 10`, PG +1000; late likes pending | PART |
| R33 | 05-writebehind.loss | – | scratch kill + start → `DBSIZE` 0, 500 likes lost | – |
| R34 | 05-memory.layouts | – | bytes/post: Strings > Hash > bucketed Hash; both Hash layouts `listpack` | – |
| D24 | – design | 24 | requirement 10M users | OK |
| R35 | 06-unread.fanout | – | N = 10,000: `errors: 0, replies: 10000` | – |
| R36 | 06-unread.pointer | 25 | seq 6, userA read 4 → unread 2; `ZCOUNT (4 +inf` → 2 | OK |
| R37 | 06-unread.mark | – | naive HSET 6 then 4 → 4; `mark-read.lua` → 6 | – |
| D27 | – design | 27 | two-way over one-way MQ | OK |
| D28 | – design | 28 | reply-topic problems | OK |
| R38 | 07-share.ab.timeline | 29 | `polls=n`, n ≥ 10, response received | PART |
| R39 | 07-share.ab.timeline | – | BLPOP reply ≤ 300 ms after `RPUSH` | – |
| D30 | – design | 30 | Hazelcast, CLIENT TRACKING: "chưa đo trực tiếp" | PART |
| R40 | 08-delay.ab.timeline | – | naive: both pollers process `o1` | – |
| R41 | 08-delay.ab.timeline | 34 | `delay-claim.lua` (TIME): `o1` once, `o2`/`o3` remain | OK |
| R42 | 08-hll.accuracy | 35 | N = 1000/10000/100000, \|err\| ≤ 2.43 % each; 100000 → `99655` | OK |
| R43 | 08-hll.encoding | – | sparse < 3000 B; dense `STRLEN` 12304, `HYLL` | – |
| R44 | 08-hll.merge | – | 7 overlapping days, union 11000, merged PFCOUNT 10733–11267 | – |
| R45 | 09-bitmap.segments | 36 | BITCOUNT 5000 / 3333, AND → 1666; `STRLEN` 1251; sparse `STRLEN` 1250000 | PART |
| R46 | 09-bloom.fp | 37 | `members_hit=10000`; `fp` 832–1005; `STRLEN` 6250 vs Set ≥ 62500 B | OK |
| D31 | – design | 31 | recap restated with measured corrections | PART |
| R47 | hw-check.solution | – | ✔ H1–H6, no ✘ | – |
| R48 | hw-check.bad | – | ✘ H3, H4, H5; ✔ H1, H2, H6 | – |
| R49 | check.after-seed | – | every row ✔ or –, C01 ✔ | – |
| R50 | check.rerun | – | `same:check.after-seed` | – |

Null-chip slides (frozen): 1, 2, 3, 10, 12, 17, 18, 23, 26, 32, 38, 39. Chip slides (27): 4, 5, 6, 7, 8, 9, 11, 13, 14, 15, 16, 19, 20, 21, 22, 24, 25, 27, 28, 29, 30, 31, 33, 34, 35, 36, 37, each with exactly one chip row above. Bloom band: p = (1 − e^(−0.6))^3 = 0.0918, n·p = 918.5, σ = 28.9, ±3σ = 832–1005. HLL band: 3 × 0.81 % = 2.43 %.

## Acceptance criteria
1. Guide ≤ 520 KB, no external script, Google Fonts only, no rail, slide images by relative path, no `data:` image (P08: V01, V10, V22).
2. `SLIDES` = 1–39 once each; chips = `expected.tsv` chip rows; null chips = the frozen list (P08: V04).
3. Each stage has `p.goal`, `dl.wwh`, `dl.gloss`, `.story`, figure/SVG, `table.stats`, `.check30`, worked example, `kiem-chung` + `table.expect`, `callout challenge` with PASS, 4 quiz items citing run ids (P07, P08: V11, V12).
4. Every `b.m`, `pre[data-run]`, `run-wN` and quiz/exam number traces to a manifest-hashed run, `derived.json` or `constants.tsv` (P04, P05, P08: V06–V08, V16, M01).
5. Every run row matches or is a logged deviation with changed narrative/chip (P04: D01).
6. Timed runs carry `# clock` ratio 0.8–1.3; timing tables say "phụ thuộc máy" (P04, P08: V23, V25).
7. `--lint` GREEN: keys `k2l04:`; containers `advance-be-k2l04-*` plus `psql`/`pgbench` exec on `quan-ly-hop-dong-postgres-1`; no 6380, no host port 6379; pgbench `-n -f`, `-c ≤ 8`, `-T ≤ 5`, never `-i`; SQL writes only `k2l04_counter.`; no `redis-benchmark -t`; Lua from stage 2 on; `FLUSHALL` only on scratch/cluster; `CONFIG SET` restored per region; no `prune` (P03: V17).
8. `# lua` and `# traffic` header hashes equal the files (P04: V18, V24).
9. `check.sh` rc 0 (✔/–) after seed, after a second seed (identical body) and at handoff (P04, P10).
10. Negative tests 33/33 RED with their codes, 0 SKIP (P02, P08).
11. Storage keys `k2l04-*`; dark and light work; widgets use `textContent`/`esc()` (P08: V09, V14, V19).
12. render-check 375/768/1440, light and dark: 0 errors, 0 overflow, 0 targets < 44 px (P08).
13. `fingerprint.sh --compare` rc 0 at P04 and P10: L06 identity, network, volume, lab files unchanged, bind unchanged or down, `l06_k2l04_keys` 0 or down, foreign containers and `pg_schemas` unchanged (P01, P04, P10).
14. Homework solution ✔ H1–H6; bad fixture ✘ H3–H5 (P05).
15. No open Critical/Important review finding (P09).
16. README, master curriculum and (if one-line) L06 `#tiep-theo` link the guide; handoff written; `git status` paths allowed; no git step but `git status` (P10).

## Risks and rollback
| Risk | L×I | Mitigation |
|---|---|---|
| Docker VM clock ≈ 8 % fast, steps back ≤ 2.8 s | H×H | replay with ARGV `now_ms`; elapsed clamp; `# clock` ratio 0.8–1.3, else re-run (max 2); claim relations, label "phụ thuộc máy" |
| redis-benchmark negative/absurd rate | M×M | 3 reps per region, median; rep ≤ 0 or ≥ 5,000,000 → re-run (max 2) |
| Runner `ECHO` markers get queued inside `MULTI` | certain | WATCH side is one `.sh` line `(printf …; sleep 1.5; printf …) \| docker exec -i … redis-cli --no-raw` |
| pgbench stdin fails, or `-d` parsed as debug | M×M | smoke S4 picks stdin or a `/tmp` file removed in the same line; dbname is the last positional argument |
| Load on the foreign PG container | L×H | `-c 8 -T 5`, `-n -f`, schema-only writes, `pg_schemas` gate, no `ALTER SYSTEM`/restart |
| DB-level `search_path` is `lab03_indexing` | certain | every SQL name is `k2l04_counter.<table>` |
| Learner types `advance-be-redis` by habit | M×M | guide callout; `l06_k2l04_keys` read-only probe; scoped UNLINK fix line |
| Guide over 520 KB | M×M | fragments ≤ 40 KB, `…` excerpts, folds |

Rollback: `bash labs/k2-lesson-04-caching/99-cleanup.sh` UNLINKs `k2l04:*` on main except `k2l04:my:*`/`k2l04:hw:*`, restores config and removes extras by exact name; `--all` also removes main, then the network and `advance-be-k2l04-data` only when nothing is attached. `99-cleanup.sql` (DBX) drops schema `k2l04_counter` only. All repo files are new except the doc edits in phase 10, whose original lines are quoted there.

## Open questions for the user
None blocking. One confirmation: the homework keeps the supervisor default (FR-M2-05 token bucket per `storeId`, 50/50 scaffold), because it is the exact piece Đạt writes next in OmniPOS M2 and Boss Challenge 2.3.

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
Freeze every shared name, record a privacy-safe fingerprint of everything K2L04 must not change, and decide the learner run method by smoke tests.

All commands in every phase run in Git Bash from `D:/study/advance-be` after `export P=plans/261102-1332-k2-lesson-04-caching-teacher-guide`. No git command except `git status`.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/verify/fingerprint.sh`
- `…/runs/00-fingerprint-before.txt`, `…/runs/run-method-smoke.txt`, `…/assembly/contract.md`

## Tasks
**T1.1 fingerprint.sh**
- Goal: one controller-only script whose output proves L06, foreign containers and other PG schemas are unchanged.
- Target: `$P/verify/fingerprint.sh` (start from `plans/261031-1651-lesson-06-redis-teacher-guide/verify/fingerprint.sh`).
- Steps: line 2 `export MSYS_NO_PATHCONV=1`. Use `docker ps -a --no-trunc --format '{{.ID}}|{{.Image}}|{{.Names}}|{{.Status}}'`; never inspect foreign containers or env. Print in order:
  1. sorted `sha256(id|image)|Up|Exited` per container not named `advance-be-k2l04-*`/`advance-be-redis*` (names never printed);
  2. `l06_main=sha256(id|image)`, `l06_bind=<docker port advance-be-redis 6379>|down`, `l06_net=sha256(network Id of advance-be-l06)`, `l06_vol=present|missing` (`advance-be-redis-data`);
  3. `l06_files=` sha256 of sorted `sha256sum` of `labs/lesson-06-redis/**` minus `node_modules/`;
  4. `l06_k2l04_keys=<n>|down` (read-only `--scan --pattern 'k2l04:*' | wc -l` on `advance-be-redis`);
  5. `port6380=free|bound`, `port6380_lab=none|<names>`;
  6. `pg_schemas=` sha256 of `psql -Atc "select string_agg(nspname, ',' order by nspname) from pg_namespace where nspname !~ '^pg_' and nspname not in ('information_schema','k2l04_counter')"` via `docker exec quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab`;
  7. `k2l04_bind=<docker port advance-be-k2l04-redis 6379>|none`, `k2l04_run_id_match=yes|no|none` (host `net.connect(6381,'127.0.0.1')` vs `docker exec`).
  `--compare <before>`: rc 0 only if all type-1 lines persist with the same status, `l06_main/net/vol/files` and `pg_schemas` are equal, `l06_bind` equal or `down`, `l06_k2l04_keys` 0 or `down`, `port6380_lab=none`; new lines print `info: +N new`.
- Success: two runs identical; no container name in output.
- Verify: `bash $P/verify/fingerprint.sh > $P/verify/tmp/fp-a.txt && bash $P/verify/fingerprint.sh > $P/verify/tmp/fp-b.txt && diff $P/verify/tmp/fp-a.txt $P/verify/tmp/fp-b.txt && echo SAME` → prints `SAME`; `grep -ciE 'quan-ly|omnipos|password' $P/verify/tmp/fp-a.txt` → `0`.

**T1.2 baseline**
- Goal: the reference for every later compare.
- Target: `$P/runs/00-fingerprint-before.txt`.
- Steps: `mkdir -p $P/runs $P/verify/tmp`; `bash $P/verify/fingerprint.sh > $P/runs/00-fingerprint-before.txt`.
- Success: contains `l06_k2l04_keys=0` (or `down`), `port6380_lab=none`, `k2l04_bind=none`.
- Verify: `grep -cE '^(l06_k2l04_keys=(0|down)|port6380_lab=none|k2l04_bind=none)$' $P/runs/00-fingerprint-before.txt` → `3`; `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → last line `rc=0`.

**T1.3 smoke S1–S9**
- Goal: prove each run method on this machine before writing labs.
- Target: `$P/runs/run-method-smoke.txt` (one block per test, first line `S<n> <name>: <result>`).
- Steps: `docker run -d --name advance-be-k2l04-smoke redis:7.2.3 redis-server --save "" --appendonly no` (no port, no network). Then:
  - S1 `printf 'SET k2l04:smoke 1\nGET k2l04:smoke\n' | docker exec -i advance-be-k2l04-smoke redis-cli --no-raw` → `OK`, `"1"`.
  - S2 piped `# x` → `ERR unknown command '#'`.
  - S3 `docker exec advance-be-k2l04-smoke echo /lab/x` (mangled) vs `MSYS_NO_PATHCONV=1 docker exec advance-be-k2l04-smoke echo /lab/x` → `/lab/x`.
  - S4 `SELECT 1;` in `$P/verify/tmp/smoke.pgb`: `MSYS_NO_PATHCONV=1 docker exec -i quan-ly-hop-dong-postgres-1 pgbench -n -c 1 -T 1 -U postgres -f /dev/stdin advance_be_lab < $P/verify/tmp/smoke.pgb`; if no `number of transactions actually processed` line, use `docker exec -i quan-ly-hop-dong-postgres-1 sh -c 'cat > /tmp/k2l04-smoke.pgb && pgbench -n -c 1 -T 1 -U postgres -f /tmp/k2l04-smoke.pgb advance_be_lab; rm -f /tmp/k2l04-smoke.pgb'`. Record `pgbench_feed=stdin|tmpfile`.
  - S5 `-e PGAPPNAME=k2l04-smoke … psql -Atc "show application_name"` → `k2l04-smoke`; S6 `-e PGOPTIONS='-c synchronous_commit=off'` + `show synchronous_commit` → `off`.
  - S7 `sh -c 'command -v seq xargs sed awk'` in the smoke container → paths or `missing`.
  - S8 median host ms of 10 `docker exec … redis-cli PING` → `exec_spawn_ms=n` (why RTT is never measured across spawns).
  - S9 `select 1` on DBX `ADVANCE_BE_LAB` via the DBX MCP, else `S9 DBX: unverified, learner path only`.
  - `docker rm -f -v advance-be-k2l04-smoke`.
- Success: 9 blocks; smoke container gone.
- Verify: `grep -cE '^S[1-9] ' $P/runs/run-method-smoke.txt` → `9`; `grep -cE '^pgbench_feed=(stdin|tmpfile)$' $P/runs/run-method-smoke.txt` → `1`; `docker ps -aq --filter name=advance-be-k2l04-smoke | wc -l` → `0`.

**T1.4 contract.md v1**
- Goal: the frozen names parallel work depends on.
- Target: `$P/assembly/contract.md` (start from L06 `assembly/contract.md`).
- Steps: §1 key registry (`k2l04:` + `seed, race, rl:*, tb, q, cnt, wb, mem, bc, unread, pool, reply, delay, hll, bm, bf, barrier, hw, my`) and the plan.md container table; §2 formats (`.redis`/`.sh` as L06; `.sql` regions `-- #region <id> · <tiêu đề> (slide N)` … `-- #endregion`, one `;`-terminated statement per line, no `$$`, names `k2l04_counter.*`; `.pgb`; Lua keys via `KEYS` only, `ARGV[1]` = `now_ms` or `*` = `redis.call('TIME')`; `traffic/*.tsv` header `ts_ms<TAB>client`); §3 run ids and headers (`# chạy lúc`, `# lua <f> sha256=`, `# traffic <f> sha256=`, `# clock redis_ms= host_ms= ratio=`); §4 L06 fragment/CSS vocabulary + `dl.gloss`, storage keys `k2l04-*`, the 16 section ids of V03; §5 learner workflow from S1–S9; §6 39-row slide table (title "Trang N", stage, chip, chip row, `id="sl-NN"` for PART/FIX) from the plan matrix.
- Success: §6 has 39 rows; null chips equal the frozen list.
- Verify: `node -e "const t=require('fs').readFileSync('$P/assembly/contract.md','utf8');const r=[...t.matchAll(/^\| (\d+) \|/gm)].map(m=>+m[1]);console.log(r.length, new Set(r).size)"` → `39 39`.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| fingerprint deterministic | `SAME` | T1.1 Verify |
| baseline compare | `rc=0` | T1.2 Verify |
| smoke complete | `9` blocks, feed decided | T1.3 Verify |
| contract slides | `39 39` | T1.4 Verify |

## Risks and rollback
The smoke writes only `k2l04:smoke` on a throwaway container and runs `SELECT 1` through pgbench. Rollback: delete the four files and `docker rm -f -v advance-be-k2l04-smoke`.

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
title: "Tests first: runner, verifier, lint, expected matrix, check.sh, negative tests"
status: pending
priority: P1
effort: 2h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Every checker exists and is RED for the right reason before any lab region, run or HTML exists.

## Files to create/modify (owner: controller)
Plan folder `verify/`: `lab-text.mjs`, `run-k2l04.mjs`, `merge-timeline.mjs`, `verify-guide.mjs`, `rerun-gate.mjs`, `widget-smoke.mjs`, `negative-tests.sh`, `expected.tsv`, `constants.tsv`, `deviations.md`, `fixtures/`. Labs: `D:/study/advance-be/labs/k2-lesson-04-caching/check.sh`. Copy each from `plans/261031-1651-lesson-06-redis-teacher-guide/verify/`, then apply only the changes below.

## Tasks
**T2.1 lab-text.mjs** — Goal: one display rule. Steps: add `.sql` regions (`-- #region <id>` … `-- #endregion`); `displayText` keeps `.sql`, `.sh`, `.lua`, `.pgb`, `.ts`, `.tsv` verbatim and drops `#` lines only for `.redis`. Success/Verify: `node -e "import('./$P/verify/lab-text.mjs').then(m=>console.log(typeof m.displayText, typeof m.regionText))"` → `function function`.

**T2.2 run-k2l04.mjs** — Goal: the L06 runner, retargeted.
- Steps: (1) `GUARD = /^advance-be-k2l04-(redis|cluster|scratch)$/`, default main. (2) `quan-ly-hop-dong-postgres-1` allowed only as `docker exec … psql|pgbench`; pgbench needs `-n`, `-f`, `-c` ≤ 8, `-T` ≤ 5 and no `-i`/`--initialize`/`-t`; else exit 2. (3) `.sql` kind: one `docker exec -i -e PGAPPNAME=k2l04-runner quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -v ON_ERROR_STOP=1 -P pager=off -f -` session, markers via `\echo @@k <ms>`, sends shown as `advance_be_lab=# <line>`. (4) Headers `# lua`, `# traffic`. (5) `# clock` from `TIME` before/after regions with `redis-benchmark`, `pgbench`, `sleep` or `BLPOP`. (6) `--ab`, `--rep`, `--register` as L06 (barrier `k2l04:barrier:<scenario>`).
- Success: guard refuses foreign targets; one manifest line per file.
- Verify: `node $P/verify/run-k2l04.mjs $P/verify/fixtures/x.redis --region a --ct advance-be-redis; echo rc=$?` → `rc=2`; `node $P/verify/run-k2l04.mjs $P/verify/fixtures/pg-bad.sh --region a; echo rc=$?` (fixture line `docker exec quan-ly-hop-dong-postgres-1 pgbench -i advance_be_lab`) → `rc=2`.

**T2.3 verify-guide.mjs** — Goal: L06 V01–V21 retargeted plus new rules.
- Steps: retarget paths, slides 1–39, keys `k2l04-`, 9 stages, V03 sections from contract §4. V07 ignores `advance_be_lab=# ` send lines; V12 also needs `dl.gloss`; V15 adds `PGPASSWORD|postgres://[^ ]*@|password=`; V16 accepts `constants.tsv` numbers; `evalExpr` gains `median3`; `--runs` checks `derived:<name>` rows. New: V17 lint = plan AC 7 (Lua only in stems `02-`…`09-`, `lua/`, `hw/`; `advance-be-redis` only in comments); V22 no `data:` image, images exist; V23 timing tables say "phụ thuộc máy"; V24 traffic hash; V25 clock ratio.
- Verify: `node $P/verify/verify-guide.mjs --selftest; echo rc=$?` → `rc=0`; `node $P/verify/verify-guide.mjs --lint 2>&1 | tail -1` → contains `labs dir missing`.

**T2.4 expected.tsv, constants.tsv, deviations.md** — Goal: freeze the matrix. Steps: columns `id run slides regex claim chip status`; one row per plan matrix row (R01–R50, X01, 10 design rows); relations as `⇒` predicates (`a==30; d==18`, `ratio(s,h)>=2`). `constants.tsv` (`name value source`): 0.81, 2.43, 16384, 512, 3000, 10000, 0.7 and the slide-7 figures. `deviations.md`: header only. Success/Verify: `node $P/verify/verify-guide.mjs --runs 2>&1 | grep -c 'missing run'` → `50`; `… | grep -c 'missing derived'` → `1`.

**T2.5 check.sh** — Goal: read-only lab invariants scanning only `advance-be-k2l04-*`. Steps (L06 tool-script rule): C01 main image/version/network/`/lab` ro/`/data` volume; C02 cluster, C03 scratch (absent `–`); C04 only main publishes, exactly `127.0.0.1:6381`; C05 host 6381 run_id = container run_id; C06 all keys `k2l04:`; C07 config defaults; C08 seed values; C09 no `barrier`/`rl:live` keys; C10 `post_count` 1001 rows (no schema `–`). Exit code = number of ✘. Verify (labs dir holds only `check.sh` now): `bash labs/k2-lesson-04-caching/check.sh > $P/verify/tmp/c0.txt; rc=$?; grep -cE '^(✘ C01|– C02|– C03|– C10) ' $P/verify/tmp/c0.txt; [ $rc -eq $(grep -c '^✘' $P/verify/tmp/c0.txt) ] && echo MATCH` → prints `4` then `MATCH`.

**T2.6 negative-tests.sh** — Goal: prove each checker bites. Steps: L06 groups plus new cases. `--guide-only` (12): a V05, b V07, c V09 (`l06-` key), d V04 (slide 21 removed), e V04 (slide 13 chip changed), f V10, q V19, s V11, u V16, x V21, n7 V22 (`data:` image), n8 V23 (label removed). `--labs-only` (17, planted into a labs copy): g R11 (corrupt run), h M01, m D01, r V18, t1 V24 (one byte in a `t1.tsv` copy), and V17 for j `SET foo 1`, k `echo 6380`, k2 `-p 6379:6379`, l `CONFIG SET maxmemory 1mb` unrestored, o `docker restart advance-be-redis`, p volume prune (word built from parts), n1 `pgbench -i`, n2 pgbench without `-n`, n3 `-c 16`, n4 `INSERT INTO public.x`, n5 `redis-benchmark -t incr`, n6 `EVAL "return 1" 0` in a `01-` file. `--data-only` (1): i. `--hw-only` (1): y bad fixture. `--fp-only` (2): fp-a altered `l06_main`, fp-b altered `pg_schemas` → `--compare` rc 1. Total 33; missing targets print SKIP. Verify (no runs yet, so g, h, r, t1 skip): `bash $P/verify/negative-tests.sh --labs-only | tail -1` → `13/13 ca đỏ đúng thiết kế · 4 SKIP · tổng 17 ca`.

**T2.7 rerun-gate.mjs, widget-smoke.mjs** — Steps: rerun gate adds `--predicates` (evaluates the row predicates on `verify/tmp/rep/*` timelines); widget-smoke adds W1 (types recorded `CLUSTER KEYSLOT` keys) and W3 (replays `t1` and compares counts with `03-rl-replay.*`). Verify: `node $P/verify/widget-smoke.mjs --help | head -1` → contains `widget-smoke`.

## Test matrix
| Test | Expected now | Command |
|---|---|---|
| selftest | `rc=0` | T2.3 |
| runs | 50 missing run + 1 missing derived | T2.4 |
| lint | `labs dir missing` | T2.3 |
| check.sh | `✘ C01`, rc = ✘ count | T2.5 |
| guards | `rc=2` twice | T2.2 |
| node syntax | no output | `for f in $P/verify/*.mjs; do node --check $f; done` |

## Risks and rollback
Stdin pacing for psql may misbehave; fallback is one `psql -c` per statement for `.sql` regions (format unchanged). Rollback: delete `verify/` and `check.sh`.

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

=== FILE: phase-03-containers-lab-files.md ===
---
phase: 3
title: "Containers and lab files"
status: pending
priority: P1
effort: 1.5h
dependencies: [2]
---

# Phase 03 — Containers and lab files

## Goal
Write every learner-facing lab file to the frozen contract, bring up main, seed it, and turn `--lint` and `check.sh` GREEN. No recorded run yet.

## Files to create/modify (owner: controller)
All under `D:/study/advance-be/labs/k2-lesson-04-caching/`: tool scripts (L06 line-2/`HERE=` rule) `00-containers.sh`, `99-cleanup.sh`, `rl-gate.sh`, `tools/fw-boundary.sh`; data `00-seed.redis`, `traffic/{make-t1.sh,t1.tsv,summary.awk}`, `pg/{hot,spread}.pgb`, `05-counter-pg.sql`, `99-cleanup.sql`; ten `lua/*.lua` (T3.3); region files (T3.4).

## Tasks
**T3.1 tool scripts**
- Goal: idempotent lifecycle that can only touch `advance-be-k2l04-*`.
- Steps: copy L06 `00-containers.sh`; spec table = plan.md "Container lifecycle"; guard `advance-be-k2l04-(redis|cluster|scratch)`; only publish `-p 127.0.0.1:6381:6379` (`# guard-port`); `up cluster` assigns slots; `down` never removes main. `99-cleanup.sh` from L06 (keeps `k2l04:my:*`, `k2l04:hw:*`). `rl-gate.sh <calls> <open|closed>` (env `PORT`, default 6379): each call runs `token-bucket.lua k2l04:rl:gate:store:7 , '*' 10 0.01 1` via `redis-cli -p $PORT --eval`; reply → `200` or `429 Retry-After: <ceil(ms/1000)>`; connection error → `200 fail-open (ghi log)` or `503`; last line `200=a 429=b 503=c`. `tools/fw-boundary.sh`: `SET NX EX 10` + `INCR` per hit; 1 hit, wait for `PTTL` < 300, 4 hits, `sleep 0.4`, 5 hits; prints `allowed= span_ms=`.
- Success: main up and correct.
- Verify: `bash labs/k2-lesson-04-caching/00-containers.sh up main | grep -cE '^✔ C0[45] '` → `2`; `docker port advance-be-k2l04-redis` → exactly `6379/tcp -> 127.0.0.1:6381`.

**T3.2 seed and traffic**
- Steps: `00-seed.redis` UNLINKs then sets `k2l04:seed:version 1`, `k2l04:bc:seq 6`, `HSET k2l04:bc:read userA 4 userB 6`, `ZADD k2l04:bc:list 1 n1 … 6 n6`. `make-t1.sh` prints the header and the three segments with `seq | awk` (client `u1`); saved once as `t1.tsv`. `summary.awk -v algo=` echoes `t allowed [extra]` lines and ends with `<algo> allowed= denied= s1= s2= s3= burst10s=` (max allowed in any `[t, t+10000)`; leaky adds `max_delay_ms=`).
- Verify: `wc -l < labs/k2-lesson-04-caching/traffic/t1.tsv` → `49`; `bash labs/k2-lesson-04-caching/traffic/make-t1.sh | diff - labs/k2-lesson-04-caching/traffic/t1.tsv && echo SAME` → `SAME`.

**T3.3 Lua scripts** (keys only via `KEYS`; `ARGV[1]` = `now_ms` or `*` → `TIME`; integers in replies; `elapsed = math.max(0, now − ts)`)
- `points-add`: `min(cap, v+delta)`. `rl-fixed`: INCR window key (`:<floor(t/W)>`), PEXPIRE on n = 1, allow n ≤ L. `rl-log`: `ZREMRANGEBYSCORE key -inf <now−W>` (inclusive, window (now−W, now]; R12/R14 depend on it), ZCARD, ZADD only when accepted. `rl-counter`: `s = prev·(W−e) + cur·W`, allow iff `s < L·W` (integers), INCR cur, PEXPIRE 2W, return `%.2f` of s/W. `rl-leaky` (meter): accept iff `level + 1 ≤ cap`, `delay_ms = round(level·1000/rate)`. `token-bucket` (ARGV now, cap, rate/s, take): new = full; `granted = min(take, floor(tokens))`; `retry_after_ms = ceil((1−tokens)/rate·1000)`; PEXPIRE `ceil(cap/rate·1000)`; returns `{granted, floor(tokens), retry}`. `token-interval`: refill to cap when `floor(now/I)` changes. `mark-read`: HSET only if id > current. `delay-claim`: BYSCORE LIMIT 0 1, ZREM, RPUSH. `bloom` (`add|check`, m, k, items): position i = `tonumber(sha1hex(item):sub(8i+1, 8i+8), 16) % m`.
- Verify: `for f in labs/k2-lesson-04-caching/lua/*.lua; do docker exec advance-be-k2l04-redis sh -c "redis-cli SCRIPT LOAD \"\$(cat /lab/lua/$(basename $f))\""; done | grep -cE '^[0-9a-f]{40}$'` → `10`.

**T3.4 stage region files** (region ids as listed; every `.sh` region starts `set -u`; destructive regions start `echo "→ advance-be-k2l04-scratch"`; every stage's primary file ends with region `kiem-chung` of plain read commands)
| File | Regions | Notes |
|---|---|---|
| `01-fundamentals.redis` | server, limits, kiem-chung | INFO server; CONFIG GET of the three R03 limits |
| `01-bench.sh` | setget | `redis-benchmark -q -c 50 -n 100000 SET k2l04:bench:k v` / `GET k2l04:bench:k`, 3 reps each, one region |
| `01-cluster.redis`, `01-cluster.sh` | keyslot (`#@ ct advance-be-k2l04-cluster`), crossslot | crossslot names cluster and main explicitly |
| `02-race.A.sh`, `.B.sh` | ab, ab-reset | lost update on `k2l04:race:pts`; then A `(printf 'WATCH …\nGET …\n'; sleep 1.5; printf 'MULTI\nSET … 101\nEXEC\n') \| docker exec -i advance-be-k2l04-redis redis-cli --no-raw`, B `SET k2l04:race:pts2 999` at +0.5 s |
| `02-lua.sh` | capped, kiem-chung | 3 × `--eval /lab/lua/points-add.lua k2l04:race:pts3 , 30 80` |
| `03-rl-fixed.redis` | bug, fix, kiem-chung | INCR without EXPIRE vs `SET NX EX` + INCR |
| `03-rl-live.sh` | boundary, log-time | `tools/fw-boundary.sh`; 7 × `rl-log.lua … , '*' 5 10000 r$i` |
| `03-rl-replay.sh` | fixed, log, counter, compare | in-container `while read` over `/lab/traffic/t1.tsv` → `awk -f traffic/summary.awk`; compare pastes log and counter decisions |
| `03-rl-memory.sh` | log | ZADD 100 / 1000 members via `seq \| awk \| redis-cli`, encoding, MEMORY USAGE |
| `04-leaky.A.sh`, `.B.sh` | queue, queue-reset | A offers o1–o8 (`RPUSH` if LLEN < 5, else `DROP`); B worker 5 × (`BLPOP … 5`, `sleep 2`) |
| `04-token.sh` | replay-leaky, replay-token, replay-interval, memory, batch-bench, overadmit, oom (opt, scratch) | batch: `redis-benchmark -q -c 1 -n 20000 EVALSHA <sha> 1 k2l04:rl:batch:bench '*' 100000000 100000000 <1\|10>` × 3; overadmit (cap 10, rate 1/s): per-request = 20 calls at 20000+10i → 10; batch = A pre-takes 10 at t=0 and spends 1, B pre-takes 10 at 20000 → A's 9 + B's 10 = 19 |
| `04-token-race.A.sh`, `.B.sh` | ab, ab-reset | naive GET/SET of 1 token, then at +1.5 s `token-bucket.lua … , '*' 1 0.001 1` (B +0.2 s) |
| `04-rl-gate.sh` | contract | `rl-gate.sh 30 open`; `PORT=6390 rl-gate.sh 3 open`; `PORT=6390 rl-gate.sh 3 closed` |
| `05-counter-pg.sql` | setup, slide20, reset, locks, kiem-chung | `post_count` (post_id 1–1001, 4 bigint counters); `locks` = DBX `pg_stat_activity` snapshot |
| `pg/hot.pgb`, `pg/spread.pgb` | – | `UPDATE k2l04_counter.post_count SET like_count = like_count + 1 WHERE post_id = 1;` / `\set pid random(2, 1001)` and `post_id = :pid` |
| `05-counter-pg.A.sh`, `.B.sh` | load, load-reset (A) | A: three `pgbench -n -c 8 -j 4 -T 5 -U postgres -f /dev/stdin advance_be_lab` (feed per S4), `PGAPPNAME` `k2l04-hot`/`-spread`/`-async` (last with `PGOPTIONS='-c synchronous_commit=off'`), then stats; B: 16 × (`sleep 1`, `psql -Atc` grouped `application_name\|wait_event_type\|wait_event\|count`), then `lock_hot= lock_spread= lock_async=` |
| `05-counter-redis.sh` | incr | per rep: UNLINK, `redis-benchmark -q -c 8 -n 100000 INCR k2l04:cnt:post:1`, GET; same with `HINCRBY k2l04:cnt:post:1:h likes 1` |
| `05-writebehind.sh` | flush, loss (scratch) | `RENAME k2l04:wb:likes k2l04:wb:flushing`, one `UPDATE … FROM (VALUES …)` for posts 2–11 |
| `05-memory.sh` | layouts (scratch) | 10,000 posts × 4 counters as Strings / Hash / 100 bucket Hashes (opt); `layout=<x> bytes_per_post=n` |
| `06-unread.sh` | fanout, pointer, mark, kiem-chung | `seq 1 10000 \| awk … HINCRBY k2l04:unread:fan u$1 1 \| redis-cli --pipe` |
| `07-share.A.sh`, `.B.sh` | ab, ab-reset (A) | A polls `k2l04:pool:m1` every 0.1 s (`polls=n`), then `BLPOP k2l04:reply:m2 10`; B sets m1 `EX 30` at +1.5 s, `RPUSH` m2 at +3 s |
| `08-delay.A.sh`, `.B.sh` | ab, ab-reset (A) | naive (`o1` due, `o2`/`o3` at 4102444800), then `delay-claim.lua … , '*'` at +1.5 s |
| `08-hll.sh` | accuracy, encoding, merge, kiem-chung | `ip1…ipN` via `--pipe`; `N= count= err_pct=` |
| `09-bitmap.sh` | segments, kiem-chung | fiction = even ids, adventure = multiples of 3, ids ≤ 10000 |
| `09-bloom.sh` | fp, ksweep (opt), kiem-chung | in-container `seq … \| sed s/^/user/ \| xargs -n 500 redis-cli --eval /lab/lua/bloom.lua k2l04:bf:users , add 50000 3`; probes `nouser1…10000` |
- Verify: `node $P/verify/verify-guide.mjs --lint; echo rc=$?` → `✔ không có lỗi` then `rc=0`.

**T3.5 seed and check**
- Steps: `grep -v '^#' labs/k2-lesson-04-caching/00-seed.redis | docker exec -i advance-be-k2l04-redis redis-cli`.
- Verify: `bash labs/k2-lesson-04-caching/check.sh; echo rc=$?` → no `✘` line and `rc=0`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| lint (V17) | GREEN | T3.4 Verify |
| planted lab faults | `13/13 … 4 SKIP · tổng 17 ca` | `bash $P/verify/negative-tests.sh --labs-only \| tail -1` |
| main binding | `6379/tcp -> 127.0.0.1:6381` | T3.1 Verify |
| Lua syntax | `10` | T3.3 Verify |
| check | `rc=0` | T3.5 Verify |
| L06 untouched | `rc=0` | `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` |

## Risks and rollback
A container that already uses a K2L04 name with a different spec stops the script (L06 `--recreate` rule). Rollback: `bash labs/k2-lesson-04-caching/99-cleanup.sh --all`, then delete `labs/k2-lesson-04-caching/` except `check.sh`.

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

=== FILE: phase-04-recorded-runs.md ===
---
phase: 4
title: "Recorded runs"
status: pending
priority: P1
effort: 2.5h
dependencies: [3]
---

# Phase 04 — Recorded runs

## Goal
Record every matrix run serially through the runner until `--runs` is GREEN or every miss is a logged deviation.

## Files to create/modify (owner: controller; strictly serial)
`$P/verify/record-all.sh` (from L06), `$P/runs/*.txt`, `$P/runs/manifest.tsv`, `$P/verify/deviations.md`, `$P/verify/tmp/rep/*`.

## Tasks
**T4.1 record-all.sh** — Steps: `setup` (up main, seed, check → `check.after-seed`, seed, check → `check.rerun`, register phase-01 files), then `s1`…`s9` in order (up cluster before s1, `05-counter-pg.sql#setup` and `#reset` before the load pair, up scratch before `05-writebehind#loss`), six pairs with `--ab … --rep 3`, then `gates`. Never export `MSYS_NO_PATHCONV`. Verify: `bash -n $P/verify/record-all.sh && echo OK` → `OK`.

**T4.2 run and reconcile** — Steps: `bash $P/verify/record-all.sh`. Failing row: a typo-level lab bug (wrong key, wrong region id) → fix and re-run the region; real Redis/PG behaviour → keep the run, `status=deviation`, `deviations.md` row (expected, measured, new narrative/chip); anything else → Failure Protocol. A timed region with clock ratio outside 0.8–1.3, Δredis ≤ 0, or a benchmark rep ≤ 0 or ≥ 5,000,000 is re-run, at most twice. Runs are never edited.
- Verify: `node $P/verify/verify-guide.mjs --runs; echo rc=$?` → `✔ không có lỗi`, `rc=0`.

**T4.3 gates** — Verify each:
- `node $P/verify/rerun-gate.mjs --predicates; echo rc=$?` → `rc=0` (every single-client region gives identical semantic lines twice; reps 2–3 of each pair satisfy the same row predicates).
- `diff <(tail -n +2 $P/runs/check.after-seed.txt) <(tail -n +2 $P/runs/check.rerun.txt) && echo SAME` → `SAME`.
- `bash $P/verify/negative-tests.sh --labs-only | tail -1` → `17/17 ca đỏ đúng thiết kế · 0 SKIP · tổng 17 ca`.
- `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| matrix + M01 + D01 + V18 + V24 + V25 | GREEN | T4.2 |
| relations hold in reps 2–3 | 0 differing | T4.3 |
| seed idempotent | `SAME` | T4.3 |
| L06/foreign/PG schemas unchanged | `rc=0` | T4.3 |

## Risks and rollback
pgbench and sampler share one A/B pair, so each rep is ≈ 16 s of bounded load (`-c 8 -T 5` × 3). Interrupted run: `00-containers.sh reset main`, re-seed, re-run that stage. Rollback: delete `runs/` (except the two phase-01 files) and re-record.

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

=== FILE: phase-05-widget-data-homework-drill.md ===
---
phase: 5
title: "Widget data, homework, driver drill"
status: pending
priority: P1
effort: 0.75h
dependencies: [4]
---

# Phase 05 — Widget data, homework, drill

## Goal
Produce every data file the fragments read, a self-checked homework with a failing bad fixture, and a sourced claim list for the optional drill.

## Files to create/modify (owner: controller)
`$P/verify/make-widget-data.mjs`, `$P/runs/data/w1–w9.json`, `$P/runs/data/derived.json`, `$P/verify/hw-bad-fixture.lua`, `$P/runs/driver-claims.txt`; labs: `hw/token-bucket.scaffold.lua`, `hw/solution.lua`, `hw-check.sh`, `driver-drill.ai-snippet.ts`.

## Tasks
**T5.1 data** — Steps: w1 R04 pairs; w2 R06/R07 events; w3 R11–R13 decisions; w4 R13 estimates + R12 decisions; w5 R18–R20 + R24; w6 R27–R31; w7 R35–R37; w8 R42–R44; w9 R46. `derived.json` `{name, value, formula, inputs, sources}`: medians `t-set`, `t-get`, `t-batch1`, `t-batch10`, `t-incr`, `t-hincr`, plus `batch-ratio`, `redis-vs-pg-hot`, `retry-after-s`. Verify: `node $P/verify/verify-guide.mjs --data; echo rc=$?` → `rc=0`; `--runs` row X01 passes (`rc=0`).

**T5.2 homework (slide 32, FR-M2-05 shape)** — Steps: scaffold with 5 blanks (`__1__` clamp, `__2__` cap, `__3__` granted, `__4__` retry, `__5__` PEXPIRE), the rest pre-filled with Vietnamese comments. `hw-check.sh [host path]` (default `labs/k2-lesson-04-caching/lua/my-hw-token-bucket.lua`) loads the file with `docker exec -i advance-be-k2l04-redis redis-cli -x SCRIPT LOAD < "$FILE"`, resets `k2l04:hw:*`, calls `EVALSHA` with `now_ms` ARGV and prints: H1 30 calls (10 ms apart, cap 10, 0.01/s) → exactly 10 granted / 20 denied; H2 every denial `retry_after_ms` > 0; H3 after a 10,000,000 ms idle, 11 calls → exactly 10; H4 a call with `now` 5000 ms before the last keeps field `tokens` ≥ 0; H5 `PTTL` > 0; H6 store 43 still granted. Bad fixture: no cap, no clamp, no PEXPIRE.
- Verify: `node $P/verify/run-k2l04.mjs labs/k2-lesson-04-caching/hw-check.sh --out hw-check.solution -- labs/k2-lesson-04-caching/hw/solution.lua && grep -c '^✔ H' $P/runs/hw-check.solution.txt` → `6`; `node $P/verify/run-k2l04.mjs labs/k2-lesson-04-caching/hw-check.sh --out hw-check.bad -- $P/verify/hw-bad-fixture.lua && grep -cE '^✘ H[345] ' $P/runs/hw-check.bad.txt` → `3`, and `grep -cE '^✔ H[126] ' $P/runs/hw-check.bad.txt` → `3`; `bash $P/verify/negative-tests.sh --hw-only | tail -1` → `1/1 ca đỏ đúng thiết kế · 0 SKIP · tổng 1 ca`.

**T5.3 drill (optional section)** — Steps: `driver-drill.ai-snippet.ts` = NestJS 10 `RateLimitGuard` (~70 lines, node-redis 6.3.0 like L06) with six seeded mistakes (INCR then EXPIRE in two calls; in-memory `Map` counter; fixed window for login; no `Retry-After`; `KEYS rl:*`; Redis error thrown as 500 instead of a chosen fail-open/closed) and one correct decoy (`EVALSHA` with keys/arguments). `driver-claims.txt`: one line per API claim with unpkg/redis.io URL, version, quoted line; Redis behaviour claims cite run ids. Verify: `grep -c '^https://' $P/runs/driver-claims.txt` → ≥ `4`, and `node $P/verify/run-k2l04.mjs --register $P/runs/driver-claims.txt` prints `manifest: driver-claims.txt`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| data traced | `rc=0` | T5.1 |
| fake number in w3 (case i) | RED | `bash $P/verify/negative-tests.sh --data-only \| tail -1` → `1/1 …` |
| homework | 6 ✔ / ✘ H3–H5 | T5.2 |

## Risks and rollback
Loading by `SCRIPT LOAD` from a host path lets the same checker grade the learner file and the plan-folder fixture. Rollback: delete the new files.

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
title: "Guide shell and assembler"
status: pending
priority: P1
effort: 1h
dependencies: [2]
---

# Phase 06 — Shell and assembler (may run in parallel with 03–05; disjoint files)

## Goal
A shell that builds with stub stages and already passes the page-level checks.

## Files to create/modify (owner: controller or delegate D0)
`$P/assembly/shell-head.html`, `shell-css.part`, `shell-tail.html`, `assemble.mjs`, copied from `plans/261031-1651-lesson-06-redis-teacher-guide/assembly/`.

## Tasks
**T6.1 copy and retarget** — Steps: labs `labs/k2-lesson-04-caching`, output the K2 guide path, `STAGES = 9`, `WIDGETS = 9`, `displayText` from `$P/verify/lab-text.mjs`; slide images `../../Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/assets/04_Caching/page_NN_img_MM.<ext>` (relative, never base64); storage keys `k2l04-*`; one `esc()` in `shell-tail.html`; CSS adds `dl.gloss`. Verify: `node $P/assembly/assemble.mjs --allow-stubs; echo rc=$?` → `rc=0`.

**T6.2 shell sections** — Steps: hero; `#cach-hoc` (time table and optional order, up main + seed + check, DBX `ADVANCE_BE_K2L04_REDIS` 127.0.0.1:6381 db 0, prompt callout, Git Bash note, barrier order, "đã gặp ở L06" table: token bucket 9, delay 6, slots 7, race 2/5; never type `advance-be-redis`); `#bai-tap` (H1–H6, scaffold, `hw-check.sh`, I/O-models reading, answer fold); `#driver-drill`; `#phong-van` (10); `#cheat-sheet` (commands, complexity, algorithm comparison from runs); `#ban-do-slide`; `#tham-khao`; `#tiep-theo` (FR-M2-05: token bucket per `storeId` and why not the log (R15 vs R23), batch trade-off, `Retry-After`, fail-open/closed = Đạt's ADR-010 call, NFR-10 env limits, hub 6380 text only; Boss Challenge 2.3; then Cluster 3). `SLIDES` = 39 entries from contract §6. Verify: `node $P/verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15,V22; echo rc=$?` → `rc=0`; `grep -cE 'l06-|6_Redis' "reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html"` → `0`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| stub build | `rc=0` | T6.1 |
| page checks | `rc=0` | T6.2 |
| guide negatives on stub | no `✘` line (targets missing on a stub print SKIP) | `bash $P/verify/negative-tests.sh --guide-only \| grep -c '^✘'` → `0` |
| widget-smoke on stub | 0 exceptions | `node $P/verify/widget-smoke.mjs --guide "<guide path>"` |

## Risks and rollback
Stale L06 strings are caught by V09 and the grep. Rollback: delete `assembly/` shell files.

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
title: "Stage fragments, quizzes and widgets (3 delegates)"
status: pending
priority: P1
effort: 2h
dependencies: [5, 6]
---

# Phase 07 — Stage fragments

## Goal
Nine verified fragments, quizzes and widgets written in parallel against contract v1.

## Files to create/modify (disjoint ownership)
`$P/assembly/`: D1 `fragments/stage-01..03.html|.quiz.json`, `widgets/w1–w4.js`; D2 `stage-04..06`, `w5–w7.js`; D3 `stage-07..09`, `w8–w9.js`. Delegates read contract, plan matrix, runs, labs, `runs/data`; they never edit labs, runs, shell or contract (changes go to the controller, who bumps the contract version).

## Tasks
**T7.1 fragment format** (L06 frozen format + `dl.gloss`): `p.goal`, `dl.wwh`, `dl.gloss` → `.story` → figure/SVG → `table.stats` (`b.m[data-run|data-derived]`) → `.check30` → "Làm mẫu" → `kiem-chung` + `table.expect` → `callout challenge` → `.quiz[data-quiz=N]`. One `.sayvs` + chip per slide, `id="sl-NN"` on PART/FIX, "chưa đo trực tiếp" on design claims; two-client steps use `table.walk` then the host-ms timeline.

**T7.2 challenges (PASS)** — 1 hashtags for user 34 `cart`/`cart-lock`: same KEYSLOT. 2 `lua/my-stock-decr.lua` on stock 2: 1, 0, -1. 3 predict fixed/log counts on `t1` for L = 3 per 5 s: prediction = run. 4 `rl-gate.sh 30 open`: `200=10 429=20`. 5 hot pgbench `-c 2` vs `-c 8`: Lock samples grow. 6 out-of-order mark for userB: unread 0, pointer 6. 7 `BLPOP` 2 s, no replier: `(nil)`. 8 3-day PFMERGE: error ≤ 2.43 %. 9 Bloom m = 100000, k = 5: fp within ±3σ of the computed p.

**T7.3 widgets** (data from `runs/data/wN.json`, see phase 05): W1 CRC16 slots (`#w1-key`, `#w1-slot`); W2 race replay; W3 window simulator over `t1`; W4 counter estimate vs log; W5 bucket/leaky replay + batch slider; W6 throughput/lock bars; W7 fan-out vs pointer ("ước lượng" beyond N = 10,000); W8 HLL band; W9 Bloom formula vs recorded fp. DOM writes via `textContent`/`esc()`, controls ≥ 44 px, ids `wN-*`.

- Verify (controller, per delegate DONE): `for n in 1 2 3 4 5 6 7 8 9; do node $P/verify/verify-guide.mjs --fragment $P/assembly/fragments/stage-0$n.html || echo FAIL$n; done` → no `FAIL`; `for n in 1 2 3 4 5 6 7 8 9; do node --check $P/assembly/widgets/w$n.js || echo FAIL$n; done` → no `FAIL`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment (V05–V07, V09, V12, V19, V11 quiz) | exit 0 × 9 | T7.3 Verify |
| widget syntax | exit 0 × 9 | T7.3 Verify |
| W1/W3 vs runs | ✔ | `node $P/assembly/assemble.mjs --allow-stubs && node $P/verify/widget-smoke.mjs --guide "<guide path>"` |

## Risks and rollback
Invented numbers fail V07; reworded code fails V05 and is overwritten by the assembler. Rollback: delete that delegate's files.

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

# Phase 08 — Assemble, verify, render

## Goal
One built guide that passes every check, with negative tests proving the checks bite.

## Files to create/modify (owner: controller)
The guide (generated), `$P/verify/render/`, `$P/verify/render-dark/`, `$P/runs/verify-full.txt`.

## Tasks
**T8.1 build and verify** — Steps: `node $P/assembly/assemble.mjs`; then the four verifier modes, output appended to `runs/verify-full.txt`. Verify: `node $P/verify/verify-guide.mjs && node $P/verify/verify-guide.mjs --runs && node $P/verify/verify-guide.mjs --data && node $P/verify/verify-guide.mjs --lint; echo rc=$?` → four `✔ không có lỗi` lines and `rc=0`.

**T8.2 negatives and widgets** — Verify: `bash $P/verify/negative-tests.sh | tail -1` → `33/33 ca đỏ đúng thiết kế · 0 SKIP · tổng 33 ca`; `node $P/verify/widget-smoke.mjs --guide "reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html"; echo rc=$?` → `rc=0`.

**T8.3 render** — Steps: `TMP=$P/verify/tmp TEMP=$P/verify/tmp node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "<guide>" --out $P/verify/render`; dark on a `data-theme="dark"` copy beside the guide (`--out $P/verify/render-dark`, copy deleted). Fix fragments/shell only, never runs. Verify: the render-check summary of both runs reports 0 runtime errors, 0 overflow at 375/768/1440, 0 targets < 44 px; size `stat -c %s "<guide>"` ≤ `532480`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| full verifier | 4 × GREEN | T8.1 |
| negatives | 33/33, 0 SKIP | T8.2 |
| widgets | `rc=0` | T8.2 |
| render light/dark | 0 / 0 / 0 | T8.3 |

## Risks and rollback
Wide terminal output overflows at 375 px: `pre` scrolls inside its box, tables sit in `.tablewrap`. Rollback: regenerate from fragments.

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
title: "Ultra code review and fixes"
status: pending
priority: P1
effort: 1h
dependencies: [8]
---

# Phase 09 — `/ak:code-review --pending --ultra --advice`

## Goal
Independent review of guide, labs and tooling; every verified Critical/Important finding fixed and re-checked.

## Files to create/modify
`$P/reports/code-review-ultra-reviewer-1..5.md`, `code-review-ultra-verdict.md`, `code-review-ultra-fix-status.md`; fixes in phase 03–08 files (controller only).

## Tasks
**T9.1 review** — Steps: `/ak:code-review --pending --ultra --advice` over the guide, labs, `$P/verify`, `$P/assembly`, runs (read-only), `expected.tsv`, `deviations.md`. Reviewer briefs: per-slide correctness and chips; safety (K2L04 containers only, 6381 loopback, no 6380, schema-only PG writes, pgbench bounds, no L06 command); trace integrity; teaching format and Vietnamese; mobile/a11y. The verifier unions validated findings. Verify: `ls $P/reports/code-review-ultra-*.md | wc -l` → `7`.

**T9.2 fix** — Steps: fix each Critical/Important; a changed lab region is re-run through the runner (its manifest line is replaced), never hand-edited; re-run phase 08 T8.1–T8.3 when a lab, fragment or shell changed. A finding that contradicts a recorded measurement without new evidence is rejected with the run id as source. Run `/ak:test` only if a finding shows a gap in the TDD coverage. Verify: `grep -c 'OPEN' $P/reports/code-review-ultra-fix-status.md` → `0`; phase 08 Verify commands give the same pass results.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| open findings | `0` | T9.2 |
| regression | phase 08 GREEN | phase 08 commands |
| lab state | `rc=0` | `bash labs/k2-lesson-04-caching/check.sh; echo rc=$?` |

## Risks and rollback
Per fix: re-run the region and reassemble.

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

# Phase 10 — Docs, final gate, handoff

## Goal
Make the guide discoverable, prove nothing outside scope changed, and leave the lab ready for study.

## Files to create/modify (owner: controller; read each file first)
- `D:/study/advance-be/README.md`: line 14 labs list + `` `labs/k2-lesson-04-caching/` (redis-cli + DBX) ``; tree entries for the guide and the labs folder.
- `D:/study/advance-be/reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md` line 419 (K2 Bài 04 artifacts cell, original: "Slide 39 trang kèm so sánh ưu nhược điểm 5 thuật toán Rate Limiting."): append the labs path and guide path.
- Only if `Rồi sang K2 Bài 04 Rate Limiting` occurs exactly once in both `reports/advanced_backend/lesson_06_redis_teacher_guide.html` and `plans/261031-1651-lesson-06-redis-teacher-guide/assembly/shell-tail.html`: wrap `K2 Bài 04 Rate Limiting` in `<a href="../Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html">…</a>` in both; otherwise skip both.
- `D:/study/advance-be/plans/handoffs/k2-lesson-04-caching-guide-ready-<YYYYMMDD>.md`; `$P/runs/00-fingerprint-after.txt`, `$P/runs/final-gate.txt`.

## Tasks
**T10.1 docs** — Verify: `grep -c 'k2-lesson-04-caching' README.md` → `≥ 2`; `grep -c 'k2_lesson_04_caching_teacher_guide' reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md` → `1`; if the L06 edit was made, `node plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs --only V01,V02,V03,V10; echo rc=$?` → `rc=0`.

**T10.2 lab ready** — Steps: `00-containers.sh down cluster`, `down scratch`, `reset main`, re-seed; DB counters reset with `05-counter-pg.sql#reset`; `99-cleanup.sh` is not run. Verify: `bash labs/k2-lesson-04-caching/check.sh; echo rc=$?` → no `✘`, `rc=0`; `docker ps --filter name=advance-be-k2l04 --format '{{.Names}} {{.Ports}}'` → exactly `advance-be-k2l04-redis 127.0.0.1:6381->6379/tcp`.

**T10.3 final gate** — Steps: write `00-fingerprint-after.txt`; `final-gate.txt` gets one ✔/✘ row each for the 4 verifier modes, negatives, widget-smoke, render, check.sh, fingerprint, L06 regression, `git status --short`. Verify: `bash $P/verify/fingerprint.sh --compare $P/runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`; `grep -c '^✘' $P/runs/final-gate.txt` → `0`; `git status --short` lists only the guide, `labs/k2-lesson-04-caching/`, `$P`, README, the master curriculum, the two optional L06 files and the handoff.

**T10.4 handoff** — Steps: what exists, how to start, stage times and optional order, deviations, run date, next steps (FR-M2-05, Boss Challenge 2.3, Cluster 3). No commit, branch or push. Verify: `test -s plans/handoffs/k2-lesson-04-caching-guide-ready-*.md && echo OK` → `OK`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fingerprint | `rc=0` | T10.3 |
| learner state | `rc=0` | T10.2 |
| L06 guide intact | `rc=0` | T10.1 |
| scope of changes | allowed paths only | `git status --short` |

## Risks and rollback
Doc edits are one-liners; revert by restoring the quoted original line. No git operation other than `git status`.

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
