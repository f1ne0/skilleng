import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Box, Container, Flex, Heading, Stack, Text, SimpleGrid,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, Clock, Lock,
  Mic, Headphones, PenLine, Repeat, ListChecks, Sparkles, Users, Zap,
} from 'lucide-react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Button, Badge, Card, Link as RouterLink, Skeleton, showToast } from '@shared/ui'
import { coursesApi, lessonsApi, progressApi, examsApi, extractApiError } from '@shared/api'
import { staggerContainer, fadeUp } from '@shared/motion'
import type { Lesson, LessonKind } from '@entities/course'
import { CourseCover } from './components/CourseCover'
import { adaptCourseDetail } from '@entities/course'

const LESSON_KIND_LABEL: Record<LessonKind, string> = {
  theory:    'Theory',
  exercise:  'Exercise',
  speaking:  'Speaking',
  listening: 'Listening',
  review:    'Review',
}

const LESSON_KIND_ICON: Record<LessonKind, React.ReactNode> = {
  theory:    <BookOpen size={13} />,
  exercise:  <ListChecks size={13} />,
  speaking:  <Mic size={13} />,
  listening: <Headphones size={13} />,
  review:    <Repeat size={13} />,
}

const SKILL_LABEL: Record<NonNullable<Lesson['skill']>, string> = {
  READING:   'Reading',
  LISTENING: 'Listening',
  SPEAKING:  'Speaking',
  WRITING:   'Writing',
}

const SKILL_ICON: Record<NonNullable<Lesson['skill']>, React.ReactNode> = {
  READING:   <BookOpen size={13} />,
  LISTENING: <Headphones size={13} />,
  SPEAKING:  <Mic size={13} />,
  WRITING:   <PenLine size={13} />,
}

