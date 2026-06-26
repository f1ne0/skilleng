import { apiClient } from '../client'

export interface LevelInfo {
  level: number
  xpInCurrentLevel: number
  xpForNextLevel: number
  progress: number
}

export interface GamificationInfo {
  totalXp: number
  weeklyXp: number
  level: LevelInfo
  streak: {
    current: number
    longest: number
    lastActiveDate: string | null
  }
  achievements: {
    unlocked: number
    total: number
  }
}

export interface AchievementWithStatus {
  id: string
  name: string
  description: string
  iconUrl: string
  unlocked: boolean
  unlockedAt: string | null
  progress: { current: number; target: number }
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  firstName: string
  lastName: string | null
  avatarUrl: string | null
  xp: number
}

export type LeaderboardPeriod = 'all' | 'week'

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  me: LeaderboardEntry | null
}

export const gamificationApi = {
  me: async (): Promise<GamificationInfo> => {
    const { data } = await apiClient.get<GamificationInfo>('/gamification/me')
    return data
  },
  achievements: async (): Promise<AchievementWithStatus[]> => {
    const { data } = await apiClient.get<AchievementWithStatus[]>('/gamification/achievements')
    return data
  },
  leaderboard: async (
    period: LeaderboardPeriod = 'all',
    limit = 100,
    userId?: string,
  ): Promise<LeaderboardResponse> => {
    const { data } = await apiClient.get<LeaderboardResponse>('/gamification/leaderboard', {
      params: { period, limit, userId },
    })
    return data
  },
}
