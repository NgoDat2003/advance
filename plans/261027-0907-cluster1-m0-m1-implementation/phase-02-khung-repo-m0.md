---
phase: 2
title: "Khung repo M0: cổng, compose, env, guard DB, nhãn, boot gate S6–S10, repo private"
status: pending
priority: P1
effort: "2.5h"
dependencies: [1]
owner: "executor"
---

# Phase 2: Khung repo M0

## Goal
Hub boot được trên 127.0.0.1 cổng 5434/3101/3100, qua S6–S10, sạch cổng cấm, sạch nhãn cũ, sạch bí mật; lịch sử git bắt đầu bằng 1 commit mới (không mang snapshot template), đã push lên repo **private**.

Quy ước `HUB`, `OUT`, file guard, shell, RAM: bảng đầu phase 1. Mọi shell: `source "$HUB/checks/guard.local.sh"`.

## Files to Create / Modify
- Modify: `docker-compose.yaml`, `.env.example`, `.gitignore`, `package.json` (root), `README.md`, `apps/api/package.json`, `apps/api/prisma.config.ts`, `apps/api/src/config/env.schema.ts`, `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/src/common/guards/origin-check.guard.ts`, `apps/api/scripts/generate-openapi.ts`, `apps/api/Dockerfile`, `apps/web/package.json`, `apps/web/lib/api/http-client.ts`, `apps/web/.env.local.example`, `apps/web/Dockerfile`, `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`, `docs/backend-config-baseline-explained.md`, `.agent/projectRules/backend-architecture.md`
- Create: `apps/api/scripts/assert-db-target.ts`, `apps/api/scripts/seed.ts`, `apps/api/scripts/seed/seed-admin-user.ts`, `checks/lib/common.sh`, `checks/lib/ensure-login.sh`, `checks/lib/protected-containers.sh`, `checks/login.sh`, `apps/api/.env`, `apps/web/.env.local` (2 file cuối cục bộ, bị ignore)
- Delete: `index.html`, `docs/index.html`, `docs/security-audit-full-project.md`, `apps/api/scripts/seed-admin.ts`, và 5 file có tên khớp `$LEAK_REGEX` (2 logo gốc, 2 logo `docs/`, 1 HTML UI cũ trong `docs/`)

## Tasks

### T2.1 — Cổng phải trống
- Verify: `netstat -ano | grep -E ":(5434|3100|3101) .*LISTENING"` → không in gì (exit 1). Có dòng → STOP, Failure Protocol.

### T2.2 — Compose riêng cho hub
- Target: `HUB/docker-compose.yaml` (thay toàn bộ). Không có `restart:` (không tự bật, đỡ RAM):
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
- Verify: `cd "$HUB" && docker compose config --quiet` → exit 0.

### T2.3 — Env, secret sinh ngầm, guard DB
- Goal: env mẫu an toàn; env thật có secret ngẫu nhiên không ai thấy; mọi lệnh Prisma từ chối DB khác `localhost:5434/omnipos_hub`.
- Lưu ý executor: mỗi lệnh ghi/đọc `apps/api/.env` ở task này (và T5.3) sẽ bật 1 hộp hỏi duyệt của hook privacy. **Chờ Đạt duyệt — đây không phải lỗi**, không tính là Verify hỏng, không lách hook.
- Steps:
  1. `.env.example` dòng 1 → `DATABASE_URL="postgresql://postgres:postgres@localhost:5434/omnipos_hub?schema=public"`; dòng 18–19 → `PORT=3101`, `WEB_ORIGIN="http://localhost:3100"` (bỏ comment). Thêm: `HOST=127.0.0.1`; `THROTTLE_TTL_MS=60000`; `THROTTLE_LIMIT=100` kèm comment "máy dev đặt 10000 trong apps/api/.env để checks/ không dính 429"; `SEED_ADMIN_EMAIL="admin@example.com"`; `SEED_ADMIN_PASSWORD=` (trống).
  2. `apps/web/.env.local.example` → `NEXT_PUBLIC_API_URL=http://localhost:3101`.
  3. `cp .env.example apps/api/.env && cp apps/web/.env.local.example apps/web/.env.local`
  4. Sinh 3 secret + đặt throttle dev, không in ra:
