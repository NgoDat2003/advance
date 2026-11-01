# Code review ultra · reviewer 5 of 5 · Lesson 06 Redis guide

Scope: the packet scope (guide sources in `assembly/`, `labs/lesson-06-redis/**`, `verify/**`, with `runs/**` as read-only evidence). Read-only throughout. Live queries I ran on main: `INFO keyspace`, `CONFIG GET`, `--scan`, plus one read-only `EVAL` that calls only `TIME` and touches no keys. I also ran one `bash -i` probe inside my own shell. Redis 7.2.3 source was fetched from `raw.githubusercontent.com/redis/redis/7.2.3`. node-redis 6.3.0 typings were checked on unpkg.

---

## F1 · Two-terminal `.redis` scenarios in stages 1, 2, 5 and 6 cannot be paced as written, so the learner's results will not match the recorded runs

- **Severity:** Important
- **Dimension:** 4 (teaching format: two-terminal pacing). Also 3: the verifier cannot see this.
- **Location:**
  - `assembly/shell-head.html:131-132`
  - `assembly/fragments/stage-01.html:155,160`
  - `assembly/fragments/stage-02.html:244,251,261`
  - `assembly/fragments/stage-05.html:92,104,126`
  - `assembly/fragments/stage-06.html:88`
  - Runner: `verify/run-redis.mjs:79-83,121`
- **Evidence:**
  - The generic protocol says "Dán khối B … Trong 5 giây đó, dán khối A … Với khối `.redis` … không có `sleep`: bạn tự canh nhịp theo cột thời gian". Each walk table says to paste the whole B region, for example stage 2 step 2: "Region `lost` của `02-json-race.B.redis`: B đứng chờ ở BLPOP".
  - The rendered `pre[data-cmd]` blocks have the `#@ sleep` lines stripped. Example, stage 2 B: `BLPOP … 5 / GET / SET …age:30…xyz / GET / HSET email / HMGET`.
  - In interactive `redis-cli`, pasted lines wait in the tty buffer behind the blocking `BLPOP`. When it returns, they all run back to back in milliseconds. You cannot "wait 1 s" between lines that are already queued.
  - Only stages 8 and 9 avoid this, with "Chỉ dán dòng BLPOP …" and per-line steps (`stage-08.html:89,109,128`, `stage-09.html:105`).
  - The recorded runs were produced by `run-redis.mjs`, which honours the hidden directives: `if (dir[1] === 'sleep') pending += …` and `if (st.sleepMs) await sleep(st.sleepMs)`. So `rerun-gate` and `--runs` only ever check the paced version, never what the learner can actually paste.
- **Failure scenario:**
  - **Stage 2:** B pastes its region. B's JSON `SET` (age 30, xyz) and its `HMGET` run about 5 ms after release. A, following the table, waits 0.5 s before its own `SET` and 1 s before `HINCRBY`. The final JSON is age 31 with dat@abc.vn, so B's email is lost, not A's age as the guide says (`stage-02.html:263`: "chuỗi cuối còn \"age\":30"). B's `HMGET` returns `"30"` instead of the expected `1) "31"`.
  - **Stage 5 queue:** A's `LPUSH` and `BRPOP` fire without the 1 s and 0.3 s gaps. Whoever's `BRPOP` reaches the server first takes `o1`, so quiz Q2 ("B nhận o1") becomes a coin flip.
  - **Stage 1:** B's `PING` can land before A's `DEBUG SLEEP 2` and return `PONG` immediately.
  - **Stage 5 getset:** the outcome is fixed in advance. Both sides send the literal `SET l06:cnt:views 1`, so the final value is `"1"` even when B actually read `"1"` and no race happened.
- **Suggested fix:**
  - Apply the stage-8 pattern everywhere: step 2 says "Chỉ dán dòng `BLPOP …`", and the following steps hand each remaining line (or small group) to A or B with the wait shown.
  - Change `shell-head.html:131` from "Dán khối B" to "dán dòng BLPOP của B".
  - Add a lint or verify rule: any A/B `.redis` region with an `#@ sleep` must be rendered behind a per-line walk table, not as a single paste block.

## F2 · `hw-check.sh` H5 passes when nothing was proven: a crashed program, or the slide-40 `SET NX` + plain `DEL` bug when `HOLD_MS` is ignored

