# IMMUTABLE EVIDENCE PACKET: 3-COURSE MASTER CURRICULUM AUDIT & ROADMAP

## 1. USER INTENT & SCOPE
- **Command flags**: `--ultra --ak-render`
- **Goal**:
  1. Inspect all files across 3 courses to understand what each file teaches.
  2. Evaluate the 3 courses overall: identify gaps, corrupted files, outdated concepts, and necessary updates.
  3. Formulate an optimal learning roadmap (lộ trình học) optimizing time, financial cost, mental energy/effort, and practical career impact.
- **Audience / Student Persona**: Đạt (Fullstack Developer / Senior Backend aspirant) with strong real-world enterprise experience (IPOS, POS sync, SAP B1, SQL Server, PostgreSQL, Redis, Node.js/TypeScript).
- **Core Constraints (`AGENTS.md`)**:
  - Project-local artifacts only (`D:/study/advance-be`).
  - Anti Over-Engineering: No bloated abstract frameworks; clean, tactile code.
  - Walkthrough -> Hands-on Challenge.
  - Video as L3 cache: Eliminate passive 2-hour video watching; adopt active tactile learning.
  - Cumulative Integration: Progressive build towards a Mini Production Engine.

---

## 2. DETAILED FILE-BY-FILE INVENTORY OF THE 3 COURSES (39 UNITS TOTAL)

### KHÓA 1: ADVANCED BACKEND (Single-Node Deep Dive & Internals) - 16 Chuyên Đề
- `1. REST API Design.pdf` (.md): RESTful standards, RFC 7807 error format, Idempotency keys (Redis TTL + lock), Keyset vs Offset pagination, API versioning.
- `2. Caching Design.pdf` (.md): Cache-Aside, Write-Through/Behind, 4 production anomalies: Cache Stampede (Singleflight/Mutex), Cache Avalanche (TTL Jitter), Cache Penetration (Bloom Filter, Null Cache), Cache Race Conditions (Delete vs Update).
- `3. Index.pdf` (.md): B-Tree internals, Heap file, TID, HOT updates, Composite index left-prefix rule, Covering index (INCLUDE), Index Bloat, `EXPLAIN (ANALYZE, BUFFERS)`.
- `4. Codebase Structure.pdf` (.md): Layered vs Clean Architecture vs Hexagonal, DDD foundations (Entities, Value Objects, Aggregates, Repositories, Domain Services).
- `5. Networking.pdf` (.md): OSI & TCP/IP, TCP 3-way handshake & 4-way teardown, TLS 1.3, DNS, HTTP/1.1 vs HTTP/2 multiplexing vs HTTP/3 QUIC, WebSocket.
- `6. Redis.pdf` (.md): Redis single-threaded event loop, I/O multiplexing, internal data structures (SDS, Dict, Skiplist), RDB & AOF persistence, Distributed locks (Redlock), Streams.
- `7. Data Modeling.pdf` (.md): 1NF-3NF vs Denormalization, modeling for E-commerce, Social Feed, Double-Entry Financial Ledger, Audit trail, Polymorphic relations.
- `8. Security.pdf` (.md): CIA Triad, OWASP Top 10 (SQLi, XSS, CSRF, SSRF, IDOR), Stateful Session vs Stateless JWT, OAuth 2.0 / OIDC, Password hashing (Argon2id, Bcrypt), RBAC vs ABAC.
- `[Lesson 09 Missing]`: File does not exist in repository.
- `10. Index 01.pdf` (.md): 0-byte corrupt PDF file. Markdown contains placeholder note: empty file.
- `11. Regex.pdf` (.md): Regex engines (DFA vs NFA), Greedy vs Lazy vs Possessive, Lookaround, Catastrophic Backtracking (ReDoS) vulnerability.
- `12. Transaction.pdf` (.md): ACID properties, WAL logging, MVCC (Postgres `xmin`/`xmax`, MySQL InnoDB Undo Log & Read View), 4 Isolation Levels, anomalies (Dirty read, Non-repeatable read, Phantom read, Write skew).
- `13. Clean Code.pdf` (.md): SOLID, DRY, KISS, YAGNI, Boy Scout rule, Result Pattern error handling, Code smells, Senior Code Review rubrics.
- `14. Locking.pdf` (.md): Shared (S) vs Exclusive (X) locks, Intent locks (IS, IX), Record/Gap/Next-Key locks (InnoDB), Optimistic vs Pessimistic locking (`FOR UPDATE`, `SKIP LOCKED`, `NOWAIT`), Deadlock graphs & Resource Ordering.
- `15. Operating System.pdf` (.md): User Space vs Kernel Space, System Calls, Process/Thread, Virtual Memory, Paging, Page Faults, OOM Killer, I/O models (BIO, NIO, epoll/kqueue), Zero-Copy (`sendfile`).
- `16. Integration.pdf` (.md): Transient network faults, Exponential Backoff + Full Jitter, Circuit Breaker (Closed, Open, Half-Open), Idempotent Webhooks (HMAC SHA-256), Asynchronous heavy export processing (Job queue + S3 + SSE/Email).

