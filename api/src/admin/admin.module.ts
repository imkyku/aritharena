import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [AdminController],
})
export class AdminModule {}
