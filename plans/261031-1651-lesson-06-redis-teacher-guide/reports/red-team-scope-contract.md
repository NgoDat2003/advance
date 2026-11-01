# Red team — Scope & Complexity Critic + Contract Verifier

Plan: `plans/261031-1651-lesson-06-redis-teacher-guide/` (plan.md + phase-01..09). Reused tooling checked against `plans/261027-1328-lesson-07-data-modeling-teacher-guide/{assembly,verify}/`. I did not re-report the 8 "Materialization must-fix" items (plan.md:151-160).

Flag check against the lesson-07 tooling (read-only):
- `assemble.mjs`: only `--allow-stubs` (assemble.mjs:4,14). OK.
- `verify-guide.mjs`: `--selftest --runs --data --fragment --only --guide --labs --runs-dir` (verify-guide.mjs:3-9, 272-276). **No `--lint`.**
- `negative-tests.sh`: no arguments, and the guide path is hard-coded (negative-tests.sh:6). **No `--labs-only/--data-only/--guide-only`.**
- `widget-smoke.mjs`: no arguments, headless Chrome over CDP, guide path hard-coded (widget-smoke.mjs:1-2, 9-11). **No per-widget arg, no `vm`, no CRC check.**
- `rerun-gate`: lesson 07 has `.sh` only (rerun-gate.sh). The plan writes a new `.mjs`.
- Manifest/sha256: none in lesson 07 (grep for `manifest|sha256` over verify/assembly finds nothing).

---

## Finding 1: The plan reuses code V16 but changes what it checks. The lesson-07 quiz/EXAM number check is silently lost, and V16 is in both "full" mode and `--lint`
- **Severity:** High
- **Location:** phase-02 §Tasks 3; phase-07 §Tasks 2; plan.md Acceptance 4/7
- **Flaw:** Lesson-07 already defines V16: every number with 4+ digits or a decimal point in `QUIZ.why` / `EXAM.a` must appear in some run. It is part of the default `ALL` list. Phase 02 says the verifier "keeps lesson-07 V01–V15 semantics … and adds V16 `--lint` over `labs/`". So it reuses the code for a different check, and the quiz/interview number trace disappears. Phase 07 then runs `verify-guide.mjs (V01–V16)` *and* `--lint`. That means V16 runs in two modes with no settled meaning: the guide or the labs.
- **Failure scenario:** A delegate writes "GET 1,960,784 req/s" in a quiz `why` or interview answer, but the real run recorded 1,850,000. Under lesson-07 rules V16 would fail. Under this plan nothing does: V07 covers only `b.m`, V06 only `pre[data-run]`, and `--data` only the JSON. That breaks the evidence-packet rule "every number in the guide comes from a recorded run", and the guide ships with an invented number in the interview section. In the other direction, if the implementer keeps the old V16 and adds lint as V16 too, `--only V16` becomes ambiguous and negative cases j/k/l ("→ V16") might match the wrong check.
- **Evidence:** `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs:184-191` (old V16), `:271` (V16 in ALL); `phase-02-tests-first.md:36` and `:40`; `phase-07-assemble-verify-render.md:21`; `plan.md:119` (Acceptance 4 lists only `b.m`, `pre[data-run]`, `run-wN`); `evidence-packet.md:61`.
- **Suggested fix:** Keep V16 = quiz/EXAM number trace, unchanged from lesson 07. Give the lint its own prefix (e.g. `L01–L05`) under `--lint`. Update negatives j/k/l (phase-02:62-64 region), phase-03:90, and Acceptance 7 to use the new codes. Add the quiz/EXAM trace to Acceptance 4.

