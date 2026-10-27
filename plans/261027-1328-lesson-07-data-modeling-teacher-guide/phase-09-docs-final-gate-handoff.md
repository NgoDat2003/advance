---
phase: 9
title: "Docs, final gate, handoff"
status: completed
priority: P1
effort: 0.5h
dependencies: [8]
---

# Phase 09 — Docs, final gate, handoff

## Goal
Make the guide discoverable, leave the database clean for tomorrow, and write a handoff so Đạt can start at `#cach-hoc`.

## Files to create/modify (controller)
| Path | Change |
|---|---|
| `D:/study/advance-be/README.md` line 14 | Labs list: append `` `labs/lesson-07-data-modeling/` `` (original text: ``…`labs/lesson-12-transaction/`, `labs/lesson-14-locking/` ``). Add `lesson_07_data_modeling_teacher_guide.html` to the `reports/advanced_backend/` tree and `lesson-07-data-modeling/` to the `labs/` tree. |
| `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` line 39 | Column 4: replace `*ERD Design & DDL scripts*` with `` `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`<br>`labs/lesson-07-data-modeling/` `` |
| `D:/study/advance-be/plans/handoffs/lesson-07-guide-ready-20261027-<HHMM>.md` | Short Vietnamese handoff: what was built, the first 3 steps tomorrow (docker start → `00-setup.sql` → `check.sql` with N ✔), the DBX mode for two tabs, files, known variance. |
| plan folder `plan.md` and phase files | Status updated via `ak plan` CLI (run `ak plan --help` first) |

## Tasks and steps
1. Edit the docs, then re-read both edited lines and confirm the paths exist.
2. Reset DB state: run `00-setup.sql`, confirm that no `hw_*` or `my_*` test tables remain (Đạt has not created any yet), then run `check.sql` and record it as `runs/check.final.txt`.
3. Final gate (all must pass):

| Gate | Command | Pass |
|---|---|---|
| DB invariants | `run-lab.sh check.sql` | C01–C08, C13, C14 ✔; C09–C12 ✔ or – (ledger tables kept from the run) |
| fingerprints | diff of the re-queried fingerprint vs `00-fingerprint-before.txt` | identical |
| guide | `verify-guide.mjs` (default, `--runs`, `--data`) | exit 0 |
| negatives | `negative-tests.sh` | all RED as designed |
| render | last report | clean |
| git | `git status --short` | only: `labs/lesson-07-data-modeling/`, `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`, `README.md`, `TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md`, the plan folder, the handoff, plus pre-existing entries |
| processes | `docker exec … psql -Atc "select count(*) from pg_stat_activity where application_name like 'l07-%'"` | 0 |

4. Do not commit, push or branch. Leave the changes for Đạt.

## Test matrix
The final gate table above is the test matrix. Two more checks are added:
- `ls` confirms that both doc-linked paths exist.
- `grep` confirms that the handoff contains `#cach-hoc` and `00-setup.sql`.

## Verification
Run the gate, then report the guide path, the run folder and the deviations to the user.

## Risks and rollback
A doc edit conflicting with parallel roadmap edits in the README: change only the named lines. Rollback: restore the quoted original text. Leaving `lab07_modeling` populated is intended, and `99-cleanup.sql` exists if Đạt wants it gone.
