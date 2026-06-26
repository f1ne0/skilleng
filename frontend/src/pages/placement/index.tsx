import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gauge, Check } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { placementApi, authApi, extractApiError } from '@shared/api'
import type { PlacementQuestion, PlacementProgress, PlacementResult } from '@shared/api'
import { useAuthStore } from '@entities/user'
import { Button, Card, Input, NativeButton, showToast } from '@shared/ui'

/**
 * Адаптивный входной тест (CAT): один вопрос за раз, сложность подстраивается
 * под ответы. Банк — MULTIPLE_CHOICE (+ поддержан FILL_BLANK на случай
 * ручного наполнения банка).
 */
export function PlacementPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [testId, setTestId] = useState<string | null>(null)
  const [question, setQuestion] = useState<PlacementQuestion | null>(null)
  const [progress, setProgress] = useState<PlacementProgress | null>(null)
  const [result, setResult] = useState<PlacementResult | null>(null)

  // локальный ответ на текущий вопрос
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [blankText, setBlankText] = useState('')

  const startMutation = useMutation({
    mutationFn: placementApi.start,
    onSuccess: (data) => {
      setTestId(data.testId)
      setQuestion(data.question)
      setProgress(data.progress)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const answerMutation = useMutation({
    mutationFn: (payload: { itemId: string; answer: Record<string, unknown> }) =>
      placementApi.answer(testId!, payload),
    onSuccess: async (data) => {
      setSelectedIndex(null)
      setBlankText('')
      if (data.done) {
        setQuestion(null)
        setResult(data.result)
        // уровень записан в профиль на бэке — обновляем локальный стор
        try {
          const me = await authApi.me()
          setUser(me)
        } catch {
          // не критично: при следующем заходе подтянется
        }
        void qc.invalidateQueries({ queryKey: ['users', 'me'] })
      } else {
        setQuestion(data.question)
        setProgress(data.progress)
      }
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const submitAnswer = () => {
    if (!question) return
    const answer =
      question.type === 'MULTIPLE_CHOICE'
        ? { selectedIndex }
        : { answer: blankText.trim() }
    answerMutation.mutate({ itemId: question.itemId, answer })
  }

  const canSubmit =
    !answerMutation.isPending &&
    (question?.type === 'MULTIPLE_CHOICE'
      ? selectedIndex !== null
      : blankText.trim().length > 0)

  // ===== стартовый экран =====
  if (!testId && !result) {
    return (
      <Box minH="100vh" bg="bg.canvas">
        <Container maxW="560px" py="64px" px="20px">
          <Card padding="spacious">
            <Stack align="center" textAlign="center" gap="14px" py="16px">
              <Gauge size={32} />
              <Heading as="h1" fontSize="2xl" fontWeight="semibold">
                Find your English level
              </Heading>
              <Text fontSize="sm" color="text.secondary" maxW="420px">
                An adaptive test: questions get harder when you answer correctly
                and easier when you don't. Up to 15 questions, about 10 minutes.
                Your CEFR level will be saved to your profile.
              </Text>
              <Button
                onClick={() => startMutation.mutate()}
                loading={startMutation.isPending}
                style={{ marginTop: 8 }}
              >
                Start the test
              </Button>
              <NativeButton
                onClick={() => navigate(-1)}
                color="text.tertiary"
                fontSize="sm"
              >
                Maybe later
              </NativeButton>
            </Stack>
          </Card>
        </Container>
      </Box>
    )
  }

  // ===== экран результата =====
  if (result) {
    return (
      <Box minH="100vh" bg="bg.canvas">
        <Container maxW="560px" py="64px" px="20px">
          <Card padding="spacious">
            <Stack align="center" textAlign="center" gap="14px" py="16px">
              <Box
                w="72px"
                h="72px"
                borderRadius="full"
                bg="accent.subtle"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="2xl"
                fontWeight="bold"
                color="accent.text"
              >
                {result.estimatedLevel}
              </Box>
              <Heading as="h1" fontSize="2xl" fontWeight="semibold">
                Your level: {result.estimatedLevel}
              </Heading>
              <Text fontSize="sm" color="text.secondary" maxW="420px">
                Estimated from {result.questionsAsked} adaptive questions and
                saved to your profile. Lessons will be matched to this level.
              </Text>
              <Button
                onClick={() =>
                  navigate(user?.onboardingCompleted ? '/dashboard' : '/onboarding', {
                    replace: true,
                  })
                }
                style={{ marginTop: 8 }}
              >
                {user?.onboardingCompleted ? 'To dashboard' : 'Continue onboarding'}
              </Button>
            </Stack>
          </Card>
        </Container>
      </Box>
    )
  }

  // ===== вопрос =====
  return (
    <Box minH="100vh" bg="bg.canvas">
      <Container maxW="640px" py="40px" px="20px">
        {progress && (
          <Stack gap="8px" mb="24px">
            <Flex justify="space-between">
              <Text fontSize="xs" color="text.tertiary" textTransform="uppercase" letterSpacing="wide">
                Question {progress.asked + 1}
              </Text>
              <Text fontSize="xs" color="text.tertiary">
                up to {progress.max}
              </Text>
            </Flex>
            <Box h="6px" bg="bg.muted" borderRadius="full" overflow="hidden">
              <motion.div
                animate={{ width: `${(progress.asked / progress.max) * 100}%` }}
                transition={{ duration: 0.3 }}
                style={{ height: '100%', background: 'var(--se-colors-accent-solid)', borderRadius: 9999 }}
              />
            </Box>
          </Stack>
        )}

        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={question.itemId}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              <Card padding="spacious">
                <Stack gap="20px">
                  <Heading as="h2" fontSize="xl" fontWeight="semibold" lineHeight="snug">
                    {question.prompt}
                  </Heading>

                  {question.type === 'MULTIPLE_CHOICE' && (
                    <Stack gap="8px">
                      {((question.payload.options as string[]) ?? []).map((option, i) => {
                        const active = selectedIndex === i
                        return (
                          <NativeButton
                            key={i}
                            onClick={() => setSelectedIndex(i)}
                            px="16px"
                            py="12px"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={active ? 'accent.solid' : 'border.default'}
                            bg={active ? 'accent.subtle' : 'transparent'}
                            textAlign="left"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            transition="all 0.15s"
                          >
                            <Text fontSize="md">{option}</Text>
                            {active && <Check size={16} />}
                          </NativeButton>
                        )
                      })}
                    </Stack>
                  )}

                  {question.type === 'FILL_BLANK' && (
                    <Stack gap="10px">
                      <Text fontSize="md" color="text.secondary">
                        {String(question.payload.text ?? '')}
                      </Text>
                      <Input
                        value={blankText}
                        onChange={(e) => setBlankText(e.target.value)}
                        placeholder="Type the missing word…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && canSubmit) submitAnswer()
                        }}
                        autoFocus
                      />
                    </Stack>
                  )}

                  <Box>
                    <Button
                      onClick={submitAnswer}
                      disabled={!canSubmit}
                      loading={answerMutation.isPending}
                    >
                      Submit answer
                    </Button>
                  </Box>
                </Stack>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  )
}
