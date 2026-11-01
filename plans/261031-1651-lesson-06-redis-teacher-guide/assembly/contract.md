# Frozen contract — Lesson 06 Redis guide (v1.2, 2026-11-01)

Parallel work (phases 03–06) depends on these names. A change bumps the version and re-checks every fragment, widget and run that uses the changed name. Where this file and `plan.md` disagree, `plan.md` (Materialization must-fix, Red Team Review, controller resolution) wins and this file is corrected.

## 1. Key registry (every key starts `l06:`)

| Prefix | Owner | Container |
|---|---|---|
| `l06:user:*` (`l06:user:1` hash 4 fields, `l06:user:1:json` 51-char JSON) | seed, stage 2 | main |
| `l06:cart:*` (`l06:cart:u1` seed, 3 fields) | seed, stage 5 | main |
| `l06:followers:*` (`a`, `b`) | seed, stage 5 | main |
| `l06:board:*` (`l06:board:bestseller`, 5 F&B items) | seed, stage 5 | main |
| `l06:enc:*` | stage 2 encoding thresholds | main |
| `l06:q:*` (`l06:q:orders`, `l06:q:processing`) | stage 5 | main |
| `l06:cnt:*` | stage 5 counter race | main |
| `l06:delay:*` (`l06:delay:orders`, `l06:delay:done`) | stage 6 | main |
| `l06:big:*` (`l06:big:h`, `l06:big:h2`) | stage 6 | main |
| `l06:exp:*` (incl. `l06:exp:c12` written by `check.sh` C12 in logical db 15, PX 50) | stage 3, check | main |
| `l06:ev:{hot,cold,ttl,over}:*` | stage 3 eviction | `advance-be-redis-evict` |
| `l06:p:*` | stage 4 persistence | `advance-be-redis-rdb`, `advance-be-redis-aof` |
| `l06:rep:*` | stage 7 replica | main + `advance-be-redis-replica` |
| `l06:{34}:*`, `l06:slot:*`, `l06:a`, `l06:b` | stage 7 cluster | `advance-be-redis-cluster` |
| `l06:lock:*` | stage 8, homework | main |
| `l06:fence:*` | stage 8 | main |
| `l06:seat:*` | stage 8, homework | main |
| `l06:tb:*` | stage 9 token bucket | main |
| `l06:idem:*` | stage 9 idempotency | main |
| `l06:bench:*` | stage 1 benchmark | main |
| `l06:barrier:*` | two-client start barrier (`l06:barrier:<scenario>`) | main (or the scenario's container) |
| `l06:hw:*` | homework (`l06:hw:bookings:FA634`, …) | main |
| `l06:my:*` | learner's own experiments | main |

Neither `00-seed.redis` nor `99-cleanup.sh` ever removes `l06:my:*` or `l06:hw:*`. Values written by labs are ASCII (S4: `redis-cli --no-raw` escapes UTF-8 bytes); Vietnamese only in comments and guide prose.

Containers: all `redis:7.2.3`, names match `^advance-be-redis(-[a-z]+)?$`. Main `advance-be-redis` publishes `127.0.0.1:6379:6379` only; extras publish nothing. Port 6380 is never used (OmniPOS hub, NFR-05). Network `advance-be-l06`. Full table in phase 03 "Container lifecycle".

## 2. File formats (`labs/lesson-06-redis/`)

### `.redis` (redis-cli input)
- Region: `# #region <id> · <tiêu đề> (slide N)` … `# #endregion`. Region ids are lowercase kebab, unique per file stem across `.redis` and `.sh` (`01-bench.sh#threads` and `01-why-fast.redis#threads` are different stems, so both are fine).
- Comment lines start with `#` (Vietnamese, plain). Runner directives: `#@ sleep <s>` (delay before the next command) and `#@ ct <container>` (target container, default main).
- One command per line. No non-ASCII outside comments.
- Never contains redis-cli flags (no `--eval`) or placeholders such as `<now>`. Lua runs live in `.sh` regions.
- The last region of each stage file is `kiem-chung`: plain read commands only (`EXISTS`, `TTL`, `OBJECT ENCODING`, `HGET`, `ZSCORE`, `LLEN`, `GET`, `INFO keyspace`, …). No Lua checker, no PASS/FAIL strings. The fragment shows the same commands next to a `table.expect` (Lệnh / Giá trị mong đợi / Ý nghĩa) whose values come from the recorded run.
- Lua appears only in stages 6 (delay claim), 8 (lock release, fencing) and 9 (token bucket, idempotency), plus the stage-1 optional busy loop region `01-block#busy` (inside a fold "xem trước Lua — học kỹ ở chặng 8"). Data builders elsewhere use `.sh` lines `seq … | awk '{print "…"}' | docker exec -i advance-be-redis redis-cli` (plain commands; `--pipe` only where the region is not a timed measurement).

### `.sh`
- Tool scripts run whole: `00-containers.sh`, `check.sh`, `99-cleanup.sh`, `hw-check.sh`. Line 2 is `export MSYS_NO_PATHCONV=1`. Paths resolve from the script's own dir with `HERE="$(cd "$(dirname "$0")" && pwd -W)"`, never from the caller's cwd.
- Region files the learner pastes line by line: `01-bench.sh`, `02-encodings.sh` (thresholds), `03-expiry.sh` (fills, if needed), `03-eviction.sh`, `04-persistence.sh`, `06-practices.sh`, `07-architecture.sh`, `09-bridge.sh`, and the Lua A/B files `06-delay-lua.{A,B}.sh`, `08-lock-lua.{A,B}.sh`, `09-bucket-lua.{A,B}.sh`. Same region markers; each region has a `set -u` line. One complete command per line (no heredoc, no multi-line `if`/`for`).
- Every `docker exec` line that passes an absolute in-container path starts with `MSYS_NO_PATHCONV=1 ` (or writes the path as `//path`), so what the learner pastes is exactly what the runner ran (S7: Git Bash turns `/lab/x` into `D:/Git/lab/x`). A path inside `sh -c '…'` is not rewritten and needs no prefix.
- Lua run line: `MSYS_NO_PATHCONV=1 docker exec <ct> redis-cli --eval /lab/lua/<name>.lua <keys> , <args>`. The script is read from the read-only `/lab` mount, so the text that runs is the `.lua` file. "Now" is always `redis.call('TIME')` inside Lua.
- Destructive commands (`FLUSHALL`, `FLUSHDB`, `REPLICAOF`, `CONFIG SET maxmemory*`, `docker kill|stop|restart|rm`, `docker network disconnect|connect`) appear only in regions whose target is an extra container. Such a region's first command line is `echo "→ advance-be-redis-<x>"`, and every command names that container explicitly. Exceptions are only lines tagged `# guard-main` in `00-containers.sh` (`up main` recreate, `reset main`, network connect of main in `up replica`) and `99-cleanup.sh --all`.
- Every `CONFIG SET x` in a region is followed by a restoring `CONFIG SET x` in the same region; `DEBUG SET-ACTIVE-EXPIRE 0` is followed by `DEBUG SET-ACTIVE-EXPIRE 1` in the same region.
- No `prune` of any kind. Host clients use `127.0.0.1`, never `localhost` (controller-facts-addendum item 4).

### `.lua`, `.ts`, `.mjs`
Shown verbatim (`displayText` keeps every line). `lua/*.lua` reach keys only through `KEYS[...]`.

### Display rule (single source: `verify/lab-text.mjs`)
`displayText(file, id)` drops every line starting with `#` for `.redis` (comments, region markers, `#@` directives) and keeps `.sh`/`.lua`/`.ts` verbatim. The runner, the assembler and the verifier all import it.

## 3. Run ids and run files

- Single client: `runs/<stem>.<region>.txt` (`<stem>` = file name without extension). Whole-file or tool-script run: `runs/<stem>.txt` or the `--out` name (`check.after-seed`, `check.rerun`, `hw-check.solution`, `hw-check.bad`).
- Two clients: `<stem>` drops the `.A`/`.B` part (`06-delay-lua.A.sh` → `06-delay-lua`); files `runs/<stem>.<region>.A.txt`, `.B.txt`, `.timeline.txt`. Repetitions 2–3 go to `verify/tmp/rep/<stem>.<region>.repK.{A,B,timeline}.txt` and are never in `runs/` or the manifest.
- Header (line 1 of every runner file): `# chạy lúc dd/mm/yyyy HH:MM +0700 · Redis <redis_version> · <container>`. Lua runs add one line per Lua file used: `# lua <name>.lua sha256=<64 hex>` (from `sha256sum /lab/lua/<name>.lua` inside the container; checked by V18).
- `.redis` body: each command as `127.0.0.1:6379> <command>`, followed by its `--no-raw` reply lines (`OK`, `"v"`, `(integer) n`, `(nil)`, `1) "a"`, `(error) …`).
- `.sh` body: each line as `$ <line>`, followed by its stdout+stderr. `redis-cli` called with arguments from `docker exec` (no TTY) prints raw replies (`OK`, `v`, `n`, empty line for nil). Carriage-return progress (redis-benchmark) keeps only the last segment of each line.
- Timeline body (`merge-timeline.mjs`): one event per line, ordered by host ms only, `+<ms> <A|B> > <command>` for a send (`.sh` sends keep their `$ ` prefix) and `+<ms> <A|B> < <reply line>` for each reply line, `<ms>` = host ms since the first event of the pair, right-aligned to 6 chars. The send time is the moment the runner wrote the command (`.redis`) or bash reached the line (`.sh`); there is no server-`TIME` mode.
- Two-client start: the runner runs `<region>-reset` (from the A file) first, then starts B, whose first command is `BLPOP l06:barrier:<scenario> 5`; once Redis shows B blocked it starts A, whose first command is `RPUSH l06:barrier:<scenario> go`. `#@ sleep`/`sleep` steps count from the barrier release.
- Guide attributes: `data-cmd="<file with extension>#<region>"` (or `data-cmd="lua/<name>.lua"` for a whole file), `data-run="<stem>.<region>[.timeline|.A|.B]"`, widget data `<script type="application/json" id="run-w1…w9">` = `runs/data/wN.json` (each with `sources: [run ids]`), derived values `b.m[data-derived="<name>"]` from `runs/data/derived.json` entries `{name, value, formula, inputs, sources}`.
- `b.m` values are copied exactly as they appear in the run (no reformatting, no thousands separators added).
- `runs/manifest.tsv` holds exactly one line `sha256<TAB><file name relative to runs/>` per run file; the runner replaces that line on every write (never appends a duplicate). Files written by other controller tools (fingerprint, smoke) are registered with `node verify/run-redis.mjs --register <file>`.

## 4. Fragment format and CSS vocabulary

Fragment format: `phase-06-stage-fragments.md` § "Fragment format (frozen)". CSS: the lesson-07 classes plus `.story`, `.check30`, `table.stats`, `table.expect`, `.sayvs`, `.lanes`, `.slotcalc`, `.bucket`, `.callout.challenge` (class string exactly `callout challenge`).

Widget rule: every run- or data-derived string reaches the DOM through `textContent` or through the single `esc()` defined in `shell-tail.html`. A `${…}` inside an `innerHTML` template must be wrapped in `esc(…)`, or be a number produced by `Number(...)`/`.toFixed(...)` (V19).

Widget ids: `<div class="widget" id="wN">` with a `.widget-body` (v1.1: never a nested `section`, because it breaks V12 stage scanning); inner ids prefixed `wN-`. W6 (slot calculator) exposes `<input id="w6-key">` and `<output id="w6-slot">`; the output shows the decimal slot and updates on the `input` event (widget-smoke types each recorded key from `runs/07-cluster.keyslot.txt` and compares).

Storage keys: `l06-c<N>-<slug>`, `l06-theme`, `l06-warmup`, `l06-hw-*`, `l06-drill-*`.

Sections (V03): `#cach-hoc`, `#chang-1` … `#chang-9`, `#bai-tap`, `#driver-drill`, `#phong-van`, `#cheat-sheet`, `#ban-do-slide`, `#tham-khao`, `#tiep-theo`.

## 5. Learner workflow (decided by `runs/run-method-smoke.txt`)

- Primary: interactive `redis-cli` inside the container, paste a whole block. PowerShell / Windows Terminal: `docker exec -it advance-be-redis redis-cli`. Git Bash (mintty): `winpty docker exec -it advance-be-redis redis-cli` (S6 could not be tested headless; both forms are shown).
- Long blocks (fallback): `grep -v '^#' labs/lesson-06-redis/<file> | docker exec -i advance-be-redis redis-cli` (S3: `#` lines would be sent as commands).
- `.sh` regions: paste line by line in Git Bash (lines already carry `MSYS_NO_PATHCONV=1 ` where needed, S7).
- DBX (`ADVANCE_BE_REDIS`, host `127.0.0.1`): browse keys (type, TTL, memory) and send single commands only. S5 was not verified in the build session, so DBX is not offered for multi-line snippets.
- Two-client steps: two terminal tabs, A and B. Order: run the reset region, start B (it waits on the barrier), then start A.
- Every host-side client (DBX, homework, driver drill) uses `127.0.0.1:6379`, because the container is published on `127.0.0.1` only and Windows may resolve `localhost` to `::1` first.

## 6. Slides → stage → chip → chip row → anchor (frozen, equals `verify/expected.tsv`)

Chips: OK = `Đúng trên Redis 7.2`, PART = `Đúng một phần`, FIX = `Cần sửa`, – = null chip. Every PART and FIX slide needs `id="sl-NN"` (two digits) in its stage fragment.

| Slide | Title (Trang N) | Stage | Chip | Chip row | Anchor |
|---|---|---|---|---|---|
| 1 | Redis | cach-hoc | – | – | – |
| 2 | Outline | cach-hoc | – | – | – |
| 3 | 1. Introduction | cach-hoc | – | – | – |
| 4 | 1.1 Definition | 1 | OK | D04 | – |
| 5 | 1.2 Redis vs Memcached | 1 | PART | D05 | `id="sl-05"` |
| 6 | 1.3.1 Master-Slave | 7 | OK | R34 | – |
| 7 | 1.3.2 Sentinel | 7 | PART ("chưa đo trực tiếp") | R35 | `id="sl-07"` |
| 8 | 1.3.3 Cluster | 7 | PART ("chưa đo trực tiếp") | R36 | `id="sl-08"` |
| 9 | 1.3.3 Cluster (hash slots) | 7 | OK | R37 | – |
| 10 | 2. How Redis Works? | 1 | – | – | – |
| 11 | 2.1 Why is Redis So Fast? | 1 | – | – | – |
| 12 | 2.1.1 Redis Bottleneck | 1 | PART | R04 | `id="sl-12"` |
| 13 | 2.1.2 Why is Redis So Fast? | 1 | OK | R01a | – |
| 14 | 2.1.3 Note (I/O threads) | 1 | PART | R01b | `id="sl-14"` |
| 15 | 2.2 How Redis Store Data? | 2 | – | – | – |
| 16 | 2.2 Dictionary | 2 | OK | R09a | – |
| 17 | 2.3 Expired Deletion | 3 | – | – | – |
| 18 | 2.3.1 Expire dictionary | 3 | OK | R14 | – |
| 19 | 2.3.2 Passive deletion | 3 | PART | R15 | `id="sl-19"` |
| 20 | 2.3.2 Active deletion | 3 | PART | R16a | `id="sl-20"` |
| 21 | 2.3.2 Combined + ZSET idea | 3 | FIX | R16b | `id="sl-21"` |
| 22 | Memory full? | 3 | – | – | – |
| 23 | 2.4 Memory Eviction | 3 | PART | R17 | `id="sl-23"` |
| 24 | 2.4 Data Persistence | 4 | – | – | – |
| 25 | 2.4.1 AOF | 4 | PART | R23 | `id="sl-25"` |
| 26 | 2.4.2 RDB | 4 | OK | R22 | – |
| 27 | 2.4.3 Hybrid | 4 | PART | R24 | `id="sl-27"` |
| 28 | 3. In Practices | 5 | – | – | – |
| 29 | 3.1 Data Structures | 2 | – | – | – |
| 30 | 3.0 Question (Hash vs JSON) | 2 | PART | R11 | `id="sl-30"` |
| 31 | 3.1.1 String | 2 | OK | R08 | – |
| 32 | 3.1.2 List | 5 | PART | R25 | `id="sl-32"` |
| 33 | 3.1.3 Hash | 5 | PART | R09b | `id="sl-33"` |
| 34 | 3.1.4 Set | 5 | PART | R10a | `id="sl-34"` |
| 35 | 3.1.5 Sorted Set | 5 | PART | R10b | `id="sl-35"` |
| 36 | 3.2 Practices | 6 | – | – | – |
| 37 | 3.2.1 Delay task | 6 | OK | R31b | – |
| 38 | 3.2.2 Big keys | 6 | OK | R32 | – |
| 39 | 3.2.3 Keys on one node (hashtag) | 7 | OK | R38 | – |
| 40 | 3.2.4 Distributed locks | 8 | FIX | R39 | `id="sl-40"` |
| 41 | 3.2.5 Best Practices | 9 | OK | R44b | – |
| 42 | Recap | wrap (shell) | PART | D42 | `id="sl-42"` |
| 43 | Homework | `#bai-tap` (shell) | OK | R47a | – |
| 44 | References | `#tham-khao` (shell) | – | – | – |
| 45 | Thank you | `#tiep-theo` (shell) | – | – | – |
| 46 | Thank you | `#tiep-theo` (shell) | – | – | – |

Null-chip slides (15): 1, 2, 3, 10, 11, 15, 17, 22, 24, 28, 29, 36, 44, 45, 46. Chip slides (31): 4, 5, 6, 7, 8, 9, 12, 13, 14, 16, 18, 19, 20, 21, 23, 25, 26, 27, 30, 31, 32, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43. Slides 33–35 are taught in stage 5 but their chip rows cite the stage-2 encoding runs.

## Changelog
- v1.1 (2026-11-01, controller): widget wrapper is `div.widget#wN`, not `section`. Guide size budget is 520 KB (V01); see plan.md Validation Log.
- v1.2 (2026-11-01, ultra-review fixes): `check.sh` C12 probes active expiry in logical db 15 (U23). Stage 8 fencing acquires the lock and the token in one script `lua/lock-acquire-fenced.lua` (KEYS lock, fence counter; ARGV token, ttl ms) and `fenced-write.lua` accepts only a strictly larger token (U02, U11); row R43 follows. New run `hw-check.bad-del` (row R47c) for the second bad homework fixture `verify/hw-bad-del-fixture.mjs` (U01). Verifier codes V20 (sed-printed regions) and V21 (form labels) added.
