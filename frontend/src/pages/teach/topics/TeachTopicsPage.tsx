import { useState } from 'react'
import {
  Box,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Plus, Pencil, Trash2, Sparkles, Eye } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { topicsApi, contentApi, coursesApi, lessonsApi, extractApiError } from '@shared/api'
import type { TopicSkill, TopicSummary, TopicDetail, CreateTopicPayload } from '@shared/api'
import type { CefrLevel } from '@shared/model'
import {
  Badge,
  Button,
  Card,
  Dialog,
  Input,
  MessageContent,
  NativeButton,
  Skeleton,
  showToast,
} from '@shared/ui'
import { RichTextEditor } from '../lessons/RichTextEditor'

const SKILLS: TopicSkill[] = ['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'SPEAKING', 'WRITING']
const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface FormState {
  id: string | null
  title: string
  skill: TopicSkill
  level: CefrLevel
  theoryContent: string
}

const EMPTY_FORM: FormState = {
  id: null,
  title: '',
  skill: 'GRAMMAR',
  level: 'B1',
  theoryContent: '',
}

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
      px="10px"
      py="5px"
      borderRadius="full"
      border="1px solid"
      borderColor={active ? 'accent.solid' : 'border.default'}
      bg={active ? 'accent.subtle' : 'transparent'}
      color={active ? 'accent.text' : 'text.secondary'}
      fontSize="sm"
      transition="all 0.15s"
    >
      {children}
    </NativeButton>
  )
}

