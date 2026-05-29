import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { HypeService } from './hype.service';

@ApiTags('Hype')
@Controller()
export class HypeController {
  constructor(private readonly hypeService: HypeService) {}

  @Get('users/:username/hype')
  @Public()
  @ApiOperation({ summary: 'XP e nível Hype de um usuário' })
  async getUserHype(@Param('username') username: string) {
    const stats = await this.hypeService.getStatsByUsername(username);
    if (!stats) throw new NotFoundException('Usuário não encontrado');
    return stats;
  }
}
