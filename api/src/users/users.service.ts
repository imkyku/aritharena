import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema.js';

interface TelegramUserInput {
  id: string;
  username?: string;
  first_name: string;
  last_name?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async findOrCreateFromTelegram(input: TelegramUserInput) {
    const existing = await this.userModel.findOne({ telegramId: input.id }).exec();
    if (existing) {
      existing.lastSeenAt = new Date();
      existing.username = input.username ?? null;
      existing.firstName = input.first_name;
      existing.lastName = input.last_name ?? null;
      await existing.save();
      return existing;
    }

    return this.userModel.create({
      telegramId: input.id,
      username: input.username ?? null,
      firstName: input.first_name,
      lastName: input.last_name ?? null,
      locale: 'ru',
      lastSeenAt: new Date(),
    });
  }

  async getById(userId: string | Types.ObjectId) {
    return this.userModel.findById(userId).exec();
  }

  async setLocale(userId: string, locale: 'ru' | 'en') {
    await this.userModel.updateOne({ _id: userId }, { locale }).exec();
  }
}
