---
phase: 2
title: "Tests first: check, expected matrix, runner, verifier, negative tests"
status: completed
priority: P1
effort: 1.75h
dependencies: [1]
---

# Phase 02 — Tests first

## Goal
Every checker exists and is RED for the right reason before any experiment, lab region or HTML exists.

## Files to create/modify (owner: controller)
Plan folder: copy from `plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/`, then adapt. The lesson-07 code is a starting point, not a contract: every rule listed below that differs from lesson 07 is new code. <!-- red-team #9 -->
- `verify/lab-text.mjs` (new; shared display rule)
- `verify/run-redis.mjs` (new; replaces `run-lab.sh`)
- `verify/merge-timeline.mjs` (adapted)
- `verify/verify-guide.mjs` (adapted)
- `verify/negative-tests.sh` (adapted; group switches are new code) <!-- red-team #9 -->
- `verify/widget-smoke.mjs` (adapted from the lesson-07 headless-Chrome script; created here because phase 06 uses it) <!-- red-team #9 -->
- `verify/rerun-gate.mjs` (new)
- `verify/expected.tsv`, `verify/deviations.md` (empty header)
- `verify/fixtures/` (tiny guide, lab, quiz and run for `--selftest`)

Labs: `D:/study/advance-be/labs/lesson-06-redis/check.sh`.

## Tasks and steps
1. `lab-text.mjs` exports `regionText(file, id)` and `displayText(file, id)`. `displayText` drops `#` lines for `.redis` and keeps `.sh`/`.lua`/`.ts` verbatim. It is imported by the runner, the assembler and the verifier, so there is one rule.
2. `run-redis.mjs`:
   - `node verify/run-redis.mjs <file> --region <id> [--out name]` opens one `docker exec -i <ct> redis-cli --no-raw` session (`<ct>` from `#@ ct`, default `advance-be-redis`, refuses any name not matching `^advance-be-redis(-[a-z]+)?$`).
   - One clock only: host milliseconds. Before command k it writes `ECHO "@@k <host-ms>"` (host send time), then the command, and it stamps each reply line with its host arrival ms. It honours `#@ sleep` by delaying stdin writes. Post-processing replaces each marker with `127.0.0.1:6379> <command k>` and keeps the stamps in the `.timeline.txt` only. There is no server-`TIME` mode. <!-- red-team #7 -->
   - `.sh` regions run with `bash -c "<region text>"` and each line is echoed as `$ <line>` with its host-ms. The runner does not export `MSYS_NO_PATHCONV` and removes it from the child env, so a recorded `.sh` run proves the line works exactly as the learner pastes it. Tool scripts run as `bash <file> <args>`. <!-- red-team #6 -->
   - For `.sh` lines that use the in-container Lua file, the runner also records `# lua <name>.lua sha256=<hash>` from `docker exec <ct> sha256sum /lab/lua/<name>.lua` in the run header (input to V18). <!-- red-team #1 -->
   - `--ab <A-file> <B-file> <region>` (files may be `.redis` or `.sh`). <!-- red-team #7 -->
     1. Run the scenario's `<region>-reset` region (single client) so every run starts from the same keys.
     2. Open both sessions and wait until each has echoed `@@0` (ready).
     3. B's first command is `BLPOP l06:barrier:<scenario> 5`. A's first command is `RPUSH l06:barrier:<scenario> go`. The `#@ sleep` steps count from the barrier release.
     4. Write `.A/.B/.timeline.txt` via `merge-timeline.mjs`, which orders events by host-ms only.
     `--rep N` runs the reset + pair N times. Run 1 goes to `runs/`; runs 2..N go to `verify/tmp/rep/<id>.repK.*` and are not in the manifest.
   - Header: `# chạy lúc dd/mm/yyyy HH:MM +0700 · Redis <redis_version from INFO> · <container>`.
   - Manifest: after writing a run file, the runner rewrites `runs/manifest.tsv` so it holds exactly one `sha256<TAB>path` line per run path (replace, never append). <!-- red-team #10 -->
