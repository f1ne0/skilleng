import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Box,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { BookOpen, Headphones, Mic, PenLine, type LucideIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { coursesApi, topicsApi, extractApiError } from '@shared/api'
import type { CourseCategory, CourseSummary } from '@shared/api'
import type { SkillType } from '@shared/model'
import { Badge, Button, Card, Skeleton } from '@shared/ui'
import { staggerContainer, fadeUp } from '@shared/motion'

interface SkillMeta {
  title: string
  description: string
  Icon: LucideIcon
  /** Категории курсов, тренирующие этот навык */
  categories: CourseCategory[]
}

const SKILLS: Record<SkillType, SkillMeta> = {
  READING: {
    title: 'Reading',
    description:
      'Receptive skill: understanding written texts — from short messages to articles. Build vocabulary and comprehension speed.',
    Icon: BookOpen,
    categories: ['READING', 'GRAMMAR', 'VOCABULARY'],
  },
  LISTENING: {
    title: 'Listening',
    description:
      'Receptive skill: understanding spoken English — dialogues, monologues, natural speech at your level.',
    Icon: Headphones,
    categories: ['LISTENING', 'PRONUNCIATION'],
  },
  SPEAKING: {
    title: 'Speaking',
    description:
      'Productive skill: expressing yourself out loud. Record answers and get AI feedback on content, grammar and fluency.',
    Icon: Mic,
    categories: ['CONVERSATION', 'PRONUNCIATION'],
  },
  WRITING: {
    title: 'Writing',
    description:
      'Productive skill: writing clear, correct English. Short answers are evaluated by AI against a rubric.',
    Icon: PenLine,
    categories: ['WRITING', 'GRAMMAR'],
  },
}

const SKILL_KEYS: SkillType[] = ['READING', 'LISTENING', 'SPEAKING', 'WRITING']

export function SkillHubPage() {
  const { skill } = useParams<{ skill: string }>()
  const key = (skill ?? '').toUpperCase() as SkillType
  const meta = SKILLS[key]

  const coursesQuery = useQuery({
    queryKey: ['courses', 'by-skill', key],
    queryFn: async (): Promise<{ items: CourseSummary[]; isFallback: boolean }> => {
      // курсы всех категорий, относящихся к навыку
      const results = await Promise.all(
        meta.categories.map((category) => coursesApi.list({ category, limit: 12 })),
      )
      const seen = new Set<string>()
      const merged: CourseSummary[] = []
      for (const page of results) {
        for (const course of page.items) {
          if (!seen.has(course.id)) {
            seen.add(course.id)
            merged.push(course)
          }
        }
      }
      // Под навык пока нет курсов — показываем общие, чтобы не было пустой страницы
      if (merged.length === 0) {
        const general = await coursesApi.list({ limit: 12 })
        return { items: general.items, isFallback: true }
      }
      return { items: merged, isFallback: false }
    },
    enabled: Boolean(meta),
  })

  // Теория навыка — темы из справочника (Блок 6)
  const topicsQuery = useQuery({
    queryKey: ['topics', 'by-skill', key],
    queryFn: () => topicsApi.list({ skill: key }),
    enabled: Boolean(meta),
  })

  if (!meta) return <Navigate to="/dashboard" replace />

  const { Icon } = meta
  const courses = coursesQuery.data?.items ?? []
  const isFallback = coursesQuery.data?.isFallback ?? false
  const topics = topicsQuery.data ?? []

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1280px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Flex align="flex-start" gap="16px" mb="12px">
              <Box
                w="48px"
                h="48px"
                borderRadius="lg"
                bg="accent.subtle"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="accent.text"
                flexShrink={0}
              >
                <Icon size={24} />
              </Box>
              <Stack gap="4px">
                <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
                  {meta.title}
                </Heading>
                <Text fontSize="md" color="text.secondary" maxW="640px">
                  {meta.description}
                </Text>
              </Stack>
            </Flex>
          </motion.div>

          {/* навигация по остальным навыкам */}
          <motion.div variants={fadeUp}>
            <Flex gap="8px" mb="28px" wrap="wrap">
              {SKILL_KEYS.filter((s) => s !== key).map((s) => (
                <Link key={s} to={`/skills/${s.toLowerCase()}`}>
                  <Badge tone="neutral" shape="pill">{SKILLS[s].title}</Badge>
                </Link>
              ))}
            </Flex>
          </motion.div>

          {topics.length > 0 && (
            <motion.div variants={fadeUp}>
              <Heading as="h2" fontSize="xl" fontWeight="semibold" mb="14px">
                Theory
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="14px" mb="28px">
                {topics.map((topic) => (
                  <Link key={topic.id} to={`/topics/${topic.id}`}>
                    <Card padding="comfortable" style={{ height: '100%' }}>
                      <Stack gap="6px">
                        <Badge tone="accent" shape="pill">{topic.level}</Badge>
                        <Text fontSize="md" fontWeight="semibold">{topic.title}</Text>
                        <Text fontSize="xs" color="text.tertiary">
                          {topic.lessonCount > 0
                            ? `${topic.lessonCount} practice ${topic.lessonCount === 1 ? 'lesson' : 'lessons'}`
                            : 'Theory only'}
                        </Text>
                      </Stack>
                    </Card>
                  </Link>
                ))}
              </SimpleGrid>
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <Heading as="h2" fontSize="xl" fontWeight="semibold" mb={isFallback ? '4px' : '14px'}>
              {isFallback ? 'Courses to start with' : `Courses for ${meta.title.toLowerCase()}`}
            </Heading>
            {isFallback && courses.length > 0 && (
              <Text fontSize="sm" color="text.secondary" mb="14px">
                No {meta.title.toLowerCase()}-specific tracks yet — here are courses you can start now.
              </Text>
            )}

            {coursesQuery.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="16px">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} h="180px" borderRadius="lg" />
                ))}
              </SimpleGrid>
            ) : coursesQuery.error ? (
              <Card padding="comfortable">
                <Text fontSize="sm" color="text.secondary">
                  {extractApiError(coursesQuery.error)}
                </Text>
              </Card>
            ) : courses.length === 0 ? (
              <Card padding="spacious">
                <Stack align="center" textAlign="center" gap="8px" py="16px">
                  <Text fontSize="md" fontWeight="semibold">No courses yet</Text>
                  <Text fontSize="sm" color="text.secondary">
                    Courses for this skill haven't been published yet — check back soon.
                  </Text>
                  <Link to="/courses">
                    <Button size="sm" variant="secondary" style={{ marginTop: 6 }}>
                      Browse all courses
                    </Button>
                  </Link>
                </Stack>
              </Card>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="16px">
                {courses.map((course) => (
                  <Link key={course.id} to={`/courses/${course.slug}`}>
                    <Card padding="comfortable" style={{ height: '100%' }}>
                      <Stack gap="8px">
                        <Flex gap="8px" align="center" wrap="wrap">
                          {course.level && <Badge tone="accent" shape="pill">{course.level}</Badge>}
                          <Badge tone="neutral" shape="pill">
                            {course.category.replaceAll('_', ' ').toLowerCase()}
                          </Badge>
                        </Flex>
                        <Text fontSize="md" fontWeight="semibold">{course.title}</Text>
                        <Text fontSize="sm" color="text.secondary" lineClamp={2}>
                          {course.description}
                        </Text>
                        <Text fontSize="xs" color="text.tertiary">
                          {course.totalLessons ?? 0} lessons
                        </Text>
                      </Stack>
                    </Card>
                  </Link>
                ))}
              </SimpleGrid>
            )}
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  )
}
