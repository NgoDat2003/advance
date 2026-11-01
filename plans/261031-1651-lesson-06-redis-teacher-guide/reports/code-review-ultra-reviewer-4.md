# Code review ultra · reviewer 4 · Lesson 06 Redis guide

Scope: the packet scope (assembly sources, labs, verify tooling, runs). The review was read-only. The only live queries were read-only `docker exec advance-be-redis redis-cli` calls (CONFIG GET, INFO keyspace), timing of `docker exec … PING`, and one node-redis `PING` from the host.

---

## 1. The fencing token is not issued atomically with the lock, so the "data stays correct even when the lock is wrong" claim fails

- **Severity:** Critical
- **Dimension:** 1 (lock/fencing correctness), 4 (teaching)
- **Location:**
  - `labs/lesson-06-redis/08-lock-lua.A.sh:29-31`
  - `labs/lesson-06-redis/08-lock-lua.B.sh:17-18`
  - `assembly/fragments/stage-08.html:162`
  - W8 lesson text `assembly/widgets/w8.js` (fencing entry)
  - cheat sheet `assembly/shell-tail.html:166`
- **Evidence:** The lab takes the lock with `SET … NX PX 2000` and then gets the token with a separate `docker exec … INCR l06:fence:A34_S012C`. The guide teaches: "Mỗi lần lấy được khóa, người đó `INCR` một bộ đếm để nhận số thứ tự tăng dần". W8 says "dữ liệu vẫn đúng dù khóa đã sai". The token is ordered by when INCR runs, not by when the lock was granted. Run `08-lock-lua.fencing.timeline` shows a 177 ms host gap between `A < OK` (+688) and `A < 1` (+877). The guide's own premise ("GC pause") can land in that gap.
- **Failure scenario:**
  1. A gets `OK` from SET NX, then pauses for more than 2 s before its INCR.
  2. The lock expires. B gets `OK`, runs INCR and gets 1, and writes with token 1.
  3. A wakes up, runs INCR and gets 2, and writes with token 2.
  4. `fenced-write.lua` accepts A's write (2 ≥ 1). Any later write by B with token 1 now gets `STALE 2`.
  
  The stale holder wins, which is exactly what fencing is supposed to prevent. Đạt will carry the rule "INCR after SET NX = fencing" into interviews and into the Lesson 14 bridge (`version` there is checked atomically at the write, but here the token is not tied to the grant).
- **Suggested fix:** Add `lua/lock-acquire.lua`:
  ```lua
  if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then return redis.call('INCR', KEYS[2]) end
  return false
  ```
  Use it in both fencing regions. Re-record `08-lock-lua.fencing`. Add one sentence: "token phải được cấp cùng lúc với khóa (Kleppmann: lock service trả token)".

## 2. The active-expire cycle is described as random sampling, but Redis 7.2.3 scans `expires` with a cursor

- **Severity:** Important
- **Dimension:** 1
- **Location:**
  - `assembly/fragments/stage-03.html:30` (diagram: "Lấy ngẫu nhiên 20 khóa trong bảng expires")
  - `assembly/fragments/stage-03.html:201` ("Redis 7.2.3 đo được … Redis cố ý lấy mẫu ngẫu nhiên")
  - `assembly/shell-tail.html:279` (EXAM Q3: "expires là bảng băm và được lấy mẫu ngẫu nhiên")
- **Evidence:** In `src/expire.c` at tag 7.2.3, `activeExpireCycle` does
  `while (data.sampled < num && checked_buckets < max_buckets) { db->expires_cursor = dictScan(db->expires, db->expires_cursor, expireScanCallback, &data); checked_buckets++; }`.
  `dictGetRandomKey` is used only in `expireSlaveKeys()`. Random sampling was the behaviour before 6.0. The 10%, 20-key and 25% CPU figures in the same paragraph are correct.
- **Failure scenario:** The "Redis 7.2.3 đo được" column, which the learner is told to trust over the slide, confirms an outdated mechanism. Đạt then gives it as the interview answer for question 3.
- **Suggested fix:** Replace "ngẫu nhiên" with "quét tuần tự bảng expires bằng con trỏ (`expires_cursor`, `dictScan`), mỗi vòng tới 20 khóa có TTL". Make this change in the diagram text, in sl-21 and in EXAM Q3. The W3 note can keep its random model because it is labelled "mô hình", but it should say the real cycle is cursor-based.

