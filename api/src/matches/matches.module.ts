import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from './schemas/match.schema.js';
import { MatchMove, MatchMoveSchema } from './schemas/match-move.schema.js';
import {
  MatchPlayerSnapshot,
  MatchPlayerSnapshotSchema,
} from './schemas/match-player-snapshot.schema.js';
import { MatchesService } from './matches.service.js';
import { MatchesController } from './matches.controller.js';
import { MatchRuntimeService } from './match-runtime.service.js';
import { RatingsModule } from '../ratings/ratings.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: MatchMove.name, schema: MatchMoveSchema },
      { name: MatchPlayerSnapshot.name, schema: MatchPlayerSnapshotSchema },
    ]),
    RatingsModule,
    AuditModule,
  ],
  providers: [MatchesService, MatchRuntimeService],
  controllers: [MatchesController],
  exports: [MatchesService, MatchRuntimeService, MongooseModule],
})
export class MatchesModule {}
