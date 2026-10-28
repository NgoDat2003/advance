# Khung dự án OmniPOS & FinLedger Hub — hợp đồng phạm vi

- Lệnh: `/ak-brainstorm --advice` · 27/10/2026 13:33
- Nền: [brainstorm-261027-1109-cluster1-project-buildup/brainstorm.md](brainstorm-261027-1109-cluster1-project-buildup/brainstorm.md) (bản B). Đạt đã chấp nhận ("đúng theo tiêu chí m đưa ra").
- Đạt giao toàn quyền phần CRUD, UI/UX và hạ tầng. Đạt chỉ làm phần kiến thức của 3 khóa học.
- **Trạng thái: chỉ phân tích, CHƯA build.** Đạt dặn lúc 13:43 là chưa làm. Trước lúc đó AI đã lỡ làm 2 việc: thêm `/omnipos-finledger-hub/` vào `.gitignore` của advance-be, và tải code template vào thư mục đó (chưa cài, chưa chạy).

## Outcome
Trước tối 28/10, repo `omnipos-finledger-hub` boot được trên máy công ty bằng các lệnh trong README. Khi Đạt học xong Cụm 1 (Bài 14 + Bài 07), Đạt mở repo ra là vào làm ngay phần kiến thức, không phải dựng gì thêm.

## Quyết định AI chốt thay Đạt (toàn quyền)
- Giữ nguyên bản B: không retry ở M1, bỏ bài D của Bài 14, Đạt gõ tối đa 15 dòng mỗi hàm.
- Ví gồm ví theo quán và một ví TREASURY. Không có ví khách hàng.
- Không làm worktree `blueprint`. Khi Đạt kẹt quá 20 phút, AI chỉ ra dòng code ngay trong chat.

## Ranh giới: AI làm gì, Đạt làm gì
| AI dựng ngay (khung) | Để dành cho Đạt (kiến thức) |
|---|---|
| Sao chép template, `git init` lịch sử mới, `.gitignore` | Bài 07: cột và ràng buộc của `Wallet`, `LedgerEntry`, `VoucherCampaign`, `VoucherSlot` (DECIMAL, CHECK, unique, slot tạo sẵn) |
| Postgres riêng 5434 (DB `omnipos_hub`), API 3101, web 3100 | Bài 14: SQL khóa (`ORDER BY id FOR UPDATE`, `SKIP LOCKED`), kiểm số dư trong transaction |
| Bảng `Store` (300 quán) và `Product` (77 món từ northwind), kèm seed | Rà code AI theo checklist 8 mục |
| API đọc `GET /stores`, `GET /products` | |
| Module `wallets/` và `vouchers/` gồm route và DTO; service trả 501 kèm `TODO(Đạt)` | |
| Thư mục `checks/`: cURL đăng nhập, bắn song song 30 request, SQL đối soát | |
| README để máy nhà boot được; repo GitHub private | |

AI chỉ viết bản naive (để đo số liệu "trước"), các API đọc ví/voucher và seed ví **sau khi** Đạt xong DDL Bài 07, vì chúng phụ thuộc vào bảng do Đạt thiết kế.

## Constraints
- Không dừng, đổi cổng hay sửa container dự án công ty, container PG lab (5433), `advance-be-redis`. Northwind trên 5433 chỉ được đọc.
- RAM trống khoảng 0,7/15,8 GB. Mỗi lúc chỉ chạy một bước nặng (install, API, web) và dừng ngay khi bước đó pass. Không đụng Chrome, bun, Orca, Antigravity.
- Mọi file nằm trong `D:/học/advance-be`. Không in mật khẩu hay URL kết nối database.
- Code ngắn gọn, comment tiếng Việt, theo chuẩn v1.0 của template.

## Non-goals
- Bảng ví, sổ cái, voucher; SQL khóa; bản naive (đều chờ Bài 07 và Bài 14).
- Redis, retry, idempotency (Cụm 2–3). Chuyển repo sang public (để đến 01/11).
- Giao diện ngoài những gì template có sẵn, trừ khi rẻ.

## Acceptance criteria
| Tiêu chí | Cách kiểm | Ngưỡng |
|---|---|---|
| Không đụng thứ khác | `docker ps` trước và sau | Container container dự án công ty giữ nguyên CONTAINER ID |
| Cổng sạch | `grep -rn "3000\|3001\|5433"` trong hub | 0 dòng có tác dụng |
| API chạy | cURL vào health trên cổng 3101 | 200 |
| Đăng nhập | cURL login, lưu cookie jar | Có cookie phiên |
| Seed | cURL `GET /stores` và `GET /products` có cookie | Đếm được 300 và 77 |
| Chỗ trống cho Đạt | cURL `POST /wallets/transfers` | 501, message có `TODO(Đạt)` |
| Web chạy | Web trên 3100 | Trang login trả 200 |
| Git sạch | `git status` ở advance-be; `git ls-files` trong hub | 0 đường dẫn hub; chỉ có `.env.example` |
| Dọn tiến trình | Danh sách tiến trình node do AI chạy | 0 tiến trình còn lại; chỉ container PG của hub còn Up |

