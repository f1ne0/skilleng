import { useMemo, useState } from 'react'
import {
  Box,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Sparkles, Check, Save } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  contentApi,
  coursesApi,
  lessonsApi,
  questionsApi,
  extractApiError,
} from '@shared/api'
import type { ContentSkill, GeneratedQuestion } from '@shared/api'
import type { CefrLevel, QuestionType } from '@shared/model'
import { Badge, Button, Card, Input, NativeButton, Skeleton, showToast } from '@shared/ui'

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const SKILLS: { value: ContentSkill; label: string }[] = [
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
  { value: 'READING', label: 'Reading' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'WRITING', label: 'Writing' },
  { value: 'SPEAKING', label: 'Speaking' },
]
const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
  { value: 'FILL_BLANK', label: 'Fill the blank' },
  { value: 'DRAG_DROP', label: 'Word order' },
  { value: 'MATCH_PAIRS', label: 'Match pairs' },
  { value: 'SHORT_WRITING', label: 'Short writing' },
]

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

export function TeachContentGeneratorPage() {
  const qc = useQueryClient()

  // --- параметры генерации ---
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState<CefrLevel>('B1')
  const [skill, setSkill] = useState<ContentSkill | null>(null)
  const [types, setTypes] = useState<QuestionType[]>(['MULTIPLE_CHOICE'])
  const [count, setCount] = useState(5)

  // --- результат ---
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // --- куда сохранять ---
  const [courseId, setCourseId] = useState<string | null>(null)
  const [lessonId, setLessonId] = useState<string | null>(null)

  const coursesQuery = useQuery({
    queryKey: ['courses', 'my', 'teach'],
    queryFn: coursesApi.my,
  })
  const lessonsQuery = useQuery({
    queryKey: ['lessons', 'byCourse', courseId],
    queryFn: () => lessonsApi.byCourse(courseId!),
    enabled: Boolean(courseId),
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      contentApi.generateQuestions({
        topic: topic.trim(),
        level,
        skill: skill ?? undefined,
        types,
        count,
      }),
    onSuccess: (data) => {
      setGenerated(data.questions)
      // по умолчанию выбраны все — преподаватель снимает лишние
      setSelected(new Set(data.questions.map((_, i) => i)))
      if (data.generated < data.requested) {
        showToast({
          type: 'info',
          title: `Generated ${data.generated} of ${data.requested} requested`,
          description: 'Some AI items failed validation and were dropped.',
        })
      }
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = generated.filter((_, i) => selected.has(i))
      for (const q of items) {
        // сохранение — явное действие; до этого момента превью нигде не хранится
        await questionsApi.create(lessonId!, {
          type: q.type,
          prompt: q.prompt,
          payload: q.payload,
          explanation: q.explanation ?? undefined,
        })
      }
      return items.length
    },
    onSuccess: (saved) => {
      void qc.invalidateQueries({ queryKey: ['questions'] })
      showToast({ type: 'success', title: `Saved ${saved} questions to the lesson` })
      setGenerated([])
      setSelected(new Set())
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const toggleType = (t: QuestionType) =>
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  const toggleSelected = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const canGenerate =
    topic.trim().length >= 2 && types.length > 0 && !generateMutation.isPending
  const canSave =
    Boolean(lessonId) && selected.size > 0 && !saveMutation.isPending

  const courses = [...(coursesQuery.data ?? [])].sort((a, b) => {
    const ap = a.slug.startsWith('english-for-it') ? 0 : 1
    const bp = b.slug.startsWith('english-for-it') ? 0 : 1
    if (ap !== bp) return ap - bp
    if (ap === 0) return a.slug.localeCompare(b.slug)
    return a.title.localeCompare(b.title)
  })
  const lessons = lessonsQuery.data ?? []

  const summary = useMemo(
    () =>
      generated.length > 0
        ? `${selected.size} of ${generated.length} selected`
        : null,
    [generated, selected],
  )

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="960px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Stack gap="6px" mb="28px">
          <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
            AI content generator
          </Heading>
          <Text fontSize="md" color="text.secondary">
            Generate level-appropriate exercises, review them, then save to a lesson.
            Nothing is saved until you confirm.
          </Text>
        </Stack>

        {/* ===== Параметры ===== */}
        <Card padding="comfortable">
          <Stack gap="16px">
            <Stack gap="4px">
              <Text fontSize="sm" fontWeight="medium">Topic</Text>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Travel and airports, Present Perfect, Job interviews…"
              />
            </Stack>

            <Stack gap="6px">
              <Text fontSize="sm" fontWeight="medium">CEFR level</Text>
              <Flex gap="8px" wrap="wrap">
                {LEVELS.map((l) => (
                  <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
                    {l}
                  </Chip>
                ))}
              </Flex>
            </Stack>

            <Stack gap="6px">
              <Text fontSize="sm" fontWeight="medium">Skill focus (optional)</Text>
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
            </Stack>

            <Stack gap="6px">
              <Text fontSize="sm" fontWeight="medium">Question types</Text>
              <Flex gap="8px" wrap="wrap">
                {TYPES.map((t) => (
                  <Chip
                    key={t.value}
                    active={types.includes(t.value)}
                    onClick={() => toggleType(t.value)}
                  >
                    {t.label}
                  </Chip>
                ))}
              </Flex>
            </Stack>

            <Flex align="flex-end" gap="14px" wrap="wrap">
              <Stack gap="4px">
                <Text fontSize="sm" fontWeight="medium">How many</Text>
                <Box maxW="120px">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={String(count)}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (Number.isFinite(n)) setCount(Math.max(1, Math.min(10, Math.round(n))))
                    }}
                  />
                </Box>
              </Stack>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={!canGenerate}
                loading={generateMutation.isPending}
              >
                <Sparkles size={16} /> Generate
              </Button>
            </Flex>
          </Stack>
        </Card>

        {/* ===== Результат ===== */}
        {generateMutation.isPending && (
          <Stack gap="12px" mt="24px">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} h="110px" borderRadius="lg" />
            ))}
          </Stack>
        )}

        {generated.length > 0 && !generateMutation.isPending && (
          <Stack gap="14px" mt="28px">
            <Flex justify="space-between" align="center" wrap="wrap" gap="10px">
              <Heading as="h2" fontSize="xl" fontWeight="semibold">
                Preview
              </Heading>
              <Text fontSize="sm" color="text.tertiary">{summary}</Text>
            </Flex>

            {generated.map((q, i) => (
              <QuestionPreviewCard
                key={i}
                question={q}
                selected={selected.has(i)}
                onToggle={() => toggleSelected(i)}
                onPromptChange={(prompt) =>
                  setGenerated((prev) =>
                    prev.map((item, idx) => (idx === i ? { ...item, prompt } : item)),
                  )
                }
              />
            ))}

            {/* ===== Сохранение ===== */}
            <Card padding="comfortable">
              <Stack gap="12px">
                <Text fontSize="sm" fontWeight="medium">Save to lesson</Text>
                <Flex gap="8px" wrap="wrap">
                  {coursesQuery.isLoading && <Skeleton h="32px" w="200px" borderRadius="full" />}
                  {courses.map((c) => (
                    <Chip
                      key={c.id}
                      active={courseId === c.id}
                      onClick={() => {
                        setCourseId(c.id)
                        setLessonId(null)
                      }}
                    >
                      {c.title}
                    </Chip>
                  ))}
                  {!coursesQuery.isLoading && courses.length === 0 && (
                    <Text fontSize="sm" color="text.tertiary">
                      You don't have any courses yet — create one first.
                    </Text>
                  )}
                </Flex>

                {courseId && (
                  <Flex gap="8px" wrap="wrap">
                    {lessonsQuery.isLoading && <Skeleton h="32px" w="200px" borderRadius="full" />}
                    {lessons.map((l) => (
                      <Chip
                        key={l.id}
                        active={lessonId === l.id}
                        onClick={() => setLessonId(l.id)}
                      >
                        {l.title}
                      </Chip>
                    ))}
                    {!lessonsQuery.isLoading && lessons.length === 0 && (
                      <Text fontSize="sm" color="text.tertiary">
                        This course has no lessons yet.
                      </Text>
                    )}
                  </Flex>
                )}

                <Box>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={!canSave}
                    loading={saveMutation.isPending}
                  >
                    <Save size={16} /> Save {selected.size} selected
                  </Button>
                </Box>
              </Stack>
            </Card>
          </Stack>
        )}
      </Container>
    </Box>
  )
}

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'Multiple choice',
  FILL_BLANK: 'Fill the blank',
  DRAG_DROP: 'Word order',
  MATCH_PAIRS: 'Match pairs',
  SHORT_WRITING: 'Short writing',
}

