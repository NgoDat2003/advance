// W3 · Mô phỏng chu kỳ xóa chủ động: 20 khóa mỗi vòng, lặp khi tỉ lệ hết hạn vượt ngưỡng (run-w3 ← 03-expiry.active).
// Mô hình rút ngẫu nhiên 20 khóa; Redis 7.2.3 thật quét bảng expires bằng con trỏ (expires_cursor + dictScan).
// Phần mô phỏng là mô hình, không phải số đo; phần "lần chạy thật" chép từ run-w3 qua textContent.
const D = run('w3'), modes = $('#w3-modes'), stale = $('#w3-stale'), staleOut = $('#w3-stale-val');
const one = $('#w3-one'), ten = $('#w3-ten'), reset = $('#w3-reset'), out = $('#w3-out'), rec = $('#w3-rec');
const N0 = D ? Number(D.keys_written) : NaN;
if (out && !(N0 > 0)) out.textContent = 'Chưa có dữ liệu run-w3 (03-expiry.active).';
if (modes && stale && out && N0 > 0) {
  const SAMPLE = 20; // ACTIVE_EXPIRE_CYCLE_KEYS_PER_LOOP, src/expire.c (7.2.3)
  const MODES = [
    { id: 'slide', label: 'Slide 20: lặp khi > 25%', stop: 0.25 },
    { id: 'v72', label: 'Redis 7.2: lặp khi > 10%', stop: 0.10 }
  ];
  // Giả định của mô phỏng: trần 25% CPU được thay bằng số vòng tối đa mỗi chu kỳ.
  const CAP = 25;
  let mode = MODES[1], keys = 0, expired = 0, cycle = 0, log = [];

  const init = () => {
    keys = N0;
    expired = Math.round((N0 * Number(stale.value)) / 100);
    cycle = 0;
    log = [];
  };
  // Một chu kỳ: rút mẫu không hoàn lại, xóa khóa hết hạn trong mẫu, lặp khi tỉ lệ trong mẫu > ngưỡng.
  const runCycle = () => {
    let loops = 0, removed = 0, ratio = 0, why = 'tỉ lệ hết hạn trong mẫu ≤ ngưỡng';
    do {
      const k = Math.min(SAMPLE, keys);
      if (k === 0) { why = 'hết khóa có TTL'; break; }
      let hit = 0, n = keys, e = expired;
      for (let i = 0; i < k; i++) { if (Math.random() < e / n) { hit++; e--; } n--; }
      expired -= hit; keys -= hit; removed += hit; loops++;
      ratio = hit / k;
      if (ratio > mode.stop && loops >= CAP) { why = `chạm trần mô phỏng ${CAP} vòng`; break; }
    } while (ratio > mode.stop);
    cycle++;
    log.unshift(`Chu kỳ ${cycle}: ${loops} vòng lấy mẫu, xóa ${removed} khóa, dừng vì ${why}.`);
    if (log.length > 6) log.length = 6;
  };
  const pctLeft = () => (keys ? (expired / keys) * 100 : 0);
  const render = () => {
    if (staleOut) staleOut.textContent = String(stale.value);
    const p = pctLeft();
    const bar = el('div', { class: 'bars' }, el('div', { class: 'bar' },
      el('span', { text: 'sót' }),
      el('div', { class: 'bar-track' }, el('div', { class: 'bar-fill neg', style: `left:0;width:${Math.min(100, p).toFixed(1)}%` })),
      el('span', { class: 'bar-val', text: `${p.toFixed(1)}%` })));
    out.replaceChildren(
      el('p', {}, el('b', { text: mode.label }), ` · sau ${cycle} chu kỳ (${(cycle / 10).toFixed(1)} s ở 10 chu kỳ mỗi giây)`),
      el('p', { text: `Còn ${keys} khóa có TTL, trong đó ${expired} đã hết hạn nhưng chưa bị xóa.` }),
      bar,
      log.length ? el('ul', {}, ...log.map((t) => el('li', { text: t }))) : el('p', { class: 'muted', text: 'Bấm "Chạy 1 chu kỳ".' }),
      el('p', { class: 'muted', text: `Mô hình: mẫu ${SAMPLE} khóa mỗi vòng; trần thời gian thay bằng tối đa ${CAP} vòng mỗi chu kỳ (giả định, không đo). Ngưỡng 25% dừng sớm hơn nên để sót nhiều khóa chết hơn; 7.2 lặp tới dưới 10%.` })
    );
  };
  if (rec) {
    const b = D.before || {}, a = D.after || {};
    const src = Array.isArray(D.sources) ? D.sources.map(String).join(', ') : '';
    rec.replaceChildren(
      el('p', {}, el('b', { text: `Lần chạy thật (${src}): ` }), `${Number(D.keys_written)} khóa PX ${Number(D.px_ms)}, không ai đọc, đợi ${Number(D.wait_s)} s.`),
      el('ul', {},
        el('li', { text: `keys ${Number(b.keys)} → ${Number(a.keys)}, expires ${Number(b.expires)} → ${Number(a.expires)}` }),
        el('li', { text: `expired_keys ${Number(b.expired_keys)} → ${Number(a.expired_keys)}` }),
        el('li', { text: `expired_stale_perc ${Number(D.expired_stale_perc)} (trung bình trượt, mỗi chu kỳ nặng 5 %: số trễ, không phải % khóa đang sót; thực tế sau đó expires=${Number(a.expires)})` }),
        el('li', { text: `expire_cycle_cpu_milliseconds ${Number(D.expire_cycle_cpu_milliseconds)} (CPU cho chu kỳ, phụ thuộc máy)` }))
    );
  }
  modes.replaceChildren(...MODES.map((m) => el('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', 'data-k': m.id, text: m.label })));
  $$('button', modes).forEach((btn) => btn.addEventListener('click', () => {
    const m = MODES.find((x) => x.id === btn.dataset.k);
    if (!m) return;
    mode = m;
    press(modes, btn);
    init();
    render();
  }));
  stale.addEventListener('input', () => { init(); render(); });
  if (one) one.addEventListener('click', () => { runCycle(); render(); });
  if (ten) ten.addEventListener('click', () => { for (let i = 0; i < 10; i++) runCycle(); render(); });
  if (reset) reset.addEventListener('click', () => { init(); render(); });
  press(modes, $$('button', modes).find((x) => x.dataset.k === mode.id));
  init();
  render();
}