```bash
cd "$HUB/apps/api"
gen() { node -e "process.stdout.write(require('crypto').randomBytes(24).toString('base64url'))"; }
sed -i '/^JWT_ACCESS_SECRET=/d; /^JWT_REFRESH_SECRET=/d; /^SEED_ADMIN_PASSWORD=/d; /^THROTTLE_LIMIT=/d' .env
{ echo "JWT_ACCESS_SECRET=$(gen)"; echo "JWT_REFRESH_SECRET=$(gen)"; echo "SEED_ADMIN_PASSWORD=$(gen)"; echo "THROTTLE_LIMIT=10000"; } >> .env
```
  5. Tạo `apps/api/scripts/assert-db-target.ts`: export `assertHubDatabaseUrl(url: string | undefined)` — parse bằng `new URL`, chỉ chấp nhận host `localhost` hoặc `127.0.0.1`, port `5434`, pathname `/omnipos_hub`; sai → `throw new Error('DB target guard: DATABASE_URL phải trỏ localhost:5434/omnipos_hub')` (không in URL). Khi chạy trực tiếp: `import 'dotenv/config'`, gọi hàm, in `DB target OK`.
  6. `prisma.config.ts`: gọi `assertHubDatabaseUrl(process.env.DATABASE_URL)` ngay sau `import 'dotenv/config'` → mọi `migrate`, `db seed`, `migrate reset` đều qua guard.
  7. `apps/api/package.json` scripts: thêm `"db:assert": "ts-node scripts/assert-db-target.ts"`.
- Success criteria: secret có, guard chặn DB sai.
- Verify:
```bash
cd "$HUB/apps/api"
grep -cE '^(JWT_ACCESS_SECRET|JWT_REFRESH_SECRET|SEED_ADMIN_PASSWORD)=.{24,}$' .env    # 3
pnpm db:assert                                                                         # in "DB target OK", exit 0
DATABASE_URL='postgresql://u:p@localhost:5433/x' pnpm db:assert; echo "exit=$?"        # có "DB target guard", exit≠0, không in URL
# guard có thật trong prisma.config.ts (cổng 59999 không ai nghe → nếu thiếu guard sẽ ra lỗi kết nối, không phải chuỗi guard)
DATABASE_URL='postgresql://u:p@localhost:59999/x' pnpm exec prisma migrate status 2>&1 | grep -c "DB target guard"   # ≥ 1
```

### T2.4 — Đổi cổng, host, tên ở từng dòng
| File | Dòng | Đổi thành |
|---|---|---|
| `package.json` (root) | 2 | `"name": "omnipos-finledger-hub"` |
| `apps/api/src/config/env.schema.ts` | 18–19 | default `3101`, `'http://localhost:3100'`; thêm `HOST: z.string().min(1).default('127.0.0.1')` |
| `apps/api/src/main.ts` | 43 | fallback `'http://localhost:3100'` |
| `apps/api/src/main.ts` | 46 | `.setTitle('OmniPOS & FinLedger Hub API')` |
| `apps/api/src/main.ts` | 52 | `await app.listen(process.env.PORT ?? 3101, process.env.HOST ?? '127.0.0.1')` |
| `apps/api/scripts/generate-openapi.ts` | 1, 11 | thêm `import 'dotenv/config';` làm dòng 1; title như trên |
| `apps/api/src/common/guards/origin-check.guard.ts` | 28 | fallback `'http://localhost:3100'` |
| `apps/api/Dockerfile` | 65 | `EXPOSE 3101` |
| `apps/web/package.json` | 6 | `"dev": "next dev -H 127.0.0.1 --port 3100"` |
| `apps/web/lib/api/http-client.ts` | 11 | fallback `'http://localhost:3101'` |
| `apps/web/Dockerfile` | 52, 54 | `ENV PORT=3100`, `EXPOSE 3100` |
| `apps/web/app/layout.tsx` / `app/page.tsx` | 10–11 / 2 | "OmniPOS & FinLedger Hub" |
| `docs/backend-config-baseline-explained.md` | 20, 22 | cổng ví dụ → 3100 / 3101 |
- Verify: `no verification needed` — G1 ở T2.10 kiểm.

