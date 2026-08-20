import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EquipBadgeDto {
  @ApiPropertyOptional({
    description: 'ID do badge a equipar. null/omitido desequipa.',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  badgeId?: number | null;
}
