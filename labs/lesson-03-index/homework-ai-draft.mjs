// Bài tập bài 3 (slide 41) — Phần C: bản nháp thí nghiệm do AI viết để kiểm chứng 3 lý thuyết (slide 26, 28, 31)
// trên bảng hw_contracts. Nhiệm vụ: đọc code + kết quả in ra, tìm lỗi thiết kế thí nghiệm, điền bảng "lỗi → cách sửa".
// Chạy: npm run homework:draft   (cần chạy npm run homework:setup trước)
import pg from 'pg';

const SCHEMA = 'lab03_indexing';
const TABLE = `${SCHEMA}.hw_contracts`;
const COPY_TABLE = `${SCHEMA}.hw_draft_contracts_copy`;
const INDEXES = ['idx_contracts_store_status', 'idx_contracts_status_store', 'idx_contracts_status'];

const findings = [];

function createClient() {
  if (!process.env.PG_URL) {
    console.error('Thiếu biến môi trường PG_URL.');
    process.exit(1);
  }
  try {
    return new pg.Client({ connectionString: process.env.PG_URL, application_name: 'homework-ai-draft' });
  } catch (err) {
    console.error(`PG_URL không hợp lệ (${err.code ?? 'lỗi định dạng'}).`);
    process.exit(1);
  }
}

async function timeQuery(client, sql) {
  const start = Date.now();
  const result = await client.query(sql);
  return { ms: Date.now() - start, rows: result.rowCount };
}

async function explainAnalyze(client, sql) {
  const { rows } = await client.query(`EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`);
  return rows[0]['QUERY PLAN'][0].Plan;
}

function findScanNode(node) {
  if (node['Node Type'].includes('Scan')) return node;
  for (const child of node.Plans ?? []) {
    const found = findScanNode(child);
    if (found) return found;
  }
  return null;
}

async function relationSize(client, name) {
  const { rows } = await client.query('SELECT pg_size_pretty(pg_relation_size($1::regclass)) AS size', [name]);
  return rows[0].size;
}

async function cleanup(client) {
  for (const name of INDEXES) await client.query(`DROP INDEX IF EXISTS ${SCHEMA}.${name}`);
  await client.query(`DROP TABLE IF EXISTS ${COPY_TABLE}`);
}

// Theory 1 (slide 26): high-cardinality column first makes a composite index faster.
async function testCompositeColumnOrder(client) {
  console.log('\n[1] Slide 26: cột có cardinality cao (store_id: 200 giá trị) đặt trước status (4 giá trị) có nhanh hơn?');
  await client.query(`CREATE INDEX idx_contracts_store_status ON ${TABLE} (store_id, status)`);
  await client.query(`CREATE INDEX idx_contracts_status_store ON ${TABLE} (status, store_id)`);

  const statusFirst = await timeQuery(client, `SELECT * FROM ${TABLE} WHERE status = 'TERMINATED' AND store_id = 42`);
  const storeFirst = await timeQuery(client, `SELECT * FROM ${TABLE} WHERE store_id = 42 AND status = 'TERMINATED'`);

  console.log(`    (status, store_id): ${statusFirst.ms} ms, ${statusFirst.rows} dòng`);
  console.log(`    (store_id, status): ${storeFirst.ms} ms, ${storeFirst.rows} dòng`);

  const speedup = statusFirst.ms / Math.max(storeFirst.ms, 1);
  if (speedup >= 1) {
    findings.push(['Slide 26', `ĐÚNG — (store_id, status) nhanh hơn ${speedup.toFixed(1)}×`, 'Luôn đặt cột cardinality cao lên đầu index']);
    console.log(`    => (store_id, status) nhanh hơn ${speedup.toFixed(1)}×. Lý thuyết ĐÚNG.`);
  } else {
    const inverse = storeFirst.ms / Math.max(statusFirst.ms, 1);
    findings.push(['Slide 26', `SAI — (status, store_id) nhanh hơn ${inverse.toFixed(1)}×`, 'Đặt cột cardinality thấp lên đầu index']);
    console.log(`    => (status, store_id) nhanh hơn ${inverse.toFixed(1)}×. Lý thuyết SAI.`);
  }
}

