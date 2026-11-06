import { PrismaClient } from '@prisma/client';
import type { Seat } from './seat.ts';

// AI viết. Lỗi nào ở đây máy quét không thấy được?
export class Booking {
  id = '';
  status = 'NEW';
  seat?: Seat;
  async saveToDb(_prisma: PrismaClient): Promise<void> {}
}
