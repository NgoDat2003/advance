---
phase: 8
title: "Ultra code review and fixes"
status: completed
priority: P1
effort: 1h
dependencies: [7]
---

# Phase 08 — Ultra code review and fixes

## Goal
Get an independent review of the SQL, the guide and the verifier, and fix every verified Critical or Important finding.

## Files to create/modify
Review reports go to `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/reports/` (written by the review skill). Fixes go to the owning files from phases 02–06 (controller).

## Tasks and steps
1. Run `/ak:code-review --ultra` (5 independent reviewers + verifier, union of verified findings). Scope: `labs/lesson-07-data-modeling/*`, `assembly/*`, `verify/*`, the generated guide, `runs/deviations.md`. Give the reviewers `evidence-packet.md` §4–§6 and the matrix as the spec, not this plan's conclusions. Focus: chip correctness on PG 16, SQL safety (search_path, timeouts, schema-only writes), number traceability, plain Vietnamese without over-engineering, 375 px accessibility, Prisma 7.9 claims.
2. Triage. Fix Critical and Important findings. Record any rejection with its verification source (file:line or a run).
3. If a fix touches a `.sql` file: re-run that file (`run-lab.sh`), then `--runs`, `--data`, re-assemble, and run the full verify. If it touches only HTML or JS: re-assemble, full verify, and render-check.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| post-fix full suite | all GREEN | `node verify/verify-guide.mjs && node verify/verify-guide.mjs --runs && node verify/verify-guide.mjs --data && bash verify/negative-tests.sh` |
| DB state after re-runs | check.sql all ✔ | `bash verify/run-lab.sh labs/lesson-07-data-modeling/check.sql` |

## Verification
The findings table shows a status for every item (fixed / rejected with source).

## Risks and rollback
A late SQL fix changes recorded numbers. The re-run updates the run files, and V07 then forces the prose to follow. Rollback a fix by reverting the single owning file from the reviewer-provided diff.

