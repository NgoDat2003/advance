// Shared helpers for the lesson-03 index labs.
// Every lab answers one question: "which plan did Postgres pick, and how many 8 KB pages did it touch?"
// Pages (buffers) are the honest unit: milliseconds change with cache warmth and CPU load, page counts do not.
import pg from 'pg';

/**
 * Opens one session with lab defaults:
 * - search_path = lab03_indexing, public (lab tables and the pageinspect/pgstattuple/pg_trgm functions live there);
 * - jit = off, so big plans do not pay a compile step that has nothing to do with indexes;
 * - parallel workers off by default, so page counts compare one-to-one. Pass { parallel: true } to keep the server default.
 */
export async function connect({ parallel = false } = {}) {
  const { PG_URL } = process.env;
  if (!PG_URL) {
    console.error('Thiếu biến môi trường PG_URL. Xem mục 6.3 "Chuẩn bị môi trường" trong reports/lesson_03_index_teacher_guide.html.');
    process.exit(1);
  }
  // Never let the URL reach the console: a malformed URL throws an error whose `input` field holds the whole string,
  // password included, so only the error code is printed.
  let client;
  try {
    client = new pg.Client({ connectionString: PG_URL, application_name: 'lesson-03-index-lab' });
    await client.connect();
  } catch (err) {
    const hint = err.code === 'ERR_INVALID_URL'
      ? 'PG_URL sai định dạng (ký tự đặc biệt trong mật khẩu như / # ? @ phải được URL-encode)'
      : 'Container đang chạy chưa? docker start quan_ly_hop_dong-postgres-1';
    console.error(`Không kết nối được Postgres (${err.code ?? 'lỗi kết nối'}). ${hint}`);
    process.exit(1);
  }
  await client.query('SET search_path = lab03_indexing, public');
  await client.query('SET jit = off');
  if (!parallel) await client.query('SET max_parallel_workers_per_gather = 0');
  return client;
}

/** Short one-line description of a JSON plan tree, e.g. "Limit > Index Scan (users_email_idx)". */
export function describePlan(node) {
  const parts = [];
  const walk = (n) => {
    let label = n['Node Type'];
    if (n['Index Name']) label += ` (${n['Index Name']})`;
    else if (n['Relation Name'] && /Scan/.test(label)) label += ` (${n['Relation Name']})`;
    parts.push(label);
    (n.Plans ?? []).forEach(walk);
  };
  walk(node);
  return parts.join(' > ');
}

const sumOver = (node, key) => (node[key] ?? 0) + (node.Plans ?? []).reduce((s, c) => s + sumOver(c, key), 0);

/**
 * EXPLAIN (ANALYZE, BUFFERS) a query: one warm-up run, then `runs` measured runs.
 * Returns the plan shape, rows returned, median execution time and pages touched (shared hit + read).
 */
