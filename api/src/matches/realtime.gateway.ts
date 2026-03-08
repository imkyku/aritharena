import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import {
  friendCreateSchema,
  friendJoinSchema,
  matchmakingJoinSchema,
} from '@arena/shared';
import { MatchmakingService } from '../matchmaking/matchmaking.service.js';
import { MatchesService } from './matches.service.js';
import { MatchRuntimeService } from './match-runtime.service.js';
import { FriendMatchesService } from '../friend-matches/friend-matches.service.js';
import { SocketAuthService } from '../common/guards/socket-auth.service.js';
import { RatingsService } from '../ratings/ratings.service.js';
import { SocketRateLimiterService } from '../common/rate-limit/socket-rate-limiter.service.js';
import { AuditService } from '../audit/audit.service.js';

const matchIdSchema = z.object({ matchId: z.string().min(1) });

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: [process.env.FRONTEND_URL ?? 'http://localhost:5173', 'https://web.telegram.org'],
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly socketsByUser = new Map<string, Set<string>>();

  constructor(
    private readonly matchmakingService: MatchmakingService,
    private readonly matchesService: MatchesService,
    private readonly runtimeService: MatchRuntimeService,
    private readonly friendMatchesService: FriendMatchesService,
    private readonly socketAuthService: SocketAuthService,
    private readonly ratingsService: RatingsService,
    private readonly socketRateLimiter: SocketRateLimiterService,
    private readonly auditService: AuditService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const payload = this.socketAuthService.authenticate(client);
      client.data.userId = payload.sub;
      this.addSocket(payload.sub, client.id);
      client.emit('system:notice', {
        level: 'info',
        message: 'Connected',
        timestamp: Date.now(),
      });

      const active = await this.runtimeService.getActiveMatchByUser(payload.sub);
      if (active) {
        client.emit('match:event', {
          type: 'resume_available',
          matchId: active.matchId,
        });
      }
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      return;
    }

    this.removeSocket(userId, client.id);
    const changedMatches = await this.runtimeService.markDisconnectedForUser(userId);
    for (const match of changedMatches) {
      this.server.to(this.matchRoom(match.matchId)).emit('match:state', this.runtimeService.toClientState(match));
    }
  }

  @SubscribeMessage('matchmaking:join')
  async onMatchmakingJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const userId = this.requireUserId(client);
    matchmakingJoinSchema.parse(payload);
    const limit = await this.socketRateLimiter.checkLimit(`ratelimit:mm:${userId}`, 5, 4);
    if (!limit.allowed) {
      client.emit('match:error', {
        message: 'Too many matchmaking requests',
        timestamp: Date.now(),
      });
      return;
    }

    const rating = await this.ratingsService.getOrCreateRating(userId);
    await this.matchmakingService.joinRankedQueue(userId, rating.rating);

    client.emit('matchmaking:queued', {
      mode: 'ranked',
      joinedAt: Date.now(),
    });

    const pair = await this.matchmakingService.tryMatch(userId);
    if (!pair) {
      return;
    }

    const match = await this.matchesService.createMatch('ranked', [pair.userA, pair.userB]);
    await this.runtimeService.bootstrapMatch(match);

    this.emitToUsers([pair.userA, pair.userB], 'matchmaking:matched', {
      matchId: match._id.toString(),
      players: [pair.userA, pair.userB],
      mode: 'ranked',
      startedAt: match.startedAt?.getTime() ?? Date.now(),
    });

    await this.auditService.log('matchmaking.matched', 'system', {
      matchId: match._id.toString(),
      players: [pair.userA, pair.userB],
    });
  }

  @SubscribeMessage('matchmaking:leave')
  async onMatchmakingLeave(@ConnectedSocket() client: Socket): Promise<void> {
    const userId = this.requireUserId(client);
    await this.matchmakingService.leaveRankedQueue(userId);
    client.emit('match:event', {
      type: 'queue_left',
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('match:join')
  async onMatchJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown): Promise<void> {
    const userId = this.requireUserId(client);
    const parsed = matchIdSchema.parse(payload);

    const state = await this.runtimeService.markConnected(parsed.matchId, userId, true);
    client.join(this.matchRoom(parsed.matchId));

    this.server
      .to(this.matchRoom(parsed.matchId))
      .emit('match:state', this.runtimeService.toClientState(state));

    if (state.status === 'finished') {
      this.server.to(this.matchRoom(parsed.matchId)).emit('match:finished', {
        matchId: state.matchId,
        winnerId: state.winnerId,
        resultType: state.resultType,
      });
    }
  }

  @SubscribeMessage('match:operation')
  async onMatchOperation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const userId = this.requireUserId(client);

    try {
      const parsed = z.object({ matchId: z.string().min(1) }).parse(payload);
      const limiterKey = `ratelimit:op:${userId}:${parsed.matchId}:${Math.floor(Date.now() / 1000)}`;
      const limit = await this.socketRateLimiter.checkLimit(limiterKey, 2, 8);
      if (!limit.allowed) {
        throw new BadRequestException('Operation rate limit exceeded');
      }

      const state = await this.runtimeService.submitOperation(parsed.matchId, userId, payload);
      this.server
        .to(this.matchRoom(parsed.matchId))
        .emit('match:state', this.runtimeService.toClientState(state));

      if (state.status === 'finished') {
        this.server.to(this.matchRoom(parsed.matchId)).emit('match:finished', {
          matchId: state.matchId,
          winnerId: state.winnerId,
          resultType: state.resultType,
        });
      }
    } catch (error) {
      client.emit('match:error', {
        message: (error as Error).message,
        timestamp: Date.now(),
      });
    }
  }

  @SubscribeMessage('match:ping')
  onMatchPing(@ConnectedSocket() client: Socket): void {
    client.emit('system:notice', {
      level: 'info',
      type: 'pong',
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('match:surrender')
  async onMatchSurrender(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const userId = this.requireUserId(client);
    const parsed = matchIdSchema.parse(payload);

    const state = await this.runtimeService.surrender(parsed.matchId, userId);
    this.server.to(this.matchRoom(parsed.matchId)).emit('match:state', this.runtimeService.toClientState(state));
    this.server.to(this.matchRoom(parsed.matchId)).emit('match:finished', {
      matchId: state.matchId,
      winnerId: state.winnerId,
      resultType: state.resultType,
    });
  }

  @SubscribeMessage('friendmatch:create')
  async onFriendCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const userId = this.requireUserId(client);
    friendCreateSchema.parse(payload);
    const invite = await this.friendMatchesService.createInvite(userId);

    client.emit('match:event', {
      type: 'friend_invite_created',
      code: invite.code,
      expiresInSec: 600,
    });
  }

  @SubscribeMessage('friendmatch:join')
  async onFriendJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const userId = this.requireUserId(client);
    const parsed = friendJoinSchema.parse(payload);

    try {
      const invite = await this.friendMatchesService.consumeInvite(parsed.code, userId);
      const match = await this.matchesService.createMatch('friendly', [invite.hostUserId, invite.joinerUserId]);
      await this.runtimeService.bootstrapMatch(match);

      this.emitToUsers([invite.hostUserId, invite.joinerUserId], 'matchmaking:matched', {
        matchId: match._id.toString(),
        players: [invite.hostUserId, invite.joinerUserId],
        mode: 'friendly',
        startedAt: match.startedAt?.getTime() ?? Date.now(),
      });
    } catch (error) {
      client.emit('match:error', {
        message: (error as Error).message,
        timestamp: Date.now(),
      });
    }
  }

  private requireUserId(client: Socket): string {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      throw new BadRequestException('Unauthenticated socket');
    }
    return userId;
  }

  private matchRoom(matchId: string): string {
    return `match:${matchId}`;
  }

  private addSocket(userId: string, socketId: string): void {
    const existing = this.socketsByUser.get(userId);
    if (existing) {
      existing.add(socketId);
      return;
    }

    this.socketsByUser.set(userId, new Set([socketId]));
  }

  private removeSocket(userId: string, socketId: string): void {
    const existing = this.socketsByUser.get(userId);
    if (!existing) {
      return;
    }

    existing.delete(socketId);
    if (existing.size === 0) {
      this.socketsByUser.delete(userId);
    }
  }

  private emitToUsers(userIds: string[], event: string, payload: Record<string, unknown>): void {
    for (const userId of userIds) {
      const socketIds = this.socketsByUser.get(userId);
      if (!socketIds) {
        continue;
      }

      for (const socketId of socketIds) {
        this.server.to(socketId).emit(event, payload);
      }
    }
  }
}
