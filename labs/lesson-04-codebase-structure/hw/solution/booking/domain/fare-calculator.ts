import type { Money } from './money.ts';

// Domain Service: quy tắc giá không thuộc riêng Booking nào, không state.
export class FareCalculator {
  quote(): Money | undefined {
    return undefined;
  }
}
