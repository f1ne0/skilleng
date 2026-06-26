import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { ReorderQuestionsDto } from "./dto/reorder-questions.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { toStudentView, validatePayloadByType } from "./payload.utils";

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== CREATE ==========
  async create(lessonId: string, requesterId: string, dto: CreateQuestionDto) {
    await this.assertLessonOwnership(lessonId, requesterId);

    // Валидируем payload — кидает 400 если не подходит под тип
    const validatedPayload = await validatePayloadByType(dto.type, dto.payload);

    // Auto-order: следующая позиция в уроке
    const maxOrder = await this.prisma.question.aggregate({
      where: { lessonId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    return this.prisma.question.create({
      data: {
        lessonId,
        type: dto.type,
        prompt: dto.prompt,
        payload: validatedPayload as Prisma.InputJsonValue,
        explanation: dto.explanation,
        points: dto.points,
        order,
      },
    });
  }

  // ========== LIST (для teacher или student) ==========
  async findAllByLesson(lessonId: string, requesterId?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        status: true,
        isPreview: true,
        courseId: true,
        course: { select: { ownerId: true } },
      },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    const isOwner = !!requesterId && lesson.course.ownerId === requesterId;

    if (isOwner) {
      // Владелец курса видит вопросы С ОТВЕТАМИ — для редактирования
      return this.prisma.question.findMany({
        where: { lessonId },
        orderBy: { order: "asc" },
      });
    }

    // Не владелец — проверяем доступ к уроку
    await this.assertStudentLessonAccess(lesson, requesterId);

    // Возвращаем вопросы БЕЗ ответов (через toStudentView)
    const questions = await this.prisma.question.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });

    return questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      payload: toStudentView(q.type, q.payload),
      order: q.order,
      points: q.points,
      // explanation НЕ возвращаем до того как студент ответит
    }));
  }

  // ========== GET BY ID ==========
  async findById(id: string, requesterId?: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
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

    const isOwner =
      !!requesterId && question.lesson.course.ownerId === requesterId;

    if (isOwner) {
      return question;
    }

    await this.assertStudentLessonAccess(question.lesson, requesterId);

    // Студенту — без ответов
    return {
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      payload: toStudentView(question.type, question.payload),
      order: question.order,
      points: question.points,
    };
  }

  // ========== UPDATE ==========
  async update(id: string, requesterId: string, dto: UpdateQuestionDto) {
    await this.assertQuestionOwnership(id, requesterId);

    // Если меняется payload — нужно знать актуальный type для валидации
    const data: Prisma.QuestionUpdateInput = {};

    if (dto.prompt !== undefined) data.prompt = dto.prompt;
    if (dto.explanation !== undefined) data.explanation = dto.explanation;
    if (dto.points !== undefined) data.points = dto.points;

    if (dto.type || dto.payload) {
      // Узнаём актуальный type (либо новый, либо текущий из БД)
      const current = await this.prisma.question.findUnique({
        where: { id },
        select: { type: true, payload: true },
      });
      if (!current) throw new NotFoundException("Question not found");

      const newType = dto.type ?? current.type;
      const newPayload = dto.payload ?? current.payload;

      // Перевалидируем payload под (возможно новый) type
      const validated = await validatePayloadByType(newType, newPayload);

      data.type = newType;
      data.payload = validated as Prisma.InputJsonValue;
    }

    return this.prisma.question.update({
      where: { id },
      data,
    });
  }

  // ========== DELETE ==========
  async delete(id: string, requesterId: string) {
    await this.assertQuestionOwnership(id, requesterId);

    const question = await this.prisma.question.findUnique({
      where: { id },
      select: { lessonId: true, order: true },
    });
    if (!question) throw new NotFoundException("Question not found");

    // Удаление + пересжатие order (как в Lessons)
    await this.prisma.$transaction([
      this.prisma.question.delete({ where: { id } }),
      this.prisma.question.updateMany({
        where: {
          lessonId: question.lessonId,
          order: { gt: question.order },
        },
        data: { order: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  // ========== REORDER ==========
  async reorder(
    lessonId: string,
    requesterId: string,
    dto: ReorderQuestionsDto,
  ) {
    await this.assertLessonOwnership(lessonId, requesterId);

    const questions = await this.prisma.question.findMany({
      where: { lessonId, id: { in: dto.questionIds } },
      select: { id: true },
    });
    if (questions.length !== dto.questionIds.length) {
      throw new BadRequestException(
        "Some questions do not belong to this lesson or do not exist",
      );
    }

    const total = await this.prisma.question.count({ where: { lessonId } });
    if (total !== dto.questionIds.length) {
      throw new BadRequestException(
        "Reorder must include ALL questions of the lesson",
      );
    }

    await this.prisma.$transaction(
      dto.questionIds.map((id, index) =>
        this.prisma.question.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { success: true };
  }

  // ========== HELPERS ==========

  /**
   * Можно ли студенту видеть уроки этого курса.
   * Идентично проверке в LessonsService — но дублирование оправдано,
   * чтобы не плодить cross-module зависимости.
   */
  private async assertStudentLessonAccess(
    lesson: {
      id: string;
      status: string;
      isPreview: boolean;
      courseId: string;
    },
    requesterId?: string,
  ): Promise<void> {
    if (lesson.status !== "PUBLISHED") {
      throw new NotFoundException("Lesson not found");
    }
    if (lesson.isPreview) return;

    if (!requesterId) {
      throw new ForbiddenException("Login required");
    }

    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: requesterId,
          courseId: lesson.courseId,
        },
      },
    });
    if (!enrollment) {
      throw new ForbiddenException(
        "Enroll in the course to access this lesson",
      );
    }
  }

  private async assertLessonOwnership(lessonId: string, requesterId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { course: { select: { ownerId: true } } },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");
    if (lesson.course.ownerId !== requesterId) {
      throw new ForbiddenException("You are not the owner of this course");
    }
  }

  private async assertQuestionOwnership(
    questionId: string,
    requesterId: string,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: {
        lesson: { select: { course: { select: { ownerId: true } } } },
      },
    });
    if (!question) throw new NotFoundException("Question not found");
    if (question.lesson.course.ownerId !== requesterId) {
      throw new ForbiddenException(
        "You are not the owner of the parent course",
      );
    }
  }
}
