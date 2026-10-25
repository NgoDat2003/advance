// Bài tập về nhà Bài 14 (slide 22) — Phần B: dự đoán rồi đo. Dùng: node homework-runner.mjs <file-dự-đoán.mjs>
// Nạp PREDICTIONS TRƯỚC khi kết nối: từ chối mọi ô '???' / ngoài danh sách; chỉ đo dòng đủ 3 ô hợp lệ + `why`.
// s1–s5 chạy qua bookAll() của grader (3 hành khách đọc trước, ghi sau); s6 = vé khứ hồi khóa 2 chuyến ngược thứ tự.
// In ✔/✘ từng ô, diễn biến của dòng ✘, và đáp án Phần C (REVIEW_ANSWERS) nếu file có export.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { openLab, waitBlocked, settle, heading, verdict } from './lock-kit.mjs';
import { bookAll, seed } from './homework-booking-grader.mjs';

const ROWS = ['s1', 's2', 's3', 's4', 's5', 's6'];
const CODES = ['none', '40P01', '40001', '55P03', '23514'];
const READ = 'SELECT seats FROM flights WHERE id = $1';
const READ_V = 'SELECT seats, version FROM flights WHERE id = $1';
const MINUS = 'UPDATE flights SET seats = seats - 1 WHERE id = $1';
const OPTIMISTIC = 'UPDATE flights SET seats = seats - 1, version = version + 1 WHERE id = $1 AND version = $2';
// Bộ SQL cố định của s1–s5 (tên bảng sân chơi; bookAll tự đổi sang hw_*).
const SCENARIOS = {
  s1: { title: 'ngây thơ: đọc không khóa, trừ tương đối', set: { READ_SQL: READ, WRITE_SQL: MINUS } },
  s2: { title: 'khóa bi quan FOR UPDATE', set: { READ_SQL: `${READ} FOR UPDATE`, WRITE_SQL: MINUS } },
  s3: { title: 'UPDATE có điều kiện seats > 0', set: { READ_SQL: READ, WRITE_SQL: `${MINUS} AND seats > 0` } },
  s4: { title: 'khóa lạc quan không thử lại', set: { READ_SQL: READ_V, WRITE_SQL: OPTIMISTIC } },
  s5: { title: 'advisory lock + khóa lạc quan', set: { ADV_LOCK_SQL: "SELECT pg_advisory_xact_lock(hashtext('flight:' || $1))", READ_SQL: READ_V, WRITE_SQL: OPTIMISTIC } },
  s6: { title: 'vé khứ hồi khóa VN123/VN456 ngược thứ tự' },
};

/** Kiểm tra 3 ô + why của mỗi dòng; trả về { sN: [lỗi...] }. */
function validate(pred) {
  const problems = {};
  for (const s of ROWS) {
    const row = pred?.[s] ?? {};
    const p = (problems[s] = []);
    const cell = (c, ok, hint) => {
      const v = row[c];
      if (v === undefined || v === '???') p.push(`${s}.${c}: còn '???' (${hint})`);
      else if (!ok(v)) p.push(`${s}.${c}: giá trị ${JSON.stringify(v)} không hợp lệ (${hint})`);
    };
    cell('booked', (v) => Number.isInteger(v) && v >= 0 && v <= 3, 'số nguyên 0–3');
    cell('seatsLeft', (v) => Number.isInteger(v) && v >= -1 && v <= 2, 'số nguyên -1–2');
    cell('code', (v) => CODES.includes(v), `chỉ nhận: ${CODES.join(' ')}`);
    if (typeof row.why !== 'string' || row.why.trim() === '') p.push(`${s}.why: chưa viết 1 dòng giải thích`);
  }
  return problems;
}

