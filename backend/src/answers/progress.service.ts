import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { ACHIEVEMENTS_BY_ID } from "../gamification/achievements.constants";

export type RecentActivityItem =
  | {
      type: "LESSON_COMPLETED";
      at: Date;
      lessonId: string;
      lessonTitle: string;
      courseId: string;
      courseSlug: string;
      courseTitle: string;
    }
  | {
      type: "ACHIEVEMENT_UNLOCKED";
      at: Date;
      achievementId: string;
      name: string;
      description: string;
      iconUrl: string;
    };

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== PROGRESS BY COURSE ==========
  async forCourse(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException("Course not found");

    // Все вопросы в опубликованных уроках курса
    const totalQuestions = await this.prisma.question.count({
      where: {
        lesson: {
          courseId,
          status: "PUBLISHED",
        },
      },
    });

    // Сабмиты юзера для этих вопросов
    const submissions = await this.prisma.answerSubmission.findMany({
      where: {
        userId,
        question: {
          lesson: {
            courseId,
            status: "PUBLISHED",
          },
        },
      },
      select: {
        isCorrect: true,
        pointsEarned: true,
      },
    });

    const answered = submissions.length;
    const correct = submissions.filter((s) => s.isCorrect).length;
    const xpEarned = submissions.reduce((sum, s) => sum + s.pointsEarned, 0);

    // Завершённые уроки
    const completedLessons = await this.prisma.lessonCompletion.count({
      where: {
        userId,
        lesson: { courseId },
      },
    });
    const totalLessons = await this.prisma.lesson.count({
      where: { courseId, status: "PUBLISHED" },
    });

    return {
      totalQuestions,
      answered,
      correct,
      correctPercent:
        totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0,
      xpEarned,
      totalLessons,
      completedLessons,
      lessonCompletionPercent:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
    };
  }

  // ========== PROGRESS BY LESSON ==========
  async forLesson(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    const totalQuestions = await this.prisma.question.count({
      where: { lessonId },
    });

    const submissions = await this.prisma.answerSubmission.findMany({
      where: { userId, question: { lessonId } },
      select: { isCorrect: true, pointsEarned: true },
    });

    const answered = submissions.length;
    const correct = submissions.filter((s) => s.isCorrect).length;
    const xpEarned = submissions.reduce((sum, s) => sum + s.pointsEarned, 0);

    const completed = await this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    return {
      totalQuestions,
      answered,
      correct,
      allCorrect: correct === totalQuestions && totalQuestions > 0,
      // полезный флаг для UI: "ты ответил на все правильно, можно отмечать урок"
      xpEarned,
      isCompleted: !!completed,
      completedAt: completed?.completedAt ?? null,
    };
  }

  // ========== RECENT ACTIVITY ==========
  async recentActivity(userId: string, limit = 10): Promise<RecentActivityItem[]> {
    const take = Math.min(Math.max(limit, 1), 50);

    const [completions, achievements] = await Promise.all([
      this.prisma.lessonCompletion.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
        take,
        select: {
          completedAt: true,
          lesson: {
            select: {
              id: true,
              title: true,
              course: { select: { id: true, slug: true, title: true } },
            },
          },
        },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
        take,
        select: { achievementId: true, unlockedAt: true },
      }),
    ]);

    const items: RecentActivityItem[] = [
      ...completions.map<RecentActivityItem>((c) => ({
        type: "LESSON_COMPLETED",
        at: c.completedAt,
        lessonId: c.lesson.id,
        lessonTitle: c.lesson.title,
        courseId: c.lesson.course.id,
        courseSlug: c.lesson.course.slug,
        courseTitle: c.lesson.course.title,
      })),
      ...achievements
        .map<RecentActivityItem | null>((a) => {
          const meta = ACHIEVEMENTS_BY_ID.get(a.achievementId);
          if (!meta) return null;
          return {
            type: "ACHIEVEMENT_UNLOCKED",
            at: a.unlockedAt,
            achievementId: a.achievementId,
            name: meta.name,
            description: meta.description,
            iconUrl: meta.iconUrl,
          };
        })
        .filter((x): x is RecentActivityItem => x !== null),
    ];

    items.sort((a, b) => b.at.getTime() - a.at.getTime());
    return items.slice(0, take);
  }
}
