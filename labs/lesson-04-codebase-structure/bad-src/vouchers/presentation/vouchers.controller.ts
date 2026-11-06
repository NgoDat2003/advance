import { Controller } from '@nestjs/common';
import { VoucherPrismaRepository } from '../infrastructure/voucher-prisma.repository.ts';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly repo: VoucherPrismaRepository) {}
}
