import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MatchMoveDocument = HydratedDocument<MatchMove>;

@Schema({
  collection: 'match_moves',
  timestamps: { createdAt: true, updatedAt: false },
})
export class MatchMove {
  @Prop({ type: Types.ObjectId, ref: 'Match', required: true })
  matchId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  seq!: number;

  @Prop({ enum: ['add', 'sub', 'mul', 'div'], required: true })
  operationType!: 'add' | 'sub' | 'mul' | 'div';

  @Prop({ required: true })
  operand!: string;

  @Prop({ required: true })
  cost!: number;

  @Prop({ required: true })
  beforeValue!: string;

  @Prop({ required: true })
  afterValue!: string;

  @Prop({ default: null })
  rejectedReason!: string | null;
}

export const MatchMoveSchema = SchemaFactory.createForClass(MatchMove);
MatchMoveSchema.index({ matchId: 1, createdAt: 1 });
MatchMoveSchema.index({ matchId: 1, userId: 1, seq: 1 }, { unique: true });