## 3. hw-check H5 can pass vacuously: a plain-`DEL` solution passes when the holder loop misses the 50 ms lock window

- **Severity:** Important
- **Dimension:** 3 (vacuous check), 4 (homework)
- **Location:** `labs/lesson-06-redis/hw-check.sh:74-79`
- **Evidence:**
  - The holder is started with `docker exec … sh -c 'while [ EXISTS = 0 ] && [ $i -lt 3000 ] …; while [ EXISTS = 1 ] …; SET … hw-check-holder2 NX PX 5000' &`. HW_CMD is launched at the same moment.
  - I measured on this machine:
    - `docker exec advance-be-redis redis-cli PING` round trip: 226–286 ms (5 samples).
    - 100 in-container `redis-cli EXISTS` calls including the exec: 0.507 s, so about 2.5 ms per iteration and about 7.5 s for 3000 iterations.
    - node-redis connect plus first command: 350–460 ms after process start.
  - The lock exists only from `t_acquire` to `t_acquire + 50 ms`.
  - If the holder's loop is not polling yet in that window, its first loop spins about 7.5 s and then SETs `hw-check-holder2` long after the program exited. `after = hw-check-holder2` and H5 shows ✔ no matter how the program released the lock.
  - The guide says "Ngôn ngữ nào cũng được" (`shell-tail.html:7`). A Go, Rust or Bun program takes the lock in about 20–50 ms, before the docker exec is even running. A slow, cold Docker Desktop has the same effect for Node.
  - The only negative evidence is `runs/hw-check.bad.txt`. That fixture sleeps 50 ms before SET, which widens the window. No negative test covers SET NX + plain DEL (`grep hw verify/negative-tests.sh` returns nothing).
- **Failure scenario:** Đạt writes a Go or Python solution with `SET NX PX` and a plain `DEL`. hw-check prints five ✔ lines, so the most important lesson of stage 8 is marked as passed.
- **Suggested fix:** Make the holder prove it saw the lock. For example, it can `echo SEEN` when the first loop exits with `i < 3000`, and hw-check then marks H5 ✘ "không đo được (holder không thấy khóa)" when SEEN is missing. Better: start the holder, wait until it writes `l06:hw:holder-ready`, then run HW_CMD. Add a negative fixture "SET NX PX + DEL trơn" to `negative-tests.sh`.

## 4. The stage 3 challenge answer tells the learner to use `seq 1 100` to see the eviction order, which evicts nothing

- **Severity:** Important
- **Dimension:** 4 (challenge doability), 1
- **Location:** `assembly/fragments/stage-03.html:377`
- **Evidence:**
  - The answer says: "Khác nhau chỉ ở thứ tự bỏ, thấy được khi tràn ít hơn số khóa TTL (đổi `seq 1 1500` của đợt tràn thành `seq 1 100`)."
  - Capacity can be worked out from `runs/03-eviction.allkeys-lru.txt`. There were 300 + 600 + 1500 = 2400 writes and `evicted_keys:925`, so about 1475 1 KB keys fit under `MAX=BASE+2097152`.
  - The volatile region pre-fills 300 + 600 + 200 = 1100 keys. With 100 overflow writes the total is 1200, which is below 1475. So `evicted_keys:0` and `ttl=200/200`, and nothing is shown.
  - The region only prints counts, so no "order" is observable at any overflow size.
  - For `volatile-lru`, all 200 TTL keys are written within about 1 s and never read. With an LRU clock resolution of 1000 ms they carry the same idle time, so the order is not distinguishable anyway.
- **Failure scenario:** Đạt follows the hint, sees nothing evicted, and either concludes volatile-lru is broken or loses time debugging.
- **Suggested fix:**
  - Say the overflow must land between roughly 375 and 575 keys (for example `seq 1 450`).
  - Add a line that lists which `l06:ev:ttl:*` survive (for example `--scan … | sort -t: -k4 -n | head`).
  - Compare with `volatile-ttl`, where the survivors are the high-numbered keys with long TTLs. Or drop the ordering claim for `volatile-lru`.

## 5. The stage 1 challenge PASS rule refers to "dòng `3)`", but non-TTY `docker exec … SLOWLOG GET 5` prints raw lines

