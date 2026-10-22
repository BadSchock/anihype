import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { MailContent, passwordResetMail, verifyEmailMail } from './mail.templates';

export const PASSWORD_RESET_MINUTES = 60;
export const VERIFY_EMAIL_HOURS = 24;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly webUrl: string;
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    const host = config.get<string>('mail.host');
    this.from = config.get<string>('mail.from') ?? 'AniHype <nao-responda@anihype.com.br>';
    this.webUrl = config.get<string>('mail.webUrl') ?? 'http://localhost:3002';
    this.isProduction = config.get<string>('app.nodeEnv') === 'production';

    if (host) {
      const user = config.get<string>('mail.user');
      const pass = config.get<string>('mail.pass');
      this.transporter = nodemailer.createTransport({
        host,
        port: config.get<number>('mail.port') ?? 587,
        secure: config.get<boolean>('mail.secure') ?? false,
        ...(user && pass ? { auth: { user, pass } } : {}),
      });
    } else {
      this.transporter = null;
      if (this.isProduction) {
        this.logger.warn(
          'SMTP_HOST não configurado: e-mails de senha e verificação NÃO serão enviados em produção.',
        );
      }
    }
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const url = `${this.webUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;
    await this.deliver(to, passwordResetMail(url, PASSWORD_RESET_MINUTES), url);
  }

  async sendEmailVerification(to: string, token: string): Promise<void> {
    const url = `${this.webUrl}/verificar-email?token=${encodeURIComponent(token)}`;
    await this.deliver(to, verifyEmailMail(url, VERIFY_EMAIL_HOURS), url);
  }

  private async deliver(to: string, content: MailContent, link: string): Promise<void> {
    if (!this.transporter) {
      // Desenvolvimento: o link aparece no log. Em produção sem SMTP, o link não é exposto.
      if (!this.isProduction) {
        this.logger.log(`[E-mail simulado] Para: ${to} | ${content.subject}\n${link}`);
      }
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
    } catch (err) {
      this.logger.error(`Falha ao enviar e-mail "${content.subject}" para ${to}: ${String(err)}`);
    }
  }
}
