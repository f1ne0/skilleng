import { Box, Flex, Stack, Text, SimpleGrid } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Clock } from 'lucide-react'
import { Card, Badge } from '@shared/ui'
import { staggerContainer, fadeUp } from '@shared/motion'
import { useNavigate } from 'react-router-dom'
import type { RecommendedCourseCard } from './types'

const TONE_GRADIENT: Record<RecommendedCourseCard['tone'], string> = {
  emerald:
    'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.55), transparent 60%), linear-gradient(135deg, #0F1F1A, #0A1320)',
  blue:
    'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.50), transparent 60%), linear-gradient(135deg, #0E1A2A, #0A1320)',
  amber:
    'radial-gradient(circle at 30% 30%, rgba(245,158,11,0.45), transparent 60%), linear-gradient(135deg, #1F1810, #14110A)',
}

export function RecommendedCourses({ courses }: { courses: RecommendedCourseCard[] }) {
  const navigate = useNavigate()
  return (
    <Stack gap="16px">
      <Flex justify="space-between" align="center">
        <Text fontSize="lg" fontWeight="semibold" letterSpacing="tight">
          Recommended for you
        </Text>
        <Flex align="center" gap="4px" fontSize="sm" color="accent.text" fontWeight="medium"
          cursor="pointer" onClick={() => navigate('/courses')}>
          See all
          <ArrowRight size={14} />
        </Flex>
      </Flex>

      {courses.length === 0 ? (
        <Card padding="spacious">
          <Stack gap="6px" align="center" textAlign="center" py="16px">
            <Box color="text.tertiary"><BookOpen size={20} /></Box>
            <Text fontSize="sm" fontWeight="medium">Nothing to recommend yet</Text>
            <Text fontSize="sm" color="text.secondary">
              Browse the catalog to find your next course.
            </Text>
          </Stack>
        </Card>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px">
            {courses.map((c) => (
              <motion.div key={c.id} variants={fadeUp}>
                <CourseCard course={c} />
              </motion.div>
            ))}
          </SimpleGrid>
        </motion.div>
      )}
    </Stack>
  )
}

function CourseCard({ course }: { course: RecommendedCourseCard }) {
  const navigate = useNavigate()
  return (
    <Card
      interactive
      padding="comfortable"
      style={{ height: '100%' }}
      onClick={() => navigate(`/courses/${course.slug}`)}
    >
      <Stack gap="12px" h="100%">
        <Box
          h="100px"
          borderRadius="lg"
          position="relative"
          overflow="hidden"
          background={TONE_GRADIENT[course.tone]}
        >
          <Box
            position="absolute"
            inset="0"
            backgroundImage="radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)"
            backgroundSize="14px 14px"
            opacity={0.6}
          />
          <Box position="absolute" top="10px" left="10px">
            <Badge tone="neutral" intensity="subtle">
              {course.level}
            </Badge>
          </Box>
        </Box>
        <Stack gap="4px" flex="1">
          <Text fontSize="md" fontWeight="semibold" lineHeight="tight">
            {course.title}
          </Text>
          <Text fontSize="sm" color="text.secondary" lineHeight="normal">
            {course.description}
          </Text>
        </Stack>
        <Flex gap="14px" align="center" color="text.tertiary" fontSize="xs">
          <Flex align="center" gap="4px">
            <BookOpen size={12} />
            <span>{course.lessons} lessons</span>
          </Flex>
          <Flex align="center" gap="4px">
            <Clock size={12} />
            <span>{course.hours}h</span>
          </Flex>
        </Flex>
      </Stack>
    </Card>
  )
}
