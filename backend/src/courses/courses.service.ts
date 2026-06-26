import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import slugify from "slugify";

import { PrismaService } from "../prisma/prisma.service";
import { validatePayloadByType } from "../questions/payload.utils";
import { CourseFilterDto } from "./dto/course-filter.dto";
import { CreateCourseDto } from "./dto/create-course.dto";
import { CreateGeneratedCourseDto } from "./dto/create-generated-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

// Аналог PUBLIC_USER_SELECT из users.service.ts —
// единое место правды для публичных полей курса.
const PUBLIC_COURSE_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  level: true,
  category: true,
  coverImageUrl: true,
  status: true,
  price: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  prerequisiteCourseId: true,
  prerequisite: { select: { id: true, title: true } },
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  _count: {
    // Prisma волшебство: количество связанных записей без отдельного запроса
    select: { enrollments: true, lessons: true },
  },
} satisfies Prisma.CourseSelect;

// Плоская форма курса для фронта: счётчики из _count + ownerId из owner
function shapeCourse<
  T extends {
    owner: { id: string };
    _count: { enrollments: number; lessons: number };
    prerequisite?: { id: string; title: string } | null;
  },
>(c: T) {
  const { _count, prerequisite, ...rest } = c;
  return {
    ...rest,
    ownerId: c.owner.id,
    totalLessons: _count.lessons,
    enrolledCount: _count.enrollments,
    prerequisiteTitle: prerequisite?.title ?? null,
  };
}

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== CREATE ==========
  async create(ownerId: string, dto: CreateCourseDto) {
    const slug = await this.generateUniqueSlug(dto.title);

    const course = await this.prisma.course.create({
      data: {
        ...dto,
        slug,
        ownerId,
        // Авто-публикация: курс сразу опубликован, без отдельного шага Publish
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      select: PUBLIC_COURSE_SELECT,
    });
    return shapeCourse(course);
  }

  // ========== CREATE FROM AI (курс + уроки + вопросы) ==========
  async createGenerated(ownerId: string, dto: CreateGeneratedCourseDto) {
    // Перепроверяем payload каждого вопроса тем же валидатором, что и ручной ввод —
    // учитель мог отредактировать сгенерированное. Невалидные вопросы отбрасываем.
    const lessonsData = await Promise.all(
      dto.lessons.map(async (lesson) => {
        const questions: {
          type: (typeof lesson.questions)[number]["type"];
          prompt: string;
          explanation: string | null;
          payload: Prisma.InputJsonValue;
        }[] = [];
        for (const q of lesson.questions) {
          try {
            const payload = await validatePayloadByType(q.type, q.payload);
            questions.push({
              type: q.type,
              prompt: q.prompt.trim(),
              explanation: q.explanation?.trim() || null,
              payload: payload as Prisma.InputJsonValue,
            });
          } catch {
            // пропускаем невалидный вопрос
          }
        }
        return { lesson, questions };
      }),
    );

    const slug = await this.generateUniqueSlug(dto.title);

    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        level: dto.level ?? null,
        category: dto.category,
        slug,
        ownerId,
        status: "PUBLISHED",
        publishedAt: new Date(),
        lessons: {
          create: lessonsData.map(({ lesson, questions }, i) => ({
            title: lesson.title.trim(),
            description: lesson.description?.trim() || null,
            content: lesson.content,
            order: i,
            status: "PUBLISHED",
            publishedAt: new Date(),
            questions: {
              create: questions.map((q, qi) => ({
                type: q.type,
                prompt: q.prompt,
                explanation: q.explanation,
                payload: q.payload,
                order: qi,
              })),
            },
          })),
        },
      },
      select: PUBLIC_COURSE_SELECT,
    });

    return shapeCourse(course);
  }

  // ========== FIND ALL (public catalog) ==========
  async findAll(filter: CourseFilterDto) {
    const { level, category, search, page = 1, limit = 12 } = filter;
    const skip = (page - 1) * limit;

    // Динамическое условие WHERE.
    // ...(level && {...}) — добавлять поле только если оно есть.
    // Грязный JS-приём, но в Prisma идиоматичный.
    const where: Prisma.CourseWhereInput = {
      status: "PUBLISHED",
      // ВАЖНО: публичный каталог видит ТОЛЬКО опубликованные
      ...(level && { level }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
        // case-insensitive поиск по title и description
      }),
    };

    // Promise.all — два запроса параллельно вместо последовательно
    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        select: PUBLIC_COURSE_SELECT,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        // сначала новые опубликованные
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      items: items.map(shapeCourse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ========== FIND BY SLUG (public page) ==========
  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: PUBLIC_COURSE_SELECT,
    });
    if (!course || course.status !== "PUBLISHED") {
      // если курс DRAFT — публично его не видно, как будто не существует
      throw new NotFoundException("Course not found");
    }
    return shapeCourse(course);
  }

  // ========== FIND BY ID (owners and authenticated views) ==========
  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: PUBLIC_COURSE_SELECT,
    });
    if (!course) throw new NotFoundException("Course not found");
    return shapeCourse(course);
  }

  // ========== UPDATE ==========
  async update(courseId: string, requesterId: string, dto: UpdateCourseDto) {
    await this.assertOwnership(courseId, requesterId);

    const data: Prisma.CourseUpdateInput = { ...dto };

    // Если меняется title — пересчитать slug
    if (dto.title) {
      data.slug = await this.generateUniqueSlug(dto.title, courseId);
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data,
      select: PUBLIC_COURSE_SELECT,
    });
    return shapeCourse(updated);
  }

  // ========== DELETE ==========
  async delete(courseId: string, requesterId: string) {
    await this.assertOwnership(courseId, requesterId);
    await this.prisma.course.delete({ where: { id: courseId } });
    return { success: true, id: courseId };
  }

  // ========== PUBLISH ==========
  async publish(courseId: string, requesterId: string) {
    await this.assertOwnership(courseId, requesterId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { status: true, publishedAt: true },
    });
    if (!course) throw new NotFoundException("Course not found");

    if (course.status === "PUBLISHED") {
      throw new BadRequestException("Course is already published");
    }

    const published = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: "PUBLISHED",
        // publishedAt выставляем ТОЛЬКО при первой публикации
        publishedAt: course.publishedAt ?? new Date(),
      },
      select: PUBLIC_COURSE_SELECT,
    });
    return shapeCourse(published);
  }

  // ========== ARCHIVE ==========
  async archive(courseId: string, requesterId: string) {
    await this.assertOwnership(courseId, requesterId);
    const archived = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: "ARCHIVED" },
      select: PUBLIC_COURSE_SELECT,
    });
    return shapeCourse(archived);
  }

  // Пройден ли курс-предпосылка (все его опубликованные уроки завершены)
  async prerequisiteMet(
    userId: string,
    prerequisiteCourseId: string | null | undefined,
  ): Promise<boolean> {
    if (!prerequisiteCourseId) return true;
    const total = await this.prisma.lesson.count({
      where: { courseId: prerequisiteCourseId, status: "PUBLISHED" },
    });
    if (total === 0) return true;
    const done = await this.prisma.lessonCompletion.count({
      where: { userId, lesson: { courseId: prerequisiteCourseId } },
    });
    return done >= total;
  }

  // ========== ENROLL (student) ==========
  async enroll(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        status: true,
        prerequisiteCourseId: true,
        prerequisite: { select: { title: true } },
      },
    });
    if (!course) throw new NotFoundException("Course not found");

    if (course.status !== "PUBLISHED") {
      throw new BadRequestException(
        "Cannot enroll in unpublished or archived course",
      );
    }

    // Блокировка курса-предпосылки: нельзя записаться, пока не пройден prerequisite
    if (!(await this.prerequisiteMet(userId, course.prerequisiteCourseId))) {
      throw new ForbiddenException(
        `Complete ${course.prerequisite?.title ?? "the prerequisite course"} before starting this course`,
      );
    }

    // Race-safe enrollment через unique constraint userId+courseId
    try {
      return await this.prisma.courseEnrollment.create({
        data: { userId, courseId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Already enrolled in this course");
      }
      throw error;
    }
  }

  // ========== UNENROLL ==========
  async unenroll(courseId: string, userId: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      // userId_courseId — Prisma композитный ключ из @@unique([userId, courseId])
    });

    if (!enrollment) {
      throw new NotFoundException("Not enrolled in this course");
    }

    await this.prisma.courseEnrollment.delete({
      where: { id: enrollment.id },
    });
    return { success: true };
  }

  // ========== MY COURSES (зависит от роли) ==========
  async findMyCourses(userId: string, role: Role) {
    if (role === Role.TEACHER) {
      // Teacher: курсы которые я СОЗДАЛ (включая DRAFT)
      const courses = await this.prisma.course.findMany({
        where: { ownerId: userId },
        select: PUBLIC_COURSE_SELECT,
        orderBy: { updatedAt: "desc" },
      });
      return courses.map(shapeCourse);
    }

    // Student: курсы на которые ЗАПИСАН
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { userId },
      include: { course: { select: PUBLIC_COURSE_SELECT } },
      orderBy: { enrolledAt: "desc" },
    });

    // Прогресс по каждому курсу + блокировка курса-предпосылки
    return Promise.all(
      enrollments.map(async (e) => {
        const totalLessons = await this.prisma.lesson.count({
          where: { courseId: e.courseId, status: "PUBLISHED" },
        });
        const completedLessons = await this.prisma.lessonCompletion.count({
          where: { userId, lesson: { courseId: e.courseId } },
        });
        const progressPercent =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;
        const shaped = shapeCourse(e.course);
        const locked = !(await this.prerequisiteMet(
          userId,
          shaped.prerequisiteCourseId,
        ));
        return {
          ...shaped,
          enrolledAt: e.enrolledAt,
          completedAt: e.completedAt,
          progressPercent,
          locked,
        };
      }),
    );
  }

  // ========== ПРИВАТНЫЕ ХЕЛПЕРЫ ==========

  /**
   * Проверка владения. Если не owner — 403.
   * Используется во всех destructive операциях (update, delete, publish).
   */
  private async assertOwnership(courseId: string, requesterId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { ownerId: true },
    });
    if (!course) throw new NotFoundException("Course not found");
    if (course.ownerId !== requesterId) {
      throw new ForbiddenException("You are not the owner of this course");
    }
  }

  /**
   * Генерит slug из title и проверяет уникальность.
   * При коллизии добавляет суффикс: "grammar", "grammar-1", "grammar-2"...
   *
   * excludeCourseId — при update, чтобы не считать "уже занят" собственный slug курса.
   */
  private async generateUniqueSlug(
    title: string,
    excludeCourseId?: string,
  ): Promise<string> {
    const baseSlug =
      slugify(title, {
        lower: true,
        strict: true,
        // strict: true убирает спецсимволы и оставляет только [a-z0-9-]
        locale: "en",
      }) || "course";
    // fallback "course" — если title состоит только из не-латинских символов

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.course.findUnique({
        where: { slug },
        select: { id: true },
      });

      // нет такого slug ИЛИ это сам курс который мы редактируем — годится
      if (!existing || existing.id === excludeCourseId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}