- **Severity:** Minor
- **Dimension:** 4
- **Location:** `assembly/fragments/stage-01.html:282`, `:289`
- **Evidence:** The block runs `docker exec advance-be-redis redis-cli SLOWLOG GET 5` from Git Bash with no `-t`, so redis-cli uses raw output with no `1) 2) 3)` prefixes. A live check (`docker exec advance-be-redis redis-cli CONFIG GET hash-max-listpack-entries`) printed `hash-max-listpack-entries` and `512` on two bare lines. The labs know this already: `01-block.B.sh` adds `--no-raw` "để redis-cli in "(error) …" giống terminal tương tác".
- **Failure scenario:** Đạt cannot find "dòng 3)". The duration is the third bare line of each entry.
- **Suggested fix:** Use `redis-cli --no-raw SLOWLOG GET 5` in the challenge block, or reword the rule as "dòng thứ 3 của mỗi mục".

## 6. The driver drill error count is inconsistent: 6 vs 7

- **Severity:** Minor
- **Dimension:** 4
- **Location:**
  - `assembly/fragments/stage-09.html:229` ("chỉ ra 6 lỗi, mỗi lỗi nối với một run")
  - `assembly/shell-tail.html:54` ("tìm 7 lỗi")
  - `labs/lesson-06-redis/driver-drill.ai-snippet.ts:2` ("Tìm 7 lỗi và 1 chỗ ĐÚNG")
- **Evidence:** The answer table has 7 rows plus the decoy. Row 7 is tied to `driver-claims`, not to a run.
- **Failure scenario:** Đạt stops at 6 or questions the answer key.
- **Suggested fix:** Change stage-09 to "7 lỗi (6 nối với run, 1 nối với tài liệu node-redis) và 1 chỗ đúng".

## 7. The cheat sheet puts `latest_fork_usec` under `INFO persistence`; it is in `INFO stats`

- **Severity:** Minor
- **Dimension:** 1
- **Location:** `assembly/shell-tail.html:138`
- **Evidence:** The lab says the opposite and greps the right section: `labs/lesson-06-redis/04-persistence.sh:19-20` reads "latest_fork_usec (INFO stats)", followed by `docker exec advance-be-redis-rdb redis-cli INFO stats | grep ^latest_fork_usec`.
- **Failure scenario:** Đạt runs `INFO persistence | grep latest_fork_usec` from the cheat sheet and gets nothing.
- **Suggested fix:** Move `latest_fork_usec` to an `INFO stats` row.

## 8. The reference solution and the drill use `quit()`, which is deprecated in node-redis 6.3.0, while the guide flags other deprecated APIs

- **Severity:** Minor
- **Dimension:** 4 (node-redis 6.3.0 API usage)
- **Location:**
  - `labs/lesson-06-redis/hw-solution.mjs:49`
  - `labs/lesson-06-redis/driver-drill.ai-snippet.ts:16`
  - `verify/hw-bad-fixture.mjs` (last line)
- **Evidence:** `packages/client/lib/client/index.ts` at tag `redis@6.3.0` has `/** @deprecated use .close instead */ QUIT()` and `quit = this.QUIT;`. `runs/driver-claims.txt` C4 makes a point of marking `{ NX: true }` as deprecated, but it says nothing about `quit`.
- **Failure scenario:** Đạt copies a deprecated shutdown call from the "model" solution into OmniPOS. The drill also leaves a deprecated call that is neither an error nor the decoy, which muddies the "find exactly 7" exercise.
- **Suggested fix:** Use `close()` in hw-solution and the fixture. In the drill, either use `close()` or list `quit()` explicitly as acceptable but deprecated, citing that line in driver-claims.

## 9. The idempotency script cites the wrong OmniPOS requirement id

- **Severity:** Minor
- **Dimension:** 4 (M2 bridge accuracy)
- **Location:** `labs/lesson-06-redis/lua/idempotency-begin.lua:1` ("OmniPOS FR-M2-01")
- **Evidence:** `docs/omnipos-finledger-hub/software-requirements-specification.md:73-74` defines FR-M2-01 as `POST /pos/invoices` and FR-M2-02 as `@Idempotent()` via `Idempotency-Key`. The guide itself uses FR-M2-02 (`stage-09.html:164,178`).
- **Failure scenario:** The script header shown in the guide fold contradicts the guide text and the SRS.
- **Suggested fix:** Change the header to `FR-M2-02`.

## 10. Quiz: the correct option is shown only by colour, and keyboard focus is lost after answering

