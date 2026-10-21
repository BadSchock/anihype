import {
  Controller,
  DefaultValuePipe,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/roles.decorator';
import { AnimeService } from './anime.service';
import { AnimeQueryDto } from './dto/anime-query.dto';
import { RankingService } from '../ranking/ranking.service';
import { SyncService } from '../sync/sync.service';

@ApiTags('Anime')
@Controller('anime')
export class AnimeController {
  private readonly logger = new Logger(AnimeController.name);

  constructor(
    private readonly animeService: AnimeService,
    private readonly rankingService: RankingService,
    private readonly syncService: SyncService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar e buscar animes com paginação e filtros' })
  async findMany(@Query() query: AnimeQueryDto) {
    if (query.search && query.search.trim().length >= 2 && query.page === 1) {
      try {
        await this.syncService.ensureSearchCatalog(query.search);
      } catch (err) {
        this.logger.warn(`Busca externa falhou para "${query.search}": ${String(err)}`);
      }
    }
    return this.animeService.findMany(query);
  }

  /** Must stay above `:idOrSlug` or Nest treats "ranking" as a slug. */
  @Public()
  @Get('ranking')
  @ApiOperation({ summary: 'Top animes por nota da comunidade (mín. 10 avaliações)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRanking(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.rankingService.getAnimeRanking(limit);
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Buscar anime por ID numérico ou slug' })
  @ApiParam({ name: 'idOrSlug', description: 'ID numérico ou slug do anime', example: 'shingeki-no-kyojin' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.animeService.findByIdOrSlug(idOrSlug);
  }
}
