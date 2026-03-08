import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaderboardController } from './leaderboard.controller.js';
import { LeaderboardService } from './leaderboard.service.js';
import {
  LeaderboardCacheMetadata,
  LeaderboardCacheMetadataSchema,
} from './schemas/leaderboard-cache-metadata.schema.js';
import { Rating, RatingSchema } from '../ratings/schemas/rating.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaderboardCacheMetadata.name, schema: LeaderboardCacheMetadataSchema },
      { name: Rating.name, schema: RatingSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
