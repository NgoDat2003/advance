# Frozen contract — Lesson 07 guide (v1, 2026-10-27)

Parallel work (phase 06 delegates) depends on these names. Change = bump the version and re-check every fragment.

## 1. Table registry (schema `lab07_modeling` only)

| Stage | Objects |
|---|---|
| base | `order_sheet`, `order_sheet_raw` |
| 1, 3 | `erd_orders`, `erd_payment_transactions` |
| 2 | `nf_customers`, `nf_products`, `nf_orders`, `nf_order_lines`, `dn_orders` |
| 3 | `fk_parent`, `fk_child`, `fk_child_nofk`, `race_stores`, `race_contracts`, `race_stores_fk`, `race_contracts_fk` |
| 4 | `ddl_contracts`, `ddl_events`, `tpl_stores` |
| 5 | `ty_samples`, `ty_money`, `ty_nulls`, `ty_long`, `ty_stored` |
| 6 | `cs_posts`, `cs_tasks`, `cs_homestays`, `cs_availability`, `cs_stays`, `cs_time_slots`, `cs_articles`, `cs_tags`, `cs_article_tags`, `cs_clicks`, `cs_mv_clicks_daily` |
| 7 | `v_order_lines`, `v_customer_revenue`, `v_top_lines`, `v_cheap_products` |
| 8 | `poly_posts`, `poly_products`, `poly_comments`, `poly_comments_arc`, `poly_post_comments`, `poly_product_comments` |
| 9 | `wallets`, `transfers`, `ledger_entries`, `post_transfer()`, `ledger_check_balanced()` |
| learner | `hw_*` (homework), `my_*` (stage challenges) — never dropped by setup or stage files |

Base DDL: `order_sheet` = one row per northwind order line (order_id, product_id, order_date, customer_id, customer_name, customer_city, employee_name, product_name, category_name, supplier_name, unit_price real, quantity, discount real; PK (order_id, product_id)). `order_sheet_raw` = one row per order (order_id PK, customer_name, customer_city, items text `Chai x10; Chang x5`).

## 2. SQL file format (`labs/lesson-07-data-modeling/*.sql`)

- Vietnamese header comment: purpose, slides, how to run in DBX.
- Regions: `-- #region <id> · <tiêu đề> (slide N)` … `-- #endregion`. Region ids are lowercase kebab.
- First lines of every region: `SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing` then `SET statement_timeout = '60s'; SET lock_timeout = '5s';` (B regions of two-session files use `lock_timeout = '2s'` only where a 55P03 is the point).
- An expected error is the **last** statement of its region (DBX may stop a script at the first error), or the region is wrapped in `BEGIN … ROLLBACK`.
- Two-session step markers: `SELECT 'A1' AS buoc, to_char(clock_timestamp(),'HH24:MI:SS.MS') AS luc, '<mô tả>' AS viec;`
- No psql meta-commands. Each stage file ends with a region `kiem-chung` returning `ma | ket_qua (✔/✘) | chi_tiet` rows (learner-visible proof grid).

## 3. Run ids

- Run file = `runs/<file-stem>[.<region>].txt`; two-session = `runs/<stem>.<region>.A.txt|.B.txt|.timeline.txt`.
- `data-run` attribute = `<file-stem>#<region>` or `<file-stem>.<region>.timeline`.
- Widget data ids: `run-w1` … `run-w10` (`runs/data/wN.json`, each with `sources: [...]`).

## 4. Fragment format and CSS vocabulary

Fragment format is defined in `phase-06-stage-fragments.md` § "Fragment format (frozen)". CSS: the lesson-14 classes plus `.erd`, `.nf-grid td.dup`, `.cal`, `.cal .day.open|.booked|.blocked`, `.ledger`, `.plan-text mark`, `.callout.challenge`.

Storage keys: `l07-c<N>-<slug>`, `l07-warmup`, `l07-theme`, `l07-hw-*`, `l07-prisma-*`.

## 5. Learner workflow (decided by the DBX smoke test, see `runs/dbx-smoke.txt`)

Open the `.sql` file in DBX, highlight one region, Run Selection. Two-session steps: tab A = `ADVANCE_BE_LAB`, tab B = `ADVANCE_BE_LAB_B`. CREATE INDEX CONCURRENTLY must run in an auto-commit tab.

## 6. Slide chips and anchors (frozen; controller writes SLIDES in the shell)

Chips: OK = `Đúng trên PG16`, DIFF = `MySQL đúng, PG khác`, FIX = `Cần sửa`, – = no chip.

| Slide | Stage | Chip | Anchor the fragment MUST contain |
|---|---|---|---|
| 1–2 | cach-hoc | 1 OK, 2 – | – |
| 3, 4, 6 | 1 | – | – |
| 5, 7, 8 | 1 | OK | – |
| 9, 10 | 2 | OK | – |
| 11 | 3 | FIX | `id="sl-11"` |
| 12 | 3 | OK | – |
| 13 | 4 | – | – |
| 14 | 4 | DIFF | `id="sl-14"` |
| 15 | 4 | OK | – |
| 16 | 4 | DIFF | `id="sl-16"` |
| 17 | 4 | FIX | `id="sl-17"` |
| 18 | 4 | DIFF | `id="sl-18"` |
| 19, 20 | 4 | OK | – |
| 21 | 5 | – | – |
| 22 | 5 | DIFF | `id="sl-22"` |
| 23 | 5 | DIFF | `id="sl-23"` (changed after review: INT(1) → 42601) |
| 24 | 5 | DIFF | `id="sl-24"` |
| 25 | 5 | DIFF | `id="sl-25"` |
| 26 | 6 | – | – |
| 27, 29, 30, 32, 33, 34 | 6 | OK | – |
| 28 | 6 | FIX | `id="sl-28"` |
| 31 | 6 | DIFF | `id="sl-31"` |
| 35 | bai-tap (shell) | OK | – |
| 36, 37 | shell | – | – |
| 38, 39 | 7 | – | – |
| 40 | 7 | DIFF | `id="sl-40"` |
| 41 | 7 | DIFF | `id="sl-41"` |
| 42 | 7 | DIFF | `id="sl-42"` |
| 43 | 7 | OK | – |

Stage 7 (views, slides 38–43) is **optional** ("tùy chọn") in the time plan; stage 8 opens with one bridge sentence. Stage 6 regions `calendar` and `report-fix` are optional.

## 7. Shell CSS available to fragments (beyond lesson-14 classes)

- `.callout.challenge` — "Tự làm" box (tag text `Tự làm · chặng N`). Class string must be exactly `callout challenge`.
- `.erd` — wrapper for an inline `<svg>`; inside use classes `.erd-box` (rect), `.erd-title` (text), `.erd-col` (text), `.erd-edge` (path), `.erd-key` (text) — colours come from CSS tokens, so never hard-code fill/stroke colours.
- `.nf-grid` — table; `td.dup` highlights a duplicated value.
- `.cal` — 7-column grid; children `.day` with `.open` / `.booked` / `.blocked`, `.day.sel` for selection; `.day` is a `<button>` ≥ 44 px.
- `.ledger` — compact table for wallet balances/entries; `td.neg` red, `td.pos` green.
- `.plan-text` — `<pre>` for EXPLAIN text; `<mark>` highlights a node.
- `.tabs` — `div.btns` of `.btn[aria-pressed]` used as tabs.
- Widget helpers available inside each widget block: `$`, `$$`, `esc`, `run(id)` (parsed JSON of `#run-<id>`), `press(group, btn)`, `store.get/set`.
- IDs inside a fragment are prefixed `c<N>-` or `w<N>-` to stay unique across the page.
