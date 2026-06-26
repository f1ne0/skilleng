// Адаптер API → UI-модель курса. Живёт в entities/course, потому что
// используется и страницей курсов, и дашбордом (страница из страницы в FSD запрещено).
import type {
  CourseSummary,
  CourseDetail,
  CourseCategory,
  LessonSummary,
} from '@shared/api'
import type { LearningGoal } from '@shared/model'
import type { Course, Lesson, LessonKind, CourseTone } from './types'

const CATEGORY_TONE: Record<CourseCategory, CourseTone> = {
  GRAMMAR: 'blue',
  VOCABULARY: 'emerald',
  BUSINESS_ENGLISH: 'amber',
  IELTS: 'rose',
  CONVERSATION: 'emerald',
  PRONUNCIATION: 'violet',
  LISTENING: 'blue',
  READING: 'amber',
  WRITING: 'violet',
  EXAM_PREP: 'rose',
}

const CATEGORY_GOAL: Record<CourseCategory, LearningGoal> = {
  GRAMMAR: 'ACADEMIC',
  VOCABULARY: 'DAILY',
  BUSINESS_ENGLISH: 'BUSINESS',
  IELTS: 'EXAM_PREP',
  CONVERSATION: 'TRAVEL',
  PRONUNCIATION: 'DAILY',
  LISTENING: 'DAILY',
  READING: 'ACADEMIC',
  WRITING: 'ACADEMIC',
  EXAM_PREP: 'EXAM_PREP',
}

const CATEGORY_TOPICS: Record<CourseCategory, string[]> = {
  GRAMMAR: ['Grammar', 'Structure', 'Rules'],
  VOCABULARY: ['Vocabulary', 'Words', 'Phrases'],
  BUSINESS_ENGLISH: ['Business', 'Email', 'Meetings'],
  IELTS: ['IELTS', 'Test prep', 'Academic'],
  CONVERSATION: ['Speaking', 'Dialogues', 'Small talk'],
  PRONUNCIATION: ['Sounds', 'Stress', 'Intonation'],
  LISTENING: ['Listening', 'Comprehension', 'Audio'],
  READING: ['Reading', 'Comprehension', 'Texts'],
  WRITING: ['Writing', 'Essays', 'Style'],
  EXAM_PREP: ['Exam', 'Strategy', 'Practice'],
}

export interface CourseAdapterContext {
  enrolledCourseIds?: Set<string>
  progressById?: Map<string, number>
  lockedCourseIds?: Set<string>
}

export function adaptCourseSummary(
  api: CourseSummary,
  ctx: CourseAdapterContext = {},
): Course {
  const totalLessons = api.totalLessons ?? 0
  const enrolled = ctx.enrolledCourseIds?.has(api.id) ?? false
  const progress = ctx.progressById?.get(api.id)

  return {
    id: api.id,
    slug: api.slug,
    title: api.title,
    description: api.description,
    level: api.level ?? 'B1',
    goal: CATEGORY_GOAL[api.category],
    tone: CATEGORY_TONE[api.category],
    topics: CATEGORY_TOPICS[api.category],
    totalLessons,
    totalMinutes: totalLessons * 10,
    enrolledCount: api.enrolledCount ?? 0,
    progress: enrolled ? (progress ?? 0) : undefined,
    nextLessonId: null,
    lessons: [],
    locked: ctx.lockedCourseIds?.has(api.id) ?? false,
    prerequisiteTitle: api.prerequisiteTitle ?? null,
  }
}

export function adaptCourseDetail(
  api: CourseDetail,
  lessons: LessonSummary[],
  progressPercent?: number,
): Course {
  const uiLessons = lessons.map(adaptLesson)
  const nextLesson =
    uiLessons.find((l) => !l.completed && !l.locked) ?? uiLessons[0]

  const enrolled = progressPercent !== undefined
  return {
    id: api.id,
    slug: api.slug,
    title: api.title,
    description: api.description,
    longDescription: api.longDescription ?? undefined,
    level: api.level ?? 'B1',
    goal: CATEGORY_GOAL[api.category],
    tone: CATEGORY_TONE[api.category],
    topics: CATEGORY_TOPICS[api.category],
    totalLessons: uiLessons.length,
    totalMinutes: uiLessons.reduce((sum, l) => sum + l.durationMin, 0),
    enrolledCount: api.enrolledCount ?? 0,
    progress: enrolled ? progressPercent / 100 : undefined,
    nextLessonId: nextLesson?.id ?? null,
    lessons: uiLessons,
  }
}

function adaptLesson(api: LessonSummary): Lesson {
  return {
    id: api.id,
    slug: api.id, // backend has no slug — use ID for URL routing
    index: api.order + 1,
    title: api.title,
    summary: api.description ?? '',
    kind: deriveLessonKind(api),
    skill: api.skillFocus ?? null,
    durationMin: api.durationSec ? Math.max(1, Math.round(api.durationSec / 60)) : 10,
    xpReward: 20,
    // доверяем бэкенду: он уже учёл завершённость и дату открытия
    locked: api.isLocked ?? false,
    availableFrom: api.availableFrom ?? null,
    completed: api.isCompleted ?? false,
    progressPct: api.isCompleted ? 100 : 0,
  }
}

function deriveLessonKind(lesson: LessonSummary): LessonKind {
  const t = lesson.title.toLowerCase()
  if (t.includes('speak')) return 'speaking'
  if (t.includes('listen')) return 'listening'
  if (t.includes('review') || t.includes('test')) return 'review'
  if (t.includes('theor') || t.includes('intro')) return 'theory'
  return 'exercise'
}
