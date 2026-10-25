// Lab 12.05 phần A (slide 17–18): một UPDATE khổng lồ so với 10 lô nhỏ có VACUUM xen giữa.
// Đo: số bản ghi WAL (pg_walinspect, đã trừ FPI), số trang heap sau khi sửa, số dòng bị khóa tối đa trong một transaction.
// Dữ liệu xuất qua `resultA` để phần B gom vào JSON cho Widget W5. Chỉ dùng bảng nháp l05_one, l05_batch.
import { fmtBytes, fmtInt, heading, openLab, printTable, jsonMode, verdict, walByXid, warnForeign } from './tx-kit.mjs';

const N = 20000;
const BATCHES = 10;
const SIZE = N / BATCHES;
const say = (s) => { if (!jsonMode) console.log(s); };
const DROP = 'DROP TABLE IF EXISTS l05_one, l05_batch CASCADE';
const mk = (t) => `CREATE TABLE ${t} WITH (autovacuum_enabled = false) AS
  SELECT * FROM lab03_indexing.hw_contracts WHERE id <= ${N} ORDER BY id`;

export const resultA = {};

const lab = await openLab('lab05a', ['A']);
const { A, O } = lab;

const pagesOf = async (t) => {
  const { rows } = await O.query(
    "SELECT (pg_relation_size($1::regclass) / current_setting('block_size')::int)::int AS pages", [t]);
  return rows[0].pages;
};
const lsnNow = async (fn) => (await O.query(`SELECT ${fn}()::text AS l`)).rows[0].l;

/** Một transaction: BEGIN, UPDATE, lấy xid, COMMIT. Trả về xid và số dòng bị sửa (= số dòng bị khóa). */
async function runTx(sql) {
  await A.query('BEGIN');
  const res = await A.query(sql);
  const { rows } = await A.query('SELECT pg_current_xact_id()::xid::text AS xid');
  await A.query('COMMIT');
  return { xid: rows[0].xid, locked: res.rowCount };
}

try {
  heading('Lab 12.05 — Transaction lớn (Batching vs Big UPDATE) & Phiên treo Idle in Transaction (slide 17–21)');
  await warnForeign(O);
  await O.query(DROP);
  const { rows: cfg } = await O.query(
    "SELECT current_setting('wal_level') AS wl, current_setting('full_page_writes') AS fpw");
  say(`Thiết lập liên quan: wal_level=${cfg[0].wl}, full_page_writes=${cfg[0].fpw}; autovacuum tắt trên l05_*, VACUUM chạy tay.`);

  for (const t of ['l05_one', 'l05_batch']) {
    await O.query(mk(t));
    await O.query(`ALTER TABLE ${t} ADD PRIMARY KEY (id)`);
    await O.query(`ANALYZE ${t}`);
  }
  const before = { one: await pagesOf('l05_one'), batch: await pagesOf('l05_batch') };

  heading(`A. UPDATE ${fmtInt(N)} dòng: 1 transaction lớn vs ${BATCHES} lô × ${fmtInt(SIZE)} dòng (VACUUM sau mỗi lô)`);

  // A1: một transaction duy nhất sửa toàn bộ bảng
  const oneLsn0 = await lsnNow('pg_current_wal_insert_lsn');
  const one = await runTx('UPDATE l05_one SET total = total + 1');
  const oneLsn1 = await lsnNow('pg_current_wal_flush_lsn');
  const oneWal = await walByXid(O, oneLsn0, oneLsn1, [one.xid]);

  // A2: chia lô theo khoảng id, VACUUM giữa các lô để tái sử dụng chỗ trống của bản ghi chết
  const batchLsn0 = await lsnNow('pg_current_wal_insert_lsn');
  const xids = [];
  let maxLocked = 0;
  for (let i = 0; i < BATCHES; i++) {
    const lo = i * SIZE + 1;
    const hi = (i + 1) * SIZE;
    const r = await runTx(`UPDATE l05_batch SET total = total + 1 WHERE id BETWEEN ${lo} AND ${hi}`);
    xids.push(r.xid);
    maxLocked = Math.max(maxLocked, r.locked);
    await A.query('VACUUM l05_batch');
  }
  const batchLsn1 = await lsnNow('pg_current_wal_flush_lsn');
  const batchWal = await walByXid(O, batchLsn0, batchLsn1, xids);

  const after = { one: await pagesOf('l05_one'), batch: await pagesOf('l05_batch') };
  const sum = (w) => w.reduce((s, r) => s + r.len, 0);
  const rowsOut = [
    { name: '1 UPDATE lớn', tx: 1, locked: one.locked, recs: oneWal.length, bytes: sum(oneWal), b: before.one, a: after.one },
    { name: `${BATCHES} lô + VACUUM`, tx: BATCHES, locked: maxLocked, recs: batchWal.length, bytes: sum(batchWal), b: before.batch, a: after.batch },
  ];
  printTable(rowsOut, [
    ['Kịch bản', (r) => r.name],
    ['Số tx', (r) => r.tx, 'right'],
    ['Dòng khóa tối đa/tx', (r) => fmtInt(r.locked), 'right'],
    ['Bản ghi WAL', (r) => fmtInt(r.recs), 'right'],
    ['WAL (không FPI)', (r) => fmtBytes(r.bytes), 'right'],
    ['Trang heap trước', (r) => fmtInt(r.b), 'right'],
    ['Trang heap sau', (r) => fmtInt(r.a), 'right'],
  ]);

  const diff = Math.abs(oneWal.length - batchWal.length) / Math.max(oneWal.length, 1);
  resultA.rows = rowsOut;
  resultA.walRecordDiff = diff;
  resultA.verdicts = [
    verdict(oneWal.length > 0 && diff <= 0.05,
      'Số bản ghi WAL của hai cách chênh nhau không quá 5%: chia lô không làm giảm tổng công việc ghi, chỉ chia nhỏ nó.'),
    verdict(after.batch < after.one,
      'Chia lô + VACUUM tái sử dụng chỗ của bản ghi chết nên heap sau khi sửa nhỏ hơn hẳn UPDATE lớn (UPDATE lớn nhân đôi bảng).'),
    verdict(maxLocked < one.locked,
      `Mỗi lô chỉ khóa tối đa ${fmtInt(maxLocked)} dòng, UPDATE lớn khóa ${fmtInt(one.locked)} dòng cùng lúc: ít xung đột hơn và không tích tụ 20,000 bản ghi chết cùng lúc.`),
  ];
} finally {
  await A.query('ROLLBACK').catch(() => {});
  await O.query(DROP).catch(() => {});
  await lab.closeAll();
}
