# Cook report — phases 03 and 04 (2026-11-01, Asia/Saigon)

Both phase gates pass. `phase-03-containers-experiments-runs.md` and `phase-04-widget-data-homework-driver.md` are set to `status: completed`, and `ak plan status` reports 5/9. Two rows are logged as deviations (R03, R35); in both, Redis behaves as the claim says and only the line shape of the recording differs. Only `advance-be-redis` is running at the end, seeded, published on `127.0.0.1:6379` only. No git command other than `git status` was run.

## Gate results (final, 10:45)

| Gate | Command | Result |
|---|---|---|
| check twice, identical | seed → `bash labs/lesson-06-redis/check.sh` ×2, `diff` | rc 0 both, IDENTICAL; C01, C07–C15 ✔, C02–C06 `–` (extras down). Recorded `check.after-seed` = `check.rerun` body |
| matrix | `node verify/verify-guide.mjs --runs` | GREEN: 57 run rows incl. M01 (100 run files = 100 manifest lines), D01, V18 (5 Lua hashes) |
| lab lint | `--lint` (V17) | GREEN |
| widget data | `--data` | GREEN (w1–w9, `derived.json` 8 entries) |
| selftest | `--selftest` | GREEN |
| lab/data negatives | `negative-tests.sh --labs-only` / `--data-only` | 10/10 RED, 0 SKIP / 1/1 RED |
| rerun gate | `node verify/rerun-gate.mjs` (full) then `--only` for 2 files | full: 73/75; the 2 misses root-caused (below), reruns 3/3 and 2/2 ✔; earlier full pass had every A/B rep ✔ |
| homework | `hw-check.sh` solution / bad fixture | ✔ H1–H5 (10 rounds + round 11) / ✘ H1 H2 H5, ✔ H3 H4; `--cleanup` → 0 `l06:hw:*` |
| driver claims | `grep -c '^https' runs/driver-claims.txt` | 18 URLs for 11 API claims (each claim has URL + version + quote) + 7 behaviour claims → run ids |
| fingerprint | `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt` | `✔ fingerprint khớp baseline`, rc 0 |
| binding/identity | `docker port advance-be-redis`, C14/C15 | `6379/tcp -> 127.0.0.1:6379`, run_id match `07ae7fa0…` |

Rerun-gate misses (environment, not lab semantics):
- `06-practices.sh#lazyfree` pass 2: `SLOWLOG GET 1` returned `REPLCONF`. With the stage-7 replica up and threshold 0 µs, the master also logs the replica's once-a-second `REPLCONF ACK`. The recorded runs were made in stage 6, before the replica existed. A learner note was added to the region, and with the replica stopped the file reruns 3/3 ✔.
- `09-bridge.sh#idempotency`: `TTL` printed **86401** on a key set with 86400 s. That is only possible if the server's wall clock stepped back (see the clock fact below). It reruns 2/2 ✔.

## Main recreate

`00-containers.sh up main` found drift: no debug flag, no network, no `/lab` mount, anonymous `/data`. It recreated main with network `advance-be-l06`, `-p 127.0.0.1:6379:6379`, a read-only bind of `labs/lesson-06-redis` at `/lab`, and named volume `advance-be-redis-data`. It printed C14 ✔ and C15 ✔, and a second `up main` reported "đã đúng bảng". The stray key `l06:smoke` was dropped by the recreate.

## Deviations (`verify/deviations.md`, rows set to `deviation` in `expected.tsv`)

| Row | Why | Chip / narrative |
|---|---|---|
| R03 (opt busy) | During a busy script Redis answers the runner's `ECHO` markers with BUSY, so a `.redis` B session hangs (first try: 180 s timeout). B moved to `01-block.B.sh#busy` (controller approved), so the send line is `B > $ docker exec … --no-raw SCRIPT KILL`. Host b−a = 4619 ms < 5000, because the container clock ran fast (redis-cli inside timed the EVAL at 5.20–5.79 s against ≤ 4.82 s on the host). | No chip. Guide says "≈ 5 s" and shows B from `01-block.B.sh#busy` |
| R35 | `WAIT` counts only the calling connection's writes. With SET and WAIT as separate `docker exec` calls, `WAIT 1 500` returned `1` while the replica was cut off. They now share one connection (`printf 'SET …\nWAIT 1 500\n' \| docker exec -i …`) → `0`; the next line shows the trap (fresh-connection WAIT → `1`). Only the line shape misses the regex. | PART unchanged; narrative adds "WAIT is per connection" |

