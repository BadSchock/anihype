import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const dbStatus = await this.checkDatabase();

    const overall = dbStatus === 'ok' ? 'ok' : 'degraded';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      service: 'AniHype API',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      checks: {
        database: dbStatus,
      },
    };
  }

  private async checkDatabase(): Promise<'ok' | 'error'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (err) {
      this.logger.error('Database health check failed', err instanceof Error ? err.message : String(err));
      return 'error';
    }
  }
}
