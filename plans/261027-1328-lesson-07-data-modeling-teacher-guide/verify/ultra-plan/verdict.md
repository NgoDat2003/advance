# Ultra-plan verdict — Lesson 07 (Data Modeling) teacher guide

Verifier: kongming (Claude Fable 5.1), 2026-10-27 (Asia/Saigon). Inputs: `planning-packet.md`, `evidence-packet.md`, `planning-rubric.md`, candidates A–E (anonymized). Spot-checks run read-only against PG 16.15 in `quan-ly-hop-dong-postgres-1` and against PG 16 source (`matview.c`, `rewriteHandler.c`), the slides `.md`, the asset folder and the lesson-14 guide.

## 0. Facts verified this session (used in P4 scoring)

| Fact | Result | Who relies on it |
|---|---|---|
| `CREATE INDEX CONCURRENTLY` inside a plpgsql `DO`/function (a `try_sql` helper) | `ERROR 25001: CREATE INDEX CONCURRENTLY cannot be executed from a function`; with an `EXCEPTION` block the caught SQLSTATE is still `25001` (message becomes "cannot run inside a transaction block") | A e04.7, B E04b, D s4c, E X17 — all correct |
| CIC inside `BEGIN … ROLLBACK` | `25001` | same — correct |
| `REFRESH MATERIALIZED VIEW … CONCURRENTLY` without a unique index | `ERRCODE_OBJECT_NOT_IN_PREREQUISITE_STATE` = `55000` (matview.c REL_16); unpopulated MV + CONCURRENTLY = `0A000`; no `PreventInTransactionBlock`, so it may run inside a transaction/function | A e07.2, C e19, D s7·1, E X29 — correct |
| `UPDATE` on a non-auto-updatable (aggregate) view | `ERRCODE_OBJECT_NOT_IN_PREREQUISITE_STATE` = `55000` (rewriteHandler.c `rewriteTargetView`) | B E07, C e20 correct; **A e07.4 says `0A000` — wrong** |
| `WITH CHECK OPTION` violation | `44000` | A, D, E — correct |
| Lesson-14 shell landmarks | CSS ends line 239; `<script>` at 2304; `GUIDE_DATA_END` then IIFE at 2398; `$` helper at 2400 | D's "lines 1–239 / 2398–2473" hold; A/B/E's "lines 1–239, 2304+" hold |
| Slide images present | pages 01, 05, 07, 09, 10, 15, 17, 20, 22, 27, 28, 29, 30, 31, 35, 37, 41 | A/B/C/E lists (5, 7, 9, 10, 15, 17, 20, 22, 27–31, 35, 41) are correct; 01 and 37 also exist |
| Slide headings | 43 "## Trang N" headings; 38 is an untitled divider; 39–43 the View appendix | all candidates map 38 as divider/no-claim — correct |
| Extensions installed in `advance_be_lab` | plpgsql, pageinspect, pgstattuple, pg_trgm, pg_walinspect, pgrowlocks; `btree_gist` not installed (available per evidence) | every candidate installs `btree_gist` into `lab07_modeling` — consistent |

## 1. Hard-constraint check

| # | Constraint | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 1 | No branch/worktree/commit/push/PR/issue/label | pass (only `git status`) | pass | pass | pass | pass |
| 2 | Writes only `lab07_modeling` | pass (lint grep + C12 catalog check) | pass (lint + L8) | pass (lint + K-rows) | pass (grep + C8 guard) | pass (region `SET search_path` + C07) |
| 3 | Learner never runs/reads a `.mjs` harness | pass (`verify.mjs`/`assemble.mjs` controller-only, "never shown to the learner") | pass (tools in plan folder) | pass; note: stress `\gexec` psql one-liner is "shown to Đạt as optional terminal command" — psql, not Node, so not a violation | pass | pass |
| 4 | Lesson 07; all four content blocks (43 slides, NF, polymorphic, ledger) | pass | pass | pass | pass | pass |
| 5 | Test-first verification per phase (test matrix + commands) | pass | pass | pass | pass | pass |
| 6 | Output structure `=== FILE: plan.md ===` + phase files with frontmatter | pass (8 phases) | pass (7) | pass (8) | pass (7) | pass (9) |

