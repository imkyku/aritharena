import {
  Controller,
  Get,
  Headers,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service.js';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  @Get('audit-events')
  async recentAuditEvents(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Query('limit') limit?: string,
  ) {
    const expected = this.configService.getOrThrow<string>('ADMIN_API_KEY');
    if (adminKey !== expected) {
      throw new ForbiddenException('Invalid admin key');
    }

    return this.auditService.recent(limit ? Number(limit) : 100);
  }
}
