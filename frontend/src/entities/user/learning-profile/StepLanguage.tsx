import { useMemo, useState } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Check } from 'lucide-react'
import { Input } from '@shared/ui'
import { LANGUAGES, type LanguageOption } from './data'

interface Props {
  value: string | null
  onChange: (code: string) => void
}

export function StepLanguage({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  // read-only до фокуса — Chrome не автозаполняет такое поле при загрузке
  const [ready, setReady] = useState(false)
  const [fieldName] = useState(() => `lang-${Math.random().toString(36).slice(2)}`)

  const filtered = useMemo<LanguageOption[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return LANGUAGES
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <Stack gap="14px">
      <Input
        placeholder="Search languages…"
        leftIcon={<Search size={14} />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        name={fieldName}
        type="search"
        readOnly={!ready}
        onFocus={() => setReady(true)}
      />

      <Box
        maxH="320px"
        overflowY="auto"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="lg"
        bg="bg.surface"
      >
        {filtered.length === 0 ? (
          <Flex p="32px" align="center" justify="center" color="text.tertiary" fontSize="sm">
            No languages match "{query}".
          </Flex>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((lang, idx) => {
              const selected = value === lang.code
              return (
                <motion.button
                  key={lang.code}
                  type="button"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onChange(lang.code)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 16px',
                    background: selected ? 'var(--se-colors-accent-surface)' : 'transparent',
                    border: 'none',
                    borderBottom:
                      idx === filtered.length - 1
                        ? 'none'
                        : '1px solid var(--se-colors-border-subtle)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.background = 'var(--se-colors-bg-subtle)'
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Flex align="center" gap="12px">
                    <Flex
                      w="34px"
                      h="34px"
                      align="center"
                      justify="center"
                      borderRadius="md"
                      bg="bg.subtle"
                      border="1px solid"
                      borderColor="border.subtle"
                      flexShrink={0}
                    >
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        color="text.secondary"
                      >
                        {lang.code}
                      </Text>
                    </Flex>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="text.primary">
                        {lang.name}
                      </Text>
                      <Text fontSize="xs" color="text.tertiary">
                        {lang.native}
                      </Text>
                    </Box>
                  </Flex>
                  {selected && (
                    <Box
                      w="20px"
                      h="20px"
                      borderRadius="full"
                      bg="accent.solid"
                      color="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Check size={12} strokeWidth={3} />
                    </Box>
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        )}
      </Box>
    </Stack>
  )
}
