import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/roles.decorator';
import { AnimeService } from './anime.service';
import { AnimeQueryDto } from './dto/anime-query.dto';
import { RankingService } from '../ranking/ranking.service';

@ApiTags('Anime')
@Controller('anime')
export class AnimeController {
  constructor(
    private readonly animeService: AnimeService,
    private readonly rankingService: RankingService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar e buscar animes com paginação e filtros' })
  findMany(@Query() query: AnimeQueryDto) {
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
