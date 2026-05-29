import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Listar minhas notificações' })
  listMine(
    @CurrentUser('sub') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listForUser(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Contagem de notificações não lidas' })
  unreadCount(@CurrentUser('sub') userId: number) {
    return this.service.getUnreadCount(userId);
  }

  @Patch('me/read-all')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  markAllRead(@CurrentUser('sub') userId: number) {
    return this.service.markAllRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar uma notificação como lida' })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.markRead(userId, id);
  }
}
