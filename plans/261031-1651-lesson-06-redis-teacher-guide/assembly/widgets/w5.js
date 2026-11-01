// W5 · Cửa sổ mất dữ liệu (run-w5 = runs/data/w5.json, nguồn 04-persistence.rdb-loss và 04-persistence.aof-loss).
// Mỗi làn là một chế độ bền vững. Bấm "kill -9 ở đây" để xem số khóa còn lại sau docker kill + docker start đã ghi.
// Ô "mất điện" chỉ đổi lời giải thích: máy này không đo kịch bản mất điện, nên widget không vẽ số cho nó.
// Mọi chuỗi lấy từ dữ liệu đi vào DOM qua el() (textContent), không dùng innerHTML.
(() => {
  const D = run('w5');
  const lanes = $('#w5-lanes');
  const kill = $('#w5-kill');
  const again = $('#w5-again');
  const power = $('#w5-power');
  const out = $('#w5-out');
  if (!D || !Array.isArray(D.modes) || !lanes || !kill || !again || !power || !out) return;

  const modes = D.modes.filter((m) => m && Number.isFinite(Number(m.written)) && Number.isFinite(Number(m.after_restart)) && Number(m.written) > 0);
  if (!modes.length) return;
  const max = Math.max(...modes.map((m) => Number(m.written)));
  const pct = (n) => (100 * Number(n) / max).toFixed(2) + '%';
  const isAof = (m) => /AOF/.test(String(m.mode));
  const hasSnap = (m) => Number.isFinite(Number(m.snapshot)) && m.snapshot !== undefined && m.snapshot !== null;

  const seg = (cls, from, to, title) => {
    const s = el('span', { class: ('lane-seg ' + cls).trim(), title });
    s.style.left = pct(from);
    s.style.width = pct(Math.max(0, to - from));
    return s;
  };
  const mark = (at, title) => {
    const m = el('span', { class: 'lane-mark', title });
    m.style.left = pct(at);
    return m;
  };

  let killed = false;

  const draw = () => {
    const rows = modes.map((m) => {
      const w = Number(m.written);
      const a = Number(m.after_restart);
      const lost = Math.max(0, w - a);
      const track = el('div', { class: 'lane-track' });
      if (!killed) track.append(seg('', 0, w, 'đã ghi'));
      else {
        track.append(seg('ok', 0, a, 'còn sau khởi động lại'));
        if (lost > 0) track.append(seg('bad', a, w, 'mất'));
      }
      if (hasSnap(m)) track.append(mark(Number(m.snapshot), 'BGSAVE: snapshot ghi xuống đĩa ở đây'));
      // Vạch fsync chỉ là minh họa "mỗi giây một lần", không theo tỉ lệ thời gian thật.
      if (isAof(m)) [0.2, 0.4, 0.6, 0.8].forEach((f) => track.append(mark(w * f, 'fsync (everysec, minh họa)')));
      const axis = el('div', { class: 'lane-axis' },
        el('span', {}, '0'),
        hasSnap(m) ? el('span', {}, 'snapshot ở khóa thứ ' + Number(m.snapshot)) : el('span', {}, isAof(m) ? 'vạch = fsync mỗi giây (minh họa)' : ''),
        el('span', {}, String(w)));
      let pill;
      if (!killed) pill = el('span', { class: 'pill wait' }, 'đang ghi');
      else if (power.checked && isAof(m)) pill = el('span', { class: 'pill wait' }, 'chưa đo');
      else pill = el('span', { class: 'pill ' + (lost > 0 ? 'bad' : 'ok') }, lost > 0 ? 'mất ' + lost : 'mất 0');
      return el('div', { class: 'lane' },
        el('span', { class: 'who' }, isAof(m) ? 'A' : 'R'),
        el('div', { class: 'what' }, el('div', {}, String(m.mode)), track, axis),
        pill);
    });
    lanes.replaceChildren(...rows);

    if (!killed) {
      out.replaceChildren(el('p', {}, 'Hai container đã ghi xong. Bấm "kill -9 ở đây" để giết tiến trình Redis (docker kill gửi SIGKILL, giống kill -9) rồi khởi động lại.'));
      return;
    }
    const lines = modes.map((m) => {
      const w = Number(m.written);
      const a = Number(m.after_restart);
      const lost = Math.max(0, w - a);
      if (isAof(m) && power.checked) {
        return el('p', {}, el('b', {}, String(m.mode) + ': '),
          'mất điện hoặc hệ điều hành sập thì phần chưa fsync xuống đĩa có thể mất. Với everysec đó là phần ghi sau lần fsync cuối. Máy này chưa đo kịch bản này (không rút điện máy ảo Docker), nên widget không đưa số.');
      }
      if (isAof(m)) {
        return el('p', {}, el('b', {}, String(m.mode) + ': '),
          'ghi ' + w + ', sau khởi động còn ' + a + ', mất ' + lost + '. Tiến trình chết nhưng nhân hệ điều hành vẫn giữ page cache của file AOF và tự ghi nó xuống đĩa.');
      }
      return el('p', {}, el('b', {}, String(m.mode) + ': '),
        'ghi ' + w + (hasSnap(m) ? ', snapshot lúc ' + Number(m.snapshot) : '') + ', sau khởi động còn ' + a + ', mất ' + lost + ' khóa ghi sau lần BGSAVE cuối.' + (power.checked ? ' Mất điện cũng mất đúng phần đó: RDB chỉ có snapshot.' : ''));
    });
    out.replaceChildren(...lines);
  };

  kill.addEventListener('click', () => { killed = true; draw(); });
  again.addEventListener('click', () => { killed = false; draw(); });
  power.addEventListener('change', draw);
  draw();
})();
