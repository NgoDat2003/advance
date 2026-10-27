// Chép lại nội dung mọi <pre data-sql="file#region"> trong assembly/fragments/*.html từ labs/ (nguồn sự thật là file .sql).
// Dùng: node verify/sync-sql-blocks.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FRAG = resolve(HERE, '../assembly/fragments');
const LABS = resolve(HERE, '../../../labs/lesson-07-data-modeling');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function region(ref) {
  const [file, id] = ref.split('#');
  const lines = readFileSync(join(LABS, /\.(sql|prisma)$/.test(file) ? file : file + '.sql'), 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  if (!id) return lines.join('\n');
  const a = lines.findIndex((l) => l.startsWith(`-- #region ${id} `));
  if (a < 0) throw new Error('không có region ' + ref);
  const b = lines.findIndex((l, i) => i > a && l.startsWith('-- #endregion'));
  return lines.slice(a, b + 1).join('\n');
}
let changed = 0;
for (const f of readdirSync(FRAG).filter((x) => x.endsWith('.html'))) {
  const p = join(FRAG, f);
  const before = readFileSync(p, 'utf8');
  const after = before.replace(/(<pre data-sql="([^"]+)"><code>)[\s\S]*?(<\/code><\/pre>)/g, (_, open, ref, close) => open + esc(region(ref)) + close);
  if (after !== before) { writeFileSync(p, after); changed++; console.log('đồng bộ ' + f); }
}
console.log(`${changed} fragment được cập nhật`);
