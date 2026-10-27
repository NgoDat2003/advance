// Sau khi ghi lại toàn bộ run: khôi phục bản ghi cũ cho những region mà SQL không đổi
// (mọi dòng của region vẫn được echo nguyên văn, đúng thứ tự trong bản cũ). Region đã sửa giữ bản ghi mới.
// Dùng: node verify/restore-unchanged-runs.mjs <thư-mục-bản-cũ>
import { readFileSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS = resolve(HERE, '../runs');
const LABS = resolve(HERE, '../../../labs/lesson-07-data-modeling');
const OLD = resolve(process.argv[2]);
const read = (f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

function region(file, id) {
  if (!existsSync(file)) return null;
  const lines = read(file).split('\n');
  if (!id) return lines;
  const a = lines.findIndex((l) => l.startsWith(`-- #region ${id} `));
  if (a < 0) return null;
  const b = lines.findIndex((l, i) => i > a && l.startsWith('-- #endregion'));
  return lines.slice(a, b + 1);
}
function echoedInOrder(runText, sqlLines) {
  const run = runText.split('\n').map((l) => l.trimEnd());
  let pos = 0;
  for (const l of sqlLines.map((x) => x.trimEnd()).filter(Boolean)) {
    const k = run.indexOf(l, pos);
    if (k < 0) return false;
    pos = k + 1;
  }
  return true;
}
// Tên run → (file .sql, region). Ví dụ 05-data-types.money → 05-data-types.sql#money; 03-fk-race.nofk.A → 03-fk-race.A.sql#nofk
function source(stem) {
  let m = stem.match(/^(\d\d-[a-z-]+race|04-index-online)\.([a-z-]+)\.(A|B)$/);
  if (m) return [[`${m[1]}.${m[3]}.sql`, m[2]]];
  m = stem.match(/^(\d\d-[a-z-]+race|04-index-online)\.([a-z-]+)\.timeline$/);
  if (m) return [[`${m[1]}.A.sql`, m[2]], [`${m[1]}.B.sql`, m[2]]];
  m = stem.match(/^(\d\d-[a-z-]+)\.([a-z-]+)$/);
  if (m && existsSync(join(LABS, m[1] + '.sql'))) return [[m[1] + '.sql', m[2]]];
  if (existsSync(join(LABS, stem + '.sql'))) return [[stem + '.sql', null]];
  return null;
}
let kept = 0, restored = 0;
for (const f of readdirSync(OLD).filter((x) => x.endsWith('.txt'))) {
  const stem = f.replace(/\.txt$/, '');
  const src = source(stem);
  if (!src || stem.includes('.try') || stem.startsWith('09-ledger-race')) { kept++; continue; }
  const old = read(join(OLD, f));
  const ok = src.every(([file, id]) => { const r = region(join(LABS, file), id); return r && echoedInOrder(old, r); });
  if (ok) { copyFileSync(join(OLD, f), join(RUNS, f)); restored++; console.log('khôi phục ' + f); }
  else { kept++; console.log('giữ bản mới ' + f); }
}
console.log(`khôi phục ${restored}, giữ bản mới ${kept}`);
