import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, BookOpen, Users, FileText, Sparkles } from 'lucide-react'
import { Badge, Button, Card, Input, Link as RouterLink, NativeButton, Skeleton } from '@shared/ui'
import { coursesApi } from '@shared/api'
import type { CourseSummary, CourseStatus } from '@shared/api'
import { staggerContainer, fadeUp } from '@shared/motion'

type Filter = 'ALL' | CourseStatus

export function TeachCoursesListPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [search, setSearch] = useState('')

  const query = useQuery({
    queryKey: ['courses', 'my'],
    queryFn: coursesApi.my,
  })

  // /courses/my учителю уже возвращает только его курсы
  // English for IT — первым и по порядку (Semester 1 → 2), остальные после
  const owned = [...(query.data ?? [])].sort((a, b) => {
    const ap = a.slug.startsWith('english-for-it') ? 0 : 1
    const bp = b.slug.startsWith('english-for-it') ? 0 : 1
    if (ap !== bp) return ap - bp
    if (ap === 0) return a.slug.localeCompare(b.slug)
    return a.title.localeCompare(b.title)
  })

  const counts = useMemo(() => ({
    ALL: owned.length,
    ARCHIVED: owned.filter((c) => c.status === 'ARCHIVED').length,
  }), [owned])

  // Курсы публикуются автоматически — фильтруем только «активные / архив»
  const STATUS_OPTS: { value: Filter; label: string }[] = [
    { value: 'ALL', label: `All ${counts.ALL}` },
    ...(counts.ARCHIVED > 0
      ? ([{ value: 'ARCHIVED', label: `Archived ${counts.ARCHIVED}` }] as { value: Filter; label: string }[])
      : []),
  ]

  const filtered = useMemo(() => {
    const byStatus = filter === 'ALL' ? owned : owned.filter((c) => c.status === filter)
    const q = search.trim().toLowerCase()
    const list = q ? byStatus.filter((c) => c.title.toLowerCase().includes(q)) : byStatus
    // Программа English for IT — первой и по порядку (Semester 1 → 2), демо-курсы после
    return [...list].sort((a, b) => {
      const ap = a.slug.startsWith('english-for-it') ? 0 : 1
      const bp = b.slug.startsWith('english-for-it') ? 0 : 1
      if (ap !== bp) return ap - bp
      if (ap === 0) return a.slug.localeCompare(b.slug) // semester-1 < semester-2
      return a.title.localeCompare(b.title)
    })
  }, [owned, filter, search])

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1100px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink to="/teach" display="inline-flex" alignItems="center" gap="6px"
            fontSize="sm" color="text.tertiary" textDecoration="none" _hover={{ color: 'text.primary' }}>
            <ArrowLeft size={14} /> Overview
          </RouterLink>
        </Box>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap="14px"
              mb="20px" direction={{ base: 'column', md: 'row' }}>
              <Stack gap="6px">
                <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold"
                  letterSpacing="tight" lineHeight="tight">
                  Your courses
                </Heading>
                <Text fontSize="md" color="text.secondary">
                  Manage lessons and exams.
                </Text>
              </Stack>
              <Flex gap="8px" wrap="wrap">
                <Button size="md" variant="secondary" leftIcon={<Sparkles size={14} />}
                  onClick={() => navigate('/teach/courses/generate')}>
                  Generate with AI
                </Button>
                <Button size="md" leftIcon={<Plus size={14} />} onClick={() => navigate('/teach/courses/new')}>
                  New course
                </Button>
              </Flex>
            </Flex>
          </motion.div>

          {/* фильтр (только если есть архивные) + поиск */}
          <motion.div variants={fadeUp}>
            <Flex justify="space-between" align="center" gap="12px" mb="20px" wrap="wrap">
              <Flex gap="6px" wrap="wrap">
                {STATUS_OPTS.length > 1 && STATUS_OPTS.map((opt) => {
                  const active = opt.value === filter
                  return (
                    <NativeButton key={opt.value} onClick={() => setFilter(opt.value)}
                      px="12px" h="30px" display="inline-flex" alignItems="center" borderRadius="full"
                      bg={active ? 'accent.surface' : 'bg.subtle'}
                      color={active ? 'accent.text' : 'text.secondary'}
                      border="1px solid" borderColor={active ? 'border.accent' : 'border.subtle'}
                      fontSize="xs" fontWeight="medium">
                      {opt.label}
                    </NativeButton>
                  )
                })}
              </Flex>
              <Box maxW="240px" w="100%">
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses…" />
              </Box>
            </Flex>
          </motion.div>

          {query.isLoading ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="14px">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h="150px" borderRadius="lg" />)}
            </SimpleGrid>
          ) : filtered.length === 0 ? (
            <Card padding="spacious">
              <Stack gap="6px" align="center" textAlign="center" py="24px">
                <Box color="text.tertiary"><BookOpen size={22} /></Box>
                <Text fontSize="md" fontWeight="semibold">
                  {owned.length === 0 ? 'No courses yet' : 'Nothing matches'}
                </Text>
                <Text fontSize="sm" color="text.secondary">
                  {owned.length === 0
                    ? 'Create a course to start adding lessons.'
                    : 'Try a different filter or search.'}
                </Text>
                {owned.length === 0 && (
                  <Box mt="8px">
                    <Button size="sm" onClick={() => navigate('/teach/courses/new')}>Create course</Button>
                  </Box>
                )}
              </Stack>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="14px">
              {filtered.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  onEdit={() => navigate(`/teach/courses/${c.id}/edit`)}
                  onLessons={() => navigate(`/teach/courses/${c.id}/lessons`)}
                  onExams={() => navigate(`/teach/exams?courseId=${c.id}`)}
                />
              ))}
            </SimpleGrid>
          )}
        </motion.div>
      </Container>
    </Box>
  )
}

function CourseCard({
  course, onEdit, onLessons, onExams,
}: {
  course: CourseSummary
  onEdit: () => void
  onLessons: () => void
  onExams: () => void
}) {
  return (
    <Card padding="comfortable" style={{ height: '100%' }}>
      <Stack gap="12px" h="100%">
        <Flex align="flex-start" justify="space-between" gap="10px">
          <Stack gap="6px" flex="1" minW="0">
            <Text fontSize="md" fontWeight="semibold" lineHeight="tight" truncate>{course.title}</Text>
            <Flex gap="6px" wrap="wrap">
              {course.level && <Badge tone="accent" shape="pill">{course.level}</Badge>}
              <Badge tone="neutral" shape="pill">{course.category.replaceAll('_', ' ').toLowerCase()}</Badge>
            </Flex>
          </Stack>
          {course.status === 'ARCHIVED' && (
            <Badge tone="warning" intensity="subtle" shape="pill">archived</Badge>
          )}
        </Flex>

        <Text fontSize="sm" color="text.secondary" lineClamp={2} flex="1">
          {course.description}
        </Text>

        <Flex gap="14px" color="text.tertiary">
          <Flex align="center" gap="5px">
            <FileText size={13} />
            <Text fontSize="xs">{course.totalLessons ?? 0} lessons</Text>
          </Flex>
          <Flex align="center" gap="5px">
            <Users size={13} />
            <Text fontSize="xs">{course.enrolledCount ?? 0} students</Text>
          </Flex>
        </Flex>

        <Flex gap="6px" pt="2px">
          <Button size="sm" onClick={onLessons}>Lessons</Button>
          <Button size="sm" variant="secondary" onClick={onExams}>Exams</Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
        </Flex>
      </Stack>
    </Card>
  )
}
