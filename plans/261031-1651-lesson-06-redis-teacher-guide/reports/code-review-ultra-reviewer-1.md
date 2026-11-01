# Code review ultra · reviewer 1 · Lesson 06 Redis guide

Scope: the five dimensions in `code-review-ultra-packet.md`. I worked read-only. I fetched the Redis 7.2.3 sources from `raw.githubusercontent.com/redis/redis/7.2.3/src/{expire.c,server.c}` and the node-redis sources from `raw.githubusercontent.com/redis/node-redis/redis%406.3.0/...`. Probes ran in the session scratchpad, against copies of the run files. The only command run on main was a read-only `EXISTS` timing probe.

---

## 1. The active-expiry diagram and the slide-21 verdict say Redis 7.2.3 samples expires at random; the 7.2.3 source scans with a cursor

- **Severity:** Important
- **Dimension:** 1 (Redis 7.2.3 correctness)
- **Location:**
  - `assembly/fragments/stage-03.html:30`: diagram node "Lấy ngẫu nhiên 20 khóa trong bảng expires", captioned "Sơ đồ tự vẽ theo src/expire.c của Redis 7.2.3".
  - `assembly/fragments/stage-03.html:201`: slide-21 verdict "Redis cố ý lấy mẫu ngẫu nhiên: không tìm hết…".
  - `assembly/fragments/stage-03.html:194`: the slide-20 verdict endorses the slide's "lấy ngẫu nhiên 20 khóa" as "20 khóa mỗi vòng khớp mã nguồn" and corrects only the 25 %.
- **Evidence:**
  - `src/expire.c` at tag 7.2.3, lines 271-275:
    ```
    while (data.sampled < num && checked_buckets < max_buckets) {
        db->expires_cursor = dictScan(db->expires, db->expires_cursor,
                                      expireScanCallback, &data);
    ```
  - The comment at lines 248-249 reads "Scan through keys among keys with an expire set". Since 6.0 the cycle has walked the expires table with a persistent cursor (`db->expires_cursor`), bucket by bucket.
  - `dictGetRandomKey` appears only at line 370, in the writable-replica path.
- **Failure scenario:** Đạt repeats "Redis lấy ngẫu nhiên 20 khóa" in an interview, and the guide says this is verified against the 7.2.3 source. A follow-up question ("why does Redis 6+ guarantee eventual coverage of every volatile key?") then contradicts the guide. The diagram claims source fidelity it does not have.
- **Suggested fix:**
  - Change the diagram node to "Quét tiếp 20 khóa trong bảng expires (con trỏ dictScan nhớ vị trí giữa các chu kỳ)".
  - Change the slide-20 verdict to say the slide's "ngẫu nhiên" is pre-6.0 behaviour; 7.2 scans with a cursor.
  - In the slide-21 text, replace "cố ý lấy mẫu ngẫu nhiên" with "quét dần từng phần, có trần CPU".
  - W3 may keep its random draw, because it is labelled as a simulation. Add one line saying the real cycle walks a cursor.

## 2. `expired_stale_perc:3.40` is read as "% of expired keys still left"; the same run shows 0 left, and the stat is a lagging moving average

- **Severity:** Important
- **Dimension:** 1 and 3 (correctness, explanation of a shown number)
- **Location:**
  - `assembly/fragments/stage-03.html:53`: table row "expired_stale_perc:3.40 · expire_cycle_cpu_milliseconds:24 → Ít CPU, sót một phần nhỏ".
  - `assembly/fragments/stage-03.html:152` and `labs/lesson-06-redis/03-expiry.sh:26`: "expired_stale_perc = ước lượng % khóa hết hạn còn sót".
  - `assembly/fragments/stage-03.html:194`: "Redis ước lượng còn sót expired_stale_perc:3.40".
  - `assembly/widgets/w3.js:63`: "(Redis tự ước lượng % khóa chết còn sót)".
