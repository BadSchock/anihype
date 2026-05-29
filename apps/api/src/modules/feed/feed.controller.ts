import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeedService } from './feed.service';

@ApiTags('Feed')
@Controller()
export class FeedController {
  constructor(private readonly service: FeedService) {}

  @Get('feed/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Feed de atividade de quem eu sigo' })
  getMyFeed(
    @CurrentUser('sub') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMyFeed(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('users/:username/activity')
  @ApiOperation({ summary: 'Atividade pública recente de um usuário' })
  getUserActivity(
    @Param('username') username: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getUserActivity(
      username,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 15,
    );
  }
}
