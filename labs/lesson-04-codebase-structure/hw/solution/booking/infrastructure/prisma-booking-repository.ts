import { PrismaClient } from '@prisma/client';
import type { Booking } from '../domain/booking.ts';
import type { BookingRepository } from '../domain/booking-repository.ts';

export class PrismaBookingRepository implements BookingRepository {
  constructor(_prisma: PrismaClient) {}
  async save(_booking: Booking): Promise<void> {}
}
