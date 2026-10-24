// Controller probe (not a learner lab): checks on this machine's PG 16 which anomaly each isolation level allows,
// and that a two-session script can interleave steps deterministically, including a statement that blocks on a row lock.
// Creates only lab12_transaction.probe_* tables and drops them (and the schema, if this probe created it) at the end.
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../../labs/lesson-03-index/package.json', import.meta.url));
const pg = require('pg');

const LEVELS = ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'];
const notices = [];

async function session(name) {
  const c = new pg.Client({ connectionString: process.env.PG_URL, application_name: `l12-probe-${name}` });
  await c.connect();
  c.on('notice', (n) => notices.push(`${name}: ${n.severity} ${n.message}`));
  await c.query("SET lock_timeout = '3s'");
  await c.query("SET statement_timeout = '10s'");
  await c.query('SET search_path = lab12_transaction');
  return c;
}

// Runs one statement and reports either its rows or the SQLSTATE + message, never throws.
async function run(c, sql) {
  try {
    const r = await c.query(sql);
    return { ok: true, rows: r.rows };
  } catch (e) {
    return { ok: false, err: `${e.code} ${e.message}` };
  }
}

const admin = await session('admin');
const { rows: [pre] } = await admin.query("SELECT to_regnamespace('lab12_transaction') IS NOT NULL AS existed");
const a = await session('A');
const b = await session('B');

async function reset() {
  await admin.query(`
    CREATE SCHEMA IF NOT EXISTS lab12_transaction;
    DROP TABLE IF EXISTS lab12_transaction.probe_acc, lab12_transaction.probe_oncall;
    CREATE TABLE lab12_transaction.probe_acc (id int PRIMARY KEY, balance int NOT NULL);
    INSERT INTO lab12_transaction.probe_acc VALUES (1, 100), (2, 100);
    CREATE TABLE lab12_transaction.probe_oncall (id int PRIMARY KEY, name text NOT NULL, on_call boolean NOT NULL);
    INSERT INTO lab12_transaction.probe_oncall VALUES (1, 'An', true), (2, 'Binh', true);`);
}

const val = (r, k) => (r.ok ? r.rows[0]?.[k] : r.err);
const results = [];

