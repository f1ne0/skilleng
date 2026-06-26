import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { INTERESTS, MIN_INTERESTS, MAX_INTERESTS } from './data'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
}

export function StepInterests({ value, onChange }: Props) {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item))
      return
    }
    if (value.length >= MAX_INTERESTS) return
    onChange([...value, item])
  }

  const count = value.length
  const atMax = count >= MAX_INTERESTS

  return (
    <Stack gap="16px">
      <Flex align="center" justify="space-between">
        <Text fontSize="sm" color="text.secondary">
          Pick between {MIN_INTERESTS} and {MAX_INTERESTS} topics.
        </Text>
        <Text
          fontSize="xs"
          fontWeight="medium"
          color={count >= MIN_INTERESTS ? 'accent.text' : 'text.tertiary'}
        >
          {count} / {MAX_INTERESTS}
        </Text>
      </Flex>

      <Flex wrap="wrap" gap="8px">
        {INTERESTS.map((item) => {
          const selected = value.includes(item)
          const disabled = !selected && atMax
          return (
            <motion.button
              key={item}
              type="button"
              whileTap={disabled ? undefined : { scale: 0.96 }}
              transition={{ duration: 0.12 }}
              onClick={() => toggle(item)}
              disabled={disabled}
              aria-pressed={selected}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 36,
                padding: '0 14px',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'inherit',
                borderRadius: 9999,
                border: '1px solid',
                background: selected ? 'var(--se-colors-accent-surface)' : 'transparent',
                borderColor: selected
                  ? 'var(--se-colors-border-accent)'
                  : 'var(--se-colors-border-default)',
                color: selected
                  ? 'var(--se-colors-accent-text)'
                  : 'var(--se-colors-text-primary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'background 150ms, border-color 150ms, color 150ms',
                userSelect: 'none',
              }}
            >
              {selected && (
                <Box display="inline-flex" alignItems="center">
                  <Check size={12} strokeWidth={3} />
                </Box>
              )}
              {item}
            </motion.button>
          )
        })}
      </Flex>
    </Stack>
  )
}
