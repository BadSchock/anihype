import {
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '../../common/decorators';
import { UsersService } from './users.service';
import { RankingPeriod, RankingService } from '../ranking/ranking.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rankingService: RankingService,
  ) {}

  /** Must stay above `:username` or Nest treats "ranking" as a username. */
  @Public()
  @Get('ranking')
  @ApiOperation({ summary: 'Ranking de usuários por Hype XP' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'all'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRanking(
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

  @Public()
  @Get(':username')
  @ApiOperation({ summary: 'Perfil público de um usuário pelo username' })
  @ApiParam({ name: 'username', type: String })
  async getPublicProfile(@Param('username') username: string) {
    const user = await this.usersService.getPublicProfile(username);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }
}
