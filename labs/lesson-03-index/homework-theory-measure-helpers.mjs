// Homework (slide 41), part B — helpers shared by the three theory measurements in homework-theory-definitions.mjs:
// allow-lists for the learner's blanks, plan-tree readers, and the index-page counter used by T1.
import { measure } from './pg-explain-kit.mjs';

export const COLUMNS = ['id', 'code', 'customer_id', 'store_id', 'status', 'signed_at', 'total'];
export const STATUSES = ['ACTIVE', 'EXPIRED', 'DRAFT', 'TERMINATED'];
export const SCANS = ['Seq Scan', 'Index Scan', 'Index Only Scan', 'Bitmap Heap Scan'];

/** Depth-first search for the first plan node that passes `test`. */
export const firstNode = (n, test) => (test(n) ? n : (n.Plans ?? []).map((c) => firstNode(c, test)).find(Boolean));
/** The node that actually reads rows (Seq Scan, Index Scan, Index Only Scan, Bitmap Heap Scan), not Limit/Aggregate. */
export const scanType = (m) => firstNode(m.raw, (n) => /Scan/.test(n['Node Type']))['Node Type'];
const bitmapIndexNode = (raw) => firstNode(raw, (n) => n['Node Type'] === 'Bitmap Index Scan');
const nodePages = (n) => n['Shared Hit Blocks'] + n['Shared Read Blocks'];
/** At most 10% apart counts as "the same": a page or two of noise must not decide which index order "wins". */
export const sameish = (a, b) => Math.abs(a - b) <= 0.1 * Math.max(a, b);

/** Heap pages and pages marked all-visible by VACUUM (Index Only Scan skips the heap only on the latter). */
export async function tablePages(client) {
  const { rows } = await client.query(
    `SELECT relpages AS p, relallvisible AS v FROM pg_class WHERE oid = 'hw_contracts'::regclass`,
  );
  return rows[0];
}

/**
 * Index pages read to find the matching entries. A Bitmap Index Scan node reports them on its own; a plain Index Scan
 * mixes index and heap pages, so for that case one extra bitmap run is forced (labelled "ép") just to count index pages.
 */
export async function indexPages(client, sql, m) {
  const node = bitmapIndexNode(m.raw);
  if (node) return { pages: nodePages(node), forced: false };
  await client.query('SAVEPOINT forced');
  try {
    await client.query('SET LOCAL enable_seqscan = off; SET LOCAL enable_indexscan = off; SET LOCAL enable_indexonlyscan = off');
    const forcedNode = bitmapIndexNode((await measure(client, sql, { runs: 1 })).raw);
    return { pages: forcedNode ? nodePages(forcedNode) : null, forced: true };
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT forced');
  }
}

/** Blank validator: a comma-separated list of hw_contracts column names, nothing else ever reaches the DDL. */
export function parseColumns(value) {
  const cols = String(value).split(',').map((c) => c.trim()).filter(Boolean);
  const bad = cols.filter((c) => !COLUMNS.includes(c));
  if (!cols.length || bad.length) return { error: `chỉ được dùng tên cột: ${COLUMNS.join(', ')}` };
  if (new Set(cols).size !== cols.length) return { error: 'một cột bị lặp lại' };
  return { value: cols.join(', ') };
}

/** Blank validator: exactly one of the four status values. */
export const parseStatus = (value) =>
  (STATUSES.includes(value) ? { value } : { error: `chọn một trong: ${STATUSES.join(', ')}` });
