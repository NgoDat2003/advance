---
phase: 6
title: "Slot của Đạt + nghiệm thu M1, tag m1, public 01/11"
status: pending
priority: P1
effort: "Đạt ~3h · executor 1h"
dependencies: [5]
owner: "Đạt (T6.1–T6.7) + executor hỗ trợ (T6.0, T6.8, T6.9)"
---

# Phase 6: Slot của Đạt + nghiệm thu M1

## Goal
Số "trước" đo trên DB sạch; Đạt tự gõ dòng chịu lực của transfer và claim; mọi AC M1 pass bằng cURL + SQL; README có số trước/sau; `git tag m1`; public chỉ khi Đạt nói đúng `đồng ý public`.

Quy ước `HUB`, `OUT`, file guard, RAM: phase 1.

## Quy tắc cho phase này
- Task "Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm": executor không sửa `wallets.service.ts`, `vouchers.service.ts`, không viết SQL khóa, không gợi ý. Đạt kẹt > 20 phút và tự hỏi → AI chỉ ra **1 dòng** trong chat, Đạt giải thích lại. AI không sửa file thay Đạt.
- `pnpm --filter api db:reset` chỉ **Đạt** chạy trong terminal của Đạt, sau khi `bash checks/m1/pre-reset-check.sh` in `READY_FOR_RESET`. Executor hỏi rồi chờ; không đặt `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`.
- Đạt chạy mọi lệnh `checks/` trong cửa sổ **Git Bash**.
- Bật API (sau `pnpm --filter api build`, từ `HUB/apps/api`). Mỗi lần đo bật API mới để log chỉ chứa lần đo đó:

| Chế độ | Git Bash | PowerShell (nếu Đạt muốn) |
|---|---|---|
| locked | `node dist/src/main.js > ../../checks/out/api.log 2>&1` | `node dist/src/main.js 2>&1 \| Out-File -Encoding utf8 ../../checks/out/api.log` |
| naive | `M1_IMPL=naive node dist/src/main.js > ../../checks/out/api.log 2>&1` | `$env:M1_IMPL='naive'; node dist/src/main.js 2>&1 \| Out-File -Encoding utf8 ../../checks/out/api.log` rồi sau đó `Remove-Item Env:M1_IMPL` |
| drill khóa | `M1_TX_TIMEOUT_MS=15000 node dist/src/main.js > ../../checks/out/api.log 2>&1` | `$env:M1_TX_TIMEOUT_MS='15000'; ...` rồi `Remove-Item Env:M1_TX_TIMEOUT_MS` |
- Tắt API: `source checks/lib/common.sh && kill_port 3101 && port_free 3101`.

## Files to Create / Modify
- Modify (Đạt): `apps/api/src/modules/wallets/wallets.service.ts` (khối `TODO(Đạt)` trong `transferLocked`), `apps/api/src/modules/vouchers/vouchers.service.ts` (khối `TODO(Đạt)` trong claim)
- Create (executor soạn, Đạt điền): `docs/design/m1-review-checklist.md`
- Modify (executor): `README.md`, `checks/smoke.sh`
- Create (executor, cục bộ): `OUT/m1-before-<ts>.txt`, `OUT/m1-after-<ts>.txt`, `OUT/proposed-doc-deltas.md`
- **Không** sửa `D:/học/advance-be/docs/**` hay `plans/reports/**` — lead áp dụng đề xuất.

## Tasks