3. `verify-guide.mjs`. Paths change to `labs/lesson-06-redis`, guide `lesson_06_redis_teacher_guide.html`, slides 1–46, keys `l06-`, V01 limit 340 KB. These rules are adapted or new: <!-- red-team #9 -->
   - V03 section list uses `driver-drill` in place of lesson 07's `prisma-drill`.
   - V05 compares `pre[data-cmd]` with `displayText`.
   - V07 small-number rule for redis-cli: a 1–2 digit `b.m` value must appear as `(integer) N`, as a quoted reply `"N"` (optionally after `k) `), or as an INFO/keyspace token `name:N` or `name=N`. Lesson 07's psql-cell rule is removed. A `b.m[data-derived="<name>"]` value is checked against `runs/data/derived.json` instead of a run.
   - V11 runs in guide mode and in `--fragment` mode (below).
   - V12 requires `.story`, a `figure`/`svg`, `table.stats`, `.check30`, `table.expect`, `.callout.challenge`, `.quiz` per stage.
   - V13 and `merge-timeline.mjs` parse the header `^# chạy lúc` instead of `^-- chạy lúc`.
   - V15 matches `requirepass|AUTH |redis://[^ ]*@`.
   - V16 keeps the lesson-07 meaning: every number with 4+ digits or a decimal point in `QUIZ.why` / `EXAM.a` must appear in some run.
   - V17 is the lab lint, run by the new `--lint` mode (lesson 07 had no `--lint`) over `labs/lesson-06-redis/`. A lab file fails when it has any of: <!-- red-team #5 --> <!-- red-team #6 --> <!-- red-team #12 --> <!-- red-team #15 -->
     - a non-`l06:` key in key position of known commands;
     - `6380` (except the single port-guard line in `00-containers.sh`, tagged `# guard-port`);
     - a destructive command (`FLUSHALL`, `FLUSHDB`, `REPLICAOF`, `CONFIG SET maxmemory*`, `docker kill|stop|restart|rm`, `docker network disconnect|connect`) in a region whose target is main: `#@ ct` absent or `advance-be-redis` in `.redis`, or a command line naming exactly `advance-be-redis` in `.sh` (the only exceptions are lines tagged `# guard-main` in the tool scripts `00-containers.sh` (`up main` recreate, `reset main`, the `up replica` network connect of main) and `99-cleanup.sh --all`);
     - a destructive `.sh` region whose first line is not `echo "→ <target>"`;
     - `CONFIG SET x` without a later `CONFIG SET x` in the same region;
     - `DEBUG SET-ACTIVE-EXPIRE 0` without a later `DEBUG SET-ACTIVE-EXPIRE 1` in the same region;
     - the word `prune` (`docker volume|system|network|container prune`) anywhere in `labs/` or `verify/` (negative case p builds its planted line from parts, `'pr''une'`, so the lint source stays clean);
     - `-p 6379:` without `127.0.0.1:`, or `localhost` in a host-side client URL;
     - in a region `.sh` file, a `docker exec` line with an argument that starts with `/` and has no `MSYS_NO_PATHCONV=1 ` prefix and is not `//`-escaped; a tool script without `export MSYS_NO_PATHCONV=1` and the `HERE=` line;
     - a `.redis` file that contains the redis-cli eval-file flag or `<now>`;
     - container names outside the guard.
   - V18 (in `--runs`): every `# lua <name>.lua sha256=` header line equals the sha256 of `labs/lesson-06-redis/lua/<name>.lua`. <!-- red-team #1 -->
   - V19 (guide and `--fragment`): every `innerHTML` template interpolation `${…}` in `assembly/widgets/*.js` is wrapped in `esc(` or is a numeric expression (`Number(`, `.toFixed(`). <!-- red-team #15 -->
   - M01 in `--runs`: for every path in `runs/manifest.tsv`, the sha256 of the current file equals its single manifest line, and every run file has exactly one line. <!-- red-team #10 -->
   - D01 in `--runs`: every `deviation` row has a `deviations.md` entry.
   - `--fragment <stage-0N.html>` also loads the sibling `stage-0N.quiz.json` and applies V11 (4 items, `ans` 0–3, 4 options) plus "every `why` cites a run id" (`/\b\d{2}-[a-z-]+\.[a-z0-9-]+/`). <!-- red-team #9 -->
   - `--data` checks `runs/data/wN.json` (each number is a token in a `sources` run) and `runs/data/derived.json`. Each derived entry is `{name, value, formula, inputs, sources}`; `--data` reads `inputs` as tokens from `sources` and recomputes `formula` (e.g. MB/s = req/s × bytes / 1048576, keys/s = req/s × 10) to the stated precision. <!-- red-team #9 -->
   - `--selftest` adds redis-cli fixtures: `(integer) 0` claimed `0` passes; `(integer) 7` claimed `9` fails V07; a quiz `why` without a run id fails V11.
