import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from './redis/redis.module.js';
import { AppLogger } from './logger/app-logger.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { SocketAuthService } from './guards/socket-auth.service.js';
import { SocketRateLimiterService } from './rate-limit/socket-rate-limiter.service.js';

@Global()
@Module({
  imports: [
    ConfigModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  providers: [AppLogger, JwtAuthGuard, SocketAuthService, SocketRateLimiterService],
  exports: [AppLogger, JwtModule, JwtAuthGuard, SocketAuthService, SocketRateLimiterService, RedisModule],
})
export class CommonModule {}
