import { apiClient } from '../client'
import type { CefrLevel, LearningGoal, SkillType } from '@shared/model'

export type PathNodeType = 'LESSON' | 'SKILL_BLOCK' | 'CHECKPOINT' | 'REVIEW'
export type PathNodeStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED'

export interface PathNodeLesson {
  id: string
  title: string
  durationSec: number | null
  courseSlug: string
  courseTitle: string
}

export interface PathNode {
  id: string
  order: number
  type: PathNodeType
  status: PathNodeStatus
  skillFocus: SkillType | null
  refId: string | null
  completedAt: string | null
  lesson: PathNodeLesson | null
}

export interface LearningPath {
  id: string
  basedOnLevel: CefrLevel
  goal: LearningGoal | null
  createdAt: string
  progress: { completed: number; total: number }
  nodes: PathNode[]
}

export type LearningPathResponse = LearningPath | { exists: false }

export function isLearningPath(r: LearningPathResponse): r is LearningPath {
  return !('exists' in r)
}

export const learningPathApi = {
  get: async (): Promise<LearningPathResponse> => {
    const { data } = await apiClient.get<LearningPathResponse>('/learning-path')
    return data
  },
  generate: async (): Promise<LearningPathResponse> => {
    const { data } = await apiClient.post<LearningPathResponse>('/learning-path/generate')
    return data
  },
}