## Lab-file fixes made from measurements (no deviation needed)

- Eviction regions add `CONFIG RESETSTAT`, because `evicted_keys` survives `FLUSHALL`.
- `latest_fork_usec` is read from `INFO stats` and `lazyfreed_objects` from `INFO memory` (Redis 7.2.3).
- The AOF header is printed via `tr "\r\n" "  "` (`*2  $`).
- `05-queue` A waits 0.3 s before its own BRPOP, so B's reply always precedes it.
- Lock margins widened, approved by the controller: B acquires at +2.8 s, A works 3.3 s (ttldel) and 3.5 s (cad), fencing A works 4 s. R39–R43 predicates still hold (ttldel b−a = 2800, d−a = 3313).
- node-redis is pinned to `6.3.0`, because `^6.3.0` resolved to 6.3.1 while lesson 02's lockfile names 6.3.0.

## Machine fact: Docker VM clock vs Windows host

These numbers were measured with `redis-cli TIME` against node `Date.now()`; they are not in any recorded run.
- 09:43: container − host offset −2801 ms; rate 1.026 over 20 s.
- 10:31: offset −791 ms; rate 1.0832 and 1.0838 over two 10 s windows.

The VM clock runs fast and is stepped back periodically. Redis expiry uses wall time, so a step lengthens live TTLs. That explains tokA still being alive at +2.5 s in 2 of 6 ttldel reps before the margins were widened, and `TTL` 86401 > 86400. The controller added this as addendum item 6, and stage 8 narrates it as evidence for the Redlock critique.

## Key measured numbers (recorded runs, machine-dependent)

