// Homework (slide 41), part B — the three theories (statement, allowed answers, correct measurement) for homework-runner.mjs.
// Method shared by every measurement below (exactly what the AI draft gets wrong):
// - one candidate index at a time, each created inside BEGIN ... ROLLBACK, so the planner cannot pick another one;
// - measure() = 1 warm-up run + median of 5, so a cold first run never decides the result;
// - pages (shared buffers hit + read) are the headline; ms is printed but never used for a conclusion.
import { measure, inRollback, indexShape, relBytes, fmtBytes, fmtInt, fmtMs } from './pg-explain-kit.mjs';
import { SCANS, scanType, sameish, tablePages, indexPages, parseColumns, parseStatus } from './homework-theory-measure-helpers.mjs';

const ORDERS = { store_first: '(store_id, status)', status_first: '(status, store_id)' };
const SEEKERS = { ...ORDERS, both: 'cả hai', none: 'không index nào' };
const T1_QUERIES = {
  both: ['Q1 (2 cột)', "SELECT * FROM hw_contracts WHERE store_id = 42 AND status = 'TERMINATED'"],
  status: ['Q2 status', "SELECT * FROM hw_contracts WHERE status = 'TERMINATED'"],
  store: ['Q3 store_id', 'SELECT * FROM hw_contracts WHERE store_id = 42'],
};
const T2_SQL = 'SELECT signed_at, total FROM hw_contracts WHERE customer_id = 42 ORDER BY signed_at DESC LIMIT 5';
const byStatus = (s) => `SELECT * FROM hw_contracts WHERE status = '${s}'`;

