# Researcher 02: Prisma 7.9 / PostgreSQL / Windows checks for M1

Date 2026-10-27. The lockfile pins Prisma at **7.9.0**. "Runtime-verified" means tested against a throwaway PG16 container, since removed, from a path containing `học`.

## Verified facts (with source)

**1. Error shape.** Runtime-verified, and read in the client `user-facing-error.ts` source. Every case is a `PrismaClientKnownRequestError`. `err.cause` is `undefined`. The SQLSTATE is in `err.meta.driverAdapterError.cause.originalCode` (codes from the [PG errcodes appendix](https://www.postgresql.org/docs/16/errcodes-appendix.html)).

| Case | Code | `cause.kind` |
|---|---|---|
| raw 23514 (also inside `$transaction`) | **P2010** | `postgres` |
| model `update` 23514 | **P2039** | `postgres` |
| raw 23505 | **P2010** (not P2002) | `UniqueConstraintViolation` |
| model 23505 | P2002 | same |
| raw 55P03 (`NOWAIT`), raw 40P01 | P2010 | `postgres` |
| model 40P01 | **P2039** on 7.9.0; 7.10.1 returns P2034 | `postgres` |
| `maxWait` hit / tx expired | P2028, **no** `driverAdapterError` | n/a |
| query after a swallowed error | P2010, SQLSTATE 25P02 | `postgres` |

- The constraint information differs by version.
  - On 7.9.0, 23505 gives quoted field names in `constraint.fields` (the probe's field list is redacted here: it would reveal a Bài 07 design answer).
  - The 7.10.1 source returns `{index: <name>}` instead.
  - The `postgres` kind has no constraint name at all, so parse `cause.originalMessage` for it.
- Branch on the SQLSTATE, not on the P-code.
- `SKIP LOCKED` never raises an error ([PG SELECT](https://www.postgresql.org/docs/16/sql-select.html)).

**2. Transactions.**
- Defaults are `maxWait` 2000 ms and `timeout` 5000 ms (runtime `getPrismaClient.ts`; [v7 docs](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions)).
- adapter-pg honors `isolationLevel`: it runs `BEGIN` and then `SET TRANSACTION ISOLATION LEVEL`. At runtime the explicit level read back as `serializable`, and the default as `read committed`.
- The pg pool `max` defaults to 10 ([connection pool](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool)).
- A burst of 30 can exceed `maxWait`, which gives P2028 and then HTTP 500.

**3. Migrations.** Runtime-verified.
- `--create-only`, then a hand-added CHECK, then `migrate dev`. A later `migrate dev` reports "Already in sync": no drift and no DROP ([unsupported features](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/unsupported-database-features)).
- In v7, `migrate dev` and `migrate reset` **do not seed or run `generate`** ([v7 upgrade](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)).
- The seed command goes in `migrations.seed` and runs only through `prisma db seed` ([config reference](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference)).
- `migrate reset --force` is blocked for AI agents unless the user consents through `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` ([reset](https://www.prisma.io/docs/cli/migrate/reset)).
- CHECK passes when the expression is NULL ([PG constraints](https://www.postgresql.org/docs/16/ddl-constraints.html)).

**4. Non-ASCII path.** pnpm install, `prisma generate`, `migrate dev` and tsx all worked under `học`. Skip `subst`: realpath expands it back to the real path ([jest#15023](https://github.com/jestjs/jest/issues/15023)), and the pnpm store would land at the subst drive's root, which is inside the repo ([pnpm store](https://pnpm.io/settings/store)).

**5. Compose.** Runtime-verified on v2.38.1, without swarm.
- `deploy.resources.limits.memory` and `mem_limit` both set `HostConfig.Memory`. Use one of them.
- For PG ≤17, mount the volume at `/var/lib/postgresql/data` and pass settings with `-c` ([postgres image](https://hub.docker.com/_/postgres)).

**6. Northwind.** It is **schema `northwind` inside DB `advance_be_lab`**. There is no `northwind` database. It has 77 rows. The relevant columns are `product_id, product_name, category_id, unit_price real, units_in_stock, discontinued integer`.

**7. cURL.** Runtime-verified. Git Bash `curl` is `/mingw64/bin/curl` 8.14.1, and `System32\curl.exe` is 8.13.0. Both support `-w "%{http_code}"`. `xargs -P30` reached 30 concurrent requests on the server. After a separate login step, 30 parallel `-b jar.txt` reads all returned 200.

## Exact commands and snippets

The `Prisma` namespace import is verified to export the error class:

```ts
import { Prisma } from '../generated/prisma/client';
export function sqlState(e: unknown): string | undefined {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return undefined;
  const dae = e.meta?.driverAdapterError as { cause?: { originalCode?: string } } | undefined;
  return dae?.cause?.originalCode; // undefined for P2028
}
```

Set the budget explicitly: `new PrismaPg({ connectionString, max: 20 })` and `$transaction(fn, { maxWait: 5000, timeout: 10000 })`.

```yaml
name: omnipos-hub
services:
  postgres:
    image: postgres:16-alpine
    container_name: omnipos-hub-pg
    command: ["postgres", "-c", "shared_buffers=64MB", "-c", "max_connections=50"]
    environment: { POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres, POSTGRES_DB: omnipos_hub }
    ports: ["127.0.0.1:5434:5432"]
    mem_limit: 384m
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres -d omnipos_hub"], interval: 5s, timeout: 3s, retries: 10 }
volumes:
  pgdata:
```

Seed: set `migrations: { path: 'prisma/migrations', seed: 'ts-node scripts/seed.ts' }`, then run `pnpm --filter api exec prisma db seed`.

Northwind export (tested; UTF-8 without BOM; do not add `-t`). Run it from `omnipos-finledger-hub/`:

```bash
mkdir -p apps/api/prisma/fixtures && docker exec -e PGOPTIONS='-c default_transaction_read_only=on' "$LAB_PG_CONTAINER" psql -U postgres -d advance_be_lab -At -c "select json_agg(json_build_object('sourceId',p.product_id,'name',p.product_name,'category',c.category_name,'unitPrice',p.unit_price::numeric(10,2),'unitsInStock',p.units_in_stock,'discontinued',p.discontinued=1) order by p.product_id) from northwind.products p left join northwind.categories c using (category_id)" > apps/api/prisma/fixtures/northwind-products.json
```

## Caveats

- **Ports.**
  - Taken: 5433 by the lab DB, 3001 (the API default) and 3000 by the company project's containers. 5434 is free.
  - The template compose still maps `5433:5432` and has no `name:` key.
  - If the web port changes, change `WEB_ORIGIN` too. Otherwise `OriginCheckGuard` returns 403 to browser POSTs. Curl sends no Origin header, so it passes.
- **Throttler.** The limit is 100 requests per 60 s per route and IP, and login is limited to 5 per minute. Repeated bursts will get 429s.
- **Version drift.** A fresh lockfile resolves `^7.9.0` to 7.10.x, which changes the P-codes, and npm `latest` is `8.0.0-rc.27`. Use `--frozen-lockfile`. Unversioned prisma.io pages describe Prisma 8, so cite the `/docs/orm/v7/` pages.
- **Swallowed errors.** If you catch an error inside the callback, the next query fails with 25P02. Rethrow instead.

## Unresolved questions

1. `nest build`, Jest and Next have not been tested under `D:\học`. Smoke-test them in M0. The probes ran on C:.
2. Should P2028 map to 503, or should the pool simply be sized to avoid it? This is a plan decision.
