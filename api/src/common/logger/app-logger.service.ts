import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService {
  log(message: string, context?: string): void {
    this.write('info', message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.write('error', message, context, { trace });
  }

  warn(message: string, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: string, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: string, context?: string): void {
    this.write('verbose', message, context);
  }

  event(event: string, payload: Record<string, unknown>): void {
    this.write('info', event, 'AuditEvent', payload);
  }

  private write(
    level: 'info' | 'error' | 'warn' | 'debug' | 'verbose',
    message: string,
    context?: string,
    extra?: Record<string, unknown>,
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...extra,
    };

    if (level === 'error') {
      process.stderr.write(`${JSON.stringify(entry)}\n`);
      return;
    }

    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }
}
