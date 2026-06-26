import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { CefrLevel, PlacementStatus, Prisma, QuestionType } from "@prisma/client";

import { checkAnswerCorrectness, validateAnswerShape } from "../answers/answer.utils";
import { ContentService } from "../content/content.service";
import { LearningPathService } from "../learning-path/learning-path.service";
import { PrismaService } from "../prisma/prisma.service";
import { toStudentView } from "../questions/payload.utils";
import {
  abilityToCefr,
  LEVEL_DIFFICULTY_CENTER,
  MAX_QUESTIONS,
  selectNextItem,
  shouldStop,
  updateAbility,
} from "./placement.algorithm";

// Вопрос в форме для студента: payload без правильных ответов
export interface PlacementQuestionView {
  itemId: string;
  type: QuestionType;
  prompt: string;
  payload: Record<string, unknown>;
}

const ALL_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

@Injectable()
export class PlacementService {
  private readonly logger = new Logger(PlacementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentService: ContentService,
    private readonly learningPathService: LearningPathService,
  ) {}

  // ========== START ==========
  async start(userId: string) {
    // Незавершённый тест — продолжаем, а не плодим новые
    const existing = await this.prisma.placementTest.findFirst({
      where: { userId, status: PlacementStatus.IN_PROGRESS },
      orderBy: { startedAt: "desc" },
    });

    if (existing) {
      const question = await this.currentQuestionView(existing.currentItemId);
      if (question) {
        return this.toProgressResponse(existing, question);
      }
      // currentItemId потерян/битый — выберем заново ниже
    }

    const test =
      existing ??
      (await this.prisma.placementTest.create({ data: { userId } }));

    const next = await this.pickNextItem(test.id, test.ability);
    if (!next) {
      throw new BadRequestException(
        "Placement item bank is empty. Ask a teacher to seed it first.",
      );
    }

    const updated = await this.prisma.placementTest.update({
      where: { id: test.id },
      data: { currentItemId: next.id },
    });

    return this.toProgressResponse(updated, this.itemToView(next));
  }

  // ========== ANSWER ==========
  async answer(
    testId: string,
    userId: string,
    dto: { itemId: string; answer: Record<string, unknown> },
  ) {
    const test = await this.prisma.placementTest.findFirst({
      where: { id: testId, userId },
    });
    if (!test) throw new NotFoundException("Placement test not found");
    if (test.status !== PlacementStatus.IN_PROGRESS) {
      throw new BadRequestException("Test is already completed");
    }
    // Server-authoritative: принимаем ответ только на выданный вопрос
    if (!test.currentItemId || dto.itemId !== test.currentItemId) {
      throw new BadRequestException("Answer must target the current question");
    }

    const item = await this.prisma.placementItem.findUnique({
      where: { id: test.currentItemId },
    });
    if (!item) throw new NotFoundException("Placement item not found");

    // Валидация формы ответа + проверка правильности — те же функции,
    // что и в обычных уроках
    const validated = await validateAnswerShape(item.type, dto.answer);
    const isCorrect =
      checkAnswerCorrectness(item.type, item.payload, validated) === true;

    const prevAbility = test.ability;
    const newAbility = updateAbility(
      prevAbility,
      test.questionsAsked,
      item.difficulty,
      isCorrect,
    );
    const questionsAsked = test.questionsAsked + 1;
    const delta = newAbility - prevAbility;

    const stop = shouldStop(questionsAsked, delta);
    // Останавливаемся также при исчерпании банка
    const next = stop ? null : await this.pickNextItem(testId, newAbility);
    const finished = stop || next === null;

    const estimatedLevel = finished ? abilityToCefr(newAbility) : null;

    const [updatedTest] = await this.prisma.$transaction([
      this.prisma.placementTest.update({
        where: { id: testId },
        data: {
          ability: newAbility,
          questionsAsked,
          currentItemId: next?.id ?? null,
          ...(finished && {
            status: PlacementStatus.COMPLETED,
            estimatedLevel,
            completedAt: new Date(),
          }),
        },
      }),
      this.prisma.placementResponse.create({
        data: {
          testId,
          itemId: item.id,
          difficulty: item.difficulty,
          isCorrect,
          abilityAfter: newAbility,
        },
      }),
      // По завершении — уровень в профиль (диагностика → персонализация)
      ...(finished && estimatedLevel
        ? [
            this.prisma.user.update({
              where: { id: userId },
              data: { level: estimatedLevel },
            }),
          ]
        : []),
    ]);

    if (finished) {
      // Блок 4: уровень определён → строим/обновляем траекторию.
      // Если путь уже есть — тест был CHECKPOINT-узлом, закрываем его.
      // Fire-and-forget: не блокируем ответ юзеру.
      void (async () => {
        const hasPath = await this.prisma.learningPath.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (hasPath) {
          await this.learningPathService.onPlacementCompleted(userId);
        } else {
          await this.learningPathService
            .generateForUser(userId)
            .catch((err) =>
              this.logger.warn(
                `Path generation after placement failed: ${err instanceof Error ? err.message : err}`,
              ),
            );
        }
      })();
    }

    if (finished) {
      return {
        done: true as const,
        isCorrect,
        result: {
          estimatedLevel,
          ability: newAbility,
          questionsAsked,
        },
      };
    }

    return {
      done: false as const,
      isCorrect,
      ...this.toProgressResponse(updatedTest, this.itemToView(next!)),
    };
  }

