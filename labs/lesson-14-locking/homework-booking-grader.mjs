// Bài tập về nhà Bài 14 (slide 22) — Phần D: chấm SQL đặt vé. Dùng: node homework-booking-grader.mjs <file.mjs>
// Nạp BASIC/ADVANCED TRƯỚC khi kết nối: từ chối ô '???', DDL, chuỗi nhiều câu ';', UPDATE bảng khác flights, tên có schema.
// Khi chấm, đổi flights → hw_flights, bookings → hw_bookings (bảng nháp, close() tự xóa).
// Export bookAll() + seed() để homework-runner.mjs dùng lại (kịch bản s1–s6).
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { openLab, waitBlocked, settle, heading, verdict } from './lock-kit.mjs';

const FLIGHT = 1; // VN123
const SETS = { BASIC: ['READ_SQL', 'WRITE_SQL'], ADVANCED: ['ADV_LOCK_SQL', 'READ_SQL', 'WRITE_SQL'] };
// Số placeholder tối đa mỗi ô được nhận: $1 = id chuyến bay, WRITE_SQL thêm $2 = version vừa đọc.
const MAX_PARAM = { ADV_LOCK_SQL: 1, READ_SQL: 1, WRITE_SQL: 2 };
const FORBIDDEN = /\b(DROP|ALTER|CREATE|TRUNCATE|DELETE|INSERT|GRANT|REVOKE|COPY|VACUUM|COMMIT|ROLLBACK|BEGIN|INTO|pg_terminate_backend|pg_cancel_backend|dblink)\b/i;

/** Đổi tên bảng sân chơi sang bảng nháp: SQL bạn chạy tay trong psql chính là SQL được chấm. */
export const toScratch = (sql) => sql.replace(/\bflights\b/g, 'hw_flights').replace(/\bbookings\b/g, 'hw_bookings');
/** Chỉ bind $1..$k với k = placeholder lớn nhất có trong câu (Postgres từ chối tham số thừa). */
const maxParam = (sql) => Math.max(0, ...[...sql.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])));
const bind = (sql, values) => values.slice(0, maxParam(sql));

/** Kiểm tra 1 ô SQL; trả về lý do từ chối hoặc null. `danger` = lỗi nguy hiểm (DDL / nhiều câu) → không chấm gì cả. */
export function checkCell(name, value) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('???')) return { why: "còn '???' hoặc để trống" };
  const sql = value.trim().replace(/;\s*$/, ''); // cho phép đúng 1 dấu ';' ở cuối như khi gõ psql
  if (sql.includes(';')) return { why: "có ';' nối nhiều câu — mỗi ô chỉ 1 câu", danger: true };
  if (!/^(SELECT|UPDATE)\b/i.test(sql)) return { why: `chỉ nhận 1 câu SELECT hoặc UPDATE (gặp "${sql.split(/\s+/)[0]}")`, danger: true };
  const bad = sql.match(FORBIDDEN);
  if (bad) return { why: `không được chứa ${bad[1].toUpperCase()} (DDL / lệnh ghi khác UPDATE flights)`, danger: true };
  const code = sql.replace(/'[^']*'/g, "''"); // bỏ chuỗi '…' trước khi soi tên bảng
  if (/\b[A-Za-z_]\w*\s*\.\s*"?[A-Za-z_]/.test(code)) {
    return { why: 'không dùng tên có dấu chấm (vd lab14_locking.flights) — viết thẳng flights/bookings, grader tự đổi sang bảng nháp', danger: true };
  }
  if (/^UPDATE\b/i.test(code) && !/^UPDATE\s+flights\b/i.test(code)) return { why: 'UPDATE chỉ được sửa bảng flights', danger: true };
  if (name === 'WRITE_SQL' && !/^UPDATE\s+flights\b/i.test(code)) return { why: 'WRITE_SQL phải là UPDATE flights …' };
  if (name === 'READ_SQL' && !/\bflights\b/i.test(code)) return { why: 'READ_SQL phải đọc từ bảng flights' };
  if (maxParam(sql) > MAX_PARAM[name]) return { why: `dùng $${maxParam(sql)} nhưng ô này chỉ nhận tới $${MAX_PARAM[name]}` };
  return null;
}

/** Dựng lại bảng nháp: VN123 (id 1) 2 ghế version 0, VN456 (id 2) 2 ghế; hw_bookings rỗng. Cấu trúc copy từ sân chơi. */
export async function seed(O) {
  await O.query(`DROP TABLE IF EXISTS hw_bookings, hw_flights;
    CREATE TABLE hw_flights (LIKE flights INCLUDING ALL);
    INSERT INTO hw_flights VALUES (1, 'VN123', 2, 0), (2, 'VN456', 2, 0);
    CREATE TABLE hw_bookings (LIKE bookings INCLUDING ALL, FOREIGN KEY (flight_id) REFERENCES hw_flights)`);
}

