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
Make the guide discoverable, prove nothing outside scope changed, and leave the lab ready for the learner with a resume note.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/README.md`:
  - line 14 lab list: add `labs/lesson-06-redis/` (redis-cli);
  - tree: add `lesson_06_redis_teacher_guide.html` and `lesson-06-redis/`.
- `D:/study/advance-be/TONG_QUAN_KHOA_HOC_ADVANCED_BACKEND.md` row 06. Original labs cell: `` `labs/lesson-02-caching/06-*.mjs` ``. New cell: `` `labs/lesson-06-redis/` (redis-cli)<br>`reports/advanced_backend/lesson_06_redis_teacher_guide.html` `` (keep the L02 path too).
- `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` line 3335 and `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/shell-tail.html` line 187 (must-fix 6, so a lesson-07 rebuild keeps the link): wrap "Bài 06 Redis" in `<a href="lesson_06_redis_teacher_guide.html">…</a>`. Each is a one-line change; skip a file if its line differs. <!-- consistency sweep: must-fix 6 -->
- `D:/study/advance-be/plans/handoffs/lesson-06-redis-guide-ready-20261101.md`
- Plan folder: `runs/00-fingerprint-after.txt`, `runs/final-gate.txt`.

## Tasks and steps
1. Make the four doc edits; read each file first.
2. Run `bash verify/fingerprint.sh > runs/00-fingerprint-after.txt` and `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt` (rc 0). Every container present at baseline must be unchanged (hash line + Up/Exited); new containers, such as Phase B's hub containers, are listed as info and allowed; `port6380_lab=none`; `main_bind=127.0.0.1:6379`; `run_id_match=yes`. <!-- red-team #5 -->
3. Final gate table in `runs/final-gate.txt`. Rows:
   - verifier (V01–V16, V19), `--runs` (M01, D01, V18), `--data`, `--lint` (V17);
   - negatives (19/19, 0 SKIP);
   - widget-smoke;
   - render light/dark;
   - `check.sh` rc 0 with every row ✔ or `–`;
   - fingerprint `--compare` rc 0;
   - lesson-07 verifier regression (`node plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs --only V01,V02,V03,V10`);
   - `git status --short` paths ⊆ {the guide, `labs/lesson-06-redis/`, this plan folder, README, TONG_QUAN, lesson-07 guide, lesson-07 `assembly/shell-tail.html`, handoff}.
4. Leave the lab ready for the learner. Do not run `99-cleanup.sh`. <!-- red-team #11 -->
   1. Stop the extras by exact name with `00-containers.sh down replica`, `down cluster`, `down evict`, `down persist`. These remove only those containers; main and network `advance-be-l06` stay.
   2. `00-containers.sh reset main`, then pipe `00-seed.redis` into main.
   3. `bash labs/lesson-06-redis/check.sh` → rc 0, main rows ✔, extras `–`. Record the output and `docker ps --filter name=advance-be-redis` in `final-gate.txt`.
5. Handoff note covers:
   - what exists;
   - how to start (`00-containers.sh up main`, `00-seed`, `check.sh`; extras come up per stage);
   - stage times;
   - deviations;
   - the run date;
   - the next step (Cluster 2 → K2 Bài 04, OmniPOS M2, Boss Challenge 2).
   No commit, branch or push.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fingerprint | rc 0 (baseline containers unchanged; new ones allowed) | `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt` |
| learner state at handoff | rc 0, ✔ / `–` only | `bash labs/lesson-06-redis/check.sh` |
| docs links resolve | files exist | `ls` each linked path |
| lesson-07 not broken | GREEN on listed codes | lesson-07 verifier command above |
| scope of changes | only expected paths | `git status --short` |

## Verification
`cat runs/final-gate.txt` shows every row ✔.

## Risks and rollback
Doc edits are one-liners with their original text quoted above. Revert by restoring that text. No git operation is used other than `git status`. Learner keys `l06:my:*` and `l06:hw:*` are never touched by this phase.
