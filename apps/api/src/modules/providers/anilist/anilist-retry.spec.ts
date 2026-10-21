import { anilistRetryDelayMs } from './anilist-retry';

describe('anilistRetryDelayMs', () => {
  it('follows the Retry-After header on 429, capped at 60s', () => {
    expect(anilistRetryDelayMs(429, '15', 1)).toBe(15_000);
    expect(anilistRetryDelayMs(429, 90, 1)).toBe(60_000);
  });

  it('backs off when AniList does not say how long to wait', () => {
    expect(anilistRetryDelayMs(429, undefined, 1)).toBe(2_000);
    expect(anilistRetryDelayMs(503, undefined, 3)).toBe(8_000);
  });

  it('does not retry a normal client error', () => {
    expect(anilistRetryDelayMs(400, undefined, 1)).toBeNull();
    expect(anilistRetryDelayMs(404, '10', 1)).toBeNull();
  });
});
