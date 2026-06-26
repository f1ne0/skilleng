import { useState } from 'react'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Trophy, Crown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Card, Skeleton } from '@shared/ui'
import { gamificationApi, extractApiError } from '@shared/api'
import type { LeaderboardEntry, LeaderboardPeriod } from '@shared/api'
import { useAuthStore } from '@entities/user'
import { staggerContainer, fadeUp } from '@shared/motion'

export function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all')
  const currentUser = useAuthStore((s) => s.user)

  const query = useQuery({
    queryKey: ['gamification', 'leaderboard', period, currentUser?.id],
    queryFn: () => gamificationApi.leaderboard(period, 100, currentUser?.id),
  })

  const entries = query.data?.entries ?? []
  const me = query.data?.me ?? null

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="900px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              align={{ sm: 'center' }}
              justify="space-between"
              gap="14px"
              mb="28px"
            >
              <Stack gap="6px">
                <Heading
                  as="h1"
                  fontSize={{ base: '3xl', md: '4xl' }}
                  fontWeight="semibold"
                  letterSpacing="tight"
                  lineHeight="tight"
                >
                  Leaderboard
                </Heading>
                <Text fontSize="md" color="text.secondary">
                  Top learners by XP.
                </Text>
              </Stack>
              <PeriodToggle value={period} onChange={setPeriod} />
            </Flex>
          </motion.div>

          {query.isError && (
            <Card padding="comfortable">
              <Text fontSize="sm" color="error">{extractApiError(query.error)}</Text>
            </Card>
          )}

          {query.isLoading ? (
            <Stack gap="8px">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} h="56px" borderRadius="md" />
              ))}
            </Stack>
          ) : (
            <Card padding="tight">
              <Stack gap="0" maxH="64vh" overflowY="auto">
                {entries.map((entry, idx) => (
                  <Row
                    key={entry.userId}
                    entry={entry}
                    isFirst={idx === 0}
                    isMe={entry.userId === currentUser?.id}
                  />
                ))}
                {entries.length === 0 && (
                  <Box p="20px" textAlign="center">
                    <Text fontSize="sm" color="text.tertiary">
                      No entries yet — be the first.
                    </Text>
                  </Box>
                )}
              </Stack>

              {/* Я вне топа — закреплённая строка снизу */}
              {me && (
                <Box borderTop="2px solid" borderColor="border.default" mt="2px">
                  <Row entry={me} isFirst isMe />
                </Box>
              )}
            </Card>
          )}
        </motion.div>
      </Container>
    </Box>
  )
}

function PeriodToggle({
  value,
  onChange,
}: {
  value: LeaderboardPeriod
  onChange: (v: LeaderboardPeriod) => void
}) {
  return (
    <Flex
      bg="bg.subtle"
      borderRadius="md"
      p="2px"
      gap="0"
      border="1px solid"
      borderColor="border.subtle"
    >
      {(['all', 'week'] as const).map((p) => {
        const active = p === value
        return (
          <Box
            key={p}
            as="button"
            onClick={() => onChange(p)}
            px="14px"
            h="32px"
            display="inline-flex"
            alignItems="center"
            borderRadius="sm"
            bg={active ? 'bg.surface' : 'transparent'}
            color={active ? 'text.primary' : 'text.tertiary'}
            fontSize="sm"
            fontWeight="medium"
            cursor="pointer"
            transition="background 120ms, color 120ms"
            boxShadow={active ? '0 1px 2px rgba(15,23,42,0.06)' : 'none'}
          >
            {p === 'all' ? 'All time' : 'This week'}
          </Box>
        )
      })}
    </Flex>
  )
}

function Row({
  entry,
  isFirst,
  isMe,
}: {
  entry: LeaderboardEntry
  isFirst: boolean
  isMe: boolean
}) {
  const fullName = `${entry.firstName}${entry.lastName ? ` ${entry.lastName}` : ''}`
  const medal = entry.rank <= 3
  return (
    <Flex
      align="center"
      gap="14px"
      py="12px"
      px="12px"
      borderTop={isFirst ? 'none' : '1px solid'}
      borderColor="border.subtle"
      bg={isMe ? 'accent.surface' : 'transparent'}
      borderRadius={isMe ? 'md' : '0'}
    >
      <Box
        w="32px"
        flexShrink={0}
        textAlign="center"
        color={medal ? 'warning' : 'text.tertiary'}
        fontFamily="mono"
        fontSize="sm"
        fontWeight="semibold"
      >
        {entry.rank === 1 ? <Crown size={18} fill="currentColor" /> : `#${entry.rank}`}
      </Box>
      <Avatar size="sm" name={fullName} src={entry.avatarUrl} />
      <Box flex="1" minW="0">
        <Flex align="center" gap="8px">
          <Text fontSize="sm" fontWeight="medium" lineHeight="tight" truncate>
            {fullName}
          </Text>
          {isMe && (
            <Badge tone="accent" intensity="subtle" shape="pill">
              You
            </Badge>
          )}
        </Flex>
      </Box>
      <Flex align="center" gap="6px" color={medal ? 'warning' : 'accent.text'} flexShrink={0}>
        {medal && <Trophy size={14} fill="currentColor" />}
        <Text fontSize="md" fontWeight="semibold" fontFamily="mono">
          {entry.xp.toLocaleString()}
        </Text>
        <Text fontSize="xs" color="text.tertiary">XP</Text>
      </Flex>
    </Flex>
  )
}
