// W9 · Mô phỏng token bucket bằng đúng công thức của lua/token-bucket.lua, đặt cạnh 30 lần đã chạy (run-w9 ← 09-bridge.bucket30)
// Số mô phỏng tính từ thanh trượt; số đã chạy lấy từ run-w9. Chữ vào DOM qua el()/textContent.
(() => {
  const box = $('#w9');
  if (!box) return;
  const cap = $('#w9-cap', box), rate = $('#w9-rate', box), gap = $('#w9-gap', box);
  const capV = $('#w9-cap-v', box), rateV = $('#w9-rate-v', box), gapV = $('#w9-gap-v', box);
  const simEl = $('#w9-sim', box), simOut = $('#w9-sim-out', box), runEl = $('#w9-run', box), runOut = $('#w9-run-out', box);
  if (!cap || !rate || !gap || !simEl || !simOut) return;
  const D = run('w9');
  const N = D && Array.isArray(D.rows) && D.rows.length ? D.rows.length : 30;

  // Giống script: bucket mới thì đầy; mỗi lần gọi nạp thêm max(0, now - ts) / 1000 * rate, tối đa capacity;
  // đủ 1 token thì cho qua và trừ 1, không thì retry = ceil((1 - tokens) / rate) * 1000 ms.
  const simulate = (c, r, g) => {
    let tokens = c, ts = 0;
    const rows = [];
    for (let i = 0; i < N; i++) {
      const now = i * g;
      tokens = Math.min(c, tokens + Math.max(0, now - ts) / 1000 * r);
      ts = now;
      if (tokens >= 1) { tokens -= 1; rows.push({ allowed: 1, tokens: Math.floor(tokens), retry_after_ms: 0 }); }
      else rows.push({ allowed: 0, tokens: Math.floor(tokens), retry_after_ms: Math.ceil((1 - tokens) / r) * 1000 });
    }
    return rows;
  };
  const summary = (rows) => {
    const denied = rows.filter((x) => Number(x.allowed) === 0);
    return { allowed: rows.length - denied.length, denied: denied.length, minRetry: denied.length ? Math.min(...denied.map((x) => Number(x.retry_after_ms))) : 0 };
  };
  // Nghĩa không chỉ nằm ở màu: cho qua = chấm tròn, 429 = ô vuông có dấu ✕. Cả dãy là một hình (role="img") có nhãn đếm,
  // và chi tiết từng request được viết ra thành chữ (ranges) để đọc được cả trên điện thoại, không chỉ trong title.
  const dots = (target, rows) => {
    target.replaceChildren(...rows.map((x, i) => el('span', {
      class: 'tok' + (Number(x.allowed) === 1 ? '' : ' denied'),
      text: Number(x.allowed) === 1 ? '' : '✕',
      title: 'request ' + (i + 1) + ': ' + (Number(x.allowed) === 1 ? 'cho qua, còn ' + Number(x.tokens) + ' token' : '429, retry_after_ms ' + Number(x.retry_after_ms)),
    })));
    const s = summary(rows);
    target.setAttribute('role', 'img');
    target.setAttribute('aria-label', rows.length + ' request: ' + s.allowed + ' cho qua (chấm tròn), ' + s.denied + ' bị 429 (ô vuông có dấu ✕)');
  };
  // "request 1–10 cho qua · 11–30 bị 429 (retry_after_ms 100000)": gộp các request liền nhau cùng kết quả.
  const ranges = (rows) => {
    const parts = [];
    rows.forEach((x, i) => {
      const k = Number(x.allowed) === 1 ? 'cho qua' : '429 (retry_after_ms ' + Number(x.retry_after_ms) + ')';
      const last = parts[parts.length - 1];
      if (last && last.k === k) last.to = i + 1; else parts.push({ k, from: i + 1, to: i + 1 });
    });
    return 'Từng request: ' + parts.map((p) => (p.from === p.to ? p.from : p.from + '–' + p.to) + ' ' + p.k).join(' · ');
  };
  const line = (s) => 'cho qua ' + s.allowed + ' · bị từ chối ' + s.denied + (s.denied ? ' · retry_after_ms nhỏ nhất ' + s.minRetry + ' (Retry-After: ' + Math.ceil(s.minRetry / 1000) + ' s)' : '');

  // Bản đã chạy: vẽ một lần.
  let rec = null;
  if (D && Array.isArray(D.rows) && runEl && runOut) {
    dots(runEl, D.rows);
    rec = summary(D.rows);
    runOut.replaceChildren(el('p', { text: 'Sức chứa ' + Number(D.capacity) + ', nạp ' + Number(D.refill_per_s) + ' token/giây, gọi liên tiếp: ' + line(rec) + '.' }),
      el('p', { class: 'muted', text: ranges(D.rows) + '.' }),
      el('p', { class: 'muted', text: 'Dòng tổng của run: allowed=' + Number(D.allowed) + ' denied=' + Number(D.denied) + ' min_retry_after_ms=' + Number(D.min_retry_after_ms) }));
    if (D.capacity !== undefined) cap.value = String(Number(D.capacity));
    const opt = [...rate.options].find((o) => Number(o.value) === Number(D.refill_per_s));
    if (opt) rate.value = opt.value;
  }

  const update = () => {
    const c = Number(cap.value), r = Number(rate.value), g = Number(gap.value);
    if (capV) capV.textContent = String(c);
    if (rateV) rateV.textContent = String(r);
    if (gapV) gapV.textContent = String(g);
    if (!(c > 0 && r > 0 && g >= 0)) return;
    const rows = simulate(c, r, g);
    dots(simEl, rows);
    const s = summary(rows);
    const kids = [el('p', { text: line(s) + '.' }), el('p', { class: 'muted', text: ranges(rows) + '.' })];
    if (rec && D) {
      const sameSetup = c === Number(D.capacity) && r === Number(D.refill_per_s);
      const match = s.allowed === rec.allowed && s.denied === rec.denied && s.minRetry === rec.minRetry;
      kids.push(sameSetup
        ? el('p', {}, el('span', { class: match ? 'good' : 'badx', text: match ? 'Khớp run ✔' : 'Lệch run ✘' }), match ? ' Cùng tham số với run: mô phỏng ra đúng số đã đo trên máy bạn.' : ' Cùng tham số với run nhưng số khác: khoảng cách giữa các request đang lớn, bucket kịp nạp thêm.')
        : el('p', { class: 'muted', text: 'Tham số khác run: đặt sức chứa ' + Number(D.capacity) + ' và nạp ' + Number(D.refill_per_s) + ' để so.' }));
    }
    simOut.replaceChildren(...kids);
  };
  cap.addEventListener('input', update);
  rate.addEventListener('change', update);
  gap.addEventListener('input', update);
  update();
})();
