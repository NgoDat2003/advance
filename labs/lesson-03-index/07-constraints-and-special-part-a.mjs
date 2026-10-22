// Lab 3.07 part A — Keys are constraints, indexes are data structures (slides 19, 21).
// A. Postgres creates an index for PRIMARY KEY and UNIQUE, never for a FOREIGN KEY: orders.user_id has none.
// B. Why it matters: deleting a user (even one with no orders) fires the FK trigger, which must look for orders of
//    that user. Without an index on orders(user_id) that lookup reads the whole orders table.
// C. A UNIQUE column accepts many NULLs (NULL is "unknown", never equal to another NULL); PG 15+ can refuse the second
//    NULL with UNIQUE NULLS NOT DISTINCT.
// The DELETE and the extra index run inside BEGIN ... ROLLBACK. Part C writes only scratch tables l07_uq*.
import { inRollback, relBytes, printTable, heading, verdict, fmtInt, fmtMs } from './pg-explain-kit.mjs';

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** A: indexes on orders vs its foreign key. */
async function fkHasNoIndex(client) {
  const { rows: idx } = await client.query(
    `SELECT indexname, replace(indexdef, 'lab03_indexing.', '') AS def FROM pg_indexes
      WHERE schemaname = 'lab03_indexing' AND tablename = 'orders' ORDER BY indexname`);
  const { rows: [fk] } = await client.query(
    `SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
      WHERE conrelid = 'lab03_indexing.orders'::regclass AND contype = 'f'`);
  heading('A. Slide 19: khóa (key) ≠ index — orders có khóa ngoại nhưng không có index cho nó');
  printTable([...idx.map((i) => ['Index', i.indexname, i.def]), ['Khóa ngoại', fk.conname, fk.def]], [
    ['Loại', (r) => r[0]], ['Tên', (r) => r[1]], ['Định nghĩa', (r) => r[2]],
  ]);
  const indexed = idx.some((i) => /\(user_id[,)]/.test(i.def));
  verdict(!indexed, `pg_indexes của orders chỉ có ${idx.map((i) => i.indexname).join(', ')}: Postgres tự tạo index cho PRIMARY KEY/UNIQUE, KHÔNG cho khóa ngoại user_id (InnoDB thì có)`);
}

