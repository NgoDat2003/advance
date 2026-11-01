// W8 · Ai đang giữ khóa? Năm kịch bản trên một trục thời gian (run-w8 ← 08-lock*.timeline)
// Thanh "khóa thật" và khung "tưởng còn giữ" đều suy ra từ sự kiện đã ghi (ms host); không có số gõ tay.
// DOM dựng bằng el()/textContent; vị trí thanh đặt qua style (số), không qua innerHTML.
(() => {
  const D = run('w8');
  const box = $('#w8');
  if (!D || !box || !Array.isArray(D.timelines) || !D.timelines.length) return;
  const tabs = $('#w8-tabs', box), lanes = $('#w8-lanes', box), out = $('#w8-out', box), tbody = $('#w8-events tbody', box);
  if (!tabs || !lanes || !out || !tbody) return;

  const LABEL = {
    '08-lock.nolock.timeline': '1 · Không khóa',
    '08-lock.nx.timeline': '2 · SET NX PX',
    '08-lock.ttldel.timeline': '3 · TTL + DEL',
    '08-lock-lua.cad.timeline': '4 · Compare-and-delete',
    '08-lock-lua.fencing.timeline': '5 · Fencing token',
  };
  const LESSON = {
    '08-lock.nolock.timeline': 'Không có khóa nào. A và B cùng đọc thấy ghế trống rồi cùng ghi, nên sổ đặt chỗ có hai lần BOOKED.',
    '08-lock.nx.timeline': 'Một khóa, một người: B nhận (nil) và không được làm việc. A trả khóa trước khi khóa hết hạn, nên lỗi của DEL trơn chưa lộ ra.',
    '08-lock.ttldel.timeline': 'Khóa thật của A hết hạn trong khi A còn làm (khung nét đứt dài hơn thanh liền). B vào; DEL của A cắt ngang khóa của B; tokC vào ngay. B và C cùng làm việc trên một ghế.',
    '08-lock-lua.cad.timeline': 'A vẫn làm quá TTL, nhưng lệnh trả khóa bằng Lua trả 0 và không đụng vào khóa của B. Khóa của B sống tới lúc B tự trả.',
    '08-lock-lua.fencing.timeline': 'Khóa và fencing token được cấp trong cùng một script (lock-acquire-fenced.lua), nên token tăng đúng theo thứ tự giữ khóa: A nhận 1, B nhận 2. A còn tưởng giữ khóa rất lâu sau khi khóa hết hạn và ghi muộn; nơi ghi đã thấy token 2 nên trả STALE. Dữ liệu vẫn đúng dù khóa đã hết hạn giữa chừng. Nếu cấp token bằng một lệnh INCR riêng sau SET NX, thứ tự token có thể ngược thứ tự giữ khóa và fencing mất tác dụng.',
  };
  const TOKEN_CLASS = { tokA: '', tokB: ' ok', tokC: ' wait' };

  // Dựng các đoạn giữ khóa từ chuỗi sự kiện: SET … NX PX n trả OK (hoặc lock-acquire-fenced.lua trả số token) mở khóa;
  // khóa đóng khi bị DEL (integer 1),
  // tự trả bằng lock-release.lua (1), bị người sau thay (tức đã hết hạn), hoặc hết dữ liệu (hết hạn theo PX).
  const analyse = (events) => {
    const locks = [], rejects = [], pending = {};
    let cur = null;
    for (const e of events) {
      const ms = Number(e.ms), text = String(e.text ?? '');
      if (e.dir === 'send') {
        pending[e.who] = text;
        if (/^DEL |lock-release\.lua|fenced-write\.lua/.test(text)) {
          const mine = [...locks].reverse().find((l) => l.who === e.who);
          if (mine) mine.believeEnd = ms;
        }
        continue;
      }
      const sent = pending[e.who] ?? '';
      const set = sent.match(/^SET \S+ (\S+) NX PX (\d+)/) ?? sent.match(/lock-acquire-fenced\.lua \S+ \S+ , (\S+) (\d+)/);
      if (set) {
        const fence = /lock-acquire-fenced\.lua/.test(sent) && /^\d+$/.test(text) ? Number(text) : null;
        if (text === 'OK' || fence !== null) {
          if (cur && cur.end === null) { cur.end = Math.min(cur.start + cur.px, ms); cur.why = 'hết hạn theo PX, người sau mới vào được'; }
          cur = { who: e.who, tok: set[1], px: Number(set[2]), start: ms, end: null, why: '', believeEnd: null, fence };
          locks.push(cur);
        } else rejects.push({ ms, who: e.who, text });
      } else if (/^DEL /.test(sent) && text === '(integer) 1' && cur && cur.end === null) {
        cur.end = ms; cur.why = cur.who === e.who ? cur.who + ' tự trả bằng DEL' : 'bị ' + e.who + ' xóa bằng DEL';
      } else if (/lock-release\.lua/.test(sent)) {
        if (text === '1' && cur && cur.end === null) { cur.end = ms; cur.why = cur.who + ' tự trả bằng Lua'; } else if (text === '0') rejects.push({ ms, who: e.who, text });
      } else if (/fenced-write\.lua/.test(sent) && text.startsWith('STALE')) rejects.push({ ms, who: e.who, text });
    }
    if (cur && cur.end === null) { cur.end = cur.start + cur.px; cur.why = 'còn sống tới hết PX (ước lượng theo đồng hồ host)'; }
    return { locks, rejects };
  };

  // Nghĩa không chỉ nằm ở màu: mỗi thanh ghi tên token ngay trên thanh, vạch bị từ chối là dấu ✕.
  const seg = (from, to, max, cls, title, dashed, label) => {
    const s = el('span', { class: 'lane-seg' + cls + (dashed ? ' belief' : ''), title, text: label });
    s.style.left = (from / max * 100).toFixed(2) + '%';
    s.style.width = Math.max(0.6, (to - from) / max * 100).toFixed(2) + '%';
    return s;
  };
  const mark = (ms, max, title) => {
    const m = el('span', { class: 'lane-mark', title, text: '✕' });
    m.style.left = (ms / max * 100).toFixed(2) + '%';
    return m;
  };

  const show = (t) => {
    const ev = Array.isArray(t.events) ? t.events : [];
    const { locks, rejects } = analyse(ev);
    const max = Math.max(1, ...ev.map((e) => Number(e.ms)), ...locks.map((l) => Math.max(l.end, l.believeEnd ?? 0)));
    const rows = ['A', 'B'].map((who) => {
      const mine = locks.filter((l) => l.who === who);
      const real = el('div', { class: 'lane-track' }, ...mine.map((l) => seg(l.start, l.end, max, TOKEN_CLASS[l.tok] ?? '', l.tok + ': khóa thật', false, l.tok)),
        ...rejects.filter((r) => r.who === who).map((r) => mark(r.ms, max, who + ' nhận ' + r.text)));
      const belief = el('div', { class: 'lane-track' }, ...mine.filter((l) => l.believeEnd !== null).map((l) => seg(l.start, l.believeEnd, max, '', l.tok + ': ' + who + ' tưởng còn giữ', true, l.tok + ' (tưởng)')));
      return el('div', { class: 'lane' },
        el('span', { class: 'who', text: who }),
        el('div', { class: 'what' }, el('small', { class: 'muted', text: 'khóa thật trong Redis' }), real, el('small', { class: 'muted', text: 'tưởng mình còn giữ' }), belief),
        mine.length ? el('span', { class: 'pill ok', text: mine.map((l) => l.tok).join(', ') }) : el('span', { class: 'pill wait', text: 'không giữ khóa' }));
    });
    lanes.replaceChildren(...rows, el('div', { class: 'lane-axis' }, el('span', { text: '+0 ms' }), el('span', { text: '+' + Number(max) + ' ms' })));

    const kids = [el('p', { text: LESSON[t.run] ?? '' })];
    for (const l of locks) {
      kids.push(el('p', {}, el('code', { text: l.tok }), ' (' + l.who + (l.fence !== null && l.fence !== undefined ? ', fencing token ' + Number(l.fence) : '') + '): khóa thật +' + Number(l.start) + ' → +' + Number(l.end) + ' ms, ' + l.why
        + (l.believeEnd !== null ? '; ' + l.who + ' làm việc như vẫn giữ khóa tới lúc gửi lệnh +' + Number(l.believeEnd) + ' ms' : '') + '.'));
    }
    for (const r of rejects) kids.push(el('p', {}, el('span', { class: 'badx', text: '✕ ' + r.who + ' nhận ' + r.text }), ' lúc +' + Number(r.ms) + ' ms.'));
    kids.push(el('p', { class: 'muted', text: 'Mốc "hết hạn theo PX" = lúc nhận OK + PX, tính bằng đồng hồ host. Redis tính hết hạn bằng đồng hồ của nó, nên mốc thật có thể lệch (xem đoạn Redlock).' }));
    out.replaceChildren(...kids);

    const bad = new Set(rejects.map((r) => r.ms + r.who + r.text));
    tbody.replaceChildren(...ev.map((e) => {
      const no = e.dir === 'reply' && bad.has(Number(e.ms) + e.who + String(e.text));
      return el('tr', { class: no ? 'now' : null },
        el('td', { text: '+' + Number(e.ms) }), el('td', { text: String(e.who ?? '') }), el('td', {}, el('code', { text: (e.dir === 'send' ? '→ ' : '← ') + (no ? '✕ ' : '') + String(e.text ?? '') })));
    }));
  };

  const btns = D.timelines.map((t) => {
    const b = el('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', text: LABEL[t.run] ?? String(t.run) });
    b.addEventListener('click', () => { press(tabs, b); show(t); });
    return b;
  });
  tabs.replaceChildren(...btns);
  const first = D.timelines.findIndex((t) => t.run === '08-lock.ttldel.timeline');
  const i = first >= 0 ? first : 0;
  press(tabs, btns[i]);
  show(D.timelines[i]);
})();
