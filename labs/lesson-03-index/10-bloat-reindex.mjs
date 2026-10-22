// Lab 3.10 — Slide 37 "B+Tree might become imbalanced over time → rebuild".
// A B+Tree cannot become unbalanced: every leaf stays at the same depth after any insert or delete.
// What really degrades is fill. Deleted entries leave nearly empty leaf pages that VACUUM cleans but does not
// give back, so the index keeps its size and a range scan still walks as many pages as before (= bloat).
// REINDEX rebuilds the tree from the live rows only. CONCURRENTLY keeps reads and writes running meanwhile,
// but it cannot run inside a transaction block (TypeORM migration: `transaction = false`).
// Works on the scratch table l10_bloat (dropped at start and end); the base tables are not touched.
import { connect, measure, indexShape, printTable, heading, verdict, fmtBytes, fmtInt } from './pg-explain-kit.mjs';

const TABLE = 'l10_bloat';
const INDEX = 'l10_bloat_k';
// k is uniform over 0 .. 2^31-1, so k < 21,474,836 is 1% of the key range (and of the rows).
const RANGE_SQL = `SELECT count(*) FROM ${TABLE} WHERE k < 21474836`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * VACUUM may only remove deleted rows (and mark pages all-visible, which Index Only Scan needs) once no open
 * transaction can still see the old state. A lab running next to this one may hold such a snapshot for a few
 * seconds, so repeat until the table is fully clean; otherwise page counts would differ from run to run.
 */
async function vacuumUntilClean(client) {
  for (let attempt = 1; attempt <= 120; attempt++) {
    await client.query(`VACUUM ${TABLE}`);
    const { rows } = await client.query(
      `SELECT t.dead_tuple_count AS dead, c.relpages AS pages, c.relallvisible AS visible
         FROM pgstattuple($1::regclass) t, pg_class c WHERE c.oid = $1::regclass`,
      [TABLE],
    );
    const s = rows[0];
    if (Number(s.dead) === 0 && s.visible === s.pages) return;
    if (attempt === 1) console.error('   (chờ phiên khác kết thúc transaction để VACUUM dọn được hết...)');
    await sleep(500);
  }
  throw new Error(`VACUUM ${TABLE} chưa dọn sạch sau 60 giây: có transaction nào mở quá lâu? Xem pg_stat_activity.`);
}

/** Index shape (pgstatindex) plus the cost of the same 1% range query at this moment. */
async function snapshot(client, label) {
  const shape = await indexShape(client, INDEX);
  const m = await measure(client, RANGE_SQL, { runs: 1 });
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${TABLE}`);
  return { label, live: rows[0].n, ...shape, plan: m.plan, rangeRows: m.raw.Plans[0]['Actual Rows'], pages: m.pages };
}

const client = await connect();
try {
  console.log('Lab 3.10 — B+Tree không "mất cân bằng": xóa 90% chỉ làm index rỗng ruột (bloat), REINDEX mới thu nhỏ (slide 37)');
  await client.query(`DROP TABLE IF EXISTS ${TABLE}`);
  // Autovacuum off for this scratch table only: no background VACUUM/ANALYZE racing the steps below.
  await client.query(`CREATE TABLE ${TABLE} (id int NOT NULL, k int NOT NULL) WITH (autovacuum_enabled = false)`);
  // k = deterministic hash of the row number: random-looking order, same values on every run.
  await client.query(`INSERT INTO ${TABLE} SELECT g, h(g, 31) FROM generate_series(1, 1000000) g`);
  await client.query(`CREATE INDEX ${INDEX} ON ${TABLE} (k)`);
  await client.query(`ANALYZE ${TABLE}`);
  await vacuumUntilClean(client);
  const built = await snapshot(client, '1. Vừa tạo index');

  // Keep every 10th row. Survivors are spread over the whole key range, so almost every leaf keeps ~10% of its
  // entries and no leaf becomes completely empty (only empty leaves can be removed from the tree).
  await client.query(`DELETE FROM ${TABLE} WHERE id % 10 <> 0`);
  await vacuumUntilClean(client);
  const deleted = await snapshot(client, '2. Xóa 90% + VACUUM');

  await client.query(`REINDEX INDEX CONCURRENTLY ${INDEX}`); // autocommit: no BEGIN around it
  const rebuilt = await snapshot(client, '3. REINDEX CONCURRENTLY');

  const steps = [built, deleted, rebuilt];
  heading(`Index ${INDEX} trên ${TABLE}(k) và truy vấn 1% khoảng k: ${RANGE_SQL}`);
  printTable(steps, [
    ['Giai đoạn', (x) => x.label],
    ['Dòng trong bảng', (x) => fmtInt(x.live), 'right'],
    ['Kích thước', (x) => fmtBytes(x.bytes), 'right'],
    ['Level', (x) => x.level, 'right'],
    ['Trang lá', (x) => fmtInt(x.leafPages), 'right'],
    ['Mật độ lá', (x) => `${x.density.toFixed(1)}%`, 'right'],
    ['Dòng khớp', (x) => fmtInt(x.rangeRows), 'right'],
    ['Trang đọc', (x) => fmtInt(x.pages), 'right'],
  ]);
  const plans = [...new Set(steps.map((x) => x.plan))];
  console.log(`Kế hoạch của truy vấn khoảng: ${plans.join(' | ')}`);

  heading('Kết luận');
  verdict(
    deleted.bytes === built.bytes,
    `Xóa 90% + VACUUM: index vẫn ${fmtBytes(deleted.bytes)} (trước ${fmtBytes(built.bytes)}), ${fmtInt(deleted.leafPages)} trang lá — VACUUM không trả trang`,
  );
  verdict(
    deleted.density < built.density / 3,
    `Mật độ lá sụp ${built.density.toFixed(1)}% → ${deleted.density.toFixed(1)}%: mỗi trang 8 KB giờ chủ yếu là chỗ trống`,
  );
  verdict(
    deleted.level === built.level,
    `Level ${built.level} → ${deleted.level}: cây vẫn cân bằng (mọi lá cùng độ sâu); "mất cân bằng" thực chất là bloat`,
  );
  verdict(
    deleted.pages >= built.pages * 0.8,
    `Truy vấn 1% khoảng: ${fmtInt(built.rangeRows)} → ${fmtInt(deleted.rangeRows)} dòng nhưng vẫn đọc ${fmtInt(built.pages)} → ${fmtInt(deleted.pages)} trang`,
  );
  const ratio = rebuilt.bytes / deleted.bytes;
  const lower = rebuilt.level < deleted.level ? `, level ${deleted.level} → ${rebuilt.level} vì còn 1/10 số mục` : '';
  verdict(
    ratio <= 0.15 && rebuilt.density >= 80 && rebuilt.pages <= deleted.pages / 3,
    `REINDEX CONCURRENTLY: ${fmtBytes(deleted.bytes)} → ${fmtBytes(rebuilt.bytes)} (${ratio.toFixed(2)}×), mật độ lá `
      + `${rebuilt.density.toFixed(1)}%${lower}; truy vấn khoảng ${fmtInt(deleted.pages)} → ${fmtInt(rebuilt.pages)} trang`,
  );
} finally {
  await client.query(`DROP TABLE IF EXISTS ${TABLE}`).catch((err) => {
    console.error(`Không xóa được ${TABLE} (${err.message}). Chạy: npm run check`);
    process.exitCode = 1;
  });
  await client.end();
}
