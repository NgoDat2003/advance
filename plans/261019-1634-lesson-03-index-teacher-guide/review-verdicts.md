# Review verdicts — lesson 3 (Index) best-of-5 verification

Verifier: kongming, 2026-10-20. Evidence validated against code, `lab-runs/*.txt`, live DB (read-only `psql`), and primary docs (PG 16 btree docs, MySQL 8.0 range-optimization docs, typeorm 0.3.20 source). Line numbers as read at verification time; controller edits may have shifted them.

Paths: guide = `reports/lesson_03_index_teacher_guide.html`, labs = `labs/lesson-03-index/`, runs = `plans/261019-1634-lesson-03-index-teacher-guide/lab-runs/`.

## Table

| # | Verdict | Sev | Evidence |
|---|---|---|---|
| 1 | CONFIRMED | Important | guide:2011 DOCTOR card `code = 10` has `"plan":"lỗi [object Object]"`; drShow renders it verbatim ("Đo thật: lỗi [object Object]"). |
| 2 | CONFIRMED | Important | guide:996, 1662, 2112, 1273 teach "= → khoảng → ORDER BY"; wrong when range col ≠ sort col (index (a, range, sort) cannot feed ORDER BY; correct is =, sort, then range as in-index filter). Exam Q5 (:2069) still correct because range col = sort col. |
| 3 | CONFIRMED | Important | guide:413 "Cộng hai số lại = số trang"; Buffers count page *accesses* (forced scan 108,122 on a 10,992-page table, lab01.txt:12). :523 "thảm họa" overstates: at most 10,992 distinct pages, repeats are cache hits. Wording fix only; accepted pages metric stands. |
| 4 | CONFIRMED | Important | lab01.txt:11/14 "index gần như không tiết kiệm được gì" while 29.4 vs 105 ms; :22-24 gender 141 vs 160 ms; guide:522 "gần như vô dụng". Verdict text contradicts the ms column it prints. |
| 5 | CONFIRMED | Important | PG 16 docs §67.4.3: "INCLUDE indexes can never use deduplication." Plain (country, province) = 200 keys → 6.8 MB dedup'd; lab07.txt:38 shows a text-col btree is 30.1 MB without dedup. So ~4.4× of the 9.6× (lab06.txt:10; 06-covering-index-only.mjs:73 "vì chép name, email") is lost dedup, not copied columns. |
| 6 | CONFIRMED | Important | MySQL 8.0 docs "Skip Scan Range Access Method": "The query references only columns in the index." Slide-25 `SELECT *` queries are not eligible; guide:939, 973, 1272, 2002 state it unconditionally. PG 18 skip scan has no such condition. |
| 7 | CONFIRMED | Important | homework-ai-draft.mjs:54-55, 109 CREATE INDEX on hw_contracts (autocommit), cleanup only at :145/:154 (Ctrl+C leaves them); homework-runner.mjs:100 checks only table existence, never the index set → leftover idx_contracts_status changes runner plans. guide:1306 claim is about "bảng gốc", so technically true; the gap is the runner assertion. |
| 8 | CONFIRMED | Important | guide:2001 `label.slice(0, 2)` → "Ch"/"Đủ" for non-Q presets; with order npc, Q1 goes to mode 'none' and narration says the slide calls Q1 "không dùng được index" (slide says the opposite); :2001 hardcodes "PostgreSQL 16" even when engine=skip and 2nd column has no predicate; :1965 "Q3 (slide 27) BETWEEN 2 AND 4" vs slide 2..8 (toy data a∈0..5). |
| 9 | CONFIRMED | Minor | guide:1762 titles sel=1/12866977 → log10=−7.11 < slider min −6 (:471) → k=13 rows; :468 step 0.01 snaps log10(1721260)=6.2359→6.24 → n shows 1,737,801. |
| 10 | CONFIRMED | Minor | 07-…-part-b.mjs:61-64 `verdict(!bt.d.usesIndex, …)` prints ✘ on the measured (correct) outcome, lab07.txt:41; header 07-b:4 "still read from the table" and 01:4 "planner refuses" contradict outputs. |
| 11 | CONFIRMED | Minor | None in lab-runs: hit/read split (guide:396-404; lab11 prints totals only), gen_random_uuid "38,1 MB/71%" (:868), "1,5× tới 4,6×" (:1551; hw-draft.txt shows 2.0× once), "20 giây" (:1303; runtimes.json setup=3.7 s because data existed, 00-setup says "khoảng 1 phút"), "kể cả lần đầu" (:1351, lab11:100; measure() discards warm-up, medians are warm). |
| 12 | CONFIRMED | Minor | guide:529: estimate at 1.1% is 1−0.989^157 ≈ 82% touched vs 64% measured; "thấp hơn một chút" understates; cause is correlation of num_votes with ctid order. |
| 13 | CONFIRMED (20, 39) / REJECTED (10) | Minor | guide:2127 `[20,…,'#s3-6']`, :2132 `[39,…,'#s6-2']` lack the pg flag while :1270 and :1292-1293 mark them as differing. Slide 10 section (:557-676) carries no diff chip, so no marker is expected. |
| 14 | CONFIRMED | Minor | `.quiz[data-quiz]` exists only for 1-5 (:531, 685, 898, 1111, 1246); stage 6 row (:361) uses the homework as its check. |
| 15 | CONFIRMED | Important | DB (read-only): 319 rows with id < previous id in ctid order, in 319 distinct blocks (blocks 4..8311; sampled blocks 0-2, 100, 1000, 5000, 9000 are in order, 107-108 rows each); 6 BRIN ranges overlap 2023-03-01 → 6×128 = 768 + 2 index pages = 770 (lab07.txt:47). setup-dataset.sql:84 "physically ordered" is only approximately true; 07-b:84 "cả khối 128 trang" implies one range. |
| 16 | CONFIRMED | Minor | guide:770 `min="1"`; LOOKUP innodb 'upd-idx' (:1927) assumes an email index separate from PK, so n=1 is contradictory. :2035 "5,9% số phim" should be "số title". |
| 17 | CONFIRMED | Important | :1103 slide-29 chip "MySQL đúng" — MySQL/InnoDB has no bitmap index (Oracle). :1199 NOT NULL chip "MySQL đúng, PG khác" — InnoDB secondary indexes store NULLs and serve IS NULL. :1172 slide-32 chip "Cần sửa" — MySQL does serve `'x%'` via index, so the right chip is "MySQL đúng, PG khác" (consistent with :1277). |
| 18 | CONFIRMED | Important | No `CREATE SCHEMA` in setup-dataset.sql or 00-setup-dataset.mjs; only check-lab-state.mjs:10 (`--reset`). On a fresh DB, sql:10 `CREATE EXTENSION … SCHEMA lab03_indexing` fails. One-line fix. |
| 19 | CONFIRMED | Minor | 00-setup-dataset.mjs:33-42: 5 VACUUM retries, no sleep, silent break, no exit code. |
| 20 | PARTIAL | Minor | Extensions in lesson schema (sql:10-12) and `--reset` dropping them DB-wide: confirmed. "lab 09 hard-codes lab03_indexing.gin_trgm_ops": REJECTED — 09-index-failures.mjs:31 is unqualified `USING gin (name gin_trgm_ops)`, resolved via search_path. |
| 21 | fixed (partly) | Minor | 07-…-part-a.mjs now has `VACUUM … .catch` plus a relallvisible check with a warning (:68-74). Remaining: rolled-back DELETE still clears the VM bit (inherent). relallvisible is refreshed by that VACUUM, so the "stale" claim is weak. |
| 22 | CONFIRMED | Minor | W3 data (:1923-1932): pk InnoDB 3 vs PG 4, cover 3 vs 4, email 6 vs 4; :780 "đọc thì Postgres thường rẻ hơn" only holds for the non-covering secondary case. |
| 23 | CONFIRMED | Minor | pg-explain-kit.mjs:15 "mục 6.1"; env setup is `#s6-3` (:1298). |
| 24 | CONFIRMED | Minor | CSS :257 `.tree { width:100%; min-width:560px }` + viewBox set to computed W (:1857) → scales down instead of scrolling. |
| 25 | CONFIRMED | Minor | 11-…mjs:95-99 with `--skip-titles` best = V2 (15,556 pages); 15,556×20 > 25,898 → always ✘. |
| 26 | CONFIRMED | Minor | homework-runner.mjs:54 `verdict(result.conclusion.ok …)` prints "✘ Lý thuyết SAI" for a refuted theory while :112 prints PASS; kit:156 defines ✘ as "measurement does not match". |
| 27 | CONFIRMED | Minor | typeorm 0.3.20 MigrationExecutor: `this.transaction = "all"` default; under "all", any migration with `instance.transaction !== undefined` throws ForbiddenTransactionModeOverrideError. Guide :1594 hedges, but :1628 and :2116 say only "tắt transaction cho migration này"; needs `migrationsTransactionMode: 'each'` (or 'none') + `transaction = false`. |
| 28 | CONFIRMED | Minor | 11-…mjs:79 `DROP INDEX` inside the tx holds ACCESS EXCLUSIVE on ratings until ROLLBACK (:83) after the 4 s V3 build; 02-…mjs:129-132 acknowledges the same for DROP CONSTRAINT (lock_timeout set). Single-user lab, so Minor. |
| 29 | CONFIRMED | Minor | 11-…mjs:10 `Number(process.env.YEAR ?? 2015)`; `YEAR=""` → 0 → no rows → :35 `first.primary_title` TypeError. |
| 30 | CONFIRMED | Minor | nbtree rightmost split leaves the left page at leaf fillfactor (default 90%), not 100%; guide comment :1798-1799 and fill stat :1861 say "full"; Lab 04 output (:877-878) itself shows 90%. |
| 31 | CONFIRMED | Minor | No `aria-live` anywhere in the guide; :2037 design-table `<select>`s have no label/aria-label. |
| 32 | CONFIRMED | Minor | pg-explain-kit.mjs:60-65 takes pages from the last sample; parallel plans (lab 11 V0/V2) vary by worker scheduling. |
| 33 | CONFIRMED | Minor | 12,866,977 is 12.9 M, guide says "12,8 triệu"/"12,8 lần" (:339, 2058, 2108); 11-…mjs:100 hardcodes "1,24 ms" amid en-US formatting. |
| 34 | CONFIRMED | Minor | guide:2048 "mỗi dòng một trang heap … tổng 91" for 98 rows is impossible (lab01.txt:8: 98 rows, 91 buffers). |
| 35 | CONFIRMED | Minor | guide:1612-1616 migration has no `down()` and the raw-SQL index is not declared on the entity (synchronize/generate would drop it). |
| 36 | CONFIRMED | Minor | pg-explain-kit.mjs:80-87 `finally { ROLLBACK }` replaces the original error if ROLLBACK throws (e.g. dead connection). |
| 37 | CONFIRMED | Important | Tested with fake URLs: `new pg.Client({connectionString})` throws synchronously (stack: pg-connection-string/index.js:30 `new URL` ← pg/lib/client.js:54) with `ERR_INVALID_URL` for a port > 65535 or a `/` inside the password; `connect()` is never reached. pg-explain-kit.mjs:18 and homework-ai-draft.mjs:18 construct outside try, so Node's uncaught-exception dump prints `{ code: 'ERR_INVALID_URL', input: <string passed to new URL>, base: 'postgres://base' }` — the full connection string with password. (Workspace output hook redacted the literal in my terminal; Node documents `input` as the offending string.) Fix: wrap construction in the same try, print only `err.code`. |

