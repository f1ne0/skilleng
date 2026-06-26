import { SimpleGrid, Box, Stack, Text, Flex } from '@chakra-ui/react'
import { Check } from 'lucide-react'
import { Card, Badge } from '@shared/ui'
import { LEVELS } from './data'
import type { CefrLevel } from '@shared/model'

interface Props {
  value: CefrLevel | null
  onChange: (level: CefrLevel) => void
}

const EASE = 'cubic-bezier(0.4,0,0.2,1)'
const TRANSITION = `opacity 200ms ${EASE}, transform 200ms ${EASE}`

export function StepLevel({ value, onChange }: Props) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap="12px" alignItems="stretch">
      {LEVELS.map((opt) => {
        const selected = value === opt.level
        return (
          <Card
            key={opt.level}
            interactive
            selected={selected}
            padding="comfortable"
            onClick={() => onChange(opt.level)}
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange(opt.level)
              }
            }}
          >
            <Stack gap="8px" h="100%">
              <Flex justify="space-between" align="flex-start" gap="8px">
                <Badge
                  tone={selected ? 'accent' : 'neutral'}
                  intensity={selected ? 'solid' : 'subtle'}
                  shape="pill"
                >
                  {opt.level}
                </Badge>
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
              <Box>
                <Text fontSize="md" fontWeight="semibold" lineHeight="tight">
                  {opt.title}
                </Text>
                <Text fontSize="sm" color="text.secondary" mt="4px" lineHeight="normal">
                  {opt.description}
                </Text>
              </Box>
              <Text
                fontSize="xs"
                color="text.tertiary"
                fontStyle="italic"
                mt="auto"
                pt="6px"
                lineHeight="normal"
              >
                {opt.example}
              </Text>
            </Stack>
          </Card>
        )
      })}
    </SimpleGrid>
  )
}
