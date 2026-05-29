import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TopAnimeService } from './top-anime.service';
import { SetTopAnimeDto } from './dto/top-anime.dto';

@ApiTags('Top Anime')
@Controller()
export class TopAnimeController {
  constructor(private readonly service: TopAnimeService) {}

  @Get('users/:username/top-anime')
  @Public()
  @ApiOperation({ summary: 'Top 4 animes favoritos de um usuário' })
  getTopAnime(@Param('username') username: string) {
    return this.service.getTopAnime(username);
  }

  @Put('users/me/top-anime')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Definir meu Top 4 (substitui a lista atual)' })
  setTopAnime(
    @CurrentUser('id') userId: number,
    @Body() dto: SetTopAnimeDto,
  ) {
    return this.service.setTopAnime(userId, dto);
  }
}
