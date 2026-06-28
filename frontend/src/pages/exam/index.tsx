import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, X, Award } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { examsApi, extractApiError } from '@shared/api'
import type { ExamQuestionView, ExamStartResponse, ExamSubmitResponse } from '@shared/api'
import { Badge, Button, Card, Input, NativeButton, Skeleton, showToast } from '@shared/ui'

type LocalAnswer =
  | { kind: 'mc'; selectedIndex: number | null }
  | { kind: 'fill'; text: string }
  | { kind: 'drag'; ordered: string[]; pool: string[] }
  | { kind: 'match'; mapping: Record<number, number> }

function initAnswer(q: ExamQuestionView): LocalAnswer {
  switch (q.type) {
    case 'MULTIPLE_CHOICE':
      return { kind: 'mc', selectedIndex: null }
    case 'FILL_BLANK':
      return { kind: 'fill', text: '' }
    case 'DRAG_DROP':
      return { kind: 'drag', ordered: [], pool: [...((q.payload.words as string[]) ?? [])] }
    case 'MATCH_PAIRS':
      return { kind: 'match', mapping: {} }
    default:
      return { kind: 'fill', text: '' }
  }
}

function toServer(q: ExamQuestionView, a: LocalAnswer): Record<string, unknown> {
  if (a.kind === 'mc') return { selectedIndex: a.selectedIndex ?? -1 }
  if (a.kind === 'fill') return { answer: a.text }
  if (a.kind === 'drag') return { orderedWords: a.ordered }
  // match: mapping leftIndex -> rightIndex
  const lefts = (q.payload.lefts as string[]) ?? []
  const rights = (q.payload.rights as string[]) ?? []
  return {
    matches: Object.entries(a.mapping).map(([li, ri]) => ({
      left: lefts[Number(li)] ?? '',
      right: rights[ri] ?? '',
    })),
  }
}

function isReady(a: LocalAnswer): boolean {
  if (a.kind === 'mc') return a.selectedIndex !== null
  if (a.kind === 'fill') return a.text.trim().length > 0
  if (a.kind === 'drag') return a.pool.length === 0 && a.ordered.length > 0
  return Object.keys(a.mapping).length > 0
}