## Finding 2: Under the "keep V07 semantics" rule, every small Redis number fails, because V07's small-number rule only accepts psql table cells
- **Severity:** High
- **Location:** phase-02 §Tasks 3 ("keeps lesson-07 V01–V15 semantics")
- **Flaw:** Lesson-07 V07 has a special case: a 1–2 digit `b.m` value must be a psql result cell, matched as `(^|\|)\s*N\s*(\||$)`. redis-cli `--no-raw` prints `(integer) 0`, `(integer) 1`, `1) "..."`, and `keys=10,expires=…`. None of these match. The plan only asks for path, slide-count, prefix and size changes.
- **Failure scenario:** Stage 7 `table.stats` has `<b class="m" data-run="07-architecture.partition">0</b>` for `WAIT 1 500`. Stage 8 has `2` holders. Stage 9 has `10` allowed and `20` denied. Each one fails V07 with "số nhỏ … không phải ô kết quả", and phase 06's `--fragment` gate is RED for correct numbers. Delegates then either drop the measured small numbers (which defeats the measured-stats-table format) or reword them as prose to dodge V07. The phase-02 selftest uses the lesson-07 `.sql` fixture, so it would not catch this either.
- **Evidence:** `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs:79-80`, `:254-257` (selftest fixture is psql/`data-sql`); `phase-02-tests-first.md:36`; `plan.md:97`, `:103`, `:107` (small-integer expectations).
- **Suggested fix:** Phase 02 should state the redis-cli cell rule: a small integer must match `\(integer\) N$`, `^\d+\) "?N"?$`, or a `key:N` / `key=N` token. Add a selftest case with `(integer) 0` (pass) and `(integer) 7` vs claimed `9` (fail).

## Finding 3: `expected.tsv` cannot hold the matrix as written. Rows with two run ids and per-slide mixed chips break `--runs` and V04
- **Severity:** High
- **Location:** plan.md Expected-result matrix; phase-02 §Tasks 4; phase-02 test "missing run × 48"
- **Flaw:** The lesson-07 `--runs` mode reads exactly one run id from the `run` column. The V04 chip cross-check only uses rows where `slides` is a single integer (`/^\d+$/`) and `chip` is a single code. The matrix breaks both rules:
  - R30, R31, R44, R47 and R48 each name two runs (`a / .b`).
  - R01, R09, R10 and R16 carry compound chips ("13 OK, 14 PART", "20 PART, 21 FIX").
  - R27–R30 and R40–R43 put "(in R09)" / "(in R39)" in the chip column.
  - Design chips for slides 4, 5, 42 and 43 have no row at all.
- **Failure scenario:** `runText("05-counter.getset.timeline / .incr.timeline")` → missing, so R30 is permanently RED and phase 03's "`--runs` GREEN" gate cannot close without a deviation entry. V04 skips R16, so slide 21's FIX chip (the headline "expiry no longer uses a ZSET" correction) and the chips for slides 13/14/16/20/23/33/34/35 are never checked against `expected.tsv`. Acceptance 2 ("chips equal `expected.tsv`") passes vacuously. Negative case e only mutates slide 40, the one easy single-slide row, so it would not reveal the gap.
- **Evidence:** `plan.md:63`, `:71`, `:72`, `:78`, `:89-93`, `:106`, `:109-110`, `:112`, `:117`; `phase-02-tests-first.md:43`, `:58`, `:74`; `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs:147`, `:219-222`.
- **Suggested fix:** Phase 02 normalisation rule: one TSV row per (run, slide) pair. Split R30/R31/R44/R47/R48 into `a`/`b` rows, and expand compound chips into one row per slide. The "(in Rxx)" rows get chip `–` with the parent row carrying the chip. Add explicit `design` rows (`run` = `-`) for slides 4/5/42/43 that V04 reads but `--runs` skips. Fix the "× 48" count to the real row count.

## Finding 4: The sha256 manifest is append-only, but phases 03 and 08 overwrite runs. M01 fails after any re-run
- **Severity:** High
- **Location:** phase-02 §Tasks 2 (header/manifest), §Tasks 3 (M01); phase-03 §Tasks 4.3; phase-08 §Tasks 2
- **Flaw:** The runner "appends `sha256<TAB>file` to `runs/manifest.tsv`". M01 checks "every run's sha256 equals `manifest.tsv`", but the plan never says which line wins when a file has several. Several steps write the same run file more than once:
  - phase 03 runs each `--ab` pair 3×;
  - `record-all.sh` runs `00-seed`/`check` twice;
  - phase 08 re-runs regions after fixes ("updates the manifest", which is a different verb from "appends").

  Lesson 07 had no manifest. This is a new gate (scope added beyond the reference), and its update semantics are not specified.
