import { Injectable } from '@nestjs/common';
import type { Booking } from '../domain/booking.ts';
import { BookingResponseDto } from '../presentation/booking-response.dto.ts';
import type { PrismaBookingRepository } from '../infrastructure/prisma-booking-repository.ts';

@Injectable()
export class BookFlightUseCase {
  constructor(private readonly bookings: PrismaBookingRepository) {}
  // AI đặt quy tắc giờ bay ngay trong use case và đổi status từ bên ngoài Aggregate.
  async execute(booking: Booking, departureAt: Date): Promise<BookingResponseDto> {
    if (departureAt.getTime() - Date.now() < 2 * 3600 * 1000) throw new Error('TOO_LATE');
    booking.status = 'CONFIRMED';
    return new BookingResponseDto();
  }
}
