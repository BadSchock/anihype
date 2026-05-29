import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnimeFollowService } from './anime-follow.service';

@ApiTags('Anime Follow')
@Controller()
export class AnimeFollowController {
  constructor(private readonly service: AnimeFollowService) {}

  @Post('anime/:slug/follow')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seguir um anime' })
  follow(@Param('slug') slug: string, @CurrentUser('id') userId: number) {
    return this.service.follow(userId, slug);
  }

  @Delete('anime/:slug/follow')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deixar de seguir um anime' })
  unfollow(@Param('slug') slug: string, @CurrentUser('id') userId: number) {
    return this.service.unfollow(userId, slug);
  }

  @Get('anime/:slug/follow/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar se estou seguindo este anime' })
  getMyFollowStatus(@Param('slug') slug: string, @CurrentUser('id') userId: number) {
    return this.service.getFollowStatus(userId, slug);
  }

  @Get('users/me/following')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar animes que eu sigo' })
  getMyFollowing(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getFollowingByUserId(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 24,
    );
  }

  @Get('users/:username/following')
  @Public()
  @ApiOperation({ summary: 'Listar animes que um usuário segue (perfil público)' })
  getUserFollowing(
    @Param('username') username: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getFollowingByUsername(
      username,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 24,
    );
  }
}
