# Cook report: phase 06, delegate D2 (stages 4, 5, 6 and W5), 2026-11-01

All three fragments pass `--fragment`, and `w5.js` passes `node --check`. The one cross-cutting issue is the guide size budget (V01), which needs a controller decision (see "Contract / controller issues").

## Files (only these were created)

| File | Bytes | Content |
|---|---|---|
| `assembly/fragments/stage-04.html` | 18154 | Slides 24–27. Story: hub restarts after a power cut. Figures for slides 26, 25, 27. Stats table, check30, W5, rdb-loss (excerpt) and aof-loss (full run). Must-fix 4 is a separate `callout warn`: a kill loses nothing because of the page cache, and the ≤ 1 s window applies to an OS crash or power loss only and was not measured. Optional hybrid fold, `#sl-25`/`#sl-27` PART, slide 26 OK, challenge, kiem-chung + `table.expect`. |
| `assembly/fragments/stage-04.quiz.json` | 2146 | 4 items; `why` cites 04-persistence.rdb-loss / aof-loss / hybrid |
| `assembly/fragments/stage-05.html` | 25315 | Slides 28, 32–35. Story: kitchen queue on two tablets plus best-sellers (FR-M2-04). Inline SVG of the reliable queue. Steps in this order: counter race (getset, incr), BRPOP, BLMOVE + ack, Hash cart, Set, ZSET. Each two-client step is a `table.walk` (reset → B → A) followed by its timeline. `#sl-32..35` PART; the 33–35 chips cite the 02-encodings runs. FR-M2-04/I-09 bridge (rebuild into a temp key, then `RENAME`). Optional Streams fold, challenge `l06:my:kitchen`, kiem-chung. |
| `assembly/fragments/stage-05.quiz.json` | 2068 | 4 items; cites 05-counter, 05-queue, 05-structures runs |
| `assembly/fragments/stage-06.html` | 22797 | Slides 36–38. Story: unpaid app order auto-cancelled, two hub pollers. SVG of the ZSET timeline. Naive walk + timeline. Lua walk (`.sh` regions), with `lua/delay-claim.lua` in a fold, then its timeline. Big key DEL vs UNLINK excerpt, `r32_del_unlink_ratio` as `data-derived`, `--bigkeys`, optional lazyfree fold. Learner note on REPLCONF when the replica is up. Slides 37 and 38 OK; challenge with 20 jobs and two pollers; kiem-chung. |
| `assembly/fragments/stage-06.quiz.json` | 2211 | 4 items; cites 06-delay.naive, 06-delay-lua.claim, 06-practices.bigkey |
| `assembly/widgets/w5.js` | 4929 | IIFE, null-guarded, reads `run('w5')`. There is one lane per mode, with the BGSAVE mark from the data and illustrative fsync ticks labelled as such. "kill -9 ở đây" shows survived and lost segments; the loss is computed from the widget data. The power-loss toggle changes only the text: AOF shows "chưa đo" and no number. The DOM is built only through `el()`/textContent, with no innerHTML. Ids are `w5-lanes`, `w5-kill`, `w5-again`, `w5-power` and `w5-out`. |

Code blocks are `<!--@CMD file#region@-->` and runs are `<!--@RUN id@-->` placeholders, so no lab code is pasted. The only hand-written `pre[data-run]` blocks are two excerpts (`04-persistence.rdb-loss`, `06-practices.bigkey`), and V06 checks them line by line. Every number in prose is a `b.m[data-run]` or `b.m[data-derived]`. Constants taken from lab commands (`sleep 2`, `2000000000`) and the challenge spec ("20 việc") appear as code or spec, not as measurements.

## Checks (run from the plan folder)

| Check | Result |
|---|---|
| `node verify/verify-guide.mjs --fragment assembly/fragments/stage-04.html` | ✔ rc 0 |
| `… stage-05.html` | ✔ rc 0 |
| `… stage-06.html` | ✔ rc 0 |
| `node --check assembly/widgets/w5.js` | rc 0 |
| Full verifier on a throwaway assembly. `assemble.mjs` was run with `fs.writeFileSync` redirected to `verify/tmp/d2/`, so the shared guide was not overwritten. | No error from stages 4–6 (V02, V06, V13 and V16 are clean for my blocks). One V16 hit ("2100" in quiz 6) was fixed. The remaining errors belong to others: V01 size, and a V02 `</pre>` mismatch inside `#chang-9`. V10 image errors came only from the temp path. |
| `widget-smoke.mjs` on the same temp build | ✔ no exceptions; W6 8/8 |
| W5 probe in headless Chrome | Kill shows "mất 500" / "mất 0" and the segments ok 66.67 % + bad 33.33 % / ok 100 %. The power toggle shows "chưa đo" for AOF. Controls are 44 px; 0 exceptions. |

The temp files in `verify/tmp/d2/` were deleted afterwards. No docker or Redis command was run, and no git command.

## Contract / controller issues

1. **The guide budget (V01, 340 KB) cannot hold nine stages at the current density.** The temp build with all fragments present was 482 KB. Shell, widgets and JSON take about 138 KB, which leaves about 22 KB per assembled stage. My stages assemble to about 25 / 32 / 32 KB after trimming (down from 32 / 37 / 36). Stages 1, 2, 7 and 8 assemble to 36–38 KB. Run and code blocks are only 9–12 KB of each stage; the rest is Vietnamese prose, where UTF-8 diacritics cost 2–3 bytes per character. The controller has to choose one of three options: raise V01, move optional folds out of the page, or ask every delegate for another cut of about 30 %.
2. **The widget wrapper is a `div`, not a `section`.** Contract §4 says "section `id="wN"`", but V12 matches `<section id="chang-N">…</section>` lazily, so a nested `<section>` would cut the stage short and hide its later blocks. I followed the lesson-07 pattern: `<div class="widget" id="w5">` with `.widget-body`. Suggested contract wording: "element `id="wN"` (use `div.widget`, never a nested `section`)".
3. **Possible budget saving.** `<!--@RUN id head=N|tail=N@-->` already exists in the assembler. Delegates could use it on long runs such as `04-persistence.hybrid` and `06-delay-lua.claim.timeline`, which still add bytes even inside folds.

Status: DONE_WITH_CONCERNS
Summary: Stages 4–6 fragments, quizzes and W5 are written and every acceptance check passes; W5 was exercised in headless Chrome.
Concerns: the 340 KB V01 budget is exceeded guide-wide (482 KB with all fragments) and needs a controller decision. The contract's "section id=wN" wording conflicts with V12, so I used `div.widget`.
