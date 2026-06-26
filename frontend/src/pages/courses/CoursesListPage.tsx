import { useMemo, useState } from 'react'
import {
  Box, Container, Flex, Heading, SimpleGrid, Stack, Text,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Search, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Input, Skeleton } from '@shared/ui'
import { coursesApi, extractApiError } from '@shared/api'
import { staggerContainer, fadeUp } from '@shared/motion'
import { useAuthStore } from '@entities/user'
import type { CefrLevel, LearningGoal } from '@entities/user'
import type { Course } from '@entities/course'
import { CourseCard } from './components/CourseCard'
import { FilterChips, type FilterOption } from './components/FilterChips'
import { adaptCourseSummary } from '@entities/course'

type LevelFilter = 'ALL' | CefrLevel
type GoalFilter = 'ALL' | LearningGoal
type StatusFilter = 'ALL' | 'IN_PROGRESS' | 'NOT_STARTED' | 'COMPLETED'

const LEVEL_OPTIONS: FilterOption<LevelFilter>[] = [
  { value: 'ALL', label: 'All levels' },
  { value: 'A1', label: 'A1' }, { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' }, { value: 'B2', label: 'B2' },
  { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' },
]

const GOAL_OPTIONS: FilterOption<GoalFilter>[] = [
  { value: 'ALL',       label: 'Any goal' },
  { value: 'TRAVEL',    label: 'Travel' },
  { value: 'BUSINESS',  label: 'Business' },
  { value: 'ACADEMIC',  label: 'Academic' },
  { value: 'DAILY',     label: 'Daily' },
  { value: 'EXAM_PREP', label: 'Exam prep' },
]

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: 'ALL',         label: 'All' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'COMPLETED',   label: 'Completed' },
]

function matches(c: Course, level: LevelFilter, goal: GoalFilter, status: StatusFilter, q: string) {
  if (level !== 'ALL' && c.level !== level) return false
  if (goal !== 'ALL' && c.goal !== goal) return false
  if (status !== 'ALL') {
    const p = c.progress
    if (status === 'IN_PROGRESS' && !(p !== undefined && p > 0 && p < 1)) return false
    if (status === 'NOT_STARTED' && !(p === undefined || p === 0)) return false
    if (status === 'COMPLETED'   && p !== 1) return false
  }
  if (q) {
    const ql = q.toLowerCase()
    const haystack = `${c.title} ${c.description} ${c.topics.join(' ')}`.toLowerCase()
    if (!haystack.includes(ql)) return false
  }
  return true
}

