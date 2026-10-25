// Bộ công cụ gọn cho các lab Bài 14 (Locking). Không có "bộ điều phối": mỗi lab tự viết từng dòng await A.query(...)
// giống hệt bảng bước bạn gõ trong 2 cửa sổ psql. Kit chỉ lo: mở phiên an toàn, xác nhận "đang chờ khóa", dọn dẹp, in kết quả.
import pg from 'pg';

const S = 'lab14_locking';
export const jsonMode = process.argv.includes('--json');
const say = (...a) => { if (!jsonMode) console.log(...a); };

/** Mở 1 phiên với 4 lệnh SET an toàn (search_path riêng vì DB mặc định trỏ vào lab03_indexing). Không bao giờ in PG_URL. */
export async function connect(app) {
  if (!process.env.PG_URL) { console.error('Thiếu biến môi trường PG_URL. Hãy đặt PG_URL như Bài 3 mục 6.3.'); process.exit(1); }
  let c;
  try {
    c = new pg.Client({ connectionString: process.env.PG_URL, application_name: app });
    let told = false; // phiên bị server ngắt (57P01, 25P03 idle timeout…): in nguyên nhân 1 lần, Node không sập
    c.on('error', (e) => { if (!told) { told = true; console.error(`phiên ${app} bị ngắt: ${e.code ?? ''} ${e.message}`); } });
    c.on('notice', () => {}); // nuốt NOTICE (vd DROP … IF EXISTS) để output gọn
    await c.connect();
  } catch (err) {
    console.error(`Không kết nối được Postgres (${err.code ?? 'lỗi kết nối'}). Kiểm tra PG_URL hoặc: docker start quan-ly-hop-dong-postgres-1`);
    process.exit(1);
  }
  await c.query(`SET search_path = ${S}; SET lock_timeout = '5s'; SET statement_timeout = '30s'; SET idle_in_transaction_session_timeout = '20s'`);
  return c;
}

const openLabs = new Set();

