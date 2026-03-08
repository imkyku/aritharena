import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MatchDocument = HydratedDocument<Match>;

@Schema({
  collection: 'matches',
  timestamps: true,
})
export class Match {
  @Prop({ enum: ['ranked', 'friendly'], required: true })
  type!: 'ranked' | 'friendly';

  @Prop({ enum: ['waiting', 'active', 'finished', 'cancelled'], required: true })
  status!: 'waiting' | 'active' | 'finished' | 'cancelled';

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  playerIds!: Types.ObjectId[];

  @Prop({ required: true })
  startNumber!: string;

  @Prop({ required: true })
  targetNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  winnerId!: Types.ObjectId | null;

  @Prop({ enum: ['exact', 'closest', 'surrender', 'draw', null], default: null })
  resultType!: 'exact' | 'closest' | 'surrender' | 'draw' | null;

  @Prop({ default: null })
  startedAt!: Date | null;

  @Prop({ default: null })
  finishedAt!: Date | null;

  @Prop({ default: null })
  durationMs!: number | null;

  @Prop({
    type: Map,
    of: String,
    default: {},
  })
  finalDistances!: Record<string, string>;

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: 'User' },
        before: Number,
        after: Number,
        delta: Number,
      },
    ],
    default: [],
  })
  ratingChanges!: Array<{ userId: Types.ObjectId; before: number; after: number; delta: number }>;

  @Prop({ required: true })
  generationSeed!: string;

  @Prop({
    type: {
      operationCount: Number,
      generatedAt: Date,
    },
    default: {},
  })
  generationMeta!: {
    operationCount: number;
    generatedAt: Date;
  };
}

export const MatchSchema = SchemaFactory.createForClass(Match);
MatchSchema.index({ status: 1, createdAt: -1 });
MatchSchema.index({ playerIds: 1, createdAt: -1 });