const T1 = {
  slide: 26,
  statement: 'Index nhiều cột: đặt cột có nhiều giá trị khác nhau (cardinality cao, ở đây store_id) lên trước thì truy vấn nhanh hơn.',
  blanks: {},
  predict: {
    bothEqualFaster: ['Q1 (= trên cả 2 cột): index nào đọc ít trang hơn?', [...Object.keys(ORDERS), 'same']],
    statusOnlySeek: ["Q2 (chỉ status = 'TERMINATED'): index nào seek (tìm thẳng) được?", Object.keys(SEEKERS)],
    storeOnlySeek: ['Q3 (chỉ store_id = 42): index nào seek được?', Object.keys(SEEKERS)],
  },
  wordBank: ['cột đầu (leftmost)', 'seek', 'quét cả index', 'level (độ cao cây)', 'số trang', 'mẫu truy vấn', 'cardinality'],
  sql: () => [
    `CREATE INDEX hw_t1_store_first ON hw_contracts ${ORDERS.store_first};   -- đo Q1–Q3, rồi ROLLBACK`,
    `CREATE INDEX hw_t1_status_first ON hw_contracts ${ORDERS.status_first};  -- đo Q1–Q3, rồi ROLLBACK`,
    ...Object.values(T1_QUERIES).map(([label, sql]) => `${label.split(' ')[0]}: ${sql};`),
  ],
  async run(client) {
    const [res, rows] = [{}, []];
    for (const [order, cols] of Object.entries(ORDERS)) {
      await inRollback(client, async () => {
        await client.query(`CREATE INDEX hw_t1_${order} ON hw_contracts ${cols}`);
        res[order] = { shape: await indexShape(client, `hw_t1_${order}`) };
        for (const [q, [label, sql]] of Object.entries(T1_QUERIES)) {
          const m = await measure(client, sql);
          const idx = await indexPages(client, sql, m);
          // seek = the index part read less than half of the leaf level; otherwise it walked (almost) all leaves.
          const seek = m.usesIndex && idx.pages !== null && idx.pages < res[order].shape.leafPages / 2;
          res[order][q] = { m, seek };
          rows.push({ cols, label, m, idx, kind: !m.usesIndex ? 'không dùng index' : seek ? 'seek' : 'quét cả index' });
        }
      });
    }
    const [a, b] = [res.store_first.both.m.pages, res.status_first.both.m.pages];
    const seekers = (q, s = Object.keys(ORDERS).filter((o) => res[o][q].seek)) => (s.length === 2 ? 'both' : s[0] ?? 'none');
    const actual = {
      bothEqualFaster: sameish(a, b) ? 'same' : a < b ? 'store_first' : 'status_first',
      statusOnlySeek: seekers('status'),
      storeOnlySeek: seekers('store'),
    };
    const levels = `level ${res.store_first.shape.level} = ${res.status_first.shape.level}`;
    const ok = actual.bothEqualFaster === 'store_first';
    const text = ok
      ? `(store_id, status) ${a} trang < (status, store_id) ${b} trang ở Q1.`
      : `Q1: ${a} vs ${b} trang, ${levels} → cột cardinality cao đứng trước không làm Q1 nhanh hơn. `
        + `Thứ tự quyết định truy vấn nào seek được: Q2 seek với ${SEEKERS[actual.statusOnlySeek]}, `
        + `Q3 seek với ${SEEKERS[actual.storeOnlySeek]} → chọn thứ tự theo mẫu truy vấn.`;
    return {
      rows,
      cols: [
        ['Index', (r) => r.cols], ['Truy vấn', (r) => r.label], ['Kế hoạch', (r) => scanType(r.m)],
        ['Dòng', (r) => fmtInt(r.m.rows), 'right'], ['Trang', (r) => fmtInt(r.m.pages), 'right'],
        ['Trang index', (r) => (r.idx.pages === null ? '—' : `${fmtInt(r.idx.pages)}${r.idx.forced ? ' (ép)' : ''}`), 'right'],
        ['Cách dùng index', (r) => r.kind], ['ms', (r) => fmtMs(r.m.ms), 'right'],
      ],
      notes: [
        ...Object.entries(ORDERS).map(([o, cols]) => `${cols}: ${fmtBytes(res[o].shape.bytes)}, `
          + `level ${res[o].shape.level}, ${fmtInt(res[o].shape.leafPages)} trang lá`),
        'seek = trang index đọc < 1/2 số trang lá; quét cả index = đọc gần hết trang lá. (ép) = ép bitmap chỉ để đếm trang index.',
      ],
      actual,
      conclusion: { ok, label: ok ? 'ĐÚNG' : 'SAI', text },
      evidence: `Q1 ${a} vs ${b} trang, ${levels}; Q2 seek: ${SEEKERS[actual.statusOnlySeek]}; Q3 seek: ${SEEKERS[actual.storeOnlySeek]}`,
    };
  },
};

