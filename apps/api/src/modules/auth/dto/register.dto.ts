import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(320)
  email: string = '';

  @ApiProperty({ example: 'douglas_dev', description: 'Apenas letras, números, _ e -' })
  @IsString()
  @MinLength(3, { message: 'Username deve ter no mínimo 3 caracteres' })
  @MaxLength(32, { message: 'Username deve ter no máximo 32 caracteres' })
  @Matches(/^[a-z0-9_-]+$/i, { message: 'Username só pode conter letras, números, _ e -' })
  username: string = '';

  @ApiProperty({ example: 'MinhaS3nh4!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128)
  password: string = '';

  @ApiPropertyOptional({ example: 'Douglas' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;
}
