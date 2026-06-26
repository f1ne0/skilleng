import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { ArrowRight, Clock, BookOpen } from 'lucide-react'
import { Button, Badge, Card } from '@shared/ui'
import { useNavigate } from 'react-router-dom'
import type { ContinueLesson } from './types'

export function ContinueLearning({ lesson }: { lesson: ContinueLesson }) {
  const navigate = useNavigate()
  const pct = lesson.totalLessons > 0
    ? Math.round((lesson.lessonIndex / lesson.totalLessons) * 100)
    : 0

  return (
    <Card variant="hero" padding="spacious" style={{ height: '100%' }}>
      <Flex direction={{ base: 'column', md: 'row' }} gap="28px" align="stretch" h="100%">
        <CoverBlock />

        <Stack gap="16px" flex="1" justify="space-between" minW="0">
          <Stack gap="12px">
            <Flex gap="8px" wrap="wrap">
              <Badge tone="accent" intensity="subtle">
                Continue where you left off
              </Badge>
              <Badge tone="neutral" leftIcon={<Clock size={12} />}>
                {lesson.estMinutes} min
              </Badge>
            </Flex>
            <Text
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="semibold"
              letterSpacing="tight"
              lineHeight="tight"
            >
              {lesson.lessonTitle}
            </Text>
            <Flex align="center" gap="6px" color="text.secondary" fontSize="sm">
              <BookOpen size={14} />
              <Text>
                {lesson.courseTitle} · Lesson {lesson.lessonIndex} of {lesson.totalLessons}
              </Text>
            </Flex>
          </Stack>

          <Stack gap="12px">
            <Box>
              <Flex justify="space-between" mb="6px">
                <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
                  Course progress
                </Text>
                <Text fontSize="xs" color="accent.text" fontWeight="semibold" fontFamily="mono">
                  {pct}%
                </Text>
              </Flex>
              <Box h="4px" w="100%" bg="bg.muted" borderRadius="full" overflow="hidden">
                <Box
                  h="100%"
                  w={`${pct}%`}
                  background="linear-gradient(90deg, var(--se-colors-accent-solid), var(--se-colors-accent-solidHover))"
                  borderRadius="full"
                />
              </Box>
            </Box>
            <Flex>
              <Button
                size="lg"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate(`/courses/${lesson.courseSlug}`)}
              >
                Continue lesson
              </Button>
            </Flex>
          </Stack>
        </Stack>
      </Flex>
    </Card>
  )
}

function CoverBlock() {
  return (
    <Box
      flexShrink={0}
      w={{ base: '100%', md: '240px' }}
      h={{ base: '160px', md: 'auto' }}
      minH={{ md: '200px' }}
      borderRadius="xl"
      position="relative"
      overflow="hidden"
      background="radial-gradient(circle at 25% 25%, rgba(16,185,129,0.55), transparent 55%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.35), transparent 50%), linear-gradient(135deg, #0B1F1A 0%, #081320 100%)"
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)"
    >
      <Box
        position="absolute"
        inset="0"
        backgroundImage="radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)"
        backgroundSize="14px 14px"
        opacity={0.6}
      />
      <Flex
        position="absolute"
        inset="0"
        align="center"
        justify="center"
        color="white"
        fontFamily="heading"
        fontWeight="semibold"
        fontSize={{ base: '3xl', md: '4xl' }}
        letterSpacing="tight"
        textShadow="0 4px 24px rgba(0,0,0,0.5)"
      >
        had + V<sub style={{ fontSize: '0.55em', opacity: 0.85, marginLeft: 1 }}>3</sub>
      </Flex>
    </Box>
  )
}
