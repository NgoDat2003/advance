import { PrismaClient } from '@prisma/client';
import { VoucherPrismaRepository } from '../infrastructure/voucher-prisma.repository.ts';

// AI viết: Entity tự lưu xuống DB cho "tiện".
export class Voucher {
  async redeem(prisma: PrismaClient, repo: VoucherPrismaRepository) {
    return repo.markUsed(prisma, this);
  }
}