/** Mở phiên quan sát O (tự commit) + các vai A, B, …; in lại mọi câu lệnh của vai dạng `A› <sql>`. */
export async function openLab(name, roles = ['A', 'B']) {
  const app = `lesson-14-${name}`;
  const prefix = name === 'hw' ? 'hw_' : `l${name}_`;
  const O = await connect(`${app}-O`);
  const { rows: [hasSchema] } = await O.query('SELECT to_regnamespace($1) IS NOT NULL AS ok', [S]);
  if (!hasSchema.ok) { console.error('Chưa có schema lab14_locking — chạy: npm run setup'); await O.end(); process.exit(1); }
  const lab = { O, pid: { O: (await O.query('SELECT pg_backend_pid() AS p')).rows[0].p } };
  for (const r of roles) {
    const c = await connect(`${app}-${r}`);
    lab.pid[r] = (await c.query('SELECT pg_backend_pid() AS p')).rows[0].p;
    const raw = c.query.bind(c);
    c.query = (sql, ...rest) => { if (typeof sql === 'string') say(`${r}› ${sql}`); return raw(sql, ...rest); };
    lab[r] = c;
  }
  // Cảnh báo nếu cửa sổ psql/GUI nào đang giữ khóa trên lab14_locking (sẽ làm lab chờ lạ).
  const { rows: foreign } = await O.query(`SELECT DISTINCT l.pid, COALESCE(NULLIF(a.application_name,''),'(trống)') AS app
    FROM pg_locks l JOIN pg_class c ON c.oid = l.relation JOIN pg_stat_activity a ON a.pid = l.pid
    WHERE c.relnamespace = '${S}'::regnamespace AND a.application_name NOT LIKE 'lesson-14%'`);
  for (const f of foreign) say(`⚠ phiên lạ pid=${f.pid} app=${f.app} đang giữ khóa trên lab14_locking — hãy ROLLBACK cửa sổ đó`);

  let done = null;
  lab.close = () => (done ??= (async () => {
    openLabs.delete(lab.close);
    // Hủy câu lệnh đang chờ khóa của chính các vai trước (Ctrl+C giữa lúc chờ): ROLLBACK không phải xếp sau nó.
    await O.query(`SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE pid = ANY($1) AND state = 'active'`,
      [roles.map((r) => lab.pid[r])]).catch(() => {});
    for (const r of roles) { await lab[r].query('ROLLBACK').catch(() => {}); await lab[r].end().catch(() => {}); }
    await O.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity
      WHERE datname = current_database() AND pid <> pg_backend_pid() AND application_name LIKE $1`, [`${app}-%`]).catch(() => {});
    const { rows } = await O.query(`SELECT relname FROM pg_class WHERE relnamespace = '${S}'::regnamespace
      AND relkind IN ('r','S') AND starts_with(relname, $1)`, [prefix]).catch(() => ({ rows: [] }));
    for (const t of rows) await O.query(`DROP TABLE IF EXISTS ${S}.${t.relname} CASCADE`).catch(() => {});
    await O.end().catch(() => {});
  })());
  openLabs.add(lab.close);
  if (openLabs.size === 1 && !process.listenerCount('SIGINT')) {
    process.on('SIGINT', async () => {
      for (const close of [...openLabs]) await close();
      console.log('\nĐã ROLLBACK và đóng phiên an toàn.');
      process.exit(130);
    });
  }
  return lab;
}

/** Hỏi O xem phiên `pid` có đang chờ khóa không (poll 20 ms). `unless`: promise của chính câu lệnh — xong trước thì không bị chặn. */
export async function waitBlocked(O, pid, pidMap, { ms = 3000, unless } = {}) {
  let settled = false;
  unless?.then(() => { settled = true; }, () => { settled = true; });
  const roleOf = Object.fromEntries(Object.entries(pidMap).map(([r, p]) => [p, r]));
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (settled) return { blocked: false };
    const { rows } = await O.query(`SELECT wait_event_type, wait_event, pg_blocking_pids(pid) AS b,
      (SELECT json_object_agg(pid, COALESCE(NULLIF(application_name,''),'(trống)')) FROM pg_stat_activity) AS apps
      FROM pg_stat_activity WHERE pid = $1`, [pid]);
    const r = rows[0];
    if (r?.wait_event_type === 'Lock') {
      const blockers = r.b.map((p) => roleOf[p] ?? `phiên lạ pid=${p} app=${r.apps?.[p] ?? '?'}`);
      return { blocked: true, waitEvent: `Lock/${r.wait_event}`, blockers };
    }
    await new Promise((res) => setTimeout(res, 20));
  }
  return { blocked: false };
}

/** Bọc promise của 1 câu lệnh: không bao giờ throw, trả về kết quả hoặc mã lỗi SQLSTATE. */
export async function settle(promise) {
  const t0 = performance.now();
  try {
    const r = await promise;
    return { ok: true, rowCount: r.rowCount, rows: r.rows, ms: performance.now() - t0 };
  } catch (e) {
    return { ok: false, code: e.code, message: e.message, detail: e.detail, rows: [], ms: performance.now() - t0 };
  }
}

/** Đổi `process <pid>` trong DETAIL của 40P01 thành tên vai A/B, che số transaction. */
export function rolesInDetail(text = '', pidMap = {}) {
  const roleOf = Object.fromEntries(Object.entries(pidMap).map(([r, p]) => [String(p), r]));
  return text.replace(/(process) (\d+)/gi, (_, w, p) => `${w} ${roleOf[p] ?? '?'}`).replace(/transaction \d+/g, 'transaction <xid>');
}

export function heading(text) { say(`\n== ${text} ==`); }
export function verdict(ok, text) { say(`${ok ? '✔' : '✘'} ${text}`); return ok; }
export function printTable(rows, cols) {
  if (jsonMode) return;
  const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)));
  const line = (vals) => vals.map((v, i) => String(v ?? '').padEnd(w[i])).join(' │ ');
  console.log(line(cols)); console.log(w.map((n) => '─'.repeat(n)).join('─┼─'));
  for (const r of rows) console.log(line(cols.map((c) => r[c])));
}
export function emitJson(payload) { if (jsonMode) console.log(JSON.stringify(payload, null, 2)); }
