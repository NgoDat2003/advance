import { Money } from '../domain/money.ts';
import type { LedgerEntry } from '../domain/transfer-between-wallets.ts';
import { Wallet } from '../domain/wallet.ts';
import type { WalletRepository, WalletTransaction } from '../domain/wallet-repository.ts';

const yieldToOthers = () => new Promise((resolve) => setImmediate(resolve));

// Adapter CỐ Ý SAI: tên hàm là lockMany nhưng không khóa gì (giống SELECT thiếu FOR UPDATE ở Bài 14).
export class RacyWalletRepository implements WalletRepository {
  balances = new Map<number, bigint>();
  ledger: LedgerEntry[] = [];

  constructor(seed: Record<number, bigint>) {
    for (const [id, balance] of Object.entries(seed)) this.balances.set(Number(id), balance);
  }

  async transaction<T>(work: (tx: WalletTransaction) => Promise<T>): Promise<T> {
    const draft = new Map<number, bigint>();
    const draftLedger: LedgerEntry[] = [];
    const tx: WalletTransaction = {
      lockMany: async (ids) => {
        const wallets = ids.map((id) => {
          const balance = this.balances.get(id);
          return balance === undefined ? undefined : new Wallet(id, Money.of(balance));
        });
        await yieldToOthers(); // mỗi await là một điểm request khác chen vào
        return wallets;
      },
      save: async (wallet) => void draft.set(wallet.id, wallet.balance.minor),
      appendLedger: async (entries) => void draftLedger.push(...entries),
    };
    const result = await work(tx);
    for (const [id, balance] of draft) this.balances.set(id, balance);
    this.ledger.push(...draftLedger);
    return result;
  }
}
