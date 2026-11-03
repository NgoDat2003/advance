---
handoff-version: 1
generated: 2026-11-03T07:45:00+07:00
focus: "khi nào xong plan thì dừng nhé ship lên main để lên cty chạy tiếp"
workspace: D:/study/advance-be (Home PC) → resume at D:/học/advance-be (Office PC)
branch: main
---

# HANDOFF: K2 Bài 04 Caching — plan materialized, red-team in flight, resume at the office

## Mission and status
- **Request:** `/ak-vibe "tương tự tạo bài giảng cho sau bài redis đi" --ultra --advice`. The goal is a teacher guide plus labs for **K2 Bài 04 Caching** (System Design course, `Tài Liệu/Khóa 3…/04. Caching.md`, 39 slides). It is built the same way as the L06 Redis guide.
- **User decisions (2026-11-02):**
  - Lesson: K2 Bài 04.
  - The overlaps with L06 are re-measured in full.
  - The Bloom filter is hand-built with `SETBIT` + Lua on redis 7.2.3.
- **Done:**
  - The evidence packet, with kongming's counsel applied (§9 settled rules).
  - The planning packet and rubric.
  - An ultra best-of-5 planning round: 5 planner candidates, then a kongming verifier. The winner is candidate slot 1 (anonymized as E): 122 points, margin low, not unanimous. All 5 passed the hard constraints.
  - The winner was materialized unchanged into `plan.md` plus 10 phase files.
  - The verifier's 9 must-fix items were applied inline (`<!-- must-fix N -->`).
  - The ultra receipt is recorded.
- **In flight when this was written:** red-team with 4 reviewers (security, failure modes, assumptions, scope/contract). Each one writes `plans/261102-1332-k2-lesson-04-caching-teacher-guide/reports/red-team-*.md`. Reports that finished before the push are committed. Any that are missing must be re-run at the office.
- **Not started:**
  - Red-team adjudication and the user's accept/reject.
  - `/ak:plan validate`.
  - The whole-plan consistency sweep.
  - Implementation (`/ak:cook --tdd --auto plan.md --advice`).
  - `/ak:code-review --pending --ultra --advice`.
  - Docs and the final handoff.

## Plan
- Plan: `plans/261102-1332-k2-lesson-04-caching-teacher-guide/plan.md`.
- Phases 01–10:
  - 01: contract, baseline and smoke tests.
  - 02: tests first.
  - 03 and 04: containers and the stage runs.
  - 05: widget data, homework, claims.
  - 06: shell and assembler.
  - 07: stage fragments.
  - 08: assemble, verify, render.
  - 09: ultra review and fixes.
  - 10: docs, final gate, handoff.
- Every task carries the `--advice` handover fields and the literal Failure Protocol.
- Inputs: `evidence-packet.md` (see §9), `kongming-investigation-counsel.md`, `planning-packet.md`, `planning-rubric.md`.
- Verifier: `verify/ultra-plan/verdict.md`. The anonymization map: A=slot 5, B=2, C=3, D=4, E=1.

## Guardrails (carry forward)
- **Git:** work on `main` only. The user authorized commit + push for this hand-over only, so ask again before any later push.
- **L06's `advance-be-redis` (127.0.0.1:6379):** never touch it — no config changes, key writes, restarts, or L06 `00-containers.sh`/`99-cleanup.sh`. Also note:
  - L06 `check.sh` C07 fails on non-`l06:` keys.
  - L06 C14 fails on any container whose name contains `advance-be-redis-` and publishes a port.
- **K2L04 containers:** named `advance-be-k2l04-*`, with the main one on `127.0.0.1:6381`. Port 6380 is reserved for the OmniPOS hub.
- **Postgres:**
  - Writes go only to schema `k2l04_counter` in `advance_be_lab`, through `docker exec -i quan-ly-hop-dong-postgres-1`. That container is shared with company dev data.
  - pgbench 16: always `-n -f`, never `-i`. The DB name is positional, because `-d` means `--debug`.
- **Docker VM clock:** it runs about 8 % fast and gets stepped back. Today `redis-benchmark` printed a negative rps. Every timed run needs the clock-sanity line, plus repeats or medians.

## Exact next actions (office)
1. Run `git pull`. Check which `reports/red-team-*.md` exist. Re-run any that are missing with the same 4-lens prompts (persona file: `~/.claude/skills/ak-plan/references/red-team-personas.md`).
2. Adjudicate the findings: dedupe them, cap at 15, and reject any finding with no file:line evidence. Ask Đạt to accept or reject them, apply the accepted ones inline, and add `## Red Team Review` to `plan.md`.
3. Run `/ak:plan validate` (3–8 questions) and the whole-plan consistency sweep. Note that must-fix 9 added run row R16h, so the run-row counts quoted in the phase files must be re-checked.
4. Ask kongming for the post-plan-gates go/no-go (`--advice` checkpoint).
5. Then run `/ak:cook --tdd --auto plans/261102-1332-k2-lesson-04-caching-teacher-guide/plan.md --advice`.
