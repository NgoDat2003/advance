// Lab 3.05 — Composite index: column order decides WHICH queries can seek, not how tall the tree is (slides 23–27).
// A. Index (country, province, name) on users with slide 25's four queries (+ country = 'SG'). Postgres 16 has no
//    skip scan: without the leading column it can only read the WHOLE index, and "usable" is not the same as "chosen".
// B. Slide 26 says "high cardinality first → more branches → faster". Same three columns reversed (name, province,
//    country): compare size, tree level and pages for the all-equality query, then the queries each order can serve.
// C. Slide 27 on t_ab: (a, b) vs (b, a) for a range on a plus b = 2. SELECT a, b is answered from the index alone,
//    so the pages count is the index pages the scan walked. Index Cond shows which columns bound the scan.
// Base tables stay untouched: every index lives inside BEGIN ... ROLLBACK.
import {
  connect, measure, inRollback, indexShape, relBytes, printTable, printMeasurements, heading, verdict,
  fmtBytes, fmtInt, fmtMs,
} from './pg-explain-kit.mjs';

const client = await connect();
console.log('Lab 3.05 — Index nhiều cột: thứ tự cột quyết định truy vấn nào "seek" được, không quyết định độ cao cây (slide 23–27)');

const findNode = (n, type) => (n['Node Type'] === type ? n : (n.Plans ?? []).map((c) => findNode(c, type)).find(Boolean));
const nodePages = (n) => (n ? n['Shared Hit Blocks'] + n['Shared Read Blocks'] : 0);
/** Pages read inside the index itself, when the plan separates them (Bitmap Index Scan node). */
const bitmapIndexPages = (m) => nodePages(findNode(m.raw, 'Bitmap Index Scan'));
const pct = (a, b) => `${((100 * a) / b).toFixed(0)}%`;

/** Natural plan, then the opposite choice labelled "(ép)": an index if Postgres chose Seq Scan, Seq Scan otherwise. */
async function naturalAndForced(label, sql) {
  const natural = await measure(client, sql);
  const knobs = natural.usesIndex ? ['enable_indexscan', 'enable_bitmapscan', 'enable_indexonlyscan'] : ['enable_seqscan'];
  for (const k of knobs) await client.query(`SET LOCAL ${k} = off`);
  const forced = await measure(client, sql);
  for (const k of knobs) await client.query(`RESET ${k}`);
  return [{ label, m: natural }, { label: `${label} (ép ${natural.usesIndex ? 'Seq Scan' : 'dùng index'})`, m: forced }];
}

const Q = {
  q1: "SELECT * FROM users WHERE province = 'Texas' AND country = 'US'",
  q1Swapped: "SELECT * FROM users WHERE country = 'US' AND province = 'Texas'",
  q2: "SELECT * FROM users WHERE province = 'Texas'",
  q3: "SELECT * FROM users WHERE name = 'Jane Nguyen' AND province = 'Texas'",
  q4: "SELECT * FROM users WHERE country = 'US'",
  sg: "SELECT * FROM users WHERE country = 'SG'",
  all3: "SELECT * FROM users WHERE country = 'US' AND province = 'Texas' AND name = 'Jane Nguyen'",
  name: "SELECT * FROM users WHERE name = 'Jane Nguyen'",
};
const heapPages = (await relBytes(client, 'users')) / 8192;

// ---------- A + the (country, province, name) half of B, in one rolled-back transaction ----------
const cpn = await inRollback(client, async () => {
  await client.query('CREATE INDEX l05_cpn ON users (country, province, name)');
  const r = { shape: await indexShape(client, 'l05_cpn') };
  r.q1 = await measure(client, Q.q1);
  r.q1Swapped = await measure(client, Q.q1Swapped);
  r.q2 = await naturalAndForced('Q2 province', Q.q2);
  r.q3 = await measure(client, Q.q3);
  r.q4 = await naturalAndForced("Q4 country='US' (20%)", Q.q4);
  r.sg = await measure(client, Q.sg);
  r.all3 = await measure(client, Q.all3);
  r.name = await measure(client, Q.name);
  return r;
});

