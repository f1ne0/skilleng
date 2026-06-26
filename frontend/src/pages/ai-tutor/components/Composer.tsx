import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { Box, Container, Flex, Text } from '@chakra-ui/react'
import { ArrowUp, Square } from 'lucide-react'
import { NativeButton, NativeTextarea } from '@shared/ui'

const MAX_HEIGHT = 220

export interface ComposerProps {
  onSubmit: (text: string) => void
  onStop: () => void
  isStreaming: boolean
  /** controlled, so suggested-prompts can pre-fill */
  draft: string
  setDraft: (v: string) => void
}

export function Composer({ onSubmit, onStop, isStreaming, draft, setDraft }: ComposerProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const [focused, setFocused] = useState(false)

  // auto-grow
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, MAX_HEIGHT)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [draft])

  const submit = () => {
    const v = draft.trim()
    if (!v || isStreaming) return
    onSubmit(v)
    setDraft('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = !isStreaming && draft.trim().length > 0

  return (
    <Box
      position="sticky"
      bottom="0"
      bg="bg.canvas"
      style={{
        background:
          'linear-gradient(to bottom, color-mix(in srgb, var(--se-colors-bg-canvas) 0%, transparent), var(--se-colors-bg-canvas) 28%)',
      }}
      pt="20px"
    >
      <Container maxW="720px" px={{ base: '16px', md: '24px' }} pb="20px">
        <Box
          position="relative"
          bg="bg.surface"
          border="1px solid"
          borderColor={focused ? 'accent.solid' : 'border.default'}
          borderRadius="xl"
          transition="border-color 150ms, box-shadow 150ms"
          boxShadow={focused ? 'focus' : '0 1px 2px rgba(15,23,42,0.04)'}
        >
          <Flex align="flex-end" gap="10px" p="10px">
            <NativeTextarea
              ref={taRef}
              value={draft}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Ask anything about English…"
              rows={1}
              flex="1"
              bg="transparent"
              border="none"
              outline="none"
              resize="none"
              px="8px"
              py="8px"
              fontSize="md"
              fontFamily="body"
              lineHeight="relaxed"
              color="text.primary"
              _placeholder={{ color: 'text.tertiary' }}
              maxH={`${MAX_HEIGHT}px`}
            />

            {isStreaming ? (
              <NativeButton
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                w="36px"
                h="36px"
                bg="bg.subtle"
                border="1px solid"
                borderColor="border.default"
                borderRadius="full"
                color="text.primary"
                cursor="pointer"
                flexShrink={0}
                transition="background 150ms"
                _hover={{ bg: 'bg.muted' }}
              >
                <Square size={12} fill="currentColor" />
              </NativeButton>
            ) : (
              <NativeButton
                type="button"
                onClick={submit}
                disabled={!canSend}
                aria-label="Send"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                w="36px"
                h="36px"
                bg={canSend ? 'accent.solid' : 'bg.muted'}
                border="none"
                borderRadius="full"
                color={canSend ? 'text.onAccent' : 'text.tertiary'}
                cursor={canSend ? 'pointer' : 'not-allowed'}
                flexShrink={0}
                transition="background 150ms, transform 80ms"
                _hover={canSend ? { bg: 'accent.solidHover' } : undefined}
                _active={canSend ? { transform: 'scale(0.94)' } : undefined}
              >
                <ArrowUp size={16} strokeWidth={2.6} />
              </NativeButton>
            )}
          </Flex>
        </Box>

        <Flex justify="center" mt="8px">
          <Text fontSize="xs" color="text.tertiary">
            AI Tutor can make mistakes. Verify important details.
            <Text as="span" color="text.tertiary" mx="6px">·</Text>
            <Text as="span" fontFamily="mono">Enter</Text> to send,{' '}
            <Text as="span" fontFamily="mono">Shift+Enter</Text> for a new line
          </Text>
        </Flex>
      </Container>
    </Box>
  )
}
