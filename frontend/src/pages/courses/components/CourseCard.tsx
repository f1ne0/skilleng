import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, Lock, Star, Users } from 'lucide-react'
import { Card, Badge } from '@shared/ui'
import type { Course } from '@entities/course'
import { CourseCover } from './CourseCover'

export function CourseCard({ course }: { course: Course }) {
  const navigate = useNavigate()
  const enrolled = typeof course.progress === 'number'
  const pct = enrolled ? Math.round((course.progress ?? 0) * 100) : 0
  const completed = enrolled && pct === 100
  const locked = Boolean(course.locked)

  return (
    <Card
      interactive
      padding="comfortable"
      style={{ height: '100%' }}
      onClick={() => navigate(`/courses/${course.slug}`)}
    >
      <Stack gap="14px" h="100%">
        <CourseCover tone={course.tone} glyph={course.level}>
          <Flex position="absolute" top="10px" left="10px" gap="6px" wrap="wrap">
            {locked ? (
              <Badge tone="warning" intensity="solid" shape="pill">
                Locked
              </Badge>
            ) : completed ? (
              <Badge tone="success" intensity="solid" shape="pill">
                Completed
              </Badge>
            ) : enrolled ? (
              <Badge tone="accent" intensity="solid" shape="pill">
                In progress
              </Badge>
            ) : null}
          </Flex>
        </CourseCover>

        <Stack gap="6px" flex="1">
          <Text fontSize="md" fontWeight="semibold" lineHeight="tight">
            {course.title}
          </Text>
          <Text fontSize="sm" color="text.secondary" lineHeight="normal" truncate={false}>
            {course.description}
          </Text>
        </Stack>

        {locked ? (
          <Flex align="center" gap="6px" color="text.tertiary" fontSize="xs">
            <Lock size={12} />
            <span>
              {course.prerequisiteTitle
                ? `Complete ${course.prerequisiteTitle} first`
                : 'Complete the previous course first'}
            </span>
          </Flex>
        ) : enrolled && !completed ? (
          <Box>
            <Flex justify="space-between" mb="4px">
              <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
                Progress
              </Text>
              <Text fontSize="xs" color="accent.text" fontWeight="medium" fontFamily="mono">
                {pct}%
              </Text>
            </Flex>
            <Box h="3px" w="100%" bg="bg.muted" borderRadius="full" overflow="hidden">
              <Box
                h="100%"
                w={`${pct}%`}
                background="linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))"
                borderRadius="full"
              />
            </Box>
          </Box>
        ) : null}

        <Flex gap="14px" align="center" color="text.tertiary" fontSize="xs" wrap="wrap">
          <Flex align="center" gap="4px">
            <BookOpen size={12} />
            <span>{course.totalLessons} lessons</span>
          </Flex>
          <Flex align="center" gap="4px">
            <Clock size={12} />
            <span>{Math.round(course.totalMinutes / 60) || 1}h</span>
          </Flex>
          {course.ratingAvg && (
            <Flex align="center" gap="4px">
              <Star size={12} fill="currentColor" color="var(--se-colors-warning)" />
              <span>{course.ratingAvg.toFixed(1)}</span>
            </Flex>
          )}
          <Flex align="center" gap="4px" ml="auto">
            <Users size={12} />
            <span>{formatCount(course.enrolledCount)}</span>
          </Flex>
        </Flex>
      </Stack>
    </Card>
  )
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n.toLocaleString()
}
