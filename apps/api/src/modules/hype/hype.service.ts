import { Injectable } from '@nestjs/common';
import { HypeTransactionReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BadgesService } from '../badges/badges.service';

/** Pontos por ação — valores conservadores para evitar farm. */
const XP_BY_REASON: Partial<Record<HypeTransactionReason, number>> = {
  [HypeTransactionReason.COMMENT_POSTED]: 5,
  [HypeTransactionReason.REPLY_POSTED]: 3,
  [HypeTransactionReason.LIKE_RECEIVED]: 2,
  [HypeTransactionReason.RATING_POSTED]: 10,
  [HypeTransactionReason.ANIME_FOLLOWED]: 5,
  [HypeTransactionReason.DAILY_LOGIN]: 10,
};

/** Máximo de recompensas por dia (fuso de Brasília). Evita farm de XP com spam. */
const DAILY_LIMIT_BY_REASON: Partial<Record<HypeTransactionReason, number>> = {
  [HypeTransactionReason.COMMENT_POSTED]: 10,
  [HypeTransactionReason.REPLY_POSTED]: 10,
  [HypeTransactionReason.LIKE_RECEIVED]: 30,
};

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Início do dia de hoje em Brasília, como instante UTC. */
export function startOfBrtDay(now = new Date()): Date {
  const brt = new Date(now.getTime() - BRT_OFFSET_MS);
  return new Date(Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate()) + BRT_OFFSET_MS);
}

/** 20261021 para 21/10/2026. Serve de referenceId do login diário. */
export function brtDayKey(now = new Date()): number {
  const brt = new Date(now.getTime() - BRT_OFFSET_MS);
  return brt.getUTCFullYear() * 10000 + (brt.getUTCMonth() + 1) * 100 + brt.getUTCDate();
}

export interface HypeStats {
  hypeXp: number;
  level: {
    tierOrder: number;
    displayName: string;
    minXp: number;
  } | null;
  nextLevel: {
    tierOrder: number;
    displayName: string;
    minXp: number;
    xpNeeded: number;
  } | null;
}

@Injectable()
export class HypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badgesService: BadgesService,
  ) {}

  /**
   * Concede XP de forma idempotente (user + reason + referenceId).
   * Falhas são silenciosas para não quebrar fluxos principais.
   */
  async awardXp(params: {
    userId: number;
    reason: HypeTransactionReason;
    referenceId?: number;
    deltaPoints?: number;
    /** Quem causou o XP (ex.: quem curtiu). Com ele, a mesma pessoa não rende XP duas vezes no mesmo item. */
    actorId?: number;
  }): Promise<void> {
    const points = params.deltaPoints ?? XP_BY_REASON[params.reason] ?? 0;
    if (points <= 0) return;

    try {
      if (params.referenceId != null) {
        const existing = await this.prisma.hypeTransaction.findFirst({
          where: {
            userId: params.userId,
            reason: params.reason,
            referenceId: params.referenceId,
            ...(params.actorId != null && { meta: { path: ['actorId'], equals: params.actorId } }),
          },
          select: { id: true },
        });
        if (existing) return;
      }

      const dailyLimit = DAILY_LIMIT_BY_REASON[params.reason];
      if (dailyLimit != null) {
        const today = await this.prisma.hypeTransaction.count({
          where: {
            userId: params.userId,
            reason: params.reason,
            createdAt: { gte: startOfBrtDay() },
          },
        });
        if (today >= dailyLimit) return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.hypeTransaction.create({
          data: {
            userId: params.userId,
            reason: params.reason,
            referenceId: params.referenceId ?? null,
            deltaPoints: points,
            ...(params.actorId != null && { meta: { actorId: params.actorId } }),
          },
        });

        const profile = await tx.userProfile.upsert({
          where: { userId: params.userId },
          create: { userId: params.userId, hypeXp: points },
          update: { hypeXp: { increment: points } },
        });

        const level = await tx.hypeLevel.findFirst({
          where: { minXp: { lte: profile.hypeXp } },
          orderBy: { minXp: 'desc' },
        });

        if (level) {
          await tx.userProfile.update({
            where: { userId: params.userId },
            data: { hypeLevelId: level.id },
          });
        }
      });

      void this.badgesService.awardIfEligible(params.userId, 'xp_awarded');
    } catch {
      // Gamificação não deve bloquear comentários/likes/ratings
    }
  }

  /** XP do login diário: uma vez por dia, mesmo que a pessoa entre várias vezes. */
  async awardDailyLogin(userId: number): Promise<void> {
    await this.awardXp({
      userId,
      reason: HypeTransactionReason.DAILY_LOGIN,
      referenceId: brtDayKey(),
    });
  }

  async getStatsByUsername(username: string): Promise<HypeStats | null> {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: {
        profile: {
          include: { hypeLevel: true },
        },
      },
    });

    if (!user) return null;

    const hypeXp = user.profile?.hypeXp ?? 0;

    let currentLevel = user.profile?.hypeLevel ?? null;
    if (!currentLevel) {
      currentLevel = await this.prisma.hypeLevel.findFirst({
        where: { minXp: { lte: hypeXp } },
        orderBy: { minXp: 'desc' },
      });
    }

    const nextLevel = await this.prisma.hypeLevel.findFirst({
      where: { minXp: { gt: hypeXp } },
      orderBy: { minXp: 'asc' },
    });

    return {
      hypeXp,
      level: currentLevel
        ? {
            tierOrder: currentLevel.tierOrder,
            displayName: currentLevel.displayName ?? `Nível ${currentLevel.tierOrder}`,
            minXp: currentLevel.minXp,
          }
        : null,
      nextLevel: nextLevel
        ? {
            tierOrder: nextLevel.tierOrder,
            displayName: nextLevel.displayName ?? `Nível ${nextLevel.tierOrder}`,
            minXp: nextLevel.minXp,
            xpNeeded: nextLevel.minXp - hypeXp,
          }
        : null,
    };
  }
}
