import { apiClient } from '../client'
import type { CefrLevel, LearningGoal, User } from '@shared/model'

export interface OnboardingPayload {
  level: CefrLevel
  goal: LearningGoal
  nativeLanguage?: string
  interests?: string[]
}

export const onboardingApi = {
  submit: async (payload: OnboardingPayload): Promise<User> => {
    const { data } = await apiClient.post<User>('/users/me/onboarding', payload)
    return data
  },
}
