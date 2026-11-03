=== FILE: plan.md ===
---
title: "K2 Bài 04 Caching teacher guide (rate limit, counters, practices; measured on Redis 7.2.3 + PG 16.15)"
description: "Vietnamese single-file teacher guide for K2 Bài 04 (39 slides, 8 stages) backed by redis-cli/psql labs recorded on K2L04-owned containers, built test-first on the Lesson 06 toolchain."
status: pending
priority: P1
effort: 13.5h
branch: main
tags: [k2-lesson-04, caching, rate-limiting, redis, postgres, lua, teacher-guide, tdd, advice]
blockedBy: []
blocks: []
created: 2026-11-02
---

# K2 Bài 04 — Caching (Rate Limit, Counter, Practices) teacher guide

Paths used everywhere: `$ROOT` = `D:/study/advance-be`; `$P` = `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide`; `$L` = `D:/study/advance-be/labs/k2-lesson-04-caching`; `$G` = `D:/study/advance-be/reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html`; `$L06P` = `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide`. Every Verify command runs in Git Bash after `cd "$P"` unless it says otherwise.

## Overview

Build `$G` on the Lesson 06 single-column shell (no rail) so Đạt can study K2 Bài 04 on or after 2026-11-04 in a 300-minute core day. Every experiment is a small `.redis`, `.sh` or `.sql` snippet in `$L` that he pastes into `redis-cli`, Git Bash or DBX; the controller records the same regions through the L06 runner (copied and adapted) into `$P/runs/` with a sha256 manifest. Slide 33 (race, `WATCH`, Lua) moves to stage 2 so no script appears before Lua is taught, and all five rate-limit variants run the same frozen `traffic.tsv` with client-supplied time, so the comparison table is deterministic and its numbers are frozen in `expected.tsv` before any run. Redis work happens only on `advance-be-k2l04-*` containers (main on `127.0.0.1:6381`), Postgres writes only in schema `k2l04_counter`, and a fingerprint plus lint prove that L06's `advance-be-redis`, its network and volume, port 6380 and every foreign container stay untouched. No git step other than `git status`.

## Data flow

1. `assembly/contract.md` freezes names, formats, run ids, Lua return shapes, `traffic.tsv` and the slide→chip table (phase 01).
2. `verify/expected.tsv`, `verify/oracle.mjs`, `check.sh`, `hw-check.sh`, the verifier and negative tests exist and are RED for the right reason (phase 02).
3. Lab regions in `$L` → `verify/run-redis.mjs` (host-ms clock, clock-sanity line, Redis barrier for A/B, Lua sha256 header, `.sql` via `docker exec -i quan-ly-hop-dong-postgres-1 psql`) → `runs/*.txt` + `runs/manifest.tsv` (one line per run path, replaced on rewrite) (phases 03–04).
4. `verify/oracle.mjs --compare` checks every replay run decision by decision; `--runs` checks every matrix row.
5. `verify/make-widget-data.mjs` reads runs only → `runs/data/w1..w6.json` + `derived.json` with `sources` (phase 05).
6. Delegates write fragments and widgets against the frozen contract → `assembly/assemble.mjs` → `$G` (phases 06–08).
7. Verifier, negative tests, widget-smoke, render-check, ultra code review, docs, handoff (phases 08–10).

## Stage map (study day ≥ 2026-11-04, minutes)

| Stage | Slides | Topic | Core | Optional ("nếu còn sức") | Runs | Widget |
|---|---|---|---|---|---|---|
| `#cach-hoc` | 1, 2 | containers up, seed, `check.sh`, DBX `ADVANCE_BE_K2L04_REDIS`, two terminals, Git Bash rules, base glossary | 15 | – | R00a/b | – |
| 1 | 3–11 | use cases, cons (one-thread CPU), slide-7 numbers by `redis-benchmark` custom commands, `maxclients`, cluster node: `CLUSTER KEYSLOT`, hashtag, `CROSSSLOT`, slot spread; slide 10 as a map of later stages; slide 11 back-links to K1 L02/L06 | 30 | 10 (O4 key population) | R01–R08 | W6 slot calculator |
| 2 | 33 | tools: GET-then-SET lost update, `WATCH`/`MULTI`/`EXEC` abort, first Lua (`EVAL`, `--eval`, `EVALSHA`) | 30 | – | R10–R12 | – |
| 3 | 12–14 | fixed window (non-atomic `INCR`+`EXPIRE` bug, `SET NX EX` fix, live boundary burst), sliding log, sliding counter, shared replay | 40 | 5 (O3 live log demo) | R20–R27 | W2 counter estimator |
| 4 | 15, 16 | leaky bucket (live queue + meter replay), token bucket continuous vs interval, race naive vs Lua, batch tokens RTT and over-admission, 429 + `Retry-After`, fail-open/closed, comparison table | 45 | – | R30–R38 | W1 replay lanes, W3 bucket + batch |
| 5 | 17–22 | PG hot row vs spread (pgbench), lock waits, Redis `INCR`/`HINCRBY` same concurrency, exact N, write-behind `GETDEL` flush + crash loss, memory layouts | 45 | 10 (O2 `synchronous_commit=off`, dead tuples) | R40–R49 | – |
| 6 | 23–25 | unread broadcast: fan-out at 10k/100k vs pointer per user, mark-as-read atomic max, honest extrapolation to 10M | 25 | 5 (O5 `ZADD GT` layout) | R50–R54 | W5 cost model |
| 7 | 26–30 | message pool request/reply, polling vs `BLPOP`, Hazelcast as design | 20 | 10 (O6 `CLIENT TRACKING`) | R60–R62 | – |
| 8 | 34–37 | delay task naive vs Lua claim, HLL accuracy + sparse→dense, Bitmap segmentation, hand-built Bloom (SETBIT + Lua) | 40 | 5 (O1 `PFMERGE` week) | R70–R74 | W4 HLL/Bloom calculator |
| wrap | 31, 32, 38, 39 | recap, homework spec, interview, cheat sheet, references, "tiếp theo" | 10 | 15 (O7 NestJS guard drill) + homework 45 in the evening | R80–R81 | – |
| **Total** | 39 | | **300** | **60 + 45 homework** | | |

Priority order for optional items: O2 → O4 → O1 → O3 → O5 → O6 → O7. Rate limiting and counters are never optional. Each overlap with L06 has its own core run: token bucket (R31, R34), delay task (R70), cluster slots/hashtag/CROSSSLOT (R06, R07), client-side race (R10). Every stage opens with a glossary of its new commands and ends with a `kiem-chung` block of plain read commands next to a `table.expect`.

## Phases

| # | Phase | Effort | Depends on | Gate |
|---|---|---|---|---|
| 01 | [Contract, baseline, smoke](phase-01-contract-baseline-smoke.md) | 0.75h | – | contract v1; `runs/00-fingerprint-before.txt` (incl. L06 and PG schema lines); `runs/run-method-smoke.txt` S1–S11 |
| 02 | [Tests first](phase-02-tests-first.md) | 2.0h | 01 | `expected.tsv` frozen; oracle prints the frozen replay numbers; `--selftest` GREEN; `--runs` RED 63× "missing run"; `check.sh` rc=7; `hw-check.sh` rc=9; negative labs group 14/14 RED, 2 SKIP |
| 03 | [Containers, stages 1–4 labs and runs](phase-03-containers-stages-1-4-runs.md) | 2.25h | 02 | rows R00–R38, D04, D11, K01–K04 GREEN; oracle compare 6/6; lint GREEN; fingerprint rc 0 |
| 04 | [Stages 5–8 labs and runs (incl. Postgres)](phase-04-stages-5-8-postgres-runs.md) | 2.25h | 03 | full `--runs` GREEN (or kongming-approved deviations); schema gate; rerun gate; check rc 0; fingerprint rc 0 |
| 05 | [Widget data, homework, source claims](phase-05-widget-data-homework-claims.md) | 0.75h | 04 | `--data` GREEN; hw solution ✔ H1–H6, bad fixture ✘ H2/H3/H5; `runs/source-claims.txt` complete |
| 06 | [Guide shell and assembler](phase-06-guide-shell-assembler.md) | 1.0h | 02 (parallel with 03–05) | stub build; V01–V04, V09, V10, V14, V15, V22 GREEN |
| 07 | [Stage fragments (3 delegates)](phase-07-stage-fragments.md) | 2.0h | 05, 06 | `--fragment` GREEN ×8; `node --check` ×6 widgets; widget-smoke W1/W6 ✔ |
| 08 | [Assemble, verify, render](phase-08-assemble-verify-render.md) | 0.75h | 07 | full verifier GREEN; negatives 35/35 RED, 0 SKIP; render light/dark 0 errors; ≤ 520 KB |
| 09 | [Ultra code review and fixes](phase-09-ultra-code-review-fixes.md) | 1.25h | 08 | 0 open Critical/Important; phase-08 matrix re-run GREEN |
| 10 | [Docs, final gate, handoff](phase-10-docs-final-gate-handoff.md) | 0.5h | 09 | final gate all ✔; fingerprint rc 0; handoff written; `git status` ⊆ allow-list |

