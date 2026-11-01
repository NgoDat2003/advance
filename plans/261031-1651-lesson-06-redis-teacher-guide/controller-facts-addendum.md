# Controller facts addendum (2026-10-31, after the candidate wave started)

These facts were confirmed after the planning packet was frozen. The verifier may use them to judge correctness. They do not change the packet itself.

1. **Port 6379 has two listeners on the host.** `com.docker.backend` (PID 30744) listens on 0.0.0.0/[::], and `wslrelay` (PID 8712) listens on 127.0.0.1/[::1]. WSL Ubuntu runs no redis process; its `*:6379` is Docker's forward. A raw `INFO server` sent to 127.0.0.1:6379 and to [::1]:6379 returns the same `run_id` as `docker exec advance-be-redis redis-cli INFO server` (4de11519…). So DBX `ADVANCE_BE_REDIS` reaches the lab container. Re-check `run_id` after any container recreate.
2. **Active-expiry constants in Redis 7.2.3** (`src/expire.c` at tag 7.2.3, lines 107–153):
   - `ACTIVE_EXPIRE_CYCLE_KEYS_PER_LOOP 20`
   - `ACTIVE_EXPIRE_CYCLE_FAST_DURATION 1000` µs
   - `ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC 25` (maximum CPU %)
   - `ACTIVE_EXPIRE_CYCLE_ACCEPTABLE_STALE 10`
   - With the default `active-expire-effort 1`, the effort term is 0. The loop therefore repeats while more than **10 %** of the sampled keys were expired.

   Slide 20 says "25 %". In 7.2, 25 is the CPU cap, not the repeat threshold, so slide 20 gets chip "Cần sửa" or "Đúng một phần".
3. **redis-cli and comment lines.** When input is piped, redis-cli sends a `#` line as a command and returns `ERR unknown command '#'`. Two candidates found this independently.
4. **Red-team security fix applied:** the lab container was recreated with `-p 127.0.0.1:6379:6379`, so it is no longer reachable from the LAN. The new run_id is `5e40632a…`. The only host listener is now `127.0.0.1:6379` (Docker); `wslrelay` is gone, and `::1:6379` refuses connections. Every host-side client, including DBX `ADVANCE_BE_REDIS`, the homework and the driver drill, must use `127.0.0.1`, not `localhost`. On Windows, `localhost` may try `::1` first and fail with ECONNREFUSED.
5. **DBX smoke S5 (2026-11-01, controller via the DBX MCP `dbx_execute_redis_command` on `ADVANCE_BE_REDIS`):**
   - `INFO server` returned the same `run_id` as `docker exec` and host TCP 127.0.0.1, so DBX reaches the lab container.
   - A two-line input (`SET …` newline `INCR …`) was sent as one command and returned `ResponseError: syntax error`, and no key was written.
   - Conclusion: DBX runs one command per execution. Contract §5 already says this; DBX stays a key browser and single-command console.
   - The run_id changes on every container restart; only `run_id_match` is meaningful.
6. **Docker VM clock drift (2026-11-01, measured by the phase 03 recorder):**
   - The Docker VM clock ran about 8.3 % fast against the Windows host (ratio 1.0832 and 1.0838 over two 10 s windows).
   - Its offset was stepped back (about −2800 ms at 09:43, −791 ms at 10:31).
   - Redis key expiry uses wall-clock time, so in 2 of 6 `ttldel` reps a `PX 2000` lock was still alive at host +2.5 s.
   - Lock-lab margins were widened inside the frozen R41 predicates (B acquires at +2.8 s, A works 3.3 s).
   - The guide's stage 8 narrates this as live evidence for the Redlock critique: TTL lifetimes depend on the server clock.
7. **Correction from the ultra code review (2026-11-01, validated in `src/expire.c` 7.2.3 lines 249–321):**
   - The 7.2.3 active-expire cycle does not pick keys at random. It walks the expires table with a saved cursor (`db->expires_cursor` + `dictScan`), checking about 20 keys per loop and resuming where it stopped. Only writable replicas use random keys. The constants in item 2 still hold (20 keys/loop, repeat while > 10 % stale, 25 % CPU cap).
   - `expired_stale_perc` is an exponential moving average (each cycle weighs 5 %), not "the share of expired keys still present right now".
   - Item 2's wording ("sampled keys") misled the stage-3 writer, which is why this addendum corrects it.
