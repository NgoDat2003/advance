// Lab 14.08 phần b — advisory lock của PostgreSQL (ở bài này đứng thay cho Redis lock) (slide 20, 22).
// Khóa mức transaction (_xact_) tự nhả khi COMMIT; khóa mức session thì KHÔNG — nó sống qua COMMIT tới khi
// gọi pg_advisory_unlock hoặc đóng kết nối, nên với pool kết nối (connection được tái sử dụng) đó là chỗ rò khóa.
import { openLab, heading, verdict, printTable, jsonMode } from './lock-kit.mjs';

// Khóa "chuyến bay 1": hashtext đổi chuỗi thành số nguyên làm khóa advisory.
const TRY = "SELECT pg_try_advisory_xact_lock(hashtext('flight:1'));";
const say = (s) => { if (!jsonMode) console.log(s); };

export async function runPartB() {
  const lab = await openLab('08', ['A', 'B']);
  const { O, A, B, pid } = lab;
  const roleOf = { [pid.A]: 'A', [pid.B]: 'B' };
  // Giá trị cột đầu tiên của dòng đầu tiên (true/false của các hàm advisory).
  const one = async (c, sql) => Object.values((await c.query(sql)).rows[0])[0];
  // O nhìn pg_locks: chỉ các khóa advisory của A, B trong lab này.
  const advisory = async () => (await O.query(`SELECT pid, locktype, mode, granted FROM pg_locks
    WHERE locktype = 'advisory' AND pid = ANY($1) ORDER BY pid`, [[pid.A, pid.B]]))
    .rows.map((r) => ({ vai: roleOf[r.pid], locktype: r.locktype, mode: r.mode, granted: r.granted }));
  const COLS = ['vai', 'locktype', 'mode', 'granted'];
  let ok = true;
  const payload = {};
  try {
    heading('C. pg_try_advisory_xact_lock — khóa theo transaction');
    await A.query('BEGIN;');
    const a1 = await one(A, TRY);
    const b1 = await one(B, TRY); // B tự commit: thử không được thì không giữ gì
    const locks = await advisory();
    printTable(locks, COLS);
    await A.query('COMMIT;');
    const b2 = await one(B, TRY);
    say(`A lấy khóa: ${a1} · B khi A còn mở transaction: ${b1} · B sau khi A COMMIT: ${b2}`);
    ok = verdict(a1 === true && b1 === false && locks.length === 1 && locks[0].vai === 'A' && locks[0].locktype === 'advisory' && b2 === true,
      `A true, B false (không chờ), pg_locks thấy locktype = 'advisory' của A; COMMIT nhả khóa → B true`) && ok;
    payload.xact = { a: a1, bWhileHeld: b1, locks: locks.map(({ vai, locktype, mode }) => ({ role: vai, locktype, mode })), bAfterCommit: b2 };

    heading('D. pg_advisory_lock mức session — sống qua COMMIT');
    await A.query('BEGIN;');
    await A.query("SELECT pg_advisory_lock(hashtext('flight:1'));");
    await A.query('COMMIT;');
    const held = await advisory();
    printTable(held, COLS);
    const b3 = await one(B, TRY);
    const unlocked = await one(A, "SELECT pg_advisory_unlock(hashtext('flight:1'));");
    const after = await advisory();
    const b4 = await one(B, TRY);
    say(`Sau COMMIT A vẫn giữ ${held.length} khóa advisory · B thử: ${b3} · pg_advisory_unlock: ${unlocked} · còn ${after.length} khóa · B thử lại: ${b4}`);
    say('⚠ Với pool kết nối: COMMIT xong connection quay về pool nhưng VẪN giữ khóa → request sau bị chặn. Dùng bản _xact_, hoặc unlock trong finally.');
    ok = verdict(held.length === 1 && held[0].vai === 'A' && b3 === false && unlocked === true && after.length === 0 && b4 === true,
      'pg_advisory_lock sống qua COMMIT (B vẫn false), chỉ nhả khi pg_advisory_unlock → B true') && ok;
    payload.session = { heldAfterCommit: held.length === 1, bWhileHeld: b3, unlocked, locksAfterUnlock: after.length, bAfterUnlock: b4 };
  } finally {
    await lab.close();
  }
  return { ok, payload };
}
