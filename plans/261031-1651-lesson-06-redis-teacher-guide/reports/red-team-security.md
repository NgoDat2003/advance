# Red team — Security Adversary / Fact Checker — Lesson 06 Redis plan

Scope: `plan.md`, `phase-01..09`, `evidence-packet.md`, `controller-facts-addendum.md`, `verify/ultra-plan/verdict.md`. The 8 "Materialization must-fix" items (plan.md:151-160) are not re-reported here.
Machine checks were read-only, run 2026-10-31: `docker ps -a`, `docker network ls`, `docker volume ls`, `netstat -ano`, `CONFIG GET`, `docker inspect --format`. Env values were redacted at the source.

## Finding 1: The main lab Redis has no auth and listens on 0.0.0.0, so anyone on the LAN can reach it, and the plan keeps it that way
- **Severity:** High
- **Location:** phase-03 container lifecycle table (`advance-be-redis` row, "Published 6379:6379"); evidence-packet §5; acceptance criteria 7 and 11.
- **Flaw:** The plan's network safety only covers port 6380 and the company containers. It never limits the host bind address of 6379. The recreate in phase 03 publishes `6379:6379` again, which binds to all host interfaces, with no `requirepass` or ACL. Redis inside the container has `bind *` and `protected-mode no`. The recreate also mounts `labs/` and adds `--enable-debug-command local`. That leaves EVAL, CONFIG SET, FLUSHALL, REPLICAOF, SCRIPT and KEYS open to any host on the LAN or office Wi-Fi. Only DEBUG is blocked for remote clients, because `local` only allows loopback or a unix socket.
- **Failure scenario:** Đạt studies on a laptop on the F&B company LAN or café Wi-Fi. Another host sends `REPLICAOF <attacker> 6379`, or just `FLUSHALL`. The main lab data, `l06:my:*`, and the run evidence he is reproducing are replaced. `REPLICAOF` from a rogue master is a well-known Redis attack. `check.sh` has no row for the bind address, and the fingerprint skips every `advance-be-redis*` container (phase-01:22), so nothing reports it.
- **Evidence:**
  - `phase-03-containers-experiments-runs.md:35` publishes `6379:6379`.
  - `docker inspect advance-be-redis` → `{"6379/tcp":[{"HostIp":"","HostPort":"6379"}]}`.
  - `docker ps` → `0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp`.
  - `netstat -ano` → `TCP 0.0.0.0:6379 LISTENING 30744`.
  - `CONFIG GET bind` → `* -::*`; `CONFIG GET protected-mode` → `no`; `ACL WHOAMI` → `default` (no auth).
  - `evidence-packet.md:49` shows the original `-p 6379:6379`.
- **Suggested fix:**
  - Publish as `-p 127.0.0.1:6379:6379` in `00-containers.sh`.
  - Add a `check.sh` row C15 that asserts `docker inspect -f '{{json .HostConfig.PortBindings}}'` contains `"HostIp":"127.0.0.1"`.
  - Add a `--lint` rule that rejects `-p 6379:` with no IP.
  - In `#cach-hoc`, add one Vietnamese line explaining why the lab binds to loopback only.
  - Re-run the addendum's run_id equality check after the recreate (see Finding 2).

## Finding 2: Host-side clients reach "whatever answers on localhost:6379", and no step checks it is the lab container
- **Severity:** High
- **Location:** phase-04 tasks 2 and test matrix (`hw-check.sh`, `hw-solution.mjs`, row "hw keys cleaned"); phase-05 task 2 (DBX `ADVANCE_BE_REDIS`); controller-facts-addendum item 1.
- **Flaw:**
  - Two different processes own 6379 on the host: Docker's backend on 0.0.0.0/[::], and `wslrelay`, which forwards to WSL, on 127.0.0.1/[::1].
  - The addendum says to "re-check run_id after any container recreate", but no phase does it, even though phase 03 recreates main.
  - `hw-solution.mjs` uses node-redis from the host. Its default is `redis://localhost:6379`, the same as lesson 02 (`labs/lesson-02-caching/06-...mjs:13`). On Windows, `localhost` usually resolves to `::1` first, which is the wslrelay listener.
  - `hw-check.sh` "resets `l06:hw:*`" with no stated transport. The phase-04 test row uses a bare host `redis-cli`, which does not exist on this host (`evidence-packet.md:54`).
