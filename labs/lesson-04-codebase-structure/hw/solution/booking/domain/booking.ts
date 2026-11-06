import type { FlightId } from './flight-id.ts';
import type { Money } from './money.ts';
import type { Seat } from './seat.ts';

// Aggregate Root: giữ ghế và trạng thái, chặn hủy vé đã bay. Chỉ khung, không code.
export class Booking {
  confirm(_seat: Seat, _fare: Money, _flight: FlightId): void {}
  cancel(): void {}
}
