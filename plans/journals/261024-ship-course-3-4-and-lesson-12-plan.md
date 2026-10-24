---
title: Ship Course 3 & 4 PDF Conversion and Lesson 12 Concurrency Plan
date: 2026-10-24
summary: Shipped Course 3/4 converted notes with 534 assets, Lesson 12 concurrency probe findings, and gitignore cleanup.
---

# Ship Course 3 & 4 PDF Conversion and Lesson 12 Concurrency Plan

**Date**: 2026-10-24 16:30
**Severity**: High
**Component**: PDF Ingestion Pipeline (`convert_pdf_to_md.py`) & Lesson 12 Transaction Lab (`probe-anomaly-matrix.mjs`)
**Status**: Resolved

## What Happened

Shipped the Course 3 and Course 4 foundational curriculum assets along with the Lesson 12 Database Transaction teacher guide and anomaly probe suite. Specifically:
1. Converted 23 lecture slide PDFs across Course 3 (10 PDFs, 721 pages) and Course 4 (13 PDFs, 374 pages) into clean, structured Markdown documents alongside 534 extracted architectural diagrams and slide figures into `assets/<Slug>/` using a custom PyMuPDF pipeline (`convert_pdf_to_md.py`).
2. Conducted the Lesson 12 Teacher Guide brainstorm and executed a live multi-session controller probe (`probe-anomaly-matrix.mjs`) against local PostgreSQL 16 to benchmark isolation levels and anomaly behaviors.
3. Cleaned up and hardened `.gitignore` after discovering that Chromium headless rendering from visual report verification deposited a 53 MB temporary browser profile (`**/verify/tmp/`) into the workspace tree.

## The Brutal Truth

Dealing with raw PDF lecture slides was an absolute headache. PDFs are not structured documents; they are 2D rendering instructions where a bullet dot `●` and the text next to it live in disconnected span blocks, monospace code blocks lose their indentation, and architectural diagrams are constructed from dozens of primitive vector shapes rather than raster images. If we had just dumped text with `pdftotext`, the resulting Markdown would have been completely unreadable garbage with missing diagrams.

On top of that, running Chromium to render and verify visual brief reports (`brief-render`) quietly generated over 53 MB of browser junk—GPU cache, Local Storage, cookies, and telemetry files—directly inside `plans/.../verify/tmp/`. We were one careless `git add .` away from permanently bloating git packfiles with 50+ megabytes of browser cache. Catching this right before shipping was a huge relief, but it proves our verification tooling was dangerously sloppy about filesystem side effects.

Finally, teaching database transactions always suffers from textbook dogmatism. Slides routinely claim `READ UNCOMMITTED` allows dirty reads, but on PostgreSQL 16, that is flatly false. Running an automated probe against real PostgreSQL proved once again why you never trust slide theory when you can probe the engine.

## Technical Details

### 1. PDF Conversion Pipeline (`convert_pdf_to_md.py`)
- **Volume**: 23 PDFs, 1,095 total pages processed; 534 diagram/slide images extracted into individual slugged directories.
- **Span Row Stitching**: PyMuPDF dict output splits inline bullet markers (`●`, `•`, `○`, `■`) from text spans. Implemented `read_rows()` to merge spans sharing vertical baseline ($y_0, y_1$) and calculate monospace character width (`cw`) from font metrics to reconstruct code indentation.
- **Header/Footer Stripping**: Filtered top/bottom margins via `MARGIN_RATIO = 0.08`, domain regex (`DOMAIN_RE = re.compile(r"^[\w-]+(\.[\w-]+)*\.(com|vn|io|net|org)$")` for `roninhub.com`), and trailing page counters.
- **Vector Drawing Fallback**: Extracted embedded raster images via `doc.extract_image(xref)`. However, vector architecture diagrams (boxes, arrows, shapes) have no raster xref. Implemented `VECTOR_PAGE_DRAWINGS = 20` threshold: if a page has $\ge 20$ vector drawing paths, render the entire page to PNG via `page.get_pixmap(dpi=150)` to ensure zero diagram loss.

