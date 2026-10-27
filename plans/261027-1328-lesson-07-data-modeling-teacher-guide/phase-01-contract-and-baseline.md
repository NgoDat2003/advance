---
phase: 1
title: "Contract and baseline"
status: completed
priority: P1
effort: 0.5h
dependencies: []
---

# Phase 01 — Contract and baseline

## Goal
Freeze every name that later parallel work depends on, and record source fingerprints before anything writes to the database.

## Files to create/modify
| Path | Owner |
|---|---|
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/assembly/contract.md` | controller |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/runs/00-fingerprint-before.txt` | controller |
| `D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/plan.md`, `phase-01-start.md` (replace stub; delete phase-01-start) | controller |

## Tasks and steps
1. Create the folders `assembly/fragments`, `assembly/widgets`, `runs/data`, `verify/tmp` inside the plan folder, and `labs/lesson-07-data-modeling/`.
2. Write `assembly/contract.md` with these frozen sections:
   - **Table registry.** Base tables: `order_sheet`, `order_sheet_raw`. S1/S3: `erd_orders`, `erd_payment_transactions`. S2: `nf_customers`, `nf_products`, `nf_orders`, `nf_order_lines`. S3: `fk_parent`, `fk_child`, `fk_child_nofk`, `race_stores`, `race_contracts`, `race_stores_fk`, `race_contracts_fk`. S4: `ddl_contracts`, `ddl_events`, `tpl_stores`. S5: `ty_samples`, `ty_money`, `ty_nulls`. S6: `cs_posts`, `cs_tasks`, `cs_homestays`, `cs_availability`, `cs_stays`, `cs_time_slots`, `cs_articles`, `cs_tags`, `cs_article_tags`, `cs_clicks`, `cs_click_daily`, `cs_mv_clicks_daily`. S7: `v_order_lines`, `v_customer_revenue`, `v_top_lines`. S8: `poly_posts`, `poly_products`, `poly_comments`, `poly_comments_arc`, `poly_post_comments`, `poly_product_comments`. S9: `wallets`, `transfers`, `ledger_entries`, `post_transfer()`, `ledger_check_balanced()`. Learner-owned, never dropped by setup: `hw_*` (homework, read by hw-check) and `my_*` (stage challenges). None of these names exists in another schema today (checked against the catalog: lab03 `orders`/`users`, lab12/14 `contracts`/`flights`/`bookings` are avoided).
   - **Base DDL** for `order_sheet` (one row per northwind order line: order_id, product_id, order_date, customer_id, customer_name, customer_city, employee_name, product_name, category_name, supplier_name, unit_price real, quantity, discount; PK `(order_id, product_id)`) and `order_sheet_raw` (order_id PK, customer_name, customer_city, items text like `Chai x10; Chang x5`).
   - **SQL file format.** File header comment in Vietnamese (purpose, slides, how to run). Regions are delimited by `-- #region <id> · <title> (slide N)` and `-- #endregion`. Every region's first statement is `SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing`, followed by `SET statement_timeout = '60s'; SET lock_timeout = '5s';` (two-session B regions use `'2s'`). Two-session step markers are `SELECT 'A1' AS buoc, to_char(clock_timestamp(),'HH24:MI:SS.MS') AS luc, '<mô tả>' AS viec;`. No psql meta-commands, so the text runs unchanged in DBX.
   - **Run ids.** `data-run` = run file stem plus optional `#region` (e.g. `05-data-types#money`, `03-fk-race.nofk.timeline`). Widget data ids are `run-w1` … `run-w10`.
   - **Fragment format.** Defined in phase 06. CSS vocabulary: the lesson-14 classes plus `.erd`, `.nf-grid td.dup`, `.cal .day.open|.booked|.blocked`, `.ledger`, `.plan-text mark`, `.callout.challenge`. Storage keys are `l07-c<N>-<slug>`, `l07-warmup`, `l07-theme`, `l07-hw-*`.
   - **Widget JSON shapes** (W1–W10): top-level `sources: [runId…]` plus the fields listed in phase 04.
3. Record the fingerprints (read-only) to `runs/00-fingerprint-before.txt`: row counts of all 8 northwind core tables; `md5(string_agg(order_id||':'||product_id||':'||quantity||':'||unit_price, ',' ORDER BY order_id, product_id))` of `northwind.order_details`; and `count(*), sum(total), max(id)` of `lab03_indexing.hw_contracts`. Also record the DB-level setting from `pg_db_role_setting` and `version()`.

## Test matrix
| Test (written first) | Expected | Command |
|---|---|---|
| Registry names absent elsewhere | 0 rows | `docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab -Atc "<pg_class ⋈ pg_namespace where relname = any(registry) and nspname <> 'lab07_modeling'>"` |
| Fingerprint file complete | contains 91, 830, 2155, 77, 8, 29, 9, 6, 500000 and an md5 | `grep -c -E "^(91|830|2155|77|8|29|9|6|500000)\b" runs/00-fingerprint-before.txt` |

## Verification
Re-run the fingerprint query and `diff` it against the file. It must be identical, since nothing has written yet.

## Risks and rollback
The risk is that contract churn later breaks delegates. The contract is frozen once phase 06 starts; any change after that needs a contract version bump and a re-check of every fragment. Rollback: delete `assembly/` and `runs/00-*`.

