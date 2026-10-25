// Thiết lập bộ dữ liệu thực hành Bài 12 trong schema lab12_transaction:
// - Bảng contracts: sao chép 100,000 hợp đồng đầu tiên từ lab03_indexing.hw_contracts (giữ nguyên dữ liệu Bài 3).
// - Bảng store_reps: 4 người đại diện trực cửa hàng 44 và 45 (dùng cho kịch bản Write Skew).
// - Cài extension pg_walinspect vào lab12_transaction.
// Mặc định idempotent (đã có đủ dữ liệu thì bỏ qua); truyền `--force` để dựng lại từ đầu.
import { connect, fmtBytes, fmtInt, heading, printTable } from './tx-kit.mjs';

const force = process.argv.includes('--force');
const client = await connect('lesson-12-setup');

try {
  // 1. Kiểm tra điều kiện tiên quyết từ Bài 3
  const { rows: hwCheck } = await client.query(
    `SELECT CASE WHEN to_regclass('lab03_indexing.hw_contracts') IS NULL THEN 0
                 ELSE (SELECT count(*)::int FROM lab03_indexing.hw_contracts) END AS cnt`,
  );
  if (hwCheck[0].cnt !== 500000) {
    console.error('✘ Chưa có dữ liệu Bài 3: chạy setup và homework:setup trong labs/lesson-03-index');
    process.exit(1);
  }

  const { rows: extWhere } = await client.query(
    `SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_walinspect'`,
  );
  if (extWhere.length > 0 && extWhere[0].nspname !== 'lab12_transaction') {
    console.error(`✘ pg_walinspect đang cài ở schema ${extWhere[0].nspname}, dừng lại để không làm hỏng schema khác.`);
    process.exit(1);
  }

  await client.query('CREATE SCHEMA IF NOT EXISTS lab12_transaction');
  await client.query('SET search_path = lab12_transaction');

  // 2. Kiểm tra xem dữ liệu chuẩn đã tồn tại chưa
  const { rows: stateRows } = await client.query(
    `SELECT to_regclass('lab12_transaction.contracts') IS NOT NULL AS has_c,
            to_regclass('lab12_transaction.store_reps') IS NOT NULL AS has_r,
            EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_walinspect') AS has_ext`,
  );
  let alreadyReady = false;
  if (stateRows[0].has_c && stateRows[0].has_r && stateRows[0].has_ext && !force) {
    const { rows: cnts } = await client.query(
      `SELECT (SELECT count(*)::int FROM lab12_transaction.contracts) AS c_cnt,
              (SELECT count(*)::int FROM lab12_transaction.store_reps) AS r_cnt`,
    );
    if (cnts[0].c_cnt === 100000 && cnts[0].r_cnt === 4) {
      alreadyReady = true;
    }
  }

  if (alreadyReady) {
    console.log('✔ Dữ liệu lab12_transaction đã có sẵn, bỏ qua bước tạo lại (dùng --force nếu muốn làm mới).');
  } else {
    try {
      await client.query('DROP TABLE IF EXISTS lab12_transaction.contracts, lab12_transaction.store_reps CASCADE');
    } catch (err) {
      if (err.code === '55P03') {
        const { rows: blk } = await client.query(
          `SELECT a.pid, COALESCE(NULLIF(a.application_name, ''), '(trống)') AS app, a.state
             FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
             JOIN pg_stat_activity a ON a.pid = l.pid
            WHERE c.relnamespace = 'lab12_transaction'::regnamespace AND a.pid <> pg_backend_pid()`,
        );
        console.error(
          `✘ Không thể xóa bảng do bị khóa (55P03) bởi: ${blk.map((b) => `pid=${b.pid} app=${b.app} (${b.state})`).join(', ')}`,
        );
        process.exit(1);
      }
      throw err;
    }

    await client.query(
      `CREATE TABLE lab12_transaction.contracts AS
       SELECT * FROM lab03_indexing.hw_contracts WHERE id <= 100000 ORDER BY id`,
    );
    await client.query('ALTER TABLE lab12_transaction.contracts ADD PRIMARY KEY (id)');
    await client.query('VACUUM (ANALYZE) lab12_transaction.contracts');

    await client.query(
      `CREATE TABLE lab12_transaction.store_reps (
         store_id int NOT NULL,
         rep_id int NOT NULL,
         name text NOT NULL,
         on_duty boolean NOT NULL DEFAULT true,
         PRIMARY KEY (store_id, rep_id)
       )`,
    );
    await client.query(
      `INSERT INTO lab12_transaction.store_reps (store_id, rep_id, name, on_duty) VALUES
         (44, 1, 'An', true),
         (44, 2, 'Binh', true),
         (45, 1, 'Chi', true),
         (45, 2, 'Dung', true)`,
    );
    await client.query('VACUUM (ANALYZE) lab12_transaction.store_reps');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_walinspect SCHEMA lab12_transaction');
    console.log(`✔ Đã khởi tạo xong schema lab12_transaction${force ? ' (--force)' : ''}.`);
  }

  // 3. In thẻ thông tin Dataset Card (dùng cho Homework A)
  heading('Thẻ dữ liệu Bài 12 — Schema lab12_transaction (Dataset Card)');
  const { rows: meta } = await client.query(
    `SELECT (SELECT count(*)::int FROM lab12_transaction.contracts) AS total_rows,
            pg_relation_size('lab12_transaction.contracts'::regclass)::bigint AS heap_bytes,
            pg_relation_size('lab12_transaction.contracts_pkey'::regclass)::bigint AS idx_bytes,
            (SELECT count(*)::int FROM lab12_transaction.contracts WHERE store_id = 44) AS s44,
            (SELECT count(*)::int FROM lab12_transaction.contracts WHERE store_id = 45) AS s45,
            (SELECT extversion FROM pg_extension WHERE extname = 'pg_walinspect') AS wal_ver,
            (SELECT count(*)::int FROM lab03_indexing.hw_contracts) AS l3_rows,
            (SELECT relallvisible::int FROM pg_class WHERE oid = 'lab03_indexing.hw_contracts'::regclass) AS l3_vm`,
  );
  const { rows: id1Rows } = await client.query(
    'SELECT id, code, store_id, status, total::text AS total FROM lab12_transaction.contracts WHERE id = 1',
  );
  const { rows: repRows } = await client.query(
    'SELECT store_id, rep_id, name, on_duty FROM lab12_transaction.store_reps ORDER BY store_id, rep_id',
  );
  const m = meta[0];
  const r1 = id1Rows[0];

  printTable(
    [
      { k: 'Bảng contracts', v: `${fmtInt(m.total_rows)} dòng | Heap ${fmtBytes(Number(m.heap_bytes))} | PK ${fmtBytes(Number(m.idx_bytes))}` },
      { k: 'Dòng mẫu id = 1', v: `code=${r1.code}, store_id=${r1.store_id}, status=${r1.status}, total=${r1.total}` },
      { k: 'Hợp đồng theo cửa hàng', v: `store 44 = ${m.s44} hợp đồng | store 45 = ${m.s45} hợp đồng` },
      { k: 'Bảng store_reps', v: repRows.map((x) => `(${x.store_id},${x.rep_id},${x.name},on_duty=${x.on_duty})`).join(' · ') },
      { k: 'Extension WAL', v: `pg_walinspect v${m.wal_ver} @ lab12_transaction` },
      { k: 'Fingerprint Bài 3', v: `hw_contracts=${fmtInt(m.l3_rows)} dòng, allvisible=${fmtInt(m.l3_vm)}/5,666 trang` },
    ],
    [
      ['Hạng mục', (x) => x.k],
      ['Giá trị đo trên máy', (x) => x.v],
    ],
  );
} finally {
  await client.end().catch(() => {});
}