export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const courseQuery = useQuery({
    queryKey: ['courses', 'slug', slug],
    queryFn: () => coursesApi.bySlug(slug!),
    enabled: Boolean(slug),
  })

  const courseId = courseQuery.data?.id

  const lessonsQuery = useQuery({
    queryKey: ['lessons', 'byCourse', 'me', courseId],
    queryFn: () => lessonsApi.myByCourse(courseId!),
    enabled: Boolean(courseId),
  })

  const progressQuery = useQuery({
    queryKey: ['progress', 'course', courseId],
    queryFn: () => progressApi.byCourse(courseId!),
    enabled: Boolean(courseId),
    retry: false,
  })

  // Прогресс курса-предпосылки — для блокировки этого курса
  const prereqId = courseQuery.data?.prerequisiteCourseId ?? null
  const prereqProgressQuery = useQuery({
    queryKey: ['progress', 'course', prereqId],
    queryFn: () => progressApi.byCourse(prereqId!),
    enabled: Boolean(prereqId),
    retry: false,
  })

  const enrollMutation = useMutation({
    mutationFn: () => coursesApi.enroll(courseId!),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Enrolled' })
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['courses', 'my'] }),
        qc.invalidateQueries({ queryKey: ['lessons', 'byCourse', 'me', courseId] }),
        qc.invalidateQueries({ queryKey: ['progress', 'course', courseId] }),
      ])
    },
    onError: (err) => {
      showToast({ type: 'error', title: extractApiError(err) })
    },
  })

  if (courseQuery.isLoading) return <DetailSkeleton />
  if (courseQuery.isError && !courseQuery.isLoading) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="1100px" py="32px">
          <Card padding="comfortable">
            <Stack gap="6px">
              <Text fontSize="md" fontWeight="semibold">Couldn't load course</Text>
              <Text fontSize="sm" color="text.secondary">{extractApiError(courseQuery.error)}</Text>
              <Box mt="6px">
                <Button size="sm" onClick={() => courseQuery.refetch()}>Try again</Button>
              </Box>
            </Stack>
          </Card>
        </Container>
      </Box>
    )
  }
  if (!courseQuery.data) return <Navigate to="/courses" replace />

  const progressPercent = progressQuery.data?.lessonCompletionPercent
  const course = adaptCourseDetail(
    courseQuery.data,
    lessonsQuery.data ?? [],
    progressPercent,
  )

  const enrolled = typeof course.progress === 'number'
  const pct = enrolled ? Math.round((course.progress ?? 0) * 100) : 0
  const completed = enrolled && pct === 100
  const nextLesson = course.lessons.find((l) => l.id === course.nextLessonId)

  // Блокировка курса-предпосылки: закрыт, пока предпосылка не пройдена на 100%
  const prereqTitle = courseQuery.data?.prerequisiteTitle ?? null
  const prereqPercent = prereqProgressQuery.data?.lessonCompletionPercent
  const prereqLocked = Boolean(prereqId) && (prereqPercent ?? 0) < 100

  const handlePrimaryAction = () => {
    if (prereqLocked) return
    if (!enrolled) {
      enrollMutation.mutate()
      return
    }
    const target = nextLesson ?? course.lessons[0]
    if (target) navigate(`/courses/${course.slug}/lessons/${target.slug}`)
  }

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1100px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="20px">
          <RouterLink
            to="/courses"
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="sm"
            color="text.tertiary"
            textDecoration="none"
            _hover={{ color: 'text.primary' }}
          >
            <ArrowLeft size={14} />
            All courses
          </RouterLink>
        </Box>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Card variant="hero" padding="spacious" style={{ marginBottom: 24 }}>
              <Flex direction={{ base: 'column', md: 'row' }} gap="28px" align="stretch">
                <Box flexShrink={0} w={{ base: '100%', md: '320px' }}>
                  <CourseCover tone={course.tone} height="240px" radius="xl" glyph={course.level} />
                </Box>
                <Stack gap="16px" flex="1" justify="space-between" minW="0">
                  <Stack gap="12px">
                    <Flex gap="8px" wrap="wrap">
                      <Badge tone="accent" intensity="solid">{course.level}</Badge>
                      <Badge tone="neutral">{labelGoal(course.goal)}</Badge>
                      {completed && (
                        <Badge tone="success" intensity="solid">Completed</Badge>
                      )}
                    </Flex>
                    <Heading
                      as="h1"
                      fontSize={{ base: '2xl', md: '3xl' }}
                      fontWeight="semibold"
                      letterSpacing="tight"
                      lineHeight="tight"
                    >
                      {course.title}
                    </Heading>
                    <Text fontSize="md" color="text.secondary" lineHeight="relaxed">
                      {course.longDescription ?? course.description}
                    </Text>
                    <Flex gap="6px" wrap="wrap">
                      {course.topics.map((t) => (
                        <Badge key={t} tone="neutral" shape="pill">
                          {t}
                        </Badge>
                      ))}
                    </Flex>
                  </Stack>

                  <Stack gap="12px">
                    {prereqLocked ? (
                      <Flex
                        align="center"
                        gap="10px"
                        p="12px 14px"
                        borderRadius="lg"
                        bg={{ base: 'rgba(245,158,11,0.10)', _dark: 'rgba(245,158,11,0.14)' }}
                        border="1px solid"
                        borderColor="rgba(245,158,11,0.40)"
                      >
                        <Box color="warning" flexShrink={0}><Lock size={16} /></Box>
                        <Text fontSize="sm" color="text.secondary">
                          Locked — complete{' '}
                          <Text as="span" fontWeight="semibold" color="text.primary">
                            {prereqTitle ?? 'the previous course'}
                          </Text>{' '}
                          to unlock this course.
                        </Text>
                      </Flex>
                    ) : (
                      <>
                        {enrolled && !completed && (
                          <Box>
                            <Flex justify="space-between" mb="6px">
                              <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
                                Your progress
                              </Text>
                              <Text fontSize="xs" color="accent.text" fontWeight="semibold" fontFamily="mono">
                                {pct}%
                              </Text>
                            </Flex>
                            <Box h="4px" w="100%" bg="bg.muted" borderRadius="full" overflow="hidden">
                              <Box
                                h="100%" w={`${pct}%`}
                                background="linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))"
                                borderRadius="full"
                              />
                            </Box>
                          </Box>
                        )}
                        <Flex gap="10px" wrap="wrap" align="center">
                          <Button
                            size="lg"
                            rightIcon={<ArrowRight size={16} />}
                            onClick={handlePrimaryAction}
                            loading={enrollMutation.isPending}
                          >
                            {completed
                              ? 'Review course'
                              : enrolled
                                ? 'Continue lesson'
                                : 'Enroll & start'}
                          </Button>
                        </Flex>
                      </>
                    )}
                  </Stack>
                </Stack>
              </Flex>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px" mb="32px">
              <StatTile icon={<BookOpen size={14} />} label="Lessons" value={`${course.totalLessons}`} />
              <StatTile icon={<Clock size={14} />} label="Duration" value={`${Math.round(course.totalMinutes / 60) || 1}h`} />
              <StatTile
                icon={<Zap size={14} fill="currentColor" />}
                label="Total XP"
                value={formatCount(course.totalLessons * 20)}
              />
              <StatTile icon={<Users size={14} />} label="Learners" value={formatCount(course.enrolledCount)} />
            </SimpleGrid>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Stack gap="14px">
              <Flex justify="space-between" align="center">
                <Heading as="h2" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
                  Lessons
                </Heading>
                <Text fontSize="xs" color="text.tertiary">
                  {course.lessons.filter((l) => l.completed).length} / {course.totalLessons} done
                </Text>
              </Flex>

              {lessonsQuery.isLoading ? (
                <Stack gap="10px">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} h="56px" borderRadius="md" />
                  ))}
                </Stack>
              ) : (
                <Card padding="tight">
                  <Stack gap="0">
                    {course.lessons.map((lesson, idx) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={prereqLocked ? { ...lesson, locked: true, completed: false } : lesson}
                        isFirst={idx === 0}
                        onOpen={() => {
                          if (prereqLocked || lesson.locked) return
                          navigate(`/courses/${course.slug}/lessons/${lesson.slug}`)
                        }}
                      />
                    ))}
                  </Stack>
                </Card>
              )}
            </Stack>
          </motion.div>

          <motion.div variants={fadeUp}>
            <ExamsSection courseId={course.id} />
          </motion.div>

          <Box h="48px" />
        </motion.div>
      </Container>
    </Box>
  )
}

