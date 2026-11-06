import { Injectable } from '@nestjs/common';
import { ClaimResponseDto } from '../presentation/claim-response.dto.ts';
import { Voucher } from '../domain/voucher.ts';

@Injectable()
export class ClaimVoucher {
  async execute(voucher: Voucher): Promise<ClaimResponseDto> {
    return new ClaimResponseDto();
  }
}
