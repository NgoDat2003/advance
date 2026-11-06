// Chấm bài tập Flight Booking: khung thư mục đủ chưa, và có đúng quy tắc phụ thuộc không.
// Chạy: npm run hw (chấm hw/mine), npm run hw:solution, npm run hw:draft
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { scan } from './check-dependency-rule.mjs';

const root = resolve(process.argv[2] ?? 'hw/mine');
if (!existsSync(root)) {
  console.log(`chua co ${process.argv[2]}: tao hw/mine/booking/{domain,application,infrastructure,presentation} roi chay lai`);
  process.exit(1);
}

const filesOf = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? filesOf(join(dir, e.name)) : [join(dir, e.name)],
      )
    : [];
const contents = (layer) => filesOf(join(root, 'booking', layer)).map((f) => readFileSync(f, 'utf8'));
const anyMatch = (layer, pattern) => contents(layer).some((source) => pattern.test(source));

const { violations } = scan(root);
const checks = [
  ['H1 du 4 tang', ['domain', 'application', 'infrastructure', 'presentation'].every((l) => contents(l).length > 0)],
  ['H2 Aggregate Booking o domain', anyMatch('domain', /export class Booking\b/)],
  ['H3 Booking khong co ham luu DB', !anyMatch('domain', /save(ToDb)?\s*\(\s*_?prisma/i)],
  ['H4 port repository la interface o domain', anyMatch('domain', /export interface \w*Repository\b/)],
  ['H5 adapter implements port o infrastructure', anyMatch('infrastructure', /implements \w*Repository\b/)],
  ['H6 use case o application', anyMatch('application', /export class \w*UseCase\b/)],
  ['H7 co DTO rieng o application', anyMatch('application', /Command|Result|Dto/)],
  ['H8 controller o presentation, khong tra Entity', anyMatch('presentation', /class \w*Controller\b/) && !anyMatch('presentation', /domain\/booking/)],
  [`H9 quy tac phu thuoc (${violations.length} vi pham)`, violations.length === 0],
];
let failed = 0;
for (const [name, ok] of checks) {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
for (const v of violations) console.log(`      ${v.at}  ${v.layer} -> ${v.target}  '${v.specifier}'`);
console.log(`${checks.length - failed}/${checks.length} dat`);
process.exit(failed ? 1 : 0);
