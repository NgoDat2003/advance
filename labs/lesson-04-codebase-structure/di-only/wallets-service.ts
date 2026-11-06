import { PrismaService } from './prisma-service.ts';

// DI nhưng không DIP: prisma được tiêm từ ngoài vào, song file này vẫn import class cụ thể.
// NestJS cần chính class này làm token (emitDecoratorMetadata), nên dòng import trên không bị xóa khi build.
export class WalletsService {
  static inject = [PrismaService];
  #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  async exists(id: number): Promise<boolean> {
    return (await this.#prisma.wallet.findUnique({ where: { id } })) !== null;
  }
}
