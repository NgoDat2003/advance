// Lab 14.07 — Khóa lạc quan bằng cột version: không phải "không khóa" (slide 15, 16, 18).
// UPDATE … WHERE version = n vẫn lấy khóa dòng: ở READ COMMITTED người thua phải CHỜ rồi mới thấy 0 dòng,
// ở REPEATABLE READ người thua nhận 40001, và hai UPDATE chéo dòng vẫn có thể deadlock (40P01).
// Chạy: npm run lab7   (thêm `-- --json` để in payload cho widget W5)
import { openLab, waitBlocked, settle, rolesInDetail, heading, verdict, printTable, emitJson, jsonMode } from './lock-kit.mjs';

const say = (t) => { if (!jsonMode) console.log(t); };
say('Lab 14.07 — version check vẫn chờ khóa dòng: RC 0 dòng, RR 40001, thử lại → v3, chéo dòng → 40P01 (slide 15, 16, 18)');

let failed = false;
const check = (ok, text) => { if (!verdict(ok, text)) failed = true; };
const payload = { lab: '07' };

const lab = await openLab('07');
const { O, A, B, pid } = lab;
// Đưa 2 dòng về trạng thái đầu (amount 100, version 1) trước mỗi section — qua O, không qua A/B.
const reseed = () => O.query('UPDATE l07_items SET amount = 100, version = 1');
const items = async () => (await O.query('SELECT id, amount, version FROM l07_items ORDER BY id')).rows;
const READ = 'SELECT amount, version FROM l07_items WHERE id = 1;';

// Một vòng "đọc version → UPDATE có điều kiện" của 2 người ở mức cô lập `level`; trả về số đo cho section A/B.
async function race(level) {
  await reseed();
  const begin = level === 'READ COMMITTED' ? 'BEGIN;' : `BEGIN ISOLATION LEVEL ${level};`;
  await A.query(begin); await B.query(begin);
  const vA = (await A.query(READ)).rows[0].version;
  const vB = (await B.query(READ)).rows[0].version;
  const a = await settle(A.query('UPDATE l07_items SET amount = 90, version = version + 1 WHERE id = 1 AND version = 1;'));
  const pB = settle(B.query('UPDATE l07_items SET amount = 80, version = version + 1 WHERE id = 1 AND version = 1;'));
  const w = await waitBlocked(O, pid.B, pid, { unless: pB });
  await A.query('COMMIT;');
  const b = await pB;
  await B.query('ROLLBACK;');
  check(vA === 1 && vB === 1, `cả hai đọc version ${vA}/${vB} (kỳ vọng 1/1)`);
  check(a.rowCount === 1, `A: UPDATE … AND version = 1 → ${a.rowCount} dòng, giữ khóa dòng tới COMMIT`);
  check(w.blocked && w.waitEvent === 'Lock/transactionid' && w.blockers.join() === 'A',
    `B cùng câu UPDATE phải chờ: ${w.waitEvent ?? 'không chờ'}, chặn bởi ${w.blockers?.join(', ') ?? '-'}`);
  return { readVersions: [vA, vB], aRows: a.rowCount, bWaited: w.blocked, waitEvent: w.waitEvent ?? null,
    bRows: b.ok ? b.rowCount : null, bCode: b.ok ? null : b.code, bMessage: b.ok ? null : b.message };
}

