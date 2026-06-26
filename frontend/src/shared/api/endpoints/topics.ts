import { apiClient } from '../client'
import type { CefrLevel, SkillType } from '@shared/model'

/** Навыки тем: 4 вида речевой деятельности + языковые аспекты */
export type TopicSkill = SkillType | 'GRAMMAR' | 'VOCABULARY'

export interface TopicSummary {
  id: string
  title: string
  skill: TopicSkill
  level: CefrLevel
  order: number
  lessonCount: number
}

export interface TopicLesson {
  id: string
  title: string
  description: string | null
  durationSec: number | null
  isPreview: boolean
  skillFocus: SkillType | null
  course: { id: string; slug: string; title: string }
}

export interface TopicDetail {
  id: string
  title: string
  skill: TopicSkill
  level: CefrLevel
  theoryContent: string
  order: number
  lessons: TopicLesson[]
  createdAt: string
  updatedAt: string
}

export interface CreateTopicPayload {
  title: string
  skill: TopicSkill
  level: CefrLevel
  theoryContent: string
  order?: number
}

export type UpdateTopicPayload = Partial<CreateTopicPayload>

export const topicsApi = {
  list: async (params?: { skill?: TopicSkill; level?: CefrLevel }): Promise<TopicSummary[]> => {
    const { data } = await apiClient.get<TopicSummary[]>('/topics', { params })
    return data
  },
  byId: async (id: string): Promise<TopicDetail> => {
    const { data } = await apiClient.get<TopicDetail>(`/topics/${id}`)
    return data
  },
  create: async (payload: CreateTopicPayload): Promise<TopicDetail> => {
    const { data } = await apiClient.post<TopicDetail>('/topics', payload)
    return data
  },
  update: async (id: string, payload: UpdateTopicPayload): Promise<TopicDetail> => {
    const { data } = await apiClient.patch<TopicDetail>(`/topics/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/topics/${id}`)
  },
}
