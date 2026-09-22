import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Public } from '../../common/decorators';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RankingPeriod, RankingService } from '../ranking/ranking.service';

const AVATAR_MAX_BYTES = 3 * 1024 * 1024; // 3 MB

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rankingService: RankingService,
  ) {}

  // ─── Meu perfil (auth) ────────────────────────────────────────────────────
  // Precisam ficar acima de `:username` para o Nest não tratar "me" como
  // um username (mesmo cuidado já aplicado em "ranking" abaixo).

  @Patch('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Editar meu perfil (displayName e bio). Username não é editável nesta versão.',
  })
  updateMe(@CurrentUser('sub') userId: number, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/avatar')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Enviar/trocar meu avatar (JPEG, PNG ou WebP — máx. 3MB)' })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser('sub') userId: number,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: AVATAR_MAX_BYTES })
        .build({
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
          exceptionFactory: () =>
            new BadRequestException(
              'Envie uma imagem JPEG, PNG ou WebP de até 3MB.',
            ),
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(userId, file);
  }

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
