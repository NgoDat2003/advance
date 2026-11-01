# Code review ultra — reviewer 3 (Lesson 06 Redis guide)

Reviewer 3 of 5 · 2026-11-01 · read-only. I ran only `docker exec advance-be-redis redis-cli` reads (CONFIG GET, INFO, SCAN). I did not read any other reviewer's report.

---

## 1. H5 of hw-check passes a plain-`DEL` solution when the program does not use `HW_TTL_MS`

- **Severity:** Important
- **Dimension:** 4 (homework / hw-check), 3 (a check that can pass with nothing proven)
- **Location:** `labs/lesson-06-redis/hw-check.sh:72-80`, `labs/lesson-06-redis/hw-check.sh:88`. Guide text: `assembly/shell-tail.html:30` (H5 row).
- **Evidence:**
  - The H5 holder loop first waits until the lock EXISTS. It then waits until the lock no longer EXISTS, and then runs `SET … hw-check-holder2 NX PX 5000`.
  - It never checks *why* the lock disappeared. The lock may have expired (the case under test), or the program may have deleted it.
  - The only verdict is `after = hw-check-holder2` (line 88).
  - Nothing checks that the program actually used `HW_TTL_MS=50`. For example, nothing reads the lock's PTTL when the holder first sees it. Nothing checks that the holder's SET came before the program's release.
  - `runs/hw-check.bad.txt` turns H5 red only because `verify/hw-bad-fixture.mjs` *does* read `HW_TTL_MS`.
- **Failure scenario:**
  1. Đạt hard-codes `PX: 2000`. The driver drill does exactly this at `driver-drill.ai-snippet.ts:195-198`. He also releases with plain `client.del(LOCK)`.
  2. In round 11 the lock lives the full 200 ms of HOLD_MS. The program DELs it, and the holder sees it vanish and takes it.
  3. `after = hw-check-holder2`, so H5 shows ✔. H1–H4 are also ✔. Đạt gets 5/5 with the exact bug the homework exists to catch.
  - A second path to a false ✔: Docker Desktop's `docker exec` can start more slowly than node can connect plus 50 ms. If so, the holder never sees the lock. Loop 1 runs out at i=3000, the holder SETs `holder2` after the program has finished, and H5 is green again.
  - The guide's H5 row also says "người 2 giữ được", which suggests the program's own request 2. In fact the second holder is the checker.
- **Suggested fix:**
  - In the holder, print `seen=$i pttl=$(redis-cli PTTL …)` on first sight. Grade H5 ✘ when `seen` hit the 3000 cap or when the first PTTL is greater than 50.
  - Grade H5 ✘ when the lock disappeared before PTTL could have reached 0. One way: record the holder SET's reply and the PTTL just before it.
  - Simplest robust option: in H5, assert that the holder's own `SET … NX` returned `OK` while the program was still running. For example, the program's stdout must still be open, or use a marker key written by the holder that the program cannot know about.
  - Reword the guide's H5 row: "hw-check đóng vai người giữ khóa thứ hai".

## 2. The AOF "kill loses nothing" claim cannot tell page cache apart from fsync, because the lab waits 2 s first

- **Severity:** Important
- **Dimension:** 1 (Redis correctness per slide), 3 (trace integrity)
- **Location:**
  - Lab: `labs/lesson-06-redis/04-persistence.sh:45-47`
  - Claim: `assembly/fragments/stage-04.html:38`, `:51`, `:120`, `:128`; quiz `stage-04.quiz.json` item 4.2
- **Evidence:**
  - Lab comment: `# Đợi 2 s: đủ cho ít nhất một lần fsync mỗi giây.` then `sleep 2`, then `docker kill advance-be-redis-aof`.
  - The guide labels this as "Redis 7.2.3 đo được: kill tiến trình với everysec không mất khóa nào". The quiz says the reason is that the data sits in page cache after `write()` and needs no fsync.
