// Tạo bản sao guide có gắn script kiểm thử, và harness iframe gom kết quả qua postMessage.
// Chạy: node .../guide-source/make-harness.mjs <thư-mục-tạm>, rồi mở t-harness.html bằng Chrome headless với --allow-file-access-from-files --dump-dom.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const wt = resolve(here, '../../..').replaceAll('\\', '/');
const out = process.argv[2] ?? here;
const src = readFileSync(join(wt, 'reports/advanced_backend/lesson_04_codebase_structure_teacher_guide.html'), 'utf8');
const base = 'file:///' + encodeURI(wt + '/reports/advanced_backend/');

const probe = `<script>
var __errs=[];window.addEventListener('error',e=>__errs.push(e.message||('res:'+(e.target&&e.target.src))),true);
var __p=new URLSearchParams(location.search);
if(__p.get('theme'))document.documentElement.dataset.theme=__p.get('theme');
</script>`;
const after = `<script>
addEventListener('load',()=>{
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const p=new URLSearchParams(location.search);
  $$('img').forEach(i=>i.loading='eager');
  setTimeout(()=>{
    const r={label:p.get('label'),w:innerWidth};
    r.errs=__errs.filter(e=>!/fonts\\.g/.test(e));
    r.scrollW=document.documentElement.scrollWidth;
    const wide=[];
    $$('main *').forEach(el=>{
      if(el.closest('.table-wrap,pre,svg'))return;
      const b=el.getBoundingClientRect();
      if(b.width&&b.right>innerWidth+1)wide.push(el.tagName+'.'+el.className+':'+Math.round(b.right));
    });
    r.wide=wide.slice(0,8);
    r.img=[$$('img').length,$$('img').filter(i=>!i.naturalWidth&&!i.closest('figure').hidden).length,$$('figure[hidden]').length];
    r.chips=$$('#slideMap .chip').length; r.exam=$$('#examList details').length;
    r.quiz=$$('.quiz .q').length;
    $$('.quiz').forEach((box,idx)=>{ $$('.q',box).forEach(q=>q.querySelector('.q-opt').click()); });
    r.quizExplain=$$('.q-explain').length; r.quizScore=document.querySelector('.quiz-score').textContent;
    r.sorters=$$('[data-sorter]').map(b=>{ const sel=$$('select',b); sel.forEach(s=>{s.selectedIndex=1;}); b.querySelector('.sorter-grade').click(); return sel.length+':'+b.querySelector('.sorter-out').textContent; });
    const cells=$$('#w1-table .cellbtn'); r.cells=[cells.length,cells.filter(c=>c.classList.contains('bad')).length];
    cells[cells.length-1].click(); r.w1=document.querySelector('#w1-out').textContent.slice(0,120);
    const w2=$$('#w2-btns button'); r.w2=w2.map(b=>{b.click();return document.querySelector('#w2-out p').textContent;});
    r.scrollWAfter=document.documentElement.scrollWidth;
    const small=$$('main button,main select,main a.chip').filter(e=>e.offsetParent&&e.getBoundingClientRect().height<43).length; r.smallTargets=small;
    if(p.get('reset'))$$('[data-sorter] .sorter-reset').forEach(b=>b.click());
    if(p.get('at')){const e=document.getElementById(p.get('at'));e&&e.scrollIntoView({behavior:'instant'});}
    parent.postMessage(r,'*');
  },1200);
});
</script>`;
const copy = src.replace('<head>', `<head><base href="${base}">${probe}`).replace('</body>', `${after}</body>`);
writeFileSync(join(out, 't-guide.html'), copy);

const frames = [[375, 'light'], [375, 'dark'], [768, 'light'], [1440, 'dark']];
writeFileSync(join(out, 't-harness.html'), `<!doctype html><meta charset="utf-8"><pre id="out"></pre>
${frames.map(([w, t]) => `<iframe style="width:${w}px;height:900px;border:0" src="t-guide.html?label=${w}-${t}&theme=${t}"></iframe>`).join('')}
<script>const o=[];addEventListener('message',e=>{o.push(e.data);document.getElementById('out').textContent=JSON.stringify(o,null,0);});</script>`);

// Trang chụp: một iframe, cuộn tới một mục
const shots = { 'p-w3': [375, 'dark', 'w3'], 'd-dip': [1100, 'dark', 'sl-15'], 'd-w1': [1100, 'light', 'w1'], 'p-w4': [375, 'light', 'w4'] };
for (const [name, [w, t, at]] of Object.entries(shots)) {
  writeFileSync(join(out, `s-${name}.html`), `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#888"><iframe style="width:${w}px;height:1400px;border:0;display:block" src="t-guide.html?label=x&theme=${t}&at=${at}&reset=1"></iframe>`);
}
