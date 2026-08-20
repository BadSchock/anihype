import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '../../common/decorators';
import { RankingPeriod, RankingService } from './ranking.service';

@ApiTags('Ranking')
@Controller()
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Public()
  @Get('anime/ranking')
  @ApiOperation({ summary: 'Top animes por nota da comunidade (mín. 10 avaliações)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAnimeRanking(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.rankingService.getAnimeRanking(limit);
  }

  @Public()
  @Get('users/ranking')
  @ApiOperation({ summary: 'Ranking de usuários por Hype XP' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'all'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserRanking(
    @Query('period') period = 'all',
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @CurrentUser('id') userId?: number,
  ) {
    return this.rankingService.getUserRanking({
      period: period as RankingPeriod,
      limit,
      currentUserId: userId,
    });
  }
}