## Phát hiện khi đọc code template (27/10, chỉ đọc)
| Phát hiện | Ảnh hưởng | Xử lý khi dựng khung |
|---|---|---|
| `ThrottlerGuard` toàn cục: 100 request/60 giây (`app.module.ts`) | Bộ AC bắn 3 × 30 request cộng login trong 1 phút sẽ vượt 100 → lẫn mã 429 vào kết quả | Đưa giới hạn ra env, môi trường dev đặt cao. Rate limit thật là kiến thức Cụm 2, Đạt tự chỉnh khi tới đó |
| `OriginCheckGuard` cho qua request không có header `Origin` | cURL không cần thêm `Origin` | Không cần sửa. Câu hỏi mở số 3 đã có lời đáp |
| Health ở `GET /health` (public, có kiểm DB); login ở `POST /auth/login`, trả cookie | Đúng đường dẫn cho `checks/` | Không cần sửa |
| Cổng 3000/3001/5433 nằm ở 7 chỗ: `env.schema.ts`, `main.ts` (2 chỗ), `origin-check.guard.ts`, script `dev` của web, `http-client.ts` + `.env.local.example`, `docker-compose.yaml`, `.env.example` | Sót 1 chỗ là đụng vào container dự án công ty hoặc DB lab | Sửa hết, rồi grep phải ra 0 |
| Template mang nhãn khách hàng "nhãn khách hàng cũ" (`index.html` 147 KB, file giao diện khách hàng cũ, 2 logo), Swagger ghi "Training App API", role `TRAINER/TRAINEE` | Không được để lộ khi chuyển repo public | Xóa 4 file nhãn, đổi tên theo checklist trong `CLAUDE.md` của template. Đổi role để sang Cụm 3 |
| Web mới có trang login và trang chủ | Giao diện M1 phải dựng từ đầu | Nhóm 2, AI làm |
| RAM trống 0,7/15,8 GB (Chrome 5,7 GB) | `pnpm install` hoặc `next dev` có thể làm máy đơ | Mỗi lúc chạy 1 bước nặng, dừng ngay khi pass. Đạt đóng bớt tab Chrome |

## 3 repo tham khảo Đạt gửi (kiểm bằng GitHub API ngày 27/10)
| Repo | Thực tế kiểm được | Hợp với dự án? |
|---|---|---|
| `andrechristikan/ack-nestjs-boilerplate` | NestJS 12, ESM, **Prisma 6.19 trên MongoDB**; kèm AWS, Firebase, Sentry, OAuth, 2FA, multi-tenant; 701 sao | Không làm nền được. MongoDB không có `FOR UPDATE`, `SKIP LOCKED`, `pg_locks` hay CHECK, tức toàn bộ Cụm 1 |
| `CollatzConjecture/nestjs-clean-architecture` | NestJS 11, CQRS, **Mongoose (MongoDB)**, Prometheus; lần push code cuối **16/10/2025**. Ngày 21/10/2026 ghi trong ảnh nhiều khả năng là ngày cập nhật metadata, không phải ngày đổi code; 83 sao | Không làm nền. Chỉ nên đọc cách chia thư mục `domain/application/infrastructure` khi vào Cụm 3 |
| `ixartz/Next-js-Boilerplate` | Next 16, **Drizzle ORM**, Vitest, Playwright, Storybook, i18n; 13k sao | Không dùng. Đây là frontend, đụng với Prisma, và phần UI Đạt đã giao cho AI. Có thể mượn cấu hình Playwright ở Nhóm 3 (sau 14/12) |

Kết luận: giữ template của Đạt làm nền (PostgreSQL, Prisma 7.9 đúng bản dùng trong drill Bài 14, auth cookie đã có, code ít). Repo 2 là tài liệu đọc thêm cho Cụm 3. Câu chuyện phỏng vấn "tự nâng codebase từ v1.0 lên Clean Architecture" có giá trị hơn "dựng trên boilerplate có sẵn".

## Kongming (--advice) góp ý — GO kèm sửa
Nhận:
- `pnpm codegen` khởi động cả AppModule (có kết nối DB) → chỉ chạy sau khi container PG 5434 đã lên.
- Login có giới hạn riêng 5 lần/phút → bộ `checks/` chỉ đăng nhập 1 lần mỗi lượt chạy, dùng lại cookie jar.
- File `.env` nằm ở `apps/api/.env`, không phải ở gốc repo.
- Chốt luôn: `Store.id` và `Product.id` dùng `Int autoincrement`. `Wallet.storeId` và `ORDER BY id FOR UPDATE` của Đạt sẽ dựa vào đó.
- `seed-admin.ts` đang viết cứng mật khẩu admin → chuyển sang env trước khi public.
- README có công thức `prisma migrate dev --create-only` rồi sửa tay SQL, để Đạt thêm CHECK.
- Không viết SQL đối soát lúc này, vì nó phụ thuộc vào cột Đạt chưa thiết kế.
- Tiết kiệm RAM: không chạy `next build` hay `pnpm test`, chỉ dùng `tsc --noEmit`. `next dev` chạy cuối cùng, kiểm xong tắt ngay.
- Repo private + push nằm trong quyền đã giao. Chuyển public thì phải chờ 01/11 và Đạt đồng ý rõ ràng.

Bác: "`apps/api/src/generated/` chưa được gitignore". Sai: `.gitignore` của template đã có dòng này (đã grep kiểm).
