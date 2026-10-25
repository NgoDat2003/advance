// Lab 12.03 — MVCC hai phiên: đọc xmin/xmax/ctid của cùng một dòng, so RC với RR, soi trang heap bằng pageinspect, writer chờ writer.
// Chỉ ghi vào bảng nháp l03_* trong lab12_transaction; lab03_indexing chỉ được ĐỌC qua hàm pageinspect.
import { openLab, heading, verdict, printTable, fmtMs, jsonMode, emitJson } from './tx-kit.mjs';
import { scratchSql, M1 } from './scenarios.mjs';
import { runSteps } from './tx-runner.mjs';

const say = (s) => { if (!jsonMode) console.log(s); };
const slim = (rows) => rows.map(({ step, who, sql, summary, ms, waitedFor, waitEvent }) => ({ step, who, sql, summary, ms, waitedFor, waitEvent }));
const parseCtid = (s) => /\((\d+),(\d+)\)/.exec(s).slice(1).map(Number);

const lab = await openLab('lab03', ['A', 'B']);
const { O, A, B } = lab;
const sc = scratchSql('l03', 1000);
const T = sc.contracts;
const sc1 = M1(sc);

try {
  await O.query(sc.cleanup);
  await O.query(sc.setup);
  const { rows: [cfg] } = await O.query("SELECT current_setting('default_transaction_isolation') AS iso");
  say('Lab 12.03 — MVCC trên PostgreSQL: Tuple xmin/xmax/ctid, Snapshot RC vs RR & Khóa dòng (slide 13–15)');
  say(`Cài đặt: search_path = lab12_transaction; ${T} có 1,000 dòng, autovacuum_enabled = off; phiên A/B mặc định ${cfg.iso}.`);

  // A. READ COMMITTED: writer không bị reader chặn, reader thấy bản mới ở câu SELECT sau.
  const rc = await runSteps(lab, sc1.rc, { title: 'A. READ COMMITTED: A mở transaction, B UPDATE dòng id=1, A đọc lại' });
  const { a1, bUpd1, a2 } = rc.by;
  verdict(
    !bUpd1.error && bUpd1.rowCount === 1 && bUpd1.waitedFor.length === 0,
    `Writer B không bị reader A chặn: UPDATE xong sau ${fmtMs(bUpd1.ms)} dù A đang mở transaction`,
  );
  verdict(
    a2.rows[0].xmin !== a1.rows[0].xmin && a2.rows[0].ctid !== a1.rows[0].ctid
      && a2.rows[0].xmin === bUpd1.rows[0].xmin && a2.rows[0].ctid === bUpd1.rows[0].ctid,
    `RC: SELECT thứ hai của A thấy bản mới do B tạo: xmin=${a1.rows[0].xmin} → xmin=${a2.rows[0].xmin}, ctid ${a1.rows[0].ctid} → ${a2.rows[0].ctid}`,
  );

  // B. REPEATABLE READ: snapshot cố định, A vẫn thấy bản cũ; xmax của bản cũ đã bị B đóng dấu.
  const rr = await runSteps(lab, sc1.rr, { title: 'B. REPEATABLE READ: cùng kịch bản, A giữ snapshot từ câu SELECT đầu tiên' });
  const { rr1, bUpd2, rr2 } = rr.by;
  verdict(
    rr2.rows[0].total === rr1.rows[0].total && rr2.rows[0].ctid === rr1.rows[0].ctid
      && rr2.rows[0].xmin === rr1.rows[0].xmin && bUpd2.rows[0].ctid !== rr1.rows[0].ctid,
    `RR: SELECT thứ hai của A vẫn thấy bản cũ (cùng total, cùng ctid ${rr2.rows[0].ctid}) dù B đã tạo bản mới ở ctid ${bUpd2.rows[0].ctid}`,
  );
  verdict(
    rr2.rows[0].xmax !== '0' && rr2.rows[0].xmax === bUpd2.rows[0].xmin,
    `RR: xmax=${rr2.rows[0].xmax} của bản cũ trùng xmin=${bUpd2.rows[0].xmin} của bản mới: B là người đóng dấu bản cũ`,
  );

  // C. pageinspect: hai phiên bản của id=1 cùng tồn tại trên heap, t_ctid của bản cũ trỏ sang bản mới.
  heading('C. pageinspect: soi heap page — bản cũ và bản mới của id=1 (A giữ RR nên chưa dọn được)');
  const heapItems = [];
  const { rows: ext } = await O.query(
    "SELECT quote_ident(n.nspname) AS s FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pageinspect'",
  );
  if (ext.length === 0) {
    say('Thông báo: extension pageinspect chưa được cài, bỏ qua Phần C.');
  } else {
    const pi = ext[0].s;
    const { by } = await runSteps(lab, [
      ['A', 'BEGIN ISOLATION LEVEL REPEATABLE READ;'],
      ['A', `SELECT ctid FROM ${T} WHERE id = 1;`, 'c1'],
      ['B', `UPDATE ${T} SET total = total + 1 WHERE id = 1 RETURNING xmin, ctid;`, 'cUpd'],
    ]);
    const updXmin = by.cUpd.rows[0].xmin;
    for (const [label, ctid] of [['bản cũ', by.c1.rows[0].ctid], ['bản mới', by.cUpd.rows[0].ctid]]) {
      const [blk, lp] = parseCtid(ctid);
      const { rows } = await O.query(
        `SELECT lp, t_ctid::text AS t_ctid, t_xmin::text AS t_xmin, t_xmax::text AS t_xmax
           FROM ${pi}.heap_page_items(${pi}.get_raw_page('lab12_transaction.${T}', $1::int)) WHERE lp = $2::int`,
        [blk, lp],
      );
      heapItems.push({ label, ctid, lp: rows[0]?.lp, t_ctid: rows[0]?.t_ctid, t_xmin: rows[0]?.t_xmin, t_xmax: rows[0]?.t_xmax });
    }
    await A.query('ROLLBACK');
    printTable(heapItems, [
      ['Phiên bản', (r) => r.label], ['ctid', (r) => r.ctid], ['lp', (r) => r.lp ?? '?', 'right'],
      ['t_ctid', (r) => r.t_ctid ?? '?'], ['t_xmin', (r) => r.t_xmin ?? '?', 'right'], ['t_xmax', (r) => r.t_xmax ?? '?', 'right'],
    ]);
    const [oldV, newV] = heapItems;
    verdict(
      oldV.lp !== undefined && newV.lp !== undefined && oldV.t_ctid === newV.ctid && oldV.t_xmax === updXmin && newV.t_xmax === '0',
      `Hai phiên bản cùng tồn tại trên heap: t_ctid của bản cũ ${oldV.ctid} trỏ sang ${newV.ctid}, t_xmax=${oldV.t_xmax} = xmin=${updXmin} của bản mới`,
    );
  }

  // D. Writer vs Writer: reader không bị chặn, writer thứ hai chờ transactionid của writer thứ nhất.
  const { rows: [b0] } = await O.query(`SELECT total FROM ${T} WHERE id = 1`);
  const ww = await runSteps(lab, sc1.writerWait, { title: 'D. Writer vs Writer: B giữ UPDATE chưa commit, A đọc rồi A UPDATE cùng dòng' });
  const { bHold, aReadWhileLocked: rd, aWaitUpd } = ww.by;
  const waitRow = ww.rows.find((r) => r.command === 'WAIT');
  const { rows: [b1] } = await O.query(`SELECT total FROM ${T} WHERE id = 1`);
  verdict(
    !rd.error && rd.waitedFor.length === 0 && rd.rows.length === 1 && rd.rows[0].xmin !== bHold.rows[0].xmin,
    `Reader A không bị chặn bởi UPDATE đang mở của B: SELECT xong sau ${fmtMs(rd.ms)}, thấy bản cũ (xmin=${rd.rows[0].xmin}, chưa thấy xmin=${bHold.rows[0].xmin})`,
  );
  verdict(
    Boolean(waitRow) && waitRow.waitEvent === 'Lock/transactionid' && waitRow.waitedFor.includes('B'),
    `Writer A bị chặn chờ ${waitRow?.waitedFor.join(',') ?? '?'} trên ${waitRow?.waitEvent ?? '?'} (chờ transactionid của B, không phải khóa bảng)`,
  );
  verdict(
    !aWaitUpd.error && aWaitUpd.rowCount === 1 && Number(b1.total) === Number(b0.total) + 2,
    `Sau khi B COMMIT, UPDATE của A hoàn tất (chờ ${fmtMs(aWaitUpd.ms)}) và cả hai thay đổi đều được ghi nhận, không mất cập nhật`,
  );

  emitJson({ rc: slim(rc.rows), rr: slim(rr.rows), writerWait: slim(ww.rows), heapItems });
} finally {
  await A.query('ROLLBACK').catch(() => {});
  await B.query('ROLLBACK').catch(() => {});
  await O.query(sc.cleanup).catch(() => {});
  await lab.closeAll();
}
