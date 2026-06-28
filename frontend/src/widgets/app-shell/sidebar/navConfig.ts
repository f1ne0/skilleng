import {
  LayoutDashboard,
  Map,
  BarChart3,
  BookOpen,
  BookMarked,
  Library,
  Bot,
  User as UserIcon,
  Trophy,
  Medal,
  Users,
  GraduationCap,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react'

export interface NavEntry {
  to: string
  label: string
  Icon: LucideIcon
  badge?: 'New'
  exact?: boolean
}

export const STUDENT_NAV: NavEntry[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/path', label: 'My path', Icon: Map },
  { to: '/courses', label: 'Courses', Icon: BookOpen },
  { to: '/topics', label: 'Topics', Icon: Library },
  { to: '/vocabulary', label: 'Vocabulary', Icon: BookMarked },
  { to: '/ai-tutor', label: 'AI Tutor', Icon: Bot, badge: 'New' },
  { to: '/achievements', label: 'Achievements', Icon: Trophy },
  { to: '/leaderboard', label: 'Leaderboard', Icon: Medal },
  { to: '/groups', label: 'Groups', Icon: Users },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
]

export const TEACHER_NAV: NavEntry[] = [
  { to: '/teach', label: 'Overview', Icon: GraduationCap, exact: true },
  { to: '/teach/courses', label: 'Courses', Icon: BookOpen },
  { to: '/teach/topics', label: 'Topics', Icon: Library },
  { to: '/teach/exams', label: 'Exams', Icon: ClipboardCheck },
  { to: '/teach/groups', label: 'Groups', Icon: Users },
  { to: '/teach/students', label: 'Students', Icon: GraduationCap },
  { to: '/teach/analytics', label: 'Analytics', Icon: BarChart3 },
]

// Общие пункты для учителя: AI-ассистент (в режиме преподавателя) и профиль.
export const TEACHER_COMMON_NAV: NavEntry[] = [
  { to: '/ai-tutor', label: 'AI Assistant', Icon: Bot },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
]
