---
phase: 6
title: "Guide shell and assembler (delegate D0)"
status: pending
priority: P1
effort: 1h
dependencies: [2]
---

# Phase 06 — Shell and assembler

## Goal
A shell that passes the page checks with stub stages. It runs in parallel with phases 03–05.

## Files to create/modify (owner: D0; disjoint from labs/runs)
`$P/assembly/shell-head.html`, `shell-css.part`, `shell-tail.html` and `assemble.mjs`, copied from L06 `assembly/`.

## Tasks

**T6.1 Retarget the shell.**
- **Goal:** the L06 shell, adapted for this lesson.
- **Target:** the shell files.
- **Steps:** title "K2 · Bài 04 · Caching"; image prefix `../../Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/assets/04_Caching/`; `k2l04-*` storage keys; token-only CSS for `.gloss`, `.replay`, `.estimator`, `.costmodel`, `.calc`; keep no-rail column, theme toggle, try/catch storage, `esc()`, GUIDE_DATA; add `H.lanes(el, events)`.
- **Success:** no L06 strings remain.
- **Verify:** `grep -nE "l06-|lesson-06|6_Redis|advance-be-redis" $P/assembly/shell-*.html $P/assembly/shell-css.part | wc -l` → `0`

**T6.2 Assembler.**
- **Goal:** build `G`.
- **Target:** `assemble.mjs`.
- **Steps:**
  1. Set `LABS=$L`, `OUT=G`, `STAGES=8`, `WIDGETS=9`.
  2. Drop the header lines `# (chạy lúc|lua|đồng hồ)`.
  3. Resolve `.sql`, `.pgbench`, `.tsv` and `.awk`.
- **Success:** the stub build writes `G`.
- **Verify:** `node $P/assembly/assemble.mjs --allow-stubs; echo rc=$?` → output contains `đã ghi`, then `rc=0`

**T6.3 Shell sections and SLIDES.**
- **Goal:** every non-stage section.
- **Target:** `shell-head.html`, `shell-tail.html`.
- **Steps:** write these sections.
  - `#cach-hoc`: time table and "nếu còn sức" order; why K2L04 has its own containers (L06 on 6379 untouched); `up main`, `up cluster`, seed pipe, `check.sh`; DBX `ADVANCE_BE_K2L04_REDIS` (127.0.0.1:6381, db 0, single commands) and `ADVANCE_BE_LAB`; `127.0.0.1` not `localhost`; `MSYS_NO_PATHCONV=1`, `winpty`/PowerShell, cwd = repo root; barrier order reset → B → A; the `sed … | grep -v '^#' | docker exec -i … redis-cli` pipe form; why stage 2 is first; warm-up.
  - `#bai-tap`: T5.2 contract, H0–H8, `bash labs/k2-lesson-04-caching/hw-check.sh`, `<!--@RUN hw-check.solution@-->`, solution fold, network I/O reading.
  - `#guard-drill`: `<!--@CMD drill/rate-limit.guard.ai-snippet.ts@-->`, 6 inputs, answer fold.
  - `#phong-van`, `#cheat-sheet` (with slide 31 recap `id="sl-31"`): stubs for D3. `#ban-do-slide`; `#tham-khao` (Pika, source URLs).
  - `#tiep-theo`: FR-M2-05 (algorithm and why, `storeId` hashtag key, env params, 20×429 with `Retry-After = ceil(retry_after_ms/1000)`, batch trade-off); ADR-010 fail-open/closed for Đạt; NFR-10; hub 128 MB maxmemory (limiter keys must expire; eviction = silent fail-open); 6380 text only; Boss Challenge 2.3.
  - SLIDES: 39 entries from contract §6.
- **Success:** the page checks pass on the stub build.
- **Verify:** `node $P/assembly/assemble.mjs --allow-stubs && node $P/verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15; echo rc=$?` → `rc=0`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| page checks | GREEN | T6.3 |
| negatives c, d, e, f, f2, z | RED, others SKIP | `bash $P/verify/negative-tests.sh --guide-only` |
| stub smoke | 0 exceptions | `node $P/verify/widget-smoke.mjs --guide "$G"` |

## Risks and rollback
V09 and the T6.1 grep catch stale strings. Rollback: delete the shell files and `G`.

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

