# Red-team review: Scope & Complexity Critic / Contract Verifier

Plan: `plans/261102-1332-k2-lesson-04-caching-teacher-guide/plan.md` + `phase-01…10`. Inputs: `evidence-packet.md` (§1, §4, §9), `kongming-investigation-counsel.md`. Model: `plans/261031-1651-lesson-06-redis-teacher-guide/`.
Reviewer: code-reviewer (hostile), 2026-11-03. Requested scope (full overlap re-measure, hand-built Bloom, all 8 content blocks) is treated as a constraint and is not a finding.

## Contract consumer enumeration (what I checked)

Nothing in the plan has been built yet: `labs/k2-lesson-04-caching/` does not exist, and `$P/verify/` holds only `ultra-plan/`. So every check below compares plan text against plan text, plus the L06 tools the plan says it copies.

| Contract | Consumers checked | Result |
|---|---|---|
| Matrix rows (plan.md:73–138) | plan.md:140, :53; phase-02 T2.9 (:172), test matrix (:178); phase-03 T3.1b; per-stage `--only-rows` lists | **Mismatch.** The matrix has 66 rows: 7 design rows and **59** run rows, with 57 distinct run ids (`01-cluster.keyslot` is used by R08 and R09, `07-share.pool.timeline` by R28 and R29). The plan says 58. See F1. |
| Chip rows vs null-chip list | plan.md:142, T1.4 regex, T2.5 expected list | Consistent. There are 27 chip slides, and their complement in 1–39 is exactly 1,2,3,10,12,17,18,23,26,32,38,39. The PART list (7,8,14,16,20,21,22,29,31,36) matches the PART chips. |
| Run ids ↔ `record-all.sh --out` ↔ runner file names | phase-03 T3.1b vs L06 `run-redis.mjs:281-287` | **Mismatch.** The gate cannot pass for the 9 A/B `.timeline` ids. See F2. |
| `record-all.sh` group ownership | phase-03 files line, T3.1b, phase-04 files line, phase-05 T5.2 | **Conflicting.** See F3. |
| Stage minutes | plan.md:34–44 | Core: 15+35+30+40+45+40+20+20+40+5 = 290 ≤ 300. Optional: 47. Both add up. |
| Effort | plan.md:6 vs the phases table | The phases add up to 16.5 h. Consistent. |
| Negatives | phase-02 T2.8 | 13 guide + 18 lab + 1 data + 2 homework = 34, matching T8.3. The lab count of 18 matches T4.6. |
| Storage prefix `k2l04-` / key prefix `k2l04:` | contract §1/§7 (T1.4), T2.6 V09, T6.1, negative case c | Consistent. |
| Container, volume and network names | plan.md:23, phase-03 lifecycle table, T2.2 GUARD, T1.1 fingerprint exclusion, T10.3 | Consistent. `smoke` is in the GUARD and is excluded from the fingerprint by prefix. |
| Phase 10 doc line citations | `generate_master_curriculum_reports.py:447`, `TONG_QUAN…MD:419`, `.html:1806`, L06 guide `:4532`, L06 `shell-tail.html:219` | All verified with grep. They exist at the cited lines. |

---

## Finding 1: Run-row count stayed at 58 after must-fix 9 added R16h. Phase 02's RED gate will fail, and R16h/R30b are never gated per stage

