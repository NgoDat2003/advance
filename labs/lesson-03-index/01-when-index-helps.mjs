// Lab 3.01 — When does an index help? (slides 4, 31)
// Part A: real IMDb ratings (1.7M rows). The same query at four thresholds, without and with an index on num_votes.
//         The index is created inside BEGIN ... ROLLBACK: Postgres DDL is transactional, so lab_imdb is left untouched.
// Part B: an index on a 50/50 column (gender): the planner may pick it, but it still reads every page of the table.
// Part C: a 50-row table where a Seq Scan of one page beats any index.
// `--json` also prints the sweep as one JSON line for the guide's calculator widget.
import {
  connect, measure, inRollback, assertImdbUntouched, printTable, printMeasurements, heading, verdict, fmtInt, fmtMs,
} from './pg-explain-kit.mjs';

const client = await connect();
const THRESHOLDS = [1000000, 100000, 10000, 1000];
const ratingsSql = (t) => `SELECT tconst, average_rating FROM lab_imdb.ratings WHERE num_votes >= ${t}`;

console.log('Lab 3.01 — Index chỉ giúp khi lọc ra một phần nhỏ của bảng (slide 4, 31)');

heading('A. lab_imdb.ratings (1.721.260 dòng): cùng một câu, 4 ngưỡng num_votes');
const sweep = [];
for (const t of THRESHOLDS) sweep.push({ t, seq: await measure(client, ratingsSql(t)) });

await inRollback(client, async () => {
  await client.query('SET LOCAL maintenance_work_mem = \'256MB\'');
  const started = performance.now();
  await client.query('CREATE INDEX lab03_tmp_votes ON lab_imdb.ratings (num_votes)');
  const buildMs = performance.now() - started;
  // An index built in this same transaction is invisible to it when indcheckxmin is true (broken HOT chains).
  const { rows: [chk] } = await client.query(
    `SELECT indcheckxmin, pg_relation_size(indexrelid) AS bytes FROM pg_index WHERE indexrelid = 'lab_imdb.lab03_tmp_votes'::regclass`,
  );
  console.log(`Tạo index tạm ratings(num_votes): ${fmtMs(buildMs)} ms, ${(chk.bytes / 2 ** 20).toFixed(1)} MB, indcheckxmin = ${chk.indcheckxmin}`);
  for (const s of sweep) s.idx = await measure(client, ratingsSql(s.t));
  // What if we force the index for the biggest result? (ép = forced plan)
  await client.query('SET LOCAL enable_seqscan = off');
  await client.query('SET LOCAL enable_bitmapscan = off');
  sweep.at(-1).forced = await measure(client, ratingsSql(THRESHOLDS.at(-1)));
});

const pct = (rows) => `${((rows / 1721260) * 100).toFixed(rows < 17213 ? 2 : 1)}%`;
printTable(sweep, [
  ['num_votes ≥', (s) => fmtInt(s.t), 'right'],
  ['Dòng', (s) => fmtInt(s.seq.rows), 'right'],
  ['Tỉ lệ', (s) => pct(s.seq.rows), 'right'],
  ['Không index: trang', (s) => fmtInt(s.seq.pages), 'right'],
  ['ms', (s) => fmtMs(s.seq.ms), 'right'],
  ['Có index: kế hoạch', (s) => s.idx.plan.replace(/ \(lab03_tmp_votes\)| \(ratings\)/g, '')],
  ['trang', (s) => fmtInt(s.idx.pages), 'right'],
  ['ms', (s) => fmtMs(s.idx.ms), 'right'],
]);
const last = sweep.at(-1);
console.log(`Ép dùng Index Scan cho ngưỡng ${fmtInt(last.t)} (ép): ${fmtInt(last.forced.pages)} trang, ${fmtMs(last.forced.ms)} ms`);
verdict(sweep[0].idx.pages * 10 < sweep[0].seq.pages, `${fmtInt(sweep[0].seq.rows)} dòng: index đọc ${fmtInt(sweep[0].idx.pages)} trang thay vì ${fmtInt(sweep[0].seq.pages)}`);
verdict(last.idx.pages > 0.9 * last.seq.pages, `${pct(last.seq.rows)} số dòng: vẫn chạm ${fmtInt(last.idx.pages)} trang (cả bảng chỉ có ${fmtInt(last.seq.pages)}), index không bớt được trang (chỉ nhanh hơn vì xử lý ${fmtInt(last.seq.rows)} dòng thay vì lọc cả 1,7 triệu)`);
verdict(last.forced.pages > 5 * last.seq.pages, `ép Index Scan: ${fmtInt(last.forced.pages)} lượt chạm trang (cùng ${fmtInt(last.seq.pages)} trang bị chạm lặp lại), gấp ${Math.round(last.forced.pages / last.seq.pages)} lần quét tuần tự; chỉ rẻ khi mọi trang đã nằm trong RAM`);
await assertImdbUntouched(client);

heading('B. Cột chỉ có 2 giá trị: users.gender (50/50)');
const genderSql = "SELECT id, name FROM users WHERE gender = 'F'";
const genderSeq = await measure(client, genderSql, { runs: 3 });
const gender = await inRollback(client, async () => {
  await client.query('CREATE INDEX l01_gender ON users (gender)');
  return measure(client, genderSql, { runs: 3 });
});
printMeasurements([{ label: "gender = 'F', chưa có index", m: genderSeq }, { label: "gender = 'F', có index", m: gender }]);
verdict(gender.pages >= genderSeq.pages, `có index vẫn đọc ${fmtInt(gender.pages)} trang (không index: ${fmtInt(genderSeq.pages)}): lấy nửa bảng thì phải đọc gần hết các trang`);

heading('C. Bảng quá nhỏ: 50 dòng nằm gọn trong 1 trang');
await client.query('DROP TABLE IF EXISTS l01_tiny');
try {
  await client.query('CREATE TABLE l01_tiny AS SELECT g AS id, md5(g::text) AS note FROM generate_series(1, 50) g');
  await client.query('ALTER TABLE l01_tiny ADD PRIMARY KEY (id)');
  await client.query('ANALYZE l01_tiny');
  const tiny = await measure(client, 'SELECT * FROM l01_tiny WHERE id = 7');
  printMeasurements([{ label: 'id = 7 (có khóa chính)', m: tiny }]);
  verdict(!tiny.usesIndex, `bảng ${tiny.pages} trang: đọc thẳng nhanh hơn đi qua index`);
} finally {
  await client.query('DROP TABLE IF EXISTS l01_tiny');
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ lab: '01', sweep: sweep.map((s) => ({
    threshold: s.t, rows: s.seq.rows, seqPages: s.seq.pages, seqMs: +s.seq.ms.toFixed(2),
    idxPlan: s.idx.plan, idxPages: s.idx.pages, idxMs: +s.idx.ms.toFixed(2),
  })), forced: { pages: last.forced.pages, ms: +last.forced.ms.toFixed(2) } }));
}
await client.end();
