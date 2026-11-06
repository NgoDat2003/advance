// DTO đi qua ranh giới: chỉ kiểu nguyên thủy JSON được, không có bigint, không có Entity.
export type TransferCommand = { fromWalletId: number; toWalletId: number; amount: string };
export type TransferResult = { transferId: string };
