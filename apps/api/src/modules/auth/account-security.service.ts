import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, PASSWORD_RESET_MINUTES, VERIFY_EMAIL_HOURS } from '../mail/mail.service';
import { generateAccountToken, hashAccountToken, minutesFromNow } from './account-token.util';

const BCRYPT_ROUNDS = 12;
const INVALID_LINK = 'Link inválido ou expirado. Peça um novo.';

@Injectable()
export class AccountSecurityService {
  private readonly logger = new Logger(AccountSecurityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // ─── Esqueci a senha ─────────────────────────────────────────────────────

  /**
   * Responde igual exista o e-mail ou não, para ninguém descobrir quem tem conta.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) return;

    const token = generateAccountToken();

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashAccountToken(token),
          expiresAt: minutesFromNow(PASSWORD_RESET_MINUTES),
        },
      }),
    ]);

    await this.mail.sendPasswordReset(user.email, token);
    this.logger.log(`Redefinição de senha solicitada: userId=${user.id}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: hashAccountToken(token),
        usedAt: null,
        expiresAt: { gt: new Date() },
        user: { deletedAt: null },
      },
      select: { id: true, userId: true },
    });

    if (!record) throw new BadRequestException(INVALID_LINK);

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        // Quem recebeu o link no e-mail prova que a caixa é dela.
        data: { passwordHash, emailVerified: true, emailVerifiedAt: now },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: now },
      }),
      // Encerra todas as sessões abertas com a senha antiga.
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revoked: false },
        data: { revoked: true },
      }),
    ]);

    this.logger.log(`Senha redefinida: userId=${record.userId}`);
  }

  // ─── Verificar e-mail ────────────────────────────────────────────────────

  async sendEmailVerification(userId: number): Promise<{ alreadyVerified: boolean }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) throw new BadRequestException('Usuário não encontrado.');
    if (user.emailVerified) return { alreadyVerified: true };

    const token = generateAccountToken();

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { userId, consumed: false } }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: hashAccountToken(token),
          expiresAt: minutesFromNow(VERIFY_EMAIL_HOURS * 60),
        },
      }),
    ]);

    await this.mail.sendEmailVerification(user.email, token);
    return { alreadyVerified: false };
  }

  /** Usado no cadastro: falha no e-mail não pode impedir a conta de ser criada. */
  async sendEmailVerificationSafely(userId: number): Promise<void> {
    try {
      await this.sendEmailVerification(userId);
    } catch (err) {
      this.logger.warn(`Não foi possível enviar a verificação para userId=${userId}: ${String(err)}`);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash: hashAccountToken(token),
        consumed: false,
        expiresAt: { gt: new Date() },
        user: { deletedAt: null },
      },
      select: { id: true, userId: true },
    });

    if (!record) throw new BadRequestException(INVALID_LINK);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.updateMany({
        where: { userId: record.userId, consumed: false },
        data: { consumed: true },
      }),
    ]);

    this.logger.log(`E-mail verificado: userId=${record.userId}`);
  }
}
