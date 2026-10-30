---
phase: 3
title: "Dữ liệu nền + API đọc + stub ví/voucher + checks/"
status: pending
priority: P1
effort: "2.5h"
dependencies: [2]
owner: "executor"
---

# Phase 3: Dữ liệu nền, API đọc, stub, `checks/`

## Goal
`GET /stores` trả 300 quán, `GET /products` trả 77 món; 5 route ví/voucher trả 501 kèm `TODO(Đạt)`; `checks/smoke.sh` in toàn `PASS`.

Quy ước `HUB`, `OUT`, file guard, shell, RAM: bảng đầu phase 1. Helper `checks/lib/common.sh` (`API`, `OUT`, `JAR`, `read_env`, `psql_hub`, `kill_port`, `port_free`), `ensure-login.sh`, `protected-containers.sh` đã có từ phase 2. G1–G5 = phase 2 T2.10.

## Ranh giới học (bắt buộc)
- Phase này KHÔNG tạo model `Wallet`, `LedgerEntry`, `VoucherCampaign`, `VoucherSlot`. Đó là DDL Bài 07 của Đạt (phase 4).
- Service ví/voucher chỉ `throw new NotImplementedException('TODO(Đạt): ...')`.

## Files to Create / Modify
- Modify: `apps/api/prisma/schema.prisma`, `apps/api/scripts/seed.ts`, `apps/api/src/app.module.ts`, `apps/web/lib/api/generated/**` (chỉ qua `pnpm codegen`)
- Create: `apps/api/prisma/migrations/<timestamp>_add_stores_products/migration.sql` (do Prisma sinh), `apps/api/prisma/fixtures/northwind-products.json`, `apps/api/scripts/seed/seed-catalog.ts`, `apps/api/src/modules/stores/{stores.module,stores.controller,stores.service}.ts` + `dto/`, `apps/api/src/modules/products/{products.module,products.controller,products.service}.ts` + `dto/`, `apps/api/src/modules/wallets/{wallets.module,wallets.controller,wallets.service}.ts` + `dto/`, `apps/api/src/modules/vouchers/{vouchers.module,vouchers.controller,vouchers.service}.ts` + `dto/`, `checks/lib/burst.sh`, `checks/smoke.sh`, `checks/README.md`

## Tasks

### T3.1 — Model `Store`, `Product` (snake_case)
- Goal: 2 bảng `stores`, `products` có id `Int autoincrement`; tên bảng/cột snake_case để SQL tay ở M1 không phải bọc nháy.
- Target: `apps/api/prisma/schema.prisma`.
- Steps:
  1. Thêm 2 model (comment tiếng Việt):
     - `Store`: `id Int @id @default(autoincrement())`, `code String @unique` (dạng `S001`), `name String`, `createdAt DateTime @default(now()) @map("created_at")`, `@@map("stores")`.
     - `Product`: `id Int @id @default(autoincrement())`, `sourceId Int @unique @map("source_id")`, `name String`, `category String?`, `unitPrice Decimal @db.Decimal(10, 2) @map("unit_price")`, `unitsInStock Int @map("units_in_stock")`, `discontinued Boolean`, `@@map("products")`.
  2. Không đổi `User`, `AuthSession`, enum `Role` (đổi role là việc M3).
  3. `pnpm --filter api db:assert` → phải in `DB target OK` (không thì STOP). Rồi `pnpm --filter api exec prisma migrate dev --name add_stores_products`
  4. `pnpm --filter api prisma:generate` (Prisma 7 `migrate dev` không tự generate).
  5. Nếu Prisma hỏi reset hoặc báo drift → STOP, Failure Protocol. Không tự chạy `migrate reset`.
- Success criteria: 2 bảng tồn tại trên 5434.
- Verify: `source checks/lib/common.sh && psql_hub -c "select count(*) from information_schema.tables where table_name in ('stores','products')"` → `2`.

