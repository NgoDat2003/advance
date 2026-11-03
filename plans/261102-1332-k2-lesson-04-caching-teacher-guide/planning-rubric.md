# Plan rubric — K2 Bài 04 (Caching), `/ak:plan --ultra --tdd --advice` verifier pass

Score every candidate plan on each criterion from 1 to 20. Cite the plan's own text, or note its absence. The deciding criteria for the margin are P1, P2 and P3.

| # | Criterion | What a 20 looks like |
|---|---|---|
| P1 | Scope fidelity | Covers all 39 slides, each mapped once, with title/section pages null-chipped. Covers every block of evidence §4: fundamentals measured (incl. slide 6/7 claims and a re-measured cluster), all five rate-limit variants + batch tokens + 429/Retry-After + fail-open/closed, counters (PG hot row vs Redis, write-behind, memory layouts), unread broadcast (fan-out vs pointer), share data (message pool, polling vs blocking), practices (WATCH vs Lua, delay task, HLL, Bitmap, hand-built Bloom), homework with self-check, bridge to FR-M2-05 / Boss 2.3. Honours every settled decision: lesson K2 04; overlaps re-measured fully; Bloom via SETBIT+Lua; own containers; schema `k2l04_counter`; `k2l04` keys; no-rail shell; main only; no git/ship steps. |
| P2 | Executability and handover | Every phase names exact files (full paths) and owner. Parallel work has disjoint ownership against a frozen contract. The container lifecycle is fully specified (create, variant, reset, restore, prove L06 untouched). Every task has Goal/Target/Steps/Success/Verify, with Verify mechanical (exact command + exact expected result). Red-first tasks state their failing pass condition. The literal Failure Protocol block appears in every phase. A Sonnet-class executor could run it without making new design decisions. |
| P3 | TDD and evidence rigor | `check.sh`, the expected-result matrix and the guide verifier exist before the code they check. Every guide number traces to a recorded run file in a sha256 manifest. Timing claims are robust to the Docker VM clock (repeats, sanity bounds, host-ms or p50, labelled). Statistical claims (HLL, Bloom, sliding-counter error) have fixed inputs and stated acceptance bands. Each phase has a test matrix with negative cases: seed rerun idempotent, snippet text drift detected, a contradicting measurement changes the narrative not the data, L06 container and foreign containers/ports untouched, a bad homework fixture fails. |
| P4 | Technical correctness | Correct statements and planned measurements for each claim: fixed-window boundary burst; atomic `INCR`+`EXPIRE` (e.g. `SET NX EX` then `INCR`, or Lua); sliding log vs counter accuracy; leaky bucket queue latency; token bucket continuous vs interval refill and atomicity; batch-token over-admission; PG hot-row lock waits vs Redis single thread; HLL standard error 0.81 % and sparse/dense 12 KB; bitmap offset memory; Bloom FP formula and no false negatives; `WATCH` abort semantics; `CLUSTER KEYSLOT`/`CROSSSLOT` needing cluster mode; `maxclients` default; Pub/Sub claims. Chips are sensible, and design-only claims are labelled "chưa đo trực tiếp". |
| P5 | Teaching quality | Each stage follows "story → diagram → measured table → 30s check", with a glossary before new commands. "Làm mẫu → tự làm" with PASS criteria. Widgets teach a mechanism from recorded data. One shared traffic pattern compares the algorithms. Clear bridge to OmniPOS M2 FR-M2-05 (which algorithm, why, `Retry-After`, ADR-010) and Boss Challenge 2.3. Homework with self-check and a 50/50 scaffold. Interview questions and cheat sheet. Realistic one-day budget with optional items marked. |
| P6 | Safety | Only K2L04-owned containers are written or restarted. `advance-be-redis` (L06, in use by the learner), its network and volume, port 6380, `omnipos-hub-pg` and company containers stay untouched, checked by a before/after fingerprint. Keys are namespaced. `FLUSHALL` only on own containers. Config changes are reverted. Postgres writes only in `k2l04_counter`, bounded load, no secrets printed, no prune. |
| P7 | Delivery efficiency and review | Sensible sequencing: contract → lab/check/matrix/verifier → runs → widget data → guide → verify/render → ultra code review → fixes → docs → handoff. No ceremony that produces nothing. A size budget for the HTML. Realistic effort. |

## Hard constraints (any violation disqualifies the candidate)

1. Plans a branch, worktree, commit, push, PR, GitHub issue or label.
2. Writes to, reconfigures, restarts or recreates `advance-be-redis`, its volume or network, or runs L06's state-changing scripts. Uses port 6380. Writes a Postgres schema other than `k2l04_counter`.
3. Makes the learner run or read a heavy Node harness for the core lesson. A small optional drill or homework code is fine.
4. Picks a lesson other than K2 Bài 04, drops any of the eight content blocks of evidence §4, reduces an overlapping slide to a link only (it must be re-measured), or uses RedisBloom / redis-stack for slide 37.
5. Has no test-first verification (no test matrix or mechanical verification commands per phase), or has phases without the Failure Protocol block.
6. Does not follow the required output structure (`=== FILE: plan.md ===` plus phase files).
7. Breaks a supervisor-settled rule of evidence §9. That covers:
   - container names other than `advance-be-k2l04-*`, or a main port other than `127.0.0.1:6381`;
   - Lua shown before the tools stage that teaches slide 33;
   - a null-chip list different from §9 item 5;
   - `redis-benchmark -t …` default keys;
   - RTT measured across `docker exec` spawns;
   - base64 slide images;
   - pgbench without `-n` or with `-i`.
