// Bài 06 · Driver drill — đoạn code "AI viết" cho NestJS 10 + node-redis (npm redis 6.3.0).
// Nhiệm vụ: review như review PR thật. Tìm 7 lỗi và 1 chỗ ĐÚNG (đừng "sửa" nhầm chỗ đúng).
// Đáp án nằm ở mục #driver-drill của guide. File chỉ để đọc, không chạy trong bài.
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

const redis: RedisClientType = createClient({ url: 'redis://127.0.0.1:6379' });

@Injectable()
export class MenuCacheService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await redis.connect();
  }

  async onModuleDestroy() {
    await redis.close();
  }

  // Lưu menu của cửa hàng vào cache.
  async saveMenu(storeId: string, menuJson: string) {
    await redis.set(`menu:${storeId}`, menuJson);
  }

  // Admin sửa một món → xóa cache menu của mọi cửa hàng (gọi trong request của admin).
  async invalidateAllMenus() {
    const keys = await redis.keys('menu:*');
    if (keys.length) await redis.del(keys);
  }

  // Trang chủ hiện giá của 20 món.
  async getPrices(itemIds: string[]) {
    const prices: (string | null)[] = [];
    for (const id of itemIds) {
      prices.push(await redis.get(`price:${id}`));
    }
    return prices;
  }

  // Đếm lượt xem menu của cửa hàng.
  async countView(storeId: string) {
    const n = Number((await redis.get(`views:${storeId}`)) ?? 0);
    await redis.set(`views:${storeId}`, String(n + 1));
  }

  // Số lượng một món trong giỏ (giỏ của khách sỉ có thể tới vài chục nghìn dòng).
  async getCartQty(userId: string, itemId: string) {
    const cart = await redis.hGetAll(`cart:${userId}`);
    return Number(cart[itemId] ?? 0);
  }
}

@Injectable()
export class SeatLockService {
  // Giữ ghế 2 giây trong lúc thanh toán; token là chuỗi ngẫu nhiên của request.
  async lockSeat(flight: string, seat: string, token: string): Promise<boolean> {
    const ok = await redis.set(`lock:${flight}:${seat}`, token, {
      condition: 'NX',
      expiration: { type: 'PX', value: 2000 },
    });
    return ok === 'OK';
  }

  // Thanh toán xong thì trả ghế.
  async releaseSeat(flight: string, seat: string, token: string) {
    await redis.del(`lock:${flight}:${seat}`);
  }
}
