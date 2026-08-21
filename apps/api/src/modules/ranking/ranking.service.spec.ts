import {
  MIN_RATINGS_FOR_ANIME_RANKING,
  RankingService,
} from './ranking.service';

describe('RankingService helpers', () => {
  it('MIN_RATINGS_FOR_ANIME_RANKING is 10', () => {
    expect(MIN_RATINGS_FOR_ANIME_RANKING).toBe(10);
  });

  describe('getAnimeRanking', () => {
    it('orders by average and maps positions', async () => {
      const prisma = {
        anime: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 2,
              slug: 'b',
              titleRomaji: 'B',
              titleEnglish: null,
              coverImageUrl: null,
              bannerImageUrl: null,
              status: 'FINISHED',
              season: null,
              seasonYear: null,
              ratingAverage: 9.1,
              ratingCount: 20,
            },
            {
              id: 1,
              slug: 'a',
              titleRomaji: 'A',
              titleEnglish: null,
              coverImageUrl: null,
              bannerImageUrl: null,
              status: 'FINISHED',
              season: null,
              seasonYear: null,
              ratingAverage: 8.5,
              ratingCount: 15,
            },
          ]),
        },
      };
      const service = new RankingService(prisma as never);
      const result = await service.getAnimeRanking(50);
      expect(result.items[0].position).toBe(1);
      expect(result.items[0].slug).toBe('b');
      expect(result.items[1].position).toBe(2);
      expect(prisma.anime.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ratingCount: { gte: 10 },
          }),
        }),
      );
    });
  });

  describe('getUserRanking', () => {
    it('K-I03: invalid period → 400', async () => {
      const service = new RankingService({} as never);
      await expect(
        service.getUserRanking({ period: 'daily' as never }),
      ).rejects.toThrow(/period/i);
    });

    it('K-U01: all-time orders by hypeXp', async () => {
      const prisma = {
        userProfile: {
          findMany: jest.fn().mockResolvedValue([
            {
              hypeXp: 900,
              userId: 2,
              user: { id: 2, username: 'top', displayName: 'Top', avatarUrl: null },
              hypeLevel: { tierOrder: 3, displayName: 'Hype', minXp: 500 },
              equippedBadge: null,
            },
            {
              hypeXp: 100,
              userId: 1,
              user: { id: 1, username: 'low', displayName: 'Low', avatarUrl: null },
              hypeLevel: null,
              equippedBadge: null,
            },
          ]),
          count: jest.fn().mockResolvedValue(2),
          findUnique: jest.fn(),
        },
      };
      const service = new RankingService(prisma as never);
      const result = await service.getUserRanking({ period: 'all', limit: 50 });
      expect(result.items[0].username).toBe('top');
      expect(result.items[0].position).toBe(1);
      expect(result.me).toBeNull();
    });

    it('K-I02: authenticated includes me block', async () => {
      const prisma = {
        userProfile: {
          findMany: jest.fn().mockResolvedValue([
            {
              hypeXp: 500,
              userId: 5,
              user: { id: 5, username: 'me', displayName: 'Me', avatarUrl: null },
              hypeLevel: null,
              equippedBadge: null,
            },
          ]),
          count: jest.fn().mockResolvedValue(10),
          findUnique: jest.fn().mockResolvedValue({ hypeXp: 500 }),
        },
      };
      const service = new RankingService(prisma as never);
      const result = await service.getUserRanking({
        period: 'all',
        limit: 50,
        currentUserId: 5,
      });
      expect(result.me).toMatchObject({
        position: 1,
        hypeXp: 500,
      });
      expect(result.me?.motivational).toBeTruthy();
    });
  });
});
