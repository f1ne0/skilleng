import { SimpleGrid, Box, Stack, Text, Flex } from '@chakra-ui/react'
import { Check } from 'lucide-react'
import { Card } from '@shared/ui'
import { GOALS } from './data'
import type { LearningGoal } from '@shared/model'

interface Props {
  value: LearningGoal | null
  onChange: (goal: LearningGoal) => void
}

const EASE = 'cubic-bezier(0.4,0,0.2,1)'
const TRANSITION = `background 200ms ${EASE}, color 200ms ${EASE}, opacity 200ms ${EASE}, transform 200ms ${EASE}, border-color 200ms ${EASE}`

export function StepGoal({ value, onChange }: Props) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap="12px" alignItems="stretch">
      {GOALS.map(({ goal, title, description, Icon }) => {
        const selected = value === goal
        return (
          <Card
            key={goal}
            interactive
            selected={selected}
            padding="comfortable"
            onClick={() => onChange(goal)}
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange(goal)
              }
            }}
          >
            <Flex gap="14px" align="flex-start" h="100%">
              <Box
                w="44px"
                h="44px"
                borderRadius="lg"
                bg={selected ? 'accent.solid' : 'accent.surface'}
                color={selected ? 'text.onAccent' : 'accent.text'}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                transition={TRANSITION}
              >
                <Icon size={20} />
              </Box>
              <Stack gap="4px" flex="1">
                <Flex justify="space-between" align="center" gap="8px">
                  <Text fontSize="md" fontWeight="semibold" lineHeight="tight">
                    {title}
                  </Text>
                  {/* always reserved — prevents row-height reflow */}
                  <Box
                    w="22px"
                    h="22px"
                    borderRadius="full"
                    bg="accent.solid"
                    color="text.onAccent"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    opacity={selected ? 1 : 0}
                    transform={selected ? 'scale(1)' : 'scale(0.85)'}
                    transition={TRANSITION}
                    aria-hidden={!selected}
                  >
                    <Check size={13} strokeWidth={3} />
                  </Box>
                </Flex>
                <Text fontSize="sm" color="text.secondary" lineHeight="normal">
                  {description}
                </Text>
              </Stack>
            </Flex>
          </Card>
        )
      })}
    </SimpleGrid>
  )
}
