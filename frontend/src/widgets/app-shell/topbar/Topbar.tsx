import { Flex, Box } from '@chakra-ui/react'
import { Menu } from 'lucide-react'
import { useAuthStore } from '@entities/user'
import { NativeButton } from '@shared/ui'
import { useShellStore } from '../useShellStore'
import { SearchInput } from './SearchInput'
import { StatsGroup } from './StatsGroup'
import { UserMenu } from './UserMenu'

export const TOPBAR_H = 64

export interface TopbarProps {
  streakDays: number
  xp: number
}

/**
 * Topbar uses a vertical gradient that fades canvas → transparent at the
 * bottom, with backdrop-blur for a frosted feel when content scrolls under it.
 * No hard border-bottom — the fade itself provides visual separation.
 */
export function Topbar({ streakDays, xp }: TopbarProps) {
  // Стрик и XP — студенческая геймификация; учителю не показываем
  const isTeacher = useAuthStore((s) => s.user?.role) === 'TEACHER'
  const openMobile = useShellStore((s) => s.setMobileOpen)
  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="4"
      h={`${TOPBAR_H}px`}
      backdropFilter="saturate(140%) blur(10px)"
      style={{
        background:
          'linear-gradient(to bottom, var(--se-colors-bg-canvas) 0%, var(--se-colors-bg-canvas) 60%, color-mix(in srgb, var(--se-colors-bg-canvas) 0%, transparent) 100%)',
      }}
    >
      <Flex h="100%" align="center" justify="space-between" gap={{ base: '8px', md: '16px' }} px={{ base: '16px', md: '24px' }}>
        <Flex align="center" gap="8px" flex="1" minW="0">
          <NativeButton
            type="button"
            onClick={() => openMobile(true)}
            aria-label="Open menu"
            display={{ base: 'flex', lg: 'none' }}
            alignItems="center"
            justifyContent="center"
            w="40px"
            h="40px"
            flexShrink={0}
            borderRadius="md"
            bg="transparent"
            border="none"
            color="text.secondary"
            cursor="pointer"
            _hover={{ bg: 'bg.subtle', color: 'text.primary' }}
          >
            <Menu size={20} />
          </NativeButton>
          <SearchInput />
        </Flex>
        <Flex align="center" gap="12px" flexShrink={0}>
          {!isTeacher && <StatsGroup streakDays={streakDays} xp={xp} />}
          <UserMenu />
        </Flex>
      </Flex>
    </Box>
  )
}
