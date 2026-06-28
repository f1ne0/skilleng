import { useState, useEffect } from 'react'
import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { MessagesSquare, Plus } from 'lucide-react'
import { useChatStore } from './store'
import {
  useActiveConversation,
  useSendMessage,
} from './hooks'
import { ConversationList } from './components/ConversationList'
import { MessageList } from './components/MessageList'
import { Composer } from './components/Composer'
import { EmptyState } from './components/EmptyState'
import { Skeleton, NativeButton } from '@shared/ui'

const SIDEBAR_W = 280

export function AITutorPage() {
  const activeId = useChatStore((s) => s.activeId)
  const select = useChatStore((s) => s.selectConversation)
  const draft = useChatStore((s) => s.draft)
  const setDraft = useChatStore((s) => s.setDraft)

  // Мобильный drawer со списком чатов (на десктопе список всегда виден слева)
  const [listOpen, setListOpen] = useState(false)
  useEffect(() => {
    setListOpen(false)
  }, [activeId])

  const activeQuery = useActiveConversation(activeId)
  const active = activeQuery.data ?? null

  const sendMutation = useSendMessage()
  const isSending = sendMutation.isPending

  const handleSubmit = (text: string) => {
    sendMutation.mutate(text)
  }
  const handleStop = () => {
    sendMutation.abort()
  }

  return (
    <Flex h="calc(100vh - 64px)" overflow="hidden" bg="bg.canvas">
      <Box
        w={`${SIDEBAR_W}px`}
        flexShrink={0}
        h="100%"
        borderRight="1px solid"
        borderColor={{ base: '#E0E0E0', _dark: 'border.subtle' }}
        bg="bg.canvas"
        p="16px"
        display={{ base: 'none', md: 'block' }}
      >
        <ConversationList />
      </Box>

      <Flex direction="column" flex="1" minW="0" minH="0">
        <Flex
          align="center"
          justify="space-between"
          gap="8px"
          px={{ base: '12px', md: '24px' }}
          h="56px"
          borderBottom="1px solid"
          borderColor={{ base: '#E0E0E0', _dark: 'border.subtle' }}
          flexShrink={0}
        >
          <Flex align="center" gap="6px" minW="0">
            <NativeButton
              type="button"
              onClick={() => setListOpen(true)}
              aria-label="Conversations"
              display={{ base: 'flex', md: 'none' }}
              alignItems="center"
              justifyContent="center"
              w="36px"
              h="36px"
              flexShrink={0}
              bg="transparent"
              border="none"
              borderRadius="md"
              color="text.secondary"
              cursor="pointer"
              _hover={{ bg: 'bg.subtle', color: 'text.primary' }}
            >
              <MessagesSquare size={18} />
            </NativeButton>
            <Heading as="h1" fontSize="md" fontWeight="semibold" letterSpacing="tight" truncate>
              {active ? active.title : 'AI Tutor'}
            </Heading>
          </Flex>
          <NativeButton
            type="button"
            onClick={() => select(null)}
            aria-label="New chat"
            display={{ base: 'flex', md: 'none' }}
            alignItems="center"
            justifyContent="center"
            gap="6px"
            h="36px"
            px="12px"
            flexShrink={0}
            bg="accent.solid"
            color="text.onAccent"
            border="none"
            borderRadius="md"
            fontSize="sm"
            fontWeight="medium"
            fontFamily="body"
            cursor="pointer"
            _hover={{ bg: 'accent.solidHover' }}
          >
            <Plus size={16} strokeWidth={2.4} />
            New
          </NativeButton>
        </Flex>

        {activeId && activeQuery.isLoading ? (
          <Box flex="1" p="20px">
            <Skeleton h="60px" mb="12px" borderRadius="md" />
            <Skeleton h="80px" mb="12px" borderRadius="md" />
            <Skeleton h="120px" borderRadius="md" />
          </Box>
        ) : activeQuery.isError ? (
          <Box flex="1" p="20px">
            <Text fontSize="sm" color="error">Couldn't load conversation.</Text>
          </Box>
        ) : active && active.messages.length > 0 ? (
          <MessageList conversation={active} />
        ) : (
          <Box flex="1" overflowY="auto">
            <EmptyState onPickPrompt={handleSubmit} />
          </Box>
        )}

        <Composer
          onSubmit={handleSubmit}
          onStop={handleStop}
          isStreaming={isSending}
          draft={draft}
          setDraft={setDraft}
        />
      </Flex>

      {/* Мобильный drawer со списком чатов. Закрыт → нет DOM. */}
      {listOpen && (
        <Box position="fixed" inset="0" zIndex={50} display={{ base: 'block', md: 'none' }}>
          <Box position="absolute" inset="0" bg="rgba(0,0,0,0.5)" onClick={() => setListOpen(false)} />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 460, damping: 42 }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: 288,
              maxWidth: '85vw',
              background: 'var(--se-colors-bg-canvas)',
              borderRight: '1px solid var(--se-colors-border-subtle)',
              padding: 16,
            }}
          >
            <ConversationList />
          </motion.aside>
        </Box>
      )}
    </Flex>
  )
}