- **Severity:** Minor
- **Dimension:** 5
- **Location:** `assembly/shell-tail.html:360-364`, `assembly/shell-css.part:168-169`
- **Evidence:**
  - On click, every option gets `b.disabled = true`, and the correct one only gets class `right` (green background and border). The wrong pick gets `wrong` (red).
  - The appended explanation says "Đúng." or "Chưa đúng." but never names the correct option.
  - Disabling the focused button drops focus to `<body>`.
  - The explanation is not in a live region (only the score is `aria-live`).
- **Failure scenario:** A screen-reader or colour-blind user who answers wrong cannot tell which option was correct. A keyboard user has to tab from the top of the page back to the quiz.
- **Suggested fix:**
  - Prefix the correct option with visible text (for example "✔ Đáp án: …") and set `aria-label`.
  - Include the correct option text in `q-explain`.
  - Move focus to the explanation (`tabindex="-1"`, `.focus()`), or keep the buttons enabled with `aria-disabled`.

## 11. `00-containers.sh up main` silently destroys a Lesson 02 `advance-be-redis` container and its anonymous data volume

- **Severity:** Minor
- **Dimension:** 2 (learner machine safety)
- **Location:** `labs/lesson-06-redis/00-containers.sh:72-80`
- **Evidence:**
  - The Lesson 02 guide creates `docker run -d --name advance-be-redis -p 6379:6379 redis:7.4-alpine` (grep in `reports/advanced_backend/lesson_02_caching_teacher_guide.html`). That container drifts on image, cmd and publish.
  - `up_one` prints a note and then runs `docker rm -f -v "$n"` with no confirmation. `-v` also deletes the anonymous `/data` volume of the image.
  - This is step 1 of the guide's preparation (`shell-head.html` "Chuẩn bị").
- **Failure scenario:** Đạt still has Lesson 02 state (`imdb:*`, `lock:*`) that he meant to inspect. It is gone before he reads the warning line.
- **Suggested fix:** When the image differs from `$IMG`, refuse unless the user adds `--recreate`, or ask `[y/N]`. Print the key count (`DBSIZE`) of the old container in the prompt.

## 12. `token-bucket.lua` subtracts tokens when the Redis clock steps backwards

- **Severity:** Minor
- **Dimension:** 1
- **Location:** `labs/lesson-06-redis/lua/token-bucket.lua:17`
- **Evidence:** The code is `tokens = math.min(cap, tokens + (now - ts) / 1000 * rate)`, which has no `max(0, …)`. The guide itself records that the Docker VM clock "bị chỉnh lùi theo đợt" (`stage-08.html` Redlock fold). When `now < ts` the refill is negative, the bucket can drop below 0, and `ts` is moved backwards.
- **Failure scenario:** After a clock step-back, legitimate requests from a store get 429 with an inflated `Retry-After`. This script is the one the guide says to reuse "nguyên" for FR-M2-05 and Boss Challenge 2.3.
- **Suggested fix:** Use `local elapsed = math.max(0, now - ts)` and only advance `ts` when `now > ts`. Add one comment line linking it to the Redlock note.

## 13. Verifier blind spot: quiz and interview numbers are checked against all runs concatenated, and numbers under 4 digits are never checked

- **Severity:** Minor
- **Dimension:** 3
- **Location:** `verify/verify-guide.mjs:266-275` (V16)
- **Evidence:** The code is `const all = runFiles().map(...).join('\n')` and `if (!(v.length >= 4 || v.includes('.'))) continue;`.
  - A number in a quiz `why` passes if it appears in any run file, not the run it cites.
  - Values such as `112`/`120` (Hash vs JSON bytes), `66/300`, `300/300`, `925` and `200` are never checked. Swapping 112 and 120 in `stage-02.quiz.json` would still pass `--data`.
  - The same weakness applies to single-token `b.m` values like `1`, `2` and `OK` in `stage-08.html:58`, which match many lines of `08-lock-lua.fencing.timeline`.
- **Failure scenario:** A future edit swaps or mistypes a 2–3 digit measured number in a quiz explanation, and the gate stays green.
- **Suggested fix:** Check each number against the run ids named in the same `why` (V11 already requires one). Also check numbers of 2 or more digits, and keep the header-time exclusion that V07 already has.

---

Status: DONE_WITH_CONCERNS
Summary: 13 findings, Critical 1 (fencing token not tied to the lock grant), Important 3 (expiry described as random sampling, hw-check H5 can pass vacuously, stage 3 hint `seq 1 100` evicts nothing), Minor 9.
