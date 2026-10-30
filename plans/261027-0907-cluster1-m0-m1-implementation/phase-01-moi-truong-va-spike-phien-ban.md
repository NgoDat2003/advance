---
phase: 1
title: "Môi trường + snapshot template + spike phiên bản (không DB, không cổng)"
status: pending
priority: P1
effort: "Đạt 0.5–1h (Node, Docker) · executor 1h"
dependencies: []
owner: "Đạt (T1.1, T1.0b) + executor (T1.0, T1.3–T1.6)"
---

# Phase 1: Môi trường + snapshot template + spike phiên bản

## Goal
Shell chạy Node 24.22.1 qua nvm 2.0 shim (Node 22 MSI ở `C:\Program Files\nodejs` giữ lại chỉ cho hook), hub có commit snapshot template để lùi, Docker và container của Đạt đã được chụp mốc, bộ phiên bản ADR-019 qua spike S1–S5 (không DB, không mở cổng).

## Quy ước dùng chung cho mọi phase
| Tên | Giá trị |
|---|---|
| `HUB` | `D:/học/advance-be/omnipos-finledger-hub` (bị `.gitignore` của advance-be loại) |
| `OUT` | `$HUB/checks/out` — mọi snapshot, log, kết quả đo. Bị loại khỏi git của hub (T1.0 thêm vào `.gitignore` của hub trước commit snapshot). **Không ghi gì vào advance-be: advance-be là repo PUBLIC** |
| File guard | `$HUB/checks/guard.local.sh` do Đạt tạo (T1.0b), ghi tường minh vào `.gitignore` của hub ở T1.0. Tên không chứa chuỗi env vì hook privacy chặn mọi lệnh có tên file dạng env. Chứa 3 dòng `export`: `COMPANY_CONTAINERS_REGEX` (container dự án công ty, cổng 3000/3001), `LAB_PG_CONTAINER` (container PG lab, 5433), `LEAK_REGEX` (mọi tên không được lộ: container công ty, container PG lab, nhãn khách hàng cũ, tên file UI cũ). Đặt trong shell, không commit. Mọi shell của executor chạy `source "$HUB/checks/guard.local.sh"` trước |
| Shell | Executor: **Bash tool (Git Bash)**, mỗi shell mở đầu bằng `export HUB="D:/học/advance-be/omnipos-finledger-hub" OUT="D:/học/advance-be/omnipos-finledger-hub/checks/out"`. Đạt chạy `checks/` trong cửa sổ **Git Bash** |
| Cấm đụng | container dự án công ty (3000/3001), container PG lab (5433 — chỉ đọc, chỉ ở T3.2), `advance-be-redis`; cổng 3000, 3001, 5433, 6379 |
| Bí mật | Không in mật khẩu, secret, `DATABASE_URL`; không commit `.env` |
| RAM | Mỗi lúc 1 bước nặng. Node do executor bật phải tắt theo PID (`taskkill //PID <pid> //T //F`), không tắt theo tên image |

## Files to Create / Modify
- Create: `HUB/.nvmrc`, `OUT/docker-before.txt`, `OUT/protected-before.txt`, `OUT/spike-results.md`, `OUT/lock-review.txt`
- Modify: `HUB/package.json`, `HUB/apps/api/package.json`, `HUB/apps/web/package.json`, `HUB/pnpm-workspace.yaml`, `HUB/pnpm-lock.yaml` (pnpm sinh), `HUB/.gitignore`

## Tasks
Thứ tự chạy: **T1.1 (trước khi mở phiên executor) → T1.0 → T1.0b → T1.3 → T1.4 → T1.5 → T1.6**.