- **Failure scenario:** After Finding 1's fix, or after Đạt later runs a Redis in WSL for the OmniPOS hub, `localhost`/`::1` reaches a different server. The homework writes and deletes `l06:hw:*` there and reports ✔ or ✘ against the wrong instance. DBX shows a different keyspace from `docker exec`. The phase-04 test row fails with "command not found", and someone "fixes" it with an unguarded host install.
- **Evidence:**
  - `controller-facts-addendum.md:5` (two listeners; re-check run_id after recreate).
  - `netstat -ano` shows `127.0.0.1:6379 … 8712` and `[::1]:6379 … 8712` (wslrelay), next to `0.0.0.0:6379 … 30744`.
  - `phase-04-widget-data-homework-driver.md:32` (reset with no transport), `:38` (node-redis), `:60` (`redis-cli --scan` on the host).
  - `phase-03-containers-experiments-runs.md:35` (recreate).
  - `labs/lesson-02-caching/06-redis-imdb-read-aside-and-stampede.mjs:13`.
- **Suggested fix:**
  - `hw-check.sh` does all of its reset, assert and cleanup through `docker exec advance-be-redis redis-cli`.
  - `hw-solution.mjs` defaults to `REDIS_URL=redis://127.0.0.1:6379`. Before its first write, the check compares host `INFO server run_id` with `docker exec … INFO server run_id` and aborts on a mismatch.
  - Add a `check.sh` row with the same run_id equality check for host vs container (covers DBX).
  - Change the phase-04:60 row to `docker exec advance-be-redis redis-cli --scan --pattern 'l06:hw:*' | wc -l`.

## Finding 3: `99-cleanup.sh` deletes Đạt's own keys and the seed, and phase 09 runs it right before handoff
- **Severity:** High
- **Location:** plan.md "Risks and rollback" rollback line; phase-09 task 4; phase-05 task 2 (prep); phase-01 §1 key registry.
- **Flaw:**
  - Cleanup "UNLINKs `l06:*` on main", which includes `l06:my:*` (marked "learner; never removed by seed"), `l06:hw:*` and all seed keys.
  - Phase 09 runs `99-cleanup.sh` to take the extra containers down before handoff.
  - The learner prep is `00-containers.sh up main` then `check.sh`, with no `00-seed`.
  - The contract's protection for `l06:my:*` only covers the seed, not cleanup.
  - "Extras down" and "wipe keys" are one command, so the learner has to delete his work just to free memory.
- **Failure scenario:** On 2026-11-02 Đạt follows `#cach-hoc`. `check.sh` shows ✘ for C08–C10 (the seed is gone) on his first step, so trust in the page is gone straight away. Later he runs `99-cleanup.sh` after stage 3 to stop `-evict`, which silently deletes his `l06:my:kitchen` challenge (stage 5) and his homework state.
- **Evidence:**
  - `plan.md:144` ("UNLINKs `l06:*` on main, … removes the extra … containers").
  - `phase-09-docs-final-gate-handoff.md:35` ("extras down via `99-cleanup.sh`").
  - `phase-05-guide-shell-assembler.md:29` (prep runs `up main`, `check.sh`, no seed).
  - `phase-01-contract-baseline-smoke.md:33` (`l06:my:*` "never removed by seed").
  - `phase-03-containers-experiments-runs.md:57`.
- **Suggested fix:**
  - Split the commands. `00-containers.sh down <extra>` removes only the containers and the network. `99-cleanup.sh --keys` UNLINKs `l06:*` except `l06:my:*` and `l06:hw:*`, unless `--include-mine` is given.
  - In phase 09, use `down` and not cleanup, then run `00-seed` and `check.sh`, and record rc 0 in `final-gate.txt`.
  - Add `00-seed` to the `#cach-hoc` prep.

