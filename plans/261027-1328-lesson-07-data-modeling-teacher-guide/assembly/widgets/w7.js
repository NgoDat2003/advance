// W7 · Lịch phòng tháng 11/2026 (run-w7): lưới tháng từ các dòng đã ghi; phát lại lượt đặt 3 đêm, lượt đặt trùng bị ROLLBACK và lỗi 23P01 của EXCLUDE.
const D = run('w7');
const cal = $('#w7-cal');
const btns = $('#w7-btns');
const out = $('#w7-out');
if (D && cal && btns && out) {
  const span = (r) => { const m = /(\d+)→(\d+)/.exec(r); return m ? [+m[1], +m[2]] : [0, 0]; };
  const [b1, b2] = span(D.book.range);
  const [r1, r2] = span(D.retry.range);
  const dayNo = (d) => +d.day.slice(8, 10);
  // Lịch vừa sinh: mọi ngày OPEN (DEFAULT 'OPEN' trong region availability).
  let state = {};
  let sel = [];
  let booked = false;
  const reset = () => { state = {}; D.days.forEach((d) => { state[dayNo(d)] = 'OPEN'; }); sel = []; booked = false; };
  const paint = () => {
    const first = new Date(D.days[0].day + 'T00:00:00Z').getUTCDay();   // 0 = Chủ nhật
    const blanks = (first + 6) % 7;                                     // lưới bắt đầu từ thứ Hai
    cal.innerHTML = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((x) => `<span class="dow">${x}</span>`).join('') +
      '<span></span>'.repeat(blanks) +
      D.days.map((d) => {
        const n = dayNo(d), s = state[n];
        return `<button type="button" class="day ${s.toLowerCase()}${sel.includes(n) ? ' sel' : ''}" data-n="${n}" aria-label="${esc(d.day)}: ${esc(s)}">${n}</button>`;
      }).join('');
  };
  const range = (a, z) => { const r = []; for (let i = a; i < z; i++) r.push(i); return r; };
  const book = () => { range(b1, b2).forEach((n) => { state[n] = 'BOOKED'; }); booked = true; };
  const same = () => D.days.every((d) => state[dayNo(d)] === d.status);
  const step = (k) => {
    if (k === 'reset') {
      reset();
      out.innerHTML = `<p>Vừa sinh lịch: <b>${esc(D.generated)}</b> dòng cho 3 căn, mọi ngày OPEN, giá ${esc(D.price)}. Đổi giá một ngày lễ chỉ là <code>${esc(D.priceUpdate)}</code>.</p>`;
    } else if (k === 'book') {
      if (!booked) book();
      sel = range(b1, b2);
      out.innerHTML = `<p>Đặt ${esc(D.book.range)}: cần ${b2 - b1} đêm, <code>UPDATE … AND status = 'OPEN'</code> trả <b>UPDATE ${esc(D.book.rows)}</b>. ` +
        (D.book.rows === b2 - b1 ? '<span class="good">Đủ số dòng → COMMIT.</span>' : '<span class="badx">Thiếu dòng → ROLLBACK.</span>') + '</p>';
    } else if (k === 'retry') {
      if (!booked) book();
      sel = range(r1, r2);
      const need = r2 - r1;
      out.innerHTML = `<p>Khách khác đặt ${esc(D.retry.range)}: cần ${need} đêm, nhưng chỉ <b>UPDATE ${esc(D.retry.rows)}</b> vì đêm ${r1} đã BOOKED. ` +
        (D.retry.rows === need ? '<span class="good">COMMIT.</span>' : '<span class="badx">Thiếu dòng → app ROLLBACK, đêm ' + (r2 - 1) + ' vẫn OPEN.</span>') + '</p>' +
        '<p>' + (same() ? '<span class="good">✔ Lịch trên khớp từng ngày với kết quả đã ghi trong run.</span>' : '<span class="badx">✘ Lịch lệch với run.</span>') + '</p>';
    } else if (k === 'excl') {
      if (!booked) book();
      sel = range(r1, r2);
      out.innerHTML = `<p>Cách thứ hai lưu một dòng <code>daterange</code> cho mỗi lượt. Chèn ${esc(D.retry.range)} cho căn 1 → DB báo <b class="badx">${esc(D.exclusionCode)}</b> vì chồng lên ${esc(D.book.range)}.</p>` +
        '<p>Không cần đếm số dòng trong app: chính ràng buộc <code>EXCLUDE … WITH &amp;&amp;</code> từ chối.</p>';
    }
    paint();
  };
  cal.addEventListener('click', (e) => {
    const b = e.target.closest('.day');
    if (!b) return;
    const n = +b.dataset.n;
    out.innerHTML = `<p>Ngày ${n}/11/2026 · trạng thái <b>${esc(state[n])}</b> · giá ${esc(D.price)}</p>`;
  });
  $$('button', btns).forEach((b) => b.addEventListener('click', () => step(b.dataset.k)));
  step('reset');
}
