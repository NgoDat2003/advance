# Code-review packet — Lesson 06 Redis guide (`/ak:code-review --ultra`, stage 2)

Immutable input, identical for the five reviewers. Controller: main session, 2026-11-01 (Asia/Saigon).

## Stage 1 (spec compliance) — already run by the controller
The phase 07 gate is GREEN; see `runs/verify-full.txt`:
- `verify-guide.mjs` with no flag, `--runs`, `--data`, `--lint` and `--selftest` all report 0 errors.
- `negative-tests.sh` turns 19/19 cases red, 0 SKIP.
- `widget-smoke` has 0 exceptions and W6 matches 8/8 slots.
- render-check shows 0 errors and 0 warnings in light and dark at 375/768/1440.
- `check.sh` gives rc 0 twice with identical output.
- `99-cleanup.sh` was run: it keeps `l06:my:*`/`l06:hw:*` and restores config.

Do not re-report "missing check X" unless you show that the check passes on something that is wrong.

## Scope (review these)
- Guide: `D:/study/advance-be/reports/advanced_backend/lesson_06_redis_teacher_guide.html` (466 KB, built). Sources are in `assembly/` (fragments, widgets, shell, `assemble.mjs`). Fix targets are the sources, not the built HTML.
- Labs: `D:/study/advance-be/labs/lesson-06-redis/**` (stage files, `lua/`, `00-containers.sh`, `00-seed.redis`, `check.sh`, `99-cleanup.sh`, `hw-*`, `driver-drill.ai-snippet.ts`, `package.json`).
- Verifier and tooling: `verify/**` (verify-guide, run-redis, rerun-gate, lab-text, negative-tests, widget-smoke, fingerprint, make-widget-data, record-all).
- Evidence, read-only: `runs/**`, `verify/expected.tsv`, `verify/deviations.md`.

Plan folder: `D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/`. Context: `plan.md` (stage map, matrix, must-fix, Red Team Review, Validation Log), `assembly/contract.md` v1.1, `controller-facts-addendum.md` (items 1–6), `evidence-packet.md`, slides `D:/study/advance-be/Tài Liệu/advanced_backend/6. Redis.md`.

## Settled decisions (do not report these as findings)
- Lesson 06 Redis, learner Đạt, Vietnamese, no left rail, `l06-*` storage keys.
- Stage checks are plain commands plus `table.expect`. Lua appears only in stages 6/8/9, the homework, and the optional `01-block.busy` fold.
- node-redis 6.3.0 and `127.0.0.1` (not `localhost`). DBX runs one command at a time.
- The size budget is 520 KB. Only main stays up after the build; extras start on demand.
- No git branch or commit: the repo is used on `main` uncommitted by design.
- R03 and R35 deviations, the R41 timing note, the lock margins widened because of the Docker VM clock, and the rerun gate dropping redis-cli `(N.NNs)` lines.

## Review dimensions (cover all five)
1. **Redis 7.2.3 correctness per slide.** Check every "Redis 7.2.3 đo được" claim, chip and explanation against the recorded runs and the 7.2.3 source/docs. Check the eviction, expiry, persistence, replication/WAIT, cluster slot, lock/fencing, Lua atomicity and token bucket explanations.
2. **Safety on the learner's machine.**
   - Containers other than `advance-be-redis*` must be untouched, and port 6380 must never be used.
   - Ports bind to 127.0.0.1 only.
   - Destructive commands run only on extra containers, and each block prints its target.
   - Config and active-expiry are restored, and keys carry the `l06:` prefix.
   - Tracked files contain no secrets, no company container names and no env values. `runs/` is tracked.
   - Commands Đạt copies must hit the right server. Watch Git Bash path rewriting (`MSYS_NO_PATHCONV`) and PowerShell/winpty variants.
3. **Trace integrity.** Every number shown must come from a run, from derived.json or from widget data. `pre[data-cmd]` must equal the lab region. A widget simulation must be labelled as one. Look for checks that pass vacuously, verifier blind spots, and `sed`-printed regions that hide code from the learner (stage 3 eviction).
4. **Teaching format and Vietnamese clarity.** Each stage needs the order story → diagram → measured stats → 30-second check, then làm mẫu → tự làm with PASS criteria. Check that the challenge is actually doable, that the two-terminal instructions are executable (pacing for `.redis` blocks), and that quiz answers and explanations are correct. Check that nothing re-teaches lesson 02 (only links), and that the OmniPOS M2 / Boss Challenge 2 bridge is accurate. Check the homework and driver drill: do the seeded mistakes, the hw-check and node-redis 6.3.0 API usage hold up?
5. **Mobile and accessibility.** Look at widget keyboard use, labels, colour-only meaning, contrast in dark mode, focus order and 44 px targets.

## Rules
- Read-only. Do not edit any file except your own report.
- Allowed: read-only `docker exec advance-be-redis redis-cli` queries (INFO, CONFIG GET, OBJECT, TTL, SCAN).
- Not allowed: writes, container changes and git commands. Do not read any `node_modules`; check node-redis against unpkg/github sources.
- Every finding needs `file:line` evidence, plus a run id or command output where relevant, and a concrete failure scenario.
- Severity: Critical (wrong teaching or machine damage), Important (real defect the learner will hit), Minor.
- No praise. 5–15 findings.
