import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { UsersService } from './users.service.js';
import { RatingsService } from '../ratings/ratings.service.js';
import { SetLocaleDto } from './dto/set-locale.dto.js';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ratingsService: RatingsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: { user: { sub: string } }) {
    const user = await this.usersService.getById(req.user.sub);
    const rating = await this.ratingsService.getOrCreateRating(req.user.sub);

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      rating: rating.rating,
      gamesPlayed: rating.gamesPlayed,
      locale: user.locale,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/locale')
  async setLocale(@Req() req: { user: { sub: string } }, @Body() dto: SetLocaleDto) {
    await this.usersService.setLocale(req.user.sub, dto.locale);
    return { ok: true, locale: dto.locale };
  }
}