- **Failure scenario:** Phase 03 records A/B run 1, then runs 2–3 "to compare" with the default `--out`. The file now holds run 3, and the manifest has three lines for it. If M01 reads the first line, it reports a hand-edit that never happened. If it reads the last, it silently accepts that run 3 replaced the recorded run 1. Either way, negative h ("run edited by hand → M01") proves nothing about the real case. The same happens after every phase-08 fix.
- **Evidence:** `phase-02-tests-first.md:35`, `:41`; `phase-03-containers-experiments-runs.md:77-79`; `phase-08-ultra-review-fixes.md:28`; `verify/ultra-plan/verdict.md:38`, `:65` (other candidates had no manifest); no `manifest`/`sha256` in `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/*.mjs|*.sh` or `assembly/*.mjs`.
- **Suggested fix:** Pick one rule and write it into contract §3. Either the manifest is a map that the runner rewrites (one line per file, replace on write), or runs 2–3 must use `--out <id>.rep2/.rep3` and the replicate files are excluded from the guide. If neither is wanted, drop M01 and negative h and rely on "only the runner writes runs" plus V06/V07. That is what lesson 07 did, and it adds no learner value.

## Finding 5: The negative-tests and widget-smoke invocations rely on flags and behaviour the reused scripts do not have, and phase 06 uses widget-smoke before phase 07 creates it
- **Severity:** Medium
- **Location:** phase-03 test matrix; phase-04 test matrix; phase-05 test matrix; phase-06 test matrix; phase-07 §Files/§Tasks 4
- **Flaw:**
  - Three phases call `negative-tests.sh --labs-only`, `--data-only` and `--guide-only`. The lesson-07 script takes no arguments and hard-codes the guide path, so phase 02's "adapted" brief must add a mode switch it never mentions.
  - Phase 06 gates on `node verify/widget-smoke.mjs w6` ("all recorded pairs ✔", a CRC16 check). Phase 07 is where `widget-smoke.mjs` gets "copied and adapted".
  - Phase 07 describes widget-smoke as running each widget "in `vm`". The lesson-07 file is a headless-Chrome CDP driver with no per-widget argument and no data assertions.
- **Failure scenario:** The D3 delegate in phase 06 cannot run its own gate because the file does not exist. Or the controller copies the lesson-07 script, which ignores `w6`, opens the lesson-07 guide (path hard-coded) and reports GREEN on the wrong page. W6 is the only gate that proves the CRC16-XMODEM calculator matches `CLUSTER KEYSLOT`, and it is effectively never run.
- **Evidence:** `phase-03-containers-experiments-runs.md:91`; `phase-04-widget-data-homework-driver.md:57`; `phase-05-guide-shell-assembler.md:49`; `phase-06-stage-fragments.md:54`; `phase-07-assemble-verify-render.md:17`, `:23`; `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/negative-tests.sh:6`, `:19-31`; `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/widget-smoke.mjs:1-2`, `:9-11`.
- **Suggested fix:** Move `widget-smoke.mjs` into phase 02's file list. Give it one stated behaviour: either keep the Chrome smoke, or add a separate small `verify/crc16-check.mjs` that requires W6's pure function and compares it with `runs/07-cluster.keyslot.txt`. Add the `--labs-only|--data-only|--guide-only` switch to the phase-02 adaptation bullet for `negative-tests.sh`, with the case letters in each group.

## Finding 6: `--fragment` cannot check quiz shape or "why cites a run id", although phase 06 says it does
- **Severity:** Medium
- **Location:** phase-06 §Fragment format (Quiz) and test matrix row "quiz shape … included in `--fragment`"
- **Flaw:** Quizzes live in separate `stage-0N.quiz.json` files that the assembler merges. Lesson-07 `--fragment <html>` only reads the HTML file and runs V05/V06/V07/V09/V12. V11 (4 items, `ans` 0–3) runs only in guide mode, through `GUIDE_DATA`. No code anywhere checks that a `why` "cites a run id".
- **Failure scenario:** A delegate returns DONE with a 3-question quiz whose `why` fields cite no run. The controller re-runs `--fragment` (phase-06 Verification) and gets GREEN. The defect only surfaces at phase 07, after the delegates have finished, which defeats the parallel-delegate gate. The "why cites a run id" rule is never enforced.
- **Evidence:** `phase-06-stage-fragments.md:34`, `:52`, `:57`; `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs:7`, `:176-182`, `:275`; `plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/assemble.mjs:41-42`.
- **Suggested fix:** In phase 02, extend `--fragment` so it also loads the sibling `stage-0N.quiz.json` and applies V11 shape plus `/\b\d{2}-[a-z-]+\.[a-z0-9-]+/` (a run-id pattern) to each `why`. Add a negative case for it.

