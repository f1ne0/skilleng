import { Flex, Box } from '@chakra-ui/react'
import { useAuthStore } from '@entities/user'
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
      <Flex h="100%" align="center" justify="space-between" gap="16px" px={{ base: '16px', md: '24px' }}>
        <SearchInput />
        <Flex align="center" gap="12px">
          {!isTeacher && <StatsGroup streakDays={streakDays} xp={xp} />}
          <UserMenu />
        </Flex>
      </Flex>
    </Box>
  )
}
