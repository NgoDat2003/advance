---
phase: 5
title: "Guide shell and assembler"
status: completed
priority: P1
effort: 1h
dependencies: [3]
---

# Phase 05 — Guide shell and assembler (runs in parallel with phase 06)

## Goal
Write everything outside the stage sections, plus the assembler that stitches fragments, quiz JSON, widget JS and data into one HTML file.

## Files to create/modify (controller only)
| Path | Content |
|---|---|
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/shell-head.html` | Lesson-14 lines 1–239 verbatim, plus the contract classes; title `Sổ tay Data Modeling · Bài 07`. Hero: eyebrow `Advance Backend · Bài 07 · Day 05 · sau Bài 14`, hero-meta (43 slide · 9 chặng · 295 + 90 phút · 36 quiz + 10 phỏng vấn), slide-1 epigraph. `#cach-hoc` holds the stage-map table, the chip legend, and a prep panel: docker start; the DBX tabs `ADVANCE_BE_LAB`/`_B` using the mode found in `dbx-smoke.txt`; `00-setup.sql`; `check.sql` with its recorded output; the `l07-warmup` textarea. |
| `…/assembly/shell-tail.html` | `#bai-tap` (slide 35 flight booking: table-template checklist, DBX steps, recorded `hw-check` outputs for solution and bad fixture, solution link in a fold); `#prisma-drill` (`prisma-drill.schema.prisma` shown, a textarea per finding, a fold with answers citing stage runs and `prisma-claims.txt`); `#phong-van`; `#cheat-sheet` (type table, error codes 23502/23503/23505/23514/23P01/22001/42601/42704/54000/55000/55P03/25001/40P01/44000, ledger rules, normalization rules); `#ban-do-slide`; `#tham-khao` (slide 36 links, the PG 16 docs page behind each DIFF/FIX chip, Prisma links); `#tiep-theo` (OmniPOS Cluster 1 phase B + Boss Challenge 1 in `quan-ly-hop-dong`, then Cluster 2 lesson 06 Redis). The script block holds `GUIDE_DATA_START/END` with `SLIDES` (43), `QUIZ = /*@QUIZ@*/`, `EXAM` (10), then the lesson-14 IIFE core with every `l14` replaced by `l07`, and `/*@WIDGETS@*/`. |
| `…/assembly/assemble.mjs` | Node built-ins. It reads head, then `fragments/stage-01…09.html` in order, then tail. It replaces `/*@QUIZ@*/` with `{1: …, 9: …}` from `stage-0N.quiz.json` and `/*@WIDGETS@*/` with the concatenated `widgets/wN.js`, each wrapped in `{ … }`. Before `<script>` it inserts `<script type="application/json" id="run-wN">` for each `runs/data/wN.json`. It writes `D:/study/advance-be/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`, and exits 1 if a placeholder or fragment is missing. |

The 10 EXAM topics:
1. normalization trade-offs, with an anomaly;
2. keeping and indexing FKs;
3. the app-check orphan race;
4. ADD COLUMN on PG 11+ and its lock;
5. CREATE INDEX vs CONCURRENTLY;
6. money is never float;
7. timestamptz;
8. polymorphic options;
9. ledger design and reconciliation;
10. view vs materialized view.

Every answer cites a run.

## Test matrix
| Test | Expected | Command |
|---|---|---|
| assembler with no fragments (negative) | exit 1 "missing fragment stage-01" | `node assembly/assemble.mjs` |
| shell-only build with placeholder stubs (`--allow-stubs`) | V01, V02, V03 (stubs), V09, V10, V14 pass | `node assembly/assemble.mjs --allow-stubs && node verify/verify-guide.mjs --only V01,V02,V09,V10,V14` |
| SLIDES vs expected chips | V04 passes on the shell | `node verify/verify-guide.mjs --only V04` |

## Verification
Run the commands above. Render-check the stub build once to catch CSS regressions early.

## Risks and rollback
A CSS copy drifting from the lesson-14 shell: copy it verbatim, then append only the new classes. Rollback: delete `assembly/shell-*` and `assemble.mjs`.

