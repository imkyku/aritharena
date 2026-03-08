import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RatingDocument = HydratedDocument<Rating>;

@Schema({
  collection: 'ratings',
  timestamps: { createdAt: false, updatedAt: true },
})
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, default: 1000 })
  rating!: number;

  @Prop({ required: true, default: 0 })
  gamesPlayed!: number;

  @Prop({ required: true, default: 0 })
  wins!: number;

  @Prop({ required: true, default: 0 })
  losses!: number;

  @Prop({ required: true, default: 0 })
  draws!: number;

  @Prop({ required: true, default: true })
  provisional!: boolean;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
RatingSchema.index({ userId: 1 }, { unique: true });
RatingSchema.index({ rating: -1, gamesPlayed: -1 });
