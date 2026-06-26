import { apiClient } from '../client'
import type { AuthResponse, User } from '@shared/model'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName?: string
}

// refresh-токен ходит в httpOnly-куке — в теле запросов/ответов его нет
export interface RefreshResponse {
  accessToken: string
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload)
    return data
  },
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload)
    return data
  },
  refresh: async (): Promise<RefreshResponse> => {
    const { data } = await apiClient.post<RefreshResponse>('/auth/refresh')
    return data
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
  logoutAll: async (): Promise<void> => {
    await apiClient.post('/auth/logout-all')
  },
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/users/me')
    return data
  },
}