### T1.1 — Node 24 qua nvm 2.0 (shim), giữ MSI cho hook (Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm)
- Hiện trạng (kiểm 28/10): máy chạy **nvm for Windows 2.0.0 ở chế độ shim** — `nvm.exe` nằm dưới `%LOCALAPPDATA%\Author Software\nvm`, `NVM_HOME`/`NVM_SYMLINK` không đặt, không có tùy chọn đường dẫn symlink. Node 22.18 cài bằng MSI ở `C:\Program Files\nodejs`. Mọi hook của Claude gọi cứng `C:/Program Files/nodejs/node.exe`. `%APPDATA%\npm` còn pnpm@9 global.
- Cách làm (Đạt chốt 28/10 sau kongming): **giữ** thư mục MSI cho hook, bỏ nó khỏi PATH máy để shell dùng shim của nvm. Làm ngoài phiên Claude Code, ~30 phút. Đổi PATH Machine là đổi cho cả máy; dự án khác cần Node 22 thì `nvm install 22.18.0 && nvm use 22.18.0`.
- Nhiệm vụ của Đạt:
  1. **Giữ** Node MSI và thư mục `C:\Program Files\nodejs` (hook cần).
  2. PowerShell quyền Admin: xóa `C:\Program Files\nodejs\` khỏi PATH **Machine** (System Properties → Environment Variables). Bảo đảm thư mục shim của nvm đứng **trước** `%APPDATA%\npm` (pnpm@9 cũ ở đó không được che pnpm mới).
  3. Shell mới: `nvm install 24.22.1` rồi `nvm use 24.22.1`.
  4. `corepack enable`, rồi `corepack prepare pnpm@11.2.2 --activate`.
  5. Kiểm dưới ra sai → `nvm doctor` để sửa, rồi kiểm lại.
  6. Mở lại Claude Code (shell của executor giữ PATH lúc khởi động).
- Success criteria: shell dùng Node 24 + pnpm 11.2.2; hook vẫn dùng Node 22 của MSI.
- Verify (executor, Bash tool, sau khi phiên mới mở):
```bash
node -v                                   # v24.22.1
pnpm -v                                   # 11.2.2
"C:/Program Files/nodejs/node.exe" -v     # v22.18.0 (chỉ hook dùng)
```
- Đạt thấy đúng ở terminal mới nhưng executor ra khác → khởi động lại phiên Claude Code rồi chạy lại Verify. Executor không sửa PATH.

### T1.0 — Snapshot template trong git của hub (executor, việc đầu tiên)
- Goal: có commit gốc để mọi rollback phase 1–2 dùng `git reset --hard`.
- Steps (từ `HUB`):
  1. `git ls-files --others --exclude-standard | grep -E '(^|/)\.env$'` → phải rỗng.
  2. `printf '\n# output cục bộ và file guard, không commit\nchecks/out/\nchecks/guard.local.sh\n' >> .gitignore && mkdir -p checks/out` (không ghi vào thư mục `.git/`: hook scout chặn đường dẫn đó)
  3. `git add -A && git commit -m "chore: import template snapshot"`
  4. `git tag template-snapshot` (tag cục bộ, **không bao giờ push**: snapshot còn nhãn khách hàng cũ; T2.11 bỏ nó khỏi lịch sử).
- Success criteria: 1 commit, có tag, `checks/out/` và file guard bị loại.
- Verify: `git rev-list --count HEAD` → `1`; `git tag -l template-snapshot` → `template-snapshot`; `git check-ignore -q checks/out/x && git check-ignore -q checks/guard.local.sh && echo ok` → `ok`.

### T1.0b — Docker sẵn sàng, file guard, chụp mốc container (Owner: Đạt bước 1–2; executor bước 3)
- Goal: biết chính xác container nào của Đạt đang chạy và chạy từ lúc nào, để chứng minh executor không restart gì.
- Steps:
  1. (Đạt) Bật Docker Desktop, bật các container thường dùng của Đạt như mọi ngày.
  2. (Đạt) Tạo `$HUB/checks/guard.local.sh` với 3 dòng `export` ở bảng quy ước; giá trị Đạt tự điền.
  3. (executor):
```bash
cd "$HUB" && git check-ignore -q checks/guard.local.sh && source checks/guard.local.sh
test -n "$COMPANY_CONTAINERS_REGEX" && test -n "$LAB_PG_CONTAINER" && test -n "$LEAK_REGEX"
docker ps > /dev/null
PROT="$COMPANY_CONTAINERS_REGEX|$LAB_PG_CONTAINER|advance-be-redis"
docker ps -a --format '{{.ID}} {{.Names}} {{.State}}' > "$OUT/docker-before.txt" 2>&1 && test -s "$OUT/docker-before.txt"
grep -E "$PROT" "$OUT/docker-before.txt" | while read id name state; do echo "$id $name $(docker inspect -f '{{.State.StartedAt}}' "$id")"; done > "$OUT/protected-before.txt" 2>&1 && test -s "$OUT/protected-before.txt"
```
  4. (executor) Tự kiểm regex của Đạt bằng mẫu biết trước (chạy sau T1.0, khi snapshot đã track):
```bash
git ls-files | grep -ciE "$LEAK_REGEX"                                                                   # 5 (các file tên mang nhãn cũ)
echo "$LAB_PG_CONTAINER" | grep -ciE "$LEAK_REGEX"                                                       # 1
docker ps -a --format '{{.Names}}' | grep -cxF "$LAB_PG_CONTAINER"                                       # 1
docker ps -a --format '{{.Names}}' | grep -E "$COMPANY_CONTAINERS_REGEX" | grep -viE "$LEAK_REGEX" | wc -l   # 0
```
- Success criteria: mọi lệnh exit 0; file mốc có container công ty; regex bắt đủ mẫu biết trước.
- Verify: chuỗi lệnh bước 3 exit 0; `grep -cE "$COMPANY_CONTAINERS_REGEX" "$OUT/protected-before.txt"` → ≥ 1; bước 4 đúng 4 con số. `docker ps` lỗi → STOP, nhờ Đạt bật Docker (không phải Failure Protocol). Bước 4 lệch → **không STOP**: báo Đạt mở rộng regex rồi làm tiếp phần còn lại của phase 1; chạy lại bước 4 sau khi Đạt sửa, phải đúng trước T2.7.

### T1.3 — `.nvmrc`, pin phiên bản, chặn gói mới phát hành
- Goal: bộ pin ADR-019 chính xác; pnpm từ chối gói phát hành < 3 ngày.
- Steps:
  1. Ghi `Start S1–S5: <HH:MM>` vào `OUT/spike-results.md`. Đồng hồ S1–S5: 60 phút.
  2. `HUB/.nvmrc` = `24.22.1`. Root `package.json`: `engines.node` → `">=24.9.0"`, `devDependencies.typescript` → `"5.9.3"`.
  3. `pnpm-workspace.yaml`: thêm `minimumReleaseAge: 4320`; xóa dòng `'@scarf/scarf': true` trong `allowBuilds`.
  4. Pin chính xác (không `^`):

| File | Gói | Bộ Nest 12 | Fallback Nest 11 |
|---|---|---|---|
| api deps | `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | `12.2.0` | `11.2.8` |
| api deps | `@nestjs/config` | `12.0.1` | `4.0.4` |
| api deps | `@nestjs/jwt` / `@nestjs/passport` | `12.0.3` / `12.0.0` | `11.0.2` / `11.0.5` |
| api deps | `@nestjs/swagger` / `@nestjs/terminus` | `12.0.5` / `12.1.0` | `11.4.7` / `11.1.1` |
| api deps | `@nestjs/throttler` | `6.7.1` | `6.7.1` |
| api deps | `nestjs-pino` | `5.3.1` | `4.6.1` |
| api deps | `@prisma/client`, `@prisma/adapter-pg` | `7.9.0` | `7.9.0` |
| api dev | `@nestjs/cli` / `@nestjs/testing` | `12.0.10` / `12.2.0` | `11.0.24` / `11.2.8` |
| api dev | `@types/express` | `5.0.6` | `5.0.6` |
| api dev | `jest` / `ts-jest` / `@types/jest` | `30.5.2` / `29.4.15` / `30.0.0` | `29.7.0` / `29.4.15` / `29.5.14` |
| api dev | `prisma` / `typescript` | `7.9.0` / `5.9.3` | `7.9.0` / `5.9.3` |
| web deps | `next` / `react` / `react-dom` | `16.4.3` / `19.3.1` / `19.3.1` | `15.5.28` / giữ / giữ |
| web dev | `eslint-config-next` / `@types/react` / `@types/react-dom` / `typescript` | `16.4.3` / `19.3.0` / `19.3.0` / `5.9.3` | `15.5.28` / giữ / giữ / `5.9.3` |

  5. Không đổi gói khác (`@types/node`, jest của web, Orval, Tailwind giữ nguyên).
