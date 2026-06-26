import { useNavigate } from 'react-router-dom'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Check,
  Flag,
  Headphones,
  Lock,
  Map as MapIcon,
  Mic,
  PenLine,
  Repeat,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { learningPathApi, isLearningPath, extractApiError } from '@shared/api'
import type { PathNode } from '@shared/api'
import { Badge, Button, Card, Skeleton, showToast } from '@shared/ui'

const SKILL_ICON: Record<string, LucideIcon> = {
  READING: BookOpen,
  LISTENING: Headphones,
  SPEAKING: Mic,
  WRITING: PenLine,
}

function nodeIcon(node: PathNode): LucideIcon {
  if (node.type === 'REVIEW') return Repeat
  if (node.type === 'CHECKPOINT') return Flag
  return (node.skillFocus && SKILL_ICON[node.skillFocus]) || BookOpen
}

function nodeTitle(node: PathNode): string {
  if (node.type === 'REVIEW') return 'Vocabulary review'
  if (node.type === 'CHECKPOINT') return 'Checkpoint: level re-test'
  return node.lesson?.title ?? 'Lesson'
}

function nodeSubtitle(node: PathNode): string | null {
  if (node.type === 'REVIEW') return 'Spaced repetition session'
  if (node.type === 'CHECKPOINT') return 'Adaptive test to re-measure your level'
  if (node.lesson) {
    const min = node.lesson.durationSec
      ? `${Math.max(1, Math.round(node.lesson.durationSec / 60))} min · `
      : ''
    return `${min}${node.lesson.courseTitle}`
  }
  return null
}