## Expected-result matrix (frozen in `verify/expected.tsv` in phase 02, before any experiment)

Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa` (platform in the note, e.g. "đo trên PG 16.15", "đọc mã nguồn 7.2.3", "chưa đo trực tiếp"). One run id per row; a chip row names exactly one slide; each chip slide has exactly one chip row. Shared replay parameters: limit/capacity 5, window 10 000 ms, refill/leak 1 per 2 000 ms, `traffic.tsv` = 38 requests in segments a (boundary), b (burst then trickle), c (smooth control), d (previous window front-loaded). The replay numbers below were computed by hand and are re-derived by `verify/oracle.mjs` before freezing.

| ID | Run id | Slide | Expected result | Chip |
|---|---|---|---|---|
| R00a | `check.after-seed` | – | every row ✔ or `–`, `✔ C01`, rc 0 | – |
| R00b | `check.rerun` | – | `same:check.after-seed` | – |
| D04 | – (design) | 4 | cache layers picture; back-link to L06 4-layer page; chưa đo trực tiếp | OK |
| R01 | `01-fundamentals.bench` | 7 | 3× `SET k2l04:bench:k v: <r> requests per second, p50=<p> msec`, 3× same for `GET`; every r in (0, 5 000 000), p > 0; medians in `derived.json`; note: phụ thuộc máy, 60K ≠ `maxclients` (R04), 2^32 chưa đo | PART |
| R02 | `01-fundamentals.latency` | 5 | 3× `-c 1` `GET k2l04:bench:k`, p50 in (0, 5) ms | OK |
| R03 | `01-fundamentals.cpu` | 6 | Δ(`used_cpu_user_main_thread`+`used_cpu_sys_main_thread`)×1000 / `host_ms` in [0.2, 1.15]; note: UNSUBSCRIBE O(subscribers) per `src/pubsub.c` 7.2.3, chưa đo trực tiếp | PART |
| R04 | `01-fundamentals.limits` | – | `maxclients` 10000, `maxmemory` 0, `arch_bits:64`, `redis_version:7.2.3`, `io_threads_active:0` | – |
| R05 | `01-fundamentals.population` (opt) | – | crash container `DBSIZE` 1000000 after `DEBUG POPULATE`; `used_memory` Δ > 0; bytes/key and 250M-key estimate in `derived.json` | – |
| R06 | `01-cluster.keyslot` | 9 | `cluster_slots_assigned:16384`; slot(`k2l04:user:{34}:cart`) = slot(`k2l04:user:{34}:lock`); slot(`k2l04:{a}{b}`) = slot(`k2l04:{a}`); all values = `oracle.mjs slots` | OK |
| R07 | `01-cluster.crossslot` | 8 | `SINTER k2l04:a k2l04:b` → `(error) CROSSSLOT Keys in request don't hash to the same slot`; `k2l04:{s}:a`/`k2l04:{s}:b` → result; note: failover chưa đo trực tiếp | PART |
| R08 | `01-cluster.spread` | – | `node1=<a> node2=<b> node3=<c>`, a+b+c = 10000, each in [3200, 3470], equal to oracle | – |
| D11 | – (design) | 11 | recap of K1 L02/L06 topics with links | OK |
| R10 | `02-race.lost-watch.timeline` | 33 | phase 1: A, B `GET` → `"10"`, both `SET … 9`, final `"9"`; phase 2: A `EXEC` → `1) OK`, B `EXEC` → `(nil)`, final `"8"`; note: Lua recommended, Redis 7 Functions exist | OK |
| R11 | `02-lua.intro` | – | `EVAL` INCR → `1`; `cap-incr.lua` cap 3 ×4 → `1 1`, `1 2`, `1 3`, `0 3`; `# lua cap-incr.lua sha256=` | – |
| R12 | `02-lua.evalsha` | – | `SCRIPT LOAD` → 40 hex; `EVALSHA` reply = `--eval` reply; `SCRIPT EXISTS` → `1` | – |
| R20 | `03-ratelimit.fw-bug` | – | `INCR` → 1, `TTL` → -1; after 5 more `INCR` → 6, `TTL` → -1 | – |
| R21 | `03-ratelimit.fw-fix` | – | `SET … 0 EX 60 NX` → `OK`, `INCR` → 1, TTL in [55, 60]; 2nd `SET … NX` → empty line, `INCR` → 2, TTL > 0 | – |
| R22 | `03-ratelimit.replay-fw` | 13 | `algo=fixed allowed=35 denied=3`; `seg=a allowed=10 denied=0` (10 in 800 ms at limit 5/10 s) | OK |
| R23 | `03-ratelimit.replay-log` | – | `algo=log allowed=30 denied=8`; `seg=a allowed=5 denied=5` | – |
| R24 | `03-ratelimit.replay-swc` | 14 | `algo=swc allowed=27 denied=11`; `seg=a allowed=6 denied=4`, `seg=d allowed=6 denied=4`; exactly 5 decisions differ from R23 | PART |
| R25 | `03-ratelimit.log-memory` | – | 100 entries `listpack`, 1000 entries `skiplist`; m100 < m1000; bytes/entry in `derived.json` | – |
| R26 | `03-ratelimit.fw-live` | – | replies 1–5 then 1–5 around one TTL expiry; `span_ms` < 1500 | – |
| R27 | `03-ratelimit.log-live` (opt) | – | same pattern via `rl-sliding-log.lua` with now `0` (TIME): `live_allowed=5 live_denied=5` | – |
| R30 | `04-buckets.replay-lb` | – | `algo=leaky allowed=33 denied=5`; max accepted `delay_ms` in [7900, 8000] | – |
| R31 | `04-buckets.replay-tb` | – | `algo=token allowed=33 denied=5`; `seg=b allowed=8 denied=0`; each denial retry in [1100, 1600] | – |
| R32 | `04-buckets.replay-tbi` | 16 | `algo=token-interval allowed=35 denied=3`; `seg=a allowed=10` (same burst as fixed window); `HLEN k2l04:rl:tb:a` → 2 (tokens + ts, not "just the number") | PART |
| R33 | `04-leaky.drain.timeline` | 15 | enqueue replies `1 2 3 4 5 0 0 0`; 5 `BLPOP` departures, gaps ≥ 400 ms; last departure − first enqueue ≥ 2000 ms | OK |
| R34 | `04-tb-race.naive-lua.timeline` | – | naive: A and B both `ALLOWED` from 1 token; Lua: one first field `1`, the other `0` with retry `2000` | – |
| R35 | `04-buckets.batch-rtt` | – | 6 `EVALSHA` lines at `-c 1` (3× cost 1, 3× cost 10), all r > 0; `# lua rl-token-bucket.lua sha256=`; derived served/s ratio ≥ 5 | – |
| R36 | `04-buckets.batch-overadmit` | – | `batch_admitted=10 single_admitted=5` | – |
| R37 | `04-buckets.http-429` | – | `200=5 429=5`; each 429 line ends `Retry-After: 2` | – |
| R38 | `04-buckets.fail-mode` | – | `Could not connect to Redis at 127.0.0.1:6390: Connection refused`; `exit=1` | – |
| D19 | – (design) | 19 | requirements; 1M QPS ÷ R45 median = instances (derived, ngoại suy) | OK |
| R40 | `05-counters.pg-hot` | 20 | 3 runs: `number of transactions actually processed: N` then `SELECT like_count` = N; tps > 0; note: đo trên PG 16.15, cause is the hot row | PART |
| R41 | `05-counters.pg-spread` | – | 3 runs, `sum` = processed; median tps(spread) > median tps(hot) | – |
| R42 | `05-pg.locks.timeline` | – | ≥ 1 B snapshot during A's run shows `Lock|transactionid` or `Lock|tuple` with count ≥ 1 | – |
| R43 | `05-counters.pg-hot-async` (opt) | – | median tps (`synchronous_commit=off`) > median tps(hot) | – |
| R44 | `05-counters.pg-bloat` (opt) | – | `n_tup_upd` ≥ last N; `n_tup_hot_upd`, `n_dead_tup` printed | – |
| R45 | `05-counters.redis-incr` | – | 3× `-c 8 -n 100000 INCR k2l04:cnt:post:1:like`, each `GET` → `100000` | – |
| R46 | `05-counters.redis-hincr` | – | 3× `HINCRBY k2l04:cnt:post:1 like 1`, each `HGET` → `100000` | – |
| R47 | `05-counters.flush-race` | – | `naive: sent=200000 … lost=<n>` n > 0; `getdel: sent=200000 … lost=0` | – |
| R48 | `05-counters.wb-loss` | 21 | crash container: `GET` 1000 → flush; `GET` 500 → kill + start → flush adds 0; final `like_count` 1000 (500 lost) | PART |
| R49 | `05-counters.mem-layouts` | 22 | bytes(`strings: keys=4000`) > bytes(`hash: keys=1000`) > bytes(`bucket100: keys=10`); `bucket100` `listpack`, `bucket200` `hashtable`, bytes(bucket200) > bytes(bucket100); `hash-max-listpack-entries` `512` | PART |
| D24 | – (design) | 24 | requirement; 10M users extrapolated from R51/R52 | OK |
| R50 | `06-unread.fanout-10k` | – | `calls=10000`; usec > 0; bytes/user > 0 | – |
| R51 | `06-unread.fanout-100k` | – | `calls=100000`; usec(100k)/usec(10k) in [4, 25] | – |
| R52 | `06-unread.pointer` | 25 | broadcast = 1 `INCR`; `unread=2` (6 − 4); `ZCOUNT` → 2; bytes/user printed | OK |
| R53 | `06-unread.mark-read` | – | plain `HSET` 6 then 4 → `unread=2` (wrong); `mark-read.lua` 6 then 4 → `unread=0` | – |
| R54 | `06-unread.zset-gt` (opt) | – | `ZADD … GT` 6 then 4 → score `6`; bytes/user printed | – |
| D27 | – (design) | 27 | two-way over one-way MQ | OK |
| R60 | `07-share.poll-blpop.timeline` | 29 | ≥ 5 `(nil)` polls before the value; value seen ≤ 300 ms after B's `SET`; `BLPOP` reply ≤ 150 ms after B's `RPUSH` | PART |
| R61 | `07-share.poll-blpop.timeline` | 28 | value written by session B read by session A (`{"ok":true}`) | OK |
| R62 | `07-tracking.tracking.timeline` (opt; only if smoke S6 passes) | – | A gets a push with `invalidate` and `k2l04:ct:menu` | – |
| D30 | – (design) | 30 | Hazelcast diagram, chưa đo trực tiếp; nearest Redis feature `CLIENT TRACKING` | OK |
| R70 | `08-delay.naive-lua.timeline` | 34 | naive: both read `o1`, `ZREM` A 1 / B 0, `o1` twice in done; Lua: `o1` once, `o2`, `o3` remain; `# lua delay-claim.lua` | OK |
| R71 | `08-practices.hll` | 35 | `n=100000 pfcount=99655 strlen=12304 mem=14384 magic=HYLL`; n = 100, 1000, 10000 within ±2.43 % (3 × 0.81 %); `same:08-practices.hll-rerun` | OK |
| R72 | `08-practices.hll-merge` (opt) | – | week in [25368, 26632] (true union 26000); multi-key `PFCOUNT` = week | – |
| R73 | `08-practices.bitmap` | 36 | `fiction=50000 adventure=33334 both=16667 strlen=12500`; `getbit42=1/1`; `sparse_strlen=1250000 sparse_bytes=1310768`; set_bytes > 50 × bitmap_bytes | PART |
| R74 | `08-practices.bloom` | 37 | `added=10000`; `members_found=10000 of 10000`; `false_positives` in [832, 1005] (918.5 ± 3σ); `bits` in [22386, 22733]; `strlen=6250`; set_bytes > 20 × bloom_bytes; `same:08-practices.bloom-rerun` | OK |
| D31 | – (design) | 31 | recap with measured corrections | PART |
| R80 | `hw-check.solution` | – | `✔ H1` … `✔ H6`, no `✘` | – |
| R81 | `hw-check.bad` | – | `✘ H2`, `✘ H3`, `✘ H5`; `✔ H1`, `✔ H4`, `✔ H6` | – |
| K01–K08 | `0N-<stem>.kiem-chung` | – | run exists, no `(error)` or `ERR`; feeds `table.expect` | – |

63 run rows (62 if S6 drops R62) and 7 design rows. Null-chip slides (frozen): 1, 2, 3, 10, 12, 17, 18, 23, 26, 32, 38, 39. Chip slides (27): 4–9, 11, 13–16, 19–22, 24, 25, 27–31, 33–37.

## Acceptance criteria

1. `$G` ≤ 520 KB, one file, no `<script src>`, fonts only from Google Fonts, no rail, slide images by relative path `../../Tài Liệu/Khóa 3. …/assets/04_Caching/…`, no `data:image` (V01, V10, V22; P06, P08).
2. `SLIDES` covers 1–39 once; chips equal the `expected.tsv` chip rows; the null-chip set equals the frozen list; PART slides carry `id="sl-NN"` (V04; P02, P08).
3. Each stage has a glossary before its first command block, a story, a figure or inline SVG, `table.stats`, `.check30`, byte-exact `pre[data-cmd]`, a recorded run, a "Làm mẫu" callout, `kiem-chung` + `table.expect`, a `callout challenge` with PASS criteria, and 4 quiz items whose `why` cites a run id (V05, V11, V12, V23; P07, P08).
4. No Lua before stage 2: no `.lua`, `--eval` or `EVAL` block in `#cach-hoc` or `#chang-1` (V24) and no Lua in `$L/00-*` or `$L/01-*` (V17) (P02, P03, P08).
5. Every `b.m`, `pre[data-run]`, widget number and quiz/exam number traces to a run whose sha256 equals its single manifest line; every derived value recomputes (V06–V08, V16, M01, DATA; P03–P05, P08).
6. Every expected row matches, or is a kongming-approved `deviation` with a `deviations.md` entry and changed narrative/chip (D01; P03, P04).
7. `oracle.mjs --compare` reports 38/38 identical decisions for each of the six replay runs (P03).
8. `check.sh` rc 0 with only ✔/`–` after seed, after a second seed (identical body), and at handoff (P03, P04, P10).
9. `--lint` (V17) GREEN (P02–P04).
10. Every `# lua <name> sha256=` header equals `$L/lua/<name>` (V18; P03, P04).
11. Storage keys `k2l04-*` only; dark and light both work; widgets write run data via `textContent` or `esc()` (V09, V14, V19; P06–P08).
12. render-check at 375/768/1440, light and dark: `Summary: 0 errors, 0 warnings.` (P08).
13. `negative-tests.sh`: `35/35 ca đỏ đúng thiết kế · 0 SKIP · tổng 35 ca` (P02, P08).
14. `fingerprint.sh --compare runs/00-fingerprint-before.txt` rc 0 at the end of P03, P04 and P10 (P01, P03, P04, P10).
15. Homework: solution ✔ H1–H6, bad fixture ✘ H2, H3, H5 (P02, P05).
16. No open Critical/Important review finding (P09).
17. README, master curriculum (`.md` and `.html` twin), L06 `#tiep-theo` link (built guide + `shell-tail.html`) and the handoff are written; `git status --short` ⊆ allow-list; no branch, commit or push (P10).

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| Docker VM clock runs ~8 % fast and steps back ≤ 2.8 s | H×M | Replay with client-supplied `now_ms`; live demos timed on the Redis clock inside one container shell; benchmarks 3×, median, reject ≤ 0 or ≥ 5 000 000; every run header has `# đồng hồ redis/host`; the runner rejects Δredis ≤ 0 or ratio outside [0.8, 1.25] (exit 3, at most 2 automatic re-records). |
| A K2L04 step touches L06 or a foreign container | L×H | Runner guard `^advance-be-k2l04-(redis\|cluster\|crash)$` plus PG `psql`/`pgbench` only; V17 bans the string `advance-be-redis`; K2L04 names never contain `advance-be-redis-` (L06 C14); `check.sh` scans only its own prefix; fingerprint before/after. |
| pgbench load on the company Postgres container | L×H | `-n -f` only, `-c ≤ 8 -T ≤ 5`, SQL only in `k2l04_counter`, session `PGOPTIONS` only, no `ALTER SYSTEM`; schema-list gate. |
| `pgbench -f /dev/stdin` unsupported | M×L | Smoke S8 picks `/tmp/k2l04-*.pgb` removed in the same command. |
| Hand-computed replay numbers wrong | M×M | `oracle.mjs` re-derives them in P02 before any Redis run; a mismatch triggers the Failure Protocol. |
| HLL/Bloom outside the 3σ band on the fixed input | L×M | Data kept; kongming decides deviation and narrative. |
| R47 naive flush loses nothing in one run | L×L | Data kept; deviation narrative "không có gì bảo đảm". |
| redis-cli cannot display RESP3 push (S6) | M×L | R62 dropped before freeze; slide 30 stays design-only. |
| Git Bash path rewrite, `#` lines, `localhost` | H×M | L06 rules: `MSYS_NO_PATHCONV=1`, `grep -v '^#'`, `127.0.0.1`; V17. |
| Guide over 520 KB | M×M | Excerpts with `…`, folds, V01. |
| Delegates invent numbers or reword code | M×M | V07, V16, DATA, V05; frozen contract. |
| Learner starts/stops L06 during the build | M×L | K2L04 does not depend on it; fingerprint treats L06 status as info, its id/network/binding as hard. |

Rollback: `bash D:/study/advance-be/labs/k2-lesson-04-caching/99-cleanup.sh` UNLINKs `k2l04:*` on main except `k2l04:my:*` and `k2l04:hw:*` and removes `advance-be-k2l04-cluster` and `advance-be-k2l04-crash` by exact name; `--all` also removes main, volume `advance-be-k2l04-data` and network `advance-be-k2l04` (only when empty). Postgres: the learner runs `pg/99-cleanup.sql` in DBX (`DROP SCHEMA IF EXISTS k2l04_counter CASCADE`); the controller never runs it. All repo files are new except the P10 one-line doc edits, whose original lines are quoted in phase 10. No prune, no git.

## Open questions for the user

None blocking. The fail-open vs fail-closed choice stays Đạt's ADR-010 decision: the guide measures the error path and lays out both options, and it does not pick one.

=== FILE: phase-01-contract-baseline-smoke.md ===
---
phase: 1
title: "Contract, baseline, run-method smoke"
status: pending
priority: P1
effort: 0.75h
dependencies: []
---

# Phase 01 — Contract, baseline, run-method smoke

