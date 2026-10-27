---
phase: 3
title: "Setup, experiments, recorded runs"
status: completed
priority: P1
effort: 3h
dependencies: [2]
---

# Phase 03 — Setup, experiments, recorded runs

## Goal
Write the learner-facing SQL, run it serially, and record every output verbatim until `--runs` is GREEN or each deviation is logged.

## Files to create/modify (all controller; DB runs strictly serial)
`D:/study/advance-be/labs/lesson-07-data-modeling/`:
- `00-setup.sql`, `99-cleanup.sql`
- `01-design-erd.sql`, `02-normal-forms.sql`, `03-foreign-keys.sql`, `03-fk-race.A.sql`, `03-fk-race.B.sql`
- `04-table-format.sql`, `04-index-online.A.sql`, `04-index-online.B.sql`
- `05-data-types.sql`, `06-case-studies.sql`, `07-views.sql`, `08-polymorphic.sql`
- `09-ledger.sql`, `09-ledger-race.A.sql`, `09-ledger-race.B.sql`
- `hw-solution.sql`, `prisma-drill.schema.prisma`

Plan folder: `runs/*.txt`, `verify/deviations.md`.

## Tasks and steps
1. **`00-setup.sql`** steps (qualified names throughout):
   - `CREATE SCHEMA IF NOT EXISTS`;
   - `CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA lab07_modeling`;
   - drop and recreate the two base tables from the northwind joins, with PKs, then `ANALYZE`;
   - a summary SELECT ("thẻ dữ liệu").

   It never drops the schema, `hw_*` or `my_*`. `99-cleanup.sql` = `DROP SCHEMA IF EXISTS lab07_modeling CASCADE;`, with a warning that this also removes homework.
2. **Stage files.** Each region follows the contract and produces exactly the evidence its matrix row (X01–X39) names. Statements that mutate shared rows to show an anomaly run inside `BEGIN … ROLLBACK`. Design points that are not obvious from the matrix:
   - `03#cost`: `fk_parent` has 20,000 rows; 200,000 inserts go into `fk_child` (FK) and 200,000 into `fk_child_nofk`. `03#index`: `EXPLAIN (ANALYZE, BUFFERS) DELETE FROM fk_parent WHERE id = 5` inside `BEGIN … ROLLBACK`, before and after `CREATE INDEX ON fk_child(parent_id)`, so the "Trigger for constraint" time is visible.
   - Races (`03-fk-race`, `#nofk` / `#fk`): A runs `BEGIN`, A1 checks that store 7 exists, `pg_sleep(6)`, inserts a contract, COMMIT. B starts at +1 s: B1 counts store 7's contracts (0, since A has not committed), deletes the store, COMMIT. An orphan query follows. In `#fk` the same steps hit the FK tables: B waits on A's `FOR KEY SHARE`, then gets 23503.
   - `04-index-online` `#plain`: A runs `BEGIN; CREATE INDEX; SELECT mode FROM pg_locks; pg_sleep(6); ROLLBACK`. B runs a SELECT (returns) and an INSERT with `lock_timeout '2s'` (55P03). `#cic`: A runs `BEGIN; INSERT; pg_sleep(4); INSERT; SELECT mode, granted FROM pg_locks` for B's pid; COMMIT. B runs `CREATE INDEX CONCURRENTLY`, then reads `indisvalid`.
   - `06#ordering`: a recursive CTE halves toward the lower bound until `mid = lo OR mid = hi`, separately for int, float8 and float4. The fix is one `UPDATE … row_number() OVER (ORDER BY pos) * 1000`.
   - `09#ddl`:
     - `wallets` uses the slide-20 template columns, `balance numeric(18,2)` and `CHECK (allow_negative OR balance >= 0)`. The `SYSTEM_CASH` wallet allows negatives.
     - `transfers` has `idempotency_key UNIQUE` and `order_ref` (slide 12).
     - `ledger_entries` has `amount <> 0` and indexed `wallet_id` and `transfer_id`.
     - A `CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` raises `ERRCODE '23514'` when a transfer's Σ ≠ 0.
     - `post_transfer(from, to, amount, key)` locks `WHERE id IN (…) ORDER BY id FOR UPDATE`, then debits before it credits.
   - `09-ledger-race` `#unordered` (raw SQL with entries, so invariants survive): A transfers 1→2, locks 1, `pg_sleep(3)`, then locks 2. B at +1 s transfers 2→1, locking 2 then 1. One 40P01 is expected. `#ordered`: both call `post_transfer` inside BEGIN, and A sleeps 3 s before COMMIT.
   - `prisma-drill.schema.prisma` has these seeded mistakes: `Float` money, `DateTime` without `@db.Timestamptz(3)`, a relation without `@@index`, `commentableType/commentableId`, comma-string tags, and no `@unique` on `idempotencyKey`. It also has one correct decoy (`Json` → jsonb). `hw-solution.sql` builds the model `hw_*` flight-booking schema.
3. Run order: `00-setup` → `check` → `00-setup` again → `check` (diff must be empty) → 01…09 single-session → each `--ab` pair 3× (record run 1, compare 2–3) → `hw-solution` + `hw-check` → `hw-bad-fixture` + `hw-check` → drop `hw_*` → `--runs`.
4. For each failing regex, first fix the SQL if the SQL is wrong. If PG behaves differently from the hypothesis, keep the run, change the chip or narrative, and add a row to `deviations.md` (claim, expected, measured, decision).
5. DBX smoke test (DBX MCP tools, connection `ADVANCE_BE_LAB`): run `09-ledger.sql#ddl` and `03-fk-race` `#nofk` A/B. Record in `runs/dbx-smoke.txt` whether `$$` bodies, BEGIN/COMMIT and `pg_sleep` work in auto-commit vs `Tx: [M]`. This decides the instruction text in `#cach-hoc`.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| setup idempotent | identical check output after 2nd run (header line excluded) | `diff <(tail -n +2 runs/check.txt) <(tail -n +2 runs/check.rerun.txt)` (second run uses `--out check.rerun`) |
| sources untouched | C05, C06 ✔; fingerprint re-query identical to phase 01 | `bash verify/run-lab.sh …/check.sql` |
| no stray objects (negative) | C07 ✔ | same |
| hw-check on solution | all ✔ | `bash verify/run-lab.sh …/hw-check.sql` |
| hw-check on bad fixture (negative) | ✘ on H2, H3, H4, H5 only | same, after the fixture |
| matrix | `--runs` exit 0 | `node verify/verify-guide.mjs --runs` |
| race determinism | 3 runs give the same outcome codes | `grep -c 40P01 runs/09-ledger-race.unordered.*.txt` |
| ledger invariants | C09–C12 ✔ after stage 9 | check.sql |

## Verification
`node verify/verify-guide.mjs --runs`, then `check.sql` (all ✔, C14 ✔ after CIC), then `ls runs/` matches the run-id list in the contract.

## Risks and rollback
The serial DB budget is about 15 minutes of runtime (500k copies, 1M-row sums). Keep the 1M-row regions only in `#money` and `#report`. Rollback: `99-cleanup.sql`, then `00-setup.sql`. Files are new and can be deleted.

