import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { AccountSecurityService } from './account-security.service';
import { ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/account-security.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountSecurity: AccountSecurityService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @ApiCreatedResponse({ description: 'Usuário criado com tokens de acesso' })
  @ApiConflictResponse({ description: 'Email ou username já em uso' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    void this.accountSecurity.sendEmailVerificationSafely(result.user.id);
    return result;
  }

  // ─── Senha e e-mail ──────────────────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Pedir link para redefinir a senha (resposta igual exista o e-mail ou não)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.accountSecurity.requestPasswordReset(dto.email);
    return { message: 'Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Definir nova senha com o token recebido por e-mail' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.accountSecurity.resetPassword(dto.token, dto.password);
    return { message: 'Senha atualizada. Entre com a nova senha.' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Confirmar o e-mail com o token recebido' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.accountSecurity.verifyEmail(dto.token);
    return { message: 'E-mail confirmado.' };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reenviar o e-mail de confirmação' })
  async resendVerification(@CurrentUser() user: CurrentUserPayload) {
    const { alreadyVerified } = await this.accountSecurity.sendEmailVerification(user.sub);
    return {
      alreadyVerified,
      message: alreadyVerified ? 'Seu e-mail já está confirmado.' : 'Enviamos um novo link de confirmação.',
    };
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Autenticar usuário (email ou username + senha)' })
  @ApiOkResponse({ description: 'Autenticado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip;
    const ua = req.headers['user-agent'];
    return this.authService.login(dto, ip, ua);
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiOkResponse({ description: 'Novos tokens emitidos' })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido ou expirado' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip;
    const ua = req.headers['user-agent'];
    return this.authService.refresh(dto.userId, dto.refreshToken, ip, ua);
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revogar todos os refresh tokens da sessão' })
  @ApiOkResponse({ description: 'Logout realizado' })
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Pick<RefreshTokenDto, 'refreshToken'>,
  ) {
    await this.authService.logout(user.sub, dto.refreshToken);
    return { message: 'Logout realizado' };
  }

  // ─── Me ──────────────────────────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  @ApiOkResponse({ description: 'Perfil básico do usuário logado' })
  async me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getMe(user.sub);
  }
}
