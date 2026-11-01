---
phase: 6
title: "Stage fragments (3 delegates)"
status: completed
priority: P1
effort: 1.75h
dependencies: [4, 5]
---

# Phase 06 — Stage fragments

## Goal
Nine verified stage fragments, quizzes and widgets written in parallel against the frozen contract.

## Files to create/modify (disjoint ownership)
`D:/study/advance-be/plans/261031-1651-lesson-06-redis-teacher-guide/assembly/`:
- D1: `fragments/stage-01..03.html`, `stage-01..03.quiz.json`, `widgets/w1.js`–`w4.js`
- D2: `fragments/stage-04..06.html`, `stage-04..06.quiz.json`, `widgets/w5.js`
- D3: `fragments/stage-07..09.html`, `stage-07..09.quiz.json`, `widgets/w6.js`–`w9.js`

Delegates read the contract, the plan matrix, runs and lab files. They may not edit labs, runs, the shell or `contract.md`. A needed contract change goes to the controller, who bumps the version.

## Fragment format (frozen)
- `<section id="chang-N" class="stage col">`: `stage-head` (`0N`, slides · minutes · core/tùy chọn), `p.goal`, `dl.wwh` (LÀ GÌ / TẠI SAO / KHI NÀO KHÔNG).
- Order inside the stage:
  1. `.story` callout (an F&B/OmniPOS situation);
  2. a diagram (`figure.slide-fig` for slides with images — pages 4–9, 12, 16, 18, 19, 25–27, 35, 39, 40, 43 — and/or an inline SVG using token colours);
  3. `table.stats` "Đo trên máy bạn ngày …" with `b.m[data-run]` cells;
  4. `.check30` (one question, answer in `details`).
