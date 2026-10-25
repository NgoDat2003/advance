// Lab 14.06 — Không muốn chờ khóa: NOWAIT, lock_timeout, SKIP LOCKED và giới hạn của FOR UPDATE (slide 14, 20).
// Ba vai A, B, C là ba phiên Postgres thật; O là phiên quan sát (đọc pg_stat_activity, tự commit).
// Chạy: npm run lab6   (cần PG_URL như Bài 3 mục 6.3)
import { openLab, waitBlocked, settle, heading, verdict, printTable, jsonMode } from './lock-kit.mjs';

const say = (t) => { if (!jsonMode) console.log(t); };
say('Lab 14.06 — NOWAIT/lock_timeout báo 55P03 khác nhau, SKIP LOCKED chia ghế không chờ (slide 14, 20)');

let failed = false;
const check = (ok, text) => { if (!verdict(ok, text)) failed = true; };

const lab = await openLab('06', ['A', 'B', 'C']);
const { O, A, B, C, pid } = lab;
try {
  // Bảng nháp: 10 hợp đồng chép từ playground + 10 ghế trống (chỉ sống trong lab này).
  await O.query(`DROP TABLE IF EXISTS l06_contracts, l06_seats;
    CREATE TABLE l06_contracts AS SELECT * FROM contracts WHERE id <= 10;
    ALTER TABLE l06_contracts ADD PRIMARY KEY (id);
    CREATE TABLE l06_seats (id int PRIMARY KEY, booked bool NOT NULL DEFAULT false);
    INSERT INTO l06_seats (id) SELECT g FROM generate_series(1, 10) AS g`);

  // ── A. NOWAIT: dòng đang bị giữ → lỗi ngay, không xếp hàng ──
  heading('A. FOR UPDATE NOWAIT trên dòng đang bị giữ');
  await A.query('BEGIN;');
  await A.query('SELECT id, total FROM l06_contracts WHERE id = 1 FOR UPDATE;');
  const nw = await settle(B.query('SELECT id, total FROM l06_contracts WHERE id = 1 FOR UPDATE NOWAIT;'));
  say(`B nhận: ${nw.code} "${nw.message}" sau ${nw.ms.toFixed(0)} ms (mẫu trên máy này)`);
  check(nw.code === '55P03' && /could not obtain lock on row/.test(nw.message ?? '') && nw.ms < 500,
    `NOWAIT trả 55P03 ngay (không chờ): "${nw.message}"`);

  // ── B. lock_timeout: có chờ, nhưng chỉ chờ tối đa 1 s rồi bị hủy (cùng mã 55P03, khác thông điệp) ──
  heading('B. lock_timeout = 1s rồi UPDATE dòng đang bị giữ');
  await B.query("SET lock_timeout = '1s';");
  const pUpd = settle(B.query('UPDATE l06_contracts SET total = total + 1 WHERE id = 1;'));
  const w = await waitBlocked(O, pid.B, pid, { unless: pUpd });
  check(w.blocked && w.waitEvent === 'Lock/transactionid' && w.blockers.join() === 'A',
    `B thật sự xếp hàng chờ: ${w.waitEvent ?? 'không chờ'}, chặn bởi ${w.blockers?.join(', ') ?? '-'}`);
  const lt = await pUpd;
  say(`B nhận: ${lt.code} "${lt.message}" sau ${lt.ms.toFixed(0)} ms (mẫu trên máy này)`);
  check(lt.code === '55P03' && /canceling statement due to lock timeout/.test(lt.message ?? '') && lt.ms >= 900 && lt.ms < 3000,
    `lock_timeout trả 55P03 sau khoảng 1 s: "${lt.message}"`);
  check(nw.code === lt.code && nw.message !== lt.message, 'cùng mã 55P03 nhưng hai thông điệp khác nhau → log phải đọc cả message');
  await B.query("SET lock_timeout = '5s';"); // trả về giá trị an toàn của kit
  await A.query('ROLLBACK;');

  // ── C. SKIP LOCKED: 3 worker lần lượt lấy "ghế trống đầu tiên", mỗi người giữ khóa cho tới khi cả ba đều có ghế ──
  heading('C. SKIP LOCKED: 3 worker nhận 3 ghế khác nhau');
  const PICK = 'SELECT id FROM l06_seats WHERE NOT booked ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED;';
  const picks = [];
  for (const [role, s] of [['A', A], ['B', B], ['C', C]]) {
    await s.query('BEGIN;');
    const r = await settle(s.query(PICK));
    picks.push({ worker: role, seat: r.rows[0]?.id ?? '(không có)', code: r.code ?? 'ok' });
  }
  printTable(picks, ['worker', 'seat', 'code']);
  const seats = picks.map((p) => p.seat);
  check(picks.every((p) => p.code === 'ok') && new Set(seats).size === 3,
    `3 worker nhận 3 ghế khác nhau, không ai chờ: ${seats.join(', ')}`);
  check(seats.join(',') === '1,2,3', `ghế nhận được theo thứ tự id: ${seats.join(', ')} (kỳ vọng 1, 2, 3)`);
  // Mỗi worker đặt ghế của mình rồi COMMIT — đúng khuôn "hàng đợi việc" thực tế.
  for (const [i, s] of [A, B, C].entries()) {
    await s.query(`UPDATE l06_seats SET booked = true WHERE id = ${seats[i]};`);
    await s.query('COMMIT;');
  }
  const left = (await O.query('SELECT count(*)::int AS n FROM l06_seats WHERE NOT booked')).rows[0].n;
  check(left === 7, `sau 3 COMMIT còn ${left} ghế trống (kỳ vọng 7)`);

  // ── D. FOR UPDATE không đi chung với hàm gộp ──
  heading('D. SELECT count(*) … FOR UPDATE');
  const agg = await settle(A.query('SELECT count(*) FROM l06_seats FOR UPDATE;'));
  say(`A nhận: ${agg.code} "${agg.message}"`);
  check(agg.code === '0A000', `count(*) … FOR UPDATE bị từ chối: ${agg.code} (khóa từng dòng, không khóa được "một con số")`);
} catch (e) {
  console.error(`Lab 14.06 dừng vì lỗi không mong đợi: ${e.code ?? ''} ${e.message}`);
  failed = true;
} finally {
  await lab.close();
}
process.exitCode = failed ? 1 : 0;
