---
phase: 10
title: "Docs, final gate, learner-ready state, handoff"
status: pending
priority: P1
effort: 0.5h
dependencies: [9]
---

# Phase 10 — Docs, final gate, handoff

## Goal
The guide is discoverable, nothing outside scope changed, the lab is ready, and a resume note exists.

## Files to create/modify (owner: controller)
- `README.md`: lab and guide paths in the Khóa 3 section (≈ line 29) and the tree.
- Curriculum artifacts line, identical in `generate_master_curriculum_reports.py:447`, `reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md:419` and `.html:1806`: replace `Slide 39 trang kèm so sánh ưu nhược điểm 5 thuật toán Rate Limiting.` with the lab and guide paths; do not regenerate.
- L06 one-liners `reports/advanced_backend/lesson_06_redis_teacher_guide.html:4532` and `plans/261031-1651-lesson-06-redis-teacher-guide/assembly/shell-tail.html:219`: wrap "K2 Bài 04 Rate Limiting" in `<a href="../Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html">`; skip if the line differs.
- `plans/handoffs/k2-lesson-04-caching-guide-ready-<yyyymmdd>.md`; `runs/00-fingerprint-after.txt`, `runs/final-gate.txt`, `verify/tmp/docs-before/`.

## Tasks

**T10.1 Doc edits.**
- **Goal:** one-line edits only.
- **Target:** the 6 files.
- **Steps:** copy each file into `docs-before/`, read it, then edit it.
- **Success:** each diff is the single intended change.
- **Verify:** `for f in generate_master_curriculum_reports.py reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md; do diff $P/verify/tmp/docs-before/$(basename $f) $f | grep -c '^>'; done` → `1` each; `node plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs --only V01,V02,V03,V10; echo rc=$?` → `rc=0`

**T10.2 Final gate.**
- **Goal:** one ✔ table.
- **Target:** `final-gate.txt`.
- **Steps:** record the phase 08 results, `check.sh`, the fingerprint after-file and `--compare`, and `git status --short` checked against the allow-list. The allow-list is `$L/`, `G`, `$P/`, README, the 3 curriculum files, the 2 L06 files, the handoff, and the pre-existing `plans/261031-1651-lesson-06-redis-teacher-guide/.claude/`.
- **Success:** every row ✔.
- **Verify:** `grep -c '✘' $P/runs/final-gate.txt` → `0`

**T10.3 Learner-ready state.**
- **Goal:** what Đạt finds when he starts.
- **Target:** none.
- **Steps:**
  1. Do not run `99-cleanup.sh`.
  2. `down cluster`; `down crash` if it is up.
  3. `reset main`, then re-seed.
  4. Keep `k2l04_counter`.
- **Success:** main is seeded; extras show `–`.
- **Verify:** `bash $L/check.sh; echo rc=$?` → `rc=0`; `docker ps --filter name=advance-be-k2l04 --format '{{.Names}} {{.Ports}}'` → exactly `advance-be-k2l04-redis 127.0.0.1:6381->6379/tcp`

**T10.4 Handoff.**
- **Goal:** a resume note.
- **Target:** the handoff file.
- **Steps:** cover what exists, how to start (`up main`, `up cluster`, DBX, the PG setup region), stage times, deviations, run dates, and the next steps: OmniPOS M2 FR-M2-05, then Boss Challenge 2.3. No commit or push.
- **Success:** it links `G`.
- **Verify:** `grep -c 'k2_lesson_04_caching_teacher_guide.html' plans/handoffs/k2-lesson-04-caching-guide-ready-*.md` → ≥ `1`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| L06 and foreign untouched | rc 0 | fingerprint `--compare` |
| scope | ⊆ allow-list | `git status --short` |

## Risks and rollback
Restore any doc from `docs-before/`. No git command other than `git status`.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.