const T2 = {
  slide: 28,
  statement: 'Covering index: index chứa đủ mọi cột truy vấn cần thì Postgres trả kết quả chỉ từ index, không đọc bảng.',
  blanks: { include: ["các cột trong INCLUDE (...), ví dụ 'code' hoặc 'code, status'", parseColumns] },
  predict: {
    planWithout: ['Index (customer_id, signed_at): node quét là gì?', SCANS],
    planWith: ['Index (customer_id, signed_at) INCLUDE (...): node quét là gì?', SCANS],
    heapFetchesWith: ['Có INCLUDE: số lần phải đọc bảng (Heap Fetches)?', ['0', '>0']],
  },
  wordBank: ['Index Only Scan', 'Heap Fetches', 'visibility map', 'VACUUM', 'INCLUDE', 'đọc heap', 'kích thước index'],
  sql: (b) => [
    'CREATE INDEX hw_t2_idx ON hw_contracts (customer_id, signed_at);                    -- đo, rồi ROLLBACK',
    `CREATE INDEX hw_t2_idx ON hw_contracts (customer_id, signed_at) INCLUDE (${b.include});  -- đo, rồi ROLLBACK`,
    `${T2_SQL};`,
  ],
  async run(client, b) {
    const rows = [];
    for (const cols of ['(customer_id, signed_at)', `(customer_id, signed_at) INCLUDE (${b.include})`]) {
      await inRollback(client, async () => {
        await client.query(`CREATE INDEX hw_t2_idx ON hw_contracts ${cols}`);
        rows.push({ cols, m: await measure(client, T2_SQL), bytes: await relBytes(client, 'hw_t2_idx') });
      });
    }
    const [plain, covering] = rows;
    const vm = await tablePages(client);
    const ios = scanType(covering.m) === 'Index Only Scan';
    const hf = covering.m.heapFetches;
    const actual = { planWithout: scanType(plain.m), planWith: scanType(covering.m), heapFetchesWith: ios && hf === 0 ? '0' : '>0' };
    const ok = actual.heapFetchesWith === '0';
    const text = ok
      ? `INCLUDE (${b.include}) → Index Only Scan, Heap Fetches 0: ${plain.m.pages} → ${covering.m.pages} trang; `
        + `đổi lại index to hơn ${fmtBytes(plain.bytes)} → ${fmtBytes(covering.bytes)}. Trên PG cần visibility map đầy (đã VACUUM).`
      : ios
        ? `Index Only Scan nhưng Heap Fetches ${hf}: visibility map mới có ${vm.v}/${vm.p} trang → VACUUM rồi đo lại.`
        : `INCLUDE (${b.include}) chưa phủ hết cột SELECT → vẫn ${actual.planWith}, vẫn đọc heap từng dòng.`;
    return {
      rows,
      cols: [
        ['Index', (r) => r.cols], ['Kế hoạch', (r) => scanType(r.m)], ['Dòng', (r) => fmtInt(r.m.rows), 'right'],
        ['Trang', (r) => fmtInt(r.m.pages), 'right'],
        ['Heap Fetches', (r) => (scanType(r.m) === 'Index Only Scan' ? fmtInt(r.m.heapFetches) : 'đọc heap mỗi dòng'), 'right'],
        ['Kích thước index', (r) => fmtBytes(r.bytes), 'right'], ['ms', (r) => fmtMs(r.m.ms), 'right'],
      ],
      notes: [
        'Truy vấn cần: customer_id (WHERE), signed_at (ORDER BY), signed_at + total (SELECT).',
        `Visibility map: ${fmtInt(vm.v)}/${fmtInt(vm.p)} trang all-visible (Index Only Scan chỉ bỏ qua heap ở các trang này).`,
      ],
      actual,
      conclusion: { ok, label: ok ? 'ĐÚNG (khi bảng đã VACUUM)' : ios ? 'ĐÚNG MỘT PHẦN' : 'CHƯA ĐÚNG với index này', text },
      evidence: `${actual.planWithout} ${plain.m.pages} trang → ${actual.planWith} ${covering.m.pages} trang, Heap Fetches ${ios ? hf : '—'}`,
    };
  },
};