- **Failure scenario:**
  - Because the lab waits past at least one everysec fsync, the run would show `1500 → 1500` under either model ("page cache survives SIGKILL" or "only fsynced data survives").
  - The measurement does not support the claim the guide attributes to it. The lab comment even teaches the opposite cause (fsync).
  - If Đạt is asked in an interview "why did you wait 2 s?", the lab's own comment gives the wrong answer.
- **Suggested fix:**
  - Drop `sleep 2`, or add a second run with `sleep 0` that kills right after the pipe returns. The expected result is still `DBSIZE 1500`.
  - Reword the comment: "không cần đợi fsync: write() đã đưa lệnh vào page cache trước khi redis-cli nhận OK".
  - Update the R23 regex in `verify/expected.tsv` (it currently requires `sleep 2`).

## 3. The volatile-lru answer suggests `seq 1 100` to "see the eviction order", but that run evicts nothing

- **Severity:** Important
- **Dimension:** 4 (the challenge is doable and the answer is correct), 1
- **Location:** `assembly/fragments/stage-03.html:377` ("…thấy được khi tràn ít hơn số khóa TTL (đổi `seq 1 1500` của đợt tràn thành `seq 1 100`)")
- **Evidence:**
  - From `runs/03-eviction.allkeys-lru.txt`: 300+600+1500 = 2400 keys written, minus `evicted_keys:925`, leaves 1475 keys that fit under `MAX=BASE+2 MB`.
  - From `runs/03-eviction.volatile-ttl.txt`: 1100 keys (hot+cold+ttl) are loaded with `evicted_keys:0`. That leaves about 375 keys of headroom.
  - `seq 1 100` adds 100 keys, for 1200 in total. That is below the about 1475 limit, so nothing is evicted.
  - Also, the region only prints the *count* `ttl=N/200`. Even an overflow between about 376 and 575 keys would print the same count for volatile-lru and volatile-ttl. The order is never visible.
- **Failure scenario:** Đạt follows the hint and sees `ttl=200/200 evicted_keys:0` with no OOM. He concludes that volatile-lru does not evict, or that the lab is broken.
- **Suggested fix:** Either remove the sentence, or give a working variant:
  - set the overflow to about 450 keys (`seq 1 450`);
  - print the surviving TTL key ids, e.g. `--scan --pattern 'l06:ev:ttl:*' | sort -t: -k4 -n | head`, so the reader can see that volatile-ttl removes low numbers (short TTL) first while volatile-lru removes roughly at random (all are equally idle at 1 s LRU clock resolution).

## 4. Fencing semantics differ between `fenced-write.lua` and the SQL the guide calls "the same thing"

- **Severity:** Minor
- **Dimension:** 1 (lock/fencing), 4 (bridge to Lesson 14 / Boss Challenge)
- **Location:** `labs/lesson-06-redis/lua/fenced-write.lua:7` (`if token < last then … STALE`) compared with `assembly/fragments/stage-08.html:192` (`UPDATE seats SET owner = $1, fence = $2 WHERE id = $3 AND fence < $2`)
- **Evidence:** The Lua script *accepts* `token == last`. The SQL *rejects* `fence == $2`. The guide says "fenced-write.lua làm đúng việc của UPDATE … WHERE …".
- **Failure scenario:** Đạt ports this to Prisma `updateMany({ where: { fence: { lt: token } } })`. Any second write by the same lock holder (for example, write a status and then write the result) gets `count = 0`, and he treats it as STALE. This rejects valid work. The Lua version would have accepted it.
- **Suggested fix:** Use `fence <= $2` (Prisma: `lte`) in the SQL and prose so it matches the Lua. Or change the Lua to `token <= last` and say explicitly that each write needs a new token.

## 5. The cheat sheet places `latest_fork_usec` under `INFO persistence`

