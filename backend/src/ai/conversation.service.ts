import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MessageRole } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { GeminiClient } from "./gemini.client";
import { AnalyticsService } from "../analytics/analytics.service";
import {
  TUTOR_SYSTEM_PROMPT,
  lessonContextSystemPrompt,
  progressContextBlock,
  studentContextBlock,
  teacherContextSystemPrompt,
} from "./prompts/system-prompts";

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiClient,
    private readonly config: ConfigService,
    private readonly analytics: AnalyticsService,
  ) {}

  // ========== CREATE CONVERSATION ==========
  async create(userId: string, dto: CreateConversationDto) {
    // Если указан lessonId — проверяем доступ
    if (dto.lessonId) {
      await this.assertLessonAccess(dto.lessonId, userId);
    }

    return this.prisma.conversation.create({
      data: {
        userId,
        lessonId: dto.lessonId,
      },
    });
  }

  // ========== LIST MY CONVERSATIONS ==========
  async findMine(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        lesson: { select: { id: true, title: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  // ========== GET ONE WITH MESSAGES ==========
  async findById(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lesson: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.userId !== userId) {
      throw new ForbiddenException("Not your conversation");
    }
    return conversation;
  }

  // ========== SEND MESSAGE ==========
  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    // 1. Проверяем daily limit ПЕРЕД дорогостоящим AI вызовом
    await this.assertDailyLimit(userId);

    // 2. Загружаем conversation + историю
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        lesson: { select: { title: true, content: true } },
      },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.userId !== userId) {
      throw new ForbiddenException("Not your conversation");
    }

    // 3. Готовим контекст для AI в зависимости от роли:
    // - СТУДЕНТ: тьютор + профиль (имя, CEFR, цель, родной язык, интересы)
    //   + реальная сводка успехов (правильность по навыкам, словарь, траектория)
    // - УЧИТЕЛЬ: ассистент преподавателя + данные его групп и студентов
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        role: true,
        level: true,
        goal: true,
        nativeLanguage: true,
        interests: true,
        currentStreak: true,
        totalXp: true,
      },
    });

    let systemPrompt: string;
    if (user?.role === "TEACHER") {
      const teacherBrief = await this.analytics
        .tutorTeacherBrief(userId)
        .catch(() => "Student data is temporarily unavailable.");
      systemPrompt = teacherContextSystemPrompt(user.firstName, teacherBrief);
    } else {
      const progressBrief = await this.analytics
        .tutorProgressBrief(userId)
        .catch(() => null as string | null);
      // сводка — best-effort: если аналитика упала, чат всё равно работает

      const basePrompt = conversation.lesson
        ? lessonContextSystemPrompt(
            conversation.lesson.title,
            conversation.lesson.content,
          )
        : TUTOR_SYSTEM_PROMPT;
      systemPrompt =
        basePrompt +
        (user ? studentContextBlock(user) : "") +
        (progressBrief ? progressContextBlock(progressBrief) : "");
    }

    const history = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Добавляем новое сообщение юзера в конец истории
    const newMessages = [
      ...history,
      { role: MessageRole.USER, content: dto.content },
    ];

    // 4. Запрашиваем AI
    const result = await this.gemini.generate(newMessages, {
      systemPrompt,
      temperature: 0.7,
    });

    // 5. Сохраняем оба сообщения в БД одной транзакцией
    const [, assistantMessage] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          role: MessageRole.USER,
          content: dto.content,
        },
      }),
      this.prisma.message.create({
        data: {
          conversationId,
          role: MessageRole.ASSISTANT,
          content: result.text,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
        },
      }),
      // Обновляем conversation.updatedAt и заголовок (если первое сообщение)
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          ...(history.length === 0 && {
            title: dto.content.slice(0, 80),
          }),
        },
      }),
    ]);

    return {
      message: assistantMessage,
      tokensUsed: result.tokensInput + result.tokensOutput,
    };
  }

  // ========== DELETE ==========
  async rename(conversationId: string, userId: string, title: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.userId !== userId) {
      throw new ForbiddenException("Not your conversation");
    }
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title: title.trim().slice(0, 120) },
    });
  }

  async delete(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.userId !== userId) {
      throw new ForbiddenException("Not your conversation");
    }
    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { success: true };
  }

  // ========== HELPERS ==========
  private async assertLessonAccess(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        status: true,
        isPreview: true,
        courseId: true,
        course: { select: { ownerId: true } },
      },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    // Владелец курса — всегда доступ
    if (lesson.course.ownerId === userId) return;

    if (lesson.status !== "PUBLISHED") {
      throw new NotFoundException("Lesson not found");
    }
    if (lesson.isPreview) return;

    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException("Enroll in the course first");
    }
  }

  private async assertDailyLimit(userId: string) {
    const limit = this.config.get<number>("AI_DAILY_MESSAGE_LIMIT") ?? 50;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const count = await this.prisma.message.count({
      where: {
        conversation: { userId },
        role: MessageRole.USER,
        createdAt: { gte: today },
      },
    });

    if (count >= limit) {
      throw new BadRequestException(
        `Daily AI message limit reached (${limit} messages). Try again tomorrow.`,
      );
    }
  }
}
