# Planning packet — `/ak:plan --ultra --tdd`, Lesson 06 (Redis)

Immutable input for the five planner candidates and the plan verifier. Do not edit during the ultra pass.

## 1. Task

Write ONE complete, executable implementation plan (TDD mode) that turns `evidence-packet.md` into a finished Lesson 06 Redis teacher guide the learner can study right after Cluster 1 Phase B (about 2026-11-02). The controller (main session) executes it, optionally with delegates that own disjoint files.

Plan directory: `plans/261031-1651-lesson-06-redis-teacher-guide/`.

## 2. Inputs (authority order)

1. `evidence-packet.md` in this folder — request, settled interpretation, learner profile, content scope (§4), measured facts (§5), constraints (§6). Its decisions are settled.
2. `Tài Liệu/advanced_backend/6. Redis.md` — the 46 slides.
3. Lesson 07 build system (the model to reuse, not reinvent): `plans/261027-1328-lesson-07-data-modeling-teacher-guide/plan.md`, its phase files, `assembly/contract.md`, `assembly/assemble.mjs`, `verify/verify-guide.mjs`, `verify/run-lab.sh`, `verify/expected.tsv`, and the built guide `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` (skim structure, the script block and one full stage).
4. `reports/advanced_backend/lesson_02_caching_teacher_guide.html` and `labs/lesson-02-caching/06-redis-imdb-read-aside-and-stampede.mjs` — what Redis content is already taught.
5. `docs/omnipos-finledger-hub/software-requirements-specification.md` §M2 and the handoffs named in the evidence packet §3.

Do not open other `reports/planner-ultra-candidate-*.md` files.

## 3. What the plan must decide (open design space)

- **Stage map**: how the 46 slides + evidence §4 blocks split into ~8–9 stages with times, slide ranges and a realistic one-day budget (core vs optional).
- **Learner run method**: how Đạt runs each experiment (DBX Redis console vs `redis-cli` in `docker exec -it`, piping `.redis` files), decided by a smoke test in an early phase, with a fallback. Two-client experiments (blocking command vs PING, BRPOP queue, lock race, delay-task pollers, replica lag) need a recorded A/B timeline and clear instructions for two terminals.
- **Lab design**: the file set under `labs/lesson-06-redis/` — e.g. a container setup script/compose for `advance-be-redis*` (main, optional replica, optional cluster), an idempotent seed, a `check` that prints ✔/✘ for invariants, one self-contained command file per stage whose text equals what the guide shows, cleanup. How the controller runs them non-interactively and records outputs verbatim so every number in the guide traces to a recorded file. Where container restarts/config changes are needed (maxmemory, persistence, debug command), how state is restored.
- **Measurements per slide claim**: for every slide with an outdated or questionable claim, which experiment proves Redis 7.2 behaviour and which chip it gets. At least: single thread blocking (13), I/O threads (14), memory/network bottleneck (12), encodings + Hash vs JSON (16, 30–35), expiry passive/active and the ZSET claim (18–21), eviction policies on a small maxmemory incl. noeviction OOM (22–23), RDB/AOF/hybrid restart data loss (25–27), List queue limits (32), big key DEL vs UNLINK (38), hash slots / hashtag / CROSSSLOT (9, 39), distributed lock failure modes (40), pipelining/MGET (41), replication async lag (6).
- **Lua**: which scripts (compare-and-delete release, delay-task claim, token bucket, idempotency) and how atomicity is shown (two clients, before/after).
- **Widgets**: which interactive/visual blocks (e.g. event-loop/single-thread timeline, encoding converter, expiry sampling simulator 20 keys/25%, eviction simulator, hash-slot calculator with CRC16 in JS checked against recorded `CLUSTER KEYSLOT` values, lock timeline with TTL expiry and fencing token, token-bucket simulator) and what recorded data each reads.
- **Walkthrough → challenge**: per stage a worked example, then a learner task with PASS criteria; homework (slide 43 seat lock) with a self-check the learner runs; a Node/NestJS driver drill with seeded mistakes and how its claims are verified (published sources, not `node_modules`).
- **Assessment**: quizzes per stage, 10 interview questions, cheat sheet (commands + complexity), slide map with chips, references, "tiếp theo" bridge (OmniPOS M2 + Boss Challenge 2, then K2 Bài 04 Rate Limiting).
- **Verification**: a guide verification step (HTML validity, every `data-run`/number traced to a recorded file, every slide 1–46 mapped exactly once, storage keys only `l06-*`, no external scripts, render-check 375/768/1440 without overflow or runtime errors, dark/light), plus lab invariants; negative tests that prove the checker catches drift.
- **Post-implementation**: `/ak:code-review --ultra` (5 independent reviewers + verifier, union of verified findings), fix Critical/Important, re-run affected checks; docs update (README lab/guide route + `TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 06, and add lesson 06 link to lesson 07's `#tiep-theo` only if a one-line change); final gate; a short handoff note.

## 4. Execution model the plan must fit

- Work on `main`; no git step except `git status` checks.
- The controller owns container setup, all Redis runs (serial), recorded outputs, guide assembly, verification, docs. Delegates may write separate files in parallel only with disjoint ownership against a frozen contract (fragment format, CSS class vocabulary, data-run ids); the controller assembles.
- Reuse the lesson-07 assembler/verifier by copying and adapting into this plan folder; do not invent a new framework.
- TDD here means: the `check`, the expected-result matrix (claim → expected Redis 7.2 result → chip) and the guide verification script are written **before** the experiments and the HTML they check; each phase ends with runnable verification commands and expected results.
- Keep the build lean (no framework, no build step for the learner; a single small `package.json` only if the homework/driver drill truly needs node-redis).

## 5. Required output

Write exactly one file: `plans/261031-1651-lesson-06-redis-teacher-guide/reports/planner-ultra-candidate-<N>.md` (N = your slot). Structure it as concatenated files, each introduced by a line `=== FILE: <name> ===`:

1. `=== FILE: plan.md ===` — YAML frontmatter (`title`, `description`, `status: pending`, `priority: P1`, `effort`, `branch: main`, `tags`, `blockedBy: []`, `blocks: []`, `created: 2026-10-31`), then: Overview (3–5 sentences), Stage map table, Phases table (#, name, effort, depends on, gate), Expected-result matrix (id → run#region → slide → expected Redis 7.2 result → chip), Acceptance criteria (numbered, checkable, mapped to phases), Risks and rollback, Open questions for the user (only genuine ones).
2. One `=== FILE: phase-NN-<kebab-slug>.md ===` per phase, each with frontmatter (`phase`, `title`, `status: pending`, `priority`, `effort`, `dependencies`) and sections: Goal · Files to create/modify (full paths, owner) · Tasks and steps · Test matrix (test first, expected result, command) · Verification (commands) · Risks and rollback.

Length: 3,500–6,000 words total. Plain, direct sentences; tables where they help. Write in English (deliverables are Vietnamese).

Finish with a final message containing only:
```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
File: <path>
Summary: one or two sentences
Concerns/Blockers: optional
```
