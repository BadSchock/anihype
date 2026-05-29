import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // --------------------------------------------------------------------------
  // Criar comentário (requer auth)
  // --------------------------------------------------------------------------
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um comentário num episódio (requer login)' })
  create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.create(dto, user.sub);
  }

  // --------------------------------------------------------------------------
  // Listar comentários de um episódio (público, mas passa userId se autenticado)
  // --------------------------------------------------------------------------
  @Public()
  @Get('episode/:episodeId')
  @ApiOperation({ summary: 'Listar comentários de um episódio (com like status se autenticado)' })
  @ApiParam({ name: 'episodeId', type: Number })
  findByEpisode(
    @Param('episodeId', ParseIntPipe) episodeId: number,
    @Query() query: CommentQueryDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.commentsService.findByEpisode(episodeId, query, user?.sub);
  }

  // --------------------------------------------------------------------------
  // Comentários em alta  →  GET /comments/hot?limit=8&days=7
  // --------------------------------------------------------------------------
  @Public()
  @Get('hot')
  @ApiOperation({ summary: 'Comentários em alta nos últimos dias' })
  findHot(@Query('limit') limit?: string, @Query('days') days?: string) {
    const numLimit = limit ? Math.min(20, Math.max(1, parseInt(limit, 10) || 8)) : 8;
    const numDays = days ? Math.min(14, Math.max(1, parseInt(days, 10) || 7)) : 7;
    return this.commentsService.findHot(numLimit, numDays);
  }

  // --------------------------------------------------------------------------
  // Detalhe de comentário (público)
  // --------------------------------------------------------------------------
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Buscar comentário por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.commentsService.findById(id, user?.sub);
  }

  // --------------------------------------------------------------------------
  // Editar comentário (requer auth + ser dono)
  // --------------------------------------------------------------------------
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar comentário (apenas o autor)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.update(id, dto, user.sub);
  }

  // --------------------------------------------------------------------------
  // Deletar comentário (requer auth + ser dono ou admin)
  // --------------------------------------------------------------------------
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar comentário (soft delete — apenas o autor ou admin)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const isAdmin = user.roles.includes('ADMIN');
    return this.commentsService.remove(id, user.sub, isAdmin);
  }

  // --------------------------------------------------------------------------
  // Toggle like (requer auth)
  // --------------------------------------------------------------------------
  @Post(':id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Curtir ou descurtir um comentário (toggle)' })
  toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.toggleLike(id, user.sub);
  }
}
