# Evidence packet — K2 Bài 04 (Caching: Rate Limit, Counter, Practices) teacher guide

Immutable input for the `/ak:plan --ultra --tdd --advice` candidates and the verifier. Controller: main session, 2026-11-02 20:25 (Asia/Saigon). Plan dir: `plans/261102-1332-k2-lesson-04-caching-teacher-guide/`.

## 1. Request and settled decisions

User (Đạt, Vietnamese): "tương tự tạo bài giảng cho sau bài redis đi --ultra --advice", invoked as `/ak-vibe`. Meaning: "Same as before, create the lesson that comes after the Redis lesson."

Settled by the user on 2026-11-02 (do not re-open):
1. **Lesson = K2 Bài 04 "Caching"** from the System Design course (folder `Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/`, file `04. Caching.md`, 39 slides). Đạt numbers his courses K1 = Advanced Backend, K2 = System Design (vendor folder "Khóa 3"), K3 = Kafka. Two handoffs name this lesson as the next step of Cluster 2 after K1 Bài 06 Redis: "Continue Cluster 2: K2 Bài 04 Rate Limiting, then OmniPOS M2" (`plans/handoffs/lesson-06-redis-guide-ready-20261101.md`, `plans/handoffs/non-linear-6-clusters-qlhd-boss-challenges-20261024-1712.md` milestone 2).
2. **Overlaps are re-measured in full.** The lesson is self-contained. Slides that overlap Lesson 06 are not reduced to a link: token bucket (L06 stage 9), delay task with ZSET (L06 stage 6), cluster 16384 hash slots (L06 stage 7), and client-side race (L06 stages 2 and 5). Each gets its own experiment and recorded run in this lesson's lab. A one-line "đã gặp ở L06 chặng N" back-link is still welcome.
3. **Bloom filter (slide 37) is hand-built** on plain Redis 7.2.3: a small Lua script computes k bit positions and uses `SETBIT`/`GETBIT`, and the lab measures the false-positive rate against the formula. There is no RedisBloom module and no redis-stack image.

Settled by the controller (follows precedent; candidates do not re-open these):
- Work on `main`. **No branch, worktree, commit, push, PR, GitHub issue or label** (memory rule `work-on-main-no-ship`, from a user correction on 2026-10-24; `gh` is not installed). Leave changes uncommitted. Only `git status` may be used.
- Guide: `reports/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/k2_lesson_04_caching_teacher_guide.html`. The folder exists and is empty; README routes Khóa 3 guides there.
- Labs: `labs/k2-lesson-04-caching/`. Redis key prefix `k2l04:`. localStorage keys `k2l04-*`.
- Postgres side (counter on a relational DB, slides 20–21): a new schema `k2l04_counter` in database `advance_be_lab`. Nothing is written in any other schema.
- Plan, evidence, verify and assembly artifacts all live in the plan dir.
- `--advice` is active. The final plan is a handover plan, executable by a Sonnet-class model. Every phase file carries per-task Goal / Target files / Steps / Success criteria / Verify fields, plus the literal Failure Protocol block (contract in §8).

## 2. Learner profile and accepted format

- Đạt is a fullstack dev: NestJS 10 + Prisma 7.9 via pnpm, PostgreSQL 16. He works at an F&B chain (300+ stores) and learns in Vietnamese. He also acts as PM/Tech Lead and has asked for 50/50 guided fill-in-the-blank scaffolds (`__1__`…) for coding exercises, so he spends his effort on the key decision, not on boilerplate.
- Mastered: K1 01 (REST, idempotency key), 02 (cache-aside, stampede, singleflight, TTL jitter, null cache, Bloom filter in JS — `labs/lesson-02-caching/05-cache-penetration-null-cache-bloom.mjs`), 03 (index), 12 (MVCC), 14 (locking, SKIP LOCKED, optimistic version), 07 (data modeling, ledger). Cluster 1 project milestone M1 is done (OmniPOS hub, tag `m1`).
- **In progress right now:** K1 Lesson 06 Redis, stage 2 of 9, tonight (2026-11-02) on this Home PC. K2L04 will be studied after L06 is finished (≈2026-11-04 or later). K2L04 must therefore be correct without assuming L06 was completed, while it may reference it.
- Project rules (`CLAUDE.md`, `AGENTS.md`):
  - Anti over-engineering: no heavy harness for the learner.
  - Plain Vietnamese comments.
  - "Làm mẫu (walkthrough) → Tự làm (hands-on challenge)".
  - Diverse tools: redis-cli, DBX, psql/DBX for Postgres, cURL/Postman if an HTTP piece exists.
  - Cumulative integration: each lesson builds on the previous one.
  - **Slow pacing and a glossary first:** explain every new command in plain Vietnamese before asking him to run it (latest handoff, 2026-11-02).
