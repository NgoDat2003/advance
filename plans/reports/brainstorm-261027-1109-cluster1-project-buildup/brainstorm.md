# Brainstorm — Chốt Cụm 1 & khởi động dự án OmniPOS & FinLedger Hub

- Lệnh: `/ak-brainstorm --brainstorm --ultra --ak-render` · 27/10/2026
- `--brainstorm`: thừa (skill này vốn là brainstorm), không đổi gì.
- `--ultra`: 5 bản nháp độc lập (Opus) cùng một [evidence packet](evidence-packet.md), 1 verifier Kongming chấm theo [rubric](rubric.md). Chi tiết điểm: [verifier.md](verifier.md).
- `--ak-render`: bản HTML `brainstorm.html`, compile từ `brainstorm.page.yaml`.
- Nền đã chốt từ 26/10 (không bàn lại): `plans/handoffs/omnipos-finledger-master-roadmap-and-lesson12-20261026.md`.
- Thư mục cũ `plans/reports/ultra-261027-cluster1-buildup/` (5 bản nháp không rõ nguồn) để nguyên, không dùng.

Phần dưới đây là **bản thắng (Candidate B), giữ nguyên văn**. Ghi chú của controller nằm ở cuối, không sửa vào bản thắng.

---

## Outcome
Đến CN 01/11: xong Bài 14 + 07; repo `omnipos-finledger-hub` chạy trên port riêng, có Milestone 1 (M1): chuyển tiền sổ cái kép chống deadlock + săn voucher `SKIP LOCKED` cho 300 quán. Có bằng chứng cURL/DBX/`pg_locks` và số liệu trước/sau. Cụm 2–6 chỉ đắp thêm lên các bảng M1.

## Constraints
- Không đụng container dự án công ty (3000/3001), config container PG lab (5433, chứa lab DB), `advance-be-redis`.
- File chỉ nằm trong `D:/học/advance-be`. Pha A: Đạt không mở repo, học bằng Teacher Guide + DBX, bỏ video và lab `.mjs`.
- v1.0: controller mỏng + service facade + `PrismaService`; code ngắn, comment tiếng Việt.
- Prisma 7.9: khóa dòng phải qua `tx.$queryRaw`. Lỗi raw = P2010 kèm SQLSTATE (giả định — guide 14 ghi "chưa kiểm chứng trên 7.9"). `$transaction` mặc định maxWait 2000 / timeout 5000 ms.

## Non-goals
- Retry, idempotency, Redis, rate limit, Clean/Hex, đổi enum role (Cụm 2–3); `version` CAS trong code dự án; order/outbox/Kafka; Nhóm 3.
- Buổi riêng cho Bài 12 chặng 8; bài D/C/M3 Bài 14 (cần bộ chấm `npm run setup`); back-port về template.

## Acceptance criteria
cURL chạy trong Git Bash: login lưu cookie jar, thêm header `Origin: http://localhost:3100` (giả định guard đòi). Bắn song song bằng `xargs -P30`, đếm mã bằng `sort | uniq -c`.

| criterion | how to verify | pass threshold |
|---|---|---|
| Không đụng thứ khác | `docker ps` trước/sau; `git status` ở advance-be | container dự án công ty giữ nguyên CONTAINER ID; 0 dòng `omnipos-finledger-hub` |
| Seed + sổ cái cân | DBX 5434: đếm stores/products/ví quán; tìm transfer `sum(amount)<>0`, ví `balance <> sum(entries)` | 300/77/300; 0 dòng lệch sau mỗi test |
| Rút quá số dư | 30 song song C→D, mỗi lệnh 200.000 (C = 1.000.000) | 5×201, 25×409 `INSUFFICIENT_FUNDS`, 0×5xx, C = 0 |
| Chuyển chéo | 15 A→B + 15 B→A, mỗi lệnh 10.000, bắn cùng lúc (A, B là ví mới, khác C/D); xem log API | 30×201, 0×5xx, 0 `40P01`; A, B về số cũ |
| Voucher | campaign 10 slot, 30 quán khác nhau claim song song; bộ đếm trên UI | 10×201, 20×409 `SOLD_OUT`; DBX: đúng 10 slot có chủ |
| Thấy khóa | DBX giữ `FOR UPDATE` ví A; cURL A→B; `pg_locks WHERE NOT granted` | ≥1 dòng; `COMMIT` trong < 5 s → 201 |
| Trước/sau | chạy test "Rút quá" trên bản naive (blueprint) | README có 2 dòng số; bản naive >5×201 hoặc sổ bị lệch |
| Repo public | `git log`; `git ls-files \| grep -i env` | commit gốc tạo 28/10, không có lịch sử template; 0 `.env` |

