# Brainstorm ultra verdict — Lesson 12 (Transaction)

Accepted contract: **Candidate E**, materialised unchanged in `candidate-E.md` (no blending). The must-fix notes below are inputs to the planning phase, not edits to the contract.

```
ultra: picked=5/5 margin=low unanimous=no rejected_all=no
```

Slot → label mapping (revealed after verification): slot 1 = D, slot 2 = A, slot 3 = C, slot 4 = B, slot 5 = E. Candidates ran on the Opus tier; the verifier (kongming) ran on Fable.

## Hard constraints

All five candidates pass (HC1 no branch/push/PR/commit; HC2 lab03/lab_imdb/maycha_lease untouched; HC3 no unmeasured numbers presented as measured; HC4 all 26 slides covered; HC5 PG-vs-MySQL differences handled). The verifier checked each candidate's "checked today" claims on the server (for example 26 ACTIVE contracts for store 44 among ids ≤ 10,000; `transaction_timeout` absent; `hw_contracts` customer 42 rows start at block 523; database-level `search_path = lab03_indexing, public`).

## Scores (1–20)

| Candidate | R1 | R2 | R3 | R4 | R5 | R6 | R7 | Total | R1+R6+R7 |
|---|---|---|---|---|---|---|---|---|---|
| A | 17 | 17 | 18 | 17 | 18 | 17 | 17 | 121 | 51 |
| B | 18 | 18 | 17 | 18 | 17 | 18 | 17 | 123 | 53 |
| C | 16 | 17 | 18 | 18 | 18 | 18 | 19 | 124 | 53 |
| D | 17 | 17 | 16 | 18 | 18 | 18 | 18 | 122 | 53 |
| **E** | **19** | **19** | 18 | **19** | **19** | 17 | 18 | **129** | **54** |

## Ranking

1. **E** — most faithful to the lesson-3 pattern (dataset card, predict, AI-draft review, tự làm, NestJS drill; `l12-*` storage keys) and the best-grounded contract with the most complete trade-offs; its deductions are planning fixes, not direction changes.
2. **C** — safest and lightest lab design with the sharpest checks; held back by an RR-only M1 that misses the roadmap's plain-BEGIN Day 02 demo and a flawed password-grep criterion.
3. **B** — fully verified facts and the only candidate that dry-runs the manual walkthroughs; thinner widgets, a 10 s human race in M2, an overstated "only ms vary" claim.
4. **D** — found the database-level `search_path` (the most important environment fact), but coarser criteria and the heaviest dataset (full 500k copy).
5. **A** — tight contract, but drops two lesson-3 homework elements and an unflagged 15 s `statement_timeout` vs 500k-row UPDATE conflict.

Margin: low (E 54 vs 53 for B, C and D on R1+R6+R7; threshold > 14). Unanimous: no (C leads R7; B, C, D lead R6). Confidence: moderately high — all candidates pass; the decision rests on lesson-3 fidelity and evidence grounding.

## Must-fix notes for the planning phase

1. **Homework B writing load** — keep the 6 × 4 cells as enum values; ask for one "vì sao" line per scenario row (6 lines), not per cell.
2. **SSI failure step** — the controller probe (order A-UPDATE, B-UPDATE, A-COMMIT, B-COMMIT) shows B's UPDATE succeeding and B's COMMIT raising `40001 could not serialize access due to read/write dependencies among transactions`; fix the step order in M3/Lab 08, key the answer as "the second COMMIT", and still re-measure into `lab-runs/`.
3. **Lab 05 overload** — split by concept (large transaction vs idle/abandoned) into two labs or `-part-a/-part-b` (≤ 200 lines, one idea per lab).
4. **M1 step 5 third window** — keep exactly two psql windows; let the GUI observer or window A (after its COMMIT) play the second writer.
5. **AC7 fingerprint** — `n_tup_upd = n_tup_del = 0` is a weak signal (stats counters were reset; `n_live_tup` shows 0 for a 500k table); primary invariants are 500,000 rows, `relallvisible` 5,666/5,666, and id = 1 at xmin 875 / ctid (0,1).
6. **TypeORM version** — resolve the learner's real TypeORM version (npm latest is 1.1.2); pin the docs version quoted in the drill and label any 0.3-vs-1.x difference.
7. **`pg_walinspect` range** — capture `pg_current_wal_lsn()` before BEGIN and after COMMIT, query that range, filter by the lab's xid (other sessions interleave records), print record types and relative offsets only.
8. **Homework D is lesson-14 scope** — keep the `SELECT … FOR UPDATE` part as an explicitly optional bridge after the exam so stage 8 does not overrun.
9. **Missing packet constraint** — carry "Markdown only under `plans/` or `docs/`" into the plan.
10. **Database-level search_path** — `advance_be_lab` has `search_path = lab03_indexing, public`; every lab session and every psql window must run `SET search_path = lab12_transaction` (and the plan must say why), so no unqualified name lands in lesson 3's schema.
