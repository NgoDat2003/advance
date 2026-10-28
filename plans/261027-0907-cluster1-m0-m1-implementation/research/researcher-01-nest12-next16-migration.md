# Research 01: Nest 12 + Next 16 upgrade (ADR-019 spike)

Date: 2026-10-27. Template: `omnipos-finledger-hub/`.

**Bottom line.** The Nest 12 upgrade has a documented blocker. Jest can load ESM-only Nest 12 packages only on Node ≥24.9 ([Nest v12 migration guide](https://docs.nestjs.com/migration-guide), [Jest ESM docs](https://jestjs.io/docs/ecmascript-modules)). On older Node, `require()` of ESM throws `ERR_REQUIRE_ESM`. Every API spec imports `@nestjs/common`, so "jest one test" fails on Node 22.18. The Next 16 upgrade is low-risk: the template has no middleware, no sync request APIs and no webpack config.

## Pinned versions table

Source: `npm view` / `npm pack`, 2026-10-27.

| Package | Nest 12 set | Nest 11 fallback (all CJS, `type` unset) |
|---|---|---|
| @nestjs/common, core, platform-express, testing | **12.2.0** (12.3.0 was published today; do not adopt it untested) | 11.2.8 |
| @nestjs/cli | 12.0.10 (12.0.11 was published today) | 11.0.24 |
| @nestjs/schematics (transitive) | ^12 (engines `node ^22.22.3`, peer `typescript >=6`) | 11.1.0 |
| @nestjs/config | 12.0.1 | 4.0.4 (do not use 12.0.1 here: it is ESM-only) |
| @nestjs/jwt / passport | 12.0.3 / 12.0.0 | 11.0.2 / 11.0.5 |
| @nestjs/swagger | 12.0.5 | 11.4.7 |
| @nestjs/terminus | 12.1.0 | 11.1.1 |
| @nestjs/throttler | 6.7.1 | 6.7.1 |
| nestjs-pino | 5.3.1 (dual CJS/ESM, engines node >=22.12) | 4.6.1 |
| @types/express | 5.0.6 (platform-express 12 ships express 5.3.0) | 5.0.6 (11.2.8 ships express 5.2.1) |
| next / eslint-config-next | 16.4.3 / 16.4.3 | 15.5.28 / 15.5.28 |
| react, react-dom / @types/react(-dom) | 19.3.1 / 19.3.0 | unchanged |
| jest / ts-jest / @types/jest | 29.7 cannot load ESM Nest 12 on any Node; Node ≥24.9 path needs 30.5.2 / 29.4.15 / 30.0.0 | 29.7 / 29.4.15 / 29.5.14 |
| Unchanged | Prisma 7.9.x, TS 5.9.3, ts-node 10.9.2, Orval 8, Tailwind 4, base-ui | same |

## Breaking changes that touch this template

1. **Jest (blocker).** `api/jest.config.js:3` (ts-jest, CJS). Every spec imports ESM `@nestjs/common` (e.g. `origin-check.guard.spec.ts:1`, `auth.service.spec.ts:1`), so all fail on Node 22. Transforming `@nestjs/*` to CJS is not viable: `@nestjs/common/utils/load-package.util.js:52` uses `import.meta.url`.
2. **CJS app + ESM core: OK.** Nest says app-to-ESM is optional; CJS runs via `require(esm)`, Node ≥22.12 ([guide](https://docs.nestjs.com/migration-guide), [jwt 12 notes](https://github.com/nestjs/jwt/releases/tag/12.0.0)). Keep `typescript-config/nestjs.json:5-6` (`commonjs`/`node10`); common/core expose `main: ./index.js` + `.d.ts`, so types resolve. `nodenext` would surface ESM import errors.
3. **Node patch.** CLI/schematics need Node ≥22.22.3 ([guide](https://docs.nestjs.com/migration-guide); schematics ≥12.0.5 `engines`). On 22.18 only a warning (pnpm `engineStrict` default false, [pnpm](https://pnpm.io/settings/cli)). Node 22.23.4 stays on 22.x ([nodejs.org](https://nodejs.org/en/about/previous-releases)); does not fix Jest.
4. **TS 6 peer.** CLI `lib/compiler/typescript-loader.js:12-13` resolves `typescript` from `process.cwd()` first, so `nest build` uses TS 5.9; peer warning only (`.npmrc` `strict-peer-dependencies=false`).
5. **Express 5 wildcard.** `app.module.ts:67` `path: '*'` still works: `core/router/legacy-route-converter.js:32-36` converts it to `{*path}` silently. Comment `app.module.ts:61-66` becomes false. Recommend deleting `forRoutes`; nestjs-pino 5 default is `{/*splat}` (`LoggerModule.js:38`). Applies to the fallback too (platform-express 11.2.8 ships express 5.2.1).
6. **Swagger 12 nullable spelling** changes ([release](https://github.com/nestjs/swagger/releases/tag/12.0.0)); regenerate Orval, diff `web/lib/api/generated/**`.
7. **Verified no change:** `health.controller.ts:23-31` already uses `HealthIndicatorService` + returned `down()` (Terminus 12 removed `HealthIndicator`, [release](https://github.com/nestjs/terminus/releases/tag/12.0.0)); `jwt-auth.guard.ts` does not override `getAuthenticateOptions` (Passport 12); `app.module.ts:21-24` uses `validate`, not changed `validationOptions` (config 12); `scripts/*.ts` run under ts-node CJS, so `require(esm)` applies.
8. **Next 15.5 → 16.4** ([guide](https://nextjs.org/docs/app/guides/upgrading/version-16)): no `middleware.ts` (proxy rename n/a); no `cookies()`/`headers()`/`params`/`searchParams`; Turbopack default for dev+build, no webpack config so OK; `--port` still valid ([CLI](https://nextjs.org/docs/app/api-reference/cli/next)); dev output moves to `.next/dev` (expect `tsconfig` include diff); `next lint` removed, template already uses `eslint .`; `eslint-config-next` unwired in `packages/eslint-config/next.js`, version bump only; `next/jest` still ships in 16.4.3.

## Spike checklist with pass conditions

Run the steps one at a time. Kill each long-running process before starting the next.

| # | Step | Pass condition |
|---|---|---|
| 1 | `pnpm install` | Exit 0; only engine/peer warnings allowed. |
| 2 | In `apps/api`: `node -e "require('@nestjs/core')"` | Exit 0, no `ERR_REQUIRE_ESM`/`ASYNC_MODULE`. |
| 3 | `pnpm --filter api prisma:generate` | Exit 0; `src/generated/prisma/client.ts` exists. |
| 4 | `pnpm --filter api test -- origin-check` (no DB; decides Q1 early) | 1 suite passes. Expected to fail on Node 22.18. |
| 5 | `pnpm --filter api check-types`; in `apps/web`: `next typegen && tsc --noEmit` | Exit 0 both. |
| 6 | `pnpm --filter api openapi:generate` (ts-node, no DB connect) | `openapi.json` written. |
| 7 | `nest build`; `node dist/src/main.js` (per `api/Dockerfile:68`); `GET /health` | 200 `status:"ok"`; no route-converter error. |
| 8 | `POST /auth/login` (seed first) | 200 + `Set-Cookie` access & refresh. |
| 9 | `pnpm --filter web dev`; `GET /`, `GET /login` | Both 200. |
| 10 | `pnpm codegen:web`; `git diff --stat lib/api/generated` | Only nullable diffs or none; web `tsc` still exit 0. |

## Fallback triggers

| Signal | Action |
|---|---|
| Step 2 throws `ERR_REQUIRE_ESM` / `ERR_REQUIRE_ASYNC_MODULE` | Nest 11. |
| Step 4 fails with `ERR_REQUIRE_ESM` (expected on Node 22.18) | Choose: Nest 11, Node 24.9+ with Jest 30.5.2, or Vitest + SWC (more than 1h). |
| `nest build` crashes on the Node engine | Upgrade Node to 22.23.x and retry once, then Nest 11. |
| Step 7/8 non-200 or cookie missing after one fix attempt | Nest 11. |
| Step 9 runs out of memory or exceeds 3 min to the first 200 under Turbopack | Retry with `--webpack` first, then Next 15.5.28. |
| More than 60 minutes elapsed | Fall back on the failing side. |

**Memory (0.7 GB free).** No measured footprint found for a 2-route app. Closest: nextjs.org 4.6 GB → 840 MB after 50 routes on 16.3 (eviction + disk cache, [16.3 blog](https://nextjs.org/blog/next-16-3)); one report: Turbopack ~7 GB vs webpack ~3 GB, version unknown ([#93451](https://github.com/vercel/next.js/discussions/93451)). Reducers: `experimental.turbopackMemoryEviction: 'full'` ([docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackMemoryEviction)), `experimental.preloadEntriesOnStart: false`, or `next dev --webpack` + `experimental.webpackMemoryOptimizations: true` ([guide](https://nextjs.org/docs/app/guides/memory-usage)). Memory never justifies a Nest fallback.

## Unresolved questions

1. Nest 12 Jest blocker: relax "keep Node 22" to Node 24 LTS (24.22.1), switch to Vitest, or Nest 11?
2. ADR-019 bundles both fallbacks; apps are independent. Decouple them?
3. Pin 12.2.0 (ADR) or 12.3.0 (released today)?
4. Bump Node to 22.23.x for the CLI/schematics engine floor?