- **Severity:** Minor
- **Dimension:** 1
- **Location:** `assembly/shell-tail.html:138`
- **Evidence:**
  - The lab itself uses `INFO stats | grep ^latest_fork_usec` (`04-persistence.sh:19-20`).
  - Live read: `docker exec advance-be-redis redis-cli INFO persistence | grep fork` returns only `current_fork_perc`, `module_fork_in_progress` and `module_fork_last_cow_size`.
  - `INFO stats` returns `latest_fork_usec:753` and `total_forks:26`.
- **Failure scenario:** Đạt follows the cheat sheet, runs `INFO persistence`, and cannot find the field.
- **Suggested fix:** Move `latest_fork_usec` to an `INFO stats` row, or write "INFO persistence · INFO stats".

## 6. The stage 9 hand-off says the driver drill has 6 bugs, but the drill and its answer table have 7

- **Severity:** Minor
- **Dimension:** 4
- **Location:** `assembly/fragments/stage-09.html:229` ("chỉ ra 6 lỗi") compared with `labs/lesson-06-redis/driver-drill.ai-snippet.ts:2` ("Tìm 7 lỗi và 1 chỗ ĐÚNG") and `assembly/shell-tail.html:54` ("tìm 7 lỗi").
- **Failure scenario:** Đạt stops after six bugs and misses the missing `error` listener and the unbounded offline queue (bug 7).
- **Suggested fix:** Change it to "7 lỗi và 1 chỗ đúng".

## 7. H4 does not enforce a token per lock acquisition, so fixed tokens per request pass

- **Severity:** Minor
- **Dimension:** 4 (homework / hw-check)
- **Location:** `labs/lesson-06-redis/hw-check.sh:62`, `:67`; guide H4 row at `assembly/shell-tail.html` ("token ngẫu nhiên cho mỗi lần giữ khóa")
- **Evidence:** `toks` counts the distinct tokens *within one round* and accepts 2. A solution that uses `'req1'` and `'req2'` as constant tokens passes H4 in every round. It also passes H5, because `hw-check-holder2` is a different string.
- **Failure scenario:**
  - Đạt ships constant tokens. Stage 8 explicitly calls this a bug: "value phải là token riêng cho mỗi lần lấy khóa".
  - Constant tokens break compare-and-delete when the same logical caller acquires the lock again. A stale release from a previous attempt with the same token deletes the new lock.
- **Suggested fix:** Collect tokens across all rounds and require `2 × ROUNDS` distinct values. At minimum, require that tokens differ between round 1 and round 2.

## 8. W9 dots and W8 lock segments rely on colour alone, and their per-item detail is only in `title` tooltips

- **Severity:** Minor
- **Dimension:** 5 (colour-only meaning, touch and keyboard access)
- **Location:**
  - `assembly/widgets/w9.js` `dots()`; CSS `.bucket .tok` / `.tok.denied` (built HTML lines 247-249)
  - `assembly/fragments/stage-09.html:148` ("Chấm xanh = cho qua, đỏ = 429")
  - `assembly/widgets/w8.js` `seg()`/`mark()`; `.lane-seg.ok` / `.wait`
- **Evidence:**
  - Allowed and denied dots are the same 22 px circle. The only difference is `--ok #1d7a4c` versus `--bad #b3261e`. Their relative luminances are about 0.147 and 0.110, so red/green colour-blind users cannot tell them apart.
  - Which request was denied is shown only in `title=`. Spans have no tooltip on touch and are not focusable.
  - In W8, which segment is tokA, tokB or tokC is likewise colour plus `title`.
- **Failure scenario:** On a phone (the 375 px target) or with deuteranopia, Đạt cannot see *which* of the 30 requests were rejected, or which token a segment belongs to. Only the summary sentence is readable.
- **Suggested fix:** Add a shape or glyph difference, e.g. `✕` text inside `.tok.denied` and a hollow ring for denied. Put the token name as visible text inside each `.lane-seg` (or `aria-label` on a focusable element). Give the dot container `role="list"` and give each dot `role="listitem"` with an `aria-label`.