### KHÓA 2: SYSTEM DESIGN HIGHLY CONCURRENT SYSTEMS (Roninhub) - 10 Chuyên Đề
- `01. System Design- In-Depth Understanding.pdf`: Architecture vs Design, Interview vs Real-world constraints (Cost, Time, Blast Radius), 4-step System Design framework.
- `02. Design Principles & Estimation.pdf`: Back-of-the-envelope capacity estimation (DAU to QPS, Storage 5-year, RAM 80/20, Bandwidth), CAP theorem, PACELC theorem, SLA/SLO (99.9% vs 99.99%), Separation in Time & Space.
- `03. Database.pdf`: Single DB bottleneck (~20k QPS), Big Table strategies, Range vs Hash Partitioning, Shard Key selection criteria, Database selection matrix (RDBMS, KV, Doc, Wide-column, Search).
- `04. Caching.pdf`: Multi-tier caching (Browser -> CDN -> Nginx -> In-Memory -> Redis Cluster 16,384 slots -> DB), 5 Rate Limiting algorithms (Fixed Window, Sliding Window Log, Sliding Window Counter, Leaky Bucket, Token Bucket).
- `05. Communication.pdf`: Sync vs Async, REST vs gRPC over HTTP/2, Short vs Long Polling, SSE, WebSocket, MQTT over QUIC, Reactor threading model.
- `06. Microservices.pdf`: Bounded Context, Event Storming, Distributed Transactions (2PC/XA bottlenecks, TCC), Saga Pattern (Orchestration vs Choreography), Lack of Isolation in Saga (Lost updates, Dirty read).
- `07. DSA.pdf`: Liveness Timers (Redis ZSET vs Hashed Wheel Timer), Concurrent Queues (Array vs Linked List, False Sharing), LMAX Disruptor (Lock-Free Ring Buffer, CAS, Cache Line Padding).
- `08. URL Shortener.pdf`: Bitly-scale case study (100M writes/day, 10k QPS read), Capacity calculations, Base62 encoding, Key Generation Service (KGS), 301 vs 302 HTTP redirection caching.
- `09. Design a Microblogging System (Threads).pdf`: Threads/Twitter scale (100:1 read-heavy), Push Model (Fan-out-on-write) vs Pull Model (Fan-out-on-read) vs Hybrid Model (Celebrity Problem).
- `master-software-architecture.pdf`: 400-page book by Maciej Jędrzejewski: 9 architectural transformation steps (Domain discovery, Quality attributes, Deployment strategies, Release/CI-CD, Testing pyramid & Fitness functions, ADRs, Security, Observability/Tracing).

### KHÓA 3: KAFKA NÂNG CAO 2025 (Roninhub) - 13 Chuyên Đề
- `Kafka Introduction.pdf`: Event Streaming Platform vs Message Broker, Response-Driven vs Event-Driven, 3 pillars (Event Streaming, Distributed Storage, Stream Processing).
- `Why Kafka..pdf`: Broker comparison (DB Queue, Redis, RabbitMQ, NATS, Pulsar, Kafka), 4 high-performance secrets (Sequential Disk I/O, Linux OS Page Cache, Zero-Copy `sendfile`, Batching & Compression).
- `Core Concepts.pdf`: Topic, Partition as unit of parallelism, Partition as immutable ordered log, Message ordering guarantees (per-partition only!), Offset as PK, Anatomy of a Record (Key, Value, Timestamp, Headers, Offset).
- `Message Broker.pdf`: 4 classic microservices problems solved by Kafka: Async decoupled communication, Anonymous producer/consumer, Pub/Sub fan-out, Traffic smoothing & backpressure buffer.
- `Producer.pdf`: ACKs (0, 1, all), Retries & backoff, Batching (`batch.size`, `linger.ms`), Compression, Partitioners (Murmur2, Sticky), `max.in.flight.requests.per.connection`, Idempotent Producer (`enable.idempotence=true`).
- `Serialization.pdf`: Serialization vs Parsing vs Marshaling, JSON vs Binary (Avro, Protobuf), Confluent Schema Registry (Schema ID 4 bytes), Schema evolution (Backward, Forward, Full compatibility).
- `Group Membership & Partition Assignment.pdf`: Consumer Groups, Group Coordinator vs Group Leader, 2-phase JoinGroup/SyncGroup, Eager Rebalance (Stop-the-world) vs Cooperative Sticky Rebalance (Incremental), Partition assignors.
- `Liveness.pdf`: Safety vs Liveness properties, 2-tier liveness in Kafka: Heartbeat Thread (`heartbeat.interval.ms`, `session.timeout.ms`) vs Poll Thread (`max.poll.interval.ms`), preventing Rebalance Cascades / Loops.
- `Problems & Patterns.pdf`: 83-page core blueprint: Topic width & partition sizing, Large messages (Claim Check Pattern vs Chunking), Multi-threaded consumer pool, Request-Reply over Kafka, Dual-Write problem, Transactional Outbox Pattern + Debezium CDC on PostgreSQL WAL, Exactly-Once Semantics (EOS).
- `Fraud Detection System.pdf`: Binance/Fintech scale case study: Real-time fraud detection (<50ms latency), Ingestion layer, Flink / Kafka Streams sliding windows, Rule engine & fraud score, Real-time enforcement.
- `CCDAK Knowledge Domains.pdf`: Confluent Certified Developer blueprint: 4 domains (Application Design 20%, Development 40%, Deployment & Testing 20%, Monitoring & Troubleshooting 20%).
- `CCDAK Exam.pdf`: Preparation guide: 3-6 month timeline, CLI fluency, Java/GC fundamentals, core focus on Producer/Consumer/Broker over heavy streams.
- `CCDAK Exam_2.pdf`: 139-page practice exam bank with 150+ in-depth scenario questions with detailed answer rationales.

