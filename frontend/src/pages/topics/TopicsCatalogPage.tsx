import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Library } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { topicsApi, extractApiError } from '@shared/api'
import type { TopicSkill } from '@shared/api'
import type { CefrLevel } from '@shared/model'
import { Badge, Card, Input, NativeButton, Skeleton } from '@shared/ui'
import { staggerContainer, fadeUp } from '@shared/motion'

const SKILLS: { value: TopicSkill; label: string }[] = [
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
  { value: 'READING', label: 'Reading' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'WRITING', label: 'Writing' },
]
const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <NativeButton
      onClick={onClick}
      px="12px"
      py="6px"
      borderRadius="full"
      border="1px solid"
      borderColor={active ? 'accent.solid' : 'border.default'}
      bg={active ? 'accent.subtle' : 'transparent'}
      color={active ? 'accent.text' : 'text.secondary'}
      fontSize="sm"
      fontWeight={active ? 'semibold' : 'normal'}
      transition="all 0.15s"
    >
      {children}
    </NativeButton>
  )
}

export function TopicsCatalogPage() {
  const [skill, setSkill] = useState<TopicSkill | null>(null)
  const [level, setLevel] = useState<CefrLevel | null>(null)
  const [search, setSearch] = useState('')

  const topicsQuery = useQuery({
    queryKey: ['topics', 'list', skill, level],
    queryFn: () =>
      topicsApi.list({
        skill: skill ?? undefined,
        level: level ?? undefined,
      }),
  })

  const q = search.trim().toLowerCase()
  const topics = (topicsQuery.data ?? []).filter(
    (t) => !q || t.title.toLowerCase().includes(q),
  )

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1280px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Stack gap="6px" mb="24px">
              <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
                Topics
              </Heading>
              <Text fontSize="md" color="text.secondary">
                {topicsQuery.isLoading
                  ? 'Loading topics…'
                  : `${topics.length} ${topics.length === 1 ? 'topic' : 'topics'} — read the rule, then practise it.`}
              </Text>
            </Stack>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Stack gap="10px" mb="24px">
              <Flex justify="flex-end">
                <Box w={{ base: '100%', md: '360px' }}>
                  <Input
                    placeholder="Search topics…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    leftIcon={<Search size={14} />}
                  />
                </Box>
              </Flex>
              <Flex gap="8px" wrap="wrap">
                {SKILLS.map((s) => (
                  <Chip
                    key={s.value}
                    active={skill === s.value}
                    onClick={() => setSkill(skill === s.value ? null : s.value)}
                  >
                    {s.label}
                  </Chip>
                ))}
              </Flex>
              <Flex gap="8px" wrap="wrap">
                {LEVELS.map((l) => (
                  <Chip
                    key={l}
                    active={level === l}
                    onClick={() => setLevel(level === l ? null : l)}
                  >
                    {l}
                  </Chip>
                ))}
              </Flex>
            </Stack>
          </motion.div>

          <motion.div variants={fadeUp}>
            {topicsQuery.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="14px">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} h="110px" borderRadius="lg" />
                ))}
              </SimpleGrid>
            ) : topicsQuery.error ? (
              <Card padding="comfortable">
                <Text fontSize="sm" color="text.secondary">
                  {extractApiError(topicsQuery.error)}
                </Text>
              </Card>
            ) : topics.length === 0 ? (
              <Card padding="spacious">
                <Stack align="center" textAlign="center" gap="8px" py="20px">
                  <Library size={26} />
                  <Text fontSize="md" fontWeight="semibold">No topics here yet</Text>
                  <Text fontSize="sm" color="text.secondary">
                    {skill || level || q
                      ? 'Try removing some filters or the search term.'
                      : 'Teachers are still filling the reference library.'}
                  </Text>
                </Stack>
              </Card>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="14px">
                {topics.map((topic) => (
                  <Link key={topic.id} to={`/topics/${topic.id}`}>
                    <Card padding="comfortable" style={{ height: '100%' }}>
                      <Stack gap="8px">
                        <Flex gap="8px" wrap="wrap">
                          <Badge tone="accent" shape="pill">{topic.level}</Badge>
                          <Badge tone="neutral" shape="pill">
                            {topic.skill.toLowerCase()}
                          </Badge>
                        </Flex>
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
            )}
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  )
}