No candidate is disqualified. Word counts: A 8,791 · B 6,884 · C 6,895 · D 7,225 · E 7,408 (all over the 6,000 target; A by 47%, treated as minor per the caller).

## 2. Score table (1–20 per criterion)

| Cand. | P1 Scope | P2 Exec. | P3 TDD | P4 PG | P5 Teach | P6 Safety | P7 Deliv. | Total | P1–P3 |
|---|---|---|---|---|---|---|---|---|---|
| A | 19 | 15 | 19 | 15 | 18 | 17 | 13 | 116 | 53 |
| B | 18 | 16 | 18 | 18 | 17 | 17 | 16 | 120 | 52 |
| C | 18 | 17 | 17 | 18 | 17 | 17 | 17 | 121 | 52 |
| D | 18 | 16 | 17 | 18 | 18 | 18 | 15 | 120 | 51 |
| E | 18 | 17 | 17 | 18 | 18 | 18 | 16 | 122 | 52 |

### Evidence per row

**A.** P1 19: the only plan that lists a chip for every slide 1–43 inline (plan.md "Slide → stage → verdict chip") and honours every settled decision. P2 15: exact paths and 4+4 disjoint delegates, but the tooling is the heaviest of the five (`verify.mjs` with 4 modes plus good/bad self-test fixtures, `assemble.mjs`, `lint-sql.sh`, `run-sql.sh`, `run-pair.sh`, `run-all.sh`, `fingerprint.sql`, `challenge-check.sql`, `hw-check.sql`, bad fixtures, `.orig` backups) — 10.5 h on a single evening is not realistic. P3 19: strongest rigor — `expected-results.tsv` regexes, 8 named bad fixtures, planted bad lint file, tamper drill on the real artifact, rerun diffs, fingerprint before/after, `{v, src}` widget leaf provenance. P4 15: e07.4 "aggregate view → 0A000" is wrong (55000, verified); e05.2 indexes a 10,000-char md5 string expecting 54000 — a repeated/hex string is compressible by the index-tuple TOAST hack and may fit under 2704 B (C explicitly flags this risk, A does not); everything else checks out (25001, 55000 MV, 23P01, NULLS NOT DISTINCT → 23505, fast default). P5 18: per-stage `challenge-check.sql` grader, "Nhắc nhanh Bài 14" refresher, mechanism widgets, Prisma drill linked to measured proofs. P6 17: all timeouts incl. `idle_in_transaction_session_timeout`, `lock_timeout` on setup, lint, C12; but `00-setup.sql` does `DROP SCHEMA … CASCADE`, wiping learner `my_*`/`bt_*` on rerun with no stated warning. P7 13: most ceremony that produces artifacts the learner never sees; 47% over length.

**B.** P1 18: all 43 mapped, null chips enumerated, four blocks present. P2 16: controller authors and runs SQL itself in phase 03 (no blind delegates — good); but `run-ab.mjs` (two persistent psql processes, 200 ms `pg_stat_activity` polling, `CHỜ` assertions) is the hardest tool in any plan and phase 01 budgets 1 h for it plus the verifier and recorder; setup seeds 1 M clicks, 100 k posts, 73 k availability rows and 204 k ledger entries **with the deferred per-row constraint trigger created before the seed** — 204 k row-trigger firings at COMMIT is a real risk to the stated ≤ 45 s setup budget. P3 18: `expected.json`, SQL↔run SHA-256 manifest (stale-run detection nobody else has), recorder self-tests, 5 mutation tests, negative deferred-trigger test, S-row equality. P4 18: no error found; STORED generated column rewrite, DST slot shift, `pg_stat_progress_create_index`, 55000 for GROUP BY view all correct. P5 17: a "Tự làm" column per stage, widgets W1–W8, ledger links Lab 14.01/`ORDER BY id FOR UPDATE`, OmniPOS Pha B. P6 17: header SETs, `application_name`, S4 activity counters, L8; setup explicitly drops `hw_*` tables on rerun (homework lost). P7 16: lean 7 phases, Alpine psql buffering fallback thought through, 9 h.

