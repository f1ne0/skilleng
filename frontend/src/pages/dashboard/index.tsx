import { Box, Container, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@entities/user'
import { staggerContainer, fadeUp } from '@shared/motion'
import {
  coursesApi,
  gamificationApi,
  extractApiError,
} from '@shared/api'
import { Card, Button, Skeleton } from '@shared/ui'
import { SrsDueCard } from '@widgets/srs-due-card'
import { SkillNav } from '@widgets/skill-nav'
import { ProgressOverview } from '@widgets/progress-overview'
import { StatsRow } from './StatsRow'
import { ContinueLearning } from './ContinueLearning'
import { DailyGoal } from './DailyGoal'
import { RecommendedCourses } from './RecommendedCourses'
import {
  adaptGamificationToStats,
  adaptRecommendedCourses,
  pickContinueLesson,
} from './adapter'

const DAILY_GOAL_XP = 50

function greet(): string {
  const h = new Date().getHours()
  if (h < 5)  return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const firstName = user?.firstName ?? 'there'
  const today = format(new Date(), 'EEEE, d MMMM')

  const gamificationQuery = useQuery({
    queryKey: ['gamification', 'me'],
    queryFn: gamificationApi.me,
  })

  const myCoursesQuery = useQuery({
    queryKey: ['courses', 'my'],
    queryFn: coursesApi.my,
  })

  const catalogQuery = useQuery({
    queryKey: ['courses', 'list', 'dashboard'],
    queryFn: () => coursesApi.list({ limit: 12 }),
  })

  const stats = gamificationQuery.data
    ? adaptGamificationToStats(gamificationQuery.data, user, DAILY_GOAL_XP)
    : null

  const continueLesson = myCoursesQuery.data
    ? pickContinueLesson(myCoursesQuery.data)
    : null

  const enrolledIds = new Set(myCoursesQuery.data?.map((c) => c.id) ?? [])
  const recommended = catalogQuery.data
    ? adaptRecommendedCourses(catalogQuery.data.items, enrolledIds, user, 3)
    : []

  const anyLoading =
    gamificationQuery.isLoading ||
    myCoursesQuery.isLoading ||
    catalogQuery.isLoading

  const fatalError = gamificationQuery.error ?? catalogQuery.error

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1280px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Stack gap="6px" mb="32px">
              <Heading
                as="h1"
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="tight"
              >
                {greet()}, {firstName}
              </Heading>
              <Text fontSize="md" color="text.secondary">
                {today} — keep the streak alive.
              </Text>
            </Stack>
          </motion.div>

          {fatalError && (
            <Card padding="comfortable">
              <Stack gap="6px">
                <Text fontSize="md" fontWeight="semibold">Couldn't load your dashboard</Text>
                <Text fontSize="sm" color="text.secondary">{extractApiError(fatalError)}</Text>
                <Box mt="6px">
                  <Button
                    size="sm"
                    onClick={() => {
                      void gamificationQuery.refetch()
                      void myCoursesQuery.refetch()
                      void catalogQuery.refetch()
                    }}
                  >
                    Try again
                  </Button>
                </Box>
              </Stack>
            </Card>
          )}

          {!fatalError && (
            <>
              <motion.div variants={fadeUp}>
                <Box mb="20px">
                  {stats ? (
                    <StatsRow stats={stats} />
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap="14px">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} h="140px" borderRadius="lg" />
                      ))}
                    </SimpleGrid>
                  )}
                </Box>
              </motion.div>

              <motion.div variants={fadeUp}>
                <SimpleGrid columns={{ base: 1, lg: 3 }} gap="20px" mb="20px">
                  <Box gridColumn={{ lg: 'span 2' }}>
                    {continueLesson ? (
                      <ContinueLearning lesson={continueLesson} />
                    ) : myCoursesQuery.isLoading ? (
                      <Skeleton h="240px" borderRadius="xl" />
                    ) : (
                      <EmptyEnrollmentCard onBrowse={() => navigate('/courses')} />
                    )}
                  </Box>
                  <DailyGoal
                    goal={stats?.dailyGoal ?? DAILY_GOAL_XP}
                    earned={stats?.dailyEarned ?? 0}
                  />
                </SimpleGrid>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Box mb="20px">
                  <SkillNav />
                </Box>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Box mb="20px">
                  <SrsDueCard />
                </Box>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Box mb="32px">
                  <ProgressOverview />
                </Box>
              </motion.div>

              <motion.div variants={fadeUp}>
                {catalogQuery.isLoading ? (
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap="16px">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} h="200px" borderRadius="lg" />
                    ))}
                  </SimpleGrid>
                ) : (
                  <RecommendedCourses courses={recommended} />
                )}
              </motion.div>
            </>
          )}

          <Box h="48px" />
        </motion.div>
      </Container>
      {anyLoading && !stats && <Box position="fixed" top="0" left="0" h="2px" bg="accent.solid" />}
    </Box>
  )
}

function EmptyEnrollmentCard({ onBrowse }: { onBrowse: () => void }) {
  return (
    <Card padding="spacious" style={{ height: '100%' }}>
      <Stack gap="8px" align="center" textAlign="center" py="20px">
        <Text fontSize="md" fontWeight="semibold">No active course yet</Text>
        <Text fontSize="sm" color="text.secondary">
          Browse the catalog and enroll in something — that's where the streak starts.
        </Text>
        <Box mt="8px">
          <Button size="sm" onClick={onBrowse}>
            Browse courses
          </Button>
        </Box>
      </Stack>
    </Card>
  )
}
