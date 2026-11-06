import { PrismaClient } from '@prisma/client';
import type { Booking } from '../domain/booking.ts';

// Không có interface ở domain: use case phải import thẳng class này.
export class PrismaBookingRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async save(_booking: Booking): Promise<void> {}
}
