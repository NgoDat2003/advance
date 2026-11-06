// Bản rút gọn để minh họa: có đúng hình dạng API kiểu Prisma mà service bên cạnh đang gọi.
export class PrismaService {
  wallet = { findUnique: async (_args: { where: { id: number } }): Promise<{ id: number } | null> => null };
}