- Verify: `cd "$HUB" && grep -nE '"(@nestjs/core|prisma|jest)": "\^' apps/api/package.json; grep -nE '"(next|react)": "\^' apps/web/package.json` → không in gì; `cat .nvmrc` → `24.22.1`; `grep -c "minimumReleaseAge: 4320" pnpm-workspace.yaml` → `1`; `grep -c "scarf" pnpm-workspace.yaml` → `0`.

### T1.4 — S1: `pnpm install` + rà lockfile
- Steps:
  1. Nhắc Đạt đóng bớt tab Chrome. `cd "$HUB" && pnpm install` (không `--frozen-lockfile` lần này). Từ đây về sau luôn `pnpm install --frozen-lockfile`.
  2. Rà chuỗi cung ứng:
```bash
git diff --stat template-snapshot -- pnpm-lock.yaml > "$OUT/lock-review.txt" 2>&1
git diff -U0 template-snapshot -- package.json apps/api/package.json apps/web/package.json | grep -E '^\+ +"' | grep -vE '"(@nestjs/[a-z-]+|@prisma/(client|adapter-pg)|prisma|jest|ts-jest|@types/(express|jest|react|react-dom)|next|eslint-config-next|react|react-dom|typescript|nestjs-pino|node)":'
```
- Success criteria: install exit 0 (chỉ cảnh báo engine/peer); không có gói top-level mới ngoài bảng pin.
- Verify: install exit 0; lệnh grep thứ 2 không in gì; `cd apps/api && pnpm exec prisma -v` → có `7.9.0` ở `prisma` và `@prisma/client`. Lỗi nhắc `minimumReleaseAge` → xem bảng T1.6.

