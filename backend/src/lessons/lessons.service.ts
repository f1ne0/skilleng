import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { LearningPathService } from "../learning-path/learning-path.service";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { ReorderLessonsDto } from "./dto/reorder-lessons.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";

const PUBLIC_LESSON_SELECT = {
  id: true,
  title: true,
  description: true,
  content: true,
  videoUrl: true,
  audioUrl: true,
  durationSec: true,
  order: true,
  isPreview: true,
  skillFocus: true,
  availableFrom: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  courseId: true,
  topicId: true,
} satisfies Prisma.LessonSelect;

// Для списка уроков СТУДЕНТУ — без content (тяжёлое поле, ему нужны заголовки)
const LIST_LESSON_SELECT = {
  id: true,
  title: true,
  description: true,
  durationSec: true,
  order: true,
  isPreview: true,
  skillFocus: true,
  availableFrom: true,
  status: true,
  courseId: true,
} satisfies Prisma.LessonSelect;

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningPathService: LearningPathService,
  ) {}

  // ========== CREATE ==========
  async create(courseId: string, requesterId: string, dto: CreateLessonDto) {
    await this.assertCourseOwnership(courseId, requesterId);

    // Новый урок получает order = max(текущие) + 1
    // ставится в конец курса. Учитель может потом переупорядочить.
    const maxOrder = await this.prisma.lesson.aggregate({
      where: { courseId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;
    // ?? -1 — если уроков ещё нет, max=null, -1+1=0. Первый урок order=0.

    return this.prisma.lesson.create({
      data: {
        ...dto,
        courseId,
        order,
        // Авто-публикация: урок сразу доступен, без отдельного шага Publish
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      select: PUBLIC_LESSON_SELECT,
    });
  }

  // ========== FIND ALL BY COURSE ==========
  // Один эндпоинт, разное поведение в зависимости от того кто спрашивает
  async findAllByCourse(courseId: string, requesterId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, ownerId: true, status: true },
    });
    if (!course) throw new NotFoundException("Course not found");

    const isOwner = !!requesterId && course.ownerId === requesterId;

    if (isOwner) {
      // Владелец курса видит ВСЕ уроки (включая DRAFT и ARCHIVED)
      return this.prisma.lesson.findMany({
        where: { courseId },
        select: LIST_LESSON_SELECT,
        orderBy: { order: "asc" },
      });
    }

    // Не владелец курса — проверяем enrollment
    let isEnrolled = false;
    if (requesterId) {
      const enrollment = await this.prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId: requesterId, courseId } },
      });
      isEnrolled = !!enrollment;
    }

    // Записан → видит все PUBLISHED уроки
    // Не записан/не залогинен → только PUBLISHED preview-уроки
    const lessons = await this.prisma.lesson.findMany({
      where: {
        courseId,
        status: "PUBLISHED",
        ...(isEnrolled ? {} : { isPreview: true }),
      },
      select: LIST_LESSON_SELECT,
      orderBy: { order: "asc" },
    });

    // Не записан / аноним — последовательной блокировки нет, всё это превью
    if (!isEnrolled || !requesterId) {
      return lessons.map((l) => ({
        ...l,
        isCompleted: false,
        isLocked: false,
      }));
    }

    // Записанный студент: считаем завершённость и применяем
    // ПОСЛЕДОВАТЕЛЬНУЮ блокировку — урок открыт, только если предыдущий пройден.
    // Так проходим строго по порядку: семестр 1, затем семестр 2 и т.д.
    const completions = await this.prisma.lessonCompletion.findMany({
      where: { userId: requesterId, lessonId: { in: lessons.map((l) => l.id) } },
      select: { lessonId: true },
    });
    const completedSet = new Set(completions.map((c) => c.lessonId));

    const now = Date.now();
    let prevCompleted = true; // первый урок всегда доступен
    return lessons.map((l) => {
      const isCompleted = completedSet.has(l.id);
      // Гибрид: учитель управляет через availableFrom (приоритетнее очереди и завершения)
      const from = l.availableFrom ? new Date(l.availableFrom).getTime() : null;
      let isLocked: boolean;
      if (from !== null) {
        // дата задана учителем: закрыт до даты для ВСЕХ (даже если пройден),
        // после даты — открыт вне очереди
        isLocked = now < from;
      } else if (isCompleted) {
        isLocked = false; // пройденный всегда открыт (обычный режим)
      } else {
        // даты нет: обычная последовательная блокировка
        isLocked = !prevCompleted;
      }
      // в цепочку последовательности засчитываем как «пройденный»
      // и явно открытые учителем уроки (дата уже прошла)
      prevCompleted = isCompleted || (from !== null && now >= from);
      return { ...l, isCompleted, isLocked };
    });
  }

  // ========== FIND BY ID ==========
  async findById(id: string, requesterId?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            ownerId: true,
            prerequisiteCourseId: true,
            prerequisite: { select: { title: true } },
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    const isOwner = !!requesterId && lesson.course.ownerId === requesterId;

    // Владелец видит всегда
    if (isOwner) return this.shapeForPublic(lesson);

    // Не владелец: урок должен быть опубликован
    if (lesson.status !== "PUBLISHED") {
      throw new NotFoundException("Lesson not found");
      // намеренно "not found", не "forbidden":
      // незачем подсказывать что урок существует, но просто не опубликован
    }

    // Preview доступен всем
    if (lesson.isPreview) return this.shapeForPublic(lesson);

    // Не preview — нужен enrollment
    if (!requesterId) {
      throw new ForbiddenException("Login required for this lesson");
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

    // Блокировка курса-предпосылки: курс закрыт, пока не пройден prerequisite
    const prereqId = lesson.course.prerequisiteCourseId;
    if (prereqId) {
      const total = await this.prisma.lesson.count({
        where: { courseId: prereqId, status: "PUBLISHED" },
      });
      if (total > 0) {
        const done = await this.prisma.lessonCompletion.count({
          where: { userId: requesterId, lesson: { courseId: prereqId } },
        });
        if (done < total) {
          throw new ForbiddenException(
            `Complete ${lesson.course.prerequisite?.title ?? "the prerequisite course"} before accessing this course`,
          );
        }
      }
    }

    // Гибрид: дата открытия (учитель) приоритетнее — закрыто до даты для всех
    if (lesson.availableFrom) {
      const from = new Date(lesson.availableFrom).getTime();
      if (Date.now() < from) {
        throw new ForbiddenException(
          "This lesson is not open yet — check back on its release date",
        );
      }
      // дата прошла → урок открыт вне очереди
      return this.shapeForPublic(lesson);
    }

    // Уже пройденный урок всегда доступен для повтора (обычный режим)
    const ownCompletion = await this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId: requesterId, lessonId: lesson.id } },
    });
    if (ownCompletion) return this.shapeForPublic(lesson);

    // ПОСЛЕДОВАТЕЛЬНЫЙ доступ: урок открывается только если все
    // предыдущие опубликованные уроки курса пройдены.
    const priorLessons = await this.prisma.lesson.findMany({
      where: {
        courseId: lesson.courseId,
        status: "PUBLISHED",
        order: { lt: lesson.order },
      },
      select: { id: true },
    });
    if (priorLessons.length > 0) {
      const doneCount = await this.prisma.lessonCompletion.count({
        where: {
          userId: requesterId,
          lessonId: { in: priorLessons.map((l) => l.id) },
        },
      });
      if (doneCount < priorLessons.length) {
        throw new ForbiddenException(
          "Complete the previous lessons before opening this one",
        );
      }
    }

    return this.shapeForPublic(lesson);
  }

  // ========== UPDATE ==========
  async update(id: string, requesterId: string, dto: UpdateLessonDto) {
    await this.assertLessonOwnership(id, requesterId);
    return this.prisma.lesson.update({
      where: { id },
      data: dto,
      select: PUBLIC_LESSON_SELECT,
    });
  }

  // ========== DELETE ==========
  async delete(id: string, requesterId: string) {
    await this.assertLessonOwnership(id, requesterId);

    // Удаляем урок И сжимаем порядок остальных уроков:
    // если был order=[0,1,2,3] и удалили order=1,
    // то стало [0,2,3], а должно быть [0,1,2]
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: { courseId: true, order: true },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    // $transaction([...]) — массив операций выполняется атомарно.
    // Либо обе пройдут, либо ни одна.
    await this.prisma.$transaction([
      this.prisma.lesson.delete({ where: { id } }),
      this.prisma.lesson.updateMany({
        where: {
          courseId: lesson.courseId,
          order: { gt: lesson.order },
          // все уроки с order больше чем удалённый
        },
        data: { order: { decrement: 1 } },
        // Prisma-операция: атомарно уменьшить значение поля на 1
      }),
    ]);

    return { success: true };
  }

  // ========== PUBLISH ==========
  async publish(id: string, requesterId: string) {
    await this.assertLessonOwnership(id, requesterId);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: { status: true, publishedAt: true },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    if (lesson.status === "PUBLISHED") {
      throw new BadRequestException("Lesson is already published");
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: lesson.publishedAt ?? new Date(),
      },
      select: PUBLIC_LESSON_SELECT,
    });
  }

  // ========== ARCHIVE ==========
  async archive(id: string, requesterId: string) {
    await this.assertLessonOwnership(id, requesterId);
    return this.prisma.lesson.update({
      where: { id },
      data: { status: "ARCHIVED" },
      select: PUBLIC_LESSON_SELECT,
    });
  }

  // ========== REORDER ==========
  async reorder(courseId: string, requesterId: string, dto: ReorderLessonsDto) {
    await this.assertCourseOwnership(courseId, requesterId);

    // Проверяем что ВСЕ присланные lessonId принадлежат этому курсу
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId, id: { in: dto.lessonIds } },
      select: { id: true },
    });

    if (lessons.length !== dto.lessonIds.length) {
      throw new BadRequestException(
        "Some lessons do not belong to this course or do not exist",
      );
    }

    // Защита от race conditions:
    // если в курсе есть уроки, которые НЕ упомянуты в reorder —
    // это значит фронт работал с устаревшими данными
    const totalLessons = await this.prisma.lesson.count({
      where: { courseId },
    });
    if (totalLessons !== dto.lessonIds.length) {
      throw new BadRequestException(
        "Reorder must include ALL lessons of the course",
      );
    }

    // Атомарно обновляем order у каждого урока
    await this.prisma.$transaction(
      dto.lessonIds.map((id, index) =>
        this.prisma.lesson.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { success: true };
  }

  // ========== MARK COMPLETED (student) ==========
  async markCompleted(lessonId: string, userId: string) {
    // findById кидает ForbiddenException если у студента нет доступа.
    // Если доступ есть — отметить как пройденный.
    await this.findById(lessonId, userId);

    // Fire-and-forget: если урок — узел траектории, открыть следующий
    void this.learningPathService.onLessonCompleted(userId, lessonId);

    try {
      return await this.prisma.lessonCompletion.create({
        data: { userId, lessonId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        // Уже отмечал как пройденный — возвращаем существующую запись.
        // НЕ ошибка: idempotent endpoint.
        return this.prisma.lessonCompletion.findUnique({
          where: { userId_lessonId: { userId, lessonId } },
        });
      }
      throw error;
    }
  }

  // ========== HELPERS ==========

  private async assertCourseOwnership(courseId: string, requesterId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { ownerId: true },
    });
    if (!course) throw new NotFoundException("Course not found");
    if (course.ownerId !== requesterId) {
      throw new ForbiddenException("You are not the owner of this course");
    }
  }

  // Проверка владения через ПАРЕНТ-курс.
  // Юзер должен владеть курсом, чтобы редактировать уроки внутри.
  private async assertLessonOwnership(lessonId: string, requesterId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { course: { select: { ownerId: true } } },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");
    if (lesson.course.ownerId !== requesterId) {
      throw new ForbiddenException(
        "You are not the owner of the parent course",
      );
    }
  }

  // findById возвращает Lesson с включённым course-объектом,
  // но наружу мы отдаём чистый Lesson без course (фронт уже знает курс).
  private shapeForPublic(lesson: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    videoUrl: string | null;
    audioUrl: string | null;
    durationSec: number | null;
    order: number;
    isPreview: boolean;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    courseId: string;
  }) {
    const { ...rest } = lesson;
    return rest;
  }
}
