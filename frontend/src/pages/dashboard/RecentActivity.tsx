import type { ReactNode } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { BookOpenCheck, Flame, BookA, TrendingUp } from 'lucide-react'
import { Card } from '@shared/ui'
import type { ActivityItem } from './types'

const KIND_ICON: Record<ActivityItem['kind'], { Icon: ReactNode; tint: string; bg: string }> = {
  lesson: { Icon: <BookOpenCheck size={14} />, tint: 'accent.text', bg: 'accent.surface' },
  streak: { Icon: <Flame size={14} fill="currentColor" />, tint: 'warning', bg: 'rgba(245,158,11,0.10)' },
  word:   { Icon: <BookA size={14} />, tint: 'info', bg: 'rgba(59,130,246,0.10)' },
  level:  { Icon: <TrendingUp size={14} />, tint: 'accent.text', bg: 'accent.surface' },
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card padding="comfortable" style={{ height: '100%' }}>
      <Stack gap="12px" h="100%">
        <Flex justify="space-between" align="center">
          <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
            Recent activity
          </Text>
          <Text fontSize="xs" color="text.tertiary">Last 7 days</Text>
        </Flex>
        {items.length === 0 && (
          <Flex flex="1" align="center" justify="center" py="24px">
            <Text fontSize="sm" color="text.tertiary" textAlign="center">
              No activity yet — finish a lesson to see it here.
            </Text>
          </Flex>
        )}
        <Stack gap="0">
          {items.map((item, idx) => {
            const k = KIND_ICON[item.kind]
            return (
              <Flex
                key={item.id}
                align="center"
                gap="12px"
                py="11px"
                borderTop={idx === 0 ? 'none' : '1px solid'}
                borderColor="border.subtle"
              >
                <Box
                  w="28px"
                  h="28px"
                  borderRadius="md"
                  bg={k.bg}
                  color={k.tint}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {k.Icon}
                </Box>
                <Box flex="1" minW="0">
                  <Text fontSize="sm" color="text.primary" lineHeight="tight" truncate>
                    {item.title}
                  </Text>
                  <Flex align="center" gap="6px" mt="3px">
                    <Text fontSize="xs" color="accent.text" fontWeight="medium">
                      {item.meta}
                    </Text>
                    <Text fontSize="xs" color="text.tertiary">·</Text>
                    <Text fontSize="xs" color="text.tertiary">{item.ago}</Text>
                  </Flex>
                </Box>
              </Flex>
            )
          })}
        </Stack>
      </Stack>
    </Card>
  )
}
