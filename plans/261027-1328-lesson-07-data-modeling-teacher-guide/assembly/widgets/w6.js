// W6 · Chia đôi khoảng trống (run-w6): trình duyệt chạy lại vòng chia đôi của region ordering rồi so số lần với số PG đã ghi.
const D = run('w6');
const btns = $('#w6-btns');
const out = $('#w6-out');
if (D && btns && out) {
  // Cùng công thức với SQL: int chia lấy nguyên; float8 = số JS; float4 làm tròn sau phép cộng và sau phép chia.
  const mids = {
    int: (lo, hi) => Math.floor((lo + hi) / 2),
    f8: (lo, hi) => (lo + hi) / 2,
    f4: (lo, hi) => Math.fround(Math.fround(lo + hi) / 2)
  };
  const names = { int: 'int', f8: 'float8', f4: 'float4' };
  const want = { int: D.intSteps, f8: D.f8Steps, f4: D.f4Steps };
  const halve = (mid) => {
    const lo = 1000;
    let hi = 2000, n = 0;
    const seen = [];
    // Dừng khi điểm giữa trùng một đầu, giống điều kiện NOT IN (lo, hi) của SQL. Chặn 200 vòng cho an toàn.
    while (n < 200) {
      const m = mid(lo, hi);
      if (m === lo || m === hi) break;
      hi = m; n++; seen.push(m);
    }
    return { n, seen };
  };
  const show = (k) => {
    if (k === 'fix') {
      out.innerHTML = `<p>Khi khoảng trống cạn, đánh số lại cả danh sách bằng một câu: <code>UPDATE … SET pos = row_number() * 1000</code> → <b>UPDATE ${esc(D.rebalanceRows)}</b>.</p>` +
        '<p>Thứ tự giữ nguyên, khoảng trống giữa hai việc lại rộng như lúc đầu. Việc này hiếm khi xảy ra, nên chạy nó trong cùng transaction với lần kéo thả bị hết chỗ là đủ.</p>';
      return;
    }
    const r = halve(mids[k]);
    const ok = r.n === want[k];
    const head = r.seen.slice(0, 3).map(String).join(', ');
    const tail = r.seen.slice(-2).map(String).join(', ');
    out.innerHTML = `<p>Cột <code>${names[k]}</code>: trình duyệt chia đôi được <b>${r.n}</b> lần · PG ghi trong run: <b>${esc(want[k])}</b> lần ` +
      (ok ? '<span class="good">✔ khớp</span>' : '<span class="badx">✘ lệch</span>') + '</p>' +
      `<p class="muted">Các vị trí mới: ${esc(head)} … ${esc(tail)}</p>` +
      `<p>Lần chèn thứ ${r.n + 1} không còn số nào nằm giữa 1000 và ${esc(String(r.seen[r.seen.length - 1]))}: hai việc sẽ có cùng vị trí và thứ tự bị lẫn.</p>`;
  };
  $$('button', btns).forEach((b) => b.addEventListener('click', () => { press(btns, b); show(b.dataset.k); }));
  press(btns, $('[data-k="f8"]', btns));
  show('f8');
}
