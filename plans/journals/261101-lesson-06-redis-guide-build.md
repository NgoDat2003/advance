# 2026-11-01 — Lesson 06 Redis teacher guide built (plan --ultra, review --ultra)

**What was built:** the Lesson 06 guide (`reports/advanced_backend/lesson_06_redis_teacher_guide.html`, 487 KB) and the labs (`labs/lesson-06-redis/`). Every number in the guide comes from runs recorded on Redis 7.2.3 in a local container bound to 127.0.0.1. Plan: `plans/261031-1651-lesson-06-redis-teacher-guide/`.

**What went well**
- The 5-candidate plan pass picked plan A with a low margin. The verifier still found 8 must-fix errors in it; one was a benchmark that GETs a key that does not exist.
- The red-team found 39 problems, grouped into 15 and all applied. The most important was that the lab Redis I had started at the beginning of the session listened on 0.0.0.0 with no password.
- The ultra code review kept 30 of 59 findings. 10 of them came from only one reviewer, so the five-way review earned its cost.

**What went wrong, and why**
- *My facts file said the expiry loop "sampled" keys, and the stage-3 writer read that as random.* In 7.2.3 the loop walks the keys with a cursor. Three reviewers caught it from the source code.
- *The fencing token was issued with an `INCR` after `SET NX`.* That hands the larger token to whoever comes second, so an old lock holder could still write. The lock and the token now come from one Lua script.
- *The homework check H5 could pass a plain `DEL`.* It only looked at the final value, not how that value got there. It now checks the program's TTL and how the program releases the lock.
- *The interrupted session lost two agents that had written nothing yet.* Agents now write their report as they go.
- *Machine quirks:*
  - The Docker VM clock runs about 8 % fast and gets stepped back, which shifted TTL-based lock timings.
  - redis-cli prints `(N.NNs)` only when a command takes ≥ 0.5 s.
  - Git Bash rewrites `/lab` to `D:/Git/lab`.
  - `WAIT` counts only writes on its own connection.

**Decisions**
- Đạt chose plain-command stage checks over Lua PASS/FAIL scripts; this is saved to memory.
- Đạt chose node-redis 6.3.0 and keeping only the main container up.
- I raised the size budget to 520 KB rather than cut teaching text.
- I made learner-written files `my-*`, and the lint skips them.

**Next:** Cluster 1 Phase B, then study Lesson 06, then K2 Bài 04 and OmniPOS M2.
