---
phase: 8
title: "Ultra code review and fixes"
status: completed
priority: P1
effort: 1h
dependencies: [7]
---

# Phase 08 — `/ak:code-review --ultra`

## Goal
Independent review of the guide, labs and verifier; fix every verified Critical/Important finding.

## Files to create/modify
- Plan folder `reports/`: `code-review-ultra-reviewer-1..5.md` (one per reviewer), `code-review-ultra-verdict.md` (verifier), `code-review-ultra-fix-status.md` (controller).
- Fix targets: any phase 03–07 file (controller only).

## Tasks and steps
1. Run `/ak:code-review --ultra` with scope: the guide HTML, `labs/lesson-06-redis/**`, `verify/**`, `assembly/**`, `runs/` (read-only), `expected.tsv`, `deviations.md`.
   Brief the five reviewers on:
   - Redis 7.2 correctness per slide;
   - safety (containers, 6380, 127.0.0.1 binding, destructive commands only on extras, config and active-expiry restore, key prefixes, no secrets or company container names in tracked files); <!-- red-team #5 --> <!-- red-team #12 -->
   - trace integrity;
   - teaching format and Vietnamese clarity;
   - mobile/a11y.
   The verifier unions the verified findings.
2. Fix Critical/Important findings. A fix that changes a lab region requires re-running that region via `run-redis.mjs`, which replaces that run's single manifest line. Never hand-edit runs. <!-- red-team #10 -->
3. Re-run the affected checks (and all of phase 07's if a lab or the shell changed).

## Test matrix
| Test | Expected | Command |
|---|---|---|
| open findings | 0 Critical/Important in fix-status | `grep -c 'OPEN' reports/code-review-ultra-fix-status.md` → 0 |
| regression | phase 07 matrix GREEN | phase 07 commands |
| check after fixes | all ✔ or `–` <!-- red-team #5 --> | `bash labs/lesson-06-redis/check.sh` |

## Verification
As above.

## Risks and rollback
A review may question a verified measurement. Keep it unless the review brings new evidence, and record the source in fix-status. Rollback per fix: re-run the region and reassemble.

