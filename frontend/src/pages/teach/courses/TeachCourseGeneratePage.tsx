import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft, Sparkles, Trash2, Plus, Minus } from 'lucide-react'
import { Button, Card, Input, Link as RouterLink, NativeButton, showToast } from '@shared/ui'
import { contentApi, coursesApi, extractApiError } from '@shared/api'
import type {
  CourseCategory,
  GeneratedCoursePreview,
  CreateGeneratedCoursePayload,
} from '@shared/api'
import type { CefrLevel } from '@shared/model'
import { RichTextEditor } from '../lessons/RichTextEditor'

type DraftLesson = GeneratedCoursePreview['lessons'][number] & { _key: string }
type DraftCourse = Omit<GeneratedCoursePreview, 'lessons'> & { lessons: DraftLesson[] }

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CATEGORIES: { value: CourseCategory; label: string }[] = [
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
  { value: 'BUSINESS_ENGLISH', label: 'Business English' },
  { value: 'CONVERSATION', label: 'Conversation' },
  { value: 'IELTS', label: 'IELTS' },
  { value: 'EXAM_PREP', label: 'Exam prep' },
]
const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'Multiple choice',
  FILL_BLANK: 'Fill the blank',
  DRAG_DROP: 'Word order',
  MATCH_PAIRS: 'Match pairs',
}

