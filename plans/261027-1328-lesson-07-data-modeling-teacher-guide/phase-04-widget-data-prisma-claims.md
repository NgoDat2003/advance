---
phase: 4
title: "Widget data and Prisma claims"
status: completed
priority: P1
effort: 0.75h
dependencies: [3]
---

# Phase 04 — Widget data and Prisma claims

## Goal
Turn recorded runs into the small JSON files the widgets read, and record citations for every Prisma claim. No value is computed or invented outside a run.

## Files to create/modify (controller)
`D:/study/advance-be/plans/261027-1328-lesson-07-data-modeling-teacher-guide/runs/data/w1.json` … `w10.json`, `…/runs/prisma-claims.txt`.

## Tasks and steps
1. Transcribe each file from its source run. Every file has a `sources` field.

| File | Sources | Fields |
|---|---|---|
| W1 | `01-design-erd#catalog` | `tables[{name, kind: entity/relation/support/config, cols[{n, t, nullable}]}]`, `edges[{from, to, col}]` |
| W2 | `02-*` | `sample` (5 order_sheet rows), `steps[0nf, 1nf, 2nf, 3nf]{tables, dupCells}`, `anomalies{updateRows, lostCities, insertCode}` |
| W3 | race timelines | `nofk[]`, `fk[]` events `{who, step, sql, outcome, luc}`, `orphans{nofk, fk}` |
| W4 | `04#add-column`, `#lock`, `index-online` | `alters[{sql, ms, rewrite}]`, `lockMode`, `plain{bSelect, bInsertCode, ms}`, `cic{mode, aInsert, waitedMs}` |
| W5 | `05-*` | `types[{field, pgType, prismaType, bytes, trap}]`, `money{floatSum, numSum, nwReal, nwNumeric}` |
| W6 | `06#ordering` | `{intSteps, f8Steps, f4Steps, rebalanceRows}` |
| W7 | `06#availability`, `#exclusion` | one month of `{day, price, status}`, `book{ok: 3, retry: n, code}`, `exclusionCode` |
| W8 | `08-*` | per design `{orphans, codes}` |
| W9 | `09-*` | ordered `steps[{label, entries[], balances{}, code?, invariants{unbalanced, sys, mismatch}}]`, `race{unordered, ordered}` |
| W10 | `07-*` | `plans{inline, pushdown, fence}` (plan text excerpts), `subqueryScan` booleans |

2. Prisma 7.9 claims. WebFetch the official docs and save each quoted line with its URL and fetch date in `prisma-claims.txt`:
   - the PostgreSQL type mapping for `Float`, `Decimal`, `DateTime` and `Json`;
   - `@db.Timestamptz` and `@db.Decimal(p,s)`;
   - `@@index(…, type: Gin)`;
   - that Prisma does not create indexes on relation scalars in PostgreSQL;
   - that the schema has no CHECK or polymorphic relations, so a CHECK goes into `migration.sql`.

   Confirm the `prisma@7.9.0` version exists via `https://unpkg.com/prisma@7.9.0/package.json`. Never read `node_modules`. Mark any claim that cannot be cited `[UNVERIFIED]`; it may not appear in the guide.

## Test matrix
| Test (written in phase 02) | Expected | Command |
|---|---|---|
| numbers traced | exit 0 | `node verify/verify-guide.mjs --data` |
| negative: add a fake 999999 to w6 copy | exit 1, "w6: 999999 not in sources" | `negative-tests.sh` case g (added now) |
| prisma claims cited | every drill answer key in the file has a URL line | `grep -c "https://www.prisma.io/docs" runs/prisma-claims.txt` ≥ 6 |

## Verification
`node verify/verify-guide.mjs --data` must be GREEN.

## Risks and rollback
A transcription slip is caught by `--data`. If the docs have moved, cite the current URL and keep the fetch date. Rollback: delete `runs/data/` and `prisma-claims.txt`.

