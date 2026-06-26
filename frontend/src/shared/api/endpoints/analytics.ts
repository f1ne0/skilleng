import { apiClient } from '../client'
import type { CefrLevel, LearningGoal, SkillType } from '@shared/model'

export type SnapshotLabel = 'PRE' | 'POST' | 'WEEKLY'
export type SkillBreakdown = Record<SkillType, number | null>

export interface WeeklyActivityPoint {
  weekStart: string
  answered: number
  correct: number
  xp: number
  accuracy: number
}

export interface SnapshotView {
  label: SnapshotLabel
  level: CefrLevel | null
  totalXp: number
  accuracy: number
  skillBreakdown: SkillBreakdown
  takenAt: string
}

export interface StudentAnalytics {
  student: {
    id: string
    firstName: string
    lastName: string | null
    level: CefrLevel | null
    goal: LearningGoal | null
    totalXp: number
    currentStreak: number
    createdAt: string
  }
  placement: {
    estimatedLevel: CefrLevel | null
    ability: number
    questionsAsked: number
    completedAt: string | null
  } | null
  totals: {
    answered: number
    correct: number
    accuracy: number
    lessonsCompleted: number
    totalXp: number
  }
  skillBreakdown: SkillBreakdown
  weeklyActivity: WeeklyActivityPoint[]
  snapshots: SnapshotView[]
}

export interface GroupStudentRow {
  id: string
  firstName: string
  lastName: string | null
  email: string
  level: CefrLevel | null
  totalXp: number
  currentStreak: number
  answered: number
  accuracy: number
  lessonsCompleted: number
  skillBreakdown: SkillBreakdown
}

export interface SnapshotSide {
  accuracy: number | null
  skillBreakdown: SkillBreakdown
  count: number
}

// "View", чтобы не конфликтовать с GroupAnalytics из endpoints/groups
export interface GroupAnalyticsView {
  group: { id: string; name: string }
  students: GroupStudentRow[]
  averages: {
    accuracy: number | null
    totalXp: number | null
    lessonsCompleted: number | null
    skillBreakdown: SkillBreakdown
  }
  snapshotComparison: {
    pre: SnapshotSide | null
    post: SnapshotSide | null
  }
  trend: Array<{ weekStart: string; accuracy: number }>
}

export const analyticsApi = {
  student: async (id: string): Promise<StudentAnalytics> => {
    const { data } = await apiClient.get<StudentAnalytics>(`/analytics/student/${id}`)
    return data
  },
  group: async (groupId: string): Promise<GroupAnalyticsView> => {
    const { data } = await apiClient.get<GroupAnalyticsView>(`/analytics/group/${groupId}`)
    return data
  },
  snapshot: async (payload: {
    label: SnapshotLabel
    userId?: string
    groupId?: string
  }): Promise<{ created: number; skipped: number; label: SnapshotLabel }> => {
    const { data } = await apiClient.post('/analytics/snapshot', payload)
    return data as { created: number; skipped: number; label: SnapshotLabel }
  },
  /** Качает CSV и отдаёт его в браузер как файл */
  exportGroupCsv: async (groupId: string, groupName: string): Promise<void> => {
    const { data } = await apiClient.get(`/analytics/group/${groupId}/export`, {
      params: { format: 'csv' },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${groupName.replaceAll(/\s+/g, '-').toLowerCase()}-analytics.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
