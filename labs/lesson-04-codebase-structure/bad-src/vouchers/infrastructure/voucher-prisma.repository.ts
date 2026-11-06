import { PrismaClient } from '@prisma/client';
import type { Voucher } from '../domain/voucher.ts';

export class VoucherPrismaRepository {
  async markUsed(prisma: PrismaClient, voucher: Voucher) {}
}
