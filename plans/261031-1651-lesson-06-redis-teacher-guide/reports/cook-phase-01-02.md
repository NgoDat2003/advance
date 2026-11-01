# Cook report — phases 01 and 02 (2026-10-31, Asia/Saigon)

Both phase gates pass. Phase files `phase-01-contract-baseline-smoke.md` and `phase-02-tests-first.md` are set to `status: completed` (`ak plan status` → 2/9 phases done). No git command other than `git status` was run. Main `advance-be-redis` was not recreated: it is still published on `127.0.0.1:6379` only, with run_id `5e40632a…`, and DBSIZE is 0.

## Files written

| Path | Purpose |
|---|---|
| `assembly/contract.md` | Frozen contract v1, §1–§6. §6 has 46 slide rows and 31 chip rows, equal to `expected.tsv` (cross-checked by script). |
| `verify/fingerprint.sh` | Controller-only hashed fingerprint, with `--compare`. |
| `runs/00-fingerprint-before.txt`, `runs/run-method-smoke.txt`, `runs/manifest.tsv` | Baseline, S1–S7 smoke results, and one manifest line per run file. |
| `verify/lab-text.mjs` | `regionText`, `displayText`, `regionIds`, plus shared shell/redis-cli parsers (`dockerCalls`, `redisArgs`). |
| `verify/run-redis.mjs` | Runner: `.redis` / `.sh` / tool script / `--ab` with reset, barrier and `--rep`. Also `--register`. |
| `verify/merge-timeline.mjs` | Orders events by host ms. Works as a module or from the CLI on `verify/tmp/stamps/*.events.json`. |
| `verify/verify-guide.mjs` | V01–V19, M01, D01, `--runs`/`--data`/`--lint`/`--fragment`/`--selftest`. |
| `verify/negative-tests.sh` | 19 cases with `--guide-only`/`--labs-only`/`--data-only`. |
| `verify/rerun-gate.mjs` | Semantic two-pass gate, plus a comparison of A/B repetitions. |
| `verify/widget-smoke.mjs` | Headless Chrome check of W1–W9, quiz and theme. The W6 slot check reads `runs/07-cluster.keyslot.txt`. |
| `verify/expected.tsv` | Frozen: 57 run rows and 3 design rows, all `expect`. |
| `verify/deviations.md` | Header only. |
| `verify/fixtures/` | `x.redis`, `p.sh`, `ab.{A,B}.redis`, `abs.{A,B}.sh`, `stage-01.html`, `stage-01.quiz.json`, `runs/x.a.txt`. |
| `labs/lesson-06-redis/check.sh` | C01–C15 learner check. |

## Commands and results

| Gate | Command | Result |
|---|---|---|
| fingerprint stable | `bash verify/fingerprint.sh > verify/tmp/fp-a.txt; … fp-b.txt; diff` | identical |
| no names/env | `grep -ciE 'quan-ly\|omnipos\|=.*secret\|password' runs/00-fingerprint-before.txt` | 0 |
| 6380 / loopback / identity | `grep -E 'port6380\|main_bind\|run_id_match' runs/00-fingerprint-before.txt` | `port6380=free`, `port6380_lab=none`, `main_bind=127.0.0.1:6379`, `run_id_match=yes` (15 non-lab containers hashed) |
| compare | `bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt; echo rc=$?` | `✔ fingerprint khớp baseline`, rc=0. A tampered baseline gives rc=1. |
| smoke | S1–S7, see `runs/run-method-smoke.txt` | S1 OK/"1"; S2 two PONGs 854 ms apart (≈1 s minus docker exec start-up); S3 `ERR unknown command '#'`; S4 `"\xc4\x90\xe1\xba\xa1t"`; S5 **not verified**; S6 headless "not a TTY" (winpty present); S7 `D:/Git/lab/x` vs `/lab/x` vs `//lab/x` |
| smoke key removed | `docker exec advance-be-redis redis-cli EXISTS l06:smoke` | 0 |
| selftest | `node verify/verify-guide.mjs --selftest` | GREEN, 22/22 cases. Covers V05, V06, V07 (`(integer) 0`→0 passes, `(integer) 7`→9 fails, header-only `18` fails), V09, V11 quiz-why, V19, predicates, and V17 with 8 planted faults. |
| runs before experiments | `node verify/verify-guide.mjs --runs` | RED, rc=1: exactly 57 `missing run` lines and no other error (M01 is clean because the phase-01 files are registered) |
| lint | `node verify/verify-guide.mjs --lint` | GREEN on the current labs (`check.sh` only). `--labs <missing dir>` gives RED `V17 labs dir missing` without crashing. |
| check before setup | `bash labs/lesson-06-redis/check.sh; echo rc=$?` | C01 ✘ (no debug flag, network or `/lab` mount yet), C02–C06 `–`, C07 ✔, C08–C10 ✘ (no seed yet), C11–C15 ✔. rc=4, no shell error, and the same result from another cwd. |
| runner guard | `node verify/run-redis.mjs verify/fixtures/x.redis --region a --ct quan-ly-hop-dong-postgres-1` | refused, exit 2 |
| runner + manifest replace | fixture run twice, then `grep -c 'x.a.txt' runs/manifest.tsv` | 1 |
| runner env | `MSYS_NO_PATHCONV=1 node verify/run-redis.mjs verify/fixtures/p.sh --region a` | the unprefixed line still prints `D:/Git/lab/x` (env stripped from the child bash) |
| A/B barrier | `--ab verify/fixtures/ab.A.redis ab.B.redis a --rep 2`, and the `.sh` pair | B waits on BLPOP; its 0.5 s sleep counts from the release (+201 → +714 ms); rep 2 goes to `verify/tmp/rep/`; a CLI re-merge of the stamps is byte-identical |
| rerun gate | `node verify/rerun-gate.mjs --labs verify/fixtures --skip-ab` | 2/2 ✔. A planted `INCR` region gives ✘ `(integer) 1 ≠ (integer) 2` with `INFO` numbers masked. Real labs: 0 regions. |
| negatives | `bash verify/negative-tests.sh` | 8/8 runnable cases RED with the right code (h, j, k, l, m, n, o, p); 11 SKIP (no guide, fragment, R16a run, Lua run or w4 yet); rc=0. The 7 guide-group mutations were also proven on a synthetic guide: each turned RED with its code. |
| widget-smoke | `node verify/widget-smoke.mjs --help`; run on a minimal page | usage printed; headless run gives 0 exceptions |
| syntax | `node --check verify/*.mjs`; `bash -n` on the 3 shell scripts | all OK |