try {
  await O.query(`DROP TABLE IF EXISTS l07_items;
    CREATE TABLE l07_items (id int PRIMARY KEY, amount int NOT NULL, version int NOT NULL);
    INSERT INTO l07_items VALUES (1, 100, 1), (2, 100, 1)`);

  // ── A. READ COMMITTED: người thua chờ A COMMIT, rồi đánh giá lại WHERE trên bản mới → 0 dòng ──
  heading('A. READ COMMITTED: cùng UPDATE … AND version = 1');
  const rc = await race('READ COMMITTED');
  say(`B sau khi A COMMIT: rowCount ${rc.bRows ?? rc.bCode}`);
  check(rc.bRows === 0, `B: ${rc.bRows ?? rc.bCode} dòng → ứng dụng biết mình thua, phải đọc lại`);
  rc.finalVersion = (await items())[0].version;
  check(rc.finalVersion === 2, `version cuối = ${rc.finalVersion} (chỉ A ghi)`);
  payload.readCommitted = rc;

  // ── B. REPEATABLE READ: người thua không được "đánh giá lại", nhận 40001 ──
  heading('B. REPEATABLE READ: cùng UPDATE … AND version = 1');
  const rr = await race('REPEATABLE READ');
  say(`B sau khi A COMMIT: ${rr.bCode ?? `rowCount ${rr.bRows}`} "${rr.bMessage ?? ''}"`);
  check(rr.bCode === '40001', `B nhận ${rr.bCode ?? `rowCount ${rr.bRows}`} → phải ROLLBACK và thử lại cả transaction`);
  payload.repeatableRead = rr;

  // ── C. Thử lại: B đọc lại version mới rồi UPDATE với đúng version đó ──
  heading('C. B thử lại: đọc lại version rồi UPDATE');
  await B.query('BEGIN;');
  const v = (await B.query(READ)).rows[0].version;
  const retry = await settle(B.query(`UPDATE l07_items SET amount = 80, version = version + 1 WHERE id = 1 AND version = ${v};`));
  await B.query('COMMIT;');
  const finalVersion = (await items())[0].version;
  check(v === 2 && retry.rowCount === 1 && finalVersion === 3,
    `B đọc lại version ${v}, UPDATE → ${retry.rowCount ?? retry.code} dòng, version cuối = ${finalVersion} (kỳ vọng 3)`);
  payload.retry = { readVersion: v, rows: retry.rowCount ?? null, finalVersion };

  // ── D. Slide 16: UPDATE có version trên 2 dòng theo thứ tự chéo nhau vẫn deadlock như UPDATE thường ──
  heading('D. UPDATE có version chéo dòng 1/2 (thứ tự M1)');
  await reseed();
  const U = (n) => `UPDATE l07_items SET amount = amount - 10, version = version + 1 WHERE id = ${n} AND version = 1;`;
  await A.query('BEGIN;'); await B.query('BEGIN;');
  const a1 = await settle(A.query(U(1)));
  const b2 = await settle(B.query(U(2)));
  const pA2 = settle(A.query(U(2)));
  const wA = await waitBlocked(O, pid.A, pid, { unless: pA2 });
  check(a1.rowCount === 1 && b2.rowCount === 1 && wA.blocked && wA.waitEvent === 'Lock/transactionid',
    `A giữ dòng 1, B giữ dòng 2; A xin dòng 2 → chờ ${wA.waitEvent ?? 'không chờ'}`);
  // Như Lab 05: để A chờ ≥ 25 ms theo đồng hồ server rồi B mới khép vòng, nếu không thì đồng hồ phát hiện deadlock
  // (1 s) của hai phiên — lệch nhau vài chục ms trên Docker/WSL2 — quyết định ngẫu nhiên ai là nạn nhân.
  // Cố ý viết lại tại chỗ (cùng quy tắc 25 ms với waitedAtLeast của Lab 05 phần A): kit đã đủ 10 export, lab đọc thẳng từ trên xuống.
  let lead = 0;
  while (lead < 25) {
    const { rows } = await O.query(`SELECT (extract(epoch FROM clock_timestamp() - query_start) * 1000)::int AS w
      FROM pg_stat_activity WHERE pid = $1 AND wait_event_type = 'Lock'`, [pid.A]);
    if (!rows.length) break;
    lead = rows[0].w;
    if (lead < 25) await new Promise((r) => setTimeout(r, 5));
  }
  say(`(A đã chờ ${lead} ms theo đồng hồ server trước khi B khép vòng)`);
  const pB1 = settle(B.query(U(1)));
  const [rA2, rB1] = await Promise.all([pA2, pB1]);
  const res = { A: rA2, B: rB1 };
  const dead = Object.entries(res).filter(([, r]) => r.code === '40P01');
  const victim = dead[0]?.[0] ?? '-';
  const survivor = victim === 'A' ? 'B' : 'A';
  say(`40P01 × ${dead.length}`);
  say(`nạn nhân: ${victim}`);
  for (const line of rolesInDetail(dead[0]?.[1].detail ?? '', pid).split('\n').filter(Boolean)) say(`  ${line}`);
  say(`người sống sót ${survivor}: rowCount ${res[survivor].rowCount ?? res[survivor].code} sau ${res[survivor].ms.toFixed(0)} ms (mẫu trên máy này)`);
  check(dead.length === 1, `đúng 1 phiên nhận 40P01 (đo được ${dead.length}) → version không cứu được thứ tự khóa sai`);
  await (victim === 'A' ? A : B).query('ROLLBACK;');
  await (victim === 'A' ? B : A).query('COMMIT;');
  const after = await items();
  printTable(after, ['id', 'amount', 'version']);
  payload.crosswise = { deadlocks: dead.length, victim, survivor: { role: survivor, rows: res[survivor].rowCount ?? null,
    ms: Math.round(res[survivor].ms) }, final: after };

  emitJson(payload);
} catch (e) {
  console.error(`Lab 14.07 dừng vì lỗi không mong đợi: ${e.code ?? ''} ${e.message}`);
  failed = true;
} finally {
  await lab.close();
}
process.exitCode = failed ? 1 : 0;
