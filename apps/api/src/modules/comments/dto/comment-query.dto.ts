import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CommentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Se true, retorna apenas comentários raiz (sem parentId)' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  rootOnly?: boolean;

  @ApiPropertyOptional({ description: 'ID do comentário pai para buscar replies' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number;
}