// Theory 2 (slide 28): a covering index lets the database answer from the index alone.
async function testCoveringIndex(client) {
  console.log('\n[2] Slide 28: covering index có giúp Postgres trả kết quả mà không đọc bảng?');
  // Work on a copy so the shared table is not modified by the write workload below.
  await client.query(`CREATE TABLE ${COPY_TABLE} WITH (autovacuum_enabled = false) AS SELECT * FROM ${TABLE}`);
  // Realistic workload: renew a batch of expired contracts before measuring.
  const renewed = await client.query(
    `UPDATE ${COPY_TABLE} SET status = 'ACTIVE', total = total * 1.05 WHERE status = 'EXPIRED' AND store_id <= 20`,
  );
  await client.query(`CREATE INDEX idx_copy_customer_covering ON ${COPY_TABLE} (customer_id, signed_at) INCLUDE (total)`);
  await client.query(`ANALYZE ${COPY_TABLE}`);
  console.log(`    Bảng copy: ${await relationSize(client, COPY_TABLE)}, đã gia hạn ${renewed.rowCount} hợp đồng`);
  console.log(`    Index (customer_id, signed_at) INCLUDE (total): ${await relationSize(client, `${SCHEMA}.idx_copy_customer_covering`)}`);

  const fullRow = findScanNode(await explainAnalyze(client,
    `SELECT * FROM ${COPY_TABLE} WHERE customer_id = 42 ORDER BY signed_at DESC LIMIT 5`));
  console.log(`    SELECT * ...: ${fullRow['Node Type']} trên ${fullRow['Index Name'] ?? fullRow['Relation Name']}`);

  const narrow = findScanNode(await explainAnalyze(client,
    `SELECT signed_at, total FROM ${COPY_TABLE} WHERE customer_id = 42 ORDER BY signed_at DESC LIMIT 5`));
  const heapFetches = narrow['Heap Fetches'] ?? narrow['Actual Rows'];
  console.log(`    SELECT signed_at, total ...: ${narrow['Node Type']}, Heap Fetches ${heapFetches}/${narrow['Actual Rows']} dòng`);

  if (heapFetches > 0) {
    findings.push(['Slide 28', 'SAI trên Postgres — vẫn đọc bảng', 'Không dùng INCLUDE, tiết kiệm dung lượng']);
    console.log('    => Postgres vẫn phải đọc bảng cho mọi dòng. Covering index vô dụng trên Postgres (chỉ đúng với MySQL).');
  } else {
    findings.push(['Slide 28', 'ĐÚNG', 'Dùng INCLUDE cho truy vấn nóng']);
    console.log('    => Không đọc bảng. Lý thuyết ĐÚNG.');
  }
}

// Theory 3 (slide 31): do not index low-cardinality columns.
async function testLowCardinalityIndex(client) {
  console.log('\n[3] Slide 31: có nên đánh index cho status (chỉ 4 giá trị)?');
  await client.query(`CREATE INDEX idx_contracts_status ON ${TABLE} (status)`);
  console.log(`    Index (status): ${await relationSize(client, `${SCHEMA}.idx_contracts_status`)}`);

  const sql = `SELECT * FROM ${TABLE} WHERE status = 'ACTIVE'`;
  const scan = findScanNode(await explainAnalyze(client, sql));
  const timing = await timeQuery(client, sql);
  console.log(`    status = 'ACTIVE': ${scan['Node Type']}, ${timing.rows} dòng, ${timing.ms} ms`);

  if (!scan['Node Type'].includes('Index') && !scan['Node Type'].includes('Bitmap')) {
    findings.push(['Slide 31', 'ĐÚNG — Postgres bỏ qua index status', 'DROP INDEX idx_contracts_status']);
    console.log('    => Postgres không dùng index status. Lý thuyết ĐÚNG: đừng index cột ít giá trị, xoá index này.');
  } else {
    findings.push(['Slide 31', 'SAI — index status được dùng', 'Giữ index status']);
    console.log('    => Index status được dùng. Lý thuyết SAI.');
  }
}

function printSummary() {
  console.log('\n=== KẾT LUẬN CỦA THÍ NGHIỆM ===');
  const width = Math.max(...findings.map(([, verdict]) => verdict.length));
  for (const [slide, verdict, action] of findings) {
    console.log(`  ${slide.padEnd(9)} ${verdict.padEnd(width)}  → ${action}`);
  }
  console.log('Khuyến nghị cho hệ thống hợp đồng: áp dụng 3 hành động trên cho mọi bảng tương tự.');
}

async function main() {
  const client = createClient();
  try {
    await client.connect();
  } catch (err) {
    console.error(`Không kết nối được Postgres: ${err.message}`);
    process.exitCode = 1;
    return;
  }
  try {
    await cleanup(client);
    await testCompositeColumnOrder(client);
    await testCoveringIndex(client);
    await testLowCardinalityIndex(client);
    printSummary();
  } catch (err) {
    console.error(`Thí nghiệm lỗi: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await cleanup(client);
    await client.end();
  }
}

await main();