## Finding 7: The learner-facing `check.sh` depends on a controller-only fingerprint of unrelated containers. During study it goes RED as soon as Đạt touches any other container
- **Severity:** High
- **Location:** phase-02 §Tasks 5 (C14); phase-01 §Tasks 1; phase-05 §Tasks 2 (learner prep runs `check.sh`)
- **Flaw:** `labs/lesson-06-redis/check.sh` is learner-facing: the guide's prep step tells Đạt to run it, and its exit code is the number of ✘. C14 compares a live fingerprint of every non-`advance-be-redis` container (plus 6380) with `plans/…/runs/00-fingerprint-before.txt`. So the labs folder reads from the controller's plan folder, and a safety assertion that belongs to the build becomes part of the learner's health check. Must-fix 7 covers Docker restarts. It does not cover the learner legitimately starting or stopping his own containers.
- **Failure scenario:** On 2026-11-02 Đạt finishes Phase B and starts `quan-ly-hop-dong` for Boss Challenge 2, or starts the OmniPOS hub Redis on 6380 (the guide's own `#tiep-theo`). Then he runs `check.sh` as the guide instructs. C14 shows ✘ and exits 1, and the guide tells him the lab is broken when nothing in it is. The phase-08 and phase-09 gates (`check.sh` all ✔) also fail whenever the controller's environment drifts for unrelated reasons. This conflicts with the CLAUDE.md lean-learner rule and with evidence-packet §2 ("small self-contained command snippet").
- **Evidence:** `phase-02-tests-first.md:26`, `:51-52`; `phase-01-contract-baseline-smoke.md:22`; `phase-05-guide-shell-assembler.md:29`; `phase-08-ultra-review-fixes.md:36`; `phase-09-docs-final-gate-handoff.md:31`; `evidence-packet.md:20`; `D:/study/advance-be/CLAUDE.md` (Anti Over-Engineering rule).
- **Suggested fix:** Remove C14 from `check.sh`. Keep the fingerprint comparison only in the controller's gates (`verify/fingerprint.sh | diff`, phase 03 matrix, phase 09 final gate). `check.sh` then checks only lab state (C01–C13) and never reads `plans/`.

## Finding 8: Homework H5 relies on an unspecified hook (`HW_TTL_MS`, "slow holder") in a contract that says "any language works"
- **Severity:** Medium
- **Location:** phase-04 §Tasks 2 (Homework contract, H5); phase-04 test matrix (bad fixture)
- **Flaw:** The homework contract lists keys, the log format and `HW_CMD`. H5 also needs the learner's program to read `HW_TTL_MS` as its lock TTL, and to expose a way for `hw-check.sh` to make one holder "slow" past the TTL. Neither is in the contract. The plan also gives two different expected results for the bad fixture: "✘ on H1, H2" in plan.md R47, and "✘ H1, H2 (H5 ✘)" in phase 04.
- **Failure scenario:** Đạt writes a NestJS/TS solution with a hard-coded `PX 5000` and immediate work. Round 11 then never expires a lock, so the second holder never acquires one, and H5 cannot tell `DEL` from compare-and-delete. It either passes vacuously (a `DEL` solution gets ✔ H5) or fails with no actionable message. That defeats the capstone point of slides 40 and 43.
- **Evidence:** `phase-04-widget-data-homework-driver.md:31`, `:37`, `:59`; `plan.md:109`.
- **Suggested fix:** Add the two inputs to the homework contract: `HW_TTL_MS` (lock TTL, default e.g. 2000) and `HW_WORK_MS` (simulated work), both env vars read by the solution. `hw-check.sh` round 11 sets `HW_TTL_MS=50 HW_WORK_MS=200`. Make R47 and the phase-04 row the same: "bad fixture ✘ H1, H2, H5".

## Finding 9: Run-id and section-id drift between the matrix, the lab-region design and the reused V03
- **Severity:** Medium
- **Location:** plan.md R01; phase-03 §Tasks 2 (`01-why-fast#threads` / `01-bench.sh#threads`); phase-01 §3 run-id rule; phase-05 §Tasks 3 (`#driver-drill`); plan.md phase table (phase 05 gate)
- **Flaw:**
  - **R01:** its run is `01-why-fast.threads`, but its regex asserts the `/proc/1/task` count n > 1. Phase 03 puts that command in `01-bench.sh#threads`, whose run id under contract §3 (`<stem>.<region>`) is `01-bench.threads`. One TSV row cannot match output split across two files.
  - **V03:** lesson-07 V03 hard-codes the section id `prisma-drill`. The plan renames it to `#driver-drill`, and phase 02's adaptation list (paths, slides, prefix, size) does not mention it.
  - **Phase 05 gate:** plan.md lists V01–V04, V09, V10, V14. Phase 05 runs V01–V04, V09, V10, V14, V15.
- **Failure scenario:** R01 is RED for a correct measurement, which forces a fake "deviation" entry. That is exactly the abuse D01 is meant to stop. A full verify of the finished guide reports `V03 thiếu section #prisma-drill` and blocks phase 07 until someone finds the hard-coded list.
- **Evidence:** `plan.md:51`, `:63`; `phase-03-containers-experiments-runs.md:61`; `phase-01-contract-baseline-smoke.md:35`; `phase-05-guide-shell-assembler.md:36`, `:49`; `phase-02-tests-first.md:36`; `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs:133`.
- **Suggested fix:** Split R01 into R01a (`01-why-fast.threads`, `io_threads_active:0`, `epoll`) and R01b (`01-bench.threads`, count > 1), or move the `/proc` line into the `.redis`-adjacent `.sh` region under one id. Add "V03 section list: `prisma-drill` → `driver-drill`" to phase 02 §3. Make the plan.md phase-05 gate match phase 05's `--only` list.

## Finding 10: Two timing mechanisms, two runners, a display-rule module and a new rerun gate on top of lesson 07's tooling. The plan adds controller code that the learner sees nowhere, while the learner-facing lab files grow non-lean checkers
- **Severity:** Medium
- **Location:** phase-02 §Files and §Tasks 1, 2, 7; phase-01 §2 (`kiem-chung`); phase-03 §Container lifecycle (`00-containers.sh`)
- **Flaw:** On the controller side:
  - `run-redis.mjs --timed` injects `TIME` before every command (phase 02).
  - Must-fix 2 adds host-ms `ECHO "@@<step> <host-ms>"` markers for the same timelines. Two timestamp systems feed `merge-timeline.mjs`, and the plan never retires `--timed`.

  On the learner side:
  - Every stage `.redis` file ends with a `kiem-chung` Lua `EVAL` checker.
  - `00-containers.sh` does `docker inspect .Config.Cmd` diffing, name and port guards, `pwd -W` path conversion and `reset`. These are build-harness concerns placed in the files Đạt is told to read and paste.

  As a question, not a cut: is a Lua-written self-check at the end of every stage file part of the requested "like previous lessons" format? Lesson 07's checks were plain SQL `check.sql`, not a script-language checker inside each lab.
- **Failure scenario:** Đạt opens `03-expiry.redis`, pastes the whole block as contract §5 instructs, and the final region is a dense Lua `EVAL` with `redis.call` loops returning `PASS C3 …`. That is the "cumbersome framework that scares the learner" which CLAUDE.md forbids. On the build side, a merge script that receives both `[HH:MM:SS.mmm]` TIME lines and `@@k <host-ms>` markers will order A/B events by whichever clock it happens to parse. R02's "B host-send ≈ A start + 0.5 s" can then pass or fail depending on parser order.
- **Evidence:** `phase-02-tests-first.md:17-25`, `:32` (`--timed` TIME per command); `plan.md:154` (host-ms ECHO markers); `phase-01-contract-baseline-smoke.md:34` (`kiem-chung` Lua in every stage file); `phase-03-containers-experiments-runs.md:42-46`, `:75`; `phase-05-guide-shell-assembler.md:29`; `evidence-packet.md:20`; `D:/study/advance-be/CLAUDE.md` (Anti Over-Engineering).
- **Suggested fix:** Pick one timeline clock: host-ms markers per must-fix 2, with server `TIME` only where an assertion needs server time (R02 PONG). Delete the general `--timed`. Keep guard and recreate logic in a controller-only `verify/containers.sh`, and give the learner a short `00-containers.sh` of plain `docker run` lines with Vietnamese comments. Move the per-stage `kiem-chung` Lua into `check.sh` (already the learner's one self-check), or confirm with Đạt that an in-file Lua checker is wanted.

---

Status: DONE_WITH_CONCERNS
Summary: The plan's reuse claims do not hold: V16 is reused for a different check, V07's psql small-number rule, the single-run TSV schema, and the negative-tests/widget-smoke flags all break against the real lesson-07 code. It also adds an append-only manifest and learner-facing checkers (C14 fingerprint, per-stage Lua) that the reference never had.
