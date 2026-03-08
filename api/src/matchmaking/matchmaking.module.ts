import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MatchmakingQueueMetadata,
  MatchmakingQueueMetadataSchema,
} from './schemas/matchmaking-queue-metadata.schema.js';
import { MatchmakingService } from './matchmaking.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MatchmakingQueueMetadata.name, schema: MatchmakingQueueMetadataSchema },
    ]),
  ],
  providers: [MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
