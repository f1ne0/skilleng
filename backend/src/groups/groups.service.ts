import { randomInt } from "node:crypto";

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { JoinGroupDto } from "./dto/join-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";

const PUBLIC_MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
  level: true,
  totalXp: true,
  currentStreak: true,
  lastActiveDate: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== CREATE ==========
  async create(ownerId: string, dto: CreateGroupDto) {
    const inviteCode = await this.generateUniqueInviteCode();

    return this.prisma.group.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        inviteCode,
      },
    });
  }

  // ========== FIND MY GROUPS ==========
  async findMine(userId: string) {
    // Получаем группы где юзер либо owner, либо member
    const [owned, memberships] = await Promise.all([
      this.prisma.group.findMany({
        where: { ownerId: userId },
        include: { _count: { select: { memberships: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.groupMembership.findMany({
        where: { userId },
        include: {
          group: {
            include: {
              _count: { select: { memberships: true } },
              owner: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      }),
    ]);

    return {
      owned: owned.map((g) => ({ ...g, role: "OWNER" as const })),
      member: memberships.map((m) => ({
        ...m.group,
        role: "MEMBER" as const,
        joinedAt: m.joinedAt,
      })),
    };
  }

  // ========== FIND BY ID ==========
  async findById(groupId: string, requesterId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        memberships: {
          include: { user: { select: PUBLIC_MEMBER_SELECT } },
          orderBy: { joinedAt: "desc" },
        },
      },
    });
    if (!group) throw new NotFoundException("Group not found");

    // Проверяем что requester имеет доступ — owner или member
    const isOwner = group.ownerId === requesterId;
    const isMember = group.memberships.some((m) => m.userId === requesterId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException("You must be a member to view this group");
    }

    // Учебная статистика по каждому участнику (точность, пройдено уроков, отстаёт)
    const statsByUser = await this.computeMemberStats(
      group.memberships.map((m) => m.userId),
    );
    const memberships = group.memberships.map((m) => ({
      ...m,
      stats: statsByUser.get(m.userId) ?? {
        answered: 0,
        accuracyPercent: 0,
        completedLessons: 0,
        needsAttention: true,
      },
    }));

    return {
      ...group,
      memberships,
      isOwner,
      // не показываем inviteCode не-владельцам
      inviteCode: isOwner ? group.inviteCode : undefined,
    };
  }

  /** Точность / пройдено уроков / «отстаёт» по списку пользователей */
  private async computeMemberStats(memberIds: string[]) {
    const map = new Map<
      string,
      { answered: number; accuracyPercent: number; completedLessons: number; needsAttention: boolean }
    >();
    if (memberIds.length === 0) return map;

    const [answeredBy, correctBy, lessonsBy] = await Promise.all([
      this.prisma.answerSubmission.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIds } },
        _count: { _all: true },
      }),
      this.prisma.answerSubmission.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIds }, isCorrect: true },
        _count: { _all: true },
      }),
      this.prisma.lessonCompletion.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIds } },
        _count: { _all: true },
      }),
    ]);
    const aMap = new Map(answeredBy.map((r) => [r.userId, r._count._all]));
    const cMap = new Map(correctBy.map((r) => [r.userId, r._count._all]));
    const lMap = new Map(lessonsBy.map((r) => [r.userId, r._count._all]));

    for (const id of memberIds) {
      const answered = aMap.get(id) ?? 0;
      const correct = cMap.get(id) ?? 0;
      const accuracyPercent = answered > 0 ? Math.round((correct / answered) * 100) : 0;
      map.set(id, {
        answered,
        accuracyPercent,
        completedLessons: lMap.get(id) ?? 0,
        needsAttention: answered === 0 || (answered >= 5 && accuracyPercent < 60),
      });
    }
    return map;
  }

  // ========== UPDATE ==========
  async update(groupId: string, ownerId: string, dto: UpdateGroupDto) {
    await this.assertOwnership(groupId, ownerId);
    return this.prisma.group.update({
      where: { id: groupId },
      data: dto,
    });
  }

  // ========== DELETE ==========
  async delete(groupId: string, ownerId: string) {
    await this.assertOwnership(groupId, ownerId);
    await this.prisma.group.delete({ where: { id: groupId } });
    return { success: true };
  }

  // ========== REGENERATE INVITE CODE ==========
  async regenerateInviteCode(groupId: string, ownerId: string) {
    await this.assertOwnership(groupId, ownerId);
    const newCode = await this.generateUniqueInviteCode();
    return this.prisma.group.update({
      where: { id: groupId },
      data: { inviteCode: newCode },
      select: { id: true, inviteCode: true },
    });
  }

  // ========== JOIN GROUP ==========
  async join(userId: string, dto: JoinGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode: dto.inviteCode },
    });
    if (!group) {
      throw new NotFoundException("Invalid invite code");
    }

    if (group.ownerId === userId) {
      throw new BadRequestException(
        "You are the owner of this group, no need to join",
      );
    }

    try {
      return await this.prisma.groupMembership.create({
        data: { groupId: group.id, userId },
        include: {
          group: { select: { id: true, name: true, description: true } },
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new BadRequestException("You are already a member of this group");
      }
      throw err;
    }
  }

  // ========== LEAVE GROUP ==========
  async leave(groupId: string, userId: string) {
    const membership = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      throw new NotFoundException("You are not a member of this group");
    }
    await this.prisma.groupMembership.delete({
      where: { id: membership.id },
    });
    return { success: true };
  }

  // ========== ADD MEMBER BY EMAIL (teacher) ==========
  async addMemberByEmail(groupId: string, ownerId: string, email: string) {
    await this.assertOwnership(groupId, ownerId);

    const student = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, role: true, firstName: true, lastName: true },
    });
    if (!student) {
      throw new NotFoundException("No user with this email");
    }
    if (student.role !== "STUDENT") {
      throw new BadRequestException("Only students can be added to a group");
    }

    const existing = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: student.id } },
    });
    if (existing) {
      throw new BadRequestException("This student is already in the group");
    }

    await this.prisma.groupMembership.create({
      data: { groupId, userId: student.id },
    });
    return { success: true, userId: student.id };
  }

  // ========== ADD EXISTING STUDENT BY ID (teacher) ==========
  async addMemberById(groupId: string, ownerId: string, userId: string) {
    await this.assertOwnership(groupId, ownerId);
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!student || student.role !== "STUDENT") {
      throw new BadRequestException("Only students can be added to a group");
    }
    const existing = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) {
      throw new BadRequestException("This student is already in the group");
    }
    await this.prisma.groupMembership.create({ data: { groupId, userId } });
    return { success: true, userId };
  }

  // ========== REMOVE MEMBER (teacher) ==========
  async removeMember(groupId: string, ownerId: string, memberUserId: string) {
    await this.assertOwnership(groupId, ownerId);

    if (memberUserId === ownerId) {
      throw new BadRequestException(
        "Cannot remove yourself as owner. Delete the group instead.",
      );
    }

    const membership = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: memberUserId } },
    });
    if (!membership) {
      throw new NotFoundException("Member not found in this group");
    }

    await this.prisma.groupMembership.delete({ where: { id: membership.id } });
    return { success: true };
  }

  // ========== ALL STUDENTS (across owned groups) ==========
  async listAllStudents(ownerId: string) {
    const groups = await this.prisma.group.findMany({
      where: { ownerId },
      select: {
        id: true,
        name: true,
        memberships: {
          select: { user: { select: PUBLIC_MEMBER_SELECT } },
        },
      },
    });

    // дедуп студентов; запоминаем, в каких группах состоит
    const byUser = new Map<
      string,
      {
        user: (typeof groups)[number]["memberships"][number]["user"];
        groups: { id: string; name: string }[];
      }
    >();
    for (const g of groups) {
      for (const m of g.memberships) {
        const entry = byUser.get(m.user.id);
        if (entry) entry.groups.push({ id: g.id, name: g.name });
        else byUser.set(m.user.id, { user: m.user, groups: [{ id: g.id, name: g.name }] });
      }
    }

    const ids = [...byUser.keys()];
    const stats = await this.computeMemberStats(ids);

    return [...byUser.values()].map(({ user, groups: gs }) => ({
      user,
      groups: gs,
      stats: stats.get(user.id) ?? {
        answered: 0,
        accuracyPercent: 0,
        completedLessons: 0,
        needsAttention: true,
      },
    }));
  }

  // ========== GROUP ANALYTICS ==========
  async getAnalytics(groupId: string, ownerId: string) {
    await this.assertOwnership(groupId, ownerId);

    const memberships = await this.prisma.groupMembership.findMany({
      where: { groupId },
      include: { user: { select: PUBLIC_MEMBER_SELECT } },
    });

    const totalMembers = memberships.length;
    if (totalMembers === 0) {
      return {
        totalMembers: 0,
        avgXp: 0,
        avgStreak: 0,
        avgAccuracy: 0,
        avgLessons: 0,
        needsAttention: 0,
        topByXp: [],
        topByAccuracy: [],
        weeklyActivity: [],
      };
    }

    const totalXp = memberships.reduce((s, m) => s + m.user.totalXp, 0);
    const totalStreak = memberships.reduce(
      (s, m) => s + m.user.currentStreak,
      0,
    );

    const memberIds = memberships.map((m) => m.user.id);

    // ── Учебные метрики: точность и пройденные уроки по каждому участнику ──
    const [answeredByUser, correctByUser, lessonsByUser] = await Promise.all([
      this.prisma.answerSubmission.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIds } },
        _count: { _all: true },
      }),
      this.prisma.answerSubmission.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIds }, isCorrect: true },
        _count: { _all: true },
      }),
      this.prisma.lessonCompletion.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIds } },
        _count: { _all: true },
      }),
    ]);

    const answeredMap = new Map(answeredByUser.map((r) => [r.userId, r._count._all]));
    const correctMap = new Map(correctByUser.map((r) => [r.userId, r._count._all]));
    const lessonsMap = new Map(lessonsByUser.map((r) => [r.userId, r._count._all]));

    // точность по группе (по всем ответам), средние уроки, кол-во «отстающих»
    let totalAnswered = 0;
    let totalCorrect = 0;
    let totalLessons = 0;
    let needsAttention = 0;
    for (const id of memberIds) {
      const answered = answeredMap.get(id) ?? 0;
      const correct = correctMap.get(id) ?? 0;
      totalAnswered += answered;
      totalCorrect += correct;
      totalLessons += lessonsMap.get(id) ?? 0;
      const acc = answered > 0 ? (correct / answered) * 100 : 0;
      // «отстающий»: совсем нет активности ИЛИ точность ниже 60% при ≥5 ответах
      if (answered === 0 || (answered >= 5 && acc < 60)) needsAttention += 1;
    }
    const avgAccuracy =
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const avgLessons = Math.round((totalLessons / totalMembers) * 10) / 10;

    // Топ-5 по общему XP (поля совпадают с фронтом: totalXp, currentStreak)
    const topByXp = [...memberships]
      .sort((a, b) => b.user.totalXp - a.user.totalXp)
      .slice(0, 5)
      .map((m) => ({
        userId: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        avatarUrl: m.user.avatarUrl,
        totalXp: m.user.totalXp,
        currentStreak: m.user.currentStreak,
      }));

    // Топ-5 по точности (только у кого хотя бы 5 ответов)
    const topByAccuracy = memberships
      .map((m) => {
        const answered = answeredMap.get(m.user.id) ?? 0;
        const correct = correctMap.get(m.user.id) ?? 0;
        return {
          userId: m.user.id,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          avatarUrl: m.user.avatarUrl,
          accuracyPercent: answered > 0 ? Math.round((correct / answered) * 100) : 0,
          answered,
        };
      })
      .filter((x) => x.answered >= 5)
      .sort((a, b) => b.accuracyPercent - a.accuracyPercent)
      .slice(0, 5);

    // Активность за 7 дней — ряд по дням (ответы группы за день)
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 6);
    const recent = await this.prisma.answerSubmission.findMany({
      where: { userId: { in: memberIds }, submittedAt: { gte: since } },
      select: { submittedAt: true },
    });
    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyActivity: { day: string; submissions: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const submissions = recent.filter(
        (r) => r.submittedAt >= d && r.submittedAt < next,
      ).length;
      weeklyActivity.push({ day: DAY_LABELS[d.getDay()]!, submissions });
    }

    return {
      totalMembers,
      avgXp: Math.round(totalXp / totalMembers),
      avgStreak: Math.round((totalStreak / totalMembers) * 10) / 10,
      avgAccuracy,
      avgLessons,
      needsAttention,
      topByXp,
      topByAccuracy,
      weeklyActivity,
    };
  }

  // ========== STUDENT DETAIL VIEW ==========
  async getStudentDetail(
    groupId: string,
    studentUserId: string,
    ownerId: string,
  ) {
    await this.assertOwnership(groupId, ownerId);

    // Проверяем что студент в группе
    const membership = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: studentUserId } },
    });
    if (!membership) {
      throw new NotFoundException("Student not found in this group");
    }

    // Базовая инфа о студенте
    const student = await this.prisma.user.findUnique({
      where: { id: studentUserId },
      select: {
        ...PUBLIC_MEMBER_SELECT,
        goal: true,
        nativeLanguage: true,
        interests: true,
        longestStreak: true,
        lastActiveDate: true,
        createdAt: true,
      },
    });
    if (!student) throw new NotFoundException("Student not found");

    // Курсы и прогресс
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { userId: studentUserId },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            level: true,
            category: true,
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Завершённые уроки — всего и по курсам
    const completions = await this.prisma.lessonCompletion.findMany({
      where: { userId: studentUserId },
      select: { lesson: { select: { courseId: true } } },
    });
    const completedLessons = completions.length;
    const perCourse = new Map<string, number>();
    for (const c of completions) {
      perCourse.set(c.lesson.courseId, (perCourse.get(c.lesson.courseId) ?? 0) + 1);
    }

    // Правильные ответы
    const [correctCount, totalAnswered] = await Promise.all([
      this.prisma.answerSubmission.count({
        where: { userId: studentUserId, isCorrect: true },
      }),
      this.prisma.answerSubmission.count({ where: { userId: studentUserId } }),
    ]);

    const courses = enrollments.map((e) => {
      const total = e.course._count.lessons;
      const done = perCourse.get(e.course.id) ?? 0;
      return {
        courseId: e.course.id,
        courseTitle: e.course.title,
        completionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
        lastActivity: null as string | null,
      };
    });

    // Плоская форма — ровно то, что отображает страница студента
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      avatarUrl: student.avatarUrl,
      level: student.level,
      goal: student.goal,
      nativeLanguage: student.nativeLanguage,
      interests: student.interests ?? [],
      totalXp: student.totalXp,
      currentStreak: student.currentStreak,
      longestStreak: student.longestStreak,
      lastActiveDate: student.lastActiveDate,
      createdAt: student.createdAt,
      joinedGroupAt: membership.joinedAt,
      completedLessons,
      accuracyPercent:
        totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0,
      courses,
    };
  }

  // ========== HELPERS ==========
  private async assertOwnership(groupId: string, requesterId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });
    if (!group) throw new NotFoundException("Group not found");
    if (group.ownerId !== requesterId) {
      throw new ForbiddenException("You are not the owner of this group");
    }
  }

  private async generateUniqueInviteCode(maxAttempts = 10): Promise<string> {
    // Алфавит без неоднозначных символов (0/O, 1/I/l)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let code = "";
      for (let i = 0; i < 6; i++) {
        // randomInt из node:crypto — криптостойкий и без modulo-bias,
        // в отличие от Math.random()
        code += chars.charAt(randomInt(chars.length));
      }

      const existing = await this.prisma.group.findUnique({
        where: { inviteCode: code },
        select: { id: true },
      });

      if (!existing) return code;
    }

    // Если за 10 попыток не нашли уникальный — увеличиваем длину
    // 32^6 ≈ миллиард комбинаций, коллизия очень маловероятна
    throw new Error("Failed to generate unique invite code");
  }
}
