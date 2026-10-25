// Lab 12.04 — Phiên bản chết (dead tuple), VACUUM và chân trời snapshot (horizon): ai giữ backend_xmin thì VACUUM không dọn được.
// Chỉ ghi vào bảng nháp l04_* trong lab12_transaction; đếm tuple chết bằng pgstattuple (SnapshotDirty, không phụ thuộc horizon).
import { openLab, warnForeign, sessionState, heading, verdict, printTable, fmtInt } from './tx-kit.mjs';
import { scratchSql } from './scenarios.mjs';

const N = 10000;
const T = 'l04_contracts';
const lab = await openLab('lab04', ['A', 'B']);
const { O, A, B } = lab;
const sc = scratchSql('l04', N);

// Tìm schema của extension theo pg_extension (không đoán tên schema).
async function extSchema(name) {
  const { rows } = await O.query(
    'SELECT quote_ident(n.nspname) AS s FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = $1',
    [name],
  );
  if (!rows[0]) throw new Error(`Thiếu extension ${name} trong database lab`);
  return rows[0].s;
}

try {
  await warnForeign(O);
  await O.query(sc.cleanup);
  await O.query(sc.setup);
  const pgs = await extSchema('pgstattuple');
  const dead = async () => Number((await O.query(
    `SELECT dead_tuple_count FROM ${pgs}.pgstattuple('lab12_transaction.${T}')`,
  )).rows[0].dead_tuple_count);
  // VACUUM (VERBOSE) trên O: gom các dòng INFO, lấy dòng "tuples:" để biết removed / not yet removable.
  const vacuum = async (verbose = true) => {
    O.notices.length = 0;
    await O.query(`VACUUM ${verbose ? '(VERBOSE) ' : ''}${T}`);
    const lines = O.notices.flatMap((n) => n.message.split('\n'));
    const line = (lines.find((l) => l.includes('not yet removable')) ?? '').trim().replace(/oldest xmin: \d+/, 'oldest xmin=<n>');
    return {
      line,
      removed: Number(/(\d+) removed/.exec(line)?.[1] ?? NaN),
      notYet: Number(/(\d+) are dead but not yet removable/.exec(line)?.[1] ?? NaN),
    };
  };
  const showA = async (note) => {
    const st = await sessionState(O, lab.pid.A);
    console.log(`   A: state=${st.state}, backend_xmin=${st.hasXmin ? 'có' : 'không'} (${note})`);
    return st;
  };
  const upd500 = async () => (await B.query(`UPDATE ${T} SET total = total + 1 WHERE id <= 500`)).rowCount;

  console.log('Lab 12.04 — Phiên bản chết (Dead Tuples), VACUUM & Chân trời Snapshot (Horizon) (slide 13–14, 16)');
  console.log(`Cài đặt: search_path = lab12_transaction; ${T} có ${fmtInt(N)} dòng, autovacuum_enabled = off; VACUUM chạy thủ công trên O.`);

  // A. ROLLBACK vẫn để lại phiên bản chết trên heap cho tới khi VACUUM dọn.
  heading('A. UPDATE toàn bảng rồi ROLLBACK: phiên bản chết nằm lại trên heap');
  await A.query('BEGIN');
  await A.query(`UPDATE ${T} SET total = total + 1`);
  await A.query('ROLLBACK');
  const deadA0 = await dead();
  const vA = await vacuum();
  const deadA1 = await dead();
  console.log(`   dead_tuple_count trước VACUUM: ${fmtInt(deadA0)}; sau VACUUM: ${fmtInt(deadA1)}`);
  console.log(`   ${vA.line}`);
  verdict(deadA0 === N, `Sau ROLLBACK, ${fmtInt(deadA0)} phiên bản chết vẫn nằm trên heap (bằng số dòng ${fmtInt(N)} đã UPDATE)`);
  verdict(deadA1 === 0 && vA.removed === deadA0, `VACUUM dọn ${fmtInt(vA.removed)} phiên bản chết, dead_tuple_count về ${deadA1}`);

  // B. RC idle read-only không giữ horizon: backend_xmin rỗng, VACUUM dọn được.
  heading('B. READ COMMITTED idle (chỉ đọc): không giữ chân trời snapshot');
  await A.query('BEGIN');
  await A.query(`SELECT count(*) FROM ${T}`);
  const stB = await showA('RC, đã xong SELECT, idle in transaction');
  const updB = await upd500();
  const deadB0 = await dead();
  const vB = await vacuum();
  const deadB1 = await dead();
  console.log(`   B UPDATE ${updB} dòng; dead_tuple_count trước VACUUM: ${fmtInt(deadB0)}; sau VACUUM: ${fmtInt(deadB1)}`);
  await A.query('COMMIT');
  verdict(!stB.hasXmin && stB.state === 'idle in transaction', 'A ở RC idle in transaction nhưng backend_xmin rỗng: không giữ horizon');
  verdict(deadB0 === 500 && deadB1 === 0 && vB.removed === 500, `VACUUM dọn đủ ${fmtInt(vB.removed)}/500 phiên bản chết dù A còn mở transaction`);

  // C. RR idle giữ snapshot: VACUUM thấy tuple chết nhưng chưa dọn được ("not yet removable").
  heading('C. REPEATABLE READ idle: snapshot cố định giữ chân trời lại');
  await A.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  await A.query(`SELECT count(*) FROM ${T}`);
  const stC = await showA('RR, snapshot giữ từ SELECT đầu tiên');
  const updC = await upd500();
  const vC = await vacuum();
  const deadC0 = await dead();
  console.log(`   B UPDATE ${updC} dòng; dead_tuple_count sau VACUUM khi A còn giữ snapshot: ${fmtInt(deadC0)}`);
  console.log(`   ${vC.line}`);
  await A.query('COMMIT');
  await vacuum(false);
  const deadC1 = await dead();
  console.log(`   A COMMIT rồi VACUUM lại: dead_tuple_count = ${fmtInt(deadC1)}`);
  verdict(stC.hasXmin, 'A ở RR idle in transaction có backend_xmin: giữ horizon dù chỉ đọc một lần');
  verdict(
    vC.line.includes('not yet removable') && vC.notYet === 500 && vC.removed === 0 && deadC0 === 500,
    `VACUUM thấy ${fmtInt(vC.notYet)} phiên bản "not yet removable", removed=${vC.removed}; heap vẫn còn ${fmtInt(deadC0)} tuple chết`,
  );
  verdict(deadC1 === 0, `A COMMIT xong, VACUUM dọn sạch: dead_tuple_count = ${deadC1}`);

  // D. Đọc id=1 phải bước qua mọi phiên bản còn sống trong chuỗi; VACUUM đưa số buffer về như cũ.
  heading('D. Chi phí đọc một dòng khi A giữ snapshot RR và B UPDATE id=1 nhiều lần');
  const lookup = async () => {
    const { rows } = await O.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT total FROM ${T} WHERE id = 1`);
    const p = rows[0]['QUERY PLAN'][0].Plan;
    return (p['Shared Hit Blocks'] ?? 0) + (p['Shared Read Blocks'] ?? 0);
  };
  const bump = async (k) => { for (let i = 0; i < k; i++) await B.query(`UPDATE ${T} SET total = total + 1 WHERE id = 1`); };
  await A.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  await A.query(`SELECT count(*) FROM ${T}`);
  const rowsD = [{ label: 'Chưa UPDATE (A giữ RR)', buf: await lookup() }];
  await bump(100);
  rowsD.push({ label: '100 UPDATE (A giữ RR)', buf: await lookup() });
  await bump(900);
  rowsD.push({ label: '1,000 UPDATE (A giữ RR)', buf: await lookup() });
  await A.query('COMMIT');
  await vacuum(false);
  rowsD.push({ label: 'A COMMIT + VACUUM', buf: await lookup() });
  printTable(rowsD, [['Mốc đo', (r) => r.label], ['Buffers (hit+read)', (r) => r.buf, 'right']]);
  const [d0, , d1000, dAfter] = rowsD.map((r) => r.buf);
  verdict(d1000 > d0, `Với 1,000 UPDATE, tra cứu id=1 chạm ${d1000} buffer, nhiều hơn mức gốc ${d0}: phải bước qua chuỗi phiên bản chưa dọn`);
  verdict(dAfter < d1000 && dAfter <= d0 + 2, `Sau VACUUM, tra cứu id=1 chỉ còn ${dAfter} buffer (từ ${d1000}), về gần mức gốc ${d0}`);
} finally {
  await A.query('ROLLBACK').catch(() => {});
  await B.query('ROLLBACK').catch(() => {});
  await O.query(sc.cleanup).catch(() => {});
  await lab.closeAll();
}
