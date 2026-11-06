import type { BookingRepository } from '../domain/booking-repository.ts';
import type { PaymentGateway } from './payment-gateway.ts';
import type { BookFlightCommand, BookFlightResult } from './book-flight.dto.ts';

// Use case: tính giá, tạo Booking, gọi thanh toán, lưu. Không có if nghiệp vụ.
export class BookFlightUseCase {
  constructor(_bookings: BookingRepository, _payments: PaymentGateway) {}
  async execute(_command: BookFlightCommand): Promise<BookFlightResult | undefined> {
    return undefined;
  }
}