- **Severity:** Important
- **Dimension:** 3 (vacuous check). Also 4 (homework checker).
- **Location:** `labs/lesson-06-redis/hw-check.sh:74-78,88`
- **Evidence:**
  - The background holder is: `while [ "$(redis-cli EXISTS …)" = 0 ] && [ $i -lt 3000 ]; do …; done; while [ … = 1 ] && [ $i -lt 6000 ]; …; redis-cli SET l06:hw:lock:FA634:A34_S012C hw-check-holder2 NX PX 5000' >/dev/null &`.
  - H5 is then decided only by `after=$(rcli GET "$LOCK")` and `[ "$after" = hw-check-holder2 ]`.
  - Nothing records whether the holder ever saw the program's lock, whether its `SET` returned `OK` while the program was still running, or whether `HW_CMD` succeeded. A failure at line 76 only prints "HW_CMD lỗi".
- **Failure scenario:**
  - **(a) The program never holds the lock.** This covers a crash, `ECONNREFUSED`, or a solution that skips `sleep(HOLD_MS)` and holds the lock for only 1–3 ms, which is less than one in-container `redis-cli` fork. Loop 1 spins its 3000 iterations without ever seeing the lock, loop 2 exits at once, and the holder sets `hw-check-holder2` with nobody left to delete it.
  - **(b) The result.** The checker prints "✔ H5 trả khóa compare-and-delete" for a program that releases with plain `DEL`, which is exactly the bug H5 exists to catch. It also prints ✔ H5 for a program that never ran.
  - The seeded bad fixture (`verify/hw-bad-fixture.mjs`) honours `HOLD_MS`, so it never hits this path. That is why `runs/hw-check.bad.txt` shows ✘ H5.
- **Suggested fix:**
  - Have the holder emit its state, e.g. `echo "seen=$seen set=$(redis-cli SET … NX PX 5000)"`, and capture it with `holder_out=$(…)` instead of discarding it.
  - Pass H5 only when all of these hold: `seen=1`, `set=OK`, the H5 `HW_CMD` exit code is 0, and `after = hw-check-holder2`.
  - Otherwise print "✘ H5 không kiểm được (khóa của bạn chưa từng được thấy / chương trình lỗi)".
  - Add a negative fixture with `SET NX PX` + `DEL` and no hold to `negative-tests.sh`.

## F3 · Pasting the mandated `set -u` into the learner's interactive Git Bash leaves it set and breaks git tab-completion for the rest of the session

- **Severity:** Minor
- **Dimension:** 2 (learner machine / shell variants)
- **Location:**
  - `assembly/contract.md:49` ("each region has a `set -u` line")
  - Every `.sh` region, for example `labs/lesson-06-redis/03-eviction.sh:11`
  - `assembly/shell-head.html:115` ("dán từng dòng vào Git Bash")
  - The 60 `set -u` occurrences in the built guide
- **Evidence:** I ran this in this machine's Git Bash:
  `bash -i -c 'set -u; …; COMP_WORDS=(git sta); COMP_CWORD=1; …; __git_wrap__git_main'`
  It printed `bash: words_[j]: unbound variable`. `__git_ps1` still works.
- **Failure scenario:**
  - After the first region, the option stays on in Đạt's terminal. Every `git <TAB>` there prints `words_[j]: unbound variable` and completion stops working.
  - Later bash snippets the learner types that reference an unset variable abort.
  - The guide never mentions this and never says `set +u`.
- **Suggested fix:** either of these:
  - Explain `set -u` once in "Cách chạy lệnh" and tell the learner to run `set +u` (or open a fresh tab) after the lab.
  - Wrap each region's first line as `set -u  # tắt lại bằng set +u khi xong chặng`.
  - Alternatively, drop `set -u` from pasted regions and keep it only in the scripts that run as files.

## F4 · Stage 4 teaches as absolute that an AOF `everysec` process kill never loses an acknowledged write

- **Severity:** Minor
- **Dimension:** 1 (Redis 7.2.3 correctness)
- **Location:**
  - `assembly/fragments/stage-04.html:51` ("Kill: còn. Redis đã `write()` lệnh vào file trước khi trả OK …")
  - `assembly/fragments/stage-04.quiz.json:11` (the correct option and its "why")
  - `stage-04.html:128` ("kill tiến trình với everysec không mất khóa nào")
  - `labs/lesson-06-redis/04-persistence.sh:45` ("Đợi 2 s: đủ cho ít nhất một lần fsync")
