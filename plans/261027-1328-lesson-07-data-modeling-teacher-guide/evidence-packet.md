# Evidence packet — Lesson 07 (Data Modeling) teacher guide

Immutable input for the `/ak:plan --ultra --tdd` candidates and the verifier. Controller: main session, 2026-10-27 (Asia/Saigon).

## 1. Request

User (Đạt, Vietnamese): "ừ thì đang học bài 12 rồi nè sắp tới bài tiếp theo lộ trình á, thì t muốn m tương tự tạo ra 1 bài giảng để mai có thể học nhé" — invoked as `/ak-vibe --ultra --ak-render --html`.

Meaning: build the next lesson of the roadmap as a teacher guide "like" lessons 12/14, ready to study tomorrow (2026-10-28).

Controller interpretation (settled, do not re-open):
- Lesson 12 is finished, lesson 14 already has a guide (`reports/advanced_backend/lesson_14_locking_teacher_guide.html`, learner is at its stage 3). The next lesson **without** a guide on the roadmap is **Lesson 07 — Data Modeling** (roadmap Cluster 1: 03 → 12 → 14 → 07; master roadmap "Ngày 4: Học trọn vẹn Bài 07 (1NF–3NF, Polymorphic & tự thiết kế bảng Sổ cái kép `wallets` + `ledger_entries` trên DBX)"). Lesson 14's closing section already teases it as "Bài 07 · Day 05 — Sổ cái kép: khi CHECK trở thành người gác cổng".
- `--html` → the deliverable is a single self-contained HTML teacher guide. `--ak-render` → it must be visual: diagrams (inline SVG ERDs / flow), interactive widgets, not text walls. `--ultra` → this plan pass (best-of-5) and the later code review run in ultra verifier mode.

## 2. Learner profile and accepted format

- Đạt: fullstack dev (NestJS 10 + **Prisma 7.9** via pnpm, PostgreSQL 16), works at an F&B chain (300+ stores). Learns in Vietnamese. Strong on lessons 03 (index), 12 (MVCC, isolation, 40001), 14 stages 0–2 (row locks, xmax, 4 lock modes).
- Project rules (`CLAUDE.md`, `AGENTS.md`): anti over-engineering, plain Vietnamese comments, "Làm mẫu (walkthrough) → Tự làm (hands-on challenge)", diverse tools (DBX first), cumulative integration (each lesson builds on the previous).
- **Latest learning mode (handoffs 2026-10-26/27, authoritative):** the learner skips the `.mjs` lab harnesses. Every experiment must be a **self-contained SQL snippet he runs in DBX** (`Ctrl+A → Run`), connection `ADVANCE_BE_LAB` (and a duplicate `ADVANCE_BE_LAB_B` with Manual Commit `Tx: [M]` when two sessions are needed). He must see real result grids, timings, EXPLAIN plans, error codes.
- Memory: teacher guides use the **lesson-12/14 single-column shell with no left rail**; per-lesson storage keys (`l07-*`); ORM drills in **Prisma 7.9**, never TypeORM; read course `.md` (not PDFs) and cite "Trang N"/slide N; embed slide images from `Tài Liệu/advanced_backend/assets/7_Data_Modeling/`.
- Work on `main` only. **No branch, worktree, commit, push, PR, GitHub issue or label** (user correction 2026-10-24; `gh` not installed). Leave changes uncommitted.

## 3. Reference artifacts (read these)

