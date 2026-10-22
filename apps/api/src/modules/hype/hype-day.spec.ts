import { brtDayKey, startOfBrtDay } from './hype.service';

describe('dia em Brasília (login diário)', () => {
  it('conta 23h de 20/10 em Brasília como dia 20, mesmo já sendo 21/10 em UTC', () => {
    const now = new Date('2026-10-21T02:30:00.000Z');
    expect(brtDayKey(now)).toBe(20261020);
    expect(startOfBrtDay(now).toISOString()).toBe('2026-10-20T03:00:00.000Z');
  });

  it('vira o dia às 00:00 de Brasília', () => {
    expect(brtDayKey(new Date('2026-10-21T02:59:59.000Z'))).toBe(20261020);
    expect(brtDayKey(new Date('2026-10-21T03:00:00.000Z'))).toBe(20261021);
  });

  it('funciona na virada do ano', () => {
    expect(brtDayKey(new Date('2027-01-01T02:00:00.000Z'))).toBe(20261231);
  });
});
