import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { Card, Link as RouterLink, showToast } from '@shared/ui'
import { coursesApi, extractApiError } from '@shared/api'
import type { CreateCoursePayload } from '@shared/api'
import { CourseForm } from './CourseForm'

export function TeachCourseNewPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (payload: CreateCoursePayload) => coursesApi.create(payload),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Course created' })
      await qc.invalidateQueries({ queryKey: ['courses', 'my'] })
      navigate('/teach/courses')
    },
    onError: (err) => {
      showToast({ type: 'error', title: extractApiError(err) })
    },
  })

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
          <Stack gap="6px">
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="semibold"
              letterSpacing="tight"
              lineHeight="tight"
            >
              New course
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              Save the basics, then add lessons from the course card.
            </Text>
          </Stack>

          <Card padding="spacious">
            <CourseForm
              submitLabel="Create course"
              submitting={createMutation.isPending}
              onSubmit={(payload) =>
                createMutation.mutate(payload as CreateCoursePayload)
              }
            />
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
