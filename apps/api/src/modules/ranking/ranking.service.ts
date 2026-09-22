import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { publicAnimeWhere } from '../../common/content/public-anime';

export const MIN_RATINGS_FOR_ANIME_RANKING = 10;

export type RankingPeriod = 'week' | 'month' | 'all';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnimeRanking(limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);

    const rows = await this.prisma.anime.findMany({
      where: {
        deletedAt: null,
        ...publicAnimeWhere(),
        ratingCount: { gte: MIN_RATINGS_FOR_ANIME_RANKING },
        ratingAverage: { not: null },
      },
      orderBy: [
        { ratingAverage: { sort: 'desc', nulls: 'last' } },
        { ratingCount: 'desc' },
        { id: 'asc' },
      ],
      take,
      select: {
        id: true,
        slug: true,
        titleRomaji: true,
        titleEnglish: true,
        coverImageUrl: true,
        bannerImageUrl: true,
        status: true,
        season: true,
        seasonYear: true,
        ratingAverage: true,
        ratingCount: true,
      },
    });

    return {
      items: rows.map((a, index) => ({
        position: index + 1,
        id: a.id,
        slug: a.slug,
        titleRomaji: a.titleRomaji,
        titleEnglish: a.titleEnglish,
        coverImageUrl: a.coverImageUrl,
        bannerImageUrl: a.bannerImageUrl,
        status: a.status,
        season: a.season,
        seasonYear: a.seasonYear,
        ratingAverage: a.ratingAverage ? Number(a.ratingAverage) : null,
        ratingCount: a.ratingCount,
      })),
    };
  }

  async getUserRanking(params: {
    period: RankingPeriod;
    limit?: number;
    currentUserId?: number;
  }) {
    const period = params.period;
    if (!['week', 'month', 'all'].includes(period)) {
      throw new BadRequestException('period deve ser week, month ou all');
    }

    const take = Math.min(Math.max(params.limit ?? 50, 1), 100);

    if (period === 'all') {
      return this.rankAllTime(take, params.currentUserId);
    }

    const since = this.periodStart(period);
    return this.rankByTransactions(period, since, take, params.currentUserId);
  }

  private periodStart(period: 'week' | 'month'): Date {
    const d = new Date();
    if (period === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    return d;
  }

  private async rankAllTime(take: number, currentUserId?: number) {
    const profiles = await this.prisma.userProfile.findMany({
      where: { user: { deletedAt: null } },
      orderBy: [{ hypeXp: 'desc' }, { userId: 'asc' }],
      take,
      select: {
        hypeXp: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        hypeLevel: {
          select: { tierOrder: true, displayName: true, minXp: true },
        },
        equippedBadge: {
          select: {
            id: true,
            slug: true,
            name: true,
            rarityColor: true,
            iconUrl: true,
          },
        },
      },
    });

    const items = profiles.map((p, index) => ({
      position: index + 1,
      userId: p.user.id,
      username: p.user.username,
      displayName: p.user.displayName,
      avatarUrl: p.user.avatarUrl,
      hypeXp: p.hypeXp,
      level: p.hypeLevel
        ? {
            tierOrder: p.hypeLevel.tierOrder,
            displayName: p.hypeLevel.displayName,
            minXp: p.hypeLevel.minXp,
          }
        : null,
      equippedBadge: p.equippedBadge,
      // Slots for future profile cosmetics (frames / backgrounds)
      profileFrameColor: null as string | null,
      profileBackgroundUrl: null as string | null,
    }));

    const me = await this.buildMeBlock(
      currentUserId,
      items,
      async (userId) => {
        const profile = await this.prisma.userProfile.findUnique({
          where: { userId },
          select: { hypeXp: true },
        });
        return profile?.hypeXp ?? 0;
      },
      async (xp) => {
        const better = await this.prisma.userProfile.count({
          where: {
            user: { deletedAt: null },
            OR: [
              { hypeXp: { gt: xp } },
              { hypeXp: xp, userId: { lt: currentUserId! } },
            ],
          },
        });
        return better + 1;
      },
      async () =>
        this.prisma.userProfile.count({ where: { user: { deletedAt: null } } }),
    );

    return { period: 'all' as const, items, me };
  }

  private async rankByTransactions(
    period: 'week' | 'month',
    since: Date,
    take: number,
    currentUserId?: number,
  ) {
    const grouped = await this.prisma.hypeTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: since },
        user: { deletedAt: null },
      },
      _sum: { deltaPoints: true },
      orderBy: { _sum: { deltaPoints: 'desc' } },
      take,
    });

    // Stable tie-break: lower userId first among equal XP
    const sorted = [...grouped].sort((a, b) => {
      const xa = a._sum.deltaPoints ?? 0;
      const xb = b._sum.deltaPoints ?? 0;
      if (xb !== xa) return xb - xa;
      return a.userId - b.userId;
    });

    const userIds = sorted.map((g) => g.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        profile: {
          select: {
            hypeLevel: {
              select: { tierOrder: true, displayName: true, minXp: true },
            },
            equippedBadge: {
              select: {
                id: true,
                slug: true,
                name: true,
                rarityColor: true,
                iconUrl: true,
              },
            },
          },
        },
      },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    const items = sorted
      .map((g, index) => {
        const u = byId.get(g.userId);
        if (!u) return null;
        return {
          position: index + 1,
          userId: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          hypeXp: g._sum.deltaPoints ?? 0,
          level: u.profile?.hypeLevel
            ? {
                tierOrder: u.profile.hypeLevel.tierOrder,
                displayName: u.profile.hypeLevel.displayName,
                minXp: u.profile.hypeLevel.minXp,
              }
            : null,
          equippedBadge: u.profile?.equippedBadge ?? null,
          profileFrameColor: null as string | null,
          profileBackgroundUrl: null as string | null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const me = await this.buildMeBlock(
      currentUserId,
      items,
      async (userId) => {
        const agg = await this.prisma.hypeTransaction.aggregate({
          where: { userId, createdAt: { gte: since } },
          _sum: { deltaPoints: true },
        });
        return agg._sum.deltaPoints ?? 0;
      },
      async (xp) => {
        // Count users with strictly more XP in window
        const all = await this.prisma.hypeTransaction.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: since }, user: { deletedAt: null } },
          _sum: { deltaPoints: true },
        });
        const better = all.filter((g) => {
          const gxp = g._sum.deltaPoints ?? 0;
          return gxp > xp || (gxp === xp && g.userId < currentUserId!);
        }).length;
        return better + 1;
      },
      async () => {
        const all = await this.prisma.hypeTransaction.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: since }, user: { deletedAt: null } },
        });
        // Include users with 0 XP in period as last — total active profiles
        return this.prisma.userProfile.count({ where: { user: { deletedAt: null } } }).then((c) =>
          Math.max(c, all.length),
        );
      },
    );

    return { period, items, me };
  }

  private async buildMeBlock(
    currentUserId: number | undefined,
    items: Array<{ position: number; userId: number; hypeXp: number }>,
    getXp: (userId: number) => Promise<number>,
    getPosition: (xp: number) => Promise<number>,
    getTotal: () => Promise<number>,
  ) {
    if (currentUserId == null) return null;

    const inList = items.find((i) => i.userId === currentUserId);
    const hypeXp = inList?.hypeXp ?? (await getXp(currentUserId));
    const position = inList?.position ?? (await getPosition(hypeXp));
    const total = await getTotal();

    const percentile =
      total > 0 ? Math.max(1, Math.ceil((position / total) * 100)) : 100;
    const nextPercentile = Math.max(1, percentile - 5);
    const nextThresholdPos = Math.max(1, Math.ceil((nextPercentile / 100) * total));

    let xpToNextPercentile = 0;
    if (percentile > 1 && position > 1) {
      const targetPos = Math.min(nextThresholdPos, position - 1);
      // Approximate: XP of user at target position in current list, or +10%
      const targetItem = items.find((i) => i.position === targetPos);
      if (targetItem) {
        xpToNextPercentile = Math.max(0, targetItem.hypeXp - hypeXp + 1);
      } else {
        xpToNextPercentile = Math.max(10, Math.ceil(hypeXp * 0.05) || 10);
      }
    }

    const motivational =
      percentile <= 10
        ? `Você está no top ${percentile}%! Continue no hype.`
        : `Você está no top ${percentile}%. Mais ${xpToNextPercentile} XP para o top ${nextPercentile}%.`;

    return {
      position,
      hypeXp,
      percentile,
      xpToNextPercentile,
      motivational,
    };
  }
}