const show = (r) => (r.rows.length ? Object.entries(r.rows[0]).map(([k, v]) => `${k}=${v}`).join(', ') : '0 dòng');

/**
 * 3 hành khách P1..P3 tranh VN123: pha ĐỌC (P1→P3 đều đọc xong hoặc bị chặn khi đọc), rồi pha GHI lần lượt P1→P3.
 * Trả về { booked, refused, seatsLeft, conflicts, codes, blockedReads, readWaits, timeline } (readWaits = waitEvent của từng lần đọc bị chặn).
 */
export async function bookAll(lab, sqlSet, passengers = 3) {
  const { O } = lab;
  const set = Object.fromEntries(Object.entries(sqlSet).map(([k, v]) => [k, toScratch(v.trim().replace(/;\s*$/, ''))]));
  const out = { booked: 0, refused: 0, seatsLeft: null, conflicts: 0, codes: [], blockedReads: [], readWaits: [], timeline: [] };
  const log = (s) => out.timeline.push(s);
  await seed(O);

  // Pha đọc: BEGIN → (ADV_LOCK_SQL) → READ_SQL. Không await câu đọc: hỏi O xem phiên có đang chờ khóa không.
  const reads = [];
  for (let i = 1; i <= passengers; i++) {
    const r = `P${i}`;
    const P = lab[r];
    await P.query('BEGIN');
    const read = () => P.query(set.READ_SQL, bind(set.READ_SQL, [FLIGHT]));
    const pr = settle(set.ADV_LOCK_SQL ? P.query(set.ADV_LOCK_SQL, bind(set.ADV_LOCK_SQL, [FLIGHT])).then(read) : read());
    const w = await waitBlocked(O, lab.pid[r], lab.pid, { unless: pr });
    if (w.blocked) {
      out.blockedReads.push(r);
      out.readWaits.push(w.waitEvent);
      log(`${r} đọc → bị chặn (${w.waitEvent}, chờ ${[...w.blockers].sort().join(', ')})`);
    } else {
      const rd = await pr;
      log(`${r} đọc → ${rd.ok ? show(rd) : `lỗi ${rd.code}`}`);
    }
    reads.push({ r, P, pr, blocked: w.blocked });
  }

  // Pha ghi: lần lượt từng người; ghế ≤ 0 → từ chối; WRITE_SQL 0 dòng → từ chối (xung đột); grader tự INSERT vé rồi COMMIT.
  const fail = async (P, r, step, x) => {
    out.codes.push(x.code ?? 'ERR');
    log(`${r} ${step} → lỗi ${x.code ?? 'ERR'}: ${x.message} → ROLLBACK`);
    await P.query('ROLLBACK');
  };
  for (const { r, P, pr, blocked } of reads) {
    const rd = await pr;
    if (!rd.ok) { await fail(P, r, 'đọc', rd); continue; }
    if (blocked) log(`${r} hết chờ, đọc → ${show(rd)}`);
    const seats = Number(rd.rows[0]?.seats);
    if (rd.rows[0]?.seats == null || !Number.isFinite(seats)) {
      await fail(P, r, 'đọc', { code: 'NO_SEATS', message: 'READ_SQL không trả về cột seats' });
      continue;
    }
    if (seats <= 0) { out.refused++; log(`${r} thấy seats=${seats} → từ chối, ROLLBACK`); await P.query('ROLLBACK'); continue; }
    const wr = await settle(P.query(set.WRITE_SQL, bind(set.WRITE_SQL, [FLIGHT, rd.rows[0].version])));
    if (!wr.ok) { await fail(P, r, 'ghi', wr); continue; }
    if (wr.rowCount === 0) {
      out.refused++; out.conflicts++;
      log(`${r} ghi → 0 dòng (xung đột) → từ chối, ROLLBACK`);
      await P.query('ROLLBACK');
      continue;
    }
    if (wr.rowCount > 1) { await fail(P, r, 'ghi', { code: 'MANY_ROWS', message: `WRITE_SQL sửa ${wr.rowCount} dòng (phải đúng 1)` }); continue; }
    const ins = await settle(P.query('INSERT INTO hw_bookings (flight_id, passenger) VALUES ($1, $2)', [FLIGHT, r]));
    if (!ins.ok) { await fail(P, r, 'INSERT vé', ins); continue; }
    const cm = await settle(P.query('COMMIT'));
    if (!cm.ok) { await fail(P, r, 'COMMIT', cm); continue; }
    out.booked++;
    log(`${r} ghi 1 dòng + INSERT hw_bookings → COMMIT`);
  }
  // Dọn khóa advisory mức session (nếu SQL của bạn lỡ dùng) để lần chấm sau không bị ảnh hưởng; dạng object = không in echo.
  for (let i = 1; i <= passengers; i++) await lab[`P${i}`].query({ text: 'SELECT pg_advisory_unlock_all()' });
  out.seatsLeft = (await O.query('SELECT seats FROM hw_flights WHERE id = $1', [FLIGHT])).rows[0].seats;
  return out;
}

