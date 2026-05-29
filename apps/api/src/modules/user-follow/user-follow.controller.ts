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
import { UserFollowService } from './user-follow.service';

@ApiTags('User Follow')
@Controller('users')
export class UserFollowController {
  constructor(private readonly service: UserFollowService) {}

  @Post(':username/follow')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seguir um usuário' })
  follow(
    @Param('username') username: string,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.follow(userId, username);
  }

  @Delete(':username/follow')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deixar de seguir um usuário' })
  unfollow(
    @Param('username') username: string,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.unfollow(userId, username);
  }

  @Get(':username/follow/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar se sigo este usuário' })
  getMyFollowStatus(
    @Param('username') username: string,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.getFollowStatus(userId, username);
  }

  @Public()
  @Get(':username/followers')
  @ApiOperation({ summary: 'Seguidores de um usuário' })
  getFollowers(
    @Param('username') username: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getFollowers(
      username,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 24,
    );
  }

  @Public()
  @Get(':username/following-users')
  @ApiOperation({ summary: 'Usuários que este perfil segue' })
  getFollowingUsers(
    @Param('username') username: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getFollowingUsers(
      username,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 24,
    );
  }

  @Public()
  @Get(':username/social-counts')
  @ApiOperation({ summary: 'Contadores de seguidores/seguindo (usuários)' })
  getSocialCounts(@Param('username') username: string) {
    return this.service.getSocialCounts(username);
  }
}