- Source slides: `Tài Liệu/advanced_backend/7. Data Modeling.md` (43 pages: 1–37 main deck, 38–43 a "View" appendix). Images: `Tài Liệu/advanced_backend/assets/7_Data_Modeling/page_*.png`.
- Shell to copy: `reports/advanced_backend/lesson_14_locking_teacher_guide.html` (2,645 lines, ~180 KB). Structure: hero (eyebrow, h1, lead, hero-meta, epigraph, theme button) → `#cach-hoc` (plan table, prep panel, DBX setup, warm-up textarea) → `#chang-1..8` (stage-head with big number, slide/time meta, goal, `dl.wwh` LÀ GÌ / TẠI SAO / KHI NÀO KHÔNG, `figure.slide-fig`, callouts `teacher`/`key`/`pg`/`cite-mysql`/`warn`, `.widget` blocks, recorded run output `.code.terminal` with "Kết quả đã chạy trên máy bạn ngày …", walkthrough tables `table.walk` with `data-store` inputs, `details.fold` extras, `.quiz[data-quiz=N]`) → homework sections → Prisma drill → `#phong-van` (10 interview Qs) → `#cheat-sheet` → `#ban-do-slide` (slide chips with verdict) → `#tham-khao` → `#tiep-theo`. Script block: `GUIDE_DATA_START/END` with `SLIDES`, `QUIZ`, `EXAM`, then an IIFE: localStorage wrapper (try/catch), theme toggle, `data-store` binding limited to the lesson prefix, quiz renderer, widgets reading embedded `<script type="application/json" id="run-…">` data.
- Verdict chips: `Đúng trên PG16` / `MySQL đúng, PG khác` / `Cần sửa` — every MySQL-centric slide gets one, backed by a measurement.
- Lesson-14 lab layout for reference only: `labs/lesson-14-locking/` (`package.json`, `00-setup-dataset.mjs`, `check-lab-state.mjs`). Lesson 07 must NOT copy the heavy harness approach (see §2).
- Handoffs: `plans/handoffs/lesson-14-stage1-2-mastered-resume-stage3-20261027-1745.md`, `plans/handoffs/omnipos-finledger-master-roadmap-and-lesson12-20261026.md`, `plans/handoffs/non-linear-6-clusters-qlhd-boss-challenges-20261024-1712.md`.
- Previous ultra planning packet (format model): `plans/261024-1435-lesson-12-transaction-teacher-guide/planning-packet.md`, `planning-rubric.md`.

## 4. Content scope (settled)

The guide covers all 43 slides plus three roadmap topics the slides only touch:
1. **Slides** — design process (5), ERD/entity (7), table types (8), normalization/denormalization (9–10), FK problem and "remove FK, check in app" opinion (11), where the reference column goes (12), table format: ADD COLUMN lock (14), JSON column (15), index on JSON (16), redundant spare columns (17), ADD INDEX lock / online DDL (18), table template & common columns incl. `version` (19–20), data types: string (22), number & money (23), date/time & time zone (24), choosing types & NULL (25), case studies: multi-language JSON (27), ordering with gaps/float (28), homestay availability 365 rows (29–30), calendar time slots (31), tagging with array + inverted index (32), report counting: HLL/cron/materialized view/stream (33), recap (34), homework "design flight booking with the table template" (35), references (36), views: what, MERGE vs TEMPTABLE, limits, practices (39–43).
2. **Normal forms 1NF → 2NF → 3NF** shown on a concrete flat "order sheet" built from `northwind` (one wide denormalized table → decomposed), with the anomaly each form removes (update/insert/delete anomaly) demonstrated by SQL.
3. **Polymorphic association** (e.g. comments/attachments on posts|products): `*_type + *_id` (no FK possible → orphan rows measured), exclusive arc (nullable FKs + `CHECK (num_nonnulls(a,b) = 1)`), and per-parent join tables; trade-offs and what Prisma supports.
4. **Double-entry ledger** — `wallets` + `ledger_entries` (+ a transfer/journal header): every transfer = 2+ entries summing to 0, `numeric` money, `CHECK`, balance as derived `SUM` vs cached column (denormalization with a reconciliation query), and posting with lesson-14 tools (`ORDER BY id FOR UPDATE`, conditional UPDATE, `CHECK (balance >= 0)` → 23514). This is the lesson's capstone and the bridge to the OmniPOS project (Cluster 1 phase B) and the "Boss Challenge 1".

Slides are MySQL-flavoured; the guide must say for each claim what PostgreSQL 16 actually does, with a measurement.

## 5. Facts measured by the controller on this machine (PG 16.15, container `quan-ly-hop-dong-postgres-1`, port 5433, DB `advance_be_lab`, 2026-10-27, scratch schema since dropped)

