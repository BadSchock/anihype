import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}
