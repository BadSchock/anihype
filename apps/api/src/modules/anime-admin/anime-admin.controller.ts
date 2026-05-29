import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { AnimeAdminService } from './anime-admin.service';
import { UpdateAnimeAdminDto, UpdateEpisodeAdminDto } from './dto/anime-admin.dto';

@ApiTags('Admin — Anime')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/anime')
export class AnimeAdminController {
  constructor(private readonly service: AnimeAdminService) {}

  @Get(':slug')
  @ApiOperation({ summary: '[ADMIN] Dados do anime para edição' })
  getForEdit(@Param('slug') slug: string) {
    return this.service.getForEdit(slug);
  }

  @Patch(':slug')
  @ApiOperation({ summary: '[ADMIN] Atualizar capa, banner, trailer, streaming e lock' })
  updateAnime(@Param('slug') slug: string, @Body() dto: UpdateAnimeAdminDto) {
    return this.service.updateAnime(slug, dto);
  }

  @Patch(':slug/episodes/:number')
  @ApiOperation({ summary: '[ADMIN] Atualizar horário/título/thumbnail de episódio' })
  updateEpisode(
    @Param('slug') slug: string,
    @Param('number', ParseIntPipe) number: number,
    @Body() dto: UpdateEpisodeAdminDto,
  ) {
    return this.service.updateEpisode(slug, number, dto);
  }
}
