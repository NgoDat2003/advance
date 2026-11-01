# Red team: Assumption Destroyer / Scope Auditor — Lesson 06 Redis plan

Reviewer role: hostile skeptic. Scope: `plan.md`, `phase-01..09`, with `evidence-packet.md`, `controller-facts-addendum.md` and `verify/ultra-plan/verdict.md` as context. The 8 "Materialization must-fix" items are taken as already applied and are not re-reported. Where a must-fix is itself incomplete, that is called out.

Read-only checks run on 2026-10-31:
- `docker exec advance-be-redis redis-cli INFO memory` and `CONFIG GET`.
- Redis 7.2.3 source from raw.githubusercontent.com (`server.h`, `evict.c`, `slowlog.c`, `server.c`, `script.c`, `networking.c`, `replication.c`).
- Node probes of Git Bash path conversion and of the lesson-07 V07 regex.
- Greps over the lesson-07 tooling and the OmniPOS docs.

---

## Finding 1: The eviction survival expectations (R18, R19, R21) cannot hold. The LRU clock ticks once per second, and the cold fill alone is larger than 3 MB.
- **Severity:** High
- **Location:** `plan.md:80-83` (R18/R19/R21), `plan.md:160` (must-fix 8 order), `phase-03-containers-experiments-runs.md:66`
- **Flaw:** The plan expects that hot keys touched by 10 `GET` rounds will survive LRU/LFU eviction better than cold keys. Two facts break this:
  1. **LRU clock resolution.** Redis 7.2.3 keeps the LRU clock in whole seconds (`LRU_CLOCK_RESOLUTION 1000`). It is refreshed only by cron at `hz 10`. The full awk pipe runs in about 1 s: 300 hot SETs, 3000 GETs, 3000 cold SETs. So hot and cold keys mostly get the same `lru` value. Eviction between equal idle times is close to random.
  2. **Size of the cold fill.** Empty-instance memory is about 0.87 MB (`used_memory_startup:865848`). A 1 KB value sits in jemalloc's 1280 B size class, plus the robj, dictEntry and key, so each key costs about 1.35 KB. That makes 300 hot keys about 0.4 MB and 3000 cold keys about 4 MB. The 3 MB limit is crossed partway through the cold fill.
  - With phase 03's order (hot → GET rounds → cold), the cold keys are newer, so `allkeys-lru` evicts the hot keys first.
  - With must-fix 8's order (hot → cold → GET rounds → overflow), the hot keys are already being evicted during the cold fill, before any touch round runs. LFU counters are all `LFU_INIT_VAL 5` at that point, so hot and cold look the same.
  - R21 (`allkeys-random`, "within ±15 points"): the hot keys go in first, so they are exposed to every eviction. A rough calculation gives hot survival around 32 % against cold around 48 %. That is at or past the ±15 bound.
- **Failure scenario:** R18 records hot survival ≤ cold survival. The row turns into a `deviation`. The guide then either teaches "LRU does not protect hot keys", which is wrong, or slide 23's PART chip rests on a broken experiment. AC5 is "met" only through a bogus deviation entry.
- **Evidence:**
  - `src/server.h:894` `#define LRU_CLOCK_RESOLUTION 1000 /* LRU clock resolution in ms */`
  - `src/server.h:3406` `#define LFU_INIT_VAL 5`
  - `src/evict.c:73` `return (mstime()/LRU_CLOCK_RESOLUTION) & LRU_CLOCK_MAX;`
  - `docker exec advance-be-redis redis-cli INFO memory` → `used_memory_startup:865848`
  - `CONFIG GET maxmemory-samples` → `5`
- **Suggested fix:** Size the cold fill so it fits under maxmemory without the overflow: about 1200 cold keys at 3 MB, or raise maxmemory to 6 MB. Then add `#@ sleep 2` between the fill and the touch rounds, and again before the overflow fill. The overflow fill alone should trigger eviction. Freeze R21 as "hot vs cold survival among keys present when eviction starts", or drop the ±15 claim.

