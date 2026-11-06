// Lab 3 (slide 11, 13, 16): quy tắc phụ thuộc là thứ máy kiểm được, không phải lời hứa.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { importsOf, scan } from './check-dependency-rule.mjs';

const report = (title, root) => {
  const { files, violations } = scan(root);
  console.log(`\n== ${title}: ${files} file, ${violations.length} vi pham`);
  for (const v of violations) console.log(`  ${v.at}  ${v.layer} -> ${v.target}  '${v.specifier}'`);
};

report('src (ban 4 tang)', 'src');
report('bad-src (ban AI viet)', 'bad-src');

// Hub chưa chia tầng, nên soi trực tiếp file đang chứa nghiệp vụ, coi nó như tầng application.
function findHub() {
  if (process.env.HUB_DIR) return process.env.HUB_DIR;
  for (let dir = resolve('.'); dirname(dir) !== dir; dir = dirname(dir)) {
    if (existsSync(join(dir, 'omnipos-finledger-hub', 'apps', 'api'))) return join(dir, 'omnipos-finledger-hub');
  }
  return null;
}

const hub = findHub();
if (!hub) {
  console.log('\n== Hub: khong tim thay, bo qua (dat HUB_DIR neu Hub nam cho khac)');
} else {
  const rel = 'apps/api/src/modules/wallets/wallets.service.ts';
  const source = readFileSync(join(hub, rel), 'utf8');
  const commit = execFileSync('git', ['-C', hub, 'rev-parse', '--short', 'HEAD']).toString().trim();
  console.log(`\n== Hub @${commit} ${rel}`);
  const leaks = importsOf(source).filter((i) => !i.specifier.startsWith('.') || /prisma|config|database/.test(i.specifier));
  for (const i of leaks) console.log(`  dong ${i.line}: '${i.specifier}'`);
  const count = (pattern) => (source.match(pattern) ?? []).length;
  console.log(`  import ha tang/framework: ${leaks.length}`);
  console.log(`  this.prisma: ${count(/this\.prisma\b/g)}  tx.: ${count(/\btx\.\$?\w+/g)}  HTTP exception: ${count(/new (NotFound|Conflict)Exception/g)}`);
}
