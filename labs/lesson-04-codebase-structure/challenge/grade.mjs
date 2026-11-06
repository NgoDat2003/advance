// Chấm khối TODO(Đạt). Chạy: npm run challenge
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { VoucherCampaign } = await import(pathToFileURL(join(here, process.argv[2])).href);

const NOW = 1000;
const LATER = 2000;
const fresh = (quantity = 2) => new VoucherCampaign('SALE', quantity, LATER);
const codeOf = (fn) => {
  try {
    fn();
    return 'OK';
  } catch (error) {
    return error.code ?? `khac: ${error.message}`;
  }
};

const cases = [
  ['C1 con han, con suat: claim duoc, remaining giam 1', () => {
    const c = fresh();
    const code = codeOf(() => c.claim(7, NOW));
    return code === 'OK' && c.remaining === 1;
  }],
  ['C2 het han: VOUCHER_EXPIRED, remaining giu nguyen', () => {
    const c = fresh();
    return codeOf(() => c.claim(7, LATER)) === 'VOUCHER_EXPIRED' && c.remaining === 2;
  }],
  ['C3 cung cua hang claim lan 2: ALREADY_CLAIMED, khong tru them', () => {
    const c = fresh();
    c.claim(7, NOW);
    return codeOf(() => c.claim(7, NOW)) === 'ALREADY_CLAIMED' && c.remaining === 1;
  }],
  ['C4 het suat: SOLD_OUT, remaining khong am', () => {
    const c = fresh(1);
    c.claim(7, NOW);
    return codeOf(() => c.claim(8, NOW)) === 'SOLD_OUT' && c.remaining === 0;
  }],
  ['C5 het han duoc kiem truoc het suat', () => {
    const c = fresh(0);
    return codeOf(() => c.claim(7, LATER)) === 'VOUCHER_EXPIRED';
  }],
  ['C6 khong the ghi de remaining tu ben ngoai', () => {
    const c = fresh();
    return codeOf(() => {
      c.remaining = 999;
    }) !== 'OK' && c.remaining === 2;
  }],
];

let failed = 0;
for (const [name, run] of cases) {
  let ok = false;
  try {
    ok = run();
  } catch {
    ok = false;
  }
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
console.log(`${cases.length - failed}/${cases.length} dat`);
process.exit(failed ? 1 : 0);
