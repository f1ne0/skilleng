import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { NativeButton } from '@shared/ui'
import type { MatchPairsStep, StepStatus } from '../types'

export interface StepMatchPairsProps {
  step: MatchPairsStep
  /** Map of leftIndex -> rightIndex. */
  mapping: Record<number, number>
  status: StepStatus
  onChange: (mapping: Record<number, number>) => void
  /** Currently selected left (waiting to pair with a right). */
  selectedLeft: number | null
  onSelectLeft: (i: number | null) => void
}

export function StepMatchPairs({
  step, mapping, status, onChange, selectedLeft, onSelectLeft,
}: StepMatchPairsProps) {
  const locked = status === 'correct' || status === 'wrong'

  const rightsUsedBy: Record<number, number> = {}
  for (const [leftIdx, rightIdx] of Object.entries(mapping)) {
    rightsUsedBy[rightIdx] = Number(leftIdx)
  }

  const handleRightClick = (rightIdx: number) => {
    if (locked) return
    if (selectedLeft === null) return
    const next: Record<number, number> = { ...mapping }
    // Remove any existing pair using this right
    const prevLeftForRight = rightsUsedBy[rightIdx]
    if (prevLeftForRight !== undefined) delete next[prevLeftForRight]
    next[selectedLeft] = rightIdx
    onChange(next)
    onSelectLeft(null)
  }

  const handleLeftClick = (leftIdx: number) => {
    if (locked) return
    if (selectedLeft === leftIdx) {
      onSelectLeft(null)
      return
    }
    // If already mapped, clicking left clears its pairing
    if (mapping[leftIdx] !== undefined) {
      const next = { ...mapping }
      delete next[leftIdx]
      onChange(next)
      onSelectLeft(leftIdx)
      return
    }
    onSelectLeft(leftIdx)
  }

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
          Match the pairs
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

      <Flex gap="14px" align="flex-start">
        <Stack gap="8px" flex="1">
          {step.lefts.map((text, i) => {
            const paired = mapping[i] !== undefined
            const isSelected = selectedLeft === i
            return (
              <PairButton
                key={`L-${i}`}
                text={text}
                paired={paired}
                pairedLabel={paired ? step.rights[mapping[i]!] : undefined}
                selected={isSelected}
                onClick={() => handleLeftClick(i)}
                disabled={locked}
                side="left"
                status={status}
              />
            )
          })}
        </Stack>
        <Stack gap="8px" flex="1">
          {step.rights.map((text, i) => {
            const usedByLeft = rightsUsedBy[i]
            const paired = usedByLeft !== undefined
            return (
              <PairButton
                key={`R-${i}`}
                text={text}
                paired={paired}
                pairedLabel={paired ? step.lefts[usedByLeft] : undefined}
                selected={false}
                onClick={() => handleRightClick(i)}
                disabled={locked || selectedLeft === null}
                side="right"
                status={status}
              />
            )
          })}
        </Stack>
      </Flex>
    </Stack>
  )
}

function PairButton({
  text, paired, pairedLabel, selected, onClick, disabled, side, status,
}: {
  text: string
  paired: boolean
  pairedLabel?: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
  side: 'left' | 'right'
  status: StepStatus
}) {
  const locked = status === 'correct' || status === 'wrong'
  let bg = 'bg.surface'
  let borderColor = 'border.subtle'
  let color = 'text.primary'

  if (selected) {
    bg = 'accent.surface'
    borderColor = 'accent.solid'
    color = 'accent.text'
  } else if (paired) {
    bg = 'accent.surface'
    borderColor = 'border.accent'
    color = 'accent.text'
  }

  return (
    <motion.div whileTap={!disabled ? { scale: 0.995 } : undefined}>
      <NativeButton
        type="button"
        onClick={onClick}
        disabled={disabled}
        display="flex"
        alignItems="center"
        gap="10px"
        w="100%"
        p="12px 14px"
        bg={bg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        color={color}
        fontSize="md"
        fontFamily="body"
        textAlign="left"
        cursor={disabled ? 'default' : 'pointer'}
      >
        <Box flex="1">{text}</Box>
        {paired && pairedLabel && (
          <Box fontSize="xs" color="text.tertiary" fontFamily="mono">
            {side === 'left' ? '→' : '←'} {pairedLabel}
          </Box>
        )}
        {locked && paired && (
          <Box color={status === 'correct' ? 'accent.solid' : 'error'}>
            {status === 'correct' ? <Check size={14} /> : <X size={14} />}
          </Box>
        )}
      </NativeButton>
    </motion.div>
  )
}