**C.** P1 18: all 43 mapped, slide 38 handled, four blocks, Prisma 7.9 drill with 8 seeded mistakes. P2 17: fully concrete bash verification blocks per phase (the most copy-paste-ready plan), `pg_sleep_until` pacing for two-tab runs is the simplest reliable recorder, delegates only for fragments (pipelined behind runs), 8.75 h; cost: 24 experiment files for the controller to author in 3 h and for the learner to open one by one. P3 17: `--self-test` with 12 named mutations, predicate-based `expected-results.json`, `check-negative.sql` (bypasses triggers via `session_replication_role` inside a rolled-back tx), `record.sh` reruns `check.sql` after every run, contradictions log. P4 18: no error found; flags the 54000 compression risk itself; CIC UNIQUE on duplicates → 23505 + `indisvalid=false`; 55000 for aggregate-view UPDATE. P5 17: T-account widget, lock-order panel, stress run, per-stage challenges with `EXCEPT`/23514 acceptance; stage 7 (views) has only a static SVG; the stress test leaks a psql `\gexec` command into the learner's view. P6 17: K13 session check, `record.sh` terminates only `l07-%` backends, lint rejects `GRANT`; `DROP SCHEMA CASCADE` in setup is warned about in stage 0 and the open-questions default. P7 17: lowest effort, final gate re-runs setup to leave a clean state, docs backed up before edit.

**D.** P1 18: all 43 mapped (slide 34 in stage 2 and 8), three polymorphic patterns incl. supertype, four blocks. P2 16: exact paths, verified lesson-14 line references (1–239, 2398–2473), contract with frozen DDL and a learner-visible "Kiểm chứng" grid format; but **five delegates write 17 SQL files blind** and the controller fixes them in phase 3 — the biggest rework risk of any plan for tonight; 11 h effort (6–7 h wall). P3 17: `check.sql` red first, 8-mutation `--self-test`, expected results encoded as ✔/✘ assertion rows inside each experiment (test-first in the SQL itself), `-- EXPECT-ERROR` markers with V11, "learner work survives setup rerun" test, `deviations.md`. P4 18: no error found; adds real insight (`ADD COLUMN timestamptz DEFAULT now()` is a fast default with one distinct value; `int → bigint` rewrites; `'…+07'::timestamp` silently drops the offset; failed unique CIC leaves `indisvalid=false`); P0001 for its own `RAISE EXCEPTION` triggers is self-consistent (not a PG error) though it diverges from the 23514 story used for CHECK. P5 18: concrete Tự làm per stage, DoD checklist, every quiz `why` cites a run id, Prisma drill includes `relationMode = "prisma"` and reads the learner's real migrations (read-only). P6 18: setup never drops the schema or `my_*`/`hw_*`, C8 scans every source schema incl. `maycha_lease`, C9 DB search_path unchanged, fingerprints live inside `check.sql`. P7 15: 11 h, blind-SQL rework, otherwise clean gates and quoted doc lines for rollback.

