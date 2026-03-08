import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './common/config/env.schema.js';
import { CommonModule } from './common/common.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { RatingsModule } from './ratings/ratings.module.js';
import { MatchmakingModule } from './matchmaking/matchmaking.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { LeaderboardModule } from './leaderboard/leaderboard.module.js';
import { FriendMatchesModule } from './friend-matches/friend-matches.module.js';
import { HealthModule } from './health/health.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AuditModule } from './audit/audit.module.js';
import { SeasonsModule } from './seasons/seasons.module.js';
import { RealtimeGateway } from './matches/realtime.gateway.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.getOrThrow<number>('RATE_LIMIT_TTL_SEC') * 1000,
          limit: configService.getOrThrow<number>('RATE_LIMIT_MAX'),
        },
      ],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    CommonModule,
    AuditModule,
    RatingsModule,
    UsersModule,
    AuthModule,
    MatchmakingModule,
    MatchesModule,
    LeaderboardModule,
    FriendMatchesModule,
    HealthModule,
    AdminModule,
    SeasonsModule,
  ],
  providers: [
    RealtimeGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