### T2.5 — Throttle ra env, wildcard Express 5
- Steps:
  1. `envSchema`: `THROTTLE_TTL_MS` (`z.coerce.number().int().positive().default(60000)`), `THROTTLE_LIMIT` (`...default(100)`).
  2. `app.module.ts:80` → `ThrottlerModule.forRootAsync({ inject: [ConfigService], useFactory: (c: ConfigService<AppEnv, true>) => [{ ttl: c.get('THROTTLE_TTL_MS', { infer: true }), limit: c.get('THROTTLE_LIMIT', { infer: true }) }] })`.
  3. `app.module.ts:67` → `path: '{*path}'` (ADR-019); thay comment 61–66 bằng 2 dòng tiếng Việt (Express 5 dùng `{*path}`; kiểm bằng log `/health` ở S7c).
  4. Giữ `@Throttle` 5/phút của login.
- Verify: `pnpm --filter api check-types` → exit 0.

### T2.6 — Seed: mật khẩu từ env, không in
- Steps:
  1. `scripts/seed/seed-admin-user.ts`: export `seedAdminUser(prisma: PrismaService)`; đọc `SEED_ADMIN_EMAIL ?? 'admin@example.com'`, `SEED_ADMIN_PASSWORD` (thiếu → throw "Thiếu SEED_ADMIN_PASSWORD trong apps/api/.env"); upsert như `seed-admin.ts:24-35`; log duy nhất `Seeded admin user: <email>`.
  2. `scripts/seed.ts`: dòng 1 `import 'dotenv/config';`; chặn `NODE_ENV=production`; `NestFactory.createApplicationContext(AppModule, { logger: false })`; gọi `seedAdminUser`; đóng app.
  3. Xóa `scripts/seed-admin.ts`. `prisma.config.ts`: `migrations: { path: 'prisma/migrations', seed: 'ts-node scripts/seed.ts' }`.
  4. Scripts: `"seed": "prisma db seed"`; thay `"prisma:reset"` bằng `"db:reset": "prisma migrate reset --force && prisma db seed"` (chỉ Đạt chạy). Guard DB chạy qua `prisma.config.ts`.
  5. Sửa người dùng cũ của `seed-admin.ts`: `.agent/projectRules/backend-architecture.md:136` và `docs/backend-config-baseline-explained.md` (dòng ~93, chuỗi `scripts/seed-admin.ts`) → `scripts/seed.ts` + `scripts/seed/*`.
- Verify: `cd "$HUB" && grep -rnE "ADMIN_PASSWORD *= *'|seed-admin\.ts|console\.(log|info).*(PASSWORD|password)" apps/api/scripts README.md docs .agent` → không in gì.

### T2.7 — Dọn nhãn cũ, README, `.gitignore`
- Steps:
  1. `git ls-files | grep -iE "$LEAK_REGEX"` → đúng 5 đường dẫn (tên file mang nhãn cũ). `git rm` 5 file đó cùng `index.html`, `docs/index.html`, `docs/security-audit-full-project.md`.
  2. Quét nội dung: `grep -rlniE "$LEAK_REGEX|training app|create.project.from.template" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=checks --exclude=pnpm-lock.yaml --exclude=CLAUDE.md`. Mỗi file trúng → thay chữ bằng "OmniPOS & FinLedger Hub" / `omnipos-finledger-hub`. Không đổi enum `TRAINER`/`TRAINEE`. File generated của Orval tự đổi ở S10.
  3. `.gitignore`: thêm `.worktrees/`; giữ 2 dòng T1.0 đã thêm (`checks/out/`, `checks/guard.local.sh`). Kiểm: `grep -cxE 'checks/out/|checks/guard\.local\.sh|\.worktrees/' .gitignore` → `3`.
  4. Viết lại `README.md` (tiếng Việt, ngắn): 3 dòng giới thiệu; bảng cổng (PG 5434, API 3101 + Swagger `/api`, web 3100, đều bind 127.0.0.1; mở web bằng `http://localhost:3100` cho khớp `WEB_ORIGIN`); yêu cầu: Node `24.22.1` qua `nvm install 24.22.1 && nvm use 24.22.1` (ghi rõ, không dựa `.nvmrc`), pnpm 11.2.2, Docker; khối boot: `pnpm install --frozen-lockfile` → copy 2 file env → tự đặt `SEED_ADMIN_PASSWORD`, 2 JWT secret, `THROTTLE_LIMIT=10000` → `docker compose up -d` → `pnpm --filter api exec prisma migrate deploy` → `pnpm --filter api prisma:generate` → `pnpm --filter api seed` → `pnpm codegen` → `pnpm --filter api build` → `cd apps/api && node dist/src/main.js`; mục "Kiểm tra" trỏ `checks/` (chạy trong Git Bash); mục "Migration có CHECK tay": `prisma migrate dev --create-only` rồi sửa `migration.sql`. Không ghi credential, không nhắc tên container nào ngoài `omnipos-hub-pg`.
