# Red team: Assumption Destroyer + Scope Auditor

Plan: `plans/261102-1332-k2-lesson-04-caching-teacher-guide/` (plan.md, phase-01 … phase-10). Reviewed 2026-11-03 against L06 tooling (`plans/261031-1651-lesson-06-redis-teacher-guide/verify/*`, `assembly/assemble.mjs`), L06 labs, the render-check skill script, the handoffs, and read-only probes (Git Bash `ulimit -n`, `git status`, `docker ps`). No files were modified apart from this report, and no state-changing Docker, Redis or Postgres command was run.

What held up under checking, so it is not reported below: the replay literals R13, R14, R14b, R15 and R16a. I re-derived them by hand from the T2.4 semantics and the T2.3 trace, and they match. The Bloom literal `fp=953/10000` with 22587 bits set and 10000/10000 members reproduces exactly with node `sha1` 8-hex slices mod 50000. `CLUSTER ADDSLOTSRANGE` exists in 7.x, and L06 already uses it at `labs/lesson-06-redis/00-containers.sh:133`. The delay scores are Unix seconds, which matches L06 `lua/delay-claim.lua:5`. The non-ASCII folder names are NFC on disk, `assets/04_Caching` exists (23 files), and render-check uses `pathToFileURL` (`render-check.mjs:297`).

---

## Finding 1: The `runs/` manifest gate (M01) cannot pass, because the plan writes non-runner files into `runs/` and never registers them, and T8.2 breaks itself
- **Severity:** Critical
- **Location:** Phase 08, task "T8.2 Full verifier"; also Phase 04 "T4.6 All gates", Phase 01 "T1.2/T1.3", Phase 05 "T5.3", Phase 10 "T10.2"
- **Flaw:** The L06 verifier's `--runs` mode fails M01 for every `runs/*.txt` file that has no manifest line, and for every manifest line whose sha256 no longer matches the file. The plan writes these files into `runs/` by shell redirect or by hand: `00-fingerprint-before.txt` (T1.2), `run-method-smoke.txt` (T1.3), `drill-claims.txt` and `source-claims.txt` (T5.3), `verify-full.txt` (T8.2), `final-gate.txt` and `00-fingerprint-after.txt` (T10.2). The only manifest writer is `run-lab.mjs`, and no task runs `--register` (grep for `register` across the plan returns nothing). T8.2 is worse. Its loop redirects into `$P/runs/verify-full.txt` while `--runs` is executing, so `--runs` sees a half-written file. If the file is unregistered, M01 fails on the missing line. If it was registered earlier, M01 fails on the sha mismatch. Either way the line `FAIL` gets written and `grep -c FAIL` cannot return `0`.
- **Failure scenario:** T4.6 "full `--runs` rc=0" fails on `00-fingerprint-before.txt` and `run-method-smoke.txt`, and phase 04 stops under the Failure Protocol. T8.2 can never succeed as written. T9.2 ("phase 08 Verify commands pass again") and T10.2 inherit the failure. Acceptance criteria 5 and 13 are unreachable.
- **Evidence:** `plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs:376-387` (M01: an unregistered file fails, and a sha mismatch fails); `…/verify/run-redis.mjs:197-206,277` (`registerRun` / `--register` is the only writer); `phase-08-assemble-verify-render.md:32` (redirect into `runs/` during `--runs`); `phase-01-contract-baseline-smoke.md:19-20`; `phase-05-widget-data-homework-claims.md:16`; `phase-10-docs-final-gate-handoff.md:19`. L06 did register these files (`plans/261031-1651-lesson-06-redis-teacher-guide/runs/manifest.tsv:1,2,97,98,103,104`), but the plan does not carry that step over.
- **Suggested fix:** Add `node $P/verify/run-lab.mjs --register <file>` right after each non-runner write in T1.2, T1.3, T5.3 and T10.2. Change T8.2 to write to `$P/verify/tmp/verify-full.txt`, then copy and register it after the loop. Or exclude `verify-full.txt` and `final-gate.txt` from M01 in the adapted verifier, and add a selftest fixture for that exclusion.

