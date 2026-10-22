# Delegate brief — lesson-3 lab writers

Work context: `D:/học/advance-be` (not a git repo). Timezone Asia/Bangkok. Learner-facing text (console labels, comments meant for the learner) in Vietnamese; code identifiers and code comments in English, matching `labs/lesson-02-caching/*.mjs` style (header comment block explaining what the lab proves; short "why" comments).

Read first: `plans/261019-1634-lesson-03-index-teacher-guide/plan.md` (final plan), `candidates/candidate-E.md` (detailed lab specs; numbering map below), `evidence-packet.md` §4–§6 (slides, PG facts, environment).

## Lab numbering map (E → final)
E1 → 02 btree-anatomy-and-hash · E2 → 03 heap-tid-hot-cluster · E3 → 04 write-cost-and-pk-order · E4 → 05 composite-order · E5 → 06 covering-index-only · E6 → 07 constraints-and-special · E7 merged into 01 (controller) · E8 → 09 index-failures · E9 → 10 bloat-reindex · E10 → 11 imdb (controller).

## Environment
- Run in PowerShell, from `D:\học\advance-be\labs\lesson-03-index`. Set the connection without ever printing the password:
  `$pw = docker exec quan_ly_hop_dong-postgres-1 printenv POSTGRES_PASSWORD; $env:PG_URL = "postgres://postgres:$([uri]::EscapeDataString($pw))@localhost:5433/advance_be_lab"; Remove-Variable pw`
  (env vars do not persist between tool calls: prefix every run with that line). Never echo `$env:PG_URL`.
- `pg` is installed in that folder. Node 22, ESM.
- PostgreSQL 16.14, collation en_US.utf8, 8 CPUs, shared_buffers 128MB. Docker Desktop crashed once today: if the connection fails, run `docker start quan_ly_hop_dong-postgres-1` and retry; do not restart Docker Desktop yourself — report BLOCKED.

## Shared kit `pg-explain-kit.mjs` (already written — use it, do not create another kit; only the controller edits it)
- `connect({ parallel = false })` → pg.Client with `search_path = lab03_indexing, public`, `jit = off`, parallel workers 0 unless `{parallel:true}`.
- `measure(client, sql, { runs = 5 })` → `{ plan, rows, ms (median), pages (shared hit+read), heapFetches, usesIndex, raw }` (1 warm-up + runs; `raw` is the JSON plan root, use it for Index Cond / Heap Blocks / Rows Removed by Filter).
- `planText(client, sql, { analyze })` → EXPLAIN lines (COSTS OFF).
- `inRollback(client, fn)` → BEGIN … fn … ROLLBACK.
- `walBytes(client, fn)`, `relBytes(client, name)`, `indexShape(client, name)` → `{ bytes, level, leafPages, density }` via `pgstatindex`.
- `assertImdbUntouched(client)`, `printTable(rows, cols)`, `printMeasurements(items)` (columns Truy vấn | Kế hoạch | Dòng | Trang | ms), `heading(text)`, `verdict(ok, text)` (prints `   => ✔/✘ text`), `fmtBytes`, `fmtMs`, `fmtInt`.

## Dataset (schema `lab03_indexing`, built by `npm run setup`, 17 s; see `setup-dataset.sql`)
- `users` 1,000,000: id bigint PK `users_pkey`; code varchar(20) = id::text (no index); email UNIQUE `users_email_key` ('user'||id||'@example.com'); name text ('First Last', 2,560 distinct; `LIKE 'ronin%'` = 1,000 rows `ronin0..ronin9`, length 6; `LIKE '%ronin'` = 1,000 rows 'First ronin'; `length(name)=6` = 1,000; 'Jane Nguyen' = 395); gender M/F 50/50; age 18..77 uniform; country 20 values (VN 40%, US 200,146 rows, SG 4,927); province 10 per country ('Texas' 19,924); created_at = 2020-01-01 + id minutes (physically ordered); deleted_at non-null 49,956.
- `orders` 1,000,000: id PK `orders_pkey`; user_id FK → users, uniform 1..1M, **no index** (367,574 users have no orders); status DELIVERED 900,009 / CANCELLED / SHIPPING / PROCESSING 10,069; total numeric; created_at = 2023-01-01 + id×30 s.
- `t_ab` 1,000,000: id PK; a = 0..99; b = 0..999 (independent); pad 40 chars.
- Extensions `pageinspect`, `pgstattuple`, `pg_trgm` live in `lab03_indexing` (functions/opclasses resolve through search_path; qualify as `lab03_indexing.gin_trgm_ops` in DDL to be safe).
- Helper SQL function `lab03_indexing.h(g bigint, k int)` → deterministic non-negative int (use it for deterministic scratch data).

## Rules for every lab
1. Base tables are **data-read-only**: never INSERT/UPDATE/DELETE them. Extra indexes on base tables only inside `inRollback` (no index survives). Any lab that writes data uses scratch tables named `lNN_*` (NN = lab number) in `lab03_indexing`: `DROP TABLE IF EXISTS` at start and in `finally`. `npm run check` must be green after your lab.
2. Never touch `lab_imdb` (controller-only).
3. File ≤ 200 lines; if longer, split into `NN-name-part-a.mjs` etc. behind one npm script (scripts already exist in package.json: lab2, lab3, lab4, lab5, lab6, lab7, lab9, lab10, homework*).
4. Output: a header line `Lab 3.NN — <claim> (slide X–Y)`, then sections via `heading()`, compact tables (≤ ~15 table rows per lab where possible), and one or more `verdict(ok, text)` lines whose `ok` is **computed from the measurement** (never hard-coded true). The learner should grasp the result at a glance. Vietnamese labels.
5. Pages (buffers) are the headline metric; ms secondary. Any run that forces a plan (`SET LOCAL enable_seqscan = off` etc.) must be labelled "(ép)" in the output.
6. If the measured result contradicts the expectation in the plan, do NOT tweak data or tricks to force it; keep the honest measurement, make the verdict say so, and report it in your final message — the guide follows the measurement.
7. Deterministic: same output (pages, rows, plans) on every run; only ms may vary. Run each lab at least twice to confirm.
8. Total runtime per lab: aim ≤ 60 s.
9. No secrets in files or output. No markdown files outside `plans/`.

## Final message format
```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Files: <list>
Per lab: runtime, the key measured numbers (plan nodes, pages, sizes) and every ✘/surprise vs. the plan's expectation
Concerns/Blockers: optional
```
