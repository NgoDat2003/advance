---
phase: 7
title: "Stage fragments, quizzes, widgets (delegates D1–D3)"
status: pending
priority: P1
effort: 2.25h
dependencies: [5, 6]
---

# Phase 07 — Stage fragments

## Goal
Eight fragments, 32 quiz items, 9 widgets, EXAM and cheat-sheet numbers, written in parallel against the contract.

## Files to create/modify (disjoint)
- **D1:** `$P/assembly/fragments/stage-01…03.{html,quiz.json}` and `widgets/w1–w4.js`.
- **D2:** `stage-04…06.*` and `w5–w7.js`.
- **D3:** `stage-07…08.*`, `w8.js`, `w9.js`, plus EXAM and the cheat-sheet numbers in `shell-tail.html` (D0 is finished by then).
- Delegates never edit labs, runs, `contract.md` or another delegate's files. Contract changes go through the controller.

## Fragment format (frozen, L06 order)
1. `section#chang-N` with `stage-head`, `p.goal`, `dl.wwh`.
2. `dl.gloss` (every new command, in plain Vietnamese, before any `pre[data-cmd]`).
3. `.story`.
4. Figure or SVG.
5. `table.stats` with `b.m[data-run|data-derived]` ("phụ thuộc máy" on timings).
6. `.check30`.
7. `.sayvs` per chip slide (`id="sl-NN"` for PART).
8. The "Làm mẫu" callout.
9. `table.walk` (reset, then B, then A).
10. `kiem-chung` with `table.expect`.
11. `callout challenge` with PASS criteria and an answer fold.
12. `.quiz` with 4 items, each `why` citing a run id.

Widgets are IIFEs that read `run('wN')`, guard null, write via `textContent`/`esc()` only, use ≥ 44 px controls and `wN-` ids.

## Per-stage content
| Stage | Story | Widget | Tự làm (PASS) |
|---|---|---|---|
| 1 | 300 stores: one Redis or a cluster? | W1 slot calc | hashtag post 77's 4 counters, `MSET`: no CROSSSLOT |
| 2 | two cashiers, last voucher (L06 back-link) | W2 lanes | WATCH + 3 retries: 1 redeemed |
| 3 | store 7's stuck POS; 4 acts | W3, W4 | `my-traffic.tsv`: counter ≥ 8/10 s, log 5 |
| 4 | FR-M2-05; kitchen queue; batches | W5 | act 1 allows 5, first Retry-After 2 s |
| 5 | likes on a new dish; Pika "chưa đo trực tiếp" | W6 | `-c 2` vs `-c 8` tps + reason |
| 6 | 10M-member promo | W7 ("ngoại suy") | `unread_uB=2` |
| 7 | instance A asks B to print | W9 | 0.05 s polls ≥ BLPOP latency |
| 8 | unpaid orders, visitors, vegetarian ∩ spicy, referral code (L06/L02 back-links) | W8 | m 100000, k 3: fp in band, 10000/10000 members |

## Tasks

**T7.1 D1 stages 1–3.**
- **Goal:** 3 fragments and W1–W4.
- **Target:** D1 files.
- **Steps:** write the fragments per the table, then run `--fragment` on each.
- **Success:** rc 0 for each.
- **Verify:** `for n in 1 2 3; do node $P/verify/verify-guide.mjs --fragment $P/assembly/fragments/stage-0$n.html || echo FAIL$n; done` → no `FAIL`

**T7.2 D2 stages 4–6.**
- **Goal:** 3 fragments and W5–W7.
- **Target:** D2 files.
- **Steps:** as T7.1.
- **Success:** rc 0.
- **Verify:** the same loop for `4 5 6` → no `FAIL`

**T7.3 D3 stages 7–8, EXAM, cheat sheet.**
- **Goal:** 2 fragments, W8–W9 and the shell data.
- **Target:** D3 files.
- **Steps:**
  1. Write 10 interview questions: fixed vs sliding (with numbers), Lua vs WATCH, token refill, Retry-After, fail-open/closed, PG hot row, write-behind loss, unread design, HLL, Bloom sizing.
  2. Fill the cheat-sheet numbers from `w3`/`w5`/derived only.
- **Success:** fragments pass; V11/V16 GREEN.
- **Verify:** the loop for `7 8` → no `FAIL`; `node $P/assembly/assemble.mjs --allow-stubs && node $P/verify/verify-guide.mjs --only V11,V16; echo rc=$?` → `rc=0`

**T7.4 Controller acceptance.**
- **Goal:** no unchecked delegate output.
- **Target:** none.
- **Steps:** re-run `--fragment`, `node --check` each widget, then run the widget smoke on a stub build.
- **Success:** GREEN.
- **Verify:** `for w in $P/assembly/widgets/w*.js; do node --check $w || echo BAD; done; node $P/assembly/assemble.mjs --allow-stubs && node $P/verify/widget-smoke.mjs --guide "$G"; echo rc=$?` → no `BAD`, then `rc=0`

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment rules, V19 | rc 0 | `--fragment` |
| invented number / Lua in stage 1 | cases b and y RED | `negative-tests.sh --guide-only` |

## Risks and rollback
V07/V16 catch invented numbers; V05 catches reworded code. Rollback: delete that delegate's files.

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

