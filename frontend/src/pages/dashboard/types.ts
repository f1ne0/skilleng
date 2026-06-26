import type { CefrLevel } from '@entities/user'

export interface DashboardStats {
  streakDays: number
  xpThisWeek: number
  xpDaily: { day: string; xp: number }[]
  currentLevel: CefrLevel
  nextLevel: CefrLevel
  levelProgressPct: number
  dailyGoal: number
  dailyEarned: number
}

export interface ContinueLesson {
  courseSlug: string
  courseTitle: string
  lessonTitle: string
  lessonIndex: number
  totalLessons: number
  estMinutes: number
  cover: string
}

export interface RecommendedCourseCard {
  id: string
  slug: string
  title: string
  description: string
  level: CefrLevel
  lessons: number
  hours: number
  tone: 'emerald' | 'blue' | 'amber'
}

export interface ActivityItem {
  id: string
  title: string
  meta: string
  ago: string
  kind: 'lesson' | 'streak' | 'word' | 'level'
}
