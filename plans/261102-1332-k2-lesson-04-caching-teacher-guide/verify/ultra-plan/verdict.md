# Verdict — `/ak:plan --ultra --tdd --advice` best-of-5, K2 Bài 04 (Caching)

Verifier: kongming (Fable 5.1), 2026-11-03 (Asia/Saigon). Inputs: `planning-rubric.md`, `evidence-packet.md` (§9 rules), `planning-packet.md`, `kongming-investigation-counsel.md`, candidates `verify/ultra-plan/candidate-A..E.md`. `reports/planner-ultra-candidate-*.md` were not opened.

Method: mechanical greps on all five for every hard-constraint token; full-text evidence extraction per candidate by five independent readers whose findings I cross-checked (three of their claims were wrong and are discarded, see "Confidence"); hand replay of every frozen rate-limit number whose trace is defined in `plan.md` (A, B, C, D fully; E act by act); offline recomputation of the sha1 Bloom counts; primary-source checks of pgbench 16 (`-d` = `--debug`, dbname positional; PG 17 changed it to `--dbname`) and Redis 7.2.3 `config.c` (`hash-max-listpack-entries` 512 at line 3215, `maxclients` 10000, `hll-sparse-max-bytes` 3000).

## Score table (1–20 each)

| Cand. | P1 Scope | P2 Exec | P3 TDD | P4 Correct | P5 Teach | P6 Safety | P7 Effic. | Total | P1–P3 |
|---|---|---|---|---|---|---|---|---|---|
| **E** | 18 | 17 | 19 | 18 | 17 | 18 | 15 | **122** | **54** |
| A | 18 | 14 | 19 | 18 | 18 | 19 | 16 | 122 | 51 |
| B | 16 | 13 | 17 | 15 | 17 | 18 | 17 | 113 | 46 |
| D | 16 | 12 | 16 | 15 | 17 | 17 | 16 | 109 | 44 |
| C | 17 | 16 | 14 | 13 | 17 | 18 | 13 | 108 | 47 |

Tie on total between E and A is broken by the deciding criteria P1–P3 (E 54 vs A 51).

## Hard-constraint findings (all candidates PASS)

Common to all five: `=== FILE: plan.md ===` plus phase files (HC6); Failure Protocol block count equals phase count and every block is verbatim §8 (HC5, diffed by the readers for all 49 blocks); only `git status` (HC1); no base64 images; no `redis-benchmark -t`; batch-token RTT measured with `redis-benchmark -c 1 … EVALSHA` inside one connection; real pgbench lines are `-n -f … -c ≤ 8 -T ≤ 5` with a positional dbname; null-chip list exactly `1,2,3,10,12,17,18,23,26,32,38,39`; containers `advance-be-k2l04-*`, main `127.0.0.1:6381:6379`, extras unpublished; Bloom hand-built with `SETBIT`/`redis.sha1hex`; every L06 overlap has its own recorded run; none runs L06 `check.sh`, `00-containers.sh` or `99-cleanup.sh` (so the C12 db-15 write never happens). The only contact with `advance-be-redis` in every plan is a read-only `redis-cli --scan --pattern 'k2l04:*'` inside the fingerprint (A:259, B:203, C:209, D:296, E:224), which is not a write, restart or reconfigure and is acceptable.

| Cand. | HC2 note | HC7 note |
|---|---|---|
| A | FLUSHALL/kill/pause only on `-scratch`; PG writes `k2l04_counter` only (720); `-d` dropped from pgbench with a correct reason (21). | Lua first at `02-tools.redis#lua-basics` (668), stage 2 = slide 33 (39). |
| B | FLUSHALL only scratch/cluster (54); Redis-down simulated with `PORT=6390`, no stop of anything foreign (375). | Lua first in stage 2 (45, 291). |
| C | FLUSHALL/CONFIG SET banned outright (312); crash container only. | Lua first in stage 2 (39, 432); `--eval` is named in the `#cach-hoc` glossary as a term (684) — a definition, not a script; not a breach. |
| D | FLUSHALL on `-small` only (509); `docker stop/kill` only `-small` (531, 607). | Stage 3 = slide 33; stages 1–2 (fundamentals, cluster) contain no Lua (511, 438). |
| E | FLUSHALL only on `-crash` (703); no `package.json` (815). | Lua first at `02-lua.redis#basics` (537); the prose `pgbench … -d advance_be_lab` at line 25 is wrong for pgbench 16 but both real commands (250, 700) use the positional form. |