## Finding 2: The DEL vs UNLINK figure (R32) and "SAVE in SLOWLOG" (R22) depend on SLOWLOG entries that will not exist.
- **Severity:** High
- **Location:** `plan.md:94` (R32), `plan.md:84` (R22), `phase-03-containers-experiments-runs.md:70`, `phase-02-tests-first.md:47` (C11 pins `slowlog-log-slower-than 10000`)
- **Flaw:**
  - SLOWLOG records only commands that take at least `slowlog-log-slower-than` µs (10000 here). On a 1M-field hash, `UNLINK` hands the free to the bio thread and returns in microseconds, so it is never logged. There is no UNLINK µs value to put into "DEL µs ≥ 10× UNLINK µs".
  - The region also rebuilds `l06:big:h2` with 10 `EVAL` chunks of 100k `HSET`. Each chunk takes more than 10 ms, so each is logged. `SLOWLOG GET 2` after the `UNLINK` therefore returns the last two EVAL chunks, not DEL and UNLINK.
  - R22's "`SAVE` in SLOWLOG" fails the same way. `SAVE` of 1000 tiny keys takes about 1 ms, well under 10 ms. R22 is also the only measured basis for slide 26's "SAVE blocks the main thread" and its OK chip.
- **Failure scenario:** The `ratio(del,unlink)>=10` predicate has no UNLINK operand, so R32 goes RED or turns into a deviation. The slide 38 "OK" chip loses its measurement. R22 cannot find a SAVE entry, so slide 26's chip is unsupported.
- **Evidence:**
  - `src/slowlog.c:124-125` `if (server.slowlog_log_slower_than < 0) return; ... if (duration >= server.slowlog_log_slower_than)`
  - `CONFIG GET slowlog-log-slower-than` → `10000`
  - `phase-03-containers-experiments-runs.md:70`: "`SLOWLOG RESET`, `DEL`, rebuild as `l06:big:h2`, `UNLINK`, `SLOWLOG GET 2`"
- **Suggested fix:**
  - In the bigkey and SAVE regions, run `CONFIG SET slowlog-log-slower-than 0` and restore `10000` in the same region, which satisfies the V16 lint.
  - Build both hashes before `SLOWLOG RESET`, then run `DEL h`, `UNLINK h2`, `SLOWLOG GET 2`.
  - For R22, make SAVE heavy enough to see: `DEBUG POPULATE 1000000 l06:p:pop` on `-rdb`. Alternatively, measure with `--latency`/`TIME` stamps instead of SLOWLOG.

## Finding 3: Must-fix 3 is incomplete. R35's post-reconnect assertions ("new value", `sync_partial_ok ≥ 1`) assume the replica reconnects quickly, but it may wait up to `repl-timeout` (60 s).
- **Severity:** High
- **Location:** `plan.md:97` (R35), `plan.md:155` (must-fix 3), `phase-03-containers-experiments-runs.md:71`
- **Flaw:** Must-fix 3 dropped the `master_link_status:down` assertion but kept "reconnect → `GET` 120, `sync_partial_ok` ≥ 1". `docker network disconnect` followed by `connect` does not close the replica's TCP socket. The socket stays in the container's netns. One of two things then happens:
  - **Same IP is reassigned.** Kernel retransmits resume the old stream. No PSYNC happens, so `sync_partial_ok` stays 0.
  - **A different IP is assigned.** The old socket is dead, but neither side notices until `repl-timeout`. The replica's check is `(time(NULL)-server.master->lastinteraction) > server.repl_timeout`, which is 60 s. Until then, `GET` keeps returning 100 and `master_link_status` stays `up`.
  The phase gives no wait bound for the reconnect step.
- **Failure scenario:**
  - In the "different IP" case, the step that expects `GET` → 120 runs within seconds and records 100. R35 goes RED.
  - In the "same IP" case, 120 arrives but `sync_partial_ok:0`. R35 goes RED again.
  - Either way, slide 7's "OK" chip (R35) becomes a deviation.
- **Evidence:**
  - `src/replication.c:3739-3741` `(time(NULL)-server.master->lastinteraction) > server.repl_timeout` → `"MASTER timeout: no data nor PING received..."`
  - `CONFIG GET repl-timeout` → `60`
  - `phase-03-containers-experiments-runs.md:71`: "reconnect → `GET` (120), `sync_partial_ok`"
- **Suggested fix:**
  - Start the replica with `--repl-timeout 5` (and record that).
  - After reconnect, poll `INFO replication` until `master_link_status:up`, with a stated bound (for example `#@ sleep 8`).
  - Assert only "GET eventually 120". Record `sync_partial_ok` as observed n, not ≥ 1. Alternatively, force PSYNC with `CLIENT KILL TYPE master` on the replica, which reconnects at once and makes `sync_partial_ok` deterministic.

