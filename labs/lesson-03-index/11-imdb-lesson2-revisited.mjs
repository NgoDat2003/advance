// Lab 3.11 — Lesson 2's "Top 10 movies of a year" query, revisited with indexes (closes lesson 2's promise).
// Lesson 2 hid this query behind Redis (149 ms on a miss, ~1 ms on a hit). The first reader and every expiry still pay
// the full price, so here we look for the index that removes the cost instead of hiding it.
// Every index is created inside one transaction that ends in ROLLBACK: lab_imdb keeps only its two primary keys.
// Flags: --skip-titles skips the variants that build an index on titles (that build scans 1.9 GB).
import {
  connect, measure, assertImdbUntouched, printTable, heading, verdict, fmtInt, fmtMs, fmtBytes,
} from './pg-explain-kit.mjs';

const YEAR = Number(process.env.YEAR ?? 2015);
if (!Number.isInteger(YEAR) || YEAR < 1874 || YEAR > 2030) {
  console.error('YEAR phải là một năm hợp lệ, ví dụ: $env:YEAR = 2015');
  process.exit(1);
}
const skipTitles = process.argv.includes('--skip-titles');
const SQL = `
  SELECT t.primary_title, r.average_rating, r.num_votes
  FROM lab_imdb.titles t JOIN lab_imdb.ratings r ON r.tconst = t.tconst
  WHERE t.start_year = ${YEAR} AND t.title_type = 'movie' AND r.num_votes >= 10000
  ORDER BY r.average_rating DESC, r.num_votes DESC LIMIT 10`;

const INDEXES = {
  v1: 'CREATE INDEX lab03_tmp_v1 ON lab_imdb.ratings (num_votes)',
  v2: `CREATE INDEX lab03_tmp_v2 ON lab_imdb.ratings (average_rating DESC, num_votes DESC) INCLUDE (tconst)
         WHERE num_votes >= 10000`,
  v3: `CREATE INDEX lab03_tmp_v3 ON lab_imdb.titles (start_year) INCLUDE (tconst, primary_title)
         WHERE title_type = 'movie'`,
};

const loopsInto = (node, index) => (node['Index Name'] === index ? node['Actual Loops'] : 0)
  + (node.Plans ?? []).reduce((s, c) => s + loopsInto(c, index), 0);
const shortPlan = (plan) => plan.replace(/^Limit > /, '').replace(/ \(lab03_tmp_(v\d)\)/g, ' ($1)');

console.log(`Lab 3.11 — Truy vấn "Top 10 phim năm ${YEAR}" của Bài 2: thêm index nào thì hết chậm?`);
const parallel = await connect({ parallel: true }); // server default, same as lesson 2's lab 6
const serial = await connect();
const answer = async (c) => JSON.stringify((await c.query(SQL)).rows);
const baseline = await answer(parallel);
const first = JSON.parse(baseline)[0];
if (!first) {
  console.error(`Năm ${YEAR} không có phim nào đủ 10.000 lượt vote. Thử năm khác, ví dụ 2015.`);
  process.exit(1);
}
console.log(`Kết quả gốc: #1 = ${first.primary_title} (${first.average_rating}★, ${first.num_votes} votes)`);

heading('A. Chưa thêm index nào: tiền nằm ở đâu?');
const v0 = await measure(parallel, SQL);
const v0s = await measure(serial, SQL);
printTable([
  { name: 'Song song (như Bài 2)', m: v0 },
  { name: 'Tắt song song', m: v0s },
], [
  ['Cấu hình', (x) => x.name],
  ['Kế hoạch', (x) => shortPlan(x.m.plan)],
  ['Tra titles_pkey', (x) => fmtInt(loopsInto(x.m.raw, 'titles_pkey')), 'right'],
  ['Trang', (x) => fmtInt(x.m.pages), 'right'],
  ['ms', (x) => fmtMs(x.m.ms), 'right'],
]);
const lookups = loopsInto(v0s.raw, 'titles_pkey');
verdict(lookups * 4 > v0s.pages / 2, `${fmtInt(lookups)} lần tra khóa chính titles (mỗi lần ~5 trang) chiếm phần lớn ${fmtInt(v0s.pages)} trang, không phải lần quét ratings (10,992 trang)`);

