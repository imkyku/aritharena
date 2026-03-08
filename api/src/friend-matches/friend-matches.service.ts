import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { RedisService } from '../common/redis/redis.service.js';

@Injectable()
export class FriendMatchesService {
  constructor(private readonly redisService: RedisService) {}

  async createInvite(hostUserId: string): Promise<{ code: string }> {
    const redis = this.redisService.client;

    for (let i = 0; i < 10; i += 1) {
      const code = randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
      const success = await redis.set(
        this.codeKey(code),
        JSON.stringify({ hostUserId, createdAt: Date.now() }),
        'NX',
        'EX',
        600,
      );

      if (success) {
        return { code };
      }
    }

    throw new Error('Unable to create invite code');
  }

  async consumeInvite(code: string, joinerUserId: string): Promise<{ hostUserId: string; joinerUserId: string }> {
    const redis = this.redisService.client;
    const key = this.codeKey(code.trim().toUpperCase());
    const raw = await redis.get(key);

    if (!raw) {
      throw new Error('Invite code not found or expired');
    }

    const parsed = JSON.parse(raw) as { hostUserId: string };
    if (parsed.hostUserId === joinerUserId) {
      throw new Error('Cannot join your own invite');
    }

    await redis.del(key);

    return {
      hostUserId: parsed.hostUserId,
      joinerUserId,
    };
  }

  private codeKey(code: string): string {
    return `friend:invite:${code}`;
  }
}