- **Evidence:**
  - Run `03-expiry.active` reads `expired_stale_perc:3.40`, and the very next command prints `db0:keys=29,expires=0,avg_ttl=0`. No volatile key is left, stale or otherwise.
  - `src/expire.c` 7.2.3, lines 313-321:
    ```
    /* Update our estimate of keys existing but yet to be expired.
     * Running average with this sample accounting for 5%. */
    ...
    server.stat_expired_stale_perc = (current_perc*0.05)+(server.stat_expired_stale_perc*0.95);
    ```
  - The stat is an exponential moving average of the per-cycle sample ratio, so each new cycle only moves it 5 %. After a burst of 10000 expiries it decays over many cycles, long after the keys are gone.
- **Failure scenario:** Đạt learns that "3.4 % of dead keys are still in RAM" and repeats it in a post-mortem or an interview. The table row "sót một phần nhỏ" is contradicted by the `expires=0` line printed two lines below it in the same run. Any reviewer who reads both lines loses trust in the measured table.
- **Suggested fix:** Describe the stat as "trung bình trượt (trọng số 5 %) tỉ lệ khóa hết hạn trong các mẫu gần đây, trễ hơn thực tế". Change the "Nói lên điều gì" cell to "Ít CPU; số này là ước lượng trễ, thực tế đã còn expires=0". Apply the same wording in `03-expiry.sh:26` and `w3.js:63`.

## 3. V07 is vacuous for multi-digit chips: a chip passes when its number appears only in an echoed `$ command` line

- **Severity:** Important
- **Dimension:** 3 (trace integrity, verifier blind spot)
- **Location:** `verify/verify-guide.mjs:113`, function `checkBm`. Example chips at `assembly/fragments/stage-04.html`: `<b class="m" data-run="04-persistence.aof-loss">1500</b>` and `<b class="m" data-run="04-persistence.rdb-loss">1000</b>`.
- **Evidence:**
  - For values with three or more digits, `checkBm` only tests `new RegExp('(^|[^\\w.])'+v+'(?![\\w])','m')` against the whole run text, and the run text includes the echoed commands.
  - Probe:
    1. Copy `runs/04-persistence.aof-loss.txt` to the scratchpad and change the DBSIZE output line `1500` to `1499`.
    2. Copy `runs/04-persistence.rdb-loss.txt` and change the output line `1000` to `999`.
    3. Run the V07 regex on both copies.

    Probe output:
    ```
    chip "1500" passes V07 regex: true    (matched "$ seq 1 1500 | awk ...")
    chip "1000" passes V07 regex: true    (matched "$ seq 1 1000 | awk ...")
    ```
- **Failure scenario:** A fragment edit swaps the RDB and AOF results, for example "RDB 1500 → 1500". The gate stays green, because `1500` appears in the rdb-loss command line `seq 1001 1500`. This is the headline teaching number of stage 4, and V07 cannot catch a wrong value there. Any chip that equals a loop bound, key count or `seq` argument (300, 600, 1000, 1500, 10000, 86400, …) has the same blind spot.
- **Suggested fix:** In `checkBm` and `smallNumberOk`, match against the output lines only: drop lines starting with `$ `, `# ` and `127.0.0.1:6379> `, and timeline send lines `[AB] >`. Add a selftest case built from the mutation above (DBSIZE changed and the seq bound still present) that must fail V07.

## 4. Homework H5 can pass vacuously, because the holder sets `hw-check-holder2` even when it never saw the program's lock

- **Severity:** Important
- **Dimension:** 4 (homework checker), and 3 (a check that passes vacuously)
- **Location:** `labs/lesson-06-redis/hw-check.sh:74-79` and `:88`.
- **Evidence:**
  ```
  docker exec "$MAIN" sh -c 'i=0; while [ "$(redis-cli EXISTS …)" = 0 ] && [ $i -lt 3000 ]; do i=$((i+1)); done; while [ "$(redis-cli EXISTS …)" = 1 ] && [ $i -lt 6000 ]; do i=$((i+1)); done; redis-cli SET l06:hw:lock:FA634:A34_S012C hw-check-holder2 NX PX 5000' >/dev/null &
  ```
  - My read-only probe timed one `redis-cli EXISTS` inside the container at `avg_us=1964`. Loop 1 therefore gives up after about 6 s.
  - When loop 1 gives up, loop 2 exits at once, because the lock is absent. The holder then takes the lock anyway. H5 checks only `after = hw-check-holder2`; it does not check that the holder saw the lock appear, or that round 11 logged a `BOOKED`.
