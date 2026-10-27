# Planning packet — `/ak:plan --ultra --tdd`, Lesson 07 (Data Modeling)

Immutable input for the five planner candidates and the plan verifier. Do not edit during the ultra pass.

## 1. Task

Write ONE complete, executable implementation plan (TDD mode) that turns `evidence-packet.md` into a finished Lesson 07 teacher guide the learner can study tomorrow. The controller (main session) executes it, optionally with delegates that own disjoint files.

Plan directory: `plans/261027-1328-lesson-07-data-modeling-teacher-guide/` (holds stub `plan.md` and `phase-01-start.md` from `ak plan create`; the winning candidate replaces both).

## 2. Inputs (authority order)

1. `evidence-packet.md` in this folder — request, settled interpretation, learner profile, content scope (§4), measured facts (§5), constraints (§6). Its decisions are settled.
2. `Tài Liệu/advanced_backend/7. Data Modeling.md` — the 43 slides.
3. `reports/advanced_backend/lesson_14_locking_teacher_guide.html` — the shell and quality bar (read at least lines 1–430 and 1536–1640 and the script block from line 2304).
4. The handoffs named in the evidence packet §3 (learning mode, roadmap, OmniPOS bridge).

Do not open other `reports/planner-ultra-candidate-*.md` files.

## 3. What the plan must decide (open design space)

- **Stage map**: how the 43 slides + normal forms + polymorphic + double-entry ledger split into ~8 stages with times, slide ranges, and a realistic one-day budget (core vs optional).
- **Lab design (DBX-first)**: the file set under `labs/lesson-07-data-modeling/` — e.g. one idempotent `00-setup.sql` runnable by `Ctrl+A → Run` in DBX that builds `lab07_modeling` from read-only sources, a `check.sql` returning ✔/✘ rows for the invariants, and one self-contained experiment `.sql` per stage whose text is exactly what the guide shows. How the controller runs them non-interactively (docker exec psql) and records outputs verbatim (where, which format) so every number in the guide traces to a recorded file. Two-session experiments (if any) need a recorded A/B timeline.
- **Measurements per slide claim**: for every slide with a MySQL-specific or questionable claim, which experiment proves the PG 16 behaviour and which verdict chip it gets. Include at least: FK cost and missing FK index (11), app-level FK check race producing an orphan (11, two sessions), fast vs rewriting ADD COLUMN (14), JSON/jsonb with expression & GIN index EXPLAIN (15–17), `CREATE INDEX` vs `CONCURRENTLY` lock behaviour (18), text vs varchar (22), float vs numeric money (23), timestamp vs timestamptz (24), NULL cost/semantics (25), float ordering exhaustion and a fix (28), availability rows via `generate_series` and/or a `btree_gist` exclusion constraint against double booking (29–31), tags array + GIN vs join table EXPLAIN (32), materialized view refresh (33), view inlining in EXPLAIN vs MySQL MERGE/TEMPTABLE (39–43).
- **Normal forms, polymorphic, ledger**: the concrete tables and SQL demos (anomalies shown, orphan rows shown, ledger invariant `SUM(amount) = 0` per transfer and per system enforced/checked, cached balance reconciliation, posting with lesson-14 locking).
- **Widgets** (`--ak-render`): which interactive/visual blocks (ERD diagrams in inline SVG, normalization stepper, float-bisection simulator, ledger posting simulator, type picker, etc.) and what recorded data each reads.
- **Walkthrough → challenge**: per stage a worked example, then a learner task with acceptance criteria; homework (slide 35 flight booking schema with the table template) with a self-check SQL the learner runs in DBX; a Prisma 7.9 schema review drill (AI-written `schema.prisma` with seeded mistakes: Float money, missing `@db.Timestamptz`, unindexed FK, polymorphic without integrity, etc.) — how the drill's claims are verified without reading `node_modules`.
- **Assessment**: quizzes per stage, 10 interview questions, cheat sheet, slide map with chips, references, "tiếp theo" bridge (OmniPOS Cluster 1 phase B / Boss Challenge 1, then Cluster 2 lesson 06 Redis).
- **Verification**: a guide verification step (HTML validity, every `data-run`/number traced to a recorded file, every slide 1–43 mapped, storage keys only `l07-*`, no external scripts, render-check at 375/768/1440 without overflow or runtime errors, dark/light), plus SQL invariants.
- **Post-implementation**: `/ak:code-review --ultra` (5 independent reviewers + verifier, union of verified findings), fix Critical/Important, re-run affected checks; docs update (README lab/guide route + `TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 07); final gate; a short handoff note so the learner can start tomorrow.

## 4. Execution model the plan must fit

- Work on `main`; no git step except `git status` checks.
- The controller owns: setup/check SQL, all DB runs (serial), recorded outputs, guide assembly, verification, docs. Delegates may write separate files in parallel only with disjoint ownership (e.g. one stage's experiment SQL + its HTML fragment file each) against a frozen contract (schema DDL, fragment format, CSS class vocabulary, data-run ids); the controller assembles.
- TDD here means: `check.sql` invariants, the expected-result table for every experiment (claim → expected PG 16 result → verdict chip), and the guide verification script are written **before** the experiments and the HTML they check; each phase ends with runnable verification commands and expected results.
- Realism: the guide must be ready for tomorrow. Keep the build lean (no framework, no build step, no npm dependency for the learner).

## 5. Required output

Write exactly one file: `plans/261027-1328-lesson-07-data-modeling-teacher-guide/reports/planner-ultra-candidate-<N>.md` (N = your slot). Structure it as concatenated files, each introduced by a line `=== FILE: <name> ===`:

1. `=== FILE: plan.md ===` — YAML frontmatter (`title`, `description`, `status: pending`, `priority: P1`, `effort`, `branch: main`, `tags`, `blockedBy: []`, `blocks: []`, `created: 2026-10-27`), then: Overview (outcome in 3–5 sentences), Stage map table (stage → slides/topics → minutes → experiments → widget), Phases table (#, name, effort, depends on, gate), Expected-result matrix (experiment → claim → expected PG 16 result → chip), Acceptance criteria (numbered, checkable, mapped to phases), Risks and rollback, Open questions for the user (only genuine ones).
2. One `=== FILE: phase-NN-<kebab-slug>.md ===` per phase, each with frontmatter (`phase`, `title`, `status: pending`, `priority`, `effort`, `dependencies`) and sections: Goal · Files to create/modify (full paths, owner: controller or delegate) · Tasks and steps · Test matrix (TDD: test first, expected result, command) · Verification (commands) · Risks and rollback.

Length: 3,500–6,000 words total. Plain, direct sentences; tables where they help. Write in English (deliverables are Vietnamese).

Finish with a final message containing only:
```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
File: <path>
Summary: one or two sentences
Concerns/Blockers: optional
```
