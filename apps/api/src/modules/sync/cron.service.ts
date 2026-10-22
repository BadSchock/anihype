import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { SyncService } from './sync.service';

/** Abaixo disso a temporada atual é considerada vazia e ganha import completo ao subir a API. */
const MIN_SEASON_ANIME = 5;
/** Espera a API terminar de subir antes de falar com a AniList. */
const BOOT_SYNC_DELAY_MS = 20_000;

@Injectable()
export class CronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CronService.name);
  private seasonSyncRunning = false;

  constructor(
    private readonly sync: SyncService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Se a API ficou fora do ar na hora do cron (ou o banco é novo), a temporada
   * atual pode estar vazia. Nesse caso importa tudo em segundo plano.
   * Desligue com SYNC_ON_BOOT=false.
   */
  onApplicationBootstrap(): void {
    if (process.env['SYNC_ON_BOOT'] === 'false') return;
    if (process.env['NODE_ENV'] === 'test') return;

    const timer = setTimeout(() => {
      void this.syncSeasonIfEmpty();
    }, BOOT_SYNC_DELAY_MS);
    timer.unref();
  }

  async syncSeasonIfEmpty(): Promise<void> {
    const { season, seasonYear } = SyncService.getCurrentSeason();

    try {
      const count = await this.prisma.anime.count({
        where: { season, seasonYear, deletedAt: null },
      });

      if (count >= MIN_SEASON_ANIME) {
        this.logger.log(`[Boot] ${season} ${seasonYear} já tem ${count} animes, nada a importar.`);
        return;
      }

      this.logger.log(
        `[Boot] ${season} ${seasonYear} tem só ${count} animes. Importando a temporada completa.`,
      );
      await this.runSeasonSync('Boot', { season, seasonYear, airingOnly: false, delayMs: 1200 });
    } catch (err) {
      this.logger.error(`[Boot] Verificação da temporada falhou: ${String(err)}`);
    }
  }

  /**
   * Re-sync diário: roda todo dia às 04:00 (America/Sao_Paulo).
   * Sincroniza os animes em exibição da temporada atual para manter
   * scores, status e datas de episódios sempre atualizados.
   */
  @Cron('0 4 * * *', { name: 'daily-season-sync', timeZone: 'America/Sao_Paulo' })
  async dailySeasonSync() {
    const { season, seasonYear } = SyncService.getCurrentSeason();
    await this.runSeasonSync('Cron diário', {
      season,
      seasonYear,
      airingOnly: true,
      delayMs: 1000,
    });
  }

  /**
   * Sync semanal completo: todo domingo às 03:00 (America/Sao_Paulo).
   * Sincroniza TODOS os animes da temporada (não só os em exibição),
   * garantindo que finais, OVAs e filmes também sejam importados.
   */
  @Cron('0 3 * * 0', { name: 'weekly-full-sync', timeZone: 'America/Sao_Paulo' })
  async weeklyFullSync() {
    const { season, seasonYear } = SyncService.getCurrentSeason();
    await this.runSeasonSync('Cron semanal', {
      season,
      seasonYear,
      airingOnly: false,
      delayMs: 1200,
    });
  }

  /** Evita dois imports da temporada ao mesmo tempo (boot + cron, por exemplo). */
  private async runSeasonSync(
    label: string,
    options: Parameters<SyncService['syncSeason']>[0],
  ): Promise<void> {
    if (this.seasonSyncRunning) {
      this.logger.warn(`[${label}] Já existe um import de temporada em andamento. Pulando.`);
      return;
    }

    this.seasonSyncRunning = true;
    this.logger.log(
      `[${label}] Iniciando sync — ${options.season} ${options.seasonYear}` +
        (options.airingOnly ? ' (só em exibição)' : ''),
    );

    try {
      const result = await this.sync.syncSeason(options);
      this.logger.log(
        `[${label}] Concluído: ${result.synced}/${result.totalFound} ok, ` +
          `${result.failed} falhas (${result.created} criados, ${result.updated} atualizados)`,
      );
    } catch (err) {
      this.logger.error(`[${label}] Sync falhou: ${String(err)}`);
    } finally {
      this.seasonSyncRunning = false;
    }
  }
}