**E.** P1 18: all 43 mapped with chip/null list, four blocks; 9 stages instead of ~8 (polymorphic and ledger split) — allowed by the packet's "~8". P2 17: exact paths; **region-based SQL files** (`-- #region id` with its own `SET search_path`/timeouts) give a DBX "bôi đen region → Run Selection" fallback and cut the learner file count to 9 + 6 A/B files; setup builds only two base tables (lightest, most idempotent setup of the five — the ledger is built in `09-ledger.sql#ddl`); controller authors all SQL; only 3 fragment delegates; assembler stub-tested with `--allow-stubs` before fan-out; 10 h. P3 17: phase 02 is "tests first" with a recorded RED baseline (`runs/red-baseline.txt`), `expected.tsv` regexes, `negative-tests.sh` (7 mutations) and `hw-bad-fixture.sql` written before any experiment, `--data` leaf provenance with `sources`, V13 run-label date = run header date; weaker than A/C/D only in that the verifier's detection power is proven on the real guide (phase 07) rather than on a fixture in phase 02. P4 18: no error found; GIN on `json` → 42704, `int(1)` → 42601, 25001, 55000, 44000, inlining/pushdown/fence plans all correct. P5 18: nine stages each with a concrete italic challenge, `refund(transfer_id)` idempotent-reversal challenge with 23505 acceptance, region-level run selection matches how Đạt actually works in DBX, 10 EXAM topics enumerated, lesson-14 recap in stage 9. P6 18: per-region `SET search_path` (robust even when a region is run alone), C07 registry-outside-schema, C08 DB search_path, C13 idle-in-transaction, C14 no `indisvalid=false` after CIC experiments, setup never drops learner tables, B regions use `lock_timeout '2s'`. P7 16: 9 small phases, early render of the stub build, docs lines quoted for rollback; 280 KB budget is tight for 9 stages + 10 widgets.

## 3. Ranking and rationale

1. **E (122)** — best fit for "build tonight, study tomorrow": lightest setup, region-based SQL that matches DBX usage and gives a fallback if DBX mis-splits scripts, controller-written SQL (no blind delegates), only 3 fragment delegates, no PG-16 errors, strongest safety checks, and the most concrete per-stage challenges.
2. **C (121)** — nearly tied; most copy-paste-ready verification blocks and the strongest verifier self-test; loses a hair on 24 learner files, a DROP-SCHEMA setup and a psql stress command shown to the learner.
3. **B (120)** — clean and correct, but the `run-ab.mjs` recorder and the deferred-trigger-before-seed setup are the two most likely things to eat the evening.
4. **D (120)** — the best teaching ideas (learner-visible ✔/✘ grid, `now()` fast default, `relationMode`) but five blind SQL delegates and 11 h make it the riskiest build tonight.
5. **A (116)** — the most rigorous TDD and the only complete inline slide→chip map, but the heaviest tooling, one wrong SQLSTATE (0A000) and 47% over length; its ideas are worth grafting, not its build.

## 4. Decision

- **Winner: E**
- **Margin: low** (E's P1–P3 sum 52 equals C's 52 and B's 52; A leads on P1–P3 with 53 but loses on P2/P4/P7, which the caller weighted for tonight's realism).
- **Unanimous: no** (A tops P1 and P3; C tops P7; D ties E on P5/P6).
- **Confidence: medium** — E and C are within one point; the choice turns on setup weight, region ergonomics and delegate count rather than on any defect in C.

## 5. Must-fix notes for the winner (E), to apply when materializing

