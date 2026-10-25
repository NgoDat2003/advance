// Kiểm tra bất biến sau mỗi bài lab: schema lab12_transaction chỉ giữ bảng chuẩn, không còn phiên/lock treo,
// và dữ liệu Bài 3 (lab03_indexing.hw_contracts) nguyên vẹn 100%.
// Cờ `--reset` xóa toàn bộ schema lab12_transaction (kèm extension pg_walinspect).
import { connect, heading } from './tx-kit.mjs';

const client = await connect('lesson-12-check');

if (process.argv.includes('--reset')) {
  await client.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
      WHERE datname = current_database() AND pid <> pg_backend_pid()
        AND application_name LIKE 'lesson-12%'`,
  );
  await client.query('DROP SCHEMA IF EXISTS lab12_transaction CASCADE');
  console.log('Đã xóa toàn bộ schema lab12_transaction. Chạy lại: npm run setup');
  await client.end();
  process.exit(0);
}

let failed = false;
const checkLine = (ok, msg) => {
  console.log(`${ok ? '✔' : '✘'} ${msg}`);
  if (!ok) failed = true;
};

heading('Kiểm tra bất biến môi trường Bài 12 (lab12_transaction & lab03_indexing)');

const { rows: nsRows } = await client.query("SELECT to_regnamespace('lab12_transaction') IS NOT NULL AS ok");
if (!nsRows[0].ok) {
  checkLine(false, 'H1: chưa có schema lab12_transaction (chạy: npm run setup)');
  await client.end();
  process.exit(1);
}

// H1: Chỉ đúng 4 đối tượng chuẩn trong lab12_transaction, không còn bảng tạm lNN_* hay hw_*
const EXPECTED = new Set(['contracts', 'contracts_pkey', 'store_reps', 'store_reps_pkey']);
const { rows: rels } = await client.query(
  `SELECT c.relname, c.relkind FROM pg_class c
    WHERE c.relnamespace = 'lab12_transaction'::regnamespace AND c.relkind IN ('r', 'i', 'S')
    ORDER BY c.relkind DESC, c.relname`,
);
const names = rels.map((r) => r.relname);
const extra = names.filter((n) => !EXPECTED.has(n));
const missing = [...EXPECTED].filter((n) => !names.includes(n));
checkLine(
  extra.length === 0 && missing.length === 0,
  `H1 Đối tượng trong lab12_transaction: ${names.join(', ') || '(trống)'}${extra.length ? ` | dư: ${extra.join(', ')}` : ''}${missing.length ? ` | thiếu: ${missing.join(', ')}` : ''}`,
);

// H2: Extension pg_walinspect ở lab12_transaction; pageinspect, pgstattuple, pg_trgm vẫn ở lab03_indexing
const { rows: exts } = await client.query(
  `SELECT e.extname, n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname IN ('pg_walinspect', 'pageinspect', 'pgstattuple', 'pg_trgm') ORDER BY e.extname`,
);
const extMap = Object.fromEntries(exts.map((r) => [r.extname, r.nspname]));
const h2Ok = extMap.pg_walinspect === 'lab12_transaction'
  && extMap.pageinspect === 'lab03_indexing'
  && extMap.pgstattuple === 'lab03_indexing'
  && extMap.pg_trgm === 'lab03_indexing';
checkLine(h2Ok, `H2 Extensions: ${exts.map((e) => `${e.extname}@${e.nspname}`).join(', ')}`);

// H3: Không còn phiên lesson-12% khác đang chạy và không có phiên lạ giữ lock hoặc giữ snapshot trên DB
const { rows: activeSessions } = await client.query(
  `SELECT a.pid, COALESCE(NULLIF(a.application_name, ''), '(trống)') AS app, a.state,
          a.backend_xmin IS NOT NULL AS has_xmin, a.backend_xid IS NOT NULL AS has_xid
     FROM pg_stat_activity a
    WHERE a.datname = current_database() AND a.pid <> pg_backend_pid() AND a.backend_type = 'client backend'
      AND (a.application_name LIKE 'lesson-12%'
           OR a.backend_xmin IS NOT NULL OR a.backend_xid IS NOT NULL
           OR EXISTS (SELECT 1 FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
                       WHERE l.pid = a.pid AND c.relnamespace = 'lab12_transaction'::regnamespace))
    ORDER BY a.pid`,
);
checkLine(
  activeSessions.length === 0,
  activeSessions.length === 0
    ? 'H3 Không còn phiên lesson-12% hay phiên giữ khóa/snapshot'
    : `H3 Còn phiên giữ tài nguyên: ${activeSessions.map((s) => `pid=${s.pid} app=${s.app} state=${s.state}`).join('; ')}`,
);

// H4: Fingerprint dữ liệu Bài 3 (lab03_indexing.hw_contracts)
const { rows: fpCount } = await client.query('SELECT count(*)::int AS c FROM lab03_indexing.hw_contracts');
const { rows: fpVm } = await client.query(
  "SELECT relpages::int AS p, relallvisible::int AS v FROM pg_class WHERE oid = 'lab03_indexing.hw_contracts'::regclass",
);
const { rows: fpId1 } = await client.query(
  'SELECT xmin::text AS xmin, xmax::text AS xmax, ctid::text AS ctid FROM lab03_indexing.hw_contracts WHERE id = 1',
);
const { rows: fpStat } = await client.query(
  "SELECT n_tup_upd::int AS u, n_tup_del::int AS d FROM pg_stat_user_tables WHERE schemaname = 'lab03_indexing' AND relname = 'hw_contracts'",
);
const id1 = fpId1[0] ?? {};
const h4Ok = fpCount[0].c === 500000 && fpVm[0].p === 5666 && fpVm[0].v === 5666 && id1.xmin === '875' && id1.ctid === '(0,1)';
checkLine(
  h4Ok,
  `H4 Fingerprint lab03_indexing.hw_contracts: rows=${fpCount[0].c}, allvisible=${fpVm[0].v}/${fpVm[0].p}, id1=(xmin=${id1.xmin}, ctid=${id1.ctid}) [info: n_tup_upd=${fpStat[0]?.u ?? 0}, n_tup_del=${fpStat[0]?.d ?? 0}]`,
);

// H5: DB-level search_path của advance_be_lab giữ nguyên
const { rows: spRows } = await client.query(
  `SELECT s.setconfig FROM pg_db_role_setting s JOIN pg_database d ON d.oid = s.setdatabase WHERE d.datname = current_database()`,
);
const spText = JSON.stringify(spRows[0]?.setconfig ?? []);
checkLine(spText === '["search_path=lab03_indexing, public"]', `H5 DB search_path: ${spText}`);

// H6: Số dòng chuẩn trong contracts (100,000) và store_reps (4)
if (missing.length === 0) {
  const { rows: cCnt } = await client.query('SELECT count(*)::int AS c FROM lab12_transaction.contracts');
  const { rows: rCnt } = await client.query('SELECT count(*)::int AS c FROM lab12_transaction.store_reps');
  checkLine(cCnt[0].c === 100000 && rCnt[0].c === 4, `H6 Số dòng chuẩn: contracts=${cCnt[0].c}, store_reps=${rCnt[0].c}`);

  const { rows: pDrift } = await client.query(
    `SELECT (SELECT total::text FROM lab12_transaction.contracts WHERE id = 1) AS total1,
            (SELECT count(*)::int FROM lab12_transaction.store_reps WHERE on_duty) AS duty`,
  );
  if (pDrift[0].total1 !== '478461.34' || pDrift[0].duty !== 4) {
    console.log(`⚠ Bảng thực hành đã thay đổi sau thao tác tay (id1.total=${pDrift[0].total1}, on_duty=${pDrift[0].duty}). Khôi phục: npm run setup -- --force`);
  }
} else {
  checkLine(false, 'H6 Chưa kiểm tra được số dòng do thiếu bảng chuẩn');
}

await client.end();
if (failed) process.exit(1);
