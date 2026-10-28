---
phase: 5
title: "Tích hợp M1 sau DDL: Prisma, seed ví, API đọc, naive, khung transaction, checks/m1 (UI tùy chọn)"
status: pending
priority: P1
effort: "4h"
dependencies: [4]
owner: "executor"
---

# Phase 5: Tích hợp M1 sau DDL

## Goal
Bảng của Đạt lên 5434 qua migration, ràng buộc khớp 100% file của Đạt; seed 301 ví cân sổ; API đọc ví/campaign chạy; transfer có bản naive đo được, bản `locked` và claim còn 501 `TODO(Đạt)`; `checks/m1` sẵn sàng. UI (T5.12) là tùy chọn, ngoài AC.

Quy ước `HUB`, `OUT`, file guard, shell, RAM: phase 1. `<cột ...>` = tên lấy từ PART A của `docs/design/bai07-ddl.sql`.

## Ranh giới học (bắt buộc)
- Không viết SQL khóa (`FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`, `SKIP LOCKED`, `NOWAIT`, advisory lock). Chữ "SKIP LOCKED" chỉ được nằm trên dòng có `TODO(Đạt)`.
- Không viết kiểm số dư hay ghi bút toán của bản `locked`; không viết chọn slot/gán slot của claim.
- Không thêm/đổi cột, CHECK, UNIQUE so với file của Đạt. DDL thiếu thứ endpoint cần → STOP, hỏi Đạt 1 câu, chờ Đạt sửa file.
- Không đọc bảng "M1 bảng" trong brainstorm hợp đồng B (đáp án Bài 07).

## Files to Create / Modify
- Modify: `apps/api/prisma/schema.prisma`, `apps/api/src/prisma/prisma.service.ts`, `apps/api/src/config/env.schema.ts`, `.env.example`, `apps/api/.env`, `apps/api/src/common/filters/http-exception.filter.ts`, `apps/api/scripts/seed.ts`, `apps/api/src/modules/wallets/**`, `apps/api/src/modules/vouchers/**`, `checks/README.md`, `checks/smoke.sh`
- Create: `apps/api/prisma/migrations/<ts>_m1_wallet_ledger_voucher/migration.sql`, `apps/api/src/common/database/transaction-options.ts`, `apps/api/src/common/database/sql-state.ts`, `apps/api/src/common/todo-dat.ts`, `apps/api/scripts/seed/seed-wallets.ts`, `checks/sql/m1-reconcile.sql`, `checks/sql/compare-constraints.sql`, `checks/m1/{lib-wallets,overdraw,cross,voucher,one-transfer,pg-locks-drill,pre-reset-check,reconcile,run-all}.sh`, `checks/m1/pg-locks-guide.md`, `apps/web/app/{wallets,vouchers}/page.tsx`, `apps/web/features/{wallets,vouchers}/**`

## Tasks

### T5.0 — Chọn biến thể kiểu id (đọc PART A, không hỏi lại)
| Kiểu id trong PART A | DTO | Pipe cho `:id` | JSON trả ra |
|---|---|---|---|
| `integer`/`serial`/identity int | `@IsInt() @Min(1)` | `ParseIntPipe` | number |
| `bigint`/`bigserial`/identity bigint | `@IsNumberString()` → `BigInt(x)` | pipe tự viết `ParseBigIntPipe` (`^[1-9]\d*$`, sai → 400) | **string** |
| `uuid` | `@IsUUID()` | `ParseUUIDPipe` | string |
- Áp cho id ví, id campaign, `transferId`. `storeId` giữ `Int` (bảng của AI).
- Mọi giá trị `BigInt` trả ra API (id, `transferId`, số dư nếu bigint, `count(*)` từ `$queryRaw`) đổi thành string. Không dùng `BigInt.prototype.toJSON` toàn cục.
- Ghi biến thể đã chọn vào `OUT/m1-id-variant.txt`.
- Verify: `test -s "$OUT/m1-id-variant.txt"`; kiểm thật ở T5.10 (V2, V6).

### T5.1 — Dịch PART A sang `schema.prisma`
- Steps: đọc PART A (`sed -n '/^-- PART A:/,/^-- PART B:/p' docs/design/bai07-ddl.sql`); mỗi bảng → model (`Wallet`, `LedgerEntry`, `VoucherCampaign`, `VoucherSlot`) + `@@map`, mỗi cột `@map`, theo bảng:

