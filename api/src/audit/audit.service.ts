import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditEvent } from './schemas/audit-event.schema.js';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditEvent.name) private readonly auditModel: Model<AuditEvent>) {}

  async log(
    type: string,
    actor: string,
    context: Record<string, unknown>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low',
  ) {
    await this.auditModel.create({
      type,
      actor,
      context,
      severity,
    });
  }

  async recent(limit = 100) {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    return this.auditModel.find({}).sort({ timestamp: -1 }).limit(safeLimit).lean().exec();
  }
}