- Verify: `no verification needed` — G2 ở T2.10 kiểm.

### T2.8 — `checks/lib` + đăng nhập
- Steps:
  1. `checks/lib/common.sh` (comment tiếng Việt): `HUB_ROOT` (tính từ vị trí file); `OUT=$HUB_ROOT/checks/out` (`mkdir -p`); `API=${API:-http://127.0.0.1:3101}`; `JAR=$OUT/cookies.txt`; nếu có `checks/guard.local.sh` thì `source`; `read_env KEY` (đọc `apps/api/.env`, bỏ nháy, không echo); `psql_hub` = `docker exec -i omnipos-hub-pg psql -U postgres -d omnipos_hub -q -At "$@"`; `kill_port PORT` (PID cột cuối của `netstat -ano | grep -E ":PORT .*LISTENING"` → `taskkill //PID <pid> //T //F`; chỉ dùng cho 3100/3101); `port_free PORT` (exit 0 khi không còn LISTENING).
  2. `checks/login.sh`: dựng JSON bằng `printf` từ `read_env SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD`, `--data-binary @-` vào `POST $API/auth/login`, `-c "$JAR"`; in đúng `login <code>`; exit 0 chỉ khi 200. Không gửi `Origin`.
  3. `checks/lib/ensure-login.sh`: chạy `login.sh` khi jar chưa có, hoặc `find "$JAR" -mmin +10` có kết quả, hoặc `GET $API/auth/me` với jar trả 401.
  4. `checks/lib/protected-containers.sh`: hàm `compare_protected` đọc `$OUT/protected-before.txt`; với mỗi `id`, so `docker inspect -f '{{.State.StartedAt}}' <id>` với giá trị đã lưu; in dòng `CHANGED <name>` hoặc `MISSING <name>` khi lệch; không lệch thì không in gì. File mốc thiếu hoặc rỗng → in `NO_BASELINE` và exit 1 (không được "pass" khi mất mốc).
  5. `chmod +x checks/*.sh checks/lib/*.sh`.
- Verify: `for f in checks/*.sh checks/lib/*.sh; do bash -n "$f" || echo BAD $f; done` → không in `BAD`.

### T2.9 — Boot gate: compose, migrate, seed, S6–S10 (đồng hồ 45 phút từ B1)
| # | Lệnh (từ `HUB`) | Pass condition |
|---|---|---|
| B1 | Ghi `Start S6–S10: <HH:MM>` vào `OUT/spike-results.md`; `docker compose up -d`; lặp `docker inspect -f "{{.State.Health.Status}}" omnipos-hub-pg` tối đa 60 s | `healthy` |
| B2 | `docker stats --no-stream --format "{{.MemUsage}}" omnipos-hub-pg` | vế sau `384MiB` |
| B3 | `pnpm --filter api db:assert && pnpm --filter api exec prisma migrate deploy` | `DB target OK`; exit 0 |
| B4 | `source checks/lib/common.sh && psql_hub -c "select count(*) from _prisma_migrations"` | `2` |
| B5 | `pnpm --filter api seed` | exit 0; có `Seeded admin user:` |
| S6 | `pnpm --filter api openapi:generate` | exit 0; `grep -c "OmniPOS & FinLedger Hub API" apps/api/openapi.json` ≥ 1 |
| S7a | `pnpm --filter api build` | exit 0; có `apps/api/dist/src/main.js` |
| S7b | Bash tool `run_in_background`: `cd apps/api && node dist/src/main.js > ../../checks/out/api.log 2>&1`; lặp `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3101/health` ≤ 30 s | `200`, body có `"status":"ok"`; `netstat -ano \| grep ":3101 .*LISTENING"` chỉ thấy `127.0.0.1:3101` |
| S7c | `grep -c "/health" checks/out/api.log` | ≥ 1 (chuỗi log pino chính xác `[UNVERIFIED]`) |
| S8 | `bash checks/login.sh && grep -c app_access_token checks/out/cookies.txt` | `login 200`; ≥ 1 |
| K1 | `kill_port 3101 && port_free 3101` | exit 0 |
| S10 | `pnpm codegen` rồi `cd apps/web && pnpm exec tsc --noEmit` | exit 0 cả 2 |
| S9 | Bash tool `run_in_background`: `pnpm --filter web dev`; lặp `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3100/login` ≤ 180 s; rồi `/` | `200` cả 2 |
| K2 | `kill_port 3100 && port_free 3100` | exit 0 |
- S6–S10 hỏng: xem bảng fallback phase 1 T1.6 trước. Ghi pass/fail + giờ vào `OUT/spike-results.md`.

