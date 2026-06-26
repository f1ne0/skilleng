import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft, ArrowRight, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import {
  Button, Card, Dialog, Link as RouterLink, Skeleton, showToast,
} from '@shared/ui'
import { coursesApi, extractApiError } from '@shared/api'
import type { CefrLevel } from '@entities/user'
import type { CourseCategory, UpdateCoursePayload } from '@shared/api'
import { useState } from 'react'
import { CourseForm } from './CourseForm'

export function TeachCourseEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const query = useQuery({
    queryKey: ['courses', 'detail', id],
    queryFn: () => coursesApi.byId(id!),
    enabled: Boolean(id),
  })

  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['courses', 'my'] }),
      qc.invalidateQueries({ queryKey: ['courses', 'detail', id] }),
    ])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCoursePayload) => coursesApi.update(id!, payload),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Course updated' })
      await invalidate()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })
  const archiveMutation = useMutation({
    mutationFn: () => coursesApi.archive(id!),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Archived' })
      await invalidate()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })
  // Restore = снова опубликовать (вернуть из архива)
  const restoreMutation = useMutation({
    mutationFn: () => coursesApi.publish(id!),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Restored' })
      await invalidate()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })
  const deleteMutation = useMutation({
    mutationFn: () => coursesApi.delete(id!),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Course deleted' })
      await invalidate()
      navigate('/teach/courses')
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
  if (!query.data) return <Navigate to="/teach/courses" replace />

  const course = query.data

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="900px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink
            to="/teach/courses"
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="sm"
            color="text.tertiary"
            textDecoration="none"
            _hover={{ color: 'text.primary' }}
          >
            <ArrowLeft size={14} />
            Courses
          </RouterLink>
        </Box>

        <Stack gap="20px">
          <Flex
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            gap="14px"
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
                Edit course
              </Heading>
              <Text fontSize="sm" color="text.secondary">
                Slug: <Text as="span" fontFamily="mono" fontSize="xs">{course.slug}</Text>
              </Text>
            </Stack>
            <Flex gap="6px" wrap="wrap">
              <Button
                size="sm"
                variant="secondary"
                rightIcon={<ArrowRight size={12} />}
                onClick={() => navigate(`/teach/courses/${course.id}/lessons`)}
              >
                Manage lessons
              </Button>
              {/* курс публикуется автоматически; Archive прячет, Restore возвращает */}
              {course.status === 'ARCHIVED' ? (
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
              <Button
                size="sm"
                variant="destructive"
                leftIcon={<Trash2 size={12} />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </Flex>
          </Flex>

          <Card padding="spacious">
            <CourseForm
              initial={{
                title: course.title,
                description: course.description,
                category: course.category as CourseCategory,
                level: (course.level as CefrLevel | null) ?? null,
                coverImageUrl: course.coverImageUrl,
              }}
              submitLabel="Save changes"
              submitting={updateMutation.isPending}
              onSubmit={(payload) => updateMutation.mutate(payload as UpdateCoursePayload)}
            />
          </Card>
        </Stack>
      </Container>

      <Dialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this course?"
        description="All lessons, questions and student progress will be lost."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => {
                setConfirmDelete(false)
                deleteMutation.mutate()
              }}
            >
              Delete forever
            </Button>
          </>
        }
      >
        <Text fontSize="sm" color="text.secondary">
          This action is permanent and affects all enrolled students.
        </Text>
      </Dialog>
    </Box>
  )
}
