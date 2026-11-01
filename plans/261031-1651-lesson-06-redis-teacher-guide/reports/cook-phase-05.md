# Cook report: phase 05, guide shell and assembler (2026-11-01, Asia/Saigon)

The gate passes. `node assembly/assemble.mjs --allow-stubs` builds the stub guide (83 KB). V01–V04, V09, V10, V14 and V15 are GREEN, and `node --check assembly/assemble.mjs` passes. `phase-05-guide-shell-assembler.md` is set to `status: completed`, and `ak plan status` now reports 3/9 phases done.

Scope was kept: no Redis or docker command that changes state was run, no `labs/` or `runs/` file was touched, no lesson-07 file was changed, and no git command other than `git status` was used.

## Files written

| Path | Origin | What changed |
|---|---|---|
| `assembly/shell-css.part` | Copied from lesson 07 | Only the `<title>` changed (`Sổ tay Redis · Bài 06`). It keeps the tokens on `:root`, dark mode through `prefers-color-scheme` guarded by `:root:not([data-theme="light"])` plus `:root[data-theme="dark"]`, an explicit `body` background, the 16 px gutter and 44 px controls. |
| `assembly/shell-head.html` | Copied, then rewritten | **CSS:** the lesson-07 widget classes (`.erd`, `.cal`, `.ledger`, `.nf-grid`, `.plan-text`) were dropped. New classes use tokens only: `.story`, `.check30`, `table.stats`, `table.expect` (stacks as cards at ≤ 560 px), `.lanes` track/segment/mark, `.slotcalc`, `.bucket`. `.callout.challenge` and `.tabs` are kept. Links inside table cells get 44 px hit boxes.<br>**Hero:** "Bài 06 · Redis — đo trên máy bạn" and the slide-1 epigraph.<br>**`#cach-hoc`:** slide 1 figure, the slide 1–3 `sayvs`, and the time table from the stage map (310 core, 295 firm, 70 optional, 45 homework).<br>**Prep:** `00-containers.sh up main`, the seed piped through `grep -v '^#'`, and `check.sh` (✔ for main rows, `–` for extras), followed by `<!--@RUN check.after-seed@-->`. It explains the `127.0.0.1`-only publish and why clients must not use `localhost`.<br>**Run methods:** PowerShell form and Git Bash `winpty` form; pipe fallback; `.sh` pasted line by line; DBX `ADVANCE_BE_REDIS` as a key browser and single-command console (multi-line input is verified NOT supported, with the `ResponseError: syntax error` evidence); the `MSYS_NO_PATHCONV=1` note with a byte-exact S7 excerpt from `run-method-smoke`; the A/B barrier order (reset → B waits → A releases).<br>**Other:** "Nhắc nhanh Bài 02" with links to L02 `#chang-4`/`#chang-6`, the `imdb:*`/`lock:*` C07 note, the scoped `--scan | xargs UNLINK` command and "never FLUSHALL"; the warm-up `data-store="l06-warmup"`. |
| `assembly/shell-tail.html` | Copied, then rewritten | **Sections:** `#bai-tap` (slide 43 figure, the full hw contract: keys, env `HW_TTL_MS`/`HOLD_MS`/`REDIS_URL`/`HW_CMD`, H1–H5, `npm run hw:check`, bad-fixture run, answer fold with `hw-solution.mjs`); `#driver-drill` (`<!--@CMD driver-drill.ai-snippet.ts@-->`, `l06-drill-1..7`/`l06-drill-decoy`, an answer table that cites run ids, and `<!--@RUN driver-claims@-->`); `#phong-van` (EXAM 10); `#cheat-sheet` (slide-42 recap `id="sl-42"` PART, plus tables for structures/Big-O, observation commands and errors, and rules); `#ban-do-slide`; `#tham-khao` (slide 44 at the current URLs, the 5 redis.io pages, Kleppmann); `#tiep-theo` (FR-M2-02/03/04/05 on hub 6380, text only; Boss Challenge 2; K2 Bài 04).<br>**Data:** `SLIDES` has 46 `{n, title, stage, chip, href}` entries from contract §6.<br>**Runtime:** one IIFE with try/catch storage and the `l06-theme` key; `data-store` filtered to `l06-*`; a single `esc()`. Quiz, exam and slide map are built with an `el()` DOM helper (textContent, no innerHTML), so the shell itself passes V19. |
| `assembly/assemble.mjs` | Copied, then adapted | **Paths:** reads `labs/lesson-06-redis` and writes `reports/advanced_backend/lesson_06_redis_teacher_guide.html`; 9 stages and widgets `w1`–`w9`.<br>**`data-cmd`:** text comes from `verify/lab-text.mjs` `displayText`, with the same `.redis`→`.sh` fallback as the verifier. `<!--@CMD ref@-->` creates a block, and every `<pre … data-cmd>` is re-copied from labs.<br>**New `<!--@RUN id [head=N\|tail=N]@-->`:** emits a run label (date taken from the run header, so V13 holds) and a `pre[data-run]` copied from `runs/<id>.txt`. This lets the shell show runs that phase 03/04 have not recorded yet.<br>**Stubs:** a stub stage carries the `id="sl-NN"` anchors of its PART/FIX slides, read from `SLIDES` in shell-tail, so V04 is GREEN on a stub build.<br>**Safety:** quiz and widget JSON have `<` escaped to `<`. It refuses unknown flags (exit 2). Without `--allow-stubs` it stops before writing when anything is missing. |
| `reports/advanced_backend/lesson_06_redis_teacher_guide.html` | Generated | Stub build, 83 KB. |
| `phase-05-guide-shell-assembler.md` | Edited | `status: completed` |