- **Evidence:** Redis 7.2.3 `src/aof.c:1100-1107`, in `flushAppendOnlyFile` under `AOF_FSYNC_EVERYSEC`: `if (sync_in_progress) { if (server.aof_flush_postponed_start == 0) { … return; } else if (server.unixtime - server.aof_flush_postponed_start < 2) { … return; }`. While a background fsync is slow, the `write()` is postponed for up to 2 s, and replies are still sent. The run `04-persistence.aof-loss` does not test this, and the `sleep 2` before `docker kill` has nothing to do with fsync for a process kill.
- **Failure scenario:** Đạt repeats in an interview "everysec + process crash = 0 loss, Redis always `write()`s before OK". The correct statement: usually yes, but under fsync contention up to about 2 s of acknowledged writes sit only in `aof_buf` and are lost on `kill -9`.
- **Suggested fix:**
  - Qualify the answer: "Thường là còn: … Ngoại lệ: khi fsync nền đang chậm, 7.2 hoãn `write()` tối đa 2 s (aof.c), lúc đó kill vẫn mất phần đã trả OK."
  - Change the lab comment to say that the 2 s wait only shows the data survives. Fsync does not matter for a process kill.

## F5 · `token-bucket.lua` does not clamp elapsed time, so a backwards server clock, which this guide documents, drains tokens

- **Severity:** Minor
- **Dimension:** 1 (token bucket correctness)
- **Location:** `labs/lesson-06-redis/lua/token-bucket.lua:17`, together with `assembly/fragments/stage-08.html:140` and the Redlock fold ("đồng hồ máy ảo Docker … bị chỉnh lùi theo đợt")
- **Evidence:** `tokens = math.min(cap, tokens + (now - ts) / 1000 * rate)` uses `now` from `TIME`. When the clock steps back, `now - ts < 0` and tokens are subtracted. `ts` is then overwritten with the earlier `now`.
- **Failure scenario:** On the same Docker VM whose clock the guide shows being stepped back, a correct request is denied (or gets a larger `retry_after_ms`) right after a clock correction. Đạt carries the script unchanged into OmniPOS FR-M2-05 and Boss Challenge 2.3 (`stage-09.html:185`: "dùng lại nguyên token-bucket.lua").
- **Suggested fix:** `local elapsed = math.max(0, now - ts)` and use `elapsed` in the refill. Add a one-line comment linking it to the clock note in stage 8.

## F6 · The fencing "bridge" contradicts itself: Lua accepts an equal token, the SQL rejects it, and both are described as version CAS

- **Severity:** Minor
- **Dimension:** 1 (lock/fencing). Also 4.
- **Location:** `labs/lesson-06-redis/lua/fenced-write.lua:7`, `assembly/fragments/stage-08.html:192`
- **Evidence:**
  - Lua rejects only `if token < last`, so an equal token is accepted.
  - The bridge SQL is `UPDATE seats … WHERE id = $3 AND fence < $2`, so an equal token is rejected.
  - The same paragraph says the script "làm đúng việc của `UPDATE … WHERE version = $v`" (Lesson 14 equality CAS that bumps the version). That is a different rule: equality compare-and-swap, not monotonic fencing.
- **Failure scenario:**
  - Đạt ports the fence to Postgres. The same lock holder's second write with its own token (a retry) gets 0 rows and is treated as stale.
  - Alternatively, he implements `fence = $v` equality and lets an older holder through after a third holder.
- **Suggested fix:**
  - Use `fence <= $2` in the SQL to match the Lua, or document that the Lua should reject `<=` if retries are not allowed.
  - Reword the bridge to say fencing is "monotonic version check at the write site, like Lesson 14's version column", not "đúng việc của `WHERE version = $v`".

## F7 · `idempotency-begin.lua` cites the wrong OmniPOS requirement

- **Severity:** Minor
- **Dimension:** 4 (OmniPOS M2 bridge accuracy)
- **Location:** `labs/lesson-06-redis/lua/idempotency-begin.lua:1`
- **Evidence:**
  - The file header says `(OmniPOS FR-M2-01, tiếp Bài 01)`.
  - `docs/omnipos-finledger-hub/software-requirements-specification.md:73-74` defines FR-M2-01 = `POST /pos/invoices` and FR-M2-02 = `@Idempotent()` qua header `Idempotency-Key`.
  - The guide itself correctly says FR-M2-02 (`stage-09.html:9,60,178`; `shell-tail.html:209`).
- **Failure scenario:** Đạt opens the Lua file (the guide folds it open) and maps idempotency to the invoice-creation requirement instead of the `@Idempotent()` decorator requirement while planning M2.
- **Suggested fix:** Change the header to `FR-M2-02`.

## F8 · The driver-drill error count is inconsistent (6 vs 7), and the pipeline fix names `multi()`, which is a MULTI/EXEC transaction

- **Severity:** Minor
- **Dimension:** 4 (driver drill)
- **Location:** `assembly/fragments/stage-09.html:229`, `assembly/shell-tail.html:54,75`
- **Evidence:**
  - Stage 9 says "chỉ ra 6 lỗi, mỗi lỗi nối với một run".
  - The drill and the snippet say "Tìm 7 lỗi và 1 chỗ ĐÚNG". Error 7 has no run; its evidence is the driver docs.
  - Answer row 6 says "pipeline (`multi()`/`Promise.all` trên một kết nối)". The project's own `runs/driver-claims.txt` C6 records that `multi().exec()` is MULTI/EXEC and that `execAsPipeline()` is the pipeline.
