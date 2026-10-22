# Review packet — lesson 3 (Index) deliverables

Immutable input for the 5 ultra reviewers. Workspace `D:/học/advance-be` (not a git repo, so "pending changes" = the files listed below, all new).

## Scope (review these files)
- `reports/lesson_03_index_teacher_guide.html` — single-file Vietnamese study guide (~2,140 lines: CSS, 6 stages, widgets, quizzes, exam, cheat sheet, slide map, inline JS).
- `labs/lesson-03-index/*.mjs`, `setup-dataset.sql`, `package.json` — Node ESM labs on PostgreSQL 16 (`pg`), shared kit `pg-explain-kit.mjs`, dataset setup, invariant check, homework kit (`homework-*.mjs`).
- Recorded verbatim outputs the guide quotes: `plans/261019-1634-lesson-03-index-teacher-guide/lab-runs/*.txt` (run serially 2026-10-20).
Out of scope: `labs/lesson-02-caching/`, `node_modules/`, plan/candidate markdown.

## Context
- Accepted format and learner profile: `plans/261019-1634-lesson-03-index-teacher-guide/evidence-packet.md` §2–§3. Final plan: `plan.md`. Slides: `Tài Liệu/3. Index.md` (42 slides).
- The slides are MySQL/InnoDB-flavoured; the learner runs PostgreSQL 16.14 (collation en_US.utf8). The guide must teach PG truthfully and mark where slide claims differ.
- Labs must: never change `lab_imdb` permanently (lesson 2 depends on it having only 2 PKs); keep data writes in scratch tables `lNN_*` / `hw_*`; extra indexes on base tables only inside BEGIN…ROLLBACK; print verdicts computed from measurements; never print or store the DB password (`PG_URL` env only); files ≤ 200 lines.
- Accepted deliberate decisions (do not flag as bugs): pages (shared hit+read) are the headline metric; `pg-explain-kit` turns parallel workers off by default (lab 11 measures both); lab 04 uses an md5-derived v4-format UUID instead of `gen_random_uuid()` for determinism; lab 08 does not exist (merged into lab 01); homework draft (`homework-ai-draft.mjs`) contains intentional methodology flaws — review it only for crashes, cleanup and secrecy, not for its planted flaws.
- Runtime facts measured on this machine are in `lab-runs/*.txt`; you may run read-only checks: `docker exec quan_ly_hop_dong-postgres-1 psql -U postgres -d advance_be_lab -c "..."` (catalog/SELECT only, no DDL, never print secrets or container env). Do not run the labs (they write scratch tables) and do not edit any file.

## What to look for (Stage 2 quality review)
1. Correctness of technical claims in the guide (PostgreSQL 16 vs MySQL facts, B+tree facts, numbers vs `lab-runs/*.txt`, quiz answer keys, exam answers, cheat sheet).
2. JS bugs in the guide (widgets: page calculator, B+tree insert/split/render, bug hunt, lookup path, composite explorer, guess-the-plan, design table, quizzes, storage), accessibility/responsiveness issues that would break use.
3. Lab code bugs: wrong measurement, non-determinism, cleanup gaps (leftover objects on error), transaction misuse, SQL injection paths in the homework runner, secrets exposure, verdicts that could print ✔ incorrectly.
4. Consistency between lab outputs, guide prose and the plan's acceptance criteria.

## Output format
For each finding: severity (Critical / Important / Minor), `file:line`, the defect in one sentence, concrete failure scenario (input/state → wrong output), and suggested fix. Evidence-backed only; no style nits unless they mislead the learner. Max ~25 findings, most severe first. End with "No further findings" if you are done.
