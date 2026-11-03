---
title: Live Coding AI Teacher Mode built
date: 2026-11-03
summary: "Project-local Level 2/3 live coding teacher CLI, 4-rung safety net, and OMP auto-advisor watcher"
---

# Live Coding AI Teacher Mode built

**What was built:** Project-local **Live Coding AI Teacher Mode** (`scripts/teacher.mjs`, `scripts/teacher.test.mjs`, `.teacher/config.json`, `.claude/commands/thay.md`, `.claude/skills/thay/SKILL.md`, `docs/live-coding-teacher-guide.md`, and synchronized `AGENTS.md` / `CLAUDE.md` protocols) under plan `plans/261103-0400-live-coding-teacher-mode/`.

**What went well**
- Red-team review (Security Adversary + Assumption Destroyer) caught 11 high-signal edge cases before a single line of implementation code was written: plaintext secret echoing in `diff --json`, `K-01` port false positives on legitimate `advance-be` Redis/PG lab ports (`6379`, `5433`) and `setTimeout(fn, 3000)`, bare `git diff` missing untracked files, Windows `ReadDirectoryChangesW` passing `filename === null`, and `indexOf === -1` phantom parity passes.
- Resolving sibling `omnipos-finledger-hub` via `git rev-parse --git-common-dir` allowed `teacher.mjs` to locate the hub seamlessly even when running inside `.worktrees/advance-be-live-coding-teacher-mode`.

**What went wrong, and why**
- In the first `watch-once` burst test run, registering `child.once('close', ...)` *after* an `await` loop caused Node's test runner to report a pending promise after child exit when `fs.watch` settled fast on Windows. Registering the `close` promise immediately after `spawn()` made the test 100% deterministic.
- A 1-character Vietnamese typo (`BẮC BUỘC` vs `BẮT BUỘC`) during initial `CLAUDE.md` edit was immediately caught by the byte-identical parity test in `scripts/teacher.test.mjs`.

**Decisions**
- Defaulted to Dual-Axis `Level 2 (middle)` in `.teacher/config.json` while storing runtime toggles in git-ignored `.teacher/state.local.json` so switching between `Level 2` (daily learning) and `Level 3` (Senior Mock Interviewer) never dirties `git status`.
- Defaulted `timeoutMs: 0` on `watch-once` so idle reading sessions burn zero LLM tokens and only wake OMP after an actual file save + quiet window.

**Next:** Merge PR into `main` and use `/thay watch` during afternoon Redis study & OmniPOS exercises.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
