import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class SocketRateLimiterService {
  constructor(private readonly redisService: RedisService) {}

  async checkLimit(
    key: string,
    windowSeconds: number,
    maxRequests: number,
  ): Promise<{ allowed: boolean; current: number }> {
    const redis = this.redisService.client;
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    return {
      allowed: current <= maxRequests,
      current,
    };
  }
}
