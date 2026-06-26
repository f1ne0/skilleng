import { apiClient } from '../client'
import type { SubmitAnswerResponse } from '@shared/model'

export interface SubmitAnswerPayload {
  answer: Record<string, unknown>
}

export interface MyAnswer {
  id: string
  questionId: string
  answer: Record<string, unknown>
  isCorrect: boolean | null
  // null = не оценено (SHORT_WRITING/SPEAKING до прихода AI-оценки)
  pointsEarned: number
  attemptCount: number
  submittedAt: string
  firstCorrectAt: string | null
  // AI-оценка речи/письма (приходит асинхронно, спустя пару секунд)
  aiScore: number | null
  aiFeedback: string | null // JSON-строка: { feedback, strengths[], improvements[], transcript? }
}

export interface ParsedAiFeedback {
  feedback?: string
  strengths?: string[]
  improvements?: string[]
  transcript?: string
}

export const answersApi = {
  submit: async (
    questionId: string,
    payload: SubmitAnswerPayload,
  ): Promise<SubmitAnswerResponse> => {
    const { data } = await apiClient.post<SubmitAnswerResponse>(
      `/questions/${questionId}/answer`,
      payload,
    )
    return data
  },
  myAnswer: async (questionId: string): Promise<MyAnswer | null> => {
    const { data } = await apiClient.get<MyAnswer | null>(
      `/questions/${questionId}/answer/me`,
    )
    return data
  },
}