- Memory rules (authoritative):
  - Copy the single-column shell with **no left rail** from the newest guide (L06 / L07 / L14).
  - Use per-lesson storage keys.
  - Read the course `.md`, not the PDF, cite "Trang N", and embed images from `assets/04_Caching/`.
  - A stage's **"kiểm chứng" block is plain client commands plus a `table.expect` of recorded values.** There are no Lua or scripted PASS/FAIL checkers in front of the learner, and no script appears before the stage that teaches it. Learner data comes from readable shell pipes (`seq | awk | redis-cli`), not `EVAL` loops. Scripting for verification is controller-only, in `verify/`.
  - ORM and driver claims are verified via published sources (unpkg), never `node_modules`.
- **Learning mode:**
  - Every experiment is a small self-contained snippet he runs himself (`.redis` piped into `redis-cli`, a short `.sh`, or `.sql` in DBX/psql), and he sees real output.
  - Per-stage format: "Concrete story / question → visual diagram → measured stats table from his machine → 30-second check".
  - Complex diagrams are inline SVG inside the HTML guide, opened in the browser. The terminal cannot render Mermaid or SVG.

## 3. Reference artifacts (read these)

**Source slides:** `Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/04. Caching.md` (39 pages, images in `assets/04_Caching/page_NN_img_MM.*`). Page map:

