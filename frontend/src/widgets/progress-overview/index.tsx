import { Box, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@shared/api'
import type { SkillType } from '@shared/model'
import { useAuthStore } from '@entities/user'
import { Card } from '@shared/ui'

const SKILLS: { key: SkillType; label: string }[] = [
  { key: 'READING', label: 'Reading' },
  { key: 'LISTENING', label: 'Listening' },
  { key: 'SPEAKING', label: 'Speaking' },
  { key: 'WRITING', label: 'Writing' },
]

/** Сводка прогресса студента: правильность по 4 видам речевой деятельности */
export function ProgressOverview() {
  const user = useAuthStore((s) => s.user)
  const analyticsQuery = useQuery({
    queryKey: ['analytics', 'student', user?.id],
    queryFn: () => analyticsApi.student(user!.id),
    enabled: Boolean(user?.id),
  })

  const data = analyticsQuery.data
  // не занимаем место, пока нет хоть каких-то оценённых ответов
  if (!data || data.totals.answered === 0) return null

  return (
    <Card padding="comfortable">
      <Flex justify="space-between" align="center" mb="12px" wrap="wrap" gap="8px">
        <Text fontSize="md" fontWeight="semibold">Skills accuracy</Text>
        <Text fontSize="sm" color="text.secondary">
          Overall: {Math.round(data.totals.accuracy * 100)}% of {data.totals.answered} answers
        </Text>
      </Flex>
      <SimpleGrid columns={{ base: 2, md: 4 }} gap="14px">
        {SKILLS.map(({ key, label }) => {
          const value = data.skillBreakdown[key]
          return (
            <Stack key={key} gap="6px">
              <Flex justify="space-between">
                <Text fontSize="xs" color="text.tertiary">{label}</Text>
                <Text fontSize="xs" fontWeight="medium">
                  {value === null ? '—' : `${Math.round(value * 100)}%`}
                </Text>
              </Flex>
              <Box h="6px" bg="bg.muted" borderRadius="full" overflow="hidden">
                <Box
                  h="100%"
                  w={`${Math.round((value ?? 0) * 100)}%`}
                  bg="accent.solid"
                  borderRadius="full"
                  transition="width 0.4s"
                />
              </Box>
            </Stack>
          )
        })}
      </SimpleGrid>
    </Card>
  )
}
