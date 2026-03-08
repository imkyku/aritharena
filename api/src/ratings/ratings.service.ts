import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Rating } from './schemas/rating.schema.js';

export interface EloResult {
  newA: number;
  newB: number;
  deltaA: number;
  deltaB: number;
}

function expectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

function kFactor(gamesPlayed: number, rating: number): number {
  if (gamesPlayed < 30) {
    return 40;
  }
  if (rating >= 1800) {
    return 16;
  }
  return 24;
}

export function calculateElo(
  ratingA: number,
  ratingB: number,
  gamesA: number,
  gamesB: number,
  scoreA: number,
): EloResult {
  const scoreB = 1 - scoreA;
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = expectedScore(ratingB, ratingA);

  const nextA = Math.round(ratingA + kFactor(gamesA, ratingA) * (scoreA - expectedA));
  const nextB = Math.round(ratingB + kFactor(gamesB, ratingB) * (scoreB - expectedB));

  return {
    newA: nextA,
    newB: nextB,
    deltaA: nextA - ratingA,
    deltaB: nextB - ratingB,
  };
}

@Injectable()
export class RatingsService {
  constructor(@InjectModel(Rating.name) private readonly ratingModel: Model<Rating>) {}

  async getOrCreateRating(userId: string | Types.ObjectId) {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const existing = await this.ratingModel.findOne({ userId: objectId }).exec();
    if (existing) {
      return existing;
    }

    return this.ratingModel.create({ userId: objectId });
  }

  async getTop(limit = 50) {
    return this.ratingModel
      .find({})
      .sort({ rating: -1, gamesPlayed: -1, updatedAt: 1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async applyRatedResult(
    playerAId: Types.ObjectId,
    playerBId: Types.ObjectId,
    scoreA: number,
    session: ClientSession,
  ): Promise<{
    aBefore: number;
    aAfter: number;
    bBefore: number;
    bAfter: number;
  }> {
    const [ratingA, ratingB] = await Promise.all([
      this.getOrCreateRating(playerAId),
      this.getOrCreateRating(playerBId),
    ]);

    const result = calculateElo(
      ratingA.rating,
      ratingB.rating,
      ratingA.gamesPlayed,
      ratingB.gamesPlayed,
      scoreA,
    );

    ratingA.rating = result.newA;
    ratingB.rating = result.newB;

    ratingA.gamesPlayed += 1;
    ratingB.gamesPlayed += 1;

    if (scoreA === 1) {
      ratingA.wins += 1;
      ratingB.losses += 1;
    } else if (scoreA === 0) {
      ratingA.losses += 1;
      ratingB.wins += 1;
    } else {
      ratingA.draws += 1;
      ratingB.draws += 1;
    }

    ratingA.provisional = ratingA.gamesPlayed < 30;
    ratingB.provisional = ratingB.gamesPlayed < 30;

    await ratingA.save({ session });
    await ratingB.save({ session });

    return {
      aBefore: result.newA - result.deltaA,
      aAfter: result.newA,
      bBefore: result.newB - result.deltaB,
      bAfter: result.newB,
    };
  }
}
