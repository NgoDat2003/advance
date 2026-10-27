// W5 · Chọn kiểu cho từng trường (run-w5): trường → kiểu PG, kiểu Prisma, byte đo được, bẫy; kèm bảng tiền float vs numeric.
const D = run('w5');
const btns = $('#w5-fields');
const out = $('#w5-out');
const money = $('#w5-money');
if (D && btns && out && money) {
  const show = (i) => {
    const f = D.fields[i];
    out.innerHTML = `<p><b>${esc(f.field)}</b></p>` +
      `<p>PostgreSQL: <code>${esc(f.pg)}</code> · Prisma: <code>${esc(f.prisma)}</code></p>` +
      `<p>Đo được: ${esc(f.bytes)}</p>` +
      `<p><span class="badx">Bẫy:</span> ${esc(f.trap)}</p>`;
  };
  btns.innerHTML = D.fields.map((f, i) => `<button type="button" class="btn" aria-pressed="false" data-i="${i}">${esc(f.field)}</button>`).join('');
  $$('button', btns).forEach((b) => b.addEventListener('click', () => { press(btns, b); show(+b.dataset.i); }));
  press(btns, $('button', btns));
  show(0);

  // Bảng tiền: số trong run; riêng dòng đầu tính lại ngay trên trình duyệt (JS cũng dùng float64 như float8 của PG).
  const m = D.money;
  const live = String(0.1 + 0.2);
  const gap = Math.abs(Number(m.nwReal) - Number(m.nwNumeric)).toFixed(2);
  money.innerHTML = '<h4>Tiền: float hay numeric?</h4>' +
    '<div class="table-wrap"><table><thead><tr><th>Phép tính</th><th>float8 / real</th><th>numeric</th></tr></thead><tbody>' +
    `<tr><td>0.1 + 0.2</td><td class="n badx">${esc(m.floatAdd)}</td><td class="n good">0.3</td></tr>` +
    `<tr><td>cộng 0,1 một triệu lần</td><td class="n badx">${esc(m.floatSum)}</td><td class="n good">${esc(m.numericSum)}</td></tr>` +
    `<tr><td>doanh thu northwind, không làm tròn</td><td class="n">${esc(m.nwRealRaw)}</td><td class="n">${esc(m.nwNumericRaw)}</td></tr>` +
    `<tr><td>doanh thu northwind, làm tròn từng dòng</td><td class="n badx">${esc(m.nwReal)}</td><td class="n good">${esc(m.nwNumeric)}</td></tr>` +
    '</tbody></table></div>' +
    `<p>Trình duyệt của bạn tính <code>0.1 + 0.2</code> = <code>${esc(live)}</code> ` +
    (live === m.floatAdd ? '<span class="good">✔ giống hệt PG</span>' : '<span class="badx">✘ khác PG</span>') +
    `. Không làm tròn thì hai bên gần như bằng nhau; làm tròn từng dòng như hóa đơn thì lệch <b>${esc(gap)}</b>, vì float làm tròn sai các giá trị kiểu x,xx5.</p>` +
    `<p>NULL thì rẻ: dòng có giá trị ${esc(D.nullRow.full)} byte, dòng có 3 cột NULL ${esc(D.nullRow.allNull)} byte.</p>`;
}
