import { readFile, writeFile } from 'node:fs/promises';
import { Money } from '../domain/money.ts';
import type { LedgerEntry } from '../domain/transfer-between-wallets.ts';
import { Wallet } from '../domain/wallet.ts';
import type { WalletRepository, WalletTransaction } from '../domain/wallet-repository.ts';

type Stored = {
  balances: Record<string, string>;
  ledger: Array<{ transferId: string; walletId: number; amount: string }>;
};

// Adapter 2: lưu xuống file JSON thật. Dùng để chứng minh đổi kho lưu trữ không phải sửa domain và use case.
export class JsonFileWalletRepository implements WalletRepository {
  #path: string;
  #queue: Promise<unknown> = Promise.resolve();

  constructor(path: string) {
    this.#path = path;
  }

  static async create(path: string, seed: Record<number, bigint>): Promise<JsonFileWalletRepository> {
    const balances = Object.fromEntries(Object.entries(seed).map(([id, b]) => [id, b.toString()]));
    await writeFile(path, JSON.stringify({ balances, ledger: [] }));
    return new JsonFileWalletRepository(path);
  }

  async snapshot(): Promise<{ balances: Map<number, bigint>; ledger: LedgerEntry[] }> {
    await this.#queue;
    const stored = await this.#read();
    return {
      balances: new Map(Object.entries(stored.balances).map(([id, b]) => [Number(id), BigInt(b)])),
      ledger: stored.ledger.map((e) => ({ ...e, amount: BigInt(e.amount) })),
    };
  }

  async #read(): Promise<Stored> {
    return JSON.parse(await readFile(this.#path, 'utf8'));
  }

  transaction<T>(work: (tx: WalletTransaction) => Promise<T>): Promise<T> {
    const run = this.#queue.then(() => this.#runOne(work));
    this.#queue = run.catch(() => undefined);
    return run;
  }

  async #runOne<T>(work: (tx: WalletTransaction) => Promise<T>): Promise<T> {
    const stored = await this.#read();
    const tx: WalletTransaction = {
      lockMany: async (ids) =>
        ids.map((id) => {
          const balance = stored.balances[id];
          return balance === undefined ? undefined : new Wallet(id, Money.of(BigInt(balance)));
        }),
      save: async (wallet) => void (stored.balances[wallet.id] = wallet.balance.toString()),
      appendLedger: async (entries) =>
        void stored.ledger.push(...entries.map((e) => ({ ...e, amount: e.amount.toString() }))),
    };
    const result = await work(tx);
    await writeFile(this.#path, JSON.stringify(stored)); // work ném lỗi thì không tới dòng này: rollback
    return result;
  }
}
