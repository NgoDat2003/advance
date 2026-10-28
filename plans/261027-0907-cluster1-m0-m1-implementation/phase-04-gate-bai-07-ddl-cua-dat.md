---
phase: 4
title: "Gate Bài 07 — DDL ví, sổ cái, voucher của Đạt"
status: pending
priority: P1
effort: "Đạt ~2h · executor 30m"
dependencies: [3]
owner: "Đạt (T4.2) + executor (T4.1, T4.3)"
---

# Phase 4: Gate Bài 07 — DDL của Đạt

## Goal
Đạt tự thiết kế cột và ràng buộc cho 4 bảng M1; ví quán âm bị chặn `23514`, claim trùng bị chặn `23505`. Executor chỉ soạn đề và phát lại để kiểm, **không viết cột hay ràng buộc nào**.

Quy ước `HUB`, `OUT`, file guard, shell: bảng đầu phase 1.

## Ranh giới học (bắt buộc)
- Executor KHÔNG viết: tên cột, kiểu cột, CHECK, UNIQUE, FK, index của `wallets`, `ledger_entries`, `voucher_campaigns`, `voucher_slots`.
- Executor KHÔNG gợi ý đáp án. Kẹt > 20 phút → Đạt hỏi trong chat; AI chỉ ra 1 dòng, Đạt giải thích lại.
- Không chép bảng "M1 bảng" của brainstorm hợp đồng B (đó là đáp án Bài 07) vào bất cứ file nào.
- Executor không bao giờ ghi vào 5433.

## Files to Create / Modify
- Create (executor): `HUB/docs/design/bai07-ddl-worksheet.md`, `OUT/bai07-replay-prelude.sql`, `OUT/bai07-replay.txt`, `OUT/public-tables-before.txt`, `OUT/public-tables-after.txt`
- Create (Đạt): `HUB/docs/design/bai07-ddl.sql` — **đường dẫn đã chốt**

## Tasks

