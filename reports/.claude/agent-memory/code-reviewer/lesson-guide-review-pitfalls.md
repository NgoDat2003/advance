---
name: lesson-guide-review-pitfalls
description: Recurring technical errors found when reviewing advance-be lesson guides + Postgres labs (lesson 3 Index review, 2026-10-20)
metadata:
  type: project
---

Recurring defects in AI-written advance-be lesson material (lesson 3 Index, reviewed 2026-10-20):
- "Pages" = shared hit + read is treated as distinct pages / disk reads; repeated buffer hits (loops, forced Index Scan) get called "random disk reads".
- Page-only verdicts ("index almost useless") printed next to ms columns that show the index plan 2-4x faster.
- Composite rule stated as "= then range then ORDER BY" (wrong; ESR = equality, sort, range).
- INCLUDE size cost compared against a deduplicated plain btree (INCLUDE indexes never deduplicate).
- Widget data pasted from lab JSON with "[object Object]" error fields.
- MySQL skip scan cited for SELECT * queries (MySQL requires a covering query).

**Why:** the guide is the learner's design reference; these slip past "numbers match lab-runs" checks because the numbers are right but the interpretation is wrong.
**How to apply:** in later lesson reviews, check interpretation of each quoted number, not just its presence in lab-runs; grep widget data for "[object".
