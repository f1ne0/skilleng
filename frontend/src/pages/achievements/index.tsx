import { Box, Container, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Trophy, Lock, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Card, Skeleton } from '@shared/ui'
import { gamificationApi, extractApiError } from '@shared/api'
import type { AchievementWithStatus } from '@shared/api'
import { staggerContainer, fadeUp } from '@shared/motion'

export function AchievementsPage() {
  const summaryQuery = useQuery({
    queryKey: ['gamification', 'me'],
    queryFn: gamificationApi.me,
  })
  const listQuery = useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: gamificationApi.achievements,
  })

  const unlockedCount = listQuery.data?.filter((a) => a.unlocked).length ?? 0
  const total = listQuery.data?.length ?? 0

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1100px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Stack gap="6px" mb="28px">
              <Heading
                as="h1"
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="tight"
              >
                Achievements
              </Heading>
              <Text fontSize="md" color="text.secondary">
                {listQuery.isLoading
                  ? 'Loading…'
                  : `${unlockedCount} of ${total} unlocked.`}
              </Text>
            </Stack>
          </motion.div>

          {summaryQuery.data && (
            <motion.div variants={fadeUp}>
              <Card padding="comfortable" style={{ marginBottom: 24 }}>
                <Flex
                  gap="20px"
                  justify="space-around"
                  align="center"
                  wrap="wrap"
                >
                  <Stat
                    label="Total XP"
                    value={summaryQuery.data.totalXp.toLocaleString()}
                    tone="accent.text"
                  />
                  <Box w="1px" h="36px" bg="border.subtle" />
                  <Stat
                    label="Level"
                    value={`${summaryQuery.data.level.level}`}
                    tone="accent.text"
                  />
                  <Box w="1px" h="36px" bg="border.subtle" />
                  <Stat
                    label="Current streak"
                    value={`${summaryQuery.data.streak.current} d`}
                    tone="warning"
                  />
                </Flex>
              </Card>
            </motion.div>
          )}

          {listQuery.isError && (
            <Card padding="comfortable">
              <Text fontSize="sm" color="error">
                {extractApiError(listQuery.error)}
              </Text>
            </Card>
          )}

          {listQuery.isLoading ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="14px">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} h="120px" borderRadius="lg" />
              ))}
            </SimpleGrid>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="14px">
              {[...(listQuery.data ?? [])]
                .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
                .map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
            </SimpleGrid>
          )}
        </motion.div>
      </Container>
    </Box>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Stack gap="2px" align="center" minW="100px">
      <Text fontSize="xl" fontWeight="semibold" fontFamily="mono" color={tone} lineHeight="none">
        {value}
      </Text>
      <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
        {label}
      </Text>
    </Stack>
  )
}

function AchievementCard({ achievement }: { achievement: AchievementWithStatus }) {
  const { name, description, unlocked, progress } = achievement
  const pct = progress.target > 0
    ? Math.min(100, Math.round((progress.current / progress.target) * 100))
    : 0
  return (
    <Card padding="comfortable" style={{ opacity: unlocked ? 1 : 0.85 }}>
      <Flex gap="14px" align="flex-start">
        <Box
          w="40px"
          h="40px"
          borderRadius="md"
          bg={unlocked ? 'accent.surface' : 'bg.subtle'}
          color={unlocked ? 'accent.text' : 'text.tertiary'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          {unlocked ? <Trophy size={18} /> : <Lock size={16} />}
        </Box>
        <Stack gap="4px" flex="1" minW="0">
          <Flex align="center" justify="space-between" gap="8px">
            <Text fontSize="sm" fontWeight="semibold" lineHeight="tight" truncate>
              {name}
            </Text>
            {unlocked && (
              <Badge tone="success" intensity="subtle" shape="pill" leftIcon={<CheckCircle2 size={11} />}>
                Unlocked
              </Badge>
            )}
          </Flex>
          <Text fontSize="sm" color="text.secondary" lineHeight="normal">
            {description}
          </Text>
          {!unlocked && progress.target > 1 && (
            <Box mt="6px">
              <Flex justify="space-between" mb="4px">
                <Text fontSize="xs" color="text.tertiary" fontVariantNumeric="tabular-nums">
                  {progress.current.toLocaleString()} / {progress.target.toLocaleString()}
                </Text>
                <Text fontSize="xs" color="text.tertiary">{pct}%</Text>
              </Flex>
              <Box h="4px" w="100%" bg="bg.muted" borderRadius="full" overflow="hidden">
                <Box h="100%" w={`${Math.max(2, pct)}%`} bg="accent.solid" borderRadius="full" />
              </Box>
            </Box>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}
