import { Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export interface FilterOption<T extends string> {
  value: T
  label: string
}

export interface FilterChipsProps<T extends string> {
  label?: string
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function FilterChips<T extends string>({ label, options, value, onChange }: FilterChipsProps<T>) {
  return (
    <Flex align="center" gap="10px" wrap="wrap">
      {label && (
        <Text
          fontSize="xs"
          color="text.tertiary"
          letterSpacing="wide"
          textTransform="uppercase"
          fontWeight="medium"
          flexShrink={0}
        >
          {label}
        </Text>
      )}
      <Flex gap="6px" wrap="wrap">
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.12 }}
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 30,
                padding: '0 12px',
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'inherit',
                borderRadius: 9999,
                border: '1px solid',
                background: selected
                  ? 'var(--se-colors-accent-surface)'
                  : 'var(--se-colors-bg-surface)',
                borderColor: selected
                  ? 'var(--se-colors-border-accent)'
                  : 'var(--se-colors-border-subtle)',
                color: selected
                  ? 'var(--se-colors-accent-text)'
                  : 'var(--se-colors-text-secondary)',
                cursor: 'pointer',
                transition:
                  'background 150ms cubic-bezier(0.4,0,0.2,1), border-color 150ms, color 150ms',
                userSelect: 'none',
              }}
            >
              {selected && <Check size={11} strokeWidth={3} />}
              {opt.label}
            </motion.button>
          )
        })}
      </Flex>
    </Flex>
  )
}
