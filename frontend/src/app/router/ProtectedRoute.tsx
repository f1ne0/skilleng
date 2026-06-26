import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@entities/user'
import type { Role } from '@entities/user'

/** Домашняя страница по роли — куда отправлять при попытке зайти не на свой раздел */
function roleHome(role: Role | undefined): string {
  return role === 'TEACHER' ? '/teach' : '/dashboard'
}

export function ProtectedRoute({
  children,
  requireOnboarding = true,
}: {
  children: ReactNode
  /** If true (default), unfinished onboarding forces redirect to /onboarding. */
  requireOnboarding?: boolean
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (requireOnboarding && user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken))
  const user = useAuthStore((s) => s.user)
  if (isAuthed) {
    if (!user?.onboardingCompleted && user?.role !== 'TEACHER') {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to={roleHome(user?.role)} replace />
  }
  return <>{children}</>
}

export function RequireRole({
  role,
  children,
}: {
  role: Role
  children: ReactNode
}) {
  const user = useAuthStore((s) => s.user)
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== role) {
    // не на свой раздел — мягко уводим домой по роли, без ошибки 403
    return <Navigate to={roleHome(user.role)} replace />
  }
  return <>{children}</>
}

/** Группа роутов под роль: рендерит вложенные через <Outlet/> */
export function RoleZone({ role }: { role: Role }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={roleHome(user.role)} replace />
  return <Outlet />
}