| SQL trong PART A | Prisma |
|---|---|
| `serial`/identity (int, bigint) | `Int`/`BigInt` `@id @default(autoincrement())` |
| `uuid` | `String @db.Uuid` |
| `numeric(p,s)` | `Decimal @db.Decimal(p, s)` |
| `timestamptz` / `timestamp` | `DateTime @db.Timestamptz(6)` / `@db.Timestamp(6)` |
| `text` / `varchar(n)` | `String` / `String @db.VarChar(n)` |
| `CREATE TYPE ... AS ENUM` | `enum X { ... @@map("<tên type>") }` |
| Mọi `DEFAULT <expr>` trừ serial/identity | `@default(dbgenerated("<expr đúng chữ PART A>"))` (để `column_default` khớp) |
| FK | `@relation(..., onDelete: X, onUpdate: Y)` ghi tường minh; FK trần = `NoAction` cả 2 |
| NULL / NOT NULL | `?` / bắt buộc |
| UNIQUE / INDEX thường | `@unique` / `@@unique` / `@@index` |
| CHECK, index có `WHERE` hoặc biểu thức | ghi lại, chép tay ở T5.2 |
- Thêm field quan hệ ngược ở `Store`.
- Verify: `pnpm --filter api exec prisma validate` → exit 0.

### T5.2 — Migration `--create-only` + chép CHECK + so khớp 4 chiều
- Steps:
  1. `pnpm --filter api db:assert` → `DB target OK` (không thì STOP).
  2. `pnpm --filter api exec prisma migrate dev --create-only --name m1_wallet_ledger_voucher`
  3. Cuối `migration.sql`: comment `-- Chép nguyên văn từ docs/design/bai07-ddl.sql (Prisma không biểu diễn được)`, rồi từng CHECK (`ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)`, biểu thức giữ nguyên chữ) và từng index đặc biệt.
  4. `pnpm --filter api exec prisma migrate dev` (áp), chạy lần 2, rồi `pnpm --filter api prisma:generate`. Prisma đòi reset/báo drift → STOP.
  5. `checks/sql/compare-constraints.sql`: dòng đầu `SET search_path TO :"ns";`; 4 query, chỉ 4 bảng M1, lấy tên bảng từ `pg_class.relname`, `order by` mọi cột:
     - (a) CHECK: `relname || ' ' || pg_get_constraintdef(oid)` với `contype='c'`, `connamespace = :'ns'::regnamespace`
     - (b) Index: `tablename || ' ' || regexp_replace(indexdef, '^CREATE (UNIQUE )?INDEX \S+ ON \S+ ', '\1')` từ `pg_indexes` với `schemaname = :'ns'`
     - (c) FK: như (a) với `contype='f'`
     - (d) Cột: `table_name, column_name, data_type, numeric_precision, numeric_scale, is_nullable`, và `case when is_identity='YES' or column_default like 'nextval(%' then '<autoinc>' else column_default end` từ `information_schema.columns` với `table_schema = :'ns'`
  6. Dựng bản của Đạt rồi so (mỗi lệnh 1 lần gọi riêng):
```bash
{ echo '\set ON_ERROR_STOP on'; echo 'DROP SCHEMA IF EXISTS lab07_replay CASCADE; CREATE SCHEMA lab07_replay; SET search_path TO lab07_replay;'; echo 'CREATE TABLE stores (id serial PRIMARY KEY, name text NOT NULL);'; sed -n '/^-- PART A:/,/^-- PART B:/p' docs/design/bai07-ddl.sql; } | docker exec -i omnipos-hub-pg psql -U postgres -d omnipos_hub -q
docker exec -i omnipos-hub-pg psql -U postgres -d omnipos_hub -q -At -v ns=lab07_replay < checks/sql/compare-constraints.sql > "$OUT/constraints-dat.txt" 2>&1
docker exec -i omnipos-hub-pg psql -U postgres -d omnipos_hub -q -At -v ns=public < checks/sql/compare-constraints.sql > "$OUT/constraints-hub.txt" 2>&1
docker exec -i omnipos-hub-pg psql -U postgres -d omnipos_hub -q -c 'DROP SCHEMA lab07_replay CASCADE'
```
- Verify: lần `migrate dev` thứ 2 in `Already in sync`; `test -s "$OUT/constraints-dat.txt"`; `diff "$OUT/constraints-hub.txt" "$OUT/constraints-dat.txt"` → không in gì. Có diff → **STOP, gửi Đạt bản diff và hỏi** (không tự sửa cho khớp).

