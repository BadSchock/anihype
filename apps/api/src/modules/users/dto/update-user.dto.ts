import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { EQUIPABLE_PROFILE_BANNER_IDS } from '../profile-banners';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Douglas',
    description: 'Nome de exibição. Envie string vazia ("") para remover.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Nome de exibição deve ter no máximo 120 caracteres' })
  displayName?: string;

  @ApiPropertyOptional({
    example: 'Fã de anime desde sempre. 🍥',
    description: 'Bio do perfil. Envie string vazia ("") para remover.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Bio deve ter no máximo 300 caracteres' })
  bio?: string;

  @ApiPropertyOptional({
    example: 'neon',
    enum: EQUIPABLE_PROFILE_BANNER_IDS,
    description: 'Id de um fundo oficial já liberado. Não aceita CSS nem URL.',
  })
  @IsOptional()
  @IsString()
  @IsIn(EQUIPABLE_PROFILE_BANNER_IDS, { message: 'Fundo de perfil inválido.' })
  profileBanner?: string;
}
