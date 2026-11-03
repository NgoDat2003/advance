# Planning packet — `/ak:plan --ultra --tdd --advice`, K2 Bài 04 (Caching)

Immutable input for the five planner candidates and the plan verifier. Do not edit during the ultra pass.

## 1. Task

Write ONE complete, executable implementation plan (TDD mode, handover format) that turns `evidence-packet.md` into a finished K2 Bài 04 teacher guide plus labs. The learner studies it after Lesson 06, about 2026-11-04 or later.

Executor: the controller (main session), optionally with delegates that own disjoint files. **Because `--advice` is active, write every phase so that a Sonnet-class model can execute it without inventing anything.** Each phase is a list of tasks with Goal / Target files / Steps / Success criteria / Verify (mechanical: exact command + exact expected result), plus the literal Failure Protocol block from evidence §8.

Plan directory: `plans/261102-1332-k2-lesson-04-caching-teacher-guide/`.

## 2. Inputs (authority order)

1. `evidence-packet.md` in this folder: request, settled decisions (§1), learner profile (§2), content scope (§4), measured facts (§5), constraints (§6), post-implementation (§7), handover contract (§8). Its decisions are settled.
2. `kongming-investigation-counsel.md` in this folder, if present. These are the supervisor's corrections and risks, binding where they correct a fact.
3. `Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/04. Caching.md`, the 39 slides. Images are in `assets/04_Caching/`; view the rate-limit and unread-counter images.
4. Lesson 06 build system, the model to copy and adapt rather than reinvent: `plans/261031-1651-lesson-06-redis-teacher-guide/`. Read:
   - `plan.md`: stage map, matrix, acceptance criteria, risks, red-team table, must-fix.
   - The phase files.
   - `controller-facts-addendum.md`.
   - `assembly/contract.md` and `assembly/assemble.mjs`.
   - `verify/run-redis.mjs`, `verify/verify-guide.mjs`, `verify/expected.tsv`, `verify/negative-tests.sh`, `verify/deviations.md`.
   - Labs in `labs/lesson-06-redis/`.
   - The built guide `reports/advanced_backend/lesson_06_redis_teacher_guide.html`: skim the structure, the script block and one stage.
5. Lesson 07 Postgres-side runner: `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/run-lab.sh` and `labs/lesson-07-data-modeling/*.sql`.
6. Bridge docs named in evidence §3: OmniPOS SRS §M2/§M3, `architecture-evolution.md`, and the handoffs.

Do not open other `reports/planner-ultra-candidate-*.md` files.

## 3. What the plan must decide (open design space)

- **Stage map:** how the 39 slides and the evidence §4 blocks split into about 7–9 stages, with slide ranges, core vs optional minutes, and a realistic one-day budget.
- **Container strategy:** which K2L04-owned Redis containers to use and how to run them:
  - names, port, network, volume;
  - a cluster-enabled node for slide 9;
  - any small-`maxmemory` or other variants;
  - how to create, reset and restore them;
  - proof that L06's container, network, volume, scripts and `check.sh` stay untouched;
  - the DBX connection for the new port.
- **Learner run method:** how Đạt runs each experiment. Options include `docker exec -it … redis-cli`, piping a `.redis` file, a short `.sh`, `.sql` in DBX, and `docker exec … psql`/`pgbench`. Two-client experiments include the WATCH abort, the token-bucket race, delay pollers, BLPOP reply vs polling, and the leaky-bucket worker. They need a recorded A/B host-ms timeline and two-terminal instructions, as in L06.
- **Rate-limit experiment design:** one traffic generator, shown as readable shell (e.g. `seq … | awk … | redis-cli`, or timed `sleep` loops), fired at every algorithm.
  - Boundary-burst timing that is reproducible despite the Docker VM clock steps. For example, use windows keyed by a client-supplied time in the snippet, or Lua `TIME` with margins; justify the choice.
  - Exact numbers for allowed and denied.
  - Memory per algorithm.
  - Accuracy of the sliding-window counter vs the log.
  - The batch-token RTT experiment.
- **Counter experiments:**
  - Postgres hot row (how load is generated: pgbench script or concurrent psql; how lock waits are shown, e.g. `pg_stat_activity.wait_event`/`pg_locks` sampled; bounded duration).
  - Redis `INCR`/`HINCRBY` under the same concurrency.
  - Write-behind flush with atomic read-and-reset.
  - Memory: Strings vs Hash vs bucketed Hash.
  - Unread broadcast: fan-out vs pointer at scaled N.
