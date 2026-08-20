import { RatingsService } from './ratings.service';

describe('RatingsService', () => {
  describe('computeFinalScore', () => {
    it('applies double weight to hype', () => {
      const score = RatingsService.computeFinalScore({
        animation: 8,
        story: 8,
        characters: 8,
        sound: 8,
        hype: 10,
      });
      expect(score).toBeCloseTo(52 / 6, 5);
    });
  });

  describe('getBadge', () => {
    it('returns Obra-Prima for 9+', () => {
      expect(RatingsService.getBadge(9).label).toBe('Obra-Prima');
    });

    it('returns Decepcionante below 5', () => {
      expect(RatingsService.getBadge(4.9).label).toBe('Decepcionante');
    });
  });
});
