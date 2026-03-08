import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { MatchesService } from './matches.service.js';

@Controller()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('matches/:id')
  async getMatch(@Param('id') matchId: string, @Req() req: { user: { sub: string } }) {
    return this.matchesService.getMatchForUser(matchId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/history')
  async getHistory(@Req() req: { user: { sub: string } }) {
    return this.matchesService.getHistory(req.user.sub, 30);
  }
}
