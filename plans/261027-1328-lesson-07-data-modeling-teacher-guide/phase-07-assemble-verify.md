---
phase: 7
title: "Assemble and verify"
status: completed
priority: P1
effort: 0.75h
dependencies: [5, 6]
---

# Phase 07 — Assemble and verify

## Goal
Produce the guide and prove it against every check, including the negative ones and a visual render.

## Files to create/modify (controller)
`D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html` (generated), `…/verify/render/` (screenshots, report).

## Tasks and steps
1. `node assembly/assemble.mjs`.
2. `node verify/verify-guide.mjs` (V01–V15) and `--runs` and `--data`.
3. `bash verify/negative-tests.sh`. All 7 mutations must fail with their V-code.
4. Render check with project-local temp: `TMP="$PWD/plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/tmp" TEMP="$TMP" node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html --out plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/render`. Then repeat with `data-theme="dark"` forced (a copy in `verify/tmp` with the attribute set).
5. Click through each widget, one quiz, the theme toggle and a `data-store` reload. Fix issues only in the source files, never in the generated HTML, then re-assemble.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| full verify | exit 0 | `node verify/verify-guide.mjs` |
| negative suite | 7/7 RED as designed | `bash verify/negative-tests.sh` |
| render 375/768/1440 light and dark | 0 runtime errors, 0 overflow, 0 targets < 44 px | render-check report |
| size budget | ≤ 280 KB | V01 |

## Verification
Store `verify/render/report.txt` and screenshots. Their paths are cited in phase 09.

## Risks and rollback
A fix made directly in the generated file is lost on the next assemble. The rule is "edit sources only". Rollback: delete the generated HTML.

