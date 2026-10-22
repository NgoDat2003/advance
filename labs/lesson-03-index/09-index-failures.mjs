// Lab 3.09 — Slides 32-36: five ways to own an index that the query still cannot use, measured on PostgreSQL 16.
// Every extra index is created inside BEGIN ... ROLLBACK, so the base tables keep only their original indexes.
// For each case the lab prints the plan Postgres picked and how many 8 KB pages it touched:
//   32 LIKE: a default btree on text (database collation en_US.utf8) cannot serve LIKE 'x%'; text_pattern_ops can.
//            '%x' and '%x%' need a trigram GIN index (or, for a suffix, a reverse(name) expression index).
//   33 OR: one unindexed branch forces a Seq Scan; once every branch has an index Postgres merges them (BitmapOr).
//   34 types: a quoted literal adapts to the column type; varchar = integer is an error (no silent conversion);
//            a cast on the column (code::int, or id = 10.0 which becomes id::numeric) hides the column from its index.
//   35 functions: length(name) is a different value from name; it needs an index on exactly length(name).
//   36 arithmetic: id + 1 = 10 is not "id = constant", so the btree on id is skipped.
// `--json` adds one line {"cards":[...]} that the index-failure widget (W5) in the teacher guide replays.
import { connect, measure, inRollback, printTable, heading, verdict, fmtInt } from './pg-explain-kit.mjs';

const json = process.argv.includes('--json');

/** Short label for the verdict lines: page count, or the error when the statement failed. */
const p = (r) => (r.error ? r.plan : `${fmtInt(r.pages)} trang`);

// Each group runs in its own rolled-back transaction. A string step is DDL; an object step is one measured case.
// `index` = the index the query hopes to use; `want` = plan fragment we expect ('LỖI <SQLSTATE>' = expected error).
const GROUPS = [
  {
    slide: 32, topic: 'LIKE',
    steps: [
      'CREATE INDEX l09_name ON users (name)',
      { id: '32a', where: "name LIKE 'ronin%'", index: 'btree(name)', want: 'Seq Scan' },
      'CREATE INDEX l09_name_pat ON users (name text_pattern_ops)',
      { id: '32b', where: "name LIKE 'ronin%'", index: 'btree(name text_pattern_ops)', want: 'Index' },
      { id: '32c', where: "name LIKE '%ronin'", index: 'btree(name text_pattern_ops)', want: 'Seq Scan' },
      { id: '32d', where: "name LIKE '%ronin%'", index: 'btree(name text_pattern_ops)', want: 'Seq Scan' },
      'CREATE INDEX l09_name_trgm ON users USING gin (name gin_trgm_ops)',
      { id: '32e', where: "name LIKE '%ronin'", index: 'gin(name gin_trgm_ops)', want: 'Index' },
      { id: '32f', where: "name LIKE '%ronin%'", index: 'gin(name gin_trgm_ops)', want: 'Index' },
      'CREATE INDEX l09_name_rev ON users (reverse(name) text_pattern_ops)',
      { id: '32g', where: "reverse(name) LIKE 'ninor%'", index: 'btree(reverse(name) text_pattern_ops)', want: 'Index' },
    ],
    claim: (r) => `LIKE: 'ronin%' cần text_pattern_ops (btree mặc định + collation en_US.utf8 → Seq ${p(r['32a'])}, `
      + `pattern_ops → ${p(r['32b'])}); '%ronin' và '%ronin%' cần GIN trigram (${p(r['32e'])}, ${p(r['32f'])}) `
      + `hoặc index reverse(name) (${p(r['32g'])})`,
  },
  {
    slide: 33, topic: 'OR',
    steps: [
      { id: '33a', where: 'id = 1 OR age = 18', index: 'chỉ users_pkey (id)', want: 'Seq Scan' },
      'CREATE INDEX l09_age ON users (age)',
      { id: '33b', where: 'id = 1 OR age = 18', index: 'users_pkey + btree(age)', want: 'BitmapOr' },
      { id: '33c', where: "id = 1 OR email = 'user5@example.com'", index: 'users_pkey + users_email_key', want: 'BitmapOr' },
    ],
    claim: (r) => `OR: vế age chưa có index → Seq Scan cả bảng (${p(r['33a'])}); cả hai vế có index → BitmapOr `
      + `(${p(r['33b'])} = ${Math.round((100 * r['33b'].pages) / r['33a'].pages)}% bảng, vì ${fmtInt(r['33b'].rows)} dòng `
      + `rải khắp heap; hai vế chọn lọc → ${p(r['33c'])})`,
  },
  {
    slide: 34, topic: 'Kiểu',
    steps: [
      'CREATE INDEX l09_code ON users (code)',
      { id: '34a', where: "id = '10'", index: 'users_pkey', want: 'Index' },
      { id: '34b', where: 'code = 10', index: 'btree(code)', want: 'LỖI 42883' },
      { id: '34c', where: 'code::int = 10', index: 'btree(code)', want: 'Seq Scan' },
      { id: '34d', where: "code = '10'", index: 'btree(code)', want: 'Index' },
      { id: '34e', where: 'id = 10.0', index: 'users_pkey', want: 'Seq Scan' },
    ],
    claim: (r) => `Kiểu: id = '10' vẫn dùng index (${p(r['34a'])}, literal được hiểu là bigint); code = 10 → PG báo `
      + `${r['34b'].plan} chứ không tự đổi kiểu; ép kiểu trên cột (code::int, id = 10.0 → id::numeric) → Seq `
      + `(${p(r['34c'])}, ${p(r['34e'])}); viết code = '10' → ${p(r['34d'])}`,
  },
  {
    slide: 35, topic: 'Hàm',
    steps: [
      'CREATE INDEX l09_name ON users (name)',
      { id: '35a', where: 'length(name) = 6', index: 'btree(name)', want: 'Seq Scan' },
      'CREATE INDEX l09_name_len ON users (length(name))',
      // Statistics for the new expression (planner estimate 5,000 → ~1,000 rows); rolled back with everything else.
      'ANALYZE users',
      { id: '35b', where: 'length(name) = 6', index: 'btree(length(name))', want: 'Index' },
      { id: '35c', where: 'char_length(name) = 6', index: 'btree(length(name))', want: 'Seq Scan' },
    ],
    claim: (r) => `Hàm: length(name) bỏ qua btree(name) (${p(r['35a'])}); index biểu thức length(name) → `
      + `${p(r['35b'])}; char_length(name) là biểu thức khác → vẫn Seq (${p(r['35c'])})`,
  },
  {
    slide: 36, topic: 'Phép tính',
    steps: [
      { id: '36a', where: 'id + 1 = 10', index: 'users_pkey', want: 'Seq Scan' },
      { id: '36b', where: 'id + 0 = 10 - 1', index: 'users_pkey', want: 'Seq Scan' },
      { id: '36c', where: 'id = 9', index: 'users_pkey', want: 'Index' },
    ],
    claim: (r) => `Phép tính trên cột: id + 1 = 10, id + 0 = 10 - 1 → Seq (${p(r['36a'])}); đưa phép tính sang `
      + `vế hằng số, id = 9 → ${p(r['36c'])}`,
  },
];

