// Kiểm tra guide Bài 04 không cần trình duyệt: slide đủ, số liệu truy được về runs/, link nội bộ sống.
// Chạy từ gốc repo: node plans/261106-1400-lesson-04-codebase-structure-teacher-guide/verify-guide.mjs
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const plan = dirname(fileURLToPath(import.meta.url));
const guide = resolve(plan, '../../reports/advanced_backend/lesson_04_codebase_structure_teacher_guide.html');
const html = readFileSync(guide, 'utf8');
const runText = (id) => readFileSync(join(plan, 'runs', `${id}.txt`), 'utf8');
const unescapeHtml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

// Nạp phần dữ liệu trong script để kiểm slide và quiz.
const data = html.match(/\/\* === GUIDE_DATA_START === \*\/([\s\S]*?)\/\* === GUIDE_DATA_END === \*\//)[1];
const sandbox = {};
vm.runInNewContext(data, sandbox);
const { SLIDES, QUIZ, EXAM, SORTERS } = sandbox;

const numbers = SLIDES.map((s) => s.n);
check('33 slide, mỗi slide đúng một lần', numbers.length === 33 && numbers.every((n, i) => n === i + 1));
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const deadSlides = SLIDES.filter((s) => !ids.has(s.href.slice(1)));
check('href của slide trỏ tới id có thật', deadSlides.length === 0, deadSlides.map((s) => s.n).join(','));
const deadLinks = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter((id) => !ids.has(id));
check('link nội bộ không chết', deadLinks.length === 0, deadLinks.join(','));

const quizzes = Object.values(QUIZ);
check('7 chặng, mỗi chặng 4 câu quiz', quizzes.length === 7 && quizzes.every((q) => q.length === 4));
const badAns = quizzes.flat().filter((q) => q.ans < 0 || q.ans >= q.opts.length || !q.why);
check('đáp án quiz hợp lệ, có giải thích', badAns.length === 0);
check('8 câu phỏng vấn', EXAM.length === 8);
const badSort = Object.values(SORTERS).flatMap((s) => s.items).filter((it) => !it.why);
const wrongOption = Object.values(SORTERS).flatMap((s) => s.items.filter((it) => !s.options.includes(it.a)));
check('đáp án bộ xếp loại nằm trong danh sách lựa chọn', badSort.length === 0 && wrongOption.length === 0);

// Mỗi con số gắn data-run phải xuất hiện nguyên văn trong file run tương ứng.
const tagged = [...html.matchAll(/<b class="m" data-run="([^"]+)">([^<]+)<\/b>/g)];
const untraced = tagged.filter((m) => !runText(m[1]).includes(unescapeHtml(m[2])));
check(`${tagged.length} số trong văn bản truy được về runs/`, tagged.length > 10 && untraced.length === 0, untraced.map((m) => `${m[1]}:${m[2]}`).join(' | '));

// Khối output phải trùng nguyên văn file run.
const blocks = [...html.matchAll(/<pre class="code terminal" data-run="([^"]+)">([\s\S]*?)<\/pre>/g)];
const drifted = blocks.filter((m) => unescapeHtml(m[2]).trim() !== runText(m[1]).trim());
check(`${blocks.length} khối output khớp runs/`, blocks.length >= 8 && drifted.length === 0, drifted.map((m) => m[1]).join(','));
check('không còn placeholder chưa thay', !/\{\{RUN:/.test(html));

// Ảnh tương đối phải tồn tại.
const imgs = [...html.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]);
const repoRoot = resolve(plan, '../..');
const missing = imgs.filter((src) => !existsSync(resolve(dirname(guide), src)));
check(`${imgs.length} ảnh slide tồn tại`, imgs.length > 0 && missing.length === 0, missing.join(','));

// File được guide nhắc tới phải có trong lab.
const labFiles = ['spaghetti/transfer-handler.ts', 'check-dependency-rule.mjs', 'challenge/voucher-campaign.todo.ts', 'src/wallets/domain/wallet-repository.ts', 'src/wallets/application/transfer-funds.ts', 'hw/ai-draft/booking', 'hw/solution'];
const lab = join(repoRoot, 'labs/lesson-04-codebase-structure');
const missingLab = labFiles.filter((f) => !existsSync(join(lab, f)));
check('file lab được nhắc tới đều tồn tại', missingLab.length === 0, missingLab.join(','));

const noExternalScript = !/<script[^>]+src=/.test(html);
check('không có script ngoài', noExternalScript);
check('kích thước dưới 300 KB', statSync(guide).size < 300 * 1024, `${statSync(guide).size} byte`);

let failed = 0;
for (const r of results) {
  if (!r.ok) failed += 1;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
}
process.exit(failed ? 1 : 0);
