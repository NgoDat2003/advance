import { DomainError } from '../domain/errors.ts';
import { Money } from '../domain/money.ts';
import { transferBetweenWallets } from '../domain/transfer-between-wallets.ts';
import type { WalletRepository } from '../domain/wallet-repository.ts';
import type { TransferCommand, TransferResult } from './transfer-dto.ts';

// Use case: nhạc trưởng. Chỉ sắp thứ tự các bước, không có một phép so sánh nghiệp vụ nào ở đây.
export class TransferFunds {
  #wallets: WalletRepository;
  #newId: () => string;

  constructor(wallets: WalletRepository, newId: () => string) {
    this.#wallets = wallets;
    this.#newId = newId;
  }

  execute(command: TransferCommand): Promise<TransferResult> {
    return this.#wallets.transaction(async (tx) => {
      const amount = Money.of(BigInt(command.amount));
      const [from, to] = await tx.lockMany([command.fromWalletId, command.toWalletId]);
      if (!from || !to) throw new DomainError('WALLET_NOT_FOUND');
      const transferId = this.#newId();
      const entries = transferBetweenWallets(transferId, from, to, amount);
      await tx.appendLedger(entries);
      await tx.save(from);
      await tx.save(to);
      return { transferId };
    });
  }
}
