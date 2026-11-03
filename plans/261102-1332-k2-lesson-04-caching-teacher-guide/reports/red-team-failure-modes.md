# Red team — Failure Mode Analyst (Flow Tracer) — K2 Bài 04 plan

Reviewer role: hostile red team, Murphy's-law lens. Scope: `plan.md` and `phase-01…10`. I checked them against `evidence-packet.md` (§5, §9), `kongming-investigation-counsel.md`, the L06 build system (`plans/261031-1651-lesson-06-redis-teacher-guide/verify/*`, `runs/*`) and `labs/lesson-06-redis/*`. Date 2026-11-03.

**Re-derivation (throwaway model in `verify/tmp/`, since deleted).** I replayed the T2.3 trace through the T2.4 semantics. These literals reproduce exactly:
- R13, R14b, R14 (incl. row 10000 `[0, 6, 2000]`), R14c (5/3), R15 (row 10000 wait 8750), R16a (row 10000 retry 750);
- R16e (`12 tren 22`; `1 0 0`, `1 0 0`, `0 0 9990`);
- R37 (`fp=953`, 22587 bits, theory 918.5).

The `ref-model --check` gate is therefore sound. Every frozen number that fails below comes from a **live** or **TIME-form** run, or from the shape of the output pipe, not from the model.

Side observation: Docker Desktop was **not running** during this review (`docker ps` → `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`). That is relevant to Finding 6.

---

## Finding 1: R16b freezes `retry 1000000`, but the T2.4 formula gives ≈ 999 780 ms and the value drifts between reps
- **Severity:** High
- **Location:** plan.md, matrix row R16b (line 101); Phase 02, T2.4 token-bucket row (line 78); Phase 03, region `04-tb-race.{A,B}.sh#claim` (line 78); Phase 03, T3.6 Verify (line 148), and the T3.7 rerun gate.
- **Flaw:** The expected value was copied from L06's recorded run, but L06's script rounds retry **up to whole seconds**. K2L04's T2.4 contract has millisecond precision: `retry=ceil((cost−tokens)·1000/rate)`. B calls about 0.2 s after A, on the server `TIME` clock, so tokens ≈ elapsed·0.001/1000 > 0 and retry = 1 000 000 − elapsed.
- **Failure scenario:**
  - A takes the token. B arrives about 220 ms later (server clock) with tokens = 0.00022, so retry = `ceil(0.99978·1e6)` = **999 780**.
  - The R16b regex (`retry 1000000`) is RED on every attempt. The only exception is a backward VM clock step that clamps elapsed to 0.
  - Even with the regex loosened, the rep-vs-run comparison in the rerun gate (T3.4/T3.7) fails: `sessions()` masks numbers only for INFO/MEMORY/benchmark commands, so the B retry differs between rep 1, 2 and 3 (999 780 vs 999 793 …).
  - This blocks T3.6 and gates34, and goes straight into the Failure Protocol on a core overlap run (plan.md:46).
- **Evidence:**
  - L06 `labs/lesson-06-redis/lua/token-bucket.lua:25`: `retry = math.ceil((1 - tokens) / rate) * 1000` (seconds granularity).
  - L06 `runs/09-bucket-lua.claim.timeline.txt:11,15,18`: A eval at +530 ms, B eval at +750 ms, `B < 1000000`. The 1 000 000 exists only because of the seconds rounding.
  - K2L04 `phase-02-tests-first.md:78`: ms formula.
  - L06 `verify/rerun-gate.mjs:18,25,43-50`: only `INFO|MEMORY|SLOWLOG|LATENCY|redis-benchmark` lines are masked.
  - Re-derived: plan formula at +220 ms → `[0, 0, 999780]`.
- **Suggested fix:** Change R16b to `B 0; retry ∈ (999000, 1000000]`, or `retry > 0 ⇒ Retry-After ceil(retry/1000) = 1000`. Add `--eval rl-token-bucket.lua` reply lines to the rerun-gate number mask for TIME-form runs. Alternatively, pass an explicit equal `now` to both clients, but that drops the "production TIME form" required by evidence §9.11.

