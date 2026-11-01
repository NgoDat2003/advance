# Ultra-plan verdict — Lesson 06 (Redis) teacher guide

Verifier: kongming (Claude Fable 5.1), 2026-10-31 (Asia/Saigon). Inputs: `planning-packet.md`, `evidence-packet.md`, `planning-rubric.md`, `controller-facts-addendum.md`, candidates A–E in `verify/ultra-plan/`. Spot-checks were read-only (`CONFIG GET`, `INFO`, `/proc/1/task`, `netstat`, `docker ps`, repo greps).

## Facts verified on this machine (used in scoring)

- Lesson-07 build system exists as every candidate assumes: `verify/verify-guide.mjs` has V01–V16 and modes `--selftest --fragment --runs --data --only`; `widget-smoke.mjs`, `make-widget-data.cjs`, `merge-timeline.mjs`, `rerun-gate.sh`, `record-all.sh`, `negative-tests.sh`, `assembly/{assemble.mjs,contract.md,shell-*.html,shell-css.part}` all present.
- `README.md:14` is the labs line; `TONG_QUAN…md:38` is row 06 with `labs/lesson-02-caching/06-*.mjs`; the lesson-07 bridge phrase "Bài 06 Redis" is on `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html:3335` and also in `plans/261027-…/assembly/shell-tail.html:187`.
- Lesson-02 anchors `chang-5`, `chang-6`, `s5-2`, `s5-3` exist.
- Host listeners: only 6379 (Docker backend + wslrelay); 6380, 6381–6384, 7001 are free. Containers: `advance-be-redis` up (DBSIZE 0, run_id 4de11519…), `quan-ly-hop-dong-postgres-1` up, everything else exited.
- Redis 7.2.3 defaults on the lab container: `set-max-listpack-entries 128`, `set-max-intset-entries 512`, `zset-max-listpack-entries 128`, `list-max-listpack-size -2`, `lazyfree-lazy-expire no`, `aof-use-rdb-preamble yes`, `busy-reply-threshold 5000`, `enable-debug-command no`, `active-expire-effort 1`, `repl-timeout 60`, `io_threads_active:0`. Threads in `/proc/1/task`: `redis-server, bio_close_file, bio_aof, bio_lazy_free, jemalloc_bg_thd`. `bash`, `awk`, `sh`, `seq` exist in the image.
- Slide image assets exist for pages 1, 4–9, 12, 16, 18, 19, 25–27, 35, 39, 40, 43, 45(×2), 46(×2).

## Score table (1–20 per criterion)

| Cand. | P1 Scope | P2 Exec | P3 TDD | P4 Redis 7.2 | P5 Teach | P6 Safety | P7 Delivery | Total | P1–P3 |
|---|---|---|---|---|---|---|---|---|---|
| A | 18 | 17 | 19 | 17 | 18 | 19 | 17 | **125** | 54 |
| B | 18 | 15 | 16 | 15 | 17 | 16 | 15 | 112 | 49 |
| C | 17 | 16 | 18 | 18 | 16 | 17 | 15 | 117 | 51 |
| D | 17 | 16 | 18 | 18 | 16 | 17 | 15 | 117 | 51 |
| E | 18 | 15 | 16 | 17 | 17 | 16 | 16 | 115 | 49 |

### Evidence per candidate

