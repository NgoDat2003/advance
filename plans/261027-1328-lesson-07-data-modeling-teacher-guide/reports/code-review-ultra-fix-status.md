# Ultra code review — fix status (controller, 2026-10-27)

Source: `code-review-ultra-verdict.md` (5 reviewers, 72 raw → 34 unique; 28 CONFIRMED, 5 PLAUSIBLE, 1 REJECTED). Every fix below was followed by a re-recorded run where SQL changed, and by the full gate (`verify-guide.mjs` V01–V16, `--runs` 50 rows, `--data`, `negative-tests.sh` 8/8, `rerun-gate.sh` 61/61, render-check light + dark, `widget-smoke.mjs`).

| ID | Sev | Status | Fix / evidence |
|---|---|---|---|
| U1 | Critical | fixed | `CREATE OR REPLACE FUNCTION` ×2 in `09-ledger#ddl`; new gate `verify/rerun-gate.sh` runs each region twice in one session (proved it catches the old bug: 0 → 1 error) |
| U2 | Important | fixed | `04#lock` now also measures `SET (fillfactor = 90)` → ShareUpdateExclusiveLock; prose stage 4, shell recap, EXAM 3, quiz 4.2 corrected; X50 |
| U3 | Important | fixed | `05#money` compares same rounding: unrounded 1265793.038653364 vs 1265793.0395, per-line 1265792.95 vs 1265793.29; prose, W5, quiz 5.2, EXAM 5; X49 |
| U4 | Important | fixed | race sleep 3 s → 6 s (both regions), re-recorded 3×: exactly one 40P01, victim A; ordered 0 deadlocks; box reworded as a rule; quiz 9.4 |
| U5 | Important | fixed | stage-4 answer renamed `my_c4_stores` + `DROP TABLE IF EXISTS` |
| U6 | Important | fixed | H8 checks booking/ticket tables for a unique index (incl. partial) or EXCLUDE covering flight + seat |
| U7 | Important | fixed | stage-7 answer → `DISTINCT ON` view, recorded (`runs/07-challenge-answer.txt`, X48), PASS text aligned |
| U8 | Important | fixed | stage-3 answer: conditional INSERT in A, conditional DELETE after FOR UPDATE in B; recorded both orders, 0 orphans (`runs/03-challenge-answer.txt`, X47) |
| U9 | Minor | fixed | `3nf`, `arc`, `join`, stage-6 answer rerunnable; `2nf` comment warns CASCADE drops stage-7 views |
| U10 | Minor | fixed | stage 4 explains psql's decimal point |
| U11 | Important (plausible) | fixed | B#cic `lock_timeout = '15s'`; quiz 4.4 why, W4, EXAM 4 corrected; CIC re-recorded (valid index) |
| U12 | Minor | fixed | shell wording; race A comment explains DBX behaviour |
| U13 | Minor | fixed | `ledger_no_update_delete` trigger (23001) + region `attack-edit`, stage 9 section, EXAM 8; X46 |
| U14 | Minor | fixed | `cs_clicks` comment states the real distribution |
| U15 | Minor | fixed | `availability` drops `cs_stays` explicitly, no CASCADE |
| U16 | Minor | fixed | X33 regex requires no Subquery Scan |
| U17 | Minor | fixed | W2 3NF title |
| U18 | Important | fixed | stage-5 answer has `SET search_path` + DROP |
| U19 | Important | fixed | V07 token-boundary match, and 1–2 digit values must be a standalone result cell; negative test b2 (1 → 7) now RED; new V16 checks numbers in quiz `why` and EXAM (caught 2 stale values) |
| U20 | Important | fixed | DEFERRED rationale corrected in SQL comment and stage 9 |
| U21 | Minor | fixed | W10 third verdict for the GROUP BY view; stage-7 slide-41 text |
| U22 | Minor | fixed | stage-3 answer tabs `lock_timeout = '15s'` |
| U23 | Minor | fixed | CIC times wrapped in `b.m` |
| U24 | Minor | fixed | CIC waits for older snapshots incl. readers: stage 4, EXAM 4, W4, `#cach-hoc` warning (observed live tonight: a stuck lesson-14 demo session made CIC time out and left the JSON indexes with `indcheckxmin = t`) |
| U25 | Minor | fixed | slide 23 chip → "MySQL đúng, PG khác", new region `int-width` (`1::int(1)` → 42601), anchor `sl-23`; X45 |
| U26 | Minor | fixed | stage 8: Prisma 7.4+ `partialIndexes` preview |
| U27 | Minor | fixed | stage 7: `GRANT USAGE ON SCHEMA` |
| U28 | Minor | fixed | "≈ 18 micro giây" derived from the two recorded timings |
| U29 | Minor | fixed | "dòng có 3 cột NULL" |
| U30 | Important | fixed | stored sizes measured (`ty_stored`: 9 \| 9 \| 9); prose, quiz 5.1, W5 |
| U31 | Minor | fixed | race B comment |
| U32 | Minor | rejected (as verdict) | `btree_gist` placement is intended; note added to `99-cleanup.sql` |
| U33 | Minor | fixed | EXAM 7 wording |
| U34 | Minor | fixed | H2 flags any `timestamp` column; new H9 idempotency key |

Residual: DBX GUI behaviour for multi-statement `BEGIN … COMMIT` and GUI CIC is not machine-tested (MCP blocks transaction statements); the learner history (lesson 12/14) shows BEGIN blocks work in DBX.
