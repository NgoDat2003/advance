# Code review ultra · reviewer 2 · Lesson 06 Redis guide

Scope: the packet scope (guide sources in `assembly/`, `labs/lesson-06-redis/**`, `verify/**`, plus `runs/**` as read-only evidence). Read-only queries run: `docker exec advance-be-redis redis-cli CONFIG GET save|dir`, `INFO persistence`. External sources checked: `raw.githubusercontent.com/redis/redis/7.2.3/src/expire.c` and `unpkg.com/@redis/client@6.3.0/dist/lib/client/index.d.ts`. Plan TSV/deviations were read only to avoid re-reporting settled items.

---

## 1. hw-check H5 passes the slide-40 `DEL` bug when the program ignores `HW_TTL_MS`

- **Severity:** Critical
- **Dimension:** 3 (trace integrity / vacuous check) + 4 (homework)
- **Location:** `labs/lesson-06-redis/hw-check.sh:74-79`, `:88` (H5 row); contract text at `:10`, `:21-22`
- **Evidence:** In the H5 holder loop, loop 1 waits until the lock appears. Loop 2 waits *while the lock exists* (`while [ "$(redis-cli EXISTS …)" = 1 ] && [ $i -lt 6000 ]`). After that it runs `SET … hw-check-holder2 NX PX 5000` unconditionally. H5 is ✔ when `GET` returns `hw-check-holder2` afterwards. Nothing checks that the lock actually used `HW_TTL_MS=50`, or that the holder took the lock *while the program was still holding work*. The bad fixture (`verify/hw-bad-fixture.mjs:33`) honours `HW_TTL_MS`, so it never exercises this path.
- **Failure scenario:** Đạt follows slide 40 literally: `SET lock token NX PX 10000` (hard-coded), then plain `DEL`. In normal rounds H1–H4 are ✔. In the H5 round the lock lives for 10 s, and the program `DEL`s it at about 100–200 ms. Loop 2 then sees `EXISTS 0` and the holder sets `hw-check-holder2` *after* the `DEL`, so `after = hw-check-holder2` and H5 is ✔. The grader reports 5/5 ✔ for exactly the defect the capstone teaches against.
- **Suggested fix:** In the holder loop, record `PTTL` when the lock first appears and fail H5 if it is greater than 50 (call it "HW_TTL_MS không được tôn trọng"). Also fail H5 if the holder's `SET NX` happened after the program exited: for example, have the holder `RPUSH l06:hw:log "HOLDER2"` and require that entry to come *before* the program's `BOOKED` entry. Add the hard-coded-TTL + `DEL` variant as a second negative fixture in `negative-tests.sh`.

## 2. H4 checks the log strings, not the lock value, so a constant lock value passes everything

- **Severity:** Important
- **Dimension:** 3 + 4
- **Location:** `labs/lesson-06-redis/hw-check.sh:62`, `:67`, `:87`; contract `:7`
- **Evidence:** `toks=$(… awk 'NF==2{print $2}' | sort -u | grep -c .)` counts distinct second fields of `l06:hw:log` entries. The script never reads the value stored in `l06:hw:lock:FA634:A34_S012C`.
- **Failure scenario:** A solution uses `SET lock "1" NX PX $HW_TTL_MS` and releases with compare-and-delete on `"1"`. It still logs `BOOKED ${randomUUID()}`. H4 is ✔ because the log tokens differ, and H5 is ✔ because `hw-check-holder2` ≠ `"1"`. In production, two requests of the same service share the value `"1"`, and A's compare-and-delete removes B's lock after A's lock has expired. That is guide fix (1), "value phải là token riêng" (`stage-08.html:76`), and the grader does not check it.
- **Suggested fix:** In each normal round, sample `GET lock` from inside the container while the program runs (the same polling loop as H5). Require the sampled value to equal the token in the round's `BOOKED <token>` line. Rename H4 to "giá trị khóa = token của request".

## 3. Active expiry is taught as "random sampling", but Redis 7.2.3 scans `expires` with a cursor

