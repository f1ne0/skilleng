import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import { useChatStore } from './store'
import {
  useActiveConversation,
  useSendMessage,
} from './hooks'
import { ConversationList } from './components/ConversationList'
import { MessageList } from './components/MessageList'
import { Composer } from './components/Composer'
import { EmptyState } from './components/EmptyState'
import { Skeleton } from '@shared/ui'

const SIDEBAR_W = 280

export function AITutorPage() {
  const activeId = useChatStore((s) => s.activeId)
  const draft = useChatStore((s) => s.draft)
  const setDraft = useChatStore((s) => s.setDraft)

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
          px={{ base: '20px', md: '24px' }}
          h="56px"
          borderBottom="1px solid"
          borderColor={{ base: '#E0E0E0', _dark: 'border.subtle' }}
          flexShrink={0}
        >
          <Heading as="h1" fontSize="md" fontWeight="semibold" letterSpacing="tight" truncate>
            {active ? active.title : 'AI Tutor'}
          </Heading>
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
    </Flex>
  )
}