## Trade-offs
| | A. Làm tuần tự, DB chung 5433 | B. AI dựng nền sớm, PG riêng 5434 | C. Lõi viết bằng hàm plpgsql |
|---|---|---|---|
| Là gì | Đúng lịch 26/10; DB mới đặt trong container 5433 | AI (phiên riêng) dựng repo + Nhóm 2 ngày 28–29/10 | Hàm `transfer_wallet()`/`claim_voucher()` viết trên DBX; NestJS chỉ gọi |
| Giả định chịu lực | Pha A xong 29/10; container chung không bao giờ phải đổi config | Bootstrap không cần Đạt quyết thêm gì | Luật nghiệp vụ được phép nằm trong DB tới v3.0 |
| Hỏng đầu tiên | Trễ nửa ngày → Pha B còn 1,5 ngày; Cụm 5 Debezium cần `wal_level=logical` (giả định) → phải restart container chứa lab DB | Lỗi pnpm/Prisma/Origin guard kéo Đạt ra khỏi Pha A; RAM chật | Cụm 3 v2.0 đòi luật nằm ở `domain/` → viết lại toàn bộ sang TS |
| Chi phí | 0 container mới; nợ dồn sang Cụm 5 | +1 container, +1 kết nối DBX | Rẻ nhất bây giờ, đắt nhất ở Cụm 3 |

## Better approaches
| Cải tiến | Bằng chứng | Thay đổi | Chi phí chuyển |
|---|---|---|---|
| Đạt chỉ gõ các dòng SQL khóa, phần còn lại thì rà | Memory: rà code hợp hơn gõ tay. Cả 2 drill đều dạng rà (guide 12 dòng 1004–1048, guide 14 dòng 1429–1521). Phần khóa là SQL trong `$queryRaw`, đúng thứ đã gõ trên DBX | Từ ~2 file → ≤15 dòng/hàm; có thêm số liệu trước/sau | AI viết thêm 1 bản naive |
| Gộp Bài 12 chặng 8 vào Prisma drill Bài 14 | Drill 12 viết cho TypeORM; lỗi #1/#3/#5 trùng đáp án 2/6/5 của drill 14; #4 chỉ có ở TypeORM | Chỉ đọc #2 (mất cập nhật) và #6 (nuốt lỗi → `25P02`), ~5 phút | 0 |
| Nghiệm thu bằng cURL | Trình duyệt chỉ mở ~6 kết nối/host (giả định; xem cột "Stalled" trong DevTools) → nút "Bắn 30" thật ra chỉ chạy ≤6 cùng lúc | Song song thật 30; nút UI chỉ để xem | 1 lệnh |

## Recommendation
Chọn B: giữ lịch và vai đã chốt 26/10, AI làm sớm phần không cần Đạt để bù nửa ngày trễ.
PG riêng tránh phải restart container lab ở Cụm 5, và repo public tự chạy được.
C đi ngược hướng v2.0 đã chốt.
A đơn giản nhất → dùng làm dự phòng nếu bootstrap kẹt: tạm tạo DB trên 5433, dời sang 5434 trước Cụm 4.

