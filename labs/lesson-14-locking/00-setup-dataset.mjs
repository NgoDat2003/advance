// Dựng dữ liệu Bài 14 (Locking) trong schema riêng lab14_locking:
// - contracts     : chép 1.000 hợp đồng đầu tiên từ lab03_indexing.hw_contracts (dữ liệu Bài 3 chỉ được ĐỌC).
// - store_wallets : 3 ví cửa hàng A = 50, B = 0, C = 0 (bài toán chuyển tiền slide 2).
// - flights       : VN123 và VN456, mỗi chuyến 2 ghế, version = 0 (bài tập đặt vé slide 22).
// - bookings      : vé đã đặt, khóa ngoại tới flights.
// - pgrowlocks    : extension xem khóa dòng, cài ngay trong lab14_locking (npm run reset sẽ gỡ cùng schema).
// Chạy lại nhiều lần an toàn. `-- --force` dựng lại từ đầu (khôi phục sau khi bạn nghịch tay bằng psql).
import pg from 'pg';

const S = 'lab14_locking';
const force = process.argv.includes('--force');

if (!process.env.PG_URL) {
  console.error('Thiếu biến môi trường PG_URL. Hãy đặt PG_URL như Bài 3 mục 6.3.');
  process.exit(1);
}
let c;
try {
  c = new pg.Client({ connectionString: process.env.PG_URL, application_name: 'lesson-14-setup' });
  c.on('error', () => {});
  await c.connect();
} catch (err) {
  console.error(`Không kết nối được Postgres (${err.code ?? 'lỗi kết nối'}). Kiểm tra PG_URL hoặc: docker start quan-ly-hop-dong-postgres-1`);
  process.exit(1);
}
// Chờ khóa tối đa 5 s: nếu cửa sổ psql/GUI nào đang giữ khóa thì báo lỗi thay vì treo.
await c.query(`SET search_path = ${S}; SET lock_timeout = '5s'; SET statement_timeout = '60s'`);
const one = async (sql) => (await c.query(sql)).rows[0];

try {
  const { n } = await one('SELECT count(*)::int AS n FROM lab03_indexing.hw_contracts');
  if (n !== 500000) {
    console.error(`lab03_indexing.hw_contracts có ${n} dòng (cần 500.000). Hãy chạy lại npm run setup của Bài 3.`);
    process.exit(1);
  }

  const { exists } = await one(`SELECT to_regnamespace('${S}') IS NOT NULL AS exists`);
  if (exists && !force) {
    // Kiểm tra đủ 4 bảng TRƯỚC (to_regclass trả NULL thay vì lỗi 42P01), chỉ đếm dòng khi bảng có thật.
    const { present } = await one(`SELECT to_regclass('${S}.contracts') IS NOT NULL AND to_regclass('${S}.store_wallets') IS NOT NULL
      AND to_regclass('${S}.flights') IS NOT NULL AND to_regclass('${S}.bookings') IS NOT NULL AS present`);
    const ok = present && (await one(`SELECT (SELECT count(*) FROM ${S}.contracts) = 1000
      AND (SELECT count(*) FROM ${S}.store_wallets) = 3 AND (SELECT count(*) FROM ${S}.flights) = 2 AS ok`)).ok;
    if (!present) console.log('Thiếu bảng thực hành trong lab14_locking (có thể đã bị xóa tay) → dựng lại từ đầu.');
    if (ok) {
      console.log('Bỏ qua: đã có dữ liệu lab14_locking. Muốn dựng lại từ đầu: npm run setup -- --force');
      process.exit(0);
    }
  }

  await c.query('BEGIN');
  if (exists) await c.query(`DROP SCHEMA ${S} CASCADE`);
  await c.query(`CREATE SCHEMA ${S}`);
  await c.query(`CREATE EXTENSION pgrowlocks SCHEMA ${S}`);
  // Không tạo index trên store_id: Lab 04 cần UPDATE theo cột không có index.
  await c.query(`CREATE TABLE contracts AS
    SELECT id, code, customer_id, store_id, status, signed_at, total
      FROM lab03_indexing.hw_contracts WHERE id <= 1000`);
  await c.query('ALTER TABLE contracts ADD PRIMARY KEY (id)');
  // Cố ý KHÔNG có CHECK (balance >= 0): Lab 01 cho thấy số dư có thể âm khi kiểm tra sai chỗ.
  await c.query('CREATE TABLE store_wallets (id int PRIMARY KEY, owner text NOT NULL, balance int NOT NULL)');
  await c.query("INSERT INTO store_wallets VALUES (1, 'A', 50), (2, 'B', 0), (3, 'C', 0)");
  await c.query(`CREATE TABLE flights (id int PRIMARY KEY, code text NOT NULL,
    seats int NOT NULL, version int NOT NULL DEFAULT 0)`);
  await c.query("INSERT INTO flights VALUES (1, 'VN123', 2, 0), (2, 'VN456', 2, 0)");
  await c.query(`CREATE TABLE bookings (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    flight_id int NOT NULL REFERENCES flights, passenger text NOT NULL)`);
  await c.query('ANALYZE contracts');
  await c.query('COMMIT');

  // Thẻ dữ liệu (dataset card) để bạn đối chiếu khi làm bài.
  const card = await one(`SELECT (SELECT count(*)::int FROM contracts) AS contracts,
    (SELECT string_agg(id || ': ' || code || ', cửa hàng ' || store_id || ', ' || status || ', total ' || total, ' | ' ORDER BY id)
       FROM contracts WHERE id <= 2) AS id12,
    (SELECT count(*)::int FROM contracts WHERE store_id = 44) AS store44,
    (SELECT string_agg(owner || '=' || balance, ', ' ORDER BY id) FROM store_wallets) AS wallets,
    (SELECT string_agg(code || ' ' || seats || ' ghế (v' || version || ')', ', ' ORDER BY id) FROM flights) AS flights`);
  console.log('\n== Thẻ dữ liệu Bài 14 (schema lab14_locking) ==');
  console.log(`contracts      : ${card.contracts} dòng (chép từ lab03_indexing.hw_contracts, id ≤ 1.000)`);
  console.log(`id 1 và 2      : ${card.id12}`);
  console.log(`cửa hàng 44    : ${card.store44} hợp đồng (store_id không có index)`);
  console.log(`store_wallets  : ${card.wallets}`);
  console.log(`flights        : ${card.flights}`);
  console.log('bookings       : 0 vé');
  console.log('pgrowlocks     : đã cài trong lab14_locking');
} catch (err) {
  await c.query('ROLLBACK').catch(() => {});
  const why = err.code === '55P03' ? ' — có phiên khác (psql/GUI) đang giữ khóa trên lab14_locking, hãy ROLLBACK cửa sổ đó' : '';
  console.error(`Dựng dữ liệu thất bại: ${err.code ?? ''} ${err.message}${why}`);
  process.exitCode = 1;
} finally {
  await c.end();
}
