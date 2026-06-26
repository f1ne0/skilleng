import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  CefrLevel,
  ExamType,
  Prisma,
  QuestionType,
} from "@prisma/client";

import { checkAnswerCorrectness, validateAnswerShape } from "../answers/answer.utils";
import { ContentService } from "../content/content.service";
import { ContentSkill } from "../content/dto/generate-questions.dto";
import { PrismaService } from "../prisma/prisma.service";
import { toStudentView, validatePayloadByType } from "../questions/payload.utils";
import { SubmitExamDto } from "./dto/submit-exam.dto";

/**
 * Уроки, связанные с экзаменом, по его метке юнитов ("Units 1-3").
 * Номер юнита берём из заголовка урока ("Unit 3: ...").
 * Если метку/номера распарсить нельзя — возвращаем ВСЕ уроки (fallback).
 */
function relatedLessons<T extends { id: string; title: string }>(
  unitsLabel: string | null,
  lessons: T[],
): T[] {
  if (!unitsLabel) return lessons;
  const nums = unitsLabel.match(/\d+/g);
  if (!nums || nums.length === 0) return lessons;
  const from = Math.min(...nums.map(Number));
  const to = Math.max(...nums.map(Number));
  const inRange = lessons.filter((l) => {
    const m = l.title.match(/unit\s+(\d+)/i);
    if (!m) return false;
    const n = Number(m[1]);
    return n >= from && n <= to;
  });
  // если ни один урок не совпал с диапазоном — безопасный fallback на все
  return inRange.length > 0 ? inRange : lessons;
}

// В экзаменах — только авто-проверяемые типы (мгновенный балл, без AI-оценки)
const EXAM_TYPES: QuestionType[] = [
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.FILL_BLANK,
  QuestionType.DRAG_DROP,
  QuestionType.MATCH_PAIRS,
];

