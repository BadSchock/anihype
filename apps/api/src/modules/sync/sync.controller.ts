import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnimeSeason } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { SyncService } from './sync.service';
import { CronService } from './cron.service';

class SyncByIdDto {
  @ApiProperty({ description: 'ID no AniList' })
  @IsInt()
  @Min(1)
  anilistId!: number;
}

class SyncByMalDto {
  @ApiProperty({ description: 'MAL ID (MyAnimeList)' })
  @IsInt()
  @Min(1)
  malId!: number;
}

class SyncBySearchDto {
  @ApiProperty({ description: 'Título para busca no AniList' })
  @IsString()
  search!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

class SyncSeasonDto {
  @ApiProperty({ enum: AnimeSeason, example: 'SPRING', description: 'Temporada AniList' })
  @IsEnum(AnimeSeason)
  season!: AnimeSeason;

  @ApiProperty({ example: 2026, description: 'Ano da temporada' })
  @IsInt()
  @Min(1960)
  seasonYear!: number;

  @ApiPropertyOptional({
    description: 'Importar só animes em exibição (RELEASING)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  airingOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Pausa entre cada anime em ms (rate limit AniList)',
    default: 800,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  delayMs?: number;
}

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
@Roles('ADMIN')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly cronService: CronService,
  ) {}

  @Post('anilist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Sincronizar anime pelo AniList ID' })
  syncAniList(@Body() dto: SyncByIdDto) {
    return this.syncService.syncByAniListId(dto.anilistId);
  }

  @Post('mal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Sincronizar anime pelo MAL ID (Jikan)' })
  syncMal(@Body() dto: SyncByMalDto) {
    return this.syncService.syncByMalId(dto.malId);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Buscar e sincronizar animes por título (AniList)' })
  syncSearch(@Body() dto: SyncBySearchDto) {
    return this.syncService.syncBySearch(dto.search);
  }

  @Get('season/defaults')
  @ApiOperation({ summary: '[ADMIN] Temporada anime atual (calendário AniList)' })
  getSeasonDefaults() {
    return SyncService.getCurrentSeason();
  }

  @Post('season')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[ADMIN] Importar temporada inteira via AniList (paginado, com delay)',
  })
  syncSeason(@Body() dto: SyncSeasonDto) {
    return this.syncService.syncSeason({
      season: dto.season,
      seasonYear: dto.seasonYear,
      airingOnly: dto.airingOnly,
      delayMs: dto.delayMs,
    });
  }

  @Get('cron/status')
  @ApiOperation({ summary: '[ADMIN] Próxima execução dos crons agendados' })
  getCronStatus() {
    const { season, seasonYear } = SyncService.getCurrentSeason();
    return {
      currentSeason: { season, seasonYear },
      jobs: [
        {
          name: 'daily-season-sync',
          schedule: '0 4 * * * (diário, 04:00 BRT)',
          description: 'Re-sync dos animes em exibição da temporada atual',
        },
        {
          name: 'weekly-full-sync',
          schedule: '0 3 * * 0 (domingo, 03:00 BRT)',
          description: 'Sync completo da temporada (inclui finalizados, OVAs e filmes)',
        },
      ],
    };
  }

  @Post('cron/trigger/daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Disparar re-sync diário manualmente (sem esperar 04:00)' })
  triggerDaily() {
    void this.cronService.dailySeasonSync();
    return { message: 'Re-sync diário disparado em background.' };
  }

  @Post('cron/trigger/weekly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Disparar sync semanal completo manualmente' })
  triggerWeekly() {
    void this.cronService.weeklyFullSync();
    return { message: 'Sync semanal completo disparado em background.' };
  }
}