function ExamsSection({ courseId }: { courseId: string }) {
  const navigate = useNavigate()
  const examsQuery = useQuery({
    queryKey: ['exams', 'course', courseId],
    queryFn: () => examsApi.listForCourse(courseId),
  })

  const exams = examsQuery.data ?? []
  if (exams.length === 0) return null

  return (
    <Stack gap="14px" mt="32px">
      <Heading as="h2" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
        Exams & checkpoints
      </Heading>
      <Card padding="tight">
        <Stack gap="0">
          {exams.map((exam, idx) => {
            const locked = exam.isLocked ?? false
            const ready = exam.questionCount > 0 && !locked
            const best = exam.bestAttempt
            const remaining = exam.lessonsRemaining ?? 0
            let meta: string
            if (locked) {
              meta = remaining > 0
                ? `Locked · finish ${remaining} more related ${remaining === 1 ? 'unit' : 'units'} to unlock`
                : 'Locked · complete the related units to unlock'
            } else if (exam.questionCount > 0) {
              meta = `${exam.questionCount} questions · pass ${exam.passingScore}%`
            } else {
              meta = 'Not available yet'
            }
            return (
              <Flex key={exam.id} align="center" justify="space-between" gap="12px"
                px="16px" py="14px" borderTop={idx === 0 ? undefined : '1px solid'}
                borderColor="border.subtle" opacity={locked ? 0.6 : 1}>
                <Stack gap="2px" minW="0">
                  <Flex align="center" gap="8px" wrap="wrap">
                    {locked && <Box color="text.tertiary"><Lock size={13} /></Box>}
                    <Text fontSize="sm" fontWeight="medium">{exam.title}</Text>
                    <Badge tone={exam.type === 'FINAL' ? 'accent' : 'neutral'} shape="pill">
                      {exam.type === 'FINAL' ? 'Final' : 'Checkpoint'}
                    </Badge>
                  </Flex>
                  <Text fontSize="xs" color="text.tertiary">
                    {meta}
                    {best?.score != null ? ` · best ${best.score}%` : ''}
                  </Text>
                </Stack>
                <Flex align="center" gap="8px" flexShrink={0}>
                  {best?.passed && <Badge tone="success" shape="pill">Passed</Badge>}
                  <Button size="sm" variant={best ? 'secondary' : 'primary'} disabled={!ready}
                    onClick={() => navigate(`/exam/${exam.id}`)}>
                    {best ? 'Retake' : 'Start'}
                  </Button>
                </Flex>
              </Flex>
            )
          })}
        </Stack>
      </Card>
    </Stack>
  )
}

function DetailSkeleton() {
  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1100px" py="32px">
        <Stack gap="20px">
          <Skeleton h="280px" borderRadius="xl" />
          <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} h="64px" borderRadius="md" />
            ))}
          </SimpleGrid>
          <Stack gap="10px">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} h="56px" borderRadius="md" />
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card padding="tight">
      <Flex align="center" gap="10px">
        <Box
          w="32px"
          h="32px"
          borderRadius="md"
          bg="bg.subtle"
          color="accent.text"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          {icon}
        </Box>
        <Box minW="0">
          <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
            {label}
          </Text>
          <Text fontSize="md" fontWeight="semibold" lineHeight="tight" fontFamily="mono">
            {value}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}

