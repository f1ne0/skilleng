import type { ReactNode } from 'react'
import { Box, Flex, Stack } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Map,
  BarChart3,
  BookOpen,
  BookMarked,
  Library,
  Bot,
  User as UserIcon,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Trophy,
  Medal,
  Users,
  GraduationCap,
  ClipboardCheck,
} from 'lucide-react'
import { Badge, NativeButton } from '@shared/ui'
import { ThemeToggle } from '@features/theme-toggle'
import { useShellStore } from '../useShellStore'
import { useAuthStore } from '@entities/user'
import { NavItem } from './NavItem'

const STUDENT_NAV = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/path',         label: 'My path',      Icon: Map },
  { to: '/courses',      label: 'Courses',      Icon: BookOpen },
  { to: '/topics',       label: 'Topics',       Icon: Library },
  { to: '/vocabulary',   label: 'Vocabulary',   Icon: BookMarked },
  { to: '/ai-tutor',     label: 'AI Tutor',     Icon: Bot, badge: 'New' as const },
  { to: '/achievements', label: 'Achievements', Icon: Trophy },
  { to: '/leaderboard',  label: 'Leaderboard',  Icon: Medal },
  { to: '/groups',       label: 'Groups',       Icon: Users },
  { to: '/profile',      label: 'Profile',      Icon: UserIcon },
] as const

const TEACHER_NAV = [
  { to: '/teach',                   label: 'Overview',     Icon: GraduationCap, exact: true },
  { to: '/teach/courses',           label: 'Courses',      Icon: BookOpen },
  { to: '/teach/topics',            label: 'Topics',       Icon: Library },
  { to: '/teach/exams',             label: 'Exams',        Icon: ClipboardCheck },
  { to: '/teach/groups',            label: 'Groups',       Icon: Users },
  { to: '/teach/students',          label: 'Students',     Icon: GraduationCap },
  { to: '/teach/analytics',         label: 'Analytics',    Icon: BarChart3 },
] as const

// Общие пункты для учителя: AI-ассистент (в режиме преподавателя) и профиль.
// Студенческие разделы (My path, Vocabulary, Achievements…) учителю не показываем —
// они завязаны на студенческие данные (уровень, словарь, XP) и дают ошибки
const TEACHER_COMMON_NAV = [
  { to: '/ai-tutor', label: 'AI Assistant', Icon: Bot },
  { to: '/profile',  label: 'Profile',      Icon: UserIcon },
] as const

export const SIDEBAR_W_EXPANDED = 240
export const SIDEBAR_W_COLLAPSED = 64

export function Sidebar() {
  const collapsed = useShellStore((s) => s.sidebarCollapsed)
  const toggle = useShellStore((s) => s.toggleSidebar)
  const role = useAuthStore((s) => s.user?.role)
  const isTeacher = role === 'TEACHER'

  return (
    <motion.aside
      animate={{ width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        background: 'var(--se-colors-bg-surface)',
        borderRight: '1px solid var(--se-colors-border-subtle)',
        zIndex: 5,
      }}
    >
      <Flex direction="column" h="100%" px="12px" py="20px" overflow="hidden">
        <Flex align="center" h="40px" mb="20px">
          <Flex w="40px" h="40px" align="center" justify="center" flexShrink={0}>
            <Box
              w="28px"
              h="28px"
              bg="accent.solid"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="text.onAccent"
            >
              <Sparkles size={16} />
            </Box>
          </Flex>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  color: 'var(--se-colors-text-primary)',
                }}
              >
                SkillEng
              </motion.span>
            )}
          </AnimatePresence>
        </Flex>

        <Stack gap="2px" flex="1" overflow="auto">
          {/* Распорки: в свёрнутом виде иконки ПЛАВНО съезжаются
              к вертикальному центру сайдбара (flexGrow анимируется) */}
          <motion.div
            animate={{ flexGrow: collapsed ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ flexShrink: 0 }}
          />

          {/* Учитель видит только свой раздел + ассистента и профиль;
              студент — свой набор. Пункты появляются каскадом */}
          {!isTeacher &&
            STUDENT_NAV.map((item, i) => (
              <StaggerIn key={item.to} index={i}>
                <NavItem
                  to={item.to}
                  label={item.label}
                  Icon={item.Icon}
                  collapsed={collapsed}
                  endSlot={
                    'badge' in item && item.badge ? (
                      <Badge tone="accent" shape="pill">
                        {item.badge}
                      </Badge>
                    ) : null
                  }
                />
              </StaggerIn>
            ))}

          {isTeacher && (
            <>
              {TEACHER_NAV.map((item, i) => (
                <StaggerIn key={item.to} index={i}>
                  <NavItem
                    to={item.to}
                    label={item.label}
                    Icon={item.Icon}
                    collapsed={collapsed}
                    exact={'exact' in item && item.exact}
                  />
                </StaggerIn>
              ))}

              <Box h="14px" flexShrink={0} />
              {TEACHER_COMMON_NAV.map((item, i) => (
                <StaggerIn key={item.to} index={TEACHER_NAV.length + i}>
                  <NavItem
                    to={item.to}
                    label={item.label}
                    Icon={item.Icon}
                    collapsed={collapsed}
                  />
                </StaggerIn>
              ))}
            </>
          )}

          {/* нижняя распорка — пара верхней */}
          <motion.div
            animate={{ flexGrow: collapsed ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ flexShrink: 0 }}
          />
        </Stack>

        <Stack gap="6px" pt="12px" borderTop="1px solid" borderColor="border.subtle">
          {/* Плавное схлопывание блока темы — без него нижняя часть
              прыгала к центру скачком при сворачивании сайдбара */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <Box px="4px">
                  <ThemeToggle />
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
          <NativeButton
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            display="flex"
            alignItems="center"
            h="36px"
            p="0"
            borderRadius="md"
            bg="transparent"
            border="none"
            color="text.tertiary"
            fontSize="xs"
            cursor="pointer"
            overflow="hidden"
            transition="background 150ms, color 150ms"
            _hover={{ bg: 'bg.subtle', color: 'text.primary' }}
          >
            <Flex w="40px" h="36px" align="center" justify="center" flexShrink={0}>
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </Flex>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </NativeButton>
        </Stack>
      </Flex>
    </motion.aside>
  )
}

/** Каскадное появление пунктов меню при маунте: лёгкий сдвиг + fade */
function StaggerIn({ index, children }: { index: number; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.25,
        delay: Math.min(index * 0.035, 0.45),
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
