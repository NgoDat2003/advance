import { DomainError } from '../src/wallets/domain/errors.ts';

// Aggregate Root của đợt phát voucher. Quy tắc claim phải nằm ở đây, không nằm trong use case.
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

  // TODO(Đạt): viết thân hàm claim (khoảng 5 đến 8 dòng).
  // Luồng 3 bước:
  //   1. Hết hạn khi now >= expiresAt thì ném VOUCHER_EXPIRED.
  //   2. Cửa hàng đã claim thì ném ALREADY_CLAIMED; hết suất thì ném SOLD_OUT.
  //   3. Trừ 1 suất và ghi nhớ cửa hàng.
  // Phao cú pháp:
  //   throw new DomainError('MA_LOI');
  //   this.#claimedStores.has(storeId)  /  this.#claimedStores.add(storeId)
  //   now được truyền vào, không gọi Date.now(): nhờ vậy test được ca hết hạn mà không phải chỉnh đồng hồ.
  claim(storeId: number, now: number): void {
    throw new DomainError('TODO_DAT');
  }
}
