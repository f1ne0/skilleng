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

  // Последовательные номера пар (1,2,3…) — компактная подсветка соответствия
  // вместо дублирования длинного текста (он распирал колонки на телефоне).
  const pairNumber: Record<number, number> = {}
  {
    let n = 0
    step.lefts.forEach((_, i) => {
      if (mapping[i] !== undefined) {
        n += 1
        pairNumber[i] = n
      }
    })
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

      <Flex gap={{ base: '8px', md: '14px' }} align="flex-start">
        <Stack gap="8px" flex="1" minW="0">
          {step.lefts.map((text, i) => {
            const paired = mapping[i] !== undefined
            const isSelected = selectedLeft === i
            return (
              <PairButton
                key={`L-${i}`}
                text={text}
                paired={paired}
                pairNum={pairNumber[i]}
                selected={isSelected}
                onClick={() => handleLeftClick(i)}
                disabled={locked}
                status={status}
              />
            )
          })}
        </Stack>
        <Stack gap="8px" flex="1" minW="0">
          {step.rights.map((text, i) => {
            const usedByLeft = rightsUsedBy[i]
            const paired = usedByLeft !== undefined
            return (
              <PairButton
                key={`R-${i}`}
                text={text}
                paired={paired}
                pairNum={paired ? pairNumber[usedByLeft] : undefined}
                selected={false}
                onClick={() => handleRightClick(i)}
                disabled={locked || selectedLeft === null}
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
  text, paired, pairNum, selected, onClick, disabled, status,
}: {
  text: string
  paired: boolean
  pairNum?: number
  selected: boolean
  onClick: () => void
  disabled?: boolean
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
        fontSize={{ base: 'sm', md: 'md' }}
        fontFamily="body"
        textAlign="left"
        cursor={disabled ? 'default' : 'pointer'}
        css={{ overflowWrap: 'anywhere' }}
      >
        <Box flex="1" minW="0">{text}</Box>
        {locked && paired ? (
          <Box flexShrink={0} color={status === 'correct' ? 'accent.solid' : 'error'}>
            {status === 'correct' ? <Check size={16} /> : <X size={16} />}
          </Box>
        ) : pairNum ? (
          <Flex
            flexShrink={0}
            w="22px"
            h="22px"
            borderRadius="full"
            bg="accent.solid"
            color="text.onAccent"
            align="center"
            justify="center"
            fontSize="12px"
            fontWeight="bold"
          >
            {pairNum}
          </Flex>
        ) : null}
      </NativeButton>
    </motion.div>
  )
}
