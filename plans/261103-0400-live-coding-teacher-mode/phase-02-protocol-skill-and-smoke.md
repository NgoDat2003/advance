---
title: "Phase 2: Teacher Protocol, Slash Command/Skill & Integration Smoke"
status: completed
effort: "1h"
created: 2026-11-03
---

# Phase 2: Teacher Protocol, Slash Command/Skill & Integration Smoke

## Overview

Wire the CLI & Watcher engine into daily OMP and Claude Code sessions by adding identical `## Live Coding Pair-Teacher Protocol` sections to `AGENTS.md` and `CLAUDE.md`, authoring native `/thay` command/skill files (`.claude/commands/thay.md` and `.claude/skills/thay/SKILL.md`), writing the Vietnamese practical guide (`docs/live-coding-teacher-guide.md`) for afternoon Redis & OmniPOS sessions, and running an isolated end-to-end smoke test.

<!-- Updated: Red-Team & Validation Sweep - applied RT-04, RT-06, RT-07, RT-08, RT-10, RT-11 -->

## Requirements

- [x] Append byte-identical `## Live Coding Pair-Teacher Protocol` sections to `AGENTS.md` and `CLAUDE.md` preserving all existing rules.
- [x] Create `.claude/commands/thay.md` (loaded natively as `/thay` by both OMP `enableClaudeProject` and Claude Code) and `.claude/skills/thay/SKILL.md` (`name: thay`) with strict enum validation on arguments.
- [x] Create `docs/live-coding-teacher-guide.md` in concise, scannable Vietnamese (tables + commands, zero walls of prose) tailored for Lesson 06 / K2 Lesson 04 Redis & OmniPOS Hub live coding.
- [x] Add automated `AGENTS.md` === `CLAUDE.md` protocol parity test (guarding `indexOf !== -1`) to `scripts/teacher.test.mjs` and run isolated E2E smoke check inside `.teacher/tmp/` without mutating live repo git index or `.teacher/state.local.json`.

## Protocol Specification (`AGENTS.md` & `CLAUDE.md`)

1. **Level Calibration (`Level 2` Default, `Level 3` Interviewer)**:
   - Default `Level 2 (Mid-Level 2-Axis)`: Axis A focuses on Patterns, Architecture, Trade-offs, Concurrency, and Scale (`100` vs `10,000` concurrent requests); Axis B explains newly introduced CLI/Lua/SQL flags in plain Vietnamese before asking the learner to type them.
   - `Level 3 (Senior / Mock Interviewer)`: Activated on `/thay level 3` or `/thay quiz` to grill the learner's `git diff` with 3 production/failure-mode/security questions.
2. **Anti-Prose Format Rule**:
   - Replies stay compact (max 5–7 prose lines per point).
   - Trace concurrent or stateful flows with fill-in tables (`| Step | Who | Command | Cache | DB |`) and 1 micro-exercise per turn.
3. **3-Column Role Boundary Table**:
   - **AI code luôn**: CRUD boilerplate, UI scaffolding, repetitive test/setup wiring.
   - **AI chỉ đường từng bước**: Folder/file creation, module & DI wiring, configuration steps.
   - **Đạt tự gõ 100% (10–25 dòng chuẩn phỏng vấn)**: Locks (`FOR UPDATE`, `SKIP LOCKED`, Redis `SET NX EX`), Transactions, Indexes, Cache strategies, Redis Lua scripts, and core invariants (`K-01..K-04`, `I-01..I-15`).
4. **4-Rung Safety-Net Hint Ladder (`Nấc 0 -> Nấc 3`)**:
   - **Nấc 0 (Lót phao mặc định trước `TODO(Đạt)`)**: 3-step Vietnamese flow + library syntax cheat-sheet (exact method signature) so the learner never stalls on forgotten API syntax.
   - **Nấc 1 (`hint 1` / nhắc hướng)**: Cite exact `file:line` + 1 pointed conceptual question.
   - **Nấc 2 (`hint 2` / khung điền khuyết 70/30)**: Provide 70% skeleton with 2–3 key blanks (`__1__`, `__2__`).
   - **Nấc 3 (`hint 3` / `mau` làm mẫu & gõ lại)**: Write clean 10–25 line interview-grade code, state the 1 sentence that scores points in interviews, and leave 1 small adjacent variation for muscle memory.
5. **OMP Zero-Prompt Auto-Advisor Loop**:
   - When `/thay watch` (or "bật chế độ thầy kèm") is active, start `node scripts/teacher.mjs watch-once --target auto --json` via `bash` (`async: true, timeout: 0`) and end the turn immediately.
   - When the learner presses `Ctrl+S` and pauses ~5s, `watch-once` exits `0` and wakes OMP automatically: inspect the returned diff & guardrail signals, give concise Level-2 feedback (without overwriting student code), and re-arm `watch-once` in the background.

## Implementation Steps

1. **Step 1 — Update `AGENTS.md` & `CLAUDE.md`**: Append identical `## Live Coding Pair-Teacher Protocol` blocks.
2. **Step 2 — Author `/thay` Command & Skill**: Write `.claude/commands/thay.md` and `.claude/skills/thay/SKILL.md` supporting `status`, `level <1|2|3|junior|middle|senior>`, `watch`, `stop`, `hint [0|1|2|3|next]`, `mau [chủ_đề]`, and `quiz`, validating enum inputs before invoking `node scripts/teacher.mjs`.
3. **Step 3 — Author Vietnamese Usage Guide**: Write `docs/live-coding-teacher-guide.md` covering afternoon Redis lab workflow + OmniPOS live coding workflow.
4. **Step 4 — Parity Test & Isolated E2E Smoke Verification**:
   - Add `AGENTS.md`/`CLAUDE.md` parity test (checking `idxA !== -1 && idxC !== -1 && secA === secC`) and public-repo safety check to `scripts/teacher.test.mjs`.
   - Run full `node --test scripts/teacher.test.mjs` + live CLI smoke against an isolated repo under `.teacher/tmp/e2e-smoke`, then delete `.teacher/tmp` and verify `git status --short` shows only intended Phase 1 & Phase 2 files.

## Todo

- [x] Append identical `## Live Coding Pair-Teacher Protocol` to `AGENTS.md` and `CLAUDE.md`
- [x] Create `.claude/commands/thay.md` and `.claude/skills/thay/SKILL.md`
- [x] Create `docs/live-coding-teacher-guide.md`
- [x] Add parity/safety tests, run `node --test`, and execute isolated E2E smoke check

## Success Criteria

- `AGENTS.md` and `CLAUDE.md` contain non-empty, byte-identical `## Live Coding Pair-Teacher Protocol` sections.
- `.claude/commands/thay.md`, `.claude/skills/thay/SKILL.md`, and `docs/live-coding-teacher-guide.md` are complete and consistent.
- `node --test scripts/teacher.test.mjs` and isolated E2E smoke test pass 100% with clean working tree state.
