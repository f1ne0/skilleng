import { Box, Heading, Stack, Text, Wrap } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { NativeButton } from '@shared/ui'
import type { DragDropStep, StepStatus } from '../types'

export interface StepDragDropProps {
  step: DragDropStep
  /** Words currently arranged by the user (in their chosen order). */
  ordered: string[]
  status: StepStatus
  onChange: (ordered: string[]) => void
}

export function StepDragDrop({ step, ordered, status, onChange }: StepDragDropProps) {
  const locked = status === 'correct' || status === 'wrong'

  const remaining = step.words.filter((w, i) => {
    // Word may appear multiple times in `words`; track by occurrence index.
    const used = ordered.filter((x) => x === w).length
    const totalSame = step.words.filter((x) => x === w).length
    const beforeI = step.words.slice(0, i).filter((x) => x === w).length
    return beforeI + used < totalSame
  })

  const pickWord = (word: string) => {
    if (locked) return
    onChange([...ordered, word])
  }
  const removeWord = (idx: number) => {
    if (locked) return
    onChange(ordered.filter((_, i) => i !== idx))
  }

  const borderColor =
    status === 'correct' ? 'accent.solid'
    : status === 'wrong'  ? 'error'
    : 'border.default'

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
          Arrange the words
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

      <Box
        minH="80px"
        p="14px"
        bg="bg.surface"
        border="1px dashed"
        borderColor={borderColor}
        borderRadius="lg"
      >
        {ordered.length === 0 ? (
          <Text fontSize="sm" color="text.tertiary">
            Tap words below to build the sentence.
          </Text>
        ) : (
          <Wrap gap="8px">
            {ordered.map((w, i) => (
              <WordChip key={`${w}-${i}`} word={w} onClick={() => removeWord(i)} disabled={locked} />
            ))}
          </Wrap>
        )}
      </Box>

      <Box>
        <Text fontSize="xs" color="text.tertiary" mb="10px" letterSpacing="wide" textTransform="uppercase">
          Words
        </Text>
        <Wrap gap="8px">
          {remaining.map((w, i) => (
            <WordChip
              key={`${w}-pool-${i}`}
              word={w}
              onClick={() => pickWord(w)}
              disabled={locked}
              variant="pool"
            />
          ))}
        </Wrap>
      </Box>
    </Stack>
  )
}

function WordChip({
  word, onClick, disabled, variant = 'placed',
}: {
  word: string
  onClick: () => void
  disabled?: boolean
  variant?: 'placed' | 'pool'
}) {
  return (
    <motion.div whileTap={!disabled ? { scale: 0.95 } : undefined}>
      <NativeButton
        type="button"
        onClick={onClick}
        disabled={disabled}
        px="12px"
        h="36px"
        bg={variant === 'placed' ? 'accent.surface' : 'bg.surface'}
        color={variant === 'placed' ? 'accent.text' : 'text.primary'}
        border="1px solid"
        borderColor={variant === 'placed' ? 'border.accent' : 'border.subtle'}
        borderRadius="md"
        fontSize="md"
        fontFamily="body"
        cursor={disabled ? 'default' : 'pointer'}
      >
        {word}
      </NativeButton>
    </motion.div>
  )
}