- **Failure scenarios:**
  - (a) The guide says "Ngôn ngữ nào cũng được". A solution run through `npx ts-node`, gradle or a cold JVM can take more than 6 s to start. The holder then grabs the lock before the program connects, so both requests are REJECTED, release is never called, and H5 shows ✔ even for a plain-`DEL` solution.
  - (b) A non-atomic `GET`-then-`DEL` release also passes H5. At release time the lock already holds `hw-check-holder2`, so the `GET` mismatches. Stage 8 tells Đạt this two-command pattern is the bug Lua prevents.
- **Suggested fix:**
  - Have the holder `exit 3` without setting anything when loop 1 times out. Then `wait "$holder"`; if the exit code is non-zero, print "H5 không kết luận được" and count it as ✘.
  - Also require the round-11 slice of `l06:hw:log` to contain exactly one `BOOKED`.
  - Say in the H5 row that the check proves token comparison, not atomicity. Atomicity is reviewed by reading the code.

## 5. Stage 1 tells B to paste the whole `sleep` region, so B's `PING` can go out before A's `DEBUG SLEEP` and return PONG at once

- **Severity:** Important
- **Dimension:** 4 (two-terminal pacing for `.redis` blocks)
- **Location:**
  - `assembly/fragments/stage-01.html:155`: step 2 says "Region `sleep` của `01-block.B.redis`".
  - `:160`: the displayed B block is `BLPOP l06:barrier:block-sleep 5` followed by `PING`.
  - `:164`: a later note says to wait 0.5 s before typing `PING`.
- **Evidence:**
  - The block shown for B has two lines. Step 2 tells Đạt to paste the region, not "chỉ dán dòng BLPOP" as stage 8 (step 2 of each scenario) and stage 9 (`stage-09.html:105`) do.
  - In interactive redis-cli, the pasted `PING` line sits in the tty buffer and goes out as soon as `BLPOP` returns. That happens when A's `RPUSH` runs, at the same moment A's redis-cli is sending `DEBUG SLEEP 2`, so the two commands race.
  - The 0.5 s instruction comes after the code blocks, below the table.
- **Failure scenario:** This is Đạt's first two-terminal exercise. In roughly half the attempts B prints `PONG` immediately. The core claim of stage 1 ("một lệnh chậm chặn mọi client") then looks false on his machine, and the W1 replay contradicts what he saw.
- **Suggested fix:** Change step 2 to "Chỉ dán dòng `BLPOP l06:barrier:block-sleep 5`". Add step 4 in the B column: "Khoảng 0,5 s sau khi BLPOP trả về, gõ `PING`". This matches the stage 8 and 9 tables.

## 6. In the two-terminal "race" demos, B's write is hard-coded, so the buggy outcome appears even when the reads never interleaved

- **Severity:** Important
- **Dimension:** 3 and 4 (vacuous evidence in learner reproductions)
- **Location:**
  - `labs/lesson-06-redis/05-counter.B.redis:7`: `SET l06:cnt:views 1`
  - `labs/lesson-06-redis/06-delay.B.redis:7`: `RPUSH l06:delay:done o1`
  - `labs/lesson-06-redis/08-lock.B.redis:7`: `SET l06:seat:FA634:A34_S012C B`
  - `labs/lesson-06-redis/02-json-race.B.redis:8`: hard-coded `"age":30`
  - Expectation rows in `assembly/fragments/stage-08.html:240-241` (`"B"`, `1) "BOOKED:A" 2) "BOOKED:B"`).
