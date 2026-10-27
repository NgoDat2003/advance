// W8 · Ba thiết kế đa hình, một lần xóa (run-w8 ← 08-polymorphic typeid / arc / join)
{
  const D = run('w8');
  const el = $('#w8');
  if (D && el && Array.isArray(D.designs) && D.designs.length) {
    const tabs = $('#w8-tabs', el), del = $('#w8-del', el), out = $('#w8-out', el);
    // Cơ chế khi xóa bài viết #1, theo SQL của từng region
    const AFTER = {
      typeid: 'DB không biết bình luận nào trỏ tới bài 1, nên chúng ở lại. Con số này gồm cả các dòng ghi sai ở trên.',
      arc: 'ON DELETE CASCADE trên post_id xóa bình luận của bài 1 theo.',
      join: 'ON DELETE CASCADE trên poly_post_comments xóa bình luận của bài 1 theo.',
    };
    let cur = D.designs[0], deleted = false;
    const show = () => {
      const d = cur;
      let h = `<p><b>${esc(d.name)}</b> · FK: ${esc(d.fk)}</p>`;
      // Mã lỗi đã nằm trong câu "bad" thì tô ngay tại chỗ, chưa có thì gắn thêm ở cuối
      const pill = d.code ? `<span class="pill bad">${esc(d.code)}</span>` : '';
      const bad = esc(d.bad);
      h += `<p>Ghi sai: ${pill && bad.includes(esc(d.code)) ? bad.replace(esc(d.code), pill) : `${bad} ${pill}`}</p>`;
      h += deleted
        ? `<p>Sau khi xóa post #1, bình luận mồ côi = <span class="${d.orphans > 0 ? 'badx' : 'good'}">${esc(d.orphans)}</span>. ${esc(AFTER[d.key] || '')}</p>`
        : '<p class="muted">Bấm "Xóa post #1" để xem số mồ côi đã đo.</p>';
      out.innerHTML = h;
    };
    tabs.innerHTML = D.designs.map((d, i) => `<button type="button" class="btn" aria-pressed="false" data-i="${i}">${i + 1} · ${esc(d.name)}</button>`).join('');
    $$('button', tabs).forEach((b) => b.addEventListener('click', () => { press(tabs, b); cur = D.designs[+b.dataset.i]; show(); }));
    del.addEventListener('click', () => {
      deleted = !deleted;
      del.setAttribute('aria-pressed', String(deleted));
      del.textContent = deleted ? 'Trả lại post #1' : 'Xóa post #1';
      show();
    });
    press(tabs, $('button', tabs));
    show();
  }
}
