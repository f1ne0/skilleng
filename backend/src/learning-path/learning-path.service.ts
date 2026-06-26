import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  CefrLevel,
  CourseCategory,
  LearningGoal,
  PathNodeStatus,
  PathNodeType,
  Prisma,
  Skill,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

// Структура пути: после каждых LESSONS_PER_REVIEW уроков — SRS-повтор,
// после каждых LESSONS_PER_CHECKPOINT — контрольная точка (переоценка уровня)
const LESSONS_PER_REVIEW = 3;
const LESSONS_PER_CHECKPOINT = 6;
const MAX_LESSON_NODES = 18;

// Цель обучения → приоритетные категории курсов
const GOAL_CATEGORIES: Record<LearningGoal, CourseCategory[]> = {
  TRAVEL: ["CONVERSATION", "LISTENING", "VOCABULARY"],
  BUSINESS: ["BUSINESS_ENGLISH", "WRITING", "CONVERSATION"],
  ACADEMIC: ["READING", "WRITING", "GRAMMAR"],
  DAILY: ["CONVERSATION", "VOCABULARY", "LISTENING"],
  EXAM_PREP: ["IELTS", "EXAM_PREP", "GRAMMAR"],
};

// Категория курса → навык (для skillFocus узла, если урок не помечен)
const CATEGORY_SKILL: Partial<Record<CourseCategory, Skill>> = {
  READING: Skill.READING,
  LISTENING: Skill.LISTENING,
  CONVERSATION: Skill.SPEAKING,
  PRONUNCIATION: Skill.SPEAKING,
  WRITING: Skill.WRITING,
};

interface CandidateLesson {
  id: string;
  skillFocus: Skill | null;
  categorySkill: Skill | null;
  goalPriority: number;
  courseOrder: number;
  lessonOrder: number;
}

@Injectable()
export class LearningPathService {
  private readonly logger = new Logger(LearningPathService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ========== GENERATE ==========
  /**
   * Построение индивидуальной траектории по level + goal.
   * Идемпотентно: существующий путь пересоздаётся (прогресс пути сбрасывается,
   * прогресс по урокам/XP не трогается).
   */
  async generateForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, goal: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (!user.level) {
      throw new BadRequestException(
        "Set your level first (placement test or onboarding)",
      );
    }

    const lessons = await this.pickLessons(user.level, user.goal);
    if (lessons.length === 0) {
      throw new BadRequestException(
        "No published lessons match your level yet. Try again later.",
      );
    }

    // Собираем последовательность узлов:
    // уроки + REVIEW после каждых 3 + CHECKPOINT после каждых 6
    const nodes: Prisma.PathNodeCreateManyPathInput[] = [];
    let order = 0;
    lessons.forEach((lesson, i) => {
      nodes.push({
        order: order++,
        type: PathNodeType.LESSON,
        refId: lesson.id,
        skillFocus: lesson.skillFocus ?? lesson.categorySkill,
        status: PathNodeStatus.LOCKED,
      });
      const done = i + 1;
      if (done % LESSONS_PER_CHECKPOINT === 0) {
        nodes.push({
          order: order++,
          type: PathNodeType.CHECKPOINT,
          status: PathNodeStatus.LOCKED,
        });
      } else if (done % LESSONS_PER_REVIEW === 0) {
        nodes.push({
          order: order++,
          type: PathNodeType.REVIEW,
          status: PathNodeStatus.LOCKED,
        });
      }
    });
    // Первый узел сразу доступен
    if (nodes.length > 0) nodes[0].status = PathNodeStatus.AVAILABLE;

    const [, path] = await this.prisma.$transaction([
      this.prisma.learningPath.deleteMany({ where: { userId } }),
      this.prisma.learningPath.create({
        data: {
          userId,
          basedOnLevel: user.level,
          goal: user.goal,
          nodes: { createMany: { data: nodes } },
        },
      }),
    ]);

    this.logger.log(
      `Generated learning path for ${userId}: ${nodes.length} nodes (level ${user.level})`,
    );
    return this.getMyPath(userId, path.id);
  }