## Finding 2: Run-id bookkeeping is off by one, and the T3.1b `--out` diff can never be empty
- **Severity:** High
- **Location:** Phase 02 "T2.9 Red-first run"; Phase 03 "T3.1b `record-all.sh`" and "T3.6 Stage 4"; plan.md "Expected-result matrix"
- **Flaw:**
  1. Must-fix 9 added row R16h, but the counts were not updated. The matrix now has **59** run rows (58 if S10 = no), not 58/57. I counted rows with a run id in plan.md:73-138: K01 … H03 including R16h and R30b gives 59, plus 7 design rows.
  2. T3.1b diffs the `--out` values in `record-all.sh` against the run column of `expected.tsv`. The L06 runner writes A/B runs as `${out}.A/.B/.timeline.txt`, so the expected run id `02-race.watch.timeline` matches the file name only when `--out 02-race.watch`. In that case the diff prints `02-race.watch` vs `02-race.watch.timeline`. Using `--out 02-race.watch.timeline` instead writes `02-race.watch.timeline.timeline.txt`, and `--runs` then reports a missing run.
  3. T3.1b also requires every run id in `expected.tsv` to appear in the script. That includes `hw-check.solution|bad|scaffold`, but the specified `case` block has no hw group, and those runs are recorded in phase 05.
  4. T3.6's `--only-rows` list leaves out R16h, so the must-fix 9 row is not gated until T4.6.
- **Failure scenario:** T2.9 prints 59 `missing run` lines (or 58 when S10 = no). The expected value is 58/57, so phase 02 stops. T3.1b's `diff` exits 1 no matter how the script is written, so phase 03 stops before any stage is recorded. That is two forced kongming cycles on bookkeeping alone.
- **Evidence:** `plan.md:53,140`; `phase-02-tests-first.md:172,178`; `phase-03-containers-stages-1-4.md:82` (R16h added), `:106-109` (case list and diff), `:148`; `plans/261031-1651-lesson-06-redis-teacher-guide/verify/run-redis.mjs:281,286-287` (`${base}.${part}.txt`); L06 `expected.tsv` run ids end in `.timeline` (for example row R44b, `09-bucket-lua.claim.timeline`).
- **Suggested fix:** Change the counts to 59/58 everywhere (plan.md:53,140; phase-02:172,178). In T3.1b, compare against run ids with `.timeline` stripped for `--ab` rows, add an `hw` group (or exclude `hw-check.*` from the diff and gate those ids in T5.2), and add R16h to the T3.6 `--only-rows` list.

