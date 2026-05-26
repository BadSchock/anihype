import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/roles.decorator';
import { AnimeService } from './anime.service';
import { AnimeQueryDto } from './dto/anime-query.dto';

@ApiTags('Anime')
@Controller('anime')
export class AnimeController {
  constructor(private readonly animeService: AnimeService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar e buscar animes com paginação e filtros' })
  findMany(@Query() query: AnimeQueryDto) {
    return this.animeService.findMany(query);
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Buscar anime por ID numérico ou slug' })
  @ApiParam({ name: 'idOrSlug', description: 'ID numérico ou slug do anime', example: 'shingeki-no-kyojin' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.animeService.findByIdOrSlug(idOrSlug);
  }
}
