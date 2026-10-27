# Plan rubric — Lesson 07 (Data Modeling), `/ak:plan --ultra --tdd` verifier pass

Score every candidate plan on each criterion from 1 to 20, citing the plan's own text (or its absence). Deciding criteria for the margin: P1, P2, P3.

| # | Criterion | 20 looks like |
|---|---|---|
| P1 | Scope fidelity | Covers all 43 slides (each mapped to a stage, appendix 39–43 included) plus normal forms, polymorphic and the double-entry ledger capstone; honours every settled decision of `evidence-packet.md` (lesson 07 chosen, DBX-first SQL snippets with no `.mjs` harness for the learner, lesson-14 shell without rail, `l07-*` keys, Prisma 7.9 drill, main only, no git/ship steps) |
| P2 | Executability | Every phase names exact files (full paths), owner, disjoint ownership for any parallel work, a frozen contract (schema DDL, fragment format, data-run ids) before fan-out, dependencies, effort; the controller could execute it tomorrow morning without new design decisions; fits a realistic same-evening build |
| P3 | TDD and evidence rigor | `check.sql`, the expected-result matrix and the guide verification script exist before the code they check; every guide number is traced to a recorded run file; each phase has a test matrix with commands and expected results including negative cases (rerun of setup is idempotent, sources untouched, mismatch between snippet text in HTML and in `.sql` detected, contradicting measurement changes narrative not data) |
| P4 | PG-vs-MySQL correctness | Correct PG 16 statements for each slide claim (fast default ADD COLUMN, CONCURRENTLY, jsonb indexing, text=varchar, timestamptz semantics, view inlining, materialized views, no FK auto-index, NULL bitmap), each with a planned measurement and a sensible chip |
| P5 | Teaching quality | Clear "làm mẫu → tự làm" per stage, widgets that teach a mechanism (not decoration) using recorded data, ledger capstone tied to lesson 14 locking and the OmniPOS project, homework with a self-check SQL, interview questions and cheat sheet that test understanding |
| P6 | Safety | Writes only `lab07_modeling`; every snippet sets `search_path` or qualifies names; timeouts on sessions; idempotent setup; cleanup; source fingerprints checked (e.g. hw_contracts 500,000, northwind counts) before and after; no secrets printed |
| P7 | Delivery efficiency and review | Sensible sequencing (contract → setup/check → experiments+runs → guide → verify → ultra code review → fix → docs → handoff), no ceremony that produces nothing, size budget for the HTML, render-check gate |

## Hard constraints (any violation disqualifies the candidate)
1. Plans a branch, worktree, commit, push, PR, GitHub issue or label.
2. Writes to any schema other than `lab07_modeling`.
3. Makes the learner run or read a Node `.mjs` harness to do the lesson.
4. Picks a lesson other than 07 or drops any of the four content blocks of evidence §4.
5. Has no test-first verification (no test matrix or verification commands per phase).
6. Does not follow the required output structure (`=== FILE: plan.md ===` plus phase files).
