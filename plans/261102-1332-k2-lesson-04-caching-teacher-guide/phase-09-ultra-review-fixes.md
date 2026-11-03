---
phase: 9
title: "/ak:code-review --pending --ultra --advice and fixes"
status: pending
priority: P1
effort: 1.5h
dependencies: [8]
---

# Phase 09 — Ultra code review

## Goal
An independent review, with every validated Critical/Important finding fixed.

## Files to create/modify
`$P/reports/code-review-ultra-reviewer-1…5.md`, `code-review-ultra-verdict.md` and `code-review-ultra-fix-status.md`. Only the controller fixes phase 03–08 files.

## Tasks

**T9.1 Review.**
- **Goal:** 5 reviewers plus a verifier.
- **Target:** the reports.
- **Steps:**
  1. Run `/ak:code-review --pending --ultra --advice` over `G`, `$L/**`, `$P/verify/**`, `$P/assembly/**`, `runs/` (read-only), `expected.tsv` and `deviations.md`.
  2. Brief: per-slide correctness (counter formula, Lua number returns, clamp, HLL, Bloom, `maxclients`, listpack 512); safety (names, 6381, L06, PG schema/load, secrets); trace integrity; teaching and Vietnamese; mobile/a11y.
- **Success:** a verdict exists.
- **Verify:** `ls $P/reports/code-review-ultra-verdict.md` → exists

**T9.2 Fix and re-run.**
- **Goal:** 0 open blocking findings.
- **Target:** fix-status.
- **Steps:**
  1. Fix each Critical/Important finding.
  2. Re-record changed regions through `run-lab.mjs`.
  3. Re-run phase 08 and `check.sh`.
  4. Keep a verified measurement unless the review brings new evidence, and cite the source.
- **Success:** 0 OPEN.
- **Verify:** `grep -c 'OPEN' $P/reports/code-review-ultra-fix-status.md` → `0`, and the phase 08 Verify commands pass again

**T9.3 Conditional `/ak:test`.**
- **Goal:** cover only a real gap.
- **Target:** fix-status.
- **Steps:** run `/ak:test` only if the verdict names behaviour no row or negative covers; otherwise record "không cần".
- **Success:** the decision is recorded.
- **Verify:** `grep -cE '/ak:test: (đã chạy|không cần)' $P/reports/code-review-ultra-fix-status.md` → `1`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| open findings | 0 | T9.2 |
| regression | GREEN | phase 08 Verify |

## Risks and rollback
Per fix: re-record the region and reassemble.

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

