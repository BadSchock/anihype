/** Espera antes de repetir uma chamada à AniList. null significa que não vale repetir. */
export function anilistRetryDelayMs(
  status: number | undefined,
  retryAfter: unknown,
  attempt: number,
): number | null {
  if (status !== 429 && status !== 502 && status !== 503) return null;

  const raw = Array.isArray(retryAfter) ? retryAfter[0] : retryAfter;
  const seconds = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(Math.ceil(seconds * 1000), 60_000);
  }

  return Math.min(2_000 * 2 ** (attempt - 1), 30_000);
}
