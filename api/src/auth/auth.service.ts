import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { validateTelegramInitData } from './telegram-init-data.util.js';
import { RatingsService } from '../ratings/ratings.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly ratingsService: RatingsService,
  ) {}

  async authWithTelegram(initData: string): Promise<{
    accessToken: string;
    user: {
      id: string;
      telegramId: string;
      username: string | null;
      firstName: string;
      lastName: string | null;
      locale: 'ru' | 'en';
      rating: number;
      gamesPlayed: number;
    };
  }> {
    const botToken = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    const maxAgeSec = this.configService.getOrThrow<number>('TELEGRAM_INIT_MAX_AGE_SEC');
    const allowDevBypass = this.configService.get<boolean>('ALLOW_DEV_TELEGRAM_BYPASS') ?? false;

    let tgUser: ReturnType<typeof validateTelegramInitData>;
    try {
      if (allowDevBypass && initData.startsWith('dev:')) {
        const [, id, firstName = 'Dev', username] = initData.split(':');
        if (!id) {
          throw new Error('Invalid dev initData format');
        }
        tgUser = {
          id,
          first_name: firstName,
          username,
        };
      } else {
        tgUser = validateTelegramInitData(initData, botToken, maxAgeSec);
      }
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }

    const user = await this.usersService.findOrCreateFromTelegram(tgUser);
    const rating = await this.ratingsService.getOrCreateRating(user._id);

    const accessToken = this.jwtService.sign({
      sub: user._id.toString(),
      telegramId: user.telegramId,
    });

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        locale: user.locale,
        rating: rating.rating,
        gamesPlayed: rating.gamesPlayed,
      },
    };
  }
}
