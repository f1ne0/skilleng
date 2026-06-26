import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Sparkles, Check } from 'lucide-react'
import { useState } from 'react'
import {
  Badge, Button, Card, Dialog, Link as RouterLink, NativeButton, Skeleton, showToast,
} from '@shared/ui'
import { questionsApi, contentApi, coursesApi, lessonsApi, extractApiError } from '@shared/api'
import type { GeneratedQuestion, LessonSkill, ContentSkill } from '@shared/api'
import type { QuestionType } from '@entities/question'

const TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Multiple choice',
  FILL_BLANK: 'Fill the blank',
  DRAG_DROP: 'Word order',
  MATCH_PAIRS: 'Match pairs',
  SHORT_WRITING: 'Short writing',
  SPEAKING_RESPONSE: 'Speaking response',
}

// Какие типы заданий уместны для каждого навыка урока
const SKILL_AI_TYPES: Record<LessonSkill, QuestionType[]> = {
  READING: ['MULTIPLE_CHOICE', 'FILL_BLANK', 'MATCH_PAIRS', 'SHORT_WRITING'],
  LISTENING: ['MULTIPLE_CHOICE', 'FILL_BLANK', 'DRAG_DROP'],
  SPEAKING: ['SPEAKING_RESPONSE'],
  WRITING: ['SHORT_WRITING'],
}
const DEFAULT_AI_TYPES: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'FILL_BLANK',
  'DRAG_DROP',
  'MATCH_PAIRS',
]
// Навык урока (Skill) → ContentSkill для генератора
const SKILL_LABEL: Record<LessonSkill, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  SPEAKING: 'Speaking',
  WRITING: 'Writing',
}

