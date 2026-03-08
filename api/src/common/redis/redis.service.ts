import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  get client(): Redis {
    return this.redis;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