- **Failure scenario:**
  - Đạt stops after six findings.
  - Or he "fixes" N sequential GETs with `multi().exec()`, which wraps them in a transaction he does not need, and then repeats in an interview that multi() is a pipeline.
- **Suggested fix:**
  - Change `stage-09.html:229` to "7 lỗi và 1 chỗ đúng, mỗi lỗi nối với bằng chứng".
  - Change row 6 to "`mGet`, hoặc auto-pipeline bằng `Promise.all`, hoặc `multi().execAsPipeline()`".

## F9 · `check.sh` C12 (active expiry) gives false ✘ when any other TTL key expires during its one-second window

- **Severity:** Minor
- **Dimension:** 3 (check robustness). Also 2.
- **Location:** `labs/lesson-06-redis/check.sh:114-117`
- **Evidence:** `e0=$(expires); rcli SET l06:exp:c12 1 PX 50; sleep 1; e1=$(expires)` and the check is `[ "${e1:-0}" = "${e0:-0}" ]`. The check compares the whole-db0 `expires=` count. The lab creates TTL keys that can expire in that window: `l06:exp:ttl EX 10` (stage 3), bucket keys with `PEXPIRE`, and Đạt's own `l06:my:*`.
- **Failure scenario:** Đạt runs `check.sh` a few seconds after stage 3 Làm mẫu 1. `l06:exp:ttl` expires inside the 1 s window, so e1 = e0 − 1. C12 prints ✘ and tells him to run `DEBUG SET-ACTIVE-EXPIRE 1`, although active expiry is on. The exit code is non-zero.
- **Suggested fix:** Isolate the probe in another logical DB: `rcli -n 15 SET l06:exp:c12 1 PX 50` and read `db15:…expires=`. A missing `db15` line counts as 0. This keeps the `l06:` prefix and is immune to db0 activity.

## F10 · 36 lab-result inputs have only a placeholder as their name

- **Severity:** Minor
- **Dimension:** 5 (accessibility labels)
- **Location:** All walk-table inputs, for example:
  - `assembly/fragments/stage-08.html:90` (`<input class="field" data-store="l06-c8-nolock-a" placeholder="A thấy ghế = ?">`)
  - `stage-01.html` (`l06-c1-reset`, `l06-c1-b-wait`, `l06-c1-pong`)
  - `stage-02.html:243-244`
- **Evidence:** A scan of the built guide found 70 `input`/`textarea`. 36 have no `aria-label`/`aria-labelledby` and no wrapping `<label>`. Each has only a `placeholder`, which disappears once Đạt types.
- **Failure scenario:**
  - On mobile, once a value is typed, Đạt no longer sees what the field was for. A screen reader may announce only "edit text".
  - When Đạt reviews his notes later, the stored values have no visible question beside them.
- **Suggested fix:** Add `aria-label` with the same text as the placeholder, or a visually hidden `<label>`, when rendering walk tables. Add a verify rule: `input.field` needs a label or `aria-label`.

## F11 · The W8 events table shows orphan replies for the barrier commands it hides

- **Severity:** Minor
- **Dimension:** 3 (trace clarity in widget data)
- **Location:** `verify/make-widget-data.mjs:80-83`, `runs/data/w8.json`
- **Evidence:**
  - The skip regex `/BLPOP|RPUSH l06:barrier|…|"?go"?$/` drops the `RPUSH l06:barrier:* go` send line. It keeps that command's reply, because the reply text is just `1` or `(integer) 1`.
  - `w8.json` therefore starts with replies that have no command: `{ ms: 253, who: 'A', dir: 'reply', text: '(integer) 1' }` (nolock), `494 A reply 1` (cad), `512 A reply 1` (fencing).
  - The events table renders these as "← (integer) 1" or "← 1" before any send.
- **Failure scenario:** Đạt reads the timeline as "A got 1 before sending anything" and, in the fencing tab, may take the first `1` for the fencing token.
- **Suggested fix:** When a send is skipped, also skip the next reply from the same `who` before that side sends again. Alternatively, keep the barrier rows and label them "barrier".

---

Status: DONE_WITH_CONCERNS
Summary: 11 findings: Critical 0, Important 2 (F1 two-terminal `.redis` pacing that the verifier cannot see; F2 vacuous H5 in hw-check), Minor 9 (F3–F11).