export function TeachTopicsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [preview, setPreview] = useState<TopicDetail | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  // фильтры списка
  const [filterSkill, setFilterSkill] = useState<TopicSkill | 'ALL'>('ALL')
  const [filterLevel, setFilterLevel] = useState<CefrLevel | 'ALL'>('ALL')
  // привязка уроков со стороны темы
  const [linkCourseId, setLinkCourseId] = useState<string | null>(null)

  const topicsQuery = useQuery({
    queryKey: ['topics', 'list', 'teach'],
    queryFn: () => topicsApi.list(),
  })

  const saveMutation = useMutation({
    mutationFn: async (state: FormState) => {
      const payload: CreateTopicPayload = {
        title: state.title.trim(),
        skill: state.skill,
        level: state.level,
        theoryContent: state.theoryContent,
      }
      return state.id
        ? topicsApi.update(state.id, payload)
        : topicsApi.create(payload)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['topics'] })
      showToast({ type: 'success', title: 'Topic saved' })
      setForm(null)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  // AI пишет теорию темы по названию + уровню
  const writeMutation = useMutation({
    mutationFn: () =>
      contentApi.generateLessonText({ topic: form!.title.trim(), level: form!.level }),
    onSuccess: ({ content }) => {
      setForm((f) => (f ? { ...f, theoryContent: content } : f))
      setEditorKey((k) => k + 1) // переинициализировать редактор новым текстом
      showToast({ type: 'success', title: 'Theory written' })
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const previewMutation = useMutation({
    mutationFn: (id: string) => topicsApi.byId(id),
    onSuccess: setPreview,
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  // ── привязка уроков (только при редактировании существующей темы) ──
  const editingId = form?.id ?? null
  const linkedQuery = useQuery({
    queryKey: ['topics', 'detail', editingId],
    queryFn: () => topicsApi.byId(editingId!),
    enabled: Boolean(editingId),
  })
  const myCoursesQuery = useQuery({
    queryKey: ['courses', 'my', 'topic-link'],
    queryFn: coursesApi.my,
    enabled: Boolean(editingId),
  })
  // English for IT — первым и по порядку (Semester 1 → 2)
  const myCourses = [...(myCoursesQuery.data ?? [])].sort((a, b) => {
    const ap = a.slug.startsWith('english-for-it') ? 0 : 1
    const bp = b.slug.startsWith('english-for-it') ? 0 : 1
    if (ap !== bp) return ap - bp
    if (ap === 0) return a.slug.localeCompare(b.slug)
    return a.title.localeCompare(b.title)
  })
  const linkCourse = linkCourseId ?? myCourses[0]?.id ?? null
  const courseLessonsQuery = useQuery({
    queryKey: ['lessons', 'byCourse', 'teach', linkCourse, 'topic-link'],
    queryFn: () => lessonsApi.myByCourse(linkCourse!),
    enabled: Boolean(editingId) && Boolean(linkCourse),
  })

  const refetchLinks = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['topics'] }),
      qc.invalidateQueries({ queryKey: ['lessons'] }),
    ])

  const attachMutation = useMutation({
    mutationFn: (lessonId: string) => lessonsApi.update(lessonId, { topicId: editingId! }),
    onSuccess: async () => { await refetchLinks(); showToast({ type: 'success', title: 'Lesson linked' }) },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })
  const detachMutation = useMutation({
    mutationFn: (lessonId: string) => lessonsApi.update(lessonId, { topicId: null }),
    onSuccess: async () => { await refetchLinks(); showToast({ type: 'info', title: 'Lesson unlinked' }) },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => topicsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['topics'] })
      showToast({ type: 'info', title: 'Topic deleted. Linked lessons were detached.' })
      setPendingDelete(null)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const openEdit = async (topic: TopicSummary) => {
    // каталог не содержит theoryContent — дотягиваем деталь
    try {
      const detail = await topicsApi.byId(topic.id)
      setForm({
        id: detail.id,
        title: detail.title,
        skill: detail.skill,
        level: detail.level,
        theoryContent: detail.theoryContent,
      })
      setEditorKey((k) => k + 1)
    } catch (err) {
      showToast({ type: 'error', title: extractApiError(err) })
    }
  }

  const allTopics = topicsQuery.data ?? []
  const topics = allTopics
    .filter((t) => filterSkill === 'ALL' || t.skill === filterSkill)
    .filter((t) => filterLevel === 'ALL' || t.level === filterLevel)
  const canSave =
    Boolean(form) &&
    form!.title.trim().length >= 2 &&
    form!.theoryContent.trim().length >= 10 &&
    !saveMutation.isPending

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="960px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap="14px" mb="24px">
          <Stack gap="6px">
            <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
              Topics
            </Heading>
            <Text fontSize="md" color="text.secondary">
              Reference theory students see in the Topics catalog. Link lessons
              to a topic to give it practice exercises.
            </Text>
          </Stack>
          <Button size="sm" onClick={() => { setForm({ ...EMPTY_FORM }); setEditorKey((k) => k + 1) }}>
            <Plus size={15} /> New topic
          </Button>
        </Flex>

        {/* Фильтры по навыку и уровню */}
        {allTopics.length > 0 && (
          <Stack gap="8px" mb="20px">
            <Flex gap="6px" wrap="wrap" align="center">
              <Text fontSize="xs" color="text.tertiary" w="48px">Skill</Text>
              <Chip active={filterSkill === 'ALL'} onClick={() => setFilterSkill('ALL')}>all</Chip>
              {SKILLS.map((s) => (
                <Chip key={s} active={filterSkill === s} onClick={() => setFilterSkill(s)}>
                  {s.toLowerCase()}
                </Chip>
              ))}
            </Flex>
            <Flex gap="6px" wrap="wrap" align="center">
              <Text fontSize="xs" color="text.tertiary" w="48px">Level</Text>
              <Chip active={filterLevel === 'ALL'} onClick={() => setFilterLevel('ALL')}>all</Chip>
              {LEVELS.map((l) => (
                <Chip key={l} active={filterLevel === l} onClick={() => setFilterLevel(l)}>
                  {l}
                </Chip>
              ))}
            </Flex>
          </Stack>
        )}

        {topicsQuery.isLoading ? (
          <Stack gap="10px">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} h="64px" borderRadius="lg" />
            ))}
          </Stack>
        ) : topics.length === 0 ? (
          <Card padding="spacious">
            <Stack align="center" textAlign="center" gap="8px" py="16px">
              <Text fontSize="md" fontWeight="semibold">
                {allTopics.length === 0 ? 'No topics yet' : 'Nothing matches these filters'}
              </Text>
              <Text fontSize="sm" color="text.secondary">
                {allTopics.length === 0
                  ? 'Create the first reference topic — e.g. "Present Perfect vs Past Simple".'
                  : 'Try a different skill or level.'}
              </Text>
            </Stack>
          </Card>
        ) : (
          <Stack gap="10px" maxH="64vh" overflowY="auto">
            {topics.map((topic) => (
              <Card key={topic.id} padding="comfortable">
                <Flex justify="space-between" align="center" gap="12px" wrap="wrap">
                  <Stack gap="4px" flex="1" minW="0">
                    <Text fontSize="md" fontWeight="semibold">{topic.title}</Text>
                    <Flex gap="6px" wrap="wrap">
                      <Badge tone="accent" shape="pill">{topic.level}</Badge>
                      <Badge tone="neutral" shape="pill">{topic.skill.toLowerCase()}</Badge>
                      <Text fontSize="xs" color="text.tertiary">
                        {topic.lessonCount} linked {topic.lessonCount === 1 ? 'lesson' : 'lessons'}
                      </Text>
                    </Flex>
                  </Stack>
                  <Flex gap="8px">
                    <NativeButton onClick={() => previewMutation.mutate(topic.id)} aria-label="Preview topic" title="Preview">
                      <Eye size={15} />
                    </NativeButton>
                    <NativeButton onClick={() => void openEdit(topic)} aria-label="Edit topic" title="Edit">
                      <Pencil size={15} />
                    </NativeButton>
                    <NativeButton onClick={() => setPendingDelete(topic.id)} aria-label="Delete topic" title="Delete">
                      <Trash2 size={15} />
                    </NativeButton>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Stack>
        )}
      </Container>

      {/* ===== Создание/редактирование ===== */}
      <Dialog
        open={Boolean(form)}
        onOpenChange={(open) => !open && setForm(null)}
        title={form?.id ? 'Edit topic' : 'New topic'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!canSave}
              loading={saveMutation.isPending}
              onClick={() => form && saveMutation.mutate(form)}
            >
              Save topic
            </Button>
          </>
        }
      >
        {form && (
          <Stack gap="14px">
            <Stack gap="4px">
              <Text fontSize="sm" color="text.secondary">Title</Text>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Present Perfect vs Past Simple"
              />
            </Stack>
            <Stack gap="6px">
              <Text fontSize="sm" color="text.secondary">Skill</Text>
              <Flex gap="6px" wrap="wrap">
                {SKILLS.map((s) => (
                  <Chip key={s} active={form.skill === s} onClick={() => setForm({ ...form, skill: s })}>
                    {s.toLowerCase()}
                  </Chip>
                ))}
              </Flex>
            </Stack>
            <Stack gap="6px">
              <Text fontSize="sm" color="text.secondary">Level</Text>
              <Flex gap="6px" wrap="wrap">
                {LEVELS.map((l) => (
                  <Chip key={l} active={form.level === l} onClick={() => setForm({ ...form, level: l })}>
                    {l}
                  </Chip>
                ))}
              </Flex>
            </Stack>
            {form.id && (
              <Stack gap="8px">
                <Text fontSize="sm" color="text.secondary">Linked lessons</Text>
                {(linkedQuery.data?.lessons.length ?? 0) === 0 ? (
                  <Text fontSize="xs" color="text.tertiary">No lessons linked yet. Add one below.</Text>
                ) : (
                  <Stack gap="6px">
                    {linkedQuery.data!.lessons.map((l) => (
                      <Flex key={l.id} align="center" justify="space-between" gap="10px"
                        px="12px" py="8px" borderRadius="md" bg="bg.subtle">
                        <Text fontSize="sm" lineClamp={1}>
                          {l.title}
                          <Box as="span" color="text.tertiary"> · {l.course.title}</Box>
                        </Text>
                        <NativeButton onClick={() => detachMutation.mutate(l.id)} aria-label="Unlink" title="Unlink"
                          display="inline-flex" alignItems="center" justifyContent="center" w="26px" h="26px"
                          bg="transparent" border="none" borderRadius="sm" color="text.tertiary"
                          _hover={{ color: 'error' }}>
                          <Trash2 size={13} />
                        </NativeButton>
                      </Flex>
                    ))}
                  </Stack>
                )}

                <Text fontSize="xs" color="text.tertiary" mt="2px">Add a lesson</Text>
                <Flex gap="6px" wrap="wrap">
                  {myCourses.map((c) => (
                    <Chip key={c.id} active={linkCourse === c.id} onClick={() => setLinkCourseId(c.id)}>
                      {c.title}
                    </Chip>
                  ))}
                </Flex>
                <Stack gap="4px" maxH="180px" overflowY="auto">
                  {(courseLessonsQuery.data ?? [])
                    .filter((l) => l.topicId !== editingId)
                    .map((l) => (
                      <Flex key={l.id} align="center" justify="space-between" gap="10px"
                        px="12px" py="7px" borderRadius="md" border="1px solid" borderColor="border.subtle">
                        <Text fontSize="sm" lineClamp={1}>
                          {l.title}
                          {l.topicId && <Box as="span" color="text.tertiary"> · linked elsewhere</Box>}
                        </Text>
                        <Button size="sm" variant="secondary" leftIcon={<Plus size={12} />}
                          loading={attachMutation.isPending && attachMutation.variables === l.id}
                          onClick={() => attachMutation.mutate(l.id)}>
                          Link
                        </Button>
                      </Flex>
                    ))}
                  {(courseLessonsQuery.data ?? []).filter((l) => l.topicId !== editingId).length === 0 && (
                    <Text fontSize="xs" color="text.tertiary">All lessons of this course are already linked here.</Text>
                  )}
                </Stack>
              </Stack>
            )}

            <Stack gap="4px">
              <Flex align="center" justify="space-between" gap="10px">
                <Text fontSize="sm" color="text.secondary">Theory</Text>
                <Button size="sm" variant="secondary" leftIcon={<Sparkles size={13} />}
                  loading={writeMutation.isPending}
                  disabled={form.title.trim().length < 2}
                  onClick={() => writeMutation.mutate()}
                  title={form.title.trim().length < 2 ? 'Add a title first' : 'Write the theory from the title'}>
                  Write with AI
                </Button>
              </Flex>
              <RichTextEditor
                key={editorKey}
                initialMarkdown={form.theoryContent}
                onChange={(md) => setForm((f) => (f ? { ...f, theoryContent: md } : f))}
              />
            </Stack>
          </Stack>
        )}
      </Dialog>

      {/* ===== Просмотр (как видит студент) ===== */}
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(o) => !o && setPreview(null)}
        title={preview?.title}
        size="lg"
      >
        {preview && (
          <Stack gap="12px">
            <Flex gap="6px" wrap="wrap">
              <Badge tone="accent" shape="pill">{preview.level}</Badge>
              <Badge tone="neutral" shape="pill">{preview.skill.toLowerCase()}</Badge>
            </Flex>
            <Box>
              <MessageContent text={preview.theoryContent} />
            </Box>
          </Stack>
        )}
      </Dialog>

      {/* ===== Удаление ===== */}
      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete topic?"
        description="Linked lessons will be detached, not deleted."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
            >
              Delete
            </Button>
          </>
        }
      />
    </Box>
  )
}