## Decisions
| Vấn đề | Quyết định |
|---|---|
| Port/DB | PG riêng 5434 (DB `omnipos_hub`), API `PORT=3101`, sửa script web thành `--port 3100` + đổi `WEB_ORIGIN`; Redis Cụm 2 = container riêng 6380. Các port này là giả định: `netstat -ano \| findstr ":5434 :3100 :3101"` phải rỗng. 77 món northwind xuất ra file JSON trong repo. |
| Repo + git lồng | `D:/học/advance-be/omnipos-finledger-hub/`; thêm thư mục này vào `.gitignore` của advance-be; `.gitignore` của hub thêm `.worktrees/`. Mỗi máy (công ty, nhà) clone riêng vào đây. Không dùng submodule. |
| Repo public | Copy template bỏ `.git` → `git init` → repo mới để private (28/10) → chuyển public 01/11 khi AC pass; mật khẩu admin chỉ lấy từ env. |
| Ai gõ gì | AI: mọi thứ khác + bản naive. Đạt: bắn test vào bản naive → gõ ≤15 dòng/hàm (`ORDER BY id FOR UPDATE` 2 ví, kiểm số dư trong tx, ghi ledger qua `tx.`, câu `SKIP LOCKED`) → rà file AI theo checklist 8 mục (Bài 12 #2/#6 + drill 14). Kẹt >20 phút → AI hiện dòng code, Đạt giải thích lại. Roadmap 26/10 (gõ) mới hơn, memory (rà) là quan sát thật → vẫn gõ, nhưng chỉ phần SQL đã luyện. |
| Bài 12 chặng 8 | Không học riêng; đọc #2, #6 trước drill 14; bỏ smoke test Write Skew. |
| Nguồn thiết kế sổ cái | AI cung cấp, ghi rõ "ngoài slide". Neo vào slide Bài 07: DECIMAL (tr.23), cột chung (tr.20), cột dư (tr.10, 17) → `balance` = cache của SUM ledger; view/report (tr.33, 39) → đối soát; homestay sinh sẵn dòng (tr.29–30) → slot voucher. Ledger chỉ INSERT; mỗi transfer 2 dòng, tổng bằng 0. |
| M1 bảng | `Store` 300 · `Product` 77 · `Wallet`(storeId unique, NULL = TREASURY; balance Decimal(14,2)) + `CHECK (store_id IS NULL OR balance >= 0)` thêm tay vào migration · `LedgerEntry`(transferId, walletId, amount ±) · `VoucherCampaign`(name, totalSlots) · `VoucherSlot`(code, claimedByStoreId, claimedAt), unique (campaignId, claimedByStoreId). Seed: TREASURY chuyển 1.000.000 cho mỗi quán. |
| M1 endpoint | `POST /wallets/transfers` (201/409 `INSUFFICIENT_FUNDS`) · `GET /wallets/:id` (balance, ledgerSum) · `POST /vouchers/campaigns` (sinh slot bằng `generate_series`) · `POST /vouchers/campaigns/:id/claims` (201 / 409 `SOLD_OUT` / 409 `ALREADY_CLAIMED` khi lỗi chứa `23505`) · `GET /vouchers/campaigns/:id`. Đặt sau JwtAuthGuard sẵn có; RC + khóa theo id tăng dần; `$transaction(fn, { maxWait: 5000, timeout: 5000 })`; không retry (retry sẽ che `40P01`). UI: nút "Bắn 30" + bộ đếm. |

## Lịch 27/10 → 01/11
| Ngày | Pha | Việc | Xong khi |
|---|---|---|---|
| T3 27/10 | A | Bài 14 chặng 0–4 (~105 phút); tối làm chặng 5 nếu còn sức | DBX thấy `granted = f` |
| T4 28/10 | A | Chặng 5–8 (~160 phút) + Bài 12 #2/#6. AI: bootstrap hub; soạn guide gọn Bài 07 (chưa có — đã kiểm `reports/advanced_backend/`) | Tự tạo + tự phá `40P01`; tìm ≥4/6 lỗi drill trước khi xem đáp án; AI: `/health` trả 200 (path giả định) |
| T5 29/10 | A | Bài 07; AI đưa khung DDL, Đạt điền cột + ràng buộc (CHECK, unique) trên schema lab | DDL chạy được; CHECK chặn số âm (`23514`) |
| T6 30/10 | B | X-ray 30 phút luồng request; AI migrate + seed + bản naive; Đạt bắn test; sau đó `prisma migrate reset` + seed lại | Số "trước" ghi vào README; DB sạch lại |
| T7 31/10 | B | Đạt gõ dòng khóa cho 2 hàm, rà theo checklist | AC Rút quá/Chuyển chéo/Voucher pass |
| CN 01/11 | B | Chạy toàn bộ AC, README, chuyển public; còn lại là đệm | Mọi AC pass |

## Cluster 1 → 6 carry-forward
| Cụm | Dùng lại / đổi gì |
|---|---|
| 2 | `@Idempotent()` bọc transfer, rate limit bọc claim, cache menu từ `Store`/`Product`; bảng giữ nguyên. |
| 3 | Tách 4 tầng; SQL khóa chuyển nguyên vào repository; thêm retry theo SQLSTATE; đổi enum role, chặn IDOR ví; bộ AC cURL dùng làm regression. |
| 4 | `transferId` làm id sự kiện; key theo `walletId`. |
| 5 | `outbox_events` ghi cùng transaction với ledger; bật `wal_level=logical` trên PG riêng; Saga bù = một transfer ngược chiều. |
| 6 | Partition ledger theo `createdAt`; short-link cho mã voucher; viết ADR từ bảng Decisions. |

## Unresolved questions
1. Mỗi ngày học được mấy giờ? Lịch đang giả định ~2–2,5h (theo bản 26/10).
2. Ví theo quán + TREASURY (giả định), hay ví thành viên của khách?
3. Tên env base URL web→API, path login/health, guard có chặn cURL thiếu `Origin` không, và P2010 trên 7.9 có thật kèm SQLSTATE không?
4. RAM có đủ chạy thêm PG + API + Next cạnh container dự án công ty không? Máy nhà có Docker không?
5. Để enum TRAINER/TRAINEE lộ công khai tới Cụm 3 có ổn không?

---

## Ghi chú của controller (verifier phát hiện, cần Đạt biết)

1. **Bản thắng cắt bài tập D của Bài 14** ("tự viết SQL đặt vé", guide dòng 1387). Đây là bài lõi, không chỉ phần tùy chọn. Bù lại: Đạt gõ chính SQL khóa của dự án.
2. **M1 không có retry.** Guide Bài 14 (dòng 776) dạy "sửa thứ tự khóa trước, retry chỉ là lưới an toàn". Bản thắng dời retry sang Cụm 3. Đây là lựa chọn phạm vi, không phải lỗi, nhưng checklist rà code vẫn có mục retry.
3. **Phương án dự phòng "tạm tạo DB trên 5433"** chạm vào container lab mà phần Constraints nói không đụng. Phương án chính (5434) sạch.
4. **Giờ học:** bản 26/10 ghi "1.5–2.5h/ngày", không phải "2–2,5h". Ngày 28/10 nặng khoảng 2h50 nên có thể tràn sang sáng 29/10.
5. Các điểm có ghi "giả định" mà verifier đã kiểm là đúng: trình duyệt chỉ mở khoảng 6 kết nối/host; `$transaction` mặc định maxWait 2000 / timeout 5000 ms; P2010 trên 7.9 guide ghi "chưa kiểm chứng".

## Xếp hạng

| Hạng | Bản | Tổng | R1+R2+R5 | Ghi chú |
|---|---|---|---|---|
| 1 | B | 109 | 54 | Ít phần nhất, số đo suy ra được, có đối chứng naive, có ngày đệm |
| 2 | C | 106 | 54 | Hợp cách học nhất (điền ≤10 dòng + break-it), giữ retry, nhưng nhiều artifact, không có ngày đệm |
| 3 | A | 106 | 53 | Trích dẫn chặt nhất, nhắc tên brand thật + 2 máy; ô bảng quá nén |
| 4 | E | 105 | 51 | Bất biến I1–I4 hay, nhưng nén Bài 07 và thêm ví khách |
| 5 | D | 95 | — | Loại: 1976 từ (> 1600); thiếu ví treasury nên seed vỡ đối soát |

Biên độ thấp: B và C hòa điểm quyết định. Nếu Đạt muốn giữ retry + bài D thì C là lựa chọn ngang giá.

ultra: picked=2/5 margin=low unanimous=no rejected_all=no