try {
  for (const level of LEVELS) {
    const row = { level };

    // Dirty read: A changes a row but does not commit; B reads it.
    await reset();
    await a.query('BEGIN'); await a.query('UPDATE probe_acc SET balance = 0 WHERE id = 1');
    await b.query(`BEGIN ISOLATION LEVEL ${level}`);
    row.dirty = val(await run(b, 'SELECT balance FROM probe_acc WHERE id = 1'), 'balance');
    row.shown = val(await run(b, 'SHOW transaction_isolation'), 'transaction_isolation');
    await a.query('ROLLBACK'); await b.query('COMMIT');

    // Non-repeatable read: B reads, A commits a change, B reads again.
    await reset();
    await b.query(`BEGIN ISOLATION LEVEL ${level}`);
    const r1 = val(await run(b, 'SELECT balance FROM probe_acc WHERE id = 1'), 'balance');
    await a.query('UPDATE probe_acc SET balance = 50 WHERE id = 1');
    const r2 = val(await run(b, 'SELECT balance FROM probe_acc WHERE id = 1'), 'balance');
    row.nonrep = `${r1}→${r2}`;
    await b.query('COMMIT');

    // Phantom: B counts a range, A inserts into it and commits, B counts again.
    await reset();
    await b.query(`BEGIN ISOLATION LEVEL ${level}`);
    const c1 = val(await run(b, 'SELECT count(*)::int AS n FROM probe_acc WHERE balance >= 0'), 'n');
    await a.query('INSERT INTO probe_acc VALUES (3, 100)');
    const c2 = val(await run(b, 'SELECT count(*)::int AS n FROM probe_acc WHERE balance >= 0'), 'n');
    row.phantom = `${c1}→${c2}`;
    await b.query('COMMIT');

    // Lost update (application read-modify-write): both read 100, A writes 90 and commits, B writes 80.
    await reset();
    await a.query(`BEGIN ISOLATION LEVEL ${level}`); await b.query(`BEGIN ISOLATION LEVEL ${level}`);
    await run(a, 'SELECT balance FROM probe_acc WHERE id = 1'); await run(b, 'SELECT balance FROM probe_acc WHERE id = 1');
    await run(a, 'UPDATE probe_acc SET balance = 90 WHERE id = 1'); await a.query('COMMIT');
    const lu = await run(b, 'UPDATE probe_acc SET balance = 80 WHERE id = 1');
    await b.query(lu.ok ? 'COMMIT' : 'ROLLBACK');
    row.lost = lu.ok ? `final ${(await admin.query('SELECT balance FROM lab12_transaction.probe_acc WHERE id = 1')).rows[0].balance}` : lu.err;

    // Write skew: rule "at least one on call"; each checks count = 2, each takes a different doctor off.
    await reset();
    await a.query(`BEGIN ISOLATION LEVEL ${level}`); await b.query(`BEGIN ISOLATION LEVEL ${level}`);
    await run(a, 'SELECT count(*) FROM probe_oncall WHERE on_call'); await run(b, 'SELECT count(*) FROM probe_oncall WHERE on_call');
    const wa = await run(a, 'UPDATE probe_oncall SET on_call = false WHERE id = 1');
    const wb = await run(b, 'UPDATE probe_oncall SET on_call = false WHERE id = 2');
    const ca = wa.ok ? await run(a, 'COMMIT') : await run(a, 'ROLLBACK');
    const cb = wb.ok ? await run(b, 'COMMIT') : await run(b, 'ROLLBACK');
    const left = (await admin.query('SELECT count(*)::int AS n FROM lab12_transaction.probe_oncall WHERE on_call')).rows[0].n;
    row.skew = `on_call=${left}${ca.ok ? '' : ` A:${ca.err}`}${cb.ok ? '' : ` B:${cb.err}`}${wb.ok ? '' : ` B-upd:${wb.err}`}`;
    results.push(row);
  }
  console.table(results);

  // A reader never blocks a writer, and an RR snapshot keeps showing the old version (with xmax set by the writer).
  await reset();
  await a.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  const before = (await a.query('SELECT xmin, xmax, ctid, balance FROM probe_acc WHERE id = 1')).rows[0];
  const t0 = performance.now();
  const upd = (await b.query('UPDATE probe_acc SET balance = balance + 1 WHERE id = 1 RETURNING xmin, ctid, balance')).rows[0];
  const writerMs = performance.now() - t0;
  const again = (await a.query('SELECT xmin, xmax, ctid, balance FROM probe_acc WHERE id = 1')).rows[0];
  await a.query('COMMIT');
  const fresh = (await a.query('SELECT xmin, xmax, ctid, balance FROM probe_acc WHERE id = 1')).rows[0];
  console.log('RR reader before:', before, '| writer new version:', upd, `| writer took ${writerMs.toFixed(1)} ms`);
  console.log('RR reader again :', again, '| after reader commit:', fresh);

  // A writer blocks a writer of the same row: detect B waiting via pg_blocking_pids, then release it by committing A.
  await a.query('BEGIN'); await a.query('UPDATE probe_acc SET balance = balance - 1 WHERE id = 2');
  const bPid = (await b.query('SELECT pg_backend_pid() AS p')).rows[0].p;
  const aPid = (await a.query('SELECT pg_backend_pid() AS p')).rows[0].p;
  const pending = run(b, 'UPDATE probe_acc SET balance = balance - 1 WHERE id = 2 RETURNING balance');
  let blockers = [];
  for (let i = 0; i < 100 && blockers.length === 0; i++) {
    blockers = (await admin.query('SELECT pg_blocking_pids($1) AS p', [bPid])).rows[0].p;
    if (blockers.length === 0) await new Promise((r) => setTimeout(r, 20));
  }
  const waitInfo = (await admin.query('SELECT state, wait_event_type, wait_event FROM pg_stat_activity WHERE pid = $1', [bPid])).rows[0];
  await a.query('COMMIT');
  const done = await pending;
  console.log(`B blocked by A: ${blockers.includes(aPid)} (${JSON.stringify(waitInfo)}) → after A commits B gets`, done.ok ? done.rows[0] : done.err);

  // SET TRANSACTION outside a block, and the aborted-transaction state after an error.
  await run(a, 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
  await a.query('BEGIN');
  const e1 = await run(a, 'SELECT 1 / 0');
  const e2 = await run(a, 'SELECT 1');
  await a.query('ROLLBACK');
  console.log('error in tx:', e1.err, '| next statement:', e2.err);
  console.log('notices:', notices);
} finally {
  for (const c of [a, b]) await c.query('ROLLBACK').catch(() => {});
  await admin.query('DROP TABLE IF EXISTS lab12_transaction.probe_acc, lab12_transaction.probe_oncall');
  if (!pre.existed) await admin.query('DROP SCHEMA IF EXISTS lab12_transaction');
  for (const c of [a, b, admin]) await c.end();
}
