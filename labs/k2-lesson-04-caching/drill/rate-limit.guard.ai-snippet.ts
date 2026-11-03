// K2 Bài 04 · Guard Drill — đoạn RateLimitGuard "do AI sinh" cho NestJS 10 + node-redis 6.3.0.
// Nhiệm vụ: đọc như review PR trước khi đưa vào OmniPOS M2. Tìm 6 lỗi thiết kế/vận hành và 1 chỗ ĐÚNG (mồi nhử — đừng sửa nhầm!).
// File chỉ để đọc và phân tích ở mục #guard-drill của bài giảng, không chạy trực tiếp.
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

const redis: RedisClientType = createClient({ url: 'redis://127.0.0.1:6381' });

@Injectable()
export class VoucherRateLimitGuard implements CanActivate, OnModuleInit, OnModuleDestroy {
  // Đếm nhanh cục bộ trên RAM cho endpoint đặt đơn để "đỡ tốn mạng gọi Redis".
  private readonly localOrderCounts = new Map<string, number>();

  async onModuleInit() {
    await redis.connect();
  }

  async onModuleDestroy() {
    await redis.close();
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const storeId: string = req.params.storeId ?? 's0';
    const ip: string = req.ip ?? '0.0.0.0';
    const path: string = req.route?.path ?? '';

    // 1) Giới hạn đặt đơn 100 đơn/phút trên toàn hệ thống 6 instance K8s
    if (path.startsWith('/orders')) {
      const cur = (this.localOrderCounts.get(storeId) ?? 0) + 1;
      this.localOrderCounts.set(storeId, cur);
      if (cur > 100) {
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    }

    // 2) Chống dò mật khẩu đăng nhập: tối đa 5 lần/phút theo cửa sổ cố định
    if (path === '/auth/login') {
      const minuteSlot = Math.floor(Date.now() / 60000);
      const loginKey = `k2l04:login:{${ip}}:${minuteSlot}`;
      const attempts = await redis.incr(loginKey);
      if (attempts === 1) {
        await redis.expire(loginKey, 60);
      }
      if (attempts > 5) {
        throw new HttpException('Too Many Login Attempts', HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    }

    // 3) Claim voucher theo cửa hàng: gắn {storeId} để tương thích Redis Cluster
    const voucherKey = `k2l04:voucher:rl:{${storeId}}`;
    try {
      const count = await redis.incr(voucherKey);
      if (count === 1) {
        await redis.expire(voucherKey, 10);
      }
      if (count > 10) {
        throw new HttpException('Voucher rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    } catch {
      // Redis chập chờn thì báo lỗi 500 luôn cho an toàn
      throw new InternalServerErrorException('Redis rate limiter unavailable');
    }
  }

  // API nội bộ cho admin bấm nút xóa toàn bộ bộ đếm giới hạn đang có
  async resetAllRateLimits() {
    const all = await redis.keys('k2l04:*');
    if (all.length > 0) {
      await redis.del(all);
    }
  }
}
