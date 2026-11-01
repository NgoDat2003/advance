# Cook report: phase 06, delegate D3 (stages 7–9, widgets W6–W9), 2026-11-01

Stages 7, 8 and 9 are written with their quizzes and widgets W6–W9. Every acceptance check passes. On the stub build, W6 agrees with all 8 recorded `CLUSTER KEYSLOT` values.

## Files (all new, inside my ownership list)

| File | Content |
|---|---|
| `assembly/fragments/stage-07.html` | Story: menu price read from replica during a network cut. Slide 6 figure + inline SVG of the partition. Stats table (WAIT 0 on the same connection versus 1 on a fresh one, stale `100` → `120`, offsets, `sync_*` recorded only, failover, slots, CROSSSLOT). check30 on WAIT being per connection (deviation R35). `sayvs` for slide 6 (OK), `#sl-07` and `#sl-08` (PART, "chưa đo trực tiếp"), slide 9 (OK) and slide 39 (OK). Làm mẫu for replica/partition and keyslot/crossslot, failover in an optional fold. W7, W6. Challenge: hashtag MSET/MGET on the cluster, no Lua. kiem-chung + `table.expect`. |
| `assembly/fragments/stage-08.html` | Capstone story (seat A34_S012C). Slide 40 figure + SVG of the ttldel overlap. Stats table for the 5 scenarios, check30, `#sl-40` (FIX). Five scenarios: `table.walk` (reset → B BLPOP → A RPUSH, then paced rows for the `.redis` scenarios, because redis-cli cannot sleep) followed by the recorded timeline. cad and fencing show the `.sh` regions plus the `.lua` file in a fold. W8. Lesson-14 bridge (`fence`/`version` conditional UPDATE). Honest Redlock fold: the clock-drift evidence is described qualitatively, with no numbers. Challenge: `lua/lock-renew.lua` with PASS 0/1. kiem-chung + `table.expect`. |
| `assembly/fragments/stage-09.html` | Story: a store spamming voucher claims (FR-M2-05) and POS retries (FR-M2-02). SVG of the bucket and the idempotency states. Stats table, check30, slide 41 (OK) checklist where each item links to the stage that measured it (uses `data-derived` r04/r06/r32). Naive versus Lua bucket (walk tables), bucket30 + W9, idempotency run + state→HTTP table + the IN_PROGRESS TTL caveat. Boss Challenge 2 bridge (`executeImportExport`/`terminateContract`, plus the line between idempotency and TOCTOU). Cache-aside link to L02. Challenge: host-side 30-call loop on `l06:my:tb:store:7`. kiem-chung + `table.expect`. Links to `#driver-drill`, `#bai-tap` and `#phong-van`; neither section is duplicated. |
| `stage-07/08/09.quiz.json` | 4 items each; every `why` cites a run id, and every 4+-digit number appears in a run (V16). |
| `assembly/widgets/w6.js` | CRC16-XMODEM over UTF-8 bytes, Redis hashtag rule, `#w6-key`/`#w6-slot` (decimal only), a second key with a same-slot verdict, and recorded-pair buttons with ✔. |
| `assembly/widgets/w7.js` | Step-by-step replay of `run-w7`; main/net/replica lanes; offsets ✔ on the last step; `sync_*` labelled "chỉ ghi nhận". |
| `assembly/widgets/w8.js` | Five tabs. Lock intervals are derived from the recorded events (OK → DEL/Lua release/next acquire/PX), with a dashed "tưởng còn giữ" bar, red reject marks and the event table. The PX end is labelled as a host-clock estimate. |
| `assembly/widgets/w9.js` | Bucket simulator using the same formula as `token-bucket.lua` (capacity, refill, gap), next to the 30 recorded calls. Shows ✔ when the parameters equal the run (the simulation then gives 10/20/100000). |

Code and runs are all `<!--@CMD …@-->` / `<!--@RUN …@-->` placeholders: 11, 23 and 15 of them, and all refs resolve. The only hand-written code is challenge text and answers, in plain `<pre>`. Every number is a `b.m[data-run|data-derived]` or comes from widget data.

## Checks (run from the plan folder)

| Check | Result |
|---|---|
| `node verify/verify-guide.mjs --fragment assembly/fragments/stage-07.html` / `08` / `09` | rc 0 ×3 |
| `node --check assembly/widgets/w6.js` … `w9.js` | ok ×4 |
| `node assembly/assemble.mjs --allow-stubs` + `node verify/verify-guide.mjs` (all V codes) | ✔ no errors (466 KB, under the new 520 KB budget) |
| `node verify/widget-smoke.mjs --guide …` | W6 8/8 match CLUSTER KEYSLOT, no exceptions |
| render-check 375/768/1440 (output in `verify/tmp/d3-render`, deleted afterwards) | 0 errors. 2 warnings, neither in my files: the `fsync` W5 label and a "chặng 6" link from another stage |
| Assembled size | stage 7 36.8 KB, stage 8 37.5 KB, stage 9 33.7 KB |

## Contract issues and notes

1. Widgets use `<div class="widget" id="wN">`. A nested `section` would end the lazy V12 `chang-N` scan early. Contract v1.1 now says the same.
2. The `#chang-9` `<pre>` mismatch that D2 saw came from a raw `$3<r` in my challenge answer. It is now `&lt;`, and V02 is green.
3. In the `.redis` two-client scenarios, `displayText` drops the `#@ sleep` lines, so pasting a whole block loses the timing. The walk tables therefore give line-by-line pacing. The shell's sentence "Mọi bước sleep … tính từ lúc này" is accurate only for `.sh` regions. Consider adjusting it in `shell-head.html` (not my file).
4. The stage-8 challenge asks the learner to create `labs/lesson-06-redis/lua/lock-renew.lua`, as the spec says. If V17/V18 later scan learner-created files, that file may need an allow rule.
5. Stages 7 and 8 are slightly above the ~35 KB guide. I removed one duplicated paragraph. The rest is the requested content (5 walk tables, folds, figures).
6. I ran one read-only `git status --short` while removing a stray `render-check/` folder that a mistaken `--help` call had created at the repo root (now deleted). No other git command was run, and no docker or Redis command was run.

Status: DONE