| Pages | Content |
|---|---|
| 1 | title quote + image |
| 2 | outline: Fundamentals / Rate Limit / Practices |
| 3 | section: Fundamentals |
| 4 | where cache is used (image) |
| 5 | use cases: speed; buffer ≠ cache (MQ as buffer); communication / share data |
| 6 | cons: Pub/Sub `UNSUBSCRIBE` costly, single-thread CPU, inconsistency, memory, bandwidth |
| 7 | Redis in production: ~50k TPS SET, ~80k QPS GET, ~250M keys/instance (2^32 in theory), 32 GB/instance recommended, 60K connections; redis-benchmark, K6 |
| 8 | Cluster pros/cons |
| 9 | 16384 hash slots |
| 10 | data-structure image |
| 11 | remind: local cache, read+write strategy, penetration, avalanche, Sentinel/Cluster, "Reference: Advanced Backend" |
| 12 | section: Rate Limiting |
| 13 | fixed window: simple; bursts at the window boundary |
| 14 | sliding window counter: the rolling minute overlaps 70 % of the previous minute, and 30 % of the current minute has elapsed. Estimate = prev × 0.7 + current × 1.0 (image: 5 × 0.7 + 3 = 6.5 > 5/min → deny). Smoother, but "still unable to limit bursts within a short period" |
| 15 | leaky bucket via message queue: steady rate, easy; latency from queueing |
| 16 | token bucket: stores only a number → memory and latency; preferred; Guava / Redis; one Redis RTT per request → **take a batch of tokens**; image shows 4 tokens refilled every 1 minute |
| 17 | section: Practices |
| 18 | section title: Counter in News Feed System |
| 19 | Counter in Threads: likes/comments/shares/views per post, posts/followers/following per user; NFR accurate, performance, availability, persistence; 1B users, 200M DAU, 1M QPS |
| 20 | relational DB: `SELECT … FROM post_count`, repeated `UPDATE post_count SET like_count = like_count + 1 WHERE post_id = 1` → "not optimized for burst of writes" |
| 21 | solution 1 batch insert (still limited), solution 2 queue in front of DB (latency) |
| 22 | Redis optimal: accurate (single thread → no race), latency (memory), throughput (clustering), memory: Hash to save memory, cold vs hot (auto-tiering, Pika) |
| 23 | section title: Design Unread Broadcast Counter |
| 24 | requirement: number of unread broadcast notifications, not counted in FE, accurate, low latency, 10M users |
| 25 | solution 1: count on all users (slow traversal); solution 2: pointer per user (image: user A has read notification 4 of 6) + poll |
| 26 | section: Share Data |
| 27 | two-way communication over one-way MQ (REST-like request/response) |
| 28 | reply topic: A sends, B receives the reply; how to share replies and get them fast |
| 29 | remote message pool in Redis: key `message_id`, value response; request thread polls |
| 30 | replicated caching pattern (Hazelcast) |
| 31 | recap: cache = speed + buffer + share data; token bucket preferred; Redis easy to change data/solve problems |
| 32 | homework: practise Lua; research network I/O models |
| 33 | race condition (client side): Transaction + optimistic lock `WATCH`; Lua recommended (simpler, faster) |
| 34 | delay task: cronjob / execute at a time → ZSET |
| 35 | count unique visits per page per day by IP; low latency, low storage, accuracy > 95 % → HyperLogLog |
| 36 | segmentation: classify books, genre check, intersection Fiction ∩ Adventure; low latency/storage → Bitmap (Grab's Segmentation Platform) |
| 37 | username taken: public API, low latency, high throughput, protect DB → Bloom filter |
| 38 | references (Pika) |
| 39 | thank-you (2 images) |

Title/section-only or closing pages: 1, 2, 3, 12, 17, 18, 23, 26, 38, 39. Pages 10, 11 and 31 are recap pages. Page 32 is homework.

**Build-system model (copy and adapt; do not invent a new framework):** Lesson 06 Redis — `plans/261031-1651-lesson-06-redis-teacher-guide/`. Read:
- `plan.md`: stage map, matrix, acceptance criteria, risks, red-team table, materialization must-fix.
- The phase files.
- `assembly/contract.md`, `assembly/assemble.mjs`, `assembly/shell-*.html` / `shell-css.part`, `assembly/fragments/stage-0N.html` + `.quiz.json`, `assembly/widgets/`.
- Verify tooling:
  - `verify/run-redis.mjs` (runner: regions, host-ms timeline, A/B barrier, manifest).
  - `verify/lab-text.mjs` (display rule).
  - `verify/verify-guide.mjs` (V01–V19).
  - `verify/expected.tsv`.
  - `verify/rerun-gate.mjs`, `verify/negative-tests.sh`, `verify/widget-smoke.mjs`, `verify/make-widget-data.mjs`.
  - `verify/fingerprint.sh`, `verify/deviations.md`.
- `controller-facts-addendum.md`: lessons learned, see §5.
- Labs `labs/lesson-06-redis/`: `00-containers.sh`, `00-seed.redis`, `check.sh`, `99-cleanup.sh`, `lua/*.lua`, `hw-check.sh`, `hw-solution.mjs`, `driver-drill.ai-snippet.ts`, `package.json` (node-redis 6.3.0).
- Built guide `reports/advanced_backend/lesson_06_redis_teacher_guide.html` (487 KB, 46 slides, 9 stages, 36 quiz, 10 interview questions, 9 widgets): skim the structure, the script block and one full stage.

The Postgres-side precedent is Lesson 07 (`plans/261027-1328-lesson-07-data-modeling-teacher-guide/verify/run-lab.sh`: `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab …`; labs as `.sql` files run in DBX).

**Bridge targets:**
- `docs/omnipos-finledger-hub/software-requirements-specification.md` §M2:
  - FR-M2-05: Lua token bucket per `storeId`, params from env; one store fires 30, capacity 10, very slow refill → exactly 20×429 with `Retry-After`.
  - FR-M2-06: hub Redis on 6380.
  - FR-M3-04 / ADR-010: Đạt decides fail-open vs fail-closed for rate limit when Redis is down.
  - NFR-10: throttle limits come from env, so there is 0×429 outside the rate-limit test.
- `docs/omnipos-finledger-hub/architecture-evolution.md` (ADR-007, ADR-010, Redis 128 MB maxmemory budget).
- Boss Challenge 2 on `quan-ly-hop-dong` (handoff `non-linear-6-clusters…` milestone 2, target 2.3: Redis Lua token bucket rate limiting).

## 4. Content scope (settled)

The guide maps all 39 slides once, with verdict chips on claim slides. It covers these blocks, each with experiments recorded on this machine.

1. **Fundamentals measured (slides 4–11)**
   - Use cases speed / buffer / share data.
   - The cons on slide 6 checked: Pub/Sub `UNSUBSCRIBE` cost in 7.2, CPU of one thread, memory, bandwidth.
   - Slide 7 production numbers vs `redis-benchmark` on this machine: SET/GET, `maxclients` default, `2^32` keys, 32 GB guidance.
   - Cluster (8–9) re-measured on a cluster-enabled container: `CLUSTER KEYSLOT`, hashtag, `CROSSSLOT`.
   - Data structures (10) as a map into later stages.
2. **Rate limiting (slides 12–16), the core of the lesson.** Each algorithm is implemented as a small Redis snippet and attacked with the same traffic:
   - **Fixed window:** `INCR` + `EXPIRE`/`SET NX EX`. Show the boundary burst (≈ 2× limit inside a short span across the boundary). Show the classic non-atomic `INCR` then `EXPIRE` bug: a key without TTL.
   - **Sliding window log:** ZSET with `ZREMRANGEBYSCORE` + `ZCARD` + `ZADD` in one Lua call. Exact, with measured memory per entry.
   - **Sliding window counter:** slide 14 formula, estimate = prev × (1 − elapsed fraction of the current window) + current. Measure how far it is off vs the log on the same traffic, and test the "short burst" claim.
   - **Leaky bucket as a queue:** Redis List + a worker draining at a fixed rate. Measure queue delay, which is the latency cost the slide names, and overflow behaviour. The meter variant is optional.
   - **Token bucket in Lua:** continuous refill vs the slide's interval refill. Measure atomicity: a two-client race, naive vs Lua. Measure memory, a Hash of 2 fields.
   - **Batch tokens (slide 16 solution):** measured RTT/round-trip count and latency, one call per request vs one call per 10 tokens. Show the over-admission trade-off.
   - **Response contract:** 429 + `Retry-After`, plus fail-open vs fail-closed (ADR-010).
   - **Comparison table:** the same traffic through every algorithm (allowed/denied, memory, accuracy).
3. **Counters at scale (slides 18–22)**
   - Postgres hot-row `UPDATE … + 1` burst (pgbench or concurrent sessions on `k2l04_counter`) vs Redis `INCR`/`HINCRBY` under the same concurrency, with throughput and lock waits shown.
   - Batching / write-behind: a Redis delta flushed to Postgres periodically with an atomic read-and-reset. Show what is lost when Redis dies before a flush, which is the persistence NFR.
   - Accuracy: N concurrent increments end at exactly N.
   - Memory: 4 String keys vs 1 Hash vs bucketed Hashes per post, with `MEMORY USAGE`.
   - Hot vs cold data: Pika / auto-tiering, honestly labelled "chưa đo".
4. **Unread broadcast counter (slides 23–25)**
   - Solution 1 "count on all users", a fan-out increment to N users: time and commands measured at a scaled-down N, then extrapolated honestly to 10M.
   - Solution 2 pointer per user: unread = latest id − last read, or `ZCOUNT` above the pointer. O(1) read; memory per user measured.
   - Mark-as-read atomicity.
5. **Share data (slides 26–30)**
   - Request/reply between "instances": a remote message pool in Redis (key `message_id` → response, with TTL).
   - Polling cost measured: number of polls / latency vs a blocking alternative (per-request List + `BLPOP`) — a two-client timeline.
   - Replicated caching (Hazelcast) as a design. Redis 7 client-side caching (`CLIENT TRACKING`) is optional if it can be shown with redis-cli; otherwise it is diagram-only and honestly labelled.
6. **Practices (slides 33–37)**
   - Client-side race: GET-then-SET lost update; `WATCH`/`MULTI`/`EXEC` with a two-client abort (`EXEC` → nil); the Lua alternative.
   - Delay task ZSET with an atomic claim (two pollers).
   - HyperLogLog unique visitors: accuracy at several N, memory sparse → dense, `PFMERGE` for a weekly view.
   - Bitmap segmentation: genres as bitmaps, `BITOP AND` intersection, `BITCOUNT`, memory per N books, the sparse-offset pitfall.
   - Hand-built Bloom filter with `SETBIT` + Lua: k positions from `redis.sha1hex` slices or double hashing. Measured false-positive rate vs `(1 − e^{−kn/m})^k`, memory vs a Set of usernames, and the "never false negative" property.
7. **Homework (slide 32 + rate limit)**
   - A self-check rate-limit exercise the learner writes (Lua), e.g. OTP/login limits or the FR-M2-05 shape, with a `hw-check.sh` that the learner runs, plus "research network I/O models" as a reading pointer.
   - The planner chooses the exact task.
8. **Bridge:** OmniPOS M2 FR-M2-05 (which algorithm and why; batch tokens; `Retry-After`; fail-open/closed ADR-010) and Boss Challenge 2.3 on `quan-ly-hop-dong`. An optional NestJS/node-redis drill on an AI-written rate-limit guard with seeded mistakes is welcome if it stays small:
   - `INCR` then `EXPIRE` not atomic.
   - In-memory counter in a multi-instance deployment.
   - Fixed window for login.
   - No `Retry-After`.
   - `KEYS`.
   - A Redis error crashing the request vs a deliberate fail-open.

The slides are partly outdated or simplified, so the guide says what Redis 7.2 / PostgreSQL 16 actually do, with a measurement, using chips `Đúng trên Redis 7.2` / `Đúng một phần` / `Cần sửa` (Postgres claims may use "Đúng trên PG 16"). Design-only claims that cannot be measured locally (Pika, auto-tiering, Hazelcast, 1M QPS, 10M users) are labelled "chưa đo trực tiếp".

## 5. Facts measured by the controller on this machine (2026-11-02)

**Docker and ports**
- At session start only `quan-ly-hop-dong-postgres-1` (PG 16.15, published `0.0.0.0:5433`, holds DB `advance_be_lab`, which is the lab DB, and the company's dev data; treat the container itself as foreign) was up.
- **During this session `advance-be-redis` (L06 main, `127.0.0.1:6379`) was started, most likely by the learner for tonight's L06 stage 2.** The K2L04 build must not touch it: no config changes, no key writes, no restart, and no L06 scripts that mutate state (`00-containers.sh up/down/reset`, `99-cleanup.sh`).
- L06 `check.sh` C07 marks ✘ for **any key in db 0 of `advance-be-redis` whose prefix is not `l06:`**. L06 C12 uses db 15 on that container. So K2L04 keys on L06's main would break L06's check.
- `netstat` LISTENING: 5433 (Docker + wslrelay), 6379 (Docker, `advance-be-redis`). Ports 6380 (reserved for the OmniPOS hub, never use), 6381, 6382 and 5435 are free.
- `omnipos-hub-pg` (5434) exists but is exited; it belongs to the hub, do not touch.
- Many old company/other containers are exited; never touch them.
- Images present locally, so no pull is needed: `redis:7.2.3`, `redis:alpine`, `postgres:16-alpine`, `postgres:13.3`.
- K2L04 therefore needs **its own lab container(s)** with its own names, network and volume, published on `127.0.0.1` only. The names are frozen in §9 item 3.
  - L06 tooling (`check.sh`, `99-cleanup.sh`, the `fingerprint.sh` compare) must still pass unchanged.
  - L06 `99-cleanup.sh` removes only its own extras by exact name.
  - L06 `check.sh:136` fails C14 for any container whose name contains `advance-be-redis-` and publishes a port.
- **Docker VM clock** (L06 `controller-facts-addendum.md` item 6): runs about 8 % fast and gets stepped back by up to −2.8 s.
- **New today:** a `redis-benchmark -q -n 100000 -t incr` run printed `INCR: -38314.18 requests per second, p50=0.159 msec`, a negative rate from a clock step.
  - The same command with `-P 16` printed 1,923,076.88 req/s, p50 0.311 ms.
  - Any timing must be robust to this: repeat, reject non-positive or absurd values, prefer host-side timing or p50 latency, and label "phụ thuộc máy".

**Redis 7.2.3 probe** (throwaway container `advance-be-redis-k2probe`, removed after use):

| Probe | Result |
|---|---|
| `INFO server` | `redis_version:7.2.3`, `os:Linux 6.18.54.1-microsoft-standard-WSL2 x86_64`, `multiplexing_api:epoll` |
| HLL `PFADD h1 a` | `OBJECT ENCODING` → `raw` (an HLL is a String), `MEMORY USAGE` 96 B (sparse) |
| HLL, 100,000 distinct `ip1..ip100000` | `PFCOUNT` 99,655 (−0.345 %), `STRLEN` 12,304 (dense), `MEMORY USAGE` 14,384; first 4 bytes `HYLL` |
| HLL config | `hll-sparse-max-bytes 3000` |
| Bitmap `SETBIT b1 9999999 1` | `STRLEN` 1,250,000, `MEMORY USAGE` 1,310,768, `BITCOUNT` 1 (sparse-offset pitfall: one bit costs 1.25 MB) |
| Lua | `redis.sha1hex('abc')` works; libraries `bit`, `cjson`, `struct`, `cmsgpack` available; `redis.call('TIME')` allowed inside scripts; `bit.band`/`bit.bxor` work |

**From L06** (2026-10-31, same image), still valid:
- `io_threads_active:0`.
- Defaults: `hz 10`, `maxmemory 0`, `maxmemory-policy noeviction`, `appendonly no`, `enable-debug-command no`.
- `CLUSTER KEYSLOT` needs `--cluster-enabled yes` (`ERR This instance has cluster support disabled`).
- GET 158,478 req/s → 1,960,784 with `-P 16`.

**L06 gotchas that also apply:**
- redis-cli sends a piped `#` line as a command (`ERR unknown command '#'`), so strip comments for piping/display.
- DBX's Redis console runs **one command per execution**; multi-line input becomes one bad command. DBX is a key browser and single-command console only.
- Host clients use `127.0.0.1`, never `localhost` (`::1` refused).
- In Git Bash, `/lab/...` container paths need `MSYS_NO_PATHCONV=1` (or `//`).
- In two-terminal steps, paste only the barrier line (`BLPOP`) first.
- `WAIT` counts only the calling connection's writes.

**Redis 7.2.3 source** (`src/pubsub.c` at tag 7.2.3, fetched from GitHub raw):
- `server.pubsub_channels` maps a channel to an `adlist` of clients.
- `pubsubUnsubscribeChannel` does `listSearchKey(clients,c)` then `listDelNode`. Removing one client is therefore **O(number of subscribers of that channel)**, which supports slide 6's "UNSUBSCRIBE is costly" for heavily subscribed channels.
- Whether to measure it (it needs many subscriber connections) or to cite the source with a "đọc mã nguồn 7.2.3" note is the planner's call.

**Postgres**
- DBX `ADVANCE_BE_LAB` → 127.0.0.1:5433, DB `advance_be_lab`, PostgreSQL 16.15 (Alpine, musl).
- Existing schemas: `lab03_indexing`, `lab07_modeling`, `lab12_transaction`, `lab14_locking`, `lab_imdb`, `northwind`, `public`. `k2l04_counter` is new.
- `pgbench (PostgreSQL) 16.15` and `psql 16.15` exist in the `postgres:16-alpine` image, so `docker exec … pgbench -n -f <script>` against `advance_be_lab` is possible, as is a throwaway container.
- The controller env has **no `PG_URL`**. L03/L14 Node labs ask the learner to set `PG_URL` himself. L07 used DBX + `docker exec … psql -U postgres -d advance_be_lab` (in-container local auth). No password may be printed or written.

**Learner tools:** Node.js is installed; `labs/lesson-06-redis/package.json` pins `redis` (node-redis) 6.3.0. `redis-cli`, `redis-benchmark`, `psql` and `pgbench` exist only inside containers, not on the Windows host.

**Render check:** `node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs <file> --out <dir>` (375/768/1440, runtime errors, overflow, touch targets). Run with `TMP`/`TEMP` inside the project. Its out dir must be under the plan dir.

## 6. Constraints

- Output only inside `D:/study/advance-be`. Paths are as in §1.
- Redis writes only on K2L04-owned lab containers. Keys are namespaced `k2l04:`, so cleanup can `SCAN`+`UNLINK` them. `FLUSHALL` is allowed only on a K2L04 container the plan created, and never on `advance-be-redis`. Config changes are reverted in the same region. No `docker system/volume prune`.
- Postgres writes only in schema `k2l04_counter`. Other schemas are read-only, and `northwind` is read-only too. Bounded load only (seconds, not minutes; few clients); no `ALTER SYSTEM`, no server restart.
- Every number in the guide comes from a recorded run on this machine (date-stamped, sha256 manifest as in L06). If a measurement contradicts a slide, the narrative changes, and the data is never edited. Timing values are labelled machine-dependent.
- No secrets or connection URLs with passwords printed.
- HTML page contract (same as L06):
  - Tokens on `:root`; dark mode via `prefers-color-scheme` guarded by `:root:not([data-theme="light"])` and `:root[data-theme="dark"]`; explicit body background.
  - Works at 375 px with a 16 px gutter and no horizontal page scroll; 44 px touch targets.
  - localStorage wrapped in try/catch.
  - Fonts only from Google Fonts; no external scripts.
  - Size budget stated by the plan (L06 shipped 487 KB under a 520 KB budget).
- Study time: one day, about 4.5–5 h core, with optional extras marked and homework in the evening. "Re-measure overlaps" may push the core up; if so, mark items "nếu còn sức" rather than cutting content.

## 7. Post-implementation (vibe pipeline, adapted)

- `/ak:code-review --pending --ultra --advice`: 5 independent reviewers + verifier, union of validated findings. Fix every Critical/Important and re-run the affected checks.
- Conditional `/ak:test` only if the plan's TDD coverage has a gap.
- Docs: add the K2L04 route to `README.md` (Khóa 3 section and labs list) and `TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md` (or the master index the plan finds that owns K2 rows). Add a "tiếp theo" link from L06's guide `#tiep-theo` **only if** that is a one-line edit applied to both the built guide and L06 `assembly/shell-tail.html`.
- Handoff note in `plans/handoffs/`.
- No ship/PR/merge steps (§1).

## 8. Handover contract (`--advice`)

Every phase file in the final plan must contain, verbatim, this block:

```markdown
## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.
```

Each phase is decomposed into ordered tasks with:
- **Goal**
- **Target files and symbols:** exact paths.
- **Steps**
- **Success criteria**
- **Verify:** `no verification needed`, or a mechanical pass condition, meaning an exact command plus the exact expected exit code / substring / file / value.

Under `--tdd`, a red-first task states its expected failing result as the pass condition.

## 9. Supervisor-settled rules (kongming counsel applied by the controller, 2026-11-02)

Source: `kongming-investigation-counsel.md`. These rules override any "planner decides" wording above.

1. **Slide 14 formula:** estimate = prev × 0.7 + current × 1.0 (fixed in §3/§4).
2. **Stage order (dependency order, not slide order):**
   - Slide 33 (client-side race: GET-then-SET, `WATCH`/`MULTI`/`EXEC`, Lua) is taught in a tools stage **before** rate limiting, because sliding log and token bucket need Lua.
   - No Lua appears before that stage.
   - The slide map still lists every slide once.
3. **Containers (frozen names):**
   - All K2L04 containers are named `advance-be-k2l04-*`, on network `advance-be-k2l04`, with their own volume(s) `advance-be-k2l04-*`.
   - The main lab container `advance-be-k2l04-redis` is published on `127.0.0.1:6381` only. Extras, such as a cluster-enabled node, publish no port.
   - The K2L04 `check.sh` scans only its own prefix.
   - L06's `advance-be-redis` may be up or down on study day; nothing in K2L04 depends on it.
   - The learner adds a DBX connection `ADVANCE_BE_K2L04_REDIS` (127.0.0.1:6381, db 0).
4. **Postgres method:**
   - The learner runs `.sql` files in DBX `ADVANCE_BE_LAB`.
   - The controller, and the pgbench load, use only `docker exec -i quan-ly-hop-dong-postgres-1 psql|pgbench -U postgres -d advance_be_lab …`.
   - pgbench is always `-n -f <script>` (never `-i`), with `-c ≤ 8 -T ≤ 5`. The script touches only `k2l04_counter.*`. It is fed via `/dev/stdin`, or via a `/tmp` file removed in the same command (phase-01 smoke decides).
   - Gate: the schema list of `advance_be_lab` is unchanged before/after, except for `k2l04_counter`.
5. **Chips:**
   - Exactly three: `Đúng trên Redis 7.2` / `Đúng một phần` / `Cần sửa`. The platform goes in the chip note (e.g. "đo trên PG 16.15", "đọc mã nguồn 7.2.3", "chưa đo trực tiếp"), so the L06 verifier's chip rule is reused unchanged.
   - Null-chip slides are frozen: **1, 2, 3, 10, 12, 17, 18, 23, 26, 32, 38, 39**.
   - Recap slides 11 and 31 get design rows (like L06 D42). Every other slide has exactly one chip row.
6. **Time budget:**
   - Hard core cap: **300 min**, plus a written priority order for "nếu còn sức" items. Rate limiting and counters are never optional.
   - "Re-measure overlaps fully" means at least one recorded run per overlap: token bucket, delay task, cluster slots/hashtag/CROSSSLOT, and client-side race (WATCH/Lua). Extra variants may be optional.
7. **RTT rule:** RTT and batch-token claims are measured inside one connection (`redis-benchmark` custom command, `-c 1`, 1-token vs 10-token script, or one piped `redis-cli` session). They are never measured across `docker exec` process spawns, which cost tens of ms each.
8. **redis-benchmark rule:** only the custom-command form with an explicit `k2l04:` key. Never `-t set/get/incr`, because those write `key:__rand_int__`/`counter:__rand_int__`. Run 3 times, report the median, and reject any value ≤ 0 or absurd (clock step). Label the value "phụ thuộc máy".
9. **Size and images:** the guide is ≤ 520 KB. Slide images use relative paths, `src="../../Tài Liệu/Khóa 3. Khóa Học System Design Highly Concurrent Systems Cùng Roninhub/assets/04_Caching/…"` (L06 pattern, `reports/advanced_backend/lesson_06_redis_teacher_guide.html:287`). Base64-embedded slide images are forbidden.
10. **Homework default:**
    - The learner writes, with a 50/50 scaffold, a Lua token bucket per `storeId`: capacity 10, slow refill, 30 calls → exactly 10 allowed, 20 denied, each denial with `retry_after_ms` > 0. This is the FR-M2-05 shape.
    - `hw-check.sh` runs it, plus a bad fixture that must fail. A planner may choose a different task only with a stated reason.
11. **Clock handling:**
    - Limiter scripts take `now_ms` as an ARGV in replay/lab form. The production form, using `redis.call('TIME')`, is shown and recorded at least once.
    - Clamp `elapsed = max(0, now − last)`.
    - The runner records a clock-sanity line per timed run.
    - Deterministic trace replay (one `traffic.tsv` through every limiter) is the recommended way to produce the comparison table; live demos are short (≤ 10 s windows).
12. **Statistical claims:**
    - Inputs are fixed (`seq`-generated, no `$RANDOM`).
    - HLL/Bloom counts are asserted exactly for the fixed input, and compared to theory within a stated band (Bloom: ±3σ of the binomial around n·p).
    - The Bloom filter must show 0 false negatives for all members.