- Schemas present: `lab03_indexing` (500,000-row `hw_contracts`: id bigint PK, code text, customer_id int, store_id int, status text, signed_at timestamptz, total numeric(12,2); index on status), `lab12_transaction`, `lab14_locking`, `lab_imdb`, `northwind` (customers 91, orders 830, order_details 2,155, products 77, categories 8, suppliers 29, employees 9, shippers 6, plus `_bak_*` copies), `public`. These are **read-only sources**; lesson 07 writes only to a new schema `lab07_modeling`.
- Database-level setting: `search_path = lab03_indexing, public` (a fresh DBX/psql session resolves unqualified names into lesson 3's schema first → every snippet must `SET search_path` or qualify names).
- Server `TimeZone = UTC`.
- Extensions available, not installed: `btree_gist` 1.7, `hstore` 1.8, `intarray` 1.5. Installed in `lab03_indexing`: `pageinspect`, `pg_trgm`, `pgstattuple`. No HyperLogLog extension.
- Float ordering (slide 28): bisecting between 1000 and 2000 runs out after **53** midpoints in `float8` and **24** in `float4`.
- Money (slide 23): `0.1::float8 + 0.2::float8 = 0.30000000000000004` (`= 0.3` is false); `numeric` gives `0.3`. `sum(0.1::float8)` over 1,000,000 rows = `100000.00000133288`; `numeric` = `100000.0`.
- ADD COLUMN on a 500,000-row (45 MB) copy of `hw_contracts`: `ADD COLUMN note text` 0.95 ms and `ADD COLUMN version int NOT NULL DEFAULT 0` 1.97 ms — filenode unchanged (no rewrite, PG 11+ fast default); `ADD COLUMN rnd float8 DEFAULT random()` 758 ms — filenode changed (full rewrite). `ALTER COLUMN total TYPE numeric(14,2)` from `numeric(12,2)` 1.45 ms, no rewrite. All of these still take `AccessExclusiveLock` (lesson 14 stage 3: the DDL queue).
- Strings (slide 22): `pg_column_size('xin chao'::text) = 12 = pg_column_size('xin chao'::varchar(255))`; a 3,000-char text = 3,004 bytes inline before compression/TOAST.
- Time (slide 24): `timestamptz` and `timestamp` are both 8 bytes, `date` 4. With session `TimeZone='Asia/Ho_Chi_Minh'`, `'2026-10-28 09:00'::timestamptz` displays `09:00+07`; the same instant under UTC displays `02:00+00`.
- FK cost (slide 11): inserting 500,000 child rows referencing a 20,000-row parent through an FK took **9,221 ms** (per-row RI check). PG does **not** create an index on the FK column: `DELETE FROM child WHERE parent_id = 5` was a Seq Scan removing 499,975 rows by filter (16 ms); only `child_pkey` existed.
- Lesson-14 facts usable as bridges: INSERT of a child row takes `FOR KEY SHARE` on the parent row; `CHECK` violation is SQLSTATE `23514`; `ORDER BY id FOR UPDATE` prevents 40P01.
- Render check tool for HTML: `node C:/Users/DAT/.claude/skills/ak-frontend-design/scripts/render-check.mjs <file> --out <dir>` (screenshots 375/768/1440 + runtime errors, overflow, touch targets). Run with `TMP`/`TEMP` inside the project.
- The machine runs `psql` inside the container: `docker exec -i quan-ly-hop-dong-postgres-1 psql -U postgres -d advance_be_lab` (no password). DBX MCP tools are also available to the controller.

## 6. Constraints

- Output only inside `D:/study/advance-be`. New files: guide at `reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html`; lab SQL at `labs/lesson-07-data-modeling/`; plan/evidence/verification artifacts in this plan folder.
- DB writes only in schema `lab07_modeling`. Never write to `lab03_indexing`, `lab12_transaction`, `lab14_locking`, `lab_imdb`, `northwind`, `public`, or `maycha_lease`. Copying from them is fine. Extensions, if any, installed inside `lab07_modeling` only.
- Every number shown in the guide comes from a recorded run on this machine (date-stamped). If a measurement contradicts a slide, the narrative changes; data is never edited.
- No secrets / connection URLs printed in the guide or logs.
- HTML page contract: tokens on `:root`, dark mode via `prefers-color-scheme` guarded by `:root:not([data-theme="light"])` and `:root[data-theme="dark"]`, explicit body background, works at 375 px with 16 px gutter and no horizontal page scroll, 44 px touch targets, localStorage wrapped in try/catch, fonts only from Google Fonts, no external scripts (or only pinned cdnjs/jsdelivr if truly needed — prefer none).
- Study time for tomorrow: one day (~4–5 h core, optional extras marked).
