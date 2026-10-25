// Các kịch bản dùng chung giữa Labs 03, 05, 06, 07, 08, bài tập về nhà và bảng thực hành 2 cửa sổ psql (M1, M2, M3).
export const LEVELS = ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'];
export const WALK = { contracts: 'contracts', reps: 'store_reps' };

/** Tạo câu lệnh khởi tạo bảng nháp độc lập (autovacuum = off) sao chép từ lab03_indexing.hw_contracts. */
export function scratchSql(prefix, n = 1000) {
  const c = `${prefix}_contracts`;
  const r = `${prefix}_reps`;
  return {
    contracts: c,
    reps: r,
    setup: `
      DROP TABLE IF EXISTS lab12_transaction.${c}, lab12_transaction.${r} CASCADE;
      CREATE TABLE lab12_transaction.${c} WITH (autovacuum_enabled = false) AS
        SELECT * FROM lab03_indexing.hw_contracts WHERE id <= ${Number(n)} ORDER BY id;
      ALTER TABLE lab12_transaction.${c} ADD PRIMARY KEY (id);
      CREATE TABLE lab12_transaction.${r} (store_id int NOT NULL, rep_id int NOT NULL, name text NOT NULL, on_duty boolean NOT NULL DEFAULT true, PRIMARY KEY (store_id, rep_id)) WITH (autovacuum_enabled = false);
      INSERT INTO lab12_transaction.${r} VALUES (44,1,'An',true),(44,2,'Binh',true),(45,1,'Chi',true),(45,2,'Dung',true);
      ANALYZE lab12_transaction.${c}, lab12_transaction.${r};
    `,
    cleanup: `DROP TABLE IF EXISTS lab12_transaction.${c}, lab12_transaction.${r} CASCADE;`,
  };
}

/** M1 (Day 02 DoD): MVCC 2 phiên đọc/ghi xmin, xmax, ctid, RC vs RR, và writer thứ hai chờ khóa dòng. */
export function M1(t = WALK) {
  const Q = `SELECT xmin, xmax, ctid, total FROM ${t.contracts} WHERE id = 1;`;
  return {
    rc: [
      ['A', 'BEGIN;'],
      ['A', Q, 'a1'],
      ['B', `UPDATE ${t.contracts} SET total = total + 1 WHERE id = 1 RETURNING xmin, ctid, total;`, 'bUpd1'],
      ['A', Q, 'a2'],
      ['A', 'COMMIT;'],
    ],
    rr: [
      ['A', 'BEGIN ISOLATION LEVEL REPEATABLE READ;'],
      ['A', Q, 'rr1'],
      ['B', `UPDATE ${t.contracts} SET total = total + 1 WHERE id = 1 RETURNING xmin, ctid, total;`, 'bUpd2'],
      ['A', Q, 'rr2'],
      ['A', 'COMMIT;'],
    ],
    writerWait: [
      ['B', 'BEGIN;'],
      ['B', `UPDATE ${t.contracts} SET total = total + 1 WHERE id = 1 RETURNING xmin, ctid;`, 'bHold'],
      ['A', Q, 'aReadWhileLocked'],
      ['A', `UPDATE ${t.contracts} SET total = total + 1 WHERE id = 1 RETURNING xmin, ctid;`, 'waits:aWaitUpd'],
      ['B', 'COMMIT;', 'bRelease'],
      ['A', 'await'],
    ],
  };
}

/** M2 (Tùy chọn): Phiên A bỏ quên transaction mở giữ khóa dòng; B dính 55P03 sau 3s; O cắt bằng pg_terminate_backend. */
export function M2(t = WALK) {
  return [
    ['A', 'BEGIN;'],
    ['A', `UPDATE ${t.contracts} SET total = total + 10 WHERE id = 1 RETURNING xmin, total;`, 'aOpen'],
    ['B', "SET lock_timeout = '3s';"],
    ['B', `UPDATE ${t.contracts} SET total = total + 20 WHERE id = 1;`, 'waits:bTimeout'],
    ['B', 'await'],
    ['O', (ctx) => `SELECT pg_terminate_backend(${ctx.pid.A}) AS terminated;`, 'oKill'],
    ['B', `UPDATE ${t.contracts} SET total = total + 20 WHERE id = 1 RETURNING xmin, total;`, 'bRetryOk'],
  ];
}

