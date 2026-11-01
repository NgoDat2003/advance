// W4 · Chọn chính sách eviction, xem khóa hot / cold / ttl còn sống và lệnh ghi có bị từ chối không (run-w4 ← 03-eviction.*).
// Mọi số lấy từ run-w4 qua textContent; phần trăm tính bằng Number(...).toFixed().
const D = run('w4'), pol = $('#w4-pol'), out = $('#w4-out');
const P = D && Array.isArray(D.policies) ? D.policies.filter((p) => p && typeof p.policy === 'string') : [];
if (out && !P.length) out.textContent = 'Chưa có dữ liệu run-w4 (03-eviction.*).';
if (pol && out && P.length) {
  const NOTE = {
    noeviction: 'Không bỏ khóa nào. Hết chỗ thì lệnh ghi bị từ chối (OOM), lệnh đọc vẫn chạy.',
    'allkeys-lru': 'Bỏ khóa lâu chưa được chạm. Khóa ghi tràn là khóa mới chạm nhất, nên cả hot (đọc lần cuối từ trước) cũng bị bỏ nhiều.',
    'allkeys-lfu': 'Bỏ khóa ít được dùng. Hot được đọc 10 vòng nên có bộ đếm tần suất cao và ở lại.',
    'volatile-ttl': 'Chỉ bỏ khóa có TTL, TTL ngắn trước. Hết khóa có TTL thì quay về từ chối ghi (OOM).',
    'allkeys-random': 'Bỏ ngẫu nhiên, không phân biệt hot hay cold.'
  };
  const OPTIONAL = new Set(['volatile-ttl', 'allkeys-random']);
  const bar = (label, alive, total) => {
    const a = Number(alive), t = Number(total);
    const pct = t > 0 ? (a / t) * 100 : 0;
    return el('div', { class: 'bar' },
      el('span', { text: label }),
      el('div', { class: 'bar-track' }, el('div', { class: pct >= 100 ? 'bar-fill' : 'bar-fill neg', style: `left:0;width:${pct.toFixed(1)}%` })),
      el('span', { class: 'bar-val', text: `${pct.toFixed(0)}%` }));
  };
  const show = (name) => {
    const p = P.find((x) => x.policy === name);
    if (!p) return;
    press(pol, $$('button', pol).find((b) => b.dataset.k === name));
    const rows = [bar('hot', p.hot, p.hot_total), bar('cold', p.cold, p.cold_total)];
    const counts = [`hot ${Number(p.hot)}/${Number(p.hot_total)}`, `cold ${Number(p.cold)}/${Number(p.cold_total)}`];
    if (p.ttl_total !== undefined) { rows.push(bar('ttl', p.ttl, p.ttl_total)); counts.push(`ttl ${Number(p.ttl)}/${Number(p.ttl_total)}`); }
    out.replaceChildren(
      el('p', {}, el('b', { text: p.policy }), OPTIONAL.has(p.policy) ? el('span', { class: 'muted', text: ' · tùy chọn' }) : ''),
      el('p', { text: NOTE[p.policy] || '' }),
      el('div', { class: 'bars' }, ...rows),
      el('p', { text: `Còn sống: ${counts.join(' · ')}. evicted_keys: ${Number(p.evicted_keys)}.` }),
      el('p', {}, el('span', { class: p.oom ? 'pill bad' : 'pill ok', text: p.oom ? 'ghi tràn: bị từ chối (OOM)' : 'ghi tràn: được nhận' }),
        ` Sau đợt hot + cold, evicted_keys vẫn là ${Number(p.evicted_after_fill)}: đầy là do đợt ghi tràn.`),
      el('p', { class: 'muted', text: `BASE=${Number(p.BASE)} MAX=${Number(p.MAX)} (byte, MAX = bộ nhớ lúc đầu + 2 MB). Nguồn: 03-eviction.${p.policy}.` })
    );
  };
  pol.replaceChildren(...P.map((p) => el('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', 'data-k': p.policy, text: p.policy })));
  $$('button', pol).forEach((b) => b.addEventListener('click', () => show(b.dataset.k)));
  show(P[0].policy);
}