### T3.2 — Xuất 77 món northwind (chỉ đọc DB lab)
- Goal: fixture JSON commit được, không phụ thuộc DB lab khi boot máy khác.
- Target: `apps/api/prisma/fixtures/northwind-products.json`.
- Steps: chạy bằng **Bash tool** (PowerShell 5.1 thêm BOM khi redirect), từ `HUB`:
```bash
source checks/guard.local.sh && mkdir -p apps/api/prisma/fixtures && docker exec -e PGOPTIONS='-c default_transaction_read_only=on' "$LAB_PG_CONTAINER" psql -U postgres -d advance_be_lab -At -c "select json_agg(json_build_object('sourceId',p.product_id,'name',p.product_name,'category',c.category_name,'unitPrice',p.unit_price::numeric(10,2),'unitsInStock',p.units_in_stock,'discontinued',p.discontinued=1) order by p.product_id) from northwind.products p left join northwind.categories c using (category_id)" > apps/api/prisma/fixtures/northwind-products.json
```
  Đây là lệnh duy nhất executor chạy trên container PG lab (5433), trong phiên chỉ-đọc (`default_transaction_read_only=on`). Executor không bao giờ ghi vào 5433.
- Success criteria: JSON hợp lệ, 77 phần tử, không BOM.
- Verify: `node -e "const a=require('./apps/api/prisma/fixtures/northwind-products.json');console.log(a.length)"` → `77`; `head -c 3 apps/api/prisma/fixtures/northwind-products.json | od -An -tx1` → KHÔNG phải `ef bb bf`.

### T3.3 — Seed catalog (idempotent)
- Goal: 300 quán + 77 món; chạy seed 2 lần vẫn 300/77.
- Target: `apps/api/scripts/seed/seed-catalog.ts` (export `seedCatalog(prisma)`), `apps/api/scripts/seed.ts`.
- Steps:
  1. `seedCatalog`: tạo 300 store `code` = `S001`…`S300`, `name` = `Quán 001`…`Quán 300` bằng `prisma.store.createMany({ data, skipDuplicates: true })`.
  2. Đọc fixture bằng `fs.readFileSync` + `JSON.parse`, `prisma.product.createMany({ data, skipDuplicates: true })` (map `unitPrice` sang `new Prisma.Decimal(...)`).
  3. Log `Seeded catalog: <n> stores, <m> products` (số đếm sau seed).
  4. `scripts/seed.ts` gọi `seedCatalog` sau `seedAdminUser`.
- Success criteria: idempotent.
- Verify: chạy `pnpm --filter api seed` 2 lần; sau đó `psql_hub -c "select (select count(*) from stores)||'/'||(select count(*) from products)"` → `300/77`.

### T3.4 — API đọc `stores`, `products`
- Goal: 2 route đọc, sau `JwtAuthGuard` sẵn có (không `@Public()`).
- Target: module `stores`, `products` (cấu trúc theo `apps/api/src/modules/README.md`); `app.module.ts` (`imports`).
- Steps:
  1. Controller mỏng: `GET /stores` (`operationId: 'storesList'`), `GET /products` (`operationId: 'productsList'`). Trả toàn bộ, `orderBy: { id: 'asc' }`.
  2. DTO response + envelope `extends ApiResponseDto` theo README module. Service trả phần bên trong, không tự bọc.
  3. Module `exports: [StoresService]`, `exports: [ProductsService]` (Cụm 2 dùng lại).
  4. Đăng ký 2 module trong `AppModule.imports`.
- Success criteria: build qua.
- Verify: `pnpm --filter api check-types` → exit 0.

### T3.5 — Module `wallets`, `vouchers`: route + DTO + 501
- Goal: hợp đồng HTTP M1 có sẵn; mọi service trả 501.
- Target: `apps/api/src/modules/wallets/**`, `apps/api/src/modules/vouchers/**`, `app.module.ts`.
- Steps:
  1. DTO (class-validator):
     - `CreateTransferDto`: `fromWalletId` `@IsInt() @Min(1)`, `toWalletId` `@IsInt() @Min(1)`, `amount` `@IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()`. Thêm validator tự viết `@DifferentFrom('fromWalletId', { message: 'SAME_WALLET' })` trên `toWalletId` (file `wallets/dto/different-from.validator.ts`) → 400 `SAME_WALLET` ngay ở `ValidationPipe`, không đọc DB.
     - `CreateCampaignDto`: `name` `@IsString() @Length(1, 100)`, `totalSlots` `@IsInt() @Min(1) @Max(10000)`.
     - `ClaimVoucherDto`: `storeId` `@IsInt() @Min(1)`.
     - Ghi chú trong DTO: kiểu id ví có thể đổi theo DDL của Đạt ở phase 5.
  2. Route và service (mọi method `throw new NotImplementedException('TODO(Đạt): <mô tả>')`):

