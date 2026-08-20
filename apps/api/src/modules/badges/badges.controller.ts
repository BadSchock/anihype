import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '../../common/decorators';
import { BadgesService } from './badges.service';
import { EquipBadgeDto } from './dto/equip-badge.dto';

@ApiTags('Badges')
@Controller()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Public()
  @Get('users/:username/badges')
  @ApiOperation({ summary: 'Conquistas de um usuário (earned + locked + progresso)' })
  getUserBadges(@Param('username') username: string) {
    return this.badgesService.getBadgesByUsername(username);
  }

  @Patch('users/me/badges/equipped')
  @ApiOperation({ summary: 'Equipar (ou desequipar) uma conquista' })
  equipBadge(
    @CurrentUser('id') userId: number,
    @Body() dto: EquipBadgeDto,
  ) {
    return this.badgesService.equipBadge(userId, dto.badgeId ?? null);
  }
}
