// Lab 8 (slide 8, 17): chi phí thật của việc chia tầng, đếm trên chính code của lab này.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Đếm dòng code: bỏ dòng trống và dòng chỉ có comment.
const loc = (path) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('//')).length;

const filesIn = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesIn(join(dir, entry.name)) : [join(dir, entry.name)],
  );

const spaghetti = filesIn('spaghetti');
console.log(`spaghetti: ${spaghetti.length} file, ${spaghetti.reduce((sum, f) => sum + loc(f), 0)} dong`);

// Bỏ adapter cố ý sai và adapter file vì chúng chỉ phục vụ thí nghiệm; so sánh công bằng là 1 adapter.
const clean = filesIn('src').filter((f) => !/racy|json-file/.test(f));
console.log(`4 tang: ${clean.length} file, ${clean.reduce((sum, f) => sum + loc(f), 0)} dong (1 adapter)`);
for (const layer of ['domain', 'application', 'infrastructure', 'presentation']) {
  const inLayer = clean.filter((f) => f.split(/[\\/]/).includes(layer));
  console.log(`  ${layer.padEnd(15)} ${inLayer.length} file, ${inLayer.reduce((sum, f) => sum + loc(f), 0)} dong`);
}
