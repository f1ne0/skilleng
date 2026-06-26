import { useEffect, useRef } from 'react'
import { Box, Container, Stack } from '@chakra-ui/react'
import type { Conversation } from '../types'
import { Message } from './Message'

export function MessageList({ conversation }: { conversation: Conversation }) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lastMessage = conversation.messages[conversation.messages.length - 1]
  const contentLen = lastMessage?.content.length ?? 0
  const isStreaming = Boolean(lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '')
  const stickRef = useRef(true)

  // Track whether the user is near the bottom; only auto-scroll if they are.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      stickRef.current = distance < 80
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Snap to bottom when conversation changes
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    stickRef.current = true
  }, [conversation.id])

  // Tail the stream
  useEffect(() => {
    if (!stickRef.current) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [contentLen, conversation.messages.length, isStreaming])

  return (
    <Box ref={scrollRef} flex="1" overflowY="auto" overflowX="hidden">
      <Container maxW="720px" py="24px" px={{ base: '16px', md: '24px' }}>
        <Stack gap="0">
          {conversation.messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
        </Stack>
      </Container>
    </Box>
  )
}
