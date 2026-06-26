import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, PartyPopper } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vocabularyApi, extractApiError } from '@shared/api'
import type { ReviewQuality, VocabularyEntry } from '@shared/api'
import { Button, Card, Skeleton, showToast } from '@shared/ui'

// Маппинг кнопок в SM-2 quality:
// Again (забыл) = 1 → сброс; Hard = 3; Good = 4; Easy = 5
const GRADE_BUTTONS: { label: string; quality: ReviewQuality; hint: string }[] = [
  { label: "Again", quality: 1, hint: "didn't remember" },
  { label: 'Hard', quality: 3, hint: 'barely' },
  { label: 'Good', quality: 4, hint: 'remembered' },
  { label: 'Easy', quality: 5, hint: 'instantly' },
]

export function VocabularyReviewPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Очередь фиксируется на момент старта сессии — поэтому не рефетчим due
  const dueQuery = useQuery({
    queryKey: ['vocabulary', 'review-session'],
    queryFn: vocabularyApi.due,
    staleTime: Infinity,
    gcTime: 0,
  })

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const reviewMutation = useMutation({
    mutationFn: ({ id, quality }: { id: string; quality: ReviewQuality }) =>
      vocabularyApi.review(id, quality),
    onSuccess: () => {
      setReviewed((n) => n + 1)
      setFlipped(false)
      setIndex((i) => i + 1)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const queue = dueQuery.data ?? []
  const current: VocabularyEntry | undefined = queue[index]
  const done = !dueQuery.isLoading && (queue.length === 0 || index >= queue.length)

  // По завершении сессии — обновить списки/статистику словаря
  const finish = () => {
    void qc.invalidateQueries({ queryKey: ['vocabulary'] })
    navigate('/vocabulary')
  }

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="640px" py="32px" px="20px">
        <Flex align="center" justify="space-between" mb="24px">
          <Button variant="ghost" size="sm" onClick={finish}>
            <ArrowLeft size={16} /> Back
          </Button>
          {queue.length > 0 && index < queue.length && (
            <Text fontSize="sm" color="text.tertiary">
              {index + 1} / {queue.length}
            </Text>
          )}
        </Flex>

        {dueQuery.isLoading && <Skeleton h="280px" borderRadius="xl" />}

        {dueQuery.error != null && (
          <Card padding="comfortable">
            <Text fontSize="sm" color="text.secondary">{extractApiError(dueQuery.error)}</Text>
          </Card>
        )}

        {done && !dueQuery.isLoading && !dueQuery.error && (
          <Card padding="spacious">
            <Stack align="center" textAlign="center" gap="10px" py="24px">
              <PartyPopper size={30} />
              <Heading as="h2" fontSize="2xl" fontWeight="semibold">
                {reviewed > 0 ? 'Session complete' : 'Nothing to review'}
              </Heading>
              <Text fontSize="sm" color="text.secondary">
                {reviewed > 0
                  ? `You reviewed ${reviewed} ${reviewed === 1 ? 'word' : 'words'}. Spaced repetition will bring them back right on time.`
                  : 'All caught up — new reviews will appear as intervals come due.'}
              </Text>
              <Button size="sm" onClick={finish} style={{ marginTop: 6 }}>
                To my vocabulary
              </Button>
            </Stack>
          </Card>
        )}

        {current && !done && (
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
            >
              <Card padding="spacious">
                <Stack align="center" textAlign="center" gap="14px" py="20px" minH="220px" justify="center">
                  <Text fontSize="3xl" fontWeight="semibold" letterSpacing="tight">
                    {current.term}
                  </Text>
                  {current.partOfSpeech && (
                    <Text fontSize="xs" color="text.tertiary" textTransform="uppercase" letterSpacing="wide">
                      {current.partOfSpeech}
                    </Text>
                  )}

                  {flipped ? (
                    <Stack gap="8px" align="center">
                      <Text fontSize="xl" color="text.primary">{current.translation}</Text>
                      {current.example && (
                        <Text fontSize="sm" color="text.secondary" fontStyle="italic" maxW="420px">
                          {current.example}
                        </Text>
                      )}
                    </Stack>
                  ) : (
                    <Button variant="secondary" onClick={() => setFlipped(true)}>
                      Show answer
                    </Button>
                  )}
                </Stack>
              </Card>

              {flipped && (
                <Flex gap="8px" mt="16px" justify="center" wrap="wrap">
                  {GRADE_BUTTONS.map((g) => (
                    <Stack key={g.quality} gap="2px" align="center">
                      <Button
                        size="sm"
                        variant={g.quality === 1 ? 'destructive' : g.quality === 5 ? 'primary' : 'secondary'}
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({ id: current.id, quality: g.quality })
                        }
                      >
                        {g.label}
                      </Button>
                      <Text fontSize="xs" color="text.tertiary">{g.hint}</Text>
                    </Stack>
                  ))}
                </Flex>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </Container>
    </Box>
  )
}
