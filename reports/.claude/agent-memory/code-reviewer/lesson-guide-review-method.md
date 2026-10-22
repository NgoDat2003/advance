---
name: lesson-guide-review-method
description: How to review advance-be lesson teacher guides + labs efficiently (lab-runs diff, read-only psql checks, recurring defect classes)
metadata:
  type: project
---

advance-be lesson reviews (best-of-5 ultra review) come with a review-packet.md that allows read-only
`docker exec quan_ly_hop_dong-postgres-1 psql -U postgres -d advance_be_lab -c "..."` (SELECT/EXPLAIN only, no DDL).

**Why:** guides quote lab outputs verbatim; the packet forbids running labs (they write scratch tables).

**How to apply:**
- Diff every `<div class="code terminal">` block against `plans/<plan>/lab-runs/*.txt` with a small node script in the
  scratchpad; non-matching lines flag hand-built "real output" excerpts.
- Recurring defect classes seen in lesson 3 (2026-10-20): widget data generated from lab `--json` with an error object
  stringified as `[object Object]`; MySQL claims stated without MySQL preconditions (skip scan needs a covering query);
  composite-order rule "equality -> range -> ORDER BY last" (wrong, ESR); narrative attributing a ratio to one cause
  when PG dedup/INCLUDE interplay explains most of it; verdict lines hard-coded to print a failure mark for a known result.
- Physical-order claims (BRIN) are checkable with `ctid` + 128-block range min/max SELECTs.
