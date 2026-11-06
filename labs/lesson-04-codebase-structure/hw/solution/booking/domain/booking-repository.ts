import type { Booking } from './booking.ts';

// Port nằm trong domain.
export interface BookingRepository {
  save(booking: Booking): Promise<void>;
}
