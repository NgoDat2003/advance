// W3 · Hai làn A / B (run-w3: sự kiện gộp theo giờ của 03-fk-race #nofk và #fk)
{
  const D = run('w3'), lanes = $('#w3-lanes'), fk = $('#w3-fk'), next = $('#w3-next'), reset = $('#w3-reset'), out = $('#w3-out');
  if (D && D.orphans && lanes && fk && next && reset && out) {
    const TAG = /^(INSERT|DELETE|UPDATE)( \d+)+$/;   // dòng kết quả psql, không phải câu SQL
    const mode = () => (fk.checked ? 'fk' : 'nofk');
    const evs = () => (Array.isArray(D[mode()]) ? D[mode()] : []);
    let shown = 1;
    const lane = (e, last) => {
      const sql = (e.sql || []).filter((s) => !TAG.test(s));
      const tag = (e.sql || []).find((s) => TAG.test(s));
      const orphans = D.orphans[mode()];
      let pill = '<span class="pill">đọc</span>';
      if (e.error) pill = `<span class="pill bad">${esc(String(e.error).split(':')[0])}</span>`;
      else if (tag) pill = `<span class="pill">${esc(tag)}</span>`;
      else if (last) pill = `<span class="pill ${orphans ? 'bad' : 'ok'}">orphans ${esc(orphans)}</span>`;
      else if (!sql.length) pill = '<span class="pill">xong</span>';
      const err = e.error ? `<br><span class="badx">${esc(e.error)}</span>` : '';
      return `<div class="lane"><span class="who">${esc(e.who)}</span><span class="what"><b>${esc(e.step)}</b> <span class="muted">${esc(e.luc)}</span>` +
        `${sql.map((s) => `<br><code>${esc(s)}</code>`).join('')}${err}</span>${pill}</div>`;
    };
    const render = () => {
      const E = evs();
      lanes.innerHTML = E.slice(0, shown).map((e, i) => lane(e, i === E.length - 1)).join('');
      next.disabled = shown >= E.length;
      const done = shown >= E.length;
      const fkErr = (D.fk || []).find((e) => e.error);
      out.innerHTML = !done ? '<p>Bấm "Bước tiếp" để phát lại theo đúng giờ đã ghi.</p>'
        : mode() === 'nofk'
          ? `<p><span class="badx">✘ orphans = ${esc(D.orphans.nofk)}</span>: cả hai bên đều "kiểm tra trước" và đều qua. B xóa cửa hàng 7, rồi A vẫn tạo hợp đồng cho nó.</p>`
          : `<p><span class="good">✔ orphans = ${esc(D.orphans.fk)}</span>: cùng code app, nhưng INSERT của A bị DB từ chối${fkErr ? ` (<code>${esc(String(fkErr.error).split(':')[0])}</code>)` : ''}. Không FK để lại ${esc(D.orphans.nofk)}.</p>`;
    };
    next.addEventListener('click', () => { shown = Math.min(shown + 1, evs().length); render(); });
    reset.addEventListener('click', () => { shown = 1; render(); });
    fk.addEventListener('change', () => { shown = 1; render(); });
    render();
  }
}
