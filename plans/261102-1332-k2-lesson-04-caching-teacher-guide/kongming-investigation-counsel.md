# Kongming counsel — after investigation, before the planner wave (2026-11-02)

Advisory checkpoint under `--advice` (supervisor: `kongming`, ran on Fable 5.1). Recorded by the controller. Items 1–10 of Q1 have been applied to `evidence-packet.md` (see its §9). Q2 and Q3 are binding facts and risks for every candidate. Q4 is a strong recommendation; candidates may choose a different design if they give a reason.

**Controller verification of the load-bearing claims:**
- `labs/lesson-06-redis/check.sh:136` runs `docker ps -a --filter name=advance-be-redis-` and fails C14 for any match that publishes a port (confirmed by reading the file).
- The L06 guide embeds slide images by relative path, `src="../../Tài Liệu/advanced_backend/assets/6_Redis/…"`, at `reports/advanced_backend/lesson_06_redis_teacher_guide.html:287` (confirmed).
- `assets/04_Caching` totals 3.1 MB (confirmed with `du -sh`).
- Redis 7.2.3 `src/pubsub.c` keeps a per-channel `adlist` with `listSearchKey` (confirmed by the controller's own fetch).

## Q1. Go / no-go: packet edits (all applied)

1. **Slide 14 formula.** The image shows 30 % as the elapsed fraction of the current minute. The estimate is therefore `prev × 0.7 + current × 1.0` (5 × 0.7 + 3 = 6.5 > 5 → deny), not `current × 0.3`.
2. **Stage order.** Sliding log and token bucket need Lua, but the slides teach Lua at page 33. Move slide 33 (race, WATCH vs Lua) into a tools stage *before* rate limiting, as L06 also reordered slides. Otherwise the memory rule "no script before the stage that teaches it" breaks.
3. **Container naming.** L06 `check.sh:136` matches the substring `advance-be-redis-`. Use:
   - all K2L04 containers named `advance-be-k2l04-*`;
   - network `advance-be-k2l04`;
   - main published on `127.0.0.1:6381`, extras unpublished;
   - a K2L04 check that scans only its own prefix.
   L06 may be up or down on study day.
4. **Postgres method.**
   - The learner runs `.sql` in DBX `ADVANCE_BE_LAB`.
   - The controller and pgbench run only through `docker exec -i quan-ly-hop-dong-postgres-1 …`.
   - pgbench uses `-n -f <script>`. Without `-n` it fails on the missing `pgbench_branches`; `-i` would create `pgbench_*` in `public`.
   - Load limits: `-c ≤ 8 -T ≤ 5`. The script touches `k2l04_counter.*` only and is fed via `/dev/stdin`, or via a `/tmp` file removed in the same line (confirm in the phase-01 smoke).
   - Gate: the schema list is unchanged before and after.
5. **Chip vocabulary.**
   - Keep exactly three chips and put the platform in the note ("đo trên PG 16.15"), so the L06 verifier V04 is reused unchanged.
   - Freeze the null-chip list: 1, 2, 3, 10, 12, 17, 18, 23, 26, 32, 38, 39.
   - Give recap slides 11 and 31 design rows, like L06 D42.
6. **Time budget.**
   - Hard core cap of 300 min, plus a priority order for "nếu còn sức". Rate limiting and counters are never optional.
   - "Re-measure fully" means one recorded run per overlap (4 runs, ≈ 40 min); variants are optional.
7. **RTT rule.** Every `docker exec … redis-cli` spawn costs tens of ms on this host, which dwarfs a 0.2 ms RTT. Measure the slide-16 batch-token claim and any RTT claim inside one connection: `redis-benchmark` custom command, `-c 1`, a 1-token vs a 10-token script. Never measure across process spawns.
8. **redis-benchmark key rule.** `-t incr/set/get` writes `counter:__rand_int__`/`key:__rand_int__`, which breaks the `k2l04:` lint. Use the custom-command form with an explicit `k2l04:` key. Run 3 times, take the median, and reject ≤ 0.
9. **Size budget.**
   - 520 KB, like L06.
   - Images use a relative path (`src="../../Tài Liệu/Khóa 3. …/assets/04_Caching/…"`). Base64 is forbidden: the folder is 3.1 MB and slide 16's PNG alone is 313 KB.
10. **Homework default.**
    - The FR-M2-05 shape: a Lua bucket per `storeId`, capacity 10, 30 calls → 20×429 + `Retry-After`, written by the learner with a 50/50 scaffold. Planners may deviate with a reason.
    - The learner creates a DBX connection for 6381, because `ADVANCE_BE_REDIS` points at L06.

## Q2. Technical risks the plan must address

1. **Clock.** The Docker VM runs about 8 % fast and steps back by up to −2.8 s (L06 addendum item 6). `redis-benchmark` printed a negative rate today. Every window, refill, TTL and pgbench tps is affected. Mitigations:
   - All limiter scripts take `now_ms` as ARGV, for deterministic replay (see Q4).
   - The production form uses `redis.call('TIME')`.
   - Clamp `elapsed = max(0, now − last)`.
   - The runner logs a clock-sanity line (Redis `TIME` delta ÷ host delta) and rejects backward steps.
   - Run 3 times from reset.
2. **Wall-clock boundary demos.** Align bursts to the key's `PTTL`: fire when it is < 300 ms, then again after expiry, with 10 s windows rather than 60 s. Alternatively, use the replay with literal t = 59.9 / 60.1 s.
3. **Two-client timelines** (naive race, WATCH abort, delay-task double claim, poll vs `BLPOP`). Reuse L06's barrier + host-ms rule verbatim. Cap at about 6 timelines, run through one harness.
4. **Foreign Postgres container.**
   - Bounded load, `-n -f` only.
   - Add a `PGOPTIONS='-c synchronous_commit=off'` variant, for a fair comparison with non-durable Redis.
   - Show lock waits as a `pg_stat_activity` snapshot from DBX.
   - Use `n_dead_tup`/`n_tup_hot_upd` for the bloat story.
5. **HLL and Bloom are deterministic for fixed inputs.**
   - Freeze `seq`-generated names; no `$RANDOM`.
   - Assert exact counts. `PFCOUNT` 99,655 for `ip1..ip100000` is reproducible (fixed Murmur seed).
   - Size the Bloom so the formula predicts hundreds of false positives. Example: n = 10,000, m = 50,000 bits, k = 3 → p ≈ 9.2 %, about 919 ± 29 over 10,000 probes. The narrative band is ±3σ, and members must be 10,000/10,000 hits.
   - Use `redis.sha1hex` 8-hex slices (`tonumber(s,16) % m`, k ≤ 5) or double hashing.

## Q3. Slide claims not yet flagged

- **Slide 16 as drawn is a fixed window.** "4 tokens refilled at 1-minute interval" admits 4 at 1:00:59 and 4 at 1:01:00, the same boundary burst as slide 13. This is measurable; chip Đúng một phần. (Certain.)
- **Slide 16 "just store the number of tokens".** Continuous refill needs tokens plus the last-refill timestamp. (Certain.)
- **Slide 6 UNSUBSCRIBE cost is true in 7.2.3.** `src/pubsub.c` at tag 7.2.3 keeps per-channel subscribers in a linked list (`listSearchKey`/`listDelNode`), so removal is O(N subscribers). Cite the source. A measurement needs thousands of subscriptions, so label it "chưa đo trực tiếp". Later versions moved to a dict (uncertain which; believed 7.4).
- **Slide 7 "60K connections".** The `maxclients` default is 10000 (`config.c` 7.2.3, verified). "2^32 keys" is the old FAQ wording; the 64-bit dict limit is memory (uncertain on the current FAQ text).
- **Slide 22 "Hash saves memory".** Only while the hash is a listpack.
  - The 7.2.3 compiled default is `hash-max-listpack-entries 512` (`config.c`, verified). The `redis.conf` sample says 128, so planners who quote 128 are wrong.
  - `hash-max-listpack-value 64`.
- **Slide 20 blames "relational DB".**
  - The measured cause is one hot row: lock serialization, a new tuple version per update, and an fsync per commit.
  - Run the same pgbench on 1,000 rows vs 1 row to prove it; chip Đúng một phần.
  - PG's `UPDATE … +1` is as accurate as `INCR`. Slide 22's "accurate" is about client read-modify-write only.
- **Slide 33** is correct. Note that Redis 7 Functions exist (minor).

## Q4. Time-saving suggestion (recommended design)

Use deterministic trace replay:
- One `traffic.tsv` (`ts_ms`, client) of about 60 requests is fed through every limiter via `redis-cli --eval <algo>.lua k2l04:rl:… , <now_ms>` in a 20-second `.sh`.
- The comparison table, boundary burst, short burst and sliding-counter error all come out of one run, with no waiting and no clock flakiness.
- The learner then watches one live 10-second demo per algorithm.

This saves about 40 min of 60-second windows without dropping any requested experiment.

## Assumptions stated by the supervisor

- Best-of-5 selection tolerates homework divergence but not contract divergence (high).
- L06's barrier/host-ms runner is reused as-is for 6381 (high).
- `pgbench -f /dev/stdin` works in the Alpine image (medium; smoke it).
