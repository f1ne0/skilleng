import { apiClient } from '../client'
import type { QuestionStudentView, QuestionType } from '@shared/model'

export interface TeacherQuestion {
  id: string
  lessonId: string
  type: QuestionType
  prompt: string
  payload: Record<string, unknown>
  explanation: string | null
  points: number
  order: number
  createdAt: string
  updatedAt: string
}

export interface CreateQuestionPayload {
  type: QuestionType
  prompt: string
  payload: Record<string, unknown>
  explanation?: string
  points?: number
}

export interface UpdateQuestionPayload {
  type?: QuestionType
  prompt?: string
  payload?: Record<string, unknown>
  explanation?: string | null
  points?: number
}

export const questionsApi = {
  byLessonForMe: async (lessonId: string): Promise<QuestionStudentView[]> => {
    const { data } = await apiClient.get<QuestionStudentView[]>(
      `/lessons/${lessonId}/questions/me`,
    )
    return data
  },
  byLessonForTeacher: async (lessonId: string): Promise<TeacherQuestion[]> => {
    // /me — авторизованный эндпоинт: владельцу курса возвращает ВСЕ вопросы с ответами
    // (обычный /lessons/:id/questions анонимен и для не-preview уроков отдаёт пусто)
    const { data } = await apiClient.get<TeacherQuestion[]>(
      `/lessons/${lessonId}/questions/me`,
    )
    return data
  },
  byId: async (id: string): Promise<QuestionStudentView> => {
    const { data } = await apiClient.get<QuestionStudentView>(`/questions/${id}`)
    return data
  },
  create: async (
    lessonId: string,
    payload: CreateQuestionPayload,
  ): Promise<TeacherQuestion> => {
    const { data } = await apiClient.post<TeacherQuestion>(
      `/lessons/${lessonId}/questions`,
      payload,
    )
    return data
  },
  update: async (
    id: string,
    payload: UpdateQuestionPayload,
  ): Promise<TeacherQuestion> => {
    const { data } = await apiClient.patch<TeacherQuestion>(`/questions/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/questions/${id}`)
    return data
  },
  reorder: async (lessonId: string, questionIds: string[]): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<{ success: boolean }>(
      `/lessons/${lessonId}/questions/reorder`,
      { questionIds },
    )
    return data
  },
}
