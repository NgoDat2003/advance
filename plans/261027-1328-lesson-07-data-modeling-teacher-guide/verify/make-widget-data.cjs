// Chép số liệu từ runs/*.txt sang runs/data/wN.json cho widget. Không tính số mới; verify-guide --data kiểm từng số.
// Dùng: node verify/make-widget-data.cjs   (chạy ở thư mục plan)
const fs = require('fs');
const w = (n, o) => fs.writeFileSync(`runs/data/${n}.json`, JSON.stringify(o, null, 1) + '\n');
fs.mkdirSync('runs/data', { recursive: true });

w('w1', { sources: ['01-design-erd.catalog', '09-ledger.ddl', '02-normal-forms.3nf'],
  tables: [
    { name: 'erd_orders', kind: 'entity', note: 'đơn hàng: có id, status (vòng đời), cột kỹ thuật', cols: ['id', 'code', 'status', 'total', 'version', 'created_at', 'updated_at'] },
    { name: 'erd_payment_transactions', kind: 'entity', note: 'sinh SAU đơn hàng nên giữ order_id (slide 12)', cols: ['id', 'kind', 'order_id → erd_orders', 'amount', 'status', 'version', 'created_at', 'updated_at'] },
    { name: 'nf_order_lines', kind: 'relation', note: 'bảng nối N–M giữa đơn và món, kèm số lượng và giá', cols: ['order_id → nf_orders', 'product_id → nf_products', 'unit_price', 'quantity', 'discount'] },
    { name: 'cs_availability', kind: 'support', note: 'bảng phụ của entity homestay: mỗi ngày một dòng', cols: ['homestay_id → cs_homestays', 'day', 'price', 'status'] },
    { name: 'hw_airports', kind: 'config', note: 'danh mục ít đổi, nhiều nơi tham chiếu', cols: ['code', 'name', 'timezone'] },
    { name: 'wallets', kind: 'entity', note: 'ví: số dư cache + allow_negative', cols: ['id', 'code', 'owner', 'balance', 'allow_negative', 'version', 'created_at', 'updated_at'] },
    { name: 'transfers', kind: 'entity', note: 'một lần chuyển tiền, idempotency_key UNIQUE', cols: ['id', 'idempotency_key', 'order_ref', 'amount', 'created_at'] },
    { name: 'ledger_entries', kind: 'relation', note: 'bút toán: nối transfer với wallet, amount âm hoặc dương', cols: ['id', 'transfer_id → transfers', 'wallet_id → wallets', 'amount', 'created_at'] }
  ] });

w('w2', { sources: ['02-normal-forms.0nf', '02-normal-forms.1nf', '02-normal-forms.2nf', '02-normal-forms.3nf', '02-normal-forms.lossless', '02-normal-forms.denorm'],
  rawOrders: 830, lineRows: 2155, dupProductName: 38, dupCityRows: 116, updateFlat: 38, updateNormalized: 1,
  lostCities: 1, customersNorthwind: 91, customersWithOrders: 89, insertCode: '23502', losslessDiff: 0, denormDrift: 1,
  steps: [
    { key: '0nf', label: '0NF', tables: ['order_sheet_raw (830 dòng, ô items chứa nhiều món)'] },
    { key: '1nf', label: '1NF', tables: ['order_sheet (2155 dòng, mỗi dòng một món)'] },
    { key: '2nf', label: '2NF', tables: ['nf_products', 'nf_orders (còn tên, thành phố khách)', 'nf_order_lines'] },
    { key: '3nf', label: '3NF', tables: ['nf_customers', 'nf_products', 'nf_orders', 'nf_order_lines'] }
  ] });

// Đọc timeline đã ghép: mỗi khối "── A · bước A1 · hh:mm:ss.mmm ──" thành một sự kiện.
function events(file) {
  const out = [];
  for (const l of fs.readFileSync(`runs/${file}`, 'utf8').split('\n')) {
    const m = l.match(/^── ([AB]) · bước (\w+) · ([\d:.]+) ──/);
    if (m) { out.push({ who: m[1], step: m[2], luc: m[3], sql: [], error: null }); continue; }
    const e = out[out.length - 1];
    if (!e) continue;
    if (/^psql:<stdin>:\d+: ERROR:/.test(l)) e.error = l.replace(/^psql:<stdin>:\d+: ERROR:\s+/, '');
    else if (/^(INSERT|DELETE|UPDATE|COMMIT|ROLLBACK|CREATE) /.test(l) || /^SELECT (count|pg_sleep)/.test(l)) e.sql.push(l.replace(/\s+--.*$/, ''));
  }
  return out;
}
w('w3', { sources: ['03-fk-race.nofk.timeline', '03-fk-race.fk.timeline'],
  nofk: events('03-fk-race.nofk.timeline.txt'), fk: events('03-fk-race.fk.timeline.txt'), orphans: { nofk: 1, fk: 0 } });

