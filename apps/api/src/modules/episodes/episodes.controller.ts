import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/roles.decorator';
import { EpisodesService } from './episodes.service';
import { EpisodeQueryDto } from './dto/episode-query.dto';

@ApiTags('Episodes')
@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  // --------------------------------------------------------------------------
  // Lançamentos de hoje  →  GET /episodes/today
  // --------------------------------------------------------------------------
  @Public()
  @Get('today')
  @ApiOperation({ summary: 'Episódios que vão ao ar hoje (UTC)' })
  findToday() {
    return this.episodesService.findTodayReleases();
  }

  // --------------------------------------------------------------------------
  // Calendário semanal  →  GET /episodes/calendar?days=7
  // --------------------------------------------------------------------------
  @Public()
  @Get('calendar')
  @ApiOperation({ summary: 'Calendário de lançamentos agrupado por data (padrão: próximos 7 dias)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Número de dias (1-14)', example: 7 })
  findCalendar(@Query('days') days?: string) {
    const numDays = days ? Math.min(14, Math.max(1, parseInt(days, 10) || 7)) : 7;
    return this.episodesService.findWeeklyCalendar(numDays);
  }

  // --------------------------------------------------------------------------
  // Episódio por ID  →  GET /episodes/:id
  // --------------------------------------------------------------------------
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Buscar episódio por ID' })
  @ApiParam({ name: 'id', type: Number })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.episodesService.findById(id);
  }

  // --------------------------------------------------------------------------
  // Episódios de um anime  →  GET /anime/:animeId/episodes
  // --------------------------------------------------------------------------
}

// Controller separado para rotas aninhadas em /anime/:animeId/episodes
import { Controller as NestController } from '@nestjs/common';

@ApiTags('Anime')
@NestController('anime/:animeId/episodes')
export class AnimeEpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar episódios de um anime com paginação' })
  @ApiParam({ name: 'animeId', type: Number })
  findByAnime(
    @Param('animeId', ParseIntPipe) animeId: number,
    @Query() query: EpisodeQueryDto,
  ) {
    return this.episodesService.findByAnime(animeId, query);
  }

  @Public()
  @Get('number/:number')
  @ApiOperation({ summary: 'Buscar episódio de um anime pelo número' })
  @ApiParam({ name: 'animeId', type: Number })
  @ApiParam({ name: 'number', type: Number })
  findByNumber(
    @Param('animeId', ParseIntPipe) animeId: number,
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.episodesService.findByAnimeAndNumber(animeId, number);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Buscar episódio de um anime pelo slug' })
  @ApiParam({ name: 'animeId', type: Number })
  @ApiParam({ name: 'slug', type: String })
  findBySlug(
    @Param('animeId', ParseIntPipe) animeId: number,
    @Param('slug') slug: string,
  ) {
    return this.episodesService.findByAnimeAndSlug(animeId, slug);
  }
}
