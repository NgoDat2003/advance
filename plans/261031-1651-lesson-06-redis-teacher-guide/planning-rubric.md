# Plan rubric — Lesson 06 (Redis), `/ak:plan --ultra --tdd` verifier pass

Score every candidate plan on each criterion from 1 to 20, citing the plan's own text (or its absence). Deciding criteria for the margin: P1, P2, P3.

| # | Criterion | 20 looks like |
|---|---|---|
| P1 | Scope fidelity | Covers all 46 slides (each mapped once, title pages null-chipped) plus every block of evidence §4 (why-fast measured, encodings + slide 30, expiry/eviction, persistence restart, data structures incl. delay task + big keys + hashtag, architecture with a measured replica, distributed-lock capstone with fencing, OmniPOS M2 bridge + driver drill); honours every settled decision (lesson 06, learner runs small command snippets himself, lesson-07 shell no rail, `l06-*` keys, does not re-teach lesson 02, main only, no git/ship steps) |
| P2 | Executability | Every phase names exact files (full paths), owner, disjoint ownership for parallel work, a frozen contract before fan-out, dependencies, effort; reuses the lesson-07 assembler/verifier; container lifecycle (create, reconfigure, restart, replica/cluster, restore) fully specified; the controller could run it without new design decisions |
| P3 | TDD and evidence rigor | `check`, expected-result matrix and guide verifier exist before the code they check; every guide number traces to a recorded run file; each phase has a test matrix with commands and expected results including negative cases (seed rerun idempotent, snippet text drift between HTML and lab file detected, contradicting measurement changes narrative not data, non-lab containers/ports untouched) |
| P4 | Redis 7.2 correctness | Correct statements and planned measurements for each slide claim (single-thread execution vs I/O threads off by default, encodings and conversion thresholds, expiry algorithm in 7.x not a ZSET, noeviction default + policies, RDB fork/AOF fsync/hybrid preamble, UNLINK/lazyfree, CRC16 slots + CROSSSLOT needs cluster mode, lock release with token + fencing, Lua atomicity), with sensible chips |
| P5 | Teaching quality | "Story → diagram → measured table → 30s check" per stage, "làm mẫu → tự làm" with PASS criteria, widgets that teach a mechanism using recorded data, capstone tied to lesson 02 lock and lesson 14 fencing/version, homework seat lock with self-check, driver drill with seeded mistakes, clear OmniPOS M2 / Boss Challenge 2 bridge, interview questions and cheat sheet |
| P6 | Safety | Only `advance-be-redis*` containers touched; port 6380 and company containers untouched (checked before/after); keys namespaced; FLUSHALL only on own lab containers; config changes reverted; optional Postgres writes only in `lab06_redis`; no secrets printed |
| P7 | Delivery efficiency and review | Sensible sequencing (contract → lab/check → runs → guide → verify → ultra code review → fix → docs → handoff), no ceremony that produces nothing, size budget for HTML, render-check gate, realistic effort |

## Hard constraints (any violation disqualifies the candidate)
1. Plans a branch, worktree, commit, push, PR, GitHub issue or label.
2. Touches a container other than `advance-be-redis*` destructively, uses port 6380, or writes a Postgres schema other than `lab06_redis`.
3. Makes the learner run or read a heavy Node harness to do the core lesson (small optional driver drill / homework code is fine).
4. Picks a lesson other than 06 or drops any of the eight content blocks of evidence §4.
5. Has no test-first verification (no test matrix or verification commands per phase).
6. Does not follow the required output structure (`=== FILE: plan.md ===` plus phase files).
