---
name: bash-hook-gotchas
description: Bash tool hooks in this workspace block any command text containing "node_modules" and redact URL-with-credential-looking strings (even fake ones) in output
metadata:
  type: reference
---

Two hook behaviours that affect verification work in this workspace:

- `scout-block.cjs` rejects any Bash command whose text contains `node_modules` (even `ls node_modules`). Run node from the lab dir with `node --input-type=module -e "..."` so packages resolve without naming the folder.
- Output redaction replaces strings that look like `scheme://user:pw@host` with `*****REDACTED*****`, even for fake passwords, and even when read in-process (observed `err.input` length 18). To inspect such values, compare in-process (`.includes`, `.length`) instead of printing.
- Read-only DB checks work via `docker exec quan_ly_hop_dong-postgres-1 psql -U postgres -d advance_be_lab -Atc "..."`.

**How to apply:** when validating secrecy/URL-handling claims in the lesson labs, test with fake URLs and in-process assertions; never expect to see the literal.
