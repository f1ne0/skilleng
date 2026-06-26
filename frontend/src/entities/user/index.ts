// Типы и сессия переехали в shared (model/session), чтобы shared/api
// не импортировал из entities (FSD). Здесь — реэкспорт для потребителей.
export type { Role, CefrLevel, LearningGoal, User, AuthResponse } from '@shared/model'
export { useAuthStore, useCurrentUser, useIsAuthenticated } from '@shared/session'

// UI и данные "учебного профиля" (уровень/цель/язык/интересы) —
// используются и онбордингом, и редактированием профиля
export { StepLevel } from './learning-profile/StepLevel'
export { StepGoal } from './learning-profile/StepGoal'
export { StepLanguage } from './learning-profile/StepLanguage'
export { StepInterests } from './learning-profile/StepInterests'
export {
  LEVELS, GOALS, LANGUAGES, INTERESTS, MIN_INTERESTS, MAX_INTERESTS,
} from './learning-profile/data'
export type {
  LevelOption, GoalOption, LanguageOption, Interest,
} from './learning-profile/data'
export {
  INITIAL_ONBOARDING_STATE, STEP_TITLES, STEP_SUBTITLES,
} from './learning-profile/types'
export type { OnboardingState, StepIndex } from './learning-profile/types'
