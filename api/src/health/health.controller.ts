import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RedisService } from '../common/redis/redis.service.js';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async health() {
    const mongoReady = this.connection.readyState === 1;
    const redisPing = await this.redisService.client.ping();

    return {
      status: mongoReady && redisPing === 'PONG' ? 'ok' : 'degraded',
      mongo: mongoReady ? 'up' : 'down',
      redis: redisPing,
      timestamp: new Date().toISOString(),
    };
  }
}
