import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SyncService } from './sync.service';

class SyncByIdDto {
  @ApiProperty({ description: 'ID no AniList' })
  @IsInt()
  @Min(1)
  anilistId!: number;
}

class SyncByMalDto {
  @ApiProperty({ description: 'MAL ID (MyAnimeList)' })
  @IsInt()
  @Min(1)
  malId!: number;
}

class SyncBySearchDto {
  @ApiProperty({ description: 'Título para busca no AniList' })
  @IsString()
  search!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
@Roles('ADMIN')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('anilist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Sincronizar anime pelo AniList ID' })
  syncAniList(@Body() dto: SyncByIdDto) {
    return this.syncService.syncByAniListId(dto.anilistId);
  }

  @Post('mal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Sincronizar anime pelo MAL ID (Jikan)' })
  syncMal(@Body() dto: SyncByMalDto) {
    return this.syncService.syncByMalId(dto.malId);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Buscar e sincronizar animes por título (AniList)' })
  syncSearch(@Body() dto: SyncBySearchDto) {
    return this.syncService.syncBySearch(dto.search);
  }
}