## Finding 2: The R16h `awk` reads raw multi-line `--eval` output, giving 1×200 and 8×429 with `Retry-After: 0`
- **Severity:** High
- **Location:** Phase 03, region `04-contract.sh#http429` (line 82); plan.md R16h (line 107). The same pipe shape affects R16e "batch replies `1 0 0`" (plan.md:104).
- **Flaw:** When stdout is not a TTY, `redis-cli --eval` prints each array element **on its own line**. The specified pipe sends those lines straight into `awk '{ if ($1==1) … else … int(($3+999)/1000) }'` without flattening each reply. So awk sees 9 one-field lines and `$3` is always empty.
- **Failure scenario:** Three calls produce the lines `1,0,0, 0,0,999780, 0,0,999780`. awk prints `HTTP/1.1 200 OK` once and eight `429 … Retry-After: 0` lines. The R16h regex ("two 429 with n > 0") fails. Worse, if someone "fixes" the regex instead of the pipe, the guide teaches `Retry-After: 0`, which is exactly the bug the drill seeds (FR-M2-05, phase 05 T5.3).
- **Evidence:**
  - L06 `runs/09-bucket-lua.claim.timeline.txt:12-14,16-18`: one reply field per line (`A < 1`, `A < 0`, `A < 0`).
  - L06 `labs/lesson-06-redis/09-bridge.sh:8`: L06 had to add `| paste -sd" " -` per call for exactly this reason.
  - K2L04 replay template `phase-03-containers-stages-1-4.md:51`: correctly uses `| xargs`, but `http429` (line 82) has no such step.
- **Suggested fix:** Specify `for i in 1 2 3; do redis-cli --eval … | paste -sd' ' -; done | awk …` inside one `docker exec … sh -c`. Do the same in the `over-admit` region (line 81). Add negative case "Retry-After: 0 → R16h RED".

## Finding 3: Host-side `docker exec` latency (≈ 160–180 ms per call) breaks R15b's admission count and R29's 150 ms bound; R15b's `cho=` subtracts a host timestamp from the VM clock
- **Severity:** High
- **Location:** Phase 03, region `04-leaky.{A,B}.sh#worker` (lines 75-77) and plan.md R15b (line 98). Phase 04, region `07-share.{A,B}.sh#pool` (line 37) and plan.md R29 (line 122).
- **Flaw:**
  1. **R15b.** A's offers are written as "8× `--eval …`" with `r$i-$(date +%s%3N)`, i.e. host Git Bash lines, which phase 01 smoke S4 checks `date +%s%3N` on the **host** for. Each host `docker exec` costs about 160–180 ms, so 8 offers span ≈ 1.2 s. B pops one item every 0.5 s (VM clock, ≈ 0.46 s host).
  2. **R15b `cho=`.** B computes `cho = $(date +%s%3N)` (VM clock, inside the container) `− ${v#*-}` (host clock). The two clocks differ by an arbitrary offset: the VM was stepped by −2.8 s and drifts +8 %.
  3. **R29.** "`BLPOP` ≤ 150 ms after `RPUSH`" is measured across two `.sh` sessions. In the runner, the send stamp of a `.sh` line is taken when its marker reaches the host, which is **before** `docker exec` even starts.
- **Failure scenario:**
  - **R15b count.** Simulated at 170 ms spacing, B pops r1 at 0, r2 at ≈ 0.47 s and r3 at ≈ 0.94 s. LLEN never reaches 5 before offer 8, so all 8 offers return 1. The expected "1×6, 0, 0" can only happen if all 8 offers land inside B's first 0.5 s sleep, i.e. from an in-container loop.
  - **R15b numbers.** The `cho=` values shown in W5 can be negative or off by seconds.
  - **R29.** In L06's identical shape (A `$ docker exec … RPUSH barrier` → B `BLPOP` reply) the gap was **178 ms**, which is over 150.
  - **R29 reps.** The number of empty `poll $i:` lines depends on that same jitter. Rep timelines therefore differ in A's semantic lines, and the rep-vs-run rerun gate fails.