4. `expected.tsv`: columns `id run slides regex claim chip status`. One run id per row, so R01, R09, R10, R16, R30, R31, R44, R47 and R48 are split into `a`/`b` rows. A row with a chip names exactly one slide, and each chip slide has exactly one chip row; other rows citing that slide carry `–`. Design rows `D04`, `D05`, `D42` (`run` = `-`) hold the chips for slides 4, 5, 42; V04 reads them and `--runs` skips them. Slide 43's chip is on run row R47a. That gives 57 run rows and 3 design rows, all `expect`. Regexes assert shape or relation; relations such as "≥ 5×" are computed by small named predicates in the verifier (`ratio(a,b)>=5`) rather than regex. <!-- red-team #9 -->
5. `check.sh` (learner-facing; checks lab invariants only, reads nothing under `plans/`). For each row it prints `✔|✘|– Cnn mô tả · chi tiết`. `–` means "optional container not started", is not an error, and is not counted. Exit code = number of ✘. <!-- red-team #5 -->
   - C01: main `advance-be-redis` exists, image `redis:7.2.3`, `redis_version:7.2.3`, expected flags, network `advance-be-l06`, `/lab` mount from this `labs/lesson-06-redis` dir. Missing main is ✘. <!-- red-team #15 -->
   - C02–C06: replica, cluster, evict, rdb, aof. Absent → `–`; present with wrong image/flags/network → ✘; present and correct → ✔.
   - C07: no key on main outside `l06:` (`--scan`). On ✘ it prints the foreign prefixes with counts (for example `imdb:* 12`, `lock:* 1`, written by lesson 02 lab 06) and the scoped fix `docker exec advance-be-redis redis-cli --scan --pattern 'imdb:*'` piped to `UNLINK`. It never suggests `FLUSHALL`. <!-- red-team #15 -->
   - C08–C10: seed counts and encodings (user hash listpack, cart 3 fields, board 5 members).
   - C11: main config defaults (`maxmemory 0`, `noeviction`, `lazyfree-lazy-user-del no`, `slowlog-log-slower-than 10000`, `latency-monitor-threshold 0`, `appendonly no`).
   - C12: active expiry on (a PX 50 key is gone from `INFO keyspace` within 1 s).
   - C13: no `l06:lock:*` and no `l06:barrier:*` left.
   - C14: main publishes only `127.0.0.1:6379` (`docker port advance-be-redis`), and no other `advance-be-redis*` container publishes a port. <!-- red-team #5 -->
   - C15: `run_id` from `docker exec advance-be-redis redis-cli INFO server` equals `run_id` from a host TCP `INFO server` to `127.0.0.1:6379` (node one-liner). This proves DBX and the homework reach the lab container. <!-- red-team #5 -->
   - There is no fingerprint row; the fingerprint is a controller gate (`verify/fingerprint.sh --compare`). <!-- red-team #5 -->
