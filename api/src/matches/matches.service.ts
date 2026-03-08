import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { generateReachableMatchNumbers } from '@arena/shared';
import { Match, MatchDocument } from './schemas/match.schema.js';
import { MatchMove } from './schemas/match-move.schema.js';
import { MatchPlayerSnapshot } from './schemas/match-player-snapshot.schema.js';
import { RatingsService } from '../ratings/ratings.service.js';
import { AuditService } from '../audit/audit.service.js';

export interface RuntimePlayerFinalState {
  userId: string;
  currentValue: string;
  storedElixir: number;
  lastElixirUpdateAt: number;
  connected: boolean;
  surrendered: boolean;
  lastAcceptedSeq: number;
}

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDocument>,
    @InjectModel(MatchMove.name) private readonly matchMoveModel: Model<MatchMove>,
    @InjectModel(MatchPlayerSnapshot.name)
    private readonly snapshotModel: Model<MatchPlayerSnapshot>,
    @InjectConnection() private readonly connection: Connection,
    private readonly ratingsService: RatingsService,
    private readonly auditService: AuditService,
  ) {}

  async createMatch(type: 'ranked' | 'friendly', playerIds: string[]): Promise<MatchDocument> {
    const generated = generateReachableMatchNumbers();
    const startedAt = new Date(Date.now() + 3_000);

    const match = await this.matchModel.create({
      type,
      status: 'active',
      playerIds: playerIds.map((id) => new Types.ObjectId(id)),
      startNumber: generated.startNumber,
      targetNumber: generated.targetNumber,
      winnerId: null,
      resultType: null,
      startedAt,
      finishedAt: null,
      durationMs: null,
      finalDistances: {},
      ratingChanges: [],
      generationSeed: randomUUID(),
      generationMeta: {
        operationCount: generated.hiddenOperations.length,
        generatedAt: new Date(),
      },
    });

    await this.auditService.log('match.created', 'system', {
      matchId: match._id.toString(),
      type,
      players: playerIds,
    });

    return match;
  }

  async getMatchForUser(matchId: string, userId: string) {
    const match = await this.matchModel.findById(matchId).lean().exec();
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const allowed = match.playerIds.some((id) => id.toString() === userId);
    if (!allowed) {
      throw new NotFoundException('Match not found');
    }

    return {
      ...match,
      _id: match._id.toString(),
      playerIds: match.playerIds.map((id) => id.toString()),
      winnerId: match.winnerId ? match.winnerId.toString() : null,
    };
  }

  async getHistory(userId: string, limit = 20) {
    const objectUserId = new Types.ObjectId(userId);

    const matches = await this.matchModel
      .find({ playerIds: objectUserId, status: 'finished' })
      .sort({ finishedAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return matches.map((match) => ({
      id: match._id.toString(),
      type: match.type,
      status: match.status,
      playerIds: match.playerIds.map((id) => id.toString()),
      startNumber: match.startNumber,
      targetNumber: match.targetNumber,
      winnerId: match.winnerId ? match.winnerId.toString() : null,
      resultType: match.resultType,
      startedAt: match.startedAt,
      finishedAt: match.finishedAt,
      ratingChanges: match.ratingChanges.map((entry) => ({
        userId: entry.userId.toString(),
        before: entry.before,
        after: entry.after,
        delta: entry.delta,
      })),
    }));
  }

  async recordMove(input: {
    matchId: string;
    userId: string;
    seq: number;
    operationType: 'add' | 'sub' | 'mul' | 'div';
    operand: string;
    cost: number;
    beforeValue: string;
    afterValue: string;
    rejectedReason?: string;
  }) {
    await this.matchMoveModel.updateOne(
      {
        matchId: new Types.ObjectId(input.matchId),
        userId: new Types.ObjectId(input.userId),
        seq: input.seq,
      },
      {
        $setOnInsert: {
          matchId: new Types.ObjectId(input.matchId),
          userId: new Types.ObjectId(input.userId),
          seq: input.seq,
          operationType: input.operationType,
          operand: input.operand,
          cost: input.cost,
          beforeValue: input.beforeValue,
          afterValue: input.afterValue,
          rejectedReason: input.rejectedReason ?? null,
        },
      },
      { upsert: true },
    );
  }

  async finalizeMatch(input: {
    matchId: string;
    winnerId: string | null;
    resultType: 'exact' | 'closest' | 'surrender' | 'draw';
    finalDistances: Record<string, string>;
    playerStates: RuntimePlayerFinalState[];
  }) {
    const match = await this.matchModel.findById(input.matchId).exec();
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status === 'finished') {
      return match;
    }

    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        match.status = 'finished';
        match.finishedAt = new Date();
        match.winnerId = input.winnerId ? new Types.ObjectId(input.winnerId) : null;
        match.resultType = input.resultType;
        match.durationMs =
          (match.finishedAt?.getTime() ?? Date.now()) -
          (match.startedAt?.getTime() ?? Date.now());
        match.finalDistances = input.finalDistances;

        const states = input.playerStates;
        await Promise.all(
          states.map((state) =>
            this.snapshotModel.updateOne(
              {
                matchId: match._id,
                userId: new Types.ObjectId(state.userId),
              },
              {
                $set: {
                  currentValue: state.currentValue,
                  storedElixir: state.storedElixir,
                  lastElixirUpdateAt: new Date(state.lastElixirUpdateAt),
                  connected: state.connected,
                  surrendered: state.surrendered,
                  version: state.lastAcceptedSeq,
                },
              },
              { upsert: true, session },
            ),
          ),
        );

        if (match.type === 'ranked') {
          const [aId, bId] = match.playerIds;
          let scoreA = 0.5;
          if (input.winnerId) {
            scoreA = aId.toString() === input.winnerId ? 1 : 0;
          }

          const ratingUpdate = await this.ratingsService.applyRatedResult(aId, bId, scoreA, session);
          match.ratingChanges = [
            {
              userId: aId,
              before: ratingUpdate.aBefore,
              after: ratingUpdate.aAfter,
              delta: ratingUpdate.aAfter - ratingUpdate.aBefore,
            },
            {
              userId: bId,
              before: ratingUpdate.bBefore,
              after: ratingUpdate.bAfter,
              delta: ratingUpdate.bAfter - ratingUpdate.bBefore,
            },
          ];
        }

        await match.save({ session });

        await this.auditService.log(
          'match.finished',
          'system',
          {
            matchId: match._id.toString(),
            winnerId: input.winnerId,
            resultType: input.resultType,
            distances: input.finalDistances,
          },
          'medium',
        );
      });
    } finally {
      await session.endSession();
    }

    return match;
  }
}
