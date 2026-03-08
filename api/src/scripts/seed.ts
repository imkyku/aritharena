import 'dotenv/config';
import mongoose from 'mongoose';
import { UserSchema } from '../users/schemas/user.schema.js';
import { RatingSchema } from '../ratings/schemas/rating.schema.js';

const UserModel = mongoose.model('SeedUser', UserSchema, 'users');
const RatingModel = mongoose.model('SeedRating', RatingSchema, 'ratings');

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(mongoUri);

  const seedUsers = [
    {
      telegramId: '100000001',
      username: 'arena_alpha',
      firstName: 'Alpha',
      lastName: null,
      locale: 'ru',
      lastSeenAt: new Date(),
    },
    {
      telegramId: '100000002',
      username: 'arena_beta',
      firstName: 'Beta',
      lastName: null,
      locale: 'en',
      lastSeenAt: new Date(),
    },
  ];

  for (const item of seedUsers) {
    const user = await UserModel.findOneAndUpdate(
      { telegramId: item.telegramId },
      {
        $set: item,
      },
      { upsert: true, new: true },
    );

    await RatingModel.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          rating: 1000,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          provisional: true,
        },
      },
      { upsert: true },
    );
  }

  await mongoose.disconnect();
  process.stdout.write('Seed completed\n');
}

void run();