- **Evidence:**
  - L06 `runs/09-bucket-lua.claim.timeline.txt:4-6`: `+341 A > $ docker exec … RPUSH …`, then `+519 B < l06:barrier…` (178 ms). Lines 11-12: send +530 → reply +687 (157 ms). Lines 15-16: +750 → +915 (165 ms).
  - L06 `verify/run-redis.mjs:146-150`: `tSend` = time the marker arrived on the host.
  - L06 `verify/rerun-gate.mjs:43-50,73`: A/B session lines are compared exactly.
  - K2L04 `phase-01-contract-baseline-smoke.md:60` (S4: host `date +%s%3N`).
- **Suggested fix:**
  - Run A's 8 offers inside one `docker exec advance-be-k2l04-redis sh -c 'for i in $(seq 8); do redis-cli --eval … r$i-$(date +%s%3N); done'`, so both stamps use the VM clock and the burst takes under 50 ms.
  - For R29, anchor on B's `RPUSH` **reply** line `(integer) 1` rather than the send line, or put B's reply side in a `.redis` session (L06 R25 used `.redis` for BRPOP). Mask `poll N:` indices in the rerun gate, or assert only `≥ 3`.

## Finding 4: Two gates fail by construction: the T3.1b `--out` diff cannot match L06's `--ab` file naming, and T2.9 expects 58 RED rows when must-fix 9 made 59
- **Severity:** Critical
- **Location:** Phase 03, T3.1b Steps 2-3 and Verify (lines 101-109); Phase 02, T2.9 Verify (line 172) and test matrix (line 178); plan.md lines 53 and 140.
- **Flaw:**
  1. `run-redis.mjs --ab` writes `<out>.A.txt`, `<out>.B.txt` and `<out>.timeline.txt`, and `expected.tsv` names the run `<stem>.<region>.timeline` (L06 precedent).
     - With `--out 02-race.watch`, the T3.1b diff against `02-race.watch.timeline` fails. This applies to 9 two-client ids: 02-race ×2, 04-leaky, 04-tb-race ×2, 07-share ×2, 08-delay ×2.
     - With `--out 02-race.watch.timeline`, the file becomes `…timeline.timeline.txt` and `--runs` reports `missing run`.
     - In addition, H01–H03 (`hw-check.*`) must appear in `record-all.sh`, but the mandated `case` list has no `hw` group, and `hw-check.sh` does not exist until phase 05. A line in `gates` would make `runTool` throw on the missing file, and `record-all` would exit 1 in T4.6.
  2. The verifier prints one `missing run` per **row**. The matrix has 66 rows, of which 7 are design rows, so there are **59** run rows after R16h was added, not 58.
- **Failure scenario:** The phase 02 T2.9 Verify prints `59`, not `58`. That is a STOP and a kongming escalation before any lab exists. If it gets past that, the phase 03 T3.1b diff is non-empty on its first run. Under "never continue by self-reasoning", the executor cannot fix either of these itself.
- **Evidence:**
  - L06 `verify/run-redis.mjs:281,286-287`: `out = opt('--out') ?? \`${stemOf(A)}.${region}\``, and parts `A`, `B`, `timeline` are appended.
  - L06 `verify/expected.tsv` R25/R31b/R44b: run ids end with `.timeline`.
  - L06 `verify/record-all.sh:10`: the `ab()` helper passes no `--out` at all.
  - L06 `verify/verify-guide.mjs:371`: `fail(r.id, \`missing run ${r.run}\`)` is per row.
  - Count of plan.md rows on lines 73–138: 66 rows, 7 `D..`.
  - `plan.md:203` adds R16h without updating `plan.md:140`.
- **Suggested fix:**
  - In T3.1b, compare `--out` ids plus `.timeline` for `--ab` lines against `expected.tsv` run ids, excluding `hw-check.*` (or add an `hw` group recorded in phase 05).
  - Change 58/57 to 59/58 at plan.md:53,140 and phase-02:172,178. Better, make T2.9 compute the count: `awk -F'\t' 'NR>1&&$2!="-"' expected.tsv | wc -l`.