/** M3 (Day 03 DoD): Write Skew tại cửa hàng 44 (trực >= 1 người) ở RR vs SERIALIZABLE (thứ tự A-UPD, B-UPD, A-COMMIT, B-COMMIT). */
export function M3(t = WALK, level = 'REPEATABLE READ') {
  const C = `SELECT count(*)::int AS on_duty FROM ${t.reps} WHERE store_id = 44 AND on_duty;`;
  return [
    ['A', `BEGIN ISOLATION LEVEL ${level};`],
    ['B', `BEGIN ISOLATION LEVEL ${level};`],
    ['A', C, 'aCnt'],
    ['B', C, 'bCnt'],
    ['A', `UPDATE ${t.reps} SET on_duty = false WHERE store_id = 44 AND rep_id = 1;`, 'aUpd'],
    ['B', `UPDATE ${t.reps} SET on_duty = false WHERE store_id = 44 AND rep_id = 2;`, 'bUpd'],
    ['A', 'COMMIT;', 'aCommit'],
    ['B', 'COMMIT;', 'bCommit'],
    ['O', C, 'finalCnt'],
    ['O', `UPDATE ${t.reps} SET on_duty = true WHERE store_id = 44;`],
  ];
}

/** Homework D (Cầu nối Bài 14): Giữ bất biến ở mức READ COMMITTED bằng SELECT ... FOR UPDATE trên các dòng. */
export function forUpdateFix(t = WALK) {
  const lockSql = `SELECT rep_id FROM ${t.reps} WHERE store_id = 44 AND on_duty ORDER BY rep_id FOR UPDATE;`;
  return [
    ['A', 'BEGIN ISOLATION LEVEL READ COMMITTED;'],
    ['B', 'BEGIN ISOLATION LEVEL READ COMMITTED;'],
    ['A', lockSql, 'aLock'],
    ['B', lockSql, 'waits:bLock'],
    ['A', `UPDATE ${t.reps} SET on_duty = false WHERE store_id = 44 AND rep_id = 1;`, 'aUpd'],
    ['A', 'COMMIT;', 'aCommit'],
    ['B', 'await'],
    ['B', (ctx) => (ctx.by.bLock.rows.length > 1
      ? `UPDATE ${t.reps} SET on_duty = false WHERE store_id = 44 AND rep_id = 2;`
      : 'ROLLBACK;'), 'bDecision'],
    ['O', `SELECT count(*)::int AS on_duty FROM ${t.reps} WHERE store_id = 44 AND on_duty;`, 'finalCnt'],
  ];
}

