import { useEffect, useRef } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { useShellStore } from './useShellStore'
import { gamificationApi } from '@shared/api'

export function AppShell() {
  const location = useLocation()
  const setSidebarCollapsed = useShellStore((s) => s.setSidebarCollapsed)
  const prevCollapsed = useRef<boolean | null>(null)
  const isAiTutor = location.pathname.startsWith('/ai-tutor')

  // На странице AI Assistant сворачиваем левое меню (у чата свой сайдбар),
  // при уходе возвращаем прежнее состояние.
  useEffect(() => {
    if (isAiTutor) {
      if (prevCollapsed.current === null) {
        prevCollapsed.current = useShellStore.getState().sidebarCollapsed
      }
      setSidebarCollapsed(true)
    } else if (prevCollapsed.current !== null) {
      setSidebarCollapsed(prevCollapsed.current)
      prevCollapsed.current = null
    }
  }, [isAiTutor, setSidebarCollapsed])

  const { data } = useQuery({
    queryKey: ['gamification', 'me'],
    queryFn: gamificationApi.me,
  })

  return (
    <Flex minH="100vh" bg="bg.canvas">
      <Sidebar />
      <Flex direction="column" flex="1" minW="0">
        <Topbar streakDays={data?.streak.current ?? 0} xp={data?.totalXp ?? 0} />
        <Box as="main" flex="1" minH="0">
          {/* Анимация смены страниц: каждый роут въезжает с лёгким
              подъёмом и fade — покрывает все страницы внутри шелла */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              style={{ minHeight: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Flex>
    </Flex>
  )
}