## Finding 4: The Lua variants of the two-client timelines (R31, R42, R43, R44) are written as `redis-cli --eval <file>`, which cannot run inside a `.redis` session.
- **Severity:** High
- **Location:**
  - `phase-03-containers-experiments-runs.md:69` (06-delay Lua `redis-cli --eval /lab/lua/delay-claim.lua … , <now>`)
  - `phase-03-containers-experiments-runs.md:73` (08-lock `cad` "with `lock-release.lua`", `fencing` "with `fenced-write.lua`")
  - `phase-03-containers-experiments-runs.md:74` (09-bucket A/B "vs Lua")
  - `phase-02-tests-first.md:31,34` (runner pipes a `.redis` region into one `redis-cli` session; `--ab` takes `.redis` files)
  - `plan.md:93,104-106`
- **Flaw:**
  - `--eval` is a redis-cli command-line flag, not a Redis command. The runner and `--ab` stream `.redis` lines into an already-open `redis-cli --no-raw` session, so a line `redis-cli --eval …` becomes `ERR unknown command 'redis-cli'`.
  - `<now>` is a placeholder. A static `.redis` file can hold neither the host time nor the server time.
  - The only way to use the `.lua` files from a `.redis` file is to inline the script into `EVAL "…"`, which duplicates it. No gate checks that the inlined copy equals `lua/*.lua`: V05 compares only `pre[data-cmd]` against the `.redis` region. So the `.lua` file the guide shows and the script actually recorded can drift apart.
- **Failure scenario:** `06-delay.lua.timeline`, `08-lock.cad/fencing.timeline` and `09-bucket.lua.timeline` record `(error) ERR unknown command`. R31, R42, R43 and R44 go RED. The capstone (stage 8, 40 min) and slides 37/41 lose their measured "OK" basis.
- **Evidence:**
  - `phase-03-containers-experiments-runs.md:69`: "Lua = `redis-cli --eval /lab/lua/delay-claim.lua l06:delay:orders , <now>`"
  - `phase-02-tests-first.md:31`: "opens one `docker exec -i <ct> redis-cli --no-raw` session … Before command k it writes `ECHO @@k`, then the command."
- **Suggested fix:**
  - Load scripts once (`SCRIPT LOAD` from `lua/*.lua` in `00-seed`, or `FUNCTION LOAD` a `l06` library), then call `EVALSHA`/`FCALL` in the `.redis` files.
  - Alternatively, let the runner expand a `#@ lua <file>` directive into `EVAL "<escaped body>"`, and add a V05-style check that the expanded body equals the `.lua` file.
  - Replace `<now>` with server-side `redis.call('TIME')` inside `delay-claim.lua`. Give the naive poller fixed past scores, or `+inf`.

## Finding 5: The runner sets `MSYS_NO_PATHCONV=1` but the learner's Git Bash does not. Absolute container paths get rewritten, so recorded commands pass while the learner's copies fail.
- **Severity:** High
- **Location:** `phase-02-tests-first.md:33` (runner only), `phase-03-containers-experiments-runs.md:45` (only `00-containers.sh` mounts with it), `phase-03-containers-experiments-runs.md:67` (`ls /data/appendonlydir`), `phase-03-containers-experiments-runs.md:69` (`--eval /lab/lua/...`), `plan.md:134` (Git Bash is a first-class learner shell)
- **Flaw:** Git Bash (MSYS) rewrites any argument that starts with `/` when it calls a Windows exe such as `docker.exe`. The runner hides this by exporting `MSYS_NO_PATHCONV=1`. The learner's Git Bash does not set it, and nothing says each `.sh` lab must export it. Affected commands include:
  - `docker exec advance-be-redis redis-cli --eval /lab/lua/delay-claim.lua …`
  - `docker exec advance-be-redis-aof ls /data/appendonlydir`
  - `head -c 5 /data/appendonlydir/...`
  - any `/lab/...` argument the guide shows as a one-liner
  Arguments wrapped in `sh -c '…'` happen to survive. Bare ones do not.
- **Failure scenario:** Đạt pastes the stage 6 Lua poller or the stage 4 hybrid check into Git Bash. Docker receives `D:/Git/lab/lua/delay-claim.lua` and the command fails with "Can't open file" or "No such file". The recorded run (made with the env var set) shows success, so V05/V06 pass on a command the learner cannot reproduce.
- **Evidence:**
  - Probe in this environment: `node -e "console.log(process.argv[1])" /lab/lua/delay-claim.lua` → `D:/Git/lab/lua/delay-claim.lua`.
  - With `MSYS_NO_PATHCONV=1` it prints `/lab/lua/delay-claim.lua`.
  - `'ls /proc/1/task | wc -l'` passes through unchanged.