const T3 = {
  slide: 31,
  statement: 'Không nên đánh index cho cột có ít giá trị khác nhau (cardinality thấp), ví dụ status.',
  blanks: { partialStatus: ["giá trị trong WHERE status = '...' của partial index", parseStatus] },
  predict: {
    planTerminated: ["Index (status), truy vấn status = 'TERMINATED' (0.5%): dùng index hay đọc cả bảng?", ['index', 'seq_scan']],
    planActive: ["Index (status), truy vấn status = 'ACTIVE' (60%): dùng index hay đọc cả bảng?", ['index', 'seq_scan']],
    partialSize: ['Partial index so với index (status) đầy đủ?', ['about_same', 'up_to_10x_smaller', 'over_10x_smaller']],
  },
  wordBank: ['selectivity (tỉ lệ dòng khớp)', 'Seq Scan', 'Bitmap Heap Scan', 'giá trị hiếm', 'partial index', 'kích thước'],
  sql: (b) => [
    'CREATE INDEX hw_t3_full ON hw_contracts (status);                                     -- đo, rồi ROLLBACK',
    `CREATE INDEX hw_t3_partial ON hw_contracts (status) WHERE status = '${b.partialStatus}';  -- đo, rồi ROLLBACK`,
    `${byStatus('TERMINATED')};`, `${byStatus('ACTIVE')};`,
    ...(b.partialStatus === 'TERMINATED' ? [] : [`${byStatus(b.partialStatus)};  -- với partial index`]),
  ],
  async run(client, b) {
    const build = (name, where, queries) => inRollback(client, async () => {
      await client.query(`CREATE INDEX ${name} ON hw_contracts (status)${where}`);
      const bytes = await relBytes(client, name);
      const ms = [];
      for (const s of queries) ms.push(await measure(client, byStatus(s)));
      return { bytes, ms };
    });
    const full = await build('hw_t3_full', '', ['TERMINATED', 'ACTIVE']);
    const partial = await build('hw_t3_partial', ` WHERE status = '${b.partialStatus}'`, [b.partialStatus]);
    const [term, active] = full.ms;
    const { p: heapPages } = await tablePages(client);
    const ratio = full.bytes / partial.bytes;
    const actual = {
      planTerminated: term.usesIndex ? 'index' : 'seq_scan',
      planActive: active.usesIndex ? 'index' : 'seq_scan',
      partialSize: ratio >= 10 ? 'over_10x_smaller' : ratio >= 1.5 ? 'up_to_10x_smaller' : 'about_same',
    };
    const ok = !(term.usesIndex && term.pages < heapPages); // the claim holds only if even the rare value gains nothing
    const label = ok ? 'ĐÚNG' : actual.planActive === 'seq_scan' ? 'ĐÚNG MỘT PHẦN' : 'SAI';
    const text = ok
      ? 'Index (status) không giúp được cả giá trị hiếm.'
      : `status chỉ có 4 giá trị, nhưng TERMINATED (0.5%) vẫn dùng index: ${fmtInt(term.pages)} trang thay vì `
        + `${fmtInt(heapPages)} (cả bảng); ACTIVE (60%) → ${scanType(active)}. Quyết định theo tỉ lệ dòng khớp của giá trị hay hỏi; `
        + `partial index WHERE status = '${b.partialStatus}': ${fmtBytes(partial.bytes)} (nhỏ hơn ${ratio.toFixed(ratio >= 10 ? 0 : 1)}×)`
        + `${partial.ms[0].usesIndex ? '.' : ', nhưng không được dùng vì giá trị này quá phổ biến.'}`;
    return {
      rows: [
        { cols: '(status)', bytes: full.bytes, label: 'TERMINATED', m: term },
        { cols: '(status)', bytes: full.bytes, label: 'ACTIVE', m: active },
        { cols: `(status) WHERE status = '${b.partialStatus}'`, bytes: partial.bytes, label: b.partialStatus, m: partial.ms[0] },
      ],
      cols: [
        ['Index', (r) => r.cols], ['Kích thước', (r) => fmtBytes(r.bytes), 'right'], ['status =', (r) => r.label],
        ['Kế hoạch', (r) => scanType(r.m)], ['Dòng', (r) => fmtInt(r.m.rows), 'right'],
        ['Trang', (r) => fmtInt(r.m.pages), 'right'], ['ms', (r) => fmtMs(r.m.ms), 'right'],
      ],
      notes: [`Seq Scan = đọc cả bảng: ${fmtInt(heapPages)} trang.`],
      actual,
      conclusion: { ok, label, text },
      evidence: `TERMINATED ${scanType(term)} ${fmtInt(term.pages)} trang, ACTIVE ${scanType(active)} `
        + `${fmtInt(active.pages)} trang; partial ${fmtBytes(partial.bytes)} vs ${fmtBytes(full.bytes)}`,
    };
  },
};

export const THEORY_SPECS = { T1, T2, T3 };
