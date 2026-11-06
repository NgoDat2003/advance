import { DomainError } from './errors.ts';
import { Money } from './money.ts';

// Aggregate Root: muốn đổi số dư phải đi qua debit/credit, nên bất biến "không âm" không thể bị bỏ qua.
export class Wallet {
  readonly id: number;
  #balance: Money;

  constructor(id: number, balance: Money) {
    this.id = id;
    this.#balance = balance;
  }

  get balance(): Money {
    return this.#balance;
  }

  debit(amount: Money): void {
    if (this.#balance.isLessThan(amount)) throw new DomainError('INSUFFICIENT_FUNDS');
    this.#balance = this.#balance.subtract(amount);
  }

  credit(amount: Money): void {
    this.#balance = this.#balance.add(amount);
  }
}
