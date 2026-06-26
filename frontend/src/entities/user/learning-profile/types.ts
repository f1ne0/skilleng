import type { CefrLevel, LearningGoal } from '@shared/model'

export interface OnboardingState {
  level: CefrLevel | null
  goal: LearningGoal | null
  nativeLanguage: string | null
  interests: string[]
}

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  level: null,
  goal: null,
  nativeLanguage: null,
  interests: [],
}

export type StepIndex = 0 | 1 | 2 | 3

export const STEP_TITLES = [
  'What is your English level?',
  'What is your learning goal?',
  'What is your native language?',
  'What are you interested in?',
] as const

export const STEP_SUBTITLES = [
  "Be honest — we'll fine-tune lessons to match where you are.",
  "We'll prioritise the vocabulary and scenarios that matter most to you.",
  'So we can explain tricky grammar in terms you already know.',
  "We'll build lessons around topics you actually care about.",
] as const
