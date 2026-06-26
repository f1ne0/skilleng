import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Heading, Stack } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { Card, Link as RouterLink, showToast } from '@shared/ui'
import { questionsApi, extractApiError } from '@shared/api'
import type { CreateQuestionPayload } from '@shared/api'
import { QuestionForm } from './QuestionForm'

export function TeachQuestionNewPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: CreateQuestionPayload) => questionsApi.create(lessonId!, payload),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Question created' })
      await qc.invalidateQueries({ queryKey: ['questions', 'byLesson', lessonId] })
      navigate(`/teach/courses/${courseId}/lessons/${lessonId}/questions`)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

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
            New question
          </Heading>
          <Card padding="spacious">
            <QuestionForm
              submitLabel="Create question"
              submitting={mutation.isPending}
              onSubmit={(payload) => mutation.mutate(payload as CreateQuestionPayload)}
            />
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
