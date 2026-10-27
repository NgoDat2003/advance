# Review packet — Lesson 07 guide (`/ak:code-review --ultra`, pending changes)

Immutable input for 5 independent reviewers and the verifier. Spec = what the deliverable must do, not the builder's conclusions.

## Spec (from `evidence-packet.md` §2, §4–§6)

- A Vietnamese teacher guide for Lesson 07 Data Modeling, studied tomorrow by Đạt (NestJS + Prisma 7.9 + PostgreSQL 16). Covers all 43 slides plus 1NF→3NF, polymorphic associations and a double-entry ledger capstone tied to lesson 14 locking.
- DBX-first: every experiment is a self-contained SQL region he runs in DBX (Run Selection). No Node harness for the learner.
- Every number in the guide must come from a recorded run on this machine (PG 16.15, 27/10/2026). Slides are MySQL-flavoured; each MySQL-specific claim gets a chip (`Đúng trên PG16` / `MySQL đúng, PG khác` / `Cần sửa`) backed by a measurement.
- DB writes only in schema `lab07_modeling`; every region sets `search_path` (DB default is `lab03_indexing, public`); sources (northwind, lab03_indexing) read-only.
- Lesson-14 single-column shell, no rail, storage keys `l07-*`, dark/light, 375 px without horizontal scroll, ≥ 44 px targets, no external scripts.
- Anti over-engineering: plain SQL, plain Vietnamese, "làm mẫu → tự làm".

## Scope (changed files, all new)

- `labs/lesson-07-data-modeling/*.sql`, `prisma-drill.schema.prisma` (learner-facing, 20 SQL files)
- `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` (generated; review its sources instead when editing: `plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/{shell-head.html, shell-tail.html, fragments/stage-0N.html, fragments/stage-0N.quiz.json, widgets/wN.js, assemble.mjs}`)
- `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/{verify-guide.mjs, run-lab.sh, merge-timeline.mjs, make-widget-data.cjs, negative-tests.sh, widget-smoke.mjs, expected.tsv, deviations.md}`
- Recorded evidence: `plans/261027-1328-lesson-07-data-modeling-teacher-guide/runs/*.txt`, `runs/data/*.json`, `runs/prisma-claims.txt`, `runs/qlhd-migrations.txt`, `runs/dbx-smoke.txt`

## Already verified (do not re-report unless you find it is actually wrong)

- `node verify/verify-guide.mjs` (V01–V15), `--runs` (44 rows), `--data`: all pass. `negative-tests.sh`: 7/7 mutations caught. render-check light and dark at 375/768/1440: 0 errors, 0 warnings. `widget-smoke.mjs`: all 10 widgets render and respond, 9 quizzes, theme toggle, no exceptions. `check.sql`: 14/14 ✔.
- Known deviations are logged in `verify/deviations.md` (size budget 340 KB, X11 race mechanism, etc.).

## Focus (what we need from you)

1. **PG 16 correctness of teaching claims and chips** — any statement in the guide prose, quiz `why`, EXAM answers or cheat sheet that is false for PostgreSQL 16, or a chip that does not follow from the recorded run. You may run READ-ONLY SQL via `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab` to check (no DDL/DML outside a `BEGIN … ROLLBACK`, and never outside schema `lab07_modeling`).
2. **Learner SQL safety and runnability in DBX** — a region that writes outside `lab07_modeling`, forgets `SET search_path`, leaves a transaction open, fails on a second run in the same session, or whose expected error is not the last statement (DBX stops at the first error).
3. **Unrun answer keys** — challenge answers / self-check queries in the fragments that would not work as written (stage 2 normalization answer, stage 3 FOR KEY SHARE protocol, stage 9 `refund()`), or that contradict the measured behaviour.
4. **Number traceability gaps** the verifier cannot see (numbers inside strings, prose numbers not wrapped in `b.m`, widget text that misstates a run).
5. **Prisma 7.9 claims** vs `runs/prisma-claims.txt` and the official docs.
6. **Widget/JS bugs** (state, edge cases, accessibility) and verifier bugs that would let a wrong guide pass.

## Output

Write `plans/261027-1328-lesson-07-data-modeling-teacher-guide/reports/code-review-ultra-reviewer-<N>.md`: a table of findings `# | severity (Critical/Important/Minor) | file:line | finding | evidence (command + output, or quote) | suggested fix`. Only findings you verified. Then end with `Status / Summary / Concerns`.
