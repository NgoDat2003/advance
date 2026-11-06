// Lab 7 (slide 30): Dependency Injection khác Dependency Inversion.
import { stripTypeScriptTypes } from 'node:module';

delete process.env.DATABASE_URL;

// Viết test cho WalletsService kiểu v1.0: tiêm prisma giả vào.
try {
  const { WalletsService } = await import('./di-only/wallets-service.ts');
  const fake = { wallet: { findUnique: async () => null } };
  console.log(`DI khong DIP: ${await new WalletsService(fake).exists(1)}`);
} catch (error) {
  console.log(`DI khong DIP: import that bai truoc khi kip tiem prisma gia -> ${error.message}`);
}

// Cùng test đó với use case 4 tầng: không có DATABASE_URL vẫn chạy.
const { TransferFunds } = await import('./src/wallets/application/transfer-funds.ts');
const { InMemoryWalletRepository } = await import('./src/wallets/infrastructure/in-memory-wallet-repository.ts');
const useCase = new TransferFunds(new InMemoryWalletRepository({ 1: 100n, 2: 0n }), () => 't1');
console.log(`DI + DIP: ${JSON.stringify(await useCase.execute({ fromWalletId: 1, toWalletId: 2, amount: '10' }))}`);

// interface biến mất lúc chạy, nên không thể làm token cho DI container. NestJS phải dùng Symbol hoặc chuỗi.
const before = 'export interface WalletRepository { save(): void }\nexport const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY");\n';
console.log('Sau khi bo kieu, con lai:');
console.log(stripTypeScriptTypes(before).trim());