## Ranking and rationale

**1. Candidate E (122; P1–P3 = 54).** Every one of its tasks carries all five handover fields (readers found 0 missing), which is the `--advice` contract the rubric weighs under P2. Its evidence rigor is the strongest of the five: the 60-row trace (351–355) reproduces every frozen replay line (fixed 33/5, log 24/14, counter 26/12 with "est 6, retry 2000" at row 10000, leaky 32/6 with wait 8750, token 30/8 with retry 750, `toi_da_10s` 9) under the Lua semantics it specifies (371–376); the exact Bloom literal `fp=953/10000` with `22587` bits set (134, 381) reproduces bit-for-bit from `u1…u10000` / `x1…x10000` with `sha1hex` 8-hex slices mod 50000 — the planner really computed it. It adds a "lab line edited after its run" negative (V23, 445), four fingerprint checkpoints (29) and a `pg_other_writes` gate (226). Scope covers slide 6 bandwidth/memory and slide 7 `2^32`, PFMERGE in core (131). Weaknesses: `record-all.sh` is relied on but never specified (512, 607, 687); the counter script's deny tuple is unstated (373); highest effort (16.5 h); 429 is text, not a demonstrated line.

**2. Candidate A (122; P1–P3 = 51).** Technically the most careful: it caught that pgbench 16 `-d` is `--debug` (21), that `MEMORY USAGE` samples 5 nested values, that Lua numbers truncate, and that L06's `token-bucket.lua` lets a clock step move `ts` backwards (fix `ts = max(ts, now)`). Its 45-row trace and the 12-line frozen summary (59–74, 163–174) are fully consistent across all six limiters including `vs_log` and `max_delay_ms=7600`; 29 negatives cover every rubric type; homework has solution/bad/scaffold fixtures. It loses P2 because 37 of 40 tasks have no Success criteria and most have no per-task Target (e.g. 377–503, 585–800) — a systematic miss of the §8 contract — and because the `expected.tsv` predicate language is shown by one example (455) for 60 rows. P4 is held back by frozen machine-dependent thresholds (`tps_async ≥ 1.1 × tps_hot`, `hot lock3 ≥ 3`, `Δ main-thread CPU ≥ 0.8 × Δ total`, 102/131) that a legitimate measurement can miss.

**3. Candidate B (113).** Shortest and cleanest sequencing (9.6k words, 12.75 h), replay numbers verified consistent (fixed 30/18, log 25/23, counter 26/22 with `diff=13 over=7 under=6`, token 29/19, leaky delays 0/1800/…/7200). Loses on P2 (about 30 of 36 tasks lack Goal/Target/Success; T7.2 challenges have no Verify, 587) and P4: the delay-task fixture puts `o2`/`o3` at score `4102444800` (384), which is seconds while its contract makes `now_ms`/`TIME` milliseconds (237, 356) — as ms that is 1970, so R41 (125) cannot pass; R17 "5 queued, 3 DROP" (95) depends on an unstated A/B start order (a worker already blocked in `BLPOP` pops o1 instantly → 6/2). PFMERGE is first on its drop list (45) although §4.6 lists it as content; fan-out only at 10k.

**4. Candidate D (109).** Oracle-first design with consistent replay numbers (15/10, 10/15, 14/11, 13/12, 13/12, max_wait 7960) and a clean lifecycle. But 27 of 29 tasks lack Goal/Success; the lint rule "no `6379`" (224) contradicts its own `-p 127.0.0.1:6381:6379` (324), so phase-03 `--lint` cannot be GREEN as written; the frozen "batch: 20 of 20" over-admission (100, 161) has no formula and is unreachable from a cap-10 bucket in 190 ms unless debt semantics are invented; `DEBUG SLEEP` is used on `-small` whose command lacks `--enable-debug-command` (326 vs 165; 7.2 default is `no`, evidence §5); negative-case letters (753, 808–809) are never mapped to the 25 cases.

