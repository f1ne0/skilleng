import { apiClient } from '../client'

export type LessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type LessonSkill = 'READING' | 'LISTENING' | 'SPEAKING' | 'WRITING'

export interface LessonSummary {
  id: string
  courseId: string
  title: string
  description: string | null
  order: number
  status: LessonStatus
  isPreview: boolean
  videoUrl: string | null
  audioUrl: string | null
  durationSec: number | null
  skillFocus?: LessonSkill | null
  availableFrom?: string | null
  isLocked?: boolean
  isCompleted?: boolean
  completedAt?: string | null
  topicId?: string | null
}

export interface LessonDetail extends LessonSummary {
  content: string
}

export interface CompleteLessonResponse {
  success: boolean
  xpEarned?: number
  newAchievements?: Array<{ id: string; name: string; iconUrl: string }>
  streak?: { current: number; longest: number }
}

export interface CreateLessonPayload {
  title: string
  description?: string
  content: string
  videoUrl?: string
  audioUrl?: string
  durationSec?: number
  isPreview?: boolean
  topicId?: string | null
  availableFrom?: string | null
}

export interface UpdateLessonPayload extends Partial<CreateLessonPayload> {}

export const lessonsApi = {
  byCourse: async (courseId: string): Promise<LessonSummary[]> => {
    const { data } = await apiClient.get<LessonSummary[]>(`/courses/${courseId}/lessons`)
    return data
  },
  myByCourse: async (courseId: string): Promise<LessonSummary[]> => {
    const { data } = await apiClient.get<LessonSummary[]>(`/courses/${courseId}/lessons/me`)
    return data
  },
  byId: async (id: string): Promise<LessonDetail> => {
    const { data } = await apiClient.get<LessonDetail>(`/lessons/${id}`)
    return data
  },
  complete: async (id: string): Promise<CompleteLessonResponse> => {
    const { data } = await apiClient.post<CompleteLessonResponse>(`/lessons/${id}/complete`)
    return data
  },
  create: async (courseId: string, payload: CreateLessonPayload): Promise<LessonDetail> => {
    const { data } = await apiClient.post<LessonDetail>(
      `/courses/${courseId}/lessons`,
      payload,
    )
    return data
  },
  update: async (id: string, payload: UpdateLessonPayload): Promise<LessonDetail> => {
    const { data } = await apiClient.patch<LessonDetail>(`/lessons/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/lessons/${id}`)
    return data
  },
  publish: async (id: string): Promise<LessonDetail> => {
    const { data } = await apiClient.post<LessonDetail>(`/lessons/${id}/publish`)
    return data
  },
  archive: async (id: string): Promise<LessonDetail> => {
    const { data } = await apiClient.post<LessonDetail>(`/lessons/${id}/archive`)
    return data
  },
  reorder: async (courseId: string, lessonIds: string[]): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<{ success: boolean }>(
      `/courses/${courseId}/lessons/reorder`,
      { lessonIds },
    )
    return data
  },
}
