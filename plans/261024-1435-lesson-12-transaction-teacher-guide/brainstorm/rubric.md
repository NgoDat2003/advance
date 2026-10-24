# Brainstorm rubric — Lesson 12 (Transaction) contract, ultra verifier pass

Score every candidate on each criterion from 1 to 20. Cite the candidate's own text (or its absence) for every score. Deciding criteria for the margin: R1, R6, R7.

| # | Criterion | 20 looks like | 1 looks like |
|---|---|---|---|
| R1 | Faithfulness to the request and the accepted format | Lesson-3 parity (guide shell, run-verified labs, homework with runnable solution, slide map, exam, cheat sheet); mapped onto roadmap Day 02 (MVCC/WAL, xmin/xmax/ctid, readers do not block writers) and Day 03 (isolation levels, write skew RR vs 40001 at Serializable); respects the user's correction (main only, no branch/worktree/push/PR/issue, no commit unless asked) | A different product, or drops core lesson-3 elements |
| R2 | Evidence grounding | Claims tied to slide numbers, files and measured environment facts in the evidence packet; no invented measurements; MySQL behaviour labelled as cited | Generic advice; numbers presented as known that nobody measured |
| R3 | Sharp acceptance criteria | Every criterion is observable and says how it is checked (command, file, count) | Vague goals ("good quality", "clear") |
| R4 | Honesty about unknowns and risks | Names what must be lab-verified before quoting, what cannot be measured here (InnoDB), concrete failure risks with mitigations | Overconfident, no unknowns |
| R5 | Conditional fields | Trade-offs compare 2–3 viable approaches, each with its load-bearing assumption and first-failure condition, compared on worst case; Better approaches is evidence-backed or the exact "none — … (<evidence>)" line | Missing or decorative trade-offs; silent on better approaches |
| R6 | Learner fit and project rules | CLAUDE.md rules: lean code with Vietnamese comments and no heavy framework; "làm mẫu → tự làm"; two-session manual tools (psql ×2 / DBX / DBeaver / pgAdmin) besides scripts; cumulative on lesson 3 data (hw_contracts) without mutating it; short prose, step/state tables, review-style practice for a NestJS/TypeORM developer | Long prose, script-only, ignores the learner |
| R7 | Feasibility and safety on this machine | Deterministic, non-hanging concurrency labs (step-ordered interleaving, bounded lock waits, cleanup in finally); everything in schema `lab12_transaction`; lab03/lab_imdb/maycha_lease untouched; no secrets; realistic ~4–5 h budget across two days | Timing-based races, possible hangs, writes to shared data |

## Hard constraints (any violation disqualifies the candidate)
1. Proposes a branch, worktree, push, PR, GitHub issue, or committing without the user asking.
2. Permanently modifies `lab03_indexing`, `lab_imdb`, or touches `maycha_lease`.
3. Presents unmeasured numbers as measured results.
4. Has no plan that covers all 26 slides.
5. Ignores the PostgreSQL-vs-MySQL differences the evidence packet lists.

## Verification evidence available to the verifier only
`plans/261024-1435-lesson-12-transaction-teacher-guide/probes/probe-anomaly-matrix.out.txt` — a controller probe run on this machine's PG 16.15 (script next to it). Use it to check candidates' PG claims; it was not given to the candidates, so do not penalise them for not citing it.
