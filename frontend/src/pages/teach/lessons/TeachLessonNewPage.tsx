import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { Card, Link as RouterLink, showToast } from '@shared/ui'
import { coursesApi, lessonsApi, extractApiError } from '@shared/api'
import type { CreateLessonPayload } from '@shared/api'
import { LessonForm } from './LessonForm'

export function TeachLessonNewPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', courseId],
    queryFn: () => coursesApi.byId(courseId!),
    enabled: Boolean(courseId),
  })

  const mutation = useMutation({
    mutationFn: (payload: CreateLessonPayload) => lessonsApi.create(courseId!, payload),
    onSuccess: async (created) => {
      showToast({ type: 'success', title: 'Lesson created' })
      await qc.invalidateQueries({ queryKey: ['lessons', 'byCourse', courseId] })
      navigate(`/teach/courses/${courseId}/lessons/${created.id}/edit`)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

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
          <Stack gap="6px">
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="semibold"
              letterSpacing="tight"
              lineHeight="tight"
            >
              New lesson
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              Questions are added after the lesson is created.
            </Text>
          </Stack>

          <Card padding="spacious">
            <LessonForm
              submitLabel="Create lesson"
              submitting={mutation.isPending}
              level={courseQuery.data?.level ?? undefined}
              onSubmit={(payload) => mutation.mutate(payload as CreateLessonPayload)}
            />
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
