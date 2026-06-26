import type { CefrLevel, LearningGoal } from '@shared/model'
import {
  Plane,
  Briefcase,
  GraduationCap,
  MessageCircle,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export interface LevelOption {
  level: CefrLevel
  title: string
  description: string
  example: string
}

export const LEVELS: LevelOption[] = [
  {
    level: 'A1',
    title: 'Beginner',
    description: 'I can introduce myself and use basic phrases.',
    example: '"Hello, my name is Alex. I am from Almaty."',
  },
  {
    level: 'A2',
    title: 'Elementary',
    description: 'I can talk about routines, family, and shopping.',
    example: '"I usually wake up at 7 and go to work by bus."',
  },
  {
    level: 'B1',
    title: 'Intermediate',
    description: 'I can handle most situations while travelling.',
    example: '"Could you tell me how to get to the museum from here?"',
  },
  {
    level: 'B2',
    title: 'Upper-intermediate',
    description: 'I can discuss complex topics with native speakers.',
    example: '"I think remote work has both clear benefits and drawbacks."',
  },
  {
    level: 'C1',
    title: 'Advanced',
    description: 'I can express ideas fluently and precisely.',
    example: '"That argument hinges on a fairly questionable assumption."',
  },
  {
    level: 'C2',
    title: 'Mastery',
    description: 'I can use English as effortlessly as my native language.',
    example: '"The nuance you\'re after is closer to \'apprehensive\' than \'afraid\'."',
  },
]

export interface GoalOption {
  goal: LearningGoal
  title: string
  description: string
  Icon: LucideIcon
}

export const GOALS: GoalOption[] = [
  {
    goal: 'TRAVEL',
    title: 'Travel',
    description: 'Order food, ask for directions, make friends abroad.',
    Icon: Plane,
  },
  {
    goal: 'BUSINESS',
    title: 'Business',
    description: 'Negotiate, present, write professional emails.',
    Icon: Briefcase,
  },
  {
    goal: 'ACADEMIC',
    title: 'Academic',
    description: 'Read papers, write essays, follow lectures.',
    Icon: GraduationCap,
  },
  {
    goal: 'DAILY',
    title: 'Daily conversation',
    description: 'Chat, watch shows, understand pop culture.',
    Icon: MessageCircle,
  },
  {
    goal: 'EXAM_PREP',
    title: 'Exam prep',
    description: 'IELTS, TOEFL, SAT — score with confidence.',
    Icon: FileText,
  },
]

export interface LanguageOption {
  code: string
  name: string
  native: string
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'ru', name: 'Russian',    native: 'Русский' },
  { code: 'uz', name: 'Uzbek',      native: "O'zbek" },
  { code: 'kk', name: 'Kazakh',     native: 'Қазақша' },
  { code: 'en', name: 'English',    native: 'English' },
  { code: 'ky', name: 'Kyrgyz',     native: 'Кыргызча' },
  { code: 'tg', name: 'Tajik',      native: 'Тоҷикӣ' },
  { code: 'tr', name: 'Turkish',    native: 'Türkçe' },
  { code: 'ar', name: 'Arabic',     native: 'العربية' },
  { code: 'fa', name: 'Persian',    native: 'فارسی' },
  { code: 'zh', name: 'Chinese',    native: '中文' },
  { code: 'es', name: 'Spanish',    native: 'Español' },
  { code: 'fr', name: 'French',     native: 'Français' },
  { code: 'de', name: 'German',     native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'hi', name: 'Hindi',      native: 'हिन्दी' },
  { code: 'ja', name: 'Japanese',   native: '日本語' },
  { code: 'ko', name: 'Korean',     native: '한국어' },
]

export const INTERESTS = [
  'Movies', 'Music', 'Tech', 'Sports', 'Cooking', 'Travel',
  'Business', 'Science', 'Gaming', 'Art', 'Books', 'Fashion',
  'Politics', 'Health', 'History', 'Nature',
] as const

export type Interest = (typeof INTERESTS)[number]

export const MIN_INTERESTS = 3
export const MAX_INTERESTS = 8