Widget helper contract (for phase 06): widgets are inlined inside the IIFE, each wrapped in `{ }`. They reach the helpers through the closure: `$`, `$$`, `store`, `esc`, `run('wN')`, `press`, `el`. No global is added. This is the "helper object they already receive" from the lesson-07 pattern.

## Commands and results (run in the plan folder)

| Check | Command | Result |
|---|---|---|
| syntax | `node --check assembly/assemble.mjs` | OK |
| stub build | `node assembly/assemble.mjs --allow-stubs` | ✔ written, 83 KB. 34 placeholders are listed: 9 fragments, 9 quizzes, 9 widgets, `runs/data`, 2 lab files and 4 runs that are not written yet. |
| strict build | `node assembly/assemble.mjs` | exit 1, `missing fragment stage-01`, and the guide was not overwritten |
| bad flag | `node assembly/assemble.mjs --bogus` | exit 2 |
| **gate** | `node verify/verify-guide.mjs --only V01,V02,V03,V04,V09,V10,V14,V15` | **✔ không có lỗi** |
| shell escaping | `--only V19` | ✔ |
| stale strings | `grep -n 'l07\|lab07\|Data Model'` on the shell files and the guide | no hit |
| negatives | `bash verify/negative-tests.sh --guide-only` | c, d, e, f and also q are RED with the right code. a, b and s SKIP (there is no `data-cmd`, `b.m` or fragment yet). 5/5, rc 0. |
| widget-smoke | `node verify/widget-smoke.mjs --guide …` | 0 exceptions. 9 quiz boxes, 10 exam items, 46 slide chips; theme toggles. |
| render (light) | `render-check.mjs <guide> --out verify/tmp/render-phase05/light` (TMP/TEMP set to `verify/tmp`) | 375/768/1440: 0 errors, 0 overflow, 0 small targets. The first pass found 7 links in table cells under 44 px; this was fixed with `main td a` padding. |
| render (dark) | same command on a `data-theme="dark"` copy in `verify/tmp/render-phase05/` (image paths rewritten for that folder) | 0 errors, 0 warnings |

## Concerns for later phases

1. **V16 on the full build is RED for now.** EXAM 9 cites `16384`, and no run contains it yet. The frozen R37 regex asserts `^cluster_slots_assigned:16384$`, so V16 turns GREEN as soon as `--runs` is GREEN for R37. Every other EXAM number is short or is `7.2`, which every run header contains.
2. **R09a looks wrong.** It expects a hash to stay `listpack` up to 512 fields, but Redis 7.2's compiled default `hash-max-listpack-entries` is 128, from memory of `config.c`. This was not measured here. If the phase-03 run confirms 128, R09a needs a deviation entry. Because of this the cheat sheet gives the config names and points to the stage-2 measurement instead of printing threshold numbers.
3. **The Medium link from slide 44 could not be checked.** curl returns 000 because Medium blocks scripted clients. The other 10 reference URLs return 200; two of the slide-44 links were moved to their new location.
4. **Some shell text depends on files phase 03/04 have not written.** These are `hw-check.bad`, `hw-check.solution`, `driver-claims`, `check.after-seed`, `hw-solution.mjs` and `driver-drill.ai-snippet.ts`. They show as placeholders now and fill in automatically on rebuild. The `#bai-tap` instructions (`npm run hw:check`, `HW_CMD="node my-booking.mjs" bash hw-check.sh`) follow the phase-04 spec. Check them against the real `package.json` and `hw-check.sh` when phase 04 lands.
5. **Two-terminal text assumes the frozen design.** The `#cach-hoc` A/B paragraph and the driver-drill answer table cite run ids and stage behaviour from the expected matrix, not measured output. If a run ends as a deviation, phase 07/08 should re-read these two paragraphs, the `#sl-42` recap and the EXAM answers.

Status: DONE_WITH_CONCERNS
