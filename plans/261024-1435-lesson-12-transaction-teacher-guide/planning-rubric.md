# Plan rubric — Lesson 12 (Transaction), `/ak:plan --ultra --tdd` verifier pass

Score every candidate plan on each criterion from 1 to 20, citing the plan's own text (or its absence). Deciding criteria for the margin: P1, P2, P3.

| # | Criterion | 20 looks like |
|---|---|---|
| P1 | Contract fidelity | Implements every settled decision of `brainstorm/candidate-E.md` and resolves all 10 must-fix notes in `brainstorm/verdict.md` explicitly (table: note → resolution); respects the user's correction (main only, no git steps beyond status checks) |
| P2 | Executability | Every phase names exact files (full paths), owners (controller vs delegate) with disjoint ownership for parallel work, frozen kit/scenario interfaces before fan-out, npm script names, the ≤200-line split rule, dependencies and effort; a delegate could execute a phase without new design decisions |
| P3 | TDD rigor | Invariants (`npm run check`), the expected-verdict matrix, the homework refusal behaviour and the guide verification script are written before the code they check; each phase has a test matrix with commands and expected results, including negative tests (untouched homework file, foreign idle session, Ctrl+C mid-lab cleanup) and the masked-diff determinism check |
| P4 | Evidence and honesty | Says which PG behaviour each lab measures, what happens when a measurement contradicts the expectation (narrative changes, data never does), how MySQL claims are sourced, and how the TypeORM version question is resolved |
| P5 | Safety | Objects only in `lab12_transaction`; every session sets `search_path`, `lock_timeout`, `statement_timeout`, `idle_in_transaction_session_timeout` and an `error` listener; observer-confirmed waits; cleanup in `finally`; `PG_URL` never printed (client built inside try); lab03 fingerprint (500,000 rows, 5,666/5,666 all-visible, id 1 at xmin 875 / ctid (0,1)) checked; extensions installed and removed only in `lab12_transaction` |
| P6 | Learner fit | CLAUDE.md rules: Vietnamese comments, lean kit (runner ≈ 120 lines, no framework), "làm mẫu → tự làm", two psql windows with the GUI as observer only, prose budget; realistic study time per day; homework load as fixed by must-fix note 1 |
| P7 | Delivery efficiency and review | Sensible sequencing (setup → check → kit → labs → runs → guide → review → verify → docs), serial lab runs by the controller, ultra code review phase with fix-and-rerun loop, docs (README route) phase, no ceremony that produces nothing |

## Hard constraints (any violation disqualifies the candidate)
1. Plans a branch, worktree, commit, push, PR or GitHub issue.
2. Writes to `lab03_indexing`, `lab_imdb` or `maycha_lease` (copying from `hw_contracts` is fine).
3. Contradicts a settled decision of the accepted contract other than through a must-fix note.
4. Leaves any of the 10 must-fix notes unresolved.
5. Has no test-first verification (no test matrix or verification commands per phase).
6. Does not follow the required output structure (`=== FILE: plan.md ===` plus phase files).
