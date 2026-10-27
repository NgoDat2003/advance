// W4 · Đồng hồ DDL (run-w4): thời gian ALTER trên thang log, huy hiệu viết lại bảng, mode khóa, và kết cục của phiên B khi tạo index thường / CONCURRENTLY.
const D = run('w4');
const bars = $('#w4-bars');
const out = $('#w4-out');
const mode = $('#w4-mode');
if (D && bars && out && mode) {
  // Thang log 0,1 ms → 10 s: mỗi bậc 10 lần chiếm 20% chiều dài.
  const pct = (ms) => Math.max(2, Math.min(100, ((Math.log10(ms) + 1) / 5) * 100));
  const short = (ms) => (ms >= 100 ? Math.round(ms) : ms);
  const row = (i, label, ms, bad, pill) =>
    `<div><p class="muted"><code>${esc(label)}</code> · <b>${esc(ms)} ms</b> ${pill}</p>` +
    `<div class="bar"><span>#${i}</span><span class="bar-track" aria-hidden="true"><span class="bar-fill${bad ? ' neg' : ''}" style="left:0;width:${pct(ms)}%"></span></span><span class="bar-val">${esc(short(ms))}</span></div></div>`;
  bars.innerHTML = D.alters.map((a, i) => row(i + 1, a.sql, a.ms, a.rewrite,
    a.rewrite ? '<span class="pill bad">viết lại cả bảng</span>' : '<span class="pill ok">chỉ sửa catalog</span>')).join('') +
    `<p>Câu nào cũng giữ <code>${esc(D.lockMode)}</code> trên bảng ${esc(D.rows)} dòng: nhanh hay chậm chỉ quyết định khóa giữ bao lâu.</p>`;

  const show = (k) => {
    if (k === 'plain') {
      const p = D.plain;
      out.innerHTML = `<p>A giữ <code>${esc(p.lockMode)}</code> trong lúc tạo index.</p>` +
        `<div class="lanes"><div class="lane"><span class="who">B</span><span class="what">SELECT count(*) … store_id = 44</span><span class="pill ok">đọc được ${esc(p.bSelectRows)} dòng</span></div>` +
        `<div class="lane"><span class="who">B</span><span class="what">UPDATE … WHERE id = 1</span><span class="pill bad">${esc(p.bUpdateCode)} sau ${esc(p.bUpdateMs)} ms</span></div></div>` +
        '<p>ShareLock cho phép người đọc nhưng chặn mọi người ghi. B chỉ thoát được nhờ <code>lock_timeout = 2s</code>.</p>';
    } else {
      const c = D.cic;
      out.innerHTML = `<p>B giữ <code>${esc(c.lockMode)}</code> trong lúc tạo index.</p>` +
        `<div class="lanes"><div class="lane"><span class="who">A</span><span class="what">UPDATE … WHERE id = 3 (giữa lúc B tạo index)</span><span class="pill ok">${esc(c.aUpdate)}</span></div>` +
        `<div class="lane"><span class="who">B</span><span class="what">phase: ${esc(c.phase)}</span><span class="pill wait">chờ A commit</span></div>` +
        `<div class="lane"><span class="who">B</span><span class="what">CREATE INDEX CONCURRENTLY xong sau ${esc(c.cicMs)} ms</span><span class="pill ok">indisvalid = ${esc(c.valid)}</span></div></div>` +
        '<p>Người ghi không bị chặn. Đổi lại, B phải chờ mọi transaction đang mở từ trước (kể cả transaction chỉ đọc giữ snapshot cũ), nên cần lock_timeout đủ dài; không được chạy trong BEGIN (25001).</p>';
    }
  };
  $$('button', mode).forEach((b) => b.addEventListener('click', () => { press(mode, b); show(b.dataset.k); }));
  show('plain');
}