- **Evidence:**
  - Each B region writes a literal value that does not depend on what its preceding `GET`/`ZRANGE` returned.
  - The recorded runs are genuine: in `08-lock.nolock.timeline` both reads return `(nil)`, and in `05-counter.getset.timeline` both read `"0"`.
  - When Đạt paces by hand, B's read may come after A's write. B would then see `"A"`, `"1"` or an empty ZRANGE, and a real app would refuse or compute a different value. The lab still writes the "racy" value.
  - The stage-8 check rows (`GET` seat `"B"`, two `BOOKED`) pass whether or not a race happened.
- **Failure scenario:** Đạt is slow on terminal B, and B's `GET` prints `"A"`. B's pasted `SET … B` / `RPUSH … BOOKED:B` still runs, the check table goes fully green, and he concludes "đã tái hiện lost update". He has only reproduced a script that writes blindly. The demo teaches "đọc-quyết định-ghi" but never makes the decision depend on the read.
- **Suggested fix:** Add one expectation row per scenario on B's read: "B GET phải in `(nil)` / `"0"`; nếu B thấy giá trị của A thì race không xảy ra, chạy lại region reset". Alternatively, add a "Ghi lại" PASS rule that requires both reads to show the pre-write value before the result counts.

## 7. The stage-8 renew challenge's PASS criteria cannot fail for a script that returns 1 without calling `PEXPIRE`

- **Severity:** Important
- **Dimension:** 4 (challenge PASS criteria are verifiable)
- **Location:** `assembly/fragments/stage-08.html:209-216`.
- **Evidence:**
  - PASS says: wrong token → `0` and "PTTL không tăng"; right token → `1` and "PTTL quay về gần số ms bạn truyền".
  - The provided commands are `SET … NX PX 10000`, renew with `tokOther 10000`, renew with `tokMe 10000`, and a single `PTTL`.
  - There is no `PTTL` between the two renew calls, so "không tăng" cannot be observed.
  - The renew value (10000) equals the initial TTL, so the final `PTTL` is about 9 900 ms whether or not `PEXPIRE` ran.
- **Failure scenario:** The script `if redis.call('GET', KEYS[1]) == ARGV[1] then return 1 end return 0` (no `PEXPIRE`) meets every stated criterion. Đạt marks the challenge passed with a renew that never renews.
- **Suggested fix:** Use `SET … PX 3000`, run `PTTL` after each call, and renew with `60000`. PASS then requires the `PTTL` after the wrong-token call to be ≤ 3000, and the `PTTL` after the right-token call to be > 50000.

## 8. The stage-1 measured table says all 6 threads are background threads; one of them is the main thread

- **Severity:** Minor
- **Dimension:** 1 and 4
- **Location:** `assembly/fragments/stage-01.html:58`: "Số luồng của redis-server · 6 · Đều là luồng nền (bio_*, jemalloc)".
- **Evidence:**
  - Run `01-bench.threads` lists `redis-server`, `bio_close_file`, `bio_aof`, `bio_lazy_free`, `jemalloc_bg_thd` and `jemalloc_bg_thd`. That is 1 main thread and 5 helper threads.
  - Quiz 1.2 (`stage-01.quiz.json`) states it correctly: "1 luồng chính chạy lệnh và các luồng nền…".
- **Failure scenario:** The table and the quiz contradict each other. A learner who trusts the table answers quiz 1.2 wrong, or concludes the command thread is not among the counted threads.
- **Suggested fix:** Change the cell to "1 luồng chính (`redis-server`) + 5 luồng nền (bio_*, jemalloc)".

## 9. After a quiz answer, the correct option is marked only by colour

- **Severity:** Minor
- **Dimension:** 5 (colour-only meaning, screen readers)
- **Location:** `assembly/shell-tail.html:361-363` and `assembly/shell-css.part:168-169`.
- **Evidence:**
  - After a click, `b.classList.add('right')` / `btn.classList.add('wrong')` only change background and border (`--ok-soft`/`--ok`, `--bad-soft`/`--bad`). All options become `disabled`, with no text or ARIA state saying which one is correct.
  - The explanation says only "Đúng." or "Chưa đúng."
  - In dark mode, `--ok-soft #15291f` on `--bg #111318` is nearly identical. Only the 1 px border `#5ccb93` carries the signal.