function QuestionPreviewCard({
  question,
  selected,
  onToggle,
  onPromptChange,
}: {
  question: GeneratedQuestion
  selected: boolean
  onToggle: () => void
  onPromptChange: (prompt: string) => void
}) {
  return (
    <Card padding="comfortable">
      <Flex gap="12px" align="flex-start">
        <NativeButton
          onClick={onToggle}
          aria-label={selected ? 'Deselect question' : 'Select question'}
          mt="2px"
          w="22px"
          h="22px"
          flexShrink={0}
          borderRadius="md"
          border="1px solid"
          borderColor={selected ? 'accent.solid' : 'border.default'}
          bg={selected ? 'accent.solid' : 'transparent'}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
        >
          {selected && <Check size={14} color="white" />}
        </NativeButton>

        <Stack gap="8px" flex="1" minW="0">
          <Flex align="center" gap="8px" wrap="wrap">
            <Badge tone="accent" shape="pill">{TYPE_LABEL[question.type] ?? question.type}</Badge>
          </Flex>
          <Input
            value={question.prompt}
            onChange={(e) => onPromptChange(e.target.value)}
          />
          <PayloadSummary question={question} />
          {question.explanation && (
            <Text fontSize="xs" color="text.tertiary" fontStyle="italic">
              Explanation: {question.explanation}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}

/** Компактная сводка payload — что внутри вопроса, без редактирования.
 *  Тонкая правка payload — на странице вопроса после сохранения. */
function PayloadSummary({ question }: { question: GeneratedQuestion }) {
  const p = question.payload as Record<string, unknown>

  switch (question.type) {
    case 'MULTIPLE_CHOICE': {
      const options = (p.options as string[]) ?? []
      const correct = p.correctIndex as number
      return (
        <Flex gap="6px" wrap="wrap">
          {options.map((o, i) => (
            <Badge key={i} tone={i === correct ? 'success' : 'neutral'} shape="tag">
              {o}
            </Badge>
          ))}
        </Flex>
      )
    }
    case 'FILL_BLANK':
      return (
        <Text fontSize="sm" color="text.secondary">
          {String(p.text)} → <b>{((p.correctAnswers as string[]) ?? []).join(' / ')}</b>
        </Text>
      )
    case 'DRAG_DROP':
      return (
        <Text fontSize="sm" color="text.secondary">
          Correct order: {((p.words as string[]) ?? []).join(' ')}
        </Text>
      )
    case 'MATCH_PAIRS': {
      const pairs = (p.pairs as { left: string; right: string }[]) ?? []
      return (
        <Text fontSize="sm" color="text.secondary">
          {pairs.map((pair) => `${pair.left} ↔ ${pair.right}`).join(' · ')}
        </Text>
      )
    }
    case 'SHORT_WRITING':
      return (
        <Text fontSize="sm" color="text.secondary">
          {String(p.minWords)}–{String(p.maxWords)} words
          {p.rubric ? ` · rubric: ${String(p.rubric)}` : ''}
        </Text>
      )
    default:
      return null
  }
}
