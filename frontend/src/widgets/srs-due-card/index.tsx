import { useNavigate } from 'react-router-dom'
import { Flex, Stack, Text } from '@chakra-ui/react'
import { BookMarked } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { vocabularyApi } from '@shared/api'
import { Button, Card } from '@shared/ui'

/** Виджет дашборда: сколько слов ждёт интервального повтора */
export function SrsDueCard() {
  const navigate = useNavigate()
  const statsQuery = useQuery({
    queryKey: ['vocabulary', 'stats'],
    queryFn: vocabularyApi.stats,
  })

  const stats = statsQuery.data
  // Пока словарь пуст или статистика не загрузилась — не занимаем место
  if (!stats || stats.total === 0) return null

  const due = stats.dueNow

  return (
    <Card padding="comfortable">
      <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
        <Flex align="center" gap="12px">
          <BookMarked size={20} />
          <Stack gap="2px">
            <Text fontSize="md" fontWeight="semibold">
              {due > 0
                ? `${due} ${due === 1 ? 'word' : 'words'} due for review`
                : 'Vocabulary on schedule'}
            </Text>
            <Text fontSize="sm" color="text.secondary">
              {due > 0
                ? 'Review now — the interval is timed right before forgetting.'
                : `${stats.learned} of ${stats.total} words learned.`}
            </Text>
          </Stack>
        </Flex>
        <Button size="sm" variant={due > 0 ? 'primary' : 'secondary'} onClick={() => navigate(due > 0 ? '/vocabulary/review' : '/vocabulary')}>
          {due > 0 ? 'Review' : 'Open vocabulary'}
        </Button>
      </Flex>
    </Card>
  )
}
