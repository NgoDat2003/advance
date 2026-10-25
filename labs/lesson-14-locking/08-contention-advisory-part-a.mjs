// Lab 14.08 phần a — "dòng nóng" (hot row): 1 người giữ + 7 người xếp hàng trên CÙNG một dòng (slide 12, 19, 21).
// Người chờ đầu tiên chờ transaction của H (Lock/transactionid); những người đến sau xếp hàng trên khóa tuple (Lock/tuple).
// Đối chứng: 8 người cập nhật 8 dòng khác nhau thì không ai phải chờ ai.
import { openLab, waitBlocked, settle, heading, verdict, printTable, jsonMode } from './lock-kit.mjs';

const WAITERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
// Câu lệnh mọi vai cùng gõ: tăng bộ đếm của 1 dòng.
const U = (id) => `UPDATE l08_counters SET n = n + 1 WHERE id = ${id};`;
const say = (s) => { if (!jsonMode) console.log(s); };

export async function runPartA() {
  const lab = await openLab('08', ['H', ...WAITERS]);
  const { O, H, pid } = lab;
  let ok = true;
  const payload = {};
  try {
    // Bảng nháp: 8 bộ đếm id 1–8, n = 0 (lấy id từ contracts của playground, không ghi vào playground).
    await O.query('DROP TABLE IF EXISTS l08_counters; CREATE TABLE l08_counters AS SELECT id, 0 AS n FROM contracts WHERE id <= 8; ALTER TABLE l08_counters ADD PRIMARY KEY (id)');

    heading('A. Dòng nóng — H giữ id = 1, A…G lần lượt xếp hàng');
    await H.query('BEGIN;');
    await H.query(U(1));
    // Từng người chờ gửi UPDATE (tự commit, chưa await), rồi nhờ O xác nhận "đang chờ khóa" trước khi gọi người kế.
    // Promise gom vào mảng vì 7 câu lệnh cùng treo một lúc; doneAt ghi lúc mỗi câu xong.
    const queue = [];
    const doneAt = [];
    const rows = [];
    for (const r of WAITERS) {
      const p = settle(lab[r].query(U(1)));
      p.then(() => doneAt.push(performance.now()));
      queue.push(p);
      const w = await waitBlocked(O, pid[r], pid, { unless: p });
      rows.push({ vai: r, 'đang chờ': w.blocked ? w.waitEvent : 'không chờ', 'bị chặn bởi': [...(w.blockers ?? [])].sort().join(', ') || '—' });
    }
    printTable(rows, ['vai', 'đang chờ', 'bị chặn bởi']);
    const nTx = rows.filter((x) => x['đang chờ'] === 'Lock/transactionid').length;
    const nTuple = rows.filter((x) => x['đang chờ'] === 'Lock/tuple').length;
    ok = verdict(nTx === 1 && nTuple === 6,
      `${nTx + nTuple}/7 người chờ: ${nTx} trên Lock/transactionid (chờ H COMMIT) + ${nTuple} trên Lock/tuple (xếp hàng sau người đầu)`) && ok;

    // H COMMIT: 7 UPDATE được server cho chạy lần lượt từng câu một (mỗi câu tự commit rồi người sau mới sửa được dòng).
    // Ai xong trước sau khi H nhả khóa là do server đánh thức + lập lịch, nên chỉ in số người và thời gian, không in thứ tự tên.
    await H.query('COMMIT;');
    const tCommit = performance.now();
    const results = await Promise.all(queue);
    const after = doneAt.map((t) => Math.max(0, Math.round(t - tCommit))).sort((x, y) => x - y);
    say(`→ sau H COMMIT, ${results.filter((x) => x.ok).length}/7 người xong lần lượt: người đầu sau ${after[0]} ms, người cuối sau ${after[after.length - 1]} ms (mẫu trên máy này)`);
    const { rows: [hot] } = await O.query('SELECT n FROM l08_counters WHERE id = 1');
    const allOk = results.every((x) => x.ok && x.rowCount === 1);
    ok = verdict(allOk && hot.n === 8,
      `Cả 7 UPDATE xong, không ai mất cập nhật: n cuối = ${hot.n} (1 của H + 7 người chờ)`) && ok;
    payload.hotRow = {
      waiters: rows.map((x) => ({ role: x.vai, waitEvent: x['đang chờ'], blockers: x['bị chặn bởi'] })),
      afterCommit: { first: { ms: after[0] }, last: { ms: after[after.length - 1] } },
      finished: results.filter((x) => x.ok).length, finalN: hot.n,
    };

    heading('B. Dòng trải đều — H, A…G mỗi người cập nhật 1 id khác nhau');
    await O.query('UPDATE l08_counters SET n = 0');
    const all = ['H', ...WAITERS];
    for (const r of all) await lab[r].query('BEGIN;');
    // Gửi cả 8 UPDATE cùng lúc, mỗi vai một dòng: id = vị trí của vai (H → 1, A → 2, …, G → 8).
    const spread = all.map((r, i) => settle(lab[r].query(U(i + 1))));
    let blocked = 0;
    for (const [i, r] of all.entries()) {
      if ((await waitBlocked(O, pid[r], pid, { unless: spread[i] })).blocked) blocked++;
    }
    const res = await Promise.all(spread);
    for (const r of all) await lab[r].query('COMMIT;');
    const { rows: [s] } = await O.query('SELECT sum(n)::int AS total, count(*) FILTER (WHERE n = 1)::int AS ones FROM l08_counters');
    say(`8 UPDATE trên 8 dòng khác nhau xong sau tối đa ${Math.round(Math.max(...res.map((x) => x.ms)))} ms (mẫu trên máy này)`);
    ok = verdict(blocked === 0 && res.every((x) => x.ok && x.rowCount === 1) && s.total === 8 && s.ones === 8,
      `${blocked} người chờ; cả 8 UPDATE xong ngay, mỗi dòng n = 1, tổng = ${s.total}`) && ok;
    payload.spread = { waiters: blocked, total: s.total };
  } finally {
    await lab.close();
  }
  return { ok, payload };
}
