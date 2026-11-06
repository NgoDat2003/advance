import { DomainError } from './errors.ts';
import type { Money } from './money.ts';
import type { Wallet } from './wallet.ts';

export type LedgerEntry = { transferId: string; walletId: number; amount: bigint };

// Domain Service: quy tắc này nằm giữa 2 Aggregate nên không thuộc riêng ví nào. Không giữ state, không I/O.
export function transferBetweenWallets(
  transferId: string,
  from: Wallet,
  to: Wallet,
  amount: Money,
): LedgerEntry[] {
  if (from.id === to.id) throw new DomainError('SAME_WALLET');
  from.debit(amount);
  to.credit(amount);
  // Bất biến sổ cái kép (Bài 07): tổng 2 bút toán luôn bằng 0.
  return [
    { transferId, walletId: from.id, amount: -amount.minor },
    { transferId, walletId: to.id, amount: amount.minor },
  ];
}
