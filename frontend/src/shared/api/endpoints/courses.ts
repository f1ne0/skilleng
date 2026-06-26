import { apiClient } from '../client'
import type { CefrLevel, QuestionType } from '@shared/model'

export type CourseCategory =
  | 'GRAMMAR'
  | 'VOCABULARY'
  | 'BUSINESS_ENGLISH'
  | 'IELTS'
  | 'CONVERSATION'
  | 'PRONUNCIATION'
  | 'LISTENING'
  | 'READING'
  | 'WRITING'
  | 'EXAM_PREP'

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface CourseSummary {
  id: string
  slug: string
  title: string
  description: string
  level: CefrLevel | null
  category: CourseCategory
  coverImageUrl: string | null
  status: CourseStatus
  ownerId: string
  totalLessons?: number
  enrolledCount?: number
  /** Прогресс студента по записанному курсу (0–100), приходит из /courses/me */
  progressPercent?: number
  /** Курс закрыт, пока не пройден курс-предпосылка */
  locked?: boolean
  /** ID курса-предпосылки (если задан) */
  prerequisiteCourseId?: string | null
  /** Название курса-предпосылки (если задан) */
  prerequisiteTitle?: string | null
  createdAt: string
  updatedAt: string
}

export interface CourseDetail extends CourseSummary {
  longDescription?: string | null
}

export interface CourseFilter {
  level?: CefrLevel
  category?: CourseCategory
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedCourses {
  items: CourseSummary[]
  total: number
  page: number
  limit: number
}

export interface CreateCoursePayload {
  title: string
  description: string
  level?: CefrLevel
  category: CourseCategory
  coverImageUrl?: string
}

export interface UpdateCoursePayload {
  title?: string
  description?: string
  level?: CefrLevel | null
  category?: CourseCategory
  coverImageUrl?: string | null
}

export interface GeneratedQuestionInput {
  type: QuestionType
  prompt: string
  explanation?: string
  payload: Record<string, unknown>
}

export interface GeneratedLessonInput {
  title: string
  description?: string
  content: string
  questions: GeneratedQuestionInput[]
}

export interface CreateGeneratedCoursePayload {
  title: string
  description: string
  level?: CefrLevel
  category: CourseCategory
  lessons: GeneratedLessonInput[]
}

export const coursesApi = {
  list: async (filter: CourseFilter = {}): Promise<PaginatedCourses> => {
    const { data } = await apiClient.get<PaginatedCourses>('/courses', { params: filter })
    return data
  },
  bySlug: async (slug: string): Promise<CourseDetail> => {
    const { data } = await apiClient.get<CourseDetail>(`/courses/slug/${slug}`)
    return data
  },
  byId: async (id: string): Promise<CourseDetail> => {
    const { data } = await apiClient.get<CourseDetail>(`/courses/${id}`)
    return data
  },
  my: async (): Promise<CourseSummary[]> => {
    const { data } = await apiClient.get<CourseSummary[]>('/courses/my')
    return data
  },
  enroll: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<{ success: boolean }>(`/courses/${id}/enroll`)
    return data
  },
  unenroll: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/courses/${id}/enroll`)
    return data
  },
  create: async (payload: CreateCoursePayload): Promise<CourseDetail> => {
    const { data } = await apiClient.post<CourseDetail>('/courses', payload)
    return data
  },
  // Сохранить AI-сгенерированный курс (с уроками и вопросами) одним запросом
  createGenerated: async (payload: CreateGeneratedCoursePayload): Promise<CourseDetail> => {
    const { data } = await apiClient.post<CourseDetail>('/courses/generated', payload)
    return data
  },
  update: async (id: string, payload: UpdateCoursePayload): Promise<CourseDetail> => {
    const { data } = await apiClient.patch<CourseDetail>(`/courses/${id}`, payload)
    return data
  },
  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/courses/${id}`)
    return data
  },
  publish: async (id: string): Promise<CourseDetail> => {
    const { data } = await apiClient.post<CourseDetail>(`/courses/${id}/publish`)
    return data
  },
  archive: async (id: string): Promise<CourseDetail> => {
    const { data } = await apiClient.post<CourseDetail>(`/courses/${id}/archive`)
    return data
  },
}
