---
title: "Phase 1: TDD Teacher CLI and Watcher Engine"
status: completed
effort: "1h"
created: 2026-11-03
---

# Phase 1: TDD Teacher CLI and Watcher Engine

## Overview

Build the zero-dependency Node.js CLI and debounced auto-advisor watcher (`scripts/teacher.mjs`) strictly test-first via `scripts/teacher.test.mjs` (`node:test`), backed by project-local configuration (`.teacher/config.json`) and git-ignored session state (`.teacher/state.local.json`).

<!-- Updated: Red-Team & Validation Sweep - applied RT-01..RT-11 -->

## Requirements

- [x] Update `.gitignore` with `/.worktrees/`, `/.teacher/state.local.json`, and `/.teacher/tmp/`.
- [x] Create `.teacher/config.json` (`version: 1`, `defaultLevel: 2`, `defaultRung: 0`, `quietMs: 5000`, `timeoutMs: 0`, `hubPath: "../omnipos-finledger-hub"`, `forbiddenHubPorts: [3000, 3001, 5433, 6379]`).
- [x] Author `scripts/teacher.test.mjs` FIRST (Red phase) using project-local fixtures under `.teacher/tmp/` (never `node:os.tmpdir()`).
- [x] Implement `scripts/teacher.mjs` (Green + Refactor) using pure Node built-ins (`node:fs`, `node:path`, `node:child_process`, `node:crypto`) with `shell: false`.

## JSON & CLI Contract

### `.teacher/config.json` (Tracked)
```json
{
  "version": 1,
  "defaultLevel": 2,
  "defaultRung": 0,
  "quietMs": 5000,
  "timeoutMs": 0,
  "hubPath": "../omnipos-finledger-hub",
  "forbiddenHubPorts": [3000, 3001, 5433, 6379]
}
```

### Security & Reliability Invariants
1. **Redaction (`RT-01`)**: `K-04` findings NEVER include raw secret values in stdout or JSON; mask secret literals with `***REDACTED***`. `--save` writes ONLY `defaultLevel` and `defaultRung` to `.teacher/config.json`.
2. **Scoped `K-01` & Context-Aware `K-04` (`RT-02`)**:
   - `K-01` runs ONLY when inspecting a Hub target (`isHubTarget === true`), matching port/endpoint contexts (`(?::|\bport\s*[:=]\s*|\bPORT\s*[:=]\s*)(3000|3001|5433|6379)\b`) so `advance-be` Redis/PG labs and `setTimeout(fn, 3000)` never false-positive.
   - `K-04` catches quoted (`'`, `"`, `` ` ``) secret assignments, `Authorization: Bearer <token>`, and credentialed connection URLs (`postgres://user:pass@host`), while skipping safe placeholders (`process.env.`, `<...>`, `__REPLACE`, `YOUR_`, `example`, `changeme`, `placeholder`).
3. **Complete Git Snapshot (`RT-03`)**: Inspect both `git diff HEAD --` (falling back to `git diff --cached` + `git diff` on unborn `HEAD`) AND untracked files (`git ls-files --others --exclude-standard`), formatting untracked text files as added lines so newly created files trigger `watch-once` and guardrails immediately.
4. **Worktree & Junction Hub Resolution (`RT-05`)**: Resolve default Hub path by checking `<root>/omnipos-finledger-hub`, `<root>/../omnipos-finledger-hub`, and main-worktree equivalents derived from `git rev-parse --git-common-dir`, normalizing via `fs.realpathSync()`. Explicit `--target <dir>` that does not exist or starts with `-` exits with code `2`.
5. **Startup Pre-Check, Windows `null` Filename & Zero-Token Idle (`RT-07`, `RT-09`)**:
   - `watch-once` checks current diff hash immediately on startup; if `diffHash !== lastReviewedHash` (and diff is non-empty), it updates `lastReviewedHash`, prints `event: "diff_detected"`, and exits `0` immediately.
   - On Windows `fs.watch`, if `filename` is `null`, schedule the debounced diff check safely without throwing; if `filename` is present, ignore `.git`, `node_modules`, `.worktrees`, `.teacher`, `dist`, `build`, `.next`, `checks/out`, `*.tmp`, `*.log`.
   - Validate `--quiet-ms` (`> 0`) and `--timeout-ms` (`>= 0`) as finite integers; reject invalid numbers with exit code `2`.

## Implementation Steps

1. **Step 1 — Git Ignore & Config**: Edit `.gitignore` to append `/.worktrees/`, `/.teacher/state.local.json`, and `/.teacher/tmp/`. Write `.teacher/config.json`.
2. **Step 2 — TDD Red Suite (`scripts/teacher.test.mjs`)**: Write isolated tests creating mini git repos inside `.teacher/tmp/<test-id>/` and passing `--root` to CLI functions/process:
   - `status`: defaults (`level: 2`, `currentRung: 0`), local state override, `--save` writing only `defaultLevel`/`defaultRung`.
   - `level`: `1|2|3|junior|middle|mid|senior` (case-insensitive) + exit `2` on invalid input.
   - `rung` & `hint`: query, explicit `0..3`, `hint` zero-arg / `next` auto-advance clamping at `3`, exit `2` on invalid input.
   - `diff`: tracked + staged + untracked detection; `K-01` firing on Hub port context (`localhost:6379`, `PORT=3000`) while ignoring `setTimeout(fn, 3000)` and non-Hub `advance-be` labs; `K-04` catching secrets + connection URLs with `***REDACTED***` output while ignoring `process.env.SECRET` / `<TOKEN>`; `TODO(Đạt)` and `__1__`..`__9__` slot counting; missing optional Hub graceful `hubExists: false` vs explicit bad `--target` exit `2`.
   - `watch-once`: startup pre-check immediate wakeup, multi-write burst coalescing within `--quiet-ms`, ignored directory filtering, `filename === null` resilience, duplicate SHA-256 hash suppression, clean `--timeout-ms` exit `0`, and `NaN` flag rejection exit `2`.
3. **Step 3 — TDD Green & Refactor (`scripts/teacher.mjs`)**: Implement clean modular functions and CLI entrypoint until 100% of `scripts/teacher.test.mjs` passes.

## Todo

- [x] Update `.gitignore` and create `.teacher/config.json`
- [x] Write `scripts/teacher.test.mjs` and observe expected Red failure
- [x] Implement `scripts/teacher.mjs` and pass all `node --test` cases

## Success Criteria

- `node --test scripts/teacher.test.mjs` passes with 0 failures and leaves 0 leftover directories in `.teacher/tmp/`.