### T1.5 — Spike S2–S5 (không DB)
| # | Lệnh (từ `HUB`) | Pass condition |
|---|---|---|
| S2 | `cd apps/api && node -e "require('@nestjs/core')"` | exit 0, không `ERR_REQUIRE_ESM` / `ERR_REQUIRE_ASYNC_MODULE` |
| S3 | `pnpm --filter api prisma:generate` | exit 0; có `apps/api/src/generated/prisma/client.ts` |
| S4 | `pnpm --filter api test -- origin-check` | exit 0; có `Test Suites: 1 passed` |
| S5a | `pnpm --filter api check-types` | exit 0 |
| S5b | `cd apps/web && pnpm exec next typegen && pnpm exec tsc --noEmit` | exit 0 |
- Ở Node 24.22.1, S4 **phải pass**. Ghi từng dòng + giờ vào `OUT/spike-results.md`.
- S3 cần `DATABASE_URL`? Không — generate không kết nối DB; guard DB (phase 2) chưa tồn tại ở phase này.
- Verify: chính bảng trên.

### T1.6 — Bảng fallback (dùng cho phase 1 và phase 2)
| Tín hiệu | Hành động đã duyệt sẵn |
|---|---|
| S2 hoặc S4 có bất kỳ thông báo ESM / `import.meta` / `require` (vd `ERR_REQUIRE_ESM`, `ERR_REQUIRE_ASYNC_MODULE`, "Cannot use import statement") | Phía API sang cột Nest 11, cài lại, chạy lại từ S1 |
| Lỗi nhắc tới đường dẫn hoặc encoding (ký tự `ọ`, `D:\h?c`, ENOENT trên đường dẫn có dấu) | **Failure Protocol** — không hạ phiên bản |
| Install bị chặn bởi `minimumReleaseAge` cho 1 gói đã pin | STOP, hỏi Đạt: chờ / dùng patch cũ hơn / thêm ngoại lệ. Không tự hạ `minimumReleaseAge` |
| `nest build` crash vì engine Node | Failure Protocol, rồi Nest 11 nếu còn trong đồng hồ |
| S7/S8 (phase 2) không 200 hoặc thiếu cookie sau 1 lần sửa | Nest 11 |
| S9 (phase 2) hết RAM hoặc > 3 phút mới 200 | Thử `next dev --webpack -H 127.0.0.1 --port 3100` 1 lần, rồi web sang Next 15.5.28 |
| Quá 60 phút cho S1–S5, hoặc quá 45 phút cho S6–S10 (tính từ T2.9 B1) | Lùi phía đang hỏng |
| Lỗi khác | Failure Protocol |
- Khi lùi: sửa pin phía hỏng → `pnpm install` → chạy lại từ S1 → ghi đề xuất sửa ADR-019 (1 câu "Lùi <phía> về <bản> ngày <dd/mm> vì <tín hiệu>") kèm bằng chứng vào `OUT/proposed-doc-deltas.md`, báo lead/Đạt trong chat. **Executor không sửa `D:/học/advance-be/docs/**`** — lead áp dụng.
- Verify khi có lùi: bảng T1.5 chạy lại đều pass; `test -s "$OUT/proposed-doc-deltas.md"`. Không lùi: `no verification needed`.

## Success Criteria
- [x] 3 lệnh `-v` ở T1.1 đúng
- [x] Commit snapshot + tag `template-snapshot` (cục bộ)
- [x] `OUT/protected-before.txt` có container công ty kèm `StartedAt`
- [x] S1–S5 pass, `minimumReleaseAge` bật, không gói top-level lạ

## Risk
| Rủi ro | Khả năng × Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Sửa PATH Machine sai → shell mất node hoặc pnpm@9 cũ che pnpm 11 | Trung bình × Trung bình | Giữ MSI cho hook; shim nvm đứng trước `%APPDATA%\npm`; `nvm doctor`; làm ngoài phiên, mở lại phiên sau |
| Pin mới phát hành < 3 ngày bị chặn | Trung bình × Trung bình | Hỏi Đạt, không tự nới |
| `pnpm install` làm máy đơ | Trung bình × Trung bình | Đóng Chrome, không chạy gì song song |

## Rollback
`cd "$HUB" && git reset --hard template-snapshot && rm -f .nvmrc && pnpm install --frozen-lockfile`. Node: Đạt thêm lại `C:\Program Files\nodejs\` vào PATH Machine (MSI vẫn còn), hoặc `nvm use` bản khác.

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

Ghi chú: các tín hiệu trong bảng T1.6 là nhánh đã duyệt sẵn; "STOP, hỏi Đạt" ở T1.0b/T1.6 là câu hỏi cho Đạt, không phải Failure Protocol.
