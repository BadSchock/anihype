import { Injectable } from '@nestjs/common';
import { HypeTransactionReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Pontos por ação — valores conservadores para evitar farm. */
const XP_BY_REASON: Partial<Record<HypeTransactionReason, number>> = {
  [HypeTransactionReason.COMMENT_POSTED]: 5,
  [HypeTransactionReason.REPLY_POSTED]: 3,
  [HypeTransactionReason.LIKE_RECEIVED]: 2,
  [HypeTransactionReason.RATING_POSTED]: 10,
  [HypeTransactionReason.ANIME_FOLLOWED]: 5,
  [HypeTransactionReason.DAILY_LOGIN]: 10,
};

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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Concede XP de forma idempotente (user + reason + referenceId).
   * Falhas são silenciosas para não quebrar fluxos principais.
   */
  async awardXp(params: {
    userId: number;
    reason: HypeTransactionReason;
    referenceId?: number;
    deltaPoints?: number;
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
          },
        });
        if (existing) return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.hypeTransaction.create({
          data: {
            userId: params.userId,
            reason: params.reason,
            referenceId: params.referenceId ?? null,
            deltaPoints: points,
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
    } catch {
      // Gamificação não deve bloquear comentários/likes/ratings
    }
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
