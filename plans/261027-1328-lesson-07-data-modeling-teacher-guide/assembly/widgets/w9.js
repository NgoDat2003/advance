// W9 · Phát lại sổ cái từng bước (run-w9 ← 09-ledger post / attack-* / reconcile, 09-ledger-race.ordered)
{
  const D = run('w9');
  const el = $('#w9');
  if (D && el && Array.isArray(D.steps) && D.steps.length) {
    const S = D.steps;
    // Tính bằng đơn vị xu (số nguyên) để không lệch kiểu float
    const cents = (v) => Math.round(parseFloat(v) * 100);
    const fmt = (c) => (c / 100).toFixed(2);
    const sign = (c) => (c < 0 ? 'neg' : c > 0 ? 'pos' : '');
    const ok = (b) => (b ? '<span class="good">✔</span>' : '<span class="badx">✘</span>');
    const prev = $('#w9-prev', el), next = $('#w9-next', el);
    let i = 0;
    const draw = () => {
      const s = S[i];
      const led = {};
      let total = 0;
      S.slice(0, i + 1).forEach((x) => (x.entries || []).forEach(([, w, a]) => { led[w] = (led[w] || 0) + cents(a); total += cents(a); }));
      const ws = Object.keys(s.balances || {});
      const max = Math.max(1, ...ws.map((w) => Math.abs(cents(s.balances[w]))));
      const bar = (c) => {
        const a = 50 + Math.min(0, c) / max * 50, b = 50 + Math.max(0, c) / max * 50;
        return `<span class="bar-track" style="display:block" aria-hidden="true"><span class="bar-zero" style="left:50%"></span><span class="bar-fill${c < 0 ? ' neg' : ''}" style="left:${a}%;width:${b - a}%"></span></span>`;
      };
      $('#w9-head', el).innerHTML = `<p><b>Bước ${i + 1}/${S.length}:</b> ${esc(s.label)}${s.code ? ` <span class="pill bad">DB từ chối · ${esc(s.code)}</span>` : ''}</p>`;
      $('#w9-bal', el).innerHTML = '<thead><tr><th>Ví</th><th class="n">Số dư cache</th><th class="n">Theo sổ cái</th><th>Mức</th></tr></thead><tbody>'
        + ws.map((w) => {
          const c = cents(s.balances[w]), l = led[w] || 0;
          return `<tr><td>${esc(w)}</td><td class="n ${sign(c)}">${esc(s.balances[w])}</td><td class="n ${sign(l)}">${fmt(l)}</td><td>${bar(c)}</td></tr>`;
        }).join('') + '</tbody>';
      const es = s.entries || [];
      $('#w9-ent', el).innerHTML = '<thead><tr><th>idempotency_key</th><th>Ví</th><th class="n">Bút toán</th></tr></thead><tbody>'
        + (es.length
          ? es.map(([k, w, a]) => `<tr><td>${esc(k)}</td><td>${esc(w)}</td><td class="n ${sign(cents(a))}">${esc(a)}</td></tr>`).join('')
          : `<tr><td colspan="3" class="muted">${s.code ? 'Không bút toán nào ở lại: cả transaction rollback.' : 'Bước này không ghi bút toán.'}</td></tr>`)
        + '</tbody>';
      const stepSum = es.reduce((t, [, , a]) => t + cents(a), 0);
      const drift = ws.filter((w) => cents(s.balances[w]) !== (led[w] || 0)).length;
      let h = es.length ? `<p>${ok(stepSum === 0)} Giao dịch của bước cân: Σ = ${fmt(stepSum)}</p>` : '<p class="muted">Bước này không có bút toán mới.</p>';
      h += `<p>${ok(total === 0)} Σ mọi bút toán = ${fmt(total)}</p>`;
      h += `<p>${ok(drift === 0)} Ví lệch cache = ${drift}${s.drift !== undefined ? ` (run ghi: ${esc(s.drift)})` : ''}</p>`;
      if (i === S.length - 1 && D.race) {
        h += `<p class="muted">Đua hai phiên: khóa không thứ tự → nạn nhân 40P01 là ${esc(D.race.unorderedVictim)}; qua post_transfer → B chờ ${esc(D.race.orderedBWaitMs)} ms, không deadlock.</p>`;
      }
      $('#w9-inv', el).innerHTML = h;
      prev.disabled = i === 0;
      next.disabled = i === S.length - 1;
    };
    prev.addEventListener('click', () => { i = Math.max(0, i - 1); draw(); });
    next.addEventListener('click', () => { i = Math.min(S.length - 1, i + 1); draw(); });
    draw();
  }
}
