import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { Card, Link as RouterLink, Skeleton, showToast } from '@shared/ui'
import { questionsApi, extractApiError } from '@shared/api'
import type { UpdateQuestionPayload, TeacherQuestion } from '@shared/api'
import { QuestionForm } from './QuestionForm'

export function TeachQuestionEditPage() {
  const { id: courseId, lessonId, questionId } = useParams<{
    id: string
    lessonId: string
    questionId: string
  }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Load list to pick the question (no dedicated detail endpoint for teacher view).
  const listQuery = useQuery({
    queryKey: ['questions', 'byLesson', lessonId],
    queryFn: () => questionsApi.byLessonForTeacher(lessonId!),
    enabled: Boolean(lessonId),
  })

  const question: TeacherQuestion | undefined = listQuery.data?.find((q) => q.id === questionId)

  const mutation = useMutation({
    mutationFn: (payload: UpdateQuestionPayload) => questionsApi.update(questionId!, payload),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Question updated' })
      await qc.invalidateQueries({ queryKey: ['questions', 'byLesson', lessonId] })
      navigate(`/teach/courses/${courseId}/lessons/${lessonId}/questions`)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  if (listQuery.isLoading) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="900px" py="32px">
          <Skeleton h="320px" borderRadius="lg" />
        </Container>
      </Box>
    )
  }
  if (listQuery.isError) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="900px" py="32px">
          <Card padding="comfortable">
            <Text fontSize="sm" color="error">{extractApiError(listQuery.error)}</Text>
          </Card>
        </Container>
      </Box>
    )
  }
  if (!question) {
    return <Navigate to={`/teach/courses/${courseId}/lessons/${lessonId}/questions`} replace />
  }

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="900px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink
            to={`/teach/courses/${courseId}/lessons/${lessonId}/questions`}
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="sm"
            color="text.tertiary"
            textDecoration="none"
            _hover={{ color: 'text.primary' }}
          >
            <ArrowLeft size={14} />
            Questions
          </RouterLink>
        </Box>

        <Stack gap="20px">
          <Heading
            as="h1"
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="semibold"
            letterSpacing="tight"
            lineHeight="tight"
          >
            Edit question
          </Heading>
          <Card padding="spacious">
            <QuestionForm
              initial={{
                type: question.type,
                prompt: question.prompt,
                explanation: question.explanation,
                points: question.points,
                payload: question.payload,
              }}
              submitLabel="Save changes"
              submitting={mutation.isPending}
              onSubmit={(payload) => mutation.mutate(payload as UpdateQuestionPayload)}
            />
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