6. `negative-tests.sh` cases, each expecting its code. Group switches `--labs-only`, `--data-only` and `--guide-only` are new code; with no switch it runs all groups. <!-- red-team #9 -->
   - Guide group (`--guide-only`, needs a built guide):
     - a: one char changed in a `pre[data-cmd]` → V05;
     - b: a `b.m` number not in its run → V07;
     - c: storage key `l07-` → V09;
     - d: slide 21 removed from SLIDES → V04;
     - e: slide 40 chip changed → V04;
     - f: external script → V10;
     - q: `innerHTML = \`${row.cmd}\`` without `esc(` in a widget copy → V19; <!-- red-team #15 -->
     - s: a quiz `why` without a run id in a fragment copy → V11. <!-- red-team #9 -->
   - Labs/runs group (`--labs-only`, on copies under `verify/tmp/neg/`):
     - g: corrupted R16a run → R16a;
     - h: run edited by hand → M01;
     - j: `SET foo 1` added to a lab copy → V17;
     - k: `6380` added to a lab copy → V17;
     - l: `CONFIG SET maxmemory 1mb` without restore → V17;
     - m: a `deviation` row with no deviations entry → D01;
     - n: `DEBUG SET-ACTIVE-EXPIRE 0` with no restore → V17; <!-- red-team #15 -->
     - o: `docker kill advance-be-redis` (main) in a region copy → V17; <!-- red-team #12 -->
     - p: `docker volume prune -f` in a lab copy → V17; <!-- red-team #5 -->
     - r: one byte changed in a `lua/*.lua` copy against its recorded hash → V18. <!-- red-team #1 -->
   - Data group (`--data-only`):
     - i: fake number in `w4.json` → `--data`.
   Total 19 cases. Guide-group cases run once a guide exists (stub build from phase 05, full build in phase 07). A case whose target does not exist yet (no `pre[data-cmd]`, widget or fragment in a stub build) prints SKIP and does not count; the full run in phase 07 must have 0 SKIP.
7. `rerun-gate.mjs` runs each single-client region twice in one session. It compares semantic result lines, not only error counts. A semantic line is every reply line except host-ms stamps and the numeric values inside `INFO`, `MEMORY STATS`, `SLOWLOG`, `LATENCY` and `redis-benchmark` output. Pass 1 and pass 2 must be identical after that masking. For two-client runs it compares the semantic lines of `verify/tmp/rep/*.repK.timeline.txt` with run 1 in the same way. <!-- red-team #7 -->
8. `widget-smoke.mjs` keeps lesson 07's headless-Chrome flow and adds `--guide <path>` (default the lesson-06 guide). It clicks every widget, one quiz item and the theme toggle, and fails on exceptions or empty widgets. For W6 it types every key from `runs/07-cluster.keyslot.txt` into the slot calculator and compares the shown slot with the recorded `CLUSTER KEYSLOT` value. <!-- red-team #9 -->

## Test matrix
| Test | Expected now | Command |
|---|---|---|
| verifier self-test on fixtures | GREEN (V05, V07 redis-cli cells, V11 quiz-why catch the planted faults) | `node verify/verify-guide.mjs --selftest` |
| runs mode before experiments | RED, "missing run" × 57 rows | `node verify/verify-guide.mjs --runs` |
| lint before labs exist | RED "labs dir missing" (not crash) | `node verify/verify-guide.mjs --lint` |
| check before setup | C01 ✘, C02–C06 `–`, no shell error | `bash labs/lesson-06-redis/check.sh; echo rc=$?` |
| runner name guard | refuses `quan-ly-hop-dong-postgres-1` with exit 2 | `node verify/run-redis.mjs verify/fixtures/x.redis --region a --ct quan-ly-hop-dong-postgres-1` |
| runner on fixture | file + one manifest line written | `node verify/run-redis.mjs verify/fixtures/x.redis --region a` |
| manifest replace | run the fixture twice → still one line for that path | `grep -c 'x.a.txt' runs/manifest.tsv` → 1 <!-- red-team #10 --> |
| runner env | `.sh` fixture line `echo /lab` prints `D:/…` (mangled) when not prefixed | `node verify/run-redis.mjs verify/fixtures/p.sh --region a` <!-- red-team #6 --> |
| widget-smoke exists | `--help` prints usage | `node verify/widget-smoke.mjs --help` |

## Verification
The commands above, plus `node --check` on every `.mjs`. Remove the fixture runs and their manifest lines afterwards.

## Risks and rollback
Adapting rather than rewriting keeps lesson-07 behaviour where it still fits. If stdin pacing misbehaves, the fallback is one `redis-cli` call per step for A/B files only. No A/B scenario needs `MULTI`/`WATCH` state. Rollback: delete `verify/` files.
