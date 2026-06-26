import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft, Plus, Pencil, Trash2, CalendarClock } from 'lucide-react'
import { useState } from 'react'
import {
  Badge, Button, Card, Dialog, Link as RouterLink, NativeButton, Skeleton, showToast,
} from '@shared/ui'
import { lessonsApi, extractApiError } from '@shared/api'
import type { LessonSkill, LessonSummary } from '@shared/api'
import { DatePicker } from './DatePicker'

const SKILL_LABEL: Record<LessonSkill, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  SPEAKING: 'Speaking',
  WRITING: 'Writing',
}

export function TeachLessonsListPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [scheduleFor, setScheduleFor] = useState<LessonSummary | null>(null)
  const [dateValue, setDateValue] = useState('')

  const scheduleMutation = useMutation({
    mutationFn: ({ id, availableFrom }: { id: string; availableFrom: string | null }) =>
      lessonsApi.update(id, { availableFrom }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['lessons', 'byCourse', 'teach', courseId] })
      setScheduleFor(null)
      showToast({ type: 'success', title: 'Availability updated' })
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const openSchedule = (lesson: LessonSummary) => {
    setScheduleFor(lesson)
    // datetime-local требует формат YYYY-MM-DDTHH:mm
    setDateValue(lesson.availableFrom ? toLocalInput(lesson.availableFrom) : '')
  }

  const lessonsQuery = useQuery({
    queryKey: ['lessons', 'byCourse', 'teach', courseId],
    // /me-эндпоинт: владельцу курса возвращает ВСЕ уроки (вкл. draft).
    queryFn: () => lessonsApi.myByCourse(courseId!),
    enabled: Boolean(courseId),
  })

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => lessonsApi.remove(lessonId),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Lesson deleted' })
      await qc.invalidateQueries({ queryKey: ['lessons', 'byCourse', 'teach', courseId] })
      setPendingDelete(null)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  if (!courseId) return <Navigate to="/teach/courses" replace />

  // Уроки идут строго по порядку программы (Unit 1, 2, 3 …)
  const lessons = [...(lessonsQuery.data ?? [])].sort((a, b) => a.order - b.order)

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="900px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink to="/teach/courses" display="inline-flex" alignItems="center"
            gap="6px" fontSize="sm" color="text.tertiary" textDecoration="none" _hover={{ color: 'text.primary' }}>
            <ArrowLeft size={14} />
            Courses
          </RouterLink>
        </Box>

        <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap="14px"
          mb="20px" direction={{ base: 'column', md: 'row' }}>
          <Stack gap="6px">
            <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="semibold"
              letterSpacing="tight" lineHeight="tight">
              Lessons
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              Units follow the program order. Click the pencil to edit content and questions.
            </Text>
          </Stack>
          <Button leftIcon={<Plus size={14} />} onClick={() => navigate(`/teach/courses/${courseId}/lessons/new`)}>
            New lesson
          </Button>
        </Flex>

        {lessonsQuery.isLoading ? (
          <Stack gap="8px">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h="64px" borderRadius="md" />)}
          </Stack>
        ) : lessons.length === 0 ? (
          <Card padding="spacious">
            <Stack gap="6px" align="center" textAlign="center" py="24px">
              <Text fontSize="md" fontWeight="semibold">No lessons yet</Text>
              <Text fontSize="sm" color="text.secondary">
                Add the first lesson to start building the course.
              </Text>
              <Box mt="8px">
                <Button size="sm" onClick={() => navigate(`/teach/courses/${courseId}/lessons/new`)}>
                  Add lesson
                </Button>
              </Box>
            </Stack>
          </Card>
        ) : (
          <Card padding="tight">
            <Stack gap="0" maxH="64vh" overflowY="auto">
              {lessons.map((lesson, idx) => (
                <Flex
                  key={lesson.id}
                  align="center"
                  gap="10px"
                  py="12px"
                  px="12px"
                  borderTop={idx === 0 ? 'none' : '1px solid'}
                  borderColor="border.subtle"
                  role="button"
                  cursor="pointer"
                  transition="background 120ms"
                  _hover={{ bg: 'bg.subtle' }}
                  onClick={() => navigate(`/teach/courses/${courseId}/lessons/${lesson.id}/edit`)}
                >
                  <Box color="text.tertiary" fontFamily="mono" fontSize="sm" minW="28px" textAlign="center">
                    {String(idx + 1).padStart(2, '0')}
                  </Box>

                  <Stack gap="4px" flex="1" minW="0">
                    <Flex align="center" gap="8px" wrap="wrap">
                      <Text fontSize="sm" fontWeight="medium" lineHeight="tight" truncate>
                        {lesson.title}
                      </Text>
                      {lesson.skillFocus && (
                        <Badge tone="neutral" intensity="subtle" shape="pill">
                          {SKILL_LABEL[lesson.skillFocus]}
                        </Badge>
                      )}
                      {lesson.status === 'ARCHIVED' && (
                        <Badge tone="warning" intensity="subtle" shape="pill">archived</Badge>
                      )}
                      {lesson.isPreview && (
                        <Badge tone="accent" intensity="subtle" shape="pill">Preview</Badge>
                      )}
                    </Flex>
                    {lesson.description && (
                      <Text fontSize="xs" color="text.tertiary" truncate>{lesson.description}</Text>
                    )}
                    <Box mt="2px">{availabilityBadge(lesson)}</Box>
                  </Stack>

                  <Flex gap="2px" flexShrink={0} onClick={(e) => e.stopPropagation()}>
                    <IconBtn label="Set availability" onClick={() => openSchedule(lesson)}>
                      <CalendarClock size={13} />
                    </IconBtn>
                    <IconBtn label="Edit"
                      onClick={() => navigate(`/teach/courses/${courseId}/lessons/${lesson.id}/edit`)}>
                      <Pencil size={13} />
                    </IconBtn>
                    <IconBtn label="Delete" tone="error" onClick={() => setPendingDelete(lesson.id)}>
                      <Trash2 size={13} />
                    </IconBtn>
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
        title="Delete lesson?"
        description="All questions in this lesson will also be removed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" loading={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}>
              Delete
            </Button>
          </>
        }
      />

      <Dialog
        open={Boolean(scheduleFor)}
        onOpenChange={(open) => !open && setScheduleFor(null)}
        title="Unit availability"
        description="Leave the date empty to follow the normal order (students unlock it after the previous unit). Set a future date to release it on a schedule, or pick now to open it immediately."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                scheduleFor &&
                scheduleMutation.mutate({ id: scheduleFor.id, availableFrom: null })
              }
              disabled={scheduleMutation.isPending}
            >
              Unlock in order
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                scheduleFor &&
                scheduleMutation.mutate({
                  id: scheduleFor.id,
                  availableFrom: new Date().toISOString(),
                })
              }
              disabled={scheduleMutation.isPending}
            >
              Open now
            </Button>
            <Button
              loading={scheduleMutation.isPending}
              disabled={!dateValue}
              onClick={() =>
                scheduleFor &&
                scheduleMutation.mutate({
                  id: scheduleFor.id,
                  availableFrom: new Date(`${dateValue}T09:00:00`).toISOString(),
                })
              }
            >
              Open on date
            </Button>
          </>
        }
      >
        <Stack gap="14px">
          <Box>
            <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
              Quick pick
            </Text>
            <Flex gap="6px" wrap="wrap">
              {[
                { label: 'Tomorrow', days: 1 },
                { label: 'In 1 week', days: 7 },
                { label: 'In 2 weeks', days: 14 },
              ].map((p) => {
                const v = addDays(p.days)
                const active = dateValue === v
                return (
                  <NativeButton key={p.label} type="button" onClick={() => setDateValue(v)}
                    px="12px" h="32px" borderRadius="full" border="1px solid"
                    bg={active ? 'accent.surface' : 'bg.subtle'}
                    color={active ? 'accent.text' : 'text.secondary'}
                    borderColor={active ? 'border.accent' : 'border.subtle'}
                    fontSize="xs" fontWeight="medium" cursor="pointer">
                    {p.label}
                  </NativeButton>
                )
              })}
            </Flex>
          </Box>

          <Flex justify="center">
            <DatePicker value={dateValue || null} min={addDays(0)} onChange={setDateValue} />
          </Flex>

          <Text fontSize="xs" color="text.tertiary" textAlign="center">
            {dateValue
              ? `Opens ${formatNiceDate(dateValue)} at 09:00 — locked for students until then.`
              : 'Pick a date, or use Open now / Unlock in order.'}
          </Text>
        </Stack>
      </Dialog>
    </Box>
  )
}

