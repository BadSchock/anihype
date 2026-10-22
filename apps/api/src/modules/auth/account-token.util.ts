import { createHash, randomBytes } from 'crypto';

/** Token enviado por e-mail: 32 bytes aleatórios em hex (64 caracteres). */
export function generateAccountToken(): string {
  return randomBytes(32).toString('hex');
}

/** Só o hash fica no banco. Quem vazar a tabela não consegue usar os links. */
export function hashAccountToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function minutesFromNow(minutes: number, now = Date.now()): Date {
  return new Date(now + minutes * 60 * 1000);
}
