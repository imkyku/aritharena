import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from '../common/redis/redis.service.js';
import { MatchmakingQueueMetadata } from './schemas/matchmaking-queue-metadata.schema.js';

@Injectable()
export class MatchmakingService {
  private readonly queueKey = 'mm:ranked:zset';

  constructor(
    private readonly redisService: RedisService,
    @InjectModel(MatchmakingQueueMetadata.name)
    private readonly queueMetadataModel: Model<MatchmakingQueueMetadata>,
  ) {}

  async joinRankedQueue(userId: string, rating: number): Promise<void> {
    const joinedAt = Date.now();
    const redis = this.redisService.client;

    await redis.zadd(this.queueKey, rating, userId);
    await redis.hset(this.userMetaKey(userId), {
      rating,
      joinedAt,
    });
    await redis.expire(this.userMetaKey(userId), 60 * 10);

    await this.queueMetadataModel.updateOne(
      { userId },
      {
        $set: {
          userId,
          mode: 'ranked',
          rating,
          enqueuedAt: new Date(joinedAt),
          expiresAt: new Date(joinedAt + 10 * 60 * 1000),
        },
      },
      { upsert: true },
    );
  }

  async leaveRankedQueue(userId: string): Promise<void> {
    const redis = this.redisService.client;
    await redis.zrem(this.queueKey, userId);
    await redis.del(this.userMetaKey(userId));
    await this.queueMetadataModel.deleteOne({ userId }).exec();
  }

  async tryMatch(userId: string): Promise<{ userA: string; userB: string } | null> {
    const redis = this.redisService.client;
    const meta = await redis.hgetall(this.userMetaKey(userId));
    if (!meta.rating || !meta.joinedAt) {
      return null;
    }

    const rating = Number(meta.rating);
    const joinedAt = Number(meta.joinedAt);
    const waitSeconds = Math.floor((Date.now() - joinedAt) / 1_000);
    const range = Math.min(700, 100 + Math.floor(waitSeconds / 10) * 50);

    const candidates = await redis.zrangebyscore(this.queueKey, rating - range, rating + range);

    for (const candidateId of candidates) {
      if (candidateId === userId) {
        continue;
      }

      const rematchKey = this.recentPairKey(userId, candidateId);
      const recentlyMatched = await redis.get(rematchKey);
      if (recentlyMatched) {
        continue;
      }

      const lockPair = [userId, candidateId].sort().join(':');
      const lockAcquired = await redis.set(`mm:pair-lock:${lockPair}`, '1', 'NX', 'EX', 3);
      if (!lockAcquired) {
        continue;
      }

      const removed = await redis.zrem(this.queueKey, userId, candidateId);
      if (removed < 2) {
        await redis.zadd(this.queueKey, rating, userId);
        continue;
      }

      await Promise.all([
        redis.del(this.userMetaKey(userId)),
        redis.del(this.userMetaKey(candidateId)),
        this.queueMetadataModel.deleteMany({ userId: { $in: [userId, candidateId] } }).exec(),
        redis.set(rematchKey, '1', 'EX', 120),
      ]);

      return {
        userA: userId,
        userB: candidateId,
      };
    }

    return null;
  }

  private userMetaKey(userId: string): string {
    return `mm:ranked:user:${userId}`;
  }

  private recentPairKey(userA: string, userB: string): string {
    const [a, b] = [userA, userB].sort();
    return `mm:recent-pair:${a}:${b}`;
  }
}
