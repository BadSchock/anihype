export interface MailContent {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(title: string, intro: string, buttonLabel: string, url: string, footer: string): string {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#0b0b10;font-family:Arial,Helvetica,sans-serif;color:#e5e7eb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#15151d;border-radius:16px;padding:32px;">
            <tr><td style="font-size:22px;font-weight:800;color:#ffffff;">Ani<span style="color:#a855f7;">Hype</span></td></tr>
            <tr><td style="padding-top:20px;font-size:18px;font-weight:700;color:#ffffff;">${escapeHtml(title)}</td></tr>
            <tr><td style="padding-top:12px;font-size:14px;line-height:1.6;color:#d1d5db;">${escapeHtml(intro)}</td></tr>
            <tr><td style="padding-top:24px;">
              <a href="${safeUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;">${escapeHtml(buttonLabel)}</a>
            </td></tr>
            <tr><td style="padding-top:20px;font-size:12px;line-height:1.6;color:#9ca3af;">Se o botão não abrir, copie este endereço no navegador:<br><span style="word-break:break-all;color:#c4b5fd;">${safeUrl}</span></td></tr>
            <tr><td style="padding-top:20px;font-size:12px;line-height:1.6;color:#6b7280;">${escapeHtml(footer)}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function passwordResetMail(url: string, validForMinutes: number): MailContent {
  const intro = `Recebemos um pedido para redefinir a senha da sua conta. O link vale por ${validForMinutes} minutos.`;
  const footer = 'Se você não pediu isso, ignore este e-mail. Sua senha continua a mesma.';
  return {
    subject: 'Redefinir sua senha no AniHype',
    text: `${intro}\n\nAbra este link para criar uma nova senha:\n${url}\n\n${footer}`,
    html: layout('Redefinir senha', intro, 'Criar nova senha', url, footer),
  };
}

export function verifyEmailMail(url: string, validForHours: number): MailContent {
  const intro = `Confirme seu e-mail para proteger sua conta e recuperar a senha quando precisar. O link vale por ${validForHours} horas.`;
  const footer = 'Se você não criou uma conta no AniHype, ignore este e-mail.';
  return {
    subject: 'Confirme seu e-mail no AniHype',
    text: `${intro}\n\nAbra este link para confirmar:\n${url}\n\n${footer}`,
    html: layout('Confirmar e-mail', intro, 'Confirmar e-mail', url, footer),
  };
}
