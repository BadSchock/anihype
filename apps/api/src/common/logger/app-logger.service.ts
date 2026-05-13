import { Injectable, LoggerService, Scope } from '@nestjs/common';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context?: string;

  setContext(context: string): void {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ?? this.context ?? 'App';
    const levelTag = level.toUpperCase().padEnd(7);
    return `[${timestamp}] ${levelTag} [${ctx}] ${message}`;
  }

  log(message: string, context?: string): void {
    console.log('\x1b[32m%s\x1b[0m', this.formatMessage('log', message, context));
  }

  error(message: string, trace?: string, context?: string): void {
    console.error('\x1b[31m%s\x1b[0m', this.formatMessage('error', message, context));
    if (trace) {
      console.error('\x1b[31m%s\x1b[0m', trace);
    }
  }

  warn(message: string, context?: string): void {
    console.warn('\x1b[33m%s\x1b[0m', this.formatMessage('warn', message, context));
  }

  debug(message: string, context?: string): void {
    if (process.env['NODE_ENV'] !== 'production') {
      console.debug('\x1b[34m%s\x1b[0m', this.formatMessage('debug', message, context));
    }
  }

  verbose(message: string, context?: string): void {
    if (process.env['NODE_ENV'] !== 'production') {
      console.log('\x1b[36m%s\x1b[0m', this.formatMessage('verbose', message, context));
    }
  }
}
