import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft, ArrowRight, Archive, ArchiveRestore } from 'lucide-react'
import {
  Button, Card, Link as RouterLink, Skeleton, showToast,
} from '@shared/ui'
import { coursesApi, lessonsApi, extractApiError } from '@shared/api'
import type { UpdateLessonPayload } from '@shared/api'
import { LessonForm } from './LessonForm'

export function TeachLessonEditPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['lessons', 'detail', lessonId],
    queryFn: () => lessonsApi.byId(lessonId!),
    enabled: Boolean(lessonId),
  })

  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', courseId],
    queryFn: () => coursesApi.byId(courseId!),
    enabled: Boolean(courseId),
  })

  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['lessons', 'byCourse', courseId] }),
      qc.invalidateQueries({ queryKey: ['lessons', 'detail', lessonId] }),
    ])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateLessonPayload) => lessonsApi.update(lessonId!, payload),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Lesson updated' })
      await invalidate()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })
  const archiveMutation = useMutation({
    mutationFn: () => lessonsApi.archive(lessonId!),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Archived' })
      await invalidate()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })
  // Restore = снова опубликовать (вернуть из архива)
  const restoreMutation = useMutation({
    mutationFn: () => lessonsApi.publish(lessonId!),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Restored' })
      await invalidate()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  if (query.isLoading) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="900px" py="32px">
          <Skeleton h="320px" borderRadius="lg" />
        </Container>
      </Box>
    )
  }
  if (query.isError) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="900px" py="32px">
          <Card padding="comfortable">
            <Text fontSize="sm" color="error">{extractApiError(query.error)}</Text>
          </Card>
        </Container>
      </Box>
    )
  }
  if (!query.data) return <Navigate to={`/teach/courses/${courseId}/lessons`} replace />

  const lesson = query.data

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="900px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink
            to={`/teach/courses/${courseId}/lessons`}
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="sm"
            color="text.tertiary"
            textDecoration="none"
            _hover={{ color: 'text.primary' }}
          >
            <ArrowLeft size={14} />
            Lessons
          </RouterLink>
        </Box>

        <Stack gap="20px">
          <Flex
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            gap="14px"
            direction={{ base: 'column', md: 'row' }}
          >
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="semibold"
              letterSpacing="tight"
              lineHeight="tight"
            >
              Edit lesson
            </Heading>
            <Flex gap="6px" wrap="wrap">
              <Button
                size="sm"
                variant="secondary"
                rightIcon={<ArrowRight size={12} />}
                onClick={() => navigate(`/teach/courses/${courseId}/lessons/${lesson.id}/questions`)}
              >
                Manage questions
              </Button>
              {/* урок публикуется автоматически; Archive прячет, Restore возвращает */}
              {lesson.status === 'ARCHIVED' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<ArchiveRestore size={12} />}
                  onClick={() => restoreMutation.mutate()}
                  loading={restoreMutation.isPending}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Archive size={12} />}
                  onClick={() => archiveMutation.mutate()}
                  loading={archiveMutation.isPending}
                >
                  Archive
                </Button>
              )}
            </Flex>
          </Flex>

          <Card padding="spacious">
            <LessonForm
              initial={{
                title: lesson.title,
                description: lesson.description ?? '',
                content: lesson.content,
                videoUrl: lesson.videoUrl ?? '',
                audioUrl: lesson.audioUrl ?? '',
                durationSec: lesson.durationSec ? String(lesson.durationSec) : '',
                isPreview: lesson.isPreview,
                topicId: lesson.topicId ?? null,
              }}
              submitLabel="Save changes"
              submitting={updateMutation.isPending}
              level={courseQuery.data?.level ?? undefined}
              onSubmit={(payload) => updateMutation.mutate(payload as UpdateLessonPayload)}
            />
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