- **Severity:** High
- **Location:** plan.md "Expected-result matrix" footer and phases table; Phase 02, T2.9 and the test matrix; Phase 03, T3.6; Phase 04, T4.4
- **Flaw:** Must-fix 9 added row `R16h 04-contract.http429`, but nobody recounted. The matrix now has 59 rows with a run id. The plan still says "58 run rows (57 if S10 = no)" and "RED ×58". The L06 verifier the plan copies prints one `missing run` line per row, not per distinct id (`verify-guide.mjs:369-371`: `for (const r of expectedRows()) … fail(r.id, \`missing run ${r.run}\`)`). So the red-first count is 59, or 58 when S10 = no. Separately, the stage-4 gate T3.6 leaves out R16h, and the stage-7 gate T4.4 leaves out R30b, even though T4.4 Steps records `tracking` when S10 = yes.
- **Failure scenario:** On a correct build, T2.9 Verify prints `59`, not `58`. That trips the Failure Protocol and stops phase 02 while kongming is consulted about a bookkeeping error. Later, a broken `04-contract.sh#http429`, or a wrong `Retry-After` value, passes T3.6 and T4.4. It only surfaces at T4.6, after stages 5–8 have been recorded, so the rollback costs more.
- **Evidence:** In plan.md, the R16h row is at :107, the count claim at :140 and "RED ×58" at :53. Diffing the matrix against `reports/planner-ultra-candidate-1.md` shows exactly one added row, `R16h`. In phase-02-tests-first.md, T2.9 Verify `→ 58` is at :172 and the test matrix row "RED ×58" at :178. phase-03-containers-stages-1-4.md:148 lists `R15,R15b,R16,R16a,R16b,R16c,R16d,R16e,R16f,R16g`, without R16h. phase-04-stages-5-8.md:79 lists `R28,R29,R29b`, without R30b. Cross-check: every matrix run row except R16h and R30b appears in some `--only-rows` list.
- **Suggested fix:**
  - Change plan.md:140 to "7 design rows and 59 run rows (58 if S10 = no); 57 distinct run ids (56)".
  - Set T2.9 and both "RED ×" mentions to `59 (58 if S10 = no)`.
  - Add `R16h` to T3.6 `--only-rows`.
  - Add `R30b` (when S10 = yes) to T4.4.

## Finding 2: T3.1b's `--out` = run-id set equality cannot be satisfied for the nine A/B `.timeline` ids, and the single-client `--timeline` naming is inconsistent

- **Severity:** High
- **Location:** Phase 03, T3.1b "`record-all.sh`" (must-fix 1); Phase 02, T2.2 step 8; plan matrix timeline rows
- **Flaw:** T3.1b asks every run row to have a line with `--out <run id>`. Its Verify diffs the set of `--out` values against `expected.tsv` column `run`. But the L06 runner, which T2.2 copies into `run-lab.mjs`, treats `--out` in `--ab` mode as a base name. It writes `${out}.A.txt`, `${out}.B.txt` and `${out}.timeline.txt` (`run-redis.mjs:281`, `:286-287`). The 9 A/B run ids all end in `.timeline`: `02-race.getset.timeline`, `02-race.watch.timeline`, `04-leaky.worker.timeline`, `04-tb-race.claim.timeline`, `04-tb-race.naive.timeline`, `07-share.pool.timeline`, `07-share.tracking.timeline`, `08-delay.claim.timeline`, `08-delay.naive.timeline`. That leaves two options:
  - `--out 02-race.watch` records the right file, but the T3.1b diff then fails on 9 ids.
  - `--out 02-race.watch.timeline` passes the diff, but the runner writes `02-race.watch.timeline.timeline.txt`. R33 and the 8 other rows then read as `missing run`.

  On top of that, T2.2 step 8 adds `--timeline` for single-client runs without saying how they are named. The matrix uses a `.timeline` suffix for `03-live.fixed-boundary.timeline` but none for `05-counter.pg-burst`, although phase 04 marks that run `--timeline` as well. L06's own `record-all.sh` never passes `--out` to `ab` (`record-all.sh:10`), so "copy then adapt" gives no template for the new rule.
- **Failure scenario:** Whatever choice the Sonnet-class executor makes, T3.1b Verify and T3.3–T3.6 can't both pass. Phase 03 stops in the Failure Protocol before any stage is recorded. Must-fix 1 was meant to remove exactly this kind of drift.
- **Evidence:** L06 runner: `plans/261031-1651-lesson-06-redis-teacher-guide/verify/run-redis.mjs:8` (`--ab … [--out <tên>]`), `:281`, `:287`. L06 record-all: `verify/record-all.sh:10`. phase-03-containers-stages-1-4.md:106 (step 2) and :109 (Verify). In plan.md, the timeline rows are at :86, :87, :98, :101, :102, :121–122, :126, :127, :128, single-client `03-live…timeline` at :93, and `05-counter.pg-burst` (no suffix) at :110, against phase-04-stages-5-8.md:31 ("`pg-burst` (`--timeline`)"). phase-02-tests-first.md:43 (step 8).
- **Suggested fix:** Freeze one rule in contract §3:
  - For `--ab`, the run id is `<out>.timeline`.
  - The T3.1b Verify compares `--out` values with `sed 's/\.timeline$//'` applied to the expected run ids, but only for lines with `--ab`.
  - The single-client `--timeline` either always adds `.timeline` (then rename R20's run to `05-counter.pg-burst.timeline`) or never does (then rename R13c's run).

