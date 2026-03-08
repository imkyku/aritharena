import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true })
  telegramId!: string;

  @Prop({ default: null })
  username!: string | null;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ default: null })
  lastName!: string | null;

  @Prop({ enum: ['ru', 'en'], default: 'ru' })
  locale!: 'ru' | 'en';

  @Prop({ default: () => new Date() })
  lastSeenAt!: Date;

  @Prop({
    type: {
      banned: { type: Boolean, default: false },
      suspicious: { type: Boolean, default: false },
    },
    default: {},
  })
  flags!: {
    banned: boolean;
    suspicious: boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ telegramId: 1 }, { unique: true });