/** Ma trận 6 hiện tượng dị thường × 4 mức cô lập. */
export const ANOMALIES = {
  dirtyRead: {
    title: 'Dirty Read (Đọc bẩn dữ liệu chưa COMMIT)',
    slide: 7,
    steps: (t, level) => [
      ['O', `UPDATE ${t.contracts} SET total = 100 WHERE id = 1;`],
      ['B', 'BEGIN;'],
      ['B', `UPDATE ${t.contracts} SET total = 999 WHERE id = 1;`],
      ['A', `BEGIN ISOLATION LEVEL ${level};`],
      ['A', `SELECT total::int AS total FROM ${t.contracts} WHERE id = 1;`, 'read1'],
      ['A', 'COMMIT;'],
      ['B', 'ROLLBACK;'],
    ],
    judge: (r) => (r.by.read1?.rows[0]?.total === 999 ? 'xảy ra' : 'không'),
  },

  nonRepeatableRead: {
    title: 'Non-Repeatable Read (Đọc không lặp lại trên 1 dòng)',
    slide: 8,
    steps: (t, level) => [
      ['O', `UPDATE ${t.contracts} SET total = 100 WHERE id = 1;`],
      ['A', `BEGIN ISOLATION LEVEL ${level};`],
      ['A', `SELECT total::int AS total FROM ${t.contracts} WHERE id = 1;`, 'r1'],
      ['B', `UPDATE ${t.contracts} SET total = 50 WHERE id = 1;`],
      ['A', `SELECT total::int AS total FROM ${t.contracts} WHERE id = 1;`, 'r2'],
      ['A', 'COMMIT;'],
    ],
    judge: (r) => (r.by.r1?.rows[0]?.total !== r.by.r2?.rows[0]?.total ? 'xảy ra' : 'không'),
  },

  phantom: {
    title: 'Phantom Read (Bóng ma xuất hiện khi đếm tập dòng)',
    slide: 9,
    steps: (t, level) => [
      ['O', `DELETE FROM ${t.contracts} WHERE id = 999999;`],
      ['A', `BEGIN ISOLATION LEVEL ${level};`],
      ['A', `SELECT count(*)::int AS c FROM ${t.contracts} WHERE store_id = 44 AND id >= 999990;`, 'c1'],
      ['B', `INSERT INTO ${t.contracts} (id, code, customer_id, store_id, status, signed_at, total) VALUES (999999, 'HD0999999', 1, 44, 'ACTIVE', now(), 100);`],
      ['A', `SELECT count(*)::int AS c FROM ${t.contracts} WHERE store_id = 44 AND id >= 999990;`, 'c2'],
      ['A', 'COMMIT;'],
      ['O', `DELETE FROM ${t.contracts} WHERE id = 999999;`],
    ],
    judge: (r) => (r.by.c1?.rows[0]?.c !== r.by.c2?.rows[0]?.c ? 'xảy ra' : 'không'),
  },

  lostUpdate: {
    title: 'App Lost Update (Đọc-Sửa-Ghi từ phía ứng dụng)',
    slide: 8,
    steps: (t, level) => [
      ['O', `UPDATE ${t.contracts} SET total = 100 WHERE id = 1;`],
      ['A', `BEGIN ISOLATION LEVEL ${level};`],
      ['B', `BEGIN ISOLATION LEVEL ${level};`],
      ['A', `SELECT total::int AS total FROM ${t.contracts} WHERE id = 1;`, 'aRead'],
      ['B', `SELECT total::int AS total FROM ${t.contracts} WHERE id = 1;`, 'bRead'],
      ['A', (ctx) => `UPDATE ${t.contracts} SET total = ${ctx.by.aRead.rows[0].total - 10} WHERE id = 1;`, 'aUpd'],
      ['B', (ctx) => `UPDATE ${t.contracts} SET total = ${ctx.by.bRead.rows[0].total - 20} WHERE id = 1;`, 'waits:bUpd'],
      ['A', 'COMMIT;'],
      ['B', 'await'],
      ['B', (ctx) => (ctx.by.bUpd.error ? 'ROLLBACK;' : 'COMMIT;'), 'bEnd'],
      ['O', `SELECT total::int AS total FROM ${t.contracts} WHERE id = 1;`, 'final'],
    ],
    judge: (r) => (r.by.bUpd?.code === '40001' ? '40001' : r.by.final?.rows[0]?.total !== 70 ? 'xảy ra' : 'không'),
  },

  atomicUpdate: {
    title: 'Atomic SQL Update (SET total = total - delta)',
    slide: 8,
    steps: (t, level) => [
      ['O', `UPDATE ${t.contracts} SET total = 100 WHERE id = 1;`],
      ['A', `BEGIN ISOLATION LEVEL ${level};`],
      ['B', `BEGIN ISOLATION LEVEL ${level};`],
      ['A', `UPDATE ${t.contracts} SET total = total - 10 WHERE id = 1;`, 'aUpd'],
      ['B', `UPDATE ${t.contracts} SET total = total - 20 WHERE id = 1;`, 'waits:bUpd'],
      ['A', 'COMMIT;'],
      ['B', 'await'],
      ['B', (ctx) => (ctx.by.bUpd.error ? 'ROLLBACK;' : 'COMMIT;'), 'bEnd'],
      ['O', `SELECT total::int AS total FROM ${t.contracts} WHERE id = 1;`, 'final'],
    ],
    judge: (r) => (r.by.bUpd?.code === '40001' ? '40001' : r.by.final?.rows[0]?.total !== 70 ? 'xảy ra' : 'không'),
  },

  writeSkew: {
    title: 'Write Skew (Lệch ghi khi 2 phiên sửa 2 dòng khác nhau)',
    slide: 9,
    steps: (t, level) => M3(t, level),
    judge: (r) => (r.by.bCommit?.code === '40001' || r.by.bUpd?.code === '40001' ? '40001' : r.by.finalCnt?.rows[0]?.on_duty === 0 ? 'xảy ra' : 'không'),
  },
};
