import { Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { ACHIEVEMENTS } from "./achievements.constants";
import { getLevelInfo } from "./level.utils";
import { calculateStreak } from "./streak.utils";

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ========== RECORD ACTIVITY (вызывается после правильного ответа) ==========
  /**
   * Обновляет стрик и проверяет ачивки. Лучше не валит запрос если что-то упадёт.
   * Вызывается из AnswersService после успешного сабмита.
   */
  async recordActivity(userId: string): Promise<void> {
    try {
      await this.updateStreak(userId);
      await this.checkAchievements(userId);
    } catch (err) {
      // Не пробрасываем — если апдейт стрика упал, ответ всё равно засчитан
      this.logger.error(`Failed to record activity for user ${userId}`, err);
    }
  }

  // ========== STREAK UPDATE ==========
  private async updateStreak(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
      },
    });
    if (!user) return;

    const update = calculateStreak(
      new Date(),
      user.lastActiveDate,
      user.currentStreak,
      user.longestStreak,
    );

    if (!update.isNewDay) {
      // Сегодня уже считали — ничего не обновляем
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: update.newCurrentStreak,
        longestStreak: update.newLongestStreak,
        lastActiveDate: update.newLastActiveDate,
      },
    });
  }

  // ========== ACHIEVEMENTS CHECK ==========
  private async checkAchievements(userId: string): Promise<void> {
    // Тянем уже открытые ачивки, чтобы не делать дублирующие проверки
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedSet = new Set(unlocked.map((a) => a.achievementId));

    // Идём по каталогу. Для каждой ачивки, которая ещё не открыта —
    // вызываем её check(). Если true — открываем.
    for (const achievement of ACHIEVEMENTS) {
      if (unlockedSet.has(achievement.id)) continue;

      const earned = await achievement.check(this.prisma, userId);
      if (earned) {
        try {
          await this.prisma.userAchievement.create({
            data: { userId, achievementId: achievement.id },
          });
          this.logger.log(
            `User ${userId} unlocked achievement: ${achievement.id}`,
          );
        } catch {
          // Race condition защита: если параллельный запрос успел создать ту же запись.
          // P2002 ошибка, игнорируем
          this.logger.debug(
            `Achievement ${achievement.id} already exists for user ${userId}`,
          );
        }
      }
    }
  }

  // ========== ПУБЛИЧНЫЕ READ-ЭНДПОИНТЫ ==========

  async getMyGamificationInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalXp: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
      },
    });
    if (!user) throw new Error("User not found");

    const level = getLevelInfo(user.totalXp);

    // XP за последние 7 дней
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyAggregate = await this.prisma.answerSubmission.aggregate({
      where: {
        userId,
        firstCorrectAt: { gte: weekAgo },
      },
      _sum: { pointsEarned: true },
    });
    const weeklyXp = weeklyAggregate._sum.pointsEarned ?? 0;

    // Сколько ачивок открыто из общего числа
    const unlockedAchievementsCount = await this.prisma.userAchievement.count({
      where: { userId },
    });

    return {
      totalXp: user.totalXp,
      weeklyXp,
      level,
      streak: {
        current: user.currentStreak,
        longest: user.longestStreak,
        lastActiveDate: user.lastActiveDate,
      },
      achievements: {
        unlocked: unlockedAchievementsCount,
        total: ACHIEVEMENTS.length,
      },
    };
  }

  async getAllAchievementsWithProgress(userId: string) {
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    });
    const unlockedMap = new Map(
      unlocked.map((u) => [u.achievementId, u.unlockedAt]),
    );

    return Promise.all(
      ACHIEVEMENTS.map(async (a) => {
        const isUnlocked = unlockedMap.has(a.id);
        // у открытых прогресс не считаем — он и так 100%
        const current = isUnlocked
          ? a.target
          : Math.min(await a.progress(this.prisma, userId), a.target);
        return {
          id: a.id,
          name: a.name,
          description: a.description,
          iconUrl: a.iconUrl,
          unlocked: isUnlocked,
          unlockedAt: unlockedMap.get(a.id) ?? null,
          progress: { current, target: a.target },
        };
      }),
    );
  }

  // ========== LEADERBOARD ==========

  async getLeaderboard(
    period: "all" | "week",
    limit = 100,
    requesterId?: string,
  ) {
    if (period === "all") {
      const users = await this.prisma.user.findMany({
        where: { isActive: true, totalXp: { gt: 0 } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          totalXp: true,
          currentStreak: true,
        },
        orderBy: { totalXp: "desc" },
        take: limit,
      });

      const entries = users.map((u, index) => ({
        rank: index + 1,
        userId: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        avatarUrl: u.avatarUrl,
        xp: u.totalXp,
        currentStreak: u.currentStreak,
      }));

      // Если меня нет в топе — считаю мою позицию отдельно
      let me: (typeof entries)[number] | null = null;
      if (requesterId && !entries.some((e) => e.userId === requesterId)) {
        const u = await this.prisma.user.findUnique({
          where: { id: requesterId },
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            totalXp: true,
            currentStreak: true,
          },
        });
        if (u && u.totalXp > 0) {
          const higher = await this.prisma.user.count({
            where: { isActive: true, totalXp: { gt: u.totalXp } },
          });
          me = {
            rank: higher + 1,
            userId: requesterId,
            firstName: u.firstName,
            lastName: u.lastName,
            avatarUrl: u.avatarUrl,
            xp: u.totalXp,
            currentStreak: u.currentStreak,
          };
        }
      }

      return { entries, me };
    }

    // period === "week" — агрегат по AnswerSubmission за последние 7 дней
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const allSums = await this.prisma.answerSubmission.groupBy({
      by: ["userId"],
      where: { firstCorrectAt: { gte: weekAgo } },
      _sum: { pointsEarned: true },
      orderBy: { _sum: { pointsEarned: "desc" } },
    });

    if (allSums.length === 0) return { entries: [], me: null };

    const top = allSums.slice(0, limit);
    const users = await this.prisma.user.findMany({
      where: { id: { in: allSums.map((g) => g.userId) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        currentStreak: true,
      },
    });
    const usersMap = new Map(users.map((u) => [u.id, u]));

    const entries = top
      .map((g, index) => {
        const user = usersMap.get(g.userId);
        if (!user) return null;
        return {
          rank: index + 1,
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          xp: g._sum.pointsEarned ?? 0,
          currentStreak: user.currentStreak,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    let me: (typeof entries)[number] | null = null;
    if (requesterId && !entries.some((e) => e.userId === requesterId)) {
      const myIdx = allSums.findIndex((g) => g.userId === requesterId);
      const user = usersMap.get(requesterId);
      if (myIdx !== -1 && user) {
        me = {
          rank: myIdx + 1,
          userId: requesterId,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          xp: allSums[myIdx]!._sum.pointsEarned ?? 0,
          currentStreak: user.currentStreak,
        };
      }
    }

    return { entries, me };
  }
}