/** In diễn biến + dòng kết quả của 1 bộ SQL. Trả về true nếu PASS. */
async function grade(lab, kind, sqlSet) {
  heading(`${kind} — ${kind === 'Basic' ? 'chỉ khóa bi quan trong DB' : 'advisory lock + khóa lạc quan theo version'}`);
  const r = await bookAll(lab, sqlSet);
  console.log('Diễn biến:');
  r.timeline.forEach((l) => console.log(`  ${l}`));
  console.log(`khóa lúc đọc: ${r.blockedReads.length ? `có (${r.blockedReads.join(', ')} bị chặn khi đọc)` : 'không'}`);
  const basic = r.booked === 2 && r.refused === 1 && r.seatsLeft === 0 && r.codes.length === 0;
  // Advanced phải dùng đúng cả hai khóa: advisory lock thật (có người đọc chờ Lock/advisory) + guard version ($2 trong WRITE_SQL).
  const missing = kind === 'Basic' ? [] : [
    ...(maxParam(sqlSet.WRITE_SQL) === 2 ? [] : ['WRITE_SQL chưa dùng $2 (guard version = version vừa đọc)']),
    ...(r.readWaits.includes('Lock/advisory') ? [] : ['không người đọc nào chờ Lock/advisory (ADV_LOCK_SQL chưa khóa thật)']),
  ];
  const pass = (kind === 'Basic' ? basic : basic && r.conflicts === 0) && missing.length === 0;
  verdict(pass, `${kind} ${pass ? 'PASS' : 'FAIL'} — booked=${r.booked} refused=${r.refused} seatsLeft=${r.seatsLeft} `
    + `conflicts=${r.conflicts} lỗi=${r.codes.join(',') || 'không'}`);
  missing.forEach((m) => console.log(`  thiếu: ${m}`));
  return pass;
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Cách dùng: node homework-booking-grader.mjs <file-bài-làm.mjs>'); return 1; }
  let mod;
  try {
    mod = await import(pathToFileURL(path.resolve(file)).href);
  } catch (err) {
    console.error(`Không nạp được file bài làm ${file}: ${err.message}`);
    return 1;
  }
  console.log('Bài tập 14 — Phần D: chấm SQL đặt vé (slide 22)');
  console.log('Basic PASS = 2 vé, 1 người bị từ chối, còn 0 ghế, không lỗi · Advanced PASS = như Basic, 0 xung đột version, '
    + 'WRITE_SQL có $2 (version) và có người đọc chờ Lock/advisory');
  const problems = [];
  const ready = [];
  let danger = false;
  for (const [setName, cells] of Object.entries(SETS)) {
    const bad = cells.map((c) => [c, checkCell(c, mod[setName]?.[c])]).filter(([, p]) => p);
    bad.forEach(([c, p]) => { problems.push(`${setName}.${c}: ${p.why}`); danger ||= Boolean(p.danger); });
    if (!bad.length) ready.push(setName);
  }
  if (problems.length) {
    console.log('Các ô cần sửa (bộ nào còn ô lỗi thì không chấm bộ đó):');
    problems.forEach((p) => console.log(`  ✘ ${p}`));
  }
  if (danger || !ready.length) {
    console.log(danger ? '\nCó SQL nguy hiểm (DDL / nhiều câu) — từ chối chấm, chưa mở kết nối DB.'
      : '\nChưa có bộ SQL nào điền đủ — từ chối chấm, chưa mở kết nối DB.');
    return 1;
  }
  const renamed = ready.some((s) => SETS[s].some((c) => toScratch(mod[s][c]) !== mod[s][c]));
  if (renamed) console.log('ghi chú: khi chấm, `flights` → `hw_flights`, `bookings` → `hw_bookings` (bảng nháp, tự xóa khi xong)');

  const lab = await openLab('hw', ['P1', 'P2', 'P3']);
  const passed = [];
  try {
    for (const s of ready) passed.push(await grade(lab, s === 'BASIC' ? 'Basic' : 'Advanced', mod[s]));
  } finally { await lab.close(); }
  return passed.length === 2 && passed.every(Boolean) ? 0 : 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (isMain) {
  process.exitCode = await main().catch((err) => {
    console.error(`Lỗi khi chấm: ${err.message}`);
    return 1;
  });
}
