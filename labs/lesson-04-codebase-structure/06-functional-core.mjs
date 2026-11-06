// Lab 6 (slide 18, 19): lõi thuần cho cùng đầu vào luôn ra cùng đầu ra, I/O đẩy ra rìa.
import { randomUUID } from 'node:crypto';

// Lõi thuần: nhận dữ liệu, trả quyết định. Không đọc đồng hồ, không sinh id, không gọi DB.
function decideTransfer(fromBalance, toBalance, amount) {
  if (fromBalance < amount) return { ok: false, reason: 'INSUFFICIENT_FUNDS' };
  return { ok: true, nextFrom: fromBalance - amount, nextTo: toBalance + amount };
}

// Bản lẫn tác dụng phụ: id và thời gian sinh ngay trong hàm.
function decideTransferImpure(fromBalance, toBalance, amount) {
  if (fromBalance < amount) return { ok: false, reason: 'INSUFFICIENT_FUNDS' };
  return { ok: true, id: randomUUID(), at: Date.now(), nextFrom: fromBalance - amount, nextTo: toBalance + amount };
}

const show = (value) => JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? `${v}n` : v));

const distinctOutputs = (fn, runs) => {
  const seen = new Set();
  for (let i = 0; i < runs; i += 1) seen.add(show(fn(1000n, 0n, 100n)));
  return seen.size;
};
console.log(`100000 lan cung dau vao: lo pure ra ${distinctOutputs(decideTransfer, 100000)} ket qua khac nhau; ban impure ra ${distinctOutputs(decideTransferImpure, 100000)}`);

// Kiểm bất biến trên toàn bộ tổ hợp nhỏ, không cần mock: tiền không tự sinh, không âm.
let checked = 0;
let broken = 0;
for (let from = 0n; from <= 300n; from += 1n) {
  for (let amount = 0n; amount <= 300n; amount += 1n) {
    const decision = decideTransfer(from, 50n, amount);
    checked += 1;
    if (decision.ok && (decision.nextFrom < 0n || decision.nextFrom + decision.nextTo !== from + 50n)) broken += 1;
    if (!decision.ok && from >= amount) broken += 1;
  }
}
console.log(`kiem bat bien tren ${checked} to hop: ${broken} to hop sai`);

// Vỏ: I/O nằm ở 2 đầu, quyết định nằm giữa. Ở đây db chỉ là object, thay bằng Prisma cũng cùng hình dạng này.
const db = { 1: 1000n, 2: 0n };
const log = [];
async function transferShell(fromId, toId, amount) {
  log.push('I/O doc');
  const decision = decideTransfer(db[fromId], db[toId], amount); // lõi thuần
  log.push('quyet dinh');
  if (!decision.ok) return decision.reason;
  db[fromId] = decision.nextFrom;
  db[toId] = decision.nextTo;
  log.push('I/O ghi');
  return 'OK';
}
console.log(`vo goi loi: ${await transferShell(1, 2, 100n)}; thu tu: ${log.join(' -> ')}`);
