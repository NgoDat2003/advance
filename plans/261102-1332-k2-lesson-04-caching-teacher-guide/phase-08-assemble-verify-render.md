---
phase: 8
title: "Assemble, full verification, negatives, render-check"
status: pending
priority: P1
effort: 1h
dependencies: [7]
---

# Phase 08 — Assemble, verify, render

## Goal
One built guide that passes every check, with negatives that prove the checks bite.

## Files to create/modify (owner: controller)
`G`, `$P/runs/verify-full.txt`, `$P/verify/render/`, `$P/verify/render-dark/`.

## Tasks

**T8.1 Build.**
- **Goal:** the final HTML.
- **Target:** `G`.
- **Steps:** `node $P/assembly/assemble.mjs`.
- **Success:** no stubs; within budget.
- **Verify:** output contains `8 quiz, 9 widget, 9 JSON`; `stat -c %s "$G"` ≤ `532480`

**T8.2 Full verifier.**
- **Goal:** all codes GREEN.
- **Target:** `verify-full.txt`.
- **Steps:** run guide mode, `--runs`, `--data` and `--lint`.
- **Success:** 0 fails.
- **Verify:** `for m in "" --runs --data --lint; do node $P/verify/verify-guide.mjs $m || echo FAIL; done > $P/runs/verify-full.txt 2>&1; grep -c FAIL $P/runs/verify-full.txt` → `0`

**T8.3 Negatives.**
- **Goal:** the checks bite.
- **Target:** none.
- **Steps:** run the full set.
- **Success:** 34/34.
- **Verify:** `bash $P/verify/negative-tests.sh | tail -1` → starts `34/34`, contains `0 SKIP`

**T8.4 Widget smoke.**
- **Goal:** widgets on real data.
- **Target:** none.
- **Steps:** run on `G`.
- **Success:** W1, W3, W4 and W8 ✔.
- **Verify:** `node $P/verify/widget-smoke.mjs --guide "$G"; echo rc=$?` → `rc=0`

**T8.5 Render-check, light and dark.**
- **Goal:** mobile and theme safety.
- **Target:** the render folders.
- **Steps:**
  1. `TMP=$P/verify/tmp TEMP=$P/verify/tmp node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs "$G" --out $P/verify/render`.
  2. For dark, use a sibling copy with `data-theme="dark"` and `--out $P/verify/render-dark`, then delete the copy.
- **Success:** 0/0/0.
- **Verify:** `grep -hE '"(runtimeErrors|overflow|smallTargets)"' $P/verify/render*/render-report.json` → every count `0`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| V01–V23, M01, D01, DATA | 0 FAIL | T8.2 |
| negatives | 34/34 | T8.3 |
| 375/768/1440 light/dark | 0/0/0 | T8.5 |

## Risks and rollback
Fixes go to fragments or the shell, never to runs. Rollback: regenerate the guide.

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

