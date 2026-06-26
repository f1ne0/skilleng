import { PrismaService } from "../prisma/prisma.service";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  // Сколько нужно набрать для разблокировки (для прогресс-бара)
  target: number;
  // Текущее значение метрики у пользователя
  progress: (prisma: PrismaService, userId: string) => Promise<number>;
  // Функция проверки. Возвращает true если юзер заслужил ачивку.
  check: (prisma: PrismaService, userId: string) => Promise<boolean>;
}

// Хелпер: ачивка-«накопитель» — progress >= target
function counter(
  base: Omit<Achievement, "check">,
): Achievement {
  return {
    ...base,
    check: async (prisma, userId) =>
      (await base.progress(prisma, userId)) >= base.target,
  };
}

const lessonsDone = (p: PrismaService, userId: string) =>
  p.lessonCompletion.count({ where: { userId } });
const correctAnswers = (p: PrismaService, userId: string) =>
  p.answerSubmission.count({ where: { userId, isCorrect: true } });
const totalXp = async (p: PrismaService, userId: string) =>
  (await p.user.findUnique({ where: { id: userId }, select: { totalXp: true } }))?.totalXp ?? 0;
const bestStreak = async (p: PrismaService, userId: string) => {
  const u = await p.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true },
  });
  return Math.max(u?.currentStreak ?? 0, u?.longestStreak ?? 0);
};
const enrollments = (p: PrismaService, userId: string) =>
  p.courseEnrollment.count({ where: { userId } });

export const ACHIEVEMENTS: Achievement[] = [
  // ===== Прогресс =====
  counter({
    id: "first_steps",
    name: "First Steps",
    description: "Complete your first lesson",
    iconUrl: "/icons/first-steps.svg",
    target: 1,
    progress: lessonsDone,
  }),
  counter({
    id: "question_master",
    name: "Question Master",
    description: "Answer 50 questions correctly",
    iconUrl: "/icons/question-master.svg",
    target: 50,
    progress: correctAnswers,
  }),

  // ===== XP =====
  counter({
    id: "quick_learner",
    name: "Quick Learner",
    description: "Earn 100 XP",
    iconUrl: "/icons/quick-learner.svg",
    target: 100,
    progress: totalXp,
  }),
  counter({
    id: "centurion",
    name: "Centurion",
    description: "Earn 1000 XP",
    iconUrl: "/icons/centurion.svg",
    target: 1000,
    progress: totalXp,
  }),

  // ===== Streak =====
  counter({
    id: "week_warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    iconUrl: "/icons/week-warrior.svg",
    target: 7,
    progress: bestStreak,
  }),
  counter({
    id: "marathon_runner",
    name: "Marathon Runner",
    description: "Maintain a 30-day streak",
    iconUrl: "/icons/marathon-runner.svg",
    target: 30,
    progress: bestStreak,
  }),

  // ===== Разнообразие =====
  counter({
    id: "course_explorer",
    name: "Course Explorer",
    description: "Enroll in 3 different courses",
    iconUrl: "/icons/course-explorer.svg",
    target: 3,
    progress: enrollments,
  }),
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Answer ALL questions in a single lesson correctly",
    iconUrl: "/icons/perfectionist.svg",
    target: 1,
    progress: async (prisma, userId) =>
      (await perfectLessonExists(prisma, userId)) ? 1 : 0,
    check: (prisma, userId) => perfectLessonExists(prisma, userId),
  },
];

async function perfectLessonExists(
  prisma: PrismaService,
  userId: string,
): Promise<boolean> {
  const lessons = await prisma.lesson.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, _count: { select: { questions: true } } },
  });
  for (const lesson of lessons) {
    if (lesson._count.questions === 0) continue;
    const correctCount = await prisma.answerSubmission.count({
      where: { userId, isCorrect: true, question: { lessonId: lesson.id } },
    });
    if (correctCount === lesson._count.questions) return true;
  }
  return false;
}

// Быстрый доступ по ID
export const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
