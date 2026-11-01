// W7 · Phát lại lần cắt mạng replica theo từng bước (run-w7 ← 07-architecture.partition)
// Số luôn lấy từ run-w7; lời giải thích theo thứ tự các bước của region partition. DOM dựng bằng el(), không innerHTML.
(() => {
  const D = run('w7');
  const box = $('#w7');
  if (!D || !box || !Array.isArray(D.steps) || !D.steps.length) return;
  const tabs = $('#w7-steps', box), view = $('#w7-view', box), out = $('#w7-out', box);
  if (!tabs || !view || !out) return;

  // Mỗi bước: trạng thái mạng main ↔ replica, WAIT ở bước này có phải "bẫy kết nối mới" không, và lời giải thích.
  const META = [
    { net: 'nối', cls: 'ok', note: 'Mạng bình thường. SET và WAIT đi chung một kết nối, nên WAIT thật sự chờ lần ghi này tới replica.' },
    { net: 'đứt', cls: 'bad', note: 'Vừa ngắt mạng replica. SET trên main vẫn OK, nhưng không replica nào xác nhận trong 500 ms: sao chép là bất đồng bộ, main không chờ ai.' },
    { net: 'đứt', cls: 'bad', trap: true, note: 'Bẫy: kết nối mới chưa ghi gì, nên WAIT không có gì để chờ và trả ngay số replica main còn tưởng đang nối (repl-timeout mặc định 60 s).' },
    { net: 'đứt', cls: 'bad', note: 'Đọc trên replica lúc này là đọc dữ liệu cũ (stale read). App không nhận lỗi nào.' },
    { net: 'nối lại', cls: 'ok', note: 'Nối mạng rồi restart replica để nó nối lại ngay, poll tới khi master_link_status:up. Giá mới đã sang.' },
  ];

  const lane = (who, what, pill, cls) => el('div', { class: 'lane' },
    el('span', { class: 'who', text: who }), el('span', { class: 'what', text: what }),
    pill ? el('span', { class: 'pill ' + cls, text: pill }) : el('span'));

  // Giá trên main sau mỗi bước: lấy số trong chữ "SET n" của bước (chữ của run), giữ giá trước nếu bước không ghi.
  let price = null;
  const mainPrice = D.steps.map((s) => { const m = String(s.step ?? '').match(/SET (\d+)/); if (m) price = Number(m[1]); return price; });

  const show = (i) => {
    const s = D.steps[i], m = META[i] ?? { net: '?', cls: 'wait', note: '' };
    const rows = [lane('M', 'main · ' + String(s.step ?? ''),
      'wait' in s ? 'WAIT → ' + Number(s.wait) + (m.trap ? ' (vô nghĩa)' : '') : null,
      'wait' in s ? (m.trap ? 'bad' : Number(s.wait) > 0 ? 'ok' : 'wait') : '')];
    rows.push(lane('⇄', 'mạng main ↔ replica', m.net, m.cls));
    if ('replica_get' in s) {
      const fresh = mainPrice[i] !== null && Number(s.replica_get) === mainPrice[i];
      rows.push(lane('R', 'replica · GET l06:rep:price → ' + Number(s.replica_get) + (mainPrice[i] !== null ? ' (main đang giữ ' + mainPrice[i] + ')' : ''),
        fresh ? 'khớp main' : 'giá cũ', fresh ? 'ok' : 'bad'));
    }
    if ('polls' in s) rows.push(lane('⏱', 'số lần poll tới khi master_link_status:up', 'polls=' + Number(s.polls), 'ok'));
    view.replaceChildren(...rows);
    const kids = [el('p', { text: m.note })];
    if (i === D.steps.length - 1 && 'master_repl_offset' in D) {
      const eq = Number(D.master_repl_offset) === Number(D.slave_repl_offset);
      kids.push(el('p', {}, 'Offset: main ' + Number(D.master_repl_offset) + ' · replica ' + Number(D.slave_repl_offset) + ' → ',
        el('span', { class: eq ? 'good' : 'badx', text: eq ? 'bằng nhau ✔' : 'lệch ✘' })));
      kids.push(el('p', { class: 'muted', text: 'Chỉ ghi nhận, không khẳng định: sync_full=' + Number(D.sync_full) + ', sync_partial_ok=' + Number(D.sync_partial_ok) + ' (cộng dồn từ lúc main khởi động).' }));
    }
    out.replaceChildren(...kids);
  };

  const btns = D.steps.map((s, i) => {
    const b = el('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', text: 'Bước ' + (i + 1) });
    b.addEventListener('click', () => { press(tabs, b); show(i); });
    return b;
  });
  tabs.replaceChildren(...btns);
  press(tabs, btns[0]);
  show(0);
})();
