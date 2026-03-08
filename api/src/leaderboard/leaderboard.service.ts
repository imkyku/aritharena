import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating } from '../ratings/schemas/rating.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { LeaderboardCacheMetadata } from './schemas/leaderboard-cache-metadata.schema.js';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Rating.name) private readonly ratingModel: Model<Rating>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(LeaderboardCacheMetadata.name)
    private readonly cacheMetaModel: Model<LeaderboardCacheMetadata>,
  ) {}

  async getLeaderboard(limit = 50) {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const ratings = await this.ratingModel
      .find({})
      .sort({ rating: -1, gamesPlayed: -1, updatedAt: 1 })
      .limit(safeLimit)
      .lean()
      .exec();

    const userIds = ratings.map((entry) => entry.userId);
    const users = await this.userModel.find({ _id: { $in: userIds } }).lean().exec();
    const usersMap = new Map(users.map((user) => [user._id.toString(), user]));

    await this.cacheMetaModel.updateOne(
      { key: 'global' },
      {
        $set: {
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          stale: false,
        },
      },
      { upsert: true },
    );

    return ratings.map((entry, index) => {
      const user = usersMap.get(entry.userId.toString());
      return {
        rank: index + 1,
        userId: entry.userId.toString(),
        rating: entry.rating,
        gamesPlayed: entry.gamesPlayed,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        username: user?.username ?? null,
        firstName: user?.firstName ?? 'Unknown',
      };
    });
  }
}