export function ExamPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<ExamStartResponse | null>(null)
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({})
  const [matchLeft, setMatchLeft] = useState<number | null>(null)
  const [result, setResult] = useState<ExamSubmitResponse | null>(null)

  const startMutation = useMutation({
    mutationFn: () => examsApi.start(examId!),
    onSuccess: (data) => {
      setSession(data)
      setAnswers(Object.fromEntries(data.questions.map((q) => [q.id, initAnswer(q)])))
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      examsApi.submit(
        session!.attemptId,
        session!.questions.map((q) => ({
          questionId: q.id,
          answer: toServer(q, answers[q.id] ?? initAnswer(q)),
        })),
      ),
    onSuccess: setResult,
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const answeredCount = useMemo(
    () => Object.values(answers).filter(isReady).length,
    [answers],
  )

  const update = (qid: string, a: LocalAnswer) =>
    setAnswers((prev) => ({ ...prev, [qid]: a }))

  // ===== старт =====
  if (!session && !result) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="640px" py="48px" px="20px">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
            <ArrowLeft size={15} /> Back
          </Button>
          <Card padding="spacious">
            <Stack align="center" textAlign="center" gap="14px" py="20px">
              <Box w="56px" h="56px" borderRadius="xl" bg="accent.subtle" color="accent.text"
                display="flex" alignItems="center" justifyContent="center">
                <Award size={26} />
              </Box>
              <Heading as="h1" fontSize="2xl" fontWeight="semibold">Ready for the exam?</Heading>
              <Text fontSize="sm" color="text.secondary" maxW="420px">
                You'll answer all questions, then get your score instantly. Make sure
                you have time to finish in one sitting.
              </Text>
              <Button onClick={() => startMutation.mutate()} loading={startMutation.isPending} style={{ marginTop: 6 }}>
                Start exam
              </Button>
            </Stack>
          </Card>
        </Container>
      </Box>
    )
  }

  // ===== результат =====
  if (result) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="640px" py="48px" px="20px">
          <Card padding="spacious">
            <Stack align="center" textAlign="center" gap="14px" py="16px">
              <Box w="80px" h="80px" borderRadius="full"
                bg={result.passed ? 'accent.subtle' : 'rgba(244,63,94,0.12)'}
                color={result.passed ? 'accent.text' : 'error'}
                display="flex" alignItems="center" justifyContent="center"
                fontSize="2xl" fontWeight="bold">
                {result.score}%
              </Box>
              <Heading as="h1" fontSize="2xl" fontWeight="semibold">
                {result.passed ? 'Passed' : 'Not passed'}
              </Heading>
              <Text fontSize="sm" color="text.secondary">
                {result.earnedPoints} of {result.totalPoints} points
              </Text>
              <Stack gap="6px" w="100%" mt="10px" textAlign="left">
                {result.breakdown.map((b, i) => (
                  <Flex key={b.questionId} align="center" gap="10px" px="12px" py="8px"
                    borderRadius="md" bg="bg.subtle">
                    <Box color={b.isCorrect ? 'accent.text' : 'error'} flexShrink={0}>
                      {b.isCorrect ? <Check size={15} /> : <X size={15} />}
                    </Box>
                    <Text fontSize="sm" color="text.secondary" lineClamp={1}>
                      {i + 1}. {b.prompt}
                    </Text>
                  </Flex>
                ))}
              </Stack>
              <Button onClick={() => navigate(-1)} style={{ marginTop: 10 }}>
                Done
              </Button>
            </Stack>
          </Card>
        </Container>
      </Box>
    )
  }

  if (startMutation.isPending || !session) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="720px" py="32px" px="20px">
          <Skeleton h="400px" borderRadius="xl" />
        </Container>
      </Box>
    )
  }

  // ===== прохождение =====
  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="720px" py="32px" px="20px">
        <Flex justify="space-between" align="center" mb="20px" wrap="wrap" gap="8px">
          <Stack gap="2px">
            <Heading as="h1" fontSize="xl" fontWeight="semibold">{session.exam.title}</Heading>
            {session.exam.unitsLabel && (
              <Text fontSize="sm" color="text.tertiary">{session.exam.unitsLabel}</Text>
            )}
          </Stack>
          <Badge tone="neutral" shape="pill">
            {answeredCount}/{session.questions.length} answered
          </Badge>
        </Flex>

        <Stack gap="14px">
          {session.questions.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.4) }}>
              <Card padding="comfortable">
                <Stack gap="12px">
                  <Text fontSize="md" fontWeight="medium">{i + 1}. {q.prompt}</Text>
                  <QuestionBody
                    q={q}
                    answer={answers[q.id] ?? initAnswer(q)}
                    onChange={(a) => update(q.id, a)}
                    matchLeft={matchLeft}
                    setMatchLeft={setMatchLeft}
                  />
                </Stack>
              </Card>
            </motion.div>
          ))}
        </Stack>

        <Box position="sticky" bottom="0" py="16px" mt="8px"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--se-colors-bg-canvas) 40%)' }}>
          <Button
            onClick={() => submitMutation.mutate()}
            loading={submitMutation.isPending}
            disabled={answeredCount === 0}
            style={{ width: '100%' }}
          >
            Submit exam ({answeredCount}/{session.questions.length})
          </Button>
        </Box>
      </Container>
    </Box>
  )
}