### T6.0 — Chuẩn bị (executor)
- Steps:
  1. Tạo `docs/design/m1-review-checklist.md`: 8 câu, mỗi câu có dòng `Trả lời:` và `File:dòng:` trống. Chỉ câu hỏi:
     1. (Drill 14 #1) Có chỗ nào đọc số dư/slot rồi quyết định *trước* khi khóa, hoặc ngoài transaction? So bản naive với bản `locked`.
     2. (Drill 14 #2) Trong callback `$transaction`, có lệnh nào dùng `this.prisma` thay vì `tx`?
     3. (Drill 14 #3) Thứ tự khóa 2 ví do JS hay SQL quyết định? A→B và B→A có khóa cùng thứ tự không?
     4. (Drill 14 #4) Có lệnh ghi nào mà kết quả "0 dòng bị sửa" bị bỏ qua?
     5. (Drill 14 #5) Lỗi DB được phân loại theo P-code hay SQLSTATE? `40P01` từ `$queryRaw` đi qua nhánh nào? M1 không retry — Cụm 3 thêm retry ở đâu?
     6. (Drill 14 #6) Có việc chậm nằm trong transaction đang giữ khóa? Transaction có thể vượt `M1_TX_TIMEOUT_MS` không?
     7. (Bài 12 #2) Chỗ nào ghi số dư bằng giá trị JS tính từ lần đọc không khóa? Khối TODO 3 của bạn khác bản naive ở đâu, và vì sao khác biệt đó chặn mất cập nhật?
     8. (Bài 12 #6) Có `try/catch` nào *bên trong* callback nuốt lỗi? Lệnh kế tiếp sẽ nhận mã gì?
  2. Nhờ Đạt chạy `uname -s` trong cửa sổ Git Bash của Đạt và dán kết quả.
  3. `port_free 3101`.
- Verify: `grep -c "^Trả lời:" docs/design/m1-review-checklist.md` → `8`; kết quả Đạt dán bắt đầu bằng `MINGW64`.

### T6.1 — Reset về seed gốc (Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm)
- Nhiệm vụ: `bash checks/m1/pre-reset-check.sh` → `READY_FOR_RESET`; rồi `pnpm --filter api db:reset`.
- Executor kiểm:
```bash
bash checks/m1/reconcile.sh                                                              # 0
source checks/lib/common.sh && source checks/m1/lib-wallets.sh && balance_of "$(wallet_of_store 1)"   # 1000000.00 (hoặc 1000000)
```
- Lặp lại đúng task này mỗi khi phase cần DB sạch (sau T6.2 và ở T6.8).

### T6.2 — Đo số "trước" trên bản naive (Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm)
- Điều kiện: T6.1 vừa pass (đối soát `0`).
- Nhiệm vụ: bật API chế độ naive; `bash checks/login.sh`; `{ bash checks/m1/overdraw.sh; bash checks/m1/reconcile.sh; } | tee "checks/out/m1-before-$(date +%Y%m%d-%H%M%S).txt"`.
- Cách kiểm: số `201` > 5 **hoặc** đối soát > 0.
- Executor kiểm: `grep -c "M1_IMPL=naive" checks/out/api.log` → ≥ 1; `ls checks/out/m1-before-*.txt | wc -l` → ≥ 1. Tắt API.
- Sau đó: làm lại **T6.1** (DB đã lệch do naive).

### T6.3 — Gõ khối transfer (Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm)
- Nhiệm vụ: trong `transferLocked`, thay dòng `todoDat('khóa 2 ví theo I-07')` bằng câu khóa, và 2 dòng `TODO(Đạt)` 2–3 + dòng `return todoDat(...)` bằng code của Đạt (tổng ≤ 15 dòng). Giữ dòng 404 của AI.
- Cách kiểm:

| Lệnh | Pass |
|---|---|
| `pnpm --filter api check-types && pnpm --filter api build` | exit 0 |
| Bật API locked; `bash checks/login.sh`; `bash checks/m1/overdraw.sh` | đúng 2 dòng `5 201` và `25 409 INSUFFICIENT_FUNDS`; `C=0.00` (hoặc `0`); `reconcile=0`; không dòng `5xx` |
| `grep -c "SQLSTATE=23514" checks/out/api.log` | `0` (chặn bởi kiểm trong transaction, không nhờ CHECK) |

### T6.4 — Chuyển chéo không deadlock (Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm)
- Nhiệm vụ (API vẫn chạy): `bash checks/login.sh` rồi `bash checks/m1/cross.sh`.
- Pass: `30 201`; `A_back=yes`; `B_back=yes`; `40P01_new=0`; `bash checks/m1/reconcile.sh` → `0`. Có `40P01` → xem câu 3 của phiếu rà; không thêm retry.

### T6.5 — Gõ khối claim (Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm)
- Nhiệm vụ: trong claim, thay dòng `todoDat('lấy 1 slot trống')` bằng câu lấy slot, và `TODO(Đạt)` 2–3 + `return todoDat(...)` bằng code của Đạt (≤ 15 dòng). Giữ dòng 404 của AI.
- Cách kiểm: build exit 0; tắt rồi bật lại API locked; `bash checks/login.sh`; `bash checks/m1/voucher.sh` →
  - lần bắn campaign 1: `10 201`, `20 409 SOLD_OUT`; `claimed=10/10`; `db_claimed=10`
  - campaign 2: `reclaim_first=201`; `reclaim_again=409 ALREADY_CLAIMED`; `c2_claimed=1/5`
  - `bash checks/m1/reconcile.sh` → `0`
- Executor kiểm thêm: `grep -c "SQLSTATE=23505 -> ALREADY_CLAIMED" checks/out/api.log` → ≥ 1, chép đúng dòng log đó vào `OUT/proposed-doc-deltas.md` (bằng chứng cho SRS câu hỏi 4).

### T6.6 — Thấy khóa trong `pg_locks` (Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm)
- Nhiệm vụ: tắt API, bật chế độ "drill khóa" (15000 ms); `bash checks/login.sh`; làm theo `checks/m1/pg-locks-guide.md` (DBX `localhost:5434`, DB `omnipos_hub`); chỉ COMMIT là bấm tay.
- Pass: `pg-locks-drill.sh` in `not_granted=` ≥ 1 và `transfer=201`. Ảnh chụp DBX (nếu có) lưu `checks/out/m1-pg-locks.png` (bị ignore — ảnh DBX có thể lộ tên kết nối khác).
- Sau đó: tắt API, bật lại locked; executor kiểm `grep -c "M1_TX_TIMEOUT_MS=5000" checks/out/api.log` → ≥ 1; `bash checks/m1/pre-reset-check.sh` không báo `idle in transaction`.

### T6.7 — Rà code AI theo phiếu (Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm)
- Nhiệm vụ: đọc `wallets.service.ts`, `vouchers.service.ts`, `common/database/sql-state.ts`, `common/database/transaction-options.ts`, `scripts/seed/seed-wallets.ts`, `common/filters/http-exception.filter.ts`; điền 8 câu.
- Executor kiểm: `grep -cE "^Trả lời: .+" docs/design/m1-review-checklist.md` → `8`. Không chấm nội dung; AI phản biện trong chat nếu Đạt muốn.

### T6.8 — Nghiệm thu cuối, README, tag `m1` (executor)
- Steps:
  1. Tắt API; nhờ Đạt làm **T6.1** (pre-reset-check + reset). Chờ đối soát `0`.
  2. `checks/smoke.sh`: đổi kiểm `transfer-501` thành `wallet-read` (`GET /wallets/<ví quán 1>` → 200) vì route đã hết 501.
  3. Bật API locked; `bash checks/smoke.sh`; `bash checks/m1/run-all.sh | tee "$OUT/m1-after-$(date +%Y%m%d-%H%M%S).txt"`; tắt API.
  4. So file `m1-after-*` với bảng AC ở `plan.md` (Success Criteria). Lệch → Failure Protocol.
  5. README hub: mục "Kết quả M1 (<dd/mm/yyyy>)": bảng *Trước (naive)* / *Sau (locked)* cho Rút quá (lấy từ `m1-before-*`, `m1-after-*`), thêm Chuyển chéo, Voucher, Đối soát. Không credential, không tên container ngoài `omnipos-hub-pg`.
  6. `OUT/proposed-doc-deltas.md` (cho lead): SRS câu hỏi 4 → đã trả lời bằng dòng log thật `SQLSTATE=23505 -> ALREADY_CLAIMED` (T6.5); câu hỏi 5 → chạy được dưới `D:/học`, không cần `subst` (bằng chứng: phase 1–5 pass); kiến trúc mục 8 dòng "Dựng khung" → không cần `subst`. Báo lead trong chat.
  7. G1–G5 (phase 2 T2.10); `git commit -m "feat: lock wallets in id order and claim vouchers with skip locked"` (code của Đạt, tác giả Đạt); `git tag m1`; `git push && git push origin m1`.
- Verify: `bash checks/smoke.sh` exit 0; `git ls-remote --tags origin m1 | wc -l` → `1`; G5 không in gì; `test -s "$OUT/proposed-doc-deltas.md"`.

### T6.9 — Chuyển public (chỉ ngày 01/11, chỉ khi Đạt đồng ý rõ ràng)
- Steps:
  1. Hỏi đúng câu: "Chuyển `NgoDat2003/omnipos-finledger-hub` sang public bây giờ? Trả lời `đồng ý public` để làm." Câu khác → dừng, giữ private.
  2. Quét toàn lịch sử (từ `HUB`, `source checks/guard.local.sh`):
```bash
git log --all -p | grep -ciE "$LEAK_REGEX|training app|create.project.from.template|ADMIN_PASSWORD *= *'"        # 0
git log --all --name-only --format= | grep -E '(^|/)\.env$|\.env\.local$|guard\.local\.sh|cookies\.txt|api\.log' | wc -l  # 0
git log --all --diff-filter=A --name-only --format= | grep -iE '\.(png|jpe?g|webp|gif)$'                          # in danh sách; Đạt mở từng ảnh bằng mắt
git tag -l                                                                                                        # chỉ m1
command -v gitleaks && gitleaks detect --source . --log-opts="--all"                                              # tùy chọn; nếu có thì exit 0
```
  3. Đạt xem danh sách ảnh xong và nói `đồng ý public` → `gh repo edit NgoDat2003/omnipos-finledger-hub --visibility public --accept-visibility-change-consequences`.
- Verify: `gh repo view NgoDat2003/omnipos-finledger-hub --json visibility -q .visibility` → `PUBLIC`. Quét bước 2 lệch → STOP, không public, Failure Protocol.

## Success Criteria
- [ ] `m1-before-*` (naive, DB sạch) và `m1-after-*` là 2 file riêng; README có cả 2
- [ ] Rút quá 5×201 / 25×409, C = 0, 0 dòng `SQLSTATE=23514`; Chuyển chéo 30×201, 0 `40P01`
- [ ] Voucher 10×201 / 20×409 `SOLD_OUT`; campaign 2: 201 rồi 409 `ALREADY_CLAIMED`
- [ ] Đối soát 0 sau mọi test; `pg_locks` ≥ 1 dòng chưa granted; timeout về 5000
- [ ] Phiếu rà 8/8; tag `m1` trên remote; public chỉ khi Đạt nói `đồng ý public`

## Risk
| Rủi ro | Khả năng × Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Đạt kẹt lâu ở dòng khóa | Trung bình × Trung bình | Luật 20 phút; 01/11 là đệm |
| Reset khi còn transaction treo (DBX) | Trung bình × Trung bình | `pre-reset-check.sh` trước mọi reset |
| Public lộ lịch sử bẩn | Thấp × Cao | Quét toàn lịch sử + ảnh ở T6.9 |

## Rollback
Code của Đạt: `git revert` commit T6.8. DB: T6.1. Public: `gh repo edit ... --visibility private --accept-visibility-change-consequences` (hỏi Đạt trước).

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

Ghi chú: AC hỏng ở T6.3–T6.5 trong lúc Đạt đang gõ là phản hồi bài tập, trả về Đạt (luật 20 phút) — **trừ** khi có 5xx kèm dòng `Unhandled error SQLSTATE=23505` hoặc `SQLSTATE=23514` trong `checks/out/api.log`, hoặc lỗi serialize `BigInt`: đó là lỗi code AI (`sqlState`, map lỗi, 404, JSON) → executor xử lý theo Failure Protocol, không giao Đạt. Failure Protocol áp cho task của executor (T6.0, T6.8, T6.9) và khi lệnh kiểm tự nó hỏng.