## New defects noticed (not in union)

1. `07-constraints-and-special-part-a.mjs:76` verdict requires `res.with.ms * 100 < res.without.ms` — ms-based threshold that can flip ✘ on a faster/slower machine (0.25 vs 73 ms here; a 1 ms trigger on a 60 ms scan fails). Contradicts the pages-first method; drop the ms clause or loosen to ×10. Minor.
2. `01-when-index-helps.mjs:52` text "đọc 10,440/10,992 trang của bảng": 10,440 is total buffers for Bitmap Heap + Bitmap Index Scan, so it includes index pages, not "trang của bảng". Minor (same family as #3/#4).
3. `homework-runner.mjs:115` returns exit code 1 whenever any theory is still '???', even after other theories ran and printed PASS — confusing alongside #26's ✘; worth one output line explaining the code. Minor.

## Counts

**0 Critical / 12 Important (#1, 2, 3, 4, 5, 6, 7, 8, 15, 17, 18, 37) / 25 Minor confirmed** (incl. #13 and #20 partially, #21 partly fixed). No item fully rejected; sub-claims rejected: #13 slide 10, #20 lab-09 schema-qualification.

Status: DONE
Summary: All 37 items validated; 12 Important, 25 Minor, 0 Critical; 3 small new defects noted.
Concerns: #37 evidence is by construction path + Node semantics; the workspace output hook masked the literal `input` value.
