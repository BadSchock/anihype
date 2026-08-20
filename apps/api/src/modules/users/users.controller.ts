import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