**A** (9 phases, 10.5 h, 48 matrix rows, 13 negative tests)
- P1 18: all 46 slides mapped, all eight §4 blocks (R01–R48), "Nhắc nhanh Bài 02 … links to L02", learner pastes `.redis` regions. Minus: slide 30 listed as null-chip although R11–R13 are its measured answer; slide 4's chip is ambiguous ("Slides 4, 5 (PART…)").
- P2 17: the most explicit container lifecycle of the five (table with network, published port, flags, up/down for six containers; `00-containers.sh up|down|status|reset`, "recreates only when `.Config.Cmd` differs"); full file list per phase; delegates D1–D3 disjoint; contract frozen in phase 01. Minus: R05 payload benchmark is unmeasurable as written (`-t get -d 102400` on non-existent `key:__rand_int__` returns nil; `-d` only affects SET); partition step asserts `master_link_status:down`.
- P3 19: phase 02 writes `check.sh`, `expected.tsv`, `run-redis.mjs`, verifier (V16 lint: non-`l06:` keys, `6380`, `FLUSHALL` on main, `CONFIG SET` without restore; M01 sha256 manifest; D01 deviation gating), `rerun-gate.mjs`, selftest fixtures and 13 negative cases (a–m, incl. hand-edited run, lab lint, deviation without log) before any lab file. Seed idempotency diff, "Never edit a run", fingerprint before/after.
- P4 17: thresholds (44/45 embstr→raw, `APPEND`→raw, 512/513, 64/65, intset 512, set/zset listpack 128, list listpack→quicklist), expiry constants (W3 toggle "slide: 25%" vs "7.2: 10% stale, time cap 25% CPU"), hybrid preamble on/off, `lazyfreed_objects`, CROSSSLOT on a cluster-enabled node, eviction "runs before each command, so one command per line, no big Lua writes" all correct. Minus: R05 design; R23 AOF narrative risk (see must-fix 4).
- P5 18: every stage has story → diagram → `table.stats` → `.check30`, a concrete challenge with PASS, 9 widgets fed by `runs/data/wN.json` with `sources`; W8 five-tab lock timeline with fencing; homework language-agnostic with H1–H5 (H5 proves compare-and-delete); driver drill 7 mistakes + 1 decoy; cheat sheet, 10 interview Qs, M2/Boss-Challenge-2 bridge.
- P6 19: eviction and persistence on separate containers; runner refuses names outside `^advance-be-redis(-[a-z]+)?$`; lint catches `6380`, `FLUSHALL` on main, unrestored `CONFIG SET`; V15 secret scan; fingerprint diff gates final phase.
- P7 17: contract → tests → runs → data → shell (parallel) → fragments → verify → ultra review → docs; 340 KB budget; render-check light+dark. 8.3k words (over budget).

**B** (10 phases, 11 h, 33 rows, 10 negatives)
- P1 18: complete coverage incl. WATCH/MULTI optional, promote demo, Postgres fencing as text.
- P2 15: `setup.sh --persist rdb|aof-everysec|aof-always|default` and `run.sh` well specified (MULTI/QUEUED mapping, `CLIENT ID` session check). Defects: eviction regions "fill keys by `EVAL`" on the main container — eviction is performed before a command, not inside a script, so the fill will not evict as designed and hot keys read *before* the script are older than the script-written cold keys; allkeys policies on main also evict `l06:seed:*`/`l06:my:*` with no re-seed step, so "check.sh all ✔ after every stage" cannot hold after stage 4.
- P3 16: tests first, `rel` column, CRC16 spec vector in selftest, source note from `expire.c`; no sha256 manifest (ad-hoc `sha256sum` only).
- P4 15: thread list exact; expiry 10 %/25 % correct; but R17 "`everysec`: SIGKILL loses at most about 1 s" is the wrong expectation (writes are in the page cache; a process kill loses nothing) and the EVAL-fill misunderstanding above.
- P5 17: challenge table with PASS per stage, W1–W8, homework Lua acquire/release with fencing token H5.
- P6 16: fingerprint filtered; V14 lab scan; but eviction on main endangers learner keys.
- P7 15: phase 06 shell depends on 05 (widget data), delaying shell work behind all runs; 380 KB.

**C** (9 phases, 11.75 h, 50 rows, 12 negatives)
- P1 17: complete; Functions library `l06_*`. Minus: `.redis` files "have no comments" (ECHO markers instead) — conflicts with the project rule "comment rõ ràng bằng tiếng Việt" for learner-facing lab files.
- P2 16: compose with profiles, named volumes, fixed `container_name`s; M1 whole-file pipe works without any helper. Defects: the eviction fill method in a `.redis` file is unspecified (2,000 1 KB keys need either 2,000 lines or an EVAL, and the EVAL pitfall is not addressed); X39 asserts "link down"; X25 chips slide 25 OK while X27 and the chip list say PART.
- P3 18: `check.sh` exits 1 with a C06 negative test, MANIFEST.sha256 with a byte-flip negative (case i), V15–V19, widget-smoke pre-written RED, `source-claims.md`.
- P4 18: "Facts that shaped the design" are right (process kill keeps AOF `everysec` data, `docker stop` saves, `CONFIG SET` not persisted, benchmark key namespace); HTSTATS `[Expires HT]`; 10 %/25 % correct.
- P5 16: 10 widgets, challenges per stage; but bare command files and the single-connection lost-update demo are weaker teaching.
- P6 17: kills by exact name, V18 scan, db 1 FLUSHDB guard, re-seed after eviction (learner `l06:my:*` still lost).
- P7 15: 10 widgets and phase 03 at 3.5 h; 8.4k words.

