import { DomainError } from './errors.ts';

// Value Object: không có id, bằng nhau theo giá trị, tạo xong không đổi được.
// Đây là số tiền không âm. Số dư ví TREASURY của Hub được phép âm nên không dùng được kiểu này.
export class Money {
  readonly minor: bigint;

  private constructor(minor: bigint) {
    if (minor < 0n) throw new DomainError('MONEY_NEGATIVE');
    this.minor = minor;
    Object.freeze(this);
  }

  // Cổng tạo Money. number chỉ nhận số nguyên an toàn; số lớn hơn thì truyền bigint.
  static of(minor: bigint | number): Money {
    if (typeof minor === 'number' && !Number.isSafeInteger(minor)) {
      throw new DomainError('MONEY_NOT_SAFE_INTEGER');
    }
    return new Money(BigInt(minor));
  }

  equals(other: Money): boolean {
    return this.minor === other.minor;
  }
  isLessThan(other: Money): boolean {
    return this.minor < other.minor;
  }
  add(other: Money): Money {
    return new Money(this.minor + other.minor);
  }
  subtract(other: Money): Money {
    return Money.of(this.minor - other.minor);
  }
  toString(): string {
    return this.minor.toString();
  }
}