  // ========== GET ==========
  async getMyPath(userId: string, pathId?: string) {
    const path = await this.prisma.learningPath.findFirst({
      where: pathId ? { id: pathId, userId } : { userId },
      include: { nodes: { orderBy: { order: "asc" } } },
    });
    if (!path) return null;

    // Ленивое закрытие REVIEW: если текущий доступный узел — повтор,
    // а слов к повтору нет, узел считается пройденным
    await this.autoCompleteReviewIfCaughtUp(userId, path.id);

    const fresh = await this.prisma.learningPath.findUnique({
      where: { id: path.id },
      include: { nodes: { orderBy: { order: "asc" } } },
    });
    if (!fresh) return null;

    // Обогащаем LESSON-узлы данными урока (одним запросом)
    const lessonIds = fresh.nodes
      .filter((n) => n.type === PathNodeType.LESSON && n.refId)
      .map((n) => n.refId!);
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
      select: {
        id: true,
        title: true,
        durationSec: true,
        course: { select: { slug: true, title: true } },
      },
    });
    const lessonMap = new Map(lessons.map((l) => [l.id, l]));

    const completed = fresh.nodes.filter(
      (n) => n.status === PathNodeStatus.COMPLETED,
    ).length;

    return {
      id: fresh.id,
      basedOnLevel: fresh.basedOnLevel,
      goal: fresh.goal,
      createdAt: fresh.createdAt,
      progress: {
        completed,
        total: fresh.nodes.length,
      },
      nodes: fresh.nodes.map((n) => {
        const lesson = n.refId ? lessonMap.get(n.refId) : undefined;
        return {
          id: n.id,
          order: n.order,
          type: n.type,
          status: n.status,
          skillFocus: n.skillFocus,
          refId: n.refId,
          completedAt: n.completedAt,
          lesson: lesson
            ? {
                id: lesson.id,
                title: lesson.title,
                durationSec: lesson.durationSec,
                courseSlug: lesson.course.slug,
                courseTitle: lesson.course.title,
              }
            : null,
        };
      }),
    };
  }

  // ========== HOOKS (вызываются другими модулями) ==========

  /** Урок завершён → закрыть соответствующий доступный LESSON-узел */
  async onLessonCompleted(userId: string, lessonId: string): Promise<void> {
    try {
      await this.completeAvailableNode(userId, {
        type: PathNodeType.LESSON,
        refId: lessonId,
      });
    } catch (err) {
      // Хук не должен валить основной поток
      this.logger.error(`Path hook (lesson) failed for ${userId}`, err);
    }
  }

  /** Адаптивный тест завершён → закрыть доступный CHECKPOINT */
  async onPlacementCompleted(userId: string): Promise<void> {
    try {
      await this.completeAvailableNode(userId, {
        type: PathNodeType.CHECKPOINT,
      });
    } catch (err) {
      this.logger.error(`Path hook (checkpoint) failed for ${userId}`, err);
    }
  }

  /** SRS-повтор: если слов к повтору не осталось — закрыть доступный REVIEW */
  async onReviewProgress(userId: string): Promise<void> {
    try {
      const path = await this.prisma.learningPath.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (path) await this.autoCompleteReviewIfCaughtUp(userId, path.id);
    } catch (err) {
      this.logger.error(`Path hook (review) failed for ${userId}`, err);
    }
  }

  // ========== INTERNALS ==========

  private async autoCompleteReviewIfCaughtUp(
    userId: string,
    pathId: string,
  ): Promise<void> {
    const availableReview = await this.prisma.pathNode.findFirst({
      where: {
        pathId,
        type: PathNodeType.REVIEW,
        status: PathNodeStatus.AVAILABLE,
      },
    });
    if (!availableReview) return;

    const dueCount = await this.prisma.vocabularyEntry.count({
      where: { userId, dueAt: { lte: new Date() } },
    });
    if (dueCount > 0) return;

    await this.completeNodeAndUnlockNext(availableReview.id, pathId);
  }

  private async completeAvailableNode(
    userId: string,
    match: { type: PathNodeType; refId?: string },
  ): Promise<void> {
    const path = await this.prisma.learningPath.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!path) return;

    const node = await this.prisma.pathNode.findFirst({
      where: {
        pathId: path.id,
        type: match.type,
        status: PathNodeStatus.AVAILABLE,
        ...(match.refId && { refId: match.refId }),
      },
    });
    if (!node) return;

    await this.completeNodeAndUnlockNext(node.id, path.id);
  }

  /** Узлы открываются строго последовательно: complete текущий → AVAILABLE следующий */
  private async completeNodeAndUnlockNext(
    nodeId: string,
    pathId: string,
  ): Promise<void> {
    const node = await this.prisma.pathNode.update({
      where: { id: nodeId },
      data: { status: PathNodeStatus.COMPLETED, completedAt: new Date() },
    });

    const next = await this.prisma.pathNode.findFirst({
      where: {
        pathId,
        order: { gt: node.order },
        status: PathNodeStatus.LOCKED,
      },
      orderBy: { order: "asc" },
    });
    if (next) {
      await this.prisma.pathNode.update({
        where: { id: next.id },
        data: { status: PathNodeStatus.AVAILABLE },
      });
    }
  }

  /**
   * Подбор уроков: опубликованные уроки опубликованных курсов уровня юзера
   * (или без уровня). Курсы цели — первыми. Чередуем курсы, чтобы покрыть
   * разные навыки, а не идти подряд по одному курсу.
   */
  private async pickLessons(
    level: CefrLevel,
    goal: LearningGoal | null,
  ): Promise<CandidateLesson[]> {
    const goalCategories = goal ? GOAL_CATEGORIES[goal] : [];

    const courses = await this.prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ level }, { level: null }],
      },
      select: {
        id: true,
        slug: true,
        category: true,
        lessons: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: { id: true, skillFocus: true, order: true },
        },
      },
    });

    // Приоритет курса: чем раньше категория в goalCategories, тем выше.
    // Внутри одного приоритета — по slug (Semester 1 раньше Semester 2).
    const ranked = courses
      .filter((c) => c.lessons.length > 0)
      .map((c) => {
        const gi = goalCategories.indexOf(c.category);
        return { ...c, goalPriority: gi === -1 ? goalCategories.length : gi };
      })
      .sort((a, b) =>
        a.goalPriority !== b.goalPriority
          ? a.goalPriority - b.goalPriority
          : a.slug.localeCompare(b.slug),
      );

    // Последовательно: все уроки курса по порядку, затем следующий курс
    const result: CandidateLesson[] = [];
    for (const c of ranked) {
      c.lessons.forEach((l, li) => {
        if (result.length >= MAX_LESSON_NODES) return;
        result.push({
          id: l.id,
          skillFocus: l.skillFocus,
          categorySkill: CATEGORY_SKILL[c.category] ?? null,
          goalPriority: c.goalPriority,
          courseOrder: ranked.indexOf(c),
          lessonOrder: li,
        });
      });
      if (result.length >= MAX_LESSON_NODES) break;
    }

    return result;
  }
}
