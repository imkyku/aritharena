import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditEventDocument = HydratedDocument<AuditEvent>;

@Schema({
  collection: 'audit_events',
  timestamps: { createdAt: 'timestamp', updatedAt: false },
})
export class AuditEvent {
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  actor!: string;

  @Prop({ type: Object, required: true })
  context!: Record<string, unknown>;

  @Prop({ enum: ['low', 'medium', 'high', 'critical'], required: true })
  severity!: 'low' | 'medium' | 'high' | 'critical';
}

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);
AuditEventSchema.index({ type: 1, timestamp: -1 });
AuditEventSchema.index({ severity: 1, timestamp: -1 });
