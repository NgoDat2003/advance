---
name: lab-db-traps
description: Non-obvious facts about the shared advance_be_lab PostgreSQL used by lesson labs (DB-level search_path into lab03_indexing, same server as production maycha_lease, TypeORM is 1.x not 0.3) that break naive lab designs
metadata:
  type: project
---
The lab database `advance_be_lab` (container `quan-ly-hop-dong-postgres-1`, PG 16.15, port 5433) has a database-level `search_path = lab03_indexing, public`, so an unqualified table name in a fresh psql or GUI session resolves into lesson 3's schema (`hw_contracts` etc.). The same server hosts the learner's production DB `maycha_lease`. The `pg_stat_user_tables` counters for `hw_contracts` were reset at some point (`n_live_tup = 0` for a 500k-row table), so they are not a reliable "untouched" fingerprint; use row count 500,000 + `relallvisible` 5,666/5,666 + id=1 at xmin 875 / ctid (0,1). TypeORM on npm is at 1.x (1.1.2 on 2026-10-24) while project packets still say "TypeORM 0.3 docs".

**Why:** Verified 2026-10-24 while judging the lesson-12 (Transaction) brainstorm. The roadmap's literal `UPDATE hw_contracts` would have written lesson-3 data; lesson-3 homework T2 depends on `hw_contracts` staying all-visible (`labs/lesson-03-index/homework-setup.mjs` warns otherwise), and lesson-3 `reset` drops the whole schema including pageinspect.

**How to apply:** For every new lesson lab: own schema (`labNN_*`), schema-qualify or `SET search_path` in every session, copy from lab03 instead of writing to it, never touch `maycha_lease`, no `ALTER SYSTEM` or crash tests on the shared server. Verify TypeORM API names against the current docs version, not 0.3. See `plans/261024-1435-lesson-12-transaction-teacher-guide/brainstorm/verdict.md`.