## Finding 3: `record-all.sh` group ownership contradicts itself across phases 03, 04 and 05, and H01–H03 have no group

- **Severity:** Medium
- **Location:** Phase 03, "Files to create/modify" and T3.1b; Phase 04, "Files to create/modify"; Phase 05, T5.2 step 5
- **Flaw:**
  - The phase-03 file list scopes the script to `setup s1 s2 s3 s4 gates34`. Yet T3.1b, in the same phase, writes `setup|…|s8|gates`, and its Verify requires every run id in `expected.tsv` to be present. That includes all stage 5–8 ids (their lab files are only written in phase 04) and `hw-check.solution|bad|scaffold`.
  - Phase 04 claims `record-all.sh` (`s5 s6 s7 s8 gates`) again.
  - No group is named for homework. T5.2 step 5 records H01–H03 by hand, outside the script, so T3.1b's "exactly once in the script" either forces a dead hw line into a stage-1–4 phase or fails.
  - The `kiem-chung` runs from T3.7 step 4 and T4.6 step 5 have no matrix rows. If they carry `--out` as T3.1b step 2 prescribes, the set diff fails. If they don't, the "only writer of runs/" rule is followed by convention only.
- **Failure scenario:** The executor writes T3.1b at stage-1–4 scope as the file list says, and Verify fails on about 30 missing ids. Or the executor adds hw/s5–s8 lines in phase 03, and then phase 04 "creates" a file that already has those groups. Either way you get a Failure Protocol stop or duplicate lines that T3.1b's "exactly once" then rejects.
- **Evidence:** phase-03-containers-stages-1-4.md:19 vs :106–107 and :109. phase-04-stages-5-8.md:18. phase-05-widget-data-homework-claims.md:49. phase-03:157 ("the kiem-chung runs") and phase-04:96. L06 precedent: `record-all.sh:27,34,44,…` record `kiem-chung` without `--out`, and its `expected.tsv` has 0 `kiem-chung` rows (`grep -c kiem-chung` → 0).
- **Suggested fix:**
  - Phase 03 writes the whole script once, with groups `setup s1…s8 hw gates34 gates`. Stage 5–8 and hw lines are allowed to name files that don't exist yet; T3.1b Verify is only `bash -n` plus the set diff.
  - Phase 04 and phase 05 then only *run* `record-all.sh s5…` and `record-all.sh hw`.
  - `kiem-chung` lines carry no `--out`, and the Verify `grep` excludes them explicitly.

## Finding 4: Stage 3 runs and shows stage-4 limiters (token-interval, token bucket, leaky) before the stage that teaches them

- **Severity:** High
- **Location:** Phase 03, `03-replay.sh` `compare` region and T3.5; Phase 02, T2.3 step 3 (`compare.awk`); plan matrix R14c; Phase 05, T5.1 (w3); Phase 07, the stage-3 row and D1 (W3)
- **Flaw:** The memory rule, which the evidence packet treats as authoritative, says "no script appears before the stage that teaches it". The plan breaks it in two places:
  - `03-replay.compare`, recorded as R14c in stage 3 and gated by T3.5, "runs 4 scripts per row", and `compare.awk` prints `khac_fixed_interval`. That is `rl-token-interval.lua`, the slide-16 interval bucket, which stage 4 introduces.
  - W3, the stage-3 widget owned by D1, shows "all 6 replays (rows + summaries)", so the token, token-interval and leaky results appear in stage 3.

  It is also a duplicate. R16 (`04-replay.token-interval` "= R13") already proves the fixed = interval equivalence in stage 4, where it belongs.
- **Failure scenario:** In stage 3 Đạt meets a `khac_fixed_interval=0` column and a widget with token and leaky decisions he hasn't been taught. That is the exact "script before its stage" pattern he rejected in the L06 red team. V12 only checks for Lua in `chang-1`, so no checker catches it.
- **Evidence:** phase-03-containers-stages-1-4.md:59; phase-02-tests-first.md:63; plan.md:96 (R14c `khac_fixed_interval=0`), :99 (R16 = R13), :37–38 (W3 in stage 3, token-interval in stage 4); phase-05-widget-data-homework-claims.md:26 ("w3 all 6 replays"); phase-07-stage-fragments.md:16 (D1 owns W3), :42; phase-02-tests-first.md:111 (V12 checks only `chang-1`); evidence-packet.md:38.
- **Suggested fix:**
  - Make `03-replay.compare` run only fixed, log and counter, and print `counter_qua_log_chan` and `counter_chan_log_qua`. Drop `khac_fixed_interval` from R14c and let R16 carry that claim in stage 4.
  - Limit `w3.json` to the three stage-3 replays and move the token, interval and leaky series into W5.
  - Extend V12 so the `rl-token-*` and `rl-leaky` names may not appear before `chang-4`.

