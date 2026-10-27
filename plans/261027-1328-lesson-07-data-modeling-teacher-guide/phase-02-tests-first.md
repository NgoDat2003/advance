---
phase: 2
title: "Tests first: check.sql, expected matrix, verifier, runner"
status: completed
priority: P1
effort: 1h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Write every check before the code it checks exists, and show that each one starts RED.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/labs/lesson-07-data-modeling/check.sql` | controller |
| `D:/study/advance-be/labs/lesson-07-data-modeling/hw-check.sql` | controller |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/expected.tsv` | controller |
| `…/verify/verify-guide.mjs` | controller |
| `…/verify/run-lab.sh`, `…/verify/merge-timeline.mjs` | controller |
| `…/verify/negative-tests.sh`, `…/verify/hw-bad-fixture.sql` | controller |

## Tasks and steps
1. **`check.sql`** (learner runs it in DBX). It uses only qualified names and `to_regclass()` guards so that a missing object yields ✘, not an error. Output columns: `ma | ket_qua (✔/✘/–) | chi_tiet`.
   - C01 schema exists. C02 `btree_gist` has `extnamespace = lab07_modeling`.
   - C03 `order_sheet` = 2155, `order_sheet_raw` = 830. C04 `sum(quantity)` of `order_sheet` equals the northwind sum.
   - C05 northwind counts and md5 equal the phase-01 constants. C06 hw_contracts count, sum and max equal the constants.
   - C07 no registry name outside `lab07_modeling`. C08 `pg_db_role_setting` still `search_path=lab03_indexing, public`.
   - C09–C12 (– until `ledger_entries` exists): unbalanced transfers = 0, Σ all entries = 0, cached-vs-derived balance mismatches = 0, no negative non-system wallet.
   - C13 no `idle in transaction` session whose query mentions `lab07`. C14 no `indisvalid = false` index in `lab07_modeling`.
2. **`hw-check.sql`** (homework self-check, slide 35) prints one ✔/✘ row per `hw_%` table and rule:
   - H1 has a PK.
   - H2 has timestamptz `created_at`/`updated_at`.
   - H3 has `version int`.
   - H4 has no float column named like `price|amount|fare|total|fee`.
   - H5 every FK column leads an index.
   - H6 status columns have a CHECK or an enum.
   - H7 has no `json` (only `jsonb`).
   - H8 a seat UNIQUE or EXCLUDE constraint exists.
   - H0 prints "chưa có bảng hw_*" when there are no `hw_` tables.
3. **`hw-bad-fixture.sql`** (controller-only). It creates `hw_flights`/`hw_bookings` with `fare double precision`, `departs_at timestamp`, an unindexed `flight_id` FK and no `version`.
4. **`expected.tsv`** holds the plan matrix X01–X39 with columns `id, run, region, regex, claim, expected, chip, status(expect|deviation)`. Regexes target psql text, e.g. X21 `09:00:00\+07` and `02:00:00\+00`; X10 `orphans\s*\|?\s*1`; X37 exactly one `40P01`.
5. **`run-lab.sh <file.sql> [region]`**. It runs `docker exec -i -e PGAPPNAME=l07-runner quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -v ON_ERROR_STOP=0 -v VERBOSITY=verbose -a -c '\timing on' -f - < file`. The first line it writes is `-- chạy lúc $(date '+%d/%m/%Y %H:%M %z') · PostgreSQL 16.15 · psql trong container`. Output goes to `runs/<stem>[.<region>].txt` (`--out <name>` overrides it), and nothing in the output contains a connection URL. `run-lab.sh --ab <A.sql> <B.sql> <region> <delayB>` extracts the region with awk, runs A in the background with `PGAPPNAME=l07-A`, sleeps `delayB`, runs B as `l07-B`, waits for both, writes `.A.txt`/`.B.txt`, and calls `merge-timeline.mjs`. The merge splits each output into blocks at the `A1`/`B1` marker rows and sorts the blocks by `luc`. Error lines stay in the block of the step that raised them.
6. **`verify-guide.mjs`** (Node built-ins only; controller tool, never shown to the learner). It has four modes:
   - `--runs`: each expected.tsv regex must match its run region. A `deviation` row needs an entry in `deviations.md`.
   - `--data`: each numeric leaf of `runs/data/wN.json` must appear in one of its `sources` after normalisation (strip thousand separators, unify decimal point).
   - `--fragment <file>`: runs V05–V07, V09 and V12 on one fragment. `--only V01,V04,…` runs a subset.
   - Default (whole guide):
     - V01 size ≤ 280 KB.
     - V02 tag balance (stack parser, skips script/style), unique ids, every `#href` target exists.
     - V03 required section ids (`cach-hoc`, `chang-1…9`, `bai-tap`, `prisma-drill`, `phong-van`, `cheat-sheet`, `ban-do-slide`, `tham-khao`, `tiep-theo`).
     - V04 SLIDES 1–43 complete, chips valid and equal to expected.tsv.
     - V05 every `pre[data-sql="file#region"]` equals the region text after HTML unescape and CRLF normalisation.
     - V06 every non-`…` line of `pre[data-run]` appears in order in the run file.
     - V07 every `b.m[data-run]` value appears in its run.
     - V08 the `run-wN` JSON deep-equals `runs/data/wN.json`.
     - V09 storage keys `l07-` only, no `l14-`.
     - V10 no `<script src`, only fonts.googleapis/gstatic outside, every `img src` resolves on disk.
     - V11 QUIZ 1–9 have 4 questions each with a valid `ans`; EXAM has 10.
     - V12 each stage has `.goal`, `dl.wwh`, `.callout.challenge`, a quiz slot.
     - V13 run-label dates equal the run-file header dates.
     - V14 dark-mode selectors and a body background are present.
     - V15 no `postgres://` or `password` in the guide or in `runs/`.
7. **`negative-tests.sh`** copies the guide to `verify/tmp/`, applies one mutation per case with `sed`, and asserts exit ≠ 0 plus the expected V-code in stderr. Cases: (a) one char changed in a `data-sql` block, V05; (b) a `b.m` value changed to an unrecorded number, V07; (c) a `data-store="l14-x"`, V09; (d) slide 17 deleted from SLIDES, V04; (e) an injected `<script src=…>`, V10; (f) a fake run file that misses the X12 regex, `--runs` fails.

## Test matrix
| Test | Expected now (RED) | Command |
|---|---|---|
| check.sql before setup | C01–C04 ✘, C05–C08 ✔, C09–C12 –, no SQL error | `bash verify/run-lab.sh labs/lesson-07-data-modeling/check.sql` then read `runs/check.txt` |
| `--runs` | exit 1, 37 × "missing run" (X15, X34 are merged into X12, X29) | `node verify/verify-guide.mjs --runs` |
| default | exit 1, V01 "guide missing" | `node verify/verify-guide.mjs` |
| runner idempotence of naming | two runs overwrite the same file | `ls runs/` |

## Verification
The three RED results above are recorded in `runs/red-baseline.txt`. That check.sql run is the first database touch, and it is read-only.

## Risks and rollback
A verifier that is too strict (e.g. V06 on wrapped lines) would block delivery. Allow `…` lines and whitespace normalisation only; anything else must match exactly. Rollback: delete `verify/` and the two `.sql` files.

