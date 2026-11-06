---
title: "Bài 04 Codebase Structure teacher guide (Clean Architecture, DDD; measured with plain Node labs)"
description: "Vietnamese single-file guide for Bài 04: 33 slides, 7 stages, one wallet-transfer domain shown in spaghetti and clean form, every number from a recorded run."
status: completed
priority: P1
branch: feat/lesson-04-codebase-structure-guide
tags: [lesson-04, clean-architecture, ddd, teacher-guide]
created: 2026-11-06
---

# Bài 04 — Codebase Structure teacher guide

## Outcome

Đạt studies Cluster 3 day 1 (09/11) from one HTML guide and leaves able to review a module's layer boundaries and to place `WalletsService.transferLocked` onto four layers before the v1.0 → v2.0 refactor (15–17/11).

## Scope

- In: guide at `reports/advanced_backend/lesson_04_codebase_structure_teacher_guide.html`; labs at `labs/lesson-04-codebase-structure/`; README and curriculum links; handoff.
- Out: any change inside `omnipos-finledger-hub` (read-only baseline only; refactoring it is Đạt's Pha B work); Bài 13 (SOLID, `Result<T,E>`); Docker or Postgres; npm dependencies.

## Stage map

| Stage | Slides | Topic | Lab |
|---|---|---|---|
| `#cach-hoc` | 1–3 | why structure matters, how to study | – |
| 1 | 4–8 | flow of control, layered, closed vs open | `08-cost` |
| 2 | 9–12 | hexagonal, onion, port and adapter | `04-port-contract` |
| 3 | 13–17 | clean, crossing boundaries, when not to apply | `01-entity-leak`, `03-dependency-rule` |
| 4 | 18–19 | functional core, test speed | `06-functional-core`, `02-test-speed` |
| 5 | 20–25 | project structure, dividing domains, bounded context, ubiquitous language | – |
| 6 | 26–29 | entity, value object, aggregate, service, repository, layers | `05-value-object-aggregate` |
| 7 | 30–31, 33 | recap (DI vs DIP), references, Hub refactor map | `07-di-vs-dip` |
| homework | 32 | Flight Booking review and skeleton | `hw-check` |

The `TODO(Đạt)` challenge sits in stage 6.

## Acceptance criteria

1. All 33 slides are mapped exactly once, each with a verdict chip or marked as non-claim.
2. Every quoted number or output comes from a file in `runs/`, pasted verbatim. Where a slide and a measurement differ, the chip says so.
3. Labs run on plain Node with no install and no container. `npm run all` exits 0.
4. Each stage follows the accepted shape: goal, why, diagram, 30-second check, worked example, verification, challenge, four quiz items.
5. `hw-check` passes the solution and fails the AI draft. The `TODO(Đạt)` challenge fails as a scaffold and passes with the solution.
6. Guide renders with no console errors in light and dark at phone and desktop widths, and has no horizontal scroll at phone width.
7. Hub working tree is unchanged. `plans/reports/lightpanda-pack/` stays untracked and out of every commit.

## Slide claims to challenge

- Slide 15 places DTOs in the domain layer. DTOs belong at the application edge.
- Slide 17 advises against Clean Architecture for 1–3 person teams, while the roadmap refactors a solo Hub to four layers. Apply it to wallets and vouchers only; keep CRUD thin.
- Slide 29's pyramid draws dependencies flowing down into infrastructure, which contradicts slide 27 (interface in domain, implementation in infrastructure).
- Slides 21 asks how to divide domains and gives no answer. The guide must answer it.

## Risks

| Risk | Mitigation |
|---|---|
| Account expires mid-run | commit and push after labs, after guide, after docs |
| Node version differs (nvm 22 vs 24) | erasable TypeScript only; run labs on the installed version and state it |
| Timing numbers depend on the machine | median of 3, labelled "phụ thuộc máy" |
| In-memory adapter hides races | contract lab shows it; real Postgres numbers stay in Bài 14 |

## Review log

One independent review reported 3 Critical, 7 Important and 2 Minor findings. The Critical and Important findings were checked against source and applied. Items handled differently:

- Slide 29 keeps "Cần sửa", and the guide notes that the drawing may follow classic DDD layering.
- Slide 27's naming point stays as a stated preference.
- Not applied (Minor): a non-numeric `amount` such as `'abc'` still rethrows as a `SyntaxError` in the lab handler, because input validation belongs to the DTO edge. The note about the Hub's `@IsNumber` transfer amount was also left out of the guide.

Changes from the plan: the validate and red-team gates were merged into this single review because the account is close to expiry.

## Rollback

Delete the branch. Nothing outside the worktree is modified.
