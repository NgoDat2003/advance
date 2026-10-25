// Lab 12.02 — Write-Ahead Log (WAL): đọc bản ghi WAL của một giao dịch bằng pg_walinspect.
// Phiên A ghi dữ liệu, phiên O quan sát WAL. Bảng nháp l02_contracts (10 dòng, tắt autovacuum) trong lab12_transaction.
import { fmtMs, heading, openLab, printTable, verdict, waitUntil, warnForeign, walByXid } from './tx-kit.mjs';

const SCRATCH = 'DROP TABLE IF EXISTS l02_contracts CASCADE';
const lab = await openLab('lab02', ['A']);
const { A, O } = lab;
let failed = false;

const scalar = async (client, sql, params = []) => Object.values((await client.query(sql, params)).rows[0])[0];
const isHeap = (r) => r.rmgr === 'Heap' || r.rmgr === 'Heap2';

const walCols = [
  ['RMGR', (r) => r.rmgr],
  ['Loại bản ghi', (r) => r.type],
  ['Δ LSN', (r) => r.dLsn, 'right'],
  ['Bytes (không FPI)', (r) => r.len, 'right'],
];

/** Chạy một giao dịch UPDATE rồi kết thúc bằng `ending`, trả về khoảng LSN và xid của giao dịch. */
async function runTx(delta, ending, baseLsn) {
  const lsn0 = await scalar(O, 'SELECT pg_current_wal_insert_lsn()');
  await A.query('BEGIN');
  await A.query(`UPDATE l02_contracts SET total = total + ${delta} WHERE id <= 3`);
  const xid = await scalar(A, 'SELECT pg_current_xact_id()::text');
  await A.query(ending);
  if (ending === 'ROLLBACK') await O.query('UPDATE l02_contracts SET total = total WHERE id = 10');
  const lsn1 = await scalar(O, 'SELECT pg_current_wal_flush_lsn()');
  return { lsn0, lsn1, scanFrom: baseLsn ?? lsn0, xid };
}

try {
  console.log('Lab 12.02 — Write-Ahead Log (WAL): Ghi log trước, COMMIT flush & ROLLBACK không cần Undo (slide 5, 12)');
  await warnForeign(O);
  await O.query(SCRATCH);
  const tableLsn = await scalar(O, 'SELECT pg_current_wal_lsn()');
  await O.query(
    `CREATE TABLE l02_contracts WITH (autovacuum_enabled = false) AS
       SELECT * FROM lab03_indexing.hw_contracts WHERE id <= 10 ORDER BY id`,
  );

  // Phần A: COMMIT — bản ghi Heap đi trước, bản ghi COMMIT được flush xuống đĩa
  heading('A. COMMIT: bản ghi Heap được ghi trước, rồi tới bản ghi COMMIT (flush khi commit)');
  const a = await runTx(1, 'COMMIT', tableLsn);
  const flushLsn = await scalar(O, 'SELECT pg_current_wal_flush_lsn()');
  const recA = await walByXid(O, a.scanFrom, a.lsn1, [a.xid]);
  console.log(`   Khoảng WAL của giao dịch: ${a.lsn0} -> ${a.lsn1}, xid=${a.xid}, flush tới ${flushLsn}`);
  printTable(recA, walCols);
  const commitAt = recA.findIndex((r) => r.rmgr === 'Transaction' && r.type.startsWith('COMMIT'));
  const heapBefore = recA.filter((r, i) => isHeap(r) && i < commitAt).length;
  const lag = Number(await scalar(O, 'SELECT pg_wal_lsn_diff($1::pg_lsn, $2::pg_lsn)', [flushLsn, a.lsn1]));
  verdict(heapBefore >= 1 && commitAt === recA.length - 1, 'Các bản ghi Heap/Heap2 (dữ liệu) nằm trước bản ghi COMMIT; COMMIT là bản ghi cuối của giao dịch');
  verdict(lag >= 0, 'LSN đã flush >= LSN cuối giao dịch: COMMIT chỉ trả về sau khi WAL xuống đĩa');

  // Phần B: ROLLBACK — chỉ thêm bản ghi ABORT, không có bản ghi hoàn tác dữ liệu
  heading('B. ROLLBACK: chỉ có bản ghi ABORT, không cần ghi Undo như Oracle/MySQL');
  const b = await runTx(99, 'ROLLBACK', a.lsn0);
  const recB = await walByXid(O, b.scanFrom, b.lsn1, [b.xid]);
  console.log(`   Khoảng WAL của giao dịch: ${b.lsn0} -> ${b.lsn1}, xid=${b.xid}`);
  printTable(recB, walCols);
  const abortAt = recB.findIndex((r) => r.rmgr === 'Transaction' && r.type.startsWith('ABORT'));
  const heapAfter = recB.filter((r, i) => isHeap(r) && i > abortAt).length;
  verdict(abortAt >= 0, 'Giao dịch bị ROLLBACK để lại đúng một bản ghi ABORT trong WAL');
  verdict(abortAt >= 0 && heapAfter === 0, `Sau ABORT có ${heapAfter} bản ghi Heap hoàn tác: dòng cũ vẫn nằm đó, chỉ cần coi xid là đã hủy`);

  // Phần C: chi phí flush của synchronous_commit
  heading('C. Chi phí flush: 100 giao dịch UPDATE 1 dòng với synchronous_commit = on và off');
  const timing = [];
  for (const mode of ['on', 'off']) {
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) {
      await A.query('BEGIN');
      await A.query(`SET LOCAL synchronous_commit = ${mode}`);
      await A.query('UPDATE l02_contracts SET total = total + 1 WHERE id = 4');
      await A.query('COMMIT');
    }
    timing.push({ mode, ms: performance.now() - t0 });
  }
  printTable(timing, [
    ['Chế độ', (r) => `synchronous_commit = ${r.mode}`],
    ['Số giao dịch', (r) => 100, 'right'],
    ['ms', (r) => fmtMs(r.ms), 'right'],
  ]);
  console.log('   Chế độ off bỏ qua việc chờ fsync lúc COMMIT; đổi lại có thể mất vài giao dịch cuối khi sập nguồn (không hỏng dữ liệu).');
} catch (err) {
  failed = true;
  console.error(`✘ Lab 12.02 gặp lỗi: ${err.code ?? ''} ${err.message}`);
} finally {
  await A.query('ROLLBACK').catch(() => {});
  await O.query(SCRATCH).catch(() => {});
  await lab.closeAll();
}
if (failed) process.exit(1);
