import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, QuestionType } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { STORAGE, type StorageDriver } from "../uploads/storage.driver";
import {
  checkAnswerCorrectness,
  getCorrectAnswerView,
  validateAnswerShape,
} from "./answer.utils";
import { SubmitAnswerDto } from "./dto/submit-answer.dto";
import { GamificationService } from "../gamification/gamification.service";
import { AIService } from "../ai/ai.service";
import {
  ShortWritingPayload,
  SpeakingResponsePayload,
} from "../questions/dto/payloads";

@Injectable()
export class AnswersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
    private readonly aiService: AIService,
    private readonly config: ConfigService,
    @Inject(STORAGE) private readonly storage: StorageDriver,
  ) {}

  // ========== SUBMIT ANSWER ==========
  async submit(questionId: string, userId: string, dto: SubmitAnswerDto) {
    // 1. Загружаем вопрос + проверяем доступ через lesson + course
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        lesson: {
          select: {
            id: true,
            status: true,
            isPreview: true,
            courseId: true,
            course: { select: { ownerId: true } },
          },
        },
      },
    });
    if (!question) throw new NotFoundException("Question not found");

    // Проверяем доступ к вопросу (через урок и enrollment)
    await this.assertStudentAccess(question.lesson, userId);

    // 2. Валидируем форму ответа под тип вопроса
    const validatedAnswer = await validateAnswerShape(
      question.type,
      dto.answer,
    );

    // Для устного ответа: запись должна лежать в НАШЕМ R2 и в папке ЭТОГО юзера
    if (question.type === QuestionType.SPEAKING_RESPONSE) {
      this.assertOwnSpeakingAudio(String(validatedAnswer.audioUrl), userId);
    }

    // 3. Проверяем правильность
    // null = "не могу определить" (SHORT_WRITING — оценивает AI асинхронно)
    const correctness = checkAnswerCorrectness(
      question.type,
      question.payload,
      validatedAnswer,
    );

    const isCorrect = correctness === true;

    // 4-5. Читаем существующий сабмит, решаем "первый ли это правильный",
    // апсертим и инкрементим totalXp — ВСЁ внутри одной транзакции.
    // Иначе два параллельных сабмита (двойной клик, retry после refresh токена)
    // оба прочитают isCorrect = false и оба начислят XP.
    // Serializable + повтор при конфликте сериализации защищают от гонки.
    const { isFirstCorrectAttempt } = await this.runSerializable(
      async (tx) => {
        const existing = await tx.answerSubmission.findUnique({
          where: { userId_questionId: { userId, questionId } },
        });

        const wasAlreadyCorrect = existing?.isCorrect === true;
        const firstCorrect = isCorrect && !wasAlreadyCorrect;

        // pointsEarned заблокирован после первого правильного ответа.
        // Если уже было правильно — оставляем как было.
        // Если только что стало правильно — начисляем points.
        // Если неправильно/не оценено — 0 (но не обнуляем уже заработанные).
        let pointsEarned: number;
        if (wasAlreadyCorrect && existing) {
          pointsEarned = existing.pointsEarned;
        } else if (isCorrect) {
          pointsEarned = question.points;
        } else {
          pointsEarned = 0;
        }

        await tx.answerSubmission.upsert({
          where: { userId_questionId: { userId, questionId } },
          create: {
            userId,
            questionId,
            answer: validatedAnswer as Prisma.InputJsonValue,
            // correctness может быть null — для SHORT_WRITING это "не оценено",
            // реальный вердикт проставит evaluateWritingAsync
            isCorrect: correctness,
            pointsEarned,
            attemptCount: 1,
            firstCorrectAt: isCorrect ? new Date() : null,
          },
          update: {
            answer: validatedAnswer as Prisma.InputJsonValue,
            isCorrect: wasAlreadyCorrect ? true : correctness,
            // не даём перебить уже правильный ответ неправильным
            pointsEarned,
            attemptCount: { increment: 1 },
            firstCorrectAt: firstCorrect ? new Date() : existing?.firstCorrectAt,
            submittedAt: new Date(),
          },
        });

        if (firstCorrect) {
          // Инкремент строго один раз: только когда внутри транзакции
          // подтверждён первый переход в правильное состояние
          await tx.user.update({
            where: { id: userId },
            data: { totalXp: { increment: question.points } },
          });
        }

        return { isFirstCorrectAttempt: firstCorrect };
      },
    );

    if (isFirstCorrectAttempt) {
      // Fire-and-forget: обновляем стрик и проверяем ачивки.
      // НЕ ждём — это не должно блокировать ответ юзеру.
      // Если упадёт — логируется внутри recordActivity.
      void this.gamificationService.recordActivity(userId);
    }

    if (question.type === QuestionType.SHORT_WRITING && correctness === null) {
      // запускаем в фоне — не ждём
      void this.evaluateWritingAsync(
        questionId,
        userId,
        question.prompt,
        validatedAnswer,
        question.payload,
      );
    }

    if (
      question.type === QuestionType.SPEAKING_RESPONSE &&
      correctness === null
    ) {
      // та же модель, что у письма: pending → фоновая AI-оценка
      void this.evaluateSpeakingAsync(
        questionId,
        userId,
        question.prompt,
        validatedAnswer,
        question.payload,
      );
    }
    // 6. Возвращаем результат студенту.
    // Для SHORT_WRITING isCorrect = null + pending: true — ответ отправлен
    // на AI-проверку, это НЕ окончательный вердикт "неверно".
    return {
      isCorrect: correctness,
      pending: correctness === null,
      isFirstCorrectAttempt,
      pointsEarned: isFirstCorrectAttempt ? question.points : 0,
      // показываем именно сколько начислили В ЭТОТ РАЗ
      explanation: question.explanation ?? null,
      // правильный ответ — только если студент ошибся
      correctAnswer: isCorrect
        ? null
        : getCorrectAnswerView(question.type, question.payload),
    };
  }

  // ========== GET MY ANSWER (review mode) ==========
  async findMyAnswer(questionId: string, userId: string) {
    const answer = await this.prisma.answerSubmission.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
    if (!answer) {
      throw new NotFoundException("You haven't answered this question yet");
    }
    return answer;
  }

  // ========== HELPERS ==========
  private async assertStudentAccess(
    lesson: {
      id: string;
      status: string;
      isPreview: boolean;
      courseId: string;
      course: { ownerId: string };
    },
    userId: string,
  ): Promise<void> {
    // Владелец курса — всегда имеет доступ
    if (lesson.course.ownerId === userId) return;

    // Иначе урок должен быть опубликован
    if (lesson.status !== "PUBLISHED") {
      throw new NotFoundException("Question not found");
    }

    // Preview доступен всем залогиненным
    if (lesson.isPreview) return;

    // Иначе нужен enrollment
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: lesson.courseId },
      },
    });
    if (!enrollment) {
      throw new ForbiddenException(
        "Enroll in the course to answer this question",
      );
    }
  }

  private async evaluateWritingAsync(
    questionId: string,
    userId: string,
    prompt: string,
    answer: Record<string, unknown>,
    payload: Prisma.JsonValue,
  ): Promise<void> {
    try {
      const p = payload as unknown as ShortWritingPayload;
      const text = (answer.text as string) ?? "";

      const evaluation = await this.aiService.evaluateWriting({
        questionPrompt: prompt,
        studentText: text,
        minWords: p.minWords,
        maxWords: p.maxWords,
        rubric: p.rubric,
      });

      // Сохраняем оценку. Также: если score >= 70, считаем "правильным" и начисляем XP
      const isPassingScore = evaluation.score >= 70;

      // Чтение pointsEarned и начисление XP — атомарно в одной транзакции,
      // чтобы повторная фоновая оценка не начислила XP дважды (идемпотентность)
      const awarded = await this.runSerializable(async (tx) => {
        const existing = await tx.answerSubmission.findUnique({
          where: { userId_questionId: { userId, questionId } },
          select: { pointsEarned: true, isCorrect: true, firstCorrectAt: true },
        });
        if (!existing) return false;

        // Начисляем XP только при первом переходе в правильное состояние
        const shouldAward =
          isPassingScore &&
          existing.pointsEarned === 0 &&
          existing.isCorrect !== true;

        const question = shouldAward
          ? await tx.question.findUnique({
              where: { id: questionId },
              select: { points: true },
            })
          : null;

        await tx.answerSubmission.update({
          where: { userId_questionId: { userId, questionId } },
          data: {
            aiFeedback: JSON.stringify({
              feedback: evaluation.feedback,
              strengths: evaluation.strengths,
              improvements: evaluation.improvements,
            }),
            aiScore: evaluation.score,
            // AI вынес вердикт: >= 70 — правильный, иначе неправильный
            isCorrect: existing.isCorrect === true ? true : isPassingScore,
            ...(shouldAward &&
              question && {
                pointsEarned: question.points,
                firstCorrectAt: existing.firstCorrectAt ?? new Date(),
              }),
          },
        });

        if (shouldAward && question) {
          await tx.user.update({
            where: { id: userId },
            data: { totalXp: { increment: question.points } },
          });
          return true;
        }
        return false;
      });

      if (awarded) {
        void this.gamificationService.recordActivity(userId);
      }
    } catch {
      // Не пробрасываем — AI оценка может упасть, но сабмит уже сохранён
      // Юзер может попросить переоценить позже
    }
  }

  private async evaluateSpeakingAsync(
    questionId: string,
    userId: string,
    prompt: string,
    answer: Record<string, unknown>,
    payload: Prisma.JsonValue,
  ): Promise<void> {
    try {
      const p = payload as unknown as SpeakingResponsePayload;
      const audioUrl = String(answer.audioUrl ?? "");

      const evaluation = await this.aiService.evaluateSpeaking({
        audioUrl,
        questionPrompt: prompt,
        expectedKeyPoints: p.expectedKeyPoints,
        minSeconds: p.minSeconds,
        maxSeconds: p.maxSeconds,
      });

      const isPassingScore = evaluation.score >= 70;

      // Идемпотентное начисление XP — та же схема, что у письма
      const awarded = await this.runSerializable(async (tx) => {
        const existing = await tx.answerSubmission.findUnique({
          where: { userId_questionId: { userId, questionId } },
          select: { pointsEarned: true, isCorrect: true, firstCorrectAt: true },
        });
        if (!existing) return false;

        const shouldAward =
          isPassingScore &&
          existing.pointsEarned === 0 &&
          existing.isCorrect !== true;

        const question = shouldAward
          ? await tx.question.findUnique({
              where: { id: questionId },
              select: { points: true },
            })
          : null;

        await tx.answerSubmission.update({
          where: { userId_questionId: { userId, questionId } },
          data: {
            aiFeedback: JSON.stringify({
              transcript: evaluation.transcript,
              feedback: evaluation.feedback,
              strengths: evaluation.strengths,
              improvements: evaluation.improvements,
            }),
            aiScore: evaluation.score,
            isCorrect: existing.isCorrect === true ? true : isPassingScore,
            ...(shouldAward &&
              question && {
                pointsEarned: question.points,
                firstCorrectAt: existing.firstCorrectAt ?? new Date(),
              }),
          },
        });

        if (shouldAward && question) {
          await tx.user.update({
            where: { id: userId },
            data: { totalXp: { increment: question.points } },
          });
          return true;
        }
        return false;
      });

      if (awarded) {
        void this.gamificationService.recordActivity(userId);
      }
    } catch {
      // Не пробрасываем — оценка может упасть, сабмит уже сохранён.
      // Юзер может пересдать (resubmit перезапустит оценку)
    }
  }

  /** Запись устного ответа обязана лежать в нашем хранилище в папке этого
   *  юзера: speaking/<userId>/... — иначе чужие/внешние URL.
   *  Работает и с R2, и с локальным диском (через драйвер хранилища). */
  private assertOwnSpeakingAudio(audioUrl: string, userId: string): void {
    const key = this.storage.extractKeyFromUrl(audioUrl);
    if (!key || !key.startsWith(`speaking/${userId}/`)) {
      throw new BadRequestException(
        "audioUrl must be a recording uploaded by you (purpose SPEAKING_RESPONSE)",
      );
    }
  }

  /**
   * Интерактивная транзакция с уровнем Serializable + одна повторная попытка
   * при конфликте сериализации (P2034 / 40001 в Postgres) или гонке уникального
   * индекса (P2002 при параллельном upsert). Используется для защиты начисления
   * XP от двойного инкремента при параллельных сабмитах.
   */
  private async runSerializable<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (err) {
      const isRetryable =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2034" || err.code === "P2002");
      if (!isRetryable) throw err;

      // Одна повторная попытка: после ретрая конкурирующая транзакция уже
      // зафиксирована, и мы прочитаем её результат
      return await this.prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    }
  }
}
