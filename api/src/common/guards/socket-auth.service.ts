import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class SocketAuthService {
  constructor(private readonly jwtService: JwtService) {}

  authenticate(client: Socket): { sub: string; telegramId: string } {
    const token =
      (typeof client.handshake.auth?.token === 'string' && client.handshake.auth.token) ||
      this.extractFromHeader(client.handshake.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing socket token');
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; telegramId: string }>(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid socket token');
    }
  }

  private extractFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7);
  }
}
