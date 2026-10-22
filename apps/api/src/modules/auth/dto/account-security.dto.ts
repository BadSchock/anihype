import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const TOKEN_PATTERN = /^[0-9a-f]{64}$/i;

export class ForgotPasswordDto {
  @ApiProperty({ example: 'voce@email.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido no link do e-mail' })
  @IsString()
  @Matches(TOKEN_PATTERN, { message: 'Link inválido ou expirado. Peça um novo.' })
  token!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token recebido no link do e-mail' })
  @IsString()
  @Matches(TOKEN_PATTERN, { message: 'Link inválido ou expirado. Peça um novo.' })
  token!: string;
}