## Finding 5: The rerun gate runs every single-client region twice in one session, but many K2L04 regions mutate state and have no reset line, so gates34 and gates go RED
- **Severity:** High
- **Location:** Phase 02, T2.8 step 2 (lines 152-153, skip list "pgbench, crash, cpu, 03-live" only); Phase 03, T3.7 step 2 (line 155); Phase 04, T4.6 step 3 (line 94). Region specs: Phase 03 lines 45, 47-48, 81-82; Phase 04 lines 32-33, 36.
- **Flaw:** The L06 gate replays each region twice and diffs reply lines exactly, masking numbers only for INFO/MEMORY/benchmark output. The K2L04 region specs define no reset or UNLINK line except for the replay. The following regions give different results on the second pass:
  - `02-lua.sh#voucher`: `1, 0, LLEN 1`, then `0, 0, LLEN 1`. If the 02-race A/B runs use the seeded voucher keys, which run first in s2, R33b fails even on the **first** recording.
  - `03-window#incr-expire-bug`: `INCR 1` → `2`. It also deliberately leaves a `k2l04:rl:*` key with TTL −1, which **C09** (phase-02 line 139) then fails in the gates34 `check.sh` step.
  - `#set-nx-incr`: `SET … NX` → `OK`, then `(nil)` on the second pass (the key lives 10 s).
  - `04-batch#over-admit`: `last_ms=10019` from pass 1 is clamped on pass 2, so the decisions change.
  - `04-contract#http429`: the bucket is still empty (TTL 1e6 ms), so pass 2 gives 3×429.
  - `05-counter#redis-incr`: final `60000` → `120000`.
  - `05-counter#flush`: PG rows 1–3 grow by +120/+30/+5 again.
  - `06-unread#pointer`: `ZADD … 4 uA` → `1`, then `0`.
  - `05-counter-pg.sql#stats`: unmasked `n_tup_*`/`n_dead_tup` values move with autovacuum.
- **Failure scenario:** T3.7 and T4.6 each report several ✘ from the rerun gate, each triggering a Failure Protocol stop. A "fix" that adds a reset to a region after its run was recorded also trips V23 (run command ≠ current region text), which forces re-recording everything.
- **Evidence:**
  - L06 `verify/rerun-gate.mjs:28-35` (`twice()`: steps + separator + steps in one session), `:18` (MEASURED mask), `:56` (all non-A/B, non-tool files).
  - L06 `labs/lesson-06-redis/05-counter.A.redis:4-7,19-22`: L06 regions are idempotent only because each scenario starts with its own reset lines.
  - K2L04 `phase-03-containers-stages-1-4.md:51`: only the replay has "line 1 is an in-container scan + UNLINK".
- **Suggested fix:** Add one contract rule (§2 Formats): every stateful region begins with its own reset (`UNLINK` of its keys, PG `UPDATE … SET like_count=0 WHERE post_id<=3`). Have `incr-expire-bug` end by UNLINKing its TTL −1 key, after the `TTL` line. Add `#stats` to the rerun skip list, or mask its numbers. Give the 02-race scenarios their own keys (`k2l04:voucher:race:*`) so R33b does not depend on s2 ordering.

