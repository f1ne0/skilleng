import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Box, Container, Flex, Stack } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  answersApi,
  coursesApi,
  lessonsApi,
  questionsApi,
  extractApiError,
} from '@shared/api'
import { Skeleton, Card, Button, showToast } from '@shared/ui'
import { PlayerHeader } from './components/PlayerHeader'
import { PlayerFooter } from './components/PlayerFooter'
import { FeedbackPanel } from './components/FeedbackPanel'
import { StepTheory } from './components/StepTheory'
import { StepMultipleChoice } from './components/StepMultipleChoice'
import { StepFillBlank } from './components/StepFillBlank'
import { StepDragDrop } from './components/StepDragDrop'
import { StepMatchPairs } from './components/StepMatchPairs'
import { StepShortWriting } from './components/StepShortWriting'
import { StepSpeaking } from './components/StepSpeaking'
import { AiFeedbackCard } from './components/AiFeedbackCard'
import { WritingLiveFeedback } from '@features/writing-live-feedback'
import { CompletionScreen } from './components/CompletionScreen'
import {
  answerToServerPayload,
  buildLessonSteps,
  isAnswerReady,
} from './adapter'
import type { LessonStep, LocalAnswer, StepFeedback, StepStatus } from './types'

export function LessonPlayerPage() {
  const { slug, lessonSlug } = useParams<{ slug: string; lessonSlug: string }>()

  const courseQuery = useQuery({
    queryKey: ['courses', 'slug', slug],
    queryFn: () => coursesApi.bySlug(slug!),
    enabled: Boolean(slug),
  })

  // `lessonSlug` here is actually lesson ID (backend has no slug).
  const lessonId = lessonSlug
  const lessonQuery = useQuery({
    queryKey: ['lessons', 'detail', lessonId],
    queryFn: () => lessonsApi.byId(lessonId!),
    enabled: Boolean(lessonId),
  })

  const questionsQuery = useQuery({
    queryKey: ['questions', 'byLesson', 'me', lessonId],
    queryFn: () => questionsApi.byLessonForMe(lessonId!),
    enabled: Boolean(lessonId),
  })

  const steps = useMemo(() => {
    if (!lessonQuery.data || !questionsQuery.data) return []
    return buildLessonSteps(lessonQuery.data, questionsQuery.data)
  }, [lessonQuery.data, questionsQuery.data])

  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [status, setStatus] = useState<StepStatus>('pending')
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({})
  const [feedbackByStep, setFeedbackByStep] = useState<Record<string, StepFeedback>>({})
  /** Track step kinds for correct/wrong stats (theory steps excluded). */
  const [outcomes, setOutcomes] = useState<Record<string, boolean>>({})
  /** Pair-matching selected left index (UI state). */
  const [matchPairsSelected, setMatchPairsSelected] = useState<number | null>(null)
  /** Шаги речи/письма, по которым AI-оценка уже пришла (или истёк таймаут). */
  const [aiResolved, setAiResolved] = useState<Record<string, boolean>>({})
  const [completed, setCompleted] = useState(false)
  const [completionResult, setCompletionResult] = useState<{
    xpEarned: number
  } | null>(null)

  const qc = useQueryClient()
  const submitMutation = useMutation({
    mutationFn: ({
      questionId,
      answer,
      step,
    }: {
      questionId: string
      answer: LocalAnswer
      step: LessonStep
    }) => answersApi.submit(questionId, { answer: answerToServerPayload(answer, step) }),
  })
  const completeMutation = useMutation({
    mutationFn: () => lessonsApi.complete(lessonId!),
  })

  const isLoading = courseQuery.isLoading || lessonQuery.isLoading || questionsQuery.isLoading
  const loadError = courseQuery.error || lessonQuery.error || questionsQuery.error

  if (isLoading) return <LessonSkeleton />

  if (loadError) {
    return (
      <Box minH="100vh" bg="bg.canvas">
        <Container maxW="640px" py="64px">
          <Card padding="comfortable">
            <Box mb="10px" fontSize="md" fontWeight="semibold">Couldn't load lesson</Box>
            <Box fontSize="sm" color="text.secondary" mb="12px">{extractApiError(loadError)}</Box>
            <Button size="sm" onClick={() => {
              void courseQuery.refetch()
              void lessonQuery.refetch()
              void questionsQuery.refetch()
            }}>Try again</Button>
          </Card>
        </Container>
      </Box>
    )
  }

  if (!courseQuery.data || !lessonQuery.data) return <Navigate to="/courses" replace />
  if (steps.length === 0) return <Navigate to={`/courses/${courseQuery.data.slug}`} replace />

  const course = courseQuery.data
  const lesson = lessonQuery.data
  const currentStep = steps[stepIndex]!
  const currentAnswer = answers[currentStep.id]
  const currentFeedback = feedbackByStep[currentStep.id]

  const isCheckable = currentStep.kind !== 'theory'
  const isLast = stepIndex === steps.length - 1
  const canCheck = !submitMutation.isPending && isAnswerReady(currentAnswer, currentStep)

  const updateAnswer = (a: LocalAnswer) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: a }))
    if (status !== 'pending') {
      setStatus('pending')
    }
  }

  const handleCheck = async () => {
    if (!isCheckable || !currentAnswer) return
    // (проверка kind === 'theory' избыточна: isCheckable уже сузил тип — TS6133/TS2367)
    setStatus('checking')
    try {
      const res = await submitMutation.mutateAsync({
        questionId: currentStep.id,
        answer: currentAnswer,
        step: currentStep,
      })
      // isCorrect === null (pending) — ответ ушёл на AI-проверку;
      // не показываем "wrong", считаем шаг пройденным без вердикта
      const aiPending = res.isCorrect === null
      const verdict = res.isCorrect ?? true
      const feedback: StepFeedback = {
        isCorrect: verdict,
        explanation: res.explanation,
        correctAnswer: res.correctAnswer,
        aiPending,
      }
      setFeedbackByStep((prev) => ({ ...prev, [currentStep.id]: feedback }))
      setOutcomes((prev) => ({ ...prev, [currentStep.id]: verdict }))
      setStatus(verdict ? 'correct' : 'wrong')
    } catch (err) {
      showToast({ type: 'error', title: extractApiError(err) })
      setStatus('pending')
    }
  }

  const handleContinue = async () => {
    if (isLast) {
      try {
        const result = await completeMutation.mutateAsync()
        setCompletionResult({ xpEarned: result.xpEarned ?? 0 })
        await Promise.all([
          qc.invalidateQueries({ queryKey: ['progress', 'course', course.id] }),
          qc.invalidateQueries({ queryKey: ['lessons', 'byCourse', 'me', course.id] }),
          qc.invalidateQueries({ queryKey: ['gamification'] }),
          qc.invalidateQueries({ queryKey: ['progress', 'recent-activity'] }),
        ])
      } catch (err) {
        showToast({ type: 'error', title: extractApiError(err) })
        return
      }
      setCompleted(true)
      return
    }
    setDirection(1)
    setStepIndex((s) => s + 1)
    setStatus('pending')
    setMatchPairsSelected(null)
  }

  const exerciseStepsCount = steps.filter((s) => s.kind !== 'theory').length
  const correctCount = Object.values(outcomes).filter(Boolean).length

  if (completed) {
    return (
      <Box minH="100vh" bg="bg.canvas">
        <CompletionScreen
          courseSlug={course.slug}
          lessonTitle={lesson.title}
          correctCount={correctCount}
          totalExercises={exerciseStepsCount}
          xpEarned={completionResult?.xpEarned ?? 0}
        />
      </Box>
    )
  }

  return (
    <Flex direction="column" minH="100vh" bg="bg.canvas">
      <PlayerHeader
        courseSlug={course.slug}
        courseTitle={course.title}
        lessonTitle={lesson.title}
        stepIndex={stepIndex}
        totalSteps={steps.length}
      />

      <Box flex="1" position="relative" overflow="hidden">
        <Container maxW="720px" py={{ base: '24px', md: '40px' }} px={{ base: '20px', md: '32px' }}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={currentStep.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -32 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {currentStep.kind === 'theory' && <StepTheory step={currentStep} />}

              {currentStep.kind === 'multiple-choice' && (
                <StepMultipleChoice
                  step={currentStep}
                  selectedIndex={
                    currentAnswer?.kind === 'multiple-choice' ? currentAnswer.selectedIndex : null
                  }
                  status={status}
                  correctIndex={
                    currentFeedback?.correctAnswer && typeof currentFeedback.correctAnswer.correctIndex === 'number'
                      ? (currentFeedback.correctAnswer.correctIndex as number)
                      : null
                  }
                  onSelect={(idx) =>
                    updateAnswer({ kind: 'multiple-choice', selectedIndex: idx })
                  }
                />
              )}

              {currentStep.kind === 'fill-blank' && (
                <StepFillBlank
                  step={currentStep}
                  answer={currentAnswer?.kind === 'fill-blank' ? currentAnswer.text : ''}
                  status={status}
                  onChange={(v) => updateAnswer({ kind: 'fill-blank', text: v })}
                  onSubmit={handleCheck}
                />
              )}

              {currentStep.kind === 'drag-drop' && (
                <StepDragDrop
                  step={currentStep}
                  ordered={currentAnswer?.kind === 'drag-drop' ? currentAnswer.ordered : []}
                  status={status}
                  onChange={(ordered) => updateAnswer({ kind: 'drag-drop', ordered })}
                />
              )}

              {currentStep.kind === 'match-pairs' && (
                <StepMatchPairs
                  step={currentStep}
                  mapping={currentAnswer?.kind === 'match-pairs' ? currentAnswer.mapping : {}}
                  status={status}
                  onChange={(mapping) => updateAnswer({ kind: 'match-pairs', mapping })}
                  selectedLeft={matchPairsSelected}
                  onSelectLeft={setMatchPairsSelected}
                />
              )}

              {currentStep.kind === 'short-writing' && (
                <Stack gap="14px">
                  <StepShortWriting
                    step={currentStep}
                    text={currentAnswer?.kind === 'short-writing' ? currentAnswer.text : ''}
                    status={status}
                    onChange={(text) => updateAnswer({ kind: 'short-writing', text })}
                  />
                  <WritingLiveFeedback
                    questionId={currentStep.id}
                    draft={currentAnswer?.kind === 'short-writing' ? currentAnswer.text : ''}
                    enabled={status === 'pending'}
                  />
                </Stack>
              )}

              {currentStep.kind === 'speaking' && (
                <StepSpeaking
                  step={currentStep}
                  audioUrl={currentAnswer?.kind === 'speaking' ? currentAnswer.audioUrl : ''}
                  status={status}
                  onChange={(audioUrl) => updateAnswer({ kind: 'speaking', audioUrl })}
                />
              )}

              {isCheckable && (status === 'correct' || status === 'wrong') && currentFeedback && (
                currentFeedback.aiPending &&
                (currentStep.kind === 'speaking' || currentStep.kind === 'short-writing') ? (
                  <Box mt="20px">
                    <AiFeedbackCard
                      questionId={currentStep.id}
                      kind={currentStep.kind}
                      onResolved={() =>
                        setAiResolved((prev) =>
                          prev[currentStep.id] ? prev : { ...prev, [currentStep.id]: true },
                        )
                      }
                    />
                  </Box>
                ) : (
                  <FeedbackPanel
                    status={status}
                    aiPending={currentFeedback.aiPending}
                    correctAnswer={formatCorrectAnswer(currentStep, currentFeedback.correctAnswer)}
                    explanation={currentFeedback.explanation ?? undefined}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </Container>
      </Box>

      <PlayerFooter
        checkable={isCheckable}
        status={status}
        canCheck={canCheck}
        isLast={isLast}
        onCheck={handleCheck}
        onContinue={handleContinue}
        waitingAi={Boolean(currentFeedback?.aiPending) && !aiResolved[currentStep.id]}
      />
    </Flex>
  )
}

function formatCorrectAnswer(
  step: { kind: string },
  correct: Record<string, unknown> | null,
): string | undefined {
  if (!correct) return undefined
  switch (step.kind) {
    case 'multiple-choice':
      return typeof correct.correctText === 'string' ? correct.correctText : undefined
    case 'fill-blank':
      return Array.isArray(correct.correctAnswers)
        ? (correct.correctAnswers as string[]).join(' / ')
        : undefined
    case 'drag-drop':
      return Array.isArray(correct.words)
        ? (correct.words as string[]).join(' ')
        : undefined
    case 'match-pairs':
      return undefined
    default:
      return undefined
  }
}

function LessonSkeleton() {
  return (
    <Box minH="100vh" bg="bg.canvas">
      <Container maxW="720px" py="40px">
        <Skeleton h="48px" mb="24px" borderRadius="md" />
        <Skeleton h="32px" mb="14px" borderRadius="md" />
        <Skeleton h="200px" borderRadius="lg" />
      </Container>
    </Box>
  )
}