export function TeachQuestionsListPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  // AI-генерация вопросов для этого урока
  const [aiOpen, setAiOpen] = useState(false)
  const [aiCount, setAiCount] = useState(5)
  const [aiTypes, setAiTypes] = useState<QuestionType[]>(['MULTIPLE_CHOICE', 'FILL_BLANK'])
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const query = useQuery({
    queryKey: ['questions', 'byLesson', lessonId],
    queryFn: () => questionsApi.byLessonForTeacher(lessonId!),
    enabled: Boolean(lessonId),
  })

  const lessonQuery = useQuery({
    queryKey: ['lessons', 'detail', lessonId],
    queryFn: () => lessonsApi.byId(lessonId!),
    enabled: Boolean(lessonId),
  })
  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', courseId],
    queryFn: () => coursesApi.byId(courseId!),
    enabled: Boolean(courseId),
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      contentApi.generateQuestions({
        topic: lessonQuery.data?.title ?? 'English lesson',
        level: courseQuery.data?.level ?? 'B1',
        // навык урока учитывается генератором
        ...(lessonQuery.data?.skillFocus
          ? { skill: lessonQuery.data.skillFocus as ContentSkill }
          : {}),
        types: aiTypes,
        count: aiCount,
      }),
    onSuccess: (res) => {
      setGenerated(res.questions)
      setSelected(new Set(res.questions.map((_, i) => i)))
      if (res.generated < res.requested) {
        showToast({ type: 'info', title: `Generated ${res.generated} of ${res.requested}` })
      }
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = generated.filter((_, i) => selected.has(i))
      for (const q of items) {
        await questionsApi.create(lessonId!, {
          type: q.type,
          prompt: q.prompt,
          payload: q.payload,
          explanation: q.explanation ?? undefined,
        })
      }
      return items.length
    },
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ['questions', 'byLesson', lessonId] })
      showToast({ type: 'success', title: `Saved ${saved} questions` })
      setAiOpen(false)
      setGenerated([])
      setSelected(new Set())
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const toggleAiType = (t: QuestionType) =>
    setAiTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  const toggleSelected = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const reorderMutation = useMutation({
    mutationFn: (questionIds: string[]) => questionsApi.reorder(lessonId!, questionIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions', 'byLesson', lessonId] }),
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionsApi.remove(id),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Question deleted' })
      await qc.invalidateQueries({ queryKey: ['questions', 'byLesson', lessonId] })
      setPendingDelete(null)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const questions = [...(query.data ?? [])].sort((a, b) => a.order - b.order)

  // Навык урока определяет, какие типы заданий уместны
  const lessonSkill = (lessonQuery.data?.skillFocus ?? null) as LessonSkill | null
  const allowedTypes = lessonSkill ? SKILL_AI_TYPES[lessonSkill] : DEFAULT_AI_TYPES

  const openAi = () => {
    // по умолчанию выбираем все типы, подходящие навыку
    setAiTypes(allowedTypes)
    setAiOpen(true)
  }

  const move = (idx: number, delta: number) => {
    const next = [...questions]
    const target = idx + delta
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target]!, next[idx]!]
    reorderMutation.mutate(next.map((q) => q.id))
  }

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="900px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink
            to={`/teach/courses/${courseId}/lessons/${lessonId}/edit`}
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="sm"
            color="text.tertiary"
            textDecoration="none"
            _hover={{ color: 'text.primary' }}
          >
            <ArrowLeft size={14} />
            Lesson
          </RouterLink>
        </Box>

        <Flex
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap="14px"
          mb="20px"
          direction={{ base: 'column', md: 'row' }}
        >
          <Stack gap="6px">
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="semibold"
              letterSpacing="tight"
              lineHeight="tight"
            >
              Questions
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              Drag-drop exercises and short writing prompts.
            </Text>
          </Stack>
          <Flex gap="8px" wrap="wrap">
            <Button
              variant="secondary"
              leftIcon={<Sparkles size={14} />}
              onClick={openAi}
            >
              Generate with AI
            </Button>
            <Button
              leftIcon={<Plus size={14} />}
              onClick={() =>
                navigate(`/teach/courses/${courseId}/lessons/${lessonId}/questions/new`)
              }
            >
              New question
            </Button>
          </Flex>
        </Flex>

        {query.isLoading ? (
          <Stack gap="8px">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} h="64px" borderRadius="md" />
            ))}
          </Stack>
        ) : questions.length === 0 ? (
          <Card padding="spacious">
            <Stack gap="6px" align="center" textAlign="center" py="24px">
              <Text fontSize="md" fontWeight="semibold">No questions yet</Text>
              <Text fontSize="sm" color="text.secondary">
                Add questions yourself or let AI generate them for this lesson.
              </Text>
              <Flex mt="8px" gap="8px">
                <Button size="sm" variant="secondary" leftIcon={<Sparkles size={13} />}
                  onClick={openAi}>
                  Generate with AI
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(`/teach/courses/${courseId}/lessons/${lessonId}/questions/new`)
                  }
                >
                  Add question
                </Button>
              </Flex>
            </Stack>
          </Card>
        ) : (
          <Card padding="tight">
            <Stack gap="0" maxH="62vh" overflowY="auto">
              {questions.map((q, idx) => (
                <Flex
                  key={q.id}
                  align="center"
                  gap="12px"
                  py="12px"
                  px="12px"
                  borderTop={idx === 0 ? 'none' : '1px solid'}
                  borderColor="border.subtle"
                >
                  <Box color="text.tertiary" fontFamily="mono" fontSize="sm" minW="28px" textAlign="center">
                    {String(idx + 1).padStart(2, '0')}
                  </Box>
                  <Stack gap="4px" flex="1" minW="0">
                    <Flex align="center" gap="8px" wrap="wrap">
                      <Text fontSize="sm" fontWeight="medium" lineHeight="tight" truncate>
                        {q.prompt}
                      </Text>
                    </Flex>
                    <Flex gap="6px" align="center">
                      <Badge tone="neutral" intensity="subtle" shape="pill">
                        {TYPE_LABEL[q.type]}
                      </Badge>
                      <Text fontSize="xs" color="text.tertiary">+{q.points} XP</Text>
                    </Flex>
                  </Stack>
                  <Flex gap="2px" flexShrink={0}>
                    <ArrowButton
                      label="Up"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0 || reorderMutation.isPending}
                    >
                      <ChevronUp size={14} />
                    </ArrowButton>
                    <ArrowButton
                      label="Down"
                      onClick={() => move(idx, 1)}
                      disabled={idx === questions.length - 1 || reorderMutation.isPending}
                    >
                      <ChevronDown size={14} />
                    </ArrowButton>
                    <ArrowButton
                      label="Edit"
                      onClick={() =>
                        navigate(
                          `/teach/courses/${courseId}/lessons/${lessonId}/questions/${q.id}/edit`,
                        )
                      }
                    >
                      <Pencil size={13} />
                    </ArrowButton>
                    <ArrowButton
                      label="Delete"
                      onClick={() => setPendingDelete(q.id)}
                      tone="error"
                    >
                      <Trash2 size={13} />
                    </ArrowButton>
                  </Flex>
                </Flex>
              ))}
            </Stack>
          </Card>
        )}
      </Container>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete question?"
        description="This question and student submissions for it will be removed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
            >
              Delete
            </Button>
          </>
        }
      />

      {/* AI-генерация вопросов для урока */}
      <Dialog
        open={aiOpen}
        onOpenChange={(o) => { if (!o) { setAiOpen(false); setGenerated([]); setSelected(new Set()) } }}
        title="Generate questions with AI"
        size="lg"
        footer={
          generated.length === 0 ? (
            <>
              <Button variant="ghost" onClick={() => setAiOpen(false)}>Cancel</Button>
              <Button leftIcon={<Sparkles size={14} />} loading={generateMutation.isPending}
                disabled={aiTypes.length === 0} onClick={() => generateMutation.mutate()}>
                Generate
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => { setGenerated([]); setSelected(new Set()) }}
                disabled={saveMutation.isPending}>
                Back
              </Button>
              <Button loading={saveMutation.isPending} disabled={selected.size === 0}
                onClick={() => saveMutation.mutate()}>
                Save {selected.size} to lesson
              </Button>
            </>
          )
        }
      >
        {generated.length === 0 ? (
          <Stack gap="16px">
            <Text fontSize="sm" color="text.secondary">
              Questions will be based on this lesson{lessonQuery.data?.title ? `: “${lessonQuery.data.title}”` : ''}
              {courseQuery.data?.level ? `, level ${courseQuery.data.level}` : ''}
              {lessonSkill ? `, skill ${SKILL_LABEL[lessonSkill]}` : ''}. Review and pick before saving.
            </Text>
            <Box>
              <Flex align="center" justify="space-between" mb="6px">
                <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
                  Question types
                </Text>
                {lessonSkill && (
                  <Badge tone="accent" intensity="subtle" shape="pill">
                    {SKILL_LABEL[lessonSkill]} tasks
                  </Badge>
                )}
              </Flex>
              <Flex gap="6px" wrap="wrap">
                {allowedTypes.map((t) => {
                  const active = aiTypes.includes(t)
                  return (
                    <NativeButton key={t} type="button" onClick={() => toggleAiType(t)}
                      px="12px" h="32px" borderRadius="full" border="1px solid"
                      bg={active ? 'accent.surface' : 'bg.subtle'}
                      color={active ? 'accent.text' : 'text.secondary'}
                      borderColor={active ? 'border.accent' : 'border.subtle'}
                      fontSize="xs" fontWeight="medium" cursor="pointer">
                      {TYPE_LABEL[t]}
                    </NativeButton>
                  )
                })}
              </Flex>
            </Box>
            <Box>
              <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
                How many
              </Text>
              <Flex gap="6px" wrap="wrap">
                {[3, 5, 8, 10].map((n) => (
                  <NativeButton key={n} type="button" onClick={() => setAiCount(n)}
                    px="14px" h="32px" borderRadius="full" border="1px solid"
                    bg={aiCount === n ? 'accent.surface' : 'bg.subtle'}
                    color={aiCount === n ? 'accent.text' : 'text.secondary'}
                    borderColor={aiCount === n ? 'border.accent' : 'border.subtle'}
                    fontSize="xs" fontWeight="medium" cursor="pointer">
                    {n}
                  </NativeButton>
                ))}
              </Flex>
            </Box>
          </Stack>
        ) : (
          <Stack gap="8px">
            <Text fontSize="xs" color="text.tertiary">{selected.size} of {generated.length} selected</Text>
            {generated.map((q, i) => {
              const active = selected.has(i)
              return (
                <Flex key={i} gap="10px" align="flex-start" px="12px" py="10px" borderRadius="md"
                  bg="bg.subtle" border="1px solid" borderColor={active ? 'border.accent' : 'border.subtle'}
                  cursor="pointer" onClick={() => toggleSelected(i)}>
                  <Box mt="2px" w="16px" h="16px" borderRadius="sm" flexShrink={0}
                    display="flex" alignItems="center" justifyContent="center"
                    bg={active ? 'accent.solid' : 'transparent'} border="1px solid"
                    borderColor={active ? 'accent.solid' : 'border.default'} color="#fff">
                    {active && <Check size={12} />}
                  </Box>
                  <Stack gap="2px" minW="0">
                    <Text fontSize="sm" fontWeight="medium">{q.prompt}</Text>
                    <Badge tone="neutral" intensity="subtle" shape="pill">{TYPE_LABEL[q.type]}</Badge>
                  </Stack>
                </Flex>
              )
            })}
          </Stack>
        )}
      </Dialog>
    </Box>
  )
}

function ArrowButton({
  children, onClick, disabled, label, tone,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  label: string
  tone?: 'error'
}) {
  return (
    <NativeButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="28px"
      h="28px"
      bg="transparent"
      border="1px solid"
      borderColor="transparent"
      borderRadius="sm"
      color={tone === 'error' ? 'error' : 'text.tertiary'}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.4 : 1}
      _hover={!disabled ? { bg: 'bg.subtle', color: tone === 'error' ? 'error' : 'text.primary' } : undefined}
    >
      {children}
    </NativeButton>
  )
}