### T5.3 — Hạ tầng DB dùng chung
| File | Việc |
|---|---|
| `env.schema.ts` | `DB_POOL_MAX` (`z.coerce.number().int().min(1).default(20)`), `M1_IMPL` (`z.enum(['naive','locked']).default('locked')`), `M1_TX_TIMEOUT_MS` (`z.coerce.number().int().min(1000).default(5000)`) |
| `.env.example`, `apps/api/.env` | `DB_POOL_MAX=20`, `M1_IMPL=locked`, `M1_TX_TIMEOUT_MS=5000` (comment: đổi phải restart API) |
| `prisma.service.ts` | Inject `ConfigService<AppEnv, true>`; `new PrismaPg({ connectionString: process.env.DATABASE_URL, max: config.get('DB_POOL_MAX', { infer: true }) })`. Nguồn duy nhất là `env.schema.ts` |
| `common/database/transaction-options.ts` | `buildM1TxOptions(timeoutMs: number)` → `{ maxWait: 5000, timeout: timeoutMs, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }`; comment: SRS NFR-04; pool 20 < `max_connections` 50. Tên enum trong client 7.9 `[UNVERIFIED]` — sai thì `check-types` báo, dùng chuỗi `'ReadCommitted'` |
| `common/database/sql-state.ts` | Chỉ 1 hàm `sqlState(e)`: `e instanceof Prisma.PrismaClientKnownRequestError` → `e.meta?.driverAdapterError?.cause?.originalCode` (mẫu ở `research/researcher-02-prisma-postgres-checks.md`), không thì `undefined` |
| `common/todo-dat.ts` | `todoDat(what: string): never` → `throw new NotImplementedException('TODO(Đạt): ' + what)` |
| `http-exception.filter.ts` | Nhánh không phải `HttpException`: `Logger.error('Unhandled error SQLSTATE=<sqlState ?? "-"> prisma=<code ?? "-">')` trước khi trả 500; không lộ message/stack |
- Không map P2028 (503 vẫn là 5xx); pool 20 + `maxWait` 5000 là cách tránh.
- Verify: `pnpm --filter api check-types` → exit 0; `DB_POOL_MAX=0 node -e "require('./apps/api/dist/src/config/env.schema').validateEnv(process.env)"` sau `pnpm --filter api build` → exit ≠ 0 **và** stderr có chữ `DB_POOL_MAX` (path sai cũng exit ≠ 0 nên phải có chữ này).

### T5.4 — Seed ví cân sổ
- Target: `scripts/seed/seed-wallets.ts` (`seedWallets(prisma)`), gọi sau `seedCatalog` trong `scripts/seed.ts`.
- Steps: đã có ví → log `Seeded wallets: skip`. Ngược lại trong 1 `$transaction(..., { timeout: 60000 })`: tạo TREASURY; 300 ví quán (số dư 0); `createMany` 600 bút toán (mỗi quán 1 nhóm: TREASURY −1.000.000, quán +1.000.000); đặt số dư quán 1.000.000, TREASURY −300.000.000. Log `Seeded wallets: 301 wallets, 600 entries`.
- Verify: `pnpm --filter api seed` exit 0; `psql_hub -c "select count(*) from wallets"` → `301`; `psql_hub -c "select sum(<cột số dư>) = 0 from wallets"` → `t`.