## Finding 5: `pg_other_writes` is "advisory" but sits inside two exact-diff gates, so T1.1 and T4.1 fail on company-app noise, and AC15 still calls it a hard guarantee

- **Severity:** High
- **Location:** Phase 01, T1.1 (step 2 and Verify); Phase 04, T4.1 Verify; plan.md acceptance criterion 15; must-fix 4
- **Flaw:** Must-fix 4 made `pg_other_writes` advisory because "the company dev app shares `quan-ly-hop-dong-postgres-1`", which means the value changes whenever that app writes. The line is still printed by `fingerprint.sh`, though, and two Verify steps diff that output byte for byte:
  - T1.1 diffs two consecutive full runs and expects `rc=0`.
  - T4.1 runs `fingerprint.sh | grep '^pg_'` before and after setup and expects `diff` to give `rc=0`, so `pg_other_writes` is included.

  AC15 also still promises "other-schema writes unchanged". The line produces no gate value, and it makes two gates flaky.
- **Failure scenario:** The company app writes one row between the two fingerprint runs in T1.1, or during `05-counter-pg.sql#setup` in T4.1. The diff returns 1, the Failure Protocol fires, and kongming is asked about a change the plan has already declared acceptable. Or the executor "fixes" it by weakening the diff ad hoc.
- **Evidence:** phase-01-contract-baseline-smoke.md:36–37 (advisory), :40 (`diff fp-a fp-b` → `rc=0`). phase-04-stages-5-8.md:51, :55 (`grep '^pg_'` then `diff … rc=0`). plan.md:162 (AC15 "PG schemas and other-schema writes unchanged") vs plan.md:198 (must-fix 4). evidence-packet.md:174 (the company's dev data lives in this container).
- **Suggested fix:** One of these:
  - Drop `pg_other_writes` entirely. Write safety is already enforced before execution by `run-lab.mjs` exiting 2 on `pgWriteTargets` and by the V17 SQL-target lint.
  - Or print it to a separate `fingerprint.sh --pg-info` output that no diff consumes.

  In either case, change T4.1 to `grep '^pg_schemas'`, and change AC15 to "PG schema list unchanged; writes outside `k2l04_counter` prevented by runner guard and lint".

## Finding 6: Phase 06 (D0) runs in parallel with phases 03–05 but writes sections whose content phase 05 produces

- **Severity:** Medium
- **Location:** Phase 06, frontmatter `dependencies: [2]` and T6.3 (`#bai-tap`, `#guard-drill`, `#tham-khao`); plan.md phases table "02 ∥ 03–05"
- **Flaw:** In T6.3, D0 writes:
  - `#bai-tap`, with the T5.2 contract, H0–H8, the solution fold and `<!--@RUN hw-check.solution@-->`;
  - `#guard-drill`, with `<!--@CMD drill/rate-limit.guard.ai-snippet.ts@-->`, "6 inputs" and an answer fold;
  - `#tham-khao`, with "source URLs".

  The homework scaffold, the solution, the H-check semantics, the drill file and its seeded mistakes, and the sourced URLs (`source-claims.txt`, `drill-claims.txt`) are all created in phase 05 (T5.2, T5.3). Phase 05 may still change them, since its Failure Protocol allows `[UNVERIFIED]` quotes to be dropped. After phase 06 nobody owns those three sections: in phase 07, D3 only touches EXAM and cheat-sheet numbers in `shell-tail.html`. `--allow-stubs` hides the gap at T6.3 Verify.
- **Failure scenario:** D0 types the reference URLs and drill answers from the plan text before phase 05 has verified them. Phase 05 then rejects a quote or changes a seeded mistake, the shell keeps the stale text, and V07/V16 don't check prose URLs or answer folds. The final guide cites an unverified source or explains a drill mistake that isn't in the file.
- **Evidence:** phase-06-shell-assembler.md:7 (`dependencies: [2]`), :13 ("runs in parallel with phases 03–05"), :42–44; plan.md:57; phase-05-widget-data-homework-claims.md:16–17, :49, :57–61, :71; phase-07-stage-fragments.md:18.
- **Suggested fix:** D0 leaves `#bai-tap`, `#guard-drill` and `#tham-khao` as marked stubs. Phase 07 then assigns them to D3, or to a controller task T7.5 that depends on phase 05, with the rule "URLs only from `runs/source-claims.txt` / `drill-claims.txt`". Alternatively, set phase 06 `dependencies: [2, 5]` for T6.3 only.

## Finding 7: An optional item and two challenge PASS criteria have no backing run, and one contradicts a recorded row

- **Severity:** Medium
- **Location:** plan.md stage map, the "Nếu còn sức" order; Phase 07, "Per-stage content" (stage 4 and stage 8 PASS); Phase 04, `08-bloom.sh` regions
- **Flaw:**
  - "Bloom k-sweep" is the fifth optional item, but no region in `08-bloom.sh` covers it (only `probes` / check / `memory`), no matrix row exists, and `ref-model` is fixed at k 3. It is an optional experiment with no recorded expectation, so any numbers it puts in the guide fail V07, or come from nowhere.
  - The stage-4 challenge PASS says "act 1 allows 5, first Retry-After 2 s". With the matrix parameters (token 5/0.5), R16a records "row 10000 retry 750", and the http429 mapping `int(($3+999)/1000)` turns 750 ms into **1 s**. "Retry-After 2 s" matches R14 (the counter limiter, retry 2000), not the token bucket. The challenge parameters are not stated anywhere.
  - The stage-8 PASS "m 100000, k 3: fp in band" gives no band. For n = 10000 the theory gives p ≈ 1.74 %, so ≈ 174 with 3σ ≈ [135, 213], but nothing records or states this.
- **Failure scenario:** Đạt finishes the stage-4 challenge correctly, sees `Retry-After: 1`, and concludes he failed. Or D2 "fixes" the PASS text with a number that no run backs. The k-sweep either gets skipped silently or produces unrecorded numbers.
- **Evidence:** plan.md:46, :100 (R16a retry 750), :95 (R14 retry 2000); phase-03-containers-stages-1-4.md:82 (`int(($3+999)/1000)`); phase-04-stages-5-8.md:41; phase-02-tests-first.md:86 (Bloom k 3 only); phase-07-stage-fragments.md:43, :47.
- **Suggested fix:**
  - Either remove "Bloom k-sweep" from the order, or give it a region, an optional run row and ref-model values.
  - State the stage-4 challenge parameters explicitly and derive the PASS from the ref-model. With 5/0.5, the first Retry-After is 1 s.
  - Write the stage-8 band into the challenge as a formula the learner computes, labelled "lý thuyết", not as a recorded value.

## Finding 8: Analysis awk (`summary.awk`, `compare.awk`) is rendered into the guide as lab code, which puts harness logic in front of the learner

- **Severity:** Medium
- **Location:** Phase 02, T2.1 step 2 and T2.3 steps 2–3; Phase 06, T6.2 step 3
- **Flaw:**
  - `displayText` keeps `.awk` verbatim (T2.1).
  - The assembler resolves `.awk` for `<!--@CMD@-->` (T6.2).
  - `summary.awk` computes `toi_da_10s`, the maximum number of processing starts (ts + field 6) in any window (t−10000, t], plus per-act and total tallies.
  - `compare.awk` diffs four limiter streams.

  This is analysis tooling, not "plain client commands". The memory rule says scripting belongs in controller-only tooling, and learner data comes from readable `seq | awk | redis-cli` pipes. The replay itself is settled (kongming Q4). Showing the summariser's source in the guide is not settled, and nothing in §4 asks for it.
- **Failure scenario:** The stage-3 walkthrough shows a 20-line sliding-window awk next to the Lua limiters. The learner spends the stage-3 budget (40 min) decoding awk instead of the algorithms, the "heavy harness" impression he rejected in L06.
- **Evidence:** phase-02-tests-first.md:27, :62–63; phase-06-shell-assembler.md:33; phase-03-containers-stages-1-4.md:51 (`| awk -f /lab/summary.awk`); evidence-packet.md:28, :38; memory `lesson-checks-plain-commands` ("Put any scripting in controller-only verify/ tooling").
- **Suggested fix:**
  - Keep both awk files in `$L`, because the container mounts `/lab`, but rule in contract §4 that `.awk` is never a `@CMD` target.
  - In the guide, show only the replay line and its recorded `man`/`tong` output, and explain the output columns in `dl.gloss`.
  - Drop `.awk` from T6.2 step 3, and add a V17/V05 rule that rejects `@CMD *.awk`.

## Finding 9: The phase-01 smoke spends time re-verifying facts the evidence packet already settled or that a core run row records anyway

- **Severity:** Medium
- **Location:** Phase 01, T1.3 "Smoke S1–S13"
- **Flaw:** Several smoke items produce nothing new:
  - S2 (`#` line → `ERR unknown command '#'`) and S3 (`MSYS_NO_PATHCONV`) are listed as known gotchas in evidence §5.
  - S7 (`maxclients` 10000, `ulimit -n`) is verified in `config.c` in kongming Q3 and recorded again as core row R07.
  - S12 (`advance_be_lab|16.15`) is measured in evidence §5.
  - S13 (6390 refused) is recorded again as R16g.

  Only S1, S5, S6, S8, S10 and S11 decide something: the runner method, MULTI pacing, tracking (R30b) and the pgbench feed. Every recorded smoke line is also a pass condition. A Docker-level hiccup on a settled fact (for example, `ulimit -n` differing in a throwaway container) stops phase 01 in the Failure Protocol.
- **Failure scenario:** On a 0.75 h phase, about 40 % of the smoke is ceremony. Its outputs are never consumed: nothing reads S2, S3, S7, S12 or S13 later, and T1.3 Success names only S10 and S11 as decision inputs.
- **Evidence:** phase-01-contract-baseline-smoke.md:60, :62 ("S10 decides R30b; S11 decides the pgbench feed"); evidence-packet.md:208, :211, :221; kongming-investigation-counsel.md:69; plan.md:78 (R07), :106 (R16g).
- **Suggested fix:**
  - Cut T1.3 to the deciding probes: S1, S5, S6, S8, S9 (the scaffold error text H1 relies on), S10 and S11.
  - Cite evidence §5 for the rest.
  - Change T1.3 Verify to `≥ 7`.

## Finding 10: Two-client timelines exceed the counsel's "about 6" cap, and the plan never records the exception

- **Severity:** Medium
- **Location:** plan.md stage map and matrix; Phases 03 and 04 (A/B regions); kongming Q2.3
- **Flaw:** Kongming Q2.3 says to cap two-client timelines at "about 6". Its Q2 items are binding risks. The plan has **9** A/B timelines:
  - core: getset, watch, leaky.worker, tb-race.claim, share.pool, delay.claim;
  - optional for the learner: tb-race.naive, delay.naive, share.tracking.

  Every one is recorded `--rep 3`, and the controller must record and gate the optional ones too (T3.6 includes R16c, T4.5 includes R34b). Two more single-client timelines come on top: `03-live`, and `pg-burst` with three variants. Stage 4 alone holds three two-terminal experiments, plus `rtt`, `over-admit`, `http429`, `fail-open` and the replays, in 45 core minutes. No deviation entry or rationale exists. Question, not a cut request: the naive-vs-Lua token race is requested (§4.2), so should delay.naive and share.tracking count against the cap, and does the user accept 9?
- **Failure scenario:** The executor records 27 A/B reps (9 × 3) under the VM clock rule, each allowed up to 3 re-records. The stage-4 learner budget overruns, and stage 4 is "never optional". The plan has no pre-agreed answer, so it falls to an ad-hoc Failure Protocol call.
- **Evidence:** kongming-investigation-counsel.md:53; plan.md:86–87, :98, :101–102, :121–122, :126–128 (A/B rows), :38 (stage 4 = 45 min), :46 (stages 3–5 never optional); phase-03-containers-stages-1-4.md:132, :146, :148; phase-04-stages-5-8.md:86.
- **Suggested fix:**
  - Add a line to plan.md "Open questions" asking the user to accept 9 timelines (6 core + 3 optional) against kongming's cap of about 6.
  - Mark R16c, R34b and R30b as `optional` rows that are recorded with `--rep 1`.
  - Note in `deviations.md` that the cap was exceeded on purpose because of the §1.2 overlap rule.

---

## Unresolved questions

1. Does "about 6 timelines" (kongming Q2.3) cover optional variants? (F10)
2. Is the stage-4 challenge meant to use the replay parameters (5/0.5) or its own? If its own, which? (F7)
3. Is the "Bloom k-sweep" optional item still wanted, given that §4 asks only for measured FP vs the formula at one sizing? (F7)
