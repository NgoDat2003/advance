import type { TransferFunds } from '../application/transfer-funds.ts';
import type { TransferCommand } from '../application/transfer-dto.ts';

const STATUS_BY_CODE: Record<string, number> = {
  INSUFFICIENT_FUNDS: 409,
  WALLET_NOT_FOUND: 404,
  SAME_WALLET: 400,
  MONEY_NEGATIVE: 400,
  MONEY_NOT_SAFE_INTEGER: 400,
};

// Adapter phía vào: dịch HTTP thành command và dịch lỗi nghiệp vụ thành status. Không chứa quy tắc nào.
export async function handleTransfer(
  transferFunds: TransferFunds,
  body: TransferCommand,
): Promise<{ status: number; body: unknown }> {
  try {
    return { status: 201, body: await transferFunds.execute(body) };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code && STATUS_BY_CODE[code]) return { status: STATUS_BY_CODE[code], body: { error: code } };
    throw error;
  }
}