### T5.5 — Module `wallets`
- `GET /wallets/:id` → `{ id, storeId, balance, ledgerSum }`; không có → 404 `WALLET_NOT_FOUND`.
- `POST /wallets/transfers`: `SAME_WALLET` đã chặn ở DTO (phase 3). Rẽ nhánh theo `M1_IMPL` (`ConfigService`). `onModuleInit` log `M1_IMPL=<mode> M1_TX_TIMEOUT_MS=<n>`. `txOptions = buildM1TxOptions(M1_TX_TIMEOUT_MS)`. Trả 201 `{ transferId }`.
- `transferNaive` (comment đầu: `BẢN NAIVE — CỐ Ý SAI (Bài 12 #2: lost update). Chỉ để đo số "trước".`): đọc 2 ví ngoài transaction, không khóa (không thấy → 404 `WALLET_NOT_FOUND`); thiếu → `insufficientFunds()`; rồi `$transaction(…, txOptions)` ghi 2 bút toán và **gán số dư bằng giá trị tuyệt đối tính ở JS** (không `increment`/`decrement`, không `balance = balance - x`).
- `transferLocked`: không đọc gì ngoài transaction. Viết đúng khung:
```ts
// Bản chính. Đạt viết các khối TODO (≤ 15 dòng) ở phase 6.
private async transferLocked(dto: CreateTransferDto) {
  try {
    return await this.prisma.$transaction(async (tx) => {
      // TODO(Đạt) 1: thay dòng dưới bằng câu khóa 2 ví theo bất biến I-07 qua tx.$queryRaw; trả mảng dòng ví đã khóa
      const locked: Array<Record<string, unknown>> = todoDat('khóa 2 ví theo I-07');
      if (locked.length !== 2) throw new NotFoundException('WALLET_NOT_FOUND'); // AI: không đủ 2 ví → 404
      // TODO(Đạt) 2: kiểm số dư ví nguồn bên trong transaction; thiếu thì throw insufficientFunds()
      // TODO(Đạt) 3: ghi 2 bút toán và cập nhật số dư, mọi lệnh qua tx (I-01, I-02); trả { transferId }
      return todoDat('kiểm số dư, ghi bút toán');
    }, this.txOptions);
  } catch (e) {
    if (sqlState(e) === '23514') {
      this.logger.warn('SQLSTATE=23514 -> INSUFFICIENT_FUNDS');
      throw insufficientFunds();
    }
    throw e;
  }
}
```
- Helper cùng file: `insufficientFunds()` → `new ConflictException('INSUFFICIENT_FUNDS')`.
- Verify: `pnpm --filter api check-types` → exit 0.

### T5.6 — Module `vouchers`
- `POST /vouchers/campaigns`: 1 `$transaction`: tạo campaign, rồi `tx.$executeRaw` sinh `totalSlots` slot bằng `generate_series(1, ${totalSlots})` (slot chưa có chủ). Trả 201 `{ id, name, totalSlots }`.
- `GET /vouchers/campaigns/:id` → `{ id, name, totalSlots, claimed }`; không có → 404 `CAMPAIGN_NOT_FOUND`.
- `POST /vouchers/campaigns/:id/claims` — không đọc gì ngoài transaction. Khung:
```ts
try {
  return await this.prisma.$transaction(async (tx) => {
    // TODO(Đạt) 1: thay dòng dưới bằng câu lấy 1 slot trống của campaign, bỏ qua slot đang khóa (SKIP LOCKED), qua tx.$queryRaw
    const slots: Array<Record<string, unknown>> = todoDat('lấy 1 slot trống');
    if (slots.length === 0 && (await tx.voucherCampaign.count({ where: { id: campaignId } })) === 0)
      throw new NotFoundException('CAMPAIGN_NOT_FOUND'); // AI: 0 dòng vì campaign không tồn tại → 404
    // TODO(Đạt) 2: không còn slot → throw soldOut()
    // TODO(Đạt) 3: gán slot cho dto.storeId qua tx (unique của bạn chặn claim trùng → 23505); trả slot đã claim
    return todoDat('hết slot, gán slot');
  }, this.txOptions);
} catch (e) {
  if (sqlState(e) === '23505') {
    this.logger.warn('SQLSTATE=23505 -> ALREADY_CLAIMED');
    throw new ConflictException('ALREADY_CLAIMED');
  }
  throw e;
}
```
- Helper `soldOut()` → `new ConflictException('SOLD_OUT')`.
- Verify: `pnpm --filter api check-types` → exit 0.

