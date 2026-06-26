import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import type { ShortWritingStep, StepStatus } from '../types'

export interface StepShortWritingProps {
  step: ShortWritingStep
  text: string
  status: StepStatus
  onChange: (text: string) => void
}

export function StepShortWriting({ step, text, status, onChange }: StepShortWritingProps) {
  const locked = status === 'correct' || status === 'wrong'
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const inRange = wordCount >= step.minWords && wordCount <= step.maxWords

  const borderColor =
    status === 'correct' ? 'accent.solid'
    : status === 'wrong'  ? 'error'
    : inRange             ? 'accent.solid'
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
          Short writing
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
        {step.rubric && (
          <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">
            {step.rubric}
          </Text>
        )}
      </Stack>

      <Box>
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          disabled={locked}
          placeholder="Write your response here…"
          style={{
            width: '100%',
            minHeight: 200,
            padding: '14px 16px',
            background: 'var(--se-colors-bg-surface)',
            border: `1px solid var(--se-colors-${borderColor.includes('.') ? borderColor.replace('.', '-') : borderColor})`,
            borderRadius: 12,
            color: 'var(--se-colors-text-primary)',
            fontSize: 15,
            lineHeight: 1.6,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <Flex justify="space-between" mt="6px">
          <Text fontSize="xs" color="text.tertiary">
            {step.minWords}–{step.maxWords} words required
          </Text>
          <Text
            fontSize="xs"
            fontFamily="mono"
            color={inRange ? 'accent.text' : wordCount > step.maxWords ? 'error' : 'text.tertiary'}
          >
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Text>
        </Flex>
      </Box>
    </Stack>
  )
}
