import type { CefrLevel, LearningGoal } from '@shared/model'

export type CourseTone = 'emerald' | 'blue' | 'amber' | 'violet' | 'rose'

export type LessonKind = 'theory' | 'exercise' | 'speaking' | 'listening' | 'review'

export type LessonSkill = 'READING' | 'LISTENING' | 'SPEAKING' | 'WRITING'

export interface Lesson {
  id: string
  slug: string
  index: number
  title: string
  summary: string
  kind: LessonKind
  skill: LessonSkill | null
  durationMin: number
  xpReward: number
  locked: boolean
  /** Дата открытия (ISO) — если задана учителем */
  availableFrom: string | null
  completed: boolean
  progressPct: number
}

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  longDescription?: string
  level: CefrLevel
  goal: LearningGoal
  tone: CourseTone
  topics: string[]
  totalLessons: number
  totalMinutes: number
  enrolledCount: number
  ratingAvg?: number
  ratingCount?: number
  featured?: boolean
  /** undefined = not enrolled, 0 = enrolled but not started, 1 = completed */
  progress?: number
  nextLessonId?: string | null
  lessons: Lesson[]
  /** Курс закрыт, пока не пройден курс-предпосылка */
  locked?: boolean
  /** Название курса-предпосылки */
  prerequisiteTitle?: string | null
}