### T5.7 — SQL đối soát
- `checks/sql/m1-reconcile.sql`: 1 `SELECT ... UNION ALL`, mỗi nhánh trả dòng vi phạm kèm nhãn: I-01 (nhóm transfer ≠ 2 bút toán hoặc tổng ≠ 0), I-02 (số dư ≠ tổng bút toán), I-03 (ví quán âm), I-04 (tổng số dư ≠ 0), I-06 (claimed > total; 1 quán > 1 slot/campaign). `checks/m1/reconcile.sh` in đúng 1 con số, dòng chi tiết ghi `OUT/reconcile.txt`. I-05, I-07 kiểm bằng rà code + log (ghi trong `checks/README.md`).
- Verify: `bash checks/m1/reconcile.sh` → `0`.

### T5.8 — `checks/m1` (chạy trong Git Bash)
| File | Hành vi | In ra |
|---|---|---|
| `lib-wallets.sh` | `wallet_of_store S`, `treasury_wallet` in id dạng **JSON literal** (int không nháy; bigint/uuid có nháy); `balance_of W` | 1 giá trị |
| (mọi script dưới) | `source checks/lib/common.sh`, `checks/lib/burst.sh`, `checks/lib/ensure-login.sh` | — |
| `overdraw.sh [C=1] [D=2]` | C phải đúng 1.000.000, không thì `SKIP: ví C không còn 1.000.000` exit 2; 30 body C→D 200.000 | bảng `uniq -c`, `C=<số dư>`, `reconcile=<n>` |
| `cross.sh [A=3] [B=4]` | Đếm `40P01` trong `OUT/api.log` trước; 15 A→B + 15 B→A, 10.000 | bảng, `A_back=yes/no`, `B_back=yes/no`, `40P01_new=<n>` |
| `voucher.sh [FIRST=11] [RECLAIM=200]` | (1) campaign 10 slot, 30 quán FIRST…FIRST+29 bắn cùng lúc; (2) campaign **thứ 2** 5 slot: quán RECLAIM claim → rồi claim lại | bảng (1), `claimed=<n>/10`, `db_claimed=<n>`, `reclaim_first=<code>`, `reclaim_again=<code> <message>`, `c2_claimed=<n>/5` |
| `one-transfer.sh FROM TO AMOUNT` | 1 request | `<code> <message>` |
| `pg-locks-drill.sh [A=3] [B=4]` | Yêu cầu log có `M1_TX_TIMEOUT_MS=15000`. Chạy `one-transfer.sh A B 10000` nền; mỗi 0,5 s chạy `select pid, locktype, relation::regclass, mode from pg_locks where not granted` tối đa 10 s; thấy dòng → in và nhắc "COMMIT trong DBX ngay"; chờ request nền | các dòng chưa granted, `not_granted=<n>`, `transfer=<code>` |
| `pre-reset-check.sh` | `port_free 3101` và `select count(*) from pg_stat_activity where state='idle in transaction'` = 0 | `READY_FOR_RESET` exit 0, hoặc lý do exit 1 |
| `run-all.sh` | `login.sh` → overdraw → cross → voucher → reconcile | gộp output |
| `pg-locks-guide.md` | DBX tab 1 (5434): mở transaction, tự khóa dòng ví A **bằng câu Đạt đã dùng ở Bài 14 khi thấy `granted = f`** (không in câu đó) → Git Bash: `bash checks/m1/pg-locks-drill.sh` → thấy dòng → COMMIT tab 1. API phải bật với `M1_TX_TIMEOUT_MS=15000`, xong bật lại với 5000 | — |
- Verify: `for f in checks/m1/*.sh; do bash -n "$f" || echo BAD $f; done` → không in `BAD`.

