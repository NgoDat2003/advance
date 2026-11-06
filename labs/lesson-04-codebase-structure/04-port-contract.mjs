// Lab 4 (slide 9, 10, 16): cùng một bộ kiểm chạy trên 3 adapter. Domain và use case không đổi một dòng.
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { TransferFunds } from './src/wallets/application/transfer-funds.ts';
import { InMemoryWalletRepository } from './src/wallets/infrastructure/in-memory-wallet-repository.ts';
import { Money } from './src/wallets/domain/money.ts';
import { RacyWalletRepository } from './src/wallets/infrastructure/racy-wallet-repository.ts';
import { JsonFileWalletRepository } from './src/wallets/infrastructure/json-file-wallet-repository.ts';

const tmp = mkdtempSync(join(process.cwd(), '.tmp-lab4-'));
let fileNo = 0;

const adapters = {
  'RAM (xep hang)': async (seed) => {
    const repo = new InMemoryWalletRepository(seed);
    return { repo, read: async () => ({ balances: repo.balances, ledger: repo.ledger }) };
  },
  'File JSON': async (seed) => {
    fileNo += 1;
    const repo = await JsonFileWalletRepository.create(join(tmp, `w${fileNo}.json`), seed);
    return { repo, read: () => repo.snapshot() };
  },
  'RAM thieu khoa (co y sai)': async (seed) => {
    const repo = new RacyWalletRepository(seed);
    return { repo, read: async () => ({ balances: repo.balances, ledger: repo.ledger }) };
  },
};

let ids = 0;
const nextId = () => `t${(ids += 1)}`;
const ledgerSum = (ledger) => ledger.reduce((sum, entry) => sum + entry.amount, 0n);

// Hợp đồng của port: adapter nào cũng phải giữ được 5 điều này.
const contract = {
  'chuyen hop le, sum so cai = 0': async ({ repo, read }) => {
    await new TransferFunds(repo, nextId).execute({ fromWalletId: 1, toWalletId: 2, amount: '100' });
    const { balances, ledger } = await read();
    return balances.get(1) === 900n && balances.get(2) === 100n && ledgerSum(ledger) === 0n;
  },
  'thieu tien: tu choi, khong doi gi': async ({ repo, read }) => {
    const code = await new TransferFunds(repo, nextId)
      .execute({ fromWalletId: 1, toWalletId: 2, amount: '5000' })
      .catch((error) => error.code);
    const { balances, ledger } = await read();
    return code === 'INSUFFICIENT_FUNDS' && balances.get(1) === 1000n && ledger.length === 0;
  },
  'vi khong ton tai: WALLET_NOT_FOUND': async ({ repo }) => {
    const code = await new TransferFunds(repo, nextId)
      .execute({ fromWalletId: 1, toWalletId: 99, amount: '1' })
      .catch((error) => error.code);
    return code === 'WALLET_NOT_FOUND';
  },
  'ghi xong moi loi: phai hoan tac (rollback)': async ({ repo, read }) => {
    await repo
      .transaction(async (tx) => {
        const [wallet] = await tx.lockMany([1]);
        wallet.debit(Money.of(100n));
        await tx.save(wallet);
        await tx.appendLedger([{ transferId: 'x', walletId: 1, amount: -100n }]);
        throw new Error('loi sau khi da ghi');
      })
      .catch(() => undefined);
    const { balances, ledger } = await read();
    return balances.get(1) === 1000n && ledger.length === 0;
  },
  '30 lenh dong thoi moi lenh 10': async ({ repo, read }) => {
    const useCase = new TransferFunds(repo, nextId);
    await Promise.all(
      Array.from({ length: 30 }, () => useCase.execute({ fromWalletId: 1, toWalletId: 2, amount: '10' })),
    );
    const { balances, ledger } = await read();
    console.log(`      vi1=${balances.get(1)} vi2=${balances.get(2)} but_toan=${ledger.length}`);
    return balances.get(1) === 700n && balances.get(2) === 300n;
  },
};

let failed = 0;
for (const [adapterName, make] of Object.entries(adapters)) {
  console.log(`\n== ${adapterName}`);
  for (const [caseName, check] of Object.entries(contract)) {
    const ok = await check(await make({ 1: 1000n, 2: 0n }));
    if (!ok) failed += 1;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${caseName}`);
  }
}
rmSync(tmp, { recursive: true, force: true });
console.log(`\ntong so ca FAIL: ${failed} (ky vong dung 1, nam o adapter co y sai)`);
process.exit(failed === 1 ? 0 : 1);
