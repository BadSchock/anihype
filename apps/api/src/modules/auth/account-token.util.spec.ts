import { generateAccountToken, hashAccountToken, minutesFromNow } from './account-token.util';

describe('account-token.util', () => {
  it('gera tokens longos e diferentes a cada chamada', () => {
    const a = generateAccountToken();
    const b = generateAccountToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it('gera sempre o mesmo hash para o mesmo token, sem guardar o token', () => {
    const token = generateAccountToken();
    expect(hashAccountToken(token)).toBe(hashAccountToken(token));
    expect(hashAccountToken(token)).not.toContain(token);
    expect(hashAccountToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('calcula a validade em minutos', () => {
    const base = Date.UTC(2026, 9, 21, 12, 0, 0);
    expect(minutesFromNow(60, base).toISOString()).toBe('2026-10-21T13:00:00.000Z');
  });
});