- **Severity:** Important
- **Dimension:** 1 (Redis 7.2.3 correctness)
- **Location:** `assembly/fragments/stage-03.html:30` (diagram "Lấy ngẫu nhiên 20 khóa trong bảng expires", which claims to be "Sơ đồ tự vẽ theo src/expire.c của Redis 7.2.3"); `stage-03.html:201` ("Redis cố ý lấy mẫu ngẫu nhiên"); `assembly/widgets/w3.js:30` (`Math.random()` sampling)
- **Evidence:** In `redis/7.2.3/src/expire.c`, `activeExpireCycle` does `while (data.sampled < num && checked_buckets < max_buckets) { db->expires_cursor = dictScan(db->expires, db->expires_cursor, expireScanCallback, &data); … }`. It repeats while `(data.expired * 100 / data.sampled) > config_cycle_acceptable_stale`. Only `expireSlaveKeys()` uses `dictGetRandomKey`.
- **Failure scenario:** The slide-20 chip for 7.2 says the "20 keys" figure matches the source, and slide 21's verdict repeats "cố ý lấy mẫu ngẫu nhiên". Đạt then repeats in an interview that 7.2 picks 20 random keys. Since 6.0 the cycle walks buckets incrementally with a persistent cursor. That is why it eventually visits every bucket rather than relying on probability.
- **Suggested fix:** Diagram box: "Quét tiếp 20 khóa trong bảng expires từ con trỏ (expires_cursor) của lần trước". Slide 20/21 text: "lấy mẫu theo con trỏ quét, không phải ngẫu nhiên; slide (và tài liệu cũ) nói ngẫu nhiên". W3: keep the simulation label, and note that the widget models sampling, not the cursor walk, or switch to a sequential cursor.

## 4. The fencing token is issued after `SET NX`, in a separate command, without checking `OK`

- **Severity:** Important
- **Dimension:** 1 (lock/fencing explanation)
- **Location:** `labs/lesson-06-redis/08-lock-lua.A.sh:29-31`, `08-lock-lua.B.sh:17-18`; `assembly/fragments/stage-08.html:162` ("Mỗi lần lấy được khóa, người đó INCR …"), `:192` (Postgres bridge `WHERE … AND fence < $2`); `labs/lesson-06-redis/lua/fenced-write.lua:7`
- **Evidence:** A runs `SET … tokA NX PX 2000` and then, as a second round trip, `INCR l06:fence:A34_S012C`, whatever the `SET` replied. The run `08-lock-lua.fencing.timeline` shows a 12 ms gap (`+688 A < OK`, `+700 A > … INCR`).
- **Failure scenario:** This is the "GC pause" the stage itself stages, moved one line earlier. A gets `OK` and pauses before `INCR`. The lock expires. B acquires the lock and gets `INCR → 1`, then writes with token 1. A wakes up, gets `INCR → 2`, and `fenced-write.lua` accepts A's stale write because `2 ≥ 1`, overwriting B. The pattern Đạt copies into Boss Challenge 2 is defeated by the very failure it claims to block. There is also a second inconsistency. Lua rejects only `token < last`, so an equal token is accepted. The SQL bridge uses `fence < $2`, so an equal token is rejected. The two "same" checks disagree.
- **Suggested fix:** Issue the token atomically with acquisition. Add `lua/lock-acquire.lua`: `if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then return redis.call('INCR', KEYS[2]) end return nil`. Use it in both regions, and add one sentence: "token phải được cấp cùng lúc với khóa, nếu không thứ tự token có thể ngược thứ tự khóa". Align the comparisons: either `<=` in Lua → STALE, or `fence <= $2` in SQL, and state which one.

## 5. Recreating main via `docker rm -f -v` (SIGKILL) loses unsaved `l06:my:*` / `l06:hw:*` keys