**D** (10 phases, 11.5 h, 44 rows, 12 negatives)
- P1 17: complete plus optional io-threads container and 3-node MOVED demo. Minus: homework is thin — `hw-check.sh` itself issues the two `SET NX PX` requests and the learner only writes the release script, while slide 43 asks for the lock itself.
- P2 16: `r.sh` ≤ 30 lines with container inferred from file prefix; `BLPOP l06:sleep:x` as a client-side pause (correct: blocks only that client); `docker pause` for replica lag (robust); eviction filled with `redis-benchmark` (correct). Defects: `fingerprint.sh` counts `docker volume ls -q | wc -l` and lists `docker network ls` unfiltered, so creating `advance-be-redis-data`/`-persist-data`/`-net` breaks its own C06 and final gate; X05 uses `-t set` which writes `key:__rand_int__` outside `l06:` and breaks C04.
- P3 18: runner self-test (`selftest-runner.sh`), check.sh negatives (k, l under `trap`), per-row `--runs --only` after each region, `[UNVERIFIED]` tagging in `source-claims.md`.
- P4 18: `lazyfree-lazy-expire no`, `SET … XX KEEPTTL`, 513 ints → hashtable, eviction-before-command risk row, AOF page-cache expectation, `io_threads_active:1` only with the `-io` container.
- P5 16: W3 toggle, W7 CRC16 with hashtag rule, lesson-14 `#chang-7` link; but thin homework.
- P6 17: docker-line grep guard; optional failover kills the main (DBX) container.
- P7 15: copies assembly files unchanged in phase 01 (ceremony); four containers kept running for the study day.

**E** (9 phases, 12 h, 49 rows, 12 negatives)
- P1 18: complete; learner writes both `hw_acquire` and `hw_release`; `COMMAND DOCS` feeds a traced cheat sheet.
- P2 15: `run.sh` inside the container (POSIX sh + awk, verified present) gives the simplest learner one-liner; `record.sh` refuses foreign containers and greps docker lines. Defects: `safety.sh` snapshots `docker network ls` unfiltered, then phase 01 creates `advance-be-redis-net`, so every later `safety.sh diff` exits 1; eviction on main with `maxmemory 2mb` evicts `l06:seed:*` (C08) and `restore` does not re-seed; bad homework fixture "✘ only on H2, H3, H5" contradicts H7 (increasing fencing tokens) which the fixture cannot pass.
- P3 16: runner self-test fixture written first, `red-baseline.txt`, check.sh negative (l); no sha256 manifest.
- P4 17: AOF page-cache narrative correct, expiry constants correct, `SINTERCARD`, `COMMAND DOCS`.
- P5 17: challenges with PASS, W1–W10, lesson-07 shell-tail edit so a rebuild keeps the bridge link.
- P6 16: safety diff self-broken; eviction on main.
- P7 16: lean sequencing; 7.4k words (closest to budget).

## Hard-constraint check

| # | Constraint | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 1 | No branch/commit/push/PR/issue | pass (`git status` only) | pass | pass | pass | pass |
| 2 | Only `advance-be-redis*` touched destructively; no 6380; no Postgres schema | pass | pass | pass | pass (host ports 6381–6383/7001 verified free) | pass (6381/6382/6384/7001 free) |
| 3 | No heavy Node harness for the core lesson | pass (Node only in optional homework/driver claims) | pass | pass (Node homework optional, "core never needs Node") | pass | pass |
| 4 | Lesson 06, all eight §4 blocks | pass | pass | pass | pass | pass |
| 5 | Test matrix + verification commands per phase | pass | pass | pass | pass | pass |
| 6 | `=== FILE: plan.md ===` + phase files | pass | pass | pass | pass | pass |

No candidate is disqualified.

## Ranking

1. A — 125 (P1–P3: 54)
2. C — 117 (51)
2. D — 117 (51)
4. E — 115 (49)
5. B — 112 (49)

## Winner: A

Rationale: A is the only candidate whose test-first phase already contains a safety lint that catches unrestored `CONFIG SET`, a sha256 manifest gate, deviation gating and 13 negative cases, and the only one with a complete container lifecycle table (flags, network, published port, up/down, reset). It isolates eviction and persistence on throwaway containers, so the learner's and DBX's main container never loses its seed. Its Redis 7.2 facts are correct wherever they are load-bearing (expiry 20/10 %/25 % CPU, encodings, preamble, lazyfree, CROSSSLOT). Its defects (below) are local measurement-design errors, not architecture, and are fixable in an override section without touching its structure. C and D are close on rigor and slightly better on raw Redis correctness, but each carries a self-defeating gate (D's unfiltered fingerprint, C's unspecified eviction fill and comment-free lab files) and a weaker learner surface.