export function TeachCourseGeneratePage() {
  const navigate = useNavigate()

  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState<CefrLevel>('B1')
  const [lessonCount, setLessonCount] = useState(5)
  const [category, setCategory] = useState<CourseCategory>('GRAMMAR')
  const [draft, setDraft] = useState<DraftCourse | null>(null)

  const generateMutation = useMutation({
    mutationFn: () =>
      contentApi.generateCourse({ topic: topic.trim(), level, lessonCount, category }),
    onSuccess: (res) => {
      // стабильный ключ на каждый урок — чтобы редактор не путал содержимое при удалении
      setDraft({
        ...res,
        lessons: res.lessons.map((l, i) => ({ ...l, _key: `${Date.now()}-${i}` })),
      })
      showToast({ type: 'success', title: `Generated ${res.lessons.length} lessons` })
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: CreateGeneratedCoursePayload = {
        title: draft!.title,
        description: draft!.description,
        level: draft!.level,
        category: draft!.category,
        lessons: draft!.lessons.map((l) => ({
          title: l.title,
          description: l.description || undefined,
          content: l.content,
          questions: l.questions.map((q) => ({
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation || undefined,
            payload: q.payload,
          })),
        })),
      }
      return coursesApi.createGenerated(payload)
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Course saved' })
      navigate('/teach/courses')
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  // --- helpers для правки черновика ---
  const patchDraft = (patch: Partial<DraftCourse>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d))
  const patchLesson = (i: number, patch: Partial<DraftLesson>) =>
    setDraft((d) =>
      d ? { ...d, lessons: d.lessons.map((l, li) => (li === i ? { ...l, ...patch } : l)) } : d,
    )
  const removeLesson = (i: number) =>
    setDraft((d) => (d ? { ...d, lessons: d.lessons.filter((_, li) => li !== i) } : d))
  const removeQuestion = (li: number, qi: number) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            lessons: d.lessons.map((l, i) =>
              i === li ? { ...l, questions: l.questions.filter((_, x) => x !== qi) } : l,
            ),
          }
        : d,
    )

  const canGenerate = topic.trim().length >= 3 && !generateMutation.isPending

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="900px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink to="/teach/courses" display="inline-flex" alignItems="center" gap="6px"
            fontSize="sm" color="text.tertiary" textDecoration="none" _hover={{ color: 'text.primary' }}>
            <ArrowLeft size={14} /> Courses
          </RouterLink>
        </Box>

        <Stack gap="6px" mb="20px">
          <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="semibold" letterSpacing="tight">
            Generate a course with AI
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            Describe the course, generate a draft, review and edit it, then save.
          </Text>
        </Stack>

        {/* ---------- ШАГ 1: параметры ---------- */}
        {!draft && (
          <Card padding="spacious">
            <Stack gap="20px" maxW="640px">
              <Input
                label="What is the course about?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Present tenses for beginners"
                hint="Minimum 3 characters. Be specific for a better result."
              />

              <ChipRow label="Level">
                {LEVELS.map((l) => (
                  <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{l}</Chip>
                ))}
              </ChipRow>

              <ChipRow label="Category">
                {CATEGORIES.map((c) => (
                  <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
                    {c.label}
                  </Chip>
                ))}
              </ChipRow>

              <Box>
                <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
                  Number of lessons
                </Text>
                <Flex align="center" gap="10px">
                  <Stepper onClick={() => setLessonCount((n) => Math.max(3, n - 1))} disabled={lessonCount <= 3}>
                    <Minus size={14} />
                  </Stepper>
                  <Text fontSize="lg" fontWeight="semibold" minW="24px" textAlign="center" fontVariantNumeric="tabular-nums">
                    {lessonCount}
                  </Text>
                  <Stepper onClick={() => setLessonCount((n) => Math.min(8, n + 1))} disabled={lessonCount >= 8}>
                    <Plus size={14} />
                  </Stepper>
                  <Text fontSize="xs" color="text.tertiary" ml="4px">3–8 lessons</Text>
                </Flex>
              </Box>

              <Box>
                <Button onClick={() => generateMutation.mutate()} disabled={!canGenerate}
                  loading={generateMutation.isPending} leftIcon={<Sparkles size={15} />}>
                  Generate course
                </Button>
                {generateMutation.isPending && (
                  <Text fontSize="xs" color="text.tertiary" mt="8px">
                    Writing {lessonCount} lessons with questions — this can take up to a minute.
                  </Text>
                )}
              </Box>
            </Stack>
          </Card>
        )}

        {/* ---------- ШАГ 2: предпросмотр + правка ---------- */}
        {draft && (
          <Stack gap="16px">
            <Card padding="comfortable">
              <Stack gap="14px">
                <Input
                  label="Course title"
                  value={draft.title}
                  onChange={(e) => patchDraft({ title: e.target.value })}
                />
                <Box>
                  <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
                    Description
                  </Text>
                  <textarea
                    value={draft.description}
                    onChange={(e) => patchDraft({ description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%', padding: '12px 14px', background: 'var(--se-colors-bg-surface)',
                      border: '1px solid var(--se-colors-border-default)', borderRadius: 10,
                      color: 'var(--se-colors-text-primary)', fontSize: 14, fontFamily: 'inherit',
                      lineHeight: 1.5, resize: 'vertical', outline: 'none',
                    }}
                  />
                </Box>
                <Text fontSize="xs" color="text.tertiary">
                  {draft.level} · {CATEGORIES.find((c) => c.value === draft.category)?.label ?? draft.category} · {draft.lessons.length} lessons
                </Text>
              </Stack>
            </Card>

            {draft.lessons.map((lesson, li) => (
              <Card key={lesson._key} padding="comfortable">
                <Stack gap="12px">
                  <Flex align="center" gap="10px">
                    <Box color="text.tertiary" fontFamily="mono" fontSize="sm" minW="28px" textAlign="center">
                      {String(li + 1).padStart(2, '0')}
                    </Box>
                    <Box flex="1">
                      <Input
                        value={lesson.title}
                        onChange={(e) => patchLesson(li, { title: e.target.value })}
                      />
                    </Box>
                    <IconBtn label="Remove lesson" tone="error" onClick={() => removeLesson(li)}>
                      <Trash2 size={14} />
                    </IconBtn>
                  </Flex>

                  <Box>
                    <Text fontSize="xs" color="text.tertiary" mb="6px">Lesson text</Text>
                    <RichTextEditor
                      initialMarkdown={lesson.content}
                      onChange={(md) => patchLesson(li, { content: md })}
                    />
                  </Box>

                  {lesson.questions.length > 0 && (
                    <Box>
                      <Text fontSize="xs" color="text.tertiary" mb="6px">
                        Practice questions ({lesson.questions.length})
                      </Text>
                      <Stack gap="6px">
                        {lesson.questions.map((q, qi) => (
                          <Flex key={qi} align="center" justify="space-between" gap="10px"
                            px="12px" py="8px" borderRadius="md" bg="bg.subtle">
                            <Text fontSize="sm" lineClamp={1}>
                              <Box as="span" color="text.tertiary">{TYPE_LABEL[q.type] ?? q.type} · </Box>
                              {q.prompt}
                            </Text>
                            <IconBtn label="Remove question" tone="error" onClick={() => removeQuestion(li, qi)}>
                              <Trash2 size={13} />
                            </IconBtn>
                          </Flex>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Card>
            ))}

            <Flex justify="space-between" align="center" gap="12px" wrap="wrap">
              <Button variant="ghost" onClick={() => setDraft(null)} disabled={saveMutation.isPending}>
                Start over
              </Button>
              <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}
                disabled={draft.lessons.length === 0}>
                Save course
              </Button>
            </Flex>
          </Stack>
        )}
      </Container>
    </Box>
  )
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
        {label}
      </Text>
      <Flex wrap="wrap" gap="6px">{children}</Flex>
    </Box>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <NativeButton
      type="button"
      onClick={onClick}
      px="14px"
      h="32px"
      display="inline-flex"
      alignItems="center"
      borderRadius="full"
      bg={active ? 'accent.surface' : 'bg.subtle'}
      color={active ? 'accent.text' : 'text.secondary'}
      border="1px solid"
      borderColor={active ? 'border.accent' : 'border.subtle'}
      fontSize="xs"
      fontWeight="medium"
      cursor="pointer"
    >
      {children}
    </NativeButton>
  )
}

function Stepper({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <NativeButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="32px"
      h="32px"
      bg="bg.surface"
      border="1px solid"
      borderColor="border.default"
      borderRadius="md"
      color="text.primary"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.4 : 1}
      _hover={disabled ? {} : { bg: 'bg.subtle' }}
    >
      {children}
    </NativeButton>
  )
}

function IconBtn({ children, onClick, label, tone }: {
  children: React.ReactNode
  onClick: () => void
  label: string
  tone?: 'error'
}) {
  return (
    <NativeButton
      type="button" onClick={onClick} aria-label={label} title={label}
      display="inline-flex" alignItems="center" justifyContent="center"
      w="30px" h="30px" bg="transparent" border="1px solid" borderColor="transparent"
      borderRadius="sm" color={tone === 'error' ? 'error' : 'text.tertiary'} cursor="pointer"
      flexShrink={0}
      _hover={{ bg: 'bg.subtle', color: tone === 'error' ? 'error' : 'text.primary' }}>
      {children}
    </NativeButton>
  )
}