w('w4', { sources: ['04-table-format.add-column', '04-table-format.lock', '04-index-online.plain.B', '04-index-online.cic.timeline', '04-index-online.cic.B'],
  rows: 500000, lockMode: 'AccessExclusiveLock',
  alters: [
    { sql: 'ADD COLUMN note text', ms: 1.140, rewrite: false },
    { sql: 'ADD COLUMN version int NOT NULL DEFAULT 0', ms: 1.422, rewrite: false },
    { sql: 'ADD COLUMN created_at timestamptz DEFAULT now()', ms: 1.279, rewrite: false },
    { sql: 'ADD COLUMN rnd float8 DEFAULT random()', ms: 527.308, rewrite: true },
    { sql: 'ALTER COLUMN customer_id TYPE bigint', ms: 518.812, rewrite: true }
  ],
  plain: { lockMode: 'ShareLock', bSelectRows: 2440, bSelectMs: 24.254, bUpdateCode: '55P03', bUpdateMs: 2000.334 },
  cic: { lockMode: 'ShareUpdateExclusiveLock', phase: 'waiting for writers before build', aUpdate: 'UPDATE 1', cicMs: 5587.924, valid: 't' } });

w('w5', { sources: ['05-data-types.string', '05-data-types.number', '05-data-types.money', '05-data-types.time', '05-data-types.null', '05-data-types.string-limit', '05-data-types.string-index'],
  fields: [
    { field: 'Tên món', pg: 'text', prisma: 'String', bytes: 'trong bảng: text = varchar(255) = 9 byte cho "xin chao"', trap: 'ghi chuỗi dài vào varchar(10) → 22001; nhưng ép kiểu ::varchar(10) thì PG cắt im lặng' },
    { field: 'Giá bán', pg: 'numeric(12,2)', prisma: 'Decimal @db.Decimal(12,2)', bytes: 'numeric(12,2) 123456.78: 9 byte trong bảng (int 4, bigint 8)', trap: 'float: 0.1 + 0.2 = 0.30000000000000004' },
    { field: 'created_at', pg: 'timestamptz', prisma: 'DateTime @db.Timestamptz(3)', bytes: 'timestamptz = timestamp = 8 byte', trap: 'DateTime mặc định của Prisma là timestamp(3), không múi giờ' },
    { field: 'Giờ hẹn giao hàng', pg: 'timestamptz + cột timezone', prisma: 'DateTime @db.Timestamptz(3) + String', bytes: '8 byte', trap: "'09:00+07'::timestamp bỏ mất +07, không báo lỗi" },
    { field: 'Số lượng', pg: 'int', prisma: 'Int', bytes: 'smallint 2 · int 4 · bigint 8 byte', trap: '2147483647 + 1 → 22003 integer out of range' },
    { field: 'Ghi chú dài', pg: 'text', prisma: 'String', bytes: '10008 ký tự lặp lại chỉ còn 148 byte (nén TOAST)', trap: 'đánh B-tree lên chuỗi > 2704 byte → 54000' },
    { field: 'Trạng thái', pg: 'text + CHECK (hoặc enum)', prisma: 'enum, hoặc String + CHECK trong migration.sql', bytes: 'như text', trap: 'không có CHECK thì "Psot" cũng lưu được (chặng 8)' }
  ],
  money: { floatAdd: '0.30000000000000004', floatSum: '100000.00000133288', numericSum: '100000.0', nwRealRaw: '1265793.038653364', nwNumericRaw: '1265793.0395', nwReal: '1265792.95', nwNumeric: '1265793.29' },
  nullRow: { full: 63, allNull: 28 } });