## Finding 3: R16b's frozen literal "retry 1000000" cannot be produced by the plan's own token-bucket formula, and the rerun gate will flag every rep that differs in timing
- **Severity:** High
- **Location:** plan.md matrix rows R16b and R29; Phase 02 "T2.4" and "T2.8 step 2 (rerun-gate masks)"; Phase 03 "T3.6", "T3.7"; Phase 04 "T4.4", "T4.6"
- **Flaw:**
  1. R16b runs `rl-token-bucket.lua` in `TIME` form with cap 1 and rate 0.001/s, and B sleeps 0.2 s before calling. By T2.4, B sees `tokens = (tB−tA)·0.001/1000 ≈ 2.5e-4`, so `retry = ceil((1−tokens)·1000/0.001) ≈ 999 750`. The value is exactly `1000000` only when `tB−tA ≤ 0`, which happens only when the VM clock steps backwards and the clamp resets elapsed time to 0. The row therefore passes only on the clock fault the plan is trying to avoid.
  2. The rerun gate compares reps 2..N of every A/B timeline against run 1 line by line, and masks numbers only on INFO/MEMORY/benchmark/pgbench/`time`/`cho=` lines. These replies vary between reps and none of them is masked: the B-side `retry` above (it changes with B's delay), the number of `poll $i:` lines in `07-share.pool` (R29 only asserts "≥ 3"), and any `TIME` value taken through `--eval`.
- **Failure scenario:** T3.6 fails on R16b in the normal case. If the executor "fixes" this with a deviation, the chip story for slide 16 now rests on a literal that was false. T3.7 step 2 and T4.6 step 3 (the rerun gate) fail on `04-tb-race.claim` and `07-share.pool` reps even when Redis behaves correctly.
- **Evidence:** `plan.md:101` (R16b), `:122` (R29); `phase-02-tests-first.md:183` (token-bucket semantics), `:257-261` (mask list); `phase-03-containers-stages-1-4.md:78` (`, 1 0.001`, B sleeps 0.2); `plans/261031-1651-lesson-06-redis-teacher-guide/verify/rerun-gate.mjs:18,25,66-75` (rep compare masks only MEASURED commands). L06 avoided this: its equivalent row asserts only `fa+fb==1` (`…/verify/expected.tsv` R44b).
- **Suggested fix:** Write R16b as `B 0, retry (?<r>\d+) ⇒ r>=999000; r<=1000000`. Teach the rerun gate to mask the third reply field of `rl-token-bucket.lua` calls in `TIME` form, and to collapse runs of `poll N:` lines in `07-share.pool` reps (or put `07-share` and `04-tb-race` on the rerun-gate skip list next to `03-live`).

## Finding 4: Key lifetimes are undefined. Regions do not reset their own keys, the seed was narrowed, and the learner inherits the controller's run keys
- **Severity:** High
- **Location:** Phase 03 "Regions" (`03-window.redis`, `02-lua.sh#voucher`), "T3.2 Seed", "T3.7 Gates 1–4"; Phase 02 "T2.7 C09"; Phase 05 "T5.2 step 3"; Phase 10 "T10.3 Learner-ready state"; Phase 01 "T1.4 §1"
- **Flaw:** Only `03-replay.sh` is specified to start with a scan + UNLINK. The other stateful regions have no reset line:
  - `incr-expire-bug` deliberately leaves a `k2l04:rl:*` key with TTL −1.
  - `set-nx-incr` leaves `k2l04:rl:ok:s7` alive for 10 s.
  - `voucher` consumes the seed's stock.

  The rerun gate runs every region **twice back to back in one session**. So these regions return different replies on the second pass (`INCR` 2 instead of 1; `SET NX` `(nil)` instead of `OK`; voucher `0` instead of `1`). C09 ("no `k2l04:rl:*` with TTL −1") fails on the leftover bug key.

  Must-fix 6 limits the seed to 3 keys. T10.3 forbids `99-cleanup.sh`. Main runs only `--appendonly no`, so the default RDB save rules apply, and `00-containers.sh` runs `SAVE` before any recreate. Together this means every phase 03–05 key survives to study day: 100 000 `k2l04:unread:u:*`, a 100 000-member ZSET, HLLs up to 1e6, 1.25 MB bitmaps, the Bloom filter, counter hashes and `hw` keys. Separately, contract §1 says `my`/`hw` keys are "never deleted", while `hw-check.sh` "resets `k2l04:hw:*`" on every run.
- **Failure scenario:**
  - T3.7 steps 2–3 fail on the rerun gate and C09 immediately after stage 3.
  - If they are patched, T10.3's `check.sh rc=0` is still at risk.
  - On study day, the `DBSIZE` and `used_memory` baselines in the stage 1 `table.expect` differ from what Đạt sees on the polluted main.
  - DBX on 6381 opens to roughly 200k controller keys.
  - Đạt's own run of `incr-expire-bug` turns his `check.sh` red with no explanation.
- **Evidence:** `phase-03-containers-stages-1-4.md:24` (main has no `--save ""`), `:28` (SAVE before recreate), `:45,47-49`, `:113` (seed scope), `:153-159` (gates34 has no re-seed or cleanup); `phase-02-tests-first.md:244` (C09); `phase-01-contract-baseline-smoke.md:71` (`my`/`hw` never deleted) vs `phase-05-widget-data-homework-claims.md:46` (reset `k2l04:hw:*`); `phase-10-docs-final-gate-handoff.md:42-44`; `plans/261031-1651-lesson-06-redis-teacher-guide/verify/rerun-gate.mjs:28-35` (twice in one session); L06's gates re-seeded before `check` (`…/verify/record-all.sh:87`).
- **Suggested fix:** Add a contract rule that every stateful region starts with an UNLINK of its own key family, and that `incr-expire-bug` ends with `UNLINK` (after the TTL −1 has been shown). Add a T10.3 step that UNLINKs the run-scoped families (`bench`, `keys`, `rl`, `cnt`, `mem`, `unread`, `share`, `delay`, `hll`, `bm`, `bloom`, `barrier`, `voucher`) and keeps `seed`/`my`/`hw`. Re-seed before `check.sh` in gates34 and gates. Reword contract §1 to "`my` never deleted; `hw:*` reset by `hw-check.sh` only".

## Finding 5: The fingerprint's compare semantics contradict L06's live lifecycle and Docker restarts
- **Severity:** High
- **Location:** Phase 01 "T1.1 Fingerprint script" (steps 1–3); Phase 04 "T4.1"; gates at phases 03, 04 and 10
- **Flaw:**
  1. L06's fingerprint excluded `advance-be-redis*`. The K2L04 version excludes only `advance-be-k2l04-*`, so L06 main **and L06 extras** become anonymous `sha256(id|image)|status` lines. Any of those lines disappearing is fatal ("a missing baseline line"). Đạt is in the middle of L06 (stage 2 of 9), and L06 stages 3/4/7 create and `docker rm -f` `advance-be-redis-{evict,rdb,aof,replica,cluster}`. L06 also recreates main on drift (`rm -v` then `run`, which gives a new ID).
  2. "An L06 flip is info only" cannot be implemented, because the lines contain no names by design.
  3. `l06_main_bind` change is fatal, but `docker port` on a stopped container prints nothing. The plan also says L06 "may be up or down", and L06 main has no `--restart` policy.
  4. T4.1 does a raw `diff` on `grep '^pg_'` lines. That includes `pg_other_writes`, which must-fix 4 made advisory.
- **Failure scenario:** The baseline is taken in phase 01. Đạt then runs L06 `up evict` / `99-cleanup.sh`, or Docker Desktop restarts and L06 main comes back Exited. `fingerprint --compare` at T3.7, T4.6 or T10.2 then exits 1 even though K2L04 touched nothing, and each occurrence forces a kongming stop. Docker Desktop was **not running** at review time: `docker ps` returned `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`. Restarts are a normal event on this PC.
- **Evidence:** `phase-01-contract-baseline-smoke.md:29,33,37`; `phase-04-stages-5-8.md:237-241`; `plans/261031-1651-lesson-06-redis-teacher-guide/verify/fingerprint.sh:17-24` (hash lines have no names; L06 excluded its own prefix at :20), `:42` (`docker port`); `labs/lesson-06-redis/00-containers.sh:39-42,97-102` (extras; recreate; no `--restart`), `:143,158`; `labs/lesson-06-redis/99-cleanup.sh:27-32`; `plans/handoffs/cluster1-m1-done-lesson06-redis-stage2-20261102-1120.md:23-24` (L06 stages 3–9 still ahead); `evidence-packet.md:293` (L06 up or down).
- **Suggested fix:** Exclude `advance-be-redis*` from the hash lines, as L06 does, and track L06 only through `l06_volume`, `l06_network` and `l06_k2l04_keys`. Make `l06_main` / `l06_main_bind` info-only when the status is not `Up`. In T4.1, diff only the `pg_schemas` line.

## Finding 6: Unstated environment preconditions: Docker Desktop running, and the foreign PG container Up
- **Severity:** Medium
- **Location:** Phase 01 "T1.1–T1.3" (S11, S12, `pg_schemas`); Phase 02 "T2.7 C10"; Phase 04 "T4.1–T4.6"; Phase 10 "T10.3"
- **Flaw:** Every phase assumes Docker Desktop is up and `quan-ly-hop-dong-postgres-1` is running. The evidence treats that container as foreign, so the executor may not start it. No task checks this or says what to do when it is down. T1.2's Success literal `pg_schemas=lab03_indexing,…,public` needs a live `psql` exec. T10.3 also assumes the learner-ready state (main seeded and running) survives until study day, but main has no restart policy specified.
- **Failure scenario:** The executor starts phase 01 while Docker is down, as it is right now, or while the company container is stopped. T1.1/T1.2 fail, and kongming is asked to judge an environment problem, with a temptation to `docker start` a foreign container. If the PC reboots after phase 10, Đạt finds `advance-be-k2l04-redis` Exited and `check.sh` C01 ✘, which contradicts the handoff.
- **Evidence:** `phase-01-contract-baseline-smoke.md:36-37,49,60`; `phase-04-stages-5-8.md:217,237`; `phase-10-docs-final-gate-handoff.md:47`; `evidence-packet.md:174-175` (the PG container is foreign); review-time `docker ps` failure (Finding 5).
- **Suggested fix:** Add T1.0 "Preconditions": `docker version` rc 0, and `docker ps --filter name=^quan-ly-hop-dong-postgres-1$ --format '{{.Status}}'` starts with `Up`. Otherwise STOP and ask the user, and never start the container. Put "first command: `bash labs/k2-lesson-04-caching/00-containers.sh up main`" at the top of `#cach-hoc` and the handoff, so a learner-ready state that decays after a reboot is expected rather than broken.

## Finding 7: "Copy and adapt" misses L06 literals that are hard-coded outside the listed deltas
- **Severity:** Medium
- **Location:** Phase 02 "T2.2 `run-lab.mjs`", "T2.6 `verify-guide.mjs`", "T2.8 rerun-gate / widget-smoke"
- **Flaw:** The delta lists change GUARD, paths, slide count, stages and the prefix. They do not mention these hard-coded literals:
  - **`run-redis.mjs`:**
    - `MAIN='advance-be-redis'` (:29) is the default container.
    - The `.sh` container detection regex `→\s*(advance-be-redis[a-z-]*)` (:87) does not match `echo "→ advance-be-k2l04-crash"`. The crash run therefore silently falls back to MAIN, so its header, clock line and Lua hashes come from the wrong container.
    - The transcript prompt `127.0.0.1:6379>` (:188) will print in a guide whose whole point is "use 6381, not L06's 6379".
  - **`verify-guide.mjs`:**
    - Lint returns early for any extension other than `.redis`/`.sh` (:493), so the `.sql`/`.pgbench` rules are new code, not deltas.
    - The destructive-region echo rule `advance-be-redis-[a-z]+` (:506) rejects `k2l04-crash`, because the name contains digits.
    - V16 `RUN_REF` lists `driver-claims` but not `drill-claims` (:125).
  - **`widget-smoke.mjs`:**
    - It skips silently when the slot run or the widget is missing (:66, :92).
    - It hard-codes `runs/07-cluster.keyslot.txt` and the `w6-*` ids (:31, :83).
- **Failure scenario:** R21b/R21 headers name the wrong container while V07/V18 still pass. The V17 lint rejects the crash region, or is loosened ad hoc. Widget smoke passes T8.4 with W1 never actually tested.
- **Evidence:** file:line references inline above (`plans/261031-1651-lesson-06-redis-teacher-guide/verify/…`); plan deltas at `phase-02-tests-first.md:141-149,210-227,262-266`.
- **Suggested fix:** Add the listed literals to the T2.2/T2.6/T2.8 delta lists. Add a T2.6 check: `grep -nE "advance-be-redis|lesson-06|l06:|6379>|driver-claims|07-cluster" $P/verify/*.mjs $P/verify/*.sh` → 0 (excluding comments that cite L06). Make widget-smoke fail, not skip, on a missing W1/W3/W4/W8 target when `--guide "$G"` is not a stub build.

## Finding 8: Several Verify commands are vacuous or will misread their output
- **Severity:** High
- **Location:** Phase 08 "T8.5 Render-check"; Phase 04 test matrix "HLL/Bloom deterministic"; Phase 10 "T10.2 Final gate"
- **Flaw:**
  1. T8.5 greps `render-report.json` for the keys `"runtimeErrors"`, `"overflow"` and `"smallTargets"`. The script writes `[{viewport, screenshot, outline, findings, height}]`, with problems stored as `findings[].severity/type`, so the grep matches nothing. It exits 1 with empty output, and "every count 0" is satisfied trivially.
  2. `rerun-gate.mjs --only 08-` selects files with `f === basename(only)`, and no file is named `08-`. So 0 single-client regions are checked, and the HLL/Bloom determinism test passes with nothing tested.
  3. T10.2 compares `git status --short` against an allow-list containing `G`. Git escapes non-ASCII paths by default (`core.quotepath` is unset here), so `G` appears as `"reports/Kh\303\263a 3. Kh\303\263a H\341\273\215c …"` and a literal comparison flags it ✘.
- **Failure scenario:** Acceptance criterion 14 (render 0/0/0) is "verified" without evidence, or the executor treats the grep's rc 1 as a fail and stops. HLL/Bloom drift goes undetected. The final gate either false-fails on the guide's own path, or the executor drops the path check.
- **Evidence:** `phase-08-assemble-verify-render.md:55`; `C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs:328` (writes `results`), `:337-342` (counts `findings[].severity`, exit 1 on errors); L06 `verify/render/render-report.json` keys = `viewport,screenshot,outline,findings,height` (read during review); `phase-04-stages-5-8.md:111`; `plans/261031-1651-lesson-06-redis-teacher-guide/verify/rerun-gate.mjs:56`; `phase-10-docs-final-gate-handoff.md:33,59`; `git ls-files -- "Tài Liệu"` prints octal-escaped paths (observed).
- **Suggested fix:** T8.5 Verify should be render-check `echo rc=$?` → `rc=0` for both runs, plus `node -e` counting `findings.filter(f=>f.severity==='error').length` → `0` in each report. Use `--only 08-hll.sh` and `--only 08-bloom.sh` separately. Use `git -c core.quotepath=off status --short` (still a read-only status call), or compare after octal-unescaping.

## Finding 9: Where a measurement runs is ambiguous, so the host and the VM can give different answers
- **Severity:** Medium
- **Location:** Phase 03 "Regions" `01-fundamentals.sh#maxclients` (R07) and `04-leaky.{A,B}.sh#worker` (R15b)
- **Flaw:**
  1. R07 requires `ulimit -n ≥ 10032`. The region lists a bare `ulimit -n` in a `.sh` region, and the runner executes `.sh` regions in host Git Bash, where `ulimit -n` returns **3200** (measured during review). Only the in-container value, typically 1048576, can satisfy the row.
  2. In the leaky worker, A's `r$i-$(date +%s%3N)` is a host Git Bash line, unless it is wrapped in `sh -c`, so the timestamp comes from the Windows clock. B computes `cho=$(( $(date +%s%3N) - ${v#*-} ))` inside the container on the VM clock, which runs about 8 % fast and steps back by up to 2.8 s. The `cho=` waits then mix two clocks and can be negative or seconds off, which breaks the plan's own "one clock" rule.
- **Failure scenario:** R07 fails at T3.3, which leads to a deviation or a kongming stop. R15b's `cho=` values ("rising") swing by the host–VM offset, and Đạt is taught a queueing delay that is really clock skew.
- **Evidence:** `phase-03-containers-stages-1-4.md:34,76-77`; `plan.md:78` (R07), `:98` (R15b); `plans/261031-1651-lesson-06-redis-teacher-guide/verify/run-redis.mjs:139-142` (`.sh` runs in Git Bash), `:1-2` (single host clock); `plans/261031-1651-lesson-06-redis-teacher-guide/controller-facts-addendum.md:21-26` (VM clock drift); review probe `ulimit -n` → `3200`.
- **Suggested fix:** Write the region as `docker exec advance-be-k2l04-redis sh -c 'ulimit -n'`, and have the matrix row say "in container". Make the A side `MSYS_NO_PATHCONV=1 docker exec advance-be-k2l04-redis sh -c 'redis-cli --eval … , 5 r'$i'-$(date +%s%3N)'` so both timestamps come from the VM clock, and label the wait "đồng hồ máy ảo".

## Finding 10: The 290-minute, single-day budget and the "around 2026-11-04" start contradict the learner's observed pace
- **Severity:** Medium
- **Location:** plan.md "Overview" and "Stage map"; Phase 10 "T10.3/T10.4"
- **Flaw:** The plan assumes Đạt finishes L06 and starts K2L04 around 2026-11-04, and completes 8 stages (6 limiters, PG pgbench, HLL/Bitmap/Bloom, two-terminal timelines) in 290 core minutes. The record says otherwise:
  - L07 was ready on 10-27 22:41 and stages 1–4 were done by 10-30, roughly 3 evenings.
  - L06 was ready on 11-01, and on 11-02 Đạt was only resuming stage 2 of 9.
  - The binding pacing rule is "slow down, glossary first".

  Stage 3 gets 40 minutes for three algorithms, replay reading, a TSV challenge and 4 quiz items. Stage 4 gets 45 minutes for leaky, token, batch, 429, fail-open and a two-terminal race. Both are tighter than the L06 stages Đạt is currently moving through slowly.
- **Failure scenario:** K2L04 starts days later than planned. Meanwhile the learner-ready containers decay after reboots (Finding 6), L06 churn breaks fingerprints (Finding 5), and the guide's "Kết quả đã chạy trên máy bạn ngày …" dates go stale. On study day, a 4-hour session ends in the middle of stage 4, and that cut is not one of the plan's sanctioned "nếu còn sức" items, because stages 3–5 are never optional.
- **Evidence:** `plan.md:18,30-44,188`; `evidence-packet.md:26,33,243`; `plans/handoffs/lesson-07-guide-ready-20261027-2241.md` and `plans/handoffs/lesson-07-stage1-4-mastered-resume-stage5-20261030-1730.md:16`; `plans/handoffs/cluster1-m1-done-lesson06-redis-stage2-20261102-1120.md:15,23-24`.
- **Suggested fix:** Plan K2L04 as 2–3 evenings, with a split at a stage boundary: session 1 = stages 1–3, session 2 = 4–5, session 3 = 6–8 plus homework. Put the session breaks in `#cach-hoc`. Drop the fixed "2026-11-04" from the handoff, and add "`up main`, `check.sh`" as the resume ritual for each session.

---

**Tally:** 1 Critical, 5 High, 4 Medium.