- Per stage, a `kiem-chung` block: `pre[data-cmd="<stage file>#kiem-chung"]` (plain redis-cli commands) next to `table.expect` (Lệnh / Giá trị mong đợi / Ý nghĩa). Each expected value is a `b.m[data-run="<stem>.kiem-chung"]` from the recorded run, so the learner compares his terminal with the table. No Lua checker. <!-- user decision b -->
- Per slide: a `.sayvs` callout ("Slide nói / Redis 7.2.3 đo được") with the chip. PART/FIX slides carry `id="sl-NN"`.
- Code: `<pre data-cmd="<file>#<region>"><code>` (filled by the assembler). Output: `div.run-label` + `pre[data-run]` (`…` excerpts allowed).
- Two-client steps: `table.walk` (# / Terminal A / Terminal B / Ghi lại, `data-store="l06-cN-…"`). Row 1 is always the reset region, row 2 starts B (it waits on `BLPOP l06:barrier:<scenario> 5`), row 3 starts A (`RPUSH`). Then the recorded timeline (host-ms). Lua variants show the `.sh` region with its `MSYS_NO_PATHCONV=1 docker exec … redis-cli --eval /lab/lua/<name>.lua …` lines and, in a fold, the `.lua` file via `pre[data-cmd="lua/<name>.lua"]`. <!-- red-team #1 --> <!-- red-team #7 -->
- `callout teacher` "Làm mẫu", then `div.callout.challenge#chang-N-tu-lam` (task, PASS criteria, self-check command, answer in `details.fold`), then `.quiz[data-quiz=N]`.
- Quiz: 4 × `{q, opts[4], ans, why}`; every `why` cites a run id.
- Widgets: IIFE helpers only, read `run('wN')`, guard null, no globals, controls ≥ 44 px, ids prefixed `wN-`. Any run- or data-derived string goes to the DOM through `textContent` or `esc()` (contract §4, checked by V19). <!-- red-team #15 -->
- Computed values (MB/s, keys/s, ratios) use `b.m[data-derived="<name>"]` from `runs/data/derived.json`, never a hand-typed number. <!-- red-team #9 -->

## Per-stage content (challenge in italics)
1. Story: the store's POS freezes when one admin runs `KEYS *`. W1 lanes replay A's `DEBUG SLEEP` and B's waiting PING. A toggle shows the recorded 0.5 s SLOWLOG case. The stats table covers req/s for `-P 1/16`, sizes, and MGET vs GET. *Run `DEBUG POPULATE 200000 l06:my:pop` (allowed on main through docker exec), then time `KEYS l06:my:*` vs `SCAN` in A while B PINGs. PASS: B's wait ≈ the KEYS time, and SLOWLOG lists KEYS.*
2. Story: a user object for the loyalty app. W2 takes field count and value length, predicts the encoding with 7.2 thresholds, and shows the recorded `OBJECT ENCODING`/bytes row with ✔ when they match. Slide 30's answer is a C1/C2/C3 table plus the lost-update timeline. *Model a menu item three ways, predict encodings first. PASS: predictions = `OBJECT ENCODING`.*
3. Story: a voucher key that nobody reads again. W3 simulates 20-key sampling. A toggle picks "slide: 25%" or "7.2: 10% stale, time cap 25% CPU", next to the recorded before/after. W4 is a policy picker with recorded survivor bars and the OOM line. *Set `volatile-lru` on `-evict` (every command is `docker exec advance-be-redis-evict redis-cli …`, the block prints `→ advance-be-redis-evict` first; never in terminal A/B on main), predict the survivors, run, restore. PASS: TTL-less keys 100% survive.* <!-- red-team #12 -->
4. Story: the hub restarts after a power cut. W5 is a timeline with snapshot/fsync marks; "kill -9 ở đây" shows the recorded loss per mode. *Choose persistence for idempotency keys, buckets and the best-seller ZSET (rebuildable from SQL, I-09). PASS: written choice with a recorded number for each.*
5. Story: kitchen order queue and the best-sellers board (FR-M2-04). The counter race comes first, then BRPOP two terminals, reliable BLMOVE, cart, likes and leaderboard. Streams is a short optional contrast. *Build `l06:my:kitchen` with BLMOVE + ack; "crash" the consumer before the ack. PASS: the item is still in the processing list.*
6. Story: auto-cancel an unpaid order after 10 min (slide 37). SVG of the ZSET timeline; naive vs Lua pollers; big key DEL vs UNLINK table. *Two pollers over 20 jobs with `delay-claim.lua`. PASS: each job id in `l06:my:done` exactly once.*
7. Story: reads go to the replica during a network cut. W7 replays partition steps and offsets. Sentinel is a diagram with an honest label; slides 7 and 8 carry chip `Đúng một phần` with the note "chưa đo trực tiếp" (no Sentinel or Cluster failover runs on this machine). The partition replay ends with the forced reconnect (replica restart, poll until `master_link_status:up`) and shows `sync_partial_ok`/`sync_full` as observed values. <!-- red-team #14 --> <!-- red-team #4 --> W6 is a CRC16-XMODEM slot calculator (JS) with hashtag rules, checked ✔ against recorded `CLUSTER KEYSLOT` values. *Pick hashtags so `cart` and `cart-lock` for user 34 share a slot; run a 2-key `MSET` then `MGET` on the cluster container. PASS: equal slots, no CROSSSLOT.* <!-- user decision b: no Lua outside stages 6, 8, 9 -->
8. Capstone story: two cashiers book seat A34_S012C. W8 shows five tabs (nolock, nx, ttl+DEL, compare-and-delete, fencing) with TTL bars from the recorded timelines. There is a lesson-14 bridge (version/conditional UPDATE) and an honest Redlock paragraph. *Add `lua/my-lock-renew.lua` (PEXPIRE only if owner) and run it with `MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/my-lock-renew.lua <key> , <token> <ms>`. PASS: returns 0 for non-owner, 1 for owner, recorded in your terminal.* <!-- red-team #6 -->
9. Story: one store spams voucher claims (FR-M2-05). W9 is a token-bucket simulator (capacity/refill sliders) next to the recorded 30-call result. Then idempotency states (FR-M2-02, Boss Challenge 2 `executeImportExport`/`terminateContract`), the slide-41 best-practice checklist (each linked to its measuring stage), and a cache-aside link to L02. *Run the bucket for `store:7` with capacity 10. PASS: exactly 20 denied with `retry_after_ms`.*

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment checks | exit 0 per fragment | `node verify/verify-guide.mjs --fragment assembly/fragments/stage-0N.html` |
| quiz shape | 4 items, `ans` 0–3, `why` cites a run | included in `--fragment` (loads sibling `stage-0N.quiz.json`) <!-- red-team #9 --> |
| widget escaping | no unescaped `${…}` in `innerHTML` | V19 in `--fragment` <!-- red-team #15 --> |
| widget syntax | no error | `node --check assembly/widgets/wN.js` |
| CRC16 widget vs runs | all recorded pairs ✔ | `node assembly/assemble.mjs --allow-stubs && node verify/widget-smoke.mjs --guide reports/advanced_backend/lesson_06_redis_teacher_guide.html` (script from phase 02; its W6 step compares with `runs/07-cluster.keyslot.txt`) <!-- red-team #9 --> |

## Verification
The controller re-runs every `--fragment` and `node --check` before accepting a delegate's DONE.

## Risks and rollback
Delegates inventing numbers is caught by V07. Rewording code is caught by V05, since the assembler overwrites `pre[data-cmd]` anyway. Rollback: delete that delegate's files.

