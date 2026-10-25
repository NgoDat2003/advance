// Kiểm tra bất biến của Bài 14: schema lab14_locking chỉ giữ bảng chuẩn, không còn phiên/khóa treo,
// dữ liệu Bài 3 và Bài 12 nguyên vẹn. Cờ `--reset` xóa toàn bộ schema lab14_locking (kèm pgrowlocks).
// Tự mở kết nối riêng (không dùng lock-kit) để vẫn chạy được khi kit hoặc lab đang hỏng.
import pg from 'pg';

const S = 'lab14_locking';
const PLAYGROUND = ['contracts', 'store_wallets', 'flights', 'bookings'];
const EXPECTED = new Set([...PLAYGROUND, ...PLAYGROUND.map((t) => `${t}_pkey`), 'bookings_id_seq']);

if (!process.env.PG_URL) {
  console.error('Thiếu biến môi trường PG_URL. Hãy đặt PG_URL như Bài 3 mục 6.3.');
  process.exit(1);
}
let c;
try {
  c = new pg.Client({ connectionString: process.env.PG_URL, application_name: 'lesson-14-check' });
  c.on('error', () => {});
  await c.connect();
} catch (err) {
  // Chỉ in mã lỗi, tuyệt đối không in chuỗi kết nối.
  console.error(`Không kết nối được Postgres (${err.code ?? 'lỗi kết nối'}). Kiểm tra PG_URL hoặc: docker start quan-ly-hop-dong-postgres-1`);
  process.exit(1);
}
await c.query("SET lock_timeout = '5s'; SET statement_timeout = '30s'");
const q = async (sql, params) => (await c.query(sql, params)).rows;
// Phiên khác (psql/GUI) đang giữ khóa trên bảng lab14_locking — dùng cho H3 và khi DROP gặp 55P03.
const lockersOf = () => q(`SELECT DISTINCT l.pid, COALESCE(NULLIF(a.application_name,''),'(trống)') AS app, c.relname, l.mode
  FROM pg_locks l JOIN pg_class c ON c.oid = l.relation JOIN pg_stat_activity a ON a.pid = l.pid
  WHERE c.relnamespace = to_regnamespace($1) AND l.pid <> pg_backend_pid() ORDER BY l.pid`, [S]);
// DROP bị khóa lạ chặn (55P03 sau lock_timeout 5s): in pid/app người giữ thay vì stack trace, rồi exit 1.
async function dropOrExplain(sql) {
  try { await c.query(sql); } catch (err) {
    if (err.code !== '55P03') throw err;
    const who = (await lockersOf()).map((l) => `pid=${l.pid} app=${l.app} giữ ${l.mode} trên ${l.relname}`);
    console.error(`✘ 55P03: không xóa được vì phiên khác đang giữ khóa: ${who.join('; ') || '(đã nhả)'} — hãy ROLLBACK cửa sổ đó rồi chạy lại`);
    await c.end();
    process.exit(1);
  }
}