Fixture runs and their manifest lines were removed afterwards (`runs/` = the 2 phase-01 files + manifest). Temporary keys `l06:smoke`, `l06:fixture:*` and `l06:exp:c12` are gone. Two probe containers, `advance-be-redis-mnttest` and `advance-be-redis-evict`, were created but never started. They were used to learn the mount-source and Cmd JSON format for `check.sh`, then removed with `docker rm -v`.

## Decisions taken while implementing (please confirm or override)

1. **S5 DBX was not verified.** This agent has no DBX MCP tool. Following the decision rule, contract §5 limits DBX to browsing keys and single commands.
2. **Formats that phase 03 must emit** (frozen in `expected.tsv` claims). Regexes accept both `--no-raw` and raw `redis-cli` output, so a stage may be `.redis` or `.sh` (the controller resolution moves builders to `.sh`). Some rows need specific printed lines:
   - R01a: `CONFIG GET io-threads`
   - R17: `BASE=… MAX=…`
   - R18–R21: `hot=n/300 cold=n/600[ ttl=n/200]`
   - R35: `polls=n`
   - R45: the summary line `allowed=N denied=M min_retry_after_ms=R`
   - R34/R35: the master offset is printed before the replica offset
   - R32: a `lazyfreed_objects` snapshot before `UNLINK`
   - R13: the hash variant ends with `HMGET l06:user:1 age email`
   - R31b: `LRANGE l06:delay:done 0 -1` comes before `ZRANGE l06:delay:orders 0 -1`
   - R12: age is reset to 30 before `HINCRBY`
   - R08–R10: `STRLEN`/`HLEN`/`SCARD`/`ZCARD`/`LLEN` comes before each `OBJECT ENCODING`
3. **Predicate syntax** in the `regex` column is `<regex> ⇒ clause; clause`, using named groups and a whitelisted evaluator (`ratio(a,b)`, + − × ÷, comparisons). `same:<run>` implements R48b ("identical to R48a").
4. **V07 accepts a fourth small-number form**: a raw reply line that is just `N` (or timeline `< N`). A `.sh` `redis-cli` with no TTY prints raw output, for example R01b `wc -l`.
5. **V17 allows `EVAL`/`--eval` in `hw-*` files**, as well as in stages 06/08/09 and `01-block#busy`, because the homework continues the stage-8 lock. Tool scripts may name containers through variables; region files may not. The banned-word scan of `verify/` skips `tmp/`, `ultra-plan/` and `render*/`, because planner records quote the word.
6. **Fingerprint.** `port6380` counts only LISTENING sockets. `--compare` also requires `main_bind=127.0.0.1:6379` and `run_id_match=yes` (AC11).
7. **Manifest paths** are relative to `runs/`. Files that the runner did not write are registered with `run-redis.mjs --register` (fingerprint, smoke).
8. **A/B start.** For both `.redis` and `.sh`, the runner starts B, polls `INFO clients` until `blocked_clients ≥ 1` (5 s cap, warning on timeout), then starts A. The send time is when the runner wrote the command (`.redis`) or when bash reached the line (`.sh`).
9. **`check.sh` details.** C12 writes `l06:exp:c12` with PX 50 (added to the key registry). An extra that exists but is stopped counts as ✘. C08 also checks the 51-character JSON. W6 DOM ids `#w6-key`/`#w6-slot` were added to contract §4 so widget-smoke can drive them.

## Unresolved questions

- Should someone try DBX multi-line input by hand (S5)? A pass would add DBX as an alternative for single-client snippets.
- Is `EVAL` in `hw-*` files acceptable (decision 5), or must the homework avoid Lua?
- Phase 03 step 2 still says the `02-encodings` thresholds and the `03-expiry#active` fill use `EVAL`. The controller resolution in `plan.md` overrides that, and the lint enforces it. Phase 03 must write those builders as `seq | awk | redis-cli` `.sh` regions.
