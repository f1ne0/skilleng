// Доменные типы пользователя.
// Живут в shared, потому что нужны и shared/api (контракты эндпоинтов),
// и entities/features — entities/user реэкспортирует их для удобства.
export type Role = 'STUDENT' | 'TEACHER'
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type LearningGoal = 'TRAVEL' | 'BUSINESS' | 'ACADEMIC' | 'DAILY' | 'EXAM_PREP'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string | null
  role: Role
  level: CefrLevel | null
  goal: LearningGoal | null
  nativeLanguage: string | null
  interests: string[]
  avatarUrl: string | null
  bio: string | null
  onboardingCompleted: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
  totalXp?: number
}

export interface AuthResponse {
  accessToken: string
  // refresh-токен приходит в httpOnly-куке, в теле его больше нет
  user: User
}
