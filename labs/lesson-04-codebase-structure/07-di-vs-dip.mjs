// Lab 7 (slide 30): Dependency Injection khác Dependency Inversion.
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { importsOf } from './check-dependency-rule.mjs';
import { WalletsService } from './di-only/wallets-service.ts';
import { TransferFunds } from './src/wallets/application/transfer-funds.ts';
import { InMemoryWalletRepository } from './src/wallets/infrastructure/in-memory-wallet-repository.ts';

// 1. DI đã đủ để tiêm bản giả: không cần DB. NestJS làm việc này bằng overrideProvider.
const calls = [];
const fakePrisma = {
  wallet: {
    findUnique: async (args) => {
      calls.push(args);
      return null;
    },
  },
};
console.log(`DI khong DIP: tiem ban gia chay duoc, exists -> ${await new WalletsService(fakePrisma).exists(1)}`);

// 2. Nhưng bản giả phải bắt chước đúng API của Prisma, và source vẫn trỏ ra hạ tầng.
console.log(`  ban gia phai biet API cua Prisma: wallet.findUnique(${JSON.stringify(calls[0])})`);
const specifiers = (path) => importsOf(readFileSync(path, 'utf8')).map((i) => i.specifier).join(', ');
console.log(`  service import: ${specifiers('di-only/wallets-service.ts')}`);

// 3. DI + DIP: bản giả chỉ cần đáp ứng hợp đồng do lõi đặt ra, source không còn trỏ ra ngoài.
const useCase = new TransferFunds(new InMemoryWalletRepository({ 1: 100n, 2: 0n }), () => 't1');
console.log(`DI + DIP: ${JSON.stringify(await useCase.execute({ fromWalletId: 1, toWalletId: 2, amount: '10' }))}`);
console.log(`  use case import: ${specifiers('src/wallets/application/transfer-funds.ts')}`);

// 4. interface biến mất lúc chạy, nên không thể làm token cho DI container. NestJS phải dùng Symbol hoặc chuỗi.
const before = 'export interface WalletRepository { save(): void }\nexport const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY");\n';
console.log('Sau khi bo kieu, con lai:');
console.log(stripTypeScriptTypes(before).trim());
