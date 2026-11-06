import { randomUUID } from 'node:crypto';

type Sql = (text: string, params: unknown[]) => Promise<Array<Record<string, any>>>;
type Res = { status(code: number): { json(body: unknown): void } };

// Cùng nghiệp vụ, viết một mạch: HTTP, SQL và quy tắc nghiệp vụ trộn vào một hàm.
// Muốn thử riêng quy tắc "thiếu tiền" vẫn phải giả cả req, res và câu SQL.
export async function transferHandler(req: { body: any }, res: Res, sql: Sql): Promise<void> {
  const { fromWalletId, toWalletId, amount } = req.body;
  await sql('BEGIN', []);
  try {
    const rows = await sql('SELECT id, balance FROM wallets WHERE id = ANY($1) ORDER BY id FOR UPDATE', [
      [fromWalletId, toWalletId],
    ]);
    const from = rows.find((r) => r.id === fromWalletId);
    const to = rows.find((r) => r.id === toWalletId);
    if (!from || !to) {
      await sql('ROLLBACK', []);
      res.status(404).json({ error: 'WALLET_NOT_FOUND' });
      return;
    }
    if (BigInt(from.balance) < BigInt(amount)) {
      await sql('ROLLBACK', []);
      res.status(409).json({ error: 'INSUFFICIENT_FUNDS' });
      return;
    }
    const transferId = randomUUID();
    await sql('INSERT INTO ledger_entries (transfer_id, wallet_id, amount) VALUES ($1,$2,$3),($1,$4,$5)', [
      transferId,
      fromWalletId,
      -BigInt(amount),
      toWalletId,
      BigInt(amount),
    ]);
    await sql('UPDATE wallets SET balance = balance - $2 WHERE id = $1', [fromWalletId, amount]);
    await sql('UPDATE wallets SET balance = balance + $2 WHERE id = $1', [toWalletId, amount]);
    await sql('COMMIT', []);
    res.status(201).json({ transferId });
  } catch (error) {
    await sql('ROLLBACK', []);
    throw error;
  }
}
