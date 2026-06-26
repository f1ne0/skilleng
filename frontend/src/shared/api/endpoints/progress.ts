import { apiClient } from '../client'

export interface CourseProgress {
  totalQuestions: number
  answered: number
  correct: number
  correctPercent: number
  xpEarned: number
  totalLessons: number
  completedLessons: number
  lessonCompletionPercent: number
}

export interface LessonProgress {
  totalQuestions: number
  answered: number
  correct: number
  allCorrect: boolean
  xpEarned: number
  isCompleted: boolean
  completedAt: string | null
}

export type RecentActivityItem =
  | {
      type: 'LESSON_COMPLETED'
      at: string
      lessonId: string
      lessonTitle: string
      courseId: string
      courseSlug: string
      courseTitle: string
    }
  | {
      type: 'ACHIEVEMENT_UNLOCKED'
      at: string
      achievementId: string
      name: string
      description: string
      iconUrl: string
    }

export const progressApi = {
  byCourse: async (courseId: string): Promise<CourseProgress> => {
    const { data } = await apiClient.get<CourseProgress>(`/progress/courses/${courseId}`)
    return data
  },
  byLesson: async (lessonId: string): Promise<LessonProgress> => {
    const { data } = await apiClient.get<LessonProgress>(`/progress/lessons/${lessonId}`)
    return data
  },
  recentActivity: async (limit = 10): Promise<RecentActivityItem[]> => {
    const { data } = await apiClient.get<RecentActivityItem[]>('/progress/recent-activity', {
      params: { limit },
    })
    return data
  },
}
