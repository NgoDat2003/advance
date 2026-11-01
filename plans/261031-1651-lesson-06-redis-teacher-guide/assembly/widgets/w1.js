// W1 · Một luồng, hai client: A chạy DEBUG SLEEP 2, PING của B phải chờ (run-w1 ← 01-block.sleep.timeline, ms theo đồng hồ host).
// Mọi chữ và số lấy từ run-w1 đi vào DOM qua el()/textContent. Ô "ca 0,5 s SLOWLOG" là đoạn tĩnh trong fragment, widget chỉ ẩn/hiện.
const tog = $('#w1-slowlog'), slow = $('#w1-slow');
if (tog && slow) {
  const sync = () => { slow.hidden = !tog.checked; };
  tog.addEventListener('change', sync);
  sync();
}
const D = run('w1'), lanes = $('#w1-lanes'), out = $('#w1-out'), play = $('#w1-play'), step = $('#w1-step');
const EV = D && Array.isArray(D.events)
  ? D.events.map((e) => ({ who: String(e?.who ?? ''), what: String(e?.what ?? ''), ms: Number(e?.ms) })).filter((e) => e.who && Number.isFinite(e.ms)).sort((a, b) => a.ms - b.ms)
  : [];
if (lanes && out && !EV.length) out.textContent = 'Chưa có dữ liệu run-w1 (01-block.sleep.timeline).';
if (lanes && out && EV.length) {
  const end = EV[EV.length - 1].ms;
  const span = end > 0 ? end * 1.08 : 1;
  const pct = (ms) => `${((Math.max(0, Math.min(ms, span)) / span) * 100).toFixed(2)}%`;
  const first = (who, word) => EV.find((e) => e.who === who && e.what.startsWith(word));
  const LABEL = { A: 'A chạy DEBUG SLEEP 2: luồng chính bận', B: 'B gửi PING rồi đứng chờ luồng rảnh' };
  const cursors = [];

  const lane = (who) => {
    const send = first(who, 'gửi'), recv = first(who, 'nhận');
    const track = el('div', { class: 'lane-track' });
    if (send && recv) {
      track.append(el('div', { class: who === 'A' ? 'lane-seg bad' : 'lane-seg wait', style: `left:${pct(send.ms)};width:${pct(recv.ms - send.ms)}` }));
    }
    EV.filter((e) => e.who === who).forEach((e) => track.append(el('div', { class: 'lane-mark', style: `left:${pct(e.ms)}`, title: `+${e.ms} ms · ${e.what}` })));
    const cur = el('div', { class: 'lane-mark', style: 'left:0;width:3px;background:var(--accent)', hidden: true });
    cursors.push(cur);
    track.append(cur);
    const pill = send && recv ? el('span', { class: who === 'A' ? 'pill bad' : 'pill wait', text: `${recv.ms - send.ms} ms` }) : null;
    return el('div', { class: 'lane' }, el('span', { class: 'who', text: who }), el('div', { class: 'what' }, el('div', { text: LABEL[who] || who }), track), pill);
  };
  const who = [...new Set(EV.map((e) => e.who))];
  lanes.replaceChildren(...who.map(lane), el('div', { class: 'lane-axis' }, el('span', { text: '0 ms' }), el('span', { text: `${end} ms (host, phụ thuộc máy)` })));

  const bSend = first('B', 'gửi'), bRecv = first('B', 'nhận'), aRecv = first('A', 'nhận');
  const summary = bSend && bRecv && aRecv
    ? `PING của B chờ ${bRecv.ms - bSend.ms} ms, và PONG về đúng lúc A nhận trả lời (+${aRecv.ms} ms). Server không chậm: nó chỉ có một luồng chạy lệnh.`
    : '';
  const show = (k, at) => {
    const seen = EV.slice(0, k);
    cursors.forEach((c) => { c.hidden = at === null; if (at !== null) c.style.left = pct(at); });
    const list = el('ol', {}, ...seen.map((e) => el('li', { text: `+${e.ms} ms · ${e.who} · ${e.what}` })));
    out.replaceChildren(seen.length ? list : el('p', { class: 'muted', text: 'Bấm "Phát lại" hoặc "Từng sự kiện".' }), k >= EV.length && summary ? el('p', { text: summary }) : '');
  };

  let raf = 0, k = 0;
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (play) play.addEventListener('click', () => {
    stop();
    if (reduce) { k = EV.length; show(k, end); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const t = now - t0; // 1 ms thật = 1 ms host đã ghi
      k = EV.filter((e) => e.ms <= t).length;
      show(k, Math.min(t, end));
      raf = t < end ? requestAnimationFrame(tick) : 0;
    };
    raf = requestAnimationFrame(tick);
  });
  if (step) step.addEventListener('click', () => {
    stop();
    k = k >= EV.length ? 1 : k + 1;
    show(k, EV[k - 1].ms);
  });
  show(0, null);
}
