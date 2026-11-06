import { DomainError } from './errors.ts';

// Value Object: không có id, bằng nhau theo giá trị, tạo xong không đổi được.
export class Money {
  readonly minor: bigint;

  private constructor(minor: bigint) {
    this.minor = minor;
    Object.freeze(this);
  }

  // Cổng duy nhất tạo Money, nên mọi Money trong hệ thống đều hợp lệ.
  static of(minor: bigint | number): Money {
    if (typeof minor === 'number' && !Number.isInteger(minor)) {
      throw new DomainError('MONEY_NOT_INTEGER');
    }
    const value = BigInt(minor);
    if (value < 0n) throw new DomainError('MONEY_NEGATIVE');
    return new Money(value);
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
