import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { EpisodeStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class EpisodeQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: EpisodeStatus, description: 'Filtrar por status do episódio' })
  @IsOptional()
  @IsEnum(EpisodeStatus)
  status?: EpisodeStatus;

  @ApiPropertyOptional({ description: 'Filtrar episódios com número maior ou igual a este' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numberFrom?: number;
}
