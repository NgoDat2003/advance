// W10 · View được trải phẳng hay bị rào lại? (run-w10 ← 07-views inline / pushdown / fence)
{
  const D = run('w10');
  const el = $('#w10');
  if (D && el && D.plans) {
    const tabs = $('#w10-tabs', el), plan = $('#w10-plan', el), out = $('#w10-out', el);
    const VIEWS = {
      inline: ['v_order_lines', 'JOIN đơn giản'],
      pushdown: ['v_customer_revenue', 'GROUP BY'],
      fence: ['v_top_lines', 'ORDER BY … LIMIT'],
    };
    const keys = Object.keys(VIEWS).filter((k) => Array.isArray(D.plans[k]));
    const node = (l) => l.trim().replace(/^->\s+/, '');
    const show = (k) => {
      const lines = D.plans[k];
      plan.innerHTML = lines.map((l) => esc(l).replace('Subquery Scan', '<mark>Subquery Scan</mark>')).join('\n');
      const fenced = lines.some((l) => l.includes('Subquery Scan'));
      const filter = lines.find((l) => l.trim().startsWith('Filter:'));
      const index = lines.find((l) => l.includes('Index Scan on'));
      const [view, kind] = VIEWS[k];
      out.innerHTML = fenced
        ? `<p><code>${esc(view)}</code> (${esc(kind)}): <span class="badx">bị rào lại, giống TEMPTABLE</span>. PG tính cả view trước; điều kiện <code>${esc(filter ? filter.trim() : '')}</code> chỉ chạy sau cùng.</p>`
        : k === 'pushdown'
          ? `<p><code>${esc(view)}</code> (${esc(kind)}): <span class="good">không bị rào</span>. View vẫn có bước gộp, nhưng điều kiện trên cột GROUP BY được đẩy qua bước gộp xuống tận <code>${esc(index ? node(index) : '')}</code>.</p>`
          : `<p><code>${esc(view)}</code> (${esc(kind)}): <span class="good">không có Subquery Scan, giống MERGE</span>. Điều kiện của bạn được đẩy xuống tận <code>${esc(index ? node(index) : '')}</code>.</p>`;
    };
    tabs.innerHTML = keys.map((k) => `<button type="button" class="btn" aria-pressed="false" data-k="${k}">${esc(VIEWS[k][0])} · ${esc(VIEWS[k][1])}</button>`).join('');
    $$('button', tabs).forEach((b) => b.addEventListener('click', () => { press(tabs, b); show(b.dataset.k); }));
    if (keys.length) { press(tabs, $('button', tabs)); show(keys[0]); }
  }
}
