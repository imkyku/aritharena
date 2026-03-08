import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SeasonDocument = HydratedDocument<Season>;

@Schema({
  collection: 'seasons',
  timestamps: true,
})
export class Season {
  @Prop({ required: true, unique: true })
  key!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  startsAt!: Date;

  @Prop({ required: true })
  endsAt!: Date;

  @Prop({ required: true, default: true })
  active!: boolean;
}

export const SeasonSchema = SchemaFactory.createForClass(Season);
SeasonSchema.index({ key: 1 }, { unique: true });
SeasonSchema.index({ active: 1, startsAt: -1 });