## 9. Every pasted `.sh` region runs `set -u` in Đạt's interactive Git Bash, and the guide never says why or how to undo it

- **Severity:** Minor
- **Dimension:** 2 (commands Đạt copies), 4
- **Location:**
  - Every lab region, e.g. `labs/lesson-06-redis/03-eviction.sh:11,38,60,82,106`
  - `08-lock-lua.A.sh:6,12,22,28` (inserted mid-region, after `RPUSH`)
  - `09-bridge.sh:51,58`
  - No mention in `assembly/shell-head.html` "Cách học".
- **Evidence:**
  - The guide tells him to paste regions line by line into Git Bash (stage-03.html:211, stage-04, stage-07, and the four-to-five step tables in stages 8 and 9).
  - `set -u` stays on in that shell for the rest of the session.
  - `grep "set -u" assembly/shell-head.html assembly/shell-tail.html` finds nothing.
- **Failure scenario:** For the rest of the session, any later command Đạt types that references an unset variable aborts with `unbound variable`. This includes his own challenge loops, and completion or prompt helpers that are not nounset-safe. Nothing in the guide links that error back to the lab.
- **Suggested fix:** Either drop `set -u` from the pasted regions (the runner can set it itself), or add one line in Cách học plus a row in the troubleshooting table: "`set -u` dừng khi biến chưa có giá trị; mở tab mới hoặc `set +u` để tắt".

## 10. The stage 8 challenge PASS criterion "PTTL không tăng" cannot be observed with the commands given

- **Severity:** Minor
- **Dimension:** 4 (the challenge is doable and the PASS criteria can be checked)
- **Location:** `assembly/fragments/stage-08.html:209` (PASS bullet 1) and the starter block at `:213-216`
- **Evidence:**
  - The block runs SET PX 10000, then renew(tokOther), then renew(tokMe), then a single PTTL.
  - No PTTL is read before and after the wrong-token call, so "PTTL không tăng" has no data.
  - The last PTTL is read after the correct renew, so even a broken script that always runs PEXPIRE would show a value near 10000.
- **Failure scenario:** Đạt writes a script that ignores the token and always runs PEXPIRE, then returns 0 for a mismatch. The four lines show `0`, `1` and about 10000, so he self-grades PASS.
- **Suggested fix:**
  - Insert `PTTL` before and after the tokOther call.
  - Use a smaller initial PX (for example 3000) and renew to 10000, so a wrong-token renew would visibly raise PTTL.

## 11. The reference solution and the drill teach the deprecated `quit()` from node-redis 6.3.0

- **Severity:** Minor
- **Dimension:** 4 (node-redis 6.3.0 API use)
- **Location:** `labs/lesson-06-redis/hw-solution.mjs:49`; `labs/lesson-06-redis/driver-drill.ai-snippet.ts:16`; `verify/hw-bad-fixture.mjs:44`
- **Evidence:** In `packages/client/lib/client/index.ts` at tag `redis@6.3.0`, `QUIT()` is annotated `@deprecated use .close instead`, and `quit = this.QUIT`. `close()` is documented as "Close the client. Wait for pending commands."
- **Failure scenario:** Đạt copies the model solution into the NestJS hub (OmniPOS M2 / Boss Challenge 2) and inherits a deprecated shutdown call. The drill does not mark `quit()` as a bug, which implicitly approves it.
- **Suggested fix:** Use `close()` in `hw-solution.mjs` and the fixture. Either change the drill to `close()`, or add a one-line note under the drill answer table and add a `driver-claims.txt` entry quoting the deprecation.

---

Status: DONE_WITH_CONCERNS
Summary: 11 findings. Critical 0 · Important 3 (H5 false pass, AOF claim the run cannot prove, the volatile-lru `seq 1 100` hint) · Minor 8.
