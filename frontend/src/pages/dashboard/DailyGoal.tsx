import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import { Card } from '@shared/ui'

export interface DailyGoalProps {
  goal: number
  earned: number
}

export function DailyGoal({ goal, earned }: DailyGoalProps) {
  const pct = Math.min(1, earned / Math.max(1, goal))
  const size = 156
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference * pct
  const remaining = Math.max(0, goal - earned)
  const done = earned >= goal

  return (
    <Card padding="comfortable" style={{ height: '100%' }}>
      <Stack gap="14px" h="100%">
        <Flex justify="space-between" align="center">
          <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
            Daily goal
          </Text>
          <Box color="accent.text" display="inline-flex">
            <Target size={16} />
          </Box>
        </Flex>

        <Flex flex="1" align="center" justify="center" position="relative" minH={`${size}px`}>
          <Box position="relative" w={`${size}px`} h={`${size}px`}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <defs>
                <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"  stopColor="var(--se-colors-accent-solid)" />
                  <stop offset="100%" stopColor="var(--se-colors-accent-solidHover)" />
                </linearGradient>
              </defs>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--se-colors-bg-muted)"
                strokeWidth={stroke}
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#ring-grad)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - dash }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <Flex
              position="absolute"
              inset="0"
              direction="column"
              align="center"
              justify="center"
              gap="2px"
            >
              <Text
                fontSize="3xl"
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="none"
                fontFamily="mono"
              >
                {earned}
              </Text>
              <Text fontSize="xs" color="text.tertiary">of {goal} XP</Text>
            </Flex>
          </Box>
        </Flex>

        <Text fontSize="sm" color="text.secondary" textAlign="center">
          {done ? "Goal hit — one more won't hurt." : `${remaining} XP left today.`}
        </Text>
      </Stack>
    </Card>
  )
}
