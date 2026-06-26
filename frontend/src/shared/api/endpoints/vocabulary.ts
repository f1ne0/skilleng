import { apiClient } from '../client'

export interface VocabularyEntry {
  id: string
  term: string
  translation: string
  example: string | null
  partOfSpeech: string | null
  sourceLessonId: string | null
  // SRS
  repetitions: number
  easeFactor: number
  intervalDays: number
  dueAt: string
  lastReviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateVocabularyPayload {
  term: string
  translation: string
  example?: string
  partOfSpeech?: string
  sourceLessonId?: string
}

export type UpdateVocabularyPayload = Partial<CreateVocabularyPayload>

export interface VocabularyListResponse {
  items: VocabularyEntry[]
  total: number
  page: number
  limit: number
}

export interface VocabularyStats {
  total: number
  learned: number
  dueNow: number
}

/** Оценка вспоминания по SM-2: 0-2 = забыл, 3-5 = вспомнил */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

export const vocabularyApi = {
  create: async (payload: CreateVocabularyPayload): Promise<VocabularyEntry> => {
    const { data } = await apiClient.post<VocabularyEntry>('/vocabulary', payload)
    return data
  },
  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<VocabularyListResponse> => {
    const { data } = await apiClient.get<VocabularyListResponse>('/vocabulary', { params })
    return data
  },
  byId: async (id: string): Promise<VocabularyEntry> => {
    const { data } = await apiClient.get<VocabularyEntry>(`/vocabulary/${id}`)
    return data
  },
  update: async (id: string, payload: UpdateVocabularyPayload): Promise<VocabularyEntry> => {
    const { data } = await apiClient.patch<VocabularyEntry>(`/vocabulary/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/vocabulary/${id}`)
  },
  due: async (): Promise<VocabularyEntry[]> => {
    const { data } = await apiClient.get<VocabularyEntry[]>('/vocabulary/review/due')
    return data
  },
  review: async (id: string, quality: ReviewQuality): Promise<VocabularyEntry> => {
    const { data } = await apiClient.post<VocabularyEntry>(`/vocabulary/review/${id}`, { quality })
    return data
  },
  stats: async (): Promise<VocabularyStats> => {
    const { data } = await apiClient.get<VocabularyStats>('/vocabulary/stats')
    return data
  },
}