### T4.1 — Soạn đề Bài 07 (executor, cuối ngày 28/10)
- Goal: 1 trang đề: bảng nào, để làm gì, giữ bất biến nào, nộp ra sao, tự kiểm thế nào. Không có cột.
- Target: `HUB/docs/design/bai07-ddl-worksheet.md` (tiếng Việt, ≤ 120 dòng), đúng 6 mục:
  1. **Bảng cần thiết kế** (tên · mục đích · bất biến):
     - `wallets` — 1 ví/quán + 1 ví TREASURY; số dư là cache của tổng bút toán — I-02, I-03, I-04, I-07
     - `ledger_entries` — bút toán ±, chỉ thêm — I-01, I-02, I-05
     - `voucher_campaigns` — 1 đợt voucher, có tổng số slot — I-06
     - `voucher_slots` — slot sinh sẵn, quán claim — I-06
  2. **Bất biến I-01…I-07**: chép nguyên văn SRS mục 6 (`D:/học/advance-be/docs/omnipos-finledger-hub/software-requirements-specification.md`, bảng bất biến).
  3. **Câu hỏi thiết kế** (chỉ hỏi):
     - Q1. Tiền lưu bằng kiểu gì? Vì sao không dùng số thực? (slide Bài 07 tr.23)
     - Q2. Phân biệt ví TREASURY với ví quán bằng cách nào? Ràng buộc nào bảo đảm 1 quán không có 2 ví?
     - Q3. Ràng buộc nào chặn I-03 mà vẫn cho TREASURY âm?
     - Q4. Làm sao biết 2 bút toán thuộc cùng 1 lần chuyển (I-01)? Giá trị nhóm do ai sinh?
     - Q5. Slot "chưa có chủ" biểu diễn thế nào? Ràng buộc nào bảo vệ "mỗi quán ≤ 1 slot mỗi campaign", và nó đối xử thế nào với các slot chưa có chủ?
     - Q6. Index nào giúp đọc sổ cái theo ví mà không Seq Scan (NFR-08)?
     - Q7. Id ví dùng kiểu gì? (Kiểu 64-bit → API trả id dạng chuỗi; uuid → API nhận chuỗi.)
  4. **Quy ước để code dự án dùng được** (không phải đáp án): đúng 4 tên bảng ở mục 1; cột snake_case; FK trỏ `stores(id)` (`stores` đã có, id `integer`); **không** ghi tên schema (`public.` hay schema khác); **không** `BEGIN`/`COMMIT`/`ROLLBACK`/`END`, `SET search_path`, `CREATE SCHEMA`, lệnh psql bắt đầu bằng `\`; lưu UTF-8 **không BOM**.
  5. **Cách nộp** `docs/design/bai07-ddl.sql`, 2 phần, ngăn bằng đúng 2 dòng comment:
     - `-- PART A: DDL` — `CREATE TABLE` / `CREATE INDEX` / `ALTER TABLE` của 4 bảng.
     - `-- PART B: TESTS` — dữ liệu mẫu tối thiểu rồi đúng 3 câu thử: B1 làm số dư 1 ví quán âm (phải lỗi `23514`); B2 cho 1 quán claim slot thứ 2 trong cùng campaign (phải lỗi `23505`); B3 làm số dư ví TREASURY âm (phải chạy được).
  6. **Tự kiểm** — Đạt chọn 1 trong 2 chỗ, ngang nhau:
     - (a) DB lab của Đạt qua DBX (DB học của Đạt, **Đạt tự quyết**), trong 1 schema riêng do Đạt đặt tên.
     - (b) PG hub 5434 (DBX: `localhost:5434`, DB `omnipos_hub`), schema nháp `lab07_omnipos`.
     - Cả 2: chạy `CREATE SCHEMA <tên>; SET search_path TO <tên>;` **trong DBX** (không ghi vào file), tạo `stores` giả lập (bảng của AI, chỉ để FK chạy): `CREATE TABLE stores (id serial PRIMARY KEY, name text NOT NULL); INSERT INTO stores(name) SELECT 'Quán ' || g FROM generate_series(1, 5) g;`, rồi chạy PART A, rồi từng câu PART B. Xem mã lỗi dạng `ERROR:  23514: ...` (psql: `\set VERBOSITY verbose`).
     - Đạt đạt khi: B1 → `23514`, B2 → `23505`, B3 không lỗi. Xong thì `DROP SCHEMA <tên> CASCADE`.
- Verify: `grep -ciE "CHECK *\(|UNIQUE *\(|DECIMAL|NUMERIC|REFERENCES wallets|FOR UPDATE|SKIP LOCKED" "$HUB/docs/design/bai07-ddl-worksheet.md"` → `0`.

### T4.2 — Đạt thiết kế và chạy DDL (Owner: Đạt — executor KHÔNG làm, chỉ chờ và kiểm)
- Goal: `docs/design/bai07-ddl.sql` chạy được, 3 câu thử ra đúng kết quả.
- Nhiệm vụ của Đạt: đọc đề, trả lời Q1–Q7, viết PART A + PART B, tự kiểm theo mục 6, lưu đúng đường dẫn, báo "xong Bài 07" trong chat.
- Hạn gate: **31/10 12:00**. Quá hạn → Đạt chọn: dời lịch M1 (01/11 thành ngày làm phase 5–6) hoặc giảm phạm vi (ví dụ làm transfer trước, voucher sau `m1`). Executor không tự chọn.
- Executor trong lúc chờ: **STOP**. Không viết `schema.prisma` cho 4 bảng, không seed ví, không viết naive.
- Verify (executor, khi Đạt báo xong):
```bash
F="$HUB/docs/design/bai07-ddl.sql"
test -f "$F" && grep -c '^-- PART [AB]:' "$F"                                                     # 2
grep -ciE 'create table' "$F"                                                                     # ≥ 4
grep -ciE '^\s*(begin|commit|rollback|end|set\s+search_path|create\s+schema)\b|^\s*\\' "$F"       # 0
grep -ciE '\bpublic\.' "$F"                                                                       # 0
head -c 3 "$F" | od -An -tx1                                                                      # KHÔNG phải ef bb bf
```
- Lệch ở 3 dòng cuối → gửi Đạt đúng dòng vi phạm (`grep -niE ...` cùng pattern) và chờ Đạt sửa. Đây là phản hồi bài tập, không phải Failure Protocol.

### T4.3 — Phát lại trên PG hub trong transaction rồi ROLLBACK (executor)
- Goal: xác nhận độc lập file của Đạt chạy sạch, ra đúng 2 mã lỗi, không để lại gì trong `public`.
- Steps (từ `HUB`, `source checks/lib/common.sh`):
  1. Mốc bảng `public`: `psql_hub -c "select tablename from pg_tables where schemaname='public' order by 1" > "$OUT/public-tables-before.txt" 2>&1 && test -s "$OUT/public-tables-before.txt"`.
  2. Tạo `OUT/bai07-replay-prelude.sql` đúng 7 dòng:
```sql
\set VERBOSITY verbose
\set ON_ERROR_ROLLBACK on
DROP SCHEMA IF EXISTS lab07_replay CASCADE;
BEGIN;
CREATE SCHEMA lab07_replay;
SET search_path TO lab07_replay;
CREATE TABLE stores (id serial PRIMARY KEY, name text NOT NULL); INSERT INTO stores(name) SELECT 'Quán ' || g FROM generate_series(1, 5) g;
```
  3. Chạy:
```bash
{ cat "$OUT/bai07-replay-prelude.sql"; cat docs/design/bai07-ddl.sql; echo 'ROLLBACK;'; } | docker exec -i omnipos-hub-pg psql -U postgres -d omnipos_hub > "$OUT/bai07-replay.txt" 2>&1
```
  4. Mốc sau: như bước 1 nhưng ghi `OUT/public-tables-after.txt`.
- Verify:
```bash
grep -cE "ERROR: +23514:" "$OUT/bai07-replay.txt"                                                    # đúng 1
grep -cE "ERROR: +23505:" "$OUT/bai07-replay.txt"                                                    # đúng 1
grep -E "ERROR: +[0-9A-Z]{5}:" "$OUT/bai07-replay.txt" | grep -vcE "ERROR: +(23514|23505):"         # 0
psql_hub -c "select count(*) from information_schema.schemata where schema_name='lab07_replay'"    # 0
diff "$OUT/public-tables-before.txt" "$OUT/public-tables-after.txt"                                 # không in gì
grep -cxE 'wallets|ledger_entries|voucher_campaigns|voucher_slots' "$OUT/public-tables-after.txt"   # 0
```
- Lệch 3 dòng đầu: KHÔNG sửa file của Đạt. Gửi Đạt `OUT/bai07-replay.txt` và chờ. Lệch 3 dòng cuối (hub bị bẩn) → Failure Protocol.

## Success Criteria
- [ ] Đề không lộ cột/ràng buộc; không có Q về partition (để Cụm 6)
- [ ] File của Đạt qua tiền kiểm (không transaction, không schema, không BOM)
- [ ] Replay: đúng 1 lỗi `23514`, đúng 1 lỗi `23505`, 0 lỗi khác; `public` không đổi
- [ ] Xong trước 31/10 12:00, hoặc Đạt đã chọn dời/giảm phạm vi

## Risk
| Rủi ro | Khả năng × Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Executor "giúp" bằng cách viết cột | Trung bình × Cao | Ranh giới đầu file; Verify T4.1 |
| File của Đạt có `COMMIT` → replay ghi thật vào hub | Thấp × Cao | Tiền kiểm T4.2; so bảng `public` trước/sau |
| DDL thiếu thứ phase 5 cần | Trung bình × Trung bình | Phase 5 STOP và hỏi Đạt, không tự thêm cột |
| Bài 07 tràn | Trung bình × Trung bình | Hạn 31/10 12:00, Đạt chọn dời/giảm |

## Rollback
Replay luôn `ROLLBACK` và prelude tự `DROP SCHEMA IF EXISTS lab07_replay`. Schema nháp của Đạt (5434 hoặc DB lab) do Đạt tự `DROP SCHEMA ... CASCADE`.

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

Ghi chú: kết quả sai do thiết kế của Đạt (tiền kiểm T4.2, 3 dòng đầu T4.3) là phản hồi bài tập, trả về Đạt; Failure Protocol dùng khi lệnh kiểm tự nó hỏng hoặc hub bị bẩn.