| Route | operationId | Message 501 |
|---|---|---|
| `POST /wallets/transfers` | `walletsTransfer` | `TODO(Đạt): chuyển tiền — khóa 2 ví, kiểm số dư trong transaction` |
| `GET /wallets/:id` | `walletsGet` | `TODO(Đạt): chờ DDL Bài 07` |
| `POST /vouchers/campaigns` | `vouchersCreateCampaign` | `TODO(Đạt): chờ DDL Bài 07` |
| `GET /vouchers/campaigns/:id` | `vouchersGetCampaign` | `TODO(Đạt): chờ DDL Bài 07` |
| `POST /vouchers/campaigns/:id/claims` | `vouchersClaim` | `TODO(Đạt): claim slot bằng SKIP LOCKED` |

  3. `:id` dùng `ParseIntPipe`. Swagger có `@ApiResponse` 201/409/501 cho 2 route ghi.
  4. Đăng ký 2 module trong `AppModule.imports`.
- Success criteria: build qua; không có model ví/voucher trong `schema.prisma`.
- Verify: `pnpm --filter api check-types` → exit 0; `grep -cE "model (Wallet|LedgerEntry|VoucherCampaign|VoucherSlot)" apps/api/prisma/schema.prisma` → `0`.

### T3.6 — `checks/`: burst + smoke
- Goal: công cụ "Bắn 30" dùng chung; smoke tự chấm PASS/FAIL.
- Target: `checks/lib/burst.sh`, `checks/smoke.sh`, `checks/README.md`.
- Steps:
  1. `burst.sh` định nghĩa hàm `burst NAME METHOD PATH BODIES_FILE`:
     - Mỗi dòng của `BODIES_FILE` là 1 body JSON (cho phép trộn nhiều chiều, ví dụ A→B và B→A).
     - Phát theo chỉ số, không đưa body JSON qua xargs (body có dấu nháy/khoảng trắng sẽ vỡ): `N=$(wc -l < "$BODIES_FILE")`; `seq 1 "$N" | xargs -d '\n' -P30 -I{} bash -c '<job> {}'`; job đọc body dòng thứ `{}` bằng `sed -n "{}p" "$BODIES_FILE"` rồi gửi bằng `--data-binary @-`. `bash -c` con không thấy biến chưa export → `export API JAR OUT BODIES_FILE` (và đường dẫn thư mục kết quả) trước khi gọi `xargs`.
     - Mỗi request ghi 2 file vào `$OUT/burst-NAME/`: `<i>.code` (từ `-w "%{http_code}"`) và `<i>.body`. Không in body ra stdout giữa chừng (tránh dòng in lẫn nhau).
     - Xóa thư mục `burst-NAME/` cũ trước khi bắn.
     - Sau khi xong, in bảng tóm tắt: mỗi request một dòng `<code> <message>` (message lấy từ `"message":"..."` nếu có), qua `sort | uniq -c`. Ví dụ đúng định dạng: `      5 201` và `     25 409 INSUFFICIENT_FUNDS`.
     - Dùng `-b "$JAR"`, `-H "Content-Type: application/json"`. Không gửi `Origin`.
  2. `smoke.sh`: `source` common + `bash checks/login.sh`; in 1 dòng `PASS|FAIL <tên>` cho từng kiểm; exit 1 nếu có FAIL:
     - `health`: `GET /health` → 200.
     - `stores`: `GET /stores` → đếm `data.length` bằng `node -e` → 300.
     - `products`: tương tự → 77.
     - `transfer-501`: `POST /wallets/transfers` body hợp lệ → 501 và body chứa `TODO(Đạt)`.
  3. `checks/README.md` (tiếng Việt, ngắn): mọi lệnh chạy trong cửa sổ **Git Bash**; cách bật API có log (`pnpm --filter api build` rồi `cd apps/api && node dist/src/main.js > ../../checks/out/api.log 2>&1`), `bash checks/login.sh` 1 lần mỗi lượt (login giới hạn 5/phút), `bash checks/smoke.sh`, ý nghĩa `checks/out/` (bị gitignore).
  4. `chmod +x checks/*.sh checks/lib/*.sh`.
