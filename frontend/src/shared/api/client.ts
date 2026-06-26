import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@shared/session'

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  // refresh-токен живёт в httpOnly-куке — куки должны ходить с запросами
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function performRefresh(): Promise<string | null> {
  const { setAccessToken, logout } = useAuthStore.getState()

  try {
    // Plain axios call (not apiClient) to avoid interceptor recursion.
    // refresh-токен передаётся httpOnly-кукой — тело пустое, withCredentials обязателен
    const { data } = await axios.post<{ accessToken: string }>(
      `${baseURL}/auth/refresh`,
      {},
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true },
    )
    setAccessToken(data.accessToken)
    return data.accessToken
  } catch {
    logout()
    return null
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as RetriableConfig | undefined
    const status = err.response?.status

    // Don't try to refresh on the refresh endpoint itself or without a config
    const url = original?.url ?? ''
    const isAuthEndpoint =
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register')

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        }
        return apiClient(original)
      }

      // Refresh failed — redirect to login
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(err)
  },
)

export interface ApiError {
  message: string
  code?: string
  field?: string
}

export function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined
    if (data?.message) {
      return Array.isArray(data.message) ? (data.message[0] ?? err.message) : data.message
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong.'
}
