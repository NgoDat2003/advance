// W2 · Bậc thang chuẩn hóa (run-w2: số đo bất thường; lưới mẫu đọc từ khối kết quả 0nf/1nf đã in trong trang)
{
  const D = run('w2'), btns = $('#w2-btns'), grid = $('#w2-grid'), out = $('#w2-out');
  if (D && Array.isArray(D.steps) && btns && grid && out) {
    // Dòng dữ liệu psql dạng " 10248 | … | …": tách theo dấu |.
    const rowsOf = (id) => {
      const pre = $(`pre[data-run="${id}"]`);
      return pre ? pre.textContent.split('\n').filter((l) => /^\s*\d{5} \|/.test(l)).map((l) => l.split('|').map((c) => c.trim())) : [];
    };
    const R0 = rowsOf('02-normal-forms#0nf');
    const R1 = rowsOf('02-normal-forms#1nf'); // order_id, product_id, customer_name, customer_city, product_name, category_name, quantity
    const pick = (rows, idx) => {
      const seen = new Set();
      return rows.map((r) => idx.map((i) => r[i])).filter((r) => { const k = r.join('|'); return seen.has(k) ? false : seen.add(k); });
    };
    // dupCols: cột mà giá trị đã xuất hiện ở dòng trên được tô td.dup
    const table = (name, head, rows, dupCols = []) => {
      const seen = dupCols.map(() => new Set());
      const body = rows.map((r) => `<tr>${r.map((v, i) => {
        const k = dupCols.indexOf(i), dup = k >= 0 && seen[k].has(v);
        if (k >= 0) seen[k].add(v);
        return `<td${dup ? ' class="dup"' : ''}>${esc(v)}</td>`;
      }).join('')}</tr>`).join('');
      return `<p class="eyebrow">${esc(name)}</p><div class="table-wrap"><table class="nf-grid"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
    };
    const lines = pick(R1, [0, 1, 6]), products = pick(R1, [1, 4, 5]);
    const VIEW = {
      '0nf': () => table('order_sheet_raw', ['order_id', 'customer_name', 'items'], R0),
      '1nf': () => table('order_sheet', ['order_id', 'product_id', 'customer_name', 'customer_city', 'product_name', 'quantity'], pick(R1, [0, 1, 2, 3, 4, 6]), [2, 3]),
      '2nf': () => table('nf_orders (còn tên, thành phố khách)', ['order_id', 'customer_name', 'customer_city'], pick(R1, [0, 2, 3])) +
        table('nf_products', ['product_id', 'product_name', 'category_name'], products) + table('nf_order_lines', ['order_id', 'product_id', 'quantity'], lines),
      '3nf': () => table('nf_customers (khóa là customer_id, không hiện ở lưới mẫu)', ['customer_name', 'customer_city'], pick(R1, [2, 3])) +
        '<p class="muted">nf_orders chỉ còn customer_id (FK → nf_customers); nf_products, nf_order_lines giữ như bước 2NF.</p>',
      dn: () => '<p class="muted">dn_orders = nf_orders + cột dư order_total (tổng các dòng món).</p>'
    };
    const FACT = {
      '0nf': `${D.rawOrders} đơn, ô items nhồi nhiều món. Muốn đếm món phải tách chuỗi → ${D.lineRows} dòng.`,
      '1nf': `Mỗi ô một giá trị, nhưng tên món product_id = 1 lặp ${D.dupProductName} lần, thành phố khách SAVEA lặp ${D.dupCityRows} lần.`,
      '2nf': `Đổi tên món 1: bảng phẳng UPDATE ${D.updateFlat}, nf_products UPDATE ${D.updateNormalized}. Tên và thành phố khách vẫn lặp theo từng đơn.`,
      '3nf': `Xóa đơn của khách chỉ có 1 đơn ở bảng phẳng → ${D.lostCities} khách mất thành phố; 3NF thì không. Món chưa ai đặt không vào được bảng phẳng: ${D.insertCode}. nf_customers có ${D.customersWithOrders} khách, northwind có ${D.customersNorthwind}. Ghép lại 4 bảng: lệch ${D.losslessDiff} dòng.`,
      dn: `Đọc tổng tiền không cần JOIN. Sửa 1 dòng món mà quên cập nhật cache → câu đối soát bắt ${D.denormDrift} đơn lệch.`
    };
    const steps = D.steps.concat([{ key: 'dn', label: 'Phi chuẩn', tables: ['dn_orders (cache order_total)'] }]);
    const show = (s) => {
      grid.innerHTML = (VIEW[s.key] || (() => ''))();
      out.innerHTML = `<p><b>${esc(s.label)}</b> · bảng: ${(s.tables || []).map((t) => `<code>${esc(t)}</code>`).join(', ')}</p><p>${esc(FACT[s.key] || '')}</p>`;
    };
    btns.innerHTML = steps.map((s, i) => `<button type="button" class="btn" aria-pressed="false" data-i="${i}">${esc(s.label)}</button>`).join('');
    $$('button', btns).forEach((b) => b.addEventListener('click', () => { press(btns, b); show(steps[+b.dataset.i]); }));
    press(btns, $('button', btns));
    show(steps[0]);
  }
}
