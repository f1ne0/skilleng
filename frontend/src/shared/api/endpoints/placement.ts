import { apiClient } from '../client'
import type { CefrLevel, QuestionType } from '@shared/model'

export interface PlacementQuestion {
  itemId: string
  type: QuestionType
  prompt: string
  /** Student view: без правильных ответов */
  payload: Record<string, unknown>
}

export interface PlacementProgress {
  asked: number
  max: number
}

export interface PlacementStartResponse {
  testId: string
  question: PlacementQuestion
  progress: PlacementProgress
}

export interface PlacementResult {
  estimatedLevel: CefrLevel
  ability: number
  questionsAsked: number
}

export type PlacementAnswerResponse =
  | {
      done: false
      isCorrect: boolean
      testId: string
      question: PlacementQuestion
      progress: PlacementProgress
    }
  | {
      done: true
      isCorrect: boolean
      result: PlacementResult
    }

export const placementApi = {
  start: async (): Promise<PlacementStartResponse> => {
    const { data } = await apiClient.post<PlacementStartResponse>('/placement/start')
    return data
  },
  answer: async (
    testId: string,
    payload: { itemId: string; answer: Record<string, unknown> },
  ): Promise<PlacementAnswerResponse> => {
    const { data } = await apiClient.post<PlacementAnswerResponse>(
      `/placement/${testId}/answer`,
      payload,
    )
    return data
  },
}