export async function measure(client, sql, { runs = 5 } = {}) {
  const once = async () => {
    const { rows } = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`);
    return rows[0]['QUERY PLAN'][0];
  };
  await once();
  const samples = [];
  for (let i = 0; i < runs; i++) samples.push(await once());
  // Report the median run as one unit (its time, its plan, its pages), so parallel plans whose page count varies a
  // little between runs still print numbers that belong together.
  const mid = [...samples].sort((a, b) => a['Execution Time'] - b['Execution Time'])[Math.floor(samples.length / 2)];
  const { Plan: plan } = mid;
  return {
    plan: describePlan(plan),
    rows: plan['Actual Rows'],
    ms: mid['Execution Time'],
    pages: plan['Shared Hit Blocks'] + plan['Shared Read Blocks'],
    heapFetches: sumOver(plan, 'Heap Fetches'),
    usesIndex: /Index|Bitmap/.test(describePlan(plan)),
    raw: plan,
  };
}

/** Text plan without costs, for the few places where the learner should read the real EXPLAIN lines. */
export async function planText(client, sql, { analyze = true } = {}) {
  const opts = analyze ? 'ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF' : 'COSTS OFF';
  const { rows } = await client.query(`EXPLAIN (${opts}) ${sql}`);
  return rows.map((r) => r['QUERY PLAN']);
}

/** Runs fn inside BEGIN ... ROLLBACK. Postgres DDL is transactional, so indexes created in fn leave no trace. */
export async function inRollback(client, fn) {
  await client.query('BEGIN');
  try {
    return await fn();
  } finally {
    // If the connection already died, keep the original error instead of a second "connection terminated".
    await client.query('ROLLBACK').catch(() => {});
  }
}

/** Bytes of WAL written while fn runs: every index entry and every page split is logged. */
export async function walBytes(client, fn) {
  const lsn = async () => (await client.query('SELECT pg_current_wal_insert_lsn() AS l')).rows[0].l;
  const before = await lsn();
  await fn();
  const after = await lsn();
  const { rows } = await client.query('SELECT pg_wal_lsn_diff($1, $2)::bigint AS b', [after, before]);
  return Number(rows[0].b);
}

export async function relBytes(client, name) {
  const { rows } = await client.query('SELECT pg_relation_size($1::regclass) AS b', [name]);
  return Number(rows[0].b);
}

/** Size, tree level (0 = root is the only leaf) and leaf fill of a B-tree index. Needs pageinspect + pgstattuple. */
export async function indexShape(client, name) {
  const { rows } = await client.query(
    `SELECT s.index_size AS bytes, s.tree_level AS level, s.leaf_pages, s.avg_leaf_density AS density
       FROM pgstatindex($1) s`,
    [name],
  );
  const r = rows[0];
  return { bytes: Number(r.bytes), level: r.level, leafPages: Number(r.leaf_pages), density: Number(r.density) };
}

/** Lesson 2's lab 6 relies on lab_imdb having only its two primary keys. Every IMDb lab ends with this check. */
export async function assertImdbUntouched(client) {
  const { rows } = await client.query(
    `SELECT string_agg(indexname, ', ' ORDER BY indexname) AS names FROM pg_indexes WHERE schemaname = 'lab_imdb'`,
  );
  const ok = rows[0].names === 'ratings_pkey, titles_pkey';
  console.log(`${ok ? '✔' : '✘'} lab_imdb chỉ còn index: ${rows[0].names}`);
  if (!ok) process.exitCode = 1;
  return ok;
}

export const fmtBytes = (b) => (b >= 1 << 20 ? `${(b / (1 << 20)).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`);
export const fmtMs = (ms) => (ms >= 100 ? ms.toFixed(0) : ms >= 1 ? ms.toFixed(1) : ms.toFixed(3));
export const fmtInt = (n) => Number(n).toLocaleString('en-US');

/** Prints rows as an aligned table. `cols` is a list of [header, (row) => text, 'left' | 'right']. */
export function printTable(rows, cols) {
  const cells = rows.map((r) => cols.map(([, get]) => String(get(r))));
  const widths = cols.map(([h], i) => Math.max(h.length, ...cells.map((c) => c[i].length)));
  const pad = (text, i) => (cols[i][2] === 'right' ? text.padStart(widths[i]) : text.padEnd(widths[i]));
  const line = (vals) => `│ ${vals.map(pad).join(' │ ')} │`;
  console.log(line(cols.map(([h]) => h)));
  console.log(`├─${widths.map((w) => '─'.repeat(w)).join('─┼─')}─┤`);
  cells.forEach((c) => console.log(line(c)));
}

/** Standard result table for a list of { label, m } where m comes from measure(). */
export function printMeasurements(items) {
  printTable(items, [
    ['Truy vấn', (x) => x.label],
    ['Kế hoạch', (x) => x.m.plan],
    ['Dòng', (x) => fmtInt(x.m.rows), 'right'],
    ['Trang', (x) => fmtInt(x.m.pages), 'right'],
    ['ms', (x) => fmtMs(x.m.ms), 'right'],
  ]);
}

export function heading(text) {
  console.log(`\n${text}\n${'─'.repeat(Math.min(text.length, 100))}`);
}

/** One conclusion line, marked ✔ when the measurement matches the claim being tested and ✘ when it does not. */
export function verdict(ok, text) {
  console.log(`   => ${ok ? '✔' : '✘'} ${text}`);
}