export function LearningPathPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const pathQuery = useQuery({
    queryKey: ['learning-path'],
    queryFn: learningPathApi.get,
  })

  const generateMutation = useMutation({
    mutationFn: learningPathApi.generate,
    onSuccess: (data) => {
      qc.setQueryData(['learning-path'], data)
      showToast({ type: 'success', title: 'Your path is ready' })
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const openNode = (node: PathNode) => {
    if (node.status === 'LOCKED') return
    if (node.type === 'REVIEW') {
      navigate('/vocabulary/review')
      return
    }
    if (node.type === 'CHECKPOINT') {
      navigate('/placement')
      return
    }
    if (node.lesson) {
      navigate(`/courses/${node.lesson.courseSlug}/lessons/${node.lesson.id}`)
    }
  }

  const data = pathQuery.data
  const path = data && isLearningPath(data) ? data : null

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="720px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Stack gap="6px" mb="28px">
          <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
            My learning path
          </Heading>
          <Text fontSize="md" color="text.secondary">
            A personal sequence built from your level and goal — lessons,
            spaced reviews and checkpoints, unlocked step by step.
          </Text>
        </Stack>

        {pathQuery.isLoading && (
          <Stack gap="14px">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} h="76px" borderRadius="xl" />
            ))}
          </Stack>
        )}

        {pathQuery.error != null && (
          <Card padding="comfortable">
            <Text fontSize="sm" color="text.secondary">{extractApiError(pathQuery.error)}</Text>
          </Card>
        )}

        {/* ===== Путь ещё не построен ===== */}
        {data && !path && (
          <Card padding="spacious">
            <Stack align="center" textAlign="center" gap="12px" py="20px">
              <MapIcon size={30} />
              <Heading as="h2" fontSize="xl" fontWeight="semibold">
                No path yet
              </Heading>
              <Text fontSize="sm" color="text.secondary" maxW="440px">
                We'll build a personal route from your level and learning goal.
                The placement test builds it automatically — or generate it now
                from your profile.
              </Text>
              <Flex gap="10px" mt="6px" wrap="wrap" justify="center">
                <Button
                  onClick={() => generateMutation.mutate()}
                  loading={generateMutation.isPending}
                >
                  <Sparkles size={16} /> Build my path
                </Button>
                <Button variant="secondary" onClick={() => navigate('/placement')}>
                  Take the placement test
                </Button>
              </Flex>
            </Stack>
          </Card>
        )}

        {/* ===== Змейка ===== */}
        {path && (
          <>
            <Card padding="comfortable" style={{ marginBottom: 24 }}>
              <Flex justify="space-between" align="center" gap="12px" wrap="wrap">
                <Flex gap="8px" align="center" wrap="wrap">
                  <Badge tone="accent" shape="pill">{path.basedOnLevel}</Badge>
                  {path.goal && (
                    <Badge tone="neutral" shape="pill">
                      {path.goal.replaceAll('_', ' ').toLowerCase()}
                    </Badge>
                  )}
                  <Text fontSize="sm" color="text.secondary">
                    {path.progress.completed} of {path.progress.total} steps done
                  </Text>
                </Flex>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={generateMutation.isPending}
                  onClick={() => generateMutation.mutate()}
                >
                  Rebuild
                </Button>
              </Flex>
              <Box mt="10px" h="6px" bg="bg.muted" borderRadius="full" overflow="hidden">
                <motion.div
                  animate={{
                    width: `${path.progress.total > 0 ? (path.progress.completed / path.progress.total) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.4 }}
                  style={{ height: '100%', background: 'var(--se-colors-accent-solid)', borderRadius: 9999 }}
                />
              </Box>
            </Card>

            <Box position="relative">
              {/* вертикальная линия */}
              <Box
                position="absolute"
                left="27px"
                top="10px"
                bottom="10px"
                w="2px"
                bg="border.default"
              />
              <Stack gap="14px">
                {path.nodes.map((node, i) => (
                  <PathNodeRow
                    key={node.id}
                    node={node}
                    index={i}
                    onOpen={() => openNode(node)}
                  />
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Container>
    </Box>
  )
}

function PathNodeRow({
  node,
  index,
  onOpen,
}: {
  node: PathNode
  index: number
  onOpen: () => void
}) {
  const Icon = nodeIcon(node)
  const locked = node.status === 'LOCKED'
  const completed = node.status === 'COMPLETED'
  const available = node.status === 'AVAILABLE'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.6) }}
    >
      <Flex
        gap="14px"
        align="center"
        opacity={locked ? 0.55 : 1}
        cursor={locked ? 'default' : 'pointer'}
        onClick={onOpen}
        role={locked ? undefined : 'button'}
      >
        {/* круг-узел на линии */}
        <Box position="relative" zIndex={1} flexShrink={0}>
          <motion.div
            animate={available ? { scale: [1, 1.07, 1] } : undefined}
            transition={available ? { duration: 1.6, repeat: Infinity } : undefined}
          >
            <Flex
              w="56px"
              h="56px"
              borderRadius="full"
              align="center"
              justify="center"
              bg={completed ? 'accent.solid' : available ? 'accent.subtle' : 'bg.muted'}
              border="2px solid"
              borderColor={completed || available ? 'accent.solid' : 'border.default'}
              color={completed ? 'white' : available ? 'accent.text' : 'text.tertiary'}
            >
              {completed ? <Check size={22} /> : locked ? <Lock size={18} /> : <Icon size={22} />}
            </Flex>
          </motion.div>
        </Box>

        <Card padding="comfortable" style={{ flex: 1 }}>
          <Flex justify="space-between" align="center" gap="10px" wrap="wrap">
            <Stack gap="2px" flex="1" minW="0">
              <Text
                fontSize="md"
                fontWeight="semibold"
                textDecoration={completed ? 'line-through' : undefined}
                color={completed ? 'text.tertiary' : 'text.primary'}
              >
                {nodeTitle(node)}
              </Text>
              {nodeSubtitle(node) && (
                <Text fontSize="xs" color="text.tertiary">{nodeSubtitle(node)}</Text>
              )}
            </Stack>
            {available && (
              <Badge tone="accent" shape="pill">
                {node.type === 'LESSON' ? 'Continue' : 'Start'}
              </Badge>
            )}
          </Flex>
        </Card>
      </Flex>
    </motion.div>
  )
}