### 2. PostgreSQL 16 Concurrency Anomaly Probe (`probe-anomaly-matrix.mjs`)
Live controller probe verified concurrency anomalies across all 4 isolation levels:
- **Dirty Read**: Prevented across ALL levels. Even under `READ UNCOMMITTED`, PostgreSQL runs MVCC snapshot isolation; read returned `balance = 100` (uncommitted write of `0` was invisible).
- **Non-Repeatable Read**: Allowed in `READ COMMITTED` (`100 → 50`); prevented in `REPEATABLE READ` (`100 → 100`).
- **Phantom Read**: Allowed in `READ COMMITTED` (`2 → 3`); prevented in `REPEATABLE READ` (`2 → 2`).
- **Lost Update**: `READ COMMITTED` overwrites concurrently (`final 80`). `REPEATABLE READ` throws serialization error:
  ```text
  40001 could not serialize access due to concurrent update
  ```
- **Write Skew**: Allowed in `REPEATABLE READ` (`on_call = 0`, both doctors take off). Prevented ONLY in `SERIALIZABLE` via SSI:
  ```text
  on_call=1 B:40001 could not serialize access due to read/write dependencies among transactions
  ```
- **Aborted Transaction Poisoning**: Triggering `22012 division by zero` locks the connection in error state; all subsequent commands fail with:
  ```text
  25P02 current transaction is aborted, commands ignored until end of transaction block
  ```
- **Lock Wait Event**: Two-session row contention verified via `pg_stat_activity` with `wait_event_type: "Lock"`, `wait_event: "transactionid"`.

### 3. Repository Sanitation
- Identified 53 MB directory: `plans/261024-1435-lesson-12-transaction-teacher-guide/verify/tmp/`.
- Updated `.gitignore` to block `**/verify/tmp/` alongside local credential helpers (`.claude/.credentials.json`, `.claude.json`, `RESTORE.ps1`).

## What We Tried

- **Standard PyMuPDF text extraction (`page.get_text("text")`)**: Produced broken paragraphs where code lines wrapped into headers, indentation vanished, and footnotes collided with body copy. Rejected in favor of span-level inspection with font size ratios and monospace font flags (`flags & 8`).
- **Image-only extraction (`page.get_images()`)**: Left 30% of slide diagrams missing because diagrams drawn in PowerPoint/Keynote export as vector PDF paths rather than raster images. Solved by combining raster xref extraction with full-page pixmap fallback on pages with high drawing path counts.
- **Relying on textbook definitions for isolation matrix**: Textbooks state dirty read is possible in Read Uncommitted. Rejected theoretical tables in favor of actual output captured in `probe-anomaly-matrix.out.txt`.

## Root Cause Analysis

1. **Format impedance mismatch**: Lecture slides are optimized for human eyes on a projector, not semantic parsing. Font styling, spacing, and vector drawing commands lack AST semantics. We had to build heuristic reconstruction (bounding box math, font size ratios, regex filters) to recover document hierarchy.
2. **Missing harness cleanliness**: Headless browser verification scripts created temporary profile directories inside the project tree instead of system temp (`os.tmpdir()`), and our initial `.gitignore` had no rule covering `verify/tmp/`.

## Lessons Learned

- **Always probe the actual database engine**: PostgreSQL's MVCC implementation details (such as `READ UNCOMMITTED` aliasing to `READ COMMITTED` and SSI predicate locking) cannot be learned from generic SQL textbooks. Hands-on probes with deterministic concurrency sequencing (`pg` driver + explicit step synchronization) are the only reliable way to teach concurrency.
- **Guard verification artifacts immediately**: Any test or verification script that spins up a browser instance or container must either write to OS temp or have its artifact path gitignored before running.

## Next Steps

- [x] Complete ship pipeline for Course 3/4 converted notes and Lesson 12 planning assets.
- [x] Ensure `.gitignore` rules prevent verification run debris from entering staging.
- [ ] Implement Lesson 12 student lab exercises based on the verified anomalies in `probe-anomaly-matrix.out.txt`.
- AgentWiki publish skipped (deferred local file preservation).
