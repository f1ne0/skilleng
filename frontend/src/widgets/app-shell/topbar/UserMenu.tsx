import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, User as UserIcon } from 'lucide-react'
import { Avatar, NativeButton } from '@shared/ui'
import { useAuthStore } from '@entities/user'
import { authApi } from '@shared/api'

export function UserMenu() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const displayName = user ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : 'Guest'

  const handleLogout = async () => {
    try {
      // refresh-токен в httpOnly-куке — сервер сам её прочитает и очистит
      await authApi.logout()
    } catch {
      // Best-effort revocation on the server.
    }
    logout()
    qc.clear()
    navigate('/login', { replace: true })
  }

  return (
    <Box ref={wrapRef} position="relative">
      <NativeButton
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        p="0"
        w="36px"
        h="36px"
        bg="transparent"
        border="none"
        borderRadius="full"
        cursor="pointer"
        position="relative"
        transition="background 150ms"
        _hover={{ bg: 'bg.subtle' }}
        _focusVisible={{ outline: 'none', boxShadow: 'focus' }}
      >
        <Box
          position="relative"
          w="30px"
          h="30px"
          borderRadius="full"
          boxShadow={open ? '0 0 0 2px var(--se-colors-accent-solid)' : 'none'}
          transition="box-shadow 150ms"
        >
          <Avatar size="sm" name={displayName} src={user?.avatarUrl} />
          {/* Online presence dot */}
          <Box
            position="absolute"
            right="-1px"
            bottom="-1px"
            w="9px"
            h="9px"
            borderRadius="full"
            bg="accent.solid"
            border="2px solid"
            borderColor="bg.canvas"
          />
        </Box>
      </NativeButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 240,
              zIndex: 20,
              background: 'var(--se-colors-bg-elevated)',
              border: '1px solid var(--se-colors-border-default)',
              borderRadius: 12,
              boxShadow:
                '0 16px 32px rgba(0,0,0,0.45), 0 4px 8px rgba(0,0,0,0.25)',
              padding: 6,
            }}
            role="menu"
          >
            <Flex
              align="center"
              gap="10px"
              p="10px"
              borderRadius="md"
              mb="4px"
            >
              <Avatar size="md" name={displayName} src={user?.avatarUrl} />
              <Box overflow="hidden" flex="1">
                <Text fontSize="sm" fontWeight="semibold" lineHeight="tight">
                  {displayName}
                </Text>
                <Text fontSize="xs" color="text.tertiary" truncate>
                  {user?.email ?? '—'}
                </Text>
              </Box>
            </Flex>
            <Box h="1px" bg="border.subtle" my="4px" />
            <Stack gap="2px">
              <MenuRow icon={<UserIcon size={14} />} label="Profile" onClick={() => { setOpen(false); navigate('/profile') }} />
              <Box h="1px" bg="border.subtle" my="4px" />
              <MenuRow
                icon={<LogOut size={14} />}
                label="Sign out"
                onClick={handleLogout}
                destructive
              />
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

function MenuRow({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <NativeButton
      type="button"
      onClick={onClick}
      role="menuitem"
      display="flex"
      alignItems="center"
      gap="10px"
      w="100%"
      h="34px"
      px="10px"
      bg="transparent"
      border="none"
      borderRadius="md"
      cursor="pointer"
      textAlign="left"
      fontFamily="body"
      fontSize="sm"
      fontWeight="medium"
      color={destructive ? 'error' : 'text.primary'}
      transition="background 120ms"
      _hover={{ bg: destructive ? 'rgba(244,63,94,0.08)' : 'bg.subtle' }}
    >
      <Box color={destructive ? 'error' : 'text.tertiary'} display="inline-flex">
        {icon}
      </Box>
      {label}
    </NativeButton>
  )
}
