import { PrismaService } from './prisma-service.ts';

// DI nhưng không DIP: prisma được tiêm từ ngoài vào, song file này vẫn gọi tên class cụ thể và API của nó.
export class WalletsService {
  #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  async exists(id: number): Promise<boolean> {
    return (await this.#prisma.wallet.findUnique({ where: { id } })) !== null;
  }
}
