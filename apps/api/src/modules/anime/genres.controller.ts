import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/roles.decorator';
import { AnimeService } from './anime.service';

@ApiTags('Genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly animeService: AnimeService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar gêneros (chips do catálogo)' })
  list() {
    return this.animeService.listGenres();
  }
}
