---
phase: 6
title: "Stage fragments (3 parallel delegates)"
status: completed
priority: P1
effort: 1.5h
dependencies: [1, 4]
---

# Phase 06 — Stage fragments

## Goal
Write the nine stage sections in Vietnamese, each following "làm mẫu → tự làm", with widgets that teach a mechanism from recorded data.

## File ownership (disjoint; no delegate touches DB, `labs/`, `runs/`, shell or assembler)
| Owner | Files under `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/` |
|---|---|
| Delegate D1 | `fragments/stage-01.html`, `stage-02.html`, `stage-03.html`, `stage-0{1,2,3}.quiz.json`, `widgets/w1.js`, `w2.js`, `w3.js` |
| Delegate D2 | `fragments/stage-04.html`, `stage-05.html`, `stage-06.html`, quiz json 4–6, `widgets/w4.js`, `w5.js`, `w6.js`, `w7.js` |
| Delegate D3 | `fragments/stage-07.html`, `stage-08.html`, `stage-09.html`, quiz json 7–9, `widgets/w8.js`, `w9.js`, `w10.js` |

Each delegate's prompt contains the following:
- the task;
- the files to read: `assembly/contract.md`, the stage map and matrix in `plan.md`, its own `labs/*.sql`, `runs/*.txt` and `runs/data/wN.json`, the slides `.md`, and lesson-14 guide lines 1–430 and 2304–2645 as the style model;
- the files it may write (table above);
- the constraints below;
- acceptance: `--fragment` exit 0 for each of its stages;
- the reply format `Status/Summary/Concerns`;
- the note that no `--yagni` flag was passed.

## Fragment format (frozen)
- `<section id="chang-N" class="stage col">` with `stage-head` (`stage-no` `0N`, `stage-meta` slides · minutes · Day 05), `p.goal`, `dl.wwh` (LÀ GÌ / TẠI SAO / KHI NÀO KHÔNG).
- `figure.slide-fig` for each existing image (`../../Tài Liệu/advanced_backend/assets/7_Data_Modeling/page_NN_*.png`, `onerror` hides it). Images exist for pages 5, 7, 9, 10, 15, 17, 20, 22, 27, 28, 29, 30, 31, 35, 41.
- Per slide in range: a callout with `.sayvs` ("Slide nói / PG 16 đo được") and the chip. DIFF and FIX slides carry `id="sl-NN"`.
- Code is `<pre data-sql="05-data-types.sql#money"><code>` holding the exact, escaped region. Output is a `div.run-label` ("Kết quả đã chạy trên máy bạn ngày 27/10/2026") plus `pre[data-run]`; `…` excerpts are allowed. Inline numbers use `<b class="m" data-run>`.
- Two-session experiments use a `table.walk` (# / ADVANCE_BE_LAB (A) / ADVANCE_BE_LAB_B (B) / Ghi lại) with `data-store="l07-cN-…"` inputs, followed by the recorded merged timeline.
- Worked example (`callout teacher`, "Làm mẫu"), then `div.callout.challenge#chang-N-tu-lam` ("Tự làm" task, PASS criteria, a self-check query, and an answer in `details.fold`), then `<div class="quiz" data-quiz="N"></div>`.
- Quiz JSON: 4 × `{q, opts[4], ans, why}`. Each `why` cites a run/region.
- Widget JS: a block that uses only the IIFE helpers (`$`, `$$`, `esc`, `run`, `press`, `store`), reads `run('wN')`, guards for null, and adds no global. Widget markup: `div.widget#wN` with `widget-head` (h4 `WN · …`, eyebrow with run id) and `widget-body`. Any control is at least 44 px.

## Per-stage content (challenge in italics)
1. Process → ERD → 4 table types → W1 (an inline SVG ERD of `erd_*` + ledger tables; clicking an entity shows its type and columns from the catalog). *Classify 8 OmniPOS tables by type.*
2. Slide 9's student example, then the northwind sheet 0NF→3NF with each anomaly reproduced; denormalization with drift. W2 stepper highlights duplicated cells and shows anomaly counts. *Normalize a flat F&B "phiếu nhập kho" (given 6 rows) to 3NF in DBX, as `my_*` tables.*
3. FK cost and index; slide 11 opinion vs the race. W3 lanes replay the `nofk`/`fk` timelines, toggle "có FK", and show orphan 1 vs 23503. Slide 12 refcol. *Repeat the race by hand in two tabs; then make the no-FK version safe with `SELECT … FOR KEY SHARE` and explain why that is re-implementing FK.*
4. ADD COLUMN, rewrite vs fast default, lock; jsonb + indexes; spare columns; CREATE INDEX vs CIC; template. W4 shows a log-scale ms meter, a rewrite badge, the lock mode, and a plain/CIC toggle with B's outcome. *Add `data jsonb` + an expression index to `tpl_stores` with `lock_timeout` set; paste the EXPLAIN.*
5. Types and NULL. W5: choose a field (tên món, giá, created_at, giờ hẹn, số lượng, ghi chú, trạng thái) to see the PG type, Prisma type, recorded bytes and trap; plus a money panel with the recorded float drift. *Pick types for a 10-column `menu_items` table and justify each with a recorded number.*
6. Case studies. W6 bisection: JS halves live in float64 and in `Math.fround` float32 and compares with the recorded 53/24 (✔ when equal); a "rebalance" button shows the recorded row count. W7 calendar: a month grid from recorded rows; clicking a 3-night range replays the recorded conditional booking and the 23P01. *Design `my_table_reservations` for a restaurant with an exclusion constraint and prove the double booking fails.*
7. Views: MERGE/TEMPTABLE mapped to PG inlining vs subquery fence. W10 shows three plan tabs with `Subquery Scan` highlighted. *Write a view the planner cannot flatten and show the plan.*
8. Polymorphic: three designs. W8 tabs plus "Xóa post #1" show the recorded orphans and codes; a Prisma note covers what each maps to. *Model `my_attachments` for `contracts | stores` as an exclusive arc.*
9. Ledger capstone. A static inline SVG ERD of the ledger (W1 belongs to stage 1), invariants, posting walkthrough, attacks, reconciliation, race with and without ordering. W9 replays the steps with wallet bars, an entries table and an invariant panel. A 5-line recap of lesson-14 tools links to L14 `#chang-1`/`#chang-5`. *Add `refund(transfer_id)` that posts the reverse entries idempotently; PASS = check.sql C09–C12 ✔ and a second call raises 23505.*

## Test matrix
| Test | Expected | Command |
|---|---|---|
| fragment checks (V05–V07, V09, V12) | exit 0 per fragment | `node verify/verify-guide.mjs --fragment assembly/fragments/stage-0N.html` |
| quiz shape | 4 items, `ans` 0–3 | `node -e "…JSON.parse…"` via `--fragment` |
| widget JS syntax | no error | `node --check assembly/widgets/wN.js` |

## Verification
The controller reruns every `--fragment` check itself before accepting a delegate's DONE.

## Risks and rollback
Delegates may paraphrase SQL in the HTML; V05 rejects that. A widget may invent numbers; V07/V08 and review catch it. Rollback: delete the delegate's files and re-dispatch with the failure message.

