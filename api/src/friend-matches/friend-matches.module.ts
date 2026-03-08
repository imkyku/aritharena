import { Module } from '@nestjs/common';
import { FriendMatchesController } from './friend-matches.controller.js';
import { FriendMatchesService } from './friend-matches.service.js';
import { MatchesModule } from '../matches/matches.module.js';

@Module({
  imports: [MatchesModule],
  controllers: [FriendMatchesController],
  providers: [FriendMatchesService],
  exports: [FriendMatchesService],
})
export class FriendMatchesModule {}