- **Margin: low** (A leads C/D by 3 on P1–P3, under the >5 threshold). On the total A leads by 8.
- **Unanimous: no** — C and D score 18 on P4 against A's 17.
- **Confidence note:** high confidence that A is not disqualified and is the best scaffold; medium confidence on the exact 1–2 point gaps between C, D and E (they are within noise of each other). The P1–P3 margin is low because all five candidates converge on the same architecture (lesson-07 shell, `.redis` regions, ECHO-marker runner, expected.tsv, 3 delegates); the differences are in defect count, which favours A.

## Materialization must-fix (controller override section for candidate A)

1. **R05 / `01-bench.sh#size` is unmeasurable as written.** `redis-benchmark -t get -d 102400` GETs the non-existent `key:__rand_int__` (A deliberately avoids `-t set`), so every reply is nil and `-d` has no effect. Replace with custom commands on seeded keys: `redis-benchmark -q -n 20000 GET l06:bench:small` vs `… GET l06:bench:big` where `l06:bench:big` is a 100 KB value written once with `SETRANGE`/`EVAL` (borrowed from C's X05). Update the R05 regex to compare those two rps lines.
2. **Two-client timelines cannot prove "B sent at +0.5 s" from server `TIME` alone.** B's `TIME` marker sent before `PING` is itself queued behind A's `DEBUG SLEEP`, so the recorded server stamp for B's send is ≈ A's end. Have `run-redis.mjs` embed the host send time in the marker (`ECHO "@@k <host-ms>"`), so each line carries client send time plus server processing time; write R02 as "B's PONG server time ≥ A's start + 1.9 s; B's host send stamp = A start + 0.5 s". Same for R13, R25, R31, R39–R44 timelines.
3. **Do not assert `master_link_status:down` after `docker network disconnect`** (phase 03 step 2, `07-architecture.sh#partition`). The replica only notices on a failed ACK write or after `repl-timeout` (verified default 60 s). Assert only the stale `GET` and `WAIT 1 500 → 0`; narrate whatever status the run shows (B's risk row).
4. **R23/W5 AOF narrative:** with `appendfsync everysec` a `docker kill` (SIGKILL of the process) loses nothing because `write()` already landed in the page cache; the ≤ 1 s window exists only for an OS crash or power loss. The run will show DBSIZE 1500 — the narrative and W5's loss window must say this explicitly (C "Facts" §4, E R26), otherwise the slide-25 "1 s loss" claim gets repeated against the data.
5. **Chip table:** give slide 30 a chip (it is the lesson's headline question and R11–R13 measure it; the evidence packet's title-only list does not include 30) and state slide 4's chip explicitly (OK). Keep `expected.tsv` and contract §6 in sync.
6. **Lesson-07 bridge edit must also be applied to `plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/shell-tail.html:187`**, or a future rebuild of lesson 07 silently drops the link (borrowed from E phase 09).
7. **Fingerprint stability:** `fingerprint.sh` records `StartedAt`; a Docker Desktop restart during the two-day build changes it for `quan-ly-hop-dong-postgres-1` and fails the final gate. Reduce the status column to `Up`/`Exited` and drop `StartedAt` (D's approach), or document the re-baseline rule (B's risk row).
8. **Eviction regions on `-evict`:** keep A's one-command-per-line fill, and touch the hot keys *after* the cold fill as well as before, otherwise `allkeys-lru` ranks the script-era cold keys as fresher than hot keys read earlier (same ordering trap that breaks B). A's "10 `GET` rounds on hot" must sit between the two fills.

Minor (not required): A's homework uses `npm install`; the learner's stack uses pnpm — either is acceptable since `labs/lesson-02-caching` already has a `package.json`.

Status: DONE_WITH_CONCERNS
Winner: A
Summary: Candidate A wins (125/140, P1–P3 54) on test-first rigor, container isolation and safety lint; margin over C/D is low (3 points on P1–P3) and it is not unanimous (C/D edge it on Redis correctness). Eight concrete must-fix items (payload benchmark, client-side send stamps, replica link assertion, AOF narrative, chip table, shell-tail edit, fingerprint stability, eviction touch order) must go in the controller's override section.
