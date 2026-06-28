import { useEffect } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { Badge, NativeButton } from '@shared/ui'
import { ThemeToggle } from '@features/theme-toggle'
import { useShellStore } from '../useShellStore'
import { useAuthStore } from '@entities/user'
import { NavItem } from './NavItem'
import { STUDENT_NAV, TEACHER_NAV, TEACHER_COMMON_NAV } from './navConfig'

const PANEL_W = 264

/**
 * Off-canvas меню для телефона/планшета (< lg). Открывается гамбургером в
 * топбаре, закрывается по тапу на пункт, фон или крестик, а также при смене
 * роута. Когда закрыто — НИЧЕГО не рендерит (return null), чтобы исключить
 * любые «висящие» слои, перехватывающие клики.
 */
export function MobileSidebar() {
  const open = useShellStore((s) => s.mobileOpen)
  const setOpen = useShellStore((s) => s.setMobileOpen)
  const role = useAuthStore((s) => s.user?.role)
  const isTeacher = role === 'TEACHER'
  const location = useLocation()

  // Закрываем при смене страницы
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, setOpen])

  // Закрываем, если окно расширили до десктопа (там drawer не нужен)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setOpen])

  // Блокируем скролл body, пока меню открыто
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const close = () => setOpen(false)

  // Закрыто → нет DOM вообще. Никаких оверлеев, никаких перехватов кликов.
  if (!open) return null

  const items = isTeacher ? TEACHER_NAV : STUDENT_NAV
  const extra = isTeacher ? TEACHER_COMMON_NAV : []

  return (
    <Box position="fixed" inset="0" zIndex={50}>
      {/* затемнение */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={close}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
      />
      {/* панель */}
      <motion.aside
        initial={{ x: -PANEL_W }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 460, damping: 42 }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: PANEL_W,
          maxWidth: '85vw',
          background: 'var(--se-colors-bg-surface)',
          borderRight: '1px solid var(--se-colors-border-subtle)',
        }}
      >
        <Flex direction="column" h="100%" px="12px" py="16px" overflow="hidden">
          <Flex align="center" justify="space-between" h="40px" mb="16px" pl="4px">
            <Flex align="center" gap="8px">
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
              <Text fontSize="16px" fontWeight="600" letterSpacing="-0.02em" color="text.primary">
                SkillEng
              </Text>
            </Flex>
            <NativeButton
              type="button"
              onClick={close}
              aria-label="Close menu"
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="36px"
              h="36px"
              borderRadius="md"
              bg="transparent"
              border="none"
              color="text.tertiary"
              cursor="pointer"
              _hover={{ bg: 'bg.subtle', color: 'text.primary' }}
            >
              <X size={18} />
            </NativeButton>
          </Flex>

          <Stack gap="2px" flex="1" overflow="auto">
            {items.map((item) => (
              <Box key={item.to} onClick={close}>
                <NavItem
                  to={item.to}
                  label={item.label}
                  Icon={item.Icon}
                  collapsed={false}
                  exact={item.exact}
                  endSlot={
                    item.badge ? (
                      <Badge tone="accent" shape="pill">
                        {item.badge}
                      </Badge>
                    ) : null
                  }
                />
              </Box>
            ))}

            {extra.length > 0 && <Box h="14px" flexShrink={0} />}
            {extra.map((item) => (
              <Box key={item.to} onClick={close}>
                <NavItem to={item.to} label={item.label} Icon={item.Icon} collapsed={false} />
              </Box>
            ))}
          </Stack>

          <Box pt="12px" borderTop="1px solid" borderColor="border.subtle" px="4px">
            <ThemeToggle />
          </Box>
        </Flex>
      </motion.aside>
    </Box>
  )
}