- **Suggested fix:**
  - Put `export MSYS_NO_PATHCONV=1` on line 2 of every lab `.sh`. Do not set it in the runner, so that recording reproduces the learner's environment.
  - In guide one-liners, wrap every in-container path in `sh -c '…'`, or prefix them with `//`.
  - Add a V16 lint rule: a `docker exec` line with a bare `/`-path argument in `.sh`/guide text is RED unless the file exports the variable.

## Finding 6: The fingerprint gate (AC11, C14) breaks when tomorrow's Phase B creates the hub containers. It also writes every non-lab container's name and id into a public repo.
- **Severity:** High
- **Location:**
  - `phase-01-contract-baseline-smoke.md:22` (fingerprint covers every container whose name does not match `^advance-be-redis`)
  - `phase-02-tests-first.md:51` (C14 in learner-facing `check.sh`)
  - `phase-09-docs-final-gate-handoff.md:26`
  - `plan.md:126` (AC11)
  - `plan.md:159` (must-fix 7 handles only restarts)
- **Flaw:**
  - **New containers.** The baseline is taken on 2026-10-31. The evidence packet says 2026-11-01/02 is Cluster 1 Phase B (OmniPOS hub M0+M1). M0 adds a hub Postgres container on 5434, and later a Redis on 6380. Must-fix 7 only removes `StartedAt`; any new container still adds a line. So `00-fingerprint-after.txt` ≠ `before` even though the lesson touched nothing. Learner-facing `check.sh` C14 then reports ✘ on study day (about 11-02) and exits non-zero.
  - **Data exposure.** The advance-be repo is public. The hub plan forbids writing company container names into tracked files. `fingerprint.sh` dumps the name, id and image of all 15 non-lab containers into `runs/00-fingerprint-*.txt` inside the repo. V15 does not scan for them.
- **Failure scenario:** Phase 09's "fingerprint before = after" fails on a new `omnipos` container. The controller either re-baselines, which defeats the gate, or ships with the final gate red, which violates AC11. Separately, the untracked run files later get committed by a broad `git add`, leaking internal container names.
- **Evidence:**
  - `evidence-packet.md:12` "Tomorrow (2026-11-01) and the day after are Cluster 1 Phase B (OmniPOS hub M0 + M1)"
  - `docs/omnipos-finledger-hub/architecture-evolution.md:282` "PG riêng 5434 … Thêm 1 container"
  - `plans/261027-0907-cluster1-m0-m1-implementation/plan.md:19` "advance-be là repo PUBLIC … Tên container công ty … không bao giờ viết chữ trong file được track"
  - `docker ps -a --format '{{.Names}}' | grep -vc '^advance-be-redis'` → `15`
- **Suggested fix:**
  - Compare only the containers present in the baseline: assert their id/image/Up-state are unchanged and ignore new ones. Record a sha256 per line rather than the names themselves, or keep the raw fingerprint under `verify/tmp/` (ignored) and commit only hashes.
  - Remove C14 from learner-facing `check.sh`; it is a controller gate.
  - Assert "port 6380 not bound by an `advance-be-redis*` container" instead of "6380 empty", because the hub will legitimately own 6380.

## Finding 7: AC6 ("`check.sh` all ✔") cannot be true for the learner. Phase 09 stops the extra containers that C01–C06 require.
- **Severity:** Medium
- **Location:** `plan.md:121` (AC6), `phase-02-tests-first.md:45` (C01–C06 "containers exist"), `phase-09-docs-final-gate-handoff.md:35` (extras down), `phase-05-guide-shell-assembler.md:29` (learner prep runs `check.sh` right after `up main`)
- **Flaw:**
  - `check.sh` C01–C06 require the replica, cluster, evict, rdb and aof containers to exist with the expected flags. Phase 09 step 4 removes them, and the guide's first instruction is `00-containers.sh up main` followed by `check.sh`. So the learner's first check prints at least 5 ✘ and exits non-zero.
  - The phase 03 order also contradicts itself. `record-all.sh` runs `check` right after `up main` (step 4.1) and before `up evict/persist/replica/cluster` (step 4.4). So `check.after-seed` contains ✘ for C02–C06, while the gate says "all ✔".
  - On top of that, C14 (Finding 6) fails after Phase B.
