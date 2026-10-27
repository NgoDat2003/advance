-- Bài 07 · Chặng 9 · Sổ cái kép (double-entry ledger): wallets + transfers + ledger_entries.
-- Gom lại cả bài: table template (slide 20), tiền bằng numeric (slide 23), cột tham chiếu đặt ở entity sinh sau (slide 12),
-- phi chuẩn hóa có đối soát (slide 10), và khóa đúng thứ tự của Bài 14.
-- Cách chạy trong DBX: bôi đen từng region theo thứ tự rồi Run Selection. Mỗi region "attack" kết thúc bằng một lỗi cố ý.

-- #region ddl · Ba bảng, một ràng buộc "mỗi giao dịch tổng bằng 0", một hàm ghi sổ
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS ledger_entries, transfers, wallets;
CREATE TABLE wallets (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code           text NOT NULL UNIQUE,
  owner          text NOT NULL,
  balance        numeric(18,2) NOT NULL DEFAULT 0,     -- số dư CACHE (phi chuẩn hóa); sự thật nằm ở ledger_entries
  allow_negative boolean NOT NULL DEFAULT false,       -- chỉ ví hệ thống (tiền mặt nạp vào) được âm
  version        int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (allow_negative OR balance >= 0)               -- lưới an toàn cuối của Bài 14 (23514)
);
CREATE TABLE transfers (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,                -- gọi lại cùng request không ghi sổ hai lần
  order_ref       text,                                -- tham chiếu tới đơn hàng (slide 12), NULL nếu là nạp tiền
  amount          numeric(18,2) NOT NULL CHECK (amount > 0),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ledger_entries (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transfer_id bigint NOT NULL REFERENCES transfers (id),
  wallet_id   bigint NOT NULL REFERENCES wallets (id),
  amount      numeric(18,2) NOT NULL CHECK (amount <> 0),   -- âm = ghi nợ (tiền ra), dương = ghi có (tiền vào)
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON ledger_entries (wallet_id);
CREATE INDEX ON ledger_entries (transfer_id);
-- Kiểm tra "tổng các bút toán của một giao dịch = 0" lúc COMMIT (DEFERRED): code có thể ghi hai bút toán bằng hai câu lệnh riêng,
-- sau câu đầu tổng tạm thời khác 0. (post_transfer ghi cả hai trong MỘT câu INSERT nên kiểm tức thì cũng qua.)
CREATE OR REPLACE FUNCTION ledger_check_balanced() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT sum(amount) FROM lab07_modeling.ledger_entries WHERE transfer_id = NEW.transfer_id) <> 0 THEN
    RAISE EXCEPTION 'giao dịch % lệch: tổng bút toán khác 0', NEW.transfer_id USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER ledger_balanced AFTER INSERT ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledger_check_balanced();
-- Sổ cái chỉ được THÊM: sửa sai bằng bút toán đảo (refund), không UPDATE/DELETE bút toán cũ.
CREATE OR REPLACE FUNCTION ledger_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries chỉ được thêm, không được %', TG_OP USING ERRCODE = '23001';
END $$;
CREATE TRIGGER ledger_no_update_delete BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION ledger_append_only();
-- Ghi một giao dịch chuyển tiền: khóa 2 ví theo thứ tự id (Bài 14), ghi 2 bút toán, cập nhật số dư cache.
CREATE OR REPLACE FUNCTION post_transfer(p_from bigint, p_to bigint, p_amount numeric, p_key text, p_order_ref text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE v_id bigint;
BEGIN
  PERFORM 1 FROM lab07_modeling.wallets WHERE id IN (p_from, p_to) ORDER BY id FOR UPDATE;
  INSERT INTO lab07_modeling.transfers (idempotency_key, order_ref, amount) VALUES (p_key, p_order_ref, p_amount) RETURNING id INTO v_id;
  INSERT INTO lab07_modeling.ledger_entries (transfer_id, wallet_id, amount) VALUES (v_id, p_from, -p_amount), (v_id, p_to, p_amount);
  UPDATE lab07_modeling.wallets SET balance = balance - p_amount, version = version + 1, updated_at = now() WHERE id = p_from;  -- trừ trước
  UPDATE lab07_modeling.wallets SET balance = balance + p_amount, version = version + 1, updated_at = now() WHERE id = p_to;    -- cộng sau
  RETURN v_id;
END $$;
-- #endregion

-- #region post · Nạp tiền rồi mua hàng: mỗi giao dịch là 2 bút toán có tổng bằng 0
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
TRUNCATE ledger_entries, transfers, wallets RESTART IDENTITY;
INSERT INTO wallets (code, owner, allow_negative) VALUES ('SYSTEM_CASH', 'Tiền mặt nạp vào hệ thống', true),
                                                         ('STORE_Q7', 'MayCha Quận 7', false), ('CUS_DAT', 'Khách Đạt', false);
SELECT post_transfer(1, 3, 100000, 'topup-001');                     -- Đạt nạp 100.000 tiền mặt
SELECT post_transfer(3, 2, 45000, 'order-DH001', 'DH001');           -- Đạt mua ly trà sữa 45.000 ở Q7
SELECT t.idempotency_key, e.wallet_id, w.code, e.amount
FROM ledger_entries e JOIN transfers t ON t.id = e.transfer_id JOIN wallets w ON w.id = e.wallet_id ORDER BY e.id;
SELECT id, code, balance FROM wallets ORDER BY id;
-- Ba bất biến của sổ cái kép:
SELECT (SELECT count(*) FROM (SELECT transfer_id FROM ledger_entries GROUP BY transfer_id HAVING sum(amount) <> 0) x) AS giao_dich_lech,
       (SELECT sum(amount) FROM ledger_entries) AS tong_moi_but_toan,
       (SELECT count(*) FROM wallets w WHERE balance <> (SELECT coalesce(sum(amount), 0) FROM ledger_entries e WHERE e.wallet_id = w.id)) AS vi_lech_cache;
-- #endregion

-- #region attack-overdraft · Tấn công 1: mua quá số dư
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT balance AS so_du_cua_dat FROM wallets WHERE id = 3;
SELECT post_transfer(3, 2, 999999, 'order-DH002', 'DH002');
-- #endregion

-- #region attack-unbalanced · Tấn công 2: code lỗi chỉ ghi một bút toán (tiền tự sinh ra)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
BEGIN;
INSERT INTO transfers (idempotency_key, amount) VALUES ('bug-001', 50000);
INSERT INTO ledger_entries (transfer_id, wallet_id, amount) SELECT id, 3, 50000 FROM transfers WHERE idempotency_key = 'bug-001';
SELECT 'chưa lỗi: trigger DEFERRED chỉ kiểm tra lúc COMMIT' AS ghi_chu;
COMMIT;
-- #endregion

-- #region attack-duplicate · Tấn công 3: client gửi lại cùng request (mạng chập chờn, bấm 2 lần)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT count(*) AS so_giao_dich_DH001 FROM transfers WHERE idempotency_key = 'order-DH001';
SELECT post_transfer(3, 2, 45000, 'order-DH001', 'DH001');
-- #endregion

-- #region attack-edit · Tấn công 4: sửa thẳng một bút toán cũ để "chữa cháy"
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
UPDATE ledger_entries SET amount = -40000 WHERE id = 3;
-- #endregion

-- #region reconcile · Số dư cache bị ai đó sửa tay: đối soát phát hiện và sửa lại từ sổ cái
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
UPDATE wallets SET balance = balance + 5000 WHERE id = 2;   -- lỗi vận hành: "cộng bù" thẳng vào số dư, không qua sổ
SELECT w.id, w.code, w.balance AS so_du_cache, coalesce(sum(e.amount), 0) AS so_du_theo_so_cai
FROM wallets w LEFT JOIN ledger_entries e ON e.wallet_id = w.id GROUP BY w.id ORDER BY w.id;
SELECT count(*) AS lech FROM wallets w WHERE balance <> (SELECT coalesce(sum(amount), 0) FROM ledger_entries e WHERE e.wallet_id = w.id);
-- Sửa: sự thật là sổ cái; số dư cache được tính lại từ sổ.
UPDATE wallets w SET balance = (SELECT coalesce(sum(amount), 0) FROM ledger_entries e WHERE e.wallet_id = w.id), updated_at = now()
WHERE balance <> (SELECT coalesce(sum(amount), 0) FROM ledger_entries e WHERE e.wallet_id = w.id);
SELECT count(*) AS lech FROM wallets w WHERE balance <> (SELECT coalesce(sum(amount), 0) FROM ledger_entries e WHERE e.wallet_id = w.id);
-- #endregion

-- #region kiem-chung · Bảng ✔/✘ của chặng 9 (giống C09–C12 của check.sql)
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
SELECT 'K9.1' AS ma, CASE WHEN count(*) = 0 THEN '✔' ELSE '✘' END AS ket_qua, 'không giao dịch nào lệch (tổng bút toán = 0)' AS chi_tiet
FROM (SELECT transfer_id FROM ledger_entries GROUP BY transfer_id HAVING sum(amount) <> 0) x
UNION ALL
SELECT 'K9.2', CASE WHEN (SELECT coalesce(sum(amount), 0) FROM ledger_entries) = 0 THEN '✔' ELSE '✘' END, 'tổng mọi bút toán của hệ thống = 0'
UNION ALL
SELECT 'K9.3', CASE WHEN count(*) = 0 THEN '✔' ELSE '✘' END, 'số dư cache khớp tổng bút toán của từng ví'
FROM wallets w WHERE balance <> (SELECT coalesce(sum(amount), 0) FROM ledger_entries e WHERE e.wallet_id = w.id)
UNION ALL
SELECT 'K9.4', CASE WHEN count(*) = 0 THEN '✔' ELSE '✘' END, 'không ví khách nào bị âm' FROM wallets WHERE balance < 0 AND NOT allow_negative
UNION ALL
SELECT 'K9.5', CASE WHEN (SELECT count(*) FROM transfers WHERE idempotency_key = 'order-DH001') = 1 THEN '✔' ELSE '✘' END,
       'request DH001 gửi 2 lần chỉ ghi sổ 1 lần';
-- #endregion
