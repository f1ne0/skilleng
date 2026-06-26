import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  Prisma,
  QuestionType,
  Skill,
  SnapshotLabel,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

// Навык ответа: продуктивные типы определяются типом вопроса,
// рецептивные — skillFocus урока
function resolveSkill(
  questionType: QuestionType,
  lessonSkill: Skill | null,
): Skill | null {
  if (questionType === QuestionType.SHORT_WRITING) return Skill.WRITING;
  if (questionType === QuestionType.SPEAKING_RESPONSE) return Skill.SPEAKING;
  return lessonSkill;
}

const ALL_SKILLS: Skill[] = [
  Skill.READING,
  Skill.LISTENING,
  Skill.SPEAKING,
  Skill.WRITING,
];

export type SkillBreakdown = Record<Skill, number | null>;

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ========== STUDENT ==========
  /** Доступ: сам студент или владелец группы, в которой студент состоит */
  async studentOverview(studentId: string, requesterId: string) {
    await this.assertStudentAccess(studentId, requesterId);

    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        level: true,
        goal: true,
        totalXp: true,
        currentStreak: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException("Student not found");

    const [core, lessonsCompleted, placement, snapshots, weekly] =
      await Promise.all([
        this.computeCoreStats(studentId),
        this.prisma.lessonCompletion.count({ where: { userId: studentId } }),
        this.prisma.placementTest.findFirst({
          where: { userId: studentId, status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          select: {
            estimatedLevel: true,
            ability: true,
            questionsAsked: true,
            completedAt: true,
          },
        }),
        this.prisma.progressSnapshot.findMany({
          where: { userId: studentId },
          orderBy: { takenAt: "asc" },
          select: {
            label: true,
            level: true,
            totalXp: true,
            accuracy: true,
            skillBreakdown: true,
            takenAt: true,
          },
        }),
        this.weeklyActivity(studentId),
      ]);

    return {
      student: user,
      // входной уровень — последний завершённый адаптивный тест
      placement,
      totals: {
        answered: core.answered,
        correct: core.correct,
        accuracy: core.accuracy,
        lessonsCompleted,
        totalXp: user.totalXp,
      },
      skillBreakdown: core.skillBreakdown,
      // динамика по неделям (8 недель): ответы/правильность/XP
      weeklyActivity: weekly,
      snapshots,
    };
  }

  // ========== GROUP ==========
  async groupAnalytics(groupId: string, requesterId: string) {
    const group = await this.assertGroupOwnership(groupId, requesterId);

    const memberships = await this.prisma.groupMembership.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            level: true,
            totalXp: true,
            currentStreak: true,
          },
        },
      },
    });

    const students = await Promise.all(
      memberships.map(async (m) => {
        const [core, lessonsCompleted] = await Promise.all([
          this.computeCoreStats(m.user.id),
          this.prisma.lessonCompletion.count({ where: { userId: m.user.id } }),
        ]);
        return {
          ...m.user,
          answered: core.answered,
          accuracy: core.accuracy,
          lessonsCompleted,
          skillBreakdown: core.skillBreakdown,
        };
      }),
    );

    // Средние по группе (по студентам с хоть какими-то данными)
    const withData = students.filter((s) => s.answered > 0);
    const avg = (vals: number[]) =>
      vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

    const averages = {
      accuracy: avg(withData.map((s) => s.accuracy)),
      totalXp: avg(students.map((s) => s.totalXp)),
      lessonsCompleted: avg(students.map((s) => s.lessonsCompleted)),
      skillBreakdown: Object.fromEntries(
        ALL_SKILLS.map((skill) => [
          skill,
          avg(
            students
              .map((s) => s.skillBreakdown[skill])
              .filter((v): v is number => v !== null),
          ),
        ]),
      ) as SkillBreakdown,
    };

    // ── Снимки PRE/POST + динамика по неделям ──
    const memberIds = memberships.map((m) => m.user.id);
    const snaps = await this.prisma.progressSnapshot.findMany({
      where: { userId: { in: memberIds } },
      orderBy: { takenAt: "asc" },
      select: { label: true, accuracy: true, skillBreakdown: true, takenAt: true },
    });

    const aggSkill = (list: typeof snaps): SkillBreakdown =>
      Object.fromEntries(
        ALL_SKILLS.map((skill) => {
          const vals = list
            .map((s) => (s.skillBreakdown as Record<string, number | null>)?.[skill])
            .filter((v): v is number => typeof v === "number");
          return [skill, vals.length > 0 ? avg(vals) : null];
        }),
      ) as SkillBreakdown;

    const buildSide = (label: SnapshotLabel) => {
      const list = snaps.filter((s) => s.label === label);
      if (list.length === 0) return null;
      return {
        accuracy: avg(list.map((s) => s.accuracy)),
        skillBreakdown: aggSkill(list),
        count: list.length,
      };
    };
    const snapshotComparison = {
      pre: buildSide(SnapshotLabel.PRE),
      post: buildSide(SnapshotLabel.POST),
    };

    // тренд: средняя точность группы по неделям (по всем снимкам)
    const weekKey = (d: Date) => {
      const x = new Date(d);
      const dow = (x.getDay() + 6) % 7; // понедельник = 0
      x.setHours(0, 0, 0, 0);
      x.setDate(x.getDate() - dow);
      return x.toISOString().slice(0, 10);
    };
    const buckets = new Map<string, number[]>();
    for (const s of snaps) {
      const k = weekKey(s.takenAt);
      const arr = buckets.get(k) ?? [];
      arr.push(s.accuracy);
      buckets.set(k, arr);
    }
    const trend = [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([weekStart, accs]) => ({
        weekStart,
        accuracy: accs.reduce((a, b) => a + b, 0) / accs.length,
      }));

    return {
      group: { id: group.id, name: group.name },
      students,
      averages,
      snapshotComparison,
      trend,
    };
  }

  // ========== SNAPSHOTS ==========
  /**
   * Срез PRE/POST/WEEKLY для студента или всей группы.
   * PRE/POST НЕ перезаписываются — повторный вызов пропускает существующие.
   */
  async takeSnapshot(
    requesterId: string,
    dto: { label: SnapshotLabel; userId?: string; groupId?: string },
  ) {
    let userIds: string[] = [];

    if (dto.groupId) {
      await this.assertGroupOwnership(dto.groupId, requesterId);
      const members = await this.prisma.groupMembership.findMany({
        where: { groupId: dto.groupId },
        select: { userId: true },
      });
      userIds = members.map((m) => m.userId);
    } else if (dto.userId) {
      await this.assertStudentAccess(dto.userId, requesterId);
      userIds = [dto.userId];
    } else {
      throw new NotFoundException("Provide userId or groupId");
    }

    let created = 0;
    let skipped = 0;
    for (const userId of userIds) {
      const result = await this.snapshotUser(userId, dto.label);
      if (result === "created") created++;
      else skipped++;
    }
    return { created, skipped, label: dto.label };
  }

  private async snapshotUser(
    userId: string,
    label: SnapshotLabel,
  ): Promise<"created" | "skipped"> {
    // PRE/POST фиксируются один раз
    if (label !== SnapshotLabel.WEEKLY) {
      const existing = await this.prisma.progressSnapshot.findFirst({
        where: { userId, label },
        select: { id: true },
      });
      if (existing) return "skipped";
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, totalXp: true },
    });
    if (!user) return "skipped";

    const core = await this.computeCoreStats(userId);

    await this.prisma.progressSnapshot.create({
      data: {
        userId,
        label,
        level: user.level,
        totalXp: user.totalXp,
        accuracy: core.accuracy,
        skillBreakdown: core.skillBreakdown as unknown as Prisma.InputJsonValue,
      },
    });
    return "created";
  }

  /** Еженедельный автоматический срез по всем активным студентам (для динамики) */
  @Cron(CronExpression.EVERY_WEEK)
  async weeklySnapshots() {
    try {
      const users = await this.prisma.user.findMany({
        where: { isActive: true, role: "STUDENT" },
        select: { id: true },
      });
      for (const u of users) {
        await this.snapshotUser(u.id, SnapshotLabel.WEEKLY);
      }
      this.logger.log(`Weekly snapshots taken for ${users.length} students`);
    } catch (err) {
      this.logger.error("Weekly snapshot cron failed", err);
    }
  }

  // ========== CSV EXPORT ==========
  async exportGroupCsv(groupId: string, requesterId: string): Promise<string> {
    const data = await this.groupAnalytics(groupId, requesterId);

    // PRE/POST-срезы участников — для сравнения "до/после" в статистике
    const userIds = data.students.map((s) => s.id);
    const snapshots = await this.prisma.progressSnapshot.findMany({
      where: { userId: { in: userIds }, label: { in: ["PRE", "POST"] } },
      orderBy: { takenAt: "asc" },
    });
    const byUserLabel = new Map(
      snapshots.map((s) => [`${s.userId}:${s.label}`, s]),
    );

    // Формат под Excel (включая русскую локаль):
    // - разделитель ";" — в ru-локали Excel запятую не понимает (всё в одной колонке)
    // - BOM (﻿) явным escape — корректная кодировка кириллицы
    // - правильность в ЦЕЛЫХ процентах — без проблем точка/запятая в дробях
    // - даты без времени (YYYY-MM-DD)
    const SEP = ";";

    const header = [
      "Student",
      "Email",
      "Level",
      "Total XP",
      "Lessons completed",
      "Answers",
      "Accuracy, %",
      "Reading, %",
      "Listening, %",
      "Speaking, %",
      "Writing, %",
      "PRE: level",
      "PRE: XP",
      "PRE: accuracy, %",
      "PRE: date",
      "POST: level",
      "POST: XP",
      "POST: accuracy, %",
      "POST: date",
    ].map((h) => `"${h}"`);

    const pctInt = (v: number | null | undefined) =>
      v === null || v === undefined ? "" : String(Math.round(v * 100));
    const date = (d: Date) => d.toISOString().slice(0, 10);
    const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;

    const rows = data.students.map((s) => {
      const pre = byUserLabel.get(`${s.id}:PRE`);
      const post = byUserLabel.get(`${s.id}:POST`);
      return [
        esc(`${s.firstName}${s.lastName ? ` ${s.lastName}` : ""}`),
        esc(s.email),
        s.level ?? "",
        String(s.totalXp),
        String(s.lessonsCompleted),
        String(s.answered),
        s.answered > 0 ? pctInt(s.accuracy) : "",
        pctInt(s.skillBreakdown.READING),
        pctInt(s.skillBreakdown.LISTENING),
        pctInt(s.skillBreakdown.SPEAKING),
        pctInt(s.skillBreakdown.WRITING),
        pre?.level ?? "",
        pre ? String(pre.totalXp) : "",
        pre ? pctInt(pre.accuracy) : "",
        pre ? date(pre.takenAt) : "",
        post?.level ?? "",
        post ? String(post.totalXp) : "",
        post ? pctInt(post.accuracy) : "",
        post ? date(post.takenAt) : "",
      ].join(SEP);
    });

    return "\uFEFF" + [header.join(SEP), ...rows].join("\r\n");
  }

  // ========== CORE STATS ==========
  /**
   * Базовые агрегаты по оценённым ответам (isCorrect != null):
   * правильность общая и по 4 навыкам.
   */
  private async computeCoreStats(userId: string): Promise<{
    answered: number;
    correct: number;
    accuracy: number;
    skillBreakdown: SkillBreakdown;
  }> {
    const submissions = await this.prisma.answerSubmission.findMany({
      where: { userId, isCorrect: { not: null } },
      // неоценённые (pending AI) не считаются ни правильными, ни неправильными
      select: {
        isCorrect: true,
        question: {
          select: {
            type: true,
            lesson: { select: { skillFocus: true } },
          },
        },
      },
    });

    const answered = submissions.length;
    const correct = submissions.filter((s) => s.isCorrect === true).length;

    const perSkill = new Map<Skill, { total: number; correct: number }>();
    for (const s of submissions) {
      const skill = resolveSkill(s.question.type, s.question.lesson.skillFocus);
      if (!skill) continue;
      const bucket = perSkill.get(skill) ?? { total: 0, correct: 0 };
      bucket.total++;
      if (s.isCorrect === true) bucket.correct++;
      perSkill.set(skill, bucket);
    }

    const skillBreakdown = Object.fromEntries(
      ALL_SKILLS.map((skill) => {
        const bucket = perSkill.get(skill);
        return [skill, bucket ? bucket.correct / bucket.total : null];
      }),
    ) as SkillBreakdown;

    return {
      answered,
      correct,
      accuracy: answered > 0 ? correct / answered : 0,
      skillBreakdown,
    };
  }

  /** Динамика по неделям: последние 8 недель */
  private async weeklyActivity(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 7 * 8);

    const submissions = await this.prisma.answerSubmission.findMany({
      where: { userId, submittedAt: { gte: since } },
      select: { submittedAt: true, isCorrect: true, pointsEarned: true },
    });

    const weeks = new Map<
      string,
      { answered: number; correct: number; xp: number }
    >();
    for (const s of submissions) {
      // понедельник недели как ключ
      const d = new Date(s.submittedAt);
      const day = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);

      const bucket = weeks.get(key) ?? { answered: 0, correct: 0, xp: 0 };
      bucket.answered++;
      if (s.isCorrect === true) bucket.correct++;
      bucket.xp += s.pointsEarned;
      weeks.set(key, bucket);
    }

    return [...weeks.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, stats]) => ({
        weekStart,
        ...stats,
        accuracy: stats.answered > 0 ? stats.correct / stats.answered : 0,
      }));
  }

  // ========== СВОДКА ДЛЯ AI-ТЬЮТОРА ==========
  /**
   * Компактный текстовый срез успехов студента — подмешивается в системный
   * промпт тьютора, чтобы он отвечал на «how am I doing?» реальными данными.
   */
  async tutorProgressBrief(userId: string): Promise<string> {
    const [core, lessonsCompleted, vocab, path, placement] = await Promise.all([
      this.computeCoreStats(userId),
      this.prisma.lessonCompletion.count({ where: { userId } }),
      Promise.all([
        this.prisma.vocabularyEntry.count({ where: { userId } }),
        this.prisma.vocabularyEntry.count({
          where: { userId, intervalDays: { gte: 21 } },
        }),
        this.prisma.vocabularyEntry.count({
          where: { userId, dueAt: { lte: new Date() } },
        }),
      ]),
      this.prisma.learningPath.findUnique({
        where: { userId },
        select: {
          nodes: { select: { status: true } },
        },
      }),
      this.prisma.placementTest.findFirst({
        where: { userId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        select: { estimatedLevel: true, completedAt: true },
      }),
    ]);

    const pct = (v: number | null) =>
      v === null ? "no data yet" : `${Math.round(v * 100)}%`;
    const [vocabTotal, vocabLearned, vocabDue] = vocab;

    const pathLine = path
      ? `- Learning path: ${path.nodes.filter((n) => n.status === "COMPLETED").length} of ${path.nodes.length} steps completed`
      : "- Learning path: not built yet (suggest the placement test)";

    // Слабейший навык — для целевых рекомендаций
    const skillsWithData = (
      Object.entries(core.skillBreakdown) as [string, number | null][]
    ).filter((entry): entry is [string, number] => entry[1] !== null);
    const weakest =
      skillsWithData.length > 0
        ? skillsWithData.sort((a, b) => a[1] - b[1])[0]
        : null;

    return [
      `- Exercises answered: ${core.answered} (overall accuracy ${pct(core.answered > 0 ? core.accuracy : null)})`,
      `- Accuracy by skill: reading ${pct(core.skillBreakdown.READING)}, listening ${pct(core.skillBreakdown.LISTENING)}, speaking ${pct(core.skillBreakdown.SPEAKING)}, writing ${pct(core.skillBreakdown.WRITING)}`,
      weakest
        ? `- Weakest skill right now: ${weakest[0].toLowerCase()} (${pct(weakest[1])}) — recommend practising it`
        : null,
      `- Lessons completed: ${lessonsCompleted}`,
      `- Vocabulary: ${vocabTotal} saved words, ${vocabLearned} learned, ${vocabDue} due for review${vocabDue > 0 ? " (nudge them to review)" : ""}`,
      pathLine,
      placement?.estimatedLevel
        ? `- Last placement test result: ${placement.estimatedLevel}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // ========== СВОДКА ПО СТУДЕНТАМ ДЛЯ AI-АССИСТЕНТА УЧИТЕЛЯ ==========
  /** Срез по группам учителя — тьютор отвечает учителю на вопросы о студентах */
  async tutorTeacherBrief(teacherId: string): Promise<string> {
    const groups = await this.prisma.group.findMany({
      where: { ownerId: teacherId },
      include: {
        memberships: {
          take: 15,
          // ограничиваем размер промпта на больших группах
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                level: true,
                totalXp: true,
                currentStreak: true,
              },
            },
          },
        },
      },
    });

    if (groups.length === 0) {
      return "The teacher has no student groups yet. Suggest creating a group and sharing its invite code with students.";
    }

    const pct = (v: number) => `${Math.round(v * 100)}%`;
    const lines: string[] = [];

    for (const group of groups) {
      const rows: string[] = [];
      let accSum = 0;
      let accCount = 0;

      for (const m of group.memberships) {
        const [core, lessons] = await Promise.all([
          this.computeCoreStats(m.user.id),
          this.prisma.lessonCompletion.count({ where: { userId: m.user.id } }),
        ]);
        if (core.answered > 0) {
          accSum += core.accuracy;
          accCount++;
        }
        const weakest = (
          Object.entries(core.skillBreakdown) as [string, number | null][]
        )
          .filter((e): e is [string, number] => e[1] !== null)
          .sort((a, b) => a[1] - b[1])[0];

        rows.push(
          `  - ${m.user.firstName}${m.user.lastName ? ` ${m.user.lastName}` : ""}: ` +
            `level ${m.user.level ?? "?"}, ${m.user.totalXp} XP, ` +
            `${core.answered} answers (${core.answered > 0 ? pct(core.accuracy) : "no data"}), ` +
            `${lessons} lessons` +
            (weakest ? `, weakest skill: ${weakest[0].toLowerCase()} (${pct(weakest[1])})` : "") +
            (m.user.currentStreak >= 3 ? `, streak ${m.user.currentStreak}d` : ""),
        );
      }

      lines.push(
        `GROUP "${group.name}" — ${group.memberships.length} students` +
          (accCount > 0 ? `, average accuracy ${pct(accSum / accCount)}` : "") +
          `:\n${rows.join("\n")}`,
      );
    }

    return lines.join("\n\n");
  }

  // ========== ACCESS ==========

  private async assertGroupOwnership(groupId: string, requesterId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!group) throw new NotFoundException("Group not found");
    if (group.ownerId !== requesterId) {
      throw new ForbiddenException("You are not the owner of this group");
    }
    return group;
  }

  private async assertStudentAccess(
    studentId: string,
    requesterId: string,
  ): Promise<void> {
    if (studentId === requesterId) return;

    // Преподаватель видит студентов своих групп
    const membership = await this.prisma.groupMembership.findFirst({
      where: {
        userId: studentId,
        group: { ownerId: requesterId },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException(
        "You can only view your own analytics or your group students",
      );
    }
  }
}