if (process.argv.includes('--reset')) {
  await c.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity
                  WHERE datname = current_database() AND pid <> pg_backend_pid() AND application_name LIKE 'lesson-14%'`);
  await dropOrExplain(`DROP SCHEMA IF EXISTS ${S} CASCADE`);
  console.log('Đã xóa toàn bộ schema lab14_locking (kèm pgrowlocks). Chạy lại: npm run setup');
  await c.end();
  process.exit(0);
}

let failed = false;
const line = (ok, msg) => { console.log(`${ok ? '✔' : '✘'} ${msg}`); if (!ok) failed = true; };
console.log('\n== Kiểm tra bất biến môi trường Bài 14 (lab14_locking) ==');

const [{ ok: hasSchema }] = await q(`SELECT to_regnamespace('${S}') IS NOT NULL AS ok`);
if (!hasSchema) {
  line(false, 'H1 chưa có schema lab14_locking (chạy: npm run setup)');
  await c.end();
  process.exit(1);
}

// Phiên lesson-14 khác còn sống? (dùng cho H1 và H3)
const others = await q(`SELECT pid, application_name AS app FROM pg_stat_activity
                         WHERE datname = current_database() AND pid <> pg_backend_pid() AND application_name LIKE 'lesson-14%'`);

// H1: dọn bảng nháp mồ côi (lab bị tắt ngang) chỉ khi không còn phiên lesson-14 nào sống, rồi so danh sách đối tượng.
const orphans = await q(`SELECT relname FROM pg_class WHERE relnamespace = '${S}'::regnamespace AND relkind = 'r'
                          AND relname ~ '^(l[0-9]{2}_|hw_)' ORDER BY relname`);
if (orphans.length && others.length === 0) {
  for (const o of orphans) {
    await dropOrExplain(`DROP TABLE IF EXISTS ${S}.${o.relname} CASCADE`);
    console.log(`  đã dọn bảng nháp mồ côi: ${o.relname}`);
  }
}
const names = (await q(`SELECT relname FROM pg_class WHERE relnamespace = '${S}'::regnamespace
                         AND relkind IN ('r','i','S') ORDER BY relname`)).map((r) => r.relname);
const extra = names.filter((n) => !EXPECTED.has(n));
const missing = [...EXPECTED].filter((n) => !names.includes(n));
line(extra.length === 0 && missing.length === 0,
  `H1 đối tượng trong lab14_locking: ${names.length} ${extra.length ? `| dư: ${extra.join(', ')}` : ''}${missing.length ? `| thiếu: ${missing.join(', ')}` : ''}`);

// H2: vị trí extension
const ext = Object.fromEntries((await q(`SELECT e.extname, n.nspname FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname IN ('pgrowlocks','pageinspect','pgstattuple','pg_trgm','pg_walinspect')`)).map((r) => [r.extname, r.nspname]));
line(ext.pgrowlocks === S && ext.pageinspect === 'lab03_indexing' && ext.pgstattuple === 'lab03_indexing'
  && ext.pg_trgm === 'lab03_indexing' && ext.pg_walinspect === 'lab12_transaction',
  `H2 extension: ${Object.entries(ext).map(([k, v]) => `${k}@${v}`).sort().join(', ')}`);

// H3: không còn phiên lesson-14 khác; không phiên nào khác giữ khóa trên bảng lab14_locking
const lockers = await lockersOf();
const bad = [...others.map((o) => `pid=${o.pid} app=${o.app} (phiên lab còn sống)`),
  ...lockers.map((l) => `pid=${l.pid} app=${l.app} giữ ${l.mode} trên ${l.relname}`)];
line(bad.length === 0, bad.length ? `H3 còn phiên giữ tài nguyên: ${bad.join('; ')}` : 'H3 không còn phiên lesson-14 hay khóa lạ trên lab14_locking');

// H4: dữ liệu Bài 3 và Bài 12 nguyên vẹn (chỉ đọc). to_regclass trước: schema bài trước bị reset thì báo ✘ thay vì lỗi 42P01.
const [reg] = await q(`SELECT to_regclass('lab03_indexing.hw_contracts') IS NOT NULL AS l03,
  to_regclass('lab12_transaction.contracts') IS NOT NULL AND to_regclass('lab12_transaction.store_reps') IS NOT NULL AS l12`);
if (!reg.l03 || !reg.l12) {
  line(false, `H4 chưa có dữ liệu bài trước:${reg.l03 ? '' : ' lab03_indexing.hw_contracts (chạy setup Bài 3)'}${reg.l12 ? '' : ' lab12_transaction (chạy setup Bài 12)'}`);
} else {
  const [h4] = await q(`SELECT (SELECT count(*)::int FROM lab03_indexing.hw_contracts) AS hw,
    (SELECT count(*)::int FROM lab12_transaction.contracts) AS c12, (SELECT count(*)::int FROM lab12_transaction.store_reps) AS r12`);
  line(h4.hw === 500000 && h4.c12 === 100000 && h4.r12 === 4,
    `H4 dữ liệu bài trước: hw_contracts=${h4.hw}, lab12 contracts=${h4.c12}, store_reps=${h4.r12}`);
}

// H5: search_path mức database giữ nguyên
const sp = await q(`SELECT s.setconfig FROM pg_db_role_setting s JOIN pg_database d ON d.oid = s.setdatabase
                     WHERE d.datname = current_database() AND s.setrole = 0`);
const spText = JSON.stringify(sp[0]?.setconfig ?? []);
line(spText === '["search_path=lab03_indexing, public"]', `H5 DB search_path: ${spText}`);

// H6: số dòng bảng chuẩn + cảnh báo khi bảng thực hành bị sửa tay
if (missing.length === 0) {
  const [h6] = await q(`SELECT (SELECT count(*)::int FROM ${S}.contracts) AS c, (SELECT count(*)::int FROM ${S}.store_wallets) AS w,
    (SELECT count(*)::int FROM ${S}.flights) AS f`);
  line(h6.c === 1000 && h6.w === 3 && h6.f === 2, `H6 số dòng: contracts=${h6.c}, store_wallets=${h6.w}, flights=${h6.f}`);
  const [d] = await q(`SELECT (SELECT string_agg(balance::text, '/' ORDER BY id) FROM ${S}.store_wallets) AS wal,
    (SELECT string_agg(seats || ':' || version, '/' ORDER BY id) FROM ${S}.flights) AS fl,
    (SELECT count(*)::int FROM ${S}.bookings) AS bk,
    (SELECT bool_and(c.total = h.total) FROM ${S}.contracts c JOIN lab03_indexing.hw_contracts h USING (id) WHERE c.id <= 2) AS tot`);
  if (d.wal !== '50/0/0' || d.fl !== '2:0/2:0' || d.bk !== 0 || d.tot !== true) {
    console.log(`⚠ bảng thực hành đã bị sửa tay (ví ${d.wal}, chuyến bay ${d.fl}, bookings ${d.bk}). Khôi phục: npm run setup -- --force`);
  }
} else {
  line(false, 'H6 chưa kiểm được số dòng vì thiếu bảng chuẩn');
}

await c.end();
process.exit(failed ? 1 : 0);