export function CoursesListPage() {
  const user = useAuthStore((s) => s.user)

  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<LevelFilter>('ALL')
  const [goal, setGoal] = useState<GoalFilter>('ALL')
  const [status, setStatus] = useState<StatusFilter>('ALL')

  const listQuery = useQuery({
    queryKey: ['courses', 'list', { level: level === 'ALL' ? undefined : level }],
    queryFn: () =>
      coursesApi.list({ level: level === 'ALL' ? undefined : level, limit: 50 }),
  })

  const myQuery = useQuery({
    queryKey: ['courses', 'my'],
    queryFn: coursesApi.my,
    enabled: Boolean(user),
  })

  const enrolledIds = useMemo(
    () => new Set(myQuery.data?.map((c) => c.id) ?? []),
    [myQuery.data],
  )

  // прогресс по записанным курсам (0–1) для карточек
  const progressById = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of myQuery.data ?? []) {
      if (typeof c.progressPercent === 'number') map.set(c.id, c.progressPercent / 100)
    }
    return map
  }, [myQuery.data])

  // заблокированные курсы (предпосылка не пройдена) — из «моих курсов»
  const lockedIds = useMemo(() => {
    const set = new Set<string>()
    for (const c of myQuery.data ?? []) {
      if (c.locked) set.add(c.id)
    }
    return set
  }, [myQuery.data])

  const courses: Course[] = useMemo(
    () =>
      (listQuery.data?.items ?? [])
        .map((c) =>
          adaptCourseSummary(c, {
            enrolledCourseIds: enrolledIds,
            progressById,
            lockedCourseIds: lockedIds,
          }),
        )
        // English for IT — первым и по порядку (Semester 1 → 2), остальные после
        .sort((a, b) => {
          const ap = a.slug.startsWith('english-for-it') ? 0 : 1
          const bp = b.slug.startsWith('english-for-it') ? 0 : 1
          if (ap !== bp) return ap - bp
          if (ap === 0) return a.slug.localeCompare(b.slug)
          return a.title.localeCompare(b.title)
        }),
    [listQuery.data, enrolledIds, progressById, lockedIds],
  )

  const total = listQuery.data?.total ?? courses.length

  const filtered = useMemo(
    () => courses.filter((c) => matches(c, level, goal, status, query)),
    [courses, level, goal, status, query],
  )

  const filtersActive = level !== 'ALL' || goal !== 'ALL' || status !== 'ALL' || query.length > 0

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1280px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Stack gap="6px" mb="14px">
              <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight" lineHeight="tight">
                Courses
              </Heading>
              <Text fontSize="md" color="text.secondary">
                {listQuery.isLoading ? 'Loading courses…' : `${total} ${total === 1 ? 'course' : 'courses'} available.`}
              </Text>
            </Stack>
          </motion.div>

          {listQuery.isError && (
            <motion.div variants={fadeUp}>
              <Card padding="comfortable">
                <Stack gap="6px">
                  <Text fontSize="md" fontWeight="semibold">Couldn't load courses</Text>
                  <Text fontSize="sm" color="text.secondary">{extractApiError(listQuery.error)}</Text>
                  <Box mt="6px">
                    <Button size="sm" onClick={() => listQuery.refetch()}>Try again</Button>
                  </Box>
                </Stack>
              </Card>
            </motion.div>
          )}

          {listQuery.isLoading && <CoursesListSkeleton />}

          {!listQuery.isLoading && !listQuery.isError && (
            <>
              <motion.div variants={fadeUp}>
                <Stack gap="12px">
                  <Flex align="center" justify={filtersActive ? 'space-between' : 'flex-end'} gap="12px" wrap="wrap">
                    {filtersActive && (
                      <Text fontSize="sm" color="text.tertiary">
                        {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                      </Text>
                    )}
                    <Box w={{ base: '100%', md: '360px' }}>
                      <Input
                        placeholder="Search by title or topic…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        leftIcon={<Search size={14} />}
                      />
                    </Box>
                  </Flex>

                  <Stack gap="10px">
                    <FilterChips label="Level" options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
                    <FilterChips label="Goal" options={GOAL_OPTIONS} value={goal} onChange={setGoal} />
                    <FilterChips label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
                  </Stack>

                  {filtered.length === 0 ? (
                    <Card padding="spacious">
                      <Stack gap="6px" align="center" textAlign="center" py="20px">
                        <Box color="text.tertiary"><Sparkles size={20} /></Box>
                        <Text fontSize="md" fontWeight="semibold">Nothing matches yet</Text>
                        <Text fontSize="sm" color="text.secondary">
                          Loosen the filters or change the search term.
                        </Text>
                        <Box mt="8px">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setQuery(''); setLevel('ALL'); setGoal('ALL'); setStatus('ALL')
                            }}
                          >
                            Reset filters
                          </Button>
                        </Box>
                      </Stack>
                    </Card>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="16px">
                      {filtered.map((c) => (
                        <CourseCard key={c.id} course={c} />
                      ))}
                    </SimpleGrid>
                  )}
                </Stack>
              </motion.div>
            </>
          )}

          <Box h="48px" />
        </motion.div>
      </Container>
    </Box>
  )
}

function CoursesListSkeleton() {
  return (
    <Stack gap="20px">
      <Skeleton h="240px" borderRadius="xl" />
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="16px">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} h="220px" borderRadius="lg" />
        ))}
      </SimpleGrid>
    </Stack>
  )
}

