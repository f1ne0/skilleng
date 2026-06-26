import { Box, Heading, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { NativeButton } from '@shared/ui'
import type { MultipleChoiceStep, StepStatus } from '../types'

export interface StepMultipleChoiceProps {
  step: MultipleChoiceStep
  selectedIndex: number | null
  status: StepStatus
  /** Index of the correct option — only known after a wrong submission. */
  correctIndex: number | null
  onSelect: (index: number) => void
}

export function StepMultipleChoice({
  step, selectedIndex, status, correctIndex, onSelect,
}: StepMultipleChoiceProps) {
  const locked = status === 'correct' || status === 'wrong'

  return (
    <Stack gap="22px">
      <Stack gap="6px">
        <Text
          fontSize="xs"
          color="accent.text"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
        >
          Choose the right answer
        </Text>
        <Heading
          as="h2"
          fontSize={{ base: 'xl', md: '2xl' }}
          fontWeight="semibold"
          letterSpacing="tight"
          lineHeight="tight"
        >
          {step.prompt}
        </Heading>
      </Stack>

      <Stack gap="10px">
        {step.options.map((text, i) => {
          const isSelected = selectedIndex === i
          const showCorrect = locked && status === 'correct' && isSelected
          const showRevealedCorrect = locked && correctIndex === i && correctIndex !== selectedIndex
          const isWrongSelection = locked && status === 'wrong' && isSelected

          let bg = 'bg.surface'
          let borderColor = 'border.subtle'
          let color = 'text.primary'
          let iconNode: React.ReactNode = null

          if (showCorrect || showRevealedCorrect) {
            bg = 'accent.surface'
            borderColor = 'accent.solid'
            color = 'accent.text'
            iconNode = (
              <Box
                w="22px" h="22px"
                borderRadius="full"
                bg="accent.solid"
                color="white"
                display="flex" alignItems="center" justifyContent="center"
              >
                <Check size={13} strokeWidth={3} />
              </Box>
            )
          } else if (isWrongSelection) {
            bg = 'rgba(244,63,94,0.08)'
            borderColor = 'error'
            color = 'error'
            iconNode = (
              <Box
                w="22px" h="22px"
                borderRadius="full"
                bg="error"
                color="white"
                display="flex" alignItems="center" justifyContent="center"
              >
                <X size={13} strokeWidth={3} />
              </Box>
            )
          } else if (isSelected) {
            bg = 'accent.surface'
            borderColor = 'border.accent'
            color = 'accent.text'
          }

          return (
            <motion.div
              key={i}
              whileHover={!locked ? { y: -1 } : undefined}
              whileTap={!locked ? { scale: 0.995 } : undefined}
              transition={{ duration: 0.12 }}
            >
              <NativeButton
                type="button"
                onClick={() => !locked && onSelect(i)}
                aria-pressed={isSelected}
                disabled={locked && !isSelected && !showRevealedCorrect}
                display="flex"
                alignItems="center"
                gap="14px"
                w="100%"
                p="14px 16px"
                bg={bg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                color={color}
                fontSize="md"
                fontFamily="body"
                textAlign="left"
                cursor={locked ? 'default' : 'pointer'}
                transition="background 150ms cubic-bezier(0.4,0,0.2,1), border-color 150ms, color 150ms"
              >
                <Box
                  w="28px" h="28px"
                  borderRadius="md"
                  bg={isSelected || showRevealedCorrect ? 'transparent' : 'bg.subtle'}
                  border="1px solid"
                  borderColor={isSelected || showRevealedCorrect ? 'transparent' : 'border.subtle'}
                  display="flex" alignItems="center" justifyContent="center"
                  fontSize="13px"
                  fontWeight="semibold"
                  fontFamily="mono"
                  color={isSelected ? color : 'text.tertiary'}
                  flexShrink={0}
                >
                  {String.fromCharCode(65 + i)}
                </Box>
                <Box flex="1">{text}</Box>
                {iconNode}
              </NativeButton>
            </motion.div>
          )
        })}
      </Stack>
    </Stack>
  )
}