### T2.10 — Cổng nghiệm thu G1–G5 (dùng lại ở mọi phase sau)
Từ `HUB`, sau `git add -A`:
```bash
# G1 cổng cấm → không in gì
git grep --cached -nwE '3000|3001|5433|6379' -- . ':!pnpm-lock.yaml'
# G2 nhãn/tên cấm → không in gì
git grep --cached -niE "$LEAK_REGEX|training app|create.project.from.template" -- . ':!pnpm-lock.yaml'
# G3 env → đúng 2 dòng: .env.example, apps/web/.env.local.example
git ls-files --cached | grep -E '(^|/)\.env'
# G4 output cục bộ → 0
git ls-files --cached | grep -cE 'checks/out|guard\.local\.sh'
# G5 container của Đạt còn đủ, không bị restart → không in gì
source checks/lib/protected-containers.sh && compare_protected
```
- G3 thay AC gốc `grep -i env` (khớp nhầm `env.schema.ts`).
- G5 in `CHANGED`/`MISSING` → **STOP, hỏi Đạt** "container <name> khởi động lại/biến mất — có phải anh làm?". Không phải Failure Protocol. Đạt xác nhận là của Đạt → chụp lại mốc (T1.0b bước 3) rồi đi tiếp.

### T2.11 — Commit gốc mới, bỏ snapshot, repo private
- Steps:
  1. `gh repo view NgoDat2003/omnipos-finledger-hub > /dev/null 2>&1; echo $?` → khác `0`. Ra `0` → STOP, hỏi Đạt.
  2. Tạo lịch sử mới không chứa snapshot (index đã staged ở T2.10):
```bash
OLD=$(git branch --show-current)
git checkout --orphan hub-main
git commit -m "feat: bootstrap omnipos-finledger-hub skeleton on dedicated ports"
git branch -D "$OLD" && git branch -m hub-main main
git tag -d template-snapshot
```
  3. `gh repo create NgoDat2003/omnipos-finledger-hub --private --source . --remote origin --push`
- Verify: `git log --all --oneline | wc -l` → `1`; `git tag -l | wc -l` → `0`; `gh repo view NgoDat2003/omnipos-finledger-hub --json visibility -q .visibility` → `PRIVATE`; ở `D:/học/advance-be`: `git status --porcelain | grep -c omnipos-finledger-hub` → `0`.

## Success Criteria
- [x] Guard DB chặn URL sai; 3 secret sinh ngầm
- [x] B1–B5, S6–S10, K1–K2 pass trong 45 phút
- [x] G1–G5 pass; lịch sử 1 commit, không tag; repo `PRIVATE`

## Risk
| Rủi ro | Khả năng × Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Sót fallback cổng → đụng container công ty | Trung bình × Cao | T2.1; G1 trên toàn bộ file staged; G5 |
| Lệnh Prisma trỏ nhầm DB | Thấp × Cao | Guard trong `prisma.config.ts` |
| Snapshot nhãn cũ lọt lên remote | Thấp × Cao | Không push trước T2.11; orphan commit; xóa tag |

## Rollback
Trước T2.11: `docker compose down` (giữ volume), `git reset --hard template-snapshot`, rồi xóa file mới chưa track của phase này: `rm -rf apps/api/scripts/seed.ts apps/api/scripts/seed apps/api/scripts/assert-db-target.ts checks/lib checks/login.sh`. Sau T2.11: sửa bằng commit mới, không force-push.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.

Ghi chú: tín hiệu trong bảng fallback phase 1 (T1.6) là nhánh đã duyệt sẵn; G5 lệch là câu hỏi cho Đạt.
