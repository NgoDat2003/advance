// W6 · Máy tính hash slot: CRC16-XMODEM(khóa) mod 16384, có luật hashtag (run-w6 ← 07-cluster.keyslot)
// Mọi chữ lấy từ khóa người dùng gõ hoặc từ run đi vào DOM qua el()/textContent, không qua innerHTML.
(() => {
  const box = $('#w6');
  if (!box) return;
  const key = $('#w6-key', box), out = $('#w6-slot', box), hashed = $('#w6-hashed', box);
  const key2 = $('#w6-key2', box), out2 = $('#w6-slot2', box), hashed2 = $('#w6-hashed2', box);
  const verdict = $('#w6-verdict', box), list = $('#w6-pairs', box), check = $('#w6-check', box);
  if (!key || !out) return;

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  // CRC16-XMODEM: đa thức 0x1021, giá trị đầu 0, không đảo bit (giống crc16() trong src/crc16.c của Redis).
  const crc16 = (bytes) => {
    let c = 0;
    for (const b of bytes) {
      c ^= b << 8;
      for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
    }
    return c;
  };
  // Luật keyHashSlot của Redis: có '{', sau nó có '}' và giữa hai dấu không rỗng → chỉ băm phần giữa; còn lại băm cả khóa.
  const slotOf = (k) => {
    const b = enc.encode(k);
    let s = 0, e = b.length;
    const open = b.indexOf(123);
    if (open >= 0) {
      const close = b.indexOf(125, open + 1);
      if (close > open + 1) { s = open + 1; e = close; }
    }
    return { slot: crc16(b.subarray(s, e)) % 16384, bytes: b, s, e, tagged: s > 0 };
  };

  const showHashed = (target, r) => {
    if (!target) return;
    const pre = dec.decode(r.bytes.subarray(0, r.s)), mid = dec.decode(r.bytes.subarray(r.s, r.e)), post = dec.decode(r.bytes.subarray(r.e));
    target.replaceChildren(
      r.tagged ? 'Hashtag → chỉ băm ' : 'Không có hashtag hợp lệ → băm cả khóa ',
      el('mark', { text: mid || '(chuỗi rỗng)' }),
      r.tagged ? el('span', { text: ` trong ${pre}${mid}${post}` }) : null
    );
  };

  const update = () => {
    const a = slotOf(key.value);
    out.textContent = String(a.slot);
    showHashed(hashed, a);
    if (!key2 || !out2 || !verdict) return;
    const b = slotOf(key2.value);
    out2.textContent = String(b.slot);
    showHashed(hashed2, b);
    verdict.replaceChildren(a.slot === b.slot
      ? el('p', {}, el('span', { class: 'good', text: 'Cùng slot ' + a.slot + '.' }), ' MSET/MGET/SINTER trên hai khóa này chạy được trong cluster.')
      : el('p', {}, el('span', { class: 'badx', text: 'Khác slot (' + a.slot + ' và ' + b.slot + ').' }), ' Lệnh nhiều khóa sẽ trả CROSSSLOT, kể cả khi cluster chỉ có một node.'));
  };
  key.addEventListener('input', update);
  key2?.addEventListener('input', update);
  update();

  // So với CLUSTER KEYSLOT đã ghi: mỗi khóa một nút, kèm ✔ khi số JS bằng số Redis.
  const D = run('w6');
  if (!D || !Array.isArray(D.pairs) || !list) return;
  let ok = 0;
  const btns = D.pairs.filter((p) => p && typeof p.key === 'string').map((p) => {
    const mine = slotOf(p.key).slot, want = Number(p.slot);
    const same = mine === want;
    if (same) ok++;
    const btn = el('button', { type: 'button', class: 'btn' + (same ? ' right' : ' wrong') },
      el('code', { text: p.key }), ' · KEYSLOT ' + want + ' · JS ' + mine + (same ? ' ✔' : ' ✘'));
    btn.addEventListener('click', () => { key.value = p.key; update(); key.focus(); });
    return btn;
  });
  list.replaceChildren(...btns);
  if (check) check.replaceChildren(el('p', {}, el('span', { class: ok === btns.length ? 'good' : 'badx', text: ok + '/' + btns.length }), ' khóa: số JS khớp CLUSTER KEYSLOT đã chạy trên máy bạn.'));
})();