## Finding 4: The safety guards only check container names, not what each command does to which container, so a destructive step can hit main undetected
- **Severity:** High
- **Location:** phase-02 task 2 (runner guard) and task 3 V16; phase-03 tasks 2 (`03-eviction.sh`, `04-persistence.sh`, `07-architecture.sh#partition/failover`); phase-01 §5 (two terminals A/B on main); phase-06 stage 3 challenge.
- **Flaw:**
  - The guard `^advance-be-redis(-[a-z]+)?$` accepts main for every operation.
  - V16 checks FLUSHALL/FLUSHDB per *file*, by `#@ ct`, but `#@ ct` is a `.redis` directive. The `.sh` files hold the real destructive steps: `FLUSHALL` on `-evict`, `docker kill`, `docker network disconnect`, `REPLICAOF`. So either the lint flags the legitimate eviction script (and gets weakened with an exemption), or it does not check `.sh` files at all.
  - Nothing ties `docker kill|start` to `-rdb|-aof` only, `REPLICAOF` to the replica only, or `CONFIG SET maxmemory*` to `-evict` only.
  - The fingerprint and C14 skip every `advance-be-redis*` container, so damage to main is invisible to them.
  - The stage 3 challenge tells the learner to type `CONFIG SET maxmemory`/`volatile-lru` "on `-evict`", while the contract keeps both of his terminals on main.
- **Failure scenario:**
  - Đạt pastes the failover region's `REPLICAOF advance-be-redis-replica 6379` (or the eviction `FLUSHALL` / `CONFIG SET maxmemory 3mb`) into terminal A, which is `docker exec -it advance-be-redis redis-cli`. Main full-syncs from the replica, or is flushed or capped, and his `l06:my:*` is gone.
  - Separately, a `docker kill "advance-be-redis${X}"` with an empty suffix passes the guard and kills main in the middle of a stage.
- **Evidence:**
  - `phase-02-tests-first.md:32` (the guard regex admits main).
  - `phase-02-tests-first.md:40` (FLUSHALL rule keyed on `#@ ct`).
  - `phase-03-containers-experiments-runs.md:66` (FLUSHALL in `.sh`), `:67` (`docker kill`), `:71` (disconnect, REPLICAOF).
  - `phase-01-contract-baseline-smoke.md:22` (fingerprint skips `^advance-be-redis`), `:31` (two terminals on main).
  - `phase-06-stage-fragments.md:40` (volatile-lru challenge).
- **Suggested fix:**
  - Make V16 check each line against a per-operation allowlist:
    - `FLUSHALL|FLUSHDB|CONFIG SET maxmemory(-policy)?` only on lines that contain `docker exec advance-be-redis-evict`;
    - `docker (kill|start)` only on `advance-be-redis-(rdb|aof)`;
    - `docker network (dis)?connect` only on `advance-be-redis-replica`;
    - `REPLICAOF` only through `docker exec advance-be-redis-replica`.
  - Never put these commands in a `.redis` block meant for pasting into a main terminal. Show them only as single `docker exec <ct> redis-cli …` lines.
  - Add a negative test: `docker kill advance-be-redis` in a lab copy → V16.
  - Add a `check.sh` row asserting main is `role:master` with `connected_slaves` ≤ 1.

## Finding 5: The plan says DEBUG SET-ACTIVE-EXPIRE is always restored, but the lint only checks CONFIG SET, and only that the key appears again
- **Severity:** Medium
- **Location:** plan.md risk row "A config change on main is left behind"; acceptance criterion 7; phase-02 V16; phase-03 test matrix "config restored".
- **Flaw:**
  - The risk table claims every `CONFIG SET`/`DEBUG SET-ACTIVE-EXPIRE` region ends with its restore. V16 only checks `CONFIG SET x without a later CONFIG SET x`. It never checks `DEBUG SET-ACTIVE-EXPIRE 0` (R15 on main).
  - It does not check that the later value is the default: `CONFIG SET maxmemory 3mb … CONFIG SET maxmemory 2mb` passes.
  - C11/C12 run only after stages 1, 3 and 6, in controller runs. On the learner side, a block pasted into redis-cli keeps going after errors, and an aborted paste (Ctrl-C during the `#@ sleep` wait) leaves active expiry off on the long-lived main.
