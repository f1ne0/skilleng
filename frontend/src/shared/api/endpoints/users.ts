import { apiClient } from '../client'
import type { CefrLevel, LearningGoal, User } from '@shared/model'

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string | null
  bio?: string | null
  avatarUrl?: string | null
  level?: CefrLevel
  goal?: LearningGoal
  nativeLanguage?: string | null
  interests?: string[]
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const usersApi = {
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/users/me')
    return data
  },
  updateMe: async (payload: UpdateUserPayload): Promise<User> => {
    const { data } = await apiClient.patch<User>('/users/me', payload)
    return data
  },
  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean }> => {
    const { data } = await apiClient.patch<{ success: boolean }>('/users/me/password', payload)
    return data
  },
  deleteAccount: async (): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>('/users/me')
    return data
  },
}
