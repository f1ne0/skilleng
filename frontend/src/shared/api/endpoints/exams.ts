import { apiClient } from '../client'
import type { QuestionType } from '@shared/model'

export type ExamType = 'CHECKPOINT' | 'FINAL'

export interface ExamSummary {
  id: string
  title: string
  type: ExamType
  order: number
  unitsLabel: string | null
  passingScore: number
  questionCount: number
  isLocked?: boolean
  lessonsRemaining?: number
  bestAttempt: {
    score: number | null
    passed: boolean | null
    completedAt: string | null
  } | null
}

export interface ExamQuestionView {
  id: string
  type: QuestionType
  prompt: string
  points: number
  payload: Record<string, unknown>
}

export interface ExamStartResponse {
  attemptId: string
  exam: {
    id: string
    title: string
    type: ExamType
    unitsLabel: string | null
    passingScore: number
  }
  questions: ExamQuestionView[]
}

export interface ExamSubmitResponse {
  attemptId: string
  score: number
  passed: boolean
  earnedPoints: number
  totalPoints: number
  breakdown: { questionId: string; prompt: string; isCorrect: boolean }[]
}

export interface ExamDetailQuestion {
  id: string
  type: QuestionType
  prompt: string
  points: number
  /** полный payload с правильными ответами (для учителя) */
  payload: Record<string, unknown>
}

export interface ExamDetail {
  id: string
  title: string
  type: ExamType
  unitsLabel: string | null
  passingScore: number
  questions: ExamDetailQuestion[]
}

export interface ExamResults {
  exam: { id: string; title: string; type: ExamType; unitsLabel: string | null }
  stats: { students: number; averageScore: number | null; passed: number }
  students: {
    userId: string
    firstName: string
    lastName: string | null
    score: number | null
    passed: boolean | null
    completedAt: string | null
  }[]
}

export const examsApi = {
  listForCourse: async (courseId: string): Promise<ExamSummary[]> => {
    const { data } = await apiClient.get<ExamSummary[]>('/exams', {
      params: { courseId },
    })
    return data
  },
  start: async (examId: string): Promise<ExamStartResponse> => {
    const { data } = await apiClient.post<ExamStartResponse>(`/exams/${examId}/start`)
    return data
  },
  submit: async (
    attemptId: string,
    answers: { questionId: string; answer: Record<string, unknown> }[],
  ): Promise<ExamSubmitResponse> => {
    const { data } = await apiClient.post<ExamSubmitResponse>(
      `/exams/attempts/${attemptId}/submit`,
      { answers },
    )
    return data
  },
  // teacher
  create: async (payload: {
    courseId: string
    title: string
    type: ExamType
    unitsLabel?: string
    passingScore?: number
  }): Promise<ExamSummary> => {
    const { data } = await apiClient.post<ExamSummary>('/exams', payload)
    return data
  },
  update: async (examId: string, payload: {
    title?: string
    type?: ExamType
    unitsLabel?: string
    passingScore?: number
  }): Promise<ExamSummary> => {
    const { data } = await apiClient.patch<ExamSummary>(`/exams/${examId}`, payload)
    return data
  },
  remove: async (examId: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/exams/${examId}`)
    return data
  },
  addQuestion: async (examId: string, payload: {
    type: QuestionType
    prompt: string
    payload: Record<string, unknown>
    points?: number
  }): Promise<{ id: string }> => {
    const { data } = await apiClient.post<{ id: string }>(`/exams/${examId}/questions`, payload)
    return data
  },
  removeQuestion: async (questionId: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/exams/questions/${questionId}`)
    return data
  },
  generate: async (
    examId: string,
    count: number,
    types?: QuestionType[],
  ): Promise<{ examId: string; generated: number }> => {
    const { data } = await apiClient.post(`/exams/${examId}/generate`, { count, types })
    return data as { examId: string; generated: number }
  },
  results: async (examId: string): Promise<ExamResults> => {
    const { data } = await apiClient.get<ExamResults>(`/exams/${examId}/results`)
    return data
  },
  detail: async (examId: string): Promise<ExamDetail> => {
    const { data } = await apiClient.get<ExamDetail>(`/exams/${examId}`)
    return data
  },
}
