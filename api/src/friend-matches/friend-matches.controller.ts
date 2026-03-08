import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { FriendMatchesService } from './friend-matches.service.js';
import { CreateFriendMatchDto } from './dto/create-friend-match.dto.js';
import { MatchesService } from '../matches/matches.service.js';
import { MatchRuntimeService } from '../matches/match-runtime.service.js';

@Controller('friend-matches')
export class FriendMatchesController {
  constructor(
    private readonly friendMatchesService: FriendMatchesService,
    private readonly matchesService: MatchesService,
    private readonly runtimeService: MatchRuntimeService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createInvite(@Req() req: { user: { sub: string } }, @Body() _dto: CreateFriendMatchDto) {
    return this.friendMatchesService.createInvite(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':code/join')
  async joinInvite(
    @Req() req: { user: { sub: string } },
    @Param('code') code: string,
  ) {
    const invite = await this.friendMatchesService.consumeInvite(code, req.user.sub);
    const match = await this.matchesService.createMatch('friendly', [invite.hostUserId, invite.joinerUserId]);
    await this.runtimeService.bootstrapMatch(match);
    return {
      matchId: match._id.toString(),
      players: [invite.hostUserId, invite.joinerUserId],
    };
  }
}
