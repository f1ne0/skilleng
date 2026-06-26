import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Sparkles, Check, ArrowUpRight, Quote } from 'lucide-react'
import { Card } from '@shared/ui'
import { answersApi } from '@shared/api'
import type { ParsedAiFeedback } from '@shared/api'

interface Props {
  questionId: string
  kind: 'speaking' | 'short-writing'
  /** Вызывается, когда AI-оценка пришла (или истёк таймаут) — чтобы разблокировать «Continue». */
  onResolved?: () => void
}

function parse(raw: string | null): ParsedAiFeedback | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as ParsedAiFeedback
  } catch {
    return null
  }
}

function scoreColor(score: number): string {
  if (score >= 85) return 'var(--se-colors-accent-solid)'
  if (score >= 70) return '#22C55E'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

/**
 * Показывает AI-оценку речи/письма. Опрашивает myAnswer каждые 2с,
 * пока не придёт aiScore (оценка считается асинхронно на бэкенде).
 */
export function AiFeedbackCard({ questionId, kind, onResolved }: Props) {
  // через 45с прекращаем ждать оценку и показываем запасной текст
  const [gaveUp, setGaveUp] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setGaveUp(true), 45000)
    return () => clearTimeout(t)
  }, [])

  const query = useQuery({
    queryKey: ['answer', 'me', questionId],
    queryFn: () => answersApi.myAnswer(questionId),
    refetchInterval: (q) => {
      const data = q.state.data
      if (data && data.aiScore != null) return false
      return gaveUp ? false : 2000
    },
    refetchOnWindowFocus: false,
  })

  const ans = query.data
  const scored = ans && ans.aiScore != null
  const fb = scored ? parse(ans!.aiFeedback) : null

  // разблокируем «Continue», когда оценка пришла или истёк таймаут
  useEffect(() => {
    if (scored || gaveUp) onResolved?.()
  }, [scored, gaveUp, onResolved])

  if (!scored) {
    return (
      <Card padding="comfortable">
        <Flex align="center" gap="10px">
          {gaveUp ? (
            <Text fontSize="sm" color="text.secondary">
              Your {kind === 'speaking' ? 'recording' : 'writing'} was saved. Detailed AI feedback isn't ready yet — check back on this lesson later.
            </Text>
          ) : (
            <>
              <Box className="se-spark" color="accent.text" display="inline-flex">
                <Sparkles size={16} />
              </Box>
              <Text fontSize="sm" color="text.secondary">
                AI is reviewing your {kind === 'speaking' ? 'recording' : 'writing'}…
              </Text>
            </>
          )}
        </Flex>
      </Card>
    )
  }

  const score = ans!.aiScore as number

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card padding="comfortable">
        <Stack gap="16px">
          <Flex align="center" justify="space-between" gap="12px">
            <Flex align="center" gap="8px">
              <Sparkles size={16} color="var(--se-colors-accent-solid)" />
              <Text fontSize="sm" fontWeight="semibold">AI feedback</Text>
            </Flex>
            <Flex align="baseline" gap="4px">
              <Text fontSize="2xl" fontWeight="bold" fontFamily="mono" color={scoreColor(score)}>
                {score}
              </Text>
              <Text fontSize="xs" color="text.tertiary">/ 100</Text>
            </Flex>
          </Flex>

          {/* шкала балла */}
          <Box h="6px" w="100%" bg="bg.muted" borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${score}%`} borderRadius="full" bg={scoreColor(score)} transition="width 400ms ease" />
          </Box>

          {kind === 'speaking' && fb?.transcript && (
            <Box>
              <Flex align="center" gap="6px" mb="4px" color="text.tertiary">
                <Quote size={12} />
                <Text fontSize="xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                  We heard
                </Text>
              </Flex>
              <Text fontSize="sm" color="text.secondary" fontStyle="italic" lineHeight="relaxed">
                “{fb.transcript}”
              </Text>
              <Text fontSize="xs" color="text.tertiary" mt="4px">
                If this matches what you intended, your pronunciation was clear enough to be understood.
              </Text>
            </Box>
          )}

          {fb?.feedback && (
            <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">
              {fb.feedback}
            </Text>
          )}

          {fb?.strengths && fb.strengths.length > 0 && (
            <Stack gap="6px">
              <Text fontSize="xs" fontWeight="semibold" color="accent.text" textTransform="uppercase" letterSpacing="wide">
                Strengths
              </Text>
              {fb.strengths.map((s, i) => (
                <Flex key={i} gap="8px" align="flex-start">
                  <Box color="accent.solid" mt="2px" flexShrink={0}><Check size={13} /></Box>
                  <Text fontSize="sm" color="text.secondary">{s}</Text>
                </Flex>
              ))}
            </Stack>
          )}

          {fb?.improvements && fb.improvements.length > 0 && (
            <Stack gap="6px">
              <Text fontSize="xs" fontWeight="semibold" color="text.tertiary" textTransform="uppercase" letterSpacing="wide">
                To improve
              </Text>
              {fb.improvements.map((s, i) => (
                <Flex key={i} gap="8px" align="flex-start">
                  <Box color="warning" mt="2px" flexShrink={0}><ArrowUpRight size={13} /></Box>
                  <Text fontSize="sm" color="text.secondary">{s}</Text>
                </Flex>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>
    </motion.div>
  )
}
