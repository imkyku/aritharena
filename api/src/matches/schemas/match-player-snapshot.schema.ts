import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MatchPlayerSnapshotDocument = HydratedDocument<MatchPlayerSnapshot>;

@Schema({
  collection: 'match_player_snapshots',
  timestamps: true,
})
export class MatchPlayerSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'Match', required: true })
  matchId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  currentValue!: string;

  @Prop({ required: true })
  storedElixir!: number;

  @Prop({ required: true })
  lastElixirUpdateAt!: Date;

  @Prop({ required: true, default: true })
  connected!: boolean;

  @Prop({ required: true, default: false })
  surrendered!: boolean;

  @Prop({ required: true, default: 0 })
  version!: number;
}

export const MatchPlayerSnapshotSchema = SchemaFactory.createForClass(MatchPlayerSnapshot);
MatchPlayerSnapshotSchema.index({ matchId: 1, userId: 1 }, { unique: true });
MatchPlayerSnapshotSchema.index({ matchId: 1, updatedAt: -1 });
