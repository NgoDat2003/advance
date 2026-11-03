# Red-team review: Security Adversary (K2 Bài 04 Caching plan)

- Reviewed: `plan.md`, `phase-01` through `phase-10`, `evidence-packet.md` (§1, §5, §6, §9), `kongming-investigation-counsel.md`
- Codebase evidence: L06 build system `plans/261031-1651-lesson-06-redis-teacher-guide/` and labs `labs/lesson-06-redis/`
- Date: 2026-11-03. Docker Engine was **not running** during the review (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`), so I could not check live container state. No state-changing commands were run.
- Line numbers for phase files are per file.

Summary: 1 Critical, 5 High, 4 Medium.

---

## Finding 1: Copied tool scripts run against real containers before any lint or guard has seen them, and the runner never guards tool scripts
- **Severity:** Critical
- **Location:** Phase 03, "Container lifecycle" paragraph and T3.1 "Containers up" (lint only runs in T3.7 "Gates 1–4"). Phase 02 T2.2, runner tool mode.
- **Flaw:** T3.1 tells the executor to write `00-containers.sh` as "L06's script, adapted" (phase-03:28). In the same task it runs `up main` and `up cluster` twice (phase-03:96). The only static check that would catch a leftover L06 name is the V17 ban on `advance-be-redis` / `advance-be-l06` (phase-02:115), and it first runs at T3.7 step 1 (phase-03:154). By then every stage 1–4 recording has already executed. The runtime guards do not cover this either:
  - The runner's tool mode (`node run-lab.mjs <tool.sh>`, which T3.2 uses for `check.sh` and phase 05 uses for `hw-check.sh`) spawns the whole script under bash. It guards only the `--ct` label and never parses the script's `docker` calls.
  - L06 lint skips any container target that contains `$` in tool scripts. All L06 tool scripts name containers through variables (`MAIN=advance-be-redis`, `DATA=advance-be-redis-data`, `NET=advance-be-l06`).
  - L06's `up_one` recreates a drifted container **without** `--recreate` whenever the image is `redis:7.2.3` and `/data` sits on the named volume. It runs `SAVE`, then `docker stop`, then `docker rm -v`, then `docker run`.
- **Failure scenario:** The adapted script keeps one stale line, for example `MAIN=advance-be-redis` or `DATA=advance-be-redis-data`, while its spec table is changed to the K2L04 values (`-p 127.0.0.1:6381:6379`, K2L04 `/lab`, no `--enable-debug-command local`). T3.1 step 2 then runs `up main`. `drift()` finds the learner's live L06 container `advance-be-redis` with "lệnh khởi động khác", a different publish and a different `/lab`. The image and volume match, so `foreign=0` and the script stops and recreates Đạt's in-use L06 main, now on 6381 without DEBUG enabled. After that, L06 C14/C15, DBX `ADVANCE_BE_REDIS` and every L06 stage that needs `DEBUG` break. Lint and fingerprint report it only hours later, at T3.7.
- **Evidence:**
  - `labs/lesson-06-redis/00-containers.sh:23-24` (L06 names in variables)
  - `labs/lesson-06-redis/00-containers.sh:82-101` (auto-recreate when `foreign=0`)
  - `labs/lesson-06-redis/00-containers.sh:38` (`--enable-debug-command local`)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/run-redis.mjs:228-237` (`runTool` has no `dockerCalls` guard)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs:530` (variable targets in tool scripts skipped)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/record-all.sh:16` (`check.sh` run in tool mode)
  - Plan: phase-03:28, phase-03:91-99, phase-03:150-163, plan.md:171 (risk "Đạt uses L06 main" mitigated only by "V17, runner rc 2")
- **Suggested fix:**
  1. Add T3.0 before T3.1 and make it a hard gate: `node $P/verify/verify-guide.mjs --lint` rc 0, plus `grep -nE 'advance-be-redis|advance-be-l06|redis-data\b' $L/*.sh` → 0 hits. Re-run both after every edit to a tool script.
  2. Give every K2L04 tool script a runtime assertion at the top of each destructive function: `case "$n" in advance-be-k2l04-redis|advance-be-k2l04-cluster|advance-be-k2l04-crash) ;; *) die ;; esac`. Assert the same for the volume and network names.
  3. Drop the L06 auto-recreate. On any drift, print the drift and require an explicit `--recreate`.
  4. In `run-lab.mjs` tool mode, refuse any tool script that has not passed the lint since its last mtime.

## Finding 2: The only hard Postgres gate is the schema-name list, so objects created in `public` and writes to company tables pass every gate
- **Severity:** High
- **Location:** Phase 01 T1.1 step 3 (after must-fix 4); plan.md acceptance criterion 15; Phase 04 T4.1.
- **Flaw:** AC15 promises "PG schemas and other-schema writes unchanged" (plan.md:162). Must-fix 4 then made `pg_other_writes` advisory (plan.md:198; phase-01:37), which leaves `pg_schemas` as the only hard PG check. A list of schema names cannot detect:
  - `pgbench -i` creating `public.pgbench_accounts/branches/tellers/history`;
  - an unqualified `CREATE TABLE post_count`, which lands in `public` through `search_path`;
  - a `CREATE INDEX` on a company table;
  - an `UPDATE` or `DELETE` on company rows.

  The T4.1 schema gate diffs only `grep '^pg_'`, which is the same two lines, so it has the same blind spot (phase-04:47-53). The plan's own negative cases w2 (`-i`) and v (`UPDATE public.x`) are static lint cases only. Nothing at runtime proves those statements never ran.
- **Failure scenario:** A delegate or fixer runs a pgbench line without `-n` and adds `-i` "to fix" the missing `pgbench_branches` error. For example, a Failure Protocol detour on S11 or R20 runs it ad hoc and not through a lab file. Four `pgbench_*` tables (plus `pgbench_accounts` with 100k rows) appear in the company DB's `public` schema. `fingerprint --compare` still returns rc 0, T10.2 ticks ✔, and the company dev data now contains lab objects nobody reports.
- **Evidence:** plan.md:162 (AC15), plan.md:198 (must-fix 4), phase-01:35-37, phase-04:47-53; `evidence-packet.md:299` ("schema list ... unchanged"); `kongming-investigation-counsel.md:24` (`-i` would create `pgbench_*` in `public`).
- **Suggested fix:**
  1. Keep `pg_other_writes` advisory, but add a hard `pg_objects` line: sha256 of the sorted `nspname.relname|relkind` from `pg_class JOIN pg_namespace`, excluding `pg_%`, `information_schema` and `k2l04_counter`. It changes only when DDL runs, so company DML noise does not affect it. Gate on it, and explicitly assert that `public.pgbench_%` is absent.
  2. If the company app runs migrations during the window, report "info + ask user". Do not exit 0 silently.
  3. Reword AC15 so it states what is actually enforced.

## Finding 3: `pgWriteTargets` is a bypassable denylist, and dynamically built SQL in `.sh` regions skips it entirely while running as superuser
- **Severity:** High
- **Location:** Phase 02 T2.1 step 3, T2.2 step 3, T2.6 V17 "SQL targets only in `k2l04_counter.`"; Phase 04 regions `05-counter.sh#flush`, `#pg-burst` (reset, sampler), `05-counter-pg.sql#stats`.
- **Flaw:**
  - **The denylist misses dangerous statements.** It covers CREATE/ALTER/DROP/INSERT/UPDATE/DELETE/TRUNCATE plus five forbidden tokens (phase-02:28). It misses:
    - `COPY … TO/FROM PROGRAM`, which runs shell commands inside the company container because the session is superuser `postgres`;
    - `COPY` into tables, `SELECT … INTO`, `DO $$…$$`, `CREATE FUNCTION` bodies, `CREATE INDEX … ON public.x`, `GRANT`, `COMMENT ON`, `SECURITY LABEL`;
    - `set_config(…, false)`, `pg_stat_reset()`, `lo_import`, `VACUUM FULL` on company tables;
    - psql meta-commands (`\!`, `\copy`, `\o`, `\i`). These go through `psql -a` even with `-X`.
  - **It covers `.sql` files only** (phase-02:38). The `flush` region builds `UPDATE … FROM (VALUES …)` with awk at runtime from `D=$(… redis-cli --eval flush-take.lua … | xargs)` and pipes it to psql (phase-04:33). The `pg-burst` "reset" statement and the sampler also feed psql from `.sh` (phase-04:31). The runner allows the PG container on any `psql` exec line (phase-02:36). V17's static text check cannot see SQL that does not exist until the region runs.
  - **Redis data becomes SQL code.** The flush takes field names and values from a Redis hash and interpolates them into SQL without numeric validation. The guide then teaches this as the write-behind pattern.
- **Failure scenario:**
  1. During a stage 5 "Tự làm" or a re-record, the `k2l04:cnt:delta` hash holds a non-numeric field. Đạt is told to explore in DBX, where he can write any `k2l04:` key. The awk-built statement becomes `UPDATE k2l04_counter.post_count … FROM (VALUES (1),(2); DROP TABLE public.<x>; --,…)`, and psql runs it as superuser against the company DB.
  2. Separately, a `stats` region written as `SELECT … FROM pg_stat_user_tables` with a later `\o /tmp/x` or `COPY … TO PROGRAM` passes `pgWriteTargets`.
- **Evidence:** phase-02:28, :36, :38, :119; phase-04:24, :31, :33, :43; `evidence-packet.md:224` (in-container local auth as `postgres`), `evidence-packet.md:234` (no writes outside `k2l04_counter`).
- **Suggested fix:**
  1. Replace the denylist with an allowlist. Accept only these statement shapes:
     - `SELECT` (no `INTO`);
     - `INSERT/UPDATE/DELETE` whose target matches `^k2l04_counter\.`;
     - `CREATE SCHEMA IF NOT EXISTS k2l04_counter` and `CREATE TABLE k2l04_counter.`;
     - `DROP SCHEMA IF EXISTS k2l04_counter CASCADE`.

     Reject any line that starts with `\`, and reject the tokens `COPY`, `DO`, `FUNCTION`, `PROGRAM`, `set_config` and `lo_`.
  2. Forbid inline SQL in `.sh` regions. Every psql call must read stdin from a `$L/*.sql` region, so the runner can apply the allowlist to it.
  3. For the flush, validate each tuple with awk `/^[0-9]+ [0-9]+$/` before building `VALUES`, abort on any mismatch, and send the statement through `psql -v ON_ERROR_STOP=1 -1`.
  4. Run read-only regions (`stats`, `read`, `waits.sql`, `kiem-chung`) with `PGOPTIONS='-c default_transaction_read_only=on'`.

## Finding 4: The S11b fallback writes files into the company container and needs `sh -c` exec as root, which contradicts the runner guard
- **Severity:** High
- **Location:** Phase 01 T1.3 step 3 (S11/S11b); Phase 04 `05-counter.sh#pg-burst` "(or S11b form)"; Phase 02 T2.2 step 1.
- **Flaw:** If `/dev/stdin` does not work, the plan switches every pgbench call to a "`/tmp` file removed in the same `sh -c`" inside `quan-ly-hop-dong-postgres-1` (phase-01:60, phase-04:31). That means `docker exec … quan-ly-hop-dong-postgres-1 sh -c 'cat > /tmp/…; pgbench …; rm …'`. `docker exec` defaults to root in the official postgres image. This is an arbitrary root shell in a foreign container and a filesystem write outside `k2l04_counter`. It is also exactly what T2.2 forbids: "the PG container is allowed only on `psql`/`pgbench` exec lines" (phase-02:36). There are two ways out, and both are bad. The executor can weaken the guard to allow `sh` on the company container, or the S11b branch hits rc 2 and goes to the Failure Protocol with no pre-approved route. The plan also names no unique temp filename, and "removed in the same `sh -c`" fails if pgbench is killed mid-run (`-T 3` plus the timeout), which leaves the file behind.
- **Failure scenario:** S11 fails, because musl/Alpine pgbench behaves differently on `/dev/stdin` (the supervisor rated it "medium; smoke it"). The executor relaxes `GUARD` so that `sh -c` is allowed on `quan-ly-hop-dong-postgres-1`, which lets the S11b form pass. From then on, any `.sh` region may run any shell as root in the company DB container, and V17's "container guard" has a hole for the most sensitive target on the machine.
- **Evidence:** phase-01:60, phase-02:36, phase-04:31; `kongming-investigation-counsel.md:92` ("`pgbench -f /dev/stdin` works in the Alpine image (medium; smoke it)"); plan.md:174 (risk table lists only "S11b `/tmp` fallback").
- **Suggested fix:**
  1. If S11 fails, STOP and ask the user. Do not pre-authorise writing into the foreign container.
  2. Offer a no-write alternative to smoke-test: a throwaway client, `docker run --rm --network container:quan-ly-hop-dong-postgres-1 -v "$L/pg:/pg:ro" -e PGAPPNAME=k2l04-pgbench postgres:16-alpine pgbench -h 127.0.0.1 -U postgres -n -f /pg/hot-row.pgbench …`. It shares the network namespace without modifying the container and does not touch its filesystem. Trust auth on 127.0.0.1 is UNVERIFIED and must be smoked; if it needs a password, STOP.
  3. Keep the guard exact: on the PG container, `args[0] ∈ {psql, pgbench}` and nothing else.

## Finding 5: The name-only container guard cannot see in-container clients that reach L06 through the host, and `FLUSHALL` is allowed on extras
- **Severity:** High
- **Location:** Phase 02 T2.2 step 1 (GUARD); T2.6 V17 ("ban … host `6379`", "`FLUSHALL` only on extras", "require `-p 127.0.0.1:6381:6379`"); Phase 04 `05-counter.sh#crash`.
- **Flaw:** Both the runner guard and V17 check only the **container name** after `docker exec`.
  - **The lint ignores where redis-cli connects.** `redisCliCmd` treats `-h`, `-p` and `-u` as flags and discards their values. A line like `docker exec advance-be-k2l04-crash redis-cli -h host.docker.internal FLUSHALL` is therefore judged as "FLUSHALL on an extra" and allowed. The default port is 6379. Docker Desktop's `host.docker.internal` forwards to the Windows host, where L06 publishes `127.0.0.1:6379`; reachability is UNVERIFIED because Docker was down. The plan's "ban host `6379`" is a text rule, and the attack never writes `6379`.
  - **The lint also misses other host-exposure flags.** It does not ban `--network host`, `-P` (publish all) or `-u redis://…`.
  - **The fingerprint would not notice.** It checks only `l06_k2l04_keys`, so a FLUSHALL or `CONFIG SET` on L06 leaves it at `0` and passes.
- **Failure scenario:** While writing `04-contract.sh#fail-open`, a delegate or fixer makes the "Redis down" demo more realistic with `redis-cli -h host.docker.internal -p 6390`, then copies the pattern into the crash region (`FLUSHALL` is the first command, phase-04:34) and drops `-p`. The recorded run flushes Đạt's L06 main mid-study. V17 passes, the runner guard passes and the fingerprint passes.
- **Evidence:**
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs:462-470` (`redisCliCmd` drops `-h`/`-p`/`-u` values)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs:513` (destructive commands flagged only when `target === main`)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/run-redis.mjs:34, :90` (guard on container names only)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/lab-text.mjs:68-72`
  - Plan: phase-02:36, :115, :121; phase-03:83; phase-04:34
- **Suggested fix:**
  1. In V17 and in the runner, reject any `redis-cli` invocation in `$L` that has `-h`, `-u`, `--tls`, or `-p` with a value other than `6390`. The `6390` exception holds only in `04-contract.sh` with a `# guard-port` tag.
  2. Reject `host.docker.internal`, `gateway.docker.internal`, `--network host`, `--net=host`, `-P` and `--publish-all` anywhere in `$L`.
  3. Add negative cases for `-h host.docker.internal FLUSHALL` on the crash container and for `--network host`.

## Finding 6: The fingerprint cannot prove L06 is untouched, and it will false-positive on the learner's own L06 work
- **Severity:** High
- **Location:** Phase 01 T1.1 steps 1–3; plan.md AC15; Phase 03 T3.7 and Phase 04 T4.6 (fingerprint gates).
- **False negatives:** For L06, the compare checks bind, volume (`Name|CreatedAt`), network `Id`, a status flip (info only) and the `k2l04:*` key count (phase-01:33-37). It does not detect:
  - `docker restart advance-be-redis` (Up→Up, same ID);
  - `CONFIG SET maxmemory …` or `appendonly`;
  - `DEBUG SET-ACTIVE-EXPIRE 0`;
  - `FLUSHALL`, `SWAPDB`, or deletion of `l06:*` / `l06:my:*` keys.

  AC15 claims "L06 bind/volume/network" only. The risk table, however, treats L06 safety as covered (plan.md:171).
- **False positives:** T1.1 changes L06's exclusion from `advance-be-redis*` to `advance-be-k2l04-*`, so L06 extras are now hashed lines (phase-01:29). Đạt is on L06 stage 2 now (`evidence-packet.md:26`). L06 stages 3, 4 and 7 create and remove `advance-be-redis-{evict,rdb,aof,replica,cluster}` with `docker rm -f -v`. "A missing baseline line" exits 1 (phase-01:37), so the learner's normal study trips T3.7, T4.6 and T10.2 and sends the executor into the Failure Protocol. The cheapest "fix" an agent will reach for is to loosen the compare.
- **Failure scenario:**
  - (a) Finding 5's flush, or any accidental `CONFIG SET` on L06, passes all four fingerprint gates.
  - (b) Đạt runs L06 `up persist` in the evening. The next T4.6 compare fails on a vanished baseline line that is not a K2L04 fault, and an executor or kongming advice weakens the gate.
- **Evidence:**
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/fingerprint.sh:20` (L06 excluded its own family)
  - `labs/lesson-06-redis/00-containers.sh:39-42, :144-148` (L06 extras and their removal)
  - `labs/lesson-06-redis/00-containers.sh:151-158` (L06 `reset main` mutates config)
  - Plan: phase-01:29-37, plan.md:162, plan.md:171; `evidence-packet.md:26`, `:175`
- **Suggested fix:**
  1. Exclude `advance-be-redis-*` extras from the hard hash lines, as L06 does. Report them as info.
  2. Add read-only L06 lines: `l06_uptime_monotonic` (`uptime_in_seconds` must grow between compares unless the learner says he restarted it), `l06_config` (sha256 of `CONFIG GET` for `maxmemory*`, `appendonly`, `save`, `enable-debug-command`) and `l06_dbsize_nonzero`. On a mismatch, ask the user instead of exiting 0 or 1 silently.
  3. Reword AC15 to match.

## Finding 7: The secret scan misses the repo's own connection-string form and its scope is too narrow, and PG stats queries can leak company metadata
- **Severity:** Medium
- **Location:** Phase 02 T2.6 "V15: add `PGPASSWORD|postgres://[^ ]*@`"; Phase 04 `05-counter-pg.sql#stats`, `pg/waits.sql`; Phase 06 T6.3 `#tiep-theo` (FR-M2-05 "env params").
- **Flaw:**
  - **The regex misses `postgresql://`.** `postgres://` does not match `postgresql://user:pw@…`, which is the Prisma form Đạt uses. OmniPOS's own `.env.example:1` is `postgresql://postgres:***@localhost:5434/…`. The scan also misses `POSTGRES_PASSWORD=` and `rediss://`.
  - **V15 scans too little.** It covers the guide and `runs/*.txt` only. It does not scan `$L/**` (the drill `.ts` holds a connection URL by design), `runs/data/*.json`, `drill-claims.txt`, `source-claims.txt` or the handoff.
  - **PG stats queries are unscoped.** `stats` is specified as "`n_tup_upd`, `n_tup_hot_upd`, `n_dead_tup`" with no `WHERE schemaname='k2l04_counter'`. `waits.sql` takes a `string_agg` over `pg_stat_activity`, and nothing forbids the `query`, `usename`, `client_addr` or `datname` columns. An unscoped `pg_stat_user_tables` read writes company table names and row counts into `runs/` and from there into the published guide. The fingerprint carefully hides names (phase-01:41), but runs have no equivalent check.
- **Failure scenario:** D3 writes the `#tiep-theo` FR-M2-05 bridge with "env params" and pastes the OmniPOS `DATABASE_URL` example with its password. V15 passes because the scheme is `postgresql://`. Separately, the `stats` run lists `public.<company_table> n_tup_upd=…`, and the guide embeds it through `<!--@RUN 05-counter-pg.stats@-->`.
- **Evidence:**
  - `omnipos-finledger-hub/.env.example:1` (`postgresql://postgres:<redacted>@localhost:5434/…`)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs:358-360` (V15 regex and its scope)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs:42` (`runFiles` = `.txt` only)
  - Plan: phase-02:112; phase-04:24, :29; phase-06:44 (FR-M2-05 env params)
- **Suggested fix:**
  1. Change V15 to `/(postgres(ql)?|rediss?):\/\/[^\s@]*:[^\s@]*@|PGPASSWORD|POSTGRES_PASSWORD|requirepass|AUTH /i` and scan `G`, `runs/**`, `$L/**`, `$P/assembly/**` and the handoff.
  2. Lint every `pg_stat_*` / `pg_stat_activity` query in `$L` so that it requires `schemaname='k2l04_counter'` or `application_name LIKE 'k2l04-%'`, and bans the columns `query`, `usename`, `client_addr` and `datname`.

## Finding 8: Learner keys are deleted, against the plan's own contract, and the scan-plus-UNLINK patterns are not linted
- **Severity:** Medium
- **Location:** Phase 01 T1.4 §1 ("`my`/`hw` never deleted"); Phase 05 T5.2 step 3 (`hw-check.sh` "reset `k2l04:hw:*`"); Phase 03 `03-replay.sh` line 1 "in-container scan + UNLINK", `01-fundamentals.sh#keys-memory` "scan + UNLINK"; Phase 03 `99-cleanup.sh`.
- **Flaw:**
  - **`hw-check.sh` deletes the learner's homework keys.** Contract §1 freezes "`my`/`hw` never deleted" (phase-01:71). T5.2 has `hw-check.sh` reset `k2l04:hw:*` (phase-05:46). Since the homework contract puts Đạt's own key under `k2l04:hw:tb:{<storeId>}` (phase-05:35), every check run wipes his manual experiments.
  - **The UNLINK patterns are never frozen.** For `03-replay.sh` line 1 and `keys-memory`, the plan says "scan + UNLINK" and gives no pattern (phase-03:35, :49).
  - **L06 lint cannot check them.** For `redis-cli --scan --pattern X | xargs redis-cli UNLINK`, `UNLINK` has no static key arguments and `--pattern` is a skipped flag. A pattern of `k2l04:*` or `*` passes V17, and C06 ("all keys `k2l04:`") still shows ✔.
- **Failure scenario:** A delegate writes `03-replay.sh` line 1 as `redis-cli --scan --pattern 'k2l04:rl:*' | xargs -r redis-cli UNLINK`. It is reasonable, but it also deletes Đạt's stage 3 "Tự làm" state if he named it `k2l04:rl:my…`. A broader `k2l04:*` deletes `k2l04:my:*` everywhere. Each replay re-run on study day silently destroys learner work.
- **Evidence:**
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs:440, :450, :462-470` (`UNLINK` keys come only from static args; `--pattern` skipped)
  - `labs/lesson-06-redis/99-cleanup.sh:19-20` (the correct L06 form with `grep -v` exclusions)
  - Plan: phase-01:71, phase-03:28, :35, :49, phase-05:35, :46
- **Suggested fix:**
  1. Freeze each UNLINK pattern in the plan: `k2l04:rl:fw:*`, `k2l04:rl:log:*`, `k2l04:rl:sc:*`, `k2l04:keys:*`, and so on.
  2. Add a V17 rule: every `--scan --pattern P` that feeds `UNLINK`/`DEL` must have `P` start with `k2l04:` plus a non-`my`/`hw` segment, or must pipe through `grep -v -e '^k2l04:my:' -e '^k2l04:hw:'`.
  3. Point `hw-check.sh` at a checker-only namespace (`k2l04:hwcheck:*`) and leave `k2l04:hw:*` to the learner, or change §1 accordingly.
  4. Add a negative case: `--pattern 'k2l04:*' | xargs redis-cli UNLINK` without the exclusion → V17.

## Finding 9: The XSS check covers only one sink shape, while the plan adds new data-driven renderers and learner-input widgets
- **Severity:** Medium
- **Location:** Phase 02 T2.6 / T2.8 negative case q; Phase 06 T6.1 (`H.lanes(el, events)`); Phase 07 "Widgets are IIFEs … `textContent`/`esc()` only"; Phase 07 W1 slot calculator (learner types a key), `.estimator`, `.calc`.
- **Flaw:** V19 inspects only template literals assigned to `innerHTML`/`outerHTML`/`insertAdjacentHTML` (in L06). It does not catch:
  - concatenation (`el.innerHTML = '<b>' + v + '</b>'`);
  - plain assignment (`el.innerHTML = s`);
  - `document.write`;
  - `el()` attributes.

  L06's `el()` passes any key straight to `setAttribute`, so `el('a', {href: run.url})` or `{onclick: str}` from run or learner input is an injection path that V19 never examines. The plan adds `H.lanes`, a new renderer over run events (command text and replies from `runs/`, including JSON values such as `'{"ok":1}'` and `poll $i: $v`). It also adds widgets that echo learner-typed keys back. The only XSS negative case is the template form (case q, phase-02:149).
- **Failure scenario:** D2 writes `H.lanes` with `seg.innerHTML = ev.dir + ' ' + ev.text` to show bold markers. V19 does not flag it. A recorded run line containing `<img src=x onerror=…>`, for example a stage 7 share value or a learner-typed W1 key stored under `k2l04-c1-*` localStorage, then executes in the published guide.
- **Evidence:**
  - `plans/261031-1651-lesson-06-redis-teacher-guide/verify/verify-guide.mjs:192-207` (V19 template-only)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/assembly/shell-tail.html:309-315` (`el()` → `setAttribute` for any key)
  - `plans/261031-1651-lesson-06-redis-teacher-guide/assembly/assemble.mjs:136, :154` (JSON `<` escaping, which is fine and must be kept)
  - Plan: phase-06:23, phase-07:35
- **Suggested fix:**
  1. Extend V19 to fail on any `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write` in `assembly/widgets/*.js` and in the shell script block, unless the right-hand side is a string literal with no interpolation.
  2. In `el()`, reject attribute names matching `/^on/i`, and reject `href`/`src` values that do not match `^(#|\.\.?/|https://)`.
  3. Add negative cases for concatenation, `on*` attributes and `javascript:` hrefs.
  4. State in contract §4 that `H.lanes` builds DOM only through `el()`.

## Finding 10: Nothing on study day stops Đạt from running K2L04 write commands on the L06 DBX connection
- **Severity:** Medium
- **Location:** Phase 06 T6.3 `#cach-hoc` (DBX `ADVANCE_BE_K2L04_REDIS`); Phase 07 fragment item 10 (`kiem-chung`) and stage "Tự làm" writes (`MSET` of post 77 counters, `my-traffic` keys); evidence §9 item 3.
- **Flaw:** Đạt already has the DBX connection `ADVANCE_BE_REDIS` → `127.0.0.1:6379`, which is L06 (kongming-investigation-counsel.md:41). Both containers listen on 6379 internally and both are `redis:7.2.3`, so DBX's console looks the same on either. Many K2L04 "Tự làm" steps are single commands that write `k2l04:*` keys. The stage 1 challenge, for example, is "hashtag post 77's 4 counters, `MSET`" (phase-07:44). If they run on the L06 connection, L06 `check.sh` C07 fails ("any key in db 0 whose prefix is not `l06:`"). The build-time fingerprint `l06_k2l04_keys` protects only the build window, not study day. The plan has no in-guide "am I on the right instance" check.
- **Failure scenario:** Đạt opens DBX from his L06 session, keeps the old connection selected, and pastes the stage 1 `MSET k2l04:post:{77}:…`. L06 C07 goes ✘ and his L06 progress check reports breakage he did not cause in L06.
- **Evidence:** `labs/lesson-06-redis/check.sh:83-89` (C07 rule); `evidence-packet.md:176` (C07 impact), `evidence-packet.md:294`; `kongming-investigation-counsel.md:41`; plan phase-06:41, phase-07:44.
- **Suggested fix:** Make every DBX block in the guide start with the sentinel `GET k2l04:seed:version` and the expected reply `"v1"`, which exists only on the K2L04 main after the seed. Add the instruction "nếu ra (nil) → bạn đang ở ADVANCE_BE_REDIS (L06), đổi kết nối". Add a V-rule requiring the sentinel before the first write command in each `chang-N`. Also have `check.sh` print an info line if `127.0.0.1:6379` holds any `k2l04:*` key; this is read-only, using `--scan` through `docker exec advance-be-redis`, but only from the controller fingerprint, not from learner tooling.

---

## Fact-check (claims sampled across phases)

| # | Claim (plan location) | Result | Evidence |
|---|---|---|---|
| 1 | L06 `verify/record-all.sh` exists as the copy source (phase-03 T3.1b) | VERIFIED | `plans/261031-1651-lesson-06-redis-teacher-guide/verify/record-all.sh:16` |
| 2 | L06 `verify/fingerprint.sh` is the base, with `port6380_lab` / `main_bind` / `run_id_match` (phase-01 T1.1) | VERIFIED | `…/verify/fingerprint.sh:39-46`; its exclusion is `advance-be-redis*` (`:20`), which the plan changes |
| 3 | `run-redis.mjs` is the runner base with a name GUARD (phase-02 T2.2) | VERIFIED | `…/verify/run-redis.mjs:30, :34` |
| 4 | The runner guard covers "foreign containers" in all modes (plan.md:171, phase-02:45) | FAILED | Tool mode `runTool` has no `dockerCalls` guard: `…/verify/run-redis.mjs:228-237` |
| 5 | `displayText` strips `#` lines from `.redis` and keeps `.sh` verbatim (phase-02 T2.1) | VERIFIED | `…/verify/lab-text.mjs:27-32` |
| 6 | `dockerCalls` supports the V17 container guard for destructive Docker verbs (phase-02 T2.6) | VERIFIED with a gap | `…/verify/lab-text.mjs:58, :78`; no targets for `volume rm` / `container rm` |
| 7 | L06 `check.sh:136` matches the substring `advance-be-redis-` (evidence §5) | VERIFIED | `labs/lesson-06-redis/check.sh:136` |
| 8 | L06 lint has the 6380 rule with a `# guard-port` exemption (phase-02 V17, phase-03:28) | VERIFIED | `…/verify/verify-guide.mjs:485` |
| 9 | V15 base regex, extended by "PGPASSWORD\|postgres://" (phase-02:112) | VERIFIED, but the extension misses `postgresql://` | `…/verify/verify-guide.mjs:358`; `omnipos-finledger-hub/.env.example:1` |
| 10 | V19 enforces `esc()` for widget HTML (phase-07:35, negative q) | VERIFIED (template-literal form only) | `…/verify/verify-guide.mjs:192-207` |
| 11 | Shell keeps `esc()`, `el()` and GUIDE_DATA; JSON is embedded safely (phase-06 T6.1) | VERIFIED | `…/assembly/shell-tail.html:304, :309`; `…/assembly/assemble.mjs:136, :154` |
| 12 | `H.lanes` exists to copy (phase-06 T6.1 "add") | VERIFIED as new code: only `.lanes` CSS exists in L06 | `…/assembly/shell-head.html:16-23`; no JS helper in `shell-tail.html` |
| 13 | L06 one-liners at `lesson_06_redis_teacher_guide.html:4532` and `shell-tail.html:219` (phase-10) | VERIFIED | grep `K2 Bài 04` → `:4532`, `:219` (1 hit each) |
| 14 | The curriculum line is identical at `generate_master_curriculum_reports.py:447`, `…MASTER_CURRICULUM.md:419`, `.html:1806` (phase-10) | VERIFIED | `sed -n` on each line shows "Slide 39 trang kèm so sánh ưu nhược điểm 5 thuật toán Rate Limiting." |
| 15 | README Khóa 3 section ≈ line 29 (phase-10) | VERIFIED | `README.md:29` |
| 16 | Render-check script path (phase-08 T8.5) | VERIFIED | `C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs` exists |
| 17 | The image prefix `…/assets/04_Caching/` exists and the guide output folder exists and is empty (phase-06 T6.1, evidence §1) | VERIFIED | `ls` shows `page_01_img_01.png …`; the `reports/Khóa 3…/` listing is empty |
| 18 | D04 links `4_layers_cache_overview.html` (plan matrix) | VERIFIED, path unstated | `reports/advanced_backend/4_layers_cache_overview.html`; the link from `G` must be `../advanced_backend/…` |
| 19 | L06 CLIs: verifier `--only`, negatives `--labs-only/--guide-only/--data-only/--hw-only`, `rerun-gate --only`, `widget-smoke --help/--guide`, `assemble --allow-stubs` | VERIFIED | `verify-guide.mjs:634`; `negative-tests.sh:22`; `rerun-gate.mjs:16`; `widget-smoke.mjs:13, :24`; `assemble.mjs:8` |
| 20 | The Docker VM clock runs ~8 % fast (plan risk table) | VERIFIED | `plans/261031-1651-lesson-06-redis-teacher-guide/controller-facts-addendum.md:22` |
| 21 | L06 `00-containers.sh` "recreates only on drift" behaviour is safe to copy (phase-03:28) | VERIFIED as auto-recreate without `--recreate` when image and volume match, so the copy is unsafe | `labs/lesson-06-redis/00-containers.sh:82-101` |
| 22 | L06 `99-cleanup.sh` excludes `my`/`hw` and does no prune (phase-03:28) | VERIFIED | `labs/lesson-06-redis/99-cleanup.sh:19-20, :8` |
| 23 | `$L` does not exist yet, so nothing is pre-written | VERIFIED | `ls labs` shows no `k2-*` |
| 24 | pgbench 16 `-d` = `--debug`, so the DB name is positional (must-fix 2) | UNVERIFIED locally (Docker down); consistent with PG 16 docs | n/a |
| 25 | `pgbench -f /dev/stdin` works in Alpine (S11) | UNVERIFIED | `kongming-investigation-counsel.md:92` rates it "medium" |
| 26 | Live state: `advance-be-redis` on `127.0.0.1:6379`, PG on `0.0.0.0:5433` (evidence §5) | UNVERIFIED (Docker Engine not running at review time) | `docker ps` error on the pipe |
| 27 | `host.docker.internal` from a K2L04 container reaches the 127.0.0.1-published L06 port (Finding 5) | UNVERIFIED (assumption about Docker Desktop behaviour) | n/a |

## Unresolved questions
1. Does the company app on `quan-ly-hop-dong-postgres-1` run DDL or migrations during the build window? This decides whether a hard `pg_objects` gate (Finding 2) needs an "ask user" path.
2. Does the official image's `pg_hba.conf` in this container trust `127.0.0.1`? This decides whether the sidecar alternative in Finding 4 needs no password.
3. Will Đạt keep using L06 extras during the K2L04 build? This decides how strictly the L06 hash lines should gate (Finding 6).
