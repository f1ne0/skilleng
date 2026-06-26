import { Link, useParams } from 'react-router-dom'
import {
  Box,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Play } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { topicsApi, extractApiError } from '@shared/api'
import { Badge, Button, Card, MessageContent, Skeleton } from '@shared/ui'
import { staggerContainer, fadeUp } from '@shared/motion'

export function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()

  const topicQuery = useQuery({
    queryKey: ['topics', 'detail', id],
    queryFn: () => topicsApi.byId(id!),
    enabled: Boolean(id),
  })

  const topic = topicQuery.data

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="860px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Link to="/topics">
          <Button variant="ghost" size="sm" style={{ marginBottom: 16 }}>
            <ArrowLeft size={15} /> All topics
          </Button>
        </Link>

        {topicQuery.isLoading && (
          <Stack gap="14px">
            <Skeleton h="40px" borderRadius="md" />
            <Skeleton h="280px" borderRadius="lg" />
          </Stack>
        )}

        {topicQuery.error != null && (
          <Card padding="comfortable">
            <Text fontSize="sm" color="text.secondary">
              {extractApiError(topicQuery.error)}
            </Text>
          </Card>
        )}

        {topic && (
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeUp}>
              <Stack gap="10px" mb="24px">
                <Flex gap="8px" wrap="wrap">
                  <Badge tone="accent" shape="pill">{topic.level}</Badge>
                  <Badge tone="neutral" shape="pill">{topic.skill.toLowerCase()}</Badge>
                </Flex>
                <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
                  {topic.title}
                </Heading>
              </Stack>
            </motion.div>

            {/* ===== Теория ===== */}
            <motion.div variants={fadeUp}>
              <Card padding="spacious">
                <MessageContent text={topic.theoryContent} />
              </Card>
            </motion.div>

            {/* ===== Тренажёр: связанные уроки ===== */}
            <motion.div variants={fadeUp}>
              <Stack gap="12px" mt="28px">
                <Heading as="h2" fontSize="xl" fontWeight="semibold">
                  Practice
                </Heading>
                {topic.lessons.length === 0 ? (
                  <Card padding="comfortable">
                    <Text fontSize="sm" color="text.secondary">
                      No practice lessons are linked to this topic yet.
                    </Text>
                  </Card>
                ) : (
                  topic.lessons.map((lesson) => (
                    <Card key={lesson.id} padding="comfortable">
                      <Flex justify="space-between" align="center" gap="12px" wrap="wrap">
                        <Stack gap="2px" flex="1" minW="0">
                          <Text fontSize="md" fontWeight="semibold">{lesson.title}</Text>
                          <Flex gap="10px" align="center" wrap="wrap">
                            <Text fontSize="xs" color="text.tertiary">
                              {lesson.course.title}
                            </Text>
                            {lesson.durationSec && (
                              <Flex align="center" gap="4px">
                                <Clock size={12} />
                                <Text fontSize="xs" color="text.tertiary">
                                  {Math.max(1, Math.round(lesson.durationSec / 60))} min
                                </Text>
                              </Flex>
                            )}
                          </Flex>
                        </Stack>
                        <Link to={`/courses/${lesson.course.slug}/lessons/${lesson.id}`}>
                          <Button size="sm">
                            <Play size={14} /> Practise
                          </Button>
                        </Link>
                      </Flex>
                    </Card>
                  ))
                )}
              </Stack>
            </motion.div>
          </motion.div>
        )}
      </Container>
    </Box>
  )
}
