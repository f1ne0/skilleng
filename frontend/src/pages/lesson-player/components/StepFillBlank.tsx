import { useEffect, useRef } from 'react'
import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { NativeInput } from '@shared/ui'
import type { FillBlankStep, StepStatus } from '../types'

export interface StepFillBlankProps {
  step: FillBlankStep
  answer: string
  status: StepStatus
  onChange: (value: string) => void
  onSubmit: () => void
}

export function StepFillBlank({
  step, answer, status, onChange, onSubmit,
}: StepFillBlankProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const locked = status === 'correct' || status === 'wrong'

  useEffect(() => {
    if (!locked) inputRef.current?.focus()
  }, [locked, step.id])

  const before = step.text.split('___')[0] ?? ''
  const after = step.text.split('___')[1] ?? ''

  const borderColor =
    status === 'correct' ? 'accent.solid'
    : status === 'wrong'  ? 'error'
    : 'border.default'

  const ringShadow =
    status === 'correct' ? '0 0 0 3px rgba(16,185,129,0.30)'
    : status === 'wrong'  ? '0 0 0 3px rgba(244,63,94,0.25)'
    : undefined

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
          {step.prompt}
        </Text>
        <Heading
          as="h2"
          fontSize={{ base: 'xl', md: '2xl' }}
          fontWeight="semibold"
          letterSpacing="tight"
          lineHeight="relaxed"
        >
          <Box as="span" color="text.primary">{before}</Box>
          <Box
            as="span"
            display="inline-flex"
            alignItems="baseline"
            mx="6px"
            verticalAlign="baseline"
          >
            <NativeInput
              ref={inputRef}
              value={answer}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !locked) {
                  e.preventDefault()
                  onSubmit()
                }
              }}
              placeholder="…"
              disabled={locked}
              spellCheck={false}
              autoCapitalize={step.caseSensitive ? 'sentences' : 'none'}
              autoComplete="off"
              w={{ base: '160px', md: '220px' }}
              h="44px"
              px="14px"
              bg="bg.surface"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="semibold"
              fontFamily="body"
              color={status === 'wrong' ? 'error' : 'text.primary'}
              outline="none"
              transition="border-color 150ms, box-shadow 150ms, color 150ms"
              boxShadow={ringShadow}
              _focus={{
                outline: 'none',
                borderColor: status === 'wrong' ? 'error' : 'accent.solid',
                boxShadow: ringShadow ?? '0 0 0 3px rgba(16,185,129,0.30)',
              }}
              _placeholder={{ color: 'text.tertiary' }}
            />
          </Box>
          <Box as="span" color="text.primary">{after}</Box>
        </Heading>
      </Stack>

      {!step.caseSensitive && status === 'pending' && (
        <Flex
          align="flex-start"
          gap="10px"
          p="10px 14px"
          bg="bg.subtle"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="md"
          color="text.secondary"
          fontSize="xs"
        >
          <Box>Case-insensitive — capitalization doesn't matter.</Box>
        </Flex>
      )}
    </Stack>
  )
}