function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// дата ISO → YYYY-MM-DD для input[type=date]
function toLocalInput(iso: string): string {
  return ymd(new Date(iso))
}

// сегодня + N дней → YYYY-MM-DD
function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return ymd(d)
}

// YYYY-MM-DD → "Mon, Jun 30"
function formatNiceDate(value: string): string {
  const d = new Date(`${value}T00:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function availabilityBadge(lesson: LessonSummary) {
  const from = lesson.availableFrom ? new Date(lesson.availableFrom) : null
  if (!from) {
    return <Badge tone="neutral" intensity="subtle" shape="pill">Sequential</Badge>
  }
  if (from.getTime() > Date.now()) {
    const label = from.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return <Badge tone="warning" intensity="subtle" shape="pill">Opens {label}</Badge>
  }
  return <Badge tone="accent" intensity="subtle" shape="pill">Open</Badge>
}

function IconBtn({
  children, onClick, label, tone,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  tone?: 'error'
}) {
  return (
    <NativeButton
      type="button" onClick={onClick} aria-label={label} title={label}
      display="inline-flex" alignItems="center" justifyContent="center"
      w="28px" h="28px" bg="transparent" border="1px solid" borderColor="transparent"
      borderRadius="sm" color={tone === 'error' ? 'error' : 'text.tertiary'} cursor="pointer"
      _hover={{ bg: 'bg.subtle', color: tone === 'error' ? 'error' : 'text.primary' }}>
      {children}
    </NativeButton>
  )
}