heading(`A. Slide 25 với index l05_cpn = (country, province, name) — bảng users có ${fmtInt(heapPages)} trang heap`);
printMeasurements([
  { label: 'Q1 province AND country', m: cpn.q1 },
  { label: 'Q1 đảo thứ tự WHERE', m: cpn.q1Swapped },
  ...cpn.q2,
  { label: 'Q3 name AND province', m: cpn.q3 },
  ...cpn.q4,
  { label: "country='SG' (0.5%)", m: cpn.sg },
]);
const leaf = cpn.shape.leafPages;
const [q2, q2f] = [cpn.q2[0].m, cpn.q2[1].m];
const [q4, q4f] = [cpn.q4[0].m, cpn.q4[1].m];
verdict(cpn.q1.usesIndex && bitmapIndexPages(cpn.q1) < leaf / 10,
  `Q1 có cột đầu → seek: phần index chỉ đọc ${fmtInt(bitmapIndexPages(cpn.q1))} / ${fmtInt(leaf)} trang lá, phần còn lại là ${fmtInt(cpn.q1.pages - bitmapIndexPages(cpn.q1))} trang heap của ${fmtInt(cpn.q1.rows)} dòng nằm rải rác`);
verdict(cpn.q1.plan === cpn.q1Swapped.plan && cpn.q1.pages === cpn.q1Swapped.pages,
  `Đảo thứ tự điều kiện trong WHERE: cùng kế hoạch, cùng ${fmtInt(cpn.q1Swapped.pages)} trang (planner tự sắp lại)`);
verdict(!q2.usesIndex && bitmapIndexPages(q2f) >= leaf * 0.9,
  `Q2 thiếu cột đầu: Postgres chọn ${q2.plan}; ép dùng index thì phải đọc ${fmtInt(bitmapIndexPages(q2f))} trang index = cả ${fmtInt(leaf)} trang lá (PG16 không có skip scan)`);
verdict(cpn.q3.usesIndex && cpn.q3.pages >= leaf * 0.9,
  `Q3 cũng thiếu cột đầu nhưng chỉ ${cpn.q3.rows} dòng: Postgres ${cpn.q3.usesIndex ? 'VẪN dùng' : 'không dùng'} index, đọc ${fmtInt(cpn.q3.pages)} trang ≈ toàn bộ lá — "dùng index" không có nghĩa là "seek"`);
const q4Index = q4.usesIndex ? q4 : q4f;
const q4Seq = q4.usesIndex ? q4f : q4;
verdict(q4Index.pages >= q4Seq.pages * 0.9,
  `Q4 dùng được index nhưng không bớt trang: bản index ${fmtInt(q4Index.pages)} trang vs Seq Scan ${fmtInt(q4Seq.pages)} trang; Postgres tự chọn ${q4.usesIndex ? 'index (Bitmap đọc heap theo thứ tự block)' : 'Seq Scan'} (${fmtMs(q4Index.ms)} vs ${fmtMs(q4Seq.ms)} ms)`);
verdict(cpn.sg.usesIndex && cpn.sg.pages < heapPages / 2,
  `country='SG' (${fmtInt(cpn.sg.rows)} dòng): ${fmtInt(cpn.sg.pages)} trang, ít hơn Seq Scan ${fmtInt(heapPages)} trang — index có ích khi lọc ít dòng`);

// ---------- B: the reversed order (name, province, country) ----------
const npc = await inRollback(client, async () => {
  await client.query('CREATE INDEX l05_npc ON users (name, province, country)');
  return {
    shape: await indexShape(client, 'l05_npc'),
    all3: await measure(client, Q.all3),
    sg: await measure(client, Q.sg),
    name: await measure(client, Q.name),
  };
});

heading('B. Slide 26 "cardinality cao đứng trước": (country, province, name) vs (name, province, country)');
const cell = (m) => `${fmtInt(m.pages)} trang · ${m.raw['Node Type']}`;
printTable([
  ['Kích thước', fmtBytes(cpn.shape.bytes), fmtBytes(npc.shape.bytes)],
  ['Số tầng của cây (level + 1)', cpn.shape.level + 1, npc.shape.level + 1],
  ['Trang lá', fmtInt(cpn.shape.leafPages), fmtInt(npc.shape.leafPages)],
  [`= cả 3 cột (${cpn.all3.rows} dòng)`, cell(cpn.all3), cell(npc.all3)],
  [`country = 'SG' (${fmtInt(cpn.sg.rows)} dòng)`, cell(cpn.sg), cell(npc.sg)],
  [`name = 'Jane Nguyen' (${cpn.name.rows} dòng)`, cell(cpn.name), cell(npc.name)],
], [
  ['Đo', (r) => r[0]],
  ['l05_cpn (country, province, name)', (r) => r[1], 'right'],
  ['l05_npc (name, province, country)', (r) => r[2], 'right'],
]);
const sizeDiff = Math.abs(cpn.shape.bytes - npc.shape.bytes) / cpn.shape.bytes;
verdict(cpn.shape.level === npc.shape.level && sizeDiff <= 0.1 && cpn.all3.pages === npc.all3.pages,
  `Đảo thứ tự cột: cùng ${cpn.shape.level + 1} tầng, kích thước lệch ${(sizeDiff * 100).toFixed(1)}%, cùng ${npc.all3.pages} trang cho truy vấn = cả 3 cột → cây không "nhiều nhánh hơn" nhờ cardinality`);