function LessonRow({
  lesson, isFirst, onOpen,
}: {
  lesson: Lesson
  isFirst: boolean
  onOpen: () => void
}) {
  const inProgress = !lesson.completed && lesson.progressPct > 0
  const interactive = !lesson.locked

  let statusIcon: React.ReactNode
  if (lesson.locked) statusIcon = <Lock size={14} />
  else if (lesson.completed) statusIcon = <CheckCircle2 size={16} fill="currentColor" />
  else if (inProgress) statusIcon = <Sparkles size={14} />
  else statusIcon = <Circle size={14} />

  const statusColor = lesson.locked
    ? 'text.tertiary'
    : lesson.completed
      ? 'accent.solid'
      : inProgress
        ? 'accent.text'
        : 'text.tertiary'

  return (
    <Flex
      align="center"
      gap="14px"
      py="12px"
      px="6px"
      borderTop={isFirst ? 'none' : '1px solid'}
      borderColor="border.subtle"
      cursor={interactive ? 'pointer' : 'not-allowed'}
      opacity={lesson.locked ? 0.6 : 1}
      borderRadius="md"
      transition="background 120ms"
      _hover={interactive ? { bg: 'bg.subtle' } : undefined}
      onClick={onOpen}
      role="button"
      tabIndex={interactive ? 0 : -1}
    >
      <Box color={statusColor} display="flex" alignItems="center" justifyContent="center" w="20px" flexShrink={0}>
        {statusIcon}
      </Box>
      <Text fontSize="sm" color="text.tertiary" fontFamily="mono" w="28px" flexShrink={0}>
        {String(lesson.index).padStart(2, '0')}
      </Text>
      <Box flex="1" minW="0">
        <Text fontSize="sm" fontWeight="medium" lineHeight="tight" truncate>
          {lesson.title}
        </Text>
        {lockedByDate(lesson) ? (
          <Flex gap="6px" mt="2px" color="text.tertiary" fontSize="xs" align="center">
            <Lock size={11} />
            <span>Opens {formatOpenDate(lesson.availableFrom!)}</span>
          </Flex>
        ) : (
        <Flex gap="10px" mt="2px" color="text.tertiary" fontSize="xs" align="center">
          <Flex align="center" gap="4px">
            {lesson.skill ? SKILL_ICON[lesson.skill] : LESSON_KIND_ICON[lesson.kind]}
            <span>{lesson.skill ? SKILL_LABEL[lesson.skill] : LESSON_KIND_LABEL[lesson.kind]}</span>
          </Flex>
          <Text>·</Text>
          <Flex align="center" gap="4px">
            <Clock size={11} />
            <span>{lesson.durationMin} min</span>
          </Flex>
          <Text>·</Text>
          <Flex align="center" gap="4px" color="accent.text" fontWeight="medium">
            <Zap size={11} fill="currentColor" />
            <span>+{lesson.xpReward} XP</span>
          </Flex>
        </Flex>
        )}
      </Box>
      {inProgress && (
        <Box flexShrink={0} display={{ base: 'none', md: 'block' }}>
          <Box w="80px" h="3px" bg="bg.muted" borderRadius="full" overflow="hidden">
            <Box
              h="100%"
              w={`${lesson.progressPct}%`}
              background="linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))"
              borderRadius="full"
            />
          </Box>
        </Box>
      )}
      {!lesson.locked && (
        <Box color="text.tertiary" flexShrink={0}>
          <ArrowRight size={14} />
        </Box>
      )}
    </Flex>
  )
}

function lockedByDate(lesson: Lesson): boolean {
  if (!lesson.availableFrom) return false
  return new Date(lesson.availableFrom).getTime() > Date.now()
}

function formatOpenDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function labelGoal(g: string | null | undefined): string {
  switch (g) {
    case 'TRAVEL':    return 'Travel'
    case 'BUSINESS':  return 'Business'
    case 'ACADEMIC':  return 'Academic'
    case 'DAILY':     return 'Daily'
    case 'EXAM_PREP': return 'Exam prep'
    default:          return '—'
  }
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n.toLocaleString()
}