**5. Candidate C (108).** Longest (13.9k words) and the only candidate whose frozen numbers contradict its own trace: with segment c's five entries at 50500–58900 all inside the 10 s window at 60100, the sliding log must deny the first requests of segment d, so `log allowed=30 denied=8` (R23, 90) is impossible under any boundary convention (26/12 or 25/13), and "exactly 5 decisions differ from R23" (R24, 91; `differ=5`, 361) falls with it. Its phase-02 oracle gate (56, 166, 332) would therefore STOP the executor at the first Verify. Token/leaky/interval refill semantics are not fixed in the plan (457–458), so R30–R32 are not derivable. R10's `EXEC → 1) OK` and final `"8"` (84) do not match its own `MULTI; DECR; EXEC` flow (436), which yields `1) (integer) 9` and final `9`. Otherwise strong on task completeness (all fields present) and safety (FLUSHALL banned).

## Winner

**Candidate E.** Margin: **low** (leads A by 3 on P1–P3, not > 5). Unanimous: **no** (A tops P5, P6, P7; B tops P7).

## Confidence

Medium-high on the E-over-A order (the two are within a point on total and the call turns on the §8 per-task contract, which the rubric's P2 names explicitly); high on the hard-constraint passes (grep plus full reads) and on the placement of C last (log contradiction verified by hand under all boundary conventions). Three reader claims were checked and rejected: that Redis 7.2 defaults `hash-max-listpack-entries` to 128 (config.c 7.2.3:3215 says 512; all five candidates are right), that C's token row 33/5 is wrong (it holds under integer refill, which C leaves unspecified — downgraded to under-specification), and that E's `toi_da_10s` should be 8 (nine starts fit in [78750, 88750); the frozen 9 is right). Not verified: candidates' line-number citations into L06 files other than `shell-tail.html:219` / guide `:4532` (both confirmed to hold the "K2 Bài 04 Rate Limiting" text) and `check.sh:136` (confirmed).

## Materialization must-fix (winner E; exact locations are candidate-E line numbers)

1. **Important — specify `record-all.sh`.** Phases 03–04 gate on it (512, 607, 687) but no task writes it. Add a task in phase 02 (next to T2.x runner work): copy `plans/261031-1651-lesson-06-redis-teacher-guide/verify/record-all.sh`, list the 58 run ids → `run-lab.mjs` invocations (`--region`, `--ab … --rep 3`, `--out`, `--ct`), with a Verify such as `bash -n … && grep -c 'run-lab.mjs' … → 58`.
2. **Important — fix the pgbench prose at line 25** (`psql|pgbench -U postgres -d advance_be_lab`). In pgbench 16 `-d` is `--debug` and the DB would silently default to `postgres`; write `psql … -d advance_be_lab` and `pgbench -n -f … -U postgres advance_be_lab` separately, matching lines 250 and 700. Also add "`-d`" to the lint ban for pgbench lines (413).
3. **Important — define the counter script's deny return** (table row "counter", 373) so that R14's "row 10000: est `6`, retry 2000" (96) is a well-defined literal, e.g. return `{0, tostring(est+1), retry, prev, cur}` on deny.
4. **Important — make `pg_other_writes` (226) advisory, not a hard compare failure.** The company dev app shares `quan-ly-hop-dong-postgres-1`; any write to another schema during the build would trip `fingerprint --compare` with a false positive. Keep `pg_schemas` as the hard gate; print other-schema write deltas as `info:`.
5. **Minor — pre-authorise the R20 outcome** (110: `spread ≥ 1.5 × hot`, `async ≥ 2 × hot`, `hot Lock samples ≥ 4`). Keep the relations as the expected narrative but state in T4.x that a miss is a logged deviation with changed chip/narrative (the risk row at 173 already implies this; the task Verify should say it).
6. **Minor — state the `00-seed.redis` UNLINK scope** (595): which `k2l04:*` prefixes the seed clears, and that `k2l04:my:*`/`k2l04:hw:*` survive, so `check.rerun` (K02) is reproducible.
7. **Minor — slide 7 "32 GB/instance" guidance** has no row (79). Add it to R07's chip note as "chưa đo trực tiếp".
8. **Minor — borrow A's two verified corrections** into E's contract §6 / Lua table (374): `last_ms = max(last, now)` is already there (good); add that limiter replies use integer units because Lua numbers truncate (A:21), and that `MEMORY USAGE` in R16f/R22/R25c/R35b/R37b should pass `SAMPLES 0` for exact per-key bytes on Hashes/ZSets.
9. **Minor — add one awk-mapped 429 line** (as A/C/D do, e.g. `HTTP/1.1 429 Too Many Requests · Retry-After: <ceil(retry/1000)>`) to the stage-4 contract region so the "429 + `Retry-After`" block of evidence §4.2 is a recorded run, not only bridge text (927, 997).
