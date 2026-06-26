import { apiClient } from '../client'
import type { CefrLevel } from '@shared/model'
import type { QuestionType } from '@shared/model'

export type ContentSkill =
  | 'READING'
  | 'LISTENING'
  | 'SPEAKING'
  | 'WRITING'
  | 'GRAMMAR'
  | 'VOCABULARY'

export interface GeneratedQuestion {
  type: QuestionType
  prompt: string
  explanation: string | null
  payload: Record<string, unknown>
}

export interface GenerateQuestionsPayload {
  topic: string
  level: CefrLevel
  skill?: ContentSkill
  types: QuestionType[]
  count: number
}

export interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[]
  requested: number
  generated: number
}

export interface GenerateReadingPayload {
  topic: string
  level: CefrLevel
  length: 'SHORT' | 'MEDIUM' | 'LONG'
  questionCount?: number
}

export interface GenerateReadingResponse {
  title: string
  text: string
  level: CefrLevel
  questions: GeneratedQuestion[]
}

export interface GenerateListeningPayload {
  topic: string
  level: CefrLevel
  format: 'MONOLOGUE' | 'DIALOGUE'
  questionCount?: number
}

export interface GenerateListeningResponse {
  title: string
  transcript: string
  audioUrl: string
  level: CefrLevel
  questions: GeneratedQuestion[]
}

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

export interface GenerateCoursePayload {
  topic: string
  level: CefrLevel
  lessonCount: number
  category?: CourseCategory
}

export interface GeneratedLessonPreview {
  title: string
  description: string
  content: string
  questions: GeneratedQuestion[]
}

export interface GeneratedCoursePreview {
  title: string
  description: string
  level: CefrLevel
  category: CourseCategory
  lessons: GeneratedLessonPreview[]
}

// AI-генерация контента (TEACHER). Все методы возвращают превью —
// сохранение в урок выполняется отдельно через questionsApi/lessonsApi.
export interface GenerateLessonPayload {
  topic: string
  level: CefrLevel
}

export const contentApi = {
  generateLessonText: async (
    payload: GenerateLessonPayload,
  ): Promise<{ content: string }> => {
    const { data } = await apiClient.post<{ content: string }>(
      '/content/generate-lesson',
      payload,
    )
    return data
  },
  generateCourse: async (
    payload: GenerateCoursePayload,
  ): Promise<GeneratedCoursePreview> => {
    const { data } = await apiClient.post<GeneratedCoursePreview>(
      '/content/generate-course',
      payload,
    )
    return data
  },
  generateQuestions: async (
    payload: GenerateQuestionsPayload,
  ): Promise<GenerateQuestionsResponse> => {
    const { data } = await apiClient.post<GenerateQuestionsResponse>(
      '/content/generate-questions',
      payload,
    )
    return data
  },
  generateReading: async (
    payload: GenerateReadingPayload,
  ): Promise<GenerateReadingResponse> => {
    const { data } = await apiClient.post<GenerateReadingResponse>(
      '/content/generate-reading',
      payload,
    )
    return data
  },
  generateListening: async (
    payload: GenerateListeningPayload,
  ): Promise<GenerateListeningResponse> => {
    const { data } = await apiClient.post<GenerateListeningResponse>(
      '/content/generate-listening',
      payload,
    )
    return data
  },
}
