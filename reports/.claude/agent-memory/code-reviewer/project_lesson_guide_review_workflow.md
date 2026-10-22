---
name: project-lesson-guide-review-workflow
description: How lesson teacher-guide reviews run in advance-be (review-packet.md, read-only DB checks, verbatim lab-runs diff)
metadata:
  type: project
---

Lesson deliverables (reports/lesson_NN_*_teacher_guide.html + labs/lesson-NN-*/) are reviewed best-of-5 from an immutable `plans/<plan>/review-packet.md` that fixes scope, accepted decisions (do not flag), allowed checks and output format (severity, file:line, defect, failure scenario, fix).

**Why:** Workspace is not a git repo; the packet is the only scope boundary, and accepted design choices (e.g. pages as headline metric, parallel off in kit) were already debated.

**How to apply:**
- Read the packet first; never run labs or DDL. Read-only DB checks: `docker exec quan_ly_hop_dong-postgres-1 psql -U postgres -d advance_be_lab -At -c "SELECT ..."`.
- Cheap high-value check: script-diff every `<div class="code terminal">` block in the guide against `plans/<plan>/lab-runs/*.txt` (lesson 3 passed 23/23 verbatim); then hunt prose/widget numbers that are NOT in lab-runs.
- Widget data arrays generated from lab `--json` output are a bug magnet (lesson 3: error object stringified as "[object Object]").
- Check physical heap order with ctid when a lab's numbers look off (lesson 3 orders table: FSM back-fill during bulk insert put 3.4% rows out of order, BRIN read 6 ranges).
