import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { TelegramAuthDto } from './dto/telegram-auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async telegramAuth(@Body() dto: TelegramAuthDto) {
    return this.authService.authWithTelegram(dto.initData);
  }
}
