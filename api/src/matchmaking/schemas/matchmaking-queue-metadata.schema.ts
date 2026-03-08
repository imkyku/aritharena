import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MatchmakingQueueMetadataDocument = HydratedDocument<MatchmakingQueueMetadata>;

@Schema({
  collection: 'matchmaking_queue_metadata',
  timestamps: true,
})
export class MatchmakingQueueMetadata {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ enum: ['ranked'], required: true })
  mode!: 'ranked';

  @Prop({ required: true })
  rating!: number;

  @Prop({ required: true })
  enqueuedAt!: Date;

  @Prop({ required: true })
  expiresAt!: Date;
}

export const MatchmakingQueueMetadataSchema = SchemaFactory.createForClass(MatchmakingQueueMetadata);
MatchmakingQueueMetadataSchema.index({ userId: 1 }, { unique: true });
MatchmakingQueueMetadataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
MatchmakingQueueMetadataSchema.index({ mode: 1, rating: 1, enqueuedAt: 1 });