## Goal
Freeze every name later work depends on, record a privacy-safe fingerprint of everything K2L04 must not touch (including L06's main and the Postgres schema list), and decide the run method from measured smokes.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/assembly/contract.md`
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/verify/fingerprint.sh` (adapted from `$L06P/verify/fingerprint.sh`)
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/runs/00-fingerprint-before.txt`, `.../runs/run-method-smoke.txt`
- Scratch only: `.../verify/tmp/`

## Tasks

**T1.1 Fingerprint script and baseline**
- Goal: a read-only before/after gate that includes L06's main.
- Target files: `$P/verify/fingerprint.sh`, `$P/runs/00-fingerprint-before.txt`.
- Steps:
  1. Copy `$L06P/verify/fingerprint.sh`. Keep line 2 `export MSYS_NO_PATHCONV=1`, the `docker ps -a --no-trunc --format '{{.ID}}|{{.Image}}|{{.Names}}|{{.Status}}'` source and the `sha256(id|image)|Up|Exited` lines. Skip names `advance-be-k2l04-*` (lab). Never write any container name.
  2. For `advance-be-redis` write instead: `l06_id=<sha256(id|image)|absent>`, `l06_status=<Up|Exited|absent>`, `l06_networks=<sorted network names>`, `l06_bind=<docker port advance-be-redis 6379|none>`, `l06_volume=<present|absent>` (`docker volume inspect advance-be-redis-data`), `l06_k2l04_keys=<n|down>` (`docker exec advance-be-redis redis-cli --scan --pattern 'k2l04:*' | wc -l`, only when Up). Tag each such line `# l06-readonly`. These are reads only.
  3. Add `port6380=<free|bound>`, `port6380_k2l04=<none|names>`, `k2l04_main_bind=<binding|none>`, `k2l04_run_id_match=<yes|no|down>` (node TCP `INFO server` to `127.0.0.1:6381` vs `docker exec advance-be-k2l04-redis redis-cli INFO server`), `pg_schemas_sha=<sha256>` of `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -Atc "SELECT string_agg(nspname, ',' ORDER BY nspname) FROM pg_namespace WHERE nspname NOT LIKE 'pg\_%' AND nspname NOT IN ('information_schema','k2l04_counter')"`, and `pg_k2l04=<present|absent>`.
  4. `--compare <before>` exits 1 when: a foreign hash line is missing or changed; `l06_id`, `l06_networks` or `l06_volume` differ; `l06_bind` differs while L06 is Up in both files; `l06_k2l04_keys` is not `0`/`down`; `port6380_k2l04` ≠ `none`; `pg_schemas_sha` differs; or main is up and `k2l04_main_bind` ≠ `127.0.0.1:6381` or `k2l04_run_id_match` ≠ `yes`. `l06_status` changes, new `advance-be-k2l04-*` containers, other new containers and a non-K2L04 6380 owner print `info:` only. rc 0 prints `✔ fingerprint khớp baseline`.
  5. `bash verify/fingerprint.sh > runs/00-fingerprint-before.txt`.
- Success criteria: idempotent, no company names, all L06/PG lines present.
- Verify:
  - `bash verify/fingerprint.sh > verify/tmp/fp-a.txt; bash verify/fingerprint.sh > verify/tmp/fp-b.txt; diff verify/tmp/fp-a.txt verify/tmp/fp-b.txt && echo SAME` → `SAME`.
  - `grep -ciE 'quan-ly|omnipos|frappe|getting-started|password|secret' runs/00-fingerprint-before.txt` → `0`.
  - `grep -cE '^(l06_id|l06_networks|l06_volume|l06_k2l04_keys|pg_schemas_sha|port6380_k2l04)=' runs/00-fingerprint-before.txt` → `6`.
  - `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt; echo rc=$?` → last line `rc=0`.

**T1.2 Run-method smoke S1–S11**
- Goal: measured decisions for the learner method and the two open toolchain questions (S6 push display, S8 pgbench stdin).
- Target files: `$P/runs/run-method-smoke.txt`.
- Steps:
  1. `docker network inspect advance-be-k2l04 >/dev/null 2>&1 || docker network create advance-be-k2l04`; `docker run -d --name advance-be-k2l04-smoke --network advance-be-k2l04 redis:7.2.3 redis-server --save "" --appendonly no` (no port).
  2. Record, one block per smoke, each first line `S<n> …`: S1 `printf 'SET k2l04:smoke 1\nGET k2l04:smoke\n' | docker exec -i advance-be-k2l04-smoke redis-cli --no-raw` → `OK`, `"1"`. S2 `{ echo PING; sleep 1; echo PING; } | docker exec -i advance-be-k2l04-smoke redis-cli | while read l; do echo "$(date +%s%3N) $l"; done` → stamps 900–1200 ms apart. S3 a `# x` line → `ERR unknown command '#'`. S4 `docker exec advance-be-k2l04-smoke echo /lab/x` (mangled) vs `MSYS_NO_PATHCONV=1 …` → `/lab/x`. S5 DBX: "deferred to T3.1 (main not up yet); L06 addendum item 5: one command per execution". S6 session A `{ printf 'HELLO 3\nCLIENT TRACKING ON\nGET k2l04:ct:x\n'; sleep 2; printf 'PING\n'; } | docker exec -i advance-be-k2l04-smoke redis-cli > verify/tmp/s6.txt &`, then `sleep 1; docker exec advance-be-k2l04-smoke redis-cli SET k2l04:ct:x 2; wait; cat verify/tmp/s6.txt`; write `S6 decision=keep` if the output contains `invalidate`, else `S6 decision=drop`. S7 `printf 'return 42' > verify/tmp/s7.lua; docker exec -i advance-be-k2l04-smoke redis-cli -x SCRIPT LOAD < verify/tmp/s7.lua` → 40 hex, then `EVALSHA <sha> 0` → `42`. S8 `printf 'SELECT 1;\n' | MSYS_NO_PATHCONV=1 docker exec -i quan-ly-hop-dong-postgres-1 pgbench -n -c 1 -t 3 -f /dev/stdin -U postgres advance_be_lab` → `number of transactions actually processed: 3/3` gives `S8 decision=stdin`; otherwise smoke `sh -c 'cat > /tmp/k2l04-smoke.pgb && pgbench -n -c 1 -t 3 -f /tmp/k2l04-smoke.pgb -U postgres advance_be_lab; rm -f /tmp/k2l04-smoke.pgb'` and write `S8 decision=tmp`. S9 `docker exec advance-be-k2l04-smoke redis-benchmark -q -n 1000 SET k2l04:smoke:b v` prints `SET k2l04:smoke:b v: … requests per second, p50=…`; `--scan` lists only `k2l04:*`. S10 `CONFIG GET` `maxclients`, `hash-max-listpack-entries`, `hll-sparse-max-bytes` → 10000, 512, 3000. S11 `redis-cli TIME` before and after a host `sleep 10` → ratio line.
  3. `docker rm -f -v advance-be-k2l04-smoke`.
- Success criteria: 11 smoke blocks, two decision lines, smoke container gone.
- Verify:
  - `grep -cE '^S([1-9]|10|11) ' runs/run-method-smoke.txt` → `11`.
  - `grep -cE '^S6 decision=(keep|drop)$|^S8 decision=(stdin|tmp)$' runs/run-method-smoke.txt` → `2`.
  - `docker ps -a --filter name=advance-be-k2l04-smoke --format '{{.Names}}' | wc -l` → `0`.

**T1.3 Contract v1**
- Goal: one frozen source for names and formats.
- Target files: `$P/assembly/contract.md`.
- Steps: write sections §1 key registry (all `k2l04:`; `k2l04:my:*`, `k2l04:hw:*` never removed); §2 containers (phase 03 table, guard `^advance-be-k2l04-(redis|cluster|crash)$`); §3 file formats (L06 `.redis`/`.sh` rules plus: `.sql` regions `-- #region <id> · …`/`-- #endregion`; psql/pgbench line forms with S8's decision; banned words list of V17); §4 run ids and headers (`# chạy lúc …`, `# đồng hồ redis/host: Δredis=<ms> Δhost=<ms> tỉ lệ=<r>`, `# lua <name>.lua sha256=<hex>`), manifest and rep rules (copy L06 contract §3); §5 frozen output lines exactly as quoted in the plan matrix; §6 Lua contracts (each script's KEYS, ARGV, return; `now_ms ≤ 0` → `redis.call('TIME')`; `elapsed = math.max(0, now − ts)`; keys only via `KEYS`; PEXPIRE on every write); §7 `traffic.tsv`, verbatim, 38 lines `ts_ms<TAB>client`: a = 9600 9700 9800 9900 9950 10050 10100 10200 10300 10400; b = 20000 20010 20020 20030 20040 23100 26100 29100; c = 40000 42100 44200 46300 48400 50500 52600 54700 56800 58900; d = 60100 60200 60300 60400 60500 70600 70700 70800 70900 71000; §8 fragment format, CSS vocabulary, widget ids, storage keys `k2l04-*`, sections; §9 learner workflow (from T1.2); §10 slide table (39 rows `| n | title | stage | chip | row | anchor |`, copied from the plan matrix).
- Success criteria: §10 lists 1–39 once with the frozen null list.
- Verify:
  - `node -e "const t=require('fs').readFileSync('assembly/contract.md','utf8').split('## 10')[1];const r=[...t.matchAll(/^\| (\d+) \|[^|]*\|[^|]*\| ([^|]+) \|/gm)].map(m=>({n:+m[1],c:m[2].trim()}));console.log(r.length,new Set(r.map(x=>x.n)).size,r.filter(x=>x.c==='–').map(x=>x.n).join(','))"` → `39 39 1,2,3,10,12,17,18,23,26,32,38,39`.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| fingerprint idempotent | `SAME` | T1.1 diff |
| no names or secrets | `0` | T1.1 grep |
| tampered foreign line is caught | `rc=1` | `sed '0,/|Up$/s//|Exited/' runs/00-fingerprint-before.txt > verify/tmp/fp-bad.txt; bash verify/fingerprint.sh --compare verify/tmp/fp-bad.txt; echo rc=$?` |
| tampered L06 id is caught | `rc=1` | `sed 's/^l06_id=.*/l06_id=0000/' runs/00-fingerprint-before.txt > verify/tmp/fp-l06.txt; bash verify/fingerprint.sh --compare verify/tmp/fp-l06.txt; echo rc=$?` |
| smoke container removed | `0` | T1.2 docker ps |
| contract slide table | `39 39 1,2,…,39` | T1.3 node |

## Risks and rollback
Smokes touch only `advance-be-k2l04-smoke` and read-only `SELECT 1` on Postgres. The fingerprint holds hashes, counts and port states only. Rollback: delete the four files; `docker network rm advance-be-k2l04` if nothing is attached.

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
title: "Tests first: matrix, oracle, check, verifier, homework checker, negative tests"
status: pending
priority: P1
effort: 2.0h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Every checker exists and is RED for the right reason before any lab region, run or HTML exists, and the frozen replay numbers are re-derived by an independent oracle.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/plans/261102-1332-k2-lesson-04-caching-teacher-guide/verify/`: `lab-text.mjs`, `run-redis.mjs`, `merge-timeline.mjs`, `verify-guide.mjs`, `negative-tests.sh`, `rerun-gate.mjs`, `widget-smoke.mjs`, `make-widget-data.mjs`, `record-all.sh` (all copied from `$L06P/verify/` then adapted), `oracle.mjs` (new), `expected.tsv`, `deviations.md`, `hw-bad-fixture.lua`, `fixtures/`.
- `D:/study/advance-be/labs/k2-lesson-04-caching/`: `check.sh`, `hw-check.sh`, `data/traffic.tsv`.

## Tasks

**T2.1 Copy the L06 toolchain**
- Goal: start from working code.
- Target files: the `verify/` list above.
- Steps: `cp "$L06P"/verify/{lab-text.mjs,run-redis.mjs,merge-timeline.mjs,verify-guide.mjs,negative-tests.sh,rerun-gate.mjs,widget-smoke.mjs,make-widget-data.mjs,record-all.sh} verify/ && cp -r "$L06P/verify/fixtures" verify/`; then `node verify/run-redis.mjs --register runs/00-fingerprint-before.txt` and the same for `runs/run-method-smoke.txt`.
- Success criteria: files parse; manifest has the two phase-01 files.
- Verify: `for f in verify/*.mjs; do node --check "$f" || echo BAD; done | grep -c BAD` → `0`; `grep -c . runs/manifest.tsv` → `2`.

**T2.2 Runner and display rule**
- Goal: one runner for Redis, `.sh` and `.sql`, guarded and clock-aware.
- Target files: `verify/run-redis.mjs`, `verify/lab-text.mjs`.
- Steps:
  1. `lab-text.mjs`: `.sql` regions use `-- #region <id> ` / `-- #endregion`; `displayText` drops `#` lines only for `.redis`; `.sh`, `.sql`, `.lua`, `.ts`, `.tsv` verbatim.
  2. `run-redis.mjs`: `GUARD = /^advance-be-k2l04-(redis|cluster|crash)$/`, `MAIN = 'advance-be-k2l04-redis'`; `quan-ly-hop-dong-postgres-1` is accepted only as a `docker exec` target whose first argument is `psql` or `pgbench` (or `sh` when S8 = tmp); anything else exits 2. `.sql` kind pipes the region into `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -v ON_ERROR_STOP=1 -P pager=off -a -f -` with header `# chạy lúc … · PostgreSQL <version()> · psql trong container`.
  3. For Redis runs, sample `redis-cli TIME` on the target and host `Date.now()` before and after; write `# đồng hồ redis/host: …`. When Δhost ≥ 2000 ms and (Δredis ≤ 0 or ratio outside [0.8, 1.25]), write nothing and exit 3.
  4. Barrier keys `k2l04:barrier:<scenario>`; `--ab`, `--rep`, manifest replace and `MSYS_NO_PATHCONV` stripping stay as in L06.
- Success criteria: L06 main and foreign containers refused.
- Verify: `node verify/run-redis.mjs verify/fixtures/x.redis --region a --ct advance-be-redis; echo rc=$?` → `rc=2`; same with `--ct quan-ly-hop-dong-postgres-1` → `rc=2`.

**T2.3 Verifier adaptation**
- Goal: L06 rules plus the K2L04 rules, with self-tests.
- Target files: `verify/verify-guide.mjs`, `verify/fixtures/*`.
- Steps:
  1. Paths to `$L`, `$G`; slides 1–39; storage prefix `k2l04-`; V01 limit 520 KB; V03 sections `cach-hoc`, `chang-1`…`chang-8`, `tong-ket`, `bai-tap`, `drill`, `phong-van`, `cheat-sheet`, `ban-do-slide`, `tham-khao`, `tiep-theo`; V11 8 quizzes + EXAM 10; drop V20.
  2. V04 also requires the null-chip set to equal `1,2,3,10,12,17,18,23,26,32,38,39`. V07 small numbers also accept a psql cell (a line that is only the number, or `| N |`). V15 adds `postgres(ql)?://[^ ]*@|PGPASSWORD|password=`. V12 requires `dl.glossary`. New V22: every `img src` starts `../../Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/assets/04_Caching/` and no `data:image`. New V23: in each stage the first `dl.glossary` precedes the first `pre[data-cmd]`. New V24: no `pre[data-cmd]` naming `lua/`, `--eval`, `EVAL` or `SCRIPT LOAD` before `id="chang-2"`.
  3. `--runs --rows <comma prefixes>` filters rows; `same:` ignores every line starting `# `; `evalExpr` gains `exp(x)` and `median(a,b,c)`.
  4. V17 (`--lint`) fails on: a non-`k2l04:` key in key position (redis-cli, awk `print`, `--eval`, `EVAL`/`EVALSHA` numkeys, `redis-benchmark` command); `6380` or `6379` except the `00-containers.sh` publish line tagged `# guard-port`; `localhost`; the string `advance-be-redis` anywhere in `$L` or `$P/verify` except `fingerprint.sh` lines tagged `# l06-readonly`; a docker target outside the guard or the PG rule; destructive docker verbs except on `-crash`/`-cluster` in a region whose first command is `echo "→ <ct>"` or tool lines tagged `# guard-own`; `CONFIG SET`, `FLUSHALL`, `FLUSHDB`, `SHUTDOWN`, `prune` (built from parts), `$RANDOM`, `shuf`, `/dev/urandom`; `redis-benchmark` with `-t` or without a custom command; pgbench without `-n`/`-f`/`-T`, with `-i`, `-c` > 8 or `-T` > 5, or `random(` without `--random-seed=`; SQL `CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE` not qualified `k2l04_counter.` (schema DDL on `k2l04_counter` allowed), `ALTER SYSTEM`; Lua (`EVAL`, `EVALSHA`, `--eval`, `SCRIPT LOAD`) in `00-*`/`01-*`; `--eval`/`<now>` in `.redis`; L06 path and `HERE=` rules; a publish other than `127.0.0.1:6381:6379`.
  5. Extend `--selftest` with one planted case per new rule and one clean case.
- Success criteria: self-test GREEN.
- Verify: `node verify/verify-guide.mjs --selftest > verify/tmp/selftest.txt; echo rc=$?` → `rc=0`; `grep -c 'SAI' verify/tmp/selftest.txt` → `0`.

**T2.4 Expected matrix and deviations log**
- Goal: the plan matrix as data, before any run.
- Target files: `verify/expected.tsv`, `verify/deviations.md`.
- Steps: header `id run slides regex claim chip status`; one row per plan-matrix row (omit R62 when S6 = drop); regexes anchor on the contract §5 lines, predicates after ` ⇒ ` (example R22: `^algo=fixed allowed=(?<a>\d+) denied=(?<d>\d+)$ ⇒ a==35; d==3`); design rows use run `-`; all status `expect`. `deviations.md` gets the L06 header text, retitled.
- Success criteria: 70 rows (69 without R62), chip slides exactly the frozen 27.
- Verify: `awk -F'\t' 'NR>1' verify/expected.tsv | wc -l` → `70` (or `69`); `awk -F'\t' 'NR>1 && $6!="–"{print $3}' verify/expected.tsv | sort -n | paste -sd, -` → `4,5,6,7,8,9,11,13,14,15,16,19,20,21,22,24,25,27,28,29,30,31,33,34,35,36,37`; `node verify/verify-guide.mjs --runs 2>&1 | grep -c 'missing run'` → `63` (or `62`).

**T2.5 Traffic file and oracle (red first)**
- Goal: an independent re-derivation of every frozen replay number.
- Target files: `$L/data/traffic.tsv`, `verify/oracle.mjs`.
- Steps:
  1. Write `verify/oracle.mjs` first (≈120 lines, Vietnamese comments): `rl` simulates fixed, log, swc, leaky, token, token-interval exactly as contract §6 on `$L/data/traffic.tsv` and prints the §5 lines; `rl --diff swc log` prints `differ=<n>`; `slots` prints CRC16-XMODEM spread of `k2l04:post:1..10000` and the R06 key slots; `--compare <run file>` checks every per-request decision of a recorded replay (exact `ok`, ±1 on other fields) and exits 1 on any mismatch.
  2. Run `node verify/oracle.mjs rl; echo rc=$?` → `rc=1` with `thiếu data/traffic.tsv` (red).
  3. Write `traffic.tsv` from contract §7.
- Success criteria: oracle reproduces the plan numbers.
- Verify: `node verify/oracle.mjs rl | grep '^algo='` → exactly `algo=fixed allowed=35 denied=3`, `algo=log allowed=30 denied=8`, `algo=swc allowed=27 denied=11`, `algo=leaky allowed=33 denied=5`, `algo=token allowed=33 denied=5`, `algo=token-interval allowed=35 denied=3`; `node verify/oracle.mjs rl --diff swc log` → `differ=5`; `wc -l < "$L/data/traffic.tsv"` → `38`.

**T2.6 Learner checks (red first)**
- Goal: `check.sh` and `hw-check.sh` exist before the lab they check.
- Target files: `$L/check.sh`, `$L/hw-check.sh`, `verify/hw-bad-fixture.lua`.
- Steps:
  1. `check.sh` (tool script: line 2 `export MSYS_NO_PATHCONV=1`, `HERE=` line; read-only; rows `✔|✘|– Cnn mô tả · chi tiết`; rc = number of ✘): C01 main (exists, running, `redis:7.2.3`, `--appendonly no`, `--enable-debug-command local`, network `advance-be-k2l04`, `/lab` = this dir read-only, `/data` = `advance-be-k2l04-data`, `redis_version:7.2.3`); C02 cluster and C03 crash (absent → `–`; else flags, network, no port, cluster `cluster_state:ok` + 16384 slots); C04 every key on main starts `k2l04:`; C05 seed values; C06 config defaults via `CONFIG GET` (`maxmemory 0`, `noeviction`, `appendonly no`, `maxclients 10000`, `hash-max-listpack-entries 512`, `hll-sparse-max-bytes 3000`); C07 no `k2l04:barrier:*`; C08 main publishes exactly `127.0.0.1:6381` and no other `advance-be-k2l04-*` publishes; C09 run_id over `127.0.0.1:6381` equals `docker exec`. If main is absent or stopped, C04–C07 print `✘ … cần main đang chạy`. Env `K2L04_MAIN` may override the main name (negative tests only).
  2. `hw-check.sh` (tool script): `HW_LUA` (default `hw/my-token-bucket.lua`, relative to `$L` unless absolute); exits 9 with `dừng:` when C09 fails; unlinks `k2l04:hw:tb:*`; loads the script with `docker exec -i advance-be-k2l04-redis redis-cli -x SCRIPT LOAD < "$F"`; calls `EVALSHA <sha> 1 <key> <now_ms> 10 3600000` inside the container. Rows: H1 30 calls on `k2l04:hw:tb:store:7` at now 1000000…1000029 → exactly 10 allowed; H2 exactly 20 denied, each retry > 0; H3 the first call for `store:8` is allowed; H4 a call at now 900000 on the empty store-7 bucket is denied with remaining ≥ 0; H5 `PTTL k2l04:hw:tb:store:7` > 0; H6 at now 4600030 exactly one more call allowed, the next denied. rc = number of ✘.
  3. `verify/hw-bad-fixture.lua`: refills and clamps correctly but writes `k2l04:hw:tb:all` (ignores `KEYS[1]`), returns retry 0 and never sets PEXPIRE.
- Success criteria: both scripts fail for the right reason now.
- Verify: `bash "$L/check.sh"; echo rc=$?` → contains `✘ C01`, `– C02`, `– C03`, last line `rc=7`; `bash "$L/hw-check.sh"; echo rc=$?` → contains `dừng:`, last line `rc=9`.

**T2.7 Negative tests, rerun gate, widget-smoke, recorder**
- Goal: prove the checkers bite.
- Target files: `verify/negative-tests.sh`, `verify/rerun-gate.mjs`, `verify/widget-smoke.mjs`, `verify/make-widget-data.mjs`, `verify/record-all.sh`.
- Steps:
  1. `negative-tests.sh` groups `--guide-only|--labs-only|--data-only|--tool-only|--hw-only`, 35 cases. Guide (13): a `pre[data-cmd]` char → V05; b fake `b.m` → V07; c `data-store="l06-` → V09; d slide 21 removed → V04; e slide 13 chip changed → V04; f chip added to slide 12 → V04; g external script → V10; h `data:image` → V22; i Lua `pre[data-cmd]` moved into `#chang-1` → V24; j unescaped `innerHTML` → V19; k quiz `why` without run id → V11; l 3-digit number not in cited run → V16; m glossary removed from `#chang-3` → V23. Labs/runs (16): n corrupted R22 run → `R22`; o hand-edited run (temp manifest built with `sha256sum`) → M01; p contradicting fixture run `algo=fixed allowed=34 denied=4` in a temp runs dir → `R22`; q R22 marked `deviation` with empty deviations → D01; planted lines → V17: r `SET foo 1`, s `echo 6380`, t `docker exec advance-be-redis redis-cli PING`, u `pgbench -i`, v `pgbench -n -c 16 -T 5 -f /dev/stdin`, w `psql -c "UPDATE public.t SET x = 1"`, x `CONFIG SET maxmemory 1mb`, y `echo $RANDOM`, z `redis-benchmark -t incr`, aa `EVAL "return 1" 0` in `01-x.sh`, ac `docker volume ` + `pr`+`une`; ab one byte added to a `lua/*.lua` copy → V18. Data (1): ad fake number in `w1.json` → DATA. Tool (4): ae `K2L04_MAIN=advance-be-k2l04-nope bash check.sh` → `✘ C01`; af foreign key `neg-probe` on main → `✘ C04`, then `UNLINK neg-probe`; ag tampered foreign hash in a copy of the baseline → compare rc 1; ah tampered `l06_id` → rc 1. HW (1): ai bad fixture → `✘ H2`, `✘ H3`, `✘ H5`. A case whose target does not exist prints SKIP.
  2. `rerun-gate.mjs`: `LABS = $L`; also masks numbers after `pgbench`, `commandstats`, `TIME`, `pg_stat`, `tps`, `requests per second`.
  3. `widget-smoke.mjs`: W1–W6; W6 types each key of `runs/01-cluster.keyslot.txt` into `#w6-key` and compares `#w6-slot`; W1 shows the six `algo=` summaries of `runs/data/w1.json`.
  4. `make-widget-data.mjs`: stub that exits 2 with `chưa có runs`. `record-all.sh`: functions `setup s1 … s8 gates` with empty bodies.
- Success criteria: runnable groups RED as designed.
- Verify: `bash verify/negative-tests.sh --labs-only | tail -1` → `14/14 ca đỏ đúng thiết kế · 2 SKIP · tổng 16 ca` (n and ab have no run yet); `bash verify/negative-tests.sh --tool-only | tail -1` → `3/3 ca đỏ đúng thiết kế · 1 SKIP · tổng 4 ca`; `node verify/widget-smoke.mjs --help; echo rc=$?` → `rc=0`; `bash -n verify/record-all.sh; echo rc=$?` → `rc=0`; `node verify/verify-guide.mjs --lint` → `✔ không có lỗi` (tool scripts already follow the rules).

## Test matrix
| Test (written first) | Expected now | Command |
|---|---|---|
| verifier self-test | rc 0, 0 `SAI` | T2.3 |
| runs before experiments | 63 × `missing run` (62 if S6 drop) | T2.4 |
| runner refuses L06 main and PG as Redis | `rc=2` twice | T2.2 |
| oracle reproduces frozen numbers | six `algo=` lines, `differ=5` | T2.5 |
| check before containers | `rc=7`, `✘ C01` | T2.6 |
| homework checker before main | `rc=9` | T2.6 |
| contradicting measurement is caught, data edit is caught | cases p (R22) and o (M01) RED | T2.7 labs group |
| bad homework fixture | case ai SKIP now; RED in phase 05 | T2.7 |

## Risks and rollback
The oracle is a second implementation; if it and the hand numbers disagree, that is a planning error caught before any Redis run. Rollback: delete `verify/` files created here and the three `$L` files.

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

=== FILE: phase-03-containers-stages-1-4-runs.md ===
---
phase: 3
title: "Containers, seed, stages 1–4 labs and recorded runs"
status: pending
priority: P1
effort: 2.25h
dependencies: [2]
---

# Phase 03 — Containers, stages 1–4 labs and runs

## Goal
Create the K2L04 containers and the stage 1–4 lab files, then record every stage 1–4 run serially until those matrix rows, the oracle compare, lint and the fingerprint are GREEN.

## Files to create/modify (owner: controller; runs strictly serial)
`D:/study/advance-be/labs/k2-lesson-04-caching/`: `00-containers.sh`, `00-seed.redis`, `99-cleanup.sh`, `01-fundamentals.sh`, `01-cluster.redis`, `01-cluster.sh`, `02-race.A.redis`, `02-race.B.redis`, `02-lua.sh`, `03-ratelimit.redis`, `03-ratelimit.sh`, `04-buckets.sh`, `04-leaky.A.sh`, `04-leaky.B.sh`, `04-tb-race.A.sh`, `04-tb-race.B.sh`, `lua/cap-incr.lua`, `lua/rl-sliding-log.lua`, `lua/rl-swc.lua`, `lua/rl-leaky.lua`, `lua/rl-token-bucket.lua`. Plan folder: `verify/record-all.sh` (bodies `setup s1–s4`), `runs/*`.

## Container lifecycle (all `redis:7.2.3`, local image, network `advance-be-k2l04`)

| Container | Published | Volume / mount | Flags | Up | Down |
|---|---|---|---|---|---|
| `advance-be-k2l04-redis` (main) | `127.0.0.1:6381:6379` only | `advance-be-k2l04-data:/data`, `$L:/lab:ro` | `--appendonly no --enable-debug-command local` | `up main` | only `99-cleanup.sh --all` |
| `advance-be-k2l04-cluster` | none | `$L:/lab:ro` | `--cluster-enabled yes --cluster-config-file nodes.conf --save "" --appendonly no`, then `CLUSTER ADDSLOTSRANGE 0 16383` | `up cluster` | `down cluster` |
| `advance-be-k2l04-crash` | none | `$L:/lab:ro` | `--save "" --appendonly no --enable-debug-command local` | `up crash` | `down crash` |

## Tasks

**T3.1 Container tool, seed, cleanup**
- Goal: idempotent create/reset/restore that cannot reach L06.
- Target files: `$L/00-containers.sh`, `$L/00-seed.redis`, `$L/99-cleanup.sh`.
- Steps:
  1. Copy `labs/lesson-06-redis/00-containers.sh` and adapt: names from the table; `MAIN=advance-be-k2l04-redis`; `NET=advance-be-k2l04`; `DATA=advance-be-k2l04-data`; guard `case` accepts only `advance-be-k2l04-redis|advance-be-k2l04-cluster|advance-be-k2l04-crash`; publish line `PUB=(-p 127.0.0.1:6381:6379) # guard-port`; refuse any publish containing `6379:`… on host side other than 6381 or `6380`; drift check (image, Cmd, network, publish, mounts) recreates only own containers; `reset main` = `UNLINK` of every `k2l04:barrier:*` and re-pipe of `00-seed.redis` (no `CONFIG SET`); `status`. Every destructive docker line carries `# guard-own`. Never names `advance-be-redis`.
  2. `00-seed.redis`: `UNLINK` then recreate `k2l04:seed:menu` (Hash, 3 fields), `k2l04:seed:version` (`"1"`). Never touches `k2l04:my:*`, `k2l04:hw:*`.
  3. `99-cleanup.sh` per plan rollback; SCAN + UNLINK in batches; no prune, no `FLUSHALL`.
  4. `bash $L/00-containers.sh up main`; add DBX connection `ADVANCE_BE_K2L04_REDIS` (127.0.0.1:6381, db 0); send `INFO server` through DBX and note in `runs/run-method-smoke.txt` an `S5 dbx_run_id_match=<yes|no>` line (append, then `node verify/run-redis.mjs --register runs/run-method-smoke.txt`).
- Success criteria: main up on loopback 6381, check rows C01, C04–C09 ✔.
- Verify: `docker port advance-be-k2l04-redis` → exactly `6379/tcp -> 127.0.0.1:6381`; `grep -v '^#' "$L/00-seed.redis" | docker exec -i advance-be-k2l04-redis redis-cli >/dev/null; bash "$L/check.sh"; echo rc=$?` → `– C02`, `– C03`, last line `rc=0`; `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`.

**T3.2 Stage 1 labs (no Lua)**
- Goal: slides 4–11 measured.
- Target files: `$L/01-fundamentals.sh`, `$L/01-cluster.redis`, `$L/01-cluster.sh`.
- Steps:
  1. `01-fundamentals.sh` regions: `bench` (`SET k2l04:bench:k v` first; 3× `docker exec advance-be-k2l04-redis redis-benchmark -q -n 100000 SET k2l04:bench:k v`, then 3× `GET k2l04:bench:k`; ends with `redis-cli --scan --pattern '*' | grep -vc '^k2l04:'` → `0`); `latency` (3× `-q -c 1 -n 20000 GET k2l04:bench:k`); `cpu` (`INFO cpu` lines + host `date +%s%3N`, 3× `-c 8 -n 200000 GET k2l04:bench:k`, again; one final line `cpu_ms=<n> host_ms=<n>` from awk); `limits` (`CONFIG GET maxclients`, `CONFIG GET maxmemory`, `INFO server` grep `redis_version|arch_bits|io_threads_active`); `population` (opt, target crash, first command `echo "→ advance-be-k2l04-crash"`: `INFO memory` used_memory, `DEBUG POPULATE 1000000 k2l04:pop`, `DBSIZE`, used_memory, `FLUSHDB` is banned so cleanup is `docker restart advance-be-k2l04-crash` — `--save ""` empties it).
  2. `01-cluster.redis` (`#@ ct advance-be-k2l04-cluster`): `keyslot` (`CLUSTER INFO`, `CLUSTER KEYSLOT` for `k2l04:user:{34}:cart`, `k2l04:user:{34}:lock`, `k2l04:{a}{b}`, `k2l04:{a}`, `k2l04:{}x`, `k2l04:a`, `k2l04:b`); `crossslot` (`SADD` a/b; `SINTER k2l04:a k2l04:b`; `SADD k2l04:{s}:a`/`{s}:b`; `SINTER`).
  3. `01-cluster.sh` region `spread`: `seq 1 10000 | awk '{print "CLUSTER KEYSLOT k2l04:post:"$1}' | docker exec -i advance-be-k2l04-cluster redis-cli | awk '{s=$1+0; if(s<=5460)a++; else if(s<=10922)b++; else c++} END{print "node1="a" node2="b" node3="c}'` (slot ranges of a 3-master cluster).
  4. `kiem-chung` region in `01-cluster.redis` (`CLUSTER KEYSLOT` repeats, `SMEMBERS`).
- Success criteria: no Lua in `01-*`; `bash 00-containers.sh up cluster` then up crash before recording.
- Verify: `node verify/verify-guide.mjs --lint` → `✔ không có lỗi`.

**T3.3 Stage 2 labs (Lua is taught here)**
- Goal: slide 33 race, WATCH abort, first Lua.
- Target files: `$L/02-race.A.redis`, `$L/02-race.B.redis`, `$L/02-lua.sh`, `$L/lua/cap-incr.lua`.
- Steps:
  1. `02-race.A.redis` region `lost-watch-reset` (`UNLINK k2l04:stock:tra-sua k2l04:barrier:race`, `SET k2l04:stock:tra-sua 10`); region `lost-watch` (A: `RPUSH k2l04:barrier:race go`, `GET`, `#@ sleep 0.5`, `SET k2l04:stock:tra-sua 9`, `#@ sleep 0.5`, `GET`; then phase 2: `WATCH k2l04:stock:tra-sua`, `GET`, `MULTI`, `DECR`, `#@ sleep 0.5`, `EXEC`, `GET`). B mirrors with `BLPOP k2l04:barrier:race 5` first and offsets so B's `SET`/`EXEC` land after A's. Before phase 2 A resets to 10 with `SET`.
  2. `cap-incr.lua`: KEYS[1] counter, ARGV[1] cap; returns `{1, n}` after INCR if below cap else `{0, n}`; PEXPIRE ARGV[2] ms.
  3. `02-lua.sh` regions `intro` (`EVAL "return redis.call('INCR', KEYS[1])" 1 k2l04:lua:n` via `docker exec … redis-cli`; 4× `MSYS_NO_PATHCONV=1 docker exec advance-be-k2l04-redis redis-cli --eval /lab/lua/cap-incr.lua k2l04:lua:cap , 3 60000 | paste -sd' ' -`) and `evalsha` (`SHA=$(docker exec advance-be-k2l04-redis sh -c 'redis-cli -x SCRIPT LOAD < /lab/lua/cap-incr.lua')`, `EVALSHA $SHA 1 k2l04:lua:cap2 3 60000`, the same via `--eval`, `SCRIPT EXISTS $SHA`).
- Success criteria: R10–R12 rows GREEN after recording.
- Verify: after T3.6, `node verify/verify-guide.mjs --runs --rows R10,R11,R12` → `✔ không có lỗi`.

**T3.4 Stage 3 labs (rate limiting: windows)**
- Goal: fixed window bug/fix/live, sliding log, sliding counter, shared replay.
- Target files: `$L/03-ratelimit.redis`, `$L/03-ratelimit.sh`, `$L/lua/rl-sliding-log.lua`, `$L/lua/rl-swc.lua`.
- Steps:
  1. `03-ratelimit.redis`: `fw-bug` (`UNLINK k2l04:rl:bug`, `INCR`, `TTL`, 5× `INCR`, `TTL`; comment: "app chết giữa INCR và EXPIRE"); `fw-fix` (`UNLINK`, `SET k2l04:rl:fix 0 EX 60 NX`, `INCR`, `TTL`, repeat).
  2. Lua per contract §6 (ARGV[1] `now_ms`, `≤ 0` → `TIME`): `rl-sliding-log.lua` (ZREMRANGEBYSCORE ≤ now−window, ZCARD, ZADD `now` member `now-seq`, PEXPIRE; returns `{ok, count}`); `rl-swc.lua` (keys `…:<win>` prev/cur, `est = prev × (1 − elapsed/window) + cur`, allow if `est < limit` then INCR cur; returns `{ok, est×100 floored}`).
  3. `03-ratelimit.sh` regions, each starting with `UNLINK` of its keys and printing one per-request line `ts=<ms> ok=<0|1> v=<n>` then the contract §5 summary lines via awk over the segment of `ts`: `replay-fw` (`awk -F'\t' '{print "INCR k2l04:rl:fw:" int($1/10000)}' "$L/data/traffic.tsv" | docker exec -i advance-be-k2l04-redis redis-cli` paired back with `paste` to traffic; ok = count ≤ 5); `replay-log` and `replay-swc` (`docker exec -i advance-be-k2l04-redis sh -c 'while read ts c; do redis-cli --eval /lab/lua/rl-sliding-log.lua k2l04:rl:log:$c , $ts 10000 5 | paste -sd" " -; done' < "$L/data/traffic.tsv"`); `log-memory` (100 then 1000 `ZADD k2l04:rl:logmem` via `seq | awk`, `OBJECT ENCODING`, `MEMORY USAGE`); `fw-live` (one `sh -c` inside main: `SET … 0 EX 10 NX`, loop `INCR` 5×, wait while `PTTL` > 0 polling every 50 ms, `INCR` 5×, print `span_ms` from `redis-cli TIME`); `log-live` (opt, `now_ms 0`, 10 calls ≤ 1 s apart, `live_allowed=5 live_denied=5`).
  4. `kiem-chung` in `03-ratelimit.redis`: `TTL k2l04:rl:fix`, `ZCARD k2l04:rl:log:a`, `EXISTS k2l04:rl:bug`.
- Success criteria: replay output equals the oracle.
- Verify: after T3.6, `for r in fw log swc; do node verify/oracle.mjs --compare runs/03-ratelimit.replay-$r.txt; done` → three lines `✔ 38/38 quyết định khớp`.

**T3.5 Stage 4 labs (buckets, batch, contract)**
- Goal: leaky bucket, token bucket (continuous and interval), race, batch RTT, over-admission, 429, failure path.
- Target files: `$L/04-buckets.sh`, `$L/04-leaky.A.sh`, `$L/04-leaky.B.sh`, `$L/04-tb-race.A.sh`, `$L/04-tb-race.B.sh`, `$L/lua/rl-leaky.lua`, `$L/lua/rl-token-bucket.lua`.
- Steps:
  1. `rl-token-bucket.lua`: KEYS[1] Hash `tokens`,`ts`; ARGV `now_ms, cap, refill_ms, cost, mode` (`cont` = tokens += elapsed/refill_ms; `int` = whole windows of `refill_ms × cap` refill to cap); `elapsed = math.max(0, now − ts)`; returns `{ok, floor(tokens), retry_ms}`; PEXPIRE `cap × refill_ms × 2`. `rl-leaky.lua`: `mode=meter` (water level drains 1 per `leak_ms`, `{ok, level, delay_ms}`) and `mode=queue` (`LLEN < cap` → `RPUSH`, return position else 0).
  2. `04-buckets.sh` regions: `replay-lb`, `replay-tb`, `replay-tbi` (same loop form as T3.4 with ARGV `$ts 5 2000 1 cont|int`); `batch-rtt` (`SHA` load as T3.3; 3× `redis-benchmark -q -c 1 -n 20000 EVALSHA $SHA 1 k2l04:rl:tb:bench 0 1000000000 1 1` and 3× with cost `10`; comment: one connection, never across `docker exec`); `batch-overadmit` (cap 10 bucket, one instance takes a batch of 10 and serves 5 then dies vs single-token 5 calls; prints `batch_admitted=10 single_admitted=5`); `http-429` (10 calls at `ts=1000…1009`, awk maps `ok=1` → `HTTP/1.1 200 OK`, `ok=0` → `HTTP/1.1 429 Too Many Requests · Retry-After: <ceil(retry/1000)>`, ends `200=5 429=5`); `fail-mode` (`docker exec advance-be-k2l04-redis sh -c 'redis-cli -p 6390 PING; echo exit=$?'`).
  3. `04-leaky.A.sh` region `drain-reset` (UNLINK queue/barrier) and `drain` (A: `RPUSH k2l04:barrier:leaky go`, 8× `--eval rl-leaky.lua … , 0 5 400 queue`). `04-leaky.B.sh` `drain`: `BLPOP k2l04:barrier:leaky 5`, then a worker in one `sh -c`: 5× `BLPOP k2l04:rl:lq 3`, `sleep 0.4`.
  4. `04-tb-race.{A,B}.sh` region `naive-lua` (+ `naive-lua-reset`): naive = `HGET tokens`, `sleep 0.3`, `HSET tokens 0`, print `ALLOWED`; then Lua with a fresh 1-token bucket (`cap 1`, `refill_ms 2000`).
  5. `kiem-chung` region in `04-buckets.sh`: `HGETALL k2l04:rl:tb:a`, `PTTL k2l04:rl:tb:a`, `LLEN k2l04:rl:lq`.
- Success criteria: Lua only via `/lab/lua` files; every `--eval` line prefixed `MSYS_NO_PATHCONV=1` or inside `sh -c`.
- Verify: `node verify/verify-guide.mjs --lint` → `✔ không có lỗi`.

**T3.6 Record stages 1–4**
- Goal: runs written only by the runner.
- Target files: `verify/record-all.sh` functions `setup s1 s2 s3 s4`; `runs/*`.
- Steps: fill the functions in L06 style (`run`, `ab … --rep 3`); `setup` = `up main`, seed, `check.sh --out check.after-seed`, seed, `check.sh --out check.rerun`; `s1` brings up cluster and crash first. Run `bash verify/record-all.sh setup s1 s2 s3 s4`. On runner exit 3 (clock), wait 30 s and re-run that line, at most twice. If a row fails: fix the lab file when the lab is wrong; if Redis behaves otherwise, STOP (Failure Protocol) — a deviation is written only with kongming's approval, the run is kept, and the narrative/chip changes.
- Success criteria: rows R00–R38, D04, D11 and K01–K04 GREEN.
- Verify: `node verify/verify-guide.mjs --runs --rows R0,R1,R2,R3,D,K01,K02,K03,K04` → `✔ không có lỗi`; `for f in runs/0[34]-*.replay-*.txt; do node verify/oracle.mjs --compare "$f"; done | grep -c '38/38'` → `6`; `grep -L '^# đồng hồ redis/host' runs/0[1-4]-*.txt | wc -l` → `0`; `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| seed idempotent | identical bodies | `diff <(tail -n +2 runs/check.after-seed.txt) <(tail -n +2 runs/check.rerun.txt) && echo SAME` → `SAME` |
| replay = oracle | 6 × `38/38` | T3.6 |
| no Lua before stage 2 | lint GREEN; case aa RED | `bash verify/negative-tests.sh --labs-only` → `16/16 …` |
| L06 untouched | `rc=0`, `l06_k2l04_keys=0` | fingerprint compare |
| benchmark wrote only own keys | `0` | region `bench` last line |

## Risks and rollback
Clock steps can break live demos; replay rows do not depend on time. Rollback: `bash "$L/99-cleanup.sh"`, delete the lab files and `runs/0[1-4]-*`; `node verify/run-redis.mjs --register` is never used to bless a hand edit.

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

=== FILE: phase-04-stages-5-8-postgres-runs.md ===
---
phase: 4
title: "Stages 5–8 labs and runs, including the Postgres hot row"
status: pending
priority: P1
effort: 2.25h
dependencies: [3]
---

# Phase 04 — Stages 5–8 labs and runs

## Goal
Counters (Postgres vs Redis), unread broadcast, share data and practices recorded, with the schema gate, rerun gate, `check.sh` and fingerprint GREEN.

## Files to create/modify (owner: controller; serial)
`$L/`: `pg/00-setup.sql`, `pg/05-counters.sql`, `pg/99-cleanup.sql`, `pg/hot.pgb`, `pg/spread.pgb`, `05-counters.sh`, `05-pg.A.sh`, `05-pg.B.sh`, `06-unread.sh`, `07-share.A.redis`, `07-share.B.redis`, `07-tracking.A.sh`, `07-tracking.B.sh` (only if S6 = keep), `08-delay.A.sh`, `08-delay.B.sh`, `08-practices.sh`, `lua/mark-read.lua`, `lua/delay-claim.lua`, `lua/bloom.lua`. Plan folder: `verify/record-all.sh` (`s5–s8`, `gates`), `runs/*`.

## Tasks

**T4.1 Postgres schema (learner runs it in DBX)**
- Goal: everything relational lives in `k2l04_counter`.
- Target files: `$L/pg/00-setup.sql`, `$L/pg/05-counters.sql`, `$L/pg/99-cleanup.sql`.
- Steps: `00-setup.sql`: `CREATE SCHEMA IF NOT EXISTS k2l04_counter;` tables `k2l04_counter.post_count(post_id int PRIMARY KEY, like_count bigint NOT NULL DEFAULT 0)` with rows 1–1000, `k2l04_counter.flush_log(at timestamptz DEFAULT now(), delta bigint)`; idempotent (`ON CONFLICT DO NOTHING`). `05-counters.sql` regions `reset` (`UPDATE k2l04_counter.post_count SET like_count = 0;` `TRUNCATE k2l04_counter.flush_log;`), `read` (slide-20 SELECT), `kiem-chung` (`SELECT like_count FROM k2l04_counter.post_count WHERE post_id = 1`, `SELECT sum(like_count)`). `99-cleanup.sql` = `DROP SCHEMA IF EXISTS k2l04_counter CASCADE;` (learner only). Controller applies `00-setup.sql` with `node verify/run-redis.mjs "$L/pg/00-setup.sql" --out pg-setup`.
- Success criteria: only `k2l04_counter` added.
- Verify: `bash verify/fingerprint.sh | grep -E '^pg_(schemas_sha|k2l04)='` → `pg_schemas_sha` equal to the baseline line and `pg_k2l04=present`.

**T4.2 Counter labs**
- Goal: slides 19–22 measured with bounded load.
- Target files: `$L/pg/hot.pgb`, `$L/pg/spread.pgb`, `$L/05-counters.sh`, `$L/05-pg.A.sh`, `$L/05-pg.B.sh`.
- Steps:
  1. `hot.pgb`: `UPDATE k2l04_counter.post_count SET like_count = like_count + 1 WHERE post_id = 1;`. `spread.pgb`: `\set id random(1, 1000)` + the same UPDATE with `:id`.
  2. `05-counters.sh` regions, each pgbench line in S8's form, e.g. `MSYS_NO_PATHCONV=1 docker exec -i quan-ly-hop-dong-postgres-1 pgbench -n -c 8 -j 2 -T 5 -f /dev/stdin -U postgres advance_be_lab < "$L/pg/hot.pgb"`: `pg-hot` (3× reset + pgbench + `SELECT like_count`), `pg-spread` (`--random-seed=42`, `SELECT sum`), `pg-hot-async` (opt, `PGOPTIONS='-c synchronous_commit=off'` via `docker exec -e`), `pg-bloat` (opt, `SELECT n_tup_upd, n_tup_hot_upd, n_dead_tup FROM pg_stat_user_tables WHERE schemaname = 'k2l04_counter'`), `redis-incr` (3× `UNLINK`, `redis-benchmark -q -c 8 -n 100000 INCR k2l04:cnt:post:1:like`, `GET`), `redis-hincr` (same with `HINCRBY k2l04:cnt:post:1 like 1`, `HGET`), `flush-race` (background `redis-benchmark -c 4 -n 200000 INCR k2l04:cnt:fr` while an in-container loop flushes 50× either `GET`+`SET 0` or `GETDEL`, summing flushed; prints `naive: sent=200000 flushed=<f> left=<r> lost=<n>` then the `getdel:` line), `wb-loss` (target crash, first line `echo "→ advance-be-k2l04-crash"`: 1000 `INCR`, flush `GETDEL` into `UPDATE k2l04_counter.post_count SET like_count = like_count + <d> WHERE post_id = 1`, 500 more `INCR`, `docker kill advance-be-k2l04-crash`, `docker start`, flush adds 0, final SELECT), `mem-layouts` (1000 posts × 4 Strings, 1000 Hashes × 4 fields, 10 bucket Hashes of 100 posts × 4 fields (`postid:field`), 5 of 200; `OBJECT ENCODING` sample, total `MEMORY USAGE` per layout via awk; `CONFIG GET hash-max-listpack-entries`).
  3. `05-pg.A.sh` region `locks` (reset + hot pgbench `-T 5`); `05-pg.B.sh` (`BLPOP` barrier is Redis-side: B waits on `k2l04:barrier:pg` on main, A pushes it, then B samples 4× every 1 s `SELECT wait_event_type||'|'||wait_event, count(*) FROM pg_stat_activity WHERE application_name = 'pgbench' AND wait_event IS NOT NULL GROUP BY 1`).
- Success criteria: pgbench always `-n -f`, `-c ≤ 8`, `-T ≤ 5`.
- Verify: `node verify/verify-guide.mjs --lint` → `✔ không có lỗi`.

**T4.3 Unread broadcast and share data labs**
- Goal: slides 23–30.
- Target files: `$L/06-unread.sh`, `$L/lua/mark-read.lua`, `$L/07-share.A.redis`, `$L/07-share.B.redis`, `$L/07-tracking.{A,B}.sh`.
- Steps:
  1. `06-unread.sh`: `fanout-10k`/`fanout-100k` (`CONFIG RESETSTAT` is banned, so read `INFO commandstats` `cmdstat_hincrby` before/after; `seq 1 N | awk '{print "HINCRBY k2l04:unread:fan u"$1" 1"}' | docker exec -i advance-be-k2l04-redis redis-cli --pipe`; print `calls=<Δcalls> usec=<Δusec>`, `MEMORY USAGE`); `pointer` (`SET k2l04:bc:latest 0`, 6× `INCR`, `HSET k2l04:bc:read u1 4`, `echo unread=$((latest - read))`; `ZADD k2l04:bc:feed` 1..6 + `ZCOUNT k2l04:bc:feed (4 +inf`); `mark-read` (plain `HSET` 6 then 4 → `unread=2`; `mark-read.lua` sets `max(old,new)` → `unread=0`); `zset-gt` (opt).
  2. `07-share.A.redis` regions `poll-blpop-reset` and `poll-blpop` (A: `RPUSH` barrier; 20× `GET k2l04:pool:m1` with `#@ sleep 0.05`; then `BLPOP k2l04:reply:m2 5`); `07-share.B.redis` (`BLPOP` barrier, `#@ sleep 0.3`, `SET k2l04:pool:m1 '{"ok":true}' EX 30`, `#@ sleep 0.6`, `RPUSH k2l04:reply:m2 '{"ok":true}'`).
  3. Only if S6 = keep: `07-tracking.{A,B}.sh` region `tracking` from the S6 smoke form.
- Success criteria: R50–R62 rows GREEN.
- Verify: after T4.5, `node verify/verify-guide.mjs --runs --rows R5,R6` → `✔ không có lỗi`.

**T4.4 Practices labs**
- Goal: slides 34–37 including the hand-built Bloom filter.
- Target files: `$L/08-delay.A.sh`, `$L/08-delay.B.sh`, `$L/08-practices.sh`, `$L/lua/delay-claim.lua`, `$L/lua/bloom.lua`.
- Steps:
  1. `delay-claim.lua`: copy L06's, keys renamed by caller; `now` from ARGV, `≤ 0` → `TIME`. `08-delay.{A,B}.sh` region `naive-lua` (+reset: `o1` at 1704790435, `o2`/`o3` at 4102444800): naive `ZRANGE … BYSCORE LIMIT 0 1`, `sleep 0.3`, `RPUSH done`, `ZREM`; reset again; Lua claim both sides; `LRANGE`, `ZRANGE`.
  2. `bloom.lua`: KEYS[1] bitmap; ARGV `op (add|check), m, k, item`; `h = redis.sha1hex(item)`; position i = `tonumber(string.sub(h, 8*i+1, 8*i+8), 16) % m` for i = 0..k−1; add = `SETBIT` all; check = 1 if all `GETBIT` = 1.
  3. `08-practices.sh` regions: `hll` (for N in 100 1000 10000 100000: `UNLINK`, `seq 1 N | awk '{printf "%s ip%d", (NR%1000==1?"\nPFADD k2l04:hll:n'N'":""), $1}'`-style batches of 1000 into one `redis-cli`, then `PFCOUNT`, `STRLEN`, `MEMORY USAGE`, `GETRANGE … 0 3`; awk prints `n=… pfcount=… strlen=… mem=… magic=…`); `hll-rerun` (same body, separate run for `same:`); `hll-merge` (opt, 7 days of 5000 ips with fixed overlaps, true union 26000); `bitmap` (`SETBIT k2l04:seg:fiction` for even book ids 0..99998, `adventure` for multiples of 3, `BITOP AND k2l04:seg:both`, `BITCOUNT`, `STRLEN`, `GETBIT … 42` on both, `SETBIT k2l04:seg:sparse 9999999 1`, `STRLEN`, `MEMORY USAGE`; a Set of the same 50000 ids for size); `bloom` (`UNLINK`; `seq 1 10000` add `user$i` through one in-container loop calling `redis-cli --eval /lab/lua/bloom.lua k2l04:bloom:users , add 50000 3 user$i`; check members → `members_found=<n> of 10000`; check `nobody1..10000` → `false_positives=<n>`; `BITCOUNT` → `bits=`; `STRLEN`; `SADD` Set of the 10000 names, `MEMORY USAGE` both); `bloom-rerun`.
- Success criteria: inputs only `seq`-generated.
- Verify: `grep -nE '\$RANDOM|shuf|urandom' "$L"/*.sh | wc -l` → `0`.

**T4.5 Record stages 5–8 and gates**
- Goal: full matrix GREEN.
- Target files: `verify/record-all.sh` (`s5 s6 s7 s8 gates`), `runs/*`.
- Steps: fill and run `bash verify/record-all.sh s5 s6 s7 s8 gates`; `gates` = `--lint`, `rerun-gate.mjs`, seed, `check.sh`, fingerprint compare. Same clock and deviation rule as T3.6.
- Success criteria: every row GREEN or kongming-approved deviation.
- Verify: `node verify/verify-guide.mjs --runs` → `✔ không có lỗi`; `node verify/rerun-gate.mjs | tail -1` → `N/N region/lần lặp chạy lại cho cùng kết quả ngữ nghĩa` with both N equal; `bash "$L/check.sh"; echo rc=$?` → last line `rc=0`; `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| schema list unchanged except `k2l04_counter` | `pg_schemas_sha` equal | T4.1 |
| HLL exact on fixed input | `pfcount=99655` | `grep -c 'n=100000 pfcount=99655 strlen=12304' runs/08-practices.hll.txt` → `1` |
| Bloom no false negatives | `members_found=10000 of 10000` | `grep -c 'members_found=10000 of 10000' runs/08-practices.bloom.txt` → `1` |
| statistical rerun identical | R71, R74 `same:` | `--runs --rows R71,R74` |
| bounded pgbench | lint cases u, v RED | `bash verify/negative-tests.sh --labs-only` |
| full matrix | GREEN | T4.5 |

## Risks and rollback
pgbench touches only `k2l04_counter.post_count` for ≤ 5 s with 8 clients; lock samples are read-only. The crash container is the only one killed. Rollback: learner runs `pg/99-cleanup.sql` in DBX; controller deletes stage 5–8 files and runs.

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
title: "Widget data, homework, source claims"
status: pending
priority: P1
effort: 0.75h
dependencies: [4]
---

# Phase 05 — Widget data, homework, source claims

## Goal
Every data file the fragments read, a homework with a passing solution and a failing bad fixture, and sourced claims for the drill and the Redis-source notes.

## Files to create/modify (owner: controller)
- Plan folder: `verify/make-widget-data.mjs`, `runs/data/w1.json`…`w6.json`, `runs/data/derived.json`, `verify/hw-solution.lua`, `runs/source-claims.txt`.
- `$L/`: `hw/my-token-bucket.lua` (50/50 scaffold), `drill/rate-limit.guard.ai-snippet.ts`.

## Tasks

**T5.1 Widget data from runs only**
- Goal: no hand-typed number.
- Target files: `verify/make-widget-data.mjs`, `runs/data/*`.
- Steps: implement the stub; each file has `sources`. `w1` per-request decisions of the six replay runs + their summaries; `w2` segment a/d `prev`, `cur`, `est` from `03-ratelimit.replay-swc` and log decisions; `w3` R31/R32 tokens per request, R35 req/s per cost, R36 counts; `w4` R71 rows and R74 counts with m, k, n; `w5` R50–R52 calls/usec/bytes; `w6` R06 key→slot pairs. `derived.json` entries `{name, value, formula, inputs, sources}`: medians of R01/R02/R45 (`median(a,b,c)`), log bytes/entry (R25), served/s per cost (`r×cost`) and ratio (R35), instances for 1M QPS (`1000000/m`), fan-out µs and bytes extrapolated to 10M (`x×10000000/100000`), Bloom theory `p = (1-exp(-k*n/m))^k`.
- Success criteria: `--data` GREEN.
- Verify: `node verify/make-widget-data.mjs && node verify/verify-guide.mjs --data` → `✔ không có lỗi`; `bash verify/negative-tests.sh --data-only | tail -1` → `1/1 ca đỏ đúng thiết kế · 0 SKIP · tổng 1 ca`.

**T5.2 Homework (FR-M2-05 shape, settled default)**
- Goal: Đạt writes the key decisions of a token bucket; `hw-check.sh` grades it.
- Target files: `$L/hw/my-token-bucket.lua`, `verify/hw-solution.lua`.
- Steps:
  1. Scaffold (Vietnamese comments, contract §6 signature `KEYS[1]`, ARGV `now_ms, cap, refill_ms`, return `{ok, remaining, retry_ms}`) with blanks `__1__` read state (`HMGET`), `__2__` default full bucket, `__3__` clamp `math.max(0, now - ts)`, `__4__` refill `math.min(cap, …)`, `__5__` retry `math.ceil((1 - tokens) * refill_ms)`, `__6__` PEXPIRE.
  2. `verify/hw-solution.lua`: the filled version (shown later in a `details.fold` of `#bai-tap`).
  3. Record: `HW_LUA="$P/verify/hw-solution.lua" node verify/run-redis.mjs "$L/hw-check.sh" --out hw-check.solution`; same with `verify/hw-bad-fixture.lua` → `--out hw-check.bad`.
- Success criteria: R80, R81 GREEN; the unfilled scaffold fails.
- Verify: `node verify/verify-guide.mjs --runs --rows R80,R81` → `✔ không có lỗi`; `bash "$L/hw-check.sh"; echo rc=$?` (default scaffold with blanks) → last line `rc=6`; `bash verify/negative-tests.sh --hw-only | tail -1` → `1/1 ca đỏ đúng thiết kế · 0 SKIP · tổng 1 ca`; `docker exec advance-be-k2l04-redis redis-cli --scan --pattern 'k2l04:hw:*' | wc -l` after `bash "$L/hw-check.sh" --cleanup` → `0`.

**T5.3 Drill snippet and source claims (optional drill O7)**
- Goal: a small NestJS guard review with sourced claims.
- Target files: `$L/drill/rate-limit.guard.ai-snippet.ts`, `runs/source-claims.txt`.
- Steps: ≈60-line `CanActivate` guard using node-redis with seeded mistakes: `INCR` then `EXPIRE` in two calls; in-memory `Map` counter; fixed window for `/auth/login`; 429 without `Retry-After`; `KEYS rl:*` in a request path; unhandled Redis error (no deliberate fail-open/closed). One correct decoy: `SET key 0 EX 60 NX` (`set(key,'0',{EX:60,NX:true})`). No `package.json` (read-only drill). `source-claims.txt`: one block per claim with URL, version, quoted line: node-redis `set` options, `eval`/`evalSha`, `on('error')` (unpkg `@redis/client` of the version pinned in `labs/lesson-06-redis/package-lock.json`); Redis 7.2.3 `src/pubsub.c` (`listSearchKey`), `src/config.c` (`maxclients` 10000, `hash-max-listpack-entries` 512); RFC 9110 §10.2.3 `Retry-After`; NestJS `ThrottlerGuard` docs. Then `node verify/run-redis.mjs --register runs/source-claims.txt`.
- Success criteria: every claim has URL + version + quote.
- Verify: `grep -c '^https://' runs/source-claims.txt` ≥ `grep -c '^claim:' runs/source-claims.txt` (print both; first ≥ second); `node verify/verify-guide.mjs --lint` → `✔ không có lỗi`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| widget data traced | GREEN | T5.1 |
| fake number in w1 | RED (case ad) | `--data-only` |
| solution | ✔ H1–H6 | R80 |
| bad fixture fails | ✘ H2, H3, H5 | R81, case ai |
| scaffold unfilled | `rc=6` | T5.2 |

## Risks and rollback
If the scaffold blanks make the file un-loadable, `hw-check.sh` must still print six ✘ rows (SCRIPT LOAD error counted per row). Rollback: delete the files listed above.

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
title: "Guide shell and assembler"
status: pending
priority: P1
effort: 1.0h
dependencies: [2]
---

# Phase 06 — Guide shell and assembler

## Goal
A shell that builds with stub stages and already passes the page-level checks. May run in parallel with phases 03–05 (owner: controller or delegate D0; owns only `assembly/` shell files).

## Files to create/modify
`$P/assembly/`: `shell-css.part`, `shell-head.html`, `shell-tail.html`, `assemble.mjs` (copied from `$L06P/assembly/`), output `$G`.

## Tasks

**T6.1 Copy and retarget**
- Goal: L06 shell, K2L04 names.
- Target files: the four shell files.
- Steps: copy; `assemble.mjs`: `LABS = labs/k2-lesson-04-caching`, `OUT = $G`, `STAGES = 8`, `WIDGETS = 6`, `.sql` handled by `lab-text.mjs`, `<!--@RUN id@-->` header strip includes `# đồng hồ`. Title "Sổ tay Caching · K2 Bài 04"; storage `k2l04-theme`, `k2l04-warmup`; chip class map unchanged; keep `esc()`, `el()`, `store` try/catch, `GUIDE_DATA_START/END`, theme toggle, no rail.
- Success criteria: no `l06-`, `Redis · Bài 06` or `6_Redis` strings left.
- Verify: `grep -cE "l06-|Bài 06 · Redis|6_Redis|lesson-06" assembly/shell-*.html assembly/shell-css.part assembly/assemble.mjs | awk -F: '{s+=$2} END{print s}'` → `0`.

**T6.2 Hero, `#cach-hoc`, shell sections, SLIDES**
- Goal: page frame with honest setup instructions.
- Target files: `assembly/shell-head.html`, `assembly/shell-tail.html`.
- Steps: hero "K2 Bài 04 · Caching — đo trên máy bạn" with the stage-map time table (core 300, optional list in the priority order). `#cach-hoc`: glossary first (`docker exec`, `redis-cli`, `--eval`, `DBX`, `psql`, `pgbench`, `MSYS_NO_PATHCONV`), prep (`bash labs/k2-lesson-04-caching/00-containers.sh up main`, seed, `check.sh`), "Bài 06 (`advance-be-redis`, 6379) có thể đang bật hay tắt; bài này không dùng nó", DBX `ADVANCE_BE_K2L04_REDIS` and `ADVANCE_BE_LAB`, `pg/00-setup.sql` in DBX, `127.0.0.1` not `localhost`, two-terminal barrier order, slides 1–2 figure. Placeholder sections `#tong-ket`, `#bai-tap`, `#drill`, `#phong-van`, `#cheat-sheet`, `#ban-do-slide` (generated from SLIDES), `#tham-khao`, `#tiep-theo` (filled in T7.4). `SLIDES` = 39 entries from contract §10, `href` `#sl-NN` for PART slides. Images: `../../Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/assets/04_Caching/page_NN_img_MM.*`, `loading="lazy"`, never base64.
- Success criteria: stub build passes page checks.
- Verify: `node assembly/assemble.mjs --allow-stubs` → line starting `✔ đã ghi`; `node verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15,V22` → `✔ không có lỗi`; `bash verify/negative-tests.sh --guide-only | tail -1` → `pass` equals `ran` (cases needing fragments print SKIP).

## Test matrix
| Test | Expected | Command |
|---|---|---|
| stub build | `✔ đã ghi` | T6.2 |
| page checks | GREEN | T6.2 |
| render smoke | 0 errors | `TMP="$P/verify/tmp" TEMP="$P/verify/tmp" node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "$G" --out "$P/verify/render-stub"` → contains `Summary: 0 errors` |

## Risks and rollback
Stale L06 strings are caught by T6.1's grep and V09. Rollback: delete `assembly/` shell files and `$G`.

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
title: "Stage fragments, widgets and wrap sections"
status: pending
priority: P1
effort: 2.0h
dependencies: [5, 6]
---

# Phase 07 — Stage fragments (3 delegates + controller)

## Goal
Eight verified stage fragments with quizzes and six widgets written in parallel against the frozen contract, plus the wrap sections by the controller.

## Files to create/modify (disjoint ownership)
`$P/assembly/`:
- D1: `fragments/stage-01..03.html`, `stage-01..03.quiz.json`, `widgets/w2.js`, `widgets/w6.js`
- D2: `fragments/stage-04..05.html`, `stage-04..05.quiz.json`, `widgets/w1.js`, `widgets/w3.js`
- D3: `fragments/stage-06..08.html`, `stage-06..08.quiz.json`, `widgets/w4.js`, `widgets/w5.js`
- Controller: `shell-tail.html` wrap sections and `EXAM`.
Delegates read `contract.md`, `plan.md`, `runs/`, `runs/data/`, `$L`; they never edit labs, runs, shell or contract. Each delegate brief carries: task, files to read, files it may write, acceptance criteria (its `--fragment` commands), the frozen contract version, and the status block `Status / Summary / Concerns`.

## Fragment format (frozen, L06 phase-06 format plus)
`section#chang-N.stage.col` → `stage-head` → `p.goal` → `dl.wwh` → `dl.glossary` (every new command in plain Vietnamese, before any code) → `.story` (F&B / OmniPOS) → figure (slide image) and/or inline SVG with token colours → `table.stats` "Đo trên máy bạn ngày …" with `b.m[data-run]`/`b.m[data-derived]` → `.check30` → per slide `.sayvs` with chip (PART: `id="sl-NN"`; design-only notes "chưa đo trực tiếp") → `callout teacher` "Làm mẫu" → `kiem-chung` (`pre[data-cmd="<file>#kiem-chung"]` + `table.expect`) → `callout challenge#chang-N-tu-lam` (task, PASS criteria, self-check plain commands, answer in `details.fold`) → `.quiz[data-quiz=N]`. Two-client steps use `table.walk` (reset → B waits → A) and the recorded timeline. Back-links "đã gặp ở L06 chặng N" allowed.

## Tasks

**T7.1 D1 — stages 1–3, W2, W6**
- Goal: fundamentals, tools, windows.
- Target files: D1 files.
- Steps: stage 1 slide-7 table (slide number vs median, "phụ thuộc máy"), `maxclients` 10000 vs "60K", UNSUBSCRIBE note "đọc mã nguồn 7.2.3", slide 10 map to stages; W6 CRC16-XMODEM slot calculator with hashtag rules (`#w6-key`, `#w6-slot`). Stage 2 lost update → WATCH abort → first Lua; challenge: write `my-cap.lua` capping 2. Stage 3 bug/fix, boundary burst from replay seg a (10 vs 5), log vs counter seg a/d; W2 slide-14 estimator replaying `w2` (shows `5 × 0.7 + 3 = 6.5` from the slide and the recorded segment values); challenge: run `replay-swc` with limit 6 and predict seg a.
- Success criteria: every number from runs.
- Verify: `for n in 1 2 3; do node verify/verify-guide.mjs --fragment assembly/fragments/stage-0$n.html || echo BAD$n; done | grep -c BAD` → `0`; `node --check assembly/widgets/w2.js && node --check assembly/widgets/w6.js && echo OK` → `OK`.

**T7.2 D2 — stages 4–5, W1, W3**
- Goal: buckets, batch, contract, counters.
- Target files: D2 files.
- Steps: stage 4 leaky queue timeline, slide-16 interval = boundary burst (R32), "not just the number" (`HLEN` 2), race, batch RTT and over-admission, 429 + `Retry-After`, `fail-mode` error line with an ADR-010 decision table (fail-open vs fail-closed per endpoint, Đạt chooses), comparison table (allowed/denied, memory, accuracy) from `w1`. W1 replay lanes: one row per algorithm over the 38 requests, segment filter. W3 bucket with batch-size slider replaying `w3`. Stage 5 PG hot vs spread tps, lock snapshot, Redis INCR exact 100000, flush race, write-behind loss, memory layouts, Pika/auto-tiering "chưa đo trực tiếp". Challenges: token bucket for `store:9` cap 3 (PASS 3 allowed / 2 denied); pgbench spread with 100 rows in DBX-reset table.
- Success criteria: as T7.1.
- Verify: `for n in 4 5; do node verify/verify-guide.mjs --fragment assembly/fragments/stage-0$n.html || echo BAD$n; done | grep -c BAD` → `0`; `node --check assembly/widgets/w1.js && node --check assembly/widgets/w3.js && echo OK` → `OK`.

**T7.3 D3 — stages 6–8, W4, W5**
- Goal: unread, share data, practices.
- Target files: D3 files.
- Steps: stage 6 fan-out 10k/100k, pointer O(1), mark-read atomic max, 10M extrapolation labelled "ngoại suy, chưa đo trực tiếp"; W5 cost model from `w5`. Stage 7 polling count vs `BLPOP` latency timeline, Hazelcast design, `CLIENT TRACKING` (run or design per S6). Stage 8 delay naive vs Lua, HLL table + 0.81 % formula, Bitmap sparse pitfall, Bloom formula `(1 − e^{−kn/m})^k` vs measured with 3σ band and 0 false negatives; W4 calculator (m, k, n) with the recorded point marked. Challenges: delay claim for 3 jobs; Bloom with k = 4 predicted then run.
- Success criteria: as T7.1.
- Verify: `for n in 6 7 8; do node verify/verify-guide.mjs --fragment assembly/fragments/stage-0$n.html || echo BAD$n; done | grep -c BAD` → `0`; `node --check assembly/widgets/w4.js && node --check assembly/widgets/w5.js && echo OK` → `OK`.

**T7.4 Controller — wrap sections**
- Goal: recap, homework, drill, interview, cheat sheet, references, bridge.
- Target files: `assembly/shell-tail.html`.
- Steps: `#tong-ket` slide 31 (D31 corrections) and slides 38–39; `#bai-tap` slide 32: scaffold via `<!--@CMD hw/my-token-bucket.lua@-->`, `hw-check.sh` H1–H6 meaning, recorded `hw-check.solution`, answer fold `verify/hw-solution.lua` text, reading pointer "network I/O models" (select/poll/epoll, link L06 chặng 1); `#drill` (O7) snippet + 6 mistakes + decoy, answers linked to `source-claims`; `#phong-van` EXAM 10 Q&A citing run ids; `#cheat-sheet` commands, complexity, algorithm comparison; `#tham-khao` slide-38 Pika link + redis.io rate-limit/HLL/bitmap pages, RFC 9110; `#tiep-theo` OmniPOS M2 FR-M2-05 (token bucket per `storeId`, why, batch trade-off, `Retry-After`, NFR-10 env limits, hub Redis 6380 described only), ADR-010 fail-open/closed, Boss Challenge 2.3 on `quan-ly-hop-dong`, then K2 Bài 05 Communication.
- Success criteria: full build without stubs.
- Verify: `node assembly/assemble.mjs` → `✔ đã ghi … 8 quiz, 6 widget, 6 JSON`; `node verify/widget-smoke.mjs --guide "$G"` → `✔ không có exception, widget có nội dung`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment checks ×8 | 0 BAD | T7.1–T7.3 |
| widget syntax ×6 | OK | `node --check` |
| W6 vs recorded slots, W1 summaries | ✔ | widget-smoke |
| glossary before code, no early Lua | V23, V24 GREEN | `node verify/verify-guide.mjs --only V23,V24` |

## Risks and rollback
Invented numbers fail V07/V16; reworded code fails V05. Rollback: delete that delegate's files and re-brief.

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
`$G` (generated); `$P/runs/verify-full.txt` (registered); `$P/verify/render/`, `$P/verify/render-dark/`.

## Tasks

**T8.1 Full verification**
- Goal: all codes GREEN on the real build.
- Target files: `$G`, `runs/verify-full.txt`.
- Steps: `node assembly/assemble.mjs`; run the verifier in guide, `--runs`, `--data`, `--lint` modes, write the four outputs to `runs/verify-full.txt`, `node verify/run-redis.mjs --register runs/verify-full.txt`. Fix fragments or shell only, never runs.
- Success criteria: four `✔ không có lỗi` lines.
- Verify: `grep -c '✔ không có lỗi' runs/verify-full.txt` → `4`; `stat -c %s "$G"` → ≤ `532480`; `grep -c 'data:image' "$G"` → `0`.

**T8.2 Negative tests and widgets**
- Goal: every planted fault is caught.
- Target files: none (temp copies under `verify/tmp/neg/`).
- Steps: `bash verify/negative-tests.sh`; `node verify/widget-smoke.mjs --guide "$G"`.
- Success criteria: 0 SKIP.
- Verify: `bash verify/negative-tests.sh | tail -1` → `35/35 ca đỏ đúng thiết kế · 0 SKIP · tổng 35 ca`; widget-smoke → `✔ không có exception, widget có nội dung`.

**T8.3 Render light and dark**
- Goal: no overflow or runtime errors at 375/768/1440.
- Target files: `verify/render/`, `verify/render-dark/`.
- Steps: `TMP="$P/verify/tmp" TEMP="$P/verify/tmp" node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "$G" --out "$P/verify/render"`; dark: copy `$G` next to itself as `.k2l04-dark.html` with `<html data-theme="dark"`, render to `verify/render-dark`, delete the copy. Inspect the 375 px screenshot for horizontal scroll.
- Success criteria: both summaries clean.
- Verify: each run prints `Summary: 0 errors, 0 warnings.`; `ls "$(dirname "$G")"/.k2l04-dark.html 2>/dev/null | wc -l` → `0`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| verifier ×4 modes | 4 GREEN | T8.1 |
| negatives | 35/35, 0 SKIP | T8.2 |
| size, images | ≤ 520 KB, no base64 | T8.1 |
| render light/dark | 0 errors, 0 warnings | T8.3 |

## Risks and rollback
Wide terminal output overflows at 375 px: `pre` scrolls inside its box, tables in `.table-wrap`. Rollback: regenerate from fragments.

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
title: "/ak:code-review --pending --ultra --advice and fixes"
status: pending
priority: P1
effort: 1.25h
dependencies: [8]
---

# Phase 09 — Ultra code review and fixes

## Goal
Five independent reviewers plus a verifier; every validated Critical/Important finding fixed and the affected checks re-run.

## Files to create/modify
- `$P/reports/code-review-ultra-reviewer-1..5.md`, `code-review-ultra-verdict.md` (written by the review skill), `code-review-ultra-fix-status.md` (controller).
- Fix targets: any phase 03–07 file (controller only).

## Tasks

**T9.1 Run the review**
- Goal: independent findings over the pending changes.
- Target files: review reports.
- Steps: invoke `/ak:code-review --pending --ultra --advice` with scope `$G`, `$L/**`, `$P/verify/**`, `$P/assembly/**`, `runs/` (read-only), `expected.tsv`, `deviations.md`. Brief: rate-limit and counter correctness per slide (boundary burst, atomic expiry, swc formula `prev × 0.7 + cur`, token continuous vs interval, batch over-admission, PG hot row, HLL 0.81 %, Bloom formula, WATCH abort, `maxclients` 10000, `hash-max-listpack-entries` 512); safety (only `advance-be-k2l04-*`, no `advance-be-redis`, no 6380, loopback 6381, `k2l04_counter` only, bounded pgbench, no secrets); trace integrity; Vietnamese teaching format and glossary-first; mobile/a11y.
- Success criteria: verdict file lists validated findings with severity.
- Verify: `ls reports/code-review-ultra-verdict.md` → path printed.

**T9.2 Fix and re-check**
- Goal: no open Critical/Important.
- Target files: `reports/code-review-ultra-fix-status.md` and fixed files.
- Steps: one row per finding `id | severity | fix | re-run | FIXED|REJECTED (source)`. A changed lab region is re-recorded through `run-redis.mjs` (replaces its manifest line). A finding that questions a verified measurement is rejected only with its source cited. Then re-run all phase-08 checks and `check.sh`.
- Success criteria: phase-08 matrix GREEN again.
- Verify: `grep -cE '\| (Critical|Important) \|.*\| OPEN' reports/code-review-ultra-fix-status.md` → `0`; `bash verify/negative-tests.sh | tail -1` → `35/35 … 0 SKIP …`; `bash "$L/check.sh"; echo rc=$?` → `rc=0`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| open findings | 0 | T9.2 grep |
| regression | phase-08 matrix GREEN | phase 08 commands |
| `/ak:test` needed? | only if review finds a TDD gap; record the decision in fix-status | `grep -c '^ak:test' reports/code-review-ultra-fix-status.md` → `1` |

## Risks and rollback
A fix can drift a run: the manifest (M01) and `--runs` catch it. Rollback per fix: revert the file, re-run the region, reassemble.

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
Make the guide discoverable, prove nothing outside scope changed, and leave the lab ready for Đạt.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/README.md` line 14 (lab list: add `` `labs/k2-lesson-04-caching/` (redis-cli + DBX SQL) ``), line 29 (append `` — `k2_lesson_04_caching_teacher_guide.html` ``), tree under `Khóa 3…/` in `reports/` and `labs/` (add the guide and `k2-lesson-04-caching/`).
- `D:/study/advance-be/reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md` line 419 and `.html` line 1806: original `Slide 39 trang kèm so sánh ưu nhược điểm 5 thuật toán Rate Limiting.` → append `` · Guide: `reports/Khóa 3…/k2_lesson_04_caching_teacher_guide.html`, labs `labs/k2-lesson-04-caching/` ``.
- `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html` line 4532 and `$L06P/assembly/shell-tail.html` line 219: wrap "K2 Bài 04 Rate Limiting" in `<a href="../Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html">…</a>`. One-line edit each; skip a file whose line differs and log it.
- `D:/study/advance-be/plans/handoffs/k2-lesson-04-caching-guide-ready-20261103.md`.
- `$P/runs/00-fingerprint-after.txt`, `$P/runs/final-gate.txt`.

## Tasks

**T10.1 Doc edits**
- Goal: four routes to the guide.
- Target files: listed above.
- Steps: read each file; apply the one-line edits; run the L06 verifier regression.
- Success criteria: links resolve, L06 checks unchanged.
- Verify: `grep -c 'k2_lesson_04_caching_teacher_guide.html' D:/study/advance-be/README.md D:/study/advance-be/reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md D:/study/advance-be/reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.html D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html "$L06P/assembly/shell-tail.html"` → every count ≥ 1; `node "$L06P/verify/verify-guide.mjs" --only V01,V02,V03,V10` → `✔ không có lỗi`.

**T10.2 Leave the lab ready and fingerprint**
- Goal: only K2L04 main left up, seeded.
- Target files: `runs/00-fingerprint-after.txt`, `runs/final-gate.txt`.
- Steps: `bash "$L/00-containers.sh" down cluster`; `down crash`; `reset main`; do not run `99-cleanup.sh`. `bash verify/fingerprint.sh > runs/00-fingerprint-after.txt`; compare. Write `runs/final-gate.txt` rows (verifier ×4, negatives, widget-smoke, render light/dark, `check.sh`, fingerprint, L06 regression, size, `git status --short`), register both files.
- Success criteria: every row ✔.
- Verify: `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt; echo rc=$?` → `rc=0`; `bash "$L/check.sh"; echo rc=$?` → `✔ C01`, `– C02`, `– C03`, `rc=0`; `grep -c '✘' runs/final-gate.txt` → `0`; `git -C D:/study/advance-be status --short` lists only paths under `plans/261102-1332-k2-lesson-04-caching-teacher-guide/`, `labs/k2-lesson-04-caching/`, `reports/Khóa 3. …/k2_lesson_04_caching_teacher_guide.html`, `README.md`, `reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.{md,html}`, `reports/advanced_backend/lesson_06_redis_teacher_guide.html`, `plans/261031-1651-lesson-06-redis-teacher-guide/assembly/shell-tail.html`, `plans/handoffs/k2-lesson-04-caching-guide-ready-20261103.md`, plus pre-existing untracked `.claude/` dirs.

**T10.3 Handoff**
- Goal: resume note for Đạt and the next session.
- Target files: the handoff file.
- Steps: cover what exists; how to start (`00-containers.sh up main`, seed, `check.sh`, DBX `ADVANCE_BE_K2L04_REDIS` + `pg/00-setup.sql` in `ADVANCE_BE_LAB`; cluster/crash only when a stage asks); stage times and optional order; deviations; run dates; that L06 (`advance-be-redis`) was never touched; next step OmniPOS M2 FR-M2-05 and Boss Challenge 2.3. No commit, branch or push.
- Success criteria: file exists with those headings.
- Verify: `grep -cE '^## (What exists|How to start|Time budget|Deviations|State left|Next steps)' D:/study/advance-be/plans/handoffs/k2-lesson-04-caching-guide-ready-20261103.md` → `6`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fingerprint (L06 + foreign + PG schemas) | `rc=0` | T10.2 |
| learner state | `rc=0`, extras `–` | `check.sh` |
| L06 not broken | GREEN | T10.1 |
| scope of changes | allow-list only | `git status --short` |

## Risks and rollback
Doc edits are one-liners with their original text quoted above; revert by restoring it. No git operation besides `git status`.

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