heading('B. Thử từng index (tất cả trong một transaction, cuối cùng ROLLBACK)');
const rows = [{ name: 'V0 không thêm gì', idx: '—', m: v0, same: true }];
const build = async (key) => {
  const started = performance.now();
  await parallel.query(INDEXES[key]);
  const ms = performance.now() - started;
  const { rows: [r] } = await parallel.query(
    `SELECT indcheckxmin, pg_relation_size(indexrelid) AS b FROM pg_index WHERE indexrelid = 'lab_imdb.lab03_tmp_${key}'::regclass`,
  );
  if (r.indcheckxmin) console.log(`! lab03_tmp_${key}: indcheckxmin = true, transaction này không dùng được index vừa tạo`);
  return `${fmtBytes(Number(r.b))}, tạo ${(ms / 1000).toFixed(1)} s`;
};
const tryVariant = async (name, idx) => rows.push({ name, idx, m: await measure(parallel, SQL), same: (await answer(parallel)) === baseline });

await parallel.query('BEGIN');
try {
  await parallel.query("SET LOCAL maintenance_work_mem = '256MB'");
  // Each variant is undone with ROLLBACK TO SAVEPOINT instead of DROP INDEX: CREATE INDEX only takes a SHARE lock
  // (readers such as lesson 2's lab keep working), whereas DROP INDEX would lock the table for everyone until ROLLBACK.
  await parallel.query('SAVEPOINT s0');
  await tryVariant('V1 ratings(num_votes)', await build('v1'));
  await parallel.query('ROLLBACK TO SAVEPOINT s0');
  const v2Info = await build('v2');
  await tryVariant('V2 ratings xếp theo điểm, partial, INCLUDE', v2Info);
  await parallel.query('ROLLBACK TO SAVEPOINT s0');
  if (!skipTitles) {
    const v3Info = await build('v3');
    await tryVariant('V3 titles partial, INCLUDE', v3Info);
    await build('v2');
    await tryVariant('V2 + V3 (titles partial, INCLUDE)', `V2 ${v2Info.split(',')[0]} + V3 ${v3Info.split(',')[0]}`);
  }
} finally {
  await parallel.query('ROLLBACK');
}
printTable(rows, [
  ['Phương án', (x) => x.name],
  ['Index (kích thước, thời gian tạo)', (x) => x.idx],
  ['Kế hoạch', (x) => shortPlan(x.m.plan)],
  ['Trang', (x) => fmtInt(x.m.pages), 'right'],
  ['ms', (x) => fmtMs(x.m.ms), 'right'],
  ['Kết quả đúng', (x) => (x.same ? '✔' : '✘'), 'right'],
]);
console.log(`Định nghĩa index:\n  V1: ${INDEXES.v1}\n  V2: ${INDEXES.v2.replace(/\s+/g, ' ')}\n  V3: ${INDEXES.v3.replace(/\s+/g, ' ')}`);

const best = rows.slice(1).reduce((a, b) => (b.m.pages < a.m.pages ? b : a));
const v1 = rows[1].m;
verdict(rows.every((r) => r.same), 'mọi phương án trả về đúng 10 dòng như Bài 2: index không đổi kết quả, chỉ đổi đường đi');
verdict(v1.pages > v0.pages / 4, `V1 (index "hiển nhiên" trên num_votes) chỉ giảm ${fmtInt(v0.pages)} → ${fmtInt(v1.pages)} trang: phần đắt vẫn là các lần tra titles`);
if (skipTitles) {
  console.log(`(Đã bỏ qua V3 và V2 + V3 vì --skip-titles; tốt nhất trong các phương án đã thử: ${best.name}, ${fmtInt(best.m.pages)} trang)`);
} else {
  verdict(best.m.pages * 20 < v0.pages, `tốt nhất: ${best.name} với ${fmtInt(best.m.pages)} trang, ${fmtMs(best.m.ms)} ms (V0: ${fmtInt(v0.pages)} trang, ${fmtMs(v0.ms)} ms)`);
}
console.log(`So với cache Bài 2 (Redis HIT 1.24 ms, MISS 149 ms): index tốt nhất chạm ${fmtInt(best.m.pages)} trang ở mọi lần đọc, kể cả lần đầu tiên khi cache còn trống (${fmtMs(best.m.ms)} ms đo lúc các trang đã nằm trong RAM).`);

await assertImdbUntouched(serial);
await parallel.end();
await serial.end();
