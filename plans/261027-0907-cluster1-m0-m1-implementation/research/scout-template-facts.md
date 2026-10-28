# Scout — template facts cho plan M0/M1 (27/10/2026, chỉ đọc)

Repo hub: `D:/học/advance-be/omnipos-finledger-hub/` (template giải nén, `git init` xong, chưa commit, chưa `pnpm install`). advance-be `.gitignore` đã có `/omnipos-finledger-hub/` (dòng 38, chưa commit).

## Chỗ phải đổi cổng / tên (file:line)
| File | Dòng | Hiện tại |
|---|---|---|
| `.env.example` | 1 | `DATABASE_URL` trỏ `localhost:5433/create_project_from_template` |
| `.env.example` | 18–19 | ghi chú `PORT=3001`, `WEB_ORIGIN=http://localhost:3000` |
| `docker-compose.yaml` | 8, 10, 14 | `POSTGRES_DB: create_project_from_template`, `"5433:5432"`, healthcheck `-d create_project_from_template`; không có `name:`, `container_name`, `mem_limit` |
| `package.json` (root) | 2 | `"name": "create-project-from-template"` |
| `apps/api/src/config/env.schema.ts` | 18–19 | `PORT` default 3001, `WEB_ORIGIN` default `http://localhost:3000` |
| `apps/api/src/main.ts` | 43, 46, 52 | CORS fallback 3000; Swagger title "Training App API"; `listen(PORT ?? 3001)` |
| `apps/api/scripts/generate-openapi.ts` | 11 | title "Training App API" |
| `apps/api/src/common/guards/origin-check.guard.ts` | 28 | fallback `http://localhost:3000` |
| `apps/web/package.json` | 6 | `"dev": "next dev --port 3000"` |
| `apps/web/lib/api/http-client.ts` | 11 | `BASE_URL` fallback `http://localhost:3001` |
| `apps/web/.env.local.example` | 1 | `NEXT_PUBLIC_API_URL=http://localhost:3001` |
| `apps/web/app/layout.tsx` | 10–11; `app/page.tsx` 2 | "Training App" |
| `apps/web/lib/api/generated/**` | header | "Training App API" — chỉ đổi bằng `pnpm codegen`, không sửa tay |

## Throttle, seed, route
- `apps/api/src/app.module.ts:80` `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` → đưa ra env (ví dụ `THROTTLE_LIMIT`), dev đặt cao.
- `apps/api/src/modules/auth/auth.controller.ts:30,42` login/refresh `@Throttle` 5/phút → `checks/` đăng nhập 1 lần mỗi lượt.
- `apps/api/src/app.module.ts:67` `forRoutes: [{ path: '*', ... }]` — Nest ≥ 11 (Express 5) phải đổi `'{*path}'`, nếu không pino-http âm thầm không chạy.
- `apps/api/scripts/seed-admin.ts:14` mật khẩu admin viết cứng; README template dòng 33 cũng ghi credential dev → chuyển sang env (`SEED_ADMIN_PASSWORD`) và sửa README trước khi public.
- `.env` thật nằm ở `apps/api/.env` (README dòng 24: `cp .env.example apps/api/.env`), web ở `apps/web/.env.local`.
- Health `GET /health` (public, kiểm DB). Auth: `POST /auth/login|refresh|logout`, `GET /auth/me`. `OriginCheckGuard` cho qua request không có `Origin`.

## Cấu hình build/test hiện tại (sẽ bị ảnh hưởng khi lên Nest 12)
- `packages/typescript-config/nestjs.json`: `module: commonjs`, `moduleResolution: node10`, `experimentalDecorators`, `emitDecoratorMetadata`, `target ES2021`.
- `apps/api/jest.config.js`: CommonJS, `preset: ts-jest`, `rootDir: src`.
- `apps/api/nest-cli.json`: `@nestjs/schematics`, `deleteOutDir`.
- Spec có sẵn: `common/guards/origin-check.guard.spec.ts` (unit, không DB), `modules/auth/auth.service.spec.ts`, 2 file `*.integration.spec.ts` (cần DB).
- Prisma: `apps/api/prisma.config.ts` đọc `DATABASE_URL`; `schema.prisma` có `User`, `AuthSession`, enum `Role { ADMIN TRAINER TRAINEE }`; client sinh vào `apps/api/src/generated/prisma` (đã gitignore, `.gitignore:80`).
- Web: không có `middleware.ts`; `app/` chỉ có `(auth)/login`, `page.tsx`, layout, error pages; `features/auth`.

## File mang nhãn khách hàng cũ / không thuộc dự án (xóa trước khi public)
`index.html`, `docs/index.html`, `docs/security-audit-full-project.md` (nội dung có nhãn khách hàng cũ); 2 file logo ở gốc + 2 file logo trong `docs/` + 1 file HTML giao diện UI cũ trong `docs/` (tên file mang nhãn khách hàng cũ — liệt kê bằng `git ls-files | grep -iE "$LEAK_REGEX"`, không ghi tên ở đây). Ghi chú cũ về `.agent/projectRules/frontend-architecture.md` chưa kiểm lại được (grep của planner không thấy) — dùng grep nhãn chung. `CLAUDE.md` của template bị `.gitignore` của chính nó loại (dòng `CLAUDE.md`) nên không lên git.

## Máy
RAM 15,8 GB, trống ~0,7 GB lúc 13:40. Cổng 5434, 3100, 3101, 6380 trống. Node 22.18, pnpm 11.2.2, `gh` đăng nhập tài khoản chủ repo (scope `repo`). Container không được đụng: container dự án công ty (3000/3001), container PG lab (5433), `advance-be-redis` (6379). Tên thật đọc từ `$COMPANY_CONTAINERS_REGEX` / `$LAB_PG_CONTAINER` (đặt trong shell, không commit).