- **Failure scenario:** On study day the learner's very first verification is red with no explanation, which damages trust in every later ✔. Phase 03's "check.sh all ✔ twice" gate either fails or is waved through.
- **Evidence:**
  - `phase-03-containers-experiments-runs.md:77` "`up main`, `00-seed`, `check` → `check.after-seed` …"
  - `phase-03-containers-experiments-runs.md:80` "`up evict`/`up persist`/`up replica`/`up cluster` just before their stage"
- **Suggested fix:** Make C02–C06 conditional ("absent = ⏸ not started yet; present with wrong flags = ✘"), and count only ✘ in the exit code. Alternatively, add a `check.sh --stage N` mode. Restate AC6 as "all ✔ for containers that are up".

## Finding 8: The verifier "keeps lesson-07 V01–V15 semantics", but those semantics are psql-specific. Unchanged, they reject valid redis-cli output; V16 is silently redefined.
- **Severity:** Medium
- **Location:** `phase-02-tests-first.md:36` ("keeps lesson-07 V01–V15 semantics"), `phase-02-tests-first.md:40` (V16 redefined as lint), `plan.md:119` (AC4), `plan.md:67-68` (R05 "MB/s computed", R06 "keys/s")
- **Flaw:**
  1. **V07 small numbers.** Lesson-07 V07 accepts a 1–2 digit `b.m` only if it is a standalone psql cell (`(^|\|)\s*v\s*(\||$)`). redis-cli prints `(integer) 31`, `(integer) 0` and `hot=212/300`. Every small Redis number fails: HINCRBY → 31, WAIT → 0, SADD → 0, HLEN 2, DEL → 1, lock token 1/2.
  2. **Date header.** V13 and merge-timeline parse `^-- chạy lúc`, but the new header is `# chạy lúc` (phase 02 step 2). merge-timeline also skips the psql lines `timing on`/`Timing is on.`.
  3. **V16.** Lesson-07 V16 is "numbers in QUIZ.why/EXAM must exist in a run". The plan reuses the code for `--lint`, so quiz and interview numbers lose their tracing without anyone deciding to drop it.
  4. **Computed values.** R05's MB/s and R06's keys/s are derived values that appear in no run. Inside `b.m` they fail V07. Outside `b.m` they are untraced, which contradicts AC4.
- **Failure scenario:** The phase 06 `--fragment` check is RED on correct fragments because of (1). Delegates work around it by removing `b.m` from small numbers, which weakens trace coverage. Quiz `why` texts can carry invented numbers because of (3).
- **Evidence:**
  - `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/verify-guide.mjs:80` (psql-cell regex)
  - Node probe of that exact regex on `"(integer) 31\n(integer) 0"` → `false`, `false`
  - `verify-guide.mjs:197` `^-- chạy lúc`
  - `verify-guide.mjs:184` (lesson-07 V16 = quiz/exam numbers)
  - `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/merge-timeline.mjs:14`
- **Suggested fix:**
  - Specify the Redis V07 small-number rule: the token must follow `(integer) `, sit inside `"…"`, or follow `=`/`:`.
  - Change the V13/merge header regex to `^# chạy lúc`.
  - Keep lesson-07 V16 under its code and give lint a new code (V17).
  - Have the runner emit derived values: a `#@ calc` line, or an awk line in `01-bench.sh` that prints `MB/s=…` and `keys/s=…`, so they become run tokens.

## Finding 9: Chips for slides 7 (Sentinel) and 8 (Cluster) are "OK" based on measurements that test neither Sentinel nor Cluster. Slide 8's evidence is also optional.
- **Severity:** Medium
- **Location:** `plan.md:97` (R35 "7 OK"), `plan.md:98` (R36 opt "8 OK"), `phase-03-containers-experiments-runs.md:71` ("Sentinel = diagram 'sơ đồ, chưa đo trên máy này'"), `phase-06-stage-fragments.md:44`
- **Flaw:**
  - **Slide 7** claims Sentinel monitors, discovers, elects a leader and fails over. No Sentinel is run. R35 is a plain master-replica partition with no failover. The plan's own label for Sentinel is "not measured on this machine", yet the chip says "Đúng trên Redis 7.2".
  - **Slide 8** claims Cluster "solves failover" and is "scalable for read and write". R36 is `REPLICAOF NO ONE` on a non-cluster pair, and it is optional. The single-node cluster container cannot show failover or scaling.