  // ========== STATE ==========
  async getState(testId: string, userId: string) {
    const test = await this.prisma.placementTest.findFirst({
      where: { id: testId, userId },
      include: { responses: { orderBy: { answeredAt: "asc" } } },
    });
    if (!test) throw new NotFoundException("Placement test not found");

    return {
      id: test.id,
      status: test.status,
      questionsAsked: test.questionsAsked,
      maxQuestions: MAX_QUESTIONS,
      estimatedLevel: test.estimatedLevel,
      // траектория ability — для аналитики (и графика в дипломе)
      trajectory: test.responses.map((r) => ({
        difficulty: r.difficulty,
        isCorrect: r.isCorrect,
        abilityAfter: r.abilityAfter,
      })),
      startedAt: test.startedAt,
      completedAt: test.completedAt,
    };
  }

  // ========== BANK SEED (TEACHER) ==========
  /**
   * Наполнение банка через AI-генерацию (Блок 2): по perLevel
   * MULTIPLE_CHOICE-вопросов на каждый CEFR-уровень. Сложность =
   * центр уровня + равномерный разброс ±0.4.
   */
  async seedBank(perLevel: number) {
    let created = 0;

    for (const level of ALL_LEVELS) {
      const { questions } = await this.contentService.generateQuestions({
        topic: "General English: grammar and vocabulary in everyday contexts",
        level,
        types: [QuestionType.MULTIPLE_CHOICE],
        count: perLevel,
      });

      const center = LEVEL_DIFFICULTY_CENTER[level];
      const data = questions.map((q, i) => ({
        level,
        // разброс вокруг центра уровня, клампим в шкалу
        difficulty: Math.max(
          -3,
          Math.min(
            3,
            center +
              (questions.length > 1
                ? ((i / (questions.length - 1)) * 2 - 1) * 0.4
                : 0),
          ),
        ),
        type: q.type,
        prompt: q.prompt,
        payload: q.payload as Prisma.InputJsonValue,
      }));

      await this.prisma.placementItem.createMany({ data });
      created += data.length;
      this.logger.log(`Seeded ${data.length} placement items for ${level}`);
    }

    return { created, total: await this.prisma.placementItem.count() };
  }

  async bankStats() {
    const grouped = await this.prisma.placementItem.groupBy({
      by: ["level"],
      _count: { _all: true },
    });
    const byLevel = Object.fromEntries(
      grouped.map((g) => [g.level, g._count._all]),
    );
    return {
      total: await this.prisma.placementItem.count(),
      byLevel,
    };
  }

  // ========== HELPERS ==========

  private async pickNextItem(testId: string, ability: number) {
    const answered = await this.prisma.placementResponse.findMany({
      where: { testId },
      select: { itemId: true },
    });
    const askedIds = new Set(answered.map((r) => r.itemId));

    // Банк небольшой (десятки-сотни) — выбираем в памяти чистой функцией.
    // При росте банка можно перейти на ORDER BY abs(difficulty - $1) LIMIT 1
    const items = await this.prisma.placementItem.findMany({
      select: { id: true, difficulty: true },
    });

    const selected = selectNextItem(ability, items, askedIds);
    if (!selected) return null;

    return this.prisma.placementItem.findUnique({
      where: { id: selected.id },
    });
  }

  private itemToView(item: {
    id: string;
    type: QuestionType;
    prompt: string;
    payload: Prisma.JsonValue;
  }): PlacementQuestionView {
    return {
      itemId: item.id,
      type: item.type,
      prompt: item.prompt,
      // НИКОГДА не отдаём сырой payload — там correctIndex
      payload: toStudentView(item.type, item.payload),
    };
  }

  private async currentQuestionView(
    currentItemId: string | null,
  ): Promise<PlacementQuestionView | null> {
    if (!currentItemId) return null;
    const item = await this.prisma.placementItem.findUnique({
      where: { id: currentItemId },
    });
    return item ? this.itemToView(item) : null;
  }

  private toProgressResponse(
    test: { id: string; questionsAsked: number },
    question: PlacementQuestionView,
  ) {
    return {
      testId: test.id,
      question,
      progress: {
        asked: test.questionsAsked,
        max: MAX_QUESTIONS,
      },
    };
  }
}
