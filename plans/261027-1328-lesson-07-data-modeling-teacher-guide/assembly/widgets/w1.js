// W1 · Bản đồ ERD và 4 loại bảng (run-w1: tên bảng, loại, ghi chú, cột lấy từ catalog đã chạy)
{
  const D = run('w1'), erd = $('#w1-erd'), btns = $('#w1-btns'), out = $('#w1-out');
  if (D && Array.isArray(D.tables) && erd && btns && out) {
    const KIND = { entity: 'Entity · có id và vòng đời', relation: 'Relation · nối N–M', support: 'Support · bảng phụ của một entity', config: 'Config · danh mục ít đổi' };
    const CHIP = { entity: 'ok', relation: 'diff', support: 'none', config: 'none' };
    // Xếp 2 cột để cạnh FK nằm ngang/dọc, không cắt qua hộp khác; bảng lạ (nếu có) xếp cuối.
    const ORDER = ['erd_orders', 'erd_payment_transactions', 'wallets', 'ledger_entries', 'hw_airports', 'transfers', 'nf_order_lines', 'cs_availability'];
    const T = ORDER.map((n) => D.tables.find((t) => t.name === n)).filter(Boolean);
    D.tables.forEach((t) => { if (!T.includes(t)) T.push(t); });
    const W = 200, H = 56, GX = 40, GY = 30, P = 10;
    const pos = new Map(T.map((t, i) => [t.name, { x: P + (i % 2) * (W + GX), y: P + Math.floor(i / 2) * (H + GY) }]));
    const edges = [];
    T.forEach((t) => (t.cols || []).forEach((c) => {
      const m = String(c).match(/→\s*(\S+)/);
      if (m && pos.has(m[1])) edges.push([t.name, m[1]]);
    }));
    const path = (a, b) => {
      const p = pos.get(a), q = pos.get(b);
      if (p.y === q.y) { const r = p.x < q.x; return `M${r ? p.x + W : p.x} ${p.y + H / 2}H${r ? q.x : q.x + W}`; }
      const d = p.y < q.y, x1 = p.x + W / 2, x2 = q.x + W / 2, y1 = d ? p.y + H : p.y, y2 = d ? q.y : q.y + H, ym = (y1 + y2) / 2;
      return `M${x1} ${y1}V${ym}H${x2}V${y2}`;
    };
    const vh = P * 2 + Math.ceil(T.length / 2) * (H + GY) - GY;
    erd.innerHTML = `<svg viewBox="0 0 ${P * 2 + W * 2 + GX} ${vh}" role="img" aria-label="ERD của ${T.length} bảng; bấm nút bên dưới để xem chi tiết">` +
      edges.map(([a, b]) => `<path class="erd-edge" d="${path(a, b)}" fill="none"/>`).join('') +
      T.map((t) => {
        const p = pos.get(t.name);
        return `<g data-t="${esc(t.name)}" style="cursor:pointer"><rect class="erd-box" x="${p.x}" y="${p.y}" width="${W}" height="${H}" rx="8"/>` +
          `<text class="erd-title" x="${p.x + 10}" y="${p.y + 23}">${esc(t.name)}</text>` +
          `<text class="erd-key" x="${p.x + 10}" y="${p.y + 44}">${esc(t.kind)} · ${(t.cols || []).length} cột</text></g>`;
      }).join('') + '</svg>';
    btns.innerHTML = T.map((t) => `<button type="button" class="btn" aria-pressed="false" data-t="${esc(t.name)}">${esc(t.name)}</button>`).join('');
    const count = Object.keys(KIND).map((k) => `${k}: ${T.filter((t) => t.kind === k).length}`).join(' · ');
    const show = (name) => {
      const t = T.find((x) => x.name === name);
      if (!t) return;
      press(btns, $$('button', btns).find((b) => b.dataset.t === name));
      $$('rect', erd).forEach((r) => { r.style.strokeWidth = r.parentNode.dataset.t === name ? '3' : ''; });
      const cols = (t.cols || []).map((c) => `<li><code>${esc(c)}</code>${String(c).includes('→') ? ' <span class="muted">cột tham chiếu</span>' : ''}</li>`).join('');
      out.innerHTML = `<p><b>${esc(t.name)}</b> <span class="vchip ${CHIP[t.kind] || 'none'}">${esc(KIND[t.kind] || t.kind)}</span></p>` +
        `<p>${esc(t.note || '')}</p><ul>${cols}</ul><p class="muted">Đếm theo loại: ${esc(count)}</p>`;
    };
    $$('button', btns).forEach((b) => b.addEventListener('click', () => show(b.dataset.t)));
    $$('g[data-t]', erd).forEach((g) => g.addEventListener('click', () => show(g.dataset.t)));
    if (T.length) show(T[0].name);
  }
}