- **Severity:** Important
- **Dimension:** 2 (safety on the learner's machine)
- **Location:** `labs/lesson-06-redis/00-containers.sh:76` (`docker rm -f -v "$n" # guard-main`), triggered by any `drift()` reason at `:47-62`. `check.sh:58` (C01) and `:134` (C14) advise `00-containers.sh up main` as the fix.
- **Evidence:** Main persists only through the default RDB rules. The read-only query `CONFIG GET save` returns `3600 1 300 100 60 10000`, and `dir` is `/data` (named volume `advance-be-redis-data`). `docker rm -f` sends SIGKILL, so Redis gets no shutdown save. With fewer than 100 changes, the next snapshot can be up to an hour away. The seed and cleanup both promise that "l06:my:* … l06:hw:* không bao giờ bị xóa" (`00-seed.redis:2`, `99-cleanup.sh:8`).
- **Failure scenario:** Đạt writes the stage 8 `l06:my:lock:seat` key, the stage 2 `l06:my:menu:*` keys and homework keys. He then moves or renames the repo folder, or Docker loses the `advance-be-l06` network. The next `up main` reports "lệch bảng … → tạo lại" and kills main, and everything written since the last snapshot is gone. A lesson-02 container (redis:7.4-alpine, anonymous `/data`) is also destroyed, together with its volume, with no prompt; the warning prints only after the decision.
- **Suggested fix:** Before `docker rm`, run `docker exec "$n" redis-cli SAVE` if the container is running and has a `save` rule. Alternatively use `docker stop -t 10 "$n"` first: SIGTERM makes Redis save on shutdown when save points exist. For a foreign-image main, require an explicit `up main --recreate` (print the drift reason and exit 2 without it).

## 6. Stage 8 Tự làm: "PTTL không tăng" cannot be observed, and a stub `return 1` passes

- **Severity:** Important
- **Dimension:** 4 (challenge PASS criteria) + 3 (vacuous check)
- **Location:** `assembly/fragments/stage-08.html:207-212` (PASS list) and `:213-216` (the 4 given commands)
- **Evidence:** The block runs `SET … tokMe NX PX 10000`, renew with `tokOther 10000`, renew with `tokMe 10000`, and then a single `PTTL`. There is no `PTTL` between the wrong-token call and the right-token call. Because the initial TTL equals the renew value, a final `PTTL` of about 9 800 ms looks the same whether or not `PEXPIRE` ran.
- **Failure scenario:** Đạt writes `return 1` for the owner branch (forgetting `PEXPIRE`), or a script that renews regardless of the token and returns 0/1 by comparison. All four PASS lines look satisfied: the return values match, and the final `PTTL` is "gần 10000". The first criterion, "PTTL không tăng", cannot be checked at all.
- **Suggested fix:** Use `SET … PX 3000`, then `PTTL` (about 3000), then the wrong-token renew to 10000, then `PTTL` (still ≤ 3000), then the right-token renew, then `PTTL` (about 10000). Update the PASS lines to quote those three PTTL bands.

## 7. Stage 9 says the driver drill has 6 mistakes; the drill has 7

- **Severity:** Minor
- **Dimension:** 4
- **Location:** `assembly/fragments/stage-09.html:229` ("chỉ ra 6 lỗi") vs `labs/lesson-06-redis/driver-drill.ai-snippet.ts:2` ("Tìm 7 lỗi và 1 chỗ ĐÚNG") and `assembly/shell-tail.html` (answer table rows 1–7 + mồi)
- **Evidence:** The built guide contains both `6 lỗi, mỗi lỗi nối với một run` and `7 lỗi trong một …` (grep of `lesson_06_redis_teacher_guide.html`).
- **Failure scenario:** Đạt stops after finding 6 and misses the `error`-listener/offline-queue defect, which is the one without a run.
- **Suggested fix:** Change it to "7 lỗi (6 nối với một run, 1 nối với tài liệu driver)".

## 8. node-redis 6.3.0: the reference solution uses the deprecated `quit()`, and drill answer 6 calls `multi()` a pipeline

- **Severity:** Minor
- **Dimension:** 4 (node-redis 6.3.0 API)
- **Location:** `labs/lesson-06-redis/hw-solution.mjs:49`, `driver-drill.ai-snippet.ts:16` (not flagged as a mistake), `assembly/shell-tail.html:75`
- **Evidence:** `unpkg.com/@redis/client@6.3.0/dist/lib/client/index.d.ts`: `QUIT(): Promise<string>;` is marked `@deprecated use .close instead`, and `quit` is an alias of it. `runs/driver-claims.txt` C6 itself says `multi()…exec()` is MULTI/EXEC and that `execAsPipeline()` is the pipeline.
- **Failure scenario:** Đạt copies `quit()` into NestJS `onModuleDestroy` and treats `multi()` as a "pipeline". That wraps reads in MULTI/EXEC needlessly, and the deprecated call will break on a future major version.
- **Suggested fix:** Use `await Promise.all([a.close(), b.close()])` in the solution. Either add `quit()` → `close()` as a drill note or leave the snippet as is with a footnote. In answer 6 write "`multi().execAsPipeline()` hoặc `Promise.all`".

## 9. `token-bucket.lua` lets the token count drop when the Redis clock steps back, which the guide says happens on this machine

- **Severity:** Minor
- **Dimension:** 1
- **Location:** `labs/lesson-06-redis/lua/token-bucket.lua:17`; the guide's own evidence of backward clock steps is at `stage-08.html` ("đồng hồ máy ảo Docker … bị chỉnh lùi theo đợt")
- **Evidence:** `tokens = math.min(cap, tokens + (now - ts) / 1000 * rate)` has no guard against `now < ts`. `ts` is then overwritten with the earlier `now`.
- **Failure scenario:** After a backward step of the VM clock, a bucket holding 0.9 tokens goes negative. Requests that should be allowed after refill get 429, and `retry_after_ms` is inflated. This shows up as a flaky FR-M2-05 test that is hard to explain.
- **Suggested fix:** `local elapsed = math.max(0, now - ts)`. Add one line in the stage 9 text that ties this to the stage 8 clock note.

## 10. OmniPOS / Boss Challenge bridge is slightly off

- **Severity:** Minor
- **Dimension:** 4 (bridge accuracy)
- **Location:** `assembly/fragments/stage-09.html:185` ("Mục tiêu 2.3 (token bucket cho sap-master-data/dashboard)"); `labs/lesson-06-redis/lua/idempotency-begin.lua:1` ("OmniPOS FR-M2-01")
- **Evidence:** `plans/handoffs/non-linear-6-clusters-qlhd-boss-challenges-20261024-1712.md:95` reads: "Mục tiêu 2.3: Bọc Cache-Aside + Singleflight + Delete-after-Commit cho sap-master-data và dashboard, kèm Redis Lua Token Bucket". `docs/omnipos-finledger-hub/software-requirements-specification.md:74` defines Idempotency-Key as FR-M2-02. FR-M2-01 is the invoice route.
- **Failure scenario:** Đạt scopes Boss 2.3 as "just reuse token-bucket.lua" and skips the cache and delete-after-commit part, which is the larger half. The Lua header points him to the wrong requirement.
- **Suggested fix:** "Mục tiêu 2.3 chủ yếu là Cache-Aside + Singleflight + Delete-after-Commit (Bài 02); phần rate limit dùng lại token-bucket.lua". Change the Lua header to FR-M2-02.

## 11. `sed`-printed eviction regions are hidden from the learner and not checked by the verifier

- **Severity:** Minor
- **Dimension:** 3 (verifier blind spot / hidden code)
- **Location:** `assembly/fragments/stage-03.html:289-290` (lfu, "giống allkeys-lru từng dòng … thêm `| bash`"), `:302` (volatile-ttl), `:316` (random), `:366` (challenge `sed … | sed 's/…volatile-lru/'`); `verify/verify-guide.mjs` (no rule references `sed -n '/#region`)
- **Evidence:** Today a `diff` of the lru/lfu/random regions with the policy name normalised differs only in the `#region` title line, so the claim holds. But no V-rule checks that (a) each `sed` address matches an existing region header (the lfu/random patterns need a trailing space), or (b) the "giống từng dòng" claim still holds.
- **Failure scenario:** A later edit to the lfu region, such as a changed key count or a renamed region header, makes the guide's `sed … | bash` run unseen code. It can also print nothing, so `| bash` runs nothing and Đạt records an empty result as "kết quả". The gate stays green.
- **Suggested fix:** Add a V-rule: for every `<code>sed -n '/#region X/,/#endregion/p' labs/…</code>`, require that `regionText(file, X)` is non-null. When the surrounding text says "giống … chỉ khác tên chính sách", require that the two regions are equal after the policy name is replaced.

## 12. W9 (and the run row) encodes allowed vs 429 by colour only

- **Severity:** Minor
- **Dimension:** 5 (accessibility)
- **Location:** `assembly/widgets/w9.js:31-34`; `assembly/shell-head.html:29-31` (`.tok` green / `.tok.denied` red, same shape); `assembly/fragments/stage-09.html:155`, `:158` (`aria-label` on a plain `div` with no role)
- **Evidence:** Each dot is an empty `span` that differs only in `background` (`--ok` #5ccb93 vs `--bad` #f2877c in dark mode, which have similar luminance). The per-request meaning is available only through `title`, which touch and keyboard users cannot reach. `aria-label` on a role-less `div` is not announced.
- **Failure scenario:** On a phone, or for a red-green colour-blind reader, the "which request number got 429" pattern of the simulation vs the real run cannot be read. Only the summary line survives.
- **Suggested fix:** Give denied dots a distinct shape or glyph (for example a `✕` text node, or a square shape), add `role="img"` to `.bucket` with an `aria-label` that lists the counts, and keep `title` as an extra rather than the only carrier.

## 13. Stage 1 stats row says all 6 threads are background threads

- **Severity:** Minor
- **Dimension:** 1 / 4
- **Location:** `assembly/fragments/stage-01.html:58` ("Số luồng của redis-server 6 · Đều là luồng nền (bio_*, jemalloc)")
- **Evidence:** `runs/01-bench.threads.txt` lists `redis-server, bio_close_file, bio_aof, bio_lazy_free, jemalloc_bg_thd, jemalloc_bg_thd`: one main thread plus five background threads. The stage 1 quiz Q2 answer says so correctly.
- **Failure scenario:** The table and the quiz contradict each other on the core "one main thread" point of the stage.
- **Suggested fix:** "1 luồng chính chạy lệnh + 5 luồng nền (bio_*, jemalloc); không có I/O thread".

---

Status: DONE
Summary: Critical 1 · Important 5 · Minor 7. The main risks are homework-grader false passes (H5 with a hard-coded TTL + `DEL`, H4 not checking the lock value), the active-expiry "random" claim (wrong for 7.2.3), non-atomic fencing-token issuance, and SIGKILL recreation of main losing unsaved learner keys.