PG 16 correctness and experiment design:
1. **`03#index` deletes a referenced parent.** E runs `EXPLAIN (ANALYZE, BUFFERS) DELETE FROM fk_parent WHERE id = 5` to show the RI trigger time, but if parent 5 has children the statement ends in 23503 and no timing is shown. Reserve parents with no children (A: ids 20,001–20,010; B/C: a block of unreferenced ids) and delete one of those before/after `CREATE INDEX ON fk_child(parent_id)`. The evidence-packet 16 ms Seq Scan was a *child* delete, not a parent delete.
2. **CIC in a DBX Manual-Commit tab also yields 25001** (verified: inside any open transaction). The `#cach-hoc` text and the `04-index-online` walk table must say to run the CIC step in an auto-commit tab; the 25001 itself is a teaching moment (graft from B's risk row). The region's `SET …` statements are fine in either mode.
3. **54000 test must use incompressible data.** Index tuples are compressed before the 2,704-byte check, so a repeated/hex string may fit. Use `encode(gen_random_bytes(3000), 'base64')`, or `ALTER TABLE … ALTER COLUMN … SET STORAGE EXTERNAL` on the test column before `CREATE INDEX` (index_form_tuple only compresses EXTENDED/MAIN storage). Record whichever happens; C's "if it compresses, say so" rule applies.
4. Keep E's chip/codes as written (42704, 42601, 25001, 55000, 44000, 23P01, 23505 for `NULLS NOT DISTINCT`) — all verified. Do **not** import A's `0A000` for non-updatable views; the code is 55000.

Build realism:
5. **Add a verifier self-test in phase 02** before fragments exist: run `negative-tests.sh` against a 30-line fixture page plus a fixture run file (graft A's good/bad fixtures or C's 12-mutation list). Otherwise a broken V05/V07 is discovered only in phase 07.
6. **Raise the size budget to ≤ 320 KB** (C) or make V01 a warning until the final gate; lesson 14 is ~180 KB with 8 stages and E has 9 stages, 10 widgets and 10 run-data blocks. Excerpt EXPLAIN output with `…` rather than cutting content.
7. **Renumber `expected.tsv`** (X15 and X34 are missing) or keep the gaps documented; the phase-02 "37 × missing run" count depends on it.
8. **`run-lab.sh`:** set `MSYS_NO_PATHCONV=1` before `docker exec` (Git Bash path mangling), print `SELECT version()` instead of hard-coding "PostgreSQL 16.15" in the header, and keep `-v ON_ERROR_STOP=0 -v VERBOSITY=verbose` so every SQLSTATE lands in the run file (as planned).
9. **Stage order:** stage 7 (views, slides 38–43) sits between case studies and polymorphic/ledger. Either keep it (slide order) and add one bridge sentence, or move views to the end of the core day as the optional appendix and run 6 → 8 → 9 contiguous (FK integrity → polymorphic integrity → ledger integrity). Recommended default: keep E's order, add the bridge sentence; do not reshuffle tonight.
10. **Time budget:** 295 core + 90 optional is at the top of "4–5 h". Mark stage 7 (15 min) and the `#calendar`/MV-CONCURRENTLY regions as optional in the plan table so the core lands at ~4 h 40.

Grafts worth taking (each cheap, each named with its source):
11. **D — learner-visible "Kiểm chứng" grid.** End each stage file with a `SELECT id, ok, claim, actual` grid whose rows are the X-ids for that stage. The learner sees ✔/✘ in DBX, and `--runs` can regex the same grid. This is the single best TDD-for-the-learner idea in the set.
12. **D — two extra `04#add-column` rows:** `ADD COLUMN … timestamptz DEFAULT now()` (fast default, 1 distinct value) and `ALTER COLUMN … TYPE bigint` (rewrite). Teaches stable-vs-volatile defaults in two lines.
13. **D — `'2026-10-28 09:00+07'::timestamp` silently drops the offset** as a row in `05#time`; it is the most common Prisma `DateTime` bug.
14. **B/C/D — read `pg_stat_progress_create_index.phase` from the A tab during CIC** (one SELECT) so the "online" claim has a visible phase name.
15. **A — "Nhắc nhanh Bài 14" callout in `#cach-hoc`** (`FOR KEY SHARE`, 23514, `ORDER BY id FOR UPDATE`, 40P01) so stage 9 works even if lesson-14 stage 5 is not done; E has a 5-line recap in stage 9 — move or duplicate it up front.
16. **C — `check.sql` negative injection** (`SET LOCAL session_replication_role = replica` inside `BEGIN … ROLLBACK`, controller-only) to prove C09–C12 actually go ✘.
17. **A — a per-stage challenge grader** (`challenge-check.sql`, rows `—`/✔/✘ by `my_*` presence) is optional; skip tonight if time is short, since E's challenges already name a self-check query each.

Watch-outs inherited from other candidates (do not copy):
18. B's "create the deferred constraint trigger before seeding 204 k entries" would blow the setup budget; E's small ledger built in stage 9 is the right call.
19. A's/C's `DROP SCHEMA … CASCADE` in `00-setup.sql` wipes learner work; keep E's "never drop `hw_*`/`my_*`" rule and the `99-cleanup.sql` warning.

## 6. Reject all: no