interface StoredAnswer {
  questionId: string;
  answer: Record<string, unknown>;
  isCorrect: boolean;
  pointsEarned: number;
}

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentService: ContentService,
  ) {}

  // ========== LIST (для курса) ==========
  /** Список экзаменов курса. Для студента — со статусом его лучшей попытки */
  async listForCourse(courseId: string, userId: string) {
    const exams = await this.prisma.exam.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { userId, status: "COMPLETED" },
          orderBy: { score: "desc" },
          take: 1,
        },
      },
    });

    // Экзамен открывается после прохождения СВЯЗАННЫХ юнитов (а не всех).
    const publishedLessons = await this.prisma.lesson.findMany({
      where: { courseId, status: "PUBLISHED" },
      select: { id: true, title: true },
    });
    const completed = await this.prisma.lessonCompletion.findMany({
      where: { userId, lesson: { courseId } },
      select: { lessonId: true },
    });
    const completedSet = new Set(completed.map((c) => c.lessonId));

    return exams.map((e) => {
      const related = relatedLessons(e.unitsLabel, publishedLessons);
      const remaining = related.filter((l) => !completedSet.has(l.id)).length;
      // нет связанных уроков (странный кейс) — не блокируем по урокам
      const lessonsLocked = related.length > 0 && remaining > 0;
      return {
        id: e.id,
        title: e.title,
        type: e.type,
        order: e.order,
        unitsLabel: e.unitsLabel,
        passingScore: e.passingScore,
        questionCount: e._count.questions,
        // Заблокирован, пока не пройдены связанные юниты
        isLocked: lessonsLocked,
        lessonsRemaining: remaining,
        bestAttempt: e.attempts[0]
          ? {
              score: e.attempts[0].score,
              passed: e.attempts[0].passed,
              completedAt: e.attempts[0].completedAt,
            }
          : null,
      };
    });
  }

  // ========== START (студент) ==========
  async start(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    if (exam.questions.length === 0) {
      throw new BadRequestException(
        "This exam has no questions yet. Ask your teacher to generate them.",
      );
    }

    // Экзамен доступен только после прохождения СВЯЗАННЫХ юнитов
    const publishedLessons = await this.prisma.lesson.findMany({
      where: { courseId: exam.courseId, status: "PUBLISHED" },
      select: { id: true, title: true },
    });
    const related = relatedLessons(exam.unitsLabel, publishedLessons);
    if (related.length > 0) {
      const doneCount = await this.prisma.lessonCompletion.count({
        where: { userId, lessonId: { in: related.map((l) => l.id) } },
      });
      if (doneCount < related.length) {
        throw new ForbiddenException(
          "Complete the related units before taking this exam",
        );
      }
    }

    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        userId,
        totalPoints: exam.questions.reduce((s, q) => s + q.points, 0),
      },
    });

    return {
      attemptId: attempt.id,
      exam: {
        id: exam.id,
        title: exam.title,
        type: exam.type,
        unitsLabel: exam.unitsLabel,
        passingScore: exam.passingScore,
      },
      // payload без правильных ответов
      questions: exam.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        points: q.points,
        payload: toStudentView(q.type, q.payload),
      })),
    };
  }

  // ========== SUBMIT + АВТО-ПРОВЕРКА (студент) ==========
  async submit(attemptId: string, userId: string, dto: SubmitExamDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: { include: { questions: true } } },
    });
    if (!attempt) throw new NotFoundException("Attempt not found");
    if (attempt.userId !== userId) {
      throw new ForbiddenException("Not your attempt");
    }
    if (attempt.status === "COMPLETED") {
      throw new BadRequestException("This attempt is already submitted");
    }

    const answerByQ = new Map(dto.answers.map((a) => [a.questionId, a.answer]));
    const stored: StoredAnswer[] = [];
    let earned = 0;
    let total = 0;

    for (const q of attempt.exam.questions) {
      total += q.points;
      const raw = answerByQ.get(q.id);
      if (!raw) {
        stored.push({ questionId: q.id, answer: {}, isCorrect: false, pointsEarned: 0 });
        continue;
      }
      // та же валидация и проверка, что в обычных уроках
      let isCorrect = false;
      try {
        const validated = await validateAnswerShape(q.type, raw);
        isCorrect = checkAnswerCorrectness(q.type, q.payload, validated) === true;
      } catch {
        isCorrect = false;
      }
      const pts = isCorrect ? q.points : 0;
      earned += pts;
      stored.push({ questionId: q.id, answer: raw, isCorrect, pointsEarned: pts });
    }

    const score = total > 0 ? Math.round((earned / total) * 100) : 0;
    const passed = score >= attempt.exam.passingScore;

    const updated = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        score,
        earnedPoints: earned,
        totalPoints: total,
        passed,
        answers: stored as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return {
      attemptId: updated.id,
      score,
      passed,
      earnedPoints: earned,
      totalPoints: total,
      // покомпонентная разбивка — что верно/неверно
      breakdown: attempt.exam.questions.map((q) => {
        const r = stored.find((s) => s.questionId === q.id);
        return {
          questionId: q.id,
          prompt: q.prompt,
          isCorrect: r?.isCorrect ?? false,
        };
      }),
    };
  }

  // ========== TEACHER: генерация вопросов в существующий экзамен ==========
  async generateQuestions(
    examId: string,
    teacherId: string,
    count: number,
    types?: QuestionType[],
  ) {
    const exam = await this.assertOwnedExam(examId, teacherId);

    // Разрешаем только авто-проверяемые типы; пусто → все
    const allowedTypes =
      types && types.length > 0
        ? types.filter((t) => EXAM_TYPES.includes(t))
        : EXAM_TYPES;
    const examTypes = allowedTypes.length > 0 ? allowedTypes : EXAM_TYPES;

    const course = await this.prisma.course.findUnique({
      where: { id: exam.courseId },
      select: { level: true },
    });
    const level: CefrLevel = course?.level ?? "B1";

    // Темы экзамена берём из РЕАЛЬНЫХ уроков курса (а не из захардкоженных юнитов).
    // Работает для любого курса — и для English for IT, и для AI-сгенерированных.
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId: exam.courseId, status: { not: "ARCHIVED" } },
      orderBy: { order: "asc" },
      select: { title: true, order: true },
    });
    if (lessons.length === 0) {
      throw new BadRequestException(
        "Add lessons to this course before generating an exam.",
      );
    }

    // "Units 1-3" → берём уроки с позициями 1..3 (order 0-based). Пусто → весь курс.
    const range = this.parseUnitRange(exam.unitsLabel);
    let chosen = lessons;
    if (range) {
      chosen = lessons.filter(
        (l) => l.order + 1 >= range.from && l.order + 1 <= range.to,
      );
    }
    if (chosen.length === 0) chosen = lessons;

    // Распределяем count по урокам поровну (минимум 1 на урок)
    const perLesson = Math.max(1, Math.floor(count / chosen.length));
    const generated: {
      type: QuestionType;
      prompt: string;
      payload: Record<string, unknown>;
    }[] = [];

    for (const lesson of chosen) {
      try {
        const res = await this.contentService.generateQuestions({
          topic: lesson.title,
          level,
          skill: ContentSkill.GRAMMAR,
          types: examTypes,
          count: perLesson,
        });
        for (const q of res.questions) {
          generated.push({ type: q.type, prompt: q.prompt, payload: q.payload });
        }
      } catch (err) {
        this.logger.warn(
          `Exam gen failed for lesson "${lesson.title}": ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    if (generated.length === 0) {
      throw new BadRequestException(
        "AI failed to generate exam questions. Check the Gemini API key and try again.",
      );
    }

    // Перезаписываем вопросы экзамена сгенерированными
    await this.prisma.$transaction([
      this.prisma.examQuestion.deleteMany({ where: { examId } }),
      this.prisma.examQuestion.createMany({
        data: generated.slice(0, count).map((q, i) => ({
          examId,
          type: q.type,
          prompt: q.prompt,
          payload: q.payload as Prisma.InputJsonValue,
          points: 10,
          order: i,
        })),
      }),
    ]);

    return {
      examId,
      generated: Math.min(generated.length, count),
    };
  }

  // ========== TEACHER: создать экзамен для курса ==========
  async createForCourse(
    teacherId: string,
    dto: {
      courseId: string;
      title: string;
      type: ExamType;
      unitsLabel?: string;
      passingScore?: number;
    },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { ownerId: true },
    });
    if (!course) throw new NotFoundException("Course not found");
    if (course.ownerId !== teacherId) {
      throw new ForbiddenException("You are not the owner of this course");
    }

    const last = await this.prisma.exam.findFirst({
      where: { courseId: dto.courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const exam = await this.prisma.exam.create({
      data: {
        courseId: dto.courseId,
        title: dto.title.trim(),
        type: dto.type,
        unitsLabel: dto.unitsLabel?.trim() || null,
        passingScore: dto.passingScore ?? (dto.type === "FINAL" ? 70 : 60),
        order: (last?.order ?? -1) + 1,
      },
    });

    return {
      id: exam.id,
      title: exam.title,
      type: exam.type,
      order: exam.order,
      unitsLabel: exam.unitsLabel,
      passingScore: exam.passingScore,
      questionCount: 0,
      bestAttempt: null,
    };
  }

  // ========== TEACHER: редактировать экзамен ==========
  async updateExam(
    examId: string,
    teacherId: string,
    dto: {
      title?: string;
      type?: ExamType;
      unitsLabel?: string;
      passingScore?: number;
    },
  ) {
    await this.assertOwnedExam(examId, teacherId);
    const exam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.unitsLabel !== undefined && {
          unitsLabel: dto.unitsLabel.trim() || null,
        }),
        ...(dto.passingScore !== undefined && { passingScore: dto.passingScore }),
      },
      include: { _count: { select: { questions: true } } },
    });
    return {
      id: exam.id,
      title: exam.title,
      type: exam.type,
      order: exam.order,
      unitsLabel: exam.unitsLabel,
      passingScore: exam.passingScore,
      questionCount: exam._count.questions,
      bestAttempt: null,
    };
  }

  // ========== TEACHER: добавить один вопрос вручную ==========
  async addQuestion(
    examId: string,
    teacherId: string,
    dto: { type: QuestionType; prompt: string; payload: unknown; points?: number },
  ) {
    await this.assertOwnedExam(examId, teacherId);
    if (!EXAM_TYPES.includes(dto.type)) {
      throw new BadRequestException(
        "Exams support only auto-graded question types.",
      );
    }
    const payload = await validatePayloadByType(dto.type, dto.payload);
    const last = await this.prisma.examQuestion.findFirst({
      where: { examId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const q = await this.prisma.examQuestion.create({
      data: {
        examId,
        type: dto.type,
        prompt: dto.prompt.trim(),
        payload: payload as Prisma.InputJsonValue,
        points: dto.points ?? 10,
        order: (last?.order ?? -1) + 1,
      },
    });
    return { id: q.id };
  }

  // ========== TEACHER: удалить один вопрос ==========
  async removeQuestion(questionId: string, teacherId: string) {
    const q = await this.prisma.examQuestion.findUnique({
      where: { id: questionId },
      include: { exam: { include: { course: { select: { ownerId: true } } } } },
    });
    if (!q) throw new NotFoundException("Question not found");
    if (q.exam.course.ownerId !== teacherId) {
      throw new ForbiddenException("You are not the owner of this exam's course");
    }
    await this.prisma.examQuestion.delete({ where: { id: questionId } });
    return { success: true };
  }

  // ========== TEACHER: удалить экзамен ==========
  async remove(examId: string, teacherId: string) {
    await this.assertOwnedExam(examId, teacherId);
    await this.prisma.exam.delete({ where: { id: examId } });
    return { success: true };
  }

  // ========== TEACHER: содержимое экзамена (с правильными ответами) ==========
  async getForTeacher(examId: string, teacherId: string) {
    const exam = await this.assertOwnedExam(examId, teacherId);
    const questions = await this.prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { order: "asc" },
    });
    return {
      id: exam.id,
      title: exam.title,
      type: exam.type,
      unitsLabel: exam.unitsLabel,
      passingScore: exam.passingScore,
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        points: q.points,
        // владельцу отдаём полный payload (с правильными ответами)
        payload: q.payload,
      })),
    };
  }

  // ========== TEACHER: результаты экзамена ==========
  async results(examId: string, teacherId: string) {
    const exam = await this.assertOwnedExam(examId, teacherId);

    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Лучшая попытка на студента
    const bestByUser = new Map<string, (typeof attempts)[number]>();
    for (const a of attempts) {
      const prev = bestByUser.get(a.userId);
      if (!prev || (a.score ?? 0) > (prev.score ?? 0)) bestByUser.set(a.userId, a);
    }
    const best = [...bestByUser.values()];

    const scores = best.map((a) => a.score ?? 0);
    const avg =
      scores.length > 0
        ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
        : null;

    return {
      exam: { id: exam.id, title: exam.title, type: exam.type, unitsLabel: exam.unitsLabel },
      stats: {
        students: best.length,
        averageScore: avg,
        passed: best.filter((a) => a.passed).length,
      },
      students: best.map((a) => ({
        userId: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName,
        score: a.score,
        passed: a.passed,
        completedAt: a.completedAt,
      })),
    };
  }

  // ========== HELPERS ==========

  private async assertOwnedExam(examId: string, teacherId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { course: { select: { ownerId: true } } },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    if (exam.course.ownerId !== teacherId) {
      throw new ForbiddenException("You are not the owner of this exam's course");
    }
    return exam;
  }

  /** "Units 1-3" → {from:1,to:3}; "Unit 2" → {from:2,to:2}; пусто → null (весь курс) */
  private parseUnitRange(
    unitsLabel: string | null,
  ): { from: number; to: number } | null {
    if (!unitsLabel) return null;
    const m = unitsLabel.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (m) return { from: Number(m[1]), to: Number(m[2]) };
    const single = unitsLabel.match(/(\d+)/);
    if (single) return { from: Number(single[1]), to: Number(single[1]) };
    return null;
  }
}

export { ExamType };