/** B: FK trigger cost when deleting a user with no orders, before and after CREATE INDEX ON orders (user_id). */
async function fkDeleteCost(client) {
  const { rows: [{ id }] } = await client.query(
    `SELECT u.id FROM users u WHERE u.id <= 1000
        AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id) ORDER BY u.id LIMIT 1`);
  // EXPLAIN reports the trigger's time but not its buffers, so count the pages fetched from orders and its indexes
  // through this transaction's statistics counters (they survive ROLLBACK TO SAVEPOINT).
  const ordersPages = async () => Number((await client.query(
    `SELECT sum(pg_stat_get_xact_blocks_fetched(oid))::bigint AS n FROM pg_class
      WHERE oid = 'orders'::regclass OR oid IN (SELECT indexrelid FROM pg_index WHERE indrelid = 'orders'::regclass)`,
  )).rows[0].n);
  /** One warm-up + 5 measured deletes, each undone with ROLLBACK TO SAVEPOINT. */
  const deleteOnce = async () => {
    const samples = [];
    for (let i = 0; i < 6; i++) {
      await client.query('SAVEPOINT del');
      const before = await ordersPages();
      const { rows } = await client.query(`EXPLAIN (ANALYZE, FORMAT JSON) DELETE FROM users WHERE id = ${Number(id)}`);
      const pages = (await ordersPages()) - before;
      await client.query('ROLLBACK TO SAVEPOINT del');
      const trig = (rows[0]['QUERY PLAN'][0].Triggers ?? []).find((t) => t['Constraint Name'] === 'orders_user_id_fkey');
      if (!trig) throw new Error('EXPLAIN không có dòng "Trigger for constraint orders_user_id_fkey"');
      samples.push({ ms: trig.Time, pages, calls: trig.Calls });
    }
    const measured = samples.slice(1);
    return { ms: median(measured.map((s) => s.ms)), pages: measured.at(-1).pages, calls: measured.at(-1).calls };
  };
  let res;
  try {
    res = await inRollback(client, async () => {
      const without = await deleteOnce();
      await client.query('CREATE INDEX l07_orders_user_id ON orders (user_id)');
      return { without, with: await deleteOnce() };
    });
  } finally {
    // A rolled-back DELETE still clears the all-visible bit of the heap page it touched; VACUUM sets it back so other
    // labs keep seeing Index Only Scans with Heap Fetches 0 on users. Another session's old snapshot can block that,
    // so retry for a while and say so if it never succeeds.
    let full = false;
    for (let i = 0; i < 20 && !full; i++) {
      await client.query('VACUUM lab03_indexing.users').catch(() => {});
      const { rows: [r] } = await client.query(
        "SELECT relallvisible >= relpages AS full FROM pg_class WHERE oid = 'lab03_indexing.users'::regclass");
      full = r.full;
      if (!full) await new Promise((ok) => setTimeout(ok, 500));
    }
    if (!full) console.error('! users chưa all-visible hết (có phiên khác đang giữ transaction cũ). Chạy lại: VACUUM lab03_indexing.users');
  }
  const heapPages = (await relBytes(client, 'orders')) / 8192;
  heading(`B. DELETE user id = ${id} (không có đơn nào) — thời gian trigger khóa ngoại orders_user_id_fkey`);
  printTable([['Chưa có index trên orders(user_id)', res.without], ['Có index l07_orders_user_id', res.with]], [
    ['Trường hợp', (r) => r[0]],
    ['Trigger (lần gọi)', (r) => fmtInt(r[1].calls), 'right'],
    ['Trang orders trigger đọc', (r) => fmtInt(r[1].pages), 'right'],
    ['ms trigger', (r) => fmtMs(r[1].ms), 'right'],
  ]);
  console.log('   (Đã VACUUM users: DELETE bị rollback vẫn xóa cờ all-visible của trang chứa dòng đó)');
  verdict(res.without.pages >= heapPages * 0.9 && res.with.pages < 10 && res.with.ms * 10 < res.without.ms,
    `Không có index: trigger quét cả ${fmtInt(res.without.pages)} trang orders (${fmtMs(res.without.ms)} ms) chỉ để biết user không có đơn; có index: ${res.with.pages} trang, ${fmtMs(res.with.ms)} ms → mọi FK cần tự tạo index`);
}

/** C: NULLs in a unique column, default vs NULLS NOT DISTINCT. */
async function uniqueNulls(client) {
  let nulls;
  let err = null;
  try {
    await client.query('DROP TABLE IF EXISTS l07_uq, l07_uq_nnd');
    await client.query('CREATE TABLE l07_uq (id int, email text UNIQUE)');
    await client.query('CREATE TABLE l07_uq_nnd (id int, email text UNIQUE NULLS NOT DISTINCT)');
    await client.query('INSERT INTO l07_uq VALUES (1, NULL), (2, NULL)');
    nulls = (await client.query('SELECT count(*)::int AS n FROM l07_uq WHERE email IS NULL')).rows[0].n;
    await client.query('INSERT INTO l07_uq_nnd VALUES (1, NULL)');
    try {
      await client.query('INSERT INTO l07_uq_nnd VALUES (2, NULL)');
    } catch (e) {
      err = e;
    }
  } finally {
    await client.query('DROP TABLE IF EXISTS l07_uq, l07_uq_nnd');
  }
  heading('C. Slide 21: UNIQUE vẫn nhận NULL — bảng tạm l07_uq, l07_uq_nnd');
  printTable([
    ['UNIQUE (email)', 'hai dòng email = NULL', `nhận cả ${nulls} dòng`],
    ['UNIQUE NULLS NOT DISTINCT (email)', 'dòng NULL thứ hai', err ? `lỗi ${err.code}: ${err.message}` : 'được nhận (!)'],
  ], [['Ràng buộc', (r) => r[0]], ['Thử chèn', (r) => r[1]], ['Kết quả', (r) => r[2]]]);
  verdict(nulls === 2 && err?.code === '23505',
    `UNIQUE coi hai NULL là khác nhau nên nhận ${nulls} dòng NULL; muốn chỉ một NULL thì dùng NULLS NOT DISTINCT (PG 15+) → SQLSTATE ${err?.code ?? 'không lỗi'}`);
}

export async function runConstraints(client) {
  await fkHasNoIndex(client);
  await fkDeleteCost(client);
  await uniqueNulls(client);
}
