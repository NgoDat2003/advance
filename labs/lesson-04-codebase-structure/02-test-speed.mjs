// Lab 2 (slide 17, 19): cùng một quy tắc "thiếu tiền thì từ chối", kiểm ở 3 mức khác nhau tốn bao nhiêu thời gian.
import { createServer } from 'node:http';
import { InMemoryWalletRepository } from './src/wallets/infrastructure/in-memory-wallet-repository.ts';
import { TransferFunds } from './src/wallets/application/transfer-funds.ts';
import { handleTransfer } from './src/wallets/presentation/transfer-http-handler.ts';
import { Money } from './src/wallets/domain/money.ts';
import { Wallet } from './src/wallets/domain/wallet.ts';

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function measure(label, cases, oneCase) {
  const perCase = [];
  for (let round = 0; round < 3; round += 1) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < cases; i += 1) await oneCase();
    perCase.push(Number(process.hrtime.bigint() - start) / 1000 / cases);
  }
  const value = median(perCase);
  console.log(`${label.padEnd(30)} ${String(cases).padStart(6)} ca   trung vi ${value.toFixed(1).padStart(8)} us/ca`);
  return value;
}

const expectRejected = (code) => {
  if (code !== 'INSUFFICIENT_FUNDS') throw new Error(`sai ket qua: ${code}`);
};

// Mức 1: chỉ domain, không await I/O, không use case.
const domain = await measure('domain thuan', 20000, () => {
  try {
    new Wallet(1, Money.of(100n)).debit(Money.of(200n));
    throw new Error('phai tu choi');
  } catch (error) {
    expectRejected(error.code);
  }
});

// Mức 2: use case + adapter trong RAM.
const useCase = new TransferFunds(new InMemoryWalletRepository({ 1: 100n, 2: 0n }), () => 't');
const application = await measure('use case + adapter RAM', 20000, async () => {
  try {
    await useCase.execute({ fromWalletId: 1, toWalletId: 2, amount: '200' });
    throw new Error('phai tu choi');
  } catch (error) {
    expectRejected(error.code);
  }
});

// Mức 3: đi vòng qua HTTP thật trên localhost.
const server = createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', async () => {
    const out = await handleTransfer(useCase, JSON.parse(raw));
    res.writeHead(out.status, { 'content-type': 'application/json' }).end(JSON.stringify(out.body));
  });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const http = await measure('HTTP + use case + adapter RAM', 500, async () => {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ fromWalletId: 1, toWalletId: 2, amount: '200' }),
  });
  expectRejected((await response.json()).error);
  if (response.status !== 409) throw new Error('sai status');
});
server.close();

console.log(`so voi domain: use case x${(application / domain).toFixed(1)}, HTTP x${(http / domain).toFixed(0)}`);
console.log('so lieu phu thuoc may, chua tinh DB that');
