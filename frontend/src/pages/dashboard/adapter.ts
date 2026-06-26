import { formatDistanceToNow } from 'date-fns'
import type {
  GamificationInfo,
  CourseSummary,
  RecentActivityItem,
} from '@shared/api'
import type { CefrLevel, User } from '@entities/user'
import { adaptCourseSummary } from '@entities/course'
import type {
  DashboardStats,
  ContinueLesson,
  RecommendedCourseCard,
  ActivityItem,
} from './types'

const LEVEL_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function nextCefrLevel(current: CefrLevel | null | undefined): CefrLevel {
  const idx = current ? LEVEL_ORDER.indexOf(current) : -1
  if (idx < 0) return 'A2'
  return LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)]!
}

export function adaptGamificationToStats(
  g: GamificationInfo,
  user: User | null,
  dailyGoal: number,
): DashboardStats {
  return {
    streakDays: g.streak.current,
    xpThisWeek: g.weeklyXp,
    // Backend has no per-day breakdown — sparkline shows a flat line for now.
    xpDaily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      xp: Math.round(g.weeklyXp / 7),
    })),
    currentLevel: user?.level ?? 'A1',
    nextLevel: nextCefrLevel(user?.level ?? null),
    levelProgressPct: Math.round(g.level.progress * 100),
    dailyGoal,
    dailyEarned: Math.min(dailyGoal, Math.round(g.weeklyXp / 7)),
  }
}

const TONE_CYCLE: RecommendedCourseCard['tone'][] = ['emerald', 'blue', 'amber']

export function adaptRecommendedCourses(
  catalog: CourseSummary[],
  enrolledIds: Set<string>,
  user: User | null,
  limit = 3,
): RecommendedCourseCard[] {
  const seen = new Set<string>()
  const filtered = catalog
    .filter((c) => !enrolledIds.has(c.id))
    .filter((c) => (c.totalLessons ?? 0) > 0) // не рекомендуем пустые курсы
    .filter((c) => (user?.level ? !c.level || c.level === user.level : true))
    .filter((c) => {
      const key = c.title.trim().toLowerCase() // дедуп по названию
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, limit)

  return filtered.map((c, i) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    level: c.level ?? 'B1',
    lessons: c.totalLessons ?? 0,
    hours: Math.max(1, Math.round((c.totalLessons ?? 0) / 6)),
    tone: TONE_CYCLE[i % TONE_CYCLE.length]!,
  }))
}

export function adaptRecentActivity(items: RecentActivityItem[]): ActivityItem[] {
  return items.map((item) => {
    const ago = formatDistanceToNow(new Date(item.at), { addSuffix: true })
    if (item.type === 'LESSON_COMPLETED') {
      return {
        id: `lesson-${item.lessonId}-${item.at}`,
        title: `Completed "${item.lessonTitle}"`,
        meta: item.courseTitle,
        ago,
        kind: 'lesson',
      }
    }
    return {
      id: `achievement-${item.achievementId}-${item.at}`,
      title: item.name,
      meta: item.description,
      ago,
      kind: 'level',
    }
  })
}

export function pickContinueLesson(
  myCourses: CourseSummary[],
): ContinueLesson | null {
  // Pick the most recently updated enrolled course (rough heuristic).
  const sorted = [...myCourses].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
  const target = sorted[0]
  if (!target) return null
  const ui = adaptCourseSummary(target, { enrolledCourseIds: new Set([target.id]) })
  return {
    courseSlug: target.slug,
    courseTitle: target.title,
    lessonTitle: ui.title,
    lessonIndex: 1,
    totalLessons: target.totalLessons ?? 0,
    estMinutes: 10,
    cover: 'gradient-emerald',
  }
}