/** s6: P1 khóa VN123 rồi VN456, P2 khóa VN456 rồi VN123. O xác nhận P1 đang chờ trước khi P2 khép vòng. */
async function roundTrip(lab) {
  const { O, P1, P2, pid } = lab;
  const t = [];
  await seed(O);
  const lock = (id) => `SELECT seats FROM hw_flights WHERE id = ${id} FOR UPDATE`;
  await P1.query('BEGIN'); await P1.query(lock(1)); t.push('P1 khóa VN123');
  await P2.query('BEGIN'); await P2.query(lock(2)); t.push('P2 khóa VN456');
  const a = settle(P1.query(lock(2)));
  const w = await waitBlocked(O, pid.P1, pid, { unless: a });
  t.push(`P1 khóa VN456 → ${w.blocked ? `bị chặn (${w.waitEvent}, chờ ${w.blockers.join(', ')})` : 'KHÔNG bị chặn (kịch bản không hợp lệ)'}`);
  const b = settle(P2.query(lock(1)));
  t.push('P2 khóa VN123 → khép vòng chờ');
  const res = { P1: await a, P2: await b };
  let booked = 0;
  const codes = [];
  for (const r of ['P1', 'P2']) {
    const P = lab[r];
    if (!res[r].ok) {
      codes.push(res[r].code);
      t.push(`${r} lỗi ${res[r].code}: ${res[r].message} → nạn nhân: ${r}, ROLLBACK`);
      await P.query('ROLLBACK');
      continue;
    }
    await P.query('UPDATE hw_flights SET seats = seats - 1 WHERE id IN (1, 2)');
    await P.query('INSERT INTO hw_bookings (flight_id, passenger) VALUES (1, $1), (2, $1)', [r]);
    await P.query('COMMIT');
    booked++;
    t.push(`${r} trừ ghế cả 2 chuyến + INSERT 2 vé → COMMIT`);
  }
  const seatsLeft = (await O.query('SELECT seats FROM hw_flights WHERE id = 1')).rows[0].seats;
  return { booked, seatsLeft, code: codes[0] ?? 'none', timeline: t, valid: w.blocked };
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Cách dùng: node homework-runner.mjs <file-dự-đoán.mjs>'); return 1; }
  let mod;
  try {
    mod = await import(pathToFileURL(path.resolve(file)).href);
  } catch (err) {
    console.error(`Không nạp được file dự đoán ${file}: ${err.message}`);
    return 1;
  }
  const { PREDICTIONS, REVIEW_ANSWERS } = mod;
  console.log('Bài tập 14 — Phần B: dự đoán rồi đo (slide 22) · VN123 còn 2 ghế, 3 hành khách P1, P2, P3');
  const problems = validate(PREDICTIONS);
  const refused = ROWS.filter((s) => problems[s].length);
  const complete = ROWS.filter((s) => !problems[s].length);
  if (refused.length) {
    console.log('Các ô cần sửa trước khi đo (dòng còn ô lỗi sẽ không đo):');
    refused.forEach((s) => problems[s].forEach((p) => console.log(`  ✘ ${p}`)));
    console.log(`  (giá trị code hợp lệ: ${CODES.join(' ')})`);
  }
  if (!complete.length) {
    console.log('\nKhông có dòng nào đủ ô hợp lệ — từ chối chạy, chưa mở kết nối DB.');
    return 1;
  }

  const lab = await openLab('hw', ['P1', 'P2', 'P3']);
  // Runner in bảng gọn: tắt dòng echo `P1› …` của kit (gọi thẳng pg.Client); diễn biến chỉ in cho dòng ✘.
  for (const r of ['P1', 'P2', 'P3']) lab[r].query = pg.Client.prototype.query.bind(lab[r]);
  let failed = refused.length > 0;
  try {
    heading('Kết quả đo (đoán → đo)');
    for (const s of complete) {
      const m = s === 's6' ? await roundTrip(lab) : await bookAll(lab, SCENARIOS[s].set);
      const got = { booked: m.booked, seatsLeft: m.seatsLeft, code: m.code ?? m.codes[0] ?? 'none' };
      const cells = ['booked', 'seatsLeft', 'code'].map((c) => ({ c, ok: got[c] === PREDICTIONS[s][c], txt: `${c}: ${PREDICTIONS[s][c]} → ${got[c]}` }));
      const ok = cells.every((x) => x.ok) && m.valid !== false;
      verdict(ok, `${s} ${SCENARIOS[s].title} — ${cells.map((x) => `${x.txt} ${x.ok ? '✔' : '✘'}`).join(' · ')}`);
      if (!ok) {
        failed = true;
        console.log('  Diễn biến:');
        m.timeline.forEach((l) => console.log(`    ${l}`));
      }
    }
    if (refused.length) console.log(`\n${refused.length} dòng bị từ chối, chưa đo: ${refused.join(', ')}`);
    if (Array.isArray(REVIEW_ANSWERS)) {
      heading('Phần C — đáp án rà soát bản nháp AI (homework-ai-draft.mjs)');
      REVIEW_ANSWERS.forEach((x, i) => console.log(`${i + 1}. ${x.flaw}\n   Sửa: ${x.fix}`));
    }
  } finally { await lab.close(); }
  return failed ? 1 : 0;
}

process.exitCode = await main().catch((err) => {
  console.error(`Lỗi khi chạy bài tập: ${err.message}`);
  return 1;
});
