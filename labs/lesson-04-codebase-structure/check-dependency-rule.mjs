// Máy quét quy tắc phụ thuộc: đọc import của từng file rồi đối chiếu bảng ALLOWED. Không cần thư viện.
// Chạy: node check-dependency-rule.mjs <thư-mục>     (có vi phạm thì thoát mã 1)
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LAYERS = ['domain', 'application', 'infrastructure', 'presentation'];
// Mỗi tầng được phép import những tầng nào. "bare" là gói ngoài, gồm cả node:crypto, @nestjs/*, @prisma/*.
// Clean cho phép presentation import domain; bảng này chặt hơn để ép controller đi qua DTO, chỉ chừa domain/errors.
const ALLOWED = {
  domain: { layers: ['domain'], bare: false },
  application: { layers: ['domain', 'application'], bare: false },
  infrastructure: { layers: ['domain', 'application', 'infrastructure'], bare: true },
  presentation: { layers: ['application', 'presentation'], bare: true },
};

export const layerOf = (path) => path.split(/[\\/]/).find((part) => LAYERS.includes(part));

export function importsOf(source) {
  // Xóa comment nhưng giữ số dòng, để comment nhắc tới Prisma không bị tính là vi phạm.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/.*$/gm, '$1');
  const found = [];
  const pattern = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;
  for (const match of code.matchAll(pattern)) {
    found.push({ specifier: match[1], line: code.slice(0, match.index).split('\n').length });
  }
  return found;
}

export function scan(root) {
  const violations = [];
  let files = 0;
  const check = (path) => {
    const layer = layerOf(relative(root, path));
    if (!layer) return;
    files += 1;
    for (const { specifier, line } of importsOf(readFileSync(path, 'utf8'))) {
      const isRelative = specifier.startsWith('.');
      const target = isRelative ? layerOf(relative(root, resolve(dirname(path), specifier))) : 'goi-ngoai';
      // Import tương đối ra thư mục không thuộc tầng nào (prisma/, config/, common/) cũng là đi ra ngoài.
      const errorsOnly = layer === 'presentation' && /\/domain\/errors(\.ts)?$/.test(specifier);
      const rule = ALLOWED[layer];
      const ok = errorsOnly || (isRelative && target ? rule.layers.includes(target) : rule.bare);
      if (!ok) {
        const at = `${relative(root, path).split(sep).join('/')}:${line}`;
        violations.push({ at, layer, target: target ?? 'ngoai-tang', specifier });
      }
    }
  };
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.[cm]?[tj]s$/.test(entry.name)) check(path);
    }
  };
  walk(root);
  return { files, violations };
}

// Chạy trực tiếp từ dòng lệnh; khi được file khác import thì bỏ qua đoạn này.
if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), 'src'));
  const { files, violations } = scan(root);
  for (const v of violations) console.log(`  ✘ ${v.at}  ${v.layer} -> ${v.target}  '${v.specifier}'`);
  console.log(`da quet ${files} file, ${violations.length} vi pham`);
  process.exit(violations.length ? 1 : 0);
}
