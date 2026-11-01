---
phase: 5
title: "Guide shell and assembler"
status: completed
priority: P1
effort: 1h
dependencies: [2]
---

# Phase 05 — Guide shell and assembler

## Goal
A shell that builds with stub stages and already passes the page-level checks, so fragments only add content.

## Files to create/modify (owner: controller, or delegate D0 if phase 03 is still running; disjoint from labs/runs)
Plan folder `assembly/`:
- `shell-head.html`, `shell-css.part`, `shell-tail.html` (copied from lesson 07, then edited)
- `assemble.mjs` (copied; it reads `labs/lesson-06-redis`, writes the lesson-06 guide, uses `lab-text.mjs` for `data-cmd`, 9 stages, `w1`–`w9`)

## Tasks and steps
1. Copy lesson-07 shell files, then:
   - retitle the page;
   - replace slide paths with `../../Tài Liệu/advanced_backend/assets/6_Redis/page_NN_img_01.png`;
   - change storage keys to `l06-*`;
   - add the CSS for `.story`, `.check30`, `table.stats`, `table.expect`, `.lanes`, `.slotcalc`, `.bucket` using tokens only; <!-- user decision b -->
   - define one runtime `esc()` in `shell-tail.html` before the widgets, exported to widgets through the helper object they already receive (no new global). <!-- red-team #15 -->
   Keep the no-rail single column, theme toggle, IIFE with try/catch storage, quiz renderer, `GUIDE_DATA_START/END`.
2. Hero ("Bài 06 · Redis — đo trên máy bạn") and `#cach-hoc`:
   - time table from the stage map;
   - prep: `bash labs/lesson-06-redis/00-containers.sh up main`, `00-seed.redis`, `check.sh` (✔ for main rows, `–` for extras not started yet); <!-- red-team #5 --> <!-- red-team #11 -->
   - one Vietnamese line on why main is published on `127.0.0.1` only, and that DBX/Node clients use `127.0.0.1:6379`, not `localhost`;
   - a "Git Bash" note: lines with an in-container path start with `MSYS_NO_PATHCONV=1`, and why (Git Bash rewrites `/lab/...` to `D:/Git/lab/...`); <!-- red-team #6 -->
   - two-terminal setup (PowerShell / Windows Terminal, `winpty` note for Git Bash) and the barrier order for A/B steps (reset → B waits → A starts); <!-- red-team #7 -->
   - DBX `ADVANCE_BE_REDIS` (127.0.0.1) as key browser;
   - "Nhắc nhanh Bài 02" (what was already taught: SET NX PX, compare-and-delete, jitter, singleflight; links to L02). It says that lesson 02 lab 06 writes `imdb:*`/`lock:*` to this same container, that `check.sh` C07 will list them, and gives the scoped `--scan` + `UNLINK` command, never `FLUSHALL`; <!-- red-team #15 -->
   - warm-up `data-store="l06-warmup"`.
3. Shell sections after the stages:
   - `#bai-tap` (homework contract with keys, the `l06:hw:bookings:FA634` log list, env inputs `HW_TTL_MS`/`HOLD_MS`/`REDIS_URL`, `npm run hw:check` instructions, H1–H5 meaning, answer in `details.fold`); <!-- red-team #13 -->
   - `#driver-drill` (snippet via `<!--@CMD driver-drill.ai-snippet.ts@-->`, find-7-mistakes inputs `l06-drill-*`, answer fold with claims linked to `driver-claims`);
   - `#phong-van` (EXAM of 10 interview questions);
   - `#cheat-sheet` (commands + Big-O + "khi nào dùng");
   - `#ban-do-slide` (generated from SLIDES);
   - `#tham-khao` (slide 44 links, plus redis.io pages for expire, eviction, persistence, cluster spec, distributed locks, and Kleppmann's Redlock critique);
   - `#tiep-theo` (OmniPOS M2 FR-M2-02/03/04/05 on hub port 6380 — text only, never run; Boss Challenge 2 on `quan-ly-hop-dong`; then K2 Bài 04 Rate Limiting).
4. `SLIDES` array of 46 entries `{n, title, stage, chip, href}` from contract §6.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| build with stubs | ✔ written | `node assembly/assemble.mjs --allow-stubs` |
| page checks on shell | V01–V04, V09, V10, V14, V15 GREEN | `node verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15` |
| negatives c, d, e, f on shell build | RED (a, b, q, s print SKIP on a stub build) <!-- red-team #9 --> | `bash verify/negative-tests.sh --guide-only` |
| widget-smoke on stub build | runs, 0 exceptions (no widgets yet) | `node verify/widget-smoke.mjs --guide reports/advanced_backend/lesson_06_redis_teacher_guide.html` <!-- red-team #9 --> |
| render smoke | 0 runtime errors | render-check (see phase 07) on the stub build |

## Verification
As above.

## Risks and rollback
Stale lesson-07 strings (`l07-`, `lab07`, "Data Modeling") are caught by V09 and a `grep -n 'l07\|lab07\|Data Model'` gate. Rollback: delete `assembly/`.

