# Ultra review — deduplicated union of 5 reviewers (R1–R5), before verification

Count in brackets = how many of the 5 reviewers raised it independently. Line numbers refer to the pre-fix files and may drift; locate by content.

| # | Sev (max raised) | Count | Where | Claim |
|---|---|---|---|---|
| 1 | Important | 5 | guide W5 DOCTOR data (~2011) | Card slide 34 `code = 10` has `"plan":"lỗi [object Object]"` (error object stringified). |
| 2 | Important | 3 | guide ~996, ~1273, cheat sheet ~1662, exam Q5 ~2112; homework solution T1 explain | Composite rule "= → range → ORDER BY" is wrong when range col ≠ sort col; correct is Equality → Sort → Range (range last or into partial WHERE). |
| 3 | Important | 3 | guide ~413, ~523, ~2049–2051; lab 01 verdict | "shared hit+read = số trang"/"108,122 lượt đọc trang ngẫu nhiên … thảm họa" conflates buffer accesses with distinct pages/disk reads; ratings (10,992 pages) fits in shared_buffers; forced scan was 54.9 ms vs Seq 105 ms. |
| 4 | Important | 5 | lab 01 verdicts, guide ~501/~522/~973/~1126 | "index gần như vô dụng"/"chưa chắc có lợi" while same tables show index plan faster (29.4 vs 105 ms; Q4 48.4 vs 120 ms; gender 141 vs 160). Need "không bớt trang, nhưng nhanh hơn vì ít dòng phải lọc / seq scan dùng ring buffer". |
| 5 | Important | 2 | lab 06 verdict, guide ~1029/~1041 | INCLUDE 9.6× bigger is mostly lost btree deduplication (INCLUDE indexes never dedup; plain (country, province) has 200 keys), not just copied columns. |
| 6 | Important | 4 | guide ~939, ~973, ~1272, W4 ~2002 | MySQL 8.0.13+ skip scan only when query references only index columns; slide-25 queries are SELECT * → not eligible. PG 18 has no such condition. |
| 7 | Important | 5 | homework-runner.mjs ~100; homework-ai-draft.mjs ~54,109; guide lab-table note | Draft commits real idx_contracts_* on hw_contracts, dropped only in finally (Ctrl+C leaves them); runner never asserts hw_contracts has only its PK → contaminated grading. Guide claims base-table indexes are always in BEGIN…ROLLBACK. |
| 8 | Important | 5 | guide W4 narration ~2001, presets ~1965 | `label.slice(0,2)` prints "Ch"; with order npc cites slide verdict wrongly; skip engine still says PG16; Q3 preset says BETWEEN 2 AND 4 vs slide 2..8. |
| 9 | Minor | 3 | guide W1 ~471, ~1762 | titles preset selectivity log10 = −7.1 below slider min −6 → clamped to 13 rows; step 0.01 snapping distorts n/k. |
| 10 | Minor | 5 | 07 part-b verdict D (~61), header comments 07-b:4, 01:4 | Verdict asserts disproven prediction → always ✘ "Ngoài dự đoán"; headers contradict outputs (gender index "refuses"). |
| 11 | Minor | 5 | guide §1.2 EXPLAIN (~395–404), ~868, ~1551, ~1303, lab11 final line | Numbers not in lab-runs: EXPLAIN hit/read split, gen_random_uuid claim, "1,5× tới 4,6×", setup "20 giây", "kể cả lần đầu" (warm medians only). |
| 12 | Minor | 1 | guide self-check answer ~529 | 64% measured vs ~82% random estimate called "thấp hơn một chút"; it's a correlation effect. |
| 13 | Minor | 5 | slide map ~2126–2133 | Slides 20, 39 (and 10) lack pg marker though guide marks them as differing. |
| 14 | Minor | 1 | stage 6 | No stage quiz (acceptance criterion 3 says each stage has a quiz). |
| 15 | Important | 3 | 07-b E verdict (~84), setup-dataset.sql orders comment, guide ~1076/~1101 | BRIN 770 pages = 6 block ranges because ~319 blocks hold out-of-order rows from FSM back-fill during the bulk insert; "physically ordered" comment false; "cả khối 128 trang" explanation wrong. |
| 16 | Minor | 4 | guide W3 slider (~770), W6 Q4 text (~2035) | W3 allows 1 index (upd-idx text inconsistent); W6 "5,9% số phim" should be "5,9% số title". |
| 17 | Important | 2 | guide chips ~1103 (slide 29), ~1172 (slide 32), ~1199/~1280 (NOT NULL) | Slide 29 chip "MySQL đúng, PG khác" wrong (InnoDB has no bitmap index; Oracle) → Cần sửa; slide 32 chip "Cần sửa" inconsistent with quiz/table saying MySQL right; NOT NULL "MySQL đúng" wrong (InnoDB also indexes NULLs). |
| 18 | Important | 1 | setup-dataset.sql | No `CREATE SCHEMA IF NOT EXISTS lab03_indexing` → setup fails on fresh DB / after manual drop. |
| 19 | Minor | 3 | 00-setup-dataset.mjs VM loop | Retries VACUUM 5× with no sleep and no final warning/exit code. |
| 20 | Minor | 1 | setup-dataset.sql extensions; check --reset; lab 09 | Extensions in lesson schema; reset drops them DB-wide; lab 09 hard-codes lab03_indexing.gin_trgm_ops (fails if pg_trgm already in public). |
| 21 | Minor | 3 | 07 part-a DELETE (~45, ~65); check-lab-state VM check | Rolled-back DELETE on base users clears VM bit; single unchecked VACUUM; check reads stale relallvisible. |
| 22 | Minor | 4 | guide ~780 | "đọc thì Postgres thường rẻ hơn" contradicts W3 (PK 3 vs 4, covering 3 vs 4; only secondary favours PG). |
| 23 | Minor | 3 | pg-explain-kit.mjs:15 | Missing-PG_URL message points to "mục 6.1"; setup is 6.3. |
| 24 | Minor | 1 | guide .tree CSS / W2 SVG | SVG scales down instead of scrolling → 5–7 px labels for 30 keys. |
| 25 | Minor | 2 | lab 11 verdict with --skip-titles | Best-variant verdict always ✘ when titles variants skipped. |
| 26 | Minor | 2 | homework-runner verdict marker | ✘ used for "theory refuted" next to PASS; ambiguous with kit's ✘ = expectation failed. |
| 27 | Minor | 1 | guide NestJS ~1594/~1628, exam ~2116 | TypeORM default migrationsTransactionMode is 'all'; `transaction = false` then throws ForbiddenTransactionModeOverrideError; need 'each' + transaction=false. |
| 28 | Minor | 1 | lab 11 DROP INDEX in tx; lab 02 DROP CONSTRAINT | ACCESS EXCLUSIVE locks on lab_imdb.ratings / users until ROLLBACK (beyond "SHARE blocks writers only"). |
| 29 | Minor | 2 | lab 11 YEAR env | Unvalidated: empty/NaN/year without rows → crash. |
| 30 | Minor | 1 | guide W2 rightmost split | Simulator keeps left leaf 100% full; nbtree uses 90% leaf fillfactor. |
| 31 | Minor | 1 | guide widgets | No aria-live on widget result regions; design-table selects unlabeled. |
| 32 | Minor | 1 | pg-explain-kit measure / lab 11 V2 | Parallel plan pages vary run to run; pages taken from last sample. |
| 33 | Minor | 1 | guide 12,8 vs 12,9×; lab 11 "1,24 ms" in US-format output | Number formatting inconsistent/misleading. |
| 34 | Minor | 1 | quiz 1 Q1 explanation | "mỗi dòng một trang heap, tổng 91" impossible for 98 rows. |
| 35 | Minor | 1 | migration review answer key | Raw-SQL index not declared in entity (synchronize/generate drops it); no down(). |
| 36 | Minor | 1 | pg-explain-kit inRollback finally; 07-a finally | ROLLBACK/VACUUM in finally can mask original error. |
| 37 | ? (unverified) | 1 | pg-explain-kit connect, homework-ai-draft | Malformed PG_URL may throw uncaught ERR_INVALID_URL whose printed `input` includes the full URL with password. |
