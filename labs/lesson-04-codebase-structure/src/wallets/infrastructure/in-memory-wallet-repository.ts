import { Money } from '../domain/money.ts';
import type { LedgerEntry } from '../domain/transfer-between-wallets.ts';
import { Wallet } from '../domain/wallet.ts';
import type { WalletRepository, WalletTransaction } from '../domain/wallet-repository.ts';

// Adapter 1: dữ liệu trong RAM. Xếp hàng toàn bộ transaction để mô phỏng khóa.
export class InMemoryWalletRepository implements WalletRepository {
  balances = new Map<number, bigint>();
  ledger: LedgerEntry[] = [];
  #queue: Promise<unknown> = Promise.resolve();

  constructor(seed: Record<number, bigint>) {
    for (const [id, balance] of Object.entries(seed)) this.balances.set(Number(id), balance);
  }

  transaction<T>(work: (tx: WalletTransaction) => Promise<T>): Promise<T> {
    const run = this.#queue.then(() => this.#runOne(work));
    this.#queue = run.catch(() => undefined);
    return run;
  }

  async #runOne<T>(work: (tx: WalletTransaction) => Promise<T>): Promise<T> {
    // Ghi vào bản nháp, work thành công mới chép vào dữ liệu thật: đó là rollback.
    const draft = new Map<number, bigint>();
    const draftLedger: LedgerEntry[] = [];
    const tx: WalletTransaction = {
      lockMany: async (ids) =>
        ids.map((id) => {
          const balance = this.balances.get(id);
          return balance === undefined ? undefined : new Wallet(id, Money.of(balance));
        }),
      save: async (wallet) => void draft.set(wallet.id, wallet.balance.minor),
      appendLedger: async (entries) => void draftLedger.push(...entries),
    };
    const result = await work(tx);
    for (const [id, balance] of draft) this.balances.set(id, balance);
    this.ledger.push(...draftLedger);
    return result;
  }
}
