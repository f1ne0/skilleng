import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { LearningPathService } from "../learning-path/learning-path.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVocabularyEntryDto } from "./dto/create-entry.dto";
import { ListEntriesDto } from "./dto/list-entries.dto";
import { UpdateVocabularyEntryDto } from "./dto/update-entry.dto";
import { sm2Step } from "./srs.utils";

// "Выученным" считаем слово с интервалом от 21 дня —
// общепринятый порог "зрелой" карточки (mature) в SRS-системах
const LEARNED_INTERVAL_DAYS = 21;
// Размер одной сессии повтора
const DUE_BATCH_LIMIT = 50;

@Injectable()
export class VocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningPathService: LearningPathService,
  ) {}

  // ========== CRUD ==========

  async create(userId: string, dto: CreateVocabularyEntryDto) {
    return this.prisma.vocabularyEntry.create({
      data: {
        userId,
        term: dto.term.trim(),
        translation: dto.translation.trim(),
        example: dto.example?.trim() || null,
        partOfSpeech: dto.partOfSpeech?.trim() || null,
        sourceLessonId: dto.sourceLessonId ?? null,
        // SRS-поля заполняются дефолтами схемы: новое слово сразу due
      },
    });
  }

  async findAll(userId: string, query: ListEntriesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const where: Prisma.VocabularyEntryWhereInput = {
      userId,
      ...(query.search && {
        OR: [
          { term: { contains: query.search, mode: "insensitive" } },
          { translation: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.vocabularyEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.vocabularyEntry.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(userId: string, id: string) {
    const entry = await this.prisma.vocabularyEntry.findFirst({
      where: { id, userId },
      // доступ только к своим словам — фильтр по userId, не только по id
    });
    if (!entry) throw new NotFoundException("Vocabulary entry not found");
    return entry;
  }

  async update(userId: string, id: string, dto: UpdateVocabularyEntryDto) {
    await this.findOne(userId, id); // проверка владения

    return this.prisma.vocabularyEntry.update({
      where: { id },
      data: {
        ...(dto.term !== undefined && { term: dto.term.trim() }),
        ...(dto.translation !== undefined && {
          translation: dto.translation.trim(),
        }),
        ...(dto.example !== undefined && { example: dto.example?.trim() || null }),
        ...(dto.partOfSpeech !== undefined && {
          partOfSpeech: dto.partOfSpeech?.trim() || null,
        }),
        ...(dto.sourceLessonId !== undefined && {
          sourceLessonId: dto.sourceLessonId ?? null,
        }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // проверка владения
    await this.prisma.vocabularyEntry.delete({ where: { id } });
    return { success: true };
  }

  // ========== SRS ==========

  /** Слова к повтору: dueAt <= now, самые просроченные первыми */
  async findDue(userId: string) {
    return this.prisma.vocabularyEntry.findMany({
      where: { userId, dueAt: { lte: new Date() } },
      orderBy: { dueAt: "asc" },
      take: DUE_BATCH_LIMIT,
    });
  }

  /**
   * Результат повтора: пересчёт SM-2 → обновление записи + ReviewLog.
   * Обе записи — в одной транзакции, чтобы лог не разъехался с состоянием.
   */
  async review(userId: string, id: string, quality: number) {
    const entry = await this.findOne(userId, id);

    const now = new Date();
    const next = sm2Step(quality, {
      repetitions: entry.repetitions,
      easeFactor: entry.easeFactor,
      intervalDays: entry.intervalDays,
    }, now);

    const [updated] = await this.prisma.$transaction([
      this.prisma.vocabularyEntry.update({
        where: { id },
        data: {
          repetitions: next.repetitions,
          easeFactor: next.easeFactor,
          intervalDays: next.intervalDays,
          dueAt: next.dueAt,
          lastReviewedAt: now,
        },
      }),
      this.prisma.reviewLog.create({
        data: {
          entryId: id,
          userId,
          quality,
          prevInterval: entry.intervalDays,
          newInterval: next.intervalDays,
        },
      }),
    ]);

    // Fire-and-forget: если все due-слова повторены — закрыть REVIEW-узел траектории
    void this.learningPathService.onReviewProgress(userId);

    return updated;
  }

  /** Всего / выучено / к повтору сейчас */
  async stats(userId: string) {
    const [total, learned, dueNow] = await Promise.all([
      this.prisma.vocabularyEntry.count({ where: { userId } }),
      this.prisma.vocabularyEntry.count({
        where: { userId, intervalDays: { gte: LEARNED_INTERVAL_DAYS } },
      }),
      this.prisma.vocabularyEntry.count({
        where: { userId, dueAt: { lte: new Date() } },
      }),
    ]);

    return { total, learned, dueNow };
  }
}
