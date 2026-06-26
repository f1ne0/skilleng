import { Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Container, Flex, Heading, SimpleGrid, Stack, Text,
} from '@chakra-ui/react'
import { ArrowLeft, Flame, Trophy, Target, BookCheck } from 'lucide-react'
import { format, isValid } from 'date-fns'
import {
  Avatar, Badge, Card, Link as RouterLink, Skeleton,
} from '@shared/ui'
import { groupsApi, extractApiError } from '@shared/api'

function safeFormat(input: string | null, pattern: string): string | null {
  if (!input) return null
  const d = new Date(input)
  return isValid(d) ? format(d, pattern) : null
}

export function TeachStudentDetailPage() {
  const { id: groupId, userId } = useParams<{ id: string; userId: string }>()

  const query = useQuery({
    queryKey: ['groups', 'studentDetail', groupId, userId],
    queryFn: () => groupsApi.studentDetail(groupId!, userId!),
    enabled: Boolean(groupId && userId),
  })

  if (query.isLoading) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="900px" py="32px">
          <Skeleton h="320px" borderRadius="lg" />
        </Container>
      </Box>
    )
  }
  if (query.isError) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="900px" py="32px">
          <Card padding="comfortable">
            <Text fontSize="sm" color="error">{extractApiError(query.error)}</Text>
          </Card>
        </Container>
      </Box>
    )
  }
  if (!query.data) return <Navigate to={`/teach/groups/${groupId}`} replace />

  const s = query.data
  const fullName = `${s.firstName ?? ''}${s.lastName ? ` ${s.lastName}` : ''}`.trim() || 'Student'
  const courses = s.courses ?? []
  const interests = s.interests ?? []

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="900px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink
            to={`/teach/groups/${groupId}`}
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="sm"
            color="text.tertiary"
            textDecoration="none"
            _hover={{ color: 'text.primary' }}
          >
            <ArrowLeft size={14} />
            Group
          </RouterLink>
        </Box>

        <Card variant="hero" padding="spacious" style={{ marginBottom: 24 }}>
          <Flex gap="20px" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
            <Avatar size="xl" name={fullName} src={s.avatarUrl} ring />
            <Stack gap="10px" flex="1" minW="0">
              <Heading
                as="h1"
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="tight"
              >
                {fullName}
              </Heading>
              <Flex gap="8px" wrap="wrap">
                {s.level && (
                  <Badge tone="accent" intensity="solid" shape="pill" leftIcon={<Trophy size={11} />}>
                    {s.level}
                  </Badge>
                )}
                {s.goal && (
                  <Badge tone="neutral" shape="pill">{s.goal.replace('_', ' ').toLowerCase()}</Badge>
                )}
                {s.nativeLanguage && (
                  <Badge tone="neutral" shape="pill">Native: {s.nativeLanguage}</Badge>
                )}
              </Flex>
              {interests.length > 0 && (
                <Flex gap="6px" wrap="wrap">
                  {interests.map((i) => (
                    <Badge key={i} tone="neutral" shape="pill">{i}</Badge>
                  ))}
                </Flex>
              )}
              <Text fontSize="xs" color="text.tertiary">
                {safeFormat(s.createdAt, 'MMMM yyyy') && `Joined SkillEng ${safeFormat(s.createdAt, 'MMMM yyyy')}`}
                {safeFormat(s.lastActiveDate, 'd MMM') && ` · last active ${safeFormat(s.lastActiveDate, 'd MMM')}`}
              </Text>
            </Stack>
          </Flex>
        </Card>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap="14px" mb="24px">
          <StatTile label="Accuracy" value={`${s.accuracyPercent ?? 0}%`} tone="accent.text" icon={<Target size={14} />} />
          <StatTile label="Lessons done" value={`${s.completedLessons ?? 0}`} tone="text.primary" icon={<BookCheck size={14} />} />
          <StatTile label="Streak" value={`${s.currentStreak ?? 0} d`} tone="warning" icon={<Flame size={14} />} />
        </SimpleGrid>

        <Stack gap="14px">
          <Heading as="h2" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
            Courses
          </Heading>
          {courses.length === 0 ? (
            <Card padding="comfortable">
              <Text fontSize="sm" color="text.tertiary" textAlign="center" py="14px">
                Not enrolled in any courses yet.
              </Text>
            </Card>
          ) : (
            <Card padding="tight">
              <Stack gap="0">
                {courses.map((c, idx) => (
                  <Flex
                    key={c.courseId}
                    align="center"
                    gap="12px"
                    py="12px"
                    px="12px"
                    borderTop={idx === 0 ? 'none' : '1px solid'}
                    borderColor="border.subtle"
                  >
                    <Stack gap="2px" flex="1" minW="0">
                      <Text fontSize="sm" fontWeight="medium" lineHeight="tight" truncate>
                        {c.courseTitle}
                      </Text>
                      {c.lastActivity && (
                        <Text fontSize="xs" color="text.tertiary">
                          Last activity {safeFormat(c.lastActivity, 'd MMM, HH:mm')}
                        </Text>
                      )}
                    </Stack>
                    <Flex align="center" gap="10px" flexShrink={0}>
                      <Box w="100px" h="4px" bg="bg.muted" borderRadius="full" overflow="hidden">
                        <Box
                          h="100%"
                          w={`${c.completionPercent}%`}
                          background="linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))"
                          borderRadius="full"
                        />
                      </Box>
                      <Text fontSize="xs" fontFamily="mono" color="accent.text" w="36px" textAlign="right">
                        {c.completionPercent}%
                      </Text>
                    </Flex>
                  </Flex>
                ))}
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

function StatTile({
  label, value, tone, icon,
}: {
  label: string
  value: string
  tone: string
  icon?: React.ReactNode
}) {
  return (
    <Card padding="comfortable">
      <Stack gap="8px">
        <Flex justify="space-between" align="center">
          <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
            {label}
          </Text>
          {icon && <Box color={tone}>{icon}</Box>}
        </Flex>
        <Text fontSize="2xl" fontWeight="semibold" lineHeight="none" fontFamily="mono" color={tone}>
          {value}
        </Text>
      </Stack>
    </Card>
  )
}
