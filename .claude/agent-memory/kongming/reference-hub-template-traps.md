---
name: hub-template-traps
description: Non-obvious facts verified 2026-10-27 in the private template repo NgoDat2003/create-template-project that the OmniPOS hub (D:/học/advance-be/omnipos-finledger-hub, gitignored from advance-be) is cloned from
metadata:
  type: reference
---
Template `NgoDat2003/create-template-project` (read via `gh api`, 2026-10-27):
- `OriginCheckGuard` lets requests with no `Origin` header through; cURL needs no Origin.
- Global `ThrottlerGuard` 100 req/min; `POST /auth/login` 5/min. Parallel-30 harnesses must log in once per run and the limit must be raised for the hub.
- `.env` belongs at `apps/api/.env` (not root); `prisma.config.ts` + `dotenv/config` in `main.ts`/`seed-admin.ts` supply `DATABASE_URL` to Prisma 7.
- `scripts/generate-openapi.ts` boots full AppModule (Prisma `$connect`) so `pnpm codegen` needs the DB up.
- `apps/api/src/generated/` (Prisma client) is neither committed nor gitignored; `CLAUDE.md` IS gitignored.
- `seed-admin.ts` hardcodes the admin password; Next web uses `output: 'standalone'` (needs Windows symlink/Developer Mode for `next build`).

**Why:** The hub repo is gitignored from advance-be, so future sessions in advance-be cannot grep these; the skeleton contract (plans/reports/brainstorm-261027-1333-hub-skeleton-contract.md) depends on them.

**How to apply:** When advising on the hub harness, seed, env or codegen order, verify against the cloned hub first (it may have diverged), then fall back to these.
