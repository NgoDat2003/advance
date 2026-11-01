// W2 · Đoán encoding theo ngưỡng mặc định Redis 7.2, đặt cạnh OBJECT ENCODING đã chạy (run-w2 ← 02-encodings.hash, 02-encodings.set-zset-list).
// Ngưỡng dưới đây là cấu hình mặc định của Redis 7.2 (ghi ở đầu 02-encodings.sh). Widget KHÔNG lấy ngưỡng từ run:
// nó áp luật lên đúng các n đã chạy rồi so với encoding đã ghi, nên dấu ✔ là một phép kiểm thật.
const D = run('w2'), types = $('#w2-types'), nIn = $('#w2-n'), lenIn = $('#w2-len'), nOut = $('#w2-n-val'), lenOut = $('#w2-len-val'), lenRow = $('#w2-len-row'), out = $('#w2-out');
const ROWS = D && Array.isArray(D.rows) ? D.rows.filter((r) => r && r.below && r.above) : [];
if (out && !ROWS.length) out.textContent = 'Chưa có dữ liệu run-w2 (02-encodings.*).';
if (types && nIn && lenIn && out && ROWS.length) {
  const RULES = [
    { id: 'hash', label: 'Hash', row: 'hash', setting: 'hash-max-listpack-entries', limit: 512, small: 'listpack', big: 'hashtable', valueRow: 'hash (giá trị)', valueSetting: 'hash-max-listpack-value', valueLimit: 64 },
    { id: 'set-int', label: 'Set số nguyên', row: 'set số', setting: 'set-max-intset-entries', limit: 512, small: 'intset', big: 'hashtable' },
    { id: 'set-str', label: 'Set chuỗi', row: 'set chuỗi', setting: 'set-max-listpack-entries', limit: 128, small: 'listpack', big: 'hashtable' },
    { id: 'zset', label: 'Sorted Set', row: 'zset', setting: 'zset-max-listpack-entries', limit: 128, small: 'listpack', big: 'skiplist' },
    { id: 'list', label: 'List', row: 'list', setting: 'list-max-listpack-size -2 (8 KB mỗi nút)', limit: null, small: 'listpack', big: 'quicklist' }
  ].filter((r) => ROWS.some((x) => x.type === r.row));
  const rowOf = (type) => ROWS.find((x) => x.type === type);
  // Luật đoán: null nghĩa là không đoán được theo số phần tử (List đổi theo byte).
  const predict = (rule, n, len) => {
    if (rule.limit === null) return null;
    const fits = n <= rule.limit && (!rule.valueLimit || len <= rule.valueLimit);
    return fits ? rule.small : rule.big;
  };
  const bytes = (row, side) => (row.memory_bytes && Number.isFinite(Number(row.memory_bytes[side])) ? ` · ${Number(row.memory_bytes[side])} B` : '');
  // Một dòng "đã chạy": n → encoding (byte), kèm ✔/✘ khi luật áp lên n đó cho cùng kết quả.
  const recLine = (rule, row, side, asValue) => {
    const r = row[side], n = Number(r.n), enc = String(r.encoding ?? '');
    const guess = asValue ? predict(rule, 1, n) : predict(rule, n, 1);
    const mark = guess === null ? '–' : guess === enc ? '✔' : '✘';
    const what = asValue ? `giá trị ${n} byte` : `${n} phần tử`;
    return el('li', {}, el('code', { text: `${what} → ${enc}${bytes(row, side)}` }), ` ${mark}`);
  };

  let cur = RULES[0];
  types.replaceChildren(...RULES.map((r) => el('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', 'data-k': r.id, text: r.label })));
  const render = () => {
    const n = Number(nIn.value), len = Number(lenIn.value);
    if (nOut) nOut.textContent = String(n);
    if (lenOut) lenOut.textContent = String(len);
    if (lenRow) lenRow.hidden = !cur.valueLimit;
    const guess = predict(cur, n, len);
    const row = rowOf(cur.row), vrow = cur.valueRow ? rowOf(cur.valueRow) : null;
    const head = guess === null
      ? el('p', {}, el('b', { text: `${cur.label}: không đoán theo số phần tử. ` }), `List đổi encoding theo tổng byte của một nút (${cur.setting}), nên cùng ${n} phần tử có thể là ${cur.small} hoặc ${cur.big} tùy độ dài từng phần tử.`)
      : el('p', {}, `${cur.label} với ${n} phần tử${cur.valueLimit ? `, giá trị dài nhất ${len} byte` : ''} → đoán `, el('b', { text: guess }));
    const why = guess === null ? null : el('p', { class: 'muted', text: cur.valueLimit
      ? `Luật: ${cur.small} khi số trường ≤ ${cur.limit} (${cur.setting}) VÀ mọi giá trị ≤ ${cur.valueLimit} byte (${cur.valueSetting}); vượt một trong hai là ${cur.big}.`
      : `Luật: ${cur.small} khi số phần tử ≤ ${cur.limit} (${cur.setting}); vượt là ${cur.big}.` });
    const list = el('ul', {}, recLine(cur, row, 'below', false), recLine(cur, row, 'above', false), ...(vrow ? [recLine(cur, vrow, 'below', true), recLine(cur, vrow, 'above', true)] : []));
    const src = Array.isArray(D.sources) ? D.sources.map(String).join(', ') : '';
    out.replaceChildren(head, why || '', el('p', { text: 'Đã chạy trên máy bạn (OBJECT ENCODING · MEMORY USAGE):' }), list, el('p', { class: 'muted', text: `Nguồn: ${src}. ✔ = luật trên cho đúng encoding đã ghi; – = không đoán theo số phần tử.` }));
  };
  $$('button', types).forEach((b) => b.addEventListener('click', () => {
    const r = RULES.find((x) => x.id === b.dataset.k);
    if (!r) return;
    cur = r;
    press(types, b);
    render();
  }));
  nIn.addEventListener('input', render);
  lenIn.addEventListener('input', render);
  press(types, $$('button', types)[0]);
  render();
}
