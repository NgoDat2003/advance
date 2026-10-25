// Bộ công cụ dùng chung cho các bài lab Bài 12 (Transaction & MVCC).
// Quy ước in ấn: chỉ <n> ms, pid=<n>, xid=/xmin=/xmax=<n>, X/Y LSN và các cột bảng ms/pid/xid/xmin/xmax/t_xmin/t_xmax/Δ LSN được phép thay đổi giữa các lần chạy.
import pg from 'pg';

export const jsonMode = process.argv.includes('--json');

/**
 * Mở một kết nối PostgreSQL với cấu hình an toàn cho Bài 12:
 * - SET search_path = lab12_transaction (vì advance_be_lab có search_path mặc định trỏ vào lab03_indexing)
 * - SET lock_timeout = '5s', statement_timeout = '60s', idle_in_transaction_session_timeout = '20s'
 * - Gắn listener error và notice để không làm sập tiến trình Node khi phiên bị ngắt chủ động.
 */
export async function connect(app = 'lesson-12-lab') {
  const { PG_URL } = process.env;
  if (!PG_URL) {
    console.error('Thiếu biến môi trường PG_URL. Hãy đặt PG_URL như Bài 3 mục 6.3.');
    process.exit(1);
  }
  let client;
  try {
    client = new pg.Client({ connectionString: PG_URL, application_name: app });
    client.events = [];
    client.notices = [];
    client.on('error', (err) => {
      client.events.push({ code: err.code ?? 'ERR', message: err.message });
    });
    client.on('notice', (msg) => {
      client.notices.push({ code: msg.code ?? 'NOTICE', message: msg.message });
    });
    await client.connect();
  } catch (err) {
    const hint = err.code === 'ERR_INVALID_URL'
      ? 'PG_URL sai định dạng (ký tự đặc biệt trong mật khẩu phải được URL-encode)'
      : 'Container đang chạy chưa? docker start quan-ly-hop-dong-postgres-1';
    console.error(`Không kết nối được Postgres (${err.code ?? 'lỗi kết nối'}). ${hint}`);
    process.exit(1);
  }
  await client.query('SET search_path = lab12_transaction');
  await client.query("SET lock_timeout = '5s'");
  await client.query("SET statement_timeout = '60s'");
  await client.query("SET idle_in_transaction_session_timeout = '20s'");
  await client.query('SET jit = off');
  return client;
}

const activeLabs = new Set();

