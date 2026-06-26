import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, CornerDownLeft, ArrowUp, ArrowDown,
  LayoutDashboard, Map, BookOpen, Library, BookMarked, Bot,
  Trophy, Medal, Users, User as UserIcon, GraduationCap,
  ClipboardCheck, BarChart3, type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@entities/user'

interface Item {
  to: string
  label: string
  Icon: LucideIcon
}

const STUDENT_ITEMS: Item[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/path', label: 'My path', Icon: Map },
  { to: '/courses', label: 'Courses', Icon: BookOpen },
  { to: '/topics', label: 'Topics', Icon: Library },
  { to: '/vocabulary', label: 'Vocabulary', Icon: BookMarked },
  { to: '/ai-tutor', label: 'AI Tutor', Icon: Bot },
  { to: '/achievements', label: 'Achievements', Icon: Trophy },
  { to: '/leaderboard', label: 'Leaderboard', Icon: Medal },
  { to: '/groups', label: 'Groups', Icon: Users },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
]

const TEACHER_ITEMS: Item[] = [
  { to: '/teach', label: 'Overview', Icon: GraduationCap },
  { to: '/teach/courses', label: 'Courses', Icon: BookOpen },
  { to: '/teach/topics', label: 'Topics', Icon: Library },
  { to: '/teach/exams', label: 'Exams', Icon: ClipboardCheck },
  { to: '/teach/groups', label: 'Groups', Icon: Users },
  { to: '/teach/students', label: 'Students', Icon: GraduationCap },
  { to: '/teach/analytics', label: 'Analytics', Icon: BarChart3 },
  { to: '/ai-tutor', label: 'AI Assistant', Icon: Bot },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
]

/** Командная палитра — открывается на Cmd/Ctrl+K, навигация по разделам. */
export function CommandPalette() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const items = user?.role === 'TEACHER' ? TEACHER_ITEMS : STUDENT_ITEMS
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => i.label.toLowerCase().includes(q))
  }, [items, query])

  // глобальный Cmd/Ctrl+K + событие открытия из строки поиска
  // открыть со сбросом запроса/выделения (в обработчике, не в эффекте)
  const openRef = useRef(false)
  useEffect(() => { openRef.current = open }, [open])
  const openPalette = () => {
    setQuery('')
    setActive(0)
    setOpen(true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (openRef.current) setOpen(false)
        else openPalette()
      }
    }
    const onOpen = () => openPalette()
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // только фокус (DOM-сайд-эффект, без setState)
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [open])

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const it = filtered[active]
      if (it) go(it.to)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Box position="fixed" inset="0" zIndex={2000}>
          {/* затемнение */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          />
          {/* панель */}
          <Flex position="absolute" inset="0" justify="center" align="flex-start" pt={{ base: '12vh', md: '14vh' }} px="16px" pointerEvents="none">
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: '100%', maxWidth: 560, pointerEvents: 'auto' }}
            >
              <Box
                bg="bg.surface"
                border="1px solid"
                borderColor="border.default"
                borderRadius="2xl"
                boxShadow="0 24px 60px rgba(0,0,0,0.45)"
                overflow="hidden"
                onKeyDown={onKeyDown}
              >
                {/* строка ввода */}
                <Flex align="center" gap="10px" px="16px" h="54px" borderBottom="1px solid" borderColor="border.subtle">
                  <Box color="text.tertiary"><Search size={18} /></Box>
                  <Box
                    as="input"
                    ref={inputRef}
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); setActive(0) }}
                    placeholder="Go to… (type a page)"
                    flex="1"
                    bg="transparent"
                    border="none"
                    outline="none"
                    fontSize="md"
                    color="text.primary"
                    _placeholder={{ color: 'text.tertiary' }}
                  />
                  <Kbd>Esc</Kbd>
                </Flex>

                {/* список */}
                <Box ref={listRef} maxH="320px" overflowY="auto" py="6px">
                  {filtered.length === 0 ? (
                    <Box px="16px" py="20px">
                      <Text fontSize="sm" color="text.tertiary">No matches for “{query}”.</Text>
                    </Box>
                  ) : (
                    filtered.map((item, i) => {
                      const sel = i === active
                      return (
                        <Flex
                          key={item.to}
                          align="center"
                          gap="12px"
                          mx="6px"
                          px="10px"
                          h="40px"
                          borderRadius="lg"
                          cursor="pointer"
                          bg={sel ? 'accent.surface' : 'transparent'}
                          color={sel ? 'accent.text' : 'text.primary'}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(item.to)}
                        >
                          <Box color={sel ? 'accent.text' : 'text.tertiary'}><item.Icon size={16} /></Box>
                          <Text fontSize="sm" fontWeight="medium" flex="1">{item.label}</Text>
                          {sel && <Box color="accent.text"><CornerDownLeft size={14} /></Box>}
                        </Flex>
                      )
                    })
                  )}
                </Box>

                {/* подвал-подсказка */}
                <Flex align="center" gap="14px" px="16px" h="38px" borderTop="1px solid" borderColor="border.subtle" color="text.tertiary" fontSize="xs">
                  <Flex align="center" gap="4px"><ArrowUp size={12} /><ArrowDown size={12} /><span>navigate</span></Flex>
                  <Flex align="center" gap="4px"><CornerDownLeft size={12} /><span>open</span></Flex>
                </Flex>
              </Box>
            </motion.div>
          </Flex>
        </Box>
      )}
    </AnimatePresence>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      align="center"
      justify="center"
      px="6px"
      h="22px"
      minW="28px"
      borderRadius="md"
      bg="bg.subtle"
      border="1px solid"
      borderColor="border.subtle"
      color="text.tertiary"
      fontSize="11px"
      fontFamily="mono"
    >
      {children}
    </Flex>
  )
}
