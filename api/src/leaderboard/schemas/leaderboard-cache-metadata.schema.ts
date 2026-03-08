import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LeaderboardCacheMetadataDocument = HydratedDocument<LeaderboardCacheMetadata>;

@Schema({
  collection: 'leaderboard_cache_metadata',
  timestamps: true,
})
export class LeaderboardCacheMetadata {
  @Prop({ required: true, unique: true })
  key!: string;

  @Prop({ required: true })
  generatedAt!: Date;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ required: true, default: false })
  stale!: boolean;
}

export const LeaderboardCacheMetadataSchema = SchemaFactory.createForClass(LeaderboardCacheMetadata);
LeaderboardCacheMetadataSchema.index({ key: 1 }, { unique: true });
LeaderboardCacheMetadataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