- **Failure scenario:** The R15 region is edited during phase 08 fixes, and its restore line `DEBUG SET-ACTIVE-EXPIRE 1` is lost. The lint stays GREEN. Main keeps expired keys until they are touched, so later stage results (R16 `expired_keys`, stage 9 bucket TTLs) shift. Đạt's main also keeps this state into the OmniPOS work.
- **Evidence:**
  - `plan.md:139` (claims DEBUG is restored).
  - `phase-02-tests-first.md:40` (V16 covers only `CONFIG SET x`).
  - `plan.md:77` (R15 `DEBUG SET-ACTIVE-EXPIRE 0` … restored to 1).
  - `phase-03-containers-experiments-runs.md:93` (C11/C12 only after stages 1, 3, 6).
  - `phase-03-containers-experiments-runs.md:46` (`reset main` exists but is not in the learner's per-stage flow).
- **Suggested fix:**
  - Extend V16: a `DEBUG SET-ACTIVE-EXPIRE 0` region must end with `DEBUG SET-ACTIVE-EXPIRE 1`.
  - Each restore `CONFIG SET x v` must have `v` equal to the C11 default table (a frozen map in the verifier).
  - Add negative tests `n` (DEBUG with no restore) and `o` (restore to a non-default value).
  - The guide ends each of stages 1, 3 and 6 with a `00-containers.sh reset main` + `check.sh` line, and C11/C12 run after every stage in `record-all.sh`.

## Finding 6: The fingerprint misses volumes, networks and images, and cleanup "removes anonymous volumes" without saying how
- **Severity:** Medium
- **Location:** phase-01 task 1 (fingerprint fields); acceptance criterion 11; plan.md rollback line; phase-03 container table ("Down" column).
- **Flaw:**
  - The only proof that nothing outside the lab changed is a container list plus `:6380`.
  - The machine has 19 volumes (11 anonymous hashes plus `quan-ly-hop-dong_postgres-data` and others) and 3 project networks. Their containers are mostly exited.
  - The plan says cleanup "removes the extra `advance-be-redis-*` containers with their anonymous volumes" and "removes network `advance-be-l06`". It never requires exact-name `docker rm -v <name>` / `docker network rm advance-be-l06`, and it never forbids `docker volume prune` / `docker network prune` / `docker system prune`.
  - An exited project's network or anonymous volume can be removed by a prune, and the fingerprint would still be equal.
- **Failure scenario:** The implementer writes `docker volume prune -f` after a failed `rm -v` to "clean anonymous volumes". Dangling volumes from other projects are lost, and `diff runs/00-fingerprint-before.txt runs/00-fingerprint-after.txt` stays empty, so the final gate passes.
- **Evidence:**
  - `phase-01-contract-baseline-smoke.md:22` (fingerprint = containers + `:6380` only).
  - `plan.md:126`, `plan.md:144`.
  - `docker volume ls` lists 19 volumes, including `quan-ly-hop-dong_postgres-data`, `quan-ly-hop-dong_minio-data`, and anonymous `1b70b23f…`, `6c1db146…`.
  - `docker network ls` lists `quan-ly-hop-dong_default`, `frappe_docker_devcontainer_default`, `getting-started-todo-app_default`.
- **Suggested fix:**
  - Add three sorted sections to `fingerprint.sh`: `docker volume ls -q` minus volumes attached to `advance-be-redis*`, `docker network ls --format '{{.Name}}'` minus `advance-be-l06`, and `docker image ls --format '{{.Repository}}:{{.Tag}}'`.
  - V16 bans `prune` and `docker rm` with no explicit allowed name in `labs/` and `verify/`.
  - Cleanup removes by exact name only.

## Finding 7: The fingerprint inspects company containers that hold JWT/MinIO/DB secrets, and V15 only scans the guide for Redis-style secrets
- **Severity:** Medium
- **Location:** phase-01 task 1 (`docker inspect` on every non-lab container, written to `runs/00-fingerprint-before.txt`); phase-02 V15.
- **Flaw:**
  - The fingerprint calls `docker inspect` on `quan-ly-hop-dong-*`. Those containers carry `POSTGRES_PASSWORD`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and `MINIO_SECRET_KEY` (values redacted in this check).
  - The plan names only the output fields. It does not require `--format` with exactly those fields, and it does not add a secret scan on `runs/`.
  - V15 (`requirepass|AUTH |redis://[^ ]*@`) runs on the guide only. It would miss `postgres://u:p@`, `*_SECRET=`, or `PASSWORD=`.
  - `runs/` stays in the repo uncommitted. The most recent commit (`637e2f0 chore(handoff): redact internal db alias`) shows this repo has already had to redact this kind of data once.
- **Failure scenario:** For a stronger fingerprint, the implementer dumps `docker inspect … | jq '.[].Config'` or uses `{{json .Config}}` to "detect any change". The company JWT secrets and DB URL end up in `runs/00-fingerprint-before.txt`, are hashed into `manifest.tsv`, and are later committed or copied by Đạt. V15 passes.
- **Evidence:**
  - `phase-01-contract-baseline-smoke.md:22`.
  - `phase-02-tests-first.md:39` (V15 pattern).
  - `evidence-packet.md:62` ("No secrets / connection URLs with passwords printed").
  - `docker inspect quan-ly-hop-dong-api-1 --format '{{range .Config.Env}}…'` (values redacted) lists `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MINIO_SECRET_KEY`, `DATABASE_URL`.
  - `docker inspect quan-ly-hop-dong-postgres-1` lists `POSTGRES_PASSWORD`.
- **Suggested fix:**
  - Fix the fingerprint command in phase 01 as `docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}'` (after must-fix 7), and ban `.Config`/`Env` in `fingerprint.sh`.
  - Run V15 over `runs/**`, `labs/**` and the guide, with an extended pattern: `(PASSWORD|SECRET|ACCESS_KEY)=|[a-z]+://[^ /]*:[^ @]*@|requirepass|AUTH `.
  - Add a negative test `p` that plants `JWT_ACCESS_SECRET=x` in a run copy.

## Finding 8: The lesson 02 guide's Redis setup creates the same container and points non-`l06:` labs at it, so following the plan's own "review lesson 02" link breaks lesson 06's safety invariants
- **Severity:** Medium
- **Location:** phase-05 task 2 ("Nhắc nhanh Bài 02 … links to L02"); phase-02 C07; phase-03 main recreate.
- **Flaw:**
  - The lesson 02 guide tells the learner to `docker run -d --name advance-be-redis -p 6379:6379 redis:7.4-alpine`, with a different image and no lab flags.
  - Its stampede lab writes `imdb:top10:*` and `lock:*` to `localhost:6379`.
  - Lesson 06 reuses the same container name, runs C07 "no key on main outside `l06:`", and pins 7.2.3 results.
  - The plan never says what happens when Đạt re-runs lesson 02 lab 06, which the "Nhắc nhanh Bài 02" box invites. It also does not say whether `00-containers.sh` detects an image other than `redis:7.2.3`, since the plan says it compares only `.Config.Cmd`.
- **Failure scenario:**
  - Đạt re-runs `06-redis-imdb-read-aside-and-stampede.mjs` to refresh his memory. C07 then shows ✘. The guide offers no fix for this, so the obvious move is `FLUSHALL` on main, which wipes `l06:my:*`.
  - Or he follows the lesson 02 guide's "docker run" after a `docker rm`. Main is now 7.4-alpine, `00-containers.sh` only compares Cmd, and every "Đúng trên Redis 7.2" chip is now checked against the wrong version.
- **Evidence:**
  - `reports/advanced_backend/lesson_02_caching_teacher_guide.html:992` (`docker run -d --name advance-be-redis -p 6379:6379 redis:7.4-alpine`).
  - `labs/lesson-02-caching/06-redis-imdb-read-aside-and-stampede.mjs:13` (`redis://localhost:6379`), `:40` (`imdb:top10:`), `:63` (`lock:${key}`).
  - `phase-02-tests-first.md:46` (C07).
  - `phase-03-containers-experiments-runs.md:44` (recreate only when `.Config.Cmd` differs).
- **Suggested fix:**
  - `00-containers.sh` compares `.Config.Image` + Cmd + PortBindings.
  - `check.sh` C01 asserts `redis_version:7.2.3`.
  - C07's ✘ message names the lesson 02 key prefixes and gives a scoped fix: `--scan --pattern 'imdb:*'` / `'lock:*'` + UNLINK, never FLUSHALL.
  - The "Nhắc nhanh Bài 02" box says lesson 02 lab 06 shares this container and that its keys are cleaned by that command.

## Finding 9: The widget/HTML escaping contract is not frozen for the three fragment delegates, and no verifier rule covers it
- **Severity:** Medium
- **Location:** phase-06 "Fragment format (frozen)" widget rules; phase-02 V-list; phase-07 task 4 (`widget-smoke.mjs` only checks "no throw").
- **Flaw:**
  - Lesson 07's assembler escapes code (`esc`) and encodes `<` in embedded JSON as `<`. Its widgets build output with `innerHTML` template strings and depend on each author calling `esc()` every time.
  - The lesson 06 widget rules cover only IIFE, null guard, no globals, 44 px controls and id prefix. They never require `esc()`/`textContent` for run-derived strings.
  - No V-rule or negative test checks it. `widget-smoke.mjs` only asserts that nothing throws.
  - Redis run data in this lesson is full of `<`, `>` and `&`: Lua sources (`if tokens < 1`), placeholders (`<now>`, `<id>`, `<key>`), `retry_after_ms`, and `INFO`/`MEMORY STATS` lines.
- **Failure scenario:** Delegate D3 writes `out.innerHTML = '<pre>' + D.rows[i].cmd + '</pre>'` for W9/W8 from run JSON that contains `--eval /lab/lua/token-bucket.lua … , <now>`. `<now>` is parsed as an element and disappears. V07 still passes because the numbers come from `.json` and not the DOM. If a planted run or data value contains `<img src=x onerror=…>`, it runs inside a guide that Đạt opens from `file://` with localStorage. widget-smoke still passes because nothing throws.
- **Evidence:**
  - `phase-06-stage-fragments.md:35` (widget rules, no escaping rule).
  - `phase-07-assemble-verify-render.md:23` (smoke checks only "no throw").
  - `plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/assemble.mjs:16` (`esc`), `:65` (`<` encoding).
  - `…/assembly/widgets/w1.js:25`, `w2.js:45`, `w3.js:24` (the `innerHTML` pattern being copied).
  - `phase-03-containers-experiments-runs.md:69` (`, <now>` in a lab command).
- **Suggested fix:**
  - Contract §4: every run- or data-derived string reaches the DOM only through `textContent` or a shared `esc()` defined once in `shell-tail.html`.
  - Add V17: grep each `widgets/*.js` for `innerHTML` template interpolations `${…}` that are not wrapped in `esc(`.
  - Add negative test `q`: inject `"<b id=xss>"` into a `wN.json` copy. `widget-smoke.mjs` renders it in jsdom/vm and must find the literal text and no `#xss` element.

## Verified non-issues (brief)
- `--enable-debug-command local`: remote (port-forwarded) clients are not "local", so DEBUG is not exposed to the LAN. `docker exec … redis-cli` connects over loopback inside the container and is allowed. The risk is the other commands (Finding 1), not DEBUG.
- Port 6380: currently free (`netstat -ano` shows no `:6380` listener), and the lint and fingerprint guard it. No finding.

Status: DONE_WITH_CONCERNS
Summary: 9 findings (4 High, 5 Medium). The biggest are the unauthenticated 0.0.0.0:6379 bind that the recreate keeps, unverified host-to-container client identity, the cleanup/handoff step that wipes the learner's keys and seed, and container-name-only guards that let destructive steps reach main.