- Success criteria: cú pháp hợp lệ.
- Verify: `bash -n checks/lib/burst.sh && bash -n checks/smoke.sh` → exit 0. Kiểm chức năng của `burst` nằm ở T3.8 bước 4 (cần API chạy).

### T3.7 — Codegen + type check web
- Goal: client web khớp route mới.
- Steps: PG phải `healthy`. `pnpm codegen` rồi `cd apps/web && pnpm exec tsc --noEmit`.
- Success criteria: generated có hook mới.
- Verify: cả 2 exit 0; `grep -rlE "storesList|walletsTransfer" apps/web/lib/api/generated | wc -l` → ≥ 1.
- Không chạy `next dev` ở phase này (RAM). Trang login đã kiểm ở S9 phase 2. Không thêm trang web mới ở phase này.

### T3.8 — Chạy smoke trên API thật
- Steps:
  1. `pnpm --filter api build`.
  2. Bash tool `run_in_background`: `cd apps/api && node dist/src/main.js > ../../checks/out/api.log 2>&1`; chờ `/health` 200 (tối đa 30 s).
  3. `bash checks/smoke.sh`.
  4. Kiểm chức năng burst: ghi 3 dòng body hợp lệ `{"fromWalletId":1,"toWalletId":2,"amount":1000}` vào `$OUT/burst-probe-bodies.txt`; `source checks/lib/common.sh && source checks/lib/burst.sh && burst probe POST /wallets/transfers "$OUT/burst-probe-bodies.txt"`.
  5. Thử SAME_WALLET: `curl -s -b "$JAR" -H "Content-Type: application/json" --data-binary '{"fromWalletId":1,"toWalletId":1,"amount":1000}' -w ' %{http_code}' http://127.0.0.1:3101/wallets/transfers`.
  6. `kill_port 3101 && port_free 3101`.
- Success criteria: 4 dòng PASS; burst trả 501 (không phải 400 → body không vỡ); không còn node trên 3101.
- Verify: `bash checks/smoke.sh` → exit 0, đúng 4 dòng bắt đầu bằng `PASS`; bước 4 in đúng 1 dòng tóm tắt bắt đầu bằng `3 501`; bước 5 có `SAME_WALLET` và kết thúc bằng ` 400`; bước 6 exit 0.

### T3.9 — Commit + push
- Steps:
  1. Chạy lại G1–G5 ở phase 2 T2.10 (sau `git add -A`).
  2. `git commit -m "feat: add store and product catalog, wallet and voucher stubs, check scripts"`
  3. `git push`.
- Success criteria: G1–G5 pass; push xong.
- Verify: `git status --porcelain` → không in gì; `git rev-list --count @{u}` → `2`.

## Success Criteria (khớp AC hợp đồng khung)
- [x] `/health` trên 3101 → 200
- [x] Login có cookie `app_access_token`
- [x] `GET /stores` 300, `GET /products` 77
- [x] `POST /wallets/transfers` → 501, message có `TODO(Đạt)`
- [x] G1–G5 pass; không còn node trên 3100/3101; chỉ `omnipos-hub-pg` của hub còn Up

## Risk
| Rủi ro | Khả năng × Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Export northwind có BOM → JSON.parse lỗi | Trung bình × Thấp | Chỉ dùng Bash tool; kiểm `od` |
| `migrate dev` đòi reset vì drift | Thấp × Cao | STOP; không reset khi chưa hỏi Đạt |
| Request trong burst in lẫn dòng | Trung bình × Trung bình | Mỗi request ghi file riêng, tóm tắt sau |

## Rollback
`git revert` commit của phase này; migration: hỏi Đạt rồi Đạt tự chạy `pnpm --filter api db:reset` (executor không chạy lệnh reset).

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
