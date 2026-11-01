---
phase: 7
title: "Assemble, verify, render-check"
status: completed
priority: P1
effort: 0.75h
dependencies: [6]
---

# Phase 07 — Assemble, verify, render-check

## Goal
One built guide passing all checks, with negative tests proving the checks bite.

## Files to create/modify (owner: controller)
- `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html` (generated)
- Plan folder: `verify/render/`, `verify/render-dark/`, `runs/verify-full.txt` (`verify/widget-smoke.mjs` already exists from phase 02) <!-- red-team #9 -->

## Tasks and steps
1. `node assembly/assemble.mjs` (no stubs).
2. `node verify/verify-guide.mjs` (V01–V16 and V19 on the guide; V16 = quiz/interview number trace), `--runs` (row checks, M01, D01, V18), `--data` (w1–w9, derived.json), `--lint` (V17) → write `runs/verify-full.txt`. <!-- red-team #9 -->
3. `bash verify/negative-tests.sh` (all 19 cases a–s, 0 SKIP). <!-- red-team #9 -->
4. `node verify/widget-smoke.mjs --guide reports/advanced_backend/lesson_06_redis_teacher_guide.html` drives every widget in headless Chrome against the embedded JSON: no exception, no empty widget, W6 slots equal the recorded `CLUSTER KEYSLOT` values. <!-- red-team #9 -->
5. Render-check, light and dark, with `TMP`/`TEMP` set to `verify/tmp`:
   `node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs reports/advanced_backend/lesson_06_redis_teacher_guide.html --out plans/261031-1651-lesson-06-redis-teacher-guide/verify/render`. Dark uses a copy with `data-theme="dark"`.
6. Fix fragments/shell (never runs) and repeat until clean.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| full verifier | 0 fails (V01–V16, V19) | `node verify/verify-guide.mjs` |
| runs/data/lint | GREEN (incl. M01, D01, V17, V18) | `--runs`, `--data`, `--lint` |
| negatives | 19/19 RED as designed, 0 SKIP | `bash verify/negative-tests.sh` |
| widgets | 0 exceptions, W6 ✔ | `node verify/widget-smoke.mjs --guide …` |
| size | ≤ 520 KB | V01 |
| render 375/768/1440 light+dark | 0 errors, 0 overflow, 0 targets < 44 px | render-check |
| slide images | all exist | V10 |

## Verification
As above; screenshots inspected for horizontal scroll at 375 px.

## Risks and rollback
Wide terminal outputs overflow at 375 px. Mitigation: `pre` scrolls inside its box (`overflow-x:auto`), and tables use the existing `.tablewrap`. Rollback: regenerate from fragments.