w('w6', { sources: ['06-case-studies.ordering'], intSteps: 9, f8Steps: 53, f4Steps: 24, rebalanceRows: 5 });

const days = [];
for (let d = 1; d <= 30; d++) days.push({ day: `2026-11-${String(d).padStart(2, '0')}`, status: d >= 20 && d <= 22 ? 'BOOKED' : 'OPEN' });
w('w7', { sources: ['06-case-studies.availability', '06-case-studies.exclusion'], price: '800000.00', generated: 1095, priceUpdate: 'UPDATE 1',
  book: { range: '20→23/11', rows: 3 }, retry: { range: '22→24/11', rows: 1 }, exclusionCode: '23P01', days });

w('w8', { sources: ['08-polymorphic.typeid', '08-polymorphic.arc', '08-polymorphic.join'],
  designs: [
    { key: 'typeid', name: 'type + id', orphans: 4, fk: 'không khai báo được', bad: '"Psot" và id 99 đều lưu được', code: null },
    { key: 'arc', name: 'exclusive arc', orphans: 0, fk: 'mỗi loại cha một cột FK', bad: 'không thuộc về ai → 23514', code: '23514' },
    { key: 'join', name: 'bảng riêng cho từng loại cha', orphans: 0, fk: 'mỗi bảng một FK', bad: 'không thể ghi sai loại', code: null }
  ] });

const B0 = { SYSTEM_CASH: '0.00', STORE_Q7: '0.00', CUS_DAT: '0.00' };
const B2 = { SYSTEM_CASH: '-100000.00', STORE_Q7: '45000.00', CUS_DAT: '55000.00' };
w('w9', { sources: ['09-ledger.post', '09-ledger.attack-overdraft', '09-ledger.attack-unbalanced', '09-ledger.attack-duplicate', '09-ledger.attack-edit', '09-ledger.reconcile', '09-ledger-race.ordered.B'],
  steps: [
    { label: 'Khởi tạo 3 ví', entries: [], balances: B0 },
    { label: 'post_transfer(1 → 3, 100000, topup-001)', entries: [['topup-001', 'SYSTEM_CASH', '-100000.00'], ['topup-001', 'CUS_DAT', '100000.00']], balances: { SYSTEM_CASH: '-100000.00', STORE_Q7: '0.00', CUS_DAT: '100000.00' } },
    { label: 'post_transfer(3 → 2, 45000, order-DH001)', entries: [['order-DH001', 'CUS_DAT', '-45000.00'], ['order-DH001', 'STORE_Q7', '45000.00']], balances: B2 },
    { label: 'Tấn công 1: mua 999999 khi chỉ còn 55000', code: '23514', balances: B2 },
    { label: 'Tấn công 2: chỉ ghi một bút toán +50000', code: '23514', balances: B2 },
    { label: 'Tấn công 3: gửi lại order-DH001', code: '23505', balances: B2 },
    { label: 'Tấn công 4: UPDATE thẳng một bút toán cũ', code: '23001', balances: B2 },
    { label: 'Ai đó cộng tay 5000 vào STORE_Q7', drift: 1, balances: { SYSTEM_CASH: '-100000.00', STORE_Q7: '50000.00', CUS_DAT: '55000.00' } },
    { label: 'Đối soát: tính lại số dư từ sổ cái', drift: 0, balances: B2 }
  ],
  race: { unorderedVictim: 'A', orderedBWaitMs: 4926.950 } });

function plan(file, start) {
  const t = fs.readFileSync(`runs/${file}.txt`, 'utf8').split('\n');
  const i = t.findIndex((l) => l.startsWith(start));
  const out = [];
  for (let k = i + 3; k < t.length && !/^\(\d+ rows?\)/.test(t[k]); k++) out.push(t[k]);
  return out;
}
w('w10', { sources: ['07-views.inline', '07-views.pushdown', '07-views.fence'],
  plans: {
    inline: plan('07-views.inline', 'EXPLAIN (COSTS OFF) SELECT * FROM v_order_lines'),
    pushdown: plan('07-views.pushdown', 'EXPLAIN (COSTS OFF) SELECT * FROM v_customer_revenue'),
    fence: plan('07-views.fence', 'EXPLAIN (COSTS OFF) SELECT * FROM v_top_lines')
  } });
console.log('đã ghi:', fs.readdirSync('runs/data').join(' '));