verdict(cpn.sg.pages < npc.sg.pages && npc.name.pages < cpn.name.pages,
  `Thứ tự chỉ đổi truy vấn nào seek được: country='SG' ${fmtInt(cpn.sg.pages)} (cpn) vs ${fmtInt(npc.sg.pages)} trang (npc, quét ${fmtInt(bitmapIndexPages(npc.sg))} trang index); name='Jane Nguyen' ${fmtInt(npc.name.pages)} (npc) vs ${fmtInt(cpn.name.pages)} trang (cpn)`);

// ---------- C: slide 27 on t_ab ----------
const C_QUERIES = [
  ['Q1 a > 1 AND b = 2', 'SELECT a, b FROM t_ab WHERE a > 1 AND b = 2'],
  ['Q2 a >= 1 AND b = 2', 'SELECT a, b FROM t_ab WHERE a >= 1 AND b = 2'],
  ['Q3 a BETWEEN 2 AND 8 AND b = 2', 'SELECT a, b FROM t_ab WHERE a BETWEEN 2 AND 8 AND b = 2'],
];
/** Measures the three queries with one index; forces index use (labelled "ép") only if Postgres picked Seq Scan. */
async function sliceC(indexName, cols) {
  return inRollback(client, async () => {
    await client.query(`CREATE INDEX ${indexName} ON t_ab (${cols})`);
    const out = { shape: await indexShape(client, indexName), rows: [] };
    for (const [label, sql] of C_QUERIES) {
      let m = await measure(client, sql);
      let forced = false;
      if (!m.usesIndex) {
        await client.query('SET LOCAL enable_seqscan = off');
        m = await measure(client, sql);
        await client.query('RESET enable_seqscan');
        forced = true;
      }
      const cond = findNode(m.raw, 'Index Only Scan') ?? findNode(m.raw, 'Index Scan') ?? findNode(m.raw, 'Bitmap Index Scan');
      out.rows.push({ label: forced ? `${label} (ép)` : label, index: `${indexName} (${cols})`, cond: cond?.['Index Cond'] ?? '—', m });
    }
    return out;
  });
}
const ab = await sliceC('l05_ab', 'a, b');
const ba = await sliceC('l05_ba', 'b, a');

heading(`C. Slide 27 trên t_ab (1 triệu dòng, a: 100 giá trị, b: 1.000 giá trị), SELECT a, b — index ${fmtBytes(ab.shape.bytes)}, ${fmtInt(ab.shape.leafPages)} trang lá`);
printTable([...ab.rows, ...ba.rows], [
  ['Truy vấn', (r) => r.label],
  ['Index', (r) => r.index],
  ['Index Cond', (r) => r.cond],
  ['Kế hoạch', (r) => r.m.raw['Node Type']],
  ['Dòng', (r) => fmtInt(r.m.rows), 'right'],
  ['Trang', (r) => fmtInt(r.m.pages), 'right'],
  ['ms', (r) => fmtMs(r.m.ms), 'right'],
]);
const [a1, a2, a3] = ab.rows.map((r) => r.m.pages);
const bMax = Math.max(...ba.rows.map((r) => r.m.pages));
const bInCond = ab.rows.slice(0, 2).every((r) => /\(b = 2\)/.test(r.cond));
verdict(bInCond && Math.abs(a1 - a2) <= 0.1 * a2 && a3 < a1 / 5,
  `(a, b): Q1 và Q2 đều có "b = 2" trong Index Cond nhưng b không thu hẹp vùng quét — Q1 ${fmtInt(a1)} ≈ Q2 ${fmtInt(a2)} trang (${pct(a1, ab.shape.leafPages)} số lá); Q3 khoảng a hẹp hơn → ${fmtInt(a3)} trang`);
verdict(bMax * 10 < Math.min(a1, a2, a3),
  `(b, a): seek thẳng b = 2 rồi đọc khoảng a liền nhau trong đoạn đó → tối đa ${bMax} trang cho cả 3 câu. Quy tắc: cột so sánh "=" trước, cột khoảng sau`);

await client.end();