## Finding 6: The fingerprint gates fail on events K2L04 does not cause: L06 starting or stopping, a Docker restart, L06's own cleanup, and the company app writing to PG
- **Severity:** High
- **Location:** Phase 01, T1.1 steps 2-3 and Verify (lines 33-40); Phase 04, T4.1 steps 1/3 and Verify (lines 51-55). The compare is also used at T1.5, T3.7, T4.6 and T10.2.
- **Flaw:**
  1. The T1.1 idempotence check diffs two full fingerprints, and T4.1 diffs `grep '^pg_'`. Both include `pg_other_writes`, which must-fix 4 declared advisory because a foreign app writes to that PG.
     - Any write between the two snapshots fails the diff.
     - If the hash is taken over `pg_stat_all_tables`, `CREATE SCHEMA`/`CREATE TABLE` in T4.1 inserts rows into `pg_catalog` tables, so T4.1 fails **deterministically**.
  2. `--compare` hard-fails on "a change to L06 bind" and on "a missing baseline line", yet it says "an L06 flip is info only".
     - When L06 main is stopped, its bind reads `none`. L06 containers have no restart policy, so after a Docker Desktop restart they come back Exited. Docker Desktop was down while this review ran.
     - Đạt is studying L06 in parallel, and the L06 guide creates and removes `advance-be-redis-{evict,rdb,aof,replica,cluster}`; `99-cleanup.sh` removes them by name. If one of those existed at baseline, it later shows up as a "missing baseline line".
