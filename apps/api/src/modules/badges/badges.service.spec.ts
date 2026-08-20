import { BadgesService } from './badges.service';
import { ACHIEVEMENT_BADGES, OG_MAX_USER_ID } from './badge.constants';

function mockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    comment: { count: jest.fn().mockResolvedValue(0) },
    animeRating: { count: jest.fn().mockResolvedValue(0) },
    userProfile: {
      findUnique: jest.fn().mockResolvedValue({ hypeXp: 0 }),
      upsert: jest.fn(),
    },
    animeFollow: { count: jest.fn().mockResolvedValue(0) },
    userFollow: { count: jest.fn().mockResolvedValue(0) },
    commentLike: { count: jest.fn().mockResolvedValue(0) },
    badge: { findUnique: jest.fn() },
    userBadge: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
    ...overrides,
  };
}

describe('BadgesService', () => {
  describe('computeProgress', () => {
    it('B-U02: 9 written ratings → critic progress below target', async () => {
      const prisma = mockPrisma({
        animeRating: { count: jest.fn().mockResolvedValue(9) },
      });
      const service = new BadgesService(prisma as never);
      const p = await service.computeProgress(1, 'critic-on-duty');
      expect(p.current).toBe(9);
      expect(p.target).toBe(10);
      expect(p.hint).toContain('9/10');
    });

    it('B-U03: 10 written ratings → critic ready', async () => {
      const prisma = mockPrisma({
        animeRating: { count: jest.fn().mockResolvedValue(10) },
      });
      const service = new BadgesService(prisma as never);
      const p = await service.computeProgress(1, 'critic-on-duty');
      expect(p.current).toBe(10);
      expect(p.hint).toBe('Conquistado!');
    });

    it('B-U04: XP 500 → hyped ready', async () => {
      const prisma = mockPrisma({
        userProfile: { findUnique: jest.fn().mockResolvedValue({ hypeXp: 500 }) },
      });
      const service = new BadgesService(prisma as never);
      const p = await service.computeProgress(1, 'hyped');
      expect(p.current).toBe(500);
      expect(p.target).toBe(500);
    });

    it('B-U05: 10 anime follows → marathoner ready', async () => {
      const prisma = mockPrisma({
        animeFollow: { count: jest.fn().mockResolvedValue(10) },
      });
      const service = new BadgesService(prisma as never);
      const p = await service.computeProgress(1, 'marathoner');
      expect(p.current).toBe(10);
    });

    it('B-U06: 50 comment likes → community-voice ready', async () => {
      const prisma = mockPrisma({
        commentLike: { count: jest.fn().mockResolvedValue(50) },
      });
      const service = new BadgesService(prisma as never);
      const p = await service.computeProgress(1, 'community-voice');
      expect(p.current).toBe(50);
    });

    it('B-U07: user #100 is OG; #101 is not', async () => {
      const service = new BadgesService(mockPrisma() as never);
      const og = await service.computeProgress(OG_MAX_USER_ID, 'og');
      const notOg = await service.computeProgress(OG_MAX_USER_ID + 1, 'og');
      expect(og.current).toBe(1);
      expect(notOg.current).toBe(0);
    });

    it('networker: 10 user follows ready', async () => {
      const prisma = mockPrisma({
        userFollow: { count: jest.fn().mockResolvedValue(10) },
      });
      const service = new BadgesService(prisma as never);
      const p = await service.computeProgress(1, 'networker');
      expect(p.current).toBe(10);
    });

    it('first-rating: one rating ready', async () => {
      const prisma = mockPrisma({
        animeRating: { count: jest.fn().mockResolvedValue(1) },
      });
      const service = new BadgesService(prisma as never);
      const p = await service.computeProgress(1, 'first-rating');
      expect(p.current).toBe(1);
    });
  });

  describe('awardIfEligible', () => {
    it('B-U01: first comment awards once', async () => {
      const create = jest.fn().mockResolvedValue({});
      const prisma = mockPrisma({
        comment: { count: jest.fn().mockResolvedValue(1) },
        badge: {
          findUnique: jest.fn().mockResolvedValue({ id: 10, slug: 'first-comment' }),
        },
        userBadge: {
          findUnique: jest.fn().mockResolvedValue(null),
          create,
        },
      });
      const service = new BadgesService(prisma as never);
      const awarded = await service.awardIfEligible(1, 'comment_created');
      expect(awarded).toHaveLength(1);
      expect(awarded[0].slug).toBe('first-comment');
      expect(create).toHaveBeenCalledTimes(1);
    });

    it('B-U08: award twice → still one UserBadge (second returns empty)', async () => {
      const create = jest.fn();
      const prisma = mockPrisma({
        comment: { count: jest.fn().mockResolvedValue(5) },
        badge: {
          findUnique: jest.fn().mockResolvedValue({ id: 10, slug: 'first-comment' }),
        },
        userBadge: {
          findUnique: jest.fn().mockResolvedValue({ id: 1 }),
          create,
        },
      });
      const service = new BadgesService(prisma as never);
      const awarded = await service.awardIfEligible(1, 'comment_created');
      expect(awarded).toHaveLength(0);
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('equipBadge', () => {
    it('B-I01: equip badge not owned → BadRequest', async () => {
      const prisma = mockPrisma({
        userBadge: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      const service = new BadgesService(prisma as never);
      await expect(service.equipBadge(1, 99)).rejects.toThrow(/não conquistou/i);
    });
  });

  it('seed catalog has 8 achievement definitions', () => {
    expect(ACHIEVEMENT_BADGES).toHaveLength(8);
  });
});
