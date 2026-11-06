import { DomainError } from '../src/wallets/domain/errors.ts';

// Lời giải tham khảo. Làm xong bản .todo.ts rồi hãy mở file này.
export class VoucherCampaign {
  readonly code: string;
  readonly expiresAt: number;
  #remaining: number;
  #claimedStores = new Set<number>();

  constructor(code: string, quantity: number, expiresAt: number) {
    this.code = code;
    this.#remaining = quantity;
    this.expiresAt = expiresAt;
  }

  get remaining(): number {
    return this.#remaining;
  }

  claim(storeId: number, now: number): void {
    if (now >= this.expiresAt) throw new DomainError('VOUCHER_EXPIRED');
    if (this.#claimedStores.has(storeId)) throw new DomainError('ALREADY_CLAIMED');
    if (this.#remaining === 0) throw new DomainError('SOLD_OUT');
    this.#remaining -= 1;
    this.#claimedStores.add(storeId);
  }
}
