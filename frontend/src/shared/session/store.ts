import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../model'

// Сессия живёт в shared, потому что нужна shared/api/client (Bearer + refresh).
// entities/user реэкспортирует стор — потребители продолжают импортировать @entities/user.
// SECURITY: refresh-токен НЕ хранится на фронте вообще — он живёт в httpOnly-куке,
// которую ставит бэкенд. В localStorage персистится только accessToken + user.
interface AuthState {
  accessToken: string | null
  user: User | null
  setSession: (tokens: { accessToken: string }, user: User) => void
  setAccessToken: (accessToken: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: ({ accessToken }, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    { name: 'skilleng.auth' },
  ),
)

export const useCurrentUser = (): User | null => useAuthStore((s) => s.user)
export const useIsAuthenticated = (): boolean => useAuthStore((s) => Boolean(s.accessToken))