// "Bitmap Heap Scan (users) > BitmapOr > Bitmap Index Scan (a) > Bitmap Index Scan (b)"
//   → "Bitmap Heap Scan > BitmapOr (a + b)", so the table stays readable.
const shortPlan = (plan) => plan
  .replace(/ \(users\)/g, '')
  .replace(/BitmapOr > Bitmap Index Scan \((\w+)\) > Bitmap Index Scan \((\w+)\)/, 'BitmapOr ($1 + $2)');

async function runCase(client, c) {
  const sql = `SELECT * FROM users WHERE ${c.where}`;
  const expectsError = c.want.startsWith('LỖI');
  // A failing statement aborts the whole transaction; the savepoint keeps the indexes created so far usable.
  if (expectsError) await client.query('SAVEPOINT l09_case');
  try {
    // Only pages are reported (identical on every run), so one measured run after the warm-up is enough.
    const m = await measure(client, sql, { runs: 1 });
    return { ...c, sql, plan: shortPlan(m.plan), rows: m.rows, pages: m.pages };
  } catch (err) {
    if (!expectsError || !err.code) throw err; // unexpected failure: surface it, do not dress it up as a result
    await client.query('ROLLBACK TO SAVEPOINT l09_case');
    const error = { code: err.code, message: err.message.split('\n')[0] };
    return { ...c, sql, plan: `LỖI ${err.code}`, rows: null, pages: null, error };
  }
}

const client = await connect();
try {
  console.log('Lab 3.09 — Có index mà truy vấn vẫn không dùng được: LIKE, OR, kiểu, hàm, phép tính (slide 32–36)');
  const results = [];
  for (const g of GROUPS) {
    await inRollback(client, async () => {
      for (const step of g.steps) {
        if (typeof step === 'string') await client.query(step);
        else {
          const first = !results.some((r) => r.slide === g.slide);
          results.push({ ...(await runCase(client, step)), slide: g.slide, topic: g.topic, first });
        }
      }
    });
  }

  heading('SELECT * FROM users WHERE … (index tạo thêm trong BEGIN … ROLLBACK, không còn lại sau lab)');
  printTable(results, [
    ['Ca', (x) => x.id],
    ['Slide', (x) => (x.first ? `${x.slide} ${x.topic}` : '')],
    ['Điều kiện WHERE', (x) => x.where],
    ['Index có sẵn', (x) => x.index],
    ['Kế hoạch', (x) => x.plan],
    ['Dòng', (x) => (x.error ? '—' : fmtInt(x.rows)), 'right'],
    ['Trang', (x) => (x.error ? '—' : fmtInt(x.pages)), 'right'],
  ]);
  for (const x of results.filter((r) => r.error)) {
    console.log(`Lỗi nguyên văn ở ${x.id} (${x.where}): ${x.error.code} ${x.error.message}`);
  }

  heading('Kết luận');
  const byId = Object.fromEntries(results.map((r) => [r.id, r]));
  for (const g of GROUPS) {
    const mine = results.filter((r) => r.slide === g.slide);
    const misses = mine.filter((r) => !r.plan.includes(r.want));
    const note = misses.length ? ` — khác dự đoán: ${misses.map((r) => `${r.id} ra "${r.plan}"`).join('; ')}` : '';
    verdict(misses.length === 0, `[${g.slide}] ${g.claim(byId)}${note}`);
  }

  if (json) {
    const cards = results.map((r) => ({
      case: r.id, slide: r.slide, topic: r.topic, query: r.sql, index: r.index,
      plan: r.plan, rows: r.rows, pages: r.pages, ...(r.error && { error: r.error }),
    }));
    console.log(JSON.stringify({ cards }));
  }
} finally {
  await client.end();
}