---

## 3. AUDIT FINDINGS: GAPS, CORRUPTIONS & REQUIRED UPDATES

1. **Course 1 (Advanced Backend)**:
   - `10. Index 01.pdf` is 0 bytes (corrupt file). Its content is already absorbed into Lesson 03 + 11 labs.
   - `Lesson 09` is missing from the curriculum folder.
   - Lab coverage gap: Only Lesson 02 (caching) and Lesson 03 (index) have runnable ESM labs. Lessons 04-16 currently lack runnable tactile labs in the repo.
2. **Course 2 (System Design Highly Concurrent Systems)**:
   - Format gap: Only raw PDFs exist. No markdown conversions created yet (inconvenient for fast scanning).
   - Zero runnable labs in the repository.
   - Technology obsolescence & modern gaps:
     * Manual Saga state machine is fragile. Modern industry standard is Durable Workflow Orchestration (Temporal.io / Cadence).
     * Sharding & manual partitioning: Needs modern context on Distributed SQL (CockroachDB, TiDB, YugabyteDB) and Cloud-native Serverless DBs (Neon, Aurora Serverless v2).
     * Communication: Needs Connect-RPC (modern gRPC web alternative) and HTTP/3 QUIC context.
     * 400-page MJ Book is overwhelming if read end-to-end; requires a targeted, high-yield reading guide.
3. **Course 3 (Kafka Nâng Cao 2025)**:
   - Format gap: Raw PDFs only; no markdown summaries.
   - Technology obsolescence: Heavy emphasis on Apache ZooKeeper in slides. In modern Kafka (Kafka 3.3+ KRaft is GA; Kafka 4.0 drops ZooKeeper completely), metadata is managed via KRaft Quorum Controller. Must update to KRaft!
   - Rebalance protocol: Slides still give equal weight to legacy Eager Rebalance. Must mandate CooperativeStickyAssignor.
   - Missing modern feature: Tiered Storage (KIP-405) offloading cold segments to S3/MinIO.
   - Zero runnable labs: Needs a Docker Compose KRaft environment + Postgres CDC Outbox lab.

---

## 4. STRATEGIC ROADMAP CONSTRAINTS & PRINCIPLES
- **Time Optimization**: Kill 2-hour passive video watching. Apply the 4-step High-Throughput method (Scan Spec 10m -> Run Lab & Break Code 25m -> Socratic AI Sparring 10m -> Tua Video as L3 cache 5m).
- **Cost Optimization**: $0 infrastructure cost. Use local Docker Compose, PostgreSQL, Redis, Kafka (KRaft), Debezium, Postman/cURL, DBeaver/DBX.
- **Mental Effort Optimization**: High-yield progression. Single-node core (Postgres/Redis/OS) -> Distributed Streaming (Kafka Outbox) -> Macro Architecture (System Design).
- **Career Efficacy**: Cumulative build of 1 production-grade artifact: A "High-Throughput Financial Ledger & Flash Sale Engine" with Idempotent APIs, Clean Architecture, B-Tree optimized tables, MVCC/Locking protection, Redis Cache-Aside with Singleflight/Jitter, Transactional Outbox + Debezium CDC to Kafka, and Distributed Rate Limiting.