- **Failure scenario:** On 2026-11-03 Đạt finishes L06 stage 3 and runs L06 cleanup, or simply closes Docker overnight. The next morning K2L04 T3.7, T4.6 or T10.2 runs `--compare` and gets rc 1 (bind `127.0.0.1:6379` → `none`, or a missing extra's line). The executor must STOP, even though K2L04 touched nothing.
- **Evidence:**
  - K2L04 `phase-01-contract-baseline-smoke.md:36-37,40`; `phase-04-stages-5-8.md:51,55`; `plan.md:198`.
  - L06 `verify/fingerprint.sh:44` (`docker port` → empty → `none`) and `:68` (L06 treats a non-matching bind as ✘).
  - L06 `labs/lesson-06-redis/00-containers.sh` has no `--restart` (grep for `restart` finds nothing; `docker run` at line 102).
  - L06 `labs/lesson-06-redis/99-cleanup.sh:25-28` removes the extras.
  - `evidence-packet.md:26` (L06 studied concurrently) and `:174` (company dev data in that PG).
- **Suggested fix:**
  - Exclude `pg_other_writes` from both diffs: T1.1 should diff `grep -v '^pg_other_writes'`, and T4.1 should use `grep -E '^pg_schemas'`. Compute it from `pg_stat_user_tables` only.
  - Hash L06 lines and K2L04 lines separately. Make L06 status, bind-when-stopped and extras presence info-only. Hard-fail only when L06 is **running** with a bind other than `127.0.0.1:6379`, or when `l06_k2l04_keys` > 0.

## Finding 7: The `.sql` guard and lint require targets "in `k2l04_counter.`", which rejects the plan's own `CREATE SCHEMA k2l04_counter` and `DROP SCHEMA k2l04_counter CASCADE`
- **Severity:** High
- **Location:** Phase 02, T2.2 step 3 (line 38) and T2.6 V17 "SQL targets only in `k2l04_counter.`" (line 119); Phase 04, region `05-counter-pg.sql#setup` (line 22) and T4.1; plan.md Rollback (`99-cleanup.sql`).
- **Flaw:** `pgWriteTargets` reports the target of CREATE/DROP. For `CREATE SCHEMA IF NOT EXISTS k2l04_counter` and `DROP SCHEMA IF EXISTS k2l04_counter CASCADE` that target is the bare `k2l04_counter`, with no trailing dot. Implemented as written, a prefix test on `k2l04_counter.` fails it. T2.1's only Verify (`UPDATE public.x`) never exercises the positive schema case.
- **Failure scenario:** T4.1 runs `node run-lab.mjs 05-counter-pg.sql --region setup` and gets rc 2 ("write outside k2l04_counter"). R05s cannot be recorded. V17 also fails on `99-cleanup.sql`, so `--lint` in T3.7/T4.6 is RED. That is a Failure Protocol stop on the critical path of stage 5.
- **Evidence:** `phase-02-tests-first.md:38,119`; `phase-04-stages-5-8.md:22`; `plan.md` Rollback line "`99-cleanup.sql` runs `DROP SCHEMA IF EXISTS k2l04_counter CASCADE`". There is no L06 precedent: L06 `verify/lab-text.mjs` has no SQL parser.
- **Suggested fix:** Define the rule as `target === 'k2l04_counter' || target.startsWith('k2l04_counter.')`. Add a selftest fixture to T2.1/T2.6: `CREATE SCHEMA IF NOT EXISTS k2l04_counter; DROP SCHEMA IF EXISTS k2l04_counter CASCADE` must be accepted, and `DROP SCHEMA public CASCADE` rejected.

## Finding 8: The R13c live boundary demo does not say which mechanism to use; the plan's own `rl-fixed` (PEXPIRE 2W, window-indexed key) cannot give "2–5 then 1–6", and the clock line misses −2.8 s steps on runs ≥ 12 s
- **Severity:** Medium
- **Location:** Phase 03, region `03-live.sh#fixed-boundary` (lines 60-65); plan.md R13c (line 93); Phase 02, T2.4 fixed row and T2.2 step 5 (clock rule).
- **Flaw:**
  1. The steps "one request; wait while `PTTL` > 300; burst of 4; wait for expiry; burst of 6" work only if the key's TTL equals the time left in the window, as in the `SET … EX 10 NX` + `INCR` form of R13b.
     - The stage-3 limiter `rl-fixed.lua` instead keys by `floor(now/W)` and sets `PEXPIRE 2W` (20 s).
     - "PTTL < 300" then arrives about 19.7 s later, two windows on. The burst hits a new key and replies `1–4`, so R13c is RED.
  2. The clock line accepts |Δvm−Δhost| ≤ max(300, 0.15·Δhost). With the VM 8.3 % fast, a full −2.8 s step passes as `ok` whenever Δhost ≥ 2.8 / (0.15 + 0.083) ≈ 12 s. That covers this demo (10–20 s) and the R20 three-variant burst.
- **Failure scenario:** The executor uses `rl-fixed.lua`, the natural choice in the rate-limit stage, and R13c fails on all 3 attempts, followed by kongming. Or it uses SET NX, and a −2.8 s step during "wait for expiry" stretches the host gap past 1500 ms while the header still says `→ ok`. The bound is breached with no clock flag, and the executor gets a misleading failure.
- **Evidence:**
  - `phase-02-tests-first.md:76` (fixed: `PEXPIRE 2W`, key `floor(now/W)`) and `:45` (clock rule).
  - `phase-03-containers-stages-1-4.md:48` (R13b SET NX EX 10) and `:60-65`.
  - L06 `controller-facts-addendum.md:21-26` (−2800 ms step, ratio 1.083).
- **Suggested fix:** Make 03-live explicitly the R13b form, `SET k2l04:rl:live:s7 0 EX 10 NX` + `INCR`, with PTTL aligned to the window. Add a monotonic check to the clock rule: sample `TIME` at the start, middle and end, and mark `LỆCH` on any backward delta, not only on the end-to-end ratio.

## Finding 9: "WATCH … EXEC, then retries" in a static `.redis` session either retries blindly (stock −1, redeemed B, A) or is unspecified, contradicting R33's "stock "0"; redeemed B"
- **Severity:** Medium
- **Location:** Phase 03, region `02-race.{A,B}.redis#watch` (line 42); plan.md R33 (line 87); Phase 02, T2.2 step 2 (MULTI one-step).
- **Flaw:** A `.redis` session cannot branch on a reply. After the first `EXEC` → `(nil)`, a literal retry (`WATCH`, `GET` → `"0"`, `MULTI`, `DECR`, `RPUSH A`, `EXEC`) succeeds, because nothing touched the key in between. Stock becomes `"-1"` and redeemed becomes `[B, A]`, which is a double redemption: the exact bug slide 33 is meant to rule out. No L06 run ever went through MULTI/WATCH (grep finds no WATCH/MULTI in `labs/lesson-06-redis/`), so this one-step runner path has no precedent beyond the T2.9 fixture.
- **Failure scenario:** The recorded R33 shows stock `-1`. Either the row is RED and goes to kongming, or a delegate "fixes" the narrative so it teaches that WATCH retry works blindly. The stage-2 challenge "WATCH + 3 retries: 1 redeemed" (phase-07 line 41) then has no correct model to copy.
- **Evidence:** `phase-03-containers-stages-1-4.md:42`; `plan.md:87`; the L06 runner sends steps blind with no conditionals (`verify/run-redis.mjs:119-128`); grep for `WATCH|MULTI|EXEC` in L06 labs finds nothing.
- **Suggested fix:** Specify the retry as "WATCH, GET → `"0"`, UNWATCH, stop (hết hàng)". The human decides, and the recorded run shows the read that ends the retry. Assert `stock "0"`, `LLEN redeemed 1`, and the absence of a second `RPUSH A` reply.

## Finding 10: CRLF: the repo has `core.autocrlf=true` and no `.gitattributes`; a CRLF `traffic.tsv` or `my-traffic.tsv` corrupts the replay, and the runner keeps only the text after `\r`
- **Severity:** Medium
- **Location:** Phase 02, T2.3 (line 54); Phase 03, replay template (line 51, `while read ts c act`); Phase 07, stage 3 challenge `my-traffic.tsv` (line 42).
- **Flaw:** Nothing forces LF on lab data. Under `autocrlf=true`, any later checkout or clone (for example on another PC) rewrites `*.tsv`, `*.awk` and `*.sh` with CRLF. On Windows, Đạt's own `my-traffic.tsv` created in an editor also gets CRLF by default.
  - Inside the container, `read ts c act` then yields `act="1\r"`, so `summary.awk` groups on `1\r` and the `man` lines carry `\r`.
  - The runner's `collect()` splits each line on `\r` and keeps only the last segment. Recorded rows lose `ts c act`, so R13–R16a regexes and W3/W4 data fail.
  - In Đạt's terminal the `\r` overwrites the line start, so his challenge output is garbled.
- **Failure scenario:** Đạt does the stage-3 challenge with a VS Code–created `my-traffic.tsv`. The output lines are mangled, `counter ≥ 8/10 s` cannot be read, and the PASS criterion cannot be judged. On a re-cloned checkout, every `.sh` fails with `$'\r': command not found`.
- **Evidence:**
  - `git config --get core.autocrlf` → `true`; there is no `.gitattributes` at the repo root. L06 labs are LF in the working tree only because they were never re-checked-out (`git ls-files --eol` → `w/lf`).
  - L06 `verify/run-redis.mjs:58` (`raw.replace(/\r$/,'').split('\r')…pop()`).
  - L06 `verify/lab-text.mjs:10` normalises CRLF only for region parsing, not for container-side reads.
- **Suggested fix:** Add `tr -d '\r'` after `grep -v "^#"` in the replay template, and in the `my-traffic.tsv` instructions. Add a C-check or lint that `traffic.tsv`, `summary.awk`, `compare.awk` and `*.sh` contain no `\r`. Propose a `.gitattributes` (`*.sh *.tsv *.awk *.lua *.redis *.sql text eol=lf`) to the user as an allow-list addition, not a silent edit.

---

### Not raised (checked, holds)
- **MULTI hang.** The one-step `MULTI…EXEC` plus the T2.9 fixture addresses the `ECHO`-inside-MULTI → `QUEUED` deadlock.
- **pgbench `-f /dev/stdin`.** Gated by smoke S11/S11b.
- **Bloom, HLL and Bitmap statistics.** Deterministic for fixed `seq` inputs; R37 was re-derived exactly.

### Unresolved questions
- Is the `quan-ly-hop-dong` dev app actually writing to `advance_be_lab` during build hours? This decides whether Finding 6.1 fires on every run or only sometimes.
- In R20, does "hot Lock samples ≥ 4" mean 4 samples each showing a Lock wait, or 4 Lock rows in total? It is undefined. The sampler's 4th `docker exec` (≈ 1 + 4×(0.3 + 0.17) ≈ 2.9 s) lands near pgbench's `-T 3` end.
