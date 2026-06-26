import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { Lightbulb } from 'lucide-react'
import { aiApi } from '@shared/api'
import type { LiveFeedback } from '@shared/api'
import { Card, Skeleton } from '@shared/ui'

const DEBOUNCE_MS = 1800
const MIN_WORDS_FOR_FEEDBACK = 15

/**
 * Формирующее оценивание (Блок 7): debounced-подсказки по черновику письма.
 * Не блокирует ввод, ничего не сохраняет; молча скрывается при ошибках AI.
 */
export function WritingLiveFeedback({
  questionId,
  draft,
  enabled,
}: {
  questionId: string
  draft: string
  /** false после сабмита — финальный вердикт уже показан */
  enabled: boolean
}) {
  const [feedback, setFeedback] = useState<LiveFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef = useRef('')

  const words = draft.trim().split(/\s+/).filter(Boolean).length
  const longEnough = words >= MIN_WORDS_FOR_FEEDBACK

  useEffect(() => {
    if (!enabled || !longEnough) return
    if (draft === lastSentRef.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      lastSentRef.current = draft
      setLoading(true)
      aiApi
        .writingLiveFeedback({ questionId, draft })
        .then(setFeedback)
        .catch(() => {
          // тихо: live-фидбек — вспомогательный, не мешаем писать
        })
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [draft, questionId, enabled, longEnough])

  // короткий черновик — панель скрыта (стейт не чистим: вернётся при доборе слов)
  if (!enabled || !longEnough || (!feedback && !loading)) return null

  return (
    <Card padding="comfortable">
      <Flex align="flex-start" gap="10px">
        <Box color="accent.text" mt="2px" flexShrink={0}>
          <Lightbulb size={16} />
        </Box>
        <Stack gap="8px" flex="1" minW="0">
          <Flex align="center" justify="space-between" gap="10px" wrap="wrap">
            <Text fontSize="xs" fontWeight="semibold" letterSpacing="wide" textTransform="uppercase" color="text.tertiary">
              Live feedback
            </Text>
            {feedback && (
              <Text fontSize="xs" color="text.tertiary">
                Projected score: <b>{feedback.predictedScore}</b>/100
              </Text>
            )}
          </Flex>

          {loading && !feedback && <Skeleton h="40px" borderRadius="md" />}

          {feedback && (
            <Stack gap="4px" opacity={loading ? 0.6 : 1} transition="opacity 0.2s">
              {feedback.hints.length === 0 ? (
                <Text fontSize="sm" color="text.secondary">
                  Looking good — keep going.
                </Text>
              ) : (
                feedback.hints.map((hint, i) => (
                  <Text key={i} fontSize="sm" color="text.secondary">
                    • {hint}
                  </Text>
                ))
              )}
            </Stack>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}