- **Statistical claims made reproducible:** HLL error at several N, Bloom false-positive rate at chosen m/k/n, with seeds or fixed inputs. State what counts as "matches theory".
- **Lua scripts:** which ones (sliding log, token bucket, batch tokens, Bloom add/check, delay claim, flush read-and-reset, …), placed so that no script appears before the stage that teaches Lua. Lua identity is hashed in the run header, as in L06 V18.
- **Widgets:** which interactive blocks teach a mechanism using recorded data. Examples:
  - a window/bucket simulator replaying recorded traffic;
  - a sliding-counter estimator;
  - a token-bucket with batch size;
  - an HLL/Bloom calculator checked against recorded runs;
  - a fan-out vs pointer cost model.
  For each, state what recorded data it reads.
- **Walkthrough → challenge:** per stage a worked example, then a learner task with PASS criteria. Also:
  - **homework:** exact task, self-check script and fixtures, with a bad fixture that must fail;
  - an optional NestJS/node-redis rate-limit-guard drill with seeded mistakes, whose library claims are verified via published sources.
- **Assessment:** quizzes per stage, about 10 interview questions, a cheat sheet (commands, complexity, algorithm comparison), the slide map with chips, references, and the "tiếp theo" bridge (OmniPOS M2 FR-M2-05 + Boss Challenge 2, then the next roadmap item).
- **Verification:**
  - A guide verifier adapted from L06: every number and code block traces to a lab file and a run; slides 1–39 mapped exactly once; storage keys only `k2l04-*`; no external scripts; size budget; render-check at 375/768/1440 with no overflow or runtime errors; dark/light.
  - Lab invariants (`check.sh`).
  - Negative tests that prove the checker catches drift.
  - A container fingerprint before/after that includes L06's main.

## 4. Execution model the plan must fit

- Work on `main`. The only git step is `git status`.
- The controller owns container setup, all Redis/Postgres runs (serial), recorded outputs, guide assembly, verification and docs. Delegates may write separate files in parallel only with disjoint ownership against a frozen contract (fragment format, CSS class vocabulary, `data-run` ids). The controller assembles.
- Reuse the L06 assembler, runner and verifier by copying them into this plan folder and adapting them. Do not invent a new framework.
- TDD here means that these are written **before** the experiments and the HTML they check, and each phase ends with runnable verification commands and expected results:
  - the lab `check.sh`;
  - the expected-result matrix (claim → expected Redis 7.2 / PG 16 result → chip, frozen in `verify/expected.tsv`);
  - the guide verification script.
- Keep the build lean: no framework, no build step for the learner, and a single small `package.json` only if the homework or drill truly needs node-redis.
- Post-implementation steps follow evidence §7, including `/ak:code-review --pending --ultra --advice` as its own phase.

## 5. Required output

Write exactly one file: `plans/261102-1332-k2-lesson-04-caching-teacher-guide/reports/planner-ultra-candidate-<N>.md` (N = your slot). Structure it as concatenated files, each introduced by a line `=== FILE: <name> ===`:

1. **`=== FILE: plan.md ===`**
   - YAML frontmatter: `title`, `description`, `status: pending`, `priority: P1`, `effort`, `branch: main`, `tags`, `blockedBy: []`, `blocks: []`, `created: 2026-11-02`.
   - Then these sections:
     - Overview (3–5 sentences)
     - Data flow
     - Stage map table
     - Phases table (#, name, effort, depends on, gate)
     - Expected-result matrix (id → run id/region → slide → expected result → chip)
     - Acceptance criteria (numbered, checkable, mapped to phases)
     - Risks and rollback
     - Open questions for the user (only genuine ones)
2. **One `=== FILE: phase-NN-<kebab-slug>.md ===` per phase.**
   - Frontmatter: `phase`, `title`, `status: pending`, `priority`, `effort`, `dependencies`.
   - Sections: Goal · Files to create/modify (full paths, owner) · Tasks (each task: Goal, Target files, Steps, Success criteria, Verify) · Test matrix (test first, expected result, command) · Risks and rollback · the literal **Failure Protocol** block from evidence §8.

Length: 5,000–9,000 words total. Use plain, direct sentences and tables where they help. Write in English; the deliverables themselves are Vietnamese.

Finish with a final message containing only:
```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
File: <path>
Summary: one or two sentences
Concerns/Blockers: optional
```