- **Failure scenario:** On a colour-blind or screen-reader pass, or on a dim phone in dark mode, a wrong answer shows "Chưa đúng." with no visible or announced indication of which option was right.
- **Suggested fix:** Prepend a text marker ("✔ Đáp án đúng: " / "✘ Bạn chọn: ") to the option labels, or set `aria-describedby` on the options to point at the explanation. Name the correct option in the "Chưa đúng." explanation.

## 10. The driver drill's "exactly 7 bugs" key misses a real lifecycle defect, and the reference solution uses an API that 6.3.0 marks deprecated

- **Severity:** Minor
- **Dimension:** 4 (driver drill and node-redis 6.3.0 API usage)
- **Location:**
  - `labs/lesson-06-redis/driver-drill.ai-snippet.ts:7`, `:12`, `:16`.
  - `labs/lesson-06-redis/hw-solution.mjs:49`.
  - Answer table at `assembly/shell-tail.html:68-77`.
- **Evidence:**
  - One module-level client is shared by two `@Injectable` services. It is connected only in `MenuCacheService.onModuleInit` and closed in `MenuCacheService.onModuleDestroy`. `SeatLockService` breaks if `MenuCacheService` is not instantiated in its module, or once `MenuCacheService` is destroyed first. The answer key has no row for this, and a learner who flags it is "wrong".
  - `@redis/client` 6.3.0, `packages/client/lib/client/index.ts` L2166: `@deprecated use .close instead` on `quit()`. Both the drill and the lời giải mẫu call `quit()`. `runs/driver-claims.txt` C1-C11 never covers `quit`/`close`.
- **Failure scenario:** Đạt finds the shared-client bug, sees the key says "7 lỗi" with no match, and second-guesses a correct review instinct. He also copies the deprecated `quit()` from the reference solution into the OmniPOS hub.
- **Suggested fix:**
  - Either inject the client as a provider (and say so in the key), or add an "ngoài 7 lỗi chính" note listing the shared-client lifecycle.
  - Change `hw-solution.mjs:49` to `a.close(), b.close()`.
  - Add a driver claim quoting L2166.

## 11. When a foreign key has no `:`, C07's fix hint builds a pattern that cannot match it

- **Severity:** Minor
- **Dimension:** 2 (commands Đạt copies must hit the right target)
- **Location:** `labs/lesson-06-redis/check.sh:90-94`.
- **Evidence:**
  - The prefix comes from `sed 's/:.*//'`, and the hint is built as `--scan --pattern '$p:*'`.
  - Take a foreign key `myset` or `counter`, for example left by an earlier lesson or a `redis-benchmark -t set` run, which writes `key:__rand_int__`. The colon-less key is reported as `myset:* 1`, and the suggested UNLINK uses `'myset:*'`, which matches nothing.
  - `xargs` without `-0`/`-d '\n'` also breaks on keys that contain quotes or spaces.
- **Failure scenario:** C07 stays ✘ after Đạt runs the exact command the script printed, and he has no correct next step except improvising a broader pattern on main.
- **Suggested fix:**
  - When the foreign key contains no `:`, print `redis-cli UNLINK '<key>'` for it.
  - Use `xargs -r -d '\n' -n 100` inside the container. Main ships `xargs (GNU findutils) 4.9.0` (checked with a read-only `docker exec advance-be-redis xargs --version`), which supports `-d`.

---

Status: DONE_WITH_CONCERNS
Summary: 11 findings (0 Critical, 7 Important, 4 Minor). The main problems are two Redis 7.2.3 source misstatements in stage 3 (random sampling, the `expired_stale_perc` meaning), the V07 chip blind spot, a vacuous H5 homework pass, a stage-1 pacing trap and vacuous two-terminal/renew evidence.
