const BRT = 'America/Sao_Paulo';

/** Data de hoje no formato YYYY-MM-DD em Brasília */
export function getTodayBrtDateString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BRT }).format(new Date());
}

/** Formata YYYY-MM-DD para exibição (sempre interpreta como data civil, sem shift de fuso) */
export function formatBrtDateLabel(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (dateStr === 'unknown') return 'Data desconhecida';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC', ...options });
}

export function isTodayBrt(dateStr: string): boolean {
  return dateStr !== 'unknown' && dateStr === getTodayBrtDateString();
}

export function isTomorrowBrt(dateStr: string): boolean {
  if (dateStr === 'unknown') return false;
  const [y, m, d] = getTodayBrtDateString().split('-').map(Number);
  const tomorrow = new Date(Date.UTC(y!, m! - 1, d!));
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return dateStr === tomorrow.toISOString().slice(0, 10);
}

export function isYesterdayBrt(dateStr: string): boolean {
  if (dateStr === 'unknown') return false;
  const [y, m, d] = getTodayBrtDateString().split('-').map(Number);
  const yesterday = new Date(Date.UTC(y!, m! - 1, d!));
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return dateStr === yesterday.toISOString().slice(0, 10);
}

export function formatCalendarDay(dateStr: string): string {
  if (isTodayBrt(dateStr)) return 'Hoje';
  if (isTomorrowBrt(dateStr)) return 'Amanhã';
  return formatBrtDateLabel(dateStr, { weekday: 'long', day: '2-digit', month: 'short' });
}

/** Rótulo para histórico: Hoje, Ontem ou data formatada */
export function formatRecentDay(dateStr: string): string {
  if (isTodayBrt(dateStr)) return 'Hoje';
  if (isYesterdayBrt(dateStr)) return 'Ontem';
  return formatBrtDateLabel(dateStr, { weekday: 'long', day: '2-digit', month: 'short' });
}

export function formatAirTimeBrt(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: BRT });
}

/** Horário exato de exibição — prefere airTimeUtc (momento real do lançamento). */
export function getEpisodeAiredAt(episode: {
  airTimeUtc?: string | null;
  airDate?: string | null;
}): string | null {
  return episode.airTimeUtc ?? episode.airDate ?? null;
}
