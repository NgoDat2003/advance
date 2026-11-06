// Giống PrismaService thật: vừa import là dựng client, thiếu biến môi trường thì nổ ngay.
if (!process.env.DATABASE_URL) {
  throw new Error('PrismaService: thieu DATABASE_URL');
}
export class PrismaService {
  wallet = { findUnique: async (_args: unknown) => null };
}
