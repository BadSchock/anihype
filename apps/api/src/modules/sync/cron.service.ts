import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SyncService } from './sync.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly sync: SyncService) {}

  /**
   * Re-sync diário: roda todo dia às 04:00 (horário do servidor / UTC).
   * Sincroniza os animes em exibição da temporada atual para manter
   * scores, status e datas de episódios sempre atualizados.
   */
  @Cron('0 4 * * *', { name: 'daily-season-sync', timeZone: 'America/Sao_Paulo' })
  async dailySeasonSync() {
    const { season, seasonYear } = SyncService.getCurrentSeason();
    this.logger.log(`[Cron] Iniciando re-sync diário — ${season} ${seasonYear} (só em exibição)`);

    try {
      const result = await this.sync.syncSeason({
        season,
        seasonYear,
        airingOnly: true,
        delayMs: 1000,
      });

      this.logger.log(
        `[Cron] Re-sync concluído: ${result.synced}/${result.totalFound} ok, ` +
          `${result.failed} falhas (${result.created} criados, ${result.updated} atualizados)`,
      );
    } catch (err) {
      this.logger.error(`[Cron] Re-sync diário falhou: ${String(err)}`);
    }
  }

  /**
   * Sync semanal completo: todo domingo às 03:00.
   * Sincroniza TODOS os animes da temporada (não só os em exibição),
   * garantindo que finais, OVAs e filmes também sejam importados.
   */
  @Cron('0 3 * * 0', { name: 'weekly-full-sync', timeZone: 'America/Sao_Paulo' })
  async weeklyFullSync() {
    const { season, seasonYear } = SyncService.getCurrentSeason();
    this.logger.log(`[Cron] Iniciando sync semanal completo — ${season} ${seasonYear}`);

    try {
      const result = await this.sync.syncSeason({
        season,
        seasonYear,
        airingOnly: false,
        delayMs: 1200,
      });

      this.logger.log(
        `[Cron] Sync semanal concluído: ${result.synced}/${result.totalFound} ok, ` +
          `${result.failed} falhas`,
      );
    } catch (err) {
      this.logger.error(`[Cron] Sync semanal falhou: ${String(err)}`);
    }
  }
}