| Stage | Run id | Numbers |
|---|---|---|
| 1 | 01-why-fast.threads / 01-bench.threads | `multiplexing_api:epoll`, `io_threads_active:0`, io-threads 1; 5 threads (redis-server, bio_close_file, bio_aof, bio_lazy_free, jemalloc_bg_thd) |
| 1 | 01-block.sleep.timeline | A DEBUG SLEEP 2 sent +213 ms, B PING +716 ms, PONG +2215 ms |
| 1 | 01-why-fast.slowlog | DEBUG SLEEP 0.5 = 500094 µs; LATENCY command 500 ms |
| 1 | 01-bench.pipeline / size / mget | GET -P 1 166944.92, -P 16 2083333.38 req/s (×12.5); 16 B 169491.53 vs 100 KB 37807.18 req/s (3692.1 MB/s); -c 1 GET 21953.90 vs MGET×10 20576.13 req/s (×9.4 keys/s) |
| 2 | 02-encodings.* | embstr 44 B (104 B mem) → raw 45 B (112 B); hash 512/513 listpack→hashtable (6200 → 28824 B), value 64/65 (136 → 256 B); intset 512/513, set 128/129, zset 128/129→skiplist, list 10 listpack / 3000 quicklist; user hash 112 B vs JSON 120 B |
| 2 | 02-json-race.lost.timeline | final JSON age 30 (A's 31 lost); hash variant HMGET → 31 + new email |
| 3 | 03-expiry.passive / active | passive: expires=1000 kept, expired_keys 4 → 5 after one GET; active: 10000 keys gone in 3 s (expired_keys 1004 → 11004), stale 3.40 %, cycle CPU 24 ms |
| 3 | 03-eviction.* (MAX = BASE + 2097152) | noeviction: OOM, hot 300/300 cold 600/600; LRU hot 66/300 cold 58/600; LFU 300/300 vs 306/600; volatile-ttl ttl 0/200 then OOM; random 167/300 vs 326/600 |
| 4 | 04-persistence.* | RDB 1500 written → 1000 after kill; fork 325 µs; SAVE 7158 µs; AOF everysec 1500 → 1500; base file `REDIS` → `*2  $` with preamble off |
| 5 | 05-* | BRPOP served after LPUSH (+1.0 s), consumers get o1/o2; GET+SET counter 1, INCR 2 |
| 6 | 06-delay*.timeline, 06-practices.bigkey | naive: both take o1; Lua: one o1, other nil, o2/o3 stay; 1M-field hash 55588728 B, DEL 165363 µs vs UNLINK 22 µs (×7517), lazyfree DEL 20 µs |
| 7 | 07-architecture.*, 07-cluster.* | WAIT 1 500 → 0 (same connection), stale GET 100 → 120 after restart, polls=1, offsets 15361 = 15361; slots foo 12182, `{34}` pair 9745, CROSSSLOT on l06:a/l06:b |
| 8 | 08-lock*.timeline | nolock: 2 BOOKED; nx: B nil; ttldel: B OK at +2800, A DEL removes it, tokC OK; cad: A gets 0, lock still tokB; fencing: B token 2 OK, A token 1 → `STALE 2` |
| 9 | 09-bridge.*, 09-bucket*.timeline | bucket30: allowed=10 denied=20 min_retry_after_ms=100000; idempotency NEW / IN_PROGRESS / DONE + body / MISMATCH, TTL 86399; naive bucket 2 pass from 1 token; Lua 1 allowed, 1 denied (retry 1000000) |
| hw | hw-check.solution / .bad | ✔ ×5 / ✘ H1 H2 H5 |

## Files

- `labs/lesson-06-redis/`: 38 lab files, 5 `lua/*.lua`, `99-cleanup.sh`, `package.json`/`package-lock.json`, `hw-check.sh`, `hw-solution.mjs`, `driver-drill.ai-snippet.ts`. Additions beyond the phase list: `01-block.B.sh` (R03), `02-encodings.sh`, `03-expiry.sh` (controller builder rule).
- Plan folder: `verify/record-all.sh`, `verify/hw-bad-fixture.mjs`, `runs/*.txt` (100) + `manifest.tsv`, `runs/data/w1–w9.json` + `derived.json`, `runs/driver-claims.txt`, `verify/deviations.md` (R03, R35), `verify/expected.tsv` (status column of R03 and R35 only).

## Progress log (kept from the run)

- Found only `check.sh` from phase 02; no partial files from the interrupted attempt.
- 09:16 main recreated; 09:20–09:35 labs written; 09:29–09:40 setup + stages 1–2; R03 hang → B to `.sh`; controller patched the rerun-gate timing lines.
- 09:44–09:55 stages 3–6 (RESETSTAT, queue order fixes); 10:05 stages 7–9 (WAIT fix, R35 deviation).
- 10:10 phase 04 (homework, claims, data); 10:12 and 10:38 full rerun gates; 10:35 lock margins widened and stage 8 re-recorded; 10:45 extras down, seed, final gates.

## Unresolved / for the controller

1. `runs/data/*.json` were generated by a parsing script kept in the session scratchpad, which is outside the repo because the script is not in my file list. Should it be added under `verify/` so the data can be regenerated after any re-record?
2. `runs/hw-cleanup-probe.txt` is an extra runner file. It is evidence for the `--cleanup` test; I kept it rather than hand-editing the manifest.
3. The R41 claim text in `expected.tsv` still says "≈ +2.5 s"; the run now acquires at +2.8 s. The predicate is unchanged and holds. Fragments should quote the run.
4. `99-cleanup.sh` was only syntax-checked and linted, not executed (running it would delete the seeded state).

## Controller answers (2026-11-01)
1. The widget-data generator is moved into the repo as `verify/make-widget-data.mjs` (default `runs/` path). Regenerating gives byte-identical `runs/data/*` and `--data` is GREEN.
2. Keep `runs/hw-cleanup-probe.txt` as evidence.
3. R41 claim text vs timing is logged in `verify/deviations.md` (narrative only).
4. `99-cleanup.sh` is executed in phase 07: run it, check that `l06:my:*`/`l06:hw:*` survive and the other `l06:*` keys are gone, then re-seed with `00-seed.redis` + `check.sh` ✔/–.