function QuestionBody({
  q, answer, onChange, matchLeft, setMatchLeft,
}: {
  q: ExamQuestionView
  answer: LocalAnswer
  onChange: (a: LocalAnswer) => void
  matchLeft: number | null
  setMatchLeft: (i: number | null) => void
}) {
  if (answer.kind === 'mc') {
    const options = (q.payload.options as string[]) ?? []
    return (
      <Stack gap="8px">
        {options.map((opt, i) => {
          const active = answer.selectedIndex === i
          return (
            <NativeButton key={i} onClick={() => onChange({ kind: 'mc', selectedIndex: i })}
              px="14px" py="10px" borderRadius="lg" border="1px solid"
              borderColor={active ? 'accent.solid' : 'border.default'}
              bg={active ? 'accent.subtle' : 'transparent'} textAlign="left"
              display="flex" alignItems="center" justifyContent="space-between">
              <Text fontSize="sm">{opt}</Text>
              {active && <Check size={15} />}
            </NativeButton>
          )
        })}
      </Stack>
    )
  }

  if (answer.kind === 'fill') {
    const sentence = (q.payload.text as string) ?? ''
    const parts = sentence.split('___')
    return (
      <Stack gap="12px">
        {sentence && (
          <Text fontSize="lg" lineHeight="relaxed">
            {parts[0]}
            <Box as="span" display="inline-block" minW="64px" borderBottom="2px solid"
              borderColor="accent.solid" mx="4px" verticalAlign="baseline" />
            {parts[1]}
          </Text>
        )}
        <Input value={answer.text} onChange={(e) => onChange({ kind: 'fill', text: e.target.value })}
          placeholder="Type your answer…" />
      </Stack>
    )
  }

  if (answer.kind === 'drag') {
    return (
      <Stack gap="10px">
        <Flex gap="6px" wrap="wrap" minH="40px" p="8px" borderRadius="md" bg="bg.subtle">
          {answer.ordered.length === 0 && (
            <Text fontSize="xs" color="text.tertiary">Tap words below to build the sentence</Text>
          )}
          {answer.ordered.map((w, i) => (
            <NativeButton key={`${w}-${i}`} onClick={() => onChange({
              kind: 'drag',
              ordered: answer.ordered.filter((_, idx) => idx !== i),
              pool: [...answer.pool, w],
            })} px="10px" py="5px" borderRadius="md" bg="accent.subtle" color="accent.text" fontSize="sm">
              {w}
            </NativeButton>
          ))}
        </Flex>
        <Flex gap="6px" wrap="wrap">
          {answer.pool.map((w, i) => (
            <NativeButton key={`${w}-${i}`} onClick={() => onChange({
              kind: 'drag',
              ordered: [...answer.ordered, w],
              pool: answer.pool.filter((_, idx) => idx !== i),
            })} px="10px" py="5px" borderRadius="md" border="1px solid" borderColor="border.default" fontSize="sm">
              {w}
            </NativeButton>
          ))}
        </Flex>
      </Stack>
    )
  }

  // match
  const lefts = (q.payload.lefts as string[]) ?? []
  const rights = (q.payload.rights as string[]) ?? []
  const usedRights = new Set(Object.values(answer.mapping))

  // номера пар (1,2,3…) — компактная подсветка без дублирования текста
  const pairNumber: Record<number, number> = {}
  const rightToLeft: Record<number, number> = {}
  {
    let n = 0
    lefts.forEach((_, li) => {
      const ri = answer.mapping[li]
      if (ri !== undefined) {
        n += 1
        pairNumber[li] = n
        rightToLeft[ri] = li
      }
    })
  }

  return (
    <Flex gap={{ base: '8px', md: '14px' }} align="flex-start">
      <Stack gap="6px" flex="1" minW="0">
        {lefts.map((l, li) => {
          const matched = answer.mapping[li] !== undefined
          const active = matchLeft === li
          return (
            <NativeButton key={li} onClick={() => setMatchLeft(active ? null : li)}
              display="flex" alignItems="center" gap="8px" w="100%"
              px="12px" py="8px" borderRadius="md" border="1px solid"
              borderColor={active ? 'accent.solid' : matched ? 'accent.subtle' : 'border.default'}
              bg={matched ? 'accent.subtle' : 'transparent'} textAlign="left" fontSize="sm"
              css={{ overflowWrap: 'anywhere' }}>
              <Box flex="1" minW="0">{l}</Box>
              {pairNumber[li] && <PairBadge n={pairNumber[li]} />}
            </NativeButton>
          )
        })}
      </Stack>
      <Stack gap="6px" flex="1" minW="0">
        {rights.map((r, ri) => {
          const used = usedRights.has(ri)
          const li = rightToLeft[ri]
          const badgeNum = li !== undefined ? pairNumber[li] : undefined
          return (
            <NativeButton key={ri} disabled={used}
              onClick={() => {
                if (matchLeft === null) return
                onChange({ kind: 'match', mapping: { ...answer.mapping, [matchLeft]: ri } })
                setMatchLeft(null)
              }}
              display="flex" alignItems="center" gap="8px" w="100%"
              px="12px" py="8px" borderRadius="md" border="1px solid" borderColor="border.default"
              opacity={used ? 0.4 : 1} textAlign="left" fontSize="sm"
              css={{ overflowWrap: 'anywhere' }}>
              <Box flex="1" minW="0">{r}</Box>
              {badgeNum ? <PairBadge n={badgeNum} /> : null}
            </NativeButton>
          )
        })}
      </Stack>
    </Flex>
  )
}

function PairBadge({ n }: { n: number }) {
  return (
    <Flex
      flexShrink={0}
      w="20px"
      h="20px"
      borderRadius="full"
      bg="accent.solid"
      color="text.onAccent"
      align="center"
      justify="center"
      fontSize="11px"
      fontWeight="bold"
    >
      {n}
    </Flex>
  )
}