- **Failure scenario:** The `#ban-do-slide` map shows "Đúng trên Redis 7.2" for two slides the page admits were not measured. The phase 08 ultra review ("Redis 7.2 correctness per slide") flags it Important, which forces a chip change after `expected.tsv` was frozen. If R36 is skipped as optional, slide 8 has no basis at all.
- **Evidence:**
  - `Tài Liệu/advanced_backend/6. Redis.md:94-107` (slide 7: sentinel election and failover)
  - `Tài Liệu/advanced_backend/6. Redis.md:113-128` (slide 8: cluster failover and scaling)
  - `plan.md:98` marks R36 `(opt)`
- **Suggested fix:** Use a design-basis PART chip for slides 7 and 8 (basis: redis.io Sentinel/Cluster docs plus "data inconsistency" shown by R35/R36), matching how slides 4/5 are treated. Keep the "OK" chip for slide 6 (R34) and slide 9 (R37).

## Finding 10: The homework checks assume things they do not state. The bad fixture need not fail H1, and H5 needs undocumented hooks that break "any language works".
- **Severity:** Medium
- **Location:** `phase-04-widget-data-homework-driver.md:31,33,37,39,59`, `plan.md:109` (R47 "bad fixture ✘ on H1, H2")
- **Flaw:**
  - **H1** is "exactly 1 booking per round", but the booking is a single string key, `l06:hw:booking:FA634:A34_S012C`. When both bad-fixture requests win the GET-then-SET race, they both `SET` the same key and leave one key. H1 measured as key existence passes, so "✘ H1" is not guaranteed. Only H2, the log count, reliably catches the double booking.
  - **H5** "runs with `HW_TTL_MS=50` and a slow holder". This requires the learner's program to read `HW_TTL_MS` and to offer a "slow holder" mode. Neither is in the homework contract on line 31, which promises "Any language works" with just `HW_CMD`.
  - The phase 04 row says "(H5 ✘)" while R47 says only "✘ on H1, H2". The expectations differ between the plan and the phase.
- **Failure scenario:**
  - The bad-fixture run records ✔ H1, so R47 is RED or becomes a deviation.
  - A correct learner solution in another language, or one that hardcodes `PX 5000`, fails H5. The learner is then marked wrong for a contract he was never given.
- **Evidence:**
  - `phase-04-widget-data-homework-driver.md:31` (contract keys, "Any language works", only `HW_CMD`)
  - `phase-04-widget-data-homework-driver.md:37` (H5 needs `HW_TTL_MS` and a slow holder)
  - `phase-04-widget-data-homework-driver.md:59` vs `plan.md:109`
- **Suggested fix:**
  - Define H1 over the log: exactly one `BOOKED` per round, plus a per-round `l06:hw:booking` counter via `INCR`.
  - Put `HW_TTL_MS` and `HW_HOLD_MS` into the written homework contract, with a default that the check sets.
  - Freeze one expectation for the bad fixture ("✘ H1, H2, H5") in both `expected.tsv` and phase 04.

---

## Scope audit notes (acceptance criteria vs phases)
- **AC5:** Findings 1–4 and 10 each turn a matrix row into a near-certain deviation. AC5 is still met on paper, but slides 7, 8, 23, 26, 37, 38, 40 and 41 would lose their measured chips. Treat the deviation path as a fallback, not as the plan.
- **AC6 / AC11:** Both are unreachable as written (Findings 6 and 7).
- **Acceptance criterion 3:** V12 is extended to `.story`/`figure`/`table.stats`/`.check30` (phase 02 step 3). The "byte-exact `pre[data-cmd]`" and the "recorded run" per stage are not enforced per stage; they are only global (V05/V06).
- **Disclosure:** while checking for winpty I ran `git --version` (it reports the version only, no repo state). winpty exists at `/usr/bin/winpty`, so the plan's Git Bash fallback is real.

Status: DONE_WITH_CONCERNS
Summary: 10 findings (6 High, 4 Medium). The Redis 7.2.3 source breaks four matrix rows: eviction LRU with a 1 s clock and an oversized fill; SLOWLOG with UNLINK and SAVE under 10 ms; the replica reconnect assumption vs repl-timeout 60; and `redis-cli --eval` inside `.redis` sessions. The learner and gate assumptions also fail: Git Bash path conversion, a fingerprint broken by Phase B containers and exposing container names in a public repo, an unreachable "check.sh all ✔", and psql-specific verifier rules.