### T5.10 — Chạy kiểm phase 5
Bật API như phase 3 T3.8 (`M1_IMPL=locked` từ `.env`), rồi:
| # | Lệnh | Pass |
|---|---|---|
| V1 | `grep -c "M1_IMPL=locked M1_TX_TIMEOUT_MS=5000" checks/out/api.log` | ≥ 1 |
| V2 | `source checks/m1/lib-wallets.sh; curl -s -b checks/out/cookies.txt http://127.0.0.1:3101/wallets/$(wallet_of_store 1 \| tr -d '"')` | `balance` = `ledgerSum` = 1000000; id đúng kiểu JSON của T5.0 |
| V3 | `bash checks/m1/reconcile.sh` | `0` |
| V4 | `bash checks/m1/one-transfer.sh 1 2 1000` | `501` và `TODO(Đạt)` |
| V5 | Tạo campaign `{"name":"probe","totalSlots":10}`, `GET` nó, rồi claim `{"storeId":11}` | 201; `claimed` 0/10; claim → `501` + `TODO(Đạt)` |
| V6 | `GET /wallets/<id không tồn tại>`, `GET /vouchers/campaigns/<id không tồn tại>` | 404 `WALLET_NOT_FOUND`, 404 `CAMPAIGN_NOT_FOUND` |
| V7 | Tắt API; bật `M1_IMPL=naive node dist/src/main.js > ../../checks/out/api.log 2>&1`; `bash checks/m1/overdraw.sh 290 291` | log có `M1_IMPL=naive`; số `201` > 5 |
| V8 | `bash checks/m1/reconcile.sh` | ≥ 1 (đối soát bắt được sổ lệch) |
| V9 | `kill_port 3101 && port_free 3101` | exit 0 |
- Sau V7 ví 290/291 lệch; phase 6 bắt đầu bằng reset do Đạt chạy. Executor không reset.

### T5.11 — Chặn rò đáp án + commit
- Verify (từ `HUB`, sau `git add -A`):
```bash
git grep --cached -niE 'for (no key )?update|skip locked|for (key )?share|nowait|advisory' -- apps checks docs | grep -v 'TODO(Đạt)'   # không in gì
git grep --cached -c 'TODO(Đạt)' -- apps/api/src/modules/wallets/wallets.service.ts apps/api/src/modules/vouchers/vouchers.service.ts  # mỗi file ≥ 3
```
  Cộng G1–G5 (phase 2 T2.10). Rồi `git commit -m "feat: add wallet ledger and voucher schema, naive transfer and m1 checks"` và `git push`.

### T5.12 — (Tùy chọn) UI ví và voucher — chỉ làm nếu 30/10 xong sớm
- Không thuộc AC nào; bỏ qua không ảnh hưởng phase 6. Làm sau T5.11, commit riêng.
- `/wallets`: nhập id ví → số dư + `ledgerSum`; form chuyển; nút "Bắn 30" (`Promise.allSettled` 30 lần hàm Orval) + bộ đếm theo mã. `/vouchers`: tạo campaign, `claimed/total`, "Bắn 30" claim quán 11–40. Mỗi trang ghi: "Trình duyệt chỉ chạy ~6 request cùng lúc; nghiệm thu dùng cURL (ADR-005)". Theo `.agent/projectRules/frontend-architecture.md`; chỉ dùng code Orval (`pnpm codegen` trước).
- Verify: `cd apps/web && pnpm exec tsc --noEmit` → exit 0; `pnpm --filter web dev` nền → `http://127.0.0.1:3100/wallets`, `/vouchers` → `200` (≤ 180 s); `kill_port 3100 && port_free 3100`; G1–G5; `git commit -m "feat: add wallet and voucher demo pages"` và `git push`.

## Success Criteria
- [ ] `Already in sync`; 4 chiều (CHECK, index, FK, cột) hub = Đạt
- [ ] 301 ví, tổng số dư 0, đối soát 0 trước naive
- [ ] `locked`/claim → 501 `TODO(Đạt)`; 404 đúng mã; naive > 5×201 và đối soát ≥ 1
- [ ] Không SQL khóa ngoài dòng `TODO(Đạt)`; không node trên 3100/3101

## Risk
| Rủi ro | Khả năng × Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Executor lỡ viết SQL khóa | Trung bình × Cao | Khung cố định T5.5/T5.6; grep T5.11 |
| Prisma đổi ngầm ngữ nghĩa (FK action, default) | Trung bình × Cao | Bảng map T5.1; so 4 chiều T5.2 |
| BigInt làm `JSON.stringify` ném lỗi | Trung bình × Trung bình | Biến thể T5.0; V2, V6 |

## Rollback
`git revert` commit phase này. DB: Đạt tự chạy `pnpm --filter api db:reset` sau `pre-reset-check.sh` (executor hỏi, không tự chạy).

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

Ghi chú: diff ràng buộc ở T5.2 và DDL thiếu thứ cần dùng là câu hỏi cho Đạt, không phải Failure Protocol.
