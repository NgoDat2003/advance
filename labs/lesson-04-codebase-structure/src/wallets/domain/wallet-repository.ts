import type { LedgerEntry } from './transfer-between-wallets.ts';
import type { Wallet } from './wallet.ts';

// Port: tầng trong tự nói mình cần gì. Prisma, SQL, FOR UPDATE đều không xuất hiện ở đây.
export interface WalletTransaction {
  // Trả về đúng thứ tự ids đã xin; ví không tồn tại thì trả undefined ở vị trí đó.
  lockMany(ids: number[]): Promise<Array<Wallet | undefined>>;
  save(wallet: Wallet): Promise<void>;
  appendLedger(entries: LedgerEntry[]): Promise<void>;
}

export interface WalletRepository {
  // work ném lỗi thì mọi thay đổi trong work phải được hoàn tác.
  transaction<T>(work: (tx: WalletTransaction) => Promise<T>): Promise<T>;
}