/** Mở các phiên A, B (hoặc danh sách tùy chọn) kèm phiên quan sát O (autocommit). */
export async function openLab(name, roles = ['A', 'B']) {
  const O = await connect(`lesson-12-${name}-O`);
  const clients = { O };
  const pid = {};
  const events = { O: O.events };
  const { rows: oPid } = await O.query('SELECT pg_backend_pid() AS p');
  pid.O = oPid[0].p;

  for (const r of roles) {
    const c = await connect(`lesson-12-${name}-${r}`);
    clients[r] = c;
    events[r] = c.events;
    const { rows } = await c.query('SELECT pg_backend_pid() AS p');
    pid[r] = rows[0].p;
  }

  let closePromise = null;
  const closeAll = (interrupted = false) => (closePromise ??= (async () => {
    activeLabs.delete(closeAll);
    if (!interrupted) {
      for (const r of roles) {
        await clients[r].query('ROLLBACK').catch(() => {});
        await clients[r].end().catch(() => {});
      }
    }
    await O.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
        WHERE datname = current_database() AND pid <> pg_backend_pid() AND application_name LIKE $1`,
      [`lesson-12-${name}-%`],
    ).catch(() => {});
    await waitUntil(async () => {
      const { rows } = await O.query(
        'SELECT count(*)::int AS c FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() AND application_name LIKE $1',
        [`lesson-12-${name}-%`],
      );
      return rows[0].c === 0;
    }, 2000).catch(() => {});
    const { rows: scr } = await O.query("SELECT relname, relkind FROM pg_class WHERE relnamespace = to_regnamespace('lab12_transaction') AND relkind IN ('r','S') AND relname ~ '^(l[0-9]{2}_|hw_)'").catch(() => ({ rows: [] }));
    for (const s of scr) await O.query(`DROP ${s.relkind === 'S' ? 'SEQUENCE' : 'TABLE'} IF EXISTS lab12_transaction.${s.relname} CASCADE`).catch(() => {});
    for (const r of roles) clients[r].end().catch(() => {});
    await O.end().catch(() => {});
  })());
  activeLabs.add(closeAll);
  if (activeLabs.size === 1 && !process.listenerCount('SIGINT')) {
    process.on('SIGINT', async () => {
      for (const fn of [...activeLabs]) await fn(true);
      console.log('\nĐã ROLLBACK và đóng phiên an toàn.');
      process.exit(130);
    });
  }

  return { ...clients, pid, events, name, roles, closeAll };
}

/** Ánh xạ danh sách pid đang chặn sang tên vai trò (A, B, O) hoặc báo phiên lạ. */
export async function blockersOf(O, targetPid, pidMap) {
  const { rows } = await O.query(
    `SELECT b.pid, a.application_name AS app
       FROM unnest(pg_blocking_pids($1)) AS b(pid)
       LEFT JOIN pg_stat_activity a ON a.pid = b.pid`,
    [targetPid],
  );
  const byPid = Object.fromEntries(Object.entries(pidMap).map(([k, v]) => [String(v), k]));
  return rows.map((r) => byPid[String(r.pid)] ?? `phiên lạ pid=${r.pid} app=${r.app || '(trống)'}`);
}

/** Đọc trạng thái hiện tại của một phiên qua kết nối quan sát O. */
export async function sessionState(O, targetPid) {
  const { rows } = await O.query(
    `SELECT state, wait_event_type, wait_event,
            backend_xmin IS NOT NULL AS "hasXmin",
            backend_xid IS NOT NULL AS "hasXid"
       FROM pg_stat_activity WHERE pid = $1`,
    [targetPid],
  );
  return rows[0] ?? { state: 'gone', wait_event_type: null, wait_event: null, hasXmin: false, hasXid: false };
}

/** Chờ có giới hạn (mặc định 3000 ms, chu kỳ 20 ms) cho tới khi điều kiện fn() trả về truthy. */
export async function waitUntil(fn, ms = 3000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const res = await fn();
    if (res) return res;
    await new Promise((r) => setTimeout(r, 20));
  }
  return null;
}

/** Cảnh báo nếu có phiên ngoài bài lab đang giữ backend_xmin/backend_xid hoặc khóa bảng lab12_transaction. */
export async function warnForeign(O) {
  const { rows } = await O.query(
    `SELECT a.pid, COALESCE(NULLIF(a.application_name, ''), '(trống)') AS app, a.state,
            a.backend_xmin IS NOT NULL AS has_xmin, a.backend_xid IS NOT NULL AS has_xid
       FROM pg_stat_activity a
      WHERE a.datname = current_database() AND a.pid <> pg_backend_pid()
        AND a.backend_type = 'client backend' AND a.application_name NOT LIKE 'lesson-12%'
        AND (a.backend_xmin IS NOT NULL OR a.backend_xid IS NOT NULL
             OR EXISTS (SELECT 1 FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
                         WHERE l.pid = a.pid AND c.relnamespace = to_regnamespace('lab12_transaction')))
      ORDER BY a.pid`,
  );
  for (const r of rows) {
    if (!jsonMode) console.log(`⚠ Cảnh báo phiên lạ pid=${r.pid} app=${r.app} state=${r.state} (xmin=${r.has_xmin}, xid=${r.has_xid})`);
  }
  return rows;
}

/** Đọc các bản ghi WAL trong khoảng [lsn0, lsn1] của danh sách xid, trừ kích thước FPI để ổn định. */
export async function walByXid(O, lsn0, lsn1, xids) {
  const list = (Array.isArray(xids) ? xids : [xids]).map(String);
  const { rows } = await O.query(
    `SELECT resource_manager AS rmgr, record_type AS type,
            pg_wal_lsn_diff(start_lsn, MIN(start_lsn) OVER ())::bigint AS "dLsn",
            (record_length - fpi_length)::int AS len
       FROM lab12_transaction.pg_get_wal_records_info($1::pg_lsn, $2::pg_lsn)
      WHERE xid::text = ANY($3::text[])
      ORDER BY start_lsn`,
    [lsn0, lsn1, list],
  );
  return rows.map((r) => ({ rmgr: r.rmgr, type: r.type, dLsn: Number(r.dLsn), len: Number(r.len) }));
}
export const fmtBytes = (b) => (b >= 1 << 20 ? `${(b / (1 << 20)).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`);
export const fmtMs = (ms) => (ms >= 100 ? `${ms.toFixed(0)} ms` : ms >= 1 ? `${ms.toFixed(1)} ms` : `${ms.toFixed(3)} ms`);
export const fmtInt = (n) => Number(n).toLocaleString('en-US');
export function printTable(rows, cols) {
  if (jsonMode) return;
  const cells = rows.map((r) => cols.map(([, get]) => String(get(r))));
  const widths = cols.map(([h], i) => Math.max(h.length, ...cells.map((c) => c[i].length)));
  const pad = (text, i) => (cols[i][2] === 'right' ? text.padStart(widths[i]) : text.padEnd(widths[i]));
  const line = (vals) => `│ ${vals.map(pad).join(' │ ')} │`;
  console.log(line(cols.map(([h]) => h)));
  console.log(`├─${widths.map((w) => '─'.repeat(w)).join('─┼─')}─┤`);
  cells.forEach((c) => console.log(line(c)));
}
export function heading(text) {
  if (!jsonMode) console.log(`\n${text}\n${'─'.repeat(Math.min(text.length, 100))}`);
}
export function verdict(ok, text) {
  if (!jsonMode) console.log(`   => ${ok ? '✔' : '✘'} ${text}`);
  return Boolean(ok);
}
export function emitJson(payload) {
  if (jsonMode) console.log(JSON.stringify(payload, null, 2));
}
